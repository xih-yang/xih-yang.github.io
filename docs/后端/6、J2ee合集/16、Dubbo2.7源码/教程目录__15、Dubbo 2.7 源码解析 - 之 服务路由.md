# 15、Dubbo 2.7 源码解析 - 之 服务路由
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/15.html
- 分类：J2EE框架
- 分组：教程目录
## 服务路由源码解析

## 1. 什么是服务路由

服务路由包含一条(或若干条)路由规则，路由规则决定了服务消费者的调用目标，即规定了服务消费者可调用哪些服务提供者。Dubbo 目前提供了三种服务路由实现，分别为条件路由ConditionRouter、脚本路由 ScriptRouter 和标签路由 TagRouter。其中条件路由是我们最常使用的。

下面将以条件路由为例来讲解服务路由的用法。

## 2. 路由规则的设置

路由规则是在 Dubbo 管控平台 Dubbo-Admin 中的。

### (1) 启动管控平台

**A、启动管控台**

将dubbo-admin-0.1.jar 文件存放到任意目录下，例如 D 盘根目录下，直接运行。

注意这里的 dubbo-admin 是已经配置好的。具体配置详见《Dubbo（二）入门 Dubbo 管理控制台》。

**B、 访问**

在浏览器地址栏中输入 http://localhost:8080 ，即可看到 Dubbo 管理控制台界面。

### (2) 设置路由规则

点击创建：

就在这里设置路由规则。

## 3. 路由规则详解

### (1) 初识路由规则

应用粒度路由规则：

```java
scope: application
force: true
runtime: true
enabled: true
key: governance-conditionrouter-consumer
conditions:
# app1 的消费者只能消费所有端口为 20880 的服务提供实例
 - application=app1 => address=*:20880
# app2 的消费者只能消费所有端口为 20881 的服务提供实例
 - application=app2 => address=*:20881
```

服务粒度路由规则：

```java
scope: service
force: true
runtime: true
enabled: true
key: org.apache.dubbo.samples.governance.api.DemoService
conditions:
# DemoService 的 sayHello 方法只能消费所有端口为 20880 的服务提供者实例
 - method=sayHello => address=*:20880
# DemoService 的 sayHi 方法只能消费所有端口为 20881 的服务提供者实例
 - method=sayHi => address=*:20881
```

### (2) 属性详解

**A、 scope**

必填项。表示路由规则的作用粒度，其取值将会决定 key 的取值。其取值范围如下：

- service：表示服务粒度
- application：表示应用粒度

**B、 Key**

必填项。指定规则体将作用于哪个服务或应用。其取值取决于 scope 的取值。

- scope 取值为 application 时，key 取值为 application 名称，即``的值。
- scope 取值为 service 时，key 取值为[group:]service[:version]的组合，即组、接口名称与版本号。

**C、 enabled**

可选项。指定当前路由规则是否立即生效。缺省值为 true，表示立即生效。

**D、force**

可选项。指定当路由结果为空时，是否强制执行。如果不强制执行，路由结果为空则路由规则自动失效，不使用路由。缺省为 false，不强制执行。

**E、 runtime**

可选项。指定是否在每次调用时执行路由规则。

- 若为 false 则表示只在提供者地址列表变更时会预先执行路由规则，并将路由结果进行缓存，消费者调用时直接从缓存中获取路由结果。
- 若为 true 则表示每次调用都要重新计算路由规则，其将会直接影响调用的性能。缺省为 false。

**F、 priority**

可选项。用于设置路由规则的优先级，数字越大，优先级越高，越靠前执行。缺省为 0。

### (3) 规则体 conditions

必填项。定义具体的路由规则内容，由 1 到任意多条规则组成。

**A、格式**

路由规则由两个条件组成，分别用于对服务消费者和提供者进行匹配。

[服务消费者匹配条件] => [服务提供者匹配条件]

- 当消费者的 URL 满足匹配条件时，对该消费者执行后面的过滤规则。
- => 之后为提供者地址列表的过滤条件，所有参数和提供者的 URL 进行对比，消费者最终只拿到过滤后的地址列表。

> 例如路由规则为：host = 10.20.153.10 => host = 10.20.153.11。其表示 IP 为 10.20.153.10的服务消费者只可调用 IP 为 10.20.153.11 机器上的服务，不可调用其他机器上的服务。

不过，这两个条件存在缺省的情况：

- 服务消费者匹配条件为空，表示不对服务消费者进行限制，所有消费者均将被路由到行后面的提供者。
- 服务提供者匹配条件为空，表示对符合消费者条件的消费者将禁止调用任何提供者。

> 例如路由规则为：=> host != 10.20.153.11，则表示所有消费者均可调用IP为10.20.153.11之外的所有提供者。
>
> 再如路由规则为：host = 10.20.153.10 => ，则表示 IP 为 10.20.153.10 的提供者不能调用任何提供者。

**B、 符号支持**

参数符号：

- method：将调用方法作为路由规则比较的对象
- argument：将调用方法参数作为路由规则比较的对象
- protocol：将调用协议作为路由规则比较的对象
- host：将 IP 作为路由规则比较的对象
- port：将端口号作为路由规则比较的对象
- address：将 IP:端口号作为路由规则比较的对象
- application：将应用名称作为路由规则比较的对象

条件符号：

- 等于号(=)：将参数类型匹配上参数值作为路由条件
- 不等号(!=)：将参数类型不匹配参数值作为路由条件

取值符号：

- 逗号(,)：多个取值的分隔符，如：host != 10.20.153.10,10.20.153.11
- 星号(*)：通配符，如：host != 10.20.*
- 美元符号(`$`)：表示引用消费者的参数值，如：host = `$`host

**C、 举例**

- 白名单

host != 10.20.153.10,10.20.153.11 =>

禁用 IP 为 10.20.153.10 与 10.20.153.11 之外的所有主机。
- 黑名单

host = 10.20.153.10,10.20.153.11 =>

IP 为 10.20.153.10 与 10.20.153.11 的主机将被禁用。
- 只暴露一部分的提供者

=> host = 172.22.3.1*,172.22.3.2*

消费者只可访问 IP 为 172.22.3.1*与 172.22.3.2*的提供者主机。
- 为重要应用提供额外的机器

application != kylin => host != 172.22.3.95,172.22.3.96

应用名称不为 kylin 的应用不能访问 172.22.3.95 与 172.22.3.96 两台提供者主机。即只有名称为 kylin 的消费者可以访问 172.22.3.95 与 172.22.3.96 两台提供者主机。当然，kylin 还可以访问其它提供者主机，而其它消费者也可以访问 172.22.3.95 与 172.22.3.96 之外的所有提供者主机。
- 读写分离

method = find*,list*,get*,is* => host = 172.22.3.94,172.22.3.95,172.22.3.96

method != find*,list*,get*,is* => host = 172.22.3.97,172.22.3.98

find、list、get、is 开头的消费者方法会被路由到 172.22.3.94、172.22.3.95 与 172.22.3.96

三台提供者主机，而其它方法则会被路由到 172.22.3.97 与 172.22.3.98 两台提供者主机。
- 前后台分离

application = bops => host = 172.22.3.91,172.22.3.92,172.22.3.93

application != bops => host = 172.22.3.94,172.22.3.95,172.22.3.96

应用名称的 bops 的消费者会被路由到 172.22.3.91、172.22.3.92 与 172.22.3.93 三台提供者主机，而其它消费者则会被路由到 172.22.3.94、172.22.3.95 与 172.22.3.96 三台提供者。
- 隔离不同机房网段

host != 172.22.3.* => host != 172.22.3.*

不是 172.22.3 网段的消费者是不能访问 172.22.3 网段的提供者的。即只有 172.22.3 网段的消费者才可访问 172.22.3 网段的提供者。当然，172.22.3 网段的消费者也可访问其它网段的提供者。
- 只访问本机的服务

=> host = $host

$host 表示获取消费者请求中的消费者主机 IP。故该规则就表示消费者只能访问本机的服务。

> 演示：

> 有个问题：
>
> 将上面通过黑白名单配置的路由规则从ZK中直接拷贝出来，在条件路由中配置：
>
>
>
> 添加成功后看ZK：
>
>
>
> 启动代码：
>
>
>
> 删掉路由规则，提供者端不动，重新启动消费者(因为我们消费者是一个简单Demo不是容器、Web应用，只能重新启动)：
>
> 发现又成功执行
>
>
>
> 可以看到这个路由规则是动态配置的。

## 4. 源码解析

三个关键问题：

- 在哪添加 RouterChain 到 Directory的
- 在哪读取 zk 中的路由规则并添加到 RouterChain 的
- 在哪进行服务路由过滤的

### (1) 添加 RouterChain 到 Directory

> 先看下都有哪些激活的RouterFactory ：
>
> 找到META-INF/dubbo/internal/org.apache.dubbo.rpc.cluster.RouterFactory文件：
>
>
>
>
>
> 只有最后四个类被@Activate标记

之前我们分析过服务订阅流程，现在只列路径：

org.apache.dubbo.config.ReferenceConfig#init

org.apache.dubbo.config.ReferenceConfig#createProxy

org.apache.dubbo.rpc.Protocol#refer(为每个注册中心虚拟一个invoker)

org.apache.dubbo.registry.integration.RegistryProtocol#refer

org.apache.dubbo.registry.integration.RegistryProtocol#doRefer

```java
//org.apache.dubbo.registry.integration.RegistryProtocol#doRefer
private <T> Invoker<T> doRefer(Cluster cluster, Registry registry, Class<T> type, URL url) {
    // 生成一个动态Directory
    RegistryDirectory<T> directory = new RegistryDirectory<T>(type, url);
    directory.setRegistry(registry);
    directory.setProtocol(protocol);
    // all attributes of REFER_KEY
    Map<String, String> parameters = new HashMap<String, String>(directory.getUrl().getParameters());
    URL subscribeUrl = new URL(CONSUMER_PROTOCOL, parameters.remove(REGISTER_IP_KEY), 0, type.getName(), parameters);
    if (!ANY_VALUE.equals(url.getServiceInterface()) && url.getParameter(REGISTER_KEY, true)) {
        directory.setRegisteredConsumerUrl(getRegisteredConsumerUrl(subscribeUrl, url));
        // 将consumer注册到zk
        registry.register(directory.getRegisteredConsumerUrl());
    }
    // 将所有router添加到directory
    directory.buildRouterChain(subscribeUrl);
    // 订阅服务
    directory.subscribe(subscribeUrl.addParameter(CATEGORY_KEY,
            PROVIDERS_CATEGORY + "," + CONFIGURATORS_CATEGORY + "," + ROUTERS_CATEGORY));
    // 将invoker列表伪装为一个invoker
    Invoker invoker = cluster.join(directory);
    ProviderConsumerRegTable.registerConsumer(invoker, url, subscribeUrl, directory);
    return invoker;
}
```

关键代码就在这，生成动态列表RegistryDirectory后，调用了directory.buildRouterChain(subscribeUrl)方法：

```java
//org.apache.dubbo.registry.integration.RegistryDirectory#buildRouterChain
public void buildRouterChain(URL url) {
    this.setRouterChain(RouterChain.buildChain(url));
}
```

> DEBUG

主要跟RouterChain.buildChain(url)：

```java
//org.apache.dubbo.rpc.cluster.RouterChain#buildChain
public static <T> RouterChain<T> buildChain(URL url) {
    return new RouterChain<>(url);
}
```

看RouterChain的构造：

```java
private RouterChain(URL url) {
    List<RouterFactory> extensionFactories = ExtensionLoader
            // 加载并缓存RouterFactory的所有扩展类(四类)
            .getExtensionLoader(RouterFactory.class)
            //获取激活的扩展类(之前看了有四个)
            .getActivateExtension(url, (String[]) null);
    // 遍历RouterFactory列表，每个Factory都会根据url创建一个路由器Router
    // 将所有生成的Router形成List集合
    List<Router> routers = extensionFactories.stream()
            .map(factory -> factory.getRouter(url))
            .collect(Collectors.toList());
    // 使用Router列表初始化RouterChain
    initWithRouters(routers);
}
//org.apache.dubbo.rpc.cluster.RouterChain#initWithRouters
public void initWithRouters(List<Router> builtinRouters) {
	//当前是RouterChain，维护了Router列表
    this.builtinRouters = builtinRouters;
    this.routers = new ArrayList<>(builtinRouters);
    //排序(自然排序，Router实现了Comparable接口，底层根据
    //org.apache.dubbo.rpc.cluster.Router#getPriority的值进行排序)
    this.sort();
}
```

> DEBUG
>
> 看下RouterChain
>
>
>
> 包含的就是之前我们看到的四个激活的 RouterFactory 创建的对应的Router
>
> 这四个是属于一开始默认激活的

### (2) 读取 zk 中的路由规则并添加到 RouterChain

**A、获取 router 子节点 url**

> 先看下zk中关于路由的元数据：

路由规则从ZK中读取的时机，就是我们之前跟服务订阅时，更新providers列表信息一样，还记得有三种分类节点吗：

```java
//org.apache.dubbo.registry.integration.RegistryProtocol#doRefer
private <T> Invoker<T> doRefer(Cluster cluster, Registry registry, Class<T> type, URL url) {
    // 生成一个动态Directory
    RegistryDirectory<T> directory = new RegistryDirectory<T>(type, url);
    directory.setRegistry(registry);
    directory.setProtocol(protocol);
    // all attributes of REFER_KEY
    Map<String, String> parameters = new HashMap<String, String>(directory.getUrl().getParameters());
    URL subscribeUrl = new URL(CONSUMER_PROTOCOL, parameters.remove(REGISTER_IP_KEY), 0, type.getName(), parameters);
    if (!ANY_VALUE.equals(url.getServiceInterface()) && url.getParameter(REGISTER_KEY, true)) {
        directory.setRegisteredConsumerUrl(getRegisteredConsumerUrl(subscribeUrl, url));
        // 将consumer注册到zk
        registry.register(directory.getRegisteredConsumerUrl());
    }
    // 将所有router添加到directory
    directory.buildRouterChain(subscribeUrl);
    // 订阅服务
    directory.subscribe(subscribeUrl.addParameter(CATEGORY_KEY,
            PROVIDERS_CATEGORY + "," + CONFIGURATORS_CATEGORY + "," + ROUTERS_CATEGORY));
    // 将invoker列表伪装为一个invoker
    Invoker invoker = cluster.join(directory);
    ProviderConsumerRegTable.registerConsumer(invoker, url, subscribeUrl, directory);
    return invoker;
}
```

即directory.subscribe方法：

org.apache.dubbo.registry.integration.RegistryDirectory#subscribe

org.apache.dubbo.registry.RegistryService#subscribe

org.apache.dubbo.registry.support.FailbackRegistry#subscribe

org.apache.dubbo.registry.support.FailbackRegistry#doSubscribe

org.apache.dubbo.registry.dubbo.DubboRegistry#doSubscribe

```java
public void doSubscribe(final URL url, final NotifyListener listener) {
    try {
        if (ANY_VALUE.equals(url.getServiceInterface())) {
       // 处理interface属性为*的情况
			...
        } else {
       // 处理interface属性为真正接口的情况
            // 存放所有分类节点下的所有子节点url
            List<URL> urls = new ArrayList<>();
            for (String path : toCategoriesPath(url)) {
	            //将url分成三类：providers、routers、configurators
	            //此时routers是我们需要关注的
                ConcurrentMap<NotifyListener, ChildListener> listeners = zkListeners.get(url);
                if (listeners == null) {
                    zkListeners.putIfAbsent(url, new ConcurrentHashMap<>());
                    listeners = zkListeners.get(url);
                }
                ChildListener zkListener = listeners.get(listener);
                if (zkListener == null) {
                    listeners.putIfAbsent(listener, (parentPath, currentChilds) -> ZookeeperRegistry.this.notify(url, listener, toUrlsWithEmpty(url, parentPath, currentChilds)));
                    zkListener = listeners.get(listener);
                }
                // 在zk中创建分类节点
                zkClient.create(path, false);
                // 为分类节点添加子节点列表变更的watcher监听
                // 并返回其所有子节点列表
                List<String> children = zkClient.addChildListener(path, zkListener);
                if (children != null) {
                    // toUrlsWithEmpty()获取当前分类节点下的所有子节点url
                    // 如果children为空，会生成一个empty的URL
                    urls.addAll(toUrlsWithEmpty(url, path, children));
                }
            }
            // 主动调用notify()方法，更新分类节点子节点列表
            notify(url, listener, urls);
        }
    } catch (Throwable e) {
        throw new RpcException("Failed to subscribe " + url + " to zookeeper " + getUrl() + ", cause: " + e.getMessage(), e);
    }
}
```

> DEBUG
>
>
>
> 看下执行notify时，urls内容：
>
>
>
> 看下路由相关参数

**B、 将路由添加到 directory**

继续走notify方法：

org.apache.dubbo.registry.support.FailbackRegistry#notify

org.apache.dubbo.registry.support.FailbackRegistry#doNotify

org.apache.dubbo.registry.support.AbstractRegistry#notify(org.apache.dubbo.common.URL, org.apache.dubbo.registry.NotifyListener, java.util.List``)

```java
protected void notify(URL url, NotifyListener listener, List<URL> urls) {
	//url是消费者url，urls是提供者url列表
	...
    // keep every provider's category.
    // key：category
    // value：为该category的所有子节点的url
    Map<String, List<URL>> result = new HashMap<>();
    for (URL u : urls) {
        if (UrlUtils.isMatch(url, u)) {
            String category = u.getParameter(CATEGORY_KEY, DEFAULT_CATEGORY);
            // 为每一个category创建一个List，然后将category作为key，
            // 将这个创建的list作用value
            List<URL> categoryList = result.computeIfAbsent(category, k -> new ArrayList<>());
            // 将当前遍历的url放入到相应的category的list中
            categoryList.add(u);
        }
    }
    if (result.size() == 0) {
        return;
    }
    // 为当前消费者url创建一个map，而这个map存的就是上面result中的内容
    Map<String, List<URL>> categoryNotified = notified.computeIfAbsent(url, u -> new ConcurrentHashMap<>());
    // 遍历所有的category
    for (Map.Entry<String, List<URL>> entry : result.entrySet()) {
        String category = entry.getKey();
        List<URL> categoryList = entry.getValue();
        categoryNotified.put(category, categoryList);
        // 主动调用当前遍历category的notify()，更新其子节点列表
        listener.notify(categoryList);
        // We will update our cache file after each notification.
        // When our Registry has a subscribe failure due to network jitter, we can return at least the existing cache URL.
        saveProperties(url);
    }
}
```

这些代码之前都跟过，继续看listener.notify(categoryList)：

>

```java
//org.apache.dubbo.registry.integration.RegistryDirectory#notify
public synchronized void notify(List<URL> urls) {
    Map<String, List<URL>> categoryUrls = urls.stream()
            .filter(Objects::nonNull)
            .filter(this::isValidCategory)
            .filter(this::isNotCompatibleFor26x)
            .collect(Collectors.groupingBy(url -> {
                if (UrlUtils.isConfigurator(url)) {
                    return CONFIGURATORS_CATEGORY;
                } else if (UrlUtils.isRoute(url)) {
                    return ROUTERS_CATEGORY;
                } else if (UrlUtils.isProvider(url)) {
                    return PROVIDERS_CATEGORY;
                }
                return "";
            }));
    // 处理category为configurators的情况
    List<URL> configuratorURLs = categoryUrls.getOrDefault(CONFIGURATORS_CATEGORY, Collections.emptyList());
    this.configurators = Configurator.toConfigurators(configuratorURLs).orElse(this.configurators);
    // 处理category为routers的情况
    List<URL> routerURLs = categoryUrls.getOrDefault(ROUTERS_CATEGORY, Collections.emptyList());
    //lambda表达式，toRouters返回的集合不为空
    // 则会调用addRouters方法，把自己作为参数
    toRouters(routerURLs).ifPresent(this::addRouters);
    // providers
    // 处理category为providers的情况
    List<URL> providerURLs = categoryUrls.getOrDefault(PROVIDERS_CATEGORY, Collections.emptyList());
    refreshOverrideAndInvoker(providerURLs);
}
```

此时我们关注toRouters方法：

```java
public class RegistryDirectory<T> extends AbstractDirectory<T> implements NotifyListener {
	...
    private static final RouterFactory ROUTER_FACTORY = ExtensionLoader.getExtensionLoader(RouterFactory.class).getAdaptiveExtension();
    ...
    private Optional<List<Router>> toRouters(List<URL> urls) {
        if (urls == null || urls.isEmpty()) {
            return Optional.empty();
        }
        List<Router> routers = new ArrayList<>();
        for (URL url : urls) {
            if (EMPTY_PROTOCOL.equals(url.getProtocol())) {
                continue;
            }
            String routerType = url.getParameter(ROUTER_KEY);
            if (routerType != null && routerType.length() > 0) {
                url = url.setProtocol(routerType);
            }
            try {
	            //核心代码，ROUTER_FACTORY是一个自适应RouterFactory
                Router router = ROUTER_FACTORY.getRouter(url);
                if (!routers.contains(router)) {
                    routers.add(router);
                }
            } catch (Throwable t) {
                logger.error("convert router url to router error, url: " + url, t);
            }
        }
        return Optional.of(routers);
    }
```

如果routers不为空，则会执行addRouters方法，将Router添加到routerChain

```java
//org.apache.dubbo.rpc.cluster.directory.AbstractDirectory#addRouters
protected void addRouters(List<Router> routers) {
    routers = routers == null ? Collections.emptyList() : routers;
    routerChain.addRouters(routers);
}
```

### (3) 服务路由过滤

服务路由过滤是发生在消费者远程调用的时候：

从消费者动态代理类的InvokerInvocationHandler开始追踪：

```java
//org.apache.dubbo.rpc.proxy.InvokerInvocationHandler#invoke
public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    String methodName = method.getName();
    Class<?>[] parameterTypes = method.getParameterTypes();
    // 若当前调用的方法是Object的方法，则进行本地调用
    if (method.getDeclaringClass() == Object.class) {
        return method.invoke(invoker, args);
    }
    // 若当前调用的方法是重写的toString()、hashCode()与equals()，则调用重写的
    if ("toString".equals(methodName) && parameterTypes.length == 0) {
        return invoker.toString();
    }
    if ("hashCode".equals(methodName) && parameterTypes.length == 0) {
        return invoker.hashCode();
    }
    if ("equals".equals(methodName) && parameterTypes.length == 1) {
        return invoker.equals(args[0]);
    }
    // 远程调用
    return invoker.invoke(new RpcInvocation(method, args)).recreate();
}
```

跟invoke：

org.apache.dubbo.rpc.cluster.support.wrapper.MockClusterInvoker#invoke

org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#invoke

```java
//org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#invoke
public Result invoke(final Invocation invocation) throws RpcException {
    checkWhetherDestroyed();
    // binding attachments into invocation.
    Map<String, String> contextAttachments = RpcContext.getContext().getAttachments();
    if (contextAttachments != null && contextAttachments.size() != 0) {
        ((RpcInvocation) invocation).addAttachments(contextAttachments);
    }
    // 服务路由
    List<Invoker<T>> invokers = list(invocation);
    // 获取负载均衡策略
    LoadBalance loadbalance = initLoadBalance(invokers, invocation);
    RpcUtils.attachInvocationIdIfAsync(getUrl(), invocation);
    return doInvoke(invocation, invokers, loadbalance);
}
```

核心代码就在list方法：

```java
//org.apache.dubbo.rpc.cluster.support.AbstractClusterInvoker#list
protected List<Invoker<T>> list(Invocation invocation) throws RpcException {
	//此时directory是动态列表RegistryDirectory
    return directory.list(invocation);
}
```

继续跟

```java
//org.apache.dubbo.rpc.cluster.directory.AbstractDirectory#list
public List<Invoker<T>> list(Invocation invocation) throws RpcException {
	//Directory是可以销毁的，如果销毁了，里面所有invoker就不能用了
    if (destroyed) {
        throw new RpcException("Directory already destroyed .url: " + getUrl());
    }
    return doList(invocation);
}
```

doList的实现在org.apache.dubbo.registry.integration.RegistryDirectory#doList

```java
public List<Invoker<T>> doList(Invocation invocation) {
    if (forbidden) {
	    // forbidden为true的两种情况：
	    // 1.没有provider  2.所有providers都失效了
        // 1. No service provider 2. Service providers are disabled
        throw new RpcException(RpcException.FORBIDDEN_EXCEPTION, "No provider available from registry "+ ...);
    }
    if (multiGroup) {
        return this.invokers == null ? Collections.emptyList() : this.invokers;
    }
    List<Invoker<T>> invokers = null;
    try {
	    // 核心代码在这，用的责任链设计模式
        // Get invokers from cache, only runtime routers will be executed.
        invokers = routerChain.route(getConsumerUrl(), invocation);
    } catch (Throwable t) {
        logger.error("Failed to execute router: " + getUrl() + ", cause: " + t.getMessage(), t);
    }
    return invokers == null ? Collections.emptyList() : invokers;
}
```

> DEBUG，看下此时routerChain中有几个Router：
>
>
>
> 看到除了一开始默认激活的4个，这里多了一个从ZK中获取的条件路由器

跟routerChain.route：

```java
//org.apache.dubbo.rpc.cluster.RouterChain#route
public List<Invoker<T>> route(URL url, Invocation invocation) {
    List<Invoker<T>> finalInvokers = invokers;
    for (Router router : routers) {
	    //每次router.route的结果作为下一个router.route的参数
	    //责任链设计模式
        finalInvokers = router.route(finalInvokers, url, invocation);
    }
    return finalInvokers;
}
```

此时我们一共有5个router，我们只关注我们定义的条件路由：

```java
//org.apache.dubbo.rpc.cluster.router.condition.ConditionRouter#route
public <T> List<Invoker<T>> route(List<Invoker<T>> invokers, URL url, Invocation invocation)
        throws RpcException {
    // 若条件路由规则中的enabled属性为false，则路由规则不起作用，
    // 意味着，消费者可以调用所有invoker，所以这里返回invokers列表
    if (!enabled) {
        return invokers;
    }
    if (CollectionUtils.isEmpty(invokers)) {
        return invokers;
    }
    // matchWhen()是对路由规则中=>左侧进行判断，即对消费者进行判断
    // 若该方法返回false，则表示当前规则对该消费者不起作用，则当前
    // 消费者可以调用所有invoker，所以这里返回invokers列表
    try {
        if (!matchWhen(url, invocation)) {
            return invokers;
        }
        // 用于存放路由结果
        List<Invoker<T>> result = new ArrayList<Invoker<T>>();
        // thenCondition用于缓存=>的右侧内容，即提供者判断条件
        // 若其为空，则表示当前路由规则为黑名单，即当前的消费者
        // 不能访问任何invoker，所以会返回一个空的result
        if (thenCondition == null) {
            logger.warn("The current consumer in the service blacklist. consumer: " + NetUtils.getLocalHost() + ", service: " + url.getServiceKey());
            return result;
        }
        // matchThen() 用于判断提供者条件
        // 遍历所有invoker，逐个判断该提供者是否符合当前路由规则中=>右侧的条件，
        // 若符合，则将其写入到result列表
        for (Invoker<T> invoker : invokers) {
            if (matchThen(invoker.getUrl(), url)) {
                result.add(invoker);
            }
        }
        if (!result.isEmpty()) {
            return result;
        } else if (force) {
            logger.warn("The route result is empty and force execute. consumer: " + NetUtils.getLocalHost() + ", service: " + url.getServiceKey() + ", router: " + url.getParameterAndDecoded(RULE_KEY));
            return result;
        }
    } catch (Throwable t) {
        logger.error("Failed to execute condition router rule: " + getUrl() + ", invokers: " + invokers + ", cause: " + t.getMessage(), t);
    }
    return invokers;
}
```

其中matchWhen和matchThen的细节就不跟了，很复杂，感兴趣的自己看吧。
