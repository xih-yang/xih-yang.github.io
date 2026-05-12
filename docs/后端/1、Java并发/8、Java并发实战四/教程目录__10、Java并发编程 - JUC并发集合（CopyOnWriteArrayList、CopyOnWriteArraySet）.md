# 10、Java并发编程 - JUC并发集合（CopyOnWriteArrayList、CopyOnWriteArraySet）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/10.html
- 分类：Java并发
- 分组：教程目录
## 一、CopyOnWriteArrayList

## 1.1 ArrayList多线程不安全问题

ArrayList 不是线程安全类，在多线程同时写的情况下，会抛出`java.util.ConcurrentModificationException` 异常。

```java
/**
 * 集合类不安全问题
 */
public class ContainerNotSafeDemo {
    public static void main(String[] args) {
        listNoSafe();
    }
    private static void listNoSafe() {
        List<String> list = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            new Thread(()->{
                list.add(UUID.randomUUID().toString().substring(0,6));
                System.out.println(list);
            }, String.valueOf(i)).start();
        }
    }
}
```

解决⽅法：

**1、** 使⽤Vector（ArrayList所有⽅法加synchronized，太重）；

**2、** 使⽤Collections.synchronizedList()转换成线程安全类（本质也是所有⽅法加synchronized，太重）；

**3、** ArrayList+lock自己实现；

**4、** 使⽤java.concurrent.CopyOnWriteArrayList（推荐，适合读多写少）；

## 1.2 API介绍

Copy-On-Write简称COW，是一种用于程序设计中的优化策略。其基本思路是，从一开始大家都在共享同一个内容，当某个人想要修改这个内容的时候，才会真正把内容Copy出去形成一个新的内容然后再改，这是一种延时懒惰策略。从JDK1.5开始Java并发包里提供了两个使用CopyOnWrite机制实现的并发容器,它们是CopyOnWriteArrayList和CopyOnWriteArraySet。CopyOnWrite容器非常有用，可以在非常多的并发场景中使用到。

## 1.3 什么是CopyOnWrite容器

`CopyOnWrite容器即写时复制的容器`。通俗的理解是当我们往一个容器添加元素的时候，不直接往当前容器添加，而是先将当前容器进行Copy，复制出一个新的容器，然后新的容器里添加元素，添加完元素之后，再将原容器的引用指向新的容器。这样做的好处是我们可以对CopyOnWrite容器进行并发的读，而不需要加锁，因为当前容器不会添加任何元素。所以CopyOnWrite容器也是一种读写分离的思想，读和写不同的容器。

CopyOnWrite容器有很多优点，但是同时也存在两个问题，即内存占用问题和数据一致性问题。所以在开发的时候需要注意一下。

- 内存占用问题。因为CopyOnWrite的写时复制机制，所以在进行写操作的时候，内存里会同时驻扎两个对象的内存，旧的对象和新写入的对象（注意:在复制的时候只是复制容器里的引用，只是在写的时候会创建新对象添加到新容器里，而旧容器的对象还在使用，所以有两份对象内存）。如果这些对象占用的内存比较大，比如说200M左右，那么再写入100M数据进去，内存就会占用300M，那么这个时候很有可能造成频繁的Yong GC和Full GC。之前我们系统中使用了一个服务由于每晚使用CopyOnWrite机制更新大对象，造成了每晚15秒的Full GC，应用响应时间也随之变长。

针对内存占用问题，可以通过压缩容器中的元素的方法来减少大对象的内存消耗，比如，如果元素全是10进制的数字，可以考虑把它压缩成36进制或64进制。或者不使用CopyOnWrite容器，而使用其他的并发容器，如ConcurrentHashMap。
- 数据一致性问题。CopyOnWrite容器只能保证数据的最终一致性，不能保证数据的实时一致性。所以如果你希望写入的的数据，马上能读到，请不要使用CopyOnWrite容器。

## 1.4 源码简析

```java
public class CopyOnWriteArrayList<E> implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
	...
    /** The lock protecting all mutators */
    final transient ReentrantLock lock = new ReentrantLock();
	//底层还是基于数据存数据
    /** The array, accessed only via getArray/setArray. */
    private transient volatile Object[] array;
	//读实现，和普通list没啥区别
    /**
     * {@inheritDoc}
     *
     * @throws IndexOutOfBoundsException {@inheritDoc}
     */
    public E get(int index) {
        return get(getArray(), index);
    }
	//写实现
    /**
     * Replaces the element at the specified position in this list with the
     * specified element.
     *
     * @throws IndexOutOfBoundsException {@inheritDoc}
     */
    public E set(int index, E element) {
        final ReentrantLock lock = this.lock;
        lock.lock();//写的时候要先加锁
        try {
            Object[] elements = getArray();//拿到旧数组
            E oldValue = get(elements, index);//获取指定索引旧元素
            if (oldValue != element) {
     //不相等
                int len = elements.length;
                Object[] newElements = Arrays.copyOf(elements, len);//写时复制
                newElements[index] = element;
                setArray(newElements);
            } else {
                // Not quite a no-op; ensures volatile write semantics
                setArray(elements);
            }
            return oldValue;
        } finally {
            lock.unlock();
        }
    }
    /**
     * Appends the specified element to the end of this list.
     *
     * @param e element to be appended to this list
     * @return {@code true} (as specified by {@link Collection#add})
     */
    public boolean add(E e) {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            Object[] elements = getArray();
            int len = elements.length;
            Object[] newElements = Arrays.copyOf(elements, len + 1);//复制
            newElements[len] = e;
            setArray(newElements);
            return true;
        } finally {
            lock.unlock();
        }
    }
    /**
     * Removes the element at the specified position in this list.
     * Shifts any subsequent elements to the left (subtracts one from their
     * indices).  Returns the element that was removed from the list.
     *
     * @throws IndexOutOfBoundsException {@inheritDoc}
     */
    public E remove(int index) {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            Object[] elements = getArray();
            int len = elements.length;
            E oldValue = get(elements, index);//获取删除的元素返回
            int numMoved = len - index - 1;//计算需要移动的元素
            if (numMoved == 0)//需要移动的元素是0，即刚好移除尾部的元素
                setArray(Arrays.copyOf(elements, len - 1));
            else {
                Object[] newElements = new Object[len - 1];
                System.arraycopy(elements, 0, newElements, 0, index);//拷贝
                System.arraycopy(elements, index + 1, newElements, index,
                                 numMoved);//两次拷贝
                setArray(newElements);
            }
            return oldValue;
        } finally {
            lock.unlock();
        }
    }
	...
}
```

## 1.5 案例演示

```java
class ReadThread implements Runnable {
    private List<Integer> list;
    public ReadThread(List<Integer> list) {
        this.list = list;
    }
    @Override
    public void run() {
        System.out.print("size:="+list.size()+",::");
        for (Integer ele : list) {
            System.out.print(ele + ",");
        }
        System.out.println();
    }
}
class WriteThread implements Runnable {
    private List<Integer> list;
    public WriteThread(List<Integer> list) {
        this.list = list;
    }
    @Override
    public void run() {
        this.list.add(9);
    }
}
public class CopyOnWriteArrayListTest {
    public static void main(String[] args) {
        //1、初始化CopyOnWriteArrayList
        List<Integer> tempList = Arrays.asList(new Integer [] {
     1,2});
        CopyOnWriteArrayList<Integer> copyList = new CopyOnWriteArrayList<>(tempList);
        //2、模拟多线程对list进行读和写
        ExecutorService executorService = Executors.newFixedThreadPool(10);
        executorService.execute(new ReadThread(copyList));
        executorService.execute(new WriteThread(copyList));
        executorService.execute(new WriteThread(copyList));
        executorService.execute(new WriteThread(copyList));
        executorService.execute(new ReadThread(copyList));
        executorService.execute(new WriteThread(copyList));
        executorService.execute(new ReadThread(copyList));
        executorService.execute(new WriteThread(copyList));
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        System.out.println("copyList size:"+copyList.size());
    }
}
```

## 二、CopyOnWriteArraySet

## 2.1 HashSet多线程不安全问题

```java
/**
 * 集合类不安全问题
 */
public class ContainerNotSafeDemo {
    public static void main(String[] args) {
        //listNoSafe();
        setNoSafe();
    }
    private static void setNoSafe() {
        //HashSet<String> set = new HashSet<>();
        Set<String> set = new CopyOnWriteArraySet<>();
        for (int i = 0; i < 10; i++) {
            new Thread(()->{
                set.add(UUID.randomUUID().toString().substring(0,6));
                System.out.println(set);
            }, String.valueOf(i)).start();
        }
    }
}
```

> HashSet情况：

## 2.2 介绍

CopyOnWriteArraySet相对CopyOnWriteArrayList用来存储不重复的对象，是线程安全的。虽然继承了AbstractSet类，但CopyOnWriteArraySet与HashMap 完全不同，`内部是用CopyOnWriteArrayList实现的`，实现不重复的特性也是直接调用CopyOnWriteArrayList的方法实现的。

## 2.3 原理简析

HashSet 底层是⽤ HashMap 实现的。既然是⽤ HashMap 实现的，那 HashMap.put() 需要传两个参数，⽽ HashSet.add() 只传⼀个参数，这是为什么？实际上 HashSet.add() 就是调⽤的HashMap.put() ，只不过Value被写死了，是⼀个 private static final Object 对象。

跟List类似， HashSet 和 TreeSet 都不是线程安全的，与之对应的有 CopyOnWriteArraySet 这个线程安全类。这个类底层维护了⼀个 `CopyOnWriteArrayList` 数组。

注意：`CopyOnWriteSet底层维护的是CopyOnWriteArrayList!!`

```java
public class CopyOnWriteArraySet<E> extends AbstractSet<E> implements java.io.Serializable {
	...
    private final CopyOnWriteArrayList<E> al;
    /**
     * Creates an empty set.
     */
    public CopyOnWriteArraySet() {
        al = new CopyOnWriteArrayList<E>();
    }
    /**
     * Adds the specified element to this set if it is not already present.
     * More formally, adds the specified element {@code e} to this set if
     * the set contains no element {@code e2} such that
     * <tt>(e==null ? e2==null : e.equals(e2))</tt>.
     * If this set already contains the element, the call leaves the set
     * unchanged and returns {@code false}.
     *
     * @param e element to be added to this set
     * @return {@code true} if this set did not already contain the specified
     *         element
     */
    public boolean add(E e) {
        return al.addIfAbsent(e);
    }
    ...
}
```
