# 06、Dubbo 3.x 源码解析 - Dubbo3域模型以及Model和Environment初始化【一万字】
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/6.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo 3域模型的概念以及Model和Environment初始化。

此前我们学习了[Dubbo xml配置的加载](/zhuanlan/j2ee/dubbo/2/5.html)的源码，那篇文章里实际上已经接触过了域模型的概念，本篇文章来证实学习Dubbo3中的域模型以及Model和Environment初始化源码。

## 1 Dubbo3域模型简介

在了[Dubbo xml配置的加载](/zhuanlan/j2ee/dubbo/2/5.html)的文章中，在initContext方法内部的customize 方法的源码中，通过SPI获取DubboSpringInitCustomizer 的实现的时候，我们可以看到这里获取了一个**FrameworkModel**对象，随后通过FrameworkModel对象来获取ExtensionLoader并实现Dubbo SPI加载的。

**这里和Dubbo之前的版本是不一样的，Dubbo3新增了域模型，这里的FrameworkModel是dubbo核心框架模型，可与多个应用程序共享。另外，还有两个模型ApplicationModel应用程序模型，其代表某个应用程序，ModuleModel模块模型，其代表某个模块。这些域主要用于支持多应用程序部署，以及不同作用域下的配置和环境的管理。**

**三层模型的作用范围的关系为逻辑上的包含关系：FrameworkModel包含ApplicationModel包含ModuleModel，即通过属性持有下级模型的引用**。在初始化这些域模型的时候，都是联动加载，即初始化外层模型，那么对应内层模型也会加载。例如这里的defaultModel()方法会获取FrameworkModel实例，没有则创建，在随后的FrameworkModel#initialize方法中，又会构建ApplicationModel应用程序模型，而在ApplicationModell#initialize方法中，又会构建ModuleModel模块模型。

**另外，所有的Dubbo模型都实现了ExtensionAccessor接口，都拥有获取Dubbo SPI扩展的能力。在Dubbo3中，获取Dubbo SPI扩展不再是通过ExtensionLoader.getExtensionLoader方法，该方法被标注为废弃，而是调用域模型的getExtensionLoader默认方法通过ExtensionDirector获取ExtensionLoader。**

关于Dubbo3新增的Model模型体系的详细说明以及源码，我们下面详细讲解。

## 2 FrameworkModel的创建和初始化

Dubbo3的领域模型基于单例设计模式，通过固定的静态方法获取或者创建、初始化单例实例。默认模型通过defaultModel方法获取。

下面的FrameworkModel的defaultModel方法。

```java
/**
 * During destroying the default FrameworkModel, the FrameworkModel.defaultModel() or ApplicationModel.defaultModel()
 * will return a broken model, maybe cause unpredictable problem.
 * Recommendation: Avoid using the default model as much as possible.
 *
 * 在销毁默认的FrameworkModel时，FrameworkModel.defaultmodel()或ApplicationModel.defaultModel()将返回一个损坏的模型
 * 可能会导致不可预知的问题。建议:尽可能避免使用默认模型。
 * @return the global default FrameworkModel
 */
public static FrameworkModel defaultModel() {
    //defaultInstance这个静态变量保存着默认的FrameworkModel实例
    FrameworkModel instance = defaultInstance;
    if (instance == null) {
        //加全局锁
        synchronized (globalLock) {
            //重置默认模型
            resetDefaultFrameworkModel();
            //双重校验，如果默认模型仍为null，则创建一个
            if (defaultInstance == null) {
                defaultInstance = new FrameworkModel();
            }
            instance = defaultInstance;
        }
    }
    Assert.notNull(instance, "Default FrameworkModel is null");
    return instance;
}
```

### 2.1 resetDefaultFrameworkModel重置默认模型

该方法重置默认的FrameworkModel模型，实际上就是从从allInstances列表获取第一个实例作为重置后的实例。

```java
/**
 * FrameworkModel的方法
 * 重置默认FrameworkModel
 */
private static void resetDefaultFrameworkModel() {
    //加全局锁
    synchronized (globalLock) {
        //如果实例已经销毁则直接返回
        if (defaultInstance != null && !defaultInstance.isDestroyed()) {
            return;
        }
        FrameworkModel oldDefaultFrameworkModel = defaultInstance;
        //从allInstances列表获取第一个实例作为重置后的实例
        if (allInstances.size() > 0) {
            defaultInstance = allInstances.get(0);
        } else {
            defaultInstance = null;
        }
        if (oldDefaultFrameworkModel != defaultInstance) {
            if (LOGGER.isInfoEnabled()) {
                LOGGER.info("Reset global default framework from " + safeGetModelDesc(oldDefaultFrameworkModel) + " to " + safeGetModelDesc(defaultInstance));
            }
        }
    }
}
```

### 2.2 new创建FrameworkModel实例

**通过调用构造器创建一个FrameworkModel实例，这个构造器中的一系列操作时Dubbo3启动初始化过程中的核心操作之一。**

**新创建的实例，将会被设置为默认FrameworkModel实例，最后调用initialize方法进行一系列初始化操作，非常重要。**

```java
public FrameworkModel() {
    //调用父类ScopeModel构造器，设置父模型为null，表示它是顶层的模型，模型领域为FRAMEWORK，且不是内部领域模型
    super(null, ExtensionScope.FRAMEWORK, false);
    //设置一个一级的全局递增编号，从1开始，例如 1 、2
    this.setInternalId(String.valueOf(index.getAndIncrement()));
    // register FrameworkModel instance early
    //加全局锁
    synchronized (globalLock) {
        //将当前实例加入到内部的allInstances集合中
        allInstances.add(this);
        //重置默认FrameworkModel为当前新增的模型
        resetDefaultFrameworkModel();
    }
    if (LOGGER.isInfoEnabled()) {
        LOGGER.info(getDesc() + " is created");
    }
    /*
     * 一系列初始化操作，非常重要
     */
    initialize();
}
```

### 2.3 Initialize初始化FrameworkModel

该方法用于初始化FrameworkModel，大概逻辑为：

该方法用于初始化FrameworkModel，大概逻辑为：

**1、** 调用父类ScopeModel的初始化方法initialize，用于初始化该模型自己的**extensionDirector**、**ScopeBeanFactory**等属性；

**2、** 基于DubboSPI机制初始化类型构建器**TypeBuilder**的实例集合，保存到TypeDefinitionBuilderTypeBuilder用于支持泛型；

**3、** 基于DubboSPI机制加载**ScopeModelInitializer**扩展点，并且调用所有扩展点的initializeFrameworkModel实现自定义逻辑Dubbo提供了很多ScopeModelInitializer实现；

**4、** 创建内部的**ApplicationModel**实例，赋值给internalApplicationModel属性，这是联动创建的子级模型，即应用程序模型；

**5、** 向ApplicationModel内部的ApplicationConfigManager的configsCache缓存中的注册一个config，该config是一个**ApplicationConfig**，对应着[dubbo:applicationname=“xx”](dubbo:applicationname=“xx”)标签；

```java
/**
 * FrameworkModel的方法
 * <p>
 * 初始化模型
 */
@Override
protected void initialize() {
    /*
     * 1 调用父类ScopeModel的初始化方法
     */
    super.initialize();
    /*
     * 2 基于Dubbo SPI机制初始化类型构建器TypeBuilder类型集合
     */
    TypeDefinitionBuilder.initBuilders(this);
    //创建Framework级别的服务存储仓库，其内部保存着服务提供者的缓存
    serviceRepository = new FrameworkServiceRepository(this);
    /*
     * 3 ScopeModelInitializer扩展点的加载
     */
    //基于Dubbo SPI获取ScopeModelInitializer的ExtensionLoader
    ExtensionLoader<ScopeModelInitializer> initializerExtensionLoader = this.getExtensionLoader(ScopeModelInitializer.class);
    //基于Dubbo SPI获取所有的ScopeModelInitializer的SPI实现
    Set<ScopeModelInitializer> initializers = initializerExtensionLoader.getSupportedExtensionInstances();
    //调用所有ScopeModelInitializer的initializeFrameworkModel实现自定义的扩展逻辑
    for (ScopeModelInitializer initializer : initializers) {
        initializer.initializeFrameworkModel(this);
    }
    /*
     * 4 创建内部的ApplicationModel实例
     */
    internalApplicationModel = new ApplicationModel(this, true);
    /*
     * 5 向ApplicationModel内部的ApplicationConfigManager的configsCache缓存中的注册一个config，
     * 该config是一个ApplicationConfig，对应着<dubbo:application name="xx">标签，name为DUBBO_INTERNAL_APPLICATION
     * 应用程序级别的模型中，ApplicationConfig是必须要有的
     */
    internalApplicationModel.getApplicationConfigManager().setApplication(
        new ApplicationConfig(internalApplicationModel, CommonConstants.DUBBO_INTERNAL_APPLICATION));
    //设置模型名为DUBBO_INTERNAL_APPLICATION
    internalApplicationModel.setModelName(CommonConstants.DUBBO_INTERNAL_APPLICATION);
}
```

#### 2.3.1 Initialize父类ScopeModel初始化

在FrameworkModel初始化方法的开头，首先调用父类ScopeModel的initialize初始化方法，用于初始化该模型自己的extensionDirector、ScopeBeanFactory等属性。

extensionDirector用于支持Dubbo SPI，可用于查找、创建、管理 ExtensionLoader。随后会向其添加一个ExtensionPostProcessor扩展后处理器，参考了Spring的BeanPostProcessor，在每个扩展实例被创建之后，在对其进行setter注入的**前后**会调用对应的**postProcessBeforeInitialization和postProcessAfterInitialization**方法。

**ScopeBeanFactory用于管理通常是域内部使用的bean，参考了Spring的BeanFactory，在CommonScopeModelInitializer可以看到注册，在各种ScopeModelInitializer中也能看到注册。**

```java
/**
 * ScopeModel的方法
 *
 * 两个注意点：
 * 1、initialize方法只能在子类中调用。
 * 2、在子类中，extensionDirector和beanFactory在初始化方法initialize中可用，但在构造函数中不可用。
 */
protected void initialize() {
    //初始化extensionDirector实例，这个实例是每个领域模型私有的，传递对应的父实例以及模型scope作用域
    //用于支持Dubbo SPI，可用于查找、创建、管理 ExtensionLoader
    this.extensionDirector = new ExtensionDirector(parent != null ? parent.getExtensionDirector() : null, scope, this);
    //添加一个扩展后处理器，参考了Spring的BeanPostProcessor，在每个扩展实例被创建之后
    //在对其进行初始化的前后会调用对应的postProcessBeforeInitialization和postProcessAfterInitialization方法
    this.extensionDirector.addExtensionPostProcessor(new ScopeModelAwareExtensionProcessor(this));
    //创建一个域工厂对象，用于该领域模型实例内部的bean的创建、获取等管理，这里注册的bean不是Spring容器bean
    //通常是域内部使用的bean，在CommonScopeModelInitializer可以看到注册
    this.beanFactory = new ScopeBeanFactory(parent != null ? parent.getBeanFactory() : null, extensionDirector);
    //域对象销毁监听器集合
    this.destroyListeners = new LinkedList<>();
    //类加载器监听器集合
    this.classLoaderListeners = new LinkedList<>();
    //模型属性
    this.attributes = new ConcurrentHashMap<>();
    //类加载器集合
    this.classLoaders = new ConcurrentHashSet<>();
    // Add Framework's ClassLoader by default
    ClassLoader dubboClassLoader = ScopeModel.class.getClassLoader();
    if (dubboClassLoader != null) {
        //将当前类的加载器存入加载器集合classLoaders中
        this.addClassLoader(dubboClassLoader);
    }
}
```

#### 2.3.2 initBuilders初始化TypeBuilder

基于Dubbo SPI机制初始化类型构建器TypeBuilder的实例集合，保存到TypeDefinitionBuilder。

Dubbo默认提供了四种TypeBuilder的SPI实现，分别用于支持数组、集合、map、enum的上的泛型。他们分别是：

**1、** array=org.apache.dubbo.metadata.definition.builder.ArrayTypeBuilder；

**2、** collection=org.apache.dubbo.metadata.definition.builder.CollectionTypeBuilder；

**3、** map=org.apache.dubbo.metadata.definition.builder.MapTypeBuilder；

**4、** enum=org.apache.dubbo.metadata.definition.builder.EnumTypeBuilder；

```java
public static List<TypeBuilder> BUILDERS;
/**
 * TypeDefinitionBuilder的方法
 * @param model
 */
public static void initBuilders(FrameworkModel model) {
    //基于Dubbo SPI机制初始化类型构建器TypeBuilder类型集合
    Set<TypeBuilder> tbs = model.getExtensionLoader(TypeBuilder.class).getSupportedExtensionInstances();
    //存入BUILDERS属性
    BUILDERS = new ArrayList<>(tbs);
}
```

#### 2.3.3 setApplication注册ApplicationConfig

**在初始化方法的最后，会向ApplicationModel内部的ApplicationConfigManager的configsCache缓存中的注册一个config。该config是一个ApplicationConfig，对应着标签等配置，name为DUBBO_INTERNAL_APPLICATION。**

**在应用程序级别的模型中，其代表着该应用程序的配置，每个应用必须要有且只有一个 application 配置。具体参考：https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/config/properties/**

```java
/*
 * 5 向ApplicationModel内部的ApplicationConfigManager的configsCache缓存中的注册一个config，
 * 该config是一个ApplicationConfig，对应着<dubbo:application name="xx">标签，name为DUBBO_INTERNAL_APPLICATION
 * 应用程序级别的模型中，ApplicationConfig是必须要有的
 */
internalApplicationModel.getApplicationConfigManager().setApplication(
    new ApplicationConfig(internalApplicationModel, CommonConstants.DUBBO_INTERNAL_APPLICATION));
//设置模型名为DUBBO_INTERNAL_APPLICATION
internalApplicationModel.setModelName(CommonConstants.DUBBO_INTERNAL_APPLICATION);
```

## 3 ApplicationModel的创建和初始化

**在FrameworkModel的Initialize方法中，可以看到创建了一个内部ApplicationModel，ApplicationModel代表着一个应用程序级别的模型。内部存储着ApplicationConfig、MonitorConfig、MetricsConfig、SslConfig等唯一配置。下面看看它的构造器。**

**1、** 和FrameworkModel的构建一样，首先调用父类ScopeModel构造器，设置父模型为frameworkModel，模型领域为APPLICATION；

**2、** 调用父模型的addApplication方法，将当前模型加入到applicationModels，并设置为默认应用程序模型；

**3、** 调用initialize方法执行一系列初始化操作，非常重要；

```java
/**
 * ApplicationModel的构造器
 *
 * @param frameworkModel 父模型
 * @param isInternal     是否是内部模型
 */
public ApplicationModel(FrameworkModel frameworkModel, boolean isInternal) {
    //1 调用父类ScopeModel构造器，设置父模型为frameworkModel，模型领域为APPLICATION
    super(frameworkModel, ExtensionScope.APPLICATION, isInternal);
    Assert.notNull(frameworkModel, "FrameworkModel can not be null");
    this.frameworkModel = frameworkModel;
    /*
     * 2 调用父模型的addApplication方法
     */
    frameworkModel.addApplication(this);
    if (LOGGER.isInfoEnabled()) {
        LOGGER.info(getDesc() + " is created");
    }
    /*
     * 3 一系列初始化操作，非常重要
     */
    initialize();
    Assert.notNull(getApplicationServiceRepository(), "ApplicationServiceRepository can not be null");
    Assert.notNull(getApplicationConfigManager(), "ApplicationConfigManager can not be null");
    Assert.assertTrue(getApplicationConfigManager().isInitialized(), "ApplicationConfigManager can not be initialized");
}
```

### 3.1 addApplication添加应用程序模型

调用父模型FrameworkModel的addApplication方法，将当前ApplicationModel实例尝试加入到applicationModels集合属性中，如果不是内部模型，那么还会加入到pubApplicationModels集合属性中。

最后重置FrameworkModel内部的默认应用程序模型属性defaultAppModel，即设置当前应用程序模型为默认模型defaultAppModel。

```java
/**
 * FrameworkModel的方法
 * <p>
 * 添加applicationModel
 */
void addApplication(ApplicationModel applicationModel) {
    // can not add new application if it's destroying
    //销毁检查
    checkDestroyed();
    //加锁
    synchronized (instLock) {
        //如果applicationModels集合没有包含该应用程序模型
        if (!this.applicationModels.contains(applicationModel)) {
            //设置一个二级的全局递增编号，从0开始，例如1.0 、 1.1
            applicationModel.setInternalId(buildInternalId(getInternalId(), appIndex.getAndIncrement()));
            //加入到applicationModels集合
            this.applicationModels.add(applicationModel);
            //如果不是内部模型，那么加入到pubApplicationModels集合中
            if (!applicationModel.isInternal()) {
                this.pubApplicationModels.add(applicationModel);
            }
            //重置默认应用程序模型，即设置当前应用程序模型为默认模型
            resetDefaultAppModel();
        }
    }
}
```

### 3.2 initialize初始化ApplicationModel

该方法用于初始化ApplicationModel，大概逻辑为：

**1、** 调用父类**ScopeModel**的初始化方法initialize，用于初始化该模型自己的**extensionDirector**、**ScopeBeanFactory**等属性；

**2、** 创建内部的**ModuleModel**实例，赋值给internalApplicationModel属性，这是联动创建的子级模型，即模块模型；

**3、** 基于DubboSPI机制加载**ApplicationInitListener**扩展点，并且调用所有扩展点的init实现自定义逻辑目前版本Dubbo未提供任何实现；

**4、** 调用**initApplicationExts**方法，初始化**ApplicationExt**扩展点；

**5、** 基于DubboSPI机制加载**ScopeModelInitializer**扩展点，并且调用所有扩展点的**initializeApplicationModel**实现自定义逻辑Dubbo提供了很多ScopeModelInitializer实现；

```java
/**
 * ApplicationModel的方法
 * <p>
 * 初始化应用程序模型
 */
@Override
protected void initialize() {
    /*
     * 1 调用父类ScopeModel的初始化方法
     */
    super.initialize();
    /*
     * 2 创建内部的ModuleModel实例，赋值给internalModule属性
     */
    internalModule = new ModuleModel(this, true);
    //创建Application级别的服务存储仓库，其内部保存着服务提供者的缓存
    this.serviceRepository = new ServiceRepository(this);
    /*
     * 3 ApplicationInitListener扩展点的加载
     */
    //基于Dubbo SPI获取ApplicationInitListener的ExtensionLoader
    ExtensionLoader<ApplicationInitListener> extensionLoader = this.getExtensionLoader(ApplicationInitListener.class);
    //基于Dubbo SPI获取所有的ApplicationInitListener的SPI实现的名字
    Set<String> listenerNames = extensionLoader.getSupportedExtensions();
    for (String listenerName : listenerNames) {
        //调用所有ApplicationInitListener的init实现自定义的扩展逻辑
        extensionLoader.getExtension(listenerName).init();
    }
    /*
     * 4 初始化ApplicationExt扩展点
     */
    initApplicationExts();
    /*
     * 5 ScopeModelInitializer扩展点的加载
     */
    //基于Dubbo SPI获取ScopeModelInitializer的ExtensionLoader
    ExtensionLoader<ScopeModelInitializer> initializerExtensionLoader = this.getExtensionLoader(ScopeModelInitializer.class);
    //基于Dubbo SPI获取所有的ScopeModelInitializer的SPI实现
    Set<ScopeModelInitializer> initializers = initializerExtensionLoader.getSupportedExtensionInstances();
    for (ScopeModelInitializer initializer : initializers) {
        //调用所有ScopeModelInitializer的initializeApplicationModel实现自定义的扩展逻辑
        initializer.initializeApplicationModel(this);
    }
}
```

#### 3.2.1 initApplicationExts初始化应用程序扩展点

**该方法用于初始化ApplicationModel扩展点，其也是基于Dubbo SPI机制，查找所有的ApplicationExt实现，然后调用他们的initialize方法。这个扩展点之所有提出为单独的一个方法，足见它的重要性。**

**ApplicationExt默认提供了ConfigManager和Environment的实现。ConfigManager表示当前应用程序下的配置管理器，Environment表示当前应用程序下的环境，其可用于从各种属性源中加载Dubbo的配置。**

```java
/**
 * ApplicationModel的方法
 *
 * 初始化ApplicationModel扩展点
 */
private void initApplicationExts() {
    //目前Dubbo3.1版本提供了两个实现ConfigManager和Environment
    Set<ApplicationExt> exts = this.getExtensionLoader(ApplicationExt.class).getSupportedExtensionInstances();
    //调用他们的initialize方法执行初始化
    for (ApplicationExt ext : exts) {
        ext.initialize();
    }
}
```

##### 3.2.1.1 Environment应用环境的初始化

**Environment基于Dubbo SPI机制创建实例。虽然构造器中有一个参数，但是由于是参数属于ScopeModel即模型类型，那么最新Dubbo 3.1的SPI机制支持模型作为构造器参数，因此可以调用。**

```java
public Environment(ScopeModel scopeModel) {
    //设置所属模型
    this.scopeModel = scopeModel;
}
```

当在进行SPI查找到该实现的时候，在对其进行了实例化之后，将会在ExtensionLoader#initExtension方法中对其进行初始化，同时Environment继承了Dubbo的LifecycleAdapter，那么将会执行它的initialize方法。

同时，在ApplicationModel的初始化方法initApplicationExts中也会执行它的initialize方法

**这样我们就来到了Environment#initialize方法中，该方法将会初始化各种属性来源配置类，用于查找各种Dubbo配置，该方法对于同一个Environment实例多次调用仅有一次有效。**

```java
@Override
public void initialize() throws IllegalStateException {
    //CAS的设置标志位防止重复调用
    if (initialized.compareAndSet(false, true)) {
        //用于加载dubbo.properties配置文件，默认在classpath下，可以通过JVM或者系统环境变量属性指定路径
        this.propertiesConfiguration = new PropertiesConfiguration(scopeModel);
        //用于获取来自JVM环境变量中的配置，例如 -D 的配置
        this.systemConfiguration = new SystemConfiguration();
        //用于获取来自系统环境变量中的配置
        this.environmentConfiguration = new EnvironmentConfiguration();
        //外部配置，来自于远程配置中心config-center的全局/default配置
        this.externalConfiguration = new InmemoryConfiguration("ExternalConfig");
        //外部应用程序配置，来自于远程配置中心config-center的应用程序配置
        this.appExternalConfiguration = new InmemoryConfiguration("AppExternalConfig");
        //本地应用配置，例如Spring Environment/PropertySources/application.properties
        this.appConfiguration = new InmemoryConfiguration("AppConfig");
        //迁移规则，废弃
        loadMigrationRule();
    }
}
```

该方法中能看到各种配置类的创建：

**1、****propertiesConfiguration**：用于加载dubbo.properties配置文件，默认路径在classpath下，可以通过JVM环境变量或者系统环境变量“dubbo.properties.file”属性指定其他路径；

**2、****systemConfiguration**：用于获取来自JVM环境变量中的配置，例如-D的配置即通过System.getProperty(key)方法获取配置；

**3、****environmentConfiguration**：用于获取来自系统环境变量中的配置即通过System.getenv(key)方法获取配置；

**4、****externalConfiguration**：外部的全局级别d配置，来自于远程配置中心config-center的全局/default配置从远程加载到externalConfiguration内部的LinkedHashMap中如果zookeeper作为配置中心，默认全局配置路径为/dubbo/config/dubbo/dubbo.properties；

**5、****appExternalConfiguration**：外部的应用程序级别配置，来自于远程配置中心config-center的应用程序配置从远程加载到appExternalConfiguration内部的LinkedHashMap中如果zookeeper作为配置中心，则默认应用程序级别的配置路径则为dubbo/config/{application.name}/dubbo.properties；

**6、****appConfiguration**：本地应用配置，例如SpringEnvironment/PropertySources/application.properties配置加载到appConfiguration内部的LinkedHashMap中；

**在后续真正的加载配置的时候，各种来源中的配置就是通过这些配置类获取的，而具体的配置的优先级和覆盖规则，则是通过configManager配置管理器控制的。**

##### 3.2.1.2 ConfigManager配置管理器的初始化

**ConfigManager基于Dubbo SPI机制创建实例。虽然构造器中有一个参数，但是由于是参数属于ScopeModel即模型类型，那么最新Dubbo 3.1的SPI机制支持模型作为构造器参数，因此可以调用。**

```java
/**
 * ConfigManager构造器
 * <p>
 * 支持SPI调用
 */
public ConfigManager(ApplicationModel applicationModel) {
    //调用父类AbstractConfigManager的构造器
    super(applicationModel, Arrays.asList(ApplicationConfig.class, MonitorConfig.class,
        MetricsConfig.class, SslConfig.class, ProtocolConfig.class, RegistryConfig.class, ConfigCenterConfig.class,
        MetadataReportConfig.class));
}
```

**该构造器中。调用了抽象父类AbstractConfigManager的构造器，传递了当前所属的模型，以及模块支持的配置类型数组，从源码中我们可以知道，ConfigManager支持ApplicationConfig、MonitorConfig、MetricsConfig、SslConfig、ProtocolConfig、RegistryConfig、ConfigCenterConfig、MetadataReportConfig，它并没有保存Dubbo服务和引用、以及消费者、提供者的配置。**

**至此，我们也可以窥见ApplicationModel中的模块域代表着的范围到底是什么。**

```java
/**
 * AbstractConfigManager的构造器
 * @param scopeModel 所属域模型
 * @param supportedConfigTypes 支持的类型
 */
public AbstractConfigManager(ScopeModel scopeModel, Collection<Class<? extends AbstractConfig>> supportedConfigTypes) {
    this.scopeModel = scopeModel;
    this.applicationModel = ScopeModelUtil.getApplicationModel(scopeModel);
    //设置到该属性
    this.supportedConfigTypes = supportedConfigTypes;
    //获取模型环境
    environment = scopeModel.getModelEnvironment();
}
```

当在进行SPI查找到该实现的时候，在对其进行了实例化之后，将会在ExtensionLoader#initExtension方法中对其进行初始化，同时ConfigManager继承了Dubbo的LifecycleAdapter，那么将会执行它的initialize方法。

ConfigManager本身没有实现initialize方法，这个方法由父类AbstractConfigManager实现。该方法的大概步骤为：

**1、** 获取Environment内部初始化的所有配置对象，然后组合成一个合并配置对象CompositeConfiguration返回；

**2、** 获取dubbo.config.mode属性该属性表示Dubbo获取配置的模式，控制着属性覆盖顺序默认STRICT模式；

**3、** 获取dubbo.config.ignore-duplicated-interface属性该属性表示Dubbo是否忽略重复的接口(service/reference)配置默认值为false；

```java
/**
 * AbstractConfigManager的方法
 * <p>
 * 初始化ConfigManager
 */
@Override
public void initialize() throws IllegalStateException {
    //一个对象只能初始化一次
    if (!initialized.compareAndSet(false, true)) {
        return;
    }
    /*
     * 1 获取Environment内部初始化的所有配置对象，然后组合成一个合并配置对象返回
     */
    CompositeConfiguration configuration = scopeModel.getModelEnvironment().getConfiguration();
    /*
     * 2 获取dubbo.config.mode属性
     * 该属性表示Dubbo获取配置的模式，控制着属性覆盖顺序。默认STRICT模式
     */
    String configModeStr = (String) configuration.getProperty(ConfigKeys.DUBBO_CONFIG_MODE);
    try {
        if (StringUtils.hasText(configModeStr)) {
            //根据字符串获取对应的属性枚举
            this.configMode = ConfigMode.valueOf(configModeStr.toUpperCase());
        }
    } catch (Exception e) {
        String msg = "Illegal '" + ConfigKeys.DUBBO_CONFIG_MODE + "' config value [" + configModeStr + "], available values " + Arrays.toString(ConfigMode.values());
        logger.error(msg, e);
        throw new IllegalArgumentException(msg, e);
    }
    // dubbo.config.ignore-duplicated-interface
    /*
     * 3 获取dubbo.config.ignore-duplicated-interface属性
     * 该属性表示Dubbo是否忽略重复的接口(service/reference)配置。默认值为false。
     */
    String ignoreDuplicatedInterfaceStr = (String) configuration
        .getProperty(ConfigKeys.DUBBO_CONFIG_IGNORE_DUPLICATED_INTERFACE);
    if (ignoreDuplicatedInterfaceStr != null) {
        this.ignoreDuplicatedInterface = Boolean.parseBoolean(ignoreDuplicatedInterfaceStr);
    }
    // print
    //打印日志
    Map<String, Object> map = new LinkedHashMap<>();
    map.put(ConfigKeys.DUBBO_CONFIG_MODE, configMode);
    map.put(ConfigKeys.DUBBO_CONFIG_IGNORE_DUPLICATED_INTERFACE, this.ignoreDuplicatedInterface);
    logger.info("Config settings: " + map);
}
```

###### 3.2.1.2.1 getConfiguration获取组合环境配置#

**该方法获取此前Environment内部初始化的所有配置对象，然后组合成一个合并配置对象设置给Environment的globalConfiguration属性并返回。**

```java
/**
 * Environment的方法
 *
 * 获取Environment的合并配置对象CompositeConfiguration，然后基于此可以获取各种有优先级的配置
 * 此外还可以从URL中获取配置
 */
public CompositeConfiguration getConfiguration() {
    if (globalConfiguration == null) {
        //创建CompositeConfiguration
        CompositeConfiguration configuration = new CompositeConfiguration();
        //将此前初始化的各种配置类对象都加入进去，成为有优先级的合并配置
        configuration.addConfiguration(systemConfiguration);
        configuration.addConfiguration(environmentConfiguration);
        configuration.addConfiguration(appExternalConfiguration);
        configuration.addConfiguration(externalConfiguration);
        configuration.addConfiguration(appConfiguration);
        configuration.addConfiguration(propertiesConfiguration);
        //设置给globalConfiguration属性
        globalConfiguration = configuration;
    }
    return globalConfiguration;
}
```

## 4 ModuleModel的创建和初始化

在ApplicationModel的Initialize方法中，可以看到创建了一个内部ModuleModel，ModuleModel代表着一个模块级别的模型。内部存储着ServiceConfig、ModuleConfig、ProviderConfig、ConsumerConfig等配置。下面看看它的构造器。

**1、** 和ApplicationModel的构建一样，首先调用父类**ScopeModel**构造器，设置父模型为**ApplicationModel**，模型领域为**MODULE**；

**2、** 调用父模型的addModule方法，将当前模型加入到**applicationModels**，并设置为默认应用程序模型；

**3、** 调用**initialize**方法执行一系列初始化操作，非常重要；

**4、** 获取应用程序发布器**ApplicationDeployer**，通知应用程序检查模块状态；

```java
/**
 * ModuleModel的构造器
 *
 * @param applicationModel 父模型
 * @param isInternal     是否是内部模型
 */
public ModuleModel(ApplicationModel applicationModel, boolean isInternal) {
    //1 调用父类ScopeModel构造器，设置父模型为ApplicationModel，模型领域为MODULE
    super(applicationModel, ExtensionScope.MODULE, isInternal);
    Assert.notNull(applicationModel, "ApplicationModel can not be null");
    this.applicationModel = applicationModel;
    /*
     * 2 调用父模型的addModule方法
     */
    applicationModel.addModule(this, isInternal);
    if (LOGGER.isInfoEnabled()) {
        LOGGER.info(getDesc() + " is created");
    }
    /*
     * 3 一系列初始化操作，非常重要
     */
    initialize();
    Assert.notNull(getServiceRepository(), "ModuleServiceRepository can not be null");
    Assert.notNull(getConfigManager(), "ModuleConfigManager can not be null");
    Assert.assertTrue(getConfigManager().isInitialized(), "ModuleConfigManager can not be initialized");
    // notify application check state
    //获取应用程序发布器，如果不为null，则通知应用程序检查模块状态
    ApplicationDeployer applicationDeployer = applicationModel.getDeployer();
    if (applicationDeployer != null) {
        applicationDeployer.notifyModuleChanged(this, DeployState.PENDING);
    }
}
```

### 4.1 addModule添加模块模型

调用父模型ApplicationModel的addModule方法，将当前ModuleModel实例尝试加入到moduleModels集合属性中，如果不是内部模型，那么还会加入到pubModuleModels集合属性中。

```java
/**
 * ApplicationModel的方法
 * <p>
 * 添加ModuleModel
 */
void addModule(ModuleModel moduleModel, boolean isInternal) {
    //加锁
    synchronized (moduleLock) {
        //如果moduleModels集合没有包含该模块模型
        if (!this.moduleModels.contains(moduleModel)) {
            //销毁检查
            checkDestroyed();
            //加入到applicationModels集合
            this.moduleModels.add(moduleModel);
            //设置一个三级的全局递增编号，从0开始，例如1.1.0 、 1.1.1
            moduleModel.setInternalId(buildInternalId(getInternalId(), moduleIndex.getAndIncrement()));
            //如果不是内部模型，那么加入到pubModuleModels
            if (!isInternal) {
                pubModuleModels.add(moduleModel);
            }
        }
    }
}
```

### 4.2 initialize初始化ModuleModel

该方法用于初始化ModuleModel，大概逻辑为：

**1、** 调用父类**ScopeModel**的初始化方法initialize，用于初始化该模型自己的**extensionDirector**、**ScopeBeanFactory**等属性；

**2、** 调用initModuleExt方法，初始化**ModuleExt**扩展点；

**3、** 基于DubboSPI机制加载**ScopeModelInitializer**扩展点，并且调用所有扩展点的**initializeModuleModel**实现自定义逻辑Dubbo提供了很多ScopeModelInitializer实现；

```java
/**
 * ModuleModel的方法
 * <p>
 * 初始化模块模型
 */
@Override
protected void initialize() {
    /*
     * 1 调用父类ScopeModel的初始化方法
     */
    super.initialize();
    //创建Module级别的服务存储仓库，其内部保存着服务提供者的缓存
    this.serviceRepository = new ModuleServiceRepository(this);
    /*
     * 2 初始化ModuleExt扩展点
     */
    initModuleExt();
    /*
     * 3 ScopeModelInitializer扩展点的加载
     */
    //基于Dubbo SPI获取ScopeModelInitializer的ExtensionLoader
    ExtensionLoader<ScopeModelInitializer> initializerExtensionLoader = this.getExtensionLoader(ScopeModelInitializer.class);
    //基于Dubbo SPI获取所有的ScopeModelInitializer的SPI实现
    Set<ScopeModelInitializer> initializers = initializerExtensionLoader.getSupportedExtensionInstances();
    for (ScopeModelInitializer initializer : initializers) {
        //调用所有ScopeModelInitializer的initializeModuleModel实现自定义的扩展逻辑
        initializer.initializeModuleModel(this);
    }
}
```

#### 4.2.1 initModuleExt初始化模块扩展点

该方法用于初始化ModuleExt扩展点，其也是基于Dubbo SPI机制，查找所有的ModuleExt实现，然后调用他们的initialize方法。这个扩展点之所有提出为单独的一个方法，足见它的重要性。

**ModuleExt默认提供了ModuleConfigManager和ModuleEnvironment的实现。ModuleConfigManager表示当前模块的配置管理器，ModuleEnvironment表示当前模块下的环境，其可用于从各种属性源中加载Dubbo的配置。**

```java
/**
 * ModuleModel的方法
 * <p>
 * 初始化ModuleExt扩展点
 */
private void initModuleExt() {
    Set<ModuleExt> exts = this.getExtensionLoader(ModuleExt.class).getSupportedExtensionInstances();
    //Dubbo3.1默认提供了两个实现ModuleConfigManager和ModuleEnvironment
    for (ModuleExt ext : exts) {
        ext.initialize();
    }
}
```

##### 4.2.1.1 ModuleEnvironment模型环境的初始化

ModuleEnvironment基于Dubbo SPI机制创建实例。虽然构造器中有一个参数，但是由于是参数属于ScopeModel即模型类型，那么最新Dubbo 3.1的SPI机制支持模型作为构造器参数，因此可以调用。

```java
public ModuleEnvironment(ModuleModel moduleModel) {
    //调用父类Environment的构造器
    super(moduleModel);
    //设置所属模块模型
    this.moduleModel = moduleModel;
    //获取模块模型对应的应用程序模型内的Environment属性
    this.applicationDelegate = moduleModel.getApplicationModel().getModelEnvironment();
}
```

该构造器中。调用了抽象父类Environment的构造器，传递了当前所属的模型。其内部还保存在父环境Environment。

当在进行SPI查找到该实现的时候，在对其进行了实例化之后，将会在ExtensionLoader#initExtension方法中对其进行初始化，同时ModuleEnvironment继承了Dubbo的LifecycleAdapter，那么将会执行它的initialize方法。

同时，在ModuleModel的初始化方法initModuleExt中也会执行它的initialize方法

这样我们就来到了ModuleEnvironment#initialize方法中，该方法将会创建一个有序的配置对象**OrderedPropertiesConfiguration**。

```java
@Override
public void initialize() throws IllegalStateException {
    //只能初始化一次
    if (initialized.compareAndSet(false, true)) {
        //创建一个有序的配置对象
        this.orderedPropertiesConfiguration = new OrderedPropertiesConfiguration(moduleModel);
    }
}
```

##### 4.2.1.2 ModuleConfigManager模型配置管理器的初始化

ModuleConfigManager基于Dubbo SPI机制创建实例。虽然构造器中有一个参数，但是由于是参数属于ScopeModel即模型类型，那么最新Dubbo 3.1的SPI机制支持模型作为构造器参数，因此可以调用。

```java
/**
 * ModuleConfigManager构造器
 * <p>
 * 支持SPI调用
 */
public ModuleConfigManager(ModuleModel moduleModel) {
    //调用父类AbstractConfigManager的构造器
    super(moduleModel, Arrays.asList(ModuleConfig.class, ServiceConfigBase.class, ReferenceConfigBase.class, ProviderConfig.class, ConsumerConfig.class));
    //获取应用程序级的配置管理器
    applicationConfigManager = moduleModel.getApplicationModel().getApplicationConfigManager();
}
```

**该构造器中。首先调用了抽象父类AbstractConfigManager的构造器，传递了当前所属的模型，以及模块支持的配置类型数组，从源码中我们可以知道，ModuleConfigManager支持ModuleConfig 、ServiceConfigBase（ServiceConfig）、ReferenceConfigBase（ReferenceConfig）、ProviderConfig、ConsumerConfig，至此，我们也可以窥见ModuleModel中的模块域代表着的范围到底是什么。**

**随后，获取上级的配置管理器，也就是对应的ModuleModel的父级ApplicationModel内部的ConfigManager，并保存到applicationConfigManager属性中。**

```java
/**
 * ApplicationModel的方法
 *
 * @return 配置管理器
 */
public ConfigManager getApplicationConfigManager() {
    if (configManager == null) {
        //如果属性为null，那么基于DUbbo SPI的机制获取对应的配置管理器
        configManager = (ConfigManager) this.getExtensionLoader(ApplicationExt.class)
            .getExtension(ConfigManager.NAME);
    }
    return configManager;
}
```

当在进行SPI查找到该实现的时候，在对其进行了实例化之后，将会在ExtensionLoader#initExtension方法中对其进行初始化，同时ModuleConfigManager继承了Dubbo的LifecycleAdapter，那么将会执行它的initialize方法。

ModuleConfigManager本身没有实现initialize方法，这个方法由父类AbstractConfigManager实现。该方法我们在上面ConfigManager的部分已经讲过了。

## 5 ScopeModelInitializer模型初始化器

在三个域模型的创建和初始化的过程中ScopeModelInitializer都会被调用到，ScopeModelInitializer用于自定义ScopeModel的初始化逻辑。Dubbo 3.1版本提供了8个默认的ScopeModelInitializer实现：

ClusterScopeModelInitializer会将某些Dubbo的实例注册到ScopeBeanFactory容器中：

```java
public class ClusterScopeModelInitializer implements ScopeModelInitializer {
    @Override
    public void initializeFrameworkModel(FrameworkModel frameworkModel) {
        ScopeBeanFactory beanFactory = frameworkModel.getBeanFactory();
        //注册RouterSnapshotSwitcher到ScopeBeanFactory
        beanFactory.registerBean(RouterSnapshotSwitcher.class);
    }
    @Override
    public void initializeApplicationModel(ApplicationModel applicationModel) {
        ScopeBeanFactory beanFactory = applicationModel.getBeanFactory();
        //注册MergerFactory和ClusterUtils到ScopeBeanFactory
        beanFactory.registerBean(MergerFactory.class);
        beanFactory.registerBean(ClusterUtils.class);
    }
    @Override
    public void initializeModuleModel(ModuleModel moduleModel) {
        ScopeBeanFactory beanFactory = moduleModel.getBeanFactory();
        //注册MeshRuleManager到ScopeBeanFactory
        beanFactory.registerBean(MeshRuleManager.class);
    }
}
```

而ConfigScopeModelInitializer则会创建并注册DefaultApplicationDeployer和DefaultModuleDeployer这两个发布器，他们分别用于初始化并启动应用程序实例以及导出/引用模块的服务，非常重要。

```java
public class ConfigScopeModelInitializer implements ScopeModelInitializer {
    @Override
    public void initializeFrameworkModel(FrameworkModel frameworkModel) {
        //设置发布监听器，一个用于释放框架模型资源的清理器
        frameworkModel.addDestroyListener(new FrameworkModelCleaner());
    }
    @Override
    public void initializeApplicationModel(ApplicationModel applicationModel) {
        ScopeBeanFactory beanFactory = applicationModel.getBeanFactory();
        //注册DefaultConfigValidator
        beanFactory.registerBean(DefaultConfigValidator.class);
        // applicationDeployer
        //创建DefaultApplicationDeployer对象，并且设置到ApplicationModel的deployer属性
        ApplicationDeployer applicationDeployer = beanFactory.registerBean(DefaultApplicationDeployer.class);
        applicationModel.setDeployer(applicationDeployer);
    }
    @Override
    public void initializeModuleModel(ModuleModel moduleModel) {
        ScopeBeanFactory beanFactory = moduleModel.getBeanFactory();
        // moduleDeployer
        //注册DefaultModuleDeployer
        ModuleDeployer moduleDeployer = beanFactory.registerBean(DefaultModuleDeployer.class);
        //设置到ModuleModel的deployer属性
        moduleModel.setDeployer(moduleDeployer);
    }
}
```

## Dubbo域模型的总结

Dubbo3新增了三层域模型的概念，FrameworkModel是dubbo核心框架模型，可与多个应用程序共享；ApplicationModel应用程序模型，其代表某个应用程序；ModuleModel模块模型，其代表某个模块。

**这些域主要用于支持大企业的多应用程序部署的需要。另外，此前Dubbo可以说只有一个作用域，配置通过静态类属性共享，使用三层域模型用于优化不同作用域下的配置和环境的管理，让Dubbo的配置管理更加清晰明了。**

三层模型的作用范围的关系为逻辑上的包含关系：FrameworkModel包含ApplicationModel包含ModuleModel，即通过属性持有下级模型的引用。在初始化这些域模型的时候，都是联动加载，即初始化外层模型，那么对应内层模型也会加载。

**FrameworkModel**表示dubbo核心框架模型，是最上层的模型，内部保存着一个ApplicationModel；

**ApplicationModel**表示应用程序模型，其代表某个应用程序，其内部有两个关键配置类：；

**Environment**：应用程序环境，内部保存着各种属性来源配置类，用于查找各种Dubbo配置，在后续真正的加载配置的时候，各种来源中的配置就是通过这些配置类获取的，而具体的配置的优先级和覆盖规则，则是通过configManager配置管理器控制的；

**1、****propertiesConfiguration**：用于加载dubbo.properties配置文件，默认路径在classpath下，可以通过JVM环境变量或者系统环境变量“dubbo.properties.file”属性指定其他路径。

**2、****systemConfiguration**：用于获取来自JVM环境变量中的配置，例如 -D 的配置。即通过System.getProperty(key)方法获取配置。

**3、****environmentConfiguration**：用于获取来自系统环境变量中的配置。即通过System.getenv(key)方法获取配置。

**4、****externalConfiguration**：外部的全局级别d配置，来自于远程配置中心config-center的全局/default配置。从远程加载到externalConfiguration内部的LinkedHashMap中。如果zookeeper作为配置中心，默认全局配置路径为/dubbo/config/dubbo/dubbo.properties。

**5、****appExternalConfiguration**：外部的应用程序级别配置，来自于远程配置中心config-center的应用程序配置。从远程加载到appExternalConfiguration内部的LinkedHashMap中。如果zookeeper作为配置中心，则默认应用程序级别的配置路径则为dubbo/config/{application.name}/dubbo.properties。

**6、****appConfiguration**：本地应用配置，例如Spring Environment/PropertySources/application.properties。配置加载到appConfiguration 内部的LinkedHashMap中。

**ConfigManager**：应用程序配置管理器，支持应用级别的配置管理；

从源码中得知其支持**ApplicationConfig、MonitorConfig、MetricsConfig、SslConfig、ProtocolConfig、RegistryConfig、ConfigCenterConfig、MetadataReportConfig的配置管理**，即服应用级别的配置管理，但是它并没有保存**Dubbo具体的服务和引用、以及消费者、提供者的配置**，至此我们可以窥见ApplicationModel中的模块域代表着的范围到底是什么。

ModuleModel表示模块模型，其代表某个应用程序，其内部有两个关键配置类：；

**ModuleEnvironment**：模块环境，内部一个有序的配置对象OrderedPropertiesConfiguration用于加载从有序的配置提供器扩展点OrderedPropertiesProvider中获取配置；

**ModuleConfigManager**：模块配置管理器，支持模块级别的配置管理；

从源码中得知其支持**ModuleConfig 、ServiceConfigBase（ServiceConfig）、ReferenceConfigBase（ReferenceConfig）、ProviderConfig、ConsumerConfig**，即**Dubbo具体的服务和引用、以及消费者、提供者的配置，即服务级别的配置管理。**至此我们可以窥见ModuleModel中的模块域代表着的范围到底是什么。

ScopeModelInitializer模块初始化器，用于自定义ScopeModel的初始化逻辑Dubbo3.1提供了多种实现，其中**ConfigScopeModelInitializer会创建并注册DefaultApplicationDeployer和DefaultModuleDeployer这两个发布器到ScopeBeanFactory他们分别用于初始化并启动应用程序实例以及导出/引用模块的服务，非常重要，后面我们学习服务调出和引用时会学习到他们**；
