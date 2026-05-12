# 06、SpringCloud Alibaba Nacos（1）Nacos Discovery 简介
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/39.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
使用 SpringCloud Alibaba NacosDiscovery，可基于 Spring Cloud 的编程模型快速接入 Nacos 服务注册功能。

服务发现是微服务架构体系中最关键的组件之一。如果尝试着用手动的方式来给每一个客户端来配置所有服务提供者的服务列表是一件非常困难的事，而且也不利于服务的动态扩缩容。Nacos Discovery 可以帮助您将服务自动注册到 Nacos 服务端并且能够动态感知和刷新某个服务实例的服务列表。除此之外，Nacos Discovery 也将服务实例自身的一些元数据信息-例如 host，port, 健康检查 URL，主页等内容注册到 Nacos。
