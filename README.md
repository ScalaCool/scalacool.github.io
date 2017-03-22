# 如何在 scala.cool 上发表文章

## 一、创建工程

下载工程到本地：

```
http://code.drip.im/drip-team/scala.cool.git
```

然后你会发现 ``scala.cool`` 里有个 ``source`` 目录。

注意！之后你的操作只需要跟这个目录打交道即可。



## 二、创建新文章

 假设你要写的文章标题为「如何在 Scala 中科学地操作 collection」。

操作如下：

```
cd scala.cool

// 创建一个分支
git checkout -b collection_in_scala

cd source

// 进入文章源目录
cd _posts

// 根据当前年月进入目录
cd 2017
cd 03

// 创建新文章
touch how-to-handle-collection-in-scala.md
```

然后就可以在新创建的 ``md`` 文件中进行创作。

你可以通过以下命令预览文章效果：

```
hexo serve 或 hexo s
```



### 文章变量

|     变量      |    描述    |  必需  |
| :---------: | :------: | :--: |
|    title    |    标题    | Yes  |
|   author    |    作者    | Yes  |
|    tags     | 标签，且支持多个 |  No  |
| descritpion |    描述    | Yes  |
|    date     |   发表日期   | Yes  |

- 作者如果是英文名，请首字母大写，如 ``Shaw`` ，且不支持空格；
- tags 需严格遵循站点的分类原则，一般而言一篇文章对应一个 tag ，最多不超过 2 个；
- 描述会在首页列表显示，因此不要过长；

#### 示例：

```
---
title: 如何在 Scala 中科学地操作 collection
author: Shaw
tags:
- 集合
description: 科学合理地操作Scala中的集合可以使我们的代码变得更加简洁和高效。
date: 2017-03-10
---

# 以下为正文部分 #
```



### 如何插入图片

文章里所需要的图片，建议不要使用外链。可通过以下方法，在文章中插入图片：

```
cd source
cd images
cd 2017
cd 03
// 在当前路径粘贴图片
```

文章引用图片格式：

```
![xx](/images/2017/03/xx.png)
```



## 发表文章

写好文章之后，通过以下方式申请发布：

```
git add .
git commit -am 'Add 如何在 Scala 中科学地操作 collection'
git push origin collection_in_scala
```

然后通过 gitlab 发起 merge request 到 主干，assign to ``Yison``。

通过 review 后，文章就会在适当的时间发布上线。