# 24、数据结构与算法 - 基础：Deque
- 来源：https://ddkk.com/zhuanlan/algorithm/3/24.html
- 分类：数据结构
- 分组：教程目录
**Java数据结构和算法（二十四）-- Deque**

**1、简介**

支持在两端插入和移除元素的线性集合。 deque 这个名字是“Double-ended queues”的缩写。此接口定义访问双端元素的方法。提供了插入、删除和获取元素的方法。这些方法中的每一个都以两种形式存在：一种在操作失败时引发异常，另一种返回特殊值（ null 或 false，具体取决于操作）。后一种形式的插入操作专门设计用于容量受限 Deque 的实现;在大多数实现中，插入操作不会失败。

```java
public interface Deque<E> extends Queue<E>
```

```java
2、Deque方法摘要
```

```java
*                    第一个元素（头部）               最后一个元素（尾部）
* 操作         引发异常          返回特殊值         引发异常       特殊价值
* 插入        addFirst(e)      offerFirst(e)    addLast(e)     offerLast(e)
* 获取并删除   removeFirst()    pollFirst()      removeLast()   pollLast()
* 获取        getFirst()        peekFirst()      getLast()      peekLast()
```

**3、此接口继承了Queue接口。当双端用作 FIFO（先进先出）行为队列时 Deque的部分方法与 Queue的等价：**

```java
* Queue 方法    等效 Deque 的方法
* add(e)         addLast(e)
* offer(e)       offerLast(e)
* remove()       removeFirst()
* poll()         pollFirst()
* element()      getFirst()
* peek()         peekFirst()
```

**4、Deque 也可以用作LIFO（后进先出）堆栈。应优先使用此接口而不是旧 Stack 类。当双端面用作堆栈时，元素将从双端的开头推送和弹出。**

*** 堆栈方法与下表所示的方法完全相同 Deque：**

```java
* 堆栈方法   等效 Deque 方法
* push(e)    addFirst(e)
* pop()      removeFirst()
* peek()     peekFirst()
```

**5、Deque方法详解**

```java
public interface Deque<E> extends Queue<E> {
    /**
     * 如果可以在不违反容量限制的情况下立即插入指定的元素，则在此 deque 的前面插入指定的元素，如果当前没有可用空间，则抛出一个 IllegalStateException 。
     * 当使用容量受限的双端面时，通常最好使用方法 offerFirst。
     * 抛出：IllegalStateException – 如果由于容量限制而此时无法添加元素
     * @param e 要添加的元素
     */
    void addFirst(E e);
    /**
     * 如果可以在不违反容量限制的情况下立即插入指定的元素，则在此 deque 的末尾插入指定的元素，如果当前没有可用空间，则抛出 IllegalStateException 。
     * 当使用容量受限的双端面时，通常最好使用方法 offerLast。
     * 此方法等效于 add。
     * 抛出：IllegalStateException – 如果由于容量限制而此时无法添加元素
     * @param e 要添加的元素
     */
    void addLast(E e);
    /**
     * 将指定的元素插入到此双端的前面，除非它违反了容量限制。使用容量受限的双端式时，此方法通常比方法更 addFirst 可取，该方法只能通过引发异常来插入元素。
     * 返回：true 如果元素已添加到此双端，否则 false
     * @param e 要添加的元素
     */
    boolean offerFirst(E e);
    /**
     * 在此双端插入指定的元素，除非它违反了容量限制。使用容量受限的双端式时，此方法通常比方法更 addLast 可取，该方法只能通过引发异常来插入元素。
     * 返回：true 如果元素已添加到此双端，否则 false
     * @param e 要添加的元素
     */
    boolean offerLast(E e);
    /**
     * 检索并删除此双端面的第一个元素。此方法的不同 pollFirst 之处仅在于如果此 deque 为空，则会引发异常。
     * 抛出：NoSuchElementException – 如果此 deque 为空
     */
    E removeFirst();
    /**
     * 检索并删除此双端面的最后一个元素。此方法的不同 pollLast 之处仅在于如果此 deque 为空，则会引发异常。
     * 抛出：NoSuchElementException – 如果此
     */
    E removeLast();
    /**
     * 检索并删除此双端面的第一个元素，如果此双端面为空，则返回 null 。
     * 返回：此Deque的头部，或者 null 如果此双端为空
     */
    E pollFirst();
    /**
     * 检索并删除此双端面的最后一个元素，如果此双端面为空，则返回 null 。
     * 返回：此双端面的尾部，或者 null 如果此双端面为空
     */
    E pollLast();
    /**
     * 检索但不删除此双端面的第一个元素。此方法的不同 peekFirst 之处仅在于如果此 deque 为空，则会引发异常。
     * 返回：这个Deque的头
     * 抛出：NoSuchElementException – 如果此 deque 为空
     */
    E getFirst();
    /**
     * 检索但不删除此双端面的最后一个元素。此方法的不同 peekLast 之处仅在于如果此 deque 为空，则会引发异常。
     * 返回：这Deque的尾巴
     * 抛出：NoSuchElementException – 如果此 deque 为空
     */
    E getLast();
    /**
     * 检索但不删除此双端面格式的第一个元素，如果此双端面为空，则返回 null 。
     * 返回：此双克的头部，或者 null 如果此双端为空
     */
    E peekFirst();
    /**
     * 检索但不删除此双端面的最后一个元素，如果此双端面为空，则返回 null 。
     * 返回：此双端面的尾部，或者 null 如果此双端面为空
     */
    E peekLast();
    /**
     * 从此双端队列中删除指定元素的第一个匹配项。如果双端不包含元素，则保持不变。更正式地说，删除第一个元素 e ，
     * 使得 （o==null ？ e==null ： o.equals（e））（ 如果存在这样的元素）。如果此双端面包含指定的元素（或者等效地，如果此双端面由于调用而更改），则返回 true 。
     * 参数：o – 要从此 deque 中删除的元素（如果存在）
     * 返回：true 如果由于此调用而删除了元素
     */
    boolean removeFirstOccurrence(Object o);
    /**
     * 从此双端面中删除指定元素的最后一次出现。如果双端不包含元素，则保持不变。更正式地说，删除最后一个元素 e ，使得 （o==null ？ e==null ： o.equals（e））
     * （ 如果存在这样的元素）。如果此双端面包含指定的元素（或者等效地，如果此双端面由于调用而更改），则返回 true 。
     * 参数：o – 要从此 deque 中删除的元素（如果存在）
     * 返回：true 如果由于此调用而删除了元素
     */
    boolean removeLastOccurrence(Object o);
}
```
