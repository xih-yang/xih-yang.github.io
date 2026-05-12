# 13、Bootstrap 入门 - 图像和缩略图组
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/13.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

图片比文字传达信息更加直观、更加具象，具备不可代替的意义。

必不可少的，Bootstrap也为图像提供了一定支持，本篇就来具体介绍下。

## 2. 响应式图像

通过给图像设置`.img-responsive`类，即可将图像设置为响应式图像，可以自动适应容器的大小。

```java
<img src="bootstrap-logo.jpg" alt="Bootstrap logo" class="img-responsive">
```

## 3. 图像样式

Bootstrap还为图像提供了三种常见的样式：

**1、**`.img-rounded`：圆角图像；

**2、**`.img-thumbnail`：缩略图样式；

**3、**`.img-circle`：圆形样式；

示例代码：

```java
<div class="row">
   <div class="col-md-4">
       <img src="bootstrap-logo.jpg" alt="Bootstrap logo" class="img-responsive">
   </div>
   <div class="col-md-4">
       <img src="bootstrap-logo.jpg" alt="Bootstrap logo" class="img-thumbnail">
   </div>
   <div class="col-md-4">
       <img src="bootstrap-logo.jpg" alt="Bootstrap logo" class="img-circle">
   </div>
</div>
```

对应效果如下，注意缩略图是有一个边框效果的。

## 4. 缩略图组

除了可以将单一图像设置为缩略图，还可以将一组图像都设置为缩略图样式，此时需要为图像外围容器设置`.thumbnail`类。

示例代码：

```java
<div class="row" style="margin-top:8px;">
    <div class="col-xs-4 ">
        <div class="thumbnail">
            <img src="bootstrap-logo.jpg" alt="Bootstrap logo">
        </div>
    </div>
    <div class="col-xs-4 ">
        <div class="thumbnail">
            <img src="bootstrap-logo.jpg" alt="Bootstrap logo">
        </div>
    </div>
    <div class="col-xs-4 ">
        <div class="thumbnail">
            <img src="bootstrap-logo.jpg" alt="Bootstrap logo">
        </div>
    </div>
</div>
```

效果如下：

## 5. 小结

Bootstrap为图像和缩略图组提供了简单的样式类，主要是作为一个基础效果，其实还提供了一定的灵活度，程序开发人员可以在此基础上进一步定制。
