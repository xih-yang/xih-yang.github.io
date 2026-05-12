# 16、Spring源码分析 - 16-AutowiredAnnotationBeanPostProcessor
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/16.html
- 分类：J2EE框架
- 分组：教程目录
AutowiredAnnotationBeanPostProcessor继承了InstantiationAwareBeanPostProcessorAdapter间接实现了SmartInstantiationAwareBeanPostProcessor接口覆盖了determineCandidateConstructors()方法，此方法在实例化bean前选取一个构造方法数组，请参考bean创建的流程[/zhuanlan/j2ee/spring/7/11.html](/zhuanlan/j2ee/spring/7/11.html)和[/zhuanlan/j2ee/spring/7/12.html](/zhuanlan/j2ee/spring/7/12.html)

先看determineCandidateConstructors()方法的前一小段是处理@Lookup注解的。

```java
if (!this.lookupMethodsChecked.contains(beanName)) {
   try {
      ReflectionUtils.doWithMethods(beanClass, method -> {
         Lookup lookup = method.getAnnotation(Lookup.class);
         if (lookup != null) {
            Assert.state(beanFactory != null, "No BeanFactory available");
            LookupOverride override = new LookupOverride(method, lookup.value());
            try {
               RootBeanDefinition mbd = (RootBeanDefinition) beanFactory.getMergedBeanDefinition(beanName);
               mbd.getMethodOverrides().addOverride(override);
            }
            catch (NoSuchBeanDefinitionException ex) {
               throw new BeanCreationException(beanName,
                  "Cannot apply @Lookup to beans without corresponding bean definition");
            }
         }
      });
   }
   catch (IllegalStateException ex) {
      throw new BeanCreationException(beanName, "Lookup method resolution failed", ex);
   }
   this.lookupMethodsChecked.add(beanName);
}
```

将beanClass被@Lookup标记的方法封装到LookupOverride中，通过mbd.getMethodOverrides().addOverride(override)加入到BeanDefinition中，后面会在AbstractAutowireCapableBeanFactory的instantiateBean()方法中，会使用CglibSubclassingInstantiationStrategy的instantiate()方法创建bean对象。

```java
@Override
public Object instantiate(RootBeanDefinition bd, @Nullable String beanName, BeanFactory owner) {
   // Don't override the class with CGLIB if no overrides.
   if (!bd.hasMethodOverrides()) {
      Constructor<?> constructorToUse;
      synchronized (bd.constructorArgumentLock) {
         constructorToUse = (Constructor<?>) bd.resolvedConstructorOrFactoryMethod;
         if (constructorToUse == null) {
            final Class<?> clazz = bd.getBeanClass();
            if (clazz.isInterface()) {
               throw new BeanInstantiationException(clazz, "Specified class is an interface");
            }
            try {
               if (System.getSecurityManager() != null) {
                  constructorToUse = AccessController.doPrivileged(
                        (PrivilegedExceptionAction<Constructor<?>>) clazz::getDeclaredConstructor);
               }
               else {
                  constructorToUse = clazz.getDeclaredConstructor();
               }
               bd.resolvedConstructorOrFactoryMethod = constructorToUse;
            }
            catch (Throwable ex) {
               throw new BeanInstantiationException(clazz, "No default constructor found", ex);
            }
         }
      }
      return BeanUtils.instantiateClass(constructorToUse);
   }
   else {
      // Must generate CGLIB subclass.
      return instantiateWithMethodInjection(bd, beanName, owner);
   }
}
```

可以看到如果!bd.hasMethodOverrides()则走instantiateWithMethodInjection()方法，这个方法内使用了CglibSubclassingInstantiationStrategy内部类CglibSubclassCreator来创建cglib的代理对象。CglibSubclassCreator使用的callback拦截器就包含LookupOverrideMethodInterceptor。

```java
private static class LookupOverrideMethodInterceptor extends CglibIdentitySupport implements MethodInterceptor {
   private final BeanFactory owner;
   public LookupOverrideMethodInterceptor(RootBeanDefinition beanDefinition, BeanFactory owner) {
      super(beanDefinition);
      this.owner = owner;
   }
   @Override
   public Object intercept(Object obj, Method method, Object[] args, MethodProxy mp) throws Throwable {
      // Cast is safe, as CallbackFilter filters are used selectively.
      LookupOverride lo = (LookupOverride) getBeanDefinition().getMethodOverrides().getOverride(method);
      Assert.state(lo != null, "LookupOverride not found");
      Object[] argsToUse = (args.length > 0 ? args : null);  // if no-arg, don't insist on args at all
      if (StringUtils.hasText(lo.getBeanName())) {
         return (argsToUse != null ? this.owner.getBean(lo.getBeanName(), argsToUse) :
               this.owner.getBean(lo.getBeanName()));
      }
      else {
         return (argsToUse != null ? this.owner.getBean(method.getReturnType(), argsToUse) :
               this.owner.getBean(method.getReturnType()));
      }
   }
}
```

如果调用的方法是被标记的，如果配置了@Lookup的value属性则从BeanFactory中取出bean name为@Lookup的value属性的bean对象返回，否则根据方法的返回类型从BeanFactory中取出相应的bean对象。

以上就是@Lookup的处理过程。

determineCandidateConstructors()方法的剩余部分就是挑选出候选的构造方法，从所有声明的构造方法选取带有@Autowired注解的，但是@Autowired的required==true的只能有一个，如果还有无参构造方法，再加上无参构造方法。如下：

```java
// Quick check on the concurrent map first, with minimal locking.
Constructor<?>[] candidateConstructors = this.candidateConstructorsCache.get(beanClass);
if (candidateConstructors == null) {
   // Fully synchronized resolution now...
   synchronized (this.candidateConstructorsCache) {
      candidateConstructors = this.candidateConstructorsCache.get(beanClass);
      if (candidateConstructors == null) {
         Constructor<?>[] rawCandidates;
         try {
            rawCandidates = beanClass.getDeclaredConstructors();
         }
         catch (Throwable ex) {
            throw new BeanCreationException(beanName,
                  "Resolution of declared constructors on bean Class [" + beanClass.getName() +
                  "] from ClassLoader [" + beanClass.getClassLoader() + "] failed", ex);
         }
         List<Constructor<?>> candidates = new ArrayList<>(rawCandidates.length);
         Constructor<?> requiredConstructor = null;
         Constructor<?> defaultConstructor = null;
         Constructor<?> primaryConstructor = BeanUtils.findPrimaryConstructor(beanClass);
         int nonSyntheticConstructors = 0;
         for (Constructor<?> candidate : rawCandidates) {
            // 非合成的，用户自定义的构造方法都是非合成的，JVM可能会产生合成的因此过滤掉
            if (!candidate.isSynthetic()) {
               nonSyntheticConstructors++;
            }
            else if (primaryConstructor != null) {
               continue;
            }
            // 构造方法上所有注解属性
            AnnotationAttributes ann = findAutowiredAnnotation(candidate);
            // 子类没有的话可能父类构造方法存在(覆盖了)
            if (ann == null) {
               Class<?> userClass = ClassUtils.getUserClass(beanClass);
               if (userClass != beanClass) {
                  try {
                     Constructor<?> superCtor =
                           userClass.getDeclaredConstructor(candidate.getParameterTypes());
                     ann = findAutowiredAnnotation(superCtor);
                  }
                  catch (NoSuchMethodException ex) {
                     // Simply proceed, no equivalent superclass constructor found...
                  }
               }
            }
            if (ann != null) {
               // 只允许存在一个@Autowired(required=true)的构造方法
               if (requiredConstructor != null) {
                  throw new BeanCreationException(beanName,
                        "Invalid autowire-marked constructor: " + candidate +
                        ". Found constructor with 'required' Autowired annotation already: " +
                        requiredConstructor);
               }
               boolean required = determineRequiredStatus(ann);
               if (required) {
                  if (!candidates.isEmpty()) {
                     throw new BeanCreationException(beanName,
                           "Invalid autowire-marked constructors: " + candidates +
                           ". Found constructor with 'required' Autowired annotation: " +
                           candidate);
                  }
                  requiredConstructor = candidate;
               }
               candidates.add(candidate);
            }
            // 默认构造方法
            else if (candidate.getParameterCount() == 0) {
               defaultConstructor = candidate;
            }
         }
         if (!candidates.isEmpty()) {
            // Add default constructor to list of optional constructors, as fallback.
            if (requiredConstructor == null) {
               // 如果不存在@Autowired构造方法，无惨构造方法没有@Autowired也作为候选
               if (defaultConstructor != null) {
                  candidates.add(defaultConstructor);
               }
               else if (candidates.size() == 1 && logger.isInfoEnabled()) {
                  logger.info("Inconsistent constructor declaration on bean with name '" + beanName +
                        "': single autowire-marked constructor flagged as optional - " +
                        "this constructor is effectively required since there is no " +
                        "default constructor to fall back to: " + candidates.get(0));
               }
            }
            candidateConstructors = candidates.toArray(new Constructor<?>[0]);
         }
         // 只存在一个构造方法只能用它了
         else if (rawCandidates.length == 1 && rawCandidates[0].getParameterCount() > 0) {
            candidateConstructors = new Constructor<?>[] {rawCandidates[0]};
         }
         // 如果只有两个构造方法，一个是带有@Primary一个是无参不带注解的，则这两个都作为候选构造方法
         else if (nonSyntheticConstructors == 2 && primaryConstructor != null &&
               defaultConstructor != null && !primaryConstructor.equals(defaultConstructor)) {
            candidateConstructors = new Constructor<?>[] {primaryConstructor, defaultConstructor};
         }
         // 只有一个@Primary构造方法
         else if (nonSyntheticConstructors == 1 && primaryConstructor != null) {
            candidateConstructors = new Constructor<?>[] {primaryConstructor};
         }
         else {
            candidateConstructors = new Constructor<?>[0];
         }
         this.candidateConstructorsCache.put(beanClass, candidateConstructors);
      }
   }
}
return (candidateConstructors.length > 0 ? candidateConstructors : null);
```

一个bean实例创建之后但此时还没有调用populateBean()方法完成属性的填充时，会经历MergedBeanDefinitionPostProcessor的postProcessMergedBeanDefinition()方法。

```java
@Override
public void postProcessMergedBeanDefinition(RootBeanDefinition beanDefinition, Class<?> beanType, String beanName) {
   // InjectionMetadata可对指定对象进行注入(字段或方法)
   InjectionMetadata metadata = findAutowiringMetadata(beanName, beanType, null);
   metadata.checkConfigMembers(beanDefinition);
}
```

```java
private InjectionMetadata findAutowiringMetadata(String beanName, Class<?> clazz, @Nullable PropertyValues pvs) {
   // Fall back to class name as cache key, for backwards compatibility with custom callers.
   String cacheKey = (StringUtils.hasLength(beanName) ? beanName : clazz.getName());
   // Quick check on the concurrent map first, with minimal locking.
   InjectionMetadata metadata = this.injectionMetadataCache.get(cacheKey);
   if (InjectionMetadata.needsRefresh(metadata, clazz)) {
      synchronized (this.injectionMetadataCache) {
         metadata = this.injectionMetadataCache.get(cacheKey);
         if (InjectionMetadata.needsRefresh(metadata, clazz)) {
            if (metadata != null) {
               metadata.clear(pvs);
            }
            // 构建由@Autowired、@Value、@Inject注解的字段或方法的InjectionMetadata
            metadata = buildAutowiringMetadata(clazz);
            this.injectionMetadataCache.put(cacheKey, metadata);
         }
      }
   }
   return metadata;
}
```

injectionMetadataCache是一个Map对象，缓存beanName与InjectionMetadata。InjectionMetadata对象通过buildAutowiringMetadata()方法来创建的。

```java
private InjectionMetadata buildAutowiringMetadata(final Class<?> clazz) {
   LinkedList<InjectionMetadata.InjectedElement> elements = new LinkedList<>();
   Class<?> targetClass = clazz;
   do {
      final LinkedList<InjectionMetadata.InjectedElement> currElements = new LinkedList<>();
      ReflectionUtils.doWithLocalFields(targetClass, field -> {
         AnnotationAttributes ann = findAutowiredAnnotation(field);
         if (ann != null) {
            if (Modifier.isStatic(field.getModifiers())) {
               if (logger.isWarnEnabled()) {
                  logger.warn("Autowired annotation is not supported on static fields: " + field);
               }
               return;
            }
            boolean required = determineRequiredStatus(ann);
            // 保存带有自动装配注解的非静态字段
            currElements.add(new AutowiredFieldElement(field, required));
         }
      });
      ReflectionUtils.doWithLocalMethods(targetClass, method -> {
         Method bridgedMethod = BridgeMethodResolver.findBridgedMethod(method);
         if (!BridgeMethodResolver.isVisibilityBridgeMethodPair(method, bridgedMethod)) {
            return;
         }
         AnnotationAttributes ann = findAutowiredAnnotation(bridgedMethod);
         if (ann != null && method.equals(ClassUtils.getMostSpecificMethod(method, clazz))) {
            if (Modifier.isStatic(method.getModifiers())) {
               if (logger.isWarnEnabled()) {
                  logger.warn("Autowired annotation is not supported on static methods: " + method);
               }
               return;
            }
            if (method.getParameterCount() == 0) {
               if (logger.isWarnEnabled()) {
                  logger.warn("Autowired annotation should only be used on methods with parameters: " +
                        method);
               }
            }
            boolean required = determineRequiredStatus(ann);
            PropertyDescriptor pd = BeanUtils.findPropertyForMethod(bridgedMethod, clazz);
            // 保存带有自动装配注解的非静态方法
            currElements.add(new AutowiredMethodElement(method, required, pd));
         }
      });
      elements.addAll(0, currElements);
      targetClass = targetClass.getSuperclass();
   }
   while (targetClass != null && targetClass != Object.class);
   return new InjectionMetadata(clazz, elements);
}
```

buildAutowiringMetadata()方法分为对字段与方法的@Autowired(@Value,@Inject)注解处理。将标记@Autowired的费静态字段封装为AutowiredFieldElement对象，将标记@Autowired的非静态方法封装到AutowiredMethodElement对象然后都加入到InjectionMetadata中，此过程是一个循环过程此类处理完会沿着父类继续向上处理。AutowiredFieldElement与AutowiredMethodElement都是InjectionMetadata.InjectedElement的子类，都覆盖了父类的inject()方法这个下面会介绍。

通过findAutowiringMetadata()方法得到了InjectionMetadata对象之后调用了给对象的checkConfigMembers()方法。这个方法就是将上面保存的InjectedElement对象筛选出那些不存在于beanDefinition中的赋值给checkedElements。

```java
public void checkConfigMembers(RootBeanDefinition beanDefinition) {
   Set<InjectedElement> checkedElements = new LinkedHashSet<>(this.injectedElements.size());
   for (InjectedElement element : this.injectedElements) {
      Member member = element.getMember();
      if (!beanDefinition.isExternallyManagedConfigMember(member)) {
         beanDefinition.registerExternallyManagedConfigMember(member);
         checkedElements.add(element);
         if (logger.isDebugEnabled()) {
            logger.debug("Registered injected element on class [" + this.targetClass.getName() + "]: " + element);
         }
      }
   }
   this.checkedElements = checkedElements;
}
```

到这为止就是postProcessMergedBeanDefinition()方法的全部实现逻辑并没有做什么实际事情，其实是为了后面的行为做铺垫，请看postProcessPropertyValues()方法(在Spring5.1推荐使用postProcessProperties方法)，此方法是在属性填充阶段被调用的。

```java
@Override
public PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName) {
   InjectionMetadata metadata = findAutowiringMetadata(beanName, bean.getClass(), pvs);
   try {
      metadata.inject(bean, beanName, pvs);
   }
   catch (BeanCreationException ex) {
      throw ex;
   }
   catch (Throwable ex) {
      throw new BeanCreationException(beanName, "Injection of autowired dependencies failed", ex);
   }
   return pvs;
}
@Deprecated
@Override
public PropertyValues postProcessPropertyValues(
      PropertyValues pvs, PropertyDescriptor[] pds, Object bean, String beanName) {
   return postProcessProperties(pvs, bean, beanName);
}
```

首先调用 findAutowiringMetadata()方法从缓存中再次取到InjectionMetadata对象，调用inject()方法完成autowired注入。

```java
public void inject(Object target, @Nullable String beanName, @Nullable PropertyValues pvs) throws Throwable {
   Collection<InjectedElement> checkedElements = this.checkedElements;
   Collection<InjectedElement> elementsToIterate =
         (checkedElements != null ? checkedElements : this.injectedElements);
   if (!elementsToIterate.isEmpty()) {
      boolean debug = logger.isDebugEnabled();
      for (InjectedElement element : elementsToIterate) {
         if (debug) {
            logger.debug("Processing injected element of bean '" + beanName + "': " + element);
         }
         element.inject(target, beanName, pvs);
      }
   }
}
```

因为之前已经把类@Autowired注解标记的字段或方法封装到了响应的InjectedElement子类中了，此时依次调用子类的inject()方法完成对象的注入，下面分别看一看这两种注入的实现。

**AutowiredFieldElement，调用BeanFactory的**resolveDependency()方法返回一个符合字段类型的bean对象设置到此bean上。

```java
@Override
protected void inject(Object bean, @Nullable String beanName, @Nullable PropertyValues pvs) throws Throwable {
   Field field = (Field) this.member;
   Object value;
   // 解析过一次会缓存cachedFieldValue
   if (this.cached) {
      value = resolvedCachedArgument(beanName, this.cachedFieldValue);
   }
   else {
      DependencyDescriptor desc = new DependencyDescriptor(field, this.required);
      desc.setContainingClass(bean.getClass());
      Set<String> autowiredBeanNames = new LinkedHashSet<>(1);
      Assert.state(beanFactory != null, "No BeanFactory available");
      TypeConverter typeConverter = beanFactory.getTypeConverter();
      try {
         value = beanFactory.resolveDependency(desc, beanName, autowiredBeanNames, typeConverter);
      }
      catch (BeansException ex) {
         throw new UnsatisfiedDependencyException(null, beanName, new InjectionPoint(field), ex);
      }
      synchronized (this) {
         if (!this.cached) {
            if (value != null || this.required) {
               this.cachedFieldValue = desc;
               registerDependentBeans(beanName, autowiredBeanNames);
               if (autowiredBeanNames.size() == 1) {
                  String autowiredBeanName = autowiredBeanNames.iterator().next();
                  if (beanFactory.containsBean(autowiredBeanName) &&
                        beanFactory.isTypeMatch(autowiredBeanName, field.getType())) {
                     // 以后注入就可以直接使用这个带有beanname的DependencyDescriptor更高效
                     this.cachedFieldValue = new ShortcutDependencyDescriptor(
                           desc, autowiredBeanName, field.getType());
                  }
               }
            }
            else {
               this.cachedFieldValue = null;
            }
            this.cached = true;
         }
      }
   }
   // 字段赋值
   if (value != null) {
      ReflectionUtils.makeAccessible(field);
      field.set(bean, value);
   }
}
```

**AutowiredMethodElement，类似通过setter方法完成属性的注入。**

```java
@Override
protected void inject(Object bean, @Nullable String beanName, @Nullable PropertyValues pvs) throws Throwable {
   if (checkPropertySkipping(pvs)) {
      return;
   }
   Method method = (Method) this.member;
   Object[] arguments;
   if (this.cached) {
      // Shortcut for avoiding synchronization...
      arguments = resolveCachedArguments(beanName);
   }
   else {
      Class<?>[] paramTypes = method.getParameterTypes();
      arguments = new Object[paramTypes.length];
      DependencyDescriptor[] descriptors = new DependencyDescriptor[paramTypes.length];
      Set<String> autowiredBeans = new LinkedHashSet<>(paramTypes.length);
      Assert.state(beanFactory != null, "No BeanFactory available");
      TypeConverter typeConverter = beanFactory.getTypeConverter();
      for (int i = 0; i < arguments.length; i++) {
         MethodParameter methodParam = new MethodParameter(method, i);
         DependencyDescriptor currDesc = new DependencyDescriptor(methodParam, this.required);
         currDesc.setContainingClass(bean.getClass());
         descriptors[i] = currDesc;
         try {
            Object arg = beanFactory.resolveDependency(currDesc, beanName, autowiredBeans, typeConverter);
            if (arg == null && !this.required) {
               arguments = null;
               break;
            }
            arguments[i] = arg;
         }
         catch (BeansException ex) {
            throw new UnsatisfiedDependencyException(null, beanName, new InjectionPoint(methodParam), ex);
         }
      }
      synchronized (this) {
         if (!this.cached) {
            if (arguments != null) {
               Object[] cachedMethodArguments = new Object[paramTypes.length];
               System.arraycopy(descriptors, 0, cachedMethodArguments, 0, arguments.length);
               registerDependentBeans(beanName, autowiredBeans);
               if (autowiredBeans.size() == paramTypes.length) {
                  Iterator<String> it = autowiredBeans.iterator();
                  for (int i = 0; i < paramTypes.length; i++) {
                     String autowiredBeanName = it.next();
                     if (beanFactory.containsBean(autowiredBeanName) &&
                           beanFactory.isTypeMatch(autowiredBeanName, paramTypes[i])) {
                        cachedMethodArguments[i] = new ShortcutDependencyDescriptor(
                              descriptors[i], autowiredBeanName, paramTypes[i]);
                     }
                  }
               }
               this.cachedMethodArguments = cachedMethodArguments;
            }
            else {
               this.cachedMethodArguments = null;
            }
            this.cached = true;
         }
      }
   }
   if (arguments != null) {
      try {
         ReflectionUtils.makeAccessible(method);
         method.invoke(bean, arguments);
      }
      catch (InvocationTargetException ex){
         throw ex.getTargetException();
      }
   }
}
```
