# 09、Quartz 实战 - 实现Trigger监听器
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/9.html
- 分类：作业调度
- 分组：教程目录
Trigger监听器 和 job监听器 的实现方法都是差不多的

还有重要的一点 监听器的注册一定要在scheduleJob方法之前

MyTriggerListener.java

```java
package cn.zto.listener;
import org.quartz.JobExecutionContext;
import org.quartz.Trigger;
import org.quartz.Trigger.CompletedExecutionInstruction;
import org.quartz.TriggerListener;
public class MyTriggerListener implements TriggerListener{
	private static int count = 0;
	public String getName() {
		return "MyTriggerListener";
	}
	//当与监听器相关联的 Trigger 被触发，Job 上的 execute() 方法将要被执行时，Scheduler 就调用这个方法。
	public void triggerFired(Trigger trigger, JobExecutionContext context) {
		System.out.println("MyTriggerListener :" + context.getTrigger().getKey().getName() + " 被执行");
	}
	/**
	 * 在 Trigger 触发后，Job 将要被执行时由 Scheduler 调用这个方法。
	 * TriggerListener 给了一个选择去否决 Job 的执行。
	 * 假如这个方法返回 true，这个 Job 将不会为此次 Trigger 触发而得到执行。
	 */
	public boolean vetoJobExecution(Trigger trigger, JobExecutionContext context) {
		if (++count %2 == 0) {
			System.out.println("执行Job");
			return false;	
		}
		System.out.println("不执行Job");
		return true;
	}
	/**
	 * Scheduler 调用这个方法是在 Trigger 错过触发时。
	 * 如这个方法的 JavaDoc 所指出的，你应该关注此方法中持续时间长的逻辑：
	 * 		在出现许多错过触发的 Trigger 时，
	 * 		长逻辑会导致骨牌效应。
	 * 		你应当保持这上方法尽量的小。
	 */
	public void triggerMisfired(Trigger trigger) {
		System.out.println("Job错过触发");
	}
	/**
	 * Trigger 被触发并且完成了 Job 的执行时，Scheduler 调用这个方法。
	 * 这不是说这个 Trigger 将不再触发了，而仅仅是当前 Trigger 的触发(并且紧接着的 Job 执行) 结束时。
	 * 这个 Trigger 也许还要在将来触发多次的。
	 */
	public void triggerComplete(Trigger trigger, JobExecutionContext context,CompletedExecutionInstruction triggerInstructionCode) {
		System.out.println("Job执行完毕,Trigger完成");
	}
}
```

TriggerListenerExample.java

```java
package cn.zto.app;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.quartz.DateBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.JobListener;
import org.quartz.Matcher;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.SimpleTrigger;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;
import org.quartz.TriggerListener;
import org.quartz.impl.StdSchedulerFactory;
import org.quartz.impl.matchers.KeyMatcher;
import cn.zto.job.SimpleJob;
import cn.zto.listener.Job1Listener;
import cn.zto.listener.MyTriggerListener;
public class TriggerListenerExample {
	public void run() throws Exception {
		System.out.println("------- 初始化 -------------------");
		SchedulerFactory sf = new StdSchedulerFactory();
		Scheduler sched = sf.getScheduler();
		System.out.println("------- 初始化完成 --------");
		System.out.println("------- 向Scheduler加入Job ----------------");
	    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒"); 
		Date startTime = DateBuilder.nextGivenSecondDate(null, 15);
		JobDetail job = JobBuilder.newJob(SimpleJob.class)
				.withIdentity("job1", "group1")
				.build();
		SimpleTrigger trigger = (SimpleTrigger)TriggerBuilder.newTrigger()
	    		.withIdentity("trigger1", "group1")
	    		.startAt(startTime)
	    		.withSchedule(SimpleScheduleBuilder
	    					.simpleSchedule()
	    					.withIntervalInSeconds(10)
	    					.withRepeatCount(5))
	    		.build();
		JobListener jobListener = new Job1Listener();
		// 根据name和group 匹配一个job实例
		Matcher<JobKey> jobMatcher = KeyMatcher.keyEquals(job.getKey());
		// 为job添加监听器
		sched.getListenerManager().addJobListener(jobListener, jobMatcher);
		TriggerListener triggerListener = new MyTriggerListener();
		// 根据name和group 匹配一个trigger实例
		Matcher<TriggerKey> triggerMatcher = KeyMatcher.keyEquals(trigger.getKey());
		//为Trigger添加监听器
		sched.getListenerManager().addTriggerListener(triggerListener);
		Date ft = sched.scheduleJob(job, trigger);
		System.out.println(job.getKey() + " 将会在: " + dateFormat.format(ft) + "时运行，"
	    		+ "重复: " + trigger.getRepeatCount() + " 次, " //获取重复的次数
	    		+ "每 " + trigger.getRepeatInterval() / 1000L + " s 重复一次");
		System.out.println("------- 开始Scheduler ----------------");
		sched.start();
		System.out.println("------- Scheduler调用job结束 -----------------");
		try {
			Thread.sleep(30000L);
		} catch (Exception e) {
		}
		System.out.println("------- 关闭Scheduler ---------------------");
		sched.shutdown(true);
		System.out.println("------- 关闭完成 -----------------");
		SchedulerMetaData metaData = sched.getMetaData();
		System.out.println("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
	}
	public static void main(String[] args) throws Exception {
		TriggerListenerExample example = new TriggerListenerExample();
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
group1.job1 将会在: 2014年07月31日 22时37分45秒时运行，重复: 5 次, 每 10 s 重复一次
------- 开始Scheduler ----------------
------- Scheduler调用job结束 -----------------
MyTriggerListener :trigger1 被执行
不执行Job
Job1Listener : job1 被否决  
MyTriggerListener :trigger1 被执行
执行Job
Job1Listener : job1 将被执行. 
SimpleJob类 ：group1.job1 在 2014年07月31日 22时37分55秒 时运行
Job1Listener : job1被执行
Job执行完毕,Trigger完成
MyTriggerListener :job2Trigger 被执行
不执行Job
------- 关闭Scheduler ---------------------
------- 关闭完成 -----------------
Executed 1 jobs.
```
