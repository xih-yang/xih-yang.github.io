# 01、XXL-JOB 源码分析 - 源码阅读架构设计及目录介绍
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/1.html
- 分类：作业调度
- 分组：XXL-JOB 源码解析
## 一、架构设计

xxl-job主要包含两部分，一是调度器，调度器需要独立部署；二是执行器，执行器作为maven依赖继承到我们的业务系统中，使用业务系统的资源做任务执行。

（未使用过的同学可以先看一下官方文档使用指南）

https://www.xuxueli.com/xxl-job/#5.3%20%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1

官方架构图如下：

## 二、目录结构

xxl-job目录下分了三个maven子项目：

子项目
说明

xxl-job-admin
调度器服务，需要独立部署

xxj-job-core
执行器，同时含有一些调度器也需要的公共代码

xxl-job-executor-samples
执行器的示例代码，模拟一个业务系统

### xxl-job-admin目录结构

目录
说明

core.alarm
报警相关处理，默认实现了一个报警邮件发送

core.conf
配置项

core.cron
提供cron表达式的解析器

core.exception
自定义异常类

core.model
domain

core.old
已被移除的一些历史实现

core.route
执行器的路由策略

core.scheduler
调度器的核心启动流程

core.thread
调度器的各个守护线程

core.trigger
调度器分发任务到执行器的trigger

dao
数据库操作

service
service层

controller
controller层及一些拦截器

### xxl-core目录结构

目录
说明

biz.client
提供执行器与调度器互相调用的api相关的逻辑

biz.enums
排队策略等枚举

biz.executor
执行器启动主流程

biz.glue
胶水代码相关

biz.handler
JobHandler相关

biz.log
log配置

biz.server
执行器命令接收服务

biz.thread
执行器端线程

目录部分大致了解，接下来我们先从调度器启动流程入手，逐步讲解。
