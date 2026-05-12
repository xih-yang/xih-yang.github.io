# 20、Spring源码分析 - 20-Spring事件/监听器机制
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/20.html
- 分类：J2EE框架
- 分组：教程目录
ApplicationContext提供事件处理通过ApplicationEvent类和ApplicationListener接口。如果一个bean实现ApplicationListener接口在容器中,每次一个ApplicationEvent被发布到ApplicationContext中,这类bean就会收到这些通知。从本质上讲,这是标准的观察者设计模式。

实现Spring事件机制主要有4个类：

- ApplicationEvent：事件，每个实现类表示一类事件，可携带数据。
- ApplicationListener：事件监听器，用于接收事件处理时间。
- ApplicationEventMulticaster：事件管理者，用于事件监听器的注册和事件的广播。
- ApplicationEventPublisher：事件发布者，委托ApplicationEventMulticaster完成事件发布。

## 1、Spring中的事件：ApplicationEvent

观察者模式中传播的数据比较抽象，如Observable可发布任意的Object，而事件/监听器模式所发布的内容则有类型限制，在Java中他必须是java.util.EventObject对象，虽然在Java语言层面并无此限制，不过这是行之有年的业界规则，所以无论Java Beans还是Java AWT/Swing都遵照改规则，Spring事件自然也不会例外，所以Spring事件抽象类ApplicationEvent必然扩展EventObject。ApplicationEvent事件就是一个包含了任意对象并含有事件对象创建时间戳的类。

```java
public abstract class ApplicationEvent extends EventObject {
   private static final long serialVersionUID = 7099057708183571937L;
   private final long timestamp;
   public ApplicationEvent(Object source) {
      super(source);
      this.timestamp = System.currentTimeMillis();
   }
   public final long getTimestamp() {
      return this.timestamp;
   }
}
```

EventObject并不提供默认构造器，它需要外部传递一个名为source的构造器参数用于记录并跟踪事件的来源，如Spring事件ContextRefreshedEvent，其事件源为当前ApplicationContext。

下表描述了Spring提供的标准事件:

Spring内置事件

事件
描述

`ContextRefreshedEvent`

事件发布在ApplicationContext初始化或刷新时(例如,通过在ConfigurableApplicationContext接口使用refresh()方法)。这里,“初始化”意味着所有bean加载,post-processor bean被检测到并且激活,单例预先实例化,ApplicationContext对象可以使用了。只要上下文没有关闭,可以触发多次刷新,ApplicationContext提供了一种可选择的支持这种“热”刷新。例如,XmlWebApplicationContext支持热刷新,但GenericApplicationContext并非如此。具体是在AbstractApplicationContext的finishRefresh()方法中。

`ContextStartedEvent`

事件发布在ApplicationContext开始使用ConfigurableApplicationContext接口start()方法。这里,“开始”意味着所有生命周期bean接收到一个明确的起始信号。通常,这个信号用于明确停止后重新启动,但它也可以用于启动组件没有被配置为自动运行(例如,组件还没有开始初始化)。

`ContextStoppedEvent`

事件发布在ApplicationContext停止时通过使用ConfigurableApplicationContext接口上的stop()方法。在这里,“停止”意味着所有生命周期bean接收一个显式的停止信号。停止上下文可以通过重新调用start()方法。

`ContextClosedEvent`

事件发布在ApplicationContext关闭时通过关闭ConfigurableApplicationContext接口方法。这里,“封闭”意味着所有单例bean被摧毁。一个封闭的环境达到生命的终结。它不能刷新或重启。

`RequestHandledEvent`

一个特定的web事件告诉所有能处理HTTP请求的bean 。这个事件是在请求完成后发布的。这个事件只适用于使用Spring的DispatcherServlet的web应用程序。

## 2、Spring事件监听者：ApplicationListener

Java事件监听者必须是EventListener实现类，不过EventListener仅为标签接口，内部并没有提供任何实现方法。

```java
@FunctionalInterface
public interface ApplicationListener<E extends ApplicationEvent> extends EventListener {
   void onApplicationEvent(E event);
}
```

这么设计是因为他很难适用于所有事件监听场景，如MouseListener，它监听了鼠标点击、鼠标按下及鼠标释放等事件。这么设计的好处是一个实现可以集中处理不同的事件，弊端是未来接口需要增加监听方法时客户端不得不为此变更而适配。

Spring事件监听器实现采取了相反的设计理念，通过限定监听方法数量，仅抽象单一方法onApplicationEvent(ApplicaiotnEvent)，当事件监听器接收到它可以处理的事件，会调用onApplicationEvent()方法。注意到ApplicationListener是泛型参数的这样可以参数化的定制事件。这意味着onApplicationEvent()方法可以保持类型安全,避免任何需要向下类型转换。你可以尽可能多的注册你希望事件侦听器,但是注意,默认情况下,事件监听器同步接收事件。这意味着publishEvent()方法会阻塞直到所有的事件监听器成处理完事件。这种单线程同步方法的一个特点是,当一个监听器接收到一个事件时,它运行在事务上下文的发布者线程上如果事务上下文可用。如果事件的发布需要另一种策略（譬如多线程）需要实现自己的 ApplicationEventMulticaster接口类。

由于泛型参数的限制，泛型化的ApplicationListener无法监听不同类型的ApplicationEvent，如ApplicationListener无法同时监听ContextStartedEvent。如果继续使用ApplicationListener又会有上述的问题。为此Spring提供了SmartApplicationListener接口：

```java
public interface SmartApplicationListener extends ApplicationListener<ApplicationEvent>, Ordered {
    //确定此监听器是否实际支持给定的事件类型。
    boolean supportsEventType(Class<? extends ApplicationEvent> eventType);
    default boolean supportsSourceType(@Nullable Class<?> sourceType) {
        return true;
    }
    @Override
    default int getOrder() {
        return LOWEST_PRECEDENCE;
    }
}
```

该接口通过supportsXXXXType方法过滤需要监听的ApplicationEvent类型和事件源类型，从而达到监听不同类型的ApplicationEvent的目的。

SmartApplicationListener是Spring3.0引入的，在4.2又引入了一个GenericApplicationListener可用来代替SmartApplicationListener，它的supportsEventType方法的参数是一个ResolvableType，更加全面的支持泛型化。

```java
public interface GenericApplicationListener extends ApplicationListener<ApplicationEvent>, Ordered {
   boolean supportsEventType(ResolvableType eventType);
   default boolean supportsSourceType(@Nullable Class<?> sourceType) {
      return true;
   }
   @Override
   default int getOrder() {
      return LOWEST_PRECEDENCE;
   }
}
```

## 3、Spring事件监听器注册/事件广播：ApplicationEventMulticaster

ApplicationEventMulticaster接口方法分为三类，注册事件监听器、移除事件监听器、发布事件。

```java
public interface ApplicationEventMulticaster {
   void addApplicationListener(ApplicationListener<?> listener);
   void addApplicationListenerBean(String listenerBeanName);
   void removeApplicationListener(ApplicationListener<?> listener);
   void removeApplicationListenerBean(String listenerBeanName);
   void removeAllListeners();
   void multicastEvent(ApplicationEvent event);
   void multicastEvent(ApplicationEvent event, @Nullable ResolvableType eventType);
}
```

执行AbstractApplicationContext.initApplicationEventMulticaster() 方法时会实例化一个bean name为applicationEventMulticaster的SimpleApplicationEventMulticaster，它的父类实现了前5个方法依靠一个内部类ListenerRetriever维护了一个Set>，本质事件监听器的注册或移除就是对这个Set的添加和移除操作。

```java
public abstract class AbstractApplicationEventMulticaster
      implements ApplicationEventMulticaster, BeanClassLoaderAware, BeanFactoryAware {
   //包含所有的事件监听器
   private final ListenerRetriever defaultRetriever = new ListenerRetriever(false);
   //根据事件类型对事件监听器做了分组同时起到缓存的作用
   final Map<ListenerCacheKey, ListenerRetriever> retrieverCache = new ConcurrentHashMap<>(64);
   @Override
   public void addApplicationListener(ApplicationListener<?> listener) {
      synchronized (this.retrievalMutex) {
         // 如果已经注册，则显式删除代理的目标，以避免对同一个侦听器进行双重调用。
         Object singletonTarget = AopProxyUtils.getSingletonTarget(listener);
         if (singletonTarget instanceof ApplicationListener) {
            this.defaultRetriever.applicationListeners.remove(singletonTarget);
         }
         this.defaultRetriever.applicationListeners.add(listener);
         this.retrieverCache.clear();
      }
   }
   @Override
   public void removeApplicationListener(ApplicationListener<?> listener) {
      synchronized (this.retrievalMutex) {
         this.defaultRetriever.applicationListeners.remove(listener);
         this.retrieverCache.clear();
      }
   }
   private class ListenerRetriever {
      public final Set<ApplicationListener<?>> applicationListeners = new LinkedHashSet<>();
      public final Set<String> applicationListenerBeans = new LinkedHashSet<>();
      private final boolean preFiltered;
      public ListenerRetriever(boolean preFiltered) {
         this.preFiltered = preFiltered;
      }
      public Collection<ApplicationListener<?>> getApplicationListeners() {
         List<ApplicationListener<?>> allListeners = new ArrayList<>(
               this.applicationListeners.size() + this.applicationListenerBeans.size());
         allListeners.addAll(this.applicationListeners);
         if (!this.applicationListenerBeans.isEmpty()) {
            BeanFactory beanFactory = getBeanFactory();
            for (String listenerBeanName : this.applicationListenerBeans) {
               try {
                  ApplicationListener<?> listener = beanFactory.getBean(listenerBeanName, ApplicationListener.class);
                  if (this.preFiltered || !allListeners.contains(listener)) {
                     allListeners.add(listener);
                  }
               }
               catch (NoSuchBeanDefinitionException ex) {
                  // Singleton listener instance (without backing bean definition) disappeared -
                  // probably in the middle of the destruction phase
               }
            }
         }
         if (!this.preFiltered || !this.applicationListenerBeans.isEmpty()) {
            AnnotationAwareOrderComparator.sort(allListeners);
         }
         return allListeners;
      }
   }
}
```

接口后两个方法由子类实现，可以看到SimpleApplicationEventMulticaster拥有一个Executor和ErrorHandler，分表表示监听器的调用线程池（如果不想使用单线程同步处理则可以设置一个线程池）和监听器处理事件失败的处理者(如果设置了的话)否则抛异常。

```java
public class SimpleApplicationEventMulticaster extends AbstractApplicationEventMulticaster {
   @Nullable
   private Executor taskExecutor;
   @Nullable
   private ErrorHandler errorHandler;
   public SimpleApplicationEventMulticaster() {
   }
   public SimpleApplicationEventMulticaster(BeanFactory beanFactory) {
      setBeanFactory(beanFactory);
   }
   public void setTaskExecutor(@Nullable Executor taskExecutor) {
      this.taskExecutor = taskExecutor;
   }
   public void setErrorHandler(@Nullable ErrorHandler errorHandler) {
      this.errorHandler = errorHandler;
   }
   @Override
   public void multicastEvent(ApplicationEvent event) {
      //广播事件，可以自动分析出ApplicationEvent是那种事件类型
      multicastEvent(event, resolveDefaultEventType(event));
   }
   @Override
   public void multicastEvent(final ApplicationEvent event, @Nullable ResolvableType eventType) {
      //如果eventType是null，会使用ResolvableType.forInstance(event)返回一个ResolvableType
      //这个方法内部会先判断event如果是ResolvableTypeProvider则调用getResolvableType()
      ResolvableType type = (eventType != null ? eventType : resolveDefaultEventType(event));
      //调用父类方法getApplicationListeners只取得能处理此类事件的时间监听器，依次处理
      for (final ApplicationListener<?> listener : getApplicationListeners(event, type)) {
         Executor executor = getTaskExecutor();
         if (executor != null) {
            executor.execute(() -> invokeListener(listener, event));
         }
         else {
            invokeListener(listener, event);
         }
      }
   }
   private ResolvableType resolveDefaultEventType(ApplicationEvent event) {
      return ResolvableType.forInstance(event);
   }
   protected void invokeListener(ApplicationListener<?> listener, ApplicationEvent event) {
      ErrorHandler errorHandler = getErrorHandler();
      if (errorHandler != null) {
         try {
            doInvokeListener(listener, event);
         }
         catch (Throwable err) {
            errorHandler.handleError(err);
         }
      }
      else {
         doInvokeListener(listener, event);
      }
   }
   @SuppressWarnings({"unchecked", "rawtypes"})
   private void doInvokeListener(ApplicationListener listener, ApplicationEvent event) {
      try {
         listener.onApplicationEvent(event);
      }
      catch (ClassCastException ex) {
         String msg = ex.getMessage();
         if (msg == null || matchesClassCastMessage(msg, event.getClass())) {
            // Possibly a lambda-defined listener which we could not resolve the generic event type for
            // -> let's suppress the exception and just log a debug message.
            Log logger = LogFactory.getLog(getClass());
            if (logger.isDebugEnabled()) {
               logger.debug("Non-matching event type for listener: " + listener, ex);
            }
         }
         else {
            throw ex;
         }
      }
   }
   private boolean matchesClassCastMessage(String classCastMessage, Class<?> eventClass) {
      // On Java 8, the message starts with the class name: "java.lang.String cannot be cast..."
      if (classCastMessage.startsWith(eventClass.getName())) {
         return true;
      }
      // On Java 11, the message starts with "class ..." a.k.a. Class.toString()
      if (classCastMessage.startsWith(eventClass.toString())) {
         return true;
      }
      // On Java 9, the message used to contain the module name: "java.base/java.lang.String cannot be cast..."
      int moduleSeparatorIndex = classCastMessage.indexOf('/');
      if (moduleSeparatorIndex != -1 && classCastMessage.startsWith(eventClass.getName(), moduleSeparatorIndex + 1)) {
         return true;
      }
      // Assuming an unrelated class cast failure...
      return false;
   }
}
```

SimpleApplicationEventMulticaster在进行广播时，调用父类方法AbstractApplicationEventMulticaster.getApplicationListeners(ApplicationEvent, ResolvableType)返回一组能够处理当前事件类型的事件监听器，依次去调用事件监听器的onApplicationEvent方法，默认是同步调用，也可以通过setTaskExecutor方法传入一个Executor来达到异步处理的方式。

下面重点看一下AbstractApplicationEventMulticaster#getApplicationListeners(ApplicationEvent, ResolvableType)

```java
protected Collection<ApplicationListener<?>> getApplicationListeners(
      ApplicationEvent event, ResolvableType eventType) {
   Object source = event.getSource();
   Class<?> sourceType = (source != null ? source.getClass() : null);
   //根据事件类型和事件源类型分组做缓存
   ListenerCacheKey cacheKey = new ListenerCacheKey(eventType, sourceType);
   // Quick check for existing entry on ConcurrentHashMap...
   ListenerRetriever retriever = this.retrieverCache.get(cacheKey);
   if (retriever != null) {
      return retriever.getApplicationListeners();
   }
   if (this.beanClassLoader == null ||
         (ClassUtils.isCacheSafe(event.getClass(), this.beanClassLoader) &&
               (sourceType == null || ClassUtils.isCacheSafe(sourceType, this.beanClassLoader)))) {
      // Fully synchronized building and caching of a ListenerRetriever
      synchronized (this.retrievalMutex) {
         retriever = this.retrieverCache.get(cacheKey);
         if (retriever != null) {
            return retriever.getApplicationListeners();
         }
         retriever = new ListenerRetriever(true);
         Collection<ApplicationListener<?>> listeners =
               retrieveApplicationListeners(eventType, sourceType, retriever);
         this.retrieverCache.put(cacheKey, retriever);
         return listeners;
      }
   }
   else {
      // No ListenerRetriever caching -> no synchronization necessary
      return retrieveApplicationListeners(eventType, sourceType, null);
   }
}
```

上面代码主要检索缓存中是否存在，实际上为给定事件和源类型检索应用程序监听器的是retrieveApplicationListeners方法。

```java
private Collection<ApplicationListener<?>> retrieveApplicationListeners(
      ResolvableType eventType, @Nullable Class<?> sourceType, @Nullable ListenerRetriever retriever) {
   List<ApplicationListener<?>> allListeners = new ArrayList<>();
   Set<ApplicationListener<?>> listeners;
   Set<String> listenerBeans;
   synchronized (this.retrievalMutex) {
      listeners = new LinkedHashSet<>(this.defaultRetriever.applicationListeners);
      listenerBeans = new LinkedHashSet<>(this.defaultRetriever.applicationListenerBeans);
   }
   // Add programmatically registered listeners, including ones coming
   // from ApplicationListenerDetector (singleton beans and inner beans).
   for (ApplicationListener<?> listener : listeners) {
      //GenericApplicationListener、SmartApplicationListener通过supportsXXX方法
      //普通ApplicationListener通过具体事件类型过滤
      if (supportsEvent(listener, eventType, sourceType)) {
         if (retriever != null) {
            retriever.applicationListeners.add(listener);
         }
         allListeners.add(listener);
      }
   }
   // Add listeners by bean name, potentially overlapping with programmatically
   // registered listeners above - but here potentially with additional metadata.
   if (!listenerBeans.isEmpty()) {
      ConfigurableBeanFactory beanFactory = getBeanFactory();
      for (String listenerBeanName : listenerBeans) {
         try {
            if (supportsEvent(beanFactory, listenerBeanName, eventType)) {
               ApplicationListener<?> listener =
                     beanFactory.getBean(listenerBeanName, ApplicationListener.class);
               if (!allListeners.contains(listener) && supportsEvent(listener, eventType, sourceType)) {
                  if (retriever != null) {
                     if (beanFactory.isSingleton(listenerBeanName)) {
                        retriever.applicationListeners.add(listener);
                     }
                     else {
                        retriever.applicationListenerBeans.add(listenerBeanName);
                     }
                  }
                  allListeners.add(listener);
               }
            }
            else {
               // Remove non-matching listeners that originally came from
               // ApplicationListenerDetector, possibly ruled out by additional
               // BeanDefinition metadata (e.g. factory method generics) above.
               Object listener = beanFactory.getSingleton(listenerBeanName);
               if (retriever != null) {
                  retriever.applicationListeners.remove(listener);
               }
               allListeners.remove(listener);
            }
         }
         catch (NoSuchBeanDefinitionException ex) {
            // Singleton listener instance (without backing bean definition) disappeared -
            // probably in the middle of the destruction phase
         }
      }
   }
   AnnotationAwareOrderComparator.sort(allListeners);
   if (retriever != null && retriever.applicationListenerBeans.isEmpty()) {
      retriever.applicationListeners.clear();
      retriever.applicationListeners.addAll(allListeners);
   }
   return allListeners;
}
```

## 4、Spring事件发布：ApplicationEventPublisher

```java
@FunctionalInterface
public interface ApplicationEventPublisher {
   default void publishEvent(ApplicationEvent event) {
      publishEvent((Object) event);
   }
   void publishEvent(Object event);
}
```

ApplicationEventPublisher仅存在两个发布ApplicationEvent的重载方法publishEvent，并无关联ApplicationListener的操作方法。不过ApplicationEventPublisher接口被ApplicationContext扩展，因此无论使用哪种ApplicationContext实例均具备发布ApplicationEvent的能力。同时ApplicationContext的子接口ConfigurableApplicationContext提供了添加ApplicationListener实例的关联方法addApplicationListener(ApplicationListener)。

```java
@Override
public void addApplicationListener(ApplicationListener<?> listener) {
   Assert.notNull(listener, "ApplicationListener must not be null");
   if (this.applicationEventMulticaster != null) {
      this.applicationEventMulticaster.addApplicationListener(listener);
   }
   this.applicationListeners.add(listener);
}
```

可以看到通过ConfigurableApplicationContext的addApplicationListener方法注册事件监听器也会注册到内部成员变量applicationEventMulticaster中。

既然ApplicationContext对象是ApplicationEventPublisher实例，则不难发现AbstractApplicationContext完全实现了ApplicationEventPublisher接口：

```java
@Override
public void publishEvent(ApplicationEvent event) {
   publishEvent(event, null);
}
@Override
public void publishEvent(Object event) {
   publishEvent(event, null);
}
protected void publishEvent(Object event, @Nullable ResolvableType eventType) {
   Assert.notNull(event, "Event must not be null");
   // Decorate event as an ApplicationEvent if necessary
   ApplicationEvent applicationEvent;
   if (event instanceof ApplicationEvent) {
      applicationEvent = (ApplicationEvent) event;
   }
   else {
      applicationEvent = new PayloadApplicationEvent<>(this, event);
      if (eventType == null) {
         eventType = ((PayloadApplicationEvent) applicationEvent).getResolvableType();
      }
   }
   // Multicast right now if possible - or lazily once the multicaster is initialized
   if (this.earlyApplicationEvents != null) {
      this.earlyApplicationEvents.add(applicationEvent);
   }
   else {
      getApplicationEventMulticaster().multicastEvent(applicationEvent, eventType);
   }
   // Publish event via parent context as well...
   if (this.parent != null) {
      if (this.parent instanceof AbstractApplicationContext) {
         ((AbstractApplicationContext) this.parent).publishEvent(event, eventType);
      }
      else {
         this.parent.publishEvent(event);
      }
   }
}
```

明显地在publishEvent(Object,ResolvableType)方法中显示地调用了getApplicationEventMulticaster().multicastEvent(applicationEvent,eventType)，而applicationEventMulticaster属性又由initApplicationEventMulticaster()方法初始化。

```java
protected void initApplicationEventMulticaster() {
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   if (beanFactory.containsLocalBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME)) {
      this.applicationEventMulticaster =
            beanFactory.getBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, ApplicationEventMulticaster.class);
      if (logger.isTraceEnabled()) {
         logger.trace("Using ApplicationEventMulticaster [" + this.applicationEventMulticaster + "]");
      }
   }
   else {
      this.applicationEventMulticaster = new SimpleApplicationEventMulticaster(beanFactory);
      beanFactory.registerSingleton(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, this.applicationEventMulticaster);
      if (logger.isTraceEnabled()) {
         logger.trace("No '" + APPLICATION_EVENT_MULTICASTER_BEAN_NAME + "' bean, using " +
               "[" + this.applicationEventMulticaster.getClass().getSimpleName() + "]");
      }
   }
}
```

在applicationEventMulticaster初始化中，首先判断Spring应用上下文是否存在名为applicationEventMulticaster且类型为ApplicationEventMulticaster的bean，如果不存在则将其构造为SimpleApplicationEventMulticaster对象注册到Spring容器中。

## 5、Spring注解驱动事件监听：@EventListener

```java
@Target({ElementType.METHOD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface EventListener {
   @AliasFor("classes")
   Class<?>[] value() default {};
   @AliasFor("value")
   Class<?>[] classes() default {};
   String condition() default "";
}
```

condition的值为SpEL，代表true才可被处理。下表列出了项目可用的上下文,这样您就可以使用这些条件事件处理:

事件SpEL可用的元对象

名称
所在位置
描述
例子

Event

root object

实际的`ApplicationEvent`.

`#root.event`

Arguments array

root object

执行目标方法的参数数组

`#root.args[0]`

*Argument name*

evaluation context

任何方法参数的名称。出于某种原因,如果名字不是可用的(例如,因为没有调试信息),参数名称也可以使用这种形式 #a，#arg代表参数索引(从0开始)。

`#blEvent` or `#a0` (也可使用 `#p0` 或 `#p`符号作为一个别名)

```java
@EventListener(condition = "#blEvent.content == 'my-event'")
public void processBlackListEvent(BlackListEvent blEvent) {
    // notify appropriate parties via notificationAddress...
}
```

@EventListener必须标记在Spring托管bean的public方法中，并且支持单一类型事件监听，除此之外单个@EventListener方法也支持多种事件类型的监听。

当@EventListener方法监听一个或多个ApplicationEvent时，其参数可为零到一个ApplicationEvent。

@EventListener方法与ApplicationListener接口对比

监听类型
访问性
顺序控制
返回类型
参数数量
参数类型
泛型事件

@EventListener同步方法
public
@Order
任意
0或1
事件类型或泛型参数类型
支持

@EventListener异步方法
public
@Order
非原生类型
0或1
事件类型或泛型参数类型
支持

实现ApplicationListener
public
@Order或Ordered
void
1
事件类型
不支持

## 6、事件监听器的注册

在AbstractApplicationContext.prepareBeanFactory()方法执行的时候会添加一个BeanPostProcessor——ApplicationListenerDetector，它实现了MergedBeanDefinitionPostProcessor接口，在postProcessAfterInitialization()方法执行的时候检测已注册到容器中的bean如果是ApplicationListener，就通过applicationContext添加。

```java
@Override
public Object postProcessAfterInitialization(Object bean, String beanName) {
   if (bean instanceof ApplicationListener) {
      // potentially not detected as a listener by getBeanNamesForType retrieval
      Boolean flag = this.singletonNames.get(beanName);
      if (Boolean.TRUE.equals(flag)) {
         // singleton bean (top-level or inner): register on the fly
         this.applicationContext.addApplicationListener((ApplicationListener<?>) bean);
      }
      else if (Boolean.FALSE.equals(flag)) {
         if (logger.isWarnEnabled() && !this.applicationContext.containsBean(beanName)) {
            // inner bean with other scope - can't reliably process events
            logger.warn("Inner bean '" + beanName + "' implements ApplicationListener interface " +
                  "but is not reachable for event multicasting by its containing ApplicationContext " +
                  "because it does not have singleton scope. Only top-level listener beans are allowed " +
                  "to be of non-singleton scope.");
         }
         this.singletonNames.remove(beanName);
      }
   }
   return bean;
}
```

自Spring 4.2起,事件机制明显改善,提供了一个基于注解的模型以及发布任意事件的能力。基于注解的Spring启动形式会在AnnotationConfigUtils#registerAnnotationConfigProcessors(BeanDefinitionRegistry,Object)方法内部注册一个bean name为org.springframework.context.event.internalEventListenerProcessor的EventListenerMethodProcessor。这个bean实现了SmartInitializingSingleton接口，在接口方法afterSingletonsInstantiated()调用时会检测容器内所有的bean，如果发现有@EventListener方法将使用容器内EventListenerFactory将此@EventListener方法包装一个ApplicationListener放入容器中。

```java
@Override
public void afterSingletonsInstantiated() {
   ConfigurableListableBeanFactory beanFactory = this.beanFactory;
   Assert.state(this.beanFactory != null, "No ConfigurableListableBeanFactory set");
   String[] beanNames = beanFactory.getBeanNamesForType(Object.class);
   for (String beanName : beanNames) {
      //如果一个类被代理，那么处理它的代理类即可
      if (!ScopedProxyUtils.isScopedTarget(beanName)) {
         Class<?> type = null;
         try {
            //代理模式需要取得目标类，然后取得目标类上@EventListener方法
            type = AutoProxyUtils.determineTargetClass(beanFactory, beanName);
         }
         catch (Throwable ex) {
            // An unresolvable bean type, probably from a lazy bean - let's ignore it.
            if (logger.isDebugEnabled()) {
               logger.debug("Could not resolve target class for bean with name '" + beanName + "'", ex);
            }
         }
         if (type != null) {
            if (ScopedObject.class.isAssignableFrom(type)) {
               try {
                  Class<?> targetClass = AutoProxyUtils.determineTargetClass(
                        beanFactory, ScopedProxyUtils.getTargetBeanName(beanName));
                  if (targetClass != null) {
                     type = targetClass;
                  }
               }
               catch (Throwable ex) {
                  // An invalid scoped proxy arrangement - let's ignore it.
                  if (logger.isDebugEnabled()) {
                     logger.debug("Could not resolve target bean for scoped proxy '" + beanName + "'", ex);
                  }
               }
            }
            try {
               //解析@EventListener方法的类，注册事件监听器
               processBean(beanName, type);
            }
            catch (Throwable ex) {
               throw new BeanInitializationException("Failed to process @EventListener " +
                     "annotation on bean with name '" + beanName + "'", ex);
            }
         }
      }
   }
}
private void processBean(final String beanName, final Class<?> targetType) {
   //缓存防止重复注册
   //只解析用户定义的类
   if (!this.nonAnnotatedClasses.contains(targetType) && !isSpringContainerClass(targetType)) {
      Map<Method, EventListener> annotatedMethods = null;
      try {
         //所有@EventListener方法
         annotatedMethods = MethodIntrospector.selectMethods(targetType,
               (MethodIntrospector.MetadataLookup<EventListener>) method ->
                     AnnotatedElementUtils.findMergedAnnotation(method, EventListener.class));
      }
      catch (Throwable ex) {
         // An unresolvable type in a method signature, probably from a lazy bean - let's ignore it.
         if (logger.isDebugEnabled()) {
            logger.debug("Could not resolve methods for bean with name '" + beanName + "'", ex);
         }
      }
      if (CollectionUtils.isEmpty(annotatedMethods)) {
         this.nonAnnotatedClasses.add(targetType);
         if (logger.isTraceEnabled()) {
            logger.trace("No @EventListener annotations found on bean class: " + targetType.getName());
         }
      }
      else {
         // Non-empty set of methods
         ConfigurableApplicationContext context = this.applicationContext;
         Assert.state(context != null, "No ApplicationContext set");
         List<EventListenerFactory> factories = this.eventListenerFactories;
         Assert.state(factories != null, "EventListenerFactory List not initialized");
         for (Method method : annotatedMethods.keySet()) {
            for (EventListenerFactory factory : factories) {
               //使用Spring容器中第一个能解析此@EventListener方法的EventListenerFactory
               if (factory.supportsMethod(method)) {
                  Method methodToUse = AopUtils.selectInvocableMethod(method, context.getType(beanName));
                  //使用EventListenerFactory将@EventListener解析为一个ApplicationListener后加入容器
                  ApplicationListener<?> applicationListener =
                        factory.createApplicationListener(beanName, targetType, methodToUse);
                  if (applicationListener instanceof ApplicationListenerMethodAdapter) {
                     ((ApplicationListenerMethodAdapter) applicationListener).init(context, this.evaluator);
                  }
                  context.addApplicationListener(applicationListener);
                  break;
               }
            }
         }
         if (logger.isDebugEnabled()) {
            logger.debug(annotatedMethods.size() + " @EventListener methods processed on bean '" +
                  beanName + "': " + annotatedMethods);
         }
      }
   }
}
```

上面的代码核心部分就是processBean()方法，内部使用容器第一个可能解析当前@EventListener的EventListenerFactory创建一个ApplicationListener用来处理@EventListener指定的类型事件。下面就是看看Spring容器都有哪些EventListenerFactory，和EventListenerFactory是如何创建ApplicationListener的？

EventListenerFactory的注册和EventListenerMethodProcessor一样在AnnotationConfigBeanDefinitionParser.parse(Element, ParserContext)方法内，bean name为org.springframework.context.event.internalEventListenerFactory，是DefaultEventListenerFactory。

```java
public class DefaultEventListenerFactory implements EventListenerFactory, Ordered {
   private int order = LOWEST_PRECEDENCE;
   public void setOrder(int order) {
      this.order = order;
   }
   @Override
   public int getOrder() {
      return this.order;
   }
   public boolean supportsMethod(Method method) {
      return true;
   }
   @Override
   public ApplicationListener<?> createApplicationListener(String beanName, Class<?> type, Method method) {
      return new ApplicationListenerMethodAdapter(beanName, type, method);
   }
}
```

DefaultEventListenerFactory支持所有的方法成为ApplicationListener，下面看createApplicationListener()方法返回的ApplicationListenerMethodAdapter是如何处理@EventListener指定的事件的。

```java
public ApplicationListenerMethodAdapter(String beanName, Class<?> targetClass, Method method) {
   this.beanName = beanName;
   this.method = BridgeMethodResolver.findBridgedMethod(method);
   this.targetMethod = (!Proxy.isProxyClass(targetClass) ?
         AopUtils.getMostSpecificMethod(method, targetClass) : this.method);
   this.methodKey = new AnnotatedElementKey(this.targetMethod, targetClass);
   EventListener ann = AnnotatedElementUtils.findMergedAnnotation(this.targetMethod, EventListener.class);
   this.declaredEventTypes = resolveDeclaredEventTypes(method, ann);
   this.condition = (ann != null ? ann.condition() : null);
   this.order = resolveOrder(method);
}
```

declaredEventTypes是指事件监听器能够支持的事件类型。

```java
private List<ResolvableType> resolveDeclaredEventTypes(Method method, @Nullable EventListener ann) {
   //注意方法参数最多只能有一个
   int count = method.getParameterCount();
   if (count > 1) {
      throw new IllegalStateException(
            "Maximum one parameter is allowed for event listener method: " + method);
   }
   if (ann != null) {
      Class<?>[] classes = ann.classes();
      if (classes.length > 0) {
         List<ResolvableType> types = new ArrayList<>(classes.length);
         for (Class<?> eventType : classes) {
            types.add(ResolvableType.forClass(eventType));
         }
         return types;
      }
   }
   if (count == 0) {
      throw new IllegalStateException(
            "Event parameter is mandatory for event listener method: " + method);
   }
   return Collections.singletonList(ResolvableType.forMethodParameter(method, 0));
}
@Override
public boolean supportsEventType(ResolvableType eventType) {
   for (ResolvableType declaredEventType : this.declaredEventTypes) {
      if (declaredEventType.isAssignableFrom(eventType)) {
         return true;
      }
      if (PayloadApplicationEvent.class.isAssignableFrom(eventType.toClass())) {
         ResolvableType payloadType = eventType.as(PayloadApplicationEvent.class).getGeneric();
         if (declaredEventType.isAssignableFrom(payloadType)) {
            return true;
         }
      }
   }
   return eventType.hasUnresolvableGenerics();
}
```

处理事件的大致逻辑为，事件作为@EventListener方法的参数(如果是PayloadApplicationEvent则使用payload作为参数)，然后执行该方法，如果有返回值则继续讲返回值作为事件发布。注意返回值是数组或集合会将集合内所有的元素单独发布。

```java
@Override
public void onApplicationEvent(ApplicationEvent event) {
   processEvent(event);
}
public void processEvent(ApplicationEvent event) {
   Object[] args = resolveArguments(event);
   if (shouldHandle(event, args)) {
      Object result = doInvoke(args);
      if (result != null) {
         handleResult(result);
      }
      else {
         logger.trace("No result object given - no result to handle");
      }
   }
}
private boolean shouldHandle(ApplicationEvent event, @Nullable Object[] args) {
   if (args == null) {
      return false;
   }
   String condition = getCondition();
   if (StringUtils.hasText(condition)) {
      Assert.notNull(this.evaluator, "EventExpressionEvaluator must not be null");
      return this.evaluator.condition(
            condition, event, this.targetMethod, this.methodKey, args, this.applicationContext);
   }
   return true;
}
protected void handleResult(Object result) {
   if (result.getClass().isArray()) {
      Object[] events = ObjectUtils.toObjectArray(result);
      for (Object event : events) {
         publishEvent(event);
      }
   }
   else if (result instanceof Collection<?>) {
      Collection<?> events = (Collection<?>) result;
      for (Object event : events) {
         publishEvent(event);
      }
   }
   else {
      publishEvent(result);
   }
}
```

由shouldHandle()方法可知，@EventListener的condition属性决定着事件可否被处理。

## 7、总结Spring事件/监听机制

## 总结Spring事件

Spring事件的API为ApplicationEvent、继承于Java规约的抽象类java.util.EventObject，并需要显示地调用父类的构造器传递事件源参数。Spring Framework内建事件有五种，包括ContextRefreshedEvent、ContextStartedEvent、ContextStoppedEvent、ContextClosedEvent和RequestHandledEvent。其中前四种为Spring应用上下文事件，均继承于抽象类ApplicationContextEvent，以ApplicationConext作为事件源。

除了以上Spring内置事件，Spring允许应用自定义ApplicationEvent，并且能够实现自定义反省Spring事件、不过这类事件需要实现ResolvableTypeProvider接口，通过该接口暴露其泛型元信息，搭建与Spring事件/监听机制的桥梁。从广义上来看，无论Spring Boot事件还是Spring Cloud事件均属于ApplicationEvent的扩展，是特定领域的自定义Spring事件，如Spring Boot事件基类SpringApplicationEvent和Spring Cloud Bus基类RemoteApplicationEvent。

## 总结Spring事件监听手段

关于Spring事件监听手段，Spring层面提供了两种途径，其一是面向接口编程的ApplicationListener其二是注解驱动编程的@EventListener方法。两种途径均能监听一种或多种事件，并且支持泛型事件。从实现层面分析，@EventListener方法属于Bean方法与ApplicationListener接口的适配，即ApplicationListenerMethodAdapter。两者的差异在于，@EventListener方法必须依赖于Spring应用上下文，而ApplicationListener对象尽管默认业余ApplicationContext关联，但实际上他是ApplicationEventMulticaster实例的组成元素。

## 总结Spring事件广播器

Spring事件广播在Spring Framework中有两类API表达方式，一是ApplicationEventPublisher.publishEvent方法，二是ApplicationEventMulticaster.multicastEvent。默认情况下Spring Framework仅提供一种实现，前者由AbstractApplicationContext实现，后者由SimpleApplicationEventMulticaster实现。其中SimpleApplicationEventMulticaster不但是AbstractApplicationContext实现ApplicationEventPublisher接口语义的基础，而且也为AbstractApplicationContext提供关联ApplicationListener的实现存储。

综上所述，SimpleApplicationEventMulticaster是ApplicationEvent、ApplicationListener和ConfigurableApplicationContext之间连接的纽带。
