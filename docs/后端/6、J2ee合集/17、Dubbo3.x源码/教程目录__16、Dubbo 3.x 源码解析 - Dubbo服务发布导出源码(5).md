# 16、Dubbo 3.x 源码解析 - Dubbo服务发布导出源码(5)
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/16.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo服务的发布与引用的源码。

此前我们学习了[Dubbo服务发布导出源码(4)](/zhuanlan/j2ee/dubbo/2/15.html)，也就是Dubbo远程服务导出export方法的上半部分，也就是doLocalExport源码，将会得到一个Exporter。

## 1 register注册服务到注册中心

**此前我们学习过，在远程服务导出协议（RegistryProtocol、InterfaceCompatibleRegistryProtocol）的export方法中，在本地导出服务得到Exporter之后，还需要将其注册到远程注册中心，这样consumer端才能从注册中心获取到服务的相关信息。**

```java
// url to registry
/*
 * 基于Dubbo SPI机制根据注册中心url加载具体的注册中心操作类，service-discovery-registry对应着ServiceDiscoveryRegistry
 */
final Registry registry = getRegistry(registryUrl);
//获取需要注册的服务url 内部包含服务的ip、port、pid、服务接口、版本、分组、接口内部的方法名等信息
//dubbo://192.168.31.84:20880/org.apache.dubbo.demo.GreetingService?anyhost=true&application=demo-provider&application.version=1&background=false&delay=5000&deprecated=false&dubbo=2.0.2&dynamic=true&generic=false&group=greeting&interface=org.apache.dubbo.demo.GreetingService&methods=hello&pid=10920&revision=1.0.0&service-name-mapping=true&side=provider&timeout=5000&timestamp=1666621305141&version=1.0.0
final URL registeredProviderUrl = getUrlToRegistry(providerUrl, registryUrl);
// decide if we need to delay publish (provider itself and registry should both need to register)
//决定我们是否需要延迟发布(提供者本身和注册中心都需要注册)
boolean register = providerUrl.getParameter(REGISTER_KEY, true) && registryUrl.getParameter(REGISTER_KEY, true);
/*
 * 2 向注册中心注册服务
 */
if (register) {
    register(registry, registeredProviderUrl);
}
```

## 2 getRegistry获取注册表

**Registry是服务注册中心操作类，Registry同样是基于Dubbo SPI机制根据协议查找的，例如service-discovery-registry服务发现协议对应着ServiceDiscoveryRegistry，而registry服务发现协议由于getRegistryUrl方法中就被替换为了真实的协议地址，因此registryUrl可能对应着不同协议，因此Registry的返回也各不相同，例如nacos协议对应着NacosRegistry，zookeeper协议对应着ZookeeperRegistry。**

```java
/**
 * 根据调用者的地址获取注册表的实例
 *
 * @param registryUrl 注册中心url
 * @return 注册表
 */
protected Registry getRegistry(final URL registryUrl) {
    //获取RegistryFactory的自适应实现 RegistryFactory$Adaptive
    RegistryFactory registryFactory = ScopeModelUtil.getExtensionLoader(RegistryFactory.class, registryUrl.getScopeModel()).getAdaptiveExtension();
    //根据url的协议获取对应的RegistryFactory实现，然后调用RegistryFactory实现的getRegistry方法获取注册表
    return registryFactory.getRegistry(registryUrl);
}
```

### 2.1 AbstractRegistryFactory#getRegistry获取注册表

该方法是获取注册表的模版方法，属于AbstractRegistryFactory，该方法中，将会根据url获取注册表缓存key，例如service-discovery-registry://47.94.229.245:2181/org.apache.dubbo.registry.RegistryService，或者zookeeper://47.94.229.245:2181/org.apache.dubbo.registry.RegistryService，然后尝试从registries缓存中根据key获取注册表实例，如果找打就直接返回，否则调用createRegistry方法根据url创建一个注册中心，最后将创建的注册中心存入缓存并返回。

```java
/**
 * AbstractRegistryFactory的方法
 * <p>
 * 获取注册表的模版方法
 *
 * @param url 注册中心url
 */
@Override
public Registry getRegistry(URL url) {
    if (registryManager == null) {
        throw new IllegalStateException("Unable to fetch RegistryManager from ApplicationModel BeanFactory. " +
            "Please check if setApplicationModel has been override.");
    }
    //应用销毁状态的判断
    Registry defaultNopRegistry = registryManager.getDefaultNopRegistryIfDestroyed();
    if (null != defaultNopRegistry) {
        return defaultNopRegistry;
    }
    //添加interface参数值为RegistryService全路径名、移除timestamp参数、移除export、refer属性
    url = URLBuilder.from(url)
        .setPath(RegistryService.class.getName())
        .addParameter(INTERFACE_KEY, RegistryService.class.getName())
        .removeParameter(TIMESTAMP_KEY)
        .removeAttribute(EXPORT_KEY)
        .removeAttribute(REFER_KEY)
        .build();
    //注册表缓存key，例如service-discovery-registry://47.94.229.245:2181/org.apache.dubbo.registry.RegistryService
    String key = createRegistryCacheKey(url);
    Registry registry = null;
    boolean check = url.getParameter(CHECK_KEY, true) && url.getPort() != 0;
    // Lock the registry access process to ensure a single instance of the registry  锁定注册表访问过程，以确保注册表的单个实例
    registryManager.getRegistryLock().lock();
    try {
        // double check
        // fix https://github.com/apache/dubbo/issues/7265.
        defaultNopRegistry = registryManager.getDefaultNopRegistryIfDestroyed();
        if (null != defaultNopRegistry) {
            return defaultNopRegistry;
        }
        //从registries缓存中根据key获取注册表实例
        registry = registryManager.getRegistry(key);
        //如果有就直接返回
        if (registry != null) {
            return registry;
        }
        // create registry by spi/ioc
        //基于url创建注册中心
        registry = createRegistry(url);
        if (check && registry == null) {
            throw new IllegalStateException("Can not create registry " + url);
        }
        //存入缓存
        if (registry != null) {
            registryManager.putRegistry(key, registry);
        }
    } catch (Exception e) {
        if (check) {
            throw new RuntimeException("Can not create registry " + url, e);
        } else {
            // 1-11 Failed to obtain or create registry (service) object.
            LOGGER.warn("1-11", "", "",
                "Failed to obtain or create registry ", e);
        }
    } finally {
        // Release the lock 解锁
        registryManager.getRegistryLock().unlock();
    }
    //返回注册表
    return registry;
}
```

#### 2.1.1 createRegistry创建注册表

在应用级服务注册表ServiceDiscoveryRegistry的创建过程中，此时才会将service-discovery-registry服务发现协议替换为真实的注册中心协议，然后创建一个ServiceDiscoveryRegistry返回。

```java
public class ServiceDiscoveryRegistryFactory extends AbstractRegistryFactory {
    @Override
    protected Registry createRegistry(URL url) {
        //初始的url：service-discovery-registry://xxx.xxx.xxx.xxx:2181/org.apache.dubbo.registry.RegistryService?REGISTRY_CLUSTER=registry1&application=demo-provider&application.version=1&dubbo=2.0.2&interface=org.apache.dubbo.registry.RegistryService&pid=42244&registry=zookeeper&timeout=20001
        if (UrlUtils.hasServiceDiscoveryRegistryProtocol(url)) {
            //获取url的registry参数值，默认dubbo
            String protocol = url.getParameter(REGISTRY_KEY, DEFAULT_REGISTRY);
            //将服务发现协议替换为真实的注册中心协议，并且删除url的registry参数
            url = url.setProtocol(protocol).removeParameter(REGISTRY_KEY);
        }
        //替换后的url zookeeper://xxx.xxx.xxx.xxx:2181/org.apache.dubbo.registry.RegistryService?REGISTRY_CLUSTER=registry1&application=demo-provider&application.version=1&dubbo=2.0.2&interface=org.apache.dubbo.registry.RegistryService&pid=41479&timeout=20001
        return new ServiceDiscoveryRegistry(url, applicationModel);
    }
}
```

对于zookeeper注册中心来说，则是直接创建一个ZookeeperRegistry返回，内部包含了一个zkClient客户端。

```java
@Override
public Registry createRegistry(URL url) {
    return new ZookeeperRegistry(url, zookeeperTransporter);
}
```

常见注册表的关系如下：

### 2.2 ServiceDiscoveryRegistry的构建

**ServiceDiscoveryRegistry的构造器中：**

**1、** 首先会调用父类FailbackRegistry的构造器；

**2、** 然后根据url中的注册中心协议构建一个ServiceDiscovery，例如ZookeeperServiceDiscovery，其包含服务发现的通用操作；

**3、** 最后获取服务名映射MetadataServiceNameMapping，可通过服务接口名查找到对应的服务应用的名字；

```java
public ServiceDiscoveryRegistry(URL registryURL, ApplicationModel applicationModel) {
    //父类构造器
    super(registryURL);
    //根据url中的注册中心协议构建一个ServiceDiscovery，例如ZookeeperServiceDiscovery，其包含服务发现的通用操作
    this.serviceDiscovery = createServiceDiscovery(registryURL);
    //获取服务名映射 MetadataServiceNameMapping，可通过服务接口名查找到对应的服务应用的名字
    this.serviceNameMapping = (AbstractServiceNameMapping) ServiceNameMapping.getDefaultExtension(registryURL.getScopeModel());
    super.applicationModel = applicationModel;
}
```

**FailbackRegistry的构造器如下：**

**1、** 首先会调用父类AbstractRegistry的构造器；

**2、** 然后获取重试时间间隔，取url参数retry.period，默认5000ms；

**3、** 最后创建一个用于失败重试的时间轮因为重试任务不会非常多，一圈128个刻度就足够了；

```java
public FailbackRegistry(URL url) {
    //调用父类AbstractRegistry构造器
    super(url);
    //重试时间间隔，取url参数retry.period，默认5000ms
    this.retryPeriod = url.getParameter(REGISTRY_RETRY_PERIOD_KEY, DEFAULT_REGISTRY_RETRY_PERIOD);
    // since the retry task will not be very much. 128 ticks is enough.
    //用于失败重试的时间轮。因为重试任务不会非常多，一圈128个刻度就足够了。
    retryTimer = new HashedWheelTimer(new NamedThreadFactory("DubboRegistryRetryTimer", true), retryPeriod, TimeUnit.MILLISECONDS, 128);
}
```

**AbstractRegistry**的构造器如下，主要是本地缓存文件的支持以及加载本地缓存。

```java
protected AbstractRegistry(URL url) {
    //设置registryUrl属性
    setUrl(url);
    //获取注册表管理器
    registryManager = url.getOrDefaultApplicationModel().getBeanFactory().getBean(RegistryManager.class);
    //获取url参数file.cache，是否支持本地缓存，默认true
    localCacheEnabled = url.getParameter(REGISTRY_LOCAL_FILE_CACHE_ENABLED, true);
    //获取注册表缓存执行器sharedScheduledExecutor
    registryCacheExecutor = url.getOrDefaultFrameworkModel().getBeanFactory()
        .getBean(FrameworkExecutorRepository.class).getSharedScheduledExecutor();
    //如果支持本地缓存
    if (localCacheEnabled) {
        // Start file save timer
        //获取url参数save.file，是否同步存储，默认false
        syncSaveFile = url.getParameter(REGISTRY_FILESAVE_SYNC_KEY, false);
        //注册中心缓存文件名 /{user.home}/.dubbo/dubbo-registry-{dubbo.application.name}-{ip}-{post}.cache
        String defaultFilename = System.getProperty(USER_HOME) + DUBBO_REGISTRY + url.getApplication() +
            "-" + url.getAddress().replaceAll(":", "-") + CACHE;
        //获取url参数file，指定的文件名，默认defaultFilename
        String filename = url.getParameter(FILE_KEY, defaultFilename);
        File file = null;
        if (ConfigUtils.isNotEmpty(filename)) {
            //创建文件对象
            file = new File(filename);
            //不存在则创建
            if (!file.exists() && file.getParentFile() != null && !file.getParentFile().exists()) {
                if (!file.getParentFile().mkdirs()) {
                    IllegalArgumentException illegalArgumentException = new IllegalArgumentException(
                        "Invalid registry cache file " + file + ", cause: Failed to create directory " + file.getParentFile() + "!");
                    if (logger != null) {
                        // 1-9 failed to read / save registry cache file.
                        logger.error("1-9", "cache directory inaccessible",
                            "Try adjusting permission of the directory.",
                            "failed to create directory", illegalArgumentException);
                    }
                    throw illegalArgumentException;
                }
            }
        }
        this.file = file;
        // When starting the subscription center,
        // we need to read the local cache file for future Registry fault tolerance processing.
        //加载缓存文件内容到properties集合中，方便注册表容错管理
        loadProperties();
        //推送变更
        notify(url.getBackupUrls());
    }
}
```

## 3 register注册服务

**该方法内部实际上是调用registry的register方法完成注册。参数url是注册的服务提供者url，内部包含服务提供者的协议、ip、port、pid、服务接口、版本、分组、接口内部的方法名等信息。**

```java
/**
 * RegistryProtocol的方法
 * <p>
 * 向注册中心注册服务
 *
 * @param registry              服务注册中心操作类，例如service-discovery-registry对应着ServiceDiscoveryRegistry
 * @param registeredProviderUrl 注册的服务提供者url， 内部包含服务的ip、port、pid、服务接口、版本、分组、接口内部的方法名等信息
 */
private void register(Registry registry, URL registeredProviderUrl) {
    //调用registry的register方法完成注册
    registry.register(registeredProviderUrl);
}
```

我们下面来看看接口级和应用级别的服务注册的源码，假设真实注册中心都是zookeeper，此时接口级服务注册使用的真实注册表ZookeeperRegistry，而应用级服务注册使用的是ServiceDiscoveryRegistry，但是url已经变成了真实zookeeper协议的url。

### 3.1 ServiceDiscoveryRegistry应用级服务注册

ServiceDiscoveryRegistry内部最终是调用ServiceDiscovery的register方法完成注册，我们前面就说过，serviceDiscovery中包含服务发现的通用操作。假设注册中心协议为zookeeper，那么serviceDiscovery就是ZookeeperServiceDiscovery。

```java
@Override
public final void register(URL url) {
    //只注册提供者
    if (!shouldRegister(url)) {
      // Should Not Register
        return;
    }
    //执行注册
    doRegister(url);
}
@Override
public void doRegister(URL url) {
    // fixme, add registry-cluster is not necessary anymore
    url = addRegistryClusterKey(url);
    //调用serviceDiscovery的register方法完成注册
    serviceDiscovery.register(url);
}
```

**ZookeeperServiceDiscovery的register方法实际上是AbstractServiceDiscovery的register方法实现，内部调用metadataInfo的addService方法。**

**addService方法会根据服务提供者url创建ServiceInfo并添加到services集合中，随后将url加入到exportedServiceURLs缓存中，最后将更新标识位updated改为true。**

```java
/**
 * AbstractServiceDiscovery的方法
 *
 * @param url  服务提供者url
 */
@Override
public void register(URL url) {
    //根据url添加MetadataInfo
    metadataInfo.addService(url);
}
/**
 * MetadataInfo的方法
 * @param url 服务提供者url
 */
public synchronized void addService(URL url) {
    // fixme, pass in application mode context during initialization of MetadataInfo.
    if (this.loader == null) {
        this.loader = url.getOrDefaultApplicationModel().getExtensionLoader(MetadataParamsFilter.class);
    }
    //元数据参数过滤器
    List<MetadataParamsFilter> filters = loader.getActivateExtension(url, "params-filter");
    // generate service level metadata
    //生成服务级别元数据
    ServiceInfo serviceInfo = new ServiceInfo(url, filters);
    //存入services缓存，mathKey例如：greeting/org.apache.dubbo.demo.GreetingService:1.0.0:dubbo  value是serviceInfo
    this.services.put(serviceInfo.getMatchKey(), serviceInfo);
    // extract common instance level params
    extractInstanceParams(url, filters);
    //初始化exportedServiceURLs
    if (exportedServiceURLs == null) {
        exportedServiceURLs = new ConcurrentSkipListMap<>();
    }
    //加入到exportedServiceURLs缓存，  key例如：greeting/org.apache.dubbo.demo.GreetingService:1.0.0  value是url的SortedSet<URL>集合
    addURL(exportedServiceURLs, url);
    //设置更新标志为true
    updated = true;
}
```

**注意，上面的方法仅仅是将数据发布到内存中，还没有真正的注册到注册中心。那么，应用级服务注册信息什么时候真正的同步到注册中心的呢？**

**实际上在DefaultModuleDeployer#startSync方法中，在经过了exportServices服务导出和referServices服务引用之后的onModuleStarted方法中，此时才会进行应用级服务数据的真正注册。**

**我们这里直接来看看注册后在zookeeper上的数据，可以看到节点路径是应用级数据services/{applicationName}/{ip:port}，每一个应用实例才会注册一个节点，节点类型是临时节点，节点内包括服务名称、id、地址、端口、端口、有效载荷（包含存储元数据）等信息。**

### 3.2 ZookeeperRegistry接口级服务注册

**传统的接口级别服务注册使用注册中心协议本身对应的注册表来实现，例如zookeeper协议将会使用ZookeeperRegistry，而他的register方法实际上调用的父类FailbackRegistry实现的register方法。**

**FailbackRegistry#register方法首先将url加入到registered缓存中，然后从注册失败的缓存failedRegistered中和移除注册失败的缓存failedUnregistered中移除该url。核心方法是调用doRegister方法，向服务器端发送注册请求，该方法由具体的子类实现。**

```java
/**
 * FailbackRegistry的方法
 * 
 * 注册服务提供者url
 */
@Override
public void register(URL url) {
    if (!acceptable(url)) {
        logger.info("URL " + url + " will not be registered to Registry. Registry " + this.getUrl() + " does not accept service of this protocol type.");
        return;
    }
    //调用父类AbstractRegistry的register方法，将url加入到registered缓存中
    super.register(url);
    //从注册失败的缓存failedRegistered中移除该url
    removeFailedRegistered(url);
    //从移除注册失败的缓存failedUnregistered中移除该url
    removeFailedUnregistered(url);
    try {
        // Sending a registration request to the server side
        /*
         * 向服务器端发送注册请求，该方法由具体的子类实现
         */
        doRegister(url);
    } catch (Exception e) {
        Throwable t = e;
        // If the startup detection is opened, the Exception is thrown directly.
        boolean check = getUrl().getParameter(Constants.CHECK_KEY, true)
            && url.getParameter(Constants.CHECK_KEY, true)
            && (url.getPort() != 0);
        boolean skipFailback = t instanceof SkipFailbackWrapperException;
        if (check || skipFailback) {
            if (skipFailback) {
                t = t.getCause();
            }
            throw new IllegalStateException("Failed to register " + url + " to registry " + getUrl().getAddress() + ", cause: " + t.getMessage(), t);
        } else {
            logger.error("Failed to register " + url + ", waiting for retry, cause: " + t.getMessage(), t);
        }
        // Record a failed registration request to a failed list, retry regularly
        addFailedRegistered(url);
    }
}
```

我们来看看ZookeeperRegistry的doRegister方法实现，根据url构建节点路径，/dubbo/{servicePath}/providers/{urlString}，例如： /dubbo/org.apache.dubbo.demo.TripleService/providers/tri%3A%2F%2F192.168.1.7%3A50051%2Forg.apache.dubbo.demo.TripleService%3Fanyhost%3Dtrue%26application%3Ddemo-provider%26application.version%3D1%26background%3Dfalse%26delay%3D5000%26deprecated%3Dfalse%26dubbo%3D2.0.2%26dynamic%3Dtrue%26generic%3Dfalse%26interface%3Dorg.apache.dubbo.demo.TripleService%26methods%3Dhello%26pid%3D2624%26revision%3D1.0.0%26service-name-mapping%3Dtrue%26side%3Dprovider%26timeout%3D5000%26timestamp%3D1666705770994%26version%3D1.0.0，节点的值是服务提供者的节点ip。

注意此节点是一个临时节点，当服务关闭时节点删除，值是服务提供者的节点ip。

```java
/**
 * ZookeeperRegistry的方法
 *
 * 注册接口级别的服务提供者url到zookeeper
 * @param url 服务提供者url
 */
@Override
public void doRegister(URL url) {
    try {
        checkDestroyed();
        //根据url构建节点路径，/dubbo/{servicePath}/providers/{url}
        //例如： /dubbo/org.apache.dubbo.demo.TripleService/providers/tri%3A%2F%2F192.168.1.7%3A50051%2Forg.apache.dubbo.demo.TripleService%3Fanyhost%3Dtrue%26application%3Ddemo-provider%26application.version%3D1%26background%3Dfalse%26delay%3D5000%26deprecated%3Dfalse%26dubbo%3D2.0.2%26dynamic%3Dtrue%26generic%3Dfalse%26interface%3Dorg.apache.dubbo.demo.TripleService%26methods%3Dhello%26pid%3D2624%26revision%3D1.0.0%26service-name-mapping%3Dtrue%26side%3Dprovider%26timeout%3D5000%26timestamp%3D1666705770994%26version%3D1.0.0
        //注意此节点是一个临时节点
        zkClient.create(toUrlPath(url), url.getParameter(DYNAMIC_KEY, true));
    } catch (Throwable e) {
        throw new RpcException("Failed to register " + url + " to zookeeper " + getUrl() + ", cause: " + e.getMessage(), e);
    }
}
```

**对于接口级的服务注册，在zookeeper中的节点样式如下。**

**每个服务的每个接口都有一个单独的url节点，这些url一般来说除了ip和端口不同，其他配置都是相同的，因此存在大量的数据冗余，增加了注册中心的压力，而dubbo3引入的应用级服务注册发现，其目的之一就是解决接口级的服务注册发现的数据冗余问题，后面会讲到。**

## 4 总结

**本次我们学习了在导出远程服务得到Exporter之后，继续通过Registry将其注册到远程注册中心的源码，大概逻辑：**

**基于DubboSPI机制根据注册中心url加载具体的注册中心操作类Registry，应用级服务导出协议service-discovery-registry对应着ServiceDiscoveryRegistry，接口级服务导出协议则会获取真实注册中心协议对应的Registry**；

**通过调用Registry#register方法向远程注册中心注册服务提供者url。对于接口级服务导出协议会直接注册到注册中心，而对于应用级服务导出协议则仅仅是存入到本地内存中，在后面才会将服务信息真正的注册。**

**到这里，我们的Dubbo服务导出过程中的Protocol#export方法的源码就基本学习完毕了（还差一个 exported方法），还记得之前学的内容吗？这个方法实际上是在ServiceConfig#doExportUrl方法中调用的哦！**

**之前的内容忘了也没关系，下一章我们将会学习最后的exported()方法，并且会对Dubbo服务导出的整体源码流程进行一个比较全面的总结。**
