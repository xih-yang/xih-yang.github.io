# 24、Spring源码分析 - 24-基于注解@Aspect的AOP实现
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/24.html
- 分类：J2EE框架
- 分组：教程目录
## 1、AnnotationAwareAspectJAutoProxyCreator注册过程

Spring应用如果想开启基于注解形式的AOP代理，只需要在@Configuration类上加入@EnableAspectJAutoProxy，因为EnableAspectJAutoProxy上有@Import(AspectJAutoProxyRegistrar.class)，就可以在bean加载阶段调用AspectJAutoProxyRegistrar.registerBeanDefinitions()方法，具体原理请看[《ConfigurationClassPostProcessor原理》](/zhuanlan/j2ee/spring/7/19.html)。

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AspectJAutoProxyRegistrar.class)
public @interface EnableAspectJAutoProxy {
   /**
    * Indicate whether subclass-based (CGLIB) proxies are to be created as opposed
    * to standard Java interface-based proxies. The default is {@code false}.
    */
   boolean proxyTargetClass() default false;
   /**
    * Indicate that the proxy should be exposed by the AOP framework as a {@code ThreadLocal}
    * for retrieval via the {@link org.springframework.aop.framework.AopContext} class.
    * Off by default, i.e. no guarantees that {@code AopContext} access will work.
    * @since 4.3.1
    */
   boolean exposeProxy() default false;
}
```

AspectJAutoProxyRegistrar.registerBeanDefinitions()方法内部会注册一个bean name为org.springframework.aop.config.internalAutoProxyCreator的AnnotationAwareAspectJAutoProxyCreator用于解析@Aspect。

```java
class AspectJAutoProxyRegistrar implements ImportBeanDefinitionRegistrar {
   /**
    * Register, escalate, and configure the AspectJ auto proxy creator based on the value
    * of the @{@link EnableAspectJAutoProxy#proxyTargetClass()} attribute on the importing
    * {@code @Configuration} class.
    */
   @Override
   public void registerBeanDefinitions(
         AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
      //注册bean name为org.springframework.aop.config.internalAutoProxyCreator的AnnotationAwareAspectJAutoProxyCreator
      AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(registry);
      AnnotationAttributes enableAspectJAutoProxy =
            AnnotationConfigUtils.attributesFor(importingClassMetadata, EnableAspectJAutoProxy.class);
      if (enableAspectJAutoProxy != null) {
         //如果@EnableAspectJAutoProxy的proxyTargetClass是true代表使用cglib代理目标类
         //会为AnnotationAwareAspectJAutoProxyCreator添加一个属性
         //definition.getPropertyValues().add("proxyTargetClass", Boolean.TRUE);
         if (enableAspectJAutoProxy.getBoolean("proxyTargetClass")) {
            AopConfigUtils.forceAutoProxyCreatorToUseClassProxying(registry);
         }
         //definition.getPropertyValues().add("exposeProxy", Boolean.TRUE);
         if (enableAspectJAutoProxy.getBoolean("exposeProxy")) {
            AopConfigUtils.forceAutoProxyCreatorToExposeProxy(registry);
         }
      }
   }
}
```

## 2、原理

首先看下AnnotationAwareAspectJAutoProxyCreator继承结构。

AnnotationAwareAspectJAutoProxyCreator通过继承AbstractAutoProxyCreator实现了BeanPostProcessor接口，postProcessAfterInitialization()方法会判断当前bean是否可以当做代理对象，如果可以则使用代理对象替换原来的bean。

```java
@Override
public Object postProcessAfterInitialization(@Nullable Object bean, String beanName) {
   if (bean != null) {
      //bean name或class
      Object cacheKey = getCacheKey(bean.getClass(), beanName);
      if (!this.earlyProxyReferences.contains(cacheKey)) {
         //bean符合代理对象的条件则包装成代理对象返回
         return wrapIfNecessary(bean, beanName, cacheKey);
      }
   }
   return bean;
}
//bean符合代理对象的条件则包装成代理对象返回
protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {
   if (StringUtils.hasLength(beanName) && this.targetSourcedBeans.contains(beanName)) {
      return bean;
   }
   //不符合代理对象的也会缓存，避免重复调用此方法重新计算
   if (Boolean.FALSE.equals(this.advisedBeans.get(cacheKey))) {
      return bean;
   }
   //此方法是protected，判断bean是否可以作为拦截器，拦截器不需要被代理，
   //是否是Advice、Pointcut、Advisor、AopInfrastructureBean之一，
   //AnnotationAwareAspectJAutoProxyCreator实现的具体行为还包括类有@Aspect注解并且不是被Ajc编译的
   if (isInfrastructureClass(bean.getClass()) || shouldSkip(bean.getClass(), beanName)) {
      this.advisedBeans.put(cacheKey, Boolean.FALSE);
      return bean;
   }
   // Create proxy if we have advice.
   //取得用户定义的拦截器
   Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);
   if (specificInterceptors != DO_NOT_PROXY) {
      this.advisedBeans.put(cacheKey, Boolean.TRUE);
      //使用ProxyFactory创建代理对象
      Object proxy = createProxy(
            bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));
      this.proxyTypes.put(cacheKey, proxy.getClass());
      return proxy;
   }
   this.advisedBeans.put(cacheKey, Boolean.FALSE);
   return bean;
}
```

上面代码要创建一个代理对象的核心就是要得到我们定义的拦截器， 然后createProxy()方法内部使用ProxyFactory创建代理对象，使用ProxyFactory与[ProxyFactoryBean](/zhuanlan/j2ee/spring/7/22.html)原理相同可以参考[/zhuanlan/j2ee/spring/7/22.html](/zhuanlan/j2ee/spring/7/22.html)。

下面就具体看一下AbstractAdvisorAutoProxyCreator的getAdvicesAndAdvisorsForBean()方法如何取得通知器数组了。

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
//找到所有适合自动代理这个类的通知器
protected List<Advisor> findEligibleAdvisors(Class<?> beanClass, String beanName) {
   //找出容器中所有的通知器
   List<Advisor> candidateAdvisors = findCandidateAdvisors();
   //从所有的通知器中找出可以应用到此bean的通知器
   List<Advisor> eligibleAdvisors = findAdvisorsThatCanApply(candidateAdvisors, beanClass, beanName);
   //在使用AspectJ表达式切入点在通知链的开头添加ExposeInvocationInterceptor
   extendAdvisors(eligibleAdvisors);
   if (!eligibleAdvisors.isEmpty()) {
      eligibleAdvisors = sortAdvisors(eligibleAdvisors);
   }
   return eligibleAdvisors;
}
```

AnnotationAwareAspectJAutoProxyCreator重写了findCandidateAdvisors()方法，首先调用父类AbstractAdvisorAutoProxyCreator的findCandidateAdvisors()方法获得一批通知器，然后使用aspectJAdvisorsBuilder在获得一批通知器。

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

AbstractAdvisorAutoProxyCreator的findCandidateAdvisors()方法内部使用一个BeanFactoryAdvisorRetrievalHelper取得容器内所有的通知器，这个BeanFactoryAdvisorRetrievalHelper是在setBeanFactory()方法被调用的时候实例化的。

```java
@Override
public void setBeanFactory(BeanFactory beanFactory) {
   super.setBeanFactory(beanFactory);
   if (!(beanFactory instanceof ConfigurableListableBeanFactory)) {
      throw new IllegalArgumentException(
            "AdvisorAutoProxyCreator requires a ConfigurableListableBeanFactory: " + beanFactory);
   }
   initBeanFactory((ConfigurableListableBeanFactory) beanFactory);
}
protected void initBeanFactory(ConfigurableListableBeanFactory beanFactory) {
   this.advisorRetrievalHelper = new BeanFactoryAdvisorRetrievalHelperAdapter(beanFactory);
}
protected List<Advisor> findCandidateAdvisors() {
   Assert.state(this.advisorRetrievalHelper != null, "No BeanFactoryAdvisorRetrievalHelper available");
   return this.advisorRetrievalHelper.findAdvisorBeans();
}
```

BeanFactoryAdvisorRetrievalHelperAdapter是AbstractAdvisorAutoProxyCreator的内部类继承了BeanFactoryAdvisorRetrievalHelper拥有了findAdvisorBeans()的能力。

```java
public List<Advisor> findAdvisorBeans() {
   // Determine list of advisor bean names, if not cached already.
   String[] advisorNames = this.cachedAdvisorBeanNames;
   if (advisorNames == null) {
      // Do not initialize FactoryBeans here: We need to leave all regular beans
      // uninitialized to let the auto-proxy creator apply to them!
      advisorNames = BeanFactoryUtils.beanNamesForTypeIncludingAncestors(
            this.beanFactory, Advisor.class, true, false);
      this.cachedAdvisorBeanNames = advisorNames;
   }
   if (advisorNames.length == 0) {
      return new ArrayList<>();
   }
   List<Advisor> advisors = new ArrayList<>();
   //advisorNames是容器中所有Advisor类型的bean name
   for (String name : advisorNames) {
      //直接返回的是true
      if (isEligibleBean(name)) {
         //忽略当前正在创建的bean
         if (this.beanFactory.isCurrentlyInCreation(name)) {
            if (logger.isTraceEnabled()) {
               logger.trace("Skipping currently created advisor '" + name + "'");
            }
         }
         else {
            try {
               advisors.add(this.beanFactory.getBean(name, Advisor.class));
            }
            catch (BeanCreationException ex) {
               Throwable rootCause = ex.getMostSpecificCause();
               if (rootCause instanceof BeanCurrentlyInCreationException) {
                  BeanCreationException bce = (BeanCreationException) rootCause;
                  String bceBeanName = bce.getBeanName();
                  if (bceBeanName != null && this.beanFactory.isCurrentlyInCreation(bceBeanName)) {
                     if (logger.isTraceEnabled()) {
                        logger.trace("Skipping advisor '" + name +
                              "' with dependency on currently created bean: " + ex.getMessage());
                     }
                     // Ignore: indicates a reference back to the bean we're trying to advise.
                     // We want to find advisors other than the currently created bean itself.
                     continue;
                  }
               }
               throw ex;
            }
         }
      }
   }
   return advisors;
}
```

AnnotationAwareAspectJAutoProxyCreator使用父类findCandidateAdvisors()方法获取容器内所有的通知器后，再使用BeanFactoryAspectJAdvisorsBuilder来发掘@Aspect代表的通知器。这个BeanFactoryAspectJAdvisorsBuilder也是在通过调用setFactory()方法的时候实例化的，是AnnotationAwareAspectJAutoProxyCreator的内部类，通过继承BeanFactoryAspectJAdvisorsBuilder拥有了buildAspectJAdvisors()的能力，并重写了isEligibleBean()方法，方法的具体实现是直接调用AnnotationAwareAspectJAutoProxyCreator的isEligibleAspectBean()方法。

```java
@Override
protected void initBeanFactory(ConfigurableListableBeanFactory beanFactory) {
   super.initBeanFactory(beanFactory);
   if (this.aspectJAdvisorFactory == null) {
      this.aspectJAdvisorFactory = new ReflectiveAspectJAdvisorFactory(beanFactory);
   }
   this.aspectJAdvisorsBuilder =
         new BeanFactoryAspectJAdvisorsBuilderAdapter(beanFactory, this.aspectJAdvisorFactory);
}
protected boolean isEligibleAspectBean(String beanName) {
   //默认是null
   if (this.includePatterns == null) {
      return true;
   }
   else {
      //正则过滤
      for (Pattern pattern : this.includePatterns) {
         if (pattern.matcher(beanName).matches()) {
            return true;
         }
      }
      return false;
   }
}
```

```java
//寻找被@Aspect注解的类，返回一个Spring AOP的通知器代表它，
//为这个类的每个通知方法创建一个通知器
public List<Advisor> buildAspectJAdvisors() {
   List<String> aspectNames = this.aspectBeanNames;
   if (aspectNames == null) {
      synchronized (this) {
         aspectNames = this.aspectBeanNames;
         if (aspectNames == null) {
            List<Advisor> advisors = new ArrayList<>();
            aspectNames = new ArrayList<>();
            String[] beanNames = BeanFactoryUtils.beanNamesForTypeIncludingAncestors(
                  this.beanFactory, Object.class, true, false);
            for (String beanName : beanNames) {
               //使用正则做一层过滤
               if (!isEligibleBean(beanName)) {
                  continue;
               }
               // We must be careful not to instantiate beans eagerly as in this case they
               // would be cached by the Spring container but would not have been weaved.
               Class<?> beanType = this.beanFactory.getType(beanName);
               if (beanType == null) {
                  continue;
               }
               //判断该bean是否是@Aspect类
               if (this.advisorFactory.isAspect(beanType)) {
                  aspectNames.add(beanName);
                  AspectMetadata amd = new AspectMetadata(beanType, beanName);
                  //@Aspect value默认情况
                  if (amd.getAjType().getPerClause().getKind() == PerClauseKind.SINGLETON) {
                     MetadataAwareAspectInstanceFactory factory =
                           new BeanFactoryAspectInstanceFactory(this.beanFactory, beanName);
                     //
                     List<Advisor> classAdvisors = this.advisorFactory.getAdvisors(factory);
                     if (this.beanFactory.isSingleton(beanName)) {
                        this.advisorsCache.put(beanName, classAdvisors);
                     }
                     else {
                        this.aspectFactoryCache.put(beanName, factory);
                     }
                     advisors.addAll(classAdvisors);
                  }
                  else {
                     // Per target or per this.
                     if (this.beanFactory.isSingleton(beanName)) {
                        throw new IllegalArgumentException("Bean with name '" + beanName +
                              "' is a singleton, but aspect instantiation model is not singleton");
                     }
                     MetadataAwareAspectInstanceFactory factory =
                           new PrototypeAspectInstanceFactory(this.beanFactory, beanName);
                     this.aspectFactoryCache.put(beanName, factory);
                     advisors.addAll(this.advisorFactory.getAdvisors(factory));
                  }
               }
            }
            this.aspectBeanNames = aspectNames;
            return advisors;
         }
      }
   }
   if (aspectNames.isEmpty()) {
      return Collections.emptyList();
   }
   List<Advisor> advisors = new ArrayList<>();
   for (String aspectName : aspectNames) {
      List<Advisor> cachedAdvisors = this.advisorsCache.get(aspectName);
      if (cachedAdvisors != null) {
         advisors.addAll(cachedAdvisors);
      }
      else {
         MetadataAwareAspectInstanceFactory factory = this.aspectFactoryCache.get(aspectName);
         advisors.addAll(this.advisorFactory.getAdvisors(factory));
      }
   }
   return advisors;
}
```

上面的核心方法就是这三行：

```java
MetadataAwareAspectInstanceFactory factory =
      new BeanFactoryAspectInstanceFactory(this.beanFactory, beanName);
List<Advisor> classAdvisors = this.advisorFactory.getAdvisors(factory);
```

BeanFactoryAspectInstanceFactory包含当前的bean name，通过ReflectiveAspectJAdvisorFactory的getAdvisors()方法返回此bean name的@Aspect类代表的所有的Advisor。BeanFactoryAspectInstanceFactory这个类主要用于获取@Aspect类的AspectMetadata对象。

```java
public class AspectMetadata implements Serializable {
   //bean name
   private final String aspectName;
   //bean class
   private final Class<?> aspectClass;
   //AspectJ反射信息，参考AjTypeImpl
   private transient AjType<?> ajType;
   //默认情况@Aspect value=singleton --> Pointcut.TRUE
   private final Pointcut perClausePointcut;
}
```

下面是ReflectiveAspectJAdvisorFactory的getAdvisors()方法。

```java
@Override
public List<Advisor> getAdvisors(MetadataAwareAspectInstanceFactory aspectInstanceFactory) {
   Class<?> aspectClass = aspectInstanceFactory.getAspectMetadata().getAspectClass();
   String aspectName = aspectInstanceFactory.getAspectMetadata().getAspectName();
   //非抽象父类不能是@Aspect类
   validate(aspectClass);
   // We need to wrap the MetadataAwareAspectInstanceFactory with a decorator
   // so that it will only instantiate once.
   MetadataAwareAspectInstanceFactory lazySingletonAspectInstanceFactory =
         new LazySingletonAspectInstanceFactoryDecorator(aspectInstanceFactory);
   List<Advisor> advisors = new ArrayList<>();
   //循环处理没有@Pointcut的方法
   for (Method method : getAdvisorMethods(aspectClass)) {
      Advisor advisor = getAdvisor(method, lazySingletonAspectInstanceFactory, advisors.size(), aspectName);
      if (advisor != null) {
         advisors.add(advisor);
      }
   }
   // If it's a per target aspect, emit the dummy instantiating aspect.
   if (!advisors.isEmpty() && lazySingletonAspectInstanceFactory.getAspectMetadata().isLazilyInstantiated()) {
      Advisor instantiationAdvisor = new SyntheticInstantiationAdvisor(lazySingletonAspectInstanceFactory);
      advisors.add(0, instantiationAdvisor);
   }
   // Find introduction fields.
   for (Field field : aspectClass.getDeclaredFields()) {
      //为切入点引入共同的接口实现，参考
      //https://blog.csdn.net/elim168/article/details/78166296
      Advisor advisor = getDeclareParentsAdvisor(field);
      if (advisor != null) {
         advisors.add(advisor);
      }
   }
   return advisors;
}
//一个非@Pointcut方法对应一个通知器
public Advisor getAdvisor(Method candidateAdviceMethod, MetadataAwareAspectInstanceFactory aspectInstanceFactory,
      int declarationOrderInAspect, String aspectName) {
   validate(aspectInstanceFactory.getAspectMetadata().getAspectClass());
   //@Pointcut, @Around,@Before, @After, @AfterReturning,@AfterThrowing都会对应一个AspectJExpressionPointcut
   AspectJExpressionPointcut expressionPointcut = getPointcut(
         candidateAdviceMethod, aspectInstanceFactory.getAspectMetadata().getAspectClass());
   if (expressionPointcut == null) {
      return null;
   }
   //绑定切入点与通知，通知就是方法
   return new InstantiationModelAwarePointcutAdvisorImpl(expressionPointcut, candidateAdviceMethod,
         this, aspectInstanceFactory, declarationOrderInAspect, aspectName);
}
```

总结：基于注解的AOP实现，最终还是要将注解类转换成相应的Adviser、advice、Pointcut的。

```java
 
```
