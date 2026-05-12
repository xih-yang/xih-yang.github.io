# 20、Bootstrap 入门 - 选项卡式导航、胶囊式导航、面包屑导航
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/20.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

Bootstrap提供了多种导航控件，本篇就来介绍下常用的选项卡式导航、胶囊式导航及面包屑导航。

## 2. 选项卡式导航

### 2.1 普通选项卡导航

选项卡式导航，顾明司仪，看起来就像多个选项卡，基本用法如下：

```java
选项卡式导航
<nav>
    <ul class="nav nav-tabs">
        <li class="active"><a href="#">首页</a></li>
        <li><a href="#">关于</a></li>
        <li><a href="#">内容</a></li>
    </ul>
</nav>
```

``表示导航元素，`nav nav-tabs`表示这是一个选项卡样式的导航元素，所以效果如下：

### 2.2 等宽选项卡导航

等宽选项卡导航特别适合用于移动设备，当容器宽度小于768像素时，导航将自动变为堆叠样式。使用`nav-justified`类即可设置等宽模式。

```java
等宽选项卡式导航
<nav>
    <ul class="nav nav-tabs nav-justified">
        <li class="active"><a href="#">首页</a></li>
        <li><a href="#">关于</a></li>
        <li><a href="#">内容</a></li>
    </ul>
</nav>
```

当容器宽度正常时：

等容器宽度小于768像素时，导航会自动变为：

## 3. 胶囊式导航

### 3.1 普通胶囊式导航

胶囊式导航改变了显示样式，每个导航菜单更加像一个胶囊按钮，而不是选项。使用`nav-pills`类设置胶囊式导航：

```java
胶囊式导航
<nav>
    <ul class="nav nav-pills">
        <li class="active"><a href="#">首页</a></li>
        <li><a href="#">关于</a></li>
        <li><a href="#">内容</a></li>
    </ul>
</nav>
```

效果如下：

### 3.2 垂直胶囊式导航

可以追加`nav-stacked`样式，将胶囊式导航设置为垂直方向：

```java
垂直方向胶囊式导航
<nav>
    <ul class="nav nav-pills nav-stacked">
        <li class="active"><a href="#">首页</a></li>
        <li><a href="#">关于</a></li>
        <li><a href="#">内容</a></li>
    </ul>
</nav>
```

效果如下：

## 4. 面包屑导航

面包屑导航比较简单，直接为ul添加`breadcrumb`类即可。

```java
面包屑导航
<ul class="breadcrumb">
    <li><a href="#">首页</a></li>
    <li><a href="#">关于我们</a></li>
    <li><a href="#">品牌信息</a></li>
</ul>
```

效果如下：

## 5. 小结

选项卡式导航和胶囊式导航经常用作除了主导航栏之外的二级内容导航，而面包屑导航经常用于显示当前页面的位置且随时定位到相关页面。
