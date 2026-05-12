# 22、Spring源码分析 - 22-Spring AOP的实现原理之ProxyFactoryBean
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/22.html
- 分类：J2EE框架
- 分组：教程目录
## 1、设计原理

在Spring的AOP模块中,一个主要的部分是代理对象的生成,而对于 Spring应用,可以看到,是通过配置和调用 Spring的 ProxyFactoryBean和ProxyFactory来完成这个任务的。在 ProxyFactoryBean中,封装了主要代理对象的生成过程。在这个生成过程中,可以使用JDK的Proxy和CGLIB两种生成方式。以ProxyFactory的设计为中心,可以看到相关的类继承关系如图所示。

在这个类继承关系中,可以看到完成AOP应用的类,比如 AspectJProxyFactory、ProxyFactory和ProxyFactoryBean,它们都在同一个类的继承体系下,都是 ProxyConfig、AdvisedSupport和ProxyCreatorSupport的子类。作为共同基类,可以将 ProxyConfig看成是一个数据基类,这个数据基类为ProxyFactoryBean这样的子类提供了配置属性;在另一个基类AdvisedSupport的实现中,封装了AOP对通知和通知器的相关操作,这些操作对于不同的AOP的代理对象的生成都是一样的,但对于具体的AOP代理对象的创建, AdvisedSupport把它交给它的子类们去完成;对于 ProxyCreatorSupport,可以将它看成是其子类创建AOP代理对象的一个辅助类。通过继承以上提到的基类的功能实现,具体的AOP代理对象的生成,根据不同的需要,分别由 ProxyFactoryBean、AspectProxyFactory和ProxyFactory来完成。对于需要使用 Aspect的AOP应用, AspectProxyFactory起到集成Spring和AspectJ的作用;对于使用 Spring AOP的应用, ProxyFactoryBean和ProxyFactoy都提供了AOP功能的封装,只是使用ProxyFactoryBean,可以在IoC容器中完成声明式配置,而使用 ProxyFactory,则需要编程式地使用Spring AOP的功能。

## 2、配置 ProxyFactoryBean

在了解ProxyFactoryBean的实现之前,先简要介绍一下ProxyFactoryBean的配置和使用,在基于XML配置Spring的Bean时,往往需要一系列的配置步骤来使用 ProxyFactoryBean和AOP。

**1、** 定义使用的通知器Advisor,这个通知器应该作为一个Bean来定义很重要的一点是,这个通知器的实现定义了需要对目标对象进行增强的切面行为,也就是Advice通知；

**2、** 定义ProxyFactoryBean,把它作为另一个Bean来定义,它是封装AOP功能的主要类在配置ProxyFactoryBean时,需要设定与AOP实现相关的重要属性,比如proxyInterface、interceptorNames和target等从属性名称可以看出,interceptorNames属性的值往往设置为需要定义的通知器,因为这些通知器在ProxyFactoryBean的AOP配置下,是通过使用代理对象的拦截器机制起作用的；

**3、** 定义target属性,作为target属性注入的Bean,是需要用AOP通知器中的切面应用来增强的对象；

```java
//interceptorNames的内容应该是Advice和Advisor的bean name
public void setInterceptorNames(String... interceptorNames) {
   this.interceptorNames = interceptorNames;
}
//如果没有设置目标对象的代理接口，则使用CGLIB创建代理
public void setProxyInterfaces(Class<?>[] proxyInterfaces) throws ClassNotFoundException {
   setInterfaces(proxyInterfaces);
}
//目标对象的bean name
public void setTargetName(String targetName) {
   this.targetName = targetName;
}
```

```java
<bean id="testAdvisor" class="com.abc.TestAdvisor"/>
<bean id="testTarget" class="com.abc.TestTarget"/>
<bean id="testAOP" class="org.springframework.aop.ProxyFactoryBean">
    <property name="proxyInterfaces"><value>com.test.AbcInterface"</value></property>
    <property name="targetName"><value>testTarget</value></property>
    <property name="interceptorNames"><list><value>testAdvisor</value></list></property>
</bean>
```

有了这些配置,就可以使用 ProxyFactoryBean完成AOP的基本功能了。

掌握这些配置后,就可以具体看一看这些AOP是如何实现的,也就是说,切面应用是怎样通过 ProxyFactoryBean对target对象起作用的,下面我们会详细地分析这个部分。

## 3、ProxyFactoryBean生成AopProxy代理对象

在ProxyFactoryBean中,通过 interceptorNames属性来配置已经定义好的通知器 Advisor。虽然名字为 InterceptorNames,但实际上却是供AOP应用配置通知器的地方。在 ProxyFactoryBean中,需要为 target目标对象生成 Proxy代理对象,从而为AOP横切面的编织做好准备工作。

ProxyFactoryBean的AOP实现需要依赖JDK或者CGLIB提供的Proxy特性。从FactoryBean中获取对象,是以 getObject()方法作为入口完成的; ProxyFactoryBean实现中的getObject()方法,是FactoryBean需要实现的接口。对ProxyFactoryBean来说,把需要对 target目标对象增加的增强处理,都通过 getObject()方法进行封装了,这些增强处理是为AOP功能的实现提供服务的。 getObject()的实现如下所示。

```java
public Object getObject() throws BeansException {
   //初始化通知器链
   initializeAdvisorChain();
   if (isSingleton()) {
      return getSingletonInstance();
   }
   else {
      if (this.targetName == null) {
         logger.info("Using non-singleton proxies with singleton targets is often undesirable. " +
               "Enable prototype proxies by setting the 'targetName' property.");
      }
      return newPrototypeInstance();
   }
}
```

getObject()方法首先对通知器链进行初始化,通知器链封装了一系列的拦截器,这些拦截器都要从配置中读取,然后为代理对象的生成做好准备。在生成代理对象时,因为 Spring中有 singleton类型和 prototype类型这两种不同的Bean,所以要对代理对象的生成做一个区分。

### 3.1、初始化拦截器链

为Proxy代理对象配置 Advisor链是在initializeAdvisorchain方法中完成的,这个初始化过程有一个标志位advisorChainInitialized,这个标志用来表示通知器链是否已经初始化。如果已经初始化,那么这里就不会再初始化,而是直接返回。也就是说,这个初始化的工作发生在应用第一次通过ProxyFactoryBean去获取代理对象的时候。在完成这个初始化之后,接着会读取配置中出现的所有通知器,这个取得通知器的过程也比较简单,把通知器的名字交给容器的getBean方法就可以了,这是通过对IoC容器实现的一个回调来完成的。然后把从IoC容器中取得的通知器加入通知器链中,这个动作是由 addAdvisorOnChainCreation()方法来实现的。

```java
private synchronized void initializeAdvisorChain() throws AopConfigException, BeansException {
   if (this.advisorChainInitialized) {
      return;
   }
   if (!ObjectUtils.isEmpty(this.interceptorNames)) {
      if (this.beanFactory == null) {
         throw new IllegalStateException("No BeanFactory available anymore (probably due to serialization) " +
               "- cannot resolve interceptor names " + Arrays.asList(this.interceptorNames));
      }
      // Globals can't be last unless we specified a targetSource using the property...
      if (this.interceptorNames[this.interceptorNames.length - 1].endsWith(GLOBAL_SUFFIX) &&
            this.targetName == null && this.targetSource == EMPTY_TARGET_SOURCE) {
         throw new AopConfigException("Target required after globals");
      }
      // Materialize interceptor chain from bean names.
      for (String name : this.interceptorNames) {
         if (logger.isTraceEnabled()) {
            logger.trace("Configuring advisor or advice '" + name + "'");
         }
         //如果interceptorName结尾是*,则会将interceptorName开头的通知器从BeanFactory取出都加入拦截器列表
         if (name.endsWith(GLOBAL_SUFFIX)) {
            if (!(this.beanFactory instanceof ListableBeanFactory)) {
               throw new AopConfigException(
                     "Can only use global advisors or interceptors with a ListableBeanFactory");
            }
            addGlobalAdvisor((ListableBeanFactory) this.beanFactory,
                  name.substring(0, name.length() - GLOBAL_SUFFIX.length()));
         }
         else {
            // If we get here, we need to add a named interceptor.
            // We must check if it's a singleton or prototype.
            Object advice;
            if (this.singleton || this.beanFactory.isSingleton(name)) {
               // Add the real Advisor/Advice to the chain.
               advice = this.beanFactory.getBean(name);
            }
            else {
               // It's a prototype Advice or Advisor: replace with a prototype.
               // Avoid unnecessary creation of prototype bean just for advisor chain initialization.
               advice = new PrototypePlaceholderAdvisor(name);
            }
            addAdvisorOnChainCreation(advice, name);
         }
      }
   }
   this.advisorChainInitialized = true;
}
// 通配符*的方式
private void addGlobalAdvisor(ListableBeanFactory beanFactory, String prefix) {
   String[] globalAdvisorNames =
         BeanFactoryUtils.beanNamesForTypeIncludingAncestors(beanFactory, Advisor.class);
   String[] globalInterceptorNames =
         BeanFactoryUtils.beanNamesForTypeIncludingAncestors(beanFactory, Interceptor.class);
   List<Object> beans = new ArrayList<>(globalAdvisorNames.length + globalInterceptorNames.length);
   Map<Object, String> names = new HashMap<>(beans.size());
   for (String name : globalAdvisorNames) {
      Object bean = beanFactory.getBean(name);
      beans.add(bean);
      names.put(bean, name);
   }
   for (String name : globalInterceptorNames) {
      Object bean = beanFactory.getBean(name);
      beans.add(bean);
      names.put(bean, name);
   }
   AnnotationAwareOrderComparator.sort(beans);
   for (Object bean : beans) {
      String name = names.get(bean);
      if (name.startsWith(prefix)) {
         addAdvisorOnChainCreation(bean, name);
      }
   }
}
private void addAdvisorOnChainCreation(Object next, String name) {
   // We need to convert to an Advisor if necessary so that our source reference
   // matches what we find from superclass interceptors.
   Advisor advisor = namedBeanToAdvisor(next);
   if (logger.isTraceEnabled()) {
      logger.trace("Adding advisor with name '" + name + "'");
   }
   addAdvisor(advisor);
}
//如果next是Advice会将其转换成Advisor
private Advisor namedBeanToAdvisor(Object next) {
   try {
      return this.advisorAdapterRegistry.wrap(next);
   }
   catch (UnknownAdviceTypeException ex) {
      // We expected this to be an Advisor or Advice,
      // but it wasn't. This is a configuration error.
      throw new AopConfigException("Unknown advisor type " + next.getClass() +
            "; Can only include Advisor or Advice type beans in interceptorNames chain except for last entry," +
            "which may also be target or TargetSource", ex);
   }
}
```

因为intercepterNames中的name可以是 Advice，namedBeanToAdvisor()方法默认使用DefaultAdvisorAdapterRegistry将Advice通过适当AdvisorAdapter转换成Advisor在放入通知器链中。

```java
public DefaultAdvisorAdapterRegistry() {
   //为MethodBeforeAdvice、AfterReturningAdvice、AfterAdvice注册适配器
   registerAdvisorAdapter(new MethodBeforeAdviceAdapter());
   registerAdvisorAdapter(new AfterReturningAdviceAdapter());
   registerAdvisorAdapter(new ThrowsAdviceAdapter());
}
@Override
public Advisor wrap(Object adviceObject) throws UnknownAdviceTypeException {
   //是Advisor直接返回
   if (adviceObject instanceof Advisor) {
      return (Advisor) adviceObject;
   }
   //除了Advisor只能是Advice
   if (!(adviceObject instanceof Advice)) {
      throw new UnknownAdviceTypeException(adviceObject);
   }
   Advice advice = (Advice) adviceObject;
   //方法拦截器 所有方法适用不需要判断前置、后置等
   if (advice instanceof MethodInterceptor) {
      // So well-known it doesn't even need an adapter.
      return new DefaultPointcutAdvisor(advice);
   }
   //适用构造方法注册的AdvisorAdapter转换相应的Advice
   for (AdvisorAdapter adapter : this.adapters) {
      // Check that it is supported.
      if (adapter.supportsAdvice(advice)) {
         return new DefaultPointcutAdvisor(advice);
      }
   }
   throw new UnknownAdviceTypeException(advice);
}
```

### 3.2、单例代理对象

初始化通知器链后，根据singleton属性决定生成单利对象还是原型对象。生成singleton的代理对象在getSingletonInstance()的代码中完成,这个方法是ProxyFactoryBean生成AopProxy代理对象的调用入口。代理对象会封装对target目标对象的调用,也就是说针对 target对象的方法调用行为会被这里生成的代理对象所拦截。具体的生成过程是,首先读取ProxyFactoryBean中的配置,为生成代理对象做好必要的准备,比如设置代理的方法调用接口等。Spring通过AopProxy类来具体生成代理对象。

```java
private synchronized Object getSingletonInstance() {
   if (this.singletonInstance == null) {
      //如果没有设置target或targetSource，则从容器中取出bean name是targetName的bean包装成一个SingletonTargetSource
      this.targetSource = freshTargetSource();
      //如果没有配置代理接口有哪些，自动检测
      if (this.autodetectInterfaces && getProxiedInterfaces().length == 0 && !isProxyTargetClass()) {
         // Rely on AOP infrastructure to tell us what interfaces to proxy.
         Class<?> targetClass = getTargetClass();
         if (targetClass == null) {
            throw new FactoryBeanNotInitializedException("Cannot determine target class for proxy");
         }
         //保存代理对象的接口，目标类上所有的接口
         setInterfaces(ClassUtils.getAllInterfacesForClass(targetClass, this.proxyClassLoader));
      }
      // Initialize the shared singleton instance.
      super.setFrozen(this.freezeProxy);
      //createAopProxy()内部默认使用DefaultAopProxyFactory创建一个AopProxy返回
      this.singletonInstance = getProxy(createAopProxy());
   }
   return this.singletonInstance;
}
//通过createAopProxy()返回的AopProxy来得到代理对象
protected Object getProxy(AopProxy aopProxy) {
   return aopProxy.getProxy(this.proxyClassLoader);
}
//通过AopProxyFactory创建AopProxy，默认父类ProxyCreatorSupport构造器里实例化的DefaultAopProxyFactory
protected final synchronized AopProxy createAopProxy() {
   if (!this.active) {
      activate();
   }
   return getAopProxyFactory().createAopProxy(this);
}
private TargetSource freshTargetSource() {
   //targetName、TargetSource 必须设置其中的一个，targetName优先级最高
   if (this.targetName == null) {
      if (logger.isTraceEnabled()) {
         logger.trace("Not refreshing target: Bean name not specified in 'interceptorNames'.");
      }
      return this.targetSource;
   }
   else {
      if (this.beanFactory == null) {
         throw new IllegalStateException("No BeanFactory available anymore (probably due to serialization) " +
               "- cannot resolve target with name '" + this.targetName + "'");
      }
      if (logger.isDebugEnabled()) {
         logger.debug("Refreshing target with name '" + this.targetName + "'");
      }
      Object target = this.beanFactory.getBean(this.targetName);
      return (target instanceof TargetSource ? (TargetSource) target : new SingletonTargetSource(target));
   }
}
```

这里使用了AopProxyFactory来创建AopProxy, AopProxyFactory使用的是DefaultAopProxyFactory。这个被使用的AopProxyFactory,作为 AopProxy的创建工厂对象,是在ProxyFactoryBean的基类ProxyCreatorSupport中被创建的。在创建 AopProxyFactory时,它被设置为DefaultAopProxyFactory,很显然, Spring给出了这个默认的 AopFactory工厂的实现。有了这个 AopProxyFactory对象以后,问题就转换为在DefaultAopProxyFactory中AopProxy是怎样生成的了。

```java
public class DefaultAopProxyFactory implements AopProxyFactory, Serializable {
   @Override
   public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
      //开启优化 || 代理目标类  ||  没有实现用户接口
      if (config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)) {
         Class<?> targetClass = config.getTargetClass();
         if (targetClass == null) {
            throw new AopConfigException("TargetSource cannot determine target class: " +
                  "Either an interface or a target is required for proxy creation.");
         }
         //如果targetClass是接口类或者本身就是一个JDK动态代理类，使用JDK来生成代理
         if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
            return new JdkDynamicAopProxy(config);
         }
         return new ObjenesisCglibAopProxy(config);
      }
      else {
         return new JdkDynamicAopProxy(config);
      }
   }
   private boolean hasNoUserSuppliedProxyInterfaces(AdvisedSupport config) {
      Class<?>[] ifcs = config.getProxiedInterfaces();
      return (ifcs.length == 0 || (ifcs.length == 1 && SpringProxy.class.isAssignableFrom(ifcs[0])));
   }
}
```

关于AopProxy代理对象的生成,需要考虑使用哪种生成方式,如果目标对象是接口类,那么适合使用JDK来生成代理对象,否则 Spring会使用 CGLIB来生成目标对象的代理对象。为了满足不同的代理对象生成的要求, DefaultAopProxyFactory作为AopProxy对象的生产工厂,可以根据不同的需要生成这两种AopProxy对象。对于AopProxy对象的生产过程,在 DefaultAopProxyFactory创建 AopProxy的过程中可以清楚地看到,但这是一个比较高层次的 AopProxy代理对象的生成过程。所谓高层次,是指在DefaultAopFactory创建AopProxy的过程中,对不同的 AopProxy代理对象的生成所涉及的生成策略和场景做了相应的设计,但是对于具体的AopProxy代理对象的生成,最终并没有由DefaultAopProxyFactory来完成,比如对JDK和CGLB这些具体的技术的使用,对具体的实现层次的代理对象的生成,是由 Spring封装的JdkDynamicAopProxy和ObjenesisCglibAopProxy类来完成的。

## 4、JDK生成的代理对象

JdkDynamicAopProxy使用了JDK的Proxy类来生成代理对象,在生成 Proxy对象之前,首先需要从advised对象中取得代理对象的代理接口配置,然后调用 Proxy的newProxylnstance方法,最终得到对应的Proxy代理对象。在生成代理对象时,需要指明三个参数,一个是类装载器,一个是代理接口,另外一个就是Proxy回调方法所在的对象,这个对象需要实现InvocationHandler接口。这个Invocationhandler接口定义了invoke方法,提供代理对象的回调入口。对于JdkDynamicProxy,它本身实现了InvocationHandler接口和invoke()方法,这个 invoke()方法是Proxy代理对象的回调方法,所以可以使用this来把 JdkDynamicAopProxy指派给Proxy对象,也就是说JdkDynamicAopproxy对象本身,在 Proxy代理的接口方法被调用时,会触发invoke()方法的回调,这个回调方法完成了AOP织入实现的封装。

```java
final class JdkDynamicAopProxy implements AopProxy, InvocationHandler, Serializable {
   /** use serialVersionUID from Spring 1.2 for interoperability. */
   private static final long serialVersionUID = 5531744639992436476L;
   /** We use a static Log to avoid serialization issues. */
   private static final Log logger = LogFactory.getLog(JdkDynamicAopProxy.class);
   /** Config used to configure this proxy. */
   private final AdvisedSupport advised;
   //是否定义了equals()方法
   private boolean equalsDefined;
   //是否定义了hashCode()方法
   private boolean hashCodeDefined;
   public JdkDynamicAopProxy(AdvisedSupport config) throws AopConfigException {
      Assert.notNull(config, "AdvisedSupport must not be null");
      if (config.getAdvisors().length == 0 && config.getTargetSource() == AdvisedSupport.EMPTY_TARGET_SOURCE) {
         throw new AopConfigException("No advisors and no TargetSource specified");
      }
      this.advised = config;
   }
   @Override
   public Object getProxy() {
      return getProxy(ClassUtils.getDefaultClassLoader());
   }
   @Override
   public Object getProxy(@Nullable ClassLoader classLoader) {
      if (logger.isTraceEnabled()) {
         logger.trace("Creating JDK dynamic proxy: " + this.advised.getTargetSource());
      }
      //检测advised中用户指定的代理接口中是否有实现了这三个接口的SpringProxy、Advised、DecoratingProxy
      //如果没有，也将其作为JDK代理对象的接口
      Class<?>[] proxiedInterfaces = AopProxyUtils.completeProxiedInterfaces(this.advised, true);
      findDefinedEqualsAndHashCodeMethods(proxiedInterfaces);
      //JDK动态代理技术，关注InvocationHandler的实现
      return Proxy.newProxyInstance(classLoader, proxiedInterfaces, this);
   }
   /**
    * Finds any {@linkequals} or {@linkhashCode} method that may be defined
    * on the supplied set of interfaces.
    * @param proxiedInterfaces the interfaces to introspect
    */
   private void findDefinedEqualsAndHashCodeMethods(Class<?>[] proxiedInterfaces) {
      for (Class<?> proxiedInterface : proxiedInterfaces) {
         Method[] methods = proxiedInterface.getDeclaredMethods();
         for (Method method : methods) {
            if (AopUtils.isEqualsMethod(method)) {
               this.equalsDefined = true;
            }
            if (AopUtils.isHashCodeMethod(method)) {
               this.hashCodeDefined = true;
            }
            if (this.equalsDefined && this.hashCodeDefined) {
               return;
            }
         }
      }
   }
}
```

Proxy代理对象的invoke()实现,将是详细分析AOP实现原理的重要部分。在JdkDynamicAopProxy中实现了InvocationHandler接口,也就是说当 Proxy对象的代理方法被调用时,JdkDynamicAopProxy的invoke()方法作为Proxy对象的回调函数被触发,从而通过 invoke()的具体实现,来完成对目标对象方法调用的拦截或者说功能增强的工作。

```java
public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
   //包含目标对象的方法和方法实参
   MethodInvocation invocation;
   Object oldProxy = null;
   boolean setProxyContext = false;
   //目标对象的包装对象
   TargetSource targetSource = this.advised.targetSource;
   Object target = null;
   try {
      if (!this.equalsDefined && AopUtils.isEqualsMethod(method)) {
         // The target does not implement the equals(Object) method itself.
         return equals(args[0]);
      }
      else if (!this.hashCodeDefined && AopUtils.isHashCodeMethod(method)) {
         // The target does not implement the hashCode() method itself.
         return hashCode();
      }
      else if (method.getDeclaringClass() == DecoratingProxy.class) {
         // There is only getDecoratedClass() declared -> dispatch to proxy config.
         return AopProxyUtils.ultimateTargetClass(this.advised);
      }
      else if (!this.advised.opaque && method.getDeclaringClass().isInterface() &&
            method.getDeclaringClass().isAssignableFrom(Advised.class)) {
         // Service invocations on ProxyConfig with the proxy config...
         return AopUtils.invokeJoinpointUsingReflection(this.advised, method, args);
      }
      Object retVal;
      if (this.advised.exposeProxy) {
         // Make invocation available if necessary.
         oldProxy = AopContext.setCurrentProxy(proxy);
         setProxyContext = true;
      }
      // Get as late as possible to minimize the time we "own" the target,
      // in case it comes from a pool.
      target = targetSource.getTarget();
      Class<?> targetClass = (target != null ? target.getClass() : null);
      // Get the interception chain for this method.
      //这里通过定义好的通知器链，返回一个拦截器列表是一个MethodInterceptor列表
      List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(method, targetClass);
      // Check whether we have any advice. If we don't, we can fallback on direct
      // reflective invocation of the target, and avoid creating a MethodInvocation.
      if (chain.isEmpty()) {
         // We can skip creating a MethodInvocation: just invoke the target directly
         // Note that the final invoker must be an InvokerInterceptor so we know it does
         // nothing but a reflective operation on the target, and no hot swapping or fancy proxying.
         Object[] argsToUse = AopProxyUtils.adaptArgumentsIfNecessary(method, args);
         retVal = AopUtils.invokeJoinpointUsingReflection(target, method, argsToUse);
      }
      else {
         // We need to create a method invocation...
         invocation = new ReflectiveMethodInvocation(proxy, target, method, args, targetClass, chain);
         // Proceed to the joinpoint through the interceptor chain.
         retVal = invocation.proceed();
      }
      // Massage return value if necessary.
      Class<?> returnType = method.getReturnType();
      if (retVal != null && retVal == target &&
            returnType != Object.class && returnType.isInstance(proxy) &&
            !RawTargetAccess.class.isAssignableFrom(method.getDeclaringClass())) {
         // Special case: it returned "this" and the return type of the method
         // is type-compatible. Note that we can't help if the target sets
         // a reference to itself in another returned object.
         retVal = proxy;
      }
      else if (retVal == null && returnType != Void.TYPE && returnType.isPrimitive()) {
         throw new AopInvocationException(
               "Null return value from advice does not match primitive return type for: " + method);
      }
      return retVal;
   }
   finally {
      if (target != null && !targetSource.isStatic()) {
         // Must have come from TargetSource.
         targetSource.releaseTarget(target);
      }
      if (setProxyContext) {
         // Restore old proxy.
         AopContext.setCurrentProxy(oldProxy);
      }
   }
}
```

从代码清单中可以看到,对 Proxy对象的代理设置是在invoke()方法中完成的,这些设置包括获取目标对象、拦截器链,同时把这些对象作为输入,创建了ReflectiveMethodInvocation对象,通过这个ReflectiveMethodInvocation对象来完成对AOP功能实现的封装。在这个 invoke()方法中,包含了一个完整的拦截器链对目标对象的拦截过程,比如获得拦截器链并对拦截器链中的拦截器进行配置,逐个运行拦截器链里的拦截增强,直到最后对目标对象方法的运行。

#### 4.1、获取拦截器链

通过已经定义好的通知器列表AdvisedSupport.getInterceptorsAndDynamicInterceptionAdvice()

```java
public List<Object> getInterceptorsAndDynamicInterceptionAdvice(Method method, @Nullable Class<?> targetClass) {
   MethodCacheKey cacheKey = new MethodCacheKey(method);
   List<Object> cached = this.methodCache.get(cacheKey);
   if (cached == null) {
      cached = this.advisorChainFactory.getInterceptorsAndDynamicInterceptionAdvice(
            this, method, targetClass);
      this.methodCache.put(cacheKey, cached);
   }
   return cached;
}
```

AdvisedSupport通过DefaultAdvisorChainFactory创建一个拦截器链，决定一个方法有哪些拦截器可以应用是PointcutAdvisor的getPointcut()返回的Pointcut决定的，Pointcut的getClassFilter()返回的ClassFilter和getMethodMatcher()方法返回的MethodMatcher来决定是否可以拦截此方法，前者用于类的判定后者是细粒度方法级别的。

```java
public class DefaultAdvisorChainFactory implements AdvisorChainFactory, Serializable {
   @Override
   public List<Object> getInterceptorsAndDynamicInterceptionAdvice(
         Advised config, Method method, @Nullable Class<?> targetClass) {
      // This is somewhat tricky... We have to process introductions first,
      // but we need to preserve order in the ultimate list.
      AdvisorAdapterRegistry registry = GlobalAdvisorAdapterRegistry.getInstance();
      Advisor[] advisors = config.getAdvisors();
      List<Object> interceptorList = new ArrayList<>(advisors.length);
      Class<?> actualClass = (targetClass != null ? targetClass : method.getDeclaringClass());
      Boolean hasIntroductions = null;
      for (Advisor advisor : advisors) {
         //PointcutAdvisor类型的通知器会通过getPointcut()返回的Pointcut决定是否可以拦截方法的
         //Pointcut的getClassFilter()返回的ClassFilter和getMethodMatcher()方法返回的MethodMatcher
         //来决定是否可以拦截此方法，前者用于类的判定后者是细粒度方法级别的
         if (advisor instanceof PointcutAdvisor) {
            // Add it conditionally.
            PointcutAdvisor pointcutAdvisor = (PointcutAdvisor) advisor;
            if (config.isPreFiltered() || pointcutAdvisor.getPointcut().getClassFilter().matches(actualClass)) {
               MethodMatcher mm = pointcutAdvisor.getPointcut().getMethodMatcher();
               boolean match;
               if (mm instanceof IntroductionAwareMethodMatcher) {
                  if (hasIntroductions == null) {
                     hasIntroductions = hasMatchingIntroductions(advisors, actualClass);
                  }
                  match = ((IntroductionAwareMethodMatcher) mm).matches(method, actualClass, hasIntroductions);
               }
               else {
                  //这需要注意一下，获得拦截器链阶段，只需要方法和目标对象类型不需要参数
                  match = mm.matches(method, actualClass);
               }
               if (match) {
                  MethodInterceptor[] interceptors = registry.getInterceptors(advisor);
                  //DefaultPointcutAdvisor的Pointcut的MethodMatcher的runtime是false
                  //如果MethodMatcher是运行时的，则使用InterceptorAndDynamicMethodMatcher，其内部包含当前MethodMatcher，
                  //会在ReflectiveMethodInvocation内方法运行时根据方法调用时的参数在此判断该拦截器是否可以拦截此方法
                  if (mm.isRuntime()) {
                     // Creating a new object instance in the getInterceptors() method
                     // isn't a problem as we normally cache created chains.
                     for (MethodInterceptor interceptor : interceptors) {
                        interceptorList.add(new InterceptorAndDynamicMethodMatcher(interceptor, mm));
                     }
                  }
                  else {
                     interceptorList.addAll(Arrays.asList(interceptors));
                  }
               }
            }
         }
         //IntroductionAdvisor只需要类级别的判断不需要方法级别的
         else if (advisor instanceof IntroductionAdvisor) {
            IntroductionAdvisor ia = (IntroductionAdvisor) advisor;
            if (config.isPreFiltered() || ia.getClassFilter().matches(actualClass)) {
               Interceptor[] interceptors = registry.getInterceptors(advisor);
               interceptorList.addAll(Arrays.asList(interceptors));
            }
         }
         else {
            Interceptor[] interceptors = registry.getInterceptors(advisor);
            interceptorList.addAll(Arrays.asList(interceptors));
         }
      }
      return interceptorList;
   }
   /**
    * Determine whether the Advisors contain matching introductions.
    */
   private static boolean hasMatchingIntroductions(Advisor[] advisors, Class<?> actualClass) {
      for (Advisor advisor : advisors) {
         if (advisor instanceof IntroductionAdvisor) {
            IntroductionAdvisor ia = (IntroductionAdvisor) advisor;
            if (ia.getClassFilter().matches(actualClass)) {
               return true;
            }
         }
      }
      return false;
   }
}
```

前面已分析过如果ProxyFactoryBean配置的interceptorNames是MethodInterceptor或Advice都会被DefaultAdvisorAdapterRegistry转换成DefaultPointcutAdvisor。并且还是通过DefaultAdvisorAdapterRegistry的AdvisorAdapter将Advisor转换成MethodInterceptor[]，因为一个Advisor可能被多个AdvisorAdapter支持。具体的对应关系看DefaultAdvisorAdapterRegistry内AdviceAdapter的getInterceptor()方法，如下：

```java
class MethodBeforeAdviceAdapter implements AdvisorAdapter, Serializable {
   @Override
   public boolean supportsAdvice(Advice advice) {
      return (advice instanceof MethodBeforeAdvice);
   }
   @Override
   public MethodInterceptor getInterceptor(Advisor advisor) {
      MethodBeforeAdvice advice = (MethodBeforeAdvice) advisor.getAdvice();
      return new MethodBeforeAdviceInterceptor(advice);
   }
}
public class MethodBeforeAdviceInterceptor implements MethodInterceptor, BeforeAdvice, Serializable {
   private final MethodBeforeAdvice advice;
   public MethodBeforeAdviceInterceptor(MethodBeforeAdvice advice) {
      Assert.notNull(advice, "Advice must not be null");
      this.advice = advice;
   }
   @Override
   public Object invoke(MethodInvocation mi) throws Throwable {
      //这个mi就是JdkDynamicAopProxy实例化的ReflectiveMethodInvocation
      //这个设计很巧妙，先执行拦截器方法后继续执行拦截器链，
      //因为目标方法会在所有的拦截方法执行后执行
      this.advice.before(mi.getMethod(), mi.getArguments(), mi.getThis());
      return mi.proceed();
   }
}
```

```java
class AfterReturningAdviceAdapter implements AdvisorAdapter, Serializable {
   @Override
   public boolean supportsAdvice(Advice advice) {
      return (advice instanceof AfterReturningAdvice);
   }
   @Override
   public MethodInterceptor getInterceptor(Advisor advisor) {
      AfterReturningAdvice advice = (AfterReturningAdvice) advisor.getAdvice();
      return new AfterReturningAdviceInterceptor(advice);
   }
}
public class AfterReturningAdviceInterceptor implements MethodInterceptor, AfterAdvice, Serializable {
   private final AfterReturningAdvice advice;
   public AfterReturningAdviceInterceptor(AfterReturningAdvice advice) {
      Assert.notNull(advice, "Advice must not be null");
      this.advice = advice;
   }
   @Override
   public Object invoke(MethodInvocation mi) throws Throwable {
      //这个mi就是JdkDynamicAopProxy实例化的ReflectiveMethodInvocation
      //这个设计很巧妙，先执行拦截器链中的拦截器，在执行后置通知
      Object retVal = mi.proceed();
      this.advice.afterReturning(retVal, mi.getMethod(), mi.getArguments(), mi.getThis());
      return retVal;
   }
}
```

```java
class ThrowsAdviceAdapter implements AdvisorAdapter, Serializable {
   @Override
   public boolean supportsAdvice(Advice advice) {
      return (advice instanceof ThrowsAdvice);
   }
   @Override
   public MethodInterceptor getInterceptor(Advisor advisor) {
      return new ThrowsAdviceInterceptor(advisor.getAdvice());
   }
}
public class ThrowsAdviceInterceptor implements MethodInterceptor, AfterAdvice {
   private static final String AFTER_THROWING = "afterThrowing";
   private static final Log logger = LogFactory.getLog(ThrowsAdviceInterceptor.class);
   private final Object throwsAdvice;
   /** Methods on throws advice, keyed by exception class. */
   private final Map<Class<?>, Method> exceptionHandlerMap = new HashMap<>();
   public ThrowsAdviceInterceptor(Object throwsAdvice) {
      Assert.notNull(throwsAdvice, "Advice must not be null");
      this.throwsAdvice = throwsAdvice;
      Method[] methods = throwsAdvice.getClass().getMethods();
      for (Method method : methods) {
         if (method.getName().equals(AFTER_THROWING) &&
               (method.getParameterCount() == 1 || method.getParameterCount() == 4)) {
            Class<?> throwableParam = method.getParameterTypes()[method.getParameterCount() - 1];
            if (Throwable.class.isAssignableFrom(throwableParam)) {
               // An exception handler to register...
               this.exceptionHandlerMap.put(throwableParam, method);
               if (logger.isDebugEnabled()) {
                  logger.debug("Found exception handler method on throws advice: " + method);
               }
            }
         }
      }
      if (this.exceptionHandlerMap.isEmpty()) {
         throw new IllegalArgumentException(
               "At least one handler method must be found in class [" + throwsAdvice.getClass() + "]");
      }
   }
   public int getHandlerMethodCount() {
      return this.exceptionHandlerMap.size();
   }
   @Override
   public Object invoke(MethodInvocation mi) throws Throwable {
      try {
         return mi.proceed();
      }
      catch (Throwable ex) {
         Method handlerMethod = getExceptionHandler(ex);
         if (handlerMethod != null) {
            invokeHandlerMethod(mi, ex, handlerMethod);
         }
         throw ex;
      }
   }
   @Nullable
   private Method getExceptionHandler(Throwable exception) {
      Class<?> exceptionClass = exception.getClass();
      if (logger.isTraceEnabled()) {
         logger.trace("Trying to find handler for exception of type [" + exceptionClass.getName() + "]");
      }
      Method handler = this.exceptionHandlerMap.get(exceptionClass);
      while (handler == null && exceptionClass != Throwable.class) {
         exceptionClass = exceptionClass.getSuperclass();
         handler = this.exceptionHandlerMap.get(exceptionClass);
      }
      if (handler != null && logger.isTraceEnabled()) {
         logger.trace("Found handler for exception of type [" + exceptionClass.getName() + "]: " + handler);
      }
      return handler;
   }
   private void invokeHandlerMethod(MethodInvocation mi, Throwable ex, Method method) throws Throwable {
      Object[] handlerArgs;
      if (method.getParameterCount() == 1) {
         handlerArgs = new Object[] {ex};
      }
      else {
         handlerArgs = new Object[] {mi.getMethod(), mi.getArguments(), mi.getThis(), ex};
      }
      try {
         method.invoke(this.throwsAdvice, handlerArgs);
      }
      catch (InvocationTargetException targetEx) {
         throw targetEx.getTargetException();
      }
   }
}
```

通过ThrowsAdviceInterceptor的源码可知，如果要拦截方法调用是的异常，通知需要实现ThrowsAdvice并且添加一个名为afterThrowing的方法其参数也有严格要求，有两种可选，一种是一个参数的，此时参数为调用目标方法抛出的异常，另一种是四个参数的，参数依次为目标方法Method、方法参数Object[]、目标对象、调用目标方法抛出的异常Throwable。

#### 4.2、使用ReflectiveMethodInvocation为目标对象应用拦截器链

上一步中取得拦截器链后传入ReflectiveMethodInvocation构造器后执行它的proceed()方法，拦截器就是在这个方法内生效的。

```java
public class ReflectiveMethodInvocation implements ProxyMethodInvocation, Cloneable {
   /**
    * Construct a new ReflectiveMethodInvocation with the given arguments.
    * @param proxy the proxy object that the invocation was made on
    * @param target the target object to invoke
    * @param method the method to invoke
    * @param arguments the arguments to invoke the method with
    * @param targetClass the target class, for MethodMatcher invocations
    * @param interceptorsAndDynamicMethodMatchers interceptors that should be applied,
    * along with any InterceptorAndDynamicMethodMatchers that need evaluation at runtime.
    * MethodMatchers included in this struct must already have been found to have matched
    * as far as was possibly statically. Passing an array might be about 10% faster,
    * but would complicate the code. And it would work only for static pointcuts.
    */
   protected ReflectiveMethodInvocation(
         Object proxy, @Nullable Object target, Method method, @Nullable Object[] arguments,
         @Nullable Class<?> targetClass, List<Object> interceptorsAndDynamicMethodMatchers) {
      this.proxy = proxy;
      this.target = target;
      this.targetClass = targetClass;
      this.method = BridgeMethodResolver.findBridgedMethod(method);
      this.arguments = AopProxyUtils.adaptArgumentsIfNecessary(method, arguments);
      this.interceptorsAndDynamicMethodMatchers = interceptorsAndDynamicMethodMatchers;
   }
   @Override
   @Nullable
   public Object proceed() throws Throwable {
      // We start with an index of -1 and increment early.
      //没有拦截器就直接调用目标对象的原始方法
      if (this.currentInterceptorIndex == this.interceptorsAndDynamicMethodMatchers.size() - 1) {
         return invokeJoinpoint();
      }
      Object interceptorOrInterceptionAdvice =
            this.interceptorsAndDynamicMethodMatchers.get(++this.currentInterceptorIndex);
      if (interceptorOrInterceptionAdvice instanceof InterceptorAndDynamicMethodMatcher) {
         //如果拦截器是InterceptorAndDynamicMethodMatcher类型，需要在方法调用时再次使用methodMatcher
         //来判断是否可以拦截此方法，只不过这次调用methodMatcher的matches()方法为三个参数的
         InterceptorAndDynamicMethodMatcher dm =
               (InterceptorAndDynamicMethodMatcher) interceptorOrInterceptionAdvice;
         Class<?> targetClass = (this.targetClass != null ? this.targetClass : this.method.getDeclaringClass());
         if (dm.methodMatcher.matches(this.method, targetClass, this.arguments)) {
            return dm.interceptor.invoke(this);
         }
         else {
            // Dynamic matching failed.
            // Skip this interceptor and invoke the next in the chain.
            return proceed();
         }
      }
      else {
         // It's an interceptor, so we just invoke it: The pointcut will have
         // been evaluated statically before this object was constructed.
         return ((MethodInterceptor) interceptorOrInterceptionAdvice).invoke(this);
      }
   }
}
```

## 5、CGLIB生成的代理对象

在AopProxy接口实现中,可以看到使用CGLIB来生成Proxy代理对象,这个Proxy代理对象的生成可以在ObjenesisCglibAopProxy的代码实现中看到,同样是在 AopProxy的接口方法getProxy的实现中完成的。ObjenesisCglibAopProxy继承了CglibAopProxy重写了createProxyClassAndInstance()方法支持不需要通过构造器来实例化对象的功能。

```java
@Override
public Object getProxy() {
   return getProxy(null);
}
@Override
public Object getProxy(@Nullable ClassLoader classLoader) {
   if (logger.isTraceEnabled()) {
      logger.trace("Creating CGLIB proxy: " + this.advised.getTargetSource());
   }
   try {
      Class<?> rootClass = this.advised.getTargetClass();
      Assert.state(rootClass != null, "Target class must be available for creating a CGLIB proxy");
      Class<?> proxySuperClass = rootClass;
      if (ClassUtils.isCglibProxyClass(rootClass)) {
         proxySuperClass = rootClass.getSuperclass();
         Class<?>[] additionalInterfaces = rootClass.getInterfaces();
         for (Class<?> additionalInterface : additionalInterfaces) {
            this.advised.addInterface(additionalInterface);
         }
      }
      // Validate the class, writing log messages as necessary.
      validateClassIfNecessary(proxySuperClass, classLoader);
      // Configure CGLIB Enhancer...
      //这个enhancer是CGLIB的主要操作类
      Enhancer enhancer = createEnhancer();
      if (classLoader != null) {
         enhancer.setClassLoader(classLoader);
         if (classLoader instanceof SmartClassLoader &&
               ((SmartClassLoader) classLoader).isClassReloadable(proxySuperClass)) {
            enhancer.setUseCache(false);
         }
      }
      //设置Enhancer对象，包括设置代理接口、回调方法
      enhancer.setSuperclass(proxySuperClass);
      //JdkDynamicAopProxy分析过了
      enhancer.setInterfaces(AopProxyUtils.completeProxiedInterfaces(this.advised));
      enhancer.setNamingPolicy(SpringNamingPolicy.INSTANCE);
      enhancer.setStrategy(new ClassLoaderAwareUndeclaredThrowableStrategy(classLoader));
      //CGLIB的回调是Callback的实例
      Callback[] callbacks = getCallbacks(rootClass);
      Class<?>[] types = new Class<?>[callbacks.length];
      for (int x = 0; x < types.length; x++) {
         types[x] = callbacks[x].getClass();
      }
      // fixedInterceptorMap only populated at this point, after getCallbacks call above
      //决定哪些方法使用哪些Callback
      enhancer.setCallbackFilter(new ProxyCallbackFilter(
            this.advised.getConfigurationOnlyCopy(), this.fixedInterceptorMap, this.fixedInterceptorOffset));
      enhancer.setCallbackTypes(types);
      // Generate the proxy class and create a proxy instance.
      return createProxyClassAndInstance(enhancer, callbacks);
   }
   catch (CodeGenerationException | IllegalArgumentException ex) {
      throw new AopConfigException("Could not generate CGLIB subclass of " + this.advised.getTargetClass() +
            ": Common causes of this problem include using a final class or a non-visible class",
            ex);
   }
   catch (Throwable ex) {
      // TargetSource.getTarget() failed
      throw new AopConfigException("Unexpected AOP exception", ex);
   }
}
```

在Enhancer的Callback回调设置中,实际上是通过设置DynamicAdvisedInterceptor拦截器来完成AOP功能的,可以在getCallbacks()方法实现中看到回调 DynamicAdvisedInterceptor的设置。

```java
private Callback[] getCallbacks(Class<?> rootClass) throws Exception {
   // Parameters used for optimization choices...
   boolean exposeProxy = this.advised.isExposeProxy();
   boolean isFrozen = this.advised.isFrozen();
   boolean isStatic = this.advised.getTargetSource().isStatic();
   // Choose an "aop" interceptor (used for AOP calls).
   Callback aopInterceptor = new DynamicAdvisedInterceptor(this.advised);
   // Choose a "straight to target" interceptor. (used for calls that are
   // unadvised but can return this). May be required to expose the proxy.
   Callback targetInterceptor;
   if (exposeProxy) {
      targetInterceptor = (isStatic ?
            new StaticUnadvisedExposedInterceptor(this.advised.getTargetSource().getTarget()) :
            new DynamicUnadvisedExposedInterceptor(this.advised.getTargetSource()));
   }
   else {
      targetInterceptor = (isStatic ?
            new StaticUnadvisedInterceptor(this.advised.getTargetSource().getTarget()) :
            new DynamicUnadvisedInterceptor(this.advised.getTargetSource()));
   }
   // Choose a "direct to target" dispatcher (used for
   // unadvised calls to static targets that cannot return this).
   Callback targetDispatcher = (isStatic ?
         new StaticDispatcher(this.advised.getTargetSource().getTarget()) : new SerializableNoOp());
   Callback[] mainCallbacks = new Callback[] {
         aopInterceptor,  // for normal advice
         targetInterceptor,  // invoke target without considering advice, if optimized
         new SerializableNoOp(),  // no override for methods mapped to this
         targetDispatcher, this.advisedDispatcher,
         new EqualsInterceptor(this.advised),
         new HashCodeInterceptor(this.advised)
   };
   Callback[] callbacks;
   // If the target is a static one and the advice chain is frozen,
   // then we can make some optimizations by sending the AOP calls
   // direct to the target using the fixed chain for that method.
   if (isStatic && isFrozen) {
      Method[] methods = rootClass.getMethods();
      Callback[] fixedCallbacks = new Callback[methods.length];
      this.fixedInterceptorMap = new HashMap<>(methods.length);
      // TODO: small memory optimization here (can skip creation for methods with no advice)
      for (int x = 0; x < methods.length; x++) {
         List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(methods[x], rootClass);
         fixedCallbacks[x] = new FixedChainStaticTargetInterceptor(
               chain, this.advised.getTargetSource().getTarget(), this.advised.getTargetClass());
         this.fixedInterceptorMap.put(methods[x].toString(), x);
      }
      // Now copy both the callbacks from mainCallbacks
      // and fixedCallbacks into the callbacks array.
      callbacks = new Callback[mainCallbacks.length + fixedCallbacks.length];
      System.arraycopy(mainCallbacks, 0, callbacks, 0, mainCallbacks.length);
      System.arraycopy(fixedCallbacks, 0, callbacks, mainCallbacks.length, fixedCallbacks.length);
      this.fixedInterceptorOffset = mainCallbacks.length;
   }
   else {
      callbacks = mainCallbacks;
   }
   return callbacks;
}
```

在分析CglibAopProxy的AopProxy代理对象生成的时候,我们了解到对于AOP的拦截调用,其回调是在DynamicAdvisedInterceptor对象中实现的,这个回调的实现在intercept()方法中。CglibAopProxy的intercept回调方法的实现和JdkDynamicAopProxy的回调实现是非常类似的,只是在CglibAopProxy中构造CglibMethodInvocation对象来完成拦截器链的调用,而在JdkDynamicAopProxy中是通过构造 ReflectiveMethodInvocation对象来完成这个功能的。

```java
private static class DynamicAdvisedInterceptor implements MethodInterceptor, Serializable {
   private final AdvisedSupport advised;
   public DynamicAdvisedInterceptor(AdvisedSupport advised) {
      this.advised = advised;
   }
   @Override
   @Nullable
   public Object intercept(Object proxy, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
      Object oldProxy = null;
      boolean setProxyContext = false;
      Object target = null;
      TargetSource targetSource = this.advised.getTargetSource();
      try {
         if (this.advised.exposeProxy) {
            // Make invocation available if necessary.
            oldProxy = AopContext.setCurrentProxy(proxy);
            setProxyContext = true;
         }
         // Get as late as possible to minimize the time we "own" the target, in case it comes from a pool...
         target = targetSource.getTarget();
         Class<?> targetClass = (target != null ? target.getClass() : null);
         //从advised中取得配置好的AOP通知
         List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(method, targetClass);
         Object retVal;
         // Check whether we only have one InvokerInterceptor: that is,
         // no real advice, but just reflective invocation of the target.
         if (chain.isEmpty() && Modifier.isPublic(method.getModifiers())) {
            // We can skip creating a MethodInvocation: just invoke the target directly.
            // Note that the final invoker must be an InvokerInterceptor, so we know
            // it does nothing but a reflective operation on the target, and no hot
            // swapping or fancy proxying.
            Object[] argsToUse = AopProxyUtils.adaptArgumentsIfNecessary(method, args);
            retVal = methodProxy.invoke(target, argsToUse);
         }
         else {
            // We need to create a method invocation...
            //通过CglibMethodInvocation启用通知
            retVal = new CglibMethodInvocation(proxy, target, method, args, targetClass, chain, methodProxy).proceed();
         }
         retVal = processReturnType(proxy, target, method, retVal);
         return retVal;
      }
      finally {
         if (target != null && !targetSource.isStatic()) {
            targetSource.releaseTarget(target);
         }
         if (setProxyContext) {
            // Restore old proxy.
            AopContext.setCurrentProxy(oldProxy);
         }
      }
   }
   @Override
   public boolean equals(Object other) {
      return (this == other ||
            (other instanceof DynamicAdvisedInterceptor &&
                  this.advised.equals(((DynamicAdvisedInterceptor) other).advised)));
   }
   @Override
   public int hashCode() {
      return this.advised.hashCode();
   }
}
```

使用CglibMethodInvocation和JdkDynamicAopProxy中ReflectiveMethodInvocation的实现方式类似不在废话。
