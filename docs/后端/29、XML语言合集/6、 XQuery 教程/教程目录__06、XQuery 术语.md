# 06、XQuery 术语
- 来源：https://ddkk.com/zhuanlan/xml/xquery/6.html
- 分类：XML语言教程
- 分组：教程目录
在XQuery 中，有七种节点：元素、属性、文本、命名空间、处理指令、注释、以及文档（根）节点

## XQuery 术语

### 节点

在XQuery 中，有七种节点：

- 元素
- 属性
- 文本
- 命名空间
- 处理指令
- 注释
- 文档节点（或称为根节点）

XML文档是被作为节点树来对待的

树的根被称为文档节点或者根节点

请看下面的 XML 文档：

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<bookstore>
<book>
  <title lang="en">Harry Potter</title>
  <author>J K. Rowling</author> 
  <year>2005</year>
  <price>29.99</price>
</book>
</bookstore>
```

上面的XML 文档中的节点例子：

```xml
<bookstore>  （文档节点）
<author>J K. Rowling</author>  （元素节点）
lang="en"  （属性节点）
```

### 基本值（或称原子值，Atomic value）

基本值是无父或无子的节点

基本值的例子：

```xml
J K. Rowling
"en"
```

## 项目

项目是基本值或者节点

## 节点关系

### 父节点（Parent）

每个元素以及属性都有一个父节点，根节点除外

在下面的例子中，book 元素是 title、author、year 以及 price 元素的父：

```xml
<book>
  <title>Harry Potter</title>
  <author>J K. Rowling</author>
  <year>2005</year>
  <price>29.99</price>
</book>
```

### 子节点（Children）

一个节点元素可有零个、一个或多个子。

在下面的例子中，title、author、year 以及 price 元素都是 book 元素的子：

```xml
<book>
  <title>Harry Potter</title>
  <author>J K. Rowling</author>
  <year>2005</year>
  <price>29.99</price>
</book>
```

### 同胞（Sibling）

同胞（Sibling）是指拥有相同的父节点的节点

在下面的例子中，title、author、year 以及 price 元素都是同胞：

```xml
<book>
  <title>Harry Potter</title>
  <author>J K. Rowling</author>
  <year>2005</year>
  <price>29.99</price>
</book>
```

### 先辈（Ancestor）

先辈（Ancestor）是指某节点的父节点、父节点的父节点 以此类推。

例如下面的代码中，title 元素的先辈是 book 元素和 bookstore元素：

```xml
<bookstore>
<book>
  <title>Harry Potter</title>
  <author>J K. Rowling</author>
  <year>2005</year>
  <price>29.99</price>
</book>
</bookstore>
```

### 后代（Descendant）

后代（Descendant）是指某个节点的子节点，子节点的子节点，以此类推

例如下面的代码，bookstore 的后代是 book、title、author、year 以及 price元素：

```xml
<bookstore>
<book>
  <title>Harry Potter</title>
  <author>J K. Rowling</author>
  <year>2005</year>
  <price>29.99</price>
</book>
</bookstore>
```
