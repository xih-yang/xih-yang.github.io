# 18、SpringCloud Alibaba - Sentinel热点参数流控ParamFlowSlot
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/18.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

热点参数流控会统计传入参数中的热点参数，对包含热点参数的资源调用进行流量控制，使用漏桶和令牌桶的算法进行流控。

## 一、热点参数流程

**1、** ProcessorSlot链上的执行方法entry()；

```java
public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count,
                      boolean prioritized, Object... args) throws Throwable {
        //检查是否存在热点参数流控规则
        if (!ParamFlowRuleManager.hasRules(resourceWrapper.getName())) {
            fireEntry(context, resourceWrapper, node, count, prioritized, args);
            return;
        }
		//校验规则
        checkFlow(resourceWrapper, count, args);
        fireEntry(context, resourceWrapper, node, count, prioritized, args);
    }
```

**2、** checkFlow()；

```java
	void checkFlow(ResourceWrapper resourceWrapper, int count, Object... args) throws BlockException {
        if (args == null) {
            return;
        }
        if (!ParamFlowRuleManager.hasRules(resourceWrapper.getName())) {
            return;
        }
        //获取流控规则
        List<ParamFlowRule> rules = ParamFlowRuleManager.getRulesOfResource(resourceWrapper.getName());
        for (ParamFlowRule rule : rules) {
        	//计算流控参数的索引
            applyRealParamIdx(rule, args.length);
            // Initialize the parameter metrics.
            //初始化参数统计
            ParameterMetricStorage.initParamMetricsFor(resourceWrapper, rule);
			//校验规则
            if (!ParamFlowChecker.passCheck(resourceWrapper, rule, count, args)) {
                String triggeredParam = "";
                //获取热点参数
                if (args.length > rule.getParamIdx()) {
                    Object value = args[rule.getParamIdx()];
                    triggeredParam = String.valueOf(value);
                }
                throw new ParamFlowException(resourceWrapper.getName(), triggeredParam, rule);
            }
        }
    }
```

**3、** applyRealParamIdx()；

处理参数索引为负的情况

```java
	 void applyRealParamIdx(/*@NonNull*/ ParamFlowRule rule, int length) {
        int paramIdx = rule.getParamIdx();
        if (paramIdx < 0) {
            if (-paramIdx <= length) {
                rule.setParamIdx(length + paramIdx);
            } else {
                // Illegal index, give it a illegal positive value, latter rule checking will pass.
                rule.setParamIdx(-paramIdx);
            }
        }
    }
```

**4、** initParamMetricsFor()；

初始化了三个用于参数统计的属性：

ruleTimeCounters，用于记录令牌桶最后添加时间

ruleTokenCounter，用于记录令牌数量

threadCountMap，用于记录线程数量

```java
	public static void initParamMetricsFor(ResourceWrapper resourceWrapper, /*@Valid*/ ParamFlowRule rule) {
        if (resourceWrapper == null || resourceWrapper.getName() == null) {
            return;
        }
        String resourceName = resourceWrapper.getName();
        ParameterMetric metric;
        // Assume that the resource is valid.
        if ((metric = metricsMap.get(resourceName)) == null) {
            synchronized (LOCK) {
                if ((metric = metricsMap.get(resourceName)) == null) {
                    metric = new ParameterMetric();
                    metricsMap.put(resourceWrapper.getName(), metric);
                    RecordLog.info("[ParameterMetricStorage] Creating parameter metric for: " + resourceWrapper.getName());
                }
            }
        }
        metric.initialize(rule);
    }
```

```java
	public void initialize(ParamFlowRule rule) {
        if (!ruleTimeCounters.containsKey(rule)) {
            synchronized (lock) {
                if (ruleTimeCounters.get(rule) == null) {
                    long size = Math.min(BASE_PARAM_MAX_CAPACITY * rule.getDurationInSec(), TOTAL_MAX_CAPACITY);
                    ruleTimeCounters.put(rule, new ConcurrentLinkedHashMapWrapper<Object, AtomicLong>(size));
                }
            }
        }
        if (!ruleTokenCounter.containsKey(rule)) {
            synchronized (lock) {
                if (ruleTokenCounter.get(rule) == null) {
                    long size = Math.min(BASE_PARAM_MAX_CAPACITY * rule.getDurationInSec(), TOTAL_MAX_CAPACITY);
                    ruleTokenCounter.put(rule, new ConcurrentLinkedHashMapWrapper<Object, AtomicLong>(size));
                }
            }
        }
        if (!threadCountMap.containsKey(rule.getParamIdx())) {
            synchronized (lock) {
                if (threadCountMap.get(rule.getParamIdx()) == null) {
                    threadCountMap.put(rule.getParamIdx(),
                        new ConcurrentLinkedHashMapWrapper<Object, AtomicInteger>(THREAD_COUNT_MAX_CAPACITY));
                }
            }
        }
    }
```

**5、** ParamFlowChecker；

1、passCheck( )

```java
	public static boolean passCheck(ResourceWrapper resourceWrapper, /*@Valid*/ ParamFlowRule rule, /*@Valid*/ int count,
                             Object... args) {
        if (args == null) {
            return true;
        }
		//校验参数索引，没有该索引的参数，返回true
        int paramIdx = rule.getParamIdx();
        if (args.length <= paramIdx) {
            return true;
        }
        // Get parameter value.
        //获取参数
        Object value = args[paramIdx];
        // Assign value with the result of paramFlowKey method
        if (value instanceof ParamFlowArgument) {
            value = ((ParamFlowArgument) value).paramFlowKey();
        }
        // If value is null, then pass
        if (value == null) {
            return true;
        }
        if (rule.isClusterMode() && rule.getGrade() == RuleConstant.FLOW_GRADE_QPS) {
        	//集群规则检测
            return passClusterCheck(resourceWrapper, rule, count, value);
        }
		//本地检测
        return passLocalCheck(resourceWrapper, rule, count, value);
    }
```

2、passLocalCheck( )

参数是Collection 或 Array 时，里面的每一个参数都作为热点参数进行校验

```java
private static boolean passLocalCheck(ResourceWrapper resourceWrapper, ParamFlowRule rule, int count,
                                          Object value) {
        try {
        	//参数是Collection类型
            if (Collection.class.isAssignableFrom(value.getClass())) {
                for (Object param : ((Collection)value)) {
                	//校验集合中的每一个参数
                    if (!passSingleValueCheck(resourceWrapper, rule, count, param)) {
                        return false;
                    }
                }
            } else if (value.getClass().isArray()) {
            	//参数是Array类型
                int length = Array.getLength(value);
                for (int i = 0; i < length; i++) {
                    Object param = Array.get(value, i);
                    //校验数组中的每一个参数
                    if (!passSingleValueCheck(resourceWrapper, rule, count, param)) {
                        return false;
                    }
                }
            } else {
                return passSingleValueCheck(resourceWrapper, rule, count, value);
            }
        } catch (Throwable e) {
            RecordLog.warn("[ParamFlowChecker] Unexpected error", e);
        }
        return true;
    }
```

3、passSingleValueCheck( )

```java
	static boolean passSingleValueCheck(ResourceWrapper resourceWrapper, ParamFlowRule rule, int acquireCount,
                                        Object value) {
        //qps限流
        if (rule.getGrade() == RuleConstant.FLOW_GRADE_QPS) {
        	//
            if (rule.getControlBehavior() == RuleConstant.CONTROL_BEHAVIOR_RATE_LIMITER) {
            	//速率限制，漏桶
                return passThrottleLocalCheck(resourceWrapper, rule, acquireCount, value);
            } else {
            	//默认限制，令牌桶
                return passDefaultLocalCheck(resourceWrapper, rule, acquireCount, value);
            }
        } else if (rule.getGrade() == RuleConstant.FLOW_GRADE_THREAD) {
        	//线程限流
            Set<Object> exclusionItems = rule.getParsedHotItems().keySet();
            long threadCount = getParameterMetric(resourceWrapper).getThreadCount(rule.getParamIdx(), value);
            if (exclusionItems.contains(value)) {
                int itemThreshold = rule.getParsedHotItems().get(value);
                //比较线程数和规则里参数阈值
                return ++threadCount <= itemThreshold;
            }
            long threshold = (long)rule.getCount();
            //比较线程数与规则阈值
            return ++threadCount <= threshold;
        }
        return true;
    }
```

## 二、漏桶算法

上次获取令牌时间 + 当前请求令牌数生成需要花费的时间，

小于当前时间时，成功获取到令牌；

大于当前时间时，会有一个允许的等待时间，不超过等待时间，则成功获取到令牌，否则就表示没有足够的令牌。

```java
	 static boolean passThrottleLocalCheck(ResourceWrapper resourceWrapper, ParamFlowRule rule, int acquireCount,
                                          Object value) {
        ParameterMetric metric = getParameterMetric(resourceWrapper);
        //最新生成的令牌时间计数器
        CacheMap<Object, AtomicLong> timeRecorderMap = metric == null ? null : metric.getRuleTimeCounter(rule);
        if (timeRecorderMap == null) {
            return true;
        }
        // Calculate max token count (threshold)
        Set<Object> exclusionItems = rule.getParsedHotItems().keySet();
        //获取规则中阈值
        long tokenCount = (long)rule.getCount();
        if (exclusionItems.contains(value)) {
        	//获取规则热点参数中阈值
            tokenCount = rule.getParsedHotItems().get(value);
        }
        if (tokenCount == 0) {
            return false;
        }
		//当前请求的令牌，需要花费多长时间才能生成这么多令牌
        long costTime = Math.round(1.0 * 1000 * acquireCount * rule.getDurationInSec() / tokenCount);
        while (true) {
            long currentTime = TimeUtil.currentTimeMillis();
            //初始化时间记录器
            AtomicLong timeRecorder = timeRecorderMap.putIfAbsent(value, new AtomicLong(currentTime));
            if (timeRecorder == null) {
            	//第一次访问时没有时间记录器，认为获取到令牌，直接返回
                return true;
            }
            //AtomicLong timeRecorder = timeRecorderMap.get(value);
            //上次记录的获取令牌时间
            long lastPassTime = timeRecorder.get();
            //本次期望的获取令牌时间
            long expectedTime = lastPassTime + costTime;
			//期望时间小于当前时间；或者期望时间大于大于当前时间，但是在允许等待的时间范围内
            if (expectedTime <= currentTime || expectedTime - currentTime < rule.getMaxQueueingTimeMs()) {
                AtomicLong lastPastTimeRef = timeRecorderMap.get(value);
                //将缓存获取令牌时间更新为当前时间
                if (lastPastTimeRef.compareAndSet(lastPassTime, currentTime)) {
                    long waitTime = expectedTime - currentTime;
                    if (waitTime > 0) {
                    	//如果有等待时间，则将内存记录的将时间设置为期望时间
                        lastPastTimeRef.set(expectedTime);
                        try {
                        	//休眠一会
                            TimeUnit.MILLISECONDS.sleep(waitTime);
                        } catch (InterruptedException e) {
                            RecordLog.warn("passThrottleLocalCheck: wait interrupted", e);
                        }
                    }
                    return true;
                } else {
                    Thread.yield();
                }
            } else {
                return false;
            }
        }
    }
```

## 三、令牌桶算法

通过计算当前时间和上一次更新令牌时间的时间间隔，

时间间隔超过1s后，计算产生的令牌数 + 缓存中剩下的令牌数，作为总的令牌数供本次请求使用，取出令牌后，更新缓存中的令牌总数，并更新最新的令牌生成截止时间；

时间间隔没有超过1s，直接获取缓存剩余令牌数，更新缓存令牌数，不更新生成令牌时间，即在同1s内使用同一批固定个数的令牌。

```java
   	 static boolean passDefaultLocalCheck(ResourceWrapper resourceWrapper, ParamFlowRule rule, int acquireCount,
                                         Object value) {
        ParameterMetric metric = getParameterMetric(resourceWrapper);
        //令牌计数器
        CacheMap<Object, AtomicLong> tokenCounters = metric == null ? null : metric.getRuleTokenCounter(rule);
        //最新生成的令牌时间计数器
        CacheMap<Object, AtomicLong> timeCounters = metric == null ? null : metric.getRuleTimeCounter(rule);
        if (tokenCounters == null || timeCounters == null) {
            return true;
        }
        // Calculate max token count (threshold)
        Set<Object> exclusionItems = rule.getParsedHotItems().keySet();
        //获取规则中阈值
        long tokenCount = (long)rule.getCount();
        if (exclusionItems.contains(value)) {
        	//获取规则热点参数中阈值
            tokenCount = rule.getParsedHotItems().get(value);
        }
        if (tokenCount == 0) {
            return false;
        }
		// 设置的阈值 tokenCount + 允许的突发流量 BurstCount
        long maxCount = tokenCount + rule.getBurstCount();
        //申请数量是否大于最大流量
        if (acquireCount > maxCount) {
            return false;
        }
        while (true) {
            long currentTime = TimeUtil.currentTimeMillis();
			//热点参数的令牌更新时间
            AtomicLong lastAddTokenTime = timeCounters.putIfAbsent(value, new AtomicLong(currentTime));
            if (lastAddTokenTime == null) {
                // Token never added, just replenish the tokens and consume {@code acquireCount} immediately.
                //首次，初始化令牌数
                tokenCounters.putIfAbsent(value, new AtomicLong(maxCount - acquireCount));
                return true;
            }
            // Calculate the time duration since last token was added.
            //上一次与当前时间的间隔
            long passTime = currentTime - lastAddTokenTime.get();
            // A simplified token bucket algorithm that will replenish the tokens only when statistic window has passed.
            //校验是否超过1s
            if (passTime > rule.getDurationInSec() * 1000) {
            	//超过1s了，令牌最大能获取数为 maxCount 
                AtomicLong oldQps = tokenCounters.putIfAbsent(value, new AtomicLong(maxCount - acquireCount));
                if (oldQps == null) {
                	//缓存里没有旧的令牌，认为获取成功，返回true
                    // Might not be accurate here.
                    lastAddTokenTime.set(currentTime);
                    return true;
                } else {
                	//缓存里有令牌了，可能其他线程设置了令牌，则需要计算本次令牌数是否能获取到
                	//获取剩余令牌数
                    long restQps = oldQps.get();
                    //计算时间间隔内，新产生的令牌数
                    long toAddCount = (passTime * tokenCount) / (rule.getDurationInSec() * 1000);
                    //计算新的剩余令牌数
                    long newQps = toAddCount + restQps > maxCount ? (maxCount - acquireCount)
                        : (restQps + toAddCount - acquireCount);
                    if (newQps < 0) {
                    	//没有足够的令牌，触发限流
                        return false;
                    }
                    //获取令牌成功，更新最新剩余令牌数，并更新令牌时间；获取令牌失败会循环再次尝试获取
                    if (oldQps.compareAndSet(restQps, newQps)) {
                        lastAddTokenTime.set(currentTime);
                        return true;
                    }
                    Thread.yield();
                }
            } else {
            	//没有超过1s，获取剩余令牌数
                AtomicLong oldQps = tokenCounters.get(value);
                if (oldQps != null) {
                    long oldQpsValue = oldQps.get();
                    if (oldQpsValue - acquireCount >= 0) {
                        if (oldQps.compareAndSet(oldQpsValue, oldQpsValue - acquireCount)) {
                        	//获取到令牌，放行；获取不到令牌会循环再次尝试获取
                            return true;
                        }
                    } else {
                    	//没有足够的令牌，触发限流
                        return false;
                    }
                }
                Thread.yield();
            }
        }
    }
```
