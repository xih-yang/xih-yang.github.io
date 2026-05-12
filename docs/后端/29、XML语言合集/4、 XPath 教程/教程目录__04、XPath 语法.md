# 04、XPath 语法
- 来源：https://ddkk.com/zhuanlan/xml/xpath/4.html
- 分类：XML语言教程
- 分组：教程目录
XPath 使用路径表达式来选取 XML 文档中的节点或节点集，而节点是通过沿着路径 (path) 或者步 (steps) 来选取的

## XML 范例文档

我们将在接下来的范例中使用下面这份 XML 文档

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Copyright www.ddkk.com -->
<bookstore>
<book>
  <title lang="zh-CN">数学之美</title>
  <author>吴军</author>
  <price>32.90</price>
</book>
<book>
  <title lang="zh-CN">跟阿铭学Linux(第3版)</title>
  <author>李世明</author>
  <price>48.70</price>
</book>
<book>
  <title lang="zh-CN">设计中的设计</title>
  <author>原研哉、 朱锷</author>
  <price>26.80</price>
</book>
</bookstore>
```

在浏览器中查看此 bookstore.xml文档

## 选取节点

XPath 使用路径表达式在 XML 文档中选取节点

节点是通过沿着路径或者 step 来选取的

### 下表列出了最常用的路径表达式

表达式
描述

nodename
选取此节点的所有子节点

/
从根节点选取

//
从匹配选择的当前节点选择文档中的节点，而忽略它们的位置

.
选取当前节点

..
选取当前节点的父节点

@
选取属性

### 范例

在下表中，我们列出了一些路径表达式以及表达式的结果：

路径表达式
结果

bookstore
选取 bookstore 元素的所有子节点

/bookstore
选取根元素 bookstore[1]

bookstore/book
选取 bookstore 下所有的 book 子元素

//book
选取文档中所有 book 子元素，而不管它们在于文档中任何位置

bookstore//book
选择 bookstore 元素的所有所有 book 后代元素，而不管它们位于 bookstore 之下的什么位置

//@lang
选取名为 lang 的所有属性

> [1]: 如果路径起始于正斜杠( / )，则此路径始终代表到某元素的绝对路径！

## 谓语（Predicates）

谓语被嵌在方括号中，用来查找某个特定的节点或者包含某个指定的值的节点

### 范例

在下表中，我们列出了带有谓语的一些路径表达式以及表达式的结果

路径表达式
结果

/bookstore/book[1]
选取属于 bookstore 子元素的第一个 book 元素

/bookstore/book[last()]
选取属于 bookstore 子元素的最后一个 book 元素

/bookstore/book[last()-1]
选取属于 bookstore 子元素的倒数第二个 book 元素

/bookstore/book[position()35.00]
选取 bookstore 元素的所有 book 元素，且其中的 price 元素的值须大于 35.00

/bookstore/book[price>35.00]/title
选取 bookstore 元素中的 book 元素的所有 title 元素，且其中的 price 元素的值须大于 35.00

## 选取未知节点

XPath 通配符(*、@、node())可用来选取未知的 XML 元素

通配符
描述

*
匹配任何元素节点

@*
匹配任何属性节点

node()
匹配任何类型的节点

### 范例

在下表中，我们列出了一些使用通配符的路径表达式以及这些表达式的结果：

路径表达式
结果

/bookstore/*
选取 bookstore 元素的所有子元素

//*
选取文档中的所有元素

//title[@*]
选取所有带有属性的 title 元素

## 选取若干路径

通过在路径表达式中使用 | 运算符，我们可以选取若干个路径

### 范例

在下表中，我们列出了一些使用一些路径表达式，以及这些表达式的结果：

路径表达式
结果

//book/title | //book/price
选取 book 元素的所有 title 和 price 元素

//title | //price
选取文档中的所有 title 和 price 元素

/bookstore/book/title | //price
选取属于 bookstore 元素的
 book 元素的所有 title 元素
以及文档中所有的 price 元素
