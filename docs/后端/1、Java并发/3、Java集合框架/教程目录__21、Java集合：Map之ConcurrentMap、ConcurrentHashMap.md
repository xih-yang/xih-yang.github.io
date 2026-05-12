# 21、Java集合：Map之ConcurrentMap、ConcurrentHashMap
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/21.html
- 分类：Java并发
- 分组：教程目录
## ConcurrentMap

> public interface ConcurrentMap extends Map

**1、** 提供其他原子putIfAbsent、remove、replace方法的Map；

**2、** 内存一致性效果：当存在其他并发collection时，将对象放入ConcurrentMap之前的线程中的操作happen-before随后通过另一线程从ConcurrentMap中访问或移除该元素的操作；

接口方法

```java
/**
 *  如果指定键已经不再与某个值相关联，则将它与给定值关联。
 */
V putIfAbsent(K key, V value);
/**
 *  只有目前将键的条目映射到给定值时，才移除该键的条目。
 */
boolean remove(Object key, Object value);
/**
 *  只有目前将键的条目映射到某一值时，才替换该键的条目。
 */
boolean replace(K key, V oldValue, V newValue);
/**
 *  只有目前将键的条目映射到给定值时，才替换该键的条目。
 */
V replace(K key, V value);
```

## ConcurrentHashMap

> public class ConcurrentHashMap extends AbstractMap implements ConcurrentMap, Serializable

**1、** 支持获取的完全并发和更新的所期望可调整并发的哈希表；

**2、** 不允许将null用作键或值；

**3、** 适用于读多写少场景；

成员变量

```java
/* ---------------- Constants -------------- */
/**
 * 默认初始容量
 */
static final int DEFAULT_INITIAL_CAPACITY = 16;
/**
 * 默认装载因子
 */
static final float DEFAULT_LOAD_FACTOR = 0.75f;
/**
 * 默认更新并发线程数
 */
static final int DEFAULT_CONCURRENCY_LEVEL = 16;
/**
 * 最大容量
 */
static final int MAXIMUM_CAPACITY = 1 << 30;
/**
 * SEGMENT最大个数
 */
static final int MAX_SEGMENTS = 1 << 16; // slightly conservative
/**
 * 锁之前重试次数
 */
static final int RETRIES_BEFORE_LOCK = 2;
/* ---------------- Fields -------------- */
/**
 * 段标记
 */
final int segmentMask;
/**
 * 段的偏移量
 */
final int segmentShift;
/**
 * 特殊table-段
 */
final Segment<K,V>[] segments;
transient Set<K> keySet;
transient Set<Map.Entry<K,V>> entrySet;
transient Collection<V> values;
/* ---------------- Small Utilities -------------- */
```

构造方法

```java
//创建一个带有默认初始容量 (16)、加载因子 (0.75) 和 concurrencyLevel (16) 的新的空映射。
ConcurrentHashMap() 
// 创建一个带有指定初始容量、默认加载因子 (0.75) 和 concurrencyLevel (16) 的新的空映射。          
ConcurrentHashMap(int initialCapacity) 
// 创建一个带有指定初始容量、加载因子和默认 concurrencyLevel (16) 的新的空映射。         
ConcurrentHashMap(int initialCapacity, float loadFactor) 
//创建一个带有指定初始容量、加载因子和并发级别的新的空映射。
ConcurrentHashMap(int initialCapacity, float loadFactor, int concurrencyLevel) 
//构造一个与给定映射具有相同映射关系的新映射。 
ConcurrentHashMap(Map<? extends K,? extends V> m) 
```

常用核心方法

> Vput(K key, V value) ：将指定键映射到此表中的指定值。键和值都不可以为 null。返回以前与 key 相关联的值，如果 key 没有映射关系，则返回 null。

```java
public V put(K key, V value) {
    if (value == null)
        throw new NullPointerException();//非空校验
    int hash = hash(key.hashCode());//再哈希
    return segmentFor(hash).put(key, hash, value, false);
}
```

> VputIfAbsent(K key, V value)：如果指定键已经不再与某个值相关联，则将它与给定值关联。返回以前与指定键相关联的值，如果该键没有映射关系，则返回 null。

```java
public V putIfAbsent(K key, V value) {
    if (value == null)
        throw new NullPointerException();
    int hash = hash(key.hashCode());
    return segmentFor(hash).put(key, hash, value, true);
}
```

> final Segment segmentFor(int hash)：根据哈希码计算对应的段segment。

```java
final Segment<K,V> segmentFor(int hash) {
    return segments[(hash >>> segmentShift) & segmentMask];
}
```

> Vput(K key, int hash, V value, boolean onlyIfAbsent)：Segment内部类方法。

```java
static final class Segment<K,V> extends ReentrantLock implements Serializable {
	V put(K key, int hash, V value, boolean onlyIfAbsent) {
            lock();//调用父类获取锁方法
            try {
                int c = count;
                if (c++ > threshold) // 判断是否需要扩容
                    rehash();
                HashEntry<K,V>[] tab = table;
                int index = hash & (tab.length - 1);//计算索引
                HashEntry<K,V> first = tab[index];//获取到对应的链表
                HashEntry<K,V> e = first;
                //遍历链表，获取到对应元素
                while (e != null && (e.hash != hash || !key.equals(e.key)))
                    e = e.next;
                V oldValue;
                if (e != null) {//已存在对应key-value
                    oldValue = e.value;
                    if (!onlyIfAbsent)//判断是否更新value
                        e.value = value;
                }
                else {//key首次put
                    oldValue = null;
                    ++modCount;//修改次数+1
                    tab[index] = new HashEntry<K,V>(key, hash, first, value);
                    count = c; // write-volatile
                }
                return oldValue;
            } finally {
                unlock();//释放锁
            }
        }
}
```

> Vremove(Object key)：从此映射中移除键（及其相应的值）。

```java
public V remove(Object key) {
    int hash = hash(key.hashCode());
    return segmentFor(hash).remove(key, hash, null);
}
```

> boolean remove(Object key, Object value)：只有目前将键的条目映射到给定值时，才移除该键的条目。

```java
public boolean remove(Object key, Object value) {
    int hash = hash(key.hashCode());
    if (value == null)
        return false;
    return segmentFor(hash).remove(key, hash, value) != null;
}
```

> Vremove(Object key, int hash, Object value)：Segment内部类方法。

```java
static final class Segment<K,V> extends ReentrantLock implements Serializable {
	 V remove(Object key, int hash, Object value) {
            lock();//获取锁
            try {
                int c = count - 1;
                HashEntry<K,V>[] tab = table;
                int index = hash & (tab.length - 1);
                HashEntry<K,V> first = tab[index];
                HashEntry<K,V> e = first;
                //找对应key-value
                while (e != null && (e.hash != hash || !key.equals(e.key)))
                    e = e.next;
                V oldValue = null;
                if (e != null) {//有对应key-value
                    V v = e.value;
                    if (value == null || value.equals(v)) {
                        oldValue = v;
                        ++modCount;//修改次数+1
                        HashEntry<K,V> newFirst = e.next;
                        //next由final修饰不可变，故移除的节点前所有元素均需要clone。
                        for (HashEntry<K,V> p = first; p != e; p = p.next)
                        newFirst = new HashEntry<K,V>(p.key, p.hash, newFirst, p.value);//                                                 
                        tab[index] = newFirst;
                        count = c; // write-volatile
                    }
                }
                return oldValue;
            } finally {
                unlock();
            }
        }
}
```

内部类HashEntry

由于key、value、及next均由final声明，故执行remvoe操作后，移除元素的前一个元素对应entry.next值应该变了，但由于final定义，导致不能再改变它，故将它之前的节点全都克隆一次。

```java
 static final class HashEntry<K,V> {
        final K key;
        final int hash;
        volatile V value;
        final HashEntry<K,V> next;
}
```

> Vget(Object key)：返回指定键所映射到的值，如果此映射不包含该键的映射关系，则返回 null。

```java
public V get(Object key) {
    int hash = hash(key.hashCode());
    return segmentFor(hash).get(key, hash);
}
```

> Vget(Object key, int hash) ：Segment内部方法。

```java
V get(Object key, int hash) {
    if (count != 0) { // read-volatile 有key-value
        HashEntry<K,V> e = getFirst(hash);//找到对应的链表，并返回头节点
        //遍历链表,找到对应键值对
        while (e != null) {
            if (e.hash == hash && key.equals(e.key)) {
                V v = e.value;
                if (v != null)
                    return v;
                return readValueUnderLock(e); // recheck
            }
            e = e.next;
        }
    }
    return null;
}
HashEntry<K,V> getFirst(int hash) {
    HashEntry<K,V>[] tab = table;
    return tab[hash & (tab.length - 1)];
}
```

总结：

**1、** ConcurrentHashMap采用分段锁设计(Segment)，默认初始将Map分为16段即Segment[]segments数组长度16，也可理解为写线程并发度为16；

**2、** SegmentextendsReentrantLock则每个分段Segment都拥有自己的ReentrantLock，减少锁竞争；

**3、** 如果并发度设置的过小，会带来严重的锁竞争问题；如果并发度设置的过大，原本位于同一个Segment内的访问会扩散到不同的Segment中，CPUcache命中率会下降，从而引起程序性能下降；

**4、** Segment中成员变量：transientvolatileintcount;表示对应Segment中key-value元素个数，当count==0时，get操作直接返回，避免不必要的査找开销；

**5、** Segment中有个重要成员变量：volatiletransientConcurrentHashMap.HashEntry[]table每个Segment中key-value都以HashEntry实例存入到该数组中，若有哈希冲突，HashEntry是个链表，以链地址法解决即将哈希地址相同的key，放入到同一个链表中；

## putor get or remove主要步骤：

**1、** 根据key的哈希码再哈希inthash=hash(key.hashCode())；

**2、** 根据新哈希码找到对应segmentsegmentFor(hash)；

**3、** 在对应segment中计算HashEntry的索引intindex=hash&(tab.length-1);；

**4、** 遍历对应HashEntry[]table的table[index]；

**5、** 匹配HashEntry的哈希码，及key，匹配成功进行对应操作；

## jdk1.8新变化：

**1、** Segment改为Node，锁住node来实现减小锁粒度；

**2、** synchronize替代了ReentrantLock；

**3、** 利用Unsafe的CAS，实现无锁化的修改值的操作；

**4、** Node中next去掉了final修饰，增加了violate修饰，避免了remove后clone问题；

**5、** 设计了MOVED状态当resize的中过程中线程2还在put数据，线程2会帮助resize；

**6、** 当链表节点大于等于8时，把链表节点包装成TreeNode放在TreeBin对象中，由TreeBin完成对红黑树的包装；
