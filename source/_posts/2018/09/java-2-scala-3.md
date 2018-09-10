---
title: 从 Java 到 Scala (三)： object 的应用
author: Captain
tags:
- Java
- ^Captian
- 类型相关
- ~从 Java 到 Scala
description: 本文主要介绍object 的应用场景，让模式实现更简洁高效，希望对你有些许帮助。
date: 2018-09-10
---


在上篇 Java 到 Scala 系列中，我想你或多或少在语言特性上对`object`有了一定的掌握，在了解完它酷酷的语言特性——**让静态回归常态**并能简单运用其衍生出的方法后，我今天就来谈谈在现实应用方面自己对它的理解，不知道是不是也会给你一种耳目一新的感觉，毕竟「单例对象」作为一种天然的语言特性，华而不实并不是我们想看到的。

## 单例模式 VS 单例对象

我们已经知道了`object` 是作为打破静态而存在的「单例对象」，在 Scala 中，「单例对象」使用频率之高可以和 Java 中的 new 关键词相比，又或是 Spring 中DI（Dependency Injection），所以我们不得不考虑到一些场景——**多线程**和**性能开销**。现在就具体来看看它和 Java 实现的单例模式有什么不同。

先来看看 Java 对于单例模式的实现：

### 饿汉模式

```java
public class UniqueSingleton {
  //类加载时就初始化
  private static uniqueSingleton instance = new uniqueSingleton();
  private UniqueSingleton() {
    System.out.println(("UniqueSingleton is created"));
  }
  public static UniqueSingleton getInstance() {
    return instance;
  }
}
```

单例模式就靠以上几行代码实现了，就是这么简单。但是饿汉模式有这么一个缺点，无论你有没有调用它，它在 JVM 加载类这个过程中都会将单例加载好，所以它并不具备**惰性传值**（在 Java 中即延迟加载的概念）这个特性。

### 懒汉模式

```java
public class UniqueSingleton {
  //类加载时就初始化
  private static uniqueSingleton instance;
  private UniqueSingleton() {
    System.out.println(("UniqueSingleton is created"));
  }
  public static UniqueSingleton getInstance() {
    if (instance == null) {
   	  instance = new UniqueSingleton();
    }
    return instance;
  }
}
```

为了解决这个问题，我们自然得考虑到延迟加载，解决办法也非常简单，相信你也一目了然即在在创建之前加个判断条件。但是问题真的就全部解决了么，其实不然，在单线程环境下，这确实是一种比较完美的方案，但是在多线程情况下呢？试想多个实例同时被创建，我们能想到的解决办法通常是在整个`getInstance`方法前加个`synchronize`关键词，但是这同时也带来了很大的性能开销，这并不是我们希望的。这里不得不提到网上一个[大神的问答](https://stackoverflow.com/questions/70689/what-is-an-efficient-way-to-implement-a-singleton-pattern-in-java)，他提出一个解决办法——**use an enum**。

### 枚举类实现

```java
public enum EnumExample {
  INSTANCE;
  private final String[] favoriteComic =
    { "fate", "Dragon Ball" };
  public void printFavorites() {
    System.out.println(Arrays.toString(favoriteComic));
  }
}
```

以上方法除了很简单以外，`enum`还提供了序列化机制，防止重新创建新的对象，这个回答也在 Stack Overflow 上获得了最高票的回答。

### object 实现

> object 关键字创建一个新的单例类型，就像一个 class 只有一个被命名的实例。如果你熟悉 Java ,在 Scala 中声明一个 object 有些像创建了一个匿名类的实例。 ——引自 Scala 函数式编程

其实我在上面罗列了这么多 Java 对于单例模式的实现方法以及对于不同场景所进行的不断的优化，就是为了引出`object`，因为`object`就不必考虑这么多，不会像 Java 那样受到场景的约束。

举个例子：

```scala
object Singleton {
  def sum(l: List[Int]): Int = l.sum
}
```

看起来代码是不是瞬间优雅了许多。如果感兴趣的话，你可以利用`$ javap`反编译一下，可以看到所有方法前都带上了`static`关键词，在这里我就不在详述。

因为线程安全再也不用担心是单线程还是多线程，又或是考虑到延迟加载也只要加上`lazy`关键词按需初始化即可，方不方便谁用谁知道。

## 优化传统工厂模式

众所周知，在敲代码中我们做的最多的事情之一就是先去创建一个对象，这跟我们建房子先建地基一个道理。我们希望有一种模式能让我们更好去使用它，方便后期的维护，创建型模式也就应运而生，而工厂模式又是创建型模式中的主角之一，我想这设计模式对熟悉 Java 的各位来说应该是小菜一碟吧。实际上，工厂模式被分成了三类——**简单工厂模式**、**工厂模式**以及**抽象工厂模式**。但我更希望把它分为两类，在我看来，简单工厂模式更像是工厂模式的一个特例，不能算是严格意义上的模式，可它确确实实实现了创建实例的逻辑与客户端的解耦。

在这里，我会通过 Scala 和 Java 两种不同的语言来实现简单工厂模式，从而加深你对`object`的印象。假设现在有个电脑器材制造厂，同时生产鼠标和键盘，我们用熟悉的简单工厂模式设计来描述它的业务逻辑。先用 Java 来定义：

```java
//定义产品接口
public interface Product{
  public void show();
} 
//以下实现了具体产品类
public class Mouse implements Product {
  @Override
  public void show() {
    System.out.println("A mouse has been built");
  }
}
public class Keyboard implements Product {
  @Override
  public void show(){
    System.out.println("A keyboard has been built");
  }
}
public class SimpleFactory {
  public Product produce(String name) {
    switch (name) {
      case "Mouse":
        return new Mouse();
      case "Keyboard":
        return new Keyboard();
      default:
        throw new IllegalArgumentException();
    }
  }
}
//简单使用
public class Test {
  public static void main(String[] args) {
    SimpleFactory simpleFactory = new SimpleFactory();
    Mouse mouse = simpleFactory.produce("Mouse");
    mouse.show();
  }
}
```

上述代码通过调用`SimpleFactory `中的 `produce `方法来创建不同的 Product 子类对象，从而实现创建实例的逻辑与客户端之间解耦，在这里我采用直接判断传入的 key 的方式来实现了简单工厂模式，当然还有其他方式——通过 newInstance 反射等等。那么有人会问，通过 Scala 该怎么实现呢？这时候就要请我们的主角——**单例对象**出场了。

### **用单例代替工厂类**

要知道 Scala 支持用`object`来实现Java中的单例模式，所以我们可以实现一个`SimpleFactory`单例，而不是一个工厂类，具体代码如下：

```scala
trait Product {
  def show()
}
case class Mouse() extends Product {
  def show = println("A mouse has been built")
}
case class Keyboard() extends Product {
  def show = println("A keyboard has been built")
}
object SimpleFactory  {//object代替class
  def produce(name: String): Product =  name match {
    case "Mouse" =>   Mouse()
    case "Keyboard" =>   Keyboard()
  }
}
object Test extends App {
  val mouse: Mouse = SimpleFactory.produce("Mouse")
  mouse.show()
}
```

通过以上代码，我们可以发现，同样是通过判断传值的方式，Scala 也可以轻而易举地实现。但这并不是最重要的，值得让我们注意到的是在测试之前不用再去创建`SimpleFactory`对象了，这正是先前讲的`object`静态属性在应用层次给我们带来的便利，或许你会嗤笑这小小简化才有多大的好处。别急，Scala 还为我们提供了一种语法糖 —— `apply`，它本质上类似一个构造方法，这在上篇文章中也有讲到，其实它也可以应用于工厂模式，通过这种方式，我们可以省略工厂类，只需增加产品类接口的伴生对象就可以实现。

### **伴生对象创建静态工厂方法**

我们通过判断传入的 name 字符串来创建不同的对象，所以这里的`produce()`方法就显得有点冗余，如何让工厂模式的实现更加的完美呢？用伴生对象来创建恰好可以解决这个问题：

```scala
object Product {
  def apply(name: String): Product = name match {
   	case "Mouse" =>   Mouse()
    case "Keyboard" =>   Keyboard()
  }
}
```

然后，我们就可以如此调用

```scala
val mouse: Product = Product("Mouse")
val keyboard: Product = Product("Keyboard")
mouse.show()
keyboard.show()
```

这样以后，调用的体验是不是更好了呢？可以看到，利用`object`的特性，我们在一定程度上改进了 Java 中设计模式的实现，简单工厂模式仅仅也是冰山一角而已。

由于篇幅有限再次只列出简单工厂模式，至于方法工厂模式和抽象工厂模式，有兴趣的话可以看看[源码](https://github.com/Alienkukuda/Scala-Note/tree/master/course/src/main/scala/example/Factory)。

最后，总结成一句话，`object`作为一种打破静态回归常态、天然的语言特性，它对 Java 的部分特性进行了优化以便我们能跟好地去理解、去使用，不知道你有没有对此和我产生一些共鸣呢？