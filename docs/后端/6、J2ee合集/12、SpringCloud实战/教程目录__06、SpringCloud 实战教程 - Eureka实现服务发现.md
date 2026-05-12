# 06、SpringCloud 实战教程 - Eureka实现服务发现
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/2/6.html
- 分类：J2EE框架
- 分组：教程目录
## 一、服务发现简介

各个微服务在启动时，将自己的网络地址等信息注册到服务发现组件上(eureka,zookeeper,Consul),服务发现组件会存储这些信息。服务消费者会从服务发现组件查询服务提供者的网络地址，然后根据该地址调用服务提供者的接口。各个微服务与服务发现组件使用一定的机制来维持心跳，服务发现组件若发现有服务没有提供心跳，那么服务发现组件会将该服务剔除。微服务网络地址发生变更(例如实例增减或者IP端口发生变化等)，会重新注册到服务发现组件上，使用这种方式，可以避免因网络变化导致服务之间的通讯停止，服务消费者也无须人工的修改网络地址。简单的说就是对于注册到Eureka中的微服务，可以通过服务发现来获得该服务的信息。

## 二、服务发现的代码实例

我们需要在cloud-provide-payment提供者服务中的Controller中修改，如下图：

```java
//注入服务发现的注解
@Autowired
private DiscoveryClient discoveryClient;
 //获取服务信息
GetMapping("/payment/discovery")
public  Object discovery(){
   List<String> services = discoveryClient.getServices();
        for (String s : services){
            log.info("********注册到eureka中的服务中有:"+services);
        }
    List <ServiceInstance> instances = discoveryClient.getInstances("MCROSERVICE-PAYMENT");
        for (ServiceInstance s: instances) {
            log.info("当前服务的实例有"+s.getServiceId()+"\t"+s.getHost()+"\t"+s.getPort()+"\t"+s.getUri());
        }
    return this.discoveryClient;
}
```

在启动类上加上注解@EnableDiscoveryClient，如下图：

```java
@SpringBootApplication
@EnableEurekaClient
@EnableDiscoveryClient
public class PayMentMain {
    public static void main(String[] args) {
        SpringApplication.run(PayMentMain.class,args);
    }
}
```

然后启动该服务，访问[http://localhost:8001/payment/discovery](http://localhost:8001/payment/discovery)获取当前注册中心的服务信息，如下图：

可以看到客户端和服务端都有如下两个服务：mcroservice-order和mcroservice-payment

我们将信息通过日志打印到了控制台上，现在看一下控制台打印的信息，如下图：

我们可以看到当前注册中心有mcroservice-order和mcroservice-payment这两个服务。还可以看到mcroservice-payment服务下的实例的ip和端口还有uri。这个可以获取很多的服务信息。大家可以自己看一下，根据自己的需要获取。如下图：
