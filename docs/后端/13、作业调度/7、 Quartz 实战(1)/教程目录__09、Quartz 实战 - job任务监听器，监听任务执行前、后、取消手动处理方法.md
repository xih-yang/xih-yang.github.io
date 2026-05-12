# 09、Quartz 实战 - job任务监听器，监听任务执行前、后、取消手动处理方法
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/9.html
- 分类：作业调度
- 分组：教程目录
**job1任务类**

```java
package org.quartz.examples.example9;
import java.util.Date;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * job1任务类
 */
public class SimpleJob1 implements Job {
    private static Logger LOG = LoggerFactory.getLogger(SimpleJob1.class);
    // 必须要有public修饰的无参构造函数
    public SimpleJob1() {
    }
    // 定时器执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        LOG.info("---------- 作业1执行。SimpleJob1 says: " + jobKey + " executing at " + new Date());
    }
}
```

**job2任务类**

```java
package org.quartz.examples.example9;
import java.util.Date;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * job2任务类
 */
public class SimpleJob2 implements Job {
    private static Logger LOG = LoggerFactory.getLogger(SimpleJob2.class);
    // 必须要有public修饰的无参构造函数
    public SimpleJob2() {
    }
    // 定时器执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        LOG.info("---------- 作业2执行。SimpleJob2 says: " + jobKey + " executing at " + new Date());
    }
}
```

**job1任务监听器**

```java
package org.quartz.examples.example9;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobListener;
import org.quartz.SchedulerException;
import org.quartz.Trigger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * job1任务监听器
 */
public class Job1Listener implements JobListener {
    private static Logger LOG = LoggerFactory.getLogger(Job1Listener.class);
    public String getName() {
        return "job1_to_job2";
    }
    public void jobToBeExecuted(JobExecutionContext inContext) {
        LOG.info("Job1Listener says: 作业即将执行.");
    }
    //当org.quartz被调度程序调用时。JobDetailwas即将执行(一个关联的Triggerhas发生)，但是TriggerListener否决了它的执行。
    public void jobExecutionVetoed(JobExecutionContext inContext) {
        LOG.info("Job1Listener says: 作业执行被否决.");
    }
    public void jobWasExecuted(JobExecutionContext inContext, JobExecutionException inException) {
        LOG.info("Job1Listener says: 作业已执行.");
        // Simple job2
        JobDetail job2 = newJob(SimpleJob2.class).withIdentity("job2").build();
        Trigger job2Trigger = newTrigger().withIdentity("job2Trigger").startNow().build();
        try {
            //去执行job2
            inContext.getScheduler().scheduleJob(job2, job2Trigger);
        } catch (SchedulerException e) {
            LOG.warn("Unable to schedule job2!");
            e.printStackTrace();
        }
    }
}
```

**调度器类**

```java
package org.quartz.examples.example9;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.JobListener;
import org.quartz.Matcher;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.Trigger;
import org.quartz.impl.StdSchedulerFactory;
import org.quartz.impl.matchers.KeyMatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 演示job任务添加监听器，监听任务执行前、后手动处理方法
 */
public class ListenerExample {
    Logger LOG = LoggerFactory.getLogger(ListenerExample.class);
  public void run() throws Exception {
    // 初始化一个调度工厂，并实例化一个调度类
    SchedulerFactory sf = new StdSchedulerFactory();
    Scheduler sched = sf.getScheduler();
    // 作业将被立即执行
    JobDetail job = newJob(SimpleJob1.class).withIdentity("job1").build();
    Trigger trigger = newTrigger().withIdentity("trigger1").startNow().build();
    // 设置job1任务监听器
    JobListener listener = new Job1Listener();
    Matcher<JobKey> matcher = KeyMatcher.keyEquals(job.getKey());
    sched.getListenerManager().addJobListener(listener, matcher);
    sched.scheduleJob(job, trigger);
    sched.start();
    LOG.info("------- Waiting 30 seconds... --------------");
    Thread.sleep(30L * 1000L);
    sched.shutdown(true);
    LOG.info("------- Shutdown Complete -----------------");
    SchedulerMetaData metaData = sched.getMetaData();
    LOG.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
  }
  public static void main(String[] args) throws Exception {
    ListenerExample example = new ListenerExample();
    example.run();
  }
}
```
