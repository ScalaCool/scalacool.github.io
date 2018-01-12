---
title: <译> Scala 类型的类型（二）
author: Yison
tags:
- 类型相关
- 翻译
- ~Scala 类型的类型
description: Scala 的单例对象是通过 class 实现的（显然后者是 JVM 的基础构件）。然而你也会发现我们并不能像一个简单的类一样，轻松地获得一个 object 的类型……
date: 2017-04-20
---

## 上一篇

[Scala 类型的类型（一）](http://scala.cool/2017/03/scala-types-of-types-part-1/)

## 目录

- [6. 一个单例对象的类型](#6-一个单例对象的类型)
- [7. Scala 中的型变](#7-Scala-中的型变)
- [8. Refined Types (refinements)](#8-Refined-Types-refinements)
- [9. 包对象](#9-包对象)
- [10. 类型别名](#10-类型别名)

## 6. 一个单例对象的类型

Scala 的单例对象（ `object`） 是通过 `class` 实现的（显然后者就像 JVM 的基础构件）。然而你也会发现我们并不能像一个简单的类一样，轻松地获得一个单例对象的类型……

我常常疑惑该如何传一个单例对象给一个方法，对此我自己也非常惊讶。我的意思是指 ``obj: ExampleObj`` 是无效的，因为这种情况 ``ExampleObj`` 已经指向了实例，所以它有个 ``type`` 的成员，我们可以靠它解决问题。

下面的代码解释了大概的方法：
```scala
object ExampleObj

def takeAnObject(obj: ExampleObj.type) = {}

takeAnObject(ExampleObj)
```



## 7. Scala 中的型变


| 术语  | 翻译 |
| ---- | ------------------ |
| Variance |  型变 |
| Invariant  | 不变  |
| Covariant  | 协变  |
| Contravariant  | 逆变   |
| Immutable  | 不可变的  |
| Mutable  |  可变的  |

> 上述表格由译者自主添加，避免造成误解。

型变，通常可以解释成类型之间依靠彼此的「兼容性」，形成一种继承的关系。最常见的例子就是当你要处理「容器」或「函数」的时候，有时就必须要处理型变（极其的常见！）。

Scala 跟 Java 一个重大的差异，就是它的「容器类型」默认是不变的！也就是说，如果你有一个定义为 `Box[A]` 的容器，然后在使用的时候将其中的类型参数 `A` 替换成 ``Fruit``，之后你就不能插入一个 `Apple` 类型（`Fruit` 子类）的值。

Scala 中的型变通过在「类型参数」前使用 ``+`` 和 ``-`` 符号来定义。

参见：[http://www.slideshare.net/dgalichet/demystifying-scala-type-system](http://www.slideshare.net/dgalichet/demystifying-scala-type-system)。

| 概念   | 描述                 | Scala 语法 |
| ---- | ------------------ | -------- |
| 不变  | C[T'] 与 C[T] 是不相干的 | C[T]     |
| 协变  | C[T'] 是 C[T] 的子类   | C[+T]    |
| 逆变  | C[T] 是 C[T'] 的子类   | C  [-T]    |

以上的表格较抽象地罗列了所有我们需要担心的型变情况。也许你还在疑惑什么时候需要关心这些，事实上当你每次处理 collection 的时候就遇到了 — 你必须思考「这是一个协变吗？」。

> 大部分不可变的 collection 是协变的，而大多数可变的 collection 是不变的。

在 Scala 中至少有两个不错并很直观的例子。一个是 collection，我们将使用 `List[+A]` 来举例；另一个就是「函数」。

当我们讨论 Scala 中的 `List` 时，通常指的是 `scala.collection.immutable.List[+A]` ，它是不可变的，且是协变的。让我们看看这与「构建一个包含不同类型成员的 list」有什么联系。

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

值得一提的是，当存在**不可变的 collection 时，协变是安全的**。如果 collection 可变，则不成立。这里典型的例子是 `Array[T]`，它是不变的。下面就来看看「不变」对我们来说意味着什么，以及它是如何让我们免于错误：

```scala
// won't compile
val a: Array[Any] = Array[Int](1, 2, 3)
```

因为 `Array` 的不变，这样一个赋值操作就不会被编译。假使这个赋值被通过了，我们就陷入麻烦了。我们会写出这样子的代码：`a(0) = "" // ArrayStoreException!`，这将引发可怕的 `ArrayStoreException` 失败。

> 我们曾说过在 Scala 中「大部分」不可变的 collection 是协变的。如果你想知道一个「相反是不变」的特例，它是 `Set[A]` 。



### 7.1 特质（trait）— 可以带有实现的接口

首先，让我们看看关于「特质」最简单的一个问题：我们如何将多个特质混入到一个类型中，就像如果你来自 Java，会把这叫做「接口实现」一样：

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

目前而言，你应该都比较好理解。现在让我们来讨论下「钻石问题」，熟悉 C++ 的读者可能一直在期待吧。钻石问题（菱形继承问题）主要描述的是在「多重继承」的情况下，我们「无法明确想要继承什么」的处境。如果你认为特质也类似多重继承一样，下图揭示了这个问题。

### 7.2 类型线性化 VS 钻石问题

<center>
![Diamond Inheritance](/images/2017/04/diamond-inheritance.png)
</center>

要说明「钻石问题」，我们只要有一个 `B`、`C` 中的覆盖实现就行了。当我们调用 `D` 中的 `common` 方法的时候，产生了歧义 — 我们到底是继承了 `B` 还是 `C` 的方法？在 Scala 里，如果仅仅只有一个覆盖方法的情况下，这个问题很简单 — 就是这个覆盖方法。但假使是更复杂的情况呢？让我们来研究一下：

- class `A` 定义了方法 `common` ，返回 `a`  ；
- trait `B` 覆盖 `common` ，返回 `b` ；
- trait `C` 覆盖 `common` ，返回 `c` ；
- class `D` 同时继承 `B` 和 `C` ;
- 请问 `D` 继承了谁的 `common` ？到底是 `C` ，还是 `B` ？

这种歧义是每个「多重继承」机制的痛点之一，Scala 通过一种称为「类型线性化」的手段来解决这个问题。
换句话说，在一个钻石类结构中，我们总是可以明确地决定在 `D` 中要调用的 `common` 方法。我们先来看看下面这段代码，再来讨论线性化：

```scala
trait A { def common = "A" }

trait B extends A { override def common = "B" }
trait C extends A { override def common = "C" }

class D1 extends B with C
class D2 extends C with B
```

结果如下：

```scala
(new D1).common == "C"

(new D2).common == "B"
```

之所以会这样，是由于 Scala 在这里为我们采用了类型线性化规则。算法如下：

- 首先构建一个类型列表，第一个元素就是我们首要线性化的类型（译者注：刚开始列表是空的）；
- 将每个超类型递归地展开，然后把所有的类型放入到此列表中（这应该是扁平的，而不是嵌套的）；
- 删除结果列表的重复项，从左到右对列表进行扫描，删除已经存在的类型；
- 操作完成。

让我们将这个算法人肉地应用到我们的钻石实例当中，来验证为什么 `D1 extends B with C`（以及 `D2 extends C with B`）
会产生那样的结果：

```scala
// start with D1:
B with C with <D1>

// expand all the types until you rach Any for all of them:
(Any with AnyRef with A with B) with (Any with AnyRef with A with C) with <D1>

// remove duplicates by removing "already seen" types, when moving left-to-right:
(Any with AnyRef with A with B) with (                            C) with <D1>

// write the resulting type nicely:
Any with AnyRef with A with B with C with <D1>
```

显然，当我们调用 `common` 方法时，可以很容易决定我们想要调用的版本：我们只需看一下线性化的类型，并尝试从右边的线性化类型结果中解析出来。在 `D1` 的例子中，实现 `common` 的特质是 `C`，所以它覆盖了 `B` 提供的实现。在 `D1` 中调用 `common` 的结果将是 `"c"` 。

你可以认真考虑在 `D2` 上尝试这种方法 — 如果你运行代码，它应该会先后对 `C` 和 `B` 进行线性化，从而产生一个为 `"b"` 的结果。并且，你也可以简单地利用「最右取胜」的原则来简化线性化规则的理解，但尽管这个有用，却并没有展现整个算法的全貌。

值得一提的是，我们也可以通过这种技术来获知「谁是我们的超类？」。如同在线性化类型中「朝左看」一样简单，你就能知道任何类的超类是谁。所以在我们的 `D1` 例子中，`C` 的超类是 `B` 。


## 8. Refined Types (refinements) 

Refinements 可以很简单地理解为「匿名的子类化」。所以在源代码中，可以是类似这个样子：

```scala
class Entity

trait Persister {
  def doPersist(e: Entity) = {
    e.persistForReal()
  }
}

// our refined instance (and type):
val refinedMockPersister = new Persister {
  override def doPersist(e: Entity) = ()
}
```



## 9. 包对象

Scala 在 2.8 版本中引入了包对象（`Package Object`），这本身并没有真的拓展了类型系统。但包对象们提供了一种相当有用的模式，可以一起引入一堆东西，此外编译器也会在它们那寻找隐式的值。

声明一个包对象很简单，只要一起使用 `package` 和 `object` 关键字就行了，就像这样子：

```scala
// src/main/scala/com/garden/apples/package.scala

package com.garden

package object apples extends RedApples with GreenApples {
  val redApples = List(red1, red2)
  val greenApples = List(green1, green2)
}

trait RedApples {
  val red1, red2 = "red"
}

trait GreenApples {
  val green1, green2 = "green"
}
```

约定上，我们将包对象们定义在 `package.scala` 中，然后放置到目标 package 下。你可以通过调查上述例子的文件源路径以及 package 来加深理解。

从使用方面来说，这带来了真正的好处。因为当你引入包的时候，你也随之引入了在包中定义的所有状态：

```scala
import com.garden.apples._

redApples foreach println
```


## 10. 类型别名

类型别名（Type Alias）并不是另一种类型，而是一种我们提高代码可读性的技巧。

```scala
type User = String
type Age = Int

val data:  Map[User, Age] =  Map.empty
```

通过这样的技巧，Map 的定义一下子变得很清晰。如果我们仅仅只使用一个 `Sting => Int` 的 map，代码的可读性就不那么好了。虽然我们仍旧可以坚持使用我们的原始类型（也许是出于如性能方面的考虑），但使用别名能让这个类后续的读者更容易理解。

> 注意，当你要为一个类创建别名的时候，**并不会**为它的伴生对象也建立别名。举个例子，假使你定义了 `case class Person(name: String)` 以及一个别名 `type User = Person`，调用 `User("John")` 就会出错。因为 `Person` 的伴生对象并没有别名，就不能如预期般有效调用 `Person("John")`，后者会隐式地触发伴生对象中的 `apply` 方法。

## 下一篇

[Scala 类型的类型（三）](http://scala.cool/2017/05/scala-types-of-types-part-3/)
