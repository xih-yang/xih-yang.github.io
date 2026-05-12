# 11、Resilience4j 源码解析 Bulkhead源码之Bulkhead基于注解实现原理
- 来源：https://ddkk.com/zhuanlan/guarantee/resilience4j/11.html
- 分类：服务保障
- 分组：Resilience4j 源码解析（A）
## @Bulkhead

> 原理是利用Spring Aop进行增强，@Bulkhead声明在Class上，该Class所有public method会做隔离处理，声明在特定method上，只有该特定method才会做隔离处理。

## BulkheadAspect

> Bulkhead利用BulkheadAspect作为切面容器进行隔离处理，实现org.springframework.core.Ordered，实现Pointcut按优先级切入。

TheResilience4j Aspects order is following:

Retry > CircuitBreaker > RateLimiter > Bulkhead

#### 构造方法

```java
//Bulkhead基于SpringBoot的自动配置
private final BulkheadConfigurationProperties bulkheadConfigurationProperties;
/*Bulkhead注册容器，只能管理被Spring管理的bean创建的Bulkhead实例*/
private final BulkheadRegistry bulkheadRegistry;
//Bulkhead切面扩展默认支持（RxJava2BulkheadAspectExt、ReactorBulkheadAspectExt）
private final List<BulkheadAspectExt> bulkheadAspectExts;
public BulkheadAspect(BulkheadConfigurationProperties backendMonitorPropertiesRegistry, BulkheadRegistry bulkheadRegistry, @Autowired(required = false) List<BulkheadAspectExt> bulkheadAspectExts) {
    this.bulkheadConfigurationProperties = backendMonitorPropertiesRegistry;
    this.bulkheadRegistry = bulkheadRegistry;
    this.bulkheadAspectExts = bulkheadAspectExts;
}
```

#### 定义切入点

> 只能有Bulkhead class or Bulkhead annotation

```java
@Pointcut(value = "@within(Bulkhead) || @annotation(Bulkhead)", argNames = "Bulkhead")
public void matchAnnotatedClassOrMethod(Bulkhead Bulkhead) {
}
```

#### 熔断处理@Around

> BulkheadAspect-> bulkheadAroundAdvice() 方法是resilience4j利用Spring Aop做隔离处理逻辑处。

**getBackendMonitoredAnnotation**(ProceedingJoinPoint proceedingJoinPoint) 和 **getOrCreateBulkhead**(String methodName, String backend) 与CircuitBreakerAspect实现类似，不再叙述。

##### handleJoinPoint

> Bulkhead核心接口实现

注意点：

（1）若不采用官方推荐默认Spring Boot自动配置方式配置Bulkhead，注意Bulkhead实例必须被Spring 管理bean创建，否则会创建默认配置的Bulkhead实例。

（2）注意@Bulkhead声明在Class和Method上的作用域。

（3）基于AOP实现的Bulkhead相关bean在BulkheadConfiguration中配置。

（4）BulkheadAspect会根据切入点method.returnType选择合适的处理策略。

下图为Bulkhead切面容器BulkheadAspect处理熔断的大体流程图

BulkheadAspect::handleJoinPoint> Bulkhead::executeCheckedSupplier 默认处理Java类型的逻辑会在后续章节讲解。
