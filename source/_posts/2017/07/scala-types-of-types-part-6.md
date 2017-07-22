---
title: <译> Scala 类型的类型（六）
author: Yison
tags:
- 类型相关
- 翻译
description: 让我们开始来讨论这个类型，这次要借助下「集合论」，然后把我们已经学过的 A with B 当做一个「交集类型」。
date: 2017-07-26
---

## 上一篇

[Scala 类型的类型（五）](http://scala.cool/2017/07/scala-types-of-types-part-5/)

## 目录

- [26. 联合类型](#26-联合类型)
- [27. 延迟初始化](#27-延迟初始化)
- [28. 动态类型](#28-动态类型)
- [29. 参考条目及感谢](#29-参考条目)

## 26. 联合类型

> ❌ 本部分尚未完成，但你可以通过 Miles 的博客（下方有链接）获得更多了解 :-)

让我们开始来讨论这个类型，这次要借助下「集合论」，然后把我们已经学过的 `A with B` 当做一个「交集类型」。

为什么呢？因为只有同时带有类型 `A` 和类型 `B` 的对象才能符合这个类型，因此在集合论中，它将是一个交集。此外，我们思考下什么是「联合类型」。

这是两个集合的联合，逐集看每个元素的类型要么是 `A` 或者 `B`。我们的任务是使用 Scala 类型系统来引入这样的类型。虽然它们不是 Scala 中的第一等构造（不是内置的），我们也可以很容易地实现和使用它们。**Miles Sabin** 在博客中在 Scala 中通过「 Curry-Howard 同构」深入地解释了这一技术，如果你比较好奇，可以去看看。

```scala
type |∨|[T, U] = { type λ[X] = ¬¬[X] <:< (T ∨ U) }

def size[T : (Int |∨| String)#λ](t : T) = t match {
    case i : Int => i
    case s : String => s.length
}
```

## 27. 延迟初始化

自从我们开始讨论 Scala 中的「奇异类型」，我们就会安排专门的章节来介绍每一个类型。延迟初始化（Delayed Init）实际上只是一种编译器的技巧而已，它对类型系统而言并不是非常重要。但是一旦你理解了它，就会明白 `scala.App` 是如何运作的，所以看看下面的例子吧：

```scala
object Main extends App {
  println("Hello world!")
}
```

查看这段代码，根据我们已知的 Scala 基础知识，我们会下这样结论：「那么，`println` 是在 `Main` 类的构造函数中！」。这通常是对的，**但在这里却并不是这样的**，因为 `App` 继承了 `DelayedInit` 特质：

```scala
trait App extends DelayedInit {
  // code here ...
}
```

让我们来看看延迟初始化的特质的完整源代码：

```scala
trait DelayedInit {
  def delayedInit(x: => Unit): Unit
}
```

正如你所见，它并没有包含任何的实现 — 所有围绕它的工作实际上都是编译器执行的，它将以一种特殊的方式来对待「继承了 `DelayedInit`」的类和单例（注：特质不会像这样一样重写）。

特殊待遇是这样子的：
- 假设你的类/单例主体是一个函数，在主体中做所有的事情
- 编译器为你创建了这个函数，并将它传递给了延迟初始化方法（x: => Unit），

我们马上来举个例子，手动来重新实现一遍 `App` 为我们自动做的事情（在 `delayedInit` 的帮助下）：

```scala
// we write:
object Main extends DelayedInit {
  println("hello!")
}

// the compiler emits:
object Main extends DelayedInit {
  def delayedInit(x: => Unit = { println("Hello!") }) = // impl is left for us to fill in
}
```

使用这种机制，你可以随时运行你的类的主体。我们已经了解了延迟初始化如何工作，接下来再来实现下我们自己版本的 `scala.App` 吧（这实际上也是以相同方式实现的）。

```scala

  override def delayedInit(body: => Unit) {
    initCode += (() => body)
  }

  def main(args: Array[String]) = {
    println("Whoa, I'm a SimpleApp!")

    for (proc <- initCode) proc()

    println("So long and thanks for all the fish!")
  }
}

                                // Running the bellow class would print print:
object Test extends SimpleApp { //
                                // Whoa, I'm a SimpleApp!
  println("  Hello World!")     //   Hello World!
                                // So long and thanks for all the fish!
}
```

## 28. 动态类型

我曾拿不定主意是否要介绍这种类型。最后我还是加入了它，因为这样对类型的介绍会更完整。所以问题是，我为什么会犹豫不决呢？

**Scala 允许我们在一个静态、严格类型的语言中也有动态类型！**这就是为什么我之前跳过它，并留一个单独的部分来解释它的原因 — 因为它基本上 hack 了所有之前提及的描述。让我们看看它的实际操作，以及如何融入到 Scala 的类型生态系统中。

想想一个包含任意 JSON 数据的类 `JsonObject`，同时有个可以匹配 JSON 对象的键的方法，返回一个 `Option[JValue]`，这个 JValue 可以是另一个 `JObject`、`JArray` 或 `JString` / `JNumber`，用法请看下述例子。

在此之前，记住先给指定的文件（或 REPL ）开启这个语言特性。有一些特性（如实验宏）需要显式地被引入到目标文件。如果你想了解更多，看看 [scala.language](http://www.scala-lang.org/api/current/index.html#scala.language$)  或者阅读 Scala 改进计划 [SIP-18](https://docs.google.com/document/d/1nlkvpoIRkx7at1qJEZafJwthZ3GeIklTFhqmXMvTX9Q/edit) 。

```scala
// remember, that we have to enable this language feature by importing it!
import scala.language.dynamics
```

```scala
// TODO: Has missing implementation
class Json(s: String) extends Dynamic {
  ???
}

val jsonString = """
  {
    "name": "Konrad",
    "favLangs": ["Scala", "Go", "SML"]
  }
"""

val json = new Json(jsonString)

val name: Option[String] = json.name
// will compile (once we implement)!
```

所以，我们如何将其与静态类型语言进行匹配呢？答案很简单 — 编译器重写和一个特殊的标记特质：`scala.Dynamic` 。

好了，最后回到基本的问题上。那么，我们如何使用动态呢？事实上，通过实现一些「魔术」方法来使用它：

- **applyDynamic**
- **applyDynamicNamed**
- **selectDynamic**
- **updateDynamic**

让我们来看一看（以上每个都有例子，我们将从最典型的开始讲起，然后转移到那些允许以上构造函数的例子），同时让其能够运作。

### 28.1 applyDynamic

好了，第一个神奇的方法如下：

```scala
// applyDynamic example
object OhMy extends Dynamic {
  def applyDynamic(methodName: String)(args: Any*) {
    println(s"""|  methodName: $methodName,
                |args: ${args.mkString(",")}""".stripMargin)
  }
}

OhMy.dynamicMethod("with", "some", 1337)
```

**applyDynamic** 采用了方法名作为参数。很显然，我们必须按照它们的顺序来访问。这里很好地构建了一些字符串，我们的实现只会打印被调用的方法，这样真的就能得到我们执行的时的值和方法名吗？输入如下：

```scala
methodName: dynamicMethod,
  args: with,some,1337
```

### 28.2 applyDynamicNamed

好吧，这很容易，但我们并不能很好地控制参数的名字。如果我们能够书写 JSON 的节点，岂不妙哉！事实证明我们可以！

```scala
// applyDynamicNamed example
object JSON extends Dynamic {
  def applyDynamicNamed(name: String)(args: (String, Any)*) {
    println(s"""Creating a $name, for:\n "${args.head._1}": "${args.head._2}" """)
  }
}

JSON.node(nickname = "ktoso")
```
这次除了值的列表外，我们还得到了它们的名字。这个例子的结果如下：

```
Creating a node, for:
"nickname": "ktoso"
```

我可以很轻易地想到可以基于此创建一些花哨的 DSL 。

### 28.3 selectDynamic



## 29. 参考条目及感谢