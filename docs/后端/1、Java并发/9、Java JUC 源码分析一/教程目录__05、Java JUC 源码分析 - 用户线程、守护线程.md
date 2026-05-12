# 05、Java JUC 源码分析 - 用户线程、守护线程
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/5.html
- 分类：Java并发
- 分组：教程目录
## 1、什么是用户线程与守护线程？

守护线程是一种特殊的线程，在后台默默地完成一些系统性的服务，比如垃圾回收线程、JIT线程都是守护线程。与之对应的是用户线程，用户线程可以理解为是系统的工作线程，它会完成这个程序需要完成的业务操作。如果用户线程全部结束了，意味着程序需要完成的业务操作已经结束了，系统可以退出了。所以当系统只剩下守护进程的时候，java虚拟机会自动退出。

它们之间的区别也很简单，当最后一个非守护线程结束时，JVM会正常退出，不用管当前是否有守护线程，也就是说守护线程是否结束并不影响JVM的退出。只要有一个用户线程没结束，那么JVM就不会退出。

那么JAVA中如何创建守护线程呢？我们看下面的代码：

```java
 public static void main(String[] args) {
        //创建并启动线程
       Thread t = new Thread(new Runnable() {
           @Override
           public void run() {
           }
       });
       //设置成为守护线程
       t.setDaemon(true);
       t.start();
    }
```

## 2、举例说明两者区别

为了能够更好地理解，我们来看一个例子

```java
 public static void main(String[] args) {
        //创建并启动线程
       Thread child = new Thread(new Runnable() {
           @Override
           public void run() {
               for (;;){
     }
           }
       });
       child.start();
       System.out.println("mainThread is over");
    }
```

再让我们来看一下执行结果：

上述代码在main线程中创建了个子线程child，child里面是一个死循环，从运行结果来看main线程已经结束了，但是JVM却没有退出。也就是说我们的程序还在运行。

这个结果说明父线程结束后，子线程还是可以继续存在的并运行的，子线程的生命周期并不会受父线程影响。这也就说明了在用户进程还存在的情况下，JVM不会退出。

那么如果我们把上面的例子改变一下呢？

```java
 public static void main(String[] args) {
        //创建并启动线程
       Thread child = new Thread(new Runnable() {
           @Override
           public void run() {
               for (;;){
     }
           }
       });
       //设置守护线程
       child.setDaemon(true);
       child.start();
       System.out.println("mainThread is over");
    }
```

再来看看执行结果：

其实在main线程运行结束后，JVM会启动一个DestroyJavaVM的线程，该线程会等待所有的用户线程结束后终止JVM。

## 3、两个注意点

在这里我提及两个注意点：

**设置守护线程必须在线程启动之前**，否则产生如下图所示的情况：

**dameon的默认值为为父线程的daemon**，也就是说，父线程如果为用户线程，子线程默认也是用户现场，父线程如果是守护线程，子线程默认也是守护线程。
