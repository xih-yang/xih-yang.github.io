# 11、Kubernetes 实战 - Pod资源配额
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/11.html
- 分类：容器服务
- 分组：教程目录
## 容器资源配额

容器中的程序要运行，肯定是要占用一定的资源的，比如cpu和内存等，如果不对某个容器的资源做限制，那么它肯定要消耗大量资源，导致其它容器无法运行。针对这种情况，kubernetes提供了对内存和cpu的资源进行配额的机制，这种机制主要通过resources选项实现，他有两个子选项

**limits**: 用于限制运行时容器的最大占用资源，当容器占用资源超过limits时会被终止，并运行重启

**requests**: 用于设置容器需要的最小资源，如果环境资源不够，容器将无法启动

可以通过上面两个选项设置资源的上下限。

编写一个测试案例，创建pod-resources.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-resources
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
      resources: 资源配额
        limits:   资源上限
          cpu: "2" cpu限制，单位是core数
          memory: "512Mi"  内存限制
        requests: 请求资源下限
          cpu: "1" cpu限制，单位core数
          memory: "16Mi" 内存限制
```

创建pod，并查看

```java
kubectl create -f pod-resources.yaml
```

我们把内存调整为16G，看是否可以启动

很显然实际内存不够，不能够启动。

**cpu和memory的单位**

- cpu: core数，可以为整数或者小数
- memory：内存大小，可以使用Gi、Mi、G、M等
