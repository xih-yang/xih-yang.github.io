# 16、SpringCloud Alibaba - Sentinel功能插槽ProcessorSlot
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/16.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

sentinel 可以对资源也就是接口配置一些规则，各种规则检查的功能都继承ProcessorSlot，sentinel 会将不同的 ProcessorSlot 组装为一个责任链，当请求来的时候，会对资源的规则进行检查。

## 一、ProcessorSlotChain 初始化

**1、** 在访问资源的时候，首次访问会创建功能链，调用SlotChainProvider.newSlotChain()方法；

```java
SlotChainProvider.java
public static ProcessorSlotChain newSlotChain() {
        if (slotChainBuilder != null) {
            return slotChainBuilder.build();
        }
        // Resolve the slot chain builder SPI.
        //用SPI方式获取SlotChainBuilder
        slotChainBuilder = SpiLoader.loadFirstInstanceOrDefault(SlotChainBuilder.class, DefaultSlotChainBuilder.class);
        if (slotChainBuilder == null) {
            // Should not go through here.
            RecordLog.warn("[SlotChainProvider] Wrong state when resolving slot chain builder, using default");
            slotChainBuilder = new DefaultSlotChainBuilder();
        } else {
            RecordLog.info("[SlotChainProvider] Global slot chain builder resolved: "
                + slotChainBuilder.getClass().getCanonicalName());
        }
        //调用 build() 方法
        return slotChainBuilder.build();
    }
```

**2、** build()；

```java
DefaultSlotChainBuilder.java
 public ProcessorSlotChain build() {
 		//创建 DefaultProcessorSlotChain(),并创建首个功能插槽ProcessorSlot
        ProcessorSlotChain chain = new DefaultProcessorSlotChain();
        // Note: the instances of ProcessorSlot should be different, since they are not stateless.
        //通过SPI方式加载ProcessorSlot
        List<ProcessorSlot> sortedSlotList = SpiLoader.loadPrototypeInstanceListSorted(ProcessorSlot.class);
        //构建链
        for (ProcessorSlot slot : sortedSlotList) {
            if (!(slot instanceof AbstractLinkedProcessorSlot)) {
                RecordLog.warn("The ProcessorSlot(" + slot.getClass().getCanonicalName() + ") is not an instance of AbstractLinkedProcessorSlot, can't be added into ProcessorSlotChain");
                continue;
            }
            chain.addLast((AbstractLinkedProcessorSlot<?>) slot);
        }
        return chain;
    }
```

**3、** 目前版本的有9个ProcessorSlot；

NodeSelectorSlot： 构建调用树

ClusterBuilderSlot： 维护集群流控数据，每个资源1个ClusterNode

LogSlot: 日志相关

StatisticSlot：统计相关

AuthoritySlot：授权规则

SystemSlot：系统规则

ParamFlowSlot: 热点规则

FlowSlot：流控规则

DegradeSlot： 服务熔断降级规则

## 二、ProcessorSlotChain 使用

**1、** SentinelWebAutoConfiguration；

在SentinelWebAutoConfiguration配置类中配置了bean SentinelWebInterceptor ，它实现了spring mvc 里的HandlerInterceptor，那么请求在执行前、后、完成时 会回调 SentinelWebInterceptor 里的方法

```java
	@Bean
	@ConditionalOnProperty(name = "spring.cloud.sentinel.filter.enabled",
			matchIfMissing = true)
	public SentinelWebInterceptor sentinelWebInterceptor(
			SentinelWebMvcConfig sentinelWebMvcConfig) {
		return new SentinelWebInterceptor(sentinelWebMvcConfig);
	}
```

**2、** SentinelWebInterceptor；

```java
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
        throws Exception {
        try {
        	//请求的资源名称，即访问的接口
            String resourceName = getResourceName(request);
            if (StringUtil.isEmpty(resourceName)) {
                return true;
            }
            //控制同一个request只能进来一次
            if (increaseReferece(request, this.baseWebMvcConfig.getRequestRefName(), 1) != 1) {
                return true;
            }
            // Parse the request origin using registered origin parser.
            String origin = parseOrigin(request);
            String contextName = getContextName(request);
            ContextUtil.enter(contextName, origin);
            //sentinel 对资源进行规则检查、统计等操作
            Entry entry = SphU.entry(resourceName, ResourceTypeConstants.COMMON_WEB, EntryType.IN);
            request.setAttribute(baseWebMvcConfig.getRequestAttributeName(), entry);
            return true;
        } catch (BlockException e) {
            try {
            	//全局处理流控异常
                handleBlockException(request, response, e);
            } finally {
                ContextUtil.exit();
            }
            return false;
        }
    }
```

**3、** entry()；

最终进入到 entryWithPriority( ) 方法

```java
	 public static Entry entry(String name, int resourceType, EntryType trafficType) throws BlockException {
        return Env.sph.entryWithType(name, resourceType, trafficType, 1, OBJECTS0);
    }
	@Override
    public Entry entryWithType(String name, int resourceType, EntryType entryType, int count, Object[] args)
        throws BlockException {
        return entryWithType(name, resourceType, entryType, count, false, args);
    }
	 @Override
    public Entry entryWithType(String name, int resourceType, EntryType entryType, int count, boolean prioritized,
                               Object[] args) throws BlockException {
        StringResourceWrapper resource = new StringResourceWrapper(name, entryType, resourceType);
        return entryWithPriority(resource, count, prioritized, args);
    }
```

**4、** entryWithPriority()；

```java
	private Entry entryWithPriority(ResourceWrapper resourceWrapper, int count, boolean prioritized, Object... args)
        throws BlockException {
        Context context = ContextUtil.getContext();
        //校验 context 
        if (context instanceof NullContext) {
            // The {@link NullContext} indicates that the amount of context has exceeded the threshold,
            // so here init the entry only. No rule checking will be done.
            return new CtEntry(resourceWrapper, null, context);
        }
        if (context == null) {
            // Using default context.
            context = InternalContextUtil.internalEnter(Constants.CONTEXT_DEFAULT_NAME);
        }
        // Global switch is close, no rule checking will do.
        if (!Constants.ON) {
            return new CtEntry(resourceWrapper, null, context);
        }
		//获取资源的功能检查链，通过 SlotChainProvider.newSlotChain() 获取，上面已经分析过
        ProcessorSlot<Object> chain = lookProcessChain(resourceWrapper);
        /*
         * Means amount of resources (slot chain) exceeds {@link Constants.MAX_SLOT_CHAIN_SIZE},
         * so no rule checking will be done.
         */
        if (chain == null) {
            return new CtEntry(resourceWrapper, null, context);
        }
        Entry e = new CtEntry(resourceWrapper, chain, context);
        try {
        	//进入检查链
            chain.entry(context, resourceWrapper, null, count, prioritized, args);
        } catch (BlockException e1) {
            e.exit(count, args);
            throw e1;
        } catch (Throwable e1) {
            // This should not happen, unless there are errors existing in Sentinel internal.
            RecordLog.info("Sentinel unexpected exception", e1);
        }
        return e;
    }
```

**5、** chain.entry()；

链头的ProcessorSlot没有什么逻辑，直接调用了链上的下一个节点，然后再依次调用链上其他节点

```java
 	public void entry(Context context, ResourceWrapper resourceWrapper, Object t, int count, boolean prioritized, Object... args)
        throws Throwable {
        first.transformEntry(context, resourceWrapper, t, count, prioritized, args);
    }
	 public void entry(Context context, ResourceWrapper resourceWrapper, Object t, int count, boolean prioritized, Object... args)
            throws Throwable {
            super.fireEntry(context, resourceWrapper, t, count, prioritized, args);
        }
	 public void fireEntry(Context context, ResourceWrapper resourceWrapper, Object obj, int count, boolean prioritized, Object... args)
        throws Throwable {
        if (next != null) {
            next.transformEntry(context, resourceWrapper, obj, count, prioritized, args);
        }
    }
```

## 三、ProcessorSlot 实现类

### 1、NodeSelectorSlot

```java
public void entry(Context context, ResourceWrapper resourceWrapper, Object obj, int count, boolean prioritized, Object... args)
        throws Throwable {
        DefaultNode node = map.get(context.getName());
        if (node == null) {
            synchronized (this) {
                node = map.get(context.getName());
                if (node == null) {
                    node = new DefaultNode(resourceWrapper, null);
                    HashMap<String, DefaultNode> cacheMap = new HashMap<String, DefaultNode>(map.size());
                    cacheMap.putAll(map);
                    cacheMap.put(context.getName(), node);
                    map = cacheMap;
                    // Build invocation tree
                    //构建调用树
                    ((DefaultNode) context.getLastNode()).addChild(node);
                }
            }
        }
		//设置调用链上下文当前节点
        context.setCurNode(node);
        //调用下一个
        fireEntry(context, resourceWrapper, node, count, prioritized, args);
    }
 @Override
    public void exit(Context context, ResourceWrapper resourceWrapper, int count, Object... args) {
        fireExit(context, resourceWrapper, count, args);
    }
```

### 2、ClusterBuilderSlot

```java
 @Override
    public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count,
                      boolean prioritized, Object... args)
        throws Throwable {
        //每个资源一个clusterNode 
        if (clusterNode == null) {
            synchronized (lock) {
                if (clusterNode == null) {
                    // Create the cluster node.
                    clusterNode = new ClusterNode(resourceWrapper.getName(), resourceWrapper.getResourceType());
                    HashMap<ResourceWrapper, ClusterNode> newMap = new HashMap<>(Math.max(clusterNodeMap.size(), 16));
                    newMap.putAll(clusterNodeMap);
                    newMap.put(node.getId(), clusterNode);
                    clusterNodeMap = newMap;
                }
            }
        }
        //将clusterNode设置到当前node中
        node.setClusterNode(clusterNode);
        /*
         * if context origin is set, we should get or create a new {@link Node} of
         * the specific origin.
         */
        if (!"".equals(context.getOrigin())) {
            Node originNode = node.getClusterNode().getOrCreateOriginNode(context.getOrigin());
            context.getCurEntry().setOriginNode(originNode);
        }
        fireEntry(context, resourceWrapper, node, count, prioritized, args);
    }
    @Override
    public void exit(Context context, ResourceWrapper resourceWrapper, int count, Object... args) {
        fireExit(context, resourceWrapper, count, args);
    }
```

### 3、LogSlot

出现异常时，记录日志

```java
public class LogSlot extends AbstractLinkedProcessorSlot<DefaultNode> {
    @Override
    public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode obj, int count, boolean prioritized, Object... args)
        throws Throwable {
        try {
            fireEntry(context, resourceWrapper, obj, count, prioritized, args);
        } catch (BlockException e) {
            EagleEyeLogUtil.log(resourceWrapper.getName(), e.getClass().getSimpleName(), e.getRuleLimitApp(),
                context.getOrigin(), count);
            throw e;
        } catch (Throwable e) {
            RecordLog.warn("Unexpected entry exception", e);
        }
    }
    @Override
    public void exit(Context context, ResourceWrapper resourceWrapper, int count, Object... args) {
        try {
            fireExit(context, resourceWrapper, count, args);
        } catch (Throwable e) {
            RecordLog.warn("Unexpected entry exit exception", e);
        }
    }
}
```

### 4、AuthoritySlot

黑白名单授权相关

```java
@SpiOrder(-6000)
public class AuthoritySlot extends AbstractLinkedProcessorSlot<DefaultNode> {
    @Override
    public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count, boolean prioritized, Object... args)
        throws Throwable {
        //检查授权
        checkBlackWhiteAuthority(resourceWrapper, context);
        fireEntry(context, resourceWrapper, node, count, prioritized, args);
    }
    @Override
    public void exit(Context context, ResourceWrapper resourceWrapper, int count, Object... args) {
        fireExit(context, resourceWrapper, count, args);
    }
    void checkBlackWhiteAuthority(ResourceWrapper resource, Context context) throws AuthorityException {
    	//从AuthorityRuleManager 中获取规则
        Map<String, Set<AuthorityRule>> authorityRules = AuthorityRuleManager.getAuthorityRules();
        if (authorityRules == null) {
            return;
        }
		//找到资源的规则
        Set<AuthorityRule> rules = authorityRules.get(resource.getName());
        if (rules == null) {
            return;
        }
        for (AuthorityRule rule : rules) {
        	//规则校验
            if (!AuthorityRuleChecker.passCheck(rule, context)) {
                throw new AuthorityException(context.getOrigin(), rule);
            }
        }
    }
}
```

### 5、SystemSlot

系统规则，校验 qps、thread、rollingCounter、SystemAvgLoad、CpuUsage 等

```java
@SpiOrder(-5000)
public class SystemSlot extends AbstractLinkedProcessorSlot<DefaultNode> {
    @Override
    public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count,
                      boolean prioritized, Object... args) throws Throwable {
        //校验
        SystemRuleManager.checkSystem(resourceWrapper);
        fireEntry(context, resourceWrapper, node, count, prioritized, args);
    }
    @Override
    public void exit(Context context, ResourceWrapper resourceWrapper, int count, Object... args) {
        fireExit(context, resourceWrapper, count, args);
    }
}
```

```java
public static void checkSystem(ResourceWrapper resourceWrapper) throws BlockException {
        if (resourceWrapper == null) {
            return;
        }
        // Ensure the checking switch is on.
        if (!checkSystemStatus.get()) {
            return;
        }
        // for inbound traffic only
        if (resourceWrapper.getEntryType() != EntryType.IN) {
            return;
        }
        // total qps
        //qps限制
        double currentQps = Constants.ENTRY_NODE == null ? 0.0 : Constants.ENTRY_NODE.successQps();
        if (currentQps > qps) {
            throw new SystemBlockException(resourceWrapper.getName(), "qps");
        }
        // total thread
        //线程数限制
        int currentThread = Constants.ENTRY_NODE == null ? 0 : Constants.ENTRY_NODE.curThreadNum();
        if (currentThread > maxThread) {
            throw new SystemBlockException(resourceWrapper.getName(), "thread");
        }
		//rt限制
        double rt = Constants.ENTRY_NODE == null ? 0 : Constants.ENTRY_NODE.avgRt();
        if (rt > maxRt) {
            throw new SystemBlockException(resourceWrapper.getName(), "rt");
        }
        // load. BBR algorithm.
        //负载限制
        if (highestSystemLoadIsSet && getCurrentSystemAvgLoad() > highestSystemLoad) {
            if (!checkBbr(currentThread)) {
                throw new SystemBlockException(resourceWrapper.getName(), "load");
            }
        }
        // cpu usage
        //cpu使用率限制
        if (highestCpuUsageIsSet && getCurrentCpuUsage() > highestCpuUsage) {
            throw new SystemBlockException(resourceWrapper.getName(), "cpu");
        }
    }
```

其他的实现类后续再分析…
