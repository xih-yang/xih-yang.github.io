# 03、Java 任务调度 - Spring Scheduled 介绍
- 来源：https://ddkk.com/zhuanlan/job/job/1/3.html
- 分类：作业调度
- 分组：教程目录
Spring 提供了@Scheduled 注解，可用比较便捷的解决定时任务的需求，它的内部实现是基于 java 中的 ScheduledThreadPoolExecutor 类。本文主要介绍 Spring Boot 环境下 @Scheduled 的使用；文中所使用到的软件版本：Spring Boot 2.4.4、jdk1.8.0_181。

## 1、@Scheduled简介

@Scheduled 注解标注在方法上，可以支持如下几种方式运行：

**1、** @Scheduled(fixedRate=3000)按固定时间间隔运行；

**2、** @Scheduled(fixedDelay=3000)上一次任务运行完成后等待固定时间运行下一次任务；

**3、** @Scheduled(cron="00/1***?")按照cron表达式定义的时间方式运行；

## 2、Spring Boot 环境下 @Scheduled 使用

### 2.1、启动类上添加 @EnableScheduling 注解

```java
@EnableScheduling
@SpringBootApplication
@ComponentScan(basePackages = {"com.abc"})
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### 2.2、设置任务线程池大小

默认任务线程池大小为 1，如想修改，可在 application.yml 中添加如下配置：

```java
spring:
  task:
    scheduling:
      pool:
        size: 10
```

### 2.3、使用例子

```java
package com.abc.demo.task;
import com.abc.demo.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
@Component
public class TestTask {
    private static Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    @Scheduled(cron = "0 0/1 * * * ?")
    private void test1() {
        logger.info("cron表达式");
    }
    @Scheduled(initialDelay = 2000, fixedRate = 3000)
    private void test2() {
        logger.info("延迟2s运行第一次，然后每隔3s运行一次");
    }
    @Scheduled(initialDelay = 3000, fixedDelay = 4000)
    private void test3() {
        logger.info("延迟3s运行第一次，上一次任务运行结束后等4s再运行下一次任务。");
    }
}
```

### 2.4、动态启动、停止定时任务

假设需要在页面动态的添加并保存定时任务到数据库，添加完成后可以在页面启动或停止该任务；可以编写一个 Controller 来实现该功能。

```java
package com.abc.demo.controller;
import com.abc.demo.entity.R;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
/**
 * 这里只涉及任务的启动，停止，重启
 *
 * 任务的新增、修改、删除可以编写方法实现，任务数据保存在数据库里
 */
@RequestMapping("/schedule")
@RestController
public class ScheduleController {
    private static Logger logger = LoggerFactory.getLogger(StudentController.class);
    private static Map<Integer, ScheduledFuture> futures = new ConcurrentHashMap<>();
    //模拟数据库的任务配置数据
    private Map<Integer, TaskConfig> taskConfigs = new HashMap(){{
        put(1, new TaskConfig(1, "任务1", "0/5 * * * * *"));
        put(2, new TaskConfig(2, "任务2", "0/6 * * * * *"));
        put(3, new TaskConfig(3, "任务3", "0/7 * * * * *"));
        put(4, new TaskConfig(4, "任务4", "0/8 * * * * *"));
        put(5, new TaskConfig(5, "任务5", "0/9 * * * * *"));
    }};
    @Autowired
    private TaskScheduler taskScheduler;
    /**程序启动时，启动所有任务*/
    @PostConstruct
    private void init() {
        for (Map.Entry<Integer, TaskConfig> entry : taskConfigs.entrySet()) {
            TaskConfig taskConfig = entry.getValue();
            ScheduledFuture<?> future = taskScheduler.schedule(new MyRunnable(taskConfig.getBussinessParam()), new CronTrigger(taskConfig.getCron()));
            futures.put(entry.getKey(), future);
        }
    }
    @RequestMapping("/startTask")
    public R<String> startTask(Integer taskId) {
        ScheduledFuture<?> future = futures.get(taskId);
        if (future == null) {
            TaskConfig taskConfig = taskConfigs.get(taskId);
            future = taskScheduler.schedule(new MyRunnable(taskConfig.getBussinessParam()), new CronTrigger(taskConfig.getCron()));
            futures.put(taskId, future);
        } else {
            logger.info("任务已启动");
        }
        return R.ok();
    }
    @RequestMapping("/stopTask")
    public R<String> stopTask(Integer taskId) {
        ScheduledFuture<?> future = futures.get(taskId);
        if (future != null) {
            future.cancel(true);
            futures.remove(taskId);
        } else {
            logger.info("任务已停止");
        }
        return R.ok();
    }
    @RequestMapping("/restartTask")
    public R<String> restartTask(Integer taskId) {
        ScheduledFuture<?> future = futures.get(taskId);
        if (future == null) {
            TaskConfig taskConfig = taskConfigs.get(taskId);
            future = taskScheduler.schedule(new MyRunnable(taskConfig.getBussinessParam()), new CronTrigger(taskConfig.getCron()));
            futures.put(taskId, future);
        } else {
            future.cancel(true);
            TaskConfig taskConfig = taskConfigs.get(taskId);
            future = taskScheduler.schedule(new MyRunnable(taskConfig.getBussinessParam()), new CronTrigger(taskConfig.getCron()));
            futures.put(taskId, future);
        }
        return R.ok();
    }
    class MyRunnable implements Runnable {
        private String param;
        public MyRunnable(String param) {
            this.param = param;
        }
        @Override
        public void run() {
            logger.info("MyRunnable:{}", param);
        }
    }
    @Data
    @AllArgsConstructor
    class TaskConfig {
        /**主键*/
        private Integer id;
        /**业务参数*/
        private String bussinessParam;
        /**cron表达式*/
        private String cron;
    }
}
```
