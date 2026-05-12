# 09、Dubbo 3.x 源码解析 - Dubbo启动元数据中心源码
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/9.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo启动元数据中心源码。

**此前我们学习了Dubbo应用程序发布器DefaultApplicationDeployer#initialize方法部分源码，该方法完成**[启动配置中心按照优先级加载配置](/zhuanlan/j2ee/dubbo/2/8.html)**等工作，在最后会启动Dubbo元数据中心。**

## 1 DefaultApplicationDeployer#startMetadataCenter启动元数据中心

关于Dubbo中的元数据中心，可以看看官方的介绍：[https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/metadata-center/](https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/metadata-center/)。

元数据中心为 Dubbo 中的两类元数据提供了存取能力：

**1、****地址发现元数据**；

**1、****‘接口-应用’映射关系**；

**2、****接口配置数据**；

**2、****服务运维元数据**；

**1、****接口定义描述数据**；

**2、****消费者订阅关系数据**；

**Dubbo2采用接口级别的服务发现和服务注册，注册中心存储中接口-实例的关系，而Dubbo3采用应用级别的服务发现和服务注册，注册中心则是存储着应用-实例的关系。**

但是Dubbo Consumer 中只声明了要消费的接口列表，如果采用Dubbo3部署，那么Consumer 需要能够将接口转换为 Provider 应用名才能进行精准服务订阅，因此，Dubbo提供了元数据中心，并在其中存储着接口-应用的对应关系。**

startMetadataCenter方法的大概步骤为：

**1、****调用useRegistryAsMetadataCenterIfNecessary方法，出于兼容性的考虑，当没有显式指定元数据中心且registryConfig的useAsConfigCenter为null或true时，使用registry作为默认配置中心**；

**2、****获取获取元数据中心MetadataReport实例的存储库实例MetadataReportInstance，通过其init方法初始化全部元数据配置中心**；

**metadataType：应用级服务发现 metadata 传递方式，是以 Provider 视角而言的，Consumer 侧配置无效，默认值local。可选值有：**

**1、****remote-Provider把metadata放到远端注册中心，Consumer从注册中心获取；**；

**2、****local-Provider把metadata放在本地，Consumer从Provider处直接获取；**；

```java
/**
 * DefaultApplicationDeployer的方法
 * <p>
 * 启动元数据中心
 */
private void startMetadataCenter() {
    /*
     * 1 出于兼容性的考虑，当没有显式指定元数据中心且registryConfig的useAsConfigCenter为null或true时，使用registry作为默认配置中心
     */
    useRegistryAsMetadataCenterIfNecessary();
    ApplicationConfig applicationConfig = getApplication();
    //元数据类型，local 或 remote，选择远程时，需要进一步指定元数据中心。
    String metadataType = applicationConfig.getMetadataType();
    // FIXME, multiple metadata config support.
    //获取元数据配置
    Collection<MetadataReportConfig> metadataReportConfigs = configManager.getMetadataConfigs();
    //如果没有元数据配置，并且元数据类型为remote，那么抛出异常，否则直接返回
    if (CollectionUtils.isEmpty(metadataReportConfigs)) {
        if (REMOTE_METADATA_STORAGE_TYPE.equals(metadataType)) {
            throw new IllegalStateException("No MetadataConfig found, Metadata Center address is required when 'metadata=remote' is enabled.");
        }
        return;
    }
    //获取元数据中心MetadataReport实例的存储库实例，该实例在MetadataScopeModelInitializer#initializeApplicationModel方法中注册
    //MetadataReport实例是在deploy.start()开始时初始化的，需要与元数据服务器交互的组件使用它。
    //如果需要声明多个MetadataReport和注册中心，建议将每个MetadataReport和注册中心组在一起，给它们相同的id，例如：
    //<dubbo:registry id=demo1 address="registry://"/>
    //<dubbo:metadata id=demo1 address="metadata://"/>
    //<dubbo:registry id=demo2 address="registry://"/>
    //<dubbo:metadata id=demo2 address="metadata://"/>
    MetadataReportInstance metadataReportInstance = applicationModel.getBeanFactory().getBean(MetadataReportInstance.class);
    //校验元数据配置
    List<MetadataReportConfig> validMetadataReportConfigs = new ArrayList<>(metadataReportConfigs.size());
    for (MetadataReportConfig metadataReportConfig : metadataReportConfigs) {
        ConfigValidationUtils.validateMetadataConfig(metadataReportConfig);
        validMetadataReportConfigs.add(metadataReportConfig);
    }
    /*
     * 2 初始化全部元数据配置中心
     */
    metadataReportInstance.init(validMetadataReportConfigs);
    //初始化失败则抛出异常
    if (!metadataReportInstance.inited()) {
        throw new IllegalStateException(String.format("%s MetadataConfigs found, but none of them is valid.", metadataReportConfigs.size()));
    }
}
```

## 2 useRegistryAsMetadataCenterIfNecessary元数据中心兼容

**出于兼容性的考虑，当没有显式指定元数据中心且registryConfig的useAsMetadataCenter为null或true时，使用registry作为默认配置中心。该方法和useRegistryAsConfigCenterIfNecessary方法差不多。大概逻辑为：**

**1、** 如果配置管理器中有元数据中心的配置，直接返回；

**2、** 调用getDefaultRegistries方法，获取默认注册中心配置，如果registryConfig的isDefault为true或null，则表示默认注册中心遍历默认的注册中心：；

**3、** 调用isUsedRegistryAsMetadataCenter方法，判断该注册中心可以作为元数据中心，如果useAsMetadataCenter属性为true或者该注册中心协议有对于该中心的扩展类型的实现类，那么就可以作为配置中心；

**4、** 调用registryAsMetadataCenter方法，注册中心转元数据中心，注册中心的配置属性作为元数据中心的配置属性；

**5、** 将元数据中心的配置实例添加到configManager的configsCache缓存；

```java
/**
 * DefaultApplicationDeployer的方法
 * <p>
 * 出于兼容性的考虑，当没有显式指定元数据中心且registryConfig的useAsMetadataCenter为null或true时，使用registry作为默认配置中心
 */
private void useRegistryAsMetadataCenterIfNecessary() {
    //如果配置管理器中有元数据中心的配置，直接返回
    Collection<MetadataReportConfig> metadataConfigs = configManager.getMetadataConfigs();
    if (CollectionUtils.isNotEmpty(metadataConfigs)) {
        return;
    }
    //获取默认注册中心配置，如果registryConfig的isDefault为null或true，则表示默认注册中心
    List<RegistryConfig> defaultRegistries = configManager.getDefaultRegistries();
    if (defaultRegistries.size() > 0) {
        defaultRegistries
            .stream()
            //如果该注册中心可以作为元数据中心，useAsMetadataCenter为null或true
            .filter(this::isUsedRegistryAsMetadataCenter)
            //注册中心的配置属性作为元数据中心的配置属性
            .map(this::registryAsMetadataCenter)
            .forEach(metadataReportConfig -> {
                if (metadataReportConfig.getId() == null) {
                    Collection<MetadataReportConfig> metadataReportConfigs = configManager.getMetadataConfigs();
                    if (CollectionUtils.isNotEmpty(metadataReportConfigs)) {
                        for (MetadataReportConfig existedConfig : metadataReportConfigs) {
                            if (existedConfig.getId() == null && existedConfig.getAddress().equals(metadataReportConfig.getAddress())) {
                                return;
                            }
                        }
                    }
                    //添加配置到configManager的configsCache缓存
                    configManager.addMetadataReport(metadataReportConfig);
                } else {
                    //根据此id或者name获取已存在的元数据配置，如果存在则直接返回，否则添加到缓存中
                    Optional<MetadataReportConfig> configOptional = configManager.getConfig(MetadataReportConfig.class, metadataReportConfig.getId());
                    if (configOptional.isPresent()) {
                        return;
                    }
                    //添加配置到configManager的configsCache缓存
                    configManager.addMetadataReport(metadataReportConfig);
                }
                logger.info("use registry as metadata-center: " + metadataReportConfig);
            });
    }
}
```

## 3 init初始化元数据中心

在获取到全部元数据中心配置之后，调用metadataReportInstance#init方法对他们进行初始化。其内部先基于Dubbo SPI机制获取MetadataReportFactory的适配器类的实现，即MetadataReportFactory`$`Adaptive，然后依次调用**内部的init方法**初始化全部的元数据中心。

**内部的init方法**的大概步骤为：

**1、** 首先组装组装元数据中心远程url地址，包括各种参数，最终地址类似于：zookeeper://127.0.0.1:2181?application=demo-provider&client=&file.cache=null&port=2181&protocol=zookeeper&registry-type=service&registry.type=service&timeout=20001；

2. 随后调用MetadataReportFactoryKaTeX parse error: Expected 'EOF', got '#' at position 9: Adaptive#̲getMetadataRepo…Adaptive可以看作是MetadataReportFactory的适配器类，其内部实际上是调用各种协议对应的真正的MetadataReportFactory实现的getMetadataReport方法来完成对于不用协议的解析。例如例如zookeeper协议，对应着ZookeeperMetadataReportFactory。

```java
/**
 * MetadataReportInstance的方法
 * <p>
 * 初始化全部的元数据配置列表
 *
 * @param metadataReportConfigs 元数据配置列表
 */
public void init(List<MetadataReportConfig> metadataReportConfigs) {
    //CAS保证只初始化一次
    if (!init.compareAndSet(false, true)) {
        return;
    }
    //元数据类型，local 或 remote，选择远程时，需要进一步指定元数据中心。
    this.metadataType = applicationModel.getApplicationConfigManager().getApplicationOrElseThrow().getMetadataType();
    //如果为null，则默认local
    if (metadataType == null) {
        this.metadataType = DEFAULT_METADATA_STORAGE_TYPE;
    }
    //基于Dubbo SPI机制获取MetadataReportFactory的适配器类的实现，即MetadataReportFactory$Adaptive
    MetadataReportFactory metadataReportFactory = applicationModel.getExtensionLoader(MetadataReportFactory.class).getAdaptiveExtension();
    /*
     * 依次初始化全部的元数据中心
     */
    for (MetadataReportConfig metadataReportConfig : metadataReportConfigs) {
        init(metadataReportConfig, metadataReportFactory);
    }
}
    /**
     * MetadataReportInstance的方法
     * <p>
     * 初始化指定的元数据中心
     *
     * @param config                元数据中心配置
     * @param metadataReportFactory 元数据中心工厂
     */
    private void init(MetadataReportConfig config, MetadataReportFactory metadataReportFactory) {
        //组装元数据中心远程url地址
        URL url = config.toUrl();
        //metadata协议
        if (METADATA_REPORT_KEY.equals(url.getProtocol())) {
            String protocol = url.getParameter(METADATA_REPORT_KEY, DEFAULT_DIRECTORY);
            url = URLBuilder.from(url)
                .setProtocol(protocol)
                .setScopeModel(config.getScopeModel())
                .removeParameter(METADATA_REPORT_KEY)
                .build();
        }
        //如果存在application.name属性，那么设置到url的application属性
        url = url.addParameterIfAbsent(APPLICATION_KEY, applicationModel.getCurrentConfig().getName());
        //是否支持元数据本地缓存，默认为true，file.cache属性，但Dubbo3.1版本似乎没设置默认值，导致无法本地缓存
        url = url.addParameterIfAbsent(REGISTRY_LOCAL_FILE_CACHE_ENABLED, String.valueOf(applicationModel.getCurrentConfig().getEnableFileCache()));
        //id
        String relatedRegistryId = isEmpty(config.getRegistry()) ? (isEmpty(config.getId()) ? DEFAULT_KEY : config.getId()) : config.getRegistry();
//        RegistryConfig registryConfig = applicationModel.getConfigManager().getRegistry(relatedRegistryId)
//                .orElseThrow(() -> new IllegalStateException("Registry id " + relatedRegistryId + " does not exist."));
        //从元数据工厂中根据元数据配置，或者元数据中心实例MetadataReport
        //MetadataReportFactory$Adaptive内部实际上调用不同的协议对应的真正的元数据工厂类的getMetadataReport方法
        //例如zookeeper协议，对应着ZookeeperMetadataReportFactory
        MetadataReport metadataReport = metadataReportFactory.getMetadataReport(url);
        if (metadataReport != null) {
            //存入metadataReports缓存
            metadataReports.put(relatedRegistryId, metadataReport);
        }
    }
```

### 3.1 getMetadataReport获取元数据

MetadataReportFactory的getMetadataReport方法实际上由抽象父类AbstractMetadataReportFactory实现。大概步骤为：

**1、** 添加path组装最终url，例如：zookeeper://127.0.0.1:2181/org.apache.dubbo.metadata.report.MetadataReport?application=demo-provider&client=&file.cache=null&port=2181&protocol=zookeeper&registry-type=service&registry.type=service&timeout=20001；

**2、** 获取缓存key，元数据将会被缓存到本地AbstractMetadataReportFactory的serviceStoreMap中，下次获取时直接返回即可缓存key例如：zookeeper://127.0.0.1:2181/org.apache.dubbo.metadata.report.MetadataReport；

**3、** 加锁再次从缓存获取，没有则调用createMetadataReport方法创建MetadataReport这是一个双重校验锁；

**1、** createMetadataReport方法由各个元数据中心工厂实现类自己实现，例如zookeeper作为元数据中心时，他的元数据中心工厂为ZookeeperMetadataReportFactory，createMetadataReport方法将会创建并返回一个ZookeeperMetadataReport；

**2、** 在ZookeeperMetadataReport构造器中，将会连接zookeeper服务端并持有一个zkClient，还会加载本地缓存文件，设置定时同步元数据等等；

**4、** 将获取到的结果加入serviceStoreMap缓存；

```java
/**
 * AbstractMetadataReportFactory的方法
 *
 * 获取元数据
 * @param url url
 */
@Override
public MetadataReport getMetadataReport(URL url) {
    //组装最终url，zookeeper://127.0.0.1:2181/org.apache.dubbo.metadata.report.MetadataReport?application=demo-provider&client=&file.cache=null&port=2181&protocol=zookeeper&registry-type=service&registry.type=service&timeout=20001
    url = url.setPath(MetadataReport.class.getName())
        .removeParameters(EXPORT_KEY, REFER_KEY);
    //缓存key，zookeeper://127.0.0.1:2181/org.apache.dubbo.metadata.report.MetadataReport
    String key = url.toServiceString();
    //尝试重缓存直接获取
    MetadataReport metadataReport = serviceStoreMap.get(key);
    if (metadataReport != null) {
        return metadataReport;
    }
    // Lock the metadata access process to ensure a single instance of the metadata instance
    //加锁再次获取
    lock.lock();
    try {
        metadataReport = serviceStoreMap.get(key);
        if (metadataReport != null) {
            return metadataReport;
        }
        boolean check = url.getParameter(CHECK_KEY, true) && url.getPort() != 0;
        try {
            //创建元数据
            metadataReport = createMetadataReport(url);
        } catch (Exception e) {
            if (!check) {
                logger.warn("The metadata reporter failed to initialize", e);
            } else {
                throw e;
            }
        }
        if (check && metadataReport == null) {
            throw new IllegalStateException("Can not create metadata Report " + url);
        }
        //加入缓存
        if (metadataReport != null) {
            serviceStoreMap.put(key, metadataReport);
        }
        return metadataReport;
    } finally {
        // Release the lock
        lock.unlock();
    }
}
/**
 * ZookeeperMetadataReportFactory的方法
 * <p>
 * 创建元数据实例
 *
 * @param url 地址
 * @return zookeeper的元数据实例
 */
@Override
public MetadataReport createMetadataReport(URL url) {
    //创建并返回ZookeeperMetadataReport实例
    return new ZookeeperMetadataReport(url, zookeeperTransporter);
}
```

### 3.2 ZookeeperMetadataReport基于Zookeeper的元数据

使用zookeeper作为元数据中心时，将会创建并返回ZookeeperMetadataReport。大概逻辑为：

**1、** 首先调用父类AbstractMetadataReport的构造器，主要用于加载本地文件缓存、定期发布元数据配置等相关逻辑；

**2、** 随后校验url并且连接zookeeper获取zkClienk；

```java
/**
 * ZookeeperMetadataReport的构造器
 *
 * @param url                  地址
 * @param zookeeperTransporter 客户端管理链接池
 */
public ZookeeperMetadataReport(URL url, ZookeeperTransporter zookeeperTransporter) {
    /*
     * 父类构造器
     * 加载本地缓存、定期发布元数据配置等相关逻辑
     */
    super(url);
    //host不能是0.0.0.0，并且url上anyhost参数不能为true
    if (url.isAnyHost()) {
        throw new IllegalStateException("registry address == null");
    }
    //组，默认dubbo
    String group = url.getGroup(DEFAULT_ROOT);
    if (!group.startsWith(PATH_SEPARATOR)) {
        group = PATH_SEPARATOR + group;
    }
    this.root = group;
    //连接zookeeper创建zkClient
    zkClient = zookeeperTransporter.connect(url);
}
```

#### 3.2.1 AbstractMetadataReport元数据配置

AbstractMetadataReport的构造器主要用于完成加载本地文件缓存、创建定期发布元数据的任务等相关公共的逻辑。

**1、** 是否开启元数据本地缓存由file.cache属性控制，默认缓存文件路径为：/{user.home}/.dubbo/dubbo-metadata-{dubbo.application.name}-{ip}-{post}.cache将会加载缓存文件中的配置到properties属性中；

**2、** 更新元数据是通过一个单线程的调度任务线程池执行的，默认异步更新，该构造器中会创建定时任务，首次执行任务的时间为凌晨2点到6点之间的随机时间，后续每次任务执行间隔24h，即每天发布一次元数据；

```java
public AbstractMetadataReport(URL reportServerURL) {
    //将reportURL属性赋值为reportServerURL
    setUrl(reportServerURL);
    //判断是否支持本地缓存，默认为true支持
    boolean localCacheEnabled = reportServerURL.getParameter(REGISTRY_LOCAL_FILE_CACHE_ENABLED, true);
    // Start file save timer 启动文件保存定时器
    //获取默认本地元数据缓存文件路径 /{user.home}/.dubbo/dubbo-metadata-{dubbo.application.name}-{ip}-{post}.cache
    String defaultFilename = System.getProperty(USER_HOME) + DUBBO_METADATA +
        reportServerURL.getApplication() + "-" +
        replace(reportServerURL.getAddress(), ":", "-") + CACHE;
    //最终文件路径，如果有指定路径(file属性)则使用指定的路径，否则使用默认路径
    String filename = reportServerURL.getParameter(FILE_KEY, defaultFilename);
    File file = null;
    //如果支持本地文件缓存并且文件名不为空
    if (localCacheEnabled && ConfigUtils.isNotEmpty(filename)) {
        //基于此路径创建File
        file = new File(filename);
        //如果文件不存在，并且父目录不存在
        if (!file.exists() && file.getParentFile() != null && !file.getParentFile().exists()) {
            //创建父目录，失败则抛出异常
            if (!file.getParentFile().mkdirs()) {
                throw new IllegalArgumentException("Invalid service store file " + file + ", cause: Failed to create directory " + file.getParentFile() + "!");
            }
        }
        // if this file exists, firstly delete it.
        //如果还没初始化完毕，并且缓存文件存在，那么先删除
        if (!initialized.getAndSet(true) && file.exists()) {
            file.delete();
        }
    }
    //保存缓存文件的引用
    this.file = file;
    //加载缓存文件内容到properties集合中
    loadProperties();
    //sync-report属性，是否发布更新元数据，默认为false异步
    syncReport = reportServerURL.getParameter(SYNC_REPORT_KEY, false);
    //元数据重试对象，retry-times 重试次数，默认100，retry-period 重试时间间隔，默认3000毫秒
    metadataReportRetry = new MetadataReportRetry(reportServerURL.getParameter(RETRY_TIMES_KEY, DEFAULT_METADATA_REPORT_RETRY_TIMES),
        reportServerURL.getParameter(RETRY_PERIOD_KEY, DEFAULT_METADATA_REPORT_RETRY_PERIOD));
    // cycle report the data switch
    //cycle-report 是否每天更新完整元数据，默认true
    if (reportServerURL.getParameter(CYCLE_REPORT_KEY, DEFAULT_METADATA_REPORT_CYCLE_REPORT)) {
        //构建单线程的调度任务线程池
        reportTimerScheduler = Executors.newSingleThreadScheduledExecutor(new NamedThreadFactory("DubboMetadataReportTimer", true));
        //创建定时任务，首次执行任务的时间为凌晨2点到6点之间的随机时间，后续每次任务执行间隔24h，即一天
        reportTimerScheduler.scheduleAtFixedRate(this::publishAll, calculateStartTime(), ONE_DAY_IN_MILLISECONDS, TimeUnit.MILLISECONDS);
    }
    //report-metadata 是否上报地址发现中的接口配置报元数据
    //dubbo.application.metadata-type=remote 该配置不起作用即一定会上报，dubbo.application.metadata-type=local 时是否上报由该配置值决定
    this.reportMetadata = reportServerURL.getParameter(REPORT_METADATA_KEY, false);
    //report-definition 是否上报服务运维用元数据   
    this.reportDefinition = reportServerURL.getParameter(REPORT_DEFINITION_KEY, true);
}
```

### .3.3 publishAll定时发布元数据

定时发布元数据的方法是AbstractMetadataReport#publishAll方法，该方法主要是同步allMetadataReports里面的全部元数据。

内部调用doHandleMetadataCollection方法，如果是provider端的元数据，调用storeProviderMetadata同步，如果是consumer端的元数据，调用storeConsumerMetadata同步。

```java
void publishAll() {
logger.info("start to publish all metadata.");
    this.doHandleMetadataCollection(allMetadataReports);
}
/**
 * AbstractMetadataReport的方法
 * <p>
 * 同步元数据
 *
 * @param metadataMap 元数据map
 * @return
 */
private boolean doHandleMetadataCollection(Map<MetadataIdentifier, Object> metadataMap) {
    //如果本地内存没有元数据，那么无需同步，返回true
    if (metadataMap.isEmpty()) {
        return true;
    }
    Iterator<Map.Entry<MetadataIdentifier, Object>> iterable = metadataMap.entrySet().iterator();
    while (iterable.hasNext()) {
        Map.Entry<MetadataIdentifier, Object> item = iterable.next();
        //如果是provider端的元数据，调用storeProviderMetadata同步
        if (PROVIDER_SIDE.equals(item.getKey().getSide())) {
            this.storeProviderMetadata(item.getKey(), (FullServiceDefinition) item.getValue());
        }
        //如果是consumer端的元数据，调用storeConsumerMetadata同步
        else if (CONSUMER_SIDE.equals(item.getKey().getSide())) {
            this.storeConsumerMetadata(item.getKey(), (Map) item.getValue());
        }
    }
    return false;
}
```

#### 3.3.1 storeProviderMetadata同步ProviderMetadata

provider端的元数据，调用storeProviderMetadata同步。该方法的大概步骤为：

1. 将元数据存入内存的allMetadataReports中，从失败的缓存failedReports中移除。我们的入口方法doHandleMetadataCollection中的参数就是allMetadataReports，这里为何再存储进去一次呢？实际上，这个方法在MetadataUtils#publishServiceDefinition方法中也被调用到了，而那里就是allMetadataReports中的数据的来源，即导出服务和引用的时候会同步元数据。
**2、** 将serviceDefinition序列化为json字符串；

**3、** 调用doStoreProviderMetadata方法将数据同步到元数据中心；

**4、** 调用saveProperties方法将数据同步到本地缓存文件；

**5、** 如果抛出了异常，将元数据存入失败的元数据缓存，随后重试一次如果再次失败，抛出异常；

```java
/**
 * AbstractMetadataReport的方法
 * <p>
 * 同步Provider端的Metadata
 *
 * @param providerMetadataIdentifier 元数据标识符，用于存储方法描述符
 * @param serviceDefinition          服务定义，包括接口的规范名称、类文件的位置、类型的定义等属性
 */
@Override
public void storeProviderMetadata(MetadataIdentifier providerMetadataIdentifier, ServiceDefinition serviceDefinition) {
    //同步还是异步
    if (syncReport) {
        //同步调用
        storeProviderMetadataTask(providerMetadataIdentifier, serviceDefinition);
    } else {
        //异步调用，其实就是在reportCacheExecutor线程池中异步执行
        reportCacheExecutor.execute(() -> storeProviderMetadataTask(providerMetadataIdentifier, serviceDefinition));
    }
}
/**
 * AbstractMetadataReport的方法
 * <p>
 * 同步Provider端的Metadata
 *
 * @param providerMetadataIdentifier 元数据标识符，用于存储方法描述符
 * @param serviceDefinition          服务定义，包括接口的规范名称、类文件的位置、类型的定义等属性
 */
private void storeProviderMetadataTask(MetadataIdentifier providerMetadataIdentifier, ServiceDefinition serviceDefinition) {
    try {
        //输出日志
        if (logger.isInfoEnabled()) {
            logger.info("store provider metadata. Identifier : " + providerMetadataIdentifier + "; definition: " + serviceDefinition);
        }
        //存入内存的allMetadataReports中
        allMetadataReports.put(providerMetadataIdentifier, serviceDefinition);
        //从失败的缓存中移除
        failedReports.remove(providerMetadataIdentifier);
        //转换为json字符窜
        String data = JsonUtils.getJson().toJson(serviceDefinition);
        /*
         * 将数据同步到元数据中心
         */
        doStoreProviderMetadata(providerMetadataIdentifier, data);
        /*
         * 将数据同步到本地缓存文件
         */
        saveProperties(providerMetadataIdentifier, data, true, !syncReport);
    } catch (Exception e) {
        // retry again. If failed again, throw exception.
        //抛出异常
        //存入失败的元数据缓存
        failedReports.put(providerMetadataIdentifier, serviceDefinition);
        //重试一次。如果再次失败，抛出异常。
        metadataReportRetry.startRetryTask();
        logger.error("Failed to put provider metadata " + providerMetadataIdentifier + " in  " + serviceDefinition + ", cause: " + e.getMessage(), e);
    }
}
```

##### 3.3.1.1 doStoreProviderMetadata同步Provider元数据

该方法将Provider元数据同步到远程元数据中心，以zookeeper为例子。

```java
/**
 * ZookeeperMetadataReport的方法
 * <p>
 * 将Provider元数据同步到远程元数据中心
 *
 * @param providerMetadataIdentifier 元数据标识符，用于存储方法描述符
 * @param serviceDefinitions         服务定义json，包括接口的规范名称、类文件的位置、类型的定义等属性
 */
@Override
protected void doStoreProviderMetadata(MetadataIdentifier providerMetadataIdentifier, String serviceDefinitions) {
    storeMetadata(providerMetadataIdentifier, serviceDefinitions);
}
```

ZookeeperMetadataReport#storeMetadata方法存储元数据，不区分producer或者是consumer。实际上就是创建一个指定路径的永久节点，然后将元数据json字符串存储进去即可。节点路径/dubbo/{pathTag}/{servicePath}/{version}/{group}/{side}，例如 /dubbo/metadata/org.apache.dubbo.demo.GreetingService/1.0.0/greeting/provider/demo-provider。

```java
/**
 * ZookeeperMetadataReport的方法
 * <p>
 * 将元数据同步到远程元数据中心
 *
 * @param metadataIdentifier 元数据标识符，用于存储方法描述符
 * @param v                  元数据
 */
private void storeMetadata(MetadataIdentifier metadataIdentifier, String v) {
    //创建一个永久节点
    zkClient.create(getNodePath(metadataIdentifier), v, false);
}
/**
 * 获取节点路径
 *
 * @param metadataIdentifier 元数据标识符，用于存储方法描述符
 * @return 节点路径
 */
String getNodePath(BaseMetadataIdentifier metadataIdentifier) {
    //节点路径   /dubbo/{pathTag}/{servicePath}/{version}/{group}/{side}
    //例如 /dubbo/metadata/org.apache.dubbo.demo.GreetingService/1.0.0/greeting/provider/demo-provider
    return toRootDir() + metadataIdentifier.getUniqueKey(KeyTypeEnum.PATH);
}
```

zookeeper中的producer元数据样式如下：

##### 3.3.1.2 saveProperties同步到本地文件

该方法将内存中的元数据同步到本地缓存文件。

```java
/**
 * AbstractMetadataReport的方法
 * <p>
 * 将元数据同步到本地缓存文件
 *
 * @param metadataIdentifier 元数据标识符，用于存储方法描述符
 * @param value              元数据json值
 * @param add                是新增元数据还是删除，true - 新增， false - 删除
 * @param sync               同步还是异步，true - 同步，false - 异步
 */
private void saveProperties(MetadataIdentifier metadataIdentifier, String value, boolean add, boolean sync) {
    //缓存文件不存在则直接返回
    if (file == null) {
        return;
    }
    try {
        //新增元数据
        if (add) {
            properties.setProperty(metadataIdentifier.getUniqueKey(KeyTypeEnum.UNIQUE_KEY), value);
        }
        //否则就删除元数据
        else {
            properties.remove(metadataIdentifier.getUniqueKey(KeyTypeEnum.UNIQUE_KEY));
        }
        //数据变更版本自增
        long version = lastCacheChanged.incrementAndGet();
        //同步存储
        if (sync) {
            new SaveProperties(version).run();
        }
        //异步存储，采用线程池
        else {
            reportCacheExecutor.execute(new SaveProperties(version));
        }
    } catch (Throwable t) {
        logger.warn(t.getMessage(), t);
    }
}
```

具体的同步操作本抽象成为了一个线程任务SaveProperties。

```java
private class SaveProperties implements Runnable {
private long version;
    private SaveProperties(long version) {
        this.version = version;
    }
    @Override
    public void run() {
        //执行本地同步
        doSaveProperties(version);
    }
}
/**
 * AbstractMetadataReport
 * 、执行元数据同步到本地缓存文件
 *
 * @param version 最新数据变更版本
 */
private void doSaveProperties(long version) {
    //如果版本过小，那么直接返回
    if (version < lastCacheChanged.get()) {
        return;
    }
    //缓存文件不存在则直接返回
    if (file == null) {
        return;
    }
    // Save
    try {
        //新建文件锁，文件路径为缓存文件的绝对路径
        ///{user.home}/.dubbo/dubbo-metadata-{dubbo.application.name}-{ip}-{post}.cache.lock
        File lockfile = new File(file.getAbsolutePath() + ".lock");
        //如果不存在则创建文件
        if (!lockfile.exists()) {
            lockfile.createNewFile();
        }
        try (RandomAccessFile raf = new RandomAccessFile(lockfile, "rw");
             //打开锁文件通道
             FileChannel channel = raf.getChannel()) {
            //获取文件独占锁
            FileLock lock = channel.tryLock();
            //加锁失败
            if (lock == null) {
                throw new IOException("Can not lock the metadataReport cache file " + file.getAbsolutePath() + ", ignore and retry later, maybe multi java process use the file, please config: dubbo.metadata.file=xxx.properties");
            }
            // Save
            try {
                //缓存文件不存在就创建
                if (!file.exists()) {
                    file.createNewFile();
                }
                Properties tmpProperties;
                //异步
                if (!syncReport) {
                    // When syncReport = false, properties.setProperty and properties.store are called from the same
                    // thread(reportCacheExecutor), so deep copy is not required
                    tmpProperties = properties;
                }
                //同步
                else {
                    // Using store method and setProperty method of the this.properties will cause lock contention
                    // under multi-threading, so deep copy a new container
                    //使用一个新的集合，避免锁争用
                    tmpProperties = new Properties();
                    Set<Map.Entry<Object, Object>> entries = properties.entrySet();
                    for (Map.Entry<Object, Object> entry : entries) {
                        tmpProperties.setProperty((String) entry.getKey(), (String) entry.getValue());
                    }
                }
                //将元数据写入到本地文件中
                try (FileOutputStream outputFile = new FileOutputStream(file)) {
                    tmpProperties.store(outputFile, "Dubbo metadataReport Cache");
                }
            } finally {
                //释放锁
                lock.release();
            }
        }
    } catch (Throwable e) {
        if (version < lastCacheChanged.get()) {
            return;
        } else {
            //失败则稍后重试
            reportCacheExecutor.execute(new SaveProperties(lastCacheChanged.incrementAndGet()));
        }
        logger.warn("Failed to save service store file, cause: " + e.getMessage(), e);
    }
}
```

#### 3.3.2 storeConsumerMetadata同步ConsumerMetadata

comsumer端的元数据，调用storeConsumerMetadata同步。该方法的大概步骤为：

**1、** 将元数据存入内存的allMetadataReports中，从失败的缓存failedReports中移除。我们的入口方法doHandleMetadataCollection中的参数就是allMetadataReports，这里为何再存储进去一次呢？实际上，这个方法在MetadataUtils#publishServiceDefinition方法中也被调用到了，而那里就是allMetadataReports中的数据的来源，即导出服务和引用的时候会同步元数据。
**2、** 将serviceParameterMap序列化为json字符串；

**3、** 调用doStoreConsumerMetadata方法将数据同步到元数据中心；

**4、** 调用saveProperties方法将数据同步到本地缓存文件；

**5、** 如果抛出了异常，将元数据存入失败的元数据缓存，随后重试一次如果再次失败，抛出异常；

```java
/**
 * AbstractMetadataReport的方法
 * <p>
 * 同步consumer端的Metadata
 *
 * @param consumerMetadataIdentifier 元数据标识符，用于存储方法描述符
 * @param serviceParameterMap        服务参数map
 */
@Override
public void storeConsumerMetadata(MetadataIdentifier consumerMetadataIdentifier, Map<String, String> serviceParameterMap) {
    //同步还是异步
    if (syncReport) {
        //同步调用
        storeConsumerMetadataTask(consumerMetadataIdentifier, serviceParameterMap);
    } else {
        //异步调用，其实就是在reportCacheExecutor线程池中异步执行
        reportCacheExecutor.execute(() -> storeConsumerMetadataTask(consumerMetadataIdentifier, serviceParameterMap));
    }
}
/**
 * AbstractMetadataReport的方法
 * <p>
 * 同步consumer端的Metadata
 *
 * @param consumerMetadataIdentifier 元数据标识符，用于存储方法描述符
 * @param serviceParameterMap        服务参数map
 */
protected void storeConsumerMetadataTask(MetadataIdentifier consumerMetadataIdentifier, Map<String, String> serviceParameterMap) {
    try {
        //输出日志
        if (logger.isInfoEnabled()) {
            logger.info("store consumer metadata. Identifier : " + consumerMetadataIdentifier + "; definition: " + serviceParameterMap);
        }
        //存入内存的allMetadataReports中
        allMetadataReports.put(consumerMetadataIdentifier, serviceParameterMap);
        //从失败的缓存中移除
        failedReports.remove(consumerMetadataIdentifier);
        //转换为json字符窜
        String data = JsonUtils.getJson().toJson(serviceParameterMap);
        /*
         * 将数据同步到元数据中心
         */
        doStoreConsumerMetadata(consumerMetadataIdentifier, data);
        /*
         * 将数据同步到本地缓存文件
         */
        saveProperties(consumerMetadataIdentifier, data, true, !syncReport);
    } catch (Exception e) {
        // retry again. If failed again, throw exception.
        failedReports.put(consumerMetadataIdentifier, serviceParameterMap);
        metadataReportRetry.startRetryTask();
        logger.error("Failed to put consumer metadata " + consumerMetadataIdentifier + ";  " + serviceParameterMap + ", cause: " + e.getMessage(), e);
    }
}
```

##### 3.3.2.1 doStoreConsumerMetadata同步Consumer元数据

该方法将Consumer元数据同步到远程元数据中心，以zookeeper为例子。

```java
/**
 * ZookeeperMetadataReport的方法
 * <p>
 * 将Provider元数据同步到远程元数据中心
 *
 * @param consumerMetadataIdentifier 元数据标识符，用于存储方法描述符
 * @param value                      服务参数json
 */
@Override
protected void doStoreConsumerMetadata(MetadataIdentifier consumerMetadataIdentifier, String value) {
    storeMetadata(consumerMetadataIdentifier, value);
}
```

zookeeper中的consumer的元数据格式如下：
