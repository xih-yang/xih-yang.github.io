# 149、HBase：REST服务器
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/149.html
- 分类：大数据框架
- 分组：教程目录
## REST

REST代表状态转移，它于2000年在Roy Fielding的博士论文中引入，他是HTTP规范的主要作者之一。

REST本身超出了本文档的范围，但通常，REST允许通过与URL本身绑定的API进行客户端-服务器交互。本节讨论如何配置和运行HBase附带的REST服务器，该服务器将HBase表，行，单元和元数据作为URL指定的资源公开。

### 启动和停止REST服务器

包含的REST服务器可以作为守护程序运行，该守护程序启动嵌入式Jetty servlet容器并将servlet部署到其中。使用以下命令之一在前台或后台启动REST服务器。端口是可选的，默认为8080。

```java
# Foreground
$ bin/hbase rest start -p <port>
# Background, logging to a file in $HBASE_LOGS_DIR
$ bin/hbase-daemon.sh start rest -p <port>
```

要停止REST服务器，请在前台运行时使用Ctrl-C，如果在后台运行则使用以下命令。

```java
$ bin/hbase-daemon.sh stop rest
```

### 配置REST服务器和客户端

有关为SSL配置REST服务器和客户端以及为REST服务器配置doAs模拟的信息，请参阅[配置Thrift网关以代表客户端进行身份验证](https://www.w3cschool.cn/hbase_doc/hbase_doc-4wi32ofd.html)以及[Securing Apache HBase](https://www.w3cschool.cn/hbase_doc/hbase_doc-5xrl2o6a.html)章节的其他部分。

#### 使用REST端点

以下示例使用占位符服务器http://example.com:8000，并且可以使用curl或wget命令运行以下命令。您可以通过不为纯文本添加头信息来请求纯文本(默认)，XML或JSON输出，或者为XML添加头信息“Accept：text / xml”，为JSON添加“Accept：application / json”或为协议缓冲区添加“Accept: application/x-protobuf”。

除非指定，否则使用GET请求进行查询，PUT或POST请求进行创建或修改，DELETE用于删除。

**群集范围的端点**

```json
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\
```

端点
HTTP动词
描述
示例

/version/cluster

GET

在此群集上运行的HBase版本

/status/cluster

GET

群集状态

/

GET

所有非系统表的列表

**命名空间端点**

```json
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\
```

端点
HTTP动词
描述
示例

/namespaces

GET

列出所有命名空间

/namespaces/namespace

GET

描述特定的命名空间

/namespaces/namespace

POST

创建一个新的命名空间

/namespaces/namespace/tables

GET

列出特定命名空间中的所有表

/namespaces/namespace

PUT

更改现有命名空间。目前尚未使用

/namespaces/namespace

DELETE

删除命名空间。命名空间必须为空

**表端点**

```json
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
"Content-Type: text/xml" \\  
'`<?xml version="1.0" encoding="UTF-8"?>`<TableSchema name="users">`<ColumnSchema name="cf" KEEP\_DELETED\_CELLS="true" />`</TableSchema>`' \\  
“\ 
“\ 
"Accept: text/xml" \\  
"Content-Type: text/xml" \\  
'`<?xml version="1.0" encoding="UTF-8"?>`<TableSchema name="users">`<ColumnSchema name="cf" />`</TableSchema>`' \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\
```

端点
HTTP动词
描述
示例

/table/schema

GET

描述指定表的架构

/table/schema

POST

使用提供的架构片段更新现有表

/table/schema

PUT

创建新表，或替换现有表的架构

/table/schema

DELETE

删除表格。您必须使用端点/table/schema/，而不仅仅是table/

/table/regions

GET

列出表区域

**Get操作的端点**

```json
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
ttp://example.com:8000/users/row1/cf:a"
\-vi -X GET \\  
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\
```

端点
HTTP动词
描述
示例

/table/row

GET

获取单行的所有列。值为Base-64编码。这需要“Accept”请求标头，其类型可以包含多个列（如xml，json或protobuf）。

/table/row/column:qualifier/timestamp

GET

获取单个列的值。值为Base-64编码。

/table/row/column:qualifier

GET

获取单个列的值。值为Base-64编码。

/table/row/column:qualifier/?v=number_of_versions

GET

Multi-获取给定单元格的指定数量的版本。值为Base-64编码。

**Scan操作的端点**

```json
“\ 
"Accept: text/xml" \\  
"Content-Type: text/xml" \\  
'`<Scanner batch="1"/>`' \\  
“\ 
“\ 
"Accept: text/xml" \\  
"Content-Type:text/xml" \\  
@filter.txt \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\ 
“\ 
"Accept: text/xml" \\  
“\
```

端点
HTTP动词
描述
示例

/table/scanner/

PUT

获取Scanner对象。所有其他扫描操作都需要。将批处理参数调整为扫描应在批处理中返回的行数。请参阅下一个向扫描仪添加过滤器的示例。扫描程序端点URL将作为HTTP响应中的Location返回。此表中的其他示例假定扫描程序端点为：http://example.com:8000/users/scanner/145869072824375522207。

/table/scanner/

PUT

要向扫描仪对象提供过滤器或以任何其他方式配置扫描仪，您可以创建文本文件并将过滤器添加到文件中。例如，要仅返回以 u123 开头并使用批量大小为100的行，过滤器文件将如下所示：

[source，xml] —-   {“type”：“PrefixFilter”，“value”：“u123”}   —-

将文件传递给curl请求的-d参数。

/table/scanner/scanner-id

GET

从扫描仪获取下一批。单元格值是字节编码的。如果扫描仪已耗尽，则返回HTTP状态204。

table/scanner/scanner-id

DELETE

删除扫描仪并释放它使用的资源。

**Put操作的端点**

```json
“\ 
"Accept: text/xml" \\  
"Content-Type: text/xml" \\  
'`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`<CellSet>`<Row key="cm93NQo=">`<Cell column="Y2Y6ZQo=">`dmFsdWU1Cg==`</Cell>`</Row>`</CellSet>`' \\  
ttp://example.com:8000/users/fakerow"
\-vi -X PUT \\  
"Accept: text/json" \\  
"Content-Type: text/json" \\  
'\{"Row":\[\{"key":"cm93NQo=", "Cell": \[\{"column":"Y2Y6ZQo=", " `$` ":"dmFsdWU1Cg=="\}\]\}\]\}'' \\  
“\
```

端点
HTTP动词
描述
示例

/table/row_key

PUT

在表中写一行。行、列限定符和值必须均为Base-64编码。要对字符串进行编码，请使用base64命令行实用程序。要解码字符串，请使用base64 -d。有效负载位于–data参数中，/users/fakerow值为占位符。通过将多行添加到元素中来插入多行。您还可以将要插入的数据保存到文件中，并使用-d @filename.txt语法将其传递给参数-d。

### REST XML架构

```java
<schema xmlns="http://www.w3.org/2001/XMLSchema" xmlns:tns="RESTSchema">
  <element name="Version" type="tns:Version"></element>
  <complexType name="Version">
    <attribute name="REST" type="string"></attribute>
    <attribute name="JVM" type="string"></attribute>
    <attribute name="OS" type="string"></attribute>
    <attribute name="Server" type="string"></attribute>
    <attribute name="Jersey" type="string"></attribute>
  </complexType>
  <element name="TableList" type="tns:TableList"></element>
  <complexType name="TableList">
    <sequence>
      <element name="table" type="tns:Table" maxOccurs="unbounded" minOccurs="1"></element>
    </sequence>
  </complexType>
  <complexType name="Table">
    <sequence>
      <element name="name" type="string"></element>
    </sequence>
  </complexType>
  <element name="TableInfo" type="tns:TableInfo"></element>
  <complexType name="TableInfo">
    <sequence>
      <element name="region" type="tns:TableRegion" maxOccurs="unbounded" minOccurs="1"></element>
    </sequence>
    <attribute name="name" type="string"></attribute>
  </complexType>
  <complexType name="TableRegion">
    <attribute name="name" type="string"></attribute>
    <attribute name="id" type="int"></attribute>
    <attribute name="startKey" type="base64Binary"></attribute>
    <attribute name="endKey" type="base64Binary"></attribute>
    <attribute name="location" type="string"></attribute>
  </complexType>
  <element name="TableSchema" type="tns:TableSchema"></element>
  <complexType name="TableSchema">
    <sequence>
      <element name="column" type="tns:ColumnSchema" maxOccurs="unbounded" minOccurs="1"></element>
    </sequence>
    <attribute name="name" type="string"></attribute>
    <anyAttribute></anyAttribute>
  </complexType>
  <complexType name="ColumnSchema">
    <attribute name="name" type="string"></attribute>
    <anyAttribute></anyAttribute>
  </complexType>
  <element name="CellSet" type="tns:CellSet"></element>
  <complexType name="CellSet">
    <sequence>
      <element name="row" type="tns:Row" maxOccurs="unbounded" minOccurs="1"></element>
    </sequence>
  </complexType>
  <element name="Row" type="tns:Row"></element>
  <complexType name="Row">
    <sequence>
      <element name="key" type="base64Binary"></element>
      <element name="cell" type="tns:Cell" maxOccurs="unbounded" minOccurs="1"></element>
    </sequence>
  </complexType>
  <element name="Cell" type="tns:Cell"></element>
  <complexType name="Cell">
    <sequence>
      <element name="value" maxOccurs="1" minOccurs="1">
        <simpleType><restriction base="base64Binary">
        </simpleType>
      </element>
    </sequence>
    <attribute name="column" type="base64Binary" />
    <attribute name="timestamp" type="int" />
  </complexType>
  <element name="Scanner" type="tns:Scanner"></element>
  <complexType name="Scanner">
    <sequence>
      <element name="column" type="base64Binary" minOccurs="0" maxOccurs="unbounded"></element>
    </sequence>
    <sequence>
      <element name="filter" type="string" minOccurs="0" maxOccurs="1"></element>
    </sequence>
    <attribute name="startRow" type="base64Binary"></attribute>
    <attribute name="endRow" type="base64Binary"></attribute>
    <attribute name="batch" type="int"></attribute>
    <attribute name="startTime" type="int"></attribute>
    <attribute name="endTime" type="int"></attribute>
  </complexType>
  <element name="StorageClusterVersion" type="tns:StorageClusterVersion" />
  <complexType name="StorageClusterVersion">
    <attribute name="version" type="string"></attribute>
  </complexType>
  <element name="StorageClusterStatus"
    type="tns:StorageClusterStatus">
  </element>
  <complexType name="StorageClusterStatus">
    <sequence>
      <element name="liveNode" type="tns:Node"
        maxOccurs="unbounded" minOccurs="0">
      </element>
      <element name="deadNode" type="string" maxOccurs="unbounded"
        minOccurs="0">
      </element>
    </sequence>
    <attribute name="regions" type="int"></attribute>
    <attribute name="requests" type="int"></attribute>
    <attribute name="averageLoad" type="float"></attribute>
  </complexType>
  <complexType name="Node">
    <sequence>
      <element name="region" type="tns:Region"
   maxOccurs="unbounded" minOccurs="0">
      </element>
    </sequence>
    <attribute name="name" type="string"></attribute>
    <attribute name="startCode" type="int"></attribute>
    <attribute name="requests" type="int"></attribute>
    <attribute name="heapSizeMB" type="int"></attribute>
    <attribute name="maxHeapSizeMB" type="int"></attribute>
  </complexType>
  <complexType name="Region">
    <attribute name="name" type="base64Binary"></attribute>
    <attribute name="stores" type="int"></attribute>
    <attribute name="storefiles" type="int"></attribute>
    <attribute name="storefileSizeMB" type="int"></attribute>
    <attribute name="memstoreSizeMB" type="int"></attribute>
    <attribute name="storefileIndexSizeMB" type="int"></attribute>
  </complexType>
</schema>
```

### REST Protobufs架构

```java
message Version {
  optional string restVersion = 1;
  optional string jvmVersion = 2;
  optional string osVersion = 3;
  optional string serverVersion = 4;
  optional string jerseyVersion = 5;
}
message StorageClusterStatus {
  message Region {
    required bytes name = 1;
    optional int32 stores = 2;
    optional int32 storefiles = 3;
    optional int32 storefileSizeMB = 4;
    optional int32 memstoreSizeMB = 5;
    optional int32 storefileIndexSizeMB = 6;
  }
  message Node {
    required string name = 1;    // name:port
    optional int64 startCode = 2;
    optional int32 requests = 3;
    optional int32 heapSizeMB = 4;
    optional int32 maxHeapSizeMB = 5;
    repeated Region regions = 6;
  }
  // node status
  repeated Node liveNodes = 1;
  repeated string deadNodes = 2;
  // summary statistics
  optional int32 regions = 3;
  optional int32 requests = 4;
  optional double averageLoad = 5;
}
message TableList {
  repeated string name = 1;
}
message TableInfo {
  required string name = 1;
  message Region {
    required string name = 1;
    optional bytes startKey = 2;
    optional bytes endKey = 3;
    optional int64 id = 4;
    optional string location = 5;
  }
  repeated Region regions = 2;
}
message TableSchema {
  optional string name = 1;
  message Attribute {
    required string name = 1;
    required string value = 2;
  }
  repeated Attribute attrs = 2;
  repeated ColumnSchema columns = 3;
  // optional helpful encodings of commonly used attributes
  optional bool inMemory = 4;
  optional bool readOnly = 5;
}
message ColumnSchema {
  optional string name = 1;
  message Attribute {
    required string name = 1;
    required string value = 2;
  }
  repeated Attribute attrs = 2;
  // optional helpful encodings of commonly used attributes
  optional int32 ttl = 3;
  optional int32 maxVersions = 4;
  optional string compression = 5;
}
message Cell {
  optional bytes row = 1;       // unused if Cell is in a CellSet
  optional bytes column = 2;
  optional int64 timestamp = 3;
  optional bytes data = 4;
}
message CellSet {
  message Row {
    required bytes key = 1;
    repeated Cell values = 2;
  }
  repeated Row rows = 1;
}
message Scanner {
  optional bytes startRow = 1;
  optional bytes endRow = 2;
  repeated bytes columns = 3;
  optional int32 batch = 4;
  optional int64 startTime = 5;
  optional int64 endTime = 6;
}
```
