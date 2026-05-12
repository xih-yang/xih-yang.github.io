# 05、Quartz 实战 - 制定错过执行任务的misfire策略，用pause，resume模拟job暂停执行和继续执行
- 来源：https://ddkk.com/zhuanlan/job/quartz/3/5.html
- 分类：作业调度
- 分组：教程目录
感谢兄台： 《[quartz-misfire 错失、补偿执行](https://www.cnblogs.com/skyLogin/p/6927629.html)》

**misfire定义**

misfire：被错过的执行任务策略

**misfire重现——CronTrigger**

job任务类：

```java
package org.quartz.examples.example5;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.PersistJobDataAfterExecution;
import java.text.SimpleDateFormat;
import java.util.Date;
/**
 * <pre>
 * 任务job。
 * 因为@DisallowConcurrentExecution注解，所以这个job不可以被多个定时器或触发器同时执行，否则会触发定时器的misfire，就需要我们定义好定时器的misfire策略。
 * 如果不定义misfire，会出现
 * </pre>
 */
@PersistJobDataAfterExecution  //持久化JobDataMap里的数据，使下一个定时任务还能获取到这些值
@DisallowConcurrentExecution  //禁止并发多任务执行，所以永远只有一个任务在执行中
public class StatefulDumbJob implements Job {
    //任务执行计数器
    public static final String NUM_EXECUTIONS = "NumExecutions";
    public static final String EXECUTION_DELAY = "ExecutionDelay";
    public static final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
    //必须要有public修饰的无参构造函数
    public StatefulDumbJob() {
    }
    //定时器执行方法
    public void execute(JobExecutionContext context) throws JobExecutionException {
        System.out.println("---" + context.getJobDetail().getKey() + " executing.   [" + SDF.format(new Date()) + "]");
        //获得带状态集合
        JobDataMap map = context.getJobDetail().getJobDataMap();
        int executeCount = 0;
        if (map.containsKey(NUM_EXECUTIONS)) {
            executeCount = map.getInt(NUM_EXECUTIONS);
        }
        executeCount++;
        map.put(NUM_EXECUTIONS, executeCount);
        System.out.println("  -" + context.getJobDetail().getKey() + " complete (" + executeCount + ").[" + SDF.format(new Date())+ "]");
    }
}
```

定时器类：

```java
package org.quartz.examples.example5;
import static org.quartz.CronScheduleBuilder.cronSchedule;
import static org.quartz.DateBuilder.nextGivenSecondDate;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.TriggerBuilder.newTrigger;
import java.util.Date;
import org.quartz.CronExpression;
import org.quartz.CronScheduleBuilder;
import org.quartz.CronTrigger;
import org.quartz.JobDetail;
import org.quartz.SchedulerFactory;
import org.quartz.impl.StdScheduler;
import org.quartz.impl.StdSchedulerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * <pre>
此类演示了如何定义定时器的misfire策略。misfire：被错过的执行任务策略
 * </pre>
 */
public class MisfireExample_CronScheduleBuilder {
    static final Logger LOG = LoggerFactory.getLogger(MisfireExample_CronScheduleBuilder.class);
    public static void main(String[] args) throws Exception {
        // 初始化一个调度工厂，并实例化一个调度类
        SchedulerFactory sf = new StdSchedulerFactory();
//                        Scheduler sched = sf.getScheduler();
        StdScheduler sched = (StdScheduler) sf.getScheduler();
        // 第一个参数：null就是默认当前时间，也可以指定时间
        // 第二个参数：把一分钟按10进行划分，也就是60/10等份。
        // 举例：当前时间是10:26:04，那么startTime就是10:30:00。当前时间是10:38:31，那么startTime就是10:40:00。
        Date startTime = nextGivenSecondDate(null, 10);
        JobDetail job = newJob(StatefulDumbJob.class).withIdentity("job1", "group1")
//                                .usingJobData(StatefulDumbJob.EXECUTION_DELAY, 30000L)
                .build();
        String cron = "0/2 * * * * ?"; // 每2秒执行一次
        CronScheduleBuilder cronScheduleBuilder = cronSchedule(new CronExpression(cron));
        // ========================================================================
        // ======================== misfire定义，开始 =======================
        // ========================================================================
        /*
         设置misfire策略：CronTrigger.MISFIRE_INSTRUCTION_DO_NOTHING = 2 
         ——不触发立即执行
         ——等待下次Cron触发频率到达时刻开始按照Cron频率依次执行
         */
        cronScheduleBuilder.withMisfireHandlingInstructionDoNothing();
        /*
         设置misfire策略：Trigger.MISFIRE_INSTRUCTION_IGNORE_MISFIRE_POLICY = -1
         ——以错过的第一个频率时间立刻开始执行 ——重做错过的所有频率周期 ——当下一次触发频率发生时间大于当前时间以后，按照Interval的依次执行剩下的频率
         ——共执行RepeatCount+1次
         */
//        cronScheduleBuilder.withMisfireHandlingInstructionIgnoreMisfires(); 
        /*
         * 设置misfire策略：CronTrigger.MISFIRE_INSTRUCTION_FIRE_ONCE_NOW = 1
         * 以当前时间为触发频率立刻触发一次执行，然后按照Cron频率依次执行
         */
//        cronScheduleBuilder.withMisfireHandlingInstructionFireAndProceed(); 
        // ========================================================================
        // ======================== misfire定义，结束 =======================
        // ========================================================================
        CronTrigger trigger = newTrigger().withIdentity("trigger1", "group1").startAt(startTime)
                .withSchedule(cronScheduleBuilder).build();
        // CronTrigger默认misfire策略是： org.quartz.Trigger.MISFIRE_INSTRUCTION_SMART_POLICY = 0
        int misfireInstruction = trigger.getMisfireInstruction();
        LOG.info("当前misfire策略：" + misfireInstruction);
        Date ft = sched.scheduleJob(job, trigger);
        LOG.info(job.getKey().toString());
        sched.start();
        LOG.info("调度器启动，主线程睡眠15秒！！！！调度器内任务线程继续执行。");
        Thread.sleep(15L * 1000L);
//        // 暂停触发器
//        sched.pauseTrigger(trigger.getKey());
//        // 继续触发器
//        sched.resumeTrigger(trigger.getKey());
        // 暂停执行任务
        sched.pauseJob(job.getKey());
        LOG.info("调度器暂停执行定时器，主线程睡眠11秒！！！！会错过执行job1的N次定时任务。模拟当定时器的执行线程由于抢不到CPU时间或其他事件错过执行的情况。");
        Thread.sleep(11L * 1000L);
        // 继续执行任务
        sched.resumeJob(job.getKey()); //当定时器得到继续执行的命令时，被错过执行的任务次数，就会按照misfire的定义去执行
        LOG.info("调度器继续执行定时器，主线程睡眠15秒！！！！调度器内任务线程继续执行。");
        Thread.sleep(15L * 1000L);
        LOG.info("调度器终止执行！！！！");
        sched.shutdown(true);
    }
}
```

**misfire重现——SimpleTrigger**

CronTrigger的misfire策略经本人亲自测试，注释全部可靠，SimpleTrigger全部来自以下兄台文章注释，实际结果请各位亲自实验。

感谢兄台： 《[quartz-misfire 错失、补偿执行](https://www.cnblogs.com/skyLogin/p/6927629.html)》

SimpleTrigger默认misfire策略也是： org.quartz.Trigger.MISFIRE_INSTRUCTION_SMART_POLICY = 0

```java
//定义触发器，2秒执行一次，循环5次，总共执行6次
        SimpleScheduleBuilder simpleScheduleBuilder = simpleSchedule().withIntervalInSeconds(2).withRepeatCount(5);
//                .repeatForever(); //无限循环
        /*
           设置misfire策略为：SimpleTrigger.MISFIRE_INSTRUCTION_RESCHEDULE_NEXT_WITH_EXISTING_COUNT = 5
             ——不触发立即执行
            ——等待下次触发频率周期时刻，执行至FinalTime的剩余周期次数
            ——以startTime为基准计算周期频率，并得到FinalTime
            ——即使中间出现pause，resume以后保持FinalTime时间不变
         */
        simpleScheduleBuilder.withMisfireHandlingInstructionNextWithExistingCount();
        /*
           设置misfire策略为：SimpleTrigger.MISFIRE_INSTRUCTION_RESCHEDULE_NEXT_WITH_REMAINING_COUNT = 4
             ——不触发立即执行
            ——等待下次触发频率周期时刻，执行至FinalTime的剩余周期次数
            ——以startTime为基准计算周期频率，并得到FinalTime
            ——即使中间出现pause，resume以后保持FinalTime时间不变
         */
        simpleScheduleBuilder.withMisfireHandlingInstructionNextWithRemainingCount();
        /*
           设置misfire策略为：SimpleTrigger.MISFIRE_INSTRUCTION_RESCHEDULE_NOW_WITH_REMAINING_REPEAT_COUNT = 3
             ——以当前时间为触发频率立即触发执行
            ——执行至FinalTIme的剩余周期次数
            ——以调度或恢复调度的时刻为基准的周期频率，FinalTime根据剩余次数和当前时间计算得到
            ——调整后的FinalTime会略大于根据starttime计算的到的FinalTime值
         */
        simpleScheduleBuilder.withMisfireHandlingInstructionNowWithRemainingCount();
        /*
           设置misfire策略为：SimpleTrigger.MISFIRE_INSTRUCTION_RESCHEDULE_NOW_WITH_EXISTING_REPEAT_COUNT = 2
            ——以当前时间为触发频率立即触发执行
            ——执行至FinalTIme的剩余周期次数
            ——以调度或恢复调度的时刻为基准的周期频率，FinalTime根据剩余次数和当前时间计算得到
            ——调整后的FinalTime会略大于根据starttime计算的到的FinalTime值
         */
        simpleScheduleBuilder.withMisfireHandlingInstructionNowWithExistingCount();
        /*
           设置misfire策略为：SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW = 1
             ——以当前时间为触发频率立即触发执行
            ——执行至FinalTIme的剩余周期次数
            ——以调度或恢复调度的时刻为基准的周期频率，FinalTime根据剩余次数和当前时间计算得到
            ——调整后的FinalTime会略大于根据starttime计算的到的FinalTime值
         */
        simpleScheduleBuilder.withMisfireHandlingInstructionFireNow();
        /*
           设置misfire策略为：Trigger.MISFIRE_INSTRUCTION_IGNORE_MISFIRE_POLICY = -1
             ——以错过的第一个频率时间立刻开始执行
            ——重做错过的所有频率周期
            ——当下一次触发频率发生时间大于当前时间以后，按照Interval的依次执行剩下的频率
            ——共执行RepeatCount+1次
         */
        simpleScheduleBuilder.withMisfireHandlingInstructionIgnoreMisfires();
```
