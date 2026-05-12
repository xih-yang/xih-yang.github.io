# 08、CSS基础知识 - 盒子模型 border、padding、margin、content
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/8.html
- 分类：前端框架
- 分组：教程目录
## 前言

## 一、盒子模型

## 二、border

### 1.border

> border可以设置元素的边框。边框有三部分组成:边框宽度(粗细) 边框样式 边框颜色
>
> border : border-width || border-style || border-color

属性
作用

border-width
定义边框粗细单位是px

border-style
边框样式 有虚线实线等等

border-color
边框颜色

### 2.border-style

> 边框样式 border-style 可以设置如下值：

属性值
作用

none
没有边框即忽略所有边框的宽度（默认值）

solid
边框为单实线(最为常用的)

dashed
边框为虚线

dotted
边框为点线

### 2.边框简写

> border: 1px solid red; 没有顺序
>
> 边框分开写法：
>
> border-top: 1px solid red; /* 只设定上边框， 其余同理 */

### 3.border-collapse

> border-collapse：控制浏览器绘制表格边框的方式。它控制相邻单元格的边框。
>
> border-collapse:collapse; // collapse 单词是合并的意思，表示相邻边框合并在一起
>
> 如两个盒子的边重合在一起，那么这个重合的边就会是原来的两倍，用这个来清除边框会影响盒子实际大小

### 4. border-radius

> border-radius ：设置元素的外边框圆角
>
> 语法：
>
> border-radius:length; //参数值可以为数值或百分比的形式

> 如果是正方形，想要设置为一个圆，把数值修改为高度或者宽度的一半即可，或者直接写为 50%

> 该属性是一个简写属性，可以跟四个值，分别代表左上角、右上角、右下角、左下角
>
> 分开写：border-top-left-radius、border-top-right-radius、border-bottom-right-radius 和 border-bottom-left-radius
>
> 兼容性 ie9+ 浏览器支持, 但是不会影响页面布局,可以放心使用.

### 5.box-shadow

> CSS3 中新增了盒子阴影，我们可以使用 box-shadow 属性为盒子添加阴影。
>
> 语法：box-shadow: h-shadow v-shadow blur spread color inset;

值
描述

h-shadow
必须，水平阴影的位置，允许负值

v-shadow
必须，垂直阴影的位置，允许负值

blur
可选，模糊的距离

spread
可选阴影的尺寸

color
可选，阴影的颜色

inset
可选，外部阴影改为内部阴影

> 1.默认的是外阴影(outset), 但是不可以写这个单词,否则造成阴影无效
>
> 2.盒子阴影不占用空间，不会影响其他盒子排列。
>
> 3.阴影的颜色一般使用半透明色rgba（）

### 6.text-shadow

> 我们可以使用 text-shadow 属性将阴影应用于文本
>
> text-shadow: h-shadow v-shadow blur color;

值
描述

h-shadow
必须，水平阴影的位置，允许负值

v-shadow
必须，垂直阴影的位置，允许负值

blur
可选，模糊的距离

spread
可选阴影的尺寸

color
可选，阴影的颜色

## 二、padding

> padding 属性用于设置内边距，即边框与内容之间的距离。
>
> padding 属性（简写属性）可以有一到四个值。

值的个数
表示的意思

padding：5px
1个值，代表上下左右都有5px内边距

padding：5px 10px
2个值，代表上下内边距是5像素，左右内边距是10像素

padding：5px 10px 20px
3个值，代表上内边距是5像素，左右内边距是10像素，下内边距是20像素

padding：5px 10px 20px 30px
4个值，上是5像素，右是10像素，下是20像素，左是30像素，顺时针转

**行内元素的border、padding和margin是否有效：**[https://www.cnblogs.com/10manongit/p/13035220.html](https://www.cnblogs.com/10manongit/p/13035220.html)

## 三、margin

> 外边距可以让块级盒子水平居中，但是必须满足两个条件：
>
> ①盒子必须指定了宽度（width）。
>
> ②盒子左右的外边距都设置为 auto 。
>
> 常见的写法，以下三种都可以：
>
> margin-left: auto; margin-right: auto;
>
> margin: auto;
>
> margin: 0 auto;
>
> 注意：以上方法是让块级元素水平居中，行内元素或者行内块元素水平居中给其父元素添加 text-align:center 即可。

> 使用 margin 定义块元素的垂直外边距时，可能会出现外边距的合并。 主要有两种情况:

> 相邻块元素垂直外边距的合并
> 嵌套块元素垂直外边距的塌陷

> 相邻块元素垂直外边距的合并

> 当上下相邻的两个块元素（兄弟关系）相遇时，如果上面的元素有下外边距 margin-bottom，下面的元素有 上外边距 margin-top ，则他们之间的垂直间距不是 margin-bottom 与 margin-top 之和。取两个值中的 较大者这种现象被称为相邻块元素垂直外边距的合并。

> 解决方案：尽量只给一个盒子添加 margin 值。（或使用BFC）

> 嵌套块元素垂直外边距的塌陷

> 对于两个嵌套关系（父子关系）的块元素，父元素有上外边距同时子元素也有上外边距，此时父元素会塌陷较大的外边距值。

> 解决方案：（或使用BFC）

> ①可以为父元素定义上边框。
>
> ②可以为父元素定义上内边距。
>
> ③可以为父元素添加 overflow:hidden
>
> 还有其他方法，比如浮动、固定，绝对定位的盒子不会有塌陷问题，后面咱们再总结。
>
> 添加了浮动的盒子不会出现外边距塌陷的现象

## 四、盒模型

> CSS3 中可以通过 box-sizing 来指定盒模型，有2个值：content-box、border-box，这样我们 计算盒子大小的方式就发生了改变。

> 1.box-sizing: content-box——标准盒模型
>
> 盒子大小为 width + padding + border （以前默认的）
>
> 2.box-sizing: border-box——怪异盒模型
>
> 盒子大小为 width
>
> 如果盒子模型我们改为了box-sizing: border-box ， 那padding和border就不会撑大盒子了（前提padding 和border不会超过width宽度）
