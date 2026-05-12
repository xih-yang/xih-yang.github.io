# 22、数据结构与算法 - 基础：TreeSet
- 来源：https://ddkk.com/zhuanlan/algorithm/3/22.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

TreeSet 是 Set 集合的红黑树实现，但其内部并没有具体的逻辑，而是直接使用 TreeMap 对象实现。我们先来看看 TreeSet 的定义。

```java
public class TreeSet<E> extends AbstractSet<E>
    implements NavigableSet<E>, Cloneable, java.io.Serializable
```

可以看到 TreeSet 实现了 NavigableSet 接口，而 NavigableSet 接口又继承了 接口。SortedSet 接口又继承了 Set 接口。下面我们还是通过类成员变量、构造方法、核心方法来解析 TreeSet 的实现

### 2、类成员变量

```java
// 具体的实现类
private transient NavigableMap<E,Object> m;
// Map的value
private static final Object PRESENT = new Object();
```

### 3、构造方法

TreeSet 一共有 5 个构造方法，如下所示：

```java
// 默认采用TreeMap实现
public TreeSet() {
    this(new TreeMap<E,Object>());
}
// 指定实现类型
TreeSet(NavigableMap<E,Object> m) {
    this.m = m;
}
// 指定TreeMap的比较器
public TreeSet(Comparator<? super E> comparator) {
    this(new TreeMap<>(comparator));
}
// 指定初始集合
public TreeSet(Collection<? extends E> c) {
    this();
    addAll(c);
}
// 指定比较器以及初始集合
public TreeSet(SortedSet<E> s) {
    this(s.comparator());
    addAll(s);
}
```

可以看到，如果我们没有指定传入的 Map 类型，TreeSet 将自动采用 TreeMap 来实现。而如果你传入了 NavigableMap 类型的对象，那么就按照你传入的对象类型来实现。

### 4、核心方法

TreeSet 的核心方法实现直接采用了 TreeMap 的实现，无论是 add 还是 remove 方法。

```java
public boolean add(E e) {
    return m.put(e, PRESENT)==null;
}
public boolean remove(Object o) {
    return m.remove(o)==PRESENT;
}
```

## 5、总结

TreeSet 的实现与 HashSet 类似，都是直接采用了 TreeMap 的方法实现。所以如果理解了 [TreeMap](/zhuanlan/algorithm/3/19.html)，那么 TreeSet 就很简单了。
