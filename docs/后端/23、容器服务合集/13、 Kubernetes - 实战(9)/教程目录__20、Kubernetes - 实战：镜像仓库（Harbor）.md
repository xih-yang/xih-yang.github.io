# 20、Kubernetes - 实战：镜像仓库（Harbor）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/20.html
- 分类：容器服务
- 分组：教程目录
## Harbor

Harbor 是一个 CNCF 基金会托管的开源的可信的云原生 docker registry 项目，可以用于存储、签名、扫描镜像内容。

Harbor 最核心的功能就是给 docker registry 添加上一层权限保护的功能。并支持在 registry 之间复制镜像，用户管理、访问控制和活动审计等，在新版本中还添加了 Helm 仓库托管的支持。

## 安装 Harbor

Harbor 涉及的组件比较多，可以使用 Helm 来安装一个高可用版本的 Harbor。

在安装之前，有如下先决条件：

- Kubernetes cluster 1.20+
- Helm v3.2.0+

在Github 的 Helm 中有说明：

> https://github.com/goharbor/harbor-helm

当然，如果使用单独的 Docker 主机部署，那就另当别论了。

Harbor 的大部分组件都是无状态的，所以可以通过简单增加 Pod 的副本，保证组件尽量分布到多个节点上即可。

在存储层，则需要自行提供高可用的 PostgreSQL、Redis 集群来存储应用数据，以及存储镜像和 Helm Chart 的 PVC 或对象存储。

Harbor 主要包含以下组件：

- Proxy Cache：代理缓存，用于缓存 Docker Hub 的镜像，提高访问速度。
- Registry：镜像仓库，用于存储 Docker 镜像。
- Database：数据库，用于存储 Harbor 的元数据信息。
- Redis：缓存，用于存储 Harbor 的会话信息等。
- UI：Web 界面，用于管理 Harbor 服务。
- Log Collector：日志收集器，用于收集 Harbor 的日志信息并输出到指定的日志存储系统中。
- Notary：签名和验证服务，用于对镜像进行数字签名和验证。

通过Helm 安装：

```java
# 添加仓库
helm repo add harbor https://helm.goharbor.io
```

用户可以使用外部的 Pg 或者 Redis，配置可以通过官方的 values.yaml 进行覆盖：

> https://github.com/goharbor/harbor-helm/blob/master/values.yaml

核心配置项说明：

```java
expose:
  设置暴露服务的方式："ingress", "clusterIP", "nodePort" or "loadBalancer"
  type: ingress
  tls:
    SSL
    enabled: true
    ...
  ingress:
    hosts:
      Core 域名
      core: core.harbor.domain
      Notary 域名
      notary: notary.harbor.domain
    ...
    一般就是 nginx
    className: ""
    ...
# 暴露给外部访问的域名
externalURL: https://core.harbor.domain
...
# 数据持久化
persistence:
  enabled: true
  resourcePolicy: "keep"
  persistentVolumeClaim:
    registry:
      因为需要高可用，一般需要使用支持 ReadWriteMany 存储
      storageClass: ""
      accessMode: ReadWriteMany
      size: 5Gi
    jobservice:
      jobLog:
        storageClass: ""
        accessMode: ReadWriteMany
        size: 1Gi
    database:
      storageClass: ""
      accessMode: ReadWriteMany
      size: 1Gi
    redis:
      storageClass: ""
      accessMode: ReadWriteOnce
      size: 1Gi
    trivy:
      storageClass: ""
      accessMode: ReadWriteOnce
  imageChartStorage:
    各种存储介质
    type: filesystem
    filesystem:
# 日志级别
logLevel: info
# 默认密码
harborAdminPassword: "Harbor12345"
# 服务部署，主要修改副本数
nginx:
portal:
core:
jobservice:
registry:
trivy:
notary:
# 数据库可以自带也可以用外部的
database:
# Redis 可以自带也可以用外部的
redis:
# 监控
exporter:
metrics:
```

这里测试环境的配置 `harbor-values.yaml`：

```java
externalURL: https://harbor.k8s.io
harborAdminPassword: Harbor12345
logLevel: debug
expose:
  type: ingress
  tls:
    enabled: true
  ingress:
    className: nginx
    hosts:
      core: harbor.k8s.io
      notary: notary.k8s.io
persistence:
  enabled: true
  resourcePolicy: "keep"
  persistentVolumeClaim:
    registry:
      storageClass: "longhorn"
      accessMode: ReadWriteMany
      size: 2Gi
    chartmuseum:
      storageClass: "longhorn"
      accessMode: ReadWriteMany
      size: 2Gi
    jobservice:
      storageClass: "longhorn"
      accessMode: ReadWriteMany
      size: 1Gi
    trivy:
      storageClass: "longhorn"
      accessMode: ReadWriteMany
      size: 1Gi
# 默认为一个副本，如果要做高可用，只需要设置为 replicas >= 2 即可
portal:
  replicas: 1
core:
  replicas: 1
jobservice:
  replicas: 1
registry:
  replicas: 1
chartmuseum:
  replicas: 1
trivy:
  replicas: 1
notary:
  server:
    replicas: 1
  signer:
    replicas: 1
```

执行安装：

```java
helm install -f harbor-values.yaml -n devops harbor harbor/harbor
```

完成之后可以看到以下 Pod 和 Ingress：

同时会创建很多 Volume：

本地配置 hosts 访问测试：

账户密码为：`admin / Harbor12345`

其中library 是能公开访问的：

## 推送镜像

测试在containerd 中使用 Harbor 镜像仓库。

修改containerd 配置：

```java
sed -i -e '/registry.configs/a\' -e '        \[plugins."io.containerd.grpc.v1.cri".registry.configs."harbor.k8s.io".tls\] \
          insecure_skip_verify = true \
        \[plugins."io.containerd.grpc.v1.cri".registry.configs."harbor.k8s.io".auth\] \
          username = "admin" \
          password = "Harbor12345"' /etc/containerd/config.toml
```

配置效果：

注意使用 `nsecure_skip_verify = true` 忽略 SSL 证书校验。

完成后重启 Containerd：

```java
systemctl restart containerd
```

集群中的机器好需要配置 hosts 用于解析 harbor 地址：

```java
echo "192.168.2.100 harbor.k8s.io" >> /etc/hosts
echo "192.168.2.100 notary.k8s.io" >> /etc/hosts
```

测试登录：

```java
nerdctl login -u admin --insecure-registry harbor.k8s.io
```

注意需要使用 `--insecure-registry` 忽略证书，因为这里的证书是自签发的。

测试镜像：

```java
# 拉取镜像
nerdctl pull busybox:latest
# 给镜像打标签
nerdctl tag busybox:latest harbor.k8s.io/demo/busybox:1.0
# 推送镜像
nerdctl push --insecure-registry harbor.k8s.io/demo/busybox:1.0
```

此时直接推送会报错：

> FATA[0000] unexpected status from HEAD request to https://harbor.k8s.io/v2/demo/busybox/blobs/sha256:4b35f584bb4f862773e2b84b827795b6f01985c7bcebb0696a3eb66318a166a5: 401 Unauthorized

原因在于 Harbor 上没有 demo 这个项目，需要事先创建。

再次推送即可成功，也可以在其它机器上登录 Harbor 然后拉取镜像。

创建测试 Pod：

```java
apiVersion: v1
kind: Pod
metadata:
  name: harbor-registry-test
spec:
  containers:
  - name: demo
    image: harbor.k8s.io/demo/busybox:1.0
    args:
    - sleep
    - "3600"
```

如图所示：
