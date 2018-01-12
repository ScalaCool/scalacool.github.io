---
title: Dive Into Kotlin（一）：初探 Kotlin
author: prefert
tags:
- Kotlin
- Android
- ~Dive Into Kotlin
description: 在今年的 Google I/O 大会上，Google 宣布在 Android 上为 Kotlin 提供一等支持（转为正房），本系列文章将会对 Kotlin 进行较为系统的介绍。
date: 2017-11-06
---

在今年的 [Google I/O](https://www.youtube.com/watch?v=Y2VF8tmLFHw) 大会上，Google 宣布在 Android 上为 Kotlin 提供一等支持（转为正房）。  

在 Andorid 开发的圈子中，这无疑掀起了轩然大浪。对部分人来说，也许这是第一次听到 Kotlin 。事实上，在 2011 年 7 月，JetBrains 就推出 Kotlin 项目，直到去年 2 月 Kotlin v1.0 才正式发布。  

<!--more-->

本系列文章「Dive Into Kotlin」将会对 Kotlin 进行较为系统的介绍，大致分为四个章节：  

**1. 热身**  —— Kotlin 基本特性   
**2. 下水**  —— Kotlin 与函数式  
**3. 潜入**  —— Kotlin 核心  
**4. 遨游**  —— kotlin 与 Android 实战

本文将简单介绍 Kotlin 的生态和部分语言功能，目录如下：

 - Kotlin 是一门怎么样的语言
 - 强大的生态圈
 - 基本特征

<!-- toc -->  

## Kotlin 是一门怎么样的语言？  

Kotlin 是一种在 JVM 上运行的静态类型编程语言，可以编译成 Java 字节码，也可以编译成 JavaScript，方便在没有 JVM 的设备上运行。  

### Kotlin 核心的目标

- **简约**：帮你减少实现同一个功能的代码量。  

- **易懂**：让你的代码更容易阅读，同时易于理解。  

- **安全**：移除了你可能会犯错误的功能。  

- **通用**：基于 JVM 和 JavaScript，你可以在很多地方运行。  

- **互操作性**： Kotlin 和 Java 可以相互调用，同时 Jetbrains 的目标是让他们 100% 兼容。  
对比 Java，Kotlin 或许显得有点年轻，但这并不代表它的生态圈不够稳定。

## 强大的生态圈  

**Kotlin 编译为 JVM 字节码或 JavaScript**  
它可以吸引所有使用垃圾回收机制语言的程序员，包括 Java，Scala，Go，Python， Ruby 和 JavaScript。

**kotlin 产自工业，而不是学术界。**  
它解决了程序员目前所面临的一些问题。举个例子：类型系统可以帮助你避免空指针异常。当我们在使用一些 API 或者大型库时判断是否为 null，往往没有什么实际作用。

**Kotlin 完美兼容 Java**  
在 Idea 中，你可以一键实现 Java 与 Kotlin 的转换。也就是说， Kotlin 写的项目中可以使用所有现有的 Java 框架和库，甚至是依赖于注解的高级框架，并且它整合了 Maven，Gradle 和其他构建工具——帮助我们实现无缝的互操作。  

**Kotlin 相对入门简单**  
所以正如大家所说的那样，Kotlin 是一门十分友好的语言，你甚至可以花几个小时阅读下相关书籍就能入门。它的语法简洁直观，也许大多时候看起来比较像 Scala，实际上简单了很多。这种语言很好地平衡了简洁和可读性。

**不施加运行时间的开销**  
标准库是比较小的：主要是对 Java 标准库的重点扩展。大量使用编译时内联（compile-time inlining）就意味着像 `map`、 `filter`、 `reduce` 这样的语法编译起来与命令式的相似。

**Android扩展库**  
[Anko](https://github.com/Kotlin/anko) 与 [kovenant](http://kovenant.komponents.nl/android/features/) 让 Kotlin 在 Android 的开发中更加方便，如果你看过这两个库，一定也为之青睐。

除 Android 外，其实企业级别的 Java 项目也可以考虑使用 Kotlin：  
 1. **它有一个成熟的公司强大的商业支持**，JetBrains 致力于该项目的发展，拥有一支高效的团队和稳定的商业模式。在较长的时间内，你都不用担心 Kotlin 被抛弃。  

 2. **Kotlin 的风险很低**：可以由一两个成员尝试在某个功能块使用，但并不会影响其他模块：Kotlin 类可以导出一个与常规 Java 代码看起来相同的 Java API。

 3. **Java 6 废土中的一线希望**：如果升级 JVM 对于你们的成本很高，你可以使用 Kotlin，它是「加强版的 Java 6」。


看完生态圈，来看看最吸引我们的语言功能部分。

## 特征  

![kotlin&&Android](http://ovib8fj5v.bkt.clouddn.com/kotlin&&android.png)  

#### 属性前置  
Java Bean 中总是出现一些重复工作量的代码：  
```Java  
public class Customer{
  String name;
  int age;

  public Customer(String name, int age){
    this.name=name;
    this.age=age;
  }
  
  public String getName(){
    return name;
  }
  
  public int getAge(){
    return age;
  }
  
  public setName(String name){
    this.name=name;
  }
  public setAge(int age){
   this.age=age;
  }
}
```
在 Java 对象中，构造函数和属性的 `Getter`、`Setter` 函数在每个Bean类中都会出现，看起来非常冗余。  

但是使用 Kotlin，代码是这样的：  
```Kotlin
data class Customer(val name:String, val age:Int)
```
Kotlin 将`Getter`、`Setter` 等函数省略，让我们更加关注属性。

#### 函数式编程是变革的关键   
如果你是一名 「FP」 （Functional Programming） 爱好者，你肯定知道 [Scala](https://zh.wikipedia.org/wiki/Scala)  这门语言。而 Kotlin 的设计初衷就是提供 Scala 里的很多特性，但不被编译时间束缚。  

![FP](http://om6vvgjw7.bkt.clouddn.com/FP.jpg)  

网上对函数式编程的介绍，大多数对初学者都是不够友好的，下面是一种比较简洁的概括：
> 函数编程以基于数学的函数构成，实现一个功能时倾向于实现的目标，而不是实现目标的方式。  

也就是说，函数式编程处理的是不可变的数据，即不会改变变量的值。它所做的只是 Receive（接收）-> Compute（计算）-> Return（返回） ，而不改变它接收到的值，或者引起[「副作用」](https://zh.wikipedia.org/wiki/%E5%87%BD%E6%95%B0%E5%89%AF%E4%BD%9C%E7%94%A8)。  

#### Kotlin 重新定义了函数的写法  
- 简化函数重载。
- 命名参数不遵循顺序：命名参数允许完全控制什么值被传递给变量，并在与布尔处理，举个例子：  

```Java
// Java
void check(boolean isAlpha, boolean isNum){
	// do something
}
check(true, false); // 函数调用

// Kotlin
fun check(isAlpha:Boolean, isNum：Boolean = false) {
   // do something
}
check(true)// 1
check(true,true)// 2
check(isAlpha = true, isNum = false) // 3
check(isNum = false, isAlpha = true) // 4
```
其中1、3、4实际效果一致。

#### 函数可读性  
- 单行表达式是提高代码可读性的第一步。

```Java
// Java
int sum (int x, int y){ // 必须声明返回类型
  x = x + y; // x的值被改变，带来副作用
  return x;
}

// kotlin
fun sum(x: Int, y: Int) = x + y // 完美
```

在 Android 开发时，我们应该都会对视图的 `onClick` 事件感到烦躁。
```Java
// Java
view.setOnClickListener(new View.OnClickKistener() {
  @ Override
  public void onClick(View v){
    System.out.println("sad");
  }
});
```
在 kotlin 中，这也得到简化：
```Kotlin
view.onClick {
  println("nice !!")
}
```

#### 类型安全
在 Android 开发中，出现 `NullPointerException` 已经可以说是家常便饭了。但如果在运行的时候出现这个异常导致程序崩溃，对用户体验造成的损失是巨大的。  

Kotlin 能很好的避免这个问题：  
- 指定 null  
```Java
// Java
String text1 = null // NE  

// Kotlin
var text1: String = "Kotlin"// 正常
var text2: String = null // NE
var text3: String ?= null // 正常
```

**Kotlin 中只有加了 `?` 才允许为 null。**  

- 检查 null
Kotlin 可以通过 `?`确保安全调用：
```Java
// Java
if（a != null）{
  int x = a.length（）;
}
// Kotlin
val x = a?.length // 仅当 a 不为 null 时才能通过编译
```

- 为 null 时默认值  
```Java
val x = b?.length ?: 0 // 如果 b 为 null，那他的 length 就为0
val x = b?.length ?: throw NullPointerException()
val x = b!!.length    
```

#### Lambda 优化
Lambda 表达式增加了 Kotlin 的简洁功能，从而也让代码更容易理解。(Java 6 不支持 lambda )
```Kotlin
val sum = {x: Int, y: Int -> x + y} // 类型:（Int, Int） -> Int
val result = sum（2, 7）// result == 9
```

#### 条件判断更优雅
kotlin 中 `when` 同样能带给你惊喜，你可以用它简化 `if..else` 或 `switch`：
```Java
// Java
if(x == 1) println("x is 1");
else if(x == 2) println("x is 2");
else if(x == 3 || x == 4) println("x is 3 or 4");
else if(x >= 5 || x <= 10) println("x is 5, 6, 7, 8, 9, or 10");
else println("x is out of range");

// Kotlin
when (x) {
  1 -> print("x is 1")
  2 -> print("x is 2")
  3, 4 -> print("x is 3 or 4")
  in 5..10 -> print("x is 5, 6, 7, 8, 9, or 10")
  else -> print("x is out of range")
}
```

当然除了以上这些，Kotlin 还有许多令人惊喜的特性，将会在后续的文章中详细介绍，敬请期待。  
