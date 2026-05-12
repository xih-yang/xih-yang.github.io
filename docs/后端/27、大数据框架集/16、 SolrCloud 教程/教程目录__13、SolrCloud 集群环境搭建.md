# 13、SolrCloud 集群环境搭建
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/13.html
- 分类：搜索引擎
- 分组：教程目录
我们基于Solr4.10.3版本进行安装配置SolrCloud集群，通过实践来实现索引数据的分布存储和检索。

## 1、准备工作

**1.服务器**

```java
solrcloud01 192.168.137.171
solrcloud02 192.168.137.172
solrcloud03 192.168.137.173
```

**2.资源文件**

上传到/home/test

```java
apache-solr-dataimportscheduler.jar 数据导入定时器
IK Analyzer 2012FF_hf1.zip 中文分词器
solr-4.10.3.tgz.tar
zookeeper-3.4.5.tar.gz
mysql-connector-java-3.1.13-bin.jar
```

以上资源可以从百度网盘获取。

链接：http://pan.baidu.com/s/1mhNbTxA 密码：8xnl

**3.安装目录准备**

```java
mkdir -p /home/solr/cloud
cd /home/solr/cloud
mkdir lib multicore data
```

## 2、zookeeper集群搭建

在3台服务器中搭建zookeeper服务。

```java
    进行解压：        tar -zxvf zookeeper-3.4.5.tar.gz 
    重命名：        mv zookeeper-3.4.5 /usr/local/zookeeper
    修改环境变量：    vi /etc/profile
                    export ZOOKEEPER_HOME=/usr/local/zookeeper
                    export PATH=.:$ZOOKEEPER_HOME/bin:$JAVA_HOME/bin:$PATH
    刷新：          source /etc/profile
    到zookeeper下修改配置文件  
                    cd /usr/local/zookeeper/conf
                    mv zoo_sample.cfg zoo.cfg
    修改conf:     vi zoo.cfg  修改两处
                    dataDir=/usr/local/zookeeper/data            
                    最后面添加 
                            server.0=bhz:2888:3888
                        server.1=hadoop1:2888:3888
                        server.2=hadoop2:2888:3888
    服务器标识配置：cd /usr/local/zookeeper/
                    创建文件夹：mkdir data
                    cd data
                    创建文件myid并填写内容为0：vi myid (内容为服务器标识 ： 0)
                    其他两个服务器的值修改为1和2            
    启动zookeeper：
      路径：/usr/local/zookeeper/bin
     执行：zkServer.sh start (注意这里3台机器都要进行启动)
     状态：zkServer.sh status(在三个节点上检验zk的mode,一个leader和俩个follower)
     停止：zkServer.sh stop
     启动验证：输入jps，存在 QuorumPeerMain 进程的话，就说明 Zookeeper 启动成功了。
```

## 3、SolrCloud集群搭建

首先在一个节点上对SOLR进行配置，我们选择192.168.137.171节点。

**1.SOLR基本配置**

(1)解压solr tar文件并把solr.war文件copy到tomcat的webapps下面

```java
cd /home/test
tar -zxvf solr-4.10.3.tgz.tar -C /usr/local
cp /usr/local/solr-4.10.3/example/webapps/solr.war /home/tomcat6/webapps/
cd /home/tomcat6/webapps/ && mkdir solr-cloud && unzip solr.war -d solr-cloud && rm -rf solr.war
```

(2)copy日志关联jar到solr工程的lib下面

```java
cp /usr/local/solr-4.10.3/example/lib/ext/*.jar /home/tomcat6/webapps/solr-cloud/WEB-INF/lib/
cp /home/tomcat6/webapps/solr-cloud/WEB-INF/lib/*.jar /home/solr/cloud/lib/
```

(3)增加log配置文件

```java
mkdir -p /home/tomcat6/webapps/solr-cloud/WEB-INF/classes
cp /usr/local/solr-4.10.3/example/resources/log4j.properties /home/tomcat6/webapps/solr-cloud/WEB-INF/classes/
```

(4)修改编码

vim/home/tomcat6/conf/server.xml里面加上编码设置

(5)slor core配置文件

首先建立关联目录

```java
cd /home/solr/cloud/multicore && mkdir collection1 && touch solr.xml zoo.cfg && cd collection1 && mkdir conf data && cd conf && touch schema.xml solrconfig.xml solrcore.properties
```

其次写好配置文件

vim/home/solr/cloud/multicore/collection1/conf/schema.xml

```xml
<?xml version="1.0" ?>
<schema name="example core two" version="1.1">
    <field name="id" type="string" indexed="true" stored="true" multiValued="false" required="true" />
    <field name="stu_name" type="text_ik" indexed="true"  stored="true"  multiValued="false" /> 
    <field name="stu_sex"  type="int" indexed="true"  stored="true"  multiValued="false" /> 
    <field name="stu_address" type="text_ik" indexed="true"  stored="true"  multiValued="false" />
    <field name="_version_" type="long" indexed="true" stored="true" />
    <fieldType name="int" class="solr.TrieIntField" precisionStep="0" positionIncrementGap="0"/>
<fieldType name="long" class="solr.TrieLongField" precisionStep="0" positionIncrementGap="0"/>
<fieldType name="string" class="solr.StrField" sortMissingLast="true" />
    <fieldType name="text_ik" class="solr.TextField">
          <analyzer type="index" class="org.wltea.analyzer.lucene.IKAnalyzer" isMaxWordLength="false"/>  
          <analyzer type="query" class="org.wltea.analyzer.lucene.IKAnalyzer" isMaxWordLength="true"/> 
    </fieldType>
    <uniqueKey>id</uniqueKey>
    <defaultSearchField>stu_name</defaultSearchField>
    <solrQueryParser defaultOperator="OR" />
</schema>
```

vim/home/solr/cloud/multicore/collection1/conf/solrconfig.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<config>
  <luceneMatchVersion>4.10.3</luceneMatchVersion>
  <directoryFactory name="DirectoryFactory" class="${solr.directoryFactory:solr.StandardDirectoryFactory}"/>
  <dataDir>${solr.shard.data.dir:}</dataDir>
  <schemaFactory class="ClassicIndexSchemaFactory"/>
  <updateHandler class="solr.DirectUpdateHandler2">
    <updateLog>
      <str name="dir">${solr.shard.data.dir:}</str>
    </updateLog>
  </updateHandler>
    <requestHandler name="/update/csv" class="solr.CSVRequestHandler" startup="lazy">
    <lst name="defaults">
       <str name="separator">,</str>
       <str name="header">true</str>
       <str name="encapsulator">"</str>
    </lst>
    </requestHandler>
  <!-- realtime get handler, guaranteed to return the latest stored fields 
    of any document, without the need to commit or open a new searcher. The current 
    implementation relies on the updateLog feature being enabled. -->
  <requestHandler name="/get" class="solr.RealTimeGetHandler">
    <lst name="defaults">
      <str name="omitHeader">true</str>
    </lst>
  </requestHandler>  
  <requestHandler name="/replication" class="solr.ReplicationHandler" startup="lazy" /> 
  <requestDispatcher handleSelect="true" >
    <requestParsers enableRemoteStreaming="false" multipartUploadLimitInKB="2048" formdataUploadLimitInKB="2048" />
  </requestDispatcher>
  <requestHandler name="standard" class="solr.StandardRequestHandler" default="true" />
  <requestHandler name="/analysis/field" startup="lazy" class="solr.FieldAnalysisRequestHandler" />
  <requestHandler name="/update" class="solr.UpdateRequestHandler"  />
  <requestHandler name="/admin/" class="org.apache.solr.handler.admin.AdminHandlers" />
  <requestHandler name="/admin/ping" class="solr.PingRequestHandler">
    <lst name="invariants">
      <str name="q">solrpingquery</str>
    </lst>
    <lst name="defaults">
      <str name="echoParams">all</str>
    </lst>
  </requestHandler>
   <requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
    <lst name="defaults">
        <str name="config">data-config.xml</str>
    </lst>
    </requestHandler>
   <query>
    <maxBooleanClauses>1024</maxBooleanClauses>
    <filterCache class="solr.FastLRUCache"
                 size="512"
                 initialSize="512"
                 autowarmCount="0"/>
    <queryResultCache class="solr.LRUCache"
                     size="512"
                     initialSize="512"
                     autowarmCount="0"/>
    <documentCache class="solr.LRUCache"
                   size="512"
                   initialSize="512"
                   autowarmCount="0"/>
    <!-- custom cache currently used by block join --> 
    <cache name="perSegFilter"
      class="solr.search.LRUCache"
      size="10"
      initialSize="0"
      autowarmCount="10"
      regenerator="solr.NoOpRegenerator" />
    <enableLazyFieldLoading>true</enableLazyFieldLoading>
   <queryResultWindowSize>20</queryResultWindowSize>
   <queryResultMaxDocsCached>200</queryResultMaxDocsCached>
    <listener event="newSearcher" class="solr.QuerySenderListener">
      <arr name="queries">
      </arr>
    </listener>
    <listener event="firstSearcher" class="solr.QuerySenderListener">
      <arr name="queries">
        <lst>
          <str name="q">static firstSearcher warming in solrconfig.xml</str>
        </lst>
      </arr>
    </listener>
    <useColdSearcher>false</useColdSearcher>
    <maxWarmingSearchers>2</maxWarmingSearchers>
  </query>
  <!-- config for the admin interface --> 
  <admin>
    <defaultQuery>solr</defaultQuery>
  </admin>
</config>
```

vim/home/solr/cloud/multicore/collection1/conf/solrcore.properties

```java
solr.shard.data.dir=/home/solr/cloud/data
```

属性solr.shard.data.dir在solrconfig.xml文件中被引用过，指定索引数据的存放位置。

vim/home/solr/cloud/multicore/solr.xml

该文件中指定了ZooKeeper的相关配置，已经Solr Core的配置内容：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<solr persistent="true">
    <cores defaultCoreName="collection1" host="${host:}" adminPath="/admin/cores" zkClientTimeout="${zkClientTimeout:15000}" hostPort="8080" hostContext="${hostContext:solr-cloud}">
    </cores>
</solr>
```

注意：这里，我们并没有配置任何的core元素，这个等到整个配置安装完成之后，通过SOLR提供的REST接口，来实现Collection以及Shard的创建，从而来更新这些配置文件。

vim/home/solr/cloud/multicore/zoo.cfg

```java
# The number of milliseconds of each tick
tickTime=2000
# The number of ticks that the initial
# synchronization phase can take
initLimit=10
# The number of ticks that can pass between
# sending a request and getting an acknowledgement
syncLimit=5
# the directory where the snapshot is stored.
# dataDir=/opt/zookeeper/data
# NOTE: Solr defaults the dataDir to <solrHome>/zoo_data
# the port at which the clients will connect
# clientPort=2181
# NOTE: Solr sets this based on zkRun / zkHost params
```

(6)DIH全量增量从Mysql数据库导入数据的配置

cp/usr/local/solr-4.10.3/dist/solr-dataimporthandler-4.10.3.jar /home/tomcat6/webapps/solr-cloud/WEB-INF/lib/

cp/home/test/mysql-connector-java-3.1.13-bin.jar /home/tomcat6/webapps/solr-cloud/WEB-INF/lib/

vim/home/solr/cloud/multicore/collection1/conf/data-config.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dataConfig>
    <dataSource type="JdbcDataSource" driver="com.mysql.jdbc.Driver" url="jdbc:mysql://192.168.137.171:3306/solr" user="root" password="root" batchSize="-1" />
    <document name="testDoc">
        <entity name="student" pk="id"
                query="select * from student where isDeleted=0"
                deltaImportQuery="select * from student where id='${dih.delta.id}'"
                deltaQuery="select id from student where updateTime> '${dataimporter.last_index_time}' and isDeleted=0"
                deletedPkQuery="select id from student where isDeleted=1">
            <field column="id" name="id"/>
            <field column="stu_name" name="stu_name"/>
            <field column="stu_sex" name="stu_sex"/>
            <field column="stu_address" name="stu_address"/>
        </entity>
    </document>
</dataConfig>
```

cp/home/test/apache-solr-dataimportscheduler.jar /home/tomcat6/webapps/solr-cloud/WEB-INF/lib/

vim/home/tomcat6/webapps/solr-cloud/WEB-INF/web.xml

为元素添加一个子元素

```xml
<listener>
        <listener-class>
    org.apache.solr.handler.dataimport.scheduler.ApplicationListener
        </listener-class>
</listener>
```

mkdir –p /home/solr/cloud/multicore/conf

vim/home/solr/cloud/multicore/conf/dataimport.properties

下面是最终我的自动定时更新配置文件内容：syncCores需要在各服务器单独配置

```bash
#################################################
#                                              
#       dataimport scheduler properties        
#                                              
#################################################
#  to sync or not to sync
#  1 - active; anything else - inactive
syncEnabled=1
#  which cores to schedule
#  in a multi-core environment you can decide which cores you want syncronized
#  leave empty or comment it out if using single-core deployment
#  syncCores=game,resource
syncCores=myc_shard2_replica1
#  solr server name or IP address
#  [defaults to localhost if empty]
server=
#  solr server port
#  [defaults to 80 if empty]
port=8080
#  application name/context
#  [defaults to current ServletContextListener's context (app) name]
webapp=solr-cloud
#  URLparams [mandatory]
#  remainder of URL
#http://localhost:8983/solr/collection1/dataimport?command=delta-import&clean=false&commit=true
params=/dataimport?command=delta-import&clean=false&commit=true
#  schedule interval
#  number of minutes between two runs
#  [defaults to 30 if empty]
interval=1
#  重做索引的时间间隔，单位分钟，默认7200，即1天; 
#  为空,为0,或者注释掉:表示永不重做索引
reBuildIndexInterval=0
#  重做索引的参数
reBuildIndexParams=/dataimport?command=full-import&clean=true&commit=true
#  重做索引时间间隔的计时开始时间，第一次真正执行的时间=reBuildIndexBeginTime+reBuildIndexInterval*60*1000；
#  两种格式：2012-04-11 03:10:00 或者  03:10:00，后一种会自动补全日期部分为服务启动时的日期
reBuildIndexBeginTime=03:10:00
```

**(7)中文分词器关联配置**

cd/home/test

unzip IK\ Analyzer\ 2012FF_hf1.zip -d IK

cd/home/test/IK

cpIKAnalyzer2012FF_u1.jar /home/tomcat6/webapps/solr-cloud/WEB-INF/lib/

cpIKAnalyzer.cfg.xml stopword.dic /home/tomcat6/webapps/solr-cloud/WEB-INF/classes/

**2.ZooKeeper管理监控配置文件**

SolrCloud是通过ZooKeeper集群来保证配置文件的变更及时同步到各个节点上，所以，需要将配置文件上传到ZooKeeper集群中：

```bash
java -classpath .:/home/solr/cloud/lib/* org.apache.solr.cloud.ZkCLI -cmd upconfig -zkhost 192.168.137.171:2181,192.168.137.172:2181,192.168.137.173:2181 -confdir /home/solr/cloud/multicore/collection1/conf -confname myconf 
```

```bash
 
```

```bash
 
```

```bash
java -classpath .:/home/solr/cloud/lib/* org.apache.solr.cloud.ZkCLI -cmd linkconfig -collection collection1 -confname myconf -zkhost 192.168.137.171:2181,192.168.137.172:2181,192.168.137.173:2181
```

上传完成以后，我们检查一下ZooKeeper上的存储情况：

zkCli.sh -server 192.168.137.171:2181

**3.Tomcat配置与启动**

vim/home/tomcat6/bin/catalina.sh

在Tomcat的启动脚本bin/catalina.sh中，增加如下配置：

```java
JAVA_OPTS="-server -Xmx128m -Xms128m -verbose:gc -Xloggc:solr_gc.log -Dsolr.solr.home=/home/solr/cloud/multicore -DzkHost=192.168.137.171:2181,192.168.137.172:2181,192.168.137.173:2181"
```

```java
 
```

```java
启动Tomcat服务器：
```

```java
/home/tomcat6/bin/catalina.sh start
```

```java
查看日志：
```

```java
tail -100f /home/tomcat6/logs/catalina.out
```

```java
我们查看一下ZooKeeper中的数据状态，如下所示：
```

zkCli.sh -server 192.168.137.171:2181

```java

```

```java
这时候，SolrCloud集群中只有一个活跃的节点，而且默认生成了一个collection1实例，这个实例实际上虚拟的，因为通过web界面无法访问http://192.168.137.171:8080/solr-cloud/，看不到任何有关SolrCloud的信息，如图所示：
```

**4.同步数据和配置信息，启动其他节点**

在另外两个节点上安装Tomcat和Solr服务器，只需要拷贝对应的目录即可：

另外两个节点rm -rf /home/tomcat6

```java
scp -r /home/tomcat6/ root@192.168.137.172:/home/
scp -r /home/solr/ root@192.168.137.172:/home/
scp -r /home/tomcat6/ root@192.168.137.173:/home/
scp -r /home/solr/ root@192.168.137.173:/home/
```

启动其他Solr服务器节点：

```bash
/home/tomcat6/bin/catalina.sh start
```

```bash
 
```

```bash
查看日志：
```

```bash
tail -100f /home/tomcat6/logs/catalina.out
```

查看ZooKeeper集群中数据状态：

zkCli.sh -server 192.168.137.171:2181

这时，已经存在3个活跃的节点了，但是SolrCloud集群并没有更多信息，访问[http://192.168.137.171:8080/solr-cloud/](http://master:8888/solr-cloud/)后，同上面的图是一样的，没有SolrCloud相关数据。

**5.创建Collection、Shard和Replication**

**(1)创建Collection及初始Shard**

直接通过REST接口来创建Collection，如下所示：

curl 'http://192.168.137.171:8080/solr-cloud/admin/collections?action=CREATE&name=mycollection&numShards=3&replicationFactor=1'

more /home/solr/cloud/multicore/solr.xml

**(2)创建Replication**

下面对已经创建的初始分片进行复制。 shard1已经在192.168.137.173上，我们复制分片到192.168.137.171和192.168.137.172上，执行如下命令：

curl 'http://192.168.137.171:8080/solr-cloud/admin/cores?action=CREATE&collection=mycollection&name=mycollection_shard1_replica_2&shard=shard1'

curl 'http://192.168.137.172:8080/solr-cloud/admin/cores?action=CREATE&collection=mycollection&name=mycollection_shard1_replica_3&shard=shard1'
