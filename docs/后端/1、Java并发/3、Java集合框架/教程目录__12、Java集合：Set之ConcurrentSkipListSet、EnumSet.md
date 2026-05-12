# 12、Java集合：Set之ConcurrentSkipListSet、EnumSet
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/12.html
- 分类：Java并发
- 分组：教程目录
## ConcurrentSkipListSet

> public class ConcurrentSkipListSet extends AbstractSet implements NavigableSet, Cloneable, java.io.Serializable

**1、** 一个基于ConcurrentSkipListMap的可缩放并发NavigableSet实现；

**2、** set的元素可以根据它们的自然顺序进行排序，也可以根据创建set时所提供的Comparator进行排序，具体取决于使用的构造方法；

**3、** 不允许使用null元素，因为无法可靠地将null参数及返回值与不存在的元素区分开来；

**4、** 多个线程可以安全地并发执行插入、移除和访问操作；

成员变量

```java
 //元素均存入ConcurrentSkipListMap的实力m中
 private final ConcurrentNavigableMap<E,Object> m;
```

构造方法

```java
//构造一个新的空 set，该 set 按照元素的自然顺序对其进行排序。
public ConcurrentSkipListSet() {
	m = new ConcurrentSkipListMap<E,Object>();
}
//构造一个包含指定 collection 中元素的新 set，这个新 set 按照元素的自然顺序对其进行排序。
public ConcurrentSkipListSet(Collection<? extends E> c) {
	m = new ConcurrentSkipListMap<E,Object>();
    addAll(c);
}
//构造一个新的空 set，该 set 按照指定的比较器对其元素进行排序。
public ConcurrentSkipListSet(Comparator<? super E> comparator) {
	m = new ConcurrentSkipListMap<E,Object>(comparator);
 }
//构造一个新 set，该 set 所包含的元素与指定的有序 set 包含的元素相同，使用的顺序也相同。
public ConcurrentSkipListSet(SortedSet<E> s) {
	m = new ConcurrentSkipListMap<E,Object>(s.comparator());
    addAll(s);
}
```

常用方法

> boolean add(E e)：如果此 set 中不包含指定元素，则添加指定元素。

```java
public boolean add(E e) {
	return m.putIfAbsent(e, Boolean.TRUE) == null;
}
```

> boolean remove(Object o):如果此 set 中存在指定的元素，则将其移除。

```java
public boolean remove(Object o) {
	return m.remove(o, Boolean.TRUE);
}
```

> boolean contains(Object o):如果此 set 包含指定的元素，则返回 true。

```java
public boolean contains(Object o) {
	return m.containsKey(o);
}
```

> Iterator iterator():返回在此 set 的元素上以升序进行迭代的迭代器。

```java
public Iterator<E> iterator() {
	return m.navigableKeySet().iterator();
}
```

由源码看出，对元素的操作均基于ConcurrentSkipListMap。

## EnumSet

> public abstract class EnumSet extends AbstractSet implements Cloneable, java.io.Serializable

**1、** 与枚举类型一起使用的专用Set实现；

**2、** 不允许使用null元素；

**3、** 非同步；

成员变量

```java
	final Class<E> elementType;
    /**
     * 元素缓存在此数组中
     */
    final Enum[] universe;
    private static Enum[] ZERO_LENGTH_ENUM_ARRAY = new Enum[0];
```

无可访问的构造方法。

常用方法

> EnumSet noneOf(Class elementType)：创建一个具有指定元素类型的空枚举 set。

```java
public static <E extends Enum<E>> EnumSet<E> noneOf(Class<E> elementType) {
		//返回包含elementType类型的所有枚举
        Enum[] universe = getUniverse(elementType);
        if (universe == null)
            throw new ClassCastException(elementType + " not an enum");
        if (universe.length <= 64)
            return new RegularEnumSet<E>(elementType, universe);
        else
            return new JumboEnumSet<E>(elementType, universe);
    }
```

> EnumSet of(E e)：创建一个最初包含指定元素的枚举 set。

```java
public static <E extends Enum<E>> EnumSet<E> of(E e) {
	EnumSet<E> result = noneOf(e.getDeclaringClass());
    result.add(e);
    return result;
}
```

由源码看出，EnumSet不可实例化，成员方法均为静态方法，枚举 set 中所有键都必须来自单个枚举类型，该枚举类型在创建 set 时显式或隐式地指定。
