# 02、Quartz 实战 - 触发器Trigger花式Scheduler调度job
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/2.html
- 分类：作业调度
- 分组：教程目录
**任务类**

```java
 1 package org.quartz.examples.example2;
 2 
 3 import java.util.Date;
 4 
 5 import org.slf4j.Logger;
 6 import org.slf4j.LoggerFactory;
 7 import org.quartz.Job;
 8 import org.quartz.JobExecutionContext;
 9 import org.quartz.JobExecutionException;
10 import org.quartz.JobKey;
11 
12 /**
13  * 任务job
14  */
15 public class SimpleJob implements Job {
16 
17     private static Logger LOG = LoggerFactory.getLogger(SimpleJob.class);
18 
19     // 必须要有public修饰的无参构造函数
20     public SimpleJob() {
21     }
22 
23     // 任务执行方法
24     public void execute(JobExecutionContext context) throws JobExecutionException {
25         JobKey jobKey = context.getJobDetail().getKey();  //jobKey长这样：group1.job6
26         LOG.info("执行任务。SimpleJob says: " + jobKey + " executing at " + new Date());
27     }
28 
29 }
```

**调度管理类**

```java
package org.quartz.examples.example2;
import static org.quartz.DateBuilder.futureDate;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.JobKey.jobKey;
import static org.quartz.SimpleScheduleBuilder.simpleSchedule;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.DateBuilder;
import org.quartz.DateBuilder.IntervalUnit;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.SimpleTrigger;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
/**
 * 这个例子表明，只要触发器运用的好，job任务可以被花式执行
 */
public class SimpleTriggerExample {
    Logger LOG = LoggerFactory.getLogger(SimpleTriggerExample.class);
    public void run() throws Exception {
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler scheduler = sf.getScheduler();
        // 第一个参数：null就是默认当前时间，也可以指定时间
        // 第二个参数：把一分钟按15进行划分，也就是60/15等份。
        // 举例：当前时间是10:26:04，那么startTime就是10:26:15。当前时间是10:26:31，那么startTime就是10:26:45。
        Date startTime = DateBuilder.nextGivenSecondDate(null, 15);
        // ========================================================
        // ============ job1 任务绑定到group1 组中 ==================
        // ========================================================
        JobDetail job = newJob(SimpleJob.class).withIdentity("job1", "group1").build();
        // 实例化一个触发器，命名为trigger1，并绑定到一个名为group1的组中，Job类运行开始时间为runTime（下一分钟）
        SimpleTrigger trigger = (SimpleTrigger) newTrigger().withIdentity("trigger1", "group1").startAt(startTime)
                .build();
        Date date = scheduler.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + date + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        // ========================================================
        // ============ job2 任务绑定到group1 组中 ==================
        // ========================================================
        job = newJob(SimpleJob.class).withIdentity("job2", "group1").build();
        trigger = (SimpleTrigger) newTrigger().withIdentity("trigger2", "group1").startAt(startTime).build();
        date = scheduler.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + date + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        // ====================================================================
        // ============ job3 任务绑定到group1 组中，运行一次每间隔10秒重复1次，总共重复10次
        // ====================================================================
        job = newJob(SimpleJob.class).withIdentity("job3", "group1").build();
        trigger = newTrigger().withIdentity("trigger3", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(10).withRepeatCount(10)).build();
        date = scheduler.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + date + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        // ====================================================================
        // ============ job3 任务绑定到group2 组中，将被另一个触发器调度，这一次将以70秒的间隔重复两次
        // ====================================================================
        trigger = newTrigger().withIdentity("trigger3", "group2").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(10).withRepeatCount(2)).forJob(job).build();
        date = scheduler.scheduleJob(trigger);
        LOG.info(job.getKey() + " will [also] run at: " + date + " and repeat: " + trigger.getRepeatCount()
                + " times, every " + trigger.getRepeatInterval() / 1000 + " seconds");
        // ====================================================================
        // ============ job4 将被执行6次，执行一次重复5次，每次间隔10秒
        // ====================================================================
        job = newJob(SimpleJob.class).withIdentity("job4", "group1").build();
        trigger = newTrigger().withIdentity("trigger4", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(10).withRepeatCount(5)).build();
        date = scheduler.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + date + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        // ====================================================================
        // ============ job5 将在5分钟后执行一次
        // ====================================================================
        job = newJob(SimpleJob.class).withIdentity("job5", "group1").build();
        trigger = (SimpleTrigger) newTrigger().withIdentity("trigger5", "group1")
                .startAt(futureDate(5, IntervalUnit.MINUTE)).build();
        date = scheduler.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + date + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        // ====================================================================
        // ============ job6 将被无限期地执行，每隔40秒执行一次
        // ====================================================================
        job = newJob(SimpleJob.class).withIdentity("job6", "group1").build();
        trigger = newTrigger().withIdentity("trigger6", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(40).repeatForever()).build();
        date = scheduler.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + date + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        // ====================================================================
        // ============ 启动调度器
        // ====================================================================
        scheduler.start();
        // ====================================================================
        // ============ 在调度器启动之后，新增加的job7仍将可以被调度，job7将5分钟执行一次，总共重复20次
        // ====================================================================
        job = newJob(SimpleJob.class).withIdentity("job7", "group1").build();
        trigger = newTrigger().withIdentity("trigger7", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInMinutes(5).withRepeatCount(20)).build();
        date = scheduler.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + date + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        // ====================================================================
        // ============ job8绑定到group1，只有定义好触发器，才会被执行
        // ====================================================================
        job = newJob(SimpleJob.class).withIdentity("job8", "group1").storeDurably().build();
        scheduler.addJob(job, true); // job添加到任务调度器
        scheduler.triggerJob(jobKey("job8", "group1")); // 手动触发job8，绑定到group1
        try {
            Thread.sleep(30L * 1000L); // 等待30秒，让任务都执行完毕
        } catch (Exception e) {
        }
        /**
         * 终止调度。
         * 但是如果当前仍然有任务正在运行中，则会等待该任务执行完毕再终止，期间debug信息会打印：
         * 21:48:54.965 [main] DEBUG org.quartz.simpl.SimpleThreadPool - Waiting for thread TestScheduler_Worker-1 to shut down
         */
        scheduler.shutdown(true);
        // 显示调度器的一些统计信息
        SchedulerMetaData metaData = scheduler.getMetaData();
        LOG.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
    }
    // 演示触发器被重新调度案例
    private void rescheduleJobDemo() throws SchedulerException {
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler scheduler = sf.getScheduler();
        // 第一个参数：null就是默认当前时间，也可以指定时间
        // 第二个参数：把一分钟按30进行划分，也就是60/30等份。
        // 举例：当前时间是21:01:27，那么startTime就是21:01:30。当前时间是21:01:32，那么startTime就是21:02:00。
        Date startTime = DateBuilder.nextGivenSecondDate(null, 15);
        // ====================================================================
        // ============ job600 将被无限期地执行，每隔5秒执行一次，由trigger2019触发
        // ====================================================================
        JobDetail job = newJob(SimpleJob.class).withIdentity("job600", "group1").build();
        SimpleTrigger trigger = newTrigger().withIdentity("trigger2019", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(5).repeatForever()).build();
        Date date = scheduler.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " will run at: " + date + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        // ====================================================================
        // ============ 启动调度器
        // ====================================================================
        scheduler.start();
        try {
            System.out.println("线程进入睡眠");
            Thread.sleep(10000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("线程被唤醒");
        // ====================================================================
        // ============ job600 被重新定义的trigger2019触发器重新调度，改为每1秒钟执行一次
        // ====================================================================
        SimpleTrigger trigger2 = newTrigger().withIdentity("trigger2019", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(1).repeatForever()).build();
        Date date2 = scheduler.rescheduleJob(trigger2.getKey(), trigger2);
        LOG.info("job600 rescheduled to run at: " + date2);
    }
    public static void main(String[] args) throws Exception {
        SimpleTriggerExample example = new SimpleTriggerExample();
        example.run();
        example.rescheduleJobDemo(); // 重新调度案例
    }
}
```
