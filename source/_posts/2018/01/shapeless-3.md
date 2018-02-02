---
title: Shapeless 入门指南（三）： Aux 和 Implicit 在 shapeless 中的应用
author: Jilen
tags:
- 类型相关
- Shapeless
- ~Shapeless 入门指南
- ^Jilen
description: 本文将介绍 shapeless 中 Nat 类型的应用
date: 2018-01-18
---

[前面文章](/2017/10/shapeless-2)中，我们提及了 peano 数类型 `Nat`，展示了**隐式转换**这项 Scala 黑科技的应用。
本文我们通过 `HList` 的 `at` 方法来进一步说明 Nat 类型和隐式转换在 shapeless 中的广泛应用

# HList 的 at 操作

[前文](/2017/09/shapeless-1)中提到： `HList` 可以看成是一个有各种类型连接而成的 `List`，如

```scala
type Foo = Int :: String :: Boolean :: HNil
val foo: Foo = 1 :: a :: true :: HNil
```


`HList` 有一个 `at` 函数

```scala
scala> foo.at(0)
res4: Int = 1

scala> foo.at(1)
res5: String = a

scala> foo.at(2)
res6: Boolean = true

scala> foo.at(3)
<console>:16: error: Implicit not found: shapeless.Ops.At[shapeless.::[Int,shapeless.::[String,shapeless.::[Boolean,shapeless.HNil]]], shapeless.Succ[shapeless.Succ[shapeless.Succ[shapeless._0]]]]. You requested to access an element at the position shapeless.Succ[shapeless.Succ[shapeless.Succ[shapeless._0]]], but the HList shapeless.::[Int,shapeless.::[String,shapeless.::[Boolean,shapeless.HNil]]] is too short.
       foo(3)

```

可以看到这个方法，能返回正确的类型而不是 `Any`，并且能在编译时做越界检查。

该如何实现这样的`at`方法？

```scala
def at(n: Int): X
```


用类型参数实现？

```scala
def at[A](n: Int): A
```

即使如此调用时，仍旧需要手工指定 `A` 的类型。
但不用类型参数的前提下，一个方法只能返回一种类型

### 实现基于 `Nat` 的 `at` 函数

现在我们先来实现一个基于 `Nat` 类型的 `at` 函数

```scala
 def at(n: Nat): X
```

为了实现这个函数，我们先介绍一个通用套路:

> 如果一个类型 O 由其他几个类型 I1, I2,.. In 决定

> 那么我们可以构造一个 X[I1, I2, .., In] { type Out = O} 这样的 typeclass 用来计算出 O 对应类型

受限于知识水平，我目前还没发现其背后的理论，只能作为 `Scala` 类型编程经验在此分享。

套用到上面的方法：HList 本身类型和元素所在位置 n，可以决定返回类型，我们可以得到以下定义

```scala

trait At[L <: HList, N <: Nat] {
  type Out
  def apply(l: L): Out
}

implicit class HListSyntax[L <: HList](l: L) {
    def at(n: Nat)(implicit at: Nat[L, n.N]): at.Out = at.apply(l)
}
```

![at](/images/2018/02/shapeless-at.png)

观察上图不难发现 `L` 第 `n + 1` 个元素类型，实际上是其 `Tail` 的第 `n` 个元素类型，即

```scala
// L = H :: L, Tail = L，则 At[]
implicit def atN[H, L <: HList, N <: Nat](implicit att: At[L, N]): At[H :: L, Succ[N]] = {
}
```
