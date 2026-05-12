# 06、Quartz 实战 - job任务异常处理方式
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/6.html
- 分类：作业调度
- 分组：教程目录
**Job1类**

```java
package org.quartz.examples.example6;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.PersistJobDataAfterExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
/**
 * <p>
 * 一个会引发作业执行异常的作业
 * </p>
 */
@PersistJobDataAfterExecution // 持久化JobDataMap里的数据，使下一个定时任务还能获取到这些值
@DisallowConcurrentExecution // 禁止并发多任务执行，所以永远只有一个任务在执行中
public class BadJob1 implements Job {
    // Logging
    private static Logger LOG = LoggerFactory.getLogger(BadJob1.class);
    private int calculation;
    //必须要有public修饰的无参构造函数
    public BadJob1() {
    }
    //定时器执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        JobDataMap dataMap = context.getJobDetail().getJobDataMap();
        int denominator = dataMap.getInt("denominator");
        LOG.info("---" + jobKey + " executing at " + new Date() + " with denominator " + denominator);
        // 一个人为设计的异常示例，该异常将由该作业生成，原因是除0错误(仅在第一次运行时)
        try {
            calculation = 4815 / denominator;
        } catch (Exception e) {
            LOG.info("--- Error in job!");
            JobExecutionException e2 = new JobExecutionException(e);
            // 修正分母，以便下次作业运行时不会再次失败
            dataMap.put("denominator", "1");
            // 是否立即重新触发任务？true
            e2.setRefireImmediately(true);
            throw e2;
        }
        LOG.info("---" + jobKey + " completed at " + new Date());
    }
}
```

**Job2类**

```java
package org.quartz.examples.example6;
import java.util.Date;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.PersistJobDataAfterExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * <p>
 * 一个会引发作业执行异常的作业
 * </p>
 */
@PersistJobDataAfterExecution // 持久化JobDataMap里的数据，使下一个定时任务还能获取到这些值
@DisallowConcurrentExecution // 禁止并发多任务执行，所以永远只有一个任务在执行中
public class BadJob2 implements Job {
    // Logging
    private static Logger LOG = LoggerFactory.getLogger(BadJob2.class);
    private int calculation;
    // 必须要有public修饰的无参构造函数
    public BadJob2() {
    }
    // 定时器执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        LOG.info("---" + jobKey + " executing at " + new Date());
        // 一个人为设计的异常示例，该异常将由该作业由于除零错误而生成
        try {
            int zero = 0;
            calculation = 4815 / zero;
        } catch (Exception e) {
            LOG.info("--- Error in job!");
            JobExecutionException e2 = new JobExecutionException(e);
            // Quartz将自动取消与此作业关联的所有触发器的调度，这样它就不会再次运行
            e2.setUnscheduleAllTriggers(true);
            throw e2;
        }
        LOG.info("---" + jobKey + " completed at " + new Date());
    }
}
```

**任务调度类**

```java
package org.quartz.examples.example6;
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
 * 这个作业演示了Quartz如何处理作业抛出的JobExecutionExceptions
 */
public class JobExceptionExample {
    Logger LOG = LoggerFactory.getLogger(JobExceptionExample.class);
    public void run() throws Exception {
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        // 第一个参数：null就是默认当前时间，也可以指定时间
        // 第二个参数：把一分钟按15进行划分，也就是60/15等份。
        // 举例：当前时间是21:01:27，那么startTime就是21:15:00。当前时间是21:35:32，那么startTime就是21:45:00。
        Date startTime = nextGivenSecondDate(null, 15);
        // ========================================================
        // ============ badJob1将每10秒运行一次，此作业将抛出异常并立即重新启动。
        // ========================================================
        JobDetail job = newJob(BadJob1.class).withIdentity("badJob1", "group1").usingJobData("denominator", "0")
                .build();
        // 触发器每间隔10秒执行一次，无限循环
        SimpleTrigger trigger = newTrigger().withIdentity("trigger1", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(10).repeatForever()).build();
        Date ft = sched.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + ft + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        // ========================================================
        // ============ badJob2将每5秒运行一次，此作业将抛出异常，在异常catch块里取消了使用该任务触发器的所有任务的触发，并且永不重新启动。
        // ========================================================
        JobDetail job2 = newJob(BadJob2.class).withIdentity("badJob2", "group1").build();
        // 触发器每间隔5秒执行一次，无限循环
        SimpleTrigger trigger2 = newTrigger().withIdentity("trigger2", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(5).repeatForever()).build();
        Date ft2 = sched.scheduleJob(job2, trigger2);
        LOG.info(job2.getKey() + " will run at: " + ft2 + " and repeat: " + trigger2.getRepeatCount() + " times, every "
                + trigger2.getRepeatInterval() / 1000 + " seconds");
        sched.start();
        Thread.sleep(30L * 1000L);
        sched.shutdown(false);
        LOG.info("------- Shutdown Complete -----------------");
        SchedulerMetaData metaData = sched.getMetaData();
        LOG.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
    }
    public static void main(String[] args) throws Exception {
        JobExceptionExample example = new JobExceptionExample();
        example.run();
    }
}
```
