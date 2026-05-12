# 01、Java并发编程 - 认识并发编程 之 线程与多线程
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/1.html
- 分类：Java并发
- 分组：教程目录
## 一、线程

## 1.1 进程和线程

### 进程

进程：进程指正在运行的程序，进程拥有一个完整的、私有的基本运行资源集合。通常，每个进程都有自己的内存空间。

进程往往被看作是程序或应用的代名词，然而，用户看到的**一个单独的应用程序实际上可能是一组相互协作的进程集合。**

为了便于进程之间的通信，大多数操作系统都支持**进程间通信（IPC）** ，如pipes 和sockets。IPC不仅支持同一系统上的通信，也支持不同的系统。IPC通信方式包括管道（包括无名管道和命名管道）、消息队列、信号量、共享存储、Socket、Streams等方式，其中 Socket和Streams支持不同主机上的两个进程IPC。

### 线程

线程有时也被称为轻量级的进程。进程和线程都提供了一个执行环境，但创建一个新的线程比创建一个新的进程需要的资源要少。

线程是在进程中存在的 — `每个进程最少有一个线程。``线程共享进程的资源，包括内存和打开的文件。`这样提高了效率，但潜在的问题就是线程间的通信。

多线程的执行是Java平台的一个基本特征。每个应用都至少有一个线程 – 或几个，如果算上“系统”线程的话，比如内存管理和信号处理等。但是从程序员的角度来看，启动的只有一个线程，叫主线程。

简而言之：一个程序运行后至少有一个进程，一个进程中可以包含多个线程。

进程是资源的拥有者，真正使用是线程来使用。

一个进程表示一个程序正在运行，其中的线程是真正去执行任务的。

## 1.2 线程实践

### 线程的创建

两种方式，继承Thread类：

```java
public class HelloThread extends Thread {
	public void run() {
		System.out.println("Hello from a thread!");
	}
	public static void main(String args[]) {
		(new HelloThread()).start();
	}
}
```

方式2，实现Runnable接口：

```java
public class HelloRunnable implements Runnable {
	public void run() {
		System.out.println("Hello from a thread!");
	}
	public static void main(String args[]) {
		(new Thread(new HelloRunnable())).start();
	}
}
```

> JAVA语言是单继承的，如果使用继承Thread的方式，就不能继承其他类了，所以一般都用实现Runnable接口的方式。
>
> PS：还有第三种方式实现Callable接口，以后讲JUC的时候会说。

### 线程启动和停止

**启动线程**

调用start方法

**停止线程**

线程自带的stop方法，一方面已经过时，另一方面，stop会导致线程立即解锁它锁定的所有监视器。如果以前被这些监视器保护的任何对象处于不一致的状态，则被损坏的对象对其他线程可见，可能导致任意行为。所以，停止线程的功能，需要自己实现。

- 演示问题：

```java
public class ThreadTest {
	public static void main(String[] args) throws InterruptedException {
		StopThread thread = new StopThread();
		thread.start();
		Thread.sleep(1000L);
		thread.stop();
		while (thread.isAlive()) {
        }
		thread.print();
	}
	private static class StopThread extends Thread {
		private int x = 0; 
		private int y = 0;
		@Override
		public void run() {
			synchronized (this) {
				++x;
				try {
					Thread.sleep(3000L);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				++y;
			}
		}
		public void print() {
			System.out.println("x=" + x + " y=" + y);
		}
	}
}
```

上述代码中，run方法里是一个同步的原子操作，x和y必须要共同增加（原子操作要么全部成功要么全部失败），然而这里如果调用thread.stop()方法强制中断线程，导致了数据不一致，输出如下：

即stop方法破坏了这段代码的原子性，是不安全的。

没有异常，也破坏了我们的预期。如果这种问题出现在我们的程序中，会引发难以预期的异常。因此这种不安全的方式很早就被废弃了。

- 自己实现停止线程：

```java
public class MyRunnable implements Runnable {
	private boolean doStop = false;
	public synchronized void doStop() {
		this.doStop = true;
	}
	private synchronized boolean keepRunning() {
		return this.doStop == false;
	}
	@Override
	public void run() {
		while(keepRunning()) {
			// keep doing what this thread should do.
			System.out.println("Running");
			try {
				Thread.sleep(3L * 1000L);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}
}
```

调用

```java
public class MyRunnableMain {
	public static void main(String[] args) {
		MyRunnable myRunnable = new MyRunnable();
		Thread thread = new Thread(myRunnable);
		thread.start();
		try {
			Thread.sleep(10L * 1000L);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		myRunnable.doStop();
	}
}
```

>

### 线程暂停和中断

**线程暂停**

Java中线程的暂停是调用 java.lang.Thread 类的 sleep 方法。该方法会使当前正在执行的线程暂停指定的一段时间，`如果线程持有锁，sleep 方法结束前并不会释放该锁。`

**线程中断**

java.lang.Thread类有一个 interrupt 方法，该方法直接对线程调用。当被interrupt的线程正在sleep或wait时，会抛出 InterruptedException 异常。

事实上， interrupt 方法只是改变目标线程的中断状态（interrupt status），而那些会抛出 InterruptedException 异常的方法，如wait、sleep、join等，都是在方法内部不断地检查中断状态的值。

- **interrupt方法**

Thread实例方法：必须由其它线程获取被调用线程的实例后，进行调用。实际上，只是改变了被调用线程的内部中断状态；
- **Thread.interrupted方法**

Thread类方法：必须在当前执行线程内调用，该方法返回当前线程的内部中断状态，`然后清除中断状态（置为false）`；
- **isInterrupted方法**

Thread实例方法：用来检查指定线程的中断状态。当线程为中断状态时，会返回true；否则返回false。

```java
public class ThreadTest {
	public static void main(String[] args) throws InterruptedException {
		StopThread thread = new StopThread();
		thread.start();
		Thread.sleep(1000L);
		thread.interrupt();//将上面演示stop的例子改成调用interrupt
		while (thread.isAlive()) {
      }
		thread.print();
	}
	private static class StopThread extends Thread {
		private int x = 0;
		private int y = 0;
		@Override
		public void run() {
			synchronized (this) {
				++x;
				try {
					Thread.sleep(3000L);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				++y;
			}
		}
		public void print() {
			System.out.println("x=" + x + " y=" + y);
		}
	}
}
```

输出结果如下：

> x=1,y=1 这个结果是符合我们的预期，同时还抛出了个异常。
>
> 由此可见中断只是标记中断状态，具体处理需要自己实现。

底层源码实现：

```java
//java.lang.Thread
public class Thread implements Runnable {
	...
	// 核心 interrupt 方法
	public void interrupt() {
		if (this != Thread.currentThread()) // 非本线程，需要检查权限
			checkAccess();
		synchronized (blockerLock) {
			Interruptible b = blocker;
			if (b != null) {
				interrupt0(); // Just to set the interrupt flag 仅仅设置interrupt标志位
				b.interrupt(this); // 调用如 I/O 操作定义的中断方法
				return;
			}
		}
		interrupt0();
	}
	// 静态方法，该方法调用后会清除中断状态。
	public static boolean interrupted() {
		return currentThread().isInterrupted(true);
	}
	// 这个方法不会清除中断状态
	public boolean isInterrupted() {
		return isInterrupted(false);
	}
	// 上面两个方法会调用这个本地方法，参数代表是否清除中断状态
	private native boolean isInterrupted(boolean ClearInterrupted);
	...
}
```

interrupt() ：

- interrupt 中断操作时，非自身打断需要先检测是否有中断权限，这由jvm的安全机制配置；
- 如果线程处于sleep, wait, join 等状态，那么线程将立即退出被阻塞状态，清除中断状态并抛出一个InterruptedException异常；
- 如果线程处于I/O阻塞状态，将会抛出ClosedByInterruptException（IOException的子类）异常；
- 如果线程在Selector上被阻塞，select方法将立即返回；
- 如果非以上情况，将直接标记 interrupt 状态；

注意：interrupt 操作不会打断所有阻塞，只有上述阻塞情况才在jvm的打断范围内，如`处于锁阻塞的线程，不会受 interrupt 中断`；`并且只有第二条描述的情况线程处于sleep, wait, join 等状态，才会自动清除阻塞状态。`

**阻塞情况下中断，抛出异常后线程恢复非中断状态，即 interrupted = false**

```java
public class ThreadTest {
	public static void main(String[] args) throws InterruptedException {
		Thread t = new Thread(new Task("mytask"));
		t.start();
		t.interrupt();
	}
	static class Task implements Runnable{
		String name;
		public Task(String name) {
			this.name = name;
		}
		@Override
		public void run() {
			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				System.out.println("thread has been interrupt!");
			}
			System.out.println("isInterrupted: " + Thread.currentThread().isInterrupted());
			System.out.println("task " + name + " is over");
		}
	}
}
```

输出：

**调用Thread.interrupted() 方法后线程恢复非中断状态**

```java
public class ThreadTest {
	public static void main(String[] args) throws InterruptedException {
		Thread t = new Thread(new Task("mytask"));
		t.start();
		t.interrupt();
	}
	static class Task implements Runnable{
		String name;
		public Task(String name) {
			this.name = name;
		}
		@Override
		public void run() {
			System.out.println("first :" + Thread.interrupted());
			System.out.println("second:" + Thread.interrupted());
			System.out.println("task " + name + " is over");
		}
	}
}
```

输出结果：

总结：

- 中断只是给到一个状态位，并没有真正把程序停下来，收到这个命令或者这个状态位标识，可以根据这个标识做相应的处理
- 暂停相当于程序做了一个休眠，休息一个指定的时间
- 停止就是强制中止指定的线程运行，最好自己去实现停止的逻辑，否则容易发生隐患。

## 1.3 线程的状态

Java线程可能的状态：

线程的状态变迁：

## 二、多线程

线程是进程中的一个执行单元，负责当前进程中程序的执行，一个进程中至少有一个线程。一个进程中是可以有多个线程的，这个应用程序也可以称之为多线程程序。

## 2.1 并发和并行的区别

- 并行是指两个或者多个事件在同一时刻发生；而并发是指两个或多个事件在同一时间间隔发生。

> 单核CPU是不可能并行的，只能并发。

并行是在不同实体上的多个事件，并发是在同一实体上的多个事件。

> 这里实体就可以理解为CPU的内核

在一台处理器上“同时”处理多个任务（并发），在多台处理器上同时处理多个任务（并行）。

## 2.2 多线程好处

**提高cpu的利用率**

单线程：

```java
5 seconds reading file A
2 seconds processing file A
5 seconds reading file B
2 seconds processing file B
-----------------------
14 seconds total
```

多线程（并发）

```java
5 seconds reading file A
5 seconds reading file B + 2 seconds processing file A  （IO操作时CPU是空闲的，用这个时间去处理A文件）
2 seconds processing file B
-----------------------
12 seconds total
```

一般来说，在等待磁盘IO，网络IO或者等待用户输入时，CPU可以同时去处理其他任务。

**更高效的响应**

多线程技术使程序的响应速度更快 ,因为用户界面可以在进行其它工作的同时一直处于活动状态，不会造成无法响应的现象。

**公平使用CPU资源**

当前没有进行处理的任务，可以将处理器时间让给其它任务；占用大量处理时间的任务，也可以定期将处理器时间让给其它任务；通过对CPU时间的划分，使得CPU时间片可以在多个线程之间切换，避免需要长时间处理的线程独占CPU，导致其它线程长时间等待。

## 2.3 多线程的代价

**更复杂的设计**

共享数据的读取，数据的安全性，线程之间的交互，线程的同步等；

**上下文环境切换**

线程切换，cpu需要保存本地数据、程序指针等内容；

**更多的资源消耗**

每个线程都需要内存维护自己的本地栈信息，操作系统也需要资源对线程进行管理维护；
