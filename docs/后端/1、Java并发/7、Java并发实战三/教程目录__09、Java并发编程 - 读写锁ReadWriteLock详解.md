# 09、Java并发编程 - 读写锁ReadWriteLock详解
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/9.html
- 分类：Java并发
- 分组：教程目录
## 9、读写锁：ReadWriteLock

读写分离：读写分离是一种思想。

之前讲的Lock是一个同步锁，它对资源的读和写，要么都锁住，要么都不锁，有的时候我们的资源，希望读的时候不锁，写的时候锁住，这样在安全的基础上能提高很大的效率。

我们希望锁只添加在需要的地方，如在写的时候，加锁，只允许一个线程去操作，读的时候不加锁，所有的线程都可以去读。

这样ReadWriteLock运营而生。

读锁（共享锁）： 这个锁可以被多个线程持有！

写锁（独占锁）：这个锁一次只能被一个线程占用！

不使用锁的情况下，示例代码如下：

```java
package com.interview.concurrent.readwritelock;
import java.util.HashMap;
import java.util.Map;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/23 15:54
 */
public class ReadWriteLockDemo {
    public static void main(String[] args) {
        //不加锁
        ResourcePool resourcePool = new ResourcePool();
        //开启5个线程去写
        for (int i = 1; i <= 5; i++) {
            final int temp = i;
            new Thread(() - resourcePool.put(temp,temp),"写线程" + i).start();
        }
        //开启5个线程去读
        for (int i = 1; i <= 5; i++) {
            final int temp = i;
            new Thread(() - resourcePool.get(temp),"读线程" + i).start();
        }
    }
}
/**
 *  @description: 资源池，，没有加锁，资源池使用volatile,保证可见性
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/23 16:07
 */
class ResourcePool{
    private volatile Map<Object,Object map = new HashMap<Object,Object();
    public void put(Object key,Object value){
        System.out.println(Thread.currentThread().getName() + ":写入数据" + key);
        map.put(key,value);
        System.out.println(Thread.currentThread().getName() + ":写入数据完成" + value);
    }
    public void get(Object key){
        System.out.println(Thread.currentThread().getName() + ":获取数据" + key);
        Object object = map.get(key);
        System.out.println(Thread.currentThread().getName() + ":获取数据完成" + object);
    }
}
```

使用读写锁后，线程之间就不会插队，一个线程必须等待其他线程完成才能执行。

ReadWriteLock编码模型：

1、创建读写锁

```java
ReadWriteLock readWriteLock = new ReentrantReadWriteLock();
```

可使用两种锁，写锁和读锁

2.1、加写锁

```java
readWriteLock.writeLock().lock();
```

2.2、业务代码:…

2.3、解写锁

```java
try/catch/finally {
  readWriteLock.writeLock().unlock();
}
```

```java
readWriteLock.readLock().lock();
```

3.1、加锁

```java
readWriteLock.readLock().lock();
```

3.1、加锁

3.2、业务代码:…

3.3、解读锁

```java
try/catch/finally {
         readWriteLock.readLock().unlock();
}
```

示例代码如下：

```java
/**
 *  @description: 资源池，，没有加锁，资源池使用volatile,保证可见性
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/23 16:07
 */
class ResourcePoolReadWriteLock{
    private volatile Map<Object,Object map = new HashMap<Object,Object();
    //1、创建读写锁
    ReadWriteLock readWriteLock = new ReentrantReadWriteLock();
    public void put(Object key,Object value){
        //2、加锁
        readWriteLock.writeLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + ":写入数据" + key);
            map.put(key,value);
            System.out.println(Thread.currentThread().getName() + ":写入数据完成" + value);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            //3、解锁
            readWriteLock.writeLock().unlock();
        }
    }
    public void get(Object key){
        //2、加锁
        readWriteLock.readLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + ":获取数据" + key);
            Object object = map.get(key);
            System.out.println(Thread.currentThread().getName() + ":获取数据完成" + object);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            //3、解锁
            readWriteLock.readLock().unlock();
        }
    }
}
```

注：

1、线程是CPU调度的，与执行顺序无关；

2、ReadWriteLock的唯一实现类是ReentrantReadWriteLock

3、Lock不能区分读和写；

4、读写分离，提高效率~ 判断业务中那些代码是只读的业务，不要去锁这些业务。
