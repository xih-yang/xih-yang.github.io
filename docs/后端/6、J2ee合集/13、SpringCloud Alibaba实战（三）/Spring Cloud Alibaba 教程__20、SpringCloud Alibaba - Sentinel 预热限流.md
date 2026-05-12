# 20、SpringCloud Alibaba - Sentinel 预热限流
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/20.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

如果系统平时流量很低，突然陡增的流量可能会导致系统不稳定，需要需要缓慢增加令牌数到最大阈值。

Sentinel 的 预热限流基于Guava里的算法实现。

```java

```

## 一、预热原理

X轴：令牌桶中的令牌数量

Y轴：生产一个令牌消耗的时间，单位是s

stableInterval： 稳定生产一个令牌消耗的时间

coldInterval ：冷启动生产一个令牌需要的最大时间，与冷却因子coldFactor有关

thresholdPermits：开启预热的令牌阈值

maxPermits：令牌桶最大令牌数

stable：平稳生产thresholdPermits个令牌的时间

warm up period：预热时间

slope：

当系统刚启动或者长时间没有收到请求时处于冷却状态，这时令牌达到为 maxPermits；

当有慢慢有请求过来时，存在一个预热期，在预热期间获取令牌的时间会比平稳期获取令牌的时间要长，随着令牌的减少，获取单个令牌的时间会慢慢变短，最终到达一个稳定值 stableInterval

## 二、WarmUpController

**1、** 构造方法；

```java
	private void construct(double count, int warmUpPeriodInSec, int coldFactor) {
        if (coldFactor <= 1) {
            throw new IllegalArgumentException("Cold factor should be larger than 1");
        }
        this.count = count;
        this.coldFactor = coldFactor;
		// thresholdPermits = 0.5 * warmupPeriod / stableInterval.
        // warningToken = 100;
        warningToken = (int)(warmUpPeriodInSec * count) / (coldFactor - 1);
        // / maxPermits = thresholdPermits + 2 * warmupPeriod /
        // (stableInterval + coldInterval)
        // maxToken = 200
        maxToken = warningToken + (int)(2 * warmUpPeriodInSec * count / (1.0 + coldFactor));
        // slope
        // slope = (coldIntervalMicros - stableIntervalMicros) / (maxPermits
        // - thresholdPermits);
        slope = (coldFactor - 1.0) / count / (maxToken - warningToken);
    }
```

coldFactor： 冷却因子，默认是3

count ：sentinel界面设置的阈值，假设为5个

warmUpPeriodInSec ：sentinel界面设置的预热时间，假设为10s

则：

stableInterval = 1 / count = 0.2

coldInterval = stableInterval * coldFactor = 0.6

stable = warmUpPeriodInSec / 2 = 5

thresholdPermits(warningToken) = stable / stableInterval = 25

maxToken 利用梯形的面积 = （上底+下底）* 高 / 2 计算

maxToken = thresholdPermits + warmUpPeriodInSec * 2 /（stableInterval + coldInterval ） = 50

slope 利用斜率公式k=(y1-y2) / (x1-x2) 计算

slope = （coldInterval - stableInterval ）/（maxToken - thresholdPermits） = 0.016

**2、** canPass()；

```java
    @Override
    public boolean canPass(Node node, int acquireCount, boolean prioritized) {
    	//当前时间窗口的qps
        long passQps = (long) node.passQps();
		//上一个时间窗口的qps
        long previousQps = (long) node.previousPassQps();
        //生产令牌过程
        syncToken(previousQps);
        // 开始计算它的斜率
        // 如果进入了警戒线，开始调整他的qps
        //剩余令牌数
        long restToken = storedTokens.get();
        //令牌数大于告警阈值，开启预热
        if (restToken >= warningToken) {
            long aboveToken = restToken - warningToken;
            // 消耗的速度要比warning快，但是要比慢
            // current interval = restToken*slope+1/count
            //计算预热时的qps，这是每秒钟生产令牌速度低于5个
            double warningQps = Math.nextUp(1.0 / (aboveToken * slope + 1.0 / count));
            //判断消耗令牌的速度是否小于生产的速度
            if (passQps + acquireCount <= warningQps) {
                return true;
            }
        } else {
        	//令牌数小于告警阈值，不开启预热，此时生产速度为count 即5个
            if (passQps + acquireCount <= count) {
                return true;
            }
        }
        return false;
    }
```

**3、** syncToken(previousQps)；

```java
	protected void syncToken(long passQps) {
        long currentTime = TimeUtil.currentTimeMillis();
        // 当前时间去掉小于1秒的数
        currentTime = currentTime - currentTime % 1000;
        //上次记录的时间
        long oldLastFillTime = lastFilledTime.get();
        //同1s内，不重新计算storedTokens
        if (currentTime <= oldLastFillTime) {
            return;
        }
		//获取桶中的令牌数
        long oldValue = storedTokens.get();
        //计算生成令牌数新值
        long newValue = coolDownTokens(currentTime, passQps);
		//设置新值
        if (storedTokens.compareAndSet(oldValue, newValue)) {
        	//新值减去当前qps
            long currentValue = storedTokens.addAndGet(0 - passQps);
            if (currentValue < 0) {
                storedTokens.set(0L);
            }
            //更新时间
            lastFilledTime.set(currentTime);
        }
    }
```

**4、** coolDownTokens()；

```java
	private long coolDownTokens(long currentTime, long passQps) {
        long oldValue = storedTokens.get();
        long newValue = oldValue;
        // 添加令牌的判断前提条件:
        // 当令牌的消耗程度远远低于警戒线的时候
        if (oldValue < warningToken) {
        	//令牌数低于告警值，按正常速度生成新的令牌数
            newValue = (long)(oldValue + (currentTime - lastFilledTime.get()) * count / 1000);
        } else if (oldValue > warningToken) {
        	//令牌数大于告警值
            if (passQps < (int)count / coldFactor) {
            	//上一秒的qps小于预热最小的qps，也就是令牌消耗能力低于预热生成的最小能力时，即系统处于冷却过程
            	//也按正常速度生成新的令牌数，相当于降低了qps，这里将qps降下来，以最快的速度降低qps
                newValue = (long)(oldValue + (currentTime - lastFilledTime.get()) * count / 1000);
            }
            //系统处于预热过程时，没有生成新的令牌，相当于增大了qps，这里保证qps能够升上去，以最快的速度提升qps
        }
        //新值不能超过最大令牌数
        return Math.min(newValue, maxToken);
    }
```

## 三、WarmUpRateLimiterController

预热和排队等待想结合的算法，WarmUpRateLimiterController继承了WarmUpController

**1、** 构造方法；

```java
public class WarmUpRateLimiterController extends WarmUpController {
	//排队等待的超时时间
    private final int timeoutInMs;
    //上一次请求通过的时间
    private final AtomicLong latestPassedTime = new AtomicLong(-1);
    public WarmUpRateLimiterController(double count, int warmUpPeriodSec, int timeOutMs, int coldFactor) {
    	//调用父类
        super(count, warmUpPeriodSec, coldFactor);
        //设置超时时间
        this.timeoutInMs = timeOutMs;
    }
    ...
    }
```

**2、** canPass()；

```java
 	public boolean canPass(Node node, int acquireCount, boolean prioritized) {
 		//跟WarmUpController一样，根据上一个时间窗口的qps计算出新的令牌
        long previousQps = (long) node.previousPassQps();
        syncToken(previousQps);
        long currentTime = TimeUtil.currentTimeMillis();
		//令牌桶剩余令牌
        long restToken = storedTokens.get();
        long costTime = 0;
        long expectedTime = 0;
        //剩余令牌超过了警戒值
        if (restToken >= warningToken) {
        	//超过的数量
            long aboveToken = restToken - warningToken;
            // current interval = restToken*slope+1/count
            //计算预热的qps
            double warmingQps = Math.nextUp(1.0 / (aboveToken * slope + 1.0 / count));
            //根据预热的qps计算获取请求的令牌需要花费的时间
            costTime = Math.round(1.0 * (acquireCount) / warmingQps * 1000);
        } else {
        	//没有超过警戒值，根据正常速率计算花费的时间
            costTime = Math.round(1.0 * (acquireCount) / count * 1000);
        }
        //计算出期望时间
        expectedTime = costTime + latestPassedTime.get();
        if (expectedTime <= currentTime) {
        	//期望时间小于当前时间，成功获取到令牌
            latestPassedTime.set(currentTime);
            return true;
        } else {
        	//期望时间还没有到来，计算需要等待的时间
            long waitTime = costTime + latestPassedTime.get() - currentTime;
            if (waitTime > timeoutInMs) {
            	//等待时间大于超时时间，获取令牌失败
                return false;
            } else {
                long oldTime = latestPassedTime.addAndGet(costTime);
                try {
                	//再次计算等待时间
                    waitTime = oldTime - TimeUtil.currentTimeMillis();
                    if (waitTime > timeoutInMs) {
                        latestPassedTime.addAndGet(-costTime);
                        return false;
                    }
                    //休眠等待
                    if (waitTime > 0) {
                        Thread.sleep(waitTime);
                    }
                    //期望时间到了，成功获取到令牌
                    return true;
                } catch (InterruptedException e) {
                }
            }
        }
        return false;
    }
```

## 四、总结

WarmUpController 根据预热的qps直接判断 passQps + acquireCount <= warningQps；

WarmUpRateLimiterController 根据预热的qps计算期望时间，再判断期望时间有没有到来或者是否在允许的超时时间范围内。
