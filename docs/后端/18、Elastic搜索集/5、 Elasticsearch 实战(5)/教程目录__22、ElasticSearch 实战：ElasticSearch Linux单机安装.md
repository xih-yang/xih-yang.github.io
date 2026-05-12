# 22、ElasticSearch 实战：ElasticSearch Linux单机安装
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/22.html
- 分类：搜索引擎
- 分组：教程目录
## Linux单机安装

在实践中，一般都采用`Linux`/`Unix`作为`elastic search`的运行服务器，所以下面演示如何在`Linux`环境中安装`Elastic search`。本文讲解单机在`Linux`服务器上如何不部署。

### 文件准备

首先从官网直接下载`Linux`版本的,我们用的是`7.8.0`版本的，下载地址为:[https://www.elastic.co/cn/downloads/past-releases/elasticsearch-7-8-0](https://www.elastic.co/cn/downloads/past-releases/elasticsearch-7-8-0)。你可以选择对应的版本。

把我们准备好的文件直接上传到`linux`服务上就好了。

### 环境准备

本文测试环境选用的是`Centos7`的`linux`系统， 是在本机用的虚拟机。其实任意找台合适的`Linux`主机都可以。

本文测试把文件`elasticsearch-7.8.0-linux-x86_64.tar.gz`放到了路径`/usr/local/` 下。然后解压。

```java
tar -zxvf elasticsearch-7.8.0-linux-x86_64.tar.gz
```

解压完之后在`/usr/local/elasticsearch-7.8.0`文件夹中就是`ES`的安装文件了。

接下来尝试直接启动。在`/usr/local/elasticsearch-7.8.0`文件夹下运行:

```java
bin/elasticsearch
```

开始启动,现在我们就不能在运行`elasticsearch.bat`了， 因为那是`windows`的的批处理脚本。

运行结果如下图：

```java
[root@ddkk.com elasticsearch-7.8.0]# bin/elasticsearch
future versions of Elasticsearch will require Java 11; your Java version from [/usr/local/jdk1.8.0_271/jre] does not meet this requirement
future versions of Elasticsearch will require Java 11; your Java version from [/usr/local/jdk1.8.0_271/jre] does not meet this requirement
[2021-09-07T19:22:52,915][ERROR][o.e.b.ElasticsearchUncaughtExceptionHandler] [localhost.localdomain] uncaught exception in thread [main]
org.elasticsearch.bootstrap.StartupException: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:174) ~[elasticsearch-7.8.0.jar:7.8.0]
        at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:161) ~[elasticsearch-7.8.0.jar:7.8.0]
        at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86) ~[elasticsearch-7.8.0.jar:7.8.0]
        at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:127) ~[elasticsearch-cli-7.8.0.jar:7.8.0]
        at org.elasticsearch.cli.Command.main(Command.java:90) ~[elasticsearch-cli-7.8.0.jar:7.8.0]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:126) ~[elasticsearch-7.8.0.jar:7.8.0]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:92) ~[elasticsearch-7.8.0.jar:7.8.0]
Caused by: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Bootstrap.initializeNatives(Bootstrap.java:111) ~[elasticsearch-7.8.0.jar:7.8.0]
        at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:178) ~[elasticsearch-7.8.0.jar:7.8.0]
        at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:393) ~[elasticsearch-7.8.0.jar:7.8.0]
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:170) ~[elasticsearch-7.8.0.jar:7.8.0]
        ... 6 more
uncaught exception in thread [main]
java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Bootstrap.initializeNatives(Bootstrap.java:111)
        at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:178)
        at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:393)
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:170)
        at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:161)
        at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86)
        at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:127)
        at org.elasticsearch.cli.Command.main(Command.java:90)
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:126)
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:92)
For complete error details, refer to the log at /usr/local/elasticsearch-7.8.0/logs/elasticsearch.log
```

从上述的输出，可以看报的错误是,`can not run elasticsearch as root`. 这句话也太明显了。 就是不能用`root`用户运行es的意思吧。所以我们要创建一个普通用户来搞。

#### 创建用户

因为安全问题，`Elasticsearch`不允许`root`用户直接运行，所以要创建新用户，在`root`用户中创建新用户。本文创建一个`es`的普通用户来执行。

```java
useradd  es 
```

为`es`用户设置密码, 下面命令回车之后可以输入密码。

```java
passwd es 
```

如果出现错误，也可以删除之后再重新创建。删除用户命令

```java
userdel es
```

创建完用户之后，需要将`/usr/local/elasticsearch-7.8.0`文件夹的所有者变为`es`。这样后续的操作`es`才会有权限。

```java
chown -R es:es /usr/local/elasticsearch-7.8.0
```

#### 启动服务

启动服务前首先切换到`es`用户。

```java
su - es
```

再进入到在`/usr/local/elasticsearch-7.8.0`文件夹下运行:

```java
bin/elasticsearch
```

这时候可以再开一个终端。使用`curl`去访问一下。

使用ip去访问。

```java
curl http://192.168.168.101:9200/
```

这个时候的访问结果居然是连不上。如下图.

然后再次尝试使用`localhost`访问一下:

```java
 curl http://localhost:9200/
```

访问结果:

返回了正常内容.

```java
{
  "name" : "localhost.localdomain",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "7pJan4rlRvynGqoGLf8Lhw",
  "version" : {
    "number" : "7.8.0",
    "build_flavor" : "default",
    "build_type" : "tar",
    "build_hash" : "757314695644ea9a1dc2fecd26d1a43856725e65",
    "build_date" : "2020-06-14T19:35:50.234439Z",
    "build_snapshot" : false,
    "lucene_version" : "8.5.1",
    "minimum_wire_compatibility_version" : "6.8.0",
    "minimum_index_compatibility_version" : "6.0.0-beta1"
  },
  "tagline" : "You Know, for Search"
}
```

所以得出结论，如果我们不改配置文件直接启动的话，`ES`默认是只监听了`localhost`的。如果要想使用`ip`或者远程访问，还得修改默认的配置文件。

### 修改配置文件

修改`/usr/local/elasticsearch-7.8.0/config/elasticsearch.yml`文件。加入一下配置.

```java
cluster.name: elasticsearch
node.name: node-1
network.host: 0.0.0.0
http.port: 9200
cluster.initial_master_nodes: ["node-1"]
```

## 修改操作系统配置文件

为了能满足后续`es`在后续运行过程中的需求还需要修改部分系统配置文件

**1、** 修改`/etc/security/limits.conf`.在文件尾部增加一下内容因为es生成的文件数量比较多；

```java
# 每个进程可以打开的文件数的限制
es soft nofile 65536
es hard nofile 65536
# 操作系统级别对每个用户创建的进程数的限制
* hard nproc 4096
```

- 代表linux所有用户

**1、** 修改`/etc/security/limits.d/20-nproc.conf`,在文件末尾增加以下内容；

```java
# 每个进程可以打开的文件数的限制
es soft nofile 65536
es hard nofile 65536
```

**1、** 修改`/etc/sysctl.conf`,在文件末尾增加以下内容；

```java
# 一个进程可以拥有的VMA（虚拟内存区域）的数量，默认为65536
vm.max_map_count=655360
```

如果我们不改这项，启动的时候也会报错。

**1、** 使用以下命令，重新加载以下配置文件；

```java
sysctl -p
```

最后注意这些配置修改之后最好从`es`用户切到`root`,再切回`es`。这样保证环境配置能生效。 要不然可能存在始终提示错误.

最后在测试

```java
curl http://localhost:9200/
```

最后可以得出，这个是后已经可以监听`ip`了。
