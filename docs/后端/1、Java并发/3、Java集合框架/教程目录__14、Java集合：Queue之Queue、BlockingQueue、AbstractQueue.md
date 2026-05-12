# 14、Java集合：Queue之Queue、BlockingQueue、AbstractQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/14.html
- 分类：Java并发
- 分组：教程目录
## Queue结构图

## Queue

> public interface Queue extends Collection

**1、** 在处理元素前用于保存元素的collection；

**2、** 除了基本的Collection操作外，队列还提供其他的插入、提取和检查操作；

**3、** 每个方法都存在两种形式：一种抛出异常（操作失败时），另一种返回一个特殊值（null或false，具体取决于操作）；

定义的接口如下：

```java
/**
 * 将指定的元素插入此队列（如果立即可行且不会违反容量限制），在成功时返回 true，如果当前没有可用的空间，则抛出 IllegalStateException。
 */
boolean add(E e);
/**
 *  将指定的元素插入此队列（如果立即可行且不会违反容量限制），当使用有容量限制的队列时，此方法通常要优于 add(E)，后者可能无法插入元素，而只是抛出一个异常。
 */
boolean offer(E e);
/**
 *  获取并移除此队列的头。
 */
E remove();
/**
 *  获取并移除此队列的头，如果此队列为空，则返回 null。
 */
E poll();
/**
 * 获取，但是不移除此队列的头。此方法与 peek 唯一的不同在于：此队列为空时将抛出一个异常。
 */
E element();
/**
 * 获取但不移除此队列的头；如果此队列为空，则返回 null。
 */
E peek();
```

## BlockingQueue

> public interface BlockingQueue extends Queue

**1、** 支持两个附加操作的Queue：获取元素时等待队列变为非空，以及存储元素时等待空间变得可用；

**2、** 不接受null元素试图add、put或offer一个null元素时，某些实现会抛出NullPointerException；

**3、** 主要用于生产者-使用者队列，但它另外还支持Collection接口；

**4、** 可以是限定容量的，也可以无界；

**5、** BlockingQueue实现是线程安全的；

BlockingQueue 方法以四种形式出现：第一种是抛出一个异常，第二种是返回一个特殊值（null 或 false，具体取决于操作），第三种是在操作可以成功前，无限期地阻塞当前线程，第四种是在放弃前只在给定的最大时间限制内阻塞。

接口方法定义

```java
public interface BlockingQueue<E> extends Queue<E> {
    /**
     * 将指定元素插入此队列中（如果立即可行且不会违反容量限制），成功时返回 true，如果当前没有可用的空间，则抛出 IllegalStateException。
     */
    boolean add(E e);
    /**
     * 将指定元素插入此队列中（如果立即可行且不会违反容量限制），成功时返回 true，如果当前没有可用的空间，则返回 false。
     */
    boolean offer(E e);
    /**
     * 将指定元素插入此队列中，将等待可用的空间（如果有必要）。
     */
    void put(E e) throws InterruptedException;
    /**
     * 将指定元素插入此队列中，在到达指定的等待时间前等待可用的空间（如果有必要）。
     */
    boolean offer(E e, long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 获取并移除此队列的头部，在元素变得可用之前一直等待（如果有必要）。
     */
    E take() throws InterruptedException;
    /**
     * 获取并移除此队列的头部，在指定的等待时间前等待可用的元素（如果有必要）。
     */
    E poll(long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 返回在无阻塞的理想情况下（不存在内存或资源约束）此队列能接受的附加元素数量；如果没有内部限制，则返回 Integer.MAX_VALUE。
     */
    int remainingCapacity();
    /**
     * 如果此队列包含指定元素（或者此队列由于调用而发生更改），则返回 true。
     */
    boolean remove(Object o);
    /**
     * 如果此队列包含指定元素，则返回 true。
     */
    public boolean contains(Object o);
    /**
     * 移除此队列中所有可用的元素，并将它们添加到给定 collection 中。
     */
    int drainTo(Collection<? super E> c);
    /**
     * 最多从此队列中移除给定数量的可用元素，并将这些元素添加到给定 collection 中。
     */
    int drainTo(Collection<? super E> c, int maxElements);
}
```

BlockingQueue相比Queue在方法声明中多了两个核心方法–支持阻塞操作：

**1、** take：获取并移除此队列的头部，在元素变得可用之前一直等待（如果有必要）；

**2、** put：将指定元素插入此队列中，将等待可用的空间（如果有必要）；

## AbstractQueue

> public abstract class AbstractQueue extends AbstractCollection implements Queue

**1、** 提供某些Queue操作的骨干实现；

**2、** 类中的实现适用于基本实现不允许包含null元素时；

**3、** add、remove和element方法分别基于offer、poll和peek方法，但是它们通过抛出异常而不是返回false或null来指示失败；

构造方法

```java
 /**
  * 子类使用的构造方法。
  */
 protected AbstractQueue() {}
```

成员方法

> boolean add(E e) ：将指定的元素插入到此队列中（如果立即可行且不会违反容量限制），在成功时返回 true，如果当前没有可用空间，则抛出 IllegalStateException。

```java
public boolean add(E e) {
	if (offer(e))//基于offer方法，当返回false时，抛出异常
		return true;
    else
        throw new IllegalStateException("Queue full");
}
```

> Eremove()： 获取并移除此队列的头。

```java
public E remove() {
	E x = poll();//基于poll方法，元素不存在时抛出异常
    if (x != null)
	    return x;
    else
        throw new NoSuchElementException();
}
```

> Eelement()：获取但不移除此队列的头。

```java
public E element() {
	E x = peek();//基于peek方法，元素不存在时抛出异常
    if (x != null)
       return x;
    else
       throw new NoSuchElementException();
}
```

> void clear()：移除此队列中的所有元素。

```java
public void clear() {
	while (poll() != null) //一直循环poll队列中的元素
            ;
}
```

> boolean addAll(Collection c)：将指定 collection 中的所有元素都添加到此队列中。

```java
public boolean addAll(Collection<? extends E> c) {
	if (c == null)//判断集合是否为空
	    throw new NullPointerException();
    if (c == this)//判断是否为当前集合
        throw new IllegalArgumentException();
    boolean modified = false;
    Iterator<? extends E> e = c.iterator();
    while (e.hasNext()) {//循环遍历集合c，add到当前队列中
	    if (add(e.next()))
	        modified = true;
    }
   return modified;
}
```

由源码看出，AbstractQueue定义并实现了一些公共的增、删、取方法，且具体实现依赖于子类的 offer、poll 和 peek 方法。
