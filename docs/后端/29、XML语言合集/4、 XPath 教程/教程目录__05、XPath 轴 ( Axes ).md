# 05、XPath 轴 ( Axes )
- 来源：https://ddkk.com/zhuanlan/xml/xpath/5.html
- 分类：XML语言教程
- 分组：教程目录
XPath 中的 **轴( Axes )** 可用于选取相对于当前节点的节点集

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

## XPath 轴

XPath 轴(Axes) 可用于选取相对于当前节点的节点集

轴(Axes)名称
结果

ancestor
选取当前节点的所有父辈节点

ancestor-or-self
选取当前节点的所父辈节点以及当前节点本身

attribute
选取当前节点的所有属性

child
选取当前节点的所有子元素

descendant
选取当前节点的所有后台元素

descendant-or-self
选取当前节点的所有后代元素以及当前节点本身

following
选取当前节点的结束标签之后的所有节点

namespace
选取当前节点的所有命名空间节点

parent
选取当前节点的父节点

preceding
选取当前节点的开始标签之前的所有节点

preceding-sibling
选取当前节点之前的所有同级兄弟节点

self
选取当前节点

## 位置路径表达式

位置路径可以是绝对的，也可以是相对的。

绝对路径起始于正斜杠( / )，而相对路径不会这样。 在两种情况中，位置路径均包括一个或多个步，每个步均被斜杠分割

### 绝对位置路径：

绝对路径起始于正斜杠( / )

```xml
/step/step/...
```

### 相对位置路径：

相对路径起始于步，每个步均根据当前节点集之中的节点来进行计算

```xml
step/step/...
```

### 步（step）包括：

轴（axis）

定义所选节点与当前节点之间的树关系

节点测试（node-test）

识别某个轴内部的节点

零个或者更多谓语（predicate）

更深入地提炼所选的节点集

### 步的语法：

```xml
轴名称::节点测试[谓语]
```

> 注意: 轴名称和节点测试之间，有两个冒号 ::

### 范例

范例
结果

child::book
选取所有属于当前节点的子元素的 book 节点

attribute::lang
选取当前节点的 lang 属性

child::*
选取当前节点的所有子元素

attribute::*
选取当前节点的所有属性

child::text()
选取当前节点的所有文本子节点

child::node()
选取当前节点的所有子节点

descendant::book
选取当前节点的所有 book 后代

ancestor::book
选择当前节点的所有 book 先辈

ancestor-or-self::book
选取当前节点的所有 book 先辈以及
当前节点（如果此节点是 book 节点）

child::*/child::price
选取当前节点的所有 price 孙节点
