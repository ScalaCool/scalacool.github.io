---
title: Akka系列（九）：Akka分布式之Akka Remote
author: Godpan
tags: 
- Akka
description: Akka作为一个天生用于构建分布式应用的工具，当然提供了用于分布式组件即Akka Remote，那么我们就来看看如何用Akka Remote以及Akka Serialization来构建分布式应用。
date: 2017-08-28 10:00
---

Akka作为一个天生用于构建分布式应用的工具，当然提供了用于分布式组件即Akka Remote，那么我们就来看看如何用Akka Remote以及Akka Serialization来构建分布式应用。

### 背景

很多同学在程序的开发中都会遇到一个问题，当业务需求变得越来越复杂，单机服务器已经不足以承载相应的请求的时候，我们都会考虑将服务部署到不同的服务器上，但服务器之间可能需要相互调用，那么系统必须拥有相互通信的接口，用于相应的数据交互，这时候一个好的远程调用方案是一个绝对的利器，主流的远程通信有以下几种选择：

- RPC（Remote Procedure Call Protocol）
- Web Service
- JMS（Java Messaging Service）

这几种方式都是被采用比较广泛的通信方案，有兴趣的同学可以自己去了解一下，这里我会讲一下Java中的RPC即RMI （Remote Method Invocation）和JMS。

### JAVA远程调用

RMI和JMS相信很多写过Java程序的同学都知道，是Java程序用来远程通信的主要方式，那么RMI和JMS又有什么区别呢？

#### 1.RMI

##### i.特征：

- 同步通信：在使用RMI调用远程方法时，线程会持续等待直到结果返回，所以它是一个同步阻塞操作；
- 强耦合：请求的系统中需要使用的RMI服务进行接口声明，返回的数据类型有一定的约束；

##### ii.优点：

- 实现相对简单，方法调用形式通俗易理解，接口声明服务功能清晰。

##### iii.缺点：

- 只局限支持JVM平台；
- 对无法兼容Java语言的其他语言也不适用；

#### 2.JMS

##### i.特征：

- 异步通信：JMS发送消息进行通信，在通信过程中，线程不会被阻塞，不必等待请求回应，所以是一个异步操作；
- 松耦合：不需要接口声明，返回的数据类型可以是各种各样，比如JSON，XML等；

##### ii.通信方式：

（1）点对点消息传送模型

顾名思义，点对点可以理解为两个服务器的定点通信，发送者和接收者都能明确知道对方是谁，大致模型如下：
![jms-point-to-point](/images/2017/08/jms-point-to-point.png)

（2）发布/订阅消息传递模型

点对点模型有些场景并不是很适用，比如有一台主服务器，它产生一条消息需要让所有的从服务器都能收到，若采用点对点模型的话，那主服务器需要循环发送消息，后续若有新的从服务器增加，还要改主服务器的配置，这样就会导致不必要的麻烦，那么发布/订阅模型是怎么样的呢？其实这种模式跟设计模式中的观察者模式很相似，相信很多同学都很熟悉，它最大的特点就是较松耦合，易扩展等特点，所以发布/订阅模型的大致结构如下：

![jms-point-to-point](/images/2017/08/jms-topic.png)

##### iii.优点：

- 由于使用异步通信，不需要线程暂停等待，性能相对较高。

##### iiii.缺点：

- 技术实现相对复杂，并需要维护相关的消息队列；

更通俗的说：

**RMI可以看成是用打电话的方式进行信息交流，而JMS更像是发短信。**

总的来说两种方式没有孰优孰劣，我们也不用比较到底哪种方式比较好，存在即合理，更重要的是哪种选择可能更适合你的系统。

### RMI Example

这里我写一个RMI的例子，一方面来看一下它的使用方式，另一方面用于和后续的Akka Remote做一些比较：

首先我们来编写相应的传输对象和通信接口：

1.JoinRmiEvt： 
```java
public class JoinRmiEvt implements Remote , Serializable{
    private static final long serialVersionUID = 1L;
    private Long id;
    private String name;

    public JoinRmiEvt(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

2.RemoteRmi:
```java
public interface RemoteRmi extends Remote {
    public void sendNoReturn(String message) throws RemoteException, InterruptedException;
    public String sendHasReturn(JoinRmiEvt joinRmiEvt) throws RemoteException;
}

```

然后在服务端对该接口进行实现：

3.RemoteRmiImpl:
```java
public class RemoteRmiImpl extends UnicastRemoteObject implements RemoteRmi {

    private static final long serialVersionUID = 1L;

    public  RemoteRmiImpl() throws RemoteException {};

    @Override
    public void sendNoReturn(String message) throws RemoteException, InterruptedException {
        Thread.sleep(2000);
        //throw new RemoteException(); 
    }

    @Override
    public String sendHasReturn(JoinRmiEvt joinRmiEvt) throws RemoteException {
      if (joinRmiEvt.getId() >= 0)
          return new StringBuilder("the").append(joinRmiEvt.getName()).append("has join").toString();
      else return null;
    }
}
```

接着我们在Server端绑定相应端口并发布服务，然后启动：

```java
public class RemoteRMIServer {
    public static void main(String[] args) throws RemoteException, AlreadyBoundException, MalformedURLException, InterruptedException {
        System.out.println("the RemoteRMIServer is Starting ...");
        RemoteRmiImpl remoteRmi = new RemoteRmiImpl();
        System.out.println("Binding server implementation to registry");
        LocateRegistry.createRegistry(2553);
        Naming.bind("rmi://127.0.0.1:2553/remote_rmi",remoteRmi);
        System.out.println("the RemoteRMIServer is Started");
        Thread.sleep(10000000);
    }
}
```

下面我们在Client端调用Server端的服务：

```java
public class RemoteRmiClient {
    public static void main(String[] args) throws RemoteException, NotBoundException, MalformedURLException, InterruptedException {
        System.out.println("the client has started");
        String url = "rmi://127.0.0.1:2553/remote_rmi";
        RemoteRmi remoteRmi = (RemoteRmi) Naming.lookup(url);
        System.out.println("the client has running");
        remoteRmi.sendNoReturn("send no return");
        System.out.println(remoteRmi.sendHasReturn(new JoinRmiEvt(1L,"godpan")));
        System.out.println("the client has end");
    }
}
```

运行结果：

![java-rmi-result](/images/2017/08/java-rmi-result.png)

从运行结果和代码上分析可得：

- Java Rmi调用是一个阻塞的过程，这会导致一个问题，假如服务端的服务奔溃了，会导致客户端没有反应；
- Java Rmi使用的是Java默认的序列化方式,性能并不是很好，而且并不提供支持使用其他序列化的接口，在一些性能要求高的系统会有一定的瓶颈；
- 在Rmi中使用的相应的接口和对象必须实现相应的接口，必须制定抛出相应的Exception，导致代码看起来异常的繁琐；

### Akka Remote

上面讲到JAVA中远程通信的方式，但我们之前说过Akka也是基于JVM平台的，那么它的通信方式又有什么不同呢？

在我看来，Akka的远程通信方式更像是RMI和JMS的结合，但更偏向于JMS的方式，为什么这么说呢，我们先来看一个示例:

我们先来创建一个远程的Actor：

```scala
class RemoteActor extends Actor {
  def receive = {
    case msg: String =>
      println(s"RemoteActor received message '$msg'")
      sender ! "Hello from the RemoteActor"
  }
}
```

现在我们在远程服务器上启动这个Actor：

```scala
val system = ActorSystem("RemoteDemoSystem")
val remoteActor = system.actorOf(Props[RemoteActor], name = "RemoteActor")
```

那么现在我们假如有一个系统需要向这个Actor发送消息应该怎么做呢？

首先我们需要类似RMI发布自己的服务一样，我们需要为其他系统调用远程Actor提供消息通信的接口，在Akka中，设置非常简单，不需要代码侵入，只需简单的在配置文件里配置即可：

```
akka {
  actor {
    provider = "akka.remote.RemoteActorRefProvider"
  }
  remote {
    enabled-transports = ["akka.remote.netty.tcp"]
    netty.tcp {
      hostname = $localIp  //比如127.0.0.1
      port = $port //比如2552
    }
    log-sent-messages = on
    log-received-messages = on
  }
}
```

我们只需配置相应的驱动，传输方式，ip，端口等属性就可简单完成Akka Remote的配置。

当然本地服务器也需要配置这些信息，因为Akka之间是需要相互通信的，当然配置除了hostname有一定的区别外，其他配置信息可一致，本例子是在同一台机器上，所以这里hostname是相同的。

这时候我们就可以在本地的服务器向这个Actor发送消息了，首先我们可以创建一个本地的Actor：

```scala
case object Init
case object SendNoReturn

class LocalActor extends Actor{

  val path = ConfigFactory.defaultApplication().getString("remote.actor.name.test")
  implicit val timeout = Timeout(4.seconds)
  val remoteActor = context.actorSelection(path)

  def receive: Receive = {
    case Init => "init local actor"
    case SendNoReturn => remoteActor ! "hello remote actor"
  }
}
```

其中的`remote.actor.name.test`的值为：“akka.tcp://RemoteDemoSystem@127.0.0.1:4444/user/RemoteActor”，另外我们可以看到我们使用了`context.actorSelection(path)`来获取的是一个ActorSelection对象，若是需要获得ActorRef，我们可以调用它的resolveOne(),它返回的是是一个Future[ActorRef],这里是不是很熟悉，因为它跟本地获取Actor方式是一样的，因为Akka中Actor是位置透明的，获取本地Actor和远程Actor是一样的。

最后我们首先启动远程Actor的系统：

```scala
object RemoteDemo extends App  {
  val system = ActorSystem("RemoteDemoSystem")
  val remoteActor = system.actorOf(Props[RemoteActor], name = "RemoteActor")
  remoteActor ! "The RemoteActor is alive"
}
```

然后我们在本地系统中启动这个LocalActor，并向它发送消息：

```scala
object LocalDemo extends App {

  implicit val system = ActorSystem("LocalDemoSystem")
  val localActor = system.actorOf(Props[LocalActor], name = "LocalActor")

  localActor ! Init
  localActor ! SendNoReturn
}
```

我们可以看到RemoteActor收到了一条消息：

![send-no-return](/images/2017/08/send-no-return.png)

从以上的步骤和结果看出可以看出，Akka的远程通信跟JMS的点对点模式似乎更相似一点，但是它有不需要我们维护消息队列，而是使用Actor自身的邮箱，另外我们利用context.actorSelection获取的ActorRef，可以看成远程Actor的副本，这个又和RMI相关概念类似，所以说Akka远程通信的形式上像是RMI和JMS的结合,当然底层还是通过TCP、UDP等相关网络协议进行数据传输的，从配置文件的相应内容便可以看出。

上述例子演示的是sendNoReturn的模式，那么假如我们需要远程Actor给我们一个回复应该怎么做呢？

首先我们创建一个消息：

```scala
case object SendHasReturn

 def receive: Receive = {
    case SendHasReturn =>
      for {
        r <- remoteActor.ask("hello remote actor")
      } yield r
  }
```

我们重新运行LocalActor并像RemoteActor发送一条消息：

![send-has-return](/images/2017/08/send-has-return.png)

可以看到LocalActor在发送消息后并收到了RemoteActor返回来的消息，另外我们这里设置了超时时间，若在规定的时间内没有得到反馈，程序就会报错。


### Akka Serialization

其实这一部分本可以单独拿出来写，但是相信序列化这块大家都应该有所了解了，所以就不准备讲太多序列化的知识了，怕班门弄斧，主要讲讲Akka中的序列化。

继续上面的例子，假如我们这时向RemoteActor发送一个自定义的对象，比如一个case class对象，但是我们这是是在网络中传输这个消息，那么怎么保证这个对象类型和值呢，在同一个JVM系统中我们不需要担心这个，因为对象就在堆中，我们只要传递相应的地址即可就行，但是在不同的环境中，我们并不能这么做，我们在网络中只能传输字节数据，所以我们必须将对象做特殊的处理，在传输的时候转化成特定的由一连串字节组成的数据，而且我们又可以根据这些数据恢复成一个相应的对象，这便是序列化。

我们先定义一个参与的case class, 并修改一下上面发送消息的语句:

```
case object SendSerialization
case class JoinEvt(
    id: Long,
    name: String
)
def receive: Receive = {
    case SendSerialization =>
      for {
        r <- remoteActor.ask(JoinEvt(1L,"godpan"))
      } yield println(r)
  }
```

这时我们重新启动RemoteActor和LocalActor所在的系统，发送这条消息：

![send-serialization](/images/2017/08/send-serialization.png)

有同学可能会觉得奇怪，我们明明没有对JoinEvt进行过任何序列化的标识和处理，为什么程序还能运行成功呢？

其实不然，只不过是有人替我们默认做了，不用说，肯定是贴心的Akka，它为我们提供了一个默认的序列化策略，那就是我们熟悉又纠结的java.io.Serializable，沉浸在它的易使用性上，又对它的性能深恶痛绝，尤其是当有大量对象需要传输的分布式系统，如果是小系统，当我没说，毕竟存在即合理。

又有同学说，既然Akka是一个天生分布式组件，为什么还用低效的java.io.Serializable，你问我我也不知道，可能当时的作者偷了偷懒，当然Akka现在可能觉醒了，首先它支持第三方的序列化工具，当然如果你有特殊需求，你也可以自己实现一个，而且在最新的文档中说明，在Akka 2.5x之后Akka内核消息全面废弃java.io.Serializable，用户自定义的消息暂时还是支持使用java.io.Serializable的，但是不推荐用，因为它是低效的，容易被攻击，所以在这里我也推荐大家再Akka中尽量不要在使用了java.io.Serializable。

那么在Akka中我们如何使用第三方的序列化工具呢？

这里我推荐一个在Java社区已经久负盛名的序列化工具：kryo，有兴趣的同学可以去了解一下：[kryo](https://github.com/EsotericSoftware/kryo),而且它也提供Akka使用的相关包，这里我们就使用它作为示例：

这里我贴上整个项目的build.sbt, kryo的相关依赖也在里面：

```scala

import sbt._
import sbt.Keys._

lazy val AllLibraryDependencies =
  Seq(
    "com.typesafe.akka" %% "akka-actor" % "2.5.3",
    "com.typesafe.akka" %% "akka-remote" % "2.5.3",
    "com.twitter" %% "chill-akka" % "0.8.4"
  )

lazy val commonSettings = Seq(
  name := "AkkaRemoting",
  version := "1.0",
  scalaVersion := "2.11.11",
  libraryDependencies := AllLibraryDependencies
)

lazy val remote = (project in file("remote"))
  .settings(commonSettings: _*)
  .settings(
    // other settings
  )

lazy val local = (project in file("local"))
  .settings(commonSettings: _*)
  .settings(
    // other settings
  )

```

然后我们只需将application.conf中的actor配置替换成以下的内容：

```scala
actor {
    provider = "akka.remote.RemoteActorRefProvider"
    serializers {
      kryo = "com.twitter.chill.akka.AkkaSerializer"
    }
    serialization-bindings {
      "java.io.Serializable" = none
      "scala.Product" = kryo
    }
  }
```

其实其中的"java.io.Serializable" = none可以省略，因为若是有其他序列化的策略则会替换掉默认的java.io.Serializable的策略，这里只是为了更加仔细的说明。

至此我们就可以使用kryo了，整个过程是不是很easy，迫不及待开始写demo了，那就快快开始吧。

从运行结果和代码上分析可得：

- Akka Remote使用内置的序列化工具，并支持配置指定的序列化方式，可以按需配置；
- Akka Remote使用的过程是一个异步非阻塞的过程，客户端能尽量减少对服务端的依赖；
- Akka Remote的代码实现相对Java Rmi实现来说简单的多，非常简洁；

1.Akka Remote 

整个例子的相关的源码已经上传到akka-demo中：[源码链接](https://github.com/godpan/akka-demo/tree/master/Example_06)








