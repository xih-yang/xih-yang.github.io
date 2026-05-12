# 11、Java JUC 源码分析 - ReentrantLock-NonfairSync源码逐行深度分析（下）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/11.html
- 分类：Java并发
- 分组：教程目录
## 前言

前面[ReentrantLock-NonfairSync源码逐行深度分析（上）](/zhuanlan/java/concurrency/10/9.html)和[ReentrantLock-NonfairSync源码逐行深度分析（中）](/zhuanlan/java/concurrency/10/10.html)两文从源码层面深度分析了NonfairSync的逻辑，有了前面的基础，我们就算是向AQS迈出了第一步，本文针对前面两篇文章做一个系统总结，后面就继续分析依赖AQS的其它工具类。

## ReentrantLock关键点

- AQS是抽象类AbstractQueuedSynchronizer的缩写，ReentrantLock中定义了静态内部类Sync继承自AQS，并且分别有静态内部类：公平锁FairSync和非公平锁NonfairSync继承自Sync
- 通过CAS修改state值完成加锁操作
- 通过exclusiveOwnerThread字段保存持锁线程，依赖它完成锁重入判断
- 使用双向链表结构的CLH队列作为存储阻塞线程的数据结构，链表节点类型为Node，Node是AQS的静态内部类，包装了thread
- AQS有两个Node类型的字段head和tail，分别表示CLH的头节点和尾节点
- CLH的头节点是一个空的Node对象，而不是一个真实代表了thread的Node
- 竞争锁失败的线程通过死循环（自旋）+CAS的方式保证必须入队成功（总是从尾部插入）
- 节点在阻塞之前会先将前驱节点的waitStatus修改为SIGNAL(-1)
- 阻塞线程的唤醒操作（unpark）由释放锁的线程执行，会唤醒head节点的next节点，当然前提是head.waitStatus!=0
- 唤醒分为unpark唤醒和中断唤醒（暂时不考虑超时）
- 唤醒线程之前会将head节点的waitStatus重置为初始值0
- 如果需要唤醒的节点无效，那么从CLH队列的末尾往前寻找最靠近队头的有效节点唤醒
- 如果阻塞线程是被中断唤醒的，在lock()方法中会将中断状态存下来，继续尝试竞争锁，最终通过自我中断重新打上中断标记以传递给外层调用者；lockInterruptibly()方法会抛出中断异常，在finally代码块中会移除被中断的节点，同时还可能唤醒后驱节点
- CLH队列中一个节点的阻塞和唤醒行为由其前驱节点的waitStatus字段控制
- 代码中使用了大量的CAS和失败补偿保证并发安全
- 等等~

## 总结

AQS中的代码虽然并不算多，但是基本都是和多线程并发有关，所以图很难画的比较直观明了，只能说尽力而为~以下总结基于非公平锁NonfairSync的实现：

这几个类的简单组合关系和我们分析的几个核心参数结构如下：
