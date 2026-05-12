# 17、SVG 渐变 &lt;linearGradient&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/17.html
- 分类：SVG 教程
- 分组：教程目录
**渐变** 是一种从一种颜色到另一种颜色的平滑过渡，我们也可以把多个颜色的过渡应用到同一个元素上

SVG渐变主要有两种类型：

- Linear
- Radial

## SVG 线性渐变 -

`` 元素用于定义线性渐变

`` 标签必须嵌套在 ``的内部

> 标签是 definitions 的缩写，它可对诸如渐变之类的特殊元素进行定义

线性渐变可以定义为水平、垂直或角渐变：

- 当 y1 和 y2 相等，而 x1 和 x2 不同时，可创建水平渐变
- 当 x1 和 x2 相等，而 y1 和 y2 不同时，可创建垂直渐变
- 当 x1 和 x2 不同，且 y1 和 y2 不同时，可创建角形渐变

## 范例 1

定义水平线性渐变从黄色到红色的椭圆形

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<defs>
<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
<stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
</linearGradient>
</defs>
<ellipse cx="200" cy="70" rx="85" ry="55"
fill="url(#grad1)" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击SVG图形预览源）

### 解释

- `` 标签的 id 属性可为渐变定义一个唯一的名称
- `` 标签的 x1，x2，y1，y2 属性定义渐变开始和结束位置
- 渐变的颜色范围可由两种或多种颜色组成，每种颜色通过一个 ``标签来规定。
- offset 属性用来定义渐变的开始和结束位置
- 填充属性把 ellipse 元素链接到此渐变

## 范例 2: 定义一个垂直线性渐变从黄色到红色的椭圆形：

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<defs>
<linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
<stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
</linearGradient>
</defs>
<ellipse cx="200" cy="70" rx="85" ry="55" fill="url(#grad1)" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击SVG图形预览源）

## 范例 3:

画一个椭圆，水平线性渐变从黄色到红色并添加一个椭圆内文本

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<defs>
<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
<stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
</linearGradient>
</defs>
<ellipse cx="200" cy="70" rx="85" ry="55"
fill="url(#grad1)" />
  <text fill="#ffffff" font-size="24" font-family="Verdana" x="150" y="86">
  DDKK.COM 弟弟快看，程序员编程资料站</text>
</svg>
```

对于Opera用户： 查看SVG文件 （右键单击SVG图形预览源）

### 说明

- `` 元素是用来显示一段文本
