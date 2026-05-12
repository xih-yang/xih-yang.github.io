# 02、DTD 简介
- 来源：https://ddkk.com/zhuanlan/xml/dtd/2.html
- 分类：XML语言教程
- 分组：教程目录
文档类型定义（DTD）可定义合法的 XML文档组成部件，它使用一系列合法的元素来定义文档的结构

DTD可被声明于 XML 文档中，也可作为一个外部引用

## 内部的 DOCTYPE 声明

假如DTD 被包含在您的 XML 源文件中，它应当通过下面的语法包装在一个 DOCTYPE 声明中：

```xml
<!DOCTYPE root-element [element-declarations]>
```

带有DTD 的 XML 文档实例（请在浏览器中打开，并选择查看源代码）：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<!DOCTYPE article [
  <!ELEMENT article    (author,created_at,summary,content)>
  <!ELEMENT author      (#PCDATA)>
  <!ELEMENT created_at    (#PCDATA)>
  <!ELEMENT summary (#PCDATA)>
  <!ELEMENT content    (#PCDATA)>
]>
<article>
<author>DDKK.COM 弟弟快看，程序员编程资料站</author>
<created_at>2017-08-08 08:08:08</created_at>
<summary>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站</summary>
<content>DDKK.COM 弟弟快看，程序员编程资料站[www.ddkk.com]以编程开发所需掌握的语言和知识入手...</content>
</article> 
```

在您的浏览器中打开此 XML 文件，并选择查看源代码命令

### 简单解释下上面的 DTD：

- !DOCTYPE article (第三行)定义此文档是 article 类型的文档
- !ELEMENT article (第四行)定义 **article** 元素有四个元素：author,created_at,summary,content
- !ELEMENT author (第五行)定义 **author** 元素为 "#PCDATA" 类型
- !ELEMENT created_at (第六行)定义 **created_at** 元素为 "#PCDATA" 类型
- !ELEMENT summary (第七行)定义 **summary** 元素为 "#PCDATA" 类型
- !ELEMENT content (第八行)定义 **content** 元素为 "#PCDATA" 类型

## 外部文档声明

如果DTD 位于 XML 文件以外的其他文件中，那么 XML 文件必须在 DOCTYPE 声明中通过以下的语法引入这个 DTD

```xml
<!DOCTYPE root-element SYSTEM "filename">
```

这个XML 文档和上面的 XML 文档相同，但是拥有一个外部的 DTD: （ 在浏览器中打开 ，并选择查看源代码命令）

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<!DOCTYPE article SYSTEM "/static/media/note.dtd">
<article>
<author>DDKK.COM 弟弟快看，程序员编程资料站</author>
<created_at>2017-08-08 08:08:08</created_at>
<summary>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站</summary>
<content>DDKK.COM 弟弟快看，程序员编程资料站[www.ddkk.com]以编程开发所需掌握的语言和知识入手...</content>
</article> 
```

/static/media/note.dtd 文件中 DTD 声明如下

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<!DOCTYPE article [
  <!ELEMENT article    (author,created_at,summary,content)>
  <!ELEMENT author      (#PCDATA)>
  <!ELEMENT created_at    (#PCDATA)>
  <!ELEMENT summary (#PCDATA)>
  <!ELEMENT content    (#PCDATA)>
]>
```

## 为什么使用 DTD？

- 通过 DTD，我们的每一个 XML 文件均可携带一个有关其自身格式的描述
- 通过 DTD，独立的团队可一致地使用某个标准的 DTD 来交换数据
- 我们的应用程序可以使用某个标准的 DTD 来验证从外部接收到的数据
- 我们还可以使用 DTD 来验证自身的数据
