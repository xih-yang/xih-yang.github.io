# 05、Java集合：List之CopyOnWriteArrayList
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/5.html
- 分类：Java并发
- 分组：教程目录
## 1.CopyOnWrite

Copy-On-Write简称COW，是一种用于程序设计中的优化策略。CopyOnWrite容器即写时复制的容器。通俗的理解是当往一个容器添加元素的时候，不直接往当前容器添加，而是先将当前容器进行Copy，复制出一个新的容器，然后新的容器里添加元素，添加完元素之后，再将原容器的引用指向新的容器。这样做的好处是可以对CopyOnWrite容器进行并发的读，而不需要加锁，因为当前容器不会添加任何元素。所以CopyOnWrite容器也是一种读写分离的思想，读和写不同的容器。

CopyOnWrite并发容器用于读多写少的并发场景。

复制用法导致内存占用可能过高。

保证数据最终一致性，无法保证实时一致性。

## 2.CopyOnWriteArrayList

> public class CopyOnWriteArrayList
>
> implements List, RandomAccess, Cloneable, java.io.Serializable

**1、** ArrayList的一个线程安全的变体，其中所有可变操作（add、set等等）都是通过对底层数组进行一次新的复制来实现的；

**2、** 内存一致性效果：当存在其他并发collection时，将对象放入CopyOnWriteArrayList之前的线程中的操作happen-before随后通过另一线程从CopyOnWriteArrayList中访问或移除该元素的操作；

> 成员变量

```java
//非序列化的可重入的互斥锁
transient final ReentrantLock lock = new ReentrantLock();
//非序列化且保证可见性的数组
private volatile transient Object[] array;
```

> 构造方法

```java
/**
 * 创建一个空列表
 */
public CopyOnWriteArrayList() {
    setArray(new Object[0]);
}
/**
 * 创建一个按 collection 的迭代器返回元素的顺序包含指定 collection 元素的列表。
 */
public CopyOnWriteArrayList(Collection<? extends E> c) {
//转换成数组
Object[] elements = c.toArray();
// c.toArray might (incorrectly) not return Object[] (see 6260652)
//类型不匹配，通过复制来转换数组类型
if (elements.getClass() != Object[].class)
    elements = Arrays.copyOf(elements, elements.length, Object[].class);
//给成员变量array数组复制
setArray(elements);
}
    /**
     * 创建一个保存给定数组的副本的列表。
     */
public CopyOnWriteArrayList(E[] toCopyIn) {
    setArray(Arrays.copyOf(toCopyIn, toCopyIn.length,   Object[].class));
}
```

> int size(): 返回此列表中的元素数。

```java
public int size() {
   return getArray().length;
 }
```

> add方法：add，addIfAbsent

```java
//将指定元素添加到此列表的尾部。
public boolean add(E e) {
    final ReentrantLock lock = this.lock;
    //一直等待直到获取到锁
    lock.lock();
    try {
        Object[] elements = getArray();//获取元素数组
        int len = elements.length;//获取数组长度
        //将数组进行复制生成新数组，长度+1
        Object[] newElements = Arrays.copyOf(elements, len + 1);
        newElements[len] = e;//将新增元素e放在列表队尾
        setArray(newElements);//将新数组值替换原数组
        return true;
    } finally {
        lock.unlock();//释放锁
    }
}
    /**
     * 在此列表的指定位置上插入指定元素。
     */
public void add(int index, E element) {
    final ReentrantLock lock = this.lock;
    //一直等待直到获取锁
    lock.lock();
    try {
        Object[] elements = getArray();
        int len = elements.length;
        //数组边界检查
        if (index > len || index < 0)
        throw new IndexOutOfBoundsException("Index: "+index+
                            ", Size: "+len);
        Object[] newElements;
        int numMoved = len - index;
        if (numMoved == 0)//添加到列表队尾
            newElements = Arrays.copyOf(elements, len + 1);
        else {
            //new一个新的空数组
            newElements = new Object[len + 1];
            //复制原有数组数据(索引为0至index-1)到新数组(从索引0开始)
            System.arraycopy(elements, 0, newElements, 0, index);
            //复制原有数组数据(索引为index-1至最后)到新数组(从索引index开始)
            System.arraycopy(elements, index, newElements, index + 1,
                 numMoved);
        }
        //设置指定索引index元素为element
        newElements[index] = element;
        //将改动后的新数组替换原有数组
        setArray(newElements);
    } finally {
        //释放锁
        lock.unlock();
    }
}
/**
*添加元素（如果不存在）。
*/
public boolean addIfAbsent(E e) {
    final ReentrantLock lock = this.lock;
    //一直等待直到获取锁
    lock.lock();
    try {
        //获取现有数组
        Object[] elements = getArray();
        int len = elements.length;
        //new一个新的空数组，长度+1,为了添加新元素
        Object[] newElements = new Object[len + 1];
        for (int i = 0; i < len; ++i) {
            //判断两个元素对象是否相同
            if (eq(e, elements[i]))//相同，直接退出add方法
                return false; // exit, throwing away copy
            else
                newElements[i] = elements[i];//不相同，进行数组逐个复制
        }
        //元素不存在，将元素放至列表尾部
        newElements[len] = e;
        //将新添加好的数组替换原有数组
        setArray(newElements);
        return true;
    } finally {
        lock.unlock();//释放锁
    }
}
//匹配两个对象是否相同，注意使用的equals  
private static boolean eq(Object o1, Object o2) {
    return (o1 == null ? o2 == null : o1.equals(o2));
}
/**
*按照指定 collection 的迭代器返回元素的顺序，将指定 collection 中尚未包含在此列表中的所有元素添加列表的尾部。
*return 添加的元素数量
*/
public int addAllAbsent(Collection<? extends E> c) {
    //将collection转换成数组
    Object[] cs = c.toArray();
    if (cs.length == 0)
        return 0;//collection中无元素，return 添加元素数量为0
    //new新数组    
    Object[] uniq = new Object[cs.length];
    final ReentrantLock lock = this.lock;
    //一直等待直到获取锁
    lock.lock();
    try {
        //获取原有数组
        Object[] elements = getArray();
        int len = elements.length;
        //遍历要新增的集合，且排重
        for (int i = 0; i < cs.length; ++i) { // scan for duplicates
        Object e = cs[i];
        //判断要添加的元素e在原有数组是否已存在
        //判断要添加的元素e在临时new的新数组uniq中是否已存在
        //都不存在，则添加元素e至临时new的新数组uniq中
        if (indexOf(e, elements, 0, len) < 0 &&
            indexOf(e, uniq, 0, added) < 0)
            uniq[added++] = e;
        }
        //有添加新的元素，进行数组复制
        if (added > 0) {
            //复制原有数组到新的数组中，size为原有数组size+本次新增个数
            Object[] newElements = Arrays.copyOf(elements, len + added);
            //复制要新增的元素数组到上一步骤的数组的尾部
            System.arraycopy(uniq, 0, newElements, len, added);
            //将新的数组(原有数组+本次新增)替换原有数组
            setArray(newElements);
        }
        return added;//返回新增个数
    } finally {
        lock.unlock();//释放锁
    }
}
```

由源码可知，add和addIfAbsent方法差别在添加时，后者有排重判断，若原有数组中不存在，则新增，否则什么也不做。且在排重的同时，收集要新增的元素，最后进行数组复制并替换原有数组。

addIfAbsent单个元素时，排重同时数组复制，避免了System.arraycopy步骤。

> remove方法：remove(int index) ，remove(Object o) ，removeAll(Collection c)

```java
/**
* 移除此列表指定位置上的元素。
*/
public E remove(int index) {
    final ReentrantLock lock = this.lock;
    //一直等待直到获取锁
    lock.lock();
    try {
        //获取原有数组
        Object[] elements = getArray();
        int len = elements.length;
        //获取指定索引对应的元素
        Object oldValue = elements[index];
        //计算要移动的元素个数
        int numMoved = len - index - 1;
        if (numMoved == 0)
            //要移除的元素在队尾，直接进行元素复制且截取并替换原有数组
            setArray(Arrays.copyOf(elements, len - 1));
        else {
            //new临时数组，长度为原有数组size-1
            Object[] newElements = new Object[len - 1];
            //复制索引从0到指定index之前的数组到newElements
            System.arraycopy(elements, 0, newElements, 0, index);
            //复制索引从index+1到队尾的数组到newElements
            System.arraycopy(elements, index + 1, newElements, index,
                 numMoved);
            //替换原有数组         
            setArray(newElements);
        }
        //以前在指定位置的元素
        return (E)oldValue;
    } finally {
        lock.unlock();//释放锁
    }
}
/**
 *从此列表移除第一次出现的指定元素（如果存在）。
 */
public boolean remove(Object o) {
    final ReentrantLock lock = this.lock;
    //一直等待直到获取锁
    lock.lock();
    try {
        //获取原有数组
        Object[] elements = getArray();
        int len = elements.length;
        if (len != 0) {
        int newlen = len - 1;
        //new一个新数组，长度为原有数组size-1
        Object[] newElements = new Object[newlen];
        for (int i = 0; i < newlen; ++i) {
            if (eq(o, elements[i])) {
                //找到对应元素，将其后面的所有元素放入新数组中
                for (int k = i + 1; k < len; ++k)
                    newElements[k-1] = elements[k];
                //新数组替换原有数组    
                setArray(newElements);
                return true;
            } else
                //未找到对应数组，将数组copy至新数组汇总
                newElements[i] = elements[i];
        }
        //因上面循环未循环原有数组最后一个元素，故有下面的判断
        // 判断要移除的元素是否在列表尾部
        if (eq(o, elements[newlen])) {
            //在尾部，直接将newElements替换原有数组
            setArray(newElements);
            return true;
        }
        }
        return false;
    } finally {
        lock.unlock();//释放锁
    }
}
/**
 *从此列表移除所有包含在指定 collection 中的元素。
 */
public boolean removeAll(Collection<?> c) {
    final ReentrantLock lock = this.lock;
    //一直等待直到获取锁
    lock.lock();
    try {
        //获取原有数组
        Object[] elements = getArray();
        int len = elements.length;
        if (len != 0) {
    //原有数组有数据
            int newlen = 0;
            //new 临时数组
            Object[] temp = new Object[len];
            for (int i = 0; i < len; ++i) {
                Object element = elements[i];
                //如果要移除的元素中不包含当前集合中的元素，则元素复制
                if (!c.contains(element))
                    temp[newlen++] = element;
            }
        if (newlen != len) {
    //原有长度与新数组长度不相等，说明有元素被移除
            //将新数组复制并替换原有数组，newlen<len
            setArray(Arrays.copyOf(temp, newlen));
            return true;
        }
      }
        return false;
    } finally {
        lock.unlock();//释放锁
    }
}
```

removem某元素时，匹配的同时，进行数组copy，避免了System.arraycopy步骤。

remove某Collection时，是用Collection判断元素是否存在，同时进行数组复制，便于最终新数组替换原有数组。

> Eset(int index, E element): 用指定的元素替代此列表指定位置上的元素。

```java
public E set(int index, E element) {
    final ReentrantLock lock = this.lock;
    ////一直等待直到获取锁
    lock.lock();
    try {
        //获取原有数组
        Object[] elements = getArray();
        //获取指定索引的元素
        Object oldValue = elements[index];
        //判断两个元素是否相同
        if (oldValue != element) {
            int len = elements.length;
            //复制原有数组到新数组
            Object[] newElements = Arrays.copyOf(elements, len);
            //设置指定索引的元素为新element
            newElements[index] = element;
            setArray(newElements);
        } else {
            // Not quite a no-op; ensures volatile write semantics
            setArray(elements);
        }
        return (E)oldValue;
    } finally {
        lock.unlock();
    }
 }
```

初看源码时，疑惑newElements[index] = element;为什么不能改成elements[index] = element;从而省却Arrays.copyOf步骤，其实是自己进入了误区，因Object[] elements = getArray();获取的是引用地址，若使用elements[index] = element;则相当于原有的数组被改动了，没有做到读写分离。

比如indexOf，contains，toArray，get等方法都使用到了getArray()，会受到影响。

判断两个元素是否相同时：oldValue != element，使用了“==”号，当类未重写hashCode与equals时，“==”与equals是等价的，只是普遍习惯比较值相等时使用equals，对象是否相同时使用“==”。

Object.equals()源码：

```java
 public boolean equals(Object obj) {
    return (this == obj);
}
```

> Iterator iterator():返回以恰当顺序在此列表元素上进行迭代的迭代器。

```java
public Iterator<E> iterator() {
    //返回可遍历Iterator，游标从0开始
    return new COWIterator<E>(getArray(), 0);
}
```

> 内部类COWIterator：private static class COWIterator implements ListIterator

```java
private static class COWIterator implements ListIterator {
        /** 数组快照 **/
        private final Object[] snapshot;
        /** 游标  */
        private int cursor;
        private COWIterator(Object[] elements, int initialCursor) {
            cursor = initialCursor;
            snapshot = elements;
        }
        //判断是否有下一个元素
        public boolean hasNext() {
            return cursor < snapshot.length;
        }
        //判断是否有前一个元素
        public boolean hasPrevious() {
            return cursor > 0;
        }
        //获取下一个元素
        public E next() {
        if (! hasNext())
                throw new NoSuchElementException();
        return (E) snapshot[cursor++];
        }
        //获取前一个元素
        public E previous() {
        if (! hasPrevious())
                throw new NoSuchElementException();
        return (E) snapshot[--cursor];
        }
        //获取下一个游标
        public int nextIndex() {
            return cursor;
        }
        //获取前一个游标
        public int previousIndex() {
            return cursor-1;
        }
        //遍历时，迭代器不能移除数组元素
        public void remove() {
            throw new UnsupportedOperationException();
        }
        //遍历时，迭代器不能设置数组元素
        public void set(E e) {
            throw new UnsupportedOperationException();
        }
        //遍历时，迭代器不能新增数组元素
        public void add(E e) {
            throw new UnsupportedOperationException();
        }
}   
```
