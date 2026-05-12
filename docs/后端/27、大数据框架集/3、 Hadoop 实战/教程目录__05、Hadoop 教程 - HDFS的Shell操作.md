# 05、Hadoop 教程 - HDFS的Shell操作
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/5.html
- 分类：大数据框架
- 分组：教程目录
## 1. 基本语法

> hadoop fs 具体命令 OR hdfs dfs 具体命令
>
> 两个是完全相同的。

## 2. 命令大全

```java
[root@yangshibiao ~]# hadoop fs
Usage: hadoop fs [generic options]
        [-appendToFile <localsrc> ... <dst>]
        [-cat [-ignoreCrc] <src> ...]
        [-checksum <src> ...]
        [-chgrp [-R] GROUP PATH...]
        [-chmod [-R] <MODE[,MODE]... | OCTALMODE> PATH...]
        [-chown [-R] [OWNER][:[GROUP]] PATH...]
        [-copyFromLocal [-f] [-p] [-l] [-d] [-t <thread count>] <localsrc> ... <dst>]
        [-copyToLocal [-f] [-p] [-ignoreCrc] [-crc] <src> ... <localdst>]
        [-count [-q] [-h] [-v] [-t [<storage type>]] [-u] [-x] [-e] <path> ...]
        [-cp [-f] [-p | -p[topax]] [-d] <src> ... <dst>]
        [-createSnapshot <snapshotDir> [<snapshotName>]]
        [-deleteSnapshot <snapshotDir> <snapshotName>]
        [-df [-h] [<path> ...]]
        [-du [-s] [-h] [-v] [-x] <path> ...]
        [-expunge]
        [-find <path> ... <expression> ...]
        [-get [-f] [-p] [-ignoreCrc] [-crc] <src> ... <localdst>]
        [-getfacl [-R] <path>]
        [-getfattr [-R] {-n name | -d} [-e en] <path>]
        [-getmerge [-nl] [-skip-empty-file] <src> <localdst>]
        [-head <file>]
        [-help [cmd ...]]
        [-ls [-C] [-d] [-h] [-q] [-R] [-t] [-S] [-r] [-u] [-e] [<path> ...]]
        [-mkdir [-p] <path> ...]
        [-moveFromLocal <localsrc> ... <dst>]
        [-moveToLocal <src> <localdst>]
        [-mv <src> ... <dst>]
        [-put [-f] [-p] [-l] [-d] <localsrc> ... <dst>]
        [-renameSnapshot <snapshotDir> <oldName> <newName>]
        [-rm [-f] [-r|-R] [-skipTrash] [-safely] <src> ...]
        [-rmdir [--ignore-fail-on-non-empty] <dir> ...]
        [-setfacl [-R] [{-b|-k} {-m|-x <acl_spec>} <path>]|[--set <acl_spec> <path>]]
        [-setfattr {-n name [-v value] | -x name} <path>]
        [-setrep [-R] [-w] <rep> <path> ...]
        [-stat [format] <path> ...]
        [-tail [-f] [-s <sleep interval>] <file>]
        [-test -[defsz] <path>]
        [-text [-ignoreCrc] <src> ...]
        [-touch [-a] [-m] [-t TIMESTAMP ] [-c] <path> ...]
        [-touchz <path> ...]
        [-truncate [-w] <length> <path> ...]
        [-usage [cmd ...]]
Generic options supported are:
-conf <configuration file>        specify an application configuration file
-D <property=value>               define a value for a given property
-fs <file:///|hdfs://namenode:port> specify default filesystem URL to use, overrides 'fs.defaultFS' property from configurations.
-jt <local|resourcemanager:port>  specify a ResourceManager
-files <file1,...>                specify a comma-separated list of files to be copied to the map reduce cluster
-libjars <jar1,...>               specify a comma-separated list of jar files to be included in the classpath
-archives <archive1,...>          specify a comma-separated list of archives to be unarchived on the compute machines
The general command line syntax is:
command [genericOptions] [commandOptions]
```

## 3. 常用命令实操

### 3.1. 准备工作

1）启动Hadoop集群（方便后续的测试）

```java
sbin/start-dfs.sh
sbin/start-yarn.sh
```

2）-help：输出这个命令参数

```java
hadoop fs -help rm
```

3）创建/sanguo文件夹

```java
hadoop fs -mkdir /sanguo
```

### 3.2. 上传

1）-moveFromLocal：从本地剪切粘贴到HDFS

```java
vim shuguo.txt
输入：
shuguo
hadoop fs  -moveFromLocal  ./shuguo.txt  /sanguo
```

2）-copyFromLocal：从本地文件系统中拷贝文件到HDFS路径去

```java
vim weiguo.txt
输入：
weiguo
hadoop fs -copyFromLocal weiguo.txt /sanguo
```

3）-put：等同于copyFromLocal，生产环境更习惯用put

```java
vim wuguo.txt
输入：
wuguo
hadoop fs -put ./wuguo.txt /sanguo
```

4）-appendToFile：追加一个文件到已经存在的文件末尾

```java
vim liubei.txt
输入：
liubei
hadoop fs -appendToFile liubei.txt /sanguo/shuguo.txt
```

### 3.3. 下载

1）-copyToLocal：从HDFS拷贝到本地

```java
hadoop fs -copyToLocal /sanguo/shuguo.txt ./
```

2）-get：等同于copyToLocal，生产环境更习惯用get

```java
hadoop fs -get /sanguo/shuguo.txt ./shuguo2.txt
```

### 3.4. HDFS直接操作

1）-ls: 显示目录信息

```java
hadoop fs -ls /sanguo
```

2）-cat：显示文件内容

```java
hadoop fs -cat /sanguo/shuguo.txt
```

3）-chgrp、-chmod、-chown：Linux文件系统中的用法一样，修改文件所属权限

```java
hadoop fs  -chmod 666  /sanguo/shuguo.txt
hadoop fs  -chown  atguigu:atguigu   /sanguo/shuguo.txt
```

4）-mkdir：创建路径

```java
hadoop fs -mkdir /jinguo
```

5）-cp：从HDFS的一个路径拷贝到HDFS的另一个路径

```java
hadoop fs -cp /sanguo/shuguo.txt /jinguo
```

6）-mv：在HDFS目录中移动文件

```java
hadoop fs -mv /sanguo/wuguo.txt /jinguo
hadoop fs -mv /sanguo/weiguo.txt /jinguo
```

7）-tail：显示一个文件的末尾1kb的数据

```java
hadoop fs -tail /jinguo/shuguo.txt
```

8）-rm：删除文件或文件夹

```java
hadoop fs -rm /sanguo/shuguo.txt
```

9）-rm -r：递归删除目录及目录里面内容

```java
hadoop fs -rm -r /sanguo
```

10）-du统计文件夹的大小信息

```java
hadoop fs -du -s -h /jinguo
27  81  /jinguo
hadoop fs -du  -h /jinguo
14  42  /jinguo/shuguo.txt
7   21   /jinguo/weiguo.txt
6   18   /jinguo/wuguo.tx
```

说明：27表示文件大小；81表示27*3个副本；/jinguo表示查看的目录

11）-setrep：设置HDFS中文件的副本数量

```java
hadoop fs -setrep 10 /jinguo/shuguo.txt
```

这里设置的副本数只是记录在NameNode的元数据中，是否真的会有这么多副本，还得看DataNode的数量。因为目前只有3台设备，最多也就3个副本，只有节点数的增加到10台时，副本数才能达到10。
