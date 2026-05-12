# 17、Java 9 新特性 – CompletableFuture API ( 上 )
- 来源：https://ddkk.com/zhuanlan/java/java9/17.html
- 分类：Java新特性
- 分组：教程目录
CompletableFuture 类是在 Java 8 引入的。用于表示一个 Feture 的状态，可以通过设置其值或状态来明确表示 Feture 处于完成状态

说起来特拗口，理解起来就简单了

那个，Java 8 不是引入了并发编程了，对吧。并发编程里有一个概念就是并发执行是否完成了。这个是否完成了是由 java.util.concurrent.CompletionStage 来表示的。然后呢，CompletableFuture 是 CompletionStage 的父类。

如果你对 Java 的并发编程熟悉，那么一定直到，当并发完成时可以支持一个回调，这个回调也是由 CompletableFuture 提供的。

有时候会觉得，一个特性，应该在它出现的时候就比较完善了，直到别人提出了新的思维，才觉得原来还有改进的空间，就比如这个 CompletableFuture 吧

Java 9 竟然还给它添加了一些东西：

**1、** 支持延误和超时(timeout)机制；

**2、** 支持子类化；

**3、** 添加了一些新的工厂方法；

## 支持延误和超时机制

这两个功能是通过新增两个方法来达成的

方法
说明

completeOnTimeout(T value, long timeout, TimeUnit unit)
如果在指定时间内没完成，则返回一个指定的值

orTimeout(long timeout, TimeUnit unit)
如果在指定的时间内没完成，则抛出一个异常 TimeoutException

这两个方法的看起来是差不多的，都是在指定时间内没完成则执行一个动作，只不过前者是返回一个指定的值，后者则直接抛出异常

这两个方法的原型如下

```java
public CompletableFuture<T> completeOnTimeout(T value, long timeout, TimeUnit unit)
public CompletableFuture<T> orTimeout(long timeout, TimeUnit unit)
```

## 范例

在我们的工作目录创建一个文件 CompletableFutureTimeoutTester.java 并输入以下内容

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
class CompletableFutureTimeoutTester {
    public static void main(String[] args) {
        try {               
            CompletableFuture<Integer> future = CompletableFuture.supplyAsync(CompletableFutureTimeoutTester::computeEndlessly)
              .orTimeout(1, TimeUnit.SECONDS);
            future.get(); // 显式等待超时
        } catch ( Exception e )
        {
            System.out.println(e);
        }
        try {
            int defaultValue = 7;
            CompletableFuture<Integer> future = CompletableFuture.supplyAsync(CompletableFutureTimeoutTester::computeEndlessly)
            .completeOnTimeout(defaultValue, 1, TimeUnit.SECONDS);
            Integer result = future.get(); // 显式等待超时
            System.out.println(result);
        } catch ( Exception e )
        {
            System.out.println(e);
        }
    }
    private static Integer computeEndlessly() {
        try {
            Thread.sleep(Integer.MAX_VALUE);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return 42;
    }
}
```

运行结果如下

```java
[penglei@ddkk.com java9]$ javac CompletableFutureTimeoutTester.java && java CompletableFutureTimeoutTester
java.util.concurrent.ExecutionException: java.util.concurrent.TimeoutException
7
```

从运行的结果中可以看到，如果执行超时， orTimeout() 方法直接抛出了一个异常，而 completeOnTimeout() 方法则是返回默认值
