---
title: Shapeless 入门指南（二）：自然数类型 Nat
author: Jilen
tags:
- 类型相关
- Shapeless
- ~Shapeless 入门指南
- ^Jilen
description: 本文将介绍一下 shapeless Nat 类型
date: 2017-10-16
---

[上一篇文章](/2017/09/shapeless-1/)介绍了 shapeless 的重要功能：自动派生 typeclass 实例。
本文将阐述一个看起来没什么作用，但实际上是 shapeless 关于泛型编程的重要基石： Nat （自然数）

## 皮亚诺公理(Peano axioms)

首先我们确定一下自然数只是一个符号系统，我们用 0，1，2，... 这些符号表示一些抽象的概念

[皮亚诺公理](https://zh.wikipedia.org/wiki/%E7%9A%AE%E4%BA%9A%E8%AF%BA%E5%85%AC%E7%90%86)告诉我们这个符号系统有三个组成元素

> + 一个初始元素（比如0） x
> + 一个集合 X
> + 一个 X 到自身的映射（后继关系） f

并且这个系统满足以下公理


> 1. x 属于 X (0是自然数)
> 2. x 不在 f 的值域内 (0 不是任何数的后继)
> 3. 如果 `f(a) = f(b)` 则 `a = b` (即 f 是一个单射)
> 4. 若 a 属于 X，则 f(a) 属于 X
> 5. 若 A 为 X 子集，并满足
  - x 属于 A, 且
  - 若 a 属于 A，则 f(a) 属于 A
  则 A = X

  基于上述公理就可以建立一阶算术系统

## Nat 类型与自然数对应关系

```scala
trait Nat {
  type N <: Nat
}

case class Succ[P <: Nat]() extends Nat {
  type N = Succ[P]
}

class _0 extends Nat with Serializable {
  type N = _0
}
```

很容易就可以总结出 Nat 类型和自然数的对应关系

+ X 为 所有 `Nat` 子类型
+ Succ（后继）为映射 `f`，注意一个类型构造器可以看作是一个映射
+ _0 为初始元素

Nat 与上述公理对应关系

+ 第 1 条，_0 是 Nat 子类型
+ 第 2 条，_0 显然不是任何类型的 Succ，scala 编译器的类型检查可以保证 Succ[P] 不等于 _0
+ 第 3 条，假设存在 A, B 满足 A != B 且 Succ[A] =　Succ[B]，同样编译器类型检查可以保证如果 A != B，则 Succ[A] != Succ[B]，即 Succ 是一个单射
+ 第 4 条，Succ 的定义直接指出如果 P 是 Nat，则 Succ 亦是 Nat
+ 第 5 条，A 就是 Nat 类型的定义，（这里形式化证明过于困难，暂不做证明）

## 加法定义
有了上述公理之后，可以建皮亚诺算术系统，我们以加法为例
加法定义为满足以下关系的映射

> 1. a + 0 = 0
> 2. a + Succ(b) = Succ(a + b)

在 shapeless 里，加法定义如下(Aux 类型的作用参考[此处](http://gigiigig.github.io/posts/2015/09/13/aux-pattern.html))

```scala

trait Sum[A <: Nat, B <: Nat] extends Serializable { type Out <: Nat }
object Sum {
    type Aux[A <: Nat, B <: Nat, C <: Nat] = Sum[A, B] { type Out = C }
    // 对应 1 处定义
    implicit def sum1[B <: Nat]: Aux[_0, B, B] = new Sum[_0, B] { type Out = B }
    // 此处定义与 2 处略有不同
    implicit def sum2[A <: Nat, B <: Nat, C <: Nat]
      (implicit sum : Sum.Aux[A, Succ[B], C]): Aux[Succ[A], B, C] =
      new Sum[Succ[A], B] { type Out = C }
}

```

这里第 2 条规则定义为 `Sum[A, Succ[B]].C = Sum[Succ[A] , B].C`，而加法的第二个规则则要求 `Sum[A, Succ[B]].C = Succ[Sum[A, B].C]`
shapeless 这里定义实际上可以推导出第 2 规则。

将上述类型转换成命题： a + S(b) =  S(a) + b => a + S(b) = S(a + b)

> 下面是证明过程 (S 为后继映射，即 Succ)

+ b = 0 时 `a + S(0) = S(a) + 0 = S(a) = S(a + 0)`
+ 假设 b = x 时, `a + S(x) = S(a + x)` 成立，则 b = S(x) 时 `a + S(S(x)) = S(a) + S(x) = S(S(a) + x) = S(a + S(x))`，可以得出对于 `b = S(x) ，a + S(b) = S(a + b)` 也成立
+ 上述两者归纳得出命题成立

现在来看看[如何使用](https://scalafiddle.io/sf/ceGYBDZ/1) `Sum` 来约束类型

```scala
object alias {
  type _1 = Succ[_0]
  type _2 = Succ[_1]
  type _3 = Succ[_2]
}

import alias._

def check[A <: Nat, B <: Nat](implicit sum: Sum.Aux[A, B, _3]) = {}

check[_0, _3]
check[_1, _2]
check[_2, _1]
check[_3, _0]
check[_1， _1] // 编译错误

```
上述 `check` 方法要求两个类型的 `Sum` 是 `_3`，可以看只有 `Sum` 是 `_3` 的 `A`，`B` 类型才能通过编译

## 总结

本文介绍了 shapeless 的重要基础类型 Nat，理解该类型是掌握 shapeless 其他类型的重要前提
