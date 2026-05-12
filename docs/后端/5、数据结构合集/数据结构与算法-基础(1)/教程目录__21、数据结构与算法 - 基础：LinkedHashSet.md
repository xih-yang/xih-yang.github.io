# 21、数据结构与算法 - 基础：LinkedHashSet
- 来源：https://ddkk.com/zhuanlan/algorithm/3/21.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

LinkedHashSet 继承了 HashSet，在此基础上维护了元素的插入顺序。

```java
public class LinkedHashSet<E>
    extends HashSet<E>
    implements Set<E>, Cloneable, java.io.Serializable
```

**2、构造方法**

LinkedHashSet 的源码非常简单，只有简单的四4个构造方法。

```java
public LinkedHashSet(int initialCapacity, float loadFactor) {
    super(initialCapacity, loadFactor, true);
}
public LinkedHashSet(int initialCapacity) {
    super(initialCapacity, .75f, true);
}
public LinkedHashSet() {
    super(16, .75f, true);
}
public LinkedHashSet(Collection<? extends E> c) {
    super(Math.max(2*c.size(), 11), .75f, true);
    addAll(c);
}
```

但我们不是说 HashSet 还维护了元素的插入顺序么？那这部分代码写在哪里呢？

这里我们要注意一个细节，即 LinkedHashSet 调用的都是 HashSet 的三个参数构造方法，即 HashSet 的这个方法。

```java
HashSet(int initialCapacity, float loadFactor, boolean dummy) {
    map = new LinkedHashMap<>(initialCapacity, loadFactor);
}
```

从上面的代码我们知道，LinkedHashSet 虽然继承的是 HashSet，但是其却使用 LinkedHashMap 做为实现类。而 LinkedHashMap 则本身维护了元素的插入顺序，这在我们之前讲的 [LinkedHashMap](/zhuanlan/algorithm/3/18.html) 源码的时候讲到过。

## 3、总结

LinkedHashSet 是在 HashSet 的基础上，维护了元素的插入顺序。虽然 LinkedHashSet 使用了 HashSet 的实现，但其却调用了 LinkedHashMap 作为最终实现，从而实现了对插入元素顺序的维护。
