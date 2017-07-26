---
title: Scala 中的集合（三）：实现一个新的 Collection 类
author: Yison
tags:
- 集合
description: Scala 中的 collection 库符合 DRY 设计原则的典范，它包含了大量通用的集合操作 API，由此我们可以基于标准库，轻松构建出一个新的强大的集合类型。
date: 2017-08-01
---

Scala 中的 collection 库是符合 [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) 设计原则的典范，它包含了大量通用的集合操作 API，由此我们可以基于标准库，轻松构建出一个强大的新集合类型。

本文将介绍「如何实现一个新集合类」，在开始之前，我们先来了解下 Scala 2.8 版本后的集合结构设计。

## 集合通用设计

看过 [Scala 中的集合（一）](http://localhost:4000/2017/03/how-to-handle-collection-in-scala-1/) 的朋友已经知道，Scala 的集合类系统地区分了可变的和不可变的集合，它们存在于以下三个包中：

- scala.collection
- scala.collection.mutable
- scala.collection.immutable

然而，以上所有的集合都实现了两个相同的特质 — `Traversable` 和 `Iterable`（后者实现了前者）。

### Traversable

`Traversable` 是集合类最高级的特性，它具有一个抽象方法：

```scala
def foreach[U](f: Elem => U) 
```

顾名思义，`foreach` 方法用于遍历集合类的所有元素，然后进行指定的操作。`Iterable` 实现了 `Traversable`，也实现了 `foreach` 方法，继而所有实现了 `Iterable` 的集合类同时也获得了一个 `foreach` 的基础版本。

很多集合操作都是基于 `foreach` 实现，因此它的性能非常关键。一些 `Iterable` 子类覆写了这个方法的实现，从而获得了符合不同集合特性的优化。

那么，常见的集合类型（如 `Seq`） 是如何实现通用操作的呢（如 `map`）？

**原来，`Traversable` 除了唯一的抽象方法以外，还包含了大量通用的集合操作方法。**

Scala 文档对这些操作方法进行了归类，如下所示：

| 分类  | 方法 |
| ---- | ------------------ |
| 抽象方法 | foreach |
| 相加 |  ++ |
| Map  | map / flatMap / collect  |
| 集合转换  | toArray / toList / toIterable / toSeq / toIndexedSeq / toStream / toSet / toMap  |
| 拷贝  | copyToBuffer / copyToArray   |
| size 信息  | 不可变的  |
| 元素检索  |  head / last / headOption / lastOption / find  |
| 子集合检索 |  tail / init / slice / take / drop / takeWhilte / dropWhile / filter / filteNot / withFilter |
| 拆分 | splitAt / span / partition / groupBy |
| 元素测试 | exists / forall / count  |
| 折叠 | foldLeft / foldRight / /: / :\ / reduceLeft / reduceRight  |
| 特殊折叠 | sum / product / min / max |
| 字符串转化 | mkString / addString / stringPrefix |
| 视图生成 | view  |

**由此，一个集合仅需定义 `foreach` 方法，以上所有其它方法都可以从 `Traversable` 继承。**

### Iterable

Scala 当前版本的 `Iterable` 设计略显尴尬，它实现了 `Traversable`，也同时被其它所有集合实现。然而事实上这并不是一个好的设计，原因如下：

- `Traversable` 存在未暴露的隐式行为，容易导致 API 出错
- 遍历一个 `Traversable` 比 `Iterable` 性能要差
- 所有实现了 `Traversable` 的数据类型，无不接受 `Iterator` 的实现，前者显得多余

> 详情参见 @Alexelcu 的文章 — [Why scala.collection.Traversable Is Bad Design](https://alexn.org/blog/2017/01/13/traversable.html) 

因此，正在进行的 [Scala collection redesign](https://contributors.scala-lang.org/t/ongoing-work-on-standard-collections-redesign/293) 项目也已经抛弃了 `Traversable`。

然而，这并不妨碍我们研究 `Iterable` 中的通用方法，它们也在 [collection-strawman](https://github.com/scala/collection-strawman) 中被保留，如下所示：

| 分类  | 方法 |
| ---- | ------------------ |
| 抽象方法 | iterator |
| 其他迭代器 | grouped / sliding |
| 子集合 | takeRight / dropRight |
| 拉链操作 | zip / zipAll |
| 比对 | sameElements |


## Builder 类
