# 04、Quartz 实战 - JobDataMap—带状态集合的定时器内置集合
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/4.html
- 分类：作业调度
- 分组：教程目录
**任务类**

```java
package org.quartz.examples.example4;
import java.util.Date;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.PersistJobDataAfterExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 任务job。这是一个接收参数并维护状态（前后任务可以共享数据）的简单作业
 */
@PersistJobDataAfterExecution //持久化JobDataMap里的数据，使下一个定时任务还能获取到这些值
@DisallowConcurrentExecution //禁止并发多任务执行，所以永远只有一个任务在执行中
public class ColorJob implements Job {
    private static Logger _log = LoggerFactory.getLogger(ColorJob.class);
    // parameter names specific to this job
    public static final String FAVORITE_COLOR = "favorite color";
    public static final String EXECUTION_COUNT = "count";
    // 因为Quartz每次执行类时都会重新实例化该类，所以不能使用实例的非静态成员变量来维护状态!
    private int _counter = 1;
    // 必须要有public修饰的无参构造函数
    public ColorJob() {
    }
    /**
     *  这个执行方法会显示，放在JobDataMap里的数据在前后相关的任务中可以有数据状态（存在JobDataMap里）。
     *  而类的成员变量对象_counter却没有状态，每次都会被初始化为1.
     */
    public void execute(JobExecutionContext context) throws JobExecutionException {
        // 这个作业只是打印出它的作业名称以及它运行的日期和时间
        JobKey jobKey = context.getJobDetail().getKey();
        // 获取并打印传递的参数
        JobDataMap data = context.getJobDetail().getJobDataMap();
        String favoriteColor = data.getString(FAVORITE_COLOR);
        int count = data.getInt(EXECUTION_COUNT);
        _log.info("ColorJob: " + jobKey + " executing at " + new Date() + "\n" + "  favorite color is " + favoriteColor
                + "\n" + "  execution count (from job map) is " + count + "\n"
                + "  execution count (from job member variable) is " + _counter);
        // job执行计数器+1
        count++;
        data.put(EXECUTION_COUNT, count);
        // 增加局部成员变量
        // 这没有实际用途，因为作业状态不能通过成员变量维护!
        _counter++;
        try {
            Thread.sleep(60L * 1000L);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

**调度管理类**

```java
package org.quartz.examples.example4;
import static org.quartz.DateBuilder.nextGivenSecondDate;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.SimpleScheduleBuilder.simpleSchedule;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.SimpleTrigger;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
/**
 * 这个案例将演示如何将作业参数传递到作业中，以及如何维护状态
 */
public class JobStateExample {
    public void run() throws Exception {
        Logger log = LoggerFactory.getLogger(JobStateExample.class);
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        //第一个参数：null就是默认当前时间，也可以指定时间
        // 第二个参数：把一分钟按30进行划分，也就是60/30等份。
        //举例：当前时间是21:01:27，那么startTime就是21:01:30。当前时间是21:01:32，那么startTime就是21:02:00。
        Date startTime = nextGivenSecondDate(null, 10);
        // ========================================================
        // ============ job1 将运行五次，启动一次重复4次，每隔10秒执行一次
        // ========================================================
        JobDetail job1 = newJob(ColorJob.class).withIdentity("job1", "group1").build();
        SimpleTrigger trigger1 = newTrigger().withIdentity("trigger1", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(10).withRepeatCount(4)).build();
        // 往job1的JobDataMap放入初始化数据
        job1.getJobDataMap().put(ColorJob.FAVORITE_COLOR, "Green");
        job1.getJobDataMap().put(ColorJob.EXECUTION_COUNT, 1);
        // 调度任务运行
        Date scheduleTime1 = sched.scheduleJob(job1, trigger1);
        log.info(job1.getKey() + " will run at: " + scheduleTime1 + " and repeat: " + trigger1.getRepeatCount()
                + " times, every " + trigger1.getRepeatInterval() / 1000 + " seconds");
        // ========================================================
        // ============ job2 将运行五次，启动一次重复4次，每隔10秒执行一次
        // ========================================================
        JobDetail job2 = newJob(ColorJob.class).withIdentity("job2", "group1").build();
        SimpleTrigger trigger2 = newTrigger().withIdentity("trigger2", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(10).withRepeatCount(4)).build();
        // 往job2的JobDataMap放入初始化数据
        // 这个job任务喜欢的颜色是红色了!
        job2.getJobDataMap().put(ColorJob.FAVORITE_COLOR, "Red");
        job2.getJobDataMap().put(ColorJob.EXECUTION_COUNT, 1);
        // 调度任务运行
        Date scheduleTime2 = sched.scheduleJob(job2, trigger2);
        log.info(job2.getKey().toString() + " will run at: " + scheduleTime2 + " and repeat: "
                + trigger2.getRepeatCount() + " times, every " + trigger2.getRepeatInterval() / 1000 + " seconds");
        // 启动调度
        sched.start();
        try {
            Thread.sleep(10L * 1000L);   // 等待60秒
        } catch (Exception e) {
        }
        /**
         * 终止调度。
         * 但是如果当前仍然有任务正在运行中，则会等待该任务执行完毕再终止，期间debug信息会打印：
         * 21:48:54.965 [main] DEBUG org.quartz.simpl.SimpleThreadPool - Waiting for thread TestScheduler_Worker-1 to shut down
         */
        sched.shutdown(true); //终止调度
        SchedulerMetaData metaData = sched.getMetaData();
        log.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
    }
    public static void main(String[] args) throws Exception {
        JobStateExample example = new JobStateExample();
        example.run();
    }
}
```
