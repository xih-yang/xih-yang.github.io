# 05、ElasticSearch 实战：通过Kibana查看ES集群的健康状态、节点和索引个数
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/5.html
- 分类：搜索引擎
- 分组：教程目录
> 在本篇文章之前, 需要完成:
>
> 1、 启动Elasticsearch服务, 至少启动一个节点, 参考博主文章 [ES 02 - Elasticsearch单机服务的部署 (包括常见问题的解决)][ES 02 - Elasticsearch_], 部署Elasticsearch服务;
>
> 2、 启动Kibana, 参考博主文章 [ES 04 - 安装Kibana插件(6.6.0版本)][ES 04 - _Kibana_6.6.0], 安装并启动Kibana;
>
> 3、 通过浏览器访问Kibana;
>
> 4、 进入Dev Tools(开发者工具)界面.

## 1 检查集群的健康状况

ES提供了一套`_cat API`, 可以查看ES中的各类数据.

```java
# 查询API: 
GET _cat/health?v
# 响应信息如下(一行显示不全, 分作两行):
epoch       timestamp  cluster  status  node.total  node.data  shards  pri  relo
1552979327  07:08:47   heal_es  yellow           1          1      33   33     0
init  unassign  pending_tasks  max_task_wait_time  active_shards_percent
   0         5              0                   -                  86.8%
```

(1)**如何快速了解集群的健康状况?** 通过查看status选项的值:

**1、**`green`: 所有primary shard和replica shard都已成功分配, 集群是100%可用的;

**2、**`yellow`: 所有primary shard都已成功分配, 但至少有一个replica shard缺失. 此时集群所有功能都正常使用, 数据不会丢失, 搜索结果依然完整, 但集群的可用性减弱. —— 需要及时处理的警告.

**3、**`red`: 至少有一个primary shard(以及它的全部副本分片)缺失 —— 部分数据不能使用, 搜索只能返回部分数据, 而分配到这个分配上的写入请求会返回一个异常. 此时虽然可以运行部分功能, 但为了索引数据的完整性, 需要尽快修复集群.

(2)**集群状态为什么是yellow?**

**1、** 当前只有一个Elasticsearch节点, 而且此时ES中只有一个Kibana内建的索引数据.

**2、** ES为每个index默认分配5个primary shard和5个replica shard, 为了保证高可用, 它还要求primary shard和replica shard不能在同一个node上.

**3、** 当前服务中, Kibana内建的index是1个primary shard和1个replica shard, 由于只有1个node, 所以只有primary shard被分配和启动了, 而replica shard没有被成功分配(没有其他node可用).

## 2 查看集群中的节点个数

```java
# 查询API: 
GET _cat/nodes?v
# 响应信息如下(一行显示不全, 分作两行):
ip             heap.percent  ram.percent  cpu  load_1m  load_5m  load_15m  
172.16.22.133            49           98    3     0.56     0.74      1.02
node.role  master  name
mdi        *       1UlY804
```

## 3 查看集群中的索引

```java
# 查询API: 
GET _cat/indices?v
# 响应信息如下(一行显示不全, 分作两行): 
health  status  index      uuid                    pri  rep  
green   open    .kibana_1  4q7ELvdcTVilW3UwtMWqeg    1    0
docs.count  docs.deleted  store.size  pri.store.size
        18             0      78.5kb          78.5kb
```
