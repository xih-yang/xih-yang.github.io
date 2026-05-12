# 14、CSS基础知识 - CSS3新特性
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/14.html
- 分类：前端框架
- 分组：教程目录
## 一、CSS3新增选择器

### 1.属性选择器

> 属性选择器：根据元素特定属性的来选择元素。 这样就可以不用借助于类或者id选择器。

选择符
简介

E[att]
选择具有att属性的E元素

E[att=“value”]
选择具有att属性且属性值等于value的E元素

E[att^=value]
匹配具有att属性且属性值以value开头的E元素

E[att$=“value”]
匹配具有att属性且属性值以value结尾的E元素

E[att*=“value”]
匹配具有att属性且属性值含有value的E元素

注意：类选择器、属性选择器、伪类选择器，权重为 10

### 2.结构伪类选择器

> 结构伪类选择器：根据文档结构来选择元素， 常用于选择父级选择器里面的子元素

选择符
简介

E:first-child
匹配父元素中的第一个子元素E

E:last-child
匹配父元素中最后一个E元素

E:nth-child(n)
匹配父元素中第n个子元素E

E:first-of-type
指定类型E的第一个

E:last-of-type
指定类型E的最后一个

E:nth-of-type(n)
指定类型E的第n个

> nth-child（n） 选择某个父元素的一个或多个特定的子元素
>
>
> n 可以是数字，关键字和公式
> n 如果是数字，就是选择第 n 个子元素， 里面数字从1开始…
> n 可以是关键字：even 偶数，odd 奇数
> n 可以是公式：常见的公式如下 ( 如果n是公式，则从0开始计算，但是第 0 个元素或者超出了元素的个数会被忽略 )

公式
取值

2n
偶数

2n+1
奇数

5n
5,10,15…

n+5
从第5 个开始（包含第5个）到最后

-n+5
前5个（包含第5个）

> nth-child和nth-of-type区别：
>
>
> nth-child 对父元素里面所有孩子排序选择（序号是固定的） 先找到第n个孩子，然后看看是否和E匹配
> nth-of-type 对父元素里面指定子元素进行排序选择。 先去匹配E ，然后再根据E找第n个孩子

### 3.伪元素选择器

> 伪元素选择器：帮助我们利用CSS创建新标签元素，而不需要HTML标签，从而简化HTML结构

选择符
简介

::before
在元素内部的前面插入内容

::after
在元素内部的后面插入内容

## 二、盒模型

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

## 三、CSS3滤镜filter

> filter：将模糊或颜色偏移等图形效果应用于元素
>
> filter: 函数();
>
> 例如： filter: blur(5px); blur模糊处理 数值越大越模糊

## 四、CSS3 calc

> calc() 此CSS函数让你在声明CSS属性值时执行一些计算
>
> width: calc(100% - 80px); 父元素宽度减80px

## 五、CSS3 过渡

> 过渡（transition)是CSS3中具有颠覆性的特征之一，我们可以在不使用 Flash 动画或 JavaScript 的情况下，当元素从一种样式变换为另一种样式时为元素添加效果。

> 过渡动画： 是从一个状态渐渐的过渡到另外一个状态
>
> 可以让我们页面更好看，更动感十足，虽然低版本浏览器不支持（ie9以下版本） 但是不会影响页面布局。
>
> 我们现在经常和 :hover 一起 搭配使用。

> transition: 要过渡的属性 花费时间 运动曲线 何时开始;
>
>
> 属性 ： 想要变化的 css 属性， 宽度高度 背景颜色 内外边距都可以 。如果想要所有的属性都 变化过渡， 写一个all 就可以。
> 花费时间： 单位是 秒（必须写单位） 比如 0.5s
> 运动曲线： 默认是 ease （可以省略）
> 何时开始 ：单位是 秒（必须写单位）可以设置延迟触发时间 默认是 0s （可以省略

> linear 匀速
>
> ease 逐渐慢下来
>
> ease-in加速
>
> ease-out减速
>
> ease-in-out 先加速后减速
>
> 记住过渡的使用口诀： 谁做过渡给谁加

PS：CSS3新特性

**01、** 边框：圆角边框（border-radius）+阴影（box-shadow）

**02、** 背景：支持多背景、背景图片的尺寸（background-size）

**03、** 文本效果（text-shadow）+自定义字体

**04、** 渐变：线性渐变、径向渐变

**05、** 转换+过渡：transform+transition

**06、** 动画@keyframes

**07、** 多列布局

**08、** 选择器：伪元素选择器（selection）、属性选择器、结构伪类选择器

**09、** 新的用户界面特性来调整元素尺寸，框尺寸和外边框box-sizing、resize

**10、** 弹性盒
