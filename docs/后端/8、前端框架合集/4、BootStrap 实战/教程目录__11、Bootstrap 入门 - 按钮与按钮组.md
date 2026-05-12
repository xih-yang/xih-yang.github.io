# 11、Bootstrap 入门 - 按钮与按钮组
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/11.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

按钮可以说是使用频率最高的交互组件之一了，Bootstrap框架对按钮也非常重视，提供了多种样式强化类。同时还提供了按钮组，可以组合使用按钮，更加方便。

## 2. 按钮的使用

### 2.1 设置Bootstrap按钮

在Bootstrap框架下，只需要为按钮添加`.btn`类，然后添加`.btn-default`类，即可创建Bootstrap样式的按钮。

注意Bootstrap可以将``、``、``元素转换为统一样式风格的按钮，推荐还是使用``，更加符合HTML规范。

示例代码：

```java
<button type="button" class="btn btn-default">button按钮</button>
<a class="btn btn-default">a按钮</a>
<input type="button" class="btn btn-default" value="input按钮">
```

对应效果：

### 2.2 调整按钮大小

Bootstrap提供了4中按钮大小，通过为按钮添加表示大小的类即可实现，这些类包括`.btn-lg`、`.btn-sm`、`.btn-xs`。

示例代码：

```java
<button type="button" class="btn btn-default">默认按钮</button>
<button type="button" class="btn btn-default btn-lg">lg按钮</button>
<button type="button" class="btn btn-default btn-sm">sm按钮</button>
<button type="button" class="btn btn-default btn-xs">xs按钮</button>
```

对应效果：

### 2.3 调整按钮颜色样式

Bootstrap还提供了设置按钮颜色样式的类，包括：

- btn-default：白色标准按钮
- btn-primary：蓝色按钮，表示首选意义
- btn-info：淡蓝色按钮，表示提示意义
- btn-success：绿色按钮，表示成功意义
- btn-warning：黄色按钮，表示警告意义
- btn-danger：红色按钮，表示危险意义
- btn-link：样式看起来是一个链接

示例代码：

```java
<button type="button" class="btn btn-default">default</button>
<button type="button" class="btn btn-primary">primary</button>
<button type="button" class="btn btn-info">info</button>
<button type="button" class="btn btn-success">success</button>
<button type="button" class="btn btn-warning">warning</button>
<button type="button" class="btn btn-danger">danger</button>
<button type="button" class="btn btn-link">link</button>
```

对应效果：

## 3. 按钮组的使用

### 3.1 使用按钮组

通过为按钮组添加`.btn-group`类的包围元素，即可设置按钮组。

示例代码：

```java
<div class="btn-group">
    <button type="button" class="btn btn-info">篮球</button>
    <button type="button" class="btn btn-warning">足球</button>
    <button type="button" class="btn btn-success">乒乓球</button>
</div>
```

对应效果：

### 3.2 调整按钮组的大小

可以通过`btn-group-lg`、`btn-group-sm`、`btn-group-xs`类调整按钮组大小。

示例代码：

```java
<div class="col-md-12" style="margin-top:8px;">
    <div class="btn-group btn-group-lg">
        <button type="button" class="btn btn-info">篮球</button>
        <button type="button" class="btn btn-warning">足球</button>
        <button type="button" class="btn btn-success">乒乓球</button>
    </div>
    <div class="btn-group btn-group-sm">
        <button type="button" class="btn btn-info">篮球</button>
        <button type="button" class="btn btn-warning">足球</button>
        <button type="button" class="btn btn-success">乒乓球</button>
    </div>
    <div class="btn-group btn-group-xs">
        <button type="button" class="btn btn-info">篮球</button>
        <button type="button" class="btn btn-warning">足球</button>
        <button type="button" class="btn btn-success">乒乓球</button>
    </div>
</div>
```

对应效果：

### 3.3 调整按钮组方向

通过设置`btn-group-vertical`类，可以将按钮组转化为垂直方向显示。

示例代码：

```java
<div class="btn-group btn-group-vertical">
    <button type="button" class="btn btn-info">篮球</button>
    <button type="button" class="btn btn-warning">足球</button>
    <button type="button" class="btn btn-success">乒乓球</button>
</div>
```

对应效果：

## 4. 小结

Bootstrap提供的按钮和按钮组风格多样，基本能满足使用需求，后期很多很多前端框架，也是参考了Bootstrap这一经典设计。
