# 01、Quartz 源码分析 - 入门
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/9.html
- 分类：作业调度
- 分组：Quartz 源码解析
### 介绍

quartz是一个由java编写的任务调度库。简单来说，其实就是我们在业务中需要使用的定时任务器。

相信很多人可能没有看到过Quartz这个框架，但很多人使用过定时任务业务的人却间接的使用到了。比如，当当网的Elastic-job，又比如Spring中自带的定时任务框架，其实都是对Quartz的一次封装。

### 如何开始学习Quartz框架？

学习一种东西，有一种最通用的理念就是先去使用它。那下面我们就来看如何去使用：(本系列针对的Quartz版本为2.2.*系列)

首先需要添加pom依赖

```java
 <dependencies>
    <!-- quartz 依赖包 -->
    <dependency>
      <groupId>org.quartz-scheduler</groupId>
      <artifactId>quartz</artifactId>
      <version>2.2.1</version>
    </dependency>
  </dependencies>
```

第一步：生成一个需要定时去跑动的任务

```java
package exemple01;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
public class ExempleJob01 implements Job {
  @Override
  public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
    System.out.println("这是定时任务"+ this.getClass().getName());
  }
}
```

第二步：生成任务调度器去定时调度这个任务

```java
package exemple01;
import java.util.Map;
import org.quartz.DateBuilder;
import org.quartz.DateBuilder.IntervalUnit;
import org.quartz.Job;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SchedulerFactory;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.SimpleTrigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
public class Exemple01Schedule {
  /**
   * 计划工厂类
   */
  private static SchedulerFactory schedulerFactory = new StdSchedulerFactory();
  /**
   * 任务名称
   */
  private static String JOB_GROUP_NAME = "job-group-1";
  /**
   * 触发器名称
   */
  private static String TRIGGER_GROUP_NAME = "trigger-group-1";
  /**
   * 增加任务
   * @param jobClass 任务实现类
   * @param jobName 任务名称
   * @param interval 间隔时间
   * @param data 数据
   */
  public static void addJob(Class<? extends Job> jobClass, String jobName, int interval, Map<String, Object> data){
    try {
      //获取任务调度器
      Scheduler scheduler = schedulerFactory.getScheduler();
      //获取任务详细信息
      JobDetail jobDetail = JobBuilder.newJob(jobClass)
          //任务名称和组构成任务key
          .withIdentity(jobName, JOB_GROUP_NAME)
          .build();
      jobDetail.getJobDataMap().putAll(data);
      // 触发器
      SimpleTrigger trigger = TriggerBuilder.newTrigger()
          //触发器key唯一标识
          .withIdentity(jobName, TRIGGER_GROUP_NAME)
          //调度开始时间
          .startAt(DateBuilder.futureDate(1, IntervalUnit.SECOND))
          //调度规则
          .withSchedule(SimpleScheduleBuilder.simpleSchedule()
              .withIntervalInSeconds(interval)
              .repeatForever())
          .build();
      scheduler.scheduleJob(jobDetail, trigger);
      // 启动
      if (!scheduler.isShutdown()) {
        scheduler.start();
      }
    } catch (SchedulerException e) {
      System.out.println(e.getMessage());
    }
  }
}
```

最后一步：任务开始

```java
package exemple01;
import java.util.HashMap;
import java.util.Map;
/**
 * 演示01启动
 * 2018/11/14 编写
 */
public class Exemple01Start {
  public static void main(String[] args) {
    Map<String, Object> map = new HashMap<String, Object>();
    map.put("id", "1");
    Exemple01Schedule.addJob(ExempleJob01.class,"exempleJob01",1,map);
  }
}
```

可以在控制台中看到

```java
17:22:02.593 [DefaultQuartzScheduler_QuartzSchedulerThread] DEBUG org.quartz.simpl.PropertySettingJobFactory - Producing instance of Job 'job-group-1.exempleJob01', class=exemple01.ExempleJob01
17:22:02.594 [DefaultQuartzScheduler_QuartzSchedulerThread] DEBUG org.quartz.core.QuartzSchedulerThread - batch acquisition of 1 triggers
17:22:02.594 [DefaultQuartzScheduler_Worker-6] DEBUG org.quartz.core.JobRunShell - Calling execute on job job-group-1.exempleJob01
这是定时任务exempleJob01
```

到这一个简单的定时任务就完成了。

但是可能有人会说，这样过一遍很绕， 还不是特别的懂， 那是因为是框架在带着你走。 下面分享一下我的学习方式。

### 认识定时任务

定时任务是什么？直白点说，就是一个已经确定好逻辑的任务，在固定的时间点触发。那么我们就可以把从汉语的语句的逻辑抽离出来，对于Quartz框架进行映射，这样会有助于我们理解，自己带节奏去理解，而不是像一个无头苍蝇。

那么从刚刚的描述中，我们可以很快把任务这一名词抽离出来， 不知道大家还记得么，在ExempleJob01类中，我们实现了Quartz框架中的Job，这其实就可以对应起来。下一个，在固定时间点触发，这边其实包含两个逻辑，在固定时间点和触发。分别对应了Exemple01Schedule的SimpleTrigger和Scheduler。这两个具体是干什么的，我之后会慢慢分析。现在，我们只要从逻辑上，理解这个框架是如何工作。

画一个简单的图：

这个图怎么理解呢？

我们以Job为突破口，大家对实现执行逻辑的Job应该会比较好理解，Trigger就相当于时间的触发器，对应Job下一次的触发时间。一个Job为什么可以包含多个Trigger，大家细想一下应该也能理解。最关键的是在于我们的调度器Schedule，包含了Job和Trigger，为什么呢？

因为调度器相当于定时任务的上下文，需要包含所有需要让任务定时跑动起来的属性，所以他必须需要Job和Trigger。
