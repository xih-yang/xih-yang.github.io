# 05、XML 教程 - 生成XML元素
- 来源：https://ddkk.com/zhuanlan/xml/2/5.html
- 分类：XML语言教程
- 分组：教程目录
## 生成XML元素

如果使用`RootElement()`启动文档的根元素，则负责生成该根元素内的每个元素。有三个选择：

### 将对象生成为元素

可以从InterSystems IRIS对象生成输出作为元素。在本例中，使用`object()`方法，该方法写入支持XML的对象。输出包括该对象中包含的所有对象引用。可以指定此元素的名称，也可以使用在对象中定义的默认值。

只能在`RootElement()`和`EndRootElement()`方法之间使用`object()`方法。

此示例为给定启用XML的类的所有已保存实例生成输出：

```java
/// desc：将表里数据输出本地文件里
/// wclass(PHA.TEST.Xml).WriteAll("Sample.Person")
ClassMethod WriteTableAllToXml(cls As %String = "", directory As %String = "E:\temp\")
{
    if '##class(%Dictionary.CompiledClass).%ExistsId(cls) {
        Write !, "类不存在或未编译"
        Quit 
    }
    s check=$classmethod(cls, "%Extends", "%XML.Adaptor")
    If 'check {
        Write !, "类不扩展%XML.Adaptor"
        Quit 
    }
    s filename = directory_"Person"_".xml"
    s writer =class(%XML.Writer).%New()
    s writer.Indent=1
    s status = writer.OutputToFile(filename)
    if $$$ISERR(status) {
      do $System.Status.DisplayError(status) quit  }
    s status=writer.RootElement("SampleOutput")
    if $$$ISERR(status) {
      do $System.Status.DisplayError(status) quit  }
    //获取给定类范围内对象的ID
    s stmt =class(%SQL.Statement).%New()
    s status = stmt.%PrepareClassQuery(cls,"Extent")
    if $$$ISERR(status) {
      do $System.Status.DisplayError(status) quit  }
    s rset = stmt.%Execute()
    while (rset.%Next()) {
        //对于每个ID，写入该对象
        set objid = rset.%Get("ID")
        set obj = $CLASSMETHOD(cls,"%OpenId",objid)
        set status = writer.Object(obj)
        if $$$ISERR(status) {
     Do $System.Status.DisplayError(status) Quit}}
    d writer.EndRootElement()
    d writer.EndDocument()
    q ""
}
```

此方法的输出包含给定类的所有已保存对象，这些对象嵌套在根元素中。对于`Sample.Person`，输出如下：

```java
<?xml version="1.0" encoding="UTF-8"?>
<SampleOutput>
  <Person>
    <Name>Tillem,Robert Y.</Name>
    <SSN>967-54-9687</SSN>
    <DOB>1961-11-27</DOB>
    <Home>
      <Street>3355 First Court</Street>
      <City>Reston</City>
      <State>WY</State>
      <Zip>11090</Zip>
    </Home>
    <Office>
      <Street>4922 Main Drive</Street>
      <City>Newton</City>
      <State>NM</State>
      <Zip>98073</Zip>
    </Office>
    <FavoriteColors>
      <FavoriteColorsItem>Red</FavoriteColorsItem>
    </FavoriteColors>
    <Age>47</Age>
  </Person>
  <Person>
    <Name>Waters,Ed X.</Name>
    <SSN>361-66-2801</SSN>
    <DOB>1957-05-29</DOB>
    <Home>
      <Street>5947 Madison Drive</Street>
...
</SampleOutput>
```

### 手动构建元素

以手动构造XML元素。在本例中，使用`element()`方法，该方法使用提供的名称写入元素的开始标记。然后，可以编写内容、属性和子元素。使用`EndElement()`方法指示元素的结束。

相关方法如下：

#### Element()

```java
method Element(tag, namespace As %String) as %Status
```

写入开始标记。可以为元素提供命名空间，只有在启用了XML的类没有`Namespace`参数的值时才会应用该命名空间。

#### WriteAttribute()

```java
method WriteAttribute(name As %String, 
                      value As %String  = "", 
                      namespace As %String, 
                      valueNamespace As %String  = "", 
                      global As %Boolean  = 0) as %Status
```

写入属性。必须指定属性名称和值。参数命名空间是属性名称的命名空间。参数`valueNamespace`是属性值的名称空间；当值在XML模式名称空间中定义时使用。

对于GLOBAL，如果属性在关联的XML架构中是全局的，因此应该有前缀，请指定TRUE。

如果使用此方法，则必须在`Element()`(或`RootElement()`)之后直接使用它。

#### WriteChars()

```java
method WriteChars(text) as %Status
```

写入字符串，执行使该字符串适合作为元素内容所需的任何必要转义。参数必须`%String`类型或`%CharacterStream`类型。

#### WriteCData()

```java
method WriteCData(text) as %Status
```

参数必须`%String`类型或`%CharacterStream`类型。

#### WriteBase64()

```java
method WriteBase64(binary) as %Status
```

将指定的二进制字节编码为`base-64`，并将结果文本写入元素的内容。该参数的类型必须为`%Binary`或`%BinaryStream`。

#### WriteBinHex()

```java
method WriteBinHex(binary) as %Status
```

将指定的二进制字节编码为二进制，并将结果文本写入元素的内容。该参数的类型必须为`%Binary`或`%BinaryStream`。

#### EndElement()

```java
method EndElement() as %Status
```

结束可以与其匹配的元素。

只能在`RootElement()`和`EndRootElement()`方法之间使用这些方法。

注意：这里描述的方法旨在使能够向XML文档编写特定的逻辑片段，但在某些情况下，可能需要更多的控制。`%XML.Writer`类提供了一个附加方法`write()`，可以使用该方法编写任意字符串。有责任确保结果是格式良好的XML文档；不提供任何验证。

示例

下面是一个示例例程：

```java
/// wclass(Demo.XmlDemo).WriteObjXml()
ClassMethod WriteObjXml()
{
	set writer=##class(%XML.Writer).%New()
	set writer.Indent=1
	set status=writer.OutputToDevice()
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.StartDocument()
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.RootElement("root")
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.Element("SampleElement")
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.WriteAttribute("Attribute","12345")
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.Element("subelement")
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.WriteChars("yao")
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.EndElement()
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.Element("subelement")
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.WriteChars("xin")
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.EndElement()
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.EndElement()
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.EndRootElement()
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	set status=writer.EndDocument()
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit}
	q ""
}
```

```java
DHC-APP>wclass(Demo.XmlDemo).WriteObjXml()
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <SampleElement Attribute="12345">
    <subelement>yao</subelement>
    <subelement>xin</subelement>
  </SampleElement>
</root>
```

#### 使用%XMLL.Element

在前一节中，我们使用了Element()并指定了要生成的元素；我们还可以指定名称空间。在某些情况下，类中使用%XML.Element的实例，而不是使用元素名称。此类具有以下属性：

- Local属性指定此元素是否为其父元素的本地元素，这会影响命名空间的控制。
- Namespace属性指定此元素的命名空间。
- Tagname属性指定此元素的名称。

这里还可以使用前面描述的WriteAttribute()方法。
