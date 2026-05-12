# 13、Nacos 教程 - 服务发现之Spring Cloud服务协作流程
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/13.html
- 分类：注册中心
- 分组：教程目录
## 前言

> Nacos服务发现快速入门。
>
> 本章，我们将演示如何使用Spring Cloud Alibaba Nacos Disconvery 为Spring Cloud应用程序与nacos的无缝集成。通过一些原生的Spring Cloud注解，我们可以快速来实现Spring Cloud 微服务的服务发现机制，并使用nacos server作为服务发现中心，统一管理所有微服务。

## 1. Spring Cloud 服务协作流程

现在，我们对Spring Cloud 内的一些组件还不了解，为了能够完全理解快速入门程序，我们需要学习一下内容。

Spring Cloud常见的集成方式是使用Feigin + Ribbon 技术来完成服务间调用及负载均衡的，如下图：

(1)在微服务启动时，会向服务发现中心上报自身实例新信息，这里Service B 包含了多个实例。

每个实例包含:ip，端口信息。

(2)微服务会定期从nacos server获取服务实例列表

(3)当Service A调用Service B时，Ribbon组件从本地服务实例列表中查找Service B的实例，如获取了多个实例如Instance1，Instance2。这时Ribbon会通过用户所配置的**负载均衡策略**从中选择一个实例。

(4)最终， Feign组件会通过Ribbon选择去的实例发送http请求。

采用Feigin+Ribbon的整合方式，是由Feign完成远程调用的整个流程。而Feigin集成了Ribbon，Feigin使用 Ribbon完成调用实例的负载均衡。

### 1.1 负载均衡的概念

在SpringCloud服务协议中流程中，Service A通过负载均衡调用Service B，下边来了解一下**负债均衡**

**负债均衡**就是将用户请求(流量)通过一定的策略，分摊在多个服务实例上执行，它是系统处理高并发、缓解网络压力和进行服务端扩容的重要手段之一。它分为**服务段负载均衡**和**客户端负债均衡**。

#### 1.1.1 服务端负债均衡

在负载均衡器中维护一个可用的服务实例列表，当客户请求来临时，负载均衡服务器按照某种配置好的规则(负载均衡算法)从可用服务实例清单中获取其一个去处理客户端的请求。这就是服务端负载均衡。

> 例如Nginx ,通过Nginx进行负载均衡，客户端发送请求到Nginx，Nginx通过负载均衡算法，在多个服务器之间选择一个进行访问。即在服务器端进行负载均衡算法分配。

#### 1.1.2 客户端服务负载均衡

> 接下讲Ribbon,就属于客户端负载均衡。在Ribbon客户端会有一个服务端实例列表，在发送请求前通过负载均衡算法选择一个服务实例，然后进行访问，这是客户端负载均衡。即在客户端就进行负载均衡算法分配。

**Ribbon**是一个客户端负载均衡器，责任是从一组实例列表中挑选合适的实例，如何挑选取决于**负载均衡策略**。

Ribbon核心组件IRule是负载均衡策略接口，它有一下实现:

- RoundRobinRule: 轮询，即按一定的顺序轮换获取实例的地址。
- RandomRule: 随机，即以随机的方式获取实例的地址。
- AvailabilityFilteringRule: 会先过滤掉由于多次访问故障而处于断路器跳闸状态的服务，以及并发的连接数超过阈值的服务，然后对剩余的服务列表按照轮询策略进行访问；
- WeightedResponseTimeRule: 根据平均响应时间计算所有服务的权重，响应时间越快，服务权重越大，被选中的机率越高；刚启动的时，如果统计信息不足，则使用RoundRobinRule策略，等统计信息足够时，会切换到本策略。
- RetryRule: 先按照RoundRobinRule的策略获取服务，如果获取服务失败，则在指定时间内会进行重试，获取可用的服务；
- BestAvailableRule: 会先过滤掉由于多次访问故障而处于断路器跳闸状态的服务，然后选择一个并发量最小的服务；
- **ZoneAvoidanceRule**: **默认规则**，复合判断server所在区域的性能和server的可用性选择服务器

可通过如下方式在springboot配置文件中指定负载均衡策略:

```java
#指定负载均衡策略器
account-service.ribbon.NFLoadBalancerRuleClassName=com.netflix.loadbalancer.RandomRule
```

account-service是调用的服务的名称，后面是固定的组成部分。

### 2. Feign 介绍

Fegin是Netflix开发的声明式，模板化的Http客户端，Feign可以帮助便捷优雅的调用 HTTP API。Feign 是伪装变形的意思，可以理解为将 HTTP报文请求方式伪装为简单的java接口调用方式。

**Service B(服务生产者)**

Service B 是服务的生产方，暴露/service服务地址，实现代码

```java
@RestController
public class ProviderController {
    @GetMapping("/service")
    public String service(){
        return "provider invoke";
    }
}
```

**Feign调用方式如下**:

(1)声明Feign客户端

```java
@FeignClient(value="serviceB")
public interface ServiceBAgent{
  @GetMapping(value="/service")
  public String service();
}
```

(2)业务调用

```java
@Autowired
private ServiceBAgent serviceBAgent;
#业务中调用
serviceBAgent.service();
```

根据上面的改造，我们只需要简单的添加Feign注解，不需要关心中间的底层调用过程，即可实现微服务之间的调用。

- 在声明Feign客户端后，Feign会根据@FeignClient注解使用java的动态代理技术生成代理类，在这里我们指定@FeignClient value为serviceB，则说明这个类的远程目标为spring cloud的服务名称为serivceB的微服务。
- serviceB的具体访问地址,Feign会交由Ribbon获取，若该服务有多个实例地址，Ribbon会采用指定的负载均衡策略选取实例。
- Feign兼容spring的web注解(如@GetMapping)，它会分析声明Feign客户端方法中的Spring注解，得出http请求method,参数信息以及返回信息结构。
- 当业务调用Feign客户端方法是，会调用代理类，根据以上分析结果，由代理类完成实例的参数封装、远程http请求，返回结果封装等信息。

关于依赖,在spring cloud中使用Feign，需要引入依赖。

```java
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

> Feign已经集成了Ribbon
>
> 还需要在spring cloud启动类中标注@EnableFeignClients,表示此项目开启Feign客户端:

```java
@EnableFeignClients
@EnableDiscoveryClient
@SpringBootApplication
public class Service02Bootstrap {
    public static void main(String[] args) {
        SpringApplication.run(Service02Bootstrap.class,args);
    }
}
```

总结：
通过上文，我们已经知道spring cloud的微服务是如何协作的，通过哪些组件的配合能够完成服务之间的协作。我们了解了什么是负载均衡，Feign用于服务间的http调用，Ribbon用于执行负载均衡算法选取访问实例，而Ribbon的实例列表来自spring cloud的服务发现中心。
