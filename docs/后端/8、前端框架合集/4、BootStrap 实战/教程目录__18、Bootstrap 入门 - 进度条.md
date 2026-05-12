# 18、Bootstrap 入门 - 进度条
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/18.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

进度条的使用频率并不高，但是如果遇到合适的场景，使用之后对显示效果的提升还是比较明显的。

Bootstrap为进度条提供了比较优雅的实现，本篇就来介绍下常见用法。

## 2. 普通进度条

先看一段代码：

```java
<div class="progress">
    <div class="progress-bar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"
        style="width: 60%;">
        <span>60%</span>
    </div>
</div>
```

首先是通过`class="progress"`设定了一个进度条容器。

然后在容器内定义了`progress-bar`进度条控件，属性`aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"`分别代表着当前进度值、最小值、最大值。

最后，`60%`是进度条内显示文体，所以效果如下：

## 3. 隐藏文本

可以使用`sr-only`类修饰进度条的文本元素，`sr-only`表示屏幕阅读器，也就是正常情况下不显示，当残障人员使用屏幕阅读器阅读网页时，可以通过声音等方式展示的内容。

示例代码：

```java
<div class="progress">
    <div class="progress-bar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"
        style="width: 60%;">
        <span class="sr-only">60%</span>
    </div>
</div>
```

对应效果：

## 4. 调整颜色

可以使用样式类调整进度条的颜色，示例代码：

```java
<div class="progress">
    <div class="progress-bar progress-bar-success" aria-valuenow="60" aria-valuemin="0"
        aria-valuemax="100" style="width: 60%;">
        <span class="sr-only">60%</span>
    </div>
</div>
<div class="progress">
    <div class="progress-bar progress-bar-info" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"
        style="width: 60%;">
        <span class="sr-only">60%</span>
    </div>
</div>
<div class="progress">
    <div class="progress-bar progress-bar-warning" aria-valuenow="60" aria-valuemin="0"
        aria-valuemax="100" style="width: 60%;">
        <span class="sr-only">60%</span>
    </div>
</div>
<div class="progress">
    <div class="progress-bar progress-bar-danger" aria-valuenow="60" aria-valuemin="0"
        aria-valuemax="100" style="width: 60%;">
        <span class="sr-only">60%</span>
    </div>
</div>
```

效果如下：

## 5. 条纹效果

Bootstrap还可以通过`progress-bar-striped`类，为进度条设置条纹效果。示例代码：

```java
<div class="progress">
    <div class="progress-bar progress-bar-striped" aria-valuenow="60" aria-valuemin="0"
        aria-valuemax="100" style="width: 60%;">
        <span class="sr-only">60%</span>
    </div>
</div>
```

效果如下：

## 6. 动画效果

还可以通过`active`类，为进度条增加横向滚动的动画效果，示例代码如下。

```java
<div class="progress">
    <div class="progress-bar progress-bar-striped active" aria-valuenow="60" aria-valuemin="0"
        aria-valuemax="100" style="width: 60%;">
        <span class="sr-only">60%</span>
    </div>
</div>
```

## 7. 小结

Bootstrap进度条提供了多种样式，其实也不要盲目选择华丽的效果，还是要根据具体情景选择合适的样式。
