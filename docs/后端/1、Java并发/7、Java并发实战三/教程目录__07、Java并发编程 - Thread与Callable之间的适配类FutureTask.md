# 07、Java并发编程 - Thread与Callable之间的适配类FutureTask
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/7.html
- 分类：Java并发
- 分组：教程目录
## 7、Callable

线程创建方式 Thread、Runnable、Callable区别：

1、是否有返回值

Runnable 没有返回值，Callable有返回值

2、是否跑出异常

Runnable 没有异常，Callable有异常

3、方法不同， run（），call（）

Runnable 运行的方法是run，Callable运行的方法是call

### 7.1. Thread与Callable之间的适配类：FutureTask

FutureTask是一个异步运算的任务。FutureTask里面可以传入一个Callable的具体实现类，可以对这个异步运算的任务和结果进行等待、获取，并判断是否已经完成、取消任务等操作。由于FutureTask也是Runnable接口的实现类，所以FutureTask也可以放入线程池中。

Thread创建线程，只能与Runnable有联系，与Callable没有关系，看官方API文档。

Thread怎么创建Callable线程呢？

在设计模式中建立两者之间的关系经常使用适配器，我们去查找jdk官方文档，看能否找到Thread和Callable相互之间有关联的类。

**1、查看Runnable官方文档**

**2、查看Runnable子类**

Thread能够引入Runnable，就能引入它的子类，我们看一下它的子类里面哪些有Callable相关的影子。

**3、找到Thread与Callable的万能桥：FutureTask**

我们在FutureTask类的构造器中找到了Callable。于是我们就可以利用FutureTask来与Callable建立关系。**FutureTask成为Thread中万能的桥。**

怎么使用呢？看以下示例：

```java
package com.interview.concurrent.futuretask;
import java.util.Arrays;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:创建线程的方法：
 * 1、Thread（Runnable）
 * 2、Thread（RunnableFuture）
 * 3、Thread（FutureTask）
 * @date 2023/2/23 0:55
 */
public class ThreadFutureTask {
    public static void main(String[] args) {
        MyCallable callable = new MyCallable();
        // 适配类
        FutureTask task = new FutureTask(callable);
        // 执行线程
        new Thread(task).start();
        // 获取返回值， get()
        try {
            System.out.println(task.get());
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (ExecutionException e) {
            e.printStackTrace();
        }
    }
}
class MyCallable implements Callable<String{
    @Override
    public String call() throws Exception {
        System.out.println("我Callable被调用了");
        return "callable";
    }
}
```

### 7.2. Callable有什么优点

Callable 优点：

缓存: 结果缓存！效率提高N倍

结果获取会阻塞：task.get() 获取值的方法一般放到最后，保证程序平稳运行的效率，因为他会阻塞等待结果产生！

```java
package com.interview.concurrent.futuretask;
import java.util.Arrays;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:创建线程的方法：
 * 1、Thread（Runnable）
 * 2、Thread（RunnableFuture）
 * 3、Thread（FutureTask）
 * @date 2023/2/23 0:55
 */
public class ThreadFutureTask {
    public static void main(String[] args) {
        MyCallable callable = new MyCallable();
        // 适配类
        FutureTask task = new FutureTask(callable);
        /**
         *  @description:执行线程
         *  以下两个线程只会调用一次，为什么呢？
         *  结果缓存！，第一个线程执行的结果，已经做了缓存，这样线程的效率会提高N倍
         *
         */
        new Thread(task,"A").start();
        new Thread(task,"B").start();
        // 获取返回值， get()
        try {
            // 细节2：task.get() 获取值的方法一般放到最后，保证程序平稳运行的效率，因为他会阻塞等待结果产生！
            System.out.println(task.get());// 获取返回值， get()
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (ExecutionException e) {
            e.printStackTrace();
        }
    }
}
class MyCallable implements Callable<String{
    @Override
    public String call() throws Exception {
        System.out.println("我Callable被调用了");
        TimeUnit.SECONDS.sleep(3);
        return "callable";
    }
}
```

运行结果如下:

两个线程运行，结果却只输出一次，这就是FutureTask的缓存作用。
