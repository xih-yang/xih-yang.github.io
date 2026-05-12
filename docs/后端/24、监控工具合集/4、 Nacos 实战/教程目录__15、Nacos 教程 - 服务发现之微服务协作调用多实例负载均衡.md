# 15、Nacos 教程 - 服务发现之微服务协作调用多实例负载均衡
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/15.html
- 分类：注册中心
- 分组：教程目录
## 前言

微服务的负载均衡。

代码已共享至

Gitee:[https://gitee.com/lengcz/nacosdiscovery01.git](https://gitee.com/lengcz/nacosdiscovery01.git)

Github:[https://github.com/lengcz/nacosdiscovery01.git](https://github.com/lengcz/nacosdiscovery01.git)

## 多实例负载均衡

根据[13、Nacos 教程 - 服务发现之Spring Cloud服务协作流程](/zhuanlan/registered/nacos/1/13.html)章节的例子，我们启动多个生产者实例。

当前生产者只有一个实例

### 1. 启动多个生产者实例

**1、** 点击EditConfigurations；

**2、** 创建两个快捷启动；

**3、** 通过这两个快捷方式启动；

**4、** 在nacos后台可以看到provider注册了两个实例；

### 2. 启动消费者实例

**1、** 启动消费者模块；

**2、** 访问接口[http://127.0.0.1:10002/service](http://127.0.0.1:10002/service)，会发现10003实例被访问了，如果再次请求，则发现10004实例被访问了经过多次请求，我们发现消费者依次交替调用两个实例，这说明它采用的是轮询的方式进行负载均衡调用；

### 3. 更换负载均衡器

**1、** 在**服务的消费方**的application.properties配置文件里配置负载均衡器；

```java
#配置负载均衡器
provider.ribbon.NFLoadBalancerRuleClassName=com.netflix.loadbalancer.RandomRule
```

**1、** 重启消费者服务实例，再次请求接口[http://127.0.0.1:10002/service](http://127.0.0.1:10002/service),负载均衡每次都是随机的，表明了我们当前的RandomRule规则是生效的；
