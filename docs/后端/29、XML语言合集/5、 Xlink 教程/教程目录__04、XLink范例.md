# 04、XLink范例
- 来源：https://ddkk.com/zhuanlan/xml/xlink/4.html
- 分类：XML语言教程
- 分组：教程目录
前面我们已经提到可以用 xlink:type 和 xlink:href 来定义一个超链接

现在，让我们通过研究一个范例来学习一些基础的 XLink语法

## XML 范例文档

假设有我们有一个 XML 文档 bookstore.xml，它用来呈现书籍:

```java
<?xml version="1.0" encoding="UTF-8"?>
<bookstore xmlns:xlink="http://www.w3.org/1999/xlink">
  <book title="哈利·波特(纪念版)(套装共7册)">
  <description 
    xlink:type="simple" 
    xlink:href="/static/i/xlink-bookstore-hali-1.jpg" 
    xlink:show="new" >《哈利·波特(纪念版)(套装共7册》包括了《哈利·波特与魔法石》、《哈利·波特与密室》、《哈利·波特与凤凰社》、《哈利·波特与混血王子》、《哈利·波特与火焰杯》、《哈利·波特与阿兹卡班的囚徒》、《哈利·波特与死亡圣器》......
  </description>
</book>
<book title="疯狂XML讲义(第2版)(附CD光盘1张)">
  <description
    xlink:type="simple"
    xlink:href="/static/i/xlink-bookstore-xml-1.jpg"
    xlink:show="new">疯狂XML讲义主要以XML为核心，深入地介绍了XML的各种相关知识。本书作为疯狂Java体系图书之一，依然保持该体系图书系统、全面的特点.....
  </description>
</book>
</bookstore>
```

查看bookstore.xml 文件

在上面的例子中:

- xmlns:xLink用来定义 XLink文档命名空间

XLink文档命名空间大都被声明于文档的顶部:

```java
xmlns:xlink="http://www.w3.org/1999/xlink"
```

这意味着文档可访问 XLink的属性和特性

- xlink:type="simple" 可创建简单的类似 HTML 的链接

虽然可以规定更多的复杂的链接（多方向链接），但是目前，我们仅使用简易链接

- xlink:href 属性规定了要链接的 URL
- xlink:show 属性规定了在何处打开链接

xlink:show="new" 意味着链接（在此例中，是一幅图像）会在新窗口打开

## 深入学习 XLink##

在上面的范例中，我们只展示了简单的链接

上例中的 `` 元素的 xlink:show 属性的值设置为 new，表示应该在新窗口打开链接。如果设置 xlink:show="embed" 则指示资源应嵌入到页面处理(当前页面打开)，类似于 `` 中的 target="_self"

XLink还可以指定资源何时才显示。这是由 XLink的 actuate 属性处理

- xlink:actuate"="onLoad" 指定的资源文件应加载和显示
- xlink:actuate="onRequest" 则指示链接被点击之前不需要读取或显示资源
