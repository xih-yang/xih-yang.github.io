# 24、XML 教程 - 执行XSLT转换
- 来源：https://ddkk.com/zhuanlan/xml/2/24.html
- 分类：XML语言教程
- 分组：教程目录
## 执行XSLT转换

要执行`XSLT`转换，请执行以下操作：

- 如果使用的是Xalan处理器(对于XSLT 1.0)，请使用%XML.XSLT.Transformer的以下类方法之一：
- `TransformFile()`——转换给定XSLT样式表的文件。
- `TransformFileWithCompiledXSL()`——转换一个文件，给定一个已编译的XSLT样式表。
- `TransformStream()`——转换给定XSLT样式表的流。
- `TransformStreamWithCompiledXSL()`——转换一个流，给定一个已编译的XSLT样式表。
- `TransformStringWithCompiledXSL()`——转换给定已编译XSLT样式表的字符串。
- 如果使用Saxon处理器(用于XSLT 2.0)，请使用%XML.XSLT2.Transformer的以下类方法之一:
- `TransformFile()`——转换给定XSLT样式表的文件。
- `TransformFileWithCompiledXSL()`——转换一个文件，给定一个已编译的XSLT样式表。
- `TransformStream()`——转换给定XSLT样式表的流。
- `TransformStreamWithCompiledXSL()`——转换一个流，给定一个已编译的XSLT样式表。

这些方法具有相似的签名。这些方法的参数列表按顺序如下：

- pSource—要转换的源XML。请参见此列表后面的表。
- pXSL -样式表或编译样式表。请参阅此列表后面的表格。
- pOutput -作为输出参数返回的结果XML。请参阅此列表后面的表格。
- pErrorHandler -一个可选的自定义错误处理程序。请参阅本章后面的“自定义错误处理”。如果不指定自定义错误处理程序，该方法将使用%XML.XSLT.ErrorHandler的新实例(对于两个类)。
- pParms -一个可选的InterSystems IRIS多维数组，包含要传递给样式表的参数。
- pCallbackHandler -定义XSLT扩展函数的可选回调处理程序。
- pResolver -一个可选的实体解析器。

**1、** (仅适用于`%XML.XSLT2.Transformer`)网关-`%Net.Remote.Gateway`的可选实例如果要重用XSLT网关连接以获得更好的性能，请指定此参数；

作为参考，下表显示了这些方法的前三个参数，并进行了对比：

XSLT变换方法的比较

Method
pSource (Input XML)
pXSL (Stylesheet)
pOutput(Output XML)

TransformFile()
String that gives a file name
String that gives a file name
String that gives a file name

TransformFileWithCompiledXSL()
String that gives a file name
Compiled style sheet
String that gives a file name

TransformStream()
Stream
Stream
Stream, returned by reference

TransformStreamWithCompiledXSL()
Stream
Compiled style sheet
Stream, returned by reference

TransformStringWithCompiledXSL()
String
Compiled style sheet
String that gives a file name

## 示例

本节使用以下代码(但不同的输入文件)展示了几种转换：

```java
  Set in="c:\0test\xslt-example-input.xml"
  Set xsl="c:\0test\xslt-example-stylesheet.xsl"
  Set out="c:\0test\xslt-example-output.xml"
  Set tSC=##class(%XML.XSLT.Transformer).TransformFile(in,xsl,.out)
  Write tSC 
```

### 示例1：简单替换

在本例中，我们从以下输入XML开始：

```java
<?xml version="1.0" ?>
<s1 title="s1 title attr">
  <s2 title="s2 title attr">
    <s3 title="s3 title attr">Content</s3>
  </s2>
</s1>
```

我们使用以下样式表：

```java
<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:output method="xml" indent="yes"/>
<xsl:template match="//@* | //node()">
  <xsl:copy>
    <xsl:apply-templates select="@*"/>
    <xsl:apply-templates select="node()"/>
  </xsl:copy>
</xsl:template>
<xsl:template match="/s1/s2/s3">
<xsl:apply-templates select="@*"/>
<xsl:copy>
Content Replaced
</xsl:copy>
</xsl:template>  
</xsl:stylesheet>
```

在这种情况下，输出文件将如下所示：

```java
<?xml version="1.0" encoding="UTF-8"?>
<s1 title="s1 title attr">
  <s2 title="s2 title attr">
    <s3>
Content Replaced
</s3>
  </s2>
</s1>
```

### 示例2：内容提取

在本例中，我们从以下输入XML开始：

```java
<?xml version="1.0" encoding="UTF-8"?>
<MyRoot>
   <MyElement No="13">Some text</MyElement>
   <MyElement No="14">Some more text</MyElement>
</MyRoot>
```

我们使用以下样式表：

```java
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.1"   
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xs="http://www.w3.org/2001/XMLSchema">
<xsl:output method="text"
            media-type="text/plain"/>
<xsl:strip-space elements="*"/>
<!-- utilities not associated with specific tags -->
<!-- emit a newline -->
<xsl:template name="NL">
    <xsl:text>
</xsl:text>
</xsl:template>
<!-- beginning of processing -->
<xsl:template match="/">
    <xsl:apply-templates/>
</xsl:template>
<xsl:template match="MyElement">
    <xsl:value-of select="@No"/>
    <xsl:text>: </xsl:text>
    <xsl:value-of select="."/>
    <xsl:call-template name="NL"/>
</xsl:template>
</xsl:stylesheet>
```

在这种情况下，输出文件将如下所示：

```java
13: Some text
14: Some more text
```

### 其他示例

InterSystems IRIS提供了以下附加示例：

- 对于XSLT 1.0，请参阅%XML.XSLT.Transformer中的Example()、Example2()和其它方法。
- 对于XSLT 2.0，请参见Samples命名空间中的类XSLT2.Examples。
