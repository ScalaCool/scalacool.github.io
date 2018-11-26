title: Cats（三）：高阶类型
author: Yison
tags: 
- Cats
- 函数式编程
- Kotlin
- ~Cats
- ^Yison
description: 本篇文章会介绍 Scala 中的高阶类型，以及用它来简单介绍 Functor，并在 Kotlin 中模拟实现类似的效果。
date: 2018-11-26
---

我们已经知道函数式是一种更加抽象的编程思维方式，它所做的事情就是高度抽象业务对象，然后对其进行组合。

谈及抽象，你在 Java 中会经常接触到一阶的参数多态，这也是我们所熟悉的泛型。利用泛型多态，在很大程度上可以减少大量相同的代码。然而，当我们需要更高阶的抽象的时候，泛型也避免不了代码冗余。如你所知，标准库中的`List`、`Set`等都实现了`Iterable`接口，它们都有相同的方法如`filter`、`remove`。

现在我们来尝试通过泛型设计`Iterable`：

```scala
    trait Iterable[T] {
      def filter(p: T ⇒ Boolean): Iterable[T]
      def remove(p: T ⇒ Boolean): Iterable[T] = filter (x ⇒ !p(x))
    }
```

当我们用`List`去实现`Iterable`时，由于`filter`、`remove`方法需要返回具体的容器类型，你需要重新实现这些方法：

```scala
    trait List[T] extends Iterable[T] {
    def filter(p: T ⇒ Boolean): List[T]
      override def remove(p: T ⇒ Boolean): List[T] = filter (x ⇒ !p(x))
    }
```

相同的道理，`Set`也需要重新实现`filter`和`remove`方法：

```scala
    trait Set[T] extends Iterable[T] {
    def filter(p: T ⇒ Boolean): Set[T]
      override def remove(p: T ⇒ Boolean): Set[T] = filter (x ⇒ !p(x))
    }
```
如上所示，这种利用一阶参数多态的技术依旧存在代码冗余。现在我们停下来想一想，假使类型也能像函数一样支持高阶，也就是可以通过类型来创造新的类型，那么多阶类型就可以上升到更高的抽象，从而进一步消除冗余的代码—这便是我们接下来要谈论的高阶类型（higher-order kind）。

## 高阶类型：用类型构造新类型

要理解高阶类型，我们需要先了解什么是「类型构造器（type constructor）」。探讨到构造器，你应该非常熟悉所谓的「值构造器（value constructor）」。

很多情况下，值构造器可以是一个函数，我们可以给一个函数传递一个值参数，从而构造出一个新的值。就像这样子：
```scala
    (x: Int) => x
```

作为比较，类型构造器就可以为传递一个类型变量，然后构造出一个新的类型。比如`List[T]`，当我们传入Int时，就可以产出`List[Int]`类型。

在上述例子中，值构造函数的返回结果x是具体的值，`List[T]`传入类型变量后，也是具体的类型（如`List[Int]`）。当我们讨论「一阶」概念的时候，具体的值或信息就是构造的结果。

因此，我们可以进一步推导：
- **一阶值构造器**：通过传入一个具体的值，然后构造出另一个具体的值；
- **一阶类型构造器**：通过传入一个具体的类型变量，然而构造出另一个具体的类型。

在理解了上述的概念之后，我们就更好地理解高阶函数了。它突破了一阶值构造器，可以支持传入一个值构造器，或者返回另一个值构造器。如：

```scala
    { (x: Int => Int) => x(1) }
    { x: Int => {y: Int => x + y} }
```
同样的道理，高阶类型就可以支持传入构造器变量，或是构造出另一个类型构造器。我们可以定义一种类型构造器`Container`，然后将其作为另一个类型构造器Iterable的类型变量：
```scala
    trait Iterable[T, Container[X]]
```
然后，我们再用这种假设的语言特性重新实现下`List`、`Set`，会惊喜地发现冗余的代码消失了：

```scala
    trait Iterable[T, Container[X]] {
      def filter(p: T ⇒ Boolean): Container[T]
      def remove(p: T ⇒ Boolean): Container[T] = filter (x ⇒ !p(x))
    }
    
    trait List[T] extends Iterable[T, List]
    trait Set[T] extends Iterable[T, Set]
```
这样就可以写出更加抽象和强大的代码。

## 高阶类型和Typeclass

相信你已经有点感觉到高阶类型的强大之处，那么它有哪些具体应用呢？

事实上，在Haskell中高阶类型特性天然了催生了这门语言中一项非常强大的语言特性—Typeclass。接下来我们用Scala这门语言，来实现一个很常见的Typeclass例子—Functor（函子）。

> 关于什么是Typeclass可以阅读 [https://scala.cool/2017/09/subtyping-vs-typeclasses-2/](https://scala.cool/2017/09/subtyping-vs-typeclasses-2/)

## 函子：高阶类型之间的映射

当你第一次接触到“函子”这个概念的时候，可能会有点怵，因为函数式编程非常近似数学，更准确地说，函数式编程思想的背后理论，是一套被叫做范畴论的学科。

> 范畴论是抽象地处理数学结构以及结构之间联系的一门数学理论,以抽象的方法来处理数学概念,将这些概念形式化成一组组的「物件」及「态射」。

然而，你千万不要被这些术语吓到。因为本质上他们是非常容易理解的东西。我们先来看看上面提到的“映射”，你肯定在学习集合论的时候遇到过它。在编程中，函数其实就可以看成是具体类型之间的映射关系。那么，当我们来理解函子的时候，其实只要将其看成是高阶类型的参数类型之间的映射，就很容易理解了。

下面我们来用Scala定义一个高阶类型Functor：
```scala
    trait Functor[F[_]] {
      def fmap[A, B](fa: F[A], f: A => B): F[B] 
    }
```
现在来分析下Functor的实现：

- Functor支持传入类型变量F，这也是一个高阶类型；

- Functor中实现了一个fmap方法，它接收一个类型为`F[A]`的参数变量`fa`，以及一个函数f，通过它我们可以把fa中的元素类型A映射为B，即`fmap`方法返回的结果类型为`F[B]`。

如果你仔细思考，会发现Functor的应用非常广泛。举个例子，我们希望将一个`List[Int]`中的元素都转化为字符串，下面我们就来看看在Scala中，如何让`List[T]`集成Functor的功能：

```scala
implicit val ListFunctor = new Functor[List] {
        def fmap[A,B](f:A=>B): List[A] => List[B] = list =>list map f
    }
```

## 在Kotlin中用扩展方法实现Typeclass

现在我们打算做个挑战——实现一个Kotlin版本的Functor。然而Kotlin不支持高阶类型，像前文例子`Functor[F[_]]`中的`F[_]`在Kotlin中并没有与之对应概念。

庆幸的是Jeremy Yallop和Leo White曾经在论文[《Lightweight higher-kinded polymorphism》](https://www.cl.cam.ac.uk/~jdy22/papers/lightweight-higher-kinded-polymorphism.pdf)中阐述了一种模拟高阶类型的方法。

我们以Functor为例来看看这种方法是如何模拟出高阶类型的。

```kotlin
    interface Kind<out F, out A>
    
    interface Functor<F> {
      fun <A, B> Kind<F, A>.map(f: (A) -> B): Kind<F, B>
    }
```

首先我们定义了类型 Kind<out F, out A>来表示类型构造器F应用类型参数A产生的类型，当然F实际上并不能携带类型参数。

接下来我们看看这个高阶类型如何应用到具体类型中，为此我们自定义了List类型，如下：

```kotlin
    sealed class List<out A> : Kind<List.K, A> {
      object K
    }
    object Nil : List<Nothing>()
    data class Cons<A>(val head: A, val tail: List<A>) : List<A>()
```

`List`有两个状态构成，一个是`Nil`代表空的列表，另一个`Cons`表示由`head`和`tail`连接而成的列表。

注意到List实现了`Kind<List.K, A>`，代入上面Kind的定义，我们得到`List<A>`是类型构造器`List.K`应用类型参数`A`之后得到的类型。由此我们就可以用`List.K`代表`List`这个高阶类型。

回到Functor的例子，我们很容易设计`List`的Functor实例：

```kotlin
    @Suppress("UNCHECKED_CAST", "NOTHING_TO_INLINE")
    inline fun <A> Kind<List.K, A>.unwrap(): List<A> =
        this as List<A>
    
    object ListFunctor: Functor<List.K> {
      override def fun <A, B> Kind<List.K, A>.map(f: (A) -> B): Kind<List.K, B>  {
        return when (this) {
          is Cons -> {
            val t = this.tail.map(f).unwrap()
            Cons<B>(f(this.head), t)
          }
          else -> Nil
         }
      }
    }
```
如上面例子所示，我们就构造出了`List`类型的Functor实例。现在还差最后的关键一步：如何使用这个实例。

众所周知，Kotlin无法将object内部的扩展方法直接import进来，也就是说以下的代码是不行的：

```kotlin
    import ListFunctor.*
    
    Cons(1, Nil).map{ it + 1}
```
我们没法将定义在object里的扩展方法直接import，庆幸的是Kotlin中的receiver机制可以将object中的成员引入作用域，所以我们只需要使用`run`函数，就可以使用这个实例。

```kotlin
    ListFunctor.run {
      Cons(1, Nil).map { it + 1 }
    }
```