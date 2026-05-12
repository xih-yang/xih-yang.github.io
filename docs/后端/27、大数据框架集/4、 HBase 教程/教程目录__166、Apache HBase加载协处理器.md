# 166、Apache HBase加载协处理器
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/166.html
- 分类：大数据框架
- 分组：教程目录
## 加载协处理器

要使您的协处理器可用于HBase，必须静态（通过HBase配置）或动态（使用HBase Shell或Java API）加载它。

### 静态加载

请按照以下步骤静态加载协处理器。请记住，必须重新启动HBase才能卸载已静态加载的协处理器。

**1、** 在hbase-site.xml中定义协处理器，其中元素带有和子元素应该是以下之一：

```java
 *  对于RegionObservers和Endpoints是hbase.coprocessor.region.classes。
 *  对于WALObservers是hbase.coprocessor.wal.classes。
 *  对于MasterObservers是hbase.coprocessor.master.classes。  
    <value>必须包含协处理器实现类的完全限定类名。  
    例如，要加载协处理器（在类SumEndPoint.java中实现），您必须在RegionServer的'hbase-site.xml'文件中创建以下条目（通常位于'conf'目录下）：
```

```java
        <property>
            <name>hbase.coprocessor.region.classes</name>
            <value>org.myname.hbase.coprocessor.endpoint.SumEndPoint</value> 
        </property>       
```

```java
    如果为加载指定了多个类，则类名必须以逗号分隔。框架尝试使用默认的类加载器加载所有已配置的类。因此，jar文件必须驻留在服务器端HBase类路径中。  
    以这种方式加载的协处理器将在所有表的所有区域上处于活动状态。这些也称为系统协处理器。将为第一个列出的协处理器分配优先级Coprocessor.Priority.SYSTEM。列表中的每个后续协处理器的优先级值都会增加1（这会降低其优先级，因为优先级具有整数的自然排序顺序）。  
    当调用注册的观察者时，框架以其优先级的排序顺序执行其回调方法。关系是任意破坏的。
```

**2、** 将您的代码放在HBase的类路径上一种简单的方法是将jar（包含代码和所有依赖项）放入HBase的安装目录lib/中；

**3、** 重启HBase；

### 静态卸载

**1、** 从hbase-site.xml中删除协处理器的元素，包括子元素；

**2、** 重启HBase；

**3、** （可选）从类路径或HBase的lib/目录中删除协处理器的JAR文件；

### 动态加载

您也可以动态加载协处理器，而无需重新启动HBase。这似乎比静态加载更好，但动态加载的协处理器是基于每个表加载的，并且只能用于加载它们的表。因此，动态加载的表有时称为表协处理器（**Table Coprocessor**）。

此外，动态加载协处理器充当表上的模式更改，并且必须使表脱机以加载协处理器。

有三种方法可以动态加载协处理器。

以下说明做了如下假设：

- 一个叫做coprocessor.jar的JAR包含了协处理器实现以及它的所有依赖项。
- 该JAR在HDFS中的某些位置 (如，hdfs:// : /user/ /coprocessor.jar ) 中可用。

#### 使用HBase Shell

**1、** 使用HBaseShell禁用表：

```java
    hbase> disable 'users'
```

**2、** 使用如下命令加载协处理器：

```java
    hbase alter 'users', METHOD => 'table_att', 'Coprocessor'=>'hdfs://<namenode>:<port>/
    user/<hadoop-user>/coprocessor.jar| org.myname.hbase.Coprocessor.RegionObserverExample|1073741823| 
    arg1=1,arg2=2'
```

```java
协处理器框架将尝试从协处理器表属性值中读取类信息。该值包含由pipe（|）字符分隔的四条信息。
 *  文件路径：包含协处理器实现的jar文件必须位于所有区域服务器都可以读取它的位置。  
    您可以将文件复制到每个区域服务器上的本地磁盘上，但建议将其存储在HDFS中。  
    [HBASE-14548][]允许指定包含jar或一些通配符的目录，例如：hdfs://<namenode>:<port>/user/<hadoop-user>/，或hdfs://<namenode>:<port>/user/<hadoop-user>/\*.jar。请注意，如果指定了目录，则会添加目录中的所有jar文件（.jar）。它不搜索子目录中的文件。如果要指定目录，请不要使用通配符。此增强功能也适用于通过JAVA API的用法。
 *  类名：协处理器的完整类名。
 *  优先级：整数。该框架将使用优先级确定在同一个钩子上注册的所有已配置观察者的执行顺序。该字段可以保留为空。在这种情况下，框架将分配默认优先级值。
```

**3、** 启用该表；

```java
    hbase(main):003:0> enable 'users'
```

**4、** 验证协处理器已加载：

```java
    hbase(main):04:0> describe 'users'
```

```java
协处理器应列在TABLE\_ATTRIBUTES。
```

#### 使用Java API（所有HBase版本）

下面的Java代码演示如何使用HTableDescriptor的setValue()方法在”用户”表上加载协处理器。

```java
TableName tableName = TableName.valueOf("users");
String path = "hdfs://<namenode>:<port>/user/<hadoop-user>/coprocessor.jar";
Configuration conf = HBaseConfiguration.create();
Connection connection = ConnectionFactory.createConnection(conf);
Admin admin = connection.getAdmin();
admin.disableTable(tableName);
HTableDescriptor hTableDescriptor = new HTableDescriptor(tableName);
HColumnDescriptor columnFamily1 = new HColumnDescriptor("personalDet");
columnFamily1.setMaxVersions(3);
hTableDescriptor.addFamily(columnFamily1);
HColumnDescriptor columnFamily2 = new HColumnDescriptor("salaryDet");
columnFamily2.setMaxVersions(3);
hTableDescriptor.addFamily(columnFamily2);
hTableDescriptor.setValue("COPROCESSOR$1", path + "|"
+ RegionObserverExample.class.getCanonicalName() + "|"
+ Coprocessor.PRIORITY_USER);
admin.modifyTable(tableName, hTableDescriptor);
admin.enableTable(tableName);
```

#### 使用Java API（仅限HBase 0.96+）

在HBase 0.96及更新版本中，该HTableDescriptor的addCoprocessor()方法提供了一种动态加载协处理器的简便方法。

```java
TableName tableName = TableName.valueOf("users");
Path path = new Path("hdfs://<namenode>:<port>/user/<hadoop-user>/coprocessor.jar");
Configuration conf = HBaseConfiguration.create();
Connection connection = ConnectionFactory.createConnection(conf);
Admin admin = connection.getAdmin();
admin.disableTable(tableName);
HTableDescriptor hTableDescriptor = new HTableDescriptor(tableName);
HColumnDescriptor columnFamily1 = new HColumnDescriptor("personalDet");
columnFamily1.setMaxVersions(3);
hTableDescriptor.addFamily(columnFamily1);
HColumnDescriptor columnFamily2 = new HColumnDescriptor("salaryDet");
columnFamily2.setMaxVersions(3);
hTableDescriptor.addFamily(columnFamily2);
hTableDescriptor.addCoprocessor(RegionObserverExample.class.getCanonicalName(), path,
Coprocessor.PRIORITY_USER, null);
admin.modifyTable(tableName, hTableDescriptor);
admin.enableTable(tableName);
```

> 无法保证框架将成功加载给定的协处理器。例如，shell命令既不保证特定位置存在jar文件，也不验证给定类是否实际包含在jar文件中。

### 动态卸载

#### 使用HBase Shell

**1、** 禁用该表；

```java
    hbase> disable 'users'
```

**2、** 更改表以删除协处理器；

```java
    hbase> alter 'users', METHOD => 'table_att_unset', NAME => 'coprocessor$1'
```

**3、** 启用该表；

```java
    hbase> enable 'users'
```

#### 使用Java API

重新加载表定义，而无需使用setValue()或addCoprocessor()方法设置协处理器的值。这将删除附加到表的任何协处理器。

```java
TableName tableName = TableName.valueOf("users");
String path = "hdfs://<namenode>:<port>/user/<hadoop-user>/coprocessor.jar";
Configuration conf = HBaseConfiguration.create();
Connection connection = ConnectionFactory.createConnection(conf);
Admin admin = connection.getAdmin();
admin.disableTable(tableName);
HTableDescriptor hTableDescriptor = new HTableDescriptor(tableName);
HColumnDescriptor columnFamily1 = new HColumnDescriptor("personalDet");
columnFamily1.setMaxVersions(3);
hTableDescriptor.addFamily(columnFamily1);
HColumnDescriptor columnFamily2 = new HColumnDescriptor("salaryDet");
columnFamily2.setMaxVersions(3);
hTableDescriptor.addFamily(columnFamily2);
admin.modifyTable(tableName, hTableDescriptor);
admin.enableTable(tableName);
```

在HBase 0.96及更新版本中，您可以改为使用该HTableDescriptor类的removeCoprocessor()方法。
