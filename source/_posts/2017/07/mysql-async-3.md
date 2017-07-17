---
title: MySQL 异步驱动浅析 （三）：连接池改进方案
author: Jilen
tags:
- 网络编程
- 数据库
description: Mysql Async 异步驱动存在的缺点分析
date: 2017-07-17
---

[上一篇文章](/2017/05/mysql-async-2/)分析了 Mysql 异步驱动的一些缺点，大部分已经在我们[内部版本](https://github.com/dripower/postgresql-async)中修复了。

其中分区设计的链接池在实际使用过程中会产生一些非常严重的问题。

## 连接池中的锁阻塞

![Mysql Async Pool](/images/2017/04/postgres-async-pool.png)

[前文](/2017/05/mysql-async-2/)中曾经提到 `SingleThreadedAsyncObjectPool` 这个单线程的连接池实现并不是完全非阻塞的，再多个线程请求链接情况下仍旧会产生锁阻塞。
同时文章中也提到 Play!Framework 这样的框架主线程数可以非常少，所以不用过分担忧。

事实证明这时错误的，因为 `PartitionedAsyncObjectPool` 使用了 `Executors.newCachedThreadPool`， 这就导致不论主线程数多少，高并发情况下会创建大量线程同时去获取链接。
而 `SingleThreadedAsyncObjectPool` 使用了 `Executors.newFixedThreadPool`，显然这意味着每次入队都会产生一个锁阻塞，在系统并发非常高的情况下，这会极大加剧锁竞争

## 频繁的线程切换

驱动中默认情况下，存在多个 `ExecutionContext`，凭空增加了内存消耗和上下文切换

## 难以定位的内存泄漏

在实际使用过程中，我们经历了运行一段时间后 JVM 疯狂 FGC 的情况。
经分析发现存在链接泄漏，连接池存在大量被回收的 `MySQLConnection` 对象，并且非常诡异的我们无法定位到底是谁持有了这些未释放的 Connection。

考虑到上述问题，我开始着手设计一个全新的链接池，名字就叫 `NewPool`

## 设计一个完全无锁无阻塞的连接池

这种全新连接池实现主要依赖以下设计

+ 使用两个 `ConcurrentLinkedQueue` 保存等待列表和空闲链接，全程不存在锁
+ 使用 `Semaphore` 保证连接数和队列长度不超过限制
+ 获取链接时如果有空闲链接则立即返回，没有创建 `Promise` 则加入一个等待队列
+ 执行异步结束后立即查看队列是否为空，否则立即使第一个 `Promise` 返回
+ 使用一个定时调度器清理超时等待的 `Promise`。

上述设计相比原始连接池拥有以下优点

+ 大幅度减少了线程切换，不需要经过多个线程池，有时甚至直接可以获得链接。
+ 实现大幅度简化，提升可靠性，完全杜绝了内存泄漏的可能

主要流程如下图
![新连接池](/images/2017/07/async-new-pool.png)

```scala
def withConnection[A](f: Connection => Future[A]): Future[A] = {
    val now = System.currentTimeMillis
    val last = lastReportTime.get()
    if ((now - last) > 3000 && lastReportTime.compareAndSet(last, now)) {
      logger.info(s"[NewPool-stat] active: ${allActive.size}, queue: ${queue.size} - ${queueSemaphore.availablePermits()}, free: ${conns.size} - ${createSemaphore.availablePermits()}")
    }
    val c = acquire()
    c.flatMap { cc =>
      f(cc).andThen {
        case _ => release(c)
      }
    }
  }

  private def acquire(): Future[Connection] = {
    val conn = conns.poll()
    if (conn != null) {
      reconnectIfDead(conn)
    } else if (createSemaphore.tryAcquire()) {
      logger.debug(s"Creating new connection")
      createNew()
    } else if (queueSemaphore.tryAcquire()) {
      val p = Promise[Connection]
      queue.offer(p)
      val to = timer.newTimeout(new TimerTask {
        def run(out: Timeout): Unit = {
          if (p.tryFailure(WaitTimeout)) {
            queue.remove(p)
            queueSemaphore.release()
          }
        }
      }, waitTimeout, TimeUnit.SECONDS)
      p.future.andThen {
        case Success(v) =>
          to.cancel()
      }
    } else {
      Future.failed(QueueIsFull)
    }
  }

  private def reconnectIfDead(c: Future[Connection]): Future[Connection] = {
    c.flatMap {
      case cc if cc.isConnected => c
      case cc =>
        cc.disconnect
        allActive.remove(c)
        createNew()
    }
  }

  private def createNew() = {
    logger.info(s"Creating new connection ${configuration.host}:${configuration.port}")
    val c = factory(configuration).connect.flatMap(cc => cc.sendQuery("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED").map(_ => cc))
    allActive.add(c)
    c
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
