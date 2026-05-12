# 02、XML 教程 - 从对象写入XML输出
- 来源：https://ddkk.com/zhuanlan/xml/2/2.html
- 分类：XML语言教程
- 分组：教程目录
本章介绍如何从InterSystems IRIS对象生成XML输出。

## 创建XML编写器概述

InterSystems IRIS提供了用于为InterSystems IRIS对象生成`XML`输出的工具。可以指定XML投影的详细信息，如将对象投影到`XML`中所述。然后创建一个`Writer`方法，该方法指定`XML`输出的整体结构：字符编码、对象的显示顺序、是否包括处理指令等。

基本要求如下：

- 如果需要特定对象的输出，则该对象的类定义必须扩展%XML.Adaptor。除了少数例外，该对象引用的类还必须扩展%XML.Adaptor。
- 输出方法必须创建%XML.Writer的实例，然后使用该实例的方法。

下面的终端会话显示了一个简单的示例，在该示例中，我们访问启用了XML的对象并为其生成输出：

```java
/// dclass(Sample.Person).Populate(100)
/// wclass(PHA.TEST.Xml).Obj2Xml(1)
ClassMethod Obj2Xml(ID)
{
	s obj =class(Sample.Person).%OpenId(ID)
	s xml =class(%XML.Writer).%New()
	s xml.Indent=1
	s status = xml.RootObject(obj)
	q ""
}
```

```java
DHC-APP>wclass(PHA.TEST.Xml).Obj2Xml(1)
<?xml version="1.0" encoding="UTF-8"?>
<Person>
  <Name>yaoxin</Name>
  <SSN>111-11-1117</SSN>
  <DOB>1990-04-25</DOB>
  <Home>
    <Street>889 Clinton Drive</Street>
    <City>St Louis</City>
    <State>WI</State>
    <Zip>78672</Zip>
  </Home>
  <Office>
    <Street>9619 Ash Avenue</Street>
    <City>Ukiah</City>
    <State>AL</State>
    <Zip>56589</Zip>
  </Office>
  <Spouse>
    <Name>濮氶懌</Name>
    <SSN>111-11-1115</SSN>
    <FavoriteColors>
      <FavoriteColorsItem>Red</FavoriteColorsItem>
      <FavoriteColorsItem>Orange</FavoriteColorsItem>
      <FavoriteColorsItem>Yellow</FavoriteColorsItem>
      <FavoriteColorsItem>Green</FavoriteColorsItem>
    </FavoriteColors>
  </Spouse>
  <FavoriteColors>
    <FavoriteColorsItem>Red</FavoriteColorsItem>
    <FavoriteColorsItem>Orange</FavoriteColorsItem>
    <FavoriteColorsItem>Yellow</FavoriteColorsItem>
  </FavoriteColors>
  <Age>31</Age>
</Person>
```

## 创建输出方法

输出方法按照指定的顺序逐段构造一个XML文档。输出方法的整体结构取决于需要输出完整的XML文档，还是仅仅输出一个片段。

### 输出方法的整体结构

方法应按以下顺序执行以下部分或全部操作：

**1、** 如果使用的对象可能无效，请调用该对象的`%ValidateObject()`方法并检查返回的状态如果对象无效，则XML也将无效；

**%XML.Writer 在导出对象之前不会对其进行验证。这意味着，如果刚刚创建了一个对象，但尚未对其进行验证，则该对象(以及XML)可能是无效的(例如，因为缺少必需的属性)。**

**1、** 创建`%XML.Writer`类的实例，并根据需要设置其属性；

特别是，需要设置以下属性：

- Indent 缩进-控制输出是在缩进和换行中生成(如果缩进等于1)，还是作为单个长行生成(如果缩进等于0)。后者是默认设置。
- IndentChars 缩进字符-指定用于缩进的字符。默认值为两个空格的字符串。如果缩进为0，则此属性无效。
- Charset 字符集-指定要使用的字符集。

为了提高可读性，本文档中的示例使用缩进等于1。

**1、** 指定输出目标；

默认情况下，输出写入当前设备。要指定输出目标，请在开始编写文档之前调用以下方法之一：

- OutputToDevice()-将输出定向到当前设备。
- OutputToFile()-将输出定向到指定文件。可以指定绝对路径或相对路径。请注意，该目录路径必须已经存在。
- OutputToString()-将输出定向到字符串。稍后，可以使用另一种方法来检索此字符串。
- OutputToStream()-将输出定向到指定的流。

**1、** 启动文档可以使用`StartDocument()`方法请注意，如果尚未通过`StartDocument()`启动文档，则以下方法会隐式启动文档：`Write()`、`WriteDocType()`、`RootElement()`、`WriteComment()`和`WriteProcessingInstruction()`；

**2、** 可以选择写入文档的序言行可以使用以下方法：；

- WriteDocType() - 编写DOCTYPE声明。
- WriteProcessingInstructions()-编写处理指令。

**1、** 可以选择指定默认命名空间编写器将其用于没有定义的XML命名空间的类；

**2、** 可以选择将命名空间声明添加到根元素为此，可以在启动根元素之前调用几个实用程序方法；

**3、** 启动文档的根元素详细信息取决于该文档的根元素是否对应于InterSystemsIRIS对象有两种可能性：；

- 根元素可能直接对应于InterSystems IRIS对象。如果要为单个对象生成输出，通常会出现这种情况。

在本例中，使用`RootObject()`方法，该方法将指定的启用XML的对象作为根元素写入。

- 根元素可能只是一组元素的包装器，而这些元素是InterSystems IRIS对象。

在本例中，使用`RootElement()`方法，该方法插入具有指定名称的根级元素。

**1、** 如果使用`RootElement()`方法，请调用方法来为根元素内的一个或多个元素生成输出可以按照选择的任何顺序或逻辑在根元素中编写任何元素有几种方法可以编写单个元素，并且可以结合使用这些技术：；

- 可以使用object()方法，该方法写入启用XML的对象。可以指定此元素的名称，也可以使用由对象定义的默认值。
- 可以使用element()方法，该方法使用提供的名称写入元素的开始标记。然后，可以使用WriteAttribute()、WriteChars()、WriteCData()等方法编写内容、属性和子元素。子元素可以是另一个Element()，也可以是Object()。使用EndElement()方法指示元素的结束。
- 可以使用%XML.Element并手动构造元素。

**1、** 如果使用的是`RootElement()`方法，请调用`EndRootElement()`方法此方法关闭文档的根元素，并根据需要减少缩进(如果有)；

**2、** 如果文档是从`StartDocument()`开始的，请调用`EndDocument()`方法关闭文档；

**3、** 如果将输出定向到字符串，请使用`GetXMLString()`方法检索该字符串；

还有许多其他可能的组织，但请注意，某些方法只能在某些上下文中调用。具体地说，一旦开始一个文档，在结束第一个文档之前，不能开始另一个文档。如果这样做，`Writer`方法将返回以下状态：

```java
#6275: Cannot output a new XML document or change %XML.Writer properties 
until the current document is completed.
#6275：在当前文档完成之前，无法输出新的XML文档或更改%XML。Writer属性。
```

`StartDocument()`方法的作用是：显式启动文档。如前所述，其他方法隐式启动文档：`write()`、`WriteDocType()`、`RootElement()`、`WriteComment()`和`WriteProcessingInstruction()`。

注意：这里描述的方法旨在使够向XML文档写入特定的单元，但在某些情况下，可能需要更多的控制。在`%XML.Writer`提供了一个额外的方法`Write()`，可以使用该方法将任意字符串写入输出中的任何位置。

此外，还可以使用`Reset()`方法重新初始化编写器属性和输出方法。如果已经生成了一个XML文档，并且希望在不创建新的编写器实例的情况下生成另一个文档，这将非常有用。

### 错误检查

**%XML.Writer的大多数方法都会返回状态。应该在每个步骤之后检查状态，并在适当的情况下退出。**

### 插入注释行

如前所述，使用`WriteComment()`方法插入注释行。可以在文档中的任何位置使用此方法。如果尚未启动XML文档，此方法将隐式启动文档。

### 示例

```java
/// wclass(PHA.TEST.Xml).Write()
ClassMethod Write() As %Status
{
	s obj =class(Sample.Person).%OpenId(1)
    set writer=##class(%XML.Writer).%New()
    set writer.Indent=1
    set status=writer.OutputToDevice()
    if $$$ISERR(status) {
        do $System.Status.DisplayError(status) 
        quit $$$ERROR($$$GeneralError, "输出目标无效")
    }
    set status=writer.RootObject(obj)
    if $$$ISERR(status) {
        do $System.Status.DisplayError(status) 
        quit $$$ERROR($$$GeneralError, "写入根对象时出错")
    }
    quit status
}
```

请注意，此方法使用`OutputToDevice()`方法将输出定向到当前设备(默认目标)。这不是必需的，但仅用于演示目的。

当然，输出取决于所使用的类，但可能如下所示：

```java
DHC-APP>wclass(PHA.TEST.Xml).Write()
<?xml version="1.0" encoding="UTF-8"?>
<Employee>
  <Name>xiaoli</Name>
  <SSN>111-11-1111</SSN>
  <Title>test</Title>
  <Salary>2662</Salary>
</Employee>1
```

### 有关缩进选项的详细信息

如前所述，可以使用编写器的缩进属性来获取包含附加换行符的输出，以获得更好的可读性。此格式没有正式规范。本节介绍`%XML.Writer`使用的规则。如果缩进等于`1`：

- 任何只包含空格字符的元素都会转换为空元素。
- 每个元素都放在自己的行上。
- 如果某个元素是前一个元素的子元素，则该元素相对于该父元素缩进。缩进由IndentChars属性确定，该属性默认为两个空格。
