# 28、Spring源码分析 - 28-Spring缓存原理详解
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/28.html
- 分类：J2EE框架
- 分组：教程目录
Spring框架提供了基于注解`@Cacheable、@CacheEvict、@CachePut、@Caching、@CacheConfig`的缓存功能，@EnableCaching用于开启基于注解的缓存功能，下面分析一下Spring基于注解缓存的实现原理。

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(CachingConfigurationSelector.class)
public @interface EnableCaching {
   boolean proxyTargetClass() default false;
   AdviceMode mode() default AdviceMode.PROXY;
   int order() default Ordered.LOWEST_PRECEDENCE;
}
```

## 1、配置缓存的必要组件

如果一个bean方法被标记了上面注解中的一个则这个对象就是一个有缓存功能的代理对象，代理对象的功能就是通过通知器赋予的，下面我们就看一下如何注册代理的通知器的。

@EnableCaching会通过CachingConfigurationSelector导入一些额外的组件来辅助缓存功能的实现。CachingConfigurationSelector继承了AdviceModeImportSelector，通过selectImports()方法又向容器注册了几个组件。以JDK动态代理模式举例分析，当然这也是默认模式。

```java
@Override
public String[] selectImports(AdviceMode adviceMode) {
   switch (adviceMode) {
      case PROXY:
         return getProxyImports();
      case ASPECTJ:
         return getAspectJImports();
      default:
         return null;
   }
}
private String[] getProxyImports() {
   List<String> result = new ArrayList<>(3);
   result.add(AutoProxyRegistrar.class.getName());
   result.add(ProxyCachingConfiguration.class.getName());
   if (jsr107Present && jcacheImplPresent) {
      result.add(PROXY_JCACHE_CONFIGURATION_CLASS);
   }
   return StringUtils.toStringArray(result);
}
```

### 1.1、必要组件之一：AbstractAutoProxyCreator及其原理

AutoProxyRegistrar会向容器注册一个AbstractAdvisorAutoProxyCreator用来发现可以应用到符合要求代理对象上的通知器。在[《基于注解@Aspect的AOP实现》](/zhuanlan/j2ee/spring/7/24.html)一文中已经介绍过AnnotationAwareAspectJAutoProxyCreator的工作原理，在这再简要回顾一下自动创建代理的底层模型设计。

在上图继承结构中，AbstractAutoProxyCreator可以通过以下接口方法为原始bean创建代理替换原bean。

- InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation
- AbstractAutoProxyCreator#getEarlyBeanReference
- AbstractAutoProxyCreator#postProcessAfterInitialization

上面这三个方法都会调用同一个方法将原始对象包装成代理对象，首先调用getAdvicesAndAdvisorsForBean()这个抽象方法获取容器中可以应用到当前对象的通知器，然后通过createProxy()方法内部的ProxyFactory创建队里对象返回。

```java
protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {
   if (StringUtils.hasLength(beanName) && this.targetSourcedBeans.contains(beanName)) {
      return bean;
   }
   if (Boolean.FALSE.equals(this.advisedBeans.get(cacheKey))) {
      return bean;
   }
   if (isInfrastructureClass(bean.getClass()) || shouldSkip(bean.getClass(), beanName)) {
      this.advisedBeans.put(cacheKey, Boolean.FALSE);
      return bean;
   }
   // Create proxy if we have advice.
   Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);
   if (specificInterceptors != DO_NOT_PROXY) {
      this.advisedBeans.put(cacheKey, Boolean.TRUE);
      Object proxy = createProxy(
            bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));
      this.proxyTypes.put(cacheKey, proxy.getClass());
      return proxy;
   }
   this.advisedBeans.put(cacheKey, Boolean.FALSE);
   return bean;
}
```

getAdvicesAndAdvisorsForBean()方法的实现子类有AbstractAdvisorAutoProxyCreator和BeanNameAutoProxyCreator，在上图继承体系下我们关注的是AbstractAdvisorAutoProxyCreator：

```java
@Override
@Nullable
protected Object[] getAdvicesAndAdvisorsForBean(
      Class<?> beanClass, String beanName, @Nullable TargetSource targetSource) {
   List<Advisor> advisors = findEligibleAdvisors(beanClass, beanName);
   if (advisors.isEmpty()) {
      return DO_NOT_PROXY;
   }
   return advisors.toArray();
}
protected List<Advisor> findEligibleAdvisors(Class<?> beanClass, String beanName) {
   List<Advisor> candidateAdvisors = findCandidateAdvisors();
   List<Advisor> eligibleAdvisors = findAdvisorsThatCanApply(candidateAdvisors, beanClass, beanName);
   extendAdvisors(eligibleAdvisors);
   if (!eligibleAdvisors.isEmpty()) {
      eligibleAdvisors = sortAdvisors(eligibleAdvisors);
   }
   return eligibleAdvisors;
}
```

findEligibleAdvisors()方法中首先调用findCandidateAdvisors()方法取出容器中可以被当前AbstractAdvisorAutoProxyCreator实现类发现的通知器，然后findAdvisorsThatCanApply()方法根据通知器来决定该通知器是否可以应用到当前bean。findCandidateAdvisors()方法默认返回容器中所有的Advisor，这个方法内部会调用isEligibleAdvisorBean()方法决定每个Advisor是否合格(可以返回)，默认是true，其子类可以重写此方法来过滤一些不需要的Advisor，Spring中其子类InfrastructureAdvisorAutoProxyCreator和DefaultAdvisorAutoProxyCreator重写了此方法如下。

```java
@Override
protected boolean isEligibleAdvisorBean(String beanName) {
   return (this.beanFactory != null && this.beanFactory.containsBeanDefinition(beanName) &&
         this.beanFactory.getBeanDefinition(beanName).getRole() == BeanDefinition.ROLE_INFRASTRUCTURE);
}
@Override
protected boolean isEligibleAdvisorBean(String beanName) {
   if (!isUsePrefix()) {
      return true;
   }
   String prefix = getAdvisorBeanNamePrefix();
   return (prefix != null && beanName.startsWith(prefix));
}
```

另外findEligibleAdvisors()也可以被重写，其子类可以重写此方法来扩展获取Advisor的能力。之前讲过的AnnotationAwareAspectJAutoProxyCreator就重写了此方法扩展了@Aspct类成为Advisor的能力，如下。

```java
@Override
protected List<Advisor> findCandidateAdvisors() {
   // Add all the Spring advisors found according to superclass rules.
   List<Advisor> advisors = super.findCandidateAdvisors();
   // Build Advisors for all AspectJ aspects in the bean factory.
   if (this.aspectJAdvisorsBuilder != null) {
      advisors.addAll(this.aspectJAdvisorsBuilder.buildAspectJAdvisors());
   }
   return advisors;
}
```

下面看看这个AutoProxyRegistrar注册的到底是哪种AbstractAutoProxyCreator。

```java
public class AutoProxyRegistrar implements ImportBeanDefinitionRegistrar {
   private final Log logger = LogFactory.getLog(getClass());
   @Override
   public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
      boolean candidateFound = false;
      Set<String> annoTypes = importingClassMetadata.getAnnotationTypes();
      for (String annoType : annoTypes) {
         AnnotationAttributes candidate = AnnotationConfigUtils.attributesFor(importingClassMetadata, annoType);
         if (candidate == null) {
            continue;
         }
         Object mode = candidate.get("mode");
         Object proxyTargetClass = candidate.get("proxyTargetClass");
         if (mode != null && proxyTargetClass != null && AdviceMode.class == mode.getClass() &&
               Boolean.class == proxyTargetClass.getClass()) {
            candidateFound = true;
            if (mode == AdviceMode.PROXY) {
               AopConfigUtils.registerAutoProxyCreatorIfNecessary(registry);
               if ((Boolean) proxyTargetClass) {
                  AopConfigUtils.forceAutoProxyCreatorToUseClassProxying(registry);
                  return;
               }
            }
         }
      }
      if (!candidateFound && logger.isWarnEnabled()) {
         String name = getClass().getSimpleName();
         logger.warn(String.format("%s was imported but no annotations were found " +
               "having both 'mode' and 'proxyTargetClass' attributes of type " +
               "AdviceMode and boolean respectively. This means that auto proxy " +
               "creator registration and configuration may not have occurred as " +
               "intended, and components may not be proxied as expected. Check to " +
               "ensure that %s has been @Import'ed on the same class where these " +
               "annotations are declared; otherwise remove the import of %s " +
               "altogether.", name, name, name));
      }
   }
}
```

方法中使用AopConfigUtils的静态方法registerAutoProxyCreatorIfNecessary()注册了一个APC。

```java
public abstract class AopConfigUtils {
   public static final String AUTO_PROXY_CREATOR_BEAN_NAME =
         "org.springframework.aop.config.internalAutoProxyCreator";
   private static final List<Class<?>> APC_PRIORITY_LIST = new ArrayList<Class<?>>(3);
   static {
      // Set up the escalation list...
      //后面的优先级高于前面的
      APC_PRIORITY_LIST.add(InfrastructureAdvisorAutoProxyCreator.class);
      APC_PRIORITY_LIST.add(AspectJAwareAdvisorAutoProxyCreator.class);
      APC_PRIORITY_LIST.add(AnnotationAwareAspectJAutoProxyCreator.class);
   }
   public static BeanDefinition registerAutoProxyCreatorIfNecessary(BeanDefinitionRegistry registry) {
      return registerAutoProxyCreatorIfNecessary(registry, null);
   }
   public static BeanDefinition registerAutoProxyCreatorIfNecessary(BeanDefinitionRegistry registry, Object source) {
      return registerOrEscalateApcAsRequired(InfrastructureAdvisorAutoProxyCreator.class, registry, source);
   }
   private static BeanDefinition registerOrEscalateApcAsRequired(Class<?> cls, BeanDefinitionRegistry registry, Object source) {
      Assert.notNull(registry, "BeanDefinitionRegistry must not be null");
      if (registry.containsBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME)) {
         BeanDefinition apcDefinition = registry.getBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME);
         if (!cls.getName().equals(apcDefinition.getBeanClassName())) {
            int currentPriority = findPriorityForClass(apcDefinition.getBeanClassName());
            int requiredPriority = findPriorityForClass(cls);
            if (currentPriority < requiredPriority) {
               apcDefinition.setBeanClassName(cls.getName());
            }
         }
         return null;
      }
      RootBeanDefinition beanDefinition = new RootBeanDefinition(cls);
      beanDefinition.setSource(source);
      beanDefinition.getPropertyValues().add("order", Ordered.HIGHEST_PRECEDENCE);
      beanDefinition.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
      registry.registerBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME, beanDefinition);
      return beanDefinition;
   }
   private static int findPriorityForClass(Class<?> clazz) {
      return APC_PRIORITY_LIST.indexOf(clazz);
   }
   private static int findPriorityForClass(String className) {
      for (int i = 0; i < APC_PRIORITY_LIST.size(); i++) {
         Class<?> clazz = APC_PRIORITY_LIST.get(i);
         if (clazz.getName().equals(className)) {
            return i;
         }
      }
      throw new IllegalArgumentException(
            "Class name [" + className + "] is not a known auto-proxy creator class");
   }
}
```

APC_PRIORITY_LIST存储了三种APC，registerAutoProxyCreatorIfNecessary()默认尝试使用InfrastructureAdvisorAutoProxyCreator，如果容器中已有名是org.springframework.aop.config.internalAutoProxyCreator的APC，则使用优先级高的，APC_PRIORITY_LIST中后面的高于前面的。

### 1.2、必要组件之二：BeanFactoryCacheOperationSourceAdvisor及其原理

在CachingConfigurationSelector中PROXY模式中还会注册一个@Conguration类ProxyCachingConfiguration，这个类的目的就是向容器中注册一个可以处理缓存的通知器BeanFactoryCacheOperationSourceAdvisor。

```java
@Configuration
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class ProxyCachingConfiguration extends AbstractCachingConfiguration {
   @Bean(name = CacheManagementConfigUtils.CACHE_ADVISOR_BEAN_NAME)
   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
   public BeanFactoryCacheOperationSourceAdvisor cacheAdvisor() {
      BeanFactoryCacheOperationSourceAdvisor advisor = new BeanFactoryCacheOperationSourceAdvisor();
      advisor.setCacheOperationSource(cacheOperationSource());
      advisor.setAdvice(cacheInterceptor());
      advisor.setOrder(this.enableCaching.<Integer>getNumber("order"));
      return advisor;
   }
   @Bean
   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
   public CacheOperationSource cacheOperationSource() {
      return new AnnotationCacheOperationSource();
   }
   @Bean
   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
   public CacheInterceptor cacheInterceptor() {
      CacheInterceptor interceptor = new CacheInterceptor();
      interceptor.setCacheOperationSources(cacheOperationSource());
      if (this.cacheResolver != null) {
         interceptor.setCacheResolver(this.cacheResolver);
      }
      else if (this.cacheManager != null) {
         interceptor.setCacheManager(this.cacheManager);
      }
      if (this.keyGenerator != null) {
         interceptor.setKeyGenerator(this.keyGenerator);
      }
      if (this.errorHandler != null) {
         interceptor.setErrorHandler(this.errorHandler);
      }
      return interceptor;
   }
}
```

从上面代码看到对BeanFactoryCacheOperationSourceAdvisor设置了一个CacheOperationSource、CacheInterceptor和order，这个order是继承ProxyCachingConfiguration父类AbstractCachingConfiguration的属性。

```java
@Configuration
public abstract class AbstractCachingConfiguration implements ImportAware {
   protected AnnotationAttributes enableCaching;
   protected CacheManager cacheManager;
   protected CacheResolver cacheResolver;
   protected KeyGenerator keyGenerator;
   protected CacheErrorHandler errorHandler;
   @Override
   public void setImportMetadata(AnnotationMetadata importMetadata) {
      this.enableCaching = AnnotationAttributes.fromMap(
            importMetadata.getAnnotationAttributes(EnableCaching.class.getName(), false));
      if (this.enableCaching == null) {
         throw new IllegalArgumentException(
               "@EnableCaching is not present on importing class " + importMetadata.getClassName());
      }
   }
   @Autowired(required = false)
   void setConfigurers(Collection<CachingConfigurer> configurers) {
      if (CollectionUtils.isEmpty(configurers)) {
         return;
      }
      if (configurers.size() > 1) {
         throw new IllegalStateException(configurers.size() + " implementations of " +
               "CachingConfigurer were found when only 1 was expected. " +
               "Refactor the configuration such that CachingConfigurer is " +
               "implemented only once or not at all.");
      }
      CachingConfigurer configurer = configurers.iterator().next();
      useCachingConfigurer(configurer);
   }
   /**
    * Extract the configuration from the nominated {@link CachingConfigurer}.
    */
   protected void useCachingConfigurer(CachingConfigurer config) {
      this.cacheManager = config.cacheManager();
      this.cacheResolver = config.cacheResolver();
      this.keyGenerator = config.keyGenerator();
      this.errorHandler = config.errorHandler();
   }
}
```

AbstractCachingConfiguration有一个@Autowired方法会从容器中选出一个唯一的CachingConfigurer来获取缓存需要的配置包括：CacheManager、CacheResolver、KeyGenerator、CacheErrorHandler。

#### 1.2.1、AnnotationCacheOperationSource

CacheOperationSource接口的实现，用于处理注释格式的缓存元数据。该类读取Spring的@Cacheable，@CachePut和@CacheEvict注释，并将相应的缓存操作定义公开给Spring的缓存基础结构。 此类还可以作为自定义CacheOperationSource的基类。

CacheOperationSource接口定义了根据调用方法和类返回一个CacheOperation集合，CacheOperation中每个属性与@Cacheable、@CachePut、@CacheEvict中的属性对应，供CacheInterceptor调用。

```java
public interface BasicOperation {
   Set<String> getCacheNames();
}
public abstract class CacheOperation implements BasicOperation {
   private final String name;
   private final Set<String> cacheNames;
   private final String key;
   private final String keyGenerator;
   private final String cacheManager;
   private final String cacheResolver;
   private final String condition;
}
```

AbstractFallbackCacheOperationSource给出了CacheOperationSource接口基本实现。

```java
@Override
@Nullable
//确定这个方法调用的缓存属性
public Collection<CacheOperation> getCacheOperations(Method method, @Nullable Class<?> targetClass) {
   if (method.getDeclaringClass() == Object.class) {
      return null;
   }
   Object cacheKey = getCacheKey(method, targetClass);
   Collection<CacheOperation> cached = this.attributeCache.get(cacheKey);
   if (cached != null) {
      return (cached != NULL_CACHING_ATTRIBUTE ? cached : null);
   }
   else {
      Collection<CacheOperation> cacheOps = computeCacheOperations(method, targetClass);
      if (cacheOps != null) {
         if (logger.isTraceEnabled()) {
            logger.trace("Adding cacheable method '" + method.getName() + "' with attribute: " + cacheOps);
         }
         this.attributeCache.put(cacheKey, cacheOps);
      }
      else {
         this.attributeCache.put(cacheKey, NULL_CACHING_ATTRIBUTE);
      }
      return cacheOps;
   }
}
@Nullable
private Collection<CacheOperation> computeCacheOperations(Method method, @Nullable Class<?> targetClass) {
   // Don't allow no-public methods as required.
   if (allowPublicMethodsOnly() && !Modifier.isPublic(method.getModifiers())) {
      return null;
   }
   // The method may be on an interface, but we need attributes from the target class.
   // If the target class is null, the method will be unchanged.
   Method specificMethod = AopUtils.getMostSpecificMethod(method, targetClass);
   // First try is the method in the target class.
   Collection<CacheOperation> opDef = findCacheOperations(specificMethod);
   if (opDef != null) {
      return opDef;
   }
   // Second try is the caching operation on the target class.
   opDef = findCacheOperations(specificMethod.getDeclaringClass());
   if (opDef != null && ClassUtils.isUserLevelMethod(method)) {
      return opDef;
   }
   if (specificMethod != method) {
      // Fallback is to look at the original method.
      opDef = findCacheOperations(method);
      if (opDef != null) {
         return opDef;
      }
      // Last fallback is the class of the original method.
      opDef = findCacheOperations(method.getDeclaringClass());
      if (opDef != null && ClassUtils.isUserLevelMethod(method)) {
         return opDef;
      }
   }
   return null;
}
```

computeCacheOperations()方法用来获取当前执行方法的缓存属性，获取的顺序为：实现类上的的方法，不存在则读取类上的属性，不存在在读取接口级别的方法，不存在在读取接口类上的，其中有一个读取到则不继续向后读取了。读取方法和类上的方法是抽象的，由子类实现。

下面来看AnnotationCacheOperationSource的实现。

```java
public class AnnotationCacheOperationSource extends AbstractFallbackCacheOperationSource implements Serializable {
   //缓存仅对public方法生效
   private final boolean publicMethodsOnly;
   private final Set<CacheAnnotationParser> annotationParsers;
   public AnnotationCacheOperationSource() {
      this(true);
   }
   public AnnotationCacheOperationSource(boolean publicMethodsOnly) {
      this.publicMethodsOnly = publicMethodsOnly;
      this.annotationParsers = Collections.singleton(new SpringCacheAnnotationParser());
   }
}
```

在AnnotationCacheOperationSource构造函数阶段会实例化一个CacheAnnotationParser，默认是SpringCacheAnnotationParser，CacheAnnotationParser有两个方法分别用于解析方法和类级别上地缓存注解。

```java
public interface CacheAnnotationParser {
   @Nullable
   Collection<CacheOperation> parseCacheAnnotations(Class<?> type);
   @Nullable
   Collection<CacheOperation> parseCacheAnnotations(Method method);
}
```

而findCacheOperations方法内部就是靠着这个SpringCacheAnnotationParser解析缓存注解属性的。

```java
@Override
@Nullable
protected Collection<CacheOperation> findCacheOperations(Class<?> clazz) {
   return determineCacheOperations(parser -> parser.parseCacheAnnotations(clazz));
}
@Override
@Nullable
protected Collection<CacheOperation> findCacheOperations(Method method) {
   return determineCacheOperations(parser -> parser.parseCacheAnnotations(method));
}
@Nullable
protected Collection<CacheOperation> determineCacheOperations(CacheOperationProvider provider) {
   Collection<CacheOperation> ops = null;
   for (CacheAnnotationParser annotationParser : this.annotationParsers) {
      Collection<CacheOperation> annOps = provider.getCacheOperations(annotationParser);
      if (annOps != null) {
         if (ops == null) {
            ops = annOps;
         }
         else {
            Collection<CacheOperation> combined = new ArrayList<>(ops.size() + annOps.size());
            combined.addAll(ops);
            combined.addAll(annOps);
            ops = combined;
         }
      }
   }
   return ops;
}
```

SpringCacheAnnotationParser的解析原理就是读取Class和Method上的所有缓存注解封装成CacheOperation集合返回，并且会根据类上@CacheConfig注解用来初始化CacheOperation。下面来看下解析方法上的缓存注解实现：

```java
static {
   CACHE_OPERATION_ANNOTATIONS.add(Cacheable.class);
   CACHE_OPERATION_ANNOTATIONS.add(CacheEvict.class);
   CACHE_OPERATION_ANNOTATIONS.add(CachePut.class);
   CACHE_OPERATION_ANNOTATIONS.add(Caching.class);
}
@Override
@Nullable
public Collection<CacheOperation> parseCacheAnnotations(Method method) {
   // 读取@CacheConfig的属性进行封装
   DefaultCacheConfig defaultConfig = new DefaultCacheConfig(method.getDeclaringClass());
   return parseCacheAnnotations(defaultConfig, method);
}
@Nullable
private Collection<CacheOperation> parseCacheAnnotations(DefaultCacheConfig cachingConfig, AnnotatedElement ae) {
   // 首先在整个类的层次结构上查找
   Collection<CacheOperation> ops = parseCacheAnnotations(cachingConfig, ae, false);
   // 如果有超过一个则在被注解类上查找，找到就用否则还是用上面的ops，目的是为了做到如果子类覆盖父类以子类为准
   if (ops != null && ops.size() > 1) {
      // More than one operation found -> local declarations override interface-declared ones...
      Collection<CacheOperation> localOps = parseCacheAnnotations(cachingConfig, ae, true);
      if (localOps != null) {
         return localOps;
      }
   }
   return ops;
}
@Nullable
private Collection<CacheOperation> parseCacheAnnotations(
      DefaultCacheConfig cachingConfig, AnnotatedElement ae, boolean localOnly) {
   //仅限于搜索AnnotatedElement上存在的注解（即本地声明或继承）或在AnnotatedElement上方的注解层次结构中声明的注解
   Collection<? extends Annotation> anns = (localOnly ?
         AnnotatedElementUtils.getAllMergedAnnotations(ae, CACHE_OPERATION_ANNOTATIONS) :
         //更加详尽，提供了语义加上对以下内容的支持：
         //如果带注解的元素是类，则在接口上搜索
         //如果带注解的元素是类，则在超类上搜索
         //解析桥接方法，如果带注解的元素是方法
         //如果带注解的元素是方法，则在接口中搜索方法
         //如果带注解的元素是方法，则在超类中搜索方法
         AnnotatedElementUtils.findAllMergedAnnotations(ae, CACHE_OPERATION_ANNOTATIONS));
   if (anns.isEmpty()) {
      return null;
   }
   final Collection<CacheOperation> ops = new ArrayList<>(1);
   anns.stream().filter(ann -> ann instanceof Cacheable).forEach(
         ann -> ops.add(parseCacheableAnnotation(ae, cachingConfig, (Cacheable) ann)));
   anns.stream().filter(ann -> ann instanceof CacheEvict).forEach(
         ann -> ops.add(parseEvictAnnotation(ae, cachingConfig, (CacheEvict) ann)));
   anns.stream().filter(ann -> ann instanceof CachePut).forEach(
         ann -> ops.add(parsePutAnnotation(ae, cachingConfig, (CachePut) ann)));
   anns.stream().filter(ann -> ann instanceof Caching).forEach(
         ann -> parseCachingAnnotation(ae, cachingConfig, (Caching) ann, ops));
   return ops;
}
private CacheableOperation parseCacheableAnnotation(
      AnnotatedElement ae, DefaultCacheConfig defaultConfig, Cacheable cacheable) {
   CacheableOperation.Builder builder = new CacheableOperation.Builder();
   builder.setName(ae.toString());
   builder.setCacheNames(cacheable.cacheNames());
   builder.setCondition(cacheable.condition());
   builder.setUnless(cacheable.unless());
   builder.setKey(cacheable.key());
   builder.setKeyGenerator(cacheable.keyGenerator());
   builder.setCacheManager(cacheable.cacheManager());
   builder.setCacheResolver(cacheable.cacheResolver());
   builder.setSync(cacheable.sync());
   defaultConfig.applyDefault(builder);
   CacheableOperation op = builder.build();
   validateCacheOperation(ae, op);
   return op;
}
```

#### 1.2.2、CacheInterceptor

CacheInterceptor就是代理对象应用通知，cacheInterceptor()方法中，使用CacheInterceptor的无惨构造方法实例化了一个对象，然后使用一系列setter方法进行配置，而这些配置项则是继承ProxyCachingConfiguration父类AbstractCachingConfiguration的。前面已经分析过了。

在AbstractCacheInvoker中默认会使用一个SimpleCacheErrorHandler，当对缓存操作发成错误的时候使用这个CacheErrorHandler处理，SimpleCacheErrorHandler的实现为把该错误继续抛出。另外又定义了4个doXXX()方法，分别为缓存的获取，缓存的添加，缓存的淘汰，缓存的清除。

```java
@Nullable
protected Cache.ValueWrapper doGet(Cache cache, Object key) {
   try {
      return cache.get(key);
   }
   catch (RuntimeException ex) {
      getErrorHandler().handleCacheGetError(ex, cache, key);
      return null;  // If the exception is handled, return a cache miss
   }
}
protected void doPut(Cache cache, Object key, @Nullable Object result) {
   try {
      cache.put(key, result);
   }
   catch (RuntimeException ex) {
      getErrorHandler().handleCachePutError(ex, cache, key, result);
   }
}
protected void doEvict(Cache cache, Object key) {
   try {
      cache.evict(key);
   }
   catch (RuntimeException ex) {
      getErrorHandler().handleCacheEvictError(ex, cache, key);
   }
}
protected void doClear(Cache cache) {
   try {
      cache.clear();
   }
   catch (RuntimeException ex) {
      getErrorHandler().handleCacheClearError(ex, cache);
   }
}
```

CacheAspectSupport提供缓存相关的基础配置，在configure()方法中即使我们的参数为null也会提供默认的参数。

```java
public void configure(
      @Nullable Supplier<CacheErrorHandler> errorHandler, @Nullable Supplier<KeyGenerator> keyGenerator,
      @Nullable Supplier<CacheResolver> cacheResolver, @Nullable Supplier<CacheManager> cacheManager) {
   this.errorHandler = new SingletonSupplier<>(errorHandler, SimpleCacheErrorHandler::new);
   this.keyGenerator = new SingletonSupplier<>(keyGenerator, SimpleKeyGenerator::new);
   //这个默认还是null
   this.cacheResolver = new SingletonSupplier<>(cacheResolver,
         () -> SimpleCacheResolver.of(SupplierUtils.resolve(cacheManager)));
}
```

另外在SmartInitializingSingleton接口方法afterSingletonsInstantiated()被调用的时候，如果没有CacheResolver则从容器中取得一个CacheManager包装成SimpleCacheResolver，没有则报错。

```java
@Override
public void afterSingletonsInstantiated() {
   if (getCacheResolver() == null) {
      // Lazily initialize cache resolver via default cache manager...
      Assert.state(this.beanFactory != null, "CacheResolver or BeanFactory must be set on cache aspect");
      try {
         setCacheManager(this.beanFactory.getBean(CacheManager.class));
      }
      catch (NoUniqueBeanDefinitionException ex) {
         throw new IllegalStateException("No CacheResolver specified, and no unique bean of type " +
               "CacheManager found. Mark one as primary or declare a specific CacheManager to use.");
      }
      catch (NoSuchBeanDefinitionException ex) {
         throw new IllegalStateException("No CacheResolver specified, and no bean of type CacheManager found. " +
               "Register a CacheManager bean or remove the @EnableCaching annotation from your configuration.");
      }
   }
   this.initialized = true;
}
```

CacheAspectSupport还有一个重要方法execute()，这个方法用来操作缓存的具体行为，也是CacheInterceptor的通知器的拦截方法。

```java
public class CacheInterceptor extends CacheAspectSupport implements MethodInterceptor, Serializable {
   @Override
   @Nullable
   public Object invoke(final MethodInvocation invocation) throws Throwable {
      Method method = invocation.getMethod();
      CacheOperationInvoker aopAllianceInvoker = () -> {
         try {
            return invocation.proceed();
         }
         catch (Throwable ex) {
            throw new CacheOperationInvoker.ThrowableWrapper(ex);
         }
      };
      try {
         return execute(aopAllianceInvoker, invocation.getThis(), method, invocation.getArguments());
      }
      catch (CacheOperationInvoker.ThrowableWrapper th) {
         throw th.getOriginal();
      }
   }
}
```

```java
@Nullable
protected Object execute(CacheOperationInvoker invoker, Object target, Method method, Object[] args) {
   // Check whether aspect is enabled (to cope with cases where the AJ is pulled in automatically)
   //容器没加载完则先不使用缓存
   if (this.initialized) {
      Class<?> targetClass = getTargetClass(target);
      //首先取得配置的AnnotationCacheOperationSource
      CacheOperationSource cacheOperationSource = getCacheOperationSource();
      if (cacheOperationSource != null) {
         //使用cacheOperationSource来获取方法上的缓存属性信息
         Collection<CacheOperation> operations = cacheOperationSource.getCacheOperations(method, targetClass);
         if (!CollectionUtils.isEmpty(operations)) {
            //将operations, method, args, target, targetClass包装成一个CacheOperationContexts调用另一个execute重载方法
            return execute(invoker, method,
                  new CacheOperationContexts(operations, method, args, target, targetClass));
         }
      }
   }
   return invoker.invoke();
}
```

将方法上的所有缓存注解封装到一个CacheOperationContexts的contexts属性中，是一个MultiValueMap, CacheOperationContext>结构，key就是具体的CacheOperation，value是CacheOperationContext的集合，因为一个方法上可能有多个相同类型的CacheOperation注解。下面是生成CacheOperationContext的代码：

```java
public CacheOperationContexts(Collection<? extends CacheOperation> operations, Method method,
      Object[] args, Object target, Class<?> targetClass) {
   this.contexts = new LinkedMultiValueMap<>(operations.size());
   for (CacheOperation op : operations) {
      // 一个CacheOperation对应一个OperationContext
      this.contexts.add(op.getClass(), getOperationContext(op, method, args, target, targetClass));
   }
   // 是否是缓存同步方法@Cacheable(sync=true)，不能与其他注解共同存在
   this.sync = determineSyncFlag(method);
}
protected CacheOperationContext getOperationContext(
      CacheOperation operation, Method method, Object[] args, Object target, Class<?> targetClass) {
   CacheOperationMetadata metadata = getCacheOperationMetadata(operation, method, targetClass);
   return new CacheOperationContext(metadata, args, target);
}
// 返回当前注解的元数据CacheOperationMetadata
protected CacheOperationMetadata getCacheOperationMetadata(
      CacheOperation operation, Method method, Class<?> targetClass) {
   CacheOperationCacheKey cacheKey = new CacheOperationCacheKey(operation, method, targetClass);
   CacheOperationMetadata metadata = this.metadataCache.get(cacheKey);
   if (metadata == null) {
      KeyGenerator operationKeyGenerator;
      //如果没有给注解单独配置一下属性，则使用CacheAspectSupport的默认配置属性
      if (StringUtils.hasText(operation.getKeyGenerator())) {
         operationKeyGenerator = getBean(operation.getKeyGenerator(), KeyGenerator.class);
      }
      else {
         operationKeyGenerator = getKeyGenerator();
      }
      CacheResolver operationCacheResolver;
      if (StringUtils.hasText(operation.getCacheResolver())) {
         operationCacheResolver = getBean(operation.getCacheResolver(), CacheResolver.class);
      }
      else if (StringUtils.hasText(operation.getCacheManager())) {
         CacheManager cacheManager = getBean(operation.getCacheManager(), CacheManager.class);
         operationCacheResolver = new SimpleCacheResolver(cacheManager);
      }
      else {
         operationCacheResolver = getCacheResolver();
         Assert.state(operationCacheResolver != null, "No CacheResolver/CacheManager set");
      }
      metadata = new CacheOperationMetadata(operation, method, targetClass,
            operationKeyGenerator, operationCacheResolver);
      this.metadataCache.put(cacheKey, metadata);
   }
   return metadata;
}
```

CacheOperationContext内部还有一个重要的属性Collection caches，Cache是一个接口定义了缓存的常用操作，这个属性时在构造函数内被计算出来的。

```java
public interface Cache {
   String getName();
   Object getNativeCache();
   @Nullable
   ValueWrapper get(Object key);
   @Nullable
   <T> T get(Object key, @Nullable Class<T> type);
   @Nullable
   <T> T get(Object key, Callable<T> valueLoader);
   void put(Object key, @Nullable Object value);
   @Nullable
   ValueWrapper putIfAbsent(Object key, @Nullable Object value);
   void evict(Object key);
   void clear();
}
```

```java
public CacheOperationContext(CacheOperationMetadata metadata, Object[] args, Object target) {
   this.metadata = metadata;
   this.args = extractArgs(metadata.method, args);
   this.target = target;
   this.caches = CacheAspectSupport.this.getCaches(this, metadata.cacheResolver);
   this.cacheNames = createCacheNames(this.caches);
}
```

caches属性是调用CacheAspectSupport实现类的方法getCaches()方法返回的。

```java
protected Collection<? extends Cache> getCaches(
      CacheOperationInvocationContext<CacheOperation> context, CacheResolver cacheResolver) {
   Collection<? extends Cache> caches = cacheResolver.resolveCaches(context);
   if (caches.isEmpty()) {
      throw new IllegalStateException("No cache could be resolved for '" +
            context.getOperation() + "' using resolver '" + cacheResolver +
            "'. At least one cache should be provided per cache operation.");
   }
   return caches;
}
```

如果在缓存注解上或通过CachingConfigurer没有设置默认CacheResolver但是设置了CacheManager的话，Spring则会使用SimpleCacheResolver包装此CacheManager，所以这里以SimpleCacheResolver的resolveCaches()实现来分析此方法。SimpleCacheResolver继承了AbstractCacheResolver，resolveCaches()方法定义在了AbstractCacheResolver中。

```java
@Override
public Collection<? extends Cache> resolveCaches(CacheOperationInvocationContext<?> context) {
   Collection<String> cacheNames = getCacheNames(context);
   if (cacheNames == null) {
      return Collections.emptyList();
   }
   Collection<Cache> result = new ArrayList<>(cacheNames.size());
   for (String cacheName : cacheNames) {
      Cache cache = getCacheManager().getCache(cacheName);
      if (cache == null) {
         throw new IllegalArgumentException("Cannot find cache named '" +
               cacheName + "' for " + context.getOperation());
      }
      result.add(cache);
   }
   return result;
}
```

首先调用getCacheNames()方法获取一组缓存的名臣，然后使用CacheManager取得缓存名对应的缓存实例，getCacheNames()是抽象的这里还是以SimpleCacheResolver为例。

```java
@Override
protected Collection<String> getCacheNames(CacheOperationInvocationContext<?> context) {
   //缓存注解的cacheNames属性
   return context.getOperation().getCacheNames();
}
```

下面来分析private Object execute(final CacheOperationInvoker invoker, Method method, CacheOperationContexts contexts)。

```java
@Nullable
private Object execute(final CacheOperationInvoker invoker, Method method, CacheOperationContexts contexts) {
   // Special handling of synchronized invocation
   if (contexts.isSynchronized()) {
      CacheOperationContext context = contexts.get(CacheableOperation.class).iterator().next();
      //使用CacheOperationExpressionEvaluator解析缓存注解condition属性，true代表生效
      if (isConditionPassing(context, CacheOperationExpressionEvaluator.NO_RESULT)) {
         //两种情况：一是用户定义的spel如#user.id,否则使用keyGenerator生成的缓存key
         Object key = generateKey(context, CacheOperationExpressionEvaluator.NO_RESULT);
         //同步缓存只能有一个@Cacheable
         Cache cache = context.getCaches().iterator().next();
         try {
            //使用从CacheManager中根据cacheName取得的Cache对象调用器get()方法返回缓存数据
            return wrapCacheValue(method, cache.get(key, () -> unwrapReturnValue(invokeOperation(invoker))));
         }
         catch (Cache.ValueRetrievalException ex) {
            // The invoker wraps any Throwable in a ThrowableWrapper instance so we
            // can just make sure that one bubbles up the stack.
            throw (CacheOperationInvoker.ThrowableWrapper) ex.getCause();
         }
      }
      else {
         // No caching required, only call the underlying method
         return invokeOperation(invoker);
      }
   }
   // beforeInvocation=true，根据@CacheEvict的allEntries决定清除整个缓存还是单个key，默认key
   processCacheEvicts(contexts.get(CacheEvictOperation.class), true,
         CacheOperationExpressionEvaluator.NO_RESULT);
   // 查找缓存
   Cache.ValueWrapper cacheHit = findCachedItem(contexts.get(CacheableOperation.class));
   // 如果没有找到缓存项，则把@Cacheable也当做CachePutRequest
   List<CachePutRequest> cachePutRequests = new LinkedList<>();
   if (cacheHit == null) {
      collectPutRequests(contexts.get(CacheableOperation.class),
            CacheOperationExpressionEvaluator.NO_RESULT, cachePutRequests);
   }
   Object cacheValue;
   Object returnValue;
   // 命中缓存且没有有效的@CachePut
   if (cacheHit != null && !hasCachePut(contexts)) {
      // If there are no put requests, just use the cache hit
      cacheValue = cacheHit.get();
      returnValue = wrapCacheValue(method, cacheValue);
   }
   else {
      // 执行目标对象方法取得返回值
      returnValue = invokeOperation(invoker);
      cacheValue = unwrapReturnValue(returnValue);
   }
   // 收集显示标记的@CachePut
   collectPutRequests(contexts.get(CachePutOperation.class), cacheValue, cachePutRequests);
   // 处理任何收集的put请求，来自@CachePut或@Cacheable miss
   for (CachePutRequest cachePutRequest : cachePutRequests) {
      cachePutRequest.apply(cacheValue);
   }
   // beforeInvocation=false
   processCacheEvicts(contexts.get(CacheEvictOperation.class), false, cacheValue);
   return returnValue;
}
```

上面代码的开头做了一个同步判断，如果缓存是同步的，则使用了Cache对象下面这个get()方法，此方法表示为如果缓存中存在该key指定的缓存则返回，否则从valueLoader获取一个数据放入缓存然后返回，valueLoader的过程要求是同步的。所有这里以ConcurrentMapCacheManager返回的ConcurrentMapCache为例，看看如何保证这个过程是同步的。

```java
@Override
@Nullable
public <T> T get(Object key, Callable<T> valueLoader) {
   //store是一个ConcurrentMap，它的computeIfAbsent操作可以保证并发情况的一致性
   return (T) fromStoreValue(this.store.computeIfAbsent(key, r -> {
      try {
         return toStoreValue(valueLoader.call());
      }
      catch (Throwable ex) {
         throw new ValueRetrievalException(key, valueLoader, ex);
      }
   }));
}
```

如果不是同步缓存，则按顺序执行下面操作：

先淘汰缓存@CacheEvict(beforeInvocation=true)的缓存。

```java
private void processCacheEvicts(
      Collection<CacheOperationContext> contexts, boolean beforeInvocation, @Nullable Object result) {
   for (CacheOperationContext context : contexts) {
      CacheEvictOperation operation = (CacheEvictOperation) context.metadata.operation;
      //先淘汰后缓存
      if (beforeInvocation == operation.isBeforeInvocation() && isConditionPassing(context, result)) {
         performCacheEvict(context, operation, result);
      }
   }
}
private void performCacheEvict(
      CacheOperationContext context, CacheEvictOperation operation, @Nullable Object result) {
   Object key = null;
   for (Cache cache : context.getCaches()) {
      if (operation.isCacheWide()) {
         logInvalidating(context, operation, null);
         doClear(cache);
      }
      else {
         if (key == null) {
            key = generateKey(context, result);
         }
         logInvalidating(context, operation, key);
         //父类方法 默认cache.evict(key);
         doEvict(cache, key);
      }
   }
}
private void logInvalidating(CacheOperationContext context, CacheEvictOperation operation, @Nullable Object key) {
   if (logger.isTraceEnabled()) {
      logger.trace("Invalidating " + (key != null ? "cache key [" + key + "]" : "entire cache") +
            " for operation " + operation + " on method " + context.metadata.method);
   }
}
```

检查是否有一个缓存项匹配的条件。

```java
@Nullable
private Cache.ValueWrapper findCachedItem(Collection<CacheOperationContext> contexts) {
   Object result = CacheOperationExpressionEvaluator.NO_RESULT;
   for (CacheOperationContext context : contexts) {
      if (isConditionPassing(context, result)) {
         Object key = generateKey(context, result);
         Cache.ValueWrapper cached = findInCaches(context, key);
         if (cached != null) {
            return cached;
         }
         else {
            if (logger.isTraceEnabled()) {
               logger.trace("No cache entry for key '" + key + "' in cache(s) " + context.getCacheNames());
            }
         }
      }
   }
   return null;
}
@Nullable
private Cache.ValueWrapper findInCaches(CacheOperationContext context, Object key) {
   for (Cache cache : context.getCaches()) {
      Cache.ValueWrapper wrapper = doGet(cache, key);
      if (wrapper != null) {
         if (logger.isTraceEnabled()) {
            logger.trace("Cache entry for key '" + key + "' found in cache '" + cache.getName() + "'");
         }
         return wrapper;
      }
   }
   return null;
}
```

如果@Cacheable未命中缓存，收集起来准备放入缓存，将未命中的缓存封装成CachePutRequest。

```java
private void collectPutRequests(Collection<CacheOperationContext> contexts,
      @Nullable Object result, Collection<CachePutRequest> putRequests) {
   for (CacheOperationContext context : contexts) {
      if (isConditionPassing(context, result)) {
         Object key = generateKey(context, result);
         putRequests.add(new CachePutRequest(context, key));
      }
   }
}
```

如果命中缓存并且没有@CachePut无需更新缓存，直接使用缓存数据，否则需要调用原始对象方法获取数据。

```java
if (cacheHit != null && !hasCachePut(contexts)) {
   // If there are no put requests, just use the cache hit
   cacheValue = cacheHit.get();
   returnValue = wrapCacheValue(method, cacheValue);
}
else {
   // Invoke the method if we don't have a cache hit
   returnValue = invokeOperation(invoker);
   cacheValue = unwrapReturnValue(returnValue);
}
```

然后收集@CachePut与之前未命中缓存的@Cacheable合并后将最新数据一起放入缓存。

```java
public void apply(@Nullable Object result) {
   if (this.context.canPutToCache(result)) {
      for (Cache cache : this.context.getCaches()) {
         doPut(cache, this.key, result);
      }
   }
}
protected boolean canPutToCache(@Nullable Object value) {
   String unless = "";
   if (this.metadata.operation instanceof CacheableOperation) {
      unless = ((CacheableOperation) this.metadata.operation).getUnless();
   }
   else if (this.metadata.operation instanceof CachePutOperation) {
      unless = ((CachePutOperation) this.metadata.operation).getUnless();
   }
   if (StringUtils.hasText(unless)) {
      EvaluationContext evaluationContext = createEvaluationContext(value);
      return !evaluator.unless(unless, this.metadata.methodKey, evaluationContext);
   }
   return true;
}
```

最后在淘汰@CacheEvict(beforeInvocation=true)的缓存。

```java
processCacheEvicts(contexts.get(CacheEvictOperation.class), false, cacheValue);
```

以上就是BeanFactoryCacheOperationSourceAdvisor需要的两个重要组件的主要内容都讲解完了，接下来看看BeanFactoryCacheOperationSourceAdvisor的另一个主要组件CacheOperationSourcePointcut。

```java
public class BeanFactoryCacheOperationSourceAdvisor extends AbstractBeanFactoryPointcutAdvisor {
   @Nullable
   private CacheOperationSource cacheOperationSource;
   private final CacheOperationSourcePointcut pointcut = new CacheOperationSourcePointcut() {
      @Override
      @Nullable
      protected CacheOperationSource getCacheOperationSource() {
         return cacheOperationSource;
      }
   };
   public void setCacheOperationSource(CacheOperationSource cacheOperationSource) {
      this.cacheOperationSource = cacheOperationSource;
   }
   public void setClassFilter(ClassFilter classFilter) {
      this.pointcut.setClassFilter(classFilter);
   }
   @Override
   public Pointcut getPointcut() {
      return this.pointcut;
   }
}
```

BeanFactoryCacheOperationSourceAdvisor的pointcut实现是一个匿名内部类重写了CacheOperationSourcePointcut的getCacheOperationSource()方法，而这个方法就是ProxyCachingConfiguration中的cacheOperationSource。

```java
abstract class CacheOperationSourcePointcut extends StaticMethodMatcherPointcut implements Serializable {
   @Override
   public boolean matches(Method method, Class<?> targetClass) {
      if (CacheManager.class.isAssignableFrom(targetClass)) {
         return false;
      }
      CacheOperationSource cas = getCacheOperationSource();
      return (cas != null && !CollectionUtils.isEmpty(cas.getCacheOperations(method, targetClass)));
   }
}
```

CacheOperationSourcePointcut继承了StaticMethodMatcherPointcut因此classFilter是ClassFilter.TRUE，主要是靠matches()方法匹配连接点的。

```java
@Override
public boolean matches(Method method, Class<?> targetClass) {
   //缓存管理器的方法不需要使用Spring缓存
   if (CacheManager.class.isAssignableFrom(targetClass)) {
      return false;
   }
   CacheOperationSource cas = getCacheOperationSource();
   //getCacheOperations()方法前面已经看过了，取得目标类上传入方法的所有缓存注解，也就是说会拦截带有Spring缓存注解的方法。
   return (cas != null && !CollectionUtils.isEmpty(cas.getCacheOperations(method, targetClass)));
}
```

### 1.3、必要组件之三：BeanFactoryJCacheOperationSourceAdvisor

CachingConfigurationSelector在PROXY模式下，导入的第三个类是org.springframework.cache.jcache.config.ProxyJCacheConfiguration，这个类中会向容器中注册一个BeanFactoryJCacheOperationSourceAdvisor，这个通知器的作用与BeanFactoryCacheOperationSourceAdvisor类似，都是为了加入缓存代理功能的，不同的是BeanFactoryCacheOperationSourceAdvisor是为Spring的缓存注解做类的代理而BeanFactoryJCacheOperationSourceAdvisor是为JCache(@CacheResult, @CachePut,@lCacheRemove,@CacheRemoveAll)注解类做代理。其底层原理类似不在解析。

下表描述了Spring Cache注释和JSR-107(JCache)注释之间的主要区别:

Spring
JSR-107
备注

`@Cacheable`

`@CacheResult`

相当类似。@CacheResult可以缓存特定的异常，并强制执行方法，而不管缓存的内容是什么。

`@CachePut`

`@CachePut`

当Spring使用方法调用的结果更新缓存时，JCache需要将其作为参数传递给@CacheValue。由于这种差异，JCache允许在实际方法调用之前或之后更新缓存。

`@CacheEvict`

`@CacheRemove`

相当类似。@CacheRemove在方法调用时支持根据条件来淘汰缓存。

`@CacheEvict(allEntries=true)`

`@CacheRemoveAll`

参考`@CacheRemove`.

`@CacheConfig`

`@CacheDefaults`

允许以类似的方式配置相同的缓存属性。
