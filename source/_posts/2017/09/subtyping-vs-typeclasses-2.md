---
title: Subtyping vs Typeclasses（二）
author: Yison
tags: 
- 类型相关
- Typeclass
description: 本文我们将介绍 Type Classes，类似上一篇文章提及的 Subtyping ，这也是一种实现多态的技术，然而却更灵活。
date: 2017-09-20
---

本文我们将介绍 Type Classes，类似 [上一篇文章](https://scala.cool/2017/08/subtyping-vs-typeclasses/) 提及的 Subtyping ，这也是一种实现多态的技术，然而却更灵活。

## 什么是 Type Classes

Type Classes 是发源于 Haskell 的一个概念。顾名思义，不少人把它理解成 「class of types」，这其实并不科学。事实上，Haskell 并没有类似 Java 中的 class 的概念，一个更准确的理解，可以是「**constructor class**」 — 本质上它区别于单态，但也不是多态，而是提供一个介于两者之间的过渡机制。

让我们看看 [《Learn You a Haskell for Great Good! 》](http://learnyouahaskell.com/introduction) 中对 Type classes 的相关描述：

> A typeclass is a sort of interface that defines some behavior. If a type is a part of a typeclass, that means that it supports and implements the behavior the typeclass describes. 

简单理解，我们可以基于一个 type class 创造不同的类型，来实现多态的需求。

接下来我们将通过具体的例子来进一步认识 type classes，目前，你可能仍然不明白，但你可以把它想象为类似于 Java 中的 Interfaces，虽然这也不准确。

## 


