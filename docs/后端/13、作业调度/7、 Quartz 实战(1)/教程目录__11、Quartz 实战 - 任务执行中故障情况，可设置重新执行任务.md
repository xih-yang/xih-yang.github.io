# 11、Quartz 实战 - 任务执行中故障情况，可设置重新执行任务
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/11.html
- 分类：作业调度
- 分组：教程目录
**任务类**

```java
package org.quartz.examples.example11;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
/**
 * job任务类
 */
public class SimpleJob implements Job {
    private static Logger LOG = LoggerFactory.getLogger(SimpleJob.class);
    // job parameter
    public static final String DELAY_TIME = "delay time";
    //必须要有public修饰的无参构造函数
    public SimpleJob() {
    }
    // 任务执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        LOG.info("执行任务开始：" + jobKey + " executing at " + new Date());
        // 等待一段时间delayTime毫秒
        long delayTime = context.getJobDetail().getJobDataMap().getLong(DELAY_TIME);
        try {
            Thread.sleep(delayTime);
        } catch (Exception e) {
            //
        }
        LOG.info("执行任务结束：" + jobKey + " at " + new Date());
    }
}
```

**调度器类**

```java
package org.quartz.examples.example11;
import static org.quartz.DateBuilder.futureDate;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.DateBuilder.IntervalUnit;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.Trigger;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 这个示例将生成大量要运行的作业
 */
public class LoadExample {
    // 初始化job任务个数
    private int _numberOfJobs = 500;
    public LoadExample(int inNumberOfJobs) {
        _numberOfJobs = inNumberOfJobs;
    }
    public void run() throws Exception {
        Logger LOG = LoggerFactory.getLogger(LoadExample.class);
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        // 计划运行500个作业
        for (int count = 1; count <= _numberOfJobs; count++) {
            // requestRecovery：请调度程序重新执行此作业，如果该作业在调度程序宕机时正在进行中…
            //requestRecovery：指示调度程序，如果遇到“恢复”或“故障转移”情况，是否应重新执行作业。如果没有显式设置，则默认值为false
            JobDetail job = newJob(SimpleJob.class).withIdentity("job" + count, "group_1").requestRecovery().build();
            // 让工作人员推迟一点时间……模拟工作……
            long timeDelay = (long) (java.lang.Math.random() * 2500);
            job.getJobDataMap().put(SimpleJob.DELAY_TIME, timeDelay); //随机数
            //每个触发器的启动时间都间隔100毫秒，相距时间非常短
            Trigger trigger = newTrigger().withIdentity("trigger_" + count, "group_1")
                    .startAt(futureDate((10000 + (count * 100)), IntervalUnit.MILLISECOND))
                    .build();
            sched.scheduleJob(job, trigger);
            if (count % 25 == 0) {
                LOG.info("...scheduled " + count + " jobs");
            }
        }
        sched.start();
        LOG.info("------- Waiting one minutes... -----------");
        // 等一分钟，展示job任务的定时打印
        try {
            Thread.sleep(60L * 1000L);
        } catch (Exception e) {
            //
        }
        sched.shutdown(true);
        LOG.info("------- Shutdown Complete -----------------");
        SchedulerMetaData metaData = sched.getMetaData();
        LOG.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
    }
    public static void main(String[] args) throws Exception {
        int numberOfJobs = 500;
        if (args.length == 1) {
            numberOfJobs = Integer.parseInt(args[0]);
        }
        if (args.length > 1) {
            System.out.println("Usage: java " + LoadExample.class.getName() + "[# of jobs]");
            return;
        }
        LoadExample example = new LoadExample(numberOfJobs);
        example.run();
    }
}
```
