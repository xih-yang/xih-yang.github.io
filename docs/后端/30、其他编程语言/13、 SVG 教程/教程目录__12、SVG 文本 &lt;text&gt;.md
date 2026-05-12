# 12、SVG 文本 &lt;text&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/12.html
- 分类：SVG 教程
- 分组：教程目录
`` 元素可以定义文本段

## 范例 1

定义一个文本段

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<text x="0" y="15" fill="red">我爱DDKK.COM 弟弟快看，程序员编程资料站</text>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 范例 2

旋转的文字

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<text x="0" y="15" fill="red" transform="rotate(30 20,40)">我爱DDKK.COM 弟弟快看，程序员编程资料站</text>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 范例 3

路径上的文字

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1"
xmlns:xlink="http://www.w3.org/1999/xlink">
   <defs>
    <path id="path1" d="M75,20 a1,1 0 0,0 100,0" />
  </defs>
  <text x="10" y="100" style="fill:red;">
    <textPath xlink:href="#path1">我爱 DDKK.COM 教程</textPath>
  </text>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 范例 4

`` 元素可以使用 `` 来定义分组

每个``元素可以包含不同的格式和位置

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <text x="10" y="20" style="fill:red;"><text>可以包含 tspan :
    <tspan x="10" y="45">第一个 tspan 文版</tspan>
    <tspan x="10" y="70">第二个 tspan 文本</tspan>
  </text>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击SVG图形预览源）

## 范例 5

定义一个链接文本（ `` 元素）

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1"
xmlns:xlink="http://www.w3.org/1999/xlink">
  <a xlink:href="http://www.w3schools.com/svg/" 
target="_blank">
    <text x="0" y="15" fill="red">我爱DDKK.COM 弟弟快看(www.ddkk.com)</text>
  </a>
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）
