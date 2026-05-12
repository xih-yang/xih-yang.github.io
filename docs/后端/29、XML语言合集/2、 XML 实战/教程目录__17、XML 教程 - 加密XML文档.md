# 17、XML 教程 - 加密XML文档
- 来源：https://ddkk.com/zhuanlan/xml/2/17.html
- 分类：XML语言教程
- 分组：教程目录
本章介绍如何加密XML文档。

提示：发现在此命名空间中启用`SOAP`日志记录非常有用，这样就可以收到有关任何错误的更多信息。

## 关于加密的XML文档

加密的XML文档包括以下元素：

- ``元素，其中包含由随机生成的对称密钥加密的加密数据。(使用对称密钥加密比使用公钥加密更有效。)
- 至少有一个``元素。每个``元素携带用于加密数据的对称密钥的加密副本;它还包含一个带有公钥的X.509证书。拥有匹配私钥的接收方可以解密对称密钥，然后解密``元素。
- (可选)其他明文元素。

```java
<?xml version="1.0" encoding="utf-8"?>
<Container xmlns="http://www.w3.org/2001/04/xmlenc#">  
  <EncryptedKey> 
    <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p"> 
      <DigestMethod xmlns="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod> 
    </EncryptionMethod>  
    <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">  
      <X509Data> 
        <X509Certificate>MIICnDCCAYQCAWUwDQYJKo... content omitted</X509Certificate> 
      </X509Data> 
    </KeyInfo>  
    <CipherData> 
      <CipherValue>J2DjVgcB8vQx3UCy5uejMB ... content omitted</CipherValue> 
    </CipherData>  
    <ReferenceList> 
      <DataReference URI="#Enc-E0624AEA-9598-4436-A154-F746B07A2C55"/> 
    </ReferenceList> 
  </EncryptedKey>  
  <EncryptedData Id="Enc-E0624AEA-9598-4436-A154-F746B07A2C55" Type="http://www.w3.org/2001/04/xmlenc#Content"> 
    <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"></EncryptionMethod>  
    <CipherData> 
      <CipherValue>LmoBK7+nDelTOsC3 ... content omitted</CipherValue> 
    </CipherData> 
  </EncryptedData> 
</Container>
```

要创建加密文档，请使用类`%XML.Security.EncryptedData`和`%XML.Security.EncryptedKey`。这些启用XML的类投影到适当名称空间中的有效``和``元素。

## 创建加密的XML文档

创建加密的XML文档的最简单方法如下：

**1、** 定义并使用可以直接投影到所需XML文档的通用容器类；

**2、** 创建包含要加密的XML的流；

**3、** 加密该流，并将其与相应的加密密钥一起写入容器类的相应属性；

**4、** 为容器类生成XML输出；

### 加密的前提条件

在加密文档之前，必须创建包含要将加密文档发送到的实体的证书的 IRIS凭据集。在这种情况下，不需要(也不应该拥有)关联的私钥。

### 容器类的要求

一个通用容器类必须包括以下内容:

- 类型为%XML.Security的属性。

被投影为``元素的`EncryptedData`。

这个属性将携带加密的数据。

- 至少一个类型为%XML.Security的属性。被投影为``元素的EncryptedKey。

这些属性将携带相应的密钥信息。

示例如下:

```java
Class XMLEncryption.Container Extends (%RegisteredObject, %XML.Adaptor)
{
Property Data As %XML.Security.EncryptedData(XMLNAME = "EncryptedData");
Property Key As %XML.Security.EncryptedKey(XMLNAME = "EncryptedKey");
Parameter NAMESPACE = "http://www.w3.org/2001/04/xmlenc#";
}
```

### 生成加密的XML文档

要生成并编写加密文档，请执行以下操作:

**1、** 创建包含XML文档的流；

为此，通常使用`%XML.Writer`将启用XML的对象的输出写入流。

**1、** 创建`%SYS.X509Credentials`的至少一个实例,将访问要向其提供加密文档的实体的InterSystemsIRIS凭据集为此，请调用此类的`GetByAlias()`类方法例如：；

```java
 set credset=##class(%SYS.X509Credentials).GetByAlias("recipient")
```

若要运行此方法，必须以该凭据集的`OwnerList`中包含的用户身份登录，否则`OwnerList`必须为空。

**1、** 至少创建`%XML.Security.EncryptedKey`实例若要创建此类的实例，请使用此类的`CreateX509()`类方法例如：；

```java
 set enckey=##class(%XML.Security.EncryptedKey).Createx509(credset,encryptionOptions,referenceOption)
```

- credset是%SYS的实例。

`x509credentials`在刚刚创建的新窗口中打开。
- encryptionOptions是`$``$``$`SOAPWSIncludeNone(还有其他选项，但它们不适用于此场景)。

此宏在`%soap.inc`包含文件中定义。

- referenceOption指定了对加密元素的引用的性质。

这里使用的宏在`%soap.inc`包含文件中定义。

**1、** 在创建`%Library.ListOfObjects`实例，并使用其`Insert()`方法在刚创建插入`%XML.Security.EncryptedKey`实例；

**2、** 使用`%New()`方法创建`%XML.Security.EncryptedData`实例例如：；

```java
 set encdata=##class(%XML.Security.EncryptedData).%New()
```

**1、** 使用`%XML.Security.EncryptedData的EncryptStream()`实例方法加密在步骤2中创建的流例如：；

```java
 set status=encdata.EncryptStream(stream,encryptedKeys)
```

- stream 流是在步骤1中创建的流。
- encryptedKeys是在步骤4中创建的密钥列表。

**1、** 创建并更新容器类的实例；

- 将键列表写入此类的相应属性。
- 将 %XML.Security.EncryptedData的实例写入此类的相应属性。

**1、** 使用`%XML.Writer`为容器类生成输出；

例如，前面显示的`CONTAINER`类还包括以下方法：

```java
/// wclass(XMLEncryption.Container).Demo("E:\temp\SecurityXml.txt")
ClassMethod Demo(filename = "", obj = "")
{
#Include %soap
    if (obj = "") {
        s obj =class(MyApp.Person).%OpenId(1)
   }
    //从此启用XML的对象创建流
    set writer =class(%XML.Writer).%New()
    set stream =class(%GlobalCharacterStream).%New()
    set status = writer.OutputToStream(stream)
    if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit }
    set status = writer.RootObject(obj)
    if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit }
    do stream.Rewind()
    set container = ..%New()             ; 这就是我们要写出的对象
    set cred =class(%SYS.X509Credentials).GetByAlias("servercred")
    set parts  =$$$SOAPWSIncludeNone
    set ref = $$$KeyInfoX509Certificate
    set key =class(%XML.Security.EncryptedKey).CreateX509(cred, parts, ref)
    set container.Key = key        ; 这个细节取决于类
    //需要创建一个键列表(本例中仅为一个)
    set keys =class(%Collection.ListOfObj).%New()
    do keys.Insert(key)
    set encdata =class(%XML.Security.EncryptedData).%New()
    set status = encdata.EncryptStream(stream, keys)
    set container.Data = encdata   ; 这个细节取决于类
    // 为容器写输出
    set writer =class(%XML.Writer).%New()
    set writer.Indent = 1
    if (filename'="") {
        set status = writer.OutputToFile(filename)
        if $$$ISERR(status) {
     do $system.OBJ.DisplayError(status) quit}
	}
    set status = writer.RootObject(container)
    if $$$ISERR(status) {
     do $system.OBJ.DisplayError(status) quit}
}
```

此方法可以接受任何启用XML的类的`OREF`；如果没有提供，则使用默认值。

## 解密加密的XML文件

### 解密的前提条件

在解密加密的`XML`文档之前，必须同时提供以下两项：

- IRIS要使用的受信任证书。
- IRIS凭据集，其私钥与加密中使用的公钥匹配。

### 解密文档

要解密加密的XML文档，请执行以下操作：

**1、** 创建`%XML.Reader`实例打开并使用它打开文档；

**2、** 获取`Document`属性，`%XML.Reader`实例；

其中包含作为DOM的XML文档。
**3、** 使用阅读器的`correlation()`方法将``元素或元素与类`%XML.Security.EncryptedKey`关联起来；

例如:

```java
 do reader.Correlate("EncryptedKey","%XML.Security.EncryptedKey")
```

**1、** 遍历文档以读取``元素或多个元素；

为此，可以使用阅读器的`Next()`方法，该方法通过引用返回一个导入的对象(如果有的话)。

例如:

```java
if 'reader.Next(.ikey,.status) {
    write !,"Unable to import key",!
    do $system.OBJ.DisplayError(status)
    quit
    }
```

导入的对象`是%XML.Security.EncryptedKey`的实例。

**1、** 创建`%Library.ListOfObjects`的实例；

并使用它的`Insert()`方法插入`%XML.Security.EncryptedKey`的实例。

刚从文档中获得的。
**2、** 调用类`%XML.Security.EncryptedData`的`ValidateDocument()`方法；

```java
 set status=##class(%XML.Security.EncryptedData).ValidateDocument(.doc,keys)
```

第一个参数(通过引用返回)是在第2步中检索到的DOM的修改版本。

第二个参数是上一步中的键列表。

**1、** 可以选择使用`%XML.Writer`为修改后的DOM生成输出；

例如，前面显示的`CONTAINER`类包含以下类方法：

```java
ClassMethod DecryptDoc(filename As %String) 
{
#Include %soap
	set reader =class(%XML.Reader).%New()
	set status = reader.OpenFile(filename)
	if $$$ISERR(status) {
     do $System.Status.DisplayError(status) quit }
	set doc = reader.Document
	//获取<Signature>元素
	do reader.Correlate("EncryptedKey","%XML.Security.EncryptedKey")
	if 'reader.Next(.ikey,.status) {
		write !,"无法导入密钥",!
		do $system.OBJ.DisplayError(status)
		quit
	}
	set keys =class(%Collection.ListOfObj).%New()
	do keys.Insert(ikey)
	// 以下步骤返回解密的文档
	set status =class(%XML.Security.EncryptedData).ValidateDocument(.doc,keys)
	set writer =class(%XML.Writer).%New()
	set writer.Indent = 1
	do writer.Document(doc)
	quit $$$OK
}
```
