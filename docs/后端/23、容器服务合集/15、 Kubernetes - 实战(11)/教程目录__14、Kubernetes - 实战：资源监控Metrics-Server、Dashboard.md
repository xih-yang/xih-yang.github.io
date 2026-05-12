# 14、Kubernetes - 实战：资源监控Metrics-Server、Dashboard
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/14.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是Metrics-server？

Metrics-Server是集群核心监控数据的聚合器，用来替换之前的heapster。

> 容器相关的 Metrics 主要来自于 kubelet 内置的 cAdvisor服务，有了Metrics-Server之后，用户就可以通过标准的 Kubernetes API 来访问到这些监控数据。
>
>
> Metrics API 只可以查询当前的度量数据，并不保存历史数据。
> Metrics API URI 为 /apis/metrics.k8s.io/，在k8s.io/metrics 维护。
> 必须部署 metrics-server 才能使用该 API，metrics-server 通过调用Kubelet Summary API 获取数据。

Metrics Server 并不是 kube-apiserver 的一部分，而是通过 Aggregator 这种插件机制，在独立部署的情况下同 kube-apiserver 一起统一对外服务的。kube-aggregator 其实就是一个根据 URL 选择具体的 API 后端的代理服务器。

Metrics-server属于Core metrics(核心指标)，提供API metrics.k8s.io，仅提供Node和Pod的CPU和内存使用情况。而其他Custom Metrics(自定义指标)由Prometheus（普罗米修斯）等组件来完成

## 2、Metrics-server部署

镜像资源下载：[https://github.com/kubernetes-incubator/metrics-server](https://github.com/kubernetes-incubator/metrics-server)

yaml文件下载：[https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.3.6/components.yaml](https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.3.6/components.yaml)

把镜像导入本地，上传至仓库

修改components.yaml文件，将端口号从443变为4443，并修改镜像的路径

应用components.yaml文件，可以看到running了，但是没有就绪

存在问题

### 错误1

日志显示dial tcp: lookup server2 on 10.96.0.10:53: no such host

这是因为没有内网的DNS服务器，所以metrics-server无法解析节点名字。可以直接修改coredns的configmap，将各个节点的主机名加入到hosts中，这样所有Pod都可以从CoreDNS中解析各个节点的名字。

```java
kubectl edit configmap coredns -n kube-system
```

### 错误2

日志显示x509: certificate signed by unknown authority

显然缺少证书，Metric Server 支持一个参数 --kubelet-insecure-tls，可以跳过这一检查，然而官方也明确说了，这种方式不推荐生产使用。启用TLS Bootstrap 证书签发

```java
vim /var/lib/kubelet/config.yaml 	%注意这两步server2、server3、server4都需要执行
systemctl  restart kubelet
```

查看证书，现在是pending状态，对三个节点都进行授权，查看状态变为已授权

再次查看pod，成功ready

服务也正常

可以监控所有节点的cpu和mem资源

## 3、Dashboard部署

有了上面的命令行的监控，我感觉不够简单，如果可以图形化更好。Dashboard可以给用户提供一个可视化的 Web 界面来查看当前集群的各种信息。用户可以用 Kubernetes Dashboard 部署容器化的应用、监控应用的状态、执行故障排查任务以及管理 Kubernetes 各种资源。

下载镜像地址：[https://github.com/kubernetes/dashboard](https://github.com/kubernetes/dashboard)

首先在仓库创建新项目kubernetesui，方便管理镜像

导入镜像，上传镜像到仓库中

成功上传到仓库

下载部署文件地址：[https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-rc5/aio/deploy/recommended.yaml](https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-rc5/aio/deploy/recommended.yaml)

```java
mkdir dashboard
mv recommended.yaml kubernetes-dashboard/
cd kubernetes-dashboard/
```

修改recommended.yaml文件，把镜像路径修改正确

应用recommended.yaml文件

产生了新的命名空间和服务

产生了新的pod，新的控制器

```java
kubectl -n kubernetes-dashboard edit svc kubernetes-dashboard
```

开放服务的端口，用LoadBalancer方式，以便外部访问

成功修改

根据暴露的ip网页访问，网页测试：https://172.25.11.11，发现需要输入token才能认证

查看kubernetes-dashboard命名空间内的secrets，找到token

查看详细信息，把token复制，粘贴到网页中

成功进入，但是有报错信息，

这是因为kubernetes-dashboard这个全局角色中写的权限只有读，不可以写

默认dashboard对集群没有操作权限，需要授权

编辑rbac.yaml文件

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding		%全局角色绑定
metadata:
  name: kubernetes-dashboard-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin			%权限使用的是以前创建的cluster-admin，在里面有读写权限
subjects:
- kind: ServiceAccount
  name: kubernetes-dashboard	%作用对象是kubernetes-dashboard
  namespace: kubernetes-dashboard
```

`kubectl apply -f rbac.yaml`应用 rbac.yaml文件，可以看到权限是*，表示全开

现在网页就没有报错了，并且可以切换为中文

可以选择命名空间，查看pod、控制器、服务、cm、secrets等状态

查看控制器状态

## 4、Dashboard图形化控制k8s

使用图形化创建一个控制器

成功创建

缩放也很方便

扩容到三个副本

成功

也可以更新镜像，从v1换为v2

测试修改成功
