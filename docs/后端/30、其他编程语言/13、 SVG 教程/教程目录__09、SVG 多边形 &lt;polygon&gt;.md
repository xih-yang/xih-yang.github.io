# 09、SVG 多边形 &lt;polygon&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/9.html
- 分类：SVG 教程
- 分组：教程目录
`` 标签可以画含有不少于三个边的图形

## SVG 多边形 -

`` 标签可以画含有不少于三个边的图形

多边形是由直线组成，其形状是 封闭 的（所有的线条连接起来）

> polygon来自希腊，Poly 意味 "many" ， "gon" 意味 "angle"

## 范例 1

我们来画一个三角形

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<polygon points="200,10 250,190 160,210"
style="fill:lime;stroke:purple;stroke-width:1"/>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

### 说明

- points 属性定义多边形每个角的 x 和 y 坐标

## 范例 2

我们来画一个四边形

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<polygon points="220,10 300,210 170,250 123,234" 
   style="fill:lime;stroke:purple;stroke-width:1"/>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 范例 3

我们用`` 元素画一个星型

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <polygon points="100,10 40,180 190,60 10,60 160,180" 
    style="fill:lime;stroke:purple;stroke-width:5;fill-rule:nonzero;" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 范例 4

改变fill-rule 属性为 evenodd

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <polygon points="100,10 40,180 190,60 10,60 160,180"
        style="fill:lime;stroke:purple;stroke-width:5;fill-rule:evenodd;" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）
