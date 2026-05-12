# 23、Spring源码分析 - 23-TargetSource目标源
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/23.html
- 分类：J2EE框架
- 分组：教程目录
## 1、为什么需要TargetSource

TargetSource(目标源)是被代理的target(目标对象)实例的来源。

```java
public interface TargetSource extends TargetClassAware {
   //目标对象类型
   Class<?> getTargetClass();
   // 这个方法用户返回当前bean是否为静态的，比如常见的单例bean就是静态的，而prototype就是动态的，
   // 这里这个方法的主要作用是，对于静态的bean，spring是会对其进行缓存的，在多次使用TargetSource
   // 获取目标bean对象的时候，其获取的总是同一个对象，通过这种方式提高效率
   boolean isStatic();
   //获取目标对象
   Object getTarget() throws Exception;
   // Spring在完目标bean之后会调用这个方法释放目标bean对象，对于一些需要池化的对象，这个方法是必须
   // 要实现的，这个方法默认不进行任何处理
   void releaseTarget(Object target) throws Exception;
}
```

由这篇[《Spring AOP的实现原理》](/zhuanlan/j2ee/spring/7/22.html)可知TargetSource被用于获取当前MethodInvocation(方法调用)所需要的target(目标对象),这个target通过反射的方式被调用(如:method.invoke(target,args))。换句话说,proxy(代理对象)代理的不是target,而是TargetSource,这点非常重要!!!

那么问题来了:为什么SpringAOP代理不直接代理target,而需要通过代理TargetSource(target的来源,其内部持有target),间接代理target呢?

通常情况下,一个proxy(代理对象)只能代理一个target,每次方法调用的目标也是唯一固定的target。但是,如果让proxy代理TargetSource,可以使得每次方法调用的target实例都不同(当然也可以相同,这取决于TargetSource实现)。这种机制使得方法调用变得灵活,可以扩展出很多高级功能,如:target pool(目标对象池)、hot swap(运行时目标对象热替换),等等。

## 2、Spring内置的TargetSource

#### 2.1、SingletonTargetSource

从这个目标源取得的目标对象是单例的，成员变量target缓存了目标对象，每次getTarget()都是返回这个对象。

```java
public class SingletonTargetSource implements TargetSource, Serializable {
   private static final long serialVersionUID = 9031246629662423738L;
   private final Object target;
   public SingletonTargetSource(Object target) {
      Assert.notNull(target, "Target object must not be null");
      this.target = target;
   }
   @Override
   public Class<?> getTargetClass() {
      return this.target.getClass();
   }
   @Override
   public Object getTarget() {
      return this.target;
   }
   @Override
   public void releaseTarget(Object target) {
      // nothing to do
   }
   @Override
   public boolean isStatic() {
      return true;
   }
   @Override
   public boolean equals(Object other) {
      if (this == other) {
         return true;
      }
      if (!(other instanceof SingletonTargetSource)) {
         return false;
      }
      SingletonTargetSource otherTargetSource = (SingletonTargetSource) other;
      return this.target.equals(otherTargetSource.target);
   }
   @Override
   public int hashCode() {
      return this.target.hashCode();
   }
   @Override
   public String toString() {
      return "SingletonTargetSource for target object [" + ObjectUtils.identityToString(this.target) + "]";
   }
}
```

#### 2.2、PrototypeTargetSource

每次getTarget()将生成prototype类型的bean，即其生成的bean并不是单例的，因而使用这个类型的`TargetSource`时需要注意，封装的目标bean必须是prototype类型的。PrototypeTargetSource继承了AbstractBeanFactoryBasedTargetSource拥有了创建bean的能力。

```java
public class PrototypeTargetSource extends AbstractPrototypeBasedTargetSource {
   @Override
   public Object getTarget() throws BeansException {
      return newPrototypeInstance();
   }
   @Override
   public void releaseTarget(Object target) {
      destroyPrototypeInstance(target);
   }
   @Override
   public String toString() {
      return "PrototypeTargetSource for target bean with name '" + getTargetBeanName() + "'";
   }
}
public abstract class AbstractPrototypeBasedTargetSource extends AbstractBeanFactoryBasedTargetSource {
   @Override
   public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
      super.setBeanFactory(beanFactory);
      // Check whether the target bean is defined as prototype.
      if (!beanFactory.isPrototype(getTargetBeanName())) {
         throw new BeanDefinitionStoreException(
               "Cannot use prototype-based TargetSource against non-prototype bean with name '" +
               getTargetBeanName() + "': instances would not be independent");
      }
   }
   /**
    * Subclasses should call this method to create a new prototype instance.
    * @throws BeansException if bean creation failed
    */
   protected Object newPrototypeInstance() throws BeansException {
      if (logger.isDebugEnabled()) {
         logger.debug("Creating new instance of bean '" + getTargetBeanName() + "'");
      }
      //使用容器创建一个bean，如果getTargetBeanName()是prototype的，则target目标对象也是prototype的
      return getBeanFactory().getBean(getTargetBeanName());
   }
   /**
    * Subclasses should call this method to destroy an obsolete prototype instance.
    * @param target the bean instance to destroy
    */
   protected void destroyPrototypeInstance(Object target) {
      if (logger.isDebugEnabled()) {
         logger.debug("Destroying instance of bean '" + getTargetBeanName() + "'");
      }
      if (getBeanFactory() instanceof ConfigurableBeanFactory) {
         ((ConfigurableBeanFactory) getBeanFactory()).destroyBean(getTargetBeanName(), target);
      }
      else if (target instanceof DisposableBean) {
         try {
            ((DisposableBean) target).destroy();
         }
         catch (Throwable ex) {
            logger.warn("Destroy method on bean with name '" + getTargetBeanName() + "' threw an exception", ex);
         }
      }
   }
   //---------------------------------------------------------------------
   // Serialization support
   //---------------------------------------------------------------------
   private void readObject(ObjectInputStream ois) throws IOException, ClassNotFoundException {
      throw new NotSerializableException("A prototype-based TargetSource itself is not deserializable - " +
            "just a disconnected SingletonTargetSource or EmptyTargetSource is");
   }
   /**
    * Replaces this object with a SingletonTargetSource on serialization.
    * Protected as otherwise it won't be invoked for subclasses.
    * (The {@code writeReplace()} method must be visible to the class
    * being serialized.)
    * <p>With this implementation of this method, there is no need to mark
    * non-serializable fields in this class or subclasses as transient.
    */
   protected Object writeReplace() throws ObjectStreamException {
      if (logger.isDebugEnabled()) {
         logger.debug("Disconnecting TargetSource [" + this + "]");
      }
      try {
         // Create disconnected SingletonTargetSource/EmptyTargetSource.
         Object target = getTarget();
         return (target != null ? new SingletonTargetSource(target) :
               EmptyTargetSource.forClass(getTargetClass()));
      }
      catch (Exception ex) {
         String msg = "Cannot get target for disconnecting TargetSource [" + this + "]";
         logger.error(msg, ex);
         throw new NotSerializableException(msg + ": " + ex);
      }
   }
}
```

可以看到，PrototypeTargetSource的生成prototype类型bean的方式主要是委托给BeanFactory进行的，因为BeanFactory自有一套生成prototype类型的bean的逻辑，因而PrototypeTargetSource也就具有生成prototype类型bean的能力，这也就是我们要生成的目标bean必须声明为prototype类型的原因。

#### 2.3、CommonsPool2TargetSource

这里CommonsPool2TargetSource也就是池化的TargetSource，其基本具有平常所使用的“池”的概念的所有属性，比如：最小空闲数，最大空闲数，最大等待时间等等。实际上，CommonsPool2TargetSource的实现是将其委托给了ObjectPool进行，具体的也就是GenericObjectPool，其实现了ObjectPool接口。如下是CommonsPool2TargetSource的主要实现：

```java
public class CommonsPool2TargetSource extends AbstractPoolingTargetSource implements PooledObjectFactory<Object> {
   private int maxIdle = GenericObjectPoolConfig.DEFAULT_MAX_IDLE;
   private int minIdle = GenericObjectPoolConfig.DEFAULT_MIN_IDLE;
   private long maxWait = GenericObjectPoolConfig.DEFAULT_MAX_WAIT_MILLIS;
   private long timeBetweenEvictionRunsMillis = GenericObjectPoolConfig.DEFAULT_TIME_BETWEEN_EVICTION_RUNS_MILLIS;
   private long minEvictableIdleTimeMillis = GenericObjectPoolConfig.DEFAULT_MIN_EVICTABLE_IDLE_TIME_MILLIS;
   private boolean blockWhenExhausted = GenericObjectPoolConfig.DEFAULT_BLOCK_WHEN_EXHAUSTED;
   /**
    * The Apache Commons {@code ObjectPool} used to pool target objects.
    */
   @Nullable
   private ObjectPool pool;
   /**
    * Create a CommonsPoolTargetSource with default settings.
    * Default maximum size of the pool is 8.
    * @seesetMaxSize
    * @see GenericObjectPoolConfig#setMaxTotal
    */
   public CommonsPool2TargetSource() {
      setMaxSize(GenericObjectPoolConfig.DEFAULT_MAX_TOTAL);
   }
   /**
    * Set the maximum number of idle objects in the pool.
    * Default is 8.
    * @see GenericObjectPool#setMaxIdle
    */
   public void setMaxIdle(int maxIdle) {
      this.maxIdle = maxIdle;
   }
   /**
    * Return the maximum number of idle objects in the pool.
    */
   public int getMaxIdle() {
      return this.maxIdle;
   }
   /**
    * Set the minimum number of idle objects in the pool.
    * Default is 0.
    * @see GenericObjectPool#setMinIdle
    */
   public void setMinIdle(int minIdle) {
      this.minIdle = minIdle;
   }
   /**
    * Return the minimum number of idle objects in the pool.
    */
   public int getMinIdle() {
      return this.minIdle;
   }
   /**
    * Set the maximum waiting time for fetching an object from the pool.
    * Default is -1, waiting forever.
    * @see GenericObjectPool#setMaxWaitMillis
    */
   public void setMaxWait(long maxWait) {
      this.maxWait = maxWait;
   }
   /**
    * Return the maximum waiting time for fetching an object from the pool.
    */
   public long getMaxWait() {
      return this.maxWait;
   }
   /**
    * Set the time between eviction runs that check idle objects whether
    * they have been idle for too long or have become invalid.
    * Default is -1, not performing any eviction.
    * @see GenericObjectPool#setTimeBetweenEvictionRunsMillis
    */
   public void setTimeBetweenEvictionRunsMillis(long timeBetweenEvictionRunsMillis) {
      this.timeBetweenEvictionRunsMillis = timeBetweenEvictionRunsMillis;
   }
   /**
    * Return the time between eviction runs that check idle objects.
    */
   public long getTimeBetweenEvictionRunsMillis() {
      return this.timeBetweenEvictionRunsMillis;
   }
   /**
    * Set the minimum time that an idle object can sit in the pool before
    * it becomes subject to eviction. Default is 1800000 (30 minutes).
    * <p>Note that eviction runs need to be performed to take this
    * setting into effect.
    * @seesetTimeBetweenEvictionRunsMillis
    * @see GenericObjectPool#setMinEvictableIdleTimeMillis
    */
   public void setMinEvictableIdleTimeMillis(long minEvictableIdleTimeMillis) {
      this.minEvictableIdleTimeMillis = minEvictableIdleTimeMillis;
   }
   /**
    * Return the minimum time that an idle object can sit in the pool.
    */
   public long getMinEvictableIdleTimeMillis() {
      return this.minEvictableIdleTimeMillis;
   }
   /**
    * Set whether the call should bock when the pool is exhausted.
    */
   public void setBlockWhenExhausted(boolean blockWhenExhausted) {
      this.blockWhenExhausted = blockWhenExhausted;
   }
   /**
    * Specify if the call should block when the pool is exhausted.
    */
   public boolean isBlockWhenExhausted() {
      return this.blockWhenExhausted;
   }
   /**
    * Creates and holds an ObjectPool instance.
    * @seecreateObjectPool()
    */
   @Override
   protected final void createPool() {
      logger.debug("Creating Commons object pool");
      this.pool = createObjectPool();
   }
   /**
    * Subclasses can override this if they want to return a specific Commons pool.
    * They should apply any configuration properties to the pool here.
    * <p>Default is a GenericObjectPool instance with the given pool size.
    * @return an empty Commons {@code ObjectPool}.
    * @see GenericObjectPool
    * @seesetMaxSize
    */
   protected ObjectPool createObjectPool() {
      GenericObjectPoolConfig config = new GenericObjectPoolConfig();
      config.setMaxTotal(getMaxSize());
      config.setMaxIdle(getMaxIdle());
      config.setMinIdle(getMinIdle());
      config.setMaxWaitMillis(getMaxWait());
      config.setTimeBetweenEvictionRunsMillis(getTimeBetweenEvictionRunsMillis());
      config.setMinEvictableIdleTimeMillis(getMinEvictableIdleTimeMillis());
      config.setBlockWhenExhausted(isBlockWhenExhausted());
      return new GenericObjectPool(this, config);
   }
   /**
    * Borrows an object from the {@code ObjectPool}.
    */
   @Override
   public Object getTarget() throws Exception {
      Assert.state(this.pool != null, "No Commons ObjectPool available");
      return this.pool.borrowObject();
   }
   /**
    * Returns the specified object to the underlying {@code ObjectPool}.
    */
   @Override
   public void releaseTarget(Object target) throws Exception {
      if (this.pool != null) {
         this.pool.returnObject(target);
      }
   }
   @Override
   public int getActiveCount() throws UnsupportedOperationException {
      return (this.pool != null ? this.pool.getNumActive() : 0);
   }
   @Override
   public int getIdleCount() throws UnsupportedOperationException {
      return (this.pool != null ? this.pool.getNumIdle() : 0);
   }
   /**
    * Closes the underlying {@code ObjectPool} when destroying this object.
    */
   @Override
   public void destroy() throws Exception {
      if (this.pool != null) {
         logger.debug("Closing Commons ObjectPool");
         this.pool.close();
      }
   }
   //----------------------------------------------------------------------------
   // Implementation of org.apache.commons.pool2.PooledObjectFactory interface
   //----------------------------------------------------------------------------
   @Override
   public PooledObject<Object> makeObject() throws Exception {
      return new DefaultPooledObject<>(newPrototypeInstance());
   }
   @Override
   public void destroyObject(PooledObject<Object> p) throws Exception {
      destroyPrototypeInstance(p.getObject());
   }
   @Override
   public boolean validateObject(PooledObject<Object> p) {
      return true;
   }
   @Override
   public void activateObject(PooledObject<Object> p) throws Exception {
   }
   @Override
   public void passivateObject(PooledObject<Object> p) throws Exception {
   }
}
```

#### 2.4、ThreadLocalTargetSource

ThreadLocalTargetSource也就是和线程绑定的TargetSource，可以理解，其底层实现必然使用的是ThreadLocal。既然使用了ThreadLocal，也就是说我们需要注意两个问题：

**1、** 目标对象必须声明为prototype类型，因为每个线程都会持有一个不一样的对象；

**2、** 目标对象必须是无状态的，因为目标对象是和当前线程绑定的，而Spring是使用的线程池处理的请求，因而每个线程可能处理不同的请求，因而为了避免造成问题，目标对象必须是无状态的；

```java
public class ThreadLocalTargetSource extends AbstractPrototypeBasedTargetSource
      implements ThreadLocalTargetSourceStats, DisposableBean {
   /**
    * ThreadLocal holding the target associated with the current
    * thread. Unlike most ThreadLocals, which are static, this variable
    * is meant to be per thread per instance of the ThreadLocalTargetSource class.
    */
   private final ThreadLocal<Object> targetInThread =
         new NamedThreadLocal<>("Thread-local instance of bean '" + getTargetBeanName() + "'");
   /**
    * Set of managed targets, enabling us to keep track of the targets we've created.
    */
   private final Set<Object> targetSet = new HashSet<>();
   private int invocationCount;
   private int hitCount;
   @Override
   public Object getTarget() throws BeansException {
      ++this.invocationCount;
      Object target = this.targetInThread.get();
      if (target == null) {
         if (logger.isDebugEnabled()) {
            logger.debug("No target for prototype '" + getTargetBeanName() + "' bound to thread: " +
                  "creating one and binding it to thread '" + Thread.currentThread().getName() + "'");
         }
         // Associate target with ThreadLocal.
         target = newPrototypeInstance();
         this.targetInThread.set(target);
         synchronized (this.targetSet) {
            this.targetSet.add(target);
         }
      }
      else {
         ++this.hitCount;
      }
      return target;
   }
   @Override
   public void destroy() {
      logger.debug("Destroying ThreadLocalTargetSource bindings");
      synchronized (this.targetSet) {
         for (Object target : this.targetSet) {
            destroyPrototypeInstance(target);
         }
         this.targetSet.clear();
      }
      // Clear ThreadLocal, just in case.
      this.targetInThread.remove();
   }
   @Override
   public int getInvocationCount() {
      return this.invocationCount;
   }
   @Override
   public int getHitCount() {
      return this.hitCount;
   }
   @Override
   public int getObjectCount() {
      synchronized (this.targetSet) {
         return this.targetSet.size();
      }
   }
   public IntroductionAdvisor getStatsMixin() {
      DelegatingIntroductionInterceptor dii = new DelegatingIntroductionInterceptor(this);
      return new DefaultIntroductionAdvisor(dii, ThreadLocalTargetSourceStats.class);
   }
}
```

这里ThreadLocalTargetSource主要集成了AbstractPrototypeBasedTargetSource和DisposableBean。关于AbstractPrototypeBasedTargetSource前面已经讲过了，读者可以到前面翻看；而DisposableBean的作用主要是提供一个方法，以供给Spring在销毁当前对象的时候调用。也就是说Spring在销毁当前TargetSource对象的时候会首先销毁其生成的各个目标对象。这里需要注意的是，TargetSource和生成的目标对象是两个对象，前面讲的TargetSouce都是单例的，只是生成的目标对象可能是单例的，也可能是多例的。

#### 2.5、HotSwappableTargetSource

HotSwappableTargetSource使用户可以以线程安全的方式切换目标对象,提供所谓的热交换功能。这个特性是很有用的,尽管它的开启需要AOP应用进行显式的配置,但配置并不复杂,在使用时,只需要把 HotSwappableargetSource配置到ProxyFactoryBean的Target属性就可以了,在需要更换真正的目标对象时,调用HotSwappableTargetSource的swap方法就可以完成。由此可见,对HotSwappableTargetSource的热交换功能的使用,是需要触发swap方法调用的。这个swap方法的实现很简单,它完成 target对象的替换,也就是说,它使用新的 target对象来替换原有的 target对象。为了保证线程安全,需要把这个替换方法设为 synchronized方法。

```java
public class HotSwappableTargetSource implements TargetSource, Serializable {
   /** use serialVersionUID from Spring 1.2 for interoperability. */
   private static final long serialVersionUID = 7497929212653839187L;
   /** The current target object. */
   private Object target;
   /**
    * Create a new HotSwappableTargetSource with the given initial target object.
    * @param initialTarget the initial target object
    */
   public HotSwappableTargetSource(Object initialTarget) {
      Assert.notNull(initialTarget, "Target object must not be null");
      this.target = initialTarget;
   }
   /**
    * Return the type of the current target object.
    * <p>The returned type should usually be constant across all target objects.
    */
   @Override
   public synchronized Class<?> getTargetClass() {
      return this.target.getClass();
   }
   @Override
   public final boolean isStatic() {
      return false;
   }
   @Override
   public synchronized Object getTarget() {
      return this.target;
   }
   @Override
   public void releaseTarget(Object target) {
      // nothing to do
   }
   /**
    * Swap the target, returning the old target object.
    * @param newTarget the new target object
    * @return the old target object
    * @throws IllegalArgumentException if the new target is invalid
    */
   public synchronized Object swap(Object newTarget) throws IllegalArgumentException {
      Assert.notNull(newTarget, "Target object must not be null");
      Object old = this.target;
      this.target = newTarget;
      return old;
   }
   /**
    * Two HotSwappableTargetSources are equal if the current target
    * objects are equal.
    */
   @Override
   public boolean equals(Object other) {
      return (this == other || (other instanceof HotSwappableTargetSource &&
            this.target.equals(((HotSwappableTargetSource) other).target)));
   }
   @Override
   public int hashCode() {
      return HotSwappableTargetSource.class.hashCode();
   }
   @Override
   public String toString() {
      return "HotSwappableTargetSource for target: " + this.target;
   }
}
```
