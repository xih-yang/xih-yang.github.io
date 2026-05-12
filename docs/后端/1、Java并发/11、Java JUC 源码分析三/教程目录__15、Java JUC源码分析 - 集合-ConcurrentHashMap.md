# 15、Java JUC源码分析 - 集合-ConcurrentHashMap
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/15.html
- 分类：Java并发
- 分组：教程目录
好几天没看juc了，之前看了HashMap，还有个差不多的HashTable，二者的结构大致相同，小小的比较下2者的不同：

**1、** HashMap是非线程安全的，HashTable通过synchronized加锁实现线程安全如果我们的代码里存在{get();...;put()}这种操作的话就保证不了；

**2、** HashMap可以存储key或value为null的值，HashTable不行；

**3、** 初始大小HashTable是11，HashMap是16，扩容的话，HashTable是2*old+1，HashMap是2*old；

可能还有其他的不同，先不管了。

这次学习下ConcurrentHashMap，看看为什么说ConcurrentHashMap是线程安全的。HashTable的锁是加在整个table上，这样你put的时候就不同get，get的时候就不能put，而ConcurrentHashMap通过将整个table分段，将一个大的table分成几份，每次只对你要处理的那部分加锁，这样就减少了锁等待，看下ConcurrentHashMap的结构，画个图看看：

画的太丑。ConcurrentHashMap将整个table分成多个segment，每个segment相当于一个table，segment各自维护自己的锁，大概就是这个意思。

看下一些字段：

```java
<span style="font-size:18px;">//默认初始大小
static final int DEFAULT_INITIAL_CAPACITY = 16;
//负载因子
static final float DEFAULT_LOAD_FACTOR = 0.75f;
//每个segment一个锁，并发数，可以看出segment的个数
static final int DEFAULT_CONCURRENCY_LEVEL = 16;
//最大容量
static final int MAXIMUM_CAPACITY = 1 << 30;
//segment中table最小的容量
static final int MIN_SEGMENT_TABLE_CAPACITY = 2;
//segment最大个数，65536
static final int MAX_SEGMENTS = 1 << 16; // slightly conservative
//加锁前重试次数，取size时会用到
static final int RETRIES_BEFORE_LOCK = 2;
//mask，跟segmentshift搭配使用，用来获取存储位置的segment的时候会用，下面讲
final int segmentMask;
//偏移量
final int segmentShift;
//segments
final Segment<K,V>[] segments;
</span>
```

基本还能将就看懂，多了几个字段，主要用来搜索具体segment的时候使用，跟着构造函数看看可能会更清楚怎么用的：

```java
<span style="font-size:18px;">public ConcurrentHashMap(int initialCapacity,
                         float loadFactor, int concurrencyLevel) {
	//入参判断
    if (!(loadFactor > 0) || initialCapacity < 0 || concurrencyLevel <= 0)
        throw new IllegalArgumentException();
	//segment大小判断    
    if (concurrencyLevel > MAX_SEGMENTS)
        concurrencyLevel = MAX_SEGMENTS;
    // Find power-of-two sizes best matching arguments
    int sshift = 0;
    int ssize = 1;
    //这里处理的就是保证segment的大小为不小于入参并发量的2的倍数，有点绕口
    //举个栗子：并发数为9-16时，则ssize为16，跟hashmap那个意思差不多
    while (ssize < concurrencyLevel) {
        ++sshift;
        ssize <<= 1;
    }
    this.segmentShift = 32 - sshift; //segment的偏移量，就是每次hash后右偏移多少位，就是保留hash后值的高位
    this.segmentMask = ssize - 1; //hash右偏移多少位后与这个值做&操作获取值存储的具体segment位置
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    int c = initialCapacity / ssize; //初步计算每个segment的大小
    if (c * ssize < initialCapacity) //如果总数小于入参的初始大小就累加下
        ++c;
    int cap = MIN_SEGMENT_TABLE_CAPACITY; //2
    while (cap < c) //这里保证每个segment的大小为2的倍数
        cap <<= 1;
    //初始化s0，有的版本这里的代码是把所有segment都初始化一遍
    Segment<K,V> s0 =
        new Segment<K,V>(loadFactor, (int)(cap * loadFactor),
                         (HashEntry<K,V>[])new HashEntry[cap]);
    Segment<K,V>[] ss = (Segment<K,V>[])new Segment[ssize];//用ssize初始化segments数组
    UNSAFE.putOrderedObject(ss, SBASE, s0); // concurrentHashMap大量使用unsafe中的方法，unsafe太强大了，不清楚unsafe的可以百度
    this.segments = ss;
}</span>
```

总结下构造做了什么：

**1、** 判断初始入参；2.计算segment数量和每个segment的大小，数值都是2的倍数，并且初始化了s0，其中有2个参数segmentShift和segmentMask很重要2个搭配用来计算key的具体segment存储位置；

看下put方法：

```java
<span style="font-size:18px;">public V put(K key, V value) {
    Segment<K,V> s;
    //注意concurrentHashMap是不能存储key/value为null数据，跟hashmap不一样
    if (value == null)
        throw new NullPointerException();
    int hash = hash(key); //取key的hashcode再来一次hash，2次hash打撒分布，避免冲突
    int j = (hash >>> segmentShift) & segmentMask; //nb的处理，获取hash后的key的存储位置，右偏移保留高位再&取具体的值
    if ((s = (Segment<K,V>)UNSAFE.getObject          // nonvolatile; recheck
         (segments, (j << SSHIFT) + SBASE)) == null) //  in ensureSegment
        s = ensureSegment(j); //只初始化了s0，这里确保segment存在
    return s.put(key, hash, value, false); //调用segment的put
}
//因为构造初始化的时候只初始化了s0，所以如果segment存储位置不为s0的时候，要确保位置不为空才行
private Segment<K,V> ensureSegment(int k) {
    final Segment<K,V>[] ss = this.segments;
    long u = (k << SSHIFT) + SBASE; // 偏移量的计算
    Segment<K,V> seg;
    if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) {
        Segment<K,V> proto = ss[0]; // s0不为空null，所以一些参数直接从s0获取
        int cap = proto.table.length;
        float lf = proto.loadFactor;
        int threshold = (int)(cap * lf);
        HashEntry<K,V>[] tab = (HashEntry<K,V>[])new HashEntry[cap]; //构造segment里面的table
        if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u))
            == null) { // recheck
            Segment<K,V> s = new Segment<K,V>(lf, threshold, tab);
            while ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u))
                   == null) { //cas操作保证存储位置一定设置成功
                if (UNSAFE.compareAndSwapObject(ss, u, null, seg = s))
                    break;
            }
        }
    }
    return seg;
}</span>
```

最重要的是int j = (hash >>> segmentShift) & segmentMask;这一个查找segment存储位置的，看构造函数这2个变量时怎么来的，再体会下二进制操作，想不佩服都不行，处理的真nb。其他没什么，就是查找后确认segment不会null，为null需要通过s0初始化一个，然后cas设置，最后调用segment的put操作。segment的代码最后看。

看下get操作：

```java
<span style="font-size:18px;">public V get(Object key) {
    Segment<K,V> s; // manually integrate access methods to reduce overhead
    HashEntry<K,V>[] tab;
    int h = hash(key);
    long u = (((h >>> segmentShift) & segmentMask) << SSHIFT) + SBASE;
    if ((s = (Segment<K,V>)UNSAFE.getObjectVolatile(segments, u)) != null &&
        (tab = s.table) != null) {
        for (HashEntry<K,V> e = (HashEntry<K,V>) UNSAFE.getObjectVolatile
                 (tab, ((long)(((tab.length - 1) & h)) << TSHIFT) + TBASE);
             e != null; e = e.next) {
            K k;
            if ((k = e.key) == key || (e.hash == h && key.equals(k)))
                return e.value;
        }
    }
    return null;
}</span>
```

get操作通过unsafe.getObjectVolatile操作来获取具体的值，也实现了volatile语义，避免并发操作时获取不到最新值。获取存储位置segment的语句long u = (((h >>> segmentShift) & segmentMask) << SSHIFT) + SBASE;这句是通过segment数组的首地址+偏移量来计算获得，获取segment位置后，再获取具体table的值，然后就是一些判断。关于首地址+偏移量那里的操作不明白的可以看看原子数组变量和unsafe的代码。

看下size():

```java
<span style="font-size:18px;">public int size() {
    // Try a few times to get accurate count. On failure due to
    // continuous async changes in table, resort to locking.
    final Segment<K,V>[] segments = this.segments;
    int size;
    boolean overflow; // true if size overflows 32 bits
    long sum;         // sum of modCounts
    long last = 0L;   // previous sum
    int retries = -1; // first iteration isn't retry
    try {
        for (;;) {
        	//这里是for循环3次后，如果没break，那就分别对segment加锁，然后再统计，如果之前segment有为null的，这里强制初始化
            if (retries++ == RETRIES_BEFORE_LOCK) {
                for (int j = 0; j < segments.length; ++j)
                    ensureSegment(j).lock(); // force creation
            }
            sum = 0L;
            size = 0;
            overflow = false;
            for (int j = 0; j < segments.length; ++j) {
                Segment<K,V> seg = segmentAt(segments, j);
                if (seg != null) {
                    sum += seg.modCount; //统计各个segment的结构变化次数
                    int c = seg.count; //统计各个segment的table元素数量
                    if (c < 0 || (size += c) < 0) //防止溢出
                        overflow = true;
                }
            }
            if (sum == last) //如果和上次统计结果一样就退出
                break;
            last = sum;
        }
    } finally {
    	//segment分别解锁
        if (retries > RETRIES_BEFORE_LOCK) {
            for (int j = 0; j < segments.length; ++j)
                segmentAt(segments, j).unlock();
        }
    }
    return overflow ? Integer.MAX_VALUE : size;
}
//getObjectVolatile获取segment的值
static final <K,V> Segment<K,V> segmentAt(Segment<K,V>[] ss, int j) {
    long u = (j << SSHIFT) + SBASE;
    return ss == null ? null :
        (Segment<K,V>) UNSAFE.getObjectVolatile(ss, u);
}</span>
```

大致流程是：3次for循环，如果有连续2次统计的segment的modCount(segment的table结构修改次数)sum结果相同，那就说明在此期间，concurrentHashMap没有变化，那就返回此时统计的size，如果第3次统计的结果跟第2次不一样，那么下一个循环就依次对各个segment加锁，如果segment为null那就创建，统计完再依次解锁。

最后看下segment的代码：

```java
<span style="font-size:18px;">//继承ReetrantLock实现每个segment一把锁
static final class Segment<K,V> extends ReentrantLock implements Serializable {
    private static final long serialVersionUID = 2249069246763182397L;
    /**
     * The maximum number of times to tryLock in a prescan before
     * possibly blocking on acquire in preparation for a locked
     * segment operation. On multiprocessors, using a bounded
     * number of retries maintains cache acquired while locating
     * nodes.
     */
    static final int MAX_SCAN_RETRIES =
        Runtime.getRuntime().availableProcessors() > 1 ? 64 : 1;
	//segment中table
    transient volatile HashEntry<K,V>[] table;
	//元素数量
    transient int count;
	//结构修改次数
    transient int modCount;
	//极限值
    transient int threshold;
	//负载因子
    final float loadFactor;
	/**
	之前ConcurrentHashMap初始化构造的创建s0，
	Segment<K,V> s0 =
            new Segment<K,V>(loadFactor, (int)(cap * loadFactor),
                             (HashEntry<K,V>[])new HashEntry[cap]);
	*/                             
    Segment(float lf, int threshold, HashEntry<K,V>[] tab) {
        this.loadFactor = lf;
        this.threshold = threshold;
        this.table = tab;
    }
	//之前的put操作找到segment具体位置后调用segment的put操作s.put(key, hash, value, false);
    final V put(K key, int hash, V value, boolean onlyIfAbsent) {
    	//首先尝试加锁，加锁失败则调用scanAndLockForPut自旋加锁
        HashEntry<K,V> node = tryLock() ? null :
            scanAndLockForPut(key, hash, value);
        V oldValue;
        try {
            HashEntry<K,V>[] tab = table;
            int index = (tab.length - 1) & hash;//在table中查找key对应的位置
            HashEntry<K,V> first = entryAt(tab, index); //unsafe调用获取table指定位置链表的值第一个值
            for (HashEntry<K,V> e = first;;) {
                if (e != null) { //链表存在就搜索链表看是否存在相同的，跟hashmap都一样
                    K k;
                    if ((k = e.key) == key ||
                        (e.hash == hash && key.equals(k))) {
                        oldValue = e.value;
                        if (!onlyIfAbsent) {
                            e.value = value;
                            ++modCount;
                        }
                        break;
                    }
                    e = e.next;
                }
                else {//不存在就新建一个，设置next
                    if (node != null)
                        node.setNext(first);
                    else
                        node = new HashEntry<K,V>(hash, key, value, first);
                    int c = count + 1;
                    if (c > threshold && tab.length < MAXIMUM_CAPACITY)
                        rehash(node); //超过极限值就rehash
                    else
                        setEntryAt(tab, index, node); //unsafe设置回去数组的对应位置的链表
                    ++modCount;
                    count = c;
                    oldValue = null;
                    break;
                }
            }
        } finally {
            unlock();
        }
        return oldValue;
    }
    /**
     * 把table长度*2，原节点和新节点都加入到新创建的table
     */
    @SuppressWarnings("unchecked")
    private void rehash(HashEntry<K,V> node) {        
        HashEntry<K,V>[] oldTable = table;
        int oldCapacity = oldTable.length;
        int newCapacity = oldCapacity << 1; //新table大小
        threshold = (int)(newCapacity * loadFactor); //新的极限值
        HashEntry<K,V>[] newTable =
            (HashEntry<K,V>[]) new HashEntry[newCapacity]; //创建新的table数组
        int sizeMask = newCapacity - 1; //计算具体位置时用，跟hashmap计算方式一样
        for (int i = 0; i < oldCapacity ; i++) { //循环oldtable
            HashEntry<K,V> e = oldTable[i];
            if (e != null) {
                HashEntry<K,V> next = e.next;
                int idx = e.hash & sizeMask; 
                if (next == null)   //  只有一个节点，直接移过去
                    newTable[idx] = e;
                else { // 节点重用
                    HashEntry<K,V> lastRun = e;
                    int lastIdx = idx;
                    //下面2个for循环的逻辑是lastRun，last从next节点往后移，最后lastRun指向最后一个转移到新table的index不变的节点
                    //比较乱，画图走几遍，意思就是说假如原来的table[1]有10个节点，然后不停计算节点在newtable的位置，很可能从第四个节点的时候开始，
                    //后面的所有节点在newtable中的存储位置都一样了，那么我newtable只要把第4个节点直接放过去就行，然后从链表头开始处理其他节点，
                    //就不用把所有节点都新建一遍了
                    for (HashEntry<K,V> last = next;
                         last != null;
                         last = last.next) {
                        int k = last.hash & sizeMask;
                        if (k != lastIdx) {
                            lastIdx = k;
                            lastRun = last;
                        }
                    }
                    newTable[lastIdx] = lastRun; //直接lastRun设置到newtable
                    // 复制其他节点
                    for (HashEntry<K,V> p = e; p != lastRun; p = p.next) {
                        V v = p.value;
                        int h = p.hash;
                        int k = h & sizeMask;
                        HashEntry<K,V> n = newTable[k];
                        newTable[k] = new HashEntry<K,V>(h, p.key, v, n);
                    }
                }
            }
        }
        int nodeIndex = node.hash & sizeMask; // 把新节点加入到newtable
        node.setNext(newTable[nodeIndex]);
        newTable[nodeIndex] = node;
        table = newTable;
    }
    /**
     * 自旋尝试加锁，不成功扫描对应位置的链表，如果链表中key不存在就创建一个node，达到最大次数后就阻塞加锁，如果key存在返回的null
     * 处理过程中其他线程改变了链表结构，那就重头再来
     */
    private HashEntry<K,V> scanAndLockForPut(K key, int hash, V value) {
        HashEntry<K,V> first = entryForHash(this, hash);
        HashEntry<K,V> e = first;
        HashEntry<K,V> node = null;
        int retries = -1; // negative while locating node
        while (!tryLock()) {
            HashEntry<K,V> f; // to recheck first below
            if (retries < 0) {
                if (e == null) { //基本就是查找key不存在就创建一个,存在就trylock一直到次数限制，再不行就阻塞加锁
                    if (node == null) 
                        node = new HashEntry<K,V>(hash, key, value, null);
                    retries = 0;
                }
                else if (key.equals(e.key))
                    retries = 0;
                else
                    e = e.next;
            }
            else if (++retries > MAX_SCAN_RETRIES) { //超过最大尝试次数，那么就lock阻塞，单核1，多核64
                lock();
                break;
            }
            else if ((retries & 1) == 0 &&
                     (f = entryForHash(this, hash)) != first) { //隔一次检查一遍尝试的时候发现链表的首节点变化了，也就是有别的线程操作了，那就重来
                e = first = f; // re-traverse if entry changed
                retries = -1;
            }
        }
        return node;
    }
    /**
     跟这个差不多scanAndLockForPut，没有返回，要买trylock成功，要买阻塞lock
     */
    private void scanAndLock(Object key, int hash) {
        // similar to but simpler than scanAndLockForPut
        HashEntry<K,V> first = entryForHash(this, hash);
        HashEntry<K,V> e = first;
        int retries = -1;
        while (!tryLock()) {
            HashEntry<K,V> f;
            if (retries < 0) {
                if (e == null || key.equals(e.key))
                    retries = 0;
                else
                    e = e.next;
            }
            else if (++retries > MAX_SCAN_RETRIES) {
                lock();
                break;
            }
            else if ((retries & 1) == 0 &&
                     (f = entryForHash(this, hash)) != first) {
                e = first = f;
                retries = -1;
            }
        }
    }
    /**
     * Remove; match on key only if value null, else match both.
     */
    final V remove(Object key, int hash, Object value) {
        if (!tryLock())
            scanAndLock(key, hash);
        V oldValue = null;
        try {
            HashEntry<K,V>[] tab = table;
            int index = (tab.length - 1) & hash;
            HashEntry<K,V> e = entryAt(tab, index);
            HashEntry<K,V> pred = null;
            while (e != null) {
                K k;
                HashEntry<K,V> next = e.next;
                if ((k = e.key) == key ||
                    (e.hash == hash && key.equals(k))) {
                    V v = e.value;
                    if (value == null || value == v || value.equals(v)) {
                        if (pred == null)
                            setEntryAt(tab, index, next);
                        else
                            pred.setNext(next);
                        ++modCount;
                        --count;
                        oldValue = v;
                    }
                    break;
                }
                pred = e;
                e = next;
            }
        } finally {
            unlock();
        }
        return oldValue;
    }
    final boolean replace(K key, int hash, V oldValue, V newValue) {
        if (!tryLock())
            scanAndLock(key, hash);
        boolean replaced = false;
        try {
            HashEntry<K,V> e;
            for (e = entryForHash(this, hash); e != null; e = e.next) {
                K k;
                if ((k = e.key) == key ||
                    (e.hash == hash && key.equals(k))) {
                    if (oldValue.equals(e.value)) {
                        e.value = newValue;
                        ++modCount;
                        replaced = true;
                    }
                    break;
                }
            }
        } finally {
            unlock();
        }
        return replaced;
    }
    final V replace(K key, int hash, V value) {
        if (!tryLock())
            scanAndLock(key, hash);
        V oldValue = null;
        try {
            HashEntry<K,V> e;
            for (e = entryForHash(this, hash); e != null; e = e.next) {
                K k;
                if ((k = e.key) == key ||
                    (e.hash == hash && key.equals(k))) {
                    oldValue = e.value;
                    e.value = value;
                    ++modCount;
                    break;
                }
            }
        } finally {
            unlock();
        }
        return oldValue;
    }
    final void clear() {
        lock();
        try {
            HashEntry<K,V>[] tab = table;
            for (int i = 0; i < tab.length ; i++)
                setEntryAt(tab, i, null);
            ++modCount;
            count = 0;
        } finally {
            unlock();
        }
    }
}
@SuppressWarnings("unchecked")
static final <K,V> HashEntry<K,V> entryAt(HashEntry<K,V>[] tab, int i) {
    return (tab == null) ? null :
        (HashEntry<K,V>) UNSAFE.getObjectVolatile
        (tab, ((long)i << TSHIFT) + TBASE);
}
/**
 * Sets the ith element of given table, with volatile write
 * semantics. (See above about use of putOrderedObject.)
 */
static final <K,V> void setEntryAt(HashEntry<K,V>[] tab, int i,
                                   HashEntry<K,V> e) {
    UNSAFE.putOrderedObject(tab, ((long)i << TSHIFT) + TBASE, e);
}</span>
```

总结：

**1、** 大量使用了unsafe中方法，这个需要去了解unsafe，很重要；

**2、** segment使用了Reentrantlock实现分段锁来保证put的线程安全，get使用unsafe.getobjectvolatile来保证可见性；

**3、** 不容许key/value为null；

**4、** ConcurrentHashMap的get，clear，iterator（entrySet、keySet、values方法）可能存在弱一致性问题，关于这个，还要学习；
