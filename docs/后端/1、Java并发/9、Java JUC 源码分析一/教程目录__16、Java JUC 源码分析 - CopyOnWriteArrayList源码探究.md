# 16、Java JUC 源码分析 - CopyOnWriteArrayList源码探究
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/16.html
- 分类：Java并发
- 分组：教程目录
## 1、初探CopyOnWriteArrayList

第一眼看到这个类的时候，英文好的可能已经发现了，这个类翻译过来：使用写时复制策略的ArrayList。这个类出现其实是为了解决并发情况下，ArrayList线程不安全的问题。也可以这么说，CopyOnWriteArrayList是一个线程安全的ArrayList，因为他和ArrayList存储原理差不多，且都实现了List接口。他的基本原理也很简单，对CopyOnWriteArrayList进行的修改操作，是在底层的一个复制的数组上进行的。我们来看看CopyOnWriteArrayList的类图，让我们更加深入了解吧。

从这个类图我们可以看出，CopyOnWriteArrayList内部维护了两个变量，一个是lock，是ReentrantLock独占锁的对象，这个lock是用来保证同时只有一个线程操作我们的array数组。这里我们只关注他是一个独占锁就可以了。另一个是array，它是一个Object数组，用来存放具体的数组的，且用了volatile修饰，保证了这个数组内存可见性。

那如果让我们自己做一个写时复制的线程安全的ArrayList，那么该怎样做呢？我们要考虑写什么呢？

- 什么时候初始化array，初始化array元素个数是多少，array是有限大小的吗？
- 如何保证线程安全，比如多个线程进行读写的时候如何保证保证线程安全？
- 如何保证使用迭代器时，数据的一致性

下面我们来看看，他的源码是如何写的吧

## 2、CopyOnWriteArrayList源码探究

### 2.1初始化

探究源码的第一步，也是较为简单的一步，就是看看这个类如何初始化的。简而言之就是直接看他的构造器。代码如下，我自己做了很多注释，应该能够一下子就看懂的：

```java
//无参构造器其实就是设置array的值
//给array一个长度为0的Object数组
public CopyOnWriteArrayList() {
     setArray(new Object[0]);
}
//传入的是一个集合
public CopyOnWriteArrayList(Collection<? extends E> c) {
    Object[] elements;
    //如果传入的这个集合是CopyOnWriteArrayList类型的
    if (c.getClass() == CopyOnWriteArrayList.class)
        //直接使用本类的getArray方法，转化成为数组
        //传入elements
        elements = ((CopyOnWriteArrayList<?>)c).getArray();
    else {
        //直接使用集合的toArray方法
        elements = c.toArray();
        // c.toArray might (incorrectly) not return Object[] 
        // 集合的toArray方法返回的可能不是Object数组，所以这里要转换一下
        if (elements.getClass() != Object[].class)
            elements = Arrays.copyOf(elements, elements.length, Object[].class);
    }
    //将转换好的数组，传入array
    setArray(elements);
}
//传入一个数组，而我们要做的就是把这个数组复制一遍
//然后副本传入array
public CopyOnWriteArrayList(E[] toCopyIn) {
    setArray(Arrays.copyOf(toCopyIn, toCopyIn.length, Object[].class));
}
```

其实上面的构造器，都是为了将传入的内容变成Object数组，然后设置到array里面。

### 2.2添加元素

要想知道他是怎么添加元素的，我们先来看看他有哪些方法可以添加元素。

```java
public boolean add(E e) ;
public void add(int index, E element) ;
public boolean addIfAbsent(E e) ;
private boolean addIfAbsent(E e, Object[] snapshot) ;
public int addAllAbsent(Collection<? extends E> c) ;
```

看上去好像有很多可以添加元素的方法，但其实它的原理大同小异，这里我着重讲解一下第一个方法，add(E e)。知道了这个方法，其他的方法就会一通百通。好了，我们来看一下他的源码（注释应该很到位了）：

```java
public boolean add(E e) {
    //首先获取独占锁，保证只有一个线程执行接下来的代码
    final ReentrantLock lock = this.lock;
    //加锁
    lock.lock();
    try {
        //获取当前的array，
        Object[] elements = getArray();
        int len = elements.length;
        //复制原来的数组到新的数组，并且新数组的长度比原来的大1
        Object[] newElements = Arrays.copyOf(elements, len + 1);
        //把要添加的元素，加入到新数组的末尾
        newElements[len] = e;
        //然后把新的数组设置到array里面
        setArray(newElements);
        return true;
    } finally {
        //释放锁
        lock.unlock();
    }
}
```

其实上面讲述的方法，就把array数组拷贝下来，然后扩容之后，把新的元素赋值给新数组的最后一个元素，然后把新数组设置到array。这整个过程还要保证只有一个线程执行。所以使用了独占锁ReentrantLock。

### 2.3获取指定位置元素

这里获取指定的元素方法，代码相对比较简单，但是会有一个问题。那么我们下面看看源码吧

```java
private E get(Object[] a, int index) {
    return (E) a[index];
}
final Object[] getArray() {
    return array;
}
public E get(int index) {
    return get(getArray(), index);
}
```

上面的代码可以说是非常简单了，但是会有问题。假如一个线程调用get方法获得元素的时候，这里就会有两个步骤，第一步首先获得array数组，第二步获得通过下标访问数组。就是这两步操作，但是在整个过程中没有相应的加锁同步。大家应该都想到了吧，当第一步执行完了以后，另外一个线程如果修改了这个数据，又或者直接删除了呢？那么当前执行的线程拿到的可能就是脏数据，而且是根本不期望的数据。这其实就是写时复制策略产生的弱一致性问题。

### 2.4修改指定元素

这里修改使用的是set方法，输入元素下标和元素的值，就可以修改。如果输入的下标不存在，就会产生一个IndexOutOfBoundsException异常。

```java
public E set(int index, E element) {
    //常规操作，获得独占锁，并加锁
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        //获得原数组，并获取对应下标的值，我们称这个值为老的值
        Object[] elements = getArray();
        E oldValue = get(elements, index);
	    //如果老的值和新的值不相等
        if (oldValue != element) {
            //设置新的值，代替老的值
            int len = elements.length;
            Object[] newElements = Arrays.copyOf(elements, len);
            newElements[index] = element;
            setArray(newElements);
        } else {
            // Not quite a no-op; ensures volatile write semantics
            setArray(elements);
        }
        //返回老的值
        return oldValue;
    } finally {
        //释放锁
        lock.unlock();
    }
}
```

这里着重说一下，为什么新的值和老的值相等的时候，还是要设置一下array数组。这里跟volatile的内存意义有关了，详情可以去看一下我的第七篇博客。

### 2.5删除元素

话不多说，删除元素也有很多方法，原理都一样，这里介绍remove，直接上源码

```java
public E remove(int index) {
    //常规操作，获得独占锁，并加锁
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        //获得原数组
        Object[] elements = getArray();
        //获得数组长度
        int len = elements.length;
        //获得被删除元素的值
        E oldValue = get(elements, index);
        int numMoved = len - index - 1;
        //如果要删除的元素，在数组末尾
        if (numMoved == 0)
            //直接复制除末尾的元素就好了
            setArray(Arrays.copyOf(elements, len - 1));
        else {
            Object[] newElements = new Object[len - 1];
            //这里分了两次复制
            //第一次复制下标为0后的index个元素到新数组
            System.arraycopy(elements, 0, newElements, 0, index);
            //第二次复制下标为index后numMoved个元素到新数组
            System.arraycopy(elements, index + 1, newElements, index,
                             numMoved);
            //然后设置新的array
            setArray(newElements);
        }
        //返回老的值
        return oldValue;
    } finally {
        //释放锁
        lock.unlock();
    }
}
```

如上代码其实和新增元素的代码类似，首先获取独占锁以保证删除数据期间其他线程不能对array做修改，然后复制元素到新的数组，返回老的值，最后释放锁。

### 2.6使用迭代器（弱一致性）

在讲述迭代器的弱一致性之前，我们先来看看这个迭代器如何使用。我们先来举个例子，看看这个迭代器如何使用：

```java
public class COWListDemo {
    public static void main(String[] args) {
        //创建CopyOnWriteArrayList对象
        CopyOnWriteArrayList<String> arrayList = new CopyOnWriteArrayList<>();
        //添加元素
        arrayList.add("张三");
        arrayList.add("李四");
        //通过CopyOnWriteArrayList对象，获得迭代器
        Iterator<String> itr = arrayList.iterator();
        //判断迭代器有没有下一个元素
        while(itr.hasNext()){
            //输出下一个元素
            //并且迭代器里面的指针会指向下一个元素
            System.out.println(itr.next());
        }
    }
}
```

上面这个例子简单的使用了一下迭代器，下面我们来说一下什么叫迭代器的弱一致性。弱一致性：当我们获得了这个list的迭代器后，其他线程对list进行修改，是不会影响的。也就是说我们获得了的迭代器，其实是那一瞬间的迭代器，不会它里面的元素是不会因为其他线程的修改而改变。

我们来看看源码就知道了：

```java
public Iterator<E> iterator() {
    return new COWIterator<E>(getArray(), 0);
}
//简化版
static final class COWIterator<E> implements ListIterator<E> {
    /** Snapshot of the array */
    private final Object[] snapshot;
    /** Index of element to be returned by subsequent call to next.  */
    private int cursor;
    private COWIterator(Object[] elements, int initialCursor) {
        cursor = initialCursor;
        snapshot = elements;
    }
    public boolean hasNext() {
        return cursor < snapshot.length;
    }
    public boolean hasPrevious() {
        return cursor > 0;
    }
    public E next() {
        if (! hasNext())
            throw new NoSuchElementException();
        return (E) snapshot[cursor++];
    }
}
```

如上代码，当调用iterator()方法获取迭代器，实际上会返回一个COWIterator对象，COWIterator对象其中的snapshot，保存了当前list的内容，cursor是迭代器遍历的下标。这里我们称snapshot其实是array的一个快照。

那么为什么说snapshot其实是array的一个快照呢？很多人没有想明白，明明是把array的引用传递给了snapshot，两个变量其实用的是同一个数组啊，如果其他线程修改了array，那么迭代器里面的内容也会随之改变。但是大家都忘记了一点，就是对array进行增删改查操作时，我们都是用一个新的数组的引用，直接覆盖老的，也就是说，修改了以后，迭代器里面的snapshot仍然引用的上一个array。这也就说明了，使用迭代器元素时，其他线程对改list进行增删改查不可见，因为他们已经操作的是两个数组了，这其实就是弱一致性。

如果你还不明白我这里有一个例子，看完你就会恍然大悟了：

```java
public class COWIList {
    //初始化list，且要保证内存可见性
    private static volatile CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
    public static void main(String[] args) throws InterruptedException {
        //添加元素
        list.add("one");
        list.add("two");
        list.add("three");
        list.add("five");
        list.add("six");
        list.add("seven");
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                //修改元素
                list.set(1,"strange");
                //删除元素
                list.remove(2);
                list.remove(3);
            }
        });
        //先获得迭代器
        Iterator<String> it = list.iterator();
        //然后启动线程
        threadOne.start();
        //等待子线程完成
        threadOne.join();
        //使用迭代器遍历元素
        while(it.hasNext()){
            System.out.println(it.next());
        }
    }
}
```

得到的结果如下：

## 3、总结

CopyOnWriteArrayList使用写时复制的策略来保证list的一致性，但是获取-修改-写入三步却不是原子性的，所以在增删改的过程中都使用了独占锁，来保证某个时间只有一个线程对其进行修改。另外CopyOnWriteArrayList还提供了弱一致性的迭代器，其他线程的修改对迭代器是不可见的，迭代器内部维护的snapshot，其实是array的快照。

好了，CopyOnWriteArrayList就分析到这里，喜欢的话就给我这个网络乞丐点个赞吧！！
