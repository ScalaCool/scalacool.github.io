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

在[上一篇](https://scala.cool/2018/11/cats-3/)介绍高阶类型的文章中，我们引出了 Typeclass 这个概念，并且演示了如何在 Kotlin 中模拟高阶类型，以及实现了一个 Kotlin 版本的 Functor。

如果你只是一个 Kotlin 开发者，相信你很难说服自己用这种方式进行程序设计。的确，在缺少高阶类型这种语言特性的支持下，构建 Typeclass 不是一种很自然的事情，回归到 Scala 和 Cats，我们可以庆幸没有这种烦恼。

## 认识 Typeclass

我们曾在[《Subtyping vs Typeclasses》](https://scala.cool/tags/Subtyping-vs-Typeclasses/)中具体介绍过 Typeclass，并且比较了它与熟悉的多态技术 Subtyping 之间的差异。你可能已经知晓，Typeclass 是始于 Haskell 的一种编程模式，它是一种有关[特设多态](https://scala.cool/2017/08/subtyping-vs-typeclasses/#%E4%BA%8C%E3%80%81%E7%89%B9%E5%AE%9A%E5%A4%9A%E6%80%81)的技术，可以代替继承来对已存的类库扩展功能，并且无需改变源码。

简单来说，一个 Typeclass 模式，主要由三部分来组成：
- Typeclass 本身，通常至少是包含一个类型变量的 Trait
- 实现了该 Typeclass 的一个实例
- 一个封装了 Typeclass 实例的方法，供外部调用

尽管你可能已经知道了什么是 Typeclass，我们还是再通过一个例子来介绍如何定义一个 Typeclass。在之前介绍 Typeclass 的文章中我们实现了一个 `Comparable` 的Typeclass，现在来回顾下它。

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
case class Player(kill: Int, death: Int, assist: Int) {
  def score = (kill + assist * 0.8) / death
}
```

现在来定义 `Player` 基于 `Comparator` 的实例：

```scala
object PlayerInstances {
  def ordering(o: (Player, Player) => Int) = new Comparator[Player] {
    def compare(first: Player, second: Player) = o(first, second)
  }
  implicit val mvp = ordering((p1: Player, p2: Player) => (p1.score - p2.score).toInt)
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

val players = List(Player(12, 3, 4), Player(5, 9, 10), Player(2, 1, 4))
Players.findMvp(players)
```

我们见识到了 Typeclass 的神奇运用，当然你可能并不是很喜欢 `Players.findMvp(players)` 这种语法，确实我们还可以对其进行改进。

现在来使用 `implicit` 实现另一种方案：

```scala
import scala.language.implicitConversions
implicit def PlayerListOps[T](l: List[T]) = new PlayerList(l)

class PlayerList[T](l: List[T]) {
  def mvp(implicit ordering: Comparator[T]): T = {
    l.reduce((a, b) => if (ordering >=(a, b)) a else b)
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

首先来看看 Cats 中 [Show](https://github.com/typelevel/cats/blob/master/core/src/main/scala/cats/Show.scala) 的定义，为了便于理解，我们可以将其先简化为以下的定义（虽然这与源码不是完全一致）：

```Scala
package cats

trait Show[A] {
  def show(value: A): String
}
```

`Show` 支持具体类型返回一个代表自身的字符串值。也许你会说这样子很傻，因为 Scala 在 `Any` 类型上都支持了 `toString` 方法。然而，从一个更周全的设计角度而言，这种做法是非「类型安全」的。比如以下的代码，程序可以通过编译。

```scala
scala> (new {}).toString
res0: String = $anon$1@7de26db8
```

作为对比，`Show` 的方案则更安全：

```scala
scala> (new {}).show
<console>:8: error: value show is not a member of AnyRef
              (new {}).show
```

> 类似的类型问题也存在于 Scala 标准库的判等操作，也许你已经遇到 `Option[T]` 类型数据在判等时的麻烦问题，Cats 的 `Eq` 则提供了类型安全的解决方案，我们稍后就会介绍它。

接下来，我们先来看看 `Show` 的 `apply` 方法，它支持获取相应类型的 `Show` 实例：

```scala
def apply[A](implicit instance: Show[A]): Show[A] = instance
```

在调用 `apply` 之前，我们需要先导入供隐式寻找的实例作用域，它存在于 `cats.instances` 包下，你可以通过 [cats/instances/package.scala](https://github.com/typelevel/cats/blob/master/core/src/main/scala/cats/instances/package.scala) 来查看细节。

```scala
import Cats.Show
import import cats.instances.int._

val showInt: Show[Int] = Show.apply[Int]

val int2Str: String = showInt.show(2019)
// int2Str: String = 2019
```

我们再来看下 `cats.syntax` 这个包，它主要封装了 Typeclass 实例来供外部使用，正是起到了以上 Typeclass 模式介绍中的第三个部分的作用。继续上面代码的例子，我们通过引入 `cats.syntax.show._` 来直接实现各种黑科技。

```scala
import cats.syntax.show._

val intShow = 2019.show
// intShow: String = 2019

val stringShow = "scala".show
// stringShow: String = scala
```

### 自定义 Person 类

那么，我们如何让自定义的数据类型，也支持 `Show` 的功能呢？我们先来定义一个 `Person` 类：

```scala
case class Person(name: String)
```

根据之前习得得方法，我们可以定义一个 `Person` 类型的 `Show` 实例：

```scala
implicit val personShow: Show[Person] = new Show[Person] {
  def show(p: Person): String = s"I am ${p.name}."
}
```

然而，作为一个类库 Cats 自然有更加简单的方法。事实上，Cats 提供了两种实现的方法：

```scala
/** creates an instance of [[Show]] using the provided function */
def show[A](f: A => String): Show[A] = new Show[A] {
  def show(a: A): String = f(a)
}

/** creates an instance of [[Show]] using object toString */
def fromToString[A]: Show[A] = new Show[A] {
  def show(a: A): String = a.toString
}
```

`show`方法支持传入一个函数来自定义行为，`fromToString` 则直接采用了 `toString` 方法。在这个例子中，我们可以采用 `show` 方法来实现需要的逻辑：

```scala
implicit val showPerson: Show[Person] = Show.show(p => s"I am ${p.name}.")
```

现在来测试下效果：

```scala
val shaw = Person("Show")
// shaw: Person = Person(Show)

shaw.show
// res1: String = Shaw
```

### Eq 与判等类型安全

另一个我们要介绍的 Typeclass 就是 `Eq`。它在 Cats 中实现的套路跟 `Show` 是类似的，你也可以自己联练习下 `Eq` 相关的使用。这里，我们着重强调下判等操作中「类型安全」的重要性。

如果你编写过一定量的 Scala 程序代码，很可能遭遇过这样子的陷阱：

```scala
>>> List(Some(1), Some(2), Some(3)).filter(_ == 1)
<console>:8: warning: comparing values of types Some[Int] and Int using `==' will always yield false
              List(Some(1), Some(2), Some(3)).filter(_ == 1)

res5: List[Some[Int]] = List()
```
如上所见，这段代码通过了编译并不会报错，然而由于 `Option[T]` 类型的存在，我们很可能犯下这种错误，并且很长时间才发现问题。Cats 中的 `Eq` 则可以解决这个问题。

我们用它来做些测试：

```scala
import cats._
import cats.data._
import cats.implicits._

1 === 1
// Boolean = true

1 === "scala"
// error: type mismatch

1 =!= 2
// Boolean = true

List(Some(1), Some(2), Some(3)).filter(_ === 1)
// error: type mismatch
```

Cats 定义了 `===` 和 `=!=` 来分别代表相等、不相等操作，它们被定义在 `cats.syntax.eq` 包下。实际上，它们依赖的是 `Eq` 特质中的 `eqv` 和 `neqv` 方法：

```scala
/**
 * Returns `true` if `x` and `y` are equivalent, `false` otherwise.
 */
def eqv(x: A, y: A): Boolean

/**
 * Returns `false` if `x` and `y` are equivalent, `true` otherwise.
 */
def neqv(x: A, y: A): Boolean = !eqv(x, y)
```

## 总结

本文我们再一次介绍了 Typeclass 模式，以及讲解了 Cats 中两个简单的 Typeclass — `Show` 和 `Eq`。此外，还有其他一些简单的 Typeclass 比如 `Order`、`Read`，建议你自行去研究，它们都采用了类似的实现方法，并且拥有良好的「类型安全」设计。

在接下来的文章里，我们将深入到 Cats 中更核心的知识，比如 Monoid、Monad、Functor等等，它们是函数式编程中最通用的结构。
