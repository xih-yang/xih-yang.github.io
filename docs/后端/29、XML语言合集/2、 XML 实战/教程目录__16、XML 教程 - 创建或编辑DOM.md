# 16、XML 教程 - 创建或编辑DOM
- 来源：https://ddkk.com/zhuanlan/xml/2/16.html
- 分类：XML语言教程
- 分组：教程目录
## 创建或编辑DOM

要创建`DOM`或修改现有`DOM`，请使用`%XML.Document`的以下方法在：

#### CreateDocument()

```java
classmethod CreateDocument(localName As %String, 
                           namespace As %String) 
                           as %XML.Document 
```

在仅包含根元素的返回`%XML.Document`新实例。

#### AppendCharacter()

```java
method AppendCharacter(text As %String)
```

将新的字符数据节点追加到此元素节点的子节点列表中。当前节点指针不变；此节点仍然是追加的子节点的父节点。

#### AppendChild()

```java
method AppendChild(type As %String)
```

将新节点追加到此节点的子节点列表中。当前节点指针不变；此节点仍然是追加的子节点的父节点。

#### AppendElement()

```java
method AppendElement(localName As %String, 
                     namespace As %String, 
                     text As %String)
```

将新元素节点追加到此节点的子节点列表中。如果指定了文本参数，则字符数据将添加为新元素的子元素。当前节点指针不变；此节点仍然是追加的子节点的父节点。

#### AppendNode()

```java
method AppendNode(sourceNode As %XML.Node) as %Status
```

将指定节点的副本追加为此节点的子节点。要复制的节点可以来自任何文档。当前节点指针不变。此节点仍然是追加的子节点的父节点。

#### AppendTree()

```java
method AppendTree(sourceNode As %XML.Node) as %Status
```

将指定节点的副本(包括其所有子节点)追加为此节点的子节点。要复制的树可以来自任何文档，但此节点不能是源节点的后代。当前节点指针不变。此节点仍然是追加的子节点的父节点。

#### InsertNamespace()

```java
method InsertNamespace(namespace As %String)
```

将给定的命名空间`URI`添加到文档。

#### InsertCharacter()

```java
method InsertCharacter(text as %String, ByRef child As %String, Output sc As %Status) as %String
```

插入一个新的字符数据节点作为此节点的子节点。新字符数据恰好插入在指定的子节点之前。子参数是子节点的节点ID；它通过引用传递，以便可以在插入后进行更新。返回插入节点的nodeId。当前节点指针不变。

#### InsertNode()

```java
method InsertNode(sourceNode As %XML.Node, ByRef child As %String, Output sc As %Status) as %String
```

插入指定节点的副本作为此节点的子节点。要复制的节点可以来自任何文档。新节点恰好插入在指定的子节点之前。子参数是子节点的节点ID；它通过引用传递，以便可以在插入后进行更新。返回插入节点的nodeId。当前节点指针不变。

#### InsertTree()

```java
method InsertTree(sourceNode As %XML.Node, ByRef child As %String, Output sc As %Status) as %String
```

插入指定节点的副本(包括其子节点)作为此节点的子节点。要复制的树可以来自任何文档，但此节点不能是源节点的后代。新节点恰好插入在指定的子节点之前。子参数是子节点的节点ID；它通过引用传递，以便可以在插入后进行更新。返回插入节点的nodeId。当前节点指针不变。

#### Remove()

```java
method Remove()
```

移除当前节点并使其父节点成为当前节点。

#### RemoveAttribute()

```java
method RemoveAttribute(attributeName As %String)
```

删除给定的属性。

#### RemoveAttributeNS()

```java
method RemoveAttributeNS(attributeName As %String, 
                         namespace As %String)
```

移除给定属性，其中属性名称和命名空间指定感兴趣的属性。

#### ReplaceNode()

```java
method ReplaceNode(sourceNode As %XML.Node) as %Status
```

用指定节点的副本替换该节点。要复制的节点可以来自任何文档。当前节点指针不变。

#### ReplaceTree()

```java
method ReplaceTree(sourceNode As %XML.Node) as %Status
```

将该节点替换为指定节点的副本，包括其所有子节点。要复制的树可以来自任何文档，但不能是源节点的后代。当前节点指针不变。

#### SetAttribute()

```java
method SetAttribute(attributeName As %String, 
                    namespace As %String = "", 
                    value As %String = "", 
                    valueNamespace As %String = "")
```

设置当前元素的属性的数据。这里：

- attributeName 是属性的名称。
- namespace 是来自此元素的属性AttributeName的QName的命名空间URI。
- value 是属性值。
- valueNamespace 当属性值为“prefix:value”形式时，valueNamespace是前缀对应的命名空间URI。

## 从DOM编写XML输出

可以序列化`DOM`或`DOM`的节点并生成XML输出。要执行此操作，请使用`%XML.Writer`的以下方法。

### Document()

```java
method Document(document As %XML.Document) as %Status
```

如果给定%XML.Document实例，此方法会将文档写入当前指定的输出目标。

### DocumentNode()

```java
method DocumentNode(document As %XML.Node) as %Status
```

给定`%XML.Node`，此方法将该节点写入当前指定的输出目标。

### Tree()

```java
method Tree(node As %XML.Node) as %Status
```

给定`%XML.Node`实例，此方法将节点及其子代树写入当前指定的输出目标。
