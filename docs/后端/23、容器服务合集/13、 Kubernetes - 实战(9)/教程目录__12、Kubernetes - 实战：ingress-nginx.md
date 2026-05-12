# 12、Kubernetes - 实战：ingress-nginx
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/12.html
- 分类：容器服务
- 分组：教程目录
## ingress-nginx

前面已经了解了 Ingress 资源对象只是一个路由请求描述配置文件，要让其真正生效还需要对应的 Ingress 控制器才行，Ingress 控制器有很多，这里先介绍使用最多的 `ingress-nginx`，它是基于 Nginx 的 Ingress 控制器。

ingress-nginx 控制器主要是用来组装一个 `nginx.conf` 的配置文件，当配置文件发生任何变动的时候，就需要重新加载 Nginx 来生效。

Kubernetes 控制器使用控制循环模式来检查控制器中所需的状态是否已更新或是否需要变更，所以 ingress-nginx 需要使用集群中的不同对象来构建模型，比如 Ingress、Service、Endpoints、Secret、ConfigMap 等可以生成反映集群状态的配置文件的对象。

控制器需要一直 Watch 这些资源对象的变化，但是并没有办法知道特定的更改是否会影响到最终生成的 nginx.conf 配置文件，所以一旦 Watch 到了任何变化控制器都必须根据集群的状态重建一个新的模型，并将其与当前的模型进行比较：

- 如果模型相同，则就可以避免生成新的 Nginx 配置并触发重载。
- 如果模型不同，则检查模型的差异是否只和端点有关，如果是，则使用 HTTP POST 请求将新的端点列表发送到在 Nginx 内运行的 Lua 处理程序，并再次避免生成新的 Nginx 配置并触发重载。
- 如果不仅仅是端点的差异，那么就会基于新模型创建一个新的 Nginx 配置然后触发重载。

这样构建模型最大的一个好处就是在状态没有变化时避免不必要的重新加载，可以节省大量 Nginx 重新加载，这在生产环境很有必要。

以下是一些需要重新加载的场景：

- 创建了新的 Ingress 资源
- TLS 添加到现有 Ingress
- 从 Ingress 中添加或删除 path 路径
- Ingress、Service、Secret 被删除了
- Ingress 的一些缺失引用对象变可用了，例如 Service 或 Secret
- 更新了一个 Secret

更多信息可以查看官方文档：

> https://kubernetes.github.io/ingress-nginx/

## 安装 ingress-nginx

在生产应用中，ingress-nginx 一般都是给外网访问的，需要解析域名在上面，所以一般节点都是指定的特殊的节点，通常叫边缘节点（集群内部用来向集群外暴露服务能力的节点）。

**1、** 由于国内网络的原因，访问raw.githubusercontent.com是有问题的，可以通过配置hosts来解决；

> https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.6.4/deploy/static/provider/baremetal/deploy.yaml

下载该文件并改名为 `ingress-nginx.yaml`，然后上传到 /opt/service/kubernetes/addons 目录。

**1、** 给需要对外提供服务的边缘节点打标签，在部署的时候好通过标签选择；

```java
kubectl label nodes worker-01 igNode=true
kubectl label nodes worker-02 igNode=true
kubectl label nodes worker-03 igNode=true
```

**1、** 替换镜像地址，默认为`registry.k8s.io`，国内访问不到；

```java
sed -i "s#registry.k8s.io/ingress-nginx#dyrnq#g" ingress-nginx.yaml
sed -i "s#@sha256.*##g" ingress-nginx.yaml
```

注意有些镜像后面可能跟了 `@sha256`，也要替换掉。

**1、** 修改`ingress-nginx-controller`这个Deployment为DaemonSet：；

```java
apiVersion: apps/v1
# kind: Deployment
# 替换部署方式
kind: DaemonSet
metadata:
...
    spec:
      containers:
      添加配置
      hostNetwork: true
      修改节点选择器
      nodeSelector:
        igNode: 'true'
...
```

执行部署后如图所示：

此时会在三个 Node 节点监听 80 和 443 端口。

特别注意：

> 如果想要通过 kubectl delete -f ingress-nginx.yaml 删除 ingress nginx，会卡住。此时可以通过 Ctrl + C 终止。当再次 apply 的时候会发现一堆错误：unable to create new content in namespace ingress-nginx because it is being terminated。原因在于删除的时候先把 namespace 删除了。只需要先手动创建 ingress-nginx 这个 namespace，再 apply 就行了。

## 完整的示例

创建一个完整的 Ingress 资源清单：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ig-deploy-demo
spec:
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: ig-c-demo
        image: nginx:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: ig-service-demo
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
--- 
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ig-ingress-demo
spec:
  指定使用 ingress-nginx
  ingressClassName: nginx
  rules:
  - host: foo.bar.com
    http:
      paths:
      - pathType: Prefix
        path: "/"
        backend:
          service:
            name: ig-service-demo
            port: 
              number: 80
```

通过添加 hosts，然后访问域名可以请求到 nginx。同时也能看到创建的 ingress：

ingress-nginx 控制器的核心原理就是将 Ingress 这些资源对象映射翻译成 Nginx 配置文件 nginx.conf，可以通过查看控制器中的配置文件来验证这点：

```java
kubectl exec -n ingress-nginx -it ingress-nginx-controller-6k6wj -- cat /etc/nginx/nginx.conf
```

需要注意的是：并不会为每个 backend 后端都创建一个 `upstream` 配置块，现在是使用 Lua 程序进行动态处理的，所以没有直接看到后端的 Endpoints 相关配置数据。

## Nginx 配置实现：基础认证功能

可以在Ingress 对象上配置一些基本的 Auth 认证，比如 Basic Auth，可以用 `htpasswd` 生成一个密码文件来验证身份验证。参考文档：

> https://kubernetes.github.io/ingress-nginx/examples/auth/basic/

配置方式：

**1、** 本地创建一个htpasswd生成的文件：；

```java
yum install httpd-tools -y
htpasswd -c auth admin
```

创建admin 用户，将用户密码信息保存到 auth 文件中。

> 注意，官方文档上面有提到，文件名称必须为 auth，因为到时候 secret 中要有 data.auth 这个 Key，否则会报错 503。

**1、** 将文件中的内容创建资源清单：；

```java
apiVersion: v1
kind: Secret
metadata:
  name: nginx-basic-auth
type: Opaque
stringData:
  auth: "admin:$apr1$i.W7jhan$whKRJ3kxs1Bh3k1Sles95/"
```

当然，也可以直接命令创建：

```java
kubectl create secret generic nginx-basic-auth --from-file=auth
```

**1、** 添加Ingress的资源清单：；

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ig-with-auth
  annotations:
    认证类型
    nginx.ingress.kubernetes.io/auth-type: basic
    包含 user/password 定义的 secret 对象名
    nginx.ingress.kubernetes.io/auth-secret: nginx-basic-auth
    配置外部认证服务地址
    nginx.ingress.kubernetes.io/auth-url: https://httpbin.org/basic-auth/user/passwd
    要显示的带有适当上下文的消息，说明需要身份验证的原因
    nginx.ingress.kubernetes.io/auth-realm: 'Authentication Required'  
spec:
  指定使用 ingress-nginx
  ingressClassName: nginx
  rules:
  - host: auth.demo.com
    http:
      paths:
      - pathType: Prefix
        path: "/"
        backend:
          service:
            name: ig-service-demo
            port: 
              number: 80
```

命令行访问，没代用户密码会提示 401：

```java
curl http://192.168.2.31 -H 'Host:auth.demo.com'
```

除了Basic Auth 这一种简单的认证方式之外，ingress-nginx 还支持一些其他高级的认证，比如使用 GitHub OAuth 来认证 Kubernetes 的 Dashboard。

## Nginx 配置实现：URL Rewrite

ingress-nginx 很多高级的用法可以通过 Ingress 对象的 `annotation` 进行配置，比如常用的 URL Rewrite 功能。参考文档：

> https://kubernetes.github.io/ingress-nginx/examples/rewrite/

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-with-rewrite
  annotations:
    当访问 /api/xxx 的时候会 rewrite 到 /xxx
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    当访问 / 的时候会 rewrite 到 /api/，否则会因为没配置 / 提示 404
    nginx.ingress.kubernetes.io/app-root: /api/
    有可能本身服务就有 /api 这个接口，所以要单独处理
    nginx.ingress.kubernetes.io/configuration-snippet: |
      rewrite ^(/api)$ $1/ redirect;
spec:
  rules:
  - host: rewrite.demo.com
    http:
      paths:
      - pathType: Prefix
        path: "/api(/|$)(.*)"
        backend:
          service:
            name: <Service>
            port: 
              number: <Port>
```

## Nginx 配置实现：灰度发布

在日常工作中常会用到滚动发布，灰度发布，蓝绿发布等。ingress-nginx 支持通过 Annotations 配置来实现不同场景下的灰度发布和测试，可以满足金丝雀发布、蓝绿部署与 A/B 测试等业务场景。参考文档：

> https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#canary

ingress-nginx 的 Annotations 支持以下 4 种 Canary 规则：

- nginx.ingress.kubernetes.io/canary-by-header：
- 基于 Request Header 的流量切分，适用于灰度发布以及 A/B 测试。
- 当 Request Header 设置为 always 时，请求将会被一直发送到 Canary 版本。
- 当 Request Header 设置为 never 时，请求不会被发送到 Canary 入口。
- 对于任何其他 Header 值，将忽略 Header，并通过优先级将请求与其他金丝雀规则进行优先级的比较。
- nginx.ingress.kubernetes.io/canary-by-header-value：
- 要匹配的 Request Header 的值，用于通知 Ingress 将请求路由到 Canary Ingress 中指定的服务。
- 当 Request Header 设置为此值时，它将被路由到 Canary 入口。
- 该规则允许用户自定义 Request Header 的值，必须与上一个 annotation (`canary-by-header`) 一起使用。
- nginx.ingress.kubernetes.io/canary-weight：
- 基于服务权重的流量切分，适用于蓝绿部署，权重范围 0 - 100 按百分比将请求路由到 Canary Ingress 中指定的服务。
- 权重为 0 意味着该金丝雀规则不会向 Canary 入口的服务发送任何请求。
- 权重为 100 意味着所有请求都将被发送到 Canary 入口。
- nginx.ingress.kubernetes.io/canary-by-cookie：
- 基于 cookie 的流量切分，适用于灰度发布与 A/B 测试。用于通知 Ingress 将请求路由到 Canary Ingress 中指定的服务的cookie。
- 当 cookie 值设置为 always 时，它将被路由到 Canary 入口。
- 当 cookie 值设置为 never 时，请求不会被发送到 Canary 入口。
- 对于任何其他值，将忽略 cookie 并将请求与其他金丝雀规则进行优先级的比较。

> 需要注意的是金丝雀规则按优先顺序进行排序：canary-by-header - > canary-by-cookie - > canary-weight

测试灰度发布：

**1、** 创建生产环境：；

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-nginx-prod
spec:
  selector:
    matchLabels:
      env: production
  template:
    metadata:
      labels:
        env: production
    spec:
      containers:
      - name: c-nginx-prod
        image: nginx:latest
        ports:
        - containerPort: 80
        lifecycle:
          postStart:
            exec:
              command:  ["/bin/sh", "-c", "echo 'Production' > /usr/share/nginx/html/index.html"]
---
apiVersion: v1
kind: Service
metadata:
  name: svc-prod
spec:
  selector:
    env: production
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ig-prod
spec:
  ingressClassName: nginx
  rules:
  - host: www.abc.com
    http:
      paths:
      - pathType: Prefix
        path: "/"
        backend:
          service:
            name: svc-prod
            port: 
              number: 80
```

创建之后访问测试：

```java
curl 192.168.2.31 -H "Host:www.abc.com"
```

可以看到请求返回的是 Production。

**1、** 创建灰度版本：；

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-nginx-canary
spec:
  selector:
    matchLabels:
      env: canary
  template:
    metadata:
      labels:
        env: canary
    spec:
      containers:
      - name: c-nginx-canary
        image: nginx:latest
        ports:
        - containerPort: 80
        lifecycle:
          postStart:
            exec:
              command: ["/bin/sh", "-c", "echo Canary > /usr/share/nginx/html/index.html"]
---
apiVersion: v1
kind: Service
metadata:
  name: svc-canary
spec:
  selector:
    env: canary
  ports:
  - port: 80
    targetPort: 80
```

**基于权重分流**

基于权重的流量切分的典型应用场景就是蓝绿部署，可通过将权重设置为 0 或 100 来实现。

新建基于权重的 ingress：

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ig-canary
  annotations:
    要开启灰度发布机制，首先需要启用 Canary
    nginx.ingress.kubernetes.io/canary: "true"
    分配 30% 流量到当前 Canary 版本
    nginx.ingress.kubernetes.io/canary-weight: "30"
spec:
  ingressClassName: nginx
  rules:
  - host: www.abc.com
    http:
      paths:
      - pathType: Prefix
        path: "/"
        backend:
          service:
            name: svc-canary
            port: 
              number: 80
```

访问测试：

```java
while true;do curl 192.168.2.31 -H "Host:www.abc.com"; sleep 1;done
```

如图所示：

可以看到 10 次请求有 3 次是到灰度环境的，也就是 30%。

**基于 Request Header 分流**

基于Request Header 进行流量切分的典型应用场景即灰度发布或 A/B 测试场景。

在权重分类的 Ingress 对象中新增一条 annotation 配置 `nginx.ingress.kubernetes.io/canary-by-header: canary`（这里的 value 可以是任意值），使当前的 Ingress 实现基于 Request Header 进行流量切分。

由于`canary-by-header` 的优先级大于 `canary-weight`，所以会忽略原有的 `canary-weight` 的规则。

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ig-canary
  annotations:
    要开启灰度发布机制，首先需要启用 Canary
    nginx.ingress.kubernetes.io/canary: "true"
    分配 30% 流量到当前 Canary 版本（配置基于 Header 权重会失效）
    nginx.ingress.kubernetes.io/canary-weight: "30"
    基于 header 的流量切分
    nginx.ingress.kubernetes.io/canary-by-header: canary
...
```

当Request Header 设置为 `never` 或 `always` 时，请求将不会或一直被发送到 Canary 版本，对于任何其他 Header 值，将忽略 Header，并通过优先级将请求与其他 Canary 规则进行优先级的比较。

访问测试：

```java
# 一直访问灰度一般
while true;do curl 192.168.2.31 -H "canary:always" -H "Host:www.abc.com"; sleep 1;done
# 一直访问生产
while true;do curl 192.168.2.31 -H "canary:never" -H "Host:www.abc.com"; sleep 1;done
# 没配置走其它规则，这里走权重
while true;do curl 192.168.2.31 -H "Host:www.abc.com"; sleep 1;done
```

如图所示：

还可以不使用 always 和 never 的值，自定义值：

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ig-canary
  annotations:
    要开启灰度发布机制，首先需要启用 Canary
    nginx.ingress.kubernetes.io/canary: "true"
    分配 30% 流量到当前 Canary 版本（配置基于 Header 权重会失效）
    nginx.ingress.kubernetes.io/canary-weight: "30"
    基于 header 的流量切分
    nginx.ingress.kubernetes.io/canary-by-header: canary
    也可以指定 header 的值，此时 always 和 never 就属于其它值了，走其它规则
    nginx.ingress.kubernetes.io/canary-by-header-value: hello
...
```

测试访问：

```java
# 自定义的值
while true;do curl 192.168.2.31 -H "canary:hello" -H "Host:www.abc.com"; sleep 1;done
```

如图所示：

**基于 Cookie 分流**

和基于Request Header 的 annotation 用法规则类似。

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ig-canary
  annotations:
    要开启灰度发布机制，首先需要启用 Canary
    nginx.ingress.kubernetes.io/canary: "true"
    分配 30% 流量到当前 Canary 版本（配置基于 Header 权重会失效）
    nginx.ingress.kubernetes.io/canary-weight: "30"
    基于 header 的流量切分
    nginx.ingress.kubernetes.io/canary-by-header: canary
    也可以指定 header 的值，避免除了 always 和 never，其他值都走其它规则了
    nginx.ingress.kubernetes.io/canary-by-header-value: hello
    基于 cookie
    nginx.ingress.kubernetes.io/canary-by-cookie: "address"
...
```

此时如果访问指定 Cookie 为 always，则会访问灰度版本，never 则灰灰访问灰度版本。没设置则走其它规则。

> 规则优先级：canary-by-header - > canary-by-cookie - > canary-weight

## Nginx 配置实现：HTTPS

用HTTPS 来访问就需要监听 443 端口，还需要 SSL 证书，这里通过 `openssl` 来创建一个自签名的证书：

```java
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=tls.abc.com"
```

创建Secret 方便使用：

```java
kubectl create secret tls secret-tls --cert=tls.crt --key=tls.key
```

资源清单：

```java
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ig-tls
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - tls.abc.com
    secretName: secret-tls
  rules:
  - host: tls.abc.com
    http:
      paths:
      - pathType: Prefix
        path: "/"
        backend:
          service:
            name: svc-prod
            port: 
              number: 80
```

访问80 端口会跳到 443 端口 HTTPS 访问。

## 全局配置

除了可以通过 annotations 对指定的 Ingress 进行定制之外，还可以配置 ingress-nginx 的全局配置，在控制器启动参数中通过标志 `--configmap` 指定了一个全局的 ConfigMap 对象，可以将全局的一些配置直接定义在该对象中即可。

在之前下载的 ingress-nginx 的配置清单中是有加入相关配置的：

```java
apiVersion: apps/v1
kind: DaemonSet
...
    spec:
      containers:
      - args:
        - /nginx-ingress-controller
...
        - --configmap=$(POD_NAMESPACE)/ingress-nginx-controller
...
```

在对应的 ingress-nginx 命名空间下有一个 ConfigMap：`ingress-nginx-controller`，可以通过修改它对 ingress-nginx 进行配置。

```java
kubectl edit configmap ingress-nginx-controller -n ingress-nginx
```

当然更推荐修改资源清单进行配置：

```java
apiVersion: v1
data:
  allow-snippet-annotations: "true"
  client-header-buffer-size: 32k  
  client-max-body-size: 10m
  use-gzip: "true"
  gzip-level: "7"
  large-client-header-buffers: 4 32k
  proxy-connect-timeout: 10s
  proxy-read-timeout: 20s
  keep-alive: "75"   
  keep-alive-requests: "100"
  upstream-keepalive-connections: "10000"
  upstream-keepalive-requests: "100"
  upstream-keepalive-timeout: "60"
  disable-ipv6: "true"
  disable-ipv6-dns: "true"
  max-worker-connections: "65535"
  max-worker-open-files: "10240"
kind: ConfigMap
...
  name: ingress-nginx-controller
  namespace: ingress-nginx
```
