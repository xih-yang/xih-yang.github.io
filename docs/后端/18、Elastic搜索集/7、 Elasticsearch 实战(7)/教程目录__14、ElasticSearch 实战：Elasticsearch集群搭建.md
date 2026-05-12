# 14、ElasticSearch 实战：Elasticsearch集群搭建
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/14.html
- 分类：搜索引擎
- 分组：教程目录
#### es集群的搭建

**复制文件**

在[elasticsearch安装](/zhuanlan/search/elasticsearch/7/2.html) 章节中我们已经安装了一套elasticsearch实例。现在我们将此实例复制成三份。分别为`node-a`,`node-b`,`node-c`。

**修改配置**

注意：
在ES6.x和更早的版本中，还有一些其他以 discovery.zen.*开头的选项，允许你配置 Zen Discovery 的行为。其中一些设置不再有效，已被删除。其他的已经改名。如果一个参数已经被改名，那么它的旧名称在版本7中就被弃用，你需要调整配置来使用新名称。

我们需要修改每个实例的配置来组建集群，我们需要修改的配置在`/config/elasticsearch.yml`这个文件下

```java
vim /usr/local/es-cluster/elasticsearch-7.2.0-a/config/elasticsearch.yml 
```

假如之前没有做任何修改的话会发现下面配置都是被注释掉的，这个时候Elasticsearch使用的默认配置，而我们需要将这些注释打开并设置为自己需要内容。

```java
#集群名称
#es启动后会将具有相同集群名字的节点放到一个集群下
cluster.name: my-application
#节点名称
node.name: node-a
#是不是有资格主节点
node.master: true
#是否存储数据
node.data: true
#最大集群节点数
node.max_local_storage_nodes: 3
#网关地址
network.host: 0.0.0.0
#端口
http.port: 9200
#内部节点之间沟通端口
transport.tcp.port: 9300
#es7.x 之后新增的配置，写入候选主节点的设备地址，在开启服务后可以被选为主节点
discovery.seed_hosts: ["localhost:9300","localhost:9400","localhost:9500"]
#es7.x 之后新增的配置，初始化一个新的集群时需要此配置来选举master
cluster.initial_master_nodes: ["node-a", "node-b","node-c"]
#数据和存储路径
path.data: /Users/louis.chen/Documents/study/search/storage/a/data
path.logs: /Users/louis.chen/Documents/study/search/storage/a/logs
```

**上面的配置需要修改的地方**

每个节点修改为自己的节点

```java
#节点名称
node.name: node-a
```

因为是在一台机器上部署三个节点，所以服务端口和对外业务的端口都需要修改，当然假如部署在三个服务器节点上就可以不需要修改。

```java
#端口
http.port: 9200
#内部节点之间沟通端口
transport.tcp.port: 9300
```

此配置表明需要构建集群的时候需要参与选举的节点集合，此集合为上面配置中每个节点的端口和地址。

```java
discovery.seed_hosts: ["localhost:9300","localhost:9400","localhost:9500"]
```

**启动**

首先不要忘记给启动角色配置新的文件访问权限

```java
chown -R esadmin:esadmin es-cluster
```

然后分别使用es账号启动

```java
cd /usr/local/es-cluster/elasticsearch-7.2.0-a/bin
sh elasticsearch -d
cd /usr/local/es-cluster/elasticsearch-7.2.0-b/bin
sh elasticsearch -d
cd /usr/local/es-cluster/elasticsearch-7.2.0-c/bin
sh elasticsearch -d
```

**验证**

打开浏览器输入：http://localhost:9200/_cat/health?v ,

如果返回的node.total是3，代表一个集群搭建成功

当然这只是一个简单的集群，并没有为每个集群配置不同的职责参数(`主节点`,`数据节点`,`客户端`)

#### 使用kibana进行集群监控

之前我们介绍过kibana的安装。这个时候我们可以使用kibana来对Elasticsearch集群进行监控。要想使用kibana监控集群只需要修改其配置文件即可。

**修改kibana配置**

kibana配置的路径`/config/kibana.yml`。

```java
其配置修改为
elasticsearch.hosts: ["http://localhost:9200","http://localhost:9201","http://localhost:9202"]
```

启动kibana，可以看到集群信息
