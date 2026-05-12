# 02、Bootstrap 入门 - 安装Bootstrap
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/2.html
- 分类：前端框架
- 分组：教程目录
## 1. 版本选择

目前已经出了Bootstrap4，但是作为初学者而言可以学习Bootstrap3，更加主流的版本选择，网上的文档、教程、资源也相对比较多。本教程选择Bootstrap3.3.7。

## 2. 使用方式

可以将Bootstrap下载到本地后引入使用，也可以直接使用CDN引入使用。

CDN方式的话不如下载到本地使用稳定，但是不用下载更加的方便，学习阶段可以直接使用CDN的方式。

本教程直接使用CDN方式。

## 3. 安装方法

由于Bootstrap依赖于jQuery，所以我们先行引入jQuery，然后引入Bootstrap相关的文件。

```java
<html>
<head>
    <title>boostrap-setup</title>
    <meta charset="utf-8">
    <!-- 最新版本的 Bootstrap 核心 CSS 文件 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css">
    <!-- 引入jQuery -->
    <script src=" https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js"></script>
    <!-- 最新的 Bootstrap 核心 JavaScript 文件 -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js"></script>
</head>
<body></body>
</html>
```

如上，在head区域引入相关的文件后，即可直接使用Bootstrap了。

## 4. 验证下

我们在内容区域放置2个按钮，一个是普通按钮，一个是采用了Bootstrap样式的按钮，代码如下：

```java
<body>
    <button type="button">Button</button>
    <button class="btn btn-primary" type="button">Button</button>
</body>
```

效果如下：

非常明显，使用了Bootstrap样式的按钮比普通按钮好看多了。

就是如此优秀！
