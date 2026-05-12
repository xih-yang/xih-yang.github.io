# 12、XML 教程 - XML其他示例
- 来源：https://ddkk.com/zhuanlan/xml/2/12.html
- 分类：XML语言教程
- 分组：教程目录
## 其他示例

### Flexible Reader类

```java
/// desc：灵活读取类
ClassMethod Read(mydir, myfile, class, element)
{
	set reader=##class(%XML.Reader).%New()
	if $extract(mydir,$length(mydir))'="/" {
     set mydir=mydir_"/"}
	set file=mydir_myfile
	set status=reader.OpenFile(file)
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status)}
	do reader.Correlate(element,class)
	while reader.Next(.object,.status)
	{
		if $$$ISERR(status) {
     do $System.Status.DisplayError(status)}
		set status=object.%Save()
		if $$$ISERR(status) {
     do $System.Status.DisplayError(status)}
	}
}
```

请注意，当读入`Person`对象时，会自动读入其相应的`Address`对象。(当保存`Person`对象时，也会自动保存相应的`Address`对象。)。这是一种相当粗糙的技术，仅适用于批量加载数据；它不会比较或更新现有数据。

为了使用此方法，需要一个支持XML的类，该类的投影与传入的XML文档匹配。有名为`MyApp.PersonWithAddress`和`MyApp.Address`的启用了XML的类。另外，假设有一个XML文档，如下所示：

```java
<?xml version="1.0" encoding="UTF-8"?>
<Root>
   <Person>
      <Name>Able, Andrew</Name>
      <DOB>1977-10-06</DOB>
      <Address>
         <Street>6218 Clinton Drive</Street>
         <City>Reston</City>
         <State>TN</State>
         <Zip>87639</Zip>
      </Address>
   </Person>
</Root>
```

要读取此文件中的对象并将其保存到磁盘，需要执行类似以下操作：

```java
 set dir="C:\XMLread-these"
 set file="PersonData.txt"
 set cls="MyApp.PersonWithAddress"
 set element="Person"
 doclass(Readers.BasicReader).Read(dir,file,cls,element)
```

### 读取字符串

下面的方法接受XML字符串、类和元素作为输入参数。它保存它读取的每个对象。

```java
ClassMethod ReadString(string, class, element)
{
   set reader=##class(%XML.Reader).%New()
   set status=reader.OpenString(string)
   if $$$ISERR(status) {
     do $System.Status.DisplayError(status)}
   do reader.Correlate(element,class)
   while reader.Next(.object,.status)
   {
      if $$$ISERR(status) {
     do $System.Status.DisplayError(status)}
      set status=object.%Save()
      if $$$ISERR(status) {
     do $System.Status.DisplayError(status)}
      }
}
```

要使用此方法，需要执行类似以下操作：

```java
 set cls="MyApp.Person"
 set element="Person"
 doclass(Readers.BasicReader).ReadString(string,cls,element)
```

```java
/// <?xml version='1.0' encoding='utf-8'?>
/// <update><version>27</version><name>Herb</name><url>http://192.168.31.124/dthealth/web/csp/Herb.apk</url></update>
/// wclass(PHA.TEST.Xml).ReadStringConfig("<?xml version='1.0' encoding='utf-8'?><update><version>27</version><name>Herb</name><url>http://192.168.31.124/dthealth/web/csp/Herb.apk</url></update>","YX.Config","update")
ClassMethod ReadStringConfig(string, class, element)
{
	set reader=##class(%XML.Reader).%New()
	set status=reader.OpenString(string)
	if $$$ISERR(status) {do $System.Status.DisplayError(status)}
	do reader.Correlate(element,class)
	b ;zw reader
	while reader.Next(.object,.status)
	{
		if $$$ISERR(status) {do $System.Status.DisplayError(status)}
		b ;zw object
		Write object.version,!
		Write object.name,!
		Write object.url,!      
		set status=object.%Save()
		if $$$ISERR(status) {do $System.Status.DisplayError(status)}
	}
	q ""
}
```

```java
DHC-APP>wclass(PHA.TEST.Xml).ReadStringConfig("<?xml version='1.0' encoding='utf-8'?><update><version>27</version><name>Herb</name><url>http://192.168.31.124/dthealth/web/csp/Herb.apk</url></update>","YX.Config","update")
 b ;zw reader
 ^
<BREAK>zReadStringConfig+5^PHA.TEST.Xml.1
DHC-APP 2e1>zw reader.Document                                                  <OBJECT REFERENCE>[2@%XML.Document]
+----------------- general information ---------------
|      oref value: 2
|      class name: %XML.Document
| reference count: 4
+----------------- attribute values ------------------
|          Childlist = ""
|        CurrentText = ""
|            DOMName = "%SAX"
|         Descriptor = ""
|              DocId = "%SAX(1)"
|         DocumentId = "%SAX(1)"
|         GlobalName = "%SAX"
|        HandlerType = 4
|     KeepWhitespace = 1
|               Node = ""
|             NodeId = "0,0"  <Set>
|               Tree = 1
|       controlblock = "??翰%SAX"_$c(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)_"铀籣??"_$c(0)_"????翶   "_$c(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)
+----------------- swizzled references ---------------
|         i%Document = ""  <Set>
|         r%Document = "2@%XML.Document"  <Set>
+--------------- calculated references ---------------
|          LocalName   <Get,Set>
|          Namespace   <Get,Set>
|     NamespaceIndex   <Get,Set>
|                Nil   <Get,Set>
|           NodeData   <Get,Set>
|           NodeType   <Get,Set>
|              QName   <Get,Set>
|           SkipFlag   <Get,Set>
+-----------------------------------------------------
DHC-APP 2e1>zw reader                                                           reader=<OBJECT REFERENCE>[1@%XML.Reader]
+----------------- general information ---------------
|      oref value: 1
|      class name: %XML.Reader
| reference count: 2
+----------------- attribute values ------------------
|      CheckRequired = 0
|        (Childlist) = $c(0,0,0,0,29,0,0,0,1,0,0,0,0,0,0,0,29,0,0,0,1,0,0,0)_"/"_$c(0,0,0)_" "_$c(0,0,0)_"0"_$c(0,0,0)_"@"_$c(0,0,0,3,0,0,0)
|CorrelationTable("update") = "YX.Config"
|       (Descriptor) = 16
|             Format = ""
|         IgnoreNull = 0
|  IgnoreSAXWarnings = 0
|     KeepWhitespace = 1
|               Node = "0,29"  <Set>
|    (NodeIsCurrent) = 1
|       (OpenFormat) = ""
|  (ParentChildlist) = ""
| (ParentDescriptor) = -1
|     (ParentNodeId) = "0,0"
|           SAXFlags = 95
|            SAXMask = 1023
|      SAXSchemaSpec = ""
|   SSLConfiguration = ""
|            Summary = 0
|      UsePPGHandler = ""
+----------------- swizzled references ---------------
|         i%Document = "2@%XML.Document"  <Set>
|         r%Document = ""  <Set>
|   i%EntityResolver = ""
|   r%EntityResolver = ""
+-----------------------------------------------------
DHC-APP 2e1>zw reader.EntityResolver
""
DHC-APP 2e1>g
  b ;zw object
  ^
<BREAK>zReadStringConfig+9^PHA.TEST.Xml.1
DHC-APP 2e1>zw object
object=<OBJECT REFERENCE>[3@YX.Config]
+----------------- general information ---------------
|      oref value: 3
|      class name: YX.Config
| reference count: 2
+----------------- attribute values ------------------
|       %Concurrency = 1  <Set>
|               name = "Herb"
|                url = "http://192.168.31.124/dthealth/web/csp/Herb.apk"
|            version = 27
+-----------------------------------------------------
DHC-APP 2e1>g
27
Herb
http://192.168.31.124/dthealth/web/csp/Herb.apk
```
