---
title: <译> Scala 类型的类型（三）
author: Yison
tags:
- 类型相关
- 翻译
description: 现在我们来深入了解「类型别名」的使用场景 — 抽象类型成员。有了抽象类型成员，我们就可以说「我希望有人告诉我某个类型 — 我将通过名称 MyType 来引用它」。
date: 2017-05-04
---

## 上一篇

[Scala 类型的类型（二）](http://yison.me/page/scala-types-of-types/part-2)

## 目录

- [11. 抽象类型成员]()
- [12. 自递归类型]()
- [13. 类型构造器]()
- [14. 高阶类型]()
- [15. 样例类]()

## 11. 抽象类型成员

现在我们来深入了解「类型别名」的使用场景 — 抽象类型成员（Abstract Type Member）。

有了抽象类型成员，我们就可以说「我希望有人告诉我某个类型 — 我将通过名称 MyType 来引用它」。抽象类型成员最基本的功能就是让我们能够定义泛型类（模板），但却不是通过使用 `class Clazz[A, B]` 这种语法，而是在类里面进行命名，就像这样子：

```scala
trait SimplestContainer {
  type A      // Abstract Type Member

  def value: A
}
```

对于学习 Java 的朋友来说，这在语法上有点类似 `Container<A>` ，但在 「路径独立类型」 的章节中我们会发现它其实是更强大的。以下的例子也可以说明这一点。

需要注意到的关键点是，当命名中包含了关键字 `abstract` ，它的表现行为并不跟「抽象字段」一样 — 因此你仍然可以在不「实现」类型成员 `A` 的前提下创建一个 `SimplestContainer` 的新实例：
```scala
new SimplestContainer // valid, but A is "anything"
```

你可能会想知道类型 `A` 是什么，因为我们没有在任何地方提供关于它的任何信息。然而实际上 `type A` 无非只是 `type A >: Nothing <: Any` 的一个缩写而已，它可以代表「任何东西」。
```scala
object IntContainer extends SimplestContainer {
  type A = Int

  def value = 42
}
```

所以我们使用类型别名「提供了一个类型」，现在我们可以实现这个 `value` 方法，返回一个 `Int` 。

更有趣的事情是我们对「抽象类型成员」进行约束的时候。假设你想要一个容器，只能存储一个 `Number` 的任何示例。我们可以在定义一个抽象类型成员的地方注释以下的约束：
```scala
trait OnlyNumbersContainer {
  type A <: Number
  def value: A
}
```

或者我们可以稍后在类的结构中添加约束，比如通过在一个特质中混入xxxx：
```scala
trait SimpleContainer {
  type A
  def value: A
}

trait OnlyNumbers {
  type A <: Number
}

val ints = new SimpleContainer with OnlyNumbers {
  def value = 12
}

// bellow won't compile
val _ = new SimpleContainer with OnlyNumbers {
  def value = "" // error: type mismatch; found: String(""); required: this.A
}
```

因此，就如你看到的，我们可以像使用「类型变量」一样使用「抽象类型成员」，但是却不必像前者一样到处显式传递，因为它不是一个字段。虽然这里需要付出一点代价 — 我们需要给这些类型取名字。

## 12. 自递归类型