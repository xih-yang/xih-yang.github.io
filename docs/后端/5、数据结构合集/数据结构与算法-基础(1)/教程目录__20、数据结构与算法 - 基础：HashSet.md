# 20、数据结构与算法 - 基础：HashSet
- 来源：https://ddkk.com/zhuanlan/algorithm/3/20.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

HashSet 是 Set 集合的哈希实现，其继承了 AbstractSet 抽象类，并实现了 Set 接口。

```java
public class HashSet<E>
    extends AbstractSet<E>
    implements Set<E>, Cloneable, java.io.Serializable
```

为了深入理解 HashSet 的原理，我们将从类成员变量、构造方法、核心方法两个方面逐一介绍。

### 2、类成员变量

```java
// HashSet内部使用HashMap存储
private transient HashMap<E,Object> map;
// 存储在value上的值
private static final Object PRESENT = new Object();
```

从类成员变量我们可以知道，HashSet 内部使用 HashMap 存储，而 PRESENT 则是存储在所有 key 上的 value。因此对于 HashSet 来说，其所有 key 的 value 都相同。

### 3、构造方法

HashSet 一共有 5 个构造方法。

```java
public HashSet() {
    map = new HashMap<>();
}
public HashSet(Collection<? extends E> c) {
    map = new HashMap<>(Math.max((int) (c.size()/.75f) + 1, 16));
    addAll(c);
}
public HashSet(int initialCapacity, float loadFactor) {
    map = new HashMap<>(initialCapacity, loadFactor);
}
public HashSet(int initialCapacity) {
    map = new HashMap<>(initialCapacity);
}
HashSet(int initialCapacity, float loadFactor, boolean dummy) {
    map = new LinkedHashMap<>(initialCapacity, loadFactor);
}
```

可以看到构造方法传入的参数其实就是用于初始化 HashMap 对象，主要有：initialCapacity（初始大小）、loadFactor（扩容因子）。这几个构造参数内容并不复杂，这里就不细讲了。

这里有一个关键的细节，即第 5 个方法使用 LinkedHashMap 实现的，而不是用 HashMap 实现的。而我们后面要讲到的 LinkedHashSet 其实就是使用 LinkedHashMap 实现的，其保存了插入元素的顺序。

### 4、核心方法

对于HashSet 来说，其核心的方法有：add、remove。

我们先看 add 方法。

```java
public boolean add(E e) {
    return map.put(e, PRESENT)==null;
}
```

可以看到 add 方法直接调用了 HashMap 对象的 put 方法。如果 Set 集合插入成功，那么就返回 true，否则返回 false。

接着我们看看 remove 方法。

```java
public boolean remove(Object o) {
    return map.remove(o)==PRESENT;
}
```

可以看到 remove 方法直接调用了 HashMap 对象的 remove 方法。如果删除成功，就返回 true，否则返回 false。

## 5、总结

HashSet 的源码也是非常简单了，其直接借用了 HashMap 的实现。所以如果你弄懂了 HashMap，那么 HashSet 自然不在话下了。
