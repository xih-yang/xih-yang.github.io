# 05、XQuery FLWOR + HTML
- 来源：https://ddkk.com/zhuanlan/xml/xquery/5.html
- 分类：XML语言教程
- 分组：教程目录
先来看看我们在接下来的例子中需要用到的 books.xml 文档

在浏览器中查看 books.xml 文件

## 输出 HTML 列表格式结果

请看下面的 XQuery FLWOR 表达式：

```xml
for $x in doc("books.xml")/bookstore/book/title
order by $x
return $x
```

上面的表达式会选取 bookstore 元素下的 book 元素下的所有 title 元素，并以字母顺序返回 title 元素

现在，我们希望使用 HTML 列表列出我们的书店中所有的书目。 我们向 FLWOR 表达式添加 ul 和 li 标签：

```xml
<ul>{
for $x in doc("books.xml")/bookstore/book/title
order by $x
return <li>{$x}</li>
}</ul>
```

结果：

```xml
<ul>
<li><title lang="en">Everyday Italian</title></li>
<li><title lang="en">Harry Potter</title></li>
<li><title lang="en">Learning XML</title></li>
<li><title lang="en">XQuery Kick Start</title></li>
</ul>
```

假如我们希望去除 title 元素，而仅仅显示 title 元素内的数据

```xml
<ul>{
for $x in doc("books.xml")/bookstore/book/title
order by $x
return <li>{ data($x) }</li>
}</ul>
```

输出结果会是一个 HTML 列表：

```xml
<ul>
<li>Everyday Italian</li>
<li>Harry Potter</li>
<li>Learning XML</li>
<li>XQuery Kick Start</li>
</ul>
```
