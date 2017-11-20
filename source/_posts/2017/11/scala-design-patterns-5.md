---
title: Scala 与设计模式（五）：Adapter 适配器模式
author: prefert
tags:
- 设计模式
- Java
description: 在开发时，我们经常会遇上一些接口不兼容的问题。
date: 2017-11-20
---

不管你是不是果粉，肯定对 iphone X 都有所耳闻。最近的「掉漆门」和「人脸识别被破解」更是将其推到了风口浪尖上。

<image src="http://om6vvgjw7.bkt.clouddn.com/iphone%20x2.jpg" width="300" height="400"></image>

但是对于我而言，最难以忍受的还是耳机接口被取消这一改变（自 Iphone 7 开始)，你可以想象这样一幅画面：当你开开心心地和小伙伴开着语音吃（song）着（kuai）鸡（di）或者是多人一起上（song）分时——你的电量见底，为了不影响队友（shou）的游戏体验，肯定得充电玩下去。

这时你得面对一个难题：**只有一个孔，插耳机还是插电源！？**（在没有蓝牙耳机的前提下）  

![](http://oznwqhlo5.bkt.clouddn.com/iPhone-X-Home-Button-Audio-Jack-960x540.jpg)(侵删)

由于生活经常会欺骗我们，以及各种环境因素，所以不是每个人都选择蓝牙耳机（贫穷使我理智）。

是否存在别的解决方法呢？还好有转接线这样的好东西

![](http://oznwqhlo5.bkt.clouddn.com/%E8%BD%AC%E6%8E%A5%E7%BA%BF.jpg)(侵删)

在编程中，我们也会遇上类似的问题：
  1. 当你想使用一个已经存在的类，而它的接口不符合你的需求；  
  2. 你想创建一个可以复用的类，该类可以与其他不相关的类或不可预见的类协同工作；  
  3. ...  

本文会通过 Adapter Pattern 来探究如何解决这类问题。

本篇文章结构如下：
- adapter pattern 的概念
- 实际问题分解
- Java 实例
- Scala 实例
- 总结

## 概念  

适配器模式（Adapter Pattern）有时候也称包装样式或者包装（Wrapper）。定义如下：  

> 将一个类的接口转接成用户所期待的。一个适配使得因接口不兼容而不能在一起工作的类能在一起工作，做法是将类自己的接口包裹在一个已存在的类中。

## 它解决了什么问题  
适配器模式将现有接口转化为客户类所期望的接口，实现了对现有类的复用，它是一种使用频率非常高的设计模式，在软件开发中得以广泛应用，在 `Spring` 等框架、驱动程序设计（如 `JDBC` 中的数据库驱动程序）中也使用了适配器模式。  

### Java 版本
小 A 是个苹果控 + 耳机控，之前买了一款很贵的耳机，对其爱不释手。我们都知道一般耳机接口都是 3.5mm 的。

```Java
public interface PhoneJackInterface {
    // 传统的播放音频
    void audioTraditionally();
}

public class PhoneJackConnector implements PhoneJackInterface {
    @Override
    public void audioTraditionally() {
        System.out.println("通过 PhoneJack 播放声音");
    }
}
```

iphone 7 之前的 iphone 支持 3.5mm 接口：
```Java
public class Iphone {
   private PhoneJackInterface phoneJack;

    public Iphone(PhoneJackInterface phoneJack) {
        this.phoneJack = phoneJack;
    }

    // Iphone 具备播放声音的功能
    public void play() {
        // 通过 3.5mm 接口耳机播放
        phoneJack.audioTraditionally();
    }
}
```

这样的情况下，小 A 还可以愉快地听歌：
```Java
// test
PhoneJackInterface phoneJack = new PhoneJackConnector();
Iphone iphone6 = new Iphone(phoneJack);
iphone6.play();
// 控制台输出 “通过 PhoneJack 播放声音”
```

在 iphone 7 问世后，问题出现了：小 A 发现其**不支持 3.5mm 接口 —— 将有线耳机的插口改为了 lightning**。
```Java
public interface LightningInterface {
    void audioWithLightning();
}

public class LightningConnector implements LightningInterface {
    @Override
    public void audioWithLightning() {
        System.out.println("通过 Lightning 播放声音");
    }
}
```

一边是耳机，一边是手机，这太难以抉择了。但苹果怎么可能没考虑到这点了，可以**通过赠送的耳机转接器 —— 将传统的耳机头转为 lightning**：
```Java
public class HeadsetAdapter implements PhoneJackInterface { // 基于传统耳机接口

   LightningInterface lightning; // 兼容新接口

    /**
     * 传入 lightning 接口
     * @param lightning
     */
    public HeadsetAdapter(LightningInterface lightning) {
        this.lightning = lightning;
    }

    /**
     * 对传统接口兼容
     */
    @Override
    public void audioTraditionally() {
        lightning.audioWithLightning();
    }
}
```

### 类适配器
这样不够简洁，我们可以改一改：  
```Java
public class HeadsetAdapter extends LightningConnector implements PhoneJackInterface {
    @Override
    public void audioTraditionally() {
        // 传统接口兼容 lightning
        super.audioWithLightning();
    }
}
```

测试：
```Java
// test
HeadsetAdapter headsetAdapter = new HeadsetAdapter();
Iphone iphone7 = new Iphone(headsetAdapter);
iphone7.play();
// 控制台输出 “通过 Lightning 播放声音”
```

### 对象适配器  
我们一般将上面的适配器称作「类适配器」，除此之外还有一种 「对象适配器」，我们可以对适配器类进行如下修改：
```Java
public class ObjectHeadsetAdapter implements PhoneJackInterface { // 基于传统耳机接口

   LightningConnector lightning; // 兼容新接口

    /**
     * 传入 lightning 接口
     * @param lightning
     */
    public ObjectHeadsetAdapter(LightningConnector lightning) {
        this.lightning = lightning;
    }

    /**
     * 对传统接口兼容
     */
    @Override
    public void audioTraditionally() {
        // 使用委托实现兼容
        this.lightning.audioWithLightning();
    }
}
```

测试：
```Java
ObjectHeadsetAdapter objectHeadsetAdapter = new ObjectHeadsetAdapter(new LightningConnector());
Iphone iphoneX = new Iphone(objectHeadsetAdapter);
iphoneX.play();
```

### 对象适配器 vs 类适配器
通过以上简单的例子，相信你对适配器模式有一个大致了解了。「类适配器」与「对象适配器」的区别概括如下：

| - |  类适配器 | 对象适配器 |
| :--- | :----: | :----: |
| 创建方式 | 需要通过创建自身创建出一个新的 Adapter | 可以通过已有的 Adapter 对象来转换接口 |
| 扩展性    | 通过 Override 来扩展新需求  |  因为包含关系所以不能扩展      |
| 其他  |   继承被适配类，所以相对静态    |  包含被适配类，所以相对灵活   |


### 优点
总的来说，适配器模式主要有以下几个优点：  
1. 将目标类和适配者类解耦，通过引入一个适配器类来重用现有的适配者类，无须修改原有结构。
2. 增加了类的透明性和复用性，将具体的业务实现过程封装在适配者类中，对于客户端类而言是透明的，而且提高了适配者的复用性，同一个适配者类可以在多个不同的系统中复用。  
3. 灵活性和扩展性都非常好，通过使用配置文件，可以很方便地更换适配器，也可以在不修改原有代码的基础上增加新的适配器类，完全符合「开闭原则」。

看完 Java 的实现方式，我们再来看看 Scala 是如何实现的。

### Scala 版本  
在 Scala 中，由于方便的语法糖，我们并不需要像 Java 那样麻烦，已知传统接口类（此处省略一些接口）
```Scala
class PhoneJackConnector {
   def  audioTraditionally = println("通过 PhoneJack 播放声音")
}
```
如果我们有需要适配的，为其创建一个 `trait` 即可:
```Scala
trait Lightning {
  def audioWithLightning()
}
```
其次再新建一个类，继承传统类：
```Scala
class HeadsetAdapter extends PhoneJackConnector with Lightning {
  override def audioTraditionally: Unit = super.audioTraditionally

  override def audioWithLightning: Unit = println("通过 Lightning 播放声音")
}
```
你会开心的发现：在这个新的类里，我们可以对新老方法一起扩展——在 Java 中，这是「对象适配器」和 「类适配器」比较大的一个劣势。  
测试：
```Scala
val headsetAdapter = new HeadsetAdapter
headsetAdapter.audioTraditionally
```

当然，除了这种方式，Scala 里还可以通过隐式转换来实现适配 `final` 类的适配器:
```Scala
final class FinalPhoneJackConector {
    def  audioTraditionally = println("通过 PhoneJack 播放声音")
  }

object FinalPhoneJackConector {
    implicit class ImplictHeadsetAdapter(phoneJackConnector: FinalPhoneJackConector) extends Lightning {
      override def audioWithLightning: Unit =  println("通过 Lightning 播放声音")
    }
}
```

测试：
```Scala
val headsetAdapter = new HeadsetAdapter
headsetAdapter.audioTraditionally

// 隐式
val light: Lightning = new FinalPhoneJackConector
light.audioWithLightning()
```  

> Hint: 对于不熟悉 `implicit` 的朋友可以 [看一下这里](https://docs.scala-lang.org/zh-cn/overviews/core/implicit-classes.html) 

## 总结
光从代码量来说，Scala 简洁比 Java 表现的好太多。  

其次，Scala 结合了「类适配器」和「对象适配器」所有的优点，并消除了自身问题。与 Java 相比，Scala 有如下特点：

1. 与对象适配器一样灵活
2. 与「类适配器相比」，没有对特定被适配类的依赖
3. 只适用于不需要动态改变被适配类的情况

[源码链接](https://github.com/YarenTang/Design_Patterns_Examples/tree/master/src/Adapter)
如有错误和讲述不恰当的地方还请指出，不胜感激！
