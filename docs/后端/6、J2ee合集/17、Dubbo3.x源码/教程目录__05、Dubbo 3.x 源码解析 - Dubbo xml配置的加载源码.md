# 05、Dubbo 3.x 源码解析 - Dubbo xml配置的加载源码
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/5.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo xml配置的加载源码。

## 1 Dubbo的配置来源

Dubbo的配置可以参考官方文档：[https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/config/properties/](https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/config/properties/)，或者[https://dubbo.apache.org/zh/docsv2.7/user/configuration/xml/](https://dubbo.apache.org/zh/docsv2.7/user/configuration/xml/)，可以说非常的全面了，这里不再赘述，本文追要讲解某些关键配置的解析入口源码。

**Dubbo 默认支持 6 种配置来源：**

**1、** JVMSystemProperties，JVM-D参数；

**2、** Systemenvironment，JVM进程的环境变量；

**3、** ExternalizedConfiguration，外部化配置，从配置中心读取；

**4、** ApplicationConfiguration，应用的属性配置，从Spring应用的Environment中提取"dubbo"打头的属性集；

**5、** API/XML/注解等编程接口采集的配置可以被理解成配置来源的一种，是直接面向用户编程的配置采集方式；

**6、** 从classpath读取配置文件dubbo.properties；

**关于dubbo.properties属性：**

**1、** 如果在classpath下有超过一个dubbo.properties文件，比如，两个jar包都各自包含了dubbo.properties，dubbo将随机选择一个加载，并且打印错误日志；

**2、** Dubbo可以自动加载classpath根目录下的dubbo.properties，但是你同样可以使用JVM参数来指定路径：-Ddubbo.properties.file=xxx.properties；

## 2 Spring xml配置的解析

我们通常将Dubbo与Spring结合使用，在最开始大多数使用的是基于xml的Dubbo配置，因此我们首先讲解Dubbo Spring xml启动Producer生产者流程的源码。但是现在基于Spring boot能够更快的构建Dubbo项目，减少许多配置，因此我们在后面也会讲Dubbo如何整合Spring boot，以及如何做到轻量级配置的。

我们此前就学习过了Spring的启动源码，而Dubbo与Spring结合的话，Dubbo的启动肯定是要依赖于Spring的启动流程的。因此，先学习Spring的启动源码，对于我们学习Dubbo来说必然是一件好事：[Spring 5.x 源码](https://blog.csdn.net/weixin_43767015/category_10402194.html)，推广开来，学习其他的组件的时候，那些组件的启动也都或多或少的与Spring有所联系，因此，Spring的源码我建议大家有时间还是得亲自看下的。当然，没学过也没关系，这里我们仅会讲解与Dubbo相关的源码内容。

### 2.1 xml标签的解析

常见的Dubbo Producer的xml配置文件如下（Dubbo源码dubbo-demo-xml-provider模块的配置文件）：

Spring启动的时候，会先加载各种配置文件，其中xml的配置有专门的spring-beans包下的**DefaultBeanDefinitionDocumentReader**类通过DefaultBeanDefinitionDocumentReader#parseBeanDefinitions方法来解析。

想要让spring解析扩展标签，只需要按照spring自定义命名空间扩展点的规则编写即可。首先在对应的模块的resources/ META-IN目录下编写好xml的标签以及属性约束，例如dubbo.xsd。

然后编写spring.schemas如下，用于定义schema约束文件的位置：

然后编写spring.handlers 文件，用于定义命名空间到自定义的NamespaceHandler实现的映射关系：

在编写spring xml文件的时候，引入自定义的命名空间，即可编写自定义的xml标签，并且在启动项目之后spring会扫描标签，然后找到对应的NamespaceHandler进行解析。

在**parseBeanDefinitions**方法中，对于我们引入的其他命名空间下的标签（扩展标签）的解析是调用的内部的**parseCustomElement**方法。Dubbo的xml标签也是自定义标签，也是通过该方法解析的。

**parseCustomElement**方法首先通过**namespaceHandlerResolver#resolve**方法根据**namespaceUri**获取对应的**handler**对象，随后调用handler实现的parse方法来解析**namespaceUri中**对应的标签，实际上，handler内部注册了一系列的标签的解析器，具体每个标签会调用不同的解析器进行解析。

“dubbo”这个namespaceUri的标签的Handler则是**DubboNamespaceHandler**，其内部注册了全部的dubbo标签以及对应的解析器。

上图中包括了目前Dubbo的全部标签以及对应的解析器，关于这些标签已经对应的配置的作用，可以参考官方文档：[https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/config/properties/](https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/config/properties/)，或者[https://dubbo.apache.org/zh/docsv2.7/user/configuration/xml/](https://dubbo.apache.org/zh/docsv2.7/user/configuration/xml/)，可以说非常的全面了，这里不再赘述。

可以看到，所有dubbo标签都使用DubboBeanDefinitionParser这个解析器，只不过在解析器构造器中传入的是各个配置解析之后的对象类型。常见的如service标签会被解析为ServiceBean类型的实例，而reference标签则会被解析为ReferenceBean类型的实例。

解析标签时，将会调用DubboNamespaceHandler#parse方法。

```java
public BeanDefinition parse(Element element, ParserContext parserContext) {
    BeanDefinitionRegistry registry = parserContext.getRegistry();
    /*
     * 1 向容器注册一系列的注解配置后处理器，用于后续扫描包、创建bean实例等过程中对大量相关注解的处理
     * 比如ConfigurationClassPostProcessor、AutowiredAnnotationBeanPostProcessor、CommonAnnotationBeanPostProcessor等重要的后处理器都是在这里注册的。
     * 该方法会重复调用
     */
    registerAnnotationConfigProcessors(registry);
    // initialize dubbo beans
    /*
     * 2 初始化一系列的Spring Dubbo 相关的内部bean以及dubbo上下文环境
     */
    DubboSpringInitializer.initialize(parserContext.getRegistry());
    /*
     * 3 通过选择对应的Parser解析当前dubbo标签节点为BeanDefintion并注册到spring容器
     */
    BeanDefinition beanDefinition = super.parse(element, parserContext);
    setSource(beanDefinition);
    return beanDefinition;
}
```

所谓的解析，就是获取某个xml节点的各个属性，然后设置到对应的类型的BeanDefinition实例中（此时还未实例化bean，更没有服务导出或者引入），然后交给spring容器管理。

在DubboNamespaceHandler#parse方法中，除了parse方法，我们还能看到在前面有辆外两个方法的调用。这两个方法通常会在解析dubbo xml文件的第一个标签``标签的时候但是第一次调用，但是我们会发现，由于paser方法对于每个dubbo标签的解析都会调用一次，因此内部的registerAnnotationConfigProcessors和DubboSpringInitializer.initialize方法实际上每次也会重复的调用，但是它们重复调用是无效的，看起来似乎不太优雅的样子……

## 3 registerAnnotationConfigProcessors注册注解配置处理器

首先是registerAnnotationConfigProcessors方法的调用，该方法向容器注册一系列的注解配置后处理器，用于支持spring注解的配置，该方法的源码我们此前就讲过了，在此不再赘述，详见：[https://blog.csdn.net/weixin_43767015/article/details/113800650](https://blog.csdn.net/weixin_43767015/article/details/113800650)的结尾。该方法重复调用无效。

所以说Dubbo在解析xml标签的时候，自动开启了注解的支持。

## 4 DubboSpringInitializer#initialize初始化dubbo

第二个调用的方法是DubboSpringInitializer#initialize方法，DubboSpringInitializer这个类是Dubbo Spring初始化的入口类，initialize方法用于初始化一系列的Spring Dubbo 相关的内部bean以及dubbo上下文环境，该方法初始化的对象可用于加载其他配置。该方法重复调用无效。

```java
/**
 * DubboSpringInitializer的方法
 * <p>
 * 初始化一系列的Spring Dubbo 相关的内部bean以及dubbo上下文环境
 *
 * @param registry bean定义注册表，一般都是ConfigurableListableBeanFactory或者AbstractApplicationContext及其实现类
 */
public static void initialize(BeanDefinitionRegistry registry) {
    // Spring ApplicationContext may not ready at this moment (e.g. load from xml), so use registry as key
    //Spring ApplicationContext现在可能还没有准备好(例如从xml加载配置)，所以使用注册表作为键
    //如果存在该注册表对象（spring 容器），那么直接返回，因为已经对该容器进行了dubbo相关初始化，否则value存储一个DubboSpringInitContext上下文对象
    if (contextMap.putIfAbsent(registry, new DubboSpringInitContext()) != null) {
        return;
    }
    // prepare context and do customize
    //准备dubbo上下文，以及进行自定义设置
    DubboSpringInitContext context = contextMap.get(registry);
    // find beanFactory
    //根据spring 容器获取ConfigurableListableBeanFactory类型的BeanFactory
    ConfigurableListableBeanFactory beanFactory = findBeanFactory(registry);
    // init dubbo context
    /*
     * 初始化dubbo上下文 核心代码
     */
    initContext(context, registry, beanFactory);
}
```

### 4.1 initContext初始化dubbo spring上下文

该方法初始化dubbo spring上下文，即DubboSpringInitContext。

**1、** 首先获取通过DubboSPI以及ThreadLocal配置的DubboSpringInitCustomizer，实现自定义上下文；

**2、** 然后初始化模块模型ModuleModel，这是服务模型，设置模块属性；

**3、** 将dubbo初始化上下文绑定到spring容器中，将上下文标记为已绑定；

**4、** 将dubbo的一些公共类注册到spring容器中；

```java
/**
 * DubboSpringInitializer的方法
 * <p>
 * 初始化Dubbo Spring上下文环境
 *
 * @param context     dubbo spring上下文
 * @param registry    spring bean定义注册表
 * @param beanFactory spring beanFactory
 */
private static void initContext(DubboSpringInitContext context, BeanDefinitionRegistry registry,
                                ConfigurableListableBeanFactory beanFactory) {
    //设置spring容器
    context.setRegistry(registry);
    context.setBeanFactory(beanFactory);
    // customize context, you can change the bind module model via DubboSpringInitCustomizer SPI
    /*
     * 1 获取通过Dubbo SPI 以及ThreadLocal配置的DubboSpringInitCustomizer，实现自定义上下文
     */
    customize(context);
    // init ModuleModel
    /*
     * 2 初始化模块模型，这是服务模型
     */
    ModuleModel moduleModel = context.getModuleModel();
    if (moduleModel == null) {
        ApplicationModel applicationModel;
        if (findContextForApplication(ApplicationModel.defaultModel()) == null) {
            // first spring context use default application instance
            applicationModel = ApplicationModel.defaultModel();
            logger.info("Use default application: " + safeGetModelDesc(applicationModel));
        } else {
            // create a new application instance for later spring context
            applicationModel = FrameworkModel.defaultModel().newApplication();
            logger.info("Create new application: " + safeGetModelDesc(applicationModel));
        }
        // init ModuleModel
        //设置到context中
        moduleModel = applicationModel.getDefaultModule();
        context.setModuleModel(moduleModel);
        logger.info("Use default module model of target application: " + safeGetModelDesc(moduleModel));
    } else {
        logger.info("Use module model from customizer: " + safeGetModelDesc(moduleModel));
    }
    logger.info("Bind " + safeGetModelDesc(moduleModel) + " to spring container: " + ObjectUtils.identityToString(registry));
    // set module attributes
    //设置模块属性
    if (context.getModuleAttributes().size() > 0) {
        context.getModuleModel().getAttributes().putAll(context.getModuleAttributes());
    }
    // bind dubbo initialization context to spring context
    /*
     * 3 将dubbo初始化上下文绑定到spring上下文，即注册一系列的dubbo bean到spring容器中
     */
    registerContextBeans(beanFactory, context);
    // mark context as bound
    context.markAsBound();
    // register common beans
    /*
     * 4 将dubbo的一些公共类注册到spring容器中
     */
    DubboBeanUtils.registerCommonBeans(registry);
}
```

#### 4.1.1 customize自定义dubbo spring上下文

获取通过Dubbo SPI 以及ThreadLocal配置的DubboSpringInitCustomizer，实现自定义上下文。

这是Dubbo留给用户的一个扩展点，我们可以在自定义逻辑中注册BeanFactoryPostProcessor或BeanPostProcessor，或者通过DubboSpringInitContext.setModuleModel(ModuleModel)来更改绑定模块模型。

注意此时spring容器还没有初始化完毕，一些bean定义可能还没有扫描，因此不建议对spring中的bean定义进行操作。

```java
/**
 * DubboSpringInitializer的方法
 * 
 * 获取通过Dubbo SPI 以及ThreadLocal配置的DubboSpringInitCustomizer，实现自定义上下文。、
 */
private static void customize(DubboSpringInitContext context) {
    // find initialization customizers
    /*
     * 通过Dubbo SPI机制查找初始化自定义器
     */
    Set<DubboSpringInitCustomizer> customizers =
        /*
         * 初始化、获取默认的FrameworkModel框架模型
         * Dubbo3新增了域模型，主要用于支持多应用程序部署。FrameworkModel是dubbo核心框架模型，可与多个应用程序共享
         * 初始化Dubbo模型的时候，就会初始化Dubbo的各种配置类，例如Environment，可用于查找其他地方的配置信息
         */
        FrameworkModel.defaultModel()
            //获取Dubbo SPI机制扩展加载器，ExtensionLoade这个类相当于JDK SPI中的ServiceLoader
            .getExtensionLoader(DubboSpringInitCustomizer.class)
            //基于Dubbo SPI机制获取该类型的全部扩展实现集合，目前版本没有默认实现，需要开发者自己扩展
            .getSupportedExtensionInstances();
    /*
     * 遍历、调用所有基于SPI机制的Dubbo Spring 初始化自定义器，自定义初始化逻辑
     * 目前版本没有默认实现，需要开发者自己扩展
     */
    for (DubboSpringInitCustomizer customizer : customizers) {
        //自定义上下文
        customizer.customize(context);
    }
    // load customizers in thread local holder
    //获取通过ThreadLocal存放到当前线程中的Dubbo Spring 初始化自定义器
    DubboSpringInitCustomizerHolder customizerHolder = DubboSpringInitCustomizerHolder.get();
    customizers = customizerHolder.getCustomizers();
    /*
     * 遍历、调用所有基于ThreadLocal的Dubbo Spring 初始化自定义器，自定义初始化逻辑
     * 目前版本没有默认实现，需要开发者自己扩展
     */
    for (DubboSpringInitCustomizer customizer : customizers) {
        customizer.customize(context);
    }
    //清理自定义器
    customizerHolder.clearCustomizers();
}
```

#### 4.1.2 registerContextBeans注册dubbo上下文bean

将dubbo初始化上下文绑定到spring上下文，即注册一系列的dubbo 上下文的bean到spring容器中。

**1、** 将DubboSpringInitContext对象本身注册到spring容器中，name为org.apache.dubbo.config.spring.context.DubboSpringInitContext；

**2、** 将DubboSpringInitContext对象内部的ApplicationModel，应用程序模块注册到spring容器中，name为org.apache.dubbo.rpc.model.ApplicationModel；

**3、** 将DubboSpringInitContext对象内部的ModuleModel，模型模块注册到spring容器中，name为org.apache.dubbo.rpc.model.ModuleModel；

```java
/**
 * DubboSpringInitializer的方法
 *
 * 将dubbo初始化上下文绑定到spring上下文，即注册一系列的dubbo bean到spring容器中
 * @param beanFactory spring beanFactory
 * @param context dubbo上下文
 */
private static void registerContextBeans(ConfigurableListableBeanFactory beanFactory, DubboSpringInitContext context) {
    // register singleton
    //将DubboSpringInitContext对象本身注册到spring容器中，name为org.apache.dubbo.config.spring.context.DubboSpringInitContext
    registerSingleton(beanFactory, context);
    //将DubboSpringInitContext对象内部的ApplicationModel，应用程序模块注册到spring容器中，name为org.apache.dubbo.rpc.model.ApplicationModel
    registerSingleton(beanFactory, context.getApplicationModel());
    //将DubboSpringInitContext对象内部的ModuleModel，模型模块注册到spring容器中，name为org.apache.dubbo.rpc.model.ModuleModel
    registerSingleton(beanFactory, context.getModuleModel());
}
```

#### 4.1.3 registerCommonBeans注册通用dubbo bean

该方法将会向spring容器中注册一系列的通用dubbo bean定义，仅仅是bean定义，还未实例化这些bean。

该方法是dubbo启动的核心方法之一，非常重要，一些重要的dubbo bean都是在这里注册的，例如ReferenceAnnotationBeanPostProcessor，该类用于处理@DubboReference、@Reference、@com.alibaba.dubbo.config.annotation.Reference等服务消费者的注解注入。这些bean定义的作用和源码，我们后面会接触到。

另外，从这个方法中能看到，在很多文章中提到的DubboBootstrapApplicationListener实际上是没有出现了，也就是说在最新的Dubbo源码中，基于spring的Dubbo的启动不再是通过DubboBootstrap类引导完成的，实际上是基于DubboDeployApplicationListener和DubboConfigApplicationListener这两个新加入的监听器来实现Dubbo启动的。其中DubboDeployApplicationListener可以看作是DubboBootstrapApplicationListener的替代组件，而DubboConfigApplicationListener则用于加载Dubbo配置。

```java
/**
 * 将dubbo的一些公共类注册到spring容器中
 *
 * @param registry {@link BeanDefinitionRegistry}
 * @see ReferenceAnnotationBeanPostProcessor
 * @see DubboConfigDefaultPropertyValueBeanPostProcessor
 * @see DubboConfigAliasPostProcessor
 */
static void registerCommonBeans(BeanDefinitionRegistry registry) {
    //服务已扫描的包的临时holder缓存
    registerInfrastructureBean(registry, ServicePackagesHolder.BEAN_NAME, ServicePackagesHolder.class);
    //服务引用ReferenceBean管理器
    registerInfrastructureBean(registry, ReferenceBeanManager.BEAN_NAME, ReferenceBeanManager.class);
    // Since 2.5.7 Register @Reference Annotation Bean Processor as an infrastructure Bean
    //处理@DubboReference、@Reference、@com.alibaba.dubbo.config.annotation.Reference等服务消费注解注入
    //获取类中标注的 @DubboReference 注解的字段和方法， 反射设置字段或方法对应的引用
    registerInfrastructureBean(registry, ReferenceAnnotationBeanPostProcessor.BEAN_NAME,
        ReferenceAnnotationBeanPostProcessor.class);
    // TODO Whether DubboConfigAliasPostProcessor can be removed ?
    // Since 2.7.4 [Feature] https://github.com/apache/dubbo/issues/5093
    //使用AbstractConfig.getId()设置Dubbo Config bean别名的后处理器类
    registerInfrastructureBean(registry, DubboConfigAliasPostProcessor.BEAN_NAME,
        DubboConfigAliasPostProcessor.class);
    // register ApplicationListeners
    //用于控制Dubbo应用程序的ApplicationListener
    registerInfrastructureBean(registry, DubboDeployApplicationListener.class.getName(), DubboDeployApplicationListener.class);
    //用于加载配置bean的ApplicationListener
    registerInfrastructureBean(registry, DubboConfigApplicationListener.class.getName(), DubboConfigApplicationListener.class);
    // Since 2.7.6 Register DubboConfigDefaultPropertyValueBeanPostProcessor as an infrastructure Bean
    //为Dubbo的Config bean设置默认属性值的BeanPostProcessor
    registerInfrastructureBean(registry, DubboConfigDefaultPropertyValueBeanPostProcessor.BEAN_NAME,
        DubboConfigDefaultPropertyValueBeanPostProcessor.class);
    // Dubbo config initializer
    //Dubbo配置bean的初始化器。
    //注意:Dubbo配置bean必须在注册所有beanpostprocessor之后初始化，即在AbstractApplicationContext#registerBeanPostProcessors()方法之后初始化。
    registerInfrastructureBean(registry, DubboConfigBeanInitializer.BEAN_NAME, DubboConfigBeanInitializer.class);
    // register infra bean if not exists later
    //用于注册一些基础Bean（如果它们不存在），例如ReferenceAnnotationBeanPostProcessor
    registerInfrastructureBean(registry, DubboInfraBeanRegisterPostProcessor.BEAN_NAME, DubboInfraBeanRegisterPostProcessor.class);
}
```
