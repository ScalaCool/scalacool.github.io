---
title: Scala 与设计模式（三）：Prototype 原型模式   
author: Prefert 
tags: 
- 设计模式
- Java
description: 原型模式（Prototype Pattern）是创建型模式的一种,其特点在于通过「复制」一个已经存在的实例来返回新的实例,而不是新建实例。被复制的实例就是我们所称的「原型」，这个原型是可定制的。
date: 2017-07-31 11:20
---

第一个细胞是怎么形成的？  第一个生物又是怎么诞生的？ 抛开宗教信仰，我们从科学角度进行推测：第一个细胞应该是由核糖核酸(RNA)不断的新陈代谢演变而来的。
说的轻松，但事实并不那么简单，据说第一个生物是 36 亿年前诞生的，而人类三千多万年前才出现...

如果每个细胞都需要从无机物开始演变，估计在地球毁灭的时候人类也还没出现。幸好在第一个细胞非常孤独的时候，掌握了「分裂」与「分化」的本领：一定条件下可以一分为二，新生细胞还能出现新的特征。

在开发过程中，我们也常有类似的场景，本文将以细胞分裂为例来介绍原型模式。

## 定义
 「四人帮」设计模式中提及的 原型模式 定义如下：
> 用原型实例指向创建对象的种类，并且通过拷贝这些原型创建新的对象。

从定义中我们可以知道，原型模式中核心点就是 **原型类** 和 **拷贝** 。

看到拷贝，有些同学脑中可能会浮现下面这张图：
<center><img src="http://om6vvgjw7.bkt.clouddn.com/1473308168_167070.png" width="400px"></img></center>  

## Java 实现
看完一些概念我们回过头来看文章开始的例子，假设细胞没有分裂能力，如果想再获得一个类似的细胞，只能模拟第一个细胞的环境，并且还要经历相同的时间才能得到，这无疑是费时费力的。克隆解决这个问题，那 Java 是否有类似的能力呢？
学过 Java 的同学都知道，所有的 `class` 都继承自 `java.lang.Object` 类。事实上，`Object` 类提供一个 `clone()` 方法，我们通过该方法，就能实现对象的拷贝。

#### 浅拷贝
通过实现 `Cloneable` 接口，我们来实现细胞的克隆：
```Java
public class Cell implements Cloneable {
    private String dna;
    private Organelle organelle; // 细胞器

    ... // 省略 get set 与 构造函数

    @Override
    public String toString() {
        return "Cell: {" +
                "DNA = " + dna + '\'' +
                "Organelle = " + organelle.toString() +
                '}';
    }

    @Override
    public Cell clone() {
        Cell cellCopy = null;
        try {
            cellCopy = (Cell) super.clone();
        } catch (CloneNotSupportedException e) {
            e.printStackTrace();
        }
        return cellCopy;
    }
}

public class Organelle {
    private String cytoplasm; // 细胞质
    private String nucleus; // 细胞核

    ...// 省略get、set、toString() 与构造函数
}
```
通过实现 `Cloneable` 接口我们便能调用 `clone()` 方法轻松实现分裂的功能。在开发的时候我们就能够轻松实现复杂对象的拷贝。

测试代码如下
```Java
Cell cellA, cellB;

cellA = new Cell("AAAGTCTGAC", new Organelle("细胞质", "细胞核"));
System.out.println(cellA);

cellB = cellA.clone();
System.out.println(cellB);

System.out.println("cellA == cellB ? " + (cellA == cellB));
System.out.println("cellA-class == cellB-class? :" + (cellA.getClass() == cellB.getClass()));
```
但是这样并不能应对所有情况：当细胞之前存在某种联系时，我们通过上面的 `clone` 方式只能拷贝到细胞本身的信息，但是不拷贝细胞中的引用，导致不同细胞中包含的细胞器是一样的。既然讲到拷贝，顺势我们回顾一下 Java 中「深拷贝」 和 「浅拷贝」 的基本概念：

- **浅拷贝**
  仅仅复制原有对象的值，而不复制它对其他对象的引用。

- **深拷贝**
  原有对象的值和引用都被复制。

我们可以测试一下：
```Java
System.out.println("cellA.Organelle == cellB.Organelle ? " + (cellA.getOrganelle() == cellB.getOrganelle()));
```
输出
```
cellA.Organelle == cellB.Organelle ? true
```
可见，当前 `clone()` 方法执行的是浅拷贝，Java 中所有的对象都是保存在堆中，而堆是供全局共享的。也就是说，只要能拿到某个对象的引用，引用者就可以随意的修改对象的内部数据，这显然是不好的。接下来我为大家介绍一下深拷贝如何实现。

#### 深拷贝
说到深拷贝的实现，一般有两种实现方案：  

**1. 改变 `clone` 方法实现深拷贝**  

既然细胞内部的细胞器（`Organelle`）的引用没有被复制，我们可以手动添加上。  

首先给 `Organelle` 实现 `Cloneable` 接口：
```Java
public class Organelle implements Cloneable {
  ... // 省略相同代码

  @Override
   protected Object clone() throws CloneNotSupportedException {
       Object object = null;
       try {
           object = super.clone();
       } catch (CloneNotSupportedException e) {
           e.printStackTrace();
       }
       return object;
   }
```

然后我们就可以在 `Cell` 类的 `clone()` 方法中复制细胞器的引用：
```Java
    @Override
    public Cell clone() throws CloneNotSupportedException {
        Cell cellCopy = null;

        try {
            cellCopy = (Cell) super.clone();
        } catch (CloneNotSupportedException e) {
            e.printStackTrace();
        }

        if (cellCopy != null) {
            cellCopy.organelle = (Organelle) organelle.clone();
        }
        return cellCopy;
    }
```

测试结果：
```
cellA.organelle == cellB.organelle ? false
```
虽然能实现，但是想想每一个引用的对象都重写 `clone()` ，太糟糕了！

**2. 通过将对象序列化实现深拷贝**  
 序列化就是将对象写到流的过程，写到流中的对象是原有对象的一个拷贝，而原对象仍然存在于内存中。
 与 `Cloneable` 实现类似，我们要给需要序列化的类实现序列化接口。
```Java
public class Organelle implements Serializable { ... }
public class Cell implements Serializable {
  ... // 省略部分代码

  // 序列化实现深拷贝
  public Cell deepClone() throws CloneNotSupportedException, IOException, ClassNotFoundException {
    // 序列化（将对象写入流中）
    ByteArrayOutputStream bos=new  ByteArrayOutputStream();
    ObjectOutputStream oos=new  ObjectOutputStream(bos);
    oos.writeObject(this);

    // 反序列化（将对象从流中取出）
    ByteArrayInputStream bis=new  ByteArrayInputStream(bos.toByteArray());
    ObjectInputStream ois=new  ObjectInputStream(bis);
    return  (Cell)ois.readObject();
  }

}
```

 > 注意：Cloneable 与 Serializable 接口都是 「marker Interface」，即它们只是标识接口，没有定义任何方法。

序列化的实现方式不需要重写多个类的 `clone()` 方法，比之前一种方法更加简便。接下去让我们看看 Scala 中是如何实现原型模式的。

## Scala 实现
在 Scala 中，你用类似 Java 的方式来实现(Scala 提供了调用 Java 中 `Cloneable` 和 `Serializable` 的特质)
```Scala
trait Cloneable extends java.lang.Cloneable

trait Serializable extends Any with java.io.Serializable
```
当然，Scala 还提供了一个便捷的方法：每个 `case class` 都拥有一个 `copy()` 方法，它会返回一个克隆自原有实例的新实例，并且可以在复制的过程中改变一些值。同样的我们还是以细胞为例：
```Scala
case class Cell(dna: String, organelle: Organelle)

case class Organelle(cytoplasm: String, nucleus: String)
```

然后，可以测试一下：  
```Scala
val initialCell = Cell("AAAGTCTGAC", Organelle("细胞质", "细胞核"))
val cell1 = initialCell.copy()
val cell2 = initialCell.copy()
val cell3 = initialCell.copy(dna = "1234") // 可以在拷贝的时候重新赋值
System.out.println(s"cell1: ${cell1}")
System.out.println(s"cell2: ${cell2}")
System.out.println(s"cell3: ${cell3}")
System.out.println(s"cell1 and cell2 are equal: ${cell1 == cell2}")

// 输出
Cell 1: Cell(AAAGTCTGAC,Organelle(细胞质,细胞核))
Cell 2: Cell(AAAGTCTGAC,Organelle(细胞质,细胞核))
Cell 3: Cell(1234,Organelle(细胞质,细胞核))
cell1 and cell2 are equal: true
```
对比 Scala 和 Java 的实现代码，有没有发现 Scala 是如此的简洁。
这里你可能会疑惑为什么 `cell1` 等于 `cell2` ，`copy`方法到底是深拷贝还是浅拷贝？答案是浅拷贝，但是 `case class` 参数默认为 `val`，这样我们就不用担心两个对象持有相同引用。

## 总结
通过以上例子，相信你应该对原型模式有一定的了解，一般来说原型模式中参与者有以下三类： 
- 抽象原型类：声明克隆方法的接口，是所有具体原型类的公共父类，可以是抽象类也可以是接口，甚至还可以是具体实现类（对应上面的 `Cloneable` 和 `Serializable` 接口）。
- 具体原型类：实现抽象原型类声明的克隆方法，返回自己的一个克隆对象(`Cell.class` | `Cell.class`)。
- 客户类：创建对象并克隆（`Test.class`）。

以下为 Java 与 Scala 中的实现方式对比：
| 拷贝方式 |                   Java                 |                  Scala                   |
| :--: | :--------------------------------------: | :--------------------------------------: |
| 浅拷贝  |           具体原型类实现 `Cloneable`            | 具体原型类实现 `Cloneable`  或    具体原型类为 `case class` |
| 深拷贝  | 具体原型类 + 引用类实现 `Cloneable` 或  `Serializable` | 具体原型类 + 引用类实现 `Cloneable` 或  `Serializable` |

当然原型模式通常还可以解决以下问题： 
- 创建新对象成本较大（如初始化需要占用较长的时间，占用太多的 CPU 资源或网络资源），新的对象可以通过原型模式对已有对象进行复制来获得，如果是相似对象，则可以对其成员变量稍作修改。
- 如果系统要保存对象的状态，而对象的状态变化很小，或者对象本身占用内存较少时，可以使用原型模式配合备忘录模式来实现。

[源码链接](https://github.com/YarenTang/Design_Patterns_Examples/tree/master/src/Prototype)  
如有错误和讲述不恰当的地方还请指出，不胜感激！