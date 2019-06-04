---
title: 关于书籍《Kotlin核心编程》
author: ScalaCool
tags:
- Kotlin
- ScalaCool
- ^ScalaCool
description: 本页面是为了《Kotlin核心编程》这本而构建的，主要讨论和该书中涉及的相关技术和勘误说明，也欢迎任何关于本书内容的讨论，谢谢！
date: 2019-05-17
---

本页面是为了《Kotlin核心编程》这本而构建的，主要讨论和该书中涉及的相关技术和勘误说明，也欢迎任何关于本书内容的讨论，谢谢！

《Kotlin核心编程》已经由机械工业出版社于2019年05月出版，水滴技术团队是该书的作者团队，请大家支持，也请批评指教 ^_^

如果您喜欢Kotlin，可以在各大购书网站搜索“Kotlin核心编程”来购买

您也可以考直接通过如下的任何一个链接去了解或购买该书：

> 当当网：http://product.dangdang.com/27859545.html

> 京东：https://item.jd.com/12519581.html

> 书评在豆瓣：https://book.douban.com/subject/33419618/

<img src="/images/2019/05/dive-into-kotlin.jpg" width="450" />


## 勘误

> 我们对由于不严谨、稿件版本等原因导致的错别字、代码、格式等问题表示抱歉，会在新批次印刷前进行订正。

版次（2019 年 4 月第 1 版第 1 次印刷）

<table>
  <tr>
    <th>页码</th>
    <th>原文</th>
    <th>改为</th>
  </tr>
  <tr>
    <td>56</td>
    <td>internal public Bird</td>
    <td>internal class Bird</td>
  </tr>
  <tr>
    <td>60</td>
    <td>若要继承...抽象类实现的。</td>
    <td>若要继承该类则需要将子类定义在同一个文件中，其他文件中的类将无法继承这个类。但这种方式有一定的局限性，即密封类不能被初始化，因为它背后是基于一个抽象类实现的。</td>
  </tr>
  <tr>
    <td>64</td>
    <td>I am run very fast</td>
    <td>I can run very fast</td>
  </tr>
  <tr>
    <td>130</td>
    <td>
      ```kotlin
      fun sum(a: Int, b: Int) {
          return a + b
      }
      ```
    </td>
    <td>
      ```kotlin
      fun sum(a: Int, b: Int): Int {
          return a + b
      }
      ```
    </td>
  </tr>
  <tr>
    <td>144</td>
    <td>
      `dest: Array<Double>`
    </td>
    <td>
      `dest: Array<Double?>`
    </td>
  </tr>
  <tr>
    <td>145</td>
    <td>
      `dest: Array<T>`
    </td>
    <td>
      `dest: Array<T?>`
    </td>
  </tr>
  <tr>
    <td>198</td>
    <td>`fun toMap(a: User): Map<String, Any> = { ... }`</td>
    <td>`fun toMap(a: User): Map<String, Any> { return ... }`</td>
  </tr>
  <tr>
    <td>199</td>
    <td>`fun <A : Any> toMap(a: A): Map<String, Any?> = { ... }`</td>
    <td>`fun <A : Any> toMap(a: A): Map<String, Any?> { return ... }`</td>
  </tr>
  <tr>
    <td>199</td>
    <td>素据</td>
    <td>数据</td>
  </tr>
  <tr>
    <td>206</td>
    <td>`Succ::class.declaredMemberExtensionFunctions.map{it.name}`</td>
    <td>`Nat::class.declaredMemberExtensionFunctions.map{it.name}`</td>
  </tr>
  <tr>
    <td>206</td>
    <td>`Nat::class.declaredMemberExtensionProperties`</td>
    <td>`Nat::class.declaredMemberExtensionProperties.map{it.name}` </td>
  </tr>
  <tr>
    <td>207</td>
    <td>缺乏必要的Person类</td>
    <td>在 `KMutablePropertyShow`函数上方增加 ` data class Person(val name: String, val age: Int, var address: String)` </td>
  </tr>
  <tr>
    <td>254</td>
    <td>
      ```haskell
      f1 :: Int -> Int -> Int
      f1 x y = x + y

      f2 :: Int -> Int
      f2 x = x
      ```
    </td>
    <td>
      ```haskell
      f1 :: Int -> Int -> Int
      f1 x y = x

      f2 :: Int -> Int
      f2 x = f2 x 
      ```
    </td>
  </tr>
  <tr>
    <td>294</td>
    <td>
      ```kotlin
      fun <T> withLock(lock: Lock, action: () -> T): T {
          lock.lock()
          try {
              return action()
          } catch (ex:Exception) {
              println("[Exception] is ${ex}")
          } finally {
              lock.unlock()
          }
      }
      ```
    </td>
    <td>
      ```kotlin
      fun <T> withLock(lock: Lock, action: () -> T): T {
          lock.lock()
          try {
              return action()
          }  finally {
              lock.unlock()
          }
      }
      ```
    </td>
  </tr>
</table>


