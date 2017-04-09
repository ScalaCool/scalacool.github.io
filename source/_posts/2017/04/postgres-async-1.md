---
title: Postgres/MySQL Async （一）：特性
author: Jilen
tags:
- Network, Database
description: 异步数据库驱动存在的意义
date: 2017-04-06
---

[Postgres Async](https://github.com/mauricio/postgresql-async) 是一个 Scala 编写的，基于 [Netty](https://netty.io) 实现的非阻塞异步数据库驱动。

##  设计目标

项目官网设计目标如下

+ 快、快、更快
+ 低内存开销
+ 尽量避免内存拷贝（也是为了更快，更节约内存）
+ 易于使用，调用方法，返回 `Future`
+ 从不阻塞
+ 所有功能都被测试覆盖
+ 很小的依赖

可以看出作者是希望通过异步非阻塞能让驱动更快（注意此处我们不讨论是真・异步或者伪异步）。
接下来本文将从理论上分析与传统的 `mysql-connector/j` 相比究竟是不是更快，快在哪里。

## 网络 IO


### 网络 IO

该项目使用 Netty 的 NIO 来实现网络通信，在网络 IO 这一点上确实是非阻塞的。Codec 实现过程也没用使用 `synchronized` 和 `Lock`。
默认情况下线程数为 CPU 和数两倍

### `mysql-connector/j` 的 IO

`mysql-connector/j` 使用的还是 Blocking IO ，这要求处理请求时必需有足够多的线程，否则吞吐量将受很大限制。例如 `Tomcat7` 默认就使用了 200 线程。

## 连接池

### PostgresAsync 的链接池


![Postgres Async Pool](/images/2017/04/postgres-async-pool.png)

项目还提供一个连接池，采用分区设计，一个 `PartitionedAsyncObjectPool` 包含多个 `SingleThreadedAsyncObjectPool` 。

> `PartitionedAsyncObjectPool`

流程十分简单，根据线程的 id 选择 `SingleThreadedAsyncObjectPool`，然后从中获取数据库链接。不存在**阻塞**的可能

> SingleThreadedAsyncObjectPool

顾名思义，这是一个单线程的对象池。当请求获取链接时，如果有多余链接则直接返回，如果没有则加入队列，等待有链接通过 `giveBack` 方法释放时返回给队列里的某个请求。
这里用了 Scala 的 `Future` 和 `Promise` 实现，也不存在阻塞的情况。

然而此处使用只有一个线程的 `ThreadPoolExecutor` 来确保同一时间只有一个线程请求链接。

```scala

  // SingleThreadedAsyncObjectPool.scala
  private def checkout(promise: Promise[T]) {
    this.mainPool.action {
      if (this.isFull) {
        this.enqueuePromise(promise)
      } else {
        this.createOrReturnItem(promise)
      }
    }
  }

  ...

  // Worker.scala
  def action(f: => Unit) {
    this.executionContext.execute(new Runnable {
      def run() {
        try {
          f
        } catch {
          case e : Exception => {
            log.error("Failed to execute task %s".format(f), e)
          }
        }
      }
    })
  }

```

此处的 `action` 方法最终调用了 `TreadPoolExecutor.execute`，而显然 `TreadPoolExecutor.execute` 并不是完全非阻塞的。
这带来了一个问题：当多个线程同时要获取链接时，只有一个线程可以获得链接，其他线程全部处于 `blocked` 状态。
这在并发不高的时候不是什么问题，但在并发特别高时候则会大幅度降低性能，甚至直接导致程序失去响应。

### Hikaricp

[HikariCP](https://github.com/brettwooldridge/HikariCP) 也许是目前优化得最好 JDBC 连接池。
该项目 [Wiki](https://github.com/brettwooldridge/HikariCP/wiki) 中的几篇文章也值得一看。

我们无法从理论上直接得出何者性能更优的答案，后续将通过具体测试来估计何者更优。


## 结论

从前文网络 IO 角度看 PostgresAsync 作者希望通过减少了线程数达到：

+ 更小内存占用
+ 减少不必要等待，从而减少线程上下文切换

以上是定性分析得出结论，实际优化如何将通过性能测试来初步验证。
