# 06、Quartz 实战 - 处理job异常
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/6.html
- 分类：作业调度
- 分组：教程目录
**当Job在执行是可能会出现异常操作，我们可以再Job执行期间处理这些异常 然后决定Job是否继续往下执行**

**BadJob1.java**

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
@PersistJobDataAfterExecution
@DisallowConcurrentExecution
public class BadJob1 implements Job {
	private int calculation;
	public void execute(JobExecutionContext context)
			throws JobExecutionException {
		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
		JobKey jobKey = context.getJobDetail().getKey();
		JobDataMap dataMap = context.getJobDetail().getJobDataMap();
		int denominator = dataMap.getInt("denominator");
		System.out.println("---" + dateFormat.format(new Date()) +":"+ jobKey + " 除数为： " + denominator);
		try {
			this.calculation = (4815 / denominator);
		} catch (Exception e) {
			System.out.println("--- Error in job!");
			JobExecutionException e2 = new JobExecutionException(e);
			dataMap.put("denominator", "1");
			//job会继续执行下去
			e2.setRefireImmediately(true);
			throw e2;
		}
		System.out.println("---" +dateFormat.format(new Date()) +":"+ jobKey  +" 执行结束 "  );
	}
}
```

人工制造一个异常 让除数为0 ，但是这个Job会继续执行下去

BadJob2.java

```java
package cn.zto.job;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.PersistJobDataAfterExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@PersistJobDataAfterExecution
@DisallowConcurrentExecution
public class BadJob2 implements Job {
	private int calculation;
	public void execute(JobExecutionContext context)
			throws JobExecutionException {
		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
		JobKey jobKey = context.getJobDetail().getKey();
		System.out.println("---" +dateFormat.format(new Date()) +":"+ jobKey  );
		try {
			int zero = 0;
			this.calculation = (4815 / zero);
		} catch (Exception e) {
			System.out.println("--- Error in job!");
			JobExecutionException e2 = new JobExecutionException(e);
			//自动停止Schedule,和这个Job有关的触发器，Job也将不再运行
			e2.setUnscheduleAllTriggers(true);
			throw e2;
		}
		System.out.println("---" +dateFormat.format(new Date()) +":"+ jobKey  +" 执行结束 "  );
	}
}
```

人工制造一个异常 让除数为0 ，当出现异常时这个Job会停止

JobExceptionExample.java

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
import cn.zto.job.BadJob1;
import cn.zto.job.BadJob2;
public class JobExceptionExample
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
    Date startTime = DateBuilder.nextGivenSecondDate(null, 15);
    JobDetail job = JobBuilder.newJob(BadJob1.class)
    		.withIdentity("badJob1", "group1")
    		//设置一个为0的除数放入JobDatamap中
    		.usingJobData("denominator", "0")
    		.build();
    SimpleTrigger trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger1", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder.simpleSchedule().withIntervalInSeconds(10).repeatForever())
    		.build();
    Date ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将在: " + dateFormat.format(ft) + " 时运行，重复: " + trigger.getRepeatCount() + " 次,每 " + trigger.getRepeatInterval() / 1000L + " 秒执行一次");
    job = JobBuilder.newJob(BadJob2.class).withIdentity("badJob2", "group1").build();
    trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
    		.withIdentity("trigger2", "group1")
    		.startAt(startTime)
    		.withSchedule(SimpleScheduleBuilder.simpleSchedule().withIntervalInSeconds(5).repeatForever())
    		.build();
    ft = sched.scheduleJob(job, trigger);
    System.out.println(job.getKey() + " 将在: " + dateFormat.format(ft) + " 时运行，重复: " + trigger.getRepeatCount() + " 次,每 " + trigger.getRepeatInterval() / 1000L + " 秒执行一次");
    System.out.println("------- 开始Scheduler ----------------");
    sched.start();
    System.out.println("------- Scheduler调用job结束 -----------------");
    System.out.println("------- 等待30秒... --------------");
    try{
      Thread.sleep(30000L);
    }
    catch (Exception e){
    }
    System.out.println("------- 关闭Scheduler ---------------------");
    sched.shutdown(true);
    System.out.println("------- 关闭完成 -----------------");
    SchedulerMetaData metaData = sched.getMetaData();
    System.out.println("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
  }
  public static void main(String[] args) throws Exception{
    JobExceptionExample example = new JobExceptionExample();
    example.run();
  }
}
```

运行效果：

```java
------- 初始化 -------------------
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
------- 初始化完成 --------
------- 向Scheduler加入Job ----------------
group1.badJob1 将在: 2014年07月31日 19时43分30秒 时运行，重复: -1 次,每 10 秒执行一次
group1.badJob2 将在: 2014年07月31日 19时43分30秒 时运行，重复: -1 次,每 5 秒执行一次
------- 开始Scheduler ----------------
------- Scheduler调用job结束 -----------------
------- 等待30秒... --------------
---2014年07月31日 19时43分30秒:group1.badJob1 除数为： 0
--- Error in job!
---2014年07月31日 19时43分30秒:group1.badJob1 除数为： 1
---2014年07月31日 19时43分30秒:group1.badJob1 执行结束 
---2014年07月31日 19时43分30秒:group1.badJob2
--- Error in job!
---2014年07月31日 19时43分40秒:group1.badJob1 除数为： 1
---2014年07月31日 19时43分40秒:group1.badJob1 执行结束 
---2014年07月31日 19时43分50秒:group1.badJob1 除数为： 1
---2014年07月31日 19时43分50秒:group1.badJob1 执行结束 
------- 关闭Scheduler ---------------------
------- 关闭完成 -----------------
Executed 5 jobs.
```
