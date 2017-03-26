---
title: <译> Scala 类型的类型（二）
author: Yison
tags:
- 类型相关
- 翻译
description: Scala 的 object 是通过 class 实现的（显然后者是 JVM 的基础构件）。然而你也会发现我们并不能像一个简单的类一样，轻松地获得一个 object 的类型……
date: 2017-04-02
---

## 上一篇

[Scala 类型的类型（一）](http://yison.me/page/scala-types-of-types/part-1)

## 目录

- [6. 一个 ``object`` 的类型]()
- [7. Scala 中的型变]()
- [8. Refined Types (refinements)]()
- [9. Package Object]()
- [10. Type Alias]()

## 6. 一个 ``object`` 的类型

Scala 的 ``object`` 是通过 ``class`` 实现的（显然后者是 JVM 的基础构件）。然而你也会发现我们并不能像一个简单的类一样，轻松地获得一个 ``object`` 的类型……

我常常疑惑该如何传一个 ``object`` 给一个方法，对此我自己也非常惊讶。我的意思是指 ``obj: ExampleObj`` 是无效的，因为这种情况 ``ExampleObj`` 已经指向了实例，所以它有个 ``type`` 的成员，我们可以靠它解决问题。

下面的代码解释了大概的方法：
```scala
object ExampleObj

def takeAnObject(obj: ExampleObj.type) = {}

takeAnObject(ExampleObj)
```



## 7. Scala 中的型变

型变，通常可以解释成类型之间依靠彼此的「兼容性」，形成一种继承的关系。最常见的例子就是当你要处理「容器」或「函数」的时候，有时就必须要处理型变（极其的常见！）。

Scala 跟 Java 一个重大的差异，就是它的「容器类型」默认是不可变的！也就是说，如果你有一个定义为 ``Box[A]`` 的容器，然后在使用的时候将其中的类型参数 ``A`` 替换成 ``Fruit``，之后你就不能插入类型 ``Apple``（这也是一种 ``Fruit`` 类型）。

Scala 中的型变通过在「类型参数」前使用 ``+`` 和 ``-`` 符号来定义。

参见：[http://www.slideshare.net/dgalichet/demystifying-scala-type-system](http://www.slideshare.net/dgalichet/demystifying-scala-type-system)。

| 概念   | 描述                 | Scala 语法 |
| ---- | ------------------ | -------- |
| 非型变的 | C[T'] 与 C[T] 是不相干的 | C[T]     |
| 协变的  | C[T'] 是 C[T] 的子类   | C[+T]    |
| 逆变的  | C[T] 是 C[T'] 的子类   | C[-T]    |

以上的表格比较抽象地表明了所有我们需要担心的型变情况。也许你还在疑惑什么时候你需要关心这些？事实上，当你每次处理 collection 的时候就遭遇到了，你必须思考「这是一个协变吗？」。

> 大部分不可变的 collection 是协变的，而大多数可变的 collection 是逆变的。

在 Scala 中（至少）有两个不错并很直观的例子。一个是「any collection」，我们将使用 `List[+A]` 来举例；另一个就是「函数」。

当我们讨论 Scala 中的 `List` 时，通常指的是 `scala.collection.immutable.List[+A]` ，它不可变，且是协变的。让我们看看这与「构建一个包含不同类型成员的 list」有什么联系。

```scala
class Fruit
case class Apple() extends Fruit
case class Orange() extends Fruit

val l1: List[Apple] = Apple() :: Nil
val l2: List[Fruit] = Orange() :: l1

// and also, it's safe to prepend with "anything",
// as we're building a new list - not modifying the previous instance

val l3: List[AnyRef] = "" :: l2
```

值得一提的是，当存在**不可变的 collection 时，协变是安全的**。如果 collection 可变，则不成立。这里典型的例子是 `Array[T]`，它是逆变的。下面就来看看「逆变」对我们来说意味着什么，以及它是如何让我们免于错误：

```scala
// won't compile
val a: Array[Any] = Array[Int](1, 2, 3)
```

因为 `Array` 的逆变，这样一个赋值操作就不会被编译。假使这个赋值被通过了，我们就陷入麻烦了。我们会写出这样子的代码：`a(0) = "" // ArrayStoreException!`，这将引发可怕的 `ArrayStoreException` 失败。

> 我们曾说过在 Scala 中「大部分」不可变的 collection 是协变的。如果你想知道一个「相反是逆变」的特例，它是 `Set[A]` 。



### 7.1 特质（trait） —  如同「带有实现的接口」

首先，让我们看看关于「特质」最简单的一个问题：我们如何将多个特质混入到一个类型中，就像如果你来自 Java，会把这叫做实现这些「带有实现的接口」一样：

```scala
class Base { def b = "" }
trait Cool { def c = "" }
trait Awesome { def a ="" }

class BA extends Base with Awesome
class BC extends Base with Cool

// as you might expect, you can upcast these instances into any of the traits they've mixed-in
val ba: BA = new BA
val bc: Base with Cool = new BC

val b1: Base = ba
val b2: Base = bc

ba.a
bc.c
b1.b
```

截止目前的内容，你应该相对比较好理解。现在我们就要讨论「钻石问题」了，熟悉 C++ 的朋友可能一直都比较期待吧。「钻石问题」（菱形继承问题）主要描述的是在「多重继承」的时候，我们「无法明确想要继承什么」的处境。如果你认为特质类似多重继承一样，下图揭示了这个问题。



### 7.2 类型线性化 VS 钻石问题

