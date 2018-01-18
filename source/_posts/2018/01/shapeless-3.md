---
title: Shapeless 入门指南（三）： Nat 在 shapeless 中的应用
author: Jilen
tags:
- 类型相关
- Shapeless
- ~Shapeless 入门指南
- ^Jilen
description: 本文将介绍一下 shapeless Nat 类型的应用
date: 2018-01-18
---

[上一篇文章](/2017/10/shapeless-2/)介绍了基于 peano 公理的 shapeless 的 Nat 类型，本文将举例阐述 Nat 类型的实际应用

# HList 的神奇操作

我们已经简单了解过 `HList` 类型，可以看成是一个有各种类型连接而成的 `List`，如

```scala
type Foo = Int :: String :: Boolean :: HNil
val foo: Foo = 1 :: a :: true :: HNil
```

这没什么可稀奇，我们像[第一篇文章](/2017/09/shapeless-2/)中阐述的那样轻松定义出这种类型

现在来看看 `HList` 的 `apply` 方法

```scala
scala> foo(0)
res4: Int = 1

scala> foo(1)
res5: String = a

scala> foo(2)
res6: Boolean = true

scala> foo(3)
<console>:16: error: Implicit not found: shapeless.Ops.At[shapeless.::[Int,shapeless.::[String,shapeless.::[Boolean,shapeless.HNil]]], shapeless.Succ[shapeless.Succ[shapeless.Succ[shapeless._0]]]]. You requested to access an element at the position shapeless.Succ[shapeless.Succ[shapeless.Succ[shapeless._0]]], but the HList shapeless.::[Int,shapeless.::[String,shapeless.::[Boolean,shapeless.HNil]]] is too short.
       foo(3)

```

这个方法不仅能返回正确的类型，还能在编译时检不存在的元素索引。

该如何实现这样的`apply`方法？

```scala
def apply(n: Int): ???
```

这个方法针对不同的 `n` 能返回不同类型，而不是返回 `Any`。
