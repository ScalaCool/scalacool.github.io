---
title: Scala 与设计模式（四）：Factory Method 工厂方法模式 
author: Prefert 
tags: 
- 设计模式
- Java
description: 工厂方法模式（Factory Method Pattern）是一种实现了「工厂」概念的面向对象设计模式。就像其他创建型模式一样，它也是处理在不指定对象具体类型的情况下创建对象的问题。
date: 2017-08-14
---

在中国历，房子常常与当下一样稀缺，住房问题同样是一个让百姓苦恼的社会热点。

在拆违章建筑还不盛行的年代，我们可以选择在深山老林里自己修建住所。但是一般来说都需要自己一砖一瓦搭建，除了地基和房屋的整体框架，还要考虑好通风采光等一系列问题。在 Java 中可能是这样实现的：
```Java

class Door { ... // 门}

class Wall { ... // 墙}

class Pillar { ... // 柱子}

class Building {
    private Door door;
    private Wall wall;
    private Pillar pillar;
    ... // 省略构造函数
    public void show() {
        System.out.println("房屋建好了");
    }
}

public class Test {
    public static void main(String[] args) {
        Door door = new Door();
        Wall wall = new Wall();
        Pillar pillar = new Pillar();

        Building building = new Building(door, wall, pillar);
        building.show();
    }
}
```

在科技发达的现在，时间就是金钱，很多工作都不是我们需要知道和完成的。大家更愿意直接去城市中购买房屋。

本文将介绍如何用「工厂方法模式」来编写代码，实现「购买商品房」这个操作。

先看看工厂方法模式是什么：

## 定义

工厂方法模式（Factory Method Pattern）是一种实现了「工厂」概念的面向对象设计模式。就像其他创建型模式一样，它也是 **处理在不指定对象具体类型的情况** 下创建对象的问题。定义如下：

> 定义一个用于创建对象的接口，让子类决定实例化哪一个类。Factory Method使一个类的实例化延迟到其子类。  — 《设计模式》 GOF

相信聪明的你看完以上内容后，心中已有「答案」，下面让我们一起来实现它。

## Java 实现
既然称作「工厂模式」，「工厂」肯定是少不了的，这里我们创造一个建筑公司实例（ConstructionFactory）：
```Java
... // 之前代码一致
// 当然也可以用 抽象类 实现
interface IBuilding {
    public void show();
}

class Building implements IBuilding { ... }

interface IFactory {
    public IBuilding createBuilding();
}

class ConstructionFactory implements IFactory {
    public IBuilding createBuilding() {
        Door door = new Door();
        Wall wall = new Wall();
        Pillar pillar = new Pillar();
        return new Building(door, wall, pillar);
    }
}
```

可以这么使用：

```Java
IFactory factory = new ConstructionFactory();
IBuilding building = factory.createBuilding();
building.show();
```

如果我们需要生产其他类型的建筑，实现一个新的「工厂」实例即可。
```Java
class ConstructionFactory implements IFactory {
  ...
}
```

从以上也可看出：**工厂做的事很简单 —— 封装内部的实现细节**。

它可以带来以下好处：
1. **降低耦合度**。在工厂方法模式中，工厂方法用来创建用户所需要的产品，同时还向用户隐藏了哪种具体产品类将被实例化这一细节，用户只需要关心所需产品对应的工厂，无须关心创建细节，甚至无须知道具体产品类的类名。
2. **良好扩展性**。需要新的产品类型时，只需要新增一个工厂类，不需要更改产品以及产品的接口以及用户的使用方式。
3. **代码结构清晰**。用户使用时不需要构造内部结构，直接调用工厂方法即可。

当然缺点也是存在的：
1. 增加使用成本。使用工厂模式的时候一般都会采用接口或者抽象类，有时还会涉及到反射、DOM 等方式。
2. 增加系统复杂度（影响不显著）。一个工厂类对应一个产品，所以增加产品类的时候就需要增加工厂类。

接下去看看 Scala 中如何实现工厂方法模式。

## Scala 实现
在 Scala 中，依旧可以用类似 Java 的方式来实现，只用把 Java 中的关键字 `interface` 换成 `trait` 即可。

```Scala
class Door { def  getInfo = println("门") }

class Wall { def  getInfo = println("墙") }

class Pillar { def  getInfo = println("支柱") }

trait IBuilding { def show() }

case class Building(door: Door, wall: Wall, pillar: Pillar) extends IBuilding {
  def show = println("房屋建好了")
}

trait IFactory { def createBuilding: IBuilding }

class ConstructionFactory extends IFactory {
  override def createBuilding = Building(new Door, new Wall, new Pillar)
}

object Test extends App{
  val iFactory: IFactory = new ConstructionFactory
  val iBuilding: IBuilding = iFactory.createBuilding
  iBuilding.show()
}
```

实际上，我们的目标类可能还存在多层级的关系，比如房屋还可以细分房型：
```Scala
case class SimpleBuilding(door: Door,
                          wall: Wall,
                          pillar: Pillar) extends IBuilding {
  def show = println("简约户型")
}

case class LuxuryBuilding(door: Door,
                          wall: Wall,
                          pillar: Pillar) extends IBuilding {
  def show = println("豪华户型")
}
```

这时候我们就需要告诉建筑公司我们的需求：
```Scala
trait IFactoryS {
  def createBuilding(kind: String): IBuilding
}

// 同时修改工厂实例
class ConstructionFactoryS extends IFactoryS {
  def createBuilding(kind: String): IBuilding =  kind match {
    case "Simple" =>   SimpleBuilding(new Door, new Wall, new Pillar)
    case "Luxury" =>   LuxuryBuilding(new Door, new Wall, new Pillar)
  }
}
```
测试
```Scala
object Test2 extends App{
  val iFactory:IFactoryS = new ConstructionFactoryS
  val iBuilding1:IBuilding = iFactory.createBuilding("Simple")
  val iBuilding2:IBuilding = iFactory.createBuilding("Luxury")
  iBuilding1.show()
  iBuilding2.show()
}
```

除了这种方式，Scala 还为我们提供了一种类似构造器的语法 —— `apply`，通过这种方式，我们甚至可以不用写工厂类，只需增加产品类接口的伴生对象：
```Scala
object IBuilding {
  def apply(kind: String): IBuilding = kind match {
    case "Simple" =>   SimpleBuilding(new Door, new Wall, new Pillar)
    case "Luxury" =>   LuxuryBuilding(new Door, new Wall, new Pillar)
  }
}
```
调用者有更好的体验：
```Scala
val iBuilding3:IBuilding = IBuilding("Simple")
val iBuilding4:IBuilding = IBuilding("Luxury")
iBuilding3.show()
iBuilding4.show()
```

严格意义讲，后面这种方法并不属于 GOF 提到的工厂方法，它缺少了工厂模块，我们可以称之为「静态工厂模式」。  

站在 OCP（开放封闭原则）的角度讲，该模式的扩展不够良好，但是却对修改，有着很好的约束。  

总结「静态工厂模式」有以下优点：
- 简化对象创建的 API
- 减少 `new` 关键字对代码的干扰
- 代码更精简优雅

## 总结

以上，不难总结出工厂方法模式中的四种角色：  
- **抽象产品**：它是定义产品的接口，是工厂方法模式所创建对象的超类型，也就是产品对象的公共父类。（ex. 文中 `IBuiiding`)。
- **具体产品**：它实现了抽象产品接口，某种类型的具体产品由专门的具体工厂创建，具体工厂和具体产品之间一一对应。（ex. 文中 `Buiiding`)
- **抽象工厂**: 在抽象工厂类中，声明了工厂方法(`Factory Method`)，用于返回一个产品。抽象工厂是工厂方法模式的核心，所有创建对象的工厂类都必须实现该接口。（ex. 文中 `IFactory`)
- **具体工厂**: 它是抽象工厂类的子类，实现了抽象工厂中定义的工厂方法，并可由客户端调用，返回一个具体产品类的实例。（ex. 文中 `ConstructionFactory`)

以下为 Java 与 Scala 中的实现方式对比：

|   |    Java  |       Scala                   |
| ------------------ | ------------------ | ------------------ |
| 静态工厂方法  |  抽象产品(interface 或 abstract class) + 具体产品 + 抽象工厂（含静态方法)  | 仿 Java  或 抽象产品(trait 或 abstract class) + 具体产品(case class) + 抽象产品伴生类(object apply) |
| 工厂方法  | 抽象产品 + 具体产品 + 抽象工厂 + 具体工厂 | 同 Java |

当然，我们不能为了设计而设计，当类结构简单的时候，我们可以直接使用 `new` 来创造，否则会增加不必要的代码，反而使结构复杂化。工厂方法主要适用以下场景 ：
- 调用者无需知道他所使用的对象的类。  
- 抽象工厂类通过其子类来指定创建哪个对象。  

[源码链接](https://github.com/YarenTang/Design_Patterns_Examples/tree/master/src/Factory)  

如有错误和讲述不恰当的地方还请指出，不胜感激！
