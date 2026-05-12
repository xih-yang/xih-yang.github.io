# 08、Resilience4j 源码解析 RateLimiter内部模块关系
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/8.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## @RateLimiter

> 原理是利用Spring Aop进行增强，@RateLimiter声明在Class上，该Class所有public method会做限流处理，声明在特定method上，只有该特定method才会做限流处理。

## RateLimiterConfiguration

> RateLimiter AOP相关bean初始化定义。

实例化了RateLimiterRegistry、RateLimiterAspect、RxJava2RateLimterAspectExt、ReactorRateLimiterAspectExt、EventConsumerRegistry。

相关配置信息在RateLimiterConfigurationProperties中。

## RateLimiterAspect

> RateLimiter利用RateLimiterAspect作为切面容器进行限流处理，实现org.springframework.core.Ordered，保证Pointcut优先切入。

TheResilience4j Aspects order is following:

**Retry > CircuitBreaker > RateLimiter > Bulkhead**

## 构造方法

```java
/*RateLimiter注册容器，只能管理被Spring管理的bean创建的RateLimiter实例*/
private final RateLimiterRegistry rateLimiterRegistry;
//RateLimiter基于SpringBoot的自动配置
private final RateLimiterConfigurationProperties properties;
//RateLimiter切面扩展默认支持（RxJava2RateLimterAspectExt、ReactorRateLimiterAspectExt）
private final List<RateLimiterAspectExt> rateLimiterAspectExtList;
public RateLimiterAspect(RateLimiterRegistry rateLimiterRegistry, RateLimiterConfigurationProperties properties, @Autowired(required = false) List<RateLimiterAspectExt> rateLimiterAspectExtList) {
    this.rateLimiterRegistry = rateLimiterRegistry;
    this.properties = properties;
    this.rateLimiterAspectExtList = rateLimiterAspectExtList;
}
```

## 定义切入点

> 定义了rateLimiter类或rateLimiter注解的类或方法。

```java
@Pointcut(value = "@within(rateLimiter) || @annotation(rateLimiter)", argNames = "rateLimiter")
public void matchAnnotatedClassOrMethod(RateLimiter rateLimiter) {
    // Method used as pointcut
}
```

## 限流处理@Around

> RateLimiterAspect -> rateLimiterAroundAdvice 方法是resilience4j利用Spring Aop做限流处理逻辑处。

注意点：

（1）RateLimiter可走官方推荐默认Spring Boot自动配置方式配置，或被Spring管理的注册容器RateLimiterRegistry 创建，否则会创建默认配置的RateLimiter实例。

（2）注意@RateLimiterRegistry 声明在Class和Method上的作用域。

（3）基于AOP实现的RateLimiterRegistry 相关bean在RateLimiterConfiguration中配置。

（4）RateLimiterAspect会根据切入点method.returnType选择合适的处理策略。

## 流程图

下图为RateLimiter切面容器RateLimiterAspect处理限流的大体流程图

RateLimiterAspect::handleJoinPoint -> rateLimiter.executeCheckedSupplier 其实现及RateLimiter配置介绍等会在后续章节介绍。
