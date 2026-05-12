# 12、Bootstrap 入门 - 使用图标
- 来源：https://ddkk.com/zhuanlan/qianduan/bootstrap/1/12.html
- 分类：前端框架
- 分组：教程目录
## 1. 背景

大家都晓得，使用图标后，页面效果肯定是好许多的。

一个简单的按钮，添加图标后，有一种传神的效果。精美的图标是要收费的，你享受人家优秀的成果，就得付出相应的价钱。

有一个相当不错的图标库Glyphicon，老外做的，一般情况下咱们要正儿八经的使用，是要收费的。

但是在Bootstrap框架下，使用Glyphicon图标是免费的，就是这么神奇！

## 2. 使用Glyphicon图标

使用Glyphicon图标很简单，为``标签添加相应的样式类即可，例如搜索图标。

```java
<span class="glyphicon glyphicon-search"></span>
```

效果如下：

如果想使用其他图标，可以从此查询[Glyphicon图标查询](https://v3.bootcss.com/components/#glyphicons)。

## 3. 结合按钮使用

图标最常见的使用场景就是结合按钮使用了，可以直接将图标元素放入按钮元素中。示例代码：

```java
<button type="button" class="btn btn-primary">
    <span class="glyphicon glyphicon-search"></span> 搜索
</button>
```

效果如下：

## 4. 小结

Glyphicon提供的图标库还是比较完整全面的，基本够用，需要使用时直接查询下，找到符合需求的样式类然后使用即可。
