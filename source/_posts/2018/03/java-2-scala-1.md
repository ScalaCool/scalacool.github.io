---
title: 从 Java 到 Scala（一）：面向对象谈起
author: KnewHow
tags:
- Java2Scala
- 编程语言
- ^KnewHow
- 类型相关
- ~从 Java 到 Scala
description: Scala 是一门优秀的编程语言，它不仅仅在工业界被广泛使用，在学术界也占用很高的研究地位。
date: 2018-03-05
---
去年我加入[水滴团队](https://scala.cool/2017/03/hello-scala/)，面试中，面试官问：“你了解 Scala 吗？”

“不了解(尴尬)。”

“你知道 Spark 吗？它就是使用 Scala 编写的，不过在我们团队中，Scala 主要作为后端语言，我们 90% 以上的业务代码都是使用 Scala 编写。Scala 在国内使用的比较少，但是在国外用的还是蛮多的，如 Twitter 就是使用 Scala 写的后端。”

自那以后，我便开始了 Scala 的学习之旅。

> Scala 是由德国的计算机科学家和编程方法教授 [Martin Odersky](https://en.wikipedia.org/wiki/Martin_Odersky) 设计出来的，它的设计原理严格遵循数学的逻辑推理。因此它是一门优秀的编程语言，它不仅仅在工业界被广泛使用，在学术界也占用很高的研究地位。

由于之前的 Java 背景，我经常拿 Scala 与 Java 这两门语言比较。 Scala 和 Java 都基于 JVM，因此 Java 的类库，Scala　都可以直接使用。但是我对 Scala 印象最深的点，并不是「面向对象」，而是它还拥抱「函数式」，尤其是它的「高阶」。

**如果我们把「面向对象」比作站在地面上观察事物的原理，并且使用这些原理解决问题，那么「高阶」就是让你站在山上去看待事物，对问题进行更高层次的抽象。**

因此不管是解决实际问题，还是提高对编程语言的认知，Scala 都是一们值得学习的语言。

我是从《快学 Scala》这本书开始学习 Scala 的，受此书启发，我想能不能书写一个「从 Java 到 Scala 系列」，寻找一棵从 Java 通往 Scala 的连续的知识树，通过对知识树的讲解，来学习 Scala。

好了，这就是本系列的第一篇，那么我们如何谈起呢？

既然 Java 和 Scala 都是「面向对象」的，那我们就来探索一下什么是「面向对象」吧。
## 模板和对象
「模板」是在代码层面描述一类对象的「行为」或者「状态」的**代码**，它是抽象的。如 Java 中的类，C 语言中的结构体，它们都是「模板」。

「对象」是在运行期间通过模板在内存中生成的一个个**实体**，它是具体的。如 Java 在运行期间通过 new 在内存中产生的实体就叫做「对象」。

如果你说共享单车，那么它就是一个「模板」；如果你说这辆共享单车和那辆共享单车，那它们就是「对象」。

在代码层面，「对象」的行为可以定义为「方法」，「对象」的状态可以定义为「属性」，那我们如何去描述一类「对象」的方法或者属性呢？－**封装**。

例如共享单车，它有车轮，二维码等属性，有开锁和关锁等行为。那么我们可以有三种方式来封装共享单车。
### 基于对象的封装
这种方式就是直接封装，最典型的例子就是 C 语言中的结构体。
封装共享单车的「模板」如下：

```C
struct SharedBicycle{
  车轮;
  二维码;
  开锁;
  关锁;
}; 
```
### 基于类的封装
大多数「面向对象」的语言，如 Java，Scala，C++等，都使用这种方式封装，「模板」如下：
```Scala
class SharedBicycle{
  属性：车轮;
  属性：二维码;
  方法：开锁;
  方法：关锁;
}
```
### 基于原型的封装
JavaScript 就是使用这种封装方式，「模板」如下：
```javascript
function SharedBicycle(){
  this.车轮 = xxx;
  this.二维码 = xxx;
}
//添加原型方法
SharedBicycle.prototype.开锁 = function(){...};
SharedBicycle.prototype.关锁 = function(){...};
```

### 纯面向对象

我们已经得知，可以用多种实现面向对象的不同技术，那么什么是纯面向对象的语言呢？

我们知道 Java 是一门「面向对象」的语言，那么在 Java 中是否真的「万物皆对象」？	

在 Java 中，我们可以写这么一段代码 `int a = 3;`　然后我们发现 `a`  并没有封装任何的属性或者方法。

因此我们可以说 `a` 不是一个「对象」，Java 不是一门「纯粹面向对象」的语言。

再看看 Scala ，不论是低阶的 `Int`，`Double`，还是高阶类型，都封装有属性或者方法，因此 Scala 才是一门「纯粹面向对象」的语言。

那么是什么支持 Scala 一切皆为「对象」的呢？－**Scala 的通用类型系统。**

## Scala 通用类型系统
### 顶类型
我们知道，在 Java 中，所有「对象」的「顶类型」都是 `java.lang.Object`，但是 Java 却忽略了 `int`，`double`等 JVM 「原始类型」,它们并没有继承 `java.lang.Object`。

但是在 Scala 中，存在一个通用的「顶类型」－　Any。

<center>
  ![](/images/2018/03/scala-unified-types.png)
</center>


Scala 引入了`Any` 作为所有类型共同的顶类型。`Any` 是 `AnyRef` 和 `AnyVal` 的超类。

`AnyRef` 面向 Java（JVM）的对象世界，它对应 `java.lang.Object` ，是所有对象的超类。

`AnyVal` 则代表了 Java 的值世界，例如 `int` 以及其它 JVM 原始类型。

正是依赖这种继承设计，我们才能够使用 `Any` 定义方法，同时兼容 `scala.int` 以及 `java.lang.String` 的实例。

```Scala
class Person

val allThings = ArrayBuffer[Any]()

val myInt = 42             // Int, kept as low-level `int` during runtime

allThings += myInt         // Int (extends AnyVal)

allThings += new Person()  // Person (extends AnyRef), no magic here
```

正是通过这种「通用类型系统」的设计，使得 Scala 摆脱「原始类型」这种边缘情况的纠缠，从而实现「纯粹的面向对象」。

说完了「顶类型」，我们再来看看「底类型」。

### 底类型
我们知道在 Java 中比较闹心的就是异常处理，当我们调用一个抛出异常的方法，我们必须抛出或者处理异常。

但是在 Scala 中，我们知道一切表达式皆有类型，难道「抛异常」也是有类型的？

```Scala
scala> val a = Try(throw new Exception("123"))
a: scala.util.Try[Nothing] = Failure(java.lang.Exception: 123)
```
我们发现「抛异常」竟然是 `Nothing` 类型，在 Scala 中，难道 `Nothing` 仅仅是作为「抛异常」的类型？

```Scala
scala>  def fun(flag:Boolean)={
          if(flag){
            1                          // Int
          }else{
           throw new Exception("123") //Nothing
          }
        }
fun: (flag: Boolean)Int

```
我们发现 `fun` 函数并没有报错，而且返回值类型竟然是 `Int`，这让我们有一个大胆的猜测：**`Nothing` 是 `Int` 的子类型。**

```Scala
[Int] -> ... -> AnyVal -> Any
Nothing -> [Int] -> ... -> AnyVal -> Any
```
其实在 Scala 中， `Nothing` 不仅仅是 `Int` 的子类型，它更是**所有类型的子类型。** 这让我们又产生了一个大胆的猜测：难道 `Nothing` 继承了所有的类型？咳咳，这个问题我们以后在讨论。

在 Scala 中，还有一个类型 `Null` 遵循着和 `Nothing` 一样的原理。

```Scala
scala> def fun2(flag:Boolean)={
          if(flag){
            "123"  //String
          }else{
            null   //Null
          }
        }
fun2: (flag: Boolean)String
```
同理，我们可以得出 `Null` 是 `String的子类型`
```Scala
[String] -> AnyRef -> Any
Null -> [String] -> AnyRef -> Any
```
那我们看看 `Null` 是否可以兼容 `Int`。
```
scala>  def fun3(flag:Boolean)={
          if(flag){
            123  //Int
          }else{
            null   //Null
          }
        }
fun3: (flag: Boolean)Any
```
我们发现 `fun3` 的返回值类型竟然是 `Any`，说明 `Null` 不能兼容 Scala 的「值类型」，其实从 Scala 的帮助手册中我们就可以得出结论：**`Null` 是所有引用类型的子类型**

```Scala
abstract final class Null extends AnyRef
```
正因如此，`fun3` 的返回值类型才是 `Any`，因为 `Any` 才是 `AnyVal` 和 `AnyRef` 公共的超类。

## 总结

本文以面向对象为引子，找到了一个 Java 和 Scala 共有的知识节点，从而引出 Scala 的通用类型系统。那么在下一篇文章中，我们由此展开进一步思考，到底什么是所谓的「类型」，以及 Scala 在类型方面存在哪些与 Java 不同的有趣的地方。

>[Scala 类型的类型（一）。](https://scala.cool/2017/03/scala-types-of-types-part-1/)
