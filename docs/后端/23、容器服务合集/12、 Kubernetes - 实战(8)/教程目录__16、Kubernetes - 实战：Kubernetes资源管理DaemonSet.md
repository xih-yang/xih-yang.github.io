# 16、Kubernetes - 实战：Kubernetes资源管理DaemonSet
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/16.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes DaemonSet（部署守护进程）

- 在每一个Node上运行一个Pod,或者是匹配的节点上部署一个Pod。
- 新加入的Node也同样会自动运行一个Pod。

应用场景：
- Agent
- 运行集群存储的daemon，比如ceph或者glusterd
- 节点的CNI网络插件，calico
- 节点监控：node exporter
- 节点日志收集：fluentd或filebeat
- 服务暴露：部署一个ingress nginx

官方文档：[https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)

## 二、案例

### 1、创建yaml文件

```java
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: ds-test
  labels:
    app: filebeat
spec:
  标签选择器
  selector:
    matchLabels:
      app: filebeat
  标签类型
  template:
    metadata:
      labels:
        app: filebeat
    spec:
      配置容器
      containers:
      - name: logs
      containers:
      - image: nginx
        ports:
        - containerPort: 80
        挂载目录
        volumeMounts:
        - name: varlog
          mountPath: /tmp/log
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
```

### 2、创建容器

```java
kubectl apply -f ds.yaml
```

### 3、查看pod

```java
kubectl get pods
NAME READY STATUS RESTARTS AGE
ds-test-8487j 1/1 Running 0 8s
ds-test-lkflr 1/1 Running 0 8s
```

### 4、进入容器测试挂在

```java
kubectl exec -it ds-test-8487j bash
root@ds-test-8487j:/# ls /tmp/log/
anaconda    cron-20190825 secure
audit    dmesg    secure-20190825
boot.log    dmesg.old    spooler
boot.log-20190822 firewalld    spooler-20190825
boot.log-20190823 grubby_prune_debug tallylog
boot.log-20190824 lastlog    tuned
boot.log-20190825 maillog    vmware-vgauthsvc.log.0
boot.log-20190827 maillog-20190825 vmware-vmsvc.log
btmp    messages    wtmp
chrony    messages-20190825 yum.log
containers    pods
cron    rhsm
```
