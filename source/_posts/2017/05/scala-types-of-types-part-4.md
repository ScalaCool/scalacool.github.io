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

- [16. 枚举]()
- [17. 值类]()
- [18. 类型类]()
- [19. 自类型注释]()
- [20. 幽灵类型]()

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
② 在这里，我们为枚举值定义一个 [类型别名](http://scala.cool/2017/04/scala-types-of-types-part-2/#10-类型别名) ，

