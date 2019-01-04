---
title: Kotlin Type? VS Scala Option
author: KnewHow
tags:
- 编程语言
- ~Kotlin Type? VS Scala Option
- ^KnewHow
date: 2019-01-04
---

最近阅读一些关于 Kotlin 类型系统方面的书，发现 Kotlin 的类型系统针对 `null` 有着独特的设计哲学。在 Java 或者其它编程语言中，经常会出现 `NullPointerException`，而导致此异常的重要原因是因为你可以写 `String s = null` 这样的代码。其实可以认为这是 Java 等语言类型系统设计的一个缺陷，它们允许 `null` 可以作为任何类型的值！

但是在 Kotlin 中，如果你声明 `val s: String = null`，那么编译器会给你一个 error，因为在 Kotlin 中，你不允许把一个 `null` 值赋给一个普通的类型。如果你声明一个这样的函数 `fun strLen(s: String) = {...}`，那么这个函数将不接受值为 `null` 的参数。

这个设计看起来如此的美好，他可以极大程度的减少 Kotlin 产生 `NullPointerException`，可是如果有一天，你需要调用一个方法，它的返回值可能为 `null` 也可能为 `String` ，那么在 Kotlin 中你可以声明一个可空的字符串类型：`String?`。`val s: String? = null` 此时 Kotlin 的编译器会让这行代码通过。当然它也可以接收一个普通的 `String` 类型的值 `val s: String? = "abc"`。

可空类型(`Type?`)的设计，是 Kotlin 另一个设计哲学，它要求工程师在设计的时候就需要确定该变量是否可为空。如果不为空就使用`Type` 类型声明，否则就使用 `Type?` 类型声明。这让我想起在 Scala 中存在一个和 `Type?` 有着异曲同工之妙的一个类型—— `Option[T]`。

`Option[T]` 有两个子类型：`Some[T]` 和 `None`，你可以使用 `val s: Option[String] = Some("123")` 来表示一个字符串存在，当然你可以使用`val s: Option[String] = None` 来表示这个字符串不存在。

Scala 和 Kotlin 都是基于 JVM 的编程语言，而 `Option[T]` 和 `Type?` 的设计就是用来解决 JVM 平台出现的 `NullPointerException`。但二者的设计理念却截然不同，Scala 的 `Option[T]` 是在原有类型基础上使用 `Option` 做一层封装，而 Koltin 的 `Type?` 是使用语法糖完成的。

那么这两种设计方案到底谁更好一点呢？我们将会使用以下标准来分别测试它们：
* 是否可以完美的规避 `NullPointerException` —— 二者的设计都是为了解决 `NullPointerException`，谁可以更好的规避这个问题呢？
* 代码的可读性 —— 如果在复杂的业务中，谁的代码可读性更好一点呢？
* 性能

## 规避空指针
在上文中，我们曾经提过，`NullPointerException` 产生的原因是你可以把一个 `null` 的值传递给一个类型的变量，然后调用这个类型的方法。我们可以使用 Java 的代码来表示一下：`String s = null; s.length()`。

在 `Type?` 的设计理念中，对于不确定是否为 `null` 类型可以使用 `Type?` 类型来声明，如`val s: String? = getString... `，此时 `s` 的类型是 `String?`，你不能直接调用 `s.length`，你需要进行安全调用`s?.length`。这个函数的返回类型是一个 `Int?`，这很正常，对于一个不确定是否为 `null` 的类型进行安全调用返回当然是一个 `Type?` 类型。如果 `s` 不为 `null` 正常返回 `s` 的长度，否则返回 `null`。除此之外， Kotlin 还针对 `Type?` 提供了 Elvis 操作和 let 函数，具体的用法可以参考 Kotlin 官方手册。

而在 `Optional` 的设计哲学中，你可以使用 `Option[T]` 来包裹一个不确定是否为 `null` 的值。这里我们使用 Scala 的代码来演示：`val s: Option[String] = Option(getString...)`，此时 `s` 的类型为 `Option[String]`，你仍然不能直接调用`s.length`，你可以使用 `map` 函数：`s.map(s => s.length)`，它的返回值是一个 `Option[Int]` 类型。和 `Type?` 很类似，对一个 `Option[T]` 类型使用 `map` 函数，结果当然是一个 `Option[S]` 类型。在 Scala 中，你也可以使用模式匹配来处理 `Option` 类型。

总结：二者都可以完美的规避 `NullPointerException`，`Type?` 使用安全调用来避免直接调用 `Type` 类型的方法，而 `Option` 则使用 map 函数或者模式匹配来处理。本质上都是避免直接调用值可能为 `null` 的类型变量的方法。

## 代码可读性
实际的业务是比较复杂的，例如，我们需要计算两个数字字符串的乘积，首先我们需要把他们转换为 `Int` 类型，如果其中一个字符串是转换失败，则无法计算结果。

在 Kotlin 的 `Type?` 中，我们需要重新定义 `String` 类型的 `toInt` 方法，让它返回一个 `Int?` 类型，代码如下：
```Kotlin
fun tryString2Int(a: String) = try {
    a.toInt()
}catch (e:Exception){
    null
}
```
然后我们需要定义一个方法来计算两个数字字符串的乘积，这里我们使用 `Type?` 的 let 函数，它接受一个 Lambda 表达式，如果调用者的值不为 `null`，则调用 Lambda 表达式，否则直接返回 `null`。`strNumberMuti` 函数返回的是一个 `Double?` 类型，如果有任何一个字符串转换数字失败，就返回 `null`，都转换成功才计算乘积。
```Kotlin
fun strNumberMuti(s1: String, s2: String): Double? =
    tryString2Int(s1)?.let{ a ->
        tryString2Int(s2)?.let {
            t -> a * t * 1.0 }}
```
这段代码的可读取有点差呀，而且在实际的业务开发过程中，可能会有更多的 `Type?` 类型，那代码岂不是要爆炸了！。幸运的是，Kotlin 允许我们使用 `if` 来代替 `let` 函数 做相同的判断，代码如下：
```Kotlin
fun strNumberMuti2(s1: String, s2: String):Double? {
    val a = tryString2Int(s1)
    val b = tryString2Int(s2)
    return if(a!=null && b!= null) a * b * 1.0 else null
}
```
这样的代码可读性就好多了，但是丢失函数式的编程美感。而且感觉 `Type?` 是一种语法糖，手动对 `Type?` 进行非空校验，就可以直接使用 `Type` 类型了！！

同样的我们使用 Scala 的 `Option[T]` 来完成上面的需求，为了让 `toInt` 函数返回 `Option[T]` 类型，我们定义了一个 `Try` 函数，这个函数看不懂没关系，你只需知道它接受一个函数，并且返回一个 `Option[A]` 值即可。代码让如下：
```Scala
def Try[A](a: => A): Option[A] = {
    try Some(a)
    catch {case e: Exception => None}
  }
```
同样的，我们需要写一个函数，用来把两个字符串数字转换为整数，并且做它们的乘积，这里我们为了使代码更简洁，使用了 Scala 的 for 推导，具体的用法可以参考 Scala 官方的 Document。`strNumberNu`返回类型是 `Option[Double]`，如果有任何一个转换失败，返回 `None`，否则返回 `Some[Double]`，代码如下：

```Scala
 def strNumberMuti(s1: String, s2: String): Option[Double] = {
    for{
      a <- Try{ s1.toInt }
      b <- Try{ s2.toInt }
    } yield a * b

  }
```
可以看出，使用 Scala 的 `Option[T]` 更具有函数式的编程美感，而且代码的可读性极强，而且即使有更多的 `Option[T]`，for 推导都可以轻松应对。

总结：面对比较复杂的业务场景，`Type?` 和 `Option[T]` 都可以轻松应对，但是 `Type?` 的用法就显得有些 low，还是使用 `!=null` 的套路，这也暴露了它的设计是存在缺陷的。相反的 `Option[T]` 的设计理念是完备的，而且极具函数式的编程美感。

## 性能
性能是衡量设计好坏的一个重要的方面，下面我们只做一个简单的测试：让两个字符串都是`"999"`，然后分别执行 Kotlin 的 `strNumberMuti` 和 Scala 的 `strNumberMuti` 一千万次，然后我们发现 Kotlin 的 `strNumberMuti` 执行时间大约在 1.9s，而 Scala 的 `strNumberMuti` 执行时间约在 5.0s。由此可以看出，Kotlin 的 `Type?` 比 Scala `Option[T]` 拥有更好的性能，其实这样很正常，因为 Kotlin 的 `Type?` 是语法糖，创建一个 `Type?` 的对象其实和创建一个 `Type` 的对象其实消耗的性能差不多，但是 `Option[T]`不仅仅需要创建 `T` 类型的对象，更需要创建 `Option[T]` 类型的对象来包裹 `T` 类型的对象，因此它的开销大一点。

## 总结
就我而言，我更喜欢 Scala 的 `Option[T]` 的设计，因为它是理论完备的，而且极具函数式的编程美感，即使它的性能要差一点。对于 Kotlin 的 `Type?` 类型，我觉得它的设计有瑕疵，就拿 `let` 函数举例，在单个 `Type?` 很好用，但是当多个 `Type?` 进行组合的时候，就显得很鸡肋。

萝卜青菜，各有所爱，也许某天 Kotlin 也会让 `Type?` 具有函数式的编程美感。
