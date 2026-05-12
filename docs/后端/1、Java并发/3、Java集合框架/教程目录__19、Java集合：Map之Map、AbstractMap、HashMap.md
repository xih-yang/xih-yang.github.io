# 19、Java集合：Map之Map、AbstractMap、HashMap
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/19.html
- 分类：Java并发
- 分组：教程目录
Map结构图

## Map

> public interface Map

**1、** 将键映射到值的对象一个映射不能包含重复的键；每个键最多只能映射到一个值；

**2、** 此接口取代Dictionary类，后者完全是一个抽象类，而不是一个接口；

**3、** Map接口提供三种collection视图，允许以键集、值集或键-值映射关系集的形式查看某个映射的内容；

**4、** 键注意其自身equals和hashCode方法；

嵌套类

```java
interface Entry<K,V> {
    /**
	 * 返回Key
	 */
	K getKey();
    /**
	 * 返回value
	 */
	V getValue();
    /**
	 * 特定值value
     */
	V setValue(V value);
	/**
	 * 比较entry是否相同
     */
	boolean equals(Object o);
	/**
	 * 返回entry的哈希码
	 */
	int hashCode();
}
```

接口定义方法

## AbstractMap

> public abstract class AbstractMap implements Map

**1、** 提供Map接口的主要实现，最大限度减少实现此接口的Map所需的工作；

该抽象类为子类提供了Map接口的接口方法默认实现，子类可根据需要覆写父类方法，除了两个方法没提供默认实现。

要实现可修改的映射，编程人员必须另外重写此类的 put 方法。

```java
public V put(K key, V value) {
    throw new UnsupportedOperationException();
}
```

## HashMap

> public class HashMap extends AbstractMap implements Map ,Cloneable, Serializable

**1、** 基于哈希表的Map接口的实现；

**2、** 允许使用null值和null键；

**3、** HashMap的实例有两个参数影响其性能：初始容量(默认16)和加载因子(默认0.75)；

**4、** 此实现不是同步的，fail-fast；

成员变量

```java
/**
 * 默认初始容量
 */
static final int DEFAULT_INITIAL_CAPACITY = 16;
/**
 * 最大容量
 */
static final int MAXIMUM_CAPACITY = 1 << 30;
/**
 * 默认加载因子
 */
static final float DEFAULT_LOAD_FACTOR = 0.75f;
/**
 * key-value组成Entry存入该数组中
 */
transient Entry[] table;
/**
 * key-value键值对数
 */
transient int size;
/**
 *  当size达到该值时即capacity * load factor，再rehash
 */
int threshold;
/**
 * 加载因子
 */
final float loadFactor;
/**
 * 被修改次数
 */
transient volatile int modCount;
/**
 * 此映射所包含的映射关系的 Set 视图。
 */
private transient Set<Map.Entry<K,V>> entrySet = null;
```

构造方法

```java
/**
 *  构造一个具有默认初始容量 (16) 和默认加载因子 (0.75) 的空 HashMap。
 */
public HashMap() {
    this.loadFactor = DEFAULT_LOAD_FACTOR;
    threshold = (int)(DEFAULT_INITIAL_CAPACITY * DEFAULT_LOAD_FACTOR);
    table = new Entry[DEFAULT_INITIAL_CAPACITY];
    init();
}
void init() {
}
```

内部类Entry成员变量

```java
static class Entry<K,V> implements Map.Entry<K,V> {
    final K key;
    V value;
    Entry<K,V> next;//哈希地址相同的，通过链表链接，即链地址法解决哈希冲突
    final int hash;
}
```

常用方法

> Vput(K key, V value)： 在此映射中关联指定值与指定键。

```java
public V put(K key, V value) {
    if (key == null)
        return putForNullKey(value);//null 专门存入到table[0]
    int hash = hash(key.hashCode());//再哈希
    int i = indexFor(hash, table.length);//根据哈希码机及数组长度计算索引
    //循环对应的table[i]的链表，若key已存在且哈希码相同则替换value
    for (Entry<K,V> e = table[i]; e != null; e = e.next) {
        Object k;
        if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
            V oldValue = e.value;
            e.value = value;
            e.recordAccess(this);
            return oldValue;
        }
    }
    modCount++;//修改次数+1
    addEntry(hash, key, value, i);//存入到指定位置
    return null;
}
/**
 * 存入key为null的value
 */
private V putForNullKey(V value) {
    //key==null的专门放到table[0]中,但也补排除别的键hash地址一样
    for (Entry<K,V> e = table[0]; e != null; e = e.next) {
        if (e.key == null) {//找到对应key，替换value
            V oldValue = e.value;
            e.value = value;
            e.recordAccess(this);
            return oldValue;
        }
    }
    modCount++;//修改次数+1
    addEntry(0, null, value, 0);、、
    return null;
}
/**
 * 以hash, key, value创建新entry并放入到table的指定位置
 */
void addEntry(int hash, K key, V value, int bucketIndex) {
    Entry<K,V> e = table[bucketIndex];//获取对应索引entry
    table[bucketIndex] = new Entry<K,V>(hash, key, value, e);//table[bucketIndex]存入的是一个链表
    if (size++ >= threshold)
        resize(2 * table.length);//元素已到阀值，再扩容
}
/**
 * 两倍扩容，并进行table转化
 */
void resize(int newCapacity) {/
    Entry[] oldTable = table;
    int oldCapacity = oldTable.length;
    if (oldCapacity == MAXIMUM_CAPACITY) {//已到最大值，更新加载因子,不允许扩容
        threshold = Integer.MAX_VALUE;
        return;
    }
    Entry[] newTable = new Entry[newCapacity];
    transfer(newTable);
    table = newTable;
    threshold = (int)(newCapacity * loadFactor);//更新扩容阀值
}
/**
 * 转移当前全部 entries 到 newTable.
 * 转移过程中，每个entry会重新计算在newTable的index，并存入
 */
void transfer(Entry[] newTable) {
    Entry[] src = table;
    int newCapacity = newTable.length;
    for (int j = 0; j < src.length; j++) {
        Entry<K,V> e = src[j];
        if (e != null) {
            src[j] = null;
            do {
                Entry<K,V> next = e.next;
                int i = indexFor(e.hash, newCapacity);
                e.next = newTable[i];
                newTable[i] = e;
                e = next;
            } while (e != null);
        }
    }
}
/**
 * 计算并返回哈希码的index
 */
static int indexFor(int h, int length) {
    return h & (length-1);
}
```

> Vget(Object key)： 返回指定键所映射的值；如果对于该键来说，此映射不包含任何映射关系，则返回 null。

```java
public V get(Object key) {
    if (key == null)
        return getForNullKey();
    int hash = hash(key.hashCode());//再哈希
    //循环对应table[indexFor(hash, table.length)]的链表
    for (Entry<K,V> e = table[indexFor(hash, table.length)];
         e != null;
         e = e.next) {
        Object k;
        //Entry哈希码相同且key相同，映射关系存在，返回对应value
        if (e.hash == hash && ((k = e.key) == key || key.equals(k)))
            return e.value;
    }
    return null;
}
//从table[0]中找出NullKey的映射关系，并返回对应value
private V getForNullKey() {
    for (Entry<K,V> e = table[0]; e != null; e = e.next) {
        if (e.key == null)
            return e.value;
    }
    return null;
}
```

> Vremove(Object key)： 从此映射中移除指定键的映射关系（如果存在）。

```java
public V remove(Object key) {
    Entry<K,V> e = removeEntryForKey(key);
    return (e == null ? null : e.value);
}
final Entry<K,V> removeEntryForKey(Object key) {
    int hash = (key == null) ? 0 : hash(key.hashCode());//计算哈希码
    int i = indexFor(hash, table.length);//计算table对应index
    Entry<K,V> prev = table[i];
    Entry<K,V> e = prev;
    while (e != null) {
        Entry<K,V> next = e.next;
        Object k;
        //Entry哈希码相同，key相同 找到对应的映射关系
        if (e.hash == hash && 
            ((k = e.key) == key || (key != null && key.equals(k)))) {
            modCount++;//修改次数+1
            size--;//映射关系数-1
            if (prev == e)//table[i]和链表头部是同一个entry
                table[i] = next;//下一个entry前移
            else
                prev.next = next;//下一个entry前移
            e.recordRemoval(this);
            return e;
        }
        //没有找到对应映射关系，继续找下一个节点
        prev = e;
        e = next;
    }
    return e;
}
```

HashMap总结：

**1、** 默认初始容量16和默认加载因子0.75，当key-value个数达到初始容量*加载因子时，会现有容量2倍扩容，且容量达到1<<30时，不再扩容扩容时会newTable，重新计算每个Entry在newTable的索引，并存入到对应位置，从而将oldTable中全部转移Entry到newTable中扩容时，在多线程中可能产生条件竞争，从而产生死循环，故避免在多线程中使用HashMap；

**2、** 采用数组+链表结构存储元素，链地址法解决哈希冲突；

**3、** 当Entry哈希码和key同时相等，才能确定key已存在或找到对应key的entry；

**4、** entrySet方法已经返回了key-value映射关系，不要用keySet方法；

**5、** 允许使用null值和null键；

jdk1.8优化：

**1、** 采用数组+链表+红黑树结构提高了查找性能当哈希桶中元素达到TREEIFY_THRESHOLD=8时，由链表转换为红黑树TreeNode少于8时，又会转换为链表结构；
