# 28、JavaScript attribute和元素节点属性
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/28.html
- 分类：前端框架
- 分组：教程目录
setAttribute：设置样式

getAttribute：访问样式

removeAttribute：移出样式

attribute与 . 操作区别

访问的区别

**1、** attribute可以访问自定义属性；

**2、** attribute访问class属性：obox.getAttribute(‘class’)；`.`操作：node.className；

设置的区别：

**1、**`.`操作可以设置自定义属性，但是自定义属性无法显示在行内样式当中attribute可以设置自定义属性，并且自定义属性也可以显示在行内样式当中；

`.`操作：

attribute操作：

**2、**`.`操作设置class的时候，利用className操作；

`.`操作

attribute操作

删除的区别

.操作删除属性的时候。直接将属性赋值为空字符串即可。但是行内样式还会有属性名在。

attribute操作时，obox.removeAttribute（‘属性名’）直接将样式移出，包括属性名
