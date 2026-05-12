# 15、SVG 模糊效果 &lt;feGaussianBlur&gt;
- 来源：https://ddkk.com/zhuanlan/other/svg/15.html
- 分类：SVG 教程
- 分组：教程目录
使用`` 元素可以创建模糊效果

> warn: 注意： Internet Explorer 和 Safari 不支持 SVG 滤镜！

##  和

``标签用来定义SVG滤镜，但所有的 SVG 滤镜必须定义在 ``元素中

`` 元素定义短并含有特殊元素（如滤镜）定义

`` 标签使用必需的 id 属性来定义向图形应用哪个滤镜？

## SVG

`` 元素用于创建模糊效果

### 范例 1

我们要创建一个如下图的模糊效果

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <defs>
    <filter id="f1" x="0" y="0">
      <feGaussianBlur in="SourceGraphic" stdDeviation="15" 
/>
    </filter>
  </defs>
  <rect width="90" height="90" stroke="green" stroke-width="3"
  fill="yellow" filter="url(#f1)" />
</svg>
```

对于 **Opera** 用户： 查看 SVG 文件 （右键单击 SVG 图形预览源）

### 说明

- ``元素 id 属性定义一个滤镜的唯一名称
- `` 元素定义模糊效果
- in="SourceGraphic" 这个部分定义了由整个图像创建效果
- stdDeviation 属性定义模糊量
- `` 元素的滤镜属性用来把元素链接到 f1 滤镜
