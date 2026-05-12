# 05、Quartz 结合项目使用
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/5.html
- 分类：作业调度
- 分组：Quartz 教程（版本 A）
## quartz结合项目实际使用示例

这篇文章我在项目中实际使用给大家介绍项目中如何使用quartz,前面文章介绍过定时任务的存储方式主要有两种：存储在内存的RAMJobStore和存储在数据库的JobStoreSupport，由于存储在内存中的形式，在清理缓存时会造成数据丢失，并且在做集群的时候也是采取存在数据库中的形式才可以，因此这里主要介绍的是存储在数据库中方式。

## 表结构

首先介绍的是数据库存储方式的表结构，quartz总共有11张表。

**1、** qrtz_blob_triggers:以Blob类型存储的触发器；

**2、** qrtz_calendars：存放日历信息，quartz可配置一个日历来指定一个时间范围；

**3、** qrtz_cron_triggers：存放cron类型的触发器；

**4、** qrtz_fired_triggers：存放已触发的触发器；

**5、** qrtz_job_details：存放一个jobDetail信息；

**6、** qrtz_locks：存储程序的悲观锁的信息(假如使用了悲观锁)；

**7、** qrtz_paused_trigger_graps：存放暂停掉的触发器；

**8、** qrtz_scheduler_state：调度器状态；

**9、** qrtz_simple_triggers：简单触发器的信息；

**10、** qrtz_trigger_listeners：触发器监听器；

**11、** qrtz_triggers：触发器的基本信息；

## 项目中引入依赖

```java
<dependency>
    <groupId>org.quartz-scheduler</groupId>
    <artifactId>quartz</artifactId>
    <version>2.2.1</version>
</dependency>
<dependency>
    <groupId>org.quartz-scheduler</groupId>
    <artifactId>quartz-jobs</artifactId>
    <version>2.2.1</version>
</dependency>
```

## 项目配置文件

```java
#默认或是自己改名字都行
org.quartz.scheduler.instanceName: DefaultQuartzScheduler
#如果使用集群，instanceId必须唯一，设置成AUTO
org.quartz.scheduler.instanceId = AUTO
org.quartz.scheduler.rmi.export: false
org.quartz.scheduler.rmi.proxy: false
org.quartz.scheduler.wrapJobExecutionInUserTransaction: false
#线程池类型
org.quartz.threadPool.class: org.quartz.simpl.SimpleThreadPool
#线程池数量
org.quartz.threadPool.threadCount: 10
org.quartz.threadPool.threadPriority: 5
org.quartz.threadPool.threadsInheritContextClassLoaderOfInitializingThread: true
org.quartz.jobStore.misfireThreshold: 60000
#存储方式使用JobStoreTX，也就是数据库
org.quartz.jobStore.class:org.quartz.impl.jdbcjobstore.JobStoreTX
org.quartz.jobStore.driverDelegateClass:org.quartz.impl.jdbcjobstore.StdJDBCDelegate
#使用自己的配置文件
org.quartz.jobStore.useProperties:true
#数据库中quartz表的表名前缀
org.quartz.jobStore.tablePrefix:QRTZ_
org.quartz.jobStore.dataSource:qzDS
#是否使用集群（如果项目只部署到 一台服务器，就不用了）
org.quartz.jobStore.isClustered = true
org.quartz.dataSource.qzDS.driver = com.mysql.jdbc.Driver
org.quartz.dataSource.qzDS.URL = jdbc:mysql://localhost:3306/logtest?characterEncoding=utf8&useSSL=false&autoReconnect=true&allowMultiQueries=true
org.quartz.dataSource.qzDS.user = root
org.quartz.dataSource.qzDS.password = root
org.quartz.dataSource.qzDS.maxConnections = 10
```

## 配置类

配置类主要需要配置的是一些监听器及SchedulerFactoryBean,这些类中具体的方法作用介绍我在之前的文章中有介绍，大家可以根据实际情况进行使用

首先是JobListener负责Job执行情况的监听

```java
@Component
public class JobsListener implements JobListener {
    @Override
    public String getName() {
        return "globalJob";
    }
    @Override
    public void jobToBeExecuted(JobExecutionContext context) {
        System.out.println("JobsListener.jobToBeExecuted()");
    }
    @Override
    public void jobExecutionVetoed(JobExecutionContext context) {
        System.out.println("JobsListener.jobExecutionVetoed()");
    }
    @Override
    public void jobWasExecuted(JobExecutionContext context, JobExecutionException jobException) {
        System.out.println("JobsListener.jobWasExecuted()");
    }
}
```

其次是TriggerListener负责触发器执行情况的监听

```java
@Component
public class TriggerListner implements TriggerListener {
    @Override
    public String getName() {
        return "globalTrigger";
    }
    @Override
    public void triggerFired(Trigger trigger, JobExecutionContext context) {
        System.out.println("TriggerListner.triggerFired()");
    }
    @Override
    public boolean vetoJobExecution(Trigger trigger, JobExecutionContext context) {
        System.out.println("TriggerListner.vetoJobExecution()");
        return false;
    }
    @Override
    public void triggerMisfired(Trigger trigger) {
        System.out.println("TriggerListner.triggerMisfired()");
        String jobName = trigger.getKey().getName();
        System.out.println("Job name: " + jobName + " is misfired");
    }
    @Override
    public void triggerComplete(Trigger trigger, JobExecutionContext jobExecutionContext, Trigger.CompletedExecutionInstruction completedExecutionInstruction) {
        System.out.println("TriggerListner.triggerComplete()");
    }
```

初始化一个JOb工厂类，普通的job工厂不支持注入其他的Spring bean，比如咱们的DAO实例，那么我们需要自己创建一个Job工厂类进行使气支持这种操作

```java
@Component
public class MyJobFactory extends AdaptableJobFactory {
    @Autowired
    private AutowireCapableBeanFactory capableBeanFactory;
    @Override
    protected Object createJobInstance(TriggerFiredBundle bundle) throws Exception {
        // 调用父类的方法
        Object jobInstance = super.createJobInstance(bundle);
        // 进行注入
        capableBeanFactory.autowireBean(jobInstance);
        return jobInstance;
    }}
```

最后我们创建的这些需要在SchedulerFactoryBean初始化的时候加入到SchedulerFactoryBean配置中，这样在启动时就会将这些配置也读取进去，具体流程之前一篇文章有介绍。

```java
@Configuration
public class QuarzConfig {
    @Autowired
    DataSource dataSource;
    @Autowired
    private ApplicationContext applicationContext;
    @Autowired
    private MyJobFactory myJobFactory;
    @Autowired
    private TriggerListner triggerListner;
    @Autowired
    private JobsListener jobsListener;
    /**
     * create scheduler
     */
    @Bean
    public SchedulerFactoryBean schedulerFactoryBean() throws IOException {
        SchedulerFactoryBean factory = new SchedulerFactoryBean();
        factory.setOverwriteExistingJobs(true);
        factory.setDataSource(dataSource);
        factory.setQuartzProperties(quartzProperties());
        //Register listeners to get notification on Trigger misfire etc
        factory.setGlobalTriggerListeners(triggerListner);
        factory.setGlobalJobListeners(jobsListener);
        factory.setJobFactory(myJobFactory);
        //factory.setSchedulerListeners();
        return factory;
    }
    /**
     * Configure quartz using properties file
     */
    @Bean
    public Properties quartzProperties() throws IOException {
        PropertiesFactoryBean propertiesFactoryBean = new PropertiesFactoryBean();
        propertiesFactoryBean.setLocation(new ClassPathResource("/quarz.properties"));
        propertiesFactoryBean.afterPropertiesSet();
        return propertiesFactoryBean.getObject();
    }
}
```

这样在启动初始化的时候就会读取我们设置好的监听及配置文件。我们通过这个工厂创建的调度器及创建Job及Trigger，就可以达到监听效果。

具体创建逻辑如下

```java
@Component
@Slf4j
public class CreatJobUtil {
    @Autowired
    private ApplicationContext context;
    @Autowired
    @Lazy
    SchedulerFactoryBean schedulerFactoryBean;
    //可以在业务逻辑中需要创建定时的地方调用这个方法进行定时创建
    public  boolean createJob(String jobName, String triggerName,String groupName ,String recordId, Date expireTime){
        log.info("创建定时开始");
        try {
            //注意这里的scheduler一定要通过schedulerFactoryBean来创建，否则监听之类的
            //不会生效
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            String wareRecordJobName=jobName+recordId;
            String wareRecordTriggerName = triggerName+recordId;
            //createJob方法的各个参数在下面会有介绍
            JobDetail recordJob = JobUtil.createJob(WareHouseRecordJob.class, false, context, wareRecordJobName, groupName,recordId);
            //createSingleTrigger方法的各个参数在下面会有介绍
            Trigger wareRecordTrigger = JobUtil.createSingleTrigger(wareRecordTriggerName,expireTime, SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW);
            scheduler.scheduleJob(recordJob,wareRecordTrigger);
            return true;
        } catch (SchedulerException e) {
            e.printStackTrace();
            return false;
        }
    }
}
```

```java
public class JobUtil {
    /**
     * Create Quartz Job.
     *
     * @param jobClass 到时间后去具体执行业务逻辑的JOb类
     * @param isDurable 定时执行完成后是否需要持久化，true为需要持久化，false为执行完删除
     * @param context Spring application context，spring上下文
     * @param jobName Job name. Job名字
     * @param jobGroup Job group. Job团
     * @param activeId 最后这个参数为定时执行时需要的一些参数，也可以是实体类
     * @return JobDetail object
     */
    public static JobDetail createJob( Class jobClass, boolean isDurable,
                                      ApplicationContext context, String jobName, String jobGroup,int activeId){
        JobDetailFactoryBean factoryBean = new JobDetailFactoryBean();
        factoryBean.setJobClass(jobClass);
        factoryBean.setDurability(isDurable);
        factoryBean.setApplicationContext(context);
        factoryBean.setName(jobName);
        factoryBean.setGroup(jobGroup);
        JobDataMap jobDataMap = new JobDataMap();
        jobDataMap.put("activeid",String.valueOf(activeId));
        factoryBean.setJobDataMap(jobDataMap);
        factoryBean.afterPropertiesSet();
        return factoryBean.getObject();
    }
    public static JobDetail createJob(Class jobClass, boolean isDurable,
                                      ApplicationContext context, String jobName, String jobGroup, String remindDto){
        JobDetailFactoryBean factoryBean = new JobDetailFactoryBean();
        factoryBean.setJobClass(jobClass);
        factoryBean.setDurability(isDurable);
        factoryBean.setApplicationContext(context);
        factoryBean.setName(jobName);
        factoryBean.setGroup(jobGroup);
        JobDataMap jobDataMap = new JobDataMap();
        jobDataMap.put("message",remindDto);
        factoryBean.setJobDataMap(jobDataMap);
        factoryBean.afterPropertiesSet();
        return factoryBean.getObject();
    }
    /**
     * Create cron trigger.
     *
     * @param triggerName Trigger name.触发器名字
     * @param startTime Trigger start time. 触发器开始实际
     * @param cronExpression Cron expression. cron表达式
     * @param misFireInstruction Misfire instruction (what to do in case of misfire happens). 如果触发器变为Misfire怎么处理的策略设置 
     *
     * @return Trigger
     */
    public static Trigger createCronTrigger(String triggerName, Date startTime, String cronExpression, int misFireInstruction){
        PersistableCronTriggerFactoryBean factoryBean = new PersistableCronTriggerFactoryBean();
        factoryBean.setName(triggerName);
        factoryBean.setStartTime(startTime);
        factoryBean.setCronExpression(cronExpression);
        factoryBean.setMisfireInstruction(misFireInstruction);
        try {
            factoryBean.afterPropertiesSet();
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return factoryBean.getObject();
    }
    /**
     * Create a Single trigger.
     *
     * @param triggerName Trigger name.  触发器名字
     * @param startTime Trigger start time. 开始时间
     * @param misFireInstruction Misfire instruction (what to do in case of misfire happens). 如果触发器变为Misfire怎么处理的策略设置
     * 创建单次执行trigger
     * @return Trigger
     */
    public static Trigger createSingleTrigger(String triggerName, Date startTime, int misFireInstruction){
        SimpleTriggerFactoryBean factoryBean = new SimpleTriggerFactoryBean();
      //SimpleTrigger simpleTrigger = new SimpleTrigger();
        factoryBean.setName(triggerName);
        factoryBean.setStartTime(startTime);
        factoryBean.setMisfireInstruction(misFireInstruction);
        factoryBean.setRepeatCount(0);
        factoryBean.afterPropertiesSet();
        return factoryBean.getObject();
    }
}
```

## Job类具体的业务逻辑实现

```java
@Slf4j
public class WareHouseRecordJob extends QuartzJobBean implements InterruptableJob {
    private volatile boolean toStopFlag = true;
    @Override
    public void interrupt() throws UnableToInterruptJobException {
        System.out.println("Stopping thread... ");
        toStopFlag = false;
    }
    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        JobDataMap mergedJobDataMap = context.getMergedJobDataMap();
        String message = (String)mergedJobDataMap.get("message");
    }
}
```

> 注：这种写法在Job的实现类里面事务无效，如果希望使用事务可以将业务逻辑写在service层，然后在service加入事务，Job类中引入service.

至此quartz在项目中就可以使用了，可以创建SimpleTrigger和CronTrigger,也可以根据实际需求来进行设置不同的监听来在JOb执行的不同阶段进行相应操作。另目前这种写法就已经支持集群，只有确保不同服务器上操作项目一致，且时间相同即可。

下篇文章将会写如何关闭、暂停定时等操作。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
