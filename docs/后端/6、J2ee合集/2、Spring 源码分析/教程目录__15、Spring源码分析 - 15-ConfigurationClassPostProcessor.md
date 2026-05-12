# 15、Spring源码分析 - 15-ConfigurationClassPostProcessor
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/15.html
- 分类：J2EE框架
- 分组：教程目录
ConfigurationClassPostProcessor是一个BeanDefinitionRegistryPostProcessor，用于在Spring启动时处理以Java类定义形式的配置。

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
   //处理java配置形式的bean定义
   processConfigBeanDefinitions(registry);
}
```

```java
public void processConfigBeanDefinitions(BeanDefinitionRegistry registry) {
   List<BeanDefinitionHolder> configCandidates = new ArrayList<>();
   String[] candidateNames = registry.getBeanDefinitionNames();
   //取得所有的bean 定义的名称
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
   //根据类定义上的@Order注解排序
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
   ConfigurationClassParser parser = new ConfigurationClassParser(
         this.metadataReaderFactory, this.problemReporter, this.environment,
         this.resourceLoader, this.componentScanBeanNameGenerator, registry);
   Set<BeanDefinitionHolder> candidates = new LinkedHashSet<>(configCandidates);
   Set<ConfigurationClass> alreadyParsed = new HashSet<>(configCandidates.size());
   do {
      //
      parser.parse(candidates);
      //校验 配置类不能使final的，因为需要使用CGLIB生成代理对象，见postProcessBeanFactory方法
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
      sbr.registerSingleton(IMPORT_REGISTRY_BEAN_NAME, parser.getImportRegistry());
   }
   if (this.metadataReaderFactory instanceof CachingMetadataReaderFactory) {
      // Clear cache in externally provided MetadataReaderFactory; this is a no-op
      // for a shared cache since it'll be cleared by the ApplicationContext.
      ((CachingMetadataReaderFactory) this.metadataReaderFactory).clearCache();
   }
}
```

## 1、ConfigurationClassParser.parse()方法解析配置类，parse()方法内部会统一调用processConfigurationClass()方法。

```java
public void parse(Set<BeanDefinitionHolder> configCandidates) {
   this.deferredImportSelectors = new LinkedList<>();
   for (BeanDefinitionHolder holder : configCandidates) {
      BeanDefinition bd = holder.getBeanDefinition();
      try {
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
   //处理需要延迟导入的
   processDeferredImportSelectors();
}
```

### 1.1、processConfigurationClass是真正处理@Configuration，此时还是不是将配置类注册为bean，而是通过此配置类继续找到其他的配置类，其他的配置类就属于被导入的配置类。

```java
protected void processConfigurationClass(ConfigurationClass configClass) throws IOException {
   //根据@Conditional注解Condition的实现类判断此configClass是否应该跳过
   if (this.conditionEvaluator.shouldSkip(configClass.getMetadata(), ConfigurationPhase.PARSE_CONFIGURATION)) {
      return;
   }
   //如果同一个配置类被处理两次，两次都属于被导入的则合并导入类，返回。如果配置类不是被导入的，则移除旧使用新的配置类
   ConfigurationClass existingClass = this.configurationClasses.get(configClass);
   if (existingClass != null) {
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
         this.configurationClasses.remove(configClass);
         this.knownSuperclasses.values().removeIf(configClass::equals);
      }
   }
   // 递归处理配置类及其超类层次结构。
   SourceClass sourceClass = asSourceClass(configClass);
   do {
      //从配置类解析一切可能的bean形式，内部类，成员方法，@Import等，返回值为父类，继续解析父类直到为null
      sourceClass = doProcessConfigurationClass(configClass, sourceClass);
   }
   while (sourceClass != null);
   this.configurationClasses.put(configClass, configClass);
}
```

通过从源类中读取注释，内部类和方法来应用处理并构建完整的ConfigurationClass。

```java
protected final SourceClass doProcessConfigurationClass(ConfigurationClass configClass, SourceClass sourceClass)
      throws IOException {
   // Recursively process any member (nested) classes first
   processMemberClasses(configClass, sourceClass);
   // Process any @PropertySource annotations
   // 将@PropertySource指定的属性文件载入到environment中
   for (AnnotationAttributes propertySource : AnnotationConfigUtils.attributesForRepeatable(
         sourceClass.getMetadata(), PropertySources.class,
         org.springframework.context.annotation.PropertySource.class)) {
      if (this.environment instanceof ConfigurableEnvironment) {
         processPropertySource(propertySource);
      }
      else {
         logger.warn("Ignoring @PropertySource annotation on [" + sourceClass.getMetadata().getClassName() +
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
         // 注册被标记@Component的bean
         Set<BeanDefinitionHolder> scannedBeanDefinitions =
               this.componentScanParser.parse(componentScan, sourceClass.getMetadata().getClassName());
         // Check the set of scanned definitions for any further config classes and parse recursively if needed
         for (BeanDefinitionHolder holder : scannedBeanDefinitions) {
            BeanDefinition bdCand = holder.getBeanDefinition().getOriginatingBeanDefinition();
            if (bdCand == null) {
               bdCand = holder.getBeanDefinition();
            }
            //有符合配置类的bean继续调用parse方法解析配置类重复doProcessConfigurationClas()的调用
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
   // 方法的先后声明顺序
   Set<MethodMetadata> beanMethods = retrieveBeanMethodMetadata(sourceClass);
   for (MethodMetadata methodMetadata : beanMethods) {
      configClass.addBeanMethod(new BeanMethod(methodMetadata, configClass));
   }
   // Process default methods on interfaces
   // 居然也支持接口默认方法的@Bean与普通类的@Bean没有区别
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

doProcessConfigurationClass()方法用来解析配置类中的bean定义同时也会延展处理配置类。包括从以下几个方面来发现更多的配置类及bean：

**1、** 成员内部类；

**2、** @ComponentScan注解指定包下扫描；

**3、** @Import注解指定导入的类；

**4、** @ImportResource指定的xml配置文件；

**5、** @Bean标记的成员方法；

**6、** @Bean标记接口默认方法；

#### 1.1.1、找出成员内部类符合配置类的，调用processConfigurationClass()方法继续解析被发现的配置类。

```java
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
               //递归处理MemberClass配置类
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

#### 1.1.2、将配置类中@ComponentScan注解指定的所有属性传递给ComponentScanAnnotationParser的parse方法，parse()方法的返回值为@ComponentScan扫描包下符合bean定义(默认为@Component)的BeanDefination，再次判断这些BeanDefination中是否有符合ConfigurationClassUtils.checkConfigurationClassCandidate(）的，如果有再次调用parse()方法做深层次的解析。

关于这个方法的核心类ClassPathBeanDefinitionScanner请参考[《Spring源码分析 - -ClassPathBeanDefinitionScanner》](/zhuanlan/j2ee/spring/7/41.html)中有详细介绍。

```java
class ComponentScanAnnotationParser {
   private final Environment environment;
   private final ResourceLoader resourceLoader;
   private final BeanNameGenerator beanNameGenerator;
   private final BeanDefinitionRegistry registry;
   public ComponentScanAnnotationParser(Environment environment, ResourceLoader resourceLoader,
         BeanNameGenerator beanNameGenerator, BeanDefinitionRegistry registry) {
      this.environment = environment;
      this.resourceLoader = resourceLoader;
      this.beanNameGenerator = beanNameGenerator;
      this.registry = registry;
   }
   //根据componentScan属性的配置扫描@Component组件
   public Set<BeanDefinitionHolder> parse(AnnotationAttributes componentScan, final String declaringClass) {
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
         String[] tokenized = StringUtils.tokenizeToStringArray(this.environment.resolvePlaceholders(pkg),
               ConfigurableApplicationContext.CONFIG_LOCATION_DELIMITERS);
         Collections.addAll(basePackages, tokenized);
      }
      for (Class<?> clazz : componentScan.getClassArray("basePackageClasses")) {
         basePackages.add(ClassUtils.getPackageName(clazz));
      }
      //没有指定basePackages或basePackageClasses，使用当前配置类所在的包路径作为扫描路径
      if (basePackages.isEmpty()) {
         basePackages.add(ClassUtils.getPackageName(declaringClass));
      }
      //扫描时不会再次解析配置类
      scanner.addExcludeFilter(new AbstractTypeHierarchyTraversingFilter(false, false) {
         @Override
         protected boolean matchClassName(String className) {
            return declaringClass.equals(className);
         }
      });
      return scanner.doScan(StringUtils.toStringArray(basePackages));
   }
   private List<TypeFilter> typeFiltersFor(AnnotationAttributes filterAttributes) {
      List<TypeFilter> typeFilters = new ArrayList<>();
      FilterType filterType = filterAttributes.getEnum("type");
      for (Class<?> filterClass : filterAttributes.getClassArray("classes")) {
         switch (filterType) {
            case ANNOTATION:
               Assert.isAssignable(Annotation.class, filterClass,
                     "@ComponentScan ANNOTATION type filter requires an annotation type");
               @SuppressWarnings("unchecked")
               Class<Annotation> annotationType = (Class<Annotation>) filterClass;
               typeFilters.add(new AnnotationTypeFilter(annotationType));
               break;
            case ASSIGNABLE_TYPE:
               typeFilters.add(new AssignableTypeFilter(filterClass));
               break;
            case CUSTOM:
               Assert.isAssignable(TypeFilter.class, filterClass,
                     "@ComponentScan CUSTOM type filter requires a TypeFilter implementation");
               TypeFilter filter = BeanUtils.instantiateClass(filterClass, TypeFilter.class);
               ParserStrategyUtils.invokeAwareMethods(
                     filter, this.environment, this.resourceLoader, this.registry);
               typeFilters.add(filter);
               break;
            default:
               throw new IllegalArgumentException("Filter type not supported with Class value: " + filterType);
         }
      }
      for (String expression : filterAttributes.getStringArray("pattern")) {
         switch (filterType) {
            case ASPECTJ:
               typeFilters.add(new AspectJTypeFilter(expression, this.resourceLoader.getClassLoader()));
               break;
            case REGEX:
               typeFilters.add(new RegexPatternTypeFilter(Pattern.compile(expression)));
               break;
            default:
               throw new IllegalArgumentException("Filter type not supported with String pattern: " + filterType);
         }
      }
      return typeFilters;
   }
}
```

#### 1.1.3、处理@Import注解，spring会找出配置类被标记@Import的所有注解，包括注解也被标记@Import的。

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
   if (importCandidates.isEmpty()) {
      return;
   }
   //importStack保存了被导入源configClass，重复导入会抛BeanDefinitionParsingException
   if (checkForCircularImports && isChainedImportOnStack(configClass)) {
      this.problemReporter.error(new CircularImportProblem(configClass, this.importStack));
   }
   else {
      this.importStack.push(configClass);
      try {
         //@Import的value可以指定三种类型：带有@Configuration的类、ImportSelector实现、ImportBeanDefinitionRegistrar实现
         for (SourceClass candidate : importCandidates) {
            //ImportSelector方法selectImports()返回值作为importCandidates继续递归调用processImports()方法，
            //直到selectImports()返回值为ImportBeanDefinitionRegistrar或普通class当做配置类调用processConfigurationClass()处理
            if (candidate.isAssignable(ImportSelector.class)) {
               // Candidate class is an ImportSelector -> delegate to it to determine imports
               Class<?> candidateClass = candidate.loadClass();
               ImportSelector selector = BeanUtils.instantiateClass(candidateClass, ImportSelector.class);
               ParserStrategyUtils.invokeAwareMethods(
                     selector, this.environment, this.resourceLoader, this.registry);
               //如果是DeferredImportSelector,将DeferredImportSelector包装成DeferredImportSelectorHolder对象
               //添加至待处理队列deferredImportSelectors中，需要在所有配置类解析后调用processDeferredImportSelectors方法处理
               if (this.deferredImportSelectors != null && selector instanceof DeferredImportSelector) {
                  this.deferredImportSelectors.add(
                        new DeferredImportSelectorHolder(configClass, (DeferredImportSelector) selector));
               }
               else {
                  String[] importClassNames = selector.selectImports(currentSourceClass.getMetadata());
                  Collection<SourceClass> importSourceClasses = asSourceClasses(importClassNames);
                  processImports(configClass, currentSourceClass, importSourceClasses, false);
               }
            }
            //ImportBeanDefinitionRegistrar批量注册bean的方式，见ConfigurationClassPostProcessor.processConfigBeanDefinitions
            //this.reader.loadBeanDefinitions(configClasses)
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

#### 1.1.4.@ImportResource的解析，将locations指定的资源对象和reader指定的 BeanDefinitionReader保存到configClass中，后面会解析这些资源对象为bean。

#### 1.1.5.将配置类标记@Bean注解的方法解析为MethodMetadata对象，随后将这些包装为BeanMethod保存到configClass中，然后统一注册为bean。

```java
/**
 * Retrieve the metadata for all <code>@Bean</code> methods.
 */
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

#### 1.1.6、接口默认方法标记@Bean的。

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

### 1.2、处理需要延迟导入的DeferredImportSelector。

```java
private void processDeferredImportSelectors() {
   List<DeferredImportSelectorHolder> deferredImports = this.deferredImportSelectors;
   this.deferredImportSelectors = null;
   if (deferredImports == null) {
      return;
   }
   deferredImports.sort(DEFERRED_IMPORT_COMPARATOR);
   Map<Object, DeferredImportSelectorGrouping> groupings = new LinkedHashMap<>();
   Map<AnnotationMetadata, ConfigurationClass> configurationClasses = new HashMap<>();
   for (DeferredImportSelectorHolder deferredImport : deferredImports) {
      Class<? extends Group> group = deferredImport.getImportSelector().getImportGroup();
      DeferredImportSelectorGrouping grouping = groupings.computeIfAbsent(
            (group == null ? deferredImport : group),
            (key) -> new DeferredImportSelectorGrouping(createGroup(group)));
      grouping.add(deferredImport);
      configurationClasses.put(deferredImport.getConfigurationClass().getMetadata(),
            deferredImport.getConfigurationClass());
   }
   for (DeferredImportSelectorGrouping grouping : groupings.values()) {
      grouping.getImports().forEach((entry) -> {
         ConfigurationClass configurationClass = configurationClasses.get(
               entry.getMetadata());
         try {
            processImports(configurationClass, asSourceClass(configurationClass),
                  asSourceClasses(entry.getImportClassName()), false);
         }
         catch (BeanDefinitionStoreException ex) {
            throw ex;
         }
         catch (Throwable ex) {
            throw new BeanDefinitionStoreException(
                  "Failed to process import candidates for configuration class [" +
                        configurationClass.getMetadata().getClassName() + "]", ex);
         }
      });
   }
}
```

在Spring Framework5.0中，DeferredImportSelector接口新增了getImportGroup方法，其中DeferredImportSelector.Group接口辅助处理DeferredImportSelector导入的Configuration Class。

```java
private Group createGroup(@Nullable Class<? extends Group> type) {
   Class<? extends Group> effectiveType = (type != null ? type
         : DefaultDeferredImportSelectorGroup.class);
   Group group = BeanUtils.instantiateClass(effectiveType);
   ParserStrategyUtils.invokeAwareMethods(group,
         ConfigurationClassParser.this.environment,
         ConfigurationClassParser.this.resourceLoader,
         ConfigurationClassParser.this.registry);
   return group;
}
```

DeferredImportSelector.Group接口提供两类方法：process()和selectImports()。前者二次处理DeferredImportSelector#selectImports方法返回的结果，而后者负责决定本组应该导入的Configuration Class作为实际导入的结果。所以在processDeferredImportSelectors()方法中实际迭代的集合是DeferredImportSelectorGrouping，而非DeferredImportSelectorHolder。

```java
private static class DeferredImportSelectorGrouping {
   private final DeferredImportSelector.Group group;
   private final List<DeferredImportSelectorHolder> deferredImports = new ArrayList<>();
   DeferredImportSelectorGrouping(Group group) {
      this.group = group;
   }
   public void add(DeferredImportSelectorHolder deferredImport) {
      this.deferredImports.add(deferredImport);
   }
   /**
    * Return the imports defined by the group.
    * @return each import with its associated configuration class
    */
   public Iterable<Group.Entry> getImports() {
      for (DeferredImportSelectorHolder deferredImport : this.deferredImports) {
         this.group.process(deferredImport.getConfigurationClass().getMetadata(),
               deferredImport.getImportSelector());
      }
      return this.group.selectImports();
   }
}
```

## 2、ConfigurationClassParser.validate()方法会做一个校验，配置类和@Bean方法不能是final的，因为需要使用CGLIB生成代理对象。

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

## 3、ConfigurationClassBeanDefinitionReader的loadBeanDefinitions()方法就是将configClasses保存的所有配置相关的信息添加到spring的bean定义。

```java
public void loadBeanDefinitions(Set<ConfigurationClass> configurationModel) {
   TrackedConditionEvaluator trackedConditionEvaluator = new TrackedConditionEvaluator();
   for (ConfigurationClass configClass : configurationModel) {
      loadBeanDefinitionsForConfigurationClass(configClass, trackedConditionEvaluator);
   }
}
```

读取特定的ConfigurationClass，为类本身及其所有Bean方法注册bean定义。

```java
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
   if (configClass.isImported()) {
      //注册@Configuration类为bean，此处只需要注册被导入的@Configuration类，因为非被导入的早已经完成的bean定义
      registerBeanDefinitionForImportedConfigurationClass(configClass);
   }
   for (BeanMethod beanMethod : configClass.getBeanMethods()) {
      //注册@Bean的方法为bean
      loadBeanDefinitionsForBeanMethod(beanMethod);
   }
   //@ImportResource
   loadBeanDefinitionsFromImportedResources(configClass.getImportedResources());
   //@ImportedRegistrar
   loadBeanDefinitionsFromRegistrars(configClass.getImportBeanDefinitionRegistrars());
}
```

### 3.1、将@Configuration标记的类注册为bean。

```java
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
   if (logger.isDebugEnabled()) {
      logger.debug("Registered bean definition for imported class '" + configBeanName + "'");
   }
}
```

### 3.2、将@Bean标记的方法转换成了BeanMethod的对象注册为bean。

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
   beanDef.setAutowireMode(RootBeanDefinition.AUTOWIRE_CONSTRUCTOR);
   beanDef.setAttribute(RequiredAnnotationBeanPostProcessor.SKIP_REQUIRED_CHECK_ATTRIBUTE, Boolean.TRUE);
   AnnotationConfigUtils.processCommonDefinitionAnnotations(beanDef, metadata);
   Autowire autowire = bean.getEnum("autowire");
   if (autowire.isAutowire()) {
      beanDef.setAutowireMode(autowire.value());
   }
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
   if (logger.isDebugEnabled()) {
      logger.debug(String.format("Registering bean definition for @Bean method %s.%s()",
            configClass.getMetadata().getClassName(), beanName));
   }
   this.registry.registerBeanDefinition(beanName, beanDefToRegister);
}
```

### 3.3、将@ImportResource指定的资源注册为bean，这里支持两种形式，groovy或其他，对于其他形式的配置文件会使用传统的 XmlBeanDefinitionReader去解析。

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

### 3.4、使用configClass中保存的ImportedRegistrar完成bean注册。

```java
private void loadBeanDefinitionsFromRegistrars(Map<ImportBeanDefinitionRegistrar, AnnotationMetadata> registrars) {
   registrars.forEach((registrar, metadata) ->
         registrar.registerBeanDefinitions(metadata, this.registry));
}
```

## 4、通过将配置类替换为CGLIB增强的子类，准备在运行时为bean请求提供服务。

下面在看看ConfigurationClassPostProcessor的postProcessBeanFactory()方法。

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
   enhanceConfigurationClasses(beanFactory);
   beanFactory.addBeanPostProcessor(new ImportAwareBeanPostProcessor(beanFactory));
}
```

核心方法enhanceConfigurationClasses用来将标记@Configuration的配置类的BeanDefinition的beanClass替换为经过CGLIB加强过的，这样在实例化此bean的时候，就可以使用替换的代理类来创建对象了。

```java
public void enhanceConfigurationClasses(ConfigurableListableBeanFactory beanFactory) {
   Map<String, AbstractBeanDefinition> configBeanDefs = new LinkedHashMap<>();
   for (String beanName : beanFactory.getBeanDefinitionNames()) {
      BeanDefinition beanDef = beanFactory.getBeanDefinition(beanName);
      if (ConfigurationClassUtils.isFullConfigurationClass(beanDef)) {
         if (!(beanDef instanceof AbstractBeanDefinition)) {
            throw new BeanDefinitionStoreException("Cannot enhance @Configuration bean definition '" +
                  beanName + "' since it is not stored in an AbstractBeanDefinition subclass");
         }
         else if (logger.isWarnEnabled() && beanFactory.containsSingleton(beanName)) {
            logger.warn("Cannot enhance @Configuration bean definition '" + beanName +
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
               if (logger.isDebugEnabled()) {
                  logger.debug(String.format("Replacing bean definition '%s' existing class '%s' with " +
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

使用ConfigurationClassEnhancer对象的enhance()方法加强beanClass的。

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
   if (logger.isDebugEnabled()) {
      logger.debug(String.format("Successfully enhanced %s; enhanced class name is: %s",
            configClass.getName(), enhancedClass.getName()));
   }
   return enhancedClass;
}
/**
 * Creates a new CGLIB {@link Enhancer} instance.
 */
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
```

使用Cglib生成代理对象需要一个Enhancer对象，这里将配置类设置为父类，EnhancedConfiguration设置为父接口，还有最重要的是方法拦截Callback。

```java
private static final Callback[] CALLBACKS = new Callback[] {
      new BeanMethodInterceptor(),//拦截@Bean方法
      new BeanFactoryAwareMethodInterceptor(),//注入BeanFactory
      NoOp.INSTANCE
};
```

```java
private static class ConditionalCallbackFilter implements CallbackFilter {
   private final Callback[] callbacks;
   private final Class<?>[] callbackTypes;
   public ConditionalCallbackFilter(Callback[] callbacks) {
      this.callbacks = callbacks;
      this.callbackTypes = new Class<?>[callbacks.length];
      for (int i = 0; i < callbacks.length; i++) {
         this.callbackTypes[i] = callbacks[i].getClass();
      }
   }
   @Override
   public int accept(Method method) {
      for (int i = 0; i < this.callbacks.length; i++) {
         if (!(this.callbacks[i] instanceof ConditionalCallback) ||
               ((ConditionalCallback) this.callbacks[i]).isMatch(method)) {
            return i;
         }
      }
      throw new IllegalStateException("No callback available for method " + method.getName());
   }
   public Class<?>[] getCallbackTypes() {
      return this.callbackTypes;
   }
}
```

这里简单看一下BeanMethodInterceptor。

使用BeanMethodInterceptor拦截配置类@Bean方法。

```java
public boolean isMatch(Method candidateMethod) {
   return (candidateMethod.getDeclaringClass() != Object.class &&
         BeanAnnotationHelper.isBeanAnnotated(candidateMethod));
}
```

下面是对@Bean方法拦截的具体实现。

```java
public Object intercept(Object enhancedConfigInstance, Method beanMethod, Object[] beanMethodArgs,
         MethodProxy cglibMethodProxy) throws Throwable {
   ConfigurableBeanFactory beanFactory = getBeanFactory(enhancedConfigInstance);
   String beanName = BeanAnnotationHelper.determineBeanNameFor(beanMethod);
   // Determine whether this bean is a scoped-proxy
   Scope scope = AnnotatedElementUtils.findMergedAnnotation(beanMethod, Scope.class);
   if (scope != null && scope.proxyMode() != ScopedProxyMode.NO) {
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
      }
      else {
         // It is a candidate FactoryBean - go ahead with enhancement
         return enhanceFactoryBean(factoryBean, beanMethod.getReturnType(), beanFactory, beanName);
      }
   }
   if (isCurrentlyInvokedFactoryMethod(beanMethod)) {
      // The factory is calling the bean method in order to instantiate and register the bean
      // (i.e. via a getBean() call) -> invoke the super implementation of the method to actually
      // create the bean instance.
      if (logger.isWarnEnabled() &&
            BeanFactoryPostProcessor.class.isAssignableFrom(beanMethod.getReturnType())) {
         logger.warn(String.format("@Bean method %s.%s is non-static and returns an object " +
                     "assignable to Spring's BeanFactoryPostProcessor interface. This will " +
                     "result in a failure to process annotations such as @Autowired, " +
                     "@Resource and @PostConstruct within the method's declaring " +
                     "@Configuration class. Add the 'static' modifier to this method to avoid " +
                     "these container lifecycle issues; see @Bean javadoc for complete details.",
               beanMethod.getDeclaringClass().getSimpleName(), beanMethod.getName()));
      }
      return cglibMethodProxy.invokeSuper(enhancedConfigInstance, beanMethodArgs);
   }
   return resolveBeanReference(beanMethod, beanMethodArgs, beanFactory, beanName);
}
```

这里包含了FactoryBean对bean的创建，工厂方法对bean的创建，以及简单的类的构造方法形式对bean的创建，这里就看一下最后一种。

```java
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
```

上面代码就是BeanFactory调用getBean()方法使用了增强过的beanClass的BeanDefinition完成了对bean的创建，这样每次调用@Bean方法都会从BeanFactory中取得，避免了对象的重复创建已实现单例bean的创建。
