# 02、ElasticSearch 实战：Elasticsearch的安装
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/2.html
- 分类：搜索引擎
- 分组：教程目录
### 下载资源

访问官网：https://www.elastic.co/guide/en/elastic-stack/7.x/index.html

选择你需要下载的版本

点击installing the Elastic Stack下载资源=

选择Elasticsearch 的install instructions，下载elasticsearch

选择你的操作系统。这里因为后续演示都是基于linux环境的操作，所以后续的启动和安装都是使用的linux版本

### 启动服务

将Elasticsearch下载到你本地目录。比如我下载到了`/usr/local/elasticsearch-7.2.0`目录下。

将目录切换至bin目录下，执行命令

```java
sh elasticsearch
```

使其保持在后台启动

```java
sh elasticsearch -d
```

**完成启动**

```java
[2019-10-14T22:02:51,710][INFO ][o.e.x.s.a.s.FileRolesStore] [node-1] parsed [0] roles from file [/usr/local/elasticsearch-7.2.0/config/roles.yml]
[2019-10-14T22:02:53,439][INFO ][o.e.x.m.p.l.CppLogMessageHandler] [node-1] [controller/5900] [Main.cc@110] controller (64 bit): Version 7.2.0 (Build 65aefcbfce449b) Copyright (c) 2019 Elasticsearch BV
[2019-10-14T22:02:54,146][DEBUG][o.e.a.ActionModule       ] [node-1] Using REST wrapper from plugin org.elasticsearch.xpack.security.Security
[2019-10-14T22:02:54,732][INFO ][o.e.d.DiscoveryModule    ] [node-1] using discovery type [zen] and seed hosts providers [settings]
[2019-10-14T22:02:55,973][INFO ][o.e.n.Node               ] [node-1] initialized
[2019-10-14T22:02:55,974][INFO ][o.e.n.Node               ] [node-1] starting ...
[2019-10-14T22:02:56,226][INFO ][o.e.t.TransportService   ] [node-1] publish_address {
     172.16.65.21:9300}, bound_addresses {
     0.0.0.0:9300}
[2019-10-14T22:02:56,238][INFO ][o.e.b.BootstrapChecks    ] [node-1] bound or publishing to a non-loopback address, enforcing bootstrap checks
[2019-10-14T22:02:56,293][INFO ][o.e.c.c.Coordinator      ] [node-1] cluster UUID [ERtRnb2wReKgxASSbEQvVg]
[2019-10-14T22:02:56,575][INFO ][o.e.c.s.MasterService    ] [node-1] elected-as-master ([1] nodes joined)[{
     node-1}{
     FFPs350LSWCiiWmL1gBlaw}{
     -8ZrAl0yR5OF8l1PA3N7ww}{
     172.16.65.21}{
     172.16.65.21:9300}{
     ml.machine_memory=8201400320, xpack.installed=true, ml.max_open_jobs=20} elect leader, _BECOME_MASTER_TASK_, _FINISH_ELECTION_], term: 2, version: 16, reason: master node changed {
     previous [], current [{
     node-1}{
     FFPs350LSWCiiWmL1gBlaw}{
     -8ZrAl0yR5OF8l1PA3N7ww}{
     172.16.65.21}{
     172.16.65.21:9300}{
     ml.machine_memory=8201400320, xpack.installed=true, ml.max_open_jobs=20}]}
[2019-10-14T22:02:56,670][INFO ][o.e.c.s.ClusterApplierService] [node-1] master node changed {
     previous [], current [{
     node-1}{
     FFPs350LSWCiiWmL1gBlaw}{
     -8ZrAl0yR5OF8l1PA3N7ww}{
     172.16.65.21}{
     172.16.65.21:9300}{
     ml.machine_memory=8201400320, xpack.installed=true, ml.max_open_jobs=20}]}, term: 2, version: 16, reason: Publication{
     term=2, version=16}
[2019-10-14T22:02:56,775][INFO ][o.e.h.AbstractHttpServerTransport] [node-1] publish_address {
     172.16.65.21:9200}, bound_addresses {
     0.0.0.0:9200}
[2019-10-14T22:02:56,776][INFO ][o.e.n.Node               ] [node-1] started
[2019-10-14T22:02:57,044][INFO ][o.e.l.LicenseService     ] [node-1] license [5ad9af7b-8c98-4ce2-b238-9c6792420d80] mode [basic] - valid
[2019-10-14T22:02:57,061][INFO ][o.e.g.GatewayService     ] [node-1] recovered [0] indices into cluster_state
```

看到下面出现`started`就已经完成启动了。

**请求验证**

现在我们请求：localhost:9200/ 可以看到下面的输出，证明实例已经启动。

```java
{
  "name" : "node-1",
  "cluster_name" : "my-learn",
  "cluster_uuid" : "ERtRnb2wReKgxASSbEQvVg",
  "version" : {
    "number" : "7.2.0",
    "build_flavor" : "default",
    "build_type" : "tar",
    "build_hash" : "508c38a",
    "build_date" : "2019-06-20T15:54:18.811730Z",
    "build_snapshot" : false,
    "lucene_version" : "8.0.0",
    "minimum_wire_compatibility_version" : "6.8.0",
    "minimum_index_compatibility_version" : "6.0.0-beta1"
  },
  "tagline" : "You Know, for Search"
}
```

此时一个Elasticsearch实例已经启动。

### Elasticsearch目录

我们简单了解下其目录内容

```java
[root@**** elasticsearch-7.2.0]# ls
bin  config  data  jdk  lib  LICENSE.txt  logs  modules  NOTICE.txt  plugins  README.textile
```

目录
内容

bin
二进制脚本，包含启动命令和安装插件命令

config
配置⽂文件包含elasticsearch.yml

data
此节点上申请的每个index/shard的数据⽂文件的位置

jdk
jdk文件

lib
依赖包

logs
日志文件

modules
模块文件

plugins
插件包

### 启动服务中的问题

Elasticsearch服务启动的过程中一般会出现下面两种问题。

#### JDK版本错误

在执行`sh elasticsearch`命令之后，可能出现这样的输出内容

```java
future versions of Elasticsearch will require Java 11; your Java version from [/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.212.b04-0.el7_6.x86_64/jre] does not meet this requirement
[2019-10-14T21:32:53,178][WARN ][o.e.b.ElasticsearchUncaughtExceptionHandler] [node-1] uncaught exception in thread [main]
org.elasticsearch.bootstrap.StartupException: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:163) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:150) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:124) ~[elasticsearch-cli-7.2.0.jar:7.2.0]
        at org.elasticsearch.cli.Command.main(Command.java:90) ~[elasticsearch-cli-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:115) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:92) ~[elasticsearch-7.2.0.jar:7.2.0]
Caused by: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Bootstrap.initializeNatives(Bootstrap.java:105) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:172) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:349) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:159) ~[elasticsearch-7.2.0.jar:7.2.0]
        ... 6 more
```

这是因为我启动的是7.X版本，这个版本Elasticsearch需要JDK11.而我电脑上安装的是JDK8。所以这里需要我们切换JDK版本。

**切换JDK版本**

在确保本机安装了JDK11的情况下，修改`/ect/profig`文件内容。

修改前

```java
export JAVA_HOME=/usr/lib/jvm/jre-1.8.0-openjdk-1.8.0.212.b04-0.el7_6.x86_64
```

修改后

```java
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-11.0.4.11-0.el7_6.x86_64
```

修改完毕后执行

```java
source /etc/profile
```

然后查看java版本，完成切换后再次启动es

```java
[root@***** bin]# java -version
openjdk version "11.0.4" 2019-07-16 LTS
OpenJDK Runtime Environment 18.9 (build 11.0.4+11-LTS)
OpenJDK 64-Bit Server VM 18.9 (build 11.0.4+11-LTS, mixed mode, sharing)
```

**es内置java**

再其官网的文章中 https://www.elastic.co/guide/en/elasticsearch/reference/7.2/setup.html

根据上面的内容可以说明，elasticsearch7.X已经内置了JDK。这个时候假如你没有设置`JAVA_HOME`。系统将选择内置的JDK，如果此时存在配置，则使用配置的，如果配置的版本错误则会抛出异常。这可以理解为：就是因为我已经安装了JDK且版本错误才会出现上述问题。

#### 权限问题

当你启动elasticsearch的时候可能会出现下面的错误

```java
[root@****** bin]# sh elasticsearch
OpenJDK 64-Bit Server VM warning: Option UseConcMarkSweepGC was deprecated in version 9.0 and will likely be removed in a future release.
[2019-10-14T21:51:13,510][WARN ][o.e.b.ElasticsearchUncaughtExceptionHandler] [node-1] uncaught exception in thread [main]
org.elasticsearch.bootstrap.StartupException: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:163) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:150) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:124) ~[elasticsearch-cli-7.2.0.jar:7.2.0]
        at org.elasticsearch.cli.Command.main(Command.java:90) ~[elasticsearch-cli-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:115) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:92) ~[elasticsearch-7.2.0.jar:7.2.0]
Caused by: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Bootstrap.initializeNatives(Bootstrap.java:105) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:172) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:349) ~[elasticsearch-7.2.0.jar:7.2.0]
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:159) ~[elasticsearch-7.2.0.jar:7.2.0]
        ... 6 more
```

这是因为安全原因，elasticsearch来不允许使用root直接启动。因为这个原因，那我们需要新建一个用户来启动，具体操作如下

**新建用户**

```java
## 新增一个用户组
groupadd esadmin
## 新增一个用户esadmin在esadmin组下。-g是在用户组下 -p是密码
useradd esadmin -g esadmin -p 密码
```

**完成授权**

```java
cd /usr/local
chown -R esadmin:esadmin elasticsearch-7.2.0
```

**切换用户**

```java
su esadmin
```

然后再次启动es节点就可以了
