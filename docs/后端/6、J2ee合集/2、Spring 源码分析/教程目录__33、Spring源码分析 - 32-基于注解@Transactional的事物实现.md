# 33、Spring源码分析 - 32-基于注解@Transactional的事物实现
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/33.html
- 分类：J2EE框架
- 分组：教程目录
@EnableTransactionManagement启用Spring的注解驱动的事务管理功能，它背后的处理器是TransactionManagementConfigurationSelector，在使用ASPECTJ模式它会导入AspectJJtaTransactionManagementConfiguration和AspectJTransactionManagementConfiguration用于基于ASPECTJ代理模式实现基于注解的事物实现，这里主要讨论PROXY模式基于接口的JDK动态代理模式：两个核心组件一个是AutoProxyRegistrar用于注册一个自动代理创建者(APC)去发现可被代理的目标对象，详细请参考[《基于注解@Aspect的AOP实现》](/zhuanlan/j2ee/spring/7/24.html)和[《Spring缓存原理详解》](/zhuanlan/j2ee/spring/7/25.html)；另一个是ProxyTransactionManagementConfiguration注册启用基于代理的注解驱动的事务管理所需的Spring基础架构bean。ProxyTransactionManagementConfiguration继承于AbstractTransactionManagementConfiguration，这个父类有一个@Autowired方法setConfigurers()以提供用户配置PlatformTransactionManager的入口。

```java
@Configuration
public abstract class AbstractTransactionManagementConfiguration implements ImportAware {
   @Nullable
   protected AnnotationAttributes enableTx;
   @Nullable
   protected PlatformTransactionManager txManager;
   @Override
   public void setImportMetadata(AnnotationMetadata importMetadata) {
      this.enableTx = AnnotationAttributes.fromMap(
            importMetadata.getAnnotationAttributes(EnableTransactionManagement.class.getName(), false));
      if (this.enableTx == null) {
         throw new IllegalArgumentException(
               "@EnableTransactionManagement is not present on importing class " + importMetadata.getClassName());
      }
   }
   @Autowired(required = false)
   void setConfigurers(Collection<TransactionManagementConfigurer> configurers) {
      if (CollectionUtils.isEmpty(configurers)) {
         return;
      }
      if (configurers.size() > 1) {
         throw new IllegalStateException("Only one TransactionManagementConfigurer may exist");
      }
      TransactionManagementConfigurer configurer = configurers.iterator().next();
      this.txManager = configurer.annotationDrivenTransactionManager();
   }
   @Bean(name = TransactionManagementConfigUtils.TRANSACTIONAL_EVENT_LISTENER_FACTORY_BEAN_NAME)
   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
   public static TransactionalEventListenerFactory transactionalEventListenerFactory() {
      return new TransactionalEventListenerFactory();
   }
}
```

另外还注册了一个TransactionalEventListenerFactory，ProxyTransactionManagementConfiguration注册了三个组件：TransactionInterceptor、AnnotationTransactionAttributeSource、BeanFactoryTransactionAttributeSourceAdvisor。

```java
@Configuration
public class ProxyTransactionManagementConfiguration extends AbstractTransactionManagementConfiguration {
   @Bean(name = TransactionManagementConfigUtils.TRANSACTION_ADVISOR_BEAN_NAME)
   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
   public BeanFactoryTransactionAttributeSourceAdvisor transactionAdvisor() {
      BeanFactoryTransactionAttributeSourceAdvisor advisor = new BeanFactoryTransactionAttributeSourceAdvisor();
      advisor.setTransactionAttributeSource(transactionAttributeSource());
      advisor.setAdvice(transactionInterceptor());
      if (this.enableTx != null) {
         advisor.setOrder(this.enableTx.<Integer>getNumber("order"));
      }
      return advisor;
   }
   @Bean
   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
   public TransactionAttributeSource transactionAttributeSource() {
      return new AnnotationTransactionAttributeSource();
   }
   @Bean
   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
   public TransactionInterceptor transactionInterceptor() {
      TransactionInterceptor interceptor = new TransactionInterceptor();
      interceptor.setTransactionAttributeSource(transactionAttributeSource());
      if (this.txManager != null) {
         interceptor.setTransactionManager(this.txManager);
      }
      return interceptor;
   }
}
```

下面就主要分析一下这四个组件的设计与实现。

## 1、TransactionalEventListenerFactory

@TransactionalEventListener是一个根据事务阶段调用的事件监听器。如果事件没有在托管事务的边界内发布，则丢弃该事件，除非显式设置fallbackExecution标志。如果事务正在运行，则根据其TransactionPhase处理该事件。添加@Order允许在事务完成之前或之后运行的其他侦听器中对该侦听器进行优先级排序。

```java
public class TransactionalEventListenerFactory implements EventListenerFactory, Ordered {
   private int order = 50;
   public void setOrder(int order) {
      this.order = order;
   }
   @Override
   public int getOrder() {
      return this.order;
   }
   @Override
   public boolean supportsMethod(Method method) {
      return AnnotatedElementUtils.hasAnnotation(method, TransactionalEventListener.class);
   }
   @Override
   public ApplicationListener<?> createApplicationListener(String beanName, Class<?> type, Method method) {
      return new ApplicationListenerMethodTransactionalAdapter(beanName, type, method);
   }
}
```

在[《ApplicationEvent事件机制》](/zhuanlan/j2ee/spring/7/20.html)中分析过Spring会从容器中选出能处理事件注解的方法，根据TransactionalEventListenerFactory的supportsMethod()的方法可以看出是处理@TransactionalEventListener的，ApplicationListenerMethodTransactionalAdapter就是处理该事件的事件处理器。

```java
class ApplicationListenerMethodTransactionalAdapter extends ApplicationListenerMethodAdapter {
   private final TransactionalEventListener annotation;
   public ApplicationListenerMethodTransactionalAdapter(String beanName, Class<?> targetClass, Method method) {
      super(beanName, targetClass, method);
      TransactionalEventListener ann = AnnotatedElementUtils.findMergedAnnotation(method, TransactionalEventListener.class);
      if (ann == null) {
         throw new IllegalStateException("No TransactionalEventListener annotation found on method: " + method);
      }
      this.annotation = ann;
   }
   @Override
   public void onApplicationEvent(ApplicationEvent event) {
      //《ApplicationEvent事件机制》中可知事件处理默认是同步机制的，因此在事物边界内发布事件后
      //TransactionSynchronizationManager.isSynchronizationActive()的返回值为true
      if (TransactionSynchronizationManager.isSynchronizationActive()) {
         //创建事物同步对象TransactionSynchronizationEventAdapter注册到TransactionSynchronizationManager中
         //事物同步对象实现了TransactionSynchronization接口方法beforeCommit()和afterCompletion()
         //待到事物的提交前后会分别执行所有同步事物的这两个方法
         TransactionSynchronization transactionSynchronization = createTransactionSynchronization(event);
         TransactionSynchronizationManager.registerSynchronization(transactionSynchronization);
      }
      //如果是异步事件处理，则可以设置TransactionalEventListener的fallbackExecution标志位true一样可以调用@TransactionalEventListener方法处理事件
      else if (this.annotation.fallbackExecution()) {
         if (this.annotation.phase() == TransactionPhase.AFTER_ROLLBACK && logger.isWarnEnabled()) {
            logger.warn("Processing " + event + " as a fallback execution on AFTER_ROLLBACK phase");
         }
         processEvent(event);
      }
      else {
         //当前线程无事物则不处理
         if (logger.isDebugEnabled()) {
            logger.debug("No transaction is active - skipping " + event);
         }
      }
   }
   private TransactionSynchronization createTransactionSynchronization(ApplicationEvent event) {
      return new TransactionSynchronizationEventAdapter(this, event, this.annotation.phase());
   }
   private static class TransactionSynchronizationEventAdapter extends TransactionSynchronizationAdapter {
      private final ApplicationListenerMethodAdapter listener;
      private final ApplicationEvent event;
      private final TransactionPhase phase;
      public TransactionSynchronizationEventAdapter(ApplicationListenerMethodAdapter listener,
            ApplicationEvent event, TransactionPhase phase) {
         this.listener = listener;
         this.event = event;
         this.phase = phase;
      }
      @Override
      public int getOrder() {
         return this.listener.getOrder();
      }
      @Override
      public void beforeCommit(boolean readOnly) {
         if (this.phase == TransactionPhase.BEFORE_COMMIT) {
            processEvent();
         }
      }
      @Override
      public void afterCompletion(int status) {
         if (this.phase == TransactionPhase.AFTER_COMMIT && status == STATUS_COMMITTED) {
            processEvent();
         }
         else if (this.phase == TransactionPhase.AFTER_ROLLBACK && status == STATUS_ROLLED_BACK) {
            processEvent();
         }
         else if (this.phase == TransactionPhase.AFTER_COMPLETION) {
            processEvent();
         }
      }
      protected void processEvent() {
         this.listener.processEvent(this.event);
      }
   }
}
```

在[《ApplicationEvent事件机制》](/zhuanlan/j2ee/spring/7/20.html)中可知Spring事件处理默认是同步的，因此在事件监听器接收到事物边界内发布的事件时TransactionSynchronizationManager.isSynchronizationActive()总是true，因此会注册一个TransactionSynchronizationEventAdapter，它是一个TransactionSynchronization并实现了事物提交声明周期方法beforeCommit()和afterCompletion()，在[《Spring编程式事物的设计与实现》](/zhuanlan/j2ee/spring/7/30.html)中分析过，这两个方法会在事物管理器AbstractPlatformTransactionManager事物提交阶段processCommit()方法中调用事物管理器doCommit()方法前后执行的。通过这两个方法可以看出，执行事件处理方法是根据@TransactionalEventListener的phase(事物阶段)具体值来决定是否执行。

如果选择了异步事件处理或在事物边界外进行事件的发布则可以通过设置@TransactionalEventListener的fallbackExecution为true来执行事件处理方法，只不过此时获取不到了当前线程的所有事物同步对象，也就不能根据事物阶段来选择是否执行事件处理方法了。

## 2、TransactionInterceptor

用于事物处理的拦截器，这个在[《Spring编程式事物的设计与实现》](/zhuanlan/j2ee/spring/7/30.html)已经详细分析过了，这里再提一句Spring AOP通知器的切入点会根据TransactionInterceptor中的TransactionAttributeSource获取的TransactionAttribute决定的，基于注解事物实现的TransactionAttributeSource是下面所讲的AnnotationTransactionAttributeSource。

## 3、AnnotationTransactionAttributeSource

实现TransactionAttributeSource}接口，该类读取Spring的@Transactional注解数据，并将相应的事务属性公开给Spring的事务基础结构。还支持JTA 1.2的@javax.transaction.Transactional和EJB3的@javax.ejb.TransactionAttribute(如果存在)。这个类也可以作为定制TransactionAttributeSource的基类，或者通过TransactionAnnotationParser策略进行定制。

AbstractFallbackTransactionAttributeSource是TransactionAttributeSource接口的抽象实现，它缓存方法的属性并实现一个回退策略:

**1、** 特定的目标方法;；

**2、** 目标类;；

**3、** 声明方法;；

**4、** 声明类/接口；

如果没有与目标方法关联，则默认使用目标类的事务属性。与目标方法关联的任何事务属性都将完全覆盖类事务属性。如果在目标类中没有找到，将检查调用的方法通过的接口(对于JDK代理)。此实现在首次使用属性之后按方法缓存属性。如果希望允许事务属性的动态更改(这是非常不可能的)，那么可以将缓存配置为可配置的。缓存是可取的，因为评估回滚规则的成本很高。

下面是AbstractFallbackTransactionAttributeSource的getTransactionAttribute()方法的实现。

```java
//确定此方法调用的事务属性。如果没有找到方法属性，则默认为类的事务属性。
@Override
@Nullable
public TransactionAttribute getTransactionAttribute(Method method, @Nullable Class<?> targetClass) {
   if (method.getDeclaringClass() == Object.class) {
      return null;
   }
   //检查缓存中是否有
   Object cacheKey = getCacheKey(method, targetClass);
   TransactionAttribute cached = this.attributeCache.get(cacheKey);
   if (cached != null) {
      //值要么是指示没有事务属性的规范值，要么是实际的事务属性。
      if (cached == NULL_TRANSACTION_ATTRIBUTE) {
         return null;
      }
      else {
         return cached;
      }
   }
   else {
      //computeTransactionAttribute()是真正获取TransactionAttribute的方法，
      //而getTransactionAttribute()相当于computeTransactionAttribute()方法的缓存装饰器
      TransactionAttribute txAttr = computeTransactionAttribute(method, targetClass);
      // Put it in the cache.
      if (txAttr == null) {
         this.attributeCache.put(cacheKey, NULL_TRANSACTION_ATTRIBUTE);
      }
      else {
         String methodIdentification = ClassUtils.getQualifiedMethodName(method, targetClass);
         if (txAttr instanceof DefaultTransactionAttribute) {
            ((DefaultTransactionAttribute) txAttr).setDescriptor(methodIdentification);
         }
         if (logger.isTraceEnabled()) {
            logger.trace("Adding transactional method '" + methodIdentification + "' with attribute: " + txAttr);
         }
         this.attributeCache.put(cacheKey, txAttr);
      }
      return txAttr;
   }
}
@Nullable
protected TransactionAttribute computeTransactionAttribute(Method method, @Nullable Class<?> targetClass) {
   //AnnotationTransactionAttributeSource中只允许public方法
   if (allowPublicMethodsOnly() && !Modifier.isPublic(method.getModifiers())) {
      return null;
   }
   //方法可能在接口上，但我们需要来自目标类的属性。如果目标类为null，则该方法将保持不变。
   Method specificMethod = AopUtils.getMostSpecificMethod(method, targetClass);
   //首先尝试目标类中的方法。
   TransactionAttribute txAttr = findTransactionAttribute(specificMethod);
   if (txAttr != null) {
      return txAttr;
   }
   //如果没有则在尝试目标类上的事务属性。
   txAttr = findTransactionAttribute(specificMethod.getDeclaringClass());
   if (txAttr != null && ClassUtils.isUserLevelMethod(method)) {
      return txAttr;
   }
   if (specificMethod != method) {
      //回退到声明的方法寻找属性
      txAttr = findTransactionAttribute(method);
      if (txAttr != null) {
         return txAttr;
      }
      //最后回退到原始方法的类上寻找事物属性
      txAttr = findTransactionAttribute(method.getDeclaringClass());
      if (txAttr != null && ClassUtils.isUserLevelMethod(method)) {
         return txAttr;
      }
   }
   return null;
}
```

AbstractFallbackTransactionAttributeSource中下面这两个方法是模板方法，由子类提供具体的实现。

```java
//子类需要实现这一点，以返回给定类的事务属性(如果有的话)。
@Nullable
protected abstract TransactionAttribute findTransactionAttribute(Class<?> clazz);
//子类需要实现这一点，以返回给定方法的事务属性(如果有的话)。
@Nullable
protected abstract TransactionAttribute findTransactionAttribute(Method method);
```

子类AnnotationTransactionAttributeSource是实现这两个方法如下，都是调用determineTransactionAttribute()方法，这个方法使用构造方法中创建的TransactionAnnotationParser来从给定的Class或Method解析出TransactionAttribute。

```java
public AnnotationTransactionAttributeSource() {
   this(true);
}
//实例化了三个类型的TransactionAnnotationParser分别处理不同的事物注解
public AnnotationTransactionAttributeSource(boolean publicMethodsOnly) {
   this.publicMethodsOnly = publicMethodsOnly;
   if (jta12Present || ejb3Present) {
      this.annotationParsers = new LinkedHashSet<>(4);
      this.annotationParsers.add(new SpringTransactionAnnotationParser());
      if (jta12Present) {
         this.annotationParsers.add(new JtaTransactionAnnotationParser());
      }
      if (ejb3Present) {
         this.annotationParsers.add(new Ejb3TransactionAnnotationParser());
      }
   }
   else {
      this.annotationParsers = Collections.singleton(new SpringTransactionAnnotationParser());
   }
}
@Override
@Nullable
protected TransactionAttribute findTransactionAttribute(Class<?> clazz) {
   return determineTransactionAttribute(clazz);
}
@Override
@Nullable
protected TransactionAttribute findTransactionAttribute(Method method) {
   return determineTransactionAttribute(method);
}
//确定给定方法或类的事务属性。
//这个实现委托给构造方法中配置的TransactionAnnotationParser、TransactionAnnotationParsers，
//将已知的注释解析为Spring的元数据属性类。
//如果不是事务性的，返回{@code null}。
//可以重写以支持携带事务元数据的自定义注释。
@Nullable
protected TransactionAttribute determineTransactionAttribute(AnnotatedElement element) {
   for (TransactionAnnotationParser annotationParser : this.annotationParsers) {
      TransactionAttribute attr = annotationParser.parseTransactionAnnotation(element);
      if (attr != null) {
         return attr;
      }
   }
   return null;
}
```

这里以解析org.springframework.transaction.annotation.TransactionalSpring的TransactionAnnotationParser举例分析如何从指定可注解的元素上获取事物属性。

```java
public class SpringTransactionAnnotationParser implements TransactionAnnotationParser, Serializable {
   @Override
   @Nullable
   public TransactionAttribute parseTransactionAnnotation(AnnotatedElement element) {
      AnnotationAttributes attributes = AnnotatedElementUtils.findMergedAnnotationAttributes(
            element, Transactional.class, false, false);
      if (attributes != null) {
         return parseTransactionAnnotation(attributes);
      }
      else {
         return null;
      }
   }
   public TransactionAttribute parseTransactionAnnotation(Transactional ann) {
      return parseTransactionAnnotation(AnnotationUtils.getAnnotationAttributes(ann, false, false));
   }
   protected TransactionAttribute parseTransactionAnnotation(AnnotationAttributes attributes) {
      RuleBasedTransactionAttribute rbta = new RuleBasedTransactionAttribute();
      Propagation propagation = attributes.getEnum("propagation");
      rbta.setPropagationBehavior(propagation.value());
      Isolation isolation = attributes.getEnum("isolation");
      rbta.setIsolationLevel(isolation.value());
      rbta.setTimeout(attributes.getNumber("timeout").intValue());
      rbta.setReadOnly(attributes.getBoolean("readOnly"));
      rbta.setQualifier(attributes.getString("value"));
      //RuleBasedTransactionAttribute继承DefaultTransactionAttribute，并重写了rollbackOn()方法
      //可从注解属性得到四种回滚或不回滚的异常类型来决定rollbackOn()参数中的异常是否回滚
      List<RollbackRuleAttribute> rollbackRules = new ArrayList<>();
      for (Class<?> rbRule : attributes.getClassArray("rollbackFor")) {
         rollbackRules.add(new RollbackRuleAttribute(rbRule));
      }
      for (String rbRule : attributes.getStringArray("rollbackForClassName")) {
         rollbackRules.add(new RollbackRuleAttribute(rbRule));
      }
      for (Class<?> rbRule : attributes.getClassArray("noRollbackFor")) {
         rollbackRules.add(new NoRollbackRuleAttribute(rbRule));
      }
      for (String rbRule : attributes.getStringArray("noRollbackForClassName")) {
         rollbackRules.add(new NoRollbackRuleAttribute(rbRule));
      }
      rbta.setRollbackRules(rollbackRules);
      return rbta;
   }
   @Override
   public boolean equals(Object other) {
      return (this == other || other instanceof SpringTransactionAnnotationParser);
   }
   @Override
   public int hashCode() {
      return SpringTransactionAnnotationParser.class.hashCode();
   }
}
```

## 4、BeanFactoryTransactionAttributeSourceAdvisor

此通知器由TransactionAttributeSource驱动，用于为事务性方法包含事务通知bean。

```java
public class BeanFactoryTransactionAttributeSourceAdvisor extends AbstractBeanFactoryPointcutAdvisor {
   @Nullable
   private TransactionAttributeSource transactionAttributeSource;
   private final TransactionAttributeSourcePointcut pointcut = new TransactionAttributeSourcePointcut() {
      @Override
      @Nullable
      protected TransactionAttributeSource getTransactionAttributeSource() {
         return transactionAttributeSource;
      }
   };
   //设置用于查找事务属性的事务属性源。这通常应该与事务拦截器本身上的事务属性源相同
   public void setTransactionAttributeSource(TransactionAttributeSource transactionAttributeSource) {
      this.transactionAttributeSource = transactionAttributeSource;
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

```java
abstract class TransactionAttributeSourcePointcut extends StaticMethodMatcherPointcut implements Serializable {
   @Override
   public boolean matches(Method method, Class<?> targetClass) {
      if (TransactionalProxy.class.isAssignableFrom(targetClass) ||
            PlatformTransactionManager.class.isAssignableFrom(targetClass) ||
            PersistenceExceptionTranslator.class.isAssignableFrom(targetClass)) {
         return false;
      }
      //AnnotationTransactionAttributeSource，和TransactionInterceptor是同一个引用
      TransactionAttributeSource tas = getTransactionAttributeSource();
      return (tas == null || tas.getTransactionAttribute(method, targetClass) != null);
   }
}
```
