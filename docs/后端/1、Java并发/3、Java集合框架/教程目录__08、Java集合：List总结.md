# 08、Java集合：List总结
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/8.html
- 分类：Java并发
- 分组：教程目录
## 1.ArrayList

1、默认初始容量为10，数组大小可变。

2、有序、可重复、允许NULL值。

3、非同步，fail-fast。

4、元素以transient Object[]形式存储，适用于快速随机访问元素。

5、每次扩容为：原有容量*1.5+1。

6、扩容增量>实际add元素数，保证不必每次add时都进行扩容，提高性能。

7、iterator()调用的是父类AbstractList方法。

8、数组大小理论上是由MAX值的，index类型为int。

## 2.LinkedList

1、List 接口的链接列表实现，支持序列化、有序、值可为NULL。

2、双向链表且允许将链接列表用作堆栈、队列或双端队列。

3、适用于随机的快速插入和删除。

4、非同步，fail-fast。

5、理论上只要内存允许可以无穷大(链式存储)。

6、iterator()由其内部类ListItr实现。

## 3.CopyOnWriteArrayList

1、CopyOnWrite并发容器用于读多写少的并发场景。

2、复制用法导致内存占用可能过高。

3、保证数据最终一致性，无法保证实时一致性。

4、使用的可重入的互斥锁ReentrantLock保证同步性，fail-safe。

5、使用volatile修饰数组保证可见性。

6、读写分离。

7、addIfAbsent可不添加重复元素。

8、由于采用的是COW设计，因此按需扩容，避免内存浪费。

8、iterator()由其内部类COWIterator实现。

## 4.Vector

1、实现可增长的对象数组,默认初始容量为10。

2、可以使用整数索引进行访问, 可根据需要增大或缩小。

3、通过synchronized修饰每个方法，保证同步性，fail-fast。

4、iterator()调用的是父类AbstractList方法。

5、扩容方案：（容量增量>0，则预期为：现有容量+容量增量，否则为：现有容量*2），计算后与要求的最小容量比较，取最大值。 保证不必每次add时都进行扩容，提高性能。

## 5.Stack

1、后进先出（LIFO）的对象堆栈。

2、Vector的增强类，堆栈顶部对应向量末尾。

3、首次创建堆栈时，它不包含项。

4、Deque 接口及其实现提供了 LIFO 堆栈操作的更完整和更一致的 set，应该优先使用此 set，而非此类。例如： Deque stack = new ArrayDeque();

由于ArrayList是数组存储形式，在随机查询方面会比较快。

若每次add或remove时均在末尾，ArrayList会比较快，直接index操作。

但若随机add或remove，LinkedList链式存储，相比ArrayList少了System.arrayCopy操作，会快一点。

Vector每个方法都加上synchronized，保证了同步同时，牺牲了性能。

ps:若总结的不好，欢迎大家留言。
