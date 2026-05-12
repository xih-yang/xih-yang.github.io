# 20、XML 教程 - 使用%XML.TextReader 节点属性
- 来源：https://ddkk.com/zhuanlan/xml/2/20.html
- 分类：XML语言教程
- 分组：教程目录
## 节点属性

如前所述，类中的`%XML.TextReader`解析XML文档并创建一个`text reader`对象，该对象由一组与文档组件相对应的节点组成；节点类型在本章前面的“文档节点”中进行了描述。

当将焦点更改到其他节点时，`text reader`对象的属性将更新，以包含有关当前检查的节点的信息。本节介绍类中`%XML.TextReader`的所有属性。

### AttributeCount

如果当前节点是元素或属性，则此属性指示元素的属性数。在给定元素中，第一个属性编号为1。对于任何其他类型的节点，此属性为`0`。

### Depth

指示文档中当前节点的深度。根元素位于深度1；根元素之外的项位于深度`0`。请注意，属性与其所属元素的深度相同。同样，错误或警告与导致错误或警告的项的深度相同。

### EOF

如果读取器已到达源文档的末尾，则为true；否则为false。

### HasAttributes

如果当前节点是一个元素，则如果该元素具有属性，则此属性为true(如果没有属性，则为false)。如果当前节点是属性，则此属性为true。对于任何其他类型的节点，此属性为False。

### HasValue

如果当前节点是具有值的节点类型(即使该值为空)，则为True。否则，此属性为false。具体地说，对于以下类型的节点，此属性为真：

- attribute
- chars
- comment
- entity
- ignorablewhitespace
- processinginstruction
- startprefixmapping

请注意，对于`ERROR`和`WARNING`类型的节点，`HasValue`为`false`，即使这些节点类型具有值。

### IsEmptyElement

如果当前节点是元素且为空，则为True。否则，此属性为false。

### LocalName

对于`Attribute`、`Element`或`EndElement`类型的节点，这是当前元素或属性的名称，不带命名空间前缀。对于所有其他类型的节点，此属性为`NULL`。

### Name

当前节点的完全限定名称，视节点类型而定。下表提供了详细信息：

节点名称(按类型)

- attribute 属性的名称。例如，如果一个属性为:groupID="GX078"，则Name为:groupID
- element 或 endelement 元素的名称。例如，如果一个元素是:``...`` 则Name为: s01:Person
- entity 实体的名称。
- startprefixmapping 或 endprefixmapping 前缀，例如，如果命名空间声明如下: xmlns:s01="http://www.root.org"则Name为s01 另一个例子，如果名称空间声明如下:xmlns="http://www.root.org" Name为空。
- processinginstruction 处理指令的目标。

例如，如果处理指令是: `` 则`Name`为`xml-stylesheet`
- 所有其他类型 null

### NamespaceUri

对于attribute、element或endelement类型的节点，这是属性或元素所属的命名空间(如果有的话)。

对于所有其他类型的节点，此属性为空。

### NodeType

当前节点的类型。

### Path

元素的路径。例如，以下XML文档：

```java
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/css" href="mystyles.css"?>
<s01:Root xmlns:s01="http://www.root.org" xmlns="www.default.org">
   <Person>
      <Name>Willeke,Clint B.</Name>
      <DOB>1925-10-01</DOB>
      <GroupID>U3577</GroupID>
      <Address xmlns="www.address.org">
         <City>Newton</City>
         <Zip>56762</Zip>
      </Address>
   </Person>
</s01:Root>
```

对于`City`元素，`Path`属性是`/s01：root/Person/Address/City`。其他元素也被类似地对待。

### ReadState

指示文本阅读器对象的总体状态，以下值之一：

- “Initial”意味着Read()方法还没有被调用。
- “Interactive”意味着Read()方法至少被调用过一次。
- “EndOfFile”表示已经到达文件的末尾。

### Value

值(如果有的话)，适合于节点类型。具体情况如下表所示:

节点的值，按类型

- attribute 属性的值。例如，如果属性为：groupID=“GX078” 则值为：GX078
- chars 文本节点的内容。例如，如果元素为： The content of the text node. For example, if an element is:

`1925-10-01`;，则对于字符节点，值为：`1925-10-01`
- comment 注释的内容。例如，如果注释为：``，则值为：Comment here
- entity 实体的定义。
- error 错误消息。
- ignorablewhitespace 空白区域的内容。
- processinginstruction 处理指令的全部内容，不包括目标。

例如，如果处理指令是:`` 则值为 `type="text/css" href="mystyles.css"?`
- startprefixmapping 前缀，后跟空格，后跟URI。例如，如果名称空间声明如下：xmlns:s01="http://www.root.org"，则值为：s01 http://www.root.org
- warning 警告消息。
- 所有其他类型(包括元素) null

### seq

文档中此节点的序列号。第一个节点编号为1。请注意，属性与其所属的元素具有相同的序列号。

## Parse方法的参数列表

要指定文档源，请使用文本阅读器的`ParseFile()`、`ParseStream()`、`ParseString()`或`ParseURL()`方法。在任何情况下，源文档都必须是格式良好的XML文档；也就是说，它必须遵守XML语法的基本规则。对于这些方法，只需要前两个参数。作为参考，这些方法按顺序有以下参数：

**1、** 文件名、流、字符串或URL-文档源；

**请注意，对于ParseFile()，Filename参数只能包含ASCII字符。**

**1、** TextReader-文本读取器对象，如果方法返回`$OK`，则作为输出参数返回；

**2、** Resolver-分析源时使用的实体解析器；

**3、** Flags-用于控制SAX解析器执行的验证和处理的标志或标志组合；

**4、** Mask-用于指定XML源中感兴趣的项的掩码；

提示：对于`%XML.TextReader`的解析方法，默认掩码是`$SAXCONTENTEVENTS`。请注意，这会忽略注释。要解析所有可能的节点类型，请对此参数使用`$$$SAXALLEVENTS`。请注意，这些宏在`%occSAX.inc`包含文件中定义。

**1、** SchemaSpec-验证文档源所依据的架构规范此参数是一个字符串，其中包含以逗号分隔的命名空间/URL对列表：；

```java
"namespace URL,namespace URL"
```

这里，`Namespace`是用于模式的XML名称空间，URL是提供模式文档位置的URL。名称空间和URL值之间有一个空格字符。

**1、** KeepWhiteSpace-是否保留空白的选项；

**2、** PHttpRequest-(仅适用于`ParseURL()`方法)Web服务器的请求，作为`%Net.HttpRequest`的实例默认情况下，系统会创建`%Net.HttpRequest`的新实例并使用该实例，但也可以使用`%Net.HttpRequest`的其他实例发出请求这在已经设置了代理和其他属性的预先存在的`%Net.HttpRequest`的情况下很有用此选项仅适用于`http`类型的`URL`(例如，不适用于`file`或`ftp`)；
