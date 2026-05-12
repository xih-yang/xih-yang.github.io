# 18、SVG 渐变 &lt;radialGradient&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/18.html
- 分类：SVG 教程
- 分组：教程目录
**渐变** 是一种从一种颜色到另一种颜色的平滑过渡，我们也可以把多个颜色的过渡应用到同一个元素上

SVG渐变主要有两种类型：

- Linear
- Radial

## SVG 线性渐变

`` 元素可以定义 **放射性渐变**

`` 标签必须嵌套在 **** 的内部

>  标签是 definitions 的缩写，它可对诸如渐变之类的特殊元素进行定义

## 范例 1 : 定义一个放射性渐变从白色到蓝色椭圆

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
    <defs>
        <radialGradient id="grad1" cx="50%" cy="50%" r="50%"
        fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:rgb(255,255,255);
              stop-opacity:0" />
            <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
        </radialGradient>
    </defs>
    <ellipse cx="200" cy="70" rx="85" ry="55" fill="url(#grad1)" />
</svg>
```

对于 **Opera** 用户： 查看SVG文件 （右键单击 SVG 图形预览源）

### 说明

- `` 标签的 **id** 属性可为渐变定义一个唯一的名称
- cx，cx和 r 属性定义的最外层圆和 fx 和 fy 定义的最内层圆
- 渐变颜色范围可以由两个或两个以上的颜色组成，每种颜色用一个 ``标签指定。
- offset 属性用来定义渐变色开始和结束
- 填充属性把 ellipse 元素链接到此渐变

## 范例 2: 定义放射性渐变从白色到蓝色的另一个椭圆

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <defs>
    <radialGradient id="grad1" cx="20%" cy="30%" r="30%"
    fx="50%" fy="50%">
    <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:0" />
    <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
    </radialGradient>
  </defs>
  <ellipse cx="200" cy="70" rx="85" ry="55" fill="url(#grad1)" />
</svg>
```

对于Opera用户： 查看 SVG 文件 （右键单击SVG图形预览源）
