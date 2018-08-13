---
title: 前端重构范式之 float layout
author: Rhyme/Captain
tags:
- 前端开发
- ~前端重构范式
- ^Rhyme
- ^Captain
description: 如果让我用一句话来总结浮动布局，就是浮动布局是一种排队的艺术。你可以向左排队、向右排队，关键在于你如何去组织他们。
date: 2018-08-13
---

如果让我用一句话来总结浮动布局，就是**浮动布局是一种排队的艺术。**你可以向左排队、向右排队，关键在于你如何去组织他们。如果你去看`float`的属性值就会发现它最为重要的无非就是`left`和`right`，而他们顾名思义就是向左或向右进行浮动。在我们的网页布局中，凡是涉及到水平布局的，大都会涉及到浮动，例如我们的导航栏，水平方向的网页布局，他们都或多或少的在水平方向进行向左或向右的**排队**。因此，如果说**网页的布局是摆放一个个盒子的艺术，那么浮动布局就是在水平方向摆放盒子的艺术。**

 那么我们为什么要在水平方向进行布局呢？这就犹如**多一个游戏规则与少一个游戏规则的区别**。我们可以用我们小时候玩过的**堆积木游戏**来做一个形象的比喻。**普通的布局**就如同**一个盒子叠着一个盒子**的游戏规则，我们**在同一个水平方向只能放一个盒子**，因此只能达到下图中的效果

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-10_01-04-47.jpg)

而**浮动布局允许你在同一个水平方向可以放置多个盒子，共同组成一个大盒子**，也就是说**原来的一个盒子不再是一个简单的盒子，它的内部可以由各种复杂的布局组成**， 因此你就可以很轻易得实现下图中的效果，虽然你乍一看下方的布局好像有违游戏规则，但是只要你细心一点进行下图中的划分，就可以发现其实它的最终的规则没有变，依旧是普通布局中的一个盒子叠一个盒子的游戏规则，**只不过是它的盒子结构变得更丰富，功能更加强大了了而已**。因此明白了这一点，你也就能明白了为什么要有浮动布局，因为，**它可以实现更多样的布局来实现各种各样的需求。**

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-10_01-21-00.jpg)

好，现在你对这个积木游戏有个一定的了解，也对浮动布局有了一个总体的认识，但是我们知道一个厉害的游戏玩家，并不是因为他比其他人要有天赋，大部分原因是因为他**对游戏规则更为了解**。因此要想成为一个厉害的前端玩手，你就需要对前端的游戏规则更为了解。所以，接下来就让我们正式走近这个积木游戏的大门，尽情得探索和玩耍吧！

## 1. 网页中的地基-文档流

首先作为积木游戏的入门，我们需要对最基础的游戏规则做个了解，而这个最基础的游戏规则在网页设计中被称作「文档流」。你可以把积木游戏中的一个个盒子看做是我们页面中的一个个标签，例如`<div></div>`标签就可以看做是一个盒子。但是有一点不同的是，在我们的网页中，有两种类型的盒子，一种是被称为**块元素**的盒子，类似`div`，另一种是被称为**内联元素**的盒子，例如`span`。这两种类型的盒子在文档流中或脱离文档流的时候会表现出不同的性质，直接影响了我们的网页布局。所以接下来我们将介绍这两种类型的盒子在文档流中具有什么特点？至于脱离文档流之后的特点，会在后面「元素的变性」那一节中讲述。

首先我们需要了解什么是文档流？

> **如果说把一个复杂的网页想象成一栋漂亮的楼房,那么这栋楼的地基就是文档流。上面的楼房就是各种定位和浮动的综合体。**（定位顾名思义就是负责元素在网页中的位置，具体会在后面的系列中做详细地介绍）

我们所创建的元素默认都在文档流中。例如以下代码中的`div`和`h2`标签都处于文档流中

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>float layout</title>
</head>
<body>
<div>
    <h2>我处在文档流中</h2>
</div>
</body>
</html>
```

了解了文档流，接下来我们将介绍两种类型的盒子(块元素与内联元素)在文档流中具有什么特点

#### 霸道的盒子-块元素

> `div`,`p`等标签被称为块元素

1. 块元素在**文档流**中很是霸道，哪怕它的实际大小只有`100px`,但是它还是独占一行，且自上而下排列

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-12_13-12-41.jpg)

示例代码：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>霸道的盒子-块元素</title>
    <style>
        .box {
            width: 100px;
            height: 100px;
        }
        .box1 {
            background-color: aqua;
        }
        .box2 {
            background-color: aquamarine;
        }
        .box3 {
            background-color: bisque;
        }
    </style>
</head>
<body>
<div class="box box1"></div>
<div class="box box2"></div>
<div class="box box3"></div>
</body>
</html>
```

2. 霸道的块元素在**文档流**中默认宽度是父元素的100%,它的`width`属性值默认为`auto`,当元素的`width`属性值为`auto`时,此时修改元素左右内边距不会修改该元素本身的宽度大小，而是会自动修改该元素的宽度，来适应内边距，下图中绿色的块元素就添加了一个左`100px`的内边距,你会发现绿色的块元素的宽度大小并没有改变，而是自动调整了宽度来适应内边距的改变

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-12_13-19-09.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>霸道的盒子-块元素</title>
    <style>
        .box1 {
            height: 100px;
            background-color: aqua;
        }
        .box2 {
            /*添加左内边距不会影响该元素的宽度大小*/
            padding-left: 100px;
            height: 100px;
            background-color: aquamarine;
        }
        .box2-child {
            width: 100px;
            height: 100px;
            background-color: bisque;
        }
    </style>
</head>
<body>
<div class="box1"></div>
<div class="box2">
    <div class="box2-child">

    </div>
</div>
</body>
</html>
```

3. 块元素在**文档流**中的高度可以说是终于没有那么霸道了，它的高度默认是由它里面的内容撑开的

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-12_13-28-24.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>霸道的盒子-块元素</title>
    <style>
        .box1 {
            background-color: aqua;
        }
    </style>
</head>
<body>
<div class="box1">a</div>
</body>
</html>
```

最后总结一下**块元素**在**文档流**中的特点：

1. 块元素很霸道，哪怕自身大小只有`100px`,它也会独占一行
2. 块元素的宽度默认是父元素的100%，width属性值为auto,会自动调整宽度
3. 块元素的高度是它唯一不那么霸道的地方，默认被里面的内容撑开

> Tips: 一定要注意是在文档流中，这点对于之后理解浮动布局特别重要。

#### 最环保的盒子-内联元素

> `span`、`a`等标签属于内联元素

1. 相比于块元素的霸道，内联元素则要节约环保很多，它在**文档流**中仅占自身大小,也就是说宽高默认都被其中的内容撑开,且从左向右排列

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-12_13-41-04.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>最环保的盒子-内联元素</title>
    <style>
        .box1 {
            background-color: aqua;
        }
        .box2 {
            background-color: aquamarine;
        }
        .box3 {
            background-color: yellow;
        }
    </style>
</head>
<body>
<span class="box1">a</span>
<span class="box2">a</span>
<span class="box3">a</span>
</body>
</html>
```

2. 内联元素不能设置宽和高，也就是说给他们设置`width`或者`height`属性是没有用的，你看它们是有多节约，给它们它们都不要一点多的。注意观察示例中的代码，设置了宽和高是失效的

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-12_13-45-12.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>最环保的盒子-内联元素</title>
    <style>
        .box1 {
            /*不能给内联元素设置宽和高*/
            width: 100px;
            height: 100px;
            background-color: aqua;
        }
    </style>
</head>
<body>
<span class="box1">a</span>
</body>
</html>
```

3. 一行中放不下时，内联元素会自动在下一行从左向右排列

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-12_13-49-36.jpg)

最后我们一起来总结一下**内联元素**在**文档流**中的特点

1. 内联元素很环保，只占用元素本省的大小，从左向右排列
2. 给内联元素设置宽高是无效的，它依旧只占用元素本省的大小
3. 一行中放不下时，内联元素会自动在下一行从左向右排列

> Tips: 这里再强调一遍，以上都是在文档流中的特点，这点对于之后理解浮动布局特别重要。因为，元素浮动之后会脱离文档流，以上这些约束也就不存在了

## 2.初见浮动

我们已经解读了文档流的游戏规则，因此我们可以很轻易得用三个块元素实现以下的效果

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-05_15-24-06.jpg)

但是在我们网页设计中经常会有这样的需求，三个`div`在同一行的布局效果。我们可以清晰得分析出以下图片是三个`div`布局的水平排列。因为在网页设计的时候我们大都采用`div`来进行网页的布局。

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-12_14-20-22.jpg)

因此我们就要解决这个问题，如何让3个`div`块元素水平排列？

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-05_15-30-33.jpg)

这个时候我们就要思考既然块状元素在文档流中独占一行，达不到我想要的效果，那如果我让块状元素脱离文档流，是不是就没有这个限制了呢？答案确实如此，以上的效果，就是通过为`div`块元素设置浮动属性`float:left`来使得这些块元素**脱离文档流向左浮动**。

> 补充：脱离文档流可以理解为在原有的地基上新建一层楼进行设计，新建的楼层不完全遵守地基中的游戏规则，可以使得块状元素不再独占一行，具体的会在之后进行介绍

以上实例的代码如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>测试浮动布局</title>
    <style>
        .box{
            width: 100px;
            height: 100px;
        }
        .box1{
            background-color: aqua;
        }
        .box2{
            background-color: red;
        }
        .box3{
            background-color: black;
        }
    </style>
</head>
<body>
<div class="box box1" style="float: left"></div>
<div class="box box2" style="float: left"></div>
<div class="box box3" style="float: left"></div>
</body>
</html>
```

## 3. 解读浮动的游戏规则

到这里你已经了解了最基础的游戏规则-文档流，也对浮动布局有了一个初步的认识，但是我们要想在地基之上搭建出漂亮的房子，还需要进一步的解读浮动的游戏规则

### 3.1 元素的层级

> **浮动使得元素脱离了文档流，可以理解元素是在文档流(地基)之上进行的活动。明白了这一点，你就可以明白接下来的这句话:浮动的元素对文档流(地基)中的元素是不可见的，因为它脱离了地基，位于地基之上。**

浮动是在地基之上进行的活动，那么它难免会带来一个问题，就是如果浮动元素与地基上原有的元素或者别的脱离文档流的元素重叠了，这个时候应该怎么办呢？到底是谁说了算呢？别急，你想到的，他们也都想到了，并且定好了一系列的游戏规则。而我们作为玩家，只要知道这些规则的存在，并且学以致用就可以了。我们这一节所讲的「元素的层级」讲的就是这些规则。

首先在网页中元素的归属可以大致分为两种，一种是在文档流中，另一种是不在文档流中，也就是脱离文档流。在文档流中的元素属于**低层级**，脱离文档流的元素属于**高层级**。那顾名思义，高层级的元素会盖住低层级的元素，那展现在视觉效果上就是盖住的那一部分我只能看见高层级元素，看不见低层级元素。而浮动布局是一种脱离文档流的艺术，因此浮动元素属于高层级。但是这也只解决了一个问题，就是文档流与非文档流的元素层级的问题，那非文档流的元素之间呢，如果它们覆盖了，又是什么样的游戏规则呢？

首先所有非文档流的元素也就是脱离文档流的元素在层级上的地位都是相同的。具体的覆盖规则有两条

1. `z-index`属性值大的覆盖属性值小的
2. `z-index`属性值一样的情况下，后面的元素盖住前面的元素

接下来是一些示例，可以加深你对以上这些结论的理解

> **结论1：浮动元素处于高层级，会覆盖处于低层级的文档流元素**

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_21-27-58.jpg)

示例代码：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>元素层级</title>
    <style>
        .box1{
            float: left; // 注意这里设置了浮动属性
            width: 100px;
            height: 100px;
            background-color: aqua;
        }
        .box2{
            width: 200px;
            height: 200px;
            background-color: red;
        }
    </style>
</head>
<body>
<div class="box1"></div>
<div class="box2"></div>
</body>
</html>
```

> **结论2：脱离文档流的元素都处于高层级，它们地位是相等的，覆盖规则为：后面的元素会覆盖前面的元素**

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_21-33-29.jpg)

示例代码：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>测试浮动布局</title>
    <style>
        .box1 {
            float: left; // 开启浮动定位，元素处于高层级2
            width: 100px;
            height: 100px;
            background-color: aqua;
        }

        .box2 {
            position: absolute; // 开启绝对定位，元素处于高层级2
            top: 50px;
            left: 50px;
            width: 100px;
            height: 100px;
            background-color: red;
        }

        .box3 {
            position: relative; // 开启相对定位，元素处于高层级2
            left: 100px;
            top: 100px;
            width: 100px;
            height: 100px;
            background-color: black;
        }
    </style>
</head>
<body>
<div class="box1"></div>
<div class="box2"></div>
<div class="box3"></div>
</body>
</html>
```

> **结论3：脱离文档流的元素可以设定`z-index`属性来提升自己的层级，`z-index`属性值越大的越优先显示，默认为0**

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_21-35-42.jpg)

示例代码：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>测试浮动布局</title>
    <style>
        .box1 {
            float: left; // 开启了浮动定位，元素处于层级2
            z-index: 1;  // 设置z-index 优先级为1 
            width: 100px;
            height: 100px;
            background-color: aqua;
        }

        .box2 {
            position: absolute; // 开启了绝对定位，元素处于层级2
            z-index: 2; // 设置z-index 优先级为2
            top: 50px;
            left: 50px;
            width: 100px;
            height: 100px;
            background-color: red;
        }

        .box3 {
            position: relative; // 开启了相对定位，元素处于层级2
            z-index: 1; // 设置z-index 优先级为1
            left: 100px;
            top: 100px;
            width: 100px;
            height: 100px;
            background-color: black;
        }
    </style>
</head>
<body>
<div class="box1"></div>
<div class="box2"></div>
<div class="box3"></div>
</body>
</html>
```

> 补充：
>
> 1. `z-index`属性的设置只对开启浮动或定位的元素有效
> 2. 绝对定位:元素相对于最近的定位祖先元素进行定位
> 3. 相对定位:元素相对于元素原先在文档流中的位置进行定位

最后，我们来总结一下元素的层级关系：

1. 脱离文档流的元素处于高层级，文档流中的元素属于低层级，高层级的元素会覆盖低层级的元素
2. 浮动会使得元素脱离文档流，因此浮动的元素会覆盖文档流中的元素
3. 脱离文档流的元素地位都是相等的，都属于高层级，具体覆盖规则为：
   1. `z-index`相同时，后面的元素覆盖前面的元素
   2. `z-index`不同时，优先显示`z-index`属性值大的元素

### 3.2 浮动的边界

浮动会使得元素脱离文档流，尽可能地向左上(`float:left`)或右上(`float:right`)浮动,然而你浮动归浮动，那你什么时候才会停止浮动呢？这个就是我们接下来要讨论的话题

#### 3.2.1 飞不出如来佛祖的掌心

> **浮动元素不会超过它的父元素的边界**，下图中红色的浮动元素不会超过`body`父元素的边界，蓝色的浮动元素不会超过黄色的父元素

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_22-29-46.jpg)

示例代码：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>浮动的边界</title>
    <style>
        body {
            background-color: antiquewhite;
        }

        .father {
            width: 200px;
            height: 200px;
            background-color: yellow;
            margin: 0 auto;
        }

        .box1 {
            float: left;
            width: 100px;
            height: 100px;
            background-color: red;
        }

        .box2 {
            float: right;
            width: 100px;
            height: 100px;
            background-color: aqua;
        }
    </style>
</head>
<body>
<div class="box1">

</div>
<div class="father">
    <div class="box2">

    </div>
</div>
</body>
</html>
```

#### 3.2.2 不能超队 

> **浮动元素在浮动过程中遇到其他浮动元素就要停止浮动，这个时候的队伍就像在排队一样**

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_22-42-51.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>测试浮动布局</title>
    <style>
        .box1 {
            float: left;
            width: 100px;
            height: 100px;
            background-color: aqua;
        }

        .box2 {
            float: left;
            width: 100px;
            height: 100px;
            background-color: red;
        }

        .box3 {
            float: left;
            width: 100px;
            height: 100px;
            background-color: black;
        }
    </style>
</head>
<body>
<div class="box1"></div>
<div class="box2"></div>
<div class="box3"></div>
</body>
</html>
```

> 以下是一行浮动元素的溢出情况，可以看到它们在一行装不下的时候会进行换行浮动

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_22-59-19.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>不能超队</title>
    <style>
        .box {
            float: left;
            width: 100px;
            height: 100px;
            background-color: aqua;
            border: 1px solid black;
        }
    </style>
</head>
<body>
<div class="box"></div>
<div class="box"></div>
<div class="box"></div>
<div class="box"></div>
<div class="box"></div>
<div class="box"></div>
</body>
</html>
```

> 在以下示例中，三块元素都是浮动元素，前两块向左浮动，黑色的向右浮动，你会发现即使第一行有足够的空间，但是第三块黑色的浮动元素就是上不去，原因还是那句话**不能插队，也就是不能超过兄弟元素**

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_23-08-11.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>不能超队</title>
    <style>
        .box1 {
            float: left;
            width: 600px;
            height: 100px;
            background-color: aqua;
        }

        .box2 {
            float: left;
            width: 600px;
            height: 100px;
            background-color: yellow;
        }

        .box3 {
            float: right;
            width: 100px;
            height: 100px;
            background-color: black;
        }
    </style>
</head>
<body>
<div class="box1"></div>
<div class="box2"></div>
<div class="box3"></div>
</body>
</html>
```

#### 3.2.3 被墙了

> **浮动元素不能超过前面的文档流块状元素**，我们查看示例代码，可以发现浮动元素**在源代码中的结构**位于文档流块状元素之后，解决办法可以将它们在代码结构上交换位置即可

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_22-47-28.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>被墙了</title>
    <style>
        .box1 {
            height: 100px;
            background-color: yellow;
        }
        .box2 {
            float: left;
            width: 100px;
            height: 100px;
            background-color: aqua;
        }
    </style>
</head>
<body>
    <div class="box1"> // 文档流块状元素

    </div>
    <div class="box2"> // 浮动元素

    </div>
</body>
</html>
```

交换位置之后的效果如下

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_22-54-26.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>交换位置</title>
    <style>
        .box1 {
            height: 100px;
            background-color: yellow;
        }
        .box2 {
            float: left;
            width: 100px;
            height: 100px;
            background-color: aqua;
        }
    </style>
</head>
<body>
    <div class="box2"> // 浮动元素

    </div>
    <div class="box1"> // 文档流块状元素

    </div>
</body>
</html>
```

最后让我们来总结一下浮动的边界：

1. 浮动的元素飞不出如来佛祖的掌心，这里的如来佛祖指的是它的父元素
2. 浮动元素之间得排好队，不能随便插队
3. 浮动元素不能前面的文档流块状元素

### 3.3 元素变性

在之前我们有详细介绍过元素在文档流中的性质，然后，元素在脱离文档流之后性质会发生很大的改变，接下来就让我们来看看元素都发生了哪些改变，我们将分别从块元素和内联元素说起

#### 3.3.1 块状元素

块状元素在**文档流**中的特点：独占一行，宽度为父元素的100%，高度被内容撑开

块状元素**浮动**之后的特点：宽度和高度都被内容撑开，但是可以设置宽和高

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_23-17-46.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>元素变性</title>
    <style>
        .box1 {
            background-color: aqua;
        }

        .box2 {
            float: left;
            background-color: yellow;
        }

    </style>
</head>
<body>
<div class="box1">a</div>
<div class="box2">a</div>
</body>
</html>
```

#### 3.3.2 内联元素

内联元素在**文档流**中的特点：不能设置宽度和高度，宽度和高度都被内容撑开

内联元素**浮动**之后的特点：可以设置宽度和高度，宽度和高度依旧是被内容撑开

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_23-24-16.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>元素变性</title>
    <style>
        .span1 {
            width: 100px;
            height: 100px;
            background-color: yellow;
        }
        .span2 {
            float: left;
            width: 100px;
            height: 100px;
            background-color: aqua;
        }
    </style>
</head>
<body>
<span class="span1">a</span>
<span class="span2">a</span>
</body>
</html>
```

**最后让我们总结一下元素的变性：**

**浮动之后，会改变元素的在文档流中的性质，不管是块状元素还是内联元素，最终都会变成一个块状元素和内联元素的综合体：不独占一行，可以设置宽和高，宽高默认被内容撑开**

## 4. 副作用-清除浮动

任何东西都有好与坏，我们之前了解了那么多浮动元素的特点，也了解了因为浮动带来的种种变化，然而变化归变化，它也会带来一些问题，这些问题就是我们接下来要解决的所谓的副作用，在这里我们只讲一个最重要的副作用，解决了它在我们的日常开发中就不会有太大问题了，至于其他副作用，个人建议，你只要慢慢从实践中体会积累就行了

### 4.1 高度塌陷

> **浮动具有副作用-高度塌陷**，一般我们需要手动的消除浮动带来的副作用

举一个实际的例子，浮动经常用在导航栏的布局中,例如以下的水滴微信平台的导航栏，其中的导航选项很明显都采用了浮动布局。

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_23-46-04.jpg)

我们先使用浏览器的审查功能来看下清除浮动之后的，也就是正常的效果，我们可以看到此时的`header`占据的大小为下图中的阴影部分，将浮动元素(导航选项)包裹在里面，也就是没有因为浮动失调父元素的高度

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_23-50-29.jpg)

而在我们去掉浮动之后，我们可以发现`header`的高度变为了图中的那么一小块阴影，没有将浮动元素(导航选项)包裹在里面，浮动元素的父元素`header`失去了原有的高度，这就是我们现在讨论的**高度塌陷**问题

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-07_23-55-55.jpg)

高度塌陷会带来很多问题，最明显的就是会**影响页面的布局**，例如以上例子中，当我发生在导航栏发生高度塌陷之后，就会导致下方的页面元素集体上移，甚至会覆盖导航栏

以下是正常的布局，可以发现下面阴影部分的布局没有影响导航栏

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-08_00-02-42.jpg)

以下是发生高度塌陷的布局，可以发现导航栏被下面的布局影响

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-08_00-02-25.jpg)

### 4.2 解决方案

> 我们管高度塌陷的解决方案称作清除浮动，也就是清除浮动带来的副作用

以下是未进行浮动之前，没有发生高度塌陷

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-08_00-14-51.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>高度塌陷之前</title>
    <style>
        .box {
            border: 5px solid black;
        }
        .float-child {
            width: 100px;
            height: 100px;
            background-color: aqua;
        }
        .others {
            height: 100px;
            background-color: yellow;
        }
    </style>
</head>
<body>
    <div class="box">
        <div class="float-child">

        </div>
    </div>
    <div class="others">

    </div>
</body>
</html>
```

这是我们进行浮动之后的情况，你可以看到在元素浮动之后对我们的布局产生了副作用，浮动元素的父元素发生了高度塌陷，只留下黑色的边框，下方的布局往上偏移

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-08_00-17-48.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>发生高度塌陷</title>
    <style>
        .box {
            border: 5px solid black;
        }
        .float-child {
            float: left; // 浮动
            width: 100px;
            height: 100px;
            background-color: aqua;
        }
        .others {
            height: 100px;
            background-color: yellow;
        }
    </style>
</head>
<body>
    <div class="box">
        <div class="float-child">

        </div>
    </div>
    <div class="others">

    </div>
</body>
</html>
```

接下来是我们成功清除浮动带来的副作用之后的例子，我们可以发现父元素的高度塌陷没有了，仿佛父元素被里面的浮动元素撑开一样。

这个清除浮动方法的关键在于以下这个结论的应用：

**一个元素的高度总是由最后一个非浮动子元素绝定的**，至于其中原理，可以自己去实践一下，很多时候关于前端并没有那么多为什么，大部分时候我们只要记住怎样做最好就可以了

为什么说下面这个清除浮动的方法是最好的呢？首先我们评判一个解决方法的好坏的标准是：能解决原有的问题，不会带来新的问题。以下这个方法既解决了高度塌陷的问题吗，又通过`:after`伪类解决了语义化的问题，很好地符合以上的标准。并且在实际开发中，以下这种方法也是我们用的最多的一种。

```css
/*清除浮动*/
.float-father:after {
    content: "";
    display: block;
    clear: both;
}
```

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-08_00-21-39.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>解决高度塌陷</title>
    <style>
        .float-father {
            border: 5px solid black;
        }
        /*清除浮动*/
        .float-father:after {
            content: "";
            display: block;
            clear: both;
        }

        .float-child {
            float: left;
            width: 100px;
            height: 100px;
            background-color: aqua;
        }

        .others {
            height: 100px;
            background-color: yellow;
        }
    </style>
</head>
<body>
<div class="float-father">
    <div class="float-child">

    </div>
</div>
<div class="others">

</div>
</body>
</html>
```

> 总结，在对元素实施浮动操作之后，一定要考虑清除浮动带来的副作用-高度塌陷

## 5. 实战-最佳实践

行之践，则无敌，接下来就让我们动手实践一个简单的页面布局

![](http://p7lga1nbj.bkt.clouddn.com/Xnip2018-08-08_00-57-49.jpg)

示例代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>最佳实践</title>
    <style>
        ul {
            /*取出列表的默认样式*/
            list-style: none;
        }

        li {
            /*为导航项设置向左浮动*/
            float: left;
            /*将行高设置成与父元素一样高，可以实现垂直居中的效果*/
            line-height: 50px;
        }
        /*清除浮动*/
        .fn-clear:after {
            content: "";
            display: block;
            clear: both;
        }

        li span {
            /*设置选项元素的内边距*/
            padding: 6px 13px;
        }

        #header {
            /*设置header的高度为50px*/
            height: 50px;
            /*设置header的背景颜色*/
            background-color: aqua;
        }

        #body-left {
            /*设置body-left向左浮动*/
            float: left;
            /*设置宽度为父元素宽度的20%*/
            width: 20%;
            /*设置高度*/
            height: 500px;
            /*设置背景颜色*/
            background-color: aquamarine;
        }

        #body-center {
            /*设置body-center向左浮动*/
            float: left;
            /*设置宽度为父元素宽度的20%*/
            width: 60%;
            /*设置高度*/
            height: 500px;
            /*设置背景颜色*/
            background-color: aliceblue;
        }

        #body-right {
            /*设置body-right向左浮动*/
            float: left;
            /*设置宽度为父元素宽度的20%*/
            width: 20%;
            /*设置高度*/
            height: 500px;
            /*设置背景颜色*/
            background-color: aquamarine;
        }

        #footer {
            /*设置footer的高度*/
            height: 80px;
            /*设置footer的背景颜色*/
            background-color: antiquewhite;
        }
    </style>
</head>
<body>
<div id="header" class="fn-clear">
    <ul>
        <li><span>导航</span></li>
        <li><span>导航</span></li>
        <li><span>导航</span></li>
        <li><span>导航</span></li>
        <li><span>导航</span></li>
        <li><span>导航</span></li>
    </ul>
</div>
<div id="body" class="fn-clear">
    <div id="body-left"></div>
    <div id="body-center"></div>
    <div id="body-right"></div>
</div>
<div id="footer">

</div>
</body>
</html>
```

