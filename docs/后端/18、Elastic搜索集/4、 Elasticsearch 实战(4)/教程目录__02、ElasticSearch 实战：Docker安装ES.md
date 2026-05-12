# 02、ElasticSearch 实战：Docker安装ES
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/2.html
- 分类：搜索引擎
- 分组：教程目录
## 二、Docker 安装

### 1、下载镜像文件

#### 下载elasticsearch

```java
docker pull elasticsearch:7.4.2 存储和检索数据
```

#### 下载kibana

```java
docker pull kibana:7.4.2 可视化检索数据
```

> 注意：elasticsearch 要和 kibana 的版本保持一致！

### 2、创建实例

#### 1. ElasticSearch

```java
mkdir -p /mydata/elasticsearch/config 在mydata文件夹下创建es的config文件夹，将docker中es的配置挂载在外部，当我们在linux虚拟机中修改es的配置文件时，就会同时修改docker中的es的配置
mkdir -p /mydata/elasticsearch/data在mydata文件夹下创建es的data文件夹
echo "http.host:0.0.0.0" >> /mydata/elasticsearch/config/elasticsearch.yml [http.host:0.0.0.0]允许任何远程机器访问es，并将其写入es的配置文件中
chmod -R 777 /mydata/elasticsearch/ 保证权限问题
```

```java
docker run --name elasticsearch -p 9200:9200 -p 9300:9300 \
-e "discovery.type=single-node" \
-e ES_JAVA_OPTS="-Xms64m -Xmx128m" \
-v /mydata/elasticsearch/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
-v /mydata/elasticsearch/data:/usr/share/elasticsearch/data \
-v /mydata/elasticsearch/plugins:/usr/share/elasticsearch/plugins \
-d elasticsearch:7.4.2
# docker run --name elasticsearch 创建一个es容器并起一个名字；
# -p 9200:9200 将linux的9200端口映射到docker容器的9200端口，用来给es发送http请求
# -p 9300:9300 9300是es在分布式集群状态下节点之间的通信端口  \ 换行符
# -e 指定一个参数，当前es以单节点模式运行
# *注意，ES_JAVA_OPTS非常重要，指定开发时es运行时的最小和最大内存占用为64M和128M，否则就会占用全部可用内存
# -v 挂载命令，将虚拟机中的路径和docker中的路径进行关联
# -d 后台启动服务
```

安装完elasticsearch 后我们来启动一下，会发现使用`docker ps`命令查看启动的容器时没有找到我们的 es，这是因为目前 es 的配置文件的权限导致的，因此我们还需要修改一下 es 的配置文件的权限：

```java
[root@10 config]# cd ../
[root@10 elasticsearch]# ls
config  data  plugins
[root@10 elasticsearch]# cll
bash: cll: command not found
[root@10 elasticsearch]# ll
total 0
drwxr-xr-x. 2 root root 31 May 21 14:55 config
drwxr-xr-x. 2 root root  6 May 21 14:52 data
drwxr-xr-x. 2 root root  6 May 21 15:14 plugins
[root@10 elasticsearch]# docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                               NAMES
53c0e82ded18        redis               "docker-entrypoint.s…"   6 weeks ago         Up 4 hours          0.0.0.0:6379->6379/tcp              redis
e1c1b5a6012e        mysql:5.7           "docker-entrypoint.s…"   6 weeks ago         Up 4 hours          0.0.0.0:3306->3306/tcp, 33060/tcp   mysql
[root@10 elasticsearch]# chmod -R 777 /mydata/elasticsearch/
[root@10 elasticsearch]# ll
total 0
drwxrwxrwx. 2 root root 31 May 21 14:55 config
drwxrwxrwx. 2 root root  6 May 21 14:52 data
drwxrwxrwx. 2 root root  6 May 21 15:14 plugins
```

修改完文件权限后，我们使用`docker start elasticsearch`再次启动 es，使用`docker ps`命令查看后发现容器还是没有启动，这是问什么呢？

我们使用`docker logs elasticsearch`看一下 es 的启动日志：

```java
[root@10 elasticsearch]# docker logs elasticsearch
OpenJDK 64-Bit Server VM warning: Option UseConcMarkSweepGC was deprecated in version 9.0 and will likely be removed in a future release.
2020-05-21 15:14:13,179 main ERROR No Log4j 2 configuration file found. Using default configuration (logging only errors to the console), or user programmatically provided configurations. Set system property 'log4j2.debug' to show Log4j 2 internal initialization logging. See https://logging.apache.org/log4j/2.x/manual/configuration.html for instructions on how to configure Log4j 2
Exception in thread "main" SettingsException[Failed to load settings from [elasticsearch.yml]]; nested: ParsingException[Failed to parse object: expecting token of type [START_OBJECT] but found [VALUE_STRING]];
        at org.elasticsearch.common.settings.Settings$Builder.loadFromStream(Settings.java:1097)
        at org.elasticsearch.common.settings.Settings$Builder.loadFromPath(Settings.java:1070)
        at org.elasticsearch.node.InternalSettingsPreparer.prepareEnvironment(InternalSettingsPreparer.java:83)
        at org.elasticsearch.cli.EnvironmentAwareCommand.createEnv(EnvironmentAwareCommand.java:95)
        at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86)
        at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:125)
        at org.elasticsearch.cli.Command.main(Command.java:90)
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:115)
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:92)
Caused by: ParsingException[Failed to parse object: expecting token of type [START_OBJECT] but found [VALUE_STRING]]
        at org.elasticsearch.common.xcontent.XContentParserUtils.ensureExpectedToken(XContentParserUtils.java:78)
        at org.elasticsearch.common.settings.Settings.fromXContent(Settings.java:617)
        at org.elasticsearch.common.settings.Settings.access$400(Settings.java:82)
```

上述错误是由于我之前配置`elasticsearch.yml`文件的时候k-v键值对配置错误导致的，查看 yml 文件会发现我配置的内容是这样的：

```java
http.host:0.0.0.0
```

而实际上k-v键值对之间应该有空格，注意 yml 配置文件中key: value格式`冒号`后面要跟一个`空格`。否则就会导致上面的错误。

因此需要修改一下`elasticsearch.yml`文件，修改为：

```java
http.host: 0.0.0.0
```

修改并保存之后再次使用`docker start elasticsearch`启动 es，使用`docker ps`命令产看后可以看到我的 es 容器已经启动起来了：

在浏览器地址栏访问`http://192.168.56.10:9200/`，可以看到 es 启动成功后返回类似下面的数据：

> 注意192.168.56.10是我的linux虚拟机的地址，读者需要根据自己的虚拟机地址来进行访问
