# 12、Solr速成之dataimport
- 来源：https://ddkk.com/zhuanlan/search/solr/3/12.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
solr除了利用solrj建立索引外,还可以由列式数据库hbase触发器添加索引,自动全量或者增量索引关系数据库数据等.

dataimport可以配置从任何关系数据库导入索引

## 1.将jar包拷贝到tomcat/webapps/solr/web-inf/lib下面

mysql-connector-java-5.1.6.jar

solr-dataimporthandler-5.3.1.jar

solr-dataimporthandler-extras-5.3.1.jar

solr-dataimportscheduler-1.1.jar

## 2.tomcat/webapps/solr/web-inf/web.xml添加监听

```xml
<listener>
    <listener-class>org.apache.solr.handler.dataimport.scheduler.ApplicationListener</listener-class>
</listener>
```

## 3.solr_home下建立conf目录,conf目录下建立dataimport.properties文件

```java
syncEnabled=1
syncCores=test
server=192.168.126.205
port=8080
webapp=solr
#增量
params=/dataimport?command=delta-import&clean=false&commit=true
#schedule interval default 30min
interval=1
#重做索引的时间间隔,单位分钟,默认7200就是1天
#为空为0或者注释掉,表示永不重做索引
reBuildIndexInterval=2
#重做索引的参数
reBuildIndexParams=/dataimport?command=full-import&clean=true&commit=true
#重做索引时间间隔的计时开始时间,第一次真正执行的时间=reBuildIndexBeginTime+reBuildIndexInterval*60*1000
#两种格式:2012-04-11 03:10:00或者 03:10:00,后一种会自动补全日期部分为服务启动的日期
reBuildIndexBeginTime=
```

## 4.solr_home下对应core下的conf目录下建立data-config.xml文件

```xml
<dataConfig>
    <dataSource type="JdbcDataSource"
                driver="com.mysql.jdbc.Driver"
                url="jdbc:mysql://192.168.1.105:3306/test"
                user="root"
                password="root"/>
    <document>
        <entity name="id"
                query="select id,arm,name from user">
        </entity>
    </document>
</dataConfig>
```

## 5.solr_home下对应core下的conf下修改schema.xml

```xml
<field name="arm" type="string" indexed="true" stored="true" />
```

因为name已经存在了,所以就不添加了

## 6.solr_home下对应core下的conf下修改solrconfig.xml

```xml
<requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
    <lst name="defaults">
      <str name="config">data-config.xml</str>         
    </lst>
</requestHandler>
```

此后数据库有更新,就会导入到solr中
