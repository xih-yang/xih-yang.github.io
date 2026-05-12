# 11、SVG 路径 &lt;path&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/11.html
- 分类：SVG 教程
- 分组：教程目录
`` 元素可以画一个路径

`` 定义了以下命令用于路径数据

- M = moveto
- L = lineto
- H = horizontal lineto
- V = vertical lineto
- C = curveto
- S = smooth curveto
- Q = quadratic Bézier curve
- T = smooth quadratic Bézier curveto
- A = elliptical Arc
- Z = closepath

> warn: 注意： 上面所有命令均允许小写字母
>
> 大写表示绝对定位，小写表示相对定位

## 范例 1

我们来画一条路径，它开始于位置 100 0，到达位置 25 150，然后从那里开始到 175 150，最后在 100 0 关闭路径

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<path d="M100 0 L25 150 L175 150 Z" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 范例 2

贝兹曲线是流畅的曲线模型，可无限期的缩放

用户可以选择两个端点和一个或两个控制点

- 一个控制点的贝塞尔曲线被称为二次贝塞尔曲线
- 两个控制点的那种被称为立方体

我们来画一个二次贝塞尔曲线，A和C分别是起点和终点，B是控制点

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <path id="lineAB" d="M 100 350 l 150 -300" stroke="red"
  stroke-width="3" fill="none" />
  <path id="lineBC" d="M 250 50 l 150 300" stroke="red"
  stroke-width="3" fill="none" />
  <path d="M 175 200 l 150 0" stroke="green" stroke-width="3"
  fill="none" />
  <path d="M 100 350 q 150 -300 300 0" stroke="blue"
  stroke-width="5" fill="none" />
  <!-- Mark relevant points -->
  <g stroke="black" stroke-width="3" fill="black">
    <circle id="pointA" cx="100" cy="350" r="3" />
    <circle id="pointB" cx="250" cy="50" r="3" />
    <circle id="pointC" cx="400" cy="350" r="3" />
  </g>
  <!-- Label the points -->
  <g font-size="30" font="sans-serif" fill="black" stroke="none"
  text-anchor="middle">
    <text x="100" y="350" dx="-30">A</text>
    <text x="250" y="50" dy="-10">B</text>
    <text x="400" y="350" dx="30">C</text>
  </g>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）
