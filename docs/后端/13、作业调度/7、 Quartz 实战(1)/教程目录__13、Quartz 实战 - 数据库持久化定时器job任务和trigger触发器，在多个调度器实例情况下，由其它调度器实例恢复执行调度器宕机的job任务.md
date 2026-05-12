# 13、Quartz 实战 - 数据库持久化定时器job任务和trigger触发器，在多个调度器实例情况下，由其它调度器实例恢复执行调度器宕机的job任务
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/13.html
- 分类：作业调度
- 分组：教程目录
**一、初始化数据库11张quartz表：qrtz_***

先从官网下载好quartz2.3.0包：[http://www.quartz-scheduler.org/downloads/](http://www.quartz-scheduler.org/downloads/)

解压后进入目录：quartz-2.3.0-SNAPSHOT\src\org\quartz\impl\jdbcjobstore

得到22种数据库的11张qrtz_*表的初始化SQL，这里列举几个经典的数据库文件：tables_oracle.sql、tables_mysql_innodb.sql、tables_sqlServer.sql、tables_postgres.sql

**二、配置定时器quartz.properties**

```java
#============================================================================
# Configure Main Scheduler Properties  
#============================================================================
org.quartz.scheduler.instanceName=TestScheduler
#instance_1 更改后缀数字后，程序可以执行不同ID的调度器，启动多个调度器，有利于观察其中一个实例宕机后，另外实例恢复这个实例的job任务情况
org.quartz.scheduler.instanceId=instance_1
#============================================================================
# Configure ThreadPool  
#============================================================================
org.quartz.threadPool.class=org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.threadCount=5
org.quartz.threadPool.threadPriority=5
#============================================================================
# 配置Oracle数据库，命名dataSource为myDS
#============================================================================
# 支持PostgreSQL数据库
#org.quartz.dataSource.myDS.driver=org.postgresql.Driver
#org.quartz.dataSource.myDS.URL=jdbc:postgresql://localhost:5432/quartz
org.quartz.dataSource.myDS.driver=oracle.jdbc.driver.OracleDriver
org.quartz.dataSource.myDS.URL=jdbc:oracle:thin:@localhost:1521:orcl
org.quartz.dataSource.myDS.user=zhuwen
org.quartz.dataSource.myDS.password=ZHUwen12
org.quartz.dataSource.myDS.maxConnections=5
org.quartz.dataSource.myDS.validationQuery=select 0 FROM DUAL
#============================================================================
# 配置job任务存储策略，指定一个叫myDS的dataSource
#============================================================================
org.quartz.jobStore.misfireThreshold: 60000
org.quartz.jobStore.class=org.quartz.impl.jdbcjobstore.JobStoreTX
# 支持PostgreSQL数据库
#org.quartz.jobStore.driverDelegateClass=org.quartz.impl.jdbcjobstore.PostgreSQLDelegate
# 支持Oracle数据库
org.quartz.jobStore.driverDelegateClass=org.quartz.impl.jdbcjobstore.oracle.OracleDelegate
org.quartz.jobStore.useProperties=false
org.quartz.jobStore.dataSource=myDS
org.quartz.jobStore.tablePrefix=QRTZ_
org.quartz.jobStore.isClustered=true
```

**三、job任务类**

第一个job类：SimpleRecoveryJob

```java
package org.quartz.examples.example13;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
/**
 * 一个愚蠢的作业实现，用于单元测试。
 */
public class SimpleRecoveryJob implements Job {
    private static Logger LOG = LoggerFactory.getLogger(SimpleRecoveryJob.class);
    private static final String COUNT = "count";
    //必须要有public修饰的无参构造函数
    public SimpleRecoveryJob() {
    }
    //任务执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        // 如果作业正在恢复。如果由于“恢复”情况而重新执行作业，此方法将返回true。
        if (context.isRecovering()) {
//            LOG.info("恢复作业：SimpleRecoveryJob: " + jobKey + " RECOVERING at " + new Date());
            System.err.println("恢复作业：SimpleRecoveryJob: " + jobKey + " RECOVERING at " + new Date());
        } else {
//            LOG.info("不恢复作业：SimpleRecoveryJob: " + jobKey + " starting at " + new Date());
            System.err.println("不恢复作业：SimpleRecoveryJob: " + jobKey + " starting at " + new Date());
        }
        // 睡眠10秒
        long delay = 10L * 1000L;
        try {
            Thread.sleep(delay);
        } catch (Exception e) {
            //
        }
        JobDataMap data = context.getJobDetail().getJobDataMap();
        int count;
        if (data.containsKey(COUNT)) {
            count = data.getInt(COUNT);
        } else {
            count = 0;
        }
        count++;
        data.put(COUNT, count);
        LOG.info("SimpleRecoveryJob: " + jobKey + " done at " + new Date() + "\n Execution" + count);
    }
}
```

下面是第二个job类，注意这个job类不允许多线程并发执行：

```java
package org.quartz.examples.example13;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.PersistJobDataAfterExecution;
/**
 * 这个作业具有与SimpleRecoveryJob相同的功能，只是这个作业实现是“有状态的”，
 * 因为它将在每次执行之后自动重新持久化它的数据(JobDataMap)，并且一次只能执行JobDetail的一个实例。
 * 
 */
@PersistJobDataAfterExecution //持久化JobDataMap里的数据，使下一个定时任务还能获取到这些值
@DisallowConcurrentExecution //禁止并发多任务执行，所以永远只有一个任务在执行中
public class SimpleRecoveryStatefulJob extends SimpleRecoveryJob {
  public SimpleRecoveryStatefulJob() {
    super();
  }
}
```

**四、任务调度类**

```java
package org.quartz.examples.example13;
import static org.quartz.DateBuilder.futureDate;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.SimpleScheduleBuilder.simpleSchedule;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.DateBuilder.IntervalUnit;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SimpleTrigger;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 用于测试/显示JDBCJobStore (JobStoreTX或JobStoreCMT)的集群特性。
 * <p>
 * 所有实例必须使用不同的属性文件，因为它们的实例id必须不同，但是所有其他属性应该相同。
 * </p>
 * <p>
 * 如果您希望它清除现有的作业&触发器，设置clearJobs=true
 * </p>
 * <p>
 * 您可能需要先清空残留的表数据，因为将来自非集群设置的数据与集群设置的数据混合在一起可能是不好的。
 * </p>
 * <p>
 *    你可以在运行多个Scheduler实例的时候，杀死其中一个实例，并确保其余实例恢复正在进行的作业。注意，使用默认设置检测故障可能需要15秒左右的时间。
 * </p>
 * <p>
 * 还可以尝试使用/不使用调度程序注册的shutdown-hook插件运行它。(org.quartz.plugins.management.ShutdownHookPlugin)。
 * </p>
 * <p>
 * 注意:从不要在单独的机器上运行集群，除非它们的时钟使用某种形式的时间同步服务(例如NTP守护进程)进行同步。
 * </p>
 */
public class ClusterExample {
    private static Logger LOG = LoggerFactory.getLogger(ClusterExample.class);
    public void run(boolean inClearJobs, boolean inScheduleJobs) throws Exception {
        // 初始化调度器
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        if (inClearJobs) {
            LOG.warn("***** 删除已存在的job任务和triggers触发器。Deleting existing jobs/triggers *****");
            sched.clear();
        }
        if (inScheduleJobs) {
            LOG.info("------- Scheduling Jobs ------------------");
            String schedId = sched.getSchedulerInstanceId();
            // ========================================================
            // ============ job1
            // ========================================================
            int count = 1;
            JobDetail job = newJob(SimpleRecoveryJob.class).withIdentity("job_" + count, schedId).requestRecovery() // 如果job执行过程中宕机，则job重新执行
                    .build();
            SimpleTrigger trigger = newTrigger().withIdentity("triger_" + count, schedId)
                    .startAt(futureDate(1, IntervalUnit.SECOND))
                    .withSchedule(simpleSchedule().withRepeatCount(20).withIntervalInSeconds(5)).build();
            LOG.info(job.getKey() + " will run at: " + trigger.getNextFireTime() + " and repeat: "
                    + trigger.getRepeatCount() + " times, every " + trigger.getRepeatInterval() / 1000 + " seconds");
            sched.scheduleJob(job, trigger);
            // ========================================================
            // ============ job2
            // ========================================================
            count++;
            job = newJob(SimpleRecoveryJob.class).withIdentity("job_" + count, schedId).requestRecovery() // 如果job执行过程中宕机，则job重新执行
                    .build();
            trigger = newTrigger().withIdentity("triger_" + count, schedId).startAt(futureDate(2, IntervalUnit.SECOND))
                    .withSchedule(simpleSchedule().withRepeatCount(20).withIntervalInSeconds(5)).build();
            LOG.info(job.getKey() + " will run at: " + trigger.getNextFireTime() + " and repeat: "
                    + trigger.getRepeatCount() + " times, every " + trigger.getRepeatInterval() / 1000 + " seconds");
            sched.scheduleJob(job, trigger);
            // ========================================================
            // ============ job3，这里使用的是job子类SimpleRecoveryStatefulJob
            // ========================================================
            count++;
            job = newJob(SimpleRecoveryStatefulJob.class).withIdentity("job_" + count, schedId).requestRecovery() // 如果job执行过程中宕机，则job重新执行
                    .build();
            trigger = newTrigger().withIdentity("triger_" + count, schedId).startAt(futureDate(1, IntervalUnit.SECOND))
                    .withSchedule(simpleSchedule().withRepeatCount(20).withIntervalInSeconds(3)).build();
            LOG.info(job.getKey() + " will run at: " + trigger.getNextFireTime() + " and repeat: "
                    + trigger.getRepeatCount() + " times, every " + trigger.getRepeatInterval() / 1000 + " seconds");
            sched.scheduleJob(job, trigger);
            // ========================================================
            // ============ job4
            // ========================================================
            count++;
            job = newJob(SimpleRecoveryJob.class).withIdentity("job_" + count, schedId).requestRecovery() // 如果job执行过程中宕机，则job重新执行
                    .build();
            trigger = newTrigger().withIdentity("triger_" + count, schedId).startAt(futureDate(1, IntervalUnit.SECOND))
                    .withSchedule(simpleSchedule().withRepeatCount(20).withIntervalInSeconds(4)).build();
            LOG.info(job.getKey() + " will run at: " + trigger.getNextFireTime() + " & repeat: "
                    + trigger.getRepeatCount() + "/" + trigger.getRepeatInterval());
            sched.scheduleJob(job, trigger);
            // ========================================================
            // ============ job5
            // ========================================================
            count++;
            job = newJob(SimpleRecoveryJob.class).withIdentity("job_" + count, schedId).requestRecovery() // 如果job执行过程中宕机，则job重新执行
                    .build();
            trigger = newTrigger().withIdentity("triger_" + count, schedId).startAt(futureDate(1, IntervalUnit.SECOND))
                    .withSchedule(simpleSchedule().withRepeatCount(20).withIntervalInMilliseconds(4500L)).build();
            LOG.info(job.getKey() + " will run at: " + trigger.getNextFireTime() + " & repeat: "
                    + trigger.getRepeatCount() + "/" + trigger.getRepeatInterval());
            sched.scheduleJob(job, trigger);
        }
        sched.start();
        LOG.info("------- Waiting for one hour... ----------");
        try {
            Thread.sleep(3600L * 1000L);
        } catch (Exception e) {
            //
        }
        sched.shutdown();
        LOG.info("------- Shutdown Complete ----------------");
    }
    public static void main(String[] args) throws Exception {
        boolean clearJobs = false;
        boolean scheduleJobs = true;
        for (String arg : args) {
            if (arg.equalsIgnoreCase("clearJobs")) {
                clearJobs = true;
            } else if (arg.equalsIgnoreCase("dontScheduleJobs")) {
                scheduleJobs = false;
            }
        }
        clearJobs = true;
        scheduleJobs = true;
        ClusterExample example = new ClusterExample();
        example.run(clearJobs, scheduleJobs);
    }
}
```
