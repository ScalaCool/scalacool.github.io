---
title: MySQL 异步驱动浅析 （二）：缺点分析
author: Jilen
tags:
- 网络编程
- 数据库
description: Mysql Async 异步驱动存在的缺点分析
date: 2017-05-14
---

[上一篇文章](/2017/04/mysql-async-1/)分析 Mysql 异步驱动的性能。本文阐述 Mysql Async 使用时需要注意的问题

虽然 Mysql Async 性能出色，但使用过程中还是遇到了各种各样的问题

## 一、不会自动关闭 PreparedStatement

假如你的业务中存在很多中 statement，这可能会导致 `PreparedStatement` 数量不够。
通常可以通过以下方法解决：

+ 增加 mysql 服务端 `PreparedStatement` 数量设置
+ 另外还可以使用修改过的[版本](https://github.com/dripower/postgresql-async)（已发布到maven中心库）

## 二、执行事务时，所有语句必须串行

因为该驱动一个链接不能同时执行多个 SQL 语句（受限于MySQL协议）所以

```scala
conn.inTransaction { c =>
  val fa = c.sendQuery("xxx")
  val fb = c.sendQuery("yyy")
}
```

这样的代码就不能正确运行，必须改成如下串行或等价的形式

```scala
conn.inTransaction { c =>
  for {
   a <- c.sendQuery("xxx")
   b <- c.sendQuery("yyy")
  } yield (a, b)
}
```

## 三、不支持客户端 PreparedStatement

'Mysql-connector-java' 支持客户端 PreparedStatement，从而可以开启将多个插入重写为一个批量插入的功能（rewriteBatchedStatements）。
批量插入语句可以减少锁的次数，从而大幅大幅提升性能的，这在一些插入频繁场景（如 akka-persistence）非常有用。
要解决这个问题，只能手工生成 `批量插入语句`。


## 四、Netty 是不可配置的

Netty 相关的设置硬编码在实现里，无法自定义 `EventLoop` 也无法开启 Linux 平台 `native epoll` 支持（该选项可以进一步提升性能，减少 GC 压力）。
使用前文提到的版本里已经默认开启了 `native epoll` 支持。
