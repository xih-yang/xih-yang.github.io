# 02、Solr速成之安装
- 来源：https://ddkk.com/zhuanlan/search/solr/3/2.html
- 分类：搜索引擎
- 分组：Solr 教程 (A)
## 1.下载解压solr-5.3.1.tgz

```java
[root@ddkk.com opt]# tar -zxf solr-5.3.1.tgz -C /opt/module/
```

## 2.将solr-5.3.1/server/solr-webapp下的webapp文件夹拷贝到tomcat下的webapp下,并改名solr

```java
[root@ddkk.com solr-webapp]# cp -r webapp/* /opt/module/apache-tomcat-8.5.15/webapps/solr/
```

## 3.拷贝扩展依赖的jar包

将solr-5.3.1\server\lib\ext下的jar包拷贝到apache-tomcat-8\webapps\solr\WEB-INF\lib下

```java
[root@ddkk.com lib]# cp -r ext/* /opt/module/apache-tomcat-8.5.15/webapps/solr/WEB-INF/lib/
```

## 4.拷贝配置文件

将solr-5.3.1\server\resources下的 log4j.properties拷贝到 apache-tomcat-8\webapps\solr\WEB-INF\lib下

```java
[root@ddkk.com server]# cp resources/log4j.properties /opt/module/apache-tomcat-8.5.15/webapps/solr/WEB-INF/lib/
```

## 5.配置home目录

/opt下新建solr_home文件夹

并将solr-5.3.1\server\solr下的内容拷贝到solr_home中

```java
[root@ddkk.com server]# cp -r solr/* /opt/solr_home/
```

## 6.配置apache-tomcat-8\webapps\solr\WEB-INF下的web.xml

```xml
<env-entry>
   <env-entry-name>solr/home</env-entry-name>
   <env-entry-value>/opt/solr_home</env-entry-value>
   <env-entry-type>java.lang.String</env-entry-type>
</env-entry>
```

启动tomcat访问

[http://192.168.126.205:8080/solr/](http://192.168.126.205:8080/solr/)

## 7.创建一个core 相当于数据库一张表

solr_home下建立一个文件夹test

将solr-5.3.1/server/solr/configsets/sample_techproducts_configs下面的conf文件夹拷贝到test下

```java
[root@ddkk.com sample_techproducts_configs]# cp -r ./* /opt/solr_home/test/
```

打开页面点击添加
