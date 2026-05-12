# 151、HBase与Scala一起使用
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/151.html
- 分类：大数据框架
- 分组：教程目录
## Scala

### 设置类路径

要将Scala与HBase一起使用，您的CLASSPATH必须包含HBase的类路径以及代码所需的Scala JAR。首先，在运行HBase RegionServer进程的服务器上使用以下命令，以获取HBase的类路径。

```java
$ ps aux |grep regionserver| awk -F 'java.library.path=' {'print $2'} | awk {'print $1'}
/usr/lib/hadoop/lib/native:/usr/lib/hbase/lib/native/Linux-amd64-64
```

设置 `$` CLASSPATH环境变量以包括您在上一步中找到的路径，以及项目所需的scala-library.jar路径和每个与Scala相关的其他JAR。

```java
$ export CLASSPATH=$CLASSPATH:/usr/lib/hadoop/lib/native:/usr/lib/hbase/lib/native/Linux-amd64-64:/path/to/scala-library.jar
```

### Scala SBT文件

您的build.sbt文件需要以下解析程序和libraryDependencies才能与HBase一起使用。

```java
resolvers += "Apache HBase" at "https://repository.apache.org/content/repositories/releases"
resolvers += "Thrift" at "https://people.apache.org/~rawson/repo/"
libraryDependencies ++= Seq(
    "org.apache.hadoop" % "hadoop-core" % "0.20.2",
    "org.apache.hbase" % "hbase" % "0.90.4"
)
```

### Scala代码示例

此示例列出HBase表，创建新表并向其添加行：

```java
import org.apache.hadoop.hbase.HBaseConfiguration
import org.apache.hadoop.hbase.client.{Connection,ConnectionFactory,HBaseAdmin,HTable,Put,Get}
import org.apache.hadoop.hbase.util.Bytes
val conf = new HBaseConfiguration()
val connection = ConnectionFactory.createConnection(conf);
val admin = connection.getAdmin();
// list the tables
val listtables=admin.listTables()
listtables.foreach(println)
// let's insert some data in 'mytable' and get the row
val table = new HTable(conf, "mytable")
val theput= new Put(Bytes.toBytes("rowkey1"))
theput.add(Bytes.toBytes("ids"),Bytes.toBytes("id1"),Bytes.toBytes("one"))
table.put(theput)
val theget= new Get(Bytes.toBytes("rowkey1"))
val result=table.get(theget)
val value=result.value()
println(Bytes.toString(value))
```
