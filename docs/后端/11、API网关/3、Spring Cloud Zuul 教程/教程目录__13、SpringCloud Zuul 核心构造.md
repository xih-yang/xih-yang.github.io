# 13、SpringCloud Zuul 核心构造
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/13.html
- 分类：API网关
- 分组：教程目录
SpringCloud Zuul提供了微服务系统中的网关功能，今天的目的就是来看一下Spring Cloud Zuul的基本构成和配置。

## 1、Zuul提供而来哪些网关功能

**1、** Zuul组件给微服务架构提供了统一的API入口，并且根据不同过滤器处理API，最后传到后端业务；

**2、** Zuul组件主要还是提供了过滤机制、动态路由的功能；

**3、** Zuul组件还提供了效验过滤、服务聚合、服务容错等等的功能；

**4、** 因为Zuul自动集成了Ribbon和Hystrix，所以Zuul组件生来就自带负载均衡和服务容错的能力；

## 2、Zuul的工作核心是什么？

如果问Zuul的工作核心是什么？那肯定会得到异口同声的答案，那就是**过滤器**，Zuul内部代码实现了多种过滤器类型，以支持网关工作。

## 3、Zuul提供了哪些类型的过滤器类型

**pre** : 可以在请求被路由之前被调用。

此过滤器类型更适用于身份认证的场景，当认证成功后，放进行下一步的操作。

**route** : 在路由请求时被调用。

适用于灰度发布场景，在将要访问路由的时候同时去做一些自定义的逻辑，以满足相应的奇奇怪怪的需求。

**post** : 在 **route** 和 **error** 过滤器之后被调用。

此类过滤器将请求路由到达具体的服务之后执行。比较适用于需要添加响应头，记录响应日志等应用场景。

**error** : 处理请求时发生错误时被调用。

在执行过程中发送错误时会进入 **error** 过滤器，可以用来统一记录错误信息，以便于后期解决问题。

## 4、Zuul有哪些重点配置

我们直接在Spring Cloud Zuul模块中引入相关jar包，当然需要使用@EnableZuulProxy注解修饰Application类了。

## 5、配置Zuul访问api路径：

```sh
zuul.routes.eureka-application-service.path=/api/**
复制代码
```

## 6、配置Zuul服务名称：

```sh
zuul.routes.eureka-application-service.serviceId=service-zuul-name
复制代码
```

## 7、配置可忽略服务：

```sh
zuul.ignored-services=service-1
复制代码
```

## 8、配置Zuul路由前缀路径：

```sh
zuul.prefix=/zuul
复制代码
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
