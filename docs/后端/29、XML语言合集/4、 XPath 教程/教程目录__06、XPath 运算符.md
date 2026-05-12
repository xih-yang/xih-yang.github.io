# 06、XPath 运算符
- 来源：https://ddkk.com/zhuanlan/xml/xpath/6.html
- 分类：XML语言教程
- 分组：教程目录
XPath 可以使用一个或多个运算符组成的表达式来查询、过滤、返回节点集、字符串、逻辑值以及数字

假设

```xml
a = 17  b = 13
```

> 注意 XPath 运算符中的等于号(=) 。通常其他语言中的等于是 == 但在 XPath 中 等于号是 =

下表列出了可用在 XPath 表达式中的运算符和使用运算符的范例结果

运算符
描述
实例
返回值

|
计算两个节点并集
//book | //cd
所有拥有 book
和 cd 元素的节点集

+
加法
a + b
30

-
减法
a - b
4

*
乘法
a * b
221

div
除法
a div b
1

=
等于
a = 17
true

!=
不等于
a != 17
false

大于
a>17
false

>=
大于或等于
price>=17
true

or
或
a=17 or a=16
true

and
与
a >10 and a  注意 XPath 运算符中的等于号(=) 。通常其他语言中的等于是 == 但在 XPath 中 等于号是 =
