# 02、Java 任务调度 - Timer 及 ScheduledThreadPoolExecutor 介绍
- 来源：https://ddkk.com/zhuanlan/job/job/1/2.html
- 分类：作业调度
- 分组：教程目录
本文主要介绍使用 Java 原生的 java.util.Timer 和 java.util.concurrent.ScheduledThreadPoolExecutor 来实现定时任务；本文中所使用到的 Java 版本：jdk1.8.0_181。

## 1、java.util.Timer 使用

```java
@Test
public void test1() throws InterruptedException {
    Timer timer = new Timer();
    timer.schedule(new TimerTask() {
        @Override
        public void run() {
            logger.info("在一个时间点运行一次");
            throw new RuntimeException();
        }
    }, new Date(System.currentTimeMillis() + 2000));
    timer.schedule(new TimerTask() {
        @Override
        public void run() {
            logger.info("延迟3s运行一次");
        }
    }, 3000);
    timer.schedule(new TimerTask() {
        @Override
        public void run() {
            logger.info("延迟4s运行第一次，然后每隔2s运行一次");
        }
    }, 4000, 2000);
    timer.schedule(new TimerTask() {
        @Override
        public void run() {
            logger.info("在一个时间点运行第一次，然后每隔2s运行一次");
        }
    }, new Date(System.currentTimeMillis() + 1000 * 5), 2000);
    Thread.sleep(1000 * 20);
}
@Test
public void test2() throws InterruptedException {
    Timer timer = new Timer();
    timer.scheduleAtFixedRate(new TimerTask() {
        @Override
        public void run() {
            logger.info("延迟3s运行第一次，然后每隔2s运行一次");
        }
    }, 3000, 2000);
    timer.scheduleAtFixedRate(new TimerTask() {
        @Override
        public void run() {
            logger.info("在一个时间点运行第一次，然后每隔2s运行一次");
        }
    }, new Date(System.currentTimeMillis() + 4000), 2000);
    Thread.sleep(1000 * 20);
}
```

java.util.Timer 有如下缺点：

**1、** java.util.Timer是单线程执行任务，如果多个任务在一个时间点执行，会造成任务不能够在准确的时间点执行；

**2、** java.util.Timer执行某个任务过程中如果抛出了异常，那么执行线程将会终止，导致其他的任务也不能再执行；

基于java.util.Timer 的缺点，可使用 java.util.concurrent.ScheduledThreadPoolExecutor 来代替 java.util.Timer，ScheduledThreadPoolExecutor 使用线程池来执行任务，不存在上面的缺点。

## 2、java.util.concurrent.ScheduledThreadPoolExecutor 使用

```java
@Test
public void test3() throws InterruptedException {
    ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(1);
    executor.schedule(() -> {
        logger.info("延迟2s运行一次");
    }, 2, TimeUnit.SECONDS);
    executor.schedule(() -> {
        logger.info("延迟3s运行一次");
        return null;
    }, 3, TimeUnit.SECONDS);
    executor.scheduleAtFixedRate(() -> {
        logger.info("延迟4s运行第一次，然后每隔2s运行一次");
    }, 4, 2, TimeUnit.SECONDS);
    executor.scheduleWithFixedDelay(() -> {
        logger.info("延迟5s运行第一次，上一次任务运行结束后等2s再运行下一次任务。");
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }, 5, 2, TimeUnit.SECONDS);
    Thread.sleep(1000 * 20);
}
```
