---
title: Subtyping vs Typeclasses（一）
author: Yison
tags: 
- 类型相关
- Typeclass
description: 你肯定听说过「多态」，它是 Java 面向对象的特征之一。如 Java 的类继承，这是一个典型的多态例子。然而，多态的含义远不止此，我们将通过三篇文章来进一步介绍：什么是多态、实现多态的技术，以及不同技术的比较。
date: 2017-08-17
---

你肯定听说过「多态」，它是 Java 面向对象的特征之一。如 Java 的类继承，这是典型的多态例子。然而，多态的含义远不止此，我们将用三篇文章来介绍：**什么是多态**，以及重点对比实现多态的两种技术 — **Subtyping** 与 **Type Class**。

此外，我们也会探讨与之相关的某些概念，如 Inheritence（继承）、Duck Typing（鸭子类型） 等。

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

子类型多态也被描述为「动态多态」，因为它指的是在运行期（非编译期）判断所引用对象的实际类型，通过使用类继承和虚函数机制来实现。本科程序设计教学中，这被直接称为多态。

接下来，我们来重点了解下什么是子类型化（Subtyping）。

## Subtyping




