# 02、Solr速成 部署Solr7.1.0到tomcat
- 来源：https://ddkk.com/zhuanlan/search/solr/3/15.html
- 分类：搜索引擎
- 分组：Solr 教程 (B)
官方表示solr5之后的版本不再提供对第三方容器的支持（不提供war包了）。

“旧式”solr.xml格式不再支持，核心必须使用core.properties文件定义。

使用第三方容器的需要自己手动修改一下，这个主要是看需求。

关于版本升级，自行get

solr版本和jdk对照表

solr7文档地址：http://lucene.apache.org/solr/7_1_0/

## 1、下载

**1、** tomcat8最低jdk版本1.7以上；

tomcat8地址：[http://archive.apache.org/dist/tomcat/tomcat-8/v8.5.9/bin/](http://archive.apache.org/dist/tomcat/tomcat-8/v8.5.9/bin/)

安装Tomcat服务器以及错误汇总（tomcat8.0、jdk8）：[http://www.cnblogs.com/hyyq/p/5933214.html](http://www.cnblogs.com/hyyq/p/5933214.html)

**2、** solr7.1.0最低jdk版本1.8以上；

solr地址：[http://lucene.apache.org/solr/](http://lucene.apache.org/solr/)

**3、** 为了统一，安装jdk1.8版本；

jdk地址：[http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

介绍一下solr下载方式：

solr版本可以在官网上下载(http://lucene.apache.org/solr/)

如果不是使用最新版本：

选择相应的版本：

## 2、安装tomcat8

### 1、解压

解压 tomcat8到D盘，D:\apache-tomcat-8.5.9

### 2、配置tomcat环境多个jdk版本，自定义使用JDK版本及路径

在正常开发时，可能会遇到系统中，不同的tomcat环境的jdk版本不一致，需要手动配置不同的tomcat对应不同的jdk版本

如：solr的服务器最低jdk版本是1.8，其他项目的jdk是1.7,为了不影响其他的功能开发，需要进行手动配置高版本tomcat对应的jdk

修改tomcat/bin/目录下的catalina.bat文件指定jdk，添加如下内容：

```java
set JAVA_HOME=D:\Java\jdk1.8.0_151
```

### 3、启动

启动测试tomcat8

### 4、测试访问tomcat8

tocmat8运行正常~~~

下一步安装solr7，安装之前先关闭tomcat8

## 3、安装solr

与早期的版本相比，如：solr-4.10.3\example\webapps有提供solr.war包，新版本solr7没有了，配置会相对麻烦些

### 1、拷贝工程文件夹到tomcat（solr5、6、7 配置方式基本一致）

复制D:\solr-7.1.0\server\solr-webapp\webapp到tomcat下的webapps目录下，并改名为solr（solr为工程名）

## 2、拷贝相关jar包

将solr-7.1.0\server\lib\ext下的所有jar包，以及solr-7.1.0\server\lib下以metrics开头的jar、gmetric4j-1.0.7.jar复制到D:\apache-tomcat-8.5.9\webapps\solr\WEB-INF\lib下

全部jar包如下：

## 3、拷贝日志配置

在D:\apache-tomcat-8.5.9\webapps\solr\WEB-INF目录新建classes文件夹，将solr-7.1.0\server\resources下的log4j.properties文件拷贝到里面。

## 4、指定solr日志记录存放地址

修改tomcat脚本catalina.bat，增加solr.log.dir系统变量，指定solr日志记录存放地址。

注：如果不处理此步，日志将不能正常打印。log4j.properties中有依赖此变量。

**1、** 在D盘创建solr_home目录；

**2、** 拷贝solr-7.1.0\server\solr\下所有文件、文件夹至D:\solr_home目录下（也可以直接整个拷贝solr文件夹到d盘，并将其改名为solr_home）；

**3、** 配合solr日志记录存放地址，在D:\solr_home目录下新建logs文件夹；

**4、** 拷贝solr-7.1.0下contrib和dist文件夹至D:\solr_home目录下；

## 5、修改D:\solr_home\core1\conf\solrconfig.xml文件，如下。

## 6、配置web.xml

修改D:\apache-tomcat-8.5.9\webapps\solr\WEB-INF中的web.xml文件 新增如下部分，默认是注释掉的。

其中env-entry-value值为%SOLR_HOME%对应值，即SOLR HOME目录。

注释如下部分内容

## 7、 启动tomcat

访问[http://localhost:8080/solr/index.html](http://localhost:8080/solr/index.html)

solr5.0版本以后访问管理页面的URL发生了很大改变，这里需要注意，solr7.0在访问时项目后面需要加index.html

**这里总结一下solr不同版本的管理页面访问的方式**

版本
URL

solr4
http://localhost:8080/solr

solr5
http://localhost:8080/solr/admin.html

solr6
 http://localhost:8080/solr/index.html

solr7
http://localhost:8080/solr/index.html

## 8、运行查看

1、点击Logging菜单，正常展示如下：

如果不修改D:\solr_home\core1\conf\solrconfig.xml，将报如下错误：

## 8、点击Core Admin菜单，如果没有Core，会弹出如下框，提示添加。

在D:\solr_home目录下新建 core1实例 文件夹；并拷贝 D:\solr-7.1.0\server\solr\configsets\_default 目录下conf配置文件夹至D:\solr_home\core1下。

可以手动添加实例，对应D:\solr_home\core1的目录，将instanceDir改为core1，其他可以默认，name可以自定义

配置对应的位置：

instanceDir ：对应%SOLR_HOME%\core1.

dataDir ：对应%SOLR_HOME%\core1\data

config ：对应%SOLR_HOME%\core1\conf\solrconfig.xml

schema ：对应%SOLR_HOME%\core1\conf\managed-schema
