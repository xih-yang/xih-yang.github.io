# 11、CSS基础知识 - 元素的显示与隐藏
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/11.html
- 分类：前端框架
- 分组：教程目录
## 一、display 显示与隐藏

> display 属性用于设置一个元素应如何显示。

> display: none ；隐藏对象
>
> display：block ；除了转换为块级元素之外，同时还有显示元素的意思
>
> display 隐藏元素后，不再占有原来的位置

## 二、visibility 显示与隐藏

> visibility 属性用于指定一个元素应可见还是隐藏。
>
> visibility：visible ; 元素可视
>
> visibility：hidden; 元素隐藏
>
> visibility 隐藏元素后，继续占有原来的位置。
>
> 如果隐藏元素想要原来位置， 就用 visibility：hidden
>
> 如果隐藏元素不想要原来位置， 就用 display：none (用处更多 重点）

## 三、overflow 溢出显示隐藏

属性值
描述

visible
不剪切内容也不添加滚动条

hidden
不显示超过的对象尺寸的内容，超出的部分隐藏掉

scroll
不管超出的内容否，总是显示滚动条

auto
超出自动显示的滚动条，不超出不显示滚动条

## 四、总结

**1. display 显示隐藏元素 但是不保留位置

2、** visibility显示隐藏元素但是保留原来的位置；

**3、** overflow溢出显示隐藏但是只是对于溢出的部分处理；
