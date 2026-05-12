# 25、Java并发编程：阻塞队列
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/25.html
- 分类：Java并发
- 分组：教程目录
阻塞队列是这样一个队列，当尝试在队列为空时出队，或者尝试在队列已满时入队，它将阻塞。 尝试从空队列中出队的线程将被阻塞，直到其他线程插入一项到队列中为止。 尝试使一个项目进入满队列的线程将被阻塞，直到某个其他线程在队列中腾出空间为止，方法是使一个或多个项目出队或完全清除队列。

下面的示意图显示两个线程通过阻塞队列进行协作：

Java 5在java.util.concurrent包中附带了阻塞队列实现。 可以在我的java.util.concurrent.BlockingQueue教程中了解该类。 即使Java 5附带了阻塞队列实现，了解它们实现背后的理论也会很有用。

## 阻塞队列实现

阻塞队列的实现看起来类似于有界信号量。 下面是阻塞队列的简单实现：

```java
public class BlockingQueue {
  private List queue = new LinkedList();
  private int  limit = 10;
  public BlockingQueue(int limit){
    this.limit = limit;
  }
  public synchronized void enqueue(Object item)
  throws InterruptedException  {
    while(this.queue.size() == this.limit) {
      wait();
    }
    this.queue.add(item);
    if(this.queue.size() == 1) {
      notifyAll();
    }
  }
  public synchronized Object dequeue()
  throws InterruptedException{
    while(this.queue.size() == 0){
      wait();
    }
    if(this.queue.size() == this.limit){
      notifyAll();
    }
    return this.queue.remove(0);
  }
}
```

请注意，只有在队列大小等于大小界限（0或上限），则才会从enqueue（）和dequeue（）调用notifyAll（）。 如果在调用enqueue（）或dequeue（）时队列大小不等于大小界限，则可能没有线程在等待入队或出队。
