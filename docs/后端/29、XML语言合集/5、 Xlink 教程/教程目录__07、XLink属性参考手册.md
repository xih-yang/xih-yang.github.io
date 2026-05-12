# 07、XLink属性参考手册
- 来源：https://ddkk.com/zhuanlan/xml/xlink/7.html
- 分类：XML语言教程
- 分组：教程目录
XLink的标准中定义了 XLink可以定义的一些属性和具体的值范围

## XLink命名空间

XLink命名空间为

```java
http://www.w3.org/1999/xlink
```

你可以使用下面的代码来引入 XLink的命名空间

```java
xmlns:xlink="http://www.w3.org/1999/xlink"
```

## XLink属性列表

属性
值
描述

xlink:actuate
onLoad
onRequest
other
none
定义何时读取和显示被链接的资源

xlink:href
URL
要链接的 URL

xlink:show
embed
new
replace
other
none
在何处打开链接Replace 是默认值

xlink:type
simple
extended
locator
arc
resource
title
none
链接的类型
