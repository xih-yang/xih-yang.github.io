# 22、XML 教程 - 计算XPath表达式
- 来源：https://ddkk.com/zhuanlan/xml/2/22.html
- 分类：XML语言教程
- 分组：教程目录
`XPath`(XML路径语言)是一种基于XML的表达式语言，用于从XML文档获取数据。使用类中的`%XML.XPATH.Document`，可以轻松地计算`XPath`表达式(给定提供的任意XML文档)。

注意：使用的任何XML文档的XML声明都应该指明该文档的字符编码，并且文档应该按照声明的方式进行编码。如果未声明字符编码，InterSystems IRIS将使用本书前面的“输入和输出的字符编码”中描述的默认值。如果这些默认值不正确，请修改XML声明，使其指定实际使用的字符集。

### IRIS中XPath表达式求值概述

要使用InterSystems IRIS XML支持使用任意XML文档计算`XPath`表达式，请执行以下操作：

**1、** 创建`%XML.XPATH.Document`的实例为此，请使用以下类方法之一：`CreateFromFile()`、`CreateFromStream()`或`CreateFromString()``使用这些方法中的任何一种，都可以将输入XML文档指定为第一个参数，并接收%XML.XPATH.Document`的一个实例作为输出参数；

这一步使用内置的XSLT处理器解析XML文档。

**1、** 使用`%XML.XPATH.Document`实例的`EvaluateExpression()`方法对于此方法，需要指定节点上下文和要计算的表达式；

节点上下文指定要在其中计算表达式的上下文。这使用`XPath`语法来表示到所需节点的路径。例如：

```java
"/staff/doc"
```

要计算的表达式还使用`XPath`语法。例如：

```java
"name[@last='Marston']"
```

可以将结果作为输出参数(作为第三个参数)接收。

注意：如果要迭代一大组文档并计算每个文档的`XPath`表达式，建议在处理完文档后，在打开下一个文档之前将该文档的`OREF`设置为`NULL`。这绕过了第三方软件的一个限制。在循环中处理大量文档时，此限制会导致CPU使用率略有增加。

## 创建XPath文档时的参数列表

若要在创建`%XML.XPATH.Document`的实例，请使用该类的`CreateFromFile()`、`CreateFromStream()`或`CreateFromString()`类方法。对于这些类方法，完整的参数列表按顺序如下：

**1、** PSource、pStream或pString-源文档；

- 对于CreateFromFile()，此参数是文件名。
- 对于CreateFromStream()，此参数是二进制流。
- 对于CreateFromString()，此参数是一个字符串。

**1、** PDocument-作为输出参数返回的结果这是`%XML.XPATH.Document`的实例；

**2、** PResolver-解析源时使用的可选实体解析器；

**3、** PErrorHandler-一个可选的自定义错误处理程序；

**4、** PFlags-控制SAX解析器执行的验证和处理的可选标志；

**5、** PSchemaSpec-可选的架构规范，用于验证文档源此参数是一个字符串，其中包含以逗号分隔的命名空间/URL对列表：；

```java
"namespace URL,namespace URL"
```

这里，`Namespace`是用于模式的XML名称空间，URL是提供模式文档位置的URL。名称空间和URL值之间有一个空格字符。

**7、** PPrefixMappings-可选的前缀映射字符串；

`CreateFromFile()`、`CreateFromStream()`和`CreateFromString()`方法返回应检查的状态。例如：

```java
 Set tSC=##class(%XML.XPATH.Document).CreateFromFile("c:\sample.xml",.tDocument)
 If $$$ISERR(tSC) Do $System.OBJ.DisplayError(tSC)
```

## 为默认命名空间添加前缀映射

当XML文档使用默认名称空间时，这会给`XPath`带来问题。请考虑以下示例：

```java
<?xml version="1.0"?>
<staff xmlns="http://www.staff.org">
  <doc type="consultant">
    <name first="David" last="Marston">Mr. Marston</name>
    <name first="David" last="Bertoni">Mr. Bertoni</name>
    <name first="Donald" last="Leslie">Mr. Leslie</name>
    <name first="Emily" last="Farmer">Ms. Farmer</name>
  </doc>
</staff>
```

在本例中， `` 元素属于名称空间，但没有名称空间前缀。`XPath`不提供访问 `` 元素的简单方法。

- 可以设置%XML.XPATH.Document实例的Prefix Mappings属性。该属性旨在为源文档中的每个默认名称空间提供唯一的前缀，以便XPath表达式可以使用这些前缀，而不是使用完整的名称空间URI。

`PrefixMappings` 属性是一个由逗号分隔的列表组成的字符串；每个列表项都是一个前缀，后跟一个空格，后跟一个命名空间URI。

- 调用CreateFromFile()、CreateFromStream()或CreateFromString()时，可以指定PrefixMappings参数。此字符串的格式必须与前面描述的相同。

然后以与使用任何名称空间前缀相同的方式使用这些前缀。

例如，假设将前面的XML读入`%XML.XPATH.Document`的实例时，按如下方式指定了前缀映射：

```java
"s http://www.staff.org"
```

在本例中，可以使用`"/s:staff/s:doc"`访问`` 元素。

请注意，可以使用实例方法`GetPrefix()`来获取先前为文档中的给定路径指定的前缀。

## 计算XPath表达式

要计算`XPath`表达式，请使用`%XML.XPATH.Document`实例的`EvaluateExpression()`方法。对于此方法，请按顺序指定以下参数：

**1、** PContext-节点上下文，指定在其中计算表达式的上下文指定一个字符串，该字符串包含指向所需节点的路径的`XPath`语法例如：；

```java
"/staff/doc"
```

**1、** PExpression-选择特定结果的谓词指定包含所需XPath语法的字符串例如：；

```java
"name[@last='Marston']"
```

注意：对于其他技术，通常的做法是将谓词连接到节点路径的末尾。类中的`%XML.XPATH.Document`不支持此语法，因为基础XSLT处理器需要节点上下文和谓词作为单独的参数。

**1、** PResults-作为输出参数返回的结果；

`EvaluateExpression()`方法返回应该检查的状态。例如：

```java
 Set tSC=tDoc.EvaluateExpression("/staff/doc","name[@last='Smith']",.tRes)
 If $$$ISERR(tSC) {
     Do $System.OBJ.DisplayError(tSC)}
```

## 使用XPath结果

XPath表达式可以返回XML文档的一个子树、多个子树或标量结果。在`%XML.XPATH.Document`的`EvaluateExpression()`方法旨在处理所有这些情况。具体地说，它返回一个结果列表。该列表中的每个项目都有一个Type属性，该属性具有下列值之一：

- `$``$``$`XPATHDOM-指示该项包含XML文档的子树。此项目是%XML.XPATH.DOMResult实例，提供导航和检查子树的方法。
- `$``$``$`XPATHVALUE-指示该项是单个标量结果。此项目是%XML.XPATH.ValueResult实例。

这些宏在`%occXSLT.inc`包含文件中定义。

### 检查XML子树

本节介绍如何导航由`%XML.XPATH.DOMResult`表示的XML子树，以及如何获取有关您在该子树中当前位置的信息。

#### 导航子树

要导航`%XML.XPATH.DOMResult`的实例，可以使用该实例的以下方法：`Read()`、`MoveToAttributeIndex()`、`MoveToAttributeName()`、`MoveToElement()`和`Rewind()`。

要移动到文档中的下一个节点，请使用`read()`方法。`Read()`方法返回TRUE值，直到没有更多节点可读为止(即，直到到达文档末尾)。

导航到某个元素时，如果该元素具有属性，则可以使用以下方法导航到这些属性：

- 使用MoveToAttributeIndex()方法按索引(属性在元素中的序号位置)移动到特定属性。此方法只有一个参数：属性的索引号。请注意，可以使用AttributeCount属性来了解给定元素有多少个属性。
- 使用MoveToAttributeName()方法按名称移动到特定属性。此方法有两个参数：属性名称和命名空间URI(可选)。

完成当前元素的属性后，可以通过调用其中一个导航方法(如`read()`)移动到文档中的下一个元素。或者，可以调用`MoveToElement()`方法返回到包含当前属性的元素。

这里描述的所有方法都在文档中前进，但`Rewind()`方法除外，它导航到文档的开头并重置所有属性。

#### 节点的属性

除`Type`属性外，`%XML.XPATH.DOMResult`的以下属性还提供有关当前位置的信息。

##### AttributeCount

如果当前节点是元素，则此属性指示元素的属性数。

##### EOF

如果读取器已到达源文档的末尾，则为true；否则为false。

##### HasAttributes

如果当前节点是一个元素，则如果该元素具有属性，则此属性为true(如果没有属性，则为false)。如果当前节点是属性，则此属性为true。

对于任何其他类型的节点，此属性为False。

##### HasValue

如果当前节点是具有值的节点类型(即使该值为空)，则为True。否则，此属性为false。

##### LocalName

对于属性或元素类型的节点，这是当前元素或属性的名称，不带命名空间前缀。对于所有其他类型的节点，此属性为`NULL`。

##### Name

当前节点的完全限定名称，视节点类型而定。

##### NodeType

当前节点的类型，如下之一:`attribute`, `chars`, `cdata`, `comment`, `document`, `documentfragment`, `documenttype`, `element`, `entity`, `entityreference`, `notation`，或处理指令。

##### Path

对于元素类型的节点，这是到元素的路径。

对于所有其他类型的节点，此属性为空。

##### ReadState

表示总体读状态，有以下几种:

- “initial”表示Read()方法还没有被调用。
- “cursoractive”意味着Read()方法至少被调用过一次。
- “eof”表示已经到达文件的末尾。

##### Uri

当前节点的URI。

返回的值取决于节点的类型。

##### Value

值(如果有的话)，适合于节点类型。

如果该值小于`32kb`，则为字符串。

否则，它是一个字符流。

### 检查标量结果

本节介绍在类中使用由`%XML.XPATH.ValueResult`表示的`XPath`结果。除`Type`属性外，该类还提供`Value`属性。

请注意，如果该值的长度大于32KB，则会自动将其放入流对象中。除非确定将收到的结果类型，否则应该检查`Value`是否为流对象。为此，可以使用`$IsObject`函数。(也就是说，如果此值是对象，则它是流对象，因为它是唯一可以是对象的类型。)

```java
 // 如果结果长度大于32KB，则值可以是流
 Set tValue=tResult.Value
 If $IsObject(tValue){
     Write ! Do tValue.OutputToDevice()
 } else {
     Write tValue
 }
```

### 一般方法

除非可以确定在计算`XPath`表达式时会收到什么样的结果，否则应该编写代码来处理最常见的情况。代码的可能组织如下：

**1、** 查找返回结果列表中的元素数量遍历此列表；

**2、** 对于每个列表项，检查`Type`属性；

- 如果Type为`$``$``$`XPATHDOM,， 在类中使用%XML.XPATH.DOMResult的方法导航并检查此XML子树。
- 如果Type为`$``$``$`XPATHVALUE，请检查Value属性是否为流对象。如果是流对象，则使用常用的流接口访问数据。否则，Value属性为字符串。

## 示例

本节中的示例针对以下`XML`文档计算`XPath`表达式：

```java
<?xml version="1.0"?>
<staff>
  <doc type="consultant">
    <name first="Xin" last="Yao">Yao Xin</name>
    <name first="David" last="Bertoni">Mr. Bertoni</name>
    <name first="Donald" last="Leslie">Mr. Leslie</name>
    <name first="Emily" last="Farmer">Ms. Farmer</name>
  </doc>
  <doc type="GP">
    <name first="Myriam" last="Midy">Ms. Midy</name>
    <name first="Paul" last="Dick">Mr. Dick</name>
    <name first="Scott" last="Boag">Mr. Boag</name>
    <name first="Shane" last="Curcuru">Mr. Curcuru</name>
    <name first="Joseph" last="Kesselman">Mr. Kesselman</name>
    <name first="Stephen" last="Auriemma">Mr. Auriemma</name>
  </doc>
</staff>
```

### 计算具有子树结果的XPath表达式

```java
/// 计算返回DOM Result的XPath表达式
ClassMethod Example1()
{
    Set tSC=$$$OK
    do {
    Set tSC=##class(%XML.XPATH.Document).CreateFromFile(filename,.tDoc)
    If $$$ISERR(tSC) {
     Do $System.OBJ.DisplayError(tSC) Quit}
    Set context="/staff/doc"
    Set expr="name[@last='Marston']"
    Set tSC=tDoc.EvaluateExpression(context,expr,.tRes)
    If $$$ISERR(tSC) Quit
        Doclass(%XML.XPATH.Document).ExampleDisplayResults(tRes)
    } while (0)
    If $$$ISERR(tSC) {
     Do $System.OBJ.DisplayError(tSC)}
    Quit
}
```

本例选择了``元素的`last`属性等于`Yao`的任何节点。

该表达式在``元素的``节点中计算。

请注意，此示例使用`%XML.XPATH.Document`的`ExampleDisplayResults()`类方法。

执行`example1（）`方法时，将先前的XML文件作为输入提供，您会看到以下输出：

```java
DHC-APP>dclass(PHA.TEST.Xml).Example1("E:\temp\xmlXpath.txt")
XPATH DOM
element: name
         attribute: first Value: Xin
         attribute: last  Value: Yao
chars :text Value: Yao Xin
```

### 计算具有标量结果的XPath表达式

下面的类方法读取XML文件并计算返回标量结果的XPath表达式：

```java
/// 计算返回值结果的XPath表达式
/// dclass(PHA.TEST.Xml).Example2("E:\temp\xmlXpath.txt")
ClassMethod Example2(filename)
{
    Set tSC=$$$OK
    do {
    Set tSC=##class(%XML.XPATH.Document).CreateFromFile(filename,.tDoc)
    If $$$ISERR(tSC) {
     Do $System.OBJ.DisplayError(tSC) Quit}
    Set tSC=tDoc.EvaluateExpression("/staff","count(doc)",.tRes)
        If $$$ISERR(tSC) Quit
        Doclass(%XML.XPATH.Document).ExampleDisplayResults(tRes)
    } while (0)
    If $$$ISERR(tSC) {
     Do $System.OBJ.DisplayError(tSC)}
    Quit
}
```

这个例子统计``子节点。

该表达式在``元素中求值。

当执行`Example2()`方法，提供前面的XML文件作为输入时，会看到以下输出:

```java
DHC-APP> dclass(PHA.TEST.Xml).Example2("E:\temp\xmlXpath.txt")
XPATH VALUE
2
```
