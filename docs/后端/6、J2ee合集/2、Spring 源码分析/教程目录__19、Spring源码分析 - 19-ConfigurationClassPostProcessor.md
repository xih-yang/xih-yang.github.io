# 19、Spring源码分析 - 19-ConfigurationClassPostProcessor
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/19.html
- 分类：J2EE框架
- 分组：教程目录
## 1、ConfigurationClassPostProcessor如何应用

ConfigurationClassPostProcessor在Spring启动时为我们自动注册的

- 当我们使用了XmlWebApplicationContext并在配置文件中配置了``或``元素，XmlWebApplicationContext的loadBeanDefinitions()方法会使用XmlBeanDefinitionReader.loadBeanDefinitions(Resource) 方法在内部注册一个ConfigurationClassPostProcessor的BeanDefinition。
- 当使用AnnotationConfigWebApplicationContext时在loadBeanDefinitions方法被调用时会使用ClassPathBeanDefinitionScanner.scan()方法注册一个ConfigurationClassPostProcessor的BeanDefinition。
- 当使用的是AnnotationConfigApplicationContext会在scan(String...)方法被调用时注册ConfigurationClassPostProcessor的BeanDefinition。

以上三种注册ConfigurationClassPostProcessor的方式都是使用了AnnotationConfigUtils的静态方法registerAnnotationConfigProcessors()。

### 2、postProcessBeanDefinitionRegistry()原理分析

ConfigurationClassPostProcessor是BeanDefinitionRegistryPostProcessor的实现类，用来解析被@Configuration，@Component，@ComponentScan，@Import，@ImportResource标记的类，在postProcessBeanDefinitionRegistry()方法执行阶段会将进一步从被@Configuration标记的类上面寻找BeanDefintion注册到容器中。

```java
@Override
public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
   int registryId = System.identityHashCode(registry);
   if (this.registriesPostProcessed.contains(registryId)) {
      throw new IllegalStateException(
            "postProcessBeanDefinitionRegistry already called on this post-processor against " + registry);
   }
   if (this.factoriesPostProcessed.contains(registryId)) {
      throw new IllegalStateException(
            "postProcessBeanFactory already called on this post-processor against " + registry);
   }
   //保存处理过的registry，避免重复处理
   this.registriesPostProcessed.add(registryId);
   //处理java bean配置形式的bean定义
   processConfigBeanDefinitions(registry);
}
public void processConfigBeanDefinitions(BeanDefinitionRegistry registry) {
   List<BeanDefinitionHolder> configCandidates = new ArrayList<>();
   //取出容器中已经存在的所有bean 定义
   String[] candidateNames = registry.getBeanDefinitionNames();
   //判断每个bean定义是否是ConfigurationClass(被@Configuration，@Component，@ComponentScan，@Import，@ImportResource标记的),
   //如果是则会给这个bean definition增加一个属性，避免重复解析
   for (String beanName : candidateNames) {
      BeanDefinition beanDef = registry.getBeanDefinition(beanName);
      // isFullConfigurationClass判断是否有full属性，isLiteConfigurationClass判断是否有lite属性
      // 首次判断都为false，下面分支checkConfigurationClassCandidate方法会赋值这个属性
      if (ConfigurationClassUtils.isFullConfigurationClass(beanDef) ||
            ConfigurationClassUtils.isLiteConfigurationClass(beanDef)) {
         if (logger.isDebugEnabled()) {
            logger.debug("Bean definition has already been processed as a configuration class: " + beanDef);
         }
      }
      //如果符合一个配置类型的java类定义，带有@Configuration为full
      //带有@Component、@ComponentScan、@Import、@ImportResource之一或方法上有@Bean为lite
      //加入configCandidates集合，后面根据优先级实例化配置bean
      else if (ConfigurationClassUtils.checkConfigurationClassCandidate(beanDef, this.metadataReaderFactory)) {
         configCandidates.add(new BeanDefinitionHolder(beanDef, beanName));
      }
   }
   // Return immediately if no @Configuration classes were found
   if (configCandidates.isEmpty()) {
      return;
   }
   // Sort by previously determined @Order value, if applicable
   configCandidates.sort((bd1, bd2) -> {
      int i1 = ConfigurationClassUtils.getOrder(bd1.getBeanDefinition());
      int i2 = ConfigurationClassUtils.getOrder(bd2.getBeanDefinition());
      return Integer.compare(i1, i2);
   });
   // Detect any custom bean name generation strategy supplied through the enclosing application context
   SingletonBeanRegistry sbr = null;
   if (registry instanceof SingletonBeanRegistry) {
      sbr = (SingletonBeanRegistry) registry;
      if (!this.localBeanNameGeneratorSet) {
         //如果AnnotationConfigWebApplicationContext设置了beanNameGenerator，则使用该beanNameGenerator
         //否则组件扫描bean name是简单类名首字母小写，被导入的bean name是类的全限定名
         BeanNameGenerator generator = (BeanNameGenerator) sbr.getSingleton(CONFIGURATION_BEAN_NAME_GENERATOR);
         if (generator != null) {
            this.componentScanBeanNameGenerator = generator;
            this.importBeanNameGenerator = generator;
         }
      }
   }
   if (this.environment == null) {
      this.environment = new StandardEnvironment();
   }
   // Parse each @Configuration class
   //用于将被注解的类转换成ConfigurationClass供ConfigurationClassBeanDefinitionReader注册
   ConfigurationClassParser parser = new ConfigurationClassParser(
         this.metadataReaderFactory, this.problemReporter, this.environment,
         this.resourceLoader, this.componentScanBeanNameGenerator, registry);
   Set<BeanDefinitionHolder> candidates = new LinkedHashSet<>(configCandidates);
   Set<ConfigurationClass> alreadyParsed = new HashSet<>(configCandidates.size());
   //解析一个ConfigurationClass后可能产生新的ConfigurationClass definition需要循环处理
   do {
      //解析ConfigurationClass的过程
      parser.parse(candidates);
      //@Configuration类不允许是final的，因为需要使用CGLIB生成代理对象，见postProcessBeanFactory方法。
      //@Bean方法必须是可被重写的(可以是私有方法)静态方法不做处理
      parser.validate();
      //所有的配置类@Configuration
      Set<ConfigurationClass> configClasses = new LinkedHashSet<>(parser.getConfigurationClasses());
      configClasses.removeAll(alreadyParsed);
      // Read the model and create bean definitions based on its content
      if (this.reader == null) {
         this.reader = new ConfigurationClassBeanDefinitionReader(
               registry, this.sourceExtractor, this.resourceLoader, this.environment,
               this.importBeanNameGenerator, parser.getImportRegistry());
      }
      //将@Configuration @Import @ImportResource @ImportRegistrar注册为bean
      this.reader.loadBeanDefinitions(configClasses);
      alreadyParsed.addAll(configClasses);
      candidates.clear();
      if (registry.getBeanDefinitionCount() > candidateNames.length) {
         String[] newCandidateNames = registry.getBeanDefinitionNames();
         Set<String> oldCandidateNames = new HashSet<>(Arrays.asList(candidateNames));
         Set<String> alreadyParsedClasses = new HashSet<>();
         for (ConfigurationClass configurationClass : alreadyParsed) {
            alreadyParsedClasses.add(configurationClass.getMetadata().getClassName());
         }
         //如果有新的bean注册，判断是否符合配置类 进而继续解析
         for (String candidateName : newCandidateNames) {
            if (!oldCandidateNames.contains(candidateName)) {
               BeanDefinition bd = registry.getBeanDefinition(candidateName);
               if (ConfigurationClassUtils.checkConfigurationClassCandidate(bd, this.metadataReaderFactory) &&
                     !alreadyParsedClasses.contains(bd.getBeanClassName())) {
                  candidates.add(new BeanDefinitionHolder(bd, candidateName));
               }
            }
         }
         candidateNames = newCandidateNames;
      }
   }
   while (!candidates.isEmpty());
   // Register the ImportRegistry as a bean in order to support ImportAware @Configuration classes
   if (sbr != null && !sbr.containsSingleton(IMPORT_REGISTRY_BEAN_NAME)) {
      //ImportStack记录了哪些配置类通过@Import(看ImportSelector,ImportBeanDefinitionRegistrar接口)导入了哪些类
      //后面通过ImportAwareBeanPostProcessor的功能实现了ImportAware接口的配置类可以得到导入类的注解属性
      sbr.registerSingleton(IMPORT_REGISTRY_BEAN_NAME, parser.getImportRegistry());
   }
   if (this.metadataReaderFactory instanceof CachingMetadataReaderFactory) {
      // Clear cache in externally provided MetadataReaderFactory; this is a no-op
      // for a shared cache since it'll be cleared by the ApplicationContext.
      ((CachingMetadataReaderFactory) this.metadataReaderFactory).clearCache();
   }
}
```

配置类ConfigurationClass代表了一个用户定义的@Configuration注解的类，其中包含了其自身和祖先标有@Bean的方法。

```java
final class ConfigurationClass {
   //带有该配置类注解信息的ClassMetadata,可获取类和类上面注解的信息
   private final AnnotationMetadata metadata;
   //类的来源
   private final Resource resource;
   //该类的bean name
   @Nullable
   private String beanName;
   //是被哪个配置类@Import的
   private final Set<ConfigurationClass> importedBy = new LinkedHashSet<>(1);
   //自身和祖先的@Bean方法
   private final Set<BeanMethod> beanMethods = new LinkedHashSet<>();
   //保存@ImportResource location与reader属性，后会使用reader解析location代表的资源转换一波配置类
   private final Map<String, Class<? extends BeanDefinitionReader>> importedResources =
         new LinkedHashMap<>();
   //@Import value属性是ImportBeanDefinitionRegistrar
   private final Map<ImportBeanDefinitionRegistrar, AnnotationMetadata> importBeanDefinitionRegistrars =
         new LinkedHashMap<>();
   //记录不满足@Conditional value属性指定接口的@Bean方法，因为子类重写方法可能不满足条件，固需要记录，解析到父类就可直接跳过
   final Set<String> skippedBeanMethods = new HashSet<>();
}
```

### 2.1、parse()方法解析

在看ConfigurationClassParser.parse()方法前先看看他的成员变量。

```java
class ConfigurationClassParser {
   private static final PropertySourceFactory DEFAULT_PROPERTY_SOURCE_FACTORY = new DefaultPropertySourceFactory();
   private static final Comparator<DeferredImportSelectorHolder> DEFERRED_IMPORT_COMPARATOR =
         (o1, o2) -> AnnotationAwareOrderComparator.INSTANCE.compare(o1.getImportSelector(), o2.getImportSelector());
   private final Log logger = LogFactory.getLog(getClass());
   //构造器传入CachingMetadataReaderFactory
   private final MetadataReaderFactory metadataReaderFactory;
   //构造器传入FailFastProblemReporter
   private final ProblemReporter problemReporter;
   //容器传入
   private final Environment environment;
   //构造器传入DefaultResourceLoader
   private final ResourceLoader resourceLoader;
   //当前容器
   private final BeanDefinitionRegistry registry;
   //解析@ComponentScan
   private final ComponentScanAnnotationParser componentScanParser;
   //根据@Conditional注解指定的Condition接口来决定是否跳过此方法的解析
   private final ConditionEvaluator conditionEvaluator;
   //保存解析过的@Configuration类
   private final Map<ConfigurationClass, ConfigurationClass> configurationClasses = new LinkedHashMap<>();
   //保存被解析类父类，避免多个子类导致同一个父类被解析多次
   private final Map<String, ConfigurationClass> knownSuperclasses = new HashMap<>();
   //保存@PropertySource指定的资源
   private final List<String> propertySourceNames = new ArrayList<>();
   //保存@Import导入的类 key是正在解析的 value是被导入的
   private final ImportStack importStack = new ImportStack();
   //保存当@Import指定的是DeferredImportSelector，这类延迟解析 见parse方法
   private final DeferredImportSelectorHandler deferredImportSelectorHandler = new DeferredImportSelectorHandler();
   public ConfigurationClassParser(MetadataReaderFactory metadataReaderFactory,
      ProblemReporter problemReporter, Environment environment, ResourceLoader resourceLoader,
      BeanNameGenerator componentScanBeanNameGenerator, BeanDefinitionRegistry registry) {
       this.metadataReaderFactory = metadataReaderFactory;
       this.problemReporter = problemReporter;
       this.environment = environment;
       this.resourceLoader = resourceLoader;
       this.registry = registry;
       this.componentScanParser = new ComponentScanAnnotationParser(
         environment, resourceLoader, componentScanBeanNameGenerator, registry);
       this.conditionEvaluator = new ConditionEvaluator(registry, environment, resourceLoader);
   }
}
```

ConfigurationClassParser.parse()方法解析配置类，parse()方法内部会统一调用processConfigurationClass()方法。

```java
public void parse(Set<BeanDefinitionHolder> configCandidates) {
   for (BeanDefinitionHolder holder : configCandidates) {
      BeanDefinition bd = holder.getBeanDefinition();
      try {
         //首次调用parse()方法处理的是AnnotatedBeanDefinition，通过@ImportResource加载的xml资源会走下面两个分支
         if (bd instanceof AnnotatedBeanDefinition) {
            parse(((AnnotatedBeanDefinition) bd).getMetadata(), holder.getBeanName());
         }
         else if (bd instanceof AbstractBeanDefinition && ((AbstractBeanDefinition) bd).hasBeanClass()) {
            parse(((AbstractBeanDefinition) bd).getBeanClass(), holder.getBeanName());
         }
         else {
            parse(bd.getBeanClassName(), holder.getBeanName());
         }
      }
      catch (BeanDefinitionStoreException ex) {
         throw ex;
      }
      catch (Throwable ex) {
         throw new BeanDefinitionStoreException(
               "Failed to parse configuration class [" + bd.getBeanClassName() + "]", ex);
      }
   }
   //处理@Import指定的是DeferredImportSelector
   this.deferredImportSelectorHandler.process();
}
protected final void parse(@Nullable String className, String beanName) throws IOException {
   Assert.notNull(className, "No bean class name for configuration class bean definition");
   MetadataReader reader = this.metadataReaderFactory.getMetadataReader(className);
   processConfigurationClass(new ConfigurationClass(reader, beanName));
}
protected final void parse(Class<?> clazz, String beanName) throws IOException {
   processConfigurationClass(new ConfigurationClass(clazz, beanName));
}
protected final void parse(AnnotationMetadata metadata, String beanName) throws IOException {
   processConfigurationClass(new ConfigurationClass(metadata, beanName));
}
```

首先解析已存在的bean definition上的ConfigurationClass然后处理@Import指定的是DeferredImportSelector所返回的类。三个protected的parse()方法都是调用processConfigurationClass()方法，参数是ConfigurationClass对象。processConfigurationClass是真正处理@Configuration，此时还是不是将配置类注册为bean，而是通过此配置类继续找到其他的配置类，其他的配置类就属于被导入的配置类。

```java
protected void processConfigurationClass(ConfigurationClass configClass) throws IOException {
   //根据@Conditional指定的Condition实现类match方法返回值决定是否跳过，具体看下面
   if (this.conditionEvaluator.shouldSkip(configClass.getMetadata(), ConfigurationPhase.PARSE_CONFIGURATION)) {
      return;
   }
   ConfigurationClass existingClass = this.configurationClasses.get(configClass);
   if (existingClass != null) {
      //如果本次解析的configClass早已解析过了(class name一样就属于一个configClass),
      //并且都是被导入的，则合并导入configClass的ConfigurationClass
      if (configClass.isImported()) {
         if (existingClass.isImported()) {
            existingClass.mergeImportedBy(configClass);
         }
         // Otherwise ignore new imported config class; existing non-imported class overrides it.
         return;
      }
      else {
         // Explicit bean definition found, probably replacing an import.
         // Let's remove the old one and go with the new one.
         //如果用户手动定义了一个ConfigurationClass,则去掉可能之前被自动@Import的类
         this.configurationClasses.remove(configClass);
         this.knownSuperclasses.values().removeIf(configClass::equals);
      }
   }
   // Recursively process the configuration class and its superclass hierarchy.
   // 递归处理配置类及其超类层次结构。
   SourceClass sourceClass = asSourceClass(configClass);
   do {
      //从配置类解析一切可能的bean形式，内部类，成员方法，@Import等，返回值为父类，
      //继续解析父类直到为null
      sourceClass = doProcessConfigurationClass(configClass, sourceClass);
   }
   while (sourceClass != null);
   this.configurationClasses.put(configClass, configClass);
}
//phase代表当前metadata属于哪个阶段，只有phase符合ConfigurationCondition，才会调用matches()方法
public boolean shouldSkip(@Nullable AnnotatedTypeMetadata metadata, @Nullable ConfigurationPhase phase) {
   if (metadata == null || !metadata.isAnnotated(Conditional.class.getName())) {
      return false;
   }
   if (phase == null) {
      if (metadata instanceof AnnotationMetadata &&
            ConfigurationClassUtils.isConfigurationCandidate((AnnotationMetadata) metadata)) {
         return shouldSkip(metadata, ConfigurationPhase.PARSE_CONFIGURATION);
      }
      return shouldSkip(metadata, ConfigurationPhase.REGISTER_BEAN);
   }
   List<Condition> conditions = new ArrayList<>();
   for (String[] conditionClasses : getConditionClasses(metadata)) {
      for (String conditionClass : conditionClasses) {
         Condition condition = getCondition(conditionClass, this.context.getClassLoader());
         conditions.add(condition);
      }
   }
   AnnotationAwareOrderComparator.sort(conditions);
   for (Condition condition : conditions) {
      ConfigurationPhase requiredPhase = null;
      if (condition instanceof ConfigurationCondition) {
         requiredPhase = ((ConfigurationCondition) condition).getConfigurationPhase();
      }
      if ((requiredPhase == null || requiredPhase == phase) && !condition.matches(this.context, metadata)) {
         return true;
      }
   }
   return false;
}
```

processConfigurationClass()方法中将ConfigurationClass简单包装成一个SourceClass对象为了将被注解的类以统一的方式处理，而不用关心类是如何加载的，因为类中会保存AnnotationMetadata对象，这个对象会包含类以及类上注解的所有信息。AnnotationMetadata是一个接口实现类有AnnotationMetadataReadingVisitor和StandardAnnotationMetadata，前者的获取需要SimpleMetadataReader，后者需要一个Class对象，所以SourceClass的构造器需要传入一个MetadataReader或Class。

```java
private class SourceClass implements Ordered {
   private final Object source;  // Class or MetadataReader
   private final AnnotationMetadata metadata;
   public SourceClass(Object source) {
      this.source = source;
      if (source instanceof Class) {
         this.metadata = new StandardAnnotationMetadata((Class<?>) source, true);
      }
      else {
         this.metadata = ((MetadataReader) source).getAnnotationMetadata();
      }
   }
}
```

doProcessConfigurationClass()方法会构建一个完整的ConfigurationClass对象，换句话说就是填充上面提过的ConfigurationClass的那些成员属性通过读取配置类的注解、成员类和方法。

```java
@Nullable
protected final SourceClass doProcessConfigurationClass(ConfigurationClass configClass, SourceClass sourceClass)
      throws IOException {
   //如果正在处理的类的注解层次机构里有@Component则会先处理它的成员内部类，具体看下面
   if (configClass.getMetadata().isAnnotated(Component.class.getName())) {
      // Recursively process any member (nested) classes first
      processMemberClasses(configClass, sourceClass);
   }
   // Process any @PropertySource annotations
   for (AnnotationAttributes propertySource : AnnotationConfigUtils.attributesForRepeatable(
         sourceClass.getMetadata(), PropertySources.class,
         org.springframework.context.annotation.PropertySource.class)) {
      if (this.environment instanceof ConfigurableEnvironment) {
         //将@PropertySource指定的properties资源合并到environment中，注意如果有多个@PropertySource命名相同name属性，
         //则会合并相同名字的资源文件.并且填充configClass的propertySourceNames属性
         processPropertySource(propertySource);
      }
      else {
         logger.info("Ignoring @PropertySource annotation on [" + sourceClass.getMetadata().getClassName() +
               "]. Reason: Environment must implement ConfigurableEnvironment");
      }
   }
   // Process any @ComponentScan annotations
   Set<AnnotationAttributes> componentScans = AnnotationConfigUtils.attributesForRepeatable(
         sourceClass.getMetadata(), ComponentScans.class, ComponentScan.class);
   if (!componentScans.isEmpty() &&
         !this.conditionEvaluator.shouldSkip(sourceClass.getMetadata(), ConfigurationPhase.REGISTER_BEAN)) {
      for (AnnotationAttributes componentScan : componentScans) {
         // The config class is annotated with @ComponentScan -> perform the scan immediately
         Set<BeanDefinitionHolder> scannedBeanDefinitions =
               this.componentScanParser.parse(componentScan, sourceClass.getMetadata().getClassName());
         // Check the set of scanned definitions for any further config classes and parse recursively if needed
         for (BeanDefinitionHolder holder : scannedBeanDefinitions) {
            BeanDefinition bdCand = holder.getBeanDefinition().getOriginatingBeanDefinition();
            if (bdCand == null) {
               bdCand = holder.getBeanDefinition();
            }
            //有符合配置类的bean继续调用parse方法解析配置类重复doProcessConfigurationClass()的调用
            if (ConfigurationClassUtils.checkConfigurationClassCandidate(bdCand, this.metadataReaderFactory)) {
               parse(bdCand.getBeanClassName(), holder.getBeanName());
            }
         }
      }
   }
   // Process any @Import annotations
   processImports(configClass, sourceClass, getImports(sourceClass), true);
   // Process any @ImportResource annotations
   // 一种静态批量注册bean的方式，不同于@Import可以指定三种形式,如@ImportResource("classpath:spring-dao.xml")
   AnnotationAttributes importResource =
         AnnotationConfigUtils.attributesFor(sourceClass.getMetadata(), ImportResource.class);
   if (importResource != null) {
      String[] resources = importResource.getStringArray("locations");
      Class<? extends BeanDefinitionReader> readerClass = importResource.getClass("reader");
      for (String resource : resources) {
         String resolvedResource = this.environment.resolveRequiredPlaceholders(resource);
         configClass.addImportedResource(resolvedResource, readerClass);
      }
   }
   // Process individual @Bean methods
   // 遵照方法的先后声明顺序
   Set<MethodMetadata> beanMethods = retrieveBeanMethodMetadata(sourceClass);
   for (MethodMetadata methodMetadata : beanMethods) {
      configClass.addBeanMethod(new BeanMethod(methodMetadata, configClass));
   }
   // Process default methods on interfaces
   // 支持接口默认方法的@Bean与普通类的@Bean没有区别
   processInterfaces(configClass, sourceClass);
   // Process superclass, if any
   if (sourceClass.getMetadata().hasSuperClass()) {
      String superclass = sourceClass.getMetadata().getSuperClassName();
      if (superclass != null && !superclass.startsWith("java") &&
            !this.knownSuperclasses.containsKey(superclass)) {
         this.knownSuperclasses.put(superclass, configClass);
         // Superclass found, return its annotation metadata and recurse
         return sourceClass.getSuperClass();
      }
   }
   // No superclass -> processing is complete
   return null;
}
```

doProcessConfigurationClass()方法用来解析配置类中的bean定义达到填充ConfigurationClass对象同时也会延展处理配置类，包括从以下几个方面来发现更多的配置类及bean：

**1、** 成员内部类；

**2、** @ComponentScan注解指定包下扫描；

**3、** @Import注解指定导入的类；

**4、** @ImportResource指定的xml配置文件；

**5、** @Bean标记的成员方法；

**6、** @Bean标记接口默认方法；

#### 2.1.1、内部类解析

找出成员内部类符合配置类的，调用processConfigurationClass()方法继续解析被发现的配置类。

```java
//注册配置类里的成员类
private void processMemberClasses(ConfigurationClass configClass, SourceClass sourceClass) throws IOException {
   Collection<SourceClass> memberClasses = sourceClass.getMemberClasses();
   if (!memberClasses.isEmpty()) {
      List<SourceClass> candidates = new ArrayList<>(memberClasses.size());
      for (SourceClass memberClass : memberClasses) {
         //@Configuration @Component @ComponentScan @Import @ImportResource @Bean
         if (ConfigurationClassUtils.isConfigurationCandidate(memberClass.getMetadata()) &&
               !memberClass.getMetadata().getClassName().equals(configClass.getMetadata().getClassName())) {
            candidates.add(memberClass);
         }
      }
      //@Order注解排序
      OrderComparator.sort(candidates);
      for (SourceClass candidate : candidates) {
         //避免循环导入
         if (this.importStack.contains(configClass)) {
            //同一个类被多次导入抛BeanDefinitionParsingException
            this.problemReporter.error(new CircularImportProblem(configClass, this.importStack));
         }
         else {
            this.importStack.push(configClass);
            try {
               //可以看到对一个配置类的解析是先深度后广度
               processConfigurationClass(candidate.asConfigClass(configClass));
            }
            finally {
               this.importStack.pop();
            }
         }
      }
   }
}
```

#### 2.1.2、合并@PropertySource指定的属性到Environment

```java
private void processPropertySource(AnnotationAttributes propertySource) throws IOException {
   String name = propertySource.getString("name");
   if (!StringUtils.hasLength(name)) {
      name = null;
   }
   String encoding = propertySource.getString("encoding");
   if (!StringUtils.hasLength(encoding)) {
      encoding = null;
   }
   String[] locations = propertySource.getStringArray("value");
   Assert.isTrue(locations.length > 0, "At least one @PropertySource(value) location is required");
   boolean ignoreResourceNotFound = propertySource.getBoolean("ignoreResourceNotFound");
   Class<? extends PropertySourceFactory> factoryClass = propertySource.getClass("factory");
   PropertySourceFactory factory = (factoryClass == PropertySourceFactory.class ?
         DEFAULT_PROPERTY_SOURCE_FACTORY : BeanUtils.instantiateClass(factoryClass));
   for (String location : locations) {
      try {
         String resolvedLocation = this.environment.resolveRequiredPlaceholders(location);
         Resource resource = this.resourceLoader.getResource(resolvedLocation);
         addPropertySource(factory.createPropertySource(name, new EncodedResource(resource, encoding)));
      }
      catch (IllegalArgumentException | FileNotFoundException | UnknownHostException ex) {
         // Placeholders not resolvable or resource not found when trying to open it
         if (ignoreResourceNotFound) {
            if (logger.isInfoEnabled()) {
               logger.info("Properties location [" + location + "] not resolvable: " + ex.getMessage());
            }
         }
         else {
            throw ex;
         }
      }
   }
}
private void addPropertySource(PropertySource<?> propertySource) {
   String name = propertySource.getName();
   MutablePropertySources propertySources = ((ConfigurableEnvironment) this.environment).getPropertySources();
   if (this.propertySourceNames.contains(name)) {
      // We've already added a version, we need to extend it
      PropertySource<?> existing = propertySources.get(name);
      if (existing != null) {
         PropertySource<?> newSource = (propertySource instanceof ResourcePropertySource ?
               ((ResourcePropertySource) propertySource).withResourceName() : propertySource);
         if (existing instanceof CompositePropertySource) {
            ((CompositePropertySource) existing).addFirstPropertySource(newSource);
         }
         else {
            if (existing instanceof ResourcePropertySource) {
               existing = ((ResourcePropertySource) existing).withResourceName();
            }
            CompositePropertySource composite = new CompositePropertySource(name);
            composite.addPropertySource(newSource);
            composite.addPropertySource(existing);
            propertySources.replace(name, composite);
         }
         return;
      }
   }
   if (this.propertySourceNames.isEmpty()) {
      propertySources.addLast(propertySource);
   }
   else {
      String firstProcessed = this.propertySourceNames.get(this.propertySourceNames.size() - 1);
      propertySources.addBefore(firstProcessed, propertySource);
   }
   this.propertySourceNames.add(name);
}
```

#### 2.1.3、解析@ComponentScan，扫描它指定的类或某些包范围下的类

将配置类中@ComponentScan注解指定的所有属性传递给ComponentScanAnnotationParser的parse方法，parse()方法的返回值为@ComponentScan扫描包下符合bean定义(默认为@Component)的BeanDefination，再次判断这些BeanDefination中是否有符合ConfigurationClassUtils.checkConfigurationClassCandidate(）的，如果有再次调用parse()方法做深层次的解析。

关于这个方法的核心类ClassPathBeanDefinitionScanner请参考[《Spring源码分析-ClassPathBeanDefinitionScanner》](/zhuanlan/j2ee/spring/7/41.html)中有详细介绍。

```java
public Set<BeanDefinitionHolder> parse(AnnotationAttributes componentScan, final String declaringClass) {
   //根据@ComponentScan的属性组装一个ClassPathBeanDefinitionScanner，由他负责扫描注册
   ClassPathBeanDefinitionScanner scanner = new ClassPathBeanDefinitionScanner(this.registry,
         componentScan.getBoolean("useDefaultFilters"), this.environment, this.resourceLoader);
   Class<? extends BeanNameGenerator> generatorClass = componentScan.getClass("nameGenerator");
   boolean useInheritedGenerator = (BeanNameGenerator.class == generatorClass);
   scanner.setBeanNameGenerator(useInheritedGenerator ? this.beanNameGenerator :
         BeanUtils.instantiateClass(generatorClass));
   // 可以指定代理方式
   ScopedProxyMode scopedProxyMode = componentScan.getEnum("scopedProxy");
   if (scopedProxyMode != ScopedProxyMode.DEFAULT) {
      scanner.setScopedProxyMode(scopedProxyMode);
   }
   else {
      Class<? extends ScopeMetadataResolver> resolverClass = componentScan.getClass("scopeResolver");
      scanner.setScopeMetadataResolver(BeanUtils.instantiateClass(resolverClass));
   }
   scanner.setResourcePattern(componentScan.getString("resourcePattern"));
   for (AnnotationAttributes filter : componentScan.getAnnotationArray("includeFilters")) {
      for (TypeFilter typeFilter : typeFiltersFor(filter)) {
         scanner.addIncludeFilter(typeFilter);
      }
   }
   for (AnnotationAttributes filter : componentScan.getAnnotationArray("excludeFilters")) {
      for (TypeFilter typeFilter : typeFiltersFor(filter)) {
         scanner.addExcludeFilter(typeFilter);
      }
   }
   boolean lazyInit = componentScan.getBoolean("lazyInit");
   if (lazyInit) {
      scanner.getBeanDefinitionDefaults().setLazyInit(true);
   }
   Set<String> basePackages = new LinkedHashSet<>();
   String[] basePackagesArray = componentScan.getStringArray("basePackages");
   for (String pkg : basePackagesArray) {
      //支持指定多个包 分隔符",; \t\n"
      String[] tokenized = StringUtils.tokenizeToStringArray(this.environment.resolvePlaceholders(pkg),
            ConfigurableApplicationContext.CONFIG_LOCATION_DELIMITERS);
      Collections.addAll(basePackages, tokenized);
   }
   for (Class<?> clazz : componentScan.getClassArray("basePackageClasses")) {
      //支持指定Class所在的包
      basePackages.add(ClassUtils.getPackageName(clazz));
   }
   //如果没有指明扫描范围，则使用当前处理的SourceClass所在的包
   if (basePackages.isEmpty()) {
      basePackages.add(ClassUtils.getPackageName(declaringClass));
   }
   //因为当前的declaringClass早已解析完了，需要排除掉
   scanner.addExcludeFilter(new AbstractTypeHierarchyTraversingFilter(false, false) {
      @Override
      protected boolean matchClassName(String className) {
         return declaringClass.equals(className);
      }
   });
   return scanner.doScan(StringUtils.toStringArray(basePackages));
}
```

扫描重点是由ClassPathBeanDefinitionScanner完成的，这个类在之前的博文里已经详细介绍过，请看这篇[《Spring源码分析 - -ClassPathBeanDefinitionScanner》](/zhuanlan/j2ee/spring/7/41.html) 这里就不在啰嗦，到此为止知道他可以将@ComponentScan指定的包下面的类注册到容器就可以。

#### 2.1.4、解析@Import注解

spring会找出配置类被标记@Import的所有注解，包括注解也被标记@Import的。

```java
private Set<SourceClass> getImports(SourceClass sourceClass) throws IOException {
   Set<SourceClass> imports = new LinkedHashSet<>();
   Set<SourceClass> visited = new LinkedHashSet<>();
   collectImports(sourceClass, imports, visited);
   return imports;
}
private void collectImports(SourceClass sourceClass, Set<SourceClass> imports, Set<SourceClass> visited)
      throws IOException {
 
   if (visited.add(sourceClass)) {
      for (SourceClass annotation : sourceClass.getAnnotations()) {
         String annName = annotation.getMetadata().getClassName();
         // 如果是非@Import的注解，也会继续向上查找此注解上的@Import
         if (!annName.startsWith("java") && !annName.equals(Import.class.getName())) {
            collectImports(annotation, imports, visited);
         }
      }
      // @Impor的value属性当做新的sourceClass，传递给下面的processImports方法
      imports.addAll(sourceClass.getAnnotationAttributes(Import.class.getName(), "value"));
   }
}
```

处理@Import导入的类。

```java
private void processImports(ConfigurationClass configClass, SourceClass currentSourceClass,
      Collection<SourceClass> importCandidates, boolean checkForCircularImports) {
   //@Import的value属性指定的class集合
   if (importCandidates.isEmpty()) {
      return;
   }
   //检查不能循环导入
   if (checkForCircularImports && isChainedImportOnStack(configClass)) {
      this.problemReporter.error(new CircularImportProblem(configClass, this.importStack));
   }
   else {
      this.importStack.push(configClass);
      try {
         for (SourceClass candidate : importCandidates) {
            if (candidate.isAssignable(ImportSelector.class)) {
               // Candidate class is an ImportSelector -> delegate to it to determine imports
               Class<?> candidateClass = candidate.loadClass();
               ImportSelector selector = BeanUtils.instantiateClass(candidateClass, ImportSelector.class);
               ParserStrategyUtils.invokeAwareMethods(
                     selector, this.environment, this.resourceLoader, this.registry);
               if (selector instanceof DeferredImportSelector) {
                  //如果是DeferredImportSelector,先不着急调用selectImports()方法，保存进deferredImportSelectorHandler中，在ConfigurationClassParser.parse()方法最后一步执行
                  this.deferredImportSelectorHandler.handle(
                        configClass, (DeferredImportSelector) selector);
               }
               else {
                  //如果是普通ImportSelector实现类，则立即调用selectImports()方法，返回值作为如果又是ImportSelector或ImportBeanDefinitionRegistrar
                  //则继续递归调用processImports(),知道返回值为非ImportSelector，走else分支
                  String[] importClassNames = selector.selectImports(currentSourceClass.getMetadata());
                  Collection<SourceClass> importSourceClasses = asSourceClasses(importClassNames);
                  processImports(configClass, currentSourceClass, importSourceClasses, false);
               }
            }
            //如果是ImportBeanDefinitionRegistrar，先填充ConfigurationClass的importBeanDefinitionRegistrars属性，
            //在ConfigurationClassPostProcessor的processConfigBeanDefinitions()方法中ConfigurationClassParser的parse()方法结束后使用ConfigurationClassBeanDefinitionReader
            //的loadBeanDefinitions()方法中处理
            else if (candidate.isAssignable(ImportBeanDefinitionRegistrar.class)) {
               // Candidate class is an ImportBeanDefinitionRegistrar ->
               // delegate to it to register additional bean definitions
               Class<?> candidateClass = candidate.loadClass();
               ImportBeanDefinitionRegistrar registrar =
                     BeanUtils.instantiateClass(candidateClass, ImportBeanDefinitionRegistrar.class);
               ParserStrategyUtils.invokeAwareMethods(
                     registrar, this.environment, this.resourceLoader, this.registry);
               configClass.addImportBeanDefinitionRegistrar(registrar, currentSourceClass.getMetadata());
            }
            else {
               // Candidate class not an ImportSelector or ImportBeanDefinitionRegistrar ->
               // process it as an @Configuration class
               this.importStack.registerImport(
                     currentSourceClass.getMetadata(), candidate.getMetadata().getClassName());
               processConfigurationClass(candidate.asConfigClass(configClass));
            }
         }
      }
      catch (BeanDefinitionStoreException ex) {
         throw ex;
      }
      catch (Throwable ex) {
         throw new BeanDefinitionStoreException(
               "Failed to process import candidates for configuration class [" +
               configClass.getMetadata().getClassName() + "]", ex);
      }
      finally {
         this.importStack.pop();
      }
   }
}
```

@Import支持Class类型：

- ImportSelector:如果是普通ImportSelector实现类，则立即调用selectImports()方法，返回值作为如果又是ImportSelector或ImportBeanDefinitionRegistrar。
- ImportBeanDefinitionRegistrar：如果是DeferredImportSelector,先不着急调用selectImports()方法，保存进deferredImportSelectorHandler中，在ConfigurationClassParser.parse()方法最后一步执行
- 普通类：当做ConfigurationClass继续调用ConfigurationClassParser.doProcessConfigurationClass()方法处理它。

#### 2.1.5、解析@ImportResource注解

将locations指定的资源对象和reader指定的 BeanDefinitionReader保存到configClass中，后面会解析这些资源对象为bean。

```java
AnnotationAttributes importResource =
      AnnotationConfigUtils.attributesFor(sourceClass.getMetadata(), ImportResource.class);
if (importResource != null) {
   String[] resources = importResource.getStringArray("locations");
   Class<? extends BeanDefinitionReader> readerClass = importResource.getClass("reader");
   for (String resource : resources) {
      String resolvedResource = this.environment.resolveRequiredPlaceholders(resource);
      configClass.addImportedResource(resolvedResource, readerClass);
   }
}
```

这段代码就是将@ImportResource属性locations指定的资源路径先保存在ConfigurationClass的importedResources属性中，然后也是同ImportBeanDefinitionRegistrar的处理时机在ConfigurationClassParser.parse()方法最后一步执行。这个资源解析交由reader属性指定的BeanDefinitionReader，默认使用XmlBeanDefinitionReader解析xml文件。

#### 2.1.6、解析被@Bean标注的成员方法

将配置类标记@Bean注解的方法解析为MethodMetadata对象，随后将这些包装为BeanMethod保存到configClass中，然后统一注册为bean。

```java
//检索当前SourceClass里所有@Bean方法
private Set<MethodMetadata> retrieveBeanMethodMetadata(SourceClass sourceClass) {
   AnnotationMetadata original = sourceClass.getMetadata();
   Set<MethodMetadata> beanMethods = original.getAnnotatedMethods(Bean.class.getName());
   //超过一个被@Bean的方法才需要排序，先后声明顺序
   if (beanMethods.size() > 1 && original instanceof StandardAnnotationMetadata) {
      // Try reading the class file via ASM for deterministic declaration order...
      // Unfortunately, the JVM's standard reflection returns methods in arbitrary
      // order, even between different runs of the same application on the same JVM.
      try {
         AnnotationMetadata asm =
               this.metadataReaderFactory.getMetadataReader(original.getClassName()).getAnnotationMetadata();
         Set<MethodMetadata> asmMethods = asm.getAnnotatedMethods(Bean.class.getName());
         if (asmMethods.size() >= beanMethods.size()) {
            Set<MethodMetadata> selectedMethods = new LinkedHashSet<>(asmMethods.size());
            for (MethodMetadata asmMethod : asmMethods) {
               for (MethodMetadata beanMethod : beanMethods) {
                  if (beanMethod.getMethodName().equals(asmMethod.getMethodName())) {
                     selectedMethods.add(beanMethod);
                     break;
                  }
               }
            }
            if (selectedMethods.size() == beanMethods.size()) {
               // All reflection-detected methods found in ASM method set -> proceed
               beanMethods = selectedMethods;
            }
         }
      }
      catch (IOException ex) {
         logger.debug("Failed to read class file via ASM for determining @Bean method order", ex);
         // No worries, let's continue with the reflection metadata we started with...
      }
   }
   return beanMethods;
}
```

上面代码的一段英文注释说，如果SourceClass的AnnotationMetadata是StandardAnnotationMetadata那就是使用了反射，反射获取类声明的方法顺序是不确定的，所以再尝试使用ASM框架它可以按方法声明的顺序得到方法声明，然后包装成MethodMetadata实例，StandardAnnotationMetadata包装的是StandardMethodMetadata，AnnotationMetadataReadingVisitor包装的是MethodMetadataReadingVisitor。MethodMetadata接口包含如下方法，可以方便获取方法的元数据。

```java
public interface MethodMetadata extends AnnotatedTypeMetadata {
   String getMethodName();
   String getDeclaringClassName();
   String getReturnTypeName();
   boolean isAbstract();
   boolean isStatic();
   boolean isFinal();
   boolean isOverridable();
}
```

将retrieveBeanMethodMetadata()方法返回的集合填充进ConfigurationClass的beanMethods的属性中，后等待ConfigurationClassParser.parse()方法使用ConfigurationClassBeanDefinitionReader处理。

#### 2.1.7、解析当前SourceClass接口的@Bean方法

这一步与第6步一样都是为了获取@Bean方法的抽象定义放入ConfigurationClass的beanMethods属性中，只不过java8后支持接口带有默认方法，这一步就是发现这些默认方法有@Bean的。

```java
private void processInterfaces(ConfigurationClass configClass, SourceClass sourceClass) throws IOException {
   for (SourceClass ifc : sourceClass.getInterfaces()) {
      Set<MethodMetadata> beanMethods = retrieveBeanMethodMetadata(ifc);
      for (MethodMetadata methodMetadata : beanMethods) {
         if (!methodMetadata.isAbstract()) {
            // A default method or other concrete method on a Java 8+ interface...
            configClass.addBeanMethod(new BeanMethod(methodMetadata, configClass));
         }
      }
      processInterfaces(configClass, ifc);
   }
}
```

#### 2.1.8、如果当前SourceClass还有父类，将父类走一遍上述流程。

```java
if (sourceClass.getMetadata().hasSuperClass()) {
   String superclass = sourceClass.getMetadata().getSuperClassName();
   if (superclass != null && !superclass.startsWith("java") &&
         !this.knownSuperclasses.containsKey(superclass)) {
      this.knownSuperclasses.put(superclass, configClass);
      // Superclass found, return its annotation metadata and recurse
      return sourceClass.getSuperClass();
   }
}
```

到此为止经过ConfigurationClassParser.parse()方法已经将ConfigurationClass的属性都补全了（除了skippedBeanMethods），下面就是使用这些ConfigurationClass对象了。

### 2.2、validate()校验@Bean方法合法性

回到ConfigurationClassPostProcessor的processConfigBeanDefinitions()方法，得到ConfigurationClass对象后会使用validate()方法会做一个校验，配置类和@Bean方法不能是final的，因为需要使用CGLIB生成代理对象。

```java
public void validate() {
   for (ConfigurationClass configClass : this.configurationClasses.keySet()) {
      configClass.validate(this.problemReporter);
   }
}
public void validate(ProblemReporter problemReporter) {
   // A configuration class may not be final (CGLIB limitation)
   if (getMetadata().isAnnotated(Configuration.class.getName())) {
      if (getMetadata().isFinal()) {
         problemReporter.error(new FinalConfigurationProblem());
      }
   }
 
   for (BeanMethod beanMethod : this.beanMethods) {
      beanMethod.validate(problemReporter);
   }
}
public void validate(ProblemReporter problemReporter) {
   if (getMetadata().isStatic()) {
      // static @Bean methods have no constraints to validate -> return immediately
      return;
   }
 
   if (this.configurationClass.getMetadata().isAnnotated(Configuration.class.getName())) {
      if (!getMetadata().isOverridable()) {
         // instance @Bean methods within @Configuration classes must be overridable to accommodate CGLIB
         problemReporter.error(new NonOverridableMethodError());
      }
   }
}
```

### 2.3、processConfigBeanDefinitions()方法

校验ConfigurationClass对象合法性后会使用一个ConfigurationClassBeanDefinitionReader对象将这些ConfigurationClass解析为BeanDefiniton注册到容器中。下面看ConfigurationClassBeanDefinitionReader的唯一public方法loadBeanDefinitions()。

```java
public void loadBeanDefinitions(Set<ConfigurationClass> configurationModel) {
   //处理@Conditional核心方法前面已经分析过了
   TrackedConditionEvaluator trackedConditionEvaluator = new TrackedConditionEvaluator();
   for (ConfigurationClass configClass : configurationModel) {
      loadBeanDefinitionsForConfigurationClass(configClass, trackedConditionEvaluator);
   }
}
private void loadBeanDefinitionsForConfigurationClass(
      ConfigurationClass configClass, TrackedConditionEvaluator trackedConditionEvaluator) {
   if (trackedConditionEvaluator.shouldSkip(configClass)) {
      String beanName = configClass.getBeanName();
      if (StringUtils.hasLength(beanName) && this.registry.containsBeanDefinition(beanName)) {
         this.registry.removeBeanDefinition(beanName);
      }
      this.importRegistry.removeImportingClass(configClass.getMetadata().getClassName());
      return;
   }
   //如果是被导入的类，则还没有注册为BeanDefiniton，则先将自身注册为BeanDefiniton,在注册属性代表的BeanDefinition
   if (configClass.isImported()) {
      registerBeanDefinitionForImportedConfigurationClass(configClass);
   }
   for (BeanMethod beanMethod : configClass.getBeanMethods()) {
      loadBeanDefinitionsForBeanMethod(beanMethod);
   }
   loadBeanDefinitionsFromImportedResources(configClass.getImportedResources());
   loadBeanDefinitionsFromRegistrars(configClass.getImportBeanDefinitionRegistrars());
}
private void registerBeanDefinitionForImportedConfigurationClass(ConfigurationClass configClass) {
   AnnotationMetadata metadata = configClass.getMetadata();
   AnnotatedGenericBeanDefinition configBeanDef = new AnnotatedGenericBeanDefinition(metadata);
   ScopeMetadata scopeMetadata = scopeMetadataResolver.resolveScopeMetadata(configBeanDef);
   configBeanDef.setScope(scopeMetadata.getScopeName());
   String configBeanName = this.importBeanNameGenerator.generateBeanName(configBeanDef, this.registry);
   AnnotationConfigUtils.processCommonDefinitionAnnotations(configBeanDef, metadata);
   BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(configBeanDef, configBeanName);
   definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry);
   this.registry.registerBeanDefinition(definitionHolder.getBeanName(), definitionHolder.getBeanDefinition());
   configClass.setBeanName(configBeanName);
   if (logger.isTraceEnabled()) {
      logger.trace("Registered bean definition for imported class '" + configBeanName + "'");
   }
}
```

#### 2.3.1、注册@Bean方法为BeanDefinition。

```java
private void loadBeanDefinitionsForBeanMethod(BeanMethod beanMethod) {
   ConfigurationClass configClass = beanMethod.getConfigurationClass();
   MethodMetadata metadata = beanMethod.getMetadata();
   String methodName = metadata.getMethodName();
   // Do we need to mark the bean as skipped by its condition?
   if (this.conditionEvaluator.shouldSkip(metadata, ConfigurationPhase.REGISTER_BEAN)) {
      configClass.skippedBeanMethods.add(methodName);
      return;
   }
   if (configClass.skippedBeanMethods.contains(methodName)) {
      return;
   }
   AnnotationAttributes bean = AnnotationConfigUtils.attributesFor(metadata, Bean.class);
   Assert.state(bean != null, "No @Bean annotation attributes");
   // Consider name and any aliases
   List<String> names = new ArrayList<>(Arrays.asList(bean.getStringArray("name")));
   String beanName = (!names.isEmpty() ? names.remove(0) : methodName);
   // Register aliases even when overridden
   for (String alias : names) {
      this.registry.registerAlias(beanName, alias);
   }
   // Has this effectively been overridden before (e.g. via XML)?
   if (isOverriddenByExistingDefinition(beanMethod, beanName)) {
      //如果容器中已经定义了同名的BeanDefiniton
      //同属于一个ConfigurationClass下直接抛异常
      //否则使用已定义好的，抛弃这个@Bean方法定义的
      if (beanName.equals(beanMethod.getConfigurationClass().getBeanName())) {
         throw new BeanDefinitionStoreException(beanMethod.getConfigurationClass().getResource().getDescription(),
               beanName, "Bean name derived from @Bean method '" + beanMethod.getMetadata().getMethodName() +
               "' clashes with bean name for containing configuration class; please make those names unique!");
      }
      return;
   }
   ConfigurationClassBeanDefinition beanDef = new ConfigurationClassBeanDefinition(configClass, metadata);
   beanDef.setResource(configClass.getResource());
   beanDef.setSource(this.sourceExtractor.extractSource(metadata, configClass.getResource()));
   if (metadata.isStatic()) {
      // static @Bean method
      beanDef.setBeanClassName(configClass.getMetadata().getClassName());
      beanDef.setFactoryMethodName(methodName);
   }
   else {
      // instance @Bean method
      beanDef.setFactoryBeanName(configClass.getBeanName());
      beanDef.setUniqueFactoryMethodName(methodName);
   }
   beanDef.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_CONSTRUCTOR);
   beanDef.setAttribute(org.springframework.beans.factory.annotation.RequiredAnnotationBeanPostProcessor.
         SKIP_REQUIRED_CHECK_ATTRIBUTE, Boolean.TRUE);
   //根据注解添加BeanDefinition属性@Lazy @Primary @DependsOn @Role @Description
   AnnotationConfigUtils.processCommonDefinitionAnnotations(beanDef, metadata);
   //自动装配模式 @Bean默认Autowire.NO
   Autowire autowire = bean.getEnum("autowire");
   if (autowire.isAutowire()) {
      beanDef.setAutowireMode(autowire.value());
   }
   //是否可以自动装配其他bean 默认true
   boolean autowireCandidate = bean.getBoolean("autowireCandidate");
   if (!autowireCandidate) {
      beanDef.setAutowireCandidate(false);
   }
   //@Bean也可指定创建bean的初始化方法
   String initMethodName = bean.getString("initMethod");
   if (StringUtils.hasText(initMethodName)) {
      beanDef.setInitMethodName(initMethodName);
   }
   String destroyMethodName = bean.getString("destroyMethod");
   beanDef.setDestroyMethodName(destroyMethodName);
   // Consider scoping
   ScopedProxyMode proxyMode = ScopedProxyMode.NO;
   AnnotationAttributes attributes = AnnotationConfigUtils.attributesFor(metadata, Scope.class);
   if (attributes != null) {
      beanDef.setScope(attributes.getString("value"));
      proxyMode = attributes.getEnum("proxyMode");
      if (proxyMode == ScopedProxyMode.DEFAULT) {
         proxyMode = ScopedProxyMode.NO;
      }
   }
   // Replace the original bean definition with the target one, if necessary
   BeanDefinition beanDefToRegister = beanDef;
   if (proxyMode != ScopedProxyMode.NO) {
      BeanDefinitionHolder proxyDef = ScopedProxyCreator.createScopedProxy(
            new BeanDefinitionHolder(beanDef, beanName), this.registry,
            proxyMode == ScopedProxyMode.TARGET_CLASS);
      beanDefToRegister = new ConfigurationClassBeanDefinition(
            (RootBeanDefinition) proxyDef.getBeanDefinition(), configClass, metadata);
   }
   if (logger.isTraceEnabled()) {
      logger.trace(String.format("Registering bean definition for @Bean method %s.%s()",
            configClass.getMetadata().getClassName(), beanName));
   }
   this.registry.registerBeanDefinition(beanName, beanDefToRegister);
}
```

上面有一点需要注意：如果此@Bean的proxyMode属性不是ScopedProxyMode.DEFAULT和ScopedProxyMode.NO，则需要使用代理技术创建一个新的BeanDefinition取代这个同名的BeanDefinition，将原来的重新命名也注册到容器中。看下面具体代码：

```java
final class ScopedProxyCreator {
   private ScopedProxyCreator() {
   }
   public static BeanDefinitionHolder createScopedProxy(
         BeanDefinitionHolder definitionHolder, BeanDefinitionRegistry registry, boolean proxyTargetClass) {
      return ScopedProxyUtils.createScopedProxy(definitionHolder, registry, proxyTargetClass);
   }
   public static String getTargetBeanName(String originalBeanName) {
      return ScopedProxyUtils.getTargetBeanName(originalBeanName);
   }
}
public abstract class ScopedProxyUtils {
   private static final String TARGET_NAME_PREFIX = "scopedTarget.";
   public static BeanDefinitionHolder createScopedProxy(BeanDefinitionHolder definition,
         BeanDefinitionRegistry registry, boolean proxyTargetClass) {
      String originalBeanName = definition.getBeanName();
      BeanDefinition targetDefinition = definition.getBeanDefinition();
      //原始bean重新命名scopedTarget.originalBeanName
      String targetBeanName = getTargetBeanName(originalBeanName);
      // Create a scoped proxy definition for the original bean name,
      // "hiding" the target bean in an internal target definition.
      //内部使用ProxyFactory创建代理对象，通过targetBeanName从容器获取目标对象
      RootBeanDefinition proxyDefinition = new RootBeanDefinition(ScopedProxyFactoryBean.class);
      proxyDefinition.setDecoratedDefinition(new BeanDefinitionHolder(targetDefinition, targetBeanName));
      proxyDefinition.setOriginatingBeanDefinition(targetDefinition);
      proxyDefinition.setSource(definition.getSource());
      proxyDefinition.setRole(targetDefinition.getRole());
      //代理类保存着原始类的bean name
      proxyDefinition.getPropertyValues().add("targetBeanName", targetBeanName);
      //代理目标类
      if (proxyTargetClass) {
         targetDefinition.setAttribute(AutoProxyUtils.PRESERVE_TARGET_CLASS_ATTRIBUTE, Boolean.TRUE);
         // ScopedProxyFactoryBean's "proxyTargetClass" default is TRUE, so we don't need to set it explicitly here.
      }
      //代理目标接口
      else {
         proxyDefinition.getPropertyValues().add("proxyTargetClass", Boolean.FALSE);
      }
      // Copy autowire settings from original bean definition.
      proxyDefinition.setAutowireCandidate(targetDefinition.isAutowireCandidate());
      proxyDefinition.setPrimary(targetDefinition.isPrimary());
      if (targetDefinition instanceof AbstractBeanDefinition) {
         proxyDefinition.copyQualifiersFrom((AbstractBeanDefinition) targetDefinition);
      }
      // The target bean should be ignored in favor of the scoped proxy.
      //避免使用容器里的原始类
      targetDefinition.setAutowireCandidate(false);
      targetDefinition.setPrimary(false);
      // Register the target bean as separate bean in the factory.
      registry.registerBeanDefinition(targetBeanName, targetDefinition);
      // Return the scoped proxy definition as primary bean definition
      // (potentially an inner bean).
      return new BeanDefinitionHolder(proxyDefinition, originalBeanName, definition.getAliases());
   }
   public static String getTargetBeanName(String originalBeanName) {
      return TARGET_NAME_PREFIX + originalBeanName;
   }
   public static boolean isScopedTarget(@Nullable String beanName) {
      return (beanName != null && beanName.startsWith(TARGET_NAME_PREFIX));
   }
}
```

#### 2.3.2、注册@ImportResource指定资源代表的BeanDefinition

```java
private void loadBeanDefinitionsFromImportedResources(
      Map<String, Class<? extends BeanDefinitionReader>> importedResources) {
   Map<Class<?>, BeanDefinitionReader> readerInstanceCache = new HashMap<>();
   importedResources.forEach((resource, readerClass) -> {
      // Default reader selection necessary?
      if (BeanDefinitionReader.class == readerClass) {
         if (StringUtils.endsWithIgnoreCase(resource, ".groovy")) {
            // When clearly asking for Groovy, that's what they'll get...
            readerClass = GroovyBeanDefinitionReader.class;
         }
         else {
            // Primarily ".xml" files but for any other extension as well
            readerClass = XmlBeanDefinitionReader.class;
         }
      }
      BeanDefinitionReader reader = readerInstanceCache.get(readerClass);
      if (reader == null) {
         try {
            // Instantiate the specified BeanDefinitionReader
            reader = readerClass.getConstructor(BeanDefinitionRegistry.class).newInstance(this.registry);
            // Delegate the current ResourceLoader to it if possible
            if (reader instanceof AbstractBeanDefinitionReader) {
               AbstractBeanDefinitionReader abdr = ((AbstractBeanDefinitionReader) reader);
               abdr.setResourceLoader(this.resourceLoader);
               abdr.setEnvironment(this.environment);
            }
            readerInstanceCache.put(readerClass, reader);
         }
         catch (Throwable ex) {
            throw new IllegalStateException(
                  "Could not instantiate BeanDefinitionReader class [" + readerClass.getName() + "]");
         }
      }
      // TODO SPR-6310: qualify relative path locations as done in AbstractContextLoader.modifyLocations
      reader.loadBeanDefinitions(resource);
   });
}
```

默认处理xml资源，也可以自定义BeanDefinitionReader解析任意资源完成bean的注册。

#### 2.3.3、如果@Import指定的是ImportBeanDefinitionRegistrar可以完成批量注册

```java
private void loadBeanDefinitionsFromRegistrars(Map<ImportBeanDefinitionRegistrar, AnnotationMetadata> registrars) {
   registrars.forEach((registrar, metadata) ->
         registrar.registerBeanDefinitions(metadata, this.registry));
}
```

参考org.springframework.context.annotation.AspectJAutoProxyRegistrar

## 3、postProcessBeanFactory()原理分析

到这为止对@Configuration类解析注册的过程就完成了，下面分析ConfigurationClassPostProcessor的postProcessBeanFactory()方法的，看看他他是如何增强@Configuration类的。

```java
public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
   int factoryId = System.identityHashCode(beanFactory);
   if (this.factoriesPostProcessed.contains(factoryId)) {
      throw new IllegalStateException(
            "postProcessBeanFactory already called on this post-processor against " + beanFactory);
   }
   this.factoriesPostProcessed.add(factoryId);
   if (!this.registriesPostProcessed.contains(factoryId)) {
      // BeanDefinitionRegistryPostProcessor hook apparently not supported...
      // Simply call processConfigurationClasses lazily at this point then.
      processConfigBeanDefinitions((BeanDefinitionRegistry) beanFactory);
   }
   //加强@Configuration类
   enhanceConfigurationClasses(beanFactory);
   //此BeanPostProcessor会将实现了ImportAware接口的类注入ConfigurationClassParser的ImportStack
   beanFactory.addBeanPostProcessor(new ImportAwareBeanPostProcessor(beanFactory));
}
```

核心方法enhanceConfigurationClasses用来将标记@Configuration的配置类的BeanDefinition的beanClass替换为经过CGLIB加强过的，这样在实例化此bean的时候，就可以使用替换的代理类来创建对象了。

```java
public void enhanceConfigurationClasses(ConfigurableListableBeanFactory beanFactory) {
   Map<String, AbstractBeanDefinition> configBeanDefs = new LinkedHashMap<>();
   for (String beanName : beanFactory.getBeanDefinitionNames()) {
      BeanDefinition beanDef = beanFactory.getBeanDefinition(beanName);
      //只增强@Configuration类
      if (ConfigurationClassUtils.isFullConfigurationClass(beanDef)) {
         //Spring提供的所有BeanDefinition的实现类都继承了AbstractBeanDefinition
         if (!(beanDef instanceof AbstractBeanDefinition)) {
            throw new BeanDefinitionStoreException("Cannot enhance @Configuration bean definition '" +
                  beanName + "' since it is not stored in an AbstractBeanDefinition subclass");
         }
         //如果已经存在了一个实例，那么不会增强它，造成这个现象的原因是@Bean方法的返回类型BeanDefinitionRegistryPostProcessor
         else if (logger.isInfoEnabled() && beanFactory.containsSingleton(beanName)) {
            logger.info("Cannot enhance @Configuration bean definition '" + beanName +
                  "' since its singleton instance has been created too early. The typical cause " +
                  "is a non-static @Bean method with a BeanDefinitionRegistryPostProcessor " +
                  "return type: Consider declaring such methods as 'static'.");
         }
         configBeanDefs.put(beanName, (AbstractBeanDefinition) beanDef);
      }
   }
   if (configBeanDefs.isEmpty()) {
      // nothing to enhance -> return immediately
      return;
   }
   //使用ConfigurationClassEnhancer增强配置类，使其拥有调用@Bean方法总是返回一个对象的能力
   ConfigurationClassEnhancer enhancer = new ConfigurationClassEnhancer();
   for (Map.Entry<String, AbstractBeanDefinition> entry : configBeanDefs.entrySet()) {
      AbstractBeanDefinition beanDef = entry.getValue();
      // If a @Configuration class gets proxied, always proxy the target class
      beanDef.setAttribute(AutoProxyUtils.PRESERVE_TARGET_CLASS_ATTRIBUTE, Boolean.TRUE);
      try {
         // Set enhanced subclass of the user-specified bean class
         Class<?> configClass = beanDef.resolveBeanClass(this.beanClassLoader);
         if (configClass != null) {
            Class<?> enhancedClass = enhancer.enhance(configClass, this.beanClassLoader);
            if (configClass != enhancedClass) {
               if (logger.isTraceEnabled()) {
                  logger.trace(String.format("Replacing bean definition '%s' existing class '%s' with " +
                        "enhanced class '%s'", entry.getKey(), configClass.getName(), enhancedClass.getName()));
               }
               beanDef.setBeanClass(enhancedClass);
            }
         }
      }
      catch (Throwable ex) {
         throw new IllegalStateException("Cannot load configuration class: " + beanDef.getBeanClassName(), ex);
      }
   }
}
```

ConfigurationClassEnhancer.enhance()方法会使用cglib返回配置类的一个代理类，这个代理类拦截了@Bean方法，重复调用这个方法总是返回同一个对象(默认行为，除非指定@Sope)，使其拥有单例的能力。

```java
public Class<?> enhance(Class<?> configClass, @Nullable ClassLoader classLoader) {
   if (EnhancedConfiguration.class.isAssignableFrom(configClass)) {
      if (logger.isDebugEnabled()) {
         logger.debug(String.format("Ignoring request to enhance %s as it has " +
               "already been enhanced. This usually indicates that more than one " +
               "ConfigurationClassPostProcessor has been registered (e.g. via " +
               "<context:annotation-config>). This is harmless, but you may " +
               "want check your configuration and remove one CCPP if possible",
               configClass.getName()));
      }
      return configClass;
   }
   Class<?> enhancedClass = createClass(newEnhancer(configClass, classLoader));
   if (logger.isTraceEnabled()) {
      logger.trace(String.format("Successfully enhanced %s; enhanced class name is: %s",
            configClass.getName(), enhancedClass.getName()));
   }
   return enhancedClass;
}
private Enhancer newEnhancer(Class<?> configSuperClass, @Nullable ClassLoader classLoader) {
   Enhancer enhancer = new Enhancer();
   enhancer.setSuperclass(configSuperClass);
   enhancer.setInterfaces(new Class<?>[] {EnhancedConfiguration.class});
   enhancer.setUseFactory(false);
   enhancer.setNamingPolicy(SpringNamingPolicy.INSTANCE);
   enhancer.setStrategy(new BeanFactoryAwareGeneratorStrategy(classLoader));
   enhancer.setCallbackFilter(CALLBACK_FILTER);
   enhancer.setCallbackTypes(CALLBACK_FILTER.getCallbackTypes());
   return enhancer;
}
private Class<?> createClass(Enhancer enhancer) {
   Class<?> subclass = enhancer.createClass();
   // Registering callbacks statically (as opposed to thread-local)
   // is critical for usage in an OSGi environment (SPR-5932)...
   Enhancer.registerStaticCallbacks(subclass, CALLBACKS);
   return subclass;
}
```

enhancer指定了父类为EnhancedConfiguration，此类实现了BeanFactoryAware接口，所以就拥有了setBeanFactory()方法因此Spring容器会将持有的BeanFactory通过此方法传递给代理对象。enhancer又配置了一个BeanFactoryAwareGeneratorStrategy，它会给代理类添加一个名为"**$$beanFactory**"并且类型为BeanFactory的字段。加上拦截器BeanFactoryAwareMethodInterceptor结合这三者，BeanFactoryAwareMethodInterceptor起作用的时候就会将$$beanFactory赋值为当前容器，而后代理对象就拥有了Spring容器。

```java
public interface EnhancedConfiguration extends BeanFactoryAware { }
private static class BeanFactoryAwareGeneratorStrategy extends DefaultGeneratorStrategy {
   @Override
   protected ClassGenerator transform(ClassGenerator cg) throws Exception {
      ClassEmitterTransformer transformer = new ClassEmitterTransformer() {
         @Override
         public void end_class() {
            declare_field(Constants.ACC_PUBLIC, BEAN_FACTORY_FIELD, Type.getType(BeanFactory.class), null);
            super.end_class();
         }
      };
      return new TransformingClassGenerator(cg, transformer);
   }
}
```

enhancer还设置了一组拦截器（CALLBACKS）,每当执行代理类的一个方法都会经过拦截器，至于选择哪个拦截器是由拦截器的isMatch()方法决定的，CALLBACKS是三个Callback实例，分别起到不同的作用。

```java
private static final Callback[] CALLBACKS = new Callback[] {
      new BeanMethodInterceptor(),
      new BeanFactoryAwareMethodInterceptor(),
      NoOp.INSTANCE
};
```

当Spring容器调用目标对象的setBeanFactory()方法时，BeanFactoryAwareMethodInterceptor会拦截到，以为它的isMatch()犯法。

```java
public boolean isMatch(Method candidateMethod) {
   return isSetBeanFactory(candidateMethod);
}
public static boolean isSetBeanFactory(Method candidateMethod) {
   return (candidateMethod.getName().equals("setBeanFactory") &&
         candidateMethod.getParameterCount() == 1 &&
         BeanFactory.class == candidateMethod.getParameterTypes()[0] &&
         BeanFactoryAware.class.isAssignableFrom(candidateMethod.getDeclaringClass()));
}
```

后执行拦截器的intercept()方法，此方法就是如上所说将BeanFactory保存到代理对象的$$beanFactory的属性，供代理对象使用，因为BeanMethodInterceptor生效的时候会用到。

如果调用目标对象的方法不是setBeanFactory()方法并且是@Bean方法则使用BeanMethodInterceptor加强(代理)此方法。值得注意的是当检查请求的bean是否是FactoryBean。如果是这样，创建一个子类代理来拦截对getObject()的调用并返回任何缓存的bean实例。作用域代理工厂bean是一种特殊情况，不应该进一步代理。

```java
private static class BeanMethodInterceptor implements MethodInterceptor, ConditionalCallback {
   @Override
   @Nullable
   public Object intercept(Object enhancedConfigInstance, Method beanMethod, Object[] beanMethodArgs,
            MethodProxy cglibMethodProxy) throws Throwable {
      ConfigurableBeanFactory beanFactory = getBeanFactory(enhancedConfigInstance);
      String beanName = BeanAnnotationHelper.determineBeanNameFor(beanMethod);
      // Determine whether this bean is a scoped-proxy
      if (BeanAnnotationHelper.isScopedProxy(beanMethod)) {
         //获取被代理的目标bean的bean name  scopedTarget.beanName
         String scopedBeanName = ScopedProxyCreator.getTargetBeanName(beanName);
         if (beanFactory.isCurrentlyInCreation(scopedBeanName)) {
            beanName = scopedBeanName;
         }
      }
      // To handle the case of an inter-bean method reference, we must explicitly check the
      // container for already cached instances.
      // First, check to see if the requested bean is a FactoryBean. If so, create a subclass
      // proxy that intercepts calls to getObject() and returns any cached bean instance.
      // This ensures that the semantics of calling a FactoryBean from within @Bean methods
      // is the same as that of referring to a FactoryBean within XML. See SPR-6602.
      if (factoryContainsBean(beanFactory, BeanFactory.FACTORY_BEAN_PREFIX + beanName) &&
            factoryContainsBean(beanFactory, beanName)) {
         Object factoryBean = beanFactory.getBean(BeanFactory.FACTORY_BEAN_PREFIX + beanName);
         if (factoryBean instanceof ScopedProxyFactoryBean) {
            // Scoped proxy factory beans are a special case and should not be further proxied
            //如果我们显示的设置了@Scope属性proxyMode为代理模式，则不需要进一步代理了
         }
         else {
            // It is a candidate FactoryBean - go ahead with enhancement
            return enhanceFactoryBean(factoryBean, beanMethod.getReturnType(), beanFactory, beanName);
         }
      }
      //Spring通过通过工厂方法创建时会保存创建对象的工厂方法，所以说第一次调用创建对象方法不会被拦截
      if (isCurrentlyInvokedFactoryMethod(beanMethod)) {
         // The factory is calling the bean method in order to instantiate and register the bean
         // (i.e. via a getBean() call) -> invoke the super implementation of the method to actually
         // create the bean instance.
         if (logger.isInfoEnabled() &&
               BeanFactoryPostProcessor.class.isAssignableFrom(beanMethod.getReturnType())) {
            logger.info(String.format("@Bean method %s.%s is non-static and returns an object " +
                        "assignable to Spring's BeanFactoryPostProcessor interface. This will " +
                        "result in a failure to process annotations such as @Autowired, " +
                        "@Resource and @PostConstruct within the method's declaring " +
                        "@Configuration class. Add the 'static' modifier to this method to avoid " +
                        "these container lifecycle issues; see @Bean javadoc for complete details.",
                  beanMethod.getDeclaringClass().getSimpleName(), beanMethod.getName()));
         }
         //直接使用Spring 工厂方法创建对象
         return cglibMethodProxy.invokeSuper(enhancedConfigInstance, beanMethodArgs);
      }
      //如果不是第一次调用此方法，从容器中直接获取达到单利目的
      return resolveBeanReference(beanMethod, beanMethodArgs, beanFactory, beanName);
   }
   private Object resolveBeanReference(Method beanMethod, Object[] beanMethodArgs,
         ConfigurableBeanFactory beanFactory, String beanName) {
      // The user (i.e. not the factory) is requesting this bean through a call to
      // the bean method, direct or indirect. The bean may have already been marked
      // as 'in creation' in certain autowiring scenarios; if so, temporarily set
      // the in-creation status to false in order to avoid an exception.
      boolean alreadyInCreation = beanFactory.isCurrentlyInCreation(beanName);
      try {
         if (alreadyInCreation) {
            beanFactory.setCurrentlyInCreation(beanName, false);
         }
         boolean useArgs = !ObjectUtils.isEmpty(beanMethodArgs);
         if (useArgs && beanFactory.isSingleton(beanName)) {
            // Stubbed null arguments just for reference purposes,
            // expecting them to be autowired for regular singleton references?
            // A safe assumption since @Bean singleton arguments cannot be optional...
            for (Object arg : beanMethodArgs) {
               if (arg == null) {
                  useArgs = false;
                  break;
               }
            }
         }
         Object beanInstance = (useArgs ? beanFactory.getBean(beanName, beanMethodArgs) :
               beanFactory.getBean(beanName));
         if (!ClassUtils.isAssignableValue(beanMethod.getReturnType(), beanInstance)) {
            // Detect package-protected NullBean instance through equals(null) check
            if (beanInstance.equals(null)) {
               if (logger.isDebugEnabled()) {
                  logger.debug(String.format("@Bean method %s.%s called as bean reference " +
                        "for type [%s] returned null bean; resolving to null value.",
                        beanMethod.getDeclaringClass().getSimpleName(), beanMethod.getName(),
                        beanMethod.getReturnType().getName()));
               }
               beanInstance = null;
            }
            else {
               String msg = String.format("@Bean method %s.%s called as bean reference " +
                     "for type [%s] but overridden by non-compatible bean instance of type [%s].",
                     beanMethod.getDeclaringClass().getSimpleName(), beanMethod.getName(),
                     beanMethod.getReturnType().getName(), beanInstance.getClass().getName());
               try {
                  BeanDefinition beanDefinition = beanFactory.getMergedBeanDefinition(beanName);
                  msg += " Overriding bean of same name declared in: " + beanDefinition.getResourceDescription();
               }
               catch (NoSuchBeanDefinitionException ex) {
                  // Ignore - simply no detailed message then.
               }
               throw new IllegalStateException(msg);
            }
         }
         Method currentlyInvoked = SimpleInstantiationStrategy.getCurrentlyInvokedFactoryMethod();
         if (currentlyInvoked != null) {
            String outerBeanName = BeanAnnotationHelper.determineBeanNameFor(currentlyInvoked);
            beanFactory.registerDependentBean(beanName, outerBeanName);
         }
         return beanInstance;
      }
      finally {
         if (alreadyInCreation) {
            beanFactory.setCurrentlyInCreation(beanName, true);
         }
      }
   }
   @Override
   public boolean isMatch(Method candidateMethod) {
      return (candidateMethod.getDeclaringClass() != Object.class &&
            !BeanFactoryAwareMethodInterceptor.isSetBeanFactory(candidateMethod) &&
            BeanAnnotationHelper.isBeanAnnotated(candidateMethod));
   }
```
