# 07、Java JUC源码分析 - locks-AQS-共享模式
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/7.html
- 分类：Java并发
- 分组：教程目录
AQS中一定要记住2点:

**1、** 处理流程：；

if(!请求成功)

加入队列

**2、** 请求是对state的判断，AQS不关心你state表示什么，你可以表示状态也可以表示数量，由子类实现对请求的判断将规则的判断和规则的处理分离，有点像模板模式；

先想想什么是独占什么是共享，举个栗子：独占就像大家拿号去排队体检，你拿号了发现前面还有n个人，没办法，等吧，然后你前面的人体检完了，医生就说，你通知下一位吧，ok，你出来通知排你后面的人，这个人有可能是跟占座位似得就放在纸在哪，所以你跳过他，再通知后面真正有人的进去。而共享则不同了，这个号可能不止属于你一个人，可能属于你公司所有体检的人，所以拿号排队轮到你的时候，你就需要通知排队的所有同事，大家一起体检去啊（这个共享的不太恰当，应该当成condition例子来说才好）。感觉独占和共享的大概意思就是这样。

还是看下AQS的共享模式

```java
public final void acquireShared(int arg) {
//tryAcquireShared请求判断又是由子类实现判断
    if (tryAcquireShared(arg) < 0)
    //失败后加入队列
        doAcquireShared(arg);
}
```

```java
private void doAcquireShared(int arg) {
//节点状态是共享，之前的独占模式是EXCLUSIVE
//跟独占一样加入队列
    final Node node = addWaiter(Node.SHARED);
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
        //还是判断pre是不是头结点，是就再次请求
            final Node p = node.predecessor();
            if (p == head) {
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                //这里和独占不同，独占模式下只是设置成头结点
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    if (interrupted)
                        selfInterrupt();
                    failed = false;
                    return;
                }
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```

发现共享整个挂起的doAcquireShared方法跟独占模式的acquireQueued处理差不多，唯一有区别的似乎就是如果pre节点是头结点，当前节点请求成功，独占模式只是将节点设置为head然后return，这里除了sethead还将唤醒队列的中其他节点，其他方法不管，继续看setHeadAndPropagate：

```java
private void setHeadAndPropagate(Node node, int propagate) {
    Node h = head; // Record old head for check below
    setHead(node);
    if (propagate > 0 || h == null || h.waitStatus < 0) {
        Node s = node.next;
        //当前node请求成功后判断next节点是共享节点就继续release
        if (s == null || s.isShared())
            doReleaseShared();
    }
}
private void doReleaseShared() {
    /*
			使用for保证队列中节点一定会被传递，即使有其他acquire或release在进行
     */
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            //节点状态为SIGNAL表示需要向后传递
            if (ws == Node.SIGNAL) {
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;            // 失败了就loop
                unparkSuccessor(h);
            }
            //为0就设置成PROPAGETE表示需要传播
            else if (ws == 0 &&
                     !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        if (h == head)                   // loop if head changed
            break;
    }
}
```

这里最重要的是理解doReleaseShared，一个进程 doReleaseShared，然后unparkSuccessor，这时候被唤醒的其他线程可能线程切换运行，重新请求修改head节点，没机会的话，这里检查head节点没有变化就继续for，一直等到被唤醒的线程时间片切换到，然后再将继续修改下一个节点，到最后队列中的所有节点都被唤醒。

这里一定要想着线程切换多看看几遍，我当时就郁闷了半天这个疑问。

对应的acquireSharedInterruptibly响应中断和tryAcquireSharedNanos响应中断超时，跟独占的都差不多。

共享模式release，这个没什么好说的，释放判断成功就doReleaseShared，把队列中所有节点release

```java
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}
```

共享跟独占的流程图差不多，不想画了，改天学习下AQS的condition。
