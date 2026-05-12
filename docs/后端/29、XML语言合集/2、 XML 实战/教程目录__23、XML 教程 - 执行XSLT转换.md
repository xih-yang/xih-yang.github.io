# 23、XML 教程 - 执行XSLT转换
- 来源：https://ddkk.com/zhuanlan/xml/2/23.html
- 分类：XML语言教程
- 分组：教程目录
XSLT(Extensible StyleSheet Language Transformations，可扩展样式表语言转换)是一种基于XML的语言，用于描述如何将给定的XML文档转换为另一个XML或其他“人类可读”的文档。可以使用`%XML.XSLT`和`%XML.XSLT2`包中的类来执行`XSLT 1.0`和`2.0`转换。

注意：使用的任何XML文档的XML声明都应该指明该文档的字符编码，并且文档应该按照声明的方式进行编码。如果未声明字符编码， IRIS将使用本书前面的“输入和输出的字符编码”中描述的默认值。如果这些默认值不正确，请修改XML声明，使其指定实际使用的字符集。

## 在IRIS中执行XSLT转换概述

IRIS提供两个XSLT处理器，每个处理器都有自己的API：

- Xalan处理器支持XSLT 1.0。XML.XSLT包为该处理器提供API。
- Saxon处理器支持XSLT 2.0。%XML.XSLT2程序包为该处理器提供API。

`XML.XSLT2` API通过到`XSLT 2.0`网关的连接向`Saxon`发送请求。网关允许多个连接。这意味着，例如，可以将两个独立的 IRIS进程连接到网关，每个进程都有自己的一组编译样式表，同时发送转换请求。

使用Saxon处理器，编译的样式表和`isc：Evaluate`缓存是特定于连接的；必须管理自己的连接才能利用这两个特性。如果打开连接并创建编译样式表或计算填充`isc：Evaluate`缓存的转换，则在该连接上计算的所有其他转换都将访问编译样式表和`isc：Evaluate`缓存条目。如果打开新连接，其他连接(及其编译的样式表和缓存)将被忽略。

这两个处理器的API相似，不同之处在于`%XML.XSLT2`中的方法使用另一个参数来指定要使用的网关连接。

要执行`XSLT`转换，请执行以下操作：

**1、** 如果使用的是`Saxon`处理器，请按照下一节所述配置`XSLT`网关服务器或使用默认配置；

如果使用的是`Xalan`处理器，则不需要网关。

系统会在需要时自动启动网关。或者也可以手动启动它。

**1、** 如果使用的是`Saxon`处理器，则可以选择创建`%Net.Remote.Gateway`的实例，表示到`XSLT`网关的单个连接；

请注意，当使用`Saxon`处理器时，要利用已编译的样式表和`isc：Evaluate`缓存，这一步是必需的。

**1、** 可以选择创建已编译的样式表并将其加载到内存中请参阅本章后面的“创建编译样式表”如果使用的是`Saxon`处理器，请确保在创建编译后的样式表时指定网关参数；

如果打算重复使用同一样式表，则此步骤非常有用。然而，此步骤也会消耗内存。当不再需要编译的样式表时，请务必将其删除。

**1、** 调用适用API的转换方法之一如果使用的是`Saxon`处理器，则在调用`Transform`方法时可以选择指定网关参数；

**2、** 可以选择调用其他转换方法如果使用的是`Saxon`处理器，则在调用`Transform`方法时可以选择指定网关参数；这使能够使用相同的连接计算另一个转换此转换将访问与此连接相关联的所有编译样式表和`isc：Evaluate`缓存条目如果打开新连接，其他连接(及其编译的样式表和缓存)将被忽略；

Studio还提供了一个向导，可以使用该向导测试XSLT转换；本章稍后将对此进行介绍。

## 配置、启动和停止XSLT 2.0网关

当使用`Saxon`处理器(执行`XSLT 2.0`转换)时， IRIS使用`XSLT 2.0`网关(后者使用Java)。要配置此网关，请执行以下操作：

**1、** 在管理门户中，选择SystemAdministration>Configuration>Connectivity>XSLT2.0GatewayServer.；

**2、** 选择Go；

系统将显示XSLT网关服务器页面。

左侧区域显示配置详细信息，右侧区域显示最近的活动。

**1、** 在左侧区域中，可以选择指定以下设置：；

- Port Number -XSLT 2.0网关独占使用的TCP端口号。此端口号不得与服务器上的任何其他本地TCP端口冲突。

默认值为 IRIS SuperServer端口号加`3000`。如果此数字大于`65535`，则系统使用`54773`。

- Java Version - 使用的Java版本。
- Log File - 日志文件的路径名。如果忽略此设置，则不执行日志记录。如果指定了文件名但忽略了目录，则将日志文件写入系统管理器的目录。
- Java Home Directory -包含Java bin目录的目录路径。如果服务器上没有默认Java，或者如果想使用不同的Java，请指定此选项。

要查看默认Java，请在服务器上的Shell中执行以下命令：

```java
java -version
```

- JVM Arguments - Java虚拟机要使用的任何其他参数。

此区域还显示`JAVA_HOME`环境变量的当前值。

请注意，在网关运行时，不能编辑这些值中的任何一个。

**1、** 如果已进行更改，请选择保存以保存更改或选择重置以；

**2、** (可选)选择测试以测试更改；

在此页面上，还可以执行以下操作：

- 启动网关。要执行此操作，请选择右侧区域中的Start。

请注意， IRIS会在需要时自动启动网关。不需要手动启动网关。

- 关闭网关。要执行此操作，请选择右侧区域中的Stop(停止)。

## 重用XSLT网关服务器连接(XSLT 2.0)

如果使用的是`Saxon`处理器，InterSystems IRIS将使用之前配置的`XSLT 2.0`网关。为了与此网关通信，InterSystems IRIS在内部创建一个`XSLT`网关连接(`%Net.Remote.Gateway`的实例)。默认情况下，系统创建一个连接，将其用于转换，然后丢弃该连接。打开新连接会产生开销，因此为多个转换维护一个连接可提供最佳性能。此外，必须维护自己的连接，以便利用已编译的样式表和`isc：Evaluate`缓存。

要重用XSLT网关连接，请执行以下操作：

**1、** 调用`%XML.XSLT2.Transformer`的`StartGateway()`方法：；

```java
 set status=##class(%XML.XSLT2.Transformer).StartGateway(.gateway)
```

此方法启动XSLT 2.0网关(如果它尚未运行)，并返回`%Net.Remote.Gateway`的实例作为输出。请注意，该方法还返回状态。

在`%Net.Remote.Gateway`实例表示与网关的连接。

`StartGateway()`有一个可选的第二个参数`useSharedMemory`。如果此参数为真(缺省值)，则与`localhost`或`127.0.0.1`的连接将使用共享内存(如果可能)。要强制连接仅使用`TCP/IP`，请将此参数设置为False。

**1、** 检查上一步返回的状态：；

```java
    if $$$ISERR(status) {
     quit
    }
```

**1、** 创建任何已编译的样式表执行此操作时，请将网关参数指定为`%Net.Remote.GatewayInstance`的实例在步骤1中创建；

**2、** 根据需要调用`%XML.XSLT2.Transformer`的`Transform`方法(`TransformFile()`、`TransformFileWithCompiledXSL()`、`TransformStream()`和`TransformStreamWithCompiledXSL()`)执行此操作时，请将网关参数指定为在步骤1中创建的`%Net.Remote.Gateway`的实例；

**3、** 如果不再需要给定的编译样式表，请在调用`%XML.XSLT2.CompiledStyleSheet`的`ReleaseFromServer()`方法：；

```java
 Set status=##class(%XML.XSLT2.CompiledStyleSheet).ReleaseFromServer(compiledStyleSheet,,gateway) 
```

重要提示：当不再需要已编译的样式表时，请务必使用此方法。

**1、** 当不再需要XSLT网关连接时，调用`%XML.XSLT2.Transformer`的`StopGateway()`方法，并将网关连接作为参数传递：；

```java
 set status=##class(%XML.XSLT2.Transformer).StopGateway(gateway)
```

此方法丢弃连接并重置当前设备。它不会停止`XSLT 2.0`网关。

重要提示：当不再需要连接时，请务必使用此方法。

有关示例，请参见XSLT2中的`Example10()`方法。`Samples`命名空间中的`Examples`。

## 排除XSLT 2.0网关服务器连接故障

当XSLT 2.0网关打开时，InterSystems IRIS和网关服务器之间的连接可能会变得无效。例如，如果出现网络错误或在InterSystems IRIS连接到网关服务器后重新启动网关服务器，则连接可能无法正常关闭。因此，可能会遇到错误。

可以通过连续调用XSLT网关连接对象的`%LostConnectionCleanup()`方法和`%reconnect`方法，尝试将InterSystems IRIS重新连接到网关服务器。

如果希望在断开连接时自动重新连接到网关服务器，请将网关连接对象的`AttemptReconnect`属性设置为true。

## 创建编译的样式表

如果打算重复使用同一样式表，则可能需要编译该样式表以提高速度。请注意，此步骤会消耗内存。当不再需要编译的样式表时，请务必将其删除。

要创建编译的样式表，请执行以下操作：

- 如果使用的是Xalan处理器(对于XSLT 1.0)，请使用%XML.XSLT.CompiledStyleSheet的以下类方法之一：
- `CreateFromFile()`
- `CreateFromStream()`
- 如果使用的是Saxon处理器(用于XSLT 2.0)，请在使用%XML.XSLT2.CompiledStyleSheet的以下类方法之一：
- `CreateFromFile()`
- `CreateFromStream()`

另请注意，将需要创建一个XSLT网关连接；请参阅“重用XSLT网关服务器连接(`XSLT 2.0`)”。

对于所有这些方法，完整的参数列表按顺序如下：

**1、** source-样式表；

对于`CreateFromFile()`，此参数是文件名。对于`CreateFromStream()`，此参数是一个流。

**1、** compiledStyleSheet-编译后的样式表，作为输出参数返回；

这是样式表类(`%XML.XSLT.CompiledStyleSheet`或`%XL.XSLT2.CompiledStyleSheet`，视情况而定)的实例。

**1、** errorHandler-编译样式表时使用的可选自定义错误处理程序；

对于这两个类中的方法，这是`%XML.XSLT.ErrorHandler`实例。

**1、** (仅适用于`%XML.XSLT2.CompiledStyleSheet`)网关-`%Net.Remote.Gateway`的实例；

```java
 //将tXSL设置为等于适当流的OREF
 Set tSC=##class(%XML.XSLT.CompiledStyleSheet).CreateFromStream(tXSL,.tCompiledStyleSheet)
 If $$$ISERR(tSC) Quit
```
