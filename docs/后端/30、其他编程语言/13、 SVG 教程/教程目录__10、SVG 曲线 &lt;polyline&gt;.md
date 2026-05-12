# 10、SVG 曲线 &lt;polyline&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/10.html
- 分类：SVG 教程
- 分组：教程目录
`` 元素可以画任何只有直线的形状

## 范例 1

我们来画一条直线

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <polyline points="20,20 40,25 60,40 80,120 120,140 200,180"
  style="fill:none;stroke:black;stroke-width:3" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

## 范例 2

我们再来画一条直线，然后填充蓝色

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <polyline points="0,40 40,40 40,80 80,80 80,120 120,120 120,160" style="fill:blue;stroke:green;stroke-width:3" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）
