# 17、SolrCloud 集群使用手册之 Zookeeper 指令
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/17.html
- 分类：搜索引擎
- 分组：教程目录
## 1.upconfig

```bash
java -classpath .:/home/solr/cloud/lib/* org.apache.solr.cloud.ZkCLI -cmd upconfig -zkhost 192.168.137.171:2181,192.168.137.172:2181,192.168.137.173:2181 -confdir /home/solr/cloud/multicore/collection1/conf -confname myconf
```

## 2.linkconfig

将上传到ZooKeeper中配置文件与collection相关联

```bash
java -classpath .:/home/solr/cloud/lib/* org.apache.solr.cloud.ZkCLI -cmd linkconfig -collection collection1 -confname myconf -zkhost 192.168.137.171:2181,192.168.137.172:2181,192.168.137.173:2181
```

**3.修改与上传**

修改的常用做法就是：重新上传，重新上传会覆盖上面的文件

删除zookeeper中的文件或者目录的方式如下：

**1、** shzkCli.sh-serverlocalhost:2181；

**2、** delete/configs/conf1/schema.xml；

注意修改后需要重新reload，但已有数据reload无效
