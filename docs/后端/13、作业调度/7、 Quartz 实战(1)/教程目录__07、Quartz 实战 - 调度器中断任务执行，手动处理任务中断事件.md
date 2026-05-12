# 07、Quartz 实战 - 调度器中断任务执行，手动处理任务中断事件
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/7.html
- 分类：作业调度
- 分组：教程目录
**job任务类**

```java
package org.quartz.examples.example7;
import java.util.Date;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.quartz.InterruptableJob;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.UnableToInterruptJobException;
/**
 * 一个可中断作业的愚蠢实现，用于单元测试。
 */
public class DumbInterruptableJob implements InterruptableJob {
    private static Logger LOG = LoggerFactory.getLogger(DumbInterruptableJob.class);
    // 任务是否被打断标记
    private boolean _interrupted = false;
    // job name
    private JobKey _jobKey = null;
    // 必须要有public修饰的无参构造函数
    public DumbInterruptableJob() {
    }
    // 定时器执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        _jobKey = context.getJobDetail().getKey();
        LOG.info("---- " + _jobKey + " executing at " + new Date() + ", _interrupted = " + _interrupted);
        try {
            // main job loop... see the JavaDOC for InterruptableJob for discussion...
            // do some work... in this example we are 'simulating' work by sleeping... :)
            for (int i = 0; i < 4; i++) {
                try {
                    Thread.sleep(1000L);
                } catch (Exception ignore) {
                    ignore.printStackTrace();
                }
                LOG.info("---- job任务for循环["+i+"], _interrupted = " + _interrupted);
                // 定期检查我们是否被中断了，在这里可以手动处理我们的业务逻辑
                if (_interrupted) {
                    LOG.info("--- " + _jobKey + "  -- 打断……救助!!!");
                    return; // 如果抛出JobExecutionException是基于特定工作的职责/行为的，那么还可以选择抛出它吗
                }
            }
        } finally {
            LOG.info("---- " + _jobKey + " completed at " + new Date());
        }
    }
    //重写任务的被中断方法，手动处理中断事件
    @Override
    public void interrupt() throws UnableToInterruptJobException {
        LOG.info("---" + _jobKey + "  -- INTERRUPTING --");
        _interrupted = true;
    }
}
```

**调度器类**

```java
package org.quartz.examples.example7;
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
 * 演示调度器中断job任务
 */
public class InterruptExample {
    public void run() throws Exception {
        final Logger log = LoggerFactory.getLogger(InterruptExample.class);
        log.info("------- Initializing ----------------------");
        // First we must get a reference to a scheduler
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        // 第一个参数：null就是默认当前时间，也可以指定时间
        // 第二个参数：把一分钟按30进行划分，也就是60/30等份。
        // 举例：当前时间是21:01:27，那么startTime就是21:01:30。当前时间是21:01:32，那么startTime就是21:02:00。
        Date startTime = nextGivenSecondDate(null, 15);
        JobDetail job = newJob(DumbInterruptableJob.class).withIdentity("interruptableJob1", "group1").build();
        // 间隔5秒，无限循环
        SimpleTrigger trigger = newTrigger().withIdentity("trigger1", "group1").startAt(startTime)
                .withSchedule(simpleSchedule().withIntervalInSeconds(5).repeatForever()).build();
        Date ft = sched.scheduleJob(job, trigger);
        log.info(job.getKey() + " will run at: " + ft + " and repeat: " + trigger.getRepeatCount() + " times, every "
                + trigger.getRepeatInterval() / 1000 + " seconds");
        sched.start();
        log.info("------- 每7秒就中断一次job任务，循环50次 ----------");
        for (int i = 0; i < 50; i++) {
            Thread.sleep(7000L);
            log.info("------- 每7秒就中断一次job任务，循环：" + i);
            sched.interrupt(job.getKey()); //调度器可以直接中断某个任务
        }
        log.info("------- Shutting Down ---------------------");
        sched.shutdown(true);
        log.info("------- Shutdown Complete -----------------");
        SchedulerMetaData metaData = sched.getMetaData();
        log.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
    }
    public static void main(String[] args) throws Exception {
        InterruptExample example = new InterruptExample();
        example.run();
    }
}
```
