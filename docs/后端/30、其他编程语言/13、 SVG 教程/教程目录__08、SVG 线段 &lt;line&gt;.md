# 08、SVG 线段 &lt;line&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/8.html
- 分类：SVG 教程
- 分组：教程目录
`` 元素可以用来画线段

## SVG 线段

`` 元素可以用来画线段

线段的起始坐标可以用 x1 和 y1 来定义 线段的终点坐标可以用 x2 和 y2 来定义

## 范例

我们来画一条线段,起始坐标是 (5,5)，终点左边是 (100,100)

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<line x1="5" y1="5" x2="100" y2="100" style="stroke:rgb(255,0,0);stroke-width:2"/>
</svg>
```

对于 **Opera** 9以下用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

我们知道 **线段(line)** 有起始坐标(x1,y1)和终点坐标(x2,y2)，那么

- x1 属性定义了起始坐标的 x 值
- y1 属性定义了起始坐标的 y 值
- x2 属性定义了终点坐标的 x 值
- y2 属性定义了终点坐标的 y 值
