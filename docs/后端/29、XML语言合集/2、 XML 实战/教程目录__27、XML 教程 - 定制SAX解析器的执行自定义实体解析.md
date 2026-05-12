# 27、XML 教程 - 定制SAX解析器的执行自定义实体解析
- 来源：https://ddkk.com/zhuanlan/xml/2/27.html
- 分类：XML语言教程
- 分组：教程目录
## 执行自定义实体解析

XML文档可能包含对外部DTD或其他实体的引用。默认情况下，InterSystems IRIS尝试查找这些实体的源文档并解析它们。要控制InterSystems IRIS解析外部实体的方式，请使用以下步骤：

**1、** 定义实体解析程序类；

此类必须在扩展`%XML.SAX.EntityResolver`，并且必须实现 `resolveEntity()`方法，该方法具有以下签名：

```java
method resolveEntity(publicID As %Library.String, systemID As %Library.String) as %Library.Integer
```

每当XML处理器找到对外部实体(如DTD)的引用时，就会调用该方法；这里的public ID和systemID是该实体的Public和系统标识符字符串。

该方法应获取实体或文档，将其作为流返回，然后在将流包装在`%XML.SAX.StreamAdapter`的实例中。此类提供了用于确定流特征的必要方法。

如果无法解析该实体，则该方法应返回`$$$NULLOREF` ，以向SAX解析器指示该实体无法解析)。

尽管方法签名指示返回值为`%Library.Integer`，但该方法应返回`%XML.SAX.StreamAdapter`的实例或该类的子类。

此外，引用外部实体的标识符始终传递给文档中指定的`resolveEntity()`方法。具体地说，如果这样的标识符使用相对URL，则该标识符将作为相对URL传递，这意味着引用文档的实际位置不会传递给`resolveEntity()`方法，并且无法解析该实体。在这种情况下，请使用默认实体解析器，而不是自定义实体解析器。

**1、** 读取XML文档时，请执行以下操作：；

a. 创建实体解析程序类的实例。

b. 读取XML文档时使用该实例，如本章前面的“指定解析器选项”中所述。

### 示例

例如，以下XML文档：

```java
<?xml version="1.0" ?>
<!DOCTYPE html SYSTEM  "c://temp/html.dtd">
<html>
<head><title></title></head>
<body>
<p>Some < xhtml-content > with custom entities &entity1; and &entity2;.</p>
<p>Here is another paragraph with &entity1; again.</p>
</body></html>
```

本文档使用以下DTD：

```java
<!ENTITY entity1
         PUBLIC "-//WRC//TEXT entity1//EN"
         "http://www.intersystems.com/xml/entities/entity1">
<!ENTITY entity2
         PUBLIC "-//WRC//TEXT entity2//EN"
         "http://www.intersystems.com/xml/entities/entity2">
<!ELEMENT html (head, body)>
<!ELEMENT head (title)>
<!ELEMENT title (#PCDATA)>
<!ELEMENT body (p)>
<!ELEMENT p (#PCDATA)>
```

要阅读本文档，需要如下所示的自定义实体解析器：

```java
Class CustomResolver.Resolver Extends %XML.SAX.EntityResolver
{
Method resolveEntity(publicID As %Library.String, systemID As %Library.String) As %Library.Integer
{
    Try {
        Set res=##class(%Stream.TmpBinary).%New()
        //check if we are here to resolve a custom entity
        If systemID="http://www.intersystems.com/xml/entities/entity1" 
        {
            Do res.Write("Value for entity1")
            Set return=##class(%XML.SAX.StreamAdapter).%New(res)
            }
            Elseif systemID="http://www.intersystems.com/xml/entities/entity2" 
            {
                Do res.Write("Value for entity2")
                Set return=##class(%XML.SAX.StreamAdapter).%New(res)
            }
            Else //otherwise call the default resolver
            {
                Set res=##class(%XML.SAX.EntityResolver).%New()
                Set return=res.resolveEntity(publicID,systemID)
            }
    }
    Catch 
    {
        Set return=$$$NULLOREF
    }
    Quit return
}
}
```

下面的类包含一个demo方法，该方法解析前面显示的文件并使用此自定义解析器：

```java
Include (%occInclude, %occSAX)
Class CustomResolver.ParseFileDemo
{
ClassMethod ParseFile() 
{
    Set res=class(CustomResolver.Resolver).%New()  
    Set file="c:/temp/html.xml"
    Set parsemask=$$$SAXALLEVENTS+$$$SAXERROR
    Set status=##class(%XML.TextReader).ParseFile(file,.textreader,res,,parsemask,,0)
    If $$$ISERR(status) {
     Do $system.OBJ.DisplayError(status) Quit }
    Write !,"Parsing the file ",file,! 
    Write "Custom entities in this file:"
    While textreader.Read()
    {
        If textreader.NodeType="entity"{
            Write !, "Node:", textreader.seq
            Write !,"    name: ", textreader.Name
            Write !,"    value: ", textreader.Value
        }
    }
}
}
```

下面显示了此方法在终端会话中的输出：

```java
GXML>dclass(CustomResolver.ParseFileDemo).ParseFile()
Parsing the file c:/temp/html.xml
Custom entities in this file:
Node:13
    name: entity1
    value: Value for entity1
Node:15
    name: entity2
    value: Value for entity2
Node:21
    name: entity1
    value: Value for entity1
```

### 示例2

例如，读取包含以下内容的XML文档:

```java
<!DOCTYPE chapter PUBLIC "-//OASIS//DTD DocBook XML V4.1.2//EN"
 "c:\test\doctypes\docbook\docbookx.dtd">
```

在本例中，将在`publicId`设置为 `-//OASIS//DTD DocBook XML V4.1.2//EN`并将`systemId`设置为`c:\test\doctypes\docbook\docbookx.dtd.`的情况下调用`resolveEntity`方法。

`resolveEntity`方法确定外部实体的正确源，将其作为流返回，并将其包装在`%XML.StreamAdaptor`的实例中。XML解析器从这个专用流中读取实体定义。

例如，请参考InterSystems IRIS库中包含的`%XML.Catalog`和`%XML.CatalogResolverclass。%XML.Catalog`类定义一个简单的数据库，该数据库将公共和系统标识符与URL相关联。`%XML.CatalogResolver`类是一个实体解析器类，它使用此数据库查找给定标识符的URL。`%XML.Catalogclass`可以从SGML样式的编录文件加载其数据库；该文件将标识符映射到标准格式的URL。
