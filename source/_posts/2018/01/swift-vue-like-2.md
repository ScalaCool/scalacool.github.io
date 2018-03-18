title: 用 Swift 模仿 Vue + Vuex 进行 iOS 开发（二）：Coordinator
author: Yison
tags: 
- Swift
- iOS
- 前端开发
- ~用 Swift 模仿 Vue + Vuex 进行 iOS 开发
- ^Yison
description: Soroush Khanlou 写过一篇文章就八个方面来解救 Massive View Controller 的问题。我们今天要讨论的内容，也在这篇文章中有所提及，那就是如何对 Navigator 进行解耦。
date: 2018-03-18
---

[前文](https://scala.cool/2017/12/swift-vue-like-1/) 探讨了 ReSwift，它是基于「单向数据流」的架构方案，来解决 Massive View Controller 灾难。

Soroush Khanlou 写过一篇[《8 Patterns to Help You Destroy Massive View Controller》](http://khanlou.com/2014/09/8-patterns-to-help-you-destroy-massive-view-controller/)，就多方面来改善工程的维护性和可测试性。

今天要讨论的是其中之一，即在解决「数据流问题」之后，再对视图层的 Navigator 进行解耦，所谓的「Flow Coordinators」。

## 什么是 Coordinator

Coordinator 是 Soroush Khanlou 在[一次演讲](https://vimeo.com/144116310)中提出的模式，启发自 [Application Controller Pattern](https://martinfowler.com/eaaCatalog/applicationController.html)。

先来看看传统的作法到底存在什么问题。


```swift
func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
	let item = self.dataSource[indexPath.row]
	let vc = DetailViewController(item.id)
	self.navigationController.pushViewController(vc, animated: true, completion: nil)
}
```

再熟悉不过的场景：点击 `ListViewController` 中的 table 列表元素，之后跳转到具体的 `DetailViewController`。

实现思路即在 `UITableViewDelegate`的代理方法中实现两个 view 之间的跳转。

## 传统的耦合问题

看似很和谐。

好，现在我们的业务发展了，需要适配 iPad，交互发生了变化，我们打算使用 popover 来显示 detail 信息。

于是，代码又变成了这个样子：

```swift
func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
	let item = self.dataSource[indexPath.row]
	if (! Device.isIPad()) {
		let vc = DetailViewController(item.id)
		self.navigationController.pushViewController(vc, animated: true, completion: nil)
	} else {
		var nc = UINavigationController(rootViewController: vc)
		nc.modalPresentationStyle = UIModalPresentationStyle.Popover
		var popover = nc.popoverPresentationController
		popoverContent.preferredContentSize = CGSizeMake(500, 600)
		popover.delegate = self
		popover.sourceView = self.view
		popover.sourceRect = CGRectMake(100, 100, 0, 0)
		presentViewController(nc, animated: true, completion: nil)
	}
}
```

很快我们感觉到不对劲，经过理性分析，发现以下问题：

- view controller 之间高耦合
- ListViewController 没有良好的复用性
- 过多 if 控制流代码
- 副作用导致难以测试

## Coordinator 如何改进

显然，问题的关键在于「解耦」，看看所谓的 Coordinator 到底起到了什么作用。

先来看看 Coordinator 主要的职责：
- 为每个 ViewController 配置一个 Coordinator 对象
- Coordinator 负责创建配置 ViewController 以及处理视图间的跳转
- 每个应用程序至少包含一个 Coordinator，可叫做 AppCoordinator 作为所有 Flow 的启动入口

了解了具体概念之后，我们用代码来实现一下吧。

不难看出，Coordinator 是一个简单的概念。因此，它并没有特别严格的实现标准，不同的人或 App 架构，在实现细节上也存在差别。

但主流的方式，最多是这两种：
- 通过抽象一个 BaseViewController 来内置 Coordinator 对象
- 通过 protocal 和 delegate 来建立 Coordinator 和 ViewController 之间的联系，前者对后者的「事件方法」进行实现

由于个人更倾向于低耦合的方案，所以接下来我们会采用第二种方案。

> 事实上 BaseViewController 在复杂的项目中，也未必是一种优秀的设计，不少文章采用 AOP 的思路进行过改良。

好了，首先我们定义一个 Coordinator 协议。

```swift
protocol Coordinator: class {
    func start()
    var childCoordinators: [Coordinator] { get set }
}
```

Coordinator 存储了「子 Coordinators」 的引用列表，防止它们被回收，实现相应的列表增减方法。

```swift
extension Coordinator {
    func addChildCoordinator(childCoordinator: Coordinator) {
        self.childCoordinators.append(childCoordinator)
    }
    func removeChildCoordinator(childCoordinator: Coordinator) {
        self.childCoordinators = self.childCoordinators.filter { $0 !== childCoordinator }
    }
}
```

我们说过，每个程序的 Flow 入口是由 AppCoordinator 对象来启动的，在 `AppDelegate.swift` 写入启动的代码.

```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
	self.window = UIWindow(frame: UIScreen.main.bounds)
	self.window?.rootViewController = UINavigationController()
	self.appCoordinator = AppCoordinator(with: window?.rootViewController as! UINavigationController)
	self.appCoordinator.start()
        
	return true
}
```

回到我们之前 `ListViewController` 的例子，我们重新梳理下，看看如何结合 Coordinator。假设需求如下：
- 如果用户未登录状态，显示登录视图
- 如果用户登录了，则显示主视图列表

定义 `AppCoordinator` 如下：

```swift
final class AppCoordinator: Coordinator {
	fileprivate let navigationController: UINavigationController

	init(with navigationController: UINavigationController) {
		self.navigationController = navigationController
	}

	override func start() {
		if (isLogined) {
			showList()
		} else {
			showLogin()
		}
	}
}
```

那么如何在 AppCoordinator 中创建和配置 view controller 呢？拿 `LoginViewController` 为例。

```swift
private func showLogin() {
	let loginCoordinator = LoginCoordinator(navigationController: self.navigationController)
	loginCoordinator.delegate = self
	loginCoordinator.start()
	self.childCoordinators.append(loginCoordinator)
}

extension AppCoordinator: LoginCoordinatorDelegate {
    func didLogin(coordinator: AuthenticationCoordinator) {
        self.removeCoordinator(coordinator: coordinator)
        self.showList()
    }
}
```

再来看看如何定义 `LoginCoordinator`：

```swift
import UIKit

protocol LoginCoordinatorDelegate: class {
    func didLogin(coordinator: LoginCoordinator)
}

final class LoginCoordinator: Coordinator {

    weak var delegate:LoginCoordinatorDelegate?
    let navigationController: UINavigationController
    let loginViewController: LoginViewController

    init(navigationController: UINavigationController) {
        self.navigationController = navigationController
        self.loginViewController = LoginViewController()
    }

    override func start() {
        self.showLogin()
    }

    func showLogin() {
        self.loginViewController.delegate = self
        self.navigationController.show(self.loginViewController, sender: self)
    }
}

extension LoginCoordinator: LoginViewControllerDelegate {
    func didLogin() {
        self.delegate?.didLogin(coordinator: self)
    }
}
```

正如 `UIKit` 基于 delegate 的设计，我们靠这种方式真正实现了对 view controller 进行了解耦。

同理 `LoginViewController` 也存在相应的 `LoginViewControllerDelegate` 协议。

```swift
import UIKit

protocol LoginViewControllerDelegate: class {
    func didLogin()
}

final class LoginViewController: UIViewController {
	weak var delegate:LoginViewControllerDelegate?
	……
}
```

这样，一套基本的 Coordinator 方案就出炉了。当然，目前还是非常基础的功能子集，我们完全可以在这个基础上扩展得更加强大。

## 适配多入口

显然，一个成熟的 App 会存在多样化的入口。除了我们一直在讨论的 App 内跳转之外，我们还会遇到以下的路由问题：

- Deeplink
- Push Notifications
- Force Touch

常见的，我们很可能需要在手机上点击一个链接之后，直接链接到 app 内部的某个视图，而不是 app 正常打开时显示的主视图。

[AndreyPanov](https://github.com/AndreyPanov/ApplicationCoordinator) 的方案解决了这个问题，我们需要对 `Coordinator` 再进行拓展。

```swift
protocol Coordinator: class {
    func start()
    func start(with option: DeepLinkOption?)
    var childCoordinators: [Coordinator] { get set }
}
```

增加了一个 `DeepLinkOption?` 类型的参数。这个有什么用呢？

我们可以在 `AppDelegate` 中针对不同的程序唤起方式都用 Coordinator 进行启动。

```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
  let notification = launchOptions?[.remoteNotification] as? [String: AnyObject]
  let deepLink = buildDeepLink(with: notification)
  self.applicationCoordinator.start(with: deepLink)
  return true
}

func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any]) {
  let dict = userInfo as? [String: AnyObject]
  let deepLink = buildDeepLink(with: dict)
  self.applicationCoordinator.start(with: deepLink)
}

func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([Any]?) -> Void) -> Bool {
  let deepLink = buildDeepLink(with: userActivity)
  self.applicationCoordinator.start(with: deepLink)
  return true
}
```

利用 `buildDeepLink` 方法对不同的入口方式判断输出相应的 flow 类型。

我们对之前的业务需求进行相应的扩展，假设存在以下三种不同的 flow 类型：

```swift
enum DeepLinkOption {
  case login // 登录
  case help // 帮助中心
  case main // 主视图
}
```

我们来实现下 `AppCoordinator` 中的新 `start` 方法：

```swift
override func start(with option: DeepLinkOption?) {
    //通过 deeplink 启动
    if let option = option {
        switch option {
        case .login: runLoginFlow()
        case .help: runHelpFlow()
        default: childCoordinators.forEach { coordinator in
            coordinator.start(with: option)
        	}
        }
    //默认启动
    } else {
        ……
    }
}
```

## 总结

本文专门介绍了 Coordinator 模式来对 iOS 开发中的 navigator 进行了深度的解耦。然而当今仍没有权威标准的解决方案，感兴趣的同学建议去 github 参考下其他更优秀的实践方案。

接下来的第三篇文章计划就 Swift 语言的 extension 语法进行深入的介绍和分析，它是构建「类 Vue + Vuex」打法的核心之一。