---
title: Postgres/MySQL Async （一）：特性
author: Jilen
tags:
- Network, Database
description: 异步数据库驱动存在的意义
date: 2017-04-06
---

[Postgres Async](https://github.com/mauricio/postgresql-async) 是一个 Scala 编写的，基于 [Netty](https://netty.io) 实现的非阻塞异步数据库驱动。

> 设计目标

该项目官网指出设计目标如下

+ 快，更快
+ 低内存开销
+ 尽量避免内存拷贝（也是为了更快，更节约内存）
+ 易于使用，调用方法，返回 `Future`
+ 从不阻塞
+ 所有功能都被测试覆盖
+ 很小的依赖

本文将从几个方面来剖析这些目标实现得如何

## 非阻塞

### 网络 IO

该项目使用 Netty 的 NIO 来实现网络通信，在网络 IO 这一点上确实是非阻塞的。Codec 实现过程也没用使用 `synchronized` 和 `Lock`

### 连接池


![Postgres Async Pool](/images/2017/04/postgres-async-pool.png)

项目还提供一个连接池，采用分区设计，一个 `PartitionedAsyncObjectPool` 包含多个 `SingleThreadedAsyncObjectPool` 。

> `PartitionedAsyncObjectPool`

流程十分简单，根据线程的 id 选择 `SingleThreadedAsyncObjectPool`，然后从中获取数据库链接。不存在**阻塞**的可能
