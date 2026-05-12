# 12、Quartz 实战 - 通过RMI协议向Scheduler调度器远程添加job任务
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/12.html
- 分类：作业调度
- 分组：教程目录
此代码示例通过RMI协议向Scheduler调度器远程添加job任务。

代码文件包括：job任务类（SimpleJob.java）、RMI服务端server类（RemoteServerExample.java）、RMI客户端client类（RemoteClientExample.java）。

注意：job任务类与client客户端在同一个应用里。

**RMI服务端server类（RemoteServerExample.java）**

先设置server端的定时配置quartz.properties

```java
#============================================================================
# Configure Main Scheduler Properties  
#============================================================================
org.quartz.scheduler.instanceName: Sched1
org.quartz.scheduler.rmi.export: true         //重点
org.quartz.scheduler.rmi.registryHost: localhost     //重点
org.quartz.scheduler.rmi.registryPort: 1099          //重点
org.quartz.scheduler.rmi.createRegistry: true
#============================================================================
# Configure ThreadPool  
#============================================================================
org.quartz.threadPool.class: org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.threadCount: 10
org.quartz.threadPool.threadPriority: 5
#============================================================================
# Configure JobStore  
#============================================================================
org.quartz.jobStore.misfireThreshold: 60000
org.quartz.jobStore.class: org.quartz.simpl.RAMJobStore
```

RemoteServerExample.java 类代码：

```java
package org.quartz.examples.example12;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 这个示例将生成大量要运行的作业
 */
public class RemoteServerExample {
    Logger LOG = LoggerFactory.getLogger(RemoteServerExample.class);
    public void run() throws Exception {
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        sched.start();
        try {
            Thread.sleep(300L * 1000L);
        } catch (Exception e) {
            //
        }
        sched.shutdown(true);
        LOG.info("------- Shutdown Complete -----------------");
        SchedulerMetaData metaData = sched.getMetaData();
        LOG.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
    }
    public static void main(String[] args) throws Exception {
        RemoteServerExample example = new RemoteServerExample();
        example.run();
    }
}
```

**job任务类（SimpleJob.java）**

```java
package org.quartz.examples.example12;
import java.util.Date;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
/**
 * 一个愚蠢的作业实现，用于单元测试。
 */
public class SimpleJob implements Job {
    public static final String MESSAGE = "msg";
    private static Logger LOG = LoggerFactory.getLogger(SimpleJob.class);
    // 必须要有public修饰的无参构造函数
    public SimpleJob() {
    }
    // 任务执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        String message = (String) context.getJobDetail().getJobDataMap().get(MESSAGE);
        LOG.info("任务执行1。SimpleJob: " + jobKey + " executing at " + new Date());
        LOG.info("任务执行2。SimpleJob: msg: " + message);
    }
}
```

**RMI客户端client类（RemoteClientExample.java）**

设置client端的定时配置quartz.properties

```java
org.quartz.scheduler.instanceName: Sched1
org.quartz.scheduler.logger: schedLogger
org.quartz.scheduler.rmi.proxy: true        //重点
org.quartz.scheduler.rmi.registryHost: localhost       //重点
org.quartz.scheduler.rmi.registryPort: 1099            //重点
```

RemoteClientExample.java类代码：

```java
package org.quartz.examples.example12;
import static org.quartz.CronScheduleBuilder.cronSchedule;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.Trigger;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 这个示例是一个客户机程序，它将与调度程序进行远程通信以调度作业。
 * 在本例中，我们将需要使用JDBC作业存储。客户机将远程连接到JDBC作业存储以调度作业。
 */
public class RemoteClientExample {
    static Logger LOG = LoggerFactory.getLogger(RemoteClientExample.class);
    public void run() throws Exception {
     // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        // 定义一个job任务，远程添加到调度器的任务  
        // group: default, job: remotelyAddedJob
        JobDetail job = newJob(SimpleJob.class)
            .withIdentity("remotelyAddedJob", "default")
            .build();
        JobDataMap map = job.getJobDataMap();
        map.put("msg", "Your remotely added job has executed!");
        Trigger trigger = newTrigger()
            .withIdentity("remotelyAddedTrigger", "default")
            .forJob(job.getKey())
            .withSchedule(cronSchedule("0/2 * * * * ?"))
            .build();
        sched.scheduleJob(job, trigger);
        LOG.info("Remote job scheduled.");
    }
    public static void main(String[] args) throws Exception {
        RemoteClientExample example = new RemoteClientExample();
        example.run();
    }
}
```
