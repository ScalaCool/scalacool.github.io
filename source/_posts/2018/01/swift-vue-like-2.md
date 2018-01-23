title: 用 Swift 模仿 Vue + Vuex 进行 iOS 开发（二）：Coordinator
author: Yison
tags: 
- Swift
- iOS
- 前端开发
- ~用 Swift 模仿 Vue + Vuex 进行 iOS 开发
- ^Yison
description: Soroush Khanlou 写过一篇文章就八个方面来解救 Massive View Controller 的问题。我们今天要讨论的内容，也在这篇文章中有所提及，那就是如何对 Navigator 进行解耦。
date: 2018-01-20
---

[上一篇文章](https://scala.cool/2017/12/swift-vue-like-1/) 探讨了 ReSwift，它是一种基于单向数据流的架构方案，来帮助解决传统的 Massive View Controller 灾难。

针对这个问题，Soroush Khanlou 写过一篇 [8 Patterns to Help You Destroy Massive View Controller](http://khanlou.com/2014/09/8-patterns-to-help-you-destroy-massive-view-controller/) 就各种方式和方面来解救工程维护性和可测试性的问题。

我们今天要讨论的内容，也在这篇文章中有所提及，那就是如何在解决数据流问题之后，再对视图层面的 Navigator 进行解耦，也就是所谓的「Flow Coordinators」。