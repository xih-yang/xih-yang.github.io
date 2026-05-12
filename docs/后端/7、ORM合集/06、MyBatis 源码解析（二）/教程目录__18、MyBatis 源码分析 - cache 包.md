# 18、MyBatis 源码分析 - cache 包
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/18.html
- 分类：ORM框架
- 分组：教程目录
提到性能的提升最先想到的就是加缓存，在 MyBatis 中同样也有这样的一个包。MyBatis 每秒可能都会处理大量的查询请求，但是这些请求中大部分的请求都是重复的，如果每次都要调用数据库接口去查询的话，那么必然会增加数据库的压力。

缓存就可以有效的解决这个问题，在执行查询之前先判断缓存中是否有，如果有就直接返回了，如果没有再调用数据库的接口查询。

### cache 包类结构和组成

首先来看看 cache 包中类的结构，可以发现其实结构特别的简单，大部分都是 Cache 的实现类，它们都是 MyBatis 内置的缓存策略。还有一个辅助类 `TransactionalCacheManager` 和 `CacheKey` 。

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-U7zMZEdP-1626140679448)(media/16253914284344/cache.png)]

**Cache 及其实现类**：Cache 一共有 11 个实现类，其中有 1 个基础实现类 `PerpetualCache`，有 10 个装饰器类。这 10 个装饰器类又可以分为以下几种类型。

**1、** 同步装饰器：为缓存增加同步功能，防止出现并发问题内置实现`SynchronizedCache`；

**2、** 统计分析装饰器：为缓存增加统计分析功能，通过记录每次请求的结果，分析出缓存命中率，得到缓存有效性内置实现`LoggingCache`；

**3、** 缓存过期装饰器：缓存一般不会是永久存储的，因为这会占用内存资源，并且有些数据可能访问了一次之后，再也不会访问到了，所以就需要缓存过期策略来保证存储的都是**热点数据**内置实现`FifoCache`、`LruCache`、`ScheduledCache`、`SoftCache`、`WeakCache`；

**4、** 阻塞装饰器：为缓存增加阻塞功能，可以在高并发情况下保证多次相同的数据库查询请求只有一次会真正去请求数据库，减小数据库的压力内置实现`BlockingCache`；

**5、** 序列化装饰器：为缓存的值增加序列化，保证缓存的内容不会受到外部修改的影响内置实现`SerializedCache`；

**6、** 事务装饰器：让缓存也能支持事务内置实现`TransactionalCache`；

**CacheKey**：它的作用就是能判断两次请求是不是完全相同，还要兼顾高效的比较。

**TransactionalCacheManager**：帮助我们管理事务缓存。

### Cache 及其实现类

前置知识是为了更好的帮助小伙伴们理解缓存的设计，最好先简单的了解一下，再往后阅读，不过也可以等提到了相关的知识时再回来阅读。

#### 前置知识一：装饰者模式

装饰者模式是扩展一个类功能的，并且可以不修改该类功能的一种设计模式。MyBatis 设计缓存的时候就使用了这个设计模式，如果我们想要使用自定义的缓存实现也只需要实现对应的抽象类然后进行简单的配置就行了。

具体装饰者模式的实现方法不在这里进行扩展了，如果有不了解的朋友建议先去简单学习一下，然后接着学习本篇文章的内容。

#### 前置知识二：Java 对象的引用级别

- 如何判断一个对象是否需要被回收

要知道Java 语言的一个特性就是可以**自动的管理内存**。即，将那些无用的 Java 对象从内存中删除。但是 Java 是如何判断一个对象是否有用呢，就是通过这个对象是否被引用来判断的。

- 薛定谔的引用

正常来说一个对象被引用了，那么说明它正在或者即将被使用，所以不能将它进行回收，如果没有被引用的话，那么我们就可以将其安全的回收掉。但是在实际情况下引用并不是只有引用和没有引用这两种状态。

比如可能会出现一种情况，我们觉得一个内容可以有可以没有，如果内存紧张的情况下可以没有，如果内存充裕的情况下可以一直保留。例如：我们经常会缓存结果来提高系统的性能，但是缓存不是必须存在的，如果内存空间不足的时候，可以丢弃缓存内容来保证整个系统的可用。

在Java 中引用级别可分为四类：**强引用**、**软引用**、**弱引用**、**虚引用**。简化的来说就是**强软弱虚**，它们代表的引用程度是依次递减的。

- 强引用：强引用最为常见的引用级别，例如下面的代码就是强引用，JVM 只有在明确这个 Object 没有被任何引用下才会回收它。

```java
Object obj = new Object();
```

- 软引用：软引用相较于强引用引用程度低一级，在 JVM 内存充裕的情况下不会被回收，但是只要 JVM 的内存不足的情况下，就会回收掉软引用的对象。实例代码如下：

```java
SoftReference<Object> softReference = new SoftReference<>(new Object());
```

- 弱引用：弱引用相较于软引用引用程度还要低一级，而被弱引用指向的对象可能在任何时候，就算当前 JVM 内存充裕的情况下。实例代码如下：

```java
WeakReference<Object> weakReference = new WeakReference<>(new Object());
```

- 虚引用：虚引用是引用程度最低的一种引用了，甚至你可以认为它没有引用，并且它的 get 方法在任何情况下都只会返回 null，那么它的作用是什么呢？其实它的作用和它的一个特性是有关联的，和其他的引用不同，创建虚引用的时候必须要指定一个**引用队列**。在被引用对象被回收的时候，就会将引用添加到队列中，即如果从引用队列中拿到了一个引用，那么其所指向的对象就已经被回收了。实例代码如下：

```java
ReferenceQueue<Object> queue = new ReferenceQueue<>();
    PhantomReference<Object> phantomReference = new PhantomReference<>(new Object(), queue);
```

虚引用使用场景：

**1、** 想要得知对象被GC的时机，以方便在销毁前进行一些操作，例如资源回收等；

**2、** 对堆外内存进行管理，例如内存的释放；

#### Cache 顶层接口

所有的缓存都必须要实现这一接口，接口中的方法也特别好理解。

```java
public interface Cache {
  // 得到缓存的唯一ID
  String getId();
  // 将值放入到缓存中
  void putObject(Object key, Object value);
  // 从缓存中查询值
  Object getObject(Object key);
  // 删除缓存中的值
  Object removeObject(Object key);
  // 清空缓存
  void clear();
  // 已缓存的数量
  int getSize();
}
```

#### Cache 的基础实现类

在装饰器模式中，至少要有一个基础实现类，那么到底什么是基础实现类呢？在 cache 包中我们可以认为真正干实事的就是基础实现类，即**真正实现了缓存功能的类就是基础实现类**，装饰器类则是在其上**附加**了一些功能。

在cache 包下，只内置了一个基础实现类 `PerpetualCache`。它的功能很简单，就是将要缓存的内容到一个 HashMap 的数据结构中。代码实现如下，可以发现所有的功能其实都是调用的 HashMap 对应的方法。

```java
public class PerpetualCache implements Cache {
  ...
  // 利用 HashMap 作为缓存
  private final Map<Object, Object> cache = new HashMap<>();
  ...
  @Override
  public int getSize() {
    return cache.size();
  }
  @Override
  public void putObject(Object key, Object value) {
    cache.put(key, value);
  }
  @Override
  public Object getObject(Object key) {
    return cache.get(key);
  }
  @Override
  public Object removeObject(Object key) {
    return cache.remove(key);
  }
  @Override
  public void clear() {
    cache.clear();
  }
}
```

#### 同步装饰器

同步装饰器是为了解决并发问题，MyBatis 内置实现也写的特别简单，在每个操作缓存的方法上都加上了 `synchronized` 关键字。代码如下：

```java
public class SynchronizedCache implements Cache {
  ...
  @Override
  public synchronized int getSize() {
    return delegate.getSize();
  }
  @Override
  public synchronized void putObject(Object key, Object object) {
    delegate.putObject(key, object);
  }
  @Override
  public synchronized Object getObject(Object key) {
    return delegate.getObject(key);
  }
  @Override
  public synchronized Object removeObject(Object key) {
    return delegate.removeObject(key);
  }
  @Override
  public synchronized void clear() {
    delegate.clear();
  }
  ...
}
```

#### 统计分析装饰器

在使用了缓存的情况下，我们一般也会去关注缓存的命中率，因为缓存的命中率侧面反映了使用缓存带来了多少性能上的提升。如果缓存命中率高，说明整个架构设计的是相当好的，如果缓存命中率很低则说明架构设计上有待提升。

而MyBatis 就内置了一个可以得到缓存命中率的装饰器类 `LoggingCache`，名称写的是日志缓存，其实它主要是一个统计分析的，只是内部使用了 `Log` 来打印缓存命中率。代码实现如下：

```java
public class LoggingCache implements Cache {
  // 日志记录工具
  private final Log log;
  // 被装饰的类
  private final Cache delegate;
  // 请求次数
  protected int requests = 0;
  // 缓存命中次数
    @Override
  public Object getObject(Object key) {
    // 请求次数 + 1
    requests++;
    final Object value = delegate.getObject(key);
    if (value != null) {
      // 如果值不为 null，说明缓存命中了，命中次数 + 1
      hits++;
    }
    if (log.isDebugEnabled()) {
      // 打印缓存命中率
      log.debug("Cache Hit Ratio [" + getId() + "]: " + getHitRatio());
    }
    return value;
  }
  private double getHitRatio() {
    // 缓存命中率 = 命中次数 / 请求次数
    return (double) hits / (double) requests;
  }
}
```

#### 缓存过期装饰器

在缓存使用过程中，我们通常都需要指定缓存的过期策略，因为随着时间的改变，热点数据会发生修改，而内存相对于磁盘空间来说是宝贵的，不可能存储所有的内容，所以我们会想要清除一些缓存的内容。

MyBatis 内置了 5 种缓存过期策略，而这 5 种基本上就能满足我们生产的需求，接下来就挨着挨着分析每个缓存过期装饰器类。

##### FifoCache

FIFO，先进先出。通过名称我们可以猜测出这个类底层使用的是一个先进先出队列，即先进的缓存内容，在需要过期的时候会优先过期。底层实现是通过一个双向队列存储所有缓存的 key 。代码实现如下：

```java
  // 被装饰对象
  private final Cache delegate;
  // 缓存的 key 列表
  private final Deque<Object> keyList;
  // 先进先出队列大小，默认为 1024
  private int size;
    @Override
  public void putObject(Object key, Object value) {
    // put 之前保证缓存的 key 的数量没有超过限定值
    cycleKeyList(key);
    delegate.putObject(key, value);
  }
  private void cycleKeyList(Object key) {
    // 将 key 添加到队列尾部
    keyList.addLast(key);
    // 由于是先进先出队列，所以如果长度超过了阈值，则删除最先存放的缓存
    // 也就是列表的第一个元素
    if (keyList.size() > size) {
      Object oldestKey = keyList.removeFirst();
      delegate.removeObject(oldestKey);
    }
  }
```

##### LruCache

Lru，最近最少使用。是缓存过期策略中常用的方案之一，在 MyBatis 中也采用其为默认的缓存过期策略。即在缓存的数量到达上限后会将最近最少使用的缓存给删除掉。代码实现如下，其实最重要的一点是我们重写了 `LinkedHashMap` 的 `removeEldestEntry` 当缓存数量达到阈值时会删除存储的内容，并且记录删除内容的 key，在后续的步骤从还要从被修饰对象中删去对应的 key。

```java
public class LruCache implements Cache {
  // 用于实现 LRU 的数据结构
  private Map<Object, Object> keyMap;
  // 待删除的 key
  private Object eldestKey;
  public LruCache(Cache delegate) {
    this.delegate = delegate;
    setSize(1024);
  }
  public void setSize(final int size) {
    // 利用 LinkedHashMap 实现的 LRU
    // 第三个参数为排序规则，true 则是通过访问顺序排序，false 则是通过查询顺序排序
    // 由于要实现自动删除最近最少使用的，所以要重写 removeEldestEntry 如果返回 true 就会自动删除最近使用最少的一条记录
    keyMap = new LinkedHashMap<Object, Object>(size, .75F, true) {
      private static final long serialVersionUID = 4267176411845948333L;
      @Override
      protected boolean removeEldestEntry(Map.Entry<Object, Object> eldest) {
        // 如果大于了 size 的话，则需要删除最近最少使用的 key
        // 但是这里的删除只是删除的 LRU 记录的 key，我们还需要同步删除被修饰对象中
        // 对应的 key。所以这里会先暂存一下。
        boolean tooBig = size() > size;
        if (tooBig) {
          eldestKey = eldest.getKey();
        }
        return tooBig;
      }
    };
  }
  @Override
  public void putObject(Object key, Object value) {
    delegate.putObject(key, value);
    cycleKeyList(key);
  }
  private void cycleKeyList(Object key) {
    // 同步往 keyMap 中存放值的 key
    keyMap.put(key, key);
    // 如果在放入 keyMap 时删除了最近最少使用的 key 则需要让 delegate 也删除这个 key
    if (eldestKey != null) {
      delegate.removeObject(eldestKey);
      eldestKey = null;
    }
  }
}
```

##### ScheduledCache

定时删除是非常好理解的一种缓存过期策略。但是这个定时删除可能和你们所理解的定时删除不太一样。因为它这个定时删除的粒度是对应所有的缓存对象，而不是某一个缓存对象。即，只要到了过期时间，就会清理所有的缓存对象。

这里的定时删除采用的是被动检测方式，也就是必须要有一个操作来触发检测，而并不是单独启动了一个线程，然后主动的每隔一段时间去扫描。

```java
public class ScheduledCache implements Cache {
  // 清除间隔
  protected long clearInterval;
  // 上次清除时间
  protected long lastClear;
  ...
  @Override
  public int getSize() {
    clearWhenStale();
    return delegate.getSize();
  }
  @Override
  public void putObject(Object key, Object object) {
    clearWhenStale();
    delegate.putObject(key, object);
  }
  @Override
  public Object getObject(Object key) {
    return clearWhenStale() ? null : delegate.getObject(key);
  }
  @Override
  public Object removeObject(Object key) {
    clearWhenStale();
    return delegate.removeObject(key);
  }
  ...
  private boolean clearWhenStale() {
    // 如果距离上次清空时间已经超过了设定的时间间隔则会清除缓存
    if (System.currentTimeMillis() - lastClear > clearInterval) {
      clear();
      return true;
    }
    return false;
  }
  @Override
  public void clear() {
    lastClear = System.currentTimeMillis();
    delegate.clear();
  }
}
```

##### SoftCache

前面提到的缓存过期策略，都是借用数据结构和算法来实现的，而这一种过期策略是通过 JVM 的 GC 机制来实现的（虽然底层还是数据结果和算法，但是不是我们自己写的，所以还是需要区分一下）。

SoftCache 的底层实现就是 Java 四种引用级别中的软引用，在前置知识二中有提到 Java 的四种引用级别，如果刚才没有看的小伙伴可以先去看了再过来。

```java
public class SoftCache implements Cache {
  // 强引用列表避免垃圾回收掉的列表
  private final Deque<Object> hardLinksToAvoidGarbageCollection;
  // 引用队列，如果引用对象被回收掉了，会将引用放置到这个队列中
  private final ReferenceQueue<Object> queueOfGarbageCollectedEntries;
  // 被修饰对象
  private final Cache delegate;
  // 最大强引用的数量
  private int numberOfHardLinks;
  @Override
  public int getSize() {
    removeGarbageCollectedItems();
    return delegate.getSize();
  }
  @Override
  public void putObject(Object key, Object value) {
    removeGarbageCollectedItems();
    delegate.putObject(key, new SoftEntry(key, value, queueOfGarbageCollectedEntries));
  }
  @Override
  public Object getObject(Object key) {
    Object result = null;
    SoftReference<Object> softReference = (SoftReference<Object>) delegate.getObject(key);
    if (softReference != null) {
      result = softReference.get();
      // 如果已经被垃圾回收机制回收掉了，那么通知被代理对象删除这个 key
      if (result == null) {
        delegate.removeObject(key);
      } else {
        // 保证状态一致，由于可能存在多个装饰器类，而 SoftCache 是处于中间层次的
        // 内层的返回了存在，那么就需要保证外层也是存在的
        // 所以就需要强引用来保证
        synchronized (hardLinksToAvoidGarbageCollection) {
          hardLinksToAvoidGarbageCollection.addFirst(result);
          if (hardLinksToAvoidGarbageCollection.size() > numberOfHardLinks) {
            hardLinksToAvoidGarbageCollection.removeLast();
          }
        }
      }
    }
    return result;
  }
  @Override
  public Object removeObject(Object key) {
    removeGarbageCollectedItems();
    return delegate.removeObject(key);
  }
  @Override
  public void clear() {
    synchronized (hardLinksToAvoidGarbageCollection) {
      hardLinksToAvoidGarbageCollection.clear();
    }
    removeGarbageCollectedItems();
    delegate.clear();
  }
  private void removeGarbageCollectedItems() {
    // 清除已经被垃圾回收掉的软引用，并且将其从代理
    SoftEntry sv;
    while ((sv = (SoftEntry) queueOfGarbageCollectedEntries.poll()) != null) {
      delegate.removeObject(sv.key);
    }
  }
  // 定义了一个专门的类，因为想要在被回收以后能拿到被回收对象的 key，所以选择将 key 存在自己的属性中防止被回收。
  private static class SoftEntry extends SoftReference<Object> {
    private final Object key;
    SoftEntry(Object key, Object value, ReferenceQueue<Object> garbageCollectionQueue) {
      super(value, garbageCollectionQueue);
      this.key = key;
    }
  }
}
```

这里也使用了被动检测，GC 只会主动的回收在当前类中设置的弱引用对象，但是对应的弱引用对象被回收了，我们还需要去将对应的 key 从被修饰对象中删除。

##### WeakCache

和SoftCache 的实现类似，只是从引用级别来看，弱引用比软引用的引用级别更低，可以理解为缓存更容易被清除。代码就不在这里进行展开了，如果感兴趣的同学可以去对照的看一下两个类的实现。

#### 阻塞装饰器

阻塞装饰器是为了解决缓存三大问题中的**缓存击穿**问题的。正常情况下如果一个缓存没有被命中，那么我们就需要去数据库中进行查询，然后再次放到缓存中，但是可能会出现一个极端的情况，也就是刚好这个数据是一个热点数据，就可能会有大量的请求在这一瞬间想要查询这个值，由于没有做任何处理就导致都会请求到数据库，如果并发够多，那么可能瞬间就能将数据库给击垮。

所以我们就希望在缓存没有命中的情况下，同一时间只允许一个线程继续处理，其他的线程都必须要等待指定请求处理结束后才能继续执行后面都内容。而这个线程需要做的就是去数据库查询结果，然后将值存放到缓存中，最后结束执行，然后其他的线程就可以继续执行了。

MyBatis 的内置阻塞装饰器 `BlockingCache` 的底层采用的是通过加锁的方式实现的。即在查询数据前先获取锁，如果缓存命中了则释放锁并返回，如果缓存没有命中，则需要从数据库查询出结果放置到缓存中，释放锁并返回。

示意图如下：

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-eFGGj2la-1626140679452)(media/16253914284344/BlockingCache.png)]

代码实现如下：

```java
public class BlockingCache implements Cache {
  // 超时等待时间
  private long timeout;
  // 被修饰对象
  private final Cache delegate;
  // 保存每个 key 对应的锁
  // 由于 CountDownLatch 设置的值为 1，即只要 countDown 就是在释放锁
  // 而获取锁的过程非覆盖的往 locks 中设置锁对象
  private final ConcurrentHashMap<Object, CountDownLatch> locks;
    @Override
  public void putObject(Object key, Object value) {
    try {
      delegate.putObject(key, value);
    } finally {
      // 释放锁
      releaseLock(key);
    }
  }
  @Override
  public Object getObject(Object key) {
    // 获取锁
    acquireLock(key);
    // 获取值
    Object value = delegate.getObject(key);
    if (value != null) {
      // 读到结果后释放锁
      releaseLock(key);
    }
    // 如果缓存中没有读到结果，则不会释放锁。
    // 对应的锁会在从数据库读取了结果并写入缓存后，在 putObject 中释放
    return value;
  }
  @Override
  public Object removeObject(Object key) {
    // 删除对应的 key 需要释放锁
    releaseLock(key);
    return null;
  }
  private void acquireLock(Object key) {
    CountDownLatch newLatch = new CountDownLatch(1);
    while (true) {
      // 尝试放入锁对象，只有放入成功了才算是成功获取到锁
      // 如果放入成功了，说明在此之前 key 是没有对应的 Lock 的
      // 所以只要放入成功（即，获取到逻辑上的锁），latch 就一定是 null，也就可以进行后面的业务了
      CountDownLatch latch = locks.putIfAbsent(key, newLatch);
      if (latch == null) {
        break;
      }
      // 如果没有获取到锁，则等待一段时间，或等待别人唤醒
      try {
        if (timeout > 0) {
          boolean acquired = latch.await(timeout, TimeUnit.MILLISECONDS);
          if (!acquired) {
            throw new CacheException();
          }
        } else {
          latch.await();
        }
      } catch (InterruptedException e) {
        throw new CacheException();
      }
    }
  }
  private void releaseLock(Object key) {
    CountDownLatch latch = locks.remove(key);
    if (latch == null) {
      // 如果想要释放一个不存在的锁，抛出异常
      throw new IllegalStateException();
    }
    // 释放锁
    latch.countDown();
  }
```

#### 序列化装饰器

它的作用就是为缓存的值增加序列化，保证缓存的内容不会受到外部修改的影响。因为反序列化后会生成一个新的对象，对这个对象的任何修改操作都不会影响到被序列化后缓存的对象。

重要的是在写入缓存前先序列化，在读取后返回前要进行一次反序列化。而具体的序列化和反序列化实现只需要简单了解一下就好了。重要的要明白反序列化后得到对象是一个全新的对象。

```java
public class SerializedCache implements Cache {
  ...
  @Override
  public void putObject(Object key, Object object) {
    if (object == null || object instanceof Serializable) {
      delegate.putObject(key, serialize((Serializable) object));
    } else {
      throw new CacheException();
    }
  }
  @Override
  public Object getObject(Object key) {
    Object object = delegate.getObject(key);
    return object == null ? null : deserialize((byte[]) object);
  }
  private byte[] serialize(Serializable value) {
    try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(bos)) {
      oos.writeObject(value);
      oos.flush();
      return bos.toByteArray();
    } catch (Exception e) {
      throw new CacheException();
    }
  }
  private Serializable deserialize(byte[] value) {
    SerialFilterChecker.check();
    Serializable result;
    try (ByteArrayInputStream bis = new ByteArrayInputStream(value);
        ObjectInputStream ois = new CustomObjectInputStream(bis)) {
      result = (Serializable) ois.readObject();
    } catch (Exception e) {
      throw new CacheException();
    }
    return result;
  }
  ...
  public static class CustomObjectInputStream extends ObjectInputStream {
    public CustomObjectInputStream(InputStream in) throws IOException {
      super(in);
    }
    @Override
    protected Class<?> resolveClass(ObjectStreamClass desc) throws ClassNotFoundException {
      // 重写了 resolveClass 方法，保证生成对象类型一致
      return Resources.classForName(desc.getName());
    }
  }
}
```

#### 事务装饰器

在没有事务的情况下，可能上面的修饰器就已经够用了，但是一旦引入事务，那么可能就会出现脏读的情况，明明别人的事务还没有提交，但是你把数据读出来了，那么如果别人回滚了，那么你读到的其实是一个不存在的数据。

为了解决这个问题，就出现了事务装饰器。事务装饰器的作用可以认为是在原来的缓存上又多了一级缓存，我们可以认为这个是三级缓存，对这个缓存的修改操作一开始只会保存在三级缓存中，这个三级缓存是事务之间隔离的，也就是说事务A的三级缓存是无法访问事务B的三级缓存的。这样就达到了事务隔离的效果，但是在事务提交后，是会将三级缓存中的内容刷新到二级缓存中，如果事务回滚了，只需要清除缓存中存储的内容即可。

代码实现如下：

```java
public class TransactionalCache implements Cache {
  ...
  // 事务提交后是否直接清理
  private boolean clearOnCommit;
  // 三级缓存
  private final Map<Object, Object> entriesToAddOnCommit;
  // 缓存查询未命中的数据
  private final Set<Object> entriesMissedInCache;
  ...
  @Override
  public Object getObject(Object key) {
    // 从缓存中查询
    Object object = delegate.getObject(key);
    if (object == null) {
      // 记录缓存未命中
      entriesMissedInCache.add(key);
    }
    // 如果设置了提交立马清除，则直接返回 null
    if (clearOnCommit) {
      return null;
    } else {
      return object;
    }
  }
  @Override
  public void putObject(Object key, Object object) {
    // 不直接放到被代理的 Cache 中，而是先暂存起来，等到事务提交后才真正写入到缓存中
    entriesToAddOnCommit.put(key, object);
  }
  @Override
  public void clear() {
    // 提交时清除缓存
    clearOnCommit = true;
    // 清除事务缓存中所缓存的内容
    entriesToAddOnCommit.clear();
  }
  public void commit() {
    // 如果执行过 clear，那么在真正提交的时候才让被代理 Cache 清除缓存
    // 以达到事务的隔离效果
    if (clearOnCommit) {
      delegate.clear();
    }
    // 真正提交事务
    flushPendingEntries();
    // 重置事务到初始状态
    reset();
  }
  public void rollback() {
    // 释放锁
    unlockMissedEntries();
    // 重置事务到初始状态
    reset();
  }
  private void reset() {
    clearOnCommit = false;
    entriesToAddOnCommit.clear();
    entriesMissedInCache.clear();
  }
  private void flushPendingEntries() {
    // 1. 刷新事务缓存到被代理对象的 Cache 中
    // 即将在这里才将 putObject 的指令真正的执行
    for (Map.Entry<Object, Object> entry : entriesToAddOnCommit.entrySet()) {
      delegate.putObject(entry.getKey(), entry.getValue());
    }
    // 2. 将缓存未命中的同样要执行一次 put 指令
    // 因为如果缓存被 BlockingCache 修饰过的话，在返回 null 的同时会阻塞后面
    // 对该数据的请求，然后在事务提交后或回滚后就需要将锁全部都进行释放
    for (Object entry : entriesMissedInCache) {
      // 如果已经执行过 putObject 就不需要再执行一次了
      if (!entriesToAddOnCommit.containsKey(entry)) {
        delegate.putObject(entry, null);
      }
    }
  }
  private void unlockMissedEntries() {
    // 和 flushPendingEntries 第二步的作用也是一样的
    // 不过这里是通过调用 removeObject 来达到释放锁的效果
    for (Object entry : entriesMissedInCache) {
       delegate.removeObject(entry);
    }
  }
  ...
}
```

### 事务缓存管理器

通常，在一个完整的事务中可能会涉及多个缓存，如果每次执行 get 我们都需要自己找到对应事务缓存，然后再执行 get 方法，或者在执行提交或者回滚的时候需要我们自己手动的去遍历然后调用对应方法。

这是一个比较麻烦的过程，所以我们需要有一个类来帮我们管理一次完整事务中所涉及的缓存。而我们只需要像操作普通的缓存一样去操作就好了，所以 MyBatis 设计了一个 `TransactionalCacheManager`，来简化业务代码的操作。

实现其实并不复杂，只是业务代码中的循环和查找都放到了管理类中统一管理，代码如下：

```java
public class TransactionalCacheManager {
  // 保存了当前事务中涉及的缓存
  private final Map<Cache, TransactionalCache> transactionalCaches = new HashMap<>();
  public void clear(Cache cache) {
    getTransactionalCache(cache).clear();
  }
  public Object getObject(Cache cache, CacheKey key) {
    return getTransactionalCache(cache).getObject(key);
  }
  public void putObject(Cache cache, CacheKey key, Object value) {
    getTransactionalCache(cache).putObject(key, value);
  }
  public void commit() {
    for (TransactionalCache txCache : transactionalCaches.values()) {
      txCache.commit();
    }
  }
  public void rollback() {
    for (TransactionalCache txCache : transactionalCaches.values()) {
      txCache.rollback();
    }
  }
  private TransactionalCache getTransactionalCache(Cache cache) {
    return transactionalCaches.computeIfAbsent(cache, TransactionalCache::new);
  }
}
```

### CacheKey

`CacheKey` 在 MyBatis 缓存架构中同样扮演着重要的角色。因为在缓存中重要的一个步骤就是**比较**，而比较的速度直接影响了缓存查询的速度，所以我们需要这它是可以快速比较的。

在`CacheKey` 中为了实现这个目的，附加了多个字段。代码实现如下：

```java
public class CacheKey implements Cloneable, Serializable {
  // 当前 cacheKey 的乘数，默认值为 37
  private final int multiplier;
  // 当前 cacheKey 的 hashCode，默认值为 17
  private int hashcode;
  // 通过计算得出的校验和
  private long checksum;
  // 由多少个对象组成
  private int count;
  // 存储所有请求参数对象
  private List<Object> updateList;
  public CacheKey() {
    this.hashcode = DEFAULT_HASHCODE;
    this.multiplier = DEFAULT_MULTIPLIER;
    this.count = 0;
    this.updateList = new ArrayList<>();
  }
  public CacheKey(Object[] objects) {
    this();
    updateAll(objects);
  }
  public void update(Object object) {
    int baseHashCode = object == null ? 1 : ArrayUtil.hashCode(object);
    // 参数数量 + 1
    count++;
    // 校验和增加
    checksum += baseHashCode;
    baseHashCode *= count;
    // 重置 hashcode 的值
    hashcode = multiplier * hashcode + baseHashCode;
    // 将实际的参数添加到列表中
    updateList.add(object);
  }
  public void updateAll(Object[] objects) {
    for (Object o : objects) {
      update(o);
    }
  }
  @Override
  public boolean equals(Object object) {
    // 如果是同一个对象
    if (this == object) {
      return true;
    }
    // 如果不是 CacheKey 及其子类
    if (!(object instanceof CacheKey)) {
      return false;
    }
    final CacheKey cacheKey = (CacheKey) object;
    // 比较 hashcode
    if (hashcode != cacheKey.hashcode) {
      return false;
    }
    // 比较校验和
    if (checksum != cacheKey.checksum) {
      return false;
    }
    // 比较列表中参数数量
    if (count != cacheKey.count) {
      return false;
    }
    // 比较所有参数是否一致
    for (int i = 0; i < updateList.size(); i++) {
      Object thisObject = updateList.get(i);
      Object thatObject = cacheKey.updateList.get(i);
      if (!ArrayUtil.equals(thisObject, thatObject)) {
        return false;
      }
    }
    // 如果全都一致返回 true
    // 如果有一个不一致则返回 false
    return true;
  }
}
```

### Cache 的构建

其实在讲解 builder 包的时候就有提到 Cache 的构建，但是估计大家可能都忘了，而且详细讲解完每个装饰器类后，再回顾一下 Cache 的构建过程会让大家的印象更加的深刻。

我们不用管入口如何，只需要关注一个类 `CacheBuilder`，这个类就是真正构建 `Cache` 的地方。先来看看该类的成员变量，代码如下：

```java
  // 映射文件的命名空间
  private final String id;
  // 缓存的基础实现类，默认为 PerpetualCache
  private Class<? extends Cache> implementation;
  // 装饰器类，实际上里面存放的是缓存过期策略类
  // MyBatis 默认的有 LRU、FIFO、SOFT、WEAK 这四种
  // 虽然是列表但是有且只会有一个，默认采用的是 LRU
  private final List<Class<? extends Cache>> decorators;
  // 缓存大小
  private Integer size;
  // 定时清除缓存的间隔，如果配置了间隔，则会启用定时让缓存失效
  // 内置实现类为 ScheduledCache
  private Long clearInterval;
  // 允许读和写，如果允许读写缓存中的对象的话，就需要防止缓存中的内容被修改
  // 所以每次 get 到的对象都必须要生成一个新的对象
  // 内置实现类为 SerializedCache
  private boolean readWrite;
  private Properties properties;
  // 是否并发阻塞，如果开支持，则会启用阻塞
  // 内置实现类为 BlockingCache
  private boolean blocking;
```

通过观察成员变量，其实我们就可以发现很多熟悉的装饰器类都出现了。不过这里只是配置需要哪些装饰器类，实际上的组装过程还得看对应的 `build` 方法实现。

**Cache 组装过程**

```java
  public Cache build() {
    // 如果没有设置基础实现类或者装饰器类
    // 设置默认的基础实现类 (PerpetualCache) 和缓存过期策略类 (LruCache)
    setDefaultImplementations();
    // 创建一个基础的 Cache 实现类
    Cache cache = newBaseCacheInstance(implementation, id);
    // 为缓存设置属性，属性的来自配置缓存时，设置的属性
    /*  实例：
        <cache>
          <property name="size" value="100"/>
        </cache>
    */
    setCacheProperties(cache);
    if (PerpetualCache.class.equals(cache.getClass())) {
      // 设置用户声明的装饰器类
      // 在当前版本有且仅有一个
      for (Class<? extends Cache> decorator : decorators) {
        cache = newCacheDecoratorInstance(decorator, cache);
        setCacheProperties(cache);
      }
      // 设置标准的装饰器类
      cache = setStandardDecorators(cache);
    } else if (!LoggingCache.class.isAssignableFrom(cache.getClass())) {
      // 如果基础实现类不是 PerpetualCache 说明是用户自定义的基础实现类，则装饰类就只有 Logging
      cache = new LoggingCache(cache);
    }
    return cache;
  }
  private Cache setStandardDecorators(Cache cache) {
    MetaObject metaCache = SystemMetaObject.forObject(cache);
    // 如果有 size 属性，则需要设置属性值
    if (size != null && metaCache.hasSetter("size")) {
      metaCache.setValue("size", size);
    }
    // 如果设置了缓存的清理间隔，则包装定期删除缓存的装饰类
    if (clearInterval != null) {
      cache = new ScheduledCache(cache);
      ((ScheduledCache) cache).setClearInterval(clearInterval);
    }
    // 如果允许读写缓存，则包装序列化的装饰类
    if (readWrite) {
      cache = new SerializedCache(cache);
    }
    // 包装能打印缓存命中率的装饰类
    cache = new LoggingCache(cache);
    // 包装方法修饰了 synchronized 关键字的装饰类
    cache = new SynchronizedCache(cache);
    // 如果允许阻塞的话，就要包装支持阻塞的装饰类
    if (blocking) {
      cache = new BlockingCache(cache);
    }
    return cache;
  }
```

总结：在缓存构建的过程中，用户能够参与的或者自定义的有两个地方，一个是基础实现类一个是缓存过期策略类。不过一般情况下我们是不需要自定义的，因为 MyBatis 内置的实现就已经够用了。不过你可以重写基础实现类，将缓存的内容存放到其他地方，比如 ehcache、memchahe 或 redis 中。

但是实际情况下，我们是不会开启这个缓存的。
