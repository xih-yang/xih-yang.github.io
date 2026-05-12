# 10、Kubernetes 实战 - Pod端口设置
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/10.html
- 分类：容器服务
- 分组：教程目录
## 端口设置

ports支持的子选项

```java
[root@master ~]# kubectl explain pod.spec.containers.ports
KIND:     Pod
VERSION:  v1
RESOURCE: ports <[]Object>
FIELDS:
   containerPort	<integer> -required-
     Number of port to expose on the pod's IP address. This must be a valid port
     number, 0 < x < 65536.
    容器要监听的端口号(0<x<65536)
   hostIP	<string>
     What host IP to bind the external port to.
    要将外部端口绑定到主机IP(一般省略)
   hostPort	<integer>
     Number of port to expose on the host. If specified, this must be a valid
     port number, 0 < x < 65536. If HostNetwork is specified, this must match
     ContainerPort. Most containers do not need this.
    容器要在主机上公开的端口，如果设置，主机上只能运行容器的一个副本(一般省略)
   name	<string>
     If specified, this must be an IANA_SVC_NAME and unique within the pod. Each
     named port in a pod must have a unique name. Name for the port that can be
     referred to by services.
	端口名称，如果要指定，必须保证name在pod中式唯一的
   protocol	<string>
     Protocol for port. Must be UDP, TCP, or SCTP. Defaults to "TCP".
    端口协议。必须式UDP、TCP或者SCTP。默认是TCP
[root@master ~]# 
```

创建pod-ports.yaml文件，内容如下

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-ports
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
      ports:
        - name: nginx-port
          containerPort: 80
          protocol: TCP
```

创建pod

```java
kubectl create -f pod-ports.yaml
```

查看pod的详细信息

```java
kubectl get pods pod-ports -n dev -o yaml
```

访问容器中的程序需要使用的是podIp:containerPort
