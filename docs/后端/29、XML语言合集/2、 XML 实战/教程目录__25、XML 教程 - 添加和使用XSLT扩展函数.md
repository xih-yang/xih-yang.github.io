# 25、XML 教程 - 添加和使用XSLT扩展函数
- 来源：https://ddkk.com/zhuanlan/xml/2/25.html
- 分类：XML语言教程
- 分组：教程目录
## 自定义错误处理

当出现错误时，XSLT处理器(`Xalan`或`Saxon`)执行当前错误处理程序的`error()`方法，将消息作为参数发送到该方法。类似地，当发生致命错误或警告时，XSLT处理器会根据需要执行`datalError()`或`Warning()`方法。

对于所有这三种方法，默认行为是将消息写入当前设备。

要自定义错误处理，请执行以下操作：

- 对于Xalan或Saxon处理器，在创建%XML.XSLT.ErrorHandler的子类。在这个子类中，根据需要实现Error()、FatealError()和Warning()方法。

这些方法中的每一个都接受单个参数，即包含由XSLT处理器发送的消息的字符串。

这些方法不返回值。

- 要在编译样式表时使用此错误处理程序，请创建子类的实例，并在编译样式表时在参数列表中使用它。
- 若要在执行XSLT转换时使用此错误处理程序，请创建子类的实例，并在使用的Transform方法的参数列表中使用它。

## 指定样式表使用的参数

要指定样式表使用的参数，请执行以下操作：

**1、** 创建`%ArrayOfDataTypes`的实例在；

**2、** 调用此实例的`SetAt()`方法将参数及其值添加到此实例对于`SetAt()`，将第一个参数指定为参数值，将第二个参数指定为参数名称；

根据需要添加任意多个参数。

```java
    Set tParameters=##class(%ArrayOfDataTypes).%New()
    Set tSC=tParameters.SetAt(1,"myparameter")
    Set tSC=tParameters.SetAt(2,"anotherparameter")
```

**1、** 将此实例用作`Transform`方法的`pParms`参数；

可以不使用`%ArrayOfDataType`，而是使用 IRIS多维数组，该数组可以具有任意数量的具有以下结构和值的节点：

Node
Value

arrayname(“parameter_name”)
Value of the parameter named by parameter_name

## 添加和使用XSLT扩展函数

可以在InterSystems IRIS中创建`XSLT`扩展函数，然后在样式表中使用它们，如下所示：

- 对于XSLT2.0(Saxon处理器)，可以使用名称空间com.intersystems.xsltgateway.XSLTGateway中的evaluate函数或名称空间http://extension-functions.intersystems.com中的evaluate函数
- 对于XSLT1.0(Xalan处理器)，只能在名称空间http://extension-functions.intersystems.com中使用evaluate函数

默认情况下(举个例子)，后一个函数反转它接收到的字符。但是，通常不使用默认行为，因为实现了一些其他行为。要模拟多个单独的函数，需要传递一个选择器作为第一个参数，并实现一个开关，该开关使用该值选择要执行的处理。

在内部，`evaluate`函数作为XSLT回调处理程序中的方法(`evaluate()`)实现。

要添加和使用XSLT扩展函数，请执行以下操作：

**1、** 对于`Xalan`或`Saxon`处理器，在创建`%XML.XSLT.CallbackHandler`的子类在这个子类中，根据需要实现`evaluate()`方法请参阅下一小节；

**2、** 在样式表中，声明`evaluate`函数所属的命名空间，并根据需要使用`evaluate`函数请参阅下一小节；

**3、** 执行XSLT转换时，创建子类的实例，并在使用的`Transform`方法的参数列表中使用它请参阅“执行XSLT转换”；

### 实现evaluate()方法

在内部，调用`XSLT`处理器的代码可以将任意数量的位置参数传递给当前回调处理程序的`evaluate()`方法，该方法将它们作为具有以下结构的数组接收：

Node
Value

Args
参数数量

Args(index)
位置索引中参数的值

该方法只有一个返回值。返回值可以是：

- 标量变量(如字符串或数字)。
- 流对象。这允许返回超过字符串长度限制的超长字符串。流必须包装在新窗口中的%XML.XSLT.StreamAdapter实例中，使XSLT处理器能够读取流。以下是部分示例：

```java
Method evaluate(Args...) As %String
{
 //create stream
 ///...
 // create instance of %XML.XSLT.StreamAdapter to
 // contain the stream
 Set return=##class(%XML.XSLT.StreamAdapter).%New(tStream)
 Quit return
}
```

### 在样式表中使用计算

要在XSLT中使用XSLT扩展函数，必须在XSLT样式表中声明扩展函数的名称空间。对于InterSystems evaluate函数，此命名空间是`http://extension-functions.intersystems.com`或`com.intersystems.xsltgateway.XSLTGateway`，如前所述。

下面的示例显示使用evaluate的样式表：

```java
<?xml version="1.0"?>
<xsl:stylesheet 
xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" 
xmlns:isc="http://extension-functions.intersystems.com">
  <xsl:output method="xml" indent="yes"/>
  <xsl:template match="//@* | //node()">
    <xsl:copy>
      <xsl:apply-templates select="@*"/>
      <xsl:apply-templates select="node()"/>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="/s1/s2/s3">
  <xsl:apply-templates select="@*"/>
  <xsl:choose>
  <xsl:when test="function-available('isc:evaluate')">
  <xsl:copy>
  <xsl:value-of select="isc:evaluate(.)" disable-output-escaping="yes"/>
  </xsl:copy>
  </xsl:when>
  <xsl:otherwise>
  <xsl:value-of select="."/>
  </xsl:otherwise>
  </xsl:choose>
  </xsl:template> 
</xsl:stylesheet>
```

### 使用ISC：计算缓存

XSLT2.0网关将`evaluate`函数调用缓存在`isc：evaluate`缓存中。缓存的默认最大大小为`1000`个项目，但可以将大小设置为不同的值。此外，还可以清除缓存、转储缓存，还可以从`%List`中预先填充缓存。使用以下格式：

- 缓存条目总数
- 对于每个条目：

**1、** 求值参数总数；

**2、** 所有求值参数；

**3、** 计算值；

缓存还包括可缓存的函数名称的过滤器列表。请注意以下事项：

- 可以在筛选器列表中添加或删除函数名。
- 可以清除过滤器列表。
- 可以通过设置一个布尔值来覆盖筛选器列表，该布尔值将缓存每个evaluate调用。

将函数名添加到筛选器列表不会限制求值缓存的大小。可以对同一函数进行任意数量的调用，但具有不同的参数和返回值。函数名和参数的每个组合都是求值缓存中的一个单独条目。

可以使用`%XML.XSLT2.Transformer`中的方法来操作求值缓存。

## 使用XSL转换向导

Studio提供了一个执行XSLT转换的向导，当希望快速测试样式表或自定义XSLT扩展函数时，该向导非常有用。要使用此架构向导，请执行以下操作：

**1、** Tools>Add-Ins>XSLTSchemaWizard.；

**2、** 指定以下必需的详细信息：；

- 对于XML文件，选择浏览以选择要转换的XML文件。
- 对于XSL文件，选择浏览以选择要使用的XSL样式表。
- 对于呈现为，选择文本或XML以控制转换的显示方式。

**1、** 如果已在要在此转换中使用的创建了`%XML.XSLT.CallbackHandler`的子类，请指定以下详细信息：；

- 对于XSLT Helper Class中的第一个下拉列表，选择一个命名空间。
- 对于XSLT Helper Class中的第二个下拉列表，选择该类。

**1、** 选择Finish(完成)；

对话框底部显示转换后的文件。可以从该区域复制和粘贴。

**1、** 要关闭此对话框，请选择取消；
