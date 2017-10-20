---
title: Subtyping vs Typeclasses（三）
author: Yison
tags: 
- 类型相关
- Typeclass
- 翻译
description: 上一篇文章介绍了 Type Classes，但并没有深入分析它的优势。tpolecat 写了一篇文章很好地比较了 Subtyping 和 Typeclasses ，本文进行了翻译。此外，文末则附加了一些链接，关于该文章引发的一些讨论。
date: 2017-10-12
---

[上一篇文章](https://scala.cool/2017/09/subtyping-vs-typeclasses-2/)介绍了 Type Classes，但并没有深入分析它的优势。tpolecat 写了一篇文章很好地比较了 Subtyping 和 Typeclasses ，本文进行了翻译。此外，文末则附加了一些链接，关于该文章引发的一些讨论。

## 原文链接

[Returning the "Current" Type in Scala](https://tpolecat.github.io/2015/04/29/f-bounds.html)

<hr />

`#scala` 的 IRC channel 经常讨论一个问题：

> 我有一个类型层次结构…… 我怎样才能声明一个父类的方法，可以返回「当前」的类型？

这个问题的产生与 Scala 推崇不可变性有关，于是方法们经常要返回一个修改后的 `this` 的副本， 但要保证返回类型足够的精确又是棘手的，这便是本文要探讨的话题。

解决该问题最“标准的”方法（如 stdlib collections）就是使用一个 [F-bounded type](https://scala.cool/2017/05/scala-types-of-types-part-3/#12-自递归类型)，它大多数情况是管用的，但却不能完全地强制约束（它实施了一些原则，也存在一些坑）。这里要赞赏下 [@nuttycom](https://twitter.com/nuttycom) 的工作，他探索了 [F-Bounded Type 方法存在哪些陷阱](http://logji.blogspot.co.id/2012/11/f-bounded-type-polymorphism-give-up-now.html)。

一个更好的方案是使用一个 **typeclass**，它很漂亮地解决了问题且没多余的缺陷。实际上，在这些情况下，弃用 Subtyping 多态是合理的。

我们将研究一些问题以及相应的两种解决方案，最终通过探索动物的[异构集合](https://wiki.haskell.org/Heterogenous_collections)来获得答案，这过程也会涉及到一些有趣的类型。好了，就让我们开始吧…

## 难题

有一个面向宠物（pets）的开放特质 `Pet`，它不知道被实现了多少次。每个 `Pet` 类型都有一个 name，以及一个方法，可以返回一个拥有一个新名字的等价拷贝。

> **问题出现了：** 对任意的表达式 x，它的类型为 `A <: Pet`，如何确保 `x.renamed(...)` 也拥有类型 `A`。说的具体点，我们需要的是在静态类型层面的实现，而不是一个运行时的属性。

没错，以下就是我们最开始的尝试以及一个实现方案。
```scala
trait Pet {
  def name: String
  def renamed(newName: String): Pet
}

case class Fish(name: String, age: Int) extends Pet {
  def renamed(newName: String): Fish = copy(name = newName)
}
```

在我们 `Fish` 中， `name` 是通过一个 case class 的字段来实现的，`rename` 方法则很简单地采用了随之生成的 `copy` 方法…… 需要注意的是它返回的类型是 `Fish` 而不是 `Pet`。之所以允许这么做是因为「返回类型处于一个[协变](https://scala.cool/2017/04/scala-types-of-types-part-2/#7-Scala-中的型变)的位置」，所以我们总是可以返回比承诺的更具体的东西。

理智情况下，我们可以创建一个 `Fish` 然后进行重命名，一切正常，返回的静态类型也是我们想要的。

```scala
scala> val a = Fish("Jimmy", 2)
a: Fish = Fish(Jimmy,2)

scala> val b = a.renamed("Bob")
b: Fish = Fish(Bob,2)
```

然而这种方案的一个局限在于我们的特质实际上并没有足够地约束对它的实现。我们仅仅只是要求返回一个 `Pet`，并没有必须是相同的宠物类型。所以这里我们可以在进行重命名后，把一个 `Kitty` 变成一个 `Fish`。

```scala
case class Kitty(name: String, color: Color) extends Pet {
  def renamed(newName: String): Fish = new Fish(newName, 42) // oops
}
```

我们在试图对重命名进行抽象的问题上遇到了麻烦。举个例子，以下这样一个通用的重命名方法在编译的时候会出错，因为 `renamed` 返回的类型对一个任意的 `A <: Pet` 还不够具体，这里最好是返回 `Pet`。

```scala
def esquire[A <: Pet](a: A): A = a.renamed(a.name + ", Esq.")
```

```scala
<console>:28: error: type mismatch;
 found   : Pet
 required: A
       def esquire[A <: Pet](a: A): A = a.renamed(a.name + ", Esq.")
```

因此该方法并不能实现我们的目标，即 `renamed` 方法需要返回跟它的接收者一样的类型，我们无法对重命名的操作实现抽象，那么就看看能不能让类型变得更丰富些吧。

## F-Bounded Types

一个 F-Bounded Type 是**对它的子类型进行参数化**，它允许我们把要「实现的类型」作为参数「传递」给父类。
`Pet[A <: Pet[A]]` 这种自引用的语法看起来令人疑惑，如果你不能一下子理解，那么就继续往下看，慢慢就会明白。

```scala
trait Pet[A <: Pet[A]] {
  def name: String
  def renamed(newName: String): A // note this return type
}
```

好了，`Pet` 任意的子类型都需要传递「自身」作为一个类型参数。

```scala
case class Fish(name: String, age: Int) extends Pet[Fish] { // note the type argument
  def renamed(newName: String) = copy(name = newName)
}
```

大功告成。

```scala
scala> val a = Fish("Jimmy", 2)
a: Fish = Fish(Jimmy,2)

scala> val b = a.renamed("Bob")
b: Fish = Fish(Bob,2)
```

这一次之所以可以写一个通用的重命名方法，是因为现在我们的 `renamed` 有了一个更具体的返回类型。任何 `Pet[A]` 都会返回一个 `A`。

```scala
scala> def esquire[A <: Pet[A]](a: A): A = a.renamed(a.name + ", Esq.")
esquire: [A <: Pet[A]](a: A)A

scala> esquire(a)
res8: Fish = Fish(Jimmy, Esq.,2)
```

这是一个不小的进步，我们终于可以讨论一下所谓的「当前」的类型，它变成了一个参数。

然而，这仍然存在「当前」类型撒谎的问题。因为并没有对传递的参数类型进行限制，我们的 `Kitty` 再一次变成了 `Fish`。

```scala
case class Kitty(name: String, color: Color) extends Pet[Fish] { // oops
  def renamed(newName: String): Fish = new Fish(newName, 42)
}
```

该死！我们需要限制声明为 `A` 类型的实现类，确实类型为 `A`。Scala 也确实提供了一个方法：一个 **自身类型**（self-type）注解。

```scala
trait Pet[A <: Pet[A]] { this: A => // self-type
  def name: String
  def renamed(newName: String): A 
}
```

现在当我们尝试把 `Kitty` 定义为 `Fish` 时，编译器就会说不。

```scala
case class Kitty(name: String, color: Color) extends Pet[Fish] {
  def renamed(newName: String): Fish = new Fish(newName, 42)
}
```

```scala
<console>:19: error: illegal inheritance;
 self-type Kitty does not conform to Pet[Fish]'s selftype Fish
       case class Kitty(name: String, color: Color) extends Pet[Fish] {
                                                            ^
```

这相当给力，我们几乎认为已经解决了问题。但遗憾的是，我们依旧可以通过继承另一个满足该限制的类型，来对「当前」类型进行欺骗，Subtyping 存在一个讨厌的漏洞。

```scala
class Mammal(val name: String) extends Pet[Mammal] {
  def renamed(newName: String) = new Mammal(newName)
}

class Monkey(name: String) extends Mammal(name) // hmm, Monkey is a Pet[Mammal]
```

就是这样，我已经想不到进一步限制 F-bounded type 的方法了。因此，如果我们使用这项技术，我们可以做得相当出色，但仍然不能完全保证重命名会满足指定的条件。还要注意的是，引入基于 `Pet` 的类型参数并没有提供任何信息，它纯粹只是一种限制实现的机制而已。

那么，就让我们试试其它方法吧。

## Typeclass

通常情况下，我们可以使用 Typeclass 来避免 Subtyping 相关的问题。我们不需要再定义一个 `renamed` 方法了，而是定义一个相应的 typeclass 来处理这个操作。

```scala
trait Pet {
  def name: String
}

trait Rename[A] {
  def rename(a: A, newName: String): A
}
```

现在可以定义一个 `Fish` 以及 `Rename[Fish]` 的一个实例了。我们让这个实例为 implicit ，并在伴生对象中进行定义，因此它会在隐式范围中被搜索到。

```scala
case class Fish(name: String, age: Int) extends Pet

object Fish {
  implicit val FishRename = new Rename[Fish] {
    def renamed(a: Fish, newName: String) = a.copy(name = newName)
  }
}
```

正如我们所见，一个 implicit class 能够实现之前方法的操作，如此通过 implicit conversion 任何 `Pet` 带有一个 `Rename` 实例就可以自动获得一个 `renamed` 方法。

```scala
implicit class RenameOps[A](a: A)(implicit ev: Rename[A]) {
  def renamed(newName: String) = ev.renamed(a, newName)
}
```

同时我们的测试用例依旧有效，虽然实现机制已经大不同。

```scala
scala> val a = Fish("Jimmy", 2)
a: Fish = Fish(Jimmy,2)

scala> val b = a.renamed("Bob")
b: Fish = Fish(Bob,2)
```

有了 typeclass 的这种设计，就不能简单地定义一个 `Rename[Kitty]` 实例，然后返回不是 `Kitty` 类型的东西了。这里的类型十分清晰。我们的 `esquire` 方法很简单，它的类型边界是不同的，但是实现与上述的 F-bounded 例子等价。

```scala
scala> def esquire[A <: Pet : Rename](a: A): A = a.renamed(a.name + ", Esq.")
esquire: [A <: Pet](a: A)(implicit evidence$1: Rename[A])A

scala> esquire(a)
res10: Fish = Fish(Jimmy, Esq.,2)
```

这是一个通用的策略，通过识别需要我们返回「当前类型」的方法，并把它们装进一个 typeclass 中，这样就能满足我们所期望的约束。然而，这确实还有一点别扭：功能被 trait 和 typeclass 分割开来了，同时也并没有要求所有的 `Pet` 实现都拥有一个 `Rename` 实例（我们必须在上面的 `esquire` 中指定类型上界以及上下文边界）。

## 只使用一个 Typeclass 的方案

考虑一下以下的实现，`Pet` 是一个带有相关语法的 typeclass。我们完全抛弃了子类型多态，并通过特定多态来定义 pets：任何类型 `A` 都可以作为一个 `Pet`，只要给出一个 `Pet[A]` 的实例。

```scala
trait Pet[A] {
  def name(a: A): String
  def renamed(a: A, newName: String): A
}

implicit class PetOps[A](a: A)(implicit ev: Pet[A]) {
  def name = ev.name(a)
  def renamed(newName: String): A = ev.renamed(a, newName)
}
```

这是我们的 `Fish` 类，现在没有一个有趣的超类，还有一个隐式实例 `Pet[Fish]` 在它的伴生对象中。

```scala
ase class Fish(name: String, age: Int)

object Fish {
  implicit val FishPet = new Pet[Fish] {
    def name(a: Fish) = a.name
    def renamed(a: Fish, newName: String) = a.copy(name = newName)
  }
}
```

`renamed` 方法通过 `PetOps` 的隐式应用起作用。

```scala
scala> Fish("Bob", 42).renamed("Steve")
res0: Fish = Fish(Steve,42)
```

有一种有趣的猜想，即在一门编程语言中，特定多态和参数多态就是我们所需要的全部。如果没有子类型化，我们依旧可以运转良好。Haskell 就是这种语言的典型代表，在 Scala 采用这种方法是一种有趣的实践，或者至少成为我们设计空间的一部分。在我的经验里，从未后悔过用一个 typeclass 来替代一个超类。

这可能已经足够作为本文的结尾了，但我想要进一步思考一些东西。因为一旦我们回答了文章最开始的问题，那么下一个问题就是：

> 很好，我有一个 F-bounded type（或者是一个 typeclass）在工作了，但是我不了解「该如何在一个列表中保存一堆实例，却不会丢失所有的类型信息」。

那么就让我们继续探究下去吧。

## 彩蛋：我们如何处理集合？

一个有趣的练习是考虑我们有不同种类的宠物的情况。具体来说，我们如何对一个宠物的列表用 `esquire` 实施 `map` 操作呢？我应该说明的是，至少对我来说这只是一个学术上的题目，因为我从没有在现实生活中这么干过。

我们先考虑下 F-bounded type 的例子，这是我们全部的实现：

```scala
import java.awt.Color

trait Pet[A <: Pet[A]] { this: A =>
  def name: String
  def renamed(newName: String): A 
}

case class Fish(name: String, age: Int) extends Pet[Fish] { 
  def renamed(newName: String) = copy(name = newName)
}

case class Kitty(name: String, color: Color) extends Pet[Kitty] {
  def renamed(newName: String) = copy(name = newName)
}

def esquire[A <: Pet[A]](a: A): A = a.renamed(a.name + ", Esq.")

val bob  = Fish("Bob", 12)
val thor = Kitty("Thor", Color.ORANGE)
```

对一个同时包含 `bob` 和 `thor` 的列表，用 `esquire` 操作进行 `map` 可能比你预期的要复杂，但在 Scala 中是可以表示的。你可能想要暂停，在 REPL 中尝试下（你可以 `:paste` 上面的代码）…… `List(bob, thor).map(esquire)` 是一个合适的开端，尽管这并不能通过编译。

因此，结果显示这样一个列表的正确量化的的元素类型是 `A forSome { A <: Pet[A] }`，代表了每个元素都是一个 `Pet` 的独特合适的 f-bounded 子类。此外，默认的 η-expanded `esquire` 的类型还不够精确。一个罕见的例子是 `foo _` 和 `foo(_)` 并不相等。在任何情况，你看：

```scala
scala> List[A forSome { type A <: Pet[A] }](bob, thor).map(esquire(_))
res18: List[A forSome { type A <: Pet[A] }] = List(Fish(Bob, Esq.,12), Kitty(Thor, Esq.,java.awt.Color[r=255,g=200,b=0]))
```

在特定多态的实现方案中，我们有另外的问题。这是我们的完整实现，参考如下：
```scala
import java.awt.Color

trait Pet[A] {
  def name(a: A): String
  def renamed(a: A, newName: String): A
}

implicit class PetOps[A](a: A)(implicit ev: Pet[A]) {
  def name = ev.name(a)
  def renamed(newName: String): A = ev.renamed(a, newName)
}

case class Fish(name: String, age: Int)

object Fish {
  implicit object FishPet extends Pet[Fish] {
    def name(a: Fish) = a.name
    def renamed(a: Fish, newName: String) = a.copy(name = newName)
  }
}

case class Kitty(name: String, color: Color)

object Kitty {
  implicit object KittyPet extends Pet[Kitty] {
    def name(a: Kitty) = a.name
    def renamed(a: Kitty, newName: String) = a.copy(name = newName)
  }
}

def esquire[A: Pet](a: A): A = a.renamed(a.name + ", Esq.")

val bob  = Fish("Bob", 12)
val thor = Kitty("Thor", Color.ORANGE)
```

这里我们遇到一个挑战，因为压根不清楚一个包含 `bob` 和 `thor` 的列表的元素类型是什么。它们没有公共的超类，而存在的 `Pet` 的实例并不是我们可以用类型参数进行表达的东西。`List[A: Pet]` 并不是一个有效的类型。

为了在列表上用 `esquire` 进行 `map` 操作，我们必须记住它实际上有两个参数：`A` 和 `Pet[A]`。实际上，每个列表元素都需要携带上它的 `Pet` 实例。因此，列表的类型需要为 `(A, Pet[A]) forSome { type A }`，代表每个元素有一个不同的类型 `A`，同时它也对应了一个相应的 `Pet` 实例。

```scala
scala> val pets = List[(A, Pet[A]) forSome { type A }]((bob, implicitly[Pet[Fish]]), (thor, implicitly[Pet[Kitty]]))
pets: List[(A, Pet[A]) forSome { type A }] = List((Fish(Bob,12),Fish$FishPet$@1d4c9cde), (Kitty(Thor,java.awt.Color[r=255,g=200,b=0]),Kitty$KittyPet$@31f63352))
```

现在对列表进行 `map` 已经很简单了，不是吗？

```scala
scala> pets.map(p => esquire(p._1)(p._2))
<console>:23: error: type mismatch;
 found   : Pet[(some other)A(in value pets)]
 required: Pet[A(in value pets)]
              pets.map(p => esquire(p._1)(p._2))
                                            ^
```

额，好吧。。。这里的问题是 `p._1` 和 `p._2` 的类型的联系在上下文中丢失了，所以编译器并不知道如何将它们正确地排列。解决这个问题的方法，通常是使用一个模式匹配，来防止丢失。

```scala
scala> pets.map { case (a, pa)  => esquire(a)(pa) }
res6: List[Any] = List(Fish(Bob, Esq.,12), Kitty(Thor, Esq.,java.awt.Color[r=255,g=200,b=0]))
```

好了，在这一点上你可能感到不适，深感抱歉。

## 等等，还没完！

在我发布完这篇文章之后，有人建议我展示一些其它的方法来处理对一个列表的 `map` 操作，它包含的是类型并不相关的元素，但是却有一个公共的超类，我们继续前进。

[@nuttycom](https://twitter.com/nuttycom) 建议将存在 `(A, Pet[A]) forSome { type A }` 的东西改成一个类型成员，所以我们先看看这个。我们的 `∃[F[_]]` trait （对不起，没忍住）包装了一个为某种类型，并含有一个 `F` 的实例的值。我们在对一个 `List[∃[Pet]]` 进行 `map` 操作时，可以不需要一个模式匹配。这依旧有点痛苦，但是如果这里要多次操作的话，它是值得的。

```scala
trait ∃[F[_]] {
  type A
  val a: A
  val fa: F[A]
  override def toString = a.toString
}

object ∃ {
  def apply[F[_], A0](a0: A0)(implicit ev: F[A0]): ∃[F] =
    new ∃[F] {
      type A = A0
      val a = a0
      val fa = ev
    }
}

scala> List[∃[Pet]](∃(bob), ∃(thor)).map(e => ∃(esquire(e.a)(e.fa))(e.fa))
res15: List[∃[Pet]] = List(Fish(Bob, Esq.,12), Kitty(Thor, Esq.,java.awt.Color[r=255,g=200,b=0]))
```

最后，一个真正吸引人的方法，是使用一个 [shapeless](https://github.com/milessabin/shapeless) 的 `HList`，它有一个非常精确的类型，可以单独识别每个元素。我们可以使用一个叫做 `Poly1` 的多态函数值，来对一个 `HList` 进行 `map` 操作。它（不像 `Function1`）允许我们表达所想要的 typeclass 约束。我承认我不得不寻找 [@travisbrown](https://twitter.com/travisbrown) 来帮忙…… 我确实需要坐下来好好学下这些东西。

> 译者注：同事正在书写 [《Shapeless 入门指南》](https://scala.cool/tags/Shapeless/)

```scala
import shapeless._

object polyEsq extends Poly1 {
  implicit def default[A: Pet] = at[A](esquire(_))
}

scala> (bob :: thor :: HNil) map polyEsq // output reformatted for readability
res11: shapeless.::[Fish,shapeless.::[Kitty,shapeless.HNil]] = 
  Fish(Bob, Esq.,12) :: 
  Kitty(Thor, Esq.,java.awt.Color[r=255,g=200,b=0]) :: 
  HNil
```

## 结束

好了，我们探索了两种方案，来实现在 Scala 中返回「当前」的类型。这涉及到了「子类型化」以及「特定多态」之间的紧张关系，并且与「存在类型」之间也发生了轻微的冲突。我希望这能够回答一些问题，并且开辟新的探索途径。

## 延伸

- [A simpler way to returning the "current" type in Scala](https://gist.github.com/odersky/56323c309a186cffe9af)

- [https://twitter.com/odersky/status/594888877854302208](https://twitter.com/odersky/status/594888877854302208)