---
title: Dive Into Kotlin（四）：为什么 Kotlin 的根类型是「Any?」
author: Prefert
tags:
- Kotlin
- Android
- ~Dive Into Kotlin
- ^Prefert
description: 在 Kotlin 中，如果说 Any 是所有非空类型的根类型，那么 Any? 才是所有类型的根类型。
date: 2018-12-19
---

我们在[Dive Into Kotlin（二）：Kotlin 类型结构设计](https://scala.cool/2017/11/kotlin-1/)中已经对Kotlin的类型系统进行过大致的介绍。

文中提到过： `Any` 类型是 Kotlin 中 **所有非空类型**（ex: `String`, `Int`) 的根类型。  

当我们需要和 Java 互操作的时候，Kotlin 把 Java 方法参数和返回类型中用到的 `Object` 类型看作 `Any`（更确切地说是当做「平台类型」)。当 Kotlin 函数中使用 `Any` 时，它会被编译成 Java 字节码中的 `Object`。

> **什么是平台类型?**
>
> 平台类型本质上就是 Kotlin 不知道可空性信息的类型—所有 Java 引用类型在 Kotlin 中都表现为平台类型。当在 Kotlin 中处理平台类型的值的时候，它既可以被当做可空类型来处理，也可以被当做非空类型来操作。  
>
> 平台类型的引入是 Kotlin 兼容 Java 时的一种权衡设计。试想下，如果所有来自 Java 的值都被看成非空，那么就容易写出比较危险的代码。反之，如果 Java 值都强制当做可空，则会导致大量的 `null` 检查。综合考量，平台类型是一种折中的设计方案。  

在 Java 中，`Object` 类型位于其类型系统的顶级。如果说 Kotlin 与 Java 是100%兼容的，那我们是否可以说 Any 也是Kotlin的所有类型的顶级类型呢？在上一篇文章中，这个问题同样困扰了我，官方也并没有做出一个明确的说明。但是我们可以注意到的是， Kotlin 中引入了「可空类型」这个概念，这很可能会对系统层级结构产生影响。

在探索根类型之前，先让我们理清两个概念：继承（`Inheriting`）和 子类型化（`Subtyping`）。

## 继承和子类型化的区别

这是一个看似容易实则不简单的问题：到底什么才是子类型化( `Subtyping` )？我们曾在[Subtyping vs Typeclasses（一）](https://scala.cool/2017/08/subtyping-vs-typeclasses/)这篇博客讨论过这个问题。如果你只有 Java 这门编程语言的开发经验，很容易陷入一个误区——继承关系决定父子类型关系。因为在 Java 中， 类与类型大部分情况下都是「等价」的（在 Java 泛型出现前）。

事实上，「继承」和「子类型化」是两个完全不同的概念。

- **子类型化**的核心是一种类型的替代关系（我们也可以称之为子类型多态），通常可表示为：

  ```
  S <: T
  ```

  以上 `S` 是 `T` 的子类，这意味着在需要 `T` 类型值的地方，`S` 类型的值同样适用，如在 Kotlin 中 `Int` 是 `Number` 的子类：

  ```kotlin
  fun printNum(num: Number) {
    println(num)
  }

  >>> val n: Int = 1
  >>> printNum(n)

  >>> 1
  >>> printNum("I am a String")
  error: type mismatch: inferred type is String but Number was expected
  ```

- 相对而言，**继承**强调的是一种「实现上的复用」，而子类型化是一种类型语义的关系，与实现没关系。在 Java 中，我们似乎也可以通过类继承来实现上述关系：
    ```Java
    class S extends class T
    ```

    由于在声明父子类型关系的同时，也声明了继承的关系，所以通常会造成了某种程度上的混淆，但是这并不能说明这两个概念就是等价的。   

虽然 `Any` 与 `Any?` 看起来没有继承关系，然而当我们在需要用 `Any?` 类型值的地方，显然可以传入一个类型为 `Any` 的值，这在编译上不会产生问题。反之却行不通，比如：一个参数类型为 `Any ` 的函数，我们传入符合 `Any?` 类型的 `null` 值，就会出现如下的错误:

```kotlin
error: null can not be a value of a non-null type Any
```

以上，我们也可以初步得出结论：`Any`的值能在所有情况下代替 `Any?` 的值，这符合「子类型化」的概念。

因此，我们可以很大胆地说：**在Kotlin的类型系统中，`Any?` 是 `Any` 的父类型，而且是所有类型的根类型**，虽然当前的 Kotlin 官网文档没有介绍过这一点。  

## Any? 与 Any??

一个你可能会挑战的问题是，如果 `Any?` 是 `Any` 的父类型，那么 `Any??` 是否又是 `Any?` 的父类型， 如果成立，那么是否意味着就没有所谓的「所有类型的根类型」了?

其实，Kotlin 中的可空类型可以看做所谓的 `Union Type`，在程序中通常用 `A | B` 表示，近似于数学中的并集。如果用类型的并集来表示 `Any?` ，可写为 `Any ∪ Null`。相应的 `Any??` 就表示为 `Any ∪ Null ∪ Null`，这等价于 `Any ∪ Null`， 即 `Any??` 等价于 `Any?` 。因此，说 `Any?` 是所有类型的根类型是没有问题的。
