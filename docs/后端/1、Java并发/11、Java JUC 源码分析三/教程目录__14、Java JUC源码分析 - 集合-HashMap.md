# 14、Java JUC源码分析 - 集合-HashMap
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/14.html
- 分类：Java并发
- 分组：教程目录
在学习juc并发集合前先看了下HashMap，听说好多面试会问这个，没遇见过，学习下吧。学习的jdk源码一直都是1.7版本的，其他版本可能有些微不同，应该也不影响学习。

HashMap有几点需要记得吧：

**1、** 是非线程安全的：javadoc说明：可以通过Mapm=Collections.synchronizedMap(newHashMap(...));解决，或者干脆用juc里面ConcurrentHashMap；

**2、** 内部存储使用数组加链表的结构；

**3、** 容许使用null作为key和value；

HashMap使用数组加链表的结构解决hash冲突，大致结构为：

元素添加时计算出一个hash，然后算出在数组中位置，hash值相同的值再用链表来关联。

基本的变量：

```java
<span style="font-size:18px;">/**如果构造没传入初始化数组大小，这个就是默认数组大小 */
static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16
/** 最大容量*/
static final int MAXIMUM_CAPACITY = 1 << 30;
/** 构造的时候如果没有传入负载因子，就使用这个默认的，主要是控制整个数组的使用
假如构造的时候直接HashMap(),那么初始的时候数组大小就是16，这个0.75，所以整个数组你只能用12，然后你再put的时候就会扩容，新的大小大概是数组大小*2 */
static final float DEFAULT_LOAD_FACTOR = 0.75f;
/** 就是初始put，数组没有扩容的时候用来判断下 */
static final Entry<?,?>[] EMPTY_TABLE = {};
/** 这个就是HashMap内部的结构，一个Entry数组，大小最好为2的倍数 */
transient Entry<K,V>[] table = (Entry<K,V>[]) EMPTY_TABLE;
/** HashMap元素个数 */
transient int size;
/** 这个就是用来保存上面数组大小*负载因子的值，存储的极限值。数组为空的时候为初始容量大小，每次扩容的时候需要重新计算 */
int threshold;
/** 负载因子 */
final float loadFactor;
/** 修改次数，用于迭代时候检查HashMap有没有被增删 */
transient int modCount;
/** 系统启动后，获取配置的系统参数，计算hashseed时候用到 */
static final int ALTERNATIVE_HASHING_THRESHOLD_DEFAULT = Integer.MAX_VALUE;
private static class Holder {
    /**
     * Table capacity above which to switch to use alternative hashing.
     */
    static final int ALTERNATIVE_HASHING_THRESHOLD;
    static {
        String altThreshold = java.security.AccessController.doPrivileged(
            new sun.security.action.GetPropertyAction(
                "jdk.map.althashing.threshold"));
        int threshold;
        try {
            threshold = (null != altThreshold)
                    ? Integer.parseInt(altThreshold)
                    : ALTERNATIVE_HASHING_THRESHOLD_DEFAULT;
            // disable alternative hashing if -1
            if (threshold == -1) {
                threshold = Integer.MAX_VALUE;
            }
            if (threshold < 0) {
                throw new IllegalArgumentException("value must be positive integer.");
            }
        } catch(IllegalArgumentException failed) {
            throw new Error("Illegal value for 'jdk.map.althashing.threshold'", failed);
        }
        ALTERNATIVE_HASHING_THRESHOLD = threshold;
    }
}
/** 计算hashcode的使用随机数，初始化hashseed的时候，会看是否需要重新获取这个值，一般也不会 */
transient int hashSeed = 0;
</span>
```

再看下HashMap数组元素Entry的代码:

```java
<span style="font-size:18px;">static class Entry<K,V> implements Map.Entry<K,V> {
    final K key;
    V value;
    Entry<K,V> next; //链表结构，指向下一个Entry
    int hash; //计算出来的hashcode值
    /**
     * Creates new entry.
     */
    Entry(int h, K k, V v, Entry<K,V> n) {
        value = v;
        next = n;
        key = k;
        hash = h;
    }
    public final K getKey() {
        return key;
    }
    public final V getValue() {
        return value;
    }
    public final V setValue(V newValue) {
        V oldValue = value;
        value = newValue;
        return oldValue;
    }
    public final boolean equals(Object o) {
        if (!(o instanceof Map.Entry))
            return false;
        Map.Entry e = (Map.Entry)o;
        Object k1 = getKey();
        Object k2 = e.getKey();
        //判断实例是否相等或实例的key和value是否一样
        if (k1 == k2 || (k1 != null && k1.equals(k2))) {
            Object v1 = getValue();
            Object v2 = e.getValue();
            if (v1 == v2 || (v1 != null && v1.equals(v2)))
                return true;
        }
        return false;
    }
    public final int hashCode() {
        return Objects.hashCode(getKey()) ^ Objects.hashCode(getValue());
    }
    public final String toString() {
        return getKey() + "=" + getValue();
    }
    /** key值存在，再put的话调用LinkedHashMap用了  */
    void recordAccess(HashMap<K,V> m) {
    }
    /**
     * This method is invoked whenever the entry is
     * removed from the table.
     */
    void recordRemoval(HashMap<K,V> m) {
    }
}</span>
```

看完大致结构，再看下构造函数吧：

```java
<span style="font-size:18px;">public HashMap(int initialCapacity, float loadFactor) 
	//构造传入了初始容量和负载因子，下面校验2个值
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal initial capacity: " +
                                           initialCapacity);
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
        throw new IllegalArgumentException("Illegal load factor: " +
                                           loadFactor);
    this.loadFactor = loadFactor;
    threshold = initialCapacity; //极限值初始化为容量大小，后面put的时候才计算
    init(); //空方法，子类实现
}
public HashMap(int initialCapacity) {
    this(initialCapacity, DEFAULT_LOAD_FACTOR);
}
public HashMap() {
    this(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR);
}
/** 上面3个构造都没有初始化数组，留到了后面put的时候，这个根据其他map构造，就在初始化后直接扩容数组 */
public HashMap(Map<? extends K, ? extends V> m) {
    this(Math.max((int) (m.size() / DEFAULT_LOAD_FACTOR) + 1,
                  DEFAULT_INITIAL_CAPACITY), DEFAULT_LOAD_FACTOR);
    inflateTable(threshold); //数组扩容
    putAllForCreate(m); 
}</span>
```

构造的时候延迟初始化数组，只有根据其他Map构造的时候才扩容数组，然后放入新的值。接下来看下put和get方法。

put：

```java
<span style="font-size:18px;">public V put(K key, V value) 
	//table初始的时候是Empty的，在这里才会真正创建
    if (table == EMPTY_TABLE) {
        inflateTable(threshold); //扩容数组
    }
    if (key == null) //支持key为null的情况，放在table[0]
        return putForNullKey(value);
    int hash = hash(key);  //key不为null，计算hashcode
    int i = indexFor(hash, table.length); //查找在table中位置
	//for轮询指定位置的所有节点，检查新节点的key值是否存在，存在就替换value
    for (Entry<K,V> e = table[i]; e != null; e = e.next) {
        Object k;
        if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
            V oldValue = e.value;
            e.value = value;
            e.recordAccess(this);
            return oldValue;
        }
    }
    modCount++;
    addEntry(hash, key, value, i); //如果key不存在就加入到指定位置的第一个位置
    return null;
}
//将key为null的放在table[0]
private V putForNullKey(V value) {
	//for循环判断链表中是否存在相同key的Entry，如果有更新value，后面对于key不为null的Entry处理时也有这一步
    for (Entry<K,V> e = table[0]; e != null; e = e.next) {
        if (e.key == null) {
            V oldValue = e.value;
            e.value = value;
            e.recordAccess(this);
            return oldValue;
        }
    }
	//如果没有找到key相同的就要添加到链表里面
    modCount++;//table的结构有编号modeCount要自增
    addEntry(0, null, value, 0); //添加到链表里面
    return null;
}
//添加到链表里面
void addEntry(int hash, K key, V value, int bucketIndex) 
	//如果节点数量大于极限值并且位置已经使用了，需要重新初始化table，并将数据转移
    if ((size >= threshold) && (null != table[bucketIndex])) {
        resize(2 * table.length); //需要重新扩容table，并将原有的数据移到新的里面
        hash = (null != key) ? hash(key) : 0; //重新计算hash
        bucketIndex = indexFor(hash, table.length); //重新计算hash在table中的存储位置
    }
    createEntry(hash, key, value, bucketIndex);
}
//重构table，容量*2
void resize(int newCapacity) {
    Entry[] oldTable = table;
    int oldCapacity = oldTable.length;
    if (oldCapacity == MAXIMUM_CAPACITY) {
        threshold = Integer.MAX_VALUE;
        return;
    }
    Entry[] newTable = new Entry[newCapacity]; //新建table
    transfer(newTable, initHashSeedAsNeeded(newCapacity)); //将数据迁移
    table = newTable; //将table指向新创建的table
    threshold = (int)Math.min(newCapacity * loadFactor, MAXIMUM_CAPACITY + 1); //重新计算极限值
}
//将原table数据迁移到新创建的table，高并发的时候有问题
//假如原table[1]是e1->e2->e3
//假如运气好都迁移到新table的table[3]位置，迁移后的节点顺序为e3->e2->e1,后面画图说明
void transfer(Entry[] newTable, boolean rehash) {
    int newCapacity = newTable.length;
	//循环数组
    for (Entry<K,V> e : table) {
		//循环链表
        while(null != e) {
            Entry<K,V> next = e.next; //原table的next
            if (rehash) {
                e.hash = null == e.key ? 0 : hash(e.key);
            }
            int i = indexFor(e.hash, newCapacity); //重新计算在新table中位置
            e.next = newTable[i]; //将原table的节点的next指向新table指定位置的节点
            newTable[i] = e; //将新table指定位置的节点换成e
            e = next; //e指向原table的next
        }
    }
}
//计算key的hash值，说实话，没看懂hash算法，期待大神
final int hash(Object k) {
    int h = hashSeed; 
    if (0 != h && k instanceof String) {
        return sun.misc.Hashing.stringHash32((String) k);
    }
    h ^= k.hashCode();
    // This function ensures that hashCodes that differ only by
    // constant multiples at each bit position have a bounded
    // number of collisions (approximately 8 at default load factor).
    h ^= (h >>> 20) ^ (h >>> 12);
    return h ^ (h >>> 7) ^ (h >>> 4);
}
//计算key值hashcode在table数组中的位置
static int indexFor(int h, int length) {
	//这里的length就是table里数组的长度，最好为2的倍数，使用&实现数组轮询，
	//其实如果length为奇数的话，可以用h%length实现数组轮询,只不过%有除法运算，肯定有性能影响(之前看netty4，里面group.next()时候就2种都支持)，所以这里使用&
    return h & (length-1);
}
//创建新节点，并添加到table指定位置
void createEntry(int hash, K key, V value, int bucketIndex) {
    Entry<K,V> e = table[bucketIndex];
	//创建新的节点时，将原有位置的节点传入，这样新建节点的next指向原有节点，新添加的节点放到table指定位置的第一个
    table[bucketIndex] = new Entry<>(hash, key, value, e); 
    size++; //size自增
}
/** 扩容table */
private void inflateTable(int toSize) {
    // 计算>=toSize的2的倍数
    int capacity = roundUpToPowerOf2(toSize);
    threshold = (int) Math.min(capacity * loadFactor, MAXIMUM_CAPACITY + 1);//重新计算极限值
    table = new Entry[capacity];
    initHashSeedAsNeeded(capacity); //初始化hashseed
}
//这里就是就算>=number的2的倍数
private static int roundUpToPowerOf2(int number) {
	//比较是否超过最大容量，highestOneBit返回二进制数的左边高位1的位置，如1100，返回的则是1000
	//因此，如果你构造传入的2的倍数的话，减1后左移以为还是自己；
	//奇数的话就是，如15，就变成15->1101->1100->11000->10000->16，最后table的容量就是16
    return number >= MAXIMUM_CAPACITY
            ? MAXIMUM_CAPACITY
            : (number > 1) ? Integer.highestOneBit((number - 1) << 1) : 1;
}
//初始化hashseed，一般hashseed是0,如果扩容的时候配置系统参数比容量小，就会randomHashSeed计算
final boolean initHashSeedAsNeeded(int capacity) {
    boolean currentAltHashing = hashSeed != 0; //hashSeed默认是0，这个false
    boolean useAltHashing = sun.misc.VM.isBooted() &&
            (capacity >= Holder.ALTERNATIVE_HASHING_THRESHOLD); //这个在jvm启动后获取系统参数跟table容量比较
    boolean switching = currentAltHashing ^ useAltHashing;
    if (switching) {
        hashSeed = useAltHashing
            ? sun.misc.Hashing.randomHashSeed(this)
            : 0; //randomHashSeed计算不懂，百度了下，说在jdk7u40版本以下，高并发下，可能有性能影响，不过高并发也不会用HashMap了
    }
    return switching;
}</span>
```

get方法和transfer方法的具体等下次补充，休假先！

补充下get方法，get方法比较简单，get(key)，hash=hash(key)，然后在table里面查找index，找到index后循环对应位置的链表，找到相等的entry(通过hash和key判断相等)，返回找到entry，返回entry的value：

```java
<span style="font-size:18px;">public V get(Object key) {
    if (key == null)
        return getForNullKey();
    Entry<K,V> entry = getEntry(key);
    return null == entry ? null : entry.getValue();
}
//table[0]获取key为null的entry
private V getForNullKey() {
    if (size == 0) {
        return null;
    }
    for (Entry<K,V> e = table[0]; e != null; e = e.next) {
        if (e.key == null)
            return e.value;
    }
    return null;
}
//key不为null的情况获取entry
final Entry<K,V> getEntry(Object key) {
    if (size == 0) {
        return null;
    }
    int hash = (key == null) ? 0 : hash(key);
	//也是循环查找
    for (Entry<K,V> e = table[indexFor(hash, table.length)];
         e != null;
         e = e.next) {
        Object k;
        if (e.hash == hash &&
            ((k = e.key) == key || (key != null && key.equals(k))))
            return e;
    }
    return null;<span style="font-family: Arial, Helvetica, sans-serif;">}</span></span>
```

分析下多线程情况下transfer方法导致链表形成环形结构，然后get方法获取时for循环挂死。

**1、** 假如e1,e2两个entryhash后index相同，resize后也一样，正常结束后新的table结构为：；

**2、** 假如2个线程t1/t2，t1运行到transfer的Entrynext=e.next;线程挂起，t2运行结束，此时table为：；

t2运行结束，t1继续运行第一个循环，变为：

一次循环；t1在运行前：e指向e1，next指向e2，第一遍while循环结束，此时t1的table[1]指向e1，循环中的e由原来的e1->e2，next则因为之前的因为t2之前修改的原因变为e1；

二次循环：因为e指向e2不为null，再来一次循环，结束时：

三次循环：二次循环后e又指向了e1，由于此时的e->next为null，所以第三次循环后不再处理，循环后e1->next指向e2，e2->next指向e1：

最后将table指向将新创建的table，我们在put或get操作时都会for循环查找链表，如果这个链表正好是这个循环链表，那就会引发死循环。
