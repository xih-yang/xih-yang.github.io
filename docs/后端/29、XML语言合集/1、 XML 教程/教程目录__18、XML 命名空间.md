# 18、XML 命名空间
- 来源：https://ddkk.com/zhuanlan/xml/xml/18.html
- 分类：其他语言
- 分组：教程目录
XML命名空间是提供避免元素命名冲突的方法

## 命名冲突

在XML 中，元素名称是由开发者定义的，当两个不同的文档使用相同的元素名时，就会发生命名冲突

这个XML 携带 HTML 表格的信息：

```xml
<table><tr><td>Apples</td><td>Bananas</td></tr></table>
```

这个XML 文档携带有关桌子的信息（一件家具）：

```xml
<table><name>African Coffee Table</name><width>80</width><length>120</length></table>
```

假如这两个 XML 文档放在一起使用，由于两个文档都包含带有不同内容和定义的 `` 元素，就会发生命名冲突

XML解析器无法确定如何处理这类冲突

## 使用前缀来避免命名冲突

在XML 中的命名冲突可以通过使用名称前缀从而容易地避免

该XML 携带某个 HTML 表格和某件家具的信息：

```xml
<h:table><h:tr><h:td>Apples</h:td><h:td>Bananas</h:td></h:tr></h:table><f:table><f:name>African Coffee Table</f:name><f:width>80</f:width><f:length>120</f:length></f:table>
```

在上面的范例中，不会有冲突，因为两个 `` 元素有不同的名称

## XML 命名空间 - xmlns 属性

当在XML 中使用前缀时，一个所谓的用于前缀的 **命名空间** 必须被定义

命名空间是在元素的开始标签的 **xmlns 属性** 中定义的

命名空间声明的语法如下

```xml
xmlns: *前缀* =" *URI* "
```

```xml
<root>
    <h:table xmlns:h="http://www.w3.org/TR/html4/">
        <h:tr>
            <h:td>Apples</h:td>
            <h:td>Bananas</h:td>
        </h:tr>
    </h:table>
    <f:table xmlns:f="http://www.ddkk.com/furniture">
        <f:name>African Coffee Table</f:name>
        <f:width>80</f:width>
        <f:length>120</f:length>
    </f:table>
</root>
```

`` 标签的 xmlns 属性定义了 h: 和 f: 前缀的合格命名空间

当命名空间被定义在元素的开始标签中时，所有带有相同前缀的子元素都会与同一个命名空间相关联

命名空间，可以在它们被使用的元素中或者在 XML 根元素中声明：

```xml
<root xmlns:h="http://www.w3.org/TR/html4/" xmlns:f="http://www.ddkk.com/furniture">
    <h:table>
        <h:tr>
            <h:td>Apples</h:td>
            <h:td>Bananas</h:td>
        </h:tr>
    </h:table>
    <f:table>
        <f:name>African Coffee Table</f:name>
        <f:width>80</f:width>
        <f:length>120</f:length>
    </f:table>
</root>
```

> 命名空间 URI 不会被解析器用于查找信息。

其目的是赋予命名空间一个惟一的名称

常常会使用指针来使用命名空间指向实际存在的网页，它包含关于命名空间的信息

如果想学习更多 W3C HTML4 知识，请移步 [http://www.w3.org/TR/html4/](http://www.w3.org/TR/html4/)

### 统一资源标识符（URI，全称 Uniform Resource Identifier）

**统一资源标识符** （URI）是一串可以标识因特网资源的字符

最常用的 URI 是用来标识因特网域名地址的 **统一资源定位器** (URL ) 另一个不那么常用的 URI 是 **统一资源命名** ( URN )

在范例中，我们仅使用 URL

### 默认的命名空间

为元素定义默认的命名空间可以让我们省去在所有的子元素中使用前缀的工作

它的语法如下

```xml
xmlns=" *namespaceURI* "
```

这个XML 携带 HTML 表格的信息

```xml
<table xmlns="http://www.w3.org/TR/html4/"><tr><td>Apples</td><td>Bananas</td></tr></table>
```

这个XML 携带有关一件家具的信息

```xml
<table xmlns="http://www.ddkk.com/furniture"><name>African Coffee Table</name><width>80</width><length>120</length></table>
```

### 实际使用中的命名空间

XSLT 是一种用于把 XML 文档转换为其他格式的 XML 语言，比如 HTML

在下面的 XSLT 文档中，可以看到，大多数的标签是 HTML 标签

非HTML 的标签都有前缀 xsl，并由此命名空间标识：

```xml
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
```

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/">
        <html>
            <body>
                <h2>My CD Collection</h2>
                <table border="1">
                    <tr>
                        <th align="left">Title</th>
                        <th align="left">Artist</th>
                    </tr>
                    <xsl:for-each select="catalog/cd">
                        <tr>
                            <td>
                                <xsl:value-of select="title"/>
                            </td>
                            <td>
                                <xsl:value-of select="artist"/>
                            </td>
                        </tr>
                    </xsl:for-each>
                </table>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
```

如果想要深入学习 XSLT 的知识，请移步我们的 XSLT 基础教程
