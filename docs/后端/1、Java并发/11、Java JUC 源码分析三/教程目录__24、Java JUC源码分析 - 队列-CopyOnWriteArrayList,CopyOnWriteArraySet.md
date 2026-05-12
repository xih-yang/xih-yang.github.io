# 24、Java JUC源码分析 - 队列-CopyOnWriteArrayList,CopyOnWriteArraySet
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/24.html
- 分类：Java并发
- 分组：教程目录
在看LinkedTransferQueue之前看个简单点的CopyOnWriteArrayList。CopyOnWriteArrayList还是比较简单的，内部结构只有一个数组和一把锁。采用写时加锁复制数组，所有的可变操作都在新数组上进行，读则是老数组，有点读写分离意思，比ArrayList都加锁开肯定好的多，感觉适合那种读多写少的场景。

内部结构只有一个重入锁，一个数组：

```java
<span style="font-size:18px;">/** The lock protecting all mutators */
transient final ReentrantLock lock = new ReentrantLock();
/** The array, accessed only via getArray/setArray. */
private volatile transient Object[] array;
/**
 * Gets the array.  Non-private so as to also be accessible
 * from CopyOnWriteArraySet class.
 */
final Object[] getArray() {
    return array;
}
/**
 * Sets the array.
 */
final void setArray(Object[] a) {
    array = a;
}
/**
 * Creates an empty list.
 */
public CopyOnWriteArrayList() {
    setArray(new Object[0]);
}
public int size() {
    return getArray().length;
}
/**
 * Returns <tt>true</tt> if this list contains no elements.
 *
 * @return <tt>true</tt> if this list contains no elements
 */
public boolean isEmpty() {
    return size() == 0;
}
</span>
```

CopyOnWriteArrayList的get等获取的方法都是对数组的基本操作，没有什么新意：

```java
<span style="font-size:18px;">private static int indexOf(Object o, Object[] elements,
                           int index, int fence) {
    if (o == null) {
        for (int i = index; i < fence; i++)
            if (elements[i] == null)
                return i;
    } else {
        for (int i = index; i < fence; i++)
            if (o.equals(elements[i]))
                return i;
    }
    return -1;
}
private static int lastIndexOf(Object o, Object[] elements, int index) {
    if (o == null) {
        for (int i = index; i >= 0; i--)
            if (elements[i] == null)
                return i;
    } else {
        for (int i = index; i >= 0; i--)
            if (o.equals(elements[i]))
                return i;
    }
    return -1;
}
public boolean contains(Object o) {
    Object[] elements = getArray();
    return indexOf(o, elements, 0, elements.length) >= 0;
}
public int indexOf(Object o) {
    Object[] elements = getArray();
    return indexOf(o, elements, 0, elements.length);
}
public int indexOf(E e, int index) {
    Object[] elements = getArray();
    return indexOf(e, elements, index, elements.length);
}
public int lastIndexOf(Object o) {
    Object[] elements = getArray();
    return lastIndexOf(o, elements, elements.length - 1);
}
public int lastIndexOf(E e, int index) {
    Object[] elements = getArray();
    return lastIndexOf(e, elements, index);
}
@SuppressWarnings("unchecked")
private E get(Object[] a, int index) {
    return (E) a[index];
}
public E get(int index) {
    return get(getArray(), index);
}</span>
```

看下一些可变操作的方法。

set：

```java
<span style="font-size:18px;">/** 写方法整体流程差不多都是：加锁-获取旧的数组-复制数组-写数组-设置新的-释放锁 */
public E set(int index, E element) {
    final ReentrantLock lock = this.lock;
    lock.lock(); //基本上所有的写操作都会加锁
    try {
        Object[] elements = getArray(); //获取旧的数组
        E oldValue = get(elements, index);
        if (oldValue != element) {
            int len = elements.length;
            Object[] newElements = Arrays.copyOf(elements, len); //底层native方法，最后内存复制一份数组出来
            newElements[index] = element;
            setArray(newElements);
        } else {
            // Not quite a no-op; ensures volatile write semantics
            setArray(elements); //值相同时还是setArray了下，保证volatile语义，所有的写对读可见
        }
        return oldValue;
    } finally {
        lock.unlock();
    }
}
public boolean add(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] elements = getArray();
        int len = elements.length;
        Object[] newElements = Arrays.copyOf(elements, len + 1);  //数组长度+1
        newElements[len] = e;
        setArray(newElements);
        return true;
    } finally {
        lock.unlock();
    }
}
public void add(int index, E element) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] elements = getArray();
        int len = elements.length;
        if (index > len || index < 0)
            throw new IndexOutOfBoundsException("Index: "+index+
                                                ", Size: "+len);
        Object[] newElements;
        int numMoved = len - index;
        if (numMoved == 0)
            newElements = Arrays.copyOf(elements, len + 1);
        else {
            newElements = new Object[len + 1];
            System.arraycopy(elements, 0, newElements, 0, index); //指定位置拆分数组复制
            System.arraycopy(elements, index, newElements, index + 1,
                             numMoved);
        }
        newElements[index] = element;
        setArray(newElements);
    } finally {
        lock.unlock();
    }
}</span>
```

其他的写方法都差不多，整个流程就是写加锁-copy新数组-对新数组操作-解锁。

CopyOnWriteArraySet内部持有一个CopyOnWriteArrayList引用，所有操作都是基于对CopyOnWriteArrayList的操作。

CopyOnWriteArrayList没什么可说的，采用类似读写分析的机制，所有的写操作，都会复制一份数组出来操作，所以不太适合频繁写的场景，适合读多写少的场景。
