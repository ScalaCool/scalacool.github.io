---
title: Scala 中的集合（三）：实现一个新的 Collection 类
author: Yison
tags:
- 集合
description: Scala 中的 collection 库是奉行 DRY 原则的典范，它包含了大量通用的集合操作 API，由此我们可以基于标准库，轻松构建出一个新的强大的集合类型。
date: 2017-08-01
---

Scala 中的 collection 库是奉行 [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) 原则的典范，它包含了大量通用的集合操作 API，由此我们可以基于标准库，轻松构建出一个强大的新集合类型。

本文将介绍「如何实现一个新集合类」，但在开始之前，我们先来了解下 Scala 2.8 版本后的集合结构设计。

## 集合通用操作

看过 [Scala 中的集合（一）](http://localhost:4000/2017/03/how-to-handle-collection-in-scala-1/) 的朋友已经知道，Scala 的集合类系统地区分了可变的和不可变的集合，它们存在于以下三个包中：

- scala.collection
- scala.collection.mutable
- scala.collection.immutable

然而，以上所有的集合都继承了两个相同的特质 — `Traversable` 和 `Iterable`（后者继承了前者）。


