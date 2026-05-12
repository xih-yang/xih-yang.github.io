# 01、Java JUC 源码分析 - 并发编程线程基础
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/1.html
- 分类：Java并发
- 分组：教程目录
## 1.1什么是线程？

在讲什么是线程之前，我要提一个概念，那就是**进程**。那么什么是进程呢？进程是代码在数据集合上的一次运行活动，，是系统进行资源分配和调度的基本单位。线程其实就是进程的一个执行路径。一个进程中至少含有一个线程，进程中的多个线程共享资源。

众所周知，操作系统在分配资源的时候，是按照进程来分配的。但是其中有一种特殊情况，就是CPU资源，CPU资源是分配到线程的，也就是说，线程是CPU资源分配的基本单位。

## 1.2线程的创建与运行

在java中有3中创建线程的方式。分别如下：

- 实现Runnable接口
- 继承Thread类
- 使用FutureTask方式

## 1.2.1继承Thread类创建并运行线程

```java
public class ThreadTest {
	//继承Thread类，并重写run()方法
	public static class MyThread extends Thread{
		@Override
		public void run() {
			System.out.println("This is a Thread!");
		}
	}
	public static void main(String[] args) {
		//创建线程
		MyThread thread = new MyThread();
		//启动线程
		thread.start();
	}
}
```

这里我们要注意一点，启动线程我们用到了start方法。调用start方法后线程并没有进入运行状态而是进入了一个就绪的状态，当这个线程获取CPU时间片后线程才会进入运行状态，才会执行run方法里面的内容。

使用继承的好处就是，在run方法里面获取当前正在运行的线程只要用this关键字就可以了，没必要再使用Thread.currentThread().有优点就有缺点，缺点就是java没有多继承，也就是说如果继承了Thread类，那就不能再继承其他类了。另外任务和代码没有分离，当多个线程执行一样的任务的时候，这个时候就会用到多分任务代码。这个时候我们就可以用到Runnable接口来实现。

## 1.2.2实现Runnable接口创建并运行线程

```java
public class RunnableTest {
	//实现runnable接口，并重写run方法
	public static class RunnableTask implements Runnable{
		@Override
		public void run() {
			System.out.println("This is a Thread!");
		}
	}
	public static void main(String[] args) {
		RunnableTask task = new RunnableTask();
		new Thread(task).start();
		new Thread(task).start();
	}
}
```

如上代码，两个线程就共享了一个任务的代码逻辑。另外如果有需要的话，上面的RunnableTask类还可以继承其他类，并且还可以实现其他接口。但是以上两种都有一个缺点，就是他们没有任务返回值。

## 1.2.3使用FutureTask创建并运行线程

```java
public class FutureTaskTest {
	//创建一个任务类，并实现Callable接口，尖括号里为返回类型
	public static class CallableTask implements Callable<String>{
		@Override
		public String call() throws Exception {
			// TODO Auto-generated method stub
			return "This is a Thread";
		}
	}
	public static void main(String[] args) {
		//创建异步任务
		FutureTask<String> task = new FutureTask<>(new CallableTask());
		new Thread(task).start();
		try {
			String result = task.get();
			System.out.println(result);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (ExecutionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
```

如上代码CallableTask实现了Callable接口的call方法，然后在main函数里面，首先通过CallableTask创建异步任务，也就是一个FutureTask对象，程序中给这个对象命名为task。然后task作为任务使用线程启动它。等线程执行完后，返回值可以通过task.get()获得。

## 1.2.4小结

使用继承的好处就是方便传参数，你可以在子类里面设置成员变量，也可以通过构造方法将参数传递进来，而如果使用Runnable接口，那就只能使用主线程里定义的final变量。不好的地方就是java只支持单继承。然后前两个方式获得不了返回参数，但是FutureTask可以。

## 1.3线程的状态转换

这里我提供一张图片，图片中提及的各个方法，我会单独拿出来讲，放在后面的博文中。
