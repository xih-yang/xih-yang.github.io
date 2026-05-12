# 03、Flink 集群部署
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/3.html
- 分类：大数据框架
- 分组：教程目录
## 1.环境配置

- 系统环境为 CentOS 7.5 版本。
- 安装 Java 8。
- 安装 Hadoop 集群，Hadoop 建议选择 Hadoop 2.7.5 以上版本。
- 配置集群节点服务器间时间同步以及免密登录，关闭防火墙。 自己配置设置如下：
- 节点服务器 1，IP 地址为 192.168.33.102，主机名为 hadoop102。
- 节点服务器 2，IP 地址为 192.168.33.103，主机名为 hadoop103。
- 节点服务器 3，IP 地址为 192.168.33.104，主机名为 hadoop104。

## 2.集群角色分配

节点服务器
hadoop102
hadoop103
hadoop104

角色
JobManager
TaskManager
TaskManager

## 3.下载解压

### 3.1 下载

进入Flink 官网，下载 1.13.0 版本安装包 flink-1.13.0-bin-scala_2.12.tgz，注意此处选用对 应 scala 版本为 scala 2.12 的安装包。

### 3.2. 解压

在hadoop102 节点服务器上创建安装目录/opt/module，将 flink 安装包放在该目录下，并 执行解压命令，解压至当前目录

```sh
$ tar -zxvf flink-1.13.0-bin-scala_2.12.tgz -C /opt/module/
```

## 4.修改集群配置

1>进入 conf 目录下，修改 flink-conf.yaml 文件，修改 jobmanager.rpc.address 参数为 hadoop102

```java
jobmanager.rpc.address: hadoop102
```

**这就指定了 hadoop102 节点服务器为 JobManager 节点。**

2>修改 workers 文件，将另外两台节点服务器添加为本 Flink 集群的 TaskManager 节点

```sh
$ vi conf/workers
hadoop103
hadoop104
```

**这样就指定了 hadoop103 和 hadoop104 为 TaskManager 节点。**

> 可以在flink-conf.yaml文件中对集群的 JobManager 和 TaskManager 组件进行优化配置，主要配置项如下：

- jobmanager.memory.process.size：对 JobManager 进程可使用到的全部内存进行配置， 包括 JVM 元空间和其他开销，默认为 1600M，可以根据集群规模进行适当调整。
- taskmanager.memory.process.size：对 TaskManager 进程可使用到的全部内存进行配置， 包括 JVM 元空间和其他开销，默认为 1600M，可以根据集群规模进行适当调整。
- taskmanager.numberOfTaskSlots：对每个 TaskManager 能够分配的 Slot 数量进行配置， 默认为 1，可根据 TaskManager 所在的机器能够提供给 Flink 的 CPU 数量决定。所谓 Slot 就是 TaskManager 中具体运行一个任务所分配的计算资源。
- parallelism.default：Flink 任务执行的默认并行度，优先级低于代码中进行的并行度配 置和任务提交时使用参数指定的并行度数量。

## 5.分发安装目录至其他节点

```sh
$ scp -r flink-1.13.0 kun@hadoop103:/opt/module/
$ scp -r flink-1.13.0 kun@hadoop104:/opt/module/
```

## 6.启动集群

1、在 hadoop102 节点服务器上执行 start-cluster.sh 启动 Flink 集群：

```sh
$ bash flink-1.13.0/bin/start-cluster.sh
Starting cluster.
Starting standalonesession daemon on host hadoop102.
Starting taskexecutor daemon on host hadoop103.
Starting taskexecutor daemon on host hadoop104.
```

2、访问Web UI

[http://192.168.33.102:8081/](http://192.168.33.102:8081/)

## 7.提交作业

### 7.1 web页面提交

**1、** 将之前写的wordcount程序打成JAR包；

**2、** 在页面上提交JAR包；

**3、** 指定执行的主类，并行度，参数等等，提交任务；

**4、** 查看任务运行情况，在TaskManagers下查看标准输出；

注: 运行前在Hadoop102 打开nc服务

```sh
$ nc -lk 7777
helle word
hello
hello
word
```

### 7.2 命令行提交Jar包

**1、** 将Jar包上传到linux；

**2、** 执行JAR包，在Hadoop103上执行jar包需要指定JobManager节点；

```sh
$ ./bin/flink run -m hadoop102:8081 -c com.kunan.wc.StreamWordCount -p 2 ../../myjars/MyFlink-1.0-SNAPSHOT.jar
Job has been submitted with JobID 90872e74b0b0dcbebf806a716d8c9dba
 -m hadoop102:8081   				指定jobmanger
 -c com.kunan.wc.StreamWordCount    指定主类
```

**1、** 提交后可在web页面查看任务运行情况；

## 8.部署模式

在一些应用场景中，对于集群资源分配和占用的方式，可能会有特定的需求。Flink 为各 种场景提供了不同的部署模式，主要有以下三种：

- 会话模式（Session Mode）
- 单作业模式（Per-Job Mode）
- 应用模式（Application Mode） 它们的区别主要在于：集群的生命周期以及资源的分配方式；以及应用的 main 方法到底 在哪里执行——客户端（Client）还是 JobManager。

### 8.1会话模式（Session Mode）

- 会话模式其实最符合常规思维。需要先启动一个集群，保持一个会话，在这个会话中通过客户端提交作业，会话模式其实最符合常规思维。
- 需要先启动一个集群，保持一个会话，在这个会话中 通过客户端提交作业，这样的好处很明显，只需要一个集群，就像一个大箱子，所有的作业提交之后都塞进去；
- 集群的生命周期是超越于作业之上的，铁打的营盘流水的兵，作业结束了就释放资源，集群依然正常运行。
- 当然缺点也是显而易见的：因为资源是共享的，所以资源不够了，提交新的作业就会失败。另外，同一个TaskManager上可能运行了很多作业，如果其中一个发生故障导致TaskManager宕机，那么所有作业都会受到影响。
- 上面是先启动集群再提交作业，这种方式其实就是会话模式。**会话模式比较适合于单个规模小、执行时间短的大量作业**。

### 8.2单作业模式（Per-Job Mode）

**会话模式因为资源共享会导致很多问题，所以为了更好地隔离资源，可以考虑为每个提交的作业启动一个集群，这就是所谓的单作业（Per-Job）模式**

- 单作业模式也很好理解，就是严格的一对一，集群只为这个作业而生。同样由客户端运行应用程序，然后启动集群，作业被提交给 JobManager，进而分发给 TaskManager 执行。
- 作业完成后，集群就会关闭，所有资源也会释放。这样一来，每个作业都有它自己的 JobManager 管理，占用独享的资源，即使发生故障，它的 TaskManager 宕机也不会影响其他作业。 这些特性使得单作业模式在生产环境运行更加稳定，所以是实际应用的首选模式。
- 需要注意的是，Flink 本身无法直接这样运行，所以单作业模式一般需要借助一些资源管 理框架来启动集群，比如 YARN、Kubernetes。

### 8.3应用模式（Application Mode）

- 前面提到的两种模式下，应用代码都是在客户端上执行，然后由客户端提交给JobManager的。但是这种方式客户端需要占用大量网络带宽，去下载依赖和把二进制数据发送给 JobManager；加上很多情况下提交作业用的是同一个客户端，就会加重客户端所在节点的资源消耗。
- 解决办法就是，我们不要客户端了，直接把应用提交到 JobManger 上运行。而这也就代表着，我们需要为每一个提交的应用单独启动一个JobManager，也就是创建一个集群。这个JobManager只为执行这一个应用而存在，执行结束之后 JobManager 也就关闭了，这就是所谓的应用模式，

应用模式与单作业模式，都是提交作业之后才创建集群；单作业模式是通过客户端来提交的，客户端解析出的每一个作业对应一个集群；而应用模式下，是直接由 JobManager 执行应 用程序的，并且即使应用包含了多个作业，也只创建一个集群。

总结:

- 在会话模式下，集群的生命周期独立于集群上运行的任何作业的生命周期，并且提交的所有作业共享资源。
- 而单作业模式为每个提交的作业创建一个集群，带来了更好的资源隔离，这时集群的生命周期与作业的生命周期绑定。
- 应用模式为每个应用程序创建一个会话集群，在 JobManager 上直接调用应用程序的 main()方法。

我们所说到的部署模式，相对是比较抽象的概念。实际应用时，一般需要和资源管理平台 结合起来，选择特定的模式来分配资源、部署应用。

下面针对不同的资源提供者 （Resource Provider）的场景，具体介绍 Flink 的部署方式。

## 9.独立模式（Standalone）[集群模式]

- 独立模式（Standalone）是部署 Flink 最基本也是最简单的方式

> 所需要的所有 Flink 组件， 都只是操作系统上运行的一个 JVM 进程;
>
> 独立模式是独立运行的，不依赖任何外部的资源管理平台；

- 当然独立也是有代价的：

> 如果资源不足或者出现故障，没有自动扩展或重分配资源的保证，必须手动处理。所以独立模式 一般只用在开发测试或作业非常少的场景下。
>
> 另外，也可以将独立模式的集群放在容器中运行。Flink 提供了独立模式的容器化部署方式，可以在 Docker 或者 Kubernetes 上进行部署。

### 9.1 会话模式部署

**独立模式的特点是不依赖外部资源管理平台，而会话模式的特点是先启动集群、 后提交作业。所以，上面开始用的就是独立模式（Standalone）的会话模式部署。**

### 9.2 单作业模式部署

Flink 本身无法直接以单作业方式启动集群，一般需要借助一些资 源管理平台。所以 Flink 的独立（Standalone）集群并不支持单作业模式部署。

### 9.3 应用模式部署

应用模式下不会提前创建集群，所以不能调用 start-cluster.sh 脚本。我们可以使用同样在 bin 目录下的 standalone-job.sh 来创建一个 JobManager。

具体步骤:

1、进入到 Flink 的安装路径下，将应用程序的 jar 包放到 lib/目录下。

```sh
$ cp /opt/myjars/MyFlink-1.0-SNAPSHOT.jar /opt/module/flink-1.13.0/lib/
```

2、执行以下命令，启动 JobManager。

```sh
$ bash /opt/module/flink-1.13.0/bin/standalone-job.sh start --job-classname com.kunan.wc.StreamWordCount
Starting standalonejob daemon on host hadoop103.
```

> 这里我们直接指定作业入口类，脚本会到 lib 目录扫描所有的 jar 包。

3、启动 TaskManager。

```sh
$ bash /opt/module/flink-1.13.0/bin/taskmanager.sh start
Starting taskexecutor daemon on host hadoop103.
```

可在webui查看：[http://192.168.33.103:8081/#/overview](http://192.168.33.103:8081/#/overview) 因为是在hadoop103上启动的TaskManager（或者 JobManager?）

4、如果希望停掉集群，同样可以使用脚本，命令如下

```sh
$ bash /opt/module/flink-1.13.0/bin/standalone-job.sh stop
No standalonejob daemon (pid: 3217) is running anymore on hadoop103.
$ bash /opt/module/flink-1.13.0/bin/taskmanager.sh stop
No taskexecutor daemon (pid: 4265) is running anymore on hadoop103.
```

## 10.YARN 模式(推荐)

独立（Standalone）模式由Flink自身提供资源，无需其他框架，这种方式降低了和其他第三方资源框架的耦合性，独立性非常强。

但我们知道，Flink是大数据计算框架，不是资源调度框架，这并不是它的强项；所以还是应该让专业的框架做专业的事，和其他资源调度框架集成更靠谱。

而在目前大数据生态中，应用最为广泛的资源管理平台就是YARN了。所以接下来就学习，在强大的YARN平台上 Flink是如何集成部署的。

整体来说，YARN上部署的过程是：

- 客户端把Flink应用提交给Yarn的ResourceManager,
- Yarn 的 ResourceManager 会向 Yarn 的 NodeManager 申请容器
- 在这些容器上，Flink 会部署 JobManager 和 TaskManager 的实例，从而启动集群。
- Flink 会根据运行在 JobManger 上的作业 所需要的 Slot 数量动态分配 TaskManager 资源。

### 10.1 环境准备

- 在Flink1.8.0之前的版本，想要以YARN模式部署Flink任务时，需要Flink是有Hadoop支持的。从Flink1.8版本开始，不再提供基于Hadoop编译的安装包，若需要Hadoop的环境支持，需要自行在官网下载Hadoop相关版本的组件flink-shaded-hadoop-2-uber-2.7.5-10.0.jar，并将该组件上传至Flink的lib目录下。
- 在Flink1.11.0版本之后，增加了很多重要新特性，其中就包括增加了对Hadoop3.0.0以及更高版本Hadoop的支持，不再提供“flink-shaded-hadoop-*”jar包，而是通过配置环境变量完成与YARN集群的对接。
- 在将Flink任务部署至YARN集群之前，需要确认集群是否安装有Hadoop，保证Hadoop版本至少在2.2以上，并且集群中安装有HDFS服务。

1>添加环境变量 (三个节点都需要)

```sh
$ cat /etc/profile.d/my_env.sh
#JAVA_HOME
export JAVA_HOME=/opt/module/jdk1.8.0_212
export PATH=$PATH:$JAVA_HOME/bin
#HADOOP_HOME
export HADOOP_HOME=/opt/module/hadoop-3.1.3
export PATH=$PATH:$HADOOP_HOME/bin
export PATH=$PATH:$HADOOP_HOME/sbin
#HADOOP_CLASSPATH
export HADOOP_CONF_DIR=${HADOOP_HOME}/etc/hadoop
export HADOOP_CLASSPATH=hadoop classpath
$ source /etc/profile.d/my_env.sh
```

2>启动hadoop集群

### 10.2 会话模式部署

YARN的会话模式与独立集群略有不同，需要首先申请一个YARN会话（YARN session）来启动 Flink 集群。

具体步骤如下：

**1、** 启动集群；

1、启动 hadoop 集群(HDFS, YARN)。

2、执行脚本命令向 YARN 集群申请资源，开启一个 YARN 会话，启动 Flink 集群。

```sh
$ bash /opt/module/flink-1.13.0/bin/yarn-session.sh test
```

可用参数解读：

- -d：分离模式，如果你不想让 Flink YARN 客户端一直前台运行，可以使用这个参数（即使关掉当前对话窗口，YARN session 也可以后台运行。）
- -jm(--jobManagerMemory)：配置 JobManager 所需内存，默认单位 MB。
- -nm(--name)：配置在 YARN UI 界面上显示的任务名。
- -qu(--queue)：指定 YARN 队列名。
- -tm(--taskManager)：配置每个 TaskManager 所使用内存。

**注意：** Flink1.11.0 版本不再使用-n 参数和-s 参数分别指定 TaskManager 数量和 slot 数量， YARN 会按照需求动态分配 TaskManager 和 slot。所以从这个意义上讲，YARN 的会话模式也不会把集群资源固定，同样是动态分配的。 YARN Session 启动之后会给出一个webUI 地址以及一个YARN application ID，如下所示， 用户可以通过 web UI 或者命令行两种方式提交作业。

```java
2022-05-03 23:09:14,172 INFO  org.apache.flink.yarn.YarnClusterDescriptor                  [] - Deploying cluster, current state                             ACCEPTED
2022-05-03 23:09:24,035 INFO  org.apache.flink.yarn.YarnClusterDescriptor                  [] - YARN application has been deployed successfully.
2022-05-03 23:09:24,036 INFO  org.apache.flink.yarn.YarnClusterDescriptor                  [] - Found Web Interface hadoop103:42319 of application 'application_1651632780291_0001'.
JobManager Web Interface: http://hadoop103:42319
```

**2、** 提交作业；

```sh
$ /opt/module/flink-1.13.0/bin/flink run -c com.kunan.wc.StreamWordCount /opt/myjars/MyFlink-1.0-SNAPSHOT.jar
```

再提交一个,设置并行度为2

```sh
$ /opt/module/flink-1.13.0/bin/flink run -c com.kunan.wc.StreamWordCount -p 2 /opt/myjars/MyFlink-1.0-SNAPSHOT.jar
```

可以访问web页面查看

**3、** 关掉YARNsession；

```sh
$ yarn application -kill application_1651632780291_0002
```

### 10.3 单作业模式部署

在YARN 环境中，由于有了外部平台做资源调度，所以我们也可以直接向 YARN 提交一 个单独的作业，从而启动一个 Flink 集群。

1、执行命令提交作业。

```sh
$ /opt/module/flink-1.13.0/bin/flink run -d -t yarn-per-job -c com.kunan.wc.StreamWordCount /opt/myjars/MyFlink-1.0-SNAPSHOT.jar
```

早期版本也有另一种写法：

```sh
$ bin/flink run -m yarn-cluster -c com.kunan.wc.StreamWordCount /opt/myjars/MyFlink-1.0-SNAPSHOT.jar
```

**注意这里是通过参数-m yarn-cluster 指定向 YARN 集群提交任务**

(2)可在web页面查看任务

(3)可以使用命令行查看或取消作业，命令如下。

```java
# 查看作业
$ /opt/module/flink-1.13.0/bin/flink list -t yarn-per-job -Dyarn.application.id=application_1651632780291_0003
SLF4J: Class path contains multiple SLF4J bindings.
SLF4J: Found binding in [jar:file:/opt/module/flink-1.13.0/lib/log4j-slf4j-impl-2.12.1.jar!/org/slf4j/impl/StaticLoggerBinder.class]
SLF4J: Found binding in [jar:file:/opt/module/hadoop-3.1.3/share/hadoop/common/lib/slf4j-log4j12-1.7.25.jar!/org/slf4j/impl/StaticLoggerBinder.class]
SLF4J: Found binding in [jar:file:/opt/module/tez/lib/slf4j-log4j12-1.7.10.jar!/org/slf4j/impl/StaticLoggerBinder.class]
SLF4J: See http://www.slf4j.org/codes.html#multiple_bindings for an explanation.
SLF4J: Actual binding is of type [org.apache.logging.slf4j.Log4jLoggerFactory]
2022-05-03 23:56:09,332 INFO  org.apache.flink.yarn.cli.FlinkYarnSessionCli                [] - Found Yarn properties file under /tmp/.yarn-properties-yangkunan.
2022-05-03 23:56:09,332 INFO  org.apache.flink.yarn.cli.FlinkYarnSessionCli                [] - Found Yarn properties file under /tmp/.yarn-properties-yangkunan.
2022-05-03 23:56:09,460 WARN  org.apache.flink.yarn.configuration.YarnLogConfigUtil        [] - The configuration directory ('/opt/module/flink-1.13.0/conf') already contains a LOG4J config file.If you want to use logback, then please delete or rename the log configuration file.
2022-05-03 23:56:09,522 INFO  org.apache.hadoop.yarn.client.RMProxy                        [] - Connecting to ResourceManager at hadoop103/192.168.38.103:8032
2022-05-03 23:56:09,705 INFO  org.apache.flink.yarn.YarnClusterDescriptor                  [] - No path for the flink jar passed. Using the location of class org.apache.flink.yarn.YarnClusterDescriptor to locate the jar
2022-05-03 23:56:09,776 INFO  org.apache.flink.yarn.YarnClusterDescriptor                  [] - Found Web Interface hadoop103:43929 of application 'application_1651632780291_0003'.
Waiting for response...
------------------ Running/Restarting Jobs -------------------
03.05.2022 23:48:28 : 91d7184eefa904b94c7dbf0679eea266 : Flink Streaming Job (RUNNING)
--------------------------------------------------------------
No scheduled jobs.
# 取消作业
$ /opt/module/flink-1.13.0/bin/flink cancel -t yarn-per-job -Dyarn.application.id=application_1651632780291_0003 91d7184eefa904b94c7dbf0679eea266
```

### 10.4 应用模式部署[未测试]

应用模式同样非常简单，与单作业模式类似，直接执行 flink run-application 命令即可。

1、执行命令提交作业。

```sh
$ bin/flink run-application -t yarn-application -c com.atguigu.wc.StreamWordCount
FlinkTutorial-1.0-SNAPSHOT.jar
```

2、在命令行中查看或取消作业。

```sh
$ ./bin/flink list -t yarn-application -Dyarn.application.id=application_XXXX_YY
$ ./bin/flink cancel -t yarn-application
-Dyarn.application.id=application_XXXX_YY <jobId>
```

3、也可以通过 yarn.provided.lib.dirs 配置选项指定位置，将 jar 上传到远程。

```sh
$ ./bin/flink run-application -t yarn-application
-Dyarn.provided.lib.dirs="hdfs://myhdfs/my-remote-flink-dist-dir" hdfs://myhdfs/jars/my-application.jar
```

这种方式下 jar 可以预先上传到 HDFS，而不需要单独发送到集群，这就使得作业提交更加轻量了。
