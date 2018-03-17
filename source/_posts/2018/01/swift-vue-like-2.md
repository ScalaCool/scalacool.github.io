title: 用 Swift 模仿 Vue + Vuex 进行 iOS 开发（二）：Coordinator
author: Yison
tags: 
- Swift
- iOS
- 前端开发
- ~用 Swift 模仿 Vue + Vuex 进行 iOS 开发
- ^Yison
description: Soroush Khanlou 写过一篇文章就八个方面来解救 Massive View Controller 的问题。我们今天要讨论的内容，也在这篇文章中有所提及，那就是如何对 Navigator 进行解耦。
date: 2018-03-20
---

[前文](https://scala.cool/2017/12/swift-vue-like-1/) 探讨了 ReSwift，它是基于「单向数据流」的架构方案，来解决 Massive View Controller 灾难。

Soroush Khanlou 写过一篇[《8 Patterns to Help You Destroy Massive View Controller》](http://khanlou.com/2014/09/8-patterns-to-help-you-destroy-massive-view-controller/)，就多方面来改善工程的维护性和可测试性。

今天要讨论的是其中之一，即在解决「数据流问题」之后，再对视图层的 Navigator 进行解耦，所谓的「Flow Coordinators」。

> 注：Thoughtworks 的同学也在[《基于 ReSwift 和 App Coordinator 的 iOS 架构》](https://insights.thoughtworks.cn/ios-arch-based-on-reswift-and-app-coordinator/) 一文中专门介绍过，推荐。

## 什么是 Coordinator

Coordinator 是 Soroush Khanlou 在[一次演讲](https://vimeo.com/144116310)中提出的模式，启发自 [Application Controller Pattern](https://martinfowler.com/eaaCatalog/applicationController.html)。

它是一个简单且易被接受的概念，先来看看传统的作法到底存在什么问题。


```swift

```

再熟悉不过的场景：点击 `ListViewController` 中的 table 列表元素，之后跳转到具体的 `DetailViewController`。

实现思路即在 `UITableViewDelegate`的代理方法中实现两个 view 之间的跳转。

### 存在什么问题

看似很和谐。

好，现在我们的业务发展了，需要适配 iPad，交互发生了变化，我们打算使用 popover 来显示 detail 信息。

于是，代码又变成了这个样子：

```swift

```

很快我们感觉到不对劲，经过理智的判断，发现 viewController 存在好些问题：

- 彼此之间高耦合
- 没有良好的复用性
- 过多 if 控制流代码
- 副作用导致难以测试

### 如何改进



