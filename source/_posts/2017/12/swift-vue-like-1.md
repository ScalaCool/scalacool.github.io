title: 用 Swift 模仿 Vue + Vuex 进行 iOS 开发（一）：ReSwift
author: Yison
tags: 
- Swift
- iOS
- 前端开发
description: 因水滴计划研发移动端的商家应用，笔者开始了 iOS 端的整体方案设计工作，我们基于 ReSwift 以及 Swift 这门语言的特性（核心是 extension）构建了一套类似 Vue + Vuex 的方案。
date: 2017-12-13
---

因 [水滴](https://drip.im/) 计划研发移动端的商家应用，笔者开始了 iOS 端的整体方案设计工作。

由于没有历史包袱，且团队愿意尝试一些不同的方案，经过两周专注的学习和调研之后，我们并没有采用主流的 MVVM 架构，而是基于 ReSwift 以及 Swift 这门语言的特性（核心是 extension）构建了一套类似 Vue + Vuex 的方案，笔者打算通过四篇文章来分享下这种思路。

需要注意的是，笔者也是第一次接触 Swift 和 iOS，某种程度上来说，也是一名 iOS 菜鸟，行文中难免出现不高明之处，还望指正。但与此同时，笔者也有 Scala 和多年的 Web 前端开发经历，不同的平台和语言，会有相似的思维和知识结构，所以入门移动端原生应用开发时，也发现很多共同之处。

以下是本系列文章的大纲：
1. ReSwift
2. Coordinator
3. extension
4. VueLike

## 架构方式的演变

在介绍 ReSwift 之前，我们先来简单回顾下 iOS 端（不严谨地说，也可以看成是移动端应用开发）的架构演变历史。

这方面介绍的好文章已经相当的多，重点还是推荐下 @Bohdan Orlov 的 [iOS Architecture Patterns](https://medium.com/ios-os-x-development/ios-architecture-patterns-ecba4c38de52)，非常的系统和容易理解。

### Massive View Controller

在讨论架构模式的时候，MVC 是被提及最多的套路之一。众所周知，Apple 推出的 MVC 跟软件工程中传统的 MVC 是不一样的。

很多人对于经典的 MVC 中的 Model 一直存在误解，认为其代表的仅仅只是一个实体模型。其实，它准确的概念应该还包含大量的业务逻辑处理，相对的 Controller 只是在 View 和 Model 层建立一个桥梁而已。

> 注：业界在发展过程中，围绕 MVC 也延伸讨论了很多的问题，典型的如「胖 Model 和瘦 Model」 的问题，甚至于十几年前，曾经在 JavaEye 上专门针对 Model 的设计有过一次相当激烈的讨论，[帖子](http://www.iteye.com/topic/11712)还在。

Apple 的 MVC 采用的是瘦 Model 的设计，ViewController 承载了大量的逻辑处理。之所以这么设计，也是有原因的。

如果拿 iOS 平台和浏览器进行对比，它们存在大量可类比的部分，但前者有个非常与众不同的地方，就是 iOS 和 Android 一样，都存在非常明显的生命周期，这些生命周期的方法都存在于 ViewController。

所以最初始的 iOS 架构问题显而易见：**过于臃肿的 View Controller 层大大降低了工程的可维护性以及可测试性**。

> 这里推荐下 @Krzysztof Zabłocki 的 [Good iOS Application Architecture: MVVM vs. MVC vs. VIPER](https://academy.realm.io/posts/krzysztof-zablocki-mDevCamp-ios-architecture-mvvm-mvc-viper/)，他不但讲述了对不同架构的理解，也提出了自己对好架构的评判标准。

### MVP

解决 Massive View Controller 的一剂良药来自于 MVP。这种设计思路的核心是提出了一个 Presenter 层，它是连接View层与Model层的桥梁并对业务逻辑进行处理，这个符合了我们理想中的 [单一职责原则](https://en.wikipedia.org/wiki/Single_responsibility_principle)。

### MVVM

在笔者看来，MVVM 跟 MVP 其实是十分类似的，这种设计解决了 Massive View Controller 的问题，同时也引入了「双向数据绑定」，MVVM 也是 Web 前端同学十分熟悉的概念。

可以这么说，MVVM 应该是当下 iOS 以及 Android 最流行的架构设计。

### VIPER

VIPER 是 View + Interactor + Presenter + Entity + Router 的缩写。对比 Android，这种架构似乎在 iOS 界更流行，但是整体上而言，采用这种架构的设计并不多。理论上，这是一种非常好的架构思想，灵感于所谓的 [The Clean Architecture](https://8thlight.com/blog/uncle-bob/2012/08/13/the-clean-architecture.html)。

但更细的模块化设计，也让 VIPER 被不少人诟病为一种过渡工程。对它感兴趣的同学，可以看看 objc.io 的 [Architecting iOS Apps with VIPER](https://www.objc.io/issues/13-architecture/viper/)。

## ReSwift

在水滴内部，我们曾采用过 Angular 1.x 开发业务，所以对于「双向数据绑定」的概念并不陌生。随着我们业务的需要，我们过渡到了更加成熟的 Vue 2 + webpack 来组织 Web 前端的开发。在体验过不同的数据流方案之后，就偏好而言，我们还是更加喜爱「单向数据流」的套路，缘自于后者设计更简单，更有利于测试。

所以，在学习了 MVVM 这个成熟的解决方案之后，笔者也开始寻求 iOS 的单向数据流解决方案，后面发现了[ReSwift](http://reswift.github.io/ReSwift/master/)，在经过两周的体验和测试，我们发现这或许是更加符合团队审美偏好的一种架构设计。

### Redux

要了解「单向数据流」其实只要学习 [Redux](https://redux.js.org/docs/introduction/) 就行了。2014年 Facebook 提出了 [Flux](https://facebook.github.io/flux/) 架构的概念，2015年，Redux 出现，将 Flux 与函数式编程结合一起，很短时间内就成为了最热门的 Web 前端架构。 

### 核心设计

基于经典的 [Redux](https://redux.js.org/docs/introduction/) 模型，ReSwift 也奉行以下设计：

- **The Store**：以单一数据结构管理整个 app 的状态，状态只能通过 dispatching Actions 来进行修改。一旦 store 中的状态改变了，它就会通知给所有的 observers 。

- **Actions**：通过陈述的形式来描述一次状态变更，它不包含任何代码，存储在 store，被转发给 reducers。reducers 会接收这些 actions 然后进行相应的状态逻辑变更。

- **Reducers**：基于当前的 action 和 app 状态，通过纯函数来返回一个新的 app 状态。

### combineReducers

笔者发现在当前的 ReSwift 版本中，并没有提供 Redux 中相应的 combineReducers 实现。猜想这个其实跟 Swift 与 JavaScript 之间的差异导致，与后者这门动态语言不通，前者存在静态的类型。但这个问题可以通过其它办法来解决。

### 牛刀小试

现在我们就来看看如何基于 ReSwift 创建一个 iOS 工程。

首先是项目结构设计，假设这是一个多功能的业务需求，看 ReSwift 是否可以组织一个相对复杂的项目。

#### **项目结构**

- App
  - AppReducer.swift
  - AppState.swift
- Modules
  - Module1
    - Actions
    - Reducers
    - State
  - Module2
    - ……
- Views
- AppDelegte.swift
- ……

#### **AppDelegate.swift**

```swift
import UIKit
import ReSwift

let mainStore = Store<AppState>(
    reducer: appReducer,
    state: nil
)

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    ……
}

```

#### **App/AppState.swift**

```swift
import ReSwift

struct AppState: StateType {
    var module1State: Module1State
    var module2State: Module2State
}
```

#### **App/AppReducer.swift**

```swift
import ReSwift
import ReSwiftRouter

func appReducer(action: Action, state: AppState?) -> AppState {
    return AppState(
        module1State: module1Reducer(action: action, module1State: state?.module1State),
        module2State: module2Reducer(action: action, module2State: state?.module2State)
    )
}

```

#### **Modules/Module1/State/Module1State.swift**

```swift
import ReSwift

struct Module1State {
  ……
}
```

#### **Modules/Module1/Reducers/Module1Reducer.swift**

```swift
import ReSwift

func module1Reducer(action: Action, module1State: Module1State?) -> Module1State {
    return doSomething(module1State) ?? Module1State()
}
```

#### **Modules/Module1/Actions/Module1Action.swift**

```swift
import ReSwift

struct Module1Action {
    func action1(params: Int) -> Action {
        return Action1(params: params)
    }
}

extension Module1Action {
    struct Action1: Action {
        let params: Int
    }
}
```

就这样，我们完成了 Redux 相关的结构设计，至于 Redux 跟 ViewController 层如何结合，打交道。我们将在下一篇关于 Coordinator 的文章中进一步介绍。