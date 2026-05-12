# 05、SVG 矩形 &lt;rect&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/5.html
- 分类：SVG 教程
- 分组：教程目录
`` 标签可以画矩形，圆角矩形，半透明矩形等等

## SVG 形状

SVG规范有一些预定义的形状元素，可被开发者使用和操作：

- 矩形 ``
- 圆形 ``
- 椭圆 ``
- 线 ``
- 折线 ``
- 多边形 ``
- 路径 ``

## SVG 矩形 -

`` 标签可以画矩形，圆角矩形，半透明矩形等等

## 范例 1

我们来画一个简单的矩形

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<rect width="300" height="100"
style="fill:rgb(0,0,255);stroke-width:1;stroke:rgb(0,0,0)"/>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

### 解释

- `` 元素的 width 和 height 属性定义矩形的高度和宽度
- style 属性用来定义 CSS 属性
- CSS 的 fill 属性定义矩形的填充颜色（RGB 值、颜色名或者十六进制值）
- CSS 的 stroke-width 属性定义矩形边框的宽度
- CSS 的 stroke 属性定义矩形边框的颜色

## 范例 2

我们看看另一个矩形范例，它包含一些新的属性

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="500">
<rect x="50" y="20" width="150" height="150"
style="fill:blue;stroke:pink;stroke-width:5;fill-opacity:0.1;
  stroke-opacity:0.9"/>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

### 解释

- x 属性定义矩形的左侧位置（例如，x="0" 定义矩形到浏览器窗口左侧的距离是 0px）
- y 属性定义矩形的顶端位置（例如，y="0" 定义矩形到浏览器窗口顶端的距离是 0px）
- CSS 的 fill-opacity 属性定义填充颜色透明度（合法的范围是：0 - 1）
- CSS 的 stroke-opacity 属性定义笔触颜色的透明度（合法的范围是：0 - 1）

## 范例 3 : 半透明矩形

CSSopacity 属性用于定义元素的透明值

> opacity 的值的范围: [0,1] 0 为全透明 1 为不透明

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="300">
<rect x="50" y="20" width="150" height="150"
style="fill:blue;stroke:pink;stroke-width:5;opacity:0.5"/>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 范例 4 : 圆角矩形

rx 和 ry 属性可使矩形产生圆角

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<rect x="50" y="20" rx="20" ry="20" width="80"
height="100"
  style="fill:red;stroke:black;stroke-width:5;opacity:0.5"/>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）
