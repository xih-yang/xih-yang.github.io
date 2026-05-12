# 15、SpringCloud Alibaba - Sentinel规则处理器ModifyRulesCommandHandler
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/15.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 一、ModifyRulesCommandHandler 规则处理

在sentinel dashboard 上面给对应的接口配置规则后，sentinel 服务端会将规则信息发送给客户端，客户端在获取到 ModifyRulesCommandHandler 调用 handler( )进行处理规则，下面从该方法进行分析。

**1、** handle()；

```java
public CommandResponse<String> handle(CommandRequest request) {
        // XXX from 1.7.2, force to fail when fastjson is older than 1.2.12
        // We may need a better solution on this.
        if (VersionUtil.fromVersionString(JSON.VERSION) < FASTJSON_MINIMAL_VER) {
            // fastjson too old
            return CommandResponse.ofFailure(new RuntimeException("The \"fastjson-" + JSON.VERSION
                    + "\" introduced in application is too old, you need fastjson-1.2.12 at least."));
        }
        //获取规则的类型： flow、authority、degrade、system
        String type = request.getParam("type");
        // rule data in get parameter
        //获取规则数据
        String data = request.getParam("data");
        if (StringUtil.isNotEmpty(data)) {
            try {
                data = URLDecoder.decode(data, "utf-8");
            } catch (Exception e) {
                RecordLog.info("Decode rule data error", e);
                return CommandResponse.ofFailure(e, "decode rule data error");
            }
        }
        RecordLog.info("Receiving rule change (type: {}): {}", type, data);
        String result = "success";
		//根据类型，对规则进行解析，保存到对应的缓存中，如果配置的有数据库，则会将规则进行持久化
        if (FLOW_RULE_TYPE.equalsIgnoreCase(type)) {
        	//流量控制 json 转对象
            List<FlowRule> flowRules = JSONArray.parseArray(data, FlowRule.class);
            //FlowRuleManager 解析流控规则
            FlowRuleManager.loadRules(flowRules);
            //将规则写入数据库
            if (!writeToDataSource(getFlowDataSource(), flowRules)) {
                result = WRITE_DS_FAILURE_MSG;
            }
            return CommandResponse.ofSuccess(result);
        } else if (AUTHORITY_RULE_TYPE.equalsIgnoreCase(type)) {
            List<AuthorityRule> rules = JSONArray.parseArray(data, AuthorityRule.class);
            //AuthorityRuleManager 解析授权规则
            AuthorityRuleManager.loadRules(rules);
            if (!writeToDataSource(getAuthorityDataSource(), rules)) {
                result = WRITE_DS_FAILURE_MSG;
            }
            return CommandResponse.ofSuccess(result);
        } else if (DEGRADE_RULE_TYPE.equalsIgnoreCase(type)) {
            List<DegradeRule> rules = JSONArray.parseArray(data, DegradeRule.class);
            //DegradeRuleManager 解析熔断规则
            DegradeRuleManager.loadRules(rules);
            if (!writeToDataSource(getDegradeDataSource(), rules)) {
                result = WRITE_DS_FAILURE_MSG;
            }
            return CommandResponse.ofSuccess(result);
        } else if (SYSTEM_RULE_TYPE.equalsIgnoreCase(type)) {
            List<SystemRule> rules = JSONArray.parseArray(data, SystemRule.class);
            //SystemRuleManager解析熔断规则
            SystemRuleManager.loadRules(rules);
            if (!writeToDataSource(getSystemSource(), rules)) {
                result = WRITE_DS_FAILURE_MSG;
            }
            return CommandResponse.ofSuccess(result);
        }
        return CommandResponse.ofFailure(new IllegalArgumentException("invalid type"));
    }
```

## 二、flow 流量控制规则

**1、** FlowRuleManager.loadRules(flowRules)；

```java
 public static void loadRules(List<FlowRule> rules) {
        currentProperty.updateValue(rules);
    }
```

```java
DynamicSentinelProperty.java
 public boolean updateValue(T newValue) {
 		//校验规则是否变化了
        if (isEqual(value, newValue)) {
            return false;
        }
        RecordLog.info("[DynamicSentinelProperty] Config will be updated to: " + newValue);
        value = newValue;
        for (PropertyListener<T> listener : listeners) {
        	//FlowRuleManager.FlowPropertyListener
            listener.configUpdate(newValue);
        }
        return true;
    }
```

**2、** listener.configUpdate(newValue)；

在FlowRuleManager 的 static 初始化块中注册了 FlowPropertyListener

```java
FlowRuleManager.FlowPropertyListener.java
	 public void configUpdate(List<FlowRule> value) {
	 		//构建流控规则
            Map<String, List<FlowRule>> rules = FlowRuleUtil.buildFlowRuleMap(value);
            if (rules != null) {
                flowRules.clear();
                //放入缓存
                flowRules.putAll(rules);
            }
            RecordLog.info("[FlowRuleManager] Flow rules received: " + flowRules);
        }
```

**3、** FlowRuleUtil.buildFlowRuleMap(value)；

```java
public static <K> Map<K, List<FlowRule>> buildFlowRuleMap(List<FlowRule> list, Function<FlowRule, K> groupFunction,
                                                              Predicate<FlowRule> filter, boolean shouldSort) {
        Map<K, List<FlowRule>> newRuleMap = new ConcurrentHashMap<>();
        if (list == null || list.isEmpty()) {
            return newRuleMap;
        }
        Map<K, Set<FlowRule>> tmpMap = new ConcurrentHashMap<>();
        for (FlowRule rule : list) {
        	//校验规则
            if (!isValidRule(rule)) {
                RecordLog.warn("[FlowRuleManager] Ignoring invalid flow rule when loading new flow rules: " + rule);
                continue;
            }
            if (filter != null && !filter.test(rule)) {
                continue;
            }
            if (StringUtil.isBlank(rule.getLimitApp())) {
                rule.setLimitApp(RuleConstant.LIMIT_APP_DEFAULT);
            }
			//创建 TrafficShapingController 
            TrafficShapingController rater = generateRater(rule);
            rule.setRater(rater);
			//获取资源名称
            K key = groupFunction.apply(rule);
            if (key == null) {
                continue;
            }
            Set<FlowRule> flowRules = tmpMap.get(key);
            if (flowRules == null) {
                // Use hash set here to remove duplicate rules.
                flowRules = new HashSet<>();
                tmpMap.put(key, flowRules);
            }
            flowRules.add(rule);
        }
        Comparator<FlowRule> comparator = new FlowRuleComparator();
        for (Entry<K, Set<FlowRule>> entries : tmpMap.entrySet()) {
            List<FlowRule> rules = new ArrayList<>(entries.getValue());
            if (shouldSort) {
                // Sort the rules.
                //使用 FlowRuleComparator 对规则排序
                Collections.sort(rules, comparator);
            }
            newRuleMap.put(entries.getKey(), rules);
        }
        return newRuleMap;
    }
```

**4、** generateRater(rule)；

rule里面的 grade 表示限流类型:

```java
FLOW_GRADE_QPS： QPS限流
FLOW_GRADE_THREAD： 访问资源线程数限流
DEGRADE_GRADE_RT：响应时间限流
```

TrafficShapingController 表示流量控制器，目前有四个实现类：

```java
DefaultController，默认控制器
WarmUpController，预热桶限流
RateLimiterController，匀速排队限流
WarmUpRateLimiterController，匀速排队和预热相结合
```

```java
	private static TrafficShapingController generateRater(/*@Valid*/ FlowRule rule) {
		//创建出对应的流量控制器
        if (rule.getGrade() == RuleConstant.FLOW_GRADE_QPS) {
            switch (rule.getControlBehavior()) {
                case RuleConstant.CONTROL_BEHAVIOR_WARM_UP:
                    return new WarmUpController(rule.getCount(), rule.getWarmUpPeriodSec(),
                        ColdFactorProperty.coldFactor);
                case RuleConstant.CONTROL_BEHAVIOR_RATE_LIMITER:
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

## 三、authority 授权规则

**1、** AuthorityRuleManager.loadRules(rules)；

```java
 public static void loadRules(List<AuthorityRule> rules) {
        currentProperty.updateValue(rules);
    }
```

```java
DynamicSentinelProperty.java
 public boolean updateValue(T newValue) {
        if (isEqual(value, newValue)) {
            return false;
        }
        RecordLog.info("[DynamicSentinelProperty] Config will be updated to: " + newValue);
        value = newValue;
        for (PropertyListener<T> listener : listeners) {
        	//AuthorityRuleManager.RulePropertyListener
            listener.configUpdate(newValue);
        }
        return true;
    }
```

**2、** RulePropertyListener.configUpdate()；

```java
	public void configUpdate(List<AuthorityRule> conf) {
            Map<String, Set<AuthorityRule>> rules = loadAuthorityConf(conf);
            authorityRules.clear();
            if (rules != null) {
            	//将规则放入缓存
                authorityRules.putAll(rules);
            }
            RecordLog.info("[AuthorityRuleManager] Authority rules received: " + authorityRules);
        }
        private Map<String, Set<AuthorityRule>> loadAuthorityConf(List<AuthorityRule> list) {
            Map<String, Set<AuthorityRule>> newRuleMap = new ConcurrentHashMap<>();
            if (list == null || list.isEmpty()) {
                return newRuleMap;
            }
            for (AuthorityRule rule : list) {
                if (!isValidRule(rule)) {
                    RecordLog.warn("[AuthorityRuleManager] Ignoring invalid authority rule when loading new rules: " + rule);
                    continue;
                }
                if (StringUtil.isBlank(rule.getLimitApp())) {
                    rule.setLimitApp(RuleConstant.LIMIT_APP_DEFAULT);
                }
                String identity = rule.getResource();
                Set<AuthorityRule> ruleSet = newRuleMap.get(identity);
                // putIfAbsent
                if (ruleSet == null) {
                    ruleSet = new HashSet<>();
                    ruleSet.add(rule);
                    newRuleMap.put(identity, ruleSet);
                } else {
                    // One resource should only have at most one authority rule, so just ignore redundant rules.
                    RecordLog.warn("[AuthorityRuleManager] Ignoring redundant rule: " + rule.toString());
                }
            }
            return newRuleMap;
        }
```

## 四、degrade 熔断规则

**1、** DegradeRuleManager.loadRules(rules)；

```java
	 public static void loadRules(List<DegradeRule> rules) {
        try {
            currentProperty.updateValue(rules);
        } catch (Throwable e) {
            RecordLog.error("[DegradeRuleManager] Unexpected error when loading degrade rules", e);
        }
    }
```

跟上面使用同样的方式，使用DynamicSentinelProperty，使用DegradeRuleManager.RulePropertyListener来监听配置的变化

**2、** configUpdate()；

```java
		@Override
        public void configUpdate(List<DegradeRule> conf) {
        	//解析熔断规则
            reloadFrom(conf);
            RecordLog.info("[DegradeRuleManager] Degrade rules has been updated to: " + ruleMap);
        }
```

**3、** reloadFrom()；

```java
private synchronized void reloadFrom(List<DegradeRule> list) {
			//构建熔断规则
            Map<String, List<CircuitBreaker>> cbs = buildCircuitBreakers(list);
            Map<String, Set<DegradeRule>> rm = new HashMap<>(cbs.size());
			//使用 HashSet 对规则去重
            for (Map.Entry<String, List<CircuitBreaker>> e : cbs.entrySet()) {
                assert e.getValue() != null && !e.getValue().isEmpty();
                Set<DegradeRule> rules = new HashSet<>(e.getValue().size());
                for (CircuitBreaker cb : e.getValue()) {
                    rules.add(cb.getRule());
                }
                rm.put(e.getKey(), rules);
            }
			//缓存
            DegradeRuleManager.circuitBreakers = cbs;
            DegradeRuleManager.ruleMap = rm;
        }
```

**4、** buildCircuitBreakers()；

```java
	private Map<String, List<CircuitBreaker>> buildCircuitBreakers(List<DegradeRule> list) {
            Map<String, List<CircuitBreaker>> cbMap = new HashMap<>(8);
            if (list == null || list.isEmpty()) {
                return cbMap;
            }
            for (DegradeRule rule : list) {
            	//校验
                if (!isValidRule(rule)) {
                    RecordLog.warn("[DegradeRuleManager] Ignoring invalid rule when loading new rules: " + rule);
                    continue;
                }
                if (StringUtil.isBlank(rule.getLimitApp())) {
                    rule.setLimitApp(RuleConstant.LIMIT_APP_DEFAULT);
                }
                //获取已经存在的熔断规则，或者创建一个新的
                CircuitBreaker cb = getExistingSameCbOrNew(rule);
                if (cb == null) {
                    RecordLog.warn("[DegradeRuleManager] Unknown circuit breaking strategy, ignoring: " + rule);
                    continue;
                }
                String resourceName = rule.getResource();
                List<CircuitBreaker> cbList = cbMap.get(resourceName);
                if (cbList == null) {
                    cbList = new ArrayList<>();
                    cbMap.put(resourceName, cbList);
                }
                cbList.add(cb);
            }
            return cbMap;
        }
    }
```

**5、** getExistingSameCbOrNew()；

```java
 	private static CircuitBreaker getExistingSameCbOrNew(/*@Valid*/ DegradeRule rule) {
 		//获取缓存中该资源的熔断规则
        List<CircuitBreaker> cbs = getCircuitBreakers(rule.getResource());
        if (cbs == null || cbs.isEmpty()) {
        	//不存在时创建新的
            return newCircuitBreakerFrom(rule);
        }
        for (CircuitBreaker cb : cbs) {
            if (rule.equals(cb.getRule())) {
                // Reuse the circuit breaker if the rule remains unchanged.
                //返回相同的规则
                return cb;
            }
        }
        //不存在相同的时创建新的
        return newCircuitBreakerFrom(rule);
    }
```

**6、** newCircuitBreakerFrom()；

根据不同的熔断级别来创建熔断规则

```java
	 private static CircuitBreaker newCircuitBreakerFrom(/*@Valid*/ DegradeRule rule) {
        switch (rule.getGrade()) {
        	//慢比例
            case RuleConstant.DEGRADE_GRADE_RT:
                return new ResponseTimeCircuitBreaker(rule);
            //异常比例
            case RuleConstant.DEGRADE_GRADE_EXCEPTION_RATIO:
            //异常数
            case RuleConstant.DEGRADE_GRADE_EXCEPTION_COUNT:
                return new ExceptionCircuitBreaker(rule);
            default:
                return null;
        }
    }
```

## 五、system 系统规则

**1、** SystemRuleManager.loadRules(rules)；

```java
	public static void loadRules(List<SystemRule> rules) {
        currentProperty.updateValue(rules);
    }
```

跟上面使用同样的方式，使用DynamicSentinelProperty，使用SystemPropertyListener来监听配置的变化

**2、** SystemPropertyListener.configUpdate()；

```java
	 public synchronized void configUpdate(List<SystemRule> rules) {
 			//重置参数
            restoreSetting();
            // systemRules = rules;
            if (rules != null && rules.size() >= 1) {
                for (SystemRule rule : rules) {
                	//加载新的配置
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

**3、** restoreSetting()；

重置为默认值

```java
	protected void restoreSetting() {
            checkSystemStatus.set(false);
            // should restore changes
            highestSystemLoad = Double.MAX_VALUE;
            highestCpuUsage = Double.MAX_VALUE;
            maxRt = Long.MAX_VALUE;
            maxThread = Long.MAX_VALUE;
            qps = Double.MAX_VALUE;
            highestSystemLoadIsSet = false;
            highestCpuUsageIsSet = false;
            maxRtIsSet = false;
            maxThreadIsSet = false;
            qpsIsSet = false;
        }
    }
```

**4、** loadSystemConf()；

加载新的系统规则参数

```java
 public static void loadSystemConf(SystemRule rule) {
        boolean checkStatus = false;
        // Check if it's valid.
		//系统负载
        if (rule.getHighestSystemLoad() >= 0) {
            highestSystemLoad = Math.min(highestSystemLoad, rule.getHighestSystemLoad());
            highestSystemLoadIsSet = true;
            checkStatus = true;
        }
		//cpu使用率
        if (rule.getHighestCpuUsage() >= 0) {
            if (rule.getHighestCpuUsage() > 1) {
                RecordLog.warn(String.format("[SystemRuleManager] Ignoring invalid SystemRule: "
                    + "highestCpuUsage %.3f > 1", rule.getHighestCpuUsage()));
            } else {
                highestCpuUsage = Math.min(highestCpuUsage, rule.getHighestCpuUsage());
                highestCpuUsageIsSet = true;
                checkStatus = true;
            }
        }
		//平均响应时间
        if (rule.getAvgRt() >= 0) {
            maxRt = Math.min(maxRt, rule.getAvgRt());
            maxRtIsSet = true;
            checkStatus = true;
        }
        //最大线程数
        if (rule.getMaxThread() >= 0) {
            maxThread = Math.min(maxThread, rule.getMaxThread());
            maxThreadIsSet = true;
            checkStatus = true;
        }
		//qps
        if (rule.getQps() >= 0) {
            qps = Math.min(qps, rule.getQps());
            qpsIsSet = true;
            checkStatus = true;
        }
        checkSystemStatus.set(checkStatus);
    }
```
