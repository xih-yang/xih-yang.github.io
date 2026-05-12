# 32、XML 教程 - XML基础知识概念
- 来源：https://ddkk.com/zhuanlan/xml/2/32.html
- 分类：XML语言教程
- 分组：教程目录
### attribute

以下形式的名值对:

```java
ID="QD5690"
```

属性位于元素中，如下所示，一个元素可以有任意数量的属性。

```java
<Patient ID="QD5690">Cromley,Marcia N.</Patient>
```

### CDATA区域

表示不应该验证的文本，如下所示:

```java
<myelementname><![CDATA[ 
Non-validated data goes here.  
You can even have stray "<" or ">" symbols in it. 
]]></myelementname>
```

一个`CDATA`(字符数据)区段不能包含字符串`]]`>，因为这个字符串标志着区段的结束。

这也意味着`CDATA`区段不能嵌套。

注意，`CDATA`部分的内容必须符合为XML文档指定的编码，XML文档的其余部分也是如此。

### comment

不是XML文档主数据的一部分的插入说明。

注释是这样的:

```java
<!--Output for the class: GXML.PersonNS7-->
```

### content model

对XML元素的可能内容的抽象描述。

可能的内容模型如下:

- 空内容模型(不允许有子元素或文本节点)
- 简单内容模型(只允许文本节点)
- 复杂内容模型(只有子元素)
- 混合内容模型(允许子元素和文本节点)

在所有情况下，元素可能有也可能没有属性;

短语内容模型不涉及元素中属性的存在或不存在。

### default namespace

给定上下文中任何非限定元素所属的名称空间。

添加的默认名称空间没有前缀。

例如:

```java
<Person xmlns="http://www.person.org">
  <Name>Isaacs,Rob G.</Name>
  <DOB>1981-01-29</DOB>
</Person>
```

因为这个名称空间声明没有使用前缀，所以``、``和``元素都属于这个名称空间。

注意，下面的XML没有使用默认名称空间，它实际上等同于前面的示例:

```java
<s01:Person s01:xmlns="http://www.person.org">
  <s01:Name>Isaacs,Rob G.</s01:Name>
  <s01:DOB>1981-01-29</s01:DOB>
</s01:Person>
```

### DOM

文档对象模型(DOM)是表示XML和相关格式的对象模型。

### DTD(文档类型定义)

包含在XML文档或外部文件中的一系列文本指令。

它定义了可以在文档中使用的所有有效元素和属性。

dtd本身不使用XML语法。

### element

一个元素通常由两个标记(一个开始标记和一个结束标记)组成，可能包含文本和其他元素。

元素的内容是这两个标记之间的所有内容，包括文本和任何子元素。

下面是一个完整的XML元素，包含开始标记、文本内容和结束标记:

```java
<Patient>Cromley,Marcia N.</Patient>
```

一个元素可以有任意数量的属性和任意数量的子元素。

空元素可以包含一个开始标记和一个结束标记，也可以只包含一个标记。

下面的例子是等价的:

```java
<EndDate></EndDate>
<EndDate/>
```

在实践中，元素很可能引用数据记录的不同部分，例如

```java
<Student level="undergraduate">
   <Name>Barnes,Gerry</Name>
   <DOB>1981-04-23</DOB>
</Student>
```

### entity

(在XML文件中)表示一个或多个字符的文本单元。

一个实体有以下结构:

```java
&characters;
```

### global element

全局元素和局部元素的概念适用于使用名称空间的文档。

全局元素的名称与局部元素的名称放在一个单独的符号空间中。

全局元素是其类型具有全局作用域的元素，即其类型在相应XML模式的顶层定义的元素。

作为``元素的子元素的元素声明被认为是全局声明。

任何其他元素声明都是局部元素，除非它通过ref属性引用全局声明，这实际上使它成为全局元素。

属性可以是全局的，也可以是局部的。

### local element

不是全局的XML元素。

局部元素不显式属于任何名称空间，除非元素是限定的。

参见限定元素和全局元素。

### namespace

名称空间是为标识符定义域的惟一字符串，以便基于xml的应用程序不会混淆一种类型的文档和另一种类型的文档。

它通常以URL(统一资源位置)的形式给出一个URI(统一资源指示器)，它可能与实际的web地址对应，也可能不对应。

例如，`“http://www.w3.org”`是一个名称空间。

使用以下语法之一包含命名空间声明:

```java
xmlns="your_namespace_here"
pre:xmlns="your_namespace_here"
```

在这两种情况下，名称空间只在插入名称空间声明的上下文中使用。

在后一种情况下，名称空间与给定的前缀(pre)相关联。

当且仅当元素或属性也有此前缀时，元素或属性就属于该名称空间。

例如:

```java
<s01:Person xmlns:s01="http://www.person.com">
   <Name>Ravazzolo,Roberta X.</Name>
   <DOB>1943-10-24</DOB>
</s01:Person>
```

命名空间声明使用`s01`前缀。

``元素也使用了这个前缀，所以这个元素属于这个名称空间。

但是，``和``元素并不显式地属于任何命名空间。

### 处理指令(PI)

一种指令(在序言中)，旨在告诉应用程序如何使用XML文档或如何处理它。

一个例子;

这将样式表与文档关联起来。

```java
<?xml-stylesheet type="text/css" href="mystyles.css"?>
```

### prolog

XML文档中根元素之前的部分。

序言以XML声明(指示使用的XML版本)开始，然后可能包括DTD声明或模式声明以及处理指令。

(从技术上讲，不需要`DTD`或模式。

此外，从技术上讲，可以将两者放在同一个文件中。)

### root, root element, document element

每个XML文档都要求在最外层只有一个元素。

这称为根元素、根元素或文档元素。

根元素在序言之后。

### qualified

如果显式地将元素或属性分配给名称空间，则该元素或属性是限定的。

考虑下面的例子，其中``的元素和属性是不限定的:

```java
<?xml version="1.0" encoding="UTF-8"?>
<Root>
   <s01:Person xmlns:s01="http://www.person.com" GroupID="J1151">
      <Name>Frost,Sally O.</Name>
      <DOB>1957-03-11</DOB>
   </s01:Person>
</Root>
```

在这里，名称空间声明使用`s01`前缀。

没有默认的命名空间。

``元素也使用了这个前缀，因此该元素属于这个名称空间。

``和``元素或``属性没有前缀，因此它们不显式属于任何名称空间。

相反，考虑以下情况，其中``的元素和属性是限定的:

```java
<?xml version="1.0" encoding="UTF-8"?>
<Root>
   <Person xmlns="http://www.person.com" GroupID="J1151">
      <Name>Frost,Sally O.</Name>
      <DOB>1957-03-11</DOB>
   </Person>
</Root>
```

在本例中，``元素定义了一个默认名称空间，该名称空间应用于子元素和属性。

注意:XML模式属性`elementFormDefault`属性和`attributeFormDefault`属性控制在给定的模式中元素和属性是否被限定。

在InterSystems IRIS XML支持中，使用类参数来指定元素是否限定。

### schema

一种为一组XML文档指定元信息的文档，可作为DTD的替代。

与DTD一样，可以使用模式来验证特定XML文档的内容。

对于某些应用程序，XML模式提供了与`dtd`相比的几个优势，包括:

- XML模式是有效的XML文档，因此更容易开发操作模式的工具。
- XML模式可以指定一组更丰富的特性，并包含值的类型信息。

形式上，模式文档是符合W3 XML模式规范的XML文档(在`https://www.w3.org/XML/Schema`)。

它遵守XML规则，并使用一些额外的语法。

通常，文件的扩展名是`.xsd`。

### style sheet

用XSLT编写的文档，描述如何将给定的XML文档转换为另一个XML或其他“人类可读”的文档。

### text node

包含在开始元素和相应结束元素之间的一个或多个字符。

例如:

```java
<SampleElement>
sample text node
</SampleElement>
```

### type

对数据解释的限制。

在XML模式中，每个元素和属性的定义对应于一个类型。

类型可以是简单的，也可以是复杂的。

每个属性都有一个简单类型。

简单类型还表示没有属性和子元素(只有文本节点)的元素。

复杂类型表示其他元素。

下面的模式片段展示了一些类型定义:

```java
<s:complexType name="Person">
    <s:sequence>
        <s:element name="Name" type="s:string" minOccurs="0" />
        <s:element name="DOB" type="s:date" minOccurs="0" />
        <s:element name="Address" type="s_Address" minOccurs="0" />
    </s:sequence>
    <s:attribute name="GroupID" type="s:string" />
</s:complexType>
<s:complexType name="s_Address">
    <s:sequence>
        <s:element name="City" type="s:string" minOccurs="0" />
        <s:element name="Zip" type="s:string" minOccurs="0" />
    </s:sequence>
</s:complexType>
```

### unqualified

如果没有显式地将元素或属性分配给名称空间，则该元素或属性是非限定的。

### well-formed XML

遵循XML规则的XML文档或片段，例如有一个结束标记来匹配一个开始标记。

### XML declaration

指示给定文档中使用的XML版本(以及可选的字符集)的语句。

如果包含，它必须是文档中的第一行。

一个例子:

```java
<?xml version="1.0" encoding="UTF-8"?>
```

### XPath

XPath (XML路径语言)是一种基于XML的表达式语言，用于从XML文档中获取数据。

结果可以是标量，也可以是原始文档的XML子树。

### XSLT

XSLT(可扩展样式表语言转换)是一种基于XML的语言，用于描述如何将给定的XML文档转换为另一个XML或其他“人类可读的”文档。
