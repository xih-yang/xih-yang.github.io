# 13、SVG 属性 stroke
- 来源：https://ddkk.com/zhuanlan/other/svg/13.html
- 分类：SVG 教程
- 分组：教程目录
stroke 开头的属性可以定义线段的各种属性，包括线条的宽度、起末的形状、线条类型

SVG提供了一个范围广泛 stroke 属性，但我们主要讲解一下几种：

- stroke
- stroke-width
- stroke-linecap
- stroke-dasharray

> 所有 stroke 属性可用在任何种类的线条、文字和元素

## SVG stroke 属性

stroke 属性定义一条线，文本或元素轮廓颜色

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <g fill="none">
    <path stroke="red" d="M5 20 l215 0" />
    <path stroke="blue" d="M5 40 l215 0" />
    <path stroke="black" d="M5 60 l215 0" />
  </g>
</svg>
```

[尝试一下 »](/t/penglei/svg/stroke_1)

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## SVG stroke-width 属性

stroke-width 属性定义了一条线，文本或元素轮廓厚度

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <g fill="none" stroke="black">
    <path stroke-width="2" d="M5 20 l215 0" />
    <path stroke-width="4" d="M5 40 l215 0" />
    <path stroke-width="6" d="M5 60 l215 0" />
  </g>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## SVG stroke-linecap 属性

stroke-linecap 属性定义不同类型的开放路径的终结

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <g fill="none" stroke="black" stroke-width="6">
    <path stroke-linecap="butt" d="M5 20 l215 0" />
    <path stroke-linecap="round" d="M5 40 l215 0" />
    <path stroke-linecap="square" d="M5 60 l215 0" />
  </g>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## SVG stroke-dasharray 属性

stroke-dasharray 属性用于创建虚线

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <g fill="none" stroke="black" stroke-width="4">
    <path stroke-dasharray="5,5" d="M5 20 l215 0" />
    <path stroke-dasharray="10,10" d="M5 40 l215 0" />
    <path stroke-dasharray="20,10,5,5,5,10" d="M5 60 l215 0" />
  </g>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）
