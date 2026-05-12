# 02、ElasticSearch 实战：Elasticsearch的核心概念
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/2.html
- 分类：搜索引擎
- 分组：教程目录
这篇文章我们开始真正走进es闲聊一下他的核心概念

### 1、 NRT(Near Realtime）

近实时，两个意思，从写入数据到数据可以被搜索到有一个小延迟（大概1秒）；基于es执行搜索和分析可以达到秒级。

### 2、 Node

节点，安装完es这个es就是1个es节点，节点名称名称可以通过配置文件elasticsearch.yml的node.name属性来配置（默认是随机取的的），节点名称很重要（在执行运维管理操作的时候）。

### 3、 Cluster

集群，多个节点组成1个集群，每个节点属于哪个集群通过每个节点的配置文件elasticsearch.yml的cluster.name属性来配置，刚装好的es节点默认的集群名称是“elasticsearch”，节点默认会去加入一个名称为“elasticsearch”的集群，如果直接启动一堆节点，那么它们会自动组成一个名为"elasticsearch"的集群。假如我只在1个机器上装了1个es，那就可以理解为这是一个只有1个节点的集群。

### 4、 index(索引),type(类型),document,field

一个index对应一个表(商品表)，一个type对应表里的一个类型字段(书，报纸)，一个document对应一条数据(追风筝的人)，一个field对应一条数据的某个属性(价格)。这里要注意的是书和报纸很多字段是一样的(比如商品名称，价格)。es的这几种数据单元，和数据库类似，只是数据库是扁平化存储,java对象数据存储到数据库中，只能拆解开变成扁平的多张表，每次查询的时候还得还原回对象格式，很麻烦，而es用json结构来存储，与面向对象的数据结构是一样的。下面给大家形象化一下:

数据库:insert into product(id,type,product_name,price) values(1,'book','追风筝的人','10');

es:

put/product/book/1

{

"product_name":"追风筝的人",

"price":"10"

}

就这么简单。

### 5、 primary shard

简称shard，单台机器无法存储大量数据，es可以将一个索引中的数据切分为多个shard，分布在多个节点上存储。比如索引1切分后放在shard1,shard2,shard3上，索引2的数据切分后放在shard2,shard3,shard4上,这样就可以横向扩展，存储更多数据。让搜索和分析等操作分布到多台服务器上去执行，也提升了吞吐量和性能。每个shard底层都是一个lucene index。

### 6、 replica shard

简称replica，任何一个服务器随时可能故障或宕机，此时shard可能就会丢失，因此可以为每个shard创建多个replica副本，es会帮我们自动把replica分散在不同机器上。replica可以在shard故障时提供备用服务，保证数据不丢失，多个replica还可以提升搜索操作的吞吐量和性能。primary shard（建立索引时设置，不能修改，默认5个），replica shard（随时修改数量，默认1倍，5primary shard*1=5replica shard），因此默认每个索引有5个primary shard，5个replica shard。
