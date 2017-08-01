---
title: Scala 中的集合（四）：CanBuildFrom
author: Yison
tags:
- 集合
- Type class
description: 从上一篇文章看出， CanBuildFrom 在当前 Scala 集合库中扮演了最关键的角色。而它，也如引言所道，又是其中最具争议的语法。
date: 2017-08-01
---

> CanBuildFrom is probably the most infamous abstraction of the current collections. It is mainly criticised for making scary type signatures.

从 [上一篇文章](http://scala.cool/2017/07/a-new-collection/) 看出， `CanBuildFrom` 在当前 Scala 集合库中扮演了最关键的角色。而它，也如引言所道，又是其中最具争议的设计。

本文将详细介绍 `CanBuildFrom` 的特性，它为何饱受诟病，而又解决了哪些问题。


## map 的定义

以下是马丁在 [Scala -- the Simple Parts](https://www.youtube.com/watch?v=ecekSCX3B4Q) talk 中 PPT 的一页：

<center>
![type of map is ugly](/images/2017/08/type-of-map-is-ugly.png)
</center>

我们来看下 `map` 的类型到底有多丑？

```scala
def map[B, That](f: Elem => B)(implicit bf: CanBuildFrom[Repr, B, That]): That
```

如果你接触 Scala 不深，以上的 `implicit` 的确费解。其实它无非是在 Scala 中实现 [Type class](https://en.wikipedia.org/wiki/Type_class) 的一种方式，这里你可以简单理解为：**如此 `map` 就会在隐式范围中自动寻找关于 `bf` 对象的实现**。

为什么要采用这种方式呢？我们说过，`CanBuildFrom` 是极其强大的，以下是它解决的三大问题。

## 一、集合类型变换

`map` 最常见的操作，就是对集合中的元素进行转化，例如：

```scala
List(1, 2, 3).map(_.toString) // List[String] = List(1, 2, 3)
"foo".map(c => c.toUpper) // String = FOO
"foo".map(c => c.toInt) // scala.collection.immutable.IndexedSeq[Int] = Vector(102, 111, 111)
```

这里，一个 `String` 可被视为 `Char` 元素的集合，它如同其它集合一样，在被 `map` 之后，有两种情况：
- 类型不变，还是返回一个 `String`
- 类型变了，返回一个 `scala.collection.immutable.IndexedSeq[Int]`

这是 `CanBuildFrom` 要解决的第一个问题 — **对要 `map` 的集合进行「类型修改」**。

还记得 `CanBuildFrom` 的定义吗？

```scala
trait CanBuildFrom[-From, -Elem, +To] {
  // 创建一个新的构造器(builder)
  def apply(from: From): Builder[Elem, To]
}
```

复习下：**「有这么一个方法，由给定的 From 类型的集合，使用 Elem 类型，建立 To 类型的集合」**。


```scala
def map[B, That](f: Char => B)(implicit bf: CanBuildFrom[String, B, That]): That
```

我们把类型参数 `Elem` 替换成 `Char`，`From` 替换为 `String`，如此便实现了 `String` 类型的 `map` 操作。

## 二、不同的集合类型参数

我们知道，`Seq[A]`、`Set[A]` 继承了 `Iterable[A]`，三者有个相同点 — 都有一个类型参数。然而 `Map[K, V]` 是个特例，它也继承了 `Iterable[A]`，但却拥有两个。

这就带来了一个问题。如果 `List[A]` 继承了 `Iterable[A]` 中的 `map` ，需要一个返回类型 `List[B]`，然而对 `HashMap[K, V]` 操作，却期望返回 `HashMap[L, W]`，**这里的类型参数数量出现了不一致的情况**。 

`CanBuildFrom` 再一次化解了这个问题。

- 当 `Repr` 是 `List[_]` 时，`That` 变成了 `List[B]`
- 当 `Repr` 是 `HashMap[_, _]` 时，`B` 就是元祖 `(K, V)`，而 `That` 变成了 `HashMap[K, V]`。

## 三、有序集合的排序问题

思考有序集合之间的元素转换问题，比如 `TreeSet`。它们任何一次 `map`操作，都需要能够对元素进行排序，那么这种元素间的排序关系如何被定义呢？

同样是定义一个 `CanBuildFrom` 的隐式对象，它的类型为 `CanBuildFrom[TreeSet[_], X, TreeSet[X]]`。其中 `X` 代表集合元素的类型，于是我们就可以利用相同的技术，定义一个 `Ordering[X]` 隐式对象，它解释了如何对 `TreeSet` 的元素进行排序。

## Simple is not Easy

上面列举了 `CanBuildFrom` 的各种美好，然而它还是逃脱不了被新方案替代的命运。究其原因，也可以用马丁 talk 的另一页 PPT 解释，Simple != Easy 。相信这也是 Scala 在「学院」与「工业」之间做出的平衡选择。

<center>
![simple is not easy](/images/2017/08/simple-is-not-easy.jpg)
</center>

## 参考

- [SF Scala: Martin Odersky, Scala -- the Simple Parts](https://www.youtube.com/watch?v=ecekSCX3B4Q)
- [Trinulations of CanBuildFrom](https://www.scala-lang.org/blog/2017/05/30/tribulations-canbuildfrom.html)

