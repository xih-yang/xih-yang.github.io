# 03、Solr4.8.0源码分析(3)之index的线程池管理
- 来源：https://ddkk.com/zhuanlan/search/solr/1/3.html
- 分类：搜索引擎
- 分组：教程目录
Solr建索引时候是有最大的线程数限制的，它由solrconfig.xml的8控制的，该值等于8就是说Solr最多只能用8个线程来进行updatedocument。

那么Solr建索引时候是怎么管理线程池的呢，主要是通过ThreadAffinityDocumentsWriterThreadPool来进行管理的，它继承了DocumentsWriterPerThreadPool类。ThreadAffinityDocumentsWriterThreadPool的结构并不复杂，主要的一个函数是getAndLock()。

在建索引时候即updatedocuments时候，Solr先要调用getAndLock去获取ThreadState这个锁。而ThreadState这个锁就是存放在ThreadAffinityDocumentsWriterThreadPool的threadBings这个线程池里面。

首先先看下什么是ThreadState锁，源码如下：

ThreadState是DocumentsWriterPerThreadPool的一个内部类。它包含了一个DocumentsWriterPerThread类的实例以及状态控制，DocumentsWriterPerThread是线程池的一个线程，主要作用是索引的建立。该类比较简单就不详细介绍了。

```java
/**
  * {@link ThreadState} references and guards a
  * {@link DocumentsWriterPerThread} instance that is used during indexing to
  * build a in-memory index segment. {@link ThreadState} also holds all flush
  * related per-thread data controlled by {@link DocumentsWriterFlushControl}.
  * <p>
  * A {@link ThreadState}, its methods and members should only accessed by one
  * thread a time. Users must acquire the lock via {@link ThreadState#lock()}
  * and release the lock in a finally block via {@link ThreadState#unlock()}
  * before accessing the state.
  */
 @SuppressWarnings("serial")
 final static class ThreadState extends ReentrantLock {
   DocumentsWriterPerThread dwpt;
   // TODO this should really be part of DocumentsWriterFlushControl
   // write access guarded by DocumentsWriterFlushControl
   volatile boolean flushPending = false;
   // TODO this should really be part of DocumentsWriterFlushControl
   // write access guarded by DocumentsWriterFlushControl
   long bytesUsed = 0;
   // guarded by Reentrant lock
   private boolean isActive = true;
   ThreadState(DocumentsWriterPerThread dpwt) {
     this.dwpt = dpwt;
   }
   /**
    * Resets the internal {@link DocumentsWriterPerThread} with the given one. 
    * if the given DWPT is <code>null</code> this ThreadState is marked as inactive and should not be used
    * for indexing anymore.
    * @seeisActive()  
    */
   private void deactivate() {
     assert this.isHeldByCurrentThread();
     isActive = false;
     reset();
   }
   private void reset() {
     assert this.isHeldByCurrentThread();
     this.dwpt = null;
     this.bytesUsed = 0;
     this.flushPending = false;
   }
   /**
    * Returns <code>true</code> if this ThreadState is still open. This will
    * only return <code>false</code> iff the DW has been closed and this
    * ThreadState is already checked out for flush.
    */
   boolean isActive() {
     assert this.isHeldByCurrentThread();
     return isActive;
   }
   boolean isInitialized() {
     assert this.isHeldByCurrentThread();
     return isActive() && dwpt != null;
   }
   /**
    * Returns the number of currently active bytes in this ThreadState's
    * {@link DocumentsWriterPerThread}
    */
   public long getBytesUsedPerThread() {
     assert this.isHeldByCurrentThread();
     // public for FlushPolicy
     return bytesUsed;
   }
   /**
    * Returns this {@link ThreadState}s {@link DocumentsWriterPerThread}
    */
   public DocumentsWriterPerThread getDocumentsWriterPerThread() {
     assert this.isHeldByCurrentThread();
     // public for FlushPolicy
     return dwpt;
   }
   /**
    * Returns <code>true</code> iff this {@link ThreadState} is marked as flush
    * pending otherwise <code>false</code>
    */
   public boolean isFlushPending() {
     return flushPending;
   }
 }
```

```java
/**
 * A {@link DocumentsWriterPerThreadPool} implementation that tries to assign an
 * indexing thread to the same {@link ThreadState} each time the thread tries to
 * obtain a {@link ThreadState}. Once a new {@link ThreadState} is created it is
 * associated with the creating thread. Subsequently, if the threads associated
 * {@link ThreadState} is not in use it will be associated with the requesting
 * thread. Otherwise, if the {@link ThreadState} is used by another thread
 * {@link ThreadAffinityDocumentsWriterThreadPool} tries to find the currently
 * minimal contended {@link ThreadState}.
 */
class ThreadAffinityDocumentsWriterThreadPool extends DocumentsWriterPerThreadPool {
  private Map<Thread, ThreadState> threadBindings = new ConcurrentHashMap<>();
  /**
   * Creates a new {@link ThreadAffinityDocumentsWriterThreadPool} with a given maximum of {@link ThreadState}s.
   */
  public ThreadAffinityDocumentsWriterThreadPool(int maxNumPerThreads) {
    super(maxNumPerThreads);
    assert getMaxThreadStates() >= 1;
  }
  @Override
  public ThreadState getAndLock(Thread requestingThread, DocumentsWriter documentsWriter) {
    ThreadState threadState = threadBindings.get(requestingThread);
    if (threadState != null && threadState.tryLock()) {
      return threadState;
    }
    ThreadState minThreadState = null;
    /* TODO -- another thread could lock the minThreadState we just got while 
     we should somehow prevent this. */
    // Find the state that has minimum number of threads waiting
    minThreadState = minContendedThreadState();
    if (minThreadState == null || minThreadState.hasQueuedThreads()) {
      final ThreadState newState = newThreadState(); // state is already locked if non-null
      if (newState != null) {
        assert newState.isHeldByCurrentThread();
        threadBindings.put(requestingThread, newState);
        return newState;
      } else if (minThreadState == null) {
        /*
         * no new threadState available we just take the minContented one
         * This must return a valid thread state since we accessed the 
         * synced context in newThreadState() above.
         */
        minThreadState = minContendedThreadState();
      }
    }
    assert minThreadState != null: "ThreadState is null";
    minThreadState.lock();
    return minThreadState;
  }
  @Override
  public ThreadAffinityDocumentsWriterThreadPool clone() {
    ThreadAffinityDocumentsWriterThreadPool clone = (ThreadAffinityDocumentsWriterThreadPool) super.clone();
    clone.threadBindings = new ConcurrentHashMap<>();
    return clone;
  }
}
```

再回到ThreadAffinityDocumentWriterThreadPool类。getAndLock的主要流程如下:

**1、** 请求线程requestingThread需要进行updatedocument操作，它首先会尝试从线程池threadBings获取自身线程的ThreadState锁并尝试去锁它即trylock如果锁成功了，那么它就能再度获取到自身线程的ThreadState，这是最好的一种情况；

**2、** 如果自身线程的trylock失败，说明该ThreadState已经被别的requestingThread线程抢去，那么请求线程requestingThread只能去线程池threadBings获取别的线程获取的规则是minContendedThreadState(),源码如下所示.；

minContendedThreadState的规则就是遍历所有活跃的ThreadState，如果ThreadState的队列内元素个数最少(即等待这个ThreadState的线程最少)，那么这个ThreadState就是返回的那个ThreadState，即minThreadState.

```java
/**
 * Returns the ThreadState with the minimum estimated number of threads
 * waiting to acquire its lock or <code>null</code> if no {@link ThreadState}
 * is yet visible to the calling thread.
 */
ThreadState minContendedThreadState() {
  ThreadState minThreadState = null;
  final int limit = numThreadStatesActive;
  for (int i = 0; i < limit; i++) {
    final ThreadState state = threadStates[i];
    if (minThreadState == null || state.getQueueLength() < minThreadState.getQueueLength()) {
      minThreadState = state;
    }
  }
  return minThreadState;
}
```

**3、** 如果minThreadState==null(一般是第一个获取ThreadState这种情况)或者minThreadState有其他线程在等待(正常情况下都会有线程在等的)，那么requestingThread会去申请新的ThreadState，即从maxIndexingThreads的线程里申请，源码如下；

threadStates是一个ThreadStates的数组，当需要threadBings的ThreadState个数(也就是活跃的线程)小于threadStates的元素个数（maxIndexingThreads）时就能申请到新的ThreadState。

```java
/**
 * Returns a new {@link ThreadState} iff any new state is available otherwise
 * <code>null</code>.
 * <p>
 * NOTE: the returned {@link ThreadState} is already locked iff non-
 * <code>null</code>.
 * 
 * @return a new {@link ThreadState} iff any new state is available otherwise
 *         <code>null</code>
 */
synchronized ThreadState newThreadState() {
  if (numThreadStatesActive < threadStates.length) {
    final ThreadState threadState = threadStates[numThreadStatesActive];
    threadState.lock(); // lock so nobody else will get this ThreadState
    boolean unlock = true;
    try {
      if (threadState.isActive()) {
        // unreleased thread states are deactivated during DW#close()
        numThreadStatesActive++; // increment will publish the ThreadState
        assert threadState.dwpt == null;
        unlock = false;
        return threadState;
      }
      // unlock since the threadstate is not active anymore - we are closed!
      assert assertUnreleasedThreadStatesInactive();
      return null;
    } finally {
      if (unlock) {
        // in any case make sure we unlock if we fail 
        threadState.unlock();
      }
    }
  }
  return null;
}
```

**4、** 如果minContentedThreadState获取成功，那么threadBings的线程池就会得到更新如果minContentedThreadState获取失败，那么说明threadStates数组以及分配完全，那么请求线程会再去取获取minContentedThreadState；

**5、** 最后请求线程会去lockminThreadState，如果lock失败就进入休眠，一直等到lock成功这是最不好的一种结果；

最后在源码说道，请求线程在获取minThreadState时候别的线程也有可能获取到该minThreadState，目前来说这是一种缺陷。

8这个配置对建索引的性能有较大影响，如果太小那么建索引时候等待情况就会较多。如果太大又增加服务器的负荷，所以要综合选择。
