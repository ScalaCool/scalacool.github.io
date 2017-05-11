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

## 18. 类型类

## 19. 自类型注解

## 20. 幽灵类型


