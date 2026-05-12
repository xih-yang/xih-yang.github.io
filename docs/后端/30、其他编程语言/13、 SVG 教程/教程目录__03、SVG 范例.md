# 03、SVG 范例
- 来源：https://ddkk.com/zhuanlan/other/svg/3.html
- 分类：SVG 教程
- 分组：教程目录
开始学习之前，我们先来看一个简单的 SVG 范例, 包含了 SVG 的一些基本要素

## 简单的 SVG 实例

我们来画一个简单的 SVG 圆形

这里是SVG文件（SVG文件的保存与SVG扩展）

```xml
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
<circle cx="100" cy="50" r="40" stroke="black"stroke-width="2" fill="red" />
</svg>
```

结果如下

### SVG 代码解析

- 第一行包含了 XML 声明

> 请注意 standalone 属性！该属性规定此 SVG 文件是否是"独立的"，或含有对外部文件的引用 standalone="no" 意味着 SVG 文档会引用一个外部文件 - 在这里，是 DTD 文件

- 第二和第三行引用了这个外部的 SVG DTD： 该 DTD 位于 http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd 该 DTD 位于 W3C，含有所有允许的 SVG 元素
- SVG 代码以 `` 元素开始，包括开启标签 `` 和关闭标签 ``
- `` 根元素
- width 和 height 属性可设置此 SVG 文档的宽度和高度
- version 属性可定义所使用的 SVG 版本
- xmlns 属性可定义 SVG 命名空间
- SVG 的 `` 用来创建一个圆:
- cx 和 cy 属性定义圆中心的 x 和 y 坐标。如果忽略这两个属性，那么圆点会被设置为 (0, 0)
- r 属性定义圆的半径
- stroke 和 stroke-width 属性控制如何显示形状的轮廓，我们把圆的轮廓设置为 2px 宽，黑边框
- fill 属性设置形状内的颜色，我们把填充颜色设置为红色。
- 关闭标签的作用是关闭 SVG 元素和文档本身

> 注意： 所有的开启标签必须有关闭标签
