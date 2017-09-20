---
title: Subtyping vs Typeclasses（三）
author: Yison
tags: 
- 类型相关
- Typeclass
- Java
<<<<<<< HEAD
description: 
date: 2017-09-25
---

=======
- 翻译
description: 上一篇文章介绍了 Type Classes，但并没有深入分析它的优势。tpolecat 写了一篇文章很好地比较了 Subtyping 和 Typeclasses ，本文进行了翻译。
date: 2017-09-25
---

[上一篇文章](https://scala.cool/2017/09/subtyping-vs-typeclasses-2/)介绍了 Type Classes，但并没有深入分析它的优势。tpolecat 写了一篇文章很好地比较了 Subtyping 和 Typeclasses ，本文进行了翻译。

## 原文链接

[Returning the "Current" Type in Scala](https://tpolecat.github.io/2015/04/29/f-bounds.html)

## 翻译

`#scala` 的 IRC channel 经常讨论一个问题：

> I have a type hierarchy … how do I declare a supertype method that returns the “current” type?
>>>>>>> master
