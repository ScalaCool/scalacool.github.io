---
title: <译> Scala 类型的类型（四）
author: Yison
tags:
- 类型相关
- 翻译
description: Scala 中并没有像 Java 一样支持枚举语法，但我们可以使用一些技巧（植入到 Enumeration）来写出类似的东西。
date: 2017-06-15
---

## 上一篇

[Scala 类型的类型（三）](http://scala.cool/2017/05/scala-types-of-types-part-3/)

## 目录

- [16. 枚举](#16-枚举)
- [17. value 类](#17-value-类)
- [18. 类型类](#18-类型类)
- [19. 自身类型注解](#19-自类型注解)
- [20. 幽灵类型](#20-幽灵类型)

## 16. 枚举

Scala 中并没有像 Java 一样支持枚举语法，但我们可以使用一些技巧（植入到 Enumeration）来写出类似的东西。

### 16.1. Enumeration

在 Scala 2.10.x 版本中可以通过使用 `Enumeration` 来实现「类枚举」的结构。
``` scala
object Main extends App {

① object WeekDay extends Enumeration {               
②    type WeekDay = Value                             
③    val Mon, Tue, Wed, Thu, Fri, Sat, Sun = Value    
  }
④  import WeekDay._                                   

  def isWorkingDay(d: WeekDay) = ! (d == Sat || d == Sun)

⑤  WeekDay.values filter isWorkingDay foreach println 
}
```

① 首先我们声明一个单例来包含我们的枚举值，它必须继承 `Enumeration`

② 在这里，我们为 `Enumeration` 内部的 `Value` 类型定义一个 [类型别名](http://scala.cool/2017/04/scala-types-of-types-part-2/#10-类型别名) ，因为我们需要取一个匹配单例名字的名字，后面可以始终通过「WeekDay」来引用它。（是的，这几乎是一个 hack ）

③ 在这里，我们采用了「多重赋值」，因此每个 `val` 左边的变量都被赋值了一个不同的 `Value` 类型的实例

④ 这个 `import` 带来了两点：不仅支持了在没有 `WeekDay` 前缀的情况下直接使用 `Mon` ，同时也在这个作用域中引入了 `type WeekDay` ，于是我们可以在下方的方法定义中使用它

⑤ 最后，我们获得了一些 `Enumeration` 的方法，这些并不是魔术，当我们创建新的 `Value` 实例时，大部分动作都会发生

正如你所见，Scala 中的枚举机制并不是内置的，而是通过巧妙地借助类型系统来实现。对于一些使用场景，这也许已经足够了。但当遇到需要增加枚举值以及往每个值增加行为的时候，它就不能像 Java 那样强大了。

### 16.2. @enum

> `@enum` 注解现在已经不仅仅只是一个提议了， 已经处在 Scala 内部的讨论进程中了：[Enumeration must DIE...](https://groups.google.com/forum/#!topic/scala-internals/8RWkccSRBxQ%5B1-25%5D)

`@enum` 注解可能会跟「注解宏」一起，在将来被支持。在 Scala 改进计划文档中有关于此的描述：[enum-sip](http://ktoso.github.io/scala-types-of-types/#enumeration-2) 。
```scala
@enum
class Day {
  Monday    { def goodDay = false }
  Tuesday   { def goodDay = false }
  Wednesday { def goodDay = false }
  Thursday  { def goodDay = false }
  Friday    { def goodDay = true  }
  def goodDay: Boolean
}
```

## 17. value 类

value 类型（Value Class）在 Scala 内部存在了很长时间，并且你也已经使用过它们很多次了。因为 Scala 中所有的 Number 都使用这个编译器技巧来避免数字值的装箱和拆箱的过程，比如从 `int` 到 `scala.Int` 等。提醒下你回想一下 `Array[Int]` ，它其实在 JVM 中是 `int[]` ，（如果你对 bytecode 熟悉，会知道它是 JVM 的一种运行时类型：`[I]`）它 会有蛮多性能方面的影响。总的来说，数字的数组性能很好，但引用的数组就没那么快了。

好的，我们现在知道了编译器可以在不必要的时候通过奇技淫巧来避免将 `ints` 装箱成 `Ints` 。因此让我们来看看 Scala 在 2.10.x 之后是如何将这个特性展示给我们的。这个特性被称为「value 类」，可以相当简单地应用到你现有的类当中。使用它们简单到只要把 `extends AnyVal` 加到你的类中，同时遵循以下将提及的新规则。如果你不熟悉 `AnyVal` ，这可能是一个很好的学习机会 — 你可以查看 [通用类型系统 — Any, AnyRef, AnyVal](http://localhost:4000/2017/03/scala-types-of-types-part-1/#4-通用类型系统-—-Any-AnyRef-AnyVal)。

让我们实现一个 `Meter` 来作为我们的例子，它将实现一个原生 `int` 的包装 ，并支持将以「meter」为单位的数字转化为以 `Foot` 类型的数字。我们需要上一课，因为没人理解皇室的制度 ;-)  。不过，如果 95% 的时候都使用原生的 meter 值，为什么我们要因为让一个对象包含一个 `int` 而支付额外的运行时开销？（每个实例都有好几个字节！）是因为这是一个面向欧洲市场的项目？我们需要「value 类」的救援！

```scala
case class Meter(value: Double) extends AnyVal {
  def toFeet: Foot = Foot(value * 0.3048)
}

case class Foot(value: Double) extends AnyVal {
  def toMeter: Meter = Meter(value / 0.3048)
}
```

我们将在所有的例子中使用样例类（value 类），但它在技术上不是硬性要求的（尽管非常方便）。虽然你也可以通过在一个普通类使用 `val` 来实现一个 value 类，相比样例类通常会是最佳方案。你可能会问「为什么只有一个参数」，这是因为我们会尽量避免去包装值，这对于单个值是有意义的，否则我们就必须在某些地方保持一个元组，这样很快就会变得含糊，同时我们也将失去「不包装」策略下的性能。因此记住，value 类仅适用于一个值，虽然没人可以说这个参数必须是一个原始类型，它也可以是一个普通类，如 `Fruit` 或 `Person` ，我们有时候依旧可以避免在 value 类中进行包装。

> 所有你在定义一个 value 类时需要做的，就是拥有一个包含「继承 `AnyVal`变量」的类，同时遵循一些它的限制。这个变量不一定就是原始类型，它可以是任何东西。这些限制换句话说，就是一个更长的列表，比如一个 value 类型不能包含除了 `def` 成员外的其它字段，并且不能被扩展，等等。完整的限制清单以及更深入的例子，可以参加 Scala 文档 — [Value Classes - summary of limitations])(http://docs.scala-lang.org/overviews/core/value-classes.html#summary_of_limitations) 。

好了，现在我们拥有了 `Meter` 和 `Foot` 值样例类，我们首先检查下当添加了 `extends AnyVal` 部分之后，生成的字节码如何使 `Meter` 从一个普通的样例类，变成一个 value 类：
```scala
// case class
scala> :javap Meter

public class Meter extends java.lang.Object implements scala.Product,scala.Serializable{
    public double value();
    public Foot toFeet();
    // ...
}

scala> :javap Meter$
public class Meter$ extends scala.runtime.AbstractFunction1 implements scala.Serializable{
    // ... (skipping not interesting in this use-case methods)
}
```

为 value 类生成的字节码如下：
```scala
// case value class

scala> :javap Meter
public final class Meter extends java.lang.Object implements scala.Product,scala.Serializable{
    public double value();
    public Foot toFeet();
    // ...
}

scala> :javap Meter$
public class Meter$ extends scala.runtime.AbstractFunction1 implements scala.Serializable{
    public final Foot toFeet$extension(double);
    // ...
}
```

有一件事情应该引起我们的重视，就是当 `Meter` 作为一个 value 类被创建时，它的伴生对象获得了一个新的方法 — `toFeet$extension(double): Foot` 。在这个方法成为 `Meter` 类的实例方法之前，它没有任何参数（所以它是：`toFeet(): Foot`）。生成的方法被标记为「extension」（`toFeet$extension`），实际上这也是我们给这些方法所取得名字。（ .NET 开发者已经看到这种趋势了）

由于我们的 value 类的目标是避免必须分配整个 value 类对象，从而直接跟包装后的值打交道，所以我们必须停止使用实例方法，因为它们将迫使我们产生一个包装（ `Meter` ）类的实例。我们能做的事情是，将这个实例方法变成一个「扩展方法」，它将存储在 `Meter` 的伴生对象中。我们通过传入 `Double` 类型值，而不是使用实例的 `value: Double` 来调用这个扩展方法。

> **扩展方法**的作用跟**隐式转换**类似（后者是一个更通用，以及更强大的武器），但它是更加简单的一种方式 — 避免了必须分配整个包装后的对象。相对的，隐式转换会需要它来提供「额外的方法」。扩展方法有点采用「重写生成的方法」的路线，以便它们将「要扩展的类型」作为它们第一个参数。举个例子，假如你写了 `3.toHexString` ，这个方法会通过一个隐式转换被添加到 `Int` ，然而由于目标是 `class RichInt extends AnyVal` ，所以一个 value 类的调用并不会导致 `RichInt` 的分配，而是会被重写成 `RichInt$.$MODULE$.toHexString$extension(3)`，这样子就避免了 `RichInt` 的分配。

让我们用新学习到的知识来调查下在 `Meter` 的例子中，编译器到底为我们做了什么。源码旁边注释的部分解释了编译器实际上生成的东西。（如此来发现代码运行时发生了什么）：

```scala
// source code                 // what the emited bytecode actualy does

① val m: Meter  = Meter(12.0)    // store 12.0                                      
② val d: Double = m.value * 2    // double multiply (12.0 * 2.0), store             
③ val f: Foot   = m.toFeet       // call Meter$.$MODULE$.toFeet$extension(12.0)     
```

① 有人可能会期待在这里分配一个 `Meter` 对象，然而由于我们正在使用一个 value 类，只有被包装的值被存储 — 即我们在运行时一直在处理的一个原生 `double` 值。（赋值和类型检查依旧会验证这是否个 `Meter` 实例）

② 在这里，我们访问了 value 类的 `value`（这个字段名的名字没有关系）。请注意，运行时这里操作的是原生的 `doubles` ，因此不必像往常一个普通的样例类一样，调用一个 `value` 的方法。

③ 这里，我们似乎在调用一个定义在 `Meter` 里的实例方法，然而事实上，编译器已经用一个扩展方法调用代替了这个调用，它在 12.0 这个值中传递。我们获得了一个 `Foot` 实例… 等一下！但是 `Foot` 这里也被定义成了一个 value 类，所以在运行时我们再次得到了一个原生 `double` ！

这些都是「扩展方法」和 「value 类」的基础知识。如果你想阅读更多，了解不同的边界情况，请参考[官方关于 value 类的章节](http://docs.scala-lang.org/overviews/core/value-classes.html)，Mark Harrah 在这里用了很多例子，解释得很好。所以除了基本介绍外，我就不再重复劳动了。

## 18. 类型类

> ❌ 该章节作者尚未完成，或需要修改

类型类（Type Class）属于 Scala 中可利用的最强大的模式，可以总结为（如果你比较喜欢华丽的措施）「临时多态」。等到本章结束之后，你就可以理解它了。

Scala 为我们解决的典型的问题就是，在无需显式绑定两个类的前提下，提供可拓展的 API 。举一个严格绑定的例子，我们不使用类型类，如扩展一个 `Writable` 接口，为了让我们自定义的数据类型可写：

```scala
// no type classes yet
trait Writable[Out] {
  def write: Out
}

case class Num(a: Int, b: Int) extends Writable[Json] {
  def write = Json.toJson(this)
}
```

使用这种风格，只是扩展和实现了一个接口，我们将 `Num` 转化为 `Writable` ，同时我们也必须提供 `write` 的实现，「必须在这里马上实现」，这使得其他人难以提供不同的实现 — 它们必须继承实现一个 `Num` 子类。这里的另一个痛点是，我们不能从一个相同的特质继承两次，提供不同的序列化目标（你不能同时继承 `Writable[Json]` 和 `Writable[Protobuf]`）。

所有这些问题都可以通过基于类型类的方法解决，而不是直接继承 `Writable[Out]` 。让我们试一试，并详细解释下这到底是如何做的：

```scala
① trait Writes[In, Out] {                                               
    def write(in: In): Out
  }

② trait Writable[Self] {                                               
    def write[Out]()(implicit writes: Writes[Self, Out]): Out =
      writes write this
  }

③ implicit val jsonNum = Writes[Num, Json] {                            
    def (n1: Num, n2: Num) = n1.a < n1.
  }

case class Num(a: Int) extends Writable[Num]
```

① 首先我们定义下类型类，它的 API 跟之前的 `Writable` 特质类似，但我们保持分离，而不是将它们混合到一个写入的类中。这是为了知道我们用「自类型注解」定义了什么

② 接下来我们将我们的 `Writable` 特质改为使用 `Self` 进行参数化，并将「目标序列化类型」移动到 `write` 的签名中。它现在还需要一个隐式的 `Writes[Self, Out]` 实现，它将处理序列化 — 这就是我们的类型类

③ 这是类型类的实现。请注意，我们将实例标记为 `implicit` ，所以

Universal traits 是 `extend Any` 的特质，它们应该只有 `def` ，并且没有初始化代码。

> 这里作者还需要有很多补充

## 19. 自身类型注解



## 20. 幽灵类型


