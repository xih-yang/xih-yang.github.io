# 01、Quartz 实战 - Hello job
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/1.html
- 分类：作业调度
- 分组：教程目录
使用maven构建项目

pom.xml

```java
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>cn.zto.quartz</groupId>
  <artifactId>myquartz</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <packaging>jar</packaging>
  <name>myquartz</name>
  <url>http://maven.apache.org</url>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <dependencies>
  	<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-context</artifactId>
			<version>4.0.6.RELEASE</version>
		</dependency>
		<dependency>
			<groupId>org.quartz-scheduler</groupId>
			<artifactId>quartz</artifactId>
			<version>2.2.1</version>
		</dependency>
		<dependency>
			<groupId>org.quartz-scheduler</groupId>
			<artifactId>quartz-jobs</artifactId>
			<version>2.2.1</version>
		</dependency>
		<dependency>
			<groupId>junit</groupId>
			<artifactId>junit</artifactId>
			<version>3.8.1</version>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>junit</groupId>
			<artifactId>junit</artifactId>
			<version>3.8.1</version>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-context-support</artifactId>
			<version>4.0.6.RELEASE</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-tx</artifactId>
			<version>4.0.6.RELEASE</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-test</artifactId>
			<version>4.0.6.RELEASE</version>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat</groupId>
			<artifactId>annotations-api</artifactId>
			<version>6.0.41</version>
		</dependency>
		<dependency>
			<groupId>mysql</groupId>
			<artifactId>mysql-connector-java</artifactId>
			<version>5.1.30</version>
		</dependency>
  </dependencies>
</project>
```

HelloJob代码：

```java
package cn.zto.job;
import java.util.Date;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class HelloJob
  implements Job
{
  public void execute(JobExecutionContext context)
    throws JobExecutionException
  {
    System.out.println("Hello World! - " + new Date());
  }
}
```

启动Job：

```java
package cn.zto.app;
import java.util.Date;
import org.quartz.DateBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import cn.zto.job.HelloJob;
public class SimpleExample
{
  public void run()
    throws Exception
  {
    System.out.println("------- 初始化 ----------------------");
    //通过工厂获取Scheduler
    Scheduler sched = StdSchedulerFactory.getDefaultScheduler();
    System.out.println("------- 初始化完成 -----------");
    Date runTime = DateBuilder.evenMinuteDate(new Date());
    System.out.println("------- 将Job加入Scheduler中  -------------------");
    //构建一个作业实例
    JobDetail job = JobBuilder.newJob(HelloJob.class).withIdentity("job1", "group1").build();
    //TriggerBuilder实例化一个触发器
    Trigger trigger = TriggerBuilder.newTrigger()//创建一个新的TriggerBuilder用来规范一个触发器
    		.withIdentity("trigger1", "group1")//给触发器一个名字和组名
    		.startAt(runTime)//设置触发开始的时间
    		.build();//产生触发器
    sched.scheduleJob(job, trigger);//向Scheduler添加一个job和trigger
    System.out.println(job.getKey() + " 运行在: " + runTime);
    sched.start();
    System.out.println("------- Scheduler调用结束 -----------------");
    System.out.println("------- 等待5S... -------------");
    try
    {
      Thread.sleep(5000L);
    }
    catch (Exception e)
    {
    }
    System.out.println("------- Scheduler关闭 -----------------");
    sched.shutdown(true);
    System.out.println("------- Scheduler完成 -----------------");
  }
  public static void main(String[] args) throws Exception
  {
    SimpleExample example = new SimpleExample();
    example.run();
  }
}
```
