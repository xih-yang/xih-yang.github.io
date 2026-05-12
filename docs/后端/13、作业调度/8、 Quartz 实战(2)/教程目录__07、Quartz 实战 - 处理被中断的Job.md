# 07、Quartz 实战 - 处理被中断的Job
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/7.html
- 分类：作业调度
- 分组：教程目录
让Job实现

InterruptableJob就可以声明一个可被打断的Job，因为

InterruptableJob继承了Job接口 所以不用再继承Job接口

DumbInterruptableJob.java

```java
package cn.zto.job;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.InterruptableJob;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.UnableToInterruptJobException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class DumbInterruptableJob implements InterruptableJob {
  private boolean _interrupted = false;
  private JobKey _jobKey = null;
  public void execute(JobExecutionContext context) throws JobExecutionException {
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    this._jobKey = context.getJobDetail().getKey();
    System.out.println("---- " +dateFormat.format(new Date()) +" : "+ this._jobKey + " 运行" );
    try {
      for (int i = 0; i < 4; ++i) {
        try {
          Thread.sleep(1000L);
        } catch (Exception ignore) {
          ignore.printStackTrace();
        }
        if (this._interrupted) {
          System.out.println("--- " + this._jobKey + "  -- 被打断!");
          return;
        }
      }
    }
    finally {
    	System.out.println("---- " +dateFormat.format(new Date()) +" : "+ this._jobKey + " 执行结束 " );
    }
  }
  public void interrupt() throws UnableToInterruptJobException {
	System.out.println("---" + this._jobKey + "  -- 打断 --");
    this._interrupted = true;
  }
}
```

InterruptExample.java

```java
package cn.zto.app;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.DateBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.SimpleTrigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import cn.zto.job.DumbInterruptableJob;
public class InterruptExample {
  public void run() throws Exception {
	System.out.println("------- 初始化 -------------------");
	SchedulerFactory sf = new StdSchedulerFactory();
	Scheduler sched = sf.getScheduler();
	System.out.println("------- 初始化完成 --------");
	System.out.println("------- 向Scheduler加入Job ----------------");
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    Date startTime = DateBuilder.nextGivenSecondDate(null, 15);
    JobDetail job = JobBuilder.newJob(DumbInterruptableJob.class)
    		.withIdentity("interruptableJob1", "group1")
    		.build();
    SimpleTrigger trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger1", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder.simpleSchedule().withIntervalInSeconds(5).repeatForever())
    		.build();
    Date ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将在: " + ft + " 时运行，重复: " + trigger.getRepeatCount() + " 次,每 " + trigger.getRepeatInterval() / 1000L + " 秒执行一次");
    System.out.println("------- 开始Scheduler ----------------");
    sched.start();
    System.out.println("------- Scheduler调用job结束 -----------------");
    System.out.println("------- 每7秒开始循环中断工作 ----------");
    for (int i = 0; i < 50; ++i) {
      try {
        Thread.sleep(7000L);
        //请求中断，被中断的job必须是实现InterruptableJob接口
        sched.interrupt(job.getKey());
      }
      catch (Exception e) {
      }
    }
    System.out.println("------- 关闭Scheduler ---------------------");
    sched.shutdown(true);
    System.out.println("------- 关闭完成 -----------------");
    SchedulerMetaData metaData = sched.getMetaData();
    System.out.println("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
  }
  public static void main(String[] args) throws Exception {
    InterruptExample example = new InterruptExample();
    example.run();
  }
}
```

运行效果:

```java
------- 初始化 -------------------
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
------- 初始化完成 --------
------- 向Scheduler加入Job ----------------
group1.interruptableJob1 将在: Thu Jul 31 20:15:30 CST 2014 时运行，重复: -1 次,每 5 秒执行一次
------- 开始Scheduler ----------------
------- Scheduler调用job结束 -----------------
------- 每7秒开始循环中断工作 ----------
---- 2014年07月31日 20时15分30秒 : group1.interruptableJob1 运行
---- 2014年07月31日 20时15分34秒 : group1.interruptableJob1 执行结束 
---- 2014年07月31日 20时15分35秒 : group1.interruptableJob1 运行
---group1.interruptableJob1  -- 打断 --
--- group1.interruptableJob1  -- 被打断!
---- 2014年07月31日 20时15分37秒 : group1.interruptableJob1 执行结束 
---- 2014年07月31日 20时15分40秒 : group1.interruptableJob1 运行
---group1.interruptableJob1  -- 打断 --
--- group1.interruptableJob1  -- 被打断!
---- 2014年07月31日 20时15分44秒 : group1.interruptableJob1 执行结束 
---- 2014年07月31日 20时15分45秒 : group1.interruptableJob1 运行
---- 2014年07月31日 20时15分49秒 : group1.interruptableJob1 执行结束 
---- 2014年07月31日 20时15分50秒 : group1.interruptableJob1 运行
---group1.interruptableJob1  -- 打断 --
--- group1.interruptableJob1  -- 被打断!
---- 2014年07月31日 20时15分51秒 : group1.interruptableJob1 执行结束 
---- 2014年07月31日 20时15分55秒 : group1.interruptableJob1 运行
---group1.interruptableJob1  -- 打断 --
--- group1.interruptableJob1  -- 被打断!
---- 2014年07月31日 20时15分58秒 : group1.interruptableJob1 执行结束 
---- 2014年07月31日 20时16分00秒 : group1.interruptableJob1 运行
---- 2014年07月31日 20时16分04秒 : group1.interruptableJob1 执行结束 
------- 关闭Scheduler ---------------------
------- 关闭完成 -----------------
Executed 7 jobs.
```
