# 01、RocketMQ 源码解析 - 调试环境搭建
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/1.html
- 分类：消息队列
- 分组：教程目录
## 版本

**1、** 基于`rocketmq-all-4.3.1`版本；

**2、** 规定`$ROCKETMQ_SOURCE`为源码根目录；

## 源码调试环境搭建

**克隆代码到本地，使用idea打开，源码目录结构**

`broker`：整个mq的核心，他能够接受producer和consumer的请求，并调用store层服务对消息进行处理。HA服务的基本单元，支持同步双写，异步双写等模式。

`client`：：RocketMQ客户端实现

`common`：一些模块间通用的功能类，比如一些配置文件、常量。

`distribution`:发布脚本以及相关的配置文件

`example`：官方提供的例子

`filter`，过滤器，用于服务端 SQL92 的过滤方式

`logappender`:日志相关

`namesrv`:可以理解成注册中心，每个 broker 都会在这里注册，client 也会从这里获取 broker 的相关信息

`remoting`：基于netty的底层通信实现，所有服务间的交互都基于此模块。

`srvutil`：解析命令行的工具类。

`store`：存储层实现(负责消息的存储和读取)，同时包括了索引服务，高可用HA服务实现。

`tools`：mq集群管理工具，提供了消息查询等功能。

### 启动NameServer

**1、** 查看`$ROCKETMQ_SOURCE/distribution/bin/mqnamesrv.sh`脚本可以看到如下命令，可以看出是委托`${ROCKETMQ_HOME}/bin/runserver.sh`这个脚本来启动`org.apache.rocketmq.namesrv.NamesrvStartup`这类的因为我们不是二进制安装包启动，所以如果我们要找到这个脚本，这里的`${ROCKETMQ_HOME}`必须设置为源码目录的`$ROCKETMQ_SOURCE/distribution`才可以；

```java
...省略...
export ROCKETMQ_HOME
sh ${ROCKETMQ_HOME}/bin/runserver.sh org.apache.rocketmq.namesrv.NamesrvStartup $@
```

**2、** 查看`$ROCKETMQ_SOURCE/distribution/runserver.sh`文件，这个脚本主要是JVM的配置；

```java
... 省略 ...
JAVA_OPT="${JAVA_OPT} -server -Xms4g -Xmx4g -Xmn2g -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=320m"
... 省略 ...
```

**3、** idea配置`NamesrvStartup`类启动参数,`NamesrvConfig`需要通过`$ROCKETMQ_HOME`来读取conf目录的配置，所以这里的`$ROCKETMQ_HOME`设置为`$ROCKET_SOURCE/distribution`；

### 本地启动Broker调试

**1、** 查看`$ROCKETMQ_SOURCE/distribution/bin/mqbroker.sh`可以看到如下命令，`${ROCKETMQ_HOME}/bin/runbroker.sh`这个脚本来启动`org.apache.rocketmq.broker.BrokerStartup`，与NameServer启动流程类似；

```java
... 省略... 
export ROCKETMQ_HOME
sh ${ROCKETMQ_HOME}/bin/runbroker.sh org.apache.rocketmq.broker.BrokerStartup $@
```

**2、** 查看`$ROCKETMQ_SOURCE/distribution/runbroker.sh`，此脚本主要也是JVM配置；

```java
... 省略... 
JAVA_OPT="${JAVA_OPT} -server -Xms8g -Xmx8g -Xmn4g"
... 省略... 
```

**3、** idea配置`BrokerStartup`启动参数在`Programarguments`中指定broker的配置文件`-cxxxx/distribution/conf/broker.conf`（在图中没有标注出来）；

## 远程调试

**1、** 这里以nameserver为例子在`runserver.sh`脚本中开启注释；

```java
JAVA_OPT="${JAVA_OPT} -Xdebug -Xrunjdwp:transport=dt_socket,address=9555,server=y,suspend=n"
```

**2、** 在idea中添加远程调试配置；

**3、** 打断点，然后启动debug模式，控制台显示如下表示成功；
