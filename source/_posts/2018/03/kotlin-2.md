---
title: Dive Into Kotlin（三）：集合
author: prefert
tags:
- Kotlin
- Android
description: 在 Java/Android 开发中，我们经常用集合来处理数据。Java 中的集合相对而言是比较简单的，但是在很多时候，语法显得冗长。本文将带你感受 Kotlin 集合的魅力。
date: 2018-03-22
---

在 Java/Android 开发中，我们经常用集合来处理数据。

Java 中的集合相对而言是比较简单的，但是在很多时候，语法显得冗长。

<!--more-->

### **Java 传统集合 vs Java 8 Stream vs Kotlin 集合**

我们以文章（`Article`）为例子，一篇文章有一个标题、作者及多个标签：

```Java
public class Article {

    private String title;
    private String author;
    private List<String> tags;

    // ... some get、set、construct method
}
```

现在有一个需求：将所有文章（`Article`）按作者（`author`）进行分组。  

Java 实现如下：

```java
private static Map<String, List<Article>> groupByAuthor(List<Article> articles) {
    Map<String, List<Article>> result = new HashMap<>();
    for (Article article : articles) {
        if (result.containsKey(article.getAuthor())) {
            result.get(article.getAuthor()).add(article);
        } else {
            ArrayList<Article> articlesTemp = new ArrayList<>();
            articlesTemp.add(article);
            result.put(article.getAuthor(), articlesTemp);
        }
    }
    return result;
}
```

Kotlin 由于高度兼容 Java 而越来越受欢迎，最重要的还是它简洁的语法（本篇仅论集合层面），上面的代码在 Kotlin 中可以写为：  

```Kotlin
private fun groupByAuthorKotlin(articles: List<Article>): Map<String, List<Article>> {
    return articles.groupBy { it.author }
}
```

链式调用是不是很优雅？  

使用 Java 8 的同学可能会表示不服（链式调用我也行！）：  

```Java
private static Map<String, List<Article>> groupByAuthorStream(List<Article> articles) {
    return articles.stream()
            .collect(Collectors.groupingBy(Article::getAuthor));
}
```

除了代码量上的优势，语法上也更能体现业务需求，便于维护。这也是越来越多的开发者喜欢函数式的原因之一。（关于 Stream 与 Kotlin 的对决将呈现在文章后半部分）  

以上，相信你已经对 Kotlin 集合产生兴趣了，接下去让我们一起来看看 Kotlin 集合的结构。

## **一. Kotlin 集合的结构**

我们都知道 Kotlin 集合基于 (Java 集合框架)[https://www.tutorialspoint.com/java/java_collections.htm]。

理所应当，它的核心也是 `Iterator` 。  

### **Iterator**

作为一个 Java 开发者，我们都知道 `Iterator` 主要的作用就是提供遍历的能力。  

但是，**Kotlin 将集合分成了两类： 「可变集合」 与  「不可变集合」**。造成`Iterator` 层级核心变动如下：

- `ListIterator` 仅支持遍历。
- `MutableIterator` 提供删除元素的能力。
- `MutableListIterator` 继承以上两个接口，具备了新增元素的能力

即：

![iterator](https://scala.cool/images/2018/03/kotlin-iterator.svg)

> Hint： Kotlin 中 `out` 关键字代表这个类的对象为只读。

### **List && Set**

由以上，我们也可以推测出，`List` 以及`Set`的结构变动，最关键且唯一的变化就是区分了可变集合。

整体结构可以参考下图：

![kotlin collection hierarchy](https://scala.cool/images/2018/03/kotlin-collection.svg)

与 Java 相比，Kotlin 集合的层次结构更加详细——这也是 Java 摸爬滚打产生的更好的实践。

## **二. Kotlin 的集合操作符**

如果你使用过 RxJava 等一系列库，你一定会对操作符非常了解也对操作符的强大深有感触。  

Kotlin 也如此，原生便支持大量操作符，先上一部分感受一下：

| 分类     | 方法                                                         |
| -------- | ------------------------------------------------------------ |
| 元素操作 | contains /  elementAt / firstOrNull / lastOrNull / indexOf / singleOrNull |
| 判断操作 | any / all / none / count / reduce / fold                     |
| 过滤操作 | filter / filterNot / filterNotNull / take / min / max        |
| 集合转换 | map / mapIndexed / mapNotNull / flatMap / groupBy / zip      |
| 排序     | reversed /  sorted / sortedBy / sortedDescending             |

> Hint：可以在 [_Collections.kt](https://github.com/JetBrains/kotlin/blob/master/libraries/stdlib/src/generated/_Collections.kt) 中看到所有的操作符。

Talk is cheap !  我们举几个例子：  

### **过滤 `filter` 与变换 `map`**

```kotlin
// 定义并初始化列表
val list = listOf(1, 2, 3, 4, 5, 6)

println(list.filter { it % 2 == 0 })
// [2, 4, 6]

println(list.map { it * it })
// [1, 4, 9, 16, 25, 36]
```

观察结果可知：  

`filter` 函数遍历集合并返回了符合条件元素的集合。  

![kotlin-filter](https://scala.cool/images/2018/03/kotlin-filter.svg)

`map` 函数遍历集合并对每个元素做出了相同的处理。  

![kotlin-map](/images/2018/03/kotlin-map)

### **平铺 `flatten`  与变换平铺 `flatMap`**

```Kotlin
val words = listOf(listOf("kotlin"), listOf("is", "best"))
println(words.flatten())
// [kotlin, is, best]
println(words.flatMap { it.map(String::toUpperCase) })
// [KOTLIN, IS, BEST]
```

观察结果可知：  

`flatten`  函数可以将多个列表形式的元素平铺，就好像给每个元素脱掉了衣服，再将他们包在一起。  

`flatMap` 函数可是说是 flatten 的加强版，可以先将子列表进行变换后再平铺，再将他们包在一起。  

![kotlin-flatMap](https://scala.cool/images/2018/03/kotlin-flatMap)

### **操作符的实现**

对于没有接触过函数式编程的朋友，可能会不禁发问： Kotlin 为什么能够实现这样的骚操作？  

这些方法我们从最简单的 `filter` 入手。  

```Kotlin
public inline fun <T> Iterable<T>.filter(predicate: (T) -> Boolean): List<T> {
    return filterTo(ArrayList<T>(), predicate)
}

public inline fun <T, C : MutableCollection<in T>> Iterable<T>.filterTo(destination: C, predicate: (T) -> Boolean): C {
    for (element in this) if (predicate(element)) destination.add(element)
    return destination
}
```

以上，不难看出 Kotlin 中集合操作符本质上就是方法调用。  

`filter` 其实是 `Itrable` 的一个扩展方法 (`extention`)，它接收一个 T 作为参数，并返回 `Boolean` 的闭包作为参数，内部调用了 `filterTo` 方法。  

再看看 `filterTo` 方法：传入了目标类型 C 和判断用闭包。内部实际就是循环对元素判断，符合则添加到返回的集合中。  

是不是很简单？

我们尝试实现类似 `map`和 `filter` 结合的方法 `magicConvert`。

```Kotlin
private fun  <T, E> Iterable<T>.collect(function: (T) -> E, predicate: (T) -> Boolean): MutableList<E> {
    val result: MutableList<E> = mutableListOf()
    for (element in this) if(predicate(element)) result.add(function(element))
    return result
}

// Test
println(list.collect({ it * it }, { it % 2 == 0 }))
// [4, 16, 36]
```

至此，我们应该已经对 Kotlin 集合的操作有了基本了解。

## **三. 对比 Kotlin Collections 和 Java 8 Stream**

对于使用过 RxJava 的你，一定对  [Java Stream](http://www.oracle.com/technetwork/articles/java/ma14-java-se-8-streams-2177646.html)有所了解。

文章开头的例子已经展示过，在 Java 8 中， `stream()` 方法使得 Java 传统的 Collection 类拥有了函数式的操作。

这种语法相较 Kotlin 来说稍微显得繁琐了一点，每次操作前都需要转换成 `stream` ，操作完还要 调用 `collect()` 转换回 Collection。  

例如：

```Java
// Java
someList
  .stream()
  .map() // some operations
  .collect(Collectors.toList());
```

```kotlin
// Kotlin
someList
  .map() // some operations
```

但是这么做，其实是有原因：**stream 只能被消费一次，不可多次重用**。  

下面这样的操作会抛出异常：  

```Java
Stream<Integer> someIntegers = integers.stream();
someIntegers.forEach(...);
someIntegers.forEach(...); // an exception
```

Kotlin 中因为 **操作的中间状态被快速地分配给了变量** ，运行起来并没有任何问题。

### **延迟序列**

Java 8 Stream 一个关键的点是：**它使用了惰性求值（[Lazy Evaluation](https://zh.wikipedia.org/wiki/%E6%83%B0%E6%80%A7%E6%B1%82%E5%80%BC)），即在需要的时候才会求值**。

而 **Kotlin 则相反**（除了 `sequences`，将在 `Lambda` 章节讲述)**，采用及早求值（[Eager Evaluation](https://zh.wikipedia.org/wiki/%E5%8F%8A%E6%97%A9%E6%B1%82%E5%80%BC)）。**  

举个例子：

```Kotlin
val result = listOf(1, 2, 3, 4, 5)
  .map { n -> n * n }
  .filter { n -> n < 10 }
  .first()
```

以上代码，在 Kotlin 的版本中将执行 5 次 `map()` 和 `filter()` 操作，最后返回第一个值。而在 Java Stream 中集合操作只会各执行 1 次。

在对性能有要求的场景下，我们需要 **使用 `asSequence（）` 方法将集合转为惰性序列**，以最小开销来实现业务。

### **操作符**

Java Stream 的中间操作与 Kotlin 几乎没有差别。  

需要注意的几个点是：

- Java Stream 有一个`peek()` 方法用于不间断的迭代 Stream 流。
- Java Stream 的 `flatMap()` 方法需要返回 Stream 实例（需要用 `Arrays.toStream()`处理），而 Kotlin 可以返回任何类型
- Java Stream 的部分 lambda 表达式不包含索引，仅有元素。
- 另外，Java Stream 目前并不支持`zip ()`、`unzip()` 、`associate()` 操作。

## **四. 总结**

本篇文章简述了 Kotlin 集合的结构，揭露集合操作符的部分本质 并 初探扩展函数。

其次，通过与 Java 8 Stream 的比较，我们能感受到 Kotlin 以及函数式编程的优势与魅力。

当然，Kotlin 的黑魔法不止于此。

下一篇，我们将讨论 Kotlin 中的泛型和协变。

------

参考：

- [KOTLIN COLLECTIONS INSIDE. PART 1](https://www.runtastic.com/blog/en/kotlin-collections-inside-part-1/)
- [KOTLIN COLLECTIONS INSIDE. PART 2](https://www.runtastic.com/blog/en/kotlin-collections/)
- [Scala 中的集合](https://scala.cool/tags/%E9%9B%86%E5%90%88/)
- [Java 8 Stream API Analogies in Kotlin](http://www.baeldung.com/java-8-stream-vs-kotlin)
- [ 《Kotlin in Action》](https://book.douban.com/subject/27093660/)
