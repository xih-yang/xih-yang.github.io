# 08、SpringCloud 实战教程 - 集成Ribbon负载均衡器
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/8.html
- 分类：J2EE框架
- 分组：教程目录
## 一、Ribbon的简介

Ribbon是Neflix发布的开源项目，后由Spring Cloud开发团队封装于Spring Cloud中，可以让我们轻松地将面向服务的REST模版请求自动转换成客户端负载均衡的服务调用。功能是提供客户端的软件负载均衡算法和服务调用。Ribbon是一个基于HTTP和CP的客户端**负载均衡工具**，Spring Cloud Ribbon虽然只是一个工具类框架，它不像服务注册中心、配置中心、API网关那样需要独立部署，但是它几乎存在于每一个Spring Cloud构建的微服务和基础设施中。因为微服务间的调用，API网关的请求转发等内容，实际上都是通过Ribbon来实现的，包括后续我们将要介绍的Feign，它也是基于Ribbon实现的工具。所以，对Spring Cloud Ribbon的理解和使用，对于我们使用Spring Cloud来构建微服务非常重要。Ribbon客户端提供一系列的完善的配置项，如连接超时，重试等。简单的说，就是配置文件中列出Load Balancer（简称LB）后面所有的机器，Ribbon会自动的帮助你基于某种规则（如简单轮询，随机等）去连接这些机器。我们很容器使用Ribbon实现自定义负载均衡算法。

**什么是Load Balancer？**

简单的说就是将用户的请求平摊的分配到多个服务上，从而达到系统的HA（高可用）。常见的负载均衡的软件有：Nginx，LVS,硬件F5等。

**Ribbon本地负载均衡与Nginx服务端负载均衡的区别？**

Nginx是服务器的负载均衡，客户端所有的请求都会交给Nginx，然后由Nginx实现转发请求，即负载均衡是由服务端实现的。

Ribbon本地负载均衡，在调用服务接口的时候，会在注册中心上获取注册信息服务列表之后缓冲到JVM本地，从而在本地实现RPC远程服务调用技术。

**LB负载均衡分为哪两种?**

集中式LB，即在服务的消费方和提供方之间是有独立的LB设施（可以是硬件，如F5，也可以是软件，如Nginx），由该设施负责把访问请求通过某种策略转发至服务的提供方。

进程内LB，将LB逻辑集成于消费方，消费方从注册中心获知有哪些地址可用，然后自己再从这些地址中选择出一个 合适的服务器。Ribbon就属于进程内LB，它只是一个类库，集成于消费方进程，消费方通过它来获取到服务提供方的地址。

前边的文章，我们实现了消费者访问生产者集群轮询赋值均衡，具体的请[点击查看](/zhuanlan/j2ee/springcloud/2/5.html)。Ribbon就是实现服务端的负载均衡加RestTemplate的调用。是一个软负载均衡的客户端组件，他可以和其他所需请求的客户端结合使用，和Eureka结合只是其中的一个实例。

**二、代码实例**

由于spring-cloud-starter-netflix-eureka-client自带了spring-cloud-starter-ribbon引用，所以就不用引入ribbon的包了，如下图：

Ribbon的架构图，如下：

Ribbon在工作时分为两步：

第一步先选择EurekaServer，它优先选择在同一个区域内负载较少的Server。

第二步再根据用户指定的策略，在从Server取到服务注册列表中选择一个地址。

其中ribbon提供了多种策略，比如轮询、随机、根据时间响应时间加权等。

Ribbon的核心组件IRule

IRule算法的结图：

IRule的七大负载算法

更改负载算法，由我们的轮询算方法换为随机算法，需要自定义一个配置类，注意：这个自定义类不能放在@ComponentScan所扫描的当前包下以及包下，否则我们自定义的这个配置类会被所有的Ribbon客户端所共享，达不到特殊化定制的目的了。如下图：

新建MyselfRule配置类，变为随机，如下图：

```java
package com.buba.springclould.myrule;
import com.netflix.loadbalancer.IRule;
import com.netflix.loadbalancer.RoundRobinRule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
//自定义负载均衡路由规则类
@Configuration
public class MyselfRule {
    @Bean
    public IRule myRule() {
        // 定义为随机
        return new RoundRobinRule();
    }   
}
```

在主启动类上加@RibbonClient注解并进行配置，如下图：

```java
package com.buba.springclould.order;
import com.buba.springclould.myrule.MyselfRule;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.netflix.ribbon.RibbonClient;
@SpringBootApplication
@EnableEurekaClient
//name为生产者服务的服务名称  configuration为配置类的类名
@RibbonClient(name = "mcroservice-payment",configuration = MyselfRule.class)
public class OrderMain {
    public static void main(String[] args) {
        SpringApplication.run(OrderMain.class,args);
    }
}
```

那现在启动eureka7001和7002，然后启动服务端服务8001与8002，启动生产者服务80，访问路径[http://localhost/consumer/payment/get/1](http://localhost/consumer/payment/get/1)，由原先的轮询8001服务与8002服务来回切换，变为了8001服务与8002服务随机访问。

Ribbon负载均衡原理：

简单集成Ribbon的负载算法就就完成啦。so easy！
