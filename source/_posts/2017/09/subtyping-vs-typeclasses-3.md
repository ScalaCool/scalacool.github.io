---
title: Subtyping vs Typeclasses（三）
author: Yison
tags: 
- 类型相关
- Typeclass
- 翻译
description: 上一篇文章介绍了 Type Classes，但并没有深入分析它的优势。tpolecat 写了一篇文章很好地比较了 Subtyping 和 Typeclasses ，本文进行了翻译。此外，文末则附加了一些链接，关于该文章引发的一些讨论。
date: 2017-09-25
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



## 延伸

- [A simpler way to returning the "current" type in Scala](https://gist.github.com/odersky/56323c309a186cffe9af)

- [https://twitter.com/odersky/status/594888877854302208](https://twitter.com/odersky/status/594888877854302208)