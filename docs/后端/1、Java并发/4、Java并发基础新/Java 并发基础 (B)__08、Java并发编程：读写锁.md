# 08、Java并发编程：读写锁
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/28.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 8.1 概述

悲观锁：

可以看到，执行-2000的操作时，因为被-5000的线程抢先拿走了锁，所以它不能执行。悲观锁就是每次获取资源时，都会对其进行上锁。虽然不容易出问题，但是效率低。

乐观锁：

每个线程都可以拿到资源，不过拿时，也会拿到版本编号。当修改后，确认资源的版本好与自己的是否相同，如果不同，则重新拿资源并获取新的版本编号。可以看到，乐观锁支持多线程修改，但是容易出问题。

表锁：对整张表进行上锁。

行锁：只对表的一行进行上锁，有可能发生死锁。

读锁：共享锁，可以多个线程一起读

写锁：独占锁，只能一个线程写

## 8.2 ReentrantReadWriteLock读写锁 案例实现

```java
package readwrite;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantReadWriteLock;
//创建一个资源类
class MyCache{
    //创建map集合
    private volatile Map<String, Object> map = new HashMap<>();
    //当一个变量被 volatile 修饰时，任何线程对它的写操作都会立即刷新到主内存中，并且会强制让缓存了该变量的线程的数据清空，
    //必须从主内存重新读取最新数据。
    //创建读写锁
    ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    //放数据
    public void put(String key, Object value) {
        //锁上
        rwLock.writeLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + "：正在执行写操作" + key);
            TimeUnit.MILLISECONDS.sleep(500);
            map.put(key, value);
            System.out.println(Thread.currentThread().getName() + "：写完了" + key);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //释放锁
            rwLock.writeLock().unlock();
        }
    }
    //取数据
    public Object get(String key) {
        rwLock.readLock().lock();
        Object result = null;
        //暂停一会
        try {
            System.out.println(Thread.currentThread().getName() + "：正在执行读操作" + key);
            TimeUnit.MILLISECONDS.sleep(500);
            result = map.get(key);
            System.out.println(Thread.currentThread().getName() + "已经取完了" + key);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //释放读锁
            rwLock.readLock().unlock();
        }
        return result;
    }
}
public class ReadWriteLockDemo {
    public static void main(String[] args) {
        MyCache myCache = new MyCache();
        //创建线程往里面放数据
        for (int i = 0; i < 5; i++) {
            int num = 1;
            new Thread(()->{
                myCache.put(""+num, num);
            }, String.valueOf(i)).start();
        }
        //创建线程取数据
        for(int i = 0; i < 5; i++) {
            int num = i;
            new Thread(()->{
                myCache.get(""+num);
            }, String.valueOf(i)).start();
        }
    }
}
```

## 8.3 读写锁深入

读写锁：一个资源，可以被多个读线程访问，或者可以被一个写线程访问，但是不能同时存在读写线程。总结就是读读共享、写写互斥、读写互斥。

缺点：如果有大量的读操作，写操作一直得不到运行。反之亦然。

## 8.4 锁降级

可以将写锁降级为读锁：

获取写锁 --> 获取读锁 --> 释放写锁 --> 释放读锁

```java
package readwrite;
import java.util.concurrent.locks.ReentrantReadWriteLock;
public class Demo1 {
    public static void main(String[] args) {
        //可重入锁
        ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
        ReentrantReadWriteLock.ReadLock readLock = rwLock.readLock();  //读锁
        ReentrantReadWriteLock.WriteLock writeLock = rwLock.writeLock();  //写锁
        //锁降级
        //1、获取写锁
        writeLock.lock();
        System.out.println("xiaoxin");
        //2、获取读锁
        readLock.lock();
        //3、释放写锁，这时候其他读线程可以来写咯！
        writeLock.unlock();
        //4、释放读锁
        readLock.unlock();
    }
}
```
