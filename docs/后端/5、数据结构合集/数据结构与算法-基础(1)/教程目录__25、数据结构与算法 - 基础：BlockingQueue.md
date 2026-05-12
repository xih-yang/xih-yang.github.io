# 25、数据结构与算法 - 基础：BlockingQueue
- 来源：https://ddkk.com/zhuanlan/algorithm/3/25.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

BlockingQueue 实现设计为主要用于生产者-消费者队列，其实现是线程安全的。所有排队方法都使用内部锁或其他形式的并发控制以原子方式实现其效果

支持在获取元素时等待队列变为非空，并在存储元素时等待队列中的空间变为可用的操作。

方法有四种形式，具有不同的处理操作的方式：

- 第一种抛出异常。
- 第二种返回特殊值（ null 或 false，取决于操作）。
- 第三种无限期地阻塞当前线程，直到操作可以成功。
- 第四种只在给定的最大时间限制内阻塞。

```java
public interface BlockingQueue<E> extends Queue<E>
```

**2、阻塞队列方法摘要**

```java
*            引发异常    返回特殊值    阻塞      指定时间内阻塞
* 插入         add(e)    offer(e)    put(e)     offer(e, time, unit)
* 获取并删除   remove()   poll()     take()      poll(time, unit)
* 获取        element()   peek()      ✘          ✘
```

**3、方法详解**

```java
public interface BlockingQueue<E> extends Queue<E> {
    /**
     * 如果可以在不违反容量限制的情况下立即将指定的元素插入到此队列中，则在成功时返回 true ，如果当前没有可用空间，则抛出一个 IllegalStateException 。
     * 使用容量受限队列时，通常最好使用 offer。
     * 抛出：IllegalStateException – 如果由于容量限制而此时无法添加元素
     * @param e 要添加的元素
     */
    boolean add(E e);
    /**
     * 如果可以在不违反容量限制的情况下立即将指定的元素插入到此队列中，则在成功false时返回true，并且当前没有可用空间。
     * 使用容量受限队列时，此方法通常比 更可取，add后者只能通过引发异常来插入元素。
     * 参数：e – 要添加的元素
     * 返回：true 如果元素已添加到此队列中，否则 false
     */
    boolean offer(E e);
    /**
     * 将指定的元素插入到此队列中，并在必要时等待空间可用。
     * 参数：e – 要添加的元素
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    void put(E e) throws InterruptedException;
    /**
     * 将指定的元素插入到此队列中，并在必要时等待指定的等待时间，以使空间可用。
     * 参数：e – 要添加的元素
     * 超时 – 放弃前等待多长时间，单位为 unit
     * 单位 – TimeUnit 确定如何解释 timeout 参数
     * 返回：true 如果成功，或者 false 指定的等待时间已过后才有可用空间
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    boolean offer(E e, long timeout, TimeUnit unit)
            throws InterruptedException;
    /**
     * 检索并删除此队列的头部，如有必要，请等待元素可用。
     * 返回：此队列的头部
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    E take() throws InterruptedException;
    /**
     * 检索并删除此队列的头部，并在必要时等待指定的等待时间，以使元素变为可用。
     * 参数：
     * 超时 – 放弃前等待多长时间，单位为 unit
     * 单位 – TimeUnit 确定如何解释 timeout 参数
     * 返回：此队列的头部，或者 null 如果指定的等待时间已过，元素才可用
     * 抛出：InterruptedException – 如果在等待时被打断
     */
    E poll(long timeout, TimeUnit unit)
            throws InterruptedException;
    /**
     * 返回此队列理想情况下（在没有内存或资源约束的情况下）可以接受的其他元素数，而不会阻塞，或者 Integer.MAX_VALUE 如果没有内部限制。
     * 请注意， 您无法 始终通过检查 remainingCapacity 来判断插入元素的尝试是否会成功，因为可能是另一个线程即将插入或删除元素。
     * 返回：剩余容量
     */
    int remainingCapacity();
    /**
     * 从此队列中删除指定元素的单个实例（如果存在）。更正式地说，删除一个元素，o.equals(e)如果此队列包含一个或多个此类元素e。
     * 如果此队列包含指定的元素（或者等效地，如果此队列由于调用而更改），则返回true。
     * 重写Collection中的remove方法
     * 参数：o – 要从此队列中删除的元素（如果存在）
     * 返回：true 如果此队列因调用而更改
     */
    boolean remove(Object o);
}
```
