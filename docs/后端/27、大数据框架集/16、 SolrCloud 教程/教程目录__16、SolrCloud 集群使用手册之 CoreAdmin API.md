# 16、SolrCloud 集群使用手册之 CoreAdmin API
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/16.html
- 分类：搜索引擎
- 分组：教程目录
CoreAdminHandler是用来管理Solr cores的，用来管理一个Solr instance中所有的cores。

**1.查看状态STATUS**

http://192.168.137.171:8080/solr-cloud/admin/cores?action=STATUS

**2.创建Core**

name

The name of the new core. Same as "name" on the  element.

instanceDir

The directory where files for this SolrCore should be stored. Same as instanceDir on the  element.

config

(Optional) Name of the config file (solrconfig.xml) relative to instanceDir.

schema

(Optional) Name of the schema file (schema.xml) relative to instanceDir.

datadir

(Optional) Name of the data directory relative to instanceDir.

configSet

(Optional) Name of the configset to use for this core (see [Config Sets](https://cwiki.apache.org/confluence/display/solr/Config+Sets))

collection

(Optional) The name of the collection to which this core belongs. The default is the name of the core. collection.= causes a property of = to be set if a new collection is being created. Use collection.configName= to point to the configuration for a new collection.

shard

(Optional) The shard id this core represents. Normally you want to be auto-assigned a shard id.

property.name=value

(Optional) Sets the core property name to value. See [core.properties file contents](https://cwiki.apache.org/confluence/display/solr/Format+of+solr.xml#Formatofsolr.xml-core.properties_files).

async

(Optional) Request ID to track this action which will be processed asynchronously

**(1)增加shard3的第一个replica(指定core名字和目录)**

http://192.168.137.171:8080/solr-cloud/admin/cores?action=CREATE&name=myc2_s3_r1&instanceDir=myc2_s3_r1_t&collection=myc2&shard=shard3

**(2)增加shard3的第二个replica(指定配置文件)**

http://192.168.137.172:8080/solr-cloud/admin/cores?action=CREATE&name=myc2_s3_r2&instanceDir=myc2_s3_r2&collection=myc2&shard=shard3&config=solrconfig2.xml&schema=schema2.xml

**(3)新建collection(增加shard1的第一个replica)**

http://192.168.137.171:8080/solr-cloud/admin/cores?action=CREATE&name=myc3_s1_r1&instanceDir=myc3_s1_r1&collection=myc3&shard=shard1&configSet=myconf&collection.configName=myconf2

**3.刷新core**

当core的配置文件有变化时，可以reload一下。采用的是无缝连接方式。

http://192.168.137.171:8080/solr-cloud/admin/cores?action=RELOAD&core=myc3_s1_r1

**4.重命名core**

http://192.168.137.171:8080/solr-cloud/admin/cores?action=RENAME&core=myc3_s1_r1&other=coreother

**5.交换core**

交换core的名字，可以把待机core升格为livecore，同时保持可以恢复livecore。

官方示例：http://localhost:8983/solr/admin/cores?action=SWAP&core=core1&other=core0

**6.下线core**

官方示例：http://localhost:8983/solr/admin/cores?action=UNLOAD&core=core0

**7.合并索引**

官方示例：

方式1：http://localhost:8983/solr/admin/cores?action=MERGEINDEXES&core=core0&indexDir=/opt/solr/core1/data/index&indexDir=/opt/solr/core2/data/index

方式2：http://localhost:8983/solr/admin/cores?action=mergeindexes&core=core0&srcCore=core1&srcCore=core2

**8.切分**

官方示例：http://localhost:8983/solr/admin/cores?action=SPLIT&core=core0&targetCore=core1&targetCore=core2

可选参数：

Parameter

Description

Multi-valued

core

The name of the core to be split.

false

path

The directory path in which a piece of the index will be written.

true

targetCore

The target Solr core to which a piece of the index will be merged

true

ranges

A comma-separated list of hash ranges in hexadecimal format

false

split.key

The key to be used for splitting the index

false

async

(Optional) Request ID to track this action which will be processed asynchronously

false

**9.查看请求状态**

官方示例：http://localhost:8983/solr/admin/cores?action=REQUESTSTATUS&requestid=1
