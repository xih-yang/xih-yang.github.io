# 08、Java并发编程 - JUC常用辅助类
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/8.html
- 分类：Java并发
- 分组：教程目录
## 8、常用辅助类

### 8.1、CountDownLatch

CountDownLatch:减计数器，使用场景：

乘坐飞机时，乘务服务员都要根据手中的订票人数清点人数，只有人数到齐了才关门起飞，那怎么有效精准的控制什么时候关门起飞呢，使用CountDownLatch减法计数器有效控制。

CountDownLatch 编码模型：

`CountDownLatch countDownLatch = new CountDownLatch(6);`

`countDownLatch.countDown();` 进去一个人（产生一个线程）计数器就 -1

`countDownLatch.await();` 阻塞等待计数器归零

```java
package com.interview.concurrent.countdownlatch;
import java.util.concurrent.CountDownLatch;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：减法计数器
 * @date 2023/2/23 11:37
 */
public class CountDownLatchDemo {
    public static void main(String[] args) {
        CountDownLatch countDownLatch = new CountDownLatch(14); // 初始值14，有14个人需要上飞机
        for (int i = 1; i <=14 ; i++) {
            new Thread(()-{
                System.out.println(Thread.currentThread().getName()+"进仓了一个人");
                // 进去一个人计数器就减1
                countDownLatch.countDown();
            },String.valueOf(i)).start();
        }
        try {
            countDownLatch.await(); // 阻塞等待计数器归零
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        // 阻塞的操作 ： 计数器  num++
        System.out.println(Thread.currentThread().getName()+"====人已到齐，关门起飞====");
    }
}
```

使用CountDownLatch减法计数器，关门起飞永远都在最后一步完成。

有减法计数器，就一定有加法计数器，如下CyclicBarrier类。

### 8.2、CyclicBarrier

CyclicBarrier：加法计数器

CyclicBarrier编码模型：

1、 创建CyclicBarrier对象

```java
CyclicBarrier cyclicBarrier = new CyclicBarrier(maxNum, new MyRunnable());
```

2、编写业务代码

3、cyclicBarrier.await(); //在线程里面等待阻塞，累加1,打到最大值maxNum时，触发MyRunnable执行

示例代码如下：

```java
package com.interview.concurrent.cyclicbarrier;
import javax.swing.plaf.TableHeaderUI;
import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.CyclicBarrier;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：加法计数器
 * 适用场景：满了才开始进行下一步操作，如下场景：
 * 新浪微博连续签到10天，可得10积分。
 * @date 2023/2/23 12:02
 */
public class CyclicBarrierDemo1 {
    public static void main(String[] args) {
        /**
         *  @description:
         *  1、创建CyclicBarrier
         * 等待cyclicBarrier计数器满，就执行后面的Runnable，不满就阻塞
         * 注意，CyclicBarrier等待的是10个线程，而不是一个线程。
         */
        CyclicBarrier cyclicBarrier = new CyclicBarrier(10, new Runnable() {
            @Override
            public void run() {
                System.out.println("恭喜您，连续签到10天，获得10积分！");
            }
        });
        /**
         *  @description:
         *  在main线程中循环了10次
         */
        //cyclicBarrier(cyclicBarrier);
        /**
         * 创建10个线程
         */
       cyclicBarrierThread(cyclicBarrier);
    }
    /**
     *  @description:
     *  实际上就是在一个main线程中循环了10次，CycliBarrier等待的是10个线程，
     *  所以，CycliBarrier不会执行Runnable,而是一直等待有10个线程进来才开始执行。
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/23 12:24
     */
    public static void cyclicBarrier(CyclicBarrier cyclicBarrier){
        for (int i = 1; i < 10; i++) {
            System.out.println("签到第" + i + "天");
            try {
                cyclicBarrier.await(); //等待阻塞
            } catch (InterruptedException e) {
                e.printStackTrace();
            } catch (BrokenBarrierException e) {
                e.printStackTrace();
            }
        }
    }
    /**
     *  @description: 创建10个线程
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/23 12:25
     */
    public static void cyclicBarrierThread(CyclicBarrier cyclicBarrier){
        for (int i = 1; i <= 10 ; i++) {
            final int temp = i;
            new Thread(() - {
                System.out.println("签到第" + temp + "天");
                try {
                    cyclicBarrier.await(); //等待阻塞
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (BrokenBarrierException e) {
                    e.printStackTrace();
                }
            },String.valueOf(i)).start();
        }
    }
}
```

在一个线程循环10次，CyclicBarrier一直等待

创建10个线程，CyclicBarrier满后就执行Runnable。

总结：

CyclicBarrier和CountDownLatch非常相似，一个表示加法，一个表示减法，但也有不同之处：

1、CyclicBarrier只能唤起一个任务，CountDownLatch可以唤起多个任务。

2、CyclicBarrier可重用，CountDownLatch不可重用，计数值为0该CountDownLatch就不可再用了。

### 8.3、Semaphore

信号量通常用于限制线程数，而不是访问某些（物理或逻辑）资源。

Semaphore： 信号灯。 适用场景：限制资源，如抢位置、限流等。

Semaphore编码模型：

1、创建信号灯

```java
Semaphore semaphore = new Semaphore(5); // 5个位置
```

2、等待获取信号灯

```java
semaphore.acquire();//等待获取许可证
```

3、业务代码

4、释放信号

semaphore.release();//释放资源,车离开了，就要释放车位

示例代码如下：

```java
package com.interview.concurrent.semaphore;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:Semaphore：信号灯。适用场景：限制资源，如抢位置、限流等。
 * 10辆车，抢占5个位置
 * @date 2023/2/23 12:36
 */
public class SemaphoreDemo {
    public static void main(String[] args) {
        Semaphore semaphore = new Semaphore(5); // 5个位置
        for (int i = 1; i < 10; i++) {
            new Thread(() - {
                try {
                    semaphore.acquire();//等待获取许可证
                    System.out.println(Thread.currentThread().getName() + "抢到了车位");
                    TimeUnit.SECONDS.sleep(10); //抢到的车，在这个车位上停放了10秒钟
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }finally{
                    //停放了10秒钟的车子离开
                    System.out.println(Thread.currentThread().getName() + "离开了一辆车");
                    semaphore.release();//释放资源,车离开了，就要释放车位
                }
            },String.valueOf(i)).start();
        }
    }
}
```

运行结果如下：
