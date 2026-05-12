# 13、SpringCloud Gateway 的工作原理
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/13.html
- 分类：API网关
- 分组：SpringCloud Gateway
Spring Cloud Gateway是Spring官方基于Spring5.0，Spring Boot2.0和Project Reactor等技术开发的网关，Spring Cloud Gateway旨在为微服务架构提供简单，有效且统一的API路由管理方式。Spring Cloud Gateway作为Spring Cloud 生态系统中的网关，目标是替代Netflix Zuul，其不仅提供统一的路由方式，并且还基于Filter链的方式提供了网关基本的功能，例如：安全，监控、埋点，限流等。

Spring Cloud Gateway 的核心处理流程如下图，Gateway的客户端回向Spring Cloud Gateway发起请求，请求首先会被**HttpWebHandlerAdapter进行提取组装成网关的上下文**，然后网关的上下文会传递到DispatcherHandler。DispatcherHandler是所有请求的分发处理器，**DispatcherHandler主要负责分发请求对应的处理器**，比如将请求分发到对应RoutePredicateHandlerMapping(路由断言处理器映射器）。**路由断言处理映射器主要用于路由的查找**，以及找到路由后返回对应的FilteringWebHandler。**FilteringWebHandler主要负责组装Filter链表**并**调用Filter执行一系列Filter处理**，然后把请求转到后端对应的代理服务处理，处理完毕后，将Response返回到Gateway客户端。

在Filter链中，通过虚线分割Filter的原因是，过滤器可以在转发请求之前处理或者接收到被代理服务的返回结果之后处理。**所有的Pre类型的Filter执行完毕之后，才会转发请求到被代理的服务处理。被代理的服务把所有请求完毕之后，才会执行Post类型的过滤器。**

博客摘录自《重新定义Spring Cloud实战》。
