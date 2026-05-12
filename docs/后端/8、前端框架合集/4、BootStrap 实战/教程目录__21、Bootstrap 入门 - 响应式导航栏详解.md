# 21、Bootstrap 入门 - 响应式导航栏详解
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/21.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

在很长的一段时间里，我都很羡慕一个一些大神的个人网站。这些网站有一个共同特点，同时支持PC端显示和手机端显示。

当使用手机打开时，导航栏会自动折叠为一个按钮，效果棒极了。

后来学会了Bootstrap才知道，偶买噶，Bootstrap提供的导航栏原来天生就带这效果。厉害！

## 2. 响应式导航栏

导航栏的创建还是比较复杂的，但是不要担心，我们来一步步分析创建过程。

第1步，创建一个导航栏navbar。

```java
<nav class="navbar navbar-default">
</nav>
```

第2步，添加`.container-fluid`类的容器，这样可以让导航栏内容按容器规则显示。

```java
<nav class="navbar navbar-default">
	<div class="container-fluid">
	</div>
</nav>
```

第3步，添加导航栏头部`navbar-header`，并在头部放置品牌栏`navbar-brand`，品牌蓝内放置网站图标和标题文字。

```java
<nav class="navbar navbar-default">
	<div class="container-fluid">
		<div class="navbar-header">
			<a href="#" class='navbar-brand'>
	        	<span class="glyphicon glyphicon-leaf"></span> 响应式导航栏
	        </a>
	    </div>
	</div>
</nav>
```

第4步，添加导航菜单栏，使用`nav navbar-nav`类设置。

```java
<nav class="navbar navbar-default">
    <div class="container-fluid">
        <div class="navbar-header">
            <a href="#" class='navbar-brand'>
                <span class="glyphicon glyphicon-leaf"></span> 我的博客
            </a>
        </div>
        <ul class="nav navbar-nav">
            <li class="active"><a href="#">菜单1</a></li>
            <li><a href="#">菜单2</a></li>
            <li><a href="#">菜单3</a></li>
        </ul>
    </div>
</nav>
```

经过上面的步骤，即可创建一个响应式的导航栏，当容器宽度较大时，显示如下：

当容器宽度较小时，则自动变换为：

## 3. 可折叠导航栏

虽然上面创建的导航栏，已经可以实现在手机等小屏幕设备上完整展示菜单了。

但是菜单占用的地方比较大，会遮住内容部分，此时就可以考虑使用可折叠导航栏了，当容器宽度不足时，菜单栏会折叠为一个按钮，当点击按钮时才弹出完整菜单。

首先，在导航栏的头部添加一个折叠按钮，代码如下。

```java
<div class="navbar-header">
    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse"
        data-target="#collapsed-nav">
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
    </button>
    <a href="#" class='navbar-brand'>
        <span class="glyphicon glyphicon-leaf"></span> 可折叠导航栏
    </a>
</div>
```

解释下，class="navbar-toggle collapsed"用来设置折叠样式，data-toggle="collapse"是通过JavaScript实现折叠效果，data-target="#collapsed-nav"则指向折叠的容器元素。

然后，我们将菜单部分修为：

```java
<div class="collapse navbar-collapse" id="collapsed-nav">
    <ul class="nav navbar-nav">
        <li class="active"><a href="#">菜单1</a></li>
        <li><a href="#">菜单2</a></li>
    </ul>
</div>
```

解释下，`class="collapse navbar-collapse"`设置了容器折叠样式，`id="collapsed-nav"`呼应按钮指向的id。

如此一来，当容器宽度不足时，菜单部分就折叠为一个按钮，点击按钮时弹出折叠的菜单，效果如下：

## 4. 深色导航栏

深色导航栏就比较简单了，直接添加`navbar-inverse`类即可。

```java
<nav class="navbar navbar-default navbar-inverse">
<div class="container-fluid">
    <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse"
            data-target="#collapsed-nav">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
        </button>
        <a href="#" class='navbar-brand'>
            <span class="glyphicon glyphicon-leaf"></span> 深色导航栏
        </a>
    </div>
    <div class="collapse navbar-collapse" id="collapsed-nav">
        <ul class="nav navbar-nav">
            <li class="active"><a href="#">菜单1</a></li>
            <li><a href="#">菜单2</a></li>
        </ul>
    </div>
</div>
</nav>
```

效果如下：

## 5. 顶部固定菜导航栏

有时候网页内容较多，当我们浏览完内容想要点击导航栏时，需要回到顶部，比较麻烦。

有一种效果是将导航栏固定到顶部，就算网页向下滑动，导航栏一直显示在顶部。

实现也相当简单，添加`navbar-fixed-top`类即可，代码如下：

```java
<nav class="navbar navbar-default navbar-fixed-top">
    <div class="container-fluid">
        <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse"
                data-target="#collapsed-nav">
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>
            <a href="#" class='navbar-brand'>
                <span class="glyphicon glyphicon-leaf"></span> 顶部固定导航栏
            </a>
        </div>
        <div class="collapse navbar-collapse" id="collapsed-nav">
            <ul class="nav navbar-nav">
                <li class="active"><a href="#">菜单1</a></li>
                <li><a href="#">菜单2</a></li>
            </ul>
        </div>
    </div>
</nav>
```

效果如下，当页面滑动时，导航栏固定不动。

## 6. 导航栏添加下拉菜单和表单控件

Bootstrap导航栏非常灵活，可以添加下拉菜单，同时可以添加使用`navbar-form`类修饰的表单，代码如下：

```java
<nav class="navbar navbar-default">
    <div class="container-fluid">
        <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse"
                data-target="#collapsed-nav">
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>
            <a href="#" class='navbar-brand'>
                <span class="glyphicon glyphicon-leaf"></span> 添加子菜单和表单
            </a>
        </div>
        <div class="collapse navbar-collapse" id="collapsed-nav">
            <ul class="nav navbar-nav">
                <li class="active"><a href="#">菜单1</a></li>
                <li class="dropdown">
                    <a href="#" class="dropdown-toggle" data-toggle="dropdown">菜单3 <span class="caret"></span></a>
                    <ul class="dropdown-menu">
                        <li><a href="#">子菜单3-1</a></li>
                        <li><a href="#">子菜单3-2</a></li>
                    </ul>
                </li>
            </ul>
            <form class="navbar-form navbar-right">
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="搜索">
                </div>
                <button type="button" class="btn btn-primary">按钮</button>
            </form>
        </div>
    </div>
</nav>
```

效果如下：

## 7. 小结

Bootstrap提供的导航栏可以说功能非常全面，而且稳定，而且优雅。非常好~
