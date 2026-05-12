# 13、数据结构与算法 - 基础：ArrayList
- 来源：https://ddkk.com/zhuanlan/algorithm/3/13.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

ArrayList 是 List 集合的列表经典实现，其底层采用定长数组实现，可以根据集合大小进行自动扩容。

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
```

## 2、原理

为了深入理解 ArrayList 的原理，我们将从类成员变量、构造方法、核心方法两个方面逐一介绍。

### 2.1、类成员变量

```java
// 默认初始化大小
private static final int DEFAULT_CAPACITY = 10;
// 空列表数据。初始化时如果没有指定大小，则将此值赋予elementData
private static final Object[] EMPTY_ELEMENTDATA = {};
// 默认空列表数据。如果没有指定大小，那么将此值赋予elementData
private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};
// 列表数据
transient Object[] elementData; 
// 列表大小
private int size;
```

**2.2、构造方法**

ArrayList 一共有 3 个构造方法：

```java
// 空构造方法
public ArrayList() {
    this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
}
// 指定大小
public ArrayList(int initialCapacity) {
    if (initialCapacity > 0) {
        this.elementData = new Object[initialCapacity];
    } else if (initialCapacity == 0) {
        this.elementData = EMPTY_ELEMENTDATA;
    } else {
        throw new IllegalArgumentException("Illegal Capacity: "+
                                           initialCapacity);
    }
}
// 指定初始集合
public ArrayList(Collection<? extends E> c) {
    elementData = c.toArray();
    if ((size = elementData.length) != 0) {
        // c.toArray might (incorrectly) not return Object[] (see 6260652)
        if (elementData.getClass() != Object[].class)
            elementData = Arrays.copyOf(elementData, size, Object[].class);
    } else {
        // replace with empty array.
        this.elementData = EMPTY_ELEMENTDATA;
    }
}
```

从第一个构造方法可以看到，如果没有指定大小，那么就将 elementData 赋值为 DEFAULTCAPACITY_EMPTY_ELEMENTDATA。而从第二个构造方法可以看到，如果指定了大小为 0，那么就将 elementData 赋值为 EMPTY_ELEMENTDATA。

**3、核心方法**

在ArrayList 中最为核心的是获取、插入、删除、扩容这几个方法。

**3.1、获取**

获取的源码非常简单，只需对 index 做有效性校验。如果参数合法，那么直接返回对应数组下标的数据。

```java
public E get(int index) {
    rangeCheck(index);
    return elementData(index);
}
```

**3.2、插入**

插入一共有两种实现方式，第一种是直接插入列表尾部，另一种是插入某个位置。

```java
// 直接插入尾部
public boolean add(E e) {
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    elementData[size++] = e;
    return true;
}
// 插入某个位置
public void add(int index, E element) {
    rangeCheckForAdd(index);
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    System.arraycopy(elementData, index, elementData, index + 1,
                     size - index);
    elementData[index] = element;
    size++;
}
```

- 如果是直接插入尾部的话，那么只需调用 ensureCapacityInternal 方法做容量检测。如果空间足够，那么就插入，空间不够就扩容后插入。
- 如果是插入的是某个位置，那么就需要将 index 之后的所有元素后移，之后再将元素插入至 index 处。

**3.3、删除**

ArrayList 的删除方法有两个，分别是：

- 删除某个位置的元素：remove(int index)
- 删除某个具体的元素：remove(Object o)

我们先来看第一个删除方法：删除某个位置的元素。

```java
// 删除某个位置的元素
public E remove(int index) {
    rangeCheck(index);
    modCount++;
    E oldValue = elementData(index);
    int numMoved = size - index - 1;
    if (numMoved > 0)
        System.arraycopy(elementData, index+1, elementData, index,
                         numMoved);
    elementData[--size] = null; // clear to let GC do its work
    return oldValue;
}
```

上述代码的逻辑大致是这样的：首先做参数范围检查，接着将 index 位置后的所有元素都往前挪一位，最后减少列表大小。

我们继续看第二个删除方法：删除某个特定的元素。

```java
public boolean remove(Object o) {
    if (o == null) {
        for (int index = 0; index < size; index++)
            if (elementData[index] == null) {
                fastRemove(index);
                return true;
            }
    } else {
        for (int index = 0; index < size; index++)
            if (o.equals(elementData[index])) {
                fastRemove(index);
                return true;
            }
    }
    return false;
}
```

上述代码的逻辑大致是：首先，遍历列表的所有元素，找到需要删除的元素索引，最后调用 fastRemove 方法删除该元素。我们继续看看 fastRemove 方法的实现。

```java
/*
 * 用私有的方法 fastRemove 方法跳过边界检查，不返回删除值。
 */
private void fastRemove(int index) {
    modCount++;
    int numMoved = size - index - 1;
    if (numMoved > 0)
        System.arraycopy(elementData, index+1, elementData, index,
                         numMoved);
    elementData[--size] = null; // clear to let GC do its work
}
```

这里会有一个疑问，那就是为什么不直接复用 remove(int index) 方法，而要新写一个方法呢？答案在 fastRemove 方法的注释中已经写了，就是为了跳过边界检查，提高效率。

**3.4、扩容**

扩容是ArrayList 的核心方法，当插入的时候容量不足，便会触发扩容。我们可以看到在插入的两个方法中都调用了扩容方法——ensureCapacityInternal。

```java
private void ensureCapacityInternal(int minCapacity) {
    ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
}
```

ensureCapacityInternal 方法先调用calculateCapacity()方法了， 然后调用 ensureExplicitCapacity 实现。

判断数组当前需要的最小容量

```java
  private static int calculateCapacity(Object[] elementData, int minCapacity) {
        if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            return Math.max(DEFAULT_CAPACITY, minCapacity);
        }
        return minCapacity;
    }
```

判断是否需要扩容

```java
private void ensureExplicitCapacity(int minCapacity) {
    modCount++;
    // overflow-conscious code
    if (minCapacity - elementData.length > 0)
        grow(minCapacity);
}
```

ensureExplicitCapacity 方法首先判断容量是否足够，如果不够就调用 grow 方法扩容。

```java
private void grow(int minCapacity) {
    // overflow-conscious code
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    // minCapacity is usually close to size, so this is a win:
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

grow 方法的大致逻辑为：将原有列表容量扩大为原来的 1.5 倍（>> : 右移运算符，num >> 1, 相当于num除以2）。如果还是不够，那么直接扩大为最小容量（minCapacity）。

**4、总结**

经过上面的分析，我们可以知道 ArrayList 有如下特点：

- 底层基于数组实现，读取速度快，修改速度慢（读取时间复杂度O(1)，修改时间复杂度O(N)）。
- 非线程安全。
- ArrayList 每次默认扩容为原来的 1.5 倍。
