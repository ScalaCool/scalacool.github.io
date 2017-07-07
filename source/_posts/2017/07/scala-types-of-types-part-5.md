---
title: <译> Scala 类型的类型（五）
author: Yison
tags:
- 类型相关
- 翻译
description: 结构类型（Strucural Types）经常被描述为「类型安全的鸭子类型（duck typing）」，这在直觉上是一个很好的比喻。
date: 2017-07-14
---

## 上一篇

[Scala 类型的类型（四）](http://scala.cool/2017/07/scala-types-of-types-part-4/)

## 目录

- [21. 结构类型](#21-结构类型)
- [22. 路径依赖类型](#22-路径依赖类型)
- [23. 类型投影](#23-类型投影)
- [24. Specialized Types](#19-自身类型注解)
- [25. Type Lambda](#20-幽灵类型)

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