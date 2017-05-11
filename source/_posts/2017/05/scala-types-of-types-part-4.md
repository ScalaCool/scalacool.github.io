---
title: <译> Scala 类型的类型（四）
author: Yison
tags:
- 类型相关
- 翻译
description: Scala 中并没有像 Java 一样支持枚举语法，但我们可以使用一些技巧（植入到 Enumeration）来写出类似的东西。
date: 2017-05-23
---

## 上一篇

[Scala 类型的类型（三）](http://scala.cool/2017/05/scala-types-of-types-part-3/)

## 目录

- [16. 枚举](#16-枚举)
- [17. 值类](#17-值类)
- [18. 类型类](#18-类型类)
- [19. 自类型注解](#19-自类型注解)
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

## 17. 值类

值类型（Value Class）在 Scala 内部存在了很长时间，并且你也已经使用过它们很多次了。因为 Scala 中所有的 Number 都使用这个编译器技巧来避免数字值的包装和拆装的过程，比如从 `int` 到 `scala.Int` 等。提醒下你回想一下 `Array[Int]` ，它其实在 JVM 中是 `int[]` ，（如果你对 bytecode 熟悉，会知道它是 JVM 的一种运行时类型：`[I]`）它 会有蛮多性能方面的影响。总的来说，数字的数组性能很好，但引用的数组就没那么快了。

好的，我们现在知道了编译器可以在不必要的时候通过奇技淫巧来避免将 `ints` 包装成 `Ints` 。因此让我们来看看 Scala 在 2.10.x 之后是如何将这个特性展示给我们的。这个特性被称为「值类」，可以相当简单地应用到你现有的类当中。使用它们就像将 `extends AnyVal` 加到你的类中一样方便，同时将遵循下面将提及的新规则。如果你不熟悉 `AnyVal` ，这可能是一个很好的学习机会 — 你可以查看 [通用类型系统 — Any, AnyRef, AnyVal](http://localhost:4000/2017/03/scala-types-of-types-part-1/#4-通用类型系统-—-Any-AnyRef-AnyVal)。

让我们实现一个 `Meter` 来作为我们的例子，它将实现一个原生 `int` 的包装 ，并支持将以「meter」为单位的数字转化为以 `Foot` 类型的数字。我们需要上一课，因为没人理解皇室的制度 ;-)  。不过，如果 95% 的时候都使用原生的 meter 值，为什么我们要因为让一个对象包含一个 `int` 而支付额外的运行时开销？（每个实例都有好几个字节！）是因为这是一个面向欧洲市场的项目？我们需要「值类」的救援！

```scala
case class Meter(value: Double) extends AnyVal {
  def toFeet: Foot = Foot(value * 0.3048)
}

case class Foot(value: Double) extends AnyVal {
  def toMeter: Meter = Meter(value / 0.3048)
}
```

我们将在所有的例子中使用样例类（值类），但它在技术上不是硬性要求的（尽管非常方便）。虽然你也可以通过在一个普通类使用 `val` 来实现一个值类，相比样例类通常会是最佳方案。你可能会问「为什么只有一个参数」，这是因为我们会尽量避免去包装值，这对于单个值是有意义的，否则我们就必须在某些地方保持一个元组，这样很快就会变得含糊，同时我们也将失去「不包装」策略下的性能。因此记住，值类仅适用于一个值，虽然没人可以说这个参数必须是一个原始类型，它也可以是一个普通类，如 `Fruit` 或 `Person` ，我们有时候依旧可以避免在值类中进行包装。

> 所有你在定义一个值类时需要做的，就是拥有一个包含「继承 `AnyVal`变量」的类，同时遵循一些它的限制。这个变量不一定就是原始类型，它可以是任何东西。这些限制换句话说，就是一个更长的列表，比如一个值类型不能包含除了 `def` 成员外的其它字段，并且不能被扩展，等等。完整的限制清单以及更深入的例子，可以参加 Scala 文档 — [Value Classes - summary of limitations])(http://docs.scala-lang.org/overviews/core/value-classes.html#summary_of_limitations) 。

好了，现在我们拥有了 `Meter` 和 `Foot` 值样例类，我们首先检查下当添加了 `extends AnyVal` 部分之后，生成的字节码如何使 `Meter` 从一个普通的样例类，变成一个值类：
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

为值类生成的字节码如下：
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

有一件事情应该引起我们的重视，就是当 `Meter` 作为一个值类被创建时，它的伴生对象获得了一个新的方法 — `toFeet$extension(double): Foot` 。

## 18. 类型类

> ❌ 该章节作者尚未完成，或需要修改

## 19. 自类型注解

## 20. 幽灵类型


