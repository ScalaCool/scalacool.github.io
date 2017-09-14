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

# Hlist (Heterogenous lists) 和 Generic 对象

## Hlist
Shapeless 实现了 `HList`，不同于 Scala 标准库的 Tuple 的扁平结构，HList 是递归定义的，和标准库 List 类似。
HList 可以简单理解成每个元素类型可以不同 List

> 简化后的 HList

```scala
sealed trait HList
case object HNil extends HNil
case class ::[+H, +T <: HList](head : H, tail : T) extends HList
```

很容易看出 HList 可以对应到任意 case class，例如
```scala
case class Foo(a: Int, b: String, c: Boolean)
Int :: String :: Boolean :: HNil
```

而 shapeless 也提供了任意 case class 和 HList 之间的转换。

## Generic 对象

```scala
trait Generic[T] extends Serializable {
  def to(t : T) : Repr
  def from(r : Repr) : T
}

object Generic {
  type Aux[T, Repr0] = Generic[T] { type Repr = Repr0 }
  ...
}
```

Miles 设计这个对象不局限于 `case class`，只是很松散的定义 `T` 和 `Repr` 之间互相转换方法。
很多人可能疑惑这个方法为什么不设计成两个类型参数 `Generic[A, B]`，这实际上是为了使用 `Generic.Aux` 绕过编译器限制。
具体可以查看[此处](http://gigiigig.github.io/posts/2015/09/13/aux-pattern.html)

## case class 和 HList 互相转换

由于 HList 和 case class 可以一一对应，所以我们很容易想到
```scala
Generic.Aux[Foo, Int :: String :: Boolean :: HNil]
```
这样的 `Generic` 对象就可以实现 `Foo` 和 `Int :: String :: Boolean :: HNil` 之间的相互转换，而且 shapeless 会自动使用 macro 生成这样的 `Generic` 对象
