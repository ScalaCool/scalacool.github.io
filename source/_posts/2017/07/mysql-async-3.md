---
title: MySQL 异步驱动浅析 （三）：连接池改进方案
author: Jilen
tags:
- 网络编程
- 数据库
- ~MySQL 异步驱动浅析
- ^Jilen
description: Mysql Async 连接池改进方案
date: 2017-07-20
---

[上一篇文章](/2017/05/mysql-async-2/)分析了 Mysql 异步驱动的一些缺点，大部分已经在我们[内部版本](https://github.com/dripower/postgresql-async)中修复了。

其中分区设计的链接池在实际使用过程中会产生一些非常严重的问题。

## 连接池中的锁阻塞

![Mysql Async Pool](/images/2017/04/postgres-async-pool.png)

[前文](/2017/05/mysql-async-2/)中曾经提到 `SingleThreadedAsyncObjectPool` 这个单线程的连接池实现并不是完全非阻塞的，再多个线程请求链接情况下仍旧会产生锁阻塞。
同时文章中也提到 Play!Framework 这样的框架主线程数可以非常少，所以不用过分担忧。

事实证明这是错误的，因为 `PartitionedAsyncObjectPool` 默认使用了 `Executors.newCachedThreadPool`， 这就导致不论主线程数多少，高并发情况下会创建大量线程同时去获取链接。
而 `SingleThreadedAsyncObjectPool` 使用了 `Executors.newFixedThreadPool`，显然这意味着每次入队都会产生一个锁阻塞，在系统并发非常高的情况下，这会极大加剧锁竞争，一旦获得锁线程被中断，则所有的线程都会处于

## 频繁的线程切换

驱动中默认情况下，存在多个 `ExecutionContext`，凭空增加了内存消耗和上下文切换

## 难以定位的内存泄漏

在实际使用过程中，我们经历了运行一段时间后 JVM 疯狂 FGC 的情况。
经分析发现存在链接泄漏，连接池存在大量未被回收的 `MySQLConnection` 对象，并且非常诡异的是我们无法定位到底是谁持有了这些未释放的 Connection。

考虑到上述问题，我开始着手设计一个全新的链接池，名字就叫 `NewPool`

## 设计一个完全无锁无阻塞的连接池

这种全新连接池实现主要依赖以下设计

+ 使用两个 `ConcurrentLinkedQueue` 保存等待列表和空闲链接，全程不存在锁
+ 使用 `Semaphore` 保证连接数和队列长度不超过限制


主要代码如下（部分）
```scala
val conns: ConcurrentLinkedQueue[Future[Connection]] = ...
val queue: ConcurrentLinkedQueue[Promise[Connection]] = ...
val createSemaphore: Semaphore = ...
val queueSemaphore: Semaphore = ...

def withConnection[A](f: Connection => Future[A]): Future[A] = {
    val c = acquire()
    c.flatMap { cc =>
      f(cc).andThen { //此处可能需要 try catch 处理不按套路抛出异常的情况
        case _ => release(c)
      }
    }
  }

  private def acquire(): Future[Connection] = {
    val conn = conns.poll()
    if (conn != null) { //有空余链接，则返回这个链接
      reconnectIfDead(conn)
    } else if (createSemaphore.tryAcquire()) { //连接数少于最大链接数，创建一个
      createNew()
    } else if (queueSemaphore.tryAcquire()) { //队列未满，入队
      val p = Promise[Connection]
      enqueueTask(p)
      p.future
    } else { //返回队列已满
      Future.failed(QueueIsFull)
    }
  }


  private def release(c: Future[Connection]) = {
    val wait = queue.poll()
    if (wait == null) {
      conns.offer(c)
    } else {
      wait.completeWith(c)
      queueSemaphore.release()
    }
  }
```

`Semaphore` 的 trypAcquire 操作和 `ConcurrentLinkedQueue` 都不会产生锁，确实做到了 Lock-Free。


## 性能测试

为了验证上述猜测，我基于 [scalameter](https://scalameter.github.io/) 做了简单的性能测试。结果如下

### 简单查询（SELECT 1）

新的方案（图中蓝色线条）对非常简单的查询，仍旧有 100% 左右的性能提升

![select performance](/images/2017/07/select-performance.png)

### 简单事务（SELECT + UPDATE）

执行 SQL 如下
```scala
for {
  u <- c.sendQuery(s"SELECT * FROM user WHERE id = ${id}")
  r <- c.sendQuery(s"UPDATE user SET remain = remain + 100 WHERE id = ${id}")
} yield r
```
可以看到新方案（图中绿色线条）有非常大幅度提升
![transaction performance](/images/2017/07/transaction-performance.png)
