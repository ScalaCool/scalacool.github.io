---
title: Scala 中的集合（三）：实现一个新的 Collection 类
author: Yison
tags:
- 集合
description: Scala 中的 collection 库符合 DRY 设计原则的典范，它包含了大量通用的集合操作 API，由此我们可以基于标准库，轻松构建出一个新的强大的集合类型。
date: 2017-07-29
---

Scala 中的 collection 库是符合 [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) 设计原则的典范，它包含了大量通用的集合操作 API，由此我们可以基于标准库，轻松构建出一个强大的新集合类型。

本文将介绍「如何实现一个新集合类」，在开始之前，我们先来了解下 Scala 2.8 版本后的集合结构设计。

## 集合通用设计

看过 [Scala 中的集合（一）](http://localhost:4000/2017/03/how-to-handle-collection-in-scala-1/) 的朋友已经知道，Scala 的集合类系统地区分了可变的和不可变的集合，它们存在于以下三个包中：

- scala.collection
- scala.collection.mutable
- scala.collection.immutable

然而，以上所有的集合都继承了两个相同的特质 — `Traversable` 和 `Iterable`（后者继承了前者）。

### Traversable

`Traversable` 是集合类最高级的特性，它具有一个抽象方法：

```scala
def foreach[U](f: Elem => U) 
```

顾名思义，`foreach` 方法用于遍历集合类的所有元素，然后进行指定的操作。`Iterable` 继承了 `Traversable`，也实现了 `foreach` 方法，继而所有继承了 `Iterable` 的集合类同时也获得了一个 `foreach` 的基础版本。

很多集合操作都是基于 `foreach` 实现，因此它的性能非常关键。一些 `Iterable` 子类覆写了这个方法的实现，从而获得了符合不同集合特性的优化。

那么，常见的集合类型（如 `Seq`） 是如何实现通用操作的呢（如 `map`）？

**原来，`Traversable` 除了唯一的抽象方法以外，还包含了大量通用的集合操作方法。**

Scala 文档对这些操作方法进行了归类，如下所示：

| 分类  | 方法 |
| ---- | ------------------ |
| 抽象方法 | foreach |
| 相加 |  ++ |
| Map  | map / flatMap / collect  |
| 集合转换  | toArray / toList / toIterable / toSeq / toIndexedSeq / toStream / toSet / toMap  |
| 拷贝  | copyToBuffer / copyToArray   |
| size 信息  | isEmpty / nonEmpty / size / hasDefiniteSize  |
| 元素检索  |  head / last / headOption / lastOption / find  |
| 子集合检索 |  tail / init / slice / take / drop / takeWhilte / dropWhile / filter / filteNot / withFilter |
| 拆分 | splitAt / span / partition / groupBy |
| 元素测试 | exists / forall / count  |
| 折叠 | foldLeft / foldRight / /: / :\ / reduceLeft / reduceRight  |
| 特殊折叠 | sum / product / min / max |
| 字符串转化 | mkString / addString / stringPrefix |
| 视图生成 | view  |

**由此，一个集合仅需定义 `foreach` 方法，以上所有其它方法都可以从 `Traversable` 继承。**

### Iterable

Scala 当前版本的 `Iterable` 设计略显尴尬，它实现了 `Traversable`，也同时被其它所有集合实现。然而事实上这并不是一个好的设计，原因如下：

- `Traversable` 具有隐式的行为假设，它在公开的签名中是不可见的，容易导致 API 出错
- 遍历一个 `Traversable` 比 `Iterable` 性能要差
- 所有继承了 `Traversable` 的数据类型，无不接受 `Iterator` 的实现，前者显得多余

> 详情参见 @Alexelcu 的文章 — [Why scala.collection.Traversable Is Bad Design](https://alexn.org/blog/2017/01/13/traversable.html) 

因此，正在进行的 [Scala collection redesign](https://contributors.scala-lang.org/t/ongoing-work-on-standard-collections-redesign/293) 项目也已经抛弃了 `Traversable`。

然而，这并不妨碍我们研究 `Iterable` 中的通用方法，它们也在 [collection-strawman](https://github.com/scala/collection-strawman) 中被保留，如下所示：

| 分类  | 方法 |
| ---- | ------------------ |
| 抽象方法 | iterator |
| 其他迭代器 | grouped / sliding |
| 子集合 | takeRight / dropRight |
| 拉链操作 | zip / zipAll |
| 比对 | sameElements |


## Builder 类

几乎所有的集合操作都由「遍历器」和「构建器」完成，在了解以上内容之后，我们再来了解下如何构建一个集合类型。在当前的 Scala 中，是利用一个 `Builder` 类实现的。

```scala
package scala.collection.mutable
class Builder[-Elem, +To] {
  def +=(elem: Elem): this.type
  def result(): To
  def clear(): Unit
  def mapResult[NewTo](f: To => NewTo): Builder[Elem, NewTo] = ...
}
```

注意类型参数，`Elem` 表示元素的类型（如 `Int` ），`To` 表示集合的类型（如 `Array[Int]`）。

此外：
- `+=` 可以增加元素
- `result` 返回一个集合
- `clear` 把集合重置为空状态
- `mapResult` 返回一个 `Builder`，拥有新的集合类型

我们来看下`Builder` 如何结合 `foreach` 方法，实现常见的 `filter` 操作：

```scala
def filter(p: Elem => Boolean): Repr = {
  val b = newBuilder
  foreach { elem => if (p(elem)) b += elem }
  b.result
}
```

So easy！没什么挑战。

我们再来考虑下 `map`，它与 `filter` 的差异之一，在于前者可以返回一个「元素类型不同」的集合。如：
```scala
scala > List(1, 2, 3).map(_.toString)
res0: List[String] = List(1, 2, 3)
```

这下有难度了，仅凭 `Builder` 和 `foreach` 组合，似乎完成不了这个任务。

于是，我们决定看下 `TraversableLike` 中 `map` 的 Scala 源码实现：

```scala
def map[B, That](p: Elem => B)
    (implicit bf: CanBuildFrom[B, That, This]): That = {
  val b = bf(this)
  for (x <- this) b += f(x)
  b.result
}
```

> 当前 Scala 集合中，???Like 命名的特质是 ??? 特质的实现。

一个大发现 — **当前版本的 Scala 原来是利用 `CanBuildFrom` 类型来解决如何集合「类型转换」的问题**。

```scala
package scala.collection.generic
trait CanBuildFrom[-From, -Elem, +To] {
  // 创建一个新的构造器(builder)
  def apply(from: From): Builder[Elem, To]
}
```

这种利用 TypeClass 技术 — 采用隐式转换来获得扩展的方式，显得强大且灵活，但在新手看来会比较怵。

通过字面的理解，我们知晓 — `From` 代表当前的集合类型，`Elem` 代表元素类型，`To` 代表目标集合的类型。
所以我们可以如此解读 `CanBuildFrom`：「**有这么一个方法，由给定的 From 类型的集合，使用 Elem 类型，建立 To 类型的集合**」。

## 新集合类实现

通过以上的介绍，大家对 Scala 的集合结构设计有了整体的认识，现在开始来实现一个新的集合类。

> 以下例子来自 Scala 文档，细节有调整，精简。

假设我们需要设计一套新的「密文编码序列」，由最基本的 A、B、C、D 四个字母组成。定义类型如下：

```scala
abstract class Base
case object A extends Base
case object B extends Base
case object C extends Base
case object D extends Base
object Base {
  val fromInt: Int => Base = Array(A, B, C, D)
  val toInt: Base => Int = Map(A -> 0, B -> 1, C -> 2, D -> 3)
}
```

显然，我们可以使用 `Seq[Base]` 来表示一个密文序列，但由于这个密文可能很长，并且 Base 类型只有 4 种可能，我们可以通过「位计算」的方式来开发一种压缩过的集合，它是 `Seq[Base]` 的子类。

> 以下将采用伴生对象的方式来创建 `Message` 实例，可参考 [Builder 创建者模式
](http://scala.cool/2017/07/scala-design-patterns-2/)

```scala
import collection.IndexedSeqLike

final class Message private (
    val groups: Array[Int],
    val length: Int) extends IndexedSeq[Base] {
  import Message._
  def apply(idx: Int): Base = {
    if (idx < 0 || length <= idx)
      throw new IndexOutOfBoundsException
    Base.fromInt(groups(idx / N) >> (idx % N * S) & M)
  }
}

object Message {
  private val S = 2 // 表示一组所需要的位数             
  private val N = 32 / S  // 一个Int能够放入的组数      
  private val M = (1 << S) - 1 // 分离组的位掩码(bitmask)
  def fromSeq(buf: Seq[Base]): Message = {
    val groups = new Array[Int]((buf.length + N - 1) / N)
    for (i <- 0 until buf.length)
      groups(i / N) |= Base.toInt(buf(i)) << (i % N * S)
    new Message(groups, buf.length)
  }
  def apply(bases: Base*) = fromSeq(bases)
}
```

测试：

```scala
val message = Message(A, B, B ,D)
println(message.length) // 4
println(message.last) // D
println(message.take(3)) // Vector(A, B, B)
```

- Message 很好地获得了 `IndexedSeq` 的通用集合方法，如 `length`、`last`
- **但 `take` 方法并没有获得预期的 `Message(A, B, B)`，而是 `Vector(A, B, B)`**

改进一下：

```scala
def take(count: Int): Message = Message.fromSeq(super.take(count))
```

- 确实可以解决 `take` 返回动态类型的问题，可得到 `Message(A, B, B)`的结果
- ** 然而集合除了 `take` 外还有大量通用方法，覆写每个方法的策略不可取 **

### 正确的姿势

```scala
import collection.mutable.{Builder, ArrayBuffer}
import collection.generic.CanBuildFrom
```

在伴生类中重新实现 `newBuilder` ：

```scala
final class Message private (val groups: Array[Int], val length: Int)
  extends IndexedSeq[Base] with IndexedSeqLike[Base, Message] {
  import Message._
  
  // 在IndexedSeq中必须重新实现newBuilder
  override protected[this] def newBuilder: Builder[Base, Message] =
    Message.newBuilder
  
  def apply(idx: Int): Base = {
    ……
  }
  
}
```

改写伴生对象：

```scala
object Message {
  ……
  def fromSeq(buf: Seq[Base]): Message = {
    ……
  }

  def apply(bases: Base*) = fromSeq(bases)
  
  def newBuilder: Builder[Base, Message] =
    new ArrayBuffer mapResult fromSeq
  
  implicit def canBuildFrom: CanBuildFrom[Message, Base, Message] =
    new CanBuildFrom[Message, Base, Message] {
      def apply(): Builder[Base, Message] = newBuilder
      def apply(from: Message): Builder[Base, Message] = newBuilder
    }
}
```

此外，如前文提到，我们还可以重新实现 `foreach` 方法来提高该集合类的效率：

```scala
final class Message private (val groups: Array[Int], val length: Int)
  extends IndexedSeq[Base] with IndexedSeqLike[Base, Message] {
  ……
  override def foreach[U](f: Base => U): Unit = {
    var i = 0
    var b = 0
    while (i < length) {
      b = if (i % N == 0) groups(i / N) else b >>> S
      f(Base.fromInt(b & M))
      i += 1
    }
  }
}
```

以上，我们便构建了一个新的集合类型 `Message`，通过极少的代码，拥有了强大的通用集合特性。

我们将在下一篇文章中进一步介绍 `CanBuildFrom` ，几乎确定地说，它也会在未来的 Scala 版本中被新的方案替代。

## 参考

- [Scala’s Collections Library](http://docs.scala-lang.org/overviews/collections/introduction.html)
- [The Architecture of Scala Collections](http://docs.scala-lang.org/overviews/core/architecture-of-scala-collections.html)