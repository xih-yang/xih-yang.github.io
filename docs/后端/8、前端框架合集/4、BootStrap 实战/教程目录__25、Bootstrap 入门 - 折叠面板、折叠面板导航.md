# 25、Bootstrap 入门 - 折叠面板、折叠面板导航
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/25.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

上一篇我们讲述了折叠插件的用法，可以将任意的div元素包含的内容进行动态的折叠/显示操作。

本篇来讲述折叠中的两个特例，即折叠面板、折叠面板导航。

## 2. 折叠面板

折叠面板是将折叠效果应用于多个面板，从而在某一时间至多显示其中一个面板的控件。

折叠面板实现稍微有些复杂，接下来我们来详细描述下：

第1步，我么定义折叠面板div元素，并为其命名，需要特别注意`panel-group`类，表示多个面板的集合，即我们要创建的折叠面板。

```java
<div class="panel-group" id="panel-container">
</div>
```

第2步，添加第一个面板的头部，注意头部包含折叠按钮，根据我们对折叠按钮的理解，当点击折叠按钮时，id为`poem`的元素会切换显示状态。另外还需要注意使用`data-parent`属性关联到父元素。

```java
<div class="panel panel-default">
    <div class="panel-heading">
        <div class="panel-title h4">
            <a data-toggle="collapse" data-parent="#panel-container" href="#poem1">春晓</a>
        </div>
    </div>
 </div>
```

第3步，添加折叠部分，通过`panel-collaspse`设置面板，通过`collapse in`将元素设置为折叠元素且默认显示(`in`)。

```java
<div class="panel-group" id="panel-container">
    <div class="panel panel-default">
        <div class="panel-heading">
            <div class="panel-title h4">
                <a data-toggle="collapse" data-parent="#panel-container" href="#poem1">春晓</a>
            </div>
        </div>
        <div id="poem1" class="panel-collapse collapse in">
            <div class="panel-body">
                春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。
            </div>
        </div>
    </div>
</div>
```

第4步，添加第二个面板，注意其折叠部分默认不显示，即不添加`in`类。

```java
<div class="panel-group" id="panel-container">
    <div class="panel panel-default">
        <div class="panel-heading">
            <div class="panel-title h4">
                <a data-toggle="collapse" data-parent="#panel-container" href="#poem1">春晓</a>
            </div>
        </div>
        <div id="poem1" class="panel-collapse collapse in">
            <div class="panel-body">
                春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。
            </div>
        </div>
    </div>
    <div class="panel panel-default">
        <div class="panel-heading">
            <div class="panel-title h4">
                <a data-toggle="collapse" data-parent="#panel-container" href="#poem2">鹅</a>
            </div>
        </div>
        <div id="poem2" class="panel-collapse collapse">
            <div class="panel-body">
                鹅鹅鹅，曲项向天歌。白毛浮绿水，红掌拨清波。
            </div>
        </div>
    </div>
</div>
```

这样就可以了，具体效果如下：

## 3. 折叠面板导航

在折叠面板中，还有一个比较常用的存在，即折叠面板的导航。默认情况下菜单可以折叠，当点击时弹出其子菜单。

只需要将panel-body部分替换为list-group列表组即可。

```java
<div class="panel-group" id="main-menu">
    <div class="panel panel-default">
        <div class="panel-heading">
            <div class="panel-title h4">
                <a data-toggle="collapse" data-parent="#main-menu" href="#menu1">菜单1</a>
            </div>
        </div>
        <div id="menu1" class="panel-collapse collapse in">
            <ul class="list-group">
                <li class="list-group-item">菜单1-1</li>
                <li class="list-group-item">菜单1-2</li>
            </ul>
        </div>
    </div>
    <div class="panel panel-default">
        <div class="panel-heading">
            <div class="panel-title h4">
                <a data-toggle="collapse" data-parent="#main-menu" href="#menu2">菜单2</a>
            </div>
        </div>
        <div id="menu2" class="panel-collapse collapse">
            <ul class="list-group">
                <li class="list-group-item">菜单2-1</li>
                <li class="list-group-item">菜单2-2</li>
            </ul>
        </div>
    </div>
</div>
```

具体效果如下：

## 4. 小结

折叠面板、折叠面板导航综合之前折叠插件、面板插件、列表组相关的技术，还是比较难的。

但是其实大家无需死记硬背，再使用时临时上网查询其用法即可，拿来修改即用。
