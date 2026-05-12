# 08、Flink 笔记 - 搭建ElasticSearch集群
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/8.html
- 分类：大数据框架
- 分组：教程目录
## 一、创建用户

创建用户的原因由于ES版本5.0以后不能使用root用户启动ES

```java
[root@hadoop102 ~]# useradd es
[root@hadoop102 ~]# passwd es
```

## 二、准备Java环境

## 三、下载安装包

## 四、解压安装包

```java
[root@hadoop102 software]# tar -zxvf elasticsearch-6.3.1.tar.gz -C /opt/module/
```

## 五、配置 jvm.options

主要是调整内存，es启动需要较大内存，如果内存不足就会启动出错。

```java
[root@hadoop102 config]# pwd
/opt/module/elasticsearch-6.3.1/config
[root@hadoop102 config]# vim jvm.options 
# 修改如下内容
-Xms2g
-Xmx2g
```

## 六、配置 limits.conf

主要是es启动很多线程

```java
[root@hadoop102 ~]# vi /etc/security/limits.conf
# 在末尾处添加如下
* hard nofile 65536
* soft nofile 131072
* hard nproc 4096
* soft nproc 2048
```

nofile - 打开文件的最大数目

noproc - 进程的最大数目

soft 指的是当前系统生效的设置值

hard 表明系统中所能设定的最大值

## 七、配置 sysctl.conf

```java
[root@hadoop102 ~]#  vi /etc/sysctl.conf
# 末尾处添加
vm.max_map_count=655360
fs.file-max=655360
```

vm.max_map_count=655360，因此缺省配置下，单个jvm能开启的最大线程数为其一半file-max是设置 系统所有进程一共可以打开的文件数量 。

然后在执行如下操作

```java
[root@hadoop102 ~]# sysctl -p
```

## 8、配置其他主机

上面配置是在一台主机上的，还需要在其他两台主机配置相同的操作。

## 9、配置 elasticserach.yml

```java
[root@hadoop102 config]# pwd
/opt/module/elasticsearch-6.3.1/config
[root@hadoop102 config]# vim elasticsearch.yml 
# 修改如下内容
# 集群名称 三台主机一样
cluster.name: es-cluster
# 节点名称 三台主机都不一样
node.name: es1
# 节点名称，仅仅是描述名称，用于在日志中区分（自定义）
# 指定了该节点可能成为 master 节点，还可以是数据节点
node.master: true
node.data: true
# 存放数据目录
path.data: /opt/module/elasticsearch-6.3.1/data
# 存放日志目录
path.logs: /opt/module/elasticsearch-6.3.1/logs
# 当前节点 ip
network.host: 192.168.200.102
# 当前节点对外提供服务端口
http.port: 9200
# 集群各ip 可以使用域名
discovery.zen.ping.unicast.hosts: ["192.168.200.102", "192.168.200.103","192.168.200.104"]
# 为了避免脑裂，集群节点数最少为 半数+1
discovery.zen.minimum_master_nodes: 2 
```

同理需要在其他两台主机配置相对于的配置。

## 10、修改目录权限

```java
[root@hadoop102 module]# chown -R es:es elasticsearch-6.3.1/
```

```java
[root@hadoop103 module]#  chown -R es:es elasticsearch-6.3.1/
```

```java
[root@hadoop104 module]#  chown -R es:es elasticsearch-6.3.1/
```

## 11、切换用户

```java
[root@hadoop102 module]# su es
```

```java
[root@hadoop103 module]# su es
```

```java
[root@hadoop104 module]# su es
```

## 12、启动集群

```java
[root@hadoop102 elasticsearch-6.3.1]# bin/elasticsearch
```

```java
[root@hadoop103 elasticsearch-6.3.1]# bin/elasticsearch
```

```java
[root@hadoop104 elasticsearch-6.3.1]# bin/elasticsearch
```

检查是否启完成

```java
curl 192.168.200.102:9200
```

## 13、安装 kibanan

## 13.1、下载安装包

## 13.2、解压安装包

```java
[root@hadoop102 software]# tar -zxvf kibana-6.3.1-linux-x86_64.tar.gz -C /opt/module
```

## 13.3、配置 kibanan

```java
[root@hadoop102 kibana-6.3.1-linux-x86_64]# pwd
/opt/module/kibana-6.3.1-linux-x86_64
[root@hadoop102 kibana-6.3.1-linux-x86_64]# vim config/kibana.yml 
# kibanan 的web端口
server.port: 5601
# kibanan 的主机 ip和域名都可以
server.host: "192.168.200.102"
# es 实例主机
elasticsearch.url: "http://192.168.200.102:9200"
# kibanan 索引名称
kibana.index: ".kibana"
```

## 13.4 启动 kibanan

```java
[root@hadoop102 kibana-6.3.1-linux-x86_64]# pwd
/opt/module/kibana-6.3.1-linux-x86_64
[root@hadoop102 kibana-6.3.1-linux-x86_64]# bin/kibana
```

## 13.5、检查是否启动

浏览器输入

```java
http://192.168.200.102:5601
```
