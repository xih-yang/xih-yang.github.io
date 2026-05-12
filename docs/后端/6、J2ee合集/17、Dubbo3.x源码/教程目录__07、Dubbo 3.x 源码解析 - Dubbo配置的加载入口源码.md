# 07、Dubbo 3.x 源码解析 - Dubbo配置的加载入口源码
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/7.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo配置的加载源码入口。

## 1 Dubbo配置加载的入口

实际上在Dubbo启动过程中，包括XML配置、注解配置、Java-config 或者是执行API配置代码等等来源的本地Dubbo配置都会被解析成为对应的配置Bean，并且统一存放到ConfigManager中。

当Environment和ConfigManager被加载和初始化之后，并没有真正的加载配置，真正的加载配置的入口在**DubboConfigApplicationListener**这个监听器中，DubboConfigApplicationListener是在DubboBeanUtils#registerCommonBeans方法中注册到spring容器中的。

在AbstractApplicationContext#refresh方法内的**AbstractApplicationContext#invokeBeanFactoryPostProcessors**方法中，将会调用BeanFactoryPostProcessor，其中**ReferenceAnnotationBeanPostProcessor#postProcessBeanFactory**方法的最后将会发布一个早期事件**DubboConfigInitEvent**，其类型为**ApplicationEvent**。

而在spring bean定义加载完毕之后，在**AbstractApplicationContext#refresh**方法内的**AbstractApplicationContext#registerListeners**方法中，将会初始化所有普通的**ApplicationListener**，然后发布所有早期**ApplicationEvent**，此时其他普通bean还没实例化和初始化。

以上就是Dubbo 配置加载的入口。下面我们来看看DubboConfigApplicationListener如何处理这个事件的。入口为onApplicationEvent方法：

```java
@Override
public void onApplicationEvent(DubboConfigInitEvent event) {
    if (nullSafeEquals(applicationContext, event.getSource())) {
        // It's expected to be notified at org.springframework.context.support.AbstractApplicationContext.registerListeners(),
        // before loading non-lazy singleton beans. At this moment, all BeanFactoryPostProcessor have been processed,
        //CAS保证加载一次
        if (initialized.compareAndSet(false, true)) {
            //加载Dubbo配置bean
            initDubboConfigBeans();
        }
    }
}
```

## 2 initDubboConfigBeans初始化dubbo配置bean

该方法主要做两件事：

**1、** 一是如果容器存在DubboConfigBeanInitializer，那么加载DubboConfigBeanInitializer来初始化配置bean，获取DubboConfigBeanInitializer的bean实例，随后会执行它的afterPropertiesSet方法，该方法中：；

首先会实例化ReferenceBeanManager实例，该bean在DubboBeanUtils#registerCommonBeans方法中注册到spring容器中。

**2、** 会初始化Dubbo的配置bean实例并注册到ConfigManager，保证在@Referencebean自动装配之前初始化Dubbo的配置bean；

二是通过调用模型moduleModel的模块发布器DefaultModuleDeployer#prepare方法：

首先通过应用程序发布器**DefaultApplicationDeployer#initialize**方法初始化并启动应用程序实例。

然后通过模块模型moduleModel的模块发布器**DefaultModuleDeployer#initialize**方法初始化导出/引用模块的服务，即初始化与服务生产者、消费者相关的配置。

```java
/**
 * DubboConfigApplicationListener的方法
 */
private void initDubboConfigBeans() {
    // load DubboConfigBeanInitializer to init config beans
    //加载DubboConfigBeanInitializer来初始化配置bean
    if (applicationContext.containsBean(DubboConfigBeanInitializer.BEAN_NAME)) {
        //获取DubboConfigBeanInitializer的bean实例，随后会执行它的afterPropertiesSet方法，该方法中：
        //1、首先会实例化ReferenceBeanManager实例，该bean在DubboBeanUtils#registerCommonBeans方法中注册到spring容器中
        //2、会初始化Dubbo的配置bean实例并注册到ConfigManager，保证在@Reference bean自动装配之前初始化Dubbo的配置bean
        applicationContext.getBean(DubboConfigBeanInitializer.BEAN_NAME, DubboConfigBeanInitializer.class);
    } else {
        logger.warn("Bean '" + DubboConfigBeanInitializer.BEAN_NAME + "' was not found");
    }
    // All infrastructure config beans are loaded, initialize dubbo here
    //通过模块模型加载所有基础设施配置bean，加载应用配置
    moduleModel.getDeployer().prepare();
}
```

### 2.1 通过DubboConfigBeanInitializer初始化Dubbo配置bean

如果容器存在DubboConfigBeanInitializer，那么加载DubboConfigBeanInitializer来初始化配置bean，获取DubboConfigBeanInitializer的bean实例，随后会执行它的afterPropertiesSet方法。

```java
/**
 * DubboConfigBeanInitializer的方法
 */
@Override
public void afterPropertiesSet() throws Exception {
    init();
}
private void init() {
    //保证执行一次初始化
    if (initialized.compareAndSet(false, true)) {
        //获取ReferenceBeanManager实例，该bean在DubboBeanUtils#registerCommonBeans方法中注册到spring容器中
        referenceBeanManager = beanFactory.getBean(ReferenceBeanManager.BEAN_NAME, ReferenceBeanManager.class);
        try {
            //初始化Dubbo的配置bean，确保在@Reference bean自动装配之前所有配置bean都已初始化并注册到ConfigManager
            prepareDubboConfigBeans();
            //准备ReferenceBean，一般为没有
            referenceBeanManager.prepareReferenceBeans();
        } catch (Throwable e) {
            throw new FatalBeanException("Initialization dubbo config beans failed", e);
        }
    }
}
```

#### 2.1.1 prepareDubboConfigBeans准备Dubbo配置bean

为了更好地管理各种配置，Dubbo 抽象了一套结构化的配置组件，各组件总体以用途划分，分别控制不同作用域的行为。

无论我们通过xml标签，API，注解，properties等编写的配置，在spring加载进来之后，最终会变成一个个的配置bean。不同的配置会成为不同的配置bean，以xml配置为例子，不同的标签与不同的配置Bean的对应如下：

其他配置的对应关系可以参考官方文档：[https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/config/properties/](https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/config/properties/)，或者[https://dubbo.apache.org/zh/docsv2.7/user/configuration/xml/](https://dubbo.apache.org/zh/docsv2.7/user/configuration/xml/)，例如dubbo.properties中，dubbo.application开头的配置实际上就对应着ApplicationConfig。

此前，这些配置可能被解析成为了BeanDefinition并注入到容器中，这里的**prepareDubboConfigBeans**方法，实际上是在**实例化和初始化这些Dubbo的配置bean**，确保在@Reference bean自动装配之前所有配置bean都已初始化并注册到ConfigManager内部的。

**注意此时并没有到属性的覆盖那一步，而是把所有配置都加载到容器成为类对象属性。**

```java
/**
 * Initializes there Dubbo's Config Beans before @Reference bean autowiring
 */
private void prepareDubboConfigBeans() {
    logger.info("loading dubbo config beans ...");
    //Make sure all these config beans are initialed and registered to ConfigManager
    // load application config beans
    //确保所有这些配置bean都已初始化并注册到应用程序的ConfigManager中
    //加载 应用程序级别的配置bean，
    //ApplicationConfig 对应 <dubbo:application name="foo" />标签，或者dubbo.application属性
    loadConfigBeansOfType(ApplicationConfig.class, configManager);
    //RegistryConfig 对应<dubbo:registry address="10.20.153.10:9090" />标签，或者dubbo.registry属性
    loadConfigBeansOfType(RegistryConfig.class, configManager);
    loadConfigBeansOfType(ProtocolConfig.class, configManager);
    loadConfigBeansOfType(MonitorConfig.class, configManager);
    loadConfigBeansOfType(ConfigCenterBean.class, configManager);
    loadConfigBeansOfType(MetadataReportConfig.class, configManager);
    loadConfigBeansOfType(MetricsConfig.class, configManager);
    loadConfigBeansOfType(SslConfig.class, configManager);
    // load module config beans
    //加载 模块级别的配置bean，并注册到模块的ModuleConfigManager中
    loadConfigBeansOfType(ModuleConfig.class, moduleModel.getConfigManager());
    //service 间共享的默认配置，一个应用内可配置多个，一个 consumer 可作用于一组 reference
    loadConfigBeansOfType(ProviderConfig.class, moduleModel.getConfigManager());
    //reference 间共享的默认配置，一个应用内可配置多个，一个 provider 可作用于一组 service
    loadConfigBeansOfType(ConsumerConfig.class, moduleModel.getConfigManager());
    // load ConfigCenterBean from properties, fix https://github.com/apache/dubbo/issues/9207
    //从Dubbo的配置集中加载配置中心的配置，涉及到配置的优先级和覆盖
    List<ConfigCenterBean> configCenterBeans = configManager.loadConfigsOfTypeFromProps(ConfigCenterBean.class);
    for (ConfigCenterBean configCenterBean : configCenterBeans) {
        String beanName = configCenterBean.getId() != null ? configCenterBean.getId() : "configCenterBean";
        //使用spring初始化该bean实例，应用诸如setBeanName和setBeanFactory之类的工厂回调，还应用所有的bean后处理器(包括可能包装给定原始bean的后处理器)。
        beanFactory.initializeBean(configCenterBean, beanName);
    }
    logger.info("dubbo config beans are loaded.");
}
```

##### 2.1.1.1 loadConfigBeansOfType加载配置bean

**该方法根据类型获取配置bean，并且存放到ConfigManager的内部的configsCache缓存集合中。**

```java
/**
 * DubboConfigBeanInitializer的方法
 *
 * 基于类型从spring容器获取配置并加入到configManager内部的configsCache缓存中
 *
 * @param configClass 配置类型
 * @param configManager 配置管理器
 */
private void loadConfigBeansOfType(Class<? extends AbstractConfig> configClass, AbstractConfigManager configManager) {
    //从spring容器获取对应配置类的实例的beanName数组
    String[] beanNames = beanFactory.getBeanNamesForType(configClass, true, false);
    //遍历beanName
    for (String beanName : beanNames) {
        //获取该bean实例
        AbstractConfig configBean = beanFactory.getBean(beanName, configClass);
        // Register config bean here, avoid relying on unreliable @PostConstruct init method
        //注册配置bean到configManager
        configManager.addConfig(configBean);
    }
}
```

### 2.2 DefaultModuleDeployer#prepare准备应用程序

**在DubboConfigApplicationListener#initDubboConfigBeans方法的第二步，将会**

**首先通过应用程序发布器DefaultApplicationDeployer#initialize方法初始化并启动应用程序实例。**

**然后通过模块模型moduleModel的模块发布器DefaultModuleDeployer#initialize方法初始化导出/引用模块的服务，即初始化与服务生产者、消费者相关的配置。**

```java
/**
 * DefaultModuleDeployer的方法
 * <p>
 * Prepare for export/refer service, trigger initializing application and module
 * 准备导出/引用服务，触发初始化应用程序和模块
 */
@Override
public void prepare() {
    //通过应用程序发布器DefaultApplicationDeployer初始化组件
    applicationDeployer.initialize();
    //模块发布器DefaultModuleDeployer初始化组件
    this.initialize();
}
```

## 3 总结

本次我们学习了Dubbo3配置的加载与覆盖源码入口，注意在最后有两个方法的调用：

首先通过应用程序发布器DefaultApplicationDeployer#initialize方法初始化并启动应用程序实例，包括启动配置中心、加载应用程序配置，启动元数据中心等关键步骤。

然后通过模块模型moduleModel的模块发布器DefaultModuleDeployer#initialize方法初始化导出/引用模块的服务，即初始化与服务生产者、消费者相关的配置。

DefaultApplicationDeployer和DefaultModuleDeployer是怎么来的呢？我们在上一篇文章[Dubbo3域模型以及Model和Environment初始化](/zhuanlan/j2ee/dubbo/2/6.html)中已经有说明了，ScopeModelInitializer中的ConfigScopeModelInitializer会创建并注册DefaultApplicationDeployer和DefaultModuleDeployer这两个发布器，他们分别用于初始化并启动应用程序实例以及导出/引用模块的服务，非常重要。

这两个类是我们接下来学习的重点，接下来涉及到Dubbo核心启动流程。
