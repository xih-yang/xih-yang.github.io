# 04、Quartz 源码分析 - Scheduler源码解析
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/12.html
- 分类：作业调度
- 分组：Quartz 源码解析
### Schedule是什么

英文意思大家应该都知道，就是计划、时间表等等。而在Quartz，这就是那只大手。让我们在回顾一下之前的demo：

```java
public class Exemple01Schedule {
  /**
   * 计划工厂类
   */
  private static SchedulerFactory schedulerFactory = new StdSchedulerFactory();
  /**
   * 任务名称
   */
  private static String JOB_GROUP_NAME = "job-group-1";
  /**
   * 触发器名称
   */
  private static String TRIGGER_GROUP_NAME = "trigger-group-1";
  /**
   * 增加任务
   * @param jobClass 任务实现类
   * @param jobName 任务名称
   * @param interval 间隔时间
   * @param data 数据
   */
  public static void addJob(Class<? extends Job> jobClass, String jobName, int interval, Map<String, Object> data){
    try {
      //获取任务调度器
      Scheduler scheduler = schedulerFactory.getScheduler();
      //获取任务详细信息
      JobDetail jobDetail = JobBuilder.newJob(jobClass)
          //任务名称和组构成任务key
          .withIdentity(jobName, JOB_GROUP_NAME)
          .build();
      jobDetail.getJobDataMap().putAll(data);
      // 触发器
      SimpleTrigger trigger = TriggerBuilder.newTrigger()
          //触发器key唯一标识
          .withIdentity(jobName, TRIGGER_GROUP_NAME)
          //调度开始时间
          .startAt(DateBuilder.futureDate(1, IntervalUnit.SECOND))
          //调度规则
          .withSchedule(SimpleScheduleBuilder.simpleSchedule()
              .withIntervalInSeconds(interval)
              .repeatForever())
          .build();
      scheduler.scheduleJob(jobDetail, trigger);
      // 启动
      if (!scheduler.isShutdown()) {
        scheduler.start();
      }
    } catch (SchedulerException e) {
      System.out.println(e.getMessage());
    }
  }
}
```

第一个进入眼帘的就是SchedulerFactory，下面就来进入分析。

### SchedulerFactory源码分析

首先我们照常例先看下SchedulerFactory的源码：

```java
package org.quartz;
import java.util.Collection;
/**
 * 调度器工厂类
 */
public interface SchedulerFactory {
    /**
     * 获取任务调度器
     */
    Scheduler getScheduler() throws SchedulerException;
    /**
     * 根据调度器名称获取任务调度器
     */
    Scheduler getScheduler(String schedName) throws SchedulerException;
    /**
     * 获取所有调度器
     */
    Collection<Scheduler> getAllSchedulers() throws SchedulerException;
}
```

大家不知有没有注意到，在我们new的时候，创建的实例其实是StdSchedulerFactory类，那么我们接下来就以这个类来进行分析。

### StdSchedulerFactory源码分析

这里代码有点长，所有我只能逐步进行分析：首先我们可以把焦点关注于这个类的属性：

```java
    /**
     * 调取器异常
     */
    private SchedulerException initException = null;
    /**
     * 配置普京
     */
    private String propSrc = null;
    /**
     * 配置属性
     */
    private PropertiesParser cfg;
```

这里属性其实只有3个，下面我们来看下在demo中的调用方法:

```java
/**
     * 获取任务Schedule
     */
    @Override
    public Scheduler getScheduler() throws SchedulerException {
        //第一步加载配置文件，System的properties覆盖前面的配置
        if (cfg == null) {
            initialize();
        }
        //本地存储Schedule任务,注：SchedulerRepository是单例模式
        SchedulerRepository schedRep = SchedulerRepository.getInstance();
        //从缓存中查询获取Schedule任务，任务名称从配置中获取，若无指定，则默认指定QuartzScheduler
        Scheduler sched = schedRep.lookup(getSchedulerName());
        //判断若存在且已停止运行，则从缓存中移除
        if (sched != null) {
            if (sched.isShutdown()) {
                schedRep.remove(getSchedulerName());
            } else {
                return sched;
            }
        }
        //开始很多初始化对象
        sched = instantiate();
        return sched;
    }
```

由于这个时候cfg为null，所以我们需要跳到initialize方法：

```java
 /**
     * 根据配置文件初始化
     */
    public void initialize() throws SchedulerException {
        // 如果已经存在，直接返回
        if (cfg != null) {
            return;
        }
        if (initException != null) {
            throw initException;
        }
        //PROPERTIES_FILE = org.quartz.properties 是否存在指定读取的配置文件
        String requestedFile = System.getProperty(PROPERTIES_FILE);
        //不主动设置，默认设置为quartz.properties
        String propFileName = requestedFile != null ? requestedFile
                : "quartz.properties";
        File propFile = new File(propFileName);
        Properties props = new Properties();
        InputStream in = null;
        //读取配置文件内容，如果都不存在依次读取quartz.properties、/quartz.properties、org/quartz/quartz.properties
        try {
            if (propFile.exists()) {
                try {
                    if (requestedFile != null) {
                        propSrc = "specified file: '" + requestedFile + "'";
                    } else {
                        propSrc = "default file in current working dir: 'quartz.properties'";
                    }
                    in = new BufferedInputStream(new FileInputStream(propFileName));
                    props.load(in);
                } catch (IOException ioe) {
                    initException = new SchedulerException("Properties file: '"
                            + propFileName + "' could not be read.", ioe);
                    throw initException;
                }
            } else if (requestedFile != null) {
                in =
                    Thread.currentThread().getContextClassLoader().getResourceAsStream(requestedFile);
                if(in == null) {
                    initException = new SchedulerException("Properties file: '"
                        + requestedFile + "' could not be found.");
                    throw initException;
                }
                propSrc = "specified file: '" + requestedFile + "' in the class resource path.";
                in = new BufferedInputStream(in);
                try {
                    props.load(in);
                } catch (IOException ioe) {
                    initException = new SchedulerException("Properties file: '"
                            + requestedFile + "' could not be read.", ioe);
                    throw initException;
                }
            } else {
                propSrc = "default resource file in Quartz package: 'quartz.properties'";
                ClassLoader cl = getClass().getClassLoader();
                if(cl == null)
                    cl = findClassloader();
                if(cl == null)
                    throw new SchedulerConfigException("Unable to find a class loader on the current thread or class.");
                in = cl.getResourceAsStream(
                        "quartz.properties");
                if (in == null) {
                    in = cl.getResourceAsStream(
                            "/quartz.properties");
                }
                if (in == null) {
                    in = cl.getResourceAsStream(
                            "org/quartz/quartz.properties");
                }
                if (in == null) {
                    initException = new SchedulerException(
                            "Default quartz.properties not found in class path");
                    throw initException;
                }
                try {
                    props.load(in);
                } catch (IOException ioe) {
                    initException = new SchedulerException(
                            "Resource properties file: 'org/quartz/quartz.properties' "
                                    + "could not be read from the classpath.", ioe);
                    throw initException;
                }
            }
        } finally {
            if(in != null) {
                try {
      in.close(); } catch(IOException ignore) {
      /* ignore */ }
            }
        }
        //赋值
        initialize(overrideWithSysProps(props));
    }
```

有关于配置的我们放到之后在进行分析，现在我们按照demo的调用方式，很自然的可以读到我们的调用代码块是：

```java
                propSrc = "default resource file in Quartz package: 'quartz.properties'";
                ClassLoader cl = getClass().getClassLoader();
                if(cl == null)
                    cl = findClassloader();
                if(cl == null)
                    throw new SchedulerConfigException("Unable to find a class loader on the current thread or class.");
                in = cl.getResourceAsStream(
                        "quartz.properties");
                if (in == null) {
                    in = cl.getResourceAsStream(
                            "/quartz.properties");
                }
                if (in == null) {
                    in = cl.getResourceAsStream(
                            "org/quartz/quartz.properties");
                }
                if (in == null) {
                    initException = new SchedulerException(
                            "Default quartz.properties not found in class path");
                    throw initException;
                }
                try {
                    props.load(in);
                } catch (IOException ioe) {
                    initException = new SchedulerException(
                            "Resource properties file: 'org/quartz/quartz.properties' "
                                    + "could not be read from the classpath.", ioe);
                    throw initException;
                }
```

可能大家会好奇，我明明按照代码读下来，我们并没有设置quartz.properties的配置文件，照道理来讲应该会抛出异常呀？但是我这程序为什么还能顺利运行呢？不知大家注意到没有：

```java
  if (in == null) {
                    in = cl.getResourceAsStream(
                            "org/quartz/quartz.properties");
                }
```

我们这里会去拿源码里面的默认配置文件，然后就是加载到配置属性中。至于会加载什么属性，目前不做解析。

然后就是overrideWithSysProps方法，

```java
 /**
     * 添加系统配置，如果跟之前的配置相同则覆盖，以系统配置为主
     */
    private Properties overrideWithSysProps(Properties props) {
        Properties sysProps = null;
        try {
            sysProps = System.getProperties();
        } catch (AccessControlException e) {
            getLog().warn(
                "Skipping overriding quartz properties with System properties " +
                "during initialization because of an AccessControlException.  " +
                "This is likely due to not having read/write access for " +
                "java.util.PropertyPermission as required by java.lang.System.getProperties().  " +
                "To resolve this warning, either add this permission to your policy file or " +
                "use a non-default version of initialize().",
                e);
        }
        if (sysProps != null) {
            props.putAll(sysProps);
        }
        return props;
    }
```

相信大家都看的懂，就是单纯的覆盖配置属性。而之后就是：

```java
public void initialize(Properties props) throws SchedulerException {
        if (propSrc == null) {
            propSrc = "an externally provided properties instance.";
        }
        this.cfg = new PropertiesParser(props);
    }
```

### SchedulerRepository源码解析

```java
package org.quartz.impl;
import java.util.Collection;
import java.util.HashMap;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
/**
 * <p>
 * 保持对调度器实例的引用-确保唯一性，以及
 * 防止垃圾收集，并允许“全球”查找-所有在一个
 * 类加载器空间。
 * </p>
 *
 * <person>
 *   调度程序库，采用单例模式存储任务调度Schedule
 * </person>
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public class SchedulerRepository {
    /*
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * 
     * Data members.
     * 
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */
    private HashMap<String, Scheduler> schedulers;
    private static SchedulerRepository inst;
    /*
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * 
     * Constructors.
     * 
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */
    private SchedulerRepository() {
        schedulers = new HashMap<String, Scheduler>();
    }
    /*
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * 
     * Interface.
     * 
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */
    public static synchronized SchedulerRepository getInstance() {
        if (inst == null) {
            inst = new SchedulerRepository();
        }
        return inst;
    }
    /**
     * 绑定新的任务调度器
     */
    public synchronized void bind(Scheduler sched) throws SchedulerException {
        if ((Scheduler) schedulers.get(sched.getSchedulerName()) != null) {
            throw new SchedulerException("Scheduler with name '"
                    + sched.getSchedulerName() + "' already exists.");
        }
        schedulers.put(sched.getSchedulerName(), sched);
    }
    /**
     * 移除新的任务调度器
     */
    public synchronized boolean remove(String schedName) {
        return (schedulers.remove(schedName) != null);
    }
    /**
     * 查询新的任务调度器
     */
    public synchronized Scheduler lookup(String schedName) {
        return schedulers.get(schedName);
    }
    /**
     * 查询所有任务调度器
     */
    public synchronized Collection<Scheduler> lookupAll() {
        return java.util.Collections
                .unmodifiableCollection(schedulers.values());
    }
}
```

可以看到这里其实就是使用内存持久化任务调度器，非常简单易懂，我们这不做展开。我们直接进入最重要、最核心的instantiate()方法（不要和之前的initialize方法搞错呦！！！）

### instantiate源码解析

由于这个过程非常的漫长，所以我们需要改一下之前的套路，需要逐个击破，分而破之。下面是开头的源码：

```java
 /**
     * 开始初始化各种所需对象实例
     * @return
     * @throws SchedulerException
     */
    private Scheduler instantiate() throws SchedulerException {
        if (cfg == null) {
            initialize();
        }
        if (initException != null) {
            throw initException;
        }
        //任务配置存储
        JobStore js = null;
        //线程池
        ThreadPool tp = null;
        //实际调度器
        QuartzScheduler qs = null;
        //数据库连接管理器
        DBConnectionManager dbMgr = null;
        //自动生成id类
        String instanceIdGeneratorClass = null;
        //配置文件
        Properties tProps = null;
        //用户事务定位
        String userTXLocation = null;
        //包装任务进事务中
        boolean wrapJobInTx = false;
        //是否自动
        boolean autoId = false;
        //服务器延迟
        long idleWaitTime = -1;
        // 15 secs 存储失败重试时间
        long dbFailureRetry = 15000L;
        //类加载帮助类
        String classLoadHelperClass;
        //任务工厂类
        String jobFactoryClass;
        //线程执行器
        ThreadExecutor threadExecutor;
        //调用程序库
        SchedulerRepository schedRep = SchedulerRepository.getInstance();
        // Get Scheduler Properties
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //PROP_SCHED_INSTANCE_NAME = org.quartz.scheduler.instanceName
        //设置调度器名字，默认是QuartzScheduler
        String schedName = cfg.getStringProperty(PROP_SCHED_INSTANCE_NAME,
                "QuartzScheduler");
        //PROP_SCHED_THREAD_NAME = org.quartz.scheduler.threadName
        //设置调度器线程名字，默认是调度器名字+_QuartzSchedulerThread
        String threadName = cfg.getStringProperty(PROP_SCHED_THREAD_NAME,
                schedName + "_QuartzSchedulerThread");
        //DEFAULT_INSTANCE_ID = NON_CLUSTERED
        //PROP_SCHED_INSTANCE_ID = org.quartz.scheduler.instanceId
        String schedInstId = cfg.getStringProperty(PROP_SCHED_INSTANCE_ID,
                DEFAULT_INSTANCE_ID);
        //AUTO_GENERATE_INSTANCE_ID = AUTO
        //这段if代码逻辑是判断是否用户是否设置自动生成scheduleinstanceId自动生成
        //生成id的默认实现类是org.quartz.simpl.SimpleInstanceIdGenerator
        if (schedInstId.equals(AUTO_GENERATE_INSTANCE_ID)) {
            autoId = true;
            instanceIdGeneratorClass = cfg.getStringProperty(
                    PROP_SCHED_INSTANCE_ID_GENERATOR_CLASS,
                    "org.quartz.simpl.SimpleInstanceIdGenerator");
        }
        // SYSTEM_PROPERTY_AS_INSTANCE_ID = SYS_PROP
        //生成id的默认实现类是org.quartz.simpl.SystemPropertyInstanceIdGenerator
        else if (schedInstId.equals(SYSTEM_PROPERTY_AS_INSTANCE_ID)) {
            autoId = true;
            instanceIdGeneratorClass = 
                    "org.quartz.simpl.SystemPropertyInstanceIdGenerator";
        }
        //PROP_SCHED_USER_TX_URL = org.quartz.scheduler.userTransactionURL
        userTXLocation = cfg.getStringProperty(PROP_SCHED_USER_TX_URL,
                userTXLocation);
        if (userTXLocation != null && userTXLocation.trim().length() == 0) {
            userTXLocation = null;
        }
        // PROP_SCHED_CLASS_LOAD_HELPER_CLASS = org.quartz.scheduler.classLoadHelper.class
        classLoadHelperClass = cfg.getStringProperty(
                PROP_SCHED_CLASS_LOAD_HELPER_CLASS,
                "org.quartz.simpl.CascadingClassLoadHelper");
        //PROP_SCHED_WRAP_JOB_IN_USER_TX = org.quartz.scheduler.wrapJobExecutionInUserTransaction
        wrapJobInTx = cfg.getBooleanProperty(PROP_SCHED_WRAP_JOB_IN_USER_TX,
                wrapJobInTx);
        //PROP_SCHED_JOB_FACTORY_CLASS = org.quartz.scheduler.jobFactory.class
        jobFactoryClass = cfg.getStringProperty(
                PROP_SCHED_JOB_FACTORY_CLASS, null);
        //PROP_SCHED_IDLE_WAIT_TIME = org.quartz.scheduler.idleWaitTime
        idleWaitTime = cfg.getLongProperty(PROP_SCHED_IDLE_WAIT_TIME,
                idleWaitTime);
        if(idleWaitTime > -1 && idleWaitTime < 1000) {
            throw new SchedulerException("org.quartz.scheduler.idleWaitTime of less than 1000ms is not legal.");
        }
        //PROP_SCHED_DB_FAILURE_RETRY_INTERVAL = org.quartz.scheduler.dbFailureRetryInterval
        dbFailureRetry = cfg.getLongProperty(PROP_SCHED_DB_FAILURE_RETRY_INTERVAL, dbFailureRetry);
        if (dbFailureRetry < 0) {
            throw new SchedulerException(PROP_SCHED_DB_FAILURE_RETRY_INTERVAL + " of less than 0 ms is not legal.");
        }
        //PROP_SCHED_MAKE_SCHEDULER_THREAD_DAEMON = org.quartz.scheduler.makeSchedulerThreadDaemon
        boolean makeSchedulerThreadDaemon =
            cfg.getBooleanProperty(PROP_SCHED_MAKE_SCHEDULER_THREAD_DAEMON);
        //PROP_SCHED_SCHEDULER_THREADS_INHERIT_CONTEXT_CLASS_LOADER_OF_INITIALIZING_THREAD =
        // org.quartz.scheduler.threadsInheritContextClassLoaderOfInitializer
        boolean threadsInheritInitalizersClassLoader =
            cfg.getBooleanProperty(PROP_SCHED_SCHEDULER_THREADS_INHERIT_CONTEXT_CLASS_LOADER_OF_INITIALIZING_THREAD);
        //PROP_SCHED_BATCH_TIME_WINDOW = org.quartz.scheduler.batchTriggerAcquisitionFireAheadTimeWindow
        long batchTimeWindow = cfg.getLongProperty(PROP_SCHED_BATCH_TIME_WINDOW, 0L);
        //PROP_SCHED_MAX_BATCH_SIZE = org.quartz.scheduler.batchTriggerAcquisitionMaxCount
        int maxBatchSize = cfg.getIntProperty(PROP_SCHED_MAX_BATCH_SIZE, 1);
        //PROP_SCHED_INTERRUPT_JOBS_ON_SHUTDOWN = org.quartz.scheduler.interruptJobsOnShutdown
        boolean interruptJobsOnShutdown = cfg.getBooleanProperty(PROP_SCHED_INTERRUPT_JOBS_ON_SHUTDOWN, false);
        //PROP_SCHED_INTERRUPT_JOBS_ON_SHUTDOWN_WITH_WAIT = org.quartz.scheduler.interruptJobsOnShutdownWithWait
        boolean interruptJobsOnShutdownWithWait = cfg.getBooleanProperty(PROP_SCHED_INTERRUPT_JOBS_ON_SHUTDOWN_WITH_WAIT, false);
        //PROP_SCHED_JMX_EXPORT = org.quartz.scheduler.jmx.export
        boolean jmxExport = cfg.getBooleanProperty(PROP_SCHED_JMX_EXPORT);
        //PROP_SCHED_JMX_OBJECT_NAME = org.quartz.scheduler.jmx.objectName
        String jmxObjectName = cfg.getStringProperty(PROP_SCHED_JMX_OBJECT_NAME);
        //PROP_SCHED_JMX_PROXY = org.quartz.scheduler.jmx.proxy
        boolean jmxProxy = cfg.getBooleanProperty(PROP_SCHED_JMX_PROXY);
        //PROP_SCHED_JMX_PROXY_CLASS = org.quartz.scheduler.jmx.proxy.class
        String jmxProxyClass = cfg.getStringProperty(PROP_SCHED_JMX_PROXY_CLASS);
        //PROP_SCHED_RMI_EXPORT = org.quartz.scheduler.rmi.export
        boolean rmiExport = cfg.getBooleanProperty(PROP_SCHED_RMI_EXPORT, false);
        //PROP_SCHED_RMI_PROXY = org.quartz.scheduler.rmi.proxy
        boolean rmiProxy = cfg.getBooleanProperty(PROP_SCHED_RMI_PROXY, false);
        //PROP_SCHED_RMI_HOST = org.quartz.scheduler.rmi.registryHost
        String rmiHost = cfg.getStringProperty(PROP_SCHED_RMI_HOST, "localhost");
        //PROP_SCHED_RMI_PORT = org.quartz.scheduler.rmi.registryPort
        int rmiPort = cfg.getIntProperty(PROP_SCHED_RMI_PORT, 1099);
        //PROP_SCHED_RMI_SERVER_PORT = org.quartz.scheduler.rmi.serverPort
        int rmiServerPort = cfg.getIntProperty(PROP_SCHED_RMI_SERVER_PORT, -1);
        //PROP_SCHED_RMI_CREATE_REGISTRY = org.quartz.scheduler.rmi.createRegistry
        String rmiCreateRegistry = cfg.getStringProperty(
                PROP_SCHED_RMI_CREATE_REGISTRY,
                //CREATE_REGISTRY_NEVER = never
                QuartzSchedulerResources.CREATE_REGISTRY_NEVER);
        //PROP_SCHED_RMI_BIND_NAME = org.quartz.scheduler.rmi.bindName
        String rmiBindName = cfg.getStringProperty(PROP_SCHED_RMI_BIND_NAME);
        if (jmxProxy && rmiProxy) {
            throw new SchedulerConfigException("Cannot proxy both RMI and JMX.");
        }
        //MANAGEMENT_REST_SERVICE_ENABLED = org.quartz.managementRESTService.enabled
        boolean managementRESTServiceEnabled = cfg.getBooleanProperty(MANAGEMENT_REST_SERVICE_ENABLED, false);
        //MANAGEMENT_REST_SERVICE_HOST_PORT = org.quartz.managementRESTService.bind
        String managementRESTServiceHostAndPort = cfg.getStringProperty(MANAGEMENT_REST_SERVICE_HOST_PORT, "0.0.0.0:9889");
        //PROP_SCHED_CONTEXT_PREFIX = org.quartz.context.key
        Properties schedCtxtProps = cfg.getPropertyGroup(PROP_SCHED_CONTEXT_PREFIX, true);
...
}
```

上面就是一些属性的加载，其实功能非常简单，就是从我们的配置文件中取出一些配置参数。具体的可以看下我的注释。

我们按照之前的源码阅读方式，逐步来进行分解突破。

```java
 // If Proxying to remote scheduler, short-circuit here...
        //一般不调用
        // ~~~~~~~~~~~~~~~~~~
        if (rmiProxy) {
            if (autoId) {
                schedInstId = DEFAULT_INSTANCE_ID;
            }
            String uid = (rmiBindName == null) ? QuartzSchedulerResources.getUniqueIdentifier(
                    schedName, schedInstId) : rmiBindName;
            RemoteScheduler remoteScheduler = new RemoteScheduler(uid, rmiHost, rmiPort);
            schedRep.bind(remoteScheduler);
            return remoteScheduler;
        }
```

这个方法是用在rmi代理中的，我们在使用中基本不调用，所以我也没有深看（其实是因为我还太菜，过度钻入不好）。但其实是很有必要的，在扩展性上可以考虑更多。

注RMI：Java远程方法调用，即Java RMI（Java Remote Method Invocation）是Java编程语言里，一种用于实现远程过程调用的应用程序编程接口。它使客户机上运行的程序可以调用远程服务器上的对象。远程方法调用特性使Java编程人员能够在网络环境中分布操作。RMI全部的宗旨就是尽可能简化远程接口对象的使用。

之后代码是:

```java
        // Create class load helper
        ClassLoadHelper loadHelper = null;
        try {
            loadHelper = (ClassLoadHelper) loadClass(classLoadHelperClass)
                    .newInstance();
        } catch (Exception e) {
            throw new SchedulerConfigException(
                    "Unable to instantiate class load helper class: "
                            + e.getMessage(), e);
        }
        //CascadingClassLoadHelper 初始化
        loadHelper.initialize();
```

这里就开始初始化类加载器并且初始化。

```java
/**
     * 查询类加载器并加载类
     */
    private Class<?> loadClass(String className) throws ClassNotFoundException, SchedulerConfigException {
        try {
            ClassLoader cl = findClassloader();
            if(cl != null)
                return cl.loadClass(className);
            throw new SchedulerConfigException("Unable to find a class loader on the current thread or class.");
        } catch (ClassNotFoundException e) {
            if(getClass().getClassLoader() != null)
                return getClass().getClassLoader().loadClass(className);
            throw e;
        }
    }
    /**
     * 查询类加载器
     */
    private ClassLoader findClassloader() {
        // work-around set context loader for windows-service started jvms (QUARTZ-748)
        if(Thread.currentThread().getContextClassLoader() == null && getClass().getClassLoader() != null) {
            Thread.currentThread().setContextClassLoader(getClass().getClassLoader());
        }
        return Thread.currentThread().getContextClassLoader();
    }
    private String getSchedulerName() {
        return cfg.getStringProperty(PROP_SCHED_INSTANCE_NAME,
                "QuartzScheduler");
    }
```

可以看到我们这的类加载器是通过线程的上下文来进行获取的。这块代码也很一目了然，所以也不做太多介绍。

而loadHelper.initialize();这段代码是在执行初始化，这是个接口方法，实现方式根据子类不同而不通，我进去看了一个简单的实现类，里面其实就是空方法，所以主体流程上基本不设置也没什么关系。

```java
        // If Proxying to remote JMX scheduler, short-circuit here...
        //一般不调用
        // ~~~~~~~~~~~~~~~~~~
        if (jmxProxy) {
            if (autoId) {
                schedInstId = DEFAULT_INSTANCE_ID;
            }
            if (jmxProxyClass == null) {
                throw new SchedulerConfigException("No JMX Proxy Scheduler class provided");
            }
            RemoteMBeanScheduler jmxScheduler = null;
            try {
                jmxScheduler = (RemoteMBeanScheduler)loadHelper.loadClass(jmxProxyClass)
                        .newInstance();
            } catch (Exception e) {
                throw new SchedulerConfigException(
                        "Unable to instantiate RemoteMBeanScheduler class.", e);
            }
            if (jmxObjectName == null) {
                jmxObjectName = QuartzSchedulerResources.generateJMXObjectName(schedName, schedInstId);
            }
            jmxScheduler.setSchedulerObjectName(jmxObjectName);
            tProps = cfg.getPropertyGroup(PROP_SCHED_JMX_PROXY, true);
            try {
                setBeanProps(jmxScheduler, tProps);
            } catch (Exception e) {
                initException = new SchedulerException("RemoteMBeanScheduler class '"
                        + jmxProxyClass + "' props could not be configured.", e);
                throw initException;
            }
            jmxScheduler.initialize();
            schedRep.bind(jmxScheduler);
            return jmxScheduler;
        }
```

jmx基本正常流程下也不会用到，所以我们也不进行深度的展开。

注：JMX（Java Management Extensions，即Java管理扩展）是Java平台上为应用程序、设备、系统等植入管理功能的框架。JMX可以跨越一系列异构操作系统平台、系统体系结构和网络传输协议，灵活的开发无缝集成的系统、网络和服务管理应用。

可以看到虽然我们基本不怎么接触这个，但是框架的扩展性思路非常好。集成了JMX与RMI。

```java
//正常流程下的操作
        JobFactory jobFactory = null;
        //配置文件中是否指定jobFactory
        if(jobFactoryClass != null) {
            try {
                jobFactory = (JobFactory) loadHelper.loadClass(jobFactoryClass)
                        .newInstance();
            } catch (Exception e) {
                throw new SchedulerConfigException(
                        "Unable to instantiate JobFactory class: "
                                + e.getMessage(), e);
            }
            //PROP_SCHED_JOB_FACTORY_PREFIX = org.quartz.scheduler.jobFactory
            tProps = cfg.getPropertyGroup(PROP_SCHED_JOB_FACTORY_PREFIX, true);
            try {
                setBeanProps(jobFactory, tProps);
            } catch (Exception e) {
                initException = new SchedulerException("JobFactory class '"
                        + jobFactoryClass + "' props could not be configured.", e);
                throw initException;
            }
        }
```

这个流程在干嘛呢？其实是如果配置文件中指定了jobFactory的类名称后，回去加载，并且获取配置参数，把它注入到jobFactory的bean中。

```java
        InstanceIdGenerator instanceIdGenerator = null;
        //配置中不设置时跳过
        if(instanceIdGeneratorClass != null) {
            try {
                instanceIdGenerator = (InstanceIdGenerator) loadHelper.loadClass(instanceIdGeneratorClass)
                    .newInstance();
            } catch (Exception e) {
                throw new SchedulerConfigException(
                        "Unable to instantiate InstanceIdGenerator class: "
                        + e.getMessage(), e);
            }
            tProps = cfg.getPropertyGroup(PROP_SCHED_INSTANCE_ID_GENERATOR_PREFIX, true);
            try {
                setBeanProps(instanceIdGenerator, tProps);
            } catch (Exception e) {
                initException = new SchedulerException("InstanceIdGenerator class '"
                        + instanceIdGeneratorClass + "' props could not be configured.", e);
                throw initException;
            }
        }
```

相信大家也能一眼看出，根据这个类名就可以猜测出这是个自动生成标识ID的bean，如果我们有特定需求的话，也可以通过配置文件配置相应类名称进行加载注入，实现自己想要的效果。

```java
//获取线程池配置，创建线程池
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //PROP_THREAD_POOL_CLASS = org.quartz.threadPool.class
        String tpClass = cfg.getStringProperty(PROP_THREAD_POOL_CLASS, SimpleThreadPool.class.getName());
        if (tpClass == null) {
            initException = new SchedulerException(
                    "ThreadPool class not specified. ");
            throw initException;
        }
        try {
            tp = (ThreadPool) loadHelper.loadClass(tpClass).newInstance();
        } catch (Exception e) {
            initException = new SchedulerException("ThreadPool class '"
                    + tpClass + "' could not be instantiated.", e);
            throw initException;
        }
```

这里的内容也很简单。是从配置中获取线程池的类路径，如果没有的话就拿SimpleThreadPool，所以我们可以知道SimpleThreadPool是系统默认实现。

```java
//获取关于线程池的配置组
        //PROP_THREAD_POOL_PREFIX = org.quartz.threadPool
        tProps = cfg.getPropertyGroup(PROP_THREAD_POOL_PREFIX, true);
        try {
            //把配置文件中的信息写入到实例中
            setBeanProps(tp, tProps);
        } catch (Exception e) {
            initException = new SchedulerException("ThreadPool class '"
                    + tpClass + "' props could not be configured.", e);
            throw initException;
        }
```

这块代码简单易懂，就是把如果有线程池配置，就注入进去。下面是一波小高潮，让我们继续观看，不要着急。

```java
        //获取任务存储中心配置，创建任务存储中心
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //PROP_JOB_STORE_CLASS = org.quartz.jobStore.class
        //默认使用RAMJobStore内存存储
        String jsClass = cfg.getStringProperty(PROP_JOB_STORE_CLASS,
                RAMJobStore.class.getName());
        if (jsClass == null) {
            initException = new SchedulerException(
                    "JobStore class not specified. ");
            throw initException;
        }
        try {
            js = (JobStore) loadHelper.loadClass(jsClass).newInstance();
        } catch (Exception e) {
            initException = new SchedulerException("JobStore class '" + jsClass
                    + "' could not be instantiated.", e);
            throw initException;
        }
```

这里是加载job存储中心，我们可以看到默认实现是RAMJobStore，也就是内存存储，但是这有个通病也出自内存，就是万一机器挂了，任务内容就没有了，所以如果我们需要改造任务存储中心，可以在这里进行更改。

```java
        //反射设置schedName、schedInstId配置
        SchedulerDetailsSetter.setDetails(js, schedName, schedInstId);
        //PROP_JOB_STORE_PREFIX = org.quartz.jobStore
        tProps = cfg.getPropertyGroup(PROP_JOB_STORE_PREFIX, true, new String[] {
     PROP_JOB_STORE_LOCK_HANDLER_PREFIX});
        try {
            setBeanProps(js, tProps);
        } catch (Exception e) {
            initException = new SchedulerException("JobStore class '" + jsClass
                    + "' props could not be configured.", e);
            throw initException;
        }
        if (js instanceof JobStoreSupport) {
            // Install custom lock handler (Semaphore)
            // 获取锁类名
            String lockHandlerClass = cfg.getStringProperty(PROP_JOB_STORE_LOCK_HANDLER_CLASS);
            if (lockHandlerClass != null) {
                try {
                    Semaphore lockHandler = (Semaphore)loadHelper.loadClass(lockHandlerClass).newInstance();
                    tProps = cfg.getPropertyGroup(PROP_JOB_STORE_LOCK_HANDLER_PREFIX, true);
                    // If this lock handler requires the table prefix, add it to its properties.
                    if (lockHandler instanceof TablePrefixAware) {
                        tProps.setProperty(
                                PROP_TABLE_PREFIX, ((JobStoreSupport)js).getTablePrefix());
                        tProps.setProperty(
                                PROP_SCHED_NAME, schedName);
                    }
                    try {
                        setBeanProps(lockHandler, tProps);
                    } catch (Exception e) {
                        initException = new SchedulerException("JobStore LockHandler class '" + lockHandlerClass
                                + "' props could not be configured.", e);
                        throw initException;
                    }
                    ((JobStoreSupport)js).setLockHandler(lockHandler);
                    getLog().info("Using custom data access locking (synchronization): " + lockHandlerClass);
                } catch (Exception e) {
                    initException = new SchedulerException("JobStore LockHandler class '" + lockHandlerClass
                            + "' could not be instantiated.", e);
                    throw initException;
                }
            }
        }
```

这里先把调度器的名字和标志号注入进去，默认schedName为QuartzScheduler，schedInstId 为NON_CLUSTERED。之后获取锁类名，默认key是

```java
    public static final String PROP_JOB_STORE_PREFIX = "org.quartz.jobStore";
    public static final String PROP_JOB_STORE_LOCK_HANDLER_PREFIX = PROP_JOB_STORE_PREFIX + ".lockHandler";
    public static final String PROP_JOB_STORE_LOCK_HANDLER_CLASS = PROP_JOB_STORE_LOCK_HANDLER_PREFIX + ".class";
```

实际就是org.quartz.jobStore.lockHandler.class，然后根据这个key从配置查询锁类名。如果有的话，老套路，继续注入配置。这里大家可能会对Semaphore有点疑惑，这是什么？

```java
package org.quartz.impl.jdbcjobstore;
import java.sql.Connection;
/**
 * 锁控制器
 */
public interface Semaphore {
    /*
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * 
     * Interface.
     * 
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */
    /**
     * 获取锁
     */
    boolean obtainLock(Connection conn, String lockName) throws LockException;
    /**
     * 释放锁
     */
    void releaseLock(String lockName) throws LockException;
    /**
     * 是否连接
     */
    boolean requiresConnection();
}
```

这个接口是这样的，默认实现类是StdRowLockSemaphore，是用来做什么的呢？

主要是用来针对集群的同步操作，默认实现是通过数据库行锁来进行操作（个人感觉应该不怎么用得到，这部分也是扩展点）。

```java
// Set up any DataSources
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // PROP_DATASOURCE_PREFIX = org.quartz.dataSource
        String[] dsNames = cfg.getPropertyGroups(PROP_DATASOURCE_PREFIX);
        for (int i = 0; i < dsNames.length; i++) {
            PropertiesParser pp = new PropertiesParser(cfg.getPropertyGroup(
                    PROP_DATASOURCE_PREFIX + "." + dsNames[i], true));
            //PROP_CONNECTION_PROVIDER_CLASS = connectionProvider.class
            String cpClass = pp.getStringProperty(PROP_CONNECTION_PROVIDER_CLASS, null);
            // custom connectionProvider...
            if(cpClass != null) {
                ConnectionProvider cp = null;
                try {
                    cp = (ConnectionProvider) loadHelper.loadClass(cpClass).newInstance();
                } catch (Exception e) {
                    initException = new SchedulerException("ConnectionProvider class '" + cpClass
                            + "' could not be instantiated.", e);
                    throw initException;
                }
                try {
                    // remove the class name, so it isn't attempted to be set
                    pp.getUnderlyingProperties().remove(
                            PROP_CONNECTION_PROVIDER_CLASS);
                    if (cp instanceof PoolingConnectionProvider) {
                        populateProviderWithExtraProps((PoolingConnectionProvider)cp, pp.getUnderlyingProperties());
                    } else {
                        setBeanProps(cp, pp.getUnderlyingProperties());
                    }
                    cp.initialize();
                } catch (Exception e) {
                    initException = new SchedulerException("ConnectionProvider class '" + cpClass
                            + "' props could not be configured.", e);
                    throw initException;
                }
                dbMgr = DBConnectionManager.getInstance();
                dbMgr.addConnectionProvider(dsNames[i], cp);
            } else {
                String dsJndi = pp.getStringProperty(PROP_DATASOURCE_JNDI_URL, null);
                if (dsJndi != null) {
                    boolean dsAlwaysLookup = pp.getBooleanProperty(
                            PROP_DATASOURCE_JNDI_ALWAYS_LOOKUP);
                    String dsJndiInitial = pp.getStringProperty(
                            PROP_DATASOURCE_JNDI_INITIAL);
                    String dsJndiProvider = pp.getStringProperty(
                            PROP_DATASOURCE_JNDI_PROVDER);
                    String dsJndiPrincipal = pp.getStringProperty(
                            PROP_DATASOURCE_JNDI_PRINCIPAL);
                    String dsJndiCredentials = pp.getStringProperty(
                            PROP_DATASOURCE_JNDI_CREDENTIALS);
                    Properties props = null;
                    if (null != dsJndiInitial || null != dsJndiProvider
                            || null != dsJndiPrincipal || null != dsJndiCredentials) {
                        props = new Properties();
                        if (dsJndiInitial != null) {
                            props.put(PROP_DATASOURCE_JNDI_INITIAL,
                                    dsJndiInitial);
                        }
                        if (dsJndiProvider != null) {
                            props.put(PROP_DATASOURCE_JNDI_PROVDER,
                                    dsJndiProvider);
                        }
                        if (dsJndiPrincipal != null) {
                            props.put(PROP_DATASOURCE_JNDI_PRINCIPAL,
                                    dsJndiPrincipal);
                        }
                        if (dsJndiCredentials != null) {
                            props.put(PROP_DATASOURCE_JNDI_CREDENTIALS,
                                    dsJndiCredentials);
                        }
                    }
                    JNDIConnectionProvider cp = new JNDIConnectionProvider(dsJndi,
                            props, dsAlwaysLookup);
                    dbMgr = DBConnectionManager.getInstance();
                    dbMgr.addConnectionProvider(dsNames[i], cp);
                } else {
                    String dsDriver = pp.getStringProperty(PoolingConnectionProvider.DB_DRIVER);
                    String dsURL = pp.getStringProperty(PoolingConnectionProvider.DB_URL);
                    if (dsDriver == null) {
                        initException = new SchedulerException(
                                "Driver not specified for DataSource: "
                                        + dsNames[i]);
                        throw initException;
                    }
                    if (dsURL == null) {
                        initException = new SchedulerException(
                                "DB URL not specified for DataSource: "
                                        + dsNames[i]);
                        throw initException;
                    }
                    try {
                        PoolingConnectionProvider cp = new PoolingConnectionProvider(pp.getUnderlyingProperties());
                        dbMgr = DBConnectionManager.getInstance();
                        dbMgr.addConnectionProvider(dsNames[i], cp);
                        // Populate the underlying C3P0 data source pool properties
                        populateProviderWithExtraProps(cp, pp.getUnderlyingProperties());
                    } catch (Exception sqle) {
                        initException = new SchedulerException(
                                "Could not initialize DataSource: " + dsNames[i],
                                sqle);
                        throw initException;
                    }
                }
            }
        }
```

这部分代码大家可以大致看懂应该是跟连接数据库有关，这里提供了很多种连接方式，有Driver、JNDI或者自定义的。这部分个人感觉深度下去对我目前帮助不是特别大，所以我在这先跳过了。有兴趣的朋友可以深入继续看下去。但是这里的扩展性，我们可以学习一下，考虑到多种连接方式。

在数据库相关操作之后，接下来是插件相关操作~

```java
 // Set up any SchedulerPlugins
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        String[] pluginNames = cfg.getPropertyGroups(PROP_PLUGIN_PREFIX);
        SchedulerPlugin[] plugins = new SchedulerPlugin[pluginNames.length];
        for (int i = 0; i < pluginNames.length; i++) {
            Properties pp = cfg.getPropertyGroup(PROP_PLUGIN_PREFIX + "."
                    + pluginNames[i], true);
            String plugInClass = pp.getProperty(PROP_PLUGIN_CLASS, null);
            if (plugInClass == null) {
                initException = new SchedulerException(
                        "SchedulerPlugin class not specified for plugin '"
                                + pluginNames[i] + "'");
                throw initException;
            }
            SchedulerPlugin plugin = null;
            try {
                plugin = (SchedulerPlugin)
                        loadHelper.loadClass(plugInClass).newInstance();
            } catch (Exception e) {
                initException = new SchedulerException(
                        "SchedulerPlugin class '" + plugInClass
                                + "' could not be instantiated.", e);
                throw initException;
            }
            try {
                setBeanProps(plugin, pp);
            } catch (Exception e) {
                initException = new SchedulerException(
                        "JobStore SchedulerPlugin '" + plugInClass
                                + "' props could not be configured.", e);
                throw initException;
            }
            plugins[i] = plugin;
        }
```

这段代码非常明显，就是根据我们配置的插件类来进行初始化注入参数工作。目前也不做过度的展开~~~

```java
        // Set up any JobListeners
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Class<?>[] strArg = new Class[] {
      String.class };
        String[] jobListenerNames = cfg.getPropertyGroups(PROP_JOB_LISTENER_PREFIX);
        JobListener[] jobListeners = new JobListener[jobListenerNames.length];
        for (int i = 0; i < jobListenerNames.length; i++) {
            Properties lp = cfg.getPropertyGroup(PROP_JOB_LISTENER_PREFIX + "."
                    + jobListenerNames[i], true);
            String listenerClass = lp.getProperty(PROP_LISTENER_CLASS, null);
            if (listenerClass == null) {
                initException = new SchedulerException(
                        "JobListener class not specified for listener '"
                                + jobListenerNames[i] + "'");
                throw initException;
            }
            JobListener listener = null;
            try {
                listener = (JobListener)
                       loadHelper.loadClass(listenerClass).newInstance();
            } catch (Exception e) {
                initException = new SchedulerException(
                        "JobListener class '" + listenerClass
                                + "' could not be instantiated.", e);
                throw initException;
            }
            try {
                Method nameSetter = null;
                try {
                    nameSetter = listener.getClass().getMethod("setName", strArg);
                }
                catch(NoSuchMethodException ignore) {
                    /* do nothing */ 
                }
                if(nameSetter != null) {
                    nameSetter.invoke(listener, new Object[] {
     jobListenerNames[i] } );
                }
                setBeanProps(listener, lp);
            } catch (Exception e) {
                initException = new SchedulerException(
                        "JobListener '" + listenerClass
                                + "' props could not be configured.", e);
                throw initException;
            }
            jobListeners[i] = listener;
        }
```

这段源码内容作用相信大家大致也能猜的出来，就是关于Job的监听器初始化工作。我们看到可以配置多个Job监听器，这里有一个特殊点就是：

```java
try {
                nameSetter = listener.getClass().getMethod("setName", strArg);
                }
                catch(NoSuchMethodException ignore) {
                    /* do nothing */ 
                }
                if(nameSetter != null) {
                    nameSetter.invoke(listener, new Object[] {
     jobListenerNames[i] } );
                }
```

也不难理解，就是获取setName方法，并把配置的jobListener名字注入进去。至于为什么这里不直接使用setBeanProps(listener, lp);方式直接注入，这是个疑问点？

同理我们看下触发器监听器的初始化代码，代码基本一致，也不做过多介绍：

```java
        // Set up any TriggerListeners
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        String[] triggerListenerNames = cfg.getPropertyGroups(PROP_TRIGGER_LISTENER_PREFIX);
        TriggerListener[] triggerListeners = new TriggerListener[triggerListenerNames.length];
        for (int i = 0; i < triggerListenerNames.length; i++) {
            Properties lp = cfg.getPropertyGroup(PROP_TRIGGER_LISTENER_PREFIX + "."
                    + triggerListenerNames[i], true);
            String listenerClass = lp.getProperty(PROP_LISTENER_CLASS, null);
            if (listenerClass == null) {
                initException = new SchedulerException(
                        "TriggerListener class not specified for listener '"
                                + triggerListenerNames[i] + "'");
                throw initException;
            }
            TriggerListener listener = null;
            try {
                listener = (TriggerListener)
                       loadHelper.loadClass(listenerClass).newInstance();
            } catch (Exception e) {
                initException = new SchedulerException(
                        "TriggerListener class '" + listenerClass
                                + "' could not be instantiated.", e);
                throw initException;
            }
            try {
                Method nameSetter = null;
                try {
                    nameSetter = listener.getClass().getMethod("setName", strArg);
                }
                catch(NoSuchMethodException ignore) {
      /* do nothing */ }
                if(nameSetter != null) {
                    nameSetter.invoke(listener, new Object[] {
     triggerListenerNames[i] } );
                }
                setBeanProps(listener, lp);
            } catch (Exception e) {
                initException = new SchedulerException(
                        "TriggerListener '" + listenerClass
                                + "' props could not be configured.", e);
                throw initException;
            }
            triggerListeners[i] = listener;
        }
```

最后一个初始化属性是线程执行器：

```java
        // Get ThreadExecutor Properties
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        String threadExecutorClass = cfg.getStringProperty(PROP_THREAD_EXECUTOR_CLASS);
        if (threadExecutorClass != null) {
            tProps = cfg.getPropertyGroup(PROP_THREAD_EXECUTOR, true);
            try {
                threadExecutor = (ThreadExecutor) loadHelper.loadClass(threadExecutorClass).newInstance();
                log.info("Using custom implementation for ThreadExecutor: " + threadExecutorClass);
                setBeanProps(threadExecutor, tProps);
            } catch (Exception e) {
                initException = new SchedulerException(
                        "ThreadExecutor class '" + threadExecutorClass + "' could not be instantiated.", e);
                throw initException;
            }
        } else {
            log.info("Using default implementation for ThreadExecutor");
            threadExecutor = new DefaultThreadExecutor();
        }
```

这里也是千篇一律的加载threadExecutor类。

接下来终于要到初始化的高潮了，也就是最后一步了~~~~开搞！！！

```java
         // Fire everything up
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        boolean tpInited = false;
        boolean qsInited = false;
        try {
            //这是一个封装执行Job的工厂类，这里会有一个JobRunShell类，主要是为了一些listener的执行和异常处理，这里不做深入展开
            JobRunShellFactory jrsf = null; // Create correct run-shell factory...
            //是否设置事务
            if (userTXLocation != null) {
                UserTransactionHelper.setUserTxLocation(userTXLocation);
            }
            //包装任务进事务中，默认false
            if (wrapJobInTx) {
                jrsf = new JTAJobRunShellFactory();
            } else {
                jrsf = new JTAAnnotationAwareJobRunShellFactory();
            }
            //设置任务调度器唯一标识符
            if (autoId) {
                try {
                  schedInstId = DEFAULT_INSTANCE_ID;
                  //如果JobStore是集群，必须要有调度器唯一标识符生成器
                  if (js.isClustered()) {
                      schedInstId = instanceIdGenerator.generateInstanceId();
                  }
                } catch (Exception e) {
                    getLog().error("Couldn't generate instance Id!", e);
                    throw new IllegalStateException("Cannot run without an instance id.");
                }
            }
            //应该和JMX相关，而我们默认实现的是RAMJobStore，开头是org.quartz.simpl，所以不做深度进去解析
            if (js.getClass().getName().startsWith("org.terracotta.quartz")) {
                try {
                    String uuid = (String) js.getClass().getMethod("getUUID").invoke(js);
                    if(schedInstId.equals(DEFAULT_INSTANCE_ID)) {
                        schedInstId = "TERRACOTTA_CLUSTERED,node=" + uuid;
                        if (jmxObjectName == null) {
                            jmxObjectName = QuartzSchedulerResources.generateJMXObjectName(schedName, schedInstId);
                        }
                    } else if(jmxObjectName == null) {
                        jmxObjectName = QuartzSchedulerResources.generateJMXObjectName(schedName, schedInstId + ",node=" + uuid);
                    }
                } catch(Exception e) {
                    throw new RuntimeException("Problem obtaining node id from TerracottaJobStore.", e);
                }
                if(null == cfg.getStringProperty(PROP_SCHED_JMX_EXPORT)) {
                    jmxExport = true;
                }
            }
            //我们默认实现的是RAMJobStore，也不是JobStoreSupport的实现类，JobStoreSupport主要是用于数据库存储信息
            if (js instanceof JobStoreSupport) {
                JobStoreSupport jjs = (JobStoreSupport)js;
                //存储失败重试时间
                jjs.setDbRetryInterval(dbFailureRetry);
                //这部分代码目前还不太懂
                if(threadsInheritInitalizersClassLoader)
                    jjs.setThreadsInheritInitializersClassLoadContext(threadsInheritInitalizersClassLoader);
                //把之前初始化成功的线程执行器放入
                jjs.setThreadExecutor(threadExecutor);
            }
            //开始创建调度器资源类
            QuartzSchedulerResources rsrcs = new QuartzSchedulerResources();
            rsrcs.setName(schedName);
            rsrcs.setThreadName(threadName);
            rsrcs.setInstanceId(schedInstId);
            rsrcs.setJobRunShellFactory(jrsf);
            rsrcs.setMakeSchedulerThreadDaemon(makeSchedulerThreadDaemon);
            rsrcs.setThreadsInheritInitializersClassLoadContext(threadsInheritInitalizersClassLoader);
            rsrcs.setBatchTimeWindow(batchTimeWindow);
            rsrcs.setMaxBatchSize(maxBatchSize);
            rsrcs.setInterruptJobsOnShutdown(interruptJobsOnShutdown);
            rsrcs.setInterruptJobsOnShutdownWithWait(interruptJobsOnShutdownWithWait);
            rsrcs.setJMXExport(jmxExport);
            rsrcs.setJMXObjectName(jmxObjectName);
            //这块也不是太懂
            if (managementRESTServiceEnabled) {
                ManagementRESTServiceConfiguration managementRESTServiceConfiguration = new ManagementRESTServiceConfiguration();
                managementRESTServiceConfiguration.setBind(managementRESTServiceHostAndPort);
                managementRESTServiceConfiguration.setEnabled(managementRESTServiceEnabled);
                rsrcs.setManagementRESTServiceConfiguration(managementRESTServiceConfiguration);
            }
            //这里是rmi相关，也跳过
            if (rmiExport) {
                rsrcs.setRMIRegistryHost(rmiHost);
                rsrcs.setRMIRegistryPort(rmiPort);
                rsrcs.setRMIServerPort(rmiServerPort);
                rsrcs.setRMICreateRegistryStrategy(rmiCreateRegistry);
                rsrcs.setRMIBindName(rmiBindName);
            }
            // ThreadPool tp 是线程池，这里是对setInstanceName，setInstanceId赋值
            SchedulerDetailsSetter.setDetails(tp, schedName, schedInstId);
            //在调度器资源类中放入线程执行器
            rsrcs.setThreadExecutor(threadExecutor);
            //线程执行器初始化，看了下默认的，就是一个空方法
            threadExecutor.initialize();
            //设置线程池
            rsrcs.setThreadPool(tp);
            if(tp instanceof SimpleThreadPool) {
                if(threadsInheritInitalizersClassLoader)
                    ((SimpleThreadPool)tp).setThreadsInheritContextClassLoaderOfInitializingThread(threadsInheritInitalizersClassLoader);
            }
            tp.initialize();
            tpInited = true;
            rsrcs.setJobStore(js);
            // add plugins
            for (int i = 0; i < plugins.length; i++) {
                rsrcs.addSchedulerPlugin(plugins[i]);
            }
            qs = new QuartzScheduler(rsrcs, idleWaitTime, dbFailureRetry);
            qsInited = true;
            // 关键点，创建出Scheduler，默认是StdScheduler
            Scheduler scheduler = instantiate(rsrcs, qs);
            // set job factory if specified
            if(jobFactory != null) {
                qs.setJobFactory(jobFactory);
            }
            // Initialize plugins now that we have a Scheduler instance.
            for (int i = 0; i < plugins.length; i++) {
                plugins[i].initialize(pluginNames[i], scheduler, loadHelper);
            }
            // add listeners
            for (int i = 0; i < jobListeners.length; i++) {
                qs.getListenerManager().addJobListener(jobListeners[i], EverythingMatcher.allJobs());
            }
            for (int i = 0; i < triggerListeners.length; i++) {
                qs.getListenerManager().addTriggerListener(triggerListeners[i], EverythingMatcher.allTriggers());
            }
            // set scheduler context data...
            for(Object key: schedCtxtProps.keySet()) {
                String val = schedCtxtProps.getProperty((String) key);    
                scheduler.getContext().put((String)key, val);
            }
            // 开始初始化JobStore
            js.setInstanceId(schedInstId);
            js.setInstanceName(schedName);
            js.setThreadPoolSize(tp.getPoolSize());
            js.initialize(loadHelper, qs.getSchedulerSignaler());
            //其实就是在jrsf注入scheduler变量
            jrsf.initialize(scheduler);
            //这里做了远程绑定，如果没有的话会直接跳过
            qs.initialize();
            getLog().info(
                    "Quartz scheduler '" + scheduler.getSchedulerName()
                            + "' initialized from " + propSrc);
            getLog().info("Quartz scheduler version: " + qs.getVersion());
            // prevents the repository from being garbage collected
            qs.addNoGCObject(schedRep);
            // prevents the db manager from being garbage collected
            if (dbMgr != null) {
                qs.addNoGCObject(dbMgr);
            }
            //调用程序库SchedulerRepository中新添加scheduler
            schedRep.bind(scheduler);
            return scheduler;
        }
        catch(SchedulerException e) {
            shutdownFromInstantiateException(tp, qs, tpInited, qsInited);
            throw e;
        }
        catch(RuntimeException re) {
            shutdownFromInstantiateException(tp, qs, tpInited, qsInited);
            throw re;
        }
        catch(Error re) {
            shutdownFromInstantiateException(tp, qs, tpInited, qsInited);
            throw re;
        }   
```

这里做了什么呢？总结来说，就是各种绑定。分布来说的话就是：

创建一个JobRunShellFactory，这是JobRunShell类的工厂类，主要是为了一些listener的执行和异常处理

创建QuartzSchedulerResources，也就是QuartzScheduler的资源类，然后把各类资源都赋值进去

创建出关键的StdScheduler，这个和QuartzScheduler不同，StdScheduler持有QuartzScheduler

SchedulerRepository添加新的StdScheduler

最后返回StdScheduler
