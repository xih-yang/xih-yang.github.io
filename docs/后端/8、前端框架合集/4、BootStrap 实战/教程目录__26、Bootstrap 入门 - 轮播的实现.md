# 26、Bootstrap 入门 - 轮播的实现
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/26.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

要想从头到尾来实现一个比较好看且稳定的轮播控件，还是有一定难度的。

一个好看的轮播，能瞬间提高网站的整体档次，很多购物网站或者视频网站在首页最显眼的位置，都是放置轮播大图组件。

如果是使用Bootstrap框架的话，开发一个轮播就非常容易了，因为Bootstrap已内置轮播组件，拿来即用即可。

本节我们就来学习下Boostrap的轮播组件。

## 2. 基本轮播

先上代码如下：

```java
<div id="carousel-demo" class="carousel slide" data-ride="carousel" style="width:500px;height:350px;">
    <div class="carousel-inner">
        <div class="item active">
            <img src="1.jpg" alt="...">
            <div class="carousel-caption">
                图片1
            </div>
        </div>
        <div class="item">
            <img src="2.jpg" alt="...">
            <div class="carousel-caption">
                图片2
            </div>
        </div>
    </div>
</div>
```

解释下：

**1、**`carouselslide`表示这是一个轮播组件，`data-ride="carousel"`是告诉JS，该组件的内容时用于动态轮播的；

**2、**`carousel-inner`表示轮播的内容部分；

**3、**`item`表示轮播中的一个条目，在本实例中轮播有两个条目，每个条目都是一个带标题的图片；

**4、**`itemactive`追加了active类，表示当前条目是活跃的，即当前显示在用户面前的；

**5、** 每个条目中放置了一个图片，然后携带一个标题，标题用`carousel-caption`修饰；

所以如上简单的一些代码就生成了一个基本的轮播效果，注意图片会自动切换。

## 3. 添加轮播指示器

轮播指示器就是轮播条目下面的圆点，可以通过点击圆点切换条目，在``内添加如下代码：

```java
<ol class="carousel-indicators">
   <li data-target="#carousel-demo" data-slide-to="0" class="active"></li>
   <li data-target="#carousel-demo" data-slide-to="1"></li>
</ol>
```

解释下：

**1、**`carousel-indicators`表示当前元素时轮播指示器样式；

2. data-target="#carousel-demo"表示指示器对应的是id为carousel-demo的轮播组件。
**3、**`data-slide-to="0"`表示点击该指示器时，跳到第0个条目；

添加指示器后效果如下：

## 4. 添加轮播控件

有时候除了指示器，还会为轮播添加上一个、下一个的指示控件，代码如下：

```java
<a class="left carousel-control" href="#carousel-demo" data-slide="prev">
   <span class="glyphicon glyphicon-chevron-left"></span>
   <span class="sr-only">Previous</span>
</a>
<a class="right carousel-control" href="#carousel-demo" data-slide="next">
   <span class="glyphicon glyphicon-chevron-right"></span>
   <span class="sr-only">Next</span>
</a>
```

注意通过`href`属性关联轮播组件，通过`data-slide`属性指示点击控件后的动作类型。效果如下：

## 5. 小结

Bootstrap轮播功能全面，实现简单，值得推荐！
