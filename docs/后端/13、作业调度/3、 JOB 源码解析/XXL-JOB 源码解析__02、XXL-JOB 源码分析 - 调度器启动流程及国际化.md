# 02、XXL-JOB 源码分析 - 调度器启动流程及国际化
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/2.html
- 分类：作业调度
- 分组：XXL-JOB 源码解析
###

先来看一下调度器需要init的表结构。

## 一、 表结构

table
说明

xxl_job_lock
任务调度锁表

xxl_job_info
调度扩展信息表： 用于保存XXL-JOB调度任务的扩展信息

xxl_job_group
执行器信息表，维护任务执行器信息

xxl_job_log
用于保存XXL-JOB任务调度的历史信息，如调度结果

xxl_job_log_report
调度日志报表：用户存储XXL-JOB任务调度日志的报表

xxl_job_logglue
任务GLUE日志：用于保存GLUE更新历史，用于支持GLUE的版本回溯功能

xxl_job_registry
执行器注册表，维护在线的执行器和调度中心机器地址信息

xxl_job_user
系统用户表

from 官方文档（5.2 “调度数据库”配置）

## 二、 启动流程

**1、** xxl-job基于springboot，所以我们可以从XxlJobAdminConfig入手；

可以看到这里，通过实现了InitializingBean.afterPropertiesSet，在spring初始化阶段，实例化了一个XxlJobScheduler，并调用init方法，打开init。

**1、** XxlJobScheduler.init()；

这里的代码易读性很好:

- 加载国际化配置
- 启动管理注册执行器的线程
- 启动处理失败任务，触发报警的线程
- 启动处理“丢失”任务的线程
- 启动两个线程池，用于触发任务
- 启动生成调度报表数据的线程
- 启动两个调度器线程，一个处理粗粒任务，另一个使用时间轮处理秒级粒度任务。

`值得一提，这里启动的诸多背负功能线程都被设置成了守护线程。`

## 三、 国际化

### 3.1 简述

国际化，又称为i18n（因为这个单词从i到n有18个英文字母，因此命名）。

*xxl-job的国际化切换英文版展示*

*xxl-job的国际化切换繁体中文版展示*

### 3.1 配置

#### 资源文件

resources下有一个i18n资源文件夹，下属三个properties文件分别对应英文字典，中文字典，繁体中文字典。

#### 配置项

application.properties中，xxl,job.i18n配置项可配置文件，通过指定上述资源文件名中下划线后半部分 来指定要加载的语言字典。

当前版本xxl官方提供了三种语言字典，我们也可以按照自己的需求配置更多的语言文件副本。

资源字典里面的key并不多，两百六十多行。

`注:使用自定义语言字典还需要简单修改源码的XxlJobAdminConfig.getI18n()。`

### 3.3 源码分析

从前文[调度器表结构及启动流程]中可知，调度器启动时，第一项便是加载国际化资源。

- XxlJobScheduler.initI18n()方法。
- ExecutorBlockStrategyEnum

这里通过加载`阻塞处理策略`的枚举类时，进行了语言字典的加载。
- I18nUtil.getString()
- I18nUtil.loadI18nProp()

这里简单分为三步：

**1、** 资源文件的加载，此处，如果prop不为null则会直接加载语言字典`不需要关心线程冲突，Properties继承Hashtable`；

**2、** 这里的i18n变量便是取自xxl.job.i18n配置，值得一提，getI18n()里面做了一个判断，必须属于"zh_CN",“zh_TC”,"en"其中一种才可以使用，所以如果需要使用自定义语言字典，此方法也需要修改一下；

**3、** 使用i18n拼接文件地址，获取字典资源文件并加载到内存中，结束；

### 3.4 使用

上述我们已经了解了语言字典的加载过程，那么我们知道此时的语言字典已经作为一个字典本身存在于内存中，那么此时就可以在任意一个位置加载字典中的key。

同理，我们需要增加额外的国际化关键字，也可以配置在这几个字典中。
