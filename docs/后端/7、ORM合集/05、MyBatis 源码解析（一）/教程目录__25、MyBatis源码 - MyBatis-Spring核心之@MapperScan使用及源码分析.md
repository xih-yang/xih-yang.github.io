# 25、MyBatis源码 - MyBatis-Spring核心之@MapperScan使用及源码分析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/25.html
- 分类：ORM框架
- 分组：教程目录
### 注册映射器

在使用Mybatis中，我们需要将Mapper接口注册到Spring中，这叫注册映射器。

注册映射器的方法根据你的配置方法，即经典的 XML 配置或新的 3.0 以上版本的 Java 配置（也就是常说的 @Configuration），而有所不同。

#### 1. 使用 XML 配置

在你的XML 中加入 MapperFactoryBean 以便将映射器注册到 Spring 中。就像下面一样：

```xml
<bean id="userMapper" class="org.mybatis.spring.mapper.MapperFactoryBean">
  <property name="mapperInterface" value="org.mybatis.spring.sample.mapper.UserMapper" />
  <property name="sqlSessionFactory" ref="sqlSessionFactory" />
</bean>
```

如果映射器接口 UserMapper 在相同的类路径下有对应的 MyBatis XML 映射器配置文件，将会被 MapperFactoryBean 自动解析。不需要在 MyBatis 配置文件中显式配置映射器，除非映射器配置文件与接口类不在同一个类路径下。 参考 SqlSessionFactoryBean 的 configLocation 属性以获取更多信息。

注意MapperFactoryBean 需要配置一个 SqlSessionFactory 或 SqlSessionTemplate。它们可以分别通过 sqlSessionFactory 和 sqlSessionTemplate 属性来进行设置。 如果两者都被设置，SqlSessionFactory 将被忽略。由于 SqlSessionTemplate 已经设置了一个 session 工厂，MapperFactoryBean 将使用那个工厂。

#### 2. 使用Java 配置

```java
@Configuration
public class MyBatisConfig {
  @Bean
  public MapperFactoryBean<UserMapper> userMapper() throws Exception {
    MapperFactoryBean<UserMapper> factoryBean = new MapperFactoryBean<>(UserMapper.class);
    factoryBean.setSqlSessionFactory(sqlSessionFactory());
    return factoryBean;
  }
}
```

#### 3. 使用@MapperScan

不需要一个个地注册你的所有映射器。你可以让 MyBatis-Spring 对类路径进行扫描来发现它们。

有几种办法来发现映射器：

- 使用 `` 元素
- 使用 @MapperScan 注解
- 在经典 Spring XML 配置文件中注册一个 MapperScannerConfigurer

[mybatis:scan/](mybatis:scan/) 和 @MapperScan 都在 MyBatis-Spring 1.2.0 中被引入。@MapperScan 需要你使用 Spring 3.1+。

当你正在使用 Spring 的基于 Java 的配置时（也就是 @Configuration），相比于使用 ，你会更喜欢用 @MapperScan。

@MapperScan 注解的使用方法如下：

```java
@Configuration
@MapperScan("org.mybatis.spring.sample.mapper")
public class AppConfig {
  // ...
}
```

### 核心源码解读

#### @MapperScan

@MapperScan是MyBatis-Spring提供的注解，其源码及属性说明如下

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({
     ElementType.TYPE})
@Documented
@Import({
     MapperScannerRegistrar.class})
@Repeatable(MapperScans.class)
public @interface MapperScan {
	// basePackages属性的别名。允许更简洁的注释声明，例如：@MapperScan（“org.my.pkg”）
    String[] value() default {
     };
	// 基于包下面的扫描MyBatis的接口。注意是，只有是接口的将会被扫描注册，如果是具体的类将会被忽略。
    String[] basePackages() default {
     };
	// 这是一个安全替代basePackages()作为指定组件的扫描包。包下面的所有配置接口都将会被扫描。
    Class<?>[] basePackageClasses() default {
     };
	// 在Spring的容器中，将使用BeanNameGenerator去命名检测到的组件
    Class<? extends BeanNameGenerator> nameGenerator() default BeanNameGenerator.class;
	//  这个是基于包下面扫描所有的接口类并注册，也有指定的属性。   
    Class<? extends Annotation> annotationClass() default Annotation.class;
	// 基于包下面扫描所有接口类并注册，也可以指定特殊的接口为父类。
    Class<?> markerInterface() default Class.class;
	// 指定在spring上下文中有多个{@code SqlSessionTemplate}的情况下使用哪个{@code SqlSessionTemplate}
    String sqlSessionTemplateRef() default "";
	// 指定在spring上下文中存在多个{@code SqlSessionFactory}的情况下使用哪个{@code SqlSessionFactory}通常，只有当您有多个数据源时才需要这样做。
    String sqlSessionFactoryRef() default "";
	//  指定一个自定义MapperFactoryBean，以将mybatis代理作为SpringBean返回
    Class<? extends MapperFactoryBean> factoryBean() default MapperFactoryBean.class;
	// 是否启用映射器bean的延迟初始化
    String lazyInitialization() default "";
	// 指定扫描映射器的默认范围
    String defaultScope() default "";
}
```

#### MapperScannerRegistrar

MapperScannerRegistrar和@MapperSca位于同一目录，实现了ImportBeanDefinitionRegistrar和ResourceLoaderAware接口。

ImportBeanDefinitionRegistrar接口主要用来注册beanDefinition。实现了该接口，说明只能通过其@Import的方式来加载，而@MapperScan注解中就使用了@Import来加载这个类。

```java
public interface ImportBeanDefinitionRegistrar {
    default void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry, BeanNameGenerator importBeanNameGenerator) {
        this.registerBeanDefinitions(importingClassMetadata, registry);
    }
    default void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
    }
}
```

registerBeanDefinitions有重要的几个参数：

- 参数AnnotationMetadata注解元数据，会获取到@MapperScan注解上配置的属性
- BeanDefinitionRegistry ，用于将BeanDefinition注册到spring容器中
- BeanNameGenerator，（bean名字生成器）

registerBeanDefinitions重写了这些方法，主要是作用是获取@MapperScan中的配置，然后将这些配置传递给一个BeanDefinition。

#### MapperScannerConfigurer

MapperScannerConfigurer实现了以下接口：

- BeanDefinitionRegistryPostProcessor
- InitializingBean
- ApplicationContextAware
- BeanNameAware

Spring容器初始化时，从资源中读取到bean的相关定义后，保存在BeanDefinitionMap，在实例化bean的操作就是依据这些bean的定义来做的，而在实例化之前，Spring允许我们通过自定义扩展来改变bean的定义，而beanFactory后置处理器，即BeanFactoryPostProcessor就是用来改变bean定义的。

BeanDefinitionRegistryPostProcessor继承自BeanFactoryPostProcessor，其中有两个接口，postProcessBeanDefinitionRegistry是BeanDefinitionRegistryPostProcessor自带的，postProcessBeanFactory是从BeanFactoryPostProcessor继承过来的。

```java
public interface BeanDefinitionRegistryPostProcessor extends BeanFactoryPostProcessor {
	// 此方法在所有Bean定义将要被加载，Bean实例还未创建的时候运行，它优先于postProcessBeanFactory方法执行。
    void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry var1) throws BeansException;
}
```

MapperScannerConfigurer拥有很多属性值，基本和@MapperScan能对应起来。

其中的postProcessBeanDefinitionRegistry方法，创建了一个扫描器，并执行扫描操作。

```java
  @Override
  public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
    if (this.processPropertyPlaceHolders) {
      processPropertyPlaceHolders();
    }
    ClassPathMapperScanner scanner = new ClassPathMapperScanner(registry);
    scanner.setAddToConfig(this.addToConfig);
    scanner.setAnnotationClass(this.annotationClass);
    scanner.setMarkerInterface(this.markerInterface);
    scanner.setSqlSessionFactory(this.sqlSessionFactory);
    scanner.setSqlSessionTemplate(this.sqlSessionTemplate);
    scanner.setSqlSessionFactoryBeanName(this.sqlSessionFactoryBeanName);
    scanner.setSqlSessionTemplateBeanName(this.sqlSessionTemplateBeanName);
    scanner.setResourceLoader(this.applicationContext);
    scanner.setBeanNameGenerator(this.nameGenerator);
    scanner.setMapperFactoryBeanClass(this.mapperFactoryBeanClass);
    if (StringUtils.hasText(lazyInitialization)) {
      scanner.setLazyInitialization(Boolean.valueOf(lazyInitialization));
    }
    if (StringUtils.hasText(defaultScope)) {
      scanner.setDefaultScope(defaultScope);
    }
    scanner.registerFilters();
    scanner.scan(
        StringUtils.tokenizeToStringArray(this.basePackage, ConfigurableApplicationContext.CONFIG_LOCATION_DELIMITERS));
  }
```

#### ClassPathMapperScanner

ClassPathMapperScanner继承自ClassPathBeanDefinitionScanner（Spring 的类扫描器），

其doScan会根据配置扫描所有的BeanDefinition，并将其注册到容器中。

### Debug 分析

#### 1. 创建IOC容器

##### 1.1 创建IOC容器代码

首先我们在配置类上，添加了@MapperScan注解，配置了其value属性值。

```java
@MapperScan(basePackages = {
     "org.pearl.spring.mybatis.demo.dao"})
```

然后手动创建了一个AnnotationConfigApplicationContext类型的IOC容器，并传入了配置类参数。

```java
AnnotationConfigApplicationContext annotationConfigApplicationContext = new AnnotationConfigApplicationContext(MyBatisConfig.class, UserService.class);
```

##### 1.2 注册BeanDefinition

Spring在BeanFactory基础上提供了一些列具体容器的实现，其中AnnotationConfigApplicationContext是一个用来管理基于注解配置bean的容器。

spring在创建容器及Bean对象时，首先会创建BeanDefinition，也就是会根据注解或者XML配置的Bean的元数据，读写这些配置，生成对应的信息，统一放入一个beanDefinitionMap中，可以看到之前配置的MyBatisConfig类的BeanDefinition，被AnnotationConfigApplicationContext加载到了一个Map结构中：

##### 1.3 刷新上下文

BeanDefinition被注册以后，进入到refreshh()方法，该方法是整个Spring容器的核心，其体现了Spring容器的工作流程。

```java
public void refresh() throws BeansException, IllegalStateException {
    synchronized (this.startupShutdownMonitor) {
        // Prepare this context for refreshing.
        // 准备刷新的上下文环境
        prepareRefresh();
        // Tell the subclass to refresh the internal bean factory.
        // 获取beanFactory
        ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();
        // Prepare the bean factory for use in this context.
        // 设置beanFactory的各个属性
        prepareBeanFactory(beanFactory);
        try {
            // Allows post-processing of the bean factory in context subclasses.
            // 模板模式，留给子类通过重写这个方法来做其他处理
            postProcessBeanFactory(beanFactory);
            // Invoke factory processors registered as beans in the context.
            // BeanFactoryPostProcessorc，BeanFactory的后置处理器处理
            invokeBeanFactoryPostProcessors(beanFactory);
            // Register bean processors that intercept bean creation.
            // 注册BeanPostProcessors，拦截bean的创建过程，bean在这个时候还没创建
            registerBeanPostProcessors(beanFactory);
            // Initialize message source for this context.
            // 国际化处理
            initMessageSource();
            // Initialize event multicaster for this context.
            // 初始化事件派发器
            initApplicationEventMulticaster();
            // Initialize other special beans in specific context subclasses.
            // 模板模式，留给子类通过重写这个方法来做其他处理
            onRefresh();
            // Check for listener beans and register them.
            // 注册ApplicationListener到applicationEventMulticaster
            registerListeners();
            // Instantiate all remaining (non-lazy-init) singletons.
            // 初始化所有的单例，除了延迟加载的bean
            finishBeanFactoryInitialization(beanFactory);
            // Last step: publish corresponding event.
            // 通知别人说已经完成了
            finishRefresh();
        }
        catch (BeansException ex) {
            if (logger.isWarnEnabled()) {
                logger.warn("Exception encountered during context initialization - " +
                        "cancelling refresh attempt: " + ex);
            }
            // Destroy already created singletons to avoid dangling resources.
            destroyBeans();
            // Reset 'active' flag.
            cancelRefresh(ex);
            // Propagate exception to caller.
            throw ex;
        }
        finally {
            // Reset common introspection caches in Spring's core, since we
            // might not ever need metadata for singleton beans anymore...
            resetCommonCaches();
        }
    }
}
```

我们这里只关注invokeBeanFactoryPostProcessors方法，这个方法的作用是用来执行Bean工厂的后置处理器。根据反射机制从BeanDefinitionRegistry(bean定义注册中心)中找到所有实现了BeanFactoryPostProcessor接口bean，并调用其postProcessBeanFactory（）

```java
            // Invoke factory processors registered as beans in the context.
            // BeanFactoryPostProcessorc，BeanFactory的后置处理器处理
            invokeBeanFactoryPostProcessors(beanFactory);
```

#### 2. MapperScannerRegistrar注册

在IOC创建刷新上下文的过程中，会进行创建Bean工厂，获取BeanDefinition，后置处理器，实例化Bean等等操作。

因为MapperScannerRegistrar实现了ImportBeanDefinitionRegistrar接口，并且在@MapperScan中import了该类，所以，在加载BeanDefinition时，会进入该类的registerBeanDefinitions方法。

registerBeanDefinitions主要是获取@MapperScan配置信息，然后注册MapperScannerRegistrar类的BeanDefinition到容器中。

registerBeanDefinitions传入了两个参数，AnnotationMetadata是通过注解注入Bean的相关元数据，也就是@Configuration注解标识类的相关信息，BeanDefinitionRegistry 是BeanDefinition注册器，也就是所有的BeanDefinition都在这里。

registerBeanDefinitions或获取@MapperScan上配置的信息，然后调用generateBaseBeanName生成一个bean的名称。

```java
  @Override
  public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
    // 获取MapperScan注解上的配置
    AnnotationAttributes mapperScanAttrs = AnnotationAttributes
      .fromMap(importingClassMetadata.getAnnotationAttributes(MapperScan.class.getName()));
    // 导入元数据
    if (mapperScanAttrs != null) {
      registerBeanDefinitions(importingClassMetadata, mapperScanAttrs, registry,
        generateBaseBeanName(importingClassMetadata, 0));
    }
  }
```

生成的Bean名称如下：

```java
org.pearl.spring.mybatis.demo.config.MyBatisConfig#MapperScannerRegistrar#0
```

接着调用registerBeanDefinitions方法，该方法

```java
    void registerBeanDefinitions(AnnotationMetadata annoMeta, AnnotationAttributes annoAttrs, BeanDefinitionRegistry registry, String beanName) {
    	// 1. 使用MapperScannerConfigurer类，创建BeanDefinition构建者
        BeanDefinitionBuilder builder = BeanDefinitionBuilder.genericBeanDefinition(MapperScannerConfigurer.class);
        builder.addPropertyValue("processPropertyPlaceHolders", true);
        // 省略大量代码，将相关@MapperScann配置添加到BeanDefinition中
        builder.addPropertyValue("basePackage", StringUtils.collectionToCommaDelimitedString(basePackages));
        // 将当前BeanDefinition添加到注册器中。
        registry.registerBeanDefinition(beanName, builder.getBeanDefinition());
    }
```

最后，可以在BeanDefinitionRegistry中看到添加了当前MapperScannerRegistrar类的BeanDefinition被添加了。

#### 3. 扫描

MapperScannerRegistrar注册之后，IOC就会进行后置处理操作，因为MapperScannerConfigurer实现了ImportBeanDefinitionRegistrar接口，所以会执行BeanDefinition后置处理。

后置处理会进入到postProcessBeanDefinitionRegistry方法，主要是创建扫描器，执行扫描操作。

```java
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
        if (this.processPropertyPlaceHolders) {
        	// 1. processPropertyPlaceHolders 属性处理
            this.processPropertyPlaceHolders();
        }
		// 2. 创建classpath路径扫描器
        ClassPathMapperScanner scanner = new ClassPathMapperScanner(registry);
        scanner.setAddToConfig(this.addToConfig);
        scanner.setAnnotationClass(this.annotationClass);
        scanner.setMarkerInterface(this.markerInterface);
        scanner.setSqlSessionFactory(this.sqlSessionFactory);
        scanner.setSqlSessionTemplate(this.sqlSessionTemplate);
        scanner.setSqlSessionFactoryBeanName(this.sqlSessionFactoryBeanName);
        scanner.setSqlSessionTemplateBeanName(this.sqlSessionTemplateBeanName);
        scanner.setResourceLoader(this.applicationContext);
        scanner.setBeanNameGenerator(this.nameGenerator);
        scanner.setMapperFactoryBeanClass(this.mapperFactoryBeanClass);
        if (StringUtils.hasText(this.lazyInitialization)) {
            scanner.setLazyInitialization(Boolean.valueOf(this.lazyInitialization));
        }
        if (StringUtils.hasText(this.defaultScope)) {
            scanner.setDefaultScope(this.defaultScope);
        }
		// 3. 扫描
        scanner.registerFilters();
        scanner.scan(StringUtils.tokenizeToStringArray(this.basePackage, ",; \t\n"));
    }
```

创建扫描器后，会设置相关配置，最后当前扫描器维护了扫描路径，BeanDefinitionRegistry等信息。

首先调用扫描器registerFilters的方法，进行过滤操作，配置哪些需要扫描，哪些不需要扫描。

```java
    public void registerFilters() {
        boolean acceptAllInterfaces = true;
        if (this.annotationClass != null) {
            this.addIncludeFilter(new AnnotationTypeFilter(this.annotationClass));
            acceptAllInterfaces = false;
        }
        if (this.markerInterface != null) {
            this.addIncludeFilter(new AssignableTypeFilter(this.markerInterface) {
                protected boolean matchClassName(String className) {
                    return false;
                }
            });
            acceptAllInterfaces = false;
        }
        if (acceptAllInterfaces) {
            this.addIncludeFilter((metadataReader, metadataReaderFactory) -> {
                return true;
            });
        }
        this.addExcludeFilter((metadataReader, metadataReaderFactory) -> {
            String className = metadataReader.getClassMetadata().getClassName();
            return className.endsWith("package-info");
        });
    }
```

接着进入到扫描器的scan方法，进行扫描，参数会传入当前配置的扫描包路径。

```java
    public int scan(String... basePackages) {
    	// BeanDefinition总数
        int beanCountAtScanStart = this.registry.getBeanDefinitionCount();
        // 执行扫描
        this.doScan(basePackages);
        if (this.includeAnnotationConfig) {
      	//       AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry);
        }
        return this.registry.getBeanDefinitionCount() - beanCountAtScanStart;
    }
```

doScan方法最终调用的是父类ClassPathBeanDefinitionScanner的doScan方法。

```java
    protected Set<BeanDefinitionHolder> doScan(String... basePackages) {
        Assert.notEmpty(basePackages, "At least one base package must be specified");
        Set<BeanDefinitionHolder> beanDefinitions = new LinkedHashSet();
        String[] var3 = basePackages;
        int var4 = basePackages.length;
		// 循环配置的扫描路径
        for(int var5 = 0; var5 < var4; ++var5) {
            String basePackage = var3[var5];
            // 扫描到的BeanDefinition
            Set<BeanDefinition> candidates = this.findCandidateComponents(basePackage);
            Iterator var8 = candidates.iterator();
            // 循环当前扫描到的BeanDefinition
            while(var8.hasNext()) {
            	// 当前单个BeanDefinition
                BeanDefinition candidate = (BeanDefinition)var8.next();
                // 设置作用域
                ScopeMetadata scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(candidate);
                candidate.setScope(scopeMetadata.getScopeName());
                // 生成Bean名称=>userMapper
                String beanName = this.beanNameGenerator.generateBeanName(candidate, this.registry);
                if (candidate instanceof AbstractBeanDefinition) {
                    this.postProcessBeanDefinition((AbstractBeanDefinition)candidate, beanName);
                }
                if (candidate instanceof AnnotatedBeanDefinition) {
                    AnnotationConfigUtils.processCommonDefinitionAnnotations((AnnotatedBeanDefinition)candidate);
                }
				// 添加到beanDefinitionMap
                if (this.checkCandidate(beanName, candidate)) {
                    BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(candidate, beanName);
                    definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry);
                    beanDefinitions.add(definitionHolder);
                    this.registerBeanDefinition(definitionHolder, this.registry);
                }
            }
        }
        return beanDefinitions;
    }
```

正在扫描的地方是ClassPathScanningCandidateComponentProvider的scanCandidateComponents方法，

```java
    private Set<BeanDefinition> scanCandidateComponents(String basePackage) {
        LinkedHashSet candidates = new LinkedHashSet();
        try {
        	// 扫描的文件=》classpath*:org/pearl/spring/mybatis/demo/dao/**/*.class
            String packageSearchPath = "classpath*:" + this.resolveBasePackage(basePackage) + '/' + this.resourcePattern;
            // 获取到Resource扫描资源的集合
            Resource[] resources = this.getResourcePatternResolver().getResources(packageSearchPath);
            boolean traceEnabled = this.logger.isTraceEnabled();
            boolean debugEnabled = this.logger.isDebugEnabled();
            Resource[] var7 = resources;
            int var8 = resources.length;
			// 循环 Resource
            for(int var9 = 0; var9 < var8; ++var9) {
                Resource resource = var7[var9];
                if (traceEnabled) {
                    this.logger.trace("Scanning " + resource);
                }
                if (resource.isReadable()) {
                    try {
                    	// 根据资源获取MetadataReader读取对象
                        MetadataReader metadataReader = this.getMetadataReaderFactory().getMetadataReader(resource);
                        if (this.isCandidateComponent(metadataReader)) {
                        	// 根据扫描到的内容，创建BeanDefinition
                            ScannedGenericBeanDefinition sbd = new ScannedGenericBeanDefinition(metadataReader);
                            sbd.setSource(resource);
                            if (this.isCandidateComponent((AnnotatedBeanDefinition)sbd)) {
                                if (debugEnabled) {
                                    this.logger.debug("Identified candidate component class: " + resource);
                                }
                                candidates.add(sbd);
                            } else if (debugEnabled) {
                                this.logger.debug("Ignored because not a concrete top-level class: " + resource);
                            }
                        } else if (traceEnabled) {
                            this.logger.trace("Ignored because not matching any filter: " + resource);
                        }
                    } catch (Throwable var13) {
                        throw new BeanDefinitionStoreException("Failed to read candidate component class: " + resource, var13);
                    }
                } else if (traceEnabled) {
                    this.logger.trace("Ignored because not readable: " + resource);
                }
            }
            return candidates;
        } catch (IOException var14) {
            throw new BeanDefinitionStoreException("I/O failure during classpath scanning", var14);
        }
    }
```

经过扫描后的接口，一个个添加到BeanDefinitionRegistrar中了，入下图所示，UserMapper接口就被加载到IOC中了。扫描过程结束。

### 流程图

**1、** IOC初始化，刷新上下文，注册BeanDefinition，@MapperScan配置的MapperScannerRegistrar，获取到@MapperScan配置项，并添加到BeanDefinitionRegistrar中；

**2、** IOC后置处理BeanDefinition，此时进入到MapperScannerConfigurer；

**3、** MapperScannerConfigurer创建扫描器ClassPathMapperScanner，；

**4、** ClassPathMapperScanner根据配置的扫描路径，扫描到路径下所有文件，然后创建一个个BeanDefinition，添加到BeanDefinitionRegistrar中；

**5、** IOC完成BeanDefinition的加载，最终根据BeanDefinition实例化Bean对象；
