---
title: <译> Scala 类型的类型（六）
author: Yison
tags:
- 类型相关
- 翻译
description: 让我们开始来讨论这个类型，这次要借助下「集合论」，然后把我们已经学过的 A with B 当做一个「交集类型」。
date: 2017-07-22
---

## 上一篇

[Scala 类型的类型（五）](http://scala.cool/2017/07/scala-types-of-types-part-5/)

## 目录

- [26. 联合类型](#26-联合类型)
- [27. 延迟初始化](#27-延迟初始化)

## 26. 联合类型

> ❌ 本部分尚未完成，但你可以通过 Miles 的博客（下方有链接）获得更多了解 :-)

让我们开始来讨论这个类型，这次要借助下「集合论」，然后把我们已经学过的 `A with B` 当做一个「交集类型」。

为什么呢？因为只有同时带有类型 `A` 和类型 `B` 的对象才能符合这个类型，因此在集合论中，它将是一个交集。此外，我们思考下什么是「联合类型」。

这是两个集合的联合，逐集看每个元素的类型要么是 `A` 或者 `B`。我们的任务是使用 Scala 类型系统来引入这样的类型。虽然它们不是 Scala 中的第一等构造（不是内置的），我们也可以很容易地实现和使用它们。**Miles Sabin** 在博客中通过「 Curry-Howard 同构」深入地解释了这一技术，如果你比较好奇，可以去看看。

```scala
type |∨|[T, U] = { type λ[X] = ¬¬[X] <:< (T ∨ U) }

def size[T : (Int |∨| String)#λ](t : T) = t match {
    case i : Int => i
    case s : String => s.length
}
```

## 27. 延迟初始化

自从我们开始讨论 Scala 中一些不常见的类型，我们就会安排专门的章节来介绍每一个类型。延迟初始化（Delayed Init）实际上只是一种编译器的技巧而已，它对类型系统而言并不是非常重要。但是一旦你理解了它，就会明白 `scala.App` 是如何运作的，所以看看下面的例子吧：

```scala
object Main extends App {
  println("Hello world!")
}
```

查看这段代码，根据我们已知的 Scala 基础知识，会下这样结论：「那么，`println` 是在 `Main` 类的构造函数中！」。这通常是对的，**但在这里却并不是这样的**，因为 `App` 继承了 `DelayedInit` 特质：

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

正如你所见，它并没有包含任何的实现 — 所有围绕它的工作实际上都是编译器执行的，它将以一种特殊的方式来对待「继承了 `DelayedInit`」的类和单例（注：特质不会像这样一样重写）。

特殊待遇是这样子的：
- 假设你的类/单例主体是一个函数，处理主体中要做的所有事情
- 编译器为你创建了这个函数，并将它传递给了延迟初始化方法（x: => Unit），

我们马上来举个例子，手动来重新实现一遍 `App` 为我们自动做的事情（在 `delayedInit` 的帮助下）：

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

使用这种机制，你可以随时运行你的类的主体。我们已经了解了延迟初始化如何工作，接下来再来实现下我们自己版本的 `scala.App` 吧（这实际上也是以相同方式实现的）。

```scala

  override def delayedInit(body: => Unit) {
    initCode += (() => body)
  }

  def main(args: Array[String]) = {
    println("Whoa, I'm a SimpleApp!")

    for (proc <- initCode) proc()

    println("So long and thanks for all the fish!")
  }
}

                                // Running the bellow class would print print:
object Test extends SimpleApp { //
                                // Whoa, I'm a SimpleApp!
  println("  Hello World!")     //   Hello World!
                                // So long and thanks for all the fish!
}
```