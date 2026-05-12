# 11、XML 教程 - 重新定义读取器处理相关对象的方式
- 来源：https://ddkk.com/zhuanlan/xml/2/11.html
- 分类：XML语言教程
- 分组：教程目录
## 重新定义读取器处理相关对象的方式

当`%XML.Reader`找到与启用了XML的类相关的XML元素时，读取器会调用该类的`XMLNew()`方法，后者又会在默认情况下调用`%New()`。也就是说，当读取器找到相关元素时，它会创建相关类的新对象。新对象由从XML文档读取的数据填充。

可以通过在启用XML的类中(或在自己的自定义XML适配器中)重新定义`XMLNew()`来自定义此行为。例如，此方法可以改为打开该类的现有实例。然后，现有实例接收从XML文档读取的数据。

以下示例显示如何修改`XMLNew()`以使用XML文档中的新数据更新现有实例。

在这两个示例中，为简单起见，我们假设XML文档中的一个节点包含一个ID，我们可以将该ID与类的范围中的ID进行比较。当然，我们可以用其他方式将XML文档与现有对象进行比较。

### 当%XML.Reader调用XMLNew()时

作为参考，`%XML.Reader`在两种情况下自动调用`XMLNew()`方法：

- %XML.Reader在调用%XML.Reader的Next()方法调用XMLNew()。在将XML元素(在外部文档中)与启用了XML的类关联之后，%XML.Reader Next()方法从文档中获取下一个元素，调用XMLNew()创建相应对象的实例，然后将该元素导入到对象中。
- 同样，%XML.Reader为相关XML元素的任何对象值属性调用XMLNew()。

### 示例1：修改启用XML的类中的XMLNew()

```java
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <Person>
    <IRISID>4</IRISID>
    <Name>Quine,Maria K.</Name>
    <DOB>1964-11-14</DOB>
    <Address>
      <City>Hialeah</City>
      <Zip>94999</Zip>
    </Address>
    <Doctors>
      <Doctor>
        <Name>Vanzetti,Debra B.</Name>
      </Doctor>
    </Doctors>
  </Person>
...
```

此文件映射到以下InterSystems IRIS类(部分显示)：

```java
Class GXML.PersonWithXMLNew Extends (%Persistent, %Populate, %XML.Adaptor)
{
Parameter XMLNAME = "Person";
/// make sure this is the same as the XMLNAME of the property 
/// in this class that is of type %XML.Id
Parameter NAMEOFEXPORTID As %String = "IRISID";
Property IdForExport As %XML.Id(XMLNAME = "IRISID", XMLPROJECTION = "ELEMENT") [ Private, Transient ];
Property Name As %Name;
Property DOB As %Date(FORMAT = 5, MAXVAL = "+$h");
Property Address As GXML.Address;
Property Doctors As list Of GXML.Doctor;
```

在该类中，`IdForExport`属性的用途是在导出该类的对象时将InterSystems IRIS内部ID投影到元素(`IRISID`)。(在此特定示例中，这使我们能够轻松地生成适合导入的文件。类不必包含这样的属性。)

`NAMEOFEXPORTID`参数用于指示导出此类对象时用于InterSystems IRIS ID的元素。包含这一点只是为了方便自定义的`XMLNew()`方法，我们也将该方法添加到该类中。该方法定义如下：

```java
ClassMethod XMLNew(doc As %XML.Document, node As %Integer, contOref As %RegisteredObject = "") As GXML.PersonWithXMLNew
{
    Set id=""
    Set tmpnode=doc.GetNode(node)
    Do tmpnode.MoveToFirstChild()
    Do {
        //将数据节点与NAMEOFEXPORTID参数提供的字符串进行比较
        //指示此对象的ID的XMLNAME
        If tmpnode.NodeData=..#NAMEOFEXPORTID {
            //从该节点获取文本；这与数据库中的id相对应
            Do tmpnode.GetText(.id)}
        } While tmpnode.MoveToNextSibling()
    //如果给定节点中没有id，则创建一个新对象
    If id="" {
        Write !, "正在创建新对象..."
        Quit ..%New()}
    //打开给定对象
    Set result=..%OpenId(id)
    //如果id与现有对象不对应，则创建一个新对象
    If result=$$$NULLOREF {
        Write !, "正在创建新对象..." 
        Quit ..%New()}
    Write !, "正在更新现有对象..."
    Quit result
}
```

`%XML.Reader`读取`XML`文档并将节点关联到`GXML.PersonWithXMLNew`时调用此方法。此方法查看此类中的`NAMEOFEXPORTID`参数的值，即`IRISID`。然后，它使用元素`IRISID`检查文档中的节点并获取其值。

如果此`ID`对应于此类的现有对象，则该方法将打开该实例。否则，该方法将打开此类的新实例。在这两种情况下，实例都会接收`XML`文档中指定的属性。

最后，以下实用程序类包含一个方法，该方法打开`XML`文件并在新窗口中调用`%XML.Reader`：

```java
/// wclass(PHA.TEST.Xml).ReadFile()
ClassMethod ReadFile(filename As %String = "e:\temp\xmlnewtest.xml")
{
    Set reader=##class(%XML.Reader).%New()
    Set sc=reader.OpenFile(filename)
    If $$$ISERR(sc) {
     Do $system.OBJ.DisplayError(sc) Quit  }
    Do reader.Correlate("Person","GXML.PersonWithXMLNew")
    //loop through elements in file 
    While reader.Next(.person,.sc) {
        Write !,person.Name,!
        Set sc=person.%Save()
        If $$$ISERR(sc) {
     Do $system.OBJ.DisplayError(sc) Quit  }
    }
    Quit ""
}
```

运行上述方法时，文件中的每个``元素都会发生以下情况之一：

- 打开现有对象，使用文件中的详细信息进行更新，然后保存。
- 或者创建一个新对象，其中包含文件中的详细信息。

```java
DHC-APP>wclass(PHA.TEST.Xml).ReadFile()
正在创建新对象...
Quine,Maria K.
DHC-APP>wclass(PHA.TEST.Xml).ReadFile()
正在创建新对象...
Quine,Maria K.
DHC-APP>wclass(PHA.TEST.Xml).ReadFile()
正在创建新对象...
Quine,Maria K.
DHC-APP>wclass(PHA.TEST.Xml).ReadFile()
正在更新现有对象...
Quine,Maria K.
DHC-APP>wclass(PHA.TEST.Xml).ReadFile()
正在更新现有对象...
Quine,Maria K.
DHC-APP>wclass(PHA.TEST.Xml).ReadFile()
正在更新现有对象...
Quine,Maria K.
```

### 示例2：在自定义XML适配器中修改XMLNew()

在第二个示例中，我们创建一个自定义XML适配器来执行与第一个示例相同的操作。适配器类如下所示：

```java
Class GXML.AdaptorWithXMLNew Extends %XML.Adaptor
{
/// 确保这与该类中属性的XMLNAME相同 它的类型为%XML.Id
Parameter NAMEOFEXPORTID As %String = "IRISID";
Property IdForExport As %XML.Id(XMLNAME = "IRISID", XMLPROJECTION = "ELEMENT") [ Private, Transient ];
ClassMethod XMLNew(document As %XML.Document, node As %Integer, containerOref As %RegisteredObject = "") As %RegisteredObject [ CodeMode = objectgenerator, GenerateAfter = %XMLGenerate, ServerOnly = 1 ]
{
 If %compiledclass.Name'="GXML.AdaptorWithXMLNew" {
  Do %code.WriteLine(" Set id=""""")
  Do %code.WriteLine(" Set tmpnode=document.GetNode(node)")
  Do %code.WriteLine(" Do tmpnode.MoveToFirstChild()")
  Do %code.WriteLine(" Do {")
  Do %code.WriteLine("     If tmpnode.NodeData=..#NAMEOFEXPORTID ")
  Do %code.WriteLine("       {Do tmpnode.GetText(.id)}")
  Do %code.WriteLine(" } While tmpnode.MoveToNextSibling() ")
  Do %code.WriteLine(" If id="""" {")
  Do %code.WriteLine("  Write !,""Creating new object...""")
  Do %code.WriteLine("  Quitclass("_%class.Name_").%New()}")
  Do %code.WriteLine(" set result=##class("_%class.Name_").%OpenId(id)")
  Do %code.WriteLine(" If result=$$$NULLOREF {")
  Do %code.WriteLine("     Write !,""Creating new object...""")
  Do %code.WriteLine("     Quitclass("_%class.Name_").%New() }")
  Do %code.WriteLine(" Write !,""Updating existing object ...""")
  Do %code.WriteLine(" Quit result")
  }
 QUIT $$$OK
}
}
```

`IdForExport`属性和`NAMEOFEXPORTID`参数建立了一个约定，用于在导出子类的对象时如何将InterSystems IRIS内部`ID`投影到元素。其目的是，如果在子类中重新定义`IdForExport`，则相应地重新定义`NAMEOFEXPORTID`。

在这个类中，`XMLNew()`方法是一个方法生成器。编译该类(或任何子类)时，InterSystems IRIS会将此处显示的代码写入此方法的主体中。

以下类扩展了我们的自定义适配器：

```java
Class GXML.PersonWithXMLNew2 
Extends (%Persistent, %Populate, GXML.AdaptorWithXMLNew)
{
Parameter XMLNAME = "Person";
Property Name As %Name;
Property DOB As %Date(FORMAT = 5, MAXVAL = "+$h");
Property Address As GXML.Address;
Property Doctors As list Of GXML.Doctor;
}
```

当运行前面显示的示例`ReadFile`方法时，对于文件中的每个 ``元素，该方法要么创建并保存一条新记录，要么打开并更新现有记录。
