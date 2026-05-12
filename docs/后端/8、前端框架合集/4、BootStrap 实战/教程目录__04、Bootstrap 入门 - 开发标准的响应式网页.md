# 04、Bootstrap 入门 - 开发标准的响应式网页
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/4.html
- 分类：前端框架
- 分组：教程目录
## 1. 背景

响应式网页指的是可以在不同尺寸/分辨率设备下都可以运行良好的网页，本篇就来讲解下如何使用Bootstrap构建符合标准规范的响应式网页。

## 2. 创建标准HTML5页面

首先创建一个标准的HTML5网页，代码如下：

```java
<!DOCTYPE html>
<html>
<head>
    <title>boostrap-responsive</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
</body>
</html>
```

注意其中``是为了告诉浏览器，当前文档是HTML5文档。

``告诉IE浏览器，以尽可能高的仿真版本显示当前网页。所谓仿真版本，指的是IE浏览器可以仿照运行的其他版本的IE，如下图：

``改行代码则指示了页面的初始宽度为设备宽度，初始缩放比例为100%，这样的话能支持网页在屏幕较小但DPI较高的设备(例如iPhone)上正确显示。

## 3. 添加响应式内容

首先添加对Bootstrap支持。

```java
<head>
    <title>boostrap-responsive</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <!-- 最新版本的 Bootstrap 核心 CSS 文件 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css">
    <!-- 引入jQuery -->
    <script src=" https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js"></script>
    <!-- 最新的 Bootstrap 核心 JavaScript 文件 -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js"></script>
</head>
```

注意Bootstrap对响应式的支持，是通过控制网格列在不同容器宽度下占据不同的列数来实现的。

当浏览器容器宽度小于768像素时，Bootstrap会采用`.col-xs-`开头的列。

当浏览器容器宽度处于[768,992)是，将采用`.col-sm-`开头的列。

当浏览器容器宽度处于[992,1200)是，将采用`.col-md-`开头的列。

当浏览器容器宽度大于1200是，将采用`.col-lg-`开头的列。

注意上面四个宽度尺寸，实际上对应的是手机、平板、小型PC显示器、大型PC显示器，但是随着显示设备的发展，目前这样的预设已经不再精准，需要根据实际情况来具体设置。

好的，有了上面的理论基础，我们来实现一个可以同时支持电脑显示器和手机显示器的网页，代码如下：

```java
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="col-sm-12 col-md-3">
                <img src="bootstrap-logo.jpg" />
            </div>
            <div class="col-sm-12 col-md-3">
                <img src="bootstrap-logo.jpg" />
            </div>
            <div class="col-sm-12 col-md-3">
                <img src="bootstrap-logo.jpg" />
            </div>
            <div class="col-sm-12 col-md-3">
                <img src="bootstrap-logo.jpg" />
            </div>
        </div>
    </div>
</body>
```

按照上面的设置，当屏幕尺寸较大时，会采用`.col-md-3`的列显示方式，所以每个图片会占据3/12容器宽度，效果如下：

而当屏幕尺寸较小时，会采用`.col-sm-12`的列显示方式，所以每个图片会占据12/12，即全部的容器宽度，效果如下：

## 4. 小结

Bootstrap实现响应式网页的方式十分简洁优雅，用同一套代码，就能支持各类不同分辨率的设备，优秀！
