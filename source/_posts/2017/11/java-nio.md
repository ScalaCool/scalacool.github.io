title: Asyncdb（三）：Java NIO
author: Godpan
tags: 
- Asyncdb
- Java
- 网络编程
- ~Asyncdb
- ^Godpan
description: 上篇说了最基础的五种IO模型，相信大家对IO相关的概念应该有了一定的了解，这篇文章主要讲讲基于多路复用IO的Java NIO。
date: 2017-11-08 08:00
---

上篇说了最基础的五种IO模型，相信大家对IO相关的概念应该有了一定的了解，这篇文章主要讲讲基于多路复用IO的Java NIO。

### 背景

Java诞生至今，有好多种IO模型，从最早的Java IO到后来的Java NIO以及最新的Java AIO，每种IO模型都有它自己的特点，详情请看我的上篇文章[Java IO初探]()，而其中的的Java NIO应用非常广泛，尤其是在高并发领域，比如我们常见的Netty，Mina等框架，都是基于它实现的，相信大家都有所了解，下面让我们来看看Java NIO的具体架构。

### Java NIO架构

其实Java NIO模型相对来说也还是比较简单的，它的核心主要有三个，分别是：Selector、Channel和Buffer,我们先来看看它们之间的关系：

![java-nio](https://scala.cool/images/2017/11/java-nio.png)

它们之间的关系很清晰，一个线程对应着一个Selector，一个 Selector 对应着多个Channel，一个Channel对应着一个Buffer，当然这只是通常的做法，一个Channel也可以对应多个Selector，一个Channel对应着多个Buffer。

#### Selector

个人认为Selector是Java NIO的最大特点，之前我们说过，传统的Java IO在面对大量IO请求的时候有心无力，因为每个维护每一个IO请求都需要一个线程，这带来的问题就是，系统资源被极度消耗，吞吐量直线下降，引起系统相关问题，那么Java NIO是如何解决这个问题的呢？答案就是Selector，简单来说它对应着多路IO复用中的监管角色，它负责统一管理IO请求，监听相应的IO事件，并通知对应的线程进行处理，这种模式下就无需为每个IO请求单独分配一个线程，另外也减少线程大量阻塞，资源利用率下降的情况，所以说Selector是Java NIO的精髓，在Java中我们可以这么写：

```java
// 打开服务器套接字通道
ServerSocketChannel ssc = ServerSocketChannel.open();
// 服务器配置为非阻塞
ssc.configureBlocking(false);
// 进行服务的绑定
ssc.bind(new InetSocketAddress("localhost", 8001));

// 通过open()方法找到Selector
Selector selector = Selector.open();
// 注册到selector，等待连接
ssc.register(selector, SelectionKey.OP_ACCEPT);
...
```

#### Channel

Channel本意是通道的意思，简单来说，它在Java NIO中表现的就是一个数据通道，但是这个通道有一个特点，那就是它是双向的，也就是说，我们可以从通道里接收数据，也可以向通道里写数据，不用像Java BIO那样，读数据和写数据需要不同的数据通道，比如最常见的Inputstream和Outputstream，但是它们都是单向的，Channel作为一种全新的设计，它帮助系统以相对小的代价来保持IO请求数据传输的处理，但是它并不真正存放数据，它总是结合着缓存区（Buffer）一起使用，另外Channel主要有以下四种：

- FileChannel：读写文件时使用的通道
- DatagramChannel：传输UDP连接数据时的通道,与Java IO中的DatagramSocket对应
- SocketChannel：传输TCP连接数据时的通道，与Java IO中的Socket对应
- ServerSocketChannel: 监听套接词连接时的通道，与Java IO中的ServerSocket对应

当然其中最重要以及最常用的就是SocketChannel和ServerSocketChannel，也是Java NIO的精髓，ServerSocketChannel可以设置成非阻塞模式，然后结合 Selector 就可以实现多路复用IO，使用一个线程管理多个Socket连接，具体使用可以参数上面的代码。

#### Buffer

顾名思义，Buffer的含义是缓冲区，它在Java NIO中的主要作用就是作为数据的缓冲区域，Buffer对应着某一个Channel，从Channel中读取数据或者向Channel中写数据，Buffer与数组很类似，但是它提供了更多的特性，方便我们对Buffer中的数据进行操作，后面我也会主要分析它的三个属性capacity，position和limit，我们先来看一下Buffer分配时的类别（这里不是指Buffer的具体数据类型）即Direct Buffer和Heap Buffer，那么为什么要有这两种类别的Buffer呢？我们先来看看它们的特性：

Direct Buffer：

- 直接分配在系统内存中；
- 不需要花费将数据库从内存拷贝到Java内存中的成本；
- 虽然Direct Buffer是直接分配中系统内存中的，但当它被重复利用时，只有真正需要数据的那一页数据会被装载到真是的内存中，其它的还存在在虚拟内存中，不会造成实际内存的资源浪费；
- 可以结合特定的机器码，一次可以有顺序的读取多字节单元；
- 因为直接分配在系统内存中，所以它不受Java GC管理，不会自动回收；
- 创建以及销毁的成本比较高；

Heap Buffer： 

- 分配在Java Heap，受Java GC管理生命周期，不需要额外维护；
- 创建成本相对较低；

根据它们的特性，我们可以大致总结出它们的适用场景：

如果这个Buffer可以重复利用，而且你也想多个字节操作，亦或者你对性能要求很高，可以选择使用Direct Buffer，但其编码相对来说会比较复杂，需要注意的点也更多，反之则用Heap Buffer，Buffer的相应创建方法：

```java
//创建Heap Buffer
ByteBuffer heapBuffer = ByteBuffer.allocate(1024);

//创建Direct Buffer
ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);
```


下面我们来看看它的三个属性：

- Capacity：顾名思义它的含义是容量，代表着Buffer的最大容量，与数组的Size很类似，初始化不可更改，除非你改变的Buffer的结构；
- Limit：顾名思义它的含义是界限，代表着Buffer的目前可使用的最大限制，写模式下，一般Limit等于Capacity，读模式下需要你自己控制它的值结合position读取想要的数据；
- Position：顾名思义它的含义是位置，代表着Buffer目前操作的位置，通俗来说，就是你下次对Buffer进行操作的起始位置；

接下来我会用一个图解的列子帮助大家理解,现在我们假设有一个容量为10的Buffer，我们先往里面写入一定字节的数据，然后再根据编码规则从其中读取我们需要的数据：

1.初始Buffer：

```java
ByteBuffer buffer = ByteBuffer.allocate(10);
```

![init-buffer](https://scala.cool/images/2017/11/init-buffer.png)

2.向Buffer中写入两个字节：

```java
buffer.put("my".getBytes());
```

![write-buffer-1](https://scala.cool/images/2017/11/write-buffer-1.png)

3.再Buffer中写入四个字节：

```java
buffer.put("blog".getBytes());
```

![write-buffer-2](https://scala.cool/images/2017/11/write-buffer-2.png)

4.现在我们需要从Buffer中获取数据，首先我们先将写模式转换为读模式：

```java
  buffer.flip();
```

我们来看看flip()方法到底做了什么事？

```java
public final Buffer flip() {
    limit = position;
    position = 0;
    mark = -1;
    return this;
}
```

从源码中可以看出，flip方法根据Buffer目前的相应属性来修改对应的属性，所以flip()方法之后，Buffer目前的状态：

![read-buffer](https://scala.cool/images/2017/11/read-buffer.png)

5.接着我们从Buffer中读取数据

从Buffer中读取数据有多种方式，比如get(),get(byte [])等，相关的具体方法使用可以参考Buffer的官方API文档，这里我们用最简单的get()来获取数据:

```java
  byte a = buffer.get();
  byte b = buffer.get();
```

此时Buffer的状态如下图所示：

![read-buffer-2](https://scala.cool/images/2017/11/read-buffer-2.png)

我们可以按照这种方式读取完我们所需数据，最终调用clear()方法将Buffer置为初始状态。

### 总结

这篇文章主要讲解了Java NIO中重要的三个组成部分，在实际使用过程也是比较重要的，掌握它们之间的关系，可以让你对Java NIO的整个架构更加熟悉，理解相对来说也会更加深刻，并分析了这种模式是如何与多路复用IO模型的映射，了解Java NIO在高并发场景下优势的原因。



