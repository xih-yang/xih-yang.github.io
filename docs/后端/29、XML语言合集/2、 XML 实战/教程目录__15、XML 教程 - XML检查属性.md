# 15、XML 教程 - XML检查属性
- 来源：https://ddkk.com/zhuanlan/xml/2/15.html
- 分类：XML语言教程
- 分组：教程目录
## 检查属性的基本方法

可以使用`%XML.Node`的以下方法。以检查当前节点的属性。

- AttributeDefined() 如果当前元素具有具有给定名称的属性，则返回非零(TRUE)。
- FirstAttributeName() 返回当前元素的第一个属性的属性名称。
- GetAttributeValue() 返回给定属性的值。如果元素没有该属性，则该方法返回NULL。
- GetNumberAttributes() 返回当前元素的属性数。
- LastAttributeName() 返回当前元素的最后一个属性的属性名称。
- NextAttributeName() 在给定属性名称的情况下，无论指定的属性是否有效，此方法都会按排序顺序返回下一个属性的名称。
- PreviousAttributeName() 在给定属性名称的情况下，无论指定的属性是否有效，此方法都会按排序顺序返回上一个属性的名称。

下面的示例遍历给定节点中的属性并编写一个简单报表：

```java
/// dclass(Demo.XmlDemo).ShowAttributes("<?xml version='1.0'?><staff attr1='first' attr2='second' attr3='third' attr4='fourth' attr5='fifth'><doc><name>David Marston</name></doc></staff>")
/// <?xml version="1.0"?><staff attr1="first" attr2="second" attr3="third" attr4="fourth" attr5="fifth"><doc><name>David Marston</name></doc></staff>
ClassMethod ShowAttributes(string)
{
	set reader=##class(%XML.Reader).%New()
	set status=reader.OpenString(string)
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status)}
	s node = reader.Document.GetDocumentElement()
	b
	s count = node.GetNumberAttributes()
	w !, "属性数量: ", count
	s first = node.FirstAttributeName()
	w !, "第一个属性是: ", first
	w !, "   值是: ",node.GetAttributeValue(first)
	s next = node.NextAttributeName(first)
	for i = 1 : 1 : count - 2 {
		w !, "下一个属性是: ", next
		w !, "   值是: ",node.GetAttributeValue(next)
		s next = node.NextAttributeName(next)
	}
	s last = node.LastAttributeName()
	w !, "最后一个属性是: ", last
	w !, "   值是: ",node.GetAttributeValue(last)
}
```

示例XML文档：

```java
<?xml version="1.0"?>
<staff attr1="first" attr2="second" attr3="third" attr4="fourth" attr5="fifth">
  <doc>
    <name>David Marston</name>
  </doc>
</staff>
```

如果将此文档的第一个节点传递给示例方法，则会看到以下输出：

```java
Number of attributes: 5
First attribute is: attr1
   Its value is: first
Next attribute is: attr2
   Its value is: second
Next attribute is: attr3
   Its value is: third
Next attribute is: attr4
   Its value is: fourth
Last attribute is: attr5
   Its value is: fifth
```

## 检查属性的其他方法

本节讨论可用于获取任何属性的名称、值、命名空间、`QName`和值命名空间的方法。这些方法分为以下几组：

- 仅使用属性名称的方法
- 使用属性名称和命名空间的方法

注意：在XML标准中，一个元素可以包含多个同名的属性，每个属性位于不同的名称空间中。但是，在InterSystems IRIS XML中，这是不受支持的。

### 仅使用属性名称的方法

使用以下方法获取有关属性的信息。

#### GetAttribute()

```java
method GetAttribute(attributeName As %String, 
                    ByRef namespace As %String, 
                    ByRef value As %String, 
                    ByRef valueNamespace As %String)
```

返回给定属性的数据。此方法通过引用返回下列值：

- Namespace是来自属性QName的命名空间URI
- value 是属性值。
- valueNamespace 值所属的命名空间URI。例如，以下属性：

```java
xsi:type="s:string"
```

此属性的值为字符串，并且此值位于使用前缀s在其他位置声明的命名空间中。假设本文档的较早部分包含以下命名空间声明：

```java
xmlns:s="http://www.w3.org/2001/XMLSchema" 
```

在本例中，`valueNamespace`将为`“http://www.w3.org/2001/XMLSchema”`.

#### GetAttributeNamespace()

```java
method GetAttributeNamespace(attributeName As %String) as %String
```

从当前元素的名为`AttributeName`的属性的`QName`返回命名空间URI。

#### GetAttributeQName()

```java
method GetAttributeQName(attributeName As %String) as %String
```

返回给定属性的`QName`。

#### GetAttributeValue()

```java
method GetAttributeValue(attributeName As %String) as %String
```

返回给定属性的值。

#### GetAttributeValueNamespace()

```java
method GetAttributeValueNamespace(attributeName As %String) as %String
```

返回给定属性的值的命名空间。

### 使用属性名和命名空间的方法

要同时使用属性名称及其命名空间来获取有关属性的信息，请使用以下方法：

#### GetAttributeNS()

```java
method GetAttributeNS(attributeName As %String, 
                      namespace As %String, 
                      ByRef value As %String, 
                      ByRef valueNamespace As %String)
```

返回给定属性的数据，其中`AttributeName`和`Namespace`指定感兴趣的属性。此方法通过引用返回以下数据：

- value 是属性值。
- valueNamespace 值所属的命名空间URI。例如，以下属性：

```java
xsi:type="s:string"
```

此属性的值为字符串，并且此值位于使用前缀s在其他位置声明的命名空间中。假设本文档的较早部分包含以下命名空间声明：

```java
xmlns:s="http://www.w3.org/2001/XMLSchema" 
```

#### GetAttributeQNameNS()

```java
method GetAttributeQNameNS(attributeName As %String, 
                           namespace As %String)
                           as %String
```

返回给定属性的`QName`，其中`AttributeName`和`Namespace`指定感兴趣的属性。

#### GetAttributeValueNS()

```java
method GetAttributeValueNS(attributeName As %String, 
                           namespace As %String) 
                           as %String
```

返回给定属性的值，其中`AttributeName`和`Namespace`指定感兴趣的属性。

#### GetAttributeValueNamespaceNS

```java
method GetAttributeValueNamespaceNS(attributeName As %String, 
                                    namespace As %String) 
                                    as %String
```

返回给定属性的值的命名空间，其中`AttributeName`和`Namespace`指定感兴趣的属性。
