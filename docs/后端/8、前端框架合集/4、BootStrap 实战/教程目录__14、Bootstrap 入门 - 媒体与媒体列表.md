# 14、Bootstrap 入门 - 媒体与媒体列表
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/14.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

看到媒体，不要误解，此处媒体不是指的单纯的图形、视频、音频等媒体形式，而是指的Bootstrap中提供的一种显示组件。

Bootstrap媒体一般由文字、图像构成，大多数情况下图像作为一个抽象代表，文字作为内容描述。

举个最常见例子，微信中的聊天会话就是一个典型的媒体，左侧是头像，右侧上方是微信名称，右侧下方是最新的消息内容。

接下来我们就来使用Bootstrap实现下媒体。

## 2. 媒体实现

我们以微信聊天会话为例实现下媒体。

首先，我们设置一个媒体对象。

```java
<div class="media">
</div>
```

第二，设置媒体左侧容器，用于放置头像。

```java
<div class="media">
    <div class="media-left">
    </div>
</div>
```

第三，在左侧容器中放入具体的媒体对象，需要使用`.media-object`类修饰。

```java
<div class="media">
    <div class="media-left">
        <img class="media-object img-rounded" src="bootstrap-logo.jpg" alt="Bootstrap logo">
    </div>
</div>
```

第四，添加媒体的主体部分，并在主体部分设置标题，此处标题部分放置微信好友名称。

```java
<div class="media">
    <div class="media-left">
        <img class="media-object img-rounded" src="bootstrap-logo.jpg" alt="Bootstrap logo">
    </div>
    <div class="media-body">
        <div class="meida-heading h3">bootstrap大神</div>
    </div>
</div>
```

最后，标题下方添加描述信息，此处放置最近的聊天内容。

```java
<div class="media">
    <div class="media-left">
        <img class="media-object img-rounded" src="bootstrap-logo.jpg" alt="Bootstrap logo">
    </div>
    <div class="media-body">
        <div class="meida-heading h3">bootstrap大神</div>
        <p>
            你好吗，我想你了。
        </p>
    </div>
</div>
```

效果如下，可见一个媒体的模样已经出来了，再精细调整下文字和图像大小即可。

## 3. 媒体列表

微信对话不是一个，而是很多个组成的一个列表。

Bootstrap中可以通过`.media-list`类元素包裹起媒体，成为媒体列表。

示例代码：

```java
<div class="media-list">
    <div class="media">
        <div class="media-left">
            <img class="media-object img-rounded" src="bootstrap-logo.jpg" alt="Bootstrap logo">
        </div>
        <div class="media-body">
            <div class="meida-heading h3">bootstrap大神</div>
            <p>
                你好吗，我想你了。
            </p>
        </div>
    </div>
    <div class="media">
        <div class="media-left">
            <img class="media-object img-rounded" src="bootstrap-logo.jpg" alt="Bootstrap logo">
        </div>
        <div class="media-body">
            <div class="meida-heading h3">bootstrap大神2</div>
            <p>
                你好吗，我想你了。
            </p>
        </div>
    </div>
</div>
```

对应效果：

## 4. 小结

Bootstrap媒体与媒体列表其实非常好用，使用场景也很多，例如博客列表、商品列表等等，所以还是需要好好掌握下子的。
