# 07、Kubernetes - 实战：ingress service（部署，访问，tls加密，认证，URL重定向）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/7.html
- 分类：容器服务
- 分组：教程目录
## 一、Ingress介绍

一种全局的、为了代理不同后端 Service 而设置的负载均衡服务，就是 Kubernetes 里的Ingress 服务。

Ingress由两部分组成：Ingress controller和Ingress服务。

Ingress Controller 会根据你定义的 Ingress 对象，提供对应的代理能力。业界常用的各种反向代理项目，比如 Nginx、HAProxy、Envoy、Traefik 等，都已经为Kubernetes 专门维护了对应的 Ingress Controller。以下选择nginx进行演示。

## 二、Ingress的部署

下载ingress controller定义文件：

```java
[root@server1 ~]# wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.30.0/deploy/static/mandatory.yaml		
```

先查看定义文件确定所需镜像：

```java
[root@server1 ~]# vim mandatory.yaml 
```

先将这个镜像拉取下来然后放更改文件种的镜像名称从私有仓库拉取。

在各节点拉取镜像：

```java
[root@server2 ~]# docker pull quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.30.0
```

```java
[root@server3 ~]# docker pull quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.30.0
```

应用ingress controller定义文件：

```java
[root@server1 ~]# kubectl apply -f mandatory.yaml
namespace/ingress-nginx created
```

应用后会创建一个名为ingress-nginx 的namespace：

等待一下查看pod状态：

```java
[root@server1 ~]# kubectl -n ingress-nginx get pod
NAME                                        READY   STATUS    RESTARTS   AGE
nginx-ingress-controller-5bb8fb4bb6-j26w5   1/1     Running   0          13s
```

可以看出ingress-controller已经正常运行，接下来运行ingress-service：

下载定义文件：

```java
[root@server1 ~]# wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.30.0/deploy/static/provider/baremetal/service-nodeport.yaml
应用定义文件：
[root@server1 ~]# kubectl apply -f service-nodeport.yaml 
service/ingress-nginx created
```

应用后查看svc状态：

```java
[root@server1 ~]# kubectl -n ingress-nginx get svc
NAME            TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx   NodePort   10.109.140.206   <none>        80:31899/TCP,443:32456/TCP   3s
```

可以看出这个service的方式时NodePort，因此在访问在这个服务的时候需要加端口31899.

接下来创建一个myservice服务：

创建一个名为myservice的服务使用默认方式ClusterIP：

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
[root@server1 ~]# kubectl apply -f service.yaml 
service/myservice created
```

之后创建ingress服务并将myservice添加为后端服务:

```java
[root@server1 ~]# vim ingresss.yaml 
[root@server1 ~]# cat ingresss.yaml 
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-demo
spec:
  backend:
    serviceName: myservice				#这个表示要调度的后端service的名称
    servicePort: 80						#myservice的端口
[root@server1 ~]# kubectl apply -f ingresss.yaml 
ingress.networking.k8s.io/ingress-demo created
```

现在基本的ingress集群已经部署成功，可以使用以下命令查看ingress服务：

[root@server1 ~]# kubectl get ingress

NAME CLASS HOSTS ADDRESS PORTS AGE

ingress-demo * 80 17s

之后测试访问：

```java
[root@foundation63 Desktop]# curl 172.25.63.3:31899
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
[root@foundation63 Desktop]# curl 172.25.63.3:31899
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```

访问成功。

## 三、添加域名访问ingress

单域名单服务

更改ingresss.yaml文件：

```java
[root@server1 ~]# vim ingresss.yaml 
[root@server1 ~]# cat ingresss.yaml 
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-demo
spec:
  backend:
    serviceName: myservice
    servicePort: 80
  rules:
  - host: www1.westos.org			#添加域名
    http:
      paths:
      - path: /
        backend:
          serviceName: myservice
          servicePort: 80
[root@server1 ~]# kubectl apply -f ingresss.yaml 
ingress.networking.k8s.io/ingress-demo configured
```

查看ingress发现已经有域名了：

```java
[root@server1 ~]# kubectl get ingress
NAME           CLASS    HOSTS             ADDRESS          PORTS   AGE
ingress-demo   <none>   www1.westos.org   10.109.140.206   80      47m
```

测试访问：

实验环境中需要提添加解析：

```java
[root@foundation63 Desktop]# vim /etc/hosts
[root@foundation63 Desktop]# cat /etc/hosts
172.25.63.3 www1.westos.org www2.westos.org www3.westos
```

访问：

```java
[root@foundation63 Desktop]# curl www1.westos.org:31899
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
[root@foundation63 Desktop]# curl www1.westos.org:31899
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```

多域名多个服务

创建两个服务service

```java
cat service.yml 
kind: Service
apiVersion: v1
metadata:
  name: myservice
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:
    app: myappv1
  type: ClusterIP
---
kind: Service
apiVersion: v1
metadata:
  name: myservice2
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:
    app: myappv2
  type: ClusterIP
[kubeadm@server1 mainfest]$ kubectl apply -f service.yml 
service/myservice created
service/myservice2 created
[kubeadm@server1 mainfest]$ kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   7d22h
myservice    ClusterIP   10.110.45.54    <none>        80/TCP    6s
myservice2   ClusterIP   10.103.62.115   <none>        80/TCP    6s
```

创建两个pod与两个service通过label相对应

```java
[kubeadm@server1 mainfest]$ vim pod2.yml 
[kubeadm@server1 mainfest]$ cat pod2.yml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-example
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myappv1
  template:
    metadata:
      labels:
        app: myappv1
    spec:
      containers:
      - name: myappv1
        image: myapp:v1
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-example2
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myappv2
  template:
    metadata:
      labels:
        app: myappv2
    spec:
      containers:
      - name: myappv2
        image: myapp:v2
[kubeadm@server1 mainfest]$ kubectl apply -f pod2.yml 
deployment.apps/deployment-example created
deployment.apps/deployment-example2 created
[kubeadm@server1 mainfest]$ kubectl describe svc myservice
Name:              myservice
Namespace:         default
Labels:            <none>
Annotations:       Selector:  app=myappv1
Type:              ClusterIP
IP:                10.110.45.54
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         10.244.1.56:80,10.244.2.84:80
Session Affinity:  None
Events:            <none>
[kubeadm@server1 mainfest]$ kubectl describe svc myservice2
Name:              myservice2
Namespace:         default
Labels:            <none>
Annotations:       Selector:  app=myappv2
Type:              ClusterIP
IP:                10.103.62.115
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         10.244.1.57:80,10.244.2.83:80
Session Affinity:  None
Events:            <none>
```

创建ingress，把两个service作为后端

```java
[kubeadm@server1 mainfest]$ vim ingress.yml 
[kubeadm@server1 mainfest]$ cat ingress.yml 
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress1
  annotations:
    kubernetes.io/ingress.class: "nginx"
spec:
  rules:
  - host: www1.red.org
    http:
      paths:
      - path: /
        backend:
          serviceName: myservice
          servicePort: 80
  - host: www2.red.org
    http:
      paths:
      - path: /
        backend:
          serviceName: myservice2
          servicePort: 80
[kubeadm@server1 mainfest]$ kubectl apply -f ingress.yml 
ingress.extensions/ingress1 created
[kubeadm@server1 mainfest]$ kubectl describe ingress ingress1 
Name:             ingress1
Namespace:        default
Address:          172.25.1.3
Default backend:  default-http-backend:80 (<error: endpoints "default-http-backend" not found>)
Rules:
  Host          Path  Backends
  ----          ----  --------
  www1.red.org  
                /   myservice:80 (10.244.1.56:80,10.244.2.84:80)
  www2.red.org  
                /   myservice2:80 (10.244.1.57:80,10.244.2.83:80)
Annotations:    kubernetes.io/ingress.class: nginx
Events:
  Type    Reason  Age    From                      Message
  ----    ------  ----   ----                      -------
  Normal  CREATE  2m17s  nginx-ingress-controller  Ingress default/ingress1
  Normal  UPDATE  83s    nginx-ingress-controller  Ingress default/ingress1
```

单域名多服务

目的是访问一个域名的不同路径时，调度到不同的服务，这里借用了后面学的URL重定向

```java
[root@server1 ~]# vim ingress3.yaml 
[root@server1 ~]# cat ingress3.yaml 
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: simple-fanout-example			#ingress服务名称
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: www3.westos.org				#定义域名
    http:
      paths:
      - path: /v1
        backend:
          serviceName: mynginx			#/v1路径对应的服务是mynginx
          servicePort: 80
      - path: /v2
        backend:
          serviceName: myservice		#/v2路径对应的服务是myservice
          servicePort: 80
[root@server1 ~]# kubectl apply -f ingress3.yaml 
ingress.networking.k8s.io/simple-fanout-example created
```

```java
[root@foundation63 Desktop]# curl www3.westos.org:31899/v1
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
[root@foundation63 Desktop]# curl www3.westos.org:31899/v2
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```

可以看出访问不同路径会被定位到不同的后端服务。

四。DaemonSet方式部署ingress-controller，并使用host network方式打通

每次访问时都需要加端口，很不方便，用DaemonSet结合nodeselector来部署ingress-controller到特定的node上，然后使用HostNetwork直接把该pod与宿主机node的网络打通，直接使用宿主机的80/433端口就能访问服务。

```java
优点是整个请求链路最简单，性能相对NodePort模式更好。
缺点是由于直接利用宿主机节点的网络和端口，一个node只能部署一个ingress-controller pod。
```

比较适合大并发的生产环境使用。

首先需要给作为调度器的节点加标签（这里使用server3作为调度节点）：

```java
[root@server1 ~]# kubectl get node --show-labels 		#查看节点标签
NAME      STATUS   ROLES    AGE    VERSION   LABELS
server1   Ready    master   7d7h   v1.18.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=server1,kubernetes.io/os=linux,node-role.kubernetes.io/master=
server2   Ready    <none>   7d7h   v1.18.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=server2,kubernetes.io/os=linux
server3   Ready    <none>   7d7h   v1.18.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=server3,kubernetes.io/os=linux
[root@server1 ~]# kubectl label nodes server3 ingress=nginx			#为server3添加ingress=nginx的标签
[root@server1 ~]# kubectl get node --show-labels 
NAME      STATUS   ROLES    AGE    VERSION   LABELS
server1   Ready    master   7d7h   v1.18.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=server1,kubernetes.io/os=linux,node-role.kubernetes.io/master=
server2   Ready    <none>   7d7h   v1.18.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/arch=amd64,kubernetes.io/hostname=server2,kubernetes.io/os=linux
server3   Ready    <none>   7d7h   v1.18.1   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,ingress=nginx,kubernetes.io/arch=amd64,kubernetes.io/hostname=server3,kubernetes.io/os=linux
```

可以看出在server3上添加了一个ingress=nginx的标签。

然后需要更改ingress controller部署文件：

[root@server1 ~]# vim mandatory.yaml

不能直接去更新，我们需要把原来生成的deployments删除：

```java
[root@server1 ~]# kubectl -n ingress-nginx get deployments.apps 
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
nginx-ingress-controller   1/1     1            1           3d2h
[root@server1 ~]# kubectl -n ingress-nginx delete deployments.apps nginx-ingress-controller
deployment.apps "nginx-ingress-controller" deleted
```

之后应用这个部署文件

```java
[root@server1 ~]# kubectl apply -f mandatory.yaml 
namespace/ingress-nginx unchanged
configmap/nginx-configuration unchanged
configmap/tcp-services unchanged
configmap/udp-services unchanged
serviceaccount/nginx-ingress-serviceaccount unchanged
clusterrole.rbac.authorization.k8s.io/nginx-ingress-clusterrole unchanged
role.rbac.authorization.k8s.io/nginx-ingress-role unchanged
rolebinding.rbac.authorization.k8s.io/nginx-ingress-role-nisa-binding unchanged
clusterrolebinding.rbac.authorization.k8s.io/nginx-ingress-clusterrole-nisa-binding unchanged
daemonset.apps/nginx-ingress-controller created
limitrange/ingress-nginx configured
```

这时可以在server3查看端口使用情况：

发现nginx直接使用的宿主机的80和443的端口

我们现在可以以这样的形式访问：

```java
[root@foundation63 kiosk]# curl www1.westos.org				#注：解析指向server3
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
[root@foundation63 kiosk]# curl www1.westos.org/hostname.html
deployment-nginx-868855d887-gmxcr
[root@foundation63 kiosk]# curl www1.westos.org/hostname.html
deployment-nginx-868855d887-c48cq
```

不用加端口就能访问服务。

## 五 Ingress nginx控制器加密部署

首先建立加密文件保存目录

```java
[root@server1 ~]# mkdir ingress
[root@server1 ~]# cd ingress/
[root@server1 ingress]# mkdir certs
[root@server1 ingress]# cd certs/
```

生成tls密钥和证书：

```java
[root@server1 certs]# openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=nginxsvc/O=nginxsvc"
Generating a 2048 bit RSA private key
....+++
.................................+++
writing new private key to 'tls.key'
-----
[root@server1 certs]# ls		#生成后查看
tls.crt  tls.key
```

将生成的证书和key保存到secret里面：

```java
[root@server1 certs]# kubectl create secret tls tls-secret --key tls.key --cert tls.crt
secret/tls-secret created
[root@server1 certs]# kubectl get secrets 		#查看secret
NAME                  TYPE                                  DATA   AGE
default-token-25448   kubernetes.io/service-account-token   3      7d8h
tls-secret            kubernetes.io/tls                     2      15s
[root@server1 certs]# kubectl describe secrets tls-secret 		#查看详细信息
Name:         tls-secret
Namespace:    default
Labels:       <none>
Annotations:  <none>
Type:  kubernetes.io/tls
Data
====
tls.crt:  1143 bytes
tls.key:  1704 bytes
```

编辑ingress部署文件：

```java
[root@server1 ingress]# vim ingresss.yaml 
[root@server1 ingress]# cat ingresss.yaml 
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-demo
spec:
  tls:
    - hosts:
      - www1.westos.org
      secretName: tls-secret			#刚才生成的secret名称
  rules:
  - host: www1.westos.org
    http:
      paths:
      - path: /
        backend:
          serviceName: myservice
          servicePort: 80
```

应用部署文件：

```java
[root@server1 ingress]# kubectl apply -f ingresss.yaml
ingress.networking.k8s.io/ingress-demo configured
```

查看服务状态：

可以看出已经有了tls加密。

注意：当我们部署了加密后，默认访问80端口会被重定向到443端口。

此时可以在浏览器输入www1.westos.org 测试访问

## 六、 Ingress nginx控制器认证部署

这里使用基础认证的方式。

首先安装所需软件：

```java
[root@server1 ingress]# yum install httpd-tools -y
```

创建认证用户：

```java
[root@server1 ingress]# htpasswd -c auth xzt			#再次添加用户时不需要-c选项
New password: 				#输入两边密码
Re-type new password: 
Adding password for user xzt
```

查看生成的认证文件：

```java
[root@server1 ingress]# cat auth 
[root@server1 ingress]# kubectl create secret generic basic-auth --from-file=auth
secret/basic-auth created
[root@server1 ingress]# kubectl describe secrets basic-auth 
```

编辑部署文件：

```java
[root@server1 ingress]# vim ingresss.yaml 
[root@server1 ingress]# cat ingresss.yaml 
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: ingress-demo
  annotations:
    type of authentication  认证方式为基础认证
    nginx.ingress.kubernetes.io/auth-type: basic			
    name of the secret that contains the user/password definitions	包含用户名和密码的secret名称
    nginx.ingress.kubernetes.io/auth-secret: basic-auth
    message to display with an appropriate context why the authentication is required 认证显示，可以任意指定
    nginx.ingress.kubernetes.io/auth-realm: 'Authentication Required - cl'
spec:
  tls:
    - hosts:
      - www1.westos.org
      secretName: tls-secret
  rules:
  - host: www1.westos.org
    http:
      paths:
      - path: /
        backend:
          serviceName: myservice
          servicePort: 80
```

应用部署文件：

```java
[root@server1 ingress]# kubectl apply -f ingresss.yaml 
ingress.networking.k8s.io/ingress-demo configured
```

浏览器输入地址www1.westos.org 进行测试

## 七、 URL重定向

**1、** 简单重写；

要求重写的策略是：访问www1.westos.org时重写到www1.westos.org/hostname.html

编辑部署文件：

```java
[root@server1 ingress]# vim ingress3.yaml 
[root@server1 ingress]# cat ingress3.yaml 
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: rewrite-example
  annotations:
    nginx.ingress.kubernetes.io/app-root: /hostname.html			#重写地址
spec:
  rules:
  - host: www1.westos.org
    http:
      paths:
      - path: /						#访问地址
        backend:
          serviceName: myservice
          servicePort: 80
```

应用：

```java
[root@server1 ingress]# kubectl apply -f ingress3.yaml 
ingress.networking.k8s.io/rewrite-example configured
```

测试访问：

```java
[root@foundation63 kiosk]# curl www1.westos.org -L			#-L	表示显示重定向内容
deployment-nginx-868855d887-gmxcr
[root@foundation63 kiosk]# curl www1.westos.org -L
deployment-nginx-868855d887-c48cq
[root@foundation63 kiosk]# curl -v www1.westos.org -L			#查看重写过程：
```

可以看出成功重写。

**2、** 使用正则表达式重定向；

以上部署文件中的重定向规则示例：

```java
www1.westos.org/demo 重定向到 www1.westos.org/
www1.westos.org/demo/ 重定向到 www1.westos.org/
www1.westos.org/demo/new 重定向到 www1.westos.org/new
```

编辑部署文件：

```java
[root@server1 ingress]# vim ingress3.yaml 
[root@server1 ingress]# cat ingress3.yaml 
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: rewrite-example
  annotations:
   nginx.ingress.kubernetes.io/app-root: /hostname.html
    nginx.ingress.kubernetes.io/rewrite-target: /$2		#重定向地址
spec:
  rules:
 - host: www1.westos.org
    http:
      paths:
      - path: /demo(/|$)(.*)			#访问地址
        backend:
          serviceName: myservice
          servicePort: 80
```

应用部署文件：

```java
[root@server1 ingress]# kubectl apply -f ingress3.yaml 
ingress.networking.k8s.io/rewrite-example configured
```

测试访问：
