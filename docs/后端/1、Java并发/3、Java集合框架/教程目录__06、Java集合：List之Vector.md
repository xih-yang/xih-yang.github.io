# 06、Java集合：List之Vector
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/6.html
- 分类：Java并发
- 分组：教程目录
## 1.Vector

> public class Vector extends AbstractList implements List, java.io.Serializable

- 实现可增长的对象数组
- 可以使用整数索引进行访问, 可根据需要增大或缩小
- 方法上加synchronized保证同步的，fail-fast。

> 成员变量

```java
/**
 * 存储向量组件的数组缓冲区。
 */
protected Object[] elementData;
/**
 * Vector 对象中的有效组件数。
 */
protected int elementCount;
/**
 * 向量的大小大于其容量时，容量自动增加的量。
 */
protected int capacityIncrement;
```

> 构造函数

```java
/**
 *使用指定的初始容量和容量增量构造一个空的向量。
 */
public Vector(int initialCapacity, int capacityIncrement) {
    super();
    if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal    Capacity: "+initialCapacity);
    this.elementData = new Object[initialCapacity];
    this.capacityIncrement = capacityIncrement;
}
/**
 * 使用指定的初始容量和等于零的容量增量构造一个空向量。
 */
public Vector(int initialCapacity) {
    this(initialCapacity, 0);
}
/**
 *构造一个空向量，使其内部数据数组的大小为 10，其标准容量增量为零。
 */
public Vector() {
    this(10);
}
/**
 * 构造一个包含指定 collection 中的元素的向量且按迭代器返回元素的顺序排列。
 */
public Vector(Collection<? extends E> c) {
    elementData = c.toArray();
    elementCount = elementData.length;
    // c.toArray might (incorrectly) not return Object[] (see 6260652)
    //c.toArray有可能返回的不是Object[]类型，
    if (elementData.getClass() != Object[].class)
        elementData = Arrays.copyOf(elementData, elementCount, Object[].class);
        //Arrays.copyOf(elementData, elementCount, Object[].class);这个方法就是用来创建1个Object[]数组，这样数组中就可以存放任意对象了。
}
```

常用方法介绍：

> boolean add(E e): 将指定元素添加到此向量的末尾。

```java
public synchronized boolean add(E e) {
    //修改次数+1
    modCount++;
    //扩容
    ensureCapacityHelper(elementCount + 1);
    //元素放到向量末尾
    elementData[elementCount++] = e;
    return true;
}
//保证容量足够
private void ensureCapacityHelper(int minCapacity) {
    //获取现有数组大小
    int oldCapacity = elementData.length;
    //若要求的最小容量大于现有容量，进行扩容
    if (minCapacity > oldCapacity) {
        Object[] oldData = elementData;
        //若设置了增量则为现有容量大小+增量，否则现有容量*2
        int newCapacity = (capacityIncrement > 0) ?
        (oldCapacity + capacityIncrement) : (oldCapacity * 2);
        //若计算后的扩容容量都不满足最小容量要求，本次扩容到最小容量
        if (newCapacity < minCapacity) {
            newCapacity = minCapacity;
         }
         //进行扩容并数组复制
         elementData = Arrays.copyOf(elementData, newCapacity);
    }
}
```

由源码可知，synchronized保证新增同步，扩容方案为：先计算预期扩容大小（容量增量>0，则预期为：现有容量+容量增量，否则为：现有容量*2），计算后与要求的最小容量比较，取最大值。

之所以有计算预期扩容大小，是因为每次add时，扩容为现有容量+要新增的元素个数，如果每次都扩容到刚刚好放所有新元素，则每次都需要扩容，进行数组复制，性能会比较差。

> void add(int index, E element): 在此向量的指定位置插入指定的元素。

```java
public void add(int index, E element) {
    insertElementAt(element, index);
}
public synchronized void insertElementAt(E obj, int index) {
    //修改次数+1
    modCount++;
    //数组越界检查
    if (index > elementCount) {
        throw new ArrayIndexOutOfBoundsException(index
                             + " > " + elementCount);
    }
    //扩容
    ensureCapacityHelper(elementCount + 1);
    //向量扩容并复制
    System.arraycopy(elementData, index, elementData, index + 1, elementCount - index);
    //设置指定索引元素为新元素
    elementData[index] = obj;
    //容量元素数+1
    elementCount++;
}
```

> boolean addAll(Collection c) :将指定 Collection 中的所有元素添加到此向量的末尾，按照指定 collection 的迭代器所返回的顺序添加这些元素。

```java
public synchronized boolean addAll(Collection<? extends E> c) {
    //修改次数+1
    modCount++;
    //获取collection数组
    Object[] a = c.toArray();
    int numNew = a.length;
    //扩容
    ensureCapacityHelper(elementCount + numNew);
    //元素数组复制，扩容，并将添加到向量末尾
    System.arraycopy(a, 0, elementData, elementCount, numNew);
    //更新元素数
    elementCount += numNew;
    //返回是否新增了元素
    return numNew != 0;
}
```

> Eget(int index):返回向量中指定位置的元素

```java
public synchronized E get(int index) {
    //数组边界检查
    if (index >= elementCount)
        throw new ArrayIndexOutOfBoundsException(index);
    return (E)elementData[index];
}
```

> Eset(int index, E element):用指定的元素替换此向量中指定位置处的元素。

```java
public synchronized E set(int index, E element) {
    //数组边界检查
    if (index >= elementCount)
        throw new ArrayIndexOutOfBoundsException(index);
    //获取对应索引原有元素值
    Object oldValue = elementData[index];
    //设置新的元素值
    elementData[index] = element;
    //返回原有元素值
    return (E)oldValue;
}
```

> boolean remove(Object o):引用块内容移除此向量中指定元素的第一个匹配项，如果向量不包含该元素，则元素保持不变。

```java
public boolean remove(Object o) {
   return removeElement(o);
}
public synchronized boolean removeElement(Object obj) {
    //修改次数+1
    modCount++;
    int i = indexOf(obj);
    if (i >= 0) {
        removeElementAt(i);
        return true;
    }
    return false;
}
/**
 *返回此向量中第一次出现的指定元素的索引，如果此向量不包含该元素，则返回 -1。
 */
public int indexOf(Object o) {
    return indexOf(o, 0);
}
/**
 *返回此向量中第一次出现的指定元素的索引，从 index 处正向搜索，如果未找到该元素，则返回 -1。
 */
public synchronized int indexOf(Object o, int index) {
    if (o == null) {
    //元素为NULL
        for (int i = index ; i < elementCount ; i++)
            if (elementData[i]==null)
                return i;
    } else {
        for (int i = index ; i < elementCount ; i++)
            if (o.equals(elementData[i]))
                return i;
    }
    return -1;
}
```

由源码可看成之所以判断元素是否为NULL，是NULL则使用“==”匹配，否则使用equals，是为了防止NULL也使用equals会出现空指针异常。

> Eremove(int index): 移除此向量中指定位置的元素。

```java
public synchronized E remove(int index) {
    //修改次数+1
    modCount++;
    //数组边界检查
    if (index >= elementCount)
        throw new ArrayIndexOutOfBoundsException(index);
    //获取原有数值    
    Object oldValue = elementData[index];
    //计算要移动的元素数
    int numMoved = elementCount - index - 1;
    if (numMoved > 0)
        //复制元素，并将元素整体前移一位，从索引index+1开始
        //此时倒数第二个元素和末尾元素相同
        System.arraycopy(elementData, index+1, elementData, index,
                 numMoved);
    //设置末尾为空，等待垃圾回收              
    elementData[--elementCount] = null; // Let gc do its work
    //返回被移除的元素
    return (E)oldValue;
}
```

> boolean removeAll(Collection c):从此向量中移除包含在指定 Collection 中的所有元素。

```java
public synchronized boolean removeAll(Collection<?> c) {
        //调用的父类(AbstractList)的父类(AbstractCollection)
        return super.removeAll(c);
}
/**
 * 移除此 collection 中那些也包含在指定 collection 中的所有元素（可选操作）。
 */
public boolean removeAll(Collection<?> c) {
    boolean modified = false;
    Iterator<?> e = iterator();
    while (e.hasNext()) {
        if (c.contains(e.next())) {
        e.remove();
        modified = true;
        }
    }
    return modified;
}
```

> Iterator iterator(): 返回以恰当顺序在此列表的元素上进行迭代的迭代器。
>
> Vector其实没有重写此方法，下面源码是其父类的。

```java
/**
 *AbstractList父类的方法，具体参照前面文章
 */
public Iterator<E> iterator() {
    return new Itr();
}
```
