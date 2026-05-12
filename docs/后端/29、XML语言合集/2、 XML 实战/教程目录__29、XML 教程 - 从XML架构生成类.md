# 29、XML 教程 - 从XML架构生成类
- 来源：https://ddkk.com/zhuanlan/xml/2/29.html
- 分类：XML语言教程
- 分组：教程目录
Studio提供了一个向导，该向导读取XML模式(从文件或URL)，并生成一组支持XML的类，这些类对应于模式中定义的类型。

所有的类都扩展`%XML.Adaptor`。

指定一个包来包含类，以及控制类定义细节的各种选项。

向导还可以作为类方法使用，也可以使用该类方法。

在内部，SOAP向导在读取WSDL文档并生成web客户端或web服务时使用此方法;

注意：使用的任何XML文档的XML声明都应该指明该文档的字符编码，并且文档应该按照声明的方式进行编码。如果未声明字符编码，InterSystems IRIS将使用本书前面的“输入和输出的字符编码”中描述的默认值。如果这些默认值不正确，请修改XML声明，使其指定实际使用的字符集。

## 使用向导

要使用XML架构向导，请执行以下操作：

**1、** 选择Tools>Add-Ins>XMLSchemaWizard.；

**1、** 在第一个屏幕上，指定要使用的XML模式；

做以下其中一项:

- 对于模式文件Schema File，选择Browse 以选择XML模式文件。
- 对于URL，指定模式的URL。

**1、** 选择Next；

下一个屏幕显示模式，以便可以验证选择了正确的模式。

**1、** 可选择以下选项:；

- 保留空类Keep Empty Classes，它指定是否保留没有属性的未使用的类。

如果选择此选项，则不会在向导结束时删除此类;

否则，将删除它们。
- “不创建数组属性”Create No Array Properties控制向导是否生成数组属性。

如果选择此选项，向导不会生成数组属性，而是生成另一个表单。
- 为可为空的元素生成XMLNIL属性参数，它控制向导是否为生成的类中适用的属性指定XMLNIL属性参数。

该选项适用于每个对应于用`nillable="true"`指定的XML元素的属性。

如果选择此选项，向导将向属性定义添加`XMLNIL=1`。

否则不添加该参数。

该参数的详细信息请参见将对象投影到XML中的“处理空字符串和空值”。

- 为可为空的元素生成XMLNILNOOBJECT属性参数，它控制向导是否为生成的类中适用的属性指定XMLNILNOOBJECT属性参数。

该选项适用于每个对应于用`nillable="true"`指定的XML元素的属性。

如果选择此选项，向导将向属性定义添加`XMLNILNOOBJECT=1`。

否则不添加该参数。

该参数的详细信息请参见将对象投影到XML中的“处理空字符串和空值”。

**1、** 选择Next；

下一个屏幕显示关于要生成的类的选项的一些基本信息。

**1、** 在这个屏幕上，指定以下选项:；

- 如果希望向导编译生成的类，可以选择“编译生成的类”。
- 可选择“添加NAMESPACE类参数”来指定NAMESPACE参数。

在本例中，`NAMESPACE`被设置为模式中`targetNamespace`的值。

如果不设置此选项，则不指定`NAMESPACE`。

建议在所有情况下都选择这个选项，因为每个支持XML的类都应该分配给一个XML名称空间。

(但是，为了向后兼容，可以将此选项清除。)

- 如果希望生成的类是持久类，请选择Create persistent classes。然后类扩展%Persistent。

可以稍后在向导中针对各个类更改这一点。

- 如果生成持久类，可以选择如何处理由另一个`` b的``组成的`` a。当向导生成一个包含属性a的持久类时，该属性有三种可能的形式。

可以将其定义为对象列表、一对多关系(默认)或父子关系。

下表总结了这些选择:

在持久性类中为集合属性使用关系
向多对关系添加索引
使用父子关系
生成的属性A的形式

selected (default)
not selected
not selected
无索引的一对多关系

selected (default)
selected
not selected
在多侧与索引的一对多关系

selected (default)
如果选择Use parent-child relationship，则忽略此选项
selected
父子关系

not selected
not selected
not selected
List of objects

此外，如果未选择使用父子关系，则可以选择将`%OnDelete`方法添加到类以级联删除。如果选择此选项，当向导生成类定义时，它会在这些类中包含`%OnDelete()`回调方法的实现。生成的`%OnDelete()`方法删除类引用的所有持久对象。如确实选择了使用父子关系，请不要选择此选项；父子关系已经提供了类似的逻辑。

注意：如果修改生成的类，请确保根据需要修改`%OnDelete()`回调方法。

如果生成持久类，向导可以向每个对象类型类添加临时属性，以便可以为对象投影InterSystems IRIS内部标识符。选项如下：

- None-如果选择此选项，向导不会添加此处描述的任何属性。
- Use Id -如果选择此选项，向导将向每个对象类型类添加以下属性：

```java
Property %identity As %XML.Id (XMLNAME="_identity", XMLPROJECTION="ATTRIBUTE") [Transient];
```

- Use Oid -如果选择此选项，向导将向每个对象类型类添加以下属性：

```java
Property %identity As %XML.Oid (XMLNAME="_identity", XMLPROJECTION="ATTRIBUTE") [Transient];
```

- Use GUID-如果选择此选项，向导将向每个对象类型类添加以下属性：

```java
Property %identity As %XML.GUID (XMLNAME="_identity", XMLPROJECTION="ATTRIBUTE") [Transient];
```

底部的表格列出了模式中的XML名称空间。在这里，指定包含该行中显示的XML名称空间的类的包。要执行此操作，请在程序包名字段中为该行指定程序包名。

**1、** 选择下一步；

**2、** 在下一个屏幕上，指定以下选项：；

- Java Enabled - 如果选择此选项，则每个类都包括一个Java映射。
- Data Population数据填充-如果选择此选项，则除%XML.Adaptor外，每个类还继承会%Populate。
- SQL Column Order-如果选择此选项，每个属性将为SqlColumnNumber关键字指定一个值，以便属性在SQL中的顺序与它们在架构中的顺序相同。
- No Sequence Check-如果选中此选项，向导将生成的类中的XMLSEQUENCE参数设置为0。在某些情况下，如果XML文件的元素顺序与XML架构不同，则此选项非常有用。

默认情况下，`XMLSEQUENCE`参数在生成的类中设置为1。这可确保属性以与架构中相同的顺序包含在类定义中。

- XMLIGNORENULL-如果选择此选项，向导会将XMLIGNORENULL=1添加到类定义中。否则，它不会添加此参数。
- 将流用于二进制Use Streams for Binary - 如果选择此选项，向导将为xsd：base64Binary类型的任何元素生成%Stream.GlobalBinary类型的属性。如果清除此选项，则该属性的类型为%xsd.base64Binary。

请注意，向导将忽略`xsd：base64Binary`类型的任何属性。

- 在复选框下方，该表列出了向导将生成的类。对于每个类，确保适当地设置了Extensions/Type。在此，可以选择以下选项之一：
- 持久类`Persistent` -如果选择此选项，则类是持久性类。
- `Serial`-如果选择此选项，则类为序列类。
- `Registered Object`-如果选择此选项，则类为注册对象类。

所有生成的类还扩展`%XML.Adaptor`。

- 在表的右列中，为每个应编制索引的属性选择索引。

**1、** 选择Finish(完成)；

然后，向导将生成这些类，并在需要时编译它们。

对于这些类的属性，如果架构中相应元素的名称以下划线(_)开头，则属性名称以百分号(%)开头。

## 以编程方式生成类

XML架构向导也可用作`%XML.Utils.SchemaReader`类的`process()`方法。要使用此方法，请执行以下操作：

**1、** 创建`%XML.Utils.SchemaReader`的实例；

**2、** 可以选择设置实例的属性以控制其行为；

**3、** 可以选择创建InterSystemsIRIS多维数组，以包含有关其他设置的信息；

**4、** 调用实例的`process()`方法：；

```java
method Process(LocationURL As %String, 
               Package As %String = "Test", 
               ByRef Features As %String) as %Status
```

- LocationURL必须是架构的URL或架构文件的名称(包括其完整路径)。
- Package是用于放置生成的类的包的名称。如果不指定程序包，InterSystems IRIS将使用服务名称作为程序包名称。
- Feature是在上一步中选择创建的多维数组。

## 每种XSD类型的默认IRIS数据类型

对于它生成的每个属性，XML架构向导会根据架构中指定的XSD类型自动使用适当的InterSystems IRIS数据类型类。下表列出了XSD类型和相应的InterSystems IRIS数据类型：

用于XML类型的InterSystems IRIS数据类型

源文档中的XSD类型
生成的IRIS类中的数据类型

anyURI
%xsd.anyURI

base64Binary
%xsd.base64Binary或%Stream.GlobalBinary，具体取决于选择的选项。确定每个字符串是否可能超出字符串长度限制，如果可能，则将生成的属性从%xsd.base64Binary修改为适当的流类。)

boolean
%Boolean

byte
%xsd.byte

date
%Date

dateTime
%TimeStamp

decimal
%Numeric

double
%xsd.double

float
%xsd.float

hexBinary
%xsd.hexBinary

int
%xsd.int

integer
%Integer

long
%Integer

negativeInteger
%xsd.negativeIntege

nonNegativeInteger
%xsd.nonNegativeInteger

nonPositiveInteger
%xsd.nonPositiveInteger

positiveInteger
%xsd.positiveInteger

short
%xsd.short

string
%String (注意：责任确定每个字符串是否可能超出字符串长度限制，如果可能，则将生成的类型修改为适当的流类。)

time
%Time

unsignedByte
%xsd.unsignedByte

unsignedInt
%xsd.unsignedInt

unsignedLong
%xsd.unsignedLong

unsignedShort
%xsd.unsignedShort

no type given
%String

## 生成的属性的属性关键字

对于它生成的每个属性，XML架构向导还使用架构中的信息自动设置以下关键字：

- Description
- Required
- ReadOnly (如果相应的元素或属性是用固定属性定义的)
- InitialExpression (该值取自架构中的固定属性)
- Keywords related to relationships

## 生成的属性的参数

对于它生成的每个属性，XML架构向导会根据需要自动设置`XMLNAME`、`XMLPROJECTION`和所有其他与XML相关的参数。它还根据需要设置其他参数，如`MAXVAL`、`MINVAL`和`VALUELIST`。

## 调整为超长字符串生成的类

在极少数情况下，可能需要编辑生成的类来容纳超长的字符串或二进制值，超出字符串长度限制。

对于任何字符串类型，XML架构都不包含任何指示字符串长度的信息。XML架构向导将所有字符串值映射到InterSystems IRIS `%String`类，并将所有`base64Binary`值映射到`%xsd.base64Binary`类。这些选择可能不合适，具体取决于类要承载的数据。

在使用生成的类之前，应该执行以下操作：

- 检查生成的类，找到定义为%string或%xsd.base64Binary的属性。考虑将在其中使用这些类的上下文，特别是这些属性。
- 如果认为%string属性可能需要包含超出字符串长度限制的字符串，请将该属性重新定义为适当的字符流。同样，如果认为%xsd.base64Binary属性可能需要包含超过相同限制的字符串，请将该属性重新定义为适当的二进制流。
- 另请注意，对于类型为%string、%xsd.string和%BINARY的属性，默认情况下，MAXLEN属性参数为50个字符。可能需要指定更高的限制才能进行正确的验证。

(对于`%xsd.base64Binary`类型的属性，`MAXLEN`为`“”`，这意味着不会通过验证检查长度。但是，字符串长度限制确实适用。)
