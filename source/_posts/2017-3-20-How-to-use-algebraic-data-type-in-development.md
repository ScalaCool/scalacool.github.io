---
title: 如何利用 ADT 良好地组织业务
---

在用 `Scala` 做业务开发的时候，我们大都会用到 `case class` 以及「模式匹配」，本文将介绍如何利用 `case class` 模拟 `ADT` 并在日常开发中利用 `ADT` 良好地组织业务。

## ADT（代数数据类型）

> 在计算机编程、特别是函数式编程与类型理论中，`ADT` 是一种 组合类型（`composite type`）。例如，一个类型由其它类型组合而成。两个常见的代数类型是 `product`（积）类型 (比如 `tuples` 和 `records` )和`sum`（和）类型，它也被称为 `tagged unions` 或 `variant type`。

这里简单介绍一下常见的两种代数类型 `product`（积）类型和 `sum`（和）类型

### 计数（Counting）

在介绍两种常见代数类型之前我们先介绍一下 「计数」 的概念，方面理解后面所要介绍的内容。

为了将某个类型与我们熟悉的数字代数相关联，我们可以计算该类型有多少种取值，例如 `Bool` 类型：

```
data Bool = true | false
```

可以看到 `Bool` 类型有两种可能的取值，要么是 `false`, 要么是 `true`, 所以这里我们暂时将数字 `2` 与 `Bool` 类型相关联。

如果 `Bool` 类型是 `2`，那么何种类型是 `1` 呢，在 `Scala` 中 `Unit` 类型只有一种取值：

```scala
scala> val a = ()
a: Unit = ()
```

所以这里我们将数字 `1` 与 `Unit` 类型相关联。

有了 「计数」 这个概念，接下来我们介绍常见的两种代数类型。

### product

`product` 可以理解为是一种 组合`（combination）`，可以通过我们熟悉的 `*`（乘法） 操作来产生，对应的类型为：

```
data Mul a b = Mul a b
```
也就是说， `a * b ` 类型是同时持有 `a` 和 `b` 的容器。

在 `Scala`中，`tuples`（元组）就是这样的，eg：

```scala
scala> val b = (Boolean, Boolean)
b: (Boolean.type, Boolean.type) = (object scala.Boolean,object scala.Boolean)
```
我们定义的 「元组 `b`」 就是两个 `Boolean` 类型的组合，也就是说，「元组 `b`」 是同时拥有两个 `Boolean` 类型的容器，可以通过我们前面介绍的 「计数」 的概念来理解：

`Boolean` 类型有两种取值，当 `Boolean` 和 `Boolean` 通过 `*` 操作进行组合时：

```scala
2 * 2 = 4
```

所以我们定义的 「元组 `b`」 有四种可能的取值，我们利用 「模式匹配 来列举这四种取值：

```scala
b match {
  case (true, true) => ???
  case (true, false) => ???
  case (false, true) => ???
  case (false, false) => ???
}
```

### sum

`sum` 可以理解为是一种 `alternation`（选择），可以通过我们熟悉的 `+ （加法）` 操作来产生，对应的类型为：

```
data Add a b = AddL a | AddR b
```

`a + b` 是一个和类型，同时拥有 `a` 或者 `b`。

注意这里是 a `或者` b，不同于上面介绍的 `*`。

这里可能就会有疑惑了，为什么 `+`（加法） 是 `或者` 呢，我们依然通过前面介绍的 「计数」 的概念来理解：

在 `Scala` 中 `Option` 就是一种 `sum` 类型，eg：

```scala
scala> val c = Option(false)
c: Option[Boolean] = Some(false)
```
`option[Boolean]` 其实是 `Boolean` 与 `None` 通过 `+` 操作得到的，分析：

`Boolean` 有两种取值，`None` 只有一种，那么：

```scala
2 + 1 = 3
```

所以我们定义的 `c: Option[Boolean]` 有三种可能的取值，我们利用 「模式匹配」 来列举这三种取值：

```scala
c match {
  case Some(true) => ???
  case Some(false) => ???
  case None => ???
}
```
我们可以看到，`Option[Boolean]` 类型的取值要么是 `Boolean` 类型，要么是 `None` 类型，这两种类型是`不能同时`存在的，这一点与 `product` 类型不同。并且 `sum` 类型是一个「闭环」，类型的定义已经包含了所有可能性，绝无可能会出现非法状态。

## 在业务中使用 ADT

我们在利用 `Scala` 的 `case class` 组织业务的时候其实就已经用到了 `ADT`，eg：

```scala
sealed trait Tree
case class Node(left: Tree, right: Tree) extends Tree
case class Leaf[A](value: A) extends Tree
```
在上面 「树」 结构的定义中，`Node`、`Leaf` 通过继承 `Tree`，通过这种继承关系而得到的类型就是 `ADT` 中的 `sum`，而构造 `Node` 和 `Leaf` 的时候则是 `ADT` 中的 `product`。大家可以通过我们前面所说的 「计数」的概念来验证。

上面的代码中出现了一个关键字 `sealed`，我们先介绍一下这个关键字。

### Sealed

前面我们说过 `sum` 类型是一个 「闭环」，当我们将「样例类」的「超类」声明为 `sealed` 后，该超类就变成了一个 「密封类」，「密封类」的子类都必须在与该密封类相同的文件中定义，从而达到了上面说的「闭环」的效果。

比如我们现在要为上面的 `Tree` 添加一个 `EmptyLeaf`：

```scala
case object EmptyLeaf extends Tree
```
那这段被添加的代码必须放在我们上面声明 `Tree` 的那个文件里面，否则会报错。

另外，`sealed` 关键字也可以让「编译器」检查「模式」语句的完整性,eg：

```scala
sealed trait Answer
case object Yes extends Answer
case object No extends Answer

val x: Answer = Yes

x match {
    case Yes => println("Yes")
}

<console>: warning: match may not be exhaustive.
It would fail on the following input: No
       x match {
       ^
```

「编译器」会在编译阶段提前给我们一个可能会出错的「警告（warning）」

### 利用 ADT 来良好地组织业务

前面说了这么多，终于进入正题了，接下来我们以几个例子来说明如何在开发中合理地利用 `ADT`。

#### 场景一

现在我们要开发一个与「优惠券」有关的业务，一般情况下，我们可能会这么去定义优惠券的结构：

```scala
case class Coupon (
  id: Long,
  baseInfo: BaseInfo,
  `type`: String,
  ...
)

object Coupon {

  //优惠券类型
  object Type {

    // 现金券

    final val CashType       = "CASH"

    //折扣券

    final val DiscountType   = "DISCOUNT"

    // 礼品券

    final val GiftType       = "GIFT"
  }
}
```

分析：这样去定义 「优惠券」 的结构也能解决问题，但是当 「优惠券」 类型增多的时候，会出现很多的冗余数据。比如说，不同的优惠类型，会有不同优惠信息，这些优惠信息在结构中对应的字段也会有所不同：

```scala
case class Coupon (
  id: Long,
  baseInfo: BaseInfo,
  `type`: String,

  // 仅在优惠券类型是代金券的时候使用

  leastCost: Option[Long],
  reduceCost: Option[Long],

  //仅在优惠券类型是折扣券的时候使用

  discount: Option[Int],

  //仅在优惠券是礼品券的时候使用

  gift: Option[String]
)
```

从上定义的结构我们可以看到，当我们使用 「礼品券」 的时候，有三个字段（`leastCost`、`reduceCost`、`discount`）的值是 `None`，因为我们根本就用不到。由此可以看出，当 「优惠券」 的结构比较复杂的时候，可能会产生大量的冗余字段，从而使我们的代码看上去非常臃肿，同时增加了我们的开发难度。

##### 利用 `ADT` 重新组织：

分析：通过上面的讨论，我们知道 「优惠券」 可能有多种类型，所以，我们利用 `ADT` 将不同的「优惠券」分离开来：

```scala

// 将每一种优惠券公共的部分抽离出来

sealed trait Coupon {
  val id: Long
  val baseInfo: BaseInfo
  val `type`: String
  ...
}

case class CashCoupon (
  id: Long,
  baseInfo: BaseInfo,
  `type`: String = Coupon.Type.CashType,
  leastCost: Long,
  reduceCost: Long,
  ...
) extends Coupon

case class DiscountCoupon (
  id: Long,
  baseInfo: BaseInfo,
  `type`: String = Coupon.Type.DiscountType,
  discount: Int,
  ...
) extends Coupon

case class GiftCoupon (
  id: Long,
  baseInfo: BaseInfo,
  `type`: String = Coupon.Type.GiftType,
  gift: String,
  ...
) extends Coupon
```

同过合理地利用 `ADT` 我们使每一种「优惠券」的结构更加清晰，同时也减少了字段的冗余。并且，如果在业务后期我们还要增加别的 「优惠券」类型，我们不用修改原来的结构，只需要再重新创建一个新的 `case class` 就可以了：

比如我们在后期增加了一种叫 「团购券」 的优惠券，我们不需要修改原来定义的结构，直接：

```scala
case class GroupCoupon (
  id: Long,
   baseInfo: BaseInfo,
   `type`: String,
   dealDetail: String
)
```

并且在利用「模式匹配」的时候，我们可以像操作代数那样：

```scala
coupon match {
  case c: CashCoupon => ???       // 我们可以直接在匹配完成之后使用 coupon
  case c: DiscountCoupon => ???
  case c: GiftCoupon => ???
  case c: GroupCoupon => ???
}

// 如果是我们用 ADT 改造前的数据结构，那模式匹配就会变成：

coupon.`type` match {
  case Coupon.Type.CashType => ???      // 我们只能使用 coupon.`type`
  case Coupon.Type.GiftType => ???
  case Coupon.Type.DiscountType => ???
  case Coupon.Type.GroupCoupon => ???
}
```

通过本例，我们可以看到，利用 `ADT` 重新组织之后的数据结构减少了数据的冗余，并且在使用「模式匹配」的时候更加清晰，在功能上也更加强大。

#### 场景二

假设我们现在要实现一个「抽奖活动」的业务：

1. 该抽奖活动有开始时间和结束时间，结束之后活动就不能参与了

2. 该抽奖活动有一等奖、二等奖、三等奖以及不中奖

3. 每种奖项都有一定的中奖概率，用户可能会中奖可能不会中奖

根据上面的需求描述，我们可以很快地构建出如下结构：

```scala
//定义活动
case class Activity (
  id: Long,
  name: String,
  startAt: DateTime,
  endAt: DateTime,
  firstPrize: Long,      //用奖品的id来关联不同奖项对应的奖品
  secondPrize: Long,
  thirdPrize: Long,
  ...
)

//定义奖品
case class Pize (
  id: Long,
  rate: Float,
  quantity: Int,
  detail: String,
  ...
)

//定义用户
case class User (
  id: Long,
  name: String,
  sex: String,
  phone: String,
  ...
)
```
定义好基本的结构之后，我们要去描述用户参加「抽奖活动」这一行为的「结果」，一般情况下， 我们会构造出如下结构：

```scala
case class UserActivity (
  id: Long,
  userId: Long,
  activityId: Long,
  status: Int,                 
  prizeType: Option[Long],   //奖品的类型，判断是几等奖
  prize: Option[Long]        //奖品id
)

object UserActivity {
  object Status {
    final val HasPrize = 1
    final val NoPrize = 2
    final val ActivityExpired = 0
  }
}
```
现在我们就利用这些结构来完成一些基本的需求，假设我们要根据用户参与「抽奖活动」的「结果」来渲染页面：

分析：用户参与抽奖的结果有大概如下几种：

1. 成功参与活动，并且中奖

2. 成功参与活动，没有中奖

3. 活动已经过期，用户不能参与活动

那我们可能会这样去组织我们的逻辑：

```scala
def f(ua: UserActivity) = ua.status match {
  case UserActivity.Status.HasPrize => ???
  case UserActivity.Status.NoPrize => ???
  case UserActivity.Status.ActivityExpired => ???
}
```
我们根据抽奖结果「状态」的不同而去渲染不同的页面，这样似乎能解决问题，但是，如果我们想要在「模式匹配」完成之后根据用户信息，奖品信息以及活动信息来渲染页面的话，就需要：

```scala
def f(ua: UserActivity) = ua.status match {
  case UserActivity.Status.HasPrize => {
    //假设用户中奖了，我们需要显示用户的信息，活动信息以及奖品信息,则：
    getUser(ua.userId)          //获取用户信息
    getActivity(ua.activityId)  //获取活动信息
    getPrize(ua.prize)          //获取奖品信息
    ...
  }
  case UserActivity.Status.NoPrize => ???
  case UserActivity.Status.ActivityExpired => ???
}
```

我们在每一次模式匹配完成之后都要去做一大堆获取信息的工作，如果后期需要的信息量很多，那么这里的代码将显得十分臃肿。

##### 利用 `ADT` 重新组织：

通过上面分析，我们知道，用户参与活动的过程中会涉及到许多信息，那我们就利用 `ADT` 将这些信息全部构造在一起：

```scala
case class UserActivity (
  id: Long,
  user: User,
  activity: Activity,
  prize: Option[Prize],
  status: Int
)
```
通过这样组织，我们的信息就非常完备了，在之前的「模式匹配」中，我们可以直接去用这些数据，而不用再次去获取。但是上面的结构还存在一些不足：

1. 我们利用模式匹配的时候还是要根据活动的「状态」去匹配，参考「场景一」

2. 如果后续业务变得复杂 `UserActivity` 中的字段可能会很多

所以我们能否再将数据进一步抽象？

分析：用户参加活动的结果无非就是我们上面列举的几个状态，那我们就将这些状态利用 `ADT` 再重新组织一下：

```scala
sealed trait Status {
  val id: Long,
  val detail: StatusDetail
}

case calss StatusDetail {
  user: User,
  activity: Activity
  prize: Option[Prize]
}

case class HasPrize (
  id: Long,
  detail: StatusDetail
) extends Status

case class NoPrize (
  id: Long,
  detail: StatusDetail
) extends Status

case class ActivityExpired (
  id: Long,
  detail: StatusDetail
) extends Status
```

通过上面的改造，用户参与活动的状态变得更加清晰，同时对外暴露的结构也变得更加简洁，在使用「模式匹配」的时候，我们就可以：

```scala
def f(status: Status) = status match {
  case HasPrize(id, detail) => ???        //可以直接使用status
  case NoPrize(id, detail) => ???
  case ActivityExpired(id, detail) => ???
}
```

通过本例，我们可以发现，通过 `ADT` 可以将数据`高度抽像`，使得数据的「具体信息」变得简洁，同时「概括能力」变得更强，数据更加「完备」。

## 延伸阅读

[Algebraic data type](https://wiki.haskell.org/Algebraic_data_type)

[The Algebra of Algebraic Data Types, Part 1](http://chris-taylor.github.io/blog/2013/02/10/the-algebra-of-algebraic-data-types/)

[The Algebra of Algebraic Data Types, Part 2](http://chris-taylor.github.io/blog/2013/02/11/the-algebra-of-algebraic-data-types-part-ii/)

[The Algebra of Algebraic Data Types, Part 3](http://chris-taylor.github.io/blog/2013/02/13/the-algebra-of-algebraic-data-types-part-iii/)
