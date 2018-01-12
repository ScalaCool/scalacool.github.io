---
title: Scala 与设计模式（四）：Factory 工厂模式
author: Prefert
tags:
- 设计模式
- Java
- ~Scala 与设计模式
- ^Prefert
description: 工厂模式（Factory Pattern）是一种实现了「工厂」概念的面向对象设计模式。就像其他创建型模式一样，它也是处理在不指定对象具体类型的情况下创建对象的问题。
date: 2017-08-22
---

在中国历史上，房子常常与当下一样稀缺，住房问题同样是一个让百姓苦恼的社会热点。

在拆违章建筑还不盛行的年代，我们可以选择在深山老林里自己修建住所。在 Java 中可能是这样实现的：
```Java
class BuildingA {
    private String name;

    public BuildingA(String name) {
        this.name = name;
    }

    public void build() {
        System.out.println(name + " is building");
    }
}

class BuildingB {
    private String name;

    public BuildingB(String name) {
        this.name = name;
    }

    public void build() {
        System.out.println(name + " is building");
    }
}

// 使用
  BuildingA buildingA = new BuildingA("bedroom");
  BuildingB buildingB = new BuildingB("kitchen");
  buildingA.build();
  buildingB.build();
```

村里的牛大哥在建完两间房子之后，后知后觉：自己想要的房间格局不同，但是风格得相同，可以把公共的部分抽离出来：
```Java
interface IBuilding {
    void build();
}

abstract class AbstractBuilding implements IBuilding {
    protected void buildCommon(){
        System.out.println("Europe style"); // 公共的部分
    }
}

 class BuildingAs extends AbstractBuilding {
    private String name;
    public BuildingAs(String name){
        this.name = name;
    }
    @Override
    public void build() {
        this.buildCommon();
        System.out.println(name + " is building");
    }
}

 class BuildingBs extends AbstractBuilding {
    private String name;
    public BuildingBs(String name) {
        this.name = name;
    }

    @Override
    public void build() {
        this.buildCommon();
        System.out.println(name + " is building");
    }
}

// 使用
BuildingAs buildingA = new BuildingAs("bedroom");
BuildingBs buildingB = new BuildingBs("kitchen");
buildingA.build();
buildingB.build();
```
但是这么做之后，牛大哥发现在建造的时候并没有省力，他向村口的王师傅请教，为什么我考虑了很多反而没什么作用呢？

## 简单工厂模式

王师傅告诉他：虽然你找出了一些公共的流程，但在实际建造过程中，你还是完整的过了所有的流程（构造方法不同，每次都要 `new` 对象）。另外，

另外，你对房屋的需求并不多，所以优势不够明显。

说着掏出一个宝盒，盒子里有很多设计图：下次你可以委托我来造一些组件（不再需要自己 `new`）：
```Java
public class SimpleFactory {
    public static IBuilding getProduct(String name){
        if("bedroom".equals(name)){
            return new BuildingA(name);
        }else if("kitchen".equals(name)){
            return new BuildingB(name);
        }else{
            throw new IllegalArgumentException();
        }
    }
}

// 使用
IBuilding buildingA =  SimpleFactory.getProduct("bedroom");
IBuilding buildingB =  SimpleFactory.getProduct("kitchen");
buildingA.build();
buildingB.build();
```
王师傅帮助下的牛大哥在后面的建造中感觉轻松多了。

这就是「简单工厂模式」，也称作「静态工厂方法模式」。

#### 优点

它有以下几个优点：
- 简化对象创建的 API
- 减少 new 关键字对代码的干扰
- 代码更精简优雅

而牛二哥明显没有那么幸运，他的妻子追求个性，并且很善变，总是在建造过程中更改需求。

#### 缺点  

虽然牛二哥也去王师傅那获取组件，每次王师傅都要拿出他的宝盒，在里面翻一遍，再告诉牛二哥 —— 这个我不会造。站在 OCP（开放封闭原则）的角度讲，该模式的扩展不够良好，每次有新的模型后都要修改工厂。

## 工厂方法模式  

老王师傅也经不起折腾，想着不能闭关锁国，就把自己会建造的组件贴在显眼的地方，有新的组件直接加在上面就好：
```Java
interface IFactory {
    public IBuilding createBuilding();
}

class FactoryA implements IFactory{

    @Override
    public IBuilding createBuilding() {
      // 可以进行复杂的处理，每一种方法对应一种模型
        return new BuildingA("bedroom");
    }
}

class FactoryB implements IFactory{

    @Override
    public IBuilding createBuilding() {
        return new BuildingA("kitchen");
    }
}

class FactoryC implements IFactory{

    @Override
    public IBuilding createBuilding() {
        return new BuildingA("restroom");
    }
}

// 使用
FactoryA factoryA = new FactoryA();
FactoryB factoryB = new FactoryB();
FactoryC factoryC = new FactoryC();
factoryA.createBuilding();
factoryB.createBuilding();
factoryC.createBuilding();
```
这样大家的沟通是方便了很多，而且老王也不用每次都搜一遍传家宝盒。

这种模式被 GOF 称作「工厂方法模式」。

#### 定义

工厂方法模式（Factory Method Pattern）是一种实现了「工厂」概念的面向对象设计模式。就像其他创建型模式一样，它也是 **处理在不指定对象具体类型的情况** 下创建对象的问题。定义如下：

> 定义一个用于创建对象的接口，让子类决定实例化哪一个类。Factory Method 使一个类的实例化延迟到其子类。  — 《设计模式》 GOF

从以上也可看出：**工厂做的事很简单 —— 封装内部的实现细节**。

#### 优点
它可以带来以下好处：
1. **降低耦合度**。在工厂方法模式中，工厂方法用来创建用户所需要的产品，同时还向用户隐藏了哪种具体产品类将被实例化这一细节，用户只需要关心所需产品对应的工厂，无须关心创建细节，甚至无须知道具体产品类的类名。
2. **良好扩展性**。需要新的产品类型时，只需要新增一个工厂类，不需要更改产品以及产品的接口以及用户的使用方式。
3. **代码结构清晰**。用户使用时不需要构造内部结构，直接调用工厂方法即可。

#### 缺点
我们可能会遇上以下问题：
1. 增加使用成本。使用工厂模式的时候一般都会采用接口或者抽象类，有时还会涉及到反射、DOM 等方式。
2. 增加系统复杂度（影响不显著）。一个工厂类对应一个产品，所以增加产品类的时候就需要增加工厂类。

工厂方法模式针对的是一个产品等级结构，当要处理多个产品等级结构时（ex. 建立不同小区，小区里有不同楼宇，楼里还有不同户型），我们不希望对每个模型都建立一个工厂，这太糟糕了，来看看「抽象工厂模式」是如何解决的。

## 抽象工厂模式

#### 定义

>为创建一组相关或相互依赖的对象提供一个接口，而且无需指定他们的具体类。

我们也可把「一组相关或相互依赖的对象」称作「产品族」。

利用抽象工厂，我们可以这么写：
```Java
interface IBuildingA {
    void buildA();
}

interface IBuildingB {
    void buildB();
}

interface IFactory {
    public IBuildingA createBuildingA();
    public IBuildingB createBuildingB();
}

class BuildingA implements IBuildingA {
    ... // 省略构造函数
    @Override
    public void buildA() {
        System.out.println((name + "is building"));
    }
}

class BuildingB implements IBuildingB {
    ... // 省略构造函数
    @Override
    public void buildB() {
        System.out.println(name + " is building");
    }
}

class Factory implements IFactory{
    @Override
    public IBuildingA createBuildingA() {
        return new BuildingA("big bedroom");
    }

    @Override
    public IBuildingB createBuildingB() {
        return  new BuildingB("small bedroom");
    }
}

// 测试
Factory factory = new Factory();
factory.createBuildingA();
factory.createBuildingB();
```
我们可以直接在一个工厂类中实现多个方法，这样不用管理多个工厂，使用和管理起来都更方便。

如果说工厂方法解决问题的方式是「广搜」，那抽象工厂亦可看作「深搜」。

#### 总结
以上，我们使用到了三种设计模式：**简单工厂(静态工厂方法)**、**工厂方法**、**抽象工厂**。
在三种模式中，我们要做的都是**将工厂的初始化与构造分离**。

虽然比起直接 `new` 要增加不少代码，但在后期维护的时候，能给我们提供很多的便利。

看完 Java 版本，我们再来看看 Scala 是如何实现的。
## Scala 实现
在 Scala 中，依旧可以用类似 Java 的方式来实现，只用把 Java 中的关键字 `interface` 换成 `trait` 即可，直接看代码吧。

#### 简单工厂模式
```Scala
trait IBuilding {
  def show()
}

case class SimpleBuilding(name: String)extends IBuilding {
  def show = println("SimpleBuilding " + name + " is building")
}

case class LuxuryBuilding(name: String) extends IBuilding{
  def show = println("LuxuryBuilding " + name + " is building")
}

object ConstructionFactory  {
  def createBuilding(kind: String): IBuilding =  kind match {
    case "Simple" =>   SimpleBuilding("Simple")
    case "Luxury" =>   LuxuryBuilding("Luxury")
  }
}

object Test extends App {
  val simpleBuilding: IBuilding = ConstructionFactory.createBuilding("Simple")
  val luxuryBuilding: IBuilding = ConstructionFactory.createBuilding("Luxury")
  simpleBuilding.show()
  luxuryBuilding.show()
}
```
除了这种方式，Scala 还为我们提供了一种类似构造器的语法 —— `apply`，通过这种方式，我们可以省略工厂类，只需增加产品类接口的伴生对象：
```Scala
object IBuilding {
  def apply(kind: String): IBuilding = kind match {
    case "Simple" =>   SimpleBuilding("Simple")
    case "Luxury" =>   LuxuryBuilding("Luxury")
  }
}
```
调用者有更好的体验：
```Scala
val simpleBuilding: IBuilding = IBuilding("Simple")
val luxuryBuilding: IBuilding = IBuilding("Luxury")
simpleBuilding.show()
luxuryBuilding.show()
```
严格意义讲，这种方法并不属于 GOF 提到的工厂方法，它缺少了工厂模块，我们可以称之为「静态工厂模式」。  

工厂方法与抽象工厂的实现与 Java 类似，代码就不贴出来了。不了解 Scala 的同学可以参考[源码](https://github.com/YarenTang/Design_Patterns_Examples/tree/master/src/Factory)  

## 总结  

#### 内部组成
以上，不难总结出工厂模式中的四种角色（简单工厂模式中没有抽象工厂）：  
- **抽象产品**：它是定义产品的接口，是工厂方法模式所创建对象的超类型，也就是产品对象的公共父类。（ex. 文中 `IBuiiding`)。
- **具体产品**：它实现了抽象产品接口，某种类型的具体产品由专门的具体工厂创建，具体工厂和具体产品之间一一对应。（ex. 文中 `Buiiding`)
- **抽象工厂**: 在抽象工厂类中，声明了工厂方法(`Factory Method`)，用于返回一个产品。抽象工厂是工厂方法模式的核心，所有创建对象的工厂类都必须实现该接口。（ex. 文中 `IFactory`)
- **具体工厂**: 它是抽象工厂类的子类，实现了抽象工厂中定义的工厂方法，并可由客户端调用，返回一个具体产品类的实例。（ex. 文中 `ConstructionFactory`)

#### 适用场景
当然，我们不能为了设计而设计，当类结构简单的时候，我们可以直接使用 `new` 来创造，否则会增加不必要的代码，反而使结构复杂化。

所有工厂模式适用场景类似：**调用者无需知道他所使用的对象的类**（实际上内部结构对调用者是透明的 ex. 简单工厂）。

但还是有所差异，以下为个人理解：

| 名称           | 适用场景       |
|:-------------|:-------------|
| 简单工厂     | 1. 工厂类负责创建的对象比较少 <br> 2. 客户只知道传入工厂类的参数，对于如何创建对象（逻辑）不关心 |
| 工厂方法  |  工厂类负责创建的对象复杂, 且内部对象层级关系比较简单    |
| 抽象工厂 | 工厂类负责创建的对象复杂, 且内部对象层级关系比较复杂      |

[源码链接](https://github.com/YarenTang/Design_Patterns_Examples/tree/master/src/Factory)  

如有错误和讲述不恰当的地方还请指出，不胜感激！
