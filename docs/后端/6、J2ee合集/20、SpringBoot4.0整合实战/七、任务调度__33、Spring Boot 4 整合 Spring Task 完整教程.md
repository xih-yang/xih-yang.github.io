# 33、Spring Boot 4 整合 Spring Task 完整教程
- 来源：https://ddkk.com/springboot/4-action/33.html
- 分类：Spring Boot 4 整合教程
- 分组：七、任务调度
- 日期：2025-12-08
做简单定时任务的时候,最烦的就是引入第三方框架,用Quartz吧,太重了,配置复杂;用XXL-Job吧,需要部署调度中心,太麻烦;其实Spring自带的Spring Task就够用了,支持Cron表达式、固定延迟、固定频率,功能简单实用,而且Spring Boot自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋用@Scheduled注解、配置TaskScheduler、处理异步任务、监控任务这些功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实Spring Task在Spring Boot里早就支持了,你只要加个`@EnableScheduling`注解,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置线程池、使用不同的调度方式、处理任务异常、监控任务执行这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Spring Task基础概念

### Spring Task是啥玩意儿

Spring Task是Spring Framework内置的任务调度功能,提供了简单易用的任务调度能力;Spring Task的核心特性包括:

1. **简单易用**: 使用`@Scheduled`注解即可实现定时任务,无需额外配置
2. **多种调度方式**: 支持Cron表达式、固定延迟、固定频率等多种调度方式
3. **自动配置**: Spring Boot自动配置TaskScheduler,无需手动配置
4. **线程池支持**: 支持自定义线程池,可以并发执行多个任务
5. **Actuator监控**: 支持通过Actuator端点监控任务执行情况
6. **轻量级**: 无需引入第三方依赖,Spring Framework内置

### Spring Task的核心概念

1. **@Scheduled注解**: 用于标识定时任务方法,支持多种调度方式
2. **TaskScheduler**: 任务调度器,负责执行定时任务
3. **ThreadPoolTaskScheduler**: 基于线程池的任务调度器实现
4. **@EnableScheduling**: 启用Spring Task功能,必须添加在主配置类上
5. **Cron表达式**: 用于定义复杂的任务执行时间
6. **固定延迟(Fixed Delay)**: 任务执行完成后,延迟固定时间再执行下一次
7. **固定频率(Fixed Rate)**: 任务按固定频率执行,不管上一次是否执行完成

### Spring Task和Quartz的区别

1. **复杂度**: Spring Task简单轻量;Quartz功能强大但复杂
2. **持久化**: Spring Task不支持持久化;Quartz支持数据库持久化
3. **集群**: Spring Task不支持集群;Quartz支持集群部署
4. **管理界面**: Spring Task没有管理界面;Quartz需要自己实现
5. **适用场景**: Spring Task适合简单定时任务;Quartz适合复杂的企业级任务调度

### Spring Task和XXL-Job的区别

1. **架构**: Spring Task是单体架构;XXL-Job是调度中心+执行器分离架构
2. **管理界面**: Spring Task没有管理界面;XXL-Job提供Web管理界面
3. **动态管理**: Spring Task需要重启应用才能修改任务;XXL-Job支持动态管理
4. **监控**: Spring Task通过Actuator监控;XXL-Job提供完整的监控功能
5. **适用场景**: Spring Task适合单应用简单任务;XXL-Job适合分布式任务调度

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-task-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── task/                      # 任务目录
│   │   │               ├── config/                   # 配置类目录
│   │   │               └── controller/               # 控制器目录
│   │   └── resources/
│   │       └── application.yml       # 配置文件
│   └── test/
└── README.md
```

### 添加Maven依赖

Spring Task是Spring Framework的一部分,Spring Boot已经包含了,不需要额外添加依赖;只需要添加Spring Boot Web Starter即可:

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
    <artifactId>spring-boot-task-demo</artifactId>
    <version>1.0.0</version>
    <name>Spring Boot Task Demo</name>
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
        <!-- Spring Boot Actuator(可选,用于监控) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
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

## 启用Spring Task

### 添加@EnableScheduling注解

在启动类或配置类上添加`@EnableScheduling`注解,启用Spring Task功能:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
/**
 * Spring Boot 4 Task示例应用启动类
 * @EnableScheduling注解启用Spring Task功能
 * 
 * @author penglei
 */
@SpringBootApplication
@EnableScheduling  // 启用Spring Task功能
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## 创建定时任务

### Cron表达式任务

使用Cron表达式定义任务执行时间:

```java
package com.example.demo.task;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
/**
 * Cron表达式任务示例
 * 使用@Scheduled注解的cron属性定义任务执行时间
 * 
 * @author penglei
 */
@Slf4j
@Component
public class CronTask {
    /**
     * 每10秒执行一次
     * cron表达式格式: 秒 分 时 日 月 周 [年]
     * "0/10 * * * * ?" 表示每10秒执行一次
     */
    @Scheduled(cron = "0/10 * * * * ?")
    public void executeEvery10Seconds() {
        log.info("Cron任务执行: 每10秒执行一次,当前时间: {}", System.currentTimeMillis());
    }
    /**
     * 每天凌晨2点执行
     * "0 0 2 * * ?" 表示每天凌晨2点执行
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void executeDaily() {
        log.info("Cron任务执行: 每天凌晨2点执行");
    }
    /**
     * 每周一上午10点执行
     * "0 0 10 ? * MON" 表示每周一上午10点执行
     */
    @Scheduled(cron = "0 0 10 ? * MON")
    public void executeWeekly() {
        log.info("Cron任务执行: 每周一上午10点执行");
    }
    /**
     * 每月1号凌晨1点执行
     * "0 0 1 1 * ?" 表示每月1号凌晨1点执行
     */
    @Scheduled(cron = "0 0 1 1 * ?")
    public void executeMonthly() {
        log.info("Cron任务执行: 每月1号凌晨1点执行");
    }
}
```

### 固定延迟任务

固定延迟任务: 任务执行完成后,延迟固定时间再执行下一次:

```java
package com.example.demo.task;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
/**
 * 固定延迟任务示例
 * fixedDelay: 任务执行完成后,延迟固定时间再执行下一次
 * 
 * @author penglei
 */
@Slf4j
@Component
public class FixedDelayTask {
    /**
     * 固定延迟5秒执行
     * fixedDelay = 5000 表示任务执行完成后,延迟5秒再执行下一次
     * 单位: 毫秒
     */
    @Scheduled(fixedDelay = 5000)
    public void executeWithFixedDelay() {
        log.info("固定延迟任务执行: 延迟5秒,当前时间: {}", System.currentTimeMillis());
        try {
            // 模拟业务处理,耗时2秒
            Thread.sleep(2000);
            log.info("业务处理完成");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("任务执行被中断", e);
        }
    }
    /**
     * 固定延迟任务,带初始延迟
     * initialDelay = 10000 表示应用启动后延迟10秒再开始执行第一次任务
     * fixedDelay = 5000 表示任务执行完成后,延迟5秒再执行下一次
     */
    @Scheduled(initialDelay = 10000, fixedDelay = 5000)
    public void executeWithInitialDelay() {
        log.info("固定延迟任务执行: 初始延迟10秒,之后每5秒执行一次");
    }
}
```

### 固定频率任务

固定频率任务: 任务按固定频率执行,不管上一次是否执行完成:

```java
package com.example.demo.task;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
/**
 * 固定频率任务示例
 * fixedRate: 任务按固定频率执行,不管上一次是否执行完成
 * 
 * @author penglei
 */
@Slf4j
@Component
public class FixedRateTask {
    /**
     * 固定频率3秒执行一次
     * fixedRate = 3000 表示每3秒执行一次,不管上一次是否执行完成
     * 单位: 毫秒
     */
    @Scheduled(fixedRate = 3000)
    public void executeWithFixedRate() {
        log.info("固定频率任务执行: 每3秒执行一次,当前时间: {}", System.currentTimeMillis());
        try {
            // 模拟业务处理,耗时1秒
            Thread.sleep(1000);
            log.info("业务处理完成");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("任务执行被中断", e);
        }
    }
    /**
     * 固定频率任务,带初始延迟
     * initialDelay = 5000 表示应用启动后延迟5秒再开始执行第一次任务
     * fixedRate = 3000 表示每3秒执行一次
     */
    @Scheduled(initialDelay = 5000, fixedRate = 3000)
    public void executeWithInitialDelay() {
        log.info("固定频率任务执行: 初始延迟5秒,之后每3秒执行一次");
    }
}
```

### 使用字符串配置的延迟和频率

支持使用配置文件中的属性值:

```java
package com.example.demo.task;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
/**
 * 使用配置文件的任务示例
 * 支持使用${}占位符从配置文件中读取值
 * 
 * @author penglei
 */
@Slf4j
@Component
public class ConfigurableTask {
    /**
     * 使用配置文件中的值
     * fixedDelayString = "${task.fixedDelay:5000}" 表示从配置文件中读取task.fixedDelay值,如果不存在则使用默认值5000
     */
    @Scheduled(fixedDelayString = "${task.fixedDelay:5000}")
    public void executeWithConfig() {
        log.info("可配置任务执行: 使用配置文件中的延迟时间");
    }
    /**
     * 使用配置文件中的Cron表达式
     * cron = "${task.cron:0/10 * * * * ?}" 表示从配置文件中读取task.cron值,如果不存在则使用默认值
     */
    @Scheduled(cron = "${task.cron:0/10 * * * * ?}")
    public void executeWithCronConfig() {
        log.info("可配置Cron任务执行: 使用配置文件中的Cron表达式");
    }
}
```

在`application.yml`中配置:

```yaml
# 任务配置
task:
  fixedDelay: 5000  # 固定延迟时间(毫秒)
  cron: "0/10 * * * * ?"  # Cron表达式
```

## Cron表达式详解

### Cron表达式格式

Cron表达式由6或7个字段组成,用空格分隔:

```plaintext
秒 分 时 日 月 周 [年]
```

字段说明:

字段允许值允许的特殊字符

秒0-59, - * /
分0-59, - * /
时0-23, - * /
日1-31, - * ? / L W
月1-12 或 JAN-DEC, - * /
周0-7 或 SUN-SAT, - * ? / L #
年(可选)1970-2099, - * /

特殊字符说明:

- `*`: 匹配所有值
- `?`: 不指定值,用于日和周字段
- `-`: 指定范围,如`10-12`表示10到12
- `,`: 指定多个值,如`MON,WED,FRI`表示周一、周三、周五
- `/`: 指定增量,如`0/15`表示从0开始,每15个单位执行一次
- `L`: 最后,如`L`在日字段表示最后一天,在周字段表示周六
- `W`: 工作日,如`15W`表示离15号最近的工作日
- `#`: 第几个,如`6#3`表示第三个周五

### 常用Cron表达式示例

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
0 15 10 ? * 6#3      每月第三个周五10点15分执行
0 0 12 1/5 * ?       每月1号开始,每5天12点执行
0 11 11 11 11 ?      每年11月11号11点11分执行
```

## 配置TaskScheduler

### 默认配置

Spring Boot会自动配置`ThreadPoolTaskScheduler`,默认使用单线程执行任务;如果需要并发执行多个任务,需要自定义配置。

### 自定义TaskScheduler配置

创建配置类,自定义TaskScheduler:

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import java.util.concurrent.ThreadPoolExecutor;
/**
 * TaskScheduler配置类
 * 自定义线程池配置,支持并发执行多个任务
 * 
 * @author penglei
 */
@Slf4j
@Configuration
public class TaskSchedulerConfig implements SchedulingConfigurer {
    /**
     * 配置TaskScheduler
     * 实现SchedulingConfigurer接口,自定义任务调度器
     * 
     * @param taskRegistrar 任务注册器
     */
    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        // 设置任务调度器
        taskRegistrar.setScheduler(taskScheduler());
        log.info("TaskScheduler配置完成,线程池大小: 10");
    }
    /**
     * 创建ThreadPoolTaskScheduler Bean
     * 配置线程池大小、线程名前缀、拒绝策略等
     * 
     * @return ThreadPoolTaskScheduler实例
     */
    @Bean(destroyMethod = "shutdown")
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        // 设置线程池大小,默认是单线程
        scheduler.setPoolSize(10);
        // 设置线程名前缀,方便日志追踪
        scheduler.setThreadNamePrefix("scheduled-task-");
        // 设置等待所有任务完成后再关闭
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        // 设置等待时间,单位:秒
        scheduler.setAwaitTerminationSeconds(60);
        // 设置拒绝策略:调用者运行策略
        scheduler.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        // 初始化线程池
        scheduler.initialize();
        log.info("ThreadPoolTaskScheduler初始化完成,线程池大小: 10");
        return scheduler;
    }
}
```

### 使用配置文件配置TaskScheduler

在`application.yml`中配置:

```yaml
spring:
  task:
    scheduling:
      # 线程池大小,默认是单线程
      pool:
        size: 10
      # 线程名前缀
      thread-name-prefix: scheduled-task-
      # 关闭时是否等待任务完成
      shutdown:
        await-termination: true
        # 等待时间(秒)
        await-termination-period: 60s
```

## 异步任务执行

### 使用@Async注解

如果任务执行时间较长,可以使用`@Async`注解异步执行:

```java
package com.example.demo.task;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
/**
 * 异步任务示例
 * 使用@Async注解使任务异步执行,不阻塞调度线程
 * 
 * @author penglei
 */
@Slf4j
@Component
public class AsyncTask {
    /**
     * 异步执行的定时任务
     * @Async注解使任务在单独的线程中执行,不阻塞调度线程
     * 注意: 需要启用@EnableAsync注解
     */
    @Async
    @Scheduled(fixedRate = 5000)
    public void executeAsync() {
        log.info("异步任务执行: 线程名称: {}", Thread.currentThread().getName());
        try {
            // 模拟长时间运行的任务
            Thread.sleep(3000);
            log.info("异步任务执行完成");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("异步任务执行被中断", e);
        }
    }
}
```

### 启用@Async支持

在启动类或配置类上添加`@EnableAsync`注解:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
/**
 * Spring Boot 4 Task示例应用启动类
 * 
 * @author penglei
 */
@SpringBootApplication
@EnableScheduling  // 启用Spring Task功能
@EnableAsync  // 启用异步任务支持
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 配置异步任务执行器

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;
/**
 * 异步任务配置类
 * 配置异步任务执行器
 * 
 * @author penglei
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    /**
     * 配置异步任务执行器
     * 
     * @return Executor实例
     */
    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // 核心线程数
        executor.setCorePoolSize(5);
        // 最大线程数
        executor.setMaxPoolSize(10);
        // 队列容量
        executor.setQueueCapacity(100);
        // 线程名前缀
        executor.setThreadNamePrefix("async-task-");
        // 拒绝策略:调用者运行策略
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        // 等待所有任务完成后再关闭
        executor.setWaitForTasksToCompleteOnShutdown(true);
        // 等待时间
        executor.setAwaitTerminationSeconds(60);
        // 初始化
        executor.initialize();
        log.info("异步任务执行器初始化完成,核心线程数: 5, 最大线程数: 10");
        return executor;
    }
}
```

## 任务异常处理

### 使用ScheduledTaskExceptionHandler

实现`ScheduledTaskExceptionHandler`接口处理任务异常:

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.scheduling.support.ScheduledMethodRunnable;
/**
 * 任务异常处理配置
 * 实现SchedulingConfigurer接口,处理任务执行异常
 * 
 * @author penglei
 */
@Slf4j
@Configuration
public class TaskExceptionHandlerConfig implements SchedulingConfigurer {
    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        // 设置异常处理器
        taskRegistrar.setScheduler(taskScheduler());
        // 设置异常处理
        taskRegistrar.setErrorHandler(throwable -> {
            log.error("定时任务执行异常", throwable);
            // 这里可以添加异常处理逻辑,比如发送告警、记录日志等
        });
    }
    @Bean(destroyMethod = "shutdown")
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10);
        scheduler.setThreadNamePrefix("scheduled-task-");
        scheduler.initialize();
        return scheduler;
    }
}
```

### 在任务方法中处理异常

```java
package com.example.demo.task;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
/**
 * 任务异常处理示例
 * 在任务方法中捕获和处理异常
 * 
 * @author penglei
 */
@Slf4j
@Component
public class ExceptionHandlingTask {
    /**
     * 带异常处理的任务
     * 在任务方法中捕获异常,避免任务因为异常而停止
     */
    @Scheduled(fixedRate = 5000)
    public void executeWithExceptionHandling() {
        try {
            log.info("任务开始执行");
            // 模拟可能抛出异常的业务逻辑
            if (Math.random() > 0.5) {
                throw new RuntimeException("模拟异常");
            }
            log.info("任务执行成功");
        } catch (Exception e) {
            log.error("任务执行失败,异常信息: {}", e.getMessage(), e);
            // 这里可以添加异常处理逻辑,比如发送告警、记录日志等
        }
    }
}
```

## 动态管理任务

### 使用ScheduledTaskRegistrar动态添加任务

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
/**
 * 动态任务管理服务
 * 支持动态添加、删除、暂停、恢复任务
 * 
 * @author penglei
 */
@Slf4j
@Service
public class DynamicTaskService {
    @Autowired
    private TaskScheduler taskScheduler;
    // 存储动态任务
    private final Map<String, ScheduledFuture<?>> tasks = new ConcurrentHashMap<>();
    /**
     * 添加动态任务
     * 
     * @param taskName 任务名称
     * @param cronExpression Cron表达式
     * @param runnable 任务逻辑
     */
    public void addTask(String taskName, String cronExpression, Runnable runnable) {
        // 如果任务已存在,先删除
        if (tasks.containsKey(taskName)) {
            removeTask(taskName);
        }
        // 创建Cron触发器
        CronTrigger trigger = new CronTrigger(cronExpression);
        // 调度任务
        ScheduledFuture<?> future = taskScheduler.schedule(runnable, trigger);
        // 保存任务
        tasks.put(taskName, future);
        log.info("添加动态任务成功: {}, Cron表达式: {}", taskName, cronExpression);
    }
    /**
     * 删除动态任务
     * 
     * @param taskName 任务名称
     */
    public void removeTask(String taskName) {
        ScheduledFuture<?> future = tasks.remove(taskName);
        if (future != null) {
            future.cancel(true);
            log.info("删除动态任务成功: {}", taskName);
        }
    }
    /**
     * 暂停任务
     * 
     * @param taskName 任务名称
     */
    public void pauseTask(String taskName) {
        ScheduledFuture<?> future = tasks.get(taskName);
        if (future != null) {
            future.cancel(true);
            log.info("暂停任务成功: {}", taskName);
        }
    }
    /**
     * 恢复任务
     * 
     * @param taskName 任务名称
     * @param cronExpression Cron表达式
     * @param runnable 任务逻辑
     */
    public void resumeTask(String taskName, String cronExpression, Runnable runnable) {
        addTask(taskName, cronExpression, runnable);
        log.info("恢复任务成功: {}", taskName);
    }
}
```

## Actuator监控

### 配置Actuator端点

在`application.yml`中配置:

```yaml
spring:
  # Actuator配置
  actuator:
    endpoints:
      web:
        exposure:
          include: health,info,scheduledtasks  # 暴露scheduledtasks端点
    endpoint:
      scheduledtasks:
        enabled: true  # 启用scheduledtasks端点
```

### 访问scheduledtasks端点

```bash
# 查看所有定时任务
curl http://localhost:8080/actuator/scheduledtasks
# 返回示例
{
  "cron": [
    {
      "expression": "0/10 * * * * ?",
      "nextExecution": {
        "time": "2024-12-08T16:30:00Z"
      },
      "runnable": {
        "target": "com.example.demo.task.CronTask.executeEvery10Seconds"
      }
    }
  ],
  "fixedDelay": [
    {
      "initialDelay": 0,
      "interval": 5000,
      "lastExecution": {
        "status": "SUCCESS",
        "time": "2024-12-08T16:29:55Z"
      },
      "nextExecution": {
        "time": "2024-12-08T16:30:00Z"
      },
      "runnable": {
        "target": "com.example.demo.task.FixedDelayTask.executeWithFixedDelay"
      }
    }
  ],
  "fixedRate": [
    {
      "initialDelay": 5000,
      "interval": 3000,
      "nextExecution": {
        "time": "2024-12-08T16:30:03Z"
      },
      "runnable": {
        "target": "com.example.demo.task.FixedRateTask.executeWithFixedRate"
      }
    }
  ]
}
```

## 最佳实践

1. **合理使用线程池**: 如果任务较多,建议配置线程池,避免任务阻塞
2. **处理任务异常**: 在任务方法中捕获异常,避免任务因为异常而停止
3. **使用配置文件**: 将Cron表达式和延迟时间配置在配置文件中,方便修改
4. **避免长时间运行的任务**: 如果任务执行时间较长,使用`@Async`异步执行
5. **合理设置初始延迟**: 应用启动时设置初始延迟,避免启动时立即执行任务
6. **监控任务执行**: 使用Actuator端点监控任务执行情况
7. **任务幂等性**: 确保任务可以重复执行而不产生副作用
8. **避免任务阻塞**: 不要在任务中执行长时间阻塞的操作
9. **合理选择调度方式**: 根据业务需求选择合适的调度方式(Cron、固定延迟、固定频率)
10. **日志记录**: 在任务中记录详细的日志,方便问题排查

## 总结

Spring Boot 4整合Spring Task非常方便,只需要添加`@EnableScheduling`注解就能用;支持Cron表达式、固定延迟、固定频率等多种调度方式;可以自定义TaskScheduler配置线程池;支持异步任务执行;通过Actuator可以监控任务执行情况;兄弟们根据实际需求选择合适的配置,就能轻松搞定简单定时任务了。
