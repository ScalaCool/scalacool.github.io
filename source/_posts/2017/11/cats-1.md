title: Cats（一）：从函数式编程思维谈起
author: Yison
tags: 
- Cats
- 函数式编程
description: 如果你看到一个开源类库，logo 是四只猫 + 五个箭头，可能会略感不适 — 这是工程代码里可以使用的玩意儿吗？
date: 2017-11-30
---

![Cats logo](https://scala.cool/images/2017/11/cats-logo.png)

如果你看到一个开源类库，logo 是四只猫 + 五个箭头，可能会略感不适 — 这是工程代码里可以使用的玩意儿吗？

没错，这是 [TypeLevel](https://typelevel.org/) 设计的一个函数式类库，一群推崇函数式编程的家伙注入到 Scala 生态中的重磅炸弹，它是 [Cats](https://typelevel.org/cats/index.html)，源于 Category（范畴）的缩写。

在 [水滴](https://drip.im) 的系统中，我们大规模使用了 Cats 来解决一些业务问题，并且从中受益。但显然这并不是 Scala 标准库所支持的打法，所以本系列旨在系统地介绍这个类库，让更多人了解它。

> 我们最开始使用的是 [Scalaz](https://github.com/scalaz/scalaz)，它是 Cats 的前身，由于语法问题导致很多吐槽，之后采用 Cats 替代。

当然，很多了解过 Cats 的人知道，关于它已经有以下这些优秀的学习资料：

- [herding cats](http://eed3si9n.com/herding-cats/)，同样也是 [learning scalaz](http://eed3si9n.com/learning-scalaz/) 的作者。
- [Scala with Cats Book](http://underscore.io/books/advanced-scala/)，出自 underscore.io

但显然，如果之前并没有函数式编程经验的同学，可能会在首次阅读这些资料的时候犯困。因此，该系列希望在正式介绍 Cats 这个神器之前，先友好地探讨一些关于「函数式编程」的基本问题。如：

- 什么是函数式编程
- 函数式编程有哪些特点
- 函数式编程有哪些优点

## 函数式编程？

那么，什么才是函数式编程呢？其实，关于这点并没有准确权威的定义，本文也不想就此给出一个答案。

但是，我们希望来讨论下什么是「函数式编程思维」，它跟我们熟知的「命令式编程」到底有哪些不同。

经常上知乎的朋友发现了，这是知乎上一个非常好的问题。

[什么是函数式编程思维？— 知乎](https://www.zhihu.com/question/28292740)

本文推荐以下的回答：

@nameoverflow:
**函数式编程关心数据的映射，命令式编程关心解决问题的步骤。**

更数学化的版本：
@parker liu
**函数式编程关心类型（代数结构）之间的关系，命令式编程关心解决问题的步骤。**


### 总结
函数式编程的思维就是如何将类型（代数结构）之间的关系组合起来，用数学的构造主义构造出你设计的程序。

### 疑问

我们来解剖这个结论，直观上函数式编程是一件非常简单的事情，我们只需做一件事情就够了，那就是「组合」。

但此时，我们肯定又变得一头雾水，以下问题紧接着就来了：

- 真的有这么简单吗？
- 到底什么是「组合」呢？
- 在理论上，它真能做到完备性吗？
- 什么才是所谓的「关系」呢？

别急，我们先来讨论一个基本的问题 — **什么是过程和数据？**

## 过程和数据

看过 [SICP](https://book.douban.com/subject/1148282/) 的朋友肯定已经发现，这是这本书第一章和第二章所研究的内容。

简单来说，数据是一种我们希望去操作的东西，而过程就是有关操作这些数据的规则的描述。它们构成了程序设计的基本元素。

在 Lisp 这种函数式编程语言中，过程和数据一样，属于第一级状态，这也就意味着：
- 可以用变量命名
- 可以提供给过程作为参数
- 可以作为过程的结果返回
- 可以包含在其它的数据结构中

举个例子，我们可以定义一个过程，它接受的参数是一个过程，返回的是另外一个过程，这似乎看起来有点怪。
换个例子，定义一个过程，它接受的参数是一个数，返回的是另外一个数，这是不是就熟悉多了？

在函数式编程中，我们会发现其实「过程」和「数据」的界限有时候是模糊的。也就是说，有时我们可以把它们当作一个东西。

回到我们刚才的结论：「函数式编程关心类型（代数结构）之间的关系」。

我们于是可以这么理解，函数式编程要解决的第一个问题：**就是需要足够高的抽象能力，能对各种数据和过程进行抽象，提供类型（代数结构）**。

这也同样是后续我们在学习 Cats 过程中要获得解答的一个疑问，它是如何帮助我们实现这一点。

> 推荐阅读 @shaw 写的 [如何在 Scala 中利用 ADT 良好地组织业务](https://scala.cool/2017/03/how-to-use-algebraic-data-type-in-scala-development/)

## 图灵完备与 Lambda 演算

其次，我们再来讨论下，到底什么是所谓的「关系」?

我们肯定有这样子的疑惑，如果函数式编程思维仅靠「组合」就能够描述所有的程序，那么在理论上它必须具备完备性。

不少朋友知道所谓的 [图灵完备](https://en.wikipedia.org/wiki/Turing_completeness)。它听起来逼格很高，其实这是一个很简单的概念，意味着用图灵机能做到的所有事情，可以解决所有的可计算问题。

另外一个可支持解决所有可计算问题的方案就是「Lambda 演算」。在 Lisp 这种函数式编程语言中的基石，就是这个理论。

函数式编程中的 lambda 可以看成是两个类型之间的关系，一个输入类型和一个输出类型。lambda 演算就是给 lambda 表达式一个输入类型的值，则可以得到一个输出类型的值，这是一个计算，计算过程满足 \alpha -等价和 \beta -规约。

关于图灵完备和 Lambda 演算，有机会我们可以在后续的文章中继续讨论。

## 面向组合子编程

我们再来聊聊核心，所谓的「组合」。

「面向组合子编程」是十年前 javaeye 的牛人 @Ajoo 提出的概念。

首先，我们可以引用哲学的基本方法来比喻我们常见的「面向对象编程」与「面向组合子编程」差异。

**前者是归纳法，后者是演绎法**。

也就说，我们在用 Java 这些面向对象的语言进行程序设计的时候，通常采用的是总结的方法，然而函数式编程语言提倡的「组合」，更贴近数学的思维，它是一种推导。

所以，函数式编程所关心的组合，更多做的是先高度抽象类型关系，然后对这些关系的转化，所谓的 transformer。

于是，我们得出第二个关键的问题：**即 Cats 如何提供足够的 transformer，来帮助我们实现各种关系之间的组合**。

## 举例

对于第一次接触这些概念的朋友来说，还是有点抽象，下面我们来举一个实际的例子来加深认识。

假设我们现在要设计一个抽奖活动的参与过程，涉及以下逻辑：
- 获取活动奖品数据
- 判断活动的开始、进行、结束、奖品是否抢光等状态

### 命令式风格

```scala
import org.joda.time.DateTime
import scala.concurrent.Future

case class Activity(id: Long, start: DateTime, end: DateTime)
case class Prize(id: Long, name: String, count: Int)

val activity = syncGetActivity()
val prizes = syncGetPrizes(activity.id)

if (activity.start.isBefore(DateTime.now())) {
  println("activity not starts")
} else if (activity.end.isBefore(DateTime.now())) {
  println("activity ends")
} else if (prizes.map(_.count).sum < 1) {
  println("activity has no prizes")
} else {
  println("activity is running")
}
```

### 函数式风格

```scala
import org.joda.time.DateTime
import scala.concurrent.Future

case class Activity(id: Long, start: DateTime, end: DateTime)
case class Prize(id: Long, name: String, count: Int)

sealed trait ActivityStatus {
  val activity: Activity
  val prizes: Seq[Prize]
}
case class ActivityNotStarts(activity: Activity, prizes: Seq[Prize]) extends ActivityStatus
case class ActivityEnds(activity: Activity, prizes: Seq[Prize]) extends ActivityStatus
case class ActivityPrizeEmpty(activity: Activity, prizes: Seq[Prize]) extends ActivityStatus
case class ActivityRunning(activity: Activity, prizes: Seq[Prize]) extends ActivityStatus

def getActivityStatus(): Future[ActivityStatus] = {
  for {
    activity <- asyncGetActivity()
    prizes <- asyncGetPrizes(activity.id)
  } yield (activity, prizes) match {
    case (a, pzs) if a.start.isBefore(DateTime.now()) => ActivityNotStarts(a, pzs)
    case (a, pzs) if a.end.isBefore(DateTime.now()) => ActivityNotStarts(a, pzs)
    case (a, pzs) if pzs.map(_.count).sum < 1 => ActivityPrizeEmpty(a, pzs)
    case (a, pzs) => ActivityRunning(a, pzs)
  }
}
```

以上，我们可以发现函数式风格，会倾向于基于更高的业务层次进行抽象，直觉上是一个 **describe what** 的设计，而不是 **how to do**。

值得一提的是，`asyncGetActivity` 这个从数据库异步获取活动数据过程，它的类型是一个高阶类型 `Future[Activity]`，这也就是我们之前提到的对过程进行抽象，定义类型。

通过对 `asyncGetActivity` 和 `asyncGetPrizes` 两个异步过程的组合，我们最终转化得到了 `ActivityStatus` 这个类型的对象结果。

## 总结

Scala 是一门结合「面向对象」和「函数式」的编程语言，我们用它可以写出截然不同的代码风格。很多人把它当作 better Java 来使用，但如果结合 Cats 这个函数式类库，我们就可以更好地采用函数式编程思维来设计程序，从而发挥 Scala 更大的威力。

通过该篇文章，我们对函数式编程有了直觉上的感受。当然，你可能依旧云里雾里，不要紧，我们会在后续的文章里进一步的讨论。在下一篇文章中，我们会介绍下函数式编程所带来的优势。


