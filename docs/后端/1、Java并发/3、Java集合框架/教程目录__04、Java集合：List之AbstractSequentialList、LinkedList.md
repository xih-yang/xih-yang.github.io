# 04、Java集合：List之AbstractSequentialList、LinkedList
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/4.html
- 分类：Java并发
- 分组：教程目录
## 1.AbstractSequentialList

> public abstract class AbstractSequentialList extends AbstractList

提供了 List 接口的骨干实现，从而最大限度地减少了实现受“连续访问”数据存储（如链接列表）支持的此接口所需的工作。

支持数据的按次序顺序访问，对于随机访问数据（如数组），应该优先使用 AbstractList，而不是先使用此类。

LinkedList的父类，主要是为支持LinkedList的链式访问。

提供一个友好的构造方法及在 AbstractList 的基础上实现了以下方法：

## 2.LinkedList

> public class LinkedList extends AbstractSequentialList implements List, Deque

- List 接口的链接列表实现，支持序列化、有序、值可为NULL。
- 双向链表且允许将链接列表用作堆栈、队列或双端队列。
- 适用于随机的快速插入和删除。
- 非同步，fail-fast。
- 队列FIFO(先进先出)，LIFO(后进先出)栈。

> 构造函数

```java
//默认构造函数
public LinkedList() {
    header.next = header.previous = header;
}
//根据已有Collection，创建一个LinkedList集合
public LinkedList(Collection<? extends E> c) {
    this();
    addAll(c);
}
```

> 成员变量

```java
 //链表实现的重要内部类，双端链表表头
 private transient Entry<E> header = new Entry<E>(null, null, null);
 private transient int size = 0;//列表的元素个数
```

> 内部类Entry的成员变量及构造方法

```java
private static class Entry<E> {
E element;//当前节点元素值
Entry<E> next;//当前节点元素的下一个节点元素
Entry<E> previous;//当前节点元素的上一个节点元素
Entry(E element, Entry<E> next, Entry<E> previous) {
    this.element = element;
    this.next = next;
    this.previous = previous;
}
}
```

常用方法介绍

> boolean add(E e):将指定元素添加到此列表的结尾。

```java
//添加元素到列表的结尾
public boolean add(E e) {
    addBefore(e, header);
    return true;
}
//与add方法效果等同，只是add多了返回值
public void addLast(E e) {
    addBefore(e, header);
}
//
private Entry<E> addBefore(E e, Entry<E> entry) {
    //实例化指定的元素e且e的前一个元素为当前队尾元素
    //设置指定元素e的下一个元素为header
    Entry<E> newEntry = new Entry<E>(e, entry, entry.previous);
    //设置当前队尾元素的下一个元素指向指定元素e
    newEntry.previous.next = newEntry;
    //设置头结点header的前一个元素指向指定元素e
    newEntry.next.previous = newEntry;
    /**由此上面三行代码已将元素e插入到队尾**/
    //集合元素数+1
    size++;
    //集合元素变动次数+1
    modCount++;
    //返回新元素e的Entry
    return newEntry;
}
```

> void add(int index, E element): 在此列表中指定的位置插入指定的元素。

```java
public void add(int index, E element) {
        //当索引等于元素数时，刚好插入队尾，否则计算索引对应节点
        addBefore(element, (index==size ? header : entry(index)));
}
//找到对应索引的entry
private Entry<E> entry(int index) {
    //判断数组是否越界
    if (index < 0 || index >= size)
        throw new IndexOutOfBoundsException("Index: "+index+
                                            ", Size: "+size);
    Entry<E> e = header;
    //size >> 1 等价于size/2
    //二分法比较索引的大概位置
    if (index < (size >> 1)) {
        //索引靠近头部
        for (int i = 0; i <= index; i++)
            //索引向后移，找到对应索引entry
            e = e.next;
    } else {
        //索引靠近尾部
        for (int i = size; i > index; i--)
            //索引向前移，找到对应索引entry
            e = e.previous;
    }
    return e;
}
```

由add源码可知，新增时只需修改对应节点元素及前后元素的previous及next引用即可。

> void clear() :从此列表中移除所有元素。

```java
public void clear() {
    Entry<E> e = header.next;
    //从头结点的后next元素开始，移除所有元素
    while (e != header) {
        Entry<E> next = e.next;
        e.next = e.previous = null;
        e.element = null;
        e = next;
    }
    //移除头结点
    header.next = header.previous = header;
    //重置列表元素素
    size = 0;
    //列表修改次数+1
    modCount++;
}
```

> remove方法系列

```java
 //从此列表中移除首次出现的指定元素（如果存在）
public boolean remove(Object o) {
    if (o==null) {
        //元素为空，遍历列表，找到o对应的entry，进行移除
        for (Entry<E> e = header.next; e != header; e = e.next) {
            if (e.element==null) {
                remove(e);
                return true;
            }
        }
    } else {
        //元素不为空，遍历列表，找到o对应的entry，进行移除
        //注意：Entry没有重写equals和hashCode方法
        for (Entry<E> e = header.next; e != header; e = e.next) {
            if (o.equals(e.element)) {
                remove(e);
                return true;
            }
        }
    }
return false;
}
//移除指定索引位置的元素
public E remove(int index) {
    return remove(entry(index));
}
//获取并移除此列表的头（第一个元素）。
public E remove() {
    return removeFirst();
}
//获取并移除此列表的头（第一个元素）。
public E removeFirst() {
    return remove(header.next);
}
//移除指定Entry
private E remove(Entry<E> e) {
    if (e == header)
        throw new NoSuchElementException();
        E result = e.element;
        //e元素的前一个元素的下一个元素指向e元素的下一个元素
        e.previous.next = e.next;
        //e元素的下一个元素的前一个元素指向e元素的前一个元素
        e.next.previous = e.previous;
        //将e元素的前、下一个元素均置NULL
        e.next = e.previous = null;
        //将e元素的值置NULL
        e.element = null;
        /**以上步骤将移元素移走，并元素置NULL等待垃圾回收**/
        //列表元素数减一
        size--;
        //列表修改次数+1
        modCount++;
        //返回被移除的元素
        return result;
}
```

由上述源码可见，无论是移除指定Object或者指定索引元素，最终调用remove，更新要被移除元素的前一个元素的后一个元素引用及后一个元素的前一个元素引用，并将要被移除元素entry成员变量均置NULl，等待垃圾回收。

> boolean offer(E e):将指定元素添加到此列表的末尾（最后一个元素）。

```java
public boolean offer(E e) {
        return add(e);//由此可见offer等同于add(E e)
}
//offer和offerLast等价
public boolean offerLast(E e) {
        addLast(e);
        return true;
}
```

由源码可知，add和offer在实现上底层是一样的，之所以存在这种情况，是因为add是实现List接口，offer是实现Deque接口。

使用场景

- 作为List使用时,一般采用add / get方法来加入/获取对象
- 作为Deque使用时,采用 offer/poll/peek等方法
- 作为Stack使用时,采用pop/push等方法

> void push(E e): 将元素推入此列表所表示的堆栈。

```java
public void push(E e) {
   addFirst(e);//将指定元素插入此列表的开头。
}
```

> peek(): 获取但不移除此列表的头（第一个元素）。

```java
public E peek() {
        if (size==0)
            return null;
        return getFirst();
}
//返回此列表的第一个元素。
public E getFirst() {
    if (size==0)
        throw new NoSuchElementException();
    return header.next.element;
}
```

> poll(): 获取并移除此列表的头（第一个元素）

```java
public E poll() {
        if (size==0)
            return null;
        return removeFirst();
}
//移除并返回此列表的第一个元素。
public E removeFirst() {
    return remove(header.next);//remove前面有讲
}
```

> Epop(): 从此列表所表示的堆栈处弹出一个元素。即移除并返回此列表的第一个元素。

```java
public E pop() {
    return removeFirst();//移除并返回此列表的第一个元素。
}
```
