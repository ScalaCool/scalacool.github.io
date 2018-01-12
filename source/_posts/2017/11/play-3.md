---
title: Play! Framework 系列（三）：依赖注入
author: Shaw
tags:
- Play
- ~Play! Framework 系列
- ^Shaw
description: 在日常处理业务逻辑的时候，我们都会用到依赖注入，本文将介绍一下 Play! 中的依赖注入以及如何合理地去使用她。
date: 2017-11-15
---

在[Play! Framework 系列（二）](http://shawdubie.com/notes/architecture-of-play)中我们介绍了 Play 的项目结构。在日常处理业务逻辑的时候，我们都会用到依赖注入，本文将介绍一下 Play! 中的依赖注入以及如何合理地去使用她。

## 为什么要使用「依赖注入」

在许多 Java 框架中，「依赖注入」早已不是一个陌生的技术，Play 框架从 2.4 开始推荐使用 [Guice](https://github.com/google/guice) 来作为依赖注入。

采用依赖注入最大的好处就是为了「解耦」，举个栗子：

在[上一篇](http://shawdubie.com/notes/architecture-of-play)文章的例子中，我们实现了一个 EmployeeService 用来对公司的员工进行操作：

```scala
package services

import models._

class EmployeeSerivce{
  ...
}
```

在之前的实现中，我们没有加入数据库的操作，那么现在我们想要引入一个数据库连接的类：DatabaseAccessService 来对数据库进行连接以便我们对相应的数据库表进行操作，则：

新建一个数据库连接操作的 Service：

```scala
package services

class DatabaseAccessService{}
```

EmployeeSerivce 需要依赖 DatabaseAccessService：

```scala
package services

import models._

class EmployeeSerivce(db: DBService){
  ...
}
```

好了，现在我们需要在 EmployeeController 中使用 EmployeeSerivce，如果不采用依赖注入，则：

```scala
class EmployeeController @Inject() (
  cc: ControllerComponents
) extends AbstractController(cc) {
  val db = new DatabaseAccessService()
  val employeeSerivce = new EmployeeSerivce(db)

  def employeeList = Action { implicit request: Request[AnyContent] =>
    val employees = employeeSerivce.getEmployees()
    Ok(views.html.employeeList(employees))
  }
}
```

可以看到，为了实例化 EmployeeSerivce，DatabaseAccessService 也需要实例化，如果随着需求的增加，EmployeeSerivce 所需要依赖的东西增加，那么我们每次实例化 EmployeeSerivce 的时候都需要将她的依赖也实例化一遍，而且她的依赖也有可能会依赖其他东西，这样就使得我们的代码变得非常冗余，也极难维护。

为了解决这一问题，我们引入了依赖注入，Play支持两种方式的依赖注入，分别是：「运行时依赖注入」以及「编译时依赖注入」，接下来我们就通过这两种依赖注入来解决我们上面提出的问题。

## 运行时依赖注入（runtime dependency）

Play 的运行时依赖注入默认采用 [Guice](https://github.com/google/guice)，关于 Guice，我们后面的文章当中会介绍，这里只需要知道她。为了支持 Guice 以及其他的运行时依赖注入框架，Play 提供了大量的内置组件。详见 [play.api.inject](https://www.playframework.com/documentation/2.6.x/api/scala/index.html#play.api.inject.package)。

那么在 Play 中我们将如何使用这种依赖注入呢？回到我们文章刚开始讲的那个栗子中，现在我们通过依赖注入的方式来重新组织我们的代码：

首先 EmployeeSerivce 需要依赖 DatabaseAccessService，这里其实就存在一个「依赖注入」，那我们这样去实现：

```scala
package services

import models._
import javax.inject._

class EmployeeSerivce @Inject() (db: DBService){
  ...
}
```

在上面的代码中，我们引入了 `import javax.inject._`，并且可以看到多了一个 `@Inject()` 注解，我们实现运行时依赖注入就采用该注解。

那么在 EmployeeController 中，我们的代码就变成了：

```scala
class EmployeeController @Inject() (
  employeeSerivce: EmployeeSerivce,
  cc: ControllerComponents
) extends AbstractController(cc) {
  def employeeList = Action { implicit request: Request[AnyContent] =>
    val employees = employeeSerivce.getEmployees()
    Ok(views.html.employeeList(employees))
  }
}
```

可以看到我们不需要再去写那么多的实例了，我们只要在需要某种依赖的地方声明一下我们需要什么样的依赖， Play 在运行时就会将我们需要的依赖注入到相应的组件中去。

tip：`@Inject` 必须放在类名的后面，构造参数的前面。

「运行时依赖注入」，顾名思义就是在程序运行的时候进行依赖注入，但是她不能在编译时进行校验，为了能让程序在编译时就能实现对依赖注入的校验， Play支持了「编译时依赖注入」。


## 编译时依赖注入（compile time dependency injection）

为了实现编译时依赖注入，我们需要知道 Play 提供的一个特质：[ApplicationLoader](https://www.playframework.com/documentation/2.6.x/api/scala/index.html#play.api.ApplicationLoader)，该特质中的 load 方法将会在程序启动的时候加载我们的应用程序，在这个过程中，Play 框架本身以及我们自己的程序代码所依赖的东西都会被实例化。

默认情况下，Play 提供了一个 Guice 模块，该模块下的 GuiceApplicationBuilder 会根据 Play 框架给定的 context 去将该程序所依赖的所有组件联系在一起。

如果我们要自定义 ApplicationLoader，我们也需要一个像 GuiceApplicationBuilder 的东西，好在 Play 提供了这么一个东西，那就是：[BuiltInComponentsFromContext](https://www.playframework.com/documentation/2.6.x/api/scala/index.html#play.api.ApplicationLoader$$Context)，我们可以通过继承这个类来实现我们自己的 ApplicationLoader。

接下来我们通过相应的代码来作进一步的解释：

```scala
import controllers._
import play.api._
import play.api.routing.Router
import services._
import router.Routes


//自定义 ApplicationLoader
class MyApplicationLoader extends ApplicationLoader {
  def load(context: Context): Application = {
    new MyComponents(context).application
  }
}

class MyComponents(context: Context)
    extends BuiltInComponentsFromContext(context)
    with play.filters.HttpFiltersComponents {

  lazy val databaseAccessService = new DatabaseAccessService

  lazy val employeeSerivce = new EmployeeSerivce(databaseAccessService)

  lazy val employeeController = new EmployeeController(employeeSerivce, controllerComponents)

  lazy val router: Router = new Routes(httpErrorHandler, employeeController)
}
```

我们通过继承 BuiltInComponentsFromContext 使得程序能够根据 Play 所提供的 context 来加载 Play 框架本身所需要的一些组件。

那么回到我们的「编译时的依赖注入」中来，可以看到在 class MyComponents 中，我们将所有的 service 都实例化了，并且将这些实例注入到相应的依赖她们的模块中：

```scala
//将两个 service 实例化
lazy val databaseAccessService = new DatabaseAccessService

//EmployeeSerivce 依赖 DatabaseAccessService，将实例 databaseAccessService 注入其中
lazy val employeeSerivce = new EmployeeSerivce(databaseAccessService)

//将 employeeSerivce 注入到 employeeController 中
lazy val employeeController = new EmployeeController(employeeSerivce, controllerComponents)
```

使用 BuiltInComponentsFromContext 时，我们需要自己实现一下 router：

```scala
lazy val router: Router = new Routes(httpErrorHandler, employeeController)
```

tip：需要注意的是，如果我们实现了自己的 ApplicationLoader，我们需要在 `application.conf` 文件中声明一下：

```scala
play.application.loader = MyApplicationLoader
```


通过自定义 ApplicationLoader 我们就实现了编译时期的依赖注入，那么 EmployeeSerivce 就变成了：

```scala
package services

import models._

class EmployeeSerivce (db: DBService){
  ...
}
```

可以看到， 这里就省去了 `@Inject()` 注解。

同样的，对于 EmployeeController：

```scala
package controllers

import play.api._
import play.api.mvc._
import models._
import services._

// 没有了 @Inject() 注解
class EmployeeController (
  employeeSerivce: EmployeeSerivce,
  cc: ControllerComponents
) extends AbstractController(cc) {
  ...
}
```

通过使用编译时期的依赖注入，我们只需要在将所有的依赖实例化一次就够了，并且使用这种方式，我们能够在编译时期就能发现程序的一些异常。同样的，使用该方法也会有一些问题，就是我们需要写许多样板代码。另外本文的编译时期的依赖注入完全是自己手动注入的，看上去也比较繁琐，不是那么直观，如果要使用更优雅的方式，我们可以使用 [macwire](https://github.com/adamw/macwire)，这个我们在后面的文章中会详细讲解。

## 结语

本文简单介绍了一下 Play 支持的两种依赖注入的模式，文中提到的一些第三方依赖注入的框架我们会在后面的文章中详细介绍。本文的例子请戳[源码链接](https://github.com/Shonrain/Play-Demo/tree/master/play-demo-2)
