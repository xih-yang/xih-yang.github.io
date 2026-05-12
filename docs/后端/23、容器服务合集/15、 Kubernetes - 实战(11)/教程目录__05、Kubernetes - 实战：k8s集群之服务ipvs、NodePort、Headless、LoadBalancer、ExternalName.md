# 05、Kubernetes - 实战：k8s集群之服务ipvs、NodePort、Headless、LoadBalancer、ExternalName
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/5.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是service

Service可以看作是一组提供相同服务的Pod对外的访问接口。Service可以实现服务发现和负载均衡。但是service默认只支持4层负载均衡，没有7层功能，但是可以通过Ingress实现。

服务的几种类型：

（1）`ClusterIP`：默认值，k8s系统给service自动分配的虚拟IP，只能在集群内部访问，外部无法访问。

（2）`NodePort`：将Service通过指定的Node上的端口暴露给外部，访问任意一个节点IP+节点端口都将路由到ClusterIP，即可以实现外部的访问。

（3）`LoadBalancer`：在 NodePort 的基础上，借助 cloud provider 创建一个外部的负载均衡器，并将请求转发到 节点IP+节点端口，此模式只能在云服务器上使用。

（4）`ExternalName`：将服务通过 DNS CNAME 记录方式转发到指定的域名

## 2、IPVS模式的service实现

Service 是由每个节点的 kube-proxy 组件，加上 iptables 来共同实现的。kube-proxy 调用物理机中 iptables 的地址转发功能处理service，有一个service就会写入一个 iptables 规则，一旦宿主机有大量的pod，需要写入很多规则，这会消耗大量cpu资源，不理想。如果开启lvs的负载均衡，使用一个虚拟ip，这样会不写入iptables规则了，可以支持更多量级的Pod。

yuminstall -y ipvsadm，所有节点安装ipvs。

查看ipvs模块

```java
kubectl edit cm kube-proxy -n kube-system 	%编辑叫kube-proxy的cm
```

修改模式为ipvs模式

批量删除原来的副本，会自动重新创建，那么就会生效刚改的ipvs模式

```java
[root@server2 ~]# kubectl  apply  -f deployment.yml		%开启真正的后端
[root@server2 ~]# kubectl  apply  -f svc.yml 			%分配虚拟ip
service/mysvc created
[root@server2 ~]# cat svc.yml  
apiVersion: v1
kind: Service
metadata:
  name: mysvc
spec:
  ports:
    - name: TCP
      port: 80
      targetPort: 80
  selector:
    app: nginx		%这里看自己的标签是什么而改变
[root@server2 ~]# kubectl  describe  svc mysvc 		
%查看虚拟ip和真正的后端是谁，我这里虚拟ip是10.111.81.0
```

ipvsadm -ln查看

`curl 10.111.81.0`访问测试，可以看到整体是负载均衡的，

并且在ipvs的列表中可以看到访问的次数。

## 3、NodePort

kubectl edit svc mysvc编辑mysvc 的配置文件，修改类型为NodePort

kubectl get svc查看服务，可以看到mysvc的类型成功修改为NodePort。看到暴露的端口是30518

node端也可以看到暴露的端口

访问任意一个节点IP+节点端口都将路由到ClusterIP，可以实现外部的访问

进入容器中查看解析

可以查看kube-dns这个服务的后端就是两个core-dns

## 4、Headless无头模式

Headless Service不需要分配一个VIP，而是直接以DNS记录的方式解析出被代理Pod的IP地址。当Pod变化更新后，仍然可以解析

编辑headless.yaml文件

```java
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
spec:
  ports:
    - name: http
      port: 80
      targetPort: 80
  selector:
      app: nginx		%我的标签为nginx所以写这个
  clusterIP: None
```

利用headless.yaml文件创建nginx-svc服务

```java
[root@server2 ~]# kubectl  run demo --image=busyboxplus -it --restart=Never %创建交互pod并进入
If you don't see a command prompt, try pressing enter.
/ nslookup  nginx-svc			%查看解析
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
Name:      nginx-svc
Address 1: 10.244.1.54 10-244-1-54.nginx-svc.default.svc.cluster.local
Address 2: 10.244.1.55 10-244-1-55.mysvc.default.svc.cluster.local
Address 3: 10.244.1.56 10-244-1-56.mysvc.default.svc.cluster.local
/ curl nginx-svc			%访问测试成功
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
/ exit
```

也可以通过dig命令查看解析过程

## 5、LoadBalancer

你可以指定一个 LoadBalancer 类型的 Service，他直接给定IP来对外访问。

在harbor仓库中创建新项目metallb

在server1导入镜像并上传至仓库

成功上传到仓库

`kubectl edit configmap -n kube-system kube-proxy`进入修改kube-proxy的配置

批量删除之前的kube-proxy，控制器会自动重新建立，更新副本。创建metallb目录，进入

官网下载metallb.yaml，注意修改镜像路径

拉起pod

成功拉起后，有一个控制器，三个speaker

编辑configmap.yaml文件

```java
apiVersion: v1
kind: ConfigMap
metadata:
  namespace: metallb-system
  name: config
data:
  config: |
    address-pools:
    - name: default
      protocol: layer2
      addresses:
      - 172.25.11.10-172.25.11.20		%设定vip池
```

拉起configmap，查看

编辑lb-svr.yml 文件，建立svc，获取分配ip

```java
apiVersion: v1
kind: Service
metadata:
  name: lb-svc
spec:
  ports:
    - name: http
      port: 80
      targetPort: 80
  selector:
    app: nginx
  type: LoadBalancer
```

创建lb-svc服务，查看服务

访问分配的外部ip172.25.11.10，可以实现负载均衡

在service提交后，Kubernetes就会调用 CloudProvider 在公有云上为你创建一个负载均衡服务，并且把被代理的 Pod 的 IP地址配置给负载均衡服务做后端。

## 6、ExternalName

假如外部的域名变动了，内部跟着变动的东西太多，我们想设置ExternalName，创建一个服务，这个服务可以找到对应的外部的域名，我们内部只要找这个服务，这个服务就能找到外部的域名，外部的域名变化了也没事。

编辑ex-svc.yaml文件

创建服务，查看服务，外部ip的位置是www.westos.org

dig-t查看解析过程

kubectl edit svc my-service进入my-service，把ExternalName改为www.baidu.com

测试，更新过来了
