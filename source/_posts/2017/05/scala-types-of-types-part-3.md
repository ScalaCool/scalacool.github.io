---
title: <译> Scala 类型的类型（三）
author: Yison
tags:
- 类型相关
- 翻译
- ~Scala 类型的类型
- ^Yison
description: 现在我们来深入了解「类型别名」的使用场景 — 抽象类型成员。有了抽象类型成员，我们就可以说「我希望有人告诉我某个类型 — 我将通过名称 MyType 来引用它」。
date: 2017-05-10
---

## 上一篇

[Scala 类型的类型（二）](http://scala.cool/2017/04/scala-types-of-types-part-2/)

## 目录

- [11. 抽象类型成员](#11-抽象类型成员)
- [12. 自递归类型](#12-自递归类型)
- [13. 类型构造器](#13-类型构造器)
- [14. 高阶类型](#14-高阶类型)
- [15. 样例类](#15-样例类)

## 11. 抽象类型成员

现在我们来深入了解「类型别名」的使用场景 — 抽象类型成员（Abstract Type Member）。

有了抽象类型成员，我们就可以说「我希望有人告诉我某个类型 — 我将通过名称 MyType 来引用它」。抽象类型成员最基本的功能就是让我们能够定义泛型类（模板），但却不是通过使用 `class Clazz[A, B]` 这种语法，而是在类里面进行命名，就像这样子：

```scala
trait SimplestContainer {
  type A      // Abstract Type Member

  def value: A
}
```

学过 Java 的朋友会觉得这在语法上有点类似 `Container<A>` ，但在 「路径依赖类型」 的章节中我们会发现它其实是更强大的，以下的例子也可以说明这一点。

需要注意到的关键点是，虽然 Abstract Member Type 命名中包含了关键字 `abstract`，它并不会表现得跟一个「抽象字段」一样 — 所以你仍然可以在不「实现」类型成员 `A` 的前提下创建一个 `SimplestContainer` 的新实例：
```scala
new SimplestContainer // valid, but A is "anything"
```

你可能会想知道类型 `A` 到底是什么，因为我们没有在任何地方提供关于它的任何信息。然而实际上 `type A` 无非只是 `type A >: Nothing <: Any` 的一个缩写而已，它可以代表「任何东西」。
```scala
object IntContainer extends SimplestContainer {
  type A = Int

  def value = 42
}
```

我们通过使用类型别名「提供了一个类型」，现在我们可以实现这个 `value` 方法，返回一个 `Int` 。

我们可以对「抽象类型成员」进行约束，这是它更加有趣的应用。假设你想要一个容器，只能存储一个 `Number` 的任何示例。我们可以在定义一个抽象类型成员的地方注释以下的约束：
```scala
trait OnlyNumbersContainer {
  type A <: Number
  def value: A
}
```

或者我们可以稍后在类的继承关系中添加约束，比如继承一个声明「only Numbers」的特质：
```scala
trait SimpleContainer {
  type A
  def value: A
}

trait OnlyNumbers {
  type A <: Number
}

val ints = new SimpleContainer with OnlyNumbers {
  def value = 12
}

// bellow won't compile
val _ = new SimpleContainer with OnlyNumbers {
  def value = "" // error: type mismatch; found: String(""); required: this.A
}
```

因此，就如你看到的，我们可以像使用「类型变量」一样使用「抽象类型成员」，但是却不必像前者一样到处显式传递，因为它不是一个字段。虽然这里需要付出一点代价 — 我们需要给这些类型取名字。

## 12. 自递归类型

自递归类型（Self-recursive Types）在大多数文献中被称为 **F-Bounded Types** 。所以你可能会发现很多文章或博客引用 **F-bounded** 。事实上，这是 self-recursive 的另一种叫法，代表了「子类型约束」本身是通过参数化发生在左侧的绑定器的情况。

由于「自递归」的叫法更加直观，我们会在后续的文中坚持使用（尽管还是有部分读者会在 google 中搜索「F-bounded是什么」）。

### 12.1 F-Bounded Type

虽然这不是 Scala 的某种具体类型，但它有时也让人感到棘手。很多人熟悉（也许是不知不觉地）的一个自递归类型的例子是 Java 中的 `Enum<E>` 。如果你比较好奇，可以参见 [Enum sources from Java](http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/lang/Enum.java) 。但现在先让我们回到 Scala，看看我们到底在讨论什么。

> 在本节中，我们不会特别深入探讨这种类型。如果你想要了解在 Scala 中更多、更深入的用例，或许可以看看 Kris Nuttycombe 的 [F-Bounded Type Polymorphism Considered Tricky](http://logji.blogspot.se/2012/11/f-bounded-type-polymorphism-give-up-now.html) 。

想象你有某个 `Fruit` 特质，一个 `Apple` 和 `Orange` 继承了它。Fruit 特质同时还有一个 compareTo 方法，这时候问题出现了 —  猜想你想说「我不能拿橘子和苹果进行比较啊，它们可是完全不同的东西！」。我们先来写一段天真的实现代码：
```scala
// naive impl, Fruit is NOT self-recursively parameterised

trait Fruit {
  final def compareTo(other: Fruit): Boolean = true // impl doesn't matter in our example, we care about compile-time
}

class Apple  extends Fruit
class Orange extends Fruit

val apple = new Apple()
val orange = new Orange()

apple compareTo orange // compiles, but we want to make this NOT compile!
```

在这段代码中，由于 `Fruit` 特质不知道谁会继承它，所以不可能通过限制 compareTo 的签名来实现只允许传入跟`this` 相同的子类型参数。让我们利用「自递归类型参数」来重新实现下：
```scala
trait Fruit[T <: Fruit[T]] {
  final def compareTo(other: Fruit[T]): Boolean = true // impl doesn't matter in our example
}

class Apple  extends Fruit[Apple]
class Orange extends Fruit[Orange]

val apple = new Apple
val orange = new Orange
```

注意 Fruit 签名里的类型参数，你可以解读为「我传入了类型 `T` , `T` 必须是一个 `Fruit[T]`」，必须像上述 `Apple` 和 `Orange` 一样继承这个特质才能满足这种界限条件。现在如果我们要比较 `apple` 和 `orange` ，我们就会得到一个编译时错误：
```
scala> orange compareTo apple
:13: error: type mismatch;
 found   : Apple
 required: Fruit[Orange]
              orange compareTo apple

scala> orange compareTo orange
res1: Boolean = true
```

因此我们确定只能在同类水果之间进行比较，比如苹果跟苹果。假使讨论更多，要是 `Apple` 和 `Orange` 的子类呢？好，因为我们在类型继承关系中在 Apple / Orange 层填写了类型参数，根本上行我们可以说「苹果只能跟苹果进行比较」，这也意味着苹果的子类可以进行相互比较。这对 Fruit 的 `compareTo` 的签名来说依旧好办，因为我们调用的右侧部分会变成 `Fruit[Apple]` — 变得更具体一点而已。让我们用一个日本的苹果（ja. "りんご", "ringo"）和一个波兰的苹果（pl. "Jabłuszko"）举例：

```scala
object `りんご`  extends Apple
object Jabłuszko extends Apple

`りんご` compareTo Jabłuszko
// true
```

> 你也可以通过其它奇技淫巧来实现同样的类型安全，比如路径依赖类型、隐式参数或 Type Class ，但这应该是最简单的实现方式。

## 13. 类型构造器

> ❌ 该章节作者尚未完成，或需要修改

类型构造器跟函数几乎是类似的，但前者是在类型层面。换句话说，你在日常的编程中可以给一个函数传入一个值 `a`，然后返回一个值 `b` 。于是在类型层面编程，你可以认为一个 `List[+A]` 是一个类型构造器，表现如下：
- `List[+A]` 有一个类型参数 (`A`)；
- 它本身并不是一个有效的类型，你需要填充 `A` 所在的地方来「构造类型」；
- 填上 `Int` 你就得到了一个具体的类型 `List[Int]` 。

通过这个例子，你会发现「类型构造器」跟「普通构造器」是如此的相似，唯一不同的地方在于前者处理的是类型，而不是对象的实例。值得注意的是，在 Scala 中我们不能说某个东西的类型是 `List` ，因为它并不像 Java 里，javac 会将 `List<Object>` 给你。 Scala 在这个地方是更严格的，它并不允许我们仅仅使用一个 `List` 来代表一个类型，因为它是一个类型构造器，而不是一个真正的具体类型。

在 Scala 2.11.x 中我们将在 REPL 中拥有一个强大的命令 - `:kind` ，它支持检测一个类型是高阶。让我们通过一个简单的类型构造器来试试看，比如 `List[+A]` ：
```scala
// Welcome to Scala version 2.11.0-M5 (Java HotSpot(TM) 64-Bit Server VM, Java 1.8.0-ea).
// Type in expressions to have them evaluated.

:kind List
// scala.collection.immutable.List's kind is F[+A]

:kind -v List
// scala.collection.immutable.List's kind is F[+A]
// * -(+)-> *
// This is a type constructor: a 1st-order-kinded type.
```

这里我们看到，scalac 可以告诉我们 `List` 实际上是一个类型构造器（当与 `-verbose` 一起使用时，会更有说服力）。我们来调查下上述信息中的语法：`* -> *` 。这个语法被广泛地用于代表类型（ kind ，而不是 type ），我发现事实上这是受到了 Haskell 的启发 — Haskell 用它来打印函数的类型。最直观的解读是「传入一个类型，返回另一个类型」。你也许已经注意到我们从 Scala 完整的输出中省略了来自关系中的 `+` 符号（`* -(+)-> *`）。这个代表型变的边界，你可以在 [Scala 中的型变](http://scala.cool/2017/04/scala-types-of-types-part-2/#7-Scala-中的型变) 一节中了解更多关于型变的内容。

综上所述，`List[A+]` （或者 `Option[+A]` ，或者 `Set[+A]` …… 或者其它有一个类型参数的东西）是最简单的类型构造器的例子 — 这些都有一个参数。我们称它们为第一阶类型 (`* -> *`)。值得一提的是，一个 `Pair[+A, +B]` （我们可以表示为 `* -> * -> *`）依旧不是一个「高阶类型」，它也是第一阶的。在下一节中，我们将仔细研究高阶类型到底给我们带来了什么，以及如何识别它。

## 14. 高阶类型

> ❌ 该章节作者尚未完成，仍旧缺失部分内容

这里一个典型的例子是 `Monad`：
```scala
scala> import scalaz._
import scalaz._

scala> :k Monad // Finds locally imported types.
Monad's kind is (* -> *) -> *
This is a type constructor that takes type constructor(s): a higher-kinded type.
```

TODO：[http://blogs.atlassian.com/2013/09/scala-types-of-a-higher-kind/](http://blogs.atlassian.com/2013/09/scala-types-of-a-higher-kind/)

## 15. 样例类

样例类（Case Class）是 Scala 编译器中最有用的小技巧之一。它使用起来简单，然而又帮了大忙。它为我们避免了一些非常重复无聊的工作，如 `equals`、`hashCode` 和 `toString` 的实现，内置了 `apply` / `unapply` 方法来支持模式匹配，等等。

在 Scala 中一个样例类的声明就像一个普通的类一样，只是需要前置一个 `case` 关键字：
```scala
case class Circle(radius: Double)
```

仅一行代码，我们就已经实现了 [Value Object](http://en.wikipedia.org/wiki/Value_object) 模式。这意味着通过定义一个样例类，我们就自动做到了以下事情：
- 它的实例是不可变的；
- 可以使用 `equals` 来被比较，通过它的字段来判定相等（而不是类似一个普通类的对象相等）；
- 它的 `hashCode` 奉行 `equals` 的契约，是基于类的值；
- 它的 `toString` 由类名和它所包含的字段的值组成的（对照上面的 Circle，可实现为 `def toString = s"Circle($radius)"`）。

我们消化下目前所提到的东西，接下来将使用一个生动的例子来继续延伸。这次我们要实现一个 `Point` 类，它会拥有不止一个字段，来展现 `case class` 给我们提供的一些有趣的特性：
```scala
① case class Point(x: Int, y: Int)        
② val a = Point(0, 0)                   
③ // a.toString == "Point(0,0)"         

④  val b = a.copy(y = 10)                
  // b.toString == "Point(0,10)"

⑤ a == Point(0, 0)                      

```

① `x` 和 `y` 自动被定义为 `val` 成员；  
② 一个 `Point` 的伴身对象会同时产生，它有一个 `apply(x: Int, y: Int)` 方法，我们可以借此创建实例；  
③ 生成的 `toString` 方法包含了类名以及 case class 的参数值；  
④ `copy(...)` 方法支持我们轻松创建拷贝的对象，改变选定的字段；  
⑤ case class 基于值来判等 ( `equals` 和 `hashCode` 被生成，它们基于 case class 的参数实现)  

除此之外，一个 case class 还可被用于模式匹配，使用惯常的或者「抽取器模式」语法：

```scala
Circle(2.5) match {
  case Circle(r) => println("Radius = " + r)
}

val Circle(r)
val r2 = r + r
```

## 下一篇

[Scala 类型的类型（四）](http://scala.cool/2017/07/scala-types-of-types-part-4/)
