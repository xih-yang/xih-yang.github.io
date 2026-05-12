# 09、XQuery 选择和过滤
- 来源：https://ddkk.com/zhuanlan/xml/xquery/9.html
- 分类：XML语言教程
- 分组：教程目录
先来看看我们在接下来的例子中需要用到的 books.xml 文档

在浏览器中查看 books.xml 文件

## 选择和过滤元素

我们在前面的章节中已经使用**路径表达式**或 **FLWOR** 表达式来选取和过滤元素

现在让我们看看下面的 FLWOR 表达式：

```xml
for $x in doc("books.xml")/bookstore/book
where $x/price>30
order by $x/title
return $x/title
```

for

（可选） 给每个由 in 表达式返回的项目捆绑一个变量

let

（可选）

where

（可选） 设定一个条件

order by

（可选） 设定结果的排列顺序

return

规定在结果中返回的内容

### for 语句

for语句可产生迭代，可将变量捆绑到由 in 表达式返回的每个迭代项(item)。

> 在同一个 FLWOR 表达式中可存在多重 for 语句

### 关键词 to

**关键词 to** 可以在一个 for 语句中指定循环的次数

```xml
for $x in (1 to 5)
return <test>{$x}</test>
```

结果:

```xml
<test>1</test>
<test>2</test>
<test>3</test>
<test>4</test>
<test>5</test>
```

#### 关键词 at

关键词at 可以在一个 for 语句中返回迭代索引：

```xml
for $x at $i in doc("books.xml")/bookstore/book/title
return <book>{$i}. {data($x)}</book>
```

结果：

```xml
<book>1. Everyday Italian</book>
<book>2. Harry Potter</book>
<book>3. XQuery Kick Start</book>
<book>4. Learning XML</book>
```

在for 语句中同样 **允许多个 in 表达式** ，请使用逗号(,)来分割每一个 in 表达式：

```xml
for $x in (10,20), $y in (100,200)
return <test>x={$x} and y={$y}</test>
```

结果：

```xml
<test>x=10 and y=100</test>
<test>x=10 and y=200</test>
<test>x=20 and y=100</test>
<test>x=20 and y=200</test>
```

### let 语句

let语句可完成变量赋值，可避免多次重复相同的表达式

> let 语句不会导致迭代

```xml
let $x := (1 to 5)
return <test>{$x}</test>
```

结果：

```xml
<test>1 2 3 4 5</test>
```

### where 语句

where 语句用于为结果设定一个或多个条件（criteria）

```xml
where $x/price>30 and $x/price<1
```

### order by 语句

order by 语句用于给结果的次序 在这里，我们要根据 category 和 title 来对结果进行排序：

```xml
for $x in doc("books.xml")/bookstore/book
order by $x/@category, $x/title
return $x/title
```

结果：

```xml
<title lang="en">Harry Potter</title>
<title lang="en">Everyday Italian</title>
<title lang="en">Learning XML</title>
<title lang="en">XQuery Kick Start</title>
```

### return 语句：

return 语句规定要返回的内容。

```xml
for $x in doc("books.xml")/bookstore/book
return $x/title
```

结果：

```xml
<title lang="en">Everyday Italian</title>
<title lang="en">Harry Potter</title>
<title lang="en">XQuery Kick Start</title>
<title lang="en">Learning XML</title>
```
