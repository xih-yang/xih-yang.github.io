# 11、SpringCloud Alibaba - feign 重试策略 Retryer
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/11.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

请求远程接口失败时，会进入到重试策略。

## 一、Retryer

**1、** Retryer接口；

```java
public interface Retryer extends Cloneable {
  /**
   * if retry is permitted, return (possibly after sleeping). Otherwise propagate the exception.
   * 在休眠后执行重试，或抛出异常
   */
  void continueOrPropagate(RetryableException e);
  Retryer clone();
}
```

**2、** 默认不进行重试NEVER_RETRY；

```java
Retryer NEVER_RETRY = new Retryer() {
    @Override
    public void continueOrPropagate(RetryableException e) {
      //直接抛出异常
      throw e;
    }
    @Override
    public Retryer clone() {
      return this;
    }
  };
```

在FeignClientsConfiguration 中 定义了默认的重试策略

```java
	@Bean
	@ConditionalOnMissingBean
	public Retryer feignRetryer() {
		return Retryer.NEVER_RETRY;
	}
```

## 二、Default

feign 里定义的默认重试策略

```java
class Default implements Retryer {
	//最大重试次数
    private final int maxAttempts;
    //重试周期
    private final long period;
    //重试最大周期
    private final long maxPeriod;
    //当前重试次数
    int attempt;
    //休眠总时间
    long sleptForMillis;
	public void continueOrPropagate(RetryableException e) {
	  //达到了最大重试次数，抛异常
      if (attempt++ >= maxAttempts) {
        throw e;
      }
      long interval;
      if (e.retryAfter() != null) {
        //根据 RetryableException 里 retryAfter 计算时间间隔
        interval = e.retryAfter().getTime() - currentTimeMillis();
        //不能超过 maxPeriod
        if (interval > maxPeriod) {
          interval = maxPeriod;
        }
        //时间到了，直接返回进行重试
        if (interval < 0) {
          return;
        }
      } else {
        //计算时间间隔
        interval = nextMaxInterval();
      }
      try {
        //休眠
        Thread.sleep(interval);
      } catch (InterruptedException ignored) {
        Thread.currentThread().interrupt();
        throw e;
      }
      sleptForMillis += interval;
    }
    /**
     * Calculates the time interval to a retry attempt. <br>
     * The interval increases exponentially with each attempt, at a rate of nextInterval *= 1.5
     * (where 1.5 is the backoff factor), to the maximum interval.
     *
     * @return time in nanoseconds from now until the next attempt.
     */
    long nextMaxInterval() {
      //根据当前重试次数和重试周期计算时间间隔，重试次数越多，周期越长
      long interval = (long) (period * Math.pow(1.5, attempt - 1));
      //时间间隔不能超过最大重试周期
      return interval > maxPeriod ? maxPeriod : interval;
    }
}
```

注册Default

```java
@Configuration
public class CustomFeignClientsConfiguration {
    @Bean
    public Retryer feignRetryer() {
        return new Retryer.Default();
    }
}
```
