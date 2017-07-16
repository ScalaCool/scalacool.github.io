---
title: <译> Scala 类型的类型（六）
author: Yison
tags:
- 类型相关
- 翻译
description: 结构类型（Strucural Types）经常被描述为「类型安全的鸭子类型（duck typing）」，如果你想获得一个直观的理解，这是一个很好的比较。
date: 2017-07-21
---

## 上一篇

[Scala 类型的类型（五）](http://scala.cool/2017/07/scala-types-of-types-part-5/)

## 目录

- [26. 联合类型](#26-联合类型)
- [27. 延迟初始化](#27-延迟初始化)
- [28. 动态类型](#28-动态类型)
- [29. 参考条目及感谢](#29-参考条目)

## 26. 联合类型

> ❌ 本部分尚未完成，但你可以通过 Miles 的博客（下方有链接）获得更多了解 :-)

让我们开始来讨论这个类型，这次要借助下「集合论」，然后把我们已经学过的 `A with B` 当做一个「交集类型」。

为什么呢？因为只有同时带有类型 `A` 和类型 `B` 的对象才能符合这个类型，因此在集合论中，它将是一个交集。

这是两个集合的联合。我们的任务是使用 Scala 类型系统来引入这样的类型。虽然它们不是 Scala 中的第一等构造（不是内置的），我们也可以很容易地实现和使用它们。**Miles Sabin** 在博客中在 Scala 中通过「 Curry-Howard 同构」深入地解释了这一技术，如果你比较好奇，可以去看看。

```scala
type |∨|[T, U] = { type λ[X] = ¬¬[X] <:< (T ∨ U) }

def size[T : (Int |∨| String)#λ](t : T) = t match {
    case i : Int => i
    case s : String => s.length
}
```

## 27. 延迟初始化

## 29. 参考条目及感谢

自从我们开始讨论 Scala 中的「奇异类型」，我们就会安排专门的章节来介绍每一个类型。延迟初始化（Delayed Init）实际上只是一种编译器的技巧而已，它对类型系统而言并不是非常重要。但是一旦你理解了它，就会明白 `scala.App` 是如何运作的，所以看看下面的例子吧：

```scala
object Main extends App {
  println("Hello world!")
}
```

查看这段代码，根据我们已知的 Scala 基础知识，我们会下这样结论：「那么，`println` 是在 `Main` 类的构造函数中！」。这通常是对的，**但在这里却并不是这样的**，因为 `App` 继承了 `DelayedInit` 特质：

```scala
trait App extends DelayedInit {
  // code here ...
}
```

让我们来看看延迟初始化的特质的完整源代码：

```scala
trait DelayedInit {
  def delayedInit(x: => Unit): Unit
}
```

正如你所见，它并没有包含任何的实现 — 所有围绕它的工作实际上都是编译器执行的，它将以一种特殊的方式来对待「继承了 `DelayedInit`」的类和对象（注：特质不会像这样一样重写）。

特殊待遇是这样子的：
- xxx 
- xxx

```scala
// we write:
object Main extends DelayedInit {
  println("hello!")
}

// the compiler emits:
object Main extends DelayedInit {
  def delayedInit(x: => Unit = { println("Hello!") }) = // impl is left for us to fill in
}
```