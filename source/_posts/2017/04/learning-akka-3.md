---
title: Akka 系列（三）：监管与容错
author: Godpan
tags: 
- Akka
- ~Akka 系列
description: Akka作为一种成熟的生产环境并发解决方案，必须拥有一套完善的错误异常处理机制，本文主要讲讲Akka中的监管和容错。
date: 2017-04-16
---

Akka作为一种成熟的生产环境并发解决方案，必须拥有一套完善的错误异常处理机制，本文主要讲讲Akka中的监管和容错。

## 监管

看过我上篇文章的同学应该对Actor系统的工作流程有了一定的了解[Akka系列（二）：Akka中的Actor系统](http://scala.cool/2017/04/learning-akka-2/)，它的很重要的概念就是分而治之，既然我们把任务分配给Actor去执行，那么我们必须去监管相应的Actor，当Actor出现了失败，比如系统环境错误，各种异常，能根据我们制定的相应监管策略进行错误恢复，就是后面我们会说到的容错。

### 监管者

既然有监管这一事件，那必然存在着**监管者**这么一个角色，那么在ActorSystem中是如何确定这种角色的呢？

我们先来看下ActorSystem中的顶级监管者：

![Actor系统顶级监管者](/images/2017/04/actor-system-guardian.png)

一个actor系统在其创建过程中至少要启动三个actor，如上图所示，下面来说说这三个Actor的功能：

#### 1.`/`： 根监管者

顾名思义，它是一个老大，它监管着ActorSystem中所有的顶级Actor，顶级Actor有以下几种：

 - `/user`： 是所有由用户创建的顶级actor的监管者；用ActorSystem.actorOf创建的actor在其下。
 - `/system`： 是所有由系统创建的顶级actor的监管者，如日志监听器，或由配置指定在actor系统启动时自动部署的actor。
 - `/deadLetters`： 是死信actor，所有发往已经终止或不存在的actor的消息会被重定向到这里。
 - `/temp`：是所有系统创建的短时actor的监管者，例如那些在ActorRef.ask的实现中用到的actor。
 - `/remote`： 是一个人造虚拟路径，用来存放所有其监管者是远程actor引用的actor。
 
 跟我们平常打交道最多的就是`/user`，它是我们在程序中用ActorSystem.actorOf创建的actor的监管者，下面的容错我们重点关心的就是它下面的失败处理，其他几种顶级Actor具体功能定义已经给出，有兴趣的也可以去了解一下。
 
 根监管者监管着所有顶级Actor，对它们的各种失败情况进行处理，一般来说如果错误要上升到根监管者，整个系统就会停止。
 
 
#### 2.`/user`： 顶级actor监管者

上面已经讲过`/user`是所有由用户创建的顶级actor的监管者，即用ActorSystem.actorOf创建的actor，我们可以自己制定相应的监管策略，但由于它是actor系统启动时就产生的，所以我们需要在相应的配置文件里配置，具体的配置可以参考这里[Akka配置](http://doc.akka.io/docs/akka/current/general/configuration.html)

#### 3.`/system`： 系统监管者

`/system`所有由系统创建的顶级actor的监管者,比如Akka中的日志监听器，因为在Akka中日志本身也是用Actor实现的，`/system`的监管策略如下：对收到的除`ActorInitializationException`和`ActorKilledException`之外的所有`Exception`无限地执行重启，当然这也会终止其所有子actor。所有其他Throwable被上升到根监管者，然后整个actor系统将会关闭。


用户创建的普通actor的监管：

上一篇文章介绍了Actor系统的组织结构，它是一种树形结构，其实这种结构对actor的监管是非常有利的，Akka实现的是一种叫“父监管”的形式，每一个被创建的actor都由其父亲所监管，这种限制使得actor的监管结构隐式符合其树形结构，所以我们可以得出一个结论：

> 一个被创建的Actor肯定是一个被监管者，也可能是一个监管者，它监管着它的子级Actor

### 监管策略

上面我们对ActorSystem中的监管角色有了一定的了解，那么到底是如何制定相应的监管策略呢？Akka中有以下4种策略：

- 恢复下属，保持下属当前积累的内部状态
- 重启下属，清除下属的内部状态
- 永久地停止下属
- 升级失败（沿监管树向上传递失败），由此失败自己

这其实很好理解，下面是一个简单例子：

```scala
 override val supervisorStrategy =
    OneForOneStrategy(maxNrOfRetries = 10, withinTimeRange = 1 minute) {
      case _: ArithmeticException => Resume  //恢复
      case _: NullPointerException => Restart //重启
      case _: IllegalArgumentException => Stop //停止
      case _: Exception => Escalate  //向上级传递
    }
```
 
我们可以根据异常的不同使用不同监管策略，在后面我会具体给出一个示例程序帮助大家理解。我们在实现自己的策略时，需要复写Actor中的`supervisorStrategy`，因为Actor的默认监管策略如下：
 
```scala
  final val defaultDecider: Decider = {
    case _: ActorInitializationException ⇒ Stop
    case _: ActorKilledException         ⇒ Stop
    case _: DeathPactException           ⇒ Stop
    case _: Exception                    ⇒ Restart
  }
```
 它对除了它指定的异常进行停止，其他异常都是对下属进行重启。
 
 Akka中有两种类型的监管策略：`OneForOneStrategy`和`AllForOneStrategy`，它们的主要区别在于：
 
 - `OneForOneStrategy`： 该策略只会应用到发生故障的子actor上。
 - `AllForOneStrategy`： 该策略会应用到所有的子actor上。
 
 我们一般都使用`OneForOneStrategy`来进行制定相关监管策略，当然你也可以根据具体需求选择合适的策略。另外我们可以给我们的策略配置相应参数，比如上面maxNrOfRetries，withinTimeRange等，这里的含义是每分钟最多进行10次重启，若超出这个界限相应的Actor将会被停止，当然你也可以使用策略的默认配置，具体配置信息可以参考源码。

 
### 监管容错示例

本示例主要演示Actor在发生错误时，它的监管者会根据相应的监管策略进行不同的处理。[源码链接](https://github.com/godpan/akka-demo/tree/master/Example_03)

因为这个例子比较简单，这里我直接贴上相应代码，后面根据具体的测试用例来解释各种监管策略所进行的响应：

```scala
class Supervisor extends Actor {
  //监管下属，根据下属抛出的异常进行相应的处理
  override val supervisorStrategy =
    OneForOneStrategy(maxNrOfRetries = 10, withinTimeRange = 1 minute) {
      case _: ArithmeticException => Resume
      case _: NullPointerException => Restart
      case _: IllegalArgumentException => Stop
      case _: Exception => Escalate
    }
  var childIndex = 0 //用于标示下属Actor的序号

  def receive = {
    case p: Props =>
      childIndex += 1
      //返回一个Child Actor的引用，所以Supervisor Actor是Child Actor的监管者
      sender() ! context.actorOf(p,s"child${childIndex}")
  }
}

class Child extends Actor {
  val log = Logging(context.system, this)
  var state = 0
  def receive = {
    case ex: Exception => throw ex //抛出相应的异常
    case x: Int => state = x //改变自身状态
    case s: Command if s.content == "get" =>
      log.info(s"the ${s.self} state is ${state}")
      sender() ! state //返回自身状态
  }
}

case class Command(  //相应命令
    content: String,
    self: String
)
```
现在我们来看看具体的测试用例：
首先我们先构建一个测试环境：

```scala
class GuardianSpec(_system: ActorSystem)
    extends TestKit(_system)
    with WordSpecLike
    with Matchers
    with ImplicitSender {

  def this() = this(ActorSystem("GuardianSpec"))

  "A supervisor" must {

    "apply the chosen strategy for its child" in {
        code here...
        val supervisor = system.actorOf(Props[Supervisor], "supervisor") //创建一个监管者
        supervisor ! Props[Child]
        val child = expectMsgType[ActorRef] // 从 TestKit 的 testActor 中获取回应
    } 
  }
}
```

1.TestOne：正常运行

```scala
child ! 50 // 将状态设为 50
child ! Command("get",child.path.name)
expectMsg(50)
```
正常运行，测试通过。

2.TestTwo：抛出ArithmeticException

```scala
child ! new ArithmeticException // crash it
child ! Command("get",child.path.name)
expectMsg(50)     
```
大家猜这时候测试会通过吗？答案是通过，原因是根据我们制定的监管策略，监管者在面对子级Actor抛出`ArithmeticException`异常时，它会去恢复相应出异常的Actor，并保持该Actor的状态，所以此时Actor的状态值还是50，测试通过。

3.TestThree：抛出NullPointerException

```scala
child ! new NullPointerException // crash it harder
child ! "get"
expectMsg(50)   
```
这种情况下测试还会通过吗？答案是不通过，原因是根据我们制定的监管策略，监管者在面对子级Actor抛出`NullPointerException`异常时，它会去重启相应出异常的Actor，其状态会被清除，所以此时Actor的状态值应该是0，测试不通过。

4.TestFour：抛出IllegalArgumentException

```scala
supervisor ! Props[Child] // create new child
val child2 = expectMsgType[ActorRef]
child2 ! 100 // 将状态设为 100
watch(child) // have testActor watch “child”
child ! new IllegalArgumentException // break it
expectMsgPF() {
  case Terminated(`child`) => (println("the child stop"))
}
child2 ! Command("get",child2.path.name)
expectMsg(100)   
```
这里首先我们又创建了一个Child Actor为child2，并将它的状态置为100，这里我们监控前面创建的child1，然后给其发送一个`IllegalArgumentException`的消息，让其抛出该异常，测试结果:
```
the child stop
测试通过
```
从结果中我们可以看出，child在抛出`IllegalArgumentException`后，会被其监管着停止，但监管者下的其他Actor还是正常工作。

5.TestFive：抛出一个自定义异常

```scala
 watch(child2)
 child2 ! Command("get",child2.path.name) // verify it is alive
 expectMsg(100)
 supervisor ! Props[Child] // create new child
 val child3 = expectMsgType[ActorRef]
 child2 ! new Exception("CRASH") // escalate failure
 expectMsgPF() {
    case t @ Terminated(`child2`) if t.existenceConfirmed => (
       println("the child2 stop")
    )
}
child3 ! Command("get",child3.path.name)
expectMsg(0)  
```
这里首先我们又创建了一个Child Actor为child3,这里我们监控前面创建的child2,然后给其发送一个`Exception("CRASH")`的消息，让其抛出该异常,测试结果:
```
the child2 stop
测试不通过
```

很多人可能会疑惑为什么TestFour可以通过，这里就通不过不了呢？因为这里错误Actor抛出的异常其监管者无法处理，只能将失败上溯传递，而顶级actor的缺省策略是对所有的Exception情况（ActorInitializationException和ActorKilledException例外）进行重启. 由于缺省的重启指令会停止所有的子actor，所以我们这里的child3也会被停止。导致测试不通过。当然这里你也可以复写默认的重启方法，比如：

```scala
override def preRestart(cause: Throwable, msg: Option[Any]) {}
```

这样重启相应Actor时就不会停止其子级下的所有Actor了。

本文主要介绍了Actor系统中的监管和容错，这一部分内容在Akka中也是很重要的，它与Actor的树形组织结构巧妙结合，本文大量参考了Akka官方文档的相应章节，有兴趣的同学可以点击这里[Akka docs](http://doc.akka.io/docs/akka/2.5/scala/fault-tolerance.html)。也可以下载我的示例程序，里面包含了一个官方的提供的容错示例。