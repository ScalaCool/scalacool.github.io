---
title: Play! Framework 系列（四）：DI 模式比较
author: Shaw
tags:
- Play
- ~Play! Framework 系列
- ^Shaw
description: 本文将详细地介绍一些在日常开发中所采用的依赖注入的方式，以供大家进行合理地选择。
date: 2018-04-02
---

在 [Play! Framework 系列（三）](https://scala.cool/2017/11/play-3/)中我们简单介绍了一下 Play 框架自身支持的两种依赖注入（运行时依赖注入、编译时依赖注入）。相信大家对 Play! 的依赖注入应该有所了解了。本文将详细地介绍一些在日常开发中所采用的依赖注入的方式，以供大家进行合理地选择。

## Guice 和 手动注入

在[上一篇](https://scala.cool/2017/11/play-3/)文章中我们所介绍的「运行时依赖注入」以及「编译时依赖注入」就是用的 Guice 以及手动注入，在这里就不作详细介绍了，大家可以去看看上篇文章以及相应的 [Demo](https://github.com/Shonrain/Play-Demo/tree/master/play-demo-2)

接下来我们介绍比较常用的依赖注入模式。

## cake pattern（蛋糕模式）

我们首先介绍一下 Scala 中比较经典的一种依赖注入的模式—— cake pattern（也叫“蛋糕模式”），“蛋糕模式”也属于「编译时依赖注入」的一种，她不需要依赖 DI 框架。那 “蛋糕模式” 是如何实现的呢？我们知道，在 Scala 中，多个 trait（特质）能够 “混入” 到 class 中，这样在某个 class 中我们就能够得到所有 trait 中定义的东西了。“蛋糕模式”就是基于此种特性而实现的。

接下来我们就通过一个例子来了解一下“蛋糕模式”：

我们需要在页面上显示一个包含所有会员信息的会员列表，需要显示的内容有：

1. 会员信息
2. 会员卡的信息

需求很简单，接下来我们用代码组织一下业务：

我们需要从数据库中查询「会员卡」以及「会员」的信息，所以这里我们首先定义一个数据库连接的类：DatabaseAccessService 来对相应的数据库进行操作：

```scala
trait DatabaseAccessServiceComp {
  val databaseAccessService = new DatabaseAccessService()
}

class DatabaseAccessService{
  ...
}
```

大家可能会发现，在我们之前文章中的 service 中并没有定义 trait，而这里却定义了，并且在 trait 中，我们实例化了 DatabaseAccessService， 这就是“蛋糕模式”中所需要的，现在看好像并没有什么卵用，别急，等我们将所有的 service 都定义好了，她就有用了。

接下来我们定义 WxcardService 以及 WxcardMemberService：

```scala
//定义 WxcardService
trait WxcardServiceComp {
  this: DatabaseAccessServiceComp =>

  val wxcardService = new WxcardService(databaseAccessService)
}

class WxcardService(databaseAccessService: DatabaseAccessService) {
  ...
}

//定义 WxcardMembrService
trait WxcardMemberServiceComp {
  this: DatabaseAccessServiceComp =>

  val wxcardMemberService = new WxcardMemberService(databaseAccessService)
}

class WxcardMemberService(databaseAccessService: DatabaseAccessService) {
  ...
}
```

写法与上面定义的 DatabaseAccessService 没有什么区别，因为上面两个 service 都需要依赖 DatabaseAccessService，所以在特质中用「自身类型」来将其混入，如果需要多个依赖，可以这样写：

```scala
this DatabaseAccessServiceComp with BarComp with FooComp =>
```

最后我们需要定义一个 WxcardController，来将数据传递到相应的页面上去：

```scala
class WxcardController (
  cc: ControllerComponents,
  wxcardService: WxcardService,
  wxcardMemberService: WxcardMemberService
) extends AbstractController(cc) {...}
```

可以看到 WxcardController 需要依赖我们上面定义的一些 service，那么在蛋糕模式下，我们怎样才能将这些依赖注入到 WxcardController 中呢，由于“蛋糕模式”也是「编译时依赖注入」的一种，那么我们可以参考[上一篇](https://scala.cool/2017/11/play-3/)文章中所采用的方式：

同样，我们需要实现自己的 ApplicationLoader：

```scala
//定义 load 那部分代码省略了，大家可以去看 Demo
...

class MyComponents(context: ApplicationLoader.Context)
    extends BuiltInComponentsFromContext(context)
    with play.filters.HttpFiltersComponents
    with DatabaseAccessServiceComp
    with WxcardServiceComp
    with WxcardMemberServiceComp {

  lazy val wxcardController = new WxcardController(controllerComponents, wxcardService, wxcardMemberService)

  lazy val router: Router = new Routes(httpErrorHandler, wxcardController)
}
```

通过上面的代码，就完成了注入，可以看到我们定义的所有 xxxServiceComp 特质都被混入到了 MyComponents 中，这样，当 Play加载时，我们所定义的 service 就都在这里被实例化了，为什么呢？因为我们在定义 xxxServiceComp 时，都会有这么一行代码：

```scala
val xxxService = new XxxService()
```

这就是为什么我们之前要在每个 service 中都定义一个 trait，因为 Scala 中的 class 可以混入多个 trait，在这里，我们可以将所有需要的依赖都混入到 MyComponents 中，然后实现注入。

至于为什么要叫“蛋糕模式”，我个人是这么理解的：
我们定义的 xxxServiceComp 比如 WxcardServiceComp 相当于蛋糕中的某一层，而那些需要被多次依赖的 xxxServiceComp，比如上面定义的 DatabaseAccessServiceComp 可以看作是蛋糕中的调味料（比如水果，巧克力啥的），将这些蛋糕一层一层地放在一起，然后再混入一些调味料，就组成了一个大的蛋糕—— MyComponents。


可以看到“蛋糕模式”中，我们需要写非常多的样板代码，要为每个 service 都定义一个 trait，感觉心很累，那么接下来我们就介绍一种比较轻巧而又简洁的的方式。


## macwire

[macwire](https://github.com/adamw/macwire) 是基于 「Scala 宏」来实现的，我们使用她可以让依赖注入变得非常简单，并且使我们的代码量减少许多。接下来，我们就通过 macwire 来实现一下上面的例子。

首先在项目中引入 macwire，在 build.sbt 文件中增加一行依赖：

```scala
libraryDependencies ++= Seq(
  "org.scalatestplus.play"   %% "scalatestplus-play" % "3.0.0-M3" % Test,

  //在这里添加 macwire 的依赖
  "com.softwaremill.macwire" %% "macros"             % "2.3.0"    % Provided,
)
```

然后定义 service：

```scala
//定义 DatabaseAccessService

class DatabaseAccessService{
  ...
}

//定义 WxcardService

class WxcardService(databaseAccessService: DatabaseAccessService) {
  ...
}

//定义 WxcardMembrService

class WxcardMemberService(databaseAccessService: DatabaseAccessService) {
  ...
}
```

可以看到，我们现在就不需要定义 trait 了，接下来，定义 WxcardController：

```scala
class WxcardController (
  cc: ControllerComponents,
  wxcardService: WxcardService,
  wxcardMemberService: WxcardMemberService
) extends AbstractController(cc) {...}
```

controller 的定义和上面的一样，接下来，我们就使用 macwire 来实现依赖注入，macwire 也是「编译时依赖注入」的一种，所以我们同样需要实现 ApplicationLoader：

```scala
import com.softwaremill.macwire._
...

class MyComponents(context: ApplicationLoader.Context)
    extends BuiltInComponentsFromContext(context)
    with play.filters.HttpFiltersComponents {

  lazy val databaseAccessService = wire[DatabaseAccessService]
  lazy val wxcardService = wire[WxcardService]
  lazy val wxcardMemberService = wire[WxcardMemberService]
  lazy val wxcardController = wire[WxcardController]
  lazy val router: Router = {
    val prefix = "/"
    wire[Routes]
  }
}
```

在上面的代码中，我们只需要将相应的依赖通过下面的方式实例化就可以了：

```scala
lazy val wxcardService = wire[WxcardService]
```

就是在类型外面添加了一个 `wire`，这样就完成了实例化，并且也不需要指定依赖的参数，macwire 会自动帮我们完成实例化和注入：

比如上面的

```scala
lazy val databaseAccessService = wire[DatabaseAccessService]
lazy val wxcardService = wire[WxcardService]
lazy val wxcardMemberService = wire[WxcardMemberService]
lazy val wxcardController = wire[WxcardController]
```

macwire 就帮我们转化成了：

```scala
lazy val databaseAccessService = new DatabaseAccessService()
lazy val wxcardService = new WxcardService(databaseAccessService)
lazy val wxcardMemberService = new WxcardMemberService(databaseAccessService)
lazy val wxcardController = new WxcardController(controllerComponents, wxcardService, wxcardMemberService)
```

我们只需要在定义某个类的时候声明我们需要哪些依赖，实例化和注入 macwire 都会帮我们去完成，macwire 在实例化某个类的时候，会去当前文件或者与当前文件有关的代码中查找相关的依赖，找到了就完成注入，若没有找到说明该依赖没有被定义过，或者没有正确引入。

在日常开发中，我们会创建很多个 service，将所有的 service 放在 MyComponents 中实例化会使得代码显得很臃肿，而且也不便于维护。通常我们会专门定义一个 Module 来组织这些 service：

```scala
package config

import com.softwaremill.macwire._
import services._

trait ServicesModule {
  lazy val databaseAccessService = wire[DatabaseAccessService]
  lazy val wxcardService = wire[WxcardService]
  lazy val wxcardMemberService = wire[WxcardMemberService]
}

```

这里我们新建了一个 ServiceModule.scala 文件来将组织这些 service。

那么上面的 ApplicationLoader 文件就可以这样去写：

```scala
import com.softwaremill.macwire._
...

class MyComponents(context: ApplicationLoader.Context)
    extends BuiltInComponentsFromContext(context)
    with play.filters.HttpFiltersComponents
    with config.ServicesModule {

  lazy val wxcardController = wire[WxcardController]
  lazy val router: Router = {
    val prefix = "/"
    wire[Routes]
  }
}
```

可以看到 macwire 使用起来非常简单，并且能够简化我们的依赖注入。在我们的项目中所采用的是 macwire，所以推荐大家使用 macwire。

## 结语

关于 Play 中的「依赖注入」到这里就结束了，希望能够给大家一些帮助，另外 Play 系列的文章从上一篇到现在拖了太久了，非常抱歉，感谢一直以来的关注，后面我会加快写作节奏的，本文的例子请戳[源码链接](https://github.com/Shonrain/Play-Demo/tree/master/play-demo-3)。
