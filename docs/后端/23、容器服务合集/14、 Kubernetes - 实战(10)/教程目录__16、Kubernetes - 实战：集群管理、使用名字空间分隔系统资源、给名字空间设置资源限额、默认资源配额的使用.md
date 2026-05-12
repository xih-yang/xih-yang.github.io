# 16、Kubernetes - 实战：集群管理、使用名字空间分隔系统资源、给名字空间设置资源限额、默认资源配额的使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/10/16.html
- 分类：容器服务
- 分组：教程目录
## 1. 为什么要有名字空间

首先要明白，`Kubernetes` 的名字空间并不是一个实体对象，只是一个逻辑上的概念。它可以把集群切分成一个个彼此独立的区域，然后我们把对象放到这些区域里，就实现了类似容器技术里 `namespace` 的隔离效果，应用只能在自己的名字空间里分配资源和运行，不会干扰到其他名字空间里的应用。

你可能要问了：`Kubernetes` 的 `Master/Node` 架构已经能很好地管理集群，为什么还要引入名字空间这个东西呢？它的实际意义是什么呢？

我觉得，这恰恰是 `Kubernetes`面对大规模集群、海量节点时的一种现实考虑。因为集群很大、计算资源充足，会有非常多的用户在 `Kubernetes` 里创建各式各样的应用，可能会有百万数量级别的 `Pod`，这就使得资源争抢和命名冲突的概率大大增加了，情形和单机 `Linux` 系统里是非常相似的。

比如说，现在有一个 `Kubernetes` 集群，前端组、后端组、测试组都在使用它。这个时候就很容易命名冲突，比如后端组先创建了一个 `Pod` 叫 “Web”，这个名字就被“占用”了，之后前端组和测试组就只能绞尽脑汁再新起一个不冲突的名字。接着资源争抢也容易出现，比如某一天，测试组不小心部署了有 Bug 的应用，在节点上把资源都给“吃”完了，就会导致其他组的同事根本无法工作。

所以，当多团队、多项目共用 `Kubernetes` 的时候，为了避免这些问题的出现，我们就需要把集群给适当地“局部化”，为每一类用户创建出只属于它自己的“工作空间”。

如果把`Kubernetes` 比做一个大牧场的话，`API` 对象就是里面的鸡鸭牛羊，而名字空间就是圈养它们的围栏，有了各自合适的活动区域，就能更有效、更安全地利用 `Kubernetes`。

## 2. 如何使用名字空间

名字空间也是一种 `API` 对象，使用命令 `kubectl api-resources` 可以看到它的简称是 `ns`，

命令`kubectl create` 不需要额外的参数，可以很容易地创建一个名字空间，比如：

```java
kubectl create ns test-ns 
kubectl get ns
```

`Kubernetes` 初始化集群的时候也会预设 4 个名字空间：`default`、`kube-system`、`kube-public`、`kube-node-lease`。我们常用的是前两个，

- default 是用户对象默认的名字空间
- kube-system 是系统组件所在的名字空间

想要把一个对象放入特定的名字空间，需要在它的 `metadata` 里添加一个 `namespace` 字段，比如我们要在 `test-ns` 里创建一个简单的 `Nginx Pod` ，就要这样写：

```java
# ngx-pod.yml
apiVersion: v1
kind: Pod
metadata:
  name: ngx
  namespace: test-ns
spec:
  containers:
  - image: nginx:alpine
    name: ngx
```

`kubectl apply` 创建这个对象之后，我们直接用 `kubectl get` 是看不到它的，因为默认查看的是`default`名字空间，想要操作其他名字空间的对象必须要用 `-n` 参数明确指定：

因为名字空间里的对象都从属于名字空间，所以在删除名字空间的时候一定要小心，一旦名字空间被删除，它里面的所有对象也都会消失。

你可以执行一下 `kubectl delete`，试着删除刚才创建的名字空间 `test-ns`：

就会发现删除名字空间后，它里面的 `Pod` 也会无影无踪了。

## 3. 什么是资源配额

有了名字空间，我们就可以像管理容器一样，给名字空间设定配额，把整个集群的计算资源分割成不同的大小，按需分配给团队或项目使用。

不过集群和单机不一样，除了限制最基本的 `CPU` 和内存，还必须限制各种对象的数量，否则对象之间也会互相挤占资源。

名字空间的资源配额需要使用一个专门的 `API` 对象，叫做 `ResourceQuota`，简称是 `quota`，

我们可以使用命令 `kubectl create` 创建一个它的样板文件：

```java
export out="--dry-run=client -o yaml"
kubectl create quota dev-qt $out
```

因为资源配额对象必须依附在某个名字空间上，所以在它的 `metadata` 字段里必须明确写出 `namespace`（否则就会应用到 `default` 名字空间）。

下面我们先创建一个名字空间 `dev-ns` ，再创建一个资源配额对象 `dev-qt` ：

```java
apiVersion: v1
kind: Namespace
metadata:
  name: dev-ns
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-qt
  namespace: dev-ns
spec:
  ... ...
```

`ResourceQuota` 对象的使用方式比较灵活，既可以限制整个名字空间的配额，也可以只限制某些类型的对象（使用 `scopeSelector`），今天我们看第一种，它需要在 `spec` 里使用 `hard` 字段，意思就是“硬性全局限制”。

在`ResourceQuota` 里可以设置各类资源配额，字段非常多，我简单地归了一下类，你可以课后再去官方文档上查找详细信息：

- CPU 和内存配额，使用 request.*、limits.*，这是和容器资源限制是一样的。
- 存储容量配额，使 requests.storage 限制的是 PVC 的存储总量，也可以用 persistentvolumeclaims 限制 PVC 的个数。
- 核心对象配额，使用对象的名字（英语复数形式），比如 pods、configmaps、secrets、services。
- 其他 API 对象配额，使用 count/name.group 的形式，比如 count/jobs.batch、count/deployments.apps。这里的 group 是指kubectl api-resources 中 APIVERSION 列中的内容，比如 deployment 的 APIVERSION 是 apps/v1 ，job 和 cronjob 的APIVERSION 是 batch/v1 。

下面的这个 YAML 就是一个比较完整的资源配额对象：

```java
# dev-quota.yml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-qt
  namespace: dev-ns
spec:
  hard:
    requests.cpu: 10
    requests.memory: 10Gi
    limits.cpu: 10
    limits.memory: 20Gi
    requests.storage: 100Gi
    persistentvolumeclaims: 100
    pods: 100
    configmaps: 100
    secrets: 100
    services: 10
    count/jobs.batch: 1
    count/cronjobs.batch: 1
    count/deployments.apps: 1
```

解释一下它为名字空间加上的全局资源配额：

- 所有 Pod 的需求总量最多是 10 个 CPU 和 10GB 的内存，上限总量是 10 个 CPU 和 20GB 的内存。
- 只能创建 100 个 PVC 对象，使用 100GB 的持久化存储空间。
- 只能创建 100 个 Pod，100 个 ConfigMap，100 个 Secret，10 个 Service。
- 只能创建 1 个 Job，1 个 CronJob，1 个 Deployment。

## 4. 如何使用资源配额

现在让我们用 `kubectl apply` 创建这个资源配额对象，然后用 `kubectl get` 查看，记得要用 `-n` 指定名字空间：

```java
kubectl apply -f dev-quota.yml
kubectl get quota -n dev-ns
```

你可以看到输出了 `ResourceQuota` 的全部信息，但都挤在了一起，看起来很困难，这时可以再用命令 `kubectl describe` 来查看对象，它会给出一个清晰的表格：

```java
kubectl describe quota -n dev-ns
```

现在让我们尝试在这个名字空间里运行两个 `busybox Job`，同样要加上 `-n` 参数：

```java
kubectl create job echo1 -n dev-ns --image=busybox -- echo hello
kubectl create job echo2 -n dev-ns --image=busybox -- echo hello
```

`ResourceQuota` 限制了名字空间里最多只能有一个 `Job`，所以创建第二个 `Job` 对象时会失败，提示超出了资源配额。

再用命令 `kubectl describe` 来查看，也会发现 `Job` 资源已经到达了上限：

不过，只要我们删除刚才的 `Job`，就又可以运行一个新的离线业务了：

同样的，这个 `dev-ns`里也只能创建一个 `CronJob` 和一个 `Deployment`。

## 5. 默认资源配额

学到这里估计你也发现了，在名字空间加上了资源配额限制之后，它会有一个合理但比较“烦人”的约束：要求所有在里面运行的 `Pod` 都必须用字段 `resources` 声明资源需求，否则就无法创建。

比如说，现在我们想用命令 `kubectl run` 创建一个 `Pod`：

```java
kubectl run ngx --image=nginx:alpine -n dev-ns
```

发现给出了一个 `Forbidden`的错误提示，说不满足配额要求。

`Kubernetes` 这样做的原因也很好理解，上一讲里我们说过，如果 `Pod` 里没有 `resources` 字段，就可以无限制地使用 `CPU` 和内存，这显然与名字空间的资源配额相冲突。为了保证名字空间的资源总量可管可控，`Kubernetes` 就只能拒绝创建这样的 `Pod` 了。

这个约束对于集群管理来说是好事，但对于普通用户来说却带来了一点麻烦，本来 `YAML` 文件就已经够大够复杂的了，现在还要再增加几个字段，再费心估算它的资源配额。如果有很多小应用、临时 `Pod` 要运行的话，这样做的人力成本就比较高，不是太划算。

那么能不能让 `Kubernetes` 自动为 `Pod` 加上资源限制呢？也就是说给个默认值，这样就可以省去反复设置配额的烦心事。

这个时候就要用到一个很小但很有用的辅助对象了—— `LimitRange`，简称是 `limits`，它能为 API 对象添加默认的资源配额限制。

你可以用命令 `kubectl explain limits` 来查看它的 `YAML` 字段详细说明，这里说几个要点：

- spec.limits 是它的核心属性，描述了默认的资源限制。
- type 是要限制的对象类型，可以是 Container、Pod、PersistentVolumeClaim。
- default 是默认的资源上限，对应容器里的 resources.limits，只适用于 Container。
- defaultRequest 默认申请的资源，对应容器里的 resources.requests，同样也只适用于 Container。
- max、min 是对象能使用的资源的最大最小值。

这个`YAML` 就示范了一个 `LimitRange` 对象：

```java
# dev-limits.yml
apiVersion: v1
kind: LimitRange
metadata:
  name: dev-limits
  namespace: dev-ns
spec:
  limits:
  - type: Container
    defaultRequest:
      cpu: 200m
      memory: 50Mi
    default:
      cpu: 500m
      memory: 100Mi
  - type: Pod
    max:
      cpu: 800m
      memory: 200Mi
```

它设置了每个容器默认申请 0.2 的 `CPU` 和 50MB 内存，容器的资源上限是 0.5 的 `CPU` 和 100MB 内存，每个 `Pod` 的最大使用量是 0.8 的 `CPU` 和 200MB 内存。

使用`kubectl apply` 创建 `LimitRange` 之后，再用 `kubectl describe` 就可以看到它的状态：

```java
kubectl describe limitranges -n dev-ns
```

现在我们就可以不用编写 `resources` 字段直接创建 `Pod` 了，再运行之前的 `kubectl run` 命令：

```java
kubectl run ngx --image=nginx:alpine -n dev-ns
```

有了这个默认的资源配额作为“保底”，这次就没有报错，`Pod` 顺利创建成功，用 `kubectl describe` 查看 `Pod` 的状态，也可以看到 `LimitRange` 为它自动加上的资源配额：

## 6. 总结

在我们的实验环境里，因为只有一个用户（也就是你自己），可以独占全部资源，所以使用名字空间的意义不大。

但是在生产环境里会有很多用户共同使用 `Kubernetes`，必然会有对资源的竞争，为了公平起见，避免某些用户过度消耗资源，就非常有必要用名字空间做好集群的资源规划了。

**1、** 名字空间是一个逻辑概念，没有实体，它的目标是为资源和对象划分出一个逻辑边界，避免冲突；

**2、**`ResourceQuota`对象可以为名字空间添加资源配额，限制全局的`CPU`、内存和`API`对象数量；

**3、**`LimitRange`对象可以为容器或者`Pod`添加默认的资源配额，简化对象的创建工作；

- 不是所有的 API 对象都可以划分进名字空间管理的，比如 Node, PV 等这样的全局资源就不属于任何名字空间。
- 因为 ResourceQuota 可以使用 scopeSelector 字段限制不同类型的对象，所以我们还可以在名字空间里设置多个不同策略的配额对象，更精细地控制资源。
- 在 LimitRange 对象里设置 max 字段可以有效地防止创建意外申请超量资源的对象。
- 不同 namespace 的 service，pod 可以通信吗？—— 当然是可以的，像 apiservier就在 kube-system。

## 7. 问答

**1、** 如果你是`Kubernetes`系统管理员，你会如何使用名字空间来管理生产集群呢？；

`namespace`属于逻辑隔离，生产上体现可以划分为基础中间件命名空间，其余按照业务系统划分。

**1、** 你觉得设置资源配额应该遵循什么样的基本原则？；

按照目前实施一些经验，机器通常会采用 `cpu`与内存形成一个固定比例，例如 8core,16G, 16core,32G, 然后会建议应用软件采用这个比例去配置 `request，limited`, 同时要求，`request`尽可能小些，可以容纳下更多应用，超过一些限额后，集群具备自动化弹性扩容，形成“超卖”。同理，资源配额也是建议这样的比例。

- limitrange 对 Container 的限制是指在容器级别限制资源，不是 Pod 级别。
- 不同 namespace 的对象 ，可能运行在同一 Node 上吧？—— 当然了，node 不归 namespace 管理。

文中“容器的资源上限是 0.5 的 CPU 和 100MB 内存，每个 Pod 的最大使用量是 0.8 的 CPU 和 200MB 内存。”， 前面部分是上限，后面部分是最大值，后边的大于前面的啊，不矛盾吗？

——一个 `Pod` 可以包含多个容器。

`k8s` 的 `namespace` 和容器的 `namespace` 有什么区别？

——`Kubernetes` 的 `namespace` 是一个逻辑管理的概念，而容器的 `namespace` 是一个实打实的隔离技术。
