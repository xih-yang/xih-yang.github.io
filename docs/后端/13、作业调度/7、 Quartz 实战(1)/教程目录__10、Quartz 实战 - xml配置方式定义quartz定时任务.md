# 10、Quartz 实战 - xml配置方式定义quartz定时任务
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/10.html
- 分类：作业调度
- 分组：教程目录
**1、新增pom依赖**

除了按照《[quartz2.3.0系列目录——带您由浅入深全面掌握quartz2.3.0](https://www.cnblogs.com/zhuwenjoyce/p/11073161.html)》添加依赖之外，pom.xml里新增加依赖：

```java
<dependency>
            <groupId>opensymphony</groupId>
            <artifactId>quartz-all</artifactId>
            <version>1.6.3</version>
</dependency>
<dependency>
            <groupId>javax.transaction</groupId>
            <artifactId>jta</artifactId>
            <version>1.1</version>
</dependency>
```

**2、quartz.properties配置**

```java
#============================================================================
# Configure Main Scheduler Properties  
#============================================================================
org.quartz.scheduler.instanceName: TestScheduler
org.quartz.scheduler.instanceId: AUTO
#============================================================================
# Configure ThreadPool  
#============================================================================
org.quartz.threadPool.class: org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.threadCount: 3
org.quartz.threadPool.threadPriority: 5
#============================================================================
# Configure JobStore  
#============================================================================
org.quartz.jobStore.misfireThreshold: 60000
org.quartz.jobStore.class: org.quartz.simpl.RAMJobStore
#============================================================================
# Configure Plugins 
#============================================================================
org.quartz.plugin.triggHistory.class: org.quartz.plugins.history.LoggingJobHistoryPlugin
org.quartz.plugin.jobInitializer.class: org.quartz.plugins.xml.XMLSchedulingDataProcessorPlugin
org.quartz.plugin.jobInitializer.fileNames: quartz_data.xml
org.quartz.plugin.jobInitializer.failOnFileNotFound: true
org.quartz.plugin.jobInitializer.scanInterval: 120
org.quartz.plugin.jobInitializer.wrapInUserTransaction: false
```

**3、quartz_data.xml配置**

```java
<?xml version="1.0" encoding="UTF-8"?>
<job-scheduling-data xmlns="http://www.quartz-scheduler.org/xml/JobSchedulingData"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.quartz-scheduler.org/xml/JobSchedulingData http://www.quartz-scheduler.org/xml/job_scheduling_data_1_8.xsd"
    version="1.8">
    <pre-processing-commands>
        <delete-jobs-in-group>*</delete-jobs-in-group>  <!-- 清除调度器中的所有作业 -->
        <delete-triggers-in-group>*</delete-triggers-in-group> <!-- 清除调度器中的所有触发器 -->
    </pre-processing-commands>
    <processing-directives>
        <!-- 如果调度程序中有任何同名的作业/触发器(与此文件中相同)，会覆盖它们 -->
        <overwrite-existing-data>true</overwrite-existing-data>
        <!-- 如果调度程序中有任何同名的作业/触发器(与此文件中相同)，并且覆盖为false，则忽略它们，而不是生成错误 -->
        <ignore-duplicates>false</ignore-duplicates> 
    </processing-directives>
    <schedule>
        <job>
            <name>TestJob1</name>
            <job-class>org.quartz.examples.example10.SimpleJob</job-class>
        </job>
        <job>
            <name>TestDurableJob</name>
            <job-class>org.quartz.examples.example10.SimpleJob</job-class>
            <durability>true</durability>
            <recover>false</recover>
        </job>
        <trigger>
            <simple>
                <name>TestSimpleTrigger1AtFiveSecondInterval</name>
                <job-name>TestJob1</job-name>
                <repeat-count>-1</repeat-count> <!-- repeat indefinitely  -->
                <repeat-interval>5000</repeat-interval>  <!--  every 5 seconds -->
            </simple>
        </trigger>
        <job>
            <name>TestJob2</name>
            <group>GroupOfTestJob2</group>
            <description>This is the description of TestJob2</description>
            <job-class>org.quartz.examples.example10.SimpleJob</job-class>
            <durability>false</durability>
            <recover>true</recover>
            <job-data-map>
                <entry>
                    <key>someKey</key>
                    <value>someValue</value>
                </entry>
                <entry>
                    <key>someOtherKey</key>
                    <value>someOtherValue</value>
                </entry>
            </job-data-map>
        </job>
        <trigger>
            <simple>
                <name>TestSimpleTrigger2AtTenSecondIntervalAndFiveRepeats</name>
                <group>GroupOfTestJob2Triggers</group>
                <job-name>TestJob2</job-name>
                <job-group>GroupOfTestJob2</job-group>
                <start-time>2010-02-09T10:15:00</start-time>
                <misfire-instruction>MISFIRE_INSTRUCTION_RESCHEDULE_NOW_WITH_EXISTING_REPEAT_COUNT</misfire-instruction>
                <repeat-count>5</repeat-count>
                <repeat-interval>10000</repeat-interval>
            </simple>
        </trigger>
        <trigger>
            <cron>
                <name>TestCronTrigger2AtEveryMinute</name>
                <group>GroupOfTestJob2Triggers</group>
                <job-name>TestJob2</job-name>
                <job-group>GroupOfTestJob2</job-group>
                <job-data-map>
                    <entry>
                        <key>someKey</key>
                        <value>overriddenValue</value>
                    </entry>
                    <entry>
                        <key>someOtherKey</key>
                        <value>someOtherOverriddenValue</value>
                    </entry>
                </job-data-map>
                <cron-expression>0 * * ? * *</cron-expression>
            </cron>
        </trigger>
        <trigger>
            <cron>
                <name>TestCronTrigger2AtEveryMinuteOnThe45thSecond</name>
                <group>GroupOfTestJob2Triggers</group>
                <job-name>TestJob2</job-name>
                <job-group>GroupOfTestJob2</job-group>
                <start-time>2010-02-09T12:26:00.0</start-time>
                <end-time>2012-02-09T12:26:00.0</end-time>
                <misfire-instruction>MISFIRE_INSTRUCTION_SMART_POLICY</misfire-instruction>
                <cron-expression>45 * * ? * *</cron-expression>
                <time-zone>America/Los_Angeles</time-zone>
            </cron>
        </trigger>
    </schedule>    
</job-scheduling-data>
```

**4、任务类，xml配置文件里指向的job任务类**

```java
package org.quartz.examples.example10;
import java.util.Date;
import java.util.Set;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * job任务类
 */
public class SimpleJob implements Job {
    private static Logger LOG = LoggerFactory.getLogger(SimpleJob.class);
    // 必须要有public修饰的无参构造函数
    public SimpleJob() {
    }
    // 定时器执行方法
    @SuppressWarnings("unchecked")
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        LOG.info("--------- job任务执行: " + jobKey + " executing at " + new Date() + ", fired by: "
                + context.getTrigger().getKey());
        if (context.getMergedJobDataMap().size() > 0) {
            Set<String> keys = context.getMergedJobDataMap().keySet();
            for (String key : keys) {
                String val = context.getMergedJobDataMap().getString(key);
                LOG.info("--------- job任务执行。 - jobDataMap entry: " + key + " = " + val);
            }
        }
        context.setResult("hello");
    }
}
```

**5、PlugInExample调度器类**

```java
package org.quartz.examples.example10;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SchedulerMetaData;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 这个示例将生成大量要运行的作业
 */
public class PlugInExample {
    public void run() throws Exception {
        Logger log = LoggerFactory.getLogger(PlugInExample.class);
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = null;
        try {
            sched = sf.getScheduler();
        } catch (NoClassDefFoundError e) {
            log.error(" 无法加载类——很可能类路径上没有jta.jar。 如果在examples/lib文件夹中没有，请将它添加到这里，以便运行这个示例。", e);
            return;
        }
        log.info("----------- 不调度任何作业——依赖于XML定义 ");
        sched.start();
        Thread.sleep(300L * 1000L);
        sched.shutdown(true);
        SchedulerMetaData metaData = sched.getMetaData();
        log.info("Executed " + metaData.getNumberOfJobsExecuted() + " jobs.");
    }
    public static void main(String[] args) throws Exception {
        PlugInExample example = new PlugInExample();
        example.run();
    }
}
```
