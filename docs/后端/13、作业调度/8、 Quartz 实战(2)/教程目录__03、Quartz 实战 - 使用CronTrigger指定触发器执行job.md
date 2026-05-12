# 03、Quartz 实战 - 使用CronTrigger指定触发器执行job
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/3.html
- 分类：作业调度
- 分组：教程目录
SimpleTrigger 对于 处理简单的事件出发还是不错的，但是你想要你的作业需要更复杂的执行计划时，你需要 CronTrigger 给你提供更强更灵活的功能。

下面的内容摘自Quartz Job Scheduling Framrwork：

```java
cron 这一观念是来自于 UNIX 世界。在 UNIX 中，cron 是一个运行于后台的守护程序，它负责所有基于时间的事件。尽管 Quartz 除相同的名字和相似的表达式语法外，并未分享到 UNIX cron 别的东西，我们还是值得花几个段落去理解 cron 背后的历史。我们这里的目标不是搞混 UNIX cron 表达式和 Quartz 的 cron 表达式，但是你应该了解 Quartz 表达式的历史，并探索为什么他们运作起来很像。这儿明显有许多有意图的相似性。
UNIX Cron 的格式
你可以认为 UNIX crontab 是 Trigger 和 Job 的组合，因为它们同时列出来执行计划和要执行的命令(job)。
Cron Expression 的格式
crontab 格式包含六段，前五段为执行计划，第六段为要执行的命令。(Quartz cron 表达式有七段。) 下面这些是执行计划的五个字段：
    ·分 (00-59)
    ·时 (00-23)
    ·日 (1-31)
    ·月 (1-12)
    ·周 (0-6 或 sun-sat)
UNIX cron 格式表达式中允许出现一些特殊的字符，例如星号(*)，它用来匹配所有值。这作有一个 UNIX crontab 的例子：
0 8 * * * echo "WAKE UP" 2>$1 /dev/console
这一 crontab 条目在每天早上8点打印字符串 "WAKE UP" 到 UNIX 的设置 /dev/console 上。图 5.1 显示了这个动作。
```

而Quartz cron的表达式则是：

每一个字段都有一套可以指定有效值，如

·秒(0-59)

·分(0-59)

·时(0-23)

·天(1-31) 要注意一些特别的月份

·月(1-12) 也可以用字符串 “JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV ，DEC” 表示

·周(1-7) 也可以用字符口串“SUN, MON, TUE, WED, THU, FRI ，SAT”表示

·年(可选字段) (1970-2099)

“*” 代表整个时间段.

“/”：为特别单位，表示为“每”如“0/15”表示每隔15分钟执行一次,“0”表示为从“0”分开始, “3/20”表示表示每隔20分钟执行一次，“3”表示从第3分钟开始执行

“?”：表示每月的某一天，或第周的某一天

“L”：用于每月，或每周，表示为每月的最后一天，或每个月的最后星期几如“6L”表示“每月的最后一个星期五”

“W”：表示为最近工作日，如“15W”放在每月（day-of-month）字段上表示为“到本月15日最近的工作日”

““#”：是用来指定“的”每月第n个工作日,例 在每周（day-of-week）这个字段中内容为"6#3" or "FRI#3" 则表示“每月第三个星期五”

Cron表达式范例：

每隔5秒执行一次：*/5 * * * * ?

每隔1分钟执行一次：0 */1 * * * ?

每天23点执行一次：0 0 23 * * ?

每天凌晨1点执行一次：0 0 1 * * ?

每月1号凌晨1点执行一次：0 0 1 1 * ?

每月最后一天23点执行一次：0 0 23 L * ?

每周星期天凌晨1点实行一次：0 0 1 ? * L

在26分、29分、33分执行一次：0 26,29,33 * * * ?

每天的0点、13点、18点、21点都执行一次：0 0 0,13,18,21 * * ?

CronTriggerExample.java

```java
package cn.zto.app;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.CronScheduleBuilder;
import org.quartz.CronTrigger;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import cn.zto.job.SimpleJob;
public class CronTriggerExample
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
    JobDetail job = JobBuilder.newJob(SimpleJob.class).withIdentity("job1", "group1").build();
    CronTrigger trigger = (CronTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger1", "group1")
    		//设置Cron表达式
    		//从0秒开始 每隔20秒执行一次
    		.withSchedule(CronScheduleBuilder.cronSchedule("0/20 * * * * ?"))
    		.build();
    Date ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 已经在 : " + dateFormat.format(ft) + " 时运行，Cron表达式：" + trigger.getCronExpression());
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job2", "group1").build();
    trigger = (CronTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger2", "group1")
    		//从0分开始 每隔2分15秒执行一次
    		.withSchedule(CronScheduleBuilder.cronSchedule("15 0/2 * * * ?"))
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 已经在 : " + dateFormat.format(ft) + " 时运行，Cron表达式：" + trigger.getCronExpression());
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job3", "group1").build();
    trigger = (CronTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger3", "group1")
    		//每天的8点到17点 从0分开始 每隔2分钟执行一次
    		.withSchedule(CronScheduleBuilder.cronSchedule("0 0/2 8-17 * * ?"))
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 已经在 : " + dateFormat.format(ft) + " 时运行，Cron表达式：" + trigger.getCronExpression());
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job4", "group1").build();
    trigger = (CronTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger4", "group1")
    		//每天的17点到23点 从0分开始 每隔3分钟执行一次
    		.withSchedule(CronScheduleBuilder.cronSchedule("0 0/3 17-23 * * ?"))
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 已经在 : " + dateFormat.format(ft) + " 时运行，Cron表达式：" + trigger.getCronExpression());
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job5", "group1").build();
    trigger = (CronTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger5", "group1")
    		//在每个月的第1天和第15天那天的10点钟执行
    		.withSchedule(CronScheduleBuilder.cronSchedule("0 0 10am 1,15 * ?"))
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 已经在 : " + dateFormat.format(ft) + " 时运行，Cron表达式：" + trigger.getCronExpression());
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job6", "group1").build();
    trigger = (CronTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger6", "group1")
    		//周一到周五  每0秒和30秒 执行一次
    		.withSchedule(CronScheduleBuilder.cronSchedule("0,30 * * ? * MON-FRI"))
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 已经在 : " + dateFormat.format(ft) + " 时运行，Cron表达式：" + trigger.getCronExpression());
    job = JobBuilder.newJob(SimpleJob.class).withIdentity("job7", "group1").build();
    trigger = (CronTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger7", "group1")
    		//周六周日  每0秒和30秒 执行一次
    		.withSchedule(CronScheduleBuilder.cronSchedule("0,30 * * ? * SAT,SUN"))
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 已经在 : " + dateFormat.format(ft) + " 时运行，Cron表达式：" + trigger.getCronExpression());
    System.out.println("------- 开始Scheduler ----------------");
    sched.start();
    System.out.println("------- Scheduler调用job结束 -----------------");
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
    CronTriggerExample example = new CronTriggerExample();
    example.run();
  }
}
```

SimpleJob.java

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
