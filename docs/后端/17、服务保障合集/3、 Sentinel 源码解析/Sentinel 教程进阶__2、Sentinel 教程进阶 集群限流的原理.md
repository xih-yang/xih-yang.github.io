# 2、Sentinel 教程进阶 集群限流的原理
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/22.html
- 分类：服务保障
- 分组：Sentinel 教程进阶
## Sentinel是如何实现集群限流的？

当流量进来，调用到集成sentinel的服务后，sentinel会判断当前流控规则是否是集群模式的，如果是集群模式，就会向token-server请求token，根据token-server的响应决定是否限流？这样，就相当于将原来服务各自的限流规则统一到token-server。

**单机限流**

**集群限流**

除了单独部署token-server，我们还可以将token-server嵌入到服务中，让服务扮演token-server的角色（注意图中的token-server集成在A服务中）

## Sentinel Server的实现

我们已经知道，在集群限流的模式下，流量请求服务后，服务会向token-server请求token，那么token-server就控制了流量，根据集群限流规则进行限流。

既然是server，并且服务要过来请求token，那么肯定要暴露接口，sentinel通过启动一个netty服务来接收token请求，具体实现的模块是：**sentinel-cluster-server-default**

## 当我们在后台新增token-server确定后

sentinel后台会调用对应机器的Sentinel的api接口/setClusterMode 启动netty server，netty server接收客户端的token请求，进行集群限流。

## 当我们点击保存的时候会发生什么？

当我们新增token-server后的逻辑大致如上图所示，如果我们新增token-server时，没有选择token-client，那么只会执行上图的token-server启动阶段；如果制订了token-client，那么两个阶段都会执行。

从上图我们可以看出来，sentinel-dashboard通过调用微服务的sentinel-api来实现对sentinel-server、sentinel-client的操作。
