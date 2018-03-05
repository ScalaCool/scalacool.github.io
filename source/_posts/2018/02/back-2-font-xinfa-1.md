---
title: 后端工程师入门前端页面重构（二）：心法 I
author: KnewHow
tags: 
- 前端开发
- ~后端工程师入门前端页面重构
- ^KnowHow
description: 上一篇博客是我们《后端工程师入门前端页面重构》系列的第一篇，那么在接下来的几篇文章中，我们就来聊聊页面布局的「心法」和一些具体的「招式」。
date: 2018-02-07
---

[上一篇博客](https://scala.cool/2017/12/be_2_fe/)是我们《后端工程师入门前端页面重构》系列的第一篇，我们介绍了页面布局的口诀：

**从左到右，从上到下，化整为零。**

那么在接下来的几篇文章中，我们就来聊聊页面布局的「心法」和一些具体的「招式」。

那么什么是心法呢？

如果说口诀是页面布局的原则，那么心法就是对页面布局中一些重要概念的认识。

在上一篇文章，我们一直推荐使用高效的浮动布局，类似大家都玩过的磁铁，在磁铁的周围，所有的铁块会被磁铁所吸引。

那么浮动就好比页面上的一块磁铁，它会吸引页面上的元素块，让它们朝一个方向进行组合、包含、交叠，进而完成整个页面的布局。

下面就让我们来看看页面中元素有什么类型。

## HTML 块状元素和行内元素

在我们熟知的页面布局中，网页的标题，logo等都是有高度和宽度的。我们来看下面的豆瓣首页的切图：

<center>
![豆瓣首页切图](https://scala.cool/images/2018/02/back-2-font-xinfa-1/douban-index.png)
</center>

在上面的图片中，我们使用红色的线条和文字标注豆瓣 logo 的高度和宽度。不仅仅是 logo 图有高度和宽度，搜索框，热搜主题等其它元素，几乎都有高度和宽度。

那么在 HTML 语言中，我们如何指定元素的高度和宽度呢？

我们先来写一段 HTML：

```html
<div>这是 div 标签里面的内容</div>
<span>这是 span 标签的内容</span>
```

然后给它们定义样式：

```css
div {
  background-color: red;
  height: 100px;
  width: 100px;
}
span {
  background-color: green;
  height: 100px;
  width: 100px;
```

效果如下：

<center>
![效果图](https://scala.cool/images/2018/02/back-2-font-xinfa-1/html-css-show.png)
</center>

发现一个问题：

**我们设置的高度和宽度只对 div 标签产生效果，对 span 标签没有产生效果。这是为什么呢？**


其实在 HTML 中，我们可以把标签分为「块状元素」和「行内元素」，上面代码中的 div 标签就是块状元素，而 span 标签就是行内元素。

那么这两类元素有什么区别呢？

从我们的代码的效果图里面我们已经看出来一个区别了：**块状元素可以设置它的高度和宽度，行内元素对的高度和宽度的设置是无效。**

我们把上面元素的宽度和高度都删除，让 div 标签和 span 标签保持原始的高度和宽度来看看效果。

<center>
![效果图](https://scala.cool/images/2018/02/back-2-font-xinfa-1/block-inline-elemet.png)
</center>

是不是又看出来一个区别呢？

**块状元素是独占一行的，而行内元素只占本身内容的大小。**

看看我们之前设置高度和宽度的例子，我们用浏览器检查一下看看。

<center>
![效果图](https://scala.cool/images/2018/02/back-2-font-xinfa-1/block-element.jpg)
</center>

**即使我们设置了块状元素的高度和宽度，它还是独占一行的**。真的是霸道啊！

然而，现实中的网页（如豆瓣），很多内容块都是拼接的，如果我们使用块状元素来表示这些内容块，如果消除它独占一行的情况呢？


关于这个问题，似乎有两种解决方案。


### inline-block

其实在 css 的 diplay 属性中，有一个属性值 `inline-block` 可以将标签呈现出「块状元素」和「行内元素」之间的中间态，即它可以拥有宽高度的同时，也可以具备行内元素的占位属性。

```html
<div>123</div>
<div>123</div>
```

然后给它们定义样式：

```css
div {
    background-color: red;
    display: inline-block;
}
```

看效果：
<center>
![行内元素误差效果显示](https://scala.cool/images/2018/02/back-2-font-xinfa-1/inline-element-error.png)
</center>

我们发现**虽然两个 div 可以变成行内元素在一行显示，但是它们之间还是存在空白，不能完美的相邻在一起。这点空白会让我们的布局很不美观！**

### 浮动
上面我们说了，浮动可以把页面上的元素往某一个方向吸引，那么如何吸引呢？
在 CSS 中，我们可以通过 `float:left` 把元素往左边吸引

```html
<div style="background-color: red">这是第一个区块</div>
<div style="background-color: green">这是第二个区块</div>
```

使用浮动：

```css
div {
    width: 200px;
    height: 200px;
    float: left;
}
```
看效果：

<center>
![简单浮动效果图](https://scala.cool/images/2018/02/back-2-font-xinfa-1/float-layout-show-1.png)
</center>

我们发现，通过浮动，可以使两个原本很难相邻在一起的块状元素，**完美** 的相邻在一起。

使用 `left` 是把元素往左边吸引，而 `right` 是把元素往右边吸引。

那么当浮动和元素嵌套结合会发生什么呢？

## 父元素高度

在页面布局中，元素嵌套使用是非常常见的，如下面的代码。

```html
<div class="parent">
  <div class="child1">
    first child
  </div>
</div>
```
```css
.child1 {
  background-color: red;
}
```

<center>
![](https://scala.cool/images/2018/02/back-2-font-xinfa-1/first-child.png)
</center>

此时，子元素的高度是**自适应的**，也就是当前浏览器显示的文字高度，如果对页面进行缩放，子元素高度就会变化。

而父元素包含着子元素，而且父元素里面没有其它元素，因此父元素的高度等于子元素的高度。

我们也可以使用 `height `来设置子元素的高度，让它不自适应。

在实际开发中，经常需要使用一个父元素嵌套一些浮动元素，现在我们就来设置子元素为浮动元素。

```css
.child1 {
  background-color: red;
  float: left;
  height: 100px;
}
```

<center>
![](https://scala.cool/images/2018/02/back-2-font-xinfa-1/child1-float.png)
</center>

我们发现父元素的高度竟然变成了０。

我们尝试再添加一个**非浮动**的子元素时，我们发现，父元素的高度等于第二个非浮动子元素的高度，完全忽视了第一个浮动子元素的存在。

```html
<div class="child2">
  second child
</div>
```

```css
.child2 {
  background-color: green;
  height: 50px;
}
```
![](https://scala.cool/images/2018/02/back-2-font-xinfa-1/parent-child2.png)

而当我们把第二个子元素设置为浮动的时候，父元素的高度又再度变成了０。

按照上面的方法，添加第三个元素的时候，效果也是相同的。

通过上面的例子，我们可以得出一个结论：**父元素的高度由最后一个非浮动子元素的占位空间所决定。**

但是在页面布局中，**浮动布局的占位空间**往往是我们理想的容器父元素的高度，那么我们如何解决这个问题呢？

## 清除浮动
使用**清除浮动**就可以解决上面的问题，具体的做法是在父元素的最后添加一个空的元素，并在设置它为清除浮动。

```html
<div class="child3">
</div>
```
```css
.child3 {
  clear: left;
}
```

<center>
![](https://scala.cool/images/2018/02/back-2-font-xinfa-1/clear-float-1.png)
</center>

我们发现父元素的高度等于浮动元素的占位空间。


 `clear: left;` 就是让左浮动元素持有占位空间

让我们再来拓展一下，`clear` 除了可以设置为 `left`，还可以设置为 `right` 和 `both`。

`right` 就是让右浮动元素持有占位空间。

`both` 就是让两边的浮动元素都持有占位空间。

### 浮动布局--最佳实践

在上面的代码中，我们是直接手动的在父元素最后添加空元素。那么能不能有一种方法，可以自动的帮我们添加元素并在设置清除浮动呢？

回答是肯定的！

在 CSS 中，我们可以使用 「after 选择器」 来实现添加元素，并且设置属性，具体的用法可以参考:[W3C after 选择器](http://www.w3school.com.cn/cssref/selector_after.asp)

下面直接给出代码： 

```css
.clearfix:after {
  content: " ";
  display: block;
  clear: both;
  height: 0;
}
.clearfix {
  zoom: 1;
}
```

- 在IE6, 7下 `zoom: 1` 会触发 hasLayout，从而使元素闭合内部的浮动。

- 在标准浏览器下，`.clearfix:after` 这个伪类会在应用到 `.clearfix` 的元素后面插入一个 `clear: both` 的块级元素，从而达到清除浮动的作用。     

只要父元素引用了这个 class，就可以自动的实现清除浮动，再也不用担心高度和子元素的占位问题了。

## 心法小结
最后，我们再来回顾一下文章介绍的一些心法：

**1. HTML 分为块状元素和行内元素的，块状元素是独占一行的**

**2. 浮动布局相对行内元素的布局，往往更利于精确计算间距**

**3. 默认情况下，父元素的高度由最后一个非浮动子元素的占位空间所决定**

**4. 浮动布局的占位空间往往是我们理想的容器父元素的高度**

**5. 清除浮动可以解决浮动元素的占位空间问题**

文章中的一些招式可能说的太粗糙，先不用捉急，我们先学心法，招式到后面再专门的学习。

我会在下一篇博文继续介绍心法 II。

