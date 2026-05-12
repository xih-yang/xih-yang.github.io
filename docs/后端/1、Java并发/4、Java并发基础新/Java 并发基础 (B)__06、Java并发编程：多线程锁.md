# 06、Java并发编程：多线程锁
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/26.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 6.1 锁的八种情况

**1、** 两个同步方法，一个对象，两个线程，分别调用getOne()和getTwo(),打印？//12；

**2、** 在getOne()方法中添加睡眠3秒，打印？//12；

**3、** 添加非同步方法，启动三个线程，打印？//312；

**4、** 创建两个对象，一个调用getOne()一个调用getTwo(),打印？//21；

**5、** 将getOne()修改为静态同步方法，一个对象，打印？//21；

**6、** 将getTwo()修改为静态同步方法，一个对象，打印？//12；

**7、** 将getTwo()修改为非静态同步方法，两个对象，打印？//21；

**8、** 两个静态同步方法，两个对象，打印？//12；

总结：

- 对于普通同步方法：锁的是当前对象
- 对于静态同步方法：锁的是类
- 对象锁和类锁不是同一把锁
- 对于同步方法块：锁的是synchronized括号里配置的对象

## 6.2 公平锁和非公平锁

#### 非公平锁：

是指多个线程获取锁的顺序，并不是按照申请锁的顺序，有可能申请的线程比先申请的线程优先获取锁，在高并发环境下，有可能造成优先级翻转，或者饥饿的线程（也就是某个线程一直得不到锁）

效率高，但是会造成线程饿死

#### 公平锁：

是指多个线程按照申请锁的顺序来获取锁，类似于排队买饭，先来后到，先来先服务，就是公平的，也就是队列

```java
private final ReentrantLock lock = new ReentrantLock(true);
```

## 6.3 可重入锁（递归锁）

**什么是 “可重入”，可重入就是说某个线程已经获得某个锁，可以再次获取锁而不会出现死锁。**

`synchronized`和`ReentrantLock`都是可重入锁。

`synchronized`是隐式的可重入锁，`ReentrantLock`是显式的可重入锁。

`synchronized`代码示例：

```java
public static void main(String[] args) {
    //synchronized
    Object o = new Object();
    new Thread(()->{
        synchronized(o) {
            System.out.println(Thread.currentThread().getName() + " 外层");
            synchronized(o) {
                System.out.println(Thread.currentThread().getName() + " 中层");
                synchronized(o) {
                    System.out.println(Thread.currentThread().getName() + " 内层");
                }
            }
        }
    }, "t1").start();
}
```

`ReentrantLock`代码示例：

```java
public static void main(String[] args) {
	//lock
	Lock lock = new ReentrantLock();
	new Thread(()->{
	    try{
	      lock.lock();
	      System.out.println(Thread.currentThread().getName() + "外层");
	      try {
	          lock.lock();
	          System.out.println(Thread.currentThread().getName() + "中层");
	          try {
	              lock.lock();
	              System.out.println(Thread.currentThread().getName() + "内层");
	          } finally {
	              lock.unlock();
	          }
	      } finally {
	          lock.unlock();
	      }
	    } finally {
	        lock.unlock();
	    }
	}, "t1").start();
 }
```

注意：有几个`lock()`就需要有几个`unlock()`，否则其他线程会拿不到锁。

## 6.4 死锁

**1、** 什么是死锁？；

两个或两个以上的进程，因为资源争夺的问题，而造成互相等待的现象。如果没有外力干涉，这些线程都不会继续执行下去。

**2、** 产生死锁的原因：

- 系统资源不足
- 资源分配不当
- 进程推进顺序不合理

**3、** 死锁实例：

```java
package lock;
public class DeadLock {
    public static void main(String[] args) {
        Object a = new Object();
        Object b = new Object();
        new Thread(()->{
            synchronized (a) {
                System.out.println(Thread.currentThread().getName() + "获取了锁a，想要获取锁b");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                synchronized (b) {
                    System.out.println(Thread.currentThread().getName() + "获取了锁b");
                }
            }
        }, "A").start();
        new Thread(()->{
            synchronized (b) {
                System.out.println(Thread.currentThread().getName() + "获取了锁b，想要获取锁a");
                synchronized (a) {
                    System.out.println(Thread.currentThread().getName() + "获取了锁a");
                }
            }
        }, "B").start();
    }
}
```

如何查看死锁：

**1、** terminal中输入jsp-l（这个命令在jdk的bin目录中），查看java的进程号；

**2、** jstack[进程号]，往下翻，可以找到以下信息：
