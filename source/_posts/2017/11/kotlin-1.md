---
title: Dive Into Kotlin（二）：Kotlin 类型结构设计
author: prefert
tags:
- Kotlin
- Android
- ~Dive Into Kotlin
description: 类型系统在各种语言之间存在比较大的差异。最主要的差异存在于编译时期的语法，以及运行时期的操作实现方式。本文将为你介绍 Kotlin 中的类型结构设计。
date: 2017-12-01
---

无论在静态语言还是动态语言中，「类型系统」都起到了至关重要的作用。

# 一、类型系统简介

> 在计算机科学中，类型系统用于定义如何将编程语言中的数值和表达式归类为许多不同的类型，如何操作这些类型，这些类型如何互相作用。  

> 类型可以确认一个值或者一组值具有特定的意义和目的（虽然某些类型，如抽象类型和函数类型，在程序运行中，可能不表示为值）。

## 类型系统的作用

类型系统在各种语言之间存在比较大的差异。最主要的差异存在于编译时期的语法，以及运行时期的操作实现方式。我们可以简单理解为两个部分：

- 一组基本类型构成的PTS（Primary Type Set，基本类型集合）；
- PTS上定义的一系列组合、运算、转换规则等。

但是他们的目的都是一致的：

**1. 安全**。有了类型系统以后就可以实现类型安全，这时候程序就变成了一个严格的数学证明过程，编译器可以机械地验证程序某种程度的正确性，从而杜绝很多错误的发生。比如：Scala、Java。但是 JavaScript 等动态语言/弱类型语言就要借助其他插件（如 ESLint）来提示语法等错误。

**2. 抽象能力**。在安全的前提下，一个强大的类型系统的标准是抽象能力，能将程序中的很多东西纳入安全的类型系统中进行抽象，这在安全性的前提下又不损耗灵活性，甚至性能也能很优化。动态语言的抽象能力可以很强，但安全性和性能就不行了。泛型、高阶函数（闭包）、类型类、`Monad`、`Lifetime`（Rust） 属于这一块。

**3. 工程能力**。一个强类型的编程语言比动态类型的语言更适合大规模软件的构建，哪怕不存在性能问题，但是同样取决于前两点。

> Hint: 想深入了解类型系统的朋友可以参考 [《Type Systems》](http://www.cs.colorado.edu/~bec/courses/csci5535/reading/cardelli-typesystems.pdf)和 [《Types and Programming》](http://www.ling.ohio-state.edu/~pollard.4/type/books/pierce-tpl.pdf)

Kotlin 作为一门静态类型编程语言，同样拥有着强大的类型系统。

![Kotlin types](/images/2017/11/kotlin-types.png)
# 二、Kotlin 的类型系统  

你可能会对类型后面的 `?` 产生疑问，那我们就先来看看 Kotlin 中的可空类型。  

## 可空类型(Nullable Types) —— `Int？` `Boolean？` 及其他
许多编程语言中最常见的陷阱之一是访问空引用的成员，导致空引用异常。在 Java 中，这被称作 `NullPointerException` 或简称 `NPE`。

Kotlin 的类型系统旨在从我们的代码中消除 `NullPointerException`。

NPE 发生的原因可能是
- 显式调用 `throw NullPointerException()；`
- 使用 `!!` 操作符(要求抛出 `NullPointerException`)
- 外部 Java 代码导致
- 初始化时有一些数据不一致（如一个未初始化的 this 用于构造函数的某个地方）。

与 Java 不同，Kotlin 区分非空（non-null）和可空（nullable）类型。到目前为止，我们看到的类型都是非空类型，Kotlin 不允许 null 作为这些类型的值。访问非空类型的变量将永远不会抛出空指针异常。

**由于 `null` 只能被存储在 Java 的引用类型的变量中，所以在 Kotlin 中基本数据的可空版本都会使用该类型的包装形式。**

同样的，如果你用基本数据类型作为泛型类的类型参数，Kotlin 同样会使用该类型的包装形式。

我们可以在任何类型后面加上`？`，比如`Int?`，实际上等同于`Int? = Int or null`，通过合理的使用，我们能够简化很多判空代码。并且我们能够有效规避 `NullPointerException` 导致的崩溃。

### 深入 Nullable Types
接下去让我们看看，非空的原理到底怎么样的。

对于以下一段 Kotlin 代码：
```Kotlin
fun testNullable1(x: String, y: String?): Int {
    return x.length
}

fun testNullable2(x: String, y: String?): Int? {
    return y?.length
}

fun testNullable3(x: String, y: String?): Int? {
    return y!!.length
}
```

我们利用 Idea 反编译后，产生的 Java 代码如下：
```Java
public final class NullableTypesKt {
   public static final int testNullable1(@NotNull String x, @Nullable String y) {
      Intrinsics.checkParameterIsNotNull(x, "x"); // 如果为 null， 抛出异常
      return x.length();
   }

   @Nullable
   public static final Integer testNullable2(@NotNull String x, @Nullable String y) {
      Intrinsics.checkParameterIsNotNull(x, "x");
      return y != null?Integer.valueOf(y.length()):null;
   }

   @Nullable
   public static final Integer testNullable3(@NotNull String x, @Nullable String y) {
      Intrinsics.checkParameterIsNotNull(x, "x");
      if(y == null) {
         Intrinsics.throwNpe();
      }

      return Integer.valueOf(y.length());
   }
}
```
可以看到，在不可空变量调用函数之前，都使用 `kotlin.jvm.internal.Intrinsics` 类里面的 `checkParameterIsNotNull` 方法检查是否为 `null`，如果是 `null` 则抛出异常：
```Java
public static void checkParameterIsNotNull(Object value, String paramName) {
    if (value == null) {
        throwParameterIsNullException(paramName);
    }
}
```
基于可空类型，Kotlin 才拥有很多促使安全的运算符。
### `?.` —— 安全调用  

`?.`允许我们把一次 `null` 检查和一次方法的调用合并成一个操作，比如：

`str?.toUpperCase()` 等同于 `if (str != null) str.toUpperCase() else null`

当然，`?.` 同样可以处理属性：

```Kotlin
class User(val nickname: String, val master: User?)
fun masterInfo(user: User): String? = user.master?.nickname

// test
val ceo = User("boss", null)
val employee = User("employee-1", ceo)
println(masterInfo(employee)) // boss
println(masterInfo(ceo)) // null
```

### `?:` —— Elvis 运算符

刚开始我也不知道为什么称之为「Elvis 」运算符——直到我看到了这张图...

![elvis](/images/2017/11/elvis.png)</center>

如果你不喜欢这个名字，我们也可以叫它——「null 合并运算符」。如果你学习过 Scala，这类似于 `getOrElse`:

```Kotlin
fun getOrElse(str: String?) {
  val result: String = str ?: "" // 等价于 str == null ? "" : str
}
```

另外还有`as?`（安全转换）、`!!`（非空断言）、`let`、`lateinit`（延迟初始化属性）等此处就不详细介绍。


## 基本数据类型 —— `Int`, `Boolean` 及其他

我们都知道，Java 将 **基本数据类型** 和 **引用类型** 做了区分：
- 基本数据类型，例如 int 的变量直接存储了它的值，我们不能对这些值调用方法，或者把它们放到集合中。
- 引用类型的变量存储的是指向包含该对象的内存地址的引用。

**在 Kotlin 中，并不区分基本数据类型和包装类型 —— 你使用的永远是同一个类型**。

### 数字转换
Kotlin 中我们必须使用 **显示转换** 来对数字进行转换，例：
```Kotlin
fun main(args: Array<String>) {
  val z = 13
  println(z.toLong() in list(9L, 5L, 2L))
}
```
如果觉得这种方式不够简便，你也可以尝试使用 Kotlin 中的字面量：
- 使用后缀 `L` 表示 `Long`: `123L`
- 使用后缀 `F` 表示 `Float`: `.123f`、`1e3f`
- 使用前缀 `0x` / `0X` 表示十六进制：`0xadcL`  
- ...

**当你使用字面量去初始化一个类型已知的变量，或是把字面量作为实参传给函数时** ，会发生隐式转换，并且算数运算符会被重载。
例：
```Kotlin
fun long(l: Long) = println(1)

fun main(args: Array<String>) {
  val b: Byte = 1 // Int -> Byte
  val l = b + 1L // 重载 plus 运算符
  foo(234)
}
```

## 通用类型系统 —— `Any`, `Any?`  
和 `Object` 作为 Java 类层级结构的顶层类似，`Any` 类型是 Kotlin 中 **所有非空类型**（ex: `String`, `Int`) 的顶级类型——超类。

<center>![Kotlin types](/images/2017/11/kotlin-top-1.png)</center>

与 Java 不同的是： Kotlin 不区分「原始类型」（primitive type）和其它的类型。它们都是同一类型层级结构的一部分。

如果定义了一个没有指定父类型的类型，则该类型将是 `Any` 的直接子类型:
```Kotlin
class Fruit(val weight: Double)
```
<center>![Kotlin types](/images/2017/11/kotlin-top-2.png)</center>  

如果你为定义的类型指定了父类型，则该父类型将是新类型的直接父类型，但是新类型的最终祖先为 `Any`。

```Kotlin
abstract class Fruit(val weight: Double)

class Banana(weight: Double, val size: Double): Fruit(weight)
class Peach(weight: Double, val color: String): Fruit(weight)
```
<center>![Kotlin types](/images/2017/11/kotlin-top-3.png)</center>  

如果你的类型实现了多个接口，那么它将具有多个直接的父类型，而 `Any` 同样是最终的祖先。  

```Kotlin
interface ICanGoInASalad
interface ICanBeSunDried
class Tomato(weight: Double): Fruit(weight), ICanGoInASalad, ICanBeSunDried
```

<center>![Kotlin types](/images/2017/11/kotlin-top-4.png)</center>

Kotlin 的 Type Checker 强制执行父子关系。

例如:
你可以将子类型值存储到父类型变量中：  
```Kotlin
var f: Fruit = Banana(weight = 0.1)
f = Peach(weight = 0.15)
```

但是你不能将父类型值存储到子类型变量中：
```Kotlin
val b = Banana(weight=0.1)
val f: Fruit = b
val b2: Banana = f
// Error: Type mismatch: inferred type is Fruit but Banana was expected
```
正好也符合我们的日常理解：“香蕉是水果，水果不是香蕉。”

另外，Kotlin 把 Java 方法参数和返回类型中用到的 `Object` 类型看作 `Any`(更确切地是当做「平台类型」)。当 Kotlin 函数函数中使用 `Any` 时，它会被编译成 Java 字节码中的 `Object`。

> Hint: 平台类型本质上就是 Kotlin 不知道可控性信息的类型 —— 所有 Java 引用类型在 Kotlin 中都表现为平台类型。

上面提到：在 Kotlin 中， **`Any` 是所有 非空类型 的超类**。  
你可能会有疑问： `null` 类型的父类是什么呢？

## Unit —— Kotlin 里的 void
**Kotlin 是一种表达式导向的语言，所有流程控制语句都是表达式**。它没有 Java 和 C 中的 `void` 函数，函数总是会返回一个值。有时候函数并没有计算任何东西 —— 这被我们称作他们的副作用（side effect），这时将会返回 `Unit`——具有单一值的类型。

大多数情况下，你不需要明确指定 `Unit` 作为返回类型或从函数返回 `Unit`。如果编写的函数具有块代码体，并且不指定返回类型，则编译器会将其视为返回 `Unit` 类型，否则编译器会使用推断的类型。
```Kotlin
fun example() {
    println("block body and no explicit return type, so returns Unit")
}
val u: Unit = example()
```
`Unit` 并没什么特别之处。就像任何其他类型一样，它是 `Any` 的子类型，而 `Unit?` 是 `Any?` 的子类型。
<center>![Kotlin types](/images/2017/11/kotlin-unit-1.png)</center>

然而 `Unit?` 类型却是一个奇怪的特殊例子，这是 Kotlin 的类型系统一致性的结果。`Unit?` 类型只有两个值：`Unit` 单例和 `null`。我暂时还没发现使用 `Unit?` 类型的地方，但是在类型系统中没有特殊的 void 这一事实，使得处理各种函数泛型变得更加容易。  

## Nothing
在 Kotlin 类型层级结构的最底层是 `Nothing` 类型。

<center>![Kotlin types](/images/2017/11/kotlin-nothing-1.png)</center>  

顾名思义，`Nothing` 是没有实例的类型。`Nothing` 类型的表达式不会产生任何值。

注意 `Unit` 和 `Nothing` 之间的区别，对 `Unit` 类型的表达式求值将返回 `Unit` 的单例，而对 `Nothing` 类型的表达式求值则永远都不会返回。

这意味着任何类型为 `Nothing` 的表达式之后的所有代码都是无法得到执行的（unreachable code），编译器和 IDE 会向你发出警告。

什么样的表达式类型为 `Nothing` 呢？[流程控制中与跳转相关的表达式。](https://kotlinlang.org/docs/reference/grammar.html#jump)

例如 `throw` 关键字会中断表达式的计算，并从函数中抛出异常。因此 `throw` 就是 `Nothing` 类型的表达式。

通过将 `Nothing` 作为所有类型的子类型，类型系统允许程序中的任何表达求值失败。例如: JVM 在计算表达式时内存不足，或者是有人拔掉了计算机的电源插头。这也意味着我们可以从任何表达式中抛出异常。

```Kotlin
fun formatCell(value: Double): String =
    if (value.isNaN())
        throw IllegalArgumentException("$value is not a number")
    else
        value.toString()
```

你可能会惊奇地发现，`return` 语句的类型也为 `Nothing`。`return` 是一个流程控制语句，它立即从函数中返回一个值，打断其所在表达式的求值。

```Kotlin
fun formatCellRounded(value: Double): String =
    val rounded: Long = if (value.isNaN()) return "#ERROR" else Math.round(value)
    rounded.toString()
```

进入无限循环或杀死当前进程的函数返回类型也为 Nothing。例如 Kotlin 标准库将 `exitProcess` 函数声明为：
```Kotlin
fun exitProcess(status: Int): Nothing
```

如果你编写返回 `Nothing` 的自定义函数，编译器同样能检查出调用函数后无法得到执行的代码，就像使用语言本身的流程控制语句一样。
```Kotlin
inline fun forever(action: ()->Unit): Nothing {
    while(true) action()
}
fun example() {
    forever {
        println("doing...")
    }
    println("done") // Warning: Unreachable code
}
```

与空安全一样，不可达代码分析是类型系统的一个特性。无需像 Java 一样在编译器和 IDE 中使用一些手段进行特殊处理。

## 可空的 Nothing?

`Nothing` 像任何其他类型一样，如果允许其为空则可以得到对应的类型 `Nothing?`。`Nothing?` 只能包含一个值：`null`。事实上 `Nothing?` 就是 `null` 的类型。

`Nothing?` 是所有可空类型的最终子类型，所以我们可以使用 null 作为任何可空类型的值。

<center>![Kotlin types](/images/2017/11/kotlin-nullable-nothing.png)</center>  

# 三、总结

如果你还是对 Kotlin 类型系统不够清晰，下面这张图可能会对你有所帮助：

<center>![Kotlin types](/images/2017/11/kotlin-basic-types-sys.png)</center>  

作为「Better Java」，Kotlin 的类型系统更加简洁，同时为了提高代码的安全性、可靠性，引入了一些新的特性（ex. **Nullable Types** 和 **Immutable Collection**）。

我们将在下一篇详细介绍 Kotlin 中的集合。

------
参考：

- [A Whirlwind Tour of the Kotlin Type Hierarchy](http://natpryce.com/articles/000818.html)
- [ 《Kotlin in Action》](https://book.douban.com/subject/27093660/)
