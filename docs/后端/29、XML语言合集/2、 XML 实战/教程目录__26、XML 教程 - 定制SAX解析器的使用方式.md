# 26、XML 教程 - 定制SAX解析器的使用方式
- 来源：https://ddkk.com/zhuanlan/xml/2/26.html
- 分类：XML语言教程
- 分组：教程目录
每当InterSystems IRIS读取XML文档时，它都会使用InterSystems IRIS SAX(Simple API For XML)解析器。本章介绍用于控制系统间IRIS SAX解析器的选项。

## 关于IRIS SAX解析器

每当InterSystems IRIS读取XML文档时，都会使用InterSystems IRIS SAX解析器。

它是一个事件驱动的XML解析器，读取XML文件，并在找到感兴趣的项(如XML元素的开始、DTD的开始等)时发出回调。

(更准确地说，解析器与内容处理程序协同工作，内容处理程序发出回调。只有在自定义SAX接口时，此区别才很重要，如本章后面的“创建自定义内容处理程序”中所述。)

解析器使用标准Xerces-C++库，该库符合`XML1.0`推荐标准和许多相关标准。

## 可用的解析器选项

可以通过以下方式控制SAX解析器的行为：

- 可以设置标志来指定要执行的验证和处理类型。

请注意，解析器始终检查文档是否为格式良好的XML文档。

- 可以指感兴趣的事件(即希望解析器查找的项目)。为此，需要指定一个掩码来指示感兴趣的事件。
- 可以提供验证文档所依据的架构规范。
- 可以使用特殊用途的实体解析器禁用实体解析。
- 可以指定实体解析的超时期限。
- 如果需要控制解析器如何查找文档中任何实体的定义，则可以指定更通用的自定义实体解析器。
- 如果通过URL访问源文档，则可以将发送到Web服务器的请求指定为%Net.HttpRequest的实例。
- 可以指定自定义内容处理程序。
- 可以使用HTTPS。

可用的选项取决于如何使用InterSystems IRIS SAX Parser，如下表所示:

%XML类中的SAX解析器选项

Option
%XML.Reader
%XML.TextReader
%XML.XPATH.Document
%XML.SAX.Parser

指定解析器标志
supported
supported
supported
supported

指定感兴趣的解析事件(例如，元素的开始、元素的结束、注释)
not supported
supported
not supported
supported

指定模式规范
supported
supported
supported
supported

禁用实体解析或以其他方式定制实体解析
supported
supported
supported
supported

指定自定义HTTP请求(如果解析URL)
not supported
supported
not supported
supported

指定内容处理程序
not supported
not supported
not supported
supported

在HTTPS位置解析文档
supported
not supported
not supported
supported

解析HTTPS位置上的实体
not supported
not supported
not supported
supported

## 指定解析器选项

指定不同的解析器行为取决于你如何使用InterSystems IRIS SAX解析器:

- 如果使用%XML.Reader，可以设置阅读器实例的Timeout、SAXFlags、SAXSchemaSpec和EntityResolver属性。

例如:

```java
  include %occInclude
  include %occSAX
   // set the parser options we want
   Set flags = $$$SAXVALIDATION
               + $$$SAXNAMESPACES
               + $$$SAXNAMESPACEPREFIXES
               + $$$SAXVALIDATIONSCHEMA
   Set reader=##class(%XML.Reader).%New()
   Set reader.SAXFlags=flags
```

这些宏是在`%occSAX`中定义的。公司包含文件。

- 在其他情况下，指定所使用方法的参数。例如:

```java
  include %occInclude
  include %occSAX
   //set the parser options we want
   Set flags = $$$SAXVALIDATION
               + $$$SAXNAMESPACES
               + $$$SAXNAMESPACEPREFIXES
               + $$$SAXVALIDATIONSCHEMA
  Set status=##class(%XML.TextReader).ParseFile(myfile,.doc,,flags)
```

## 设置解析器标志

`%occSAX.inc` include文件列出了可用于控制`Xerces`解析器执行的验证的标志。基本标志如下：

- `$``$``$`SAXVALIDATION -是否执行模式验证。如果此标志为开启(默认值)，则报告所有验证错误。
- `$``$``$`SAXNAMESPACES-指定是否识别命名空间。如果此标志为ON(默认值)，解析器将处理命名空间。如果此标志为OFF，InterSystems IRIS会导致%XML.SAX.ContentHandler的startElement()回调中元素的localname为空字符串。
- `$``$``$`SAXNAMESPACEPREFIXES-指定是否处理命名空间前缀。如果此标志为ON，解析器将报告用于名称空间声明的原始前缀名称和属性。默认情况下，此标志处于关闭状态。
- `$``$``$`SAXVALIDATIONDYNAMIC - 指定是否动态执行验证。如果此标志为ON(默认设置)，则仅在指定语法时才执行验证。
- `$``$``$`SAXVALIDATIONSCHEMA -指定是否针对架构执行验证。如果此标志为ON(缺省设置)，则针对给定模式(如果有的话)执行验证。
- `$``$``$`SAXVALIDATIONSCHEMAFULLCHECKING - 指定是否执行完整架构约束检查，包括耗时或内存密集型检查。如果此标志处于打开状态，则执行所有约束检查。默认情况下，此标志处于关闭状态。
- `$``$``$`SAXVALIDATIONREUSEGRAMMAR - 指定是否缓存语法以供以后在同一IRIS进程内的分析中重复使用。默认情况下，此标志处于关闭状态。
- `$``$``$`SAXVALIDATIONPROHIBITDTDS - 在遇到DTD时导致解析器抛出错误的特殊标志。如果需要阻止处理DTD，请使用此标志。要使用此标志，必须将值`$``$``$`SAXVALIDATIONPROHIBITDTDS显式添加到传递给%XML.SAX.Parser的各种分析方法的分析标志。

以下附加标志提供了基本标志的有用组合：

- `$``$``$`SAXDEFAULTS - 相当于SAX默认值。
- `$``$``$`SAXFULLDEFAULT - 等同于SAX默认值，外加处理名称空间前缀的选项。
- `$``$``$`SAXNOVALIDATION - 不执行架构验证，但可以识别命名空间和命名空间前缀。请注意，SAX解析器总是检查文档是否为格式良好的XML文档。

以下片段显示了如何组合解析器选项：

```java
...
#include %occInclude
#include %occSAX
...
 ;; set the parser options we want
 set opt = $$$SAXVALIDATION
               + $$$SAXNAMESPACES
               + $$$SAXNAMESPACEPREFIXES
               + $$$SAXVALIDATIONSCHEMA
...
  set status=##class(%XML.TextReader).ParseFile(myfile,.doc,,opt)
  //check status
  if $$$ISERR(status) {do $System.Status.DisplayError(status) quit}
```

## 指定事件掩码

基本标志如下：

- `$``$``$`SAXSTARTDOCUMENT — 指示分析器在启动文档时发出回调。
- `$``$``$`SAXENDDOCUMENT — 指示分析器在结束文档时发出回调。
- `$``$``$`SAXSTARTELEMENT — 指示分析器在找到元素开头时发出回调。
- `$``$``$`SAXENDELEMENT — 指示分析器在找到元素末尾时发出回调。
- `$``$``$`SAXCHARACTERS — 指示分析器在找到字符时发出回调。
- `$``$``$`SAXPROCESSINGINSTRUCTION — 指示分析器在找到处理指令时发出回调。
- `$``$``$`SAXSTARTPREFIXMAPPING — 指示分析器在找到前缀映射的开始时发出回调。
- `$``$``$`SAXENDPREFIXMAPPING — 指示分析器在找到前缀映射末尾时发出回调。
- `$``$``$`SAXIGNORABLEWHITESPACE — 指示分析器在发现可忽略的空格时发出回调。这仅适用于文档具有DTD并且启用了验证的情况。
- `$``$``$`SAXSKIPPEDENTITY — 指示分析器在找到跳过的实体时发出回调。
- `$``$``$`SAXCOMMENT — 指示分析器在找到注释时发出回调。
- `$``$``$`SAXSTARTCDATA — 指示分析器在找到CDATA节的开头时发出回调。
- `$``$``$`SAXENDCDATA —指示分析器在找到CDATA节末尾时发出回调。
- `$``$``$`SAXSTARTDTD —指示分析器在找到DTD的开头时发出回调。
- `$``$``$`SAXENDDTD —指示分析器在找到DTD结尾时发出回调。
- `$``$``$`SAXSTARTENTITY — 指示分析器在找到实体的开头时发出回调。
- `$``$``$`SAXENDENTITY — 指示分析器在找到实体末尾时发出回调。

### 方便的组合标志

以下附加标志提供了基本标志的有用组合:

- `$``$``$`SAXCONTENTEVENTS — 指示解析器对任何包含“content”的事件发出回调。
- `$``$``$`SAXLEXICALEVENT — 指示解析器向任何词汇事件发出回调。
- `$``$``$`SAXALLEVENTS —指示解析器对所有事件发出回调。

### 将标志组合成单个掩码

下面的片段展示了如何将多个标志组合成一个掩码:

```java
...
#include %occInclude
#include %occSAX
...
 // set the mask options we want
 set mask = $$$SAXSTARTDOCUMENT
               + $$$SAXENDDOCUMENT
               + $$$SAXSTARTELEMENT
               + $$$SAXENDELEMENT
               + $$$SAXCHARACTERS
...
 // create a TextReader object (doc) by reference
 set status =class(%XML.TextReader).ParseFile(myfile,.doc,,,mask)
```

## 指定模式文档

可以指定用于验证文档源的模式规范。指定一个包含逗号分隔的命名空间/URL对列表的字符串:

```java
"namespace URL,namespace URL,namespace URL,..."
```

这里的名称空间是XML名称空间(而不是名称空间前缀)，URL是提供该名称空间的模式文档位置的URL。

在命名空间和URL值之间有一个空格字符。

例如，下面显示了一个具有单个命名空间的模式规范:

```java
"http://www.myapp.org http://localhost/myschemas/myapp.xsd"
```

下面是一个包含两个命名空间的模式规范:

```java
"http://www.myapp.org http://localhost/myschemas/myapp.xsd,http://www.other.org http://localhost/myschemas/other.xsd"
```

## 禁用实体解析

即使在设置SAX标志以禁用验证时，SAX解析器仍然试图解析外部实体，这可能非常耗时，具体取决于它们的位置。

类`%XML.SAX.NullEntityResolver`实现始终返回空流的实体解析器。如果要禁用实体解析，请使用此类。具体地说，在读取XML文档时，请使用`%XML.SAX.NullEntityResolver`的实例作为实体解析器。例如：

```java
   Set resolver=##class(%XML.SAX.NullEntityResolver).%New()
   Set reader=##class(%XML.Reader).%New()
   Set reader.EntityResolver=resolver
   Set status=reader.OpenFile(myfile)
   ...
```

重要提示：由于此更改将禁用所有外部实体解析，因此此技术还将禁用XML文档中的所有外部DTD和模式引用。
