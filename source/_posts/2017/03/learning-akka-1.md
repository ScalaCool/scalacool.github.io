---
title: Akka系列（一）：Akka 简介与 Actor 模型
author: Godpan
tags: 
- Akka
description: Akka是一个构建在JVM上，基于Actor模型的的并发框架，为构建伸缩性强，有弹性的响应式并发应用提高更好的平台。本文主要是个人对Akka的学习和应用中的一些理解。
date: 2017-03-22
---

Akka是一个构建在JVM上，基于Actor模型的的并发框架，为构建伸缩性强，有弹性的响应式并发应用提高更好的平台。本文主要是个人对Akka的学习和应用中的一些理解。

## Actor模型
Akka的核心就是Actor，所以不得不说Actor，Actor模型我通俗的举个例子，假定现实中的两个人，他们只知道对方的地址，他们想要交流，给对方传递信息，但是又没有手机，电话，网络之类的其他途径，所以他们之间只能用信件传递消息，很像现实中的的邮政系统，你要寄一封信，只需根据地址把信投寄到相应的信箱中，具体它是如何帮你处理送达的，你就不需要了解了，你也有可能收到收信人的回复，这相当于消息反馈。上述例子中的信件就相当于Actor中的消息，Actor与Actor之间只能通过消息通信。当然Actor模型比这要复杂的多，这里主要是简洁的阐述一下Actor模型的概念。

### Akka中Actors模型
- `对并发模型进行了更高的抽象`
- `异步、非阻塞、高性能的事件驱动编程模型`
- `轻量级事件处理（1GB内存可容纳百万级别个Actor）`

`为什么Actor模型是一种处理并发问题的解决方案？`

一开始我也不怎么理解，脑子里的一贯思维是处理并发问题就是如何保证共享数据的一致性和正确性，为什么会有保持共享数据正确性这个问题呢？无非是我们的程序是多线程的，多个线程对同一个数据进行修改，若不加同步条件，势必会造成数据污染。那么我们是不是可以转换一下思维，用单线程去处理相应的请求，但是又有人会问了，若是用单线程处理，那系统的性能又如何保证。Actor模型的出现解决了这个问题。

`Actor模型概图`：

![Actor模型](/images/2017/03/actor-model.png)

从上图中我们可以看到，Actor与Actor之前只能用消息进行通信，当某一个Actor给另外一个Actor发消息，消息是有顺序的，你只需要将消息投寄的相应的邮箱，至于对方Actor怎么处理你的消息你并不知道，当然你也可等待它的回复。

JVM中的Actor有以下几个特点：

- `每个Actor都有对应一个邮箱`
- `Actor是串行处理消息的`
- `Actor中的消息是不可变的`

其实只从上面一些描述来看，并不能看出Actor在处理并发问题上的有什么优势。

但我总结了两点：`简化并发编程`，`提升程序性能`

##### 1.简化并发编程：

我们一开始说过并发导致最大的问题就是对共享数据的操作，我们在面对并发问题时多采用的是
用锁去保证共享数据的一致性，但这同样也会带来其他相关问题，比如要去考虑锁的粒度（对方法，程序块等），锁的形式（读锁，写锁等）等问题，这些问题对并发程序来说是至关重要的，但一个初写并发程序的程序员来说，往往不能掌控的很好，这无疑给程序员在编程上提高了复杂性，而且还不容易掌控，但使用Actor就不导致这些问题，首先Actor的消息特性就觉得了在与Actor通信上不会有共享数据的困扰，另外在Actor内部是串行处理消息的，同样不会对Actor内的数据造成污染，用Actor编写并发程序无疑大大降低了编码的复杂度。

##### 2.提升程序性能：

我们之前说过既然用单线程处理，那如何保证程序的性能？首先Actor是非常轻量级的，你可以再程序中创建许多个Actor，而且Actor是异步的，那么如何利用它的这个特性呢，我们要做的就是把相应的并发事件尽可能的分割成一个个小的事件，让每个Actor去处理相应的小事件,充分去利用它异步的特点，来提升程序的性能。


其实Scala中原生的Actor并不能完成很多事，不是一套完整的并发解决方案，不适合用于生产环境，比如错误恢复，状态持久化等，所以在较新版本的Scala类库中，Akka包已经取代了原生的Actor。

## Akka

那下面我们来简单说说Akka吧，Akka作为一套成熟的并发解决方案，已经被业界大量采用，尤其是在金融，游戏等领域，Akka中的容错机制，持久化，远程调用，日志等都是很重要的模块，这些内容都会在这个系列的后续文章里一一讲解。下面就以一个入门Akka程序来结束本篇文章吧。现在我们假设有一个家居机器人，我们只需要给它发送消息它便会帮我们处理相应的事情，现在我们用程序来模拟这个场景：[源码链接](https://github.com/godpan/akka-demo/tree/master/Example_01)

`本示例使用Scala语言，构建工具为SBT，IDE为IntelliJ IDEA.`

1.首先创建一个基于SBT的Scala工程

`build.sbt`配置：

```scala
name := "Example_01"

version := "1.0"

scalaVersion := "2.11.8"

val akkaVersion   = "2.4.16"

libraryDependencies +=
  "com.typesafe.akka" %% "akka-actor" % akkaVersion
```
2.我们来定义一些消息：

```scala
trait Action{
  val message: String
  val time: Int
}

case class TurnOnLight(time: Int) extends Action {   // 开灯消息
  val message = "Turn on the living room light"
}

case class BoilWater(time: Int) extends Action {   // 烧水消息
  val message = "Burn a pot of water"
}
```
3.我们利用Actor来实现一个模拟机器人：

```scala
class RobotActor extends Actor {
  val log = Logging(context.system, this)
  def receive: Receive = { //机器人接受指令
    case t: TurnOnLight => log.info(s"${t.message} after ${t.time} hour")
    case b: BoilWater => log.info(s"${b.message} after ${b.time} hour")
    case _ => log.info("I can not handle this message")
  }
}
```
4.我们去测试这个机器人：

```scala
object Example_01 extends App {
  val actorSyatem = ActorSystem("robot-system") 
  val robotActor = actorSyatem.actorOf(Props(new RobotActor()), "robotActor") //创建一个机器人
  robotActor ! TurnOnLight(1) //给机器人发送一个开灯命令
  robotActor ! BoilWater(2) //给机器人发送一个烧水命令
  robotActor ! "who are you" //给机器人发送一个任意命令
  actorSyatem terminate ()
}

```
5.运行结果

```
[INFO] [03/19/2017 13:48:05.622] [robot-system-akka.actor.default-dispatcher-4] [akka://robot-system/user/robotActor] Turn on the living room light after 1 hour
[INFO] [03/19/2017 13:48:05.622] [robot-system-akka.actor.default-dispatcher-4] [akka://robot-system/user/robotActor] Burn a pot of water after 2 hour
[INFO] [03/19/2017 13:48:05.622] [robot-system-akka.actor.default-dispatcher-4] [akka://robot-system/user/robotActor] I can not handle this message
```

上面是一个非常简单的Akka例子，我们首先创建了一个机器人的Actor，然后通过向它发送不同指令，让它根据指令去做相应的事情，大家可以自己尝试去写一写相似的例子。

这篇就先到这里了，下一篇主要给大家讲讲Akka中Actor的分层结构。