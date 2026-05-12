# 12、Kubernetes - 实战：Service介绍及演示
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/12.html
- 分类：容器服务
- 分组：教程目录
## Service

Kubernetes 的Service定义了这样一种抽象：一个 Pod 的逻辑分组，一种可以访问他们的策略 —— 微服务，这一组Pod能够被Service访问到，通常是通过tabel Selector匹配。

Service 能够提供负载均衡的能力，但是在使用上有以下的限制：

- 只提供四层负载均衡，不存在七层负载
- 负载的方式有通过 userspace、iptables转发 和 ipvs 转发三种，如果系统不支持 ipvs 模块，则会自动降级为iptables转发模式

userspace：client端访问Server Pod时需要将请求转发给kube-proxy，再有kube-proxy进行调度，同时apiServer也通过Porxy获取Node节点信息，这种模式下kube-proxy的压力非常大。

iptables：client端访问Server Pod直接通过iptables进行转发，无需经过kube-Proxy

ipvs：client端访问Server Pod直接通过ipvs进行转发，前提ipvs模块必须加载

### Service的类型

- ClusterIP：默认类型，自动分配一个仅Cluster内部能访问的虚拟ip
- NodePort：在ClusterIP基础上为Service在每台机器上绑定一个端口，这样外网就可以通过``:NodePort来访问该服务
- LoadBalancer：在NodePort的基础上，借助cloud provide创建一个外部负载均衡器，并将请求转发到``:NodePort
- ExternalName：把集群外部的服务引入到集群内部来，在集群内部直接使用，没有任何代理被创建，只有kubernetes1.7以上版本支持

### 示例

### clusterIP

vimsvc-deployment.yml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deploy
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      release: stabel
  template:
    metadata:
      labels:
        app: myapp
        release: stabel
        version: v1
    spec:
      containers:
      - name: myapp
        image: hub.vfancloud.com/test/myapp:v1
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: svc-cluster
  namespace: default
spec:
  type: ClusterIP
  selector:
    app: myapp
    release: stabel
  ports:
  - name: http
    port: 80
    targetPort: 80
```

### 创建、测试

```java
[root@Centos8 k8sYaml]# kubectl create -f svc-deployment.yml 
deployment.apps/myapp-deploy created
service/svc-cluster created
[root@Centos8 k8sYaml]# kubectl get deployment 
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
myapp-deploy   3/3     3            3           2m38s
[root@Centos8 k8sYaml]# kubectl get svc
NAME          TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
kubernetes    ClusterIP   10.96.0.1      <none>        443/TCP   49d
svc-cluster   ClusterIP   10.102.16.24   <none>        80/TCP    78s
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                           READY   STATUS    RESTARTS   AGE
myapp-deploy-b4d49f555-czbb5   1/1     Running   0          2m47s
myapp-deploy-b4d49f555-p97dk   1/1     Running   0          2m47s
myapp-deploy-b4d49f555-zcjtq   1/1     Running   0          2m47s
[root@Centos8 k8sYaml]# curl http://10.102.16.24/hostname.html
myapp-deploy-b4d49f555-zcjtq
[root@Centos8 k8sYaml]# curl http://10.102.16.24/hostname.html
myapp-deploy-b4d49f555-czbb5
[root@Centos8 k8sYaml]# curl http://10.102.16.24/hostname.html
myapp-deploy-b4d49f555-p97dk
```

### 不需要负载以及单独的ClusterIP时

vimsvc-cluNone.yml

```java
apiVersion: v1
kind: Service
metadata:
  name: svc-clunone
spec:
  clusterIP: "None"
  selector:
    app: myapp
    release: stabel
  ports:
  - port: 80
    targetPort: 80
```

### NodePort

vimsvc-nodeport.yml

```java
apiVersion: v1
kind: Service
metadata:
  name: svc-nodePort
  namespace: default
spec:
  type: NodePort
  selector:
    app: myapp
    release: stabel
  ports:
  - name: http
    port: 80  用于k8s集群内部服务之间相互访问端口
    targetPort: 80  实际web容器expose的端口
    nodePort: 30001  用于外部client访问，其会在k8s每个node节点开启30001
```

### 创建、测试

```java
[root@Centos8 k8sYaml]# kubectl create -f svc-nodeport.yml 
service/svc-nodeport created
[root@Centos8 k8sYaml]# kubectl get svc 
NAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes     ClusterIP   10.96.0.1       <none>        443/TCP        49d
svc-clunone    ClusterIP   None            <none>        80/TCP         7m37s
svc-cluster    ClusterIP   10.102.16.24    <none>        80/TCP         29m
svc-nodeport   NodePort    10.98.165.226   <none>        80:30001/TCP   6s
[root@Centos8 k8sYaml]# ipvsadm -ln | grep -A5 10.98.165.226
TCP  10.98.165.226:80 rr
  -> 10.244.3.78:80               Masq    1      0          0         
  -> 10.244.3.79:80               Masq    1      0          0         
  -> 10.244.3.80:80               Masq    1      0          0         
### 外网访问可以在浏览器中输入nodeip+端口即可
### 若网络不可达，在确认自己的svc创建全部正确的情况下，执行：
iptables -P FORWARD ACCEPT
### 执行完毕后，再次测试
```

### LoadBalancer

此Service类型主要功能为在Node的外部做一个负载均衡器，但是需要收费，了解即可。

### ExternalName

```java
apiVersion: v1
kind: Service
metadata:
  name: svc-external
  namespace: default
spec:
  type: ExternalName
  externalName: hub.vfancloud.com
```

## Pod访问svc的方式

当有需求Pod需要访问svc时，可以通过直接访问svc ip和svc name两种方式访问。

但由于svc ip是不固定的，当svc删除或者重建的时候，ip会发生改变，所以如果想固定的访问此svc，要使用coredns的方式，也就是访问svc name。

> 注意：使用coredns解析svc name时，要在Pod的资源清单中加入dnsPolicy: ClusterFirstWithHostNet 这个配置，该设置是使POD使用的k8s的dns，pod默认使用所在宿主主机使用的DNS(踩过的坑，不知道其他版本如何)

```java
## 当前svc
[root@Centos8 http]# kubectl get svc 
NAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
ingress-svc1   ClusterIP   10.102.201.28   <none>        80/TCP     25m
ingress-svc2   ClusterIP   10.104.176.12   <none>        8080/TCP   11m
## 当前pod
[root@Centos8 http]# kubectl get pod 
NAME                             READY   STATUS    RESTARTS   AGE
ingress-http1-549f9d6cdf-5d5wf   1/1     Running   0          25m
ingress-http1-549f9d6cdf-9bhkx   1/1     Running   0          25m
ingress-http1-549f9d6cdf-t75tw   1/1     Running   0          25m
ingress-http2-84b79f86c8-55hhw   1/1     Running   0          11m
ingress-http2-84b79f86c8-6jhl4   1/1     Running   0          11m
ingress-http2-84b79f86c8-7bf8w   1/1     Running   0          11m
### 前往ingress-svc2的pod内，访问ingress-svc1
## 第一种，访问ip
[root@Centos8 http]# kubectl exec -it ingress-http2-84b79f86c8-55hhw -- ping 10.102.201.28
PING 10.102.201.28 (10.102.201.28): 56 data bytes
64 bytes from 10.102.201.28: seq=0 ttl=64 time=0.114 ms
64 bytes from 10.102.201.28: seq=1 ttl=64 time=0.091 ms
64 bytes from 10.102.201.28: seq=2 ttl=64 time=0.082 ms
## 第二种，访问svc name，访问通，并成功解析到ip
[root@Centos8 http]# kubectl exec -it ingress-http2-84b79f86c8-55hhw -- ping ingress-svc1
PING ingress-svc1 (10.102.201.28): 56 data bytes
64 bytes from 10.102.201.28: seq=0 ttl=64 time=0.103 ms
64 bytes from 10.102.201.28: seq=1 ttl=64 time=0.149 ms
64 bytes from 10.102.201.28: seq=2 ttl=64 time=0.087 ms
```
