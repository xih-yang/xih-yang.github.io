# 05、Sentinel源码解析，Sentinel如何实现自适应限流？
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/5.html
- 分类：服务保障
- 分组：Sentinel 源码解析
这篇文章主要学习一下Sentinel如何实现自适应限流的。

为什么要做自适应限流，官方给了两个理由：

**1、** 保证系统不被拖垮；

**2、** 在系统稳定的前提下，保持系统的吞吐量；

我再贴一下官方的原理：

**1、** 能够保证水管里的水量，能够让水顺畅的流动，则不会增加排队的请求；也就是说，这个时候的系统负载不会进一步恶化；

**2、** 当保持入口的流量是水管出来的流量的最大的值的时候，可以最大利用水管的处理能力；

更加具体的原理解释可以看官方：[系统自适应限流](https://github.com/alibaba/Sentinel/wiki/%E7%B3%BB%E7%BB%9F%E8%87%AA%E9%80%82%E5%BA%94%E9%99%90%E6%B5%81)

所以看起来好像很厉害的样子，所以我们来看看具体实现吧。

例子：

**1、** 设置系统自适应规则；

```java
List<SystemRule> rules = new ArrayList<SystemRule>();
SystemRule rule = new SystemRule();
//限制最大负载
rule.setHighestSystemLoad(3.0);
// cpu负载60%
rule.setHighestCpuUsage(0.6);
// 设置平均响应时间 10 ms
rule.setAvgRt(10);
// 设置qps is 20
rule.setQps(20);
// 设置最大线程数 10
rule.setMaxThread(10);
rules.add(rule);
SystemRuleManager.loadRules(Collections.singletonList(rule));
```

**1、** 设置限流；

```java
Entry entry = null;
try {
    entry = SphU.entry("methodA", EntryType.IN); 
    //dosomething
} catch (BlockException e1) {
    block.incrementAndGet();
    //dosomething
} catch (Exception e2) {
    // biz exception
} finally { 
    if (entry != null) {
        entry.exit();
    }
}
```

注意：系统保护规则是应用整体维度的，而不是资源维度的，并且仅对入口流量生效。入口流量指的是进入应用的流量（EntryType.IN），比如 Web 服务或 Dubbo 服务端接收的请求，都属于入口流量。

我们先讲一下SystemRuleManager这个类在初始化的时候做了什么吧。

**SystemRuleManager**

```java
private static SystemStatusListener statusListener = null;
@SuppressWarnings("PMD.ThreadPoolCreationRule")
private final static ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1,
    new NamedThreadFactory("sentinel-system-status-record-task", true));
static {
    checkSystemStatus.set(false);
    statusListener = new SystemStatusListener();
    scheduler.scheduleAtFixedRate(statusListener, 5, 1, TimeUnit.SECONDS);
    currentProperty.addListener(listener);
}
```

SystemRuleManager初始化的时候会调用静态代码块，然后用scheduler线程池定时调用SystemStatusListener类的run方法。我们进入到SystemStatusListener类里看一下：

**SystemStatusListener#run**

```java
public void run() {
    try {
        OperatingSystemMXBean osBean = ManagementFactory.getPlatformMXBean(OperatingSystemMXBean.class);
        currentLoad = osBean.getSystemLoadAverage();
        currentCpuUsage = osBean.getSystemCpuLoad();
        StringBuilder sb = new StringBuilder();
        if (currentLoad > SystemRuleManager.getHighestSystemLoad()) {
            sb.append("load:").append(currentLoad).append(";");
            sb.append("cpu:").append(currentCpuUsage).append(";");
            sb.append("qps:").append(Constants.ENTRY_NODE.passQps()).append(";");
            sb.append("rt:").append(Constants.ENTRY_NODE.avgRt()).append(";");
            sb.append("thread:").append(Constants.ENTRY_NODE.curThreadNum()).append(";");
            sb.append("success:").append(Constants.ENTRY_NODE.successQps()).append(";");
            sb.append("minRt:").append(Constants.ENTRY_NODE.minRt()).append(";");
            sb.append("maxSuccess:").append(Constants.ENTRY_NODE.maxSuccessQps()).append(";");
            RecordLog.info(sb.toString());
        }
    } catch (Throwable e) {
        RecordLog.info("could not get system error ", e);
    }
}
```

这个方法用来做两件事：

**1、** 定时收集全局资源情况，并打印日志；

**2、** 给全局变量currentLoad和currentCpuUsage赋值，用来做限流使用；

然后看一下SystemRuleManager.loadRules方法。SystemRuleManager和其他的规则管理是一样的，当调用loadRules方法的时候会调用内部的listener并触发它的configUpdate方法。

在SystemRuleManager中实现类了一个SystemPropertyListener，最终SystemRuleManager.loadRules方法会调用到SystemPropertyListener的configUpdate中。

**SystemPropertyListener#configUpdate**

```java
public void configUpdate(List<SystemRule> rules) {
    restoreSetting();
    // systemRules = rules;
    if (rules != null && rules.size() >= 1) {
        for (SystemRule rule : rules) {
            loadSystemConf(rule);
        }
    } else {
        checkSystemStatus.set(false);
    }
    RecordLog.info(String.format("[SystemRuleManager] Current system check status: %s, "
            + "highestSystemLoad: %e, "
            + "highestCpuUsage: %e, "
            + "maxRt: %d, "
            + "maxThread: %d, "
            + "maxQps: %e",
        checkSystemStatus.get(),
        highestSystemLoad,
        highestCpuUsage,
        maxRt,
        maxThread,
        qps));
}
```

这个方法很简单，首先是调用restoreSetting，用来重置rule的属性，然后遍历rule调用loadSystemConf对规则进行设置：

**SystemRuleManager#loadSystemConf**

```java
public static void loadSystemConf(SystemRule rule) {
    boolean checkStatus = false;
    // Check if it's valid.
    if (rule.getHighestSystemLoad() >= 0) {
        highestSystemLoad = Math.min(highestSystemLoad, rule.getHighestSystemLoad());
        highestSystemLoadIsSet = true;
        checkStatus = true;
    }
    if (rule.getHighestCpuUsage() >= 0) {
        highestCpuUsage = Math.min(highestCpuUsage, rule.getHighestCpuUsage());
        highestCpuUsageIsSet = true;
        checkStatus = true;
    }
    if (rule.getAvgRt() >= 0) {
        maxRt = Math.min(maxRt, rule.getAvgRt());
        maxRtIsSet = true;
        checkStatus = true;
    }
    if (rule.getMaxThread() >= 0) {
        maxThread = Math.min(maxThread, rule.getMaxThread());
        maxThreadIsSet = true;
        checkStatus = true;
    }
    if (rule.getQps() >= 0) {
        qps = Math.min(qps, rule.getQps());
        qpsIsSet = true;
        checkStatus = true;
    }
    checkSystemStatus.set(checkStatus);
}
```

这些属性都是在限流控制中会用到的属性，无论设置哪个属性都会设置checkStatus=true表示开启系统自适应限流。

在设置好限流规则后会进入到SphU.entry方法中，通过创建slot链调用到SystemSlot，这里是系统自适应限流的地方。

**SystemSlot#entry**

```java
public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count,
                  boolean prioritized, Object... args) throws Throwable {
	  //检查一下是否符合限流条件，符合则进行限流
    SystemRuleManager.checkSystem(resourceWrapper);
    fireEntry(context, resourceWrapper, node, count, prioritized, args);
}
```

**SystemRuleManager#checkSystem**

```java
public static void checkSystem(ResourceWrapper resourceWrapper) throws BlockException {
    // Ensure the checking switch is on.
    if (!checkSystemStatus.get()) {
        return;
    }
    //如果不是入口流量，那么直接返回
    // for inbound traffic only
    if (resourceWrapper.getType() != EntryType.IN) {
        return;
    }
    // total qps
    double currentQps = Constants.ENTRY_NODE == null ? 0.0 : Constants.ENTRY_NODE.successQps();
    if (currentQps > qps) {
        throw new SystemBlockException(resourceWrapper.getName(), "qps");
    }
    // total thread
    int currentThread = Constants.ENTRY_NODE == null ? 0 : Constants.ENTRY_NODE.curThreadNum();
    if (currentThread > maxThread) {
        throw new SystemBlockException(resourceWrapper.getName(), "thread");
    }
    double rt = Constants.ENTRY_NODE == null ? 0 : Constants.ENTRY_NODE.avgRt();
    if (rt > maxRt) {
        throw new SystemBlockException(resourceWrapper.getName(), "rt");
    }
    // load. BBR algorithm.
    if (highestSystemLoadIsSet && getCurrentSystemAvgLoad() > highestSystemLoad) {
        if (!checkBbr(currentThread)) {
            throw new SystemBlockException(resourceWrapper.getName(), "load");
        }
    }
    // cpu usage
    if (highestCpuUsageIsSet && getCurrentCpuUsage() > highestCpuUsage) {
        if (!checkBbr(currentThread)) {
            throw new SystemBlockException(resourceWrapper.getName(), "cpu");
        }
    }
}
```

这个方法首先会校验一下checkSystemStatus状态和EntryType是不是IN，如果不是则直接返回。

然后对Constants.ENTRY_NODE进行操作。这个对象是一个final static 修饰的变量，代表是全局对象。

```java
public final static ClusterNode ENTRY_NODE = new ClusterNode();
```

所以这里的限流操作都是对全局其作用的，而不是对资源起作用。ClusterNode还是继承自StatisticNode，所以最后都是调用StatisticNode的successQps、curThreadNum、avgRt，这几个方法我的前几篇文章都已经讲过了，感兴趣的可以自己去翻一下，这里就不过多涉及了。

在下面调用getCurrentSystemAvgLoad方法和getCurrentCpuUsage方法调用到SystemStatusListener设置的全局变量currentLoad和currentCpuUsage。这两个参数是SystemRuleManager的定时任务定时收集的，忘了的同学回到上面讲解SystemRuleManager的地方看一下。

在做load判断和cpu usage判断的时候会还会调用checkBbr方法来判断：

```java
private static boolean checkBbr(int currentThread) {
    if (currentThread > 1 &&
        currentThread > Constants.ENTRY_NODE.maxSuccessQps() * Constants.ENTRY_NODE.minRt() / 1000) {
        return false;
    }
    return true;
}
```

也就是说：当系统 load1 超过阈值，且系统当前的并发线程数超过系统容量时才会触发系统保护。系统容量由系统的 maxQps * minRt 计算得出。

**StatisticNode#maxSuccessQps**

```java
public double maxSuccessQps() {
    return rollingCounterInSecond.maxSuccess() * rollingCounterInSecond.getSampleCount();
}
```

maxSuccessQps方法是用窗口内的最大成功调用数和窗口数量相乘rollingCounterInSecond的窗口1秒的窗口数量是2，最大成功调用数如下得出：

**ArrayMetric#maxSuccess**

```java
public long maxSuccess() {
    data.currentWindow();
    long success = 0;
    List<MetricBucket> list = data.values();
    for (MetricBucket window : list) {
        if (window.success() > success) {
            success = window.success();
        }
    }
    return Math.max(success, 1);
}
```

最大成功调用数是通过整个遍历整个窗口，获取所有窗口里面最大的调用数。所以这样的最大的并发量是一个预估值，不是真实值。

看到这里我们再来看一下Constants.ENTRY_NODE的信息是怎么被收集的。

我在分析StatisticSlot这个类的时候有一段代码我当时也没看懂有什么用，现在就迎刃而解了：

**StatisticSlot#entry**

```java
public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count,
                  boolean prioritized, Object... args) throws Throwable {
    try { 
			....
        if (resourceWrapper.getType() == EntryType.IN) {
            // Add count for global inbound entry node for global statistics.
            Constants.ENTRY_NODE.increaseThreadNum();
            Constants.ENTRY_NODE.addPassRequest(count);
        }
			....
    } catch (PriorityWaitException ex) {
			....
        if (resourceWrapper.getType() == EntryType.IN) {
            // Add count for global inbound entry node for global statistics.
            Constants.ENTRY_NODE.increaseThreadNum();
        }
         ....
    } catch (BlockException e) {
			....
        if (resourceWrapper.getType() == EntryType.IN) {
            // Add count for global inbound entry node for global statistics.
            Constants.ENTRY_NODE.increaseBlockQps(count);
        }
			.... 
        throw e;
    } catch (Throwable e) {
         ....
        if (resourceWrapper.getType() == EntryType.IN) {
            Constants.ENTRY_NODE.increaseExceptionQps(count);
        }
        throw e;
    }
}
```

在StatisticSlot的entry方法里有很多对于type的判断，如果是EntryType.IN，那么就调用Constants.ENTRY_NODE的静态方法进行数据的收集。

所以看到这里我们可以知道，在前面有很多看不懂的代码其实只要慢慢琢磨，打个标记，那么在后面的解析的过程中还是能够慢慢看懂的。

共勉~~
