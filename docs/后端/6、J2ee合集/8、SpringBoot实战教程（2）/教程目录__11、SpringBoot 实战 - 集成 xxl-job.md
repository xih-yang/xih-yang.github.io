# 11、SpringBoot 实战 - 集成 xxl-job
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/11.html
- 分类：J2EE框架
- 分组：教程目录
## 1.简介

**xxl-job：** 是一个分布式任务调度平台。平台架构分为 “调度中心” 和 “执行器”。调度中心类似定时任务的注册中心，用于统一管理定时任务；执行器用于执行定时任务。

**注意：** xxl-job 集成不同于其他项目，xxl-job 本身有非常完整的文档和代码示例，本文只是精简记录集成步骤。

**环境：** Maven3+、Jdk1.8+、Mysql5.7+

**官网地址：**[https://www.xuxueli.com/index.html](https://www.xuxueli.com/index.html)

**官方文档：**[https://www.xuxueli.com/xxl-job/](https://www.xuxueli.com/xxl-job/)

**官方代码示例-GitHub：**[https://github.com/xuxueli/xxl-job](https://github.com/xuxueli/xxl-job)

**官方代码示例-Gitee：**[https://gitee.com/xuxueli0323/xxl-job](https://gitee.com/xuxueli0323/xxl-job)

## 2.Maven依赖

```xml
<!-- http://repo1.maven.org/maven2/com/xuxueli/xxl-job-core/ -->
<dependency>
    <groupId>com.xuxueli</groupId>
    <artifactId>xxl-job-core</artifactId>
    <version>${最新稳定版本}</version>
</dependency>
```

## 3.初始化数据库

- **xxl_job_lock**：任务调度锁表；
- **xxl_job_info**：调度扩展信息表；
- **xxl_job_group**：执行器信息表；
- **xxl_job_log**：调度日志表；
- **xxl_job_log_report**：调度日志报表；
- **xxl_job_logglue**：任务GLUE日志；
- **xxl_job_registry**：执行器注册表，维护在线的执行器和调度中心机器地址信息；
- **xxl_job_user**：系统用户表。

```java
#
# XXL-JOB v2.4.0-SNAPSHOT
# Copyright (c) 2015-present, xuxueli.
CREATE database if NOT EXISTS xxl_job default character set utf8mb4 collate utf8mb4_unicode_ci;
use xxl_job;
SET NAMES utf8mb4;
CREATE TABLE xxl_job_info (
  id int(11) NOT NULL AUTO_INCREMENT,
  job_group int(11) NOT NULL COMMENT '执行器主键ID',
  job_desc varchar(255) NOT NULL,
  add_time datetime DEFAULT NULL,
  update_time datetime DEFAULT NULL,
  author varchar(64) DEFAULT NULL COMMENT '作者',
  alarm_email varchar(255) DEFAULT NULL COMMENT '报警邮件',
  schedule_type varchar(50) NOT NULL DEFAULT 'NONE' COMMENT '调度类型',
  schedule_conf varchar(128) DEFAULT NULL COMMENT '调度配置，值含义取决于调度类型',
  misfire_strategy varchar(50) NOT NULL DEFAULT 'DO_NOTHING' COMMENT '调度过期策略',
  executor_route_strategy varchar(50) DEFAULT NULL COMMENT '执行器路由策略',
  executor_handler varchar(255) DEFAULT NULL COMMENT '执行器任务handler',
  executor_param varchar(512) DEFAULT NULL COMMENT '执行器任务参数',
  executor_block_strategy varchar(50) DEFAULT NULL COMMENT '阻塞处理策略',
  executor_timeout int(11) NOT NULL DEFAULT '0' COMMENT '任务执行超时时间，单位秒',
  executor_fail_retry_count int(11) NOT NULL DEFAULT '0' COMMENT '失败重试次数',
  glue_type varchar(50) NOT NULL COMMENT 'GLUE类型',
  glue_source mediumtext COMMENT 'GLUE源代码',
  glue_remark varchar(128) DEFAULT NULL COMMENT 'GLUE备注',
  glue_updatetime datetime DEFAULT NULL COMMENT 'GLUE更新时间',
  child_jobid varchar(255) DEFAULT NULL COMMENT '子任务ID，多个逗号分隔',
  trigger_status tinyint(4) NOT NULL DEFAULT '0' COMMENT '调度状态：0-停止，1-运行',
  trigger_last_time bigint(13) NOT NULL DEFAULT '0' COMMENT '上次调度时间',
  trigger_next_time bigint(13) NOT NULL DEFAULT '0' COMMENT '下次调度时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE xxl_job_log (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  job_group int(11) NOT NULL COMMENT '执行器主键ID',
  job_id int(11) NOT NULL COMMENT '任务，主键ID',
  executor_address varchar(255) DEFAULT NULL COMMENT '执行器地址，本次执行的地址',
  executor_handler varchar(255) DEFAULT NULL COMMENT '执行器任务handler',
  executor_param varchar(512) DEFAULT NULL COMMENT '执行器任务参数',
  executor_sharding_param varchar(20) DEFAULT NULL COMMENT '执行器任务分片参数，格式如 1/2',
  executor_fail_retry_count int(11) NOT NULL DEFAULT '0' COMMENT '失败重试次数',
  trigger_time datetime DEFAULT NULL COMMENT '调度-时间',
  trigger_code int(11) NOT NULL COMMENT '调度-结果',
  trigger_msg text COMMENT '调度-日志',
  handle_time datetime DEFAULT NULL COMMENT '执行-时间',
  handle_code int(11) NOT NULL COMMENT '执行-状态',
  handle_msg text COMMENT '执行-日志',
  alarm_status tinyint(4) NOT NULL DEFAULT '0' COMMENT '告警状态：0-默认、1-无需告警、2-告警成功、3-告警失败',
  PRIMARY KEY (id),
  KEY I_trigger_time (trigger_time),
  KEY I_handle_code (handle_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE xxl_job_log_report (
  id int(11) NOT NULL AUTO_INCREMENT,
  trigger_day datetime DEFAULT NULL COMMENT '调度-时间',
  running_count int(11) NOT NULL DEFAULT '0' COMMENT '运行中-日志数量',
  suc_count int(11) NOT NULL DEFAULT '0' COMMENT '执行成功-日志数量',
  fail_count int(11) NOT NULL DEFAULT '0' COMMENT '执行失败-日志数量',
  update_time datetime DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY i_trigger_day (trigger_day) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE xxl_job_logglue (
  id int(11) NOT NULL AUTO_INCREMENT,
  job_id int(11) NOT NULL COMMENT '任务，主键ID',
  glue_type varchar(50) DEFAULT NULL COMMENT 'GLUE类型',
  glue_source mediumtext COMMENT 'GLUE源代码',
  glue_remark varchar(128) NOT NULL COMMENT 'GLUE备注',
  add_time datetime DEFAULT NULL,
  update_time datetime DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE xxl_job_registry (
  id int(11) NOT NULL AUTO_INCREMENT,
  registry_group varchar(50) NOT NULL,
  registry_key varchar(255) NOT NULL,
  registry_value varchar(255) NOT NULL,
  update_time datetime DEFAULT NULL,
  PRIMARY KEY (id),
  KEY i_g_k_v (registry_group,registry_key,registry_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE xxl_job_group (
  id int(11) NOT NULL AUTO_INCREMENT,
  app_name varchar(64) NOT NULL COMMENT '执行器AppName',
  title varchar(12) NOT NULL COMMENT '执行器名称',
  address_type tinyint(4) NOT NULL DEFAULT '0' COMMENT '执行器地址类型：0=自动注册、1=手动录入',
  address_list text COMMENT '执行器地址列表，多地址逗号分隔',
  update_time datetime DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE xxl_job_user (
  id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(50) NOT NULL COMMENT '账号',
  password varchar(50) NOT NULL COMMENT '密码',
  role tinyint(4) NOT NULL COMMENT '角色：0-普通用户、1-管理员',
  permission varchar(255) DEFAULT NULL COMMENT '权限：执行器ID列表，多个逗号分割',
  PRIMARY KEY (id),
  UNIQUE KEY i_username (username) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE xxl_job_lock (
  lock_name varchar(50) NOT NULL COMMENT '锁名称',
  PRIMARY KEY (lock_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO xxl_job_group(id, app_name, title, address_type, address_list, update_time) VALUES (1, 'xxl-job-executor-sample', '示例执行器', 0, NULL, '2018-11-03 22:21:31' );
INSERT INTO xxl_job_info(id, job_group, job_desc, add_time, update_time, author, alarm_email, schedule_type, schedule_conf, misfire_strategy, executor_route_strategy, executor_handler, executor_param, executor_block_strategy, executor_timeout, executor_fail_retry_count, glue_type, glue_source, glue_remark, glue_updatetime, child_jobid) VALUES (1, 1, '测试任务1', '2018-11-03 22:21:31', '2018-11-03 22:21:31', 'XXL', '', 'CRON', '0 0 0 * * ? *', 'DO_NOTHING', 'FIRST', 'demoJobHandler', '', 'SERIAL_EXECUTION', 0, 0, 'BEAN', '', 'GLUE代码初始化', '2018-11-03 22:21:31', '');
INSERT INTO xxl_job_user(id, username, password, role, permission) VALUES (1, 'admin', 'e10adc3949ba59abbe56e057f20f883e', 1, NULL);
INSERT INTO xxl_job_lock ( lock_name) VALUES ( 'schedule_lock');
commit;
```

## 4.调度中心配置

**xxl-job-admin/src/main/resources/application.properties**

```java
### 调度中心JDBC链接：链接地址请保持和 2.1章节 所创建的调度数据库的地址一致
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/xxl_job?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai
spring.datasource.username=root
spring.datasource.password=root_pwd
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
### 报警邮箱
spring.mail.host=smtp.qq.com
spring.mail.port=25
spring.mail.username=xxx@qq.com
spring.mail.password=xxx
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.socketFactory.class=javax.net.ssl.SSLSocketFactory
### 调度中心通讯TOKEN [选填]：非空时启用；
xxl.job.accessToken=
### 调度中心国际化配置 [必填]： 默认为 "zh_CN"/中文简体, 可选范围为 "zh_CN"/中文简体, "zh_TC"/中文繁体 and "en"/英文；
xxl.job.i18n=zh_CN
## 调度线程池最大线程配置【必填】
xxl.job.triggerpool.fast.max=200
xxl.job.triggerpool.slow.max=100
### 调度中心日志表数据保存天数 [必填]：过期日志自动清理；限制大于等于7时生效，否则, 如-1，关闭自动清理功能；
xxl.job.logretentiondays=30
```

## 5.执行器配置

**xxl-job-executor-sample-springboot/src/main/resources/application.properties**

```java
### 调度中心部署根地址 [选填]：如调度中心集群部署存在多个地址则用逗号分隔。执行器将会使用该地址进行"执行器心跳注册"和"任务结果回调"；为空则关闭自动注册；
xxl.job.admin.addresses=http://127.0.0.1:8080/xxl-job-admin
### 执行器通讯TOKEN [选填]：非空时启用；
xxl.job.accessToken=
### 执行器AppName [选填]：执行器心跳注册分组依据；为空则关闭自动注册
xxl.job.executor.appname=xxl-job-executor-sample
### 执行器注册 [选填]：优先使用该配置作为注册地址，为空时使用内嵌服务 ”IP:PORT“ 作为注册地址。从而更灵活的支持容器类型执行器动态IP和动态映射端口问题。
xxl.job.executor.address=
### 执行器IP [选填]：默认为空表示自动获取IP，多网卡时可手动设置指定IP，该IP不会绑定Host仅作为通讯实用；地址信息用于 "执行器注册" 和 "调度中心请求并触发任务"；
xxl.job.executor.ip=
### 执行器端口号 [选填]：小于等于0则自动获取；默认端口为9999，单机部署多个执行器时，注意要配置不同执行器端口；
xxl.job.executor.port=9999
### 执行器运行日志文件存储磁盘路径 [选填] ：需要对该路径拥有读写权限；为空则使用默认路径；
xxl.job.executor.logpath=/data/applogs/xxl-job/jobhandler
### 执行器日志文件保存天数 [选填] ： 过期日志自动清理, 限制值大于等于3时生效; 否则, 如-1, 关闭自动清理功能；
xxl.job.executor.logretentiondays=30
```

## 6.项目结构

**启动顺序：**

**1、** xxl-job-admin，调度中心；

**2、** xxl-job-executor-sample-springboot，执行器；

## 7.访问页面

**访问地址：** http://localhost:8080/xxl-job-admin

**登录账号：** admin/123456

## 8.新建定时任务

**1）在任务管理点击“新建”。**

**2）输入相应的信息。**

**其中运行模式有7种，这里介绍其中Java相关的两种：BEAN、GLUE(Java)**

## 9.BEAN运行模式

**BEAN运行模式有两种实现方式：**

- **方法形式：** 通过 @XxlJob 注解修饰方法；

```java
/**
 * 1、简单任务示例（Bean模式）
 */
@XxlJob("demoJobHandler")
public void demoJobHandler() throws Exception {
    XxlJobHelper.log("XXL-JOB, Hello World.");
    for (int i = 0; i < 5; i++) {
        XxlJobHelper.log("beat at:" + i);
        TimeUnit.SECONDS.sleep(2);
    }
    // default success
}
```

- **类形式：** 非springboot项目，在启动main方法中配置注册类，并使用 @XxlJob 注解修饰方法。

```java
// registry job bean
xxlJobExecutor.setXxlJobBeanList(Arrays.asList(new SampleXxlJob()));
```

## 10.GLUE(Java)运行模式

**1）新建任务之后，可以点击“操作”按钮右边的下拉框，选择“GLUE IDE”。**

**2）定制想要实现的Java代码，例如增加一行输出到控制台。**

**3）执行定时任务。**

**4）调度日志菜单中有了任务的执行记录。**

**5）执行器的控制台打印了test。**

## 11.补充说明

### 1）任务执行器报错：java.lang.RuntimeException: xxl-job method-jobhandler param-classtype invalid

具体报错如下：

```java
java.lang.RuntimeException: xxl-job method-jobhandler param-classtype invalid, for[class com.demo.schedual.MySchedule#checkAndUpdateStatus] , The correct method format like " public ReturnT<String> execute(String param) " .
	at com.xxl.job.core.executor.impl.XxlJobSpringExecutor.initJobHandlerMethodRepository(XxlJobSpringExecutor.java:127)
	at com.xxl.job.core.executor.impl.XxlJobSpringExecutor.afterSingletonsInstantiated(XxlJobSpringExecutor.java:41)
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.preInstantiateSingletons(DefaultListableBeanFactory.java:864)
	at org.springframework.context.support.AbstractApplicationContext.finishBeanFactoryInitialization(AbstractApplicationContext.java:877)
	at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:549)
	at org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.refresh(ServletWebServerApplicationContext.java:141)
	at org.springframework.boot.SpringApplication.refresh(SpringApplication.java:744)
	at org.springframework.boot.SpringApplication.refreshContext(SpringApplication.java:391)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:312)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1215)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1204)
	at com.demo.DemoApplication.main(MobileCenterApplication.java:35)
```

**报错原因：**

**定时任务的方法必须是这种形式：public ReturnT execute(String param)**

**需要注意两点：**

**1、** 入参必须是Stringparam；

**2、** 返回值必须是ReturnT；

### 2）cron 中 0/5 和 */5 有什么区别？

在cron 中，“0/5” 和 “*/5” 都表示以步长为 5 的间隔执行任务，但它们在具体使用时稍有不同：

- 0/5：表示从 0 开始，每隔 5 个单位执行一次。
- */5：表示从最小允许值开始，每个 5 个单位执行一次。

整理完毕，完结撒花~
