---
title: Scala 与设计模式（六）：Bridge 桥接模式
author: prefert
tags:
- 设计模式
- Java
- ~Scala 与设计模式
description: 桥接模式是一种对象结构型模式，又称为柄体(Handle and Body)模式或接口(Interface)模式。
date: 2018-01-08
---

相信大家都玩过「俄罗斯方块」吧。

<center><img src="/images/2018/01/traditional-tetromino.jpg" width="300px"></center>

小罗年幼时最喜欢玩的就是俄罗斯方块。作为一个有情怀的程序员，小罗决定尝试实现这款游戏。

玩过俄罗斯方块的人都会知道，俄罗斯方块由七种简单形状组成：
- I、J、L、O、S、T、Z

<center><img src="/images/2018/01/modern-tetromino.jpg" width="300px"></center>

小罗了然于心，抄起手中的键盘就创建了七个类。

黑色过于单调，所以小罗又选了三种颜色准备为这些方块着色：
- Yellow
- Blue
- Red

要实现这样的需求，最 low 的方法就是**为每种形状创造所有颜色的版本**。

如果采用这种方案，双方之间处于强链接，类之间关联性极强，如要进行扩展，必然导致类结构急剧膨胀：

<center><img src="/images/2018/01/bridge-old-java-design.png" width="600px"></center>

如果仅用继承实现，我们会创造至少 3 * 7 = 21 个类。

当我们想增加 1 种形状（或颜色）的时候，就需要新增 3 （或 7）个类。

**数量爆炸的类 == 差劲的扩展能力 == 爆炸的维护成本**！

从 SOLID 原则来看，以上设计违背了「开放 - 封闭原则」。已知的，在设计类继承的时候，良好的设计应该是保持引起类变化的因素只有一个，也就是所谓的「单一职责原则」。

那有没有环保一点的方式呢？让我们来看看「桥接模式」是怎么解决的。

## 概念

桥接模式的定义比较简洁：

> 把事物对象和其具体行为、具体特征分离开来，使它们可以各自独立的变化。 —— wikipedia

换言之，即 **抽象化与实现化解耦，使得二者可以独立变化**。

根据 GOF 提到的，桥接模式由四部分组成：
1. **抽象类**：定义了一个实现类接口类型的对象并可以维护该对象。
2. **扩充抽象类**：扩充由抽象类定义的接口，它实现了在抽象类中定义的抽象业务方法，在扩充抽象类中可以调用在实现类接口中定义的业务方法。
3. **实现类接口**：定义了实现类的接口，实现类接口仅提供基本操作，而抽象类定义的接口可能会做更多更复杂的操作。
4. **具体实现类**：实现了实现类接口并且具体实现它，在不同的具体实现类中提供基本操作的不同实现，在程序运行时，具体实现类对象将替换其父类对象，提供给客户端具体的业务操作方法。

## Java 实现
在使用桥接模式时，我们首先应该识别出一个类所具有的两个独立变化的维度，将它们设计为两个独立的继承等级结构，为两个维度都提供抽象层，并建立抽象耦合。

即，我们需要根据实际需求对形状和颜色进行组合。

既然是组合，接口肯定是少不了的，先创建颜色接口（**这里也称作「桥接口」**）：
```Java
public interface Color {
    public void drawShape(String type);
}
```

以及各种颜色类：
```Java
public class Red implements Color {
    @Override
    public void drawShape(String type) {
        System.out.println("Red " + type +" is drawn");
    }
}

public class Yellow implements Color {
    @Override
    public void drawShape(String type) {
        System.out.println("Yellow " + type +" is drawn");
    }
}

public class Blue implements Color {
    @Override
    public void drawShape(String type) {
        System.out.println("Blue " + type +" is drawn");
    }
}
```

然后，我们创建最重要的形状抽象类：
```Java
import Bridge.Java.Color.Color;

public abstract class Shape {
    Color color;

    public void setColor(Bridge.Java.Color.Color color) {
        this.color = color;
    }

    public abstract void draw();
}
```

同样创建具体的方块：
```java
public class ShapeI extends Shape {
    @Override
    public void draw() {
        color.drawShape("ShapeI");
    }
}
```

测试：
```Java
Color red = new Red();
Shape shapeI = new ShapeI();
// 红色的 I
shapeI.setColor(red);
shapeI.draw();

// 红色的 L
Shape shapeL = new ShapeJ();
shapeL.setColor(red);
shapeL.draw();
```

以上，我们将「形状」和「颜色」解耦。

![bridge-pattern](/images/2018/01/bridge-pattern-2.png)

Hint: 如果你依旧有所疑惑，请回顾最开始的定义：

> 把事物对象和其具体行为、具体特征分离开来，使它们可以各自独立的变化。

此时，如需添加新的颜色或形状，我们只用实现一个桥接口或者继承一个抽象类即可。

### 优缺点
以上，相信你对桥接模式已经有所了解。

再我们来看看它的优缺点。

**优点**
1. 抽象和实现的分离。
2. 优秀的扩展能力。
3. 实现细节对客户透明。

**缺点**
桥接模式需要建立在你对系统充分的认知下，需要我们识别出两个合理的变化维度，所以适用范围受到限制。

所以你什么时候该使用桥接模式呢？

### 适用场景
1. 正如我们上方的例子，如果一个场景存在两个独立变化的维度，且这两个维度需要频繁扩展或变动时，我们优先考虑桥接模式。

2. 如果一个系统需要在构件的抽象化角色和具体化角色之间增加更多的灵活性，避免在两个层次之间建立静态的继承联系，通过桥接模式可以使它们在抽象层建立一个关联关系。

3. 对于那些不希望使用继承或因为多层次继承导致系统类的个数急剧增加的系统，桥接模式尤为适用。

4. [其他]( https://stackoverflow.com/questions/319728/when-do-you-use-the-bridge-pattern-how-is-it-different-from-adapter-pattern)。

## Scala 实现
在 Scala 中，桥接模式的实现与 Java 大同小异，我们只需将接口关键字改为 `trait`。

颜色接口：
```Scala
trait Color {
   def drawShape(`type`: String)
}
```

颜色类：
```Scala
class Red extends Color{
  override def drawShape(`type`: String) = println(s"Red ${`type`} is drawn")
}

class Blue extends Color{
  override def drawShape(`type`: String) = println(s"Blue ${`type`} is drawn")
}

class Yellow extends Color{
  override def drawShape(`type`: String) = println(s"Yellow ${`type`} is drawn")
}
```

形状抽象类以及实现类：
```Scala
abstract class Shape(color: Color) {
   def draw()
}

class ShapeI(color: Color) extends Shape(color){
  override def draw(): Unit = color.drawShape("ShapeI")
}

class ShapeJ(color: Color) extends Shape(color){
  override def draw(): Unit = color.drawShape("ShapeJ")
}

....
```
也许部分同学会问：这里抽象类可以用 `trait` 代替吗？`trait`扩展性会不会更好？具体还是参考这里吧：[abstract class 比 trait 好在哪里？](https://stackoverflow.com/questions/1991042/what-is-the-advantage-of-using-abstract-classes-instead-of-traits)

测试：
```scala
object Test extends App{
   new ShapeI(new Blue).draw()
   new ShapeJ(new Red).draw()
}
```

## 总结
桥接模式用一种巧妙的方式处理多层继承存在的问题，用抽象关联取代了传统的多层继承，将类之间的静态继承关系转换为动态的对象组合关系，使得系统更加灵活，并易于扩展，同时有效控制了系统中类的个数。在系统设计初期，合理利用桥接模式，会让系统更加优雅。

[源码链接](https://github.com/YarenTang/Design_Patterns_Examples/tree/master/src/Bridge)
如有错误和讲述不恰当的地方还请指出，不胜感激！
