# 12、SpringCloud Alibaba Nacos（7）Nacos Discovery Starter 更多的配置项
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/45.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
配置项
Key
默认值
说明

服务端地址
spring.cloud.nacos.discovery.server-addr
无
Nacos Server 启动监听的 ip 地址和端口

服务名
spring.cloud.nacos.discovery.service
${spring.application.name}
给当前的服务命名

服务分组
spring.cloud.nacos.discovery.group
DEFAULT_GROUP
设置服务所处的分组

权重
spring.cloud.nacos.discovery.weight
1
取值范围 1 到 100，数值越大，权重越大

网卡名
spring.cloud.nacos.discovery.network-interface
无
当 IP 未配置时，注册的 IP 为此网卡所对应的 IP 地址，如果此项也未配置，则默认取第一块网卡的地址

注册的IP地址
spring.cloud.nacos.discovery.ip
无
优先级最高

注册的端口
spring.cloud.nacos.discovery.port
-1
默认情况下不用配置，会自动探测

命名空间
spring.cloud.nacos.discovery.namespace
无
常用场景之一是不同环境的注册的区分隔离，例如开发测试环境和生产环境的资源（如配置、服务）隔离等

AccessKey
spring.cloud.nacos.discovery.access-key
无
当要上阿里云时，阿里云上面的一个云账号名

SecretKey
spring.cloud.nacos.discovery.secret-key
无
当要上阿里云时，阿里云上面的一个云账号密码

Metadata
spring.cloud.nacos.discovery.metadata
无
使用 Map 格式配置，用户可以根据自己的需要自定义一些和服务相关的元数据信息

日志文件名
spring.cloud.nacos.discovery.log-name
无

集群
spring.cloud.nacos.discovery.cluster-name
DEFAULT
配置成 Nacos 集群名称

接入点
spring.cloud.nacos.discovery.enpoint
UTF-8
地域的某个服务的入口域名，通过此域名可以动态地拿到服务端地址

是否集成Ribbon
ribbon.nacos.enabled
true
一般都设置成 true 即可

是否开启 Nacos Watch
spring.cloud.nacos.discovery.watch.enabled
true
.enabled true 可以设置成 false 来关闭 watch
