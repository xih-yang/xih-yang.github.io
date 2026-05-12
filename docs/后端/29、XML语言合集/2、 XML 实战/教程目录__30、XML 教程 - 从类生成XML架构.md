# 30、XML 教程 - 从类生成XML架构
- 来源：https://ddkk.com/zhuanlan/xml/2/30.html
- 分类：XML语言教程
- 分组：教程目录
本章介绍如何使用`%XML.Schema`从启用了XML的类生成XML架构。

## 概述

要生成为同一XML命名空间中的多个类定义类型的完整架构，请使用`%XML.Schema`构建架构，然后使用`%XML.Writer`为其生成输出。

## 从多个类构建架构

要构建XML架构，请执行以下操作：

**1、** 创建`%XML.Schema`实例；

**2、** 可以选择设置实例的属性：；

- 若要为任何其他未分配的类型指定命名空间，请指定DefaultNamespace属性。默认值为NULL。
- 默认情况下，类及其属性的类文档包含在模式的``元素中。

要禁用此功能，请将`IncludeDocumentation`属性指定为0。

注意:必须在调用`AddSchemaType()`方法之前设置这些属性。

**1、** 调用实例的`AddSchemaType()`方法；

```java
method AddSchemaType(class As %String, 
                     top As %String  = "", 
                     format As %String, 
                     summary As %Boolean  = 0, 
                     input As %Boolean  = 0, 
                     refOnly As %Boolean  = 0) as %Status
```

- class是支持xml的类的完整包名和类名。
- top 是可选的;

如果指定，它将覆盖该类的类型名。
- format指定此类型的格式。

它必须是`"literal"`(文字格式，默认)，`"encoded"`(用于SOAP编码)，`"encoded12"`(用于SOAP 1.2编码)，或`"element"`。

值`“element”`与元素位于顶层的文字格式相同。
- summary，如果为true，将导致InterSystems IRIS启用xml的类的XMLSUMMARY参数。

如果指定了此参数，则模式将只包含该参数列出的属性。
- input，如果为true，将导致InterSystems IRIS获取输入模式，而不是输出模式。

在大多数情况下，输入模式和输出模式是相同的;

如果为类的属性指定`XMLIO`属性参数，则它们是不同的。
- refOnly如果为true，将导致InterSystems IRIS仅为引用的类型生成模式，而不是为给定的类和所有引用的类型生成模式。

这个方法返回一个应该被检查的状态。

**1、** 根据需要重复前面的步骤；

**2、** 如果要定义导入模式的位置，可以调用`DefineLocation()`方法；

```java
method DefineLocation(namespace As %String, location As %String)
```

namespace 是一个或多个引用类使用的名称空间，位置是对应模式(XSD文件)的URL或路径和文件名。

可以重复调用此方法来为多个导入的模式添加位置。

如果不使用这个方法，模式会包含一个``指令，但是不会给出模式的位置。

**1、** 要定义额外的``指令，可以调用`DefineExtraImports()`方法；

```java
method DefineExtraImports(namespace As %String, ByRef imports)
```

namespace是``指令应该添加到的命名空间，imports是一个多维数组，形式如下:

Node
Value

arrayname("namespace URI")
字符串，给出此名称空间的模式(XSD文件)的位置。

## 为架构生成输出

按照上一节所述创建`%XML.Schema`的实例后，请执行以下操作以生成输出：

**1、** 调用实例的`GetSchema()`方法将架构作为文档对象模型(DOM)的节点返回；

此方法只有一个参数：模式的目标命名空间的URI。该方法返回`%XML.Node`的一个实例，该实例在“将XML文档表示为DOM”一章中介绍。

如果模式没有命名空间，请使用`“”`作为`GetSchema()`的参数。

**1、** 可以选择修改此DOM；

**2、** 要生成架构，请执行以下操作：；

a.创建`%XML.Write`的实例，并可选择设置属性(如缩进)。

b.可以选择调用编写器的`AddNamespace()`方法和其他方法，将名称空间声明添加到`` 元素。

因为架构可能引用简单的XSD类型，所以调用`AddSchemaNamespace()`来添加XML模式命名空间很有用。

c.使用架构作为参数，调用编写器的`DocumentNode()`或`Tree()`方法。

## 示例

### 简单的示例

第一个示例显示了基本步骤：

```java
    Set schemawriter=##class(%XML.Schema).%New()
    //添加类和包(例如)
    Set status=schemawriter.AddSchemaType("Facets.Test")
    //通过其URI(在本例中为NULL)检索架构
    Set schema=schemawriter.GetSchema("")
    //create writer
    Set writer=##class(%XML.Writer).%New()
    Set writer.Indent=1
    //use writer
    Do writer.DocumentNode(schema)
```

### 更复杂的架构示例

```java
Class SchemaWriter.Person Extends (%Persistent, %XML.Adaptor)
{
Parameter NAMESPACE = "http://www.myapp.com";
Property Name As %Name;
Property DOB As %Date(FORMAT = 5);
Property PatientID as %String;
Property HomeAddress as Address;
Property OtherAddress as AddressOtherNS ;
}
```

`Address`类定义在相同的XML名称空间(`“http://www.myapp.com”`)中，而`OtherAddress`类定义在不同的XML名称空间(`“http://www.other.com”`)中。

`Company`类也被定义在XML名称空间`“http://www.myapp.com”`中。

其定义如下:

```java
Class SchemaWriter.Company Extends (%Persistent, %XML.Adaptor)
{
Parameter NAMESPACE = "http://www.myapp.com";
Property Name As %String;
Property CompanyID As %String;
Property HomeOffice As Address;
}
```

注意，不存在连接`Person`和`Company`类的属性关系。

要为命名空间`"http://www.myapp.com"`生成模式，我们可以使用以下方法:

```java
ClassMethod Demo()
{
    Set schema=##class(%XML.Schema).%New()
    Set schema.DefaultNamespace="http://www.myapp.com"
    Set status=schema.AddSchemaType("SchemaWriter.Person")
    Set status=schema.AddSchemaType("SchemaWriter.Company")
    Do schema.DefineLocation("http://www.other.com","c:/other-schema.xsd")
    Set schema=schema.GetSchema("http://www.myapp.com")
    //create writer
    Set writer=##class(%XML.Writer).%New()
    Set writer.Indent=1
    Do writer.AddSchemaNamespace()
    Do writer.AddNamespace("http://www.myapp.com")
    Do writer.AddNamespace("http://www.other.com")
    Set status=writer.DocumentNode(schema)
    If $$$ISERR(status) {
     Do $system.OBJ.DisplayError() Quit }
}
```

输出如下:

```java
<?xml version="1.0" encoding="UTF-8"?>
<schema xmlns="http://www.w3.org/2001/XMLSchema" 
xmlns:s="http://www.w3.org/2001/XMLSchema" 
xmlns:s01="http://www.myapp.com" 
xmlns:s02="http://www.other.com" 
elementFormDefault="qualified" 
targetNamespace="http://www.myapp.com">
  <import namespace="http://www.other.com" schemaLocation="c:/other-schema.xsd"/>
  <complexType name="Person">
    <sequence>
      <element minOccurs="0" name="Name" type="s:string"/>
      <element minOccurs="0" name="DOB" type="s:date"/>
      <element minOccurs="0" name="PatientID" type="s:string"/>
      <element minOccurs="0" name="HomeAddress" type="s01:Address"/>
      <element minOccurs="0" name="OtherAddress" type="s02:AddressOtherNS"/>
    </sequence>
  </complexType>
  <complexType name="Address">
    <sequence>
      <element minOccurs="0" name="State">
        <simpleType>
          <restriction base="s:string">
            <maxLength value="2"/>
          </restriction>
        </simpleType>
      </element>
      <element minOccurs="0" name="Zip">
        <simpleType>
          <restriction base="s:string">
            <maxLength value="10"/>
          </restriction>
        </simpleType>
      </element>
    </sequence>
  </complexType>
  <complexType name="Company">
    <sequence>
      <element minOccurs="0" name="Name" type="s:string"/>
      <element minOccurs="0" name="CompanyID" type="s:string"/>
      <element minOccurs="0" name="HomeOffice" type="s01:Address"/>
    </sequence>
  </complexType>
</schema>
```

请注意以下几点:

- 模式包括Person及其所有引用的类的类型，以及Company及其所有引用的类的类型。
- ``指令导入了OtherAddress类使用的命名空间;

因为我们使用了`DefineLocation()`，所以这个指令还指示了相应模式的位置。
- 因为我们在调用DocumentNode()之前使用了AddSchemaNamespace()和AddNamespace()，所以``元素包含了名称空间声明，它为这些名称空间定义了前缀。
- 如果我们没有使用AddSchemaNamespace()和AddNamespace()， ``将不会包含这些名称空间声明，模式将会如下所示:

```java
<?xml version="1.0" encoding="UTF-8"?>
<schema xmlns="http://www.w3.org/2001/XMLSchema" 
elementFormDefault="qualified"
targetNamespace="http://www.myapp.com">
  <import namespace="http://www.other.com" schemaLocation="c:/other-schema.xsd"/>
  <complexType name="Person">
    <sequence>
      <element minOccurs="0" name="Name" type="s01:string" xmlns:s01="http://www.w3.org/2001/XMLSchema"/>
      <element minOccurs="0" name="DOB" type="s02:date" xmlns:s02="http://www.w3.org/2001/XMLSchema"/>
      <element minOccurs="0" name="PatientID" type="s03:string" xmlns:s03="http://www.w3.org/2001/XMLSchema"/>
      <element minOccurs="0" name="HomeAddress" type="s04:Address" xmlns:s04="http://www.myapp.com"/>
      <element minOccurs="0" name="OtherAddress" type="s05:AddressOtherNS" xmlns:s05="http://www.other.com"/>
    </sequence>
  </complexType>
  <complexType name="Address">
    <sequence>
      <element minOccurs="0" name="State">
        <simpleType>
          <restriction base="s06:string" xmlns:s06="http://www.w3.org/2001/XMLSchema">
...
```
