# 04、Quartz 实战 - 通过JobDataMap实现数据的传输
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/4.html
- 分类：作业调度
- 分组：教程目录
JobDataMap 通过它的超类 org.quartz.util.DirtyFlagMap 实现了java.util.Map 接口，你可以向 JobDataMap 中存入键/值对，那些数据对可在你的 Job 类中传递和进行访问。这是一个向你的 Job 传送配置的信息便捷方法。

ColorJob.java

```java
package cn.zto.job;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.PersistJobDataAfterExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
//对jobDateMap实现持久化   将上次处理过得值存入jobDateMap
@PersistJobDataAfterExecution
@DisallowConcurrentExecution
public class ColorJob
  implements Job
{
  public static final String FAVORITE_COLOR = "favorite color";
  public static final String EXECUTION_COUNT = "count";
  private int _counter = 1;
  public void execute(JobExecutionContext context)
    throws JobExecutionException
  {
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    JobKey jobKey = context.getJobDetail().getKey();
    JobDataMap data = context.getJobDetail().getJobDataMap();
    String favoriteColor = data.getString("color");
    int count = data.getInt("count");
    System.out.println(("ColorJob:  在 " + dateFormat.format(new Date()) + "执行  "+  jobKey +"\n" 
    + " color : " + favoriteColor + "\n" 
    + " 第  " + count + "次 执行\n" 
    + " 成员变量_counter是第 " + this._counter+ "次 执行"));
    ++count;
    data.put("count", count);
    this._counter += 1;
  }
}
```

JobStateExample.java

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
import cn.zto.job.ColorJob;
public class JobStateExample
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
    Date startTime = DateBuilder.nextGivenSecondDate(null, 10);
    JobDetail job1 = JobBuilder.newJob(ColorJob.class).withIdentity("job1", "group1").build();
    SimpleTrigger trigger1 = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger1", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder.simpleSchedule()
    				.withIntervalInSeconds(10)
    				.withRepeatCount(4))
    		.build();
    job1.getJobDataMap().put("color", "Green");
    job1.getJobDataMap().put("count", 1);
    Date scheduleTime1 = sched.scheduleJob(job1, trigger1);
    System.out.println(job1.getKey() + "  将在:  " + dateFormat.format(scheduleTime1) + " 运行，重复 " + trigger1.getRepeatCount() + " 次,每 " + trigger1.getRepeatInterval() / 1000L + " 秒执行一次");
    JobDetail job2 = JobBuilder.newJob(ColorJob.class).withIdentity("job2", "group1").build();
    SimpleTrigger trigger2 = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger2", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder.simpleSchedule()
    				.withIntervalInSeconds(10)
    				.withRepeatCount(4))
    		.build();
    job2.getJobDataMap().put("color", "Red");
    job2.getJobDataMap().put("count", 1);
    Date scheduleTime2 = sched.scheduleJob(job2, trigger2);
    System.out.println(job2.getKey().toString() + "  将在:  " + dateFormat.format(scheduleTime2) + " 运行，重复 " + trigger2.getRepeatCount() + " 次,每 " + trigger2.getRepeatInterval() / 1000L + " 秒执行一次");
    System.out.println("------- 开始Scheduler ----------------");
    sched.start();
    System.out.println("------- Scheduler调用job结束 -----------------");
    System.out.println("------- 等待60秒... -------------");
    try
    {
      Thread.sleep(60000L);
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
    JobStateExample example = new JobStateExample();
    example.run();
  }
}
```

运行结果如下：

```java
------- 初始化 -------------------
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
------- 初始化完成 --------
------- 向Scheduler加入Job ----------------
group1.job1  将在:  2014年07月31日 15时20分40秒 运行，重复 4 次,每 10 秒执行一次
group1.job2  将在:  2014年07月31日 15时20分40秒 运行，重复 4 次,每 10 秒执行一次
------- 开始Scheduler ----------------
------- Scheduler调用job结束 -----------------
------- 等待60秒... -------------
ColorJob:  在 2014年07月31日 15时20分40秒执行  group1.job1
 color : Green
 第  1次 执行
 成员变量_counter是第 1次 执行
ColorJob:  在 2014年07月31日 15时20分40秒执行  group1.job2
 color : Red
 第  1次 执行
 成员变量_counter是第 1次 执行
ColorJob:  在 2014年07月31日 15时20分50秒执行  group1.job1
 color : Green
 第  2次 执行
 成员变量_counter是第 1次 执行
ColorJob:  在 2014年07月31日 15时20分50秒执行  group1.job2
 color : Red
 第  2次 执行
 成员变量_counter是第 1次 执行
ColorJob:  在 2014年07月31日 15时21分00秒执行  group1.job1
 color : Green
 第  3次 执行
 成员变量_counter是第 1次 执行
ColorJob:  在 2014年07月31日 15时21分00秒执行  group1.job2
 color : Red
 第  3次 执行
 成员变量_counter是第 1次 执行
ColorJob:  在 2014年07月31日 15时21分10秒执行  group1.job1
 color : Green
 第  4次 执行
 成员变量_counter是第 1次 执行
ColorJob:  在 2014年07月31日 15时21分10秒执行  group1.job2
 color : Red
 第  4次 执行
 成员变量_counter是第 1次 执行
ColorJob:  在 2014年07月31日 15时21分20秒执行  group1.job1
 color : Green
 第  5次 执行
 成员变量_counter是第 1次 执行
ColorJob:  在 2014年07月31日 15时21分20秒执行  group1.job2
 color : Red
 第  5次 执行
 成员变量_counter是第 1次 执行
------- 关闭Scheduler ---------------------
------- 关闭完成 -----------------
Executed 10 jobs.
```
