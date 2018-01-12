---
title: Scala 与设计模式（一）：Singleton 单例模式  
author: Prefert
tags:
- 设计模式
- Java
- ~Scala 与设计模式
description: 单例模式（Singleton Pattern）是 Java 中最简单的设计模式之一。这种类型的设计模式属于创建型模式，它提供了一种创建对象的最佳方式。这种模式涉及到一个单一的类，该类负责创建自己的对象，同时确保只有单个对象被创建。这个类提供了一种访问其唯一的对象的方式，可以直接访问，不需要实例化该类的对象。
date: 2017-07-12
---

二十年前，软件设计领域的四位大师（ GoF ，"四人帮"，又称 Gang of Four，即Erich Gamma, Richard Helm, Ralph Johnson & John Vlissides）通过论著《设计模式：可复用面向对象软件的基础》阐述了设计模式领域的开创性成果。设计模式（`Design Pattern`）是一套被反复使用、多数人知晓的、经过分类的、代码设计经验的总结。


在 2017 年的今天，虽然一些传统的设计模式仍然适用，但部分设计已经发生改变，甚至被全新的语言特征所取代。
本系列文章首先会介绍传统的设计模式在 Java 与 Scala 中的实现，之后会介绍 Scala 可以实现的 “新” 的设计模式。

本文将会简单介绍单例模式在 Java 中的实现方式，以及如何将单例模式应用在 Scala 中，通过比较来阐述单例模式。

## 概念  

单例模式最初的定义出现于《设计模式》（艾迪生维斯理, 1994）：
> 保证一个类仅有一个实例，并提供一个访问它的全局访问点。  

通俗一点单例类就是：全局可以访问的唯一实例。

## Why Singleton   

什么时候需要使用单例模式呢？ 如果某个类创建时需要消耗很多资源，即创建出这个类的代价很大时我们就需要使用单例模式。通俗的讲，我们可以将单例对象比作地球，因为很难创建出第二颗这样的星球，这时我们就需要共用地球。

在编写程序的时候，很多操作都会占用大量的资源，如：日志类、配置类、共享资源类等等，我们倡导节能减排，高效利用资源。所以，对于这些操作我们需要一个全局的可访问接口的实现（也可能是懒加载）。

但是我们如何才能保证一个类只有一个实例并且这个实例易于被访问呢？一个全局变量使得一个对象可以被访问，但是它并不可以防止我们实例化多个对象。一个更有效的方法是，让类自身负责保存它的唯一实例。这个类可以保证没有其他实例可以被创建（通过截取创建新对象的请求),并且它可以提供一个访问该实例的方法。这就是单例模式。  

## Java 实现  
单例模式应该是 Java 中最出名的设计模式，虽然 Java 语言中包含了静态关键词( `static` )，但是静态成员与任何对象都不存在直接联系，并且静态成员类不能实现接口。因此，静态方法的概念违背了 [OOP](https://zh.wikipedia.org/zh-hans/%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1) 的前提：所有东西都是对象。  

一般来说在 Java 中单例模式有两种形式：**饿汉模式（eager）**、**懒汉模式(lazy)** 。

#### 饿汉 —— 基础版  

对于一个初学者来说，写出的第一个单例类应该是类似下面这个样子的：

```Java
public class HungrySingleton {
    //类加载时就初始化
    private static HungrySingleton instance = new HungrySingleton();

    private HungrySingleton() {
        System.out.println(("HungrySingleton is created"));
    }

    public static void run() {
        System.out.println(("HungrySingleton is running"));
    }

    public static HungrySingleton getInstance() {
        return instance;
    }

    public static void main(String[] args) {
        HungrySingleton.run();
    }
}
```

以上代码中有了全局访问点，同时单例类也是静态的，结构也比较清晰。

运行测试代码后控制台输出：
```
HungrySingleton is created
HungrySingleton is running
```
从以上结果我们可以发现这种模式有一个缺点: 不是惰性初始化(`lazy initialization`)，即单例会在 JVM 加载单例类后一开始就被初始化，如果此时单例类在系统中还扮演其他角色，不管是否用到都会初始化这个单例变量。因为这种写法下单例会被立即初始化，所以我们称这种单例为 **饿汉 (eager)** 。

#### 懒汉 —— 基础版
为了解决上述的问题，我们就需要引入延迟加载。比较容易想到的做法是：在获取实例的时候判断实例是否存在，不存在则创建。代码如下：
```Java
public class LazySingletonOne {
    private static LazySingletonOne instance;

    private LazySingletonOne() {
        System.out.println(("LazySingletonOne is created"));
    }

    public static void run() {
        System.out.println(("LazySingletonOne is running"));
    }

    public static LazySingletonOne getInstance() {
        if (instance == null) {
            instance = new LazySingletonOne();
        }
        return instance;
    }

    public static void main(String[] args) {
        LazySingletonOne.run();
    }
}
```
运行后控制台输出：
```
LazySingletonOne is running
```
可见这种形式在这样的环境下确实已经能满足我们的需求。但是在多线程环境下，缺点就非常明显：会出现创建出多个实例的情况（由于篇幅限制，测试代码见文末源码）。这时候通常的做法是在方法上加一个同步锁
（`synchronized`），但是仅仅这样就够了吗？

#### 懒汉 —— 双重检查锁版(`Double-checked locking`)  
在 `getInstance` 整个方法外加同步锁（`synchronized`），每次访会还是会造成很大的性能开销。我们就只能在方法的临界区做一些文章，`Double-checked locking` 应声而至。
我们先看代码：
```Java
...
private static LazySingletonTwo instance;
...
public static LazySingletonTwo getInstance() {
      if (instance == null) {                         // 第一次检查
          synchronized (LazySingletonTwo.class) {
              if (instance == null) {                 // 第二次检查
                  instance = new LazySingletonTwo();
              }
          }
      }
      return instance ;
  }
```
为了避开多次同步锁的开销，我们先判断单例实体是否存在再进行同步锁操作。这样虽然已经能应对大部分的问题，但是依然存在一个问题：其他线程可能会 `read` 初始化到一半的 `instance`。只有将 `instance` 设置为 `volatile` ，才能保证每次的 `write` 操作优先于 `read` 操作，即能确保每次引用到都是最新状态。[了解更多](https://www.cs.umd.edu/~pugh/java/memoryModel/jsr-133-faq.html#dcl)
只用将代码稍加改动：

```Java
// private static LazySingletonTwo instance;           ---- old

   private volatile static LazySingletonTwo instance;  ---- new
```

**注意** ：我们至少要创建一个 `private` 构造器，否则编译器默认将为我们生成一个 `friendly` 的构造器，而非 `private`；其次，`instance` 成员变量和 `getInstance()` 方法必须是 `static` 的；如果单例类实现了 `java.io.Serializable` 接口，就可能被反序列化，从而产生新的实例。

#### 静态内部类版
当然，我们还能通过静态内部类来实现：  
```Java
final class StaticNestedSingleton {
    // 声明为 final 能防止其在派生类中被 clone
    private StaticNestedSingleton(){
       System.out.println(("StaticNestedSingleton is created"));
   }

    public static StaticNestedSingleton getInstance()
    {
        return NestedClass.instance;
    }

    //在第一次被引用时被加载
    static class NestedClass
    {
        private static StaticNestedSingleton instance = new StaticNestedSingleton();
    }
}
```

上面的代码中，我们将单例类设置为 `final` 类型，这样能够禁止克隆的发生。同样静态内部类只有在第一次被引用时才加载，即随着类的加载而产生（而不是随着对象的产生）。

#### 枚举类模式  
上面的几种是我们比较常见的单例类形式，可能有的同学会抱怨道：有没有简短易懂一点的？
当然我们还可以使用 Java 中的枚举类实现单例：  

```Java
public enum  EnumSingleton {
    INSTANCE;
    private final String[] preference =
            { "intresting","nice","just so so" };

    public void printPreference() {
        System.out.println(Arrays.toString(preference));
    }
}
```

这是 《Effictive Java》 中所推荐的单例模式在 Java 中的最佳实现方式，同时也是 Stack Overflow 中 [what-is-an-efficient-way-to-implement-a-singleton-pattern-in-java](https://stackoverflow.com/questions/70689/what-is-an-efficient-way-to-implement-a-singleton-pattern-in-java) 最高票回答。

注意：`Enum` 与 `enum` 是不同的。后者只是 Java 1.5 后增加的一个语法糖，不是新的类型。 我们可以反编译 `EnumSingleton.class` 查看一下内部代码：
```
$ javap EnumSingleton.class
```

编译后：
```java
public final class Singleton.Java.EnumSingleton extends java.lang.Enum<Singleton.Java.EnumSingleton>{
public static final Singleton.Java.EnumSingleton INSTANCE;
public static Singleton.Java.EnumSingleton[]values();
public static Singleton.Java.EnumSingleton valueOf(java.lang.String);
public void printPreference();
static {};
    }
```

简单总结一下，选用 `enum` 原因如下：
- `enum` 防止反序列化重新创建新的对象。
- 类的修饰 `abstract`，所以没法实例化，反射也无能为力。
- 关于线程安全的保证，其实是通过类加载机制来保证的，我们看看 `INSTANCE` 的实例化时机，是在 `static` 块中，JVM加载类的过程显然是线程安全的。

## Scala 实现  

在 Scala 中并没有 `static` 关键字，你不用纠结太多，我们用 `object` 便能实现单例，再也不用为你的选择困难症烦恼！

### object 
`object` 在 Scala 中被称作 「单例对象」 (Singleton Objects)。

> object 关键字创建一个新的单例类型，就像一个 class 只有一个被命名的实例。如果你熟悉 Java, 在 Scala 中声明一个 object 有些像创建了一个匿名类的实例。      ——引自 《Scala 函数式编程》

举个例子：
```Scala
object Singleton2Scala {
  def sum(l: List[Int]): Int = l.sum
}
```

测试:
```Scala
object Test {
  def main(args: Array[String]): Unit = {
    Singleton2Scala.sum(List)
  }
}
```

看起来是不是比 Java 优雅多了！  

你问有没有多线程问题？是否是惰性初始化？这些都不用你来处理。

Scala 被编译后生成 `'Singleton2Scala$.class'` 和  `Singleton2Scala.class`，我们可以对其进行反编译：

```
$ javap  'Singleton2Scala$.class'
Compiled from "Singleton2Scala.scala"

public final class Singleton.Scala.Singleton2Scala$ {
  public static Singleton.Scala.Singleton2Scala$ MODULE$;
  public static {};
  public int sum(scala.collection.immutable.List<java.lang.Object>);
}


$ javap  Singleton2Scala.class
Compiled from "Singleton2Scala.scala"

public final class Singleton.Scala.Singleton2Scala {
  public static int sum(scala.collection.immutable.List<java.lang.Object>);
}

```
从上方代码我们能看到，所有的方法前都带上了 `static` 关键字。

在实际项目开发的时候，我们还可以继承其他 class(类) 与 trait(特质)。举个例子：
```Scala
object AppRegistry extends xxClass with xxtrait{
  println("Registry initialization block called.")
  private lazy val lazyXX  = ???
  private val users: scala.collection.mutable.HashMap[String, String] =  scala.collection.mutable.HashMap.empty

  def addUser(id: String, name: String): Unit = { users.put(id, name) }
  def removeUser(id: String): Unit = { users.remove(id) }
  def isUserRegistered(id: String): Boolean = users.contains(id)
  def getAllUserNames(): List[String] = users.map(_._2).toList
}
```

#### 优点
- 比 `static class` 更易于理解  
- 语法简洁
- 按需初始化(`lazy initialization`)
- 线程安全(Scala 中不用考虑 `double-checked locking`)  

#### 缺点
- 缺乏对初始化行为的控制  

## 总结
以下是对 Scala 和 Java 是实现单例模式的一个简单比较：

| 场景 | Java        | Scala           |  
| --- |:-------------:|:-------------:|  
| 单线程  |  `static`       | `object` |  
| 多线程  | `synchronized` +  `volatile`  | `object` |
| 延迟加载 |  `enum` 、 `double-checked locking` | `object` + `lazy`(参数延迟加载)    |  

人们对单例模式的看法褒贬不一，甚至被称为是 `anti-pattern` (反面模式）。如果你是一名 Java 开发者，可能 Spring 框架中 `Dependency Injection` 是你的 better choice 。但是单例模式你不能否认的是单例模式在 Android SDK 中得到了广泛的应用。在 Scala 中，伴生对象出现的频率更是非常之高。当你面对的业务场景需要用到单例模式的时候，请务必注意 **多线程** 与 **性能开销** 的问题。

[源码链接](https://github.com/YarenTang/Design_Patterns_Examples)
如有说错的地方还请指出，不胜感激。
