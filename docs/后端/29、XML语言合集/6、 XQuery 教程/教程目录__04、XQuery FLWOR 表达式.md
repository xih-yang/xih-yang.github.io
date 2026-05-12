# 04、XQuery FLWOR 表达式
- 来源：https://ddkk.com/zhuanlan/xml/xquery/4.html
- 分类：XML语言教程
- 分组：教程目录
先来看看我们在接下来的例子中需要用到的 books.xml 文档

在浏览器中查看 books.xml 文件

## 如何使用 FLWOR 从 "books.xml" 选取节点

先看一个路径表达式：

```xml
doc("books.xml")/bookstore/book[price>30]/title
```

上面这个表达式可选取 bookstore 元素下的 book 元素下所有的 title 元素，并且其中的 price 元素的值必须大于 30

而下面这个 FLWOR 表达式所选取的数据和上面的路径表达式是相同的：

```xml
for $x in doc("books.xml")/bookstore/book where $x/price>30 return $x/title
```

结果：

```xml
<title lang="en">XQuery Kick Start</title>
<title lang="en">Learning XML</title>
```

通过FLWOR，我们可以对结果进行排序：

```xml
for $x in doc("books.xml")/bookstore/book where $x/price>30 order by $x/title return $x/title
```

结果

```xml
<title lang="en">Learning XML</title>
<title lang="en">XQuery Kick Start</title>
```

所以：

- **FLWOR** 是 For, Let, Where, Order by, Return 的只取首字母缩写
- **for** 语句把 bookstore 元素下的所有 book 元素提取到名为 `$` x 的变量中
- **where** 语句选取了 price 元素值大于 30 的 book 元素
- **order by** 语句定义了排序次序。将根据 title 元素进行排序
- **return** 语句规定返回什么内容。在此返回的是 title 元素
