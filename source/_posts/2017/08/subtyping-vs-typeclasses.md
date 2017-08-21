---
title: Subtyping vs Typeclasses（一）
author: Yison
tags: 
- 类型相关
- Typeclass
description: 你肯定听说过「多态」，它是 Java 面向对象的特征之一。如 Java 的类继承，这是一个典型的多态例子。然而，多态的含义远不止此，我们将通过三篇文章来进一步介绍：什么是多态、实现多态的技术，以及不同技术的比较。
date: 2017-08-17
---

你肯定听说过「多态」，它是 Java 面向对象的特征之一。如 Java 的类继承，这是典型的多态例子。然而，多态的含义远不止此，我们将用三篇文章来介绍：**什么是多态** 以及重点对比实现多态的两种技术 — **Subtyping** 与 **Type Class**。

此外，我们也会探讨与之相关的某些概念，如 Inheritence（继承）、Duck Typing（鸭子类型） 等。

## 多态的类型

> In programming languages and type theory, polymorphism is the provision of a single interface to entities of different types.

多态的单词 **polymorphism** 是希腊语 polys 与 morphē 组成，前者表示「很多」，后者表示「形态」。简单来说，多态就是**一种接口的操作可作用于多种不同类型实体，从而实现不同动作的能力**。

经验上，我们可以将多态分为以下三种：

- 参数多态
- 子类型多态
- 特定多态

### 一、参数多态

没错，这是我们最熟悉的多态类型之一，就是「同名函数可以根据参数类型或参数个数的不同而获得不同的实现」。

```scala
def f(a: Int) = {
  // todo
}
def f(a: String) = {
  // todo
}
def f(a: Int, b: String) = {
  // todo
}
```

### 二、子类型多态






