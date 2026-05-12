# 07、Java并发编程：callable接口
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/27.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 7.1 创建线程的多种方式

**1、** 继承Thread类，然后重写`run`方法；

**2、** 实现Runnable接口，然后实现`run`方法；

**3、** Callable接口；

**4、** 线程池；

## 7.2 Callable接口

使用继承Thread类、实现Runnable接口的方法创建线程的缺点是，`run()`方法无法返回结果。为了能够返回结果，我们可以实现`Callable接口`的`call()方法`。

`Runnable()接口`和`Callable()接口的异同`：

- 前者无返回值，后者有返回值
- 前者不会检查抛出异常，后者会检查抛出异常
- 实现方法不同，前者实现run()方法，后者实现call()方法
- 两者都是为创建线程服务的

代码实现：

```java
package callable;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
//比较两个接口的区别
public class Demo1 {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        Thread thread1 = new Thread(new RunnableThread());
        thread1.start();
        FutureTask futureTask = new FutureTask(new CallableThread());
        Thread thread2 = new Thread(futureTask);
        thread2.start();
        System.out.println(futureTask.get());
    }
}
class RunnableThread implements Runnable {
    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName());
    }
}
class CallableThread implements Callable {
    @Override
    public Integer call() throws Exception {
        System.out.println(Thread.currentThread().getName());
        return 200;
    }
}
```

注意：`FutureTask()`类是`Runnable接口`的实现类，它的构造方法中有以`Callable接口`为参数的构造方法。它的`get()`方法可以返回`call()`方法的返回值。

计算完一次之后，第二次就不需要计算了，而是直接得出结果。
