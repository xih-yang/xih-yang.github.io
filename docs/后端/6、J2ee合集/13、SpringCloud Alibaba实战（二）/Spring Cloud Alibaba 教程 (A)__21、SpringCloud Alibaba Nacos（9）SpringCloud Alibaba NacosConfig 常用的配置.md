# 21、SpringCloud Alibaba Nacos（9）SpringCloud Alibaba NacosConfig 常用的配置
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/54.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
配置项
key
默认值
说明

服务端地址
spring.cloud.nacos.config.server-addr

DataId 前缀
spring.cloud.nacos.config.prefix

spring.application.name

dataID 后缀及内容文件格式
spring.cloud.nacos.config.file-extension
properties
dataId 的后缀，同时也是配置内容的文件格式，目前只支持 properties

配置内容的编码方式
spring.cloud.nacos.config.encode
UTF-8
配置的编码

获取配置的超时时间
spring.cloud.nacos.config.timeout
3000
单位为 ms

配置的命名空间
spring.cloud.nacos.config.namespace

常用场景之一是不同环境的配置的区分隔离，例如开发测试环境和生产环境的资源隔离等。

AccessKey
spring.cloud.nacos.config.access-key

SecretKey
spring.cloud.nacos.config.secret-key

相对路径
spring.cloud.nacos.config.context-path

服务端 API 的相对路径

接入点
spring.cloud.nacos.config.endpoint

地域的某个服务的入口域名， 通过此域名可以动态地拿到服务端地址

是否开启监听和自动刷新
spring.cloud.nacos.config.refresh.enabled
true
