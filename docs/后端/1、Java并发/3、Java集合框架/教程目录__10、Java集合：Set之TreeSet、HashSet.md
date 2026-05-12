# 10、Java集合：Set之TreeSet、HashSet
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/10.html
- 分类：Java并发
- 分组：教程目录
## TreeSet

> public class TreeSet extends AbstractSet implements NavigableSet, Cloneable, Serializable

- 基于 TreeMap 的 NavigableSet 实现。
- 使用元素的自然顺序对元素进行排序(Comparable)。
- 或者根据创建 set 时提供的 Comparator 进行排序，具体取决于使用的构造方法。
- 非同步，fail-fast。
- 为基本操作（add、remove 和 contains）提供受保证的 log(n) 时间开销。

成员变量

```java
//容器中元素以key形式存入TreeMap实例m中
private transient NavigableMap<E, Object> m;
//PRESENT以value形式存入TreeMap实例m的每个key中
private static final Object PRESENT = new Object();
```

构造方法：

```java
TreeSet(NavigableMap<E, Object> paramNavigableMap) {
	this.m = paramNavigableMap;
}
/**
 *构造一个新的空 set，该 set 根据其元素的自然顺序进行排序。
 */
public TreeSet() {
	this(new TreeMap());
}
/**
 *构造一个新的空 TreeSet，它根据指定比较器进行排序。
 */
 public TreeSet(Comparator<? super E> comparator) {
	this(new TreeMap<>(comparator));
}
/**
 *构造一个包含指定 collection 元素的新TreeSet，它按照其元素的自然顺序进行排序。
 */
public TreeSet(Collection<? extends E> c) {
	addAll(c);
}
/**
 * 构造一个与指定有序 set 具有相同映射关系和相同排序的新 TreeSet。
 */
public TreeSet(SortedSet<E> s) {
	this(s.comparator());
	addAll(s);
 }
```

常用方法

> boolean add(E e)：将指定的元素添加到此 set（如果该元素尚未存在于 set 中）。

```java
public boolean add(E e) {
	//元素存入TreeMap中，元素为key，PRESENT为value
	return (this.m.put(e, PRESENT) == null);
}
```

> Iterator iterator():返回在此 set 中的元素上按升序进行迭代的迭代器。

```java
public Iterator<E> iterator() {
	return this.m.navigableKeySet().iterator();
}
```

> boolean remove(Object o):将指定的元素从 set 中移除（如果该元素存在于此 set 中）。

```java
public boolean remove(Object o) {
	//通过TreeMap移除元素，并与value值进行比对，判断元素是否存在
	return (this.m.remove(o)) == PRESENT;
}
```

> void clear()：移除此 set 中的所有元素。

```java
public void clear() {
	//通过TreeMap实现clear
	this.m.clear();
}
```

由源码可知，TreeSet对元素的操作均是基于TreeMap的，TreeMap是基于红黑树（Red-Black tree）有序存储，适用于排序场景。

## HashSet

> public class HashSet extends AbstractSet implements Set, Cloneable, Serializable

- 基于哈希表(HashMap)实现。
- 元素存储无序，且再哈希时，元素位置可能会变。
- 允许使用 null 元素。
- 非同步，fail-fast。

成员变量：

```java
//元素均存入HashMap的实例m中
private transient HashMap<E,Object> map;
//作为实例m每个key的value
private static final Object PRESENT = new Object();
```

构造方法(四个)：

```java
/**
 *   构造一个新的空 set，其底层HashMap 实例的默认初始容量是16，加载因子是0.75。
 */	
public HashSet() {
	map = new HashMap<E,Object>();
}
/**
 *   构造一个包含指定 collection 中的元素的新 set
 */	
public HashSet(Collection<? extends E> c) {
	map = new HashMap<E,Object>(Math.max((int) (c.size()/.75f) + 1, 16));
	addAll(c);
}
/**
 *   构造一个新的空 set，其底层 HashMap 实例具有指定的初始容量和默认的加载因子（0.75）。
 */	
public HashSet(int initialCapacity) {
	map = new HashMap<E,Object>(initialCapacity);
}
/**
 *   构造一个新的空 set，其底层 HashMap 实例具有指定的初始容量和指定的加载因子。
 */	
public HashSet(int initialCapacity, float loadFactor) {
	map = new HashMap<E,Object>(initialCapacity, loadFactor);
}
```

常用方法：

> boolean add(E e)：如果此 set 中尚未包含指定元素，则添加指定元素。

```java
public boolean add(E e) {
	//元素为key,PRESENT作为value存入HashMap中
	return map.put(e, PRESENT)==null;
}
```

> void clear():从此 set 中移除所有元素。

```java
public void clear() {
	map.clear();
}
```

> boolean remove(Object o):如果指定元素存在于此 set 中，则将其移除。

```java
public boolean remove(Object o) {
	//通过hashMap移除元素，并匹配value值，判断set是否包含指定元素o
	return map.remove(o) == PRESENT;
}
```

> Iterator iterator()：返回对此 set 中元素进行迭代的迭代器。返回元素的顺序并不是特定的。

```java
public Iterator<E> iterator() {
	return map.keySet().iterator();
}
```

> boolean contains(Object o)：如果此 set 包含指定元素，则返回 true。

```java
public boolean contains(Object o) {
	return map.containsKey(o);
}
```

由源码可知，HashSet对元素的操作均基于HashMap，基于hash算法，适用于快速查找场景。
