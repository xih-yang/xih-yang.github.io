# 12、Solr4 数据导入(DIH全量增量同步Mysql数据)
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/12.html
- 分类：搜索引擎
- 分组：教程目录
**1.创建MySQL数据**

```sql
create database solr;
use solr;
DROP TABLE IF EXISTS student;
CREATE TABLE student (
id char(10) NOT NULL,
stu_name varchar(50) DEFAULT NULL,
stu_sex int(1) DEFAULT NULL,
stu_address varchar(200) DEFAULT NULL,
updateTime timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
isDeleted int(1) DEFAULT 0,
PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO student VALUES ('1000000001', '李莉', 0, '上海市中山路',default,default);
INSERT INTO student VALUES ('1000000002', 'Tom', 1, 'NewYork',default,default);
INSERT INTO student VALUES ('1000000003', '张小贝', 0, '江西省泰和县中山路',default,default);
INSERT INTO student VALUES ('1000000004', '鲍勃', 1, '北京市海淀区知春路',default,default);
INSERT INTO student VALUES ('1000000005', 'Tim', 0, 'Paris',default,default);
select * from student;
```

**2. DIH全量从MYSQL数据库导入数据**

**1）配置/home/solrhome/collection1/conf/solrconfig.xml**

**vim /home/solrhome/collection1/conf/solrconfig.xml**

在前面上加上一个dataimport的处理的Handler

```xml
<requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
<lst name="defaults">
<str name="config">data-config.xml</str>
</lst>
</requestHandler>
```

**2）在同目录下添加data-config.xml**

**vim /home/solrhome/collection1/conf/data-config.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dataConfig>
<dataSource type="JdbcDataSource" driver="com.mysql.jdbc.Driver" url="jdbc:mysql://192.168.137.168:3306/solr" user="root" password="root" batchSize="-1" />
<document name="testDoc">
<entity name="student" pk="id"
query="select * from student">
<field column="id" name="id"/>
<field column="stu_name" name="stu_name"/>
<field column="stu_sex" name="stu_sex"/>
<field column="stu_address" name="stu_address"/>
</entity>
</document>
</dataConfig>
```

说明：

dataSource是数据库数据源。

Entity就是一张表对应的实体，pk是主键，query是查询语句。

Field对应一个字段，column是数据库里的column名，后面的name属性对应着Solr的Filed的名字。

**3）修改同目录下的schema.xml，这是Solr对数据库里的数据进行索引的模式**

**vim /home/solrhome/collection1/conf/schema.xml**

```xml
<field name="stu_name" type="text_ik" indexed="true" stored="true" multiValued="false" /> 
<field name="stu_sex" type="int" indexed="true" stored="true" multiValued="false" /> 
<field name="stu_address" type="text_ik" indexed="true" stored="true" multiValued="false" />
```

**4）拷贝关联jar**

拷贝mysql-connector-java-3.1.13-bin.jar和solr-dataimporthandler-4.10.3.jar

cp/usr/local/solr-4.10.3/dist/solr-dataimporthandler-4.10.3.jar /home/tomcat6/webapps/solr/WEB-INF/lib/

cp/home/test/mysql-connector-java-3.1.13-bin.jar /home/tomcat6/webapps/solr/WEB-INF/lib/

**5）重启Solr**

如果配置正确就可以启动成功。

solrconfig.xml是solr的基础文件，里面配置了各种web请求处理器、请求响应处理器、日志、缓存等。

schema.xml配置映射了各种数据类型的索引方案。分词器的配置、索引文档中包含的字段也在此配置。

**6）索引测试**

(1)Solr控制台导入

(2)HTTP方式导入

[http://192.168.137.168:8080/solr/collection1/dataimport?command=full-import&commit=true&clean=false](http://192.168.137.168:8080/solr/collection1/dataimport?command=full-import&commit=true&clean=false)

**7）分批次导入数据**

**如果数据库数据太大，可以分批次导入数据。**

**vim /home/solrhome/collection1/conf/data-config.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dataConfig>
<dataSource type="JdbcDataSource" driver="com.mysql.jdbc.Driver" url="jdbc:mysql://192.168.137.168:3306/solr" user="root" password="root" batchSize="-1" />
<document name="testDoc">
<entity name="student" pk="id"
query="select * from student limit ${dataimporter.request.length} offset ${dataimporter.request.offset}">
<field column="id" name="id"/>
<field column="stu_name" name="stu_name"/>
<field column="stu_sex" name="stu_sex"/>
<field column="stu_address" name="stu_address"/>
</entity>
</document>
</dataConfig>
```

上面主要是通过内置变量 “${dataimporter.request.length}”和 “${dataimporter.request.offset}”来设置一个批次索引的数据表记录数，请求的URL示例如下：

**[http://192.168.137.168:8080/solr/collection1/dataimport?command=full-import&commit=true&clean=false&offset=0&length=2](http://192.168.137.168:8080/solr/collection1/dataimport?command=full-import&commit=true&clean=false&offset=0&length=2)**

**导入效果如下**

**3.DIH增量从MYSQL数据库导入数据**

已经学会了如何全量导入MySQL的数据，全量导入在数据量大的时候代价非常大，一般来说都会适用增量的方式来导入数据，下面介绍如何增量导入MYSQL数据库中的数据，以及如何设置定时来做。

特别注意：DIH增量也是可以做全量数据导入，所以生产环境只要设置DIH增量方式。

**1）数据库表的更改**

新增一个字段updateTime，类型为timestamp，默认值为CURRENT_TIMESTAMP。有了这样一个字段，Solr才能判断增量导入的时候，哪些数据是新的。因为Solr本身有一个默认值last_index_time，记录最后一次做full import或者是delta import(增量导入）的时间，这个值存储在文件conf目录的dataimport.properties文件中。

more dataimport.properties

**2）data-config.xml中必要属性的设置**

**vim /home/solrhome/collection1/conf/data-config.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dataConfig>
<dataSource type="JdbcDataSource" driver="com.mysql.jdbc.Driver" url="jdbc:mysql://192.168.137.168:3306/solr" user="root" password="root" batchSize="-1" />
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

transformer 格式转化：HTMLStripTransformer 索引中忽略HTML标签

query：查询数据库表符合记录数据

deltaQuery：增量索引查询主键ID 注意这个只能返回ID字段

deltaImportQuery：增量索引查询导入的数据

deletedPkQuery：增量索引删除主键ID查询 注意这个只能返回ID字段

增量索引的原理是从数据库中根据deltaQuery指定的SQL语句查询出所有需要增量导入的数据的ID号。

然后根据deltaImportQuery指定的SQL语句返回所有这些ID的数据，即为这次增量导入所要处理的数据。

核心思想是：通过内置变量“${dih.delta.id}”和 “${dataimporter.last_index_time}”来记录本次要索引的id和最近一次索引的时间。

如果业务中还有删除操作，可以在数据库中加一个isDeleted字段来表明该条数据是否已经被删除，这时候Solr在更新index的时候，可以根据这个字段来更新哪些已经删除了的记录的索引。

**3）测试增量导入**

**DIH全量导入**

[http://192.168.137.168:8080/solr/collection1/dataimport?command=full-import&commit=true&clean=true](http://192.168.137.168:8080/solr/collection1/dataimport?command=full-import&commit=true&clean=true)

**修改student数据**

```java
update student set stu_name="jerry" where id = '1000000005';
update student set isDeleted=1 where id = '1000000004';
INSERT INTO student VALUES ('1000000006', 'Tim11', 0, 'Paris',default,default);
```

**DIH增量导入数据**

http://192.168.137.168:8080/solr/collection1/dataimport?command=delta-import

**4）设置增量导入为定时执行的任务**

可以用Windows计划任务，或者Linux的Cron来定期访问增量导入的连接来完成定时增量导入的功能，这其实也是可以的，而且应该没什么问题。

但是更方便，更加与Solr本身集成度高的是利用其自身的定时增量导入功能。

**1、** 增加关联jar；

cp/home/test/apache-solr-dataimportscheduler.jar /home/tomcat6/webapps/solr/WEB-INF/lib/

**2、** 修改solr的WEB-INF目录下面的web.xml文件：

vim/home/tomcat6/webapps/solr/WEB-INF/web.xml

为元素添加一个子元素

```xml
<listener>
<listener-class>
org.apache.solr.handler.dataimport.scheduler.ApplicationListener
</listener-class>
</listener>
```

**3、** 新建配置文件dataimport.properties：

在SOLR_HOME\solr目录下面新建一个目录conf（注意不是SOLR_HOME\solr\collection1下面的conf）

mkdir /home/solrhome/conf

vim/home/solrhome/conf/dataimport.properties

下面是最终我的自动定时更新配置文件内容：

```java
#################################################
#
# dataimport scheduler properties
#
#################################################
# to sync or not to sync
# 1 - active; anything else - inactive
syncEnabled=1
# which cores to schedule
# in a multi-core environment you can decide which cores you want syncronized
# leave empty or comment it out if using single-core deployment
# syncCores=game,resource
syncCores=collection1
# solr server name or IP address
# [defaults to localhost if empty]
server=192.168.137.168
# solr server port
# [defaults to 80 if empty]
port=8080
# application name/context
# [defaults to current ServletContextListener's context (app) name]
webapp=solr
# URLparams [mandatory]
# remainder of URL
#http://localhost:8983/solr/collection1/dataimport?command=delta-import&clean=false&commit=true
params=/dataimport?command=delta-import&clean=false&commit=true
# schedule interval
# number of minutes between two runs
# [defaults to 30 if empty]
interval=1
# 重做索引的时间间隔，单位分钟，默认7200，即1天; 
# 为空,为0,或者注释掉:表示永不重做索引
reBuildIndexInterval=2
# 重做索引的参数
reBuildIndexParams=/dataimport?command=full-import&clean=true&commit=true
# 重做索引时间间隔的计时开始时间，第一次真正执行的时间=reBuildIndexBeginTime+reBuildIndexInterval*60*1000；
# 两种格式：2012-04-11 03:10:00 或者 03:10:00，后一种会自动补全日期部分为服务启动时的日期
reBuildIndexBeginTime=03:10:00
```

**4、** 测试；

重启tomcat

一般来说要在你的项目中引入Solr需要考虑以下几点：

**1、** 数据更新频率：每天数据增量有多大，及时更新还是定时更新；

**2、** 数据总量：数据要保存多长时间；

**3、** 一致性要求：期望多长时间内看到更新的数据，最长允许多长时间延迟；

**4、** 数据特点：数据源包括哪些，平均单条记录大小；

**5、** 业务特点：有哪些排序要求，检索条件；

**6、** 资源复用：已有的硬件配置是怎样的，是否有升级计划；
