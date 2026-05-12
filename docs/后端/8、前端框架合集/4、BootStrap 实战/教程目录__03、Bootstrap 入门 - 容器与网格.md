# 03、Bootstrap 入门 - 容器与网格
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/3.html
- 分类：前端框架
- 分组：教程目录
## 1. 网格的意义

传统的网页布局，在垂直方向上分割是很简单的，只需要添加块级元素例如``即可轻易的在垂直方向上进行分割。

但是在实际的需求中，我们需要在水平方向上进行分割，最好可以实现按比例水平分割。例如左侧1/3作为导航栏，右侧2/3作为内容区域。

水平比例分割如果用CSS来实现，是比较麻烦的，但是Bootstrap网格系统可以轻易的实现这一点。

## 2. 网格的使用

我们借助一个经典实例来演示下Bootstrap中如何使用网格，该实例就是上方为导航栏，中间区域的左侧为导航栏，右侧为内容区域，这是一个经典的后台管理页面布局方式。

### 2.1 引入Bootstrap

首先在页面引入Bootstrap。

```java
<html>
<head>
    <title>boostrap-grid</title>
    <meta charset="utf-8">
    <!-- 最新版本的 Bootstrap 核心 CSS 文件 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css">
    <!-- 引入jQuery -->
    <script src=" https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js"></script>
    <!-- 最新的 Bootstrap 核心 JavaScript 文件 -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js"></script>
</head>
<body>
</body>
</html>
```

### 2.2 建立容器

Bootstrap网格需要放置到容器内，容器有两种，即固定宽度的`container`和非固定宽度的`container-fluid`。

我们来看下具体有何不同，代码如下：

```java
<body>
    <div class="container" style="background-color: grey">
        container测试
    </div>
    <div class="contaier-fluid" style="background-color:green">
        contaier-fluid测试
    </div>
</body>
```

对应效果如下，可见`container-fluid`样式宽度是占满的，所以我们采用该样式。

### 2.3 创建行

在我们的设计中，网页应该有2行，第1行为上方标题栏，第2行放置导航栏和内容区域。

Bootstrap中用`row`表示一行，所以代码修改如下。

```java
<body>
    <div class="contaier-fluid">
        <div class="row">
        </div>
        <div class="row">
        </div>
    </div>
</body>
```

### 2.4 创建列

接下来就是网格系统的重点了，在水平方向上按比例设置列。

BootStrap的网格列设置很有意思，会把一行分为12份，我们可以任意设定当前列占12份中的几份。

例如标题栏，只有1列，所以占全部的12份；而导航栏和内容区域占据12份中的4份和8份，这样正好是1/3和2/3，所以代码如下，注意添加背景色是为了便于区分演示。

```java
<div class="contaier-fluid">
<div class="row">
    <div class="col-md-12" style="background-color:grey">标题栏</div>
</div>
<div class="row">
    <div class="col-md-4" style="background-color: green">导航栏</div>
    <div class="col-md-8" style="background-color: orange">内容区域</div>
</div>
</div>
```

此时效果如下，可见Bootstrap要实现水平方向上的按比例分割是如此简单。

### 2.5 列的偏移

可以使用.col-md-offset-#移动各列，其中#处填写数字，表示偏移的列数，例如如下代码就向右侧偏移了1列。

```java
<div class="row">
    <div class="col-md-3 col-md-offset-1" style="background-color: green">导航栏</div>
    <div class="col-md-8" style="background-color: orange">内容区域</div>
</div>
```

所以效果如下，第3行即为偏移后的效果。

## 3. 小结

Bootstrap通过将行等分12份，实现了水平方向上的比例分割。

如果觉得12份不够用，还可以嵌套，将其中1份继续12等分，这样基本可以实现我们想要的效果。

通过简单的应用样式，即可水平风格，是一个创举，也造就了Bootstap的流行。

方便、效率提高生产力！
