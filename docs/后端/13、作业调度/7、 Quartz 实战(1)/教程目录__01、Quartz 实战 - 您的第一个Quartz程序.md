# 01、Quartz 实战 - 您的第一个Quartz程序
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/1.html
- 分类：作业调度
- 分组：教程目录
**任务类**

```java
package org.quartz.examples.example1;
import java.util.Date;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
/**
  * 定时任务执行Job类，需继承Job父类
 */
public class HelloJob implements Job {
    private static Logger LOG = LoggerFactory.getLogger(HelloJob.class);
    //必须要有public修饰的无参构造函数
    public HelloJob() {
    }
    //一个简单任务，执行的时候打印一句“Hello World! - ”
    public void execute(JobExecutionContext context) throws JobExecutionException {
        LOG.info("Hello World! - " + new Date());
    }
}
```

**调度管理类**

```java
package org.quartz.examples.example1;
import static org.quartz.DateBuilder.evenMinuteDate;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.Trigger;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
/**
 * 这个示例将演示如何启动和关闭Quartz调度器，以及如何调度要在Quartz中运行的作业。
 */
public class SimpleExample {
    Logger LOG = LoggerFactory.getLogger(SimpleExample.class);
    public void run() throws Exception {
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory schedulerFactory = new StdSchedulerFactory();
        Scheduler scheduler = schedulerFactory.getScheduler();
        // 定义一个开始运行时间：下一分钟
        Date runTime = evenMinuteDate(new Date());
        // 定义一个Job类，命名为job1，并绑定到一个名为group1的组中
        JobDetail job = newJob(HelloJob.class).withIdentity("job1", "group1").build();
        // 实例化一个触发器，命名为trigger1，并绑定到一个名为group1的组中，Job类运行开始时间为runTime（下一分钟）
        Trigger trigger = newTrigger().withIdentity("trigger1", "group1").startAt(runTime).build();
        // 告诉quartz使用我们的触发器来调度任务
        scheduler.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + runTime);
        // 启动调度器(在调度器启动之前，实际上什么都不能运行)
        scheduler.start();
        // 等待的时间足够长，使调度程序有机会运行完毕Job作业!
        try {
            Thread.sleep(65L * 1000L);
        } catch (Exception e) {
        }
```

/**

　　　　　　* 终止调度。

　　　　　　* 但是如果当前仍然有任务正在运行中，则会等待该任务执行完毕再终止，期间debug信息会打印：

　　　　　　* 21:48:54.965 [main] DEBUG org.quartz.simpl.SimpleThreadPool - Waiting for thread TestScheduler_Worker-1 to shut down

　　　　　　*/

scheduler.shutdown(true);

```java
    }
    public static void main(String[] args) throws Exception {
        SimpleExample example = new SimpleExample();
        example.run();
    }
}
```
