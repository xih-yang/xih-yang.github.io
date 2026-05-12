# 14、Dubbo 实战 - 生产者发布服务
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/14.html
- 分类：J2EE框架
- 分组：教程目录
### Export发布服务流程

Dubbo协议向注册中心发布服务：当服务提供方，向dubbo协议的注册中心发布服务的时候，是如何获取，创建注册中心的，如何注册以及订阅服务的，下面我们来分析其流程。

看如下配置发布服务：

```java
<!-- 指定了哪种的注册中心，是基于zookeeper协议的，指定了注册中心的地址以及端口号 -->
<dubbo:registry protocol="zookeeper" client="zkclient" address="localhost:2181" group="dubbo"/>
<bean id="demoService" class="com.alibaba.dubbo.demo.provider.DemoServiceImpl"/> 
<!-- 发布DemoService服务，服务的实现为DemoServiceImpl -->
<dubbo:service interface="com.alibaba.dubbo.demo.DemoService" ref="demoService"/> 
```

每个[dubbo:service/](dubbo:service/)在Spring内部都会生成一个ServiceBean实例，ServiceBean的实例化过程中调用export方法来暴露服务

**1、** 通过loadRegistries获取注册中心registryUrls；

```java
registry://localhost:2181/com.alibaba.dubbo.registry.RegistryService?application=demo-provider&client=zkclient&dubbo=2.6.1&group=dubbo&logger=slf4j&pid=8012&registry=zookeeper&timestamp=1532198612419
```

用统一数据模型URL表示：

- protocol=registry　　 　　 表示一个注册中心URL
- 注册中心地址　　　　　　localhost:2181
- 调用注册中心的服务　　 RegistryService
- 注册中心协议　　　　　 registry=zookeeper
- 。。。。。。

**2、** 构建发布服务的URL；

```java
dubbo://192.168.56.1:20882/org.apache.dubbo.demo.DemoService?anyhost=true&application=demo-provider&buffer=8192&dispatcher=all&dubbo=2.6.1&executes=3&generic=false&interface=org.apache.dubbo.demo.DemoService&iothreads=2&loadbalance=leastactive&logger=slf4j&methods=sayHello&pid=8012&queues=300&retries=0&side=provider&threadpool=fixed&threads=10&timeout=300&timestamp=1532198751165
```

- 发布协议　　　　　　protocol =dubbo
- 服务提供者的地址　　192.168.56.1:20882
- 发布的服务　　　　com.alibaba.dubbo.demo.DemoService
- 。。。。。。

**3、** 遍历registryUrls向注册中心注册服务；

给每个registryUrl添加属性key为export，value为上面的发布服务url得到如下registryUrl

```java
registry://localhost:2181/com.alibaba.dubbo.registry.RegistryService?application=demo-provider&client=zkclient&dubbo=2.6.1&group=dubbo&logger=slf4j&pid=8012&registry=zookeeper&timestamp=1532198612419&export=dubbo%3a%2f%2f192.168.56.1%3a20882%2forg.apache.dubbo.demo.DemoService%3fanyhost%3dtrue%26application%3ddemo-provider%26buffer%3d8192%26dispatcher%3dall%26dubbo%3d2.6.1%26executes%3d3%26generic%3dfalse%26interface%3dorg.apache.dubbo.demo.DemoService%26iothreads%3d2%26loadbalance%3dleastactive%26logger%3dslf4j%26methods%3dsayHello%26pid%3d8012%26queues%3d300%26retries%3d0%26side%3dprovider%26threadpool%3dfixed%26threads%3d10%26timeout%3d300%26timestamp%3d1532198751165
```

**4、** 由发布的服务实例，服务接口以及registryUrl为参数，通过代理工厂proxyFactory获取Invoker对象，Invoker对象是dubbo的核心模型，其他对象都向它靠拢或者转换成它；

**5、** 通过Protocol对象暴露服务protocol.export(invoker)；

- 通过DubboProtocol暴露服务的监听;
- 通过RegistryProtocol将服务地址发布到注册中心，并订阅此服务。

以上逻辑，在ServiceConfig类中的doExportUrlsFor1Protocol实现：

```java
String scope = url.getParameter(Constants.SCOPE_KEY);
// don't export when none is configured
// 配置为none不暴露
if (!Constants.SCOPE_NONE.toString().equalsIgnoreCase(scope)) {
    // export to local if the config is not remote (export to remote only when config is remote)
    // 配置不是remote的情况下做本地暴露 (配置为remote，则表示只暴露远程服务)
    if (!Constants.SCOPE_REMOTE.toString().equalsIgnoreCase(scope)) {
        exportLocal(url);
    }
    // export to remote if the config is not local (export to local only when config is local)
    // 如果配置不是local则暴露为远程服务.(配置为local，则表示只暴露远程服务)
    if (!Constants.SCOPE_LOCAL.toString().equalsIgnoreCase(scope)) {
        if (logger.isInfoEnabled()) {
            logger.info("Export dubbo service " + interfaceClass.getName() + " to url " + url);
        }
        if (registryURLs != null && !registryURLs.isEmpty()) {
            for (URL registryURL : registryURLs) {
                url = url.addParameterIfAbsent("dynamic", registryURL.getParameter("dynamic"));
                URL monitorUrl = loadMonitor(registryURL);
                if (monitorUrl != null) {
                    url = url.addParameterAndEncoded(Constants.MONITOR_KEY, monitorUrl.toFullString());
                }
                if (logger.isInfoEnabled()) {
                    logger.info("Register dubbo service " + interfaceClass.getName() + " url " + url + " to registry " + registryURL);
                }
                Invoker<?> invoker = proxyFactory.getInvoker(ref, (Class) interfaceClass, registryURL.addParameterAndEncoded(Constants.EXPORT_KEY, url.toFullString()));
                DelegateProviderMetaDataInvoker wrapperInvoker = new DelegateProviderMetaDataInvoker(invoker, this);
                Exporter<?> exporter = protocol.export(wrapperInvoker);
                exporters.add(exporter);
            }
        } else {
            Invoker<?> invoker = proxyFactory.getInvoker(ref, (Class) interfaceClass, url);
            DelegateProviderMetaDataInvoker wrapperInvoker = new DelegateProviderMetaDataInvoker(invoker, this);
            Exporter<?> exporter = protocol.export(wrapperInvoker);
            exporters.add(exporter);
        }
    }
}
this.urls.add(url);
```

### RegistryProtocol.export(Invoker)暴露服务

META-INF/dubbo/internal/com.alibaba.dubbo.rpc.Protocol 文件中配置如下：

```java
registry=com.alibaba.dubbo.registry.integration.RegistryProtocol
```

因为上一步中url为registry://开头，因此使用的是RegistryProtocol类。

```java
public <T> Exporter<T> export(final Invoker<T> originInvoker) throws RpcException {
    //export invoker
    final ExporterChangeableWrapper<T> exporter = doLocalExport(originInvoker);
    URL registryUrl = getRegistryUrl(originInvoker);
    //registry provider
    final Registry registry = getRegistry(originInvoker);
    final URL registedProviderUrl = getRegistedProviderUrl(originInvoker);
    //to judge to delay publish whether or not
    boolean register = registedProviderUrl.getParameter("register", true);
    ProviderConsumerRegTable.registerProvider(originInvoker, registryUrl, registedProviderUrl);
    if (register) {
        register(registryUrl, registedProviderUrl);
        ProviderConsumerRegTable.getProviderWrapper(originInvoker).setReg(true);
    }
    // Subscribe the override data
    // 订阅override数据
    // FIXME When the provider subscribes, it will affect the scene : a certain JVM exposes the service and call the same service. Because the subscribed is cached key with the name of the service, it causes the subscription information to cover.
    // FIXME 提供者订阅时，会影响同一JVM即暴露服务，又引用同一服务的的场景，因为subscribed以服务名为缓存的key，导致订阅信息覆盖。
    final URL overrideSubscribeUrl = getSubscribedOverrideUrl(registedProviderUrl);
    final OverrideListener overrideSubscribeListener = new OverrideListener(overrideSubscribeUrl, originInvoker);
    overrideListeners.put(overrideSubscribeUrl, overrideSubscribeListener);
    registry.subscribe(overrideSubscribeUrl, overrideSubscribeListener);
    //Ensure that a new exporter instance is returned every time export
    // 保证每次export都返回一个新的exporter实例
    return new DestroyableExporter<T>(exporter, originInvoker, overrideSubscribeUrl, registedProviderUrl);
}
```

以上函数中，doLocalExport(originInvoker)就是调用正常的protocol的export过程，进行暴露。

这里我们针对demo的例子，在debug过程中记录如下信息：

registedProviderUrl

```java
dubbo://192.168.56.1:20882/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&pid=6324&side=provider&timestamp=1428237661384
```

overrideSubscribeUrl

```java
provider://192.168.56.1:20882/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider&category=configurators&check=false&dubbo=2.0.0&generic=false&interface=com.alibaba.dubbo.demo.DemoService&loadbalance=roundrobin&methods=sayHello&pid=6324&side=provider&timestamp=1428237661384
```

注册时应该是将registedProviderUrl传递到注册中心，注册中心记录相应信息。这里我们可以理解为，消费者访问注册中心时，根据消费者需要获得的服务去读取服务提供者（url）。 而订阅时，则是根据overrideSubscribeUrl地址和overrideSubscribeListener监听。overrideSubscribeListener监听的作用是当提供者的url改变时，重新export。
