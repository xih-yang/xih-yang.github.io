# 14、XML 教程 - XML获取当前节点信息
- 来源：https://ddkk.com/zhuanlan/xml/2/14.html
- 分类：XML语言教程
- 分组：教程目录
## DOM节点类型

`%XML.Document`和`%XML.Node`类识别以下`DOM`节点类型：

- Element (`$``$``$`xmlELEMENTNODE)

请注意，这些宏在%xml.DOM.inc包含文件中定义。

- Text (`$``$``$`xmlTEXTNODE)
- Whitespace (`$``$``$`xmlWHITESPACENODE).

其他类型的`DOM`节点被简单地忽略。

请以下XML文档：

```java
<?xml version="1.0"?>
<team>
<member id="alpha">Jack O'Neill</member>
<member id="beta">Samantha Carter</member>
<member id="gamma">Daniel Jackson</member>
</team>
```

当作为DOM查看时，该文档由以下节点组成：

文档节点示例

NodeID
NodeType
LocalName
Notes

0,29
$$$xmlELEMENTNODE
team

1,29
$$$xmlWHITESPACENODE

该节点是节点的子节点

1,23
$$$xmlELEMENTNODE
member
该节点是节点的子节点

2,45
$$$xmlTEXTNODE
Jack O’Neill
该节点是第一个节点的子节点

1,37
$$$xmlWHITESPACENODE

该节点是节点的子节点

1,41
$$$xmlELEMENTNODE
member
该节点是节点的子节点

3,45
$$$xmlTEXTNODE
Samantha Carter
该节点是第二个节点的子节点

1,45
$$$xmlWHITESPACENODE

该节点是节点的子节点

1,49
$$$xmlELEMENTNODE
member
该节点是节点的子节点

4,45
$$$xmlTEXTNODE
Daniel Jackson
该节点是第三个节点的子节点

1,53
$$$xmlWHITESPACENODE

该节点是节点的子节点

## 获取当前节点信息

`%XML.Node`的以下字符串属性。提供关于当前节点的信息。

在所有情况下，如果没有当前节点，将抛出一个错误。

#### LocalName

当前元素节点的本地名称。如果访问其他类型节点的此属性，则会引发错误。

#### Namespace

当前元素节点的命名空间URI。如果尝试访问其他类型节点的此属性，则会引发错误。

#### NamespaceIndex

当前元素节点的命名空间的索引。

当InterSystems IRIS读取XML文档并创建DOM时，它会标识文档中使用的所有名称空间，并为每个名称空间分配一个索引号。

如果尝试访问其他类型节点的此属性，则会引发错误。

#### Nil

如果`xsi：nil`或`xsi：null`为true，则等于true；如果此元素节点为1，则等于1。否则，此属性等于`False`。

#### NodeData

字符节点的值。

#### NodeId

当前节点ID。

可以设置此属性以导航到另一个节点。

#### NodeType

当前节点的类型，如前一节所述。

#### QName

元素节点的Q名称。仅当前缀对文档有效时才用于输出为XML。

以下方法提供有关当前节点的其他信息：

#### GetText()

```java
method GetText(ByRef text) as %Boolean
```

获取元素节点的文本内容。如果返回文本，则此方法返回TRUE；在本例中，实际文本被追加到第一个参数后，该参数通过引用返回。

#### HasChildNodes()

```java
method HasChildNodes(skipWhitespace As %Boolean = 0) as %Boolean
```

如果当前节点有子节点，则返回True；否则返回False。

#### GetNumberAttributes()

```java
method GetNumberAttributes() as %Integer
```

方法`GetNumberAttributes()`为`%Integer`

### 示例

下面的示例方法编写一个报告，提供有关当前节点的信息：

```java
ClassMethod ShowNode(node As %XML.Node)
{
	w !,"LocalName=" _ node.LocalName
	if node.NodeType=$$$xmlELEMENTNODE  {
		w !,"Namespace=" _ node.Namespace
	}
	if node.NodeType = $$$xmlELEMENTNODE {
		w !,"NamespaceIndex=" _ node.NamespaceIndex
	}
	w !,"Nil=" _ node.Nil
	w !,"NodeData=" _ node.NodeData
	w !,"NodeId=" _ node.NodeId
	w !,"NodeType=" _ node.NodeType
	w !,"QName=" _ node.QName
	w !,"HasChildNodes returns " _ node.HasChildNodes()
	w !,"GetNumberAttributes returns " _ node.GetNumberAttributes()
	s status = node.GetText(.text)
	if status {
		w !, "该节点的文本为 "_text
	} else {
		w !, "GetText不返回文本"
	}
}
```

示例输出可能如下所示：

```java
LocalName=update
Namespace=
NamespaceIndex=
Nil=0
NodeData=update
NodeId=0,29
NodeType=0
QName=update
HasChildNodes returns 1
GetNumberAttributes returns 0
GetText不返回文本
文档中的命名空间数: 1
Namespace 1 is http://www.w3.org/2001/XMLSchema-instance
DHC-APP>
```
