# 03、Quartz 实战 - cron定义调度周期
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/3.html
- 分类：作业调度
- 分组：教程目录
**cron总结**

cron详解参见：《[quartz CronExpression表达式](https://www.cnblogs.com/yaowen/p/3779284.html)》

CronTrigger配置完整格式为7个： [秒] [分] [小时] [日] [月] [周] [年] ，一般为6个，省去最后那个年。举例："0/20 * * * * ?" 每20秒执行一次，无限期重复

序号
含义
默认
默认值含义
允许填写的值
允许的通配符
 通配符举例

1
秒
*
每秒
0-59
, - * /
0/20 每20秒

2
分
*
每分
0-59
, - * /
 10,20,30 第10、20、30分钟

3
小时
*
每小时
0-23
, - * /
 8-17 上午8点到下午17点

4
日
*
每日
1-31
, - * ? / L W

1,15 月的1号和15号

6L 表示这个月的倒数第6天

"15W"，表示离每月15号最近的那个工作日触发。如果15号正好是周六，则找最近的周五(14号)触发, 如果15号是周未，则找最近的下周一(16号)触发.如果15号正好在工作日(周一至周五)，则就在该天触发。

5
月
*
每月
1-12 or JAN-DEC
, - * /

2,4,6  2月4月和6月

JAN-DEC  1月到12月

6
周
？
每周
1-7 or SUN-SAT
, - * ? / L
 SUN-SAT  星期天到星期六

7
年
非必填

空 或 1970-2099
, - * /

**任务类**

```java
 1 package org.quartz.examples.example3;
 2 
 3 import java.util.Date;
 4 
 5 import org.slf4j.Logger;
 6 import org.slf4j.LoggerFactory;
 7 import org.quartz.Job;
 8 import org.quartz.JobExecutionContext;
 9 import org.quartz.JobExecutionException;
10 import org.quartz.JobKey;
11 
12 /**
13  * 任务job
14  */
15 public class SimpleJob implements Job {
16 
17     private static Logger LOG = LoggerFactory.getLogger(SimpleJob.class);
18 
19     // 必须要有public修饰的无参构造函数
20     public SimpleJob() {
21     }
22 
23     // 任务执行方法
24     public void execute(JobExecutionContext context) throws JobExecutionException {
25         JobKey jobKey = context.getJobDetail().getKey();  //jobKey长这样：group1.job6
26         LOG.info("执行任务。SimpleJob says: " + jobKey + " executing at " + new Date());
27     }
28 
29 }
```

**调度管理类**

```java
  1 package org.quartz.examples.example3;
  2 
  3 import static org.quartz.CronScheduleBuilder.cronSchedule;
  4 import static org.quartz.JobBuilder.newJob;
  5 import static org.quartz.TriggerBuilder.newTrigger;
  6 
  7 import org.quartz.CronTrigger;
  8 import org.quartz.JobDetail;
  9 import org.quartz.Scheduler;
 10 import org.quartz.SchedulerFactory;
 11 import org.quartz.SchedulerMetaData;
 12 import org.quartz.impl.StdSchedulerFactory;
 13 import org.slf4j.Logger;
 14 import org.slf4j.LoggerFactory;
 15 
 16 import java.util.Date;
 17 
 18 /**
 19  * 这个示例将演示使用Cron触发器的Quartz的所有基本调度功能。
 20  * 
 21  */
 22 public class CronTriggerExample {
 23     Logger LOG = LoggerFactory.getLogger(CronTriggerExample.class);
 24 
 25     /*
 26      * 以下用到的cron总结： "0/20 * * * * ?" 每20秒执行一次
 27      */
 28     public void run() throws Exception {
 29         // 初始化一个调度工厂，并实例化一个调度类
 30         SchedulerFactory sf = new StdSchedulerFactory();
 31         Scheduler sched = sf.getScheduler();
 32 
 33         JobDetail job = null;
 34         CronTrigger trigger = null;
 35         Date ft = null;
 36 
 37         // ========================================================
 38         // ============ job1 每20秒执行一次，无限期重复
 39         // ========================================================
 40         job = newJob(SimpleJob.class).withIdentity("job1", "group1").build();
 41         trigger = newTrigger().withIdentity("trigger1", "group1").withSchedule(cronSchedule("0/20 * * * * ?")).build();
 42         ft = sched.scheduleJob(job, trigger);
 43         LOG.info(job.getKey() + " has been scheduled to run at: " + ft + " and repeat based on expression: "
 44                 + trigger.getCronExpression());
 45 
 46         // ========================================================
 47         // ============ job2 将每隔2分钟运行一次(每分钟过后15秒)
 48         // ========================================================
 49         job = newJob(SimpleJob.class).withIdentity("job2", "group1").build();
 50         trigger = newTrigger().withIdentity("trigger2", "group1").withSchedule(cronSchedule("15 0/2 * * * ?")).build();
 51         ft = sched.scheduleJob(job, trigger);
 52         LOG.info(job.getKey() + " has been scheduled to run at: " + ft + " and repeat based on expression: "
 53                 + trigger.getCronExpression());
 54 
 55         // ========================================================
 56         // ============ job3 将每隔一分钟运行一次，但只在上午8点到下午5点之间才运行
 57         // ========================================================
 58         job = newJob(SimpleJob.class).withIdentity("job3", "group1").build();
 59         trigger = newTrigger().withIdentity("trigger3", "group1").withSchedule(cronSchedule("0 0/1 8-17 * * ?"))
 60                 .build();
 61         ft = sched.scheduleJob(job, trigger);
 62         LOG.info(job.getKey() + " has been scheduled to run at: " + ft + " and repeat based on expression: "
 63                 + trigger.getCronExpression());
 64 
 65         // ========================================================
 66         // ============ job4 每三分钟运行一次，但只在下午5点到11点之间运行
 67         // ========================================================
 68         job = newJob(SimpleJob.class).withIdentity("job4", "group1").build();
 69         trigger = newTrigger().withIdentity("trigger4", "group1").withSchedule(cronSchedule("0 0/3 17-23 * * ?"))
 70                 .build();
 71         ft = sched.scheduleJob(job, trigger);
 72         LOG.info(job.getKey() + " has been scheduled to run at: " + ft + " and repeat based on expression: "
 73                 + trigger.getCronExpression());
 74 
 75         // ========================================================
 76         // ============ job5将在每月的第1天和第15天上午10点运行
 77         // ========================================================
 78         job = newJob(SimpleJob.class).withIdentity("job5", "group1").build();
 79         trigger = newTrigger().withIdentity("trigger5", "group1").withSchedule(cronSchedule("0 0 10am 1,15 * ?"))
 80                 .build();
 81         ft = sched.scheduleJob(job, trigger);
 82         LOG.info(job.getKey() + " has been scheduled to run at: " + ft + " and repeat based on expression: "
 83                 + trigger.getCronExpression());
 84 
 85         // ========================================================
 86         // ============ job6 将每30秒运行一次，但仅限于工作日(周一至周五)
 87         // ========================================================
 88         // job 6 will run every 30 seconds but only on Weekdays (Monday through Friday)
 89         job = newJob(SimpleJob.class).withIdentity("job6", "group1").build();
 90         trigger = newTrigger().withIdentity("trigger6", "group1").withSchedule(cronSchedule("0,30 * * ? * MON-FRI"))
 91                 .build();
 92         ft = sched.scheduleJob(job, trigger);
 93         LOG.info(job.getKey() + " has been scheduled to run at: " + ft + " and repeat based on expression: "
 94                 + trigger.getCronExpression());
 95 
 96         // ========================================================
 97         // ============ job7 每30秒运行一次，但只在周末(周六和周日)
 98         // ========================================================
 99         job = newJob(SimpleJob.class).withIdentity("job7", "group1").build();
100         trigger = newTrigger().withIdentity("trigger7", "group1").withSchedule(cronSchedule("0,30 * * ? * SAT,SUN"))
101                 .build();
102         ft = sched.scheduleJob(job, trigger);
103         LOG.info(job.getKey() + " has been scheduled to run at: " + ft + " and repeat based on expression: "
104                 + trigger.getCronExpression());
105 
106         // ====================================================================
107         // ============ 启动调度器
108         // ====================================================================
109         sched.start();
110 
111         try {
112             Thread.sleep(300L * 1000L); // 等待5分钟
113         } catch (Exception e) {
114         }
115
```

/**

　　　　　　　　* 终止调度。

　　　　　　　　* 但是如果当前仍然有任务正在运行中，则会等待该任务执行完毕再终止，期间debug信息会打印：

　　　　　　　　* 21:48:54.965 [main] DEBUG org.quartz.simpl.SimpleThreadPool - Waiting for thread TestScheduler_Worker-1 to shut down

　　　　　　　　*/

```java
116         sched.shutdown(true);
117         // 显示调度器的一些统计信息
118         SchedulerMetaData metaData = sched.getMetaData();
119         LOG.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
120     }
121 
122     public static void main(String[] args) throws Exception {
123         CronTriggerExample example = new CronTriggerExample();
124         example.run();
125     }
126 
127 }
```
