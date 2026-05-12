# 02、Quartz 源码分析 - Job源码解析
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/10.html
- 分类：作业调度
- 分组：Quartz 源码解析
### Quartz中的Job是什么？

联系自己对于定时任务的理解，其实就是对于任务的抽象，所以这个类其实你在不看源码时，可能就已经就猜到了它是一个接口，一搜源码，果然没错：

```java
package org.quartz;
/**
 * 定时任务对于任务的抽象
 */
public interface Job {
    /**
     * 定时任务执行逻辑
     */
    void execute(JobExecutionContext context)
        throws JobExecutionException;
}
```

非常简单，是否你再没有看之前，自己也已经构想到了呢？但是这边又引发了另一个类不接，就是JobExecutionContext，但是细想一下，你可能也会觉得在情理之中，因为在执行任务中，可能你需要获取任务信息。然后你可能会想，比如呢？ 在生产环境中，你可能会用到分布式的定时任务，那么你如何让任务判断自己改处理哪些数据信息呢，这个时候你可以获取Job的上下文，针对取余等等方式，避免数据重复处理。

### JobExecutionContext源码解析

首先这也是一个接口，由于内部方法有点多，我们挑一个最重要的分析一下：

```java
package org.quartz;
import java.util.Date;
/**
 * Job任务执行时获取到的上下文
 */
public interface JobExecutionContext {
    ...
    /**
     * 获取任务详细信息
     */
    public JobDetail getJobDetail();
    ...
}
```

对于这个类的实现类，默认是JobExecutionContextImpl，由于篇幅原因，这个就不做特地展开，因为这个类只是简单的把属性取出，很简单。那接下来，便开始解决读者的下一个以为，什么是JobDetail？

### JobDetail源码解析

你可以先猜想一下，这个接口中会包含哪些信息？

我们直接进入它的实现类：

```java
package org.quartz.impl;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobBuilder;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobKey;
import org.quartz.PersistJobDataAfterExecution;
import org.quartz.Scheduler;
import org.quartz.StatefulJob;
import org.quartz.Trigger;
import org.quartz.utils.ClassUtils;
/**
 * 任务相信信息
 */
public class JobDetailImpl implements Cloneable, java.io.Serializable, JobDetail {
    private static final long serialVersionUID = -6069784757781506897L;
    /**
     * 任务名称
     */
    private String name;
    /**
     * 任务所属组
     */
    private String group = Scheduler.DEFAULT_GROUP;
    /**
     * 任务描述
     */
    private String description;
    /**
     * 任务类
     */
    private Class<? extends Job> jobClass;
    /**
     * 任务额外信息
     */
    private JobDataMap jobDataMap;
    private boolean durability = false;
    private boolean shouldRecover = false;
    /**
     * 任务唯一标识
     */
    private transient JobKey key = null;
    public JobDetailImpl() {
    }
    public JobDetailImpl(String name, Class<? extends Job> jobClass) {
        this(name, null, jobClass);
    }
    public JobDetailImpl(String name, String group, Class<? extends Job> jobClass) {
        setName(name);
        setGroup(group);
        setJobClass(jobClass);
    }
    public JobDetailImpl(String name, String group, Class<? extends Job> jobClass,
                     boolean durability, boolean recover) {
        setName(name);
        setGroup(group);
        setJobClass(jobClass);
        setDurability(durability);
        setRequestsRecovery(recover);
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        if (name == null || name.trim().length() == 0) {
            throw new IllegalArgumentException("Job name cannot be empty.");
        }
        this.name = name;
        this.key = null;
    }
    public String getGroup() {
        return group;
    }
    public void setGroup(String group) {
        if (group != null && group.trim().length() == 0) {
            throw new IllegalArgumentException(
                    "Group name cannot be empty.");
        }
        if (group == null) {
            group = Scheduler.DEFAULT_GROUP;
        }
        this.group = group;
        this.key = null;
    }
    public String getFullName() {
        return group + "." + name;
    }
    public JobKey getKey() {
        if(key == null) {
            if(getName() == null)
                return null;
            key = new JobKey(getName(), getGroup());
        }
        return key;
    }
    public void setKey(JobKey key) {
        if(key == null)
            throw new IllegalArgumentException("Key cannot be null!");
        setName(key.getName());
        setGroup(key.getGroup());
        this.key = key;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public Class<? extends Job> getJobClass() {
        return jobClass;
    }
    public void setJobClass(Class<? extends Job> jobClass) {
        if (jobClass == null) {
            throw new IllegalArgumentException("Job class cannot be null.");
        }
        if (!Job.class.isAssignableFrom(jobClass)) {
            throw new IllegalArgumentException(
                    "Job class must implement the Job interface.");
        }
        this.jobClass = jobClass;
    }
    public JobDataMap getJobDataMap() {
        if (jobDataMap == null) {
            jobDataMap = new JobDataMap();
        }
        return jobDataMap;
    }
    public void setJobDataMap(JobDataMap jobDataMap) {
        this.jobDataMap = jobDataMap;
    }
   ...
    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof JobDetail)) {
            return false;
        }
        JobDetail other = (JobDetail) obj;
        if(other.getKey() == null || getKey() == null)
            return false;
        if (!other.getKey().equals(getKey())) {
            return false;
        }
        return true;
    }
    @Override
    public int hashCode() {
        JobKey key = getKey();
        return key == null ? 0 : getKey().hashCode();
    }
    @Override
    public Object clone() {
        JobDetailImpl copy;
        try {
            copy = (JobDetailImpl) super.clone();
            if (jobDataMap != null) {
                copy.jobDataMap = (JobDataMap) jobDataMap.clone();
            }
        } catch (CloneNotSupportedException ex) {
            throw new IncompatibleClassChangeError("Not Cloneable.");
        }
        return copy;
    }
    public JobBuilder getJobBuilder() {
        JobBuilder b = JobBuilder.newJob()
            .ofType(getJobClass())
            .requestRecovery(requestsRecovery())
            .storeDurably(isDurable())
            .usingJobData(getJobDataMap())
            .withDescription(getDescription())
            .withIdentity(getKey());
        return b;
    }
}
```

相信大家对于这些属性部分可以猜到，先讲一个大家可能没有太注意的Java关键字，是在属性key上的transient，这个关键字是用来干什么的呢？是针对于序列化与反序列化时，不对这个字段进行序列化操作的。这么做是为什么呢？我猜测是为了安全起见，以为定时任务是以这个key作为唯一标示的，序列化下把信息泄露可能会造成安全隐患。也可以看下这里重写了hasCode和equals方法，至于为什么这么做，大家应该能意会。这边大家可能对于JobBuilder有些好奇？

### JobBuilder源码解析

JobBuilder是定时任务构造器，用于构造一个JobDetail，源码如下：

```java
package org.quartz;
import org.quartz.impl.JobDetailImpl;
import org.quartz.utils.Key;
/**
 * 定时任务构造器，用于构造一个JobDetail
 */
public class JobBuilder {
    /**
     * 任务标识码，用于唯一确定任务
     */
    private JobKey key;
    private String description;
    private Class<? extends Job> jobClass;
    /**
     * Durability，持久性；如果Job是非持久性的，一旦没有Trigger与其相关联，
     * 它就会从Scheduler中被删除。也就是说Job的生命周期和其Trigger是关联的。
     */
    private boolean durability;
    /**
     * RequestsRecovery，如果为true，那么在Scheduler异常中止或者系统异常关闭后，当Scheduler重启后，Job会被重新执行。
     */
    private boolean shouldRecover;
    private JobDataMap jobDataMap = new JobDataMap();
    protected JobBuilder() {
    }
    public static JobBuilder newJob() {
        return new JobBuilder();
    }
    public static JobBuilder newJob(Class <? extends Job> jobClass) {
        JobBuilder b = new JobBuilder();
        b.ofType(jobClass);
        return b;
    }
    public JobDetail build() {
        JobDetailImpl job = new JobDetailImpl();
        job.setJobClass(jobClass);
        job.setDescription(description);
        if(key == null)
            key = new JobKey(Key.createUniqueName(null), null);
        job.setKey(key); 
        job.setDurability(durability);
        job.setRequestsRecovery(shouldRecover);
        if(!jobDataMap.isEmpty())
            job.setJobDataMap(jobDataMap);
        return job;
    }
    public JobBuilder withIdentity(String name) {
        key = new JobKey(name, null);
        return this;
    }  
    public JobBuilder withIdentity(String name, String group) {
        key = new JobKey(name, group);
        return this;
    }
    public JobBuilder withIdentity(JobKey jobKey) {
        this.key = jobKey;
        return this;
    }
    public JobBuilder withDescription(String jobDescription) {
        this.description = jobDescription;
        return this;
    }
    public JobBuilder ofType(Class <? extends Job> jobClazz) {
        this.jobClass = jobClazz;
        return this;
    }
  ...
}
```

一些简单的get、set方法被我删除了，可以看到这个类非常简单，就是作为一个构造器，根据属性构造出一个JobDetail。
