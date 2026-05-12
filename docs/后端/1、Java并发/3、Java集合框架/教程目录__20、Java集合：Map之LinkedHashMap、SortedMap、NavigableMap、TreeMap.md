# 20、Java集合：Map之LinkedHashMap、SortedMap、NavigableMap、TreeMap
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/20.html
- 分类：Java并发
- 分组：教程目录
## LinkedHashMap

> public class LinkedHashMap extends HashMap implements Map

**1、** Map接口的哈希表和链接列表实现，具有可预知的迭代顺序；

**2、** 不是同步的，fail-fast；

**3、** 允许nullkeyorvalue；

**4、** 继承HashMap，LinkedHashMap保证Map有序(插入顺序、访问顺序)；

**成员变量**

```java
/**
 * 双重链接列表头节点
 */
private transient Entry<K,V> header;
/**
 * 该linked hash map的排序方式
 * 排序模式 - 对于访问顺序，为 true；对于插入顺序，则为 false
 */
private final boolean accessOrder;
```

LinkedHashMap重新定义了内部类Entry，实现双向链表。

```java
/**
 * LinkedHashMap entry.
 */
private static class Entry<K,V> extends HashMap.Entry<K,V> {
    //用于实现双向链表
    Entry<K,V> before, after;
}
```

**构造方法**

```java
public LinkedHashMap(int initialCapacity,
         float loadFactor, boolean accessOrder) {
    super(initialCapacity, loadFactor);
    this.accessOrder = accessOrder;
}
```

有源码看出，LinkedHashMap构造方法调用父类HashMap构造方法，再调用LinkedHashMap覆写的init方法，从而实现双重链表初始化。

```java
void init() {
    header = new Entry<K,V>(-1, null, null, null);
    header.before = header.after = header;
}
```

**put方法**

> LinkedHashMap并未重写HashMap.put方法。而是重写了父类HashMap.put方法中void addEntry(int hash, K key, V value, int bucketIndex) 和void createEntry(int hash, K key, V value, int bucketIndex)，提供了双重链表的实现。

```java
void addEntry(int hash, K key, V value, int bucketIndex) {
    createEntry(hash, key, value, bucketIndex);
    Entry<K,V> eldest = header.after;
    if (removeEldestEntry(eldest)) {
        removeEntryForKey(eldest.key);
    } else {
        if (size >= threshold)
            resize(2 * table.length);
    }
}
void createEntry(int hash, K key, V value, int bucketIndex) {
    HashMap.Entry<K,V> old = table[bucketIndex];
    Entry<K,V> e = new Entry<K,V>(hash, key, value, old);
    table[bucketIndex] = e;
    e.addBefore(header);
    size++;
}
```

**get方法**

> LinkedHashMap覆写了父类的get方法，区别在于，査找到对应元素后，若accessOrder为true时，更新访问顺序，即将最新访问元素移到链表头部，并，即LRU算法思想，可用做LRU缓存。accessOrder为false时，因其迭代顺序即为默认插入顺序，故不用做额外变动。
>
> 注意accessOrder为true时：迭代顺序为从近期访问最少到近期访问最多的顺序。
>
> 例如key插入顺序：1，2，3。get(2)之后，map迭代顺序顺序为：1，3，2。

```java
public V get(Object key) {
    //调用父类HashMap.getEntry方法，获取对应entry
    Entry<K,V> e = (Entry<K,V>)getEntry(key);
    if (e == null)
        return null;
    e.recordAccess(this);
    return e.value;//返回值
}
 void recordAccess(HashMap<K,V> m) {
        LinkedHashMap<K,V> lm = (LinkedHashMap<K,V>)m;
        if (lm.accessOrder) {//访问模式，更新访问顺序，LRU
            lm.modCount++;
            remove();
            addBefore(lm.header);
        }
    }
```

LinkedHashMap继承HashMap，拥有其特性，重新定义Entry从而增加了双重链表特性。提供两种排序方式：访问顺序、插入顺序。

## SortedMap

> public interface SortedMap extends Map

**1、** 进一步提供关于键的总体排序的Map；

**2、** 键的自然排序可由Comparable或Comparator方式实现；

## NavigableMap

> public interface NavigableMap extends SortedMap

**1、** 扩展的SortedMap，具有了针对给定搜索目标返回最接近匹配项的导航方法；

**2、** 可以按照键的升序或降序访问和遍历NavigableMap；

## TreeMap

> public class TreeMap extends AbstractMap implements NavigableMap, Cloneable, java.io.Serializable

**1、** 基于红黑树（Red-Blacktree）的NavigableMap实现；

**2、** 该映射根据其键的自然顺序进行排序，或者根据创建映射时提供的Comparator进行排序，具体取决于使用的构造方法；

**3、** 不是同步的,fail-fast；

**成员变量**

```java
/**
 * 自然排序比较器
 */
private final Comparator<? super K> comparator;
//根节点
private transient Entry<K,V> root = null;
/**
 * key-value 映射对数
 */
private transient int size = 0;
/**
 * 树的修改次数
 */
private transient int modCount = 0;
```

**构造方法**

```java
/**
 * 使用键的自然顺序构造一个新的、空的树映射。
 */
public TreeMap() {
    comparator = null;
}
/**
 * 构造一个与指定有序映射具有相同映射关系和相同排序顺序的新的树映射。
 */
public TreeMap(SortedMap<K, ? extends V> m) {
    comparator = m.comparator();
    try {
        buildFromSorted(m.size(), m.entrySet().iterator(), null, null);
    } catch (java.io.IOException cannotHappen) {
    } catch (ClassNotFoundException cannotHappen) {
    }
}
```

百度百科解释红黑树：

**1、** 红黑树（RedBlackTree）是一种自平衡二叉查找树，是在计算机科学中用到的一种数据结构，典型的用途是实现关联数组；

**2、** 红黑树和AVL树类似，都是在进行插入和删除操作时通过特定操作保持二叉查找树的平衡，从而获得较高的查找性能；

**3、** 它虽然是复杂的，但它的最坏情况运行时间也是非常良好的，并且在实践中是高效的：它可以在O(logn)时间内做查找，插入和删除，这里的n是树中元素的数目；

TreeMap基于红黑树，Map有序，适用于查找搜索场景。
