# 32、Spring Boot 4 整合 XXL-Job 完整教程
- 来源：https://ddkk.com/springboot/4-action/32.html
- 分类：Spring Boot 4 整合教程
- 分组：七、任务调度
- 日期：2025-12-08
做分布式系统的时候,最烦的就是定时任务调度,用Quartz吧,配置复杂,集群部署麻烦,没有可视化管理界面;用Spring Task吧,功能太简单,不支持分布式,任务管理全靠代码;后来听说XXL-Job这玩意儿不错,是开源的分布式任务调度平台,调度中心、执行器分离,支持动态任务管理、任务监控、任务日志、故障转移,还有Web管理界面,功能贼强大;但是很多兄弟不知道里面的门道,也不知道咋部署调度中心、配置执行器、开发任务、管理任务这些功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实XXL-Job在Spring Boot里早就支持了,你只要加个`xxl-job-core`依赖,配置个执行器,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋部署调度中心、配置执行器、开发Bean模式和GLUE模式任务、任务监控、故障转移这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## XXL-Job基础概念

### XXL-Job是啥玩意儿

XXL-Job是一个开源的分布式任务调度平台,其核心设计目标是开发迅速、学习简单、轻量级、易扩展;XXL-Job的核心特性包括:

1. **调度中心和执行器分离**: 调度中心负责任务调度,执行器负责任务执行,职责清晰
2. **动态任务管理**: 支持动态添加、修改、删除任务,无需重启应用
3. **任务监控**: 支持任务执行监控、执行日志查看、执行报表统计
4. **故障转移**: 支持任务失败重试、故障转移,提高任务执行可靠性
5. **多种执行模式**: 支持Bean模式、GLUE模式(Java/Shell/Python等)
6. **任务路由策略**: 支持FIRST、LAST、ROUND、RANDOM、CONSISTENT_HASH等多种路由策略
7. **阻塞处理策略**: 支持SERIAL_EXECUTION、DISCARD_LATER、COVER_EARLY等阻塞处理策略
8. **Web管理界面**: 提供友好的Web管理界面,方便任务管理

### XXL-Job的核心概念

1. **调度中心(Admin)**: XXL-Job的调度中心,负责任务调度、任务管理、执行器管理
2. **执行器(Executor)**: 嵌入到业务系统中的组件,负责任务的实际执行
3. **任务(Job)**: 要执行的具体工作,支持Bean模式和GLUE模式
4. **JobHandler**: Bean模式任务的处理器,使用`@JobHandler`注解标识
5. **GLUE模式**: 动态代码模式,任务代码存储在数据库中,支持动态更新
6. **任务路由策略**: 当有多个执行器实例时,选择哪个实例执行任务的策略
7. **阻塞处理策略**: 当任务正在执行时,新的调度请求如何处理

### XXL-Job和Quartz的区别

1. **架构**: XXL-Job采用调度中心+执行器分离架构;Quartz是单体架构
2. **管理界面**: XXL-Job提供Web管理界面;Quartz没有
3. **动态管理**: XXL-Job支持动态任务管理;Quartz需要代码配置
4. **监控**: XXL-Job提供任务监控和日志查看;Quartz需要自己实现
5. **学习成本**: XXL-Job学习成本低,上手快;Quartz学习成本较高

## 调度中心安装和配置

### 下载XXL-Job调度中心

从XXL-Job官网下载最新版本: https://github.com/xuxueli/xxl-job

```bash
# 克隆XXL-Job源码
git clone https://github.com/xuxueli/xxl-job.git
cd xxl-job
# 或者直接下载release版本
wget https://github.com/xuxueli/xxl-job/releases/download/2.4.0/xxl-job-2.4.0.tar.gz
tar -xzf xxl-job-2.4.0.tar.gz
```

### 初始化数据库

XXL-Job需要MySQL数据库存储任务信息,先创建数据库并执行初始化脚本:

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `xxl_job` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `xxl_job`;
-- 执行初始化脚本(脚本位置: xxl-job/doc/db/tables_xxl_job.sql)
-- 以下是主要表结构
-- 执行器信息表
CREATE TABLE `xxl_job_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `appname` varchar(64) NOT NULL COMMENT '执行器AppName',
  `title` varchar(255) NOT NULL COMMENT '执行器名称',
  `address_type` tinyint(4) NOT NULL DEFAULT '0' COMMENT '执行器地址类型:0=自动注册、1=手动录入',
  `address_list` text COMMENT '执行器地址列表,多地址逗号分隔',
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 任务信息表
CREATE TABLE `xxl_job_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_group` int(11) NOT NULL COMMENT '执行器主键ID',
  `job_desc` varchar(255) NOT NULL,
  `add_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  `author` varchar(64) DEFAULT NULL COMMENT '作者',
  `alarm_email` varchar(255) DEFAULT NULL COMMENT '报警邮件',
  `schedule_type` varchar(50) NOT NULL DEFAULT 'NONE' COMMENT '调度类型',
  `schedule_conf` varchar(128) DEFAULT NULL COMMENT '调度配置,值含义取决于调度类型',
  `misfire_strategy` varchar(50) NOT NULL DEFAULT 'DO_NOTHING' COMMENT '调度过期策略',
  `executor_route_strategy` varchar(50) DEFAULT NULL COMMENT '执行器路由策略',
  `executor_handler` varchar(255) DEFAULT NULL COMMENT '执行器任务handler',
  `executor_param` varchar(512) DEFAULT NULL COMMENT '执行器任务参数',
  `executor_block_strategy` varchar(50) DEFAULT NULL COMMENT '阻塞处理策略',
  `executor_timeout` int(11) NOT NULL DEFAULT '0' COMMENT '任务执行超时时间,单位秒',
  `executor_fail_retry_count` int(11) NOT NULL DEFAULT '0' COMMENT '失败重试次数',
  `glue_type` varchar(50) NOT NULL COMMENT 'GLUE类型',
  `glue_source` mediumtext COMMENT 'GLUE源代码',
  `glue_remark` varchar(128) DEFAULT NULL COMMENT 'GLUE备注',
  `glue_updatetime` datetime DEFAULT NULL COMMENT 'GLUE更新时间',
  `child_jobid` varchar(255) DEFAULT NULL COMMENT '子任务ID,多个逗号分隔',
  `trigger_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '调度状态:0-停止,1-运行',
  `trigger_last_time` bigint(13) NOT NULL DEFAULT '0' COMMENT '上次调度时间',
  `trigger_next_time` bigint(13) NOT NULL DEFAULT '0' COMMENT '下次调度时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 任务日志表
CREATE TABLE `xxl_job_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `job_group` int(11) NOT NULL COMMENT '执行器主键ID',
  `job_id` int(11) NOT NULL COMMENT '任务,主键ID',
  `executor_address` varchar(255) DEFAULT NULL COMMENT '执行器地址,本次执行的地址',
  `executor_handler` varchar(255) DEFAULT NULL COMMENT '执行器任务handler',
  `executor_param` varchar(512) DEFAULT NULL COMMENT '执行器任务参数',
  `executor_sharding_param` varchar(20) DEFAULT NULL COMMENT '执行器任务分片参数',
  `executor_fail_retry_count` int(11) NOT NULL DEFAULT '0' COMMENT '失败重试次数',
  `trigger_time` datetime DEFAULT NULL COMMENT '调度-时间',
  `trigger_code` int(11) NOT NULL COMMENT '调度-结果',
  `trigger_msg` text COMMENT '调度-日志',
  `handle_time` datetime DEFAULT NULL COMMENT '执行-时间',
  `handle_code` int(11) NOT NULL COMMENT '执行-状态',
  `handle_msg` text COMMENT '执行-日志',
  PRIMARY KEY (`id`),
  KEY `I_trigger_time` (`trigger_time`),
  KEY `I_handle_code` (`handle_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 任务日志报表表
CREATE TABLE `xxl_job_log_report` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trigger_day` datetime DEFAULT NULL COMMENT '调度-时间',
  `running_count` int(11) NOT NULL DEFAULT '0' COMMENT '运行中-日志数量',
  `suc_count` int(11) NOT NULL DEFAULT '0' COMMENT '执行成功-日志数量',
  `fail_count` int(11) NOT NULL DEFAULT '0' COMMENT '执行失败-日志数量',
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `i_trigger_day` (`trigger_day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 任务注册表
CREATE TABLE `xxl_job_registry` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registry_group` varchar(50) NOT NULL,
  `registry_key` varchar(255) NOT NULL,
  `registry_value` varchar(255) NOT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `i_g_k_v` (`registry_group`,`registry_key`,`registry_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 用户表
CREATE TABLE `xxl_job_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '账号',
  `password` varchar(50) NOT NULL COMMENT '密码',
  `role` tinyint(4) NOT NULL COMMENT '角色:0-普通用户、1-管理员',
  `permission` varchar(255) DEFAULT NULL COMMENT '权限:执行器ID列表,多个逗号分隔',
  PRIMARY KEY (`id`),
  UNIQUE KEY `i_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 初始化默认用户(用户名:admin,密码:123456)
INSERT INTO `xxl_job_user` (`id`, `username`, `password`, `role`, `permission`) VALUES
(1, 'admin', 'e10adc3949ba59abbe56e057f20f883e', 1, NULL);
```

### 配置调度中心

修改`xxl-job-admin/src/main/resources/application.properties`文件:

```properties
### 调度中心JDBC链接:链接地址请保持和所创建的调度数据库的地址一致
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/xxl_job?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai
spring.datasource.username=root
spring.datasource.password=root_pwd
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
### 报警邮箱
spring.mail.host=smtp.qq.com
spring.mail.port=25
spring.mail.username=xxx@qq.com
spring.mail.password=xxx
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.socketFactory.class=javax.net.ssl.SSLSocketFactory
### 调度中心通讯TOKEN[选填]:非空时启用;
xxl.job.accessToken=
### 调度中心通讯超时时间[选填],单位秒;默认3s;
xxl.job.timeout=3
```

### 启动调度中心

```bash
# 进入调度中心目录
cd xxl-job/xxl-job-admin
# Maven编译打包
mvn clean package -DskipTests
# 启动调度中心
java -jar target/xxl-job-admin-2.4.0.jar
# 或者使用IDE直接运行XxlJobAdminApplication
```

启动成功后,访问 http://localhost:8080/xxl-job-admin,默认用户名密码都是`admin`。

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-xxl-job-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── job/                      # JobHandler目录
│   │   │               ├── config/                   # 配置类目录
│   │   │               └── controller/               # 控制器目录
│   │   └── resources/
│   │       └── application.yml       # 配置文件
│   └── test/
└── README.md
```

### 添加Maven依赖

在`pom.xml`中添加Spring Boot 4和XXL-Job的依赖:

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
    <artifactId>spring-boot-xxl-job-demo</artifactId>
    <version>1.0.0</version>
    <name>Spring Boot XXL-Job Demo</name>
    <properties>
        <java.version>21</java.version>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <xxl-job.version>2.4.0</xxl-job.version>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- XXL-Job Core -->
        <dependency>
            <groupId>com.xuxueli</groupId>
            <artifactId>xxl-job-core</artifactId>
            <version>${xxl-job.version}</version>
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

## 执行器配置

### application.yml配置

配置XXL-Job执行器:

```yaml
spring:
  application:
    name: spring-boot-xxl-job-demo
# XXL-Job配置
xxl:
  job:
    # 调度中心地址列表,多个地址用逗号分隔
    admin:
      addresses: http://127.0.0.1:8080/xxl-job-admin
    # 执行器配置
    executor:
      # 执行器AppName,用于分组
      appname: xxl-job-executor-demo
      # 执行器IP,为空则自动获取
      ip: 
      # 执行器端口,默认9999
      port: 9999
      # 执行器日志路径
      logpath: /data/applogs/xxl-job/jobhandler
      # 执行器日志保留天数,默认30天
      logretentiondays: 30
    # 访问令牌,调度中心和执行器通信时使用,非空时启用
    accessToken: 
```

### application.properties配置

如果喜欢用properties格式:

```properties
# XXL-Job配置
xxl.job.admin.addresses=http://127.0.0.1:8080/xxl-job-admin
xxl.job.executor.appname=xxl-job-executor-demo
xxl.job.executor.ip=
xxl.job.executor.port=9999
xxl.job.executor.logpath=/data/applogs/xxl-job/jobhandler
xxl.job.executor.logretentiondays=30
xxl.job.accessToken=
```

### 配置XxlJobSpringExecutor

创建配置类,配置`XxlJobSpringExecutor` Bean:

```java
package com.example.demo.config;
import com.xxl.job.core.executor.impl.XxlJobSpringExecutor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * XXL-Job配置类
 * 配置执行器
 * 
 * @author penglei
 */
@Slf4j
@Configuration
public class XxlJobConfig {
    @Value("${xxl.job.admin.addresses}")
    private String adminAddresses;  // 调度中心地址列表
    @Value("${xxl.job.executor.appname}")
    private String appname;  // 执行器AppName
    @Value("${xxl.job.executor.ip:}")
    private String ip;  // 执行器IP
    @Value("${xxl.job.executor.port:9999}")
    private int port;  // 执行器端口
    @Value("${xxl.job.executor.logpath:/data/applogs/xxl-job/jobhandler}")
    private String logPath;  // 执行器日志路径
    @Value("${xxl.job.executor.logretentiondays:30}")
    private int logRetentionDays;  // 执行器日志保留天数
    @Value("${xxl.job.accessToken:}")
    private String accessToken;  // 访问令牌
    /**
     * 配置XxlJobSpringExecutor
     * 执行器核心配置,负责连接调度中心、注册执行器、接收任务调度请求
     * 
     * @return XxlJobSpringExecutor实例
     */
    @Bean(initMethod = "start", destroyMethod = "destroy")
    public XxlJobSpringExecutor xxlJobExecutor() {
        log.info(">>>>>>>>>>> xxl-job config init.");
        XxlJobSpringExecutor xxlJobSpringExecutor = new XxlJobSpringExecutor();
        // 设置调度中心地址列表,多个地址用逗号分隔
        xxlJobSpringExecutor.setAdminAddresses(adminAddresses);
        // 设置执行器AppName,用于分组,调度中心会根据AppName找到对应的执行器
        xxlJobSpringExecutor.setAppname(appname);
        // 设置执行器IP,为空则自动获取
        xxlJobSpringExecutor.setIp(ip);
        // 设置执行器端口,默认9999,执行器会在这个端口启动一个Jetty服务器接收调度请求
        xxlJobSpringExecutor.setPort(port);
        // 设置访问令牌,调度中心和执行器通信时使用,非空时启用
        xxlJobSpringExecutor.setAccessToken(accessToken);
        // 设置执行器日志路径,任务执行日志会保存在这个路径下
        xxlJobSpringExecutor.setLogPath(logPath);
        // 设置执行器日志保留天数,超过这个天数的日志会被自动删除
        xxlJobSpringExecutor.setLogRetentionDays(logRetentionDays);
        log.info(">>>>>>>>>>> xxl-job config init success. adminAddresses:{}, appname:{}, ip:{}, port:{}", 
                adminAddresses, appname, ip, port);
        return xxlJobSpringExecutor;
    }
}
```

## 开发任务(Bean模式)

### 创建JobHandler

Bean模式任务需要实现`IJobHandler`接口,并使用`@JobHandler`注解标识:

```java
package com.example.demo.job;
import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.annotation.XxlJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
/**
 * 简单的定时任务示例
 * Bean模式任务,使用@XxlJob注解标识
 * 
 * @author penglei
 */
@Slf4j
@Component
public class SimpleJobHandler {
    /**
     * 简单的定时任务
     * @XxlJob注解标识这是一个XXL-Job任务
     * value属性指定任务名称,在调度中心创建任务时需要填写这个名称
     * 
     * 任务执行逻辑:
     * 1. 通过XxlJobHelper获取任务参数
     * 2. 执行具体业务逻辑
     * 3. 记录执行日志
     */
    @XxlJob("simpleJobHandler")
    public void execute() {
        // 获取任务参数,调度中心创建任务时可以传递参数
        String param = XxlJobHelper.getJobParam();
        log.info("执行简单任务,参数: {}", param);
        // 获取分片参数,用于分片任务
        int shardIndex = XxlJobHelper.getShardIndex();  // 当前分片索引
        int shardTotal = XxlJobHelper.getShardTotal();  // 总分片数
        log.info("分片参数: {}/{}", shardIndex, shardTotal);
        try {
            // 这里写你的业务逻辑
            log.info("开始执行业务逻辑...");
            Thread.sleep(1000);  // 模拟业务处理
            log.info("业务逻辑执行完成");
            // 设置执行结果,成功
            XxlJobHelper.handleSuccess("任务执行成功");
        } catch (Exception e) {
            log.error("任务执行失败", e);
            // 设置执行结果,失败
            XxlJobHelper.handleFail("任务执行失败: " + e.getMessage());
        }
    }
}
```

### 带参数的任务

```java
package com.example.demo.job;
import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.annotation.XxlJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
/**
 * 带参数的任务示例
 * 
 * @author penglei
 */
@Slf4j
@Component
public class ParamJobHandler {
    /**
     * 带参数的任务
     * 任务参数可以通过调度中心传递,格式可以是JSON字符串
     */
    @XxlJob("paramJobHandler")
    public void execute() {
        // 获取任务参数
        String param = XxlJobHelper.getJobParam();
        log.info("任务参数: {}", param);
        // 解析参数(假设是JSON格式)
        // JSONObject jsonObject = JSON.parseObject(param);
        // String userId = jsonObject.getString("userId");
        try {
            // 执行业务逻辑
            log.info("处理参数: {}", param);
            Thread.sleep(2000);
            XxlJobHelper.handleSuccess("处理完成");
        } catch (Exception e) {
            log.error("处理失败", e);
            XxlJobHelper.handleFail("处理失败: " + e.getMessage());
        }
    }
}
```

### 分片任务

```java
package com.example.demo.job;
import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.annotation.XxlJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
/**
 * 分片任务示例
 * 分片任务可以将大量数据分成多个片段,多个执行器实例并行处理
 * 
 * @author penglei
 */
@Slf4j
@Component
public class ShardingJobHandler {
    /**
     * 分片任务示例
     * 假设要处理1000条数据,有3个执行器实例
     * 每个实例处理一部分数据,提高处理效率
     */
    @XxlJob("shardingJobHandler")
    public void execute() {
        // 获取分片参数
        int shardIndex = XxlJobHelper.getShardIndex();  // 当前分片索引,从0开始
        int shardTotal = XxlJobHelper.getShardTotal();  // 总分片数
        log.info("分片参数: {}/{}", shardIndex, shardTotal);
        // 假设要处理1000条数据
        int totalCount = 1000;
        // 计算当前分片要处理的数据范围
        int countPerShard = totalCount / shardTotal;  // 每个分片处理的数据量
        int startIndex = shardIndex * countPerShard;  // 起始索引
        int endIndex = (shardIndex == shardTotal - 1) ? totalCount : (shardIndex + 1) * countPerShard;  // 结束索引
        log.info("分片{}处理数据范围: {} - {}", shardIndex, startIndex, endIndex);
        try {
            // 处理当前分片的数据
            for (int i = startIndex; i < endIndex; i++) {
                log.info("处理第{}条数据", i);
                // 这里写你的业务逻辑
                Thread.sleep(100);
            }
            XxlJobHelper.handleSuccess(String.format("分片%d处理完成,处理了%d条数据", shardIndex, endIndex - startIndex));
        } catch (Exception e) {
            log.error("分片任务执行失败", e);
            XxlJobHelper.handleFail("分片任务执行失败: " + e.getMessage());
        }
    }
}
```

### 注入Spring Bean的任务

```java
package com.example.demo.job;
import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.annotation.XxlJob;
import com.example.demo.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
/**
 * 注入Spring Bean的任务示例
 * JobHandler是Spring Bean,可以注入其他Spring Bean
 * 
 * @author penglei
 */
@Slf4j
@Component
public class SpringBeanJobHandler {
    @Autowired
    private UserService userService;  // 注入Spring Bean
    /**
     * 使用Spring Bean的任务
     */
    @XxlJob("springBeanJobHandler")
    public void execute() {
        log.info("执行Spring Bean任务");
        try {
            // 使用注入的Spring Bean
            // List<User> users = userService.getAllUsers();
            // log.info("用户数量: {}", users.size());
            // 执行业务逻辑
            Thread.sleep(1000);
            XxlJobHelper.handleSuccess("任务执行成功");
        } catch (Exception e) {
            log.error("任务执行失败", e);
            XxlJobHelper.handleFail("任务执行失败: " + e.getMessage());
        }
    }
}
```

### 支持停止的任务

如果任务需要支持停止功能,必须正确处理`InterruptedException`:

```java
package com.example.demo.job;
import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.annotation.XxlJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
/**
 * 支持停止的任务示例
 * 要支持停止功能,必须正确处理InterruptedException
 * 
 * @author penglei
 */
@Slf4j
@Component
public class StoppableJobHandler {
    /**
     * 支持停止的任务
     * 当调度中心点击停止按钮时,会中断任务线程
     * 任务必须正确处理InterruptedException才能被停止
     */
    @XxlJob("stoppableJobHandler")
    public void execute() {
        log.info("开始执行可停止任务");
        try {
            // 模拟长时间运行的任务
            for (int i = 0; i < 100; i++) {
                // 检查是否被中断
                if (Thread.currentThread().isInterrupted()) {
                    log.info("任务被中断,停止执行");
                    return;
                }
                log.info("处理第{}次", i);
                Thread.sleep(1000);  // sleep会抛出InterruptedException
            }
            XxlJobHelper.handleSuccess("任务执行完成");
        } catch (InterruptedException e) {
            // 必须重新抛出InterruptedException,否则停止功能无效
            log.info("任务被中断");
            Thread.currentThread().interrupt();  // 恢复中断状态
            throw new RuntimeException("任务被中断", e);
        } catch (Exception e) {
            log.error("任务执行失败", e);
            XxlJobHelper.handleFail("任务执行失败: " + e.getMessage());
        }
    }
}
```

## 在调度中心创建任务

### 创建执行器

1. 登录调度中心: http://localhost:8080/xxl-job-admin
2. 进入"执行器管理"页面
3. 点击"新增"按钮,填写执行器信息:

- AppName: `xxl-job-executor-demo` (必须和配置文件中的appname一致)
- 名称: `XXL-Job执行器示例`
- 注册方式: `自动注册` (执行器会自动注册到调度中心)
- 机器地址: 留空(自动注册时会自动填写)
4. 点击"保存"按钮

### 创建任务

1. 进入"任务管理"页面
2. 点击"新增"按钮,填写任务信息:

- 执行器: 选择刚才创建的执行器
- 任务描述: `简单任务示例`
- 运行模式: `BEAN模式`
- JobHandler: `simpleJobHandler` (必须和@XxlJob注解的value一致)
- 调度类型: `CRON`
- Cron表达式: `0/10 * * * * ?` (每10秒执行一次)
- 运行模式: `BEAN模式`
- 阻塞处理策略: `单机串行` (同一实例串行执行)
- 任务超时时间: `0` (0表示不超时)
- 失败重试次数: `0` (失败不重试)
3. 点击"保存"按钮
4. 点击"启动"按钮启动任务

## 任务路由策略

XXL-Job支持多种任务路由策略,当有多个执行器实例时,选择哪个实例执行任务:

1. **FIRST(第一个)**: 固定选择第一个执行器
2. **LAST(最后一个)**: 固定选择最后一个执行器
3. **ROUND(轮询)**: 轮询选择执行器
4. **RANDOM(随机)**: 随机选择执行器
5. **CONSISTENT_HASH(一致性HASH)**: 根据任务ID进行一致性HASH选择
6. **SHARDING_BROADCAST(分片广播)**: 所有执行器都执行,用于分片任务
7. **LEAST_FREQUENTLY_USED(最不经常使用)**: 选择使用频率最低的执行器
8. **LEAST_RECENTLY_USED(最近最久未使用)**: 选择最近最久未使用的执行器
9. **FAILOVER(故障转移)**: 按照顺序依次进行心跳检测,第一个心跳检测成功的机器选定为目标执行器并发起调度
10. **BUSYOVER(忙碌转移)**: 按照顺序依次进行空闲检测,第一个空闲检测成功的机器选定为目标执行器并发起调度

## 阻塞处理策略

当任务正在执行时,新的调度请求如何处理:

1. **SERIAL_EXECUTION(单机串行)**: 同一实例串行执行,后面的请求等待
2. **DISCARD_LATER(丢弃后续调度)**: 同一实例正在执行时,后续调度请求丢弃
3. **COVER_EARLY(覆盖之前调度)**: 同一实例正在执行时,后续调度请求覆盖之前的调度

## 任务监控和日志

### 查看任务执行日志

1. 进入"任务管理"页面
2. 点击任务列表中的"执行日志"按钮
3. 可以查看任务的执行历史、执行状态、执行时间、执行结果等

### 查看执行器状态

1. 进入"执行器管理"页面
2. 可以查看执行器的在线状态、注册时间、心跳时间等

### 任务执行报表

1. 进入"调度报表"页面
2. 可以查看任务的执行统计、成功率、失败率等

## 启动类和测试

### 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 XXL-Job示例应用启动类
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

1. 启动应用后,执行器会自动注册到调度中心
2. 在调度中心可以看到执行器在线状态
3. 创建任务后,任务会按照Cron表达式自动执行
4. 可以在执行日志中查看任务执行情况

## GLUE模式任务(可选)

GLUE模式任务支持动态代码,任务代码存储在数据库中,支持动态更新:

### 创建GLUE模式任务

1. 在调度中心创建任务时,选择"GLUE模式"
2. 选择GLUE类型: `GLUE(Java)`
3. 在"GLUE代码"编辑器中编写Java代码:

```java
package com.xxl.job.core.glue.impl;
import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.IJobHandler;
/**
 * GLUE模式任务代码
 * 必须实现IJobHandler接口
 */
public class GlueJobHandler extends IJobHandler {
    @Override
    public void execute() throws Exception {
        // 获取任务参数
        String param = XxlJobHelper.getJobParam();
        XxlJobHelper.log("GLUE模式任务执行,参数: " + param);
        // 执行业务逻辑
        XxlJobHelper.log("开始执行业务逻辑...");
        Thread.sleep(1000);
        XxlJobHelper.log("业务逻辑执行完成");
        // 设置执行结果
        XxlJobHelper.handleSuccess("GLUE模式任务执行成功");
    }
}
```

1. 点击"保存"按钮
2. 任务代码会保存在数据库中,可以随时修改

## 最佳实践

1. **执行器AppName要唯一**: 不同应用的执行器AppName要不同,避免冲突
2. **任务Handler名称要唯一**: 同一个执行器内的任务Handler名称要唯一
3. **合理设置任务超时时间**: 根据任务执行时间合理设置超时时间,避免任务长时间占用资源
4. **合理设置失败重试次数**: 根据业务需求设置重试次数,避免无限重试
5. **使用分片任务处理大数据**: 对于需要处理大量数据的任务,使用分片任务提高处理效率
6. **正确处理InterruptedException**: 如果任务需要支持停止功能,必须正确处理InterruptedException
7. **记录详细的执行日志**: 在任务中记录详细的执行日志,方便问题排查
8. **使用Bean模式**: 优先使用Bean模式,代码更清晰,便于维护
9. **监控任务执行**: 定期查看任务执行日志和报表,及时发现问题
10. **设置告警邮箱**: 在调度中心配置告警邮箱,任务执行失败时及时通知

## 总结

Spring Boot 4整合XXL-Job非常方便,只需要添加依赖、配置执行器、开发JobHandler就能用;调度中心提供Web管理界面,方便任务管理;支持多种路由策略和阻塞处理策略,满足不同场景需求;任务监控和日志功能完善,方便问题排查;兄弟们根据实际需求选择合适的配置,就能轻松搞定分布式任务调度了。
