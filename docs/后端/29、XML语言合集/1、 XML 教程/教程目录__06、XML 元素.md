# 06、XML 元素
- 来源：https://ddkk.com/zhuanlan/xml/xml/6.html
- 分类：其他语言
- 分组：教程目录
XML文档包含 XML 元素

XML的优势之一，就是可以在不中断应用程序的情况下进行扩展

## 什么是 XML 元素？

XML元素指的是从（且包括）开始标签直到（且包括）结束标签的部分

一个元素可以包含：

**1、** 其它元素；

**2、** 文本；

**3、** 属性；

**4、** 或混合以上所有...；

#### bookstore.xml

```xml
<bookstore>
    <book category="CHILDREN">
        <title>Harry Potter</title>
        <author>J K. Rowling</author>
        <year>2005</year>
        <price>29.99</price>
    </book>
    <book category="WEB">
        <title>Learning XML</title>
        <author>Erik T. Ray</author>
        <year>2003</year>
        <price>39.95</price>
    </book>
</bookstore>
```

上面的范例中

**1、**``和``都有**元素内容**，因为它们包含其它元素；

**2、**``元素也有**属性**(category="CHILDREN")；

**3、**``、``、``和``有**文本内容**，因为它们包含文本；

## XML 元素命名规则

XML元素必须遵循以下命名规则：

**1、** 名称可以包含字母、数字以及其他的字符；

**2、** 名称不能以数字或者标点符号开始；

**3、** 名称不能以字母xml（或者XML、Xml等等）开始；

**4、** 名称不能包含空格；

可使用任何名称，没有保留的字词

## XML 元素最佳命名习惯

**1、** 使名称具有描述性，使用下划线的名称也很不错：``、``；

**2、** 名称应简短和简单，比如：而不是：；

**3、** 避免"-"字符，如"first-name"，可能会被认为从first里边减去name；

**4、** 避免"."字符，如"first.name"，可能会被认为"name"是对象"first"的属性；

**5、** 避免":"字符，冒号会被转换为**XML命名空间**来使用；

**6、** 使用数据库的命名规则来命名XML文档中的元素；

XML文档经常有一个对应的数据库，其中的字段会对应 XML 文档中的元素 有一个实用的经验，即使用数据库的命名规则来命名 XML 文档中的元素

**1、** 不要使用ASCII之外的其它字符；

在XML 中，éòá 等非英语字母是完全合法的，不过需要留意，其它的软件供应商不支持这些字符时可能出现的问题

## XML 元素是可扩展的

XML元素是可扩展，以携带更多的信息

请看下面的 XML 范例：

```xml
<note>
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

我们天马行空下，当我们创建了一个应用程序，可将 ``、`` 以及 `` 元素从 XML 文档中提取出来，并产生以下的输出：

MESSAGE To:Tove From:Jani Don't forget me this weekend!

然后，XML 文档的作者小红想添加一些额外信息

```xml
<note>
  <date>2017-10-11</date>
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

那么这个应用程序会中断或崩溃吗？

不会。这个应用程序仍然可以找到 XML 文档中的 ``、`` 以及 `` 元素，并产生同样的输出

**XML 的优势之一，就是可以在不中断应用程序的情况下进行扩展**
