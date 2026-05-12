# 08、Java 任务调度 - ElasticJob 入门实战（ElasticJob-Lite使用）
- 来源：https://ddkk.com/zhuanlan/job/job/1/8.html
- 分类：作业调度
- 分组：教程目录
ElasticJob 是一个分布式调度解决方案，由 2 个相互独立的子项目 ElasticJob-Lite 和 ElasticJob-Cloud 组成。本文主要介绍 ElasticJob-Lite 的基本使用，文中所使用到的软件版本：Spring Boot 2.4.4、jdk1.8.0_181、elasticjob-lite 3.0.0-RC1。

## 1、ElasticJob-Lite 简介

ElasticJob-Lite 定位为轻量级无中心化解决方案，使用jar的形式提供分布式任务的协调服务。架构图如下：

详细的介绍请参考官网文档：https://shardingsphere.apache.org/elasticjob/current/cn/overview/

## 2、使用

### 2.1、Zookeeper 环境准备

ElasticJob-Lite 使用 Zookeeper作为注册中心，需先安装 Zookeeper；安装方法可参考：https://www.cnblogs.com/wuyongyin/p/12485181.html

### 2.2、单独使用

#### 2.2.1、引入依赖

```java
<dependency>
    <groupId>org.apache.shardingsphere.elasticjob</groupId>
    <artifactId>elasticjob-lite-core</artifactId>
    <version>3.0.0-RC1</version>
</dependency>
```

#### 2.2.2、样例

开发Job:

```java
package com.abc.demo.solo;
import org.apache.shardingsphere.elasticjob.api.ShardingContext;
import org.apache.shardingsphere.elasticjob.simple.job.SimpleJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class MyJob implements SimpleJob {
    private static Logger logger = LoggerFactory.getLogger(MyJob.class);
    @Override
    public void execute(ShardingContext shardingContext) {
        logger.info(shardingContext.getJobName() + "|" + shardingContext.getShardingItem() + "|" + shardingContext.getShardingParameter());
        try {
            Thread.sleep(1000 * 5);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

运行Job:

```java
package com.abc.demo.solo;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.shardingsphere.elasticjob.api.JobConfiguration;
import org.apache.shardingsphere.elasticjob.lite.api.bootstrap.impl.ScheduleJobBootstrap;
import org.apache.shardingsphere.elasticjob.reg.base.CoordinatorRegistryCenter;
import org.apache.shardingsphere.elasticjob.reg.zookeeper.ZookeeperConfiguration;
import org.apache.shardingsphere.elasticjob.reg.zookeeper.ZookeeperRegistryCenter;
import org.apache.shardingsphere.elasticjob.tracing.api.TracingConfiguration;
import javax.sql.DataSource;
public class MyJobDemo {
    public static void main(String[] args) {
        CoordinatorRegistryCenter coordinatorRegistryCenter = createRegistryCenter();
        DataSource dataSource = getDataSource();
        TracingConfiguration tracingConfig = new TracingConfiguration<>("RDB", dataSource);
        new ScheduleJobBootstrap(coordinatorRegistryCenter, new MyJob(), createJobConfiguration("job1", tracingConfig)).schedule();
        new ScheduleJobBootstrap(coordinatorRegistryCenter, new MyJob(), createJobConfiguration("job2", tracingConfig)).schedule();
        new ScheduleJobBootstrap(coordinatorRegistryCenter, new MyJob(), createJobConfiguration("job3", tracingConfig)).schedule();
    }
    private static CoordinatorRegistryCenter createRegistryCenter() {
        ZookeeperConfiguration zookeeperConfiguration = new ZookeeperConfiguration("10.49.196.10:2181", "my-job");
        zookeeperConfiguration.setMaxSleepTimeMilliseconds(1000 * 30);
        zookeeperConfiguration.setConnectionTimeoutMilliseconds(1000 * 30);
        CoordinatorRegistryCenter coordinatorRegistryCenter = new ZookeeperRegistryCenter(zookeeperConfiguration);
        coordinatorRegistryCenter.init();
        return coordinatorRegistryCenter;
    }
    private static JobConfiguration createJobConfiguration(String jobName, TracingConfiguration tracingConfig) {
        JobConfiguration jobConfiguration = JobConfiguration.newBuilder(jobName, 2)
                .shardingItemParameters("0=Beijing,1=Shanghai")
                .cron("0/20 * * * * ?").build();
        //配置事件追踪，即记录任务执行日志
        jobConfiguration.getExtraConfigurations().add(tracingConfig);
        return jobConfiguration;
    }
    //这里使用 Hikari 连接池，使用 Druid 有时会报错
    private static DataSource getDataSource() {
        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setDriverClassName("com.mysql.cj.jdbc.Driver");
        hikariConfig.setJdbcUrl("jdbc:mysql://10.49.196.10:3306/itest?useUnicode=true&characterEncoding=UTF-8");
        hikariConfig.setUsername("root");
        hikariConfig.setPassword("Root_123!");
        hikariConfig.setMinimumIdle(2);
        hikariConfig.setMaximumPoolSize(5);
        hikariConfig.setConnectionTestQuery("select 1");
        HikariDataSource hikariDataSource = new HikariDataSource(hikariConfig);
        return hikariDataSource;
    }
}
```

### 2.3、Spring Boot 中整合 ElasticJob-Lite

#### 2.3.1、引入依赖

```java
<dependency>
    <groupId>org.apache.shardingsphere.elasticjob</groupId>
    <artifactId>elasticjob-lite-spring-boot-starter</artifactId>
    <version>3.0.0-RC1</version>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
```

#### 2.3.2、application.yml

```java
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://10.49.196.10:3306/itest?useUnicode=true&characterEncoding=UTF-8
    username: root
    password: 123456
elasticjob:
  reg-center:
    server-lists: 10.49.196.10:2181
    namespace: my-job
    max-sleep-time-milliseconds: 30000
    connection-timeout-milliseconds: 30000
  jobs:
    FirstJob:
      elasticJobClass: com.abc.demo.job.FirstJob
      cron: 0/10 * * * * ?
      shardingTotalCount: 2
      shardingItemParameters: 0=Beijing,1=Shanghai
    ScriptJob:
      elasticJobType: SCRIPT
      cron: 0/20 * * * * ?
      shardingTotalCount: 2
      props:
        script.command.line: "/home/demo/test.sh"
  tracing:
    type: RDB
```

#### 2.3.3、开发任务

com.abc.demo.job.FirstJob：

```java
package com.abc.demo.job;
import org.apache.shardingsphere.elasticjob.api.ShardingContext;
import org.apache.shardingsphere.elasticjob.simple.job.SimpleJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
@Component
public class FirstJob implements SimpleJob {
    private static Logger logger = LoggerFactory.getLogger(FirstJob.class);
    @Override
    public void execute(ShardingContext shardingContext) {
        logger.info(shardingContext.getJobName() + "|" + shardingContext.getShardingItem() + "|" + shardingContext.getShardingParameter());
        try {
            Thread.sleep(1000 * 3);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

脚本任务（/home/demo/test.sh）：

```java
echo 'hello'
echo 'hello2'
echo 'hello3'
```

#### 2.3.4、启动应用

应用启动后，任务开始运行。

### 2.4、部署控制台

下载ElasticJob-Lite-UI 二进制包并解压：https://shardingsphere.apache.org/elasticjob/current/cn/downloads/

在lib 目录下增加 MySQL、Druid 的驱动包，然后执行 bin/start.sh。

访问地址为：http://10.49.196.10:8088/ (root/root)
