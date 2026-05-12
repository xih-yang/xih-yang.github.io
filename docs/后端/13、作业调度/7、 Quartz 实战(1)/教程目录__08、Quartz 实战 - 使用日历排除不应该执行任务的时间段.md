# 08、Quartz 实战 - 使用日历排除不应该执行任务的时间段
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/8.html
- 分类：作业调度
- 分组：教程目录
**Job任务类**

```java
package org.quartz.examples.example8;
import java.util.Date;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
/**
 * 这只是一个简单的工作，它会被例1多次触发
 */
public class SimpleJob implements Job {
    private static Logger LOG = LoggerFactory.getLogger(SimpleJob.class);
    //必须要有public修饰的无参构造函数
    public SimpleJob() {
    }
  //定时器执行方法
    public void execute(JobExecutionContext context)
        throws JobExecutionException {
        // 这个作业只是打印出它的作业名称以及它运行的日期和时间
        JobKey jobKey = context.getJobDetail().getKey();
        LOG.info("SimpleJob says: " + jobKey + " executing at " + new Date());
    }
}
```

**调度器类**

```java
package org.quartz.examples.example8;
import static org.quartz.DateBuilder.dateOf;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.SimpleScheduleBuilder.simpleSchedule;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.SimpleTrigger;
import org.quartz.examples.example2.SimpleJob;
import org.quartz.impl.StdSchedulerFactory;
import org.quartz.impl.calendar.AnnualCalendar;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
/**
 * 这个示例将演示如何使用日历排除不应该进行调度的时间段，比如假期。
 */
public class CalendarExample {
    final Logger LOG = LoggerFactory.getLogger(CalendarExample.class);
    public void run() throws Exception {
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        // 将假期日历添加到日程中
        AnnualCalendar holidays = new AnnualCalendar();
        // 2005年6月4日
        Calendar fourthOfJuly = new GregorianCalendar(2005, 6, 4);
        holidays.setDayExcluded(fourthOfJuly, true);
        // 2005年9月31日
        Calendar halloween = new GregorianCalendar(2005, 9, 31);
        holidays.setDayExcluded(halloween, true);
        // 2005年11月25日
        Calendar christmas = new GregorianCalendar(2005, 11, 25);
        holidays.setDayExcluded(christmas, true);
        // 告诉调度器我们的假期安排
        sched.addCalendar("holidays", holidays, false, false);
        // 安排一项工作每小时运行一次：10月31日10点0分0秒 ，秒、分、小时、日、月
        Date runDate = dateOf(0, 0, 10, 31, 10);
        JobDetail job = newJob(SimpleJob.class).withIdentity("job1", "group1").build();
        // 间隔1小时运行一次，无限循环
        SimpleTrigger trigger = newTrigger().withIdentity("trigger1", "group1").startAt(runDate)
                .withSchedule(simpleSchedule().withIntervalInHours(1).repeatForever()).modifiedByCalendar("holidays")
                .build();
        Date firstRunTime = sched.scheduleJob(job, trigger);
        // 由于10月31日是万圣节，所以我们将在之后一天11月1日运行任务
        LOG.info(job.getKey() + " will run at: " + firstRunTime + " and repeat: " + trigger.getRepeatCount()
                + " times, every " + trigger.getRepeatInterval() / 1000 + " seconds");
        sched.start();
        // 睡眠30秒
        Thread.sleep(30L * 1000L);
        sched.shutdown(true);
        LOG.info("------- Shutdown Complete -----------------");
        SchedulerMetaData metaData = sched.getMetaData();
        LOG.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
    }
    public static void main(String[] args) throws Exception {
        CalendarExample example = new CalendarExample();
        example.run();
    }
}
```
