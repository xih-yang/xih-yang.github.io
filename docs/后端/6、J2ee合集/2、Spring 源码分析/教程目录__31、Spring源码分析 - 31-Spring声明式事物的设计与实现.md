# 31、Spring源码分析 - 31-Spring声明式事物的设计与实现
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/31.html
- 分类：J2EE框架
- 分组：教程目录
## 1、设计原理与基本过程

在使用Spring声明式事务处理的时候,一种常用的方法是结合IoC容器和Spring已有的TransactionProxyFactoryBean对事务管理进行配置,比如,可以在这个TransactionProxyFactoryBean中为事务方法配置传播行为、并发事务隔离级别等事务处理属性,从而对声明式事务的处理提供指导。具体来说,在以下的内容中,在对声明式事务处理的原理分析中,声明式事务处理的实现大致可以分为以下几个部分:

- 读取和处理在IoC容器中配置的事务处理属性,并转化为Spring事务处理需要的内部数据结构。具体来说,这里涉及的类是TransactionAttributeSourceAdvisor,从名字可以看出,它是一个AOP通知器, Spring使用这个通知器来完成对事务处理属性值的处理。处理的结果是,在IoC容器中配置的事务处理属性信息,会被读入并转化成TransactionAttribute表示的数据对象,这个数据对象是Spring对事物处理属性值的数据抽象,对这些属性的处理是和TransactionProxyFactoryBean拦截下来的事务方法的处理结合起来的。
- Spring事务处理模块实现统一的事务处理过程。这个通用的事务处理过程包含处理事务配置属性,以及与线程绑定完成事务处理的过程, Spring通过TransactionInfo和TransactionStatus这两个数据对象,在事务处理过程中记录和传递相关执行场景。
- 底层的事务处理实现。对于底层的事务操作,Spring委托给具体的事务处理器来完成,这些具体的事务处理器,就是在IoC容器中配置声明式事务处理时,配置的PlatformTransactionManager的具体实现,比如 DataSourceTransactionManager和HibernateTransactionManager等。

## 2、实现分析

#### 2.1、事务处理拦截器的配置

和前面的思路一样,从声明式事务处理的基本用法入手,来了解它的基本实现原理。大家都已经很熟悉了,在使用声明式事务处理的时候,需要在IoC容器中配置TransactionProxyFactoryBean,这是一个FactoryBean,对于FactoryBean这个在Spring中经常使用的工厂Bean,大家一定不会陌生。看到FactoryBean,毫无疑问,会让大家立刻想起它的getObject()方法,但关于具体是怎样建立起事务处理的对象机制的,可以通过下面的时序图进行了解。

在IoC容器进行注入的时候,会创建TransactionInterceptor对象,而这个对象会创建一个TransactionAttributePointcut,为读取 TransactionAttribute做准备。在容器初始化的过程中,由于实现了InitializingBean接口,因此AbstractSingletonProxyFactoryBean会实现afterPropertiesSet()方法,正是在这个方法实例化了一个ProxyFactory,建立起 Spring AOP的应用,在这里,会为这个 ProxyFactory设置通知、目标对象,并最终返回 Proxy代理对象。在 Proxy代理对象建立起来以后,在调用其代理方法的时候,会调用相应的TransactionInterceptor拦截器,在这个调用中,会根据TransactionAttribute配置的事务属性进行配置,从而为事务处理做好准备。

从TransactionProxyFactoryBean人手,通过代码实现来了解 Spring是如何通过AOP功能来完成事务管理配置的。

从代码中可以看到,Spring为声明式事务处理的实现所做的一些准备工作:包括为AOP配置基础设施,这些基础设施包括设置拦截器TransactionInterceptor、通知器DefaultPointcutadvisor或TransactionAttributeSourceAdvisor。同时,在TransactionProxyFactoryBean的实现中,还可以看到注入进来的PlatformransactionManager和事务处理属性TransactionAttribute等。

```java
public class TransactionProxyFactoryBean extends AbstractSingletonProxyFactoryBean
      implements BeanFactoryAware {
   //这个拦截器TransactionInterceptor通过AOP发挥作用,通过这个拦截器的实现, 
   //Spring封装了事务处理实现,关于它的具体实现,下面会详细地分析
   private final TransactionInterceptor transactionInterceptor = new TransactionInterceptor();
   @Nullable
   private Pointcut pointcut;
   //通过依赖注入的PlatformTransactionManager
   public void setTransactionManager(PlatformTransactionManager transactionManager) {
      this.transactionInterceptor.setTransactionManager(transactionManager);
   }
   //通过依赖注入的事务属性以Properties的形式出现把从BeanDefinition中读到的事务管理的属性信息注入到TransactionInterceptor中
   public void setTransactionAttributes(Properties transactionAttributes) {
      this.transactionInterceptor.setTransactionAttributes(transactionAttributes);
   }
   public void setTransactionAttributeSource(TransactionAttributeSource transactionAttributeSource) {
      this.transactionInterceptor.setTransactionAttributeSource(transactionAttributeSource);
   }
   public void setPointcut(Pointcut pointcut) {
      this.pointcut = pointcut;
   }
   @Override
   public void setBeanFactory(BeanFactory beanFactory) {
      this.transactionInterceptor.setBeanFactory(beanFactory);
   }
   /**
    * Creates an advisor for this FactoryBean's TransactionInterceptor.
    */
   @Override
   protected Object createMainInterceptor() {
      this.transactionInterceptor.afterPropertiesSet();
      if (this.pointcut != null) {
         //如果设置了pointcut使用通知器DefaultPointcutAdvisor,并为通知器配置事务处理拦截器
         return new DefaultPointcutAdvisor(this.pointcut, this.transactionInterceptor);
      }
      else {
         //如果没有配置pointcut,使用TranBactionAttributesourceAdvisor作为默认通知器,
         //并为通知器设置 TransactionInterceptor作为拦截器
         return new TransactionAttributeSourceAdvisor(this.transactionInterceptor);
      }
   }
   /**
    * As of 4.2, this method adds {@link TransactionalProxy} to the set of
    * proxy interfaces in order to avoid re-processing of transaction metadata.
    */
   @Override
   protected void postProcessProxyFactory(ProxyFactory proxyFactory) {
      proxyFactory.addInterface(TransactionalProxy.class);
   }
}
```

以上代码完成了AOP配置,对于用户来说,一个值得关心的问题是, Spring的TransactionInterceptor配置是在什么时候被启动并成为 Advisor通知器的一部分的呢?从对createMainInterceptor方法的调用分析中可以看到,这个createMainInterceptor方法在loC容器

完成Bean的依赖注入时,通过initializeBean方法被调用。

在TransactionProxyFactoryBean父类AbstractSingletonProxyFactoryBean中看到的afterPropertiesSet方法,是Spring事务处理完成AOP配置的地方,这个afterPropertiesSet方法的功能实现如下。

```java
@Override
public void afterPropertiesSet() {
   if (this.target == null) {
      throw new IllegalArgumentException("Property 'target' is required");
   }
   if (this.target instanceof String) {
      throw new IllegalArgumentException("'target' needs to be a bean reference, not a bean name as value");
   }
   if (this.proxyClassLoader == null) {
      this.proxyClassLoader = ClassUtils.getDefaultClassLoader();
   }
   //TransactionProxyFactoryBean使用PrOxyFactory完成AOP的基本功能
   //这个ProxyFactory提供Proxy对象,并将TransactionInterceptor设置为target方法调用的拦截器
   ProxyFactory proxyFactory = new ProxyFactory();
   if (this.preInterceptors != null) {
      for (Object interceptor : this.preInterceptors) {
         proxyFactory.addAdvisor(this.advisorAdapterRegistry.wrap(interceptor));
      }
   }
   //这里是Spring加入通知器的地方可以加入两种通知器,分别是DefaultPointcutAdvisor和TransactionAttributeSourceAdvisoyr
   //这里调用TransactionProxyFactoryBean的createMainInterceptor方法来生成需要的Advisors
   //在ProxyFactory的基类AdvisedSupport中,维护了一个用来持有advice的LinkedList,
   //通过对这个LinkedList的元素执行添加、修改、删除等操作,用来管理配置给ProxyFactory的通知器
   proxyFactory.addAdvisor(this.advisorAdapterRegistry.wrap(createMainInterceptor()));
   if (this.postInterceptors != null) {
      for (Object interceptor : this.postInterceptors) {
         proxyFactory.addAdvisor(this.advisorAdapterRegistry.wrap(interceptor));
      }
   }
   proxyFactory.copyFrom(this);
   //这里创建AOP的目标源,与在其他地方使用ProxyFactory没有什么差别
   TargetSource targetSource = createTargetSource(this.target);
   proxyFactory.setTargetSource(targetSource);
   if (this.proxyInterfaces != null) {
      proxyFactory.setInterfaces(this.proxyInterfaces);
   }
   else if (!isProxyTargetClass()) {
      // Rely on AOP infrastructure to tell us what interfaces to proxy.
      Class<?> targetClass = targetSource.getTargetClass();
      if (targetClass != null) {
         proxyFactory.setInterfaces(ClassUtils.getAllInterfacesForClass(targetClass, this.proxyClassLoader));
      }
   }
   //TransactionProxyFactoryBean中proxyFactory.addInterface(TransactionalProxy.class);
   postProcessProxyFactory(proxyFactory);
   //代理对象Proxy
   this.proxy = proxyFactory.getProxy(this.proxyClassLoader);
}
```

在代码中可以看到,在建立TransactionProxyFactoryBean的事务处理拦截器的时候,首先需要对ProxyFactoryBean的目标Bean设置进行检查,如果这个目标Bean的设置是正确的,就会创建个ProxyFactory对象,从而实现AOP的使用。在afterPropertiesSet的方法实现中,可以看到为ProxyFactory生成代理对象、配置通知器、设置代理接口方法等。

可以看到,通过以上的一系列步骤, Spring为实现事务处理而设计的拦截器TransctionInterceptor已经设置到ProxyFactory生成的AOP代理对象中去了,这里的TransactionInterceptor是作为 AOP Advice的拦截器来实现它的功能的。在IoC容器中,配置其他与事务处理有关的属性,比如,比较熟悉的JtransactionManager和事务处理的属性,也同样会被设置到已经定义好的 TransactionInterceptor中去。这些属性配置在TransactionInterceptor对事务方法进行拦截时会起作用。在AOP配置完成以后,可以看到,在 Spring声明式事务处理实现中的一些重要的类已经悄然登场,比如TransactionattributeSourceAdvisor和TransactionInterceptor。正是这些类通过AOP封装了 Spring对事务处理的基本实现,有了这些基础的知识,下面就可以详细地分析这些类的具体实现。

#### 2.2、事务处理配置的读入

在AOP配置完成的基础上,以TransactionAttributeSourceAdvisor的实现为入口,了解具体的事务属性配置是如何读入的,具体实现如下。

```java
public class TransactionAttributeSourceAdvisor extends AbstractPointcutAdvisor {
   //与其他Advisor一样,同样需要定义AOP中用到的Interceptor和Pointcut
   //Interceptor使用的是已经见过的拦截器: TransactionInterceptor
   @Nullable
   private TransactionInterceptor transactionInterceptor;
   //对于pointcut,这里定义了一个内部类TransactionAttributeSourcepointcut
   private final TransactionAttributeSourcePointcut pointcut = new TransactionAttributeSourcePointcut() {
      @Override
      @Nullable
      protected TransactionAttributeSource getTransactionAttributeSource() {
         //这里通过调用transactionInterceptor来得到事务的配置属性,在对Proxy的方法进行匹配调用时,会使用到这些配置属性
         // TransactionAttributeSource是通过TransactionProxyFactoryBean的setTransactionAttributes或setTransactionAttributeSource配置的
         return (transactionInterceptor != null ? transactionInterceptor.getTransactionAttributeSource() : null);
      }
   };
   public TransactionAttributeSourceAdvisor() {
   }
   public TransactionAttributeSourceAdvisor(TransactionInterceptor interceptor) {
      setTransactionInterceptor(interceptor);
   }
   public void setTransactionInterceptor(TransactionInterceptor interceptor) {
      this.transactionInterceptor = interceptor;
   }
   public void setClassFilter(ClassFilter classFilter) {
      this.pointcut.setClassFilter(classFilter);
   }
   @Override
   public Advice getAdvice() {
      Assert.state(this.transactionInterceptor != null, "No TransactionInterceptor set");
      return this.transactionInterceptor;
   }
   @Override
   public Pointcut getPointcut() {
      return this.pointcut;
   }
}
```

在声明式事务处理中,通过对目标对象的方法调用进行拦截实现,这个拦截通过AOP发挥作用。在AOP中,对于拦截的启动,首先需要对方法调用是否需要拦截进行判断,而判断的依据是那些在TransactionProxyFactoryBean中为目标对象设置的事务属性。也就是说需要判断当前的目标方法调用是不是一个配置好的并且需要进行事务处理的方法调用。具体来说,这个匹配判断在TransactionAttributeSourcePointcut中完成。

```java
abstract class TransactionAttributeSourcePointcut extends StaticMethodMatcherPointcut implements Serializable {
   @Override
   public boolean matches(Method method, Class<?> targetClass) {
      if (TransactionalProxy.class.isAssignableFrom(targetClass) ||
            PlatformTransactionManager.class.isAssignableFrom(targetClass) ||
            PersistenceExceptionTranslator.class.isAssignableFrom(targetClass)) {
         return false;
      }
      TransactionAttributeSource tas = getTransactionAttributeSource();
      return (tas == null || tas.getTransactionAttribute(method, targetClass) != null);
   }
   @Nullable
   protected abstract TransactionAttributeSource getTransactionAttributeSource();
}
```

在这个为事务处理服务的TransactionAttributeSourcePointcut的matches()方法实现中,首先把事务方法的属性配置读取到 TransactionAttributeSource对象中,有了这些事务处理的配置以后,根据当前方法调用的 Method对象和目标对象,对是否需要启动事务处理拦截器进行判断。

在Pointcut的matches()判断过程中,会用到transactionAttributeSource对象,这个transactionAttributeSource对象是在对TransactionInterceptor进行依赖注入时就配置好的。它的设置是在TransactionInterceptor的基类TransactionAspectSupport中完成的,如果是通过Properties配置事物属性的话配置的是一个NameMatchTransactionAttributeSource对象,这个配置过程下。

```java
//设置属性，方法名作为键，事务属性描述符(通过TransactionAttributeEditor解析)作为值:
//例如key = "myMethod"， value = "PROPAGATION_REQUIRED,readOnly"。
//注意:方法名总是应用于目标类，无论是否在接口或类本身中定义。在内部，将从给定的属性创建NameMatchTransactionAttributeSource。
public void setTransactionAttributes(Properties transactionAttributes) {
   NameMatchTransactionAttributeSource tas = new NameMatchTransactionAttributeSource();
   tas.setProperties(transactionAttributes);
   this.transactionAttributeSource = tas;
}
```

在以上的代码实现中,可以看到,NameMatchTransactionAttributeSource作为TransactionAttributeSource的具体实现,是实际完成事务处理属性读入和匹配的地方。对于NameMatchTransactionAttributeSource是怎样实现事务处理属性的读入和匹配的,可以在下面代码中看到。

```java
public class NameMatchTransactionAttributeSource implements TransactionAttributeSource, Serializable {
   protected static final Log logger = LogFactory.getLog(NameMatchTransactionAttributeSource.class);
   /** Keys are method names; values are TransactionAttributes. */
   private Map<String, TransactionAttribute> nameMap = new HashMap<>();
   //设置名称/属性的Map，由方法名称和TransactionAttribute实例(或要转换为TransactionAttribute实例的字符串)组成。
   public void setNameMap(Map<String, TransactionAttribute> nameMap) {
      nameMap.forEach(this::addTransactionalMethod);
   }
   //设置属性的方法
   public void setProperties(Properties transactionAttributes) {
      TransactionAttributeEditor tae = new TransactionAttributeEditor();
      Enumeration<?> propNames = transactionAttributes.propertyNames();
      while (propNames.hasMoreElements()) {
         String methodName = (String) propNames.nextElement();
         String value = transactionAttributes.getProperty(methodName);
         tae.setAsText(value);
         TransactionAttribute attr = (TransactionAttribute) tae.getValue();
         addTransactionalMethod(methodName, attr);
      }
   }
   //为事务方法添加属性。
   //方法名可以是精确匹配的，也可以是匹配多个方法的模式“xxx*”、“*xxx”或“*xxx*”。
   public void addTransactionalMethod(String methodName, TransactionAttribute attr) {
      if (logger.isDebugEnabled()) {
         logger.debug("Adding transactional method [" + methodName + "] with attribute [" + attr + "]");
      }
      this.nameMap.put(methodName, attr);
   }
   //对调用的方法进行判断,判断它是否是事务方法,如果是事务方法,那么取出相应的事务配置属性
   @Override
   @Nullable
   public TransactionAttribute getTransactionAttribute(Method method, @Nullable Class<?> targetClass) {
      if (!ClassUtils.isUserLevelMethod(method)) {
         return null;
      }
      //判断当前目标调用的方法与配置的事务方法是否直接匹配
      String methodName = method.getName();
      TransactionAttribute attr = this.nameMap.get(methodName);
      //如果不能直接匹配,就通过调用PatternMatchUtils的simpleMatch()方法来进行匹配判断
      if (attr == null) {
         // Look for most specific name match.
         String bestNameMatch = null;
         for (String mappedName : this.nameMap.keySet()) {
            if (isMatch(methodName, mappedName) &&
                  (bestNameMatch == null || bestNameMatch.length() <= mappedName.length())) {
               attr = this.nameMap.get(mappedName);
               bestNameMatch = mappedName;
            }
         }
      }
      return attr;
   }
   //如果给定的方法名与映射名匹配，则返回。
   //默认实现检查“xxx*”、“*xxx”和“*xxx*”匹配，以及直接相等。可以在子类中重写。
   protected boolean isMatch(String methodName, String mappedName) {
      return PatternMatchUtils.simpleMatch(mappedName, methodName);
   }
}
```

在对事务属性TransactionAttribυutes进行设置时,会从事务处理属性配置中读取事务方法名和配置属性,在得到配置的事务方法名和属性以后,会把它们作为键值对加入到一个nameMap中。

在应用调用目标方法的时候,因为这个目标方法已经被TransactionProxyFactoryBean代理,所以TransactionProxyFactoryBean需要判断这个调用方法是否是事务方法。这个判断的实现,是通过在NameMatchTransactionAttributeSource中能否为这个调用方法返回事务属性来完成的。具体的实现过程是这样的:首先,以调用方法名为索引在nameMap中查找相应的事务处理属性值,如果能够找到,那么就说明该调用方法和事务方法是直接对应的,如果找不到,那么就会遍历整个nameMap,对保存在nameMap中的每一个方法名,使用PatternMatchUtils的simpleMatch()方法进行命名模式上的匹配。这里使用PatternMatchUtils进行匹配的原因是,在设置事务方法的时候,可以不需要为事务方法设置一个完整的方法名,而可以通过设置方法名的命名模式来完成,比如可以通过对通配符“*”的使用等。所以,如果直接通过方法名没能够匹配上,而通过方法名的命名模式能够匹配上,这个方法也是需要进行事务处理的方法,相对应地,它所配置的事务处理属性也会从nameMap中取出来,从而触发事务处理拦截器的拦截。

通过以上过程可以得到与目标对象调用方法相关的TransactionAttribute对象,在这个对象中,封装了事务处理的配置。具体来说,在前面的匹配过程中,如果匹配返回的结果是null,那么说明当前的调用方法不是一个事务方法,不需要纳入Spring统一的事务管理中,

因为它并没有配置在TransactionProxyFactoryBean的事务处理设置中。如果返回的TransactionAttribute对象不是null,那么这个返回的TransactionAttribute对象就已经包含了对事务方法的配置信息,对应这个事务方法的具体事务配置也已经读入到TransactionAttribute对象中了,为 TransactionInterceptor做好了对调用的目标方法添加事务处理的准备。

#### 2.3、事务处理拦截器的设计与实现

在完成以上的准备工作以后,经过TransactionProxyFactoryBean的AOP包装,此时如果对目标对象进行方法调用,起作用的对象实际上是一个Proxy代理对象,对目标对象方法的调用,不会直接作用在TransactionProxyFactoryBean设置的目标对象上,而会被设置的事务处理拦截器拦截。而在TransactionProxyFactoryBean的AOP实现中,获取Proxy对象的过程并不复杂,TransactionProxyFactoryBean作为一个FactoryBean,对这个Bean的对象的引用是通过调用TransactionProxyFactoryBean的 getObject()方法来得到的。

```java
@Override
public Object getObject() {
   if (this.proxy == null) {
      throw new FactoryBeanNotInitializedException();
   }
   return this.proxy;
}
```

关于如何对AOP代理起作用,如果还有印象,大家会注意到一个重要的 invoke()方法,这个invoked()方法是Poxy代理对象的回调方法,在调用Proxy对象的代理方法时触发这个回调。

在事务处理拦截器TransactionInterceptor中, invoke()方法的实现如下所示。

```java
@Override
@Nullable
public Object invoke(MethodInvocation invocation) throws Throwable {
   //计算出目标类:可能是{@code null}。
   //TransactionAttributeSource应该传递目标类和方法(可能来自接口)。
   Class<?> targetClass = (invocation.getThis() != null ? AopUtils.getTargetClass(invocation.getThis()) : null);
   // Adapt to TransactionAspectSupport's invokeWithinTransaction...
   return invokeWithinTransaction(invocation.getMethod(), targetClass, invocation::proceed);
}
@Nullable
protected Object invokeWithinTransaction(Method method, @Nullable Class<?> targetClass,
      final InvocationCallback invocation) throws Throwable {
   TransactionAttributeSource tas = getTransactionAttributeSource();
   //如果事物属性是null，这个方法则是非事物方法
   final TransactionAttribute txAttr = (tas != null ? tas.getTransactionAttribute(method, targetClass) : null);
   final PlatformTransactionManager tm = determineTransactionManager(txAttr);
   final String joinpointIdentification = methodIdentification(method, targetClass, txAttr);
   //这里区分不同类型的PlatformTransactionManager,因为它们的调用方式不同
   //对CallbackPreferringPlatformTransactionManager来说,需要回调函数来实现事务的创建和提交
   //对非CallbackPreferringPlatformTransactionManager来说,不需要通过回调函数来实现事务的创建和提交
   //像DataSourceTransactionManager就不是CallbackPreferringPlatformTransactionManager不需要通过回调的方式来使用
   if (txAttr == null || !(tm instanceof CallbackPreferringPlatformTransactionManager)) {
      // Standard transaction demarcation with getTransaction and commit/rollback calls.
      TransactionInfo txInfo = createTransactionIfNecessary(tm, txAttr, joinpointIdentification);
      Object retVal = null;
      try {
         //这是一个环绕通知，这里的调用使处理沿着拦截器链进行,使最后目标对象的方法得到调用
         retVal = invocation.proceedWithInvocation();
      }
      catch (Throwable ex) {
         //如果在事务处理方法调用中出现了异常,事务处理如何进行需要根据具体的情况考虑回滚或者提交
         completeTransactionAfterThrowing(txInfo, ex);
         throw ex;
      }
      finally {
         ///这里把与线程绑定的TransactionInfo设置为oldrransationinfo
         cleanupTransactionInfo(txInfo);
      }
      //这里通过事务处理器来对事务进行提交
      commitTransactionAfterReturning(txInfo);
      return retVal;
   }
   else {
      final ThrowableHolder throwableHolder = new ThrowableHolder();
      //到这就是一个CallbackPreferringPlatformTransactionManager采用回调的方法来使用事务处理器
      try {
         Object result = ((CallbackPreferringPlatformTransactionManager) tm).execute(txAttr, status -> {
            TransactionInfo txInfo = prepareTransactionInfo(tm, txAttr, joinpointIdentification, status);
            try {
               return invocation.proceedWithInvocation();
            }
            catch (Throwable ex) {
               if (txAttr.rollbackOn(ex)) {
                  //RuntimeException异常将导致事物回滚
                  if (ex instanceof RuntimeException) {
                     throw (RuntimeException) ex;
                  }
                  else {
                     throw new ThrowableHolderException(ex);
                  }
               }
               else {
                  //正常的返回导致事物提交
                  throwableHolder.throwable = ex;
                  return null;
               }
            }
            finally {
               cleanupTransactionInfo(txInfo);
            }
         });
         // Check result state: It might indicate a Throwable to rethrow.
         if (throwableHolder.throwable != null) {
            throw throwableHolder.throwable;
         }
         return result;
      }
      catch (ThrowableHolderException ex) {
         throw ex.getCause();
      }
      catch (TransactionSystemException ex2) {
         if (throwableHolder.throwable != null) {
            logger.error("Application exception overridden by commit exception", throwableHolder.throwable);
            ex2.initApplicationException(throwableHolder.throwable);
         }
         throw ex2;
      }
      catch (Throwable ex2) {
         if (throwableHolder.throwable != null) {
            logger.error("Application exception overridden by commit exception", throwableHolder.throwable);
         }
         throw ex2;
      }
   }
}
//处理Throwable，完成事务。我们可以提交或回滚，这取决于配置。
protected void completeTransactionAfterThrowing(@Nullable TransactionInfo txInfo, Throwable ex) {
   if (txInfo != null && txInfo.getTransactionStatus() != null) {
      if (logger.isTraceEnabled()) {
         logger.trace("Completing transaction for [" + txInfo.getJoinpointIdentification() +
               "] after exception: " + ex);
      }
      if (txInfo.transactionAttribute != null && txInfo.transactionAttribute.rollbackOn(ex)) {
         try {
            txInfo.getTransactionManager().rollback(txInfo.getTransactionStatus());
         }
         catch (TransactionSystemException ex2) {
            logger.error("Application exception overridden by rollback exception", ex);
            ex2.initApplicationException(ex);
            throw ex2;
         }
         catch (RuntimeException | Error ex2) {
            logger.error("Application exception overridden by rollback exception", ex);
            throw ex2;
         }
      }
      else {
         //我们不会对这个异常进行回滚。如果TransactionStatus.isRollbackOnly()为真，则仍然回滚
         try {
            txInfo.getTransactionManager().commit(txInfo.getTransactionStatus());
         }
         catch (TransactionSystemException ex2) {
            logger.error("Application exception overridden by commit exception", ex);
            ex2.initApplicationException(ex);
            throw ex2;
         }
         catch (RuntimeException | Error ex2) {
            logger.error("Application exception overridden by commit exception", ex);
            throw ex2;
         }
      }
   }
}
```

可以看到,这个回调的实现是很清晰的,其过程是,首先获得调用方法的事务处理配置,这个取得事务处理配置的过程已经在前面分析过了,在得到事务处理配置以后,会取得配置的PlatformTransactionManager,由这个事务处理器来实现事务的创建、提交、回滚操作。

以事务提交为例,通过下面所示的时序图来简要的说明这个过程。在调用代理的事务方法时,因为前面已经完成了一系列AOP配置,对事务方法的调用,最终启动TransactionInterceptor拦截器的invoke()方法。在这个方法中,首先会读取该事务方法的事务属性配置,然后根据事务属性配置以及具体事务处理器的配置来决定采用哪一个事务处理器,这个事务处理器实际上是一个PlatformTransactionManager。在确定好具体的事务处理器之后,会根据事务的运行情况和事务配置来决定是不是需要创建新的事务。对于Spring而言,事务的管理实际上是通过一个TransactionInfo对象来完成的,在该对象中,封装了事务对象和事务处理的状态信息,这是事务处理的抽象。在这一步完成以后,会对拦截器链进行处理,因为有可能在该事务对象中还配置了除事务处理AOP之外的其他拦截器。在结束对拦截器链处理之后,会对 TransactionInfo中的信息进行更新,以反映最近的事务处理情况,在这个时候,也就

完成了事务提交的准备,通过调用事务处理器PlatformTransactionManager的commitTransactionAfterReturning方法来完成事务的提交。这个提交的处理过程已经封装在PlatformTransactionManager的事务处理器中了,而与具体数据源相关的处理过程,最终委托给相关的具体事务处理器来完成,比如 DataSourceTransactionManager、HibemateTransactionManager等。
