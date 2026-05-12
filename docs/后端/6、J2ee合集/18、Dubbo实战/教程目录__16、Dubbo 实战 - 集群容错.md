# 16、Dubbo 实战 - 集群容错
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/16.html
- 分类：J2EE框架
- 分组：教程目录
Dubbo作为一个分布式的服务治理框架，提供了集群部署，路由，软负载均衡及容错机制。下图描述了Dubbo调用过程中的对于集群，负载等的调用关系：

### 集群 Cluster

将Directory中的多个Invoker伪装成一个Invoker，对上层透明，包含集群的容错机制。

Cluster接口定义：

```java
/**
 * Cluster. (SPI, Singleton, ThreadSafe)
 * <p>
 * <a href="http://en.wikipedia.org/wiki/Computer_cluster">Cluster</a>
 * <a href="http://en.wikipedia.org/wiki/Fault-tolerant_system">Fault-Tolerant</a>
 *
 */
@SPI(FailoverCluster.NAME)
public interface Cluster {
    /**
     * Merge the directory invokers to a virtual invoker.
     *
     * @param <T>
     * @param directory
     * @return cluster invoker
     * @throws RpcException
     */
    @Adaptive
    <T> Invoker<T> join(Directory<T> directory) throws RpcException;
}
```

Cluster可以看做是工厂类， 将目录directory下的invoker合并成一个统一的Invoker，根据不同集群策略的Cluster创建不同的Invoker。

我们来看下默认的失败转移，当出现失败重试其他服务的策略，这个Cluster实现很简单，就是创建FailoverCluseterInvoker对象：

```java
/**
 * {@link FailoverClusterInvoker}
 *
 */
public class FailoverCluster implements Cluster {
    public final static String NAME = "failover";
    public <T> Invoker<T> join(Directory<T> directory) throws RpcException {
        return new FailoverClusterInvoker<T>(directory);
    }
}
```

下图展示了Dubbo提供的所有集群方案：

AvailableCluster
获取可用的调用。遍历所有Invokers判断Invoker.isAvalible，只要有一个为true直接调用返回，不管成不成功

BroadcastCluster
广播调用。遍历所有Invokers，逐个调用，每个调用catch住异常不影响其他invoker调用

FailbackCluster
失败自动恢复。对于invoker调用失败，后台记录失败请求，任务定时重发, 通常用于通知

FailfastCluster
快速失败。只发起一次调用，失败立即报错，通常用于非幂等性操作

FailoverCluster

失败转移。当出现失败，重试其它服务器，通常用于读操作，但重试会带来更长延迟

1. 目录服务directory.list(invocation) 列出方法的所有可调用服务并获取重试次数，默认重试两次；
2. 根据LoadBalance负载策略选择一个Invoker；
3. 执行invoker.invoke(invocation)调用；
4. 调用成功返回，调用失败且小于重试次数，重新从3步骤开始执行，调用次数大于等于重试次数则抛出调用失败异常；

FailsafeCluster
失败安全。出现异常时，直接忽略，通常用于写入审计日志等操作

ForkingCluster
并行调用。只要一个成功即返回，通常用于实时性要求较高的操作，但需要浪费更多服务资源

MergeableCluster
分组聚合。按组合并返回结果，比如菜单服务，接口一样，但有多种实现，用group区分，现在消费方需从每种group中调用一次返回结果，合并结果返回，这样就可以实现聚合菜单项

MockClusterWrapper

具备调用mock功能。在包装时获取url的MOCK_KEY属性

1. 不存在则直接调用其他cluster；
2. 存在且值startsWith("force") 强制mock调用；
3. 存在但值不是startsWith("force") 先正常调用， 出现异常再mock调用

上面9种集群方案除了MergeableCluster比较复杂之外，其他都比较简单直观，接下来分析一下MergeableCluster是如何实现的：

**1、** 根据MERGE_KEY从URL获取参数值；

**2、** 为空则不需要merge，正常调用；

**3、** 按group分组调用，将返回接口保存到集合中；

**4、** 获取MERGE_KEY，如果是默认的话，获取默认merge策略，主要根据返回类型判断；

**5、** 如果不是，获取自定义的merge策略；

**6、** Merge策略合并调用结果返回；

集群模式的配置：

```java
<dubbo:service cluster="failsafe" />    服务提供方 
<dubbo:reference cluster="failsafe" />  服务消费方
```

### 目录服务 Directory

集群目录服务Directory，代表多个Invoker, 可以看成List,它的值可能是动态变化的，比如注册中心推送变更。集群选择调用服务时通过目录服务找到所有服务。

Directory的接口定义：

```java
/**
 * Directory. (SPI, Prototype, ThreadSafe)
 * <p>
 * <a href="http://en.wikipedia.org/wiki/Directory_service">Directory Service</a>
 *
 * @see com.alibaba.dubbo.rpc.cluster.Cluster#join(Directory)
 */
public interface Directory<T> extends Node {
    /**
     * get service type.
     *
     * @return service type.
     */
    Class<T> getInterface();
    /**
     * list invokers.
     *
     * @return invokers
     */
    List<Invoker<T>> list(Invocation invocation) throws RpcException;
}
```

Directory有两个具体实现：

StaticDirectory：静态目录服务，它的所有Invoker通过构造函数传入， 服务消费方引用服务的时候， 服务对多注册中心的引用，将Invokers集合直接传入 StaticDirectory构造器，再由Cluster伪装成一个Invoker。

```java
for (URL url : urls) {
    invokers.add(refprotocol.refer(interfaceClass, url));
    if (Constants.REGISTRY_PROTOCOL.equals(url.getProtocol())) {
        registryURL = url; // use last registry url
    }
}
if (registryURL != null) { // registry url is available
    // use AvailableCluster only when register's cluster is available
    URL u = registryURL.addParameter(Constants.CLUSTER_KEY, AvailableCluster.NAME);
    invoker = cluster.join(new StaticDirectory(u, invokers));
} else { // not a registry url
    invoker = cluster.join(new StaticDirectory(invokers));
}
```

StaticDirectory的list方法直接返回所有invoker集合。

RegistryDirectory：注册目录服务，它的Invoker集合是从注册中心获取的，它实现了NotifyListener接口实现了回调接口notify(List)。

比如消费方要调用某远程服务，会向注册中心订阅这个服务的所有服务提供方，服务提供方数据有变动时回调消费方的NotifyListener服务的notify方法。NotifyListener.notify(List) 回调接口传入所有服务的提供方的url地址然后将urls转化为invokers, 也就是refer应用远程服务。

```java
keys.add(key);
// Cache key is url that does not merge with consumer side parameters, regardless of how the consumer combines parameters, if the server url changes, then refer again
Map<String, Invoker<T>> localUrlInvokerMap = this.urlInvokerMap; // local reference
Invoker<T> invoker = localUrlInvokerMap == null ? null : localUrlInvokerMap.get(key);
if (invoker == null) { // Not in the cache, refer again
    try {
        boolean enabled = true;
        if (url.hasParameter(Constants.DISABLED_KEY)) {
            enabled = !url.getParameter(Constants.DISABLED_KEY, false);
        } else {
            enabled = url.getParameter(Constants.ENABLED_KEY, true);
        }
        if (enabled) { // 这里
            invoker = new InvokerDelegate<T>(protocol.refer(serviceType, url), url, providerUrl);
        }
    } catch (Throwable t) {
        logger.error("Failed to refer invoker for interface:" + serviceType + ",url:(" + url + ")" + t.getMessage(), t);
    }
    if (invoker != null) { // Put new invoker in cache
        newUrlInvokerMap.put(key, invoker);
    }
} else {
    newUrlInvokerMap.put(key, invoker);
}
```

到此时RegistryDirectory中有对这个远程服务调用的所有invokers。RegistryDirectory.list(invocation)就是根据服务调用方法获取所有的远程服务引用的invoker执行对象。

### 路由服务 Router

Router服务路由，根据路由规则从多个Invoker中选出一个子集。AbstractDirectory是所有目录服务实现的上层抽象，它在list出所有invokers后，会通过Router服务进行路由过滤。

Router接口定义：

```java
/**
 * Router. (SPI, Prototype, ThreadSafe)
 * <p>
 * <a href="http://en.wikipedia.org/wiki/Routing">Routing</a>
 *
 * @see com.alibaba.dubbo.rpc.cluster.Cluster#join(Directory)
 * @see com.alibaba.dubbo.rpc.cluster.Directory#list(Invocation)
 */
public interface Router extends Comparable<Router> {
    /**
     * get the router url.
     *
     * @return url
     */
    URL getUrl();
    /**
     * route.
     *
     * @param invokers
     * @param url        refer url
     * @param invocation
     * @return routed invokers
     * @throws RpcException
     */
    <T> List<Invoker<T>> route(List<Invoker<T>> invokers, URL url, Invocation invocation) throws RpcException;
}
```

这里如果要了解具体的路由规则，需要查看阿里的原始文档，在该文档的[路由规则](https://dubbo.incubator.apache.org/#!/docs/user/demos/routing-rule.md?lang=zh-cn)部分有详细介绍。

我们来分析下，路由规则在哪里用到

在RegistryDirectory类中：

```java
private List<Invoker<T>> route(List<Invoker<T>> invokers, String method) {
    Invocation invocation = new RpcInvocation(method, new Class<?>[0], new Object[0]);
    List<Router> routers = getRouters();
    if (routers != null) {
        for (Router router : routers) {
            if (router.getUrl() != null) {
                invokers = router.route(invokers, getConsumerUrl(), invocation);
            }
        }
    }
    return invokers;
}
```

而route函数又是在如下位置被用到： toMethodInvokers(Map invokersMap) ，最终调用是在refreshInvoker函数，而refreshInvoker又是在notify函数中调用的。

### 负载均衡 LoadBalance

LoadBalance负载均衡， 负责从多个 Invokers中选出具体的一个Invoker用于本次调用，调用过程中包含了负载均衡的算法，调用失败后需要重新选择。

LoadBalance接口定义：

```java
/**
 * LoadBalance. (SPI, Singleton, ThreadSafe)
 * <p>
 * <a href="http://en.wikipedia.org/wiki/Load_balancing_(computing)">Load-Balancing</a>
 *
 * @see com.alibaba.dubbo.rpc.cluster.Cluster#join(Directory)
 */
@SPI(RandomLoadBalance.NAME)
public interface LoadBalance {
    /**
     * select one invoker in list.
     *
     * @param invokers   invokers.
     * @param url        refer url
     * @param invocation invocation.
     * @return selected invoker.
     */
    @Adaptive("loadbalance")
    <T> Invoker<T> select(List<Invoker<T>> invokers, URL url, Invocation invocation) throws RpcException;
}
```

类注解@SPI说明可以基于Dubbo的扩展机制进行自定义的负责均衡算法实现，默认是随机算法。方法注解@Adaptive说明能够生成适配方法。

select方法设配类通过url的参数选择具体的算法，再从invokers集合中根据具体的算法选择一个invoker。

接下来介绍以上4种负载策略。

**RandomLoadBalance**

RandomLoadBalance：随机访问策略，按权重设置随机概率，是默认策略：

**1、** 获取所有invokers的个数；

**2、** 遍历所有Invokers,获取计算每个invokers的权重，并把权重累计加起来每相邻的两个invoker比较他们的权重是否一样，有一个不一样说明权重不均等；

**3、** 总权重大于零且权重不均等的情况下，按总权重获取随机数offset=random.netx(totalWeight)，遍历invokers确定随机数offset落在哪个片段(invoker上)；

```java
// If (not every invoker has the same weight & at least one invoker's weight>0), select randomly based on totalWeight.
        int offset = random.nextInt(totalWeight);
        // Return a invoker based on the random value.
        for (int i = 0; i < length; i++) {
            offset -= getWeight(invokers.get(i), invocation);
            if (offset < 0) {
                return invokers.get(i);
            }
        }
```

**4、** 权重相同或者总权重为0，根据invokers个数均等选择invokers.get(random.nextInt(length))；

**RoundRobinLoadBalance**

RoundRobinLoadBalance：轮询，按公约后的权重设置轮询比率。

**1、** 获取轮询key：服务名+方法名，获取可供调用的invokers个数length，设置最大权重的默认值maxWeight=0，设置最小权重的默认值minWeight=Integer.MAX_VALUE；

**2、** 遍历所有Inokers，比较得出maxWeight和minWeight；

**3、** 如果权重是不一样的，根据key获取自增序列，自增序列加一并与最大权重取模得到currentWeigth，遍历所有invokers筛选出大于currentWeight的invokers，设置可供调用的invokers的个数length；

**4、** 自增序列加一并与length取模，从invokers获取invoker；

**LeastActiveLoadBalance**

LeastActiveLoadBalance：最少活跃调用数，相同活跃数的随机选择。

活跃数是指调用前后的计数差， 使慢的提供者收到更少的请求，因为越慢的提供者前后的计数差越大。

活跃计数的功能在消费者的ActiveLimitFilter中设置的：

```java
long begin = System.currentTimeMillis();
RpcStatus.beginCount(url, methodName);
try {
    Result result = invoker.invoke(invocation);
    RpcStatus.endCount(url, methodName, System.currentTimeMillis() - begin, true);
    return result;
} catch (RuntimeException t) {
    RpcStatus.endCount(url, methodName, System.currentTimeMillis() - begin, false);
    throw t;
}
```

最少活跃的选择过程如下：

**1、** 获取可调用invoker的总个数，初始化最小活跃数，相同最小活跃的个数，相同最小活跃数的下标数组等等；

**2、** 遍历所有invokers，获取每个invoker的活跃数active和权重，找出最小权重的invoker，如果有相同最小权重的inovkers，将下标记录到数组leastIndexs[]数组中，累计所有的权重到totalWeight变量；

**3、** 如果invokers的权重不相等且totalWeight大于0，按总权重随机offsetWeight=random.nextInt(totalWeight)计算随机值在哪个片段上并返回invoker；

```java
// If (not every invoker has the same weight & at least one invoker's weight>0), select randomly based on totalWeight.
int offsetWeight = random.nextInt(totalWeight);
// Return a invoker based on the random value.
for (int i = 0; i < leastCount; i++) {
    int leastIndex = leastIndexs[i];
    offsetWeight -= getWeight(invokers.get(leastIndex), invocation);
    if (offsetWeight <= 0)
        return invokers.get(leastIndex);
}
```

**4、** 如果invokers的权重相等或者totalWeight等于0，均等随机；

这里用到了RpcStatus，由RpcStatus的类描述可知，该项内容是在filter中进行记录。

```java
/**
 * URL statistics. (API, Cached, ThreadSafe)
 *
 * @see com.alibaba.dubbo.rpc.filter.ActiveLimitFilter
 * @see com.alibaba.dubbo.rpc.filter.ExecuteLimitFilter
 * @see com.alibaba.dubbo.rpc.cluster.loadbalance.LeastActiveLoadBalance
 */
public class RpcStatus {}
```

**ConsistentHashLoadBalance**

ConsistentHashLoadBalance：一致性hash，相同参数的请求总是发到同一个提供者，当某一台提供者挂时，原本发往该提供者的请求，基于虚拟节点，平摊到其它提供者，不会引起剧烈变动。对于一致性哈希算法介绍网上很多，这个给出[一致性hash算法 - consistent hashing](https://blog.csdn.net/sparkliang/article/details/5279393)供参考，读者请自行阅读ConsistentashLoadBalance中对一致性哈希算法的实现，还是比较通俗易懂的这里不再介绍。

### 配置规则Configurator

配置规则实际上是在生成invoker的过程中对url进行改写

Configurator接口定义：

```java
/**
 * Configurator. (SPI, Prototype, ThreadSafe)
 *
 */
public interface Configurator extends Comparable<Configurator> {
    /**
     * get the configurator url.
     *
     * @return configurator url.
     */
    URL getUrl();
    /**
     * Configure the provider url.
     * O
     *
     * @param url - old rovider url.
     * @return new provider url.
     */
    URL configure(URL url);
}
```

目前包含两种规则：AbsentConfigurator和OverrideConfigurator，前者是如果缺少项，则新增，而后者是直接覆盖。具体是在RegistryDirectory中的mergeUrl函数中用到。

另外，根据dubbo文档描述，向注册中心写入动态配置覆盖规则通常由监控中心或治理中心的页面完成。
