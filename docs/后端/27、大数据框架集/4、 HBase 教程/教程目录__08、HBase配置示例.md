# 08、HBase配置示例
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/8.html
- 分类：大数据框架
- 分组：教程目录
## 基本分布式HBase安装

在下文内容中是一个分布式10节点的群集的基本配置示例：其中，节点被命名为example0，example1…一直到example9，在这个例子中；HBase Master和HDFS NameNode正在节点example0上运行；RegionServers在节点example1- example9上运行；一个3节点ZooKeeper集合运行在example1、example2，以及example3的默认端口上；ZooKeeper的数据被保存到：directory/export/zookeeper。

下面我们显示在HBase conf目录中找到的主要配置文件  -hbase-site.xml，regionservers和hbase-env.sh。

### HBase-site.xml

```java
<?xml version="1.0"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
  <property>
    <name>hbase.zookeeper.quorum</name>
    <value>example1,example2,example3</value>
    <description>The directory shared by RegionServers.
    </description>
  </property>
  <property>
    <name>hbase.zookeeper.property.dataDir</name>
    <value>/export/zookeeper</value>
    <description>Property from ZooKeeper config zoo.cfg.
    The directory where the snapshot is stored.
    </description>
  </property>
  <property>
    <name>hbase.rootdir</name>
    <value>hdfs://example0:8020/hbase</value>
    <description>The directory shared by RegionServers.
    </description>
  </property>
  <property>
    <name>hbase.cluster.distributed</name>
    <value>true</value>
    <description>The mode the cluster will be in. Possible values are
      false: standalone and pseudo-distributed setups with managed ZooKeeper
      true: fully-distributed with unmanaged ZooKeeper Quorum (see hbase-env.sh)
    </description>
  </property>
</configuration>
```

### regionservers

在此文件中列出将运行RegionServers的节点。在我们的例子中，这些节点是example1- example9。

```java
example1
example2
example3
example4
example5
example6
example7
example8
example9
```

### hbase-env.sh

hbase-env.sh文件中的以下行显示了如何设置JAVA_HOME环境变量（HBase需要的）并将堆设置为4 GB（而不是默认值1 GB）。如果您复制并粘贴此示例，请务必调整JAVA_HOME以适合您的环境。

```java
# The java implementation to use.
export JAVA_HOME=/usr/java/jdk1.8.0/
# The maximum amount of heap to use. Default is left to JVM default.
export HBASE_HEAPSIZE=4G
```

使用rsync将conf目录的内容复制到群集的所有节点。
