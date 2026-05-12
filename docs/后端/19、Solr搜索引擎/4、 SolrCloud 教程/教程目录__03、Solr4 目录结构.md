# 03、Solr4 目录结构
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/3.html
- 分类：搜索引擎
- 分组：教程目录
**1.整个目录结构**

(1)bin：是脚本的启动目录

(2)contrib：第三方包存放的目录

(3)dist：编译打包后存放目录，即构建后的输出产物存放的目录

(4)docs：solr文档的存放目录

(5)example：示范例子的存放目录和solr搜索引擎框架

(6)licenses：权限相关的

**2.example目录详解**

contexts：jetty的环境

etc：jetty的配置文件

example-DIH：示范例子的存放目录，这里展示了DIH，即数据导入处理的例子

lib：jetty服务器的jar包

multicore：core示例配置文件

resources：资源文件

scripts：脚本文件

solr：solr服务器的配置文件，solr基于jetty服务器开发的

webapps：solr的web工程

start.jar：启动jar包。通过**Java**命令就可以启动一个基于jetty服务器的web工程

**3.认识概念“core”**

打个比方，solr就像是个操作系统，安装在操作系统中的软件就是“core”，每个core有自身的配置文件及数据。解压后的文件/example/solr/collection1就是一个core，这个core由/example/solr/solr.xml管理。

如图：

一个core如果想让solr管理，就需要注册到solr.xml配置文件中，solr.xml配置如见如下：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<solr persistent="true">
 <cores defaultCoreName="collection1" adminPath="/admin/cores" zkClientTimeout="${zkClientTimeout:15000}" hostPort="8983" hostContext="solr">
 <core loadOnStartup="true" instanceDir="collection1" transient="false" name="collection1"/>
</cores>
</solr>
```

**4.创建多个core**

在实际的项目中，有时候一个solr下面不可能只有一个core，会有多个。比如企业搜索、产品搜索等等。这时你可以复制一份或多份/example/solr/collection1到你的solr home中，并改成你想要的文件名，最后把新添加的core注册到/example/solr/solr.xml中：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<solr persistent="true">
 <cores defaultCoreName="collection1" adminPath="/admin/cores" zkClientTimeout="${zkClientTimeout:15000}" hostPort="8983" hostContext="solr">
 <core loadOnStartup="true" instanceDir="collection1" transient="false" name="collection1"/>
<core loadOnStartup="true" instanceDir="newCore" transient="false" name="newCore"/>
</cores> 
</solr>
```

**5.认识core的目录结构**

每个core中都有两个文件，conf和data

conf：主要用于存放core的配置文件，

(1)schema.xml用于定义索引库的字段及分词器等，这个配置文件是核心文件

(2)solrconfig.xml定义了这个core的配置信息，比如：

```xml
<autoCommit>  
<maxTime>15000</maxTime>  
<openSearcher>false</openSearcher>
</autoCommit>
```

定义了什么时候自动提交，提交后是否开启一个新的searcher等等。

data：主要用于存放core的数据，即index-索引文件和log-日志记录。
