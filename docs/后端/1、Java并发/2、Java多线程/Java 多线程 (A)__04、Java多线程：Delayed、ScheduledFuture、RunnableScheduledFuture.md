# 04、Java多线程：Delayed、ScheduledFuture、RunnableScheduledFuture
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/4.html
- 分类：Java并发
- 分组：Java 多线程 (A)
## Delayed

> public interface Delayed extends Comparable

**1、** 一种混合风格的接口，用来标记那些应该在给定延迟时间之后执行的对象；

**2、** 此接口的实现必须定义一个compareTo方法，该方法提供与此接口的getDelay方法一致的排序；

通俗地解释即该接口的实现具有延迟特性。

```java
public interface Delayed extends Comparable<Delayed> {
    /**
     * 返回与此对象相关的剩余延迟时间，以给定的时间单位表示。  
     */
    long getDelay(TimeUnit unit);
}
```

## ScheduledFuture

> public interface ScheduledFuture extends Delayed, Future

一个延迟的、结果可接受的操作，可将其取消通常已安排的future是用ScheduledExecutorService安排任务的结果；

ScheduledFuture只是在Future基础上还集成了Comparable和Delayed的接口。使其具有延迟、排序、获得异步计算结果的特性。

它用于表示ScheduledExecutorService中提交了任务的返回结果。我们通过Delayed的接口getDelay()方法知道该任务还有多久才会被执行。

JDK中并没提供ScheduledFuture的实现类。只有在ScheduledExecutorService中提交了任务，才能返回一个实现了ScheduledFuture接口的对象。

## RunnableScheduledFuture

> public interface RunnableScheduledFuture extends RunnableFuture, ScheduledFuture

作为Runnable的ScheduledFuture成功执行run方法可以完成Future并允许访问其结果；

RunnableScheduledFuture可被看作是实现了Runnable 的 ScheduledFuture。

```java
public interface RunnableScheduledFuture<V> extends RunnableFuture<V>, ScheduledFuture<V> {
    /**
     *  如果这是一个定期任务，则返回 true。
     */
    boolean isPeriodic();
}
```
