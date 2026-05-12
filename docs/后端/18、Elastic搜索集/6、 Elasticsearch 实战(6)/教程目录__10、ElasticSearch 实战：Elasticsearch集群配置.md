# 10、ElasticSearch 实战：Elasticsearch集群配置
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/10.html
- 分类：搜索引擎
- 分组：教程目录
我本地虚拟机配置了两台centos机器，分别安装了elasticsearch6.4.0版本，IP分别为：192.168.56.12， 192.168.56.13

分别修改两个机器上Elasticsearch的配置文件:

文件位置：elasticsearch安装目录/elasticsearch-6.4.0/config/elasticsearch.yml

我本地配置文件位置：/usr/local/elasticsearch-6.4.0/config、elasticsearch,yml

**192、** 168.56.12机器配置文件信息如下：；

```java
 1 ======================== Elasticsearch Configuration =========================
 2
 3 NOTE: Elasticsearch comes with reasonable defaults for most settings.
 4       Before you set out to tweak and tune the configuration, make sure you
 5       understand what are you trying to accomplish and the consequences.
 6
 7 The primary way of configuring a node is via this file. This template lists
 8 the most important settings you may want to configure for a production cluster.
 9
10 Please consult the documentation for further information on configuration options:
11 https://www.elastic.co/guide/en/elasticsearch/reference/index.html
12
13 ---------------------------------- Cluster -----------------------------------
14
15 Use a descriptive name for your cluster:
16
17 cluster.name: my-application
18
19 ------------------------------------ Node ------------------------------------
20
21 Use a descriptive name for the node:
22
23 node.name: node-1
24
25 Add custom attributes to the node:
26
27node.attr.rack: r1
28
29 ----------------------------------- Paths ------------------------------------
30
31 Path to directory where to store the data (separate multiple locations by comma):
32
33path.data: /path/to/data
34
35 Path to log files:
36
37path.logs: /path/to/logs
38
39 ----------------------------------- Memory -----------------------------------
40
41 Lock the memory on startup:
42
43bootstrap.memory_lock: true
44
45 Make sure that the heap size is set to about half the memory available
46 on the system and that the owner of the process is allowed to use this
47 limit.
48
49 Elasticsearch performs poorly when the system is swapping the memory.
50
51 ---------------------------------- Network -----------------------------------
52
53 Set the bind address to a specific IP (IPv4 or IPv6):
54
55 network.host: 192.168.56.12
56
57 Set a custom port for HTTP:
58
59 http.port: 9200
60
61 For more information, consult the network module documentation.
62
63 --------------------------------- Discovery ----------------------------------
64
65 Pass an initial list of hosts to perform discovery when new node is started:
66 The default list of hosts is ["127.0.0.1", "[::1]"]
67
68 discovery.zen.ping.unicast.hosts: ["192.168.56.12"]
69
70 Prevent the "split brain" by configuring the majority of nodes (total number of master-eligible nodes / 2 + 1):
71
72discovery.zen.minimum_master_nodes: 
73
74 For more information, consult the zen discovery module documentation.
75
76 ---------------------------------- Gateway -----------------------------------
77
78 Block initial recovery after a full cluster restart until N nodes are started:
79
80gateway.recover_after_nodes: 3
81
82 For more information, consult the gateway module documentation.
83
84 ---------------------------------- Various -----------------------------------
85
86 Require explicit names when deleting indices:
87
88action.destructive_requires_name: true
89 http.cors.enabled: true
90 http.cors.allow-origin: "*"
```

**192、** 268.56.13机器配置文件信息如下：；

```java
 1 ======================== Elasticsearch Configuration =========================
 2
 3 NOTE: Elasticsearch comes with reasonable defaults for most settings.
 4       Before you set out to tweak and tune the configuration, make sure you
 5       understand what are you trying to accomplish and the consequences.
 6
 7 The primary way of configuring a node is via this file. This template lists
 8 the most important settings you may want to configure for a production cluster.
 9
10 Please consult the documentation for further information on configuration options:
11 https://www.elastic.co/guide/en/elasticsearch/reference/index.html
12
13 ---------------------------------- Cluster -----------------------------------
14
15 Use a descriptive name for your cluster:
16
17 cluster.name: my-application
18
19 ------------------------------------ Node ------------------------------------
20
21 Use a descriptive name for the node:
22
23 node.name: node-2
24
25 Add custom attributes to the node:
26
27node.attr.rack: r1
28
29 ----------------------------------- Paths ------------------------------------
30
31 Path to directory where to store the data (separate multiple locations by comma):
32
33path.data: /path/to/data
34
35 Path to log files:
36
37path.logs: /path/to/logs
38
39 ----------------------------------- Memory -----------------------------------
40
41 Lock the memory on startup:
42
43bootstrap.memory_lock: true
44
45 Make sure that the heap size is set to about half the memory available
46 on the system and that the owner of the process is allowed to use this
47 limit.
48
49 Elasticsearch performs poorly when the system is swapping the memory.
50
51 ---------------------------------- Network -----------------------------------
52
53 Set the bind address to a specific IP (IPv4 or IPv6):
54
55 network.host: 192.168.56.13
56
57 Set a custom port for HTTP:
58
59 http.port: 9200
60
61 For more information, consult the network module documentation.
62
63 --------------------------------- Discovery ----------------------------------
64
65 Pass an initial list of hosts to perform discovery when new node is started:
66 The default list of hosts is ["127.0.0.1", "[::1]"]
67
68 discovery.zen.ping.unicast.hosts: ["192.168.56.12"]
69
70 Prevent the "split brain" by configuring the majority of nodes (total number of master-eligible nodes / 2 + 1):
71
72discovery.zen.minimum_master_nodes: 
73
74 For more information, consult the zen discovery module documentation.
75
76 ---------------------------------- Gateway -----------------------------------
77
78 Block initial recovery after a full cluster restart until N nodes are started:
79
80gateway.recover_after_nodes: 3
81
82 For more information, consult the gateway module documentation.
83
84 ---------------------------------- Various -----------------------------------
85
86 Require explicit names when deleting indices:
87
88action.destructive_requires_name: true
89 http.cors.enabled: true
90 http.cors.allow-origin: "*"
```

这里两台机器的cluster.name必须一致 这样才算一个集群

node.name节点名称每台取不同的名称，用来表示不同的集群节点

network.host配置成自己的局域网IP

http.port端口就固定9200

discovery.zen.ping.unicast.hosts主动发现节点我们都配置成192.168.56.12节点IP

配置完后 重启es服务；

然后在head插件中查看：

访问正常，存在两个node节点，集群配置成功！
