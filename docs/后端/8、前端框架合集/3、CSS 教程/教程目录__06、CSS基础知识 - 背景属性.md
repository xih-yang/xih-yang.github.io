# 06、CSS基础知识 - 背景属性
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/6.html
- 分类：前端框架
- 分组：教程目录
## 一、背景属性

> 背景属性可以设置背景颜色、背景图片、背景平铺、背景图片位置、背景图像固定等

## 二、背景属性细分

### 1.background-color

> background-color 属性定义了元素的背景颜色
>
> background-color: 颜色值;
>
> 一般情况下元素背景颜色默认值是 transparent（透明），我们也可以手动指定背景颜色为透明色。
>
> background-color:transparent;

### 2.background-image

> background-image 属性描述了元素的背景图像。实际开发常见于 logo 或者一些装饰性的小图片或者是超大的背景图片, 优点是非常便于控制位置. (精灵图也是一种运用场景)
>
> background-image : none | url (url)

参数值
作用

none
无背景图片（默认的）

url
使用绝对或者相对地址定背景图像

**注意：背景图片后面的地址，千万不要忘记加 URL， 同时里面的路径不要加引号。**

### 3.background-repeat

> 如果需要在 HTML 页面上对背景图像进行平铺，可以使用 background-repeat 属性
>
> background-repeat: repeat | no-repeat | repeat-x | repeat-y

参数值
作用

repeat
背景图像在纵向和横向上平铺（默认的）

no-repeat
背景图像像不平铺

repeat-x
图像背景在横向平铺

repea-y
背景图像在纵轴平铺

### 4.background-position

> 利用 background-position 属性可以改变图片在背景中的位置。
>
> background-position: x y;
>
> 参数代表的意思是：x 坐标和 y 坐标。 可以使用方位名词或者精确单位

参数
说明

length
百分数、由浮点数字和单位标识符组成的长度值

position
top，center，bottom，left，center，right 方位词

**1. 参数是方位名词**

如果指定的两个值都是方位名词，则两个值前后顺序无关，比如 left top 和 top left 效果一致

如果只指定了一个方位名词，另一个值省略，则第二个值默认居中对齐

**2. 参数是精确单位**

如果参数值是精确坐标，那么第一个肯定是 x 坐标，第二个一定是 y 坐标

如果只指定一个数值，那该数值一定是 x 坐标，另一个默认垂直居中

**3. 参数是混合单位**

如果指定的两个值是精确单位和方位名词混合使用，则第一个值是 x 坐标，第二个值是 y 坐标

### 5.background-attachment

> background-attachment 属性设置背景图像是否固定或者随着页面的其余部分滚动。
>
> background-attachment : scroll | fixed

参数
作用

scroll
背景图像是随对象内容的滚动（默认）

fixed
背景图像固定

### 6.background

> background: 背景颜色 背景图片地址 背景平铺 背景图像滚动 背景图片位置;
>
> 为了简化背景属性的代码，我们可以将这些属性合并简写在同一个属性 background 中。从而节约代码量.
>
> 当使用简写属性时，没有特定的书写顺序,一般习惯约定顺序为上述写法——background: transparent url(image.jpg) repeat-y fixed top ;

> CSS3 为我们提供了背景颜色半透明的效果

**background: rgba(0, 0, 0, 0.3)**

> 最后一个参数是 alpha 透明度，取值范围在 0~1之间
> 我们习惯把 0.3 的 0 省略掉，写为 background: rgba(0, 0, 0, .3);
>
> 注意：背景半透明是指盒子背景半透明，盒子里面的内容不受影响
>
> CSS3 新增属性，是 IE9+ 版本浏览器才支持的
>
> 但是现在实际开发,我们不太关注兼容性写法了,可以放心使用

属性
作用
值

background-color
背景颜色
预定义的颜色值或十六进制或rgb代码

background-image
背景图片
url（图片路径）

background- repeat
是否平铺
repeat/no-repeat/repeat-x/repeat-y

background- position
背景位置
length/position 分别是x和y的坐标

background- attachment
背景附着
scroll（背景滚动）/fixed(背景固定)

背景简写
简写
背景颜色 背景图片地址 背景平铺 背景滚动 背景位置 背景白透明

背景颜色半透明
透明颜色
background:rgba(0,0,0,0.3)（最后一个参数的取值是0-1）
