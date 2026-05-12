# 02、Linux 环境下配置 Solr
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/2.html
- 分类：搜索引擎
- 分组：教程目录
**1.准备阶段**

操作系统：CentOS 6.8
安装包：/home/test

> solr-4.10.3.tgz.tar
>
> IK Analyzer 2012FF_hf1.zip
>
> jdk-8u121-linux-i586.tar.gz
>
> apache-tomcat-6.0.51.tar.gz

**2.jdk和tomcat安装：略**

**3.安装solr**

(1)解压solr

> tar -zxvf solr-4.10.3.tgz.tar -C /usr/local

(2) solr.war copy到tomcat下

> cp /usr/local/solr-4.10.3/example/webapps/solr.war /home/tomcat6/webapps/
>
> cd /home/tomcat6/webapps/ && mkdir solr && unzip solr.war -d solr && rm -rf solr.war

(3)修改solr home配置（注意：要把这段内容的注释去掉，否则不生效）：

> vim solr/WEB-INF/web.xml

```java
<env-entry>
<env-entry-name>solr/home</env-entry-name>
<env-entry-value>/home/solrhome</env-entry-value>
<env-entry-type>java.lang.String</env-entry-type>
</env-entry>
```

(4)复制关联jar

> cp /usr/local/solr-4.10.3/example/lib/ext/*.jar /home/tomcat6/webapps/solr/WEB-INF/lib/
>
> cp /usr/local/solr-4.10.3/dist/solrj-lib/*.jar /home/tomcat6/lib/

(5)在tomcat solr下创建classes，并把example/resources/log4j.properties复制到classes中：

> mkdir -p /home/tomcat6/webapps/solr/WEB-INF/classes
>
> cp /usr/local/solr-4.10.3/example/resources/log4j.properties /home/tomcat6/webapps/solr/WEB-INF/classes/
> /home/tomcat6/conf/server.xml里面加上编码设置

(6)创建solrhome

> mkdir /home/solrhome
>
> cp -r /usr/local/solr-4.10.3/example/solr/* /home/solrhome

(7)启动tomcat 然后访问[http://ip:8080/solr](http://ip:8080/solr)

**4.新建mycore**

> mkdir /home/solrhome/mycore
>
> cp -r /usr/local/solr-4.10.3/example/multicore/core0/* /home/solrhome/mycore
>
> 增加mycore

上面的操作会在/home/solrhome/mycore/中生成core.properties。其实可以自己手动添加这个文件。

> 增加document

> 查询document
