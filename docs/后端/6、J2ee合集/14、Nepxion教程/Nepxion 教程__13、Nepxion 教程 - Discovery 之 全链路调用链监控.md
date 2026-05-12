# 13、Nepxion 教程 - Discovery 之 全链路调用链监控
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/13.html
- 分类：J2EE框架
- 分组：Nepxion 教程
在进行微服务调用的时候，为了系统的高可用性，不仅需要进行灰度发布验证服务的可用性。同时对于服务健康的监控也是很重要的一环。`Nepxion Discovery` 在这方面也有监控方面的集成，包含以下几个方面：

- 蓝绿灰度埋点调用链监控
- 全链路日志监控
- 全链路指标监控

## 1、蓝绿灰度埋点调用链监控

### 1.1 蓝绿灰度埋点调用链监控

关于[蓝绿灰度埋点调用链监控](http://nepxion.gitee.io/discovery/#/?id=%e5%85%a8%e9%93%be%e8%b7%af%e8%b0%83%e7%94%a8%e9%93%be%e7%9b%91%e6%8e%a7) 官网描述得很清楚，它内置蓝绿灰度埋点，包括如下：

```java
1. n-d-service-group - 服务所属组或者应用
2. n-d-service-type - 服务类型，分为网关端 | 服务端 | 控制台端 | 测试端，使用者只需要关注前两个即可
3. n-d-service-id - 服务ID
4. n-d-service-address - 服务地址，包括Host和Port
5. n-d-service-version - 服务版本
6. n-d-service-region - 服务所属区域
7. n-d-service-env - 服务所属环境
8. n-d-version - 版本路由值
9. n-d-region - 区域路由值
10. n-d-env - 环境路由值
11. n-d-address - 地址路由值
12. n-d-version-weight - 版本权重路由值
13. n-d-region-weight - 区域权重路由值
14. n-d-id-blacklist - 全局唯一ID屏蔽值
15. n-d-address-blacklist - IP地址和端口屏蔽值
```

- n-d-service 开头的埋点代表是服务自身的属性
- n-d- 开头的埋点是蓝绿灰度传递的策略路由值

因为`Nepxion Discovery` 集成了 `opentracing` 所以它还可以自定义外置埋点。它可以集成:

- 集成OpenTracing + Jaeger蓝绿灰度全链路监控
- 集成OpenTracing + SkyWalking蓝绿灰度全链路监控

它定义了 `StrategyMonitor` 接口用于集成 `opentracing` 监控，使用 `StrategyTracer` 接口用于 `io.opentelemetry.api.trace.Span`相关的操作。下面是`StrategyTracer` 接口的定义：

> StrategyTracer.java

```java
public interface StrategyTracer {
    void spanBuild();
    void spanOutput(Map<String, String> contextMap);
    void spanError(Throwable e);
    void spanFinish();
    String getTraceId();
    String getSpanId();
}
```

日志监控对于 Spring Cloud Gateway、Zuul 以及 微服务都是支持的，它们都会有具体的实现类去继承 `StrategyMonitor`。

> Spring Cloud Gateway

```java
public class DefaultGatewayStrategyMonitor extends StrategyMonitor implements GatewayStrategyMonitor {
    @Override
    public void monitor(ServerWebExchange exchange) {
        spanBuild();
        loggerOutput();
        loggerDebug();
        spanOutput(null);
    }
    @Override
    public void release(ServerWebExchange exchange) {
        loggerClear();
        spanFinish();
    }
}
```

> Zuul

```java
public class DefaultZuulStrategyMonitor extends StrategyMonitor implements ZuulStrategyMonitor {
    @Override
    public void monitor(RequestContext context) {
        spanBuild();
        loggerOutput();
        loggerDebug();
        spanOutput(null);
    }
    @Override
    public void release(RequestContext context) {
        loggerClear();
        spanFinish();
    }
}
```

> 微服务 Service

```java
public class DefaultServiceStrategyMonitor extends StrategyMonitor implements ServiceStrategyMonitor {
    @Value("${" + StrategyConstant.SPRING_APPLICATION_STRATEGY_TRACER_ENABLED + ":false}")
    protected Boolean tracerEnabled;
    @Value("${" + StrategyConstant.SPRING_APPLICATION_STRATEGY_TRACER_METHOD_CONTEXT_OUTPUT_ENABLED + ":false}")
    protected Boolean tracerMethodContextOutputEnabled;
    @Autowired(required = false)
    private List<ServiceStrategyMonitorAdapter> serviceStrategyMonitorAdapterList;
    @Override
    public void monitor(ServiceStrategyMonitorInterceptor interceptor, MethodInvocation invocation) {
        spanBuild();
        loggerOutput();
        loggerDebug();
    }
    @Override
    public void monitor(ServiceStrategyMonitorInterceptor interceptor, MethodInvocation invocation, Object returnValue) {
        spanOutput(createContextMap(interceptor, invocation, returnValue));
    }
    @Override
    public void error(ServiceStrategyMonitorInterceptor interceptor, MethodInvocation invocation, Throwable e) {
        spanError(e);
    }
    @Override
    public void release(ServiceStrategyMonitorInterceptor interceptor, MethodInvocation invocation) {
        loggerClear();
        spanFinish();
    }
    private Map<String, String> createContextMap(ServiceStrategyMonitorInterceptor interceptor, MethodInvocation invocation, Object returnValue) {
        if (!tracerEnabled) {
            return null;
        }
        Map<String, String> contextMap = new HashMap<String, String>();
        String className = interceptor.getMethod(invocation).getDeclaringClass().getName();
        String methodName = interceptor.getMethodName(invocation);
        contextMap.put("* " + DiscoveryConstant.CLASS, className);
        contextMap.put("* " + DiscoveryConstant.METHOD, methodName);
        if (tracerMethodContextOutputEnabled) {
            String[] methodParameterNames = interceptor.getMethodParameterNames(invocation);
            Object[] arguments = interceptor.getArguments(invocation);
            Map<String, Object> parameterMap = ClassUtil.getParameterMap(methodParameterNames, arguments);
            if (CollectionUtils.isNotEmpty(serviceStrategyMonitorAdapterList)) {
                for (ServiceStrategyMonitorAdapter serviceStrategyMonitorAdapter : serviceStrategyMonitorAdapterList) {
                    Map<String, String> customizationMap = serviceStrategyMonitorAdapter.getCustomizationMap(interceptor, invocation, parameterMap, returnValue);
                    for (Map.Entry<String, String> entry : customizationMap.entrySet()) {
                        contextMap.put("* " + entry.getKey(), entry.getValue());
                    }
                }
            }
        }
        return contextMap;
    }
}
```

### 1.2 蓝绿灰度埋点Debug辅助监控

Debug辅助监控只是通过普通的System.out.println方式输出，便于开发人员在IDE上调试，在生产环境下不建议开启

对于Debug辅助监控功能的开启和关闭，需要通过如下开关做控制

```java
# 启动和关闭Header传递的Debug日志打印，注意：每调用一次都会打印一次，会对性能有所影响，建议压测环境和生产环境关闭。缺失则默认为false
spring.application.strategy.rest.intercept.debug.enabled=true
# 启动和关闭Debug日志打印，注意：每调用一次都会打印一次，会对性能有所影响，建议压测环境和生产环境关闭。缺失则默认为false
spring.application.strategy.logger.debug.enabled=true
```

①网关端和服务端自身蓝绿灰度埋点Debug辅助监控

其实就是网关或者服务端调用 StrategyMonitor#loggerDebug 会进行下面日志的打印

```java
------------------ Logger Debug ------------------
trace-id=dade3982ae65e9e1
span-id=997e31021e9fce20
n-d-service-group=discovery-guide-group
n-d-service-type=service
n-d-service-id=discovery-guide-service-a
n-d-service-address=172.27.208.1:3001
n-d-service-version=1.0
n-d-service-region=dev
n-d-service-env=env1
n-d-service-zone=zone1
n-d-version={
     "discovery-guide-service-a":"1.0", "discovery-guide-service-b":"1.0"}
mobile=13812345678
user=
--------------------------------------------------
```

②服务端Feign或者RestTemplate拦截输入的蓝绿灰度埋点Debug辅助监控

```java
------- Feign Intercept Input Header Information -------
n-d-service-group=discovery-guide-group
n-d-version={
     "discovery-guide-service-a":"1.0", "discovery-guide-service-b":"1.0"}
n-d-service-type=gateway
n-d-service-id=discovery-guide-zuul
n-d-service-env=default
mobile=13812345678
n-d-service-region=default
n-d-service-zone=default
n-d-service-address=172.27.208.1:5002
n-d-service-version=1.0
--------------------------------------------------
```

上面的实现方式是 FeignStrategyInterceptor 或者 RestTemplateStrategyInterceptor 的调用它们的父类方法FeignStrategyInterceptor#interceptInputHeader实现的

③服务端Feign或者RestTemplate拦截输出的蓝绿灰度埋点Debug辅助监控

```java
------- Feign Intercept Output Header Information ------
mobile=[13812345678]
n-d-service-address=[172.27.208.1:3001]
n-d-service-env=[env1]
n-d-service-group=[discovery-guide-group]
n-d-service-id=[discovery-guide-service-a]
n-d-service-region=[dev]
n-d-service-type=[service]
n-d-service-version=[1.0]
n-d-service-zone=[zone1]
n-d-version=[{
     "discovery-guide-service-a":"1.0", "discovery-guide-service-b":"1.0"}]
--------------------------------------------------
```

上面的实现方式调用的是 FeignStrategyInterceptor#interceptOutputHeader 或者 RestTemplateStrategyInterceptor#interceptOutputHeader 实现的。

### 1.3 自定义埋点调用链监控

①自定义调用链上下文参数的创建，继承 `DefaultStrategyTracerAdapter`

```java
// 自定义调用链上下文参数的创建
// 对于getTraceId和getSpanId方法，在OpenTracing等调用链中间件引入的情况下，由调用链中间件决定，在这里定义不会起作用；在OpenTracing等调用链中间件未引入的情况下，在这里定义才有效，下面代码中表示从Http Header中获取，并全链路传递
// 对于getCustomizationMap方法，表示输出到调用链中的定制化业务参数，可以同时输出到日志和OpenTracing等调用链中间件，下面代码中表示从Http Header中获取，并全链路传递
public class MyStrategyTracerAdapter extends DefaultStrategyTracerAdapter {
    @Override
    public String getTraceId() {
        return StringUtils.isNotEmpty(strategyContextHolder.getHeader(DiscoveryConstant.TRACE_ID)) ? strategyContextHolder.getHeader(DiscoveryConstant.TRACE_ID) : StringUtils.EMPTY;
    }
    @Override
    public String getSpanId() {
        return StringUtils.isNotEmpty(strategyContextHolder.getHeader(DiscoveryConstant.SPAN_ID)) ? strategyContextHolder.getHeader(DiscoveryConstant.SPAN_ID) : StringUtils.EMPTY;
    }
    @Override
    public Map<String, String> getCustomizationMap() {
        Map<String, String> customizationMap = new HashMap<String, String>();
        customizationMap.put("mobile", StringUtils.isNotEmpty(strategyContextHolder.getHeader("mobile")) ? strategyContextHolder.getHeader("mobile") : StringUtils.EMPTY);
        customizationMap.put("user", StringUtils.isNotEmpty(strategyContextHolder.getHeader("user")) ? strategyContextHolder.getHeader("user") : StringUtils.EMPTY);
        return customizationMap;
    }
}
```

在配置类里@Bean方式进行调用链类创建，覆盖框架内置的调用链适配器

```java
@Bean
public StrategyTracerAdapter strategyTracerAdapter() {
    return new MyStrategyTracerAdapter();
}
```

②自定义类方法上入参和出参输出到调用链，继承ServiceStrategyMonitorAdapter

```java
// 自定义类方法上入参和出参输出到调用链
// parameterMap格式：
// key为入参名
// value为入参值
public class MyServiceStrategyMonitorAdapter implements ServiceStrategyMonitorAdapter {
    @Override
    public Map<String, String> getCustomizationMap(ServiceStrategyMonitorInterceptor interceptor, MethodInvocation invocation, Map<String, Object> parameterMap, Object returnValue) {
        Map<String, String> customizationMap = new HashMap<String, String>();
        customizationMap.put(DiscoveryConstant.PARAMETER, parameterMap.toString());
        customizationMap.put(DiscoveryConstant.RETURN, returnValue != null ? returnValue.toString() : null);
        return customizationMap;
    }
}
```

在配置类里@Bean方式进行创建

```java
@Bean
public ServiceStrategyMonitorAdapter serviceStrategyMonitorAdapter() {
    return new MyServiceStrategyMonitorAdapter();
}
```

③业务方法上获取TraceId和SpanId

```java
public class MyClass {
    @Autowired
    private StrategyMonitorContext strategyMonitorContext;
    public void doXXX() {
        String traceId = strategyMonitorContext.getTraceId();
        String spanId = strategyMonitorContext.getSpanId();
        ...
    }
}
```

## 2、全链路日志监控

蓝绿灰度埋点日志输出，需要使用者配置logback.xml或者log4j.xml日志格式，参考如下

```java
<!-- Logback configuration. See http://logback.qos.ch/manual/index.html -->
<configuration scan="true" scanPeriod="10 seconds">
    <!-- Simple file output -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <!-- encoder defaults to ch.qos.logback.classic.encoder.PatternLayoutEncoder -->
        <encoder>
            <pattern>discovery %date %level [%thread] [%X{
     trace-id}] [%X{
     span-id}] [%X{
     n-d-service-group}] [%X{
     n-d-service-type}] [%X{
     n-d-service-app-id}] [%X{
     n-d-service-id}] [%X{
     n-d-service-address}] [%X{
     n-d-service-version}] [%X{
     n-d-service-region}] [%X{
     n-d-service-env}] [%X{
     n-d-service-zone}] [%X{
     mobile}] [%X{
     user}] %logger{
     10} [%file:%line] - %msg%n</pattern>
            <charset>UTF-8</charset>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>log/discovery-%d{
     yyyy-MM-dd}.%i.log</fileNamePattern>
            <maxFileSize>50MB</maxFileSize>
        </rollingPolicy>
        <filter class="ch.qos.logback.classic.filter.ThresholdFilter">
            <level>INFO</level>
        </filter>
        <!-- Safely log to the same file from multiple JVMs. Degrades performance! -->
        <prudent>true</prudent>
    </appender>
    <appender name="FILE_ASYNC" class="ch.qos.logback.classic.AsyncAppender">
        <discardingThreshold>0</discardingThreshold>
        <queueSize>512</queueSize>
        <appender-ref ref="FILE" />
    </appender>
    <!-- Console output -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <!-- encoder defaults to ch.qos.logback.classic.encoder.PatternLayoutEncoder -->
        <encoder>
            <pattern>discovery %date %level [%thread] [%X{
     trace-id}] [%X{
     span-id}] [%X{
     n-d-service-group}] [%X{
     n-d-service-type}] [%X{
     n-d-service-app-id}] [%X{
     n-d-service-id}] [%X{
     n-d-service-address}] [%X{
     n-d-service-version}] [%X{
     n-d-service-region}] [%X{
     n-d-service-env}] [%X{
     n-d-service-zone}] [%X{
     mobile}] [%X{
     user}] %logger{
     10} [%file:%line] - %msg%n</pattern>
            <charset>UTF-8</charset>
        </encoder>
        <!-- Only log level WARN and above -->
        <filter class="ch.qos.logback.classic.filter.ThresholdFilter">
            <level>INFO</level>
        </filter>
    </appender>
    <!-- For loggers in the these namespaces, log at all levels. -->
    <logger name="pedestal" level="ALL" />
    <logger name="hammock-cafe" level="ALL" />
    <logger name="user" level="ALL" />
    <root level="INFO">
        <!-- <appender-ref ref="FILE_ASYNC" /> -->
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

日志格式打印如下：

在这里插入代码片

## 3、全链路指标监控

### 3.1 Prometheus监控

### 3.2 Grafana监控

### 3.3 Spring-Boot-Admin监控

参考地址：

- [Nepxion Discovery 全链路监控](http://nepxion.gitee.io/discovery/#/?id=%e5%85%a8%e9%93%be%e8%b7%af%e7%9b%91%e6%8e%a7)
