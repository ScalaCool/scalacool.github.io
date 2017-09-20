---
title: Subtyping vs Typeclasses（三）
author: Yison
tags: 
- 类型相关
- Typeclass
- 翻译
description: 上一篇文章介绍了 Type Classes，但并没有深入分析它的优势。tpolecat 写了一篇文章很好地比较了 Subtyping 和 Typeclasses ，本文进行了翻译。文末则是该文章引发的一些探讨。
date: 2017-09-25
---

[上一篇文章](https://scala.cool/2017/09/subtyping-vs-typeclasses-2/)介绍了 Type Classes，但并没有深入分析它的优势。tpolecat 写了一篇文章很好地比较了 Subtyping 和 Typeclasses ，本文进行了翻译。

## 原文链接

[Returning the "Current" Type in Scala](https://tpolecat.github.io/2015/04/29/f-bounds.html)

## 翻译

`#scala` 的 IRC channel 经常讨论一个问题：

> I have a type hierarchy … how do I declare a supertype method that returns the “current” type?

这个问题的产生与 Scala 推崇不可变性有关，于是方法们经常要返回一个修改后的 `this` 的副本， 但要保证返回类型足够的精确又是棘手的，这便是本文要探讨的话题。

解决该问题最“标准的”方法（如 stdlib collections）就是使用一个 **F-bounded type**，它大多数是管用的，但却不能完全地强制约束（它实施了一些原则，也留了一些坑）。这里要赞赏下 [@nuttycom](https://twitter.com/nuttycom) 的工作，他探索了 [F-Bounded Type 方法存在哪些陷阱](http://logji.blogspot.co.id/2012/11/f-bounded-type-polymorphism-give-up-now.html)。

一个更好的方案是使用一个 **typeclass**，

## 延伸

- [A simpler way to returning the "current" type in Scala](https://gist.github.com/odersky/56323c309a186cffe9af)

- [https://twitter.com/odersky/status/594888877854302208](https://twitter.com/odersky/status/594888877854302208)