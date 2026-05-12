# 29、ElasticSearch 实战：从0开始搭建Elasticsearch生产集群
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/29.html
- 分类：搜索引擎
- 分组：教程目录
> 开始之前:
>
> 关于ES单机服务的部署, 可参考博文: [ES 02 - 部署Elasticsearch单机服务 + 部署中的常见问题][ES 02 - _Elasticsearch_ _]
>
> 关于集群的服务配置建议, 可以参考上一篇博文: [ES 30 - Elasticsearch生产集群的服务器配置建议][ES 30 - Elasticsearch]

## 1 配置环境

## 1.1 服务器IP映射

配置服务器IP地址与主机名称的映射, 方便维护与迁移.

> 服务器IP
> 映射的主机名
>
>
>
>
> 172.16.22.131
> es-1
>
>
> 172.16.22.132
> es-2
>
>
> 172.16.22.133
> es-3
>
>
>
> 依次编辑三台服务器的/etc/hosts文件, 添加映射内容:

```java
 [root@ddkk.com ~]# vim /etc/hosts
 添加下述内容:
 172.16.22.131 es-1
 172.16.22.132 es-2
 172.16.22.133 es-3
```

## 1.2 配置各节点的ssh免密通信

Elasticsearch集群中各个节点之间需要通信, 配置免密通信是必须的.

参考博文 [Linux - 配置SSH免密登录 - “ssh-keygen”的基本用法](https://www.cnblogs.com/shoufeng/p/11022258.html) 完成相关免密通信的配置.

## 1.3 安装JDK并配置环境变量

学习使用ES的前提是成功安装JDK —— 很基础的一项步骤, 这里省略.

此处学习演示所用的JDK版本为:

```java
[root@ddkk.com ~]# java -version
java version "1.8.0_151"
Java(TM) SE Runtime Environment (build 1.8.0_151-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.151-b12, mixed mode)
```

## 2 部署单节点服务

> 请参照博文 [ES 02 - 部署Elasticsearch单机服务 + 部署中的常见问题][ES 02 - _Elasticsearch_ _] 进行操作, 如果过程中遇到不可知的问题, 可在评论区留言, 博主会在看到后的第一时间回复.

与部署单机服务不同的地方 —— 修改配置文件`/data/elk-6.6.0/es-node/config/elasticsearch.yml`:

```java
# 大约17行, 修改集群名称, 同一个集群中此名称必须相同, 才能组成一个逻辑集群:
cluster.name: heal_es
# 大约23行, 修改节点名称, 可以设置为与主机名称相同:
node.name: es-1
# 大约55行, 指定可通过外部服务器访问本地ES服务:
network.host: 0.0.0.0
# 并指定访问的端口号, 默认是9200, 为了防止冲突, 这里修改为9301:
http.port: 9301
# 大约68行, 指定初始的主机列表, 用来在新节点启动时执行发现功能:
discovery.zen.ping.unicast.hosts: ["es-1", "es-2", "es-3"]
```

**注意: 修改完配置后, 先不要启动服务, 所有节点中的安装包都整理完毕, 再依次启动.**

——因为ES服务一旦启动, 就会在`${ES_HOME}/data/`下生成集群数据, 包括节点id、节点锁(node lock)等, 不同节点的这些数据都不同, 如果相同则会导致启动异常.

## 3 部署集群服务

**(1) 将配置好的安装包分发到节点es-2和es-3上:**

```java
# 切换回root用户
[elastic@localhost data]$ su root
Password: 
# 输入密码后, 分发安装包: 
[root@ddkk.com data]# scp -r elk-6.6.0/ es-2:/data
[root@ddkk.com data]# scp -r elk-6.6.0/ es-3:/data
```

**(2) 向es-2和es-3中添加elastic用户和组, 并修改文件权限:**

```java
[root@ddkk.com data]# useradd elastic -s /bin/bash 
[root@ddkk.com data]# chown -R elastic:elastic /data/elk-6.6.0/
```

**(3) 修改es-2和es-3节点的配置文件:**

同样的, 修改`elasticsearch.yml`文件, 这时只修改node名称即可:

```java
[root@ddkk.com ~]# vim /data/elk-6.6.0/es-node/config/elasticsearch.yml 
# 大约23行, 修改节点名称, 可以设置为与主机名称相同. 分别修改为es-2和es-3
node.name: es-...
```

**(4) 如有必要-删除从es-1拷贝而来的data目录下的文件:**

如果在从es-1节点分发安装包时, 已经启动了es-1上的ES服务, 那么还要删除es-2和es-3节点中`${ES_HOME}/data/`下的所有文件, 防止后续启动失败.

## 4 启动集群中的所有节点

## 4.2 启动各个节点中的ES服务

**启动顺序没有要求:**

```java
# 切换为elastic用户:
[root@ddkk.com ~]# su elastic
# 进入到启动命令所在的目录:
[elastic@localhost root]$ cd /data/elk-6.6.0/es-node/bin/
# 后台启动服务:
[elastic@localhost bin]$ sh elasticsearch -d
```

## 4.2 查看集群状态

**(1) 只启动一个节点时的集群状态:**

**(2) 启动全部节点后的集群状态:**

## 5 常见问题及解决方法

## 5.1 新节点不能加入集群

(1)问题描述:

启动集群中的第二、三个节点时可能出现下述异常中的一种:

**1、** 获取node lock失败:

```java
 [2019-06-24T22:04:06,665][WARN ][o.e.b.ElasticsearchUncaughtExceptionHandler] [es-3] uncaught exception in thread [main]
 org.elasticsearch.bootstrap.StartupException: java.lang.IllegalStateException: failed to obtain node locks, tried [[/data/elk-6.6.0/es-node/data]] with lock id [0]; maybe these locations are not writable or multiple nodes were started without increasing [node.max_local_storage_nodes] (was [1])?
         at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:163) ~[elasticsearch-6.6.0.jar:6.6.0]
         at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:150) ~[elasticsearch-6.6.0.jar:6.6.0]
         at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86) ~[elasticsearch-6.6.0.jar:6.6.0]
         at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:124) ~[elasticsearch-cli-6.6.0.jar:6.6.0]
         at org.elasticsearch.cli.Command.main(Command.java:90) ~[elasticsearch-cli-6.6.0.jar:6.6.0]
         at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:116) ~[elasticsearch-6.6.0.jar:6.6.0]
         at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:93) ~[elasticsearch-6.6.0.jar:6.6.0]
         ... 6 more
```

**2、** 加入集群的请求发送失败:

```java
 节点[es-3]向master节点[es-1]发送加入集群的请求失败.
  [es-3] failed to send join request to master [{es-1}{jcmbr9dgRgaAWUE7xq5xAw}{wxvCc19lQvmc3xmcRHdbqA}{172.16.22.131}{172.16.22.131:9300}{ml.machine_memory=134908342272, ml.max_open_jobs=20, xpack.installed=true, ml.enabled=true}], reason [RemoteTransportException[[es-1][172.16.22.131:9300][internal:discovery/zen/join]]; 
 内部原因是: 节点id相同, 但并不是同一个节点实例.
 nested: IllegalArgumentException[can't add node {es-3}{jcmbr9dgRgaAWUE7xq5xAw}{WXjlsD1zTWCm6YaWAAUoOg}{172.16.22.133}{172.16.22.133:9300}{ml.machine_memory=135220408320, ml.max_open_jobs=20, xpack.installed=true, ml.enabled=true}, found existing node {es-1}{jcmbr9dgRgaAWUE7xq5xAw}{wxvCc19lQvmc3xmcRHdbqA}{172.16.22.131}{172.16.22.131:9300}{ml.machine_memory=134908342272, xpack.installed=true, ml.max_open_jobs=20, ml.enabled=true} with the same id but is a different node instance]; ]
```

(2)问题分析:

节点二、三的安装包都是从节点一分发而来的, 由于分发时节点一已经启动, 其`${ES_HOME}/data/`目录下已生成node相关的数据, 这些数据应该由当前节点自动生成, 不能共用. 如果这些数据相同就会出现上述异常.

(3)问题解决:

删除节点二、三的数据目录`${ES_HOME}/data/`下的所有文件, 然后重新启动即可.

## 5.2 反序列化失败

(1)问题说明:

节点启动过程中抛出如下错误:

```java
org.elasticsearch.transport.RemoteTransportException: Failed to deserialize exception response from stream
```

(2)问题分析:

各个Elasticsearch节点中的服务所使用的JDK版本不一致, 在 [ES 30 - Elasticsearch生产集群的服务器配置建议][ES 30 - Elasticsearch] 的第5节`5 JVM的参数配置`中有相关说明:

> ES中用到了很多与JVM版本相关的特性, 比如本地序列化机制 (包括IP地址、异常信息等等), 而JVM在不同的minor版本中可能会修改序列化机制, 版本不同可能会导致序列化异常.

(3)问题解决:

更换JDK版本, 并更新环境变量配置, 保证各节点使用的JDK版本一致.

## 5.3 其他问题

更多问题可以参考博文: [ES 02 - 部署Elasticsearch单机服务 + 常见问题的解决][ES 02 - _Elasticsearch_ _] 中第5节内容`5 常见问题及解决方法`.
