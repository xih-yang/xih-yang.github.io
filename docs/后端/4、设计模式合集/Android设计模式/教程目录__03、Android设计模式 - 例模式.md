# 03、Android设计模式 - 例模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/3.html
- 分类：设计模式
- 分组：教程目录
最近在看《Android源码设计模式解析与实战》这本书，发现里面还有对源码的一些分析，之前也没好好看过设计模式，就来做个笔记，跟着看一下。

## 定义

确保某一个类只有一个实例，而且自行实例化并向整个系统提供这个实例。

## 使用场景

需要确保一个类只有一个实例的场景，避免产生多个对象小号过多的资源，或者是这个类只应该有一个实例。比如创建一个对象要消耗的资源过多,或者要访问IO和数据库等资源.

配置文件,工具类,线程池,缓存,日志对象等。

## UML类图

角色介绍：

.Client——高层客户端

.Singleton——单例类

实现单例模式的关键点：

- 构造函数不对外开放，一般为Private。就是不允许外部通过new Singleton()来获取对象。
- 通过一个静态方法或枚举返回单例类对象，如getInstance()方法。
- 确保单例类的对象只有一个，尤其是在多线程的情况下。确保即使在多线程也能实现单例。
- 确保单例类对象在反序列化时不会重新构建对象。

## 实现方式

### 饿汉式

```java
public class Singleton {
    private static final Singleton mSingleton = new Singleton();
    private Singleton(){}
    public static Singleton getInstance(){
        return mSingleton;
    }
}
```

里面的对象是个静态对象，第一次声明的时候就会实现初始化。外部只能通过getInstance()获取到这个对象，实现单例。

### 懒汉式

```java
public class Singleton {
    private static  Singleton mSingleton ;
    private Singleton(){}
    public static synchronized Singleton getInstance(){
        if (mSingleton==null){
            mSingleton=new Singleton();
        }
        return mSingleton;
    }
}
```

这里的getInstance()方法加上了synchronized关键字，保证了多线程也能实现单例。

**优点：**

单例只有在使用时才会被实例化，一定程度上节约了资源。

**缺点：**

（1）单例在第一次加载时要及时进行实例化，反应稍慢

（2）每次调用getInstance()都要进行同步，造成不必要的同步开销。

所以一般不建议用。

### Double Check Lock（DCL）双重检查锁

```java
public class Singleton {
    private static  Singleton mSingleton ;
    private Singleton(){}
    public static  Singleton getInstance(){
        if (mSingleton==null){
            synchronized (Singleton.class){
                if (mSingleton==null){
                    mSingleton=new Singleton();
                }
            }
        }
        return mSingleton;
    }
}
```

这个getInstance方法中对mSingleton进行了两次判空：第一次是为了避免不必要的同步锁；第二层是为了在null的时候创建实例。

**DCL失效：**

在多线程下，假设A线程执行到mSingleton=new Singleton()的时候，CPU并不是一次性执行完这条语句的，因为这不是一个原子操作（指不会被线程调度机制打断的操作）。

**举个例子：**执行 Timer timer = new Timer(); 通过字节码文件可以看到这一行代码编译出来是这样的：

```java
         0: new          2                  // class java/util/Timer
         3: dup
         4: invokespecial3                  // Method java/util/Timer."<init>":()V
         7: astore_1
         8: return
```

所以mSingleton=new Singleton()大致做了三件事：

（1）给Singleton的实例分配内存

（2）调用Singleton的构造方法

（3）将mSingleton指向分配的内存空间（这个时候mSingleton才不为空）

由于Java编译器允许处理器乱序执行，所以上面的第二步第三步的执行顺序没法得到保证。执行顺序可能是1-2-3也可能是1-3-2。

当A线程执行顺序是1-3-2的时候，如果执行到了1-3，第2步还没执行的时候，如果B线程判断mSingleton==null的时候就会的发哦FALSE的结果，从而返回一个错误的单例。

**优点：**

资源利用率高，第一次执行getInstance的时候才会被实例化，效率高。

**缺点：**

第一册加载反应稍慢，而且有失败的可能，但是概率很小。

这种是用的最多的单例实现方式，大部分情况下都能保证单例。

### 静态内部类

```java
public class Singleton {
    private Singleton(){}
    public static  Singleton getInstance(){
        return SingletonHolder.mSingleton;
    }
    private static class SingletonHolder{
        private static final Singleton mSingleton = new Singleton();
    }
}
```

当第一次加载Singleton的时候并不会初始化mSingleton，只有在第一次调用getInstance的时候才会加载SIngletonHolder类。

**优点：**

不仅能保证线程安全，也能保证单例的唯一性，也延迟了单例的实例化，比较推荐。

### 枚举单例

```java
public enum Singleton{
    INSTANCE;
    public void doThing(){
        System.out.println(this.hashCode());
    }
}
```

使用时可以通过`Singleton singleton = Singleton.INSTANCE;`来获取单例。

**优点：**

写法简单，而且默认线程安全，任何情况下都是一个单例。

**特点：**

上面的几种在有一种情况下会单例失效，出现重复创建对象，那就是反序列化。

反序列化的时候会调用一个readResolve()方法重新生成一个实例，所以上面的几种方式要解决这个问题需要加入以下方法，：

```java
public class Singleton {
    private Singleton(){}
    public static  Singleton getInstance(){
        return SingletonHolder.mSingleton;
    }
    private static class SingletonHolder{
        private static final Singleton mSingleton = new Singleton();
    }
    private Object readRedolve() throws ObjectStreamException{
        return SingletonHolder.mSingleton;
    }
}
```

### 使用容器实现单例

```java
public class SingletonManager {
    private static Map<String,Objects> objMap = new HashMap<>();
    private SingletonManager(){}
    public static void registerService(String key,Object obj){
        if (!objMap.containsKey(key)){
            objMap.put(key,obj);
        }
    }
    public static Object getService(String key){
        return objMap.get(key);
    }
}
```

在程序的开始，将许多要单例的对象放到一个容器里，用的时候根据key取得对应的单例对象。

## Android源码中的单例模式

源码中的单例模式太多了，甚至有一个专门的单例的抽象类：

```java
package android.util;
public abstract class Singleton<T> {
    private T mInstance;
    protected abstract T create();
    public final T get() {
        synchronized (this) {
            if (mInstance == null) {
                mInstance = create();
            }
            return mInstance;
        }
    }
}
```

我们经常通过context.getSystemService(String name)来获取一些系统服务，如在Activity中获取ActivityManager：

```java
ActivityManager  mActivityManager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);  
```

书中举例为LayoutInflater，平时获取方式为`LayoutInflater.from(context)`,看下这个方法：

```java
package android.view;
public static LayoutInflater from(Context context) {
        LayoutInflater LayoutInflater =
                (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        if (LayoutInflater == null) {
            throw new AssertionError("LayoutInflater not found.");
        }
        return LayoutInflater;
    }
```

发现也是通过调用context.getSystemService(String name)获取的。

那么扎个单例是怎么实现的呢？顺着代码往上看吧。。

context.getSystemService(String name)直接点进去的话会进到

```java
package android.content;
public abstract class Context {
...
    public abstract Object getSystemService(@ServiceName @NonNull String name);
...
}
```

通过分析activity的启动流程可以知道，Context的功能的具体实现是在ContextImpl.java中，看具体实现代码：

```java
package android.app;
class ContextImpl extends Context {
...
    @Override
    public Object getSystemService(String name) {
        return SystemServiceRegistry.getSystemService(this, name);
    }
}
...
```

然后继续SystemServiceRegistry.getSystemService(this, name)：

```java
package android.app;
final class SystemServiceRegistry {
    ...
//用来getSystemService的容器，里面存放的是ServiceFetcher<?>
private static final HashMap<String, ServiceFetcher<?>> SYSTEM_SERVICE_FETCHERS =
            new HashMap<String, ServiceFetcher<?>>();
...
//静态代码块，第一次加载时执行，而且只会执行一次，保证了注册的服务的唯一性。
    static {
        registerService(Context.ACCESSIBILITY_SERVICE, AccessibilityManager.class,
                new CachedServiceFetcher<AccessibilityManager>() {
            @Override
            public AccessibilityManager createService(ContextImpl ctx) {
                return AccessibilityManager.getInstance(ctx);
            }});
        registerService(Context.DOWNLOAD_SERVICE, DownloadManager.class,
                new CachedServiceFetcher<DownloadManager>() {
            @Override
            public DownloadManager createService(ContextImpl ctx) {
                return new DownloadManager(ctx);
            }});
        ...
//还有很多服务注册
    }
  ...
//静态代码块中调用这个方法，把服务名和创建的服务对应放在容器中，实现单例。
      private static <T> void registerService(String serviceName, Class<T> serviceClass,
            ServiceFetcher<T> serviceFetcher) {
        SYSTEM_SERVICE_NAMES.put(serviceClass, serviceName);
        SYSTEM_SERVICE_FETCHERS.put(serviceName, serviceFetcher);
    }
  ...
  public static Object getSystemService(ContextImpl ctx, String name) {
        ServiceFetcher<?> fetcher = SYSTEM_SERVICE_FETCHERS.get(name);
        return fetcher != null ? fetcher.getService(ctx) : null;
    }
  ...
}
```

里面还不是直接拿到服务，而是调用了fetcher.getService(ctx)来获取服务。看看ServiceFetcher

```java
static abstract interface ServiceFetcher<T> {
        T getService(ContextImpl ctx);
    }
```

这是个接口，看上面的静态代码块里面的方法发现注册服务的时候都是用的CachedServiceFetcher这个类：

```java
static abstract class CachedServiceFetcher<T> implements ServiceFetcher<T> {
        private final int mCacheIndex;
        public CachedServiceFetcher() {
            mCacheIndex = sServiceCacheSize++;
        }
        @Override
        @SuppressWarnings("unchecked")
        public final T getService(ContextImpl ctx) {
//ctx.mServiceCache是获取一个数组：new Object[sServiceCacheSize]；
//数组的长度就是构造方法中的那个变量，每注册一个服务，就会new一个对应的CachedServiceFetcher，然后数组长度就+1。第一次获取到这个数组肯定是个空数组
            final Object[] cache = ctx.mServiceCache;
            synchronized (cache) {
                // Fetch or create the service.
                Object service = cache[mCacheIndex];
//第一次获取这个服务的时候，数组是空的 ，所以service == null为TRUE。
                if (service == null) {
//调用注册时实现的createService方法，把生成的具体服务放在数组对应下标中，
//之后就直接从数组中获取了。实现了单例。
                    service = createService(ctx);
                    cache[mCacheIndex] = service;
                }
                return (T)service;
            }
        }
      //  在静态代码块中实现
        public abstract T createService(ContextImpl ctx);
    }
```

里面有个抽象方法，需要实例化的时候实现。在静态代码块中的方法都实现了这个createService(ContextImpl ctx)方法，并且返回了对应的服务。

附上部分注册服务的截图，截不下：

## 总结

### 优点：

- 由于单例模式在内存中只有一个实例，减少了内存开支，特别是一个对象需要频繁创建，或者创建或销毁时性能无法优化，单例模式的优势就很明显了。
- 由于只生成一个实例，减少了系统性能开销。
- 可以避免对资源的多重占用，如文件操作等。
- 单例模式可以设置为全局的访问点，优化和共享资源访问。

### 缺点

- 单例模式一般没有接口，拓展很困难，基本都要修改源代码。
- 在Android中，如果单例模式持有Activity的Context，容易产生内存泄漏。所以尽量用ApplicationContext。
