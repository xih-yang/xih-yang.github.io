# 1、Sentinel 教程进阶 Sentinel-API
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/21.html
- 分类：服务保障
- 分组：Sentinel 教程进阶
这也不是一篇非常详细的源码领读，源码细节还需你自己仔细咀嚼

这只是我在改了些sentinel bug后，梳理的脉络，主要是脉络。看完后对Sentinel的源码模块划分和大致交互有个整体印象。

从而在想知道细节时知道从哪里下手。

Sentinel功能强大，但是开源出来的sentinel可以说是一个半成品，bug多，并且很多功能没有实现，可能是因为它有收费的版本吧。因此我们如果想在生产上应用就要戒骄戒躁，了解它的源码，对它进行优化改造。在改造过程中不可避免的要调用sentinel的api接口进行一些规则的同步等操作。

## 监听端口

服务集成sentinel的方式

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

启动服务后，一旦访问了接口，sentinel会通过websocket或netty的方式监听8719（默认）端口，提供一些接口方便我们以http的方式调用取获取、修改sentinel的限流规则，集群配置等。

监听的端口默认是8719，但是如果端口被占用，就会换自动换端口，具体换端口逻辑是8719+重试次数/3，这个没什么意思，不比深究。

## 代码实现

具体启动端口监听的逻辑在com.alibaba.csp.sentinel.transport.init.CommandCenterInitFunc中，该类在sentinel-transport-common模块中，具体依赖如下

```java
@InitOrder(-1)
public class CommandCenterInitFunc implements InitFunc {
    @Override
    public void init() throws Exception {
        //commandCenter默认是SimpleHttpCommandCenter
        CommandCenter commandCenter = CommandCenterProvider.getCommandCenter();
        if (commandCenter == null) {
            RecordLog.warn("[CommandCenterInitFunc] Cannot resolve CommandCenter");
            return;
        }
        commandCenter.beforeStart();
        //启动监听
        commandCenter.start();
        RecordLog.info("[CommandCenterInit] Starting command center: "
                + commandCenter.getClass().getCanonicalName());
    }
}
```

上述代码中commandCenter默认是SimpleHttpCommandCenter，如果引入sentinel-transport-netty-http，则它就会变成NettyHttpCommandCenter，具体原因是sentinel为spi类定义了一个order属性，NettyHttpCommandCenter的order属性更高

具体模块之间的关系如下如

端口可通过参数：csp.sentinel.api.port指定。

具体启动逻辑可以自己跟一下，比较简单。

## api接口

具体有哪些接口呢?

com.alibaba.csp.sentinel.command.CommandHandler接口的所有实现类

我们可以通过调用localhost:port/api获取到所有的api

这些handler基本上分布在三个模块中

- sentinel-transport-common：提供一些规则相关的，基本的接口
- sentinel-cluster-client-default：集群客户端相关接口
- sentinel-cluster-server-default：集群服务端相关接口

## sentinel-transport-common

ApiCommandHandler
/api
获取所有接口

FetchClusterModeCommandHandler
/getClusterMode
获取集群模式信息

ModifyClusterModeCommandHandler
/setClusterMode
修改集群模式

BasicInfoCommandHandler
/basicInfo
获取服务基本信息

FetchActiveRuleCommandHandler
/getRules
获取规则，参数type flow|degrade|authority|system

FetchClusterNodeByIdCommandHandler
/clusterNodeById
根据id查询clustNode信息

FetchClusterNodeHumanCommandHandler
/cnode
get clusterNode metrics by id, request param: id=

FetchJsonTreeCommandHandler
/jsonTree
簇点链路

FetchOriginCommandHandler
/origin
get origin clusterNode by id, request param: id=

FetchSimpleClusterNodeCommandHandler
/clusterNode
get all clusterNode VO, use type=notZero to ignore those nodes with totalRequest <=0

FetchSystemStatusCommandHandler
/systemStatus
get system status

FetchTreeCommandHandler
/tree
get metrics in tree mode, use id to specify detailed tree root 统计信息

ModifyRulesCommandHandler
/setRules
更新规则

OnOffGetCommandHandler
/getSwitch
get sentinel switch status

OnOffSetCommandHandler
/setSwitch
set sentinel switch, accept param: value=

SendMetricCommandHandler
/metric
get and aggregate metrics, accept param:startTime={startTime}&endTime={endTime}&maxLines={maxLines}&identify=

VersionCommandHandler
/version
sentinel版本
1.8.1

## sentinel-cluster-client-default

FetchClusterClientConfigHandler
/cluster/client/fetchConfig
获取集群-客户端配置

ModifyClusterClientConfigHandler
/cluster/client/modifyConfig
修改集群-客户端配置

## sentinel-cluster-server-default

FetchClusterFlowRulesCommandHandler
/cluster/server/flowRules
获取集群限流规则

FetchClusterParamFlowRulesCommandHandler
/cluster/server/paramRules
获取集群热点参数规则

FetchClusterServerConfigHandler
/cluster/server/fetchConfig
获取集群server配置

FetchClusterServerInfoCommandHandler
/cluster/server/info
获取集群server信息

FetchClusterMetricCommandHandler
/cluster/server/metricList
获取集群统计信息

ModifyClusterFlowRulesCommandHandler
/cluster/server/modifyFlowRules
修改集群限流规则

ModifyClusterParamFlowRulesCommandHandler
/cluster/server/modifyParamRules
修改集群热点参数规则

ModifyClusterServerFlowConfigHandler
/cluster/server/modifyFlowConfig
待查看

ModifyClusterServerTransportConfigHandler
/cluster/server/modifyTransportConfig
修改集群server配置

ModifyServerNamespaceSetHandler
/cluster/server/modifyNamespaceSet
修改namespace信息

```java
public class SimpleHttpCommandCenter implements CommandCenter {
public void run() {
    boolean success = false;
    ServerSocket serverSocket = SimpleHttpCommandCenter.getServerSocketFromBasePort(this.port);
    if (serverSocket != null) {
        CommandCenterLog.info("[CommandCenter] Begin listening at port " + serverSocket.getLocalPort(), new Object[0]);
        SimpleHttpCommandCenter.this.socketReference = serverSocket;
        SimpleHttpCommandCenter.this.executor.submit(SimpleHttpCommandCenter.this.new ServerThread(serverSocket));
        success = true;
        this.port = serverSocket.getLocalPort();
    } else {
        CommandCenterLog.info("[CommandCenter] chooses port fail, http command center will not work", new Object[0]);
    }
    if (!success) {
        this.port = -1;
    }
    TransportConfig.setRuntimePort(this.port);
    SimpleHttpCommandCenter.this.executor.shutdown();
}
}
```

项目集成sentinel启动后，api服务并不会启动，而是等到项目被访问的时候才会被启动，具体的方式是启动一个netty服务监听8719端口（默认）

```bash
SphU.entry("testRule1", EntryType.IN, 1, id);
```
