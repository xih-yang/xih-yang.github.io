# 22、Kubernetes 实战 - 控制器之DaemonSet
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/22.html
- 分类：容器服务
- 分组：教程目录
## DaemonSet概念

一个DaemonSet确保所有（或部分）节点上运行分离舱的副本。将节点添加到群集时，会将Pods添加到它们。当节点从群集中删除时，这些Pod会被垃圾收集。删除DaemonSet将清除其创建的Pod。

## DaemonSet用法

DaemonSet的一些典型用法是：

- 在每个节点上运行集群存储守护程序
- 在每个节点上运行日志收集守护程序
- 在每个节点上运行一个节点监视守护程序

在一个简单的情况下，将覆盖所有节点的一个DaemonSet用于每种类型的守护程序。更为复杂的设置可能针对单个类型的守护程序使用多个DaemonSet，但是对于不同的硬件类型使用不同的标志和/或不同的内存和cpu请求。

## DaemonSet创建

```sh
# 
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd-elasticsearch
  namespace: kube-system
  labels:
    k8s-app: fluentd-logging
spec:
  selector:
    matchLabels:
      name: fluentd-elasticsearch
  template:
    metadata:
      labels:
        name: fluentd-elasticsearch
    spec:
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      containers:
      - name: fluentd-elasticsearch
        image: fluent/fluentd-kubernetes-daemonset:v1.7.1-debian-syslog-1.0
        resources:
          limits:
            memory: 200Mi
          requests:
            cpu: 100m
            memory: 200Mi
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      terminationGracePeriodSeconds: 30
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
kubectl create -f ./daemonset.yaml
kubectl get ds -n kube-system
```

**必需字段**

和所有其他 Kubernetes 配置一样，DaemonSet 需要 apiVersion、spec 、kind 和 metadata 字段。

**Pod 模板**

.spec 中唯一必需的字段是 .spec.template。

.spec.template 是一个 Pod 模板。 除了它是嵌套的，因而不具有 apiVersion 或 kind 字段之外，它与 Pod 具有相同的 schema。

除了Pod 必需字段外，在 DaemonSet 中的 Pod 模板必须指定合理的标签（查看 Pod 选择算符）。

在DaemonSet 中的 Pod 模板必须具有一个值为 Always 的 RestartPolicy。 当该值未指定时，默认是 Always。

**Pod 选择算符**

.spec.selector 字段表示 Pod 选择算符，它与 Job 的 .spec.selector 的作用是相同的。

从Kubernetes 1.8 开始，您必须指定与 .spec.template 的标签匹配的 Pod 选择算符。 用户不指定 Pod 选择算符时，该字段不再有默认值。 选择算符的默认值生成结果与 kubectl apply 不兼容。 此外，一旦创建了 DaemonSet，它的 .spec.selector 就不能修改。 修改 Pod 选择算符可能导致 Pod 意外悬浮，并且这对用户来说是费解的。

**spec.selector 是一个对象，如下两个字段组成：**

matchLabels - 与 ReplicationController 的 .spec.selector 的作用相同。

matchExpressions - 允许构建更加复杂的选择器，可以通过指定 key、value 列表以及将 key 和 value 列表关联起来的 operator。

当上述两个字段都指定时，结果会按逻辑与（AND）操作处理。

如果指定了 .spec.selector，必须与 .spec.template.metadata.labels 相匹配。 如果与后者不匹配，则 DeamonSet 会被 API 拒绝。

另外，通常不应直接通过另一个 DaemonSet 或另一个工作负载资源（例如 ReplicaSet） 来创建其标签与该选择器匹配的任何 Pod。否则，DaemonSet 控制器 会认为这些 Pod 是由它创建的。 Kubernetes 不会阻止你这样做。 你可能要执行此操作的一种情况是，手动在节点上创建具有不同值的 Pod 进行测试。

**仅在某些节点上运行 Pod**

如果指定了 .spec.template.spec.nodeSelector，DaemonSet 控制器将在能够与 Node 选择算符 匹配的节点上创建 Pod。 类似这种情况，可以指定 .spec.template.spec.affinity，之后 DaemonSet 控制器 将在能够与节点亲和性 匹配的节点上创建 Pod。 如果根本就没有指定，则 DaemonSet Controller 将在所有节点上创建 Pod。

## DaemonSet 的替代方案

**init 脚本**

直接在节点上启动守护进程（例如使用 init、upstartd 或 systemd）的做法当然是可行的。 不过，基于 DaemonSet 来运行这些进程有如下一些好处：

像所运行的其他应用一样，DaemonSet 具备为守护进程提供监控和日志管理的能力。

为守护进程和应用所使用的配置语言和工具（如 Pod 模板、kubectl）是相同的。

在资源受限的容器中运行守护进程能够增加守护进程和应用容器的隔离性。 然而，这一点也可以通过在容器中运行守护进程但却不在 Pod 中运行之来实现。 例如，直接基于 Docker 启动。

**裸Pod**

直接创建 Pod并指定其运行在特定的节点上也是可以的。 然而，DaemonSet 能够替换由于任何原因（例如节点失败、例行节点维护、内核升级） 而被删除或终止的 Pod。 由于这个原因，你应该使用 DaemonSet 而不是单独创建 Pod。

**静态 Pod**

通过在一个指定的、受 kubelet 监视的目录下编写文件来创建 Pod 也是可行的。 这类 Pod 被称为静态 Pod。 不像 DaemonSet，静态 Pod 不受 kubectl 和其它 Kubernetes API 客户端管理。 静态 Pod 不依赖于 API 服务器，这使得它们在启动引导新集群的情况下非常有用。 此外，静态 Pod 在将来可能会被废弃。

**Deployments**

DaemonSet 与 Deployments 非常类似， 它们都能创建 Pod，并且 Pod 中的进程都不希望被终止（例如，Web 服务器、存储服务器）。 建议为无状态的服务使用 Deployments，比如前端服务。 对这些服务而言，对副本的数量进行扩缩容、平滑升级，比精确控制 Pod 运行在某个主机上要重要得多。 当需要 Pod 副本总是运行在全部或特定主机上，并需要它们先于其他 Pod 启动时， 应该使用 DaemonSet。
