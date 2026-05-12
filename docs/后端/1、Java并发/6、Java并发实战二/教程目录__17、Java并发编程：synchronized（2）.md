# 17、Java并发编程：synchronized（2）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/17.html
- 分类：Java并发
- 分组：教程目录
[上一篇文章](/zhuanlan/java/concurrency/6/16.html)中提到了synchronized关键字在实现同步方面的作用与原理，其实，除了互斥机制，synchronized还能实现内存可见性——当一个线程修改了对象的状态，其他线程可以看到状态的变化。

关于synchronized的内存可见性做如下说明：

**1、** 线程B在执行由锁保护的同步代码块时，可以看到线程A对同一个锁保护的同步代码块的操作结果举个例子，A获取对象M的对象级别锁，并进入代码块，随后释放对象M的对象级别锁，在释放后由线程B获取到了对象M的对象级别锁，那么B就能看到线程A操作的结果，反之，如果线程B在释放锁后，线程A才获取到锁，那么B就不一定能够看到A操作的结果了；

**2、** 对内存可见性的保证是基于happen-before原则的，任何对锁的获取happen-before于对锁的释放；

**3、** 从内存可见性的角度volatile与锁由相同的语义，写volatile变量相当于退出同步代码块，读volatile变量相当于进入同步代码块；

**4、** 锁机制可以保证原子性和可见性，而volatile只能保证可见性在需要同步的时候应该优先使用synchronized；

**5、** 当且仅当对变量的写入不依赖当前值以及该变量包含在具有其他变量的不变式（比如i++）的时候才可以使用volatile；
