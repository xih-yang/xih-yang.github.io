# 11、Kubernetes - 实战：Ingress
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/11.html
- 分类：容器服务
- 分组：教程目录
## Ingress

前面知道了可以使用 `NodePort` 和 `LoadBlancer` 类型的 Service 可以把应用暴露给外部用户使用，这对于小规模的应用来说确实没多大问题，但是当你的应用越来越多的时候，就会发现对于 NodePort 的管理就会变得非常麻烦，特别是大量的端口管理。为此，Kubernetes 提供了一个专门用来暴露服务给外部用户的资源对象，那就是 `Ingress`。

Ingress 资源对象是 Kubernetes 内置定义的一个对象，是从 Kuberenets 集群外部访问集群的一个入口，将外部的请求转发到集群内不同的 Service 上。

其实就相当于 nginx、haproxy 等负载均衡代理服务器。但为啥不直接使用 Nginx？

原因就在于如果有新服务加入的时候怎么改 Nginx 配置。不可能每次都去手动更改或者滚动更新前端的 Nginx Pod 吧？那是不是在 Nginx 的基础上再加上一个服务发现的工具，比如 consul 这种就能实现呢？

是的，Ingress 实际上就是类似这样实现的，只是服务发现的功能是它自己实现的，不需要使用第三方的服务，通过 Ingress Controller 可以完成域名规则定义，路由信息的刷新等等。

Ingress Controller 可以理解为一个监听器，通过不断地监听 kube-apiserver，实时的感知后端 Service、Pod 的变化，当得到这些信息变化后，再结合 Ingress 的配置，更新反向代理负载均衡器，达到服务发现的作用。

## 定义资源

一个基础的 Ingress 资源，注意不是运行的资源清单：

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-demo
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - http:
      paths:
      - pathType: Prefix
        path: "/demo"
        backend:
          service:
            name: svc-nginx
            port: 
              number: 8080
```

通过配置了一个路径为 `/demo` 的路由，所有 `/demo/**` 的入站请求，都会被 Ingress 转发至名为 svc-nginx 的 Service 的 8080 端口的 `/` 路径下。

此外Ingress 经常会在 metadata 中使用注解 `annotations` 来配置一些选项，这取决于 Ingress 控制器的实现方式，不同的 Ingress 控制器支持不同的注解。

> 单纯的 Ingress 资源并没啥用，想要正常使用还需要对应的 Ingress Controller，比如 ingress-nginx。

整个Ingress 其实就可以看成是 nginx.conf 配置。

## rules

rules 属性是 Ingress 的核心配置，每个路由规则都需要在下面进行配置：

- host：
- 可选字段，如果没指定，那么该规则适用于通过指定 IP 地址的所有入站 HTTP 通信。
- 如果提供了 host 域名，rules 则只会匹配该域名的相关请求。
- host 主机名可以是精确匹配（例如 foo.bar.com），也可以是通配符匹配（例如 *.foo.com）。
- http.paths：
- 定义访问的路径列表，如 /demo。
- 每个路径都需要单独定义关联 Service。
- backend：
- 定义后端的 Service 服务。

Ingress 一般还会配置一个 `defaultBackend` 默认后端，当请求不匹配任何 Ingress 中的路由规则的时会使用该后端。

## Resource

backend 后端除了可以是一个 Service 服务，还可以和 `resource` 资源进行关联。

Resource 是当前 Ingress 对象命名空间下引用的另外一个 Kubernetes 资源对象，但 Resource 与 Service 配置是互斥的，只能配置一个。Resource 后端的一种常见用法是将所有入站数据导向带有静态资产的对象存储后端。

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-resource-demo
spec:
  rules:
    - http:
        paths:
          - path: /icons
            pathType: ImplementationSpecific
            backend:
              resource:
                apiGroup: k8s.example.com
                kind: StorageBucket
                name: icon-assets
```

该Ingress 资源对象描述了所有的 `/icons` 请求会被路由到同命名空间下的名为 `icon-assets` 的 `StorageBucket` 资源中去进行处理。

## pathType

每个路径都需要有对应的路径类型，当前支持的路径类型有三种：

- ImplementationSpecific：该路径类型的匹配方法取决于 IngressClass。
- Exact：精确匹配 URL 路径，且区分大小写。
- Prefix：基于以 / 分隔的 URL 路径前缀匹配，匹配区分大小写。

匹配规则：

类型
配置路径
请求路径
是否匹配

Exact
/foo
/foo/
否

Exact
/foo
/foo
是

Prefix
/
所有路径
是

Prefix
/foo
/foo，/foo/
是

Prefix
/foo/
/foo，/foo/
是

Prefix
/a/b
/a/bb
否

Prefix
/a/b/
/a/b
是

Prefix
/a/b
/a/b/，/a/b/c
是

> 当多条匹配都满足的时候，会采用最长的匹配路径优先，如果仍然有两条同等的匹配路径，则精确路径类型优先于前缀路径类型。

## IngressClass

Kubernetes 1.18 起，正式提供了一个 `IngressClass` 资源，作用与 `annotations` 注解类似。在集群中可能会有多个 Ingress 控制器，可以通过该对象来定义：

```java
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  该名称会在 Ingress 中使用
  name: external-lb
spec:
  指定 Ingress 控制器
  controller: nginx-ingress-internal-controller
  parameters:
    apiGroup: k8s.example.com
    kind: IngressParameters
    name: external-lb
```

Ingress 中的 `spec.ingressClassName` 属性就是用来指定对应的 IngressClass，如：

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-demo
spec:
  使用上面定义的 IngressClass 对象名称
  ingressClassName: external-lb  
  ...
```

需要注意：

> ingressClassName 与老版本的 annotations 注解指定的 ingressClass 的作用并不完全相同。ingressClassName 字段引用的是 IngressClass 资源的名称，IngressClass 资源中除了指定了 Ingress 控制器的名称之外，还可能会通过 parameters 属性定义一些额外的配置。

比如，parameters 字段有一个 `scope` 和 `namespace` 字段，可用来引用特定于命名空间的资源，对 Ingress 类进行配置。

scope 字段默认为 `Cluster`，表示集群作用域的资源。将 scope 设置为 `Namespace` 并设置 `namespace` 字段就可以引用某特定命名空间中的参数资源，比如：

```java
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: external-lb
spec:
  controller: nginx-ingress-internal-controller
  parameters:
    apiGroup: k8s.example.com
    kind: IngressParameters
    name: external-lb
    namespace: external-configuration
    scope: Namespace
```

由于一个集群中可能有多个 Ingress 控制器，所以还可以将一个特定的 `IngressClass` 对象标记为集群默认是 Ingress 类。

只需要将一个 IngressClass 资源的 `ingressclass.kubernetes.io/is-default-class` 注解设置为 true 即可。这样未指定 ingressClassName 字段的 Ingress 就会使用这个默认的 IngressClass。

> 如果集群中有多个 IngressClass 被标记为默认，准入控制器将阻止创建新的未指定 ingressClassName 的 Ingress 对象。最好的方式还是确保集群中最多只能有一个 IngressClass 被标记为默认。

## TLS

Ingress 资源对象还可以用来配置 HTTPS 的服务，可以通过设定包含 TLS 私钥和证书的 Secret 来保护 Ingress。

Ingress 只支持单个 TLS 端口 443，如果 Ingress 中的 TLS 配置部分指定了不同的域名，那么它们将根据通过 SNI TLS 扩展指定的主机名 （如果 Ingress 控制器支持 SNI）在同一端口上进行复用。

需要注意 TLS Secret 必须包含名为 `tls.crt` 和 `tls.key` 的键名，Secret 资源清单：

```java
apiVersion: v1
kind: Secret
metadata:
  name: secret-tls-demo
type: kubernetes.io/tls
data:
  tls.crt: base64 编码的 cert
  tls.key: base64 编码的 key
```

使用示例：

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-tls-demo
spec:
  tls:
  - hosts:
      - foo1.bar.com
    secretName: secret-tls-demo
  rules:
  - host: foo.bar.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: svc-demo
            port:
              number: 8080
```

现在了解了如何定义 Ingress 资源对象了，但是仅创建 Ingress 资源本身没有任何效果。还需要部署 Ingress 控制器，例如 `ingress-nginx`。

目前可供大家使用的 Ingress 控制器有很多，比如 traefik、nginx-controller 等，当然你也可以自己实现一个 Ingress Controller，现在普遍用得较多的是 traefik 和 ingress-nginx。

traefik 的性能比 ingress-nginx 差，但是配置使用要简单许多。

> 目前在开发一组高配置能力的 API（Service API），新 API 会提供一种 Ingress 的替代方案，它的存在目的不是替代 Ingress，而是提供一种更具配置能力的新方案。
