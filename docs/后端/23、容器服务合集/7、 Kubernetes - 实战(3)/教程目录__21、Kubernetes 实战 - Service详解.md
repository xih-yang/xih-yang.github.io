# 21、Kubernetes 实战 - Service详解
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/21.html
- 分类：容器服务
- 分组：教程目录
## 前言

Kubernetes的流控负载组件:Service和Ingress。

## 第一节 Service介绍

在kubenetes中，pod是应用程序的载体，我们可以通过pod的ip来访问应用程序，但是pod的ip地址不是固定的，这也就意味着不方便直接采用pod的ip对服务进行访问。

为了解决这个问题，kubenetes提供了Service资源，Service会对提供同一个服务的多个pod进行聚合，并且提供一个统一的入口地址。通过访问Service的入口地址就能访问到后面的pod服务。

Service在很多情况下只是一个概念，真正起作用的其实是kube-proxy服务进程，每个Node节点都运行着一个kube-proxy服务进程。当创建Service的时候会通过api-server向etcd写入创建的service的信息，而kube-prooxy会基于监听的机制发现这种Service的变动，然后它会将最新的Service信息转换成对应的访问规则。

**kube-proxy目前支持三种工作模式**

- **userspace模式**

userspace模式下，kube-proxy会为每一个Service创建一个监听端口，发向Cluster IP的请求被iptables规则重定向到kube-proxy监听的端口上，kube-proxy根据LB算法选择一个提供服务的Pod并和其建立链接，以将请求转发到Pod上。

该模式下，kube-proxy充当了一个四层负责均衡器的角色。由于kubbe-proxy运行在userspace中，在进行转发处理时会增加内核和用户空间之间的数据拷贝，虽然比较稳定，但是效率比较低。
- **iptables 模式**

iptables模式下，kube-proxy为service后端的每个Pod创建对应的iptables规则，直接将发向Cluster IP的请求重定向到一个Pod IP。

该模式下kube-proxy不承担四层负责均衡器的角色，只负责创建iptables规则。该模式的优点是较userspace模式效率更高，但不能提供灵活的 LB策略，当后端Pod不可用时也无法进行重试。
- **ipvs模式**

ipvs模式和iptables类似，kube-proxy监控Pod的变化并创建相应的ipvs规则。ipvs相对iptables转发效率更高。除此之外，ipvs支持更多的LB算法。

此模块必须安装ipvs内核，否则会降级为iptables

如果未安装ipvs，则先安装ipvs

```java
[root@master ~]# ipvsadm -ln
-bash: ipvsadm: 未找到命令
[root@master ~]# yum list installed | grep ipvsadm
[root@master ~]# yum -y install ipvsadm
[root@master ~]# ipvsadm -ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
```

#开启ipvs

```java
[root@master ~]# kubectl edit cm kube-proxy -n kube-system
configmap/kube-proxy edited
```

修改配置，将mode改为ipvs

删除pod后，自动重建

```java
[root@master ~]# kubectl delete pod -l k8s-app=kube-proxy -n kube-system
pod "kube-proxy-cmmpk" deleted
pod "kube-proxy-qh7qf" deleted
pod "kube-proxy-t68kh" deleted
[root@master ~]# ipvsadm -Ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
TCP  172.17.0.1:31966 rr
  -> 10.244.1.102:80              Masq    1      0          0         
TCP  192.168.88.100:31966 rr
  -> 10.244.1.102:80              Masq    1      0          0         
TCP  192.168.88.100:32437 rr
  -> 10.244.1.101:80              Masq    1      0          0         
TCP  10.96.0.1:443 rr
  -> 192.168.88.100:6443          Masq    1      0          0         
TCP  10.96.0.10:53 rr
  -> 10.244.0.9:53                Masq    1      0          0         
  -> 10.244.0.10:53               Masq    1      0          0         
TCP  10.96.0.10:9153 rr
  -> 10.244.0.9:9153              Masq    1      0          0         
  -> 10.244.0.10:9153             Masq    1      0          0         
TCP  10.100.21.23:443 rr
  -> 192.168.88.101:443           Masq    1      0          0         
TCP  10.105.96.25:80 rr
  -> 10.244.1.102:80              Masq    1      0          0         
TCP  10.108.225.48:80 rr
  -> 10.244.1.101:80              Masq    1      0          0         
TCP  10.244.0.0:31966 rr
  -> 10.244.1.102:80              Masq    1      0          0         
TCP  10.244.0.0:32437 rr
  -> 10.244.1.101:80              Masq    1      0          0         
TCP  10.244.0.1:31966 rr
  -> 10.244.1.102:80              Masq    1      0          0         
TCP  10.244.0.1:32437 rr
  -> 10.244.1.101:80              Masq    1      0          0         
TCP  127.0.0.1:31966 rr
  -> 10.244.1.102:80              Masq    1      0          0         
TCP  127.0.0.1:32437 rr
  -> 10.244.1.101:80              Masq    1      0          0         
TCP  172.17.0.1:32437 rr
  -> 10.244.1.101:80              Masq    1      0          0         
UDP  10.96.0.10:53 rr
  -> 10.244.0.9:53                Masq    1      0          0         
  -> 10.244.0.10:53               Masq    1      0          0         
[root@master ~]# 
```

## 第二节 Serice资源清单

Service的资源清单文件

```java
apiVersion: v1 版本号
kind: Service  类型
metadata:   元数据
  name: svc-service service名称
  namespace: dev 命名空间
spec: 详情
  selector:标签选择器，用于确定当前Service代理哪些pod
    app: nginx
  type:Service类型，指定service的访问方式
  clusterIP: 虚拟服务的ip地址
  sessionAffinity:session亲和性，支持ClientIP、Node两个选项
  ports:端口信息
    - protocol: TCP
      port: 3017       service端口
      targetPort: 5003 pod端口
      nodePort: 31122  主机端口
```

- ClusterIP: 默认值，它是kubernetes系统自动分配的虚拟IP，只能在集群内部访问
- NodePort: 将Service通过指定的Node上的端口暴露给外部，通过此方法，就可以在集群外部访问服务
- LoadBalancer: 使用外部负载均衡器完成到服务的负载分发，注意此模式需要外部云环境支持
- ExternalName: 把集群外部的服务引入集群内部，直接使用

## 第三节 试验准备

在使用service之前，首先利用Deployment创建出3个pod，注意要为pod设置app=nginx-pod的标签

创建deployment.yaml，内容如下

```java
apiVersion: apps/v1  版本号
kind: Deployment   类型
metadata:  元数据
  name: pc-deployment   rs名称
  namespace: dev  所属命名空间
spec: 详情
  replicas: 3副本数量3
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:labels匹配规则,用于匹配template
      app: nginx-pod
  template: 模板，当副本数量不足时，会根据模板创建pod副本
    metadata:
      labels:
        app: nginx-pod
    spec:
      containers:
        - name: nginx
          image: nginx:1.17.1
          ports:
            - containerPort: 80
```

```java
# 创建deployment
[root@master ~]# kubectl create -f deployment.yaml 
deployment.apps/pc-deployment created
# 查看pod
[root@master ~]# kubectl get pods -n dev -o wide
NAME                             READY   STATUS    RESTARTS   AGE   IP             NODE    NOMINATED NODE   READINESS GATES
pc-deployment-6696798b78-n79pg   1/1     Running   0          15s   10.244.2.176   node2   <none>           <none>
pc-deployment-6696798b78-qp7xk   1/1     Running   0          15s   10.244.1.106   node1   <none>           <none>
pc-deployment-6696798b78-xvz8l   1/1     Running   0          15s   10.244.2.175   node2   <none>           <none>
[root@master ~]# kubectl get pods -n dev -o wide --show-labels
NAME                             READY   STATUS    RESTARTS   AGE   IP             NODE    NOMINATED NODE   READINESS GATES   LABELS
pc-deployment-6696798b78-n79pg   1/1     Running   0          26s   10.244.2.176   node2   <none>           <none>            app=nginx-pod,pod-template-hash=6696798b78
pc-deployment-6696798b78-qp7xk   1/1     Running   0          26s   10.244.1.106   node1   <none>           <none>            app=nginx-pod,pod-template-hash=6696798b78
pc-deployment-6696798b78-xvz8l   1/1     Running   0          26s   10.244.2.175   node2   <none>           <none>            app=nginx-pod,pod-template-hash=6696798b78
```

通过curl命令访问pod

这里3个pod都一样，为了方便观察。修改nginx主页的内容。

```java
[root@master ~]# kubectl exec -it pc-deployment-6696798b78-n79pg -n dev /bin/sh
# echo "nginx 176" > /usr/share/nginx/html/index.html
# cat /usr/share/nginx/html/index.html
nginx 176
# exit
[root@master ~]# 
```

同理修改另外两个pod。

```java
完成之后，测试访问
[root@master ~]# kubectl get pods -n dev -o wide --show-labels
NAME                             READY   STATUS    RESTARTS   AGE   IP             NODE    NOMINATED NODE   READINESS GATES   LABELS
pc-deployment-6696798b78-n79pg   1/1     Running   0          96m   10.244.2.176   node2   <none>           <none>            app=nginx-pod,pod-template-hash=6696798b78
pc-deployment-6696798b78-qp7xk   1/1     Running   0          96m   10.244.1.106   node1   <none>           <none>            app=nginx-pod,pod-template-hash=6696798b78
pc-deployment-6696798b78-xvz8l   1/1     Running   0          96m   10.244.2.175   node2   <none>           <none>            app=nginx-pod,pod-template-hash=6696798b78
[root@master ~]# curl 10.244.2.176
nginx 176
[root@master ~]# curl 10.244.1.106
nginx 106
[root@master ~]# curl 10.244.2.175
nginx 175
[root@master ~]# 
```

## 第四节 ClusterIP类型的Service

创建service-clusterip.yaml文件

```java
apiVersion: v1  版本号
kind: Service   类型
metadata:  元数据
  name: service-clusterip   svc名称
  namespace: dev  所属命名空间
spec: 详情
  selector:选择器，通过它指定该控制器管理哪些pod
    app: nginx-pod
  clusterIP: 10.99.99.101 service的ip地址，如果不写，默认会生成一个
  type: ClusterIP
  ports:
    - port: 80   Service端口
      targetPort: 80pod端口
```

```java
# 创建service
[root@master ~]# kubectl create -f service-clusterip.yaml 
service/service-clusterip created
# 查看service
[root@master ~]# kubectl get svc service-clusterip -n dev
NAME                TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
service-clusterip   ClusterIP   10.99.99.101   <none>        80/TCP    37s
# 查看service详情
[root@master ~]# kubectl describe svc service-clusterip -n dev
Name:              service-clusterip
Namespace:         dev
Labels:            <none>
Annotations:       <none>
Selector:          app=nginx-pod
Type:              ClusterIP
IP:                10.99.99.101
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         10.244.1.106:80,10.244.2.175:80,10.244.2.176:80
Session Affinity:  None
Events:            <none>
[root@master ~]#
```

**Endpoint**

Endpoint是kubernetes中的一个资源对象，存储在etcd中，用来记录一个service对应的所有pod的访问地址，它是根据service配置文件中selector描述产生的。

一个service由一组pod 组成，这些pod通过Endpoints暴露处理， Endpoints是实现实际服务的端点集合。换句话说，service和pod之间的联系是通过endpoints实现的。

**负载的分发策略**

对service的访问被分发到了后端的Pod上去，目前kubernetes提供了两种负载分发策略

- 如果不定义，默认使用kube-proxy的策略，比如随机、轮询
- 基于客户端地址的会话保持模式，即来自同一个客户端发起的所有请求都会转发到固定的一个pod上，此模式可以在spec中添加**sessionAffinity:ClientIP**选项

```java
# 查看ipvs的映射规则(rr 轮询)
[root@master ~]# ipvsadm -Ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn  
TCP  10.99.99.101:80 rr
  -> 10.244.1.106:80              Masq    1      0          0         
  -> 10.244.2.175:80              Masq    1      0          0         
  -> 10.244.2.176:80              Masq    1      0          0    
# 发送请求
[root@master ~]#  for a in {1..10};do curl 10.99.99.101:80;sleep 2;done;
nginx 176
nginx 175
nginx 106
nginx 176
nginx 175
nginx 106
nginx 176
nginx 175
nginx 106
nginx 176
[root@master ~]#        
```

添加session亲和性

```java
sessionAffinity: ClientIP
```

```java
# 修改分发策略
[root@master ~]# vim service-clusterip.yaml 
[root@master ~]# kubectl apply -f service-clusterip.yaml 
Warning: kubectl apply should be used on resource created by either kubectl create --save-config or kubectl apply
service/service-clusterip configured
# 循环访问测试
[root@master ~]#  for a in {1..10};do curl 10.99.99.101:80;sleep 2;done;
nginx 175
nginx 175
nginx 175
nginx 175
nginx 175
nginx 175
nginx 175
nginx 175
nginx 175
nginx 175
[root@master ~]# kubectl describe svc service-clusterip -n dev
Name:              service-clusterip
Namespace:         dev
Labels:            <none>
Annotations:       kubectl.kubernetes.io/last-applied-configuration:
                     {
     "apiVersion":"v1","kind":"Service","metadata":{
     "annotations":{
     },"name":"service-clusterip","namespace":"dev"},"spec":{
     "clusterIP":"10.99....
Selector:          app=nginx-pod
Type:              ClusterIP
IP:                10.99.99.101
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         10.244.1.106:80,10.244.2.175:80,10.244.2.176:80
Session Affinity:  ClientIP
Events:            <none>
```

```java
# 删除service
[root@master ~]# kubectl delete -f service-clusterip.yaml 
service "service-clusterip" deleted
[root@master ~]# 
```

## 第五节 HeadLiness的Service

在某些常见下，开发人员可能不想使用Service提供的负载均衡功能，而希望自己来控制负载均衡策略，针对这种场景，kubernetes提供了HeadLiness Service，这类Service不会分配ClusterIP，如果想要访问service，只能通过service的域名进行查询。

创建service-headliness.yaml文件

```java
apiVersion: v1  版本号
kind: Service   类型
metadata:  元数据
  name: service-headliness   svc名称
  namespace: dev  所属命名空间
spec: 详情
  selector:选择器，通过它指定该控制器管理哪些pod
    app: nginx-pod
  clusterIP: None 将clusterIP设置为None，即可创建headliness Service
  type: ClusterIP
  ports:
    - port: 80   Service端口
      targetPort: 80pod端口
```

```java
# 创建service
[root@master ~]# kubectl create -f service-headliness.yaml 
service/service-headliness created
# 查看svc
[root@master ~]# kubectl get svc service-headliness -n dev
NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service-headliness   ClusterIP   None         <none>        80/TCP    15s
# 查看svc详情
[root@master ~]# kubectl describe svc service-headliness -n dev
Name:              service-headliness
Namespace:         dev
Labels:            <none>
Annotations:       <none>
Selector:          app=nginx-pod
Type:              ClusterIP
IP:                None
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         10.244.1.106:80,10.244.2.175:80,10.244.2.176:80
Session Affinity:  None
Events:            <none>
[root@master ~]# 
# 查看pod
[root@master ~]# kubectl get pods -n dev
NAME                             READY   STATUS    RESTARTS   AGE
pc-deployment-6696798b78-n79pg   1/1     Running   0          3h42m
pc-deployment-6696798b78-qp7xk   1/1     Running   0          3h42m
pc-deployment-6696798b78-xvz8l   1/1     Running   0          3h42m
# 查看域名的解析情况
[root@master ~]# kubectl exec -it pc-deployment-6696798b78-n79pg -n dev /bin/sh
# cat /etc/resolv.conf
nameserver 10.96.0.10
search dev.svc.cluster.local svc.cluster.local cluster.local
options ndots:5
# exit
# 域名解析
[root@master ~]# dig @10.96.0.10 service-headliness.dev.svc.cluster.local
; <<>> DiG 9.11.4-P2-RedHat-9.11.4-26.P2.el7 <<>> @10.96.0.10 service-headliness.dev.svc.cluster.local
; (1 server found)
;; global options: +cmd
;; Got answer:
;; WARNING: .local is reserved for Multicast DNS
;; You are currently testing what happens when an mDNS query is leaked to DNS
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 14590
;; flags: qr aa rd; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 1
;; WARNING: recursion requested but not available
;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;service-headliness.dev.svc.cluster.local. IN A
;; ANSWER SECTION:
service-headliness.dev.svc.cluster.local. 30 IN	A 10.244.1.106
service-headliness.dev.svc.cluster.local. 30 IN	A 10.244.2.175
service-headliness.dev.svc.cluster.local. 30 IN	A 10.244.2.176
;; Query time: 277 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: 一 10月 17 18:04:06 CST 2022
;; MSG SIZE  rcvd: 237
```

## 第六节 NodePort类型的Service

在之前的样例中，创建的Service的ip地址只有集群内部才可以访问，如果希望将Service暴露给集群外部使用，那么就要使用另外一个类型的Service，称为NodePort类型。NodePort的工作原理其实就是将service的端口映射到Node的一个端口上，然后就可以通过NodeIp:NodePort来访问service了。

创建service-nodeport.yaml

```java
apiVersion: v1  版本号
kind: Service   类型
metadata:  元数据
  name: service-nodeport   svc名称
  namespace: dev  所属命名空间
spec: 详情
  selector:选择器，通过它指定该控制器管理哪些pod
    app: nginx-pod
  type: NodePort
  ports:
    - port: 80   Service端口
      nodePort: 30002指定绑定的node的端口(默认的取值范围是30000~32767),如果不指定，会默认分配
      targetPort: 80pod端口
```

```java
# 创建service
[root@master ~]# kubectl create -f service-nodeport.yaml 
service/service-nodeport created
# 查看service
[root@master ~]# kubectl get svc -n dev -o wide
NAME               TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE   SELECTOR
service-nodeport   NodePort   10.103.202.187   <none>        80:30002/TCP   24s   app=nginx-pod
[root@master ~]# 
```

打开浏览器，访问192.168.88.100:30002（NodeIp:NodePort），可以看到请求被转到到了pod。

## 第七节 LoadBalancer类型的Service

LoadBalancer和NodePort很相似，目的都是向外部暴露一个端口，区别在于LoadBalancer会在集群的外部再来做一次负载均衡设备，而这个设备需要外部环境支持的，外部服务发送到这个设备的请求，会被设备负载之后转发到集群中。

## 第八节 ExternalName类型的Service

ExternalName类型的Service用于引入集群外部的服务，它通过externalName属性指定外部一个服务的地址，然后在集群内部访问此service就可以访问到外部的服务了。

创建service-externalname.yaml文件，内容如下

```java
apiVersion: v1  版本号
kind: Service   类型
metadata:  元数据
  name: service-externalname   svc名称
  namespace: dev  所属命名空间
spec: 详情
  type: ExternalName service类型
  externalName: www.baidu.com改成ip地址也可以
```

```java
# 创建service
[root@master ~]# kubectl create -f service-externalname.yaml
service/service-externalname created
# 查看service
[root@master ~]# kubectl get svc service-externalname -n dev
NAME                   TYPE           CLUSTER-IP   EXTERNAL-IP     PORT(S)   AGE
service-externalname   ExternalName   <none>       www.baidu.com   <none>    15s
# 查看service详情
[root@master ~]# kubectl describe svc service-externalname -n dev
Name:              service-externalname
Namespace:         dev
Labels:            <none>
Annotations:       <none>
Selector:          <none>
Type:              ExternalName
IP:                
External Name:     www.baidu.com
Session Affinity:  None
Events:            <none>
# 域名解析
[root@master ~]# dig @10.96.0.10 service-externalname.dev.svc.cluster.local
; <<>> DiG 9.11.4-P2-RedHat-9.11.4-26.P2.el7 <<>> @10.96.0.10 service-externalname.dev.svc.cluster.local
; (1 server found)
;; global options: +cmd
;; Got answer:
;; WARNING: .local is reserved for Multicast DNS
;; You are currently testing what happens when an mDNS query is leaked to DNS
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 6528
;; flags: qr aa rd; QUERY: 1, ANSWER: 4, AUTHORITY: 0, ADDITIONAL: 1
;; WARNING: recursion requested but not available
;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;service-externalname.dev.svc.cluster.local. IN A
;; ANSWER SECTION:
service-externalname.dev.svc.cluster.local. 30 IN CNAME	www.baidu.com.
www.baidu.com.		30	IN	CNAME	www.a.shifen.com.
www.a.shifen.com.	30	IN	A	14.215.177.39
www.a.shifen.com.	30	IN	A	14.215.177.38
;; Query time: 84 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: 二 10月 18 00:56:08 CST 2022
;; MSG SIZE  rcvd: 247
[root@master ~]# 
```
