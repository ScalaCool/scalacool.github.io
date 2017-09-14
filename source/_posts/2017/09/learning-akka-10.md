---
title: Akka 系列（十）：Akka 集群之 Akka Cluster
author: Godpan
tags: 
- Akka
description: 上一篇文章我们讲了Akka Remote，理解了Akka中的远程通信，其实Akka Cluster可以看成Akka Remote的扩展，由原来的两点变成由多点组成的通信网络，这种模式相信大家都很了解，就是集群，它的优势主要有两点：系统伸缩性高，容错性更好。
date: 2017-09-14 10:00
---

上一篇文章我们讲了Akka Remote，理解了Akka中的远程通信，其实Akka Cluster可以看成Akka Remote的扩展，由原来的两点变成由多点组成的通信网络，这种模式相信大家都很了解，就是集群，它的优势主要有两点：系统伸缩性高，容错性更好。

### 集群概念

很多人很容易把分布式和集群的概念搞错，包括我也是，我一开始也以为它们两个是一样的概念，只是叫法不同而已，但其实不然，虽然它们在实际场景中都是部署在不同的机器上，但它们所提供的功能并不是一样的。举个简单的例子来看看它们之间的不同：

为了保持整个系列连续性，我又以抽奖为基础举一个例子：

假定我们现在抽奖流程包括，抽奖分配奖品和用户根据链接领取指定奖品，用户先抽奖然后获取奖品链接，点击链接填写相应信息领取奖品。

#### 1.分布式：
我们现在把抽奖分配奖品和用户根据链接领取指定奖品分别部署在两台机器上，突然有一天很不幸，抽奖活动进行到一半，抽奖分配奖品那台机子所在的区域停电了，很显然，后续的用户参与抽奖就不能进行了，因为我们只有一台抽奖分配奖品的机子，但由于我们将领取奖品的业务部署在另一台机器上，所以前面那些中奖的用户还是可以正常的领取奖品，具体相关定义可参考《分布式系统概念与设计》中对分布式系统的定义。

#### 2.集群：

现在我们还是有两台机器，但是我们在两个机器上都部署了抽奖分配奖品和用户根据链接领取指定奖品的业务逻辑，突然有一天，有一台所在的区域停电了，但这时我们并担心，因为另一台服务器还是可以正常的运行处理用户的所有请求。

它们的各自特点：

- 分布式：是指在多台不同的服务器中部署不同的服务模块，通过远程调用协同工作，对外提供服务；
- 集群：是指在多台不同的服务器中部署相同应用或服务模块，构成一个集群，通过负载均衡设备对外提供服务；

总的来说： 分布式是以分离任务缩短时间来提高效率，而集群是在单位时间内处理更多的任务来提高效率。

### Akka Cluster

在前面的文章Akka Actor的工作方式，我们可以将一个任务分解成一个个小任务，然后分配给它的子Actor执行，其实这就可以看成一个小的分布式系统，那么在Akka中，集群又是一种怎样的概念呢？

其实往简单里说，就是一些相同的ActorSystem的组合，它们具有着相同的功能，我们需要执行的任务可以随机的分配到目前可用的ActorSystem上，这点跟Nginx的负载均衡很类似，根据算法和配置将请求转发给运行正常的服务器去，Akka集群的表现形式也是这样，当然它背后的理论基础是基于gossip协议的，目前很多分布式的数据库的数据同步都采用这个协议，有兴趣的同学可以自己去研究研究，只是我也是一知半解，这里就不写了，怕误导了大家。

下面我来讲讲Akka Cluster中比较重要的几个概念：

#### Seed Nodes

Seed Nodes可以看过是种子节点或者原始节点，它的一个主要作用用于可以自动接收新加入集群的节点的信息，并与之通信，使用方式可以用配置文件或者运行时指定，推荐使用配置文件方式，比如：

```
akka.cluster.seed-nodes = [
  "akka.tcp://ClusterSystem@host1:2552",
  "akka.tcp://ClusterSystem@host2:2552"]
```

seed-nodes列表中的第一个节点会集群启动的时候初始化，而其他节点则是在有需要时再初始化。

当然你也可以不指定seed nodes，但你可以需要手动或者在程序中写相关逻辑让相应的节点加入集群，具体使用方式可参考官方文档。

#### Cluster Events

Cluster Events字面意思是集群事件，那么这是什么意思呢？其实它代表着是一个节点的各种状态和操作，举个例子，假设你在打一局王者5v5的游戏，那么你可以把十个人看成一个集群，我们每个人都是一个节点，我们的任何操作和状态都能被整个系统捕获到，比如A杀了B、A超神了，A离开了游戏，A重新连接了游戏等等，这些状态和操作在Cluster Events中就相当于节点之于集群，那么它具体是怎么使用的呢？

首先我们必须将节点注册到集群中，或者说节点订阅了某个集群，我们可以这么做：

```scala
cluster.subscribe(self, classOf[MemberEvent], classOf[UnreachableMember])
```

具体代码相关的使用我会再下面写一个demo例子，来说明是如何具体使用它们的。

从上面的代码我们可以看到有一个MemberEvent的概念，这个其实就是每个成员所可能拥有的events，那么一个成员在它的生命周期中有以下的events

- ClusterEvent.MemberJoined - 新的节点加入集群，此时的状态是Joining；
- ClusterEvent.MemberUp - 新的节点加入集群，此时的状态是Up；
- ClusterEvent.MemberExited - 节点正在离开集群，此时的状态是Exiting；
- ClusterEvent.MemberRemoved - 节点已经离开集群，此时的状态是Removed；
- ClusterEvent.UnreachableMember - 节点被标记为不可触达；
- ClusterEvent.ReachableMember - 节点被标记为可触达；

状态说明：
- Joining: 加入集群的瞬间状态
- Up: 正常服务状态
- Leaving / Exiting: 正常移出中状态
- Down: 被标记为停机（不再是集群决策的一部分）
- Removed: 已从集群中移除

#### Roles

虽然上面说到集群中的各个节点的功能是一样的，其实并不一定，比如我们将分布式和集群融合到一起，集群中的一部分节点负责接收请求，一部分用于计算，一部分用于数据存储等等，所以Akka Cluster提供了一种Roles的概念，用来表示该节点的功能特性，我们可以在配置文件中指定,比如：

```
akka.cluster.roles = request
akka.cluster.roles = compute
akka.cluster.roles = store
```

#### ClusterClient

ClusterClient是一个集群客户端，主要用于集群外部系统与集群通信，使用它非常方便，我们只需要将集群中的任意指定一个节点作为集群客户端，然后将其注册为一个该集群的接待员，最后我们就可以在外部系统直接与之通信了，使用ClusterClient需要做相应的配置：

```
akka.extensions = ["akka.cluster.client.ClusterClientReceptionist"]
```

假设我们现在我一个接待的Actor，叫做frontend,我们就可以这样做：

```sacla
val frontend = system.actorOf(Props[TransformationFrontend], name = "frontend")
ClusterClientReceptionist(system).registerService(frontend)
```

### Akka Cluster例子

上面讲了集群概念和Akka Cluster中相对重要的概念，下面我们就来写一个Akka Cluster的demo，

demo需求：

线假设需要执行一些相同任务，频率为2s一个，现在我们需要将这些任务分配给Akka集群中的不同节点去执行，这里使用ClusterClient作为集群与外部的通信接口。

首先我们先来定义一些命令：

```scala

package sample.cluster.transformation

final case class TransformationJob(text: String) // 任务内容
final case class TransformationResult(text: String) // 执行任务结果
final case class JobFailed(reason: String, job: TransformationJob) //任务失败相应原因
case object BackendRegistration // 后台具体执行任务节点注册事件

```

然后我们实现具体执行任务逻辑的后台节点：

```scala

class TransformationBackend extends Actor {

  val cluster = Cluster(context.system)

  override def preStart(): Unit = cluster.subscribe(self, classOf[MemberEvent])  //在启动Actor时将该节点订阅到集群中
  override def postStop(): Unit = cluster.unsubscribe(self)

  def receive = {
    case TransformationJob(text) => { // 接收任务请求
      val result = text.toUpperCase // 任务执行得到结果（将字符串转换为大写）
      sender() ! TransformationResult(text.toUpperCase) // 向发送者返回结果
    }
    case state: CurrentClusterState =>
      state.members.filter(_.status == MemberStatus.Up) foreach register // 根据节点状态向集群客户端注册
    case MemberUp(m) => register(m)  // 将刚处于Up状态的节点向集群客户端注册
  }

  def register(member: Member): Unit = {   //将节点注册到集群客户端
    context.actorSelection(RootActorPath(member.address) / "user" / "frontend") !
      BackendRegistration
  }
}

```

*相应节点的配置文件信息，我这里就不贴了，请从相应的源码demo里获取。*[源码链接](https://github.com/godpan/akka-demo/tree/master/Example_07)

接着我们来实现集群客户端：

```scala

class TransformationFrontend extends Actor {

  var backends = IndexedSeq.empty[ActorRef] //任务后台节点列表
  var jobCounter = 0

  def receive = {
    case job: TransformationJob if backends.isEmpty =>  //目前暂无执行任务节点可用
      sender() ! JobFailed("Service unavailable, try again later", job)

    case job: TransformationJob => //执行相应任务
      jobCounter += 1
      implicit val timeout = Timeout(5 seconds)
      val backend = backends(jobCounter % backends.size) //根据相应算法选择执行任务的节点
      println(s"the backend is ${backend} and the job is ${job}")
      val result  = (backend ? job)
        .map(x => x.asInstanceOf[TransformationResult])  // 后台节点处理得到结果
      result pipeTo sender  //向外部系统发送执行结果

    case BackendRegistration if !backends.contains(sender()) =>  // 添加新的后台任务节点
      context watch sender() //监控相应的任务节点
      backends = backends :+ sender()

    case Terminated(a) =>
      backends = backends.filterNot(_ == a)  // 移除已经终止运行的节点
  }
}

```

 最后我们实现与集群客户端交互的逻辑：

```scala
class ClientJobTransformationSendingActor extends Actor {

  val initialContacts = Set(
    ActorPath.fromString("akka.tcp://ClusterSystem@127.0.0.1:2551/system/receptionist"))
  val settings = ClusterClientSettings(context.system)
    .withInitialContacts(initialContacts)

  val c = context.system.actorOf(ClusterClient.props(settings), "demo-client")


  def receive = {
    case TransformationResult(result) => {
      println(s"Client response and the result is ${result}")
    }
    case Send(counter) => {
        val job = TransformationJob("hello-" + counter)
        implicit val timeout = Timeout(5 seconds)
        val result = Patterns.ask(c,ClusterClient.Send("/user/frontend", job, localAffinity = true), timeout)
        result.onComplete {
          case Success(transformationResult) => {
            self ! transformationResult
          }
          case Failure(t) => println("An error has occured: " + t.getMessage)
        }
      }
  }
}
```

下面我们开始运行这个domo：

```scala
object DemoClient {
  def main(args : Array[String]) {

    TransformationFrontendApp.main(Seq("2551").toArray)  //启动集群客户端
    TransformationBackendApp.main(Seq("8001").toArray)   //启动三个后台节点
    TransformationBackendApp.main(Seq("8002").toArray)
    TransformationBackendApp.main(Seq("8003").toArray)

    val system = ActorSystem("OTHERSYSTEM")
    val clientJobTransformationSendingActor =
      system.actorOf(Props[ClientJobTransformationSendingActor],
        name = "clientJobTransformationSendingActor")

    val counter = new AtomicInteger
    import system.dispatcher
    system.scheduler.schedule(2.seconds, 2.seconds) {   //定时发送任务
      clientJobTransformationSendingActor ! Send(counter.incrementAndGet())
    }
    StdIn.readLine()
    system.terminate()
  }
}
```

运行结果：

![akka-cluster](/images/2017/09/akka-cluster.png)

从结果可以看到，我们将任务根据算法分配给不同的后台节点进行执行，最终返回结果。

### 本文目的

- 掌握集群基本概念
- 了解学习Akka cluster的工作方式和主要角色
- 尝试自己写一个Akka cluster的相关例子
- 下一步进阶了解Akka cluster的背后原理

本文的demo例子已上传github：[源码链接](https://github.com/godpan/akka-demo/tree/master/Example_07)