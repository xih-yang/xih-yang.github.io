# 08、Dubbo 3.x 源码解析 - Dubbo配置中心的加载与优先级源码
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/8.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo启动配置中心，以及加载应用程序配置和配置优先级覆盖的源码。

此前我们学习了[Dubbo配置的加载与覆盖源码入口](/zhuanlan/j2ee/dubbo/2/7.html)，我们知道在最后会调用DefaultModuleDeployer#prepare准备Dubbo应用程序，该方法中将会：

**1、** 首先通过应用程序发布器DefaultApplicationDeployer#initialize方法初始化并启动应用程序实例。

**2、** 然后通过模块模型moduleModel的模块发布器DefaultModuleDeployer#initialize方法初始化导出/引用模块的服务，即初始化与服务生产者、消费者相关的配置。

**本次我们学习应用程序发布器DefaultApplicationDeployer#initialize方法，初始化并启动Dubbo应用程序实例。将会加载Dubbo配置并且进行优先级的覆盖。**

## 1 DefaultApplicationDeployer#initialize初始化应用程序

DefaultApplicationDeployer的initialize方法如下。可以看到，它实际上做了很多事情，首先**注册停止钩子，然后启动配置中心，随后调用loadApplicationConfigs方法加载初始化应用程序配置，最后初始化ModuleModel以及启动元数据中心**。loadApplicationConfigs实际上就是通过配置管理器configManager实现配置的加载的逻辑，在这里将会涉及到配置的优先级和覆盖的问题。

```java
/**
 * DefaultApplicationDeployer的方法
 * <p>
 * Initialize
 */
@Override
public void initialize() {
    //只初始化一次
    if (initialized) {
        return;
    }
    // Ensure that the initialization is completed when concurrent calls
    //确保在并发调用时完成正常初始化
    synchronized (startLock) {
        //再次确认
        if (initialized) {
            return;
        }
        // register shutdown hook
        //注册停止钩子
        registerShutdownHook();
        /*
         * 1 启动配置中心
         */
        startConfigCenter();
        /*
         * 2 加载 应用程序配置
         */
        loadApplicationConfigs();
        /*
         * 3 初始化Module初始化器
         */
        initModuleDeployers();
        // @since 2.7.8
        /*
         * 4 启动元数据中心
         */
        startMetadataCenter();
        initialized = true;
        if (logger.isInfoEnabled()) {
            logger.info(getIdentifier() + " has been initialized!");
        }
    }
}
```

## 2 startConfigCenter启动配置中心

**通过configManager启动并初始化Dubbo配置中心，并且读取配置中心的配置数据存入本地内存。关于Dubbo 3中的动态配置中心：https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/config-center/。**

配置中心 (config-center) 在 Dubbo 中可承担两类职责：

**1、****外部化配置**：启动配置的集中式存储（简单理解为dubbo.properties的外部化存储）；

**2、** 流量治理规则存储；

startConfigCenter方法的大概步骤为：

**1、** 通过**loadConfigsOfTypeFromProps**方法，从dubbo配置集中加载应用程序配置，涉及到配置优先级，配置前缀为**dubbo.application**，随后继续从dubbo配置集中加载配置中心配置，涉及到配置优先级，配置前缀为**dubbo.config-center**；

**2、** 调用**useRegistryAsConfigCenterIfNecessary**方法，出于兼容性的考虑，当没有显式指定配置中心且registryConfig的useAsConfigCenter为null或true时，**Dubbo使用registry作为默认配置中心**；

**3、** 通过**refresh**方法刷新配置中心配置，这里涉及到配置的优先级和覆盖，并通过**validateConfigCenterConfig**校验全部的配置中心的**parameters**属性；

**4、** 创建合并动态配置对象**CompositeDynamicConfiguration**，通过**prepareEnvironment**方法连接每一个**远程配置中心**，构建动态配置对象**dynamicConfiguration**，该方法将会**从远程配置中心获取全局级别的配置**存入externalConfiguration缓存，应用级别的配置存入appExternalConfiguration缓存，dynamicConfiguration也会存入本地合并配置中心对象CompositeDynamicConfiguration中；

```java
/**
 * DefaultApplicationDeployer的方法
 * <p>
 * 启动配置中心
 */
private void startConfigCenter() {
    // load application config
    /*
     * 1 从dubbo配置集中加载应用程序配置，涉及到配置优先级
     * 配置前缀为dubbo.application
     */
    configManager.loadConfigsOfTypeFromProps(ApplicationConfig.class);
    // try set model name
    //设置模型名字，默认dubbo.application.name
    if (StringUtils.isBlank(applicationModel.getModelName())) {
        applicationModel.setModelName(applicationModel.tryGetApplicationName());
    }
    // load config centers
    /*
     * 2 从dubbo配置集中加载配置中心配置，涉及到配置优先级
     * 配置前缀为dubbo.config-center
     */
    configManager.loadConfigsOfTypeFromProps(ConfigCenterConfig.class);
    /*
     * 3 出于兼容性的考虑，当没有显式指定配置中心且registryConfig的useAsConfigCenter为null或true时，Dubbo使用registry作为默认配置中心
     */
    useRegistryAsConfigCenterIfNecessary();
    // check Config Center
    /*
     * 4 刷新并校验全部的配置中心配置
     */
    //获取全部的配置中心的配置信息集合
    Collection<ConfigCenterConfig> configCenters = configManager.getConfigCenters();
    //如果还是没有任何配置中心配置
    if (CollectionUtils.isEmpty(configCenters)) {
        //创建一个配置中心实例
        ConfigCenterConfig configCenterConfig = new ConfigCenterConfig();
        configCenterConfig.setScopeModel(applicationModel);
        //刷新配置，即设置配置属性，涉及到配置优先级
        configCenterConfig.refresh();
        //校验配置中心的parameters属性
        ConfigValidationUtils.validateConfigCenterConfig(configCenterConfig);
        if (configCenterConfig.isValid()) {
            configManager.addConfigCenter(configCenterConfig);
            configCenters = configManager.getConfigCenters();
        }
    }
    //如果存在配置中心
    else {
        //刷新全部的配置中心，并校验配置中心
        for (ConfigCenterConfig configCenterConfig : configCenters) {
            configCenterConfig.refresh();
            ConfigValidationUtils.validateConfigCenterConfig(configCenterConfig);
        }
    }
    /*
     * 5 连接远程配置中心，从中获取配置并存入本地合并配置中心对象CompositeDynamicConfiguration中
     */
    if (CollectionUtils.isNotEmpty(configCenters)) {
        //创建一个合并多个配置的动态配置好中心对象
        CompositeDynamicConfiguration compositeDynamicConfiguration = new CompositeDynamicConfiguration();
        for (ConfigCenterConfig configCenter : configCenters) {
            // Pass config from ConfigCenterBean to environment
            //将配置中心的外部化配置加入到本地environment中的externalConfiguration属性中
            environment.updateExternalConfigMap(configCenter.getExternalConfiguration());
            //将配置中心的外部应用程序配置加入到本地environment中的appExternalConfiguration属性中
            environment.updateAppExternalConfigMap(configCenter.getAppExternalConfiguration());
            // Fetch config from remote config center
            /*
             * prepareEnvironment从远程配置中心获取配置，并存入本地compositeDynamicConfiguration
             */
            compositeDynamicConfiguration.addConfiguration(prepareEnvironment(configCenter));
        }
        //将动态配置中心配置设置到environment的defaultDynamicConfiguration属性中，表示配置中心已经已启动
        environment.setDynamicConfiguration(compositeDynamicConfiguration);
    }
}
```

### 2.1 loadConfigsOfTypeFromProps从配置文件中加载配置

**该方法用于从Dubbo的配置集中加载指定类型前缀的配置，涉及到配置的优先级和覆盖。**

**注意，在最开始我们讲解析xml标签的prepareDubboConfigBeans方法的时候，会将解析后的xml配置放入configManager的configsCache缓存中，但是并没有刷新。**

**如果在随后调用到了已经存入的配置的loadConfigsOfTypeFromProps方法时，因为判断配置已存在，所以也不会重新加载并刷新配置，但在启动配置中心后的loadApplicationConfigs方法中，将会刷新全部配置。**

```java
/**
 * AbstractConfigManager的方法
 * <p>
 * 从Dubbo的配置集中加载指定类型前缀的配置。
 *
 * @param cls 指定的配置类型
 */
public <T extends AbstractConfig> List<T> loadConfigsOfTypeFromProps(Class<T> cls) {
    List<T> tmpConfigs = new ArrayList<>();
    /*
     * 1 获取PropertiesConfiguration，这个类的实例在Environment初始化时创建
     * 用于加载dubbo.properties配置文件，默认在classpath下，可以通过JVM或者系统环境变量属性指定路径
     */
    PropertiesConfiguration properties = environment.getPropertiesConfiguration();
    // load multiple configs with id
    //根据类型获取多配置的配置id，所谓多配置id，就是指的复数配置id，例如
    // dubbo.registries.registry1.address=xxx
    // dubbo.registries.registry2.port=xxx
    //这两个复数配置的配置id 分别为registry1和registry2
    //单复数配置参考：https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/config/principle/#17-%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%8D%95%E5%A4%8D%E6%95%B0%E5%AF%B9%E7%85%A7%E8%A1%A8
    Set<String> configIds = this.getConfigIdsFromProps(cls);
    //遍历每个配置id，获取不同的配置，全局配置则没有id
    configIds.forEach(id -> {
        //如果不存在该配置，则创建
        if (!this.getConfig(cls, id).isPresent()) {
            T config;
            try {
                //创建一个配置对象实例
                config = createConfig(cls, scopeModel);
                //设置id属性
                config.setId(id);
            } catch (Exception e) {
                throw new IllegalStateException("create config instance failed, id: " + id + ", type:" + cls.getSimpleName());
            }
            String key = null;
            boolean addDefaultNameConfig = false;
            try {
                // add default name config (same as id), e.g. dubbo.protocols.rest.port=1234
                //为该id的配置设置一个name属性到PropertiesConfiguration中，值就是id
                key = DUBBO + "." + AbstractConfig.getPluralTagName(cls) + "." + id + ".name";
                if (properties.getProperty(key) == null) {
                    properties.setProperty(key, id);
                    addDefaultNameConfig = true;
                }
                //刷新配置，也就是配置的覆盖
                config.refresh();
                //当前配置加入到configsCache中
                this.addConfig(config);
                tmpConfigs.add(config);
            } catch (Exception e) {
                logger.error("load config failed, id: " + id + ", type:" + cls.getSimpleName(), e);
                throw new IllegalStateException("load config failed, id: " + id + ", type:" + cls.getSimpleName());
            } finally {
                //移除name属性
                if (addDefaultNameConfig && key != null) {
                    properties.remove(key);
                }
            }
        }
    });
    // If none config of the type, try load single config
    //configsCache中还没有该类型的配置，那么加载单个配置
    if (this.getConfigs(cls).isEmpty()) {
        // load single config
        //获取全部配置map集合的列表
        List<Map<String, String>> configurationMaps = environment.getConfigurationMaps();
        //如果存在该配置
        if (ConfigurationUtils.hasSubProperties(configurationMaps, AbstractConfig.getTypePrefix(cls))) {
            T config;
            try {
                //创建对应配置类实例
                config = createConfig(cls, scopeModel);
                //刷新配置，涉及到了配置的优先级
                config.refresh();
            } catch (Exception e) {
                throw new IllegalStateException("create default config instance failed, type:" + cls.getSimpleName());
            }
            //添加配置到configManager
            this.addConfig(config);
            tmpConfigs.add(config);
        }
    }
    return tmpConfigs;
}
```

#### 2.1.1 getConfigurationMaps顺序加载配置集

方法将会获取全部配置集的配置map并存入一个list集合，并且赋值给Environment 的globalConfigurationMaps属性。

```java
/**
 * Environment的方法
 * 获取全局配置
 */
public List<Map<String, String>> getConfigurationMaps() {
    if (globalConfigurationMaps == null) {
        //获取配置并赋值给globalConfigurationMaps，参数都是null
        globalConfigurationMaps = getConfigurationMaps(null, null);
    }
    return globalConfigurationMaps;
}
/**
 * Environment的方法
 *
 * 获取配置map列表
 *
 * @param config 指定的配置类型
 * @param prefix 配置前缀
 */
public List<Map<String, String>> getConfigurationMaps(AbstractConfig config, String prefix) {
    // The sequence would be: SystemConfiguration -> EnvironmentConfiguration -> AppExternalConfiguration -> ExternalConfiguration  -> AppConfiguration -> AbstractConfig -> PropertiesConfiguration
    //按照配置加载的顺序存入list集合
    List<Map<String, String>> maps = new ArrayList<>();
    maps.add(systemConfiguration.getProperties());
    maps.add(environmentConfiguration.getProperties());
    maps.add(appExternalConfiguration.getProperties());
    maps.add(externalConfiguration.getProperties());
    maps.add(appConfiguration.getProperties());
    if (config != null) {
        ConfigConfigurationAdapter configurationAdapter = new ConfigConfigurationAdapter(config, prefix);
        maps.add(configurationAdapter.getProperties());
    }
    maps.add(propertiesConfiguration.getProperties());
    return maps;
}
```

**在随后查找配置的时候，根据此列表中的配置集map查找，因此列表的顺序，就是配置的优先级就是加入到list集合的顺序，顺序是：SystemConfiguration -> EnvironmentConfiguration -> AppExternalConfiguration -> ExternalConfiguration -> AppConfiguration -> AbstractConfig -> PropertiesConfiguration。**

**我们还可以看到，在Dubbo 3.1 版本中，没有了isConfigCenterFirst的判断，也就是说，目前版本的配置顺序是固定的，即配置中心优先级最高。**

**1、****systemConfiguration：用于获取来自JVM环境变量中的配置，例如-D的配置即通过System.getProperty(key)方法获取配置**；

**2、****environmentConfiguration：用于获取来自系统环境变量中的配置即通过System.getenv(key)方法获取配置**；

**3、****appExternalConfiguration：外部的应用程序级别配置，来自于远程配置中心config-center的应用程序配置**；

**4、****externalConfiguration：外部的全局级别配置，来自于远程配置中心config-center的全局/default配置**；

**5、****appConfiguration：本地应用配置，例如SpringEnvironment/PropertySources/application.properties**；

**6、****AbstractConfig：当前配置类实例调用该方法时本身就带有配置**；

**7、****propertiesConfiguration：用于加载dubbo.properties配置文件，默认路径在classpath下，可以通过JVM环境变量或者系统环境变量“dubbo.properties.file”属性指定其他路径**；

### 2.2 useRegistryAsConfigCenterIfNecessary配置中心兼容

出于兼容性的考虑，**当没有显式指定配置中心且registryConfig的useAsConfigCenter为null或true时，使用registry作为默认配置中心**。大概逻辑为：

**1、** 如果配置中心已加载，或者配置管理器中有配置中心的配置，直接返回；

**2、** 调用loadConfigsOfTypeFromProps方法，从dubbo配置集中加载注册中心配置，涉及到配置优先级，配置前缀为dubbo.registry；

**3、** 调用getDefaultRegistries方法，获取默认注册中心配置，如果registryConfig的isDefault为true或null，则表示默认注册中心遍历默认的注册中心：；

**4、** 调用isUsedRegistryAsConfigCenter方法，判断该注册中心可以作为配置中心，如果useAsConfigCenter属性为true或者该注册中心协议有对于该中心的扩展类型的实现类，那么就可以作为配置中心；

**5、** 调用registryAsConfigCenter方法，注册中心转配置中心，注册中心的配置属性作为配置中心的配置属性；

**6、** 将配置中心的配置实例添加到configManager的configsCache缓存；

```java
/**
 * DefaultApplicationDeployer的方法
 * <p>
 * 出于兼容性的考虑，当没有显式指定配置中心且registryConfig的useAsConfigCenter为null或true时，使用registry作为默认配置中心
 */
private void useRegistryAsConfigCenterIfNecessary() {
    // 根据DynamicConfiguration的加载状态（是否不为null），来判断ConfigCenter是否已经启动
    if (environment.getDynamicConfiguration().isPresent()) {
        //如果不为null，则说明已启动，直接返回
        return;
    }
    //如果配置管理器中有配置中心的配置，直接返回
    if (CollectionUtils.isNotEmpty(configManager.getConfigCenters())) {
        return;
    }
    // load registry
    /*
     * 从dubbo配置集中加载注册中心配置，涉及到配置优先级
     * 配置前缀为dubbo.registry
     */
    configManager.loadConfigsOfTypeFromProps(RegistryConfig.class);
    //获取默认注册中心配置，如果registryConfig的isDefault为null或true，则表示默认注册中心
    List<RegistryConfig> defaultRegistries = configManager.getDefaultRegistries();
    if (defaultRegistries.size() > 0) {
        defaultRegistries
            .stream()
            //如果该注册中心可以作为配置中心，如果useAsConfigCenter属性为true或者该注册中心协议有对于该中心的扩展类型的实现类，那么就可以作为配置中心
            .filter(this::isUsedRegistryAsConfigCenter)
            //注册中心的配置属性作为配置中心的配置属性
            .map(this::registryAsConfigCenter)
            .forEach(configCenter -> {
                //如果存在配置中心配置，则返回
                if (configManager.getConfigCenter(configCenter.getId()).isPresent()) {
                    return;
                }
                //添加配置到configManager的configsCache缓存
                configManager.addConfigCenter(configCenter);
                logger.info("use registry as config-center: " + configCenter);
            });
    }
}
```

#### 2.2.1 getDefaultRegistries获取默认注册中心

**获取默认注册中心和其他的默认配置一样，都是首先获取所有isDefault属性为true的配置并返回，如果没有则获取所有isDefault属性为null的配置并返回。**

```java
/**
 * ConfigManager的方法
 * <p>
 * 获取默认配置中心
 */
public List<RegistryConfig> getDefaultRegistries() {
    //获取默认配置
    return getDefaultConfigs(getConfigsMap(getTagName(RegistryConfig.class)));
}
/**
 * AbstractConfigManager的方法
 * <p>
 * 获取默认配置集合
 *
 * @param configsMap 配置集合map
 */
static <C extends AbstractConfig> List<C> getDefaultConfigs(Map<String, C> configsMap) {
    // find isDefault() == true
    //查找所有isDefault属性为true的配置
    List<C> list = configsMap.values()
        .stream()
        .filter(c -> TRUE.equals(AbstractConfigManager.isDefaultConfig(c)))
        .collect(Collectors.toList());
    //如果存在则返回
    if (list.size() > 0) {
        return list;
    }
    //查找所有isDefault属性为null的配置
    // find isDefault() == null
    list = configsMap.values()
        .stream()
        .filter(c -> AbstractConfigManager.isDefaultConfig(c) == null)
        .collect(Collectors.toList());
    //返回结果
    return list;
    // exclude isDefault() == false
}
```

#### 2.2.2 isUsedRegistryAsConfigCenter是否可以作为配置中心

注册中心是否可以作为配置中心。

```java
/**
 * DefaultApplicationDeployer的方法
 * <p>
 * 注册中心是否可以作为配置中心
 *
 * @param registryConfig 注册中心配置
 */
private boolean isUsedRegistryAsConfigCenter(RegistryConfig registryConfig) {
    //调用isUsedRegistryAsCenter方法
    return isUsedRegistryAsCenter(registryConfig, registryConfig::getUseAsConfigCenter, "config",
        DynamicConfigurationFactory.class);
}
```

内部调用了isUsedRegistryAsCenter通用方法，该方法可用于判断是否使用指定的注册中心属性作为配置中心or元数据中属性，即兼容配置中心和元数据中心的配置。该方法的大概逻辑为：

**1、** 首先获取注册中心配置的是否用作配置中心（useAsConfigCenter属性）or元数据中心（useAsMetadataCenter属性）配置，如果存在该属性则返回对应的值，否则的话需要继续判断；

**2、** 获取注册中心协议名，默认dubbo协议，扫描并判断该协议是否有对于该中心的扩展类型的实现类，例如对于配置中心工厂接口DynamicConfigurationFactory来说，zookeeper协议有ZookeeperDynamicConfigurationFactory实现，nacos协议则有NacosDynamicConfigurationFactory实现如果有对应的实现类，那么该注册中心的配置属性即可作为此配置中心or元数据中属性；

```java
/**
 * DefaultApplicationDeployer的方法
 *
 * 是否使用指定的注册中心属性作为配置中心or元数据中属性
 *
 * @param registryConfig       注册中心配置
 * @param usedRegistryAsCenter 是否用作配置中心 or 元数据中心 配置
 * @param centerType           中心的类型名称，center 或者 metadata
 * @param extensionClass       中心的扩展类型，例如DynamicConfigurationFactory或者MetadataReportFactory，用于创建中心实例
 * @return
 * @since 2.7.8
 */
private boolean isUsedRegistryAsCenter(RegistryConfig registryConfig, Supplier<Boolean> usedRegistryAsCenter,
                                       String centerType,
                                       Class<?> extensionClass) {
    final boolean supported;
    //是否用作配置中心 or 元数据中心 配置
    Boolean configuredValue = usedRegistryAsCenter.get();
    //存在该属性，则获取值并返回
    if (configuredValue != null) {
      // If configured, take its value.
        supported = configuredValue.booleanValue();
    }
    //不存在该属性，那么需要检查协议是否支持作为中兴
    else {
                            // Or check the extension existence
        //获取注册中心协议名，默认dubbo协议
        String protocol = registryConfig.getProtocol();
        //扫描并判断该协议是否有对于该中心的扩展类型的实现类，例如对于配置中心工厂接口DynamicConfigurationFactory来说
        //zookeeper协议有ZookeeperDynamicConfigurationFactory实现，nacos协议则有NacosDynamicConfigurationFactory实现
        supported = supportsExtension(extensionClass, protocol);
        if (logger.isInfoEnabled()) {
            logger.info(format("No value is configured in the registry, the %s extension[name : %s] %s as the %s center"
                , extensionClass.getSimpleName(), protocol, supported ? "supports" : "does not support", centerType));
        }
    }
    if (logger.isInfoEnabled()) {
        logger.info(format("The registry[%s] will be %s as the %s center", registryConfig,
            supported ? "used" : "not used", centerType));
    }
    return supported;
}
```

#### 2.2.3 registryAsConfigCenter注册中心转配置中心

将注册中心的配置转换为配置中心的配置。

```java
/**
 * DefaultApplicationDeployer的方法
 * <p>
 * 注册中心的配置转换为配置中心的配置
 *
 * @param registryConfig 注册中心的配置
 * @return 配置中心的配置
 */
private ConfigCenterConfig registryAsConfigCenter(RegistryConfig registryConfig) {
    //协议
    String protocol = registryConfig.getProtocol();
    //端口
    Integer port = registryConfig.getPort();
    //url地址
    URL url = URL.valueOf(registryConfig.getAddress(), registryConfig.getScopeModel());
    //id
    String id = "config-center-" + protocol + "-" + url.getHost() + "-" + port;
    //创建配置中心实例
    ConfigCenterConfig cc = new ConfigCenterConfig();
    //将注册中心的属性设置到配置中心对应的属性中
    cc.setId(id);
    cc.setScopeModel(applicationModel);
    if (cc.getParameters() == null) {
        cc.setParameters(new HashMap<>());
    }
    if (CollectionUtils.isNotEmptyMap(registryConfig.getParameters())) {
        cc.getParameters().putAll(registryConfig.getParameters()); // copy the parameters
    }
    cc.getParameters().put(CLIENT_KEY, registryConfig.getClient());
    cc.setProtocol(protocol);
    cc.setPort(port);
    if (StringUtils.isNotEmpty(registryConfig.getGroup())) {
        cc.setGroup(registryConfig.getGroup());
    }
    cc.setAddress(getRegistryCompatibleAddress(registryConfig));
    cc.setNamespace(registryConfig.getGroup());
    cc.setUsername(registryConfig.getUsername());
    cc.setPassword(registryConfig.getPassword());
    if (registryConfig.getTimeout() != null) {
        cc.setTimeout(registryConfig.getTimeout().longValue());
    }
    cc.setHighestPriority(false);
    return cc;
}
```

### 2.3 prepareEnvironment准备dubbo环境

该方法将会建立与远程配置中心的连接，并且拉取配置数据，并保存到本地内存中的environment对象的externalConfiguration和appExternalConfiguration这两个配置集中。

**1、** 校验该配置中心，这里校验配置中心的address不为空，且address包含"😕/"字符串或者protocol不为空，因为要建立连接，这些都不能为空；

**2、** 通过configCenter.toUrl方法基于配置中心的配置组装url地址；

**3、** 通过getDynamicConfiguration方法远程连接配置中心，创建DynamicConfiguration实例；

**4、** 拉取配置中心的全局级别和应用级别的配置并更新environment内部的externalConfiguration和appExternalConfiguration这两个缓存集合；

例如，组装后的zookeeper配置中心地址为：zookeeper://127.0.0.1:2181/org.apache.dubbo.config.ConfigCenterConfig?check=true&config-file=dubbo.properties&group=dubbo&include.spring.env=false&namespace=dubbo&timeout=20000，实际上，Dubbo中很多参数的传递都是通过url进行的。

zookeeper默认全局配置路径为/dubbo/config/dubbo/dubbo.properties，则默认应用程序级别的配置路径则为dubbo/config/{application.name}/dubbo.properties。全局配置是所有连接此配置中心的Dubbo客户端都可以获取的配置，而应用级别的配置则是具有此application.name的Dubbo客户端才可以获取的配置。

```java
/**
 * DefaultApplicationDeployer的方法
 * <p>
 * 建立与配置中心的连接，拉取配置数据，并保存到本地
 *
 * @param configCenter 配置中心
 * @return 动态配置对象
 */
private DynamicConfiguration prepareEnvironment(ConfigCenterConfig configCenter) {
    //该配置中心校验通过，这里校验配置中心的address不为空，且address包含"://"字符串或者protocol不为空
    if (configCenter.isValid()) {
        //CAS的更新initialized属性为true，该方法对于每个配置中心仅调用一次
        if (!configCenter.checkOrUpdateInitialized(true)) {
            return null;
        }
        //动态配置类
        DynamicConfiguration dynamicConfiguration;
        try {
            /*
             * 1 构建连接配置中心的url，随后根据protocol选择不同DynamicConfigurationFactory
             * 基于此工厂连接远程配置中心，并创建对应的dynamicConfiguration实例
             */
            dynamicConfiguration = getDynamicConfiguration(configCenter.toUrl());
        } catch (Exception e) {
            if (!configCenter.isCheck()) {
                logger.warn("The configuration center failed to initialize", e);
                configCenter.setInitialized(false);
                return null;
            } else {
                throw new IllegalStateException(e);
            }
        }
        /*
         * 2 拉取配置中心的全局级别和应用级别的配置并更新environment内部的externalConfiguration和appExternalConfiguration这两个缓存集合
         */
        //如果配置文件所映射到的key不为空，即config-file属性不为空，这个属性默认值为dubbo.properties
        if (StringUtils.isNotEmpty(configCenter.getConfigFile())) {
            /*
             * 从配置中心获取global全局级别的外部配置，key默认dubbo.properties，group默认dubbo
             * zookeeper - 默认全局路径/dubbo/config/dubbo/dubbo.properties
             */
            String configContent = dynamicConfiguration.getProperties(configCenter.getConfigFile(), configCenter.getGroup());
            //获取应用程序分组，即应用名
            String appGroup = getApplication().getName();
            String appConfigContent = null;
            if (isNotEmpty(appGroup)) {
                /*
                 * 从配置中心获取获取 application 应用级别的外部配置. zookeeper默认路径在 dubbo/config/当前应用名/dubbo.properties 中
                 */
                appConfigContent = dynamicConfiguration.getProperties
                    (isNotEmpty(configCenter.getAppConfigFile()) ? configCenter.getAppConfigFile() : configCenter.getConfigFile(),
                        appGroup
                    );
            }
            try {
                //全局级别的配置存入externalConfiguration缓存
                environment.updateExternalConfigMap(parseProperties(configContent));
                //应用级别的配置存入appExternalConfiguration缓存
                environment.updateAppExternalConfigMap(parseProperties(appConfigContent));
            } catch (IOException e) {
                throw new IllegalStateException("Failed to parse configurations from Config Center.", e);
            }
        }
        return dynamicConfiguration;
    }
    return null;
}
```

#### 2.3.1 getDynamicConfiguration连接配置中心

该方法通过config-center的指定连接URL远程连接配置中心获取DynamicConfiguration实例。

**1、** 首先会根据url中的协议类型，基于DubboSPI机制查找对应协议的工厂实现，例如zookeeper协议其工厂实现为ZookeeperDynamicConfigurationFactory；

**2、** 随后通过各个实现类的getDynamicConfiguration方法连接配置中心并且创建DynamicConfiguration对象；

```java
/**
 * DefaultApplicationDeployer的方法
 * <p>
 * 通过config-center的指定连接URL获取DynamicConfiguration实例
 *
 * @param connectionURL 配置中心指定的url
 */
private DynamicConfiguration getDynamicConfiguration(URL connectionURL) {
    //从配置中心协议url中获取协议，例如dubbo、zookeeper、nacos
    //完整的url地址例如：zookeeper://127.0.0.1:2181/org.apache.dubbo.config.ConfigCenterConfig?check=true&config-file=dubbo.properties&group=dubbo&include.spring.env=false&namespace=dubbo&timeout=20000
    String protocol = connectionURL.getProtocol();
    //基于Dubbo SPI机制查找对应协议的工厂实现，例如zookeeper协议其工厂实现为ZookeeperDynamicConfigurationFactory
    DynamicConfigurationFactory factory = ConfigurationUtils.getDynamicConfigurationFactory(applicationModel, protocol);
    //使用DynamicConfigurationFactory的实现创建DynamicConfiguration
    return factory.getDynamicConfiguration(connectionURL);
}
```

zookeeper协议的DynamicConfigurationFactory工厂实现为ZookeeperDynamicConfigurationFactory，我们看看他的实现：

```java
/**
 * AbstractDynamicConfigurationFactory的方法
 *
 * @param url 配置中心协议地址
 */
@Override
public final DynamicConfiguration getDynamicConfiguration(URL url) {
    //构建该配置中心协议地址的key，例如：zookeeper://127.0.0.1:2181/dubbo/org.apache.dubbo.config.ConfigCenterConfig
    String key = url == null ? DEFAULT_KEY : url.toServiceString();
    //连接配置中心 创建DynamicConfiguration并且存入缓存中，后续直接从缓存获取
    return dynamicConfigurations.computeIfAbsent(key, k -> createDynamicConfiguration(url));
}
/**
 * ZookeeperDynamicConfigurationFactory的方法
 * <p>
 * 连接配置中心 创建DynamicConfiguration
 */
@Override
protected DynamicConfiguration createDynamicConfiguration(URL url) {
    //内部保存着一个zkClient
    return new ZookeeperDynamicConfiguration(url, zookeeperTransporter);
}
/**
 * ZookeeperDynamicConfiguration的构造器
 * <p>
 * 连接zk服务
 *
 * @param url                  远程服务地址
 * @param zookeeperTransporter
 */
ZookeeperDynamicConfiguration(URL url, ZookeeperTransporter zookeeperTransporter) {
    super(url);
    //缓存监听器
    this.cacheListener = new CacheListener();
    //线程名
    final String threadName = this.getClass().getSimpleName();
    //单个线程的线程池执行器，处理被监听的事件
    this.executor = new ThreadPoolExecutor(DEFAULT_ZK_EXECUTOR_THREADS_NUM, DEFAULT_ZK_EXECUTOR_THREADS_NUM,
        THREAD_KEEP_ALIVE_TIME, TimeUnit.MILLISECONDS,
        new LinkedBlockingQueue<>(DEFAULT_QUEUE),
        new NamedThreadFactory(threadName, true),
        new AbortPolicyWithReport(threadName, url));
    //连接zk服务器创建zkClient
    zkClient = zookeeperTransporter.connect(url);
    //没有连接成功则抛出异常
    boolean isConnected = zkClient.isConnected();
    if (!isConnected) {
        IllegalStateException illegalStateException =
            new IllegalStateException("Failed to connect with zookeeper, pls check if url " + url + " is correct.");
        if (logger != null) {
            logger.error("5-1", "configuration server offline", "",
                "Failed to connect with zookeeper", illegalStateException);
        }
        throw illegalStateException;
    }
}
```

## 3 loadApplicationConfigs加载应用程序配置

在启动连接了配置中心并拉取了配置之后，将会调用loadApplicationConfigs方法加载应用程序配置，内部实际上还是委托configManager进行配置的加载。

```java
/**
 * DefaultApplicationDeployer的方法
 * 加载全部应用程序配置
 */
private void loadApplicationConfigs() {
    //通过configManager加载全部应用程序配置
    configManager.loadConfigs();
}
```

configManager#loadConfigs方法大概步骤为：

**1、** 首先调用loadConfigsOfTypeFromProps方法加载各种指定类型的配置，某些配置此前就加载过了，比如ApplicationConfig应用程序配置；

**2、** 调用refreshAll方法，内部还是依赖ConfigManager刷新全部配置，实际上就是Dubbo配置的重写（基于优先级覆盖配置属性）；

**3、** 调用checkConfigs方法检查配置：；

**1、** 某些配置不存在但是必须有，就会创建默认配置；

**2、** 通过ConfigValidator.validate方法校验配置，默认实现为DefaultConfigValidator；

**3、** 检查端口冲突，不同的ProtocolConfig不同使用同一个port端口；

**4、** 如果模型名不存在，则设置模型名称为应用程序名；

```java
/**
 * ConfigManager的方法
 * <p>
 * 加载全部配置并刷新
 */
@Override
public void loadConfigs() {
    //在启动配置中心之前，应用程序配置已加载
    // load dubbo.applications.xxx
    //加载应用程序配置，每个应用必须要有且只有一个 application 配置
    loadConfigsOfTypeFromProps(ApplicationConfig.class);
    // load dubbo.monitors.xxx
    //加载dubbo监控中心配置
    loadConfigsOfTypeFromProps(MonitorConfig.class);
    // load dubbo.metrics.xxx
    //加载dubbo指标配置
    loadConfigsOfTypeFromProps(MetricsConfig.class);
    // load multiple config types:
    // load dubbo.protocols.xxx
    //加载dubbo服务提供者协议配置，该配置可能有多个
    loadConfigsOfTypeFromProps(ProtocolConfig.class);
    // load dubbo.registries.xxx
    //加载dubbo注册中心配置，该配置可能有多个
    loadConfigsOfTypeFromProps(RegistryConfig.class);
    // load dubbo.metadata-report.xxx
    //加载dubbo元数据中心配置
    loadConfigsOfTypeFromProps(MetadataReportConfig.class);
    //在启动配置中心之前，已加载配置中心，这里不再加载
    //loadConfigsOfTypeFromProps(ConfigCenterConfig.class);
    //刷新全部的配置
    refreshAll();
    /*
     * 检查配置
     * 1. 某些配置不存在但是必须有，就会创建默认配置
     * 2. 通过ConfigValidator.validate方法校验配置，默认实现为DefaultConfigValidator
     * 3. 检查端口冲突，不同的ProtocolConfig不同使用同一个port端口
     */
    checkConfigs();
    // 设置模型名称为应用程序名
    if (StringUtils.isBlank(applicationModel.getModelName())) {
        applicationModel.setModelName(applicationModel.getApplicationName());
    }
}
```

### 3.1 refreshAll刷新全部配置

ConfigManager的refreshAll方法刷新全部应用程序配置。

```java
/**
 * ConfigManager的方法
 * <p>
 * 刷新全部配置，实际上就是Dubbo配置的重写（基于优先级覆盖配置属性）
 */
@Override
public void refreshAll() {
    // refresh all configs here
    //刷新应用程序配置
    getApplication().ifPresent(ApplicationConfig::refresh);
    //刷新dubbo监控中心配置
    getMonitor().ifPresent(MonitorConfig::refresh);
    //刷新dubbo指标配置
    getMetrics().ifPresent(MetricsConfig::refresh);
    //刷新ssl配置
    getSsl().ifPresent(SslConfig::refresh);
    //下面的配置可能有多个，全部刷新
    //刷新dubbo服务提供者协议配置
    getProtocols().forEach(ProtocolConfig::refresh);
    //刷新dubbo注册中心配置
    getRegistries().forEach(RegistryConfig::refresh);
    //刷新dubbo配置中心配置
    getConfigCenters().forEach(ConfigCenterConfig::refresh);
    //刷新dubbo元数据中心配置
    getMetadataConfigs().forEach(MetadataReportConfig::refresh);
}
```

#### 3.1.1 refresh刷新配置

通过前面的源码我们知道，在loadConfigsOfTypeFromProps方法、startConfigCenter方法、refreshAll方法中，都涉及到refresh方法的调用，该方法用于配置的刷新，实际上就是基于配置的优先级进行配置的重写（覆盖），下面我们看看它的源码。

实际上refresh方法的主体逻辑是配置类的父类AbstractConfig实现的，目前版本仅有ApplicationConfig配置类重写了该方法。大概逻辑为：

**1、** 调用**preProcessRefresh**，刷新的前置处理逻辑，默认空实现，但是ServiceConfigBase和ReferenceConfigBase都重写了该方法，用于初始化默认的ProviderConfig和ConsumerConfig；

**2、** 调用**getConfigurationMaps**方法，获取全部配置map集合的列表，列表顺序就是配置的优先级顺序在Dubbo3.1版本中，没有了isConfigCenterFirst的判断，也就是说，目前版本的配置顺序是固定的，即配置中心优先级最高顺序是：SystemConfiguration->EnvironmentConfiguration->AppExternalConfiguration->ExternalConfiguration->AppConfiguration->PropertiesConfiguration；

**3、** 获取该配置类的一个首选配置**前缀**，后续将会以此前缀在配置集中查找配置；

**1、** 通过**getPrefixes**方法获取当前配置支持的前缀列表，将会尝试查找dubbo.{tag-name}s.{id}、dubbo.{tag-name}s.{name}、dubbo.{tag-name}三种一般来说大部分单个配置都是使用dubbo.{tag-name}这一种，但是前两种的查找优先级最高，因为前两种最精确；

**4、** 调用**getConfigurationMaps**方法，尝试获取该配置类实例中具有给定前缀的配置，并且加入到合并配置映射列表中的倒数第二位，顺序是：SystemConfiguration->EnvironmentConfiguration->AppExternalConfiguration->ExternalConfiguration->AppConfiguration->AbstractConfig->PropertiesConfiguration也就是说，当前配置类对象已有的配置，放在倒数第二位，可能会被覆盖；

**5、** 调用**getSubProperties**方法，从优先级映射列表中查找具有指定前缀的配置并提取子属性，即返回的map的key去除了前缀，对于相同的key，取排在前面的映射的值即配置的优先级处理；

**6、** 调用**assignProperties**方法，根据找到的配置结果映射设置配置属性，虽然上一步查找时已经经过了优先级处理，但是具体是否会覆盖已存在的属性，还得看ConfigMode这个属性；

**7、** 调用**processExtraRefresh**方法，处理额外的刷新逻辑，默认空实现，子类MethodConfig重写了该方法，用于刷新方法配置；

**8、** 调用**postProcessRefresh**方法，刷新的后置处理逻辑，默认实现为调用checkDefault方法检查并设置某些字段的默认值，不同的子类有不同的实现例如ApplicationConfig会检查如果protocol为null，则默认设置为dubbo，如果hostname为null，则默认设置为LocalHost的hostname；

**9、** 最后设置当前配置实例的**refreshed**属性值为true，表示该配置已刷新；

```java
/**
 * AbstractConfig的方法
 * <p>
 * Dubbo config property override
 * 刷新配置，Dubbo配置的重写（基于优先级的覆盖）
 */
public void refresh() {
    try {
        // check and init before do refresh
        /*
         * 1 配置刷新的前置处理逻辑
         * ServiceConfigBase和ReferenceConfigBase都重写了该方法，用于初始化默认的ProviderConfig和ConsumerConfig
         */
        preProcessRefresh();
        //获取此配置实例的作用域模型
        Environment environment = getScopeModel().getModelEnvironment();
        //获取全部配置map集合的列表，列表顺序就是配置的优先级顺序
        //在Dubbo 3.1 版本中，没有了isConfigCenterFirst的判断，也就是说，目前版本的配置顺序是固定的，即配置中心优先级最高。
        //顺序是：SystemConfiguration -> EnvironmentConfiguration -> AppExternalConfiguration -> ExternalConfiguration -> AppConfiguration -> PropertiesConfiguration。
        List<Map<String, String>> configurationMaps = environment.getConfigurationMaps();
        // Search props starts with PREFIX in order
        /*
         * 2 获取一个首选配置前缀
         */
        String preferredPrefix = null;
        //获取当前配置支持的前缀列表，将会尝试查找dubbo.{tag-name}s.{id}、dubbo.{tag-name}s.{name}、dubbo.{tag-name}三种
        //一般来说大部分单个配置都是使用dubbo.{tag-name}这一种，但是前两种的查找优先级最高，因为前两种最精确
        List<String> prefixes = getPrefixes();
        for (String prefix : prefixes) {
            //如果配置集中有该前缀的配置，那么就是用该前缀
            if (ConfigurationUtils.hasSubProperties(configurationMaps, prefix)) {
                preferredPrefix = prefix;
                break;
            }
        }
        //如果没找到前缀，那么使用列表的第一个值作为前桌
        if (preferredPrefix == null) {
            preferredPrefix = prefixes.get(0);
        }
        // Extract sub props (which key was starts with preferredPrefix)
        //尝试获取该配置类实例中具有给定前缀的配置，并且加入到合并配置映射列表中的倒数第二位
        //顺序是：SystemConfiguration -> EnvironmentConfiguration -> AppExternalConfiguration -> ExternalConfiguration -> AppConfiguration -> AbstractConfig -> PropertiesConfiguration。
        Collection<Map<String, String>> instanceConfigMaps = environment.getConfigurationMaps(this, preferredPrefix);
        /*
         * 3 从优先级映射列表中查找具有指定前缀的配置并提取子属性，即返回的map的key去除了前缀
         * 对于相同的key，取排在前面的映射的值
         */
        Map<String, String> subProperties = ConfigurationUtils.getSubProperties(instanceConfigMaps, preferredPrefix);
        //将获取到的配置存入一个内存配置实例InmemoryConfiguration的store属性
        InmemoryConfiguration subPropsConfiguration = new InmemoryConfiguration(subProperties);
        //如果日志支持debug级别，那么输出debug日志，默认不支持
        if (logger.isDebugEnabled()) {
            String idOrName = "";
            if (StringUtils.hasText(this.getId())) {
                idOrName = "[id=" + this.getId() + "]";
            } else {
                String name = ReflectUtils.getProperty(this, "getName");
                if (StringUtils.hasText(name)) {
                    idOrName = "[name=" + name + "]";
                }
            }
            logger.debug("Refreshing " + this.getClass().getSimpleName() + idOrName +
                " with prefix [" + preferredPrefix +
                "], extracted props: " + subProperties);
        }
        /*
         * 3 设置配置属性
         */
        assignProperties(this, environment, subProperties, subPropsConfiguration);
        // process extra refresh of subclass, e.g. refresh method configs
        /*
         * 4 处理子类的额外刷新逻辑，例如刷新方法配置
         */
        processExtraRefresh(preferredPrefix, subPropsConfiguration);
    } catch (Exception e) {
        logger.error("Failed to override field value of config bean: " + this, e);
        throw new IllegalStateException("Failed to override field value of config bean: " + this, e);
    }
    /*
     * 5 刷新的后处理逻辑
     */
    postProcessRefresh();
    //设置当前配置实例的refreshed标记为true
    refreshed.set(true);
}
```

##### 3.1.1.1 getPrefixes获取配置前缀

通过getPrefixes方法获取当前配置支持的前缀列表，将会尝试查找dubbo.{tag-name}s.{id}、dubbo.{tag-name}s.{name}、dubbo.{tag-name}三种。

一般来说大部分单个配置都是使用dubbo.{tag-name}这一种，但是前两种的查找优先级最高，因为前两种最精确。

```java
/**
 * AbstractConfig的方法
 * 
 * 获取当前配置支持的前缀列表
 */
@Parameter(excluded = true, attribute = false)
public List<String> getPrefixes() {
    List<String> prefixes = new ArrayList<>();
    //如果存在id，那么设置dubbo.{tag-name}s.{id}，优先级最高
    if (StringUtils.hasText(this.getId())) {
        // dubbo.{tag-name}s.{id}
        prefixes.add(CommonConstants.DUBBO + "." + getPluralTagName(this.getClass()) + "." + this.getId());
    }
    //如果存在name，那么设置dubbo.{tag-name}s.{name}
    // check name
    String name = ReflectUtils.getProperty(this, "getName");
    if (StringUtils.hasText(name)) {
        // dubbo.{tag-name}s.{name}
        String prefix = CommonConstants.DUBBO + "." + getPluralTagName(this.getClass()) + "." + name;
        if (!prefixes.contains(prefix)) {
            prefixes.add(prefix);
        }
    }
    //最后设置dubbo.{tag-name}，优先级最低
    // dubbo.{tag-name}
    prefixes.add(getTypePrefix(this.getClass()));
    return prefixes;
}
```

##### 3.1.1.2 getSubProperties获取优先级配置列表

该方法是Dubbo刷新配置的核心方法，将会查找指定前缀的属性并提取子属性。

该方法将会依次遍历优先级的配置映射列表并提取子属性，对于同样的key，取排在前的映射的结果，这就是Dubbo配置优先级的原理，还是很简单的是不是？

```java
/**
 * ConfigurationUtils的方法
 * <p>
 * 查找指定前缀的属性并提取子属性
 * <pre>
 * properties
 * dubbo.protocol.name=dubbo
 * dubbo.protocol.port=1234
 *
 * extract protocol props
 * Map props = getSubProperties("dubbo.protocol.");
 *
 * result
 * props: {"name": "dubbo", "port" : "1234"}
 *
 * </pre>
 *
 * @param configMaps 优先级的配置映射列表
 * @param prefix     前缀
 * @return 子属性映射
 */
public static <V extends Object> Map<String, V> getSubProperties(Collection<Map<String, V>> configMaps, String prefix) {
    Map<String, V> map = new LinkedHashMap<>();
    //按照列表顺序遍历映射，查找指定前缀的属性并提取子属性
    //相同的key，取排在前的映射的结果
    for (Map<String, V> configMap : configMaps) {
        getSubProperties(configMap, prefix, map);
    }
    return map;
}
/**
 * ConfigurationUtils的方法
 * <p>
 * 查找指定前缀的属性并提取子属性
 * <pre>
 * properties
 * dubbo.protocol.name=dubbo
 * dubbo.protocol.port=1234
 *
 * extract protocol props
 * Map props = getSubProperties("dubbo.protocol.");
 *
 * result
 * props: {"name": "dubbo", "port" : "1234"}
 *
 * </pre>
 *
 * @param configMaps 优先级的配置映射列表
 * @param prefix     前缀
 * @return 子属性映射
 */
public static <V extends Object> Map<String, V> getSubProperties(Collection<Map<String, V>> configMaps, String prefix) {
    Map<String, V> map = new LinkedHashMap<>();
    //按照列表顺序遍历映射，查找指定前缀的属性并提取子属性
    //相同的key，取排在前的映射的结果
    for (Map<String, V> configMap : configMaps) {
        getSubProperties(configMap, prefix, map);
    }
    return map;
}
```

##### 3.1.1.3 assignProperties设置属性

在调用getSubProperties方法，从优先级映射列表中查找具有指定前缀的配置并提取子属性之后，调用assignProperties方法设置属性。

虽然这些属性在上一步查找时已经经过了优先级处理，获取的都是优先级最高的属性，但是具体是否会覆盖已存在的属性，还得看ConfigMode这个属性。常见模式为：

**1、** 如果Dubbo配置模式是**OVERRIDE_IF_ABSENT**，那么仅接受目前的配置，只有当目前的配置属性不存在（为null）时才（覆盖）接收最新的配置，也就是说不允许覆盖已经有值的属性；

**2、** 如果Dubbo配置模式是**OVERRIDE_IF_ABSENT**，那么仅接受目前的配置，只有当目前的配置属性不存在（为null）时才（覆盖）接收最新的配置，也就是说不允许覆盖已经有值的属性；

**3、** 如果Dubbo配置模式是**OVERRIDE_ALL**，那么覆盖所有配置属性，即使目前存在配置值；

**4、** 默认的Dubbo模式为**Strict**，对于唯一的配置类型只接受一个配置，如果发现一个唯一的配置类型有多个配置，则抛出异常；

从该方法的源码中可以得知，Dubbo将会设置三种方法的属性：

**1、****普通setter方法**：方法名以set开头，并且方法名不等于set，并且是public的方法，并且只有一个参数，并且参数类型为基本类型或者简单类型；

**1、** 该类型方法参数为简单类型、基本类型或者String；

**2、** 如果配置模式为OVERRIDE_IF_ABSENT且属性已设置，则跳过该属性的覆盖否则，将会进行属性值的覆盖；

**2、****setParameters方法**：方法名是setParameters，并且是public的方法，并且只有一个参数且参数类型为Map，并且返回值为Void；

**1、** 该方法参数固定为Map类型，名字固定为parameters；

**2、** 在设置值的时候，会和此前的值机进行比较：；

1. 如果mode为OVERRIDE_IF_ABSENT，将所有旧映射项放到新映射中，将覆盖相同的键。
2. 如果模式为OVERRIDE_ALL，将所有不在新映射中的键输入项从旧映射到新映射(忽略旧映射中出现的相同键)。
3. 如果模式是任何其他模式，则用全部覆盖旧映射。

**3、****嵌套类参数方法**：这种setter方法的参数是对象类型，且配置类中该参数属性的字段上有@Nested注解；

**1、** 那么需要对这个参数创建实例，然后从映射中查找指定前缀的属性并提取子属性，并且对该参数实例调用assignProperties，即填充参数实例；

**2、** 最后将填充了的参数实例通过反射调用该方法设置给这个配置类实例；

```java
/**
 * AbstractConfig的方法
 * <p>
 * 设置配置属性
 *
 * @param obj           配置类实例
 * @param environment   当前环境
 * @param properties    要被设置的配置集合
 * @param configuration 要被设置的配置内存实例
 */
private void assignProperties(Object obj, Environment environment, Map<String, String> properties, InmemoryConfiguration configuration) {
    //默认ConfigMode是Strict，对于唯一的配置类型只接受一个配置，如果发现一个唯一的配置类型有多个配置，则抛出异常。
    // if old one (this) contains non-null value, do not override
    //Dubbo配置模式是否是OVERRIDE_IF_ABSENT
    //接受目前的配置，只有当目前的配置属性不存在（为null）时才（覆盖）接收最新的配置
    boolean overrideIfAbsent = getConfigMode() == ConfigMode.OVERRIDE_IF_ABSENT;
    // even if old one (this) contains non-null value, do override
    //Dubbo配置模式是否是OVERRIDE_ALL
    //覆盖所有配置属性，即使目前存在配置值
    boolean overrideAll = getConfigMode() == ConfigMode.OVERRIDE_ALL;
    // loop methods, get override value and set the new value back to method
    //获取声明类的所有公共方法，包括继承的方法，排除Object类的方法
    List<Method> methods = MethodUtils.getMethods(obj.getClass(), method -> method.getDeclaringClass() != Object.class);
    //获取当前实例的所有方法，不包括继承的方法
    Method[] methodsList = this.getClass().getDeclaredMethods();
    for (Method method : methods) {
        //如果该方法的方法名以set开头，并且方法名不等于set，并且是public的方法，并且只有一个参数，并且参数类型为基本类型或者简单类型
        if (MethodUtils.isSetter(method)) {
            //获取参数名，就是setXxx方法名截取set之后并且第一个字母小写的结果
            String propertyName = extractPropertyName(method.getName());
            // if config mode is OVERRIDE_IF_ABSENT and property has set, skip
            //如果配置模式为OVERRIDE_IF_ABSENT且属性已设置，则跳过该属性的覆盖
            if (overrideIfAbsent && isPropertySet(methodsList, propertyName)) {
                continue;
            }
            // convert camelCase/snake_case to kebab-case
            //转换参数名
            String kebabPropertyName = StringUtils.convertToSplitName(propertyName, "-");
            try {
                //去除前后空格
                String value = StringUtils.trim(configuration.getString(kebabPropertyName));
                // isTypeMatch() is called to avoid duplicate and incorrect update, for example, we have two 'setGeneric' methods in ReferenceConfig.
                //调用isTypeMatch()是为了避免重复和不正确的更新，例如，我们在ReferenceConfig中有两个'setGeneric'方法。
                if (StringUtils.hasText(value)
                    && ClassUtils.isTypeMatch(method.getParameterTypes()[0], value)
                    && !isIgnoredAttribute(obj.getClass(), propertyName)) {
                    //根据属性名获取属性值
                    value = environment.resolvePlaceholders(value);
                    //反射调用该方法，将该值作为参数设置进去
                    method.invoke(obj, ClassUtils.convertPrimitive(ScopeModelUtil.getFrameworkModel(getScopeModel()), method.getParameterTypes()[0], value));
                }
            } catch (Exception e) {
                logger.info("Failed to override the property " + method.getName() + " in " +
                    obj.getClass().getSimpleName() +
                    ", please make sure every property has getter/setter method provided.");
            }
        }
        //如果方法名是setParameters，并且是public的方法，并且只有一个参数且参数类型为Map，并且返回值为Void
        else if (isParametersSetter(method)) {
            //获取参数名，就是parameters
            String propertyName = extractPropertyName(method.getName());
            //根据属性名获取属性值
            String value = StringUtils.trim(configuration.getString(propertyName));
            //将字符串类型的值，转换为Map类型
            Map<String, String> parameterMap;
            if (StringUtils.hasText(value)) {
                parameterMap = StringUtils.parseParameters(value);
            } else {
                // in this case, maybe parameters.item3=value3.
                parameterMap = ConfigurationUtils.getSubProperties(properties, PARAMETERS);
            }
            Map<String, String> newMap = convert(parameterMap, "");
            if (CollectionUtils.isEmptyMap(newMap)) {
                continue;
            }
            // get old map from original obj
            Map<String, String> oldMap = null;
            try {
                //获取getParameters方法
                String getterName = calculatePropertyToGetter(propertyName);
                Method getterMethod = this.getClass().getDeclaredMethod(getterName);
                //获取旧的parameters属性值
                Object oldOne = getterMethod.invoke(this);
                if (oldOne instanceof Map) {
                    oldMap = (Map) oldOne;
                }
            } catch (Exception ignore) {
            }
            // if old map is null, directly set params
            //如果旧映射值为空，直接设置参数
            if (oldMap == null) {
                invokeSetParameters(newMap, obj);
                continue;
            }
            // if mode is OVERRIDE_IF_ABSENT, put all old map entries to new map, will override the same key
            // if mode is OVERRIDE_ALL, put all keyed entries not in new map from old map to new map (ignore the same key appeared in old map)
            // if mode is others, override with new map
            //如果mode为OVERRIDE_IF_ABSENT，将所有旧映射项放到新映射中，将覆盖相同的键
            //如果模式为OVERRIDE_ALL，将所有不在新映射中的键输入项从旧映射到新映射(忽略旧映射中出现的相同键)
            //如果模式是others，则用全部覆盖旧映射
            if (overrideIfAbsent) {
                newMap.putAll(oldMap);
            } else if (overrideAll) {
                oldMap.forEach(newMap::putIfAbsent);
            }
            //反射设置值
            invokeSetParameters(newMap, obj);
        }
        //如果是嵌套类参数的setter方法，也就是说，这种方法的参数是对象类型，且配置类中该参数属性的字段上有@Nested注解
        //那么需要对这个参数创建实例，然后从映射中查找指定前缀的属性并提取子属性，并且对该参数实例调用assignProperties，即填充参数实例
        //最后将填充了的参数实例通过反射设置给这个配置类实例
        else if (isNestedSetter(obj, method)) {
            try {
                //获取方法参数类型
                Class<?> clazz = method.getParameterTypes()[0];
                //创建参数实例
                Object inner = clazz.getDeclaredConstructor().newInstance();
                //获取参数名
                String fieldName = MethodUtils.extractFieldName(method);
                //从映射中查找指定前缀的属性并提取子属性
                Map<String, String> subProperties = ConfigurationUtils.getSubProperties(properties, fieldName);
                InmemoryConfiguration subPropsConfiguration = new InmemoryConfiguration(subProperties);
                //将找到的属性映射填充参数实例
                assignProperties(inner, environment, subProperties, subPropsConfiguration);
                //反射调用方法，将被填充的对象参数设置给当前配置类实例
                method.invoke(obj, inner);
            } catch (ReflectiveOperationException e) {
                throw new IllegalStateException("Cannot assign nested class when refreshing config: " + obj.getClass().getName(), e);
            }
        }
    }
}
```

## 4 initModuleDeployers初始化ModuleDeployer

该方法将会对于ApplicationModel里面的全部ModuleModel的ModuleDeployer执行initialize初始化方法。

ModuleModel内部的ModuleDeployer是DefaultModuleDeployer类型，它的initialize方法我们下面再讲。

```java
/**
 * DefaultApplicationDeployer的方法
 * 初始化ModuleDeployer
 */
private void initModuleDeployers() {
    // make sure created default module
    //确保创建了默认的ModuleModel，在DubboSpringInitializer#initContext方法中就调用雇了该方法创建了默认ModuleModel
    applicationModel.getDefaultModule();
    // copy modules and initialize avoid ConcurrentModificationException if add new module
    List<ModuleModel> moduleModels = new ArrayList<>(applicationModel.getModuleModels());
    //循环调用每一个ModuleModel的initialize方法执行初始化
    for (ModuleModel moduleModel : moduleModels) {
        moduleModel.getDeployer().initialize();
    }
}
```
