# 19、SpringCloud Alibaba - Sentinel流量控制FlowSlot
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/19.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

FlowSlot 通过流控模式、流控效果等实现对请求的限流。

## 一、FlowRule

流控规则FlowRule里的一些属性

```java
private int grade = RuleConstant.FLOW_GRADE_QPS;
    //阈值
    private double count;
    //流控模式：直接、关联、链路
    private int strategy = RuleConstant.STRATEGY_DIRECT;
    //关联资源或入口资源
    private String refResource;
    //流控效果：快速失败、预热、排队等待
    private int controlBehavior = RuleConstant.CONTROL_BEHAVIOR_DEFAULT;
	//预热时间
    private int warmUpPeriodSec = 10;
    //排队等待的超时时间
    private int maxQueueingTimeMs = 500;
	//是否是集群限流模式
    private boolean clusterMode;
    //集群限流配置
    private ClusterFlowConfig clusterConfig;
    //限流控制器
    private TrafficShapingController controller;
```

界面的配置：

## 二、检验流程

**1、** com.alibaba.csp.sentinel.slots.block.flow.FlowSlot的entry()方法；

```java
public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count,
                      boolean prioritized, Object... args) throws Throwable {
        //流控校验
        checkFlow(resourceWrapper, context, node, count, prioritized);
        fireEntry(context, resourceWrapper, node, count, prioritized, args);
    }
    void checkFlow(ResourceWrapper resource, Context context, DefaultNode node, int count, boolean prioritized)
        throws BlockException {
        //FlowRuleChecker.checkFlow()
        checker.checkFlow(ruleProvider, resource, context, node, count, prioritized);
    }
```

**2、** FlowRuleChecker.checkFlow()；

```java
public void checkFlow(Function<String, Collection<FlowRule>> ruleProvider, ResourceWrapper resource,
                          Context context, DefaultNode node, int count, boolean prioritized) throws BlockException {
        if (ruleProvider == null || resource == null) {
            return;
        }
        //从 FlowRuleManager 获取对应资源的流控规则
        Collection<FlowRule> rules = ruleProvider.apply(resource.getName());
        if (rules != null) {
            for (FlowRule rule : rules) {
            	//校验规则，不通过时抛出异常
                if (!canPassCheck(rule, context, node, count, prioritized)) {
                    throw new FlowException(rule.getLimitApp(), rule);
                }
            }
        }
    }
 public boolean canPassCheck(/*@NonNull*/ FlowRule rule, Context context, DefaultNode node, int acquireCount,
                                                    boolean prioritized) {
        String limitApp = rule.getLimitApp();
        if (limitApp == null) {
            return true;
        }
        if (rule.isClusterMode()) {
        	//集群模式
            return passClusterCheck(rule, context, node, acquireCount, prioritized);
        }
		//单机模式
        return passLocalCheck(rule, context, node, acquireCount, prioritized);
    }
    private static boolean passLocalCheck(FlowRule rule, Context context, DefaultNode node, int acquireCount,
                                          boolean prioritized) {
        //根据流控模式获取对应的node
        Node selectedNode = selectNodeByRequesterAndStrategy(rule, context, node);
        if (selectedNode == null) {
            return true;
        }
		//根据流控效果对应的控制器 TrafficShapingController 校验能够通过规则
        return rule.getRater().canPass(selectedNode, acquireCount, prioritized);
    }
```

**3、** selectNodeByRequesterAndStrategy()；

```java
	static Node selectNodeByRequesterAndStrategy(/*@NonNull*/ FlowRule rule, Context context, DefaultNode node) {
        //规则针对的调用方
        String limitApp = rule.getLimitApp();
        //流控模式
        int strategy = rule.getStrategy();
        //请求的调用方，上层链路
        String origin = context.getOrigin();
		//规则针对的调用方时本次请求的调用方，并且不是default、other
        if (limitApp.equals(origin) && filterOrigin(origin)) {
            if (strategy == RuleConstant.STRATEGY_DIRECT) {
                // 直接模式，返回调用方node
                return context.getOriginNode();
            }
			//关联或链路模式
            return selectReferenceNode(rule, context, node);
        //流控规则针对的调用方是default
        } else if (RuleConstant.LIMIT_APP_DEFAULT.equals(limitApp)) {
            if (strategy == RuleConstant.STRATEGY_DIRECT) {
                // 直接模式，返回ClusterNode
                return node.getClusterNode();
            }
			//关联或链路模式
            return selectReferenceNode(rule, context, node);
        //其他模式，并且没有对该资源配置其他的流控规则
        } else if (RuleConstant.LIMIT_APP_OTHER.equals(limitApp)
            && FlowRuleManager.isOtherOrigin(origin, rule.getResource())) {
            if (strategy == RuleConstant.STRATEGY_DIRECT) {
            	// 直接模式，返回调用方node
                return context.getOriginNode();
            }
			//关联或链路模式
            return selectReferenceNode(rule, context, node);
        }
        return null;
    }
```

**4、** selectReferenceNode()；

```java
	static Node selectReferenceNode(FlowRule rule, Context context, DefaultNode node) {
        String refResource = rule.getRefResource();
        int strategy = rule.getStrategy();
        if (StringUtil.isEmpty(refResource)) {
            return null;
        }
		//关联模式，从集群环境中获取对应关联资源Node
        if (strategy == RuleConstant.STRATEGY_RELATE) {
            return ClusterBuilderSlot.getClusterNode(refResource);
        }
		//链路模式，判断入口资源与上下文名称是否一致，一致时返回入口资源node
        if (strategy == RuleConstant.STRATEGY_CHAIN) {
            if (!refResource.equals(context.getName())) {
                return null;
            }
            return node;
        }
        // No node.
        return null;
    }
```

**5、** 调用TrafficShapingController的canPass()；

DefaultController，默认控制器

WarmUpController，预热限流

RateLimiterController，匀速排队限流

WarmUpRateLimiterController，匀速排队和预热相结合限流

## 三、DefaultController

快速失败限流

```java
 public boolean canPass(Node node, int acquireCount, boolean prioritized) {
 		//获取当前资源的请求数
        int curCount = avgUsedTokens(node);
        //校验配置的阈值
        if (curCount + acquireCount > count) {
        	//设置优先，并且是QPS控制
            if (prioritized && grade == RuleConstant.FLOW_GRADE_QPS) {
                long currentTime;
                long waitInMs;
                currentTime = TimeUtil.currentTimeMillis();
                //获取下次能请求资源的时间
                waitInMs = node.tryOccupyNext(currentTime, acquireCount, count);
                //等待时间小于设置的超时时间
                if (waitInMs < OccupyTimeoutProperty.getOccupyTimeout()) {
                    node.addWaitingRequest(currentTime + waitInMs, acquireCount);
                    node.addOccupiedPass(acquireCount);
                    //休眠等待
                    sleep(waitInMs);
                    // PriorityWaitException indicates that the request will pass after waiting for {@link @waitInMs}.
                    //抛出PriorityWaitException异常
                    throw new PriorityWaitException(waitInMs);
                }
            }
            //大于阈值，返回失败
            return false;
        }
        //小于阈值，返回成功
        return true;
    }
```

## 四、RateLimiterController

排队等待限流

```java
 @Override
    public boolean canPass(Node node, int acquireCount, boolean prioritized) {
        // 校验需要获取的令牌数
        if (acquireCount <= 0) {
            return true;
        }
        // 校验阈值
        if (count <= 0) {
            return false;
        }
        long currentTime = TimeUtil.currentTimeMillis();
        // 产生需要的令牌数花费的时间
        long costTime = Math.round(1.0 * (acquireCount) / count * 1000);
        // 期望时间
        long expectedTime = costTime + latestPassedTime.get();
		//当前时间已经过了期望的时间，说明有足够的时间生成需要的令牌，则成功获取到令牌
        if (expectedTime <= currentTime) {
            latestPassedTime.set(currentTime);
            return true;
        } else {
            // 没有到期望时间，计算需要等待的时间
            long waitTime = costTime + latestPassedTime.get() - TimeUtil.currentTimeMillis();
            //等待时间大于最大等待超时时间时，获取令牌失败
            if (waitTime > maxQueueingTimeMs) {
                return false;
            } else {
            	//更新缓存获取令牌时间
                long oldTime = latestPassedTime.addAndGet(costTime);
                try {
                	//再次校验等待时间
                    waitTime = oldTime - TimeUtil.currentTimeMillis();
                    if (waitTime > maxQueueingTimeMs) {
                        latestPassedTime.addAndGet(-costTime);
                        return false;
                    }
                    // 休眠等待一会，然后成功获取令牌
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
