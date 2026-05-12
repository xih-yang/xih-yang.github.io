# 14、Quartz 实战 - trigger触发器优先级排序
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/14.html
- 分类：作业调度
- 分组：教程目录
**job任务类：**

```java
package org.quartz.examples.example14;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
/**
 * 一个简单的job任务
 */
public class TriggerEchoJob implements Job {
    private static final Logger LOG = LoggerFactory.getLogger(TriggerEchoJob.class);
    // 必须要有public修饰的无参构造函数
    public TriggerEchoJob() {
    }
    // 任务执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        LOG.info("任务执行。TRIGGER: " + context.getTrigger().getKey());
    }
}
```

**调度器类：**

```java
package org.quartz.examples.example14;
import static org.quartz.DateBuilder.futureDate;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.SimpleScheduleBuilder.simpleSchedule;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.DateBuilder.IntervalUnit;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.Trigger;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
/**
 * 这个例子将演示触发器是如何按优先级排序的。
 */
public class PriorityExample {
    Logger LOG = LoggerFactory.getLogger(PriorityExample.class);
    public void run() throws Exception {
        // 初始化调度器
//        SchedulerFactory sf = new StdSchedulerFactory("org/quartz/examples/example14/quartz_priority.properties");
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        JobDetail job = newJob(TriggerEchoJob.class).withIdentity("TriggerEchoJob").build();
        // 这三个触发器将同时触发它们的第一次，按优先级排序，优先级数字越大，优先级越高。
        // 然后重复执行一次，因为间隔时间秒数不一样，所以触发器又会显示好像不按优先级顺序触发了，其实并没有忽略优先级。
        // 由于设置了触发器优先级，所以我们应该可以看到以下触发器执行顺序:
        // 1. Priority10Trigger15SecondRepeat
        // 2. Priority5Trigger10SecondRepeat
        // 3. Priority1Trigger5SecondRepeat
        // 4. Priority1Trigger5SecondRepeat
        // 5. Priority5Trigger10SecondRepeat
        // 6. Priority10Trigger15SecondRepeat
        // Calculate the start time of all triggers as 5 seconds from now
        Date startTime = futureDate(5, IntervalUnit.SECOND);
        // 第一个触发器优先级1（withPriority），优先级数字越小触发器优先级越低
        Trigger trigger1 = newTrigger().withIdentity("Priority1Trigger5SecondRepeat").startAt(startTime)
                .withSchedule(simpleSchedule().withRepeatCount(1).withIntervalInSeconds(5)).withPriority(1).forJob(job)
                .build();
        // 第二个触发器优先级未设置，默认优先执行设置了优先级的触发器，所以这个触发器优先级最低
        Trigger trigger2 = newTrigger().withIdentity("Priority5Trigger10SecondRepeat").startAt(startTime)
                .withSchedule(simpleSchedule().withRepeatCount(1).withIntervalInSeconds(10)).forJob(job).build();
        // 触发器优先级10（withPriority），优先级数字越大触发器优先级越高，在触发器并发执行情况下，优先级越高的触发器执行越靠前
        Trigger trigger3 = newTrigger().withIdentity("Priority10Trigger15SecondRepeat").startAt(startTime)
                .withSchedule(simpleSchedule().withRepeatCount(1).withIntervalInSeconds(15)).withPriority(10)
                .forJob(job).build();
        sched.scheduleJob(job, trigger1);
        sched.scheduleJob(trigger2);
        sched.scheduleJob(trigger3);
        //启动调度器，只有启动调度器，触发器和任务才会真正执行
        sched.start();
        LOG.info("------- Started Scheduler -----------------");
        Thread.sleep(30L * 1000L);
        //关闭调度器
        sched.shutdown(true);
        LOG.info("------- Shutdown Complete -----------------");
    }
    public static void main(String[] args) throws Exception {
        PriorityExample example = new PriorityExample();
        example.run();
    }
}
```
