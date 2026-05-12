# 26、数据结构与算法 - 基础：BlockingDeque
- 来源：https://ddkk.com/zhuanlan/algorithm/3/26.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

BlockingDeque支持在获取元素时等待双端变为非空的阻塞操作，并在存储元素时等待双端面中的空间变为可用。

方法有四种形式，具有不同的处理操作的方式：

- 第一种抛出异常。
- 第二种返回特殊值（ null 或 false，取决于操作）。
- 第三种无限期地阻塞当前线程，直到操作可以成功。
- 第四种阻塞在放弃之前只在给定的最大时间限制内。

```java
public interface BlockingDeque<E> extends BlockingQueue<E>, Deque<E>
```

```java
2、BlockingDeque阻塞方法摘要
* 第一个元素（头部）
*              引发异常        返回特殊值         阻塞           时间内阻塞
* 插入        addFirst(e)     offerFirst(e)   putFirst(e)    offerFirst(e, time, unit)
* 获取并删除   removeFirst()   pollFirst()     takeFirst()    pollFirst(time, unit)
* 获取        getFirst()       peekFirst()        ✘              ✘
*
* 最后一个元素（尾部）
*              引发异常        返回特殊值         阻塞            时间内阻塞
* 插入        addLast(e)      offerLast(e)     putLast(e)    offerLast(e, time, unit)
* 获取并删除  removeLast()     pollLast()      takeLast()     pollLast(time, unit)
* 获取       getLast()        peekLast()          ✘              ✘
```

**3、**与 BlockingQueue一样， BlockingDeque 是线程安全的，不允许空元素，并且可能（或可能不）受容量限制（未指定时默认：Integer.MAX_VALUE）。

实现BlockingDeque 可以直接用作 FIFO BlockingQueue。从接口继承 BlockingQueue 的方法与下表中指示的方法完全相同 BlockingDeque ：

**BlockingQueue 和 BlockingDeque 方法的比较:**

```java
*      BlockingQueue 方法     等效的 BlockingDeque 方法
* 插入    add(e)                  addLast(e)
*        offer(e)               offerLast(e)
*         put(e)                putLast(e)
*     offer(e, time, unit)     offerLast(e, time, unit)
* 删除
*      remove()                removeFirst()
*      poll()                  pollFirst()
*      take()                  takeFirst()
*   poll(time, unit)         pollFirst(time, unit)
* 获取
*      element()               getFirst()
*      peek()                  peekFirst()
```

**4、方法详解**

```java
public interface BlockingDeque<E> extends BlockingQueue<E>, Deque<E> {
    /**
     * 如果可以在不违反容量限制的情况下立即插入指定的元素，则在此 deque 的前面插入指定的元素，如果当前没有可用空间，则抛出一个 IllegalStateException 。
     * 使用容量受限的双端面时，通常最好使用 offerFirst。
     * 重写Deque 的 addFirst 方法
     * 参数：e – 要添加的元素
     * 抛出：IllegalStateException – 如果由于容量限制而此时无法添加元素
     */
    void addFirst(E e);
    /**
     * 如果可以在不违反容量限制的情况下立即插入指定的元素，则在此 deque 的末尾插入指定的元素，如果当前没有可用空间，则抛出 IllegalStateException。
     * 使用容量受限的双端面时，通常最好使用 offerLast。
     * 重写：Deque 中  addLast 方法
     * 参数：e – 要添加的元素
     * 抛出：IllegalStateException – 如果由于容量限制而此时无法添加元素
     * @param e
     */
    void addLast(E e);
    /**
     * 如果可以在不违反容量限制的情况下立即插入指定的元素。
     * 使用容量受限的双端式时，此方法通常比方法更addFirst可取，addFirst方法只能通过引发异常来插入元素。
     * 重写：Deque 中的 offerFirst 方法
     * 参数：e – 要添加的元素
     * 返回：true 如果元素已添加到此双端，否则 false
     */
    boolean offerFirst(E e);
    /**
     * 如果可以在不违反容量限制的情况下立即插入指定的元素。
     * 使用容量受限的双端式时，此方法通常比方法更addLast可取，该方法只能通过引发异常来插入元素。
     * 重写：offerLast 在界面中 Deque
     * 参数：e – 要添加的元素
     * 返回：true 如果元素已添加到此双端，否则 false
     */
    boolean offerLast(E e);
    /**
     * 在此双端插入指定的元素，并在必要时等待空间可用。
     *
     * 参数：e – 要添加的元素
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    void putFirst(E e) throws InterruptedException;
    /**
     * 在此双端的末尾插入指定的元素，并在必要时等待空间可用。
     * 参数：e – 要添加的元素
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    void putLast(E e) throws InterruptedException;
    /**
     * 将指定的元素插入此双端的前面，并在必要时等待指定的等待时间，以使空间可用。
     *
     * 参数：e – 要添加的元素
     * 超时 – 放弃前等待多长时间，单位为 unit
     * 单位 – TimeUnit 确定如何解释 timeout 参数
     * 返回：true 如果成功，或者 false 指定的等待时间已过后才有可用空间
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    boolean offerFirst(E e, long timeout, TimeUnit unit)
            throws InterruptedException;
    /**
     * 在此双端的末尾插入指定的元素，并在必要时等待指定的等待时间，以使空间可用。
     * 参数：
     * e – 要添加的元素
     * 超时 – 放弃前等待多长时间，单位为 unit
     * 单位 – TimeUnit 确定如何解释 timeout 参数
     * 返回：true 如果成功，或者 false 指定的等待时间已过后才有可用空间
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    boolean offerLast(E e, long timeout, TimeUnit unit)
            throws InterruptedException;
    /**
     * 检索并删除此双端面的第一个元素，如有必要，请等待，直到元素可用。
     * 返回：第一个元素
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    E takeFirst() throws InterruptedException;
    /**
     * 检索并删除此双端面的最后一个元素，并在必要时等待，直到元素可用。
     *
     * 返回：最后一个元素
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    E takeLast() throws InterruptedException;
    /**
     * 检索并删除此双端面的第一个元素，并在必要时等待指定的等待时间，以使元素变为可用。
     * 参数：
     * 超时 – 放弃前等待多长时间，单位为 unit
     * 单位 – TimeUnit 确定如何解释 timeout 参数
     * 返回：此 deque 的头部，或者 null 如果指定的等待时间经过，元素可用
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    E pollFirst(long timeout, TimeUnit unit)
            throws InterruptedException;
    /**
     * 检索并删除此双端面的最后一个元素，并在必要时等待指定的等待时间，以使元素变为可用。
     * 参数：
     * 超时 – 放弃前等待多长时间，单位为 unit
     * 单位 – TimeUnit 确定如何解释 timeout 参数
     * 返回：此双端的尾部，或者 null 如果指定的等待时间经过，元素可用
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    E pollLast(long timeout, TimeUnit unit)
            throws InterruptedException;
}
```
