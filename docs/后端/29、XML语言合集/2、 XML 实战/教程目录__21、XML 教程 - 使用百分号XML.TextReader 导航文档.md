# 21、XML 教程 - 使用%XML.TextReader 导航文档
- 来源：https://ddkk.com/zhuanlan/xml/2/21.html
- 分类：XML语言教程
- 分组：教程目录
## 导航文档

要在文档中导航，请使用文本阅读器的以下方法：`Read()`、`ReadStartElement()`、`MoveToAttributeIndex()`、`MoveToAttributeName()`、`MoveToElement()`、`MoveToContent()`和`Rewind()`。

### 导航到下一个节点

要移动到文档中的下一个节点，请使用`read()`方法。`Read()`方法返回TRUE值，直到没有更多节点可读为止(即，直到到达文档末尾)。前面的示例在如下所示的循环中使用了此方法：

```java
 While (textreader.Read()) {
...
 }
```

### 导航到特定元素的第一个匹配项

可以移动到文档中特定元素的第一个匹配项。为此，请使用`ReadStartElement()`方法。除非找不到元素，否则此方法返回TRUE。如果未找到该元素，则该方法到达文件末尾。

`ReadStartElement()`方法有两个参数：元素的名称和命名空间URI(可选)。请注意，类中的`%XML.TextReader`不会对命名空间前缀进行任何处理。因此，`ReadStartElement()`方法将以下两个元素视为具有不同的名称：

```java
<Person>Smith,Ellen W. xmlns="http://www.person.org"</Person>
<s01:Person>Smith,Ellen W. xmlns:s01="http://www.person.org"</s01:Person>
```

### 导航到属性

导航到元素时，如果该元素具有属性，则可以通过以下两种方式之一导航到这些属性：

- 使用MoveToAttributeIndex()方法按索引(属性在元素中的序号位置)移动到特定属性。此方法只有一个参数：属性的索引号。请注意，可以使用AttributeCount属性来了解给定元素有多少个属性.
- 使用MoveToAttributeName()方法按名称移动到特定属性。此方法有两个参数：属性名称和命名空间URI(可选)。请注意，类中的%XML.TextReader不对命名空间前缀进行任何处理；如果属性有前缀，则该前缀被视为属性名称的一部分。

完成当前元素的属性后，可以通过调用其中一个导航方法(如`Read()`)移动到文档中的下一个元素。或者，可以调用`MoveToElement()`方法返回到包含当前属性的元素。

例如，下面的代码按索引号列出当前节点的所有属性：

```java
 If (textreader.NodeType = "element") {
     // list attributes for this node
     For a = 1:1:textreader.AttributeCount {
         Do textreader.MoveToAttributeIndex(a)
         Write textreader.LocalName," = ",textreader.Value,!
     }
 }
```

下面的代码查找当前节点的颜色属性的值：

```java
 If (textreader.NodeType = "element") {
     // find color attribute for this node
     If (textreader.MoveToAttributeName("color")) {
         Write "color = ",textreader.Value,!
     }
 }
```

### 导航到包含内容的下一个节点

`MoveToContent()`方法帮助查找内容。具体地说，就是：

- 如果节点不是“chars”类型，此方法将前进到“chars”类型的下一个节点。
- 如果节点是“chars”类型，则此方法不会在文件中前进。

### Rewinding

这里描述的所有方法都在文档中前进，但`Rewind()`方法除外，它导航到文档的开头并重置所有属性。

## 执行验证

默认情况下，源文档根据提供的任何DTD或架构文档进行验证。如果文档包含DTD节，则文档将根据该DTD进行验证。要针对模式文档进行验证，请在`ParseFile()`、`ParseStream()`、`ParseString()`或`ParseURL()`的参数列表中指定模式，如“Parse方法的参数列表”中所述。

大多数类型的验证问题都不是致命的，会导致错误或警告。具体地说，类型为`“Error”`或`“Warning”`的节点会自动添加到文档树中发生错误的位置。可以使用与任何其他类型的节点相同的方式导航并检查这些节点。

例如，以下XML文档：

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE Root [
  <!ELEMENT Root (Person)>
  <!ELEMENT Person (#PCDATA)>
]>
<Root>
   <Person>Smith,Joe C.</Person>
</Root>
```

在这种情况下，我们预计不会出现任何验证错误。回想一下本章前面所示的示例方法`WriteNodes()`。如果我们使用该方法阅读本文档，则输出将如下所示:

```java
Node 1 is a(n) element named: Root
    and has no value
Node 2 is a(n) ignorablewhitespace and has no name
    with value:
Node 3 is a(n) element named: Person
    and has no value
Node 4 is a(n) chars and has no name
    with value: Smith,Joe C.
Node 5 is a(n) endelement named: Person
    and has no value
Node 6 is a(n) ignorablewhitespace and has no name
    with value:
Node 7 is a(n) endelement named: Root
    and has no value
```

相反,文件如下所示：

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE Root [
  <!ELEMENT Root (Person)>
  <!ELEMENT Person (#PCDATA)>
]>
<Root>
   <Employee>Smith,Joe C.</Employee>
</Root>
```

在本例中，我们预计会出现错误，因为``元素没有在DTD部分中声明。在这里，如果我们使用示例方法`WriteNodes()`来读取该文档，则输出将如下所示：

```java
Node 1 is a(n) element named: Root
    and has no value
Node 2 is a(n) ignorablewhitespace and has no name
    with value:
Node 3 is a(n) error and has no name
    with value: Unknown element 'Employee' 
while processing c:/TextReader/docwdtd2.txt at line 7 offset 14
Node 4 is a(n) element named: Employee
    and has no value
Node 5 is a(n) chars and has no name
    with value: Smith,Joe C.
Node 6 is a(n) endelement named: Employee
    and has no value
Node 7 is a(n) ignorablewhitespace and has no name
    with value:
Node 8 is a(n) error and has no name
    with value: Element 'Employee' is not valid for content model: '(Person)' 
while processing c:/TextReader/docwdtd2.txt at line 8 offset 8
Node 9 is a(n) endelement named: Root
    and has no value
```

## 示例：命名空间报告

下面的示例方法读取任意XML文件，并指示每个元素和属性所属的命名空间：

```java
ClassMethod ShowNamespacesInFile(filename As %String)
{
  Set status =class(%XML.TextReader).ParseFile(filename,.textreader)
  //check status
  If $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
  //iterate through document, node by node
  While textreader.Read()
  {
    If (textreader.NodeType = "element")
    {
       Write !,"The element ",textreader.LocalName
       Write " is in the namespace ",textreader.NamespaceUri
       }
    If (textreader.NodeType = "attribute")
    {
       Write !,"The attribute ",textreader.LocalName
       Write " is in the namespace ",textreader.NamespaceUri
       }
     }
}
```

在终端中使用时，此方法会生成如下所示的输出：

```java
 
The element Person is in the namespace www://www.person.com
The element Name is in the namespace www://www.person.com
```

以下变体接受启用XML的对象，将其写入流，然后使用该流生成相同类型的报告：

```java
ClassMethod ShowNamespacesInObject(obj)
{
  set writer=##class(%XML.Writer).%New()
  set str=##class(%GlobalCharacterStream).%New()
  set status=writer.OutputToStream(str)
  if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit ""}
  //write to the stream
  set status=writer.RootObject(obj)
  if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit }
  Set status =class(%XML.TextReader).ParseStream(str,.textreader)
  //check status
  If $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
  //iterate through document, node by node
  While textreader.Read()
  {
    If (textreader.NodeType = "element")
    {
       Write !,"The element ",textreader.LocalName
       Write " is in the namespace ",textreader.NamespaceUri
       }
    If (textreader.NodeType = "attribute")
    {
       Write !,"The attribute ",textreader.LocalName
       Write " is in the namespace ",textreader.NamespaceUri
       }
     }
  }
```
