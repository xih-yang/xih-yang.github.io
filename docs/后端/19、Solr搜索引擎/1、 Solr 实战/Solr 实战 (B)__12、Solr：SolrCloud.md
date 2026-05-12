# 12、Solr：SolrCloud
- 来源：https://ddkk.com/zhuanlan/search/solr/2/26.html
- 分类：搜索引擎
- 分组：Solr 实战 (B)
Solr 可以搭建具备容错能力和高可用的 Solr 集群。集群中集群配置、自动负载均衡和查询故障转移、Zookeeper 集群实现集群协调管理，这些全部功能统称为 SolrCloud。

SolrCloud 是基于 Zookeeper 进行管理的。在 Solr 中已经内置了 Zookeeper 相关内容，当执行集群创建命令会自动创建 Zookeeper 相关内容。这个使用的是 Zookeeper 的集群管理功能实现的。

## 1.搭建

### 1.1 创建

SolrCloud 已经包含在了 Solr 中，可以直接启动 Solr 集群。

#./solr -e cloud -noprompt -force

此命令等同于#./solr -e cloud -force 全部参数为默认值。

运行成功后会在 example 文件夹多出 cloud 文件夹

### 1.2 停止

#./solr stop -all

### 1.3 重新运行

#./solr start -c -p 8983 -s …/example/cloud/node1/solr/ -force

#./solr start -c -p 7574 -z localhost:9983 -s …/example/cloud/node2/solr/ -force
