---
title: MySQL网络协议分析
author: Godpan
tags: 
- Asyncdb
- Java
- 网络编程
description: MySQL对大家来说，都应该很熟悉了，从大学里的课程到实际工作中数据的存储查询，很多时候都需要用到数据库，很多人也写过与数据库交互的程序。
---

MySQL对大家来说，都应该很熟悉了，从大学里的课程到实际工作中数据的存储查询，很多时候都需要用到数据库，很多人也写过与数据库交互的程序，在Java中你可能一开始会使用原生mysql-connector-java来进行操作，后来你会接触到Hibernate，Mybatis等ORM框架，其实它们底层也是基于mysql-connector-java，但很多时候我们并不清楚程序是怎么跟数据库具体交互的，比如执行一个SQL查询，程序是如何从MySQL中获取数据的呢？今天就让我们来看看最基础的MySQL网络协议分析。

# 引言

阅读本文之前你需要对网络协议需要有基本的了解，比如两台机子之间的数据是如何通信的，硬件层可以暂时不需了解，但网络层和传输层的协议要有一定的理解，比如IP数据包，TCP/IP协议，UDP协议等相关概念，有了这些基础，有利于你阅读本文。

# 背景

在历史悠久的时代，数据库只作为单机存储，也不怎么需要与程序进行交互的时候的首，它的网络通信并不是那么重要，但随着时代的发展，数据库不再只是单纯的作为一个数据的仓库了，它需要提供与外界的交互，比如远程连接，程序操作数据库等，这时候一份规范的网络通信的协议就非常重要了，比如它是如何校验权限，如何解析SQL语句，如何返回执行结果都需要用到相应的协议，很多时候我们并不需要接触这些内容，因为它太底层了，我们直接使用把它们封装好的第三方包就可以了，为什么还要去学习它的网络协议呢？确实对于一开始学习编程的人来说，这有点操之过急，反而有时候会适得其反，但当你对这一方面有了一定的了解之后，你便会迫不及待得想去探索更深层的奥秘，去了解并学习我们平常用的第三方类库是怎么去实现，明白它的底层原理，甚至对一些莫名其妙的bug也不会再害怕。

# MySQL连接方式

分析协议，我们首先要了解如何与数据库连接，说到MySQL连接方式，大家突然可能有点懵，其实它一直伴随着我们，比如我们第一次装数据库完成后执行的第一次登录，比如你没有设置密码：

```sql
mysql -uroot
```

这是最基本的一种数据库连接方式，那么MySQL连接方式到底有几种呢？到MySQL5.7为止，总共有五种，分别是TCP/IP，TLS/SSL，Unix Sockets，Shared Memory，Named pipes，下面我们就来看看这五种的区别：


方式|默认开启|支持系统|只支持本机|如何开启|参数配置
---|---|---|---|---|---
TCP/IP | 是 | 所有系统 | 否 |--skip-networking=yes/no. | --port<br>--bind-address
TLS/SSL | 是 | 所有系统（基于TCP/IP)之上 | 否 |--ssl=yes/no. | --ssl-* options
Unix Sockets | 是 | 类Unix系统 | 是 | 设置--socket=<empty\> 来关闭. | --socket=socket path
Shared Memory | 否 | Windows系统 | 是 |--shared-memory=on/off. | --shared-memory-base-name=<name\>
Named pipes | 否 | Windows系统 | 否 |--enable-named-pipe=on/off. |  --socket=<name\>

从上表中我们可以清晰看出每种连接方式的区别，接下里我会具体说明几种连接是怎么操作的，由于我的机子是Mac OS系统，这里只模拟非Windows系统下的三种方式,因为这三种方式都是默认开启的，我们不需要进行任何配置：

## 1.Unix Sockets：
```sql
mysql -uroot
```
若你在本机使用这种方式连接MySQL数据库的话，它默认会使用Unix Sockets。

## 2.TCP/IP：

```sql
mysql --protocol=tcp -uroot
mysql -P3306 -h127.0.0.1 -uroot

```
连接的时候我们指定连接协议，或者指定相应的IP及端口，我们的连接方式就变成了TCP/IP方式。

## 3.TLS/SSL：

```sql
mysql --protocol=tcp -uroot --ssl=on
mysql -P3306 -h127.0.0.1 -uroot --ssl=on
```
上表说过，TLS/SSL是基于TCP/IP的，所以我们只需再指定打开ssl配置即可。

然后我们可以通过以下语句来查询目前数据库的连接情况：

```sql
SELECT DISTINCT connection_type from performance_schema.threads where connection_type is not null
```

那么我们如何选择连接方式呢？个人总结了以下几个原则：

- 若是你能确定程序和数据库在同一台机子(类Unix系统)上，推荐使用Unix Sockets，因为它效率更高；
- 若数据库分布在不同的机子上，且能确保连接安全或者安全性要求不是那么高，推荐使用TCP/IP，反之使用TLS/SSL；

# MySQL数据包

通信中最重要的就是数据，那么程序是如何和MySQL Server进行通信，并交互数据的呢？比如如何验证账户，发送查询语句，返回执行结果等，我先画一个流程图来模拟一下整个过程，帮助大家理解：

<center>
![mysql-process](/images/2017/11/mysql-process.png)
</center>

整个过程相对来说还是比较清晰的，我们对连接请求和断开请求不需要过分关心，只需要了解这一点就可以了，重要的是其他几点，那么在这几步中，数据是怎么进行交互的呢？

其实主要就是两步，**Client将执行命令编码成Server要求的格式传输给Server端执行，Server端将执行结果传输给Client端，Client端再根据相应的数据包格式解析获得所需的数据**。

## 1.基本数据类型

虽然网络中的数据是用字节传输的，但它背后的数据源都是有类型的数据，MySQL协议也有基本的数据类型，好比Java中的8种基本数据类型，但MySQL协议中简单的多，它只有两种基本数据类型，分别为Integer(整型)，String(字符串)，下面我们就来看看这两种类型。

### Integer(整型)

首先Integer在MySQL协议中有两种编码方式，分别为FixedLengthInteger和LengthEncodedInteger
,其中前者用于存储无符号定长整数，实际中使用的不多，这里着重讲一下后者。

使用LengthEncodedInteger编码的整数可能会使用1, 3, 4, 或者9 个字节，具体使用字节取决于数值的大小，下表是不同的数据长度的整数所使用的字节数：

最小值（包含）|最大值（不包含）|存储方式
---|---|---|
0 |251| 1个字节
251 |2^16| 3个字节(0xFC + 2个字节具体数据)
2^16 |2^24| 4个字节(0xFD + 3个字节具体数据)
2^24 |2^64| 9个字节(0xFE + 8个字节具体数据)

举个简单的例子，比如1024的编码为：

```
0xFC 0x00 0x04
```

其中0x代表16进制，实际数据传输中并没有该标识，第一位代表这是一个251~2^16之间的数值，所以后面两位为数值具体的值，这里使用的是小端字节序，MySQL默认使用的也是这种编码次序，所以这里1024是0x00 0x04，字节序相关知识可以参考：[理解字节序](http://www.ruanyifeng.com/blog/2016/11/byte-order.html)，到这里大家应该对这种编码格式有了一定的了解了，下面我们就来看看String。

### String(字符串)

String的编码格式相对Integer来说会复杂一点，主要有以下几种：

- FixedLengthString（定长方式）：需先知道String的长度，MySQL中的一个例子就是ERR_Packet包（后续会讲到）就使用了这种编码方式，因为它的长度固定，用5个字节存储所有数据。
- NullTerminatedString（Null结尾方式）: 字符串以遇到Null作为结束标志，相应的字节为00。
- VariableLengthString（动态计算字符串长度方式）: 字符串的长度取决于其他变量计算而定，比如一个字符串由Integer + Value组成，我们通过计算Integer的值来获取Value的具体的长度。
- LengthEncodedString（指定字符串长度方式）： 与VariableLengthString原理相似，是它的一种特殊情况，具体例子就是我上条举的这个例子。
- RestOfPacketString（包末端字符串方式）：一个包末端的字符串，可根据包的总长度金和当前位置得到字符串的长度，实际中并不常用。

总的来说String的编码格式种类相对比较多，不同方式之间的区别也比较大，若要深刻理解还需从实际的例子里去学习，后续文章中我会写几个demo带大家一起去探索。

## 2.基本数据包格式

数据包格式也主要分为两种，一种是Server端向Client端发送的数据包格式，另一种则是Client向Server端发送的数据包。

### Server to Client

Server向Client发送的数据包有两个原则：

- 每个数据包大小不能超过2^24字节(16MB);
- 每个数据包前都需要加上数据包信息；

每个包的基本格式：

Type |Name|Description
---|---|---|
int<3> |payload_length(包数据长度)| 具体数据包的内容长度，从出去头部四个字节后开始的内容
int<1> |sequence_id(包序列id)| 每个包的序列id，总数据内容大于16MB时需要用，从0开始，依次增加，新的命令执行会重载为0
string |payload(具体数据)| 包中除去头部后的具体数据内容

举个列子：

例子 |解释
---|---|
    01 00 00 00 01| <li>payload_length: 1</li> <li>sequence_id: 0x00</li><li>payload: 0x01</li>

若是数据内容大于或者等于2^24-1个字节，将会拆分发送，举个例子，比如发送16 777 215 (2^24-1) 字节的内容，则会按一下这种方式发送 

```
ff ff ff 00 ...
00 00 00 01
```

第一个数据包满载，第二个数据包是一个空数据包（一种临界情况）。

### Client to Server

Client向Server端发送的格式相对来说就简单一点了

Type |Name|Description
---|---|---|
int<1> |执行命令| 执行的操作，比如切换数据库，查询表等操作
string |参数| 命令相应的参数

命令列表（摘抄自胡桃夹子的博客）：

类型值 |命令|功能
---|---|---|
0x00|    COM_SLEEP|   （内部线程状态)
0x01|    COM_QUIT |   关闭连接
0x02|    COM_INIT_DB | 切换数据库   
0x03|    COM_QUERY   |SQL查询请求 
0x04|   COM_FIELD_LIST|  获取数据表字段信息  
0x05|    COM_CREATE_DB |  创建数据库
0x06|    COM_DROP_DB| 删除数据库  
0x07|    COM_REFRESH| 清除缓存    
0x08|   COM_SHUTDOWN |   停止服务器 
0x09|    COM_STATISTICS|  获取服务器统计信息 
0x0A|    COM_PROCESS_INFO|    获取当前连接的列表
0x0B|    COM_CONNECT| （内部线程状态)
0x0C|    COM_PROCESS_KILL|    中断某个连接
0x0D|    COM_DEBUG|   保存服务器调试信息 
0x0E|    COM_PING|    测试连通性 
0x0F|    COM_TIME|    （内部线程状态） 
0x10|    COM_DELAYED_INSERT|  （内部线程状态）  
0x11|    COM_CHANGE_USER| 重新登陆（不断连接）
0x12|    COM_BINLOG_DUMP| 获取二进制日志信息
0x13|    COM_TABLE_DUMP|  获取数据表结构信息
0x14|    COM_CONNECT_OUT| （内部线程状态)
0x15|    COM_REGISTER_SLAVE|  从服务器向主服务器进行注册 
0x16|    COM_STMT_PREPARE|    预处理SQL语句 
0x17|    COM_STMT_EXECUTE|    执行预处理语句 
0x18|    COM_STMT_SEND_LONG_DATA| 发送BLOB类型的数据 
0x19|    COM_STMT_CLOSE|  销毁预处理语句 
0x1A|    COM_STMT_RESET|  清除预处理语句参数缓存 
0x1B|    COM_SET_OPTION|  设置语句选项  
0x1C|    COM_STMT_FETCH|  获取预处理语句的执行结果 

这里距一个常见的的例子，比如切换数据库：

```mysql
use godpan
```

相应的报文格式则为：

```
0x02 0x67 0x6f 0x64 0x70 0x61 0x6e
```

其中0x02代表切换数据库命令，后面的字节则为godpan的16进制表达。

## 数据包类型

有了以上的基础，我们基本知道的与MySQL通信之间的方式以及数据格式，那么与其通信间到底有哪几种数据包呢？接下去的内容是建立在MySQL4.1版本以后，之前版本的数据包类型这里不再论述。

这里主要分为两个阶段，第一个阶段是数据库账户认证阶段，第二个阶段则是执行具体命令阶段，我们先来看看前者。

### 数据库账户认证阶段

这个阶段就是我们平常所说的登录，主要步骤如下：

- 1.Client与Server进行连接
- 2.Server向Client发送Handshake packet
- 3.Client与Server发送Auth packet
- 4.Server向Client发送OK packet或者ERR packet

这里我们来看一看上面的Handshake packet和Auth packet，OK packet和ERR packet放在另一个阶段写。

#### Handshake packet

Handshake packet是由Server向Client发送的初始化包，因为所有从Server向Client端发送的包都是一样的格式，所以前面的四个字节是包头，前三位代表Handshake packet具体内容的数据，另外包序列号为0，很显然这个包内容小于16MB，下面是Handshake packet具体内容的格式：

相对包内容的位置 |长度（字节）|名称|描述
---|---|---|---
0 | 1 | 协议版本 |协议版本的版本号，通常为10（0x0A）
1 | len = strlen (server_version) + 1 | 数据库版本 | 使用前面的NullTerminatedString格式编码，长度为数据库版本字符串的长度加上标示结束的的一个字节
len + 1 | 4 | 线程ID |此次连接MySQL Server启动的线程ID
len + 5 | 8 + 1（0x00表示结束) | 挑战随机数（第一部分） |用于后续账户密码验证
len + 14 | 2 | 协议协商 | 用于与客户端协商通讯方式
len + 16 | 1 | 编码格式 |标识数据库目前的编码方式
len + 17 | 2 | 服务器状态 |用于表示服务器状态，比如是否是事务模式或者自动提交模式
len + 19 | 13 | 保留字节 |未来可能会用到，预留字节
len + 32 | 12 + 1（0x00表示结束) | 挑战随机数（第二部分） |用于后续账户密码验证

上表就是整个Handshake packet的这个包结构，属性的含义以及规范都有相应的说明，下面是我本机解析的某次连接数据库的Handshake packet包，仅供参考：

```
{protocolVersion=10, serverVersion='5.7.13', threadId=4055, scramble=[49, 97, 80, 3, 35, 118, 45, 15, 5, 118, 9, 11, 124, 93, 93, 5, 31, 47, 111, 109, 0, 0, 0, 0, 0], serverCapabilities=65535, serverLanguage=33, serverStatus=2}
```

#### Auth packet

Auth packet是由Client向Server发送的认证包，用于验证数据库账户登录，相应内容的格式：

相对包内容的位置 |长度（字节）|名称|描述
---|---|---|---
0 | 4 | 协议协商 | 用于与服务端协商通讯方式
4 | 4 | 消息最长长度 | 客户端可以发送或接收的最长长度，0表示不做任何限制
8 | 1 | 字符编码 | 客服端字符编码方式
9 | 23 | 保留字节 | 未来可能会用到，预留字节，用0代替
    32 |不定| 认证字符串 | 主要有三部分内容<br> <li>用户名：NullTerminatedString格式编码</li><li>加密后的密码：LengthEncodedString格式编码</li><li>数据库名称（可选）：NullTerminatedString格式编码</li>

这部分内容是由客户端自己生成，所以说如果我们如果要写一个程序连接数据库，那么这个包就得按照这个格式，不然服务端将会无法识别。

### 命令执行阶段

在我们正确连接数据库后，我们就要执行相应的命令了，比如切换数据库，执行CRUD操作等，这个阶段主要分为两步，Client发送命令（上文已经给出，下面不再讨论），Server端接收命令执行相应的操作，我们主要关心Server端向我们发送数据包，可分为4类和一个最基础的报文结构Data Field：

- Data Field：包数据的一个基础结构；
- OK包(包括PREPARE_OK)：Server端发送正确处理信息的包，包头标识为0x00；
- Error包： Server端发送错误信息的包，包头标识为0xFF；
- EOF包：用于Server向Client发送结束包，包头标识为0xFE；
- Result Set包：用于Server向Client发送的查询结果包；

#### Data Field

Data Field是Server回应包里的一个核心，主要是数据的一种编码结构，跟我之前讲的LengthEncodedInteger和LengthEncodedString很类似，也主要分为三个部分

最小数据长度（包含）|最大数据长度（不包含）|数据长度|格式
---|---|---|
1 |251| 1个字节|1字节 + 具体数据
251 |2^16| 2个字节 | 0xFC + 2个字节数据长度 + 具体数据
2^16 |2^24| 4个字节 | 0xFD + 4个字节数据长度 + 具体数据
2^24 |2^64| 8个字节 | 0xFE + 8个字节数据长度 + 具体数据
NULL | NULL | 0个字节 | 0xFB

要注意的一点是如果出现0xFB（251）开头说明这个数据对应的是MySQL中的NULL。

#### OK 包

普通的OK包（PREPARE_OK包后面会讲到）会在以下几种情况下产生，由Server发送给相应的接收方：

- COM_PING: 连接或者测试数据库
- COM_QUERY： 不需要查询结果集的操作，比如INSERT, UPDATE, or ALTER TABLE
- COM_REFRESH： 数据刷新
- COM_REGISTER_SLAVE： 注册从服务器

OK 包的主要结构：

相对包内容的位置 |长度（字节）|名称|描述
---|---|---|---
0 | 1 | 包头标识 |0x00 代表这是一个OK 包
1 | rows_len | 影响行数 | 相应操作影响的行数，比如一个Update操作的记录是5条，那么这个值就为5
1 + rows_len | id_len | 自增id |插入一条记录时，如果是自增id的话，返回的id值
1 + rows_len + id_len | 2 | 服务器状态 |用于表示服务器状态，比如是否是事务模式或者自动提交模式
3 + rows_len + id_len | 2 | 警告数 |上次命令引起的警告数
5 + rows_len + id_len | msg_len | 额外信息 |此次操作的一些额外信息

下面是我本机解析的某次正确连接数据库后的OK packet包，仅供参考：

```
OK{affectedRows=0, insertId=0, serverStatus=2, message='....'}
```

#### Error 包

顾名思义Error 包就是当出现错误的时候返回的信息，比如账户验证不通过，查询命令不合法，非空字段未指定值等相关操作，Server端都会向Client端发送Error 包。

Error 包的主要结构：

相对包内容的位置 |长度（字节）|名称|描述
---|---|---|---
0 | 1 | 包头标识 |0xFF 代表这是一个Error 包
1 | 2 | 错误代码 |该错误的相应错误代码
3 | 1 | 标识位 |SQL执行状态标识位，用'#'进行标识
4 | 5 | 执行状态 |SQL的具体执行状态
9 | msg_len | 错误信息 |具体的错误信息

比如我们现在已经连接了数据库，执行

```
use test_database;
```

但是我们数据库中并没有test_database这个数据库，我们将会得到相应的错误信息，下面是我本机解析的Error packet包，仅供参考：

```
Error{errno=1046, sqlState='3D000', message='No database selected'}
```

#### EOF Packet

EOF Packet是用于标识某个阶段数据结束的标志包，会在一下几种情况中产生：

- 结果集中字段信息结束的时候；
- 结果集中列信息结束的时候；
- 服务器确认停止服务的时候；
- 客户端发送COM_SET_OPTION and COM_DEBUG命令后，服务器回应的时候；
- 服务器请求使用MySQL4.1版本之前的认证方式的时候；

EOF 包的主要结构：

相对包内容的位置 |长度（字节）|名称|描述
---|---|---|---
0 | 1 | 包头标识 |0xFE 代表这是一个EOF 包
1 | 2 | 警告数 |上次命令引起的警告数
3 | 2 | 服务器状态 

这里要注意的一点，我们上面分析了Data Field的结构，发现它是用0xFE作为长度需要8个字节编码值得标识头，所以我们在判断一个包是否是EOF 包的时候，需要下面两个条件：

- 标识头（第一个字节）为0xFE；
- 包的总长度小于9个字节；

#### Result Set包

Result Set包产生于我们每次数据库执行需要返回结果集的时候，Server端发送给我们的包，比如平常的SELECT,SHOW等命令，Result Set包相对比较复杂，主要包含以下五个方面：

内容 |含义
---|---
Result Set Header | 返回数据的列数量
Field | 返回数据的列信息（多个）
EOF   | 列结束
Row Data | 行数据（多个）
EOF | 数据结束

我们逐个来分析，首先我们来看Result Set Header。

##### Result Set Header

Result Set Header表示返回数据的列数量以及一些额外的信息，其主要结构为：

长度 |含义
---|---
1-9字节 | 数据的列数量（LengthEncodedInteger编码格式）
1-9字节 | 额外信息（LengthEncodedInteger编码格式）

##### Field

Field表示Result Set中数据列的具体信息，可出现多次，具体次数取决于Result Set Header中数据的列数量，它的主要结构为：

长度 |含义
---|---
4 | 通常为ASCIIz字符串def
n | 数据库名称（Data Field）
n | 假如查询指定了表别名，就是表别名（Data Field）
n | 原始的表名（Data Field）
n | 假如查询指定了列别名，就是列别名（Data Field）
n | 原始的列名（Data Field）
1 | 标识位，通常为12，表示接下去的12个字节是具体的field内容
2 | field的编码
4 | field的长度
1 | field的类型
2 | field的标识
2 | field值的的小数点精度
2 | 预留字节
n | 可选元素，如果存在，则表示该field的默认值

其中field的类型与标识具体定义和对应变量含义可参考这篇文章：[MySQL协议分析](http://hutaow.com/blog/2013/11/06/mysql-protocol-analysis/#428-com_shutdown)

##### EOF 包

这里的EOF包是标识这列信息的结束，具体结构信息参考上面的EOF包解释。

##### Row Data

Row Data含着的是我们需要获取的数据，一个Result Set包里面包含着多个Row Data结构(得到的数据可能多行)，每个Row Data中包含着多个字段值，它们之间没有间隔，比如我们现在查询到的数据为（id: 1, name: godpan) 那么Row Data内容为（1，godpan),这两个值是连在一起的，对应的值都用LengthEncodedString编码。

##### EOF 包

等待Row Data发送完之后，Server最后会向Client端发送一个EOF包，标识所有的行数据已经发送完毕。

#### PREPARE_OK包

PREPARE_OK包产生在Client端向Server发送预处理SQL语句，Server进行正确回应的时候，大家写写Java的时候肯定用过PreparedStatement，这里PreparedStatement的功能就是进行SQL的预处理，预处理的优点比较多，比如效率高，防SQL注入等，有兴趣的同学可以自己去学习下。下面是PREPARE_OK包的结构：

长度 |含义
---|---
1 | 0x00（标识是一个OK包）
4 | statement_handler_id（预处理语句id）
2 | number of columns in result set（结果集中列的数量）
2 | number of parameters in query（查询语句中参数的数量）
1 | 0x00 (填充值)
2 | 警告数

比如我现在执执行下面的语句：

```java
PreparedStatement ps = connection.prepareStatement("SELECT * FROM `godpan_fans` where id=?");
ps.setInteger(1, 1);
ps.executeQuery();
```

得到下面的PREPARE_OK包，仅供参考：

```
PSOK{statementId=1, columns=5, parameters=1}
```

如果上面的columns大于0，以及parameters大于0，则将有额外的两个包传输，分别是columns的信息以及parameters的信息，对应信息结构：

内容 |含义
---|---
Field | columns信息（多个）
EOF   | columns信息结束
Field | parameters（多个）
EOF | parameters结束

到此整个PREPARE_OK包发送完毕。

#### Row Data Binary

这个包跟上面提到的Row Data包有什么差别呢？主要有两点：

- 用不同的方式定义NULL；
- 数据编码不再单纯的使用LengthEncodedString，而是根据数据类型的不同进行相应的编码；

后面我会分别解释这两点，我们先来看看它的结构：

相对包内容的位置 |长度（字节）|名称|描述
---|---|---|---
0 | 1 | 包头标识 |0x00
1 | (col_count+7+2)/8 | Null Bit Map | 前两位为预留字节，主要用于区别与其他的几种包（OK，ERROR，EOF），在MySQL 5之后这两个字节都为0X00，其中col_count为列的数量
(col_count+7+2)/8 + 1 | n | column values | 具体的列值，重复多次，根据值类型编码

现在我们来看一下它的两个特点，首先我们来看它是如何来定义NULL的，首先我们看到他的结构中有一个Null Bit Map，除去两个标识位，真正用于标识数据信息的就是(col_count+7)/8位字节，这里我先给出结论，后面再给大家具体分析：

参数个数 |长度（字节）|具体值范围|描述
---|---|---|---
1-8 | 1 | -1, 2^n组合 | 1 = 2^0表示第一个参数为NULL，3 = 2^0 + 2^1表示第一个和第二参数为NULL...

上面给出了标识NULL的基本算法，原则是哪个参数（次序为n)为NULL，则Null Bit Map相应的值加上2^n,8个参数为一个周期，以此类推。

接着我们来看一下第二点，是如何用具体值类型来对相应的值进行编码的，这里主要分为三类，基本数据类型，时间类型，字符串类型；

- 基本数据类型：比如TINYINT使用一个字节编码，FLOAT使用四个字节，DOUBLE使用8个字节等；
- 时间类型：使用类似LengthEncodedString的编码方式编码，具体可参考[MySQL_PROTOCOL](https://dev.mysql.com/doc/dev/mysql-server/latest/PAGE_PROTOCOL.html)；
- 字符串类：不属于上面两类的都属于字符串类型，使用普通的LengthEncodedString；

#### Execute包

Execute包顾名思义是一个执行包，它是由Client端发送到Server端的，但它和普通的命令又有点不同，它主要是用来执行预处理语句，并会携带相应参数，具体结构如下：

长度 |含义
---|---
1 | COM_EXECUTE（标识是一个Execute包）
4 | 预处理语句id
1 | 游标类型
4 | 预留字节
0 | 接下去的内容只有在有参数的情况下
(param_count+7)/8 | null_bit_map（描述参数中NULL的情况）
1 | 参数绑定情况
n*2 | 参数类型（依次存储）
n | 参数具体值（非NULL)（依次存储，使用Row Data Binary方式编码）

Execute包从Client端发送到Server端后可能会得到以下几个结果：

- OK包
- ERROR包
- Result Set包（可能多个）

我们需要根据包的不同类型来进行不同的处理。

# 总结

本篇文章主要讲述了MySQL的连接方式，通信过程及协议，以及传输包的基本格式和相关传输包的类型，内容相对来说，比较多也比较复杂，我也是将近三周才写完，但总体按照我自学的思路走，不会太绕，有些点可能需要细心思考下，写的有误的地方也希望大家能指正，希望对大家有所帮助，后面可能会写几个实例和大家一起学习。
