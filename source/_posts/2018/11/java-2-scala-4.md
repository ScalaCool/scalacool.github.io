---
title: 从 Java 到 Scala（四）：Traits
author: Rhyme
tags:
- Java
- ^Rhyme
- 类型相关
- trait
- ~从 Java 到 Scala
description: Traits在尝试着将抽象更好地融为一个整体。
date: 2018-11-28
---
`Traits`特质，一个我们既熟悉又陌生的特性。熟悉是因为你会发现它和你平时在Java中使用的interface接口有着很大的相似之处，而陌生又是因为`Traits`的新玩法会让你打破对原有接口的认知，进入一个更具有挑战性，玩法更高级的领域。所以，在一开始，我们可以对`Traits`有一个初步的认识：它是一个加强版的`interface`。之后，随着你对它了解的深入，你就会发现相比Java接口,`Traits`跟类更为相似。再之后，你或许会觉察到，**`Traits`在尝试着将抽象更好地融为了一个整体。**

# Traits 入门

在Java中为了避免多重继承所带来的昂贵代价(方法或字段冲突、菱形继承等问题)，Java的设计者们使用了`interface接口`。而为了解决Java接口无法进行`stackable modifications`(即无法使用对象状态进行迭代)、无法提供字段等局限，在Scala中，我们使用`Traits`特质而非接口。

## 定义一个trait

```scala
trait Animal {
  val typeOf: String = "哺乳动物" //  带有默认值的字段

  def move(): Unit = {  // 带有默认实现的方法
    println("walk")
  }

  def eat() //未实现的抽象方法
}
```
以上代码类似于以下的Java代码

```JAVA
public interface Animal {
    String typeOf = "哺乳动物";

    default void move() {
        System.out.println("walk");
    }

    void eat();
}
```

在Scala中使用关键字`trait`而不`interface`,和Java接口一样，`trait`也可以有默认方法的实现。也就是说Java接口有的，`trait`基本上也都有，而且实现起来要优雅许多。 
之所以要说类似于以上的Java代码，原因在于`trait`拥有的是字段`typeOf`,而`interface`拥有的是静态属性`typeOf`。这是`interface`和`trait`的一点区别。但是再仔细观察思考这一点区别，**更好更灵活的字段设计，是否使得`trait`更好地组织了抽象，使得它们成为了一个更好的整体。**


## mix in trait

和Java一样，Scala只支持单继承，但却可以有任意数量的特质。在Scala中，我们不称接口被`implements`实现了，而是`traits`被mix in混入了类中。

```scala
class Bird extends Animal {
  override val typeOf: String = "蛋生动物"

  override def eat(): Unit = {
    println("eat bugs")
  }

  override def move(): Unit = {
    println("fly")
  }
}
```
以上代码中，`Bird`类混入了特质`Animal`。当类混入了多个特质时，需要使用`with`关键字

```scala
trait Egg

class Bird extends Animal with Egg{
  override val typeOf: String = "蛋生动物"

  override def eat(): Unit = {
    println("eat bugs")
  }

  override def move(): Unit = {
    println("fly")
  }
}
```

在Scala中，我们将`extends with`的这种语法解读为一个整体，例如在以上代码中，我们将`extends Animal with Egg`看做一个整体，然后被`Bird`类混入。从这里你是否也能够感受到 **`trait`在尝试着将抽象更好地融为一个整体。** 

到这里，你或许能够发现，相比`Java interface`,`trait`和类更加相似。而事实也确实如此，`trait`可以具备类的所有特性，除了缺少构造器参数。这一点`trait`可以使用构造器字段来达到同样的效果。也就是说你不能想给类传入构造器参数那样给特质传入参数。具体代码这里就不再演示。

其实在这里我们可以简单地思考一番，为什么要把`trait`设计得这么像一个`class`,是设计者们有意为之，还是无意间的巧合。其实，不管怎么样，**个人认为，但从设计层面来讲，`class`类的设计就比`trait`更加具备一致性，class产生的对象就可以被很好的管理，为什么我们不像管理对象一样来管理我们的抽象呢？**



# Traits的两大基本应用

`Traits`最常见的两种使用方式:一种是和Java接口类似，用于设计富接口，另一种是`Traits`独有的`stackable modifications`。这里就说到了`interface`和`trait`的第二个区别，`Traits`支持`stackable modificatio`，使它能够使用对象状态，可以对对象状态进行灵活地迭代。

## rich interface

富接口的应用要归功于`interface`中对默认方法这一特性的支持，一方面松绑了类和接口之间实现与被实现之间的强关系，另一方面为程序的可扩展性代入了很大的灵活性。`trait`在这一方面的应用和Java的没有很大的区别。而`trait`中的默认方法的实现背后采用的也是`interface`中的`default`默认方法。

```scala
trait Hello {
  def hello(): Unit = {println("hello")
  }
}
```

```Java
interface Hello2 {
    default void hello() {...}
}
```
    
## stackable modifications

关于`stackable modifications`，顾名思义，我们将`modification`保存在了一个`stack`栈中。也就是说我们可以对运算的结果进行不断的迭代处理，已达到我们想要的结果。这对于想要分布处理并得到某一结果的需求来说是非常有用的。

这里我们借用一下`programming in scala`中的例子

```Scala
abstract class IntQueue {
  def get(): Int

  def put(x: Int)
}

import scala.collection.mutable.ArrayBuffer

class BasicIntQueue extends IntQueue {
  private val buf = new ArrayBuffer[Int]

  def get() = buf.remove(0)

  def put(x: Int) {
    buf += x
  }
}

trait Doubling extends IntQueue {
  abstract override def put(x: Int) {
    super.put(2 * x)
  }
}

trait Incrementing extends IntQueue {
  abstract override def put(x: Int) {
    super.put(x + 1)
  }
}

trait Filtering extends IntQueue {
  abstract override def put(x: Int) {
    if (x >= 0) super.put(x)
  }
}

```
在以上代码中我们定义了一个抽象的队列，有`put`和`get`方法，在类BasicIntQueue中提供了相应的实现方法。同时又定义了三个特质`Doubling`、`Incrementing`、`Filtering`,它们都继承了IntQueue抽象类(还记得之前讲过的，`trait`可以具备类的所有特性),并重写了其中的方法。`Doubling`将处理结果*2，`Incrementing`特质将处理结果做了+1处理,`Filtering`将过滤掉<0的值。

我们在来看以下的运行结果

```scala
scala> val queue = (new BasicIntQueue with Incrementing with Filtering)
queue: BasicIntQueue with Incrementing with Filtering...
scala> queue.put(-1); queue.put(0); queue.put(1)
scala> queue.get()
res15: Int = 1
scala> queue.get()
res16: Int = 2
```

```scala
scala> val queue = (new BasicIntQueue with Filtering with Incrementing)
queue: BasicIntQueue with Filtering with Incrementing...
scala> queue.put(-1); queue.put(0); queue.put(1)
scala> queue.get()
res17: Int = 0
scala> queue.get()
res18: Int = 1
scala> queue.get()
res19: Int = 2
```
仔细观察以上的代码，了解了上面的代码，你基本也就了解了`stackable modifications`。

首先，你可以观察到，以上的两段代码整体相似，却得到不同的运行结果，原因只是因为特质`Filtering`和`Incrementing`混入的顺序不同。我们仔细查看一下特质中的方法实现，可以发现在特质中都通过`super`关键字调用了父类的方法。而以上情况的产生原因就在于此。`trait`中的`super`是支持`stackable modifications`的根本关键。

在`trait`中的`super`是动态绑定的，并且`super`调用的是另一个特质中的方法，具体哪个特质中的方法被调用需要取决于特质被混入的顺序。对于一般的序列，我们可以采用"从后往前"的顺序来推断`super`的调用顺序。

就拿以上的代码而言。

```scala
new BasicIntQueue with Incrementing with Filtering
```

代码的super的执行顺序按照从后往前的规则依次是

```scala
Filtering -> Incrementing -> BasicIntQueue 
```

举个具体的例子

例如这个时候我执行了`put(1)`的代码，那么按照上面的执行顺序，

先执行`Filtering`的`put`方法判断值是否大于1，发现合法，将值1传给`Incrementing`中的`put`方法，`Incrementing`中的`put`方法将值加1之后传给`BasicIntQueue`然后将最终的值2放入队列中。

以上代码的执行过程就是`stackable modifications`的核心。因此到这里，你或许也能理解以上因为混入顺序不同而出现的不同结果了吧。

另外，说到动态性，我们在这里也可以简单地聊几句。在Java中，`super`的静态性与`trait`中`super`的动态性形成了鲜明的对比。而动态性所带来的种种优势与强大，我们也已经在这一小节的内容中见识了一二。其实动态性抽离出来是一种设计思想，而它也早已在我们的身边大展拳脚。例如我们熟知的IOC依赖注入，AOP面向切面编程，以及前端的动态压缩技术等等，能够列举的还有很多，而它们的背后就是动态性的思想，你越是灵活，能够做的事也就越多。


# Traits 探索

## Traits构造顺序

```scala
trait Test {
    val name:String = "hello" //特质构造器的一部分
    println(name);  // 特质构造器的一部分
}
```
正如你在以上代码中所见的，在特质大括号中包裹的执行语句均属于特质构造器的一部分。

特质构造器的顺序如下:（参考自《快学Scala》）

1.  首先执行超类的构造器(也就是跟在`extends`之后的类)
2.  特质构造器在超类构造器之后、类构造器之前执行
3.  特质由左到右构造
4.  父特质先构造
5.  类构造器

举个例子

```scala
class SavingAccount extends Account with FileLogger with ShortLogger

trait ShortLogger extends Logger

trait FileLogger extends Logger
```

以上构造器将按如下顺序执行

1.  `Account`(超类)
2.  `Logger`(第一个特质的父特质)
3.  `FileLogger`(第一个特质)
4.  `ShortLogger`(从左往右第二个特质，它的父特质`Logger`已经被构造，不再重复构造)
5.  `SavingAccount`(类构造器)

### 线性化

其实以上构造器顺序实现的背后使用的是一种叫"线性化"的技术。

拿以上的代码作为例子

```scala
class SavingAccount extends Account with FileLogger with ShortLogger
```

以上的代码将被线性化解析为

> `>>`的意思是右侧将先被构造

```scala
lin(SavingsAccount) = SavingsAccount >> lin(ShortLogger) >> lin(FileLogger) >> lin(Account)

= SavingsAccount >> (ShortLogger >> Logger) >> (FileLogger >> Logger) >> Account

= SavingsAccount >> ShortLogger >> FileLogger >> Logger >> Account
```

仔细观察以下线性化的结果，你会发现，以上的顺序就是构造器执行的顺序。同时，线性化也给出了`super`的执行顺序，举例来说，在`ShortLogger`中调用`super`将调用右侧的`FileLogger`中的方法，而`FileLogger`中的`super`将调用右侧`Logger`中的方法，依次类推。

###   特质字段初始化

因此由于特质构造器的执行时间要早于类构造器的执行，因此在初始化特质中的字段时要额外注意字段的执行时间，避免出现空指针的情况。例如以下代码就会出现错误

```scala
trait Hello {
  val name:String
  val out = new PrintStream(name)
}

val test = new Test with Hello {
    val name = "Rhyme" // Error 类构造器晚于特质构造器
}
```

解决方法有`提前定义`或者`懒值`

采用提前定义的代码如下所示

```scala
val test = new { 
    val name = "Rhyme" //先于所有的构造器执行
}Test with Hello 
```
采用提前定义的方式使得代码不太雅观，我们还可以使用懒值的方式

采用懒值的方式如下

```scala
trait Hello {
  val name:String
  lazy val out = new PrintStream(name) // 使用懒值，延迟name的初始化
}
```
懒值在每次使用前都回去检查字段是否已经初始化，存在一定的使用开销。使用前需要仔细考虑

由于篇幅限制，关于`trait`的探索，我们就到此为止。希望本文能够对你学习和了解`trait`提供一点帮助。在下一章我们将介绍`trait`稍微高级一点的用法，自身类型和结构类型。
