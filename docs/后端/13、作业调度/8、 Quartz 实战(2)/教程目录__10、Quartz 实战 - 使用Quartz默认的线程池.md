# 10、Quartz 实战 - 使用Quartz默认的线程池
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/10.html
- 分类：作业调度
- 分组：教程目录
在我们配置quartz.properties文件是Quartz会默认的读取jar包下面的quartz.properties文件

```java
# Default Properties file for use by StdSchedulerFactory
# to create a Quartz Scheduler Instance, if a different
# properties file is not explicitly specified.
#
org.quartz.scheduler.instanceName: DefaultQuartzScheduler
org.quartz.scheduler.rmi.export: false
org.quartz.scheduler.rmi.proxy: false
org.quartz.scheduler.wrapJobExecutionInUserTransaction: false
org.quartz.threadPool.class: org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.threadCount: 10
org.quartz.threadPool.threadPriority: 5
org.quartz.threadPool.threadsInheritContextClassLoaderOfInitializingThread: true
org.quartz.jobStore.misfireThreshold: 60000
org.quartz.jobStore.class: org.quartz.simpl.RAMJobStore
```

Quartz默认的起了一个拥有10个线程的线程池

看下面这个例子

LoadJob.java

```java
package cn.zto.job;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class LoadJob
  implements Job
{
  public static final String DELAY_TIME = "delay time";
  public void execute(JobExecutionContext context) throws JobExecutionException {
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    JobKey jobKey = context.getJobDetail().getKey();
    System.out.println(dateFormat.format(new Date()) + " : " + jobKey + " 执行 ");
    long delayTime = context.getJobDetail().getJobDataMap().getLong("delay time");
    try {
      Thread.sleep(delayTime);
    }
    catch (Exception e)
    {
    }
    System.out.println(dateFormat.format(new Date()) + " : " + jobKey + "完成");
  }
}
```

LoadExample.java

```java
package cn.zto.app;
import java.io.PrintStream;
import java.text.SimpleDateFormat;
import org.quartz.DateBuilder;
import org.quartz.DateBuilder.IntervalUnit;
import org.quartz.JobBuilder;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import cn.zto.job.LoadJob;
public class LoadExample
{
  private int _numberOfJobs = 100;
  public LoadExample(int inNumberOfJobs) {
    this._numberOfJobs = inNumberOfJobs;
  }
  public void run() throws Exception {
    SchedulerFactory sf = new StdSchedulerFactory();
    Scheduler sched = sf.getScheduler();
    System.out.println("------- 初始化完成 -----------");
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    for (int count = 1; count <= this._numberOfJobs; ++count) {
      JobDetail job = JobBuilder.newJob(LoadJob.class).withIdentity("job" + count, "group_1").requestRecovery().build();
      long timeDelay = (long)(Math.random() * 2500.0D);
      job.getJobDataMap().put("delay time", timeDelay);
      Trigger trigger = TriggerBuilder.newTrigger()
    		  .withIdentity("trigger_" + count, "group_1")
    		  .startAt(DateBuilder.futureDate(10000 + count * 100, DateBuilder.IntervalUnit.MILLISECOND))
    		  .build();
      sched.scheduleJob(job, trigger);
      if (count % 25 == 0) {
        System.out.println("...scheduled " + count + " jobs");
      }
    }
    System.out.println("------- 开始Scheduler ----------------");
    sched.start();
    System.out.println("------- Scheduler调用job结束 -----------------");
    System.out.println("------- 等待1分钟... -----------");
    try {
      Thread.sleep(60000L);
    }
    catch (Exception e) {
    }
    System.out.println("------- 关闭Scheduler ---------------------");
    sched.shutdown(true);
    System.out.println("------- 关闭完成 -----------------");
    SchedulerMetaData metaData = sched.getMetaData();
    System.out.println("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
  }
  public static void main(String[] args) throws Exception {
    int numberOfJobs = 100;
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

运行结果如下：

```java
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
------- 初始化完成 -----------
...scheduled 25 jobs
...scheduled 50 jobs
...scheduled 75 jobs
...scheduled 100 jobs
------- 开始Scheduler ----------------
------- Scheduler调用job结束 -----------------
------- 等待1分钟... -----------
2014年08月01日 10时20分46秒 : group_1.job1 执行 
2014年08月01日 10时20分46秒 : group_1.job2 执行 
2014年08月01日 10时20分46秒 : group_1.job3 执行 
2014年08月01日 10时20分46秒 : group_1.job4 执行 
2014年08月01日 10时20分46秒 : group_1.job1完成
2014年08月01日 10时20分46秒 : group_1.job5 执行 
2014年08月01日 10时20分47秒 : group_1.job6 执行 
2014年08月01日 10时20分47秒 : group_1.job7 执行 
2014年08月01日 10时20分47秒 : group_1.job8 执行 
2014年08月01日 10时20分47秒 : group_1.job9 执行 
2014年08月01日 10时20分47秒 : group_1.job4完成
2014年08月01日 10时20分47秒 : group_1.job10 执行 
2014年08月01日 10时20分47秒 : group_1.job11 执行 
2014年08月01日 10时20分47秒 : group_1.job3完成
2014年08月01日 10时20分47秒 : group_1.job12 执行 
2014年08月01日 10时20分47秒 : group_1.job13 执行 
2014年08月01日 10时20分47秒 : group_1.job10完成
2014年08月01日 10时20分47秒 : group_1.job14 执行 
2014年08月01日 10时20分48秒 : group_1.job13完成
2014年08月01日 10时20分48秒 : group_1.job15 执行 
2014年08月01日 10时20分48秒 : group_1.job5完成
2014年08月01日 10时20分48秒 : group_1.job16 执行 
2014年08月01日 10时20分48秒 : group_1.job7完成
2014年08月01日 10时20分48秒 : group_1.job17 执行 
2014年08月01日 10时20分48秒 : group_1.job2完成
2014年08月01日 10时20分48秒 : group_1.job18 执行 
2014年08月01日 10时20分48秒 : group_1.job12完成
2014年08月01日 10时20分48秒 : group_1.job19 执行 
2014年08月01日 10时20分48秒 : group_1.job6完成
2014年08月01日 10时20分48秒 : group_1.job20 执行 
2014年08月01日 10时20分48秒 : group_1.job16完成
2014年08月01日 10时20分48秒 : group_1.job21 执行 
2014年08月01日 10时20分49秒 : group_1.job17完成
2014年08月01日 10时20分49秒 : group_1.job22 执行 
2014年08月01日 10时20分49秒 : group_1.job8完成
2014年08月01日 10时20分49秒 : group_1.job23 执行 
2014年08月01日 10时20分49秒 : group_1.job15完成
2014年08月01日 10时20分49秒 : group_1.job24 执行 
2014年08月01日 10时20分49秒 : group_1.job14完成
2014年08月01日 10时20分49秒 : group_1.job25 执行 
2014年08月01日 10时20分49秒 : group_1.job9完成
2014年08月01日 10时20分49秒 : group_1.job26 执行 
2014年08月01日 10时20分49秒 : group_1.job11完成
2014年08月01日 10时20分49秒 : group_1.job27 执行 
2014年08月01日 10时20分50秒 : group_1.job19完成
2014年08月01日 10时20分50秒 : group_1.job28 执行 
2014年08月01日 10时20分50秒 : group_1.job18完成
2014年08月01日 10时20分50秒 : group_1.job29 执行 
2014年08月01日 10时20分50秒 : group_1.job25完成
2014年08月01日 10时20分50秒 : group_1.job30 执行 
2014年08月01日 10时20分51秒 : group_1.job28完成
2014年08月01日 10时20分51秒 : group_1.job31 执行 
2014年08月01日 10时20分51秒 : group_1.job20完成
2014年08月01日 10时20分51秒 : group_1.job32 执行 
2014年08月01日 10时20分51秒 : group_1.job21完成
2014年08月01日 10时20分51秒 : group_1.job33 执行 
2014年08月01日 10时20分51秒 : group_1.job24完成
2014年08月01日 10时20分51秒 : group_1.job34 执行 
2014年08月01日 10时20分51秒 : group_1.job34完成
2014年08月01日 10时20分51秒 : group_1.job35 执行 
2014年08月01日 10时20分51秒 : group_1.job22完成
2014年08月01日 10时20分51秒 : group_1.job36 执行 
2014年08月01日 10时20分51秒 : group_1.job23完成
2014年08月01日 10时20分51秒 : group_1.job37 执行 
2014年08月01日 10时20分51秒 : group_1.job26完成
2014年08月01日 10时20分51秒 : group_1.job38 执行 
2014年08月01日 10时20分51秒 : group_1.job36完成
2014年08月01日 10时20分51秒 : group_1.job39 执行 
2014年08月01日 10时20分51秒 : group_1.job27完成
2014年08月01日 10时20分51秒 : group_1.job40 执行 
2014年08月01日 10时20分51秒 : group_1.job38完成
2014年08月01日 10时20分51秒 : group_1.job41 执行 
2014年08月01日 10时20分52秒 : group_1.job32完成
2014年08月01日 10时20分52秒 : group_1.job42 执行 
2014年08月01日 10时20分52秒 : group_1.job42完成
2014年08月01日 10时20分52秒 : group_1.job43 执行 
2014年08月01日 10时20分52秒 : group_1.job31完成
2014年08月01日 10时20分52秒 : group_1.job44 执行 
2014年08月01日 10时20分52秒 : group_1.job39完成
2014年08月01日 10时20分52秒 : group_1.job45 执行 
2014年08月01日 10时20分52秒 : group_1.job30完成
2014年08月01日 10时20分52秒 : group_1.job46 执行 
2014年08月01日 10时20分52秒 : group_1.job33完成
2014年08月01日 10时20分52秒 : group_1.job29完成
2014年08月01日 10时20分52秒 : group_1.job47 执行 
2014年08月01日 10时20分52秒 : group_1.job48 执行 
2014年08月01日 10时20分53秒 : group_1.job37完成
2014年08月01日 10时20分53秒 : group_1.job49 执行 
2014年08月01日 10时20分53秒 : group_1.job35完成
2014年08月01日 10时20分53秒 : group_1.job50 执行 
2014年08月01日 10时20分53秒 : group_1.job40完成
2014年08月01日 10时20分53秒 : group_1.job51 执行 
2014年08月01日 10时20分53秒 : group_1.job49完成
2014年08月01日 10时20分53秒 : group_1.job52 执行 
2014年08月01日 10时20分53秒 : group_1.job46完成
2014年08月01日 10时20分53秒 : group_1.job53 执行 
2014年08月01日 10时20分53秒 : group_1.job41完成
2014年08月01日 10时20分53秒 : group_1.job54 执行 
2014年08月01日 10时20分54秒 : group_1.job44完成
2014年08月01日 10时20分54秒 : group_1.job55 执行 
2014年08月01日 10时20分54秒 : group_1.job47完成
2014年08月01日 10时20分54秒 : group_1.job56 执行 
2014年08月01日 10时20分54秒 : group_1.job48完成
2014年08月01日 10时20分54秒 : group_1.job57 执行 
2014年08月01日 10时20分54秒 : group_1.job43完成
2014年08月01日 10时20分54秒 : group_1.job58 执行 
2014年08月01日 10时20分54秒 : group_1.job45完成
2014年08月01日 10时20分54秒 : group_1.job59 执行 
2014年08月01日 10时20分54秒 : group_1.job55完成
2014年08月01日 10时20分54秒 : group_1.job60 执行 
2014年08月01日 10时20分54秒 : group_1.job50完成
2014年08月01日 10时20分54秒 : group_1.job61 执行 
2014年08月01日 10时20分55秒 : group_1.job52完成
2014年08月01日 10时20分55秒 : group_1.job62 执行 
2014年08月01日 10时20分55秒 : group_1.job54完成
2014年08月01日 10时20分55秒 : group_1.job63 执行 
2014年08月01日 10时20分55秒 : group_1.job53完成
2014年08月01日 10时20分55秒 : group_1.job64 执行 
2014年08月01日 10时20分55秒 : group_1.job51完成
2014年08月01日 10时20分55秒 : group_1.job65 执行 
2014年08月01日 10时20分55秒 : group_1.job56完成
2014年08月01日 10时20分55秒 : group_1.job66 执行 
2014年08月01日 10时20分55秒 : group_1.job58完成
2014年08月01日 10时20分55秒 : group_1.job67 执行 
2014年08月01日 10时20分55秒 : group_1.job57完成
2014年08月01日 10时20分55秒 : group_1.job68 执行 
2014年08月01日 10时20分55秒 : group_1.job67完成
2014年08月01日 10时20分55秒 : group_1.job69 执行 
2014年08月01日 10时20分55秒 : group_1.job60完成
2014年08月01日 10时20分55秒 : group_1.job70 执行 
2014年08月01日 10时20分56秒 : group_1.job59完成
2014年08月01日 10时20分56秒 : group_1.job71 执行 
2014年08月01日 10时20分56秒 : group_1.job62完成
2014年08月01日 10时20分56秒 : group_1.job72 执行 
2014年08月01日 10时20分56秒 : group_1.job69完成
2014年08月01日 10时20分56秒 : group_1.job73 执行 
2014年08月01日 10时20分56秒 : group_1.job61完成
2014年08月01日 10时20分56秒 : group_1.job74 执行 
2014年08月01日 10时20分56秒 : group_1.job74完成
2014年08月01日 10时20分56秒 : group_1.job75 执行 
2014年08月01日 10时20分56秒 : group_1.job72完成
2014年08月01日 10时20分56秒 : group_1.job76 执行 
2014年08月01日 10时20分56秒 : group_1.job76完成
2014年08月01日 10时20分56秒 : group_1.job77 执行 
2014年08月01日 10时20分56秒 : group_1.job71完成
2014年08月01日 10时20分56秒 : group_1.job78 执行 
2014年08月01日 10时20分56秒 : group_1.job63完成
2014年08月01日 10时20分56秒 : group_1.job79 执行 
2014年08月01日 10时20分57秒 : group_1.job68完成
2014年08月01日 10时20分57秒 : group_1.job80 执行 
2014年08月01日 10时20分57秒 : group_1.job66完成
2014年08月01日 10时20分57秒 : group_1.job81 执行 
2014年08月01日 10时20分57秒 : group_1.job65完成
2014年08月01日 10时20分57秒 : group_1.job82 执行 
2014年08月01日 10时20分57秒 : group_1.job80完成
2014年08月01日 10时20分57秒 : group_1.job83 执行 
2014年08月01日 10时20分57秒 : group_1.job64完成
2014年08月01日 10时20分57秒 : group_1.job84 执行 
2014年08月01日 10时20分57秒 : group_1.job70完成
2014年08月01日 10时20分57秒 : group_1.job85 执行 
2014年08月01日 10时20分57秒 : group_1.job75完成
2014年08月01日 10时20分57秒 : group_1.job86 执行 
2014年08月01日 10时20分57秒 : group_1.job79完成
2014年08月01日 10时20分57秒 : group_1.job87 执行 
2014年08月01日 10时20分57秒 : group_1.job84完成
2014年08月01日 10时20分57秒 : group_1.job88 执行 
2014年08月01日 10时20分57秒 : group_1.job81完成
2014年08月01日 10时20分57秒 : group_1.job89 执行 
2014年08月01日 10时20分58秒 : group_1.job86完成
2014年08月01日 10时20分58秒 : group_1.job90 执行 
2014年08月01日 10时20分58秒 : group_1.job83完成
2014年08月01日 10时20分58秒 : group_1.job91 执行 
2014年08月01日 10时20分58秒 : group_1.job78完成
2014年08月01日 10时20分58秒 : group_1.job92 执行 
2014年08月01日 10时20分58秒 : group_1.job82完成
2014年08月01日 10时20分58秒 : group_1.job93 执行 
2014年08月01日 10时20分58秒 : group_1.job92完成
2014年08月01日 10时20分58秒 : group_1.job94 执行 
2014年08月01日 10时20分58秒 : group_1.job87完成
2014年08月01日 10时20分58秒 : group_1.job95 执行 
2014年08月01日 10时20分58秒 : group_1.job73完成
2014年08月01日 10时20分58秒 : group_1.job96 执行 
2014年08月01日 10时20分58秒 : group_1.job94完成
2014年08月01日 10时20分58秒 : group_1.job97 执行 
2014年08月01日 10时20分58秒 : group_1.job89完成
2014年08月01日 10时20分58秒 : group_1.job98 执行 
2014年08月01日 10时20分59秒 : group_1.job77完成
2014年08月01日 10时20分59秒 : group_1.job99 执行 
2014年08月01日 10时20分59秒 : group_1.job98完成
2014年08月01日 10时20分59秒 : group_1.job100 执行 
2014年08月01日 10时20分59秒 : group_1.job93完成
2014年08月01日 10时20分59秒 : group_1.job85完成
2014年08月01日 10时20分59秒 : group_1.job91完成
2014年08月01日 10时20分59秒 : group_1.job97完成
2014年08月01日 10时20分59秒 : group_1.job88完成
2014年08月01日 10时21分00秒 : group_1.job90完成
2014年08月01日 10时21分00秒 : group_1.job96完成
2014年08月01日 10时21分01秒 : group_1.job100完成
2014年08月01日 10时21分01秒 : group_1.job95完成
2014年08月01日 10时21分01秒 : group_1.job99完成
------- 关闭Scheduler ---------------------
------- 关闭完成 -----------------
Executed 100 jobs.
```
