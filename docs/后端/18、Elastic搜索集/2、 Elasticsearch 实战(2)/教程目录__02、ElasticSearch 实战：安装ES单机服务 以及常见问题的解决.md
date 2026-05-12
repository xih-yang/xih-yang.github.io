# 02、ElasticSearch 实战：安装ES单机服务 以及常见问题的解决
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/2.html
- 分类：搜索引擎
- 分组：教程目录
> 此部署过程以Elasticsearch-6.6.0版本为例, 后续的学习和演示也用此版本.

## 1 准备工作

## 1.1 安装JDK

学习使用ES的前提是成功安装JDK —— 很基础的一项步骤, 这里省略.

此处学习演示所用的JDK版本为:

```java
[root@ddkk.com ~]# java -version
java version "1.8.0_151"
Java(TM) SE Runtime Environment (build 1.8.0_151-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.151-b12, mixed mode)
```

## 1.2 下载安装包

(1)根据自己的系统版本下载相应的安装包, 链接如下:

[https://www.elastic.co/downloads/elasticsearch](https://www.elastic.co/downloads/elasticsearch)

> 这里下载MacOS/Linux系统下的版本elasticsearch-6.6.0.tar.gz.

(2)上传并解压:

```java
# 工作路径
mkdir -p /data/elk-6.6.0
# 上传安装包后解压
tar -zxf elasticsearch-6.6.0.tar.gz
```

## 1.3 创建elastic用户

Elasticsearch的启动, 必须通过专用用户`elastic`启动, 否则将报错.

```java
# 创建用户
useradd elastic -s /bin/bash 
# 为该用户赋予相关操作权限
chown -R elastic:elastic /data/elk-6.6.0
# 修改安装目录名称
mv elasticsearch-6.6.0 es-node
```

## 2 启动ES服务

## 2.1 修改配置文件

修改`${ES_HOME}/config/elasticsearch.yml`文件中关于网络的配置:

```java
# 大约17行, 修改集群名称, 同一个集群中此名称必须相同, 才能组成一个逻辑集群:
cluster.name: heal_es
# 大约23行, 修改节点名称, 可以设置为与主机名称相同:
node.name: es-1
# 大约55行, 指定可通过外部服务器访问本地ES服务:
network.host: 0.0.0.0
# 并指定访问的端口号, 默认是9200, 为了防止冲突, 这里修改为9301:
http.port: 9301
```

另外,如果要考虑到后期的版本升级, 可以指定ES存储索引和日志文件的路径, 否则容易出现数据丢失的情况.

> 默认的路径是Elasticsearch解压包内的data和logs.

```java
# Path to directory where to store the data (separate multiple locations by comma):
#path.data: /data/elk-6.6.0/data
#
# Path to log files:
#path.logs: /data/elk-6.6.0/logs
```

## 2.2 启动服务

```java
# 切换用户
su elastic 
# 启动服务, -d是指在后台启动, 若不用此参数, ES将阻塞当前终端的命令输入功能, 如果强制使用, 将导致ES服务终止
cd /data/elk-6.6.0/es-node
./bin/elasticsearch -d 
```

> 注意事项:

> Elasticsearch必须以 非root用户启动, 否则将抛出如下错误:

```java
[2019-06-24T21:02:07,654][WARN ][o.e.b.ElasticsearchUncaughtExceptionHandler] [es-1] uncaught exception in thread [main]
org.elasticsearch.bootstrap.StartupException: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:163) ~[elasticsearch-6.6.0.jar:6.6.0]
        at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:150) ~[elasticsearch-6.6.0.jar:6.6.0]
        at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86) ~[elasticsearch-6.6.0.jar:6.6.0]
        at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:124) ~[elasticsearch-cli-6.6.0.jar:6.6.0]
        at org.elasticsearch.cli.Command.main(Command.java:90) ~[elasticsearch-cli-6.6.0.jar:6.6.0]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:116) ~[elasticsearch-6.6.0.jar:6.6.0]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:93) ~[elasticsearch-6.6.0.jar:6.6.0]
Caused by: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Bootstrap.initializeNatives(Bootstrap.java:103) ~[elasticsearch-6.6.0.jar:6.6.0]
        at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:170) ~[elasticsearch-6.6.0.jar:6.6.0]
        at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:333) ~[elasticsearch-6.6.0.jar:6.6.0]
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:159) ~[elasticsearch-6.6.0.jar:6.6.0]
        ... 6 more
```

## 3 验证ES服务是否可用

(1)通过`jps`命令查看当前系统中运行的所有Java进程, 前提是JDK的环境变量设置OK:

```java
[elastic@localhost bin]$ jps
25810 Elasticsearch   Elasticsearch的进程号
25926 Jps
```

(2)通过`ps -ef`或`ps aux`命令查看 - 可以查看到启动ES时的JVM参数:

```java
[elastic@gosearch-03 bin]$ ps aux | grep elasticsearch
elastic  24181 83.5  1.2 26269656 1701524 pts/0 Sl  13:51   2:03 /data/jdk1.8.0_151/bin/java 
		-Xms1g -Xmx1g -XX:+UseConcMarkSweepGC -XX:CMSInitiatingOccupancyFraction=75 -XX:+UseCMSInitiatingOccupancyOnly 
		-Des.networkaddress.cache.ttl=60 -Des.networkaddress.cache.negative.ttl=10 -XX:+AlwaysPreTouch -Xss1m 
		-Djava.awt.headless=true -Dfile.encoding=UTF-8 -Djna.nosys=true -XX:-OmitStackTraceInFastThrow -Dio.netty.noUnsafe=true 
		-Dio.netty.noKeySetOptimization=true -Dio.netty.recycler.maxCapacityPerThread=0 -Dlog4j.shutdownHookEnabled=false 
		-Dlog4j2.disable.jmx=true -Djava.io.tmpdir=/tmp/elasticsearch-8345885453572562051 -XX:+HeapDumpOnOutOfMemoryError 
		-XX:HeapDumpPath=data -XX:ErrorFile=logs/hs_err_pid%p.log -XX:+PrintGCDetails -XX:+PrintGCDateStamps 
		-XX:+PrintTenuringDistribution -XX:+PrintGCApplicationStoppedTime -Xloggc:logs/gc.log -XX:+UseGCLogFileRotation 
		-XX:NumberOfGCLogFiles=32 -XX:GCLogFileSize=64m -Des.path.home=/data/elk-6.6.0/es-node -Des.path.conf=/data/elk-6.6.0/es-node/config 
		-Des.distribution.flavor=default -Des.distribution.type=tar -cp /data/elk-6.6.0/es-node/lib/* org.elasticsearch.bootstrap.Elasticsearch -d
elastic  28089  0.0  0.0 103248   844 pts/0    S+   13:54   0:00 grep elasticsearch
```

(3)在MacOS/Linux的终端(或Windows的命令行)下运行命令:

```java
# MacOS/Linux下: 
curl http://localhost:9301/ 
# Windows下: 
Invoke-RestMethod http://localhost:9301 
```

若能出现类似下述浏览器中的信息, 说明ES启动成功.

(4)或在浏览器中访问 "[http://localhost:9301/](http://localhost:9301)", 若能出现下述信息, 说明ES服务启动成功:

(5)启动界面参数解释:

```java
{
  "name" : "es-1",
  "cluster_name" : "heal_es",            当前集群的名称, 同一集群中要保证一致
  "cluster_uuid" : "Rcgt8uy_T5uUAu4DsnXHdQ",
  "version" : {
    "number" : "6.6.0",                  当前运行的ES的版本号
    "build_flavor" : "default",
    "build_type" : "tar",
    "build_hash" : "a9861f4",
    "build_date" : "2019-01-24T11:27:09.439740Z",
    "build_snapshot" : false,            当前运行的版本是不是从源代码构建而来
    "lucene_version" : "7.6.0",          当前ES底层的Lucene的版本号
    "minimum_wire_compatibility_version" : "5.6.0",
    "minimum_index_compatibility_version" : "5.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

## 4 关闭与重启服务

## 4.1 关闭服务

Elasticsearch没有直接关闭或重启服务的命令, 关闭只能通过kill命令杀掉进程的方式, 如下:

```java
[elastic@localhost bin]$ ps aux | grep elasticsearch  查看ES进程的id
[elastic@localhost bin]$ kill -8 25810  通过进程id来杀掉服务
```

## 4.2 重启服务

直接启动服务:

```java
[elastic@localhost bin]$ sh elasticsearch -d
```

> 当然可以编写一个服务脚本, 来方便快捷地启动或关闭Elasticsearch服务.

## 5 常见问题及解决方法

> 说明: 下述问题部分是在Elasticsearch 5.x版本中遇到的, 部分是在6.6.0版本中遇到的, 本篇文章已于2019-06-24日更新, 仅供参考.

## 5.1 使用ES专属用户登录时出错

(1)问题描述:

使用ES专属用户启动ES服务时, 终端抛出如下错误:

```java
[elastic@localhost bin]$ 2018-11-05 04:26:38,466 main ERROR Could not register mbeans java.security.AccessControlException: access denied ("javax.management.MBeanTrustPermission" "register")
     at java.security.AccessControlContext.checkPermission(AccessControlContext.java:472)
     at java.lang.SecurityManager.checkPermission(SecurityManager.java:585)
     ......
SettingsException[Failed to load settings from /data/elk-6.6.0/es-node/config/elasticsearch.yml]; nested: AccessDeniedException[/data/elk-6.6.0/es-node/config/elasticsearch.yml];
     ......
Caused by: java.nio.file.AccessDeniedException: /data/elk-6.6.0/es-node/config/elasticsearch.yml
     ......
```

(2)问题分析:

错误信息说明: 当前用户无的访问被拒绝, 可知ES专属用户无法执行当前应用.

(3)解决方法:

为ES创建专属用户后, 对其赋予相应的读写权限.

```java
# 为该用户赋予相关操作权限
chown -R elastic:elastic /data/elk-6.6.0 
```

## 5.2 syscall filter - 不能安装

(1)问题描述:

启动ES时, 抛出如下错误信息:

```java
 [2018-11-06T03:12:35,812][WARN ][o.e.b.JNANatives         ] unable to install syscall filter: 
 java.lang.UnsupportedOperationException: seccomp unavailable: requires kernel 3.5+ with CONFIG_SECCOMP and CONFIG_SECCOMP_FILTER compiled in
at org.elasticsearch.bootstrap.SystemCallFilter.linuxImpl(SystemCallFilter.java:329) ~[elasticsearch-5.6.10.jar:5.6.10]
......
 [2018-11-06T03:12:39,947][INFO ][o.e.n.Node               ] initialized
 [2018-11-06T03:12:39,947][INFO ][o.e.n.Node               ] [jVSUBme] starting ...
 [2018-11-06T03:12:40,131][INFO ][o.e.t.TransportService   ] [jVSUBme] publish_address {10.0.20.50:9300}, bound_addresses {[::]:9300}
 [2018-11-06T03:12:40,145][INFO ][o.e.b.BootstrapChecks    ] [jVSUBme] bound or publishing to a non-loopback address, enforcing bootstrap checks
 [2018-11-06T03:12:40,148][ERROR][o.e.b.Bootstrap          ] [jVSUBme] node validation exception
 [1] bootstrap checks failed
 [1]: system call filters failed to install; check the logs and fix your configuration or disable system call filters at your own risk
 [2018-11-06T03:12:40,150][INFO ][o.e.n.Node               ] [jVSUBme] stopping ...
 [2018-11-06T03:12:40,186][INFO ][o.e.n.Node               ] [jVSUBme] stopped
 [2018-11-06T03:12:40,186][INFO ][o.e.n.Node               ] [jVSUBme] closing ...
 [2018-11-06T03:12:40,199][INFO ][o.e.n.Node               ] [jVSUBme] closed
```

(2)问题解决:

> Centos 6.5不支持SecComp, 而ES 5.x版本起 bootstrap.system_call_filter 的默认值是 true.
>
> 禁用: 在elasticsearch.yml中配置 bootstrap.system_call_filter=false, 注意要在Memory配置项的下面添加:

```java
bootstrap.system_call_filter: false
```

## 5.3 memory is not locked - 内存没有锁定

(1)问题描述:

启动Elasticsearch时, 抛出如下错误信息:

```java
[2018-11-06T03:18:53,221][WARN ][o.e.b.JNANatives         ] Unable to lock JVM Memory: error=12, reason=Cannot allocate memory
[2018-11-06T03:18:53,232][WARN ][o.e.b.JNANatives         ] This can result in part of the JVM being swapped out.
[2018-11-06T03:18:53,232][WARN ][o.e.b.JNANatives         ] Increase RLIMIT_MEMLOCK, soft limit: 65536, hard limit: 65536
[2018-11-06T03:18:53,233][WARN ][o.e.b.JNANatives         ] These can be adjusted by modifying /etc/security/limits.conf, for example: 
# allow user 'elastic' mlockall
elastic soft memlock unlimited
elastic hard memlock unlimited
 [2018-11-06T03:18:53,233][WARN ][o.e.b.JNANatives         ] If you are logged in interactively, you will have to re-login for the new limits to take effect.
    ......
 [2018-11-06T03:18:57,644][ERROR][o.e.b.Bootstrap          ] [jVSUBme] node validation exception
 [1] bootstrap checks failed
 [1]: memory locking requested for elasticsearch process but memory is not locked
 [2018-11-06T03:18:57,646][INFO ][o.e.n.Node               ] [jVSUBme] stopping ...
 [2018-11-06T03:18:57,693][INFO ][o.e.n.Node               ] [jVSUBme] stopped
 [2018-11-06T03:18:57,693][INFO ][o.e.n.Node               ] [jVSUBme] closing ...
 [2018-11-06T03:18:57,707][INFO ][o.e.n.Node               ] [jVSUBme] closed
```

(2)问题分析:

Elasticsearch的配置文件中有如下选项: `bootstrap.memory_lock: true`, 意为在启动Elasticsearch服务时, 锁定JVM需要的内存, 避免OS层面的Swap交换 —— 降低ES服务性能.

此选项默认为false, 即不开启锁定.

(3)问题解决:

> 1、 在配置文件中用"#"注释掉bootstrap.memory_lock: true, 或修改其值为false;
>
> 2、 或者修改系统/etc/security/limits.conf文件, 为ES专属用户elastic解除限制:

```java
在文件最后添加下述配置, 允许用户'elastic'锁定内存
elastic soft memlock unlimited
elastic hard memlock unlimited
```

## 5.4 max virtual memory - 最大虚拟内存太小

(1)问题描述:

启动Elasticsearch时, 抛出如下错误信息:

```java
ERROR: [1] bootstrap checks failed
[1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
[2019-06-24T21:05:12,355][INFO ][o.e.n.Node               ] [es-1] stopping ...
[2019-06-24T21:05:12,425][INFO ][o.e.n.Node               ] [es-1] stopped
[2019-06-24T21:05:12,426][INFO ][o.e.n.Node               ] [es-1] closing ...
[2019-06-24T21:05:12,439][INFO ][o.e.n.Node               ] [es-1] closed
[2019-06-24T21:05:12,442][INFO ][o.e.x.m.p.NativeController] [es-1] Native controller process has stopped - no new native processes can be started
```

(2)问题分析:

Elasticsearch服务需要大量的虚拟内存支撑, 系统默认的最大虚拟内存是65530, 而ES至少需要262144.

(3)问题解决:

**1、** 切换到root用户下, 修改配置文件`sysctl.conf`:

```java
vim /etc/sysctl.conf
# 修改下述配置, 如果没有就在文件末尾添加:
vm.max_map_count=655360
# 执行命令使修改生效:
sysctl -p
```

**2、** 然后重新启动Elasticsearch, 即可启动成功.

## 5.5 max number of threads - 最大线程数太小

(1)问题描述:

启动Elasticsearch时, 抛出如下错误信息:

```java
ERROR: [2] bootstrap checks failed
[1]: max number of threads [1024] for user [elastic] is too low, increase to at least [4096]
[2]: system call filters failed to install; check the logs and fix your configuration or disable system call filters at your own risk
[2019-06-24T21:51:04,810][INFO ][o.e.n.Node               ] [es-2] stopping ...
[2019-06-24T21:51:04,847][INFO ][o.e.n.Node               ] [es-2] stopped
[2019-06-24T21:51:04,847][INFO ][o.e.n.Node               ] [es-2] closing ...
[2019-06-24T21:51:04,864][INFO ][o.e.n.Node               ] [es-2] closed
[2019-06-24T21:51:04,867][INFO ][o.e.x.m.p.NativeController] [es-2] Native controller process has stopped - no new native processes can be started
```

(2)问题分析:

Elasticsearch服务需要用到多线程以提高执行效率, Cent OS 6.5默认的单个用户最大线程数是1024, 而ES用户至少需要4096.

(3)问题解决:

**1、** 切换到root用户下, 修改配置文件:

```java
[elastic@localhost bin]$ su root
Password: 
[root@ddkk.com bin]# vim /etc/security/limits.d/90-nproc.conf
# 找到如下内容, 如果没有就创建:
*  soft  nproc  1024
# 修改为8192, 其中*表示所有用户:
*  soft  nproc  8192
```

**2、** 保存, 退出, 然后重新登录(可以打开新的会话终端), 最后启动Elasticsearch, 即可启动成功.

## 5.6 max file descriptores - 最大可创建文件数太小

(1)问题描述:

启动Elasticsearch时, 抛出如下错误信息:

```java
ERROR: bootstrap checks failed
max file descriptors [4096] for elasticsearch process likely too low, increase to at least [65536]
[2019-06-24T22:06:04,810][INFO ][o.e.n.Node               ] [es-2] stopping ...
[2019-06-24T22:06:04,847][INFO ][o.e.n.Node               ] [es-2] stopped
[2019-06-24T22:06:04,847][INFO ][o.e.n.Node               ] [es-2] closing ...
[2019-06-24T22:06:04,864][INFO ][o.e.n.Node               ] [es-2] closed
[2019-06-24T22:06:04,867][INFO ][o.e.x.m.p.NativeController] [es-2] Native controller process has stopped - no new native processes can be started
```

(2)问题分析:

Elasticsearch服务在运行期间需要创建大量的本地文件, Cent OS 6.5默认的单个用户最多可操作文件数为4096个, 而ES要求至少需要65536.

(3)问题解决:

**1、** 切换到root用户下, 修改配置文件:

```java
[elastic@localhost bin]$ su root
Password: 
[root@ddkk.com bin]# vim /etc/security/limits.conf
# 找到如下内容, 如果没有就创建:
*  soft  nofile  4096
# 修改为65536, 其中*表示所有用户:
*  soft  nproc   65536
```

**2、** 保存, 退出, 然后重新登录(可以打开新的会话终端), 最后启动Elasticsearch, 即可启动成功.
