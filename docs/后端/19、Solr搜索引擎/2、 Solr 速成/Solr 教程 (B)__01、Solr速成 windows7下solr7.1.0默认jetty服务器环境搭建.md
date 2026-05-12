# 01、Solr速成 windows7下solr7.1.0默认jetty服务器环境搭建
- 来源：https://ddkk.com/zhuanlan/search/solr/3/14.html
- 分类：搜索引擎
- 分组：Solr 教程 (B)
## 1、下载solr

solr7官网地址：[http://lucene.apache.org/solr/](http://lucene.apache.org/solr/)

jdk8官网地址：[http://www.oracle.com/technetwork/java/javase/downloads/jdk-netbeans-jsp-142931.html](http://www.oracle.com/technetwork/java/javase/downloads/jdk-netbeans-jsp-142931.html)

这个例子的环境是Windows7。开始Solr安装之前，确保你已经安装了JDK8和正确配置JAVA_HOME（solr7.1.0最低jdk版本是1.8）。

## 2、解压solr

解压到D盘根目录

Solr的文件结构：

1、bin文件夹中包含用来启动和停止服务器的脚本。

2、example 文件夹包含几个示例文件。

3、server 文件夹包含logs 文件夹，所有的Solr的日志都写入该文件夹。这将有助于索引过程来检查任何错误日志。

4、在sever文件夹下的Solr文件夹包含不同的集合或核心（core/collection）。对于各集合或核心的配置和数据都存储在相应的集合或核心文件夹。

## 3、利用内置jetty小服务器快速启动

Apache Solr带有一个内置的Jetty服务器。我们可以使用命令行脚本启动服务器，进入 D:\solr-7.1.0\bin 目录，按住shift 点击鼠标右键，在此处打开命令窗口，输入命令

```java
solr start
```

我们必须验证JAVA_HOME已经配置，由于我目前开发用的jdk1.7，现在需要安装jdk1.8用于测试。jdk版本不兼容报如下错误，需要jdk1.8版本

## 重新安装jdk1.8

安装的还挺慢，半个小时 了还没安装成功，我等。。。。。。。。

OK安装成功配置系统环境变量，有时候用户变量会有问题

## 4、再次启动solr

## 5、浏览器测试访问：localhost:8983/solr

端口默认8983

## 6、建立核心（core）------添加solr实例

当Solr的服务器在独立模式下启动的配置称为核心，当它在SolrCloud模式启动的配置称为集合。在这个例子中。首先，我们需要创建一个核心的索引数据。Solr的创建命令有以下选项：

**1、****-c-要创建的核心或集合的名称（必需）；

**2、****-d-配置目录，在SolrCloud模式非常有用；

**3、****-n-配置名称这将默认为核心或集合的名称；

**4、****-p-本地Solr的实例的端口发送create命令;默认脚本试图通过寻找运行Solr的实例来检测端口；

**5、****-s-Numberofshardstosplitacollectioninto,defaultis1.；

**6、****-rf-集合中的每个文件的份数默认值是1；

## 7、创建实例

创建实例为core1

命令：solr create_core -c core1

或者solr create -c core2

默认会在D:\solr-7.1.0\server目录下创建名称为core1的实例

查看实例文件

**8、刷新浏览器**

可以发现core1实例,至此实例创建成功。

## 测试添加数据和查询数据

### 1、添加数据

### 2、查询数据

数据的添加查询基本也没有什么问题，简单的solr搭建基本完成。
