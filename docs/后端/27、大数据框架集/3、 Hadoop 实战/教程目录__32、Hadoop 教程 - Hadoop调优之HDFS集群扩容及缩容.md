# 32、Hadoop 教程 - Hadoop调优之HDFS集群扩容及缩容
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/32.html
- 分类：大数据框架
- 分组：教程目录
## 1. 添加白名单

白名单：表示在白名单的主机IP地址可以，用来存储数据。

企业中：配置白名单，可以尽量防止黑客恶意访问攻击。

**配置白名单步骤如下：**

**1）在NameNode节点的/opt/module/hadoop-3.1.3/etc/hadoop目录下分别创建whitelist 和blacklist文件**

- 创建白名单（在hadoop的whitelist文件下添加白名单机器，比如在whitelist中添加如下主机名称，那集群正常工作的节点为102 103）

```java
vim whitelist
hadoop102
hadoop103
```

- 创建黑名单（一般情况下将hadoop目录下的blacklist文件保持空的就可以，因为一般不会配置）

```java
touch blacklist
```

**2）在hdfs-site.xml配置文件中增加dfs.hosts配置参数**

```java
<!-- 白名单 -->
<property>
     <name>dfs.hosts</name>
     <value>/opt/module/hadoop-3.1.3/etc/hadoop/whitelist</value>
</property>
<!-- 黑名单 -->
<property>
     <name>dfs.hosts.exclude</name>
     <value>/opt/module/hadoop-3.1.3/etc/hadoop/blacklist</value>
</property>
```

**3）分发配置文件whitelist，hdfs-site.xml**

```java
xsync hdfs-site.xml whitelist
```

**4）第一次添加白名单必须重启集群，不是第一次，只需要刷新NameNode节点即可**

**5）在web浏览器上查看DN，http://hadoop102:9870/dfshealth.html#tab-datanode**

**6）在hadoop104上执行上传数据数据失败**

```java
hadoop fs -put NOTICE.txt /
```

**7）二次修改白名单，增加hadoop104**

```java
vim whitelist
# 修改为如下内容
hadoop102
hadoop103
hadoop104
```

**8）刷新NameNode（执行 hdfs dfsadmin -refreshNodes 命令）**

```java
hdfs dfsadmin -refreshNodes
Refresh nodes successful
```

**9）在web浏览器上查看DN，http://hadoop102:9870/dfshealth.html#tab-datanode**

## 2. 服役新服务器

### 2.1. 需求

随着公司业务的增长，数据量越来越大，原有的数据节点的容量已经不能满足存储数据的需求，需要在原有集群基础上动态添加新的数据节点。

### 2.2. 环境准备

1）新增hadoop105主机

2）修改所有机器的IP地址和主机名称，以及hosts域名和IP配置

3）拷贝hadoop102的/opt/module目录和/etc/profile.d/my_env.sh到hadoop105

```java
scp -r module/* atguigu@hadoop105:/opt/module/
sudo scp /etc/profile.d/my_env.sh root@hadoop105:/etc/profile.d/my_env.sh
source /etc/profile
```

4）删除hadoop105上Hadoop的历史数据，data和log数据

```java
rm -rf data/ logs/
```

5）配置hadoop102和hadoop103到hadoop105的ssh无密登录

```java
ssh-copy-id hadoop105
```

### 2.3. 服役新节点具体步骤

直接启动DataNode，即可关联到集群

```java
hdfs --daemon start datanode
yarn --daemon start nodemanager
```

### 2.4. 在白名单中增加新服役的服务器

1）在白名单whitelist中增加hadoop104、hadoop105，并重启集群

```java
vim whitelist
# 修改为如下内容
hadoop102
hadoop103
hadoop104
hadoop105
```

2）分发

```java
xsync whitelist
```

3）刷新NameNode（执行命令： hdfs dfsadmin -refreshNodes ）

```java
hdfs dfsadmin -refreshNodes
Refresh nodes successful
```

### 2.5. 在hadoop105上上传文件

```java
hadoop fs -put /opt/module/hadoop-3.1.3/LICENSE.txt /
```

当数据不均衡时（即hadoop105数据少，其他节点数据多），可以对HDFS进行均衡处理，这样可以平衡磁盘中的文件，具体操作如下所示

## 3. 服务器间数据均衡

### 3.1. 为什么要进行服务器间数据均衡

在企业开发中，如果经常在hadoop102和hadoop104上提交任务，且副本数为2，由于数据本地性原则，就会导致hadoop102和hadoop104数据过多，hadoop103存储的数据量小。另一种情况，就是新服役的服务器数据量比较少，需要执行集群均衡命令。

### 3.2. 开启数据均衡命令

```java
sbin/start-balancer.sh -threshold 10
```

对于参数10，代表的是集群中各个节点的磁盘空间利用率相差不超过10%，可根据实际情况进行调整。

### 3.3. 停止数据均衡命令

```java
sbin/stop-balancer.sh
```

注意：由于HDFS需要启动单独的Rebalance Server来执行Rebalance操作，所以尽量不要在NameNode上执行start-balancer.sh，而是找一台比较空闲的机器。

## 4. 黑名单退役服务器

黑名单：表示在黑名单的主机IP地址不可以，用来存储数据。

企业中：配置黑名单，用来退役服务器。

**具体配置如下所示：**

**1）编辑/opt/module/hadoop-3.1.3/etc/hadoop目录下的blacklist文件**

```java
vim blacklist
```

添加如下主机名称（要退役的节点）

```java
hadoop105
```

注意：如果白名单中没有配置，需要在hdfs-site.xml配置文件中增加dfs.hosts配置参数

```java
<!-- 黑名单 -->
<property>
     <name>dfs.hosts.exclude</name>
     <value>/opt/module/hadoop-3.1.3/etc/hadoop/blacklist</value>
</property>
```

**2）分发配置文件blacklist，hdfs-site.xml**

```java
xsync hdfs-site.xml blacklist
```

**3）第一次添加黑名单必须重启集群，不是第一次，只需要刷新NameNode节点即可（执行命令：hdfs dfsadmin -refreshNodes）**

```java
hdfs dfsadmin -refreshNodes
Refresh nodes successful
```

**4）检查Web浏览器，退役节点的状态为decommission in progress（退役中），说明数据节点正在复制块到其他节点**

**5）等待退役节点状态为decommissioned（所有块已经复制完成），停止该节点及节点资源管理器。注意：如果副本数是3，服役的节点小于等于3，是不能退役成功的，需要修改副本数后才能退役**

```java
hdfs --daemon stop datanode
# stopping datanode
yarn --daemon stop nodemanager
# stopping nodemanager
```

**6）如果数据不均衡，可以用命令实现集群的再平衡**

```java
sbin/start-balancer.sh -threshold 10
```
