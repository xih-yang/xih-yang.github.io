# 05、Quartz 实战 - 处理因执行job超时而错过触发的job
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/5.html
- 分类：作业调度
- 分组：教程目录
例子将执行以下操作：

实例化2个Job ， 每个job 5秒执行一次，一直循环 直到Scheduler结束，但是job需要10秒执行完毕

StatefulDumbJob.java

```java
package cn.zto.job;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.PersistJobDataAfterExecution;
@PersistJobDataAfterExecution
//
@DisallowConcurrentExecution
public class StatefulDumbJob
  implements Job
{
  public static final String NUM_EXECUTIONS = "NumExecutions";
  public static final String EXECUTION_DELAY = "ExecutionDelay";
  public void execute(JobExecutionContext context)
    throws JobExecutionException
  {
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    System.err.println("---"+ dateFormat.format(new Date()) + " ：执行 " +context.getJobDetail().getKey());
    JobDataMap map = context.getJobDetail().getJobDataMap();
    int executeCount = 0;
    if (map.containsKey("NumExecutions")) {
      executeCount = map.getInt("NumExecutions");
    }
    ++executeCount;
    map.put("NumExecutions", executeCount);
    long delay = 5000L;
    if (map.containsKey("ExecutionDelay")) {
      delay = map.getLong("ExecutionDelay");
    }
    try{
      Thread.sleep(delay);
    }
    catch (Exception ignore){
    }
    System.err.println("---" + dateFormat.format(new Date()) +" ："+ context.getJobDetail().getKey() + " 完成次数 (" + executeCount + ").");
  }
}
```

MisfireExample.java

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
import cn.zto.job.StatefulDumbJob;
public class MisfireExample
{
  public void run() throws Exception{
	System.out.println("------- 初始化 -------------------");
    SchedulerFactory sf = new StdSchedulerFactory();
    Scheduler sched = sf.getScheduler();
    System.out.println("------- 初始化完成 --------");
    System.out.println("------- 向Scheduler加入Job ----------------");
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    Date startTime = DateBuilder.nextGivenSecondDate(null, 15);
    JobDetail job = JobBuilder.newJob(StatefulDumbJob.class)
    		.withIdentity("statefulJob1", "group1")
    		.usingJobData("ExecutionDelay", Long.valueOf(10000L))
    		.build();
    SimpleTrigger trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger1", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder.simpleSchedule().withIntervalInSeconds(3).repeatForever())
    		.build();
    Date ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将在: " + dateFormat.format(ft) + " 是运行，重复: " + trigger.getRepeatCount() + " 次,每 " + trigger.getRepeatInterval() / 1000L + " 秒执行一次");
    job = JobBuilder.newJob(StatefulDumbJob.class)
    		.withIdentity("statefulJob2", "group1")
    		.usingJobData("ExecutionDelay", Long.valueOf(10000L))
    		.build();
    trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger2", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder.simpleSchedule().withIntervalInSeconds(3).repeatForever()
    				//设置失败指令:表示当job因为job执行时间过长 而 错过触发器时 job执行完后立即再次执行job
    				.withMisfireHandlingInstructionNowWithExistingCount())
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将在: " + dateFormat.format(ft) + " 是运行，重复: " + trigger.getRepeatCount() + " 次,每 " + trigger.getRepeatInterval() / 1000L + " 秒执行一次");
    System.out.println("------- 开始Scheduler ----------------");
    sched.start();
    System.out.println("------- Scheduler调用job结束 -----------------");
    System.out.println("------- 等待10分钟... --------------");
    try{
      Thread.sleep(600000L);
    }
    catch (Exception e){
    }
    System.out.println("------- 关闭Scheduler ---------------------");
    sched.shutdown(true);
    System.out.println("------- 关闭完成 -----------------");
    SchedulerMetaData metaData = sched.getMetaData();
    System.out.println("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
  }
  public static void main(String[] args) throws Exception
  {
    MisfireExample example = new MisfireExample();
    example.run();
  }
}
```

job1:没有设置触发失败指令 所以 job1会在job执行完成后 下一个触发器触发的时间执行job

job2:设置了触发失败指令所以当job2执行完成后 不管有没有到触发时间 都会执行job

最终的结果是 job2的执行次数大于job1的执行次数

为job加上@DisallowConcurrentExecution注解后job执行就会阻塞，在上一次job执行完毕后再去执行下一次job

如果没加上@DisallowConcurrentExecution注解只要到了触发器触发的时间，就会执行一次job，

因为上述的job有对数据进行操作如果上一个job没有执行结束，下一个job开始执行，就会对数据进行脏写：

这个是没加@DisallowConcurrentExecution注解的影响：

```java
------- 初始化 -------------------
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
------- 初始化完成 --------
------- 向Scheduler加入Job ----------------
group1.statefulJob1 将在: 2014年07月31日 18时56分00秒 是运行，重复: -1 次,每 3 秒执行一次
group1.statefulJob2 将在: 2014年07月31日 18时56分00秒 是运行，重复: -1 次,每 3 秒执行一次
------- 开始Scheduler ----------------
------- Scheduler调用job结束 -----------------
------- 等待10分钟... --------------
---2014年07月31日 18时56分00秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分00秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分03秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分03秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分06秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分06秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分09秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分09秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分10秒 ：group1.statefulJob1 完成次数 (1).
---2014年07月31日 18时56分10秒 ：group1.statefulJob2 完成次数 (1).
---2014年07月31日 18时56分12秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分12秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分13秒 ：group1.statefulJob2 完成次数 (1).
---2014年07月31日 18时56分13秒 ：group1.statefulJob1 完成次数 (1).
---2014年07月31日 18时56分15秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分15秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分16秒 ：group1.statefulJob2 完成次数 (1).
---2014年07月31日 18时56分16秒 ：group1.statefulJob1 完成次数 (1).
---2014年07月31日 18时56分18秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分18秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分19秒 ：group1.statefulJob2 完成次数 (1).
---2014年07月31日 18时56分19秒 ：group1.statefulJob1 完成次数 (1).
---2014年07月31日 18时56分21秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分21秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分22秒 ：group1.statefulJob2 完成次数 (2).
---2014年07月31日 18时56分22秒 ：group1.statefulJob1 完成次数 (2).
---2014年07月31日 18时56分24秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分24秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分25秒 ：group1.statefulJob1 完成次数 (2).
---2014年07月31日 18时56分25秒 ：group1.statefulJob2 完成次数 (2).
---2014年07月31日 18时56分27秒 ：执行 group1.statefulJob1
---2014年07月31日 18时56分27秒 ：执行 group1.statefulJob2
---2014年07月31日 18时56分28秒 ：group1.statefulJob1 完成次数 (2).
---2014年07月31日 18时56分28秒 ：group1.statefulJob2 完成次数 (2).
```

加上注解后：

```java
------- 初始化 -------------------
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
------- 初始化完成 --------
------- 向Scheduler加入Job ----------------
group1.statefulJob1 将在: 2014年07月31日 17时35分45秒 是运行，重复: -1 次,每 3 秒执行一次
group1.statefulJob2 将在: 2014年07月31日 17时35分45秒 是运行，重复: -1 次,每 3 秒执行一次
------- 开始Scheduler ----------------
------- Scheduler调用job结束 -----------------
------- 等待10分钟... --------------
---2014年07月31日 17时35分45秒 ：执行 group1.statefulJob1
---2014年07月31日 17时35分45秒 ：执行 group1.statefulJob2
---2014年07月31日 17时35分55秒 ：group1.statefulJob1 完成次数 (1).
---2014年07月31日 17时35分55秒 ：group1.statefulJob2 完成次数 (1).
---2014年07月31日 17时35分55秒 ：执行 group1.statefulJob2
---2014年07月31日 17时35分55秒 ：执行 group1.statefulJob1
---2014年07月31日 17时36分05秒 ：group1.statefulJob2 完成次数 (2).
---2014年07月31日 17时36分05秒 ：group1.statefulJob1 完成次数 (2).
---2014年07月31日 17时36分05秒 ：执行 group1.statefulJob1
---2014年07月31日 17时36分05秒 ：执行 group1.statefulJob2
---2014年07月31日 17时36分15秒 ：group1.statefulJob1 完成次数 (3).
---2014年07月31日 17时36分15秒 ：group1.statefulJob2 完成次数 (3).
---2014年07月31日 17时36分15秒 ：执行 group1.statefulJob1
---2014年07月31日 17时36分15秒 ：执行 group1.statefulJob2
---2014年07月31日 17时36分25秒 ：group1.statefulJob2 完成次数 (4).
---2014年07月31日 17时36分25秒 ：group1.statefulJob1 完成次数 (4).
---2014年07月31日 17时36分25秒 ：执行 group1.statefulJob1
---2014年07月31日 17时36分25秒 ：执行 group1.statefulJob2
---2014年07月31日 17时36分35秒 ：group1.statefulJob1 完成次数 (5).
---2014年07月31日 17时36分35秒 ：group1.statefulJob2 完成次数 (5).
---2014年07月31日 17时36分35秒 ：执行 group1.statefulJob1
---2014年07月31日 17时36分35秒 ：执行 group1.statefulJob2
---2014年07月31日 17时36分45秒 ：group1.statefulJob1 完成次数 (6).
---2014年07月31日 17时36分45秒 ：group1.statefulJob2 完成次数 (6).
---2014年07月31日 17时36分45秒 ：执行 group1.statefulJob2
---2014年07月31日 17时36分45秒 ：执行 group1.statefulJob1
---2014年07月31日 17时36分55秒 ：group1.statefulJob2 完成次数 (7).
---2014年07月31日 17时36分55秒 ：group1.statefulJob1 完成次数 (7).
---2014年07月31日 17时36分55秒 ：执行 group1.statefulJob1
---2014年07月31日 17时36分55秒 ：执行 group1.statefulJob2
---2014年07月31日 17时37分05秒 ：group1.statefulJob1 完成次数 (8).
---2014年07月31日 17时37分05秒 ：执行 group1.statefulJob1
---2014年07月31日 17时37分05秒 ：group1.statefulJob2 完成次数 (8).
---2014年07月31日 17时37分05秒 ：执行 group1.statefulJob2
---2014年07月31日 17时37分15秒 ：group1.statefulJob1 完成次数 (9).
---2014年07月31日 17时37分15秒 ：group1.statefulJob2 完成次数 (9).
```
