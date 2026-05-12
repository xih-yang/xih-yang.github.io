# 03、Eureka 工作流程
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-2/3.html
- 分类：注册中心
- 分组：Eureka 教程（版本 B）
**1、** EurekaServer启动成功，等待服务端注册在启动过程中如果配置了集群，集群之间定时通过Replicate同步注册表，每个EurekaServer都存在独立完整的服务注册表信息；

**2、** EurekaClient启动时根据配置的EurekaServer地址去注册中心注册服务；

**3、** EurekaClient会每30s向EurekaServer发送一次心跳请求，证明客户端服务正常；

**4、** 当EurekaServer90s内没有收到EurekaClient的心跳，注册中心则认为该节点失效，会注销该实例；

**5、** 单位时间内EurekaServer统计到有大量的EurekaClient没有上送心跳，则认为可能为网络异常，进入自我保护机制，不再剔除没有上送心跳的客户端；

**6、** 当EurekaClient心跳请求恢复正常之后，EurekaServer自动退出自我保护模式；

**7、** EurekaClient定时全量或者增量从注册中心获取服务注册表，并且将获取到的信息缓存到本地；

**8、** 服务调用时，EurekaClient会先从本地缓存找寻调取的服务如果获取不到，先从注册中心刷新注册表，再同步到本地缓存；

**9、** EurekaClient获取到目标服务器信息，发起服务调用；

**10、** EurekaClient程序关闭时向EurekaServer发送取消请求，EurekaServer将实例从注册表中删除；

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/zhangyingchengqi/category_10464123.html
