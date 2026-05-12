# 27、Java并发编程：比较交换（CAS）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/27.html
- 分类：Java并发
- 分组：教程目录
比较交换是设计并发算法时使用的一种技术。 基本上，比较交换将期望值与变量的实际值进行比较，如果变量的实际值等于期望值，则将变量的值替换为新的值。 比较交换听起来可能有点复杂，但是一旦你理解了它，实际上就相当简单了，所以让我对这个话题做进一步的阐述。

## 哪些情况需要用到比较交换

在程序和并发算法中，一种常会出现的模式是“先检查后行动”模式。代码首先检查变量的值，然后根据该值进行操作，如此便出现了“先检查后行动”模式。 下面是一个简单的示例：

```java
class MyLock {
    private boolean locked = false;
    public boolean lock() {
        if(!locked) {
            locked = true;
            return true;
        }
        return false;
    }
}
```

此代码在多线程应用程序中使用会有很多错误，但是现在请忽略。

如你所见，lock（）方法首先检查locked成员变量是否等于false（检查），如果等于则将locked设为true（然后行动）。

如果多个线程访问同一MyLock实例，则不能保证上述lock（）函数可以正常工作。 如果线程A检查locked的值并发现它为false，则线程B也可以在同一时间检查locked的值并发现它为false。 或者，实际上，在线程A检查locked并看到它为false与线程A设置locked为true之间的任何时间，线程B都可以检查locked。 因此，线程A和线程B都可能发现locked为false，然后都将基于该信息进行操作。

为了在多线程应用程序中正常工作，“先检查后行动”操作必须是原子操作。 “原子”是指“检查”和“行动”动作均作为原子（不可分割）代码块执行。 任何开始执行该块的线程都将完成该块的执行，而不会受到其他线程的干扰。 没有其他线程可以同时执行原子块。

这是前面的代码示例，其中使用synchronized关键字将lock（）方法转换为原子代码块：

```java
class MyLock {
    private boolean locked = false;
    public synchronized boolean lock() {
        if(!locked) {
            locked = true;
            return true;
        }
        return false;
    }
}
```

现在，lock（）方法是同步的，因此在同一MyLock实例上，一次只能执行一个线程。 lock（）方法实际上是原子的。

原子lock（）方法实际上是“比较交换”的一个示例。 lock（）方法将locked变量与期望值false进行比较，如果locked等于该期望值，则将变量的值变为true。

## 比较交换作为原子操作

现代CPU内置了对原子比较交换操作的支持。 从Java 5中，可以通过java.util.concurrent.atomic包中的一些新的原子类访问CPU中的这些功能。

如下的示例展示了如何使用AtomicBoolean类实现前面所示的lock（）方法：

```java
public static class MyLock {
    private AtomicBoolean locked = new AtomicBoolean(false);
    public boolean lock() {
        return locked.compareAndSet(false, true);
    }
}
```

请注意，变量locked不再是boolean而是AtomicBoolean。 该类有compareAndSet（）函数，该函数会将AtomicBoolean实例的值与期望值进行比较，如果符合期望值，它将用新值替换原值。 在本例中，它将locked的值与false进行比较，如果为false，则将locked的新值设置为true。（译注：原文是将AtomicBoolean的新值设置为true，存在错误，译文做了修正。）

如果替换了新值，则compareAndSet（）方法返回true，否则返回false。

使用Java 5以上版本附带的比较交换功能而不是自己实现的优点是，Java 5以上版本内置的比较交换功能可以利用应用程序所运行的CPU的底层比较交换功能。 这使你的比较交换代码更快。
