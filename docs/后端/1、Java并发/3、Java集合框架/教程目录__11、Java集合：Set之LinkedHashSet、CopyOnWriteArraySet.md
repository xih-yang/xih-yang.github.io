# 11、Java集合：Set之LinkedHashSet、CopyOnWriteArraySet
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/11.html
- 分类：Java并发
- 分组：教程目录
## LinkedHashSet

> public class LinkedHashSet extends HashSet implements Set, Cloneable, Serializable

**1、** 具有可预知迭代顺序的Set接口的哈希表和链接列表实现；

**2、** 迭代顺序，即按照将元素插入到set中的顺序（插入顺序）进行迭代；

**3、** 非同步，fail-fast；

**4、** 继承HashSet；

构造方法

```java
/**
 * 构造一个带默认初始容量 (16) 和加载因子 (0.75) 的新空链接哈希 set。
 */
public LinkedHashSet() {
	super(16, .75f, true);
}
/**
 *  构造一个与指定 collection 中的元素相同的新链接哈希 set。
 */
public LinkedHashSet(Collection<? extends E> c) {
	super(Math.max(2*c.size(), 11), .75f, true);
    addAll(c);
}
/**
 * 构造一个带指定初始容量和默认加载因子 (0.75) 的新空链接哈希 set。
 */
public LinkedHashSet(int initialCapacity) {
	super(initialCapacity, .75f, true);
}
/**
 * 构造一个带有指定初始容量和加载因子的新空链接哈希 set。
 */
public LinkedHashSet(int initialCapacity, float loadFactor) {
	super(initialCapacity, loadFactor, true);
}
```

LinkedHashSet源码中只有四个构造方法，无其它成员变量或成员方法。

而构造方法均调用父类：super(initialCapacity, loadFactor, true);

```java
HashSet(int initialCapacity, float loadFactor, boolean dummy) {
	map = new LinkedHashMap<E,Object>(initialCapacity, loadFactor);
 }
```

由此可知，LinkedHashSet是基于LinkedHashMap实现的。

## CopyOnWriteArraySet

> public class CopyOnWriteArraySet extends AbstractSet implements Serializable

**1、** 对其所有操作使用内部CopyOnWriteArrayList的Set；

**2、** 最适合于具有以下特征的应用程序：set大小通常保持很小，只读操作远多于可变操作，需要在遍历期间防止线程间的冲突；

**3、** 是线程安全的；

**4、** 因为通常需要复制整个基础数组，所以可变操作（add、set和remove等等）的开销很大；

**5、** 迭代器不支持可变remove操作；

**6、** 使用迭代器进行遍历的速度很快，并且不会与其他线程发生冲突在构造迭代器时，迭代器依赖于不变的数组快照；

**7、** CopyOnWrite，读写分离；

成员变量

```java
private final CopyOnWriteArrayList<E> al;
```

构造方法

```java
/**
 * 创建一个空 set。
 */
public CopyOnWriteArraySet() {
	al = new CopyOnWriteArrayList<E>();
}
/**
 * 创建一个包含指定 collection 所有元素的 set。
 */
public CopyOnWriteArraySet(Collection<? extends E> c) {
   al = new CopyOnWriteArrayList<E>();
   al.addAllAbsent(c);
}
```

常用方法：

> boolean add(E e)：如果指定元素并不存在于此 set 中，则添加它。

```java
public boolean add(E e) {
	//如果e不存在al中，则添加
	return al.addIfAbsent(e);
}
```

> boolean remove(Object o)：如果指定元素存在于此 set 中，则将其移除。

```java
public boolean remove(Object o) {
	return al.remove(o);
}
```

> Iterator iterator()：返回按照元素添加顺序在此 set 中包含的元素上进行迭代的迭代器。

```java
public Iterator<E> iterator() {
	return al.iterator();
}
```

> boolean contains(Object o):如果此 set 包含指定元素，则返回 true。

```java
public boolean contains(Object o) {
	return al.contains(o);
}
```

由源码可知，对元素的操作均基于CopyOnWriteArrayList。至于CopyOnWriteArrayList前面文章中有讲解，这里不再做阐述。
