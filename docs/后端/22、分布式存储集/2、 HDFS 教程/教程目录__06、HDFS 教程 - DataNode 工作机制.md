# 06、HDFS 教程 - DataNode 工作机制
- 来源：https://ddkk.com/zhuanlan/filestorage/hdfs/1/6.html
- 分类：分布式存储
- 分组：教程目录
## 6. HDFS 其他功能

### 6.1 集群间数据拷贝

**1、** scp实现两个远程主机之间的文件复制；

```java
scp -r hello.txt root@master:/user/wj/hello.txt		// 推 push
scp -r root@master:/user/wj/hello.txt  hello.txt		// 拉 pull
scp -r root@master:/user/wj/hello.txt root@master:/user/wj   //是通过本地主机中转实现两个远程主机的文件复制；如果在两个远程主机之间ssh没有配置的情况下可以使用该方式。
```

**1、** 采用discp命令实现两个Hadoop集群之间的递归数据复制；

```java
bin/hadoop distcp hdfs://master1:9000/user/wj/hello.txt hdfs://master2:9000/user/wj/hello.txt
```

### 6.2 Hadoop 存档

### 6.2.1 理论概述

每个文件均按块存储，每个块的元数据存储在 Namenode 的内存中，因此 Hadoop 存储小文件会非常低效

因为大量的小文件会耗尽 Namenode 中的大部分内存

但注意，存储小文件所需要的磁盘容量和存储这些文件原始内容所需要的磁盘空间相比也不会增多

例如，一个 1MB 的文件以大小为 128MB 的块存储，使用的是 1MB 的磁盘空间，而不是128MB

Hadoop 存档文件或HAR文件，是一个更高效的文件存档工具，它将文件存入 HDFS 块，在减少 Namenode 内存使用的同时，允许对文件进行透明的访问

具体说来，Hadoop 存档文件可以用作 MapReduce 的输入

#### 6.2.2 案例实操

**1、** 需要启动yarn进程；

```java
start-yarn.sh
```

**2、** 归档文件；

归档成一个叫做 xxx.har 的文件夹，该文件夹下有相应的数据文件

Xx.har目录是一个整体，该目录看成是一个归档文件即可

```java
bin/hadoop archive -archiveName myhar.har -p /user/wj   /user/my
```

**3、** 查看归档；

```java
hadoop fs -lsr /user/my/myhar.har
hadoop fs -lsr har:///myhar.har
```

**4、** 解归档文件；

```java
hadoop fs -cp har:/// user/my/myhar.har /* /user/wj
```

### 6.3 快照管理

快照相当于对目录做一个备份，并不会立即复制所有文件，而是指向同一个文件

当写入发生时，才会产生新文件

#### 6.3.1 基本语法

**1、** hdfsdfsadmin-allowSnapshot路径（功能描述：开启指定目录的快照功能）；

**2、** dfsdfsadmin-disallowSnapshot路径（功能描述：禁用指定目录的快照功能，默认是禁用）；

**3、** hdfsdfs-createSnapshot路径（功能描述：对目录创建快照）；

**4、** hdfsdfs-createSnapshot路径名称（功能描述：指定名称创建快照）；

**5、** hdfsdfs-renameSnapshot路径旧名称新名称（功能描述：重命名快照）；

**6、** hdfslsSnapshottableDir（功能描述：列出当前用户所有可快照目录）；

**7、** hdfssnapshotDiff路径1路径2（功能描述：比较两个快照目录的不同之处）；

**8、** hdfsdfs-deleteSnapshot（功能描述：删除快照）；

#### 6.3.2 案例实操

**1、** 开启/禁用指定目录的快照功能；

```java
hdfs dfsadmin -allowSnapshot /user/wj/data		
hdfs dfsadmin -disallowSnapshot /user/wj/data
```

**2、** 对目录创建快照；

```java
hdfs dfs -createSnapshot /user/wj/data		// 对目录创建快照
```

通过web访问hdfs://hadoop102:9000/user/wj/data/.snapshot/s……// 快照和源文件使用相同数据块

```java
hdfs dfs -lsr /user/wj/data/.snapshot/
```

**3、** 指定名称创建快照；

```java
hdfs dfs -createSnapshot /user/wj/data miao170508
```

**4、** 重命名快照；

```java
hdfs dfs -renameSnapshot /user/wj/data/ miao170508 wj111
```

**5、** 列出当前用户所有可快照目录；

```java
hdfs lsSnapshottableDir
```

**6、** 比较两个快照目录的不同之处；

```java
hdfs snapshotDiff /user/wj/data/  .  .snapshot/wj170508
```

**7、** 恢复快照；

```java
hdfs dfs -cp /user/wj/input/.snapshot/s20170708-134303.027 /user
```

### 6.4 回收站

#### 6.4.1 默认回收站

默认值fs.trash.interval=0，0 表示禁用回收站，可以设置删除文件的存活时间

默认值fs.trash.checkpoint.interval=0，检查回收站的间隔时间

要求fs.trash.checkpoint.interval <= fs.trash.interval

#### 6.4.2 启用回收站

修改core-site.xml，配置垃圾回收时间为 1 分钟

```java
<property>
    <name>fs.trash.interval</name>
    <value>1</value>
</property>
```

#### 6.4.3 查看回收站

回收站在集群中的路径：/user/wj/.Trash/….

#### 6.4.4 修改访问垃圾回收站用户名称

进入垃圾回收站用户名称，默认是 dr.who，修改为 wj 用户

**[core-site.xml]**

```java
<property>
  <name>hadoop.http.staticuser.user</name>
  <value>wj</value>
</property>
```

#### 6.4.5 进入回收站

通过程序删除的文件不会经过回收站，需要调用 moveToTrash() 才进入回收站

```java
Trash trash = New Trash(conf);
trash.moveToTrash(path);
```

#### 6.4.6 恢复回收站数据

```java
hadoop fs -mv /user/wj/.Trash/Current/user/wj/input    /user/wj/input
```

#### 6.4.7清空回收站

```java
hdfs dfs -expunge
```
