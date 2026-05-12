# 02、HBase 快速启动
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/2.html
- 分类：大数据框架
- 分组：教程目录
## HBase 入门——独立式HBase

在本节中，你将首先学习单节点、独立的HBase的设置，并且学会运行单节点、独立的HBase实例！

在一个独立的HBase实例中，它具有所有的HBase系统服务程序：Master、RegionServers 和 [ZooKeeper](https://www.w3cschool.cn/zookeeper/)（在一个持续到本地文件系统的单一 JVM 中运行）。这是我们最基本的部署配置文件。我们将向您展示如何使用 HBase shell CLI 在 HBase 中创建表，在表中插入行，对表执行放置和扫描操作，启用或禁用表，以及启动和停止 HBase。除了下载 HBase，只要10分钟就可以完成以下的操作。

**注意：**在HBase 0.94.x之前，HBase预计环回IP地址为127.0.0.1。Ubuntu和其他一些发行版默认为127.0.1.1，这会给你带来问题。请参阅[为什么HBase关心/ etc / hosts？](https://web-beta.archive.org/web/20140104070155/http://blog.devving.com/why-does-hbase-care-about-etchosts)为细节

以下/etc/hosts文件可以在Ubuntu的HBase 0.94.x及更早版本上正确运行。如果遇到麻烦，请将其作为模板使用。

```java
127.0.0.1 localhost
ubuntu.ubuntu-domain Ubuntu下的127.0.0.1
```

这个问题已经在hbase-0.96.0及更高版本中得到修复。

## JDK版本要求

HBase要求[安装JDK](https://www.w3cschool.cn/java/java-environment-setup.html)。

## HBase下载与启动

选择一个[Apache 下载镜像](http://www.apache.org/dyn/closer.cgi/hbase/)，下载 HBase Releases。点击stable目录，然后下载后缀为.tar.gz的二进制文件到你的到本地文件系统；例如 hbase-0.95-SNAPSHOT.tar.gz。

解压下载的文件，然后进入到那个要解压的目录。

```java
$ tar xfz hbase-0.95-SNAPSHOT.tar.gz
$ cd hbase-0.95-SNAPSHOT
```

在你启动HBase之前，需要先设置 JAVA_HOME 环境变量。您可以通过操作系统的常规机制来设置变量，但HBase提供了一个中心机制 conf/hbase-env.sh，编辑此文件，取消注释以下行JAVA_HOME，并将其设置为您的操作系统的适当位置，JAVA_HOME 变量应设置为包含可执行文件 bin/JAVA 的目录。大多数现代 Linux 操作系统都提供了一种机制，例如在 RHEL 或 CentOS 上的替代方法，用于在 Java 等可执行版本之间进行透明切换。在这种情况下，您可以将 JAVA_HOME 设置为包含指向 bin/JAVA 的符号链接的目录，这通常是：/usr。

```java
JAVA_HOME = / USR
```

编辑conf/hbase-site.xml，这是HBase的主要配置文件。此时，您只需要在HBase和ZooKeeper写入数据的本地文件系统上指定目录即可。默认情况下，在/tmp下创建一个新目录。许多服务器被配置为在重启时删除/tmp的内容，所以你应该在其他地方存储数据。以下配置将把HBase的数据存储在hbase目录下的testuser用户主目录中。将``标签粘贴到标签下``，在新的HBase安装中应该是空的。

独立HBase的hbase-site.xml：

```java
<configuration>
  <property>
    <name>hbase.rootdir</name>
    <value>file:///home/testuser/hbase</value>
  </property>
  <property>
    <name>hbase.zookeeper.property.dataDir</name>
    <value>/home/testuser/zookeeper</value>
  </property>
</configuration>
```

您不需要创建HBase数据目录，HBase会为你做这个。

注意：上述示例中的hbase.rootdir指向本地文件系统中的一个目录。’file：/’前缀是我们如何表示本地文件系统。要在现有的HDFS实例上安装HBase，请将hbase.rootdir设置为指向您实例上的目录：例如，hdfs：//namenode.example.org：8020/hbase。有关更多信息，请参见下面关于独立 HBase HDFS 的部分。

提供了bin/start-hbase.sh脚本来方便的启动HBase。发出命令，如果一切正常，则会将消息记录到标准输出，显示HBase已成功启动。您可以使用该jps命令来验证您是否有一个名为 HMaster 的正在运行的进程。在独立模式下，HBase在单个JVM中运行所有守护进程，即HMaster，单个HRegionServer和ZooKeeper守护进程。

为此，打开HBase主文件夹，然后运行HBase启动脚本，如下所示：

```java
$cd /usr/local/HBase/bin
$./start-hbase.sh
```

如果一切顺利，当运行HBase启动脚本，它会提示一条消息：HBase已经启动

```java
starting master, logging to /usr/local/HBase/bin/../logs/hbase-tpmaster-localhost.localdomain.out
```

提示：Java需要安装并可用。如果您得到一个错误，指示Java未安装，但它位于您的系统上（可能位于非标准位置），请编辑conf / hbase-env.sh文件，并将该JAVA_HOME设置修改为指向包含在你的系统上的bin/Java。

### shell练习——首次使用HBase

**1、** 连接到HBase使用HBaseshell命令连接到您的HBase运行实例，位于HBase安装的bin/目录中在本例中，省略了启动HBaseShell时打印的一些用法和版本信息；

```java
$ ./bin/hbase shell
hbase(main):001:0>
```

**2、** 显示HBaseShell帮助文本键入“help”并按“Enter”，以显示HBaseShell的一些基本用法信息以及几个示例命令请注意，表名、行、列都必须用引号字符括起来；

**3、** 创建一个表使用该“create”命令来创建一个新的表您必须指定表名称和ColumnFamily名称；

```java
 hbase(main):001:0> create 'test', 'cf'
 0 row(s) in 0.4170 seconds
 => Hbase::Table - test
```

**4、** 列出关于您的表的信息，通过使用“list”命令来实现：

```java
hbase(main):002:0> list 'test'
TABLE
test
1 row(s) in 0.0180 seconds
=> ["test"]
```

**5、** 把数据放到你的表中要将数据放入表中，请使用该“put”命令；

```java
hbase(main):003:0> put 'test', 'row1', 'cf:a', 'value1'
0 row(s) in 0.0850 seconds
hbase(main):004:0> put 'test', 'row2', 'cf:b', 'value2'
0 row(s) in 0.0110 seconds
hbase(main):005:0> put 'test', 'row3', 'cf:c', 'value3' 
0 row(s) in 0.0100 seconds
```

```java
在这里，我们插入三个值，一次一个。第一个插入是在row1，列cf:a，值为value1。HBase 中的列由列族前缀组成，在此示例中为cf，后跟一个冒号，然后是一个列限定符后缀（在本例中为 a）。
```

**6、** 一次扫描表中的所有数据从HBase获取数据的方法之一是扫描使用该“scan”命令扫描表中的数据你可以限制你的扫描，但现在，所有的数据都被提取；

```java
hbase(main):006:0> scan 'test'
ROW                                      COLUMN+CELL
 row1                                    column=cf:a, timestamp=1421762485768, value=value1
 row2                                    column=cf:b, timestamp=1421762491785, value=value2
 row3                                    column=cf:c, timestamp=1421762496210, value=value3
3 row(s) in 0.0230 seconds
```

**7、** 获取一行的数据要一次获取一行数据，请使用该“get”命令；

```java
hbase(main):007:0> get 'test', 'row1'
COLUMN                                   CELL
 cf:a                                    timestamp=1421762485768, value=value1
1 row(s) in 0.0350 seconds
```

**8、** 禁用表格如果您想删除表格或更改其设置以及其他一些情况，则需要先使用“disable”命令禁用表格您可以使用该“enable”命令重新启用它；

```java
hbase(main):008:0> disable 'test'
0 row(s) in 1.1820 seconds
hbase(main):009:0> enable 'test' 
0 row(s) in 0.1770 seconds
```

```java
如果您测试了上面的“enable”命令，请再次禁用表格：
```

```java
hbase(main):010:0> disable 'test'
0 row(s) in 1.1820 seconds
```

**9、** 删除表要删除表，请使用该“drop”命令；

```java
hbase(main):011:0> drop 'test'
0 row(s) in 0.1370 seconds
```

**10、** 退出HBaseShell要退出HBaseShell并断开与群集的连接，请使用该“quit”命令HBase仍然在后台运行；

### 停止HBase

**1、** 与提供bin/start-hbase.sh脚本以便方便地启动所有HBase守护进程相同，你可以使用bin/stop-hbase.sh脚本停止它们；

```java
$ ./bin/stop-hbase.sh
stopping hbase....................
$
```

**2、** 发出命令后，进程关闭可能需要几分钟的时间使用jps要确保HMASTER和HRegionServer进程被关闭；

以上向您展示了如何启动和停止一个独立的HBase实例。在接下来的部分中，我们将简要介绍一下HBase部署的其他模式。

## 在伪分布式模式安装HBase

在通过快速启动HBase的独立模式工作之后，您可以重新配置HBase以伪分布式模式运行。伪分布模式意味着HBase仍然在单个主机上完全运行，但是每个HBase守护进程（HMaster，HRegionServer和ZooKeeper）作为一个单独的进程运行：在独立模式下，所有守护进程都运行在一个jvm进程/实例中。默认情况下，除非按照快速启动HBase的独立模式中所述配置hbase.rootdir属性，否则您的数据仍存储在/tmp/中。在本演练中，我们将数据存储在HDFS中，假设您有HDFS可用。您可以跳过HDFS配置，继续将数据存储在本地文件系统中。

**Hadoop配置**

此过程假定您已在本地系统或远程系统上配置Hadoop和HDFS，并且它们正在运行且可用。它还假定您正在使用Hadoop 2。

**1、** 请停止HBase，如果它正在运行如果刚刚完成快速启动HBase的独立模式并且HBase仍在运行，请停止它这个过程将创建一个全新的目录，HBase将存储它的数据，所以你之前创建的任何数据库都将丢失；

**2、** 配置HBase编辑hbase-site.xml配置首先，添加以下指示HBase以分布式模式运行的属性，每个守护进程有一个JVM实例；

```java
<property>
  <name>hbase.cluster.distributed</name>
  <value>true</value> 
</property>
```

```java
接下来，将 hbase rootdir 从本地文件系统更改为您的 HDFS 实例的地址，使用 HDFS:////或 URI 语法。在这个例子中，HDFS在端口8020的本地主机上运行。
```

```java
<property>
  <name>hbase.rootdir</name>
  <value>hdfs://localhost:8020/hbase</value> 
</property>
```

```java
您不需要在HDFS中创建目录。HBase会为你做这个。如果你创建了这个目录，HBase会试图做一个迁移，这不是你想要的。
```

**3、** 启动HBase使用bin/start-hbase.sh命令启动HBase如果您的系统配置正确，该jps命令应显示HMaster和HRegionServer进程正在运行；

**4、** 检查HDFS中的HBase目录如果一切正常，HBase在HDFS中创建它的目录在上面的配置中，它存储在HDFS上的/hbase/中您可以使用hadoop的bin/目录中的hadoopfs命令来列出此目录；

```java
$ ./bin/hadoop fs -ls /hbase
Found 7 items
drwxr-xr-x   - hbase users          0 2014-06-25 18:58 /hbase/.tmp
drwxr-xr-x   - hbase users          0 2014-06-25 21:49 /hbase/WALs
drwxr-xr-x   - hbase users          0 2014-06-25 18:48 /hbase/corrupt
drwxr-xr-x   - hbase users          0 2014-06-25 18:58 /hbase/data
-rw-r--r--   3 hbase users         42 2014-06-25 18:41 /hbase/hbase.id
-rw-r--r--   3 hbase users          7 2014-06-25 18:41 /hbase/hbase.version
drwxr-xr-x   - hbase users          0 2014-06-25 21:49 /hbase/oldWALs
```

**5、** 创建一个表并使用数据填充它您可以使用HBaseShell创建一个表，使用数据填充它，使用与shell练习中相同的步骤扫描并从中获取值；

**6、** 启动和停止备份HBase主（HMaster）服务器；

```java
注意：在同一个硬件上运行多个HMaster实例在生产环境中是没有意义的，就像运行伪分布式集群对于生产没有意义一样。此步骤仅供测试和学习之用。
```

```java
HMaster服务器控制HBase集群。你可以启动最多9个备份HMaster服务器，这个服务器总共有10个HMaster计算主服务器。要启动备份HMaster，请使用local-master-backup.sh。对于要启动的每个备份主节点，请添加一个表示该主节点的端口偏移量的参数。每个HMaster使用三个端口（默认情况下为16010,16020和16030）。端口偏移量被添加到这些端口，因此使用偏移量2，备份HMaster将使用端口16012,16022和16032。以下命令使用端口：16012/16022/16032，16013/16023/16033和16015/16025/16035启动3个备份服务器。
```

```java
$ ./bin/local-master-backup.sh 2 3 5         
```

```java
要在不杀死整个群集的情况下杀死备份主机，则需要查找其进程ID（PID）。PID存储在一个名为/tmp/hbase-USER-X-master.pid的文件中。该文件的唯一内容是PID。您可以使用该kill -9命令来杀死该PID。以下命令将终止具有端口偏移1的主服务器，但保持群集正在运行：
```

```java
$ cat /tmp/hbase-testuser-1-master.pid |xargs kill -9
```

**7、** 启动和停止其他RegionServersHRegionServer按照HMaster的指示管理StoreFiles中的数据通常，一个HRegionServer在集群中的每个节点上运行在同一个系统上运行多个HRegionServers对于伪分布式模式下的测试非常有用该local-regionservers.sh命令允许您运行多个RegionServer它以类似的local-master-backup.sh命令的方式工作，因为您提供的每个参数都代表实例的端口偏移量每个RegionServer需要两个端口，默认端口是16020和16030但是，由于HMaster使用默认端口，所以其他RegionServers的基本端口不是默认端口，而HMaster自从HBase版本1.0.0以来也是RegionServer基本端口是16200和16300您可以在服务器上运行另外99个不是HMaster或备份HMaster的RegionServer以下命令将启动另外四个RegionServers，它们在从16202/16302（基本端口16200/16300加2）开始的顺序端口上运行；

```java
$ .bin/local-regionservers.sh start 2 3 4 5            
```

```java
要手动停止RegionServer，请使用带有stop参数和服务器偏移量的local-regionservers.sh命令停止。
```

```java
$ .bin/local-regionservers.sh stop 3
```

**8、** 停止HBase您可以使用bin/stop-hbase.sh命令以与快速启动独立式HBase过程相同的方式停止HBase；

## 在完全分布式模式测试HBase

实际上，您需要一个完全分布式的配置来全面测试HBase，并将其用于实际场景中。在分布式配置中，集群包含多个节点，每个节点运行一个或多个HBase守护进程。这些包括主要和备份主实例，多个ZooKeeper节点和多个RegionServer节点。

此高级快速入门将两个以上的节点添加到您的群集。架构如下：

节点名称
Master
ZooKeeper
RegionServer

node-a.example.com

是

是

没有

node-b.example.com

备用

是

是

node-c.example.com

没有

是

是

这个快速入门假定每个节点都是虚拟机，并且它们都在同一个网络上。它基于之前的快速入门、伪分布式本地安装，假设您在该过程中配置的系统是现在node-a。继续之前，在node-a停止HBase 。

提示：请确保所有节点都具有完全的通信访问权限，并且没有任何防火墙规则可以阻止它们相互交谈。如果您看到任何错误，如no route to host，请检查您的防火墙。

### 配置无密码SSH访问

node-a需要能够登录node-b和node-c（和自己）才能启动守护进程。实现这一点的最简单的方法是在所有主机上使用相同的用户名，并配置无密码的SSH登录，从node-a到其他的。

**1、** 在node-a，生成一个密钥对以运行HBase的用户身份登录时，使用以下命令生成SSH密钥对：

```java
$ ssh-keygen -t rsa
```

```java
如果命令成功，密钥对的位置将打印到标准输出。公钥的默认名称是id\_rsa.pub。  
```

**2、** 创建将在其他节点上保存的共享密钥的目录在node-b和上node-c，以HBase用户身份登录，并在用户主目录中创建一个.ssh/目录（如果尚不存在）如果它已经存在，请注意它可能已经包含其他键；

**3、** 将公钥复制到其他节点通过使用scp或其他一些安全的手段，安全地将公钥从node-a复制到每个节点在其他每个节点上，创建一个名为.ssh/authorized_keys的新文件（如果该文件尚不存在），并将id_rsa.pub文件的内容附加到该文件的末尾请注意，你也需要为node-a本身执行此项；

```java
$ cat id_rsa.pub >> ~/.ssh/authorized_keys
```

**4、** 测试无密码登录如果您正确执行了此过程，则node-a在使用相同用户名从其他任一节点进行SSH连接时，不应提示您输入密码；

**5、** 由于node-b将运行备份主机，请重复上述过程，在你看到node-a的任何地方替换node-b请确保不要覆盖现有的.ssh/authorized_keys文件，而是使用>>运算符，而不是>运算符将新密钥连接到现有文件；

### 准备 node-a

node-a将运行您的主要主服务器和ZooKeeper进程，但不运行RegionServers。从node-a停止启动RegionServer。

**1、** 编辑conf/regionservers并删除包含localhost的行为node-b和node-c加入具有主机名或IP地址线即使你想在node-a运行一个RegionServer，你也应该用其他服务器用来与之通信的主机名来引用它在这种情况下，那将是node-a.example.com这使您可以将配置分发给群集中的每个节点，而不会造成任何主机名冲突保存文件；

**2、** 配置HBase以将node-b作为备份主机在conf/调用backup-masters中创建一个新文件，并添加一个新的行，其中的主机名为node-b在这个演示中，主机名是node-b.example.com；

**3、** 配置ZooKeeper实际上，你应该仔细考虑你的ZooKeeper配置您可以在zookeeper部分找到更多关于配置ZooKeeper的信息这个配置将指示HBase在集群的每个节点上启动和管理一个ZooKeeper实例在node-a上，编辑conf/hbase-site.xml并添加下列属性；

```java
<property>
  <name>hbase.zookeeper.quorum</name>
  <value>node-a.example.com,node-b.example.com,node-c.example.com</value>
</property>
<property>
  <name>hbase.zookeeper.property.dataDir</name>
  <value>/usr/local/zookeeper</value>
</property>
```

**4、** 在您的配置中，您已经将node-a作为localhost引用，将引用改为指向其他节点用来引用node-a的主机名在这些例子中，主机名是node-a.example.com；

### 准备 node-b 和 node-c

node-b 将运行一个备份主服务器和一个ZooKeeper实例。

**1、** 下载并解压HBase将HBase下载并解压到node-b，就像您为独立和伪分布式快速入门所操作的一样；

**2、** 将配置文件从node-a复制到node-b和node-c您的群集的每个节点都需要具有相同的配置信息将conf/目录下的内容复制到node-b和node-c上的conf/目录中；

### 启动并测试群集

**1、** 确保HBase没有在任何节点上运行如果您在之前的测试中忘记停止HBase，您将会遇到错误通过使用该jps命令检查HBase是否在任何节点上运行寻找HMaster，HRegionServer和HQuorumPeer的进程如果他们存在，删除他们；

**2、** 启动群集在node-a，发出start-hbase.sh命令您的输出将类似于下面的输出；

```java
$ bin/start-hbase.sh
node-c.example.com: starting zookeeper, logging to /home/hbuser/hbase-0.98.3-hadoop2/bin/../logs/hbase-hbuser-zookeeper-node-c.example.com.out
node-a.example.com: starting zookeeper, logging to /home/hbuser/hbase-0.98.3-hadoop2/bin/../logs/hbase-hbuser-zookeeper-node-a.example.com.out
node-b.example.com: starting zookeeper, logging to /home/hbuser/hbase-0.98.3-hadoop2/bin/../logs/hbase-hbuser-zookeeper-node-b.example.com.out
starting master, logging to /home/hbuser/hbase-0.98.3-hadoop2/bin/../logs/hbase-hbuser-master-node-a.example.com.out
node-c.example.com: starting regionserver, logging to /home/hbuser/hbase-0.98.3-hadoop2/bin/../logs/hbase-hbuser-regionserver-node-c.example.com.out
node-b.example.com: starting regionserver, logging to /home/hbuser/hbase-0.98.3-hadoop2/bin/../logs/hbase-hbuser-regionserver-node-b.example.com.out 
node-b.example.com: starting master, logging to /home/hbuser/hbase-0.98.3-hadoop2/bin/../logs/hbase-hbuser-master-nodeb.example.com.out
```

```java
ZooKeeper首先启动，然后是master，然后是RegionServers，最后是backup masters。
```

**3、** 验证进程是否正在运行在群集的每个节点上，运行该jps命令并验证每台服务器上是否运行了正确的进程如果用于其他用途，您可能会看到在您的服务器上运行的其他Java进程；

```java
例子：node-a jps输出：  
```

```java
$ jps
20355 Jps
20071 HQuorumPeer 
20137 HMaster
```

```java
示例：node-b jps输出：
```

```java
$ jps
15930 HRegionServer
16194 Jps
15838 HQuorumPeer 
16010 HMaster
```

```java
例子：node-c jps输出：
```

```java
$ jps
13901 Jps
13639 HQuorumPeer 
13737 HRegionServer
```

```java
ZooKeeper进程名称这个HQuorumPeer过程是一个由HBase控制和启动的ZooKeeper实例。如果以这种方式使用ZooKeeper，则每个群集节点仅限于一个实例，并且仅适用于测试。如果ZooKeeper在HBase之外运行，则调用该进程QuorumPeer。
```

**4、** 浏览到WebUIWebUI端口更改WebUI端口更改在HBase更新的0.98.x中，HBaseWebUI使用的HTTP端口从主服务器的60010和每个RegionServer的60030变为主服务器的16010和RegionServer的16030如果一切设置正确，您应该能够使用Web浏览器连接到Master（http://node-a.example.com:16010/）或SecondaryMaster的UI（http://node-b.example.com:16010/）如果您可以通过localhost而不是从另一台主机连接，请检查您的防火墙规则您可以在端口16030的IP地址中查看每个RegionServers的WebUI，也可以通过单击Master的WebUI中的链接来查看；

**5、** 测试节点或服务消失时会发生什么在配置了三节点群集后，事情不会很有弹性您仍然可以通过关闭进程并查看日志来测试主Master或RegionServer的行为；
