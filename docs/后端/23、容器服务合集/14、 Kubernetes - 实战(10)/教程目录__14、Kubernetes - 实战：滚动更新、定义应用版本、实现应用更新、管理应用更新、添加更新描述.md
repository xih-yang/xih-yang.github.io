# 14、Kubernetes - 实战：滚动更新、定义应用版本、实现应用更新、管理应用更新、添加更新描述
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/14.html
- 分类：容器服务
- 分组：教程目录
滚动更新，使用 `kubectl rollout` 实现用户无感知的应用升级和降级。

## 1. 定义应用版本

在`Kubernetes` 里，版本更新使用的不是 `API` 对象，而是两个命令：`kubectl apply` 和 `kubectl rollout`，当然它们也要搭配部署应用所需要的 `Deployment`、`DaemonSet` 等 `YAML` 文件。

我们常常会简单地认为“版本”就是应用程序的“版本号”，或者是容器镜像的“标签”，但不要忘了，在 `Kubernetes` 里应用都是以 `Pod` 的形式运行的，而 `Pod` 通常又会被 `Deployment` 等对象来管理，所以应用的“版本更新”实际上更新的是整个 `Pod`。

那`Pod` 又是由什么来决定的呢？

`Pod` 是由 `YAML` 描述文件来确定的，更准确地说，是 `Deployment` 等对象里的字段 `template`。

所以，在 `Kubernetes` 里应用的版本变化就是 `template` 里 `Pod` 的变化，哪怕 `template` 里只变动了一个字段，那也会形成一个新的版本，也算是版本变化。

但`template` 里的内容太多了，拿这么长的字符串来当做“版本号”不太现实，所以 `Kubernetes` 就使用了“摘要”功能，用摘要算法计算 `template` 的 `Hash` 值作为“版本号”，虽然不太方便识别，但是很实用。

`Pod` 名字里的那串随机数“6796……”就是 `Pod` 模板的 `Hash` 值，也就是 `Pod` 的“版本号”。如果你变动了 `Pod YAML` 描述，比如把镜像改成 `nginx:stable-alpine`，或者把容器名字改成 `nginx-test`，都会生成一个新的应用版本，`kubectl apply` 后就会重新创建 `Pod`：

你可以看到，`Pod` 名字里的 `Hash` 值变成了“7c6c……”，这就表示 `Pod` 的版本更新了。

## 2. 实现应用更新

为了更仔细地研究 `Kubernetes` 的应用更新过程，让我们来略微改造一下 `Nginx Deployment` 对象，看看 `Kubernetes` 到底是怎么实现版本更新的。

首先修改 `ConfigMap`，让它输出 `Nginx` 的版本号，方便我们用 `curl` 查看版本：

```java
# ngx-conf.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ngx-conf
data:
  default.conf: |
    server {
      listen 80;
      location / {
        default_type text/plain;
        return 200
          'ver : $nginx_version\nsrv : $server_addr:$server_port\nhost: $hostname\n';
      }
    }
```

然后我们修改 `Pod` 镜像，明确地指定版本号是 1.21-alpine，实例数设置为 4 个：

```java
# ngx-v1.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngx-dep
spec:
  replicas: 4
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
      - image: nginx:1.21-alpine
        name: nginx
        ports:
        - containerPort: 80
        volumeMounts:
        - mountPath: /etc/nginx/conf.d
          name: ngx-conf-vol
```

把它命名为 `ngx-v1.yml`，然后执行命令 `kubectl apply` 部署这个应用：

```java
kubectl apply -f ngx-conf.yml
kubectl apply -f ngx-v1.yml
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

我们还可以为它创建 `Service` 对象，再用 `kubectl port-forward` 转发请求来查看状态：

```java
kubectl apply -f ngx-svc.yml
kubectl port-forward svc/ngx-svc 8080:80 &
curl 127.1:8080
```

从`curl` 命令的输出中可以看到，现在应用的版本是 1.21.6。现在，让我们编写一个新版本对象 `ngx-v2.yml`，把镜像升级到 `nginx:1.22-alpine`，其他的都不变。

因为`Kubernetes` 的动作太快了，为了能够观察到应用更新的过程，我们还需要添加一个字段 `minReadySeconds`，让 `Kubernetes` 在更新过程中等待一点时间，确认 `Pod` 没问题才继续其余 `Pod` 的创建工作。

要提醒你注意的是，`minReadySeconds` 这个字段不属于 `Pod` 模板，所以它不会影响 `Pod` 版本：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngx-dep
spec:
  minReadySeconds: 15      确认Pod就绪的等待时间 
  replicas: 4
  ... ...
      containers:
      - image: nginx:1.22-alpine
  ... ...
```

现在我们执行命令 `kubectl apply` 来更新应用，因为改动了镜像名，`Pod` 模板变了，就会触发“版本更新”，然后用一个新命令：`kubectl rollout status`，来查看应用更新的状态：

```java
kubectl apply -f ngx-v2.yml
kubectl rollout status deployment ngx-dep
```

更新完成后，你再执行 `kubectl get pod`，就会看到 `Pod` 已经全部替换成了新版本“d575……”，用 `curl` 访问 `Nginx`，输出信息也变成了“1.22.0”：

仔细查看 `kubectl rollout status` 的输出信息，你可以发现，`Kubernetes` 不是把旧 `Pod` 全部销毁再一次性创建出新 `Pod`，而是在逐个地创建新 `Pod`，同时也在销毁旧 `Pod`，保证系统里始终有足够数量的 `Pod` 在运行，不会有“空窗期”中断服务。

新`Pod` 数量增加的过程有点像是“滚雪球”，从零开始，越滚越大，所以这就是所谓的“滚动更新”（`rolling update`）。

使用命令 `kubectl describe` 可以更清楚地看到 `Pod` 的变化情况：

```java
kubectl describe deploy ngx-dep
```

**1、** 一开始的时候V1Pod（即ngx-dep-54b865d75）的数量是4；

**2、** 当“滚动更新”开始的时候，`Kubernetes`创建1个V2Pod（即ngx-dep-d575d5776），并且把V1Pod数量减少到3；

**3、** 接着再增加V2Pod的数量到2，同时V1Pod的数量变成了1；

**4、** 最后V2Pod的数量达到预期值4，V1Pod的数量变成了0，整个更新过程就结束了；

看到这里你是不是有点明白了呢，其实“滚动更新”就是由 `Deployment` 控制的两个同步进行的“应用伸缩”操作，老版本缩容到 0，同时新版本扩容到指定值，是一个“此消彼长”的过程。

这个滚动更新的过程我画了一张图，你可以参考它来进一步体会：

## 3. 管理应用更新

`Kubernetes` 的“滚动更新”功能确实非常方便，不需要任何人工干预就能简单地把应用升级到新版本，也不会中断服务，不过如果更新过程中发生了错误或者更新后发现有 Bug 该怎么办呢？

要解决这两个问题，我们还是要用 `kubectl rollout` 命令。

在应用更新的过程中，你可以随时使用 `kubectl rollout pause` 来暂停更新，检查、修改 `Pod`，或者测试验证，如果确认没问题，再用 `kubectl rollout resume` 来继续更新。

这两个命令比较简单，我就不多做介绍了，要注意的是它们只支持 `Deployment`，不能用在 `DaemonSet`、`StatefulSet` 上（最新的 1.24 支持了 StatefulSet 的滚动更新）。

对于更新后出现的问题，`Kubernetes` 为我们提供了“后悔药”，也就是更新历史，你可以查看之前的每次更新记录，并且回退到任何位置，和我们开发常用的 Git 等版本控制软件非常类似。

查看更新历史使用的命令是 `kubectl rollout history`：

```java
kubectl rollout history deploy ngx-dep
```

它会输出一个版本列表，因为我们创建 `Nginx Deployment` 是一个版本，更新又是一个版本，所以这里就会有两条历史记录。

但`kubectl rollout history` 的列表输出的有用信息太少，你可以在命令后加上参数 `--revision` 来查看每个版本的详细信息，包括标签、镜像名、环境变量、存储卷等等，通过这些就可以大致了解每次都变动了哪些关键字段：

```java
kubectl rollout history deploy --revision=2
```

假设我们认为刚刚更新的 nginx:1.22-alpine 不好，想要回退到上一个版本，就可以使用命令 `kubectl rollout undo`，也可以加上参数 `--to-revision` 回退到任意一个历史版本：

```java
kubectl rollout undo deploy ngx-dep
```

`kubectl rollout undo` 的操作过程其实和 `kubectl apply` 是一样的，执行的仍然是“滚动更新”，只不过使用的是旧版本 `Pod` 模板，把新版本 `Pod` 数量收缩到 0，同时把老版本 `Pod` 扩展到指定值。

这个V2 到 V1 的“版本降级”的过程我同样画了一张图，它和从 V1 到 V2 的“版本升级”过程是完全一样的，不同的只是版本号的变化方向：

## 4. 添加更新描述

有没有觉得 `kubectl rollout history` 的版本列表好像有点太简单了呢？只有一个版本更新序号，而另一列 `CHANGE-CAUSE` 为什么总是显示成 呢？能不能像 Git 一样，每次更新也加上说明信息呢？

这当然是可以的，做法也很简单，我们只需要在 `Deployment` 的 `metadata` 里加上一个新的字段 `annotations`。

`annotations` 字段的含义是“注解”“注释”，形式上和 `labels` 一样，都是 `Key-Value`，也都是给 `API` 对象附加一些额外的信息，但是用途上区别很大。

- annotations 添加的信息一般是给 Kubernetes 内部的各种对象使用的，有点像是“扩展属性”；
- labels 主要面对的是 Kubernetes 外部的用户，用来筛选、过滤对象的。

如果用一个简单的比喻来说呢，`annotations` 就是包装盒里的产品说明书，而 `labels` 是包装盒外的标签贴纸。

借助`annotations`，`Kubernetes` 既不破坏对象的结构，也不用新增字段，就能够给 `API` 对象添加任意的附加信息，这就是面向对象设计中典型的 OCP“开闭原则”，让对象更具扩展性和灵活性。

`annotations` 里的值可以任意写，`Kubernetes` 会自动忽略不理解的 `Key-Value`，但要编写更新说明就需要使用特定的字段 `kubernetes.io/change-cause`。

下面来操作一下，我们创建 3 个版本的 `Nginx` 应用，同时添加更新说明：

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngx-dep
  annotations:
    kubernetes.io/change-cause: v1, ngx=1.21
... ...
```

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngx-dep
  annotations:
    kubernetes.io/change-cause: update to v2, ngx=1.22
... ...
```

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngx-dep
  annotations:
    kubernetes.io/change-cause: update to v3, change name
... ...
```

需要注意 `YAML` 里的 `metadata` 部分，使用 `annotations.kubernetes.io/change-cause` 描述了版本更新的情况，相比 `kubectl rollout history --revision` 的罗列大量信息更容易理解。

依次使用 `kubectl apply` 创建并更新对象之后，中间稍微间隔点时间，确保 `Pod` 都已建立，我们再用 `kubectl rollout history` 来看一下更新历史：

## 5. 总结

滚动更新，它会自动缩放新旧版本的 `Pod` 数量，能够在用户无感知的情况下实现服务升级或降级，让原本复杂棘手的运维工作变得简单又轻松。

**1、** 在`Kubernetes`里应用的版本不仅仅是容器镜像，而是整个`Pod`模板，为了便于处理使用了摘要算法，计算模板的`Hash`值作为版本号；

**2、**`Kubernetes`更新应用采用的是滚动更新策略，减少旧版本`Pod`的同时增加新版本`Pod`，保证在更新过程中服务始终可用；

**3、** 管理应用更新使用的命令是`kubectlrollout`，子命令有`status`、`history`、`undo`等；

**4、**`Kubernetes`会记录应用的更新历史，可以使用`history--revision`查看每个版本的详细信息，也可以在每次更新时添加注解`kubernetes.io/change-cause`；

另外，在 `Deployment` 里还有其他一些字段可以对滚动更新的过程做更细致的控制，它们都在 `spec.strategy.rollingUpdate` 里，比如 `maxSurge`、`maxUnavailable` 等字段，分别控制最多新增 `Pod` 数和最多不可用 `Pod` 数，一般用默认值就足够了。

`Deployment` 在版本更新的时候实际控制的是 `ReplicaSet` 对象，创建不同版本的 `ReplicaSet`，再由 `ReplicaSet` 来伸缩 `Pod` 数量。

除了使用 `kubectl apply` 来触发应用更新，你也可以使用其它任何能够修改 `API` 对象的方式，比如 `kubectl edit`、`kubectl patch`、 `kubectl set image` 等命令 。

`kubenetes` 不会记录所有的更新历史，那样太浪费资源，默认它只会保留最近的 10 次操作，但是这个值可以使用字段 `revisionHistoryLimit` 调整。

## 6. 问答

**1、** 今天学的`Kubernetes`的“滚动更新”，与我们常说的“灰度发布”有什么相同点和不同点？；

“滚动发布”是能力，“灰度发布”是功能，`k8s` 基于“滚动发布”的能力，可以实现 `pod` 的‘水平扩展/收缩’，从而能够提供类似于“灰度发布”、“金丝雀发布”这种功能。

灰度发布应该是多个应用版本共存，按一定比例分配;

滚动更新是一个逐步使用“新”版本替换“旧”版本的发布方式；灰度发布又称金丝雀发布，在灰度期间，“新”、“旧”两个版本会同时存在，这种发布方式可以用于实现A/B测试

**1、** 直接部署旧版本的`YAML`也可以实现版本回退，`kubectlrolloutundo`命令的好处是什么？；

其实讨论这个问题前，我们要先了解下 `k8s` 的控制器模型，另外还要引入一个概念就是 `ReplicaSet` ，什么意思呢，其实`Deployment` 并不是直接控制 `Pod` ，`Pod` 的归属对象是 `ReplicaSet` ，也就是说 `Deployment` 控制的是 `ReplicaSet` (版本这个概念其实我们可以等同于是 `ReplicaSet` )，然后 `ReplicaSet` 控制 `Pod` 的数量。我们可以通过 `kubectl get rs` 来看下具体内容：

所以这个时候，我们再来理解“版本回退”和“直接部署旧版本的 YAML”的区别就容易了，这里的版本就像是我们平时开发代码库打的 `tag` 一样，是类似于我们的快照文件一样，这个快照信息可以正确的帮我们记录当时场景的最原始信息，所以我们通过版本回退的方式能够最大限度的保证正确性（这点是k8s已经为我们保证了这一点），反之如果我们通过旧的 `yaml` 部署，就不一定能保证当前这个 `yaml` 文件有没有被改动过，这里的变数还是挺大的，所以直接通过 `yaml` 部署，极大的增加了我们部署的风险性。

在实验环境中，我的每个版本并不是都有 `YAML` 文件，有时只是做一个很小的调整接着发布，这时 `undo` 比较好用，真正实现版本回滚/退 。
