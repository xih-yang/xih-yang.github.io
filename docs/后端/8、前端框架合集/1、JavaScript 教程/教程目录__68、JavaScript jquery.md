# 68、JavaScript jquery
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/68.html
- 分类：前端框架
- 分组：教程目录
### JQuery简介

**1、** 一个快速、简洁的JavaScript框架；

**2、** 设计的宗旨是‘writeLess，DoMore’（写的更少，做得更多）；

**3、** JQuery兼容各种主流浏览器，如IE6.0+、FF1.5+、Safari2.0+、Opera9.0+；

JQuery好处

**1、** 简化JS的复杂操作；

**2、** 不再需要关心兼容性；

**3、** 提供大量实用方法；

Jquery版本区别

**1、** x可以兼容到IE8以下；

**2、** x只兼容IE8以上；

如何学习JQ？

**1、** https://jquery.com/JQ的官方网站（查阅中文文档）；

**2、** JQ只是辅助工具，要正确面对；

**3、** 需要分阶段学习；

前序准备工作：在官网，下载相应的jquery的根据需求的版本源码。

在需要jquery操作的网页引入该源码。

JQuer设计思想

#### 一、选择网页元素

**1、** 模拟css选择元素；

请参阅CSS选择器参考手册。[http://www.runoob.com/cssref/css-selectors.html](http://www.runoob.com/cssref/css-selectors.html)

**2、** 独有表达式选择(功能与类似于结构伪类选择器)；

注：:eq 相当于nth-child( )/nth-of-type() 。下标从0开始，与结构伪类选择器有区别

**3、** 多种筛选方法；

### 二.Jquery写法

**1、** 方法函数化；

(d o c u m e n t ) . r e a d y ( f u n c t i o n ( ) )  (document).ready(function(){}) (document).ready(function())(function),下一篇博文juqery方法我会提到与window.onload的区别

window.onload功能：等待页面加载完毕后，在加载该代码。这样不管script标签在哪，都能够获取到页面上的元素了

事件绑定更改了从node.on+‘事件类型’=function（）{…}变成node.事件类型(function（）{…})或者node.on(…)

这也说明JQ一个特点：在JQ是基本见不到=符号的。基本所有的赋值方式都是函数传参方式。

**2、** 链式操作；

当我们对同一个元素进行多种操作时，可以使用链式操作简化代码。

**3、** 取值赋值合体；

同一个函数既能够获取值，也能够设置值。

注：JQ取值只能取出第一个符合条件元素的值，赋值批量操作。

三：JQ与JS的关系

**可以共存但是不能混用**。比如我们刚刚上述例子中的方法函数化：`$`(’#btn’).οnclick=function(){} //完全没有作用的。但是可以出现两种类型代码行出现在同一模块中。

这个不难理解，因为$(’…’)返回的就是一个对象，而对象只能调用原型上的方法，而非原型上的方法是无法使用的。document绑定事件的方式也一样，返回的也是一个事件对象，本身也是只能调用自己原型上的方法。
