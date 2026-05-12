# 03、XLink和 XPointer 语法
- 来源：https://ddkk.com/zhuanlan/xml/xlink/3.html
- 分类：XML语言教程
- 分组：教程目录
在HTML 中，我们知道 `` 元素可定义超级链接， 而且，几乎只有 ``标签可以定义连接。

但，在XML 不是这样工作的。

在XML 文档中，您可以使用任何你需要的元素(node element)，所以， 对于浏览器来说也就无法预知在 XML 文档中可调用何种超级链接元素。

## XLink定义超链接的语法

在XML 文档中定义超级链接的方法是在元素上放置可用作超级链接的标记

下面是在 XML 文档中使用 XLink来创建链接的简单范例：

```java
<?xml version="1.0"?>
<homepages xmlns:xlink="http://www.w3.org/1999/xlink">
<homepage xlink:type="simple"
  xlink:href="/">Visit DDKK.COM 弟弟快看，程序员编程资料站</homepage>
  <homepage xlink:type="simple"  
  xlink:href="http://www.w3.org">Visit W3C</homepage>
</homepages>
```

> warn: 如果范例中的链接你不能点击，说明你的浏览器不支持 XLink

为了访问 XLink的属性和特性，我们必须在文档的顶端声明 XLink命名空间。

XLink的命名空间是:

```java
http://www.w3.org/1999/xlink"
```

元素中的 xlink:type 和 xlink:href 属性定义了来自 XLink命名空间的 type 和 href 属性。

xlink:type="simple" 可创建一个简单的两端链接（意思是“从这里到哪里”）。稍后我们会研究多端链接（多方向）。

## XPointer 语法

在 HTML 中，我们可创建一个既指向某个 HTML 页面又指向 HTML 页面内某个书签锚文本（使用#）

有时，可指向更多具体的内容会更有好处。举例，我们需要指向某个特定的列表的第三个项目，或者指向第五段的第二行。通过 XPointer 是很容易做到的。

假如超级链接指向某个 XML 文档，我们可以在 xlink:href 属性中把 XPointer 部分添加到 URL 后面，这样就可以导航（通过 XPath 表达式）到文档中某个具体的位置了。

举例，在下面的例子中，我们通过唯一的 id rock 使用 XPointer 指向某个列表中的第五个项目。

```java
xlink:href="http://www.example.com/cdlist.xml#id('rock').child(5,item)"
```

> XPointer 最关键的部分就是 #id('rock').child(5,item) 可惜浏览器不支持，神烦
