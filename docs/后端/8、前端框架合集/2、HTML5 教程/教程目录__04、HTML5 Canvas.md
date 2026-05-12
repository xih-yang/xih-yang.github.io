# 04、HTML5 Canvas
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/4.html
- 分类：前端框架
- 分组：教程目录
HTML5 支持使用 `` 标签定义图形，比如图表和其它图像，但必须使用脚本来绘制图形

下面的范例在画布上（Canvas）画一个红色矩形，渐变矩形，彩色矩形，和一些彩色的文字

你的浏览器不支持 HTML5 的 `` 元素

## 什么是 Canvas?

HTML5 `` 元素用于图形的绘制，通过脚本 ( 通常是 JavaScript )来完成

`` 标签只是图形容器，必须使用脚本来绘制图形

HTML5 提供了多种方法使用 Canvas 绘制路径,盒、圆、字符以及添加图像

## 浏览器支持

4.0+
9.0+
2.0+
3.1+
9.0+

## 创建一个画布 ( canvas )

一个画布在网页中是一个矩形框，通过 `` 元素来绘制

> 注意: 默认情况下  元素没有边框和内容

```html
<canvas id="myCanvas" width="200" height="100"></canvas>
```

`` 标签通常需要指定一个 id 属性 (脚本中经常引用), width 和 height 属性定义的画布的大小

而且可以在 HTML 页面中使用多个 `` 元素

可以使用 style 属性来添加边框

```html
<canvas id="canvas-1" width="200" height="100"
style="border:1px solid #000000;">
</canvas>
```

在浏览器中显示如下

## 使用 JavaScript 来绘制图像

`` 元素本身是没有绘图能力的，所有的绘制工作必须在 JavaScript 内部完成

```html
var c=document.getElementById("canvas-2");
var ctx=c.getContext("2d");
ctx.fillStyle="#FF0000";
ctx.fillRect(0,0,150,75);
```

在浏览器中显示如下

上面的代码中

**1、** 首先通过id找到``元素；

```html
var c=document.getElementById("myCanvas");
```

**2、** 然后，创建context对象；

```html
var ctx=c.getContext("2d");
```

getContext("2d") 对象是内建的 HTML5 对象，拥有多种绘制路径、矩形、圆形、字符以及添加图像的方法
**3、** 下面的两行代码绘制一个红色的矩形；

```html
ctx.fillStyle="#FF0000";
ctx.fillRect(0,0,150,75);
```

设置 fillStyle 属性可以是 CSS 颜色，渐变，或图案

fillStyle 默认设置是 #000000（黑色）

fillRect( x,y,width,height ) 方法定义了矩形当前的填充方式

## Canvas 坐标

canvas 是一个二维网格

canvas 的左上角坐标为 (0,0)

上面的fillRect 方法使用参数 (0,0,150,75)

意思是：在画布上绘制 150x75 的矩形，从左上角开始 (0,0)

下面的范例中，画布的 X 和 Y 坐标用于在画布上对绘画进行定位

可以将鼠标移动的矩形框上，显示定位坐标

X

Y

## Canvas - 路径

我们可以使用下面两个方法在 Canvas 上画线段

**1、** moveTo(x,y)定义线条开始坐标；

**2、** lineTo(x,y)定义线条结束坐标；

绘制线条时我们必须使用到 ink() 的方法，就像 stroke()

### 范例

下面的范例定义开始坐标(0,0), 和结束坐标 (200,100)

然后使用 stroke() 方法来绘制线条

```html
var c   = document.getElementById("canvas-3");
var ctx = c.getContext("2d"); 
ctx. moveTo(0,0);
ctx.lineTo(200,100);
ctx.stroke();
```

你的浏览器不支持 HTML5 的 `` 元素

在canvas 中绘制圆形, 我们将使用以下方法

```html
arc(x,y,r,start,stop)
```

实际上我们在绘制圆形时使用了 "ink" 的方法, 比如 stroke() 或者 fill()

## 绘制图形

可以使用 arc() 方法 绘制一个圆

你的浏览器不支持 HTML5 的 `` 元素

```html
var c=document.getElementById("canvas-4");
var ctx=c.getContext("2d");
ctx.beginPath();
ctx.arc(95,50,40,0,2*Math.PI);
ctx.stroke();
```

## Canvas - 文本

可以组合应用下面几个方法在 画布上绘制文本

方法
描述

font
定义字体

fillText( text,x,y )
在 canvas 上绘制实心的文本

strokeText( text,x,y )
在 canvas 上绘制空心的文本

### 范例

下面的范例使用 fillText() 方法绘制文本

我们使用 "Arial" 字体在画布上绘制一个高 30px 的文字（实心）

你的浏览器不支持 HTML5 的 `` 元素

```html
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
ctx.font="30px Arial";
ctx.fillText("Hello World",10,50);
```

### 范例 2

下面的范例使用 strokeText() 在画布上绘制文本

我们使用 "Arial" 字体在画布上绘制一个高 30px 的文字（空心）

你的浏览器不支持 HTML5 的 `` 元素

```html
var c=document.getElementById("myCanvas");
var ctx=c.getContext("2d");
ctx.font="30px Arial";
ctx.strokeText("Hello World",10,50);
```

## Canvas - 渐变

渐变可以填充在矩形, 圆形, 线条, 文本等等, 各种形状可以自己定义不同的颜色

可以使用下面几个在在画布上绘制渐变

方法
说明

createLinearGradient( x,y,x1,y1 )
创建线条渐变

createRadialGradient( x,y,r,x1,y1,r1 )
创建一个径向/圆渐变

addColorStop()
指定颜色停止，参数使用坐标来描述

当我们使用渐变对象，必须使用两种或两种以上的停止颜色

addColorStop() 方法指定颜色停止，参数使用坐标来描述，可以是0至1

使用渐变，首先设置 fillStyle 或 strokeStyle 的值为 渐变，然后绘制形状，如矩形，文本，或一条线

### 范例 1

下面的范例使用 createLinearGradient() 来绘制渐变

我们首先创建一个线性渐变，然后使用渐变填充矩形

你的浏览器不支持 HTML5 的 `` 元素

```html
var c=document.getElementById("myCanvas");
var ctx=c.getContext("2d");
// 创建渐变
var grd=ctx.createLinearGradient(0,0,200,0);
grd.addColorStop(0,"red");
grd.addColorStop(1,"white");
// 填充渐变
ctx.fillStyle=grd;
ctx.fillRect(10,10,150,80);
```

### 范例 2

下面的范例使用 createRadialGradient() 创建渐变

我们首先创建一个径向/圆渐变，然后使用渐变填充矩形

你的浏览器不支持 HTML5 的 `` 元素

```html
var c=document.getElementById("myCanvas");
var ctx=c.getContext("2d");
// 创建渐变
var grd=ctx.createRadialGradient(75,50,5,90,60,100);
grd.addColorStop(0,"red");
grd.addColorStop(1,"white");
// 填充渐变
ctx.fillStyle=grd;
ctx.fillRect(10,10,150,80);
```

## Canvas - 图像

方法drawImage() 方法用来将一幅图片绘制到画布上

### 语法

```html
ctx.drawImage( image,x,y )
```

下面的范例将这幅图片绘制到画布上

```html
var c=document.getElementById("myCanvas");
var ctx=c.getContext("2d");
var img=document.getElementById("scream");
ctx.drawImage(img,10,10);
```

你的浏览器不支持 HTML5 的 `` 元素

```html
var c=document.getElementById("myCanvas");
var ctx=c.getContext("2d");
var img=document.getElementById("scream");
ctx.drawImage(img,10,10);
```

## HTML Canvas 参考手册

HTML5 `` 标签的完整属性可以参考 Canvas 参考手册

## HTML  标签

Tag
描述

HTML5 的 canvas 元素使用 JavaScript 在网页上绘制图像
