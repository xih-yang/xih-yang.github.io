# 15、数据结构与算法 - 基础：LinkedList
- 来源：https://ddkk.com/zhuanlan/algorithm/3/15.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

LinkedList 是链表的经典实现，其底层采用链表节点的方式实现。

```java
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
```

从类继承结构图可以看到，LinkedList 不仅实现了 List 接口，还实现了 Deque 双向队列接口。为了深入理解 LinkedList 的原理，我们将从类成员变量、构造方法、核心方法两个方面逐一介绍。

### 2、类成员变量

```java
// 链表大小
transient int size = 0;
// 首节点
transient Node<E> first;
// 尾节点
transient Node<E> last;
// Node节点
private static class Node<E> {
    E item;
    Node<E> next;
    Node<E> prev;
    Node(Node<E> prev, E element, Node<E> next) {
        this.item = element;
        this.next = next;
        this.prev = prev;
    }
}
```

其采用了链表节点的方式实现，并且每个节点都有前驱和后继节点。

### 3、构造方法

LinkedList 总共有 2 个构造方法：

```java
public LinkedList() {
}
public LinkedList(Collection<? extends E> c) {
    this();
    addAll(c);
}
```

构造方法比较简单，这里不深入介绍。

### 4、核心方法

在LinkedList 中最为核心的是查找、插入、删除、扩容这几个方法。

#### 4.1、查找

LinkedList 底层基于链表结构，无法向 ArrayList 那样快速的随机访问指定位置的元素。LinkedList 查找过程要稍麻烦一些，需要从链表头结点向后查找（或尾节点向前找），时间复杂度为 O(N)。

相关源码如下：

```java
public E get(int index) {
    checkElementIndex(index);
    return node(index).item;
}
Node<E> node(int index) {
    /*
     * 如果获取的元素小于容量的一半，则从头结点开始查找，否则从尾节点开始查找。
     */    
    if (index < (size >> 1)) {
        Node<E> x = first;
        // 循环向后查找，直至 i == index
        for (int i = 0; i < index; i++)
            x = x.next;
        return x;
    } else {
        Node<E> x = last;
        for (int i = size - 1; i > index; i--)
            x = x.prev;
        return x;
    }
}
```

上面的代码比较简单，主要是通过遍历的方式定位目标位置的节点。获取到节点后，取出节点存储的值返回即可。这里面有个小优化，即通过比较 index 与节点数量 size/2 的大小，决定从头结点还是尾节点进行查找。

#### 4.2、插入

LinkedList 除了实现了 List 接口相关方法，还实现了 Deque 接口的很多方法，例如：addFirst、addLast、offerFirst、offerLast 等。但这些方法的实现思路大致都是一样的，所以我只讲 add 方法的实现。add 方法有两个方法，一个是直接插入队尾，一个是插入指定位置。

我们先来看第一个add方法：直接插入队尾

```java
public boolean add(E e) {
    linkLast(e);
    return true;
}
```

可以看到其直接调用了 linkLast 方法，其实它就是 Deque 接口的一个方法。

```java
void linkLast(E e) {
    final Node<E> l = last;
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    if (l == null)
        first = newNode;
    else
        l.next = newNode;
    size++;
    modCount++;
}
```

上述代码进行了节点的创建以及引用的变化，最后增加链表的大小。

我们继续看第二个add方法：插入指定位置。

```java
public void add(int index, E element) {
    checkPositionIndex(index);
    if (index == size)
        linkLast(element);
    else
        linkBefore(element, node(index));
}
```

如果我们插入的位置还是链表尾部，那么还是会调用 linkLast 方法。否则调用 node 方法取出插入位置的节点，调用 linkBefore 方法插入。

```java
void linkBefore(E e, Node<E> succ) {
    // assert succ != null;
    final Node<E> pred = succ.prev;
    final Node<E> newNode = new Node<>(pred, e, succ);
    succ.prev = newNode;
    if (pred == null)
        first = newNode;
    else
        pred.next = newNode;
    size++;
    modCount++;
}
```

上述代码进行了节点的创建以及引用的变化，最后增加链表的大小。

#### 4.3、删除

删除节点有两个方法，第一个是移除特定的元素，第二个是移除某个位置的元素。

我们先看第一个删除方法：移除特定的元素。

```java
public boolean remove(Object o) {
    if (o == null) {
        for (Node<E> x = first; x != null; x = x.next) {
            if (x.item == null) {
                unlink(x);
                return true;
            }
        }
    } else {
        for (Node<E> x = first; x != null; x = x.next) {
            if (o.equals(x.item)) {
                unlink(x);
                return true;
            }
        }
    }
    return false;
}
```

上述代码的大致思路为：遍历找到删除的节点，之后调用 unlink() 方法解除引用。我们继续看看 unlink() 方法的代码。

```java
E unlink(Node<E> x) {
    // assert x != null;
    final E element = x.item;
    final Node<E> next = x.next;
    final Node<E> prev = x.prev;
    if (prev == null) {
        first = next;
    } else {
        prev.next = next;
        x.prev = null;
    }
    if (next == null) {
        last = prev;
    } else {
        next.prev = prev;
        x.next = null;
    }
    x.item = null;
    size--;
    modCount++;
    return element;
}
```

unlink() 代码里就是做了一系列的引用修改操作。

## 5、总结

经过上面的分析，我们可以知道 LinkedList 有如下特点：

- 底层基于链表实现，相比ArrayList修改速度快(因为ArrayList需要移动前后的元素， 而LinkedList只需要改变引用关系)，读取速度慢（读取时间复杂度O(N)，修改时间复杂度O(N)，因为要查找元素，所以修改也是O(N)）。
- 非线程安全。
- 与 ArrayList 不同，LinkedList 没有容量限制，所以也没有扩容机制。
