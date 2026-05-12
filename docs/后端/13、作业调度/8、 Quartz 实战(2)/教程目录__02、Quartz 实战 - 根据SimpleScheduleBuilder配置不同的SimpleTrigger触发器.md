# 02、Quartz 实战 - 根据SimpleScheduleBuilder配置不同的SimpleTrigger触发器
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/2.html
- 分类：作业调度
- 分组：教程目录
Job代码：

```java
package cn.zto.job;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.Job;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class SimpleJob
  implements Job
{
  public void execute(JobExecutionContext context)
    throws JobExecutionException
  {
	//通过上下文获取
    JobKey jobKey = context.getJobDetail().getKey();
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");  
    System.out.println("SimpleJob类 ："+ jobKey + " 在 " + dateFormat.format(new Date())+" 时运行");
  }
}
```

SimpleTriggerExample.java

```java
package cn.zto.app;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.DateBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.SimpleTrigger;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;
import org.quartz.impl.StdSchedulerFactory;
import cn.zto.job.SimpleJob;
public class SimpleTriggerExample
{
  public void run()
    throws Exception
  {
    System.out.println("------- 初始化 -------------------");
    SchedulerFactory sf = new StdSchedulerFactory();
    Scheduler sched = sf.getScheduler();
    System.out.println("------- 初始化完成 --------");
    System.out.println("------- 向Scheduler加入Job ----------------");
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");  
    //设置任务触发的时间，时间为下方15的倍数  会在任意时间段的  15S 30S 45S 60S 开始会触发一次
    Date startTime = DateBuilder.nextGivenSecondDate(null, 15);
    JobDetail job = JobBuilder.newJob(SimpleJob.class).withIdentity("job1", "group1").build();
    SimpleTrigger trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger1", "group1")
    		.startAt(startTime)
    		.build();
    Date ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将会在: " + dateFormat.format(ft) + "时运行，"
    		+ "重复: " + trigger.getRepeatCount() + " 次, " //获取重复的次数
    		+ "每 " + trigger.getRepeatInterval() / 1000L + " s 重复一次");
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job2", "group1").build();
    trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger2", "group1")
    		.startAt(startTime)
    		//设置一个用于触发的时间
    		.withSchedule(SimpleScheduleBuilder//SimpleScheduleBuilder是简单调用触发器，它只能指定触发的间隔时间和执行次数；
	    				.simpleSchedule()//创建一个SimpleScheduleBuilder
	    				.withIntervalInSeconds(10)//指定一个重复间隔,以毫秒为单位。
	    				.withRepeatCount(10))//指定反复的次数
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将会在: " + dateFormat.format(ft) + "时运行，"
    		+ "重复: " + trigger.getRepeatCount() + " 次, "
    		+ "每 " + trigger.getRepeatInterval() / 1000L + " s 重复一次");
    trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		//将触发器放入  group2 里面
    		.withIdentity("trigger2", "group2")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder
	    				.simpleSchedule()
	    				.withIntervalInSeconds(10)
	    				.withRepeatCount(2))
    		.forJob(job)
    		.build();
    ft = sched.scheduleJob(trigger);
    System.out.println(job.getKey() + " 也会在: " + dateFormat.format(ft) + "时运行，"
    		+ "重复: " + trigger.getRepeatCount() + " 次, "
    		+ "每 " + trigger.getRepeatInterval() / 1000L + " s 重复一次");
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job3", "group1").build();
    trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger3", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder
    					.simpleSchedule()
    					.withIntervalInSeconds(10)
    					.withRepeatCount(5))
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将会在: " + dateFormat.format(ft) + "时运行，"
    		+ "重复: " + trigger.getRepeatCount() + " 次, "
    		+ "每 " + trigger.getRepeatInterval() / 1000L + " s 重复一次");
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job4", "group1").build();
    System.out.println("当前时间为："+dateFormat.format(new Date()));
    trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger4", "group1")
    		//设定时间为5分钟后运行
    		.startAt(DateBuilder.futureDate(5, DateBuilder.IntervalUnit.MINUTE))
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将会在: " + dateFormat.format(ft) + "时运行，"
    		+ "重复: " + trigger.getRepeatCount() + " 次, "
    		+ "每 " + trigger.getRepeatInterval() / 1000L + " s 重复一次");
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job5", "group1").build();
    trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger5", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder
    					.simpleSchedule()
    					.withIntervalInSeconds(40)
    					//触发器会一直重复执行下去
    					.repeatForever())
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将会在: " + dateFormat.format(ft) + "时运行，"
    		+ "重复: " + trigger.getRepeatCount() + " 次, "
    		+ "每 " + trigger.getRepeatInterval() / 1000L + " s 重复一次");
    System.out.println("------- 开始Scheduler ----------------");
    sched.start();
    System.out.println("------- Scheduler调用job结束 -----------------");
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job6", "group1").build();
    trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger6", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder
    					.simpleSchedule()
    					.withIntervalInMinutes(1)
    					.withRepeatCount(20))
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将会在: " + dateFormat.format(ft) + "时运行，"
    		+ "重复: " + trigger.getRepeatCount() + " 次, "
    		+ "每 " + trigger.getRepeatInterval() / 1000L + " s 重复一次");
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job7", "group1")
    		.storeDurably()//该job没有触发器，该方法将durability设置为true
    		.build();
    //添加一个没有出发器的job
    sched.addJob(job, true);
    System.out.println("手动触发job7...");
    //jobKey用来唯一的标识一个JobDetail
    //执行Job
    sched.triggerJob(JobKey.jobKey("job7", "group1"));
    System.out.println("------- 等待10S... --------------");
    try
    {
      Thread.sleep(10000L);
    }
    catch (Exception e)
    {
    }
    System.out.println("------- 改变触发器6 --------------------");
    trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger10", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder
    				.simpleSchedule()
    				.withIntervalInMinutes(1)
    				.withRepeatCount(20))
    		.build();
    //根据触发器获取指定的Job然后更改此Job的触发器
    //新的触发器不需要旧的触发器的名称相同
    ft = sched.rescheduleJob(new TriggerKey("trigger6","group1")//获取TriggerKey（用来标识唯一的Trigger）
    		, trigger);
    System.out.println("job6 重新在 " + dateFormat.format(ft)+ "时运行 ，"
    		+ "重复: " + trigger.getRepeatCount() + " 次, "
    		+ "每 " + trigger.getRepeatInterval() / 1000L + " s 重复一次");
    System.out.println("------- 等待5分钟... ------------");
    try
    {
      Thread.sleep(300000L);
    }
    catch (Exception e)
    {
    }
    System.out.println("------- 关闭Scheduler ---------------------");
    sched.shutdown(true);
    System.out.println("------- 关闭完成 -----------------");
    SchedulerMetaData metaData = sched.getMetaData();
    System.out.println("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
  }
  public static void main(String[] args)
    throws Exception
  {
    SimpleTriggerExample example = new SimpleTriggerExample();
    example.run();
  }
}
```

运行结果：

```java
------- 初始化 -------------------
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
------- 初始化完成 --------
------- 向Scheduler加入Job ----------------
group1.job1 将会在: 2014年07月31日 13时51分45秒时运行，重复: 0 次, 每 0 s 重复一次
group1.job2 将会在: 2014年07月31日 13时51分45秒时运行，重复: 10 次, 每 10 s 重复一次
group1.job2 也会在: 2014年07月31日 13时51分45秒时运行，重复: 2 次, 每 10 s 重复一次
group1.job3 将会在: 2014年07月31日 13时51分45秒时运行，重复: 5 次, 每 10 s 重复一次
当前时间为：2014年07月31日 13时51分41秒
group1.job4 将会在: 2014年07月31日 13时56分41秒时运行，重复: 0 次, 每 0 s 重复一次
group1.job5 将会在: 2014年07月31日 13时51分45秒时运行，重复: -1 次, 每 40 s 重复一次
------- 开始Scheduler ----------------
------- Scheduler调用job结束 -----------------
group1.job6 将会在: 2014年07月31日 13时51分45秒时运行，重复: 20 次, 每 60 s 重复一次
手动触发job7...
------- 等待10S... --------------
SimpleJob类 ：group1.job7 在 2014年07月31日 13时51分41秒 时运行
SimpleJob类 ：group1.job1 在 2014年07月31日 13时51分45秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时51分45秒 时运行
SimpleJob类 ：group1.job3 在 2014年07月31日 13时51分45秒 时运行
SimpleJob类 ：group1.job5 在 2014年07月31日 13时51分45秒 时运行
SimpleJob类 ：group1.job6 在 2014年07月31日 13时51分45秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时51分45秒 时运行
------- 改变触发器6 --------------------
job6 重新在 2014年07月31日 13时51分45秒时运行 ，重复: 20 次, 每 60 s 重复一次
------- 等待5分钟... ------------
SimpleJob类 ：group1.job6 在 2014年07月31日 13时51分51秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时51分55秒 时运行
SimpleJob类 ：group1.job3 在 2014年07月31日 13时51分55秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时51分55秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时52分05秒 时运行
SimpleJob类 ：group1.job3 在 2014年07月31日 13时52分05秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时52分05秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时52分15秒 时运行
SimpleJob类 ：group1.job3 在 2014年07月31日 13时52分15秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时52分25秒 时运行
SimpleJob类 ：group1.job3 在 2014年07月31日 13时52分25秒 时运行
SimpleJob类 ：group1.job5 在 2014年07月31日 13时52分25秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时52分35秒 时运行
SimpleJob类 ：group1.job3 在 2014年07月31日 13时52分35秒 时运行
SimpleJob类 ：group1.job6 在 2014年07月31日 13时52分45秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时52分45秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时52分55秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时53分05秒 时运行
SimpleJob类 ：group1.job5 在 2014年07月31日 13时53分05秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时53分15秒 时运行
SimpleJob类 ：group1.job2 在 2014年07月31日 13时53分25秒 时运行
SimpleJob类 ：group1.job6 在 2014年07月31日 13时53分45秒 时运行
SimpleJob类 ：group1.job5 在 2014年07月31日 13时53分45秒 时运行
SimpleJob类 ：group1.job5 在 2014年07月31日 13时54分25秒 时运行
SimpleJob类 ：group1.job6 在 2014年07月31日 13时54分45秒 时运行
SimpleJob类 ：group1.job5 在 2014年07月31日 13时55分05秒 时运行
SimpleJob类 ：group1.job6 在 2014年07月31日 13时55分45秒 时运行
SimpleJob类 ：group1.job5 在 2014年07月31日 13时55分45秒 时运行
SimpleJob类 ：group1.job5 在 2014年07月31日 13时56分25秒 时运行
SimpleJob类 ：group1.job4 在 2014年07月31日 13时56分41秒 时运行
SimpleJob类 ：group1.job6 在 2014年07月31日 13时56分45秒 时运行
------- 关闭Scheduler ---------------------
------- 关闭完成 -----------------
Executed 38 jobs.
```
