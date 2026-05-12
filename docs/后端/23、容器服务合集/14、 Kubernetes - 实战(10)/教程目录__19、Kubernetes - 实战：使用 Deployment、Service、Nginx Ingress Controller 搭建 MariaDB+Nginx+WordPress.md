# 19、Kubernetes - 实战：使用 Deployment、Service、Nginx Ingress Controller 搭建 MariaDB+Nginx+WordPress
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/19.html
- 分类：容器服务
- 分组：教程目录
## 1. 知识点回顾

`kubeadm` 使用容器技术封装了 `Kubernetes` 组件，所以只要节点上安装了容器运行时（`Docker`、`containerd` 等），它就可以自动从网上拉取镜像，然后以容器的方式运行组件，非常简单方便。

`Deployment` 是用来管理 `Pod` 的一种对象，它代表了运维工作中最常见的一类在线业务，在集群中部署应用的多个实例，而且可以很容易地增加或者减少实例数量，从容应对流量压力。

`Deployment` 的定义里有两个关键字段：一个是 `replicas`，它指定了实例的数量；另一个是 `selector`，它的作用是使用标签“筛选”出被 `Deployment` 管理的 `Pod`，这是一种非常灵活的关联机制，实现了 `API` 对象之间的松耦合。

`DaemonSet` 是另一种部署在线业务的方式，它很类似 `Deployment`，但会在集群里的每一个节点上运行一个 `Pod` 实例，类似 `Linux` 系统里的“守护进程”，适合日志、监控等类型的应用。

`DaemonSet` 能够任意部署 `Pod` 的关键概念是“污点”（`taint`）和“容忍度”（`toleration`）。`Node` 会有各种“污点”，而 `Pod` 可以使用“容忍度”来忽略“污点”，合理使用这两个概念就可以调整 `Pod` 在集群里的部署策略。

由`Deployment` 和 `DaemonSet` 部署的 `Pod`，在集群中处于“动态平衡”的状态，总数量保持恒定，但也有临时销毁重建的可能，所以 `IP` 地址是变化的，这就为微服务等应用架构带来了麻烦。

`Service` 是对 `Pod IP` 地址的抽象，它拥有一个固定的 `IP` 地址，再使用 `iptables` 规则把流量负载均衡到后面的 `Pod`，节点上的 `kube-proxy` 组件会实时维护被代理的 `Pod` 状态，保证 `Service` 只会转发给健康的 `Pod`。

`Service` 还基于 `DNS` 插件支持域名，所以客户端就不再需要关心 `Pod` 的具体情况，只要通过 `Service` 这个稳定的中间层，就能够访问到 `Pod` 提供的服务。

`Service` 是四层的负载均衡，但现在的绝大多数应用都是 `HTTP/HTTPS` 协议，要实现七层的负载均衡就要使用 `Ingress` 对象。

`Ingress` 定义了基于 `HTTP` 协议的路由规则，但要让规则生效，还需要 `Ingress Controller` 和 `Ingress Class` 来配合工作。

- Ingress Controller 是真正的集群入口，应用 Ingress 规则调度、分发流量，此外还能够扮演反向代理的角色，提供安全防护、TLS 卸载等更多功能。
- Ingress Class 是用来管理 Ingress 和 Ingress Controller 的概念，方便我们分组路由规则，降低维护成本。

不过`Ingress Controller` 本身也是一个 `Pod`，想要把服务暴露到集群外部还是要依靠 `Service`。`Service` 支持 `NodePort`、`LoadBalancer` 等方式，但 `NodePort` 的端口范围有限，`LoadBalancer` 又依赖于云服务厂商，都不是很灵活。

折中的办法是用少量 `NodePort` 暴露 `Ingress Controller`，用 `Ingress` 路由到内部服务，外部再用反向代理或者 `LoadBalancer` 把流量引进来。

## 2. WordPress 网站基本架构

既然我们已经掌握了 `Deployment`、`Service`、`Ingress` 这些 `Pod` 之上的概念，网站自然会有新变化，架构图我放在了这里：

这次的部署形式比起 `Docker`、`minikube` 又有了一些细微的差别，重点是我们已经完全舍弃了 `Docker`，把所有的应用都放在 `Kubernetes` 集群里运行，部署方式也不再是裸 `Pod`，而是使用 `Deployment`，稳定性大幅度提升。

原来的`Nginx` 的作用是反向代理，那么在 `Kubernetes` 里它就升级成了具有相同功能的 `Ingress Controller`。`WordPress` 原来只有一个实例，现在变成了两个实例（你也可以任意横向扩容），可用性也就因此提高了不少。而 `MariaDB` 数据库因为要保证数据的一致性，暂时还是一个实例。

还有，因为 `Kubernetes` 内置了服务发现机制 `Service`，我们再也不需要去手动查看 `Pod` 的 `IP` 地址了，只要为它们定义 `Service` 对象，然后使用域名就可以访问 `MariaDB`、`WordPress` 这些服务。

网站对外提供服务我选择了两种方式。

- 一种是让 WordPress 的 Service 对象以 NodePort 的方式直接对外暴露端口 30088，方便测试；
- 一种是给 Nginx Ingress Controller 添加 hostNetwork属性，直接使用节点上的端口号，类似 Docker 的 host 网络模式，好处是可以避开 NodePort 的端口范围限制。

## 3. 部署 MariaDB

先要用`ConfigMap` 定义数据库的环境变量，有 `DATABASE`、`USER`、`PASSWORD`、`ROOT_PASSWORD`：

```java
# maria-cm.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: maria-cm
data:
  DATABASE: 'db'
  USER: 'wp'
  PASSWORD: '123'
  ROOT_PASSWORD: '123'
```

然后我们需要把 `MariaDB` 由 `Pod` 改成 `Deployment` 的方式，`replicas` 设置成 1 个，`template` 里面的 `Pod` 部分没有任何变化，还是要用 `envFrom`把配置信息以环境变量的形式注入 `Pod`，相当于把 `Pod` 套了一个 `Deployment` 的“外壳”：

```java
# maria-dep.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: maria-dep
  name: maria-dep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: maria-dep
  template:
    metadata:
      labels:
        app: maria-dep
    spec:
      containers:
      - image: mariadb:10
        name: mariadb
        ports:
        - containerPort: 3306
        envFrom:
        - prefix: 'MARIADB_'
          configMapRef:
            name: maria-cm
```

我们还需要再为 `MariaDB` 定义一个`Service` 对象，映射端口 3306，让其他应用不再关心 `IP` 地址，直接用 `Service` 对象的名字来访问数据库服务：

```java
# maria-svc.yml
apiVersion: v1
kind: Service
metadata:
  labels:
    app: maria-dep
  name: maria-svc
spec:
  ports:
  - port: 3306
    protocol: TCP
    targetPort: 3306
  selector:
    app: maria-dep
```

因为这三个对象都是数据库相关的，所以可以在一个 `YAML` 文件里书写，对象之间用 `---` 分开，这样用 `kubectl apply` 就可以一次性创建好：

```java
kubectl apply -f mari-cm-dep-svc.yml
```

执行命令后，你应该用 `kubectl get` 查看对象是否创建成功，是否正常运行：

## 4. 部署 WordPress

因为刚才创建了 `MariaDB` 的 `Service`，所以在写 `ConfigMap` 配置的时候 `HOST`就不应该是 `IP` 地址了，而应该是 `DNS` 域名，也就是 `Service` 的名字 `maria-svc`，这点需要特别注意：

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: wp-cm
data:
  HOST: 'maria-svc'
  USER: 'wp'
  PASSWORD: '123'
  NAME: 'db'
```

`WordPress` 的 `Deployment` 写法和 `MariaDB` 也是一样的，给 `Pod` 套一个 `Deployment` 的“外壳”，`replicas` 设置成 2 个，用字段 `envFrom`配置环境变量：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: wp-dep
  name: wp-dep
spec:
  replicas: 2
  selector:
    matchLabels:
      app: wp-dep
  template:
    metadata:
      labels:
        app: wp-dep
    spec:
      containers:
      - image: wordpress:5
        name: wordpress
        ports:
        - containerPort: 80
        envFrom:
        - prefix: 'WORDPRESS_DB_'
          configMapRef:
            name: wp-cm
```

然后我们仍然要为 `WordPress` 创建 `Service` 对象，这里我使用了 `NodePort`类型，并且手工指定了端口号“30088”（必须在 30000~32767 之间）：

```java
apiVersion: v1
kind: Service
metadata:
  labels:
    app: wp-dep
  name: wp-svc
spec:
  ports:
  - name: http80
    port: 80
    protocol: TCP
    targetPort: 80
    nodePort: 30088
  selector:
    app: wp-dep
  type: NodePort
```

现在让我们用 `kubectl apply` 部署 `WordPress`：

```java
kubectl apply  -f  wp-cm-dep-svc.yml
```

这些对象的状态可以从下面的截图看出来：

因为`WordPress` 的 `Service` 对象是 `NodePort` 类型的，我们可以在集群的每个节点上访问 `WordPress` 服务。

比如一个节点的 IP 地址是“192.168.10.210”，那么你就在浏览器的地址栏里输入“http://192.168.10.210:30088”，其中的“30088”就是在 `Service` 里指定的节点端口号，然后就能够看到 `WordPress` 的安装界面了：

## 5. 部署 Nginx Ingress Controller

首先我们需要定义 `Ingress Class`，名字就叫 `wp-ink`，非常简单：

```java
# wp-ink.yml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: wp-ink
spec:
  controller: nginx.org/ingress-controller
```

然后用`kubectl create` 命令生成 `Ingress` 的样板文件，指定域名是 `wp.test`，后端 `Service` 是 `wp-svc:80`，`Ingress Class` 就是刚定义的 `wp-ink`：

```java
kubectl create ing wp-ing --rule="wp.test/=wp-svc:80" --class=wp-ink $out
```

得到的`Ingress YAML` 就是这样，注意路径类型我还是用的前缀匹配 `Prefix`：

```java
# wp-ing.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wp-ing
spec:
  ingressClassName: wp-ink
  rules:
  - host: wp.test
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: wp-svc
            port:
              number: 80
```

接下来就是最关键的 `Ingress Controller` 对象了，它仍然需要从 `Nginx` 项目的示例 `YAML` 修改而来，要改动名字、标签，还有参数里的 `Ingress Class`。

在之前讲基本架构的时候我说过了，这个 `Ingress Controller` 不使用 `Service`，而是给它的 `Pod` 加上一个特殊字段 `hostNetwork`，让 `Pod` 能够使用宿主机的网络，相当于另一种形式的 `NodePort`：

```java
# wp-kic-dep.yml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wp-kic-dep
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: wp-kic-dep
  template:
    metadata:
      labels:
        app: wp-kic-dep
    annotations:
      prometheus.io/scrape: "true"
      prometheus.io/port: "9113"
      prometheus.io/scheme: http
    spec:
      serviceAccountName: default
      use host network
      hostNetwork: true
      dnsPolicy: ClusterFirstWithHostNet
      containers:
     - image: nginx/nginx-ingress:2.2.0
      - image: nginx/nginx-ingress:2.2-alpine
        imagePullPolicy: IfNotPresent
        name: nginx-ingress
        ports:
        - name: http
          containerPort: 80
        - name: https
          containerPort: 443
        - name: readiness-port
          containerPort: 8081
        - name: prometheus
          containerPort: 9113
        readinessProbe:
          httpGet:
            path: /nginx-ready
            port: readiness-port
          periodSeconds: 1
        securityContext:
          allowPrivilegeEscalation: true
          runAsUser: 101nginx
          capabilities:
            drop:
            - ALL
            add:
            - NET_BIND_SERVICE
        env:
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        args:
          - -ingress-class=wp-ink
          - -health-status
          - -ready-status
          - -nginx-status
          - -enable-snippets
          - -nginx-configmaps=$(POD_NAMESPACE)/nginx-config
          - -default-server-tls-secret=$(POD_NAMESPACE)/default-server-secret
        - -v=3 Enables extensive logging. Useful for troubleshooting.
        - -report-ingress-status
        - -external-service=nginx-ingress
        - -enable-prometheus-metrics
        - -global-configuration=$(POD_NAMESPACE)/nginx-configuration
---
apiVersion: v1
kind: Service
metadata:
  name: wp-kic-svc
  namespace: default
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
    nodePort: 30080
  selector:
    app: wp-kic-dep
  type: NodePort
```

准备好`Ingress` 资源后，将上面 4 个 `yml`文件整合成一个 wp-ing-ingclass-ingcontroller.yml：

```java
kubectl  create namespace nginx-ingress
kubectl apply -f wp-ing-ingclass-ingcontroller.yml
```

> 备注：实践过程发现 nginx/nginx-ingress:2.2-alpine 这个镜像一直无法下载，待继续研究。

现在所有的应用都已经部署完毕，可以在集群外面访问网站来验证结果了

不过你要注意，`Ingress` 使用的是 `HTTP` 路由规则，用 `IP` 地址访问是无效的，所以在集群外的主机上必须能够识别我们的 `wp.test`域名，也就是说要把域名 `wp.test`解析到 `Ingress Controller` 所在的节点上。

如果你用的是 `Mac/Linux`，那就修改 `/etc/hosts` ，添加一条解析规则就行：

```java
cat /etc/hosts
192.168.10.210  wp.test
```

有了域名解析，在浏览器里你就不必使用 IP 地址，直接用域名 `wp.test`走 `Ingress Controller` 就能访问我们的 `WordPress` 网站了：

今天我们还在 `Kubernetes` 集群里再次搭建了 `WordPress` 网站，应用了新对象 `Deployment`、`Service`、`Ingress`，为网站增加了横向扩容、服务发现和七层负载均衡这三个非常重要的功能，提升了网站的稳定性和可用性，基本上解决了在“初级篇”所遇到的问题。

虽然这个网站离真正实用还差得比较远，但框架已经很完善了，你可以在这个基础上添加其他功能，比如创建证书 `Secret`、让 `Ingress` 支持 `HTTPS` 等等。

另外，我们保证了网站各项服务的高可用，但对于数据库 `MariaDB` 来说，虽然 `Deployment` 在发生故障时能够及时重启 `Pod`，新 `Pod` 却不会从旧 `Pod` 继承数据，之前网站的数据会彻底消失，这个后果是完全不可接受的。
