# 15、SolrCloud 集群使用手册之 Collections API
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/15.html
- 分类：搜索引擎
- 分组：教程目录
**1.创建collection**

```bash
name：指明collection名字
router.name：指定路由策略，默认为compositeId路由
numShards：collection的逻辑分片数量
shards：指定具体的shard列表
replicationFactor：一个分片的replicas数量
maxShardsPerNode ：一个solr节点上可以创建的逻辑分片数量，默认值为1
createNodeSet：可以指定在那些solr节点上创建collection
```

## 路由规则

SolrCloud中对于文档分布在哪个shard上，提供了两种路由算法：compositeId和implicit

在创建Collection时，需要通过router.name指定路由策略，默认为compositeId路由。

## compositeId#

该路由为一致性哈希路由，shards的哈希范围从80000000~7fffffff。初始创建collection是必须指定numShards个数，compositeId路由算法根据numShards的个数，计算出每个shard的哈希范围，因此路由策略不可以扩展shard。

## implicit#

该路由方式指定索引具体落在路由到哪个Shard，这与compositeId路由方式索引可均匀分布在每个shard上不同。同时只有在implicit路由策略下才可创建shard。

利用solrJ新建索引时，需要在代码中指定索引具体落在哪个shard上，添加代码：

doc.addField("_route_", "shard_X");

同时在schema.xml添加字段

当我们想指定配置文件，索引目录时，可以加入如下参数

property.name=value

string

No

Set core property name to value. See core.properties file contents.

可选参数如下：

key

Description

name

The name of the SolrCore. You'll use this name to reference the SolrCore when running commands with the CoreAdminHandler.

config

The configuration file name for a given core. The default is solrconfig.xml.

schema

The schema file name for a given core. The default is schema.xml

dataDir

Core's data directory as a path relative to the instanceDir, data by default.

configSet

If set, the name of the configset to use to configure the core (see Config Sets).

properties

The name of the properties file for this core. The value can be an absolute pathname or a path relative to the value of instanceDir.

transient

If true, the core can be unloaded if Solr reaches the transientCacheSize. The default if not specified is false. Cores are unloaded in order of least recently used first.

loadOnStartup

If true, the default if it is not specified, the core will loaded when Solr starts.

coreNodeName

Added in Solr 4.2, this attributes allows naming a core. The name can then be used later if you need to replace a machine with a new one. By assigning the new machine the same coreNodeName as the old core, it will take over for the old SolrCore.

ulogDir

The absolute or relative directory for the update log for this core (SolrCloud)

shard

The shard to assign this core to (SolrCloud)

collection

The name of the collection this core is part of (SolrCloud)

roles

Future param for SolrCloud or a way for users to mark nodes for their own use.

使用Collections API：CREATE来创建collection时需要符合下面的条件。

shards*replicationFactor <= maxShardsPerNode*Node数

http://192.168.137.171:8080/solr-cloud/admin/collections?action=CREATE&name=myc&numShards=2&replicationFactor=3&maxShardsPerNode=2

http://192.168.137.171:8080/solr-cloud/admin/collections?action=CREATE&name=myc2&numShards=2&replicationFactor=2&maxShardsPerNode=2&createNodeSet=192.168.137.171:8080_solr-cloud,192.168.137.172:8080_solr-cloud

http://192.168.137.171:8080/solr-cloud/admin/collections?action=CREATE&name=myc3&router.name=implicit&shards=shard1,shard2&replicationFactor=3&maxShardsPerNode=3

指定配置文件

http://192.168.137.171:8080/solr-cloud/admin/collections?action=CREATE&name=myc2&numShards=2&replicationFactor=3&maxShardsPerNode=2&collection.configName=myconf2&property.config=solrconfig2.xml&property.schema=schema2.xml

**2.删除collection**

http://192.168.137.171:8080/solr-cloud/admin/collections?action=DELETE&name=myc2

**3.RELOAD collection**

如果schema中的属性有变动，只需要将正确的schema上传到服务器上之后重启solr即可

http://192.168.137.171:8080/solr-cloud/admin/collections?action=RELOAD&name=myc

**4. SPLITSHARD(纵向扩容)**

使用Collections API：SPLITSHARD来创建SHARD时不需要符合下面的条件。

shards*replicationFactor <= maxShardsPerNode*Node数

整体逻辑：无缝连接和无downtime

旧shard此时继续提供服务并把旧索引转到新的shard上

旧shard同时继续索引新文档

旧shard同时把新文档转发给新shard，新shard索引新文档

旧索引全部迁移到新shard之后，旧shard关闭，新文档直接转发到新的shard上了

手动利用DELETESHARD API删除旧shard

implicit路由：只要创建Shard即可: 新建索引时，将索引建到新建Shard上，查询操作时，指定collection名称，得到的仍是整个集群返回的结果。

compositeId路由：通过分裂（SPLITSHARD）操作实现。

http://192.168.137.171:8080/solr-cloud/admin/collections?action=SPLITSHARD&collection=myc&shard=shard1

**5.CREATESHARD**

### 路由规则为implicit 时才可以使用。

使用Collections API：CREATESHARD来创建shard时需要符合下面的条件。

shards*replicationFactor <= maxShardsPerNode*Node数

http://192.168.137.171:8080/solr-cloud/admin/collections?action=CREATESHARD&collection=myc3&shard=shard3

**6. DELETESHARD**

删除inactive shard

http://192.168.137.171:8080/solr-cloud/admin/collections?action=DELETESHARD&collection=myc2&shard=shard1

**7.CREATEALIAS**

实现跨collection查询，新建和修改都是使用CREATEALIAS。

http://192.168.137.171:8080/solr-cloud/admin/collections?action=CREATEALIAS&name=newc&collections=myc,myc2

**8.DELETEALIAS**

http://192.168.137.171:8080/solr-cloud/admin/collections?action=DELETEALIAS&name=newc

]

**9.DELETEREPLICA**

```bash
http://192.168.137.171:8080/solr-cloud/admin/collections?action=DELETEREPLICA&collection=myc2&shard=shard2&replica=192.168.137.171:8080_solr-cloud_myc2_shard2_replica2
```

```bash
10.ADDREPLICA
```

```bash
http://192.168.137.171:8080/solr-cloud/admin/collections?action=ADDREPLICA&collection=myc2&shard=shard2&node=192.168.137.171:8080_solr-cloud
```

使用Collections API：ADDREPLICA来创建replica时不需要符合下面的条件。

shards*replicationFactor <= maxShardsPerNode*Node数
