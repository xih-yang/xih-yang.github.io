# 19、SolrCloud 集群使用手册之数据导入
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/19.html
- 分类：搜索引擎
- 分组：教程目录
1.使用curl命令方式

SolrCloud时会根据路由规则路由到各个shard。

删除所有数据

curl http://192.168.137.171:8080/solr-cloud/myc_shard1_replica1/update?commit=true -H "Content-Type: text/xml" --data-binary "*:*"

导入XML文档数据

curl http://192.168.137.171:8080/solr-cloud/myc_shard1_replica1/update?commit=true --data-binary @/home/test/student.xml -H 'Content-type:text/xml; charset=utf-8'

导入json文档数据

curl http://192.168.137.171:8080/solr-cloud/myc_shard1_replica1/update?commit=true --data-binary @/home/test/student.json -H 'Content-type:application/json; charset=utf-8'

导入csv文档数据

curl http://192.168.137.171:8080/solr-cloud/myc_shard1_replica1/update?commit=true --data-binary @/home/test/student.csv -H 'Content-type:text/csv; charset=utf-8'

**2. DIH全量增量同步Mysql数据**

DIH全量导入

http://192.168.137.171:8080/solr-cloud/myc_shard1_replica1/dataimport?command=full-import&commit=true&clean=true

DIH增量导入

http://192.168.137.171:8080/solr-cloud/myc_shard1_replica1/dataimport?command=delta-import
