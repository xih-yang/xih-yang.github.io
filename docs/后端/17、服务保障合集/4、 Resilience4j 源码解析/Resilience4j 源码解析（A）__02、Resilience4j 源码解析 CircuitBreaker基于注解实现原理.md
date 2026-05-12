# 02、Resilience4j 源码解析 CircuitBreaker基于注解实现原理
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/2.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## @CircuitBreaker

> 原理是利用Spring Aop进行增强，@CircuitBreaker 声明在Class上，该Class所有public method会做熔断处理，声明在特定method上，只有该特定method才会做熔断处理。

## CircuitBreakerAspect

> CircuitBreaker利用CircuitBreakerAspect作为切面容器进行熔断处理，实现org.springframework.core.Ordered，保证Pointcut优先切入。

TheResilience4j Aspects order is following:

Retry > CircuitBreaker > RateLimiter > Bulkhead

### 构造方法

```java
//CircuitBreaker基于SpringBoot的自动配置
private final CircuitBreakerConfigurationProperties circuitBreakerProperties;
/*CircuitBreaker注册容器，只能管理被Spring管理的bean创建的CircuitBreaker 实例*/
private final CircuitBreakerRegistry circuitBreakerRegistry;
//CircuitBreaker切面扩展默认支持（RxJava2CircuitBreakerAspectExt、ReactorCircuitBreakerAspectExt）
private final List<CircuitBreakerAspectExt> circuitBreakerAspectExtList;
public CircuitBreakerAspect(CircuitBreakerConfigurationProperties backendMonitorPropertiesRegistry, CircuitBreakerRegistry circuitBreakerRegistry, @Autowired(required = false) List<CircuitBreakerAspectExt> circuitBreakerAspectExtList) {
    this.circuitBreakerProperties = backendMonitorPropertiesRegistry;
    this.circuitBreakerRegistry = circuitBreakerRegistry;
    this.circuitBreakerAspectExtList = circuitBreakerAspectExtList;
}
```

### 定义切入点

> 只能有circuitBreaker class或 circuitBreaker注解

```java
@Pointcut(value = "@within(circuitBreaker) || @annotation(circuitBreaker)", argNames = "circuitBreaker")
public void matchAnnotatedClassOrMethod(CircuitBreaker circuitBreaker) {
}
```

### 熔断处理@Around

> CircuitBreakerAspect -> circuitBreakerAroundAdvice() 方法是resilience4j利用Spring Aop做熔断处理逻辑处。

#### getBackendMonitoredAnnotation(proceedingJoinPoint)

> 根据切入目标Class，获取其@CircuitBreaker注解配置，主要为了circuitBreakerName

#### getOrCreateCircuitBreaker(methodName, backend)

> CircuitBreakerRegistry注册容器会根据circuitBreakerName从容器中取出circuitBreaker实例，顾名思义有则get，无则以circuitBreakerName及默认配置（前面章节讲到）创建circuitBreaker实例。

circuitBreakerAspectExt.handle是RxJava2、Reactor切面处理。

#### handleJoinPointCompletableFuture(proceedingJoinPoint, circuitBreaker);

> 处理返回类型为异步调用的熔断切入

#### defaultHandling(proceedingJoinPoint, circuitBreaker, methodName)

> 该方法默认处理返回类型为Java 类型的熔断切入点

```java
/**
 * the default Java types handling for the circuit breaker AOP
 */
private Object defaultHandling(ProceedingJoinPoint proceedingJoinPoint, io.github.resilience4j.circuitbreaker.CircuitBreaker circuitBreaker, String methodName) throws Throwable {
    //该方法会在后续章节着重介绍，java开发场景主要使用该段代码
    return circuitBreaker.executeCheckedSupplier(proceedingJoinPoint::proceed);
}
```

注意点：

（1）若不采用官方推荐默认Spring Boot自动配置方式配置CircuitBreaker，注意CircuitBreaker 实例必须被Spring 管理bean创建，否则会创建默认配置的CircuitBreaker 实例。

（2）注意@CircuitBreaker声明在Class和Method上的作用域。

（3）基于AOP实现的CircuitBreaker相关bean在CircuitBreakerConfiguration中配置。

（4）CircuitBreakerAspect会根据切入点method.returnType选择合适的处理策略。

下图为CircuitBreaker切面容器CircuitBreakerAspect处理熔断的大体流程图

CircuitBreakerAspect -> defaultHandling 默认处理Java返回类型的逻辑会在后续章节讲解。
