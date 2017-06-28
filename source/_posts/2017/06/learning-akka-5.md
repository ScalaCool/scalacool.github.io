---
title: Akka 系列（四）：Akka 中的共享内存模型
author: Godpan
tags: 
- Akka
description: 随着CPU的核数的增加，异步编程模型在并发领域中的得到了越来越多的应用，由于Scala是一门函数式语言，天然的支持异步编程模型，今天主要来看一下Java和Scala中的Futrue，带你走入异步编程的大门。
date: 2017-06-26
---

随着CPU的核数的增加，异步编程模型在并发领域中的得到了越来越多的应用，由于Scala是一门函数式语言，天然的支持异步编程模型，今天主要来看一下Java和Scala中的Futrue，带你走入异步编程的大门。

## Future

很多同学可能会有疑问，Futrue跟异步编程有什么关系？从Future的表面意思是未来，一个Future对象可以看出一个将来得到的结果，这就和异步执行的概念很像，你只管自己去执行，只要将最终的结果传达给我就行，线程不必一直暂停等待结果，可以在具体异步任务执行的时候去执行其他操作，举个例子：

![async work](/images/2017/06/async-work.png)

我们现在在执行做饭这么一个任务，它需要煮饭，烧菜，摆置餐具等操作，如果我们通过异步这种概念去执行这个任务，比如煮饭可能需要比较久的时间，但煮饭这个过程又不需要我们管理，我们可以利用这段时间去烧菜，烧菜过程中也可能有空闲时间，我们可以去摆置餐具，当电饭锅通知我们饭烧好了，菜也烧好了，最后我们就可以开始吃饭了，所以说，上面的“**煮饭 -> 饭**”，“**烧菜 -> 菜**”都可以看成一个Future的过程。

### Java中的Future

在Java的早期版本中，我们不能得到线程的执行结果，不管是继承Thread类还是实现Runnable接口，都无法获取线程的执行结果，所以我们只能在线程执行的run方法里去做相应的一些业务逻辑操作，但随着Java5的发布，它为了我们带来了Callable和Future接口，我们可以利用这两个接口的特性来获取线程的执行结果。

#### Callable接口

通俗的讲，Callable接口也是一个线程执行类接口，那么它跟Runnable接口有什么区别呢？我们先来看看它们两个的定义：

1.Callable接口：

```java
@FunctionalInterface
public interface Callable<V> {
    /**
     * Computes a result, or throws an exception if unable to do so.
     *
     * @return computed result
     * @throws Exception if unable to compute a result
     */
    V call() throws Exception;
}

```

2.Runnable接口：

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}

```
从上面的定义，我们可以看出，两者最大的区别就是对应的执行方法是否有返回值。Callable接口中call方法具有返回值，这便是为什么我们可以通过Callable接口来得到一个线程执行的返回值或者是异常信息。

#### Future接口

上面说到既然Callable接口能返回线程执行的结果，那么为什么还需要Future接口呢？因为Callable接口执行的结果只是一个将来的结果值，我们若是需要得到具体的结果就必须利用Future接口，另外Callable接口需要委托ExecutorService的submit提交任务去执行，我们来看看它是如何定义的：

```java
 <T> Future<T> submit(Callable<T> task);
 
 public <T> Future<T> submit(Callable<T> task) {
        if (task == null) throw new NullPointerException();
        RunnableFuture<T> ftask = newTaskFor(task);
        execute(ftask);
        return ftask;
    }
 
```
从submit的方法定义也可以看出它的返回值是一个Future接口类型的值，这里其实是RunnableFuture接口，这是一个很重要的接口，我们来看一下它的定义：

```java
public interface RunnableFuture<V> extends Runnable, Future<V> {
    /**
     * Sets this Future to the result of its computation
     * unless it has been cancelled.
     */
    void run();
}

```
这个接口分别继承了Runnable和Future接口，而FutureTask又实现了RunnableFuture接口，它们之间的关系：

![future runnable](/images/2017/06/future-runnable.png)

RunnableFuture有以下两个特点：

- 继承Runnable接口，还是以run方法作为线程执行入口，其实上面submit方法的具体实现也可以看出，一个Callable的Task再执行的时候会被包装成RunnableFuture，然后以FutureTask作为实现类，执行FutureTask时，还是执行其的run方法，只不过run方法里面的业务逻辑是由我们定义的call方法的内容，当然再执行run方法时，程序会自动将call方法的执行结果帮我们包装起来，对外部表现成一个Future对象。

- 继承Future接口，通过实现Future接口中的方法更新或者获取线程的的执行状态，比如其中的cancel(),isDone(),get()等方法。

#### Future程序示例与结果获取

下面是一个简单的Future示例，我们先来看一下代码：

```java
ExecutorService es = Executors.newSingleThreadExecutor();
Future f = es.submit(() -> {
        System.out.println("execute call");
        Thread.sleep(1000);
        return 5;
    });
try {
    System.out.println(f.isDone()); //检测任务是否完成
    System.out.println(f.get(2000, TimeUnit.MILLISECONDS));
    System.out.println(f.isDone()); //检测任务是否完成
} catch (InterruptedException e) {
    e.printStackTrace();
} catch (ExecutionException e) {
    e.printStackTrace();
} catch (TimeoutException e) {
    e.printStackTrace();
}
``` 
上面的代码使用了lambda表达式，有兴趣的同学可以自己去了解下，这里我们首先构建了一个ExecutorService，然后利用submit提交执行Callable接口的任务。

**为什么是Callable接口呢？** 其实这里我们并没有显示声明Callable接口，这里lambda会帮我们自动进行类型推导，首先submit接受Callable接口或Runnble接口类型作为参数，而这里我们又给定了返回值，所以lambda能自动帮我们推导出内部是一个Callable接口参数。

到这里我们应该大致清楚了在Java中的得到Future，那么我们又是如何从Future中得到我们想要的值呢？这个结论其实很容易得出，你只需要去跑一下上面的程序即可，在利用get去获取Future中的值时，线程会一直阻塞，直到返回值或者超时，所以Future中的get方法是阻塞，所以虽然利用Future似乎是异步执行任务，但是在某些需求上还是会阻塞的，并不是真正的异步，stackoverflow上有两个讨论说明了这个问题[Future.get](http://stackoverflow.com/questions/31092067/method-call-to-future-get-blocks-is-that-really-desirable)，[without blocking when task complete](http://stackoverflow.com/questions/31092067/method-call-to-future-get-blocks-is-that-really-desirable)，有兴趣的同学可以去看看。

### Scala中的Future

Scala中的Future相对于Java的Future有什么不同呢？我总结了一下几点：

#### 1.创建Future变得很容易

异步编程作为函数式语言的一大优势，Scala对于Future的支持也是非常棒的，首先它也提供了Futrue接口，但不同的是我们在构建Future对象是不用像Java一样那么繁琐，并且非常简单，举个例子：

```scala
import scala.concurrent._ 
import ExecutionContext.Implicits.global 

val f: Future[String] = Future { "Hello World!" }
```
是不是非常简单，也大大降低了我们使用Future的难度。

#### 2.提供真正异步的Future

前面我们也说到，Java中的Future并不是全异步的，当你需要Future里的值的时候，你只能用get去获取它，亦或者不断访问Future的状态，若完成再去取值，但其意义上便不是真正的异步了，它在获取值的时候是一个阻塞的操作，当然也就无法执行其他的操作，直到结果返回。

但在Scala中，我们无需担心，虽然它也提供了类似Java中获取值的方式，比如：

| Future        | Java          | Scala  |
| ------------- |:-------------:| -----:|
| 判断任务是否完成 | isDone        | isCompleted |
| 获取值          | get          |   value |

但是我们并不推荐这么做，因为这么做又回到了Java的老路上了，在Scala中我们可以利用Callback来获取它的结果：

```scala
val fut = Future {
    Thread.sleep(1000)
    1 + 1
}

fut onComplete {
    case Success(r) => println(s"the result is ${r}")
    case _ => println("some Exception")
}

println("I am working")
Thread.sleep(2000)
```
这是一个简单的例子，Future在执行完任务后会进行回调，这里使用了onComplete，也可以注册多个回调函数，但不推荐那么做，因为你不能保证这些回调函数的执行顺序，其他的一些回调函数基本都是基于onComplete的，有兴趣的同学可以去阅读一下Future的源码。

我们先来看一下它的运行结果:

```scala
I am working
the result is 2
```
从结果中我们可以分析得出，我们在利用Callback方式来获取Future结果的时候并不会阻塞，而只是当Future完成后会自动调用onComplete，我们只需要根据它的结果再做处理即可，而其他互不依赖的操作可以继续执行不会阻塞。


#### 3.强大的Future组合

前面我们讲的较多的都是单个Future的情况，但是在真正实际应用时往往会遇到多个Future的情况，那么在Scala中是如何处理这种情况的呢？

Scala中的有多种方式来组合Future,那我们就来看看这些方式吧。

##### 1.flatMap

我们可以利用flatMap来组合多个Future，不多说，先上代码：

```scala
val fut1 = Future {
  println("enter task1")
  Thread.sleep(2000)
  1 + 1
}

val fut2 = Future {
  println("enter task2")
  Thread.sleep(1000)
  2 + 2
}

fut1.flatMap { v1 =>
  fut2.map { v2 =>
    println(s"the result is ${v1 + v2}")
  }
}
Thread.sleep(2500)
```
利用flatMap确实能组合Future，但代码的阅读性实在是有点差，你能想象5个甚至10个map层层套着么，所以我们并不推荐这么做，但是我们需要了解这种方式，其他简洁的方式可能最终转化成的版本也许就是这样的。

##### 2.for yield表达式

我们只是把上面关于flatMap的代码替换一下，看下面：

```scala
for {
  v1 <- fut1
  v2 <- fut2
} yield println(s"the result is ${v1 + v2}")
```
看上去是不是比之前的方式简洁多了，这也是我们在面对Future组合时推荐的方式，当然不得不说for yield表达式是一种语法糖，它最终还是会被翻译成我们常见的方法，比如flatMap，map，filter等，感兴趣的可以参考它的官方文档。[for yield表达式](http://docs.scala-lang.org/tutorials/FAQ/yield.html)

##### 3.scala-async

另外我们可以用scala-async来组装Futrue语句块，示例如下：

```scala
import scala.async.Async.{async, await}

val v1 = async {
  await(fut1) + await(fut2)
}

v1 foreach {
  case r => println(s"the result is ${v1}")
}
```
这种方式与for yield表达式有啥区别呢？其实主要有两点：
- 表达语意更加清晰，不需要用为中间值命名
- 不需要`<-`等表达式，可减少一定的代码量


scala-async相关的具体信息可以参考它的项目主页。[scala-async](https://github.com/scala/async)

总的来说Scala中的Future确实强大，在实现真正异步的情况下，为我们提供许多方便而又简洁的操作模式，其实比如还有Future.reduce()，Future.traverse(),Future.sequence()等方法，这些方法的具体功能和具体使用这里就不讲了，但相关的示例代码都会在我的示例工程里，有兴趣的同学可以去跑跑加深理解。[源码链接](https://github.com/godpan/akka-demo/tree/master/Example_04)

## 总结

这篇文章主要讲解了JVM生态上两大语言Java和Scala在异步编程上的一些表现，这里主要是Future机制，在清楚明白它的概念后，我们才能写出更好的程序，虽然本篇文章没有涉及到Akka相关的内容，但是Akka本身是用Scala写的，而且大量使用了Scala中的Future，相信通过对Future的学习，对Akka的理解会有一定的帮助。