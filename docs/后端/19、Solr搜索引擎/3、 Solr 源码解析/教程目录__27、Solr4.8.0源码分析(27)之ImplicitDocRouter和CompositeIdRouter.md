# 27、Solr4.8.0源码分析(27)之ImplicitDocRouter和CompositeIdRouter
- 来源：https://ddkk.com/zhuanlan/search/solr/1/27.html
- 分类：搜索引擎
- 分组：教程目录
同样在公司工作中发现了一个现象，

**1、** 我用/solr/admin/collections?action=CREATE&name=collection&numShards=3&replicationFactor=2创建collection；

**2、** delete其中的一个shard；

**3、** 使用以下命令增加shard，/admin/collections?action=CREATESHARD&shard=*shardName*&collection=*name*；

如此就会报以下错误：shards can be added only to ‘implicit’ collections。

那么是什么原因呢？问题就出在Solr的两种ROUTER方式ImplicitDocRouter和CompositeIdRouter。在SolrCloud的开发文档中有这句话：

```java
Shards can only created with this API for collections that use the ‘implicit’ router. Use SPLITSHARD for collections using the ‘compositeId’ router. A new shard with a name can be created for an existing ‘implicit’ collection.
```

也就是说在创建collections时候(如果指定参数numshards参数会自动切换到router=”compositeId”)，如果采用compositeId方式，那么就不能动态增加shard。如果采用的是implicit方式，就可以动态的增加shard。进一步来讲:

- ImplicitDocRouter就是和 uniqueKey无关,可以在请求参数或者SolrInputDocument中添加_route_(_shard_已废弃，或者指定field参数）参数获取slice ,(router=”implicit”) .
- CompositeIdRouter就是根据uniqueKey的hash值获取slice, (在指定numshards参数会自动切换到router=”compositeId”) .

综上所述，CompositeIdRouter在创建的时候由于指定了numshards参数即已经固定了hash区间，那么在update的时候，根据uniqueid的hash坐落在那个hash区间来决定这份document数据发送至哪个shard。而ImplicitDocRouter则是在创建的时候并不选定每个shard的hash区间，而是在需要update的document中增加_route_字段来存放需要发送的shard名字，以此shard的名字来决定发送至哪个shard。不难看出，相对来说ImplicitDocRouter更加灵活。

在http://stackoverflow.com/questions/15678142/how-to-add-shards-dynamically-to-collection-in-solr中很好的介绍了动态创建/删除shard的好处(ImplicitDocRouter）

```java
One solution to the problem is to use the “implicit router” when creating your Collection.
Solr does supports the ability to add New Shards (or DELETE existing shards) to your index (whenever you want) via the “implicit router” configuration (CREATE COLLECTION API).
Lets say – you have to index all “Audit Trail” data of your application into Solr. New Data gets added every day. You might most probably want to shard by year.
You could do something like the below during the initial setup of your collection:
admin/collections?
action=CREATE&
name=AuditTrailIndex&
router.name=implicit&
shards=2010,2011,2012,2013,2014&
router.field=year
The above command: a) Creates 5 shards – one each for the current and the last 4 years 2010,2011,2012,2013,2014 b) Routes data to the correct shard based on the value of the “year” field (specified as router.field)
In December 2014, you might add a new shard in preparation for 2015 using the CREATESHARD API (part of the Collections API) – Do something like:
/admin/collections?
action=CREATESHARD&
shard=2015&
collection=AuditTrailIndex
The above command creates a new shard on the same collection.
When its 2015, all data will get automatically indexed into the “2015” shard assuming your data has the “year” field populated correctly to 2015.
In 2015, if you think you don’t need the 2010 shard (based on your data retention requirements) – you could always use the DELETESHARD API to do so:
/admin/collections?
action=DELETESHARD&
shard=2015&
collection=AuditTrailIndex
```
