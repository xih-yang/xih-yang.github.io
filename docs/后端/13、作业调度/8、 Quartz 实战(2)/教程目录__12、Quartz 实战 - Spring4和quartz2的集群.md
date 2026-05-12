# 12、Quartz 实战 - Spring4和quartz2的集群
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/12.html
- 分类：作业调度
- 分组：教程目录
使用spring4.0.6 和 quartz 2.2.1 整合进行集群

pom.xml:

```java
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>cn.zto.quartz</groupId>
	<artifactId>quartzClumped</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<packaging>jar</packaging>
	<name>quartzClumped</name>
	<url>http://maven.apache.org</url>
	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
	</properties>
	<dependencies>
		<dependency>
			<groupId>com.alibaba</groupId>
			<artifactId>druid</artifactId>
			<version>1.0.5</version>
		</dependency>
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
			<version>4.11</version>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-context-support</artifactId>
			<version>4.0.6.RELEASE</version>
		</dependency>		
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-jdbc</artifactId>
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

quartz的集群需要在quartz.properties中配置

·org.quartz.jobStore.isClustered

·org.quartz.jobStore.clusterChedkinInterval

通过设置 org.quartz.jobStore.isClustered 属性为 true，你就告诉了 Scheduler 实例要它参与到一个集群当中。这一属性会贯穿于调度框架的始终，用于修改集群环境中操作的默认行为。

org.quartz.jobStore.clusterCheckinInterval 属性定义了Scheduler 实例检入到数据库中的频率(毫秒为单位)。Scheduler 检查是否其他的实例到了它们应当检入的时候未检入；这能指出一个失败的 Scheduler 实例，且当前 Scheduler 会以此来接管任何执行失败并可恢复的 Job。通过检入操作，Scheduler 也会更新自身的状态记录。

clusterChedkinInterval 越小，Scheduler 节点检查失败的 Scheduler 实例就越频繁。默认值是15000 (即15 秒)。

在以前的版本Quartz集群只能依赖于数据库来实现 新版本的 Quartz还可以通过Terracotta实现集群

quartz.properties：

```java
#==============================================================  
#Configure Main Scheduler Properties  
#==============================================================   
org.quartz.scheduler.instanceName = TestScheduler1
org.quartz.scheduler.instanceId = AUTO
#==============================================================  
#Configure ThreadPool  
#==============================================================   
org.quartz.threadPool.class = org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.threadCount = 5
org.quartz.threadPool.threadPriority = 5
#==============================================================  
#Configure JobStore  
#==============================================================   
org.quartz.jobStore.misfireThreshold = 60000
org.quartz.jobStore.class = org.quartz.impl.jdbcjobstore.JobStoreTX
org.quartz.jobStore.tablePrefix = QRTZ_
org.quartz.jobStore.dataSource = myDS
org.quartz.jobStore.isClustered = true
org.quartz.jobStore.clusterCheckinInterval = 15000
#==============================================================  
#Non-Managed Configure Datasource  
#==============================================================   
```

applicationContext.xml：

```java
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:p="http://www.springframework.org/schema/p"
	xmlns:tx="http://www.springframework.org/schema/tx" xmlns:aop="http://www.springframework.org/schema/aop"
	xmlns:context="http://www.springframework.org/schema/context"
	xmlns:task="http://www.springframework.org/schema/task"
	xsi:schemaLocation="
            http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-4.0.xsd
            http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop-4.0.xsd
            http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-4.0.xsd
			http://www.springframework.org/schema/context
           	http://www.springframework.org/schema/context/spring-context-4.0.xsd
           	http://www.springframework.org/schema/task
			http://www.springframework.org/schema/task/spring-task-4.0.xsd">
	<context:annotation-config />
	<bean id="DataSource" class="com.alibaba.druid.pool.DruidDataSource" init-method="init" destroy-method="close">
		<property name="driverClassName" value="com.mysql.jdbc.Driver" />
		<property name="url" value="jdbc:mysql:///quartz" />
		<property name="username" value="root" />
		<property name="password" value="123456" />
		<!-- 连接池最大使用连接数量 -->
		<property name="maxActive" value="5" />
		<!-- 初始化大小 -->
		<property name="initialSize" value="1" />
		<!-- 获取连接最大等待时间 -->
		<property name="maxWait" value="60000" />
		<!-- 连接池最小空闲 -->
		<property name="minIdle" value="2" />
		<!-- 逐出连接的检测时间间隔 -->
		<property name="timeBetweenEvictionRunsMillis" value="3000" />
		<!-- 最小逐出时间 -->
		<property name="minEvictableIdleTimeMillis" value="300000" />
		<!-- 测试有效用的SQL Query -->
		<property name="validationQuery" value="SELECT 'x'" />
		<!-- 连接空闲时测试是否有效 -->
		<property name="testWhileIdle" value="true" />
		<!-- 获取连接时测试是否有效 -->
		<property name="testOnBorrow" value="false" />
		<!-- 归还连接时是否测试有效 -->
		<property name="testOnReturn" value="false" />
	</bean>
	<!-- 声明工厂 -->
	<bean id="scheduler" autowire="no" class="org.springframework.scheduling.quartz.SchedulerFactoryBean">
		<property name="schedulerName" value="TestScheduler1"/>
		<property name="dataSource" ref="DataSource" />
		<property name="configLocation" value="classpath:quartz.properties" />
		<!--applicationContextSchedulerContextKey： 
		是org.springframework.scheduling.quartz.SchedulerFactoryBean这个类中
		把spring上下 文以key/value的方式存放在了quartz的上下文中了，
		可以用applicationContextSchedulerContextKey所定义的key得到对应的spring上下文-->  
		<property name="applicationContextSchedulerContextKey" value="applicationContextKey"/>     
	</bean>
</beans>
```

这里使用的是阿里的druid数据源

数据库建表sql可以在下载下来的quartz-2.x.x\docs\dbTables下面找到

各表的作用和说明

SimpleJob.java

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
public class SimpleJob implements Job {
  public void execute(JobExecutionContext context)
    throws JobExecutionException
  {
	//通过上下文获取
    JobKey jobKey = context.getJobDetail().getKey();
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");  
    System.out.println("集群列子1："+ jobKey + " 在 " + dateFormat.format(new Date())+" 时运行");
  }
}
```

ClumpedExample.java

```java
package cn.zto.example;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Set;
import org.junit.Test;
import org.quartz.DateBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.SimpleTrigger;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;
import org.quartz.impl.matchers.GroupMatcher;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import cn.zto.job.SimpleJob;
public class ClumpedExample {
	public void run () throws SchedulerException {
		ApplicationContext context = new ClassPathXmlApplicationContext("applicationContext.xml");
		System.out.println("集群列子1");
		Scheduler sche = (Scheduler) context.getBean("scheduler");
		//获取正在运行中的Job
		List<JobExecutionContext> executingJobs = sche.getCurrentlyExecutingJobs();
		//获取数据库中的Job
		GroupMatcher<JobKey> jobMatcher = GroupMatcher.anyJobGroup();
		Set<JobKey> jobKeys = sche.getJobKeys(jobMatcher);
		List<JobDetail> jobDetails = new ArrayList<JobDetail>();
		for (JobKey key : jobKeys) {
			jobDetails.add(sche.getJobDetail(key));
		}
		//获取数据库中的Trigger
		GroupMatcher<TriggerKey> TgrMatcher = GroupMatcher.anyTriggerGroup();
		Set<TriggerKey> Keys = sche.getTriggerKeys(TgrMatcher);
		List<Trigger> triggers = new ArrayList<Trigger>();
		for (TriggerKey key : Keys) {
			triggers.add(sche.getTrigger(key));
		}
		//自动获取数据库中触发器和job的信息  然后执行
		sche.start();
		while(true){
		}
	}
	@Test
	public void test() {
		ClumpedExample example = new ClumpedExample();
		try {
			example.run();
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}
}
```

具体详细信息可以查看这本书Quartz Job Scheduling Framework 中文版；
