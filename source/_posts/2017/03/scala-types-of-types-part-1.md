---
title: <译> Scala 类型的类型（一）
author: Yison
tags:
- 类型相关
- 翻译
description: 2013 年在几场 「JavaOne 大会」之后，掀起了一些关于 「Scala 类型」方面的热议，这篇博文也应运而生。我想我们缺少一个详尽的清单，来指明跟 Scala 类型打交道的方法，所以我决定总结下自己已有的经验，分享在 Scala 中为什么我们需要这些类型。
date: 2017-03-25 15:00
---

## 原文

[http://ktoso.github.io/scala-types-of-types/](http://ktoso.github.io/scala-types-of-types/)

## 目录

- [1. Scala 类型的不同类型](#1-Scala-类型的不同类型)
- [2. 写作进度](#2-写作进度)
- [3. Type Ascription](#3-Type-Ascription)
- [4. 通用类型系统 — Any, AnyRef, AnyVal](#4-通用类型系统-—-Any-AnyRef-AnyVal)
- [5. 底类型 - Nothing 与 Null](#5-底类型-Nothing-与-Null)

## 1. Scala 类型的不同类型

2013 年在几场 「JavaOne 大会」之后，掀起了一些关于 「Scala 类型」方面的热议，这篇博文也应运而生。  

在这些讨论声中，我发现不同的人在学习 Scala 的过程中，经常重复提出相同的问题。我想我们缺少一个详尽的清单，来指明跟 Scala 类型打交道的方法，所以我决定总结下自己已有的经验，分享在 Scala 中为什么我们需要这些类型。

## 2. 写作进度

尽管我写这篇文章已经有段时间了，但始终还有很多内容未完成。比如说「高阶类型」部分需要重新梳理，「Self Type」还得补充更多细节，等等等等。详情参见计划清单。

此外，如果你看到某个部分被打上了 ❌ ，则表示该部分需要修改或者是未完成。

## 3. Type Ascription

Scala 有「类型推导」，这意味着我们可以在源码中省略一些类型声明。在不显式声明类型的前提下，我们只要书写 `val` 或 `def` 就够了。

这种显式指定类型的行为，被称为 Type Ascription（有时候，也有叫作 Type Annotation，但这个名字很容易造成混淆，在 Scala 文档中并不这么使用）。

```scala
trait Thing
def getThing = new Thing { }

// without Type Ascription, the type is infered to be `Thing`
val infered = getThing

// with Type Ascription
val thing: Thing = getThing
```

在此类情况下，我们可以不使用 Type Ascription 。当然你也可以针对每个公有的方法显示声明返回类型（**一个非常好的习惯**），这能使让代码可读性更好。

你可以根据以下的提示问题，来决定是否使用 Type Ascription ：

**Q: 如果它是一个参数？**

A: 必须使用。

**Q: 如果它是一个公有方法的返回值？**

A: 为了更好的代码可读性，及输出类型的可控性，需要使用。

**Q: 如果它是一个递归或重载的方法？**

A: 必须使用。

**Q: 当你需要返回一个比隐式推导结果更通用的接口？**

A: 除非你愿意暴露实现细节，否则必须使用。

**除上述情况之外，则可以不必显式声明类型。**

补充说明：

使用 Type Ascription 可以加快编译的速度，通常我们也很乐意看到一个方法的返回类型。

好了，我们现在明白了 Type Ascription 大概是怎么一回事。讲完这个之后，我们继续接下来的话题，类型随之也会变得越来越有趣。

## 4. 通用类型系统 — Any, AnyRef, AnyVal

我们之所以说 Scala 的类型系统是通用的，是因为有一个「顶类型」— `Any` 。这与 Java 很不一样，后者存在叫做「原始类型」 ( `int` , `long` , `float` , `double` , `byte` , `char` , `short` , `boolean` ) 的特例，它们并不继承 Java 中类似顶类型的东西 `java.lang.Object`。

<center>
  ![Scala's Unified Types](/images/2017/03/scala-unified-types.png)
</center>

Scala 引入了 `Any` 作为所有类型共同的顶类型。`Any` 是 `AnyRef` 和 `AnyVal` 的超类。

`AnyRef` 面向 Java（JVM）的对象世界，它对应 `java.lang.Object` ，是所有对象的超类。

`AnyVal` 则代表了 Java 的值世界，例如 `int` 以及其它 JVM 原始类型。

正是依赖这种继承设计，我们才能够使用 `Any` 定义方法，同时兼容 `scala.int` 以及 `java.lang.String` 的实例。

```scala
class Person

val allThings = ArrayBuffer[Any]()

val myInt = 42             // Int, kept as low-level `int` during runtime

allThings += myInt         // Int (extends AnyVal)
                           // has to be boxed (!) -> becomes java.lang.Integer in the collection (!)

allThings += new Person()  // Person (extends AnyRef), no magic here
```

虽然在 JVM 层一旦遭遇 `ArrayBuffer[Any]` ，我们的 Int 实例就会被打包成对象。对于类型系统而言，这一切还算是透明的。我们可以通过 Scala REPL 和 `:javap` 来调查下上述的例子，这样子可以找到我们的测试类产生的代码。

```
35: invokevirtual #47  // Method myInt:()I
38: invokestatic  #53  // Method scala/runtime/BoxesRunTime.boxToInteger:(I)Ljava/lang/Integer;
41: invokevirtual #57  // Method scala/collection/mutable/ArrayBuffer.$plus$eq:(Ljava/lang/Object;)Lscala/collection/mutable/ArrayBuffer;
```

你将注意到 `myInt` 起初还是携带一个原始 `int` 类型的值。然后，在它即将被添加到 `ArrayBuffer` 的时候，scalac 植入了一个方法 `BoxesRunTime.boxToInteger:(I)Ljava/lang/Integer` （提醒下不是经常跟「字节码」打交道的读者，这个方法就是 `public Integer boxToInteger(i: int)`）。

通过这么一个智能的编译器，以及在这套公共继承体系中将所有东西都当成一个对象来处理，我们就能够摆脱「原始类型」这种边缘情况的纠缠，至少在我们的 Scala 源码中，编译器会为我们处理它。

当然在 JVM 层面，这种差异依旧存在。由于「原始类型」的操作更安全，同时占用更少的内存（对象明显要占用更多），scalac 会在尽可能的情况下使用原始类型。

另一方面，我们也可以限制一个方法只能采用轻量级的值类型：
```scala
def check(in: AnyVal) = ()

check(42)    // Int -> AnyVal
check(13.37) // Double -> AnyVal

check(new Object) // -> AnyRef = fails to compile
```

在上述例子中，我们使用了一个 TypeClass `Checker[T]` 与类型边界 (type bound)（后续会详谈）。总体思路就是这个方法只能采用 Value Classes ，如 Int 或我们自己的值类型。虽然这不是惯用的方法，但这展示了 Scala 的类型系统如何拥抱 Java 的原始类型，把它们引入到 “真正的” 类型系统里面，而不是像 Java 一样，仅仅将它们作为一个分离的情况存在。

## 5. 底类型 - Nothing 与 Null

在 Scala 中，一切皆有类型…… 但你是否想过，当遇到一些非正常的情况，比如抛出异常的时候，类型推导是如何保持正常运转，推断出合理的类型。

让我们通过以下的 `if/else throw` 的例子来一探究竟：
```scala
val thing: Int =
  if (test)
    42                             // : Int
  else
    throw new Exception("Whoops!") // : Nothing
```

正如你在注释里所看到的，`if` 块的返回类型是 `Int`（很明显），`else` 代码块的类型是 `Nothing`（有点意思）。推导器之所以能够推断 `thing` 的类型将永远是 `Int`，主要是 `Nothing` 类型的「底类型」性质在起作用。

> 一个关于「底类型」如何运作的准确直觉是：Nothing 继承了所有类型。

类型推导总是会寻找 `if` 语句两个逻辑分支的「共同类型」。因此如果 `else` 分支这里是一个继承所有类型的子类型，那么最终推断出来的结果自然会是第一个分支的类型。

```
Types visualized:

           [Int] -> ... -> AnyVal -> Any
Nothing -> [Int] -> ... -> AnyVal -> Any
```

同样的道理也适用于 Scala 中的第二个底类型 - ``Null`` 。

```scala
val thing: String =
  if (test)
    "Yay!"  // : String
  else
  	null    // : Null
```

``thing`` 的类型是预期的 `String`。 `Null` 遵循着跟 `Nothing` 几乎一样的规则。我将通过这个例子先探讨下 — 类型推导中 `AnyVal` 与 `AnyRef` 之间的区别。

```
Types visualized:

        [String] -> AnyRef -> Any
Null -> [String] -> AnyRef -> Any

infered type: String
```

让我们考虑下 `Int` 及其它不能兼容 `Null` 值的原始类型。我们在 REPL 中使用 `:type` 命令来调查这个情况（这样可以返回一个表达式的类型）。

```
scala> :type if (false) 23 else null
Any
```

这跟上面一个分支对象为 `String` 类型的例子不同。因为 `Null` 不像 `Nothing` 一样继承任何类型，我们来详细研究一下这里的类型。让我们再次使用 `:type` 命令来看看 `Int` 到底继承了什么：

```
scala> :type -v 12
// Type signature
Int

// Internal Type structure
TypeRef(TypeSymbol(final abstract class Int extends AnyVal))
```

`verbose` 参数在这里新增了一些信息，现在我们知道了 `Int` 是 一个 `AnyVal`，后者是个特殊的用于表示值类型的 `class`，它不能兼容 `Null`。如果我们看 `AnyVal` 的源码，我们将发现：

```
abstract class AnyVal extends Any with NotNull
```

我之所以要讲是这里，是因为 `AnyVal` 的核心功能在这里通过类型很好地表示出来了。**注意那个 `NotNull` 特质（trait）**。

回到主题，为什么上面 `if` 语句（两个逻辑分支的类型分别是 `AnyVal` 和 `null`）的公共类型是 `Any`，而不是其它。

用一句话来总结就是：

> Null 继承所有的 AnyRefs，而 Nothing 继承了一切。

由于 AnyVals （例如数字）跟 AnyRefs 并不在一个继承树中，一个数字与一个 `null` 值唯一的公共类型就是 `Any` ，这就解释了我们的例子。

```
Types visualized:

Int  -> NotNull -> AnyVal -> [Any]
Null            -> AnyRef -> [Any]

infered type: Any an object
```
