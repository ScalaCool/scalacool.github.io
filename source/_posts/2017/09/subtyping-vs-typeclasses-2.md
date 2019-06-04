---
title: Subtyping vs Typeclasses（二）
author: Yison
tags: 
- 类型相关
- Typeclass
- Java
- ~Subtyping vs Typeclasses
- ^Yison
description: 本文我们将介绍 Type Classes，类似上一篇文章提及的 Subtyping ，这也是一种实现多态的技术，然而却更灵活。
date: 2017-09-18
---

本文我们将介绍 Type Classes，类似 [上一篇文章](https://scala.cool/2017/08/subtyping-vs-typeclasses/) 提及的 Subtyping ，这也是一种实现多态的技术，然而却更灵活。

## 什么是 Type Classes

Type Classes 是发源于 Haskell 的一个概念。顾名思义，不少人把它理解成 「class of types」，这其实并不科学。事实上，Haskell 并没有类似 Java 中的 class 的概念，一个更准确的理解，可以是「**constructor class**」 — 本质上它区别于单态，但也不是多态，而是提供一个介于两者之间的过渡机制。

让我们看看 [《Learn You a Haskell for Great Good! 》](http://learnyouahaskell.com/introduction) 中对 Type classes 的相关描述：

> A typeclass is a sort of interface that defines some behavior. If a type is a part of a typeclass, that means that it supports and implements the behavior the typeclass describes. 

简单理解，我们可以基于一个 type class 创造不同的类型，来实现多态的需求。

接下来我们将通过具体的例子来进一步认识 type classes，目前，你可能仍然不明白，但你可以把它想象为类似于 Java 中的 Interfaces，虽然这也不准确。

## 排序问题

想象我们现在要为某两款 Moba 游戏（G1 和 G2）写段程序，支持在有限的玩家中筛选出 MVP 选手。

假设两游戏在评价 MVP 中对 KDA 中的助攻指标权重不同， 公式如下：
> MVP (G1) = (人头数 + 助攻数 x 0.8) / 死亡数
> MVP (G2) = (人头数 + 助攻数 x 0.6) / 死亡数

```scala
case class Player1(kill: Int, death: Int, assist: Int) = {
  def score = (kill + assist * 0.8) / death
}
case class Player2(kill: Int, death: Int, assist: Int) = {
  def score = (kill + assist * 0.6) / death
}
```

有经验的朋友很快发现这其实是一个排序问题，又熟悉 Java 的朋友自然联想到了 `Comparable` 和 `Comparator` 接口。

### Comparable 方案

我们先来看下 `Comparable` 接口的定义：
```java
public interface Comparable<T> {
  int compareTo(T o)
}
```

非常简单，内部只定义一个 `compareTo` 方法，实现接口的类可以自定义该方法的实现，由此对具体的类型比较大小。

Scala 兼容 Java 的类库，所以我们可以这样实现：
```scala
case class Player1(kill: Int, death: Int, assist: Int) extends Comparable[Player1] = {
  def score = (kill + assist * 0.8) / death
  // 覆写 compareTo
  override def compareTo(o: Player1): Int = java.lang.Long.compare(score, o.score)
}
case class Player2(kill: Int, death: Int, assist: Int) extends Comparable[Player2] = {
  def score = (kill + assist * 0.8) / death
  // 覆写 compareTo
  override def compareTo(o: Player2): Int = java.lang.Long.compare(score, o.score)
}
```

在 Java 中，这是对排序问题很标准的一种处理方式，它的优点显而易见 — 只需定义一次，则可以在任何有 `PlayerX` 的地方进行 compare。然而它的缺点也同样明显，如果我想要在不同的地方对 `PlayerX` 采用其它的排序算法，那么就有点捉襟见肘了。

此外，该种方式还有个较大的问题，它并不是「类型安全」的，需要额外的处理，类似的原因我们会在后续的文章中作更深入的介绍。

### Comparator 方案

`Comparator` 相比 `Comparable` 要灵活一些，这其实是一种很常见的思路。我们先在 Scala 中如此实现：

```scala
val players = List(Player1(12, 3, 4), Player1(5, 9, 10), Player(2, 1, 4))
players.sortWith((p1, p2) => p1.score >= p2.score).head
```

显然它可以在调用处随意定义排序算法，然而却又增加了每次调用时定义算法的成本。

好吧，我们还是需要模拟一个 `Comparator` 接口：
```scala
trait Comparator[T] {
  def compare(first: T, second: T): Int
  def >=(first: T, second: T): Boolean = compare(first, second) >= 0
}

object G1 {
  def ordering(o: (Player1, Player1) => Int) = new Comparator[Player1] {
    def compare(first: Player1, second: Player1) = o(first, second)
  }
  val mvp =  ordering((p1: Player1, p2: Player1) => (p1.score - p2.score).toInt)
}

object G2 {
  def ordering(o: (Player2, Player2) => Int) = new Comparator[Player2] {
    def compare(first: Player2, second: Player2) = o(first, second)
  }
  val mvp =  ordering((p1: Player2, p2: Player2) => (p1.score - p2.score).toInt)
}
```

大功告成，我们对样板数据筛选 MVP:
```scala
def findMvp[T](list: List[T])(ordering: Comparator[T]): T = {
  list.reduce((a, b) => if (ordering >=(a, b)) a else b)
}

val players1 = List(Player1(12, 3, 4), Player1(5, 9, 10), Player(2, 1, 4))
findMvp(players1)(G1.mvp)

val players2 = List(Player1(12, 3, 4), Player1(5, 9, 10), Player(2, 1, 4))
findMvp(players2)(G2.mvp)
```

看起来不错，美中不足是每次调用 `findMvp` 时都必须显式地指定排序算法。

### Type Class 方案

Type Class 可以很好地解决以上的几个问题。在 Scala 中，类型系统其实并没有像 Haskell 一样内置 Type Class 原生特性，不过我们可以通过 `implicit` 来实现所谓的 Type Class Pattern，因此反而更加强大。

> 相比 Haskell，Scala 中的 Type Class Pattern 可以对不同的作用域采取选择性生效，可参见 [Scala Implicits : Type Classes Here I Come](http://debasishg.blogspot.co.id/2010/06/scala-implicits-type-classes-here-i.html)

首先，我们先来改造下 `findMvp`:

```scala
def findMvp[T](list: List[T])(implicit ordering: Comparator[T]): T = {
  list.reduce((a, b) => if (ordering >=(a, b)) a else b)
}
```

紧接着，再给我们的排序算法定义增加 `implicit`：

```scala
object G1 {
  def ordering(o: (Player1, Player1) => Int) = new Comparator[Player1] {
    def compare(first: Player1, second: Player1) = o(first, second)
  }
  implicit val mvp =  ordering((p1: Player1, p2: Player1) => (p1.score - p2.score).toInt)
}

object G2 {
  def ordering(o: (Player2, Player2) => Int) = new Comparator[Player2] {
    def compare(first: Player2, second: Player2) = o(first, second)
  }
  implicit val mvp =  ordering((p1: Player2, p2: Player2) => (p1.score - p2.score).toInt)
}
```

然后，我们就可以如此调用了：

```scala
import G1.mvp
import G2.mvp

val players1 = List(Player1(12, 3, 4), Player1(5, 9, 10), Player(2, 1, 4))
findMvp(players1)

val players2 = List(Player1(12, 3, 4), Player1(5, 9, 10), Player(2, 1, 4))
findMvp(players2)
```

如此神奇？由于定义了 `implicit ordering`，Scala 编译器会在 `Comparator[T]` 特质中自动寻找到相关的 ordering 。

Scala 中的 Type Class 就是如此的简单，也许你还是对 `findMvp` 的定义有点不适，好吧，我们可以利用 Context Bounds 来优化它。

### Context Bounds

这个名字看起来也有点怵，其实它无非只是一种语法糖而已。拿以上的例子来讲，`[T: Comparator]` 就是一个 context bound，它告诉编译器当 `findMvp` 被调用时，`Comparator[T]` 类型的一个 implict 值会存在作用域当中。之后我们就可以 `implicitly[Comparator[T]]` 来获取这个值。

因此，优化语法后的代码如下：

```scala
def findMvp[T:Comparator](list: List[T]): T = {
  list.reduce((a, b) => if (implicitly[Comparator[T]] >=(a, b)) a else b)
}
```

## 总结

通过以上的介绍，我们发现 Type Classes 是一种灵活且强大的技术，Scala 标准库以及其它很多知名的类库（如 Cats）都大量使用了这种模式。

它有点类似我们熟悉的 Interfaces（对应 Scala 中的 Trait），都可以通过名字、输入、输出，描述一系列相关的操作。然而，它们又显著地不同，在下一篇文章中，我们将对 Subtyping 和 Typeclasses 这两种技术做进一步的分析比较。

## 参考

- [Learn You a Haskell](http://learnyouahaskell.com/)
- [Type Classes in Scala](https://medium.com/@aarshkshah1992/type-classes-in-scala-d968d77bc711)
- [The order of things – Contracts and Typeclasses](http://frankraiser.de/wordpress/?p=162)
