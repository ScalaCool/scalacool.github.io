---
title: 从 Java 到 Scala（二）：object
author: Rhyme
tags:
- Java
- ^Rhyme
- 类型相关
- ~从 Java 到 Scala
description: Scala object 是一种让静态回归常态、打破模式、天然的语言特性。
date: 2018-08-30
---

**`Scala object`是一种让静态回归常态、打破模式、天然的语言特性。**

其实在写这篇文章之前，我思绪万千，迟迟不能落笔，总想着自己会不会遗漏了某个知识点，或者有讲得不太那么准确的地方，但是后来我想明白了，学习一样东西，最重要的并不是要了解它的每一个细节，而是要了解它的核心思想。如果你能够理解上面讲的那句话，我想你或许也就掌握了`Scala Object`。

其实，`Scala object`较之Java,更多的是一种思想设计理念上的升华，就如同我本来就该有这东西，你却需要我手动费很大地劲自己造出来一样。

在`Scala object`当中，我们可以轻松的构建出一个「单例对象」，而在Java当中我们通常得遵守一套「单例模式」的应用才能构建出一个单例对象。但是请你细想一番，「单例对象」难道不该是一种更加自然的存在吗？

另外，和「单例对象」一样，`Scala object`当中的另一个重量级的语言特性：「伴生对象」也同样遵循这一套逻辑,让「静态」以一种更为常态的形式存在。

## 单例对象（Singleton Object）

```scala
// 构建一个单例对象Singleton
object Singleton {
  var hello = "Hello World"
  def sayHello:String = {
    hello
  }
}
```

在Scala中，我们使用关键字`object`来构建单例对象。任何用到单例模式的地方，你都可以用Scala的`object`来实现。以下代码向你展示了在Scala中单例对象的基本使用。我们只需要在我们用到的地方引入我们需要的「单例对象」即可。

```scala
import Singleton._ //引入Singleton对象中的所有方法
class Test {
  def test:String = sayHello
}
```

## 伴生对象（Companion Object）

在Java中，我们通常会用到既有实例方法又有静态方法的类，在Scala中我们可以通过「伴生类」和「伴生对象」来实现。刚开始，你可能会对这两个词感到困惑，其实不用慌张，你完全可以在一开始用Java中的**普通的不包含静态的类**来代替「伴生类」，用**类中的所有的静态**来代替「伴生对象」。说的简单一点，就是**将Java类中的静态搬到一个单例对象中。**

下面分别用Java和伴生对象来实现下面这个简单的售票功能。

使用Java实现的这段代码，这里就不再多说，我想你肯定比我还要熟悉。

```scala
public class TicketJava {
    private static int ticket = 10;
    private String name;
    public TicketJava(String name){
        this.name = name;
    }
    public static void sellTicketTo(String name){
        System.out.println(name + " get ticket " + ticket);
    }
    public void buyTicket() {
        sellTicketTo(name);
    }
}

```

以下是使用「伴生对象」实现的版本。你只需要关注一个细节，**静态所在的位置**。

与**类同名且与类在同一个源文件下**的`object`对象就是「伴生对象」，与之相对的类就叫做「伴生类」。

伴生对象与静态实现的功能没有二异，原来静态所具备的特性，在「伴生对象」中都能找到。在Java中，静态特性包裹在Class类中，它们可以互访私有特性，因此你也就能明白接下来的这句话：**「伴生对象」与「伴生类」能够互访私有特性**。

```scala
class Ticket(name: String) {// name 是类Ticket的成员变量
    
  // 在Scala中import语句可以写在任意地方
  // 因此你可以控制import语句的作用范围，使得代码更加灵活
  import Ticket._

  def buyTicket(): Unit = {
    // 调用伴生对象中的方法
    sellTicketTo(name)
  }
}
// 伴生对象，和类同名，且在同一个源文件下，可以互访私有属性
object Ticket {
  private var ticket: Int = 10

  def sellTicketTo(name: String): Unit = {
    println(f"$name get ticket $ticket")
    ticket = ticket - 1
  }
}
```

## 扩展类或特质的对象

> 特质：可以理解为Java中的接口

在Scala中，所有用object修饰的都是「单例对象」，我们以后将用「单例对象」代替Scala中的对象这个概念。

**关于单例对象，你需要记住一个核心的理念：共享。**单例对象、单例模式，所有和单例相关的都离不开**共享**这个概念。或者说的更准确一点，是**共享对象**。

对象在本质上可以具备类的所有特性，因为类是对象的模板，对象不过是类的一个实例而已。而类有一个重要的特性：**继承或实现**。在Scala中我们会将继承或实现称作**扩展类或特质**。扩展使得类能够进行更好的抽象。在Java中我们通常会对类执行扩展操作，但是在Scala中，自从单例对象被作为一种更常态的特性，单例对象也可以扩展类或特质来实现更多的功能。其中一个很典型的应用就是借助单例对象的扩展来表示一些公共的状态。

例如以下代码：

我们可以通过用「单例对象」继承指定的抽象结构来共享一些默认的状态和对象。其实，关键的核心思想还是两个字**共享**

```scala
abstract class Status(var status: Int) {
  def operation()
}

object Ok extends Status(200) {
  override def operation(): Unit = println("Ok operation")
}

object Error extends Status(500) {
  override def operation(): Unit = println("Error operation")
}

```

与此类似的，我们通过继承`Enumeration`接口可以在Scala中实现枚举的功能。Scala默认没有实现枚举功能的。具体的这里不进行讲述，感兴趣的可以上网进行查询。

总而言之，凡是有**共享**这个概念的地方，你都可以考虑使用「单例对象」来实现。

## apply方法

首先来看一段代码

```scala
new Array[Person](new Person("Rhyme"),new Person("Captain"))
Array[Person](Person("Rhyme"),Person("Captain"))
```

你觉得哪种形式更加简洁直观呢？第一种方式这里不再解释，第二种方式，你会发现，我们省去了`new`关键字。

我们先不管具体的语言特性，单从代码本身来看，你会更倾向于哪一种？

很明显，我会选择第二种省去`new`关键字的方式。原因很简单：更加自然，更加简洁。首先，作为同行，想必`new`关键字我们再熟悉不过了。敲了它不下一万遍有没有！敲了这么多，你就没有感觉过**烦**吗？

其实**烦**这个字很关键，一旦你写某段代码写得烦了，就说明这段代码本身就是存在题的。然而如果你觉得它并没有什么，那只能说明你已经麻木了，作为一个好的程序员，不应该麻木，我们要想法设法，写**最关键的代码**。

首先作为一个全民公认的`new`操作，为什么我不可以将`new`这个关键字从类名前面移去呢？注意我们关注的应该是**最关键的代码**。`new`关键字对我来说，已经是再熟悉不过的东西了，它对我已经没有价值了，就让他默认存在就好了，我不需要再看到它！

而这种可以帮你省去`new`操作的语言特性我们就可以使用`apply`方法来实现。

我们通常会在伴生对象中定义一个`apply()`方法，例如如下代码：

```scala
class Person(name: String) {
}

object Person {
  def apply(name: String):Person = new Person(name)
}
```

`apply`方法将为我们返回一个「伴生类」的对象。当我门在执行`Person("Rhyme")`的时候，默认就会调用「伴生对象」中的`apply()`放回，并为你返回一个创建好的对象。如果你不想使用`apply()`方法，自己定义一个更适合自己的工厂方法也是一个不错的选择。

```scala
class Person(name: String) {
}

object Person {
  def createPerson(name:String):Person = {
    new Person(name)
  }
}
```

## 回归常态

其实，以上这些特性，你发现没有，Scala在底层的技术实现上，并没有做太多的改变，将这些Scala代码编译，用javap来查看编译之后的代码，你会发现它利用的依然是原先Java中的那些代码逻辑，只不过它一直在做优化，一直在简化，让**单例**，**静态**，**对象创建**等语言特性回归它们应有的常态，让他们成为一种天然的语言特性存在着，就像鱼儿之于大海一样自然的存在着。

最后，再让我们回到最开始讲的那句话：**`Scala Object`是一种让静态回归常态、打破模式、天然的语言特性。** 仔细再品味品味，你是不是又有一些新的体会呢！

在下一篇中，我们会继续探索object更加具体的应用，比如如何去改造Java传统的工厂方法和模式。