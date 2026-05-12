# 03、Quartz 工厂类总结
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/3.html
- 分类：作业调度
- 分组：Quartz 教程（版本 A）
## 本篇文章中将会对quartz常用的factory进行总结

**SchedulerFactory**接口为调度器工厂接口 **SchedulerFactory**中主要方法介绍

- getScheduler()获取一个可用的调度器
- getScheduler(String schedName)通过调度器名字得到调度器

**JobFactory**接口负责生成Job的具体实例，如果我们需要Job实例支持bean注入那么我们需要实现这个接口进行自己实现

**JobFactory**中主要方法介绍：newJob()生成Job实例

**AdaptableJobFactory**为JobFactory的实现类，实现了具体的Job实例创建

> 注：我们如果需要实现JOb实例支持自动注入sevice，那么我们需要继承上面这个类进行自己的实现，使其支持自动注入

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

**SchedulerFactoryBean**为spring提供的由FactoryBean创建并配置一个Quartz调度器，将其生命周期作为Spring应用程序上下文的一部分进行管理，并将调度器公开为依赖项注入的bean引用，可以根据需要进行合理的默认配置如下方代码：

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
    @Autowired
    private SchedulerListeners schedulerListeners;
    /**
     * create scheduler
     */
    @Bean
    public SchedulerFactoryBean schedulerFactoryBean() throws IOException {
        SchedulerFactoryBean factory = new SchedulerFactoryBean();
        factory.setOverwriteExistingJobs(true);
        factory.setDataSource(dataSource);
        //读取配置文件中quartz的配置
        factory.setQuartzProperties(quartzProperties());
        //Register listeners to get notification on Trigger misfire etc
        //设置自定义的监听器
        factory.setGlobalTriggerListeners(triggerListner);
        factory.setGlobalJobListeners(jobsListener);
        factory.setSchedulerListeners(schedulerListeners);
        设置自定义的JobFactory
        factory.setJobFactory(myJobFactory);
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

**CronTriggerFactoryBean和SimpleTriggerFactoryBean**为spring提供的由FactoryBean创建并配置一个Cron及simple触发器，可以根据需求对触发器进行合理的默认配置,代码如下

```java
//创建cron触发器
 public static Trigger createCronTrigger(String triggerName, Date startTime, String cronExpression, int misFireInstruction){
CronTriggerFactoryBean factoryBean = new CronTriggerFactoryBean();
factoryBean.setName(triggerName);
factoryBean.setStartTime(startTime);
factoryBean.setCronExpression(cronExpression);
factoryBean.setMisfireInstruction(misFireInstruction);
try {
    factoryBean.afterPropertiessSet();
    } catch (ParseException e) {
        e.printStackTrace();
    }
    return factoryBean.getObject();
    }
    创建simple触发器
    public static Trigger createSingleTrigger(String triggerName, Date startTime, int misFireInstruction){
    SimpleTriggerFactoryBean factoryBean = new SimpleTriggerFactoryBean();
    // SimpleTrigger simpleTrigger = new SimpleTrigger();
    factoryBean.setName(triggerName);
    factoryBean.setStartTime(startTime);
    factoryBean.setMisfireInstruction(misFireInstruction);
    factoryBean.setRepeatCount(0);
    factoryBean.afterPropertiesSet();
    return factoryBean.getObject();
}
```

**JobDetailFactoryBean**用于创建JobDetail实例的Spring FactoryBeanJobDetail(Impl)本身已经是一个JavaBean，但是缺少合理的默认值，通过此类可以进行默认设置的设置，如下方代码

```java
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
```

另QuartzSchedulerThread在上篇已经介绍完毕，本篇不做介绍

至此将我们在Spring boot中需要是要quartz需求配置的内容及常使用的一个类进行的介绍。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
