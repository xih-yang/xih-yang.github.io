# 07、SVG 椭圆 &lt;ellipse&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/7.html
- 分类：SVG 教程
- 分组：教程目录
`` 元素可以画一个椭圆

## SVG 椭圆 -

`` 元素可以画一个椭圆

椭圆与圆很相似。不同之处在于椭圆有不同的 x 和 y 半径，而圆的 x 和 y 半径是相同

也可以说，圆是椭圆的特殊情形

## 范例

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <ellipse cx="300" cy="80" rx="100" ry="50"  
     style="fill:yellow;stroke:purple;stroke-width:2"/>
</svg>
```

对于 **Opera** 9以下用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

### 解释

- cx 属性定义的椭圆中心的 x 坐标
- cy 属性定义的椭圆中心的 y 坐标
- rx 属性定义的水平半径
- ry 属性定义的垂直半径

## 范例 2

我们来画三个累叠而上的椭圆

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<ellipse cx="240" cy="100" rx="220" ry="30" style="fill:purple"/>
<ellipse cx="220" cy="70" rx="190" ry="20" style="fill:lime"/>
<ellipse cx="210" cy="45" rx="170" ry="15" style="fill:yellow"/>
</svg>
```

对于 **Opera** 9以下用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 范例 3

我们来画2个椭圆（一个黄的和一个绿的）

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<ellipse cx="100" cy="100" rx="70" ry="100" style="fill:yellow"/>
<ellipse cx="100" cy="100" rx="60" ry="90" style="fill:green"/>
</svg>
```

对于 **Opera** 9以下用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）
