# 12、Dubbo 3.x 源码解析 - Dubbo服务发布导出源码(1)
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/12.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo服务的发布与引用的源码。

此前我们学习了[Dubbo服务的发布与引用的入口](/zhuanlan/j2ee/dubbo/2/11.html)的源码。书接上回，现在让我们来正式学习Dubbo 3.x的服务发布导出的源码，这也是Dubbo的核心流程之一。

## 1 exportServices导出服务

Dubbo3.1通过DefaultModuleDeployer#exportServices方法，导出全部服务。

```java
/**
 * DefaultModuleDeployer的方法
 * 导出服务
 */
private void exportServices() {
    //获取全部dubbo服务bean，依次进行导出
    for (ServiceConfigBase sc : configManager.getServices()) {
        exportServiceInternal(sc);
    }
}
```

这里的所有的服务实例都是从ModuleConfigManager#getServices方法中获取的，那么dubbo服务bean什么时候加入到ModuleConfigManager中的呢？

实际上由于ServiceBean实现了InitializingBean方法，那么在基于spring创建每一个ServiceBean实例的时候，将会调用每个实例的afterPropertiesSet方法。

```java
/**
 * ServiceBean的方法
 */
@Override
public void afterPropertiesSet() throws Exception {
    //如果path为null，则设置path为服务接口名
    if (StringUtils.isEmpty(getPath())) {
        if (StringUtils.isNotEmpty(getInterface())) {
            setPath(getInterface());
        }
    }
    //register service bean
    ModuleModel moduleModel = DubboBeanUtils.getModuleModel(applicationContext);
    //将当前ServiceBean实例注册到ConfigManager
    moduleModel.getConfigManager().addService(this);
    //设置PENDING状态
    moduleModel.getDeployer().setPending();
}
```

ModuleConfigManager#addService方法内部调用addConfig方法进行注册。

```java
/**
 * ModuleConfigManager的方法
 * 
 * @param serviceConfig ServiceBean
 */
public void addService(ServiceConfigBase<?> serviceConfig) {
    addConfig(serviceConfig);
}
/**
 * AbstractConfigManager的方法
 * <p>
 * 注册Dubbo配置bean到configManager
 */
public final <T extends AbstractConfig> T addConfig(AbstractConfig config) {
    //如果配置bean为null则直接返回
    if (config == null) {
        return null;
    }
    // ignore MethodConfig
    //忽略方法的配置
    if (!isSupportConfigType(config.getClass())) {
        throw new IllegalArgumentException("Unsupported config type: " + config);
    }
    //设置域模型
    if (config.getScopeModel() != scopeModel) {
        config.setScopeModel(scopeModel);
    }
    //尝试将该配置的名称以及对应的配置加入到configsCache缓存中
    Map<String, AbstractConfig> configsMap = configsCache.computeIfAbsent(getTagName(config.getClass()), type -> new ConcurrentHashMap<>());
    // fast check duplicated equivalent config before write lock
    //快速检查重复的ServiceConfig和ReferenceConfig配置
    if (!(config instanceof ReferenceConfigBase || config instanceof ServiceConfigBase)) {
        for (AbstractConfig value : configsMap.values()) {
            if (value.equals(config)) {
                return (T) value;
            }
        }
    }
    // lock by config type
    synchronized (configsMap) {
        return (T) addIfAbsent(config, configsMap);
    }
}
```

## 2 exportServiceInternal导出服务

该方法导出单个服务bean，有异步导出和同步导出两种模式，如果该模块module开启了异步服务导出，或者该service服务开启了异步服务导出，那么就走异步导出模式，否则同步导出。导出的服务将会加入到**exportedServices**已导出的服务列表中。

```java
/**
 * DefaultModuleDeployer的方法
 * 导出单个服务
 *
 * @param sc 服务配置bean
 */
private void exportServiceInternal(ServiceConfigBase sc) {
    ServiceConfig<?> serviceConfig = (ServiceConfig<?>) sc;
    //如果还没刷新该服务配置
    if (!serviceConfig.isRefreshed()) {
        //刷新配置，即Dubbo配置的重写（基于优先级的覆盖）
        //设个方法我们在此前Dubbo配置的加载部分已经讲过了
        serviceConfig.refresh();
    }
    //如果服务已经导出则返回
    if (sc.isExported()) {
        return;
    }
    //如果该模块module开启了异步服务导出，或者该service服务开启了异步服务导出
    if (exportAsync || sc.shouldExportAsync()) {
        //获取服务导出线程池，默认10个线程
        ExecutorService executor = executorRepository.getServiceExportExecutor();
        //基于CompletableFuture和自定义线程池实现异步的服务导出
        CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            try {
                //如果服务没导出
                if (!sc.isExported()) {
                    //导出服务
                    sc.export();
                    //加入到已导出的服务列表中
                    exportedServices.add(sc);
                }
            } catch (Throwable t) {
                logger.error("5-9", "", "", "Failed to async export service config: " + getIdentifier() + " , catch error : " + t.getMessage(), t);
            }
        }, executor);
        //future加入到异步导出结果列表中
        asyncExportingFutures.add(future);
    } 
    //如果不支持异步导出，那么同步导出
    else {
        //如果服务没导出
        if (!sc.isExported()) {
            //同步导出服务
            sc.export();
            //加入到已导出的服务列表中
            exportedServices.add(sc);
        }
    }
}
```

### 2.1 export导出服务

**ServiceConfig#export方法用于导出服务，如果看过此前的Dubbo源码的小伙伴一定不陌生，只不过在此前版本的源码中，ServiceConfig实现了ApplicationListener接口，它会监听ContextRefreshedEvent事件，然后在onApplicationEvent(ContextRefreshedEvent event)方法中调用这个export方法完成自身导出服务的过程。**

**但是在Dubbo3.1中，ServiceConfig不再实现ApplicationListener，服务的导出的export方法统一由DubboDeployApplicationListener和DefaultModuleDeployer触发。**

```java
/**
 * ServiceConfig的方法
 * 导出自身服务
 */
@Override
public void export() {
    //如果服务已经导出则返回
    if (this.exported) {
        return;
    }
    // ensure start module, compatible with old api usage
    //确保启动模块，与旧的API使用兼容
    getScopeModel().getDeployer().start();
    synchronized (this) {
        //如果服务已经导出则返回，双重检测锁
        if (this.exported) {
            return;
        }
        //如果还没刷新该服务配置则刷新
        if (!this.isRefreshed()) {
            this.refresh();
        }
        //如果应该导出服务，也就是export属性
        //优先获取provider的export配置，如果provider未配置export，则使用service的 export，如果service也未配置export，则默认为true
        if (this.shouldExport()) {
            //服务导出前初始化serviceMetadata服务元数据
            this.init();
            //如果应该延迟导出
            //优先获取provider的delay配置，如果provider未配置delay，则使用service的delay，如果service也未配置delay，则默认为false
            if (shouldDelay()) {
                //延迟导出
                doDelayExport();
            } else {
                //正常导出
                doExport();
            }
        }
    }
}
```

#### 2.1.1 init初始化serviceMetadata

服务导出前，需要初始化该服务的serviceMetadata服务元数据，所谓元数据，也就是此服务的基本信息，例如服务接口Class，服务实现类引用，服务分组，服务接口名等等。

```java
/**
 * ServiceConfig的方法
 * for early init serviceMetadata
 */
public void init() {
    //尝试CAS的将初始化标识为改为true
    if (this.initialized.compareAndSet(false, true)) {
        // load ServiceListeners from extension
        //基于DUbbo SPI机制获取服务监听器并加入到serviceListeners集合中
        ExtensionLoader<ServiceListener> extensionLoader = this.getExtensionLoader(ServiceListener.class);
        this.serviceListeners.addAll(extensionLoader.getSupportedExtensionInstances());
    }
    //根据provider初始化服务元数据
    initServiceMetadata(provider);
    //初始化服务元数据
    //设置类型CLass
    serviceMetadata.setServiceType(getInterfaceClass());
    //服务的具体实现
    serviceMetadata.setTarget(getRef());
    //服务key： group/服务接口:版本号
    serviceMetadata.generateServiceKey();
}
protected void initServiceMetadata(AbstractInterfaceConfig interfaceConfig) {
    //服务版本
    serviceMetadata.setVersion(getVersion(interfaceConfig));
    //服务分组
    serviceMetadata.setGroup(getGroup(interfaceConfig));
    //默认分组
    serviceMetadata.setDefaultGroup(getGroup(interfaceConfig));
    //服务接口名
    serviceMetadata.setServiceInterfaceName(getInterface());
}
```

#### 2.1.2 doDelayExport延迟导出

延迟导出实际上就是获取服务导出线程池serviceExportExecutor，异步的执行doExport方法导出服务，延迟时间为配置的delay毫秒。

```java
/**
 * ServiceConfig的方法
 * 延迟导出服务
 */
protected void doDelayExport() {
    //获取服务导出线程池，异步的执行doExport方法导出服务，延迟时间为配置的delay毫秒
    getScopeModel().getDefaultExtension(ExecutorRepository.class).getServiceExportExecutor()
        .schedule(() -> {
            try {
                doExport();
            } catch (Exception e) {
                logger.error("5-9", "configuration server disconnected", "", "Failed to (async)export service config: " + interfaceName, e);
            }
        }, getDelay(), TimeUnit.MILLISECONDS);
}
```

#### 2.1.3 doExport执行导出

该方法包含服务导出的骨干逻辑：

**1、** 如果服务已导出，则直接返回；

**2、** 通过doExportUrls方法导出服务url，这是核心方法；

**3、** 导出服务url之后，调用exported方法尝将服务接口到服务名的映射关系发布到远程元数据中心；

```java
/**
 * ServiceConfig的方法
 * 执行导出
 */
protected synchronized void doExport() {
    //如果服务已取消导出则跑出异常
    if (unexported) {
        throw new IllegalStateException("The service " + interfaceClass.getName() + " has already unexported!");
    }
    //如果服务已导出则返回
    if (exported) {
        return;
    }
    //服务路径为空则设置为接口名，一般都没主动设置path
    if (StringUtils.isEmpty(path)) {
        path = interfaceName;
    }
    /*
     * 导出服务url
     */
    doExportUrls();
    /*
     * 导出服务url
     */
    exported();
}
```

## 3 总结

本次我们学习了Dubbo 3.x的服务发布导出的入口源码。

首先是Dubbo服务发布的入口，在Dubbo 3.1中，它位于监听器**DubboDeployApplicationListener#onApplicationEvent**方法中，在spring容器启动的最后一个步也就是**refresh**方法内部最后的**finishRefresh**方法中，将会向所有监听器发布一个**ContextRefreshedEvent**事件，表示**容器刷新完毕，此时就会触发这个方法的调用**。

**onApplicationEvent**方法内部通过**DefaultModuleDeployer#start**方法开启服务的导出、引用等操作，最终在**startSync**方法内部的**exportServices**方法中，将会获取全部的dubbo服务bean实例**ServiceConfigBase**，然后依次调用**exportServiceInternal**方法进行导出。

**exportServiceInternal**方法中会判断是否开启了**异步导出**，如果开启了那么使用线程池导出，**默认没开启，那么就走同步导出**通过服务**ServiceConfig**本身的**export**方法执行导出，对于已导出的服务将会加入**exportedServices**列表中；

在**ServiceConfigBase#export**方法中，会判断是否需要延迟导出服务，也就是**delay**属性，如果不需要那么立即执行doExport方法导出服务，否则获取服务导出线程池，异步的执行doExport方法导出服务，延迟时间为配置的delay毫秒。**默认立即导出**。

在**doExport**方法中包含服务导出的骨干逻辑：**首先通过doExportUrls方法导出服务url到全部注册中心，这是核心方法导出服务url之后，调用exported方法尝将服务接口到服务名的映射关系发布到远程元数据中心，这是Dubbo3应用级服务注册发现所必须的步骤**；

**下文我们将会着重学习doExportUrls导出服务url的方法。**
