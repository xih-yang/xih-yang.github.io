# 03、Java JUC 源码分析 - join、sleep、yield等方法详解
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/3.html
- 分类：Java并发
- 分组：教程目录
## 1、等待线程执行终止的join方法

在正式开始之前，如果还有对线程状态转换不太清楚的，我这里再放一张图便于大家理解。

## 1.1正确理解join

我们在开发过程中经常会遇到的一个场景，就是需要等待某几件事情完成以后，程序才能继续往下执行。就比如多个线程加载资源，必须要等待多个线程全部加载完毕，才能汇总处理的结果。Thread类中就提供了这样的方法，就是join方法。join方法简单来说就是等待调用join方法的线程执行终止。而且join方法是无参且返回值类型为void。

说了这么多，先来看一个简单的例子吧。

```java
public class JoinTest {
	//执行main方法的线程称为主线程
	public static void main(String[] args) throws InterruptedException {
		//创建线程one
		Thread threadOne = new Thread(new Runnable() {
			@Override
			public void run() {
				//让当前执行的线程休眠1S
				try {
					Thread.sleep(1000);
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				System.out.println("Thread One over!");
			}
		});
		//创建线程two
		Thread threadTwo = new Thread(new Runnable() {
			@Override
			public void run() {
				//让当前执行的线程休眠1S
				try {
					Thread.sleep(1000);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				System.out.println("Thread Two over!");
			}
		});
		//启动线程
		threadOne.start();
		threadTwo.start();
		//等待这两的线程执行完毕
		threadOne.join();
		threadTwo.join();
	}
}
```

如上代码，在主线程里面创建了两个线程分别叫one、two，当主线程执行到threadOne.join()这一行代码的时候，主线程会被阻塞，等待线程one执行完毕，然后主线程调用threadTwo.join()方法，这个时候主线程再次被阻塞，要等待线程Two执行完毕后，主线程才能结束。

## 1.2使用join会发生异常的情况

当然如果主线程在等待One的过程中，被其他线程调用了interrupt()方法，来中断主线程，那么主线程就会抛出InterruptedException，然后返回。通俗的讲：如果一个线程正在等待另外一个线程结束，这时候我们强行终止正在等待的线程，那么就会出现异常。如果还是不清楚，请看看下面的例子。

```java
public class JoinInterruptTest {
	//主线程
	public static void main(String[] args) {
		//创建线程one
		Thread threadOne = new Thread(new Runnable() {
			@Override
			public void run() {
				System.out.println("Thread One Begin!");
				while(true){
				}
			}
		});
		//获得主线程，目的：可以在线程二中引用
		Thread mainThread = Thread.currentThread();
		//创建线程two
		Thread threadTwo = new Thread(new Runnable() {
			@Override
			public void run() {
				//让当前执行的线程休眠1S
				try {
					Thread.sleep(1000);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				mainThread.interrupt();
			}
		});
		//启动线程
		threadOne.start();
		threadTwo.start();
		//等待线程one结束
		try {
			threadOne.join();
		} catch (InterruptedException e) {
			System.out.println("mainThread:"+e);
		}
	}
}
```

如上代码，线程one里面在执行死循环，主线程调用threadOne.join()方法，等待线程one的执行结束。因为启动了线程two的缘故，所以当线程二执行的时候，会中断主线程，所以这个时候就会出现异常。

## 2、让线程睡眠的sleep方法

## 2.1正确理解sleep方法

Thread类中有一个静态的sleep方法。当执行中的线程调用Thread的sleep方法，那么当前正在执行的线程会让出指定时间的CPU执行权，也就是不参与CPU的调度。但是他拥有的监视器资源，例如锁还是不会让出的。指定的睡眠时间到了，该函数会正常返回，线程也会处于就绪状态，参与CPU调度。如果该线程在sleep期间，被其他线程调用了inerrupt(）方法，就会抛出InterruptionException。

那么接下来，我们来看一个例子，说明线程在sleep期间拥有的锁，是不会释放的。

```java
public class SleepLockTest {
	//创建一个独占锁
	private static final Lock lock = new ReentrantLock();
	public static void main(String[] args) {
		//创建线程one
		Thread threadOne = new Thread(new Runnable() {
			@Override
			public void run() {
				//获取独占锁
				lock.lock();
				try {
					System.out.println("Thread One Sleep!");
					Thread.sleep(3000);
					System.out.println("Thread One Awaked!");
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}finally {
					//释放锁
					lock.unlock();
				}
			}
		});
		//创建线程two
		Thread threadTwo = new Thread(new Runnable() {
			@Override
			public void run() {
				//获取独占锁
				lock.lock();
				try {
					System.out.println("Thread Two Sleep!");
					Thread.sleep(3000);
					System.out.println("Thread Two Awaked!");
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}finally {
					//释放锁
					lock.unlock();
				}
			}
		});
		//启动线程
		threadOne.start();
		threadTwo.start();
	}
}
```

上述代码，每个线程需要先获得锁，才能进行睡眠操作，执行完毕后在释放锁。无论你执行多少遍，结果都是线程one执行，然后在轮到线程two，不会出现交叉的情况。因为在休眠的时候，锁没有交出去。所以，只有等一个线程完全执行完毕，才会轮到下一个线程。

## 2.2使用sleep会发生异常的情况

这个情况比较简单，也就是正在sleep的线程被其他线程调用的interrupt()方法。这就好比你在睡觉，被打断了一样，你当然会发脾气。作为程序她当然不可能发脾气，他只会抛出异常。话不多说，例子如下：

```java
public class SleepInterruptTest {
	public static void main(String[] args) throws InterruptedException {
		//创建线程one
		Thread one = new Thread(new Runnable() {
			@Override
			public void run() {
				//获取独占锁
				try {
					System.out.println("Thread One Sleep!");
					Thread.sleep(10000);
					System.out.println("Thread One Awaked!");
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		});
		//启动one
		one.start();
		//休眠主线程,目的：让one线程能够先执行
		Thread.sleep(1000);
		//中断one
		one.interrupt();
	}
}
```

## 3、让出CPU执行权的yield方法

Thread类中有一个静态方法yield。当一个线程调用该方法时，实际就是暗示线程调度器当前线程请求让出CPU的使用，但是线程调度器可以无条件忽略这个暗示。我们知道操作系统为每个线程分配一个时间片，正常情况下，只有等到时间片用完了，线程调度器才会进行下一轮线程调度。而当一个线程调用了yield方法时，其实就是在告诉线程调度器自己占有的时间片还有没用完的部分，自己不想用了，这暗示线程调度器，现在就可以进行下一轮的调度。

调用yield方法的线程会从运行态，进入就绪态，线程调度器会从线程就绪队列中获取一个优先级最高的线程开始执行。当然上述线程也可能再一次被CPU选中，开始执行。

接下来看个例子吧

```java
public class YieldTest implements Runnable{
	public YieldTest() {
		Thread thread = new Thread(this);
		thread.start();
	}
	@Override
	public void run() {
		//当i=0时，让出CPU执行权
		for(int i = 0 ; i < 5 ; i++){
			if(i%5==0){
				System.out.println(Thread.currentThread()+"yield cpu..");
				Thread.yield();
			}
		}
		System.out.println(Thread.currentThread()+"is over");
	}
	public static void main(String[] args) {
		new YieldTest();
		new YieldTest();
		new YieldTest();
	}
}
```

从代码运行的结果可以知道，三个线程分别在i=0的时候让出了CPU执行权，所以三个线程的两行输出没有连在一起。

最后小小总结一下，sleep和yield的区别吧。当线程调用sleep方法时，调用的线程会被阻塞指定的时间，在这期间，线程调度器是不会去调度该线程的。而调用yield方法后，线程只是让出了自己的时间片，但是并没有阻塞，而是处于就绪状态，线程调度器还是可以调度到它的。
