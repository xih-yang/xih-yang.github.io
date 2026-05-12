# 01、RocketMQ 源码 - RocketMQ源码调试环境准备
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/2/1.html
- 分类：消息队列
- 分组：教程目录
> 详细介绍了RocketMQ 4.9.3 分支的源码调试环境搭建等一系列准备工作。

RocketMQ的源码这么多，我们肯定不会全部看完的，我们的源码分析主要会涉及到namesrv、broker、client、remoting、store等模块，也就是生产者、消费者、nameServr、Broker这几个角色的核心功能点。

**在看RocketMQ源码之前，一定一定一定要先学会如何使用RocketMQ，建议通看官方文档：**

Quick Start

[https://rocketmq.apache.org/docs/quickStart/01quickstart](https://rocketmq.apache.org/docs/quickStart/01quickstart)

Apache RocketMQ开发者指南

[https://github.com/apache/rocketmq/tree/master/docs/cn](https://github.com/apache/rocketmq/tree/master/docs/cn)

**首先我们尝试搭建RocketMQ的源码调试环境，这里不考虑任何集群环境，全部都是单机启动，首先是namesrv，然后是broker，最后启动生产者和消费者测试。**

**本源码基于RocketMQ 4.9.3版本。**

## 1 下载源码包

进入rocketmq官网https://github.com/apache/rocketmq，先fork源码到自己的仓库，然后，下载自己的仓库中fork的源码clone下来，这样就可以把自己写的源码注释上传到github了。

idea打开源码，会下载依赖，**切换到4.9.3分支**：

到此源码就下载下来了，看下结构：

可以看到很多的子module，简单介绍下：

**01、** acl：用户权限、安全、验证相关模块；

**02、** broker：RocketMQ的Broker的实现代码，实现消息存储、投递、查询等功能，重点；

**03、** client：RocketMQ的Producer、Consumer、管理后台等客户端的实现代码，实现生产消息、消费消息、后台监控等，重点；

**04、** common：公共的类和方法的模块；

**05、** dev：开发相关的一些信息；

**06、** distribution：部署RocketMQ的一些脚本和配置文件，比如bin，conf目录；

**07、** example：简单使用RocketMQ的案例；

**08、** filter：RocketMQ的消息过滤器；

**09、** logging：RocketMQ的日志模块；

**10、** namesvr：RocketMQ的NameServer的实现代码，实现注册中心和名字服务，重点；

**11、** openmessaging：开放消息标准模块；

**12、** remoting：RocketMQ的远程网络通信模块，基于netty实现，重点；

**13、** srvutil：namesrc模块的相关工具类；

**14、** store：Broker的消息存储的模块，重点；

**15、** style：代码检查相关的；

**16、** test：测试相关模块；

**17、** tools：命令行监控工具相关工具类；

## 2 配置目录

我们首先配置**ROCKETMQ_HOME**的目录地址，这个目录就是专门用于存放配置文件的地方。我们直接在rocketmq的项目主目录下面新建一个**config**目录，作为ROCKETMQ_HOME的目录地址：

然后在config下面创建三个目录conf、logs、store，config用于存放配置文件，logd用于存放日志文件，store则用于消息存储。

然后我们将**distribution**模块下面的**broker.conf、logback_namesrv.xml、logback_broker.xml**这三个配置文件拷贝到此前创建的conf目录下：

拷贝到conf目录下：

然后我们修改broker.conf文件，添加如下配置：

```java
brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 0
#删除文件的时间点，一天的固定时间执行一次删除过期文件操作，默认为凌晨4点。
deleteWhen = 04
#文件保留时间，也就是从最后一次更新时间到现在，如果超过了该时间，则认为是过期文件，可以被删除，单位小时
fileReservedTime = 48
#broker的角色，默认是异步master，即生产者发送的每一条消息只要写入master就返回告诉生产者成功。然后再“异步复制”到slave。
#同步master：Sync Broker：生产者发送的每一条消息都至少同步复制到一个slave后才返回告诉生产者成功，即“同步双写”。
brokerRole = ASYNC_MASTER
#消息刷盘策略，默认是异步刷盘。
#异步刷盘ASYNC_FLUSH：生产者发送的每一条消息并不是立即保存到磁盘，而是暂时缓存起来，然后就返回生产者成功。随后再异步的将缓存数据保存到磁盘，有两种情况：
#1是定期将缓存中更新的数据进行刷盘，2是当缓存中更新的数据条数达到某一设定值后进行自动刷盘。异步刷盘有较低概率导致消息丢失，比如在还未来得及同步到磁盘的时候宕机，但是性能更好。
#同步刷盘SYNC_FLUSH：生产者发送的每一条消息都在保存到磁盘成功后才返回告诉生产者成功。这种方式不会存在消息丢失的问题，但是有很大的磁盘IO开销，性能有一定影响。
flushDiskType = ASYNC_FLUSH
#nameserver的地址，也可以指定真实ip
namesrvAddr=127.0.0.1:9876
#brokerIp，也可以指定真实ip
brokerIP1=127.0.0.1
#消息存储根路径
storePathRootDir=/Volumes/Samsung/Idea/rocketmq/config/store
#commitLog文件的存储路径
storePathCommitLog=/Volumes/Samsung/Idea/rocketmq/config/store/commitlog
#consume queue文件的存储路径
storePathConsumeQueue=/Volumes/Samsung/Idea/rocketmq/config/store/consumequeue
#消息索引文件的存储路径
storePathIndex=/Volumes/Samsung/Idea/rocketmq/config/store/index
#checkpoint文件的存储路径
storeCheckpoint=/Volumes/Samsung/Idea/rocketmq/config/store/checkpoint
#abort文件的存储路径
abortFile=/Volumes/Samsung/Idea/rocketmq/config/store/abort
```

注意上面的配置中的前缀路径填写自己创建的**ROCKETMQ_HOME**的目录，我的就**是/Volumes/Samsung/Idea/rocketmq/config**，我是mac系统，文件路径和windows的有些区别。

然后我们来修改日志文件的配置：

**1、** 首先将**logback_namesrv.xml和logback_broker.xml**配置文件中的**所有${user.home}都替换为自己的ROCKETMQ_HOME**的目录，**比如${user.home}/logs/rocketmqlogs/namesrv_default.log**，我会**替换为/Volumes/Samsung/Idea/rocketmq/config/logs/rocketmqlogs/namesrv_default.log**；

**2、** 然后将**所有的${brokerLogDir}都替换为broker**，这一级路径下主要存放broker的日志；

例如，替换前：

替换后：

## 3 启动namesrv

nameserver是rocketmq的注册中心，提供名字服务，因此需要最先启动。找到namesrv模块的NamesrvStartup类，尝试直接运行main方法：

当然是无法启动的，控制台打印需要设置**ROCKETMQ_HOME**环境变量的提示信息：

```java
Please set the ROCKETMQ_HOME variable in your environment to match the location of the RocketMQ installation
```

这个ROCKETMQ_HOME变量是rocketmq的配置文件目录，实际上就是指的**distribution模块里面的conf文件夹**所在的目录，而我们**之前已经单独配置了ROCKETMQ_HOME目录，所以此时我们配置那一个路径即可**。

我们在idea中配置**ROCKETMQ_HOME=/Volumes/Samsung/Idea/rocketmq/config**的环境变量即可。

再次运行，可以在控制台看到启动的日志输出：

```java
The Name Server boot success. serializeType=JSON
```

此时namesrv启动成功！同时在我们配置的logs目录下可以看到详细的启动日志。

## 4 启动broker

**namesrv启动完毕后，下面我们启动rocketmq的broker服务。**

broker通过broker模块里面的BrokerStartup类启动，同样，我们需要配置启动环境变量**ROCKETMQ_HOME=/Volumes/Samsung/Idea/rocketmq/config**。

同时，相比于namesrv的启动，多了一个启动参数的配置：**-c /Volumes/Samsung/Idea/rocketmq/config/conf/broker.conf**，后面的路径是我们配置的**broker.conf**配置文件的地址。

启动broker，可以看到启动成功的日志：

```java
The broker[broker-a, 127.0.0.1:10911] boot success. serializeType=JSON and name server is 127.0.0.1:9876
```

注意有时候broker并没有连上nameserver，但是控制台没有报错，因此需要在我们配置的logs目录下查看详细的启动日志来确定是否真的成功了。

查看broker.log日志：

## 5 启动管理后台

管理后台项目不在主项目中，需要单独的下载，此前的Console项目已被重新命名为dashboard：[https://github.com/apache/rocketmq-dashboard](https://github.com/apache/rocketmq-dashboard)。

通过git clone下载下来后使用idea打开，可以看出来是一个spring boot项目：

修改application.yml配置文件中的namesrvAddrs配置，改为本地namesrv地址：

启动项目，在浏览器输入localhost:8080，即可看到管理后台界面：

## 6 快速案例

**rocketmq的源码中就已经提供了非常多的案例，在example模块中可以找到！**

我们找到下面的**quickstart**包，里面有两个简单的测试类：

打开**Producer**类，可以看到里面是一个循环发送1000条消息的代码，非常简单，我们**添加一行代码producer.setNamesrvAddr(“127.0.0.1:9876”);指定namesrv的地址**：

运行生产者，可以看到控制台成功输出日志：

下面启动消费者，同样增加一行代码设置namesrv地址：

启动之后可以看到成功的消费了数据：

进入**localhost:8080**控制台，可以看到各种统计信息：

**到此，我们的案例运行完毕，这证明我们的最小化rocketmq源码搭建并运行成功，此时，万事俱备只欠东风，后面我们将会开始真正的进入源码分析，期待着一起学习吧！**
