# 15、Quartz 实战 - 执行、暂停、继续执行、清除，花式操作数据库中持久化的job任务
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/15.html
- 分类：作业调度
- 分组：教程目录
**1、 建立数据库11张表**

先在数据库中建立quartz需要的11张表（我这里用的是Oracle数据库），根据不同的数据库quartz分别提供了不同的初始化sql文件，sql文件路径在 quartz-2.3.0-SNAPSHOT-0724\src\org\quartz\impl\jdbcjobstore下：

```java
 1 tables_cloudscape.sql
 2 tables_cubrid.sql
 3 tables_db2.sql
 4 tables_db2_v8.sql
 5 tables_db2_v72.sql
 6 tables_db2_v95.sql
 7 tables_derby.sql
 8 tables_derby_previous.sql
 9 tables_firebird.sql
10 tables_h2.sql
11 tables_hsqldb.sql
12 tables_hsqldb_old.sql
13 tables_informix.sql
14 tables_mysql.sql
15 tables_mysql_innodb.sql
16 tables_oracle.sql
17 tables_pointbase.sql
18 tables_postgres.sql
19 tables_sapdb.sql
20 tables_solid.sql
21 tables_sqlServer.sql
22 tables_sybase.sql
```

**2、 配置定时器数据库等相关配置：quartz.properties**

```java
#============================================================================
# Configure Main Scheduler Properties  
#============================================================================
#调度器实例名称
org.quartz.scheduler.instanceName: SchedulerJoyce0725
org.quartz.scheduler.instanceId: InstanceJoyce0725
#============================================================================
# Configure ThreadPool  
#============================================================================
org.quartz.threadPool.class: org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.threadCount: 5
org.quartz.threadPool.threadPriority: 1
#============================================================================
# 配置Oracle数据库，命名dataSource为myDS
#============================================================================
### 支持PostgreSQL数据库
###org.quartz.dataSource.myDS.driver=org.postgresql.Driver
###org.quartz.dataSource.myDS.URL=jdbc:postgresql://localhost:5432/quartz
org.quartz.dataSource.myDS.driver=oracle.jdbc.driver.OracleDriver
org.quartz.dataSource.myDS.URL=jdbc:oracle:thin:@localhost:1521:orcl
org.quartz.dataSource.myDS.user=zhuwen
org.quartz.dataSource.myDS.password=ZHUwen12
org.quartz.dataSource.myDS.maxConnections=5
org.quartz.dataSource.myDS.validationQuery=select 0 FROM DUAL
#============================================================================
# 配置job任务存储策略，指定一个叫myDS的dataSource
#============================================================================
org.quartz.jobStore.misfireThreshold: 60000
org.quartz.jobStore.class=org.quartz.impl.jdbcjobstore.JobStoreTX
### 支持PostgreSQL数据库
###org.quartz.jobStore.driverDelegateClass=org.quartz.impl.jdbcjobstore.PostgreSQLDelegate
### 支持Oracle数据库
org.quartz.jobStore.driverDelegateClass=org.quartz.impl.jdbcjobstore.oracle.OracleDelegate
org.quartz.jobStore.useProperties=false
org.quartz.jobStore.dataSource=myDS
org.quartz.jobStore.tablePrefix=QRTZ_
org.quartz.jobStore.isClustered=true
```

**3、 11张表不同定时方式分别存储了不同数据到不同的表**

ScheduleBuilder是trigger触发器的触发规则定制类，旗下有4种触发器实现类： CalendarIntervalScheduleBuilder、CronScheduleBuilder、DailyTimeIntervalScheduleBuilder、SimpleScheduleBuilder。

这里演示了CronScheduleBuilder和SimpleScheduleBuilder两种定时方式，分别执行后面的StoreSimpleTrigger2OracleExample.java 和 StoreCronTrigger2OracleExample.java 就能看到数据库如下的差别：

这4中实现类在数据库的11张表中存储一个任务时，分别会产生不一样的数据，用颜色标注insert语句如下：

**select * from qrtz_blob_triggers;** --没有insert语句就表示此表一直没有数据

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**select * from qrtz_calendars;**

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**select * from qrtz_cron_triggers;**

Insert into QRTZ_CRON_TRIGGERS (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP,CRON_EXPRESSION,TIME_ZONE_ID)

values ('SchedulerJoyce0725','cronTrigger','cronGroup1','0/5 * * * * ?','Asia/Shanghai');

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**select * from qrtz_fired_triggers;**

Insert into QRTZ_FIRED_TRIGGERS (SCHED_NAME,ENTRY_ID,TRIGGER_NAME,TRIGGER_GROUP,INSTANCE_NAME,FIRED_TIME,SCHED_TIME,PRIORITY,STATE,JOB_NAME,JOB_GROUP,IS_NONCONCURRENT,REQUESTS_RECOVERY)

values ('SchedulerJoyce0725','InstanceJoyce07251564061848994','cronTrigger','cronGroup1','InstanceJoyce0725',1564061855002,1564061855000,5,'EXECUTING','simpleRecoveryJob','cronGroup1','0','0'); --每一次远程启动时ENTRY_ID总是会变一变

Insert into QRTZ_FIRED_TRIGGERS (SCHED_NAME,ENTRY_ID,TRIGGER_NAME,TRIGGER_GROUP,INSTANCE_NAME,FIRED_TIME,SCHED_TIME,PRIORITY,STATE,JOB_NAME,JOB_GROUP,IS_NONCONCURRENT,REQUESTS_RECOVERY) values ('SchedulerJoyce0725','InstanceJoyce07251564066439267','simpleTriger1','simpleGroup','InstanceJoyce0725',1564066446293,1564066451270,5,'ACQUIRED',null,null,'0','0');

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

select * from qrtz_job_details;

Insert into QRTZ_JOB_DETAILS (SCHED_NAME,JOB_NAME,JOB_GROUP,DESCRIPTION,JOB_CLASS_NAME,IS_DURABLE,IS_NONCONCURRENT,IS_UPDATE_DATA,REQUESTS_RECOVERY,JOB_DATA)

values ('SchedulerJoyce0725','simpleRecoveryJob','cronGroup1',null,'org.quartz.examples.example15.SimpleRecoveryJob','0','0','0','0',

TO_BLOB(HEXTORAW('...'))|| TO_BLOB(HEXTORAW('...')));

Insert into QRTZ_JOB_DETAILS (SCHED_NAME,JOB_NAME,JOB_GROUP,DESCRIPTION,JOB_CLASS_NAME,IS_DURABLE,IS_NONCONCURRENT,IS_UPDATE_DATA,REQUESTS_RECOVERY,JOB_DATA)

values ('SchedulerJoyce0725','simpleJob1','simpleGroup',null,'org.quartz.examples.example15.SimpleRecoveryJob','0','0','0','1',

TO_BLOB(HEXTORAW('...'))|| TO_BLOB(HEXTORAW('...')));

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

select * from qrtz_locks;

Insert into qrtz_locks (SCHED_NAME,LOCK_NAME) values ('SchedulerJoyce0725','STATE_ACCESS');

Insert into qrtz_locks (SCHED_NAME,LOCK_NAME) values ('SchedulerJoyce0725','TRIGGER_ACCESS');

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

select * from qrtz_paused_trigger_grps;

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

select * from qrtz_scheduler_state;

Insert into qrtz_scheduler_state (SCHED_NAME,INSTANCE_NAME,LAST_CHECKIN_TIME,CHECKIN_INTERVAL)

values ('SchedulerJoyce0725','InstanceJoyce0725',1564061857522,7500);

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

select * from qrtz_simple_triggers;

Insert into QRTZ_SIMPLE_TRIGGERS (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP,REPEAT_COUNT,REPEAT_INTERVAL,TIMES_TRIGGERED)

values ('SchedulerJoyce0725','simpleTriger1','simpleGroup',20,5000,2);

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

select * from qrtz_simprop_triggers;

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

select * from qrtz_triggers;

Insert into qrtz_triggers (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP,JOB_NAME,JOB_GROUP,DESCRIPTION,NEXT_FIRE_TIME,PREV_FIRE_TIME,PRIORITY,TRIGGER_STATE,TRIGGER_TYPE,START_TIME,END_TIME,CALENDAR_NAME,MISFIRE_INSTR,JOB_DATA)

values ('SchedulerJoyce0725','cronTrigger','cronGroup1','simpleRecoveryJob','cronGroup1',null,1564061865000,1564061860000,5,'ACQUIRED','CRON',1564061849000,0,null,0, EMPTY_BLOB());

Insert into QRTZ_TRIGGERS (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP,JOB_NAME,JOB_GROUP,DESCRIPTION,NEXT_FIRE_TIME,PREV_FIRE_TIME,PRIORITY,TRIGGER_STATE,TRIGGER_TYPE,START_TIME,END_TIME,CALENDAR_NAME,MISFIRE_INSTR,JOB_DATA) values ('SchedulerJoyce0725','simpleTriger1','simpleGroup','simpleJob1','simpleGroup',null,1564066451270,1564066446270,5,'ACQUIRED','SIMPLE',1564066441270,0,null,0, EMPTY_BLOB());

**4、 job任务类，SimpleRecoveryJob.java**

```java
package org.quartz.examples.example15;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
/**
 * 一个job作业。
 */
public class SimpleRecoveryJob implements Job {
    private static Logger LOG = LoggerFactory.getLogger(SimpleRecoveryJob.class);
    private static final String COUNT = "count";
    //必须要有public修饰的无参构造函数
    public SimpleRecoveryJob() {
    }
    //任务执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        // 如果由于“恢复”情况而重新执行作业，此方法将返回true。
        if (context.isRecovering()) {
            LOG.info("恢复作业：SimpleRecoveryJob: " + jobKey + " RECOVERING at " + new Date());
        } else {
            LOG.info("不恢复作业：SimpleRecoveryJob: " + jobKey + " starting at " + new Date());
        }
        JobDataMap data = context.getJobDetail().getJobDataMap();
        int count;
        if (data.containsKey(COUNT)) {
            count = data.getInt(COUNT);
        } else {
            count = 0;
        }
        count++;
        data.put(COUNT, count);
        LOG.info("SimpleRecoveryJob: " + jobKey + " done at " + new Date() + "\n Execution" + count);
    }
}
```

5**、 简单定时任务存储到数据库表，StoreSimpleTrigger2OracleExample.java**

```java
package org.quartz.examples.example15;
import static org.quartz.DateBuilder.futureDate;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.SimpleScheduleBuilder.simpleSchedule;
import static org.quartz.TriggerBuilder.newTrigger;
import org.quartz.DateBuilder.IntervalUnit;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.SimpleTrigger;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 简单定时任务存储到数据库表。
 * 存储job任务到数据库，这里打印的job任务都是：     不恢复作业……
 */
public class StoreSimpleTrigger2OracleExample {
    private static Logger LOG = LoggerFactory.getLogger(StoreSimpleTrigger2OracleExample.class);
    public void run(boolean inClearJobs, boolean inScheduleJobs) throws Exception {
        // 初始化调度器
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        if (inClearJobs) {
            sched.clear();
            LOG.warn("***** Deleted existing jobs/triggers *****");
        }
        LOG.info("------- Initialization Complete -----------");
        if (inScheduleJobs) {
            LOG.info("------- Scheduling Jobs ------------------");
            String schedId = sched.getSchedulerInstanceId();
            // ========================================================
            // ============ job1
            // ========================================================
            int count = 1;
            JobDetail job = newJob(SimpleRecoveryJob.class).withIdentity("simpleJob" + count, "simpleGroup").requestRecovery() // 如果job执行过程中宕机，则job重新执行
                    .build();
            SimpleTrigger trigger = newTrigger().withIdentity("simpleTriger" + count, "simpleGroup")
                    .startAt(futureDate(1, IntervalUnit.SECOND))
                    .withSchedule(simpleSchedule().withRepeatCount(20).withIntervalInSeconds(5)).build();
            LOG.info(job.getKey() + " will run at: " + trigger.getNextFireTime() + " and repeat: "
                    + trigger.getRepeatCount() + " times, every " + trigger.getRepeatInterval() / 1000 + " seconds");
            sched.scheduleJob(job, trigger);
//
//            // ========================================================
//            // ============ job2
//            // ========================================================
//            count++;
//            job = newJob(SimpleRecoveryJob.class).withIdentity("job0724_" + count, schedId).requestRecovery() // 如果job执行过程中宕机，则job重新执行
//                    .build();
//            trigger = newTrigger().withIdentity("triger0724_" + count, schedId).startAt(futureDate(2, IntervalUnit.SECOND))
//                    .withSchedule(simpleSchedule().withRepeatCount(20).withIntervalInSeconds(5)).build();
//            LOG.info(job.getKey() + " will run at: " + trigger.getNextFireTime() + " and repeat: "
//                    + trigger.getRepeatCount() + " times, every " + trigger.getRepeatInterval() / 1000 + " seconds");
//            sched.scheduleJob(job, trigger);
        }
        LOG.info("------- Starting Scheduler ---------------");
        sched.start();
        try {
            Thread.sleep(3600L * 1000L);
        } catch (Exception e) {
            //
        }
        sched.shutdown();
        LOG.info("------- Shutdown Complete ----------------");
    }
    public static void main(String[] args) throws Exception {
        boolean clearJobs = true; // 是否清空job任务
        boolean scheduleJobs = true; // 是否调度任务
        for (String arg : args) {
            if (arg.equalsIgnoreCase("clearJobs")) {
                clearJobs = true;
            } else if (arg.equalsIgnoreCase("dontScheduleJobs")) {
                scheduleJobs = false;
            }
        }
        StoreSimpleTrigger2OracleExample example = new StoreSimpleTrigger2OracleExample();
        example.run(clearJobs, scheduleJobs);
    }
}
```

**6、 cron定义定时任务存储到数据库表，StoreCronTrigger2OracleExample.java**

```java
package org.quartz.examples.example15;
import static org.quartz.CronScheduleBuilder.cronSchedule;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.TriggerBuilder.newTrigger;
import java.util.Date;
import org.quartz.CronTrigger;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * cron定义定时任务存储到数据库表。
 * 存储job任务到数据库，这里打印的job任务都是：     不恢复作业……
 */
public class StoreCronTrigger2OracleExample {
    private static Logger LOG = LoggerFactory.getLogger(StoreCronTrigger2OracleExample.class);
    public void run(boolean inClearJobs) throws Exception {
        // 初始化调度器
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        if (inClearJobs) {
            sched.clear();
            LOG.warn("***** Deleted existing jobs/triggers *****");
        }
        // ========================================================
        // ============ job1 每20秒执行一次，无限期重复
        // ========================================================
        JobDetail job = newJob(SimpleRecoveryJob.class).withIdentity("simpleRecoveryJob_Recovery", "cronGroup2")
                .requestRecovery() //如果job任务所在服务宕机了或由于其它原因job任务被中断，请标记JobExecutionContext.isRecovering()=true。
                                   //让我可以拿这个标记知道怎么去适配业务场景。
                                   //但是只有恢复任务后首次执行任务时，拿到Recovering标记值为true，此后该任务Recovering值又标记为了false。
                .build();
        //每5秒执行一次
        CronTrigger trigger = newTrigger().withIdentity("cronTrigger_Recovery", "cronGroup2").withSchedule(cronSchedule("0/5 * * * * ?")).build();
        Date ft = sched.scheduleJob(job, trigger);
        LOG.info(job.getKey() + " has been scheduled to run at: " + ft + " and repeat based on expression: "
                + trigger.getCronExpression());
        LOG.info("------- Starting Scheduler ---------------");
        sched.start();
        try {
            Thread.sleep(3600L * 1000L);
        } catch (Exception e) {
            //
        }
        // 暂停执行任务
        sched.pauseJob(job.getKey());
        LOG.info("调度器暂停执行定时器，主线程睡眠11秒！！！！会错过执行job1的N次定时任务。模拟当定时器的执行线程由于抢不到CPU时间或其他事件错过执行的情况。");
        Thread.sleep(11L * 1000L);
        // 继续执行任务
        sched.resumeJob(job.getKey()); //当定时器得到继续执行的命令时，被错过执行的任务次数，就会按照misfire的定义去执行
        sched.shutdown();
        LOG.info("------- Shutdown Complete ----------------");
    }
    public static void main(String[] args) throws Exception {
        boolean clearJobs = false; // 是否清空job任务
        StoreCronTrigger2OracleExample example = new StoreCronTrigger2OracleExample();
        example.run(clearJobs);
    }
}
```

**7、 执行数据库中的定时任务，RunOracleExistingJobExample.java**

```java
package org.quartz.examples.example15;
import org.quartz.Scheduler;
import org.quartz.SchedulerFactory;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * 先运行ClusterExample.java，确定Oracle数据库中已存在job任务.
 * 这里打印的job任务都是从数据库表里恢复回来的，所以这些任务的第一次执行会打印：     恢复作业……
 * 此后job任务就只打印：不恢复作业……
 */
public class RunOracleExistingJobExample {
    private static Logger LOG = LoggerFactory.getLogger(RunOracleExistingJobExample.class);
    public void run(boolean inClearJobs) throws Exception {
        // 初始化调度器
        SchedulerFactory sf = new StdSchedulerFactory();
        Scheduler sched = sf.getScheduler();
        if (inClearJobs) {
            sched.clear();
            LOG.warn("***** Deleted existing jobs/triggers *****");
        }
        LOG.info("------- Starting Scheduler ---------------");
        sched.start();
        try {
            Thread.sleep(3600L * 1000L);
        } catch (Exception e) {
            //
        }
        sched.shutdown();
        LOG.info("------- Shutdown Complete ----------------");
    }
    public static void main(String[] args) throws Exception {
        boolean clearJobs = false; // 是否清空job任务，这里为不清空
        RunOracleExistingJobExample example = new RunOracleExistingJobExample();
        example.run(clearJobs);
    }
}
```
