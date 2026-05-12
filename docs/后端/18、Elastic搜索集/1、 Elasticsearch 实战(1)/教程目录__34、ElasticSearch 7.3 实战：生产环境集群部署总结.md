# 34、ElasticSearch 7.3 实战：生产环境集群部署总结
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/34.html
- 分类：搜索引擎
- 分组：教程目录
### 1、集群部署

### 2、结点的三个角色

主结点：master节点主要用于集群的管理及索引 比如新增结点、分片分配、索引的新增和删除等。

数据结点：data 节点上保存了数据分片，它负责索引和搜索操作。

客户端结点：client 节点仅作为请求客户端存在，client的作用也作为负载均衡器，client 节点不存数据，只是将请求均衡转发到其它结点。

通过下边两项参数来配置结点的功能：

```java
node.master:是否允许为主结点
node.data:允许存储数据作为数据结点
node.ingest:是否允许成为协调节点
```

四种组合方式：

```java
master=true，data=true：即是主结点又是数据结点
master=false，data=true：仅是数据结点
master=true，data=false：仅是主结点，不存储数据
master=false，data=false：即不是主结点也不是数据结点，此时可设置ingest为true表示它是一个客户端。
```

在elasticsearch.yml文件最后添加配置即可

##
