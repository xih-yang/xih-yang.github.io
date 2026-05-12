# 22、Bootstrap 入门 - 列表组
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/22.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

列表组用来显示一组关联的显示元素，Bootstrap提供了可以灵活使用的列表组组件list-group，本篇就来具体演示下。

## 2. 普通列表组

用`list-group`类修饰ul元素，使用`list-group-item`类修饰li元素，即可创建列表组，代码如下：

```java
普通列表组：
<ul class="list-group">
    <li class="list-group-item">第1节</li>
    <li class="list-group-item">第2节</li>
    <li class="list-group-item">第3节</li>
    <li class="list-group-item">第4节</li>
</ul>
```

效果如下：

## 3. 将普通链接转换为列表组

不仅可以针对ul、li组合应用列表组样式类，还可以对普通的div、a元素使用。

```java
链接转换为列表组：
<div class="list-group">
    <a class="list-group-item">第1节</a>
    <a class="list-group-item">第2节</a>
    <a class="list-group-item">第3节</a>
    <a class="list-group-item">第4节</a>
</div>
```

效果如下：

## 4. 调整列表项的样式

可以针对列表项应用一些样式，例如active表示选中样式，disabled表示禁用，还有一些常见的其他样式：

```java
调整列表项样式
<ul class="list-group">
    <li class="list-group-item active">active</li>
    <li class="list-group-item disabled">disabled</li>
    <li class="list-group-item list-group-item-info">list-group-item-info</li>
    <li class="list-group-item list-group-item-success">list-group-item-success</li>
    <li class="list-group-item list-group-item-warning">list-group-item-warning</li>
    <li class="list-group-item list-group-item-danger">list-group-item-danger</li>
</ul>
```

效果如下：

## 5. 带徽章的列表组

可以在列表项中添加徽章，有趣的是，徽章会自动的排列到列表组的右侧，如下：

```java
带徽章列表组
<ul class="list-group">
    <li class="list-group-item">收件箱<span class="badge">5</span></li>
    <li class="list-group-item">发件箱<span class="badge">5</span></li>
    <li class="list-group-item">草稿箱<span class="badge">5</span></li>
    <li class="list-group-item">回收站<span class="badge">5</span></li>
</ul>
```

效果如下：

## 6. 添加标题和内容

列表项可以摆脱固定的文字内容，通过`list-item-item-heading`可以为列表项添加标题部分，然后通过`list-group-item-text`可以为列表项添加内容部分。

```java
添加标题和内容
<ul class="list-group">
    <li class="list-group-item">
        <div class="list-group-item-heading h4">张三</div>
        <div class="list-group-item-text">一个英俊的小伙子</div>
    </li>
    <li class="list-group-item">
        <div class="list-group-item-heading h4">李四</div>
        <div class="list-group-item-text">一个优秀的小伙子</div>
    </li>
    <li class="list-group-item">
        <div class="list-group-item-heading h4">赵五</div>
        <div class="list-group-item-text">一个有前途的的小伙子</div>
    </li>
</ul>
```

效果如下：

## 7. 小结

列表组其实并不算特别常用，但是如果有合适的场景，例如邮箱的导航，直接使用列表组无疑更加省心。
