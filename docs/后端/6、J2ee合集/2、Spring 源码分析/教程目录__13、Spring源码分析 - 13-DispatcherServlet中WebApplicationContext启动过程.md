# 13、Spring源码分析 - 13-DispatcherServlet中WebApplicationContext启动过程
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/13.html
- 分类：J2EE框架
- 分组：教程目录
DispatcherServlet中WebApplicationContext的启动在父类FrameworkServlet的configureAndRefreshWebApplicationContext()方法中，其中WebApplicationContext的具体子类是AnnotationConfigWebApplicationContext。下图为ApplicationContext的继承结构。

```java
protected void configureAndRefreshWebApplicationContext(ConfigurableWebApplicationContext wac) {
   if (ObjectUtils.identityToString(wac).equals(wac.getId())) {
      // The application context id is still set to its original default value
      // -> assign a more useful id based on available information
      if (this.contextId != null) {
         wac.setId(this.contextId);
      }
      else {
         // Generate default id...
         wac.setId(ConfigurableWebApplicationContext.APPLICATION_CONTEXT_ID_PREFIX +
               ObjectUtils.getDisplayString(getServletContext().getContextPath()) + '/' + getServletName());
      }
   }
   wac.setServletContext(getServletContext());
   wac.setServletConfig(getServletConfig());
   wac.setNamespace(getNamespace());
   wac.addApplicationListener(new SourceFilteringListener(wac, new ContextRefreshListener()));
   // The wac environment'sinitPropertySources will be called in any case when the context
   // is refreshed; do it eagerly here to ensure servlet property sources are in place for
   // use in any post-processing or initialization that occurs below prior torefresh
   ConfigurableEnvironment env = wac.getEnvironment();
   if (env instanceof ConfigurableWebEnvironment) {
      ((ConfigurableWebEnvironment) env).initPropertySources(getServletContext(), getServletConfig());
   }
   postProcessWebApplicationContext(wac);
   applyInitializers(wac);
   wac.refresh();
}
```

ContextRefreshListener是FrameworkServlet的一个内部类，调用本实例(也就是DispatcherServlet)的onApplicationEvent()方法。

```java
private class ContextRefreshListener implements ApplicationListener<ContextRefreshedEvent> {
   @Override
   public void onApplicationEvent(ContextRefreshedEvent event) {
      FrameworkServlet.this.onApplicationEvent(event);
   }
}
```

```java
public void onApplicationEvent(ContextRefreshedEvent event) {
   this.refreshEventReceived = true;
   onRefresh(event.getApplicationContext());
}
```

```java
@Override
protected void onRefresh(ApplicationContext context) {
   initStrategies(context);
}
```

initStrategies()在Spring MVC中在分析，这里知道是在什么地方注册的回调即可(finishRefresh()中会发布ContextRefreshedEvent事件)。

postProcessWebApplicationContext()为一个空实现，子类可以覆盖此方法，用于在ConfigurableWebApplicationContext刷新前对它进行一些操作。

applyInitializers()方法用于执行注册到contextInitializers中的ApplicationContextInitializer对象，执行顺序就是 AnnotationAwareOrderComparator的排序规则，优先级如下，其中order值越小代表优先级越高。

```java
实现PriorityOrdered接口>实现Ordered接口>被标记@Order或@Priority
```

```java
protected void applyInitializers(ConfigurableApplicationContext wac) {
   String globalClassNames = getServletContext().getInitParameter(ContextLoader.GLOBAL_INITIALIZER_CLASSES_PARAM);
   if (globalClassNames != null) {
      for (String className : StringUtils.tokenizeToStringArray(globalClassNames, INIT_PARAM_DELIMITERS)) {
         this.contextInitializers.add(loadInitializer(className, wac));
      }
   }
   if (this.contextInitializerClasses != null) {
      for (String className : StringUtils.tokenizeToStringArray(this.contextInitializerClasses, INIT_PARAM_DELIMITERS)) {
         this.contextInitializers.add(loadInitializer(className, wac));
      }
   }
   AnnotationAwareOrderComparator.sort(this.contextInitializers);
   for (ApplicationContextInitializer<ConfigurableApplicationContext> initializer : this.contextInitializers) {
      initializer.initialize(wac);
   }
}
```

Spring核心框架中没有提供具体的ApplicationContextInitializer实现类，而Spring Boot提供了一系列实现如下，介绍[《SpringApplication运行阶段》](https://blog.csdn.net/shenchaohao12321/article/details/117048080)时在详细介绍。

refresh()是ApplicationContext启动的入口方法，作为一个模板方法被定义在了AbstractApplicationContext中，由子类决定具体方法的行为。

```java
@Override
public void refresh() throws BeansException, IllegalStateException {
   synchronized (this.startupShutdownMonitor) {
      // Prepare this context for refreshing.
      prepareRefresh();
      // Tell the subclass to refresh the internal bean factory.
      ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();
      // Prepare the bean factory for use in this context.
      prepareBeanFactory(beanFactory);
      try {
         // Allows post-processing of the bean factory in context subclasses.
         postProcessBeanFactory(beanFactory);
         // Invoke factory processors registered as beans in the context.
         invokeBeanFactoryPostProcessors(beanFactory);
         // Register bean processors that intercept bean creation.
         registerBeanPostProcessors(beanFactory);
         // Initialize message source for this context.
         initMessageSource();
         // Initialize event multicaster for this context.
         initApplicationEventMulticaster();
         // Initialize other special beans in specific context subclasses.
         onRefresh();
         // Check for listener beans and register them.
         registerListeners();
         // Instantiate all remaining (non-lazy-init) singletons.
         finishBeanFactoryInitialization(beanFactory);
         // Last step: publish corresponding event.
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

## 1、prepareRefresh()在启动容器前做一些准备工作。

```java
protected void prepareRefresh() {
   this.startupDate = System.currentTimeMillis();
   this.closed.set(false);
   this.active.set(true);
   if (logger.isInfoEnabled()) {
      logger.info("Refreshing " + this);
   }
   // 在上下文环境中初始化任何占位符属性源
   initPropertySources();//这步在FrameworkServlet中已经做过，对于WebApplicationContext
   // 验证标记为必需的所有属性是否可解析请参阅
   // ConfigurablePropertyResolver＃setRequiredProperties
   getEnvironment().validateRequiredProperties();
   // Allow for the collection of early ApplicationEvents,
   // to be published once the multicaster is available...
   this.earlyApplicationEvents = new LinkedHashSet<ApplicationEvent>();
}
```

## 2、obtainFreshBeanFactory()创建一个BeanFactory，一般是DefaultListableBeanFactory。

```java
protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {
   refreshBeanFactory();
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   if (logger.isDebugEnabled()) {
      logger.debug("Bean factory for " + getDisplayName() + ": " + beanFactory);
   }
   return beanFactory;
}
```

```java
@Override
protected final void refreshBeanFactory() throws BeansException {
   if (hasBeanFactory()) {
      destroyBeans();
      closeBeanFactory();
   }
   try {
      DefaultListableBeanFactory beanFactory = createBeanFactory();
      beanFactory.setSerializationId(getId());
      customizeBeanFactory(beanFactory);
      // 重要方法，加载定义的bean
      loadBeanDefinitions(beanFactory);
      synchronized (this.beanFactoryMonitor) {
         this.beanFactory = beanFactory;
      }
   }
   catch (IOException ex) {
      throw new ApplicationContextException("I/O error parsing bean definition source for " + getDisplayName(), ex);
   }
}
```

```java
protected void customizeBeanFactory(DefaultListableBeanFactory beanFactory) {
   if (this.allowBeanDefinitionOverriding != null) {
   // 允许bean重复定义 默认false
      beanFactory.setAllowBeanDefinitionOverriding(this.allowBeanDefinitionOverriding);
   }
   if (this.allowCircularReferences != null) {
      // 允许bean循环引用 默认true
      beanFactory.setAllowCircularReferences(this.allowCircularReferences);
   }
}
```

### 2.1、loadBeanDefinitions()方法用来加载并解析Bean为BeanDefinition。

下面是AnnotationConfigWebApplicationContext的具体实现。

```java
@Override
protected void loadBeanDefinitions(DefaultListableBeanFactory beanFactory) {
   // ClassPathBeanDefinitionScanner的替代类，用于解析基于注解的bean类的编程式注册
   AnnotatedBeanDefinitionReader reader = getAnnotatedBeanDefinitionReader(beanFactory);
   // 扫描包中的候选者类，前者直接解析类，后者扫描包中类
   ClassPathBeanDefinitionScanner scanner = getClassPathBeanDefinitionScanner(beanFactory);
   BeanNameGenerator beanNameGenerator = getBeanNameGenerator();
   if (beanNameGenerator != null) {
      reader.setBeanNameGenerator(beanNameGenerator);
      scanner.setBeanNameGenerator(beanNameGenerator);
      // 将取名器也注册为一个单例bean 默认null
      beanFactory.registerSingleton(AnnotationConfigUtils.CONFIGURATION_BEAN_NAME_GENERATOR, beanNameGenerator);
   }
   // 用于解析scope 定义的bean的策略接口默认为null
   ScopeMetadataResolver scopeMetadataResolver = getScopeMetadataResolver();
   if (scopeMetadataResolver != null) {
      reader.setScopeMetadataResolver(scopeMetadataResolver);
      scanner.setScopeMetadataResolver(scopeMetadataResolver);
   }
   if (!this.annotatedClasses.isEmpty()) {
      if (logger.isInfoEnabled()) {
         logger.info("Registering annotated classes: [" +
               StringUtils.collectionToCommaDelimitedString(this.annotatedClasses) + "]");
      }
      // 注册一个或多个要处理的带注解@Configuration的类。
      reader.register(this.annotatedClasses.toArray(new Class<?>[this.annotatedClasses.size()]));
   }
   if (!this.basePackages.isEmpty()) {
      if (logger.isInfoEnabled()) {
         logger.info("Scanning base packages: [" +
               StringUtils.collectionToCommaDelimitedString(this.basePackages) + "]");
      }
      // 在指定的基础包中执行扫描。
      scanner.scan(this.basePackages.toArray(new String[this.basePackages.size()]));
   }
   // 在AnnotationConfigWebApplicationContext中，configLocations代表@Configuration类名或要扫描的包名
   String[] configLocations = getConfigLocations();
   if (configLocations != null) {
      for (String configLocation : configLocations) {
         try {
            Class<?> clazz = getClassLoader().loadClass(configLocation);
            if (logger.isInfoEnabled()) {
               logger.info("Successfully resolved class for [" + configLocation + "]");
            }
            reader.register(clazz);
         }
         catch (ClassNotFoundException ex) {
            if (logger.isDebugEnabled()) {
               logger.debug("Could not load class for config location [" + configLocation +
                     "] - trying package scan. " + ex);
            }
            int count = scanner.scan(configLocation);
            if (logger.isInfoEnabled()) {
               if (count == 0) {
                  logger.info("No annotated classes found for specified class/package [" + configLocation + "]");
               }
               else {
                  logger.info("Found " + count + " annotated classes in package [" + configLocation + "]");
               }
            }
         }
      }
   }
}
```

AnnotatedBeanDefinitionReader和ClassPathBeanDefinitionScanner分别用来解析指定的Class和指定包下的Class为BeanDefinition。

```java
protected AnnotatedBeanDefinitionReader getAnnotatedBeanDefinitionReader(DefaultListableBeanFactory beanFactory) {
   return new AnnotatedBeanDefinitionReader(beanFactory, getEnvironment());
}
protected ClassPathBeanDefinitionScanner getClassPathBeanDefinitionScanner(DefaultListableBeanFactory beanFactory) {
   return new ClassPathBeanDefinitionScanner(beanFactory, true, getEnvironment());
}
```

#### 2.1.1、AnnotatedBeanDefinitionReader

```java
public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry, Environment environment) {
   Assert.notNull(registry, "BeanDefinitionRegistry must not be null");
   Assert.notNull(environment, "Environment must not be null");
   this.registry = registry;
   this.conditionEvaluator = new ConditionEvaluator(registry, environment, null);
   AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry);
}
```

ConditionEvaluator是Spring内部使用的类，用来解析@Conditional注解。

AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry)为BeanFactory进行一些配置，主要是注册一些框架级别的BeanFactoryPostProcessor，这些BeanFactoryPostProcessor都非常重要，下面给出这些BeanFactoryPostProcessor源码分析的连接地址。

[《Spring源码分析 - AutowiredAnnotationBeanPostProcessor》](/zhuanlan/j2ee/spring/7/16.html)、[《Spring源码分析 - RequiredAnnotationBeanPostProcessor》](/zhuanlan/j2ee/spring/7/17.html)、[《Spring源码分析 - CommonAnnotationBeanPostProcessor》](/zhuanlan/j2ee/spring/7/18.html)、[《Spring源码分析 - ConfigurationClassPostProcessor》](/zhuanlan/j2ee/spring/7/19.html)、[《Spring源码分析 - ApplicationEvent事件机制》](/zhuanlan/j2ee/spring/7/20.html)

```java
public static Set<BeanDefinitionHolder> registerAnnotationConfigProcessors(
      BeanDefinitionRegistry registry, Object source) {
   // 取得ApplicationContext持有的beanFactory，而不是ApplicationContext本身
   DefaultListableBeanFactory beanFactory = unwrapDefaultListableBeanFactory(registry);
   if (beanFactory != null) {
      if (!(beanFactory.getDependencyComparator() instanceof AnnotationAwareOrderComparator)) {
         beanFactory.setDependencyComparator(AnnotationAwareOrderComparator.INSTANCE);
      }
      if (!(beanFactory.getAutowireCandidateResolver() instanceof ContextAnnotationAutowireCandidateResolver)) {
         // 将默认的SimpleAutowireCandidateResolver替换成支持@Qualifier、@Value、@Lazy注解的ContextAnnotationAutowireCandidateResolver
         beanFactory.setAutowireCandidateResolver(new ContextAnnotationAutowireCandidateResolver());
      }
   }
   // 下面是注册框架级别的一些用于注解的基础组件
   Set<BeanDefinitionHolder> beanDefs = new LinkedHashSet<BeanDefinitionHolder>(4);
   if (!registry.containsBeanDefinition(CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(ConfigurationClassPostProcessor.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME));
   }
   if (!registry.containsBeanDefinition(AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(AutowiredAnnotationBeanPostProcessor.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME));
   }
   if (!registry.containsBeanDefinition(REQUIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(RequiredAnnotationBeanPostProcessor.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, REQUIRED_ANNOTATION_PROCESSOR_BEAN_NAME));
   }
   // Check for JSR-250 support, and if present add the CommonAnnotationBeanPostProcessor.
   if (jsr250Present && !registry.containsBeanDefinition(COMMON_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(CommonAnnotationBeanPostProcessor.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, COMMON_ANNOTATION_PROCESSOR_BEAN_NAME));
   }
   // Check for JPA support, and if present add the PersistenceAnnotationBeanPostProcessor.
   if (jpaPresent && !registry.containsBeanDefinition(PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition();
      try {
         def.setBeanClass(ClassUtils.forName(PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME,
               AnnotationConfigUtils.class.getClassLoader()));
      }
      catch (ClassNotFoundException ex) {
         throw new IllegalStateException(
               "Cannot load optional framework class: " + PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME, ex);
      }
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME));
   }
   if (!registry.containsBeanDefinition(EVENT_LISTENER_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(EventListenerMethodProcessor.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_PROCESSOR_BEAN_NAME));
   }
   if (!registry.containsBeanDefinition(EVENT_LISTENER_FACTORY_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(DefaultEventListenerFactory.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_FACTORY_BEAN_NAME));
   }
   return beanDefs;
}
```

之后会调用registerBean()方法从给定的Class上面的注解上推导出BeanDefinition。

```java
public void registerBean(Class<?> annotatedClass, String name, Class<? extends Annotation>... qualifiers) {
   AnnotatedGenericBeanDefinition abd = new AnnotatedGenericBeanDefinition(annotatedClass);
   // 不满足@Conditional注解value指定的实现Condition接口的实现类则跳过
   if (this.conditionEvaluator.shouldSkip(abd.getMetadata())) {
      return;
   }
   //默认使用AnnotationScopeMetadataResolver从@Scope得到scopeName(默认singleton)和scopedProxyMode(默认ScopedProxyMode.NO)
   ScopeMetadata scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(abd);
   abd.setScope(scopeMetadata.getScopeName());
   // 默认使用AnnotationBeanNameGenerator根据@Component(或继承他的注解)、@ManagedBean、@Named的value属性取名
   // 如果均不存在这些注解则使用类名首字母小写作为bean name
   String beanName = (name != null ? name : this.beanNameGenerator.generateBeanName(abd, this.registry));
   //根据注解@Lazy,@Primary,@DependsOn,@Role,@Description设置BeanDefinition相应的属性
   AnnotationConfigUtils.processCommonDefinitionAnnotations(abd);
   if (qualifiers != null) {
      for (Class<? extends Annotation> qualifier : qualifiers) {
         if (Primary.class == qualifier) {
            abd.setPrimary(true);
         }
         else if (Lazy.class == qualifier) {
            abd.setLazyInit(true);
         }
         else {
            abd.addQualifier(new AutowireCandidateQualifier(qualifier));
         }
      }
   }
   BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(abd, beanName);
   //如果是ScopedProxyMode.TARGET_CLASS，使用ScopedProxyCreator.createScopedProxy()新建一个BeanDefinition替换原有的
   //新的beanClass为ScopedProxyFactoryBean，是原始bean的代理对象，而原始bean重命名为scopedTarget.beanname
   definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry);
   BeanDefinitionReaderUtils.registerBeanDefinition(definitionHolder, this.registry);
}
```

#### 2.1.2、ClassPathBeanDefinitionScanner

这部分内容移至[《Spring源码分析-ClassPathBeanDefinitionScanner》](/zhuanlan/j2ee/spring/7/41.html)。

## 3、prepareBeanFactory()为BeanFactory配置标准的上下文特征如post-processors。

```java
protected void prepareBeanFactory(ConfigurableListableBeanFactory beanFactory) {
   // Tell the internal bean factory to use the context's class loader etc.
   beanFactory.setBeanClassLoader(getClassLoader());
   beanFactory.setBeanExpressionResolver(new StandardBeanExpressionResolver(beanFactory.getBeanClassLoader()));
   beanFactory.addPropertyEditorRegistrar(new ResourceEditorRegistrar(this, getEnvironment()));
   // Configure the bean factory with context callbacks.
   beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this));
   //下面6种类型autowire不会自动装配，因为ApplicationContextAwareProcessor会自动set相应的对象
   beanFactory.ignoreDependencyInterface(EnvironmentAware.class);
   beanFactory.ignoreDependencyInterface(EmbeddedValueResolverAware.class);
   beanFactory.ignoreDependencyInterface(ResourceLoaderAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationEventPublisherAware.class);
   beanFactory.ignoreDependencyInterface(MessageSourceAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationContextAware.class);
   // BeanFactory interface not registered as resolvable type in a plain factory.
   // MessageSource registered (and found for autowiring) as a bean.
   beanFactory.registerResolvableDependency(BeanFactory.class, beanFactory);
   beanFactory.registerResolvableDependency(ResourceLoader.class, this);
   beanFactory.registerResolvableDependency(ApplicationEventPublisher.class, this);
   beanFactory.registerResolvableDependency(ApplicationContext.class, this);
   // Register early post-processor for detecting inner beans as ApplicationListeners.
   beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(this));
   // Detect a LoadTimeWeaver and prepare for weaving, if found.
   if (beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      // Set a temporary ClassLoader for type matching.
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }
   // Register default environment beans.
   if (!beanFactory.containsLocalBean(ENVIRONMENT_BEAN_NAME)) {
      beanFactory.registerSingleton(ENVIRONMENT_BEAN_NAME, getEnvironment());
   }
   if (!beanFactory.containsLocalBean(SYSTEM_PROPERTIES_BEAN_NAME)) {
      beanFactory.registerSingleton(SYSTEM_PROPERTIES_BEAN_NAME, getEnvironment().getSystemProperties());
   }
   if (!beanFactory.containsLocalBean(SYSTEM_ENVIRONMENT_BEAN_NAME)) {
      beanFactory.registerSingleton(SYSTEM_ENVIRONMENT_BEAN_NAME, getEnvironment().getSystemEnvironment());
   }
}
```

## 4、postProcessBeanFactory()由子类AbstractRefreshableWebApplicationContext覆盖，添加与servletContext相关的bean。

```java
@Override
protected void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
   beanFactory.addBeanPostProcessor(new ServletContextAwareProcessor(this.servletContext, this.servletConfig));
   beanFactory.ignoreDependencyInterface(ServletContextAware.class);
   beanFactory.ignoreDependencyInterface(ServletConfigAware.class);
   //注册针对web环境的scope ("request", "session", "globalSession", "application")
   //具体设计实现参考/zhuanlan/j2ee/spring/7/34.html
   WebApplicationContextUtils.registerWebApplicationScopes(beanFactory, this.servletContext);
   //注册ServletContext环境相关的单例
   WebApplicationContextUtils.registerEnvironmentBeans(beanFactory, this.servletContext, this.servletConfig);
}
public static void registerWebApplicationScopes(ConfigurableListableBeanFactory beanFactory, ServletContext sc) {
   beanFactory.registerScope(WebApplicationContext.SCOPE_REQUEST, new RequestScope());
   beanFactory.registerScope(WebApplicationContext.SCOPE_SESSION, new SessionScope(false));
   beanFactory.registerScope(WebApplicationContext.SCOPE_GLOBAL_SESSION, new SessionScope(true));
   if (sc != null) {
      ServletContextScope appScope = new ServletContextScope(sc);
      beanFactory.registerScope(WebApplicationContext.SCOPE_APPLICATION, appScope);
      // Register as ServletContext attribute, for ContextCleanupListener to detect it.
      sc.setAttribute(ServletContextScope.class.getName(), appScope);
   }
   beanFactory.registerResolvableDependency(ServletRequest.class, new RequestObjectFactory());
   beanFactory.registerResolvableDependency(ServletResponse.class, new ResponseObjectFactory());
   beanFactory.registerResolvableDependency(HttpSession.class, new SessionObjectFactory());
   beanFactory.registerResolvableDependency(WebRequest.class, new WebRequestObjectFactory());
   if (jsfPresent) {
      FacesDependencyRegistrar.registerFacesDependencies(beanFactory);
   }
}
//使用WebApplicationContext使用的给定BeanFactory注册特定于Web的环境bean（“contextParameters”，“contextAttributes”）。
public static void registerEnvironmentBeans(
      ConfigurableListableBeanFactory bf, ServletContext servletContext, ServletConfig servletConfig) {
   if (servletContext != null && !bf.containsBean(WebApplicationContext.SERVLET_CONTEXT_BEAN_NAME)) {
      bf.registerSingleton(WebApplicationContext.SERVLET_CONTEXT_BEAN_NAME, servletContext);
   }
   if (servletConfig != null && !bf.containsBean(ConfigurableWebApplicationContext.SERVLET_CONFIG_BEAN_NAME)) {
      bf.registerSingleton(ConfigurableWebApplicationContext.SERVLET_CONFIG_BEAN_NAME, servletConfig);
   }
   if (!bf.containsBean(WebApplicationContext.CONTEXT_PARAMETERS_BEAN_NAME)) {
      Map<String, String> parameterMap = new HashMap<String, String>();
      if (servletContext != null) {
         Enumeration<?> paramNameEnum = servletContext.getInitParameterNames();
         while (paramNameEnum.hasMoreElements()) {
            String paramName = (String) paramNameEnum.nextElement();
            parameterMap.put(paramName, servletContext.getInitParameter(paramName));
         }
      }
      if (servletConfig != null) {
         Enumeration<?> paramNameEnum = servletConfig.getInitParameterNames();
         while (paramNameEnum.hasMoreElements()) {
            String paramName = (String) paramNameEnum.nextElement();
            parameterMap.put(paramName, servletConfig.getInitParameter(paramName));
         }
      }
      bf.registerSingleton(WebApplicationContext.CONTEXT_PARAMETERS_BEAN_NAME,
            Collections.unmodifiableMap(parameterMap));
   }
   if (!bf.containsBean(WebApplicationContext.CONTEXT_ATTRIBUTES_BEAN_NAME)) {
      Map<String, Object> attributeMap = new HashMap<String, Object>();
      if (servletContext != null) {
         Enumeration<?> attrNameEnum = servletContext.getAttributeNames();
         while (attrNameEnum.hasMoreElements()) {
            String attrName = (String) attrNameEnum.nextElement();
            attributeMap.put(attrName, servletContext.getAttribute(attrName));
         }
      }
      bf.registerSingleton(WebApplicationContext.CONTEXT_ATTRIBUTES_BEAN_NAME,
            Collections.unmodifiableMap(attributeMap));
   }
}
```

## 5、invokeBeanFactoryPostProcessors()方法用来执行已经注册过的 BeanFactoryPostProcessor，许多核心注解处理器就在这个地方生效的，以后会单独讲解这些核心BeanFactoryPostProcessor。

```java
protected void invokeBeanFactoryPostProcessors(ConfigurableListableBeanFactory beanFactory) {
   //注解配置核心类ConfigurationClassPostProcessor生效的地方
   PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, getBeanFactoryPostProcessors());
   // Detect a LoadTimeWeaver and prepare for weaving, if found in the meantime
   // (e.g. through an @Bean method registered by ConfigurationClassPostProcessor)
   if (beanFactory.getTempClassLoader() == null && beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }
}
```

下面是PostProcessorRegistrationDelegate的代码，逐句分析一下。

```java
class PostProcessorRegistrationDelegate {
   public static void invokeBeanFactoryPostProcessors(
         ConfigurableListableBeanFactory beanFactory, List<BeanFactoryPostProcessor> beanFactoryPostProcessors) {
      //用来保存已从bean factory取出以bean定义方式注册的BeanFactoryPostProcessor的bean name
      Set<String> processedBeans = new HashSet<>();
      //首先调用BeanDefinitionRegistryPostProcessors，如果有的话。
      if (beanFactory instanceof BeanDefinitionRegistry) {
         BeanDefinitionRegistry registry = (BeanDefinitionRegistry) beanFactory;
         //保存一般的BeanFactoryPostProcessor而非BeanDefinitionRegistryPostProcessor
         List<BeanFactoryPostProcessor> regularPostProcessors = new LinkedList<>();
         //保存特殊的BeanFactoryPostProcessor子类BeanDefinitionRegistryPostProcessor
         List<BeanDefinitionRegistryPostProcessor> registryProcessors = new LinkedList<>();
         //优先处理已通过addBeanFactoryPostProcessor()方法添加好的BeanFactoryPostProcessor
         for (BeanFactoryPostProcessor postProcessor : beanFactoryPostProcessors) {
            //如果是BeanDefinitionRegistryPostProcessor直接调用其postProcessBeanDefinitionRegistry()方法并保存它
            if (postProcessor instanceof BeanDefinitionRegistryPostProcessor) {
               BeanDefinitionRegistryPostProcessor registryProcessor =
                     (BeanDefinitionRegistryPostProcessor) postProcessor;
               registryProcessor.postProcessBeanDefinitionRegistry(registry);
               registryProcessors.add(registryProcessor);
            }
            else {
               //普通BeanFactoryPostProcessor先不执行，保存下来后面同一执行
               regularPostProcessors.add(postProcessor);
            }
         }
         // Do not initialize FactoryBeans here: We need to leave all regular beans
         // uninitialized to let the bean factory post-processors apply to them!
         // Separate between BeanDefinitionRegistryPostProcessors that implement
         // PriorityOrdered, Ordered, and the rest.
         List<BeanDefinitionRegistryPostProcessor> currentRegistryProcessors = new ArrayList<>();
         // First, invoke the BeanDefinitionRegistryPostProcessors that implement PriorityOrdered.
         //从bean定义方式中找出实现了接口PriorityOrdered的BeanDefinitionRegistryPostProcessor的bean实例，放入容器currentRegistryProcessors中
         String[] postProcessorNames =
               beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
         for (String ppName : postProcessorNames) {
            if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
               currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
               processedBeans.add(ppName);
            }
         }
         //将bean定义形式的BeanDefinitionRegistryPostProcessor实例按已设置的dependencyComparator(AnnotationAwareOrderComparator.INSTANCE)排序，排序规则前面讲过
         sortPostProcessors(currentRegistryProcessors, beanFactory);
         registryProcessors.addAll(currentRegistryProcessors);
         //按照排序好的BeanDefinitionRegistryPostProcessor对象依次调用postProcessBeanDefinitionRegistry()方法
         invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
         currentRegistryProcessors.clear();
         // Next, invoke the BeanDefinitionRegistryPostProcessors that implement Ordered.
         //从bean定义方式中找出实现了接口Ordered的BeanDefinitionRegistryPostProcessor的bean实例，并且保证不能重复处理同一个对象
         postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
         for (String ppName : postProcessorNames) {
            if (!processedBeans.contains(ppName) && beanFactory.isTypeMatch(ppName, Ordered.class)) {
               currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
               processedBeans.add(ppName);
            }
         }
         sortPostProcessors(currentRegistryProcessors, beanFactory);
         registryProcessors.addAll(currentRegistryProcessors);
         invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
         //到此为止，Spring框架内置的与我们手动添加(包括addBeanFactoryPostProcessor和BeanDefinition形式)的BeanDefinitionRegistryPostProcessor已执行完毕
         currentRegistryProcessors.clear();
         // Finally, invoke all other BeanDefinitionRegistryPostProcessors until no further ones appear.
         // 由于registryProcessors中的BeanDefinitionRegistryPostProcessor.postProcessBeanDefinitionRegistry()方法可能会动态的添加一些bean定义和BeanFactoryPostProcessor
         // 所以需要不断地从beanFactory中取出registryProcessors未保存的BeanDefinitionRegistryPostProcessor实例调用postProcessBeanDefinitionRegistry()方法
         // 直到beanFactory不再有新的BeanDefinitionRegistryPostProcessor实例出现
         boolean reiterate = true;
         while (reiterate) {
            reiterate = false;
            postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
            for (String ppName : postProcessorNames) {
               if (!processedBeans.contains(ppName)) {
                  currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
                  processedBeans.add(ppName);
                  reiterate = true;
               }
            }
            sortPostProcessors(currentRegistryProcessors, beanFactory);
            registryProcessors.addAll(currentRegistryProcessors);
            invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
            currentRegistryProcessors.clear();
         }
         // Now, invoke the postProcessBeanFactory callback of all processors handled so far.
         // postProcessBeanDefinitionRegistry()方法全都执行完后，就可以执行BeanFactoryPostProcessor中的postProcessBeanFactory()方法了
         // BeanDefinitionRegistryPostProcessor优先执行于BeanFactoryPostProcessor
         invokeBeanFactoryPostProcessors(registryProcessors, beanFactory);
         invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory);
      }
      else {
         // Invoke factory processors registered with the context instance.
         invokeBeanFactoryPostProcessors(beanFactoryPostProcessors, beanFactory);
      }
      // Do not initialize FactoryBeans here: We need to leave all regular beans
      // uninitialized to let the bean factory post-processors apply to them!
      // 最后处理bean定义的BeanFactoryPostProcessor，优先级为：实现PriorityOrdered接口的 > 实现Ordered接口的 > 其他
      String[] postProcessorNames =
            beanFactory.getBeanNamesForType(BeanFactoryPostProcessor.class, true, false);
      // Separate between BeanFactoryPostProcessors that implement PriorityOrdered,
      // Ordered, and the rest.
      List<BeanFactoryPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
      List<String> orderedPostProcessorNames = new ArrayList<>();
      List<String> nonOrderedPostProcessorNames = new ArrayList<>();
      for (String ppName : postProcessorNames) {
         if (processedBeans.contains(ppName)) {
            // skip - already processed in first phase above
         }
         else if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
            priorityOrderedPostProcessors.add(beanFactory.getBean(ppName, BeanFactoryPostProcessor.class));
         }
         else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
            orderedPostProcessorNames.add(ppName);
         }
         else {
            nonOrderedPostProcessorNames.add(ppName);
         }
      }
      // First, invoke the BeanFactoryPostProcessors that implement PriorityOrdered.
      sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
      invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory);
      // Next, invoke the BeanFactoryPostProcessors that implement Ordered.
      List<BeanFactoryPostProcessor> orderedPostProcessors = new ArrayList<>();
      for (String postProcessorName : orderedPostProcessorNames) {
         orderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
      }
      sortPostProcessors(orderedPostProcessors, beanFactory);
      invokeBeanFactoryPostProcessors(orderedPostProcessors, beanFactory);
      // Finally, invoke all other BeanFactoryPostProcessors.
      List<BeanFactoryPostProcessor> nonOrderedPostProcessors = new ArrayList<>();
      for (String postProcessorName : nonOrderedPostProcessorNames) {
         nonOrderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
      }
      invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);
      // Clear cached merged bean definitions since the post-processors might have
      // modified the original metadata, e.g. replacing placeholders in values...
      beanFactory.clearMetadataCache();
   }
}
```

## 6、registerBeanPostProcessors()方法从bean factory中实例化BeanPostProcessor后注册。

```java
public static void registerBeanPostProcessors(
      ConfigurableListableBeanFactory beanFactory, AbstractApplicationContext applicationContext) {
   String[] postProcessorNames = beanFactory.getBeanNamesForType(BeanPostProcessor.class, true, false);
   // Register BeanPostProcessorChecker that logs an info message when
   // a bean is created during BeanPostProcessor instantiation, i.e. when
   // a bean is not eligible for getting processed by all BeanPostProcessors.
   int beanProcessorTargetCount = beanFactory.getBeanPostProcessorCount() + 1 + postProcessorNames.length;
   // 如果一个bean实例化的时候不是所有BeanPostProcessor都被注册，这时BeanPostProcessorChecker会打印info级别的日志:
   // logger.info("Bean '" + beanName + "' of type [" + bean.getClass().getName() + "] is not eligible for getting processed by all BeanPostProcessors (for example: not eligible for auto-proxying)")
   beanFactory.addBeanPostProcessor(new BeanPostProcessorChecker(beanFactory, beanProcessorTargetCount));
   // Separate between BeanPostProcessors that implement PriorityOrdered,Ordered, and the rest.
   // 处理区分优先级与BeanFactoryPostProcessor一样
   List<BeanPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
   // 保存MergedBeanDefinitionPostProcessor实例并且最后注册
   List<BeanPostProcessor> internalPostProcessors = new ArrayList<>();
   List<String> orderedPostProcessorNames = new ArrayList<>();
   List<String> nonOrderedPostProcessorNames = new ArrayList<>();
   for (String ppName : postProcessorNames) {
      if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
         BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
         priorityOrderedPostProcessors.add(pp);
         if (pp instanceof MergedBeanDefinitionPostProcessor) {
            internalPostProcessors.add(pp);
         }
      }
      else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
         orderedPostProcessorNames.add(ppName);
      }
      else {
         nonOrderedPostProcessorNames.add(ppName);
      }
   }
   // First, register the BeanPostProcessors that implement PriorityOrdered.
   sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
   registerBeanPostProcessors(beanFactory, priorityOrderedPostProcessors);
   // Next, register the BeanPostProcessors that implement Ordered.
   List<BeanPostProcessor> orderedPostProcessors = new ArrayList<>();
   for (String ppName : orderedPostProcessorNames) {
      BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
      orderedPostProcessors.add(pp);
      if (pp instanceof MergedBeanDefinitionPostProcessor) {
         internalPostProcessors.add(pp);
      }
   }
   sortPostProcessors(orderedPostProcessors, beanFactory);
   registerBeanPostProcessors(beanFactory, orderedPostProcessors);
   // Now, register all regular BeanPostProcessors.
   List<BeanPostProcessor> nonOrderedPostProcessors = new ArrayList<>();
   for (String ppName : nonOrderedPostProcessorNames) {
      BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
      nonOrderedPostProcessors.add(pp);
      if (pp instanceof MergedBeanDefinitionPostProcessor) {
         internalPostProcessors.add(pp);
      }
   }
   registerBeanPostProcessors(beanFactory, nonOrderedPostProcessors);
   // Finally, re-register all internal BeanPostProcessors.
   sortPostProcessors(internalPostProcessors, beanFactory);
   registerBeanPostProcessors(beanFactory, internalPostProcessors);
   // Re-register post-processor for detecting inner beans as ApplicationListeners,
   // moving it to the end of the processor chain (for picking up proxies etc).
   // ApplicationListenerDetector会将单例bean是ApplicationListener的加入applicationContext中
   // applicationContext.addApplicationListener((ApplicationListener<?>) bean)
   beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(applicationContext));
}
```

## 7、initMessageSource()方法为容器中注册一个名为messageSource的 DelegatingMessageSource的bean用于i18n。

```java
protected void initMessageSource() {
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   if (beanFactory.containsLocalBean(MESSAGE_SOURCE_BEAN_NAME)) {
      this.messageSource = beanFactory.getBean(MESSAGE_SOURCE_BEAN_NAME, MessageSource.class);
      // Make MessageSource aware of parent MessageSource.
      if (this.parent != null && this.messageSource instanceof HierarchicalMessageSource) {
         HierarchicalMessageSource hms = (HierarchicalMessageSource) this.messageSource;
         if (hms.getParentMessageSource() == null) {
            // Only set parent context as parent MessageSource if no parent MessageSource
            // registered already.
            hms.setParentMessageSource(getInternalParentMessageSource());
         }
      }
      if (logger.isDebugEnabled()) {
         logger.debug("Using MessageSource [" + this.messageSource + "]");
      }
   }
   else {
      // Use empty MessageSource to be able to accept getMessage calls.
      DelegatingMessageSource dms = new DelegatingMessageSource();
      dms.setParentMessageSource(getInternalParentMessageSource());
      this.messageSource = dms;
      beanFactory.registerSingleton(MESSAGE_SOURCE_BEAN_NAME, this.messageSource);
      if (logger.isDebugEnabled()) {
         logger.debug("Unable to locate MessageSource with name '" + MESSAGE_SOURCE_BEAN_NAME +
               "': using default [" + this.messageSource + "]");
      }
   }
}
```

## 8、initApplicationEventMulticaster()方法注册applicationEventMulticaster

初始化ApplicationEventMulticaster。 如果在上下文中没有定义，则使用SimpleApplicationEventMulticaster。

关于ApplicationEventMulticaster的实现原理请参考[《Spring源码分析 - ApplicationEvent事件机制》](/zhuanlan/j2ee/spring/7/20.html)。

```java
protected void initApplicationEventMulticaster() {
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   if (beanFactory.containsLocalBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME)) {
      this.applicationEventMulticaster =
            beanFactory.getBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, ApplicationEventMulticaster.class);
      if (logger.isDebugEnabled()) {
         logger.debug("Using ApplicationEventMulticaster [" + this.applicationEventMulticaster + "]");
      }
   }
   else {
      this.applicationEventMulticaster = new SimpleApplicationEventMulticaster(beanFactory);
      beanFactory.registerSingleton(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, this.applicationEventMulticaster);
      if (logger.isDebugEnabled()) {
         logger.debug("Unable to locate ApplicationEventMulticaster with name '" +
               APPLICATION_EVENT_MULTICASTER_BEAN_NAME +
               "': using default [" + this.applicationEventMulticaster + "]");
      }
   }
}
```

## 9、onRefresh()方法默认在AbstractRefreshableWebApplicationContext中创建一个名为themeSource变量的ResourceBundleThemeSource。

```java
public static ThemeSource initThemeSource(ApplicationContext context) {
   if (context.containsLocalBean(THEME_SOURCE_BEAN_NAME)) {
      ThemeSource themeSource = context.getBean(THEME_SOURCE_BEAN_NAME, ThemeSource.class);
      // Make ThemeSource aware of parent ThemeSource.
      if (context.getParent() instanceof ThemeSource && themeSource instanceof HierarchicalThemeSource) {
         HierarchicalThemeSource hts = (HierarchicalThemeSource) themeSource;
         if (hts.getParentThemeSource() == null) {
            // Only set parent context as parent ThemeSource if no parent ThemeSource
            // registered already.
            hts.setParentThemeSource((ThemeSource) context.getParent());
         }
      }
      if (logger.isDebugEnabled()) {
         logger.debug("Using ThemeSource [" + themeSource + "]");
      }
      return themeSource;
   }
   else {
      // Use default ThemeSource to be able to accept getTheme calls, either
      // delegating to parent context's default or to local ResourceBundleThemeSource.
      HierarchicalThemeSource themeSource = null;
      if (context.getParent() instanceof ThemeSource) {
         themeSource = new DelegatingThemeSource();
         themeSource.setParentThemeSource((ThemeSource) context.getParent());
      }
      else {
         themeSource = new ResourceBundleThemeSource();
      }
      if (logger.isDebugEnabled()) {
         logger.debug("Unable to locate ThemeSource with name '" + THEME_SOURCE_BEAN_NAME +
               "': using default [" + themeSource + "]");
      }
      return themeSource;
   }
}
```

## 10、registerListeners()方法将容器中的所有ApplicationListener添加到ApplicationEventMulticaster中以便所有ApplicationListener可以监听到消息。

```java
protected void registerListeners() {
   // Register statically specified listeners first.
   for (ApplicationListener<?> listener : getApplicationListeners()) {
      getApplicationEventMulticaster().addApplicationListener(listener);
   }
   // Do not initialize FactoryBeans here: We need to leave all regular beans
   // uninitialized to let post-processors apply to them!
   String[] listenerBeanNames = getBeanNamesForType(ApplicationListener.class, true, false);
   for (String listenerBeanName : listenerBeanNames) {
      getApplicationEventMulticaster().addApplicationListenerBean(listenerBeanName);
   }
   // Publish early application events now that we finally have a multicaster...
   Set<ApplicationEvent> earlyEventsToProcess = this.earlyApplicationEvents;
   this.earlyApplicationEvents = null;
   if (earlyEventsToProcess != null) {
      for (ApplicationEvent earlyEvent : earlyEventsToProcess) {
         getApplicationEventMulticaster().multicastEvent(earlyEvent);
      }
   }
}
```

## 11、finishBeanFactoryInitialization()方法主要是提前实例化单例对象。

```java
protected void finishBeanFactoryInitialization(ConfigurableListableBeanFactory beanFactory) {
   // Initialize conversion service for this context.
   if (beanFactory.containsBean(CONVERSION_SERVICE_BEAN_NAME) &&
         beanFactory.isTypeMatch(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class)) {
      beanFactory.setConversionService(
            beanFactory.getBean(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class));
   }
   // Register a default embedded value resolver if no bean post-processor
   // (such as a PropertyPlaceholderConfigurer bean) registered any before:
   // at this point, primarily for resolution in annotation attribute values.
   if (!beanFactory.hasEmbeddedValueResolver()) {
      beanFactory.addEmbeddedValueResolver(new StringValueResolver() {
         @Override
         public String resolveStringValue(String strVal) {
            return getEnvironment().resolvePlaceholders(strVal);
         }
      });
   }
   // Initialize LoadTimeWeaverAware beans early to allow for registering their transformers early.
   String[] weaverAwareNames = beanFactory.getBeanNamesForType(LoadTimeWeaverAware.class, false, false);
   for (String weaverAwareName : weaverAwareNames) {
      getBean(weaverAwareName);
   }
   // Stop using the temporary ClassLoader for type matching.
   beanFactory.setTempClassLoader(null);
   // Allow for caching all bean definition metadata, not expecting further changes.
   beanFactory.freezeConfiguration();
   // Instantiate all remaining (non-lazy-init) singletons.
   beanFactory.preInstantiateSingletons();
}
```

```java
public void preInstantiateSingletons() throws BeansException {
   if (this.logger.isDebugEnabled()) {
      this.logger.debug("Pre-instantiating singletons in " + this);
   }
   // Iterate over a copy to allow for init methods which in turn register new bean definitions.
   // While this may not be part of the regular factory bootstrap, it does otherwise work fine.
   List<String> beanNames = new ArrayList<>(this.beanDefinitionNames);
   // Trigger initialization of all non-lazy singleton beans...
   for (String beanName : beanNames) {
      RootBeanDefinition bd = getMergedLocalBeanDefinition(beanName);
      if (!bd.isAbstract() && bd.isSingleton() && !bd.isLazyInit()) {
         if (isFactoryBean(beanName)) {
            Object bean = getBean(FACTORY_BEAN_PREFIX + beanName);
            if (bean instanceof FactoryBean) {
               final FactoryBean<?> factory = (FactoryBean<?>) bean;
               boolean isEagerInit;
               if (System.getSecurityManager() != null && factory instanceof SmartFactoryBean) {
                  isEagerInit = AccessController.doPrivileged((PrivilegedAction<Boolean>)
                              ((SmartFactoryBean<?>) factory)::isEagerInit,
                        getAccessControlContext());
               }
               else {
                  isEagerInit = (factory instanceof SmartFactoryBean &&
                        ((SmartFactoryBean<?>) factory).isEagerInit());
               }
               if (isEagerInit) {
                  getBean(beanName);
               }
            }
         }
         else {
            getBean(beanName);
         }
      }
   }
   // Trigger post-initialization callback for all applicable beans...
   for (String beanName : beanNames) {
      Object singletonInstance = getSingleton(beanName);
      if (singletonInstance instanceof SmartInitializingSingleton) {
         final SmartInitializingSingleton smartSingleton = (SmartInitializingSingleton) singletonInstance;
         if (System.getSecurityManager() != null) {
            AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
               smartSingleton.afterSingletonsInstantiated();
               return null;
            }, getAccessControlContext());
         }
         else {
            smartSingleton.afterSingletonsInstantiated();
         }
      }
   }
}
```

## 12、finishRefresh()注册LifecycleProcessor，发布ContextRefreshedEvent。

```java
protected void finishRefresh() {
   // 如果没有配置beanname是lifecycleProcessor则使用DefaultLifecycleProcessor
   initLifecycleProcessor();
   // 对于DefaultLifecycleProcessor调用其startBeans(true)方法，会中出容器中所有的Lifecycle调用它的start()方法
   getLifecycleProcessor().onRefresh();
   // 向监听器发送广播，容器启动事件
   publishEvent(new ContextRefreshedEvent(this));
   // 如果配置了MBeanServer，就完成在MBeanServer上的注册
   LiveBeansView.registerApplicationContext(this);
}
```

初始化LifecycleProcessor。如果在上下文中没有定义，则使用DefaultLifecycleProcessor。

```java
protected void initLifecycleProcessor() {
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   if (beanFactory.containsLocalBean(LIFECYCLE_PROCESSOR_BEAN_NAME)) {
      this.lifecycleProcessor =
            beanFactory.getBean(LIFECYCLE_PROCESSOR_BEAN_NAME, LifecycleProcessor.class);
      if (logger.isTraceEnabled()) {
         logger.trace("Using LifecycleProcessor [" + this.lifecycleProcessor + "]");
      }
   }
   else {
      DefaultLifecycleProcessor defaultProcessor = new DefaultLifecycleProcessor();
      defaultProcessor.setBeanFactory(beanFactory);
      this.lifecycleProcessor = defaultProcessor;
      beanFactory.registerSingleton(LIFECYCLE_PROCESSOR_BEAN_NAME, this.lifecycleProcessor);
      if (logger.isTraceEnabled()) {
         logger.trace("No '" + LIFECYCLE_PROCESSOR_BEAN_NAME + "' bean, using " +
               "[" + this.lifecycleProcessor.getClass().getSimpleName() + "]");
      }
   }
}
```

关于LifecycleProcessor请参考[《Spring源码分析 - Spring容器生命周期回调接口——LifeCycle》](/zhuanlan/j2ee/spring/7/39.html)。
