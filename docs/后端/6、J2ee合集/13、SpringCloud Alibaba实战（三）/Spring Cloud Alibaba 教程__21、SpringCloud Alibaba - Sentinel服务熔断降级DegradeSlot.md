# 21、SpringCloud Alibaba - Sentinel服务熔断降级DegradeSlot
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/21.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 一、DegradeRule

```java
 	/**
     * 降级策略：慢调用比例、异常比例、异常数
     */
 	private int grade = RuleConstant.DEGRADE_GRADE_RT;
    /**
     * 阈值：最大RT、比例阈值、异常数
     */
    private double count;
    /**
     * 降级恢复时间，多久后结束降级
     */
    private int timeWindow;
    /**
     * 触达熔断的最小请求数量
     */
    private int minRequestAmount = RuleConstant.DEGRADE_DEFAULT_MIN_REQUEST_AMOUNT;
    /**
     * RT 模式的慢比例阈值
     */
    private double slowRatioThreshold = 1.0d;
 	/**
     * 统计时长
     */
    private int statIntervalMs = 1000;
```

## 一、DegradeSlot

**1、** entry()；

在entry方法中，对熔断规则的状态进行判断，CLOSE 状态通过规则，OPEN 状态时检验熔断时间是否已经过去，如果过去了则更新状态为 HALF_OPEN。

·1、、entry( )

```java
	@Override
    public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count,
                      boolean prioritized, Object... args) throws Throwable {
        //执行熔断规则检查
        performChecking(context, resourceWrapper);
		//下一个节点
        fireEntry(context, resourceWrapper, node, count, prioritized, args);
    }
```

2、、performChecking( )

```java
 void performChecking(Context context, ResourceWrapper r) throws BlockException {
 		//获取该资源的熔断规则
        List<CircuitBreaker> circuitBreakers = DegradeRuleManager.getCircuitBreakers(r.getName());
        if (circuitBreakers == null || circuitBreakers.isEmpty()) {
            return;
        }
        for (CircuitBreaker cb : circuitBreakers) {
        	//规则检验
            if (!cb.tryPass(context)) {
                throw new DegradeException(cb.getRule().getLimitApp(), cb.getRule());
            }
        }
    }
```

3、、tryPass( )

```java
 	@Override
    public boolean tryPass(Context context) {
        // Template implementation.
        //熔断处于关闭状态，返回成功
        if (currentState.get() == State.CLOSED) {
            return true;
        }
        //熔断处于打开状态
        if (currentState.get() == State.OPEN) {
            // For half-open state we allow a request for probing.
            //校验降级时间是否已经过了，从打开状态转换成半开状态
            return retryTimeoutArrived() && fromOpenToHalfOpen(context);
        }
        return false;
    }
```

4、、retryTimeoutArrived( )

```java
	protected boolean retryTimeoutArrived() {
        return TimeUtil.currentTimeMillis() >= nextRetryTimestamp;
    }
```

5、、fromOpenToHalfOpen( )

```java
 	protected boolean fromOpenToHalfOpen(Context context) {
 		//更新状态，由 OPEN 到 HALF_OPEN
        if (currentState.compareAndSet(State.OPEN, State.HALF_OPEN)) {
        	//通知观察者状态变化
            notifyObservers(State.OPEN, State.HALF_OPEN, null);
            Entry entry = context.getCurEntry();
            //注册exitHandlers，在执行链 Slot chain 执行完退出后，会回调exitHandlers
            entry.whenTerminate(new BiConsumer<Context, Entry>() {
                @Override
                public void accept(Context context, Entry entry) {
                    // Note: This works as a temporary workaround for https://github.com/alibaba/Sentinel/issues/1638
                    // Without the hook, the circuit breaker won't recover from half-open state in some circumstances
                    // when the request is actually blocked by upcoming rules (not only degrade rules).
                    //如果出现了BlockException
                    if (entry.getBlockError() != null) {
                        // Fallback to OPEN due to detecting request is blocked
                        //将状态恢复，由 HALF_OPEN 到 OPEN
                        currentState.compareAndSet(State.HALF_OPEN, State.OPEN);
                        //通知监听者
                        notifyObservers(State.HALF_OPEN, State.OPEN, 1.0d);
                    }
                }
            });
            return true;
        }
        return false;
    }
```

**2、** exit()；

```java
 	public void exit(Context context, ResourceWrapper r, int count, Object... args) {
        Entry curEntry = context.getCurEntry();
        //出现异常，直接执行下一个节点
        if (curEntry.getBlockError() != null) {
            fireExit(context, r, count, args);
            return;
        }
        List<CircuitBreaker> circuitBreakers = DegradeRuleManager.getCircuitBreakers(r.getName());
        //没有熔断规则，直接执行下一个节点
        if (circuitBreakers == null || circuitBreakers.isEmpty()) {
            fireExit(context, r, count, args);
            return;
        }
        if (curEntry.getBlockError() == null) {
            // passed request
            for (CircuitBreaker circuitBreaker : circuitBreakers) {
            	//调用每一个熔断规则的 onRequestComplete，分别有ResponseTimeCircuitBreaker、ExceptionCircuitBreaker
                circuitBreaker.onRequestComplete(context);
            }
        }
		//执行下一个节点
        fireExit(context, r, count, args);
    }
```

## 三、ResponseTimeCircuitBreaker

慢调用比例的处理逻辑，时间窗口使用的是SlowRequestLeapArray ，对应的bucket是 SlowRequestCounter

**1、** SlowRequestLeapArray；

```java
static class SlowRequestLeapArray extends LeapArray<SlowRequestCounter> {
        public SlowRequestLeapArray(int sampleCount, int intervalInMs) {
            super(sampleCount, intervalInMs);
        }
        @Override
        public SlowRequestCounter newEmptyBucket(long timeMillis) {
            return new SlowRequestCounter();
        }
        @Override
        protected WindowWrap<SlowRequestCounter> resetWindowTo(WindowWrap<SlowRequestCounter> w, long startTime) {
            w.resetTo(startTime);
            w.value().reset();
            return w;
        }
    }
```

**2、** SlowRequestCounter；

```java
 static class SlowRequestCounter {
        private LongAdder slowCount;
        private LongAdder totalCount;
        public SlowRequestCounter() {
        	//慢请求数量
            this.slowCount = new LongAdder();
            //总请求数量
            this.totalCount = new LongAdder();
        }
        public LongAdder getSlowCount() {
            return slowCount;
        }
        public LongAdder getTotalCount() {
            return totalCount;
        }
        public SlowRequestCounter reset() {
            slowCount.reset();
            totalCount.reset();
            return this;
        }
        @Override
        public String toString() {
            return "SlowRequestCounter{" +
                "slowCount=" + slowCount +
                ", totalCount=" + totalCount +
                '}';
        }
    }
```

**3、** onRequestComplete()；

```java
  public void onRequestComplete(Context context) {
  		//当前时间窗口的慢请求计数器
        SlowRequestCounter counter = slidingCounter.currentWindow().value();
        Entry entry = context.getCurEntry();
        if (entry == null) {
            return;
        }
        long completeTime = entry.getCompleteTimestamp();
        if (completeTime <= 0) {
            completeTime = TimeUtil.currentTimeMillis();
        }
        //计算响应时间
        long rt = completeTime - entry.getCreateTimestamp();
        //大于阈值，为慢请求
        if (rt > maxAllowedRt) {
            counter.slowCount.add(1);
        }
        //总数量也加1
        counter.totalCount.add(1);
		//处理熔断规则状态
        handleStateChangeWhenThresholdExceeded(rt);
    }
```

**4、** handleStateChangeWhenThresholdExceeded()；

```java
 private void handleStateChangeWhenThresholdExceeded(long rt) {
 		//已经是打开状态
        if (currentState.get() == State.OPEN) {
            return;
        }
        //半开状态
        if (currentState.get() == State.HALF_OPEN) {
            // In detecting request
            // TODO: improve logic for half-open recovery
            if (rt > maxAllowedRt) {
            	//熔断时间过去后的下一次请求处于半开状态，此时又超时了，直接由半开变为打开
                fromHalfOpenToOpen(1.0d);
            } else {
            	//没有超时，由半开变为关闭
                fromHalfOpenToClose();
            }
            return;
        }
		//获取窗口计数器
        List<SlowRequestCounter> counters = slidingCounter.values();
        long slowCount = 0;
        long totalCount = 0;
        for (SlowRequestCounter counter : counters) {
        	//慢请求数量
            slowCount += counter.slowCount.sum();
            //总请求数量
            totalCount += counter.totalCount.sum();
        }
        //总数量 达不到 触达熔断的最小请求数量
        if (totalCount < minRequestAmount) {
            return;
        }
        //慢请求比例
        double currentRatio = slowCount * 1.0d / totalCount;
        if (currentRatio > maxSlowRequestRatio) {
        	//打开熔断
            transformToOpen(currentRatio);
        }
    }
```

**5、** transformToOpen()；

```java
 	protected void transformToOpen(double triggerValue) {
        State cs = currentState.get();
        switch (cs) {
            case CLOSED:
                fromCloseToOpen(triggerValue);
                break;
            case HALF_OPEN:
                fromHalfOpenToOpen(triggerValue);
                break;
            default:
                break;
        }
    }
```

**6、** fromCloseToOpen()；

状态由Close 到 Open

```java
 protected boolean fromCloseToOpen(double snapshotValue) {
        State prev = State.CLOSED;
        if (currentState.compareAndSet(prev, State.OPEN)) {
        	//更新熔断结束时间
            updateNextRetryTimestamp();
			//通知状态变化
            notifyObservers(prev, State.OPEN, snapshotValue);
            return true;
        }
        return false;
    }
```

```java
 protected void updateNextRetryTimestamp() {
 		//当前时间加上熔断恢复时间
        this.nextRetryTimestamp = TimeUtil.currentTimeMillis() + recoveryTimeoutMs;
    }
```

**7、** fromHalfOpenToOpen()；

状态由HALF_OPEN 到 Open

```java
	 protected boolean fromHalfOpenToOpen(double snapshotValue) {
        if (currentState.compareAndSet(State.HALF_OPEN, State.OPEN)) {
            updateNextRetryTimestamp();
            notifyObservers(State.HALF_OPEN, State.OPEN, snapshotValue);
            return true;
        }
        return false;
    }
```

**8、** fromHalfOpenToClose()；

状态由HALF_OPEN 到 Close

```java
 protected boolean fromHalfOpenToClose() {
        if (currentState.compareAndSet(State.HALF_OPEN, State.CLOSED)) {
        	//重置统计指标
            resetStat();
            notifyObservers(State.HALF_OPEN, State.CLOSED, null);
            return true;
        }
        return false;
    }
```

```java
 public void resetStat() {
        // Reset current bucket (bucket count = 1).
        slidingCounter.currentWindow().value().reset();
    }
```

```java
        public SlowRequestCounter reset() {
            slowCount.reset();
            totalCount.reset();
            return this;
        }
```

## 四、ExceptionCircuitBreaker

异常比例、异常数 熔断规则的处理逻辑，时间窗口使用的是SimpleErrorCounterLeapArray，对应的bucket是 SimpleErrorCounter

**1、** SimpleErrorCounterLeapArray；

```java
static class SimpleErrorCounterLeapArray extends LeapArray<SimpleErrorCounter> {
        public SimpleErrorCounterLeapArray(int sampleCount, int intervalInMs) {
            super(sampleCount, intervalInMs);
        }
        @Override
        public SimpleErrorCounter newEmptyBucket(long timeMillis) {
            return new SimpleErrorCounter();
        }
        @Override
        protected WindowWrap<SimpleErrorCounter> resetWindowTo(WindowWrap<SimpleErrorCounter> w, long startTime) {
            // Update the start time and reset value.
            w.resetTo(startTime);
            w.value().reset();
            return w;
        }
    }
```

**2、** SimpleErrorCounter；

```java
 static class SimpleErrorCounter {
 		//异常数量
        private LongAdder errorCount;
        //总数量
        private LongAdder totalCount;
        public SimpleErrorCounter() {
            this.errorCount = new LongAdder();
            this.totalCount = new LongAdder();
        }
        public LongAdder getErrorCount() {
            return errorCount;
        }
        public LongAdder getTotalCount() {
            return totalCount;
        }
        public SimpleErrorCounter reset() {
            errorCount.reset();
            totalCount.reset();
            return this;
        }
        @Override
        public String toString() {
            return "SimpleErrorCounter{" +
                "errorCount=" + errorCount +
                ", totalCount=" + totalCount +
                '}';
        }
    }
```

**3、** onRequestComplete()；

```java
 public void onRequestComplete(Context context) {
        Entry entry = context.getCurEntry();
        if (entry == null) {
            return;
        }
        Throwable error = entry.getError();
        //当前时间窗口的慢请求计数器
        SimpleErrorCounter counter = stat.currentWindow().value();
        //有异常时，异常数量加1
        if (error != null) {
            counter.getErrorCount().add(1);
        }
        //总数量加1
        counter.getTotalCount().add(1);
		//处理熔断状态变化
        handleStateChangeWhenThresholdExceeded(error);
    }
```

**4、** handleStateChangeWhenThresholdExceeded()；

```java
 private void handleStateChangeWhenThresholdExceeded(Throwable error) {
 		//打开状态
        if (currentState.get() == State.OPEN) {
            return;
        }
        //半开状态
        if (currentState.get() == State.HALF_OPEN) {
            // In detecting request
            if (error == null) {
            	//没有异常，由半开变为关闭
                fromHalfOpenToClose();
            } else {
            	//有异常，由半开变为打开
                fromHalfOpenToOpen(1.0d);
            }
            return;
        }
        //关闭状态
        //获取时间窗口异常计数器
        List<SimpleErrorCounter> counters = stat.values();
        long errCount = 0;
        long totalCount = 0;
        for (SimpleErrorCounter counter : counters) {
        	//异常总数
            errCount += counter.errorCount.sum();
            //请求总数
            totalCount += counter.totalCount.sum();
        }
        //总数小于触达熔断的最小请求数量
        if (totalCount < minRequestAmount) {
            return;
        }
        double curCount = errCount;
        if (strategy == DEGRADE_GRADE_EXCEPTION_RATIO) {
            // Use errorRatio
            //异常比例
            curCount = errCount * 1.0d / totalCount;
        }
        //比较异常比例或者比较异常数
        if (curCount > threshold) {
        	//打开熔断，跟ResponseTimeCircuitBreaker一样调用父类AbstractCircuitBreaker的方法
            transformToOpen(curCount);
        }
    }
```
