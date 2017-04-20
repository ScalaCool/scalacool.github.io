---
title: MySQL 异步驱动浅析 （一）：性能分析
author: Jilen
tags:
- 网络编程
- 数据库
description: 异步数据库驱动与传统 JDBC 驱动对比
date: 2017-04-21
---

[Mysql Async](https://github.com/mauricio/postgresql-async) 是一个 Scala 编写的，基于 [Netty](https://netty.io) 实现的非阻塞异步数据库驱动。在本系列文章中我们将逐步分析：

+ 与传统的 JDBC 驱动相比有何优势
+ Mysql Async 异步驱动存在什么问题，该如何优化

##  项目设计目标

项目官网设计目标如下

+ 快、快、更快
+ 低内存开销
+ 尽量避免内存拷贝（也是为了更快，更节约内存）
+ 易于使用，调用方法，返回 `Future`
+ 从不阻塞
+ 所有功能都被测试覆盖
+ 很小的依赖

可以看出作者是希望通过异步非阻塞能让驱动更快（注意此处我们不讨论是真・异步或者伪异步）。
接下来本文将具体分析与传统的 `mysql-connector/j` 相比究竟是不是更快，快在哪里。

## 网络 IO

### MysqlAsync 的 IO

+ 项目使用 Netty 的 NIO 来实现，在网络 IO 这一点上确实是非阻塞的。
+ 协议实现过程也没用使用 `synchronized` 和 `Lock`。
+ Netty 默认情况下线程数为 CPU 核数2倍

### Mysql JDBC 驱动 的 IO

`mysql-connector/j` 使用的还是 Blocking IO ，这要求处理请求时必需有足够多的线程，否则吞吐量将受很大限制。

例如同样基于 Blocking IO 的 `Tomcat7` 默认就配置了 200 线程。

## 连接池

### MysqlAsync 的链接池


![Mysql Async Pool](/images/2017/04/postgres-async-pool.png)

项目还提供一个连接池，采用分区设计，一个 `PartitionedAsyncObjectPool` 包含多个 `SingleThreadedAsyncObjectPool` 。

> `PartitionedAsyncObjectPool`

流程十分简单，根据线程的 id 选择 `SingleThreadedAsyncObjectPool`，然后从中获取数据库链接。不存在**阻塞**的可能

> SingleThreadedAsyncObjectPool

顾名思义，这是一个单线程的对象池。当请求获取链接时，如果有多余链接则直接返回，如果没有则加入队列，等待有链接通过 `giveBack` 方法释放时返回给队列里的某个请求。
这里用了 Scala 的 `Future` 和 `Promise` 实现，也不存在阻塞的情况。

[分析源代码后](https://github.com/mauricio/postgresql-async/blob/master/db-async-common/src/main/scala/com/github/mauricio/async/db/pool/SingleThreadedAsyncObjectPool.scala#L202)发现此处使用只有一个线程的 `ThreadPoolExecutor` 来确保同一时间只有一个线程请求链接。

```scala

  // Worker.scala
  def action(f: => Unit) {
    this.executionContext.execute(new Runnable {
      def run() {
        ...
      }
    })
  }

```


上述代码中`this.executionContext.execute` 最终会执行 `TreadPoolExecutor.execute`
而 `TreadPoolExecutor.execute` 并不是完全非阻塞的。

这带来了一个问题：当多个线程同时要获取链接时，只有一个线程可以获得链接，其他线程全部处于 `blocked` 状态。

由于是分区设计，并且 [Play](http://www.playframework.com)
这样的全异步框架主线程数默认非常少，所以这个问题在某些场合下并不严重。

### Hikaricp

[HikariCP](https://github.com/brettwooldridge/HikariCP) 也许是目前优化得最好 JDBC 连接池。
该项目 [Wiki](https://github.com/brettwooldridge/HikariCP/wiki) 中的几篇文章也值得一看。

我们无法从理论上直接得出何者性能更优的答案，后续将通过具体测试来估计何者更优。




## 性能测试

为了验证上述观点，我进行了简单的性能测试，主要测试了简单查询和事务两个方面。

> 简单查询

```sql
SELECT 1
```

> 事务

```sql
update user set remain = remain + ? where id = ?
update user set remain = remain - ? where id = ?
```


### 简单查询(1000qps)

> MysqlAsync (64链接，默认16线程)

![MysqlAsync-select](/images/2017/04/mysql-async-select.png)

> JDBC  (64链接，64线程)

![Hikaricp-select](/images/2017/04/hikaricp-select.png)

### 事务(1000tps，针对100条 user 记录)

> MysqlAsync (64链接，默认16线程)

![MysqlAsync-trans](/images/2017/04/mysql-async-trans.png)

> JDBC (64链接，64线程)

![MysqlAsync-trans](/images/2017/04/hikaricp-trans.png)

## 结论

+ 在查询非常简单，速度很快的情况下两者性能相当，`Mysql Async` 有微弱的优势。
+ 在并发竞争更新，并且存在事务情况下（数据库存在大量锁）:
 - 基于 Hikaricp 连接池的程序在一段时间后直接失去响应大量请求超时。
 - 基于 MysqlAsync 的程序仍旧在执行，大部分失败是因为事务中存在死锁或者系统繁忙。
+ 通过调整连接数和线程数，`hikaricp + mysql-connector/j` 方案也许可以提升性能，但这套方案的问题是你永远不知道多少线程和链接数才是足够的。


> 下表是结合上述测试和定性分析得出的结果

项目|MysqlAsync|HikariCP + mysql-connector/j
---|---|---
编程模型 | 异步 | 同步
网络IO | NIO | BIO
链接池 | 异步实现 | 同步实现
过载防护 | 通过调节队列长度实现 | 需要额外实现 （例如指定线程池任务队列长度）
可伸缩性 | 只需要设置合理连接数(例如几十个) | 需要测试最佳线程数和链接数
线程数 | 少 | 多

总得来说 MysqlAsync 通过减少了线程数确实达到了以下效果

+ 更小内存占用
+ 减少不必要等待，从而减少线程上下文切换
+ 不用反复调试线程数量和链接数量
