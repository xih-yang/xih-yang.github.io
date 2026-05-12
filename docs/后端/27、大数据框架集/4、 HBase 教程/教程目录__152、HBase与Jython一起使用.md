# 152、HBase与Jython一起使用
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/152.html
- 分类：大数据框架
- 分组：教程目录
## Jython

### 设置类路径

要将Jython与HBase一起使用，您的CLASSPATH必须包含HBase的类路径以及代码所需的Jython JAR。

将路径设置为包含Jython .jar的目录，以及每个项目需要的附加的Jython相关JAR。然后导出指向 `$` JYTHON_HOME环境变量的HBASE_CLASSPATH。

```java
$ export HBASE_CLASSPATH=/directory/jython.jar
```

在类路径中使用HBase和Hadoop JAR启动Jython shell： `$` bin / hbase org.python.util.jython

### Jython代码示例

**使用Jython创建表，填充，获取和删除表**

以下Jython代码示例检查表，如果存在，则删除它然后创建它。然后，它使用数据填充表并获取数据。

```java
import java.lang
from org.apache.hadoop.hbase import HBaseConfiguration, HTableDescriptor, HColumnDescriptor, TableName
from org.apache.hadoop.hbase.client import Admin, Connection, ConnectionFactory, Get, Put, Result, Table
from org.apache.hadoop.conf import Configuration
# First get a conf object.  This will read in the configuration
# that is out in your hbase-*.xml files such as location of the
# hbase master node.
conf = HBaseConfiguration.create()
connection = ConnectionFactory.createConnection(conf)
admin = connection.getAdmin()
# Create a table named 'test' that has a column family
# named 'content'.
tableName = TableName.valueOf("test")
table = connection.getTable(tableName)
desc = HTableDescriptor(tableName)
desc.addFamily(HColumnDescriptor("content"))
# Drop and recreate if it exists
if admin.tableExists(tableName):
    admin.disableTable(tableName)
    admin.deleteTable(tableName)
admin.createTable(desc)
# Add content to 'column:' on a row named 'row_x'
row = 'row_x'
put = Put(row)
put.addColumn("content", "qual", "some content")
table.put(put)
# Now fetch the content just added, returns a byte[]
get = Get(row)
result = table.get(get)
data = java.lang.String(result.getValue("content", "qual"), "UTF8")
print "The fetched row contains the value '%s'" % data
```

**使用Jython进行表扫描**

此示例扫描表并返回与给定族限定符匹配的结果。

```java
import java.lang
from org.apache.hadoop.hbase import TableName, HBaseConfiguration
from org.apache.hadoop.hbase.client import Connection, ConnectionFactory, Result, ResultScanner, Table, Admin
from org.apache.hadoop.conf import Configuration
conf = HBaseConfiguration.create()
connection = ConnectionFactory.createConnection(conf)
admin = connection.getAdmin()
tableName = TableName.valueOf('wiki')
table = connection.getTable(tableName)
cf = "title"
attr = "attr"
scanner = table.getScanner(cf)
while 1:
    result = scanner.next()
    if not result:
       break
    print java.lang.String(result.row), java.lang.String(result.getValue(cf, attr))
```
