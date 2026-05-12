# 19、Bootstrap 入门 - 下拉菜单、按钮式下拉菜单
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/19.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

下拉菜单使用频率也是比较高的，比较常见的使用场景是在导航菜单栏，某个主菜单含有下拉的子菜单。

Bootstrap为下拉菜单提供了两种实现方式，即普通的下拉菜单还有按钮式的下拉菜单。我们先看一张图观察下，从图中可以看出，普通下拉菜单和按钮式下拉菜单的样式基本相同，唯一比较明显的区别是：普通下拉菜单相当于菜单，前后自动换行；而按钮式的下拉菜单相当于按钮，前后不换行。

## 2. 下拉菜单

### 2.1 普通下拉菜单

先来看下普通下拉菜单的示例代码，通过`dropdown`描述一个下拉菜单，下拉菜单的主按钮通过`dropdown-toggle`类描述，下拉子菜单的部分是`dropdown-menu`类描述的ul元素。最后注意下拉箭头是通过`caret`样式类实现的。

```java
普通下拉菜单：
<div class="dropdown">
    <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
        下发命令
        <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
        <li><a href="#">命令1</a></li>
        <li><a href="#">命令2</a></li>
    </ul>
</div>
```

效果如下：

### 2.2 更换颜色

其实就是更换按钮的样式类，如下代码将默认按钮改为了首选按钮`btn-primary`。

```java
更换颜色:
<div class="dropdown">
    <button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">
        下发命令
        <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
        <li><a href="#">命令1</a></li>
        <li><a href="#">命令2</a></li>
    </ul>
</div>
```

效果如下：

### 2.3 更换尺寸

其实就是通过`btn-lg`或`btn-sm`更换按钮的尺寸。

```java
更换尺寸:
<div class="dropdown">
    <button class="btn btn-default btn-lg dropdown-toggle" type="button" data-toggle="dropdown">
        下发命令
        <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
        <li><a href="#">命令1</a></li>
        <li><a href="#">命令2</a></li>
    </ul>
</div>
```

效果如下：

### 2.4 添加分割线

可以在子菜单之间添加分割线，示例代码：

```java
添加分割线：
<div class="dropdown">
    <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
        下发命令
        <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
        <li><a href="#">命令1</a></li>
        <li role="separator" class="divider"></li>
        <li><a href="#">命令2</a></li>
    </ul>
</div>
```

效果如下：

### 2.5 菜单分组

如果子菜单较多，还可以进行分组：

```java
菜单分组：
<div class="dropdown">
    <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
        下发命令
        <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
        <li class="dropdown-header">分组1</li>
        <li><a href="#">命令1</a></li>
        <li><a href="#">命令2</a></li>
        <li class="dropdown-header">分组2</li>
        <li><a href="#">命令3</a></li>
        <li><a href="#">命令4</a></li>
    </ul>
</div>
```

效果如下：

### 2.6 上拉菜单

这个实现比较奇葩，可以让子菜单弹出方向改变，真实使用场景我都没见过。只需要将dropdown样式类改为dropup即可。

```java
上拉菜单：
<div class="dropup">
    <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
        下发命令
        <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
        <li><a href="#">命令1</a></li>
        <li><a href="#">命令2</a></li>
    </ul>
</div>
```

## 3. 按钮式下拉菜单

按钮式下拉菜单的实现，只需要将之前的dropdown样式类改为btn-group即可，有个例外是上拉菜单，需要将dropup改为btn-group和dropup两个样式类。

具体代码如下：

```java
<div class="col-md-12">
    按钮式下拉菜单：
    <div class="btn-group">
        <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
            下发命令
            <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li><a href="#">命令1</a></li>
            <li><a href="#">命令2</a></li>
        </ul>
    </div>
    更换颜色:
    <div class="btn-group">
        <button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">
            下发命令
            <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li><a href="#">命令1</a></li>
            <li><a href="#">命令2</a></li>
        </ul>
    </div>
    更换尺寸:
    <div class="btn-group">
        <button class="btn btn-default btn-lg dropdown-toggle" type="button" data-toggle="dropdown">
            下发命令
            <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li><a href="#">命令1</a></li>
            <li><a href="#">命令2</a></li>
        </ul>
    </div>
    添加分割线：
    <div class="btn-group">
        <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
            下发命令
            <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li><a href="#">命令1</a></li>
            <li role="separator" class="divider"></li>
            <li><a href="#">命令2</a></li>
        </ul>
    </div>
    菜单分组：
    <div class="btn-group">
        <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
            下发命令
            <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li class="dropdown-header">分组1</li>
            <li><a href="#">命令1</a></li>
            <li><a href="#">命令2</a></li>
            <li class="dropdown-header">分组2</li>
            <li><a href="#">命令3</a></li>
            <li><a href="#">命令4</a></li>
        </ul>
    </div>
    上拉菜单：
    <div class="btn-group dropup">
        <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
            下发命令
            <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li><a href="#">命令1</a></li>
            <li><a href="#">命令2</a></li>
        </ul>
    </div>
</div>
```

## 4. 小结

在实际使用中，建议是用按钮式的下拉菜单。
