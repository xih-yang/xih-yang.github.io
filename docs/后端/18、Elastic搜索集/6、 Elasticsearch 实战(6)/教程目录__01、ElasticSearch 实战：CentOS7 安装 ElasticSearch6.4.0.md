# 01、ElasticSearch 实战：CentOS7 安装 ElasticSearch6.4.0
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/1.html
- 分类：搜索引擎
- 分组：教程目录
## 一、安装jre支持

在CentOS中安装ElasticSearch需要Java1.8.0，可执行命令# java -version查看当前系统所安装Java版本是否为1.8.0版本。

若非1.8.0版本，执行命令# yum install java-1.8.0-openjdk* -y 进行安装。

## 二、下载elasticsearch

官方网站下载：[https://www.elastic.co/cn/downloads/elasticsearch](https://www.elastic.co/cn/downloads/elasticsearch)

因为是centos中运行 所以选择 tar.gz压缩包；

下载后用ftp上传到centos里 我们把这个文件上传到 /opt 路径下

## 三、安装elasticsearch

解压：tar -zvxf elasticsearch-6.4.0.tar.gz

elasticsearch 不需要特别的配置，只需要启动即可

切到elasticsearch的目录下进行启动：bin/elasticsearch

### 产生报错信息：

[WARN ][o.e.b.ElasticsearchUncaughtExceptionHandler] [] uncaught exception in thread [main]

org.elasticsearch.bootstrap.StartupException: java.lang.RuntimeException: can not run elasticsearch as root

这是因为elasticsearch不能以root账户启动，所以需新建一个用户启动

# useradd es

# chown -R es:es /opt/elasticsearch-6.4.0/

然后切换到es用户，重新启动elasticsearch

启动完成后，可使用命令# curl http://localhost:9200 验证服务是否开启成功

```java
{
  "name" : "pMZtimx",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "fgi2ZQdRQImNMp0MWQHbIw",
  "version" : {
    "number" : "6.4.0",
    "build_flavor" : "default",
    "build_type" : "tar",
    "build_hash" : "595516e",
    "build_date" : "2018-08-17T23:18:47.308994Z",
    "build_snapshot" : false,
    "lucene_version" : "7.4.0",
    "minimum_wire_compatibility_version" : "5.6.0",
    "minimum_index_compatibility_version" : "5.0.0"
  },
  "tagline" : "You Know, for Search"
}
出现类似这段文字，说明服务开启成功。
```
