---
title: Akka 系列（七）：Actor 持久化之 Akka persistence
author: Godpan
tags: 
- Akka
- ~Akka 系列
- ^Godpan
description: 这次把这部分内容提到现在写，是因为这段时间开发的项目刚好在这一块遇到了一些难点，所以准备把经验分享给大家，我们在使用Akka时，会经常遇到一些存储Actor内部状态的场景…
date: 2017-07-25
---

这次把这部分内容提到现在写，是因为这段时间开发的项目刚好在这一块遇到了一些难点，所以准备把经验分享给大家，我们在使用Akka时，会经常遇到一些存储Actor内部状态的场景，在系统正常运行的情况下，我们不需要担心什么，但是当系统出错，比如Actor错误需要重启，或者内存溢出，亦或者整个系统崩溃，如果我们不采取一定的方案的话，在系统重启时Actor的状态就会丢失，这会导致我们丢失一些关键的数据，造成系统数据不一致的问题。Akka作为一款成熟的生产环境应用，为我们提供了相应的解决方案就是Akka persistence。

### 为什么需要持久化的Actor？

万变不离其宗，数据的一致性是永恒的主题，一个性能再好的系统，不能保证数据的正确，也称不上是一个好的系统，一个系统在运行的时候难免会出错，如何保证系统在出错后能正确的恢复数据，不让数据出现混乱是一个难题。使用Actor模型的时候，我们会有这么一个想法，就是能不对数据库操作就尽量不对数据库操作（这里我们假定我们的数据库是安全，可靠的，能保证数据的正确性和一致性，比如使用国内某云的云数据库），一方面如果大量的数据操作会使数据库面临的巨大的压力，导致崩溃，另一方面即使数据库能处理的过来，比如一些count，update的大表操作也会消耗很多的时间，远没有内存中直接操作来的快，大大影响性能。但是又有人说内存操作这么快，为什么不把数据都放内存中呢？答案显而易见，当出现机器死机，或者内存溢出等问题时，数据很有可能就丢失了导致无法恢复。在这种背景下，我们是不是有一种比较好的解决方案，既能满足需求又能用最小的性能消耗，答案就是上面我们的说的Akka persistence。

### Akka persistence的核心架构

在具体深入Akka persistence之前，我们可以先了解一下它的核心设计理念，其实简单来说，我们可以利用一些thing来恢复Actor的状态，这里的thing可以是日志、数据库中的数据，亦或者是文件，所以说它的本质非常容易理解，在Actor处理的时候我们会保存一些数据，Actor在恢复的时候能根据这些数据恢复其自身的状态。

所以Akka persistence 有以下几个关键部分组成：

- PersistentActor：任何一个需要持久化的Actor都必须继承它，并必须定义或者实现其中的三个关键属性：

```scala
 def persistenceId = "example" //作为持久化Actor的唯一表示，用于持久化或者查询时使用

 def receiveCommand: Receive = ??? //Actor正常运行时处理处理消息逻辑，可在这部分内容里持久化自己想要的消息

 def receiveRecover: Receive = ??? //Actor重启恢复是执行的逻辑
```
相比普通的Actor，除receiveCommand相似以外，还必须实现另外两个属性。
另外在持久化Actor中还有另外两个关键的的概念就是*Journal*和*Snapshot*，前者用于持久化事件，后者用于保存Actor的快照，两者在Actor恢复状态的时候都起到了至关重要的作用。

### Akka persistence的demo实战

这里我首先会用一个demo让大家能对Akka persistence的使用有一定了解的，并能大致明白它的工作原理，后面再继续讲解一些实战可能会遇到的问题。

假定现在有这么一个场景，现在假设有一个1w元的大红包，瞬间可能会很多人同时来抢，每个人抢的金额也可能不一样，场景很简单，实现方式也有很多种，但前提是保证数据的正确性，比如最普通的使用数据库保证，但对这方面有所了解的同学都知道这并不是一个很好的方案，因为需要锁，并需要大量的数据库操作，导致性能不高，那么我们是否可以用Actor来实现这个需求么？答案是当然可以。

我们首先来定义一个抽奖命令，
```scala
case class LotteryCmd(
  userId: Long, // 参与用户Id
  username: String, //参与用户名
  email: String // 参与用户邮箱
)
```
然后我们实现一个抽奖Actor，并继承PersistentActor作出相应的实现：

```scala
case class LuckyEvent(  //抽奖成功事件
    userId: Long,
    luckyMoney: Int
)
case class FailureEvent(  //抽奖失败事件
    userId: Long,
    reason: String
)
case class Lottery(
    totalAmount: Int,  //红包总金额
    remainAmount: Int  //剩余红包金额
) {
  def update(luckyMoney: Int) = {
    copy(
      remainAmount = remainAmount - luckyMoney
    )
  }
}
class LotteryActor(initState: Lottery) extends PersistentActor with ActorLogging{
  override def persistenceId: String = "lottery-actor-1"

  var state = initState  //初始化Actor的状态

  override def receiveRecover: Receive = {
    case event: LuckyEvent =>
      updateState(event)  //恢复Actor时根据持久化的事件恢复Actor状态
    case SnapshotOffer(_, snapshot: Lottery) =>
      log.info(s"Recover actor state from snapshot and the snapshot is ${snapshot}")
      state = snapshot //利用快照恢复Actor的状态
    case RecoveryCompleted => log.info("the actor recover completed")
  }

  def updateState(le: LuckyEvent) =
    state = state.update(le.luckyMoney)  //更新自身状态

  override def receiveCommand: Receive = {
    case lc: LotteryCmd =>
      doLottery(lc) match {     //进行抽奖，并得到抽奖结果，根据结果做出不同的处理
        case le: LuckyEvent =>  //抽到随机红包
          persist(le) { event =>
            updateState(event)
            increaseEvtCountAndSnapshot()
            sender() ! event
          }
        case fe: FailureEvent =>  //红包已经抽完
          sender() ! fe
      }
    case "saveSnapshot" =>  // 接收存储快照命令执行存储快照操作
      saveSnapshot(state)
    case SaveSnapshotSuccess(metadata) =>  ???  //你可以在快照存储成功后做一些操作，比如删除之前的快照等
  }

  private def increaseEvtCountAndSnapshot() = {
    val snapShotInterval = 5
    if (lastSequenceNr % snapShotInterval == 0 && lastSequenceNr != 0) {  //当有持久化5个事件后我们便存储一次当前Actor状态的快照
      self ! "saveSnapshot"
    }
  }

  def doLottery(lc: LotteryCmd) = {  //抽奖逻辑具体实现
    if (state.remainAmount > 0) {
      val luckyMoney = scala.util.Random.nextInt(state.remainAmount) + 1
      LuckyEvent(lc.userId, luckyMoney)
    }
    else {
      FailureEvent(lc.userId, "下次早点来，红包已被抽完咯！")
    }
  }
}
```
程序很简单，关键位置我也给了注释，相信大家对Actor有所了解的话很容易理解，当然要是有些疑惑，可以看看我之前写的文章，下面我们就对刚才写的抽红包Actor进行测试：

```scala
object PersistenceTest extends App {
  val lottery = Lottery(10000,10000)
  val system = ActorSystem("example-05")
  val lotteryActor = system.actorOf(Props(new LotteryActor(lottery)), "LotteryActor-1")  //创建抽奖Actor
  val pool: ExecutorService = Executors.newFixedThreadPool(10)
  val r = (1 to 100).map(i =>
    new LotteryRun(lotteryActor, LotteryCmd(i.toLong,"godpan","xx@gmail.com"))  //创建100个抽奖请求
  )
  r.map(pool.execute(_))  //使用线程池来发起抽奖请求，模拟同时多人参加
  Thread.sleep(5000)
  pool.shutdown()
  system.terminate()
}

class LotteryRun(lotteryActor: ActorRef, lotteryCmd: LotteryCmd) extends Runnable { //抽奖请求
  implicit val timeout = Timeout(3.seconds)
  def run: Unit = {
    for {
      fut <- lotteryActor ? lotteryCmd
    } yield fut match {  //根据不同事件显示不同的抽奖结果
      case le: LuckyEvent => println(s"恭喜用户${le.userId}抽到了${le.luckyMoney}元红包")
      case fe: FailureEvent =>  println(fe.reason)
      case _ => println("系统错误，请重新抽取")
    }
  }
}
```
运行程序,我们可能看到以下的结果：

<center>
![result persistence demo](/images/2017/07/result-persistence-demo.png)
</center>

下面我会把persistence actor在整个运行过程的步骤给出，帮助大家理解它的原理：

- 1.初始化Persistence Actor
  - 1.1若是第一次初始化，则与正常的Actor的初始化一致。
  - 1.2若是重启恢复Actor，这根据Actor之前持久的数据恢复。
    - 1.2.1从快照恢复，可快速恢复Actor，但并非每次持久化事件都会保存快照，在快照完整的情况下，Actor优先从快照恢复自身状态。
    - 1.2.2从事件（日志，数据库记录等）恢复，通过重放持久化事件恢复Actor状态，比较关键。

- 2.接收命令进行处理，转化为需要持久化的事件（持久化的事件尽量只包含关键性的数据）使用Persistence Actor的持久化方法进行持久化（上述例子中的persist，后面我会讲一下批量持久化），并处理持久化成功后的逻辑处理，比如修改Actor状态，向外部Actor发送消息等。

- 3.若是我们需要存储快照，那么可以主动指定存储快照的频率，比如持久化事件100次我们就存储一次快照，这个频率应该要考虑实际的业务场景，在存储快照成功后我们也可以执行一些操作。

总的来说Persistence Actor运行时的大致操作就是以上这些，当然它是r如何持久化事件，恢复时的机制是怎么样的等有兴趣的可以看一下Akka源码。


### 使用Akka persistence的相关配置

首先我们必须加载相应的依赖包，在`bulid.sbt`中加入以下依赖：

```
libraryDependencies ++= Seq(
"com.typesafe.akka" %% "akka-actor" % "2.4.16",  //Akka actor 核心依赖
  "com.typesafe.akka" %% "akka-persistence" % "2.4.16", //Akka persistence 依赖
  "org.iq80.leveldb"            % "leveldb"          % "0.7", //leveldb java版本依赖
  "org.fusesource.leveldbjni"   % "leveldbjni-all"   % "1.8", //leveldb java版本依赖
  "com.twitter"              %% "chill-akka"                  % "0.8.0" //事件序列化依赖
)
```

另外我们还需在`application.conf`加入以下配置:

```scala
akka.persistence.journal.plugin = "akka.persistence.journal.leveldb"
akka.persistence.snapshot-store.plugin = "akka.persistence.snapshot-store.local"

akka.persistence.journal.leveldb.dir = "log/journal"
akka.persistence.snapshot-store.local.dir = "log/snapshots"

# DO NOT USE THIS IN PRODUCTION !!!
# See also https://github.com/typesafehub/activator/issues/287
akka.persistence.journal.leveldb.native = false  //因为我们本地并没有安装leveldb，所以这个属性置为false，但是生产环境并不推荐使用

akka.actor.serializers {
  kryo = "com.twitter.chill.akka.AkkaSerializer"
}

akka.actor.serialization-bindings {
  "scala.Product" = kryo
  "akka.persistence.PersistentRepr" = kryo
}
```

至此为止我们整个Akka persistence demo已经搭建好了，可以正常运行了，有兴趣的同学可以下载源码。[源码链接](https://github.com/godpan/akka-demo/tree/master/Example_05)

### Akka persistence进阶

#### 1.持久化插件

有同学可能会问，我对leveldb不是很熟悉亦或者觉得单机存储并不是安全，有没有支持分布式数据存储的插件呢，比如某爸的云数据库？答案当然是有咯，良心的我当然是帮你们都找好咯。

- 1.akka-persistence-sql-async: 支持MySQL和PostgreSQL，另外使用了全异步的数据库驱动，提供异步非阻塞的API，我司用的就是它的变种版，6的飞起。[项目地址](https://github.com/okumin/akka-persistence-sql-async)

- 2.akka-persistence-cassandra: 官方推荐的插件，使用写性能very very very fast的cassandra数据库，是几个插件中比较流行的一个，另外它还支持persistence query。[项目地址](https://github.com/krasserm/akka-persistence-cassandra)

- 3.akka-persistence-redis: redis应该也很符合Akka persistence的场景，熟悉redis的同学可以使用看看。[项目地址](https://github.com/hootsuite/akka-persistence-redis)

- 4.akka-persistence-jdbc: 怎么能少了jdbc呢？不然怎么对的起java爸爸呢，支持scala和java哦。[项目地址](https://github.com/dnvriend/akka-persistence-jdbc)

相应的插件的具体使用可以看该项目的具体介绍使用，我看了下相对来说都是比较容易的。

#### 2.批量持久化

上面说到我司用的是akka-persistence-sql-async插件，所以我们是将事件和快照持久化到数据库的，一开始我也是像上面demo一样，每次事件都会持久化到数据库，但是后来在性能测试的时候，因为本身业务场景对数据库的压力也比较大，在当数据库到达每秒1000+的读写量后，另外说明一下使用的是某云数据库，性能中配以上，发现每次持久化的时间将近要15ms，这样换算一下的话Actor每秒只能处理60~70个需要持久化的事件，而实际业务场景要求Actor必须在3秒内返回处理结果，这种情况下导致大量消息处理超时得不到反馈，另外还有大量的消息得不到处理，导致系统错误暴增，用户体验下降，既然我们发现了问题，那么我们能不能进行优化呢?事实上当然是可以，既然单个插入慢，那么我们能不能批量插入呢，Akka persistence为我们提供了persistAll方法，下面我就对上面的demo进行一下改造，让其变成批量持久化：

```scala
class LotteryActorN(initState: Lottery) extends PersistentActor with ActorLogging{
  override def persistenceId: String = "lottery-actor-2"

  var state = initState  //初始化Actor的状态

  override def receiveRecover: Receive = {
    case event: LuckyEvent =>
      updateState(event)  //恢复Actor时根据持久化的事件恢复Actor状态
    case SnapshotOffer(_, snapshot: Lottery) =>
      log.info(s"Recover actor state from snapshot and the snapshot is ${snapshot}")
      state = snapshot //利用快照恢复Actor的状态
    case RecoveryCompleted => log.info("the actor recover completed")
  }

  def updateState(le: LuckyEvent) =
    state = state.update(le.luckyMoney)  //更新自身状态

  var lotteryQueue : ArrayBuffer[(LotteryCmd, ActorRef)] = ArrayBuffer()

  context.system.scheduler  //定时器，定时触发抽奖逻辑
    .schedule(
      0.milliseconds,
      100.milliseconds,
      new Runnable {
        def run = {
          self ! "doLottery"
        }
      }
    )

  override def receiveCommand: Receive = {
    case lc: LotteryCmd =>
      lotteryQueue = lotteryQueue :+ (lc, sender())  //参与信息加入抽奖队列
      println(s"the lotteryQueue size is ${lotteryQueue.size}")
      if (lotteryQueue.size > 5)  //当参与人数有5个时触发抽奖
        joinN(lotteryQueue)
    case "doLottery" =>
      if (lotteryQueue.size > 0)
        joinN(lotteryQueue)
    case "saveSnapshot" =>  // 接收存储快照命令执行存储快照操作
      saveSnapshot(state)
    case SaveSnapshotSuccess(metadata) =>  ???  //你可以在快照存储成功后做一些操作，比如删除之前的快照等
  }

  private def joinN(lotteryQueue: ArrayBuffer[(LotteryCmd, ActorRef)]) = {  //批量处理抽奖结果
    val rs = doLotteryN(lotteryQueue)
    val success = rs.collect {  //得到其中中奖的相应信息
      case (event: LuckyEvent, ref: ActorRef) =>
        event -> ref
    }.toMap
    val failure = rs.collect {  //得到其中未中奖的相应信息
      case (event: FailureEvent, ref: ActorRef) => event -> ref
    }
    persistAll(success.keys.toIndexedSeq) {  //批量持久化中奖用户事件
      case event =>  println(event)
        updateState(event)
        increaseEvtCountAndSnapshot()
        success(event) ! event
    }
    failure.foreach {
      case (event, ref) => ref ! event
    }
    this.lotteryQueue.clear()  //清空参与队列
  }


  private def increaseEvtCountAndSnapshot() = {
    val snapShotInterval = 5
    if (lastSequenceNr % snapShotInterval == 0 && lastSequenceNr != 0) {  //当有持久化5个事件后我们便存储一次当前Actor状态的快照
      self ! "saveSnapshot"
    }
  }

  private def doLotteryN(lotteryQueue: ArrayBuffer[(LotteryCmd, ActorRef)]) = {  //抽奖逻辑具体实现
    var remainAmount = state.remainAmount
    lotteryQueue.map(lq =>
      if (remainAmount > 0) {
        val luckyMoney = scala.util.Random.nextInt(remainAmount) + 1
        remainAmount = remainAmount - luckyMoney
        (LuckyEvent(lq._1.userId, luckyMoney),lq._2)
      }
      else {
        (FailureEvent(lq._1.userId, "下次早点来，红包已被抽完咯！"),lq._2)
      }
    )
  }
}
```
这是改造后的参与Actor，实现了批量持久的功能，当然这里为了给发送者返回消息，处理逻辑稍微复杂了一点，不过真实场景可能会更复杂，相关源码也在刚才的项目上。

#### 3.Persistence Query

另外Akka Persistence还提供了Query接口，用于需要查询持久化事件的需求，这部分内容可能要根据实际业务场景考虑是否需要应用，我就不展开讲了，另外我也写了一个小demo在项目中，想要尝试的同学也可以试试。