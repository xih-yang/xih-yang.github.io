# 03、Sentinel源码解析，QPS流量控制是如何实现的？
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/3.html
- 分类：服务保障
- 分组：Sentinel 源码解析
上回我们用基于并发数来讲了一下Sentinel的整个流程，这篇文章我们来讲一下Sentinel的QPS流量控制是如何实现的。

先上一个极简的demo，我们的代码就从这个demo入手：

```java
public static void main(String[] args) {
    List<FlowRule> rules = new ArrayList<FlowRule>();
    FlowRule rule1 = new FlowRule();
    rule1.setResource("abc"); 
    rule1.setCount(20);
    rule1.setGrade(RuleConstant.FLOW_GRADE_QPS);
    rule1.setLimitApp("default");
    rules.add(rule1);
    FlowRuleManager.loadRules(rules);
    Entry entry = null;
    try {
        entry = SphU.entry("abc");
        //dosomething 
    } catch (BlockException e1) {
    } catch (Exception e2) {
        // biz exception
    } finally {
        if (entry != null) {
            entry.exit();
        }
    }
}
```

在这个例子中我们首先新建了一个FlowRule实例，然后调用了loadRules方法加载规则，这部分的代码都和基于并发数的流量控制的代码是一样的，想要了解的朋友可以去看看我的这一篇文章[1.Sentinel源码解析—FlowRuleManager加载规则做了什么？](https://www.cnblogs.com/luozhiyun/p/11439993.html)，下面我们说说不一样的地方。

在调用FlowRuleManager的loadRules方法的时候会创建一个rater实例：

**FlowRuleUtil#buildFlowRuleMap**

```java
//设置拒绝策略：直接拒绝、Warm Up、匀速排队，默认是DefaultController
TrafficShapingController rater = generateRater(rule);
rule.setRater(rater);
```

我们进入到generateRater看一下是怎么创建实例的：

**FlowRuleUtil#generateRater**

```java
private static TrafficShapingController generateRater(/*@Valid*/ FlowRule rule) {
    if (rule.getGrade() == RuleConstant.FLOW_GRADE_QPS) {
        switch (rule.getControlBehavior()) {
            case RuleConstant.CONTROL_BEHAVIOR_WARM_UP:
                //warmUpPeriodSec默认是10 
                return new WarmUpController(rule.getCount(), rule.getWarmUpPeriodSec(),
                    ColdFactorProperty.coldFactor);
            case RuleConstant.CONTROL_BEHAVIOR_RATE_LIMITER:
                //rule.getMaxQueueingTimeMs()默认是500
                return new RateLimiterController(rule.getMaxQueueingTimeMs(), rule.getCount());
            case RuleConstant.CONTROL_BEHAVIOR_WARM_UP_RATE_LIMITER:
                return new WarmUpRateLimiterController(rule.getCount(), rule.getWarmUpPeriodSec(),
                    rule.getMaxQueueingTimeMs(), ColdFactorProperty.coldFactor);
            case RuleConstant.CONTROL_BEHAVIOR_DEFAULT:
            default:
                // Default mode or unknown mode: default traffic shaping controller (fast-reject).
        }
    }
    return new DefaultController(rule.getCount(), rule.getGrade());
}
```

这个方法里面如果设置的是按QPS的方式来限流的话，可以设置一个ControlBehavior属性，用来做流量控制分别是：直接拒绝、Warm Up、匀速排队。

接下来的所有的限流操作全部在FlowSlot中进行，不熟悉Sentinel流程的朋友可以去看看我的这一篇文章：[2. Sentinel源码解析，Sentinel是如何进行流量统计的？][2. Sentinel_Sentinel]，这篇文章介绍了Sentinel的全流程分析，本文的其他流程基本都在这篇文章上讲了，只有FlowSlot部分代码不同。

接下来我们来讲一下FlowSlot里面是怎么实现QPS限流的

**FlowSlot#entry**

```java
public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count,
                  boolean prioritized, Object... args) throws Throwable {
    checkFlow(resourceWrapper, context, node, count, prioritized);
    fireEntry(context, resourceWrapper, node, count, prioritized, args);
}
void checkFlow(ResourceWrapper resource, Context context, DefaultNode node, int count, boolean prioritized)
    throws BlockException {
    checker.checkFlow(ruleProvider, resource, context, node, count, prioritized);
}
```

FlowSlot在实例化的时候会实例化一个FlowRuleChecker实例作为checker。在checkFlow方法里面会继续调用FlowRuleChecker的checkFlow方法，其中ruleProvider实例是用来根据根据resource来从flowRules中获取相应的FlowRule。

我们进入到FlowRuleChecker的checkFlow方法中

**FlowRuleChecker#checkFlow**

```java
public void checkFlow(Function<String, Collection<FlowRule>> ruleProvider, ResourceWrapper resource,
                      Context context, DefaultNode node, int count, boolean prioritized) throws BlockException {
    if (ruleProvider == null || resource == null) {
        return;
    }
    //返回FlowRuleManager里面注册的所有规则
    Collection<FlowRule> rules = ruleProvider.apply(resource.getName());
    if (rules != null) {
        for (FlowRule rule : rules) {
            //如果当前的请求不能通过，那么就抛出FlowException异常
            if (!canPassCheck(rule, context, node, count, prioritized)) {
                throw new FlowException(rule.getLimitApp(), rule);
            }
        }
    }
}
```

这里是调用ruleProvider来获取所有FlowRule，然后遍历rule集合通过canPassCheck方法来进行过滤，如果不符合条件则会抛出FlowException异常。

我们跟进去直接来到passLocalCheck方法：

```java
private static boolean passLocalCheck(FlowRule rule, Context context, DefaultNode node, int acquireCount,
                                      boolean prioritized) {
    //节点选择
    Node selectedNode = selectNodeByRequesterAndStrategy(rule, context, node);
    if (selectedNode == null) {
        return true;
    }
    //根据设置的规则来拦截
    return rule.getRater().canPass(selectedNode, acquireCount, prioritized);
}
```

这个方法里面会选择好相应的节点后调用rater的canPass方法来判断是否需要阻塞。

Rater有四个，分别是：DefaultController、RateLimiterController、WarmUpController、WarmUpRateLimiterController，我们挨个分析一下。

其中DefaultController是直接拒绝策略，我们在上一篇文章中已经分析过了，这次我们来看看其他三个。

### RateLimiterController匀速排队

它的中心思想是，以固定的间隔时间让请求通过。当请求到来的时候，如果当前请求距离上个通过的请求通过的时间间隔不小于预设值，则让当前请求通过；否则，计算当前请求的预期通过时间，如果该请求的预期通过时间小于规则预设的 timeout 时间，则该请求会等待直到预设时间到来通过（排队等待处理）；若预期的通过时间超出最大排队时长，则直接拒接这个请求。

这种方式适合用于请求以突刺状来到，这个时候我们不希望一下子把所有的请求都通过，这样可能会把系统压垮；同时我们也期待系统以稳定的速度，逐步处理这些请求，以起到“削峰填谷”的效果，而不是拒绝所有请求。

要想使用这个策略需要在实例化FlowRule的时候设置`rule1.setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_RATE_LIMITER)`这样的一句代码。

在实例化Rater的时候会调用FlowRuleUtil#generateRateri创建一个实例：

```java
new RateLimiterController(rule.getMaxQueueingTimeMs(), rule.getCount());
```

MaxQueueingTimeMs默认是500 ，Count在我们这个例子中传入的是20。

我们看一下具体的canPass方法是怎么实现限流的：

```java
public boolean canPass(Node node, int acquireCount, boolean prioritized) {
    // Pass when acquire count is less or equal than 0.
    if (acquireCount <= 0) {
        return true;
    }
    // Reject when count is less or equal than 0.
    // Otherwise,the costTime will be max of long and waitTime will overflow in some cases.
    if (count <= 0) {
        return false;
    }
    long currentTime = TimeUtil.currentTimeMillis();
    //两个请求预期通过的时间,也就是说把请求平均分配到1秒上
    // Calculate the interval between every two requests.
    long costTime = Math.round(1.0 * (acquireCount) / count * 1000);
    //latestPassedTime代表的是上一次调用请求的时间
    // Expected pass time of this request.
    long expectedTime = costTime + latestPassedTime.get();
    //如果预期通过的时间加上上次的请求时间小于当前时间，则通过
    if (expectedTime <= currentTime) {
        // Contention may exist here, but it's okay.
        latestPassedTime.set(currentTime);
        return true;
    } else {
        //默认是maxQueueingTimeMs
        // Calculate the time to wait.
        long waitTime = costTime + latestPassedTime.get() - TimeUtil.currentTimeMillis();
        //如果预提时间比当前时间大maxQueueingTimeMs那么多，那么就阻塞
        if (waitTime > maxQueueingTimeMs) {
            return false;
        } else {
            //将上次时间加上这次请求要耗费的时间
            long oldTime = latestPassedTime.addAndGet(costTime);
            try {
                waitTime = oldTime - TimeUtil.currentTimeMillis();
                //再次判断一下是否超过maxQueueingTimeMs设置的时间
                if (waitTime > maxQueueingTimeMs) {
                    //如果是的话就阻塞，并重置上次通过时间
                    latestPassedTime.addAndGet(-costTime);
                    return false;
                }
                //如果需要等待的时间大于零，那么就sleep
                // in race condition waitTime may <= 0
                if (waitTime > 0) {
                    Thread.sleep(waitTime);
                }
                return true;
            } catch (InterruptedException e) {
            }
        }
    }
    return false;
}
```

这个方法一开始会计算一下costTime这个值，将请求平均分配到一秒中。例如：当 count 设为 10 的时候，则代表一秒匀速的通过 10 个请求，也就是每个请求平均间隔恒定为 1000 / 10 = 100 ms。

但是这里有个小bug，如果count设置的比较大，比如设置成10000，那么costTime永远都会等于0，整个QPS限流将会失效。

然后会将costTime和上次的请求时间相加，如果大于当前时间就表明请求的太频繁了，会将latestPassedTime这个属性加上这次请求的costTime，并调用sleep方法让这个线程先睡眠一会再请求。

这里有个细节，如果多个请求同时一起过来，那么每个请求在设置oldTime的时候都会通过addAndGet这个原子性的方法将latestPassedTime依次相加，并赋值给oldTime，这样每个线程的sleep的时间都不会相同，线程也不会同时醒来。

### WarmUpController限流 冷启动

当系统长期处于低水位的情况下，当流量突然增加时，直接把系统拉升到高水位可能瞬间把系统压垮。通过"冷启动"，让通过的流量缓慢增加，在一定时间内逐渐增加到阈值上限，给冷系统一个预热的时间，避免冷系统被压垮。

```java
//默认为3
private int coldFactor;
//转折点的令牌数
protected int warningToken = 0;
//最大的令牌数
private int maxToken;
//斜线斜率
protected double slope;
//累积的令牌数
protected AtomicLong storedTokens = new AtomicLong(0);
//最后更新令牌的时间
protected AtomicLong lastFilledTime = new AtomicLong(0);
public WarmUpController(double count, int warmUpPeriodInSec, int coldFactor) {
    construct(count, warmUpPeriodInSec, coldFactor);
}
private void construct(double count, int warmUpPeriodInSec, int coldFactor) {
    if (coldFactor <= 1) {
        throw new IllegalArgumentException("Cold factor should be larger than 1");
    }
    this.count = count;
    //默认是3
    this.coldFactor = coldFactor;
    // thresholdPermits = 0.5 * warmupPeriod / stableInterval.
    // 10*20/2 = 100
    // warningToken = 100;
    warningToken = (int) (warmUpPeriodInSec * count) / (coldFactor - 1);
    // / maxPermits = thresholdPermits + 2 * warmupPeriod /
    // (stableInterval + coldInterval)
    // maxToken = 200
    maxToken = warningToken + (int) (2 * warmUpPeriodInSec * count / (1.0 + coldFactor));
    // slope
    // slope = (coldIntervalMicros - stableIntervalMicros) / (maxPermits
    // - thresholdPermits);
    slope = (coldFactor - 1.0) / count / (maxToken - warningToken);
}
```

这里我拿一张图来说明一下：

X轴代表 storedPermits 的数量，Y 轴代表获取一个 permits 需要的时间。

假设指定 permitsPerSecond 为 10，那么 stableInterval 为 100ms，而 coldInterval 是 3 倍，也就是 300ms（coldFactor，3 倍 ）。也就是说，当达到 maxPermits 时，此时处于系统最冷的时候，获取一个 permit 需要 300ms，而如果 storedPermits 小于 thresholdPermits 的时候，只需要 100ms。

利用“获取冷的 permits ” 需要等待更多时间，来限制突发请求通过，达到系统预热的目的。

所以在我们的代码中，maxToken代表的就是图中的maxPermits，warningToken代表的就是thresholdPermits，slope就是代表每次获取permit减少的程度。

我们接下来看看WarmUpController的canpass方法：

**WarmUpController#canpass**

```java
public boolean canPass(Node node, int acquireCount, boolean prioritized) {
    //获取当前时间窗口的流量大小
    long passQps = (long) node.passQps();
    //获取上一个窗口的流量大小
    long previousQps = (long) node.previousPassQps();
    //设置 storedTokens 和 lastFilledTime 到正确的值
    syncToken(previousQps);
    // 开始计算它的斜率
    // 如果进入了警戒线，开始调整他的qps
    long restToken = storedTokens.get();
    if (restToken >= warningToken) {
        //通过计算当前的restToken和警戒线的距离来计算当前的QPS
        //离警戒线越接近，代表这个程序越“热”，从而逐步释放QPS
        long aboveToken = restToken - warningToken;
        //当前状态下能达到的最高 QPS
        // current interval = restToken*slope+1/count
        double warningQps = Math.nextUp(1.0 / (aboveToken * slope + 1.0 / count));
        // 如果不会超过，那么通过，否则不通过
        if (passQps + acquireCount <= warningQps) {
            return true;
        }
    } else {
        // count 是最高能达到的 QPS
        if (passQps + acquireCount <= count) {
            return true;
        }
    }
    return false;
}
```

这个方法里通过syncToken(previousQps)设置storedTokens的值后，与警戒值做判断，如果没有达到警戒值，那么通过计算和警戒值的距离再加上slope计算出一个当前的QPS值，storedTokens越大当前的QPS越小。

如果当前的storedTokens已经小于警戒值了，说明已经预热完毕了，直接用count判断就好了。

**WarmUpController#syncToken**

```java
protected void syncToken(long passQps) {
    long currentTime = TimeUtil.currentTimeMillis();
    //去掉毫秒的时间
    currentTime = currentTime - currentTime % 1000;
    long oldLastFillTime = lastFilledTime.get();
    if (currentTime <= oldLastFillTime) {
        return;
    }
    // 令牌数量的旧值
    long oldValue = storedTokens.get();
    // 计算新的令牌数量，往下看
    long newValue = coolDownTokens(currentTime, passQps);
    if (storedTokens.compareAndSet(oldValue, newValue)) {
        // 令牌数量上，减去上一分钟的 QPS，然后设置新值
        long currentValue = storedTokens.addAndGet(0 - passQps);
        if (currentValue < 0) {
            storedTokens.set(0L);
        }
        lastFilledTime.set(currentTime);
    } 
}
```

这个方法通过coolDownTokens方法来获取一个新的value，然后通过CAS设置到storedTokens中，然后将storedTokens减去上一个窗口的QPS值，并为lastFilledTime设置一个新的值。

其实我这里有个疑惑，在用storedTokens减去上一个窗口的QPS的时候并没有做控制，假如处理的速度非常的快，在一个窗口内就减了很多次，直接把当前的storedTokens减到了小于warningToken，那么是不是就没有在一定的时间范围内启动冷启动的效果？

```java
private long coolDownTokens(long currentTime, long passQps) {
    long oldValue = storedTokens.get();
    long newValue = oldValue;
    // 添加令牌的判断前提条件:
    // 当令牌的消耗程度远远低于警戒线的时候
    if (oldValue < warningToken) {
        // 根据count数每秒加上令牌
        newValue = (long) (oldValue + (currentTime - lastFilledTime.get()) * count / 1000);
    } else if (oldValue > warningToken) {
        //如果还在冷启动阶段
        // 如果当前通过的 QPS 大于 count/coldFactor，说明系统消耗令牌的速度，大于冷却速度
        //    那么不需要添加令牌，否则需要添加令牌
        if (passQps < (int) count / coldFactor) {
            newValue = (long) (oldValue + (currentTime - lastFilledTime.get()) * count / 1000);
        }
    }
    return Math.min(newValue, maxToken);
}
```

这个方法主要是用来做添加令牌的操作，如果是流量比较小或者是已经预热完毕了，那么就需要根据count数每秒加上令牌，如果是在预热阶段那么就不进行令牌添加。

WarmUpRateLimiterController就是结合了冷启动和匀速排队，代码非常的简单，有了上面的分析，相信大家也能看得懂，所以也就不讲解了。
