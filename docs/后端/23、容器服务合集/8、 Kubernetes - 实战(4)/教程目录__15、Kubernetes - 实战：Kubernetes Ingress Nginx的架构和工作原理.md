# 15、Kubernetes - 实战：Kubernetes Ingress Nginx的架构和工作原理
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/15.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

在Kubernetes部署的服务POD只有内部空间的IP，把服务暴露出去可以通过vendor LB、NodePort等方法，这些方法的路由、权限等配置能力不足，整体的灵活性和可管理性不能满足复杂的服务对外暴露的需求；为此，Kubernetes提出的Ingress的概念可以继承原有的Cluster Service的概念，并且提供强大的配置和管理能力。

Kubernetes支持的Ingress控制器的具体情况可以参见如下页面：

[https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)

## 二、Ingress Nginx的架构

### 2.1 需要解决的问题

Ingress是用户将部署在Kubernetes上的业务对外进行标准化服务暴露的需求描述，而Ingress Nginx是Kubernetes Ingress概念的一个标准实现，需要解决的问题是将用户配置的Ingress转化成Nginx的配置文件并进行动态管理。Ingress Nginx的具体项目信息可以在这里看到：

[https://github.com/kubernetes/ingress-nginx](https://github.com/kubernetes/ingress-nginx)

### 2.2 整体架构

Ingress Nginx解决方案由如下模块组成：

- Ingress控制器(Nginx Proxy、选主、控制器逻辑)
- 业务定义的Ingress对象
- 后端service和POD endpoints

Kubernetes Ingress架构

Ingress在部署的时候可以功过部署多个replica提供HA，多个replica通过选主程序确定一个leader；之后leader controller读取Kubernetes定义的所有Ingress以及对应的后端Service以及Endpoints，通过分析集群的这些输入信息生产一个反应系统当前运行状态的model；controller使用这个model生成Nginx的配置文件，最后realod Nginx来使这些配置生效；后续Ingress Nginx可以通过域名和路径将外部用户请求proxy到内部的endpoints上面去。

### 2.3 控制面流程

Ingress在部署之后，最重要的任务就是根据集群关键元素的状态生成Nginx的配置文件，然后进行动态管理：

Ingress Nginx配置管理

在Ingress Ngixn的架构里面，控制面最关键的一个数据结构是Nginx model。当前，通过获取Ingress、Service、Endpoints、Secrets、Configmaps等Kubernetes Object，进行分析，得出一个反应当前系统运行状态的model；这个model由controller loop进行状态比较，比较之后生成Nginx的配置文件。

Controller在分析对比model的状态的时候：

- 如果model没有变化，则不进行任何Nginx操作
- 如果model变化的只有service的endpoints，则将endpoints变化交给Lua Handler进行处理，而不需要生成新的Nginx配置文件并reload Nginx
- 如果存在endpoints之外的变化，则需要生成新的Nginx配置文件并且reload Nginx

mode的如下一些变化会导致Nginx reload：

- 有新建的Ingress
- 已有的Ingress中添加了TLS部分
- 导致不止Upstream配置变化的Ingress annotation的更新
- Ingress中添加或者删除一个path
- 删除Ingress、Service或者Secret
- 一些出错的Service或者Secret之类状态变正常了
- 更新Secret

新生成的配置文件存在在Configmap里面，然后被各个Nginx POD引用。在生成配置的时候，会参考如下的一些基本规则和操作：

- 按照Ingress规则的时间戳，先处理时间戳较早的规则
- 如果多个Ingress定义来一样的host和path，则使用时间戳较早的规则
- 如果多个Ingress包含同样host的TLS配置，则使用时间戳较早的规则
- 如果多个Ingress包含影响Server block的annotation，则使用时间戳较早的规则
- 构建Nginx Server列表
- 构建NGINX Upstreams列表
- 如果多个Ingress定义来同一个host的不同path，这些path定义会被合并
- Annotations对Ingress里面的所有path生效
- 不同的Ingress可以定义不同的annotation并且不相互干扰

### 2.3 数据面流程

在Ingress Nginx部署的时候，会部署多个POD实例，然后Ingress Nginx还会部署一个NodePort Service，最后将部分部署了Ingress Nginx的node挂载到Vendor的LB上面，作为接入层。

在公有云Kubernetes部署的服务需要通过一系列的中间路径最终对外提供服务，从最外层一直到最末端的路径如下：

在上述路径中，需要具体说明的关键点如下：

- external ELB承载DNS域名并且进行HTTPS卸载
- Kong用于根据域名或者路径进行路由后端选择或者实施访问限制，Kong的路由目的可能是部署在ECS上的服务，也有可能是部署在Kubernetes上的服务
- Kubernetes集群部署了内部和外部两个ELB，分别对应内部和外部服务，外部ELB接受Kong转过来的外部请求，内部ELB接受来自内部VM或者POD的请求
- POD如果请求部署在Kubernetes的服务，可以选择使用内部域名，也可以选择使用Kubernetes的cluster service；但是对于某些使用gRPC协议的服务，使用ingress nginx或者cluster service都无法进行很好的负载均衡，需要自行制定服务发现和负载均衡
- 所有外部的请求域名类似于xxx.test.com，而内部请求的域名则类似于internal-xxx.test.com
- Kubernetes的ELB挂载nodes ig的worker节点，这些节点都部署了ingress nginx daemonset，用于接入对于集群中服务的访问请求
- 使用ingress或者cluster service方式访问POD中的服务，不可避免存在跨worker节点的traffic relay

### 2.4 Nginx是如何连接后端的

在配置Ingress的时候，我们只配置了后端服务的cluser service的名字，之后Nginx进行请求转发的时候，并不是直接连接cluser service的IP。因为在此之际，controller会根据cluser service的名字找到对应的所有endpoints，然后Nginx会直接向这些endpoints POD转发请求，更具体的信息可以在这里找到：[https://github.com/kubernetes-retired/contrib/issues/1140](https://github.com/kubernetes-retired/contrib/issues/1140)

这样的做主要原因还是在于直接连接后端POD可以给予ingress更及时的响应能力和更完善的proxy功能支持，增强Ingress的掌控能力，这个文章[《](https://medium.com/@edouard.kaiser/ingress-controller-forget-about-the-service-4ffece2dd6a9)[Ingress Controller: Forget about the service](https://medium.com/@edouard.kaiser/ingress-controller-forget-about-the-service-4ffece2dd6a9)[》](https://medium.com/@edouard.kaiser/ingress-controller-forget-about-the-service-4ffece2dd6a9)也进行了详尽的分析。

### 2.5 Ingress Nginx Controller是如何做HA的

在Ingress Controller启动的时候，会通过configmap “ingress-controller-leader-nginx”进行选主，leader controller会lock这个configmap：

> kubectl logs -n ingress-nginx nginx-ingress-controller-2nqlg | grep leader
>
> I0424 08:29:13.641151 8 leaderelection.go:242] attempting to acquire leader lease ingress-nginx/ingress-controller-leader-nginx...
>
> I0424 08:29:14.295593 8 leaderelection.go:252] successfully acquired lease ingress-nginx/ingress-controller-leader-nginx
>
> I0424 08:29:14.295656 8 status.go:86] new leader elected: nginx-ingress-controller-2nqlg

在configmap被leader lock之后，configmap里面会记录如下信息：

```java
{
  "kind": "ConfigMap",
  "apiVersion": "v1",
  "metadata": {
    "name": "ingress-controller-leader-nginx",
    "namespace": "ingress-nginx",
    "selfLink": "/api/v1/namespaces/ingress-nginx/configmaps/ingress-controller-leader-nginx",
    "uid": "da159fb2-789f-11ea-b093-fa163e23cb69",
    "resourceVersion": "9658136",
    "creationTimestamp": "2020-04-07T07:17:34Z",
    "annotations": {
      "control-plane.alpha.kubernetes.io/leader": "{"holderIdentity":"nginx-ingress-controller-2nqlg","leaseDurationSeconds":30,"acquireTime":"2020-04-09T08:52:01Z","renewTime":"2020-05-08T03:14:47Z","leaderTransitions":7}",
      "kubectl.kubernetes.io/last-applied-configuration": "{"apiVersion":"v1","kind":"ConfigMap","metadata":{"annotations":{"control-plane.alpha.kubernetes.io/leader":"{"holderIdentity":"nginx-ingress-controller-456xc","leaseDurationSeconds":30,"acquireTime":"2019-08-30T10:02:16Z","renewTime":"2020-04-03T12:55:37Z","leaderTransitions":4}"},"creationTimestamp":"2019-08-22T01:57:18Z","name":"ingress-controller-leader-nginx","namespace":"ingress-nginx"}}n"
    }
  }
}
```
