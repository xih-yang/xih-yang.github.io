# 41、SpringCloud Alibaba Dubbo（4）负载均衡调用测试
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/74.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.启动多个服务的提供者

修改服务提供者里面实现类的代码：

启动多个：

再次使用 Clt+D 复制一个：

启动这 2 个：

现在，共有 3 台同时运行：

查看 Nacos：

## 2.使用消费者负载均衡调用测试

访问：

http://localhost:8080/rpc

负载均衡测试成功
