# 11、Quartz 实战 - Quartz的远程方法调用
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/11.html
- 分类：作业调度
- 分组：教程目录
```java
在Resource目录下添加2个properties文件
```

client.properties

```java
# Properties file for use by StdSchedulerFactory
# to create a Quartz Scheduler Instance.
#
# Configure Main Scheduler Properties  ======================================
org.quartz.scheduler.instanceName: Sched1
org.quartz.scheduler.logger: schedLogger
org.quartz.scheduler.skipUpdateCheck: true
org.quartz.scheduler.rmi.proxy: true
org.quartz.scheduler.rmi.registryHost: localhost
org.quartz.scheduler.rmi.registryPort: 1099
```

server.properties

```java
#============================================================================
# Configure Main Scheduler Properties  
#============================================================================
org.quartz.scheduler.instanceName: Sched1
org.quartz.scheduler.rmi.export: true
org.quartz.scheduler.rmi.registryHost: localhost
org.quartz.scheduler.rmi.registryPort: 1099
org.quartz.scheduler.rmi.createRegistry: true
org.quartz.scheduler.skipUpdateCheck: true
#============================================================================
# Configure ThreadPool  
#============================================================================
org.quartz.threadPool.class: org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.threadCount: 10
org.quartz.threadPool.threadPriority: 5
#============================================================================
# Configure JobStore  
#============================================================================
org.quartz.jobStore.misfireThreshold: 60000
org.quartz.jobStore.class: org.quartz.simpl.RAMJobStore
```

RmiJob.java

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
public class RmiJob implements Job {
  public static final String MESSAGE = "msg";
  public void execute(JobExecutionContext context) throws JobExecutionException {
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
    JobKey jobKey = context.getJobDetail().getKey();
    String message = (String)context.getJobDetail().getJobDataMap().get("msg");
    System.out.println(dateFormat.format(new Date()) + " : " + jobKey + " 执行 " );
    System.out.println("SimpleJob: msg: " + message);
  }
}
```

RemoteServerExample.java

```java
package cn.zto.app;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.impl.StdSchedulerFactory;
public class RemoteServerExample {
	public void run() throws Exception {
		System.setProperty("org.quartz.properties", "server.properties");
		SchedulerFactory sf = new StdSchedulerFactory();
		Scheduler sched = sf.getScheduler();
		System.out.println("------- 初始化完成 -----------");
		System.out.println("------- 由远程客户端来安排Job --");
		System.out.println("------- 开始Scheduler ----------------");
		sched.start();
		System.out.println("------- Scheduler调用job结束 -----------------");
		System.out.println("------- 等待10分钟... ------------");
		try {
			Thread.sleep(600000L);
		} catch (Exception e) {
		}
		System.out.println("------- 关闭Scheduler ---------------------");
		sched.shutdown(true);
		System.out.println("------- 关闭完成 -----------------");
		SchedulerMetaData metaData = sched.getMetaData();
		System.out.println("Executed " + metaData.getNumberOfJobsExecuted()
				+ " jobs.");
	}
	public static void main(String[] args) throws Exception {
		RemoteServerExample example = new RemoteServerExample();
		example.run();
	}
}
```

RemoteClientExample.java

```java
package cn.zto.app;
import org.quartz.CronScheduleBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import cn.zto.job.RmiJob;
public class RemoteClientExample {
	public void run() throws Exception {
		System.setProperty("org.quartz.properties", "client.properties");
		SchedulerFactory sf = new StdSchedulerFactory();
		Scheduler sched = sf.getScheduler();
		JobDetail job = JobBuilder.newJob(RmiJob.class)
				.withIdentity("remotelyAddedJob", "default").build();
		JobDataMap map = job.getJobDataMap();
		map.put("msg", "向服务端添加Job!");
		Trigger trigger = TriggerBuilder.newTrigger()
				.withIdentity("remotelyAddedTrigger", "default")
				.forJob(job.getKey())
				.withSchedule(CronScheduleBuilder.cronSchedule("/5 * * ? * *"))
				.build();
		sched.scheduleJob(job, trigger);
		System.out.println("服务端工作.");
	}
	public static void main(String[] args) throws Exception {
		RemoteClientExample example = new RemoteClientExample();
		example.run();
	}
}
```

想像一下，你需要构建一个这样的作业调度器，它要应多个客户端请求进行动态 Job 部署。在这个案例中，一个单一的、自包容的 Quartz 调度器是没法做到的，因为这些客户端程序在自己所在的地址空间或者说 JVM 中需要以一种方式与调度器交谈。

借助于RMI，运行在一个地址空间(或JVM) 的对象可自由的调用另一 JVM 中的对象。这也扩充了 Quartz 这一工具集，使这一框架更有利。

RMI是一种允行在一个地址空间的对象与别一地址空间的对象进行通行的机制。这两个地址空间可能存在于同一机器上或者根本就在不同的机器上。一般而言，你可以认为 RMI 是一种面向对象的远程过程调用(RPC) 机制。

附properties配置
