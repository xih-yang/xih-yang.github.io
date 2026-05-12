# 02、Java JUC 源码分析 - wait、notify等方法详解
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/2.html
- 分类：Java并发
- 分组：教程目录
## 1.线程的等待与通知

JAVA中所有类的父类是Object，因为继承机制，JAVA把所有类都需要实现的方法放到Object类中，其中就有wait和notify。

## 1.1wait()方法

那么wait()方法是做什么的呢？当一个线程调用**共享变量**的wait方法，该线程就会进入等待队列。只有发生了下面两件事，才有可能离开等待队列。

- 其他线程调用了该共享对象的notify或者notifyAll方法
- 其他线程调用了该线程的interrupt()方法，该线程抛出InterruptException

另外需要注意的是，如果调用wait()方法没有获得该对象的监视器锁，就会抛出IllegalMonitorException。所以在调用wait方法的时候一定要注意这个细节。那么如何获得共享对象的监视器锁呢？

执行synchronized同步代码块，使用该共享变量作为参数

```java
synchronized（共享变量）{  
     //doSomething  
}
```

**调用该共享对象的方法，该方法被synchronized修饰**

另外需要注意的是一个线程可以从等待队列，变为就就绪状态，也就是唤醒。即使我们没有调用notify或者notifyAll方法，或者interrupt方法，这就是所谓的**虚假唤醒**。

下面从一个简单的**生产者消费者**例子来说明用法：

```java
public class PCTest {
	//生产者线程
	public static class Producer extends Thread{
		//产品队列
		private Queue<String> queue = null;
		private int num = 0; 
		public Producer(Queue<String> queue) {
			this.queue = queue;
		}
		@Override
		public void run() {
			while(true){
				synchronized (queue) {
					//规定当产品容量到达10的时候，产品队列到达存储极限
					while(queue.size() >= 4){
						try {
							//需要等待queue队列空闲
							queue.wait();
						} catch (InterruptedException e) {
							e.printStackTrace();
						}
					}
					try {
						this.sleep(1000);
					} catch (InterruptedException e1) {
						// TODO Auto-generated catch block
						e1.printStackTrace();
					}
					queue.offer("Product"+num);
					System.out.println("生产了："+"Product"+num+"当前容量："+queue.size());
					num++;
					queue.notifyAll();
				}
			}
		}
	}
	//消费者线程
	public static class Consumer extends Thread{
		//产品队列
		private Queue<String> queue = null;
		public Consumer(Queue<String> queue) {
				this.queue = queue;
		}
		@Override
		public void run() {
			while(true){
				synchronized (queue) {
					//规定当产品容量到达0的时候，无法消费产品
					while(queue.size() <= 0){
						try {
							//需要等待queue队列有产品才能消费
							queue.wait();
						} catch (InterruptedException e) {
							e.printStackTrace();
						}
					}
					try {
						this.sleep(1000);
					} catch (InterruptedException e1) {
						// TODO Auto-generated catch block
						e1.printStackTrace();
					}
					System.out.print("消费了："+queue.poll());
					System.out.println("当前容量："+queue.size());
					queue.notifyAll();
				}
			}
		}
	}
	public static void main(String[] args) {
		Queue<String> queue = new LinkedList<String>();0
		Producer  p = new Producer(queue);
		Consumer  c = new Consumer(queue);
		p.start();
		c.start();
	}
}
```

如上代码，生产者首先通过synchronized获得了queue上的监视器锁，后续所有企图获取queue上的监视器锁的线程都会别阻塞。当生产者生产一定数量的产品的时候队列满了，这个时候调用wait方法。我们的生产者就会阻塞自己，然后释放手中的锁，如果不释放锁，就会产生死锁。因为消费者需要对象的监视器锁，才能执行synchronized代码块里面的内容，而生产者不能生产了，却一直不释放锁，线程将就会陷入死锁。

另外需要注意的是，当前线程调用共享变量queue的wait方法后，释放的是queue的监视器锁，如果当前线程还有其他的共享变量，这些锁是不会释放的。

最后再举个例子。如果一个线程调用共享对象的wait（）方法被阻塞挂起后，如果其他线程中断了该线程，该线程会抛出InterruptedException异常并返回。

```java
public class WaitNotifyInterrupt {
	static Object obj = new Object();
	public static void main(String[] args) throws InterruptedException {
		Thread threadA = new Thread(new Runnable(){
			@Override
			public void run() {
					try {
						synchronized (obj) {
							System.out.println("====wait()   begin====");
							obj.wait();
							System.out.println("=====wait()  end=====");
						}
					} catch (InterruptedException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
			}
		});
		threadA.start();
		//主线程休眠一下
		Thread.sleep(1000);
		System.out.println("bengin interrupt threadA");
		threadA.interrupt();
		System.out.println("end interrupt threadA");
	}
}
```

## 1.2wait(long timeout)方法

该方法相比wait（）方法多了一个超时的参数。他与wait（）的不同之处在于，如果一个线程调用共享对象的wait（）方法后，没有在指定的timeout时间里面被其他线程调用notify或者notifyAll方法唤醒，那么函数会因为超时而返回。如果timeout为0，那么和wait（）方法一样，如果传递一个负值，就会抛出IllegalArgumentException。

## 1.3wait(long timeout，int nanos)方法

我们直接来看一下源代码吧，因为源代码也十分简单，这里不对这个方法作解释了。

```java
    public final void wait(long timeout, int nanos) throws InterruptedException {
        if (timeout < 0) {
            throw new IllegalArgumentException("timeout value is negative");
        }
        if (nanos < 0 || nanos > 999999) {
            throw new IllegalArgumentException(
                                "nanosecond timeout value out of range");
        }
        if (nanos > 0) {
            timeout++;
        }
        wait(timeout);
    }
```

## 1.4notify()方法

一个线程调用了他共享对象的notify()方法后，会唤醒一个在该共享变量上因为调用wait系列方法而被挂起的线程。一个共享变量可能会有多个多个线程在等待，具体唤醒是随机的。

被唤醒了并不能立即执行该线程，他还要获取到共享对象的监视器锁才可以进入就绪状态。因为使用了wait系列方法后，他的共享对象的监视器锁是交还回去的。

## 1.5notifyAll()方法

不同于notify()的地方是，notifyAll()会唤醒在该共享对象上因为调用wait系列方法而被挂起的所有线程
