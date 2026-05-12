# 14、数据结构与算法 - 基础：Vector
- 来源：https://ddkk.com/zhuanlan/algorithm/3/14.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

Vector 的底层实现以及结构与 ArrayList 完全相同，只是在某一些细节上会有所不同。这些细节主要有：

- 线程安全
- 扩容大小

## 2、线程安全

我们知道 ArrayList 是线程不安全的，只能在单线程环境下使用。而 Vector 则是线程安全的，那么其实怎么实现的呢？

其实Vector 的实现很简单，就是在每一个可能发生线程安全的方法加上 synchronized 关键字。这样就使得任何时候只有一个线程能够进行读写，这样就保证了线程安全。

```java
public synchronized E get(int index) {
    if (index >= elementCount)
        throw new ArrayIndexOutOfBoundsException(index);
    return elementData(index);
}
public synchronized boolean add(E e) {
    modCount++;
    ensureCapacityHelper(elementCount + 1);
    elementData[elementCount++] = e;
    return true;
}
```

## 3、扩容大小

与ArrayList 类似，Vector 在插入元素时也会检查容量并扩容。在 Vector 中这个方法是：ensureCapacityHelper。

```java
private void ensureCapacityHelper(int minCapacity) {
    // overflow-conscious code
    if (minCapacity - elementData.length > 0)
        grow(minCapacity);
}
private void grow(int minCapacity) {
    // overflow-conscious code
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + ((capacityIncrement > 0) ?
                                     capacityIncrement : oldCapacity);
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

其实上述扩容的思路与 ArrayList 是相同，唯一的区别是 Vector 的扩容大小。

```java
int newCapacity = oldCapacity + ((capacityIncrement > 0) ?
                                     capacityIncrement : oldCapacity);
```

从上面的代码可以看到：如果 capacityIncrement 大于 0，那么就按照 capacityIncrement 去扩容，否则扩大为原来的 2倍。而 ArrayList 则是扩大为原来的 1.5 倍。

## 4、总结

Vector 与 ArrayList 在实现方式上是完全一致的，但是它们在某些方法有些许不同：

- 第一，Vector 是线程安全的，而 ArrayList 是线程不安全的。Vector 直接使用 synchronize 关键字实现同步。
- 第二，Vector 默认扩容为原来的 2 被，而 ArrayList 默认扩容为原来的 1.5 倍。
