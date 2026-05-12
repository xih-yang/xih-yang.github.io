# 18、CSS基础知识 - BFC和IFC
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/18.html
- 分类：前端框架
- 分组：教程目录
## 一、BFC

### 1、概念

BFC：块级格式化上下文，是页面中的一块渲染区域，有一套自己的渲染规则，决定子元素如何定位，以及和其他元素的关系和相互作用

### 2、作用

作用：可以将BFC理解成一个箱子，不会影响箱子外部，解决传统布局带来的问题

**传统布局问题：**

相邻块元素的垂直外边距合并：两个盒子设置BFC

嵌套块元素的垂直外边距塌陷：父级盒子设置BFC，父元素position

浮动流造成父级元素高度坍塌：父级盒子设置BFC

浮动元素覆盖：非浮动元素设置BFC

### 3、触发条件

**触发条件：**

根元素（html元素）、float（left | right | inherit）、position（absolute | fixed）、display（flex | table-cell | inline-block）、overflow（hidden | scroll | auto）
