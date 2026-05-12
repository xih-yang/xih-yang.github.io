# 04、Java 任务调度 - Quartz 入门实战
- 来源：https://ddkk.com/zhuanlan/job/job/1/4.html
- 分类：作业调度
- 分组：教程目录
Quartz 是一个完全由 Java 编写的开源作业调度框架，为在 Java 应用程序中进行作业调度提供了简单却强大的机制。本文主要介绍 Quartz 的基本使用，文中使用到的软件及版本：Java 1.8.0_191、Quartz 2.3.2、SpringBoot 2.4.4、MySQL 5.7。

## 1、Quartz 核心概念

**Job** 表示一个工作，要执行的具体内容。

**JobDetail** 表示一个具体的可执行的调度程序，Job 是这个可执行程调度程序所要执行的内容，另外 JobDetail 还包含了这个任务调度的方案和策略。一个 JobDetail 可对应多个 Trigger。

**Trigger** 代表一个调度参数的配置，什么时候去调。一个 Trigger 对应 一个 JobDetail。

**Scheduler** 代表一个调度容器，一个调度容器中可以注册多个 JobDetail 和 Trigger。当 Trigger 与 JobDetail 组合，就可以被 Scheduler 容器调度了。

## 2、Quartz 常用配置

### 2.1、Quartz 主配置

**1、****org.quartz.scheduler.instanceName**scheduler实例名称，默认值为'QuartzScheduler'；

**2、****org.quartz.scheduler.instanceId**scheduler实例Id，必须唯一；启用集群可设为'AUTO'，默认值为'NON_CLUSTERED'；

**3、****org.quartz.scheduler.threadName**线程名称，默认值为instanceName+'_QuartzSchedulerThread'；

**4、****org.quartz.scheduler.makeSchedulerThreadDaemon**调度程序的主线程是否设为守护线程，默认值为false；

**5、****org.quartz.scheduler.batchTriggerAcquisitionMaxCount**调度节点一次获取触发器的最大数量，默认为1；

### 2.2、ThreadPool 配置

**1、****org.quartz.threadPool.class**ThreadPool实现的类名，默认值为'org.quartz.simpl.SimpleThreadPool'；

**2、****org.quartz.threadPool.threadCount**线程数，默认值为10；

**3、****org.quartz.threadPool.threadPriority**线程优先级，默认值5；

**4、****org.quartz.threadPool.makeThreadsDaemons**执行任务的线程是否设为守护线程，默认为false；

### 2.3、JobStore 配置

**org.quartz.jobStore.class** 任务存储实现类名，可设为 org.quartz.simpl.RAMJobStore、org.quartz.impl.jdbcjobstore.JobStoreTX(quartz管理事务)、org.quartz.impl.jdbcjobstore.JobStoreCMT(应用程序管理事务)、org.terracotta.quartz.TerracottaJobStore；当设置为jdbc存储时，有以下属性可以调整设置：

**1、****org.quartz.jobStore.driverDelegateClass**驱动代理类，可设置为标准的jdbc驱动程序：org.quartz.impl.jdbcjobstore.StdJDBCDelegate；

**2、****org.quartz.jobStore.dataSource**数据源名称；

**3、****org.quartz.jobStore.tablePrefix**JDBCJobStore的表前缀;如果使用不同的表前缀，则可以在同一数据库中拥有多组Quartz表；默认值'QRTZ_'；

**4、****org.quartz.jobStore.useProperties**指示JobDataMaps中的所有值都将是字符串，避免了将非String类序列化为BLOB时可能产生的类版本控制问题；

**5、****org.quartz.jobStore.isClustered**是否开启集群，如果有多个Quartz实例使用同一组数据库表，则此属性必须设置为true，默认值为false；

**6、****org.quartz.jobStore.clusterCheckinInterval**设置此实例检入与群集的其他实例的频率（以毫秒为单位），默认值为15000；

**7、****org.quartz.jobStore.acquireTriggersWithinLock**获取触发器时是否添加数据库锁，如果org.quartz.scheduler.batchTriggerAcquisitionMaxCount>1，必须设为true；默认为false；

**8、****org.quartz.jobStore.misfireThreshold**触发器超时触发的阈值，超过该值(有空闲线程能执行任务的实际时间-任务应该被执行的时间)将不会触发任务的执行；单位为毫秒，默认为60000；

### 2.4、DataSource 配置

**1、****org.quartz.dataSource.NAME.driver**JDBC驱动程序；

**2、****org.quartz.dataSource.NAME.URL**JDBCURL；

**3、****org.quartz.dataSource.NAME.user**数据库用户名；

**4、****org.quartz.dataSource.NAME.password**数据库密码；

**5、****org.quartz.dataSource.NAME.maxConnections**最大连接数，默认值10；

**6、****org.quartz.dataSource.NAME.validationQuery**验证sql；

**7、****org.quartz.dataSource.NAME.idleConnectionValidationSeconds**空闲连接检测间隔，默认值50；

**8、****org.quartz.dataSource.NAME.validateOnCheckout**获取连接后是否验证连接，默认值false；

**9、****org.quartz.dataSource.NAME.discardIdleConnectionsSeconds**空闲连接多长时间后丢弃该连接，0表示禁用该功能，默认值为0；

或者使用容器提供的数据源：

**1、****org.quartz.dataSource.NAME.jndiURL**数据源的jndi；

**2、****org.quartz.dataSource.NAME.java.naming.security.principal**jndi需要的用户名；

**3、****org.quartz.dataSource.NAME.java.naming.security.credentials**jndi需要的密码；

## 3、Quartz JDBCJobStore表说明

表名
说明

qrtz_blob_triggers
存储自定义 trigger 实例

qrtz_calendars
存储 Calendar 信息

qrtz_cron_triggers
存储 CronTrigger 实例信息

qrtz_fired_triggers
存储正在触发的 Trigger 相关的状态信息

qrtz_job_details
存储 JobDetail 信息

qrtz_locks
存储行锁

qrtz_paused_trigger_grps
存储暂停的 Trigger 的信息

qrtz_scheduler_state
存储 Scheduler 的状态信息

qrtz_simple_triggers
存储 SimpleTrigger 实例信息

qrtz_simprop_triggers
存储 CalendarIntervalTrigger 和 DailyTimeIntervalTrigger 实例信息

qrtz_triggers
存储所有的 trigger 及关联的 job 信息

在quartz jar 包的 org.quartz.impl.jdbcjobstore 目录下可以找到对应数据库的执行基本：

## 3、Quartz 单独使用

### 3.1、引入依赖

```java
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
<!-- quartz 默认使用 c3p0 连接池-->
<dependency>
    <groupId>com.mchange</groupId>
    <artifactId>c3p0</artifactId>
    <version>0.9.5.5</version>
</dependency>
```

### 3.2、quartz.properties

#### 3.2.1、任务相关数据放在内存中

```java
org.quartz.scheduler.instanceName = MyScheduler
org.quartz.threadPool.threadCount = 3
org.quartz.jobStore.class = org.quartz.simpl.RAMJobStore
```

#### 3.2.2、任务相关数据放到数据库

```java
org.quartz.scheduler.instanceName = MyScheduler
org.quartz.scheduler.instanceId = AUTO
org.quartz.threadPool.threadCount = 3
org.quartz.jobStore.class = org.quartz.impl.jdbcjobstore.JobStoreTX
org.quartz.jobStore.driverDelegateClass = org.quartz.impl.jdbcjobstore.StdJDBCDelegate
org.quartz.jobStore.dataSource = myDS
org.quartz.jobStore.tablePrefix = qrtz_
org.quartz.jobStore.isClustered = true
org.quartz.jobStore.useProperties = true
org.quartz.dataSource.myDS.driver = com.mysql.cj.jdbc.Driver
org.quartz.dataSource.myDS.URL = jdbc:mysql://10.49.196.10:3306/itest?useUnicode=true&characterEncoding=UTF-8
org.quartz.dataSource.myDS.user = root
org.quartz.dataSource.myDS.password = 123456
org.quartz.dataSource.myDS.maxConnections = 5
```

### 3.3、使用例子

```java
package com.abc.demo.quartz;
import org.quartz.*;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * quartz使用例子
 */
public class TestJob implements Job {
    private static Logger logger = LoggerFactory.getLogger(TestJob.class);
    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        logger.info("JobKey={}", context.getJobDetail().getKey());
        logger.info("TriggerKey={}", context.getTrigger().getKey());
        logger.info("jkey2={}", context.getJobDetail().getJobDataMap().get("jkey2"));
        logger.info("jkey1={}", context.getJobDetail().getJobDataMap().get("jkey1"));
        logger.info("jkey2={}", context.getJobDetail().getJobDataMap().get("jkey2"));
        logger.info("tkey1={}", context.getTrigger().getJobDataMap().get("tkey1"));
        logger.info("tkey2={}", context.getTrigger().getJobDataMap().get("tkey2"));
        try {
            logger.info("ckey={}", context.getScheduler().getContext().get("ckey"));
        } catch (SchedulerException e) {
            e.printStackTrace();
        }
        logger.info("----------------");
    }
    public static void main(String[] args) throws Exception {
        //创建一个scheduler
        Scheduler scheduler = StdSchedulerFactory.getDefaultScheduler();
        scheduler.getContext().put("ckey", "cvalue");
        //创建一个job
        JobDetail jobDetail = JobBuilder.newJob(TestJob.class)
                //设置job相关数据
                .usingJobData("jkey1", "jvalue1")
                .withIdentity("job1", "group2")
                .storeDurably()
                .build();
        jobDetail.getJobDataMap().put("jkey2", "jvalue2");
        //创建一个Trigger
        Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("trigger1", "group1")
                //设置Trigger相关数据
                .usingJobData("tkey1", "tvalue1")
                //延迟5s开始执行
                .startAt(DateBuilder.futureDate(3, DateBuilder.IntervalUnit.SECOND))
                //每隔5s执行一次，重复无数次
                //.withSchedule(SimpleScheduleBuilder.simpleSchedule().withIntervalInSeconds(5).repeatForever())
                .withSchedule(CronScheduleBuilder.cronSchedule("0/5 * * * * ?"))
                //下一个整的分钟停止
                .endAt(DateBuilder.evenMinuteDate(null))
                .forJob(jobDetail)
                .build();
        trigger.getJobDataMap().put("tkey2", "tvalue2");
        //scheduler.addJob(jobDetail, true);
        //注册trigger
        scheduler.scheduleJob(jobDetail, trigger);
        //启动scheduler
        scheduler.start();
        Thread.sleep(1000 * 100);
        //停止diao调度
        scheduler.shutdown();
    }
}
```

## 4、Spring Boot 中使用 Quartz

### 4.1、引入依赖

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
</dependency>
```

### 4.2、application.yml

#### 4.2.1、任务相关数据放在内存中

```java
spring:
    quartz:
       job-store-type: memory
```

#### 4.2.2、任务相关数据放在数据库

```java
spring:
  datasource:
    druid:
      primary:
        driverClassName: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://10.49.196.10:3306/itest?useUnicode=true&characterEncoding=UTF-8
        username: root
        password: 123456
        initialSize: 2
        minIdle: 2
        maxActive: 10
        validationQuery: SELECT 1
        testWhileIdle: true
        testOnBorrow: true
        testOnReturn: false
        maxWait: 6000
        filters: wall,stat,slf4j
  quartz:
    job-store-type: jdbc
    properties:
      org:
        quartz:
          scheduler:
            instanceName: myScheduler
            instanceId: AUTO
          threadPool:
            class: org.quartz.simpl.SimpleThreadPool
            threadCount: 10
          jobStore:
            class: org.quartz.impl.jdbcjobstore.JobStoreTX
            driverDelegateClass: org.quartz.impl.jdbcjobstore.StdJDBCDelegate
            tablePrefix: QRTZ_
            isClustered: true
            clusterCheckinInterval: 15000
            useProperties: true
```

### 4.3、数据源配置（任务相关数据放数据库时需要）

```java
package com.abc.demo.config;
import com.alibaba.druid.spring.boot.autoconfigure.DruidDataSourceBuilder;
import org.springframework.boot.autoconfigure.quartz.QuartzDataSource;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import javax.sql.DataSource;
@Configuration
public class DataSourceConfig {
    @Primary
    @Bean
    @QuartzDataSource
    @ConfigurationProperties(prefix="spring.datasource.druid.primary")
    public DataSource dataSource() {
        return DruidDataSourceBuilder.create().build();
    }
}
```

### 4.4、定义Job

DemoJob:

```java
package com.abc.demo.quartz;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.quartz.QuartzJobBean;
@DisallowConcurrentExecution
public class DemoJob extends QuartzJobBean {
    private static Logger logger = LoggerFactory.getLogger(DemoJob.class);
    /**业务参数*/
    private String businessParam;
    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        logger.info("hello quartz。businessParam={}", businessParam);
    }
    public void setBusinessParam(String businessParam) {
        this.businessParam = businessParam;
    }
}
```

InvokeJob，通用的 Job，利用反射执行某个类的某个方法：

```java
package com.abc.demo.quartz;
import com.abc.demo.util.SpringContext;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.scheduling.quartz.QuartzJobBean;
import java.lang.reflect.Method;
/**
 * 执行某个类的某个方法，适用于无参数方法
 */
@DisallowConcurrentExecution
public class InvokeJob extends QuartzJobBean {
    private String className;
    private String methodName;
    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        try {
            Object object = SpringContext.getBean(Class.forName(className));
            Method method = object.getClass().getMethod(methodName);
            method.invoke(object);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public void setClassName(String className) {
        this.className = className;
    }
    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }
}
```

用到的SpringContext.java:

```java
package com.abc.demo.util;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;
/**
 * spring上下文
 */
@Component
public class SpringContext implements ApplicationContextAware {
    protected static ApplicationContext context;
    @Override
    public void setApplicationContext(ApplicationContext context)
            throws BeansException {
        SpringContext.context = context;
    }
    public static ApplicationContext getContext() {
        return context;
    }
    public static Object getBean(String beanId) {
        return context.getBean(beanId);
    }
    public static <T> T getBean(Class<T> c) {
        return context.getBean(c);
    }
    public static <T> T getBean(String name, Class<T> c) {
        return context.getBean(name, c);
    }
}
```

SpringContext.java

### 4.5、定义需要利用反射执行的方法

这里定义一个 Service，利用反射来执行该 Service 中的方法。

```java
package com.abc.demo.quartz;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
@Service
public class MyService {
    private static Logger logger = LoggerFactory.getLogger(MyService.class);
    public void test() {
        logger.info("test");
    }
    public void test2() {
        logger.info("test2");
    }
}
```

### 4.6、应用启动时任务初始化

```java
package com.abc.demo.runner;
import com.abc.demo.entity.DemoTaskConfig;
import com.abc.demo.entity.InvokeTaskConfig;
import com.abc.demo.quartz.DemoJob;
import com.abc.demo.quartz.InvokeJob;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;
/**
 * 应用启动后，初始化任务
 */
@Component
public class QuartzRunner implements CommandLineRunner {
    @Autowired
    private Scheduler scheduler;
    /**模拟数据库中DemoJob的配置数据*/
    private Map<Integer, DemoTaskConfig> demoTaskConfigs = new HashMap() {{
        put(1, new DemoTaskConfig(1, "业务1", "0/3 * * * * ?", "demoJob1", "demoGroup", "demoTrigger1", "demoGroup"));
        put(2, new DemoTaskConfig(2, "业务2", "0/4 * * * * ?", "demoJob2", "demoGroup", "demoTrigger2", "demoGroup"));
    }};
    /**模拟数据库中InvokeJob的配置数据*/
    private Map<Integer, InvokeTaskConfig> invokeTaskConfigs = new HashMap() {{
        put(1, new InvokeTaskConfig(1, "com.abc.demo.quartz.MyService", "test","0/5 * * * * ?", "myJob1", "myGroup", "myTrigger1", "myGroup"));
        put(2, new InvokeTaskConfig(2, "com.abc.demo.quartz.MyService", "test2", "0/6 * * * * ?", "myJob2", "myGroup", "myTrigger2", "myGroup"));
    }};
    @Override
    public void run(String... args) throws Exception {
        for (DemoTaskConfig demoTaskConfig : demoTaskConfigs.values()) {
            JobKey jobKey = new JobKey(demoTaskConfig.getJobName(), demoTaskConfig.getJobGroup());
            JobDetail jobDetail = JobBuilder.newJob(DemoJob.class)
                    .withIdentity(jobKey)
                    .usingJobData("businessParam", demoTaskConfig.getBusinessParam())
                    .build();
            TriggerKey triggerKey = new TriggerKey(demoTaskConfig.getTriggerName(), demoTaskConfig.getTriggerGroup());
            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity(triggerKey)
                    .withSchedule(CronScheduleBuilder.cronSchedule(demoTaskConfig.getCron()).withMisfireHandlingInstructionDoNothing())
                    .forJob(jobDetail)
                    .build();
            JobDetail jobDetailOld = scheduler.getJobDetail(jobKey);
            Trigger triggerOld = scheduler.getTrigger(triggerKey);
            if (triggerOld != null) {
                scheduler.rescheduleJob(triggerKey, trigger);
            } else {
                if (jobDetailOld == null) {
                    scheduler.scheduleJob(jobDetail, trigger);
                } else {
                    scheduler.scheduleJob(trigger);
                }
            }
        }
        for (InvokeTaskConfig quartzTaskConfig : invokeTaskConfigs.values()) {
            JobKey jobKey = new JobKey(quartzTaskConfig.getJobName(), quartzTaskConfig.getJobGroup());
            JobDetail jobDetail = JobBuilder.newJob(InvokeJob.class)
                    .withIdentity(jobKey)
                    .usingJobData("className", quartzTaskConfig.getClassName())
                    .usingJobData("methodName", quartzTaskConfig.getMethodName())
                    .build();
            TriggerKey triggerKey = new TriggerKey(quartzTaskConfig.getTriggerName(), quartzTaskConfig.getTriggerGroup());
            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity(triggerKey)
                    .withSchedule(CronScheduleBuilder.cronSchedule(quartzTaskConfig.getCron()).withMisfireHandlingInstructionDoNothing())
                    .forJob(jobDetail)
                    .build();
            JobDetail jobDetailOld = scheduler.getJobDetail(jobKey);
            Trigger triggerOld = scheduler.getTrigger(triggerKey);
            if (triggerOld != null) {
                scheduler.rescheduleJob(triggerKey, trigger);
            } else {
                if (jobDetailOld == null) {
                    scheduler.scheduleJob(jobDetail, trigger);
                } else {
                    scheduler.scheduleJob(trigger);
                }
            }
        }
    }
}
```

## 5、Quartz 集群

当org.quartz.jobStore.class = org.quartz.impl.jdbcjobstore.JobStoreTX，可以启用集群功能部署多个实例：

```java
org.quartz.jobStore.isClustered = true
```

如果实例部署在多台机器上，机器之间需要需要有时间同步，需要保证机器间的时间误差不超过 1 秒；可参考官网说明：[https://github.com/quartz-scheduler/quartz/blob/master/docs/configuration.adoc#configuration-of-database-clustering-achieve-fail-over-and-load-balancing-with-jdbc-jobstore](https://github.com/quartz-scheduler/quartz/blob/master/docs/configuration.adoc#configuration-of-database-clustering-achieve-fail-over-and-load-balancing-with-jdbc-jobstore)。
