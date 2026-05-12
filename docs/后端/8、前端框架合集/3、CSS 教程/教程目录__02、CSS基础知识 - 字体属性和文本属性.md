# 02、CSS基础知识 - 字体属性和文本属性
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/2.html
- 分类：前端框架
- 分组：教程目录
## 前言

提示：以下是学习前端以来，整理过的一些CSS知识点。知识主要来源于黑马程序员Pink老师，内容都是自己的理解，如果有不对的地方，请评论区指正，谢谢~~

## 一、字体属性

### 1.1 font-family

> font-family ：定义文本的字体系列，字体类型
>
> div {font-family: Arial,“Microsoft Yahei”, “微软雅黑”;}
>
> 各种字体之间必须使用英文状态下的逗号隔开
>
> 一般情况下,如果有空格隔开的多个单词组成的字体,加引号.
>
> 尽量使用系统默认自带字体，保证在任何用户的浏览器中都能正确显示
>
> 最常见的几个字体：
>
> body {font-family: ‘Microsoft YaHei’,tahoma,arial,‘Hiragino Sans GB’; }

### 1.2 font-size

> font-family ：定义字体大小

```css
p {
    font-size: 20px;  
}  //p内的字体大小为20px
```

> px（像素）大小是我们网页的最常用的单位
>
> 谷歌浏览器默认的文字大小为16px
>
> 不同浏览器可能默认显示的字号大小不一致，我们尽量给一个明确值大小，不要默认大小
>
> 可以给 body 指定整个页面文字的大小

### 1.3 font-weight

> font-weight ：设置文本字体的粗细

```css
p {
	font-weight: bold;  
}//设置字体加粗
```

属性值
描述

normal
默认值，字体粗细正常

bold
字体加粗

100–900
400等价于normal，700等价于bold（注意这个后面不用跟单位px）

### 1.4 font-style

> font-style：属性设置文本的风格

属性值
描述

normal
默认值

italic
浏览器会显示斜体样式

注意：平时我们很少给文字加斜体，反而要给斜体标签（i）改为不倾斜字体

### 1.5 字体的复合属性

```css
body {
  font: font-style  font-weight  font-size/line-height  font-family; 
} 
```

> 使用 font 属性时，必须按上面语法格式中的顺序书写，不能更换顺序，并且各个属性间以空格隔开，不需要设置的属性可以省略（取默认值），但必须保留 font-size 和 font-family 属性，否则 font 属性将不起作用

### 1.6 字体属性总结

属性
表示
注意

font-size
字号
单位是px像素

font-family
字体

font-weight
字体粗细
加粗是700或bold不加粗是normal或者400（不要带单位）

font-style
字体样式
倾斜是italic，不倾斜是normal

font
字体连写
字体连写是有顺序的不能换位置，其中字号和字体必须同时出现

顺序是字体样式，粗细，字号或者行高，字体

## 二、文本属性

### 2.1 color

> color：定义文本的颜色

属性值
说明

预定义颜色值
red，等英文单词

十六进制
#FFFFFF

RGB代码
rgb（0,0,0）

### 2.2 text-align

> text-align：设置元素内文本内容的水平对齐方式

```css
div {
   text-align: center; 
 }
```

属性值
说明

left
左对齐

right
右对齐

center
居中对齐

### 2.3 text-decoration

> text-decoration：规定添加到文本的修饰。可以给文本添加下划线、删除线、上划线等。

```css
div {
   text-decoration：underline; 
 }
```

属性值
说明

none
默认，没有装饰线

underline
下划线

overline
上划线

line-through
删除线

### 2.4 text-indent

> text-indent：指定文本的第一行的缩进，通常是将段落的首行缩进。

```css
p {
   text-indent: 10px; 
 }//所有p元素的第一行都会缩进10px，属性值也可以为负值
```

### 2.5 line-height

> line-height：设置行间的距离（行高）。可以控制文字行与行之间的距离.

```css
p {
   line-height: 26px; 
}  //段落p的每一行高度26px
行间距 = 上间距+文本高度+下间距
```

### 2.6 文本属性总结

属性
表示
注意点

color
文本颜色
通常使用16进制的格式#fff

text-align
文本对齐
可以设定文字的对齐方式

text-indent
文本缩进
通常段落首行缩进2个字的距离 text-indent: 2em;

text-decoration
文本修饰
下划线是underline，取消下划线是none

line-height
行高
控制行与行的距离
