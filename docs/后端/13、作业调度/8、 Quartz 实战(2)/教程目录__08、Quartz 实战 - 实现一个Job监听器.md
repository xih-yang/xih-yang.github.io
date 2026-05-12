# 08、Quartz 实战 - 实现一个Job监听器
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/8.html
- 分类：作业调度
- 分组：教程目录
实现JobListener接口来声明一个Job监听器

通过Scheduler.getListenerManager().addJobListener();注册一个监听器

SimpleJob1.java

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
public class SimpleJob1 implements Job {
  public void execute(JobExecutionContext context) throws JobExecutionException {
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    JobKey jobKey = context.getJobDetail().getKey();
    System.out.println("SimpleJob1 : " + dateFormat.format(new Date()) + jobKey + " 被执行 " );
  }
}
```

SimpleJob2.java

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
public class SimpleJob2 implements Job {
  public void execute(JobExecutionContext context) throws JobExecutionException {
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    JobKey jobKey = context.getJobDetail().getKey();
    System.out.println("SimpleJob2 : "+ dateFormat.format(new Date()) + jobKey + " 被执行 " );
  }
}
```

Job1Listener.java

```java
package cn.zto.listener;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobListener;
import org.quartz.SchedulerException;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import cn.zto.job.SimpleJob2;
public class Job1Listener implements JobListener {
  public String getName() {
    return "job1_to_job2";
  }
  //Scheduler 在 JobDetail 将要被执行时调用这个方法。
  public void jobToBeExecuted(JobExecutionContext inContext) {
    System.out.println("Job1Listener : "+inContext.getJobDetail().getKey().getName()+" 将被执行. ");
  }
  //Scheduler 在 JobDetail 即将被执行，但又被 TriggerListener 否决了时调用这个方法。
  public void jobExecutionVetoed(JobExecutionContext inContext) {
    System.out.println("Job1Listener : "+inContext.getJobDetail().getKey().getName()+" 被否决  ");
  }
  //Scheduler 在 JobDetail 被执行之后调用这个方法。
  public void jobWasExecuted(JobExecutionContext inContext, JobExecutionException inException) {
    System.out.println("Job1Listener : "+inContext.getJobDetail().getKey().getName()+"被执行");
    JobDetail job2 = JobBuilder.newJob(SimpleJob2.class).withIdentity("job2").build();
    Trigger trigger = TriggerBuilder.newTrigger().withIdentity("job2Trigger").startNow().build();
    try{
      inContext.getScheduler().scheduleJob(job2, trigger);
    } catch (SchedulerException e) {
      System.err.println(" job2无法执行! ");
      e.printStackTrace();
    }
  }
}
```

ListenerExample.java

```java
package cn.zto.app;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobListener;
import org.quartz.Matcher;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.quartz.impl.matchers.KeyMatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import cn.zto.job.SimpleJob1;
import cn.zto.listener.Job1Listener;
public class ListenerExample
{
  public void run() throws Exception {
	System.out.println("------- 初始化 -------------------");
    SchedulerFactory sf = new StdSchedulerFactory();
    Scheduler sched = sf.getScheduler();
	System.out.println("------- 初始化完成 --------");
	System.out.println("------- 向Scheduler加入Job ----------------");
    JobDetail job = JobBuilder.newJob(SimpleJob1.class).withIdentity("job1").build();
    Trigger trigger = TriggerBuilder.newTrigger().withIdentity("trigger1").startNow().build();
    JobListener listener = new Job1Listener();
    //根据name和group 匹配一个job实例
    Matcher matcher = KeyMatcher.keyEquals(job.getKey());
    //为job添加监听器
    sched.getListenerManager().addJobListener(listener, matcher);
    sched.scheduleJob(job, trigger);
    System.out.println("------- 开始Scheduler ----------------");
    sched.start();
    System.out.println("------- Scheduler调用job结束 -----------------");
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
    ListenerExample example = new ListenerExample();
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
------- 开始Scheduler ----------------
------- Scheduler调用job结束 -----------------
Job1Listener : job1 将被执行. 
SimpleJob1 : 2014年07月31日 21时38分20秒DEFAULT.job1 被执行 
Job1Listener : job1被执行
SimpleJob2 : 2014年07月31日 21时38分20秒DEFAULT.job2 被执行 
------- 关闭Scheduler ---------------------
------- 关闭完成 -----------------
Executed 2 jobs.
```
