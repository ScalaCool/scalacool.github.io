---
title: Scala 中的集合（四）：CanBuildFrom
author: Yison
tags:
- 集合
- Type class
description: 从上一篇文章看出， CanBuildFrom 在当前 Scala 集合库中扮演了最关键的角色。而它，也如引言所道，又是其中最具争议的语法。
date: 2017-08-10
---

> CanBuildFrom is probably the most infamous abstraction of the current collections. It is mainly criticised for making scary type signatures.

从 [上一篇文章](http://scala.cool/2017/07/a-new-collection/) 看出， `CanBuildFrom` 在当前 Scala 集合库中扮演了最关键的角色。而它，也如引言所道，又是其中最具争议的设计。

本文将详细介绍 `CanBuildFrom` 的特性，以及它到底解决了哪些问题，却又为何饱受诟病。


## map 的问题

`map` 是集合中最常用的操作方法之一，利用它我们可以做到：

```scala
List(1,2,3).map(_.toString) // 集合元素类型的转化，Int -> String
```






## 参考

- [SF Scala: Martin Odersky, Scala -- the Simple Parts](https://www.youtube.com/watch?v=ecekSCX3B4Q)
- [Trinulations of CanBuildFrom](https://www.scala-lang.org/blog/2017/05/30/tribulations-canbuildfrom.html)

