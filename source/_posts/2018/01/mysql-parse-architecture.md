---
title: Asyncdb（五）：MySQL驱动架构设计
author: Godpan
tags:
- Asyncdb
- 数据库
- 网络编程
- ~Asyncdb
- ^Godpan
date: 2018-01-05
description: 上一篇文章我们讲了MySQL网络协议分析，包括如何与MySQL进行通信，数据包的格式等内容，今天我主要会讲讲如何设计一个MySQL解析包类库（类似mysql-connector-xxx山寨版)。
---

上一篇文章我们讲了MySQL网络协议分析，包括如何与MySQL进行通信，数据包的格式等内容，今天我主要会讲如何设计一个MySQL解析包类库（类似mysql-connector-xxx山寨版)，本篇文章不具备实际使用意义，更多的是一种架构的设计的尝试以及可以帮助大家理解一些相应第三方包的设计，为未来更从容的应对工作中遇到的问题。

## 文章概述

我会从最开始的数据库连接到最终的数据获取一系列步骤的讲解，辅助示例代码用Java编写，本文的主要几个方面分别是：

- 数据包模型类设计
- 数据包解析类设计
- 相关网络传输类设计
- 相关编码工具类设计

### 数据包模型类设计

数据包模型类设计主要是将数据库传输给我们的数据包解析成我们程序中的模型类，好比你实际业务中建立的JavaBean，这些类的结构依赖于上一篇文章中解析的数据包内容，相关细节请参考上篇文章[MySQL网络协议分析](http://www.godpan.me/2017/11/10/mysql-protocol.html),根据具体的数据内容我们可以构建以下模型类：

- EOF（标志类）
- Error（错误类）
- Field（数据列信息类）
- Handshake （初始化类）
- Ok（Ok类）
- Parameter（错误类）
- PSOK（预处理执行OK类）
- ResultSetHeader（查询结果集头部类）
- RowData（具体列数据结构类）
- RowDataBinary（Binary数据结构类）

相信看过我前篇文章的同学，对上面很多类应该比较熟悉了，比如我们定义一个OK为以下结构：

```java
public class OK implements Packet {
    private long affectedRows; //影响行数
    private long insertId; //自增id
    private int serverStatus; //服务器状态
    private String message; //额外信息
    ...
}
```

其他一些相关类的结构我这边就不在贴出了，有兴趣的同学可以参考mysql-connector-java包源码，或者看我的[github项目](https://github.com/godpan/java-connection-mysql)也行（搬砖有点不好意思...）,这部分内容是怎么解析的基础结构，充分掌握有助于后续的理解。

### 数据包解析类设计

假设我们现在已经写好了解析后的数据包模型类，那么我们怎么将最原始的字节数据转换成这些类呢？首先我们分析解析的过程中需要哪些东西。

- 需要知道解析包的类型；
- 包的大小；
- 包结构字段定义长度，当前解析数据块位置；
- 临时Buffer
- 解析结果存储

这些元素是解析主要的需要的主要结构，可能还有一些其他的内容这里就不阐述了，所以我们可以设计下面的解析类：

```java
public class Parser {
    private List<Integer> waitFor = new LinkedList<Integer>(); //接下去要解析的包类型
    private int dataIdx = 0; //当前解析数据包数据块的索引
    private ByteBuffer buffer = ByteBuffer.allocate(65536); //临时Buffer
    private int packetSize = -1; //包大小
    private int itemSize = 0; //当前解析数据包数据块的大小
    private Packet packet = null; //解析结果
    ...
}

```

上面的属性都是解析过程需要初始值，中间变量，结果等，除了这些属性外，我们还需要有将Buffer中数据转换为我们需要数据的方法，根据MySQL协议中的编码方式，主要有以下三个方法：

```java
private void readNullTerminated(ByteBuffer in) {  //对应NullTerminatedString（Null结尾方式）: 字符串以遇到Null作为结束标志，相应的字节为00。
    ...
}

private void readLengthCodedBinary(ByteBuffer in) { //对应LengthEncodedInteger编码方式，根据第一个字节区分数据所占的字节长度
    ...
}

private void readLengthCodedString(ByteBuffer in) { //对应LengthEncodedString编码方式，字符串的值根据nteger + Value组成，通过计算Integer的值来获取Value的具体的长度。
     ...
}   

```

有了以上的属性和相应方法后，我们便可以将服务器传来数据包解析成我们想要的数据了。

### 相关网络传输类设计

整理的网络传输类其实就是我们常见Connection类，它是程序中与数据库服务器进行交互的最重要的类，我们可以描述一下它有以下的几点功能：

- 1.建立数据库连接；
- 2.检验用户，登录等；
- 3.执行相应的数据库命令，增删改查等；
- 4.接收数据库传来的数据包，并利用Parser类进行解析；
- 5.关闭数据库连接；

基于这些需求我们可以构建出如下的Connection类：

```java

public class MysqlConnection {
    private Handshake handshake; //握手初始包类
    private final ByteBuffer out = ByteBuffer.allocate(65536);  //发送给服务端的数据Buffer
    private final ByteBuffer in = ByteBuffer.allocate(65536); // 接收的数据Buffer
    private SocketChannel channel; //异步IO传输通道
    private Parser parser = new Parser(); //解析类
    private String host; //数据库服务器host
    private int port; //数据库服务器端口
    private String user; //数据库用户名
    private String password; //数据库密码
    private String database; //连接具体的数据库
    private Selector selector; //注册channel的selector
    private long connectionId = 0L; //连接id
}

```

这些属性相应对数据库驱动稍微有所了解的人都非常熟悉，因为平常写程序经常跟他们打交道，有了上面这些属性，我们还需要一些方法，比如连接数据库，执行命令，读取数据，关闭数据库等方法，所以可以定义以下的一些方法：

```java
private void connect() { //连接数据库
    ...
}

public void auth () { //校验账户
    ...
}

public void query () { //执行普通查询
    ...
}

public void update () { //执行普通更新
    ...    
}

public void executeQuery () { //执行预处理查询
    ...
}

public void executeUpdate () { //执行预处理更新
    ...
}

public void read () { //读取通道中的数据
    ...
}

private void send () { //向服务器发送数据
    ...
}

public void close() { //关闭数据库
    ...
}

```

这都是一些必要且常用的方法，相信很多人在实际开发中都有所使用，有了以上的一些属性和方法后我们就可以搭建出一个Connection类的基本模型，至于其他一些对象，比如数据库连接池，预处理对象都是基于最基础的Connection。

### 相关编码工具类设计

其实上面的一些类与方法，已经能组装成一个简单的与数据库交互的驱动，但是我们知道，我们向数据库服务器发送指令的时候，并不是向我们直接在数据库终端写SQL执行那么简单，而是需要根据数据库的相应协议将我们需要执行的SQL翻译成相应的字节流再发送给数据库服务端，所以我们必须有相关的编码工具类，比如Long类型编码，NULL值编码等等，所以我们需要写相应的编码类提高我们对SQL编码的效率，它应该具有以下的功能：

```
public static void longEncoded(){ //long类型编码
    ...
}

public static void nullTerminatedStringEncoded() { //nullTerminatedString编码
    ...
}
public static void lengthEncodedStringEncoded() { //lengthEncodedString编码
    ...
}

private static void dateEncoded () { //Date类型编码
    ...
}

```

通常来说，上面这四种编码方式可以实现大部分场景的SQL编码了，方法的具体实现取决于实际中程序的数据类型和编码协议可参考我的上一篇文章。

## 总结

这篇文章主要讲解了如何去设计一个简单的数据库驱动，它最基本应该具备些什么，各个模块间又是怎么搭配的，这些内容不仅仅让我们了解与数据库通信的步骤，也可以让我们对目前使用的第三方数据库驱动有更深入的了解，最后我会画一张图里梳理了一下所有模块间的联系，帮助大家理解：

![mysql-connection](/images/2018/01/mysql-connection.png)
