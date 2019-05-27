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

原文 |  改为 | 状态
-|-|-
64 | I am run very fast | I can run very fast
198 | `fun toMap(a: User): Map<String, Any> = { ... }` | `fun toMap(a: User): Map<String, Any> { return ... }`
199 | `fun <A : Any> toMap(a: A): Map<String, Any?> = { ... }` | `fun <A : Any> toMap(a: A): Map<String, Any?> { return ... }`
199 | 素据 | 数据
206 | `Succ::class.declaredMemberExtensionFunctions.map{it.name}` | `Nat::class.declaredMemberExtensionFunctions.map{it.name}`
206 | `Nat::class.declaredMemberExtensionProperties` | `Nat::class.declaredMemberExtensionProperties.map{it.name}` 
207 | 缺乏必要的Person类 | 在 `KMutablePropertyShow`函数上方增加 ` data class Person(val name: String, val age: Int, var address: String)`

