---
title: Cats（四）：Typeclass
author: Yison
tags: 
- Cats
- 函数式编程
- Typeclass
- ~Cats
- ^Yison
description: 在上一篇介绍高阶类型的文章中，我们引出了 Typeclass 这个概念，本文将更加详细地认识它，并介绍如何使用 Cats 中的 Typeclass。
date: 2019-05-25
---

在[上一篇](/2018/11/cats-3/)介绍高阶类型的文章中，我们引出了 Typeclass 这个概念，并且演示了如何在 Kotlin 中模拟高阶类型，以及实现了一个 Kotlin 版本的 Functor。

如果你只是一个 Kotlin 开发者，相信你很难说服自己用这种方式进行程序设计。的确，在缺少高阶类型这种语言特性的支持下，构建 Typeclass 不是一种很自然的事情，回归到 Scala 和 Cats，我们可以庆幸没有这种烦恼。

## 认识 Typeclass

我们曾在[《Subtyping vs Typeclasses》](/tags/Subtyping-vs-Typeclasses/)中具体介绍过 Typeclass，并且比较了它与熟悉的多态技术 Subtyping 之间的差异。你可能已经知晓，Typeclass 是始于 Haskell 的一种编程模式，它是一种有关[特设多态](http://localhost:4000/2017/08/subtyping-vs-typeclasses/#%E4%BA%8C%E3%80%81%E7%89%B9%E5%AE%9A%E5%A4%9A%E6%80%81)的技术，可以代替继承来对已存的类库扩展功能，并且无需改变源码。

简单来说，一个 Typeclass 模式，主要由三部分来组成：
- Typeclass 本身，通常至少是包含一个类型变量的 Trait
- 实现了该 Typeclass 的一个实例
- 一个封装了 Typeclass 实例的方法，供外部调用

尽管你可能已经知道了什么是 Typeclass，我们还是再通过一个例子来介绍如何定义一个 Typeclass。在之前介绍 Typeclass 的文章中我们实现了一个 `Comparable` 的Typeclass，现在来重新回顾下它。

### Typeclass Trait

```scala
trait Comparator[T] {
  def compare(first: T, second: T): Int
  def >=(first: T, second: T): Boolean = compare(first, second) >= 0
}
```

`Comparator` 包含了一个类型变量 T 来支持各种数据类型之间的比较，它可以是 Scala 标准库中的某个类型，也可以是我们自己定义的某种数据类型（当然前提是该类型拥有实现了 `Comparator` 的实例）。

### Typeclass Instances

我们来定义一个数据类型 `Player`，代表游戏玩家：
```scala
case class Player(kill: Int, death: Int, assist: Int) = {
  def score = (kill + assist * 0.8) / death
}
```

现在来定义 `Player` 基于 `Comparator` 的实例：

```scala
object PlayerInstances {
  def ordering(o: (Player, Player) => Int) = new Comparator[Player] {
    def compare(first: Player, second: Player) = o(first, second)
  }
  implicit val mvp = ordering(_.score - _.score)
}
```

我们发现在定义 `mvp` 的时候，前面带有了 `implicit` 关键字，这个非常重要，它使得我们后续可以隐式调用 `ordering` 方法。需要注意的是，由于我们这里实现的是一个基于排序的功能，所以额外定义了 `mvp` 来支持寻找一个 `Player` 列表中表现最优的对象。

在通常情况下，如果我们定义的是一个基于单个数据类型的操作（非数据间的操作），你往往会把 `implicit` 加在实例本身。比如[《Scala with Cats》](https://underscore.io/books/scala-with-cats/) 举了一个 Json 转化的例子：

```scala
trait JsonWriter[A] {
  def write(value: A): Json
}

object JsonWriterInstances {
  implicit val stringWriter: JsonWriter[String] = new JsonWriter[String] {
    def write(value: String): Json = JsString(value)
  }
}
```

### Typeclass Interfaces

在有了 Typeclass 实例之后，我们就可以对它进行封装，然后供外部调用。由于 Scala 存在 `implicit` 这种强大的语法，我们可以使用不同的风格来调用。首先来看看旧文中实现的方案：

```scala
object Players {
  def findMvp[T](list: List[T])(implicit ordering: Comparator[T]): T = {
    list.reduce((a, b) => if (ordering >=(a, b)) a else b)
  }
}
```

另一种使用了 Context Bounds 的写法是：

```scala
def findMvp[T:Comparator](list: List[T]): T = {
  list.reduce((a, b) => if (implicitly[Comparator[T]] >=(a, b)) a else b)
}
```


由于定义了 `implicit ordering`，Scala 编译器会在 `Comparator[T]` 中自动寻找到相关的 `ordering` 。于是我们就可以如此使用了:

```scala
import PlayerInstances.mvp

val players = List(Player1(12, 3, 4), Player1(5, 9, 10), Player(2, 1, 4))
Players.findMvp(players)
```

我们见识到了 Typeclass 的神奇运用，当然你可能并不是很喜欢 `Players.findMvp(players)` 这种语法，确实我们还可以对其进行改进。

现在来使用 `implicit` 实现另一种方案：

```scala
object PlayerSyntax {
  implicit class PlayerListOps[T](list: List[T]) {
    def mvp(implicit ordering: Comparator[T]): T = {
      list.reduce((a, b) => if (ordering >=(a, b)) a else b)
    }
  }
}
```

因此，我们就可以如下调用，可读性得到进一步的增强：

```scala
import PlayerInstances.mvp

val players = List(Player1(12, 3, 4), Player1(5, 9, 10), Player(2, 1, 4))
players.mvp
```

## 使用 Cats 的 Show

现在你应该比较熟悉 Typeclass 了。当然，关于 Typeclass 的话题还有很多，我们可以以后在其他话题中再对其进行探讨。接下来，你终于要跟 Cats 这个类库打交道了。第一步，我们就来看看如何使用 Cats 中很简单的一个 Typeclass — Show。

### 引入 Show

首先来看看 Cats 中 Show 的定义：

```Scala
package cats

trait Show[A] {
  def show(value: A): String
}
```

你可以很简单地看出，`Show` 支持具体类型来返回一个代表自身的字符串值。

### 自定义 Person 类
