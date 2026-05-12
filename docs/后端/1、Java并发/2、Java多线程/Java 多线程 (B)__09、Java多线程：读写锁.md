# 09、Java多线程：读写锁
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/23.html
- 分类：Java并发
- 分组：Java 多线程 (B)
## 8.1 ReentrantReadWriteLock 读写锁

前面讲到的 synchronized 内部锁和 ReentrantLock 都是独占锁（排他锁），同一时间只允许一个线程执行同步代码块，可以保证线程的安全性，但是执行效率低。

ReentrantReadWriteLock 读写锁是一种改进的排他锁，允许多个线程同时读取共享数据，但是一次只允许一个线程对数据进行修改。

读写锁通过读锁与写锁来完成读写操作。访问共享数据前必须先获得读锁，修改共享数据前必须先获得写锁，写锁是排他的，读锁在读线程之间共享。

在java.util.concurrent.locks包中定义了ReadWriteLock接口，该接口中定义了readLock()返回读锁，定义了writeLock()返回写锁。该接口的实现类是ReentrantReadWriteLock。

基本使用：

```java
//定义读写锁
ReadWriteLock rwLock = new ReentrantReadWriteLock();
//获得读锁
Lock readLock = rwLock.readLock();
//获得写锁
Lock writeLock = rwLock.writeLock();
//读数据
try {
    readLock.lock();
    //读数据
} finally {
    readLock.unlock();
}
//写数据
try {
    writeLock.lock();
    //写数据
} finally {
    writeLock.unlock();
}
```

读读共享：

从下面这段代码的运行状态中可以看出，创建的5个线程都同时拿到了读锁，而不用每隔3秒拿一个。说明读锁是共享的。

```java
package lock.readwrite;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
/**
 * ReadWriteLock读写锁允许多个线程同时读，即读读共享
 */
public class Test01 {
    static class Service {
        //定义读写锁
        ReadWriteLock readWriteLock = new ReentrantReadWriteLock();
        public void read() {
            //定义方法读取数据
            try {
                readWriteLock.readLock().lock();  //申请读锁
                System.out.println(Thread.currentThread().getName() + "获得读锁");
                TimeUnit.SECONDS.sleep(3);
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                readWriteLock.readLock().unlock();  //释放读锁
            }
        }
    }
    public static void main(String[] args) {
        Service service = new Service();
        for(int i = 0; i < 5; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    service.read();
                }
            }).start();
        }
    }
}
```

写写互斥：

从下面的例子中可以看出来，写写是互斥的，每个线程必须依次获得写锁：

```java
package lock.readwrite;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
public class Test02 {
    static class Service {
        private ReadWriteLock readWriteLock = new ReentrantReadWriteLock();
        public void write() {
            try {
                readWriteLock.writeLock().lock();
                System.out.println(Thread.currentThread().getName() + "获得了写锁");
                TimeUnit.SECONDS.sleep(3);
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                readWriteLock.writeLock().unlock();
            }
        }
    }
    public static void main(String[] args) {
        Service service = new Service();
        for(int i = 0; i < 5; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    service.write();
                }
            }).start();
        }
    }
}
```

读写互斥：

一个线程获得读锁，写线程等待。一个线程获得写锁，其他线程等待。

```java
package lock.readwrite;
import java.sql.Time;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
public class Test03 {
    static class Service {
        private ReadWriteLock readWriteLock = new ReentrantReadWriteLock();
        private Lock readLock = readWriteLock.readLock();
        private Lock writeLock = readWriteLock.writeLock();
        public void read() {
            try {
                readLock.lock();
                System.out.println(Thread.currentThread().getName() + "读取数据：" + System.currentTimeMillis());
                TimeUnit.SECONDS.sleep(2);
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                readLock.unlock();
            }
        }
        public void write() {
            try {
                writeLock.lock();
                System.out.println(Thread.currentThread().getName() + "写数据：" + System.currentTimeMillis());
                TimeUnit.SECONDS.sleep(2);
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                writeLock.unlock();
            }
        }
    }
    public static void main(String[] args) throws InterruptedException {
        Service service = new Service();
        new Thread(new Runnable() {
            @Override
            public void run() {
                service.read();
            }
        }).start();
        for(int i = 0; i < 5; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    service.write();
                }
            }).start();
            TimeUnit.MILLISECONDS.sleep(500);
        }
        for(int i = 0; i < 5; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    service.read();
                }
            }).start();
        }
    }
}
```
