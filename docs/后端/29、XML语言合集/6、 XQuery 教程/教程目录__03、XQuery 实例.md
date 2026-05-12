# 03、XQuery 实例
- 来源：https://ddkk.com/zhuanlan/xml/xquery/3.html
- 分类：XML语言教程
- 分组：教程目录
在本节，让我们通过研究一个例子来学习一些基础的 XQuery 语法

## XML 实例文档

我们将在接下来的章节中重复的使用下面这个名为 books.xml 的文档

### "books.xml" :

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<bookstore>
<book category="COOKING">
  <title lang="en">Everyday Italian</title>
  <author>Giada De Laurentiis</author>
  <year>2005</year>
  <price>30.00</price>
</book>
<book category="CHILDREN">
  <title lang="en">Harry Potter</title>
  <author>J K. Rowling</author>
  <year>2005</year>
  <price>29.99</price>
</book>
<book category="WEB">
  <title lang="en">XQuery Kick Start</title>
  <author>James McGovern</author>
  <author>Per Bothner</author>
  <author>Kurt Cagle</author>
  <author>James Linn</author>
  <author>Vaidyanathan Nagarajan</author>
  <year>2003</year>
  <price>49.99</price>
</book>
<book category="WEB">
  <title lang="en">Learning XML</title>
  <author>Erik T. Ray</author>
  <year>2003</year>
  <price>39.95</price>
</book>
</bookstore>
```

在浏览器中查看 "books.xml" 文件

## 如何从 "books.xml" 选取节点？

### 函数

XQuery 使用函数来提取 XML 文档中的数据

doc()函数用于打开 "books.xml" 文件：

```xml
doc("books.xml")
```

### 路径表达式

XQuery 在 XML 文档使用路径表达式中进行元素导航

例如下面的路径表达式用于在 "books.xml" 文件中选取所有的 title 元素：

```xml
doc("books.xml")/bookstore/book/title
```

(/bookstore 选取 bookstore 元素，/book 选取 bookstore 元素下的所有 book 元素，而 /title 选取每个 book 元素下的所有 title 元素)

上面的XQuery 可提取以下数据：

```xml
<title lang="en">Everyday Italian</title>
<title lang="en">Harry Potter</title>
<title lang="en">XQuery Kick Start</title>
<title lang="en">Learning XML</title>
```

### 谓语

XQuery 使用谓语来过滤从 XML 文档所提取的数据。

下面的谓语用于选取 bookstore 元素下的所有 book 元素，并且所选取的 book 元素下的 price 元素的值必须小于 30：

```xml
doc("books.xml")/bookstore/book[price<30]
```

上面的XQuery 可提取到下面的数据：

```xml
<book category="CHILDREN">
  <title lang="en">Harry Potter</title>
  <author>J K. Rowling</author>
  <year>2005</year>
  <price>29.99</price>
</book>
```
