# 08、ElasticSearch 实战：elasticsearch.yml配置说明
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/8.html
- 分类：搜索引擎
- 分组：教程目录
集群名称：

**cluster.name: my-application**

确保在不同的环境中的集群的名称不重复，否则，节点可能会连接到错误的集群上

节点名称：

**node.name: node-1**

默认情况下，当节点启动时ElasticSearch将随机在一份3000个名字的列表中随机指定一个。如果机器上只运行一个集群ElasticSearch节点，可以用${HOSTNAME}设置节点的名称为主机名

节点描述：

**node.rack: r1**

索引存储位置：

**path.data: /path/to/data**

日志存储位置：

**path.logs: /path/to/logs**

内存分配模式：

**bootstrap.memory_lock: true**

绑定的网卡IP：

**network.host: 192.168.56.6**

HTTP协议端口：

**http.port: 9200**

开始发现新节点的IP地址：

**discovery.zen.ping.unicast.hosts: ["192.168.56.6"]**

最多发现主节点的个数：

**discovery.zen.minimum_master_nodes: 3**

当重启集群节点后最少启动N个节点后开始做恢复

**gateway.recover_after_nodes: 3**

在一台机器上最多启动的节点数：

**node.max_local_storage_nodes:1**

当删除一个索引时，需要指定具体索引的名称：

**action.destructive_requires_name: true**
