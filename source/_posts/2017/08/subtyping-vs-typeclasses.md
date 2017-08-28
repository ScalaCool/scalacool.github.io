---
title: Subtyping vs Typeclasses（一）
author: Yison
tags: 
- 类型相关
- Typeclass
description: 你肯定听说过「多态」，它是 Java 面向对象的特征之一。如 Java 的类继承，这是一个典型的多态例子。然而，多态的含义远不止此，我们将通过几篇文章来进一步介绍：什么是多态、实现多态的技术，以及不同技术的比较。
date: 2017-08-17
---

你肯定听说过「多态」，它是 Java 面向对象的特征之一。如 Java 的类继承，这是典型的多态例子。然而，多态的含义远不止此，我们将用几篇文章来介绍：**什么是多态**，以及重点对比实现多态的两种技术 — **Subtyping** 与 **Type Class**。

此外，我们也会探讨与之相关的某些概念，如 Inheritence、Structure Subtyping 等。

## 多态的类型

多态的单词 **polymorphism** 是希腊语 polys 与 morphē 组成，前者表示「很多」，后者表示「形态」。生物学中的「多态性」是指一个物种的同一种群中存在两种或多种明显不同的表型。在计算机科学中，对应地我们可以把它理解成：**一个泛化记号可以与不同的特殊行为相关联**。

根据以上的定义，我们可以将多态大致分为三种：

- 参数多态
- 特定多态
- 子类型多态

### 一、参数多态

顾名思义，参数多态就是把类型作为参数变量，在我们熟悉的面向对象程序设计中，这被叫做[泛型编程](https://zh.wikipedia.org/wiki/%E6%B3%9B%E5%9E%8B%E7%BC%96%E7%A8%8B)。如：

```scala
cala> def head[A](xs: List[A]): A = xs(0)
head: [A](xs: List[A])A

scala> head(1 :: 2 :: Nil)
res0: Int = 1

scala> case class Car(make: String)
defined class Car

scala> head(Car("Civic") :: Car("CR-V") :: Nil)
res1: Car = Car(Civic)

```

### 二、特定多态

特定多态（add hoc polymorphism）并不是像参数多态那样适用于无穷多的类型，而是针对特定问题的解决方案，如熟悉的重载、强制类型转换机制。在 Scala 中我们可以通过 implicit conversion 或 implicit parameters 来实现特定多态，它比 Haskell 中的 Type Class 更加强大，我们会在后面进一步介绍。

### 三、子类型多态

子类型多态也被描述为「动态多态」，因为它指的是在运行期（非编译期）判断所引用对象的实际类型，可以通过使用类继承和虚函数机制来实现。本科程序设计教学中，这被直接称为多态。

接下来，我们来重点了解下什么是子类型化（Subtyping）。

## Subtyping

### 定义
> In general, subtyping means the substitutability of values of an supertype by values of a subtype. 

可见，子类型化核心是一种「类型的替代性关系」，表示为：`S <: T`（其中 `S` 是 `T` 的子类）。在需要 `T` 类型的地方，`S` 类型同样兼容，如 `Integer` 是 `Number` 的子类：
```scala
scala> def f(a: Number) = print(a)
f: (a: Number)Unit

scala> f(1: Integer)
1

scala> f("a")
<console>:9: error: type mismatch
```

这不免让人想到 Java 中的类继承，`class A extends class B` 可以实现上述的类型替代，因为在 Java 中，类与类型大部分情况下都是等价的（在 Java 泛型出现前）。

所以，Inheritence（继承） 与 Subtyping 就是等价的吗？答案是否定的。

### Inheritence

先来看下什么是 Inheriting：
> Inheritance refers to reuse of implementations. A type B inherits from another type A if some functions for B are written in terms of functions of A.

原来 Inheritence 与 Subtyping 是完全不同的概念。前者强调「实现的复用」，而后者只是类型语义上的关系，与实现压根没关系。

可以说，部分语言如 Java，由于在声明 subtyping 关系同时也声明了 inheritence 关系，所以造成了我们这种混淆。然而，在一些其它支持 structural subtyping （如 OCaml）中，两则的差异会非常明显。Scala 兼具了以上两者，所以我们可以通过 Scala 中的结构类型来了解后者。

### Structural Subtyping

Scala 中的结构类型（Stuctural Types）经常被描述为「类型安全的鸭子类型（[duck typing](https://en.wikipedia.org/wiki/Duck_typing)）」。

> 你可以通过阅读 [<译> Scala 类型的类型（五）](https://scala.cool/2017/07/scala-types-of-types-part-5/#21-结构类型) 来认识结构类型。

简单来说，Scala 提供了结构类型，如 `{def foo: Bar}` 来代表任何对象，它们包含了一个叫作 `foo` 并返回 `Bar` 类型的方法。在这里，它代表了一个类型，且完美符合了 Subtyping 的类型替代原则，然而它不是一个类，并没有所谓的继承关系。


## 总结
通过本篇的介绍我们明白了什么是多态，什么是 Subtyping，以及实现 Subtyping 的两种不同的方式。在下一篇，我们将介绍 Type Class，如开头所提到，这是另一种实现多态的重要技术。