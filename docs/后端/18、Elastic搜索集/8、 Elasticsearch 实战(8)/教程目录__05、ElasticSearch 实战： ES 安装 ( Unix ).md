# 05、ElasticSearch 实战： ES 安装 ( Unix )
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/5.html
- 分类：搜索引擎
- 分组：教程目录
上一章节中我们下载了 Elasticsearch 的最新版本，也安装和配置了 Java 环境。接下来，我们将尝试在 Unix 系统上安装 Elasticsearch

Unix 操作系统有三大类，分别是:

**1、** Debian和Ubuntu；

**2、** RedHat和CentOS；

**3、** macOS，俗称苹果电脑；

## Debian 和 Ubuntu apt-get 安装

在Debian 和 Ubuntu 系统上可以使用 apt-get 包管理软件来安装，方法如下

**1、** 使用下面的方式添加公共签名密钥到apt-get中；

```java
wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
```

**2、** 添加Elasticsearch6.x的包缘；

```java
echo "deb http://packages.elastic.co/elasticsearch/6.x/debian stable main" | sudo tee -a /etc/apt/sources.list.d/elasticsearch-6.x.list
```

**3、** 运行apt-getupdate更新软件包信息；

```java
sudo apt-get update
```

**4、** 使用apt-get安装elasticsearch；

```java
sudo apt-get install elasticsearch
```

## RedHat 和 CentOS yum 安装

**1、** 使用下面的rpm命令添加公共签名密钥；

```java
rpm --import https://packages.elastic.co/GPG-KEY-elasticsearch
```

**2、** 使用下面的命令在/etc/yum.repos.d/目录中添加一个elasticsearch.repo；

```java
sudo touch /etc/yum.repos.d/elasticsearch.repo
```

**3、** 然后复制以下内容到/etc/yum.repos.d/elasticsearch.repo中；

```java
[elasticsearch-6.x]
name = Elasticsearch repository for 6.x packages
baseurl = http://packages.elastic.co/elasticsearch/6.x/centos
gpgcheck = 1
gpgkey = http://packages.elastic.co/GPG-KEY-elasticsearch
enabled = 1
```

**4、** 然后就可以使用yum命令来安装elasticsearch了；

```java
yum install elasticsearch
```

## macOS 苹果电脑下安装

苹果电脑下安装 Elasticsearch 的方式最为简单，就是使用 brew 命令

```java
brew install elasticsearch
```

但，一般情况下，elasticsearch 都不是最新的，不过也没关系，都是 6.x 系列，API 变动不大

## 源码安装

打开终端或 shell，然后按照以下命令安装

**1、** 使用unzip或tar命令解压下载好的elasticsearch-6.3.0.zip；

```java
$ unzip elasticsearch-6.3.0.zip 
Archive:  elasticsearch-6.3.0.zip
creating: elasticsearch-6.3.0/
creating: elasticsearch-6.3.0/lib/
...
```

**2、** 创建/usr/local/elasticsearch目录；

```java
$ sudo mkdir -p /usr/local/elasticsearch
```

**3、** 然后把解压之后的elasticsearch-6.3.0移到/usr/local/elasticsearch目录下并重新命名为6.3.0；

```java
$ sudo mv elasticsearch-6.3.0 /usr/local/elasticsearch/6.3.0
```

**4、** 然后我们需要把/usr/local/elasticsearch/6.3.0/bin目录添加到PATH路径中；

```java
$ sudo vi ~/.bashrc
```

然后在文件末尾添加以下语句

```java
export PATH="$PATH:/usr/local/elasticsearch/6.3.0/bin"
```

## 首次启动

在终端里输入 elasticsearch 就可以启动 Elasticsearch

```java
$ elasticsearch
```

启动信息如下

```java
[2018-06-27T15:27:27,118][INFO ][o.e.n.Node               ] [] initializing ...
[2018-06-27T15:27:27,243][INFO ][o.e.e.NodeEnvironment    ] [4zwAMlT] using [1] data paths, mounts [[/ (/dev/disk1s1)]], net usable_space [12.7gb], net total_space [112.8gb], types [apfs]
[2018-06-27T15:27:27,244][INFO ][o.e.e.NodeEnvironment    ] [4zwAMlT] heap size [990.7mb], compressed ordinary object pointers [true]
[2018-06-27T15:27:27,247][INFO ][o.e.n.Node               ] [4zwAMlT] node name derived from node ID [4zwAMlTzRCaioBeOE9PaNw]; set [node.name] to override
[2018-06-27T15:27:27,248][INFO ][o.e.n.Node               ] [4zwAMlT] version[6.3.0], pid[23626], build[default/zip/424e937/2018-06-11T23:38:03.357887Z], OS[Mac OS X/10.13.5/x86_64], JVM[Oracle Corporation/Java HotSpot(TM) 64-Bit Server VM/1.8.0_101/25.101-b13]
[2018-06-27T15:27:27,248][INFO ][o.e.n.Node               ] [4zwAMlT] JVM arguments [-Xms1g, -Xmx1g, -XX:+UseConcMarkSweepGC, -XX:CMSInitiatingOccupancyFraction=75, -XX:+UseCMSInitiatingOccupancyOnly, -XX:+AlwaysPreTouch, -Xss1m, -Djava.awt.headless=true, -Dfile.encoding=UTF-8, -Djna.nosys=true, -XX:-OmitStackTraceInFastThrow, -Dio.netty.noUnsafe=true, -Dio.netty.noKeySetOptimization=true, -Dio.netty.recycler.maxCapacityPerThread=0, -Dlog4j.shutdownHookEnabled=false, -Dlog4j2.disable.jmx=true, -Djava.io.tmpdir=/var/folders/yk/2446sljj6hn82nvzkdgxltmw0000gn/T/elasticsearch.EUHmx4gc, -XX:+HeapDumpOnOutOfMemoryError, -XX:HeapDumpPath=data, -XX:ErrorFile=logs/hs_err_pid%p.log, -XX:+PrintGCDetails, -XX:+PrintGCDateStamps, -XX:+PrintTenuringDistribution, -XX:+PrintGCApplicationStoppedTime, -Xloggc:logs/gc.log, -XX:+UseGCLogFileRotation, -XX:NumberOfGCLogFiles=32, -XX:GCLogFileSize=64m, -Des.path.home=/usr/local/elasticsearch/6.3.0, -Des.path.conf=/usr/local/elasticsearch/6.3.0/config, -Des.distribution.flavor=default, -Des.distribution.type=zip]
[2018-06-27T15:27:31,794][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [aggs-matrix-stats]
[2018-06-27T15:27:31,794][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [analysis-common]
[2018-06-27T15:27:31,794][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [ingest-common]
[2018-06-27T15:27:31,795][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [lang-expression]
[2018-06-27T15:27:31,795][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [lang-mustache]
[2018-06-27T15:27:31,795][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [lang-painless]
[2018-06-27T15:27:31,796][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [mapper-extras]
[2018-06-27T15:27:31,796][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [parent-join]
[2018-06-27T15:27:31,796][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [percolator]
[2018-06-27T15:27:31,796][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [rank-eval]
[2018-06-27T15:27:31,797][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [reindex]
[2018-06-27T15:27:31,797][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [repository-url]
[2018-06-27T15:27:31,797][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [transport-netty4]
[2018-06-27T15:27:31,797][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [tribe]
[2018-06-27T15:27:31,798][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-core]
[2018-06-27T15:27:31,798][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-deprecation]
[2018-06-27T15:27:31,798][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-graph]
[2018-06-27T15:27:31,798][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-logstash]
[2018-06-27T15:27:31,799][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-ml]
[2018-06-27T15:27:31,799][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-monitoring]
[2018-06-27T15:27:31,799][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-rollup]
[2018-06-27T15:27:31,799][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-security]
[2018-06-27T15:27:31,800][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-sql]
[2018-06-27T15:27:31,800][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-upgrade]
[2018-06-27T15:27:31,800][INFO ][o.e.p.PluginsService     ] [4zwAMlT] loaded module [x-pack-watcher]
[2018-06-27T15:27:31,801][INFO ][o.e.p.PluginsService     ] [4zwAMlT] no plugins loaded
[2018-06-27T15:27:38,487][INFO ][o.e.x.s.a.s.FileRolesStore] [4zwAMlT] parsed [0] roles from file [/usr/local/elasticsearch/6.3.0/config/roles.yml]
[2018-06-27T15:27:39,518][INFO ][o.e.x.m.j.p.l.CppLogMessageHandler] [controller/23646] [Main.cc@109] controller (64 bit): Version 6.3.0 (Build 0f0a34c67965d7) Copyright (c) 2018 Elasticsearch BV
[2018-06-27T15:27:40,279][DEBUG][o.e.a.ActionModule       ] Using REST wrapper from plugin org.elasticsearch.xpack.security.Security
[2018-06-27T15:27:40,803][INFO ][o.e.d.DiscoveryModule    ] [4zwAMlT] using discovery type [zen]
[2018-06-27T15:27:42,494][INFO ][o.e.n.Node               ] [4zwAMlT] initialized
[2018-06-27T15:27:42,495][INFO ][o.e.n.Node               ] [4zwAMlT] starting ...
[2018-06-27T15:27:42,876][INFO ][o.e.t.TransportService   ] [4zwAMlT] publish_address {127.0.0.1:9300}, bound_addresses {[::1]:9300}, {127.0.0.1:9300}
[2018-06-27T15:27:46,076][INFO ][o.e.c.s.MasterService    ] [4zwAMlT] zen-disco-elected-as-master ([0] nodes joined)[, ], reason: new_master {4zwAMlT}{4zwAMlTzRCaioBeOE9PaNw}{yOHq2o-QRWywWtYPrH4tuw}{127.0.0.1}{127.0.0.1:9300}{ml.machine_memory=4294967296, xpack.installed=true, ml.max_open_jobs=20, ml.enabled=true}
[2018-06-27T15:27:46,083][INFO ][o.e.c.s.ClusterApplierService] [4zwAMlT] new_master {4zwAMlT}{4zwAMlTzRCaioBeOE9PaNw}{yOHq2o-QRWywWtYPrH4tuw}{127.0.0.1}{127.0.0.1:9300}{ml.machine_memory=4294967296, xpack.installed=true, ml.max_open_jobs=20, ml.enabled=true}, reason: apply cluster state (from master [master {4zwAMlT}{4zwAMlTzRCaioBeOE9PaNw}{yOHq2o-QRWywWtYPrH4tuw}{127.0.0.1}{127.0.0.1:9300}{ml.machine_memory=4294967296, xpack.installed=true, ml.max_open_jobs=20, ml.enabled=true} committed version [1] source [zen-disco-elected-as-master ([0] nodes joined)[, ]]])
[2018-06-27T15:27:46,131][INFO ][o.e.x.s.t.n.SecurityNetty4HttpServerTransport] [4zwAMlT] publish_address {127.0.0.1:9200}, bound_addresses {[::1]:9200}, {127.0.0.1:9200}
[2018-06-27T15:27:46,132][INFO ][o.e.n.Node               ] [4zwAMlT] started
[2018-06-27T15:27:46,150][WARN ][o.e.x.s.a.s.m.NativeRoleMappingStore] [4zwAMlT] Failed to clear cache for realms [[]]
[2018-06-27T15:27:46,269][INFO ][o.e.g.GatewayService     ] [4zwAMlT] recovered [0] indices into cluster_state
[2018-06-27T15:27:46,565][INFO ][o.e.c.m.MetaDataIndexTemplateService] [4zwAMlT] adding template [.watch-history-7] for index patterns [.watcher-history-7*]
[2018-06-27T15:27:46,618][INFO ][o.e.c.m.MetaDataIndexTemplateService] [4zwAMlT] adding template [.watches] for index patterns [.watches*]
[2018-06-27T15:27:46,667][INFO ][o.e.c.m.MetaDataIndexTemplateService] [4zwAMlT] adding template [.triggered_watches] for index patterns [.triggered_watches*]
[2018-06-27T15:27:46,720][INFO ][o.e.c.m.MetaDataIndexTemplateService] [4zwAMlT] adding template [.monitoring-logstash] for index patterns [.monitoring-logstash-6-*]
[2018-06-27T15:27:46,787][INFO ][o.e.c.m.MetaDataIndexTemplateService] [4zwAMlT] adding template [.monitoring-es] for index patterns [.monitoring-es-6-*]
[2018-06-27T15:27:46,827][INFO ][o.e.c.m.MetaDataIndexTemplateService] [4zwAMlT] adding template [.monitoring-beats] for index patterns [.monitoring-beats-6-*]
[2018-06-27T15:27:46,864][INFO ][o.e.c.m.MetaDataIndexTemplateService] [4zwAMlT] adding template [.monitoring-alerts] for index patterns [.monitoring-alerts-6]
[2018-06-27T15:27:46,910][INFO ][o.e.c.m.MetaDataIndexTemplateService] [4zwAMlT] adding template [.monitoring-kibana] for index patterns [.monitoring-kibana-6-*]
[2018-06-27T15:27:46,980][INFO ][o.e.l.LicenseService     ] [4zwAMlT] license [3c99f74c-bedf-47f6-8e1c-8457b2763d07] mode [basic] - valid
[2018-06-27T15:28:16,120][INFO ][o.e.c.r.a.DiskThresholdMonitor] [4zwAMlT] low disk watermark [85%] exceeded on [4zwAMlTzRCaioBeOE9PaNw][4zwAMlT][/usr/local/elasticsearch/6.3.0/data/nodes/0] free: 12.8gb[11.4%], replicas will not be assigned to this node
```

数据很长，也没啥好讲解的，就是启动成功了

## 检查是否成功启动

如果启动成功，可以打开一个新的 shell，然后输入以下命令

```java
curl http://localhost:9200/?pretty
```

输出结果如下

```java
$ curl http://localhost:9200/\?pretty
{
"name" : "4zwAMlT",
"cluster_name" : "elasticsearch",
"cluster_uuid" : "UgKKy4O-TTKrux4cHHcrZQ",
"version" : {
"number" : "6.3.0",
"build_flavor" : "default",
"build_type" : "zip",
"build_hash" : "424e937",
"build_date" : "2018-06-11T23:38:03.357887Z",
"build_snapshot" : false,
"lucene_version" : "7.3.1",
"minimum_wire_compatibility_version" : "5.6.0",
"minimum_index_compatibility_version" : "5.0.0"
},
"tagline" : "You Know, for Search"
}
```

可以看到 version 键下有当前 Elasticsearch 的相关信息，比如版本号为 6.3.0

## 停止 Elasticsearch

如果是开发环境，停止就直接使用 CTRL + C 组合键吧

然后会继续输出以下信息

```java
[2018-06-27T15:32:59,622][INFO ][o.e.n.Node               ] [4zwAMlT] stopping ...
[2018-06-27T15:32:59,656][INFO ][o.e.x.w.WatcherService   ] [4zwAMlT] stopping watch service, reason [shutdown initiated]
[2018-06-27T15:32:59,746][INFO ][o.e.n.Node               ] [4zwAMlT] stopped
[2018-06-27T15:32:59,746][INFO ][o.e.n.Node               ] [4zwAMlT] closing ...
[2018-06-27T15:32:59,772][INFO ][o.e.n.Node               ] [4zwAMlT] closed
```
