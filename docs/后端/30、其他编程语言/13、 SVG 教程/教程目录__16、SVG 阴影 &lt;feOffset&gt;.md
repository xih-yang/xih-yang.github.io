# 16、SVG 阴影 &lt;feOffset&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/16.html
- 分类：SVG 教程
- 分组：教程目录
`` 元素用于创建阴影效果

###  和

`` 标签用来定义 SVG 滤镜 ，但所有 SVG 滤镜都需要定义在 `` 元素中

`` 元素定义短并含有特殊元素（如滤镜）定义

`` 标签使用必需的 id 属性来定义向图形应用哪个滤镜？

> 注意：Internet Explorer 和 Safari 不支持 SVG 滤镜

## SVG

``元素是用于创建阴影效果，我们的想法是采取一个SVG图形（图像或元素）并移动它在xy平面上一点儿。

## 范例 1

偏移一个矩形（带``），然后混合偏移图像顶部（含 ``）

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <defs>
    <filter id="f1" x="0" y="0" width="200%" height="200%">
      <feOffset result="offOut" in="SourceGraphic" dx="20" 
dy="20" />
      <feBlend in="SourceGraphic" in2="offOut" 
mode="normal" />
    </filter>
  </defs>
  <rect width="90" height="90" stroke="green" stroke-width="3"
  fill="yellow" filter="url(#f1)" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 说明

- `` 元素 id 属性定义一个滤镜的唯一名称
- `` 元素的滤镜属性用来把元素链接到 f1 滤镜

## 范例 2

偏移图像也可以变的模糊（含 ``）

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <defs>
    <filter id="f1" x="0" y="0" width="200%" height="200%">
      <feOffset result="offOut" in="SourceGraphic" dx="20" dy="20" />
      <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
    </filter>
  </defs>
  <rect width="90" height="90" stroke="green" stroke-width="3"
  fill="yellow" filter="url(#f1)" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击SVG图形预览源）

## 说明

- `` 元素的 stdDeviation 属性定义了模糊量

## 范例 3

接下来制作一个黑色的阴影

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <defs>
    <filter id="f1" x="0" y="0" width="200%" height="200%">
      <feOffset result="offOut" in="SourceAlpha" dx="20" dy="20" />
      <feGaussianBlur result="blurOut" in="offOut" stdDeviation="10" />
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
    </filter>
  </defs>
  <rect width="90" height="90" stroke="green" 
    stroke-width="3" fill="yellow" filter="url(#f1)" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击SVG图形预览源）

### 说明

- `` 元素的属性改为 SourceAlpha 在 alpha 通道使用残影，而不是整个 RGBA 像素

## 范例 4

现在我们来为阴影涂上一层颜色

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <defs>
    <filter id="f1" x="0" y="0" width="200%" height="200%">
      <feOffset result="offOut" in="SourceGraphic" dx="20" dy="20" />
      <feColorMatrix result="matrixOut" in="offOut" type="matrix" 
        values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
      <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="10" />
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
    </filter>
  </defs>
  <rect width="90" height="90" stroke="green" stroke-width="3"
  fill="yellow" filter="url(#f1)" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

### 说明

- `` 过滤器是用来转换偏移的图像使之更接近黑色的颜色
- 0.2: 矩阵的三个值都获取乘以红色，绿色和蓝色通道。降低其值带来的颜色至黑色（黑色为0）
