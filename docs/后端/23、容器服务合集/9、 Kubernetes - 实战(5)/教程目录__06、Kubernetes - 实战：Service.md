# 06、Kubernetes - 实战：Service
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/6.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes Service

Service的介绍

Service可以看作是一组提供相同服务的Pod对外的访问接口。借助Service，应用可以方便地实现服务发现和负载均衡。

service默认只支持4层负载均衡能力，没有7层功能。（可以通过Ingress实现）

ClusterIP：默认值，k8s系统给service自动分配的虚拟IP，只能在集群内部访问。

NodePort：将Service通过指定的Node上的端口暴露给外部，访问任意一个NodeIP:nodePort都将路由到ClusterIP。

LoadBalancer：在 NodePort 的基础上，借助 cloud provider 创建一个外部的负载均衡器，并将请求转发到 :NodePort，此模式只能在云服务器上使用。

ExternalName：将服务通过 DNS CNAME 记录方式转发到指定的域名（通过 spec.externlName 设定）。

## service的优化

Service 是由 kube-proxy 组件，加上 iptables 来共同实现的.

kube-proxy 通过 iptables 处理 Service 的过程，需要在宿主机上设置相当多的 iptables 规则，如果宿主机有大量的Pod，不断刷新iptables规则，会消耗大量的CPU资源。

IPVS模式的service，可以使K8s集群支持更多量级的Pod。

开启kube-proxy的ipvs模式：

```java
# yum install -y ipvsadm 			//所有节点安装
```

```java
kubectl edit cm kube-proxy -n kube-system	//修改IPVS模式
    修改： 43     mode: "ipvs"
```

由于有些pod已经在运行，因此需要更新kube-proxy pod：

```java
kubectl get pod -n kube-system |grep kube-proxy | awk '{system("kubectl delete pod "$1" -n kube-system")}'		//更新kube-proxy pod```
IPVS模式下，kube-proxy会在service创建后，在宿主机上添加一个虚拟网卡：kube-ipvs0，并分配service IP。kube-proxy通过linux的IPVS模块，以rr轮询方式调度service中的Pod。
```java 
ipvsadm -ln
```

## 二、Kubernetes Service实列

## ClusterIP service

在集群内部菜才能访问

首先创建pod：

```java
[root@server1 ~]# vim deployment.yaml 
[root@server1 ~]# cat deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-nginx
  labels:
    app: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: ikubernetes/myapp:v1
        ports:
        - containerPort: 80
[root@server1 ~]# kubectl apply -f deployment.yaml 
deployment.apps/deployment-nginx created
[root@server1 ~]# kubectl get pod -o wide
NAME                                READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
deployment-nginx-56d786cd98-fcmh9   1/1     Running   0          55s   10.244.2.34   server3   <none>           <none>
deployment-nginx-56d786cd98-pkvpg   1/1     Running   0          55s   10.244.1.32   server2   <none>           <none>
```

现在可以在集群内部访问这两个pod：

```java
[root@server1 ~]# kubectl run test -it --image=radial/busyboxplus
If you don't see a command prompt, try pressing enter.
/ curl 10.244.2.34
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
/ curl 10.244.1.32
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

创建service：（ClusterIP方式）：

```java
[root@server1 ~]# vim service.yaml
[root@server1 ~]# cat service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myservice
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:					#service与pod关联时使用的标签，此处设置的标签要和需要关联的pod标签相同
      app: nginx
  type: ClusterIP
[root@server1 ~]# kubectl apply -f service.yaml 
service/myservice created
```

service通过标签与pod关联，查看service状态：

```java
[root@server1 ~]# kubectl get svc
NAME         TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1     <none>        443/TCP   4d2h
myservice    ClusterIP   10.97.61.44   <none>        80/TCP    6s
```

可以看出service暴露出来的ip为10.97.61.44，只有在集群内部才可以通过这个ip访问pod：

```java
[root@server1 ~]# kubectl attach test -it 
If you don't see a command prompt, try pressing enter.
/ curl 10.97.61.44
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

## NodePort service

使用NodePort方式可以使我们在集群外访问集群内的pod

在上个实验时我们已经创建了一个ClusterIP方式的service，我们可以直接更改其方式：

```java
[root@server1 ~]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   4d3h
myservice    ClusterIP   10.111.87.107   <none>        80/TCP    84m
[root@server1 ~]# kubectl edit svc myservice 
```

再查看service状态：

```java
[root@server1 ~]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP        4d3h
myservice    NodePort    10.111.87.107   <none>        80:31549/TCP   84m
```

可以发现已经变成NodePort方式了，同时也可以看出端口为31549,再集群外部主机访问pod：

```java
[root@foundation63 Desktop]# curl 172.25.63.3:31549
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
[root@foundation63 Desktop]# curl 172.25.63.2:31549
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

访问两个节点的31549端口均可以访问到pod。

实验后删除：

```java
[root@server1 ~]# kubectl delete -f service.yaml 
service "myservice" deleted
```

同时也可以在创建service的时候就指定为NodePort的方式。

```java
[root@server1 ~]# vim service.yaml 
[root@server1 ~]# cat service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myservice
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:
      app: nginx
  type: NodePort			#指定方式
[root@server1 ~]# kubectl apply -f service.yaml 
service/myservice created             
[root@server1 ~]# kubectl get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP        4d3h
myservice    NodePort    10.103.247.110   <none>        80:30256/TCP   12s
```

## Kube-dns sevice

Kubernetes 在kube-system命名空间提供了一个 DNS Service。可以使用以下命令查看：

```java
kubectl get svc kube-dns -n kube-system
```

首先我们运行一个service方式为ClusterIP：

```java
[root@server1 ~]# vim service.yaml 
[root@server1 ~]# cat service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myservice
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:
      app: nginx
  type: ClusterIP
```

```java
[root@server1 ~]# kubectl apply -f service.yaml 
service/myservice created
[root@server1 ~]# kubectl get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP   4d3h
myservice    ClusterIP   10.105.237.243   <none>        80/TCP    23s
```

通过kube-dns我们可以通过直接访问service的名称来访问pod：

```java
[root@server1 ~]# kubectl attach test -it			#之前使用busyboxplus创建的pod
Defaulting container name to test.
Use 'kubectl describe pod/test -n default' to see all of the containers in this pod.
If you don't see a command prompt, try pressing enter.
/ nslookup myservice				#查看myservice的解析
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
Name:      myservice
Address 1: 10.105.237.243 myservice.default.svc.cluster.local
/ 
/ curl myservice.default.svc.cluster.local		#域名格式：$(servicename).$(namespace).svc.cluster.local，也可以直接访问myservice
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
/ curl myservice.default.svc.cluster.local/hostname.html
deployment-nginx-56d786cd98-fcmh9
/ curl myservice.default.svc.cluster.local/hostname.html
deployment-nginx-56d786cd98-tg2t6
/ curl myservice.default.svc.cluster.local/hostname.html
deployment-nginx-56d786cd98-pkvpg
/ curl myservice.default.svc.cluster.local/hostname.html
deployment-nginx-56d786cd98-k8psl
/ ping myservice				#直接访问myservice
PING myservice (10.105.237.243): 56 data bytes
64 bytes from 10.105.237.243: seq=0 ttl=64 time=0.140 ms
64 bytes from 10.105.237.243: seq=1 ttl=64 time=0.073 ms
```

可以看出通过服务名称可以直接访问pod并自动实现负载均衡。

实验后删除：

```java
[root@server1 ~]# kubectl delete -f service.yaml 
service "myservice" deleted
```

## Headless Service举例

Headless Service “无头服务” Headless Service不需要分配一个VIP，而是直接以DNS记录的方式解析出被代理Pod的IP地址。

域名格式： ( s e r v i c e n a m e ) . (servicename). (servicename).(namespace).svc.cluster.local

```java
[root@server1 ~]# vim service.yaml 
[root@server1 ~]# cat service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myservice
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:
    app: nginx
  clusterIP: None			#指定为Headless方式
[root@server1 ~]# kubectl apply -f service.yaml 
service/myservice created
[root@server1 ~]# kubectl get svc			#可以看出ip为none
NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   4d4h
myservice    ClusterIP   None         <none>        80/TCP    42s
```

可以直接通过service的名称直接访问到后端的pod：

```java
[root@server1 ~]# kubectl attach test -it
Defaulting container name to test.
Use 'kubectl describe pod/test -n default' to see all of the containers in this pod.
If you don't see a command prompt, try pressing enter.
/ nslookup myservice			#查看myservice的解析，可以看到后端的4个pod
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
Name:      myservice
Address 1: 10.244.2.35 10-244-2-35.myservice.default.svc.cluster.local
Address 2: 10.244.2.34 10-244-2-34.myservice.default.svc.cluster.local
Address 3: 10.244.1.32 10-244-1-32.myservice.default.svc.cluster.local
Address 4: 10.244.1.34 10-244-1-34.myservice.default.svc.cluster.local
/ curl myservice
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
/ curl myservice/hostname.html
deployment-nginx-56d786cd98-k8psl
/ curl myservice/hostname.html
deployment-nginx-56d786cd98-tg2t6
/ curl myservice/hostname.html
deployment-nginx-56d786cd98-pkvpg
/ curl myservice/hostname.html
deployment-nginx-56d786cd98-fcmh9		#可以看出可以实现负载均衡
```

当pod更新后依然可以解析：

```java
[root@server1 ~]# vim deployment.yaml 
[root@server1 ~]# cat deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-nginx
  labels:
    app: nginx
spec:
  replicas: 4
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: ikubernetes/myapp:v2			#更新到v2
        ports:
        - containerPort: 80
[root@server1 ~]# kubectl apply -f deployment.yaml 
```

```java
[root@server1 ~]# kubectl attach demo -it
Defaulting container name to demo.
Use 'kubectl describe pod/demo -n default' to see all of the containers in this pod.
If you don't see a command prompt, try pressing enter.
bash-4.3# 
bash-4.3# dig myservice.default.svc.cluster.local
```

实验后删除：

```java
[root@server1 ~]# kubectl delete -f service.yaml 
service "myservice" deleted
```

## LoadBalancer举例

从外部访问 Service 的第一种方式为NodePort，之前已经介绍过，下面介绍另外两种方式。

从外部访问 Service 的第二种方式，适用于公有云上的 Kubernetes 服务。这时候，你可以指定一个 LoadBalancer 类型的 Service。

```java
[root@server1 ~]# vim service.yaml 
[root@server1 ~]# cat service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myservice
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:
    app: nginx
  type: LoadBalancer
```

在service提交后，Kubernetes就会调用 CloudProvider 在公有云上为你创建一个负载均衡服务，并且把被代理的 Pod 的 IP地址配置给负载均衡服务做后端。

```java
[root@server1 ~]# kubectl apply -f service.yaml 
service/myservice created
[root@server1 ~]# kubectl get svc
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes   ClusterIP      10.96.0.1       <none>        443/TCP        4d4h
myservice    LoadBalancer   10.105.70.198   <pending>     80:31184/TCP   45s
```

实验后删除：

```java
[root@server1 ~]# kubectl delete svc myservice 
service "myservice" deleted
```

## ExternalName 举例

从外部访问的第三种方式叫做ExternalName，这种方式也可以使pod能够访问外部的地址。

```java
[root@server1 ~]# vim External.yaml 
[root@server1 ~]# cat External.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myservice
spec:
  type:  ExternalName
  externalName: www.baidu.com			#指定外部有效地址
```

接下来创建service：

```java
[root@server1 ~]# kubectl apply -f External.yaml 
service/myservice created
[root@server1 ~]# kubectl get svc
NAME         TYPE           CLUSTER-IP   EXTERNAL-IP     PORT(S)   AGE
kubernetes   ClusterIP      10.96.0.1    <none>          443/TCP   4d4h
myservice    ExternalName   <none>       www.baidu.com   <none>    6s
```

可以看出并没有分配ip地址，只是在dns里面更新了以下CNAME。

描述这样的做法有一个好处，即使需要访问的外部地址变了，也只需要更改service的yaml文件即可，依然可以通过访问myservice.default.svc.cluster.local来访问外部地址，如下：

```java
[root@server1 ~]# vim External.yaml 
[root@server1 ~]# cat External.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myservice
spec:
  type:  ExternalName
  externalName: www.qq.com			#外部网站变更
[root@server1 ~]# kubectl apply -f External.yaml 
service/myservice configured
```

ExternalName方式的service允许为其分配一个公有IP。

```java
[root@server1 ~]# vim service.yaml 
[root@server1 ~]# cat service.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myservice
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:
    app: nginx
  externalIPs:
    - 172.25.63.100			#指定的ip地址
[root@server1 ~]# kubectl apply -f service.yaml 
service/myservice created
[root@server1 ~]# kubectl get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP     PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1        <none>          443/TCP   4d4h
myservice    ClusterIP   10.106.224.140   172.25.63.100   80/TCP    10s
```

查看svc的状态说明指定成功，在集群外访问：

```java
[root@foundation63 Desktop]# curl 172.25.63.100
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
[root@foundation63 Desktop]# curl 172.25.63.100
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
[root@foundation63 Desktop]# curl 172.25.63.100
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```
