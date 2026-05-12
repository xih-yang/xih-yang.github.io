# 03、XPath 节点( Node )
- 来源：https://ddkk.com/zhuanlan/xml/xpath/3.html
- 分类：XML语言教程
- 分组：教程目录
XML文档是被作为节点树来对待的，树的根被称为文档节点或者根节点

在XPath 中，有七种类型的节点：

- 元素
- 属性
- 文本
- 命名空间
- 处理指令
- 注释以及文档节点（或称为根节点）

## 节点（Node）

在XPath 中，有七种类型的节点：元素、属性、文本、命名空间、处理指令、注释以及文档（根）节点。

XML文档是被作为节点树来对待的，树的根被称为文档节点或者根节点

看看下面这个 XML 文档：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<bookstore>
<book>
  <title lang="zh-CN">数学之美</title>
  <author>吴军</author>
  <price>32.90</price>
</book>
</bookstore>
```

有三种节点

- 文档节点 1 个

```xml
<bookstore>
```

- 元素节点 4 个

```xml
<author>吴军</author>
<title>数学之美</title>
<author>吴军</author>
<price>32.90</price>
```

- 属性节点 1 个

```xml
lang="zh-CN"
```

### 原子值（Atomic value）

原子值是无父或无子的节点

范例：原子值

- 元素节点的内容是原子值,上例中有四个

```xml
吴军
数学之美
32.90
```

- 属性节点的值也是原子值

```xml
"zh-CN"
```

### 项（Item）

项(item)是原子值或者节点

## 节点关系

### 父节点（Parent Node）

每个元素以及属性都有一个父节点。

在下面的例子中，book 元素是 title、author、price 元素的父节点：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<book>
  <title lang="zh-CN">数学之美</title>
  <author>吴军</author>
  <price>32.90</price>
</book>
```

### 子节点（Children Node）

每一个元素节点可有零个、一个或多个子节点

在下面的例子中，title、author、price 元素都是 book 元素的子节点：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<book>
  <title lang="zh-CN">数学之美</title>
  <author>吴军</author>
  <price>32.90</price>
</book>
```

### 兄弟节点（Sibling Node）

拥有相同的父节点的节点成为兄弟节点

在下面的例子中，title、author、price 元素都是兄弟节点

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<book>
  <title lang="zh-CN">数学之美</title>
  <author>吴军</author>
  <price>32.90</price>
</book>
```

### 先辈节点（Ancestor Node）

某节点的父节点、父节点的父节点，以此类推叫做当前节点的先辈节点

在下面的例子中，title 元素的先辈是 book 元素和 bookstore 元素：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<book>
  <title lang="zh-CN">数学之美</title>
  <author>吴军</author>
  <price>32.90</price>
</book>
```

### 后代节点（Descendant Node）

某个节点的子节点，子节点的子节点，以此类推称之为该节点的后代节点

在下面的例子中，bookstore 的后代是 book、title、author、price 元素：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<bookstore>
<book>
  <title lang="zh-CN">数学之美</title>
  <author>吴军</author>
  <price>32.90</price>
</book>
</bookstore>
```
