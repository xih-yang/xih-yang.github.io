# 22、Java JUC 源码分析 - StampedLock锁如何使用？看这一篇就够了
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/22.html
- 分类：Java并发
- 分组：教程目录
## 1、StampedLock是什么呢？

StampedLock是JDK8新增的一个锁，在JUC包下。我们可以把他理解成为一个更加强悍的读写锁，因为它适应更多的环境。有人可能会说那他不就是加强版的ReentrantReadWriteLock嘛，但是他还是和ReentrantReadWriteLock有所不同。具体为什么不同，后面分析的时候会说。

与以往不同的是，当我们调用获取锁的方法时，它会返回一个long类型的变量。我们把这个变量称之为stamp，中文叫戳记，这个戳记代表了锁的状态。例如，当我们调用tryLock方法时，如果获取失败，那么他就会返回为0的stamp值。当调用释放锁，或者转化锁的时候，需要我们传入获取锁时候返回的stamp值。

## 2、StampedLock的三种模式

### 2.1、写锁（WriteLock）

WriteLock写锁，他是一个排它锁或者叫独占锁，也就是说同时只能有一个线程获得这把锁，当一个线程获得了这把锁之后，其他请求的线程就必须等待，这类似于ReentrantReadWriteLock的写锁。但是又不相同，因为StampedLock的写锁不是可重入的，而ReentrantReadWriteLock的写锁是可重入的。当我们调用wirteLock（）方法获得锁成功后，那么他就会返回一个stamp，用来表示这个锁的版本，当需要释放这个锁的时候，那么我们就需要用到这个stamp，并把stamp作为参数，传递给unlockWrite方法。

### 2.2悲观读锁（readLock）

悲观读锁，他其实是一个共享锁，在没有线程获取独占写锁的情况下，多个线程可以同时获取这个锁。如果已经有线程持有了写锁，则其他线程请求获取读锁就会被阻塞，这就类似于ReentrantReadWriteLock的读锁。但是又不相同，因为StampedLock的悲观读锁不是可重入的，而ReentrantReadWriteLock的读锁是可重入的。这里说的悲观，其实就是指在读取数据前会悲观的认为其他线程要对自己要读的数据进行修改，所以要先对数据进行加锁。这种悲观的方式很适合在读少写多的情景。同样当我们调用readLock（）方法获得锁成功后，那么他就会返回一个stamp，用来表示这个锁的版本，当需要释放这个锁的时候，那么我们就需要用到这个stamp，并把stamp作为参数，传递给unlockRead方法。并且它也提供了非阻塞的tryReadLock方法。

### 2.3、乐观读锁(tryoptimisticRead)

所谓的乐观，也只是相对上面的悲观来说的，在读取数据前，并不会使用CAS设置锁的状态，仅仅是通过位运算测试。如果当前线程没有持有写锁，则简单的返回一个非0的stamp版本信息。获取了stamp后在读取数据前，还需要调用validate方法验证stamp是否已经不可用，也就是看当调用tryOptimisticRead返回stamp后到当前时间期间是否有其他线程持有了写锁，如果是那么validate货返回0，否就可以对stamp版本的所进行操作。由于tryOptimisticRead并没有CAS设置锁的状态，所以我们也不用显式的释放锁。乐观锁的方式和悲观锁截然相反，所以他适合在读多写少的情况下。因为获取读锁不需要用到CAS设置锁的状态，所以效率上明显会增高很多，但是由于没有使用真正的锁，在保证数据一致性上需要复制一份要操作的变量到方法栈，并且我们在操作数据时，可能其他线程已经修改了数据，但是我们操作的是方法栈里面的数据，也就是一个快照，所以最多返回的不是最新的数据，但是数据的一致性还是可以保证的。

StampedLock还支持这三种锁在一定条件下进行相互转换。例如：long tryConvertToWrite(long stamp)期望吧stamp表示的锁升级为写锁，这个函数会在下面几种情况返回一个有效的stamp：

- 当前锁已经是写锁模式了
- 当前锁处于乐观读锁模式，并且当前写锁可用
- 当前写锁处于读锁模式，并且没有其他线程是读锁模式

注意：StampedLock的读写锁都是不可重入锁，所以在获取锁后释放锁前不应该在调用会获取锁的操作，以避免造成调用线程被阻塞。当多个线程同时尝试获取读锁和写锁时，谁先获取锁并没有规则，完全是尽力而为，是随机的。并且该锁不是直接实现Lock或者ReadWriteLock的接口，而是在自己内部维护了一个双向阻塞队列。

## 3、案例展示

```java
class Point{
//一个点的横从坐标
private double x , y;
//锁实例
private final StampedLock stampedLock = new StampedLock();
//点的移动，使用写锁来进行同步
void move(double deltaX , double deltaY){
    //上写锁
    long stamp = stampedLock.writeLock();
    try{
        x += deltaX;
        y += deltaY;
    }finally {
        //当场释放锁
        stampedLock.unlockWrite(stamp);
    }
}
//点到原点的举例，使用乐观读锁
double distanceFromOrigin(){
    //先搞一把乐观锁
    long stamp = stampedLock.tryOptimisticRead();
    //把x,y先复制到本地方法栈里面
    double deltaX = x;
    double deltaY = y;
    //使用validate验证获取了stamp后，锁有没有被其他的写线程排他性抢占
    if(!stampedLock.validate(stamp)){
        //如果抢占了则，就搞一个共享的悲观读锁
        stamp = stampedLock.readLock();
        try{
            deltaX = x;
            deltaY = y;
        }finally {
            //搞到了就丢，释放
            stampedLock.unlockRead(stamp);
        }
    }
    //返回计算结果
    return Math.sqrt(deltaX*deltaX+deltaY*deltaY);
}
//使用悲观锁获取读锁，并尝试转换为写锁
void moveIfAtOrigin(double newX , double newY){
    long stamp = stampedLock.readLock();
    try{
        while(x==0.0 && y ==0.0){
            //开始逆天改命，强行转换
            long ws = stampedLock.tryConvertToWriteLock(stamp);
            //逆天成功，则进入条件块
            if(ws != 0L){
                stamp = ws;
                x = newX;
                y = newY;
                break;
            }else{
                //逆天失败,那么直接丢锁
                stampedLock.unlockRead(stamp);
                stamp = stampedLock.writeLock();
            }
        }
    }finally {
        //丢锁
        stampedLock.unlock(stamp);
    }
    }
```
