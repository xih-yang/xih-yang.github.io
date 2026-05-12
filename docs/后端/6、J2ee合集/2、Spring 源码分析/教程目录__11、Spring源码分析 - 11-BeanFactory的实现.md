# 11、Spring源码分析 - 11-BeanFactory的实现
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/11.html
- 分类：J2EE框架
- 分组：教程目录
其中BeanFactory 作为最顶层的一个接口类，它定义了 IOC 容器的基本功能规范，BeanFactory 有三个子类:ListableBeanFactory、HierarchicalBeanFactory 和 AutowireCapableBeanFactory。 但是从上图中我们可以发现最终的默认实现类是 DefaultListableBeanFactory，他实现了所有的接 口。那为何要定义这么多层次的接口呢?查阅这些接口的源码和说明发现，每个接口都有他使用的场合， 它主要是为了区分在 Spring 内部在操作过程中对象的传递和转化过程中，对对象的数据访问所做的限 制。例如 ListableBeanFactory 接口表示这些 Bean 是可列表的，而 HierarchicalBeanFactory表示的是这些 Bean 是有继承关系的，也就是每个 Bean 有可能有父 Bean。AutowireCapableBeanFactory接口定义 Bean 的自动装配规则。这四个接口共同定义了 Bean 的集合、Bean 之间的关系、以及 Bean 行为。BeanFactory是Spring容器实现的基础，访问Spring容器的根接口。每个bean都是通过string类型bean name进行标识.这边提供了设计模式单例,原型的替代实现。如果bean name配置为单例,应用内只会获取到一个实例。如果配置为原型,那么可以实例化好后填充属性(基于用户的配置)。

Bean Factory的实现应该尽可能的实现标准的Bean生命周期接口，完整的初始化方法标准顺序如下:

**1、** BeanNameAware's{@codesetBeanName}；

**2、** BeanClassLoaderAware's{@codesetBeanClassLoader}；

**3、** BeanFactoryAware's{@codesetBeanFactory}；

**4、** EnvironmentAware's{@codesetEnvironment}；

**5、** EmbeddedValueResolverAware's{@codesetEmbeddedValueResolver}；

**6、** ResourceLoaderAware's{@codesetResourceLoader}(onlyapplicablewhenrunninginanapplicationcontext)；

**7、** ApplicationEventPublisherAware's{@codesetApplicationEventPublisher}(onlyapplicablewhenrunninginanapplicationcontext)；

**8、** MessageSourceAware's{@codesetMessageSource}(onlyapplicablewhenrunninginanapplicationcontext)；

**9、** ApplicationContextAware's{@codesetApplicationContext}(onlyapplicablewhenrunninginanapplicationcontext)；

**10、** ServletContextAware's{@codesetServletContext}(onlyapplicablewhenrunninginawebapplicationcontext)；

**11、** {@codepostProcessBeforeInitialization}methodsofBeanPostProcessors；

**12、** InitializingBean's{@codeafterPropertiesSet}；

**13、** acustominit-methoddefinition；

**14、** {@codepostProcessAfterInitialization}methodsofBeanPostProcessors；

关闭Bean Factory时，执行下面的方法：

**1、** {@codepostProcessBeforeDestruction}methodsofDestructionAwareBeanPostProcessors；

**2、** DisposableBean's{@codedestroy}；

**3、** acustomdestroy-methoddefinition；

接口里定义了一个变量FACTORY_BEAN_PREFIX，用来区分是获取FactoryBean还是FactoryBean的createBean创建的实例。如果&开始则获取FactoryBean;否则获取createBean创建的实例。

```java
/**
 * Used to dereference a {@link FactoryBean} instance and distinguish it from
 * beans <i>created</i> by the FactoryBean. For example, if the bean named
 * {@code myJndiObject} is a FactoryBean, getting {@code &myJndiObject}
 * will return the factory, not the instance returned by the factory.
 */
String FACTORY_BEAN_PREFIX = "&";
```

所有方法：

```java
//通过name或类型获取bean
Object getBean(String name) throws BeansException;
<T> T getBean(String name, @Nullable Class<T> requiredType) throws BeansException;
Object getBean(String name, Object... args) throws BeansException;
<T> T getBean(Class<T> requiredType) throws BeansException;
<T> T getBean(Class<T> requiredType, Object... args) throws BeansException;
//是否已存在此bean
boolean containsBean(String name);
//取得bean单例,原型
boolean isSingleton(String name) throws NoSuchBeanDefinitionException;
boolean isPrototype(String name) throws NoSuchBeanDefinitionException;
//判断bean类型
boolean isTypeMatch(String name, ResolvableType typeToMatch) throws NoSuchBeanDefinitionException;
boolean isTypeMatch(String name, @Nullable Class<?> typeToMatch) throws NoSuchBeanDefinitionException;
//获取bean类型
@Nullable
Class<?> getType(String name) throws NoSuchBeanDefinitionException;
//取得bean别名数组
String[] getAliases(String name);
```

其他子接口都是扩充了一些方法，实现所有接口的实现类就一个DefaultListableBeanFactory。BeanFactory最基本的实现类AbstractBeanFactory继承了FactoryBeanRegistrySupport提供了bean的注册功能。

SimpleAliasRegistry中定义了一个Map用于保存别名与正式名字的映射， registerAlias()方法用于存放这个映射。

```java
private final Map<String, String> aliasMap = new ConcurrentHashMap<>(16);
```

```java
@Override
public void registerAlias(String name, String alias) {
   Assert.hasText(name, "'name' must not be empty");
   Assert.hasText(alias, "'alias' must not be empty");
   if (alias.equals(name)) {
      this.aliasMap.remove(alias);
   }
   else {
      String registeredName = this.aliasMap.get(alias);
      if (registeredName != null) {
         if (registeredName.equals(name)) {
            // An existing alias - no need to re-register
            return;
         }
         if (!allowAliasOverriding()) {
            throw new IllegalStateException("Cannot register alias '" + alias + "' for name '" +
                  name + "': It is already registered for name '" + registeredName + "'.");
         }
      }
      checkForAliasCircle(name, alias);
      this.aliasMap.put(alias, name);
   }
}
```

DefaultSingletonBeanRegistry继承了SimpleAliasRegistry并实现SingletonBeanRegistry，使得它既有管理SingletonBean的功能，又提供了别名的功能，它是一个通用的存储共享bean实例的地方。在注册一个SingletonBean的时候，用到了四个存储器：

- singletonObjects：用来存放注册的SingletonBean，具体的实现类是ConcurrentHashMap。
- singletonFactories：存储制造 singleton 的工厂，当Spring制造一个bean时因为依赖的bean还未完成Spring的单利制造会将前者包装成一个ObjectFactory放入。ObjectFactory的返回值就是bean。
- earlySingletonObjects：是singletonFactory 制造出来的 singleton 的缓存。
- registeredSingletons：按顺序存放已经注册的SingletonBean的名称。singletonObjects：用来存放注册的SingletonBean，具体的实现类是ConcurrentHashMap。

注册bean：

```java
@Override
public void registerSingleton(String beanName, Object singletonObject) throws IllegalStateException {
   Assert.notNull(beanName, "Bean name must not be null");
   Assert.notNull(singletonObject, "Singleton object must not be null");
   synchronized (this.singletonObjects) {
      Object oldObject = this.singletonObjects.get(beanName);
      if (oldObject != null) {
         throw new IllegalStateException("Could not register object [" + singletonObject +
               "] under bean name '" + beanName + "': there is already object [" + oldObject + "] bound");
      }
      addSingleton(beanName, singletonObject);
   }
}
protected void addSingleton(String beanName, Object singletonObject) {
   synchronized (this.singletonObjects) {
      this.singletonObjects.put(beanName, singletonObject);
      this.singletonFactories.remove(beanName);
      this.earlySingletonObjects.remove(beanName);
      this.registeredSingletons.add(beanName);
   }
}
```

在getSingleton的时候，spring的默认实现是，先从singletonObjects寻找，如果找不到，再从earlySingletonObjects寻找，仍然找不到，那就从singletonFactories寻找对应的制造singleton的工厂，然后调用工厂的getObject方法，造出对应的SingletonBean，并放入earlySingletonObjects中。

```java
@Override
@Nullable
public Object getSingleton(String beanName) {
   return getSingleton(beanName, true);
}
@Nullable
protected Object getSingleton(String beanName, boolean allowEarlyReference) {
   Object singletonObject = this.singletonObjects.get(beanName);
   if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
      synchronized (this.singletonObjects) {
         singletonObject = this.earlySingletonObjects.get(beanName);
         if (singletonObject == null && allowEarlyReference) {
            ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
            if (singletonFactory != null) {
               singletonObject = singletonFactory.getObject();
               this.earlySingletonObjects.put(beanName, singletonObject);
               this.singletonFactories.remove(beanName);
            }
         }
      }
   }
   return singletonObject;
}
```

对于不存在容器里的bean需要通过传入的singletonFactory创建一个新的bean然后放入容器中。beforeSingletonCreation()方法记录当前bean正在创建中，singletonFactory.getObject()执行完后afterSingletonCreation()方法将该bean从创建中容器移除。

```java
public Object getSingleton(String beanName, ObjectFactory<?> singletonFactory) {
   Assert.notNull(beanName, "Bean name must not be null");
   synchronized (this.singletonObjects) {
      Object singletonObject = this.singletonObjects.get(beanName);
      if (singletonObject == null) {
         if (this.singletonsCurrentlyInDestruction) {
            throw new BeanCreationNotAllowedException(beanName,
                  "Singleton bean creation not allowed while singletons of this factory are in destruction " +
                  "(Do not request a bean from a BeanFactory in a destroy method implementation!)");
         }
         if (logger.isDebugEnabled()) {
            logger.debug("Creating shared instance of singleton bean '" + beanName + "'");
         }
         beforeSingletonCreation(beanName);
         boolean newSingleton = false;
         boolean recordSuppressedExceptions = (this.suppressedExceptions == null);
         if (recordSuppressedExceptions) {
            this.suppressedExceptions = new LinkedHashSet<>();
         }
         try {
            singletonObject = singletonFactory.getObject();
            newSingleton = true;
         }
         catch (IllegalStateException ex) {
            // Has the singleton object implicitly appeared in the meantime ->
            // if yes, proceed with it since the exception indicates that state.
            singletonObject = this.singletonObjects.get(beanName);
            if (singletonObject == null) {
               throw ex;
            }
         }
         catch (BeanCreationException ex) {
            if (recordSuppressedExceptions) {
               for (Exception suppressedException : this.suppressedExceptions) {
                  ex.addRelatedCause(suppressedException);
               }
            }
            throw ex;
         }
         finally {
            if (recordSuppressedExceptions) {
               this.suppressedExceptions = null;
            }
            afterSingletonCreation(beanName);
         }
         if (newSingleton) {
            addSingleton(beanName, singletonObject);
         }
      }
      return singletonObject;
   }
}
```

FactoryBeanRegistrySupport增加了对FactoryBean的支持，getObjectFromFactoryBean()方法首先判断该FatoryBean是否为单利，不是则没都调用factory bean的getObject()方法创建新的bean，否则只创建一次放入缓存中，以后从缓存中取出的单利实现方式。

```java
/** Cache of singleton objects created by FactoryBeans: FactoryBean name --> object */
private final Map<String, Object> factoryBeanObjectCache = new ConcurrentHashMap<>(16);
```

```java
protected Object getObjectFromFactoryBean(FactoryBean<?> factory, String beanName, boolean shouldPostProcess) {
   if (factory.isSingleton() && containsSingleton(beanName)) {
      synchronized (getSingletonMutex()) {
         Object object = this.factoryBeanObjectCache.get(beanName);
         if (object == null) {
            object = doGetObjectFromFactoryBean(factory, beanName);
            // Only post-process and store if not put there already during getObject() call above
            // (e.g. because of circular reference processing triggered by custom getBean calls)
            Object alreadyThere = this.factoryBeanObjectCache.get(beanName);
            if (alreadyThere != null) {
               object = alreadyThere;
            }
            else {
               if (shouldPostProcess) {
                  try {
                     object = postProcessObjectFromFactoryBean(object, beanName);
                  }
                  catch (Throwable ex) {
                     throw new BeanCreationException(beanName,
                           "Post-processing of FactoryBean's singleton object failed", ex);
                  }
               }
               this.factoryBeanObjectCache.put(beanName, object);
            }
         }
         return object;
      }
   }
   else {
      Object object = doGetObjectFromFactoryBean(factory, beanName);
      if (shouldPostProcess) {
         try {
            object = postProcessObjectFromFactoryBean(object, beanName);
         }
         catch (Throwable ex) {
            throw new BeanCreationException(beanName, "Post-processing of FactoryBean's object failed", ex);
         }
      }
      return object;
   }
}
```

当对象创建之后会调用postProcessObjectFromFactoryBean()方法，此方法为空实现需要子类覆盖，依次使用BeanPostProcessor的postProcessAfterInitialization()方法完成对bean的加工。

BeanFactory最核心的方法应该就是getBean()了，有多个重载方法最终都是通过调用doGetBean()方法完成对bean的获取，根据bean name从缓存容器中查找如果找不到，则会先创建bean在放入容器中。看一下doGetBean()的具体实现：

```java
protected <T> T doGetBean(final String name, @Nullable final Class<T> requiredType,
      @Nullable final Object[] args, boolean typeCheckOnly) throws BeansException {
   final String beanName = transformedBeanName(name);
   Object bean;
   // Eagerly check singleton cache for manually registered singletons.
   Object sharedInstance = getSingleton(beanName);
   if (sharedInstance != null && args == null) {
      if (logger.isDebugEnabled()) {
         if (isSingletonCurrentlyInCreation(beanName)) {
            logger.debug("Returning eagerly cached instance of singleton bean '" + beanName +
                  "' that is not fully initialized yet - a consequence of a circular reference");
         }
         else {
            logger.debug("Returning cached instance of singleton bean '" + beanName + "'");
         }
      }
      bean = getObjectForBeanInstance(sharedInstance, name, beanName, null);
   }
```

上面只列出来了容器中存在bean的情况，先看这一部分。

调用getSingleton()方法从容器中取得bean，如果不为null则说明该bean已存在，此时这个bean也可能是FactoryBean，调用 getObjectForBeanInstance()方法做个校验，如果是name以&开头但是不是BeanFactory实例则抛出异常。如果是&开头并且是FactoryBean实例或者非&开头不是FactoryBean实例则直接返回该实例。否则的情况就是：该实例为FactoryBean但是非&开头，就需要先从factoryBeanObjectCache缓存中查找，如果不存在则调用getObjectFromFactoryBean()方法从BeanFactoy的getObject()方法的返回值获取。需要注意的是如果RootBeanDefinition是合成的则不会将bean使用BeanPostProcessor做处理。

如果容器不存在任何bean，则走else分支。首先判断该beanname是否存在当前ThreadLocal，如果存在说明当前bean的scope是prototype的存在了循环引用，因为prototype每次都新建一个实例所以不能像单例那种可以暂时将实例放入一个工厂对象缓存中，等到依赖的对象实例完毕再填充，所以就抛出了一个异常。

```java
// Fail if we're already creating this bean instance:
// We're assumably within a circular reference.
if (isPrototypeCurrentlyInCreation(beanName)) {
   throw new BeanCurrentlyInCreationException(beanName);
}
// Check if bean definition exists in this factory.
BeanFactory parentBeanFactory = getParentBeanFactory();
if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
   // Not found -> check parent.
   String nameToLookup = originalBeanName(name);
   if (parentBeanFactory instanceof AbstractBeanFactory) {
      return ((AbstractBeanFactory) parentBeanFactory).doGetBean(
            nameToLookup, requiredType, args, typeCheckOnly);
   }
   else if (args != null) {
      // Delegation to parent with explicit args.
      return (T) parentBeanFactory.getBean(nameToLookup, args);
   }
   else {
      // No args -> delegate to standard getBean method.
      return parentBeanFactory.getBean(nameToLookup, requiredType);
   }
}
if (!typeCheckOnly) {
   markBeanAsCreated(beanName);
}
```

如果本容器不存在bean name则从父容器get bean。对于非只检查类型(!typeCheckOnly),会在alreadyCreated记录该bean name，并从mergedBeanDefinitions中删除。

接下来通过bean name得到RootBeanDefinition，将它的依赖(dependsOn)的bean name先实例化。

```java
final RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
checkMergedBeanDefinition(mbd, beanName, args);
// Guarantee initialization of beans that the current bean depends on.
String[] dependsOn = mbd.getDependsOn();
if (dependsOn != null) {
   for (String dep : dependsOn) {
      if (isDependent(beanName, dep)) {
         throw new BeanCreationException(mbd.getResourceDescription(), beanName,
               "Circular depends-on relationship between '" + beanName + "' and '" + dep + "'");
      }
      registerDependentBean(dep, beanName);
      getBean(dep);
   }
}
```

根据RootBeanDefinition的scope不同创建不同类型的bean。

```java
// Create bean instance.
if (mbd.isSingleton()) {
   sharedInstance = getSingleton(beanName, () -> {
      try {
         return createBean(beanName, mbd, args);
      }
      catch (BeansException ex) {
         // Explicitly remove instance from singleton cache: It might have been put there
         // eagerly by the creation process, to allow for circular reference resolution.
         // Also remove any beans that received a temporary reference to the bean.
         destroySingleton(beanName);
         throw ex;
      }
   });
   bean = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
}
else if (mbd.isPrototype()) {
   // It's a prototype -> create a new instance.
   Object prototypeInstance = null;
   try {
      beforePrototypeCreation(beanName);
      prototypeInstance = createBean(beanName, mbd, args);
   }
   finally {
      afterPrototypeCreation(beanName);
   }
   bean = getObjectForBeanInstance(prototypeInstance, name, beanName, mbd);
}
else {
   String scopeName = mbd.getScope();
   final Scope scope = this.scopes.get(scopeName);
   if (scope == null) {
      throw new IllegalStateException("No Scope registered for scope name '" + scopeName + "'");
   }
   try {
      Object scopedInstance = scope.get(beanName, () -> {
         beforePrototypeCreation(beanName);
         try {
            return createBean(beanName, mbd, args);
         }
         finally {
            afterPrototypeCreation(beanName);
         }
      });
      bean = getObjectForBeanInstance(scopedInstance, name, beanName, mbd);
   }
   catch (IllegalStateException ex) {
      throw new BeanCreationException(beanName,
            "Scope '" + scopeName + "' is not active for the current thread; consider " +
            "defining a scoped proxy for this bean if you intend to refer to it from a singleton",
            ex);
   }
}
```

这三种情况都是通过核心方法createBean()来创建bean对象，不同之处就是单例需要缓存，prototype每次都需要创建。

createBean()方法由子类AbstractAutowireCapableBeanFactory实现。

```java
@Override
protected Object createBean(String beanName, RootBeanDefinition mbd, @Nullable Object[] args) throws BeanCreationException {
   if (logger.isDebugEnabled()) {
      logger.debug("Creating instance of bean '" + beanName + "'");
   }
   RootBeanDefinition mbdToUse = mbd;
   // Make sure bean class is actually resolved at this point, and
   // clone the bean definition in case of a dynamically resolved Class
   // which cannot be stored in the shared merged bean definition.
   Class<?> resolvedClass = resolveBeanClass(mbd, beanName);
   if (resolvedClass != null && !mbd.hasBeanClass() && mbd.getBeanClassName() != null) {
      mbdToUse = new RootBeanDefinition(mbd);
      mbdToUse.setBeanClass(resolvedClass);
   }
   // Prepare method overrides.
   try {
      mbdToUse.prepareMethodOverrides();
   }
   catch (BeanDefinitionValidationException ex) {
      throw new BeanDefinitionStoreException(mbdToUse.getResourceDescription(),
            beanName, "Validation of method overrides failed", ex);
   }
   try {
      // Give BeanPostProcessors a chance to return a proxy instead of the target bean instance.
      Object bean = resolveBeforeInstantiation(beanName, mbdToUse);
      if (bean != null) {
         return bean;
      }
   }
   catch (Throwable ex) {
      throw new BeanCreationException(mbdToUse.getResourceDescription(), beanName,
            "BeanPostProcessor before instantiation of bean failed", ex);
   }
   try {
      Object beanInstance = doCreateBean(beanName, mbdToUse, args);
      if (logger.isDebugEnabled()) {
         logger.debug("Finished creating instance of bean '" + beanName + "'");
      }
      return beanInstance;
   }
   catch (BeanCreationException ex) {
      // A previously detected exception with proper bean creation context already...
      throw ex;
   }
   catch (ImplicitlyAppearedSingletonException ex) {
      // An IllegalStateException to be communicated up to DefaultSingletonBeanRegistry...
      throw ex;
   }
   catch (Throwable ex) {
      throw new BeanCreationException(
            mbdToUse.getResourceDescription(), beanName, "Unexpected exception during bean creation", ex);
   }
}
```

resolveBeanClass方法会根据RootBeanDefinition的class name解析出一个代表该bean的一个Class对象。具体规则如下：

```java
protected Class<?> resolveBeanClass(final RootBeanDefinition mbd, String beanName, final Class<?>... typesToMatch)
      throws CannotLoadBeanClassException {
   try {
      if (mbd.hasBeanClass()) {
         return mbd.getBeanClass();
      }
      if (System.getSecurityManager() != null) {
         return AccessController.doPrivileged((PrivilegedExceptionAction<Class<?>>) () ->
            doResolveBeanClass(mbd, typesToMatch), getAccessControlContext());
      }
      else {
         return doResolveBeanClass(mbd, typesToMatch);
      }
   }
   catch (PrivilegedActionException pae) {
      ClassNotFoundException ex = (ClassNotFoundException) pae.getException();
      throw new CannotLoadBeanClassException(mbd.getResourceDescription(), beanName, mbd.getBeanClassName(), ex);
   }
   catch (ClassNotFoundException ex) {
      throw new CannotLoadBeanClassException(mbd.getResourceDescription(), beanName, mbd.getBeanClassName(), ex);
   }
   catch (LinkageError err) {
      throw new CannotLoadBeanClassException(mbd.getResourceDescription(), beanName, mbd.getBeanClassName(), err);
   }
}
```

doResolveBeanClass()方法首先会尝试使用beanExpressionResolver(如果set了)将class name解析成一个Class，最后使用mbd.resolveBeanClass(beanClassLoader)兜底。beanExpressionResolver默认是null，如果使用ApplicationContext会在AbstractApplicationContext.prepareBeanFactory()方法中传入一个，这个以后再讲。

resolveBeforeInstantiation()方法提供了一个机会在创建bean实例之前用一个代理对象替代它，这个代理对象不会被应用BeanPostProcessor的postProcessBeforeInitialization()和postProcessAfterInitialization()，取而代之的是InstantiationAwareBeanPostProcessor(一个特殊的BeanPostProcessor)的postProcessBeforeInstantiation()(就是这个方法返回的代理对象)和applyBeanPostProcessorsAfterInitialization()。

如果没有能返回代理对象(返回为null)的InstantiationAwareBeanPostProcessor，则使用doCreateBean()方法创建bean。

```java
protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final @Nullable Object[] args)
      throws BeanCreationException {
   // Instantiate the bean.
   BeanWrapper instanceWrapper = null;
   if (mbd.isSingleton()) {
      instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
   }
   if (instanceWrapper == null) {
      instanceWrapper = createBeanInstance(beanName, mbd, args);
   }
   final Object bean = instanceWrapper.getWrappedInstance();
   Class<?> beanType = instanceWrapper.getWrappedClass();
   if (beanType != NullBean.class) {
      mbd.resolvedTargetType = beanType;
   }
   // Allow post-processors to modify the merged bean definition.
   synchronized (mbd.postProcessingLock) {
      if (!mbd.postProcessed) {
         try {
            applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
         }
         catch (Throwable ex) {
            throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                  "Post-processing of merged bean definition failed", ex);
         }
         mbd.postProcessed = true;
      }
   }
   // Eagerly cache singletons to be able to resolve circular references
   // even when triggered by lifecycle interfaces like BeanFactoryAware.
   boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
         isSingletonCurrentlyInCreation(beanName));
   if (earlySingletonExposure) {
      if (logger.isDebugEnabled()) {
         logger.debug("Eagerly caching bean '" + beanName +
               "' to allow for resolving potential circular references");
      }
      addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
   }
   // Initialize the bean instance.
   Object exposedObject = bean;
   try {
      populateBean(beanName, mbd, instanceWrapper);
      exposedObject = initializeBean(beanName, exposedObject, mbd);
   }
   catch (Throwable ex) {
      if (ex instanceof BeanCreationException && beanName.equals(((BeanCreationException) ex).getBeanName())) {
         throw (BeanCreationException) ex;
      }
      else {
         throw new BeanCreationException(
               mbd.getResourceDescription(), beanName, "Initialization of bean failed", ex);
      }
   }
   if (earlySingletonExposure) {
      Object earlySingletonReference = getSingleton(beanName, false);
      if (earlySingletonReference != null) {
         if (exposedObject == bean) {
            exposedObject = earlySingletonReference;
         }
         else if (!this.allowRawInjectionDespiteWrapping && hasDependentBean(beanName)) {
            String[] dependentBeans = getDependentBeans(beanName);
            Set<String> actualDependentBeans = new LinkedHashSet<>(dependentBeans.length);
            for (String dependentBean : dependentBeans) {
               if (!removeSingletonIfCreatedForTypeCheckOnly(dependentBean)) {
                  actualDependentBeans.add(dependentBean);
               }
            }
            if (!actualDependentBeans.isEmpty()) {
               throw new BeanCurrentlyInCreationException(beanName,
                     "Bean with name '" + beanName + "' has been injected into other beans [" +
                     StringUtils.collectionToCommaDelimitedString(actualDependentBeans) +
                     "] in its raw version as part of a circular reference, but has eventually been " +
                     "wrapped. This means that said other beans do not use the final version of the " +
                     "bean. This is often the result of over-eager type matching - consider using " +
                     "'getBeanNamesOfType' with the 'allowEagerInit' flag turned off, for example.");
            }
         }
      }
   }
   // Register bean as disposable.
   try {
      registerDisposableBeanIfNecessary(beanName, bean, mbd);
   }
   catch (BeanDefinitionValidationException ex) {
      throw new BeanCreationException(
            mbd.getResourceDescription(), beanName, "Invalid destruction signature", ex);
   }
   return exposedObject;
}
```

首先需要创建一个BeanWrapper实例，这个实例是为了方便对bean的成员变量赋值，createBeanInstance()方法创建bean的策略有RootBeanDefinition提供了的instanceSupplier，工厂方法，构造方法autowiring或者简单的默认构造方法实例化。

```java
protected BeanWrapper createBeanInstance(String beanName, RootBeanDefinition mbd, @Nullable Object[] args) {
   // Make sure bean class is actually resolved at this point.
   Class<?> beanClass = resolveBeanClass(mbd, beanName);
   // beanClass不为空,且beanClass的修饰符为不为public,且不允许访问非公共构造函数和方法,则抛出异常
   if (beanClass != null && !Modifier.isPublic(beanClass.getModifiers()) && !mbd.isNonPublicAccessAllowed()) {
      throw new BeanCreationException(mbd.getResourceDescription(), beanName,
            "Bean class isn't public, and non-public access not allowed: " + beanClass.getName());
   }
   Supplier<?> instanceSupplier = mbd.getInstanceSupplier();
   if (instanceSupplier != null) {
      return obtainFromSupplier(instanceSupplier, beanName);
   }
   if (mbd.getFactoryMethodName() != null)  {
      return instantiateUsingFactoryMethod(beanName, mbd, args);
   }
   // Shortcut when re-creating the same bean...
   // 当创建一个相同的bean时,使用之前缓存的构造方法(或工厂方法)和构造参数
   // 这里可能会有一个疑问,什么时候会创建相同的bean呢?
   // 第一种情况 单例模式: Spring不会缓存该模式的实例,那么对于单例模式的bean,什么时候会用到该实例化策略呢?
   // 当我们调用BeanFactory.destroyBean(myBeanName,myBeanInstance),销毁bean时,容器是不会销毁已经解析的构造函数缓存的,
   // 如果再次调用xmlBeanFactory.getBean(myBeanName)时,就会使用该策略了.
   // 第二种情况 原型模式: 对于该模式的理解就简单了,IoC容器不会缓存原型模式bean的实例,当我们第二次向容器索取同一个bean时,就会使用该策略了.
   boolean resolved = false;
   boolean autowireNecessary = false;
   if (args == null) {
      synchronized (mbd.constructorArgumentLock) {
         if (mbd.resolvedConstructorOrFactoryMethod != null) {
            resolved = true;
            autowireNecessary = mbd.constructorArgumentsResolved;
         }
      }
   }
   // 如果该bean已经被解析过
   if (resolved) {
      // 使用已经解析过的构造函数实例化
      if (autowireNecessary) {
         return autowireConstructor(beanName, mbd, null, null);
      }
      // 使用默认无参构造函数实例化
      else {
         return instantiateBean(beanName, mbd);
      }
   }
   // Need to determine the constructor...
   Constructor<?>[] ctors = determineConstructorsFromBeanPostProcessors(beanClass, beanName);
   if (ctors != null ||
         mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_CONSTRUCTOR ||
         mbd.hasConstructorArgumentValues() || !ObjectUtils.isEmpty(args))  {
      return autowireConstructor(beanName, mbd, ctors, args);
   }
   // No special handling: simply use no-arg constructor.
   return instantiateBean(beanName, mbd);
}
```

下面是autowireConstructor()方法的具体实现，工厂方法创建bean也会使用ConstructorResolver。

```java
protected BeanWrapper autowireConstructor(
      String beanName, RootBeanDefinition mbd, @Nullable Constructor<?>[] ctors, @Nullable Object[] explicitArgs) {
   return new ConstructorResolver(this).autowireConstructor(beanName, mbd, ctors, explicitArgs);
}
public BeanWrapper autowireConstructor(final String beanName, final RootBeanDefinition mbd,
      @Nullable Constructor<?>[] chosenCtors, @Nullable final Object[] explicitArgs) {
   BeanWrapperImpl bw = new BeanWrapperImpl();
   this.beanFactory.initBeanWrapper(bw);
   //创建bean的构造方法以及构造方法使用的参数
   Constructor<?> constructorToUse = null;
   ArgumentsHolder argsHolderToUse = null;
   Object[] argsToUse = null;
    //如果显示传入构造参数则使用
   if (explicitArgs != null) {
      argsToUse = explicitArgs;
   }
   //否则检查BeanDefinition有没有构造方法和构造参数，有则使用
   else {
      Object[] argsToResolve = null;
      // 对于同一个bean的再次实例化使用上次缓存下来的构造方法和参数
      synchronized (mbd.constructorArgumentLock) {
         constructorToUse = (Constructor<?>) mbd.resolvedConstructorOrFactoryMethod;
         if (constructorToUse != null && mbd.constructorArgumentsResolved) {
            // Found a cached constructor...
            argsToUse = mbd.resolvedConstructorArguments;
            if (argsToUse == null) {
               argsToResolve = mbd.preparedConstructorArguments;
            }
         }
      }
      if (argsToResolve != null) {
         // 解析参数的引用类型
         argsToUse = resolvePreparedArguments(beanName, mbd, bw, constructorToUse, argsToResolve);
      }
   }
   //如果没有显示传入构造参数或者mbd中没有解析过的构造方法，则从传入的构造方法中选择一个，如果没有传入则从所有的构造方法中选择一个
   if (constructorToUse == null) {
      // Need to resolve the constructor.
      boolean autowiring = (chosenCtors != null ||
            mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_CONSTRUCTOR);
      ConstructorArgumentValues resolvedValues = null;
      int minNrOfArgs;//构造参数数量不能小于此值
      if (explicitArgs != null) {
         minNrOfArgs = explicitArgs.length;
      }
      else {//没有传入则使用mbd中的ConstructorArgumentValues
         ConstructorArgumentValues cargs = mbd.getConstructorArgumentValues();
         resolvedValues = new ConstructorArgumentValues();
         //如果cargs中的ValueHolder没有进行过解析，内部会将解析过的ValueHolder放入resolvedValues,具体看下面代码
         minNrOfArgs = resolveConstructorArguments(beanName, mbd, bw, cargs, resolvedValues);
      }
      // Take specified constructors, if any.
      // 实例化bean的候选构造方法
      Constructor<?>[] candidates = chosenCtors;
      if (candidates == null) {
         Class<?> beanClass = mbd.getBeanClass();
         try {
            candidates = (mbd.isNonPublicAccessAllowed() ?
                  beanClass.getDeclaredConstructors() : beanClass.getConstructors());
         }
         catch (Throwable ex) {
            throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                  "Resolution of declared constructors on bean Class [" + beanClass.getName() +
                  "] from ClassLoader [" + beanClass.getClassLoader() + "] failed", ex);
         }
      }
      //先比较public，再比较参数数量大的排在前面
      AutowireUtils.sortConstructors(candidates);
      int minTypeDiffWeight = Integer.MAX_VALUE;
      Set<Constructor<?>> ambiguousConstructors = null;
      LinkedList<UnsatisfiedDependencyException> causes = null;
      for (Constructor<?> candidate : candidates) {
         Class<?>[] paramTypes = candidate.getParameterTypes();
         //已经找到构造方法的参数个数大于等于argsToUse.length了
         if (constructorToUse != null && argsToUse.length > paramTypes.length) {
            // Already found greedy constructor that can be satisfied ->
            // do not look any further, there are only less greedy constructors left.
            break;
         }
         //必须找到构造方法参数个数满足minNoOfArgs
         if (paramTypes.length < minNrOfArgs) {
            continue;
         }
         ArgumentsHolder argsHolder;
         if (resolvedValues != null) {
            try {以@ConstructorProperties注解配置的属性名为准
               String[] paramNames = ConstructorPropertiesChecker.evaluate(candidate, paramTypes.length);
               if (paramNames == null) {
                  ParameterNameDiscoverer pnd = this.beanFactory.getParameterNameDiscoverer();
                  if (pnd != null) {//否则使用ParameterNameDiscoverer取得参数变量名
                     paramNames = pnd.getParameterNames(candidate);
                  }
               }
               //argsHolder包含与构造方法匹配的参数从resolveValues，如果resolveValues中不存在则使用自动装配查找参数
               argsHolder = createArgumentArray(beanName, mbd, resolvedValues, bw, paramTypes, paramNames,
                     getUserDeclaredConstructor(candidate), autowiring);
            }
            catch (UnsatisfiedDependencyException ex) {
               if (this.beanFactory.logger.isTraceEnabled()) {
                  this.beanFactory.logger.trace(
                        "Ignoring constructor [" + candidate + "] of bean '" + beanName + "': " + ex);
               }
               // Swallow and try next constructor.
               if (causes == null) {
                  causes = new LinkedList<>();
               }
               causes.add(ex);
               continue;
            }
         }
         //对于显示传入构造参数要求必须满足参数个数等于构造方法的参数个数
         else {
            // Explicit arguments given -> arguments length must match exactly.
            if (paramTypes.length != explicitArgs.length) {
               continue;
            }
            argsHolder = new ArgumentsHolder(explicitArgs);
         }
         //通过构造函数参数权重对比,得出最适合使用的构造函数
         // 先判断是返回是在宽松模式下解析构造函数还是在严格模式下解析构造函数。(默认是宽松模式)
         // 对于宽松模式:例如构造函数为(String name,int age),配置文件中定义(value="美美",value="3")
         // 那么对于age来讲,配置文件中的"3",可以被解析为int也可以被解析为String,
         // 这个时候就需要来判断参数的权重,使用ConstructorResolver的静态内部类ArgumentsHolder分别对字符型和数字型的参数做权重判断
         // 权重越小,则说明构造函数越匹配
         // 对于严格模式:严格返回权重值,不会根据分别比较而返回比对值
         // minTypeDiffWeight = Integer.MAX_VALUE;而权重比较返回结果都是在Integer.MAX_VALUE做减法,起返回最大值为Integer.MAX_VALUE
         int typeDiffWeight = (mbd.isLenientConstructorResolution() ?
               argsHolder.getTypeDifferenceWeight(paramTypes) : argsHolder.getAssignabilityWeight(paramTypes));
         // Choose this constructor if it represents the closest match.
         if (typeDiffWeight < minTypeDiffWeight) {
            constructorToUse = candidate;
            argsHolderToUse = argsHolder;
            argsToUse = argsHolder.arguments;
            minTypeDiffWeight = typeDiffWeight;
            ambiguousConstructors = null;
         }
         else if (constructorToUse != null && typeDiffWeight == minTypeDiffWeight) {
            if (ambiguousConstructors == null) {
               ambiguousConstructors = new LinkedHashSet<>();
               ambiguousConstructors.add(constructorToUse);
            }
            ambiguousConstructors.add(candidate);
         }
      }
      if (constructorToUse == null) {
         if (causes != null) {
            UnsatisfiedDependencyException ex = causes.removeLast();
            for (Exception cause : causes) {
               this.beanFactory.onSuppressedException(cause);
            }
            throw ex;
         }
         throw new BeanCreationException(mbd.getResourceDescription(), beanName,
               "Could not resolve matching constructor " +
               "(hint: specify index/type/name arguments for simple parameters to avoid type ambiguities)");
      }
      else if (ambiguousConstructors != null && !mbd.isLenientConstructorResolution()) {
         throw new BeanCreationException(mbd.getResourceDescription(), beanName,
               "Ambiguous constructor matches found in bean '" + beanName + "' " +
               "(hint: specify index/type/name arguments for simple parameters to avoid type ambiguities): " +
               ambiguousConstructors);
      }
      if (explicitArgs == null) {
         argsHolderToUse.storeCache(mbd, constructorToUse);
      }
   }
   try {
      final InstantiationStrategy strategy = beanFactory.getInstantiationStrategy();
      Object beanInstance;
      //使用筛选出来的构造方法和解析完毕的构造参数实例化一个bean
      if (System.getSecurityManager() != null) {
         final Constructor<?> ctorToUse = constructorToUse;
         final Object[] argumentsToUse = argsToUse;
         beanInstance = AccessController.doPrivileged((PrivilegedAction<Object>) () ->
               strategy.instantiate(mbd, beanName, beanFactory, ctorToUse, argumentsToUse),
               beanFactory.getAccessControlContext());
      }
      else {
         beanInstance = strategy.instantiate(mbd, beanName, this.beanFactory, constructorToUse, argsToUse);
      }
      bw.setBeanInstance(beanInstance);
      return bw;
   }
   catch (Throwable ex) {
      throw new BeanCreationException(mbd.getResourceDescription(), beanName,
            "Bean instantiation via constructor failed", ex);
   }
}
//将此bean的构造函数参数解析为resolvedValues对象。 这可能涉及查找其他bean。
//此方法还用于处理静态工厂方法的调用。
private int resolveConstructorArguments(String beanName, RootBeanDefinition mbd, BeanWrapper bw,
      ConstructorArgumentValues cargs, ConstructorArgumentValues resolvedValues) {
   TypeConverter customConverter = this.beanFactory.getCustomTypeConverter();
   TypeConverter converter = (customConverter != null ? customConverter : bw);
   BeanDefinitionValueResolver valueResolver = new BeanDefinitionValueResolver(this.beanFactory, beanName, mbd, converter);
   int minNrOfArgs = cargs.getArgumentCount();
   for (Map.Entry<Integer, ConstructorArgumentValues.ValueHolder> entry : cargs.getIndexedArgumentValues().entrySet()) {
      int index = entry.getKey();
      if (index < 0) {
         throw new BeanCreationException(mbd.getResourceDescription(), beanName,
               "Invalid constructor argument index: " + index);
      }
      if (index > minNrOfArgs) {
         minNrOfArgs = index + 1;
      }
      ConstructorArgumentValues.ValueHolder valueHolder = entry.getValue();
      if (valueHolder.isConverted()) {
         resolvedValues.addIndexedArgumentValue(index, valueHolder);
      }
      else {
         //将引用类型解析为bean对象
         Object resolvedValue = valueResolver.resolveValueIfNecessary("constructor argument", valueHolder.getValue());
         ConstructorArgumentValues.ValueHolder resolvedValueHolder =
               new ConstructorArgumentValues.ValueHolder(resolvedValue, valueHolder.getType(), valueHolder.getName());
         resolvedValueHolder.setSource(valueHolder);
         resolvedValues.addIndexedArgumentValue(index, resolvedValueHolder);
      }
   }
   for (ConstructorArgumentValues.ValueHolder valueHolder : cargs.getGenericArgumentValues()) {
      if (valueHolder.isConverted()) {
         resolvedValues.addGenericArgumentValue(valueHolder);
      }
      else {
         Object resolvedValue =
               valueResolver.resolveValueIfNecessary("constructor argument", valueHolder.getValue());
         ConstructorArgumentValues.ValueHolder resolvedValueHolder = new ConstructorArgumentValues.ValueHolder(
               resolvedValue, valueHolder.getType(), valueHolder.getName());
         resolvedValueHolder.setSource(valueHolder);
         resolvedValues.addGenericArgumentValue(resolvedValueHolder);
      }
   }
   return minNrOfArgs;
}
```

如果RootBeanDefinition中不存在resolvedConstructorOrFactoryMethod，则从注册的BeanPostProcessor中找到能针对此beanClass和beanName返回构造方法的SmartInstantiationAwareBeanPostProcessor。

```java
protected Constructor<?>[] determineConstructorsFromBeanPostProcessors(@Nullable Class<?> beanClass, String beanName)
      throws BeansException {
   if (beanClass != null && hasInstantiationAwareBeanPostProcessors()) {
      for (BeanPostProcessor bp : getBeanPostProcessors()) {
         if (bp instanceof SmartInstantiationAwareBeanPostProcessor) {
            SmartInstantiationAwareBeanPostProcessor ibp = (SmartInstantiationAwareBeanPostProcessor) bp;
            Constructor<?>[] ctors = ibp.determineCandidateConstructors(beanClass, beanName);
            if (ctors != null) {
               return ctors;
            }
         }
      }
   }
   return null;
}
```

得到BeanWrapper实例后，从注册的BeanPostProcessor中找出所有的MergedBeanDefinitionPostProcessor调用它的postProcessMergedBeanDefinition()方法。

```java
protected void applyMergedBeanDefinitionPostProcessors(RootBeanDefinition mbd, Class<?> beanType, String beanName) {
   for (BeanPostProcessor bp : getBeanPostProcessors()) {
      if (bp instanceof MergedBeanDefinitionPostProcessor) {
         MergedBeanDefinitionPostProcessor bdp = (MergedBeanDefinitionPostProcessor) bp;
         bdp.postProcessMergedBeanDefinition(mbd, beanType, beanName);
      }
   }
}
```

如果是正在创建的单例模式的bean会将此bean以ObjectFactory返回值的形式放入singletonFactories中，这也是解决循环依赖的关键，对于A->B->A的情况，A虽然还没放入singletonObjects中，但是B可以从singletonFactories得到A的引用。从 singletonFactories中得到的ObjectFactory实现如下，如果为非合成bean，则会使用SmartInstantiationAwareBeanPostProcessor的getEarlyBeanReference()方法处理bean：

```java
protected Object getEarlyBeanReference(String beanName, RootBeanDefinition mbd, Object bean) {
   Object exposedObject = bean;
   if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
      for (BeanPostProcessor bp : getBeanPostProcessors()) {
         if (bp instanceof SmartInstantiationAwareBeanPostProcessor) {
            SmartInstantiationAwareBeanPostProcessor ibp = (SmartInstantiationAwareBeanPostProcessor) bp;
            exposedObject = ibp.getEarlyBeanReference(exposedObject, beanName);
         }
      }
   }
   return exposedObject;
}
```

populateBean()方法使用BeanDefinition填充bean的属性，进行属性填充阶段，如果bean不是合成的且注册了InstantiationAwareBeanPostProcessor，会使用postProcessAfterInstantiation()方法，如果有一个返回为false则不进行填充操作直接返回。如果mbd是自动填充模式还会进行自动填充。

```java
protected void populateBean(String beanName, RootBeanDefinition mbd, @Nullable BeanWrapper bw) {
   if (bw == null) {
      if (mbd.hasPropertyValues()) {
         throw new BeanCreationException(
               mbd.getResourceDescription(), beanName, "Cannot apply property values to null instance");
      }
      else {
         // Skip property population phase for null instance.
         return;
      }
   }
   // Give any InstantiationAwareBeanPostProcessors the opportunity to modify the
   // state of the bean before properties are set. This can be used, for example,
   // to support styles of field injection.
   boolean continueWithPropertyPopulation = true;
   if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
      for (BeanPostProcessor bp : getBeanPostProcessors()) {
         if (bp instanceof InstantiationAwareBeanPostProcessor) {
            InstantiationAwareBeanPostProcessor ibp = (InstantiationAwareBeanPostProcessor) bp;
            if (!ibp.postProcessAfterInstantiation(bw.getWrappedInstance(), beanName)) {
               continueWithPropertyPopulation = false;
               break;
            }
         }
      }
   }
   if (!continueWithPropertyPopulation) {
      return;
   }
   PropertyValues pvs = (mbd.hasPropertyValues() ? mbd.getPropertyValues() : null);
   if (mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_NAME ||
         mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_TYPE) {
      MutablePropertyValues newPvs = new MutablePropertyValues(pvs);
      // Add property values based on autowire by name if applicable.
      if (mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_NAME) {
         autowireByName(beanName, mbd, bw, newPvs);
      }
      // Add property values based on autowire by type if applicable.
      if (mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_TYPE) {
         autowireByType(beanName, mbd, bw, newPvs);
      }
      pvs = newPvs;
   }
   boolean hasInstAwareBpps = hasInstantiationAwareBeanPostProcessors();
   boolean needsDepCheck = (mbd.getDependencyCheck() != RootBeanDefinition.DEPENDENCY_CHECK_NONE);
   if (hasInstAwareBpps || needsDepCheck) {
      if (pvs == null) {
         pvs = mbd.getPropertyValues();
      }
      PropertyDescriptor[] filteredPds = filterPropertyDescriptorsForDependencyCheck(bw, mbd.allowCaching);
      if (hasInstAwareBpps) {
         for (BeanPostProcessor bp : getBeanPostProcessors()) {
            if (bp instanceof InstantiationAwareBeanPostProcessor) {
               InstantiationAwareBeanPostProcessor ibp = (InstantiationAwareBeanPostProcessor) bp;
               pvs = ibp.postProcessPropertyValues(pvs, filteredPds, bw.getWrappedInstance(), beanName);
               if (pvs == null) {
                  return;
               }
            }
         }
      }
      if (needsDepCheck) {
         checkDependencies(beanName, mbd, filteredPds, pvs);
      }
   }
   if (pvs != null) {
      applyPropertyValues(beanName, mbd, bw, pvs);
   }
}
```

依据名字自动装配：找出有非从接口继承的setter方法不是Cglib动态生成且没有出现在mbd的pvs中的非简单属性字段名字，从bean factory容器中使用getBean()方法找出bean name为字段名字的bean，将字段名字和bean添加到pvs中，留作以后同一对bean属性赋值。

```java
protected void autowireByName( String beanName, AbstractBeanDefinition mbd, BeanWrapper bw, MutablePropertyValues pvs) {
   String[] propertyNames = unsatisfiedNonSimpleProperties(mbd, bw);
   for (String propertyName : propertyNames) {
      if (containsBean(propertyName)) {
         Object bean = getBean(propertyName);
         pvs.add(propertyName, bean);
         registerDependentBean(propertyName, beanName);
         if (logger.isDebugEnabled()) {
            logger.debug("Added autowiring by name from bean name '" + beanName +
                  "' via property '" + propertyName + "' to bean named '" + propertyName + "'");
         }
      }
      else {
         if (logger.isTraceEnabled()) {
            logger.trace("Not autowiring property '" + propertyName + "' of bean '" + beanName +
                  "' by name: no matching bean found");
         }
      }
   }
}
```

依据类型自动装配：会使用DefaultListableBeanFactory的resolveDependency()方法取得一个bean属性。

```java
protected void autowireByType( String beanName, AbstractBeanDefinition mbd, BeanWrapper bw, MutablePropertyValues pvs) {
   TypeConverter converter = getCustomTypeConverter();
   if (converter == null) {
      converter = bw;
   }
   Set<String> autowiredBeanNames = new LinkedHashSet<>(4);
   String[] propertyNames = unsatisfiedNonSimpleProperties(mbd, bw);
   for (String propertyName : propertyNames) {
      try {
         PropertyDescriptor pd = bw.getPropertyDescriptor(propertyName);
         // Don't try autowiring by type for type Object: never makes sense,
         // even if it technically is a unsatisfied, non-simple property.
         if (Object.class != pd.getPropertyType()) {
            MethodParameter methodParam = BeanUtils.getWriteMethodParameter(pd);
            // Do not allow eager init for type matching in case of a prioritized post-processor.
            boolean eager = !PriorityOrdered.class.isInstance(bw.getWrappedInstance());
            DependencyDescriptor desc = new AutowireByTypeDependencyDescriptor(methodParam, eager);
            Object autowiredArgument = resolveDependency(desc, beanName, autowiredBeanNames, converter);
            if (autowiredArgument != null) {
               pvs.add(propertyName, autowiredArgument);
            }
            for (String autowiredBeanName : autowiredBeanNames) {
               registerDependentBean(autowiredBeanName, beanName);
               if (logger.isDebugEnabled()) {
                  logger.debug("Autowiring by type from bean name '" + beanName + "' via property '" +
                        propertyName + "' to bean named '" + autowiredBeanName + "'");
               }
            }
            autowiredBeanNames.clear();
         }
      }
      catch (BeansException ex) {
         throw new UnsatisfiedDependencyException(mbd.getResourceDescription(), beanName, propertyName, ex);
      }
   }
}
```

重点在于resolveDependency()是如何通过DependencyDescriptor得到属性值：

```java
public Object resolveDependency(DependencyDescriptor descriptor, @Nullable String requestingBeanName,
      @Nullable Set<String> autowiredBeanNames, @Nullable TypeConverter typeConverter) throws BeansException {
   descriptor.initParameterNameDiscovery(getParameterNameDiscoverer());
   //对Optional的支持
   if (Optional.class == descriptor.getDependencyType()) {
      return createOptionalDependency(descriptor, requestingBeanName);
   }
   //对等javax.inject.Provider的Spring实现
   else if (ObjectFactory.class == descriptor.getDependencyType() ||
         ObjectProvider.class == descriptor.getDependencyType()) {
      return new DependencyObjectProvider(descriptor, requestingBeanName);
   }
   //对等ObjectFactory
   else if (javaxInjectProviderClass == descriptor.getDependencyType()) {
      return new Jsr330ProviderFactory().createDependencyProvider(descriptor, requestingBeanName);
   }
   else {
      Object result = getAutowireCandidateResolver().getLazyResolutionProxyIfNecessary(
            descriptor, requestingBeanName);
      if (result == null) {
         result = doResolveDependency(descriptor, requestingBeanName, autowiredBeanNames, typeConverter);
      }
      return result;
   }
}
```

前三个分支情况用到的不多，值得注意是[ObjectFactory与ObjectProvider](https://blog.csdn.net/shenchaohao12321/article/details/107130945)，直接看else分支的代码：拿到bean factory的autowireCandidateResolver(默认是SimpleAutowireCandidateResolver，如果基于注解驱动模式会被替换为ContextAnnotationAutowireCandidateResolver），首先尝试调用getLazyResolutionProxyIfNecessary()方法获取一个懒加载对象，获取不到则调用doResolveDependency()方法获取真正的对象。

```java
public Object doResolveDependency(DependencyDescriptor descriptor, @Nullable String beanName,
      @Nullable Set<String> autowiredBeanNames, @Nullable TypeConverter typeConverter) throws BeansException {
   InjectionPoint previousInjectionPoint = ConstructorResolver.setCurrentInjectionPoint(descriptor);
   try {
      Object shortcut = descriptor.resolveShortcut(this);
      if (shortcut != null) {
         return shortcut;
      }
      Class<?> type = descriptor.getDependencyType();
      Object value = getAutowireCandidateResolver().getSuggestedValue(descriptor);
      if (value != null) {
         if (value instanceof String) {
            String strVal = resolveEmbeddedValue((String) value);
            BeanDefinition bd = (beanName != null && containsBean(beanName) ? getMergedBeanDefinition(beanName) : null);
            value = evaluateBeanDefinitionString(strVal, bd);
         }
         TypeConverter converter = (typeConverter != null ? typeConverter : getTypeConverter());
         return (descriptor.getField() != null ?
               converter.convertIfNecessary(value, type, descriptor.getField()) :
               converter.convertIfNecessary(value, type, descriptor.getMethodParameter()));
      }
      Object multipleBeans = resolveMultipleBeans(descriptor, beanName, autowiredBeanNames, typeConverter);
      if (multipleBeans != null) {
         return multipleBeans;
      }
      Map<String, Object> matchingBeans = findAutowireCandidates(beanName, type, descriptor);
      if (matchingBeans.isEmpty()) {
         if (isRequired(descriptor)) {
            raiseNoMatchingBeanFound(type, descriptor.getResolvableType(), descriptor);
         }
         return null;
      }
      String autowiredBeanName;
      Object instanceCandidate;
      if (matchingBeans.size() > 1) {
         autowiredBeanName = determineAutowireCandidate(matchingBeans, descriptor);
         if (autowiredBeanName == null) {
            if (isRequired(descriptor) || !indicatesMultipleBeans(type)) {
               return descriptor.resolveNotUnique(type, matchingBeans);
            }
            else {
               // In case of an optional Collection/Map, silently ignore a non-unique case:
               // possibly it was meant to be an empty collection of multiple regular beans
               // (before 4.3 in particular when we didn't even look for collection beans).
               return null;
            }
         }
         instanceCandidate = matchingBeans.get(autowiredBeanName);
      }
      else {
         // We have exactly one match.
         Map.Entry<String, Object> entry = matchingBeans.entrySet().iterator().next();
         autowiredBeanName = entry.getKey();
         instanceCandidate = entry.getValue();
      }
      if (autowiredBeanNames != null) {
         autowiredBeanNames.add(autowiredBeanName);
      }
      if (instanceCandidate instanceof Class) {
         instanceCandidate = descriptor.resolveCandidate(autowiredBeanName, type, this);
      }
      Object result = instanceCandidate;
      if (result instanceof NullBean) {
         if (isRequired(descriptor)) {
            raiseNoMatchingBeanFound(type, descriptor.getResolvableType(), descriptor);
         }
         result = null;
      }
      if (!ClassUtils.isAssignableValue(type, result)) {
         throw new BeanNotOfRequiredTypeException(autowiredBeanName, type, instanceCandidate.getClass());
      }
      return result;
   }
   finally {
      ConstructorResolver.setCurrentInjectionPoint(previousInjectionPoint);
   }
}
```

先使用autowireCandidateResolver的getSuggestedValue()方法(可处理@Value)获取一个值，然后经过StringValueResolver和BeanExpressionResolver的处理使用转换器转换为descriptor的依赖类型。

resolveMultipleBeans()用来处理数组，集合和map类型的。

findAutowireCandidates()方法找出符合DependencyDescriptor的所有bean，在从中选择一个最适合的规则是@Primary的优先于@Order或@javax.annotation.Priority优先于名字匹配的。

```java
protected Map<String, Object> findAutowireCandidates(
      @Nullable String beanName, Class<?> requiredType, DependencyDescriptor descriptor) {
   String[] candidateNames = BeanFactoryUtils.beanNamesForTypeIncludingAncestors(
         this, requiredType, true, descriptor.isEager());
   Map<String, Object> result = new LinkedHashMap<>(candidateNames.length);
   for (Class<?> autowiringType : this.resolvableDependencies.keySet()) {
      if (autowiringType.isAssignableFrom(requiredType)) {
         Object autowiringValue = this.resolvableDependencies.get(autowiringType);
         autowiringValue = AutowireUtils.resolveAutowiringValue(autowiringValue, requiredType);
         if (requiredType.isInstance(autowiringValue)) {
            result.put(ObjectUtils.identityToString(autowiringValue), autowiringValue);
            break;
         }
      }
   }
   for (String candidate : candidateNames) {
      if (!isSelfReference(beanName, candidate) && isAutowireCandidate(candidate, descriptor)) {
         addCandidateEntry(result, candidate, descriptor, requiredType);
      }
   }
   if (result.isEmpty() && !indicatesMultipleBeans(requiredType)) {
      // Consider fallback matches if the first pass failed to find anything...
      DependencyDescriptor fallbackDescriptor = descriptor.forFallbackMatch();
      for (String candidate : candidateNames) {
         if (!isSelfReference(beanName, candidate) && isAutowireCandidate(candidate, fallbackDescriptor)) {
            addCandidateEntry(result, candidate, descriptor, requiredType);
         }
      }
      if (result.isEmpty()) {
         // Consider self references as a final pass...
         // but in the case of a dependency collection, not the very same bean itself.
         for (String candidate : candidateNames) {
            if (isSelfReference(beanName, candidate) &&
                  (!(descriptor instanceof MultiElementDescriptor) || !beanName.equals(candidate)) &&
                  isAutowireCandidate(candidate, fallbackDescriptor)) {
               addCandidateEntry(result, candidate, descriptor, requiredType);
            }
         }
      }
   }
   return result;
}
```

```java
protected String determineAutowireCandidate(Map<String, Object> candidates, DependencyDescriptor descriptor) {
   Class<?> requiredType = descriptor.getDependencyType();
   String primaryCandidate = determinePrimaryCandidate(candidates, requiredType);
   if (primaryCandidate != null) {
      return primaryCandidate;
   }
   String priorityCandidate = determineHighestPriorityCandidate(candidates, requiredType);
   if (priorityCandidate != null) {
      return priorityCandidate;
   }
   // Fallback
   for (Map.Entry<String, Object> entry : candidates.entrySet()) {
      String candidateName = entry.getKey();
      Object beanInstance = entry.getValue();
      if ((beanInstance != null && this.resolvableDependencies.containsValue(beanInstance)) ||
            matchesBeanName(candidateName, descriptor.getDependencyName())) {
         return candidateName;
      }
   }
   return null;
}
```

如果注册了InstantiationAwareBeanPostProcessor，调用他的postProcessPropertyValues()方法，如果返回的pvs为null则直接返回不进行下面的赋值操作。

applyPropertyValues()方法中主要使用bw.setPropertyValues(mpvs)对bean进行赋值，其中会将未转换的引用类型翻译成相应的bean再赋值。

```java
protected void applyPropertyValues(String beanName, BeanDefinition mbd, BeanWrapper bw, PropertyValues pvs) {
   if (pvs.isEmpty()) {
      return;
   }
   MutablePropertyValues mpvs = null;
   List<PropertyValue> original;
   if (System.getSecurityManager() != null) {
      if (bw instanceof BeanWrapperImpl) {
         ((BeanWrapperImpl) bw).setSecurityContext(getAccessControlContext());
      }
   }
   if (pvs instanceof MutablePropertyValues) {
      mpvs = (MutablePropertyValues) pvs;
      if (mpvs.isConverted()) {
         // Shortcut: use the pre-converted values as-is.
         try {
            bw.setPropertyValues(mpvs);
            return;
         }
         catch (BeansException ex) {
            throw new BeanCreationException(
                  mbd.getResourceDescription(), beanName, "Error setting property values", ex);
         }
      }
      original = mpvs.getPropertyValueList();
   }
   else {
      original = Arrays.asList(pvs.getPropertyValues());
   }
   TypeConverter converter = getCustomTypeConverter();
   if (converter == null) {
      converter = bw;
   }
   BeanDefinitionValueResolver valueResolver = new BeanDefinitionValueResolver(this, beanName, mbd, converter);
   // Create a deep copy, resolving any references for values.
   List<PropertyValue> deepCopy = new ArrayList<>(original.size());
   boolean resolveNecessary = false;
   for (PropertyValue pv : original) {
      if (pv.isConverted()) {
         deepCopy.add(pv);
      }
      else {
         String propertyName = pv.getName();
         Object originalValue = pv.getValue();
         Object resolvedValue = valueResolver.resolveValueIfNecessary(pv, originalValue);
         Object convertedValue = resolvedValue;
         boolean convertible = bw.isWritableProperty(propertyName) &&
               !PropertyAccessorUtils.isNestedOrIndexedProperty(propertyName);
         if (convertible) {
            convertedValue = convertForProperty(resolvedValue, propertyName, bw, converter);
         }
         // Possibly store converted value in merged bean definition,
         // in order to avoid re-conversion for every created bean instance.
         if (resolvedValue == originalValue) {
            if (convertible) {
               pv.setConvertedValue(convertedValue);
            }
            deepCopy.add(pv);
         }
         else if (convertible && originalValue instanceof TypedStringValue &&
               !((TypedStringValue) originalValue).isDynamic() &&
               !(convertedValue instanceof Collection || ObjectUtils.isArray(convertedValue))) {
            pv.setConvertedValue(convertedValue);
            deepCopy.add(pv);
         }
         else {
            resolveNecessary = true;
            deepCopy.add(new PropertyValue(pv, convertedValue));
         }
      }
   }
   if (mpvs != null && !resolveNecessary) {
      mpvs.setConverted();
   }
   // Set our (possibly massaged) deep copy.
   try {
      bw.setPropertyValues(new MutablePropertyValues(deepCopy));
   }
   catch (BeansException ex) {
      throw new BeanCreationException(
            mbd.getResourceDescription(), beanName, "Error setting property values", ex);
   }
}
```

initializeBean()用于设置Aware接口，执行初始化方法以及应用BeanPostProcessor。

```java
protected Object initializeBean(final String beanName, final Object bean, @Nullable RootBeanDefinition mbd) {
   if (System.getSecurityManager() != null) {
      AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
         invokeAwareMethods(beanName, bean);
         return null;
      }, getAccessControlContext());
   }
   else {
      invokeAwareMethods(beanName, bean);
   }
   Object wrappedBean = bean;
   if (mbd == null || !mbd.isSynthetic()) {
      wrappedBean = applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName);
   }
   try {
      invokeInitMethods(beanName, wrappedBean, mbd);
   }
   catch (Throwable ex) {
      throw new BeanCreationException(
            (mbd != null ? mbd.getResourceDescription() : null),
            beanName, "Invocation of init method failed", ex);
   }
   if (mbd == null || !mbd.isSynthetic()) {
      wrappedBean = applyBeanPostProcessorsAfterInitialization(wrappedBean, beanName);
   }
   return wrappedBean;
}
```

```java
private void invokeAwareMethods(final String beanName, final Object bean) {
   if (bean instanceof Aware) {
      if (bean instanceof BeanNameAware) {
         ((BeanNameAware) bean).setBeanName(beanName);
      }
      if (bean instanceof BeanClassLoaderAware) {
         ClassLoader bcl = getBeanClassLoader();
         if (bcl != null) {
            ((BeanClassLoaderAware) bean).setBeanClassLoader(bcl);
         }
      }
      if (bean instanceof BeanFactoryAware) {
         ((BeanFactoryAware) bean).setBeanFactory(AbstractAutowireCapableBeanFactory.this);
      }
   }
}
```

如果bean实现了InitializingBean接口则先调用afterPropertiesSet()方法，后调用自定义的初始化方法。

```java
protected void invokeInitMethods(String beanName, final Object bean, @Nullable RootBeanDefinition mbd) throws Throwable {
   boolean isInitializingBean = (bean instanceof InitializingBean);
   if (isInitializingBean && (mbd == null || !mbd.isExternallyManagedInitMethod("afterPropertiesSet"))) {
      if (logger.isDebugEnabled()) {
         logger.debug("Invoking afterPropertiesSet() on bean with name '" + beanName + "'");
      }
      if (System.getSecurityManager() != null) {
         try {
            AccessController.doPrivileged((PrivilegedExceptionAction<Object>) () -> {
               ((InitializingBean) bean).afterPropertiesSet();
               return null;
            }, getAccessControlContext());
         }
         catch (PrivilegedActionException pae) {
            throw pae.getException();
         }
      }
      else {
         ((InitializingBean) bean).afterPropertiesSet();
      }
   }
   if (mbd != null && bean.getClass() != NullBean.class) {
      String initMethodName = mbd.getInitMethodName();
      if (StringUtils.hasLength(initMethodName) &&
            !(isInitializingBean && "afterPropertiesSet".equals(initMethodName)) &&
            !mbd.isExternallyManagedInitMethod(initMethodName)) {
         invokeCustomInitMethod(beanName, bean, mbd);
      }
   }
}
```

最后registerDisposableBeanIfNecessary()方法用于注册销毁是需要处理的bean。

```java
protected void registerDisposableBeanIfNecessary(String beanName, Object bean, RootBeanDefinition mbd) {
   AccessControlContext acc = (System.getSecurityManager() != null ? getAccessControlContext() : null);
   if (!mbd.isPrototype() && requiresDestruction(bean, mbd)) {
      if (mbd.isSingleton()) {
         // Register a DisposableBean implementation that performs all destruction
         // work for the given bean: DestructionAwareBeanPostProcessors,
         // DisposableBean interface, custom destroy method.
         registerDisposableBean(beanName,
               new DisposableBeanAdapter(bean, beanName, mbd, getBeanPostProcessors(), acc));
      }
      else {
         // A bean with a custom scope...
         Scope scope = this.scopes.get(mbd.getScope());
         if (scope == null) {
            throw new IllegalStateException("No Scope registered for scope name '" + mbd.getScope() + "'");
         }
         scope.registerDestructionCallback(beanName,
               new DisposableBeanAdapter(bean, beanName, mbd, getBeanPostProcessors(), acc));
      }
   }
}
```

满足下面条件之一就可以注册：

- bean实现了DisposableBean或AutoCloseable接口。
- bean definition中存在destroyMethodName。
- 注册了DestructionAwareBeanPostProcessor且requiresDestruction()返回值为true。

```java
protected boolean requiresDestruction(Object bean, RootBeanDefinition mbd) {
   return (bean.getClass() != NullBean.class &&
         (DisposableBeanAdapter.hasDestroyMethod(bean, mbd) || (hasDestructionAwareBeanPostProcessors() &&
               DisposableBeanAdapter.hasApplicableProcessors(bean, getBeanPostProcessors()))));
}
```
