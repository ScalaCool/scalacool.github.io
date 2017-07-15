---
title: <译> Scala 类型的类型（五）
author: Yison
tags:
- 类型相关
- 翻译
description: 结构类型（Strucural Types）经常被描述为「类型安全的鸭子类型（duck typing）」，这在直觉上是一个很好的比喻。
date: 2017-07-17
---

## 上一篇

[Scala 类型的类型（四）](http://scala.cool/2017/07/scala-types-of-types-part-4/)

## 目录

- [21. 结构类型](#21-结构类型)
- [22. 路径依赖类型](#22-路径依赖类型)
- [23. 类型投影](#23-类型投影)
- [24. Specialized Types](#24-Specialized-Types)
- [25. Type Lambda](#25-Type-Lambda)

## 21. 结构类型

结构类型（Strucural Types）经常被描述为「类型安全的鸭子类型（duck typing）」，这在直觉上是一个很好的比喻。

迄今为止，我们在类型方面考虑的都是这样的问题：「x 继承接口 y 吗？」，有了「结构类型」，我们就可以深入一步，开始推理一个指定对象的结构（名字的由来）。当使用了结构类型，我们在检查一个类型是否匹配的时候，我们需要转变问题为：「这里存在带有这种签名的方法吗？」。

让我们举一个很常见的例子，来看看它为什么如此强大。想象你有多种事物可以被 **closed** 掉，在 Java 里，一个人通常会继承 `java.io.Closeable` 接口，以此来支持写出一些通用的 `Closeable` 工具类（事实上，**Google Guava** 就有这样的一个类）。现在再想象另外有个人也继承了一个 `MyOwnCloseable` 类，但是并没有继承 `java.io.Closeable` 。由于静态类型的缘故，你的 `Closeables` 类库就会出问题，你就不能传 `MyOwnCloseable` 的实例给它。让我们使用结构类型来解决这个问题：
```scala
type JavaCloseable = java.io.Closeable
// reminder, it's body is: { def close(): Unit }

class MyOwnCloseable {
  def close(): Unit = ()
}


// method taking a Structural Type
def closeQuietly(closeable: { def close(): Unit }) =
  try {
    closeable.close()
  } catch {
    case ex: Exception => // ignore...
  }


// accepts a java.io.File (implements Closeable):
closeQuietly(new StringReader("example"))

// accepts a MyOwnCloseable
closeQuietly(new MyOwnCloseable)
```

这个结构类型被作为某个方法的一个参数。基本上可以说，我们对这个类型唯一的期望就是它应该存在内部这样一个方法 — 因此这个类型的定义并不是一个精确的匹配，而是关于一些方法的最小集合，只有这样做才能够合法。

另外需要注意的是，**使用结构类型对运行时性能存在很大的负面影响，因为实际上它是通过反射实现的**。我们这里不再通过字节码来调查了，记住调查 scala （或 java）类生成的字节码是一件很容易的事情，只需使用 :javap in the Scala REPL ，所以你应该自己试一试。

在我们进入下一个话题之前，再来一个短小精炼的总结提示。想象你的结构类型相当的大，比如是一个类型代表某种事物，你可以打开它，使用它，然后必须关闭。通过使用一个带有结构类型的类型别名，我们就可以从这个方法中分离类型定义，如下：
```scala
type OpenerCloser = {
  def open(): Unit
  def close(): Unit
}

def on(it: OpenerCloser)(fun: OpenerCloser => Unit) = {
  it.open()
  fun(it)
  it.close()
}
```

通过使用这样一个类型别名，`def` 的部分变得更加清晰了。我极力推荐这种「对更大结构类型进行类型别名」的做法，同时也最后提醒大家，确认自己是否真的需要采用结构类型，而没有其它办法了，多考虑负面的性能影响。

## 22. 路径依赖类型

这个类型（Path Dependent Type）允许我们在另外的一个类中对某个类型进行「类型检查」，这看起来似乎比较奇怪，但以下的代码会让它变得直观：
```scala
class Outer {
  class Inner
}

val out1 = new Outer
val out1in = new out1.Inner // concrete instance, created from inside of Outer

val out2 = new Outer
val out2in = new out2.Inner // another instance of Inner, with the enclosing instance out2

// the path dependent type. The "path" is "inside out1".
type PathDep1 = out1.Inner


// type checks

val typeChecksOk: PathDep1 = out1in
// OK

val typeCheckFails: PathDep1 = out2in
// <console>:27: error: type mismatch;
// found   : out2.Inner
// required: PathDep1
//    (which expands to)  out1.Inner
//       val typeCheckFails: PathDep1 = out2in
```

这里你可以理解为「每个 Outer class 都有各自的 Inner class」。

使用这种类型很有用，我们能够强制从一个具体变量的内部去获得类型。一个具体的采用该类型的签名如下：
```scala
class Parent {
  class Child
}

class ChildrenContainer(p: Parent) {
  type ChildOfThisParent = p.Child

  def add(c: ChildOfThisParent) = ???
}
```

我们现在使用的路径依赖类型，已经被编码到了类型系统和逻辑中。这个 container 应该只包含 parent 的 children，而不是任何 parent 。

我们将很快在 [类型投影]() 章节中看到如何引入任何一个 parent 的 child 类型。

## 23. 类型投影

类型投影（Type Projections）类似「路径依赖类型」，可以支持在在一个内部类中引用一个类型。在语法上看，你可以组织内部类的路径结构，然后通过 `#` 符号分离开来。我们先来看看这些路径依赖类型（`.` 语法）和类型投影（`#` 语法）的第一个且主要的差别：
```scala
// our example class structure
class Outer {
  class Inner
}

// Type Projection (and alias) refering to Inner
type OuterInnerProjection = Outer#Inner

val out1 = new Outer
val out1in = new out1.Inner
```

另一个准确的直觉是相比「路径依赖」，「类型投影」可以用于「类型层面的编程」，如 （存在类型）Existential Types。

「存在类型」是跟「类型擦除」密切相关的东西，就是 JVM 层面而言，必须与之相处的玩意儿。
```scala
val thingy: Any = ???

thingy match {
  case l: List[a] =>
     // lower case 'a', matches all types... what type is 'a'?!
}
```
因为运行时类型被擦除了，所以我们不知道 `a` 的类型。我们知道 List 是一个类型构造器 `* -> *` ，所以肯定有某个类型，它可以用来构造一个有效的 `List[T]`。这个「某个类型」，就是 **存在类型**。

Scala 为它提供了一种快捷方式：
```scala
List[_]
 //  ^ some type, no idea which one!
```

假设你在使用一些抽象类型成员，在我们的例子中将会是一些 Monad 。我们想要强制我们类的使用者只能使用这个 Monad 中的 `Cool` 实例，因为比如我们的 Monad 只有针对这些类型才有意义。我们可以通过这些**存在类型 T** 的类型边界来实现：
```scala
type Monad[T] forSome { type T >: Cool }
```

[http://mikeslinn.blogspot.com/2012/08/scala-existential-types.html](http://mikeslinn.blogspot.com/2012/08/scala-existential-types.html)

## 24. Specialized Types

### 24.1. @specialized

类型专业化（Type specialization）与其说是「类型系统」范畴的普通东西，还不如说这只是一种性能方面的技巧。但尽管如此，如果你想编写出拥有良好性能的集合，它是非常重要的，我们需要掌握它。举个例子，让我们来实现一个非常有用的集合，叫做 `Parcel[A]`，它持有一个指定类型的 value — 确实非常有用！
```scala
case class Parcel[A](value: A)
```

以上是我们最基本的实现。有什么问题吗？没错，`A` 可以是任何东西。甚至假使我们只对 `Int` 值进行装箱，它就会被表示为一个 Java 对象。所以上面的 class 会导致对原始值进行装箱和拆箱，因为 container 在处理对象：
```scala
val i: Int = Int.unbox(Parcel.apply(Int.box(1)))
```

众所周知，除非真的需要，我们都应避免进行「装箱」操作，因为它通过在 `int` 和 `object Int` 之间进行来回转换，产生了更多运行时的工作。怎样才能消除这个问题呢？一种技巧就是将我们的 `Parcel` 对所有的原始类型进行「专业化」（这里拿 `Long` 和 `Int` 做例子就够了），如下：

> 如果你已经阅读过 [value 类]()，那么也许已经注意到 `Parcel` 可以用它很好地代替实现！确实如此。然而，`specialized` 在 Scala `2.8.1` 中就有了，相对地 value 类是在 `2.10.x` 才被引进。并且，前者能够专业化一种以上的 value（虽然它以指数级增长生成代码），value 类却只能限制为一种。

```scala
case class Parcel[A](value: A) {
  def something: A = ???
}

// specialzation "by hand"
case class IntParcel(intValue: Int) {
  override def something: Int = /* works on low-level Int, no wrapping! */ ???
}

case class LongParcel(intValue: Long) {
  override def something: Long = /* works on low-level Long, no wrapping! */ ???
}

```

`IntParcel` 和 `LongParcel` 的实现将有效地避开装箱，因为它们直接在原始值上进行处理，并且无需进入对象领域。现在我们只需根据我们的实例，选择想要的 `*Parcel`。

这看起来很好，但是代码基本上变得更难维护了。它有 `N` 个实现，每种我们需要支持的原始值类型各一个（如包括：`int`, `long`, `byte`, `char`, `short`, `float`, `double`, `boolean`, `void`, 再加上 `Object`）! 这需要维护很多样板。

既然我们已经熟悉了「类型专业化」，也知晓了手动实现它并不是很友好，就来看看 Scala 是如何通过引入 `@specialized` 注解来帮我们改善这个问题：
```scala
case class Parcel[@specialized A](value: A)
```

如上所示我们将 `@specialized` 注解应用到了类型参数 `A` 上，从而指示编译器生成该类的所有专业化变量，它们是：`ByteParcel`, `IntParcel`, `LongParcel`, `FloatParcel`, `DoubleParcel`, `BooleanParcel`, `CharParcel`, `ShortParcel`, `CharParcel` 甚至以及 `VoidParcel` （这并不是实际的名字，但你应该明白了大概的意思）。编译器也同时承担调用正确的版本，所以我们只需要专心写代码，而不必关心一个类是否被专业化了，编译器会尽可能使用适合的版本（如果可以的话）：
```scala
val pi = Parcel(1)     // will use `int` specialized methods
val pl = Parcel(1L)    // will use `long` specialized methods
val pb = Parcel(false) // will use `boolean` specialized methods
val po = Parcel("pi")  // will use `Object` methods
```

「太棒了，让我们尽情使用它」 — 这是大部分人发现「专业化」带来的好处之后的反应，因为它可以在降低内存使用率的同时成倍的加速低级操作。坏消息是，这也要付出不小的代价：当使用这些成倍数量的变量时代码量也变得十分巨大了，就像这样子：
```scala
class Thing[A, B](@specialized a: A, @specialized b: B)
```

在上面的例子中，我们使用了第二种应用专业化的风格 — 加在参数上，这效果等同于我们直接对 `A` 和 `B` 进行专业化。请注意，上述代码将生成 `8 * 8 = 64` 种实现，因为它必须处理如「A 是一个 `int`，B是一个 `int`」以及「A 是一个 `boolean`，但是 B 是一个 `long`」的情况 — 
事实上生成的类的数量大约在 `2 * 10^(nr_of_type_specializations)`，对于只有 3 个类型参数的情况，它也很容易达到了数千个类。

有一些方法可以防止这个「指数级爆炸」，例如通过限制专业化的目标类型。假设 `Parcel` 大部分情况只处理整数，从不跟浮点数打交道，我们就可以编译器只专业化 `Long` 和 `Int`，如：
```scala
case class Parcel[@specialized(Int, Long) A](value: A)
```

这次让我们使用 `:javap Parcel` 来研究一点字节码：
```java
// Parcel, specialized for Int and Long
public class Parcel extends java.lang.Object implements scala.Product,scala.Serializable{
    public java.lang.Object value(); // generic version, "catch all"
    public int value$mcI$sp();       // int specialized version
    public long value$mcJ$sp();}     // long specialized version

    public boolean specInstance$();  // method to check if we're a specialized class impl.
}
```

如你所见，编译器提供了额外的专业化方法，如 `value$mcI$sp()`，它将返回 `int` ， `long` 也有类似的方法。值得一提的是这里还有另外一个叫做 `specInstance$` 的方法，如果使用的实现是一个专业化的类，它会返回 `true` 。

可能你比较好奇当前在 Scala 中那些类被专业化了，它们有（可能不完整）：Function0, Function1, Function2, Tuple1, Tuple2, Product1, Product2, AbstractFunction0, AbstractFunction1, AbstractFunction2 。由于当前专业化 2 个参数的成本已经很高，一个趋势是我们不要再专业化更多的参数了，虽然我们可以这么干。

> 为什么我们要避免进行装箱，一个典型的例子就是「内存效率」。想象一个 `boolean` 值，如果它的存储只消耗 1 位那是极好的，不幸的是实际上并不是这样的（包含我了解的所有 JVM），例如在 HotSpot 上一个 `boolean` 被当做一个 `int`，所以它要占用 **4 个字节**的空间。它的兄弟 `java.lang.Boolean` 类似所有 Java 对象一样，则有 **8 字节**的对象头，然后再存储 `boolean` （额外增加 **4 字节**）。由于 **Java 对象布局的排列规则**，这个对象占用的空间再分配 **16 字节**（8 个字节给对象头，4 个字节给值，4 个字节给 padding）。这就是为啥我们希望避免装箱的另外一个悲伤的原因。

### 24.2. Miniboxing 

> ❌ 该章节作者尚未完成  

这不是 Scala 的一个特性，但是可以作为 scalac 的一个插件来使用。

> TODO, there’s a project from withing EPFL to make specialization more efficient: Scala Miniboxing

## 25. Type Lambda

> ❌ 该章节作者尚未完成

在 type lambda 的部分我们会使用 「路径依赖类型」及 「结构类型」，如果你忽略了这两个章节，你可以先跳回去看看。

在了解 Type Lambdas 之前，让我们先回顾下关于「函数」和「柯里化」的某些细节：
```scala
class EitherMonad[A] extends Monad[({type λ[α] = Either[A, α]})#λ] {
  def point[B](b: B): Either[A, B]
  def bind[B, C](m: Either[A, B])(f: B => Either[A, C]): Either[A, C]
}
```