# 12、Nacos 教程 - 服务发现概念
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/12.html
- 分类：注册中心
- 分组：教程目录
## 前言

Nacos服务发现的概念，以及主流的服务发现中心。

## 什么是服务发现

在微服务架构中，整个系统会按职责能力划分为多个服务，通过服务之间协作来实现业务目标。这样我们的代码中免不了要进行服务间的远程调用，服务的消费方要调用服务的生产方，为了完成一次请求，消费方需要知道服务生产方的网络位置(ip和端口)。

我们的代码可以通过读取配置文件的方式读取服务生产方网络位置，如下 ：

我们通过Spring boot技术很容易实现

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

配置文件

```java
server.port=10001
```

**Service A(服务提供方)**

```java
@RestController
public class ConsumerController {
    @Value("${provider,address}")
    private String providerAddress;
    @GetMapping("/service")
    public String service(){
        RestTemplate restTemplate=new RestTemplate();
        String result=restTemplate.getForObject("http://"+providerAddress+"/service",String.class);
        return "consumer invoke | "+result;
    }
}
```

配置文件

```java
server.port=10002
#服务生产方的提供地址
provider,address=127.0.0.1:10001
```

访问接口 [http://127.0.0.1:10002/service](http://127.0.0.1:10002/service)

## 主流的服务发现与配置中心对比

目前市场上用于的比较多的服务发现中心有nacos，Eureka(已停止维护),Consul和Zookeeper。

从上面对比可以了解到，nacos作为服务发现中心，具备更多的功能支持项，且从长远来看nacos在以后的版本会支持SpringCloud +k8s的组合，填写二者的鸿沟，在两套体系下可以采用同一套服务发现和配置管理的解决方案，这将大大的简化使用和维护成本。另外，nacos计划实现 Service Mesh，也是未来微服务发展的趋势。

## Nacos四大特性

- **1. 服务发现和服务健康检查**

Nacos使服务更容易注册，并通过DNS或HTTP接口发现其它服务，Nacos还提供服务的实时健康检查，以防向不健康的主机或服务示例发送请求
- **2. 动态配置管理**

动态配置服务允许您在所有环境中以集中和动态的方式管理所有服务的配置。Nacos消除了在更新配置时重新部署应用程序，这使配置的更改更加高效和灵活。
- **3. 动态DNS服务**

Nacos提供基于DNS协议的服务发现能力，旨在支持异构语言的服务发现，支持将注册在Nacos上的服务以域名的方式暴露端点，让第三方应用方便的查阅及发现。
- **4. 服务和元数据管理**

Nacso能让您微服务平台建设的视角管理数据中心的所有服务及元数据，包括管理服务的描述，生命周期，服务的静态依赖分析，服务的健康状态，服务的流量管理，路由以及安全策略。

**1，3，4说明了服务发现的功能特征。**
