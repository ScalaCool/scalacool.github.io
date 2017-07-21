---
title: Scala 与设计模式（二）：Builder 创建者模式 
author: Prefert 
tags: 
- 设计模式
- Java
description: 创建者模式（Builder Pattern）支持以类方法而非类构造器的方式来创建实例。当一个类的构造器拥有多个版本以支持不同的用途时，这种模式尤其有用。
date: 2017-07-21
---


在 Java 开发中，你是否写过这样像蛇一样长的构造函数：
```Java
Robot robot = new Robot(1, true, true, false, false, false, false, false, false) // Boolean 类型的参数表示 computer 是否含有对应固件
```
刚写完时回头看发现能看懂，一天后回头看时已经忘记大半了，一个星期后：What The Fu*k？
当然有强（lan）迫（duo）症的同学肯定不能忍 ——— 他们会创造各种各样的便捷版！

本文会通过 Builder Pattern 来一步步解决上述以及更复杂的一些情况。

文章结构大致如下：
- builder pattern 的概念
- 问题分解
 - Java 实例
 - Scala 实例
- 总结

## 概念  

创建者模式与单例模式一样，也是「四人帮」设计模式中的一种，一般也译作「生成器模式」，定义如下：

> Separate the construction of a complex object from its representation so that the same construction process can create different representations.
   将一个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。        

## 它解决了什么问题

#### 当大量参数遇上构造函数
我们都知道在 Java 中，每个类都至少有一个构造函数，如果我们没有明确声明构造函数，编译器会默认帮我们生成一个无参的构造函数。当然我们也可以根据参数写不同的构造函数。

在实际项目开发中，对象中的属性一般都是比较多的。当对象中有大量可选参数或者参数类型一致时（正如文章开头的例子），通常情况下创建前我们需要了解这个类的内部结构，然后我们忽略掉为空的参数或者用所需的参数写一个新的构造函数。

我们以「机器人」类为例：
```Java
public class Robot {
    private String code;
    private String name;
    private int type;
    private int battery;
    private int ability;
    private double weight;
    private double height;

    // 通常我们会生成一个含有全部参数的构造函数
    public Robot(String code, String name, int type, int battery, int ability, double weight, double height) {
        this.code = code;
        this.name = name;
        this.type = type;
        this.battery = battery;
        this.ability = ability;
        this.weight = weight;
        this.height = height;
    }

    @Override
    public String toString() {
        return "Robot {" +
                "code = " + code + '\'' +
                ", name = '" + name + '\'' +
                ... // 省略部分
                ", height = '" + height +
                '}';
    }

// Test
Robot robot1 = new Robot("89757", "火星一号", 1, 99, 250, 180, 180);
System.out.println(robot1);
```

我们假设 `code` `name` `type` 是必填的参数，其他参数是可选的，我们想要的写法可能是下面这样的：
```Java
Robot robot2 = new Robot("89757", "火星一号", 1);
```

奈何编译器可没那么智能，这样肯定会给出参数不匹配的 error 。我们只能老实的根据参数再去写一个构造函数：
```Java
public Robot(String code, String name, int type) {
    this.code = code;
    this.name = name;
    this.type = type;
}
```
当用户类型不同时，参数组合情况就会很多，难道还要每种都写一个吗？就算这样写了，也意味着构建时有多种对象状态，扩展起来也不方便，该怎么办呢？ Builder 模式虎躯一震：是时候展现真正的技术了。

#### Java —— 变种版
为了应对可选参数过多的情况，我们可以将 `Robot.java` 改进成下面这样：
```Java
public Robot(RobotBuilder robotBuilder) {
       this.code = robotBuilder.code;
       this.name = robotBuilder.name;
       ...
       this.height = robotBuilder.height;
   }

   public static class RobotBuilder {
       private String code;
       private String name;
       ...
       private double height;

       // 必填参数
       public RobotBuilder(String code, String name, int type) {
           this.code = code;
           this.name = name;
           this.type = type;
       }

       //选填参数
       public RobotBuilder withOptionalBattery(int battery) {
           this.battery = battery;
           return this;
       }

       ... // 省略部分选填参数

       public Robot buildRobot() {
           ValidateRobotData();
           return new Robot(this);
       }

       private boolean ValidateRobotData() {
           // 参数格式检查
           return true;
       }
   }
```
通过这种写法，可以减少对象创建过程中引入的多个构造函数、可选参数以及多个 setter 过度使用导致的不必要的复杂性。

测试：
```Java
Robot robot = new Robot.RobotBuilder("89757", "火星一号", 1)
        .withOptionalBattery(99)
        .withOptionalAbility(250)
        .withOptionalWeight(180)
        .withOptionalHeight(180)
        .buildRobot();

System.out.println(robot);
```

这样的链式调用看起来比较优雅，同时对于可选参数也有语义化的引入方式。但是实际的情况可能会更糟糕一些：`Robot` 类中可能还会包含其他复杂对象，并且这些对象之间还存在一些构造顺序，下面将介绍传统的 Buidler 模式是如何解决这个问题的。

### Java —— 传统版

在写实际的例子之前，让我们先看一下 「四人帮」 提出的 Builder 模式的组成（推荐新手先看例子再回过头来看）
##### Builder 模式的构成

1. 建造者(Builder):
 - Builder 为创建一个 Product 对象(对应文中 Robot)的各个部件指定抽象接口。
2. 抽象建造者(ConcreteBuilder):
 - 实现 Builder 的接口以构造和装配该产品的各个部件。
 - 定义并明确它所创建的表示。
 - 提供一个检索产品的接口
3. 导演类(Director)
 - 构造一个使用 Builder 接口的对象。
4. 产品类(Product)  
 - 表示被构造的复杂对象，ConcreteBuilder 创建该产品的内部表示并定义它的装配过程。
 - 包含定义组成部件的类，包括将这些部件装配成最终产品的接口。

 看着是不是会有一点绕？还是先直接进入实际的场景部分吧！

##### 如何让构造的对象有不同表示
不知道大家有没有看过「西部世界」，这部电影中的机器人展现出了高度智慧（没看过的话多啦A梦也可以吧），相信大家都想拿一个过来研究一下。

如果我们能够购买到这样的机器人，过程应该是这样的：
1. 我们（`Client`）和出厂商（`Director`）联系，告诉出厂商需要什么类型的机器人（`Product`)
；
2. 出厂商接单后，设计师将我们需要的机器人的部件（`Builder`）进行分类筛选，发出构造指令；
3. 不同生产人员（`ConcreteBuilder`）收到对应部件的构造命令；
4. 各个组件被组装起来变成我们需要的机器人（`Product`）。

##### 代码实现
有了一个过程的概念，让我们看看代码是如何实现的（模拟的侧重点不同所以将 `Robot` 的参数改变）：
0. 厂家决定机器人有哪些结构
```Java
public class Robot {
    private String sensor;
    private String control;
    private String drive;
    private String shell;

    ... //省略参数的 set 函数

    @Override
    public String toString() {
        return "Robot {" +
                "  Sensor = '" + sensor + '\'' +
                ", Control = '" + control + '\'' +
                ", Drive = '" + drive + '\'' +
                ", Shell = '" + shell + '\'' +
                '}';
    }
}
```

1. 定义组装机器人的过程
```Java
abstract class Builder {

    public abstract void BuildSensor();  // 构建传感器模块
    public abstract void BuildControl(); // 构建控制模块
    public abstract void BuildDrive();   // 构建驱动模块
    public abstract void BuildShell();   // 构建外壳

    public abstract Robot getRobot();
}
```

2. 实现生产工创造并组装组件的具体方式，返回拼装好的机器人
```Java
public class ConcreteBuilder extends Builder {
    //创建机器人实例
    Robot robot = new Robot();

    // 生产并组装部件
    @Override
    public void BuildSensor() {
      robot.setSensor("创建并组装传感器");
    }

    ... // 省略部分 Build 函数

    @Override
    public Robot getRobot() {
        return robot;
    }
}
```

3. 下达指定给机器人生产与组装人员
```Java
public class Director {

    public void Construct(Builder builder){
        // 按一定顺序组装机器人
        builder.BuildSensor();
        builder.BuildControl();
        builder.BuildDrive();
        builder.BuildShell();
    }
}
```

4.  测试机器人
```Java
Director director = new Director();
Builder builder = new ConcreteBuilder();

director.Construct(builder); // 发出组装机器人的指令
Robot robot = builder.getRobot(); // 拿来拼装好的机器人
System.out.println(robot); // 展示机器人
```

##### 总结
从上面的例子中看出我们只关心机器人是否正常运作，但是并不知道机器人拼装的过程。即这种模式的封装性很好。使用该模式可以有效的封装变化，在使用场景中，一般产品类（`Product`）和建造者(`Builder`)类是比较稳定的，因此，将主要的业务逻辑封装在导演类（`Director`）中对整体而言可以取得比较好的稳定性。

其次，建造者模式很容易进行扩展。如果有新的需求，通过实现一个新的建造者（`ConcreteBuilder`)类就可以完成，基本上不用修改之前的代码，因此对原有代码影响很小。

那么，在 Scala 中是否也存在 Java 的问题呢？

## Scala 实现  

#### 仿 Java 版
问题存在是毋庸置疑的，但我们最关心的应该是解决方法，Java 能干的 Scala 肯定也是能做的。在 Scala 中也有类似上文中 「Java —— 变种版」 的实现方式，我们还是采用 `Robot` 作为例子（因篇幅有限省略参数）：
```Scala
class Robot(builder: RobotBuilder) {
    val name = builder.name
    val nickname = builder.nickname
    val age = builder.age
  }
```

然后定义一个 `Buidler` 类:
```Scala
class RobotBuilder {
  var name = ""
  var code = ""
  var battery = 0

  def setName(name: String): RobotBuilder = {
    this.name = name
    this // 返回 this 链式调用
  }

  ... // 省略两个 set 函数

  def build() = {
    new Robot(this)
  }
}
```

测试：
```Scala
val robot: Robot = new RobotBuilder()
  .setCode("89757")
  .setName("Bat-Man")
  .setBattery(88)
  .build()
System.out.println(s"Robot: $robot }")
```
这个与上方 Java 版本基本无异，当为 `Robot` 类添加新的字段也不必再创建新的构造器。仅需要通过 `RobotBuilder` 类进行兼容即可。

#### case class 版
但是我们可能忽略了一个问题：Scala 作为 「Object-Oriented Meets Functional」 的一门语言，推崇函数式编程和并发，比 Java 更加强调不变性。上文中的 `setXXX` 已经违背了这个特点，会带来副作用，这并不符合最佳实践。

好在 Scala 拥有样例类，这使得创造者模式的实现变得更加简单：
```Scala
case class Robot(
                   name: String = "",
                   code:  String = "",
                   battery :Int = 0
                  )
```
测试：
```Scala
val robot1 = Robot(
  code = "89757",
  name = "Bat-Man",
  battery = 99
)

val robot2 = Robot(name = "prefert")

System.out.println(s"Robot 1: $robot1")
System.out.println(s"Robot 2: $robot2")
```
这种实现要比第一种实现更加简洁并且也更易维护，同时解决了第一种中不够 Pure 的缺点。

####  类型安全(`type-safe`) 版
在创建对象的过程中，参数的初始化顺序可能是严格要求的（比如机器人遵循从里到外，从小到大的构造方式）。回顾前面两种方式，我们并不能完全控制参数的初始化顺序。

这里我们给`code` `name` 字段设置非空约束。为了确保这些参数都被设置，我们可以结合 `sealed` 关键字，利用 ADT 来达到这个目的（对 ADT 不熟悉的同学可以参考一下这篇文章[如何在 Scala 中利用 ADT 良好地组织业务]( http://scala.cool/2017/03/how-to-use-algebraic-data-type-in-scala-development/)），同时对 `Robot` 类做一些修改：
```Scala
case class Robot(
                  code: String,
                  name: String,
                  battery: Int
                )

//  抽象类型定义了构建过程的不同步骤
// sealed 关键字要求我们要枚举所有的情况，被sealed 声明的 trait仅能被同一文件的的类继承
sealed trait BuildStep
sealed trait HasCodeStep extends BuildStep
sealed trait HasNameStep extends BuildStep
```

然后我们改变一下 `RobotBuilder` 类 ：
```Scala
// <: 为类型上界符号，即 PassedStep 必须是 BuildStep 的子类
class RobotBuilder[PassedStep <: BuildStep] private(
                                                     var code: String,
                                                     var name: String,
                                                     var battery: Int
                                                   ) {

  // 按实际需求重载构造器
  protected def this() = this("", "", 0)

  protected def this(pb: RobotBuilder[_]) = this(
    pb.code,
    pb.name,
    pb.battery
  )

  def setCode(code: String): RobotBuilder[HasCodeStep] = {
    this.code = code
    new RobotBuilder[HasCodeStep](this)
  }

  def setName(name: String)(implicit ev: PassedStep =:= HasCodeStep): RobotBuilder[HasNameStep] = {
    this.name = name
    new RobotBuilder[HasNameStep](this)
  }


  def setBattery(battery: Int): RobotBuilder[PassedStep] = {
    this.battery = battery
    this
  }


  // =:= 要求 ev 等于 HasAgeStep 类型
  def build()(implicit ev: PassedStep =:= HasNameStep): Robot = Robot(code, name, battery)
}
```
这里将 builder 构造器设为 `private` 类型，即我们不可再使用 `new` 来创建 builder 了。并且返回类型变成了 `RobotBuilder[PassedStep]`。

另外我们给需要的方法添加了泛化类型约束，以 `build()` 函数为例，它限制 `HasNameStep` 步骤完成后构造器才能成功调用。

现在已经实现构造器已经对外不可见了，我们还需要提供一个命令入口。
```Scala
object RobotBuilder {
  def apply() = new RobotBuilder[BuildStep]()
}
```
`object` 在上一篇单例模式中提到过，单独出现时即单例对象(`Singleton Object`)，当与同名 `Class` 同时出现时，被称为 `class` 的伴生对象(`companion object`)，其中的 `apply()` 方法用于实例化伴生类。

测试：
```Scala
val robot = RobotBuilder()
  .setName("tyl")
  .setCode("89757")
  .setBattery(99)
  .build()
System.out.println(s"Robot: $robot")
```

如果我们少写了 `setName` 或 `setCode` 函数，或者颠倒了顺序，编译器都会给出类似下方的错误：
```Scala
Error:(8, 13) Cannot prove that Builder.Scala.typesafe.BuildStep =:= Builder.Scala.typesafe.HasCodeStep.
    .setName("tyl")

    Error:(8, 13) not enough arguments for method setName: (implicit ev: =:=[Builder.Scala.typesafe.BuildStep,Builder.Scala.typesafe.HasCodeStep])Builder.Scala.typesafe.RobotBuilder[Builder.Scala.typesafe.HasNameStep].
    Unspecified value parameter ev.
        .setName("tyl")
```
因为能够支持在编译期间检查所编写的代码，所以对于需要检查类型的构造方式来说很可靠。

概括来说，`type safe` 版有如下的优缺点：

优点：
- 对于严格按照顺序（存在相互依赖）的构造场景十分合适
- 泛化类型约束使得构造时不易出错

缺点：
- 对于不需要构造顺序的构造场景来说画蛇添足
- 参数可变导致副作用
- 不够简洁

Scala 是一门高可扩展性语言，同样也提供了语法帮助我们缓解上述方法的缺点。

#### require 版
在 Scala 中我们可以使用 `require` 关键字进行函数参数限制，类似 Java 中的 `assert`。
```Scala
case class Robot(
                  code:  String = "",
                  name: String = "",
                  battery :Int = 0
                  ){
  require(code != "", "不可缺少 code 参数")
  require(name != "", "不可缺少 name 参数")
}
```
代码非常简洁，并且也满足我们的需求，这才像函数式风格啊（另外数据验证我们也可以通过第三方类库 `refined` 来实现，感兴趣的同学可以看一看[refined: simple refinement types for Scala](https://github.com/fthomas/refined)！

测试：
```Scala
try {
  val robot2 = Robot(name = "Bat-Man")
}catch {
  case e :Throwable => e.printStackTrace()
}
```

如果我们在创建的时候少写参数，或者任何不符合 `require` 条件的行为都会导致抛出异常：
```Scala
java.lang.IllegalArgumentException: requirement failed: 不可缺少 code 参数
	at scala.Predef$.require(Predef.scala:277)
	at Builder.Scala.require.Robot.<init>(Robot.scala:12)
```

## 总结
通过以上的例子我们可以得出 Builder 模式使用的场景大致如下：
- 当对象具有大量可选参数时。
- 当创建复杂对象的算法应该独立于该对象的组成部分以及它们的装配方式时。
- 当构造过程必须允许被构造的对象有不同的表示时。

另外，对比 Scala 和 Java 的实现，因为两者设计的初衷不同，所以也铸就了不同的语言特性。对于 Scala 而言，避免副作用是需要优先考虑的，当然 Scala 也有着很多语法糖来帮助开发者实现。
在 Java 和 Scala 中，实现 Buidler 模式的方式都很多，我们可以参考三种场景来选择恰当的方式实现，最大程度的提高开发效率。

[源码链接](https://github.com/YarenTang/Design_Patterns_Examples/tree/master/src/Builder)
如有错误和讲述不恰当的地方还请指出，不胜感激！
