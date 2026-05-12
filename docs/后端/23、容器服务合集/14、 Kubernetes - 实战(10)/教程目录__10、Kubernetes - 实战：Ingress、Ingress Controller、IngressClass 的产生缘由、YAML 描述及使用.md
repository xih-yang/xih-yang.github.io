# 10、Kubernetes - 实战：Ingress、Ingress Controller、IngressClass 的产生缘由、YAML 描述及使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/10.html
- 分类：容器服务
- 分组：教程目录
上节我们学习了 `Service` 对象，它是 `Kubernetes` 内置的负载均衡机制，使用静态 `IP` 地址代理动态变化的 `Pod`，支持域名访问和服务发现，是微服务架构必需的基础设施。

`Service` 很有用，但也只能说是“基础设施”，它对网络流量的管理方案还是太简单，离复杂的现代应用架构需求还有很大的差距，所以 `Kubernetes` 就在 `Service` 之上又提出了一个新的概念：`Ingress`。

## 1. 为什么要有 Ingress

我们知道了 `Service` 的功能和运行机制，它本质上就是一个由 `kube-proxy` 控制的四层负载均衡，在 `TCP/IP` 协议栈上转发流量。

但在四层上的负载均衡功能还是太有限了，只能够依据 `IP` 地址和端口号做一些简单的判断和组合，而我们现在的绝大多数应用都是跑在七层的 `HTTP/HTTPS` 协议上的，有更多的高级路由条件，比如主机名、URI、请求头、证书等等，而这些在 `TCP/IP` 网络栈里是根本看不见的。

`Service` 还有一个缺点，它比较适合代理集群内部的服务。如果想要把服务暴露到集群外部，就只能使用 `NodePort` 或者 `LoadBalancer` 这两种方式，而它们都缺乏足够的灵活性，难以管控，这就导致了一种很无奈的局面：我们的服务空有一身本领，却没有合适的机会走出去大展拳脚。

该怎么解决这个问题呢？

`Kubernetes` 还是沿用了 `Service` 的思路，既然 `Service` 是四层的负载均衡，那么我再引入一个新的 `API` 对象，在七层上做负载均衡是不是就可以了呢？

不过除了七层负载均衡，这个对象还应该承担更多的职责，也就是作为流量的总入口，统管集群的进出口数据，“扇入”“扇出”流量（也就是我们常说的“南北向”），让外部用户能够安全、顺畅、便捷地访问内部服务

所以，这个 `API` 对象就顺理成章地被命名为 `Ingress`，意思就是集群内外边界上的入口。

## 2. 为什么要有 Ingress Controller

`Ingress` 可以说是在七层上另一种形式的 `Service`，它同样会代理一些后端的 `Pod`，也有一些路由规则来定义流量应该如何分配、转发，只不过这些规则都使用的是 `HTTP/HTTPS` 协议。

`Service` 本身是没有服务能力的，它只是一些 `iptables` 规则，真正配置、应用这些规则的实际上是节点里的 `kube-proxy` 组件。如果没有 `kube-proxy`，`Service` 定义得再完善也没有用。

同样的，`Ingress` 也只是一些 `HTTP` 路由规则的集合，相当于一份静态的描述文件，真正要把这些规则在集群里实施运行，还需要有另外一个东西，这就是 `Ingress Controller`，它的作用就相当于 `Service` 的 `kube-proxy`，能够读取、应用 `Ingress`规则，处理、调度流量。

按理来说，`Kubernetes` 应该把 `Ingress Controller` 内置实现，作为基础设施的一部分，就像 `kube-proxy` 一样。

不过`Ingress Controller` 要做的事情太多，与上层业务联系太密切，所以 `Kubernetes` 把 `Ingress Controller` 的实现交给了社区，任何人都可以开发 `Ingress Controller`，只要遵守 `Ingress` 规则就好。这就造成了 `Ingress Controller`“百花齐放”的盛况。

由于`Ingress Controller` 把守了集群流量的关键入口，掌握了它就拥有了控制集群应用的“话语权”，所以众多公司纷纷入场，精心打造自己的 `Ingress Controller`，意图在 `Kubernetes` 流量进出管理这个领域占有一席之地。

这些实现中最著名的，就是老牌的反向代理和负载均衡软件 `Nginx` 了。从 `Ingress Controller` 的描述上我们也可以看到，`HTTP` 层面的流量管理、安全控制等功能其实就是经典的反向代理，而 `Nginx` 则是其中稳定性最好、性能最高的产品，所以它也理所当然成为了 `Kubernetes` 里应用得最广泛的 `Ingress Controller`。

不过，因为 `Nginx` 是开源的，谁都可以基于源码做二次开发，所以它又有很多的变种，比如

- 社区的 Kubernetes Ingress Controller（[https://github.com/kubernetes/ingress-nginx](https://github.com/kubernetes/ingress-nginx)）；
- Nginx 公司自己的 Nginx Ingress Controller（[https://github.com/nginxinc/kubernetes-ingress](https://github.com/nginxinc/kubernetes-ingress)）；
- 基于 OpenResty 的 Kong Ingress Controller（[https://github.com/Kong/kubernetes-ingress-controller](https://github.com/Kong/kubernetes-ingress-controller)）等等。

根据`Docker Hub` 上的统计，`Nginx` 公司的开发实现是下载量最多的 `Ingress Controller`，所以我将以它为例，讲解 `Ingress` 和 `Ingress Controller` 的用法。

下面的这张图就来自 `Nginx` 官网，比较清楚地展示了 `Ingress Controller` 在 `Kubernetes` 集群里的地位：

## 3. 为什么要有 IngressClass

那么到现在，有了 `Ingress` 和 `Ingress Controller`，我们是不是就可以完美地管理集群的进出流量了呢？

最初`Kubernetes` 也是这么想的，一个集群里有一个 `Ingress Controller`，再给它配上许多不同的 `Ingress` 规则，应该就可以解决请求的路由和分发问题了。

但随着`Ingress` 在实践中的大量应用，很多用户发现这种用法会带来一些问题，比如：

- 由于某些原因，项目组需要引入不同的 Ingress Controller，但 Kubernetes 不允许这样做；
- Ingress 规则太多，都交给一个 Ingress Controller 处理会让它不堪重负；
- 多个 Ingress 对象没有很好的逻辑分组方式，管理和维护成本很高；
- 集群里有不同的租户，他们对 Ingress 的需求差异很大甚至有冲突，无法部署在同一个 Ingress Controller 上。

所以，`Kubernetes` 就又提出了一个 `Ingress Class` 的概念，让它插在 `Ingress` 和 `Ingress Controller` 中间，作为流量规则和控制器的协调人，解除了 `Ingress` 和 `Ingress Controller` 的强绑定关系。

现在，`Kubernetes` 用户可以转向管理 `Ingress Class`，用它来定义不同的业务逻辑分组，简化 `Ingress` 规则的复杂度。比如说，我们可以用 `Class A` 处理博客流量、`Class B` 处理短视频流量、`Class C` 处理购物流量。

这些`Ingress` 和 `Ingress Controller` 彼此独立，不会发生冲突，所以上面的那些问题也就随着 `Ingress Class` 的引入迎刃而解了。

## 4. 使用 YAML 描述 Ingress/Ingress Class

和之前学习 `Deployment`、`Service` 对象一样，首先应当用命令 `kubectl api-resources` 查看它们的基本信息，输出列在这里了：

你可以看到，`Ingress` 和 `Ingress Class` 的 `apiVersion` 都是“networking.k8s.io/v1”，而且 `Ingress` 有一个简写 `ing`，但 `Ingress Controller` 怎么找不到呢？

这是因为 `Ingress Controller` 和其他两个对象不太一样，它不只是描述文件，是一个要实际干活、处理流量的应用程序，而应用程序在 `Kubernetes` 里早就有对象来管理了，那就是 `Deployment` 和 `DaemonSet`，所以我们只需要再学习 `Ingress` 和 `Ingress Class` 的的用法就可以了。

先看`Ingress`。

`Ingress` 也是可以使用 `kubectl create` 来创建样板文件的，和 `Service` 类似，它也需要用两个附加参数：

- --class，指定 Ingress 从属的 Ingress Class 对象。
- --rule，指定路由规则，基本形式是 URI=Service，也就是说是访问 HTTP 路径就转发到对应的 Service 对象，再由 Service 对象转发给后端的 Pod。

好，现在我们就执行命令，看看 `Ingress` 到底长什么样：

```java
export out="--dry-run=client -o yaml"
kubectl create ing ngx-ing --rule="ngx.test/=ngx-svc:80" --class=ngx-ink $out
```

```java
# ngx-ing.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ngx-ing
spec:
  ingressClassName: ngx-ink
  rules:
  - host: ngx.test
    http:
      paths:
      - path: /
        pathType: Exact
        backend:
          service:
            name: ngx-svc
            port:
              number: 80
```

在这份`Ingress` 的 `YAML` 里，有两个关键字段： `ingressClassName`和 `rules`，分别对应了命令行参数，含义还是比较好理解的。

只是`rules`的格式比较复杂，嵌套层次很深。不过仔细点看就会发现它是把路由规则拆散了，有 `host` 和 `http path`，在 `path` 里又指定了路径的匹配方式，可以是精确匹配（`Exact`）或者是前缀匹配（`Prefix`），再用 `backend` 来指定转发的目标 `Service` 对象。

不过我个人觉得，`Ingress YAML` 里的描述还不如 `kubectl create` 命令行里的 `--rule` 参数来得直观易懂，而且 `YAML` 里的字段太多也很容易弄错，建议你还是让 `kubectl` 来自动生成规则，然后再略作修改比较好。

有了`Ingress` 对象，那么与它关联的 `Ingress Class` 是什么样的呢？

其实`Ingress Class` 本身并没有什么实际的功能，只是起到联系 `Ingress` 和 `Ingress Controller` 的作用，所以它的定义非常简单，在 `spec`里只有一个必需的字段 `controller`，表示要使用哪个 `Ingress Controller`，具体的名字就要看实现文档了。

比如，如果我要用 `Nginx` 开发的 `Ingress Controller`，那么就要用名字 `nginx.org/ingress-controller`：

```java
# ngx-cls.yml 
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: ngx-ink
spec:
  controller: nginx.org/ingress-controller
```

```java
# ngx-svc.yml
apiVersion: v1
kind: Service
metadata:
  name: ngx-svc
spec:
  selector:
    app: ngx-dep
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
```

```java
# ngx-dep.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngx-dep
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ngx-dep
  template:
    metadata:
      labels:
        app: ngx-dep
    spec:
      volumes:
      - name: ngx-conf-vol
        configMap:
          name: ngx-conf
      containers:
      - image: nginx:alpine
        name: nginx
        ports:
        - containerPort: 80
        volumeMounts:
        - mountPath: /etc/nginx/conf.d
          name: ngx-conf-vol
```

`Ingress` 和 `Service`、`Ingress Class` 的关系我也画成了一张图，方便你参考：

## 5. 如何在 Kubernetes 里使用 Ingress/Ingress Class

因为`Ingress Class` 很小，所以我把它与 `Ingress` 合成了一个 `YAML` 文件，让我们用 `kubectl apply` 创建这两个对象：

```java
kubectl apply -f ngx-dep.yml
kubectl apply -f ngx-svc.yml
kubectl apply -f ngx-ing.yml
kubectl apply -f ngx-cls.yml
```

然后我们用 `kubectl get` 来查看对象的状态：

```java
kubectl get ingressclass
kubectl get ing
```

命令`kubectl describe` 可以看到更详细的 `Ingress` 信息：

可以看到，`Ingress` 对象的路由规则 `Host/Path` 就是在 `YAML` 里设置的域名 `ngx.test/`，而且已经关联了创建的 `Service` 对象，还有 `Service` 后面的两个 `Pod`。

另外，不要对 `Ingress` 里 `Default backend`的错误提示感到惊讶，在找不到路由的时候，它被设计用来提供一个默认的后端服务，但不设置也不会有什么问题，所以大多数时候我们都忽略它。

## 6. 如何在 Kubernetes 里使用 Ingress Controller

准备好了 `Ingress` 和 `Ingress Class`，接下来我们就需要部署真正处理路由规则的 `Ingress Controller`。

你可以在 `GitHub` 上找到 Nginx Ingress Controller 的项目（[https://github.com/nginxinc/kubernetes-ingress](https://github.com/nginxinc/kubernetes-ingress)），因为它以 `Pod` 的形式运行在 `Kubernetes` 里，所以同时支持 `Deployment` 和 `DaemonSet` 两种部署方式。这里我选择的是 `Deployment`，相关的 `YAML` 也都在我们课程的项目（[链接](https://github.com/chronolaw/k8s_study/tree/master/ingress)）里复制了一份。

`Nginx Ingress Controller` 的安装略微麻烦一些，有很多个 `YAML` 需要执行，但如果只是做简单的试验，就只需要用到 4 个 ：

```java
kubectl apply -f common/ns-and-sa.yaml
kubectl apply -f rbac/rbac.yaml
kubectl apply -f common/nginx-config.yaml
kubectl apply -f common/default-server-secret.yaml
```

前两条命令为 `Ingress Controller` 创建了一个独立的名字空间 `nginx-ingress`，还有相应的账号和权限，这是为了访问 `apiserver` 获取 `Service`、`Endpoint` 信息用的；后两条则是创建了一个 `ConfigMap` 和 `Secret`，用来配置 `HTTP/HTTPS` 服务。

部署`Ingress Controller` 不需要我们自己从头编写 `Deployment`，`Nginx` 已经为我们提供了示例 `YAML`，但创建之前为了适配我们自己的应用还必须要做几处小改动：

- metadata 里的 name 要改成自己的名字，比如 ngx-kic-dep。
- spec.selector 和 template.metadata.labels 也要修改成自己的名字，比如还是用 ngx-kic-dep。
- containers.image 可以改用 apline 版本，加快下载速度，比如 nginx/nginx-ingress:2.2-alpine。
- 最下面的 args 要加上 -ingress-class=ngx-ink，也就是前面创建的 Ingress Class 的名字，这是让 Ingress Controller 管理 Ingress 的关键。

修改完之后，`Ingress Controller` 的 `YAML` 大概是这个样子：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngx-kic-dep
  namespace: nginx-ingress
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ngx-kic-dep
  template:
    metadata:
      labels:
        app: ngx-kic-dep
    ...
    spec:
      containers:
      - image: nginx/nginx-ingress:2.2-alpine
        ...
        args:
          - -ingress-class=ngx-ink
```

有了`Ingress Controller`，这些 `API` 对象的关联就更复杂了，你可以用下面的这张图来看出它们是如何使用对象名字联系起来的：

确认`Ingress Controller` 的 `YAML` 修改完毕之后，就可以用 `kubectl apply` 创建对象：

```java
kubectl apply -f kic.yml
```

注意`Ingress Controller` 位于名字空间 `nginx-ingress`，所以查看状态需要用 `-n`参数显式指定，否则我们只能看到 `default`名字空间里的 `Pod`：

```java
kubectl get deploy -n nginx-ingress
kubectl get pod -n nginx-ingress
```

现在`Ingress Controller` 就算是运行起来了。

不过还有最后一道工序，因为 `Ingress Controller` 本身也是一个 `Pod`，想要向外提供服务还是要依赖于 `Service` 对象。所以你至少还要再为它定义一个 `Service`，使用 `NodePort` 或者 `LoadBalancer` 暴露端口，才能真正把集群的内外流量打通。这个工作就交给你课下自己去完成了。

这里，我就用之前提到的命令 `kubectl port-forward`，它可以直接把本地的端口映射到 `Kubernetes` 集群的某个 `Pod` 里，在测试验证的时候非常方便。

下面这条命令就把本地的 8080 端口映射到了 `Ingress Controller Pod` 的 80 端口：

```java
kubctl get pod -n nginx-ingress
kubectl port-forward -n nginx-ingress ngx-kic-dep-8859b7b86-cplgp 8080:80 &
```

我们在`curl` 发测试请求的时候需要注意，因为 `Ingress` 的路由规则是 `HTTP` 协议，所以就不能用 `IP` 地址的方式访问，必须要用域名、`URI`。

你可以修改 `/etc/hosts` 来手工添加域名解析，也可以使用 `--resolve` 参数，指定域名的解析规则，比如在这里我就把“ngx.test”强制解析到“127.0.0.1”，也就是被 `kubectl port-forward` 转发的本地地址：

```java
curl --resolve ngx.test:8080:127.0.0.1 http://ngx.test:8080
```

把这个访问结果和上一节课里的 `Service` 对比一下，你会发现最终效果是一样的，都是把请求转发到了集群内部的 `Pod`，但 `Ingress` 的路由规则不再是 `IP` 地址，而是 `HTTP` 协议里的域名、`URI` 等要素。

## 7. 总结

学习了`Kubernetes` 里七层的反向代理和负载均衡对象，包括 `Ingress`、`Ingress Controller`、`Ingress Class`，它们联合起来管理了集群的进出流量，是集群入口的总管。总结如下：

**1、**`Service`是四层负载均衡，能力有限，所以就出现了`Ingress`，它基于`HTTP/HTTPS`协议定义路由规则；

**2、**`Ingress`只是规则的集合，自身不具备流量管理能力，需要`IngressController`应用`Ingress`规则才能真正发挥作用；

**3、**`IngressClass`解耦了`Ingress`和`IngressController`，我们应当使用`IngressClass`来管理`Ingress`资源；

**4、** 最流行的`IngressController`是`NginxIngressController`，它基于经典反向代理软件`Nginx`；

目前的`Kubernetes` 流量管理功能主要集中在 `Ingress Controller` 上，已经远不止于管理“入口流量”了，它还能管理“出口流量”，也就是 `egress`，甚至还可以管理集群内部服务之间的“东西向流量”。

此外，`Ingress Controller` 通常还有很多的其他功能，比如 `TLS` 终止、网络应用防火墙、限流限速、流量拆分、身份认证、访问控制等等，完全可以认为它是一个全功能的反向代理或者网关。

所谓的四层和七层，指的是 `OSI` 网络参考模型里面的层次，简单的说，四层就是 `TCP/IP` 协议，七层就是 `HTTP/HTTPS` 等应用协议。

因为`Ingress Controller` 的名字比较长，所以有的时候会缩写成 `IC` 或者 `KIC`。

为了提升路由效率，降低网络成本， `Ingress Controller` 通常不会走 `Service` 流量转发，而是访问 `apiserver` 直接获得 `Service` 代理的 `Pod` 地址，从而绕过了 `Service` 的 `iptables` 规则。

`Ingress` 的能力较弱，路由规则不灵活， 所以 `Ingress Controller` 基本上都有各自的功能扩展，比如 `Nginx` 就增加了自定义资源对象 `VirtualServer`、`Transport-Server` 等。
