title: Cats（二）：引用透明性和等式推理
author: Yison
tags: 
- Cats
- 函数式编程
description: 上一篇文章我们介绍了函数式编程的思维，本篇我们来探讨下函数式编程的魅力，所谓的引用透明性和等式推理。注意，这不是一个介绍概念的文章系列，所以笔者打算从 if 开始讲起。
date: 2017-12-22
---

[上一篇文章](https://scala.cool/2017/11/cats-1/) 介绍了函数式编程的思维，这一篇我们来了解下函数式编程的魅力。

我们已经说过，函数式编程最关键的事情就是在做「组合」。然而，这种可被组合的「函数式组件」到底是怎样的？换句话说，它们必定符合某些规律和原则。

当前我们已知晓的是，函数式编程是近似于数学中推理的过程。那么我们思考下，数学中的推理具备怎样的特点？

很快，我们便可以发现数学推理最大的一个优点 —「**只要逻辑正确，结果便千真万确**」。

其实，这也便是本篇文章要描述的函数式编程的一个很大的优势，所谓的「[等式推理](https://wiki.haskell.org/Equational_reasoning_examples)」。

那么，我们再进一步探讨，「是所谓怎样的原则和方法，才能使函数式编程具备如此特点？」。

## 引用透明性

答案便是 [引用透明性](https://en.wikipedia.org/wiki/Referential_transparency)，它在数学和计算机中都有近似的定义。

> An expression is said to be referentially transparent if it can be replaced with its corresponding value without changing the program's behavior. As a result, evaluating a referentially transparent function gives the same value for same arguments. Such functions are called pure functions.

简单地，我们可以理解为「**一个表达式在程序中可以被它等价的值替换，而不影响结果**」。如果一个函数的输入相同，对应的计算结果也相同，那么它就具备「引用透明性」，它可被称为「纯函数」。

如以下代码：

```scala

```

## 代换模型

```scala
def f1(x: Int, y: Int) = x
def f2(x: Int): Int = f2(x)
f1(1, f2(2))
```

用 Scala 开发的小伙伴看了相当气愤，这是一段自杀式的代码，如果我们执行了它，那么 `f2` 必然被不断调用，从而导致死循环。

这时，一个会 Haskell 的程序员路过，迷之微笑，花了 10 秒钟翻译成了以下的版本：

```haskell
f1 :: Int -> Int -> Int
f1 x y = x + y

f2 :: Int -> Int
f2 x = x
```

运行 `ghci` 载入函数后调用 `f1 1 (f2 2)`，你就会发现：纳尼！竟然成功返回了结果 1。这到底是怎么回事呢？

### 应用序 vs 正则序

也许相当多开发的同学至今未曾思考过这个问题：**编程语言中的表达式求值策略是怎样的？**

其实，编程语言中存在两种不同的代换模型：**应用序** 和 **正则序**。

大部分我们熟悉如 Scala、C、Java 是「应用序」语言，当要执行一个过程时，就会对过程参数进行求值，这也是上述 Scala 代码导致死循环的原因，当我们调用 `f1(1, f2(2))` 的时候，程序会先对 `f2(2)` 进行求值，从而不断地调用 `f2` 函数。

然而，Haskell 采用了不一样的逻辑，它会延迟对过程参数的求值，直到确实需要用到它的时候，才进行计算，这就是所谓的「正则序」，也就是我们常说的 [惰性求值](https://en.wikipedia.org/wiki/Lazy_evaluation)。当我们调用 `f1 1 (f2 2)` 后，由于 `f1` 的过程中压根不需要用到 `y`，所以它就不会对 `f2 2` 进行求值，直接返回 `x` 值，也就是 1。

> 注：对以上情况进行描述的角度，还有你可能知道的「传值调用」和「引用调用」。

你会发现，Haskell 的套路更加类似于数学里的函数。