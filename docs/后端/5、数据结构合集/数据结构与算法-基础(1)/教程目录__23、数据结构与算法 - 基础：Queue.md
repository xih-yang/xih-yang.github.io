# 23、数据结构与算法 - 基础：Queue
- 来源：https://ddkk.com/zhuanlan/algorithm/3/23.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

Queue 除了基本 Collection 操作外，队列还提供额外的插入、提取和检查操作。这些方法中的每一个都以两种形式存在：

一种在操作失败时引发异常，另一种返回特殊值（ null 或 false，具体取决于操作）

**队列方法摘要**

操作
引发异常
返回特殊值

插入
add(e)
offer(e)

获取并删除
remove()
poll()

获取但不删除
element()
peek()

**2、方法详解**

```java
/**
 * Queue 除了基本 Collection 操作外，队列还提供额外的插入、提取和检查操作。这些方法中的每一个都以两种形式存在：
 * 一种在操作失败时引发异常，另一种返回特殊值（ null 或 false，具体取决于操作）
 * 队列方法摘要
 *              引发异常     返回特殊值
 *  插入          add(e)      offer(e)
 *  获取并删除    remove()     poll()
 *  获取但不删除  element()    peek()
 * @param <E>
 */
public interface Queue<E> extends Collection<E> {
    /**
     * 如果可以在不违反容量限制的情况下立即将指定的元素插入到此队列中，则在成功时返回 true ，
     * 如果当前没有可用空间，则抛出一个 IllegalStateException
     * @param e
     * @return
     */
    boolean add(E e);
    /**
     * 如果可以在不违反容量限制的情况下立即将指定的元素插入到此队列中。使用容量受限队列时，此方法通常比 add 更可取，
     * 后者只能通过引发异常来插入元素。
     * @param e 要添加的元素
     * @return
     */
    boolean offer(E e);
    /**
     * 检索并删除此队列的头部。此方法的不同 poll 之处仅在于如果此队列为空，它将引发异常。
     *
     * 返回：此队列的头部
     * 抛出：NoSuchElementException – 如果此队列为空
     */
    E remove();
    /**
     * 检索并删除此队列的头部，如果此队列为空，则返回 null 。
     * @return e
     */
    E poll();
    /**
     * 检索但不删除此队列的头部。此方法的不同 peek 之处仅在于如果此队列为空，它将引发异常。
     *
     * 返回：此队列的头部
     * 抛出：NoSuchElementException – 如果此队列为空
     * @return e
     */
    E element();
    /**
     * 检索但不删除此队列的头部，如果此队列为空，则返回 null 。
     * @return e
     */
    E peek();
}
```
