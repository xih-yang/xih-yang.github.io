# 23、SpringCloud Alibaba Sentinel（2）Sentinel 控制台安装
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/56.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
Sentinel 提供一个轻量级的开源控制台，它提供机器发现以及健康情况管理、监控（单机和集群），规则管理和推送的功能。本节将详细记录何如通过 Sentinel 控制台控制 Sentinel 客户端的各种行为。Sentinel 控制台的功能主要包括：流量控制、降级控制、热点配置、系统规则和授权规则等

## 1.下载 Sentinel

[传送门](https://github.com/alibaba/Sentinel/releases)

找到：1.7.1 版本：

点击 sentinel-dashboard-1.7.1.jar 完成下载：

## 2.启动 sentinel-dashboard

将下载好的 sentinel-dashboard-1.7.1.jar 复制到安装软件的目录里面。

使用：

java -jar sentinel-dashboard-1.7.1.jar

- 来启动一个 sentinel-dashboard 的实例。
- 启动成功后：

我们可以通过浏览器访问：

http://localhost:8080/

- 其中，用户名：sentinel
- 密码： sentinel
- 更多可用的启动参数配置：

```java
java -D 参数名=参数值 -jar xx.jar
java -jar xx.jar --参数名=参数值
```

- -Dsentinel.dashboard.auth.username=sentinel 用于指定控制台的登录用户名为 sentinel；
- -Dsentinel.dashboard.auth.password=123456 用于指定控制台的登录密码为 123456，如果省略这两个参数，默认用户和密码均为 sentinel；
- -Dserver.servlet.session.timeout=7200 用于指定 Spring Boot 服务端 session 的过期时间，如 7200 表示 7200 秒；60m 表示 60 分钟，默认为 30 分钟；
- -Dcsp.sentinel.dashboard.server=consoleIp:port 指定控制台地址和端口
