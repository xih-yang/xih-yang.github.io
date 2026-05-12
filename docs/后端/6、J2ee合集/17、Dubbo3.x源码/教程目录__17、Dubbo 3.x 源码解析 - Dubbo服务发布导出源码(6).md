# 17、Dubbo 3.x 源码解析 - Dubbo服务发布导出源码(6)
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/17.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo服务的发布与引用的源码。

此前我们学习了[Dubbo服务发布导出源码(5)](/zhuanlan/j2ee/dubbo/2/16.html)，也就是Dubbo远程服务**在导出远程服务得到Exporter之后，继续通过Registry将其注册到远程注册中心的源码**。

## 1 exported发布服务映射数据

**在ServiceConfig#doExportUrls方法导出服务url到全部注册中心之后，将会调用exported方法（在**[Dubbo服务发布导出源码(1)](/zhuanlan/j2ee/dubbo/2/12.html)**中有介绍）：**

**1、** 该方法会遍历已导出的服务url，判断url中是否包含service-name-mapping属性，当存在应用级注册中心协议时才会在**exportRemote**方法中为url添加该参数；

**2、** 如果存在该属性，那么获取**MetadataServiceNameMapping**，对该服务url调用map方法，**将服务接口到服务名的映射关系发布到远程元数据中心**；

```java
/**
 * ServiceConfig的方法
 * 将服务接口到服务名的映射关系发布到远程元数据中心
 */
protected void exported() {
    exported = true;
    List<URL> exportedURLs = this.getExportedUrls(); //导出的服务url
    exportedURLs.forEach(url -> {
        //如果url中包含service-name-mapping属性，当存在应用级注册中心协议时才会在exportRemote方法中为url添加该参数
        if (url.getParameters().containsKey(SERVICE_NAME_MAPPING_KEY)) {
            //获取MetadataServiceNameMapping
            ServiceNameMapping serviceNameMapping = ServiceNameMapping.getDefaultExtension(getScopeModel());
            try {
                //将服务接口到服务名的映射关系发布到远程元数据中心
                boolean succeeded = serviceNameMapping.map(url);
                if (succeeded) {
                    logger.info("Successfully registered interface application mapping for service " + url.getServiceKey());
                } else {
                    logger.error("5-10", "configuration server disconnected", "", "Failed register interface application mapping for service " + url.getServiceKey());
                }
            } catch (Exception e) {
                logger.error("5-10", "configuration server disconnected", "", "Failed register interface application mapping for service " + url.getServiceKey(), e);
            }
        }
    });
    onExported();
}
```

### 1.1 MetadataServiceNameMapping元数据映射

**MetadataServiceNameMapping是服务接口到对应的服务应用名的映射关系的维护类，也被称作服务映射，这在consumer应用级服务发现的时候很有用。**

```java
public MetadataServiceNameMapping(ApplicationModel applicationModel) {
    //父类AbstractServiceNameMapping构造器
    super(applicationModel);
    //元数据中心MetadataReport实例的存储库实例
    metadataReportInstance = applicationModel.getBeanFactory().getBean(MetadataReportInstance.class);
}
```

父类AbstractServiceNameMapping构造器如下，映射数据支持本地缓存

```java
public AbstractServiceNameMapping(ApplicationModel applicationModel) {
    this.applicationModel = applicationModel;
    //本地mapping文件缓存支持
    boolean enableFileCache = true;
    //取ApplicationConfig的file.cache属性，默认true，但Dubbo3.1版本似乎没设置默认值，导致无法本地缓存
    Optional<ApplicationConfig> application = applicationModel.getApplicationConfigManager().getApplication();
    if(application.isPresent()) {
        enableFileCache = Boolean.TRUE.equals(application.get().getEnableFileCache()) ? true : false;
    }
    //映射元数据缓存管理器
    //内部有一个Dubbo实现的LUR缓存，默认最多10000个mapping缓存，原理是很简单的继承LinkedHashMap的方式
    this.mappingCacheManager = new MappingCacheManager(enableFileCache,
        applicationModel.tryGetApplicationName(),
        applicationModel.getFrameworkModel().getBeanFactory()
        .getBean(FrameworkExecutorRepository.class).getCacheRefreshingScheduledExecutor());
}
```

#### 1.2.1 MappingCacheManager

MappingCacheManager的构造器如下，将会获取本地缓存文件的各种信息，然后调用init方法初始化：

```java
/**
 * MappingCacheManager的构造器
 *
 * @param enableFileCache 是否支持本地文件缓存
 * @param name 缓存文件名，默认ApplicationNam
 * @param executorService 将基于文件的缓存从内存刷新到磁盘的执行器cacheRefreshingScheduledExecutor
 */
public MappingCacheManager(boolean enableFileCache, String name, ScheduledExecutorService executorService) {
    //从来自JVM环境变量中的配置
    String filePath = System.getProperty("dubbo.mapping.cache.filePath");
    String fileName = System.getProperty("dubbo.mapping.cache.fileName");
    //默认文件名.mapping
    if (StringUtils.isEmpty(fileName)) {
        fileName = DEFAULT_FILE_NAME;
    }
    //.mapping.{dubbo.application.name}
    if (StringUtils.isNotEmpty(name)) {
        fileName = fileName + "." + name;
    }
    //本地缓存映射最大数量
    String rawEntrySize = System.getProperty("dubbo.mapping.cache.entrySize");
    int entrySize = StringUtils.parseInteger(rawEntrySize);
    entrySize = (entrySize == 0 ? DEFAULT_ENTRY_SIZE : entrySize);
    //文件最大大小
    String rawMaxFileSize = System.getProperty("dubbo.mapping.cache.maxFileSize");
    long maxFileSize = StringUtils.parseLong(rawMaxFileSize);
    //初始化
    init(enableFileCache, filePath, fileName, entrySize,  maxFileSize, 50, executorService);
}
```

#### 1.2.2 AbstractCacheManager

AbstractCacheManager的init方法如下：

**1、** 初始化一个Dubbo实现的LUR缓存，默认最多10000个mapping缓存，原理是很简单的继承LinkedHashMap的方式；

**2、** 构建文件缓存服务，启动定时调度任务执行mapping缓存刷盘操作；

```java
/**
 * AbstractCacheManager的方法
 *
 * @param enableFileCache 是否支持本地文件缓存
 * @param filePath 文件路径
 * @param fileName 文件名
 * @param entrySize 缓存映射最大数量，默认10000
 * @param fileSize 文件最大大小
 * @param interval 调度任务间隔时间
 * @param executorService 文件持久化调度任务执行器
 */
protected void init(boolean enableFileCache, String filePath, String fileName, int entrySize, long fileSize, int interval, ScheduledExecutorService executorService) {
    //Dubbo实现的LUR缓存，默认最多10000个mapping缓存，原理是很简单的继承LinkedHashMap的方式
    this.cache = new LRUCache<>(entrySize);
    try {
        //缓存存储服务
        cacheStore = FileCacheStoreFactory.getInstance(filePath, fileName, enableFileCache);
        Map<String, String> properties = cacheStore.loadCache(entrySize);
        logger.info("Successfully loaded " + getName() + " cache from file " + fileName + ", entries " + properties.size());
        for (Map.Entry<String, String> entry : properties.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            this.cache.put(key, toValueType(value));
        }
        // executorService can be empty if FileCacheStore fails
        if (executorService == null) {
            this.executorService = Executors.newSingleThreadScheduledExecutor(new NamedThreadFactory("Dubbo-cache-refreshing-scheduler", true));
        } else {
            this.executorService = executorService;
        }
        //缓存刷新调度任务
        this.executorService.scheduleWithFixedDelay(new CacheRefreshTask<>(this.cacheStore, this.cache, this, fileSize), 10, interval, TimeUnit.MINUTES);
    } catch (Exception e) {
        logger.error("Load mapping from local cache file error ", e);
    }
}
```

### 1.2 map构建服务映射关系

**MetadataServiceNameMapping的map方法，将服务接口到服务名的映射关系发布到所有远程元数据中心，对于zookeeper元数据中心来说，每一个服务接口都对应一个节点，节点路径为dubbo/mapping/{serviceInterface}，值就是该接口所在的服务应用名，也就是dubbo.applicaation.name。**

```java
/**
 * MetadataServiceNameMapping的方法
 * <p>
 * Simply register to all metadata center
 * 将服务接口到服务名的映射关系发布到所有远程元数据中心
 */
@Override
public boolean map(URL url) {
    if (CollectionUtils.isEmpty(applicationModel.getApplicationConfigManager().getMetadataConfigs())) {
        logger.warn("No valid metadata config center found for mapping report.");
        return false;
    }
    //服务接口全部路径名
    String serviceInterface = url.getServiceInterface();  
    if (IGNORED_SERVICE_INTERFACES.contains(serviceInterface)) {
        return true;
    }
    boolean result = true;
    for (Map.Entry<String, MetadataReport> entry : metadataReportInstance.getMetadataReports(true).entrySet()) {
        MetadataReport metadataReport = entry.getValue();
        String appName = applicationModel.getApplicationName();
        try {
            //MetadataReport支持直接注册服务-应用程序映射，该方法目前版本默认返回false
            if (metadataReport.registerServiceAppMapping(serviceInterface, appName, url)) {
                // MetadataReport support directly register service-app mapping
                continue;
            }
            boolean succeeded;
            //当前重试次数，最多6次
            int currentRetryTimes = 1;
            String newConfigContent = appName;
            do {
                //尝试根据服务名获取已存在的映射项，对于ZookeeperMetadataReport来说，就是获取 mapping/{serviceInterface} 这个节点的值
                ConfigItem configItem = metadataReport.getConfigItem(serviceInterface, DEFAULT_MAPPING_GROUP);
                String oldConfigContent = configItem.getContent();
                if (StringUtils.isNotEmpty(oldConfigContent)) {
                    //如果此前映射包含了当前appName，那么算作成功
                    boolean contains = StringUtils.isContains(oldConfigContent, appName);
                    if (contains) {
                        // From the user's perspective, it means successful when the oldConfigContent has contained the current appName. So we should not throw an Exception to user, it will confuse the user.
                        succeeded = true;
                        break;
                    }
                    //否则，旧的appName和新的appName通过 , 拼接起来
                    newConfigContent = oldConfigContent + COMMA_SEPARATOR + appName;
                }
                //尝试创建或者更新映射关系，对于ZookeeperMetadataReport来说，就是创建或者更新 mapping/{serviceInterface} 这个节点
                succeeded = metadataReport.registerServiceAppMapping(serviceInterface, DEFAULT_MAPPING_GROUP, newConfigContent, configItem.getTicket());
            } while (!succeeded && currentRetryTimes++ <= CAS_RETRY_TIMES);
            if (!succeeded) {
                result = false;
            }
        } catch (Exception e) {
            result = false;
            logger.warn("Failed registering mapping to remote." + metadataReport, e);
        }
    }
    return result;
}
```

**zookeeper中的服务映射关系节点如下：**

**有了服务映射，那么就能通过服务接口来查询对应的服务应用名了，然后继续根据服务名获取服务实例信息，这在Dubbo 3.x 之后consumer应用级服务发现的时候很有用。**

## 2 Dubbo服务发布导出总结

### 2.1 整体流程

到此，我们基本学习了Dubbo服务发布的全流程（除了**应用级服务数据的远程注册**之外，这个后面单独讲），现在我们来梳理一下整体流程，注意下面的流程非常的常，但是如果你能看完这些流程，那么我相信你在面试的时候也能够比较简单的说出重点出来：

首先是Dubbo服务发布的入口，**在Dubbo 3.1中**，它位于监听器**DubboDeployApplicationListener#onApplicationEvent**方法中，**在spring容器启动的最后一个步也就是refresh方法内部最后的finishRefresh方法中，将会向所有监听器发布一个ContextRefreshedEvent事件，表示容器刷新完毕，此时就会触发这个方法的调用**。

**onApplicationEvent方法内部通过DefaultModuleDeployer#start方法开启服务的导出、引用等操作，最终在startSync方法内部的exportServices方法中，将会获取全部的dubbo服务bean实例ServiceConfigBase，然后依次调用exportServiceInternal方法进行导出。**

**exportServiceInternal**方法中会判断是否开启了异步导出，如果开启了那么使用线程池导出，**默认没开启**，那么就走同步导出通过服务**ServiceConfig本身的export方法执行导出**，对于已导出的服务将会加入**exportedServices**列表中；

在**ServiceConfigBase#export**方法中，会判断是否需要**延迟导出服务**，也就是**delay**属性，如果不需要那么**立即执行doExport方法**导出服务，否则获取服务导出线程池，**异步的执行doExport方法**导出服务，延迟时间为配置的delay毫秒。**默认立即导出。**

在**doExport**方法中包含服务导出的骨干逻辑：**首先通过doExportUrls方法导出服务url到全部注册中心，这是核心方法导出服务url之后，调用exported方法尝将服务接口到服务名的映射关系发布到远程元数据中心，这是Dubbo3应用级服务注册发现所必须的步骤**；

**doExportUrls**方法中，首先构建并注册对应服务的**serviceDescriptor**、**providerModel**，然后通过**loadRegistries**加载全部的注册中心url地址信息，最后遍历当前服务接口支持的协议，依次调用**doExportUrlsFor1Protocol**方法，尝试将每个协议向多个注册中心url进行服务导出；

**loadRegistries**方法用于加载注册中心url地址，获取全部注册中心配置集合，然后对每个注册中心的配置拼接好注册中心url，协议将被改写为注册中心协议。

**在Dubbo3.1版本中，如果url没有特殊参数，那么默认情况下，每个注册中心都会生成两个注册中心协议url，一个service-discovery-registry开头的协议表示服务级别发现注册中心，一个registry开头的协议表示接口级别发现注册中心。也就是说，服务将会同时进行接口级别和服务级别的注册。**

**doExportUrlsFor1Protocol**方法中，会根据协议参数和当前服务元数据，构建出一个服务导出协议url，然后调用**exportUrl**方法继续导出。

**exportUrl**方法中，获取**scope**属性判断服务导出的范围，**none代表不导出、local仅导出到本地JVM、remote会导出到远程**，默认为null，表示会同时导出到本地JVM和远程，分别调用exportLocal和exportRemote方法。在远程导出完毕之后，还会调用**MetadataUtils#publishServiceDefinition**方法发布服务元数据信息。

**exportLocal 方法用于本地导出**，用不上注册中心协议url，主要用于本jvm的消费者调用本jvm上的服务提供者，不涉及远程网络调用。

将服务导出协议url改写为injvm协议的url，ip地址固定为127.0.0.1，端口为0。可以看到所谓的本地导出，没有监听端口，没有远程调用，但是仍然会走dubbo的Filter和Listener。随后调用doExportUrl方法执行协议导出。

**exportRemote方法用于远程导出**，涉及到服务注册、启动服务端nettyserver等逻辑，用于远程网络调用。

遍历全部注册中心协议url添加参数，例如如果是应用级注册中心，那么为url添加**service-name-mapping=true**参数。

在注册中心协议url内部的attributes中添加属性，key为export，value为服务导出协议url，随后调用**doExportUrl**方法执行协议导出。

**在doExportUrls方法导出服务url到全部注册中心之后，将会调用exported方法**；

**该方法会遍历已导出的服务url，判断url中是否包含service-name-mapping属性，当存在应用级注册中心协议时才会在exportRemote方法中为url添加该参数。**

如果存在该属性，那么获取MetadataServiceNameMapping，对该服务url调用map方法，将服务接口到服务名的映射关系发布到远程元数据中心。

**在zookeeper元数据中心，对应的映射节点目录为：dubbo/mapping/{serviceInterface}，节点值就是该接口所在的服务应用名，也就是dubbo.applicaation.name。**

**exportLocal 和exportRemote方法最终都会调用doExportUrl方法，该方法是服务导出的核心方法，也是面试常回答的地方：**

**首先通过代理服务工厂proxyFactory#getInvoker方法将ref、interfaceClass、url包装成一个Invoker可执行体实例，Invoker可以统一调用方式，屏蔽调用细节**。

**这里的proxyFactory是ProxyFactory的自适应扩展实现，即ProxyFactory$Adaptive，也就是说会根据传入的url中的参数proxy的值选择对应的代理工厂实现类，而默认实现就是JavassistProxyFactory**；

**JavassistProxyFactory将会利用javassist动态创建了Class对应的Wrapper对象，动态生成的Wrapper类改写invokeMethod方法，其内部会被改写为根据接口方法名和参数直接调用ref对应名字的方法，避免通过Jdk的反射调用方法带来的性能问题。**

**然后创建一个AbstractProxyInvoker匿名实现类对象返回，重写了doInvoke方法，内部实际调用的wrapper#invokeMethod方法。**

**获取到可执行对象Invoker之后，通过协议protocolSPI对invoker进行服务导出，获取Exporter实例，然后将exporter加入到exporters缓存集合中**；

**这里的protocolSPI是Protocol的自适应扩展实现，即Protocol$Adaptive，也就是说会根据传入的url中的protocol选择对应的ProtocolSPI实现类，而默认实现就是dubbo协议，即DubboProtocol本地导出的injvm协议对应InjvmProtocol，需要导出到接口级注册中心的registry对应InterfaceCompatibleRegistryProtocol，需要导出到应用级注册中心的service-discovery-registry对应RegistryProtocol**；

**由于DubboSPIwrapper机制的存在，返回的Protocol就经过了几层的wrapper的包装Dubbo3.1默认经过了三层包装，即ProtocolSerializationWrapper->ProtocolFilterWrapper->ProtocolListenerWrapper->具体的Protocol实现**；

1. **ProtocolSerializationWrapper**会将导出的服务url存入FrameworkServiceRepository仓库内部的providerUrlsWithoutGroup缓存中。
2. **ProtocolFilterWrapper**将会为Invoker添加各种Filter，形成InvokerChain。
3. **ProtocolListenerWrapper**将返回的Exporter包装为ListenerExporterWrapper，内部包含了一个Invoker和一个监听器列表。
4. **当获取到经过包装的Protocol之后，将会调用Protocol#export方法进行服务的导出。**

对于本地导出，也就是**InjvmProtocol**，本地导出并没有涉及到注册中心以及网络服务器，它仅仅是基于Invoer构建一个**InjvmExporter**，并且存入到exporterMap这个缓存map集合中，key构成规则为{group}/{serviceInterfaceName}:{version}:{port}。后续调用时，将会从**exporterMap**找到**Exporter**，然后找到**Invoker**进行调用。

**对于远程导出就比较复杂，包括接口级注册中心的registry对应InterfaceCompatibleRegistryProtocol，应用级注册中心的service-discovery-registry对应RegistryProtocol大概步骤如下：**；

**需要从注册中心url的attributes属性中，获取真实的服务导出url，然后调用doLocalExport方法进行服务导出，该方法内部实际上就是重复前面的Protocol$Adaptive#export的过程。**

**此时，将会调用真实协议对应的Protocol实现，例如dubbo协议对应着DubboProtocol，而在这些协议的export方法中，除了构建Exportor加入exporterMap缓存之外，还会调用openServer方法，开启一个服务提供者端服务器，监听端口，这样就能接收consumer的远程调用请求。**

**同ip同端口（同一个dubbo服务端）的Dubbo应用中，多个Dubbo Service将会使用同一个服务器，即只有在第一次调用openServer的时候才会创建服务器。ip就是服务器的ip，端口就是20880端口。**

**创建服务器的时候，默认使用netty作为底层通信库，即创建一个netty服务端。**

**然后基于Dubbo SPI机制根据注册中心url加载具体的注册中心操作类Registry，应用级服务导出协议service-discovery-registry对应着ServiceDiscoveryRegistry，接口级服务导出协议则会获取真实注册中心协议对应的Registry。**

**通过调用Registry#register方法向远程注册中心注册服务提供者url。对于接口级服务导出协议会直接注册到注册中心，而对于应用级服务导出协议则仅仅是存入到本地内存中，在后面才会将服务信息真正的注册（DefaultModuleDeployer#startSync方法最后的onModuleStarted方法中）。**

将Exporter包装为一个DestroyableExporter返回。

### 2.2 简化流程

**1、****首先是Dubbo服务发布的入口，在spring容器启动的最后一个步也就是refresh方法内部最后的finishRefresh方法中，将会向所有监听器发布一个ContextRefreshedEvent事件，表示容器刷新完毕在Dubbo3.1中，有个监听器DubboDeployApplicationListener，能监听该事件，在监听到该事件之后的onApplicationEvent方法中，会触发服务的导出和引用这就是入口然后遍历所有的Dubbo服务实例ServiceConfigBase，一次导出**；

**2、****调用loadRegistries方法获取所有注册中心配置，组装成服务注册协议url在Dubbo3.1中，默认一个注册中心配置将会构建出两条服务注册协议url，service-discovery-registry协议表示服务级别发现注册中心，registry协议表示接口级别发现注册中心**；

**3、****遍历当前服务支持的协议，对于每个协议都尝试注册到所有注册中心url上调用doExportUrlsFor1Protocol方法根据协议和服务元数据构建服务导出url，后续开始进行exportLocal本地导出和exportRemote远程导出，默认都会导出所谓本地导出，就是本jvm的消费者调用本jvm上的服务提供者，不需要通络通信远程导出自然就是服务于不同应用之间的通信了**；

**1、****通过proxyFactory.getInvoker方法构建Invoker，提供了统一的调用入口，屏蔽底层细节Invoker内部封装了ref，即服务接口的实现，同时默认基于javassist动态构建wrapper来避免反射的调用，提升性能**；

**2、****基于协议获取Protocol，然后调用export方法进行服务导出得到Exporter，Exporter中包装了Filter过滤器、Listener监听器等逻辑，得到Exporter后会存入exporterMap这个缓存map中，后续可以查找到**；

**3、****首次远程服务导出的时候，还会创建服务器，默认使用netty作为底层通信库，创建了服务器之后会启动绑定ip和端口，例如20880端口，此时可以监听远程请求这是远程导出才会有的逻辑**；

**4、****获取注册中心协议获取操作类Registry，通过调用register方法向远程注册中心注册服务提供者url信息这是远程导出才会有的逻辑**；

### 2.3 总结

**Protocol、Invoker和Exporter属于远程调用层（Protocol）：封将RPC调用，以Invocation和Result为中心，扩展接口为Protocol、Invoker和Exporter。**

**1、****Protocol是服务域，它是Invoker暴露和引用的主功能入口，它负责Invoker的生命周期管理**；

**2、****Invoker是实体域，它是Dubbo的核心模型，其它模型都向它靠扰，或转换成它，它代表一个可执行体，可向它发起invoke调用，它有可能是一个本地的实现，也可能是一个远程的实现，也可能一个集群实现**；

**3、****Exporter内部封装了Invoker，并且给予DubboSPIwrapper机制，封装了Filter和lister**；

**为什么创建Invoker？**

**Invoker对象实际上是一个动态创建的AbstractProxyInvoker匿名实现类对象，内部包含了ref，也就是服务接口的实现类对象，ref内部封装了真正的服务调用逻辑，同时它invoke方法，可以基于方法名、参数类型、参数列表调用接口方法，所有的服务都可以基于此方法进行方法调用，这样就提供了统一的调用入口，屏蔽了底层调用细节。**

**同时它的doInvoke方法，内部实际调用的基于javassist动态创建的Wrapper对象的invokeMethod方法，避免了反射调用方法的开销。**

**最后，我们的Dubbo服务发布导出源码终于基本学习完了，实际上学习的入口就是在DefaultModuleDeployer#startSync方法中的exportServices服务导出方法。之后会继续调用referServices方法进行服务引用，而在之后的onModuleStarted方法中，此时才会进行应用级服务数据的真正远程注册。**

**后续我们将学习referServices方法，也就是Dubbo 3.x 的服务引用的源码。**
