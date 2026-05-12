# 17、Bootstrap 入门 - 分页
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/17.html
- 分类：前端框架
- 分组：教程目录
## 1. 概述

Bootstrap除了提供了表格，还提供了分页控件，使用起来也是比较简单，推荐大家尝试。

## 2. 基本分页

通过为``元素设置`pagination`类，即可将列表转化为分页控件。示例代码：

```java
<div class="col-md-12">
普通分页:<br>
<ul class="pagination">
    <li>
        <a class="btn"><span class="glyphicon glyphicon-backward"></span></a>
    </li>
    <li><a href="#">1</a></li>
    <li><a href="#">2</a></li>
    <li><a href="#">3</a></li>
    <li><a href="#">4</a></li>
    <li><a href="#">5</a></li>
    <li>
        <a class="btn"><span class="glyphicon glyphicon-forward"></span></a>
    </li>
</ul>
</div>
```

对应效果如下，需要注意的是按钮中间的图标使用了glyphicon图标库。

## 3. 使用转义字符

使用图标的话，加载速度相对较慢，而且样式和页码数字也不够匹配，推进使用转移字符替代。代码如下：

```java
<div class="col-md-12">
    使用转义字符:<br>
    <ul class="pagination">
        <li>
            <a class="btn"><span>«</span></a>
        </li>
        <li><a href="#">1</a></li>
        <li><a href="#">2</a></li>
        <li><a href="#">3</a></li>
        <li><a href="#">4</a></li>
        <li><a href="#">5</a></li>
        <li>
            <a class="btn"><span>»</span></a>
        </li>
    </ul>
</div>
```

对应效果如下，可以看出上一页、下一页按钮更加自然一点。

## 4. 调整分页控件大小

可以使用`pagination-lg`或`pagination-sm`类，设置大号或小号的分页控件。

代码如下：

```java
<div class="col-md-12">
    大号分页:<br>
    <ul class="pagination pagination-lg">
        <li>
            <a class="btn"><span>«</span></a>
        </li>
        <li><a href="#">1</a></li>
        <li><a href="#">2</a></li>
        <li><a href="#">3</a></li>
        <li><a href="#">4</a></li>
        <li><a href="#">5</a></li>
        <li>
            <a class="btn"><span>»</span></a>
        </li>
    </ul>
</div>
<div class="col-md-12">
    小号分页：<br>
    <ul class="pagination pagination-sm">
        <li>
            <a class="btn"><span>«</span></a>
        </li>
        <li><a href="#">1</a></li>
        <li><a href="#">2</a></li>
        <li><a href="#">3</a></li>
        <li><a href="#">4</a></li>
        <li><a href="#">5</a></li>
        <li>
            <a class="btn"><span>»</span></a>
        </li>
    </ul>
</div>
```

对应效果如下：

## 5. 设置分页按钮状态

分页按钮可以设置选中，禁用状态，常用选中状态表示当前页。

可以使用`active`类设置选中状态，使用`disabled`类设置禁用状态，代码如下：

```java
<div class="col-md-12">
    分页按钮状态<br>
    <ul class="pagination">
        <li>
            <a class="btn"><span>«</span></a>
        </li>
        <li class="active"><a href="#">1</a></li>
        <li><a href="#">2</a></li>
        <li><a href="#">3</a></li>
        <li><a href="#">4</a></li>
        <li class="disabled"><a href="#">5</a></li>
        <li>
            <a class="btn"><span>»</span></a>
        </li>
    </ul>
</div>
```

对应效果如下：

## 6. 小结

Bootstrap分页控件样式还是可以的，如果仔细观察，使用的网站也比较多。我们在开发自己的网站时，也可以选用。
