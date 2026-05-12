# 31、Spring Boot 4 整合 Quartz 完整教程
- 来源：https://ddkk.com/springboot/4-action/31.html
- 分类：Spring Boot 4 整合教程
- 分组：七、任务调度
- 日期：2025-12-08
做后台系统的时候,最烦的就是定时任务调度,用Spring自带的@Scheduled吧,功能太简单,不支持持久化,应用重启任务就没了;用Timer吧,功能单一,不支持复杂调度;后来听说Quartz这玩意儿不错,是Java领域最成熟的任务调度框架,支持Cron表达式、任务持久化、集群部署、监听器、插件扩展,功能贼强大;但是直接用Quartz写,那叫一个复杂,Job、Trigger、Scheduler、JobStore,一堆概念搞得人头大;后来发现Spring Boot直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合Quartz更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Quartz的。

其实Quartz在Spring Boot里早就支持了,你只要加个`spring-boot-starter-quartz`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置JobStore、持久化、集群、监听器这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Quartz基础概念

### Quartz是啥玩意儿

Quartz是OpenSymphony开源的一个功能强大的任务调度框架,用于在Java应用中执行定时任务;Quartz的核心特性包括:

1. **灵活的任务调度**: 支持Cron表达式、简单触发、日历触发等多种调度方式
2. **任务持久化**: 支持内存存储(RAMJobStore)和数据库存储(JDBCJobStore),任务不会因为应用重启而丢失
3. **集群支持**: 支持多节点部署,任务自动负载均衡,避免重复执行
4. **监听器和插件**: 支持任务执行前后监听、触发器监听、插件扩展
5. **事务支持**: 支持JTA事务,可以和其他事务一起管理
6. **动态管理**: 支持动态添加、删除、暂停、恢复任务

### Quartz的核心概念

1. **Job(任务)**: 要执行的具体工作,实现`Job`接口,定义`execute`方法
2. **JobDetail(任务详情)**: Job的元数据,包含Job类、Job名称、组名、参数等
3. **Trigger(触发器)**: 定义Job何时执行,支持SimpleTrigger(简单触发)和CronTrigger(Cron表达式触发)
4. **Scheduler(调度器)**: Quartz的核心,负责调度Job的执行
5. **JobStore(任务存储)**: 存储Job和Trigger的信息,支持内存存储和数据库存储
6. **JobDataMap(任务数据映射)**: 用于在Job执行时传递参数

### Quartz的JobStore类型

1. **RAMJobStore**: 内存存储,速度快但数据不持久化,应用重启后任务丢失
2. **JobStoreTX**: JDBC存储,使用JDBC事务管理,适合独立应用
3. **JobStoreCMT**: JDBC存储,使用容器管理事务(JTA),适合EJB或J2EE环境

### Quartz和Spring Task的区别

1. **功能**: Quartz功能更全面,支持持久化、集群、监听器;Spring Task只支持简单调度
2. **持久化**: Quartz支持数据库持久化;Spring Task不支持
3. **集群**: Quartz支持集群部署;Spring Task不支持
4. **灵活性**: Quartz支持Cron表达式、复杂调度;Spring Task功能相对简单

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-quartz-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── job/                      # Job目录
│   │   │               ├── config/                   # 配置类目录
│   │   │               └── controller/               # 控制器目录
│   │   └── resources/
│   │       ├── application.yml       # 配置文件
│   │       └── quartz.sql           # Quartz数据库脚本(可选)
│   └── test/
└── README.md
```

### 添加Maven依赖

在`pom.xml`中添加Spring Boot 4和Quartz的依赖:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-quartz-demo</artifactId>
    <version>1.0.0</version>
    <name>Spring Boot Quartz Demo</name>
    <properties>
        <java.version>21</java.version>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Boot Quartz Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-quartz</artifactId>
        </dependency>
        <!-- Spring Boot Actuator(可选,用于监控) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- MySQL驱动(如果使用JDBC JobStore) -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <!-- H2数据库(开发测试用,可选) -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <!-- Lombok(可选,简化代码) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Spring Boot Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

## 基础配置(内存模式)

### application.yml配置

最简单的配置就是使用内存模式(RAMJobStore),适合开发测试环境:

```yaml
spring:
  application:
    name: spring-boot-quartz-demo
  # Quartz配置
  quartz:
    # JobStore类型: memory(内存)或jdbc(数据库)
    job-store-type: memory
    # 调度器名称
    scheduler-name: MyScheduler
    # 是否自动启动
    auto-startup: true
    # 启动延迟时间(秒)
    startup-delay: 0s
    # 关闭时是否等待任务完成
    wait-for-jobs-to-complete-on-shutdown: false
    # 是否覆盖已存在的任务
    overwrite-existing-jobs: false
    # 自定义属性(可选)
    properties:
      org.quartz.threadPool.threadCount: 10  # 线程池大小
      org.quartz.threadPool.threadPriority: 5  # 线程优先级
```

### application.properties配置

如果喜欢用properties格式:

```properties
# Quartz配置
spring.quartz.job-store-type=memory
spring.quartz.scheduler-name=MyScheduler
spring.quartz.auto-startup=true
spring.quartz.startup-delay=0s
spring.quartz.wait-for-jobs-to-complete-on-shutdown=false
spring.quartz.overwrite-existing-jobs=false
# 线程池配置
spring.quartz.properties.org.quartz.threadPool.threadCount=10
spring.quartz.properties.org.quartz.threadPool.threadPriority=5
```

## 创建Job和Trigger

### 创建简单的Job

首先创建一个简单的Job,实现`Job`接口:

```java
package com.example.demo.job;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
/**
 * 简单的定时任务示例
 * 实现Job接口,定义execute方法执行具体任务
 * 
 * @author penglei
 */
@Slf4j
public class SimpleJob implements Job {
    /**
     * 任务执行方法
     * Quartz会调用这个方法执行任务
     * 
     * @param context Job执行上下文,包含JobDetail、Trigger等信息
     * @throws JobExecutionException 任务执行异常
     */
    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        // 获取JobDetail中的参数
        String jobName = context.getJobDetail().getKey().getName();  // 获取任务名称
        String jobGroup = context.getJobDetail().getKey().getGroup();  // 获取任务组名
        // 获取JobDataMap中的参数
        String message = context.getJobDetail().getJobDataMap().getString("message");  // 获取自定义参数
        log.info("执行任务: {}.{}, 参数: {}", jobGroup, jobName, message);
        log.info("执行时间: {}", System.currentTimeMillis());
        // 这里写你的业务逻辑
        try {
            // 模拟业务处理
            Thread.sleep(1000);
            log.info("任务执行完成");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new JobExecutionException("任务执行被中断", e);
        }
    }
}
```

### 使用Spring Bean的Job

如果Job需要注入Spring Bean,可以使用`@DisallowConcurrentExecution`和`@PersistJobDataAfterExecution`注解:

```java
package com.example.demo.job;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.PersistJobDataAfterExecution;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;
/**
 * 使用Spring Bean的Job
 * 继承QuartzJobBean,可以注入Spring Bean
 * 
 * @author penglei
 */
@Slf4j
@Component
@PersistJobDataAfterExecution  // 执行后持久化JobDataMap
public class SpringBeanJob extends QuartzJobBean {
    /**
     * 可以注入Spring Bean
     */
    // @Autowired
    // private UserService userService;
    /**
     * 执行任务
     * 
     * @param context Job执行上下文
     * @throws JobExecutionException 任务执行异常
     */
    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        String jobName = context.getJobDetail().getKey().getName();
        log.info("Spring Bean Job执行: {}", jobName);
        // 可以使用注入的Spring Bean
        // userService.doSomething();
    }
}
```

### 配置Job和Trigger

使用`@Configuration`配置Job和Trigger:

```java
package com.example.demo.config;
import com.example.demo.job.SimpleJob;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * Quartz配置类
 * 配置Job和Trigger
 * 
 * @author penglei
 */
@Slf4j
@Configuration
public class QuartzConfig {
    /**
     * 配置SimpleJob的JobDetail
     * JobDetail包含Job的元数据信息
     * 
     * @return JobDetail对象
     */
    @Bean
    public JobDetail simpleJobDetail() {
        return JobBuilder.newJob(SimpleJob.class)  // 指定Job类
                .withIdentity("simpleJob", "default")  // 任务名称和组名
                .withDescription("简单的定时任务")  // 任务描述
                .storeDurably()  // 即使没有Trigger关联也保留Job
                .usingJobData("message", "Hello Quartz")  // 设置JobDataMap参数
                .build();
    }
    /**
     * 配置SimpleTrigger
     * SimpleTrigger用于简单的定时触发,比如每5秒执行一次
     * 
     * @return Trigger对象
     */
    @Bean
    public Trigger simpleTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(simpleJobDetail())  // 关联JobDetail
                .withIdentity("simpleTrigger", "default")  // 触发器名称和组名
                .withDescription("简单触发器")  // 触发器描述
                .startNow()  // 立即开始
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInSeconds(5)  // 每5秒执行一次
                        .repeatForever())  // 无限重复
                .build();
    }
    /**
     * 配置CronTrigger
     * CronTrigger用于复杂的定时触发,支持Cron表达式
     * 
     * @return Trigger对象
     */
    @Bean
    public Trigger cronTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(simpleJobDetail())  // 关联JobDetail
                .withIdentity("cronTrigger", "default")  // 触发器名称和组名
                .withDescription("Cron触发器")  // 触发器描述
                .withSchedule(CronScheduleBuilder.cronSchedule("0/10 * * * * ?"))  // 每10秒执行一次
                .build();
    }
}
```

### Cron表达式说明

Cron表达式用于定义任务执行时间,格式为:`秒 分 时 日 月 周 [年]`

```plaintext
字段        允许值          允许的特殊字符
秒          0-59            , - * /
分          0-59            , - * /
时          0-23            , - * /
日          1-31            , - * ? / L W
月          1-12 或 JAN-DEC , - * /
周          0-7 或 SUN-SAT  , - * ? / L #
年(可选)    1970-2099       , - * /
```

常用Cron表达式示例:

```plaintext
0 0 12 * * ?         每天12点执行
0 0 12 * * ?         每天12点执行
0 15 10 ? * *        每天10点15分执行
0 15 10 * * ?        每天10点15分执行
0 15 10 * * ? *      每天10点15分执行
0 15 10 * * ? 2005   2005年每天10点15分执行
0 * 14 * * ?         每天14点到14点59分,每分钟执行一次
0 0/5 14 * * ?       每天14点到14点55分,每5分钟执行一次
0 0/5 14,18 * * ?    每天14点到14点55分和18点到18点55分,每5分钟执行一次
0 0-5 14 * * ?       每天14点到14点05分,每分钟执行一次
0 10,44 14 ? 3 WED   3月每周三14点10分和14点44分执行
0 15 10 ? * MON-FRI  周一到周五10点15分执行
0 15 10 15 * ?       每月15号10点15分执行
0 15 10 L * ?        每月最后一天10点15分执行
0 15 10 ? * 6L       每月最后一个周五10点15分执行
0 15 10 ? * 6L 2002-2005  2002到2005年每月最后一个周五10点15分执行
0 15 10 ? * 6#3      每月第三个周五10点15分执行
0 0 12 1/5 * ?       每月1号开始,每5天12点执行
0 11 11 11 11 ?      每年11月11号11点11分执行
```

## JDBC模式配置(持久化)

### 数据库初始化

如果使用JDBC JobStore,需要先初始化Quartz数据库表;Spring Boot会自动执行初始化脚本,你只需要配置数据源:

```yaml
spring:
  # 数据源配置
  datasource:
    url: jdbc:mysql://localhost:3306/quartz?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
  # Quartz JDBC配置
  quartz:
    job-store-type: jdbc  # 使用JDBC存储
    # JDBC配置
    jdbc:
      # 是否初始化数据库表
      initialize-schema: always  # always(总是初始化),embedded(嵌入式数据库),never(不初始化)
      # 数据库平台(可选,Spring Boot会自动检测)
      platform: mysql
    # 调度器配置
    scheduler-name: MyScheduler
    auto-startup: true
    startup-delay: 0s
    wait-for-jobs-to-complete-on-shutdown: false
    overwrite-existing-jobs: false
    # 自定义属性
    properties:
      # 线程池配置
      org.quartz.threadPool.threadCount: 10
      org.quartz.threadPool.threadPriority: 5
      org.quartz.threadPool.class: org.quartz.simpl.SimpleThreadPool
      # JobStore配置
      org.quartz.jobStore.class: org.quartz.impl.jdbcjobstore.JobStoreTX
      org.quartz.jobStore.driverDelegateClass: org.quartz.impl.jdbcjobstore.StdJDBCDelegate
      org.quartz.jobStore.tablePrefix: QRTZ_  # 表前缀
      org.quartz.jobStore.isClustered: false  # 是否集群模式
      org.quartz.jobStore.clusterCheckinInterval: 20000  # 集群检查间隔(毫秒)
      org.quartz.jobStore.maxMisfiresToHandleAtATime: 1  # 最大错过触发数
      org.quartz.jobStore.misfireThreshold: 120000  # 错过触发阈值(毫秒)
      org.quartz.jobStore.txIsolationLevelSerializable: false  # 事务隔离级别
```

### 手动初始化数据库

如果Spring Boot没有自动初始化,可以手动执行Quartz数据库脚本;脚本位置在Quartz的jar包中:`org/quartz/impl/jdbcjobstore/tables_mysql.sql`

创建数据库和表:

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS quartz DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quartz;
-- Quartz表结构(MySQL版本)
-- 这些表用于存储Job、Trigger、调度信息等
-- 调度器状态表
CREATE TABLE QRTZ_LOCKS (
  SCHED_NAME VARCHAR(120) NOT NULL,
  LOCK_NAME VARCHAR(40) NOT NULL,
  PRIMARY KEY (SCHED_NAME,LOCK_NAME)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 触发器表
CREATE TABLE QRTZ_TRIGGERS (
  SCHED_NAME VARCHAR(120) NOT NULL,
  TRIGGER_NAME VARCHAR(200) NOT NULL,
  TRIGGER_GROUP VARCHAR(200) NOT NULL,
  JOB_NAME VARCHAR(200) NOT NULL,
  JOB_GROUP VARCHAR(200) NOT NULL,
  DESCRIPTION VARCHAR(250) NULL,
  NEXT_FIRE_TIME BIGINT(13) NULL,
  PREV_FIRE_TIME BIGINT(13) NULL,
  PRIORITY INTEGER NULL,
  TRIGGER_STATE VARCHAR(16) NOT NULL,
  TRIGGER_TYPE VARCHAR(8) NOT NULL,
  START_TIME BIGINT(13) NOT NULL,
  END_TIME BIGINT(13) NULL,
  CALENDAR_NAME VARCHAR(200) NULL,
  MISFIRE_INSTR SMALLINT(2) NULL,
  JOB_DATA BLOB NULL,
  PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
  FOREIGN KEY (SCHED_NAME,JOB_NAME,JOB_GROUP)
  REFERENCES QRTZ_JOB_DETAILS(SCHED_NAME,JOB_NAME,JOB_GROUP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 简单触发器表
CREATE TABLE QRTZ_SIMPLE_TRIGGERS (
  SCHED_NAME VARCHAR(120) NOT NULL,
  TRIGGER_NAME VARCHAR(200) NOT NULL,
  TRIGGER_GROUP VARCHAR(200) NOT NULL,
  REPEAT_COUNT BIGINT(7) NOT NULL,
  REPEAT_INTERVAL BIGINT(12) NOT NULL,
  TIMES_TRIGGERED BIGINT(10) NOT NULL,
  PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
  FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
  REFERENCES QRTZ_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Cron触发器表
CREATE TABLE QRTZ_CRON_TRIGGERS (
  SCHED_NAME VARCHAR(120) NOT NULL,
  TRIGGER_NAME VARCHAR(200) NOT NULL,
  TRIGGER_GROUP VARCHAR(200) NOT NULL,
  CRON_EXPRESSION VARCHAR(120) NOT NULL,
  TIME_ZONE_ID VARCHAR(80),
  PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
  FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
  REFERENCES QRTZ_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Blob触发器表(用于存储序列化的Trigger)
CREATE TABLE QRTZ_BLOB_TRIGGERS (
  SCHED_NAME VARCHAR(120) NOT NULL,
  TRIGGER_NAME VARCHAR(200) NOT NULL,
  TRIGGER_GROUP VARCHAR(200) NOT NULL,
  BLOB_DATA BLOB NULL,
  PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
  FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
  REFERENCES QRTZ_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 日历表
CREATE TABLE QRTZ_CALENDARS (
  SCHED_NAME VARCHAR(120) NOT NULL,
  CALENDAR_NAME VARCHAR(200) NOT NULL,
  CALENDAR BLOB NOT NULL,
  PRIMARY KEY (SCHED_NAME,CALENDAR_NAME)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 暂停触发器表
CREATE TABLE QRTZ_PAUSED_TRIGGER_GRPS (
  SCHED_NAME VARCHAR(120) NOT NULL,
  TRIGGER_GROUP VARCHAR(200) NOT NULL,
  PRIMARY KEY (SCHED_NAME,TRIGGER_GROUP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 触发器错误日志表
CREATE TABLE QRTZ_FIRED_TRIGGERS (
  SCHED_NAME VARCHAR(120) NOT NULL,
  ENTRY_ID VARCHAR(95) NOT NULL,
  TRIGGER_NAME VARCHAR(200) NOT NULL,
  TRIGGER_GROUP VARCHAR(200) NOT NULL,
  INSTANCE_NAME VARCHAR(200) NOT NULL,
  FIRED_TIME BIGINT(13) NOT NULL,
  SCHED_TIME BIGINT(13) NOT NULL,
  PRIORITY INTEGER NOT NULL,
  STATE VARCHAR(16) NOT NULL,
  JOB_NAME VARCHAR(200) NULL,
  JOB_GROUP VARCHAR(200) NULL,
  IS_NONCONCURRENT VARCHAR(1) NULL,
  REQUESTS_RECOVERY VARCHAR(1) NULL,
  PRIMARY KEY (SCHED_NAME,ENTRY_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 调度器状态表
CREATE TABLE QRTZ_SCHEDULER_STATE (
  SCHED_NAME VARCHAR(120) NOT NULL,
  INSTANCE_NAME VARCHAR(200) NOT NULL,
  LAST_CHECKIN_TIME BIGINT(13) NOT NULL,
  CHECKIN_INTERVAL BIGINT(13) NOT NULL,
  PRIMARY KEY (SCHED_NAME,INSTANCE_NAME)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Job详情表
CREATE TABLE QRTZ_JOB_DETAILS (
  SCHED_NAME VARCHAR(120) NOT NULL,
  JOB_NAME VARCHAR(200) NOT NULL,
  JOB_GROUP VARCHAR(200) NOT NULL,
  DESCRIPTION VARCHAR(250) NULL,
  JOB_CLASS_NAME VARCHAR(250) NOT NULL,
  IS_DURABLE VARCHAR(1) NOT NULL,
  IS_NONCONCURRENT VARCHAR(1) NOT NULL,
  IS_UPDATE_DATA VARCHAR(1) NOT NULL,
  REQUESTS_RECOVERY VARCHAR(1) NOT NULL,
  JOB_DATA BLOB NULL,
  PRIMARY KEY (SCHED_NAME,JOB_NAME,JOB_GROUP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 动态管理任务

### 使用Scheduler动态添加任务

```java
package com.example.demo.service;
import com.example.demo.job.SimpleJob;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
/**
 * Quartz任务管理服务
 * 用于动态添加、删除、暂停、恢复任务
 * 
 * @author penglei
 */
@Slf4j
@Service
public class QuartzJobService {
    @Autowired
    private Scheduler scheduler;  // 注入Scheduler
    /**
     * 添加一个简单的定时任务
     * 
     * @param jobName 任务名称
     * @param jobGroup 任务组名
     * @param cronExpression Cron表达式
     * @param message 任务参数
     * @throws SchedulerException 调度异常
     */
    public void addJob(String jobName, String jobGroup, String cronExpression, String message) throws SchedulerException {
        // 创建JobDetail
        JobDetail jobDetail = JobBuilder.newJob(SimpleJob.class)
                .withIdentity(jobName, jobGroup)
                .withDescription("动态添加的任务")
                .usingJobData("message", message)
                .storeDurably()
                .build();
        // 创建Trigger
        Trigger trigger = TriggerBuilder.newTrigger()
                .forJob(jobDetail)
                .withIdentity(jobName + "Trigger", jobGroup)
                .withSchedule(CronScheduleBuilder.cronSchedule(cronExpression))
                .build();
        // 调度任务
        scheduler.scheduleJob(jobDetail, trigger);
        log.info("添加任务成功: {}.{}", jobGroup, jobName);
    }
    /**
     * 删除任务
     * 
     * @param jobName 任务名称
     * @param jobGroup 任务组名
     * @throws SchedulerException 调度异常
     */
    public void deleteJob(String jobName, String jobGroup) throws SchedulerException {
        JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
        scheduler.deleteJob(jobKey);
        log.info("删除任务成功: {}.{}", jobGroup, jobName);
    }
    /**
     * 暂停任务
     * 
     * @param jobName 任务名称
     * @param jobGroup 任务组名
     * @throws SchedulerException 调度异常
     */
    public void pauseJob(String jobName, String jobGroup) throws SchedulerException {
        JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
        scheduler.pauseJob(jobKey);
        log.info("暂停任务成功: {}.{}", jobGroup, jobName);
    }
    /**
     * 恢复任务
     * 
     * @param jobName 任务名称
     * @param jobGroup 任务组名
     * @throws SchedulerException 调度异常
     */
    public void resumeJob(String jobName, String jobGroup) throws SchedulerException {
        JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
        scheduler.resumeJob(jobKey);
        log.info("恢复任务成功: {}.{}", jobGroup, jobName);
    }
    /**
     * 立即触发任务
     * 
     * @param jobName 任务名称
     * @param jobGroup 任务组名
     * @throws SchedulerException 调度异常
     */
    public void triggerJob(String jobName, String jobGroup) throws SchedulerException {
        JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
        scheduler.triggerJob(jobKey);
        log.info("触发任务成功: {}.{}", jobGroup, jobName);
    }
    /**
     * 更新任务的Cron表达式
     * 
     * @param jobName 任务名称
     * @param jobGroup 任务组名
     * @param cronExpression 新的Cron表达式
     * @throws SchedulerException 调度异常
     */
    public void updateJobCron(String jobName, String jobGroup, String cronExpression) throws SchedulerException {
        TriggerKey triggerKey = TriggerKey.triggerKey(jobName + "Trigger", jobGroup);
        CronTrigger trigger = (CronTrigger) scheduler.getTrigger(triggerKey);
        if (trigger != null) {
            // 创建新的Trigger
            CronTrigger newTrigger = TriggerBuilder.newTrigger()
                    .withIdentity(triggerKey)
                    .withSchedule(CronScheduleBuilder.cronSchedule(cronExpression))
                    .build();
            // 更新Trigger
            scheduler.rescheduleJob(triggerKey, newTrigger);
            log.info("更新任务Cron表达式成功: {}.{}", jobGroup, jobName);
        }
    }
}
```

### Controller测试接口

```java
package com.example.demo.controller;
import com.example.demo.service.QuartzJobService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.SchedulerException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * Quartz任务管理Controller
 * 
 * @author penglei
 */
@Slf4j
@RestController
@RequestMapping("/api/quartz")
public class QuartzController {
    @Autowired
    private QuartzJobService quartzJobService;
    /**
     * 添加任务
     */
    @PostMapping("/job")
    public Map<String, Object> addJob(@RequestParam String jobName,
                                      @RequestParam String jobGroup,
                                      @RequestParam String cronExpression,
                                      @RequestParam(required = false, defaultValue = "") String message) throws SchedulerException {
        quartzJobService.addJob(jobName, jobGroup, cronExpression, message);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "添加任务成功");
        return result;
    }
    /**
     * 删除任务
     */
    @DeleteMapping("/job")
    public Map<String, Object> deleteJob(@RequestParam String jobName,
                                         @RequestParam String jobGroup) throws SchedulerException {
        quartzJobService.deleteJob(jobName, jobGroup);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "删除任务成功");
        return result;
    }
    /**
     * 暂停任务
     */
    @PostMapping("/job/pause")
    public Map<String, Object> pauseJob(@RequestParam String jobName,
                                        @RequestParam String jobGroup) throws SchedulerException {
        quartzJobService.pauseJob(jobName, jobGroup);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "暂停任务成功");
        return result;
    }
    /**
     * 恢复任务
     */
    @PostMapping("/job/resume")
    public Map<String, Object> resumeJob(@RequestParam String jobName,
                                        @RequestParam String jobGroup) throws SchedulerException {
        quartzJobService.resumeJob(jobName, jobGroup);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "恢复任务成功");
        return result;
    }
    /**
     * 立即触发任务
     */
    @PostMapping("/job/trigger")
    public Map<String, Object> triggerJob(@RequestParam String jobName,
                                           @RequestParam String jobGroup) throws SchedulerException {
        quartzJobService.triggerJob(jobName, jobGroup);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "触发任务成功");
        return result;
    }
    /**
     * 更新任务Cron表达式
     */
    @PutMapping("/job/cron")
    public Map<String, Object> updateJobCron(@RequestParam String jobName,
                                             @RequestParam String jobGroup,
                                             @RequestParam String cronExpression) throws SchedulerException {
        quartzJobService.updateJobCron(jobName, jobGroup, cronExpression);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "更新任务Cron表达式成功");
        return result;
    }
}
```

## 监听器和插件

### Job监听器

监听Job的执行:

```java
package com.example.demo.listener;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobListener;
import org.springframework.stereotype.Component;
/**
 * Job监听器
 * 监听Job的执行前后
 * 
 * @author penglei
 */
@Slf4j
@Component
public class MyJobListener implements JobListener {
    @Override
    public String getName() {
        return "MyJobListener";  // 监听器名称
    }
    /**
     * Job即将执行时调用
     */
    @Override
    public void jobToBeExecuted(JobExecutionContext context) {
        String jobName = context.getJobDetail().getKey().getName();
        log.info("Job即将执行: {}", jobName);
    }
    /**
     * Job被Vetoed时调用(TriggerListener返回true时)
     */
    @Override
    public void jobExecutionVetoed(JobExecutionContext context) {
        String jobName = context.getJobDetail().getKey().getName();
        log.warn("Job执行被否决: {}", jobName);
    }
    /**
     * Job执行完成后调用
     */
    @Override
    public void jobWasExecuted(JobExecutionContext context, JobExecutionException jobException) {
        String jobName = context.getJobDetail().getKey().getName();
        if (jobException != null) {
            log.error("Job执行失败: {}, 异常: {}", jobName, jobException.getMessage());
        } else {
            log.info("Job执行完成: {}", jobName);
        }
    }
}
```

### Trigger监听器

监听Trigger的触发:

```java
package com.example.demo.listener;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.Trigger;
import org.quartz.TriggerListener;
import org.springframework.stereotype.Component;
/**
 * Trigger监听器
 * 监听Trigger的触发前后
 * 
 * @author penglei
 */
@Slf4j
@Component
public class MyTriggerListener implements TriggerListener {
    @Override
    public String getName() {
        return "MyTriggerListener";  // 监听器名称
    }
    /**
     * Trigger即将触发时调用
     * 返回true会阻止Job执行
     */
    @Override
    public void triggerFired(Trigger trigger, JobExecutionContext context) {
        String triggerName = trigger.getKey().getName();
        log.info("Trigger即将触发: {}", triggerName);
    }
    /**
     * Trigger触发被否决时调用
     * 返回true会阻止Job执行
     */
    @Override
    public boolean vetoJobExecution(Trigger trigger, JobExecutionContext context) {
        // 返回true会阻止Job执行
        return false;
    }
    /**
     * Trigger触发完成时调用
     */
    @Override
    public void triggerComplete(Trigger trigger, JobExecutionContext context,
                                Trigger.CompletedExecutionInstruction triggerInstructionCode) {
        String triggerName = trigger.getKey().getName();
        log.info("Trigger触发完成: {}", triggerName);
    }
    /**
     * Trigger错过触发时调用
     */
    @Override
    public void triggerMisfired(Trigger trigger) {
        String triggerName = trigger.getKey().getName();
        log.warn("Trigger错过触发: {}", triggerName);
    }
}
```

### 注册监听器

在配置类中注册监听器:

```java
package com.example.demo.config;
import com.example.demo.listener.MyJobListener;
import com.example.demo.listener.MyTriggerListener;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import javax.annotation.PostConstruct;
/**
 * 监听器配置类
 * 
 * @author penglei
 */
@Slf4j
@Configuration
public class ListenerConfig {
    @Autowired
    private Scheduler scheduler;
    @Autowired
    private MyJobListener myJobListener;
    @Autowired
    private MyTriggerListener myTriggerListener;
    /**
     * 注册监听器
     */
    @PostConstruct
    public void registerListeners() throws SchedulerException {
        // 注册全局Job监听器
        scheduler.getListenerManager().addJobListener(myJobListener);
        // 注册全局Trigger监听器
        scheduler.getListenerManager().addTriggerListener(myTriggerListener);
        log.info("监听器注册成功");
    }
}
```

## Actuator端点

Spring Boot 4提供了Quartz的Actuator端点,可以查看和管理任务:

### 配置Actuator

```yaml
spring:
  # Actuator配置
  actuator:
    endpoints:
      web:
        exposure:
          include: health,info,quartz  # 暴露quartz端点
    endpoint:
      quartz:
        enabled: true  # 启用quartz端点
```

### 访问Quartz端点

```bash
# 查看所有Job组
curl http://localhost:8080/actuator/quartz/jobGroups
# 查看指定组的Jobs
curl http://localhost:8080/actuator/quartz/jobGroups/default
# 查看Job详情
curl http://localhost:8080/actuator/quartz/jobs/default/simpleJob
# 查看所有Trigger组
curl http://localhost:8080/actuator/quartz/triggerGroups
# 查看指定组的Triggers
curl http://localhost:8080/actuator/quartz/triggerGroups/default
# 查看Quartz报告
curl http://localhost:8080/actuator/quartz/report
# 立即触发Job
curl -X POST http://localhost:8080/actuator/quartz/jobs/default/simpleJob/trigger
```

## 高级配置

### 自定义SchedulerFactoryBean

如果需要更细粒度的控制,可以实现`SchedulerFactoryBeanCustomizer`:

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.quartz.SchedulerFactoryBean;
import org.springframework.boot.autoconfigure.quartz.SchedulerFactoryBeanCustomizer;
import org.springframework.context.annotation.Configuration;
/**
 * SchedulerFactoryBean自定义配置
 * 
 * @author penglei
 */
@Slf4j
@Configuration
public class SchedulerCustomizer implements SchedulerFactoryBeanCustomizer {
    @Override
    public void customize(SchedulerFactoryBean schedulerFactoryBean) {
        // 自定义配置
        schedulerFactoryBean.setWaitForJobsToCompleteOnShutdown(true);  // 关闭时等待任务完成
        schedulerFactoryBean.setOverwriteExistingJobs(true);  // 覆盖已存在的任务
        schedulerFactoryBean.setStartupDelay(5);  // 启动延迟5秒
        log.info("SchedulerFactoryBean自定义配置完成");
    }
}
```

### 集群配置

如果使用JDBC JobStore,可以配置集群模式:

```yaml
spring:
  quartz:
    job-store-type: jdbc
    properties:
      # 集群配置
      org.quartz.jobStore.isClustered: true  # 启用集群模式
      org.quartz.jobStore.clusterCheckinInterval: 20000  # 集群检查间隔(毫秒)
      org.quartz.scheduler.instanceId: AUTO  # 实例ID,集群模式下自动生成
      org.quartz.scheduler.instanceName: MyScheduler  # 调度器名称
```

## 启动类和测试

### 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 Quartz示例应用启动类
 * 
 * @author penglei
 */
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 测试

启动应用后,可以看到任务自动执行;也可以通过API动态管理任务:

```bash
# 添加任务
curl -X POST "http://localhost:8080/api/quartz/job?jobName=testJob&jobGroup=test&cronExpression=0/5 * * * * ?&message=测试任务"
# 暂停任务
curl -X POST "http://localhost:8080/api/quartz/job/pause?jobName=testJob&jobGroup=test"
# 恢复任务
curl -X POST "http://localhost:8080/api/quartz/job/resume?jobName=testJob&jobGroup=test"
# 立即触发任务
curl -X POST "http://localhost:8080/api/quartz/job/trigger?jobName=testJob&jobGroup=test"
# 更新Cron表达式
curl -X PUT "http://localhost:8080/api/quartz/job/cron?jobName=testJob&jobGroup=test&cronExpression=0/10 * * * * ?"
# 删除任务
curl -X DELETE "http://localhost:8080/api/quartz/job?jobName=testJob&jobGroup=test"
```

## 最佳实践

1. **生产环境使用JDBC JobStore**: 内存模式适合开发测试,生产环境必须使用JDBC模式保证任务持久化
2. **合理设置线程池大小**: 根据任务数量和执行时间合理设置线程池大小,避免任务堆积
3. **使用监听器监控任务**: 通过监听器记录任务执行日志,方便问题排查
4. **任务幂等性**: 确保任务可以重复执行而不产生副作用
5. **异常处理**: 任务中要做好异常处理,避免任务失败影响调度器
6. **避免长时间运行的任务**: 长时间运行的任务会占用线程,影响其他任务执行
7. **集群部署**: 生产环境建议使用集群模式,提高可用性
8. **监控和告警**: 使用Actuator端点监控任务状态,设置告警规则

## 总结

Spring Boot 4整合Quartz非常方便,自动配置给你整得明明白白;内存模式适合开发测试,JDBC模式适合生产环境;通过监听器和插件可以扩展功能,Actuator端点可以方便地监控和管理任务;兄弟们根据实际需求选择合适的配置,就能轻松搞定定时任务调度了。
