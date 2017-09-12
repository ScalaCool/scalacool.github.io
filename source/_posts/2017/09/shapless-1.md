---
title: Shapeless入门指南（一）：从 HList 到 case class
author: jilen
tags:
- 类型相关
description: 本文将介绍一下 shapeless 中 HList 和 case class 的互操作，并在此基础上阐述自动派生 typeclass 实例的功能。
date: 2017-09-011
---

[shapeless](https://github.com/milessabin/shapeless) 是一个类型相关的库，提供了很多有趣的功能。
本文介绍其中一个重要功能：自动派生 Type class 实例。

# Hlist (Heterogenous lists)

Shapeless 实现了 `HList`，不同于 Scala 标准库的 Tuple 的扁平结构，HList 是递归定义的，和标准库 List 类似。
HList 可以简单理解成每个元素类型可以不同 List

```scala
sealed trait HList
case object HNil extends HNil
case class ::[+H, +T <: HList](head : H, tail : T) extends HList
```

很容易看出 HList 可以对应到任意 case class，例如
```scala
case class Foo(a: Int, b: String, c: Boolean)
Int :: String :: Boolean
```

而 shapeless 也提供了任意 case class 和 HList 之间的转换。

# Generic 对象
