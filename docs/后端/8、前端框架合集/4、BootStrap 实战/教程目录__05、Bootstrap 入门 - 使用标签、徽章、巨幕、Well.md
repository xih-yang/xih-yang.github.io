# 05、Bootstrap 入门 - 使用标签、徽章、巨幕、Well
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/5.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

本篇介绍下几个常用的Bootstrap组件，即标签、徽章、巨幕和Well。

这几个组件都比较简单，直接在HTML元素上添加class样式即可。

## 2. 标签

标签一般用于为元素添加附加信息，一般通过为``元素添加样式类来实现，例如：

```java
<div class="container-fluid">
    <div class="row">
        <div class="col-sm-12 col-md-12">
            <span class="label label-default">default标签</span>
            <span class="label label-primary">primary标签</span>
            <span class="label label-success">success标签</span>
            <span class="label label-info">info标签</span>
            <span class="label label-warning">warning标签</span>
            <span class="label label-danger">danger标签</span>
        </div>
    </div>
</div>
```

效果如下，注意添加`label`类表示当前元素为标签，然后添加`label-xxx`类来设定具体的标签样式，由下面的效果可见不同的样式类对应的颜色不同。

## 3. 徽章

徽章也是为元素添加附加信息，但是一般用来添加数字信息，例如购物车中商品的数量，EMail收件箱中邮件的数量等。

可以通过`.badge`类设置徽章，代码如下：

```java
<a href="#">收件箱 <span class="badge">8</span></a>
```

对应效果如下，比较简单。

## 4. 巨幕

巨幕在国外的网站非常流行，一般用来在首页放置一些显眼的内容，通过`.jumboron`类来设置巨幕效果，一般会将巨幕附加到``等布局元素上。

巨幕有两种使用方式，第一种是放到`.container`容器中，代码如下：

```java
<div class="container">
    <div class="jumbotron">
        <h2>熊猫购物网</h2>
        超值、实惠、高端、大气
    </div>
</div>
```

对应效果如下：

第二种使用方式是将巨幕放到`.container`容器外头，代码如下：

```java
<body>
    <div class="jumbotron">
        <h2>熊猫购物网</h2>
        超值、实惠、高端、大气
    </div>
</body>
```

对应效果如下：

感觉效果还不错。

## 5. Well

Well是一种比较简单的样式，其实就是一个凹陷的面板效果，一般用于显示一些提示信息。

例如在上传文件时，显示上传的说明信息。

Well有常规、小号、大号三个类可以选用，代码如下：

```java
<div class="well">只能上传.doc后缀的文档(well)</div>
<div class="well well-sm">只能上传.doc后缀的文档(well-sm)</div>
<div class="well well-lg">只能上传.doc后缀的文档(well-lg)</div>
```

对应效果如下：

## 6. 小结

本文介绍的内容比较简单，几个常用的样式组件，使用起来非常简单，直接添加对应的样式类即可。
