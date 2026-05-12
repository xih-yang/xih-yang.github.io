# 13、XML 教程 - 将XML文档表示为DOM
- 来源：https://ddkk.com/zhuanlan/xml/2/13.html
- 分类：XML语言教程
- 分组：教程目录
`%XML.Document`类和`%XML.Node`类使可以将任意XML文档表示为DOM(文档对象模型)。然后，可以导航此对象并对其进行修改。还可以创建一个新的DOM并将其添加到其中。

**注意：使用的任何XML文档的XML声明都应该指明该文档的字符编码，并且文档应该按照声明的方式进行编码。如果未声明字符编码，InterSystems IRIS将使用本书前面的“输入和输出的字符编码”中描述的默认值。如果这些默认值不正确，请修改XML声明，使其指定实际使用的字符集。**

## 将XML文档作为DOM打开

要打开现有XML文档以用作DOM，请执行以下操作：

**1、** 创建`%XML.Reader`的实例；

**2、** 也可以指定此实例的`Format`属性，以指定要导入的文件的格式；

**默认情况下， IRIS假定XML文件为文字格式。如果文件是SOAP编码格式，则必须指明这一点，以便可以正确读取该文件。**

除非使用`Correlate()`和`Next()`，否则此属性无效。

**1、** 请使用`%XML.Reader`的以下方法之一；

- OpenFile() — 打开一个文件。
- OpenStream() —打开一个流。
- OpenString() — 打开字符串。
- OpenURL() — 打开URL。

在每种情况下，都可以选择为该方法指定第二个参数，以重写`Format`属性的值。

**1、** 访问`Document`属性，它是一个DOM此属性是`%XML.Document`实例，它提供了可用于查找有关整个文档的信息的方法例如，`CountNamespace()`返回DOM使用的名称空间总数；

或者，如果流包含XML文档，调用`%XML.Document`的`GetDocumentFromStream()`方法。返回`%XML.Document`的实例。

### 示例1：将文件转换为DOM

例如，下面的方法读取一个XML文件，并在表示该文档的返回`%XML.Document`的一个实例：

```java
ClassMethod GetXMLDocFromFile(file) As %XML.Document
{
	s reader =class(%XML.Reader).%New()
	s status = reader.OpenFile(file)
	if $$$ISERR(status) {
     d $System.Status.DisplayError(status) q $$$NULLOREF}
	s document = reader.Document
	q document
}
```

### 示例2：将对象转换为DOM

以下方法接受`OREF`，并在表示该对象中返回`%XML.Document`的实例。该方法假定`OREF`是启用XML的类的实例：

```java
ClassMethod GetXMLDoc(object) As %XML.Document
{
	//确保这是启用XML的类的实例
	if '$IsObject(object){
		w "参数不是对象"
		q $$$NULLOREF
	}
	s classname = $CLASSNAME(object)
	s isxml = $CLASSMETHOD(classname,"%Extends","%XML.Adaptor")
	if 'isxml {
		w "参数不是启用XML的类的实例"
		q $$$NULLOREF
	}
	//步骤1-将对象作为XML写入流
	s writer =class(%XML.Writer).%New()
	s stream =class(%GlobalCharacterStream).%New()
	s status = writer.OutputToStream(stream)
	if $$$ISERR(status) {
     d $System.Status.DisplayError(status) q $$$NULLOREF}
	s status = writer.RootObject(object)
	if $$$ISERR(status) {
     d $System.Status.DisplayError(status) q $$$NULLOREF}
	//步骤2-从流中提取%XML.Document
	s status =class(%XML.Document).GetDocumentFromStream(stream,.document)
	if $$$ISERR(status) {
     d $System.Status.DisplayError(status) q $$$NULLOREF}
	quit document
}
```

## 获取DOM的名称空间

当IRIS读取XML文档并创建DOM时，它会标识文档中使用的所有名称空间，并为每个名称空间分配一个索引号。

在`%XML.Document`实例提供了以下方法，可以使用这些方法查找有关文档中命名空间的信息：

#### CountNamespace()

返回文档中的命名空间数。

#### FindNamespace()

返回与给定命名空间对应的索引。

#### GetNamespace()

返回给定索引的XML命名空间URI。

下面的示例方法显示一个报表，其中显示文档中使用的命名空间：

```java
ClassMethod ShowNamespaces(doc As %XML.Document)
{
	s count = doc.CountNamespace()
	w !, "文档中的命名空间数: "_count
	for i = 1 : 1 : count {
		w !, "Namespace "_i_" is "_doc.GetNamespace(i)
	}
}
```

## 导航DOM的节点

要访问文档的节点，可以使用两种不同的技术：

- 使用%XML.Document实例的GetNode()方法。此方法接受一个整数，它指示从1开始的节点号。
- 调用%XML.Document实例的GetDocumentElement()方法。

此方法返回`%XML.Node`的实例，提供用于访问有关根节点的信息以及移动到其他节点的属性和方法。以下小节提供了有关使用`%XML.Node`的详细信息。

### 移动到子节点或同级节点

要移动到子节点或同级节点，请使用`%XML.Node`实例的以下方法。：

- MoveToFirstChild()
- MoveToLastChild()
- MoveToNextSibling()
- MoveToPreviousSibling()

这些方法中的每一个都移动到另一个节点(如方法名称所示)。如果是，则该方法返回TRUE。如果不是，则返回False，焦点与调用该方法之前相同。

这些方法中的每一个都有一个可选参数`skipWhitespace`。如果此参数为真，则该方法将忽略任何空格。`SkipWhitespace`的默认值为false。

### 移动到父节点

要移动到当前节点的父节点，请使用`%XML.Node`实例的`MoveToParent()`方法。

此方法接受一个可选参数`restrictDocumentNode`。如果此参数为真，则该方法不会移动到文档节点(根)。`restrictDocumentNode`的默认值为False。

### 移动到特定节点

要移动到特定节点，可以设置`%XML.Node`实例的`NodeId`属性。例如：

```java
   set saveNode = node.NodeId
   //..... lots of processing
   //... 
   // restore position
   set node.NodeId=saveNode
```

### 使用id属性

在某些情况下，XML文档可能包括名为`id`的属性，该属性用于标识文档中的不同节点。例如：

```java
<?xml version="1.0"?>
<team>
<member id="alpha">Jack O'Neill</member>
<member id="beta">Samantha Carter</member>
<member id="gamma">Daniel Jackson</member>
</team>
```

如果(如本例所示)文档使用名为`id`的属性，则可以使用它导航到该节点。为此，可以使用文档的`GetNodeById()`方法，该方法返回`%XML.Node`的一个实例。(请注意，与大多数其他导航方法不同，此方法可从`%XML.Document`，而不是`%XML.Node`。)
