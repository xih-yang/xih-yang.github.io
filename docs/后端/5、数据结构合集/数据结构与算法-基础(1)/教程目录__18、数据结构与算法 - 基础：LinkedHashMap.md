# 18、数据结构与算法 - 基础：LinkedHashMap
- 来源：https://ddkk.com/zhuanlan/algorithm/3/18.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

LinkedHashMap 是在 HashMap 的基础上，增加了对插入元素的链表维护。LinkedHashMap 的声明比较简单，继承了 HashMap 类，实现了 Map 接口。

```java
public class LinkedHashMap<K,V>
    extends HashMap<K,V>
    implements Map<K,V>
```

下面我们将从类成员变量、构造方法、核心方法、扩容机制几个方向介绍 LinkedHashMap 的原理。

### 2、类成员变量

```java
// 链表头节点
transient LinkedHashMap.Entry<K,V> head;
// 链表尾节点
transient LinkedHashMap.Entry<K,V> tail;
// 通过iterator访问时的顺序，true表示按照访问顺序，false表示按照插入顺序。
final boolean accessOrder;
```

可以看到在 LinkedHashMap 的类成员变量中增加了 head 和 tail 两个变量，从而实现了对插入元素的链表维护。而这里的 accessOrder 则表示遍历 LinkedHashMap 时将按照什么顺序输出，这里我们先留意一下有 accessOrder 这个参数，后续会讲到。

### 3、构造方法

LinkedHashMap 一共有 5 个构造方法：

```java
public LinkedHashMap() {
    super();
    accessOrder = false;
}
public LinkedHashMap(int initialCapacity) {
    super(initialCapacity);
    accessOrder = false;
}
public LinkedHashMap(int initialCapacity,
                     float loadFactor,
                     boolean accessOrder) {
    super(initialCapacity, loadFactor);
    this.accessOrder = accessOrder;
}
public LinkedHashMap(int initialCapacity, float loadFactor) {
    super(initialCapacity, loadFactor);
    accessOrder = false;
}
public LinkedHashMap(Map<? extends K, ? extends V> m) {
    super();
    accessOrder = false;
    putMapEntries(m, false);
}
```

构造方法基本上是进行了一些类成员变量的参数设置, 比较简单。

### 4、核心方法

LinkedHashMap 的核心方法主要有：get、put、remove、遍历。

#### 4.1、get

LinkedHashMap 的 get 方法实现如下：

```java
public V get(Object key) {
    Node<K,V> e;
    if ((e = getNode(hash(key), key)) == null)
        return null;
    if (accessOrder)
        afterNodeAccess(e);
    return e.value;
}
```

可以看到，其直接调用了 HashMap 的 getNode 方法获取到对应的节点。但这里有一个细节需要注意：

```java
if (accessOrder)
    afterNodeAccess(e);
```

这里如果我们设置了 accessOrder 为 true，那么就执行 afterNodeAccess 方法。我们继续看看这个方法做了什么。

```java
// 将节点挪到链表尾部
void afterNodeAccess(Node<K,V> e) { 
    LinkedHashMap.Entry<K,V> last;
    // 如果 accessOrder 为true，且尾部节点不是 e 节点，那么将其挪到尾部
    if (accessOrder && (last = tail) != e) {
        LinkedHashMap.Entry<K,V> p =
            (LinkedHashMap.Entry<K,V>)e, b = p.before, a = p.after;
        p.after = null;
        if (b == null)
            head = a;
        else
            b.after = a;
        if (a != null)
            a.before = b;
        else
            last = b;
        if (last == null)
            head = p;
        else {
            p.before = last;
            last.after = p;
        }
        tail = p;
        ++modCount;
    }
}
```

其实afterNodeAccess 方法的作用就是将我们访问到的 e 节点挪到链表尾部。还记得我们之前说到 accessOrder 变量的作用么？

```java
// 通过iterator访问时的顺序，true表示按照访问顺序，false表示按照插入顺序。
final boolean accessOrder;
```

如果accessOrder 为 true，那么表示访问时就要按照访问顺序去访问。而在 get 方法中，我们每访问一个节点，我们就会将该节点放入链表尾部，所以我们通过 iterator 访问链表时就是按照访问顺序得到的遍历（越早访问的越在后面）。

**4.2、put**

我们会发现 LinkedHashMap 中并没有 put 方法的实现，这是因为其直接使用了 HashMap 的 put 方法实现。

**4.3、remove**

LinkedHashMap 中也没有 remove 方法的实现，也是直接使用了 HashMap 的 remove 方法实现。

**4.4、遍历**

在将LinkedHashMap 的遍历之前，我们先用一个例子回顾一下 LinkedHashMap 的遍历过程。

```java
Map<String, String> hashMap = new LinkedHashMap<>();
hashMap.put("name", "tom");
hashMap.put("age", "27");
hashMap.put("address", "guangdong");
Iterator<String> iterator = hashMap.keySet().iterator();
while (iterator.hasNext()) {
    // name,age,address
    String key = iterator.next();
    System.out.println(key + "," + hashMap.get(key));
}
```

上面的代码输出之后是：name、age、address，其按照插入顺序访问。但如果是 HashMap 的话，那么结果是：address、name、age。要弄清楚为什么那么我们就必须看看其源码是如何实现的。我们先进入 `hashMap.keySet().iterator()` 这块的代码看看，即 LinkedHashMap.keySet 方法：

```java
public Set<K> keySet() {
    Set<K> ks = keySet;
    if (ks == null) {
        ks = new LinkedKeySet();
        keySet = ks;
    }
    return ks;
}
```

可以看到其返回的是一个 LinkedKeySet 对象，我们继续看看 LinkedKeySet 对象的代码。

```java
final class LinkedKeySet extends AbstractSet<K> {
    // 省略其他方法
    public final Iterator<K> iterator() {
        return new LinkedKeyIterator();
    }
    // ...省略其他方法
```

上面的代码很多，但我们只需要关心 iterator 方法就可以了，因为我们调用了 keySet 方法之后就调用了 iterator 方法。我们可以看到 iterator 方法返回了一个 LinkedKeyIterator 对象。

我们知道我们获取到了 Iterator 对象之后会调用两个方法，即：hasNext 方法和 next 方法。LinkedKeyIterator 类继承了 LinkedHashIterator，其 hasNext 方法调用了父类的实现，但其 next 方法则是自己实现了。

```java
final class LinkedKeyIterator extends LinkedHashIterator
    implements Iterator<K> {
    public final K next() { return nextNode().getKey(); }
}
```

所以如果要弄清楚其访问顺序，我们需要看看其 nextNode 方法的实现。

```java
// LinkedHashIterator.nextNode
final LinkedHashMap.Entry<K,V> nextNode() {
    // 将下个节点赋值给 e 
    LinkedHashMap.Entry<K,V> e = next;
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
    if (e == null)
        throw new NoSuchElementException();
    current = e;
    // 更新 next 属性
    next = e.after;
    return e;
}
```

从上面的方法我们可以看到其把 next 节点直接赋值给 e 并返回。而每一次进行 nextNode 操作都会更新 next 属性到下一个节点。我们从构造方法可以看到 LinkedHashIterator 的构造方法可以看到，next 节点首次赋值是指向了头结点。

```java
LinkedHashIterator() {
    next = head;
    expectedModCount = modCount;
    current = null;
}
```

到了这里遍历的顺序就一目了然了。首先从头结点开始遍历，一直遍历到尾节点。而链表的顺序则是我们一直在维护的。默认情况下按照插入顺序排列，如果设置了 accessOrder，那么就按照访问顺序排列。每次访问到一个节点，就将其放到尾部。所以如果设置 accessOrder 为 true，那么越近访问到的节点就会越慢访问到。

## 5、总结

LinkedHashMap 相对于 HashMap 维护了一个插入元素的顺序，但其大部分的实现都直接调用了 HashMap 的实现。所以相对于 HashMap 来说，LinkedHashMap 还是比较好理解的。

LinkedHashMap 继承了 HashMap，直接调用了 HashMap 的实现。

LinkedHashMap 维护了插入元素的顺序，可以根据 accessOrder 来设定是按照访问顺序遍历，还是按照插入顺序遍历。
