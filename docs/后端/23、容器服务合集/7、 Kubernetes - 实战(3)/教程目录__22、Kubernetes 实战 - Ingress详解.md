# 22、Kubernetes 实战 - Ingress详解
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/22.html
- 分类：容器服务
- 分组：教程目录
## 第一节 Ingress 介绍

前面已经提到，Service对集群之外暴露服务的主要方式有两种：NodePort和LoadBalancer，但是这两种方式，都有一定的缺点：

- NodePort方式的缺点是占用很多集群机器的端口，那么当集群服务变多的时候，这个缺点就会愈发明显
- LB方式的缺点是每个service需要一个LB，浪费、麻烦，并且需要kubernetes之外设备的支持。

基于这种现状，kubernetes提供了Ingress资源对象，Ingress只需要一个NodePort或者一个LB就可以满足暴露多个service的需求。工作机制如下：

实际上，Ingress相当于一个7层的负载均衡器，是kubernetes对反向代理的一个抽象，它的工作原理类似于Nginx，可以理解成在Ingress 里建立诸多映射规则，Ingress Controller通过监听这些配置规则并转化成Nginx

- ingress: kubernetes中的一个对象，作用是定义请求如何转发到service的规则
- ingress controller: 具体实现反向代理及负载均衡的程序，对ingress定义的规则进行解析，根据配置的规则来实现请求转发，实现方式很多，比如Nginx，Contour，Haproxy等

Ingress(以Nginx为例)的工作原理如下

**1、** 用户编写Ingress规则，说明哪些域名对应kubernetes集群中的哪些service；

**2、** Ingress控制器动态感知Ingress服务规则的变化，然后生成一段对应的Nginx配置；

**3、** Ingress控制器会将生成的Nginx配置写入到一个运行着的Nginx服务中，并动态更新；

**4、** 到此为止，其实真正在工作的就是一个Nginx了，内部配置了用户定义的请求转发规则；

## 第二节 Ingress 使用

### 1. 环境准备

```java
# 创建文件夹
[root@master ~]# mkdir ingress-controller
[root@master ~]# cd ingress-controller/
# 获取ingress-nginx
[root@master ingress-controller]# wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.30.0/deploy/static/mandatory.yaml
[root@master ingress-controller]# wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.30.0/deploy/static/provider/baremetal/service-nodeport.yaml
[root@master ingress-controller]# ls
mandatory.yaml  service-nodeport.yaml
[root@master ingress-controller]#
```

```java
# 创建ingress-nginx
[root@master ingress-controller]# kubectl apply -f ./
namespace/ingress-nginx created
configmap/nginx-configuration created
configmap/tcp-services created
configmap/udp-services created
serviceaccount/nginx-ingress-serviceaccount created
clusterrole.rbac.authorization.k8s.io/nginx-ingress-clusterrole created
role.rbac.authorization.k8s.io/nginx-ingress-role created
rolebinding.rbac.authorization.k8s.io/nginx-ingress-role-nisa-binding created
clusterrolebinding.rbac.authorization.k8s.io/nginx-ingress-clusterrole-nisa-binding created
deployment.apps/nginx-ingress-controller created
limitrange/ingress-nginx created
service/ingress-nginx created
# 查看ingress-nginx
[root@master ingress-controller]# kubectl get pod -n ingress-nginx
NAME                                        READY   STATUS    RESTARTS   AGE
nginx-ingress-controller-7f74f657bd-c2zwl   1/1     Running   0          3m16s
# 查看service
# 这里可以看到80对应的http端口(外部是30692)， 443对应的https端口(外部是30254)
[root@master ingress-controller]# kubectl get svc -n ingress-nginx
NAME            TYPE       CLUSTER-IP    EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx   NodePort   10.97.146.1   <none>        80:31586/TCP,443:32714/TCP   4m6s
```

### 2. 准备service和pod

为例后面的实验方便，创建如下图所示的模型

创建tomcat-nginx.yaml

```java
---
apiVersion: apps/v1  版本号
kind: Deployment   类型
metadata:  元数据
  name: nginx-deployment   rs名称
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
---
apiVersion: apps/v1  版本号
kind: Deployment   类型
metadata:  元数据
  name: tomcat-deployment   rs名称
  namespace: dev  所属命名空间
spec: 详情
  replicas: 3副本数量3
  selector:选择器，通过它指定该控制器管理哪些pod
    matchLabels:labels匹配规则,用于匹配template
      app: tomcat-pod
  template: 模板，当副本数量不足时，会根据模板创建pod副本
    metadata:
      labels:
        app: tomcat-pod
    spec:
      containers:
        - name: tomcat
          image: tomcat:8.5-jre10-slim
          ports:
            - containerPort: 8080
---
apiVersion: v1  版本号
kind: Service   类型
metadata:  元数据
  name: nginx-service   svc名称
  namespace: dev  所属命名空间
spec: 详情
  selector:选择器，通过它指定该控制器管理哪些pod
    app: nginx-pod
  clusterIP: None 将clusterIP设置为None，即可创建headliness Service
  type: ClusterIP
  ports:
    - port: 80   Service端口
      targetPort: 80pod端口
---
apiVersion: v1  版本号
kind: Service   类型
metadata:  元数据
  name: tomcat-service   svc名称
  namespace: dev  所属命名空间
spec: 详情
  selector:选择器，通过它指定该控制器管理哪些pod
    app: tomcat-pod
  clusterIP: None 将clusterIP设置为None，即可创建headliness Service
  type: ClusterIP
  ports:
    - port: 8080   Service端口
      targetPort: 8080
```

```java
# 创建 pod和service
[root@master ~]# kubectl create -f tomcat-nginx.yaml 
deployment.apps/nginx-deployment created
deployment.apps/tomcat-deployment created
service/nginx-service created
service/tomcat-service created
# 查看service
[root@master ~]# kubectl get svc -n dev
NAME             TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
nginx-service    ClusterIP   None         <none>        80/TCP     13s
tomcat-service   ClusterIP   None         <none>        8080/TCP   13s
```

### 3. http代理

创建ingress-http.yaml

```java
apiVersion: extensions/v1beta1  版本号
kind: Ingress   类型
metadata:  元数据
  name: ingress-http   svc名称
  namespace: dev  所属命名空间
spec: 详情
  rules:
    - host: nginx.abc.com
      http:
        paths:
          - path: /
            backend:
              serviceName: nginx-service
              servicePort: 80
    - host: tomcat.abc.com
      http:
        paths:
          - path: /
            backend:
              serviceName: tomcat-service
              servicePort: 8080
```

```java
# 创建ingress
[root@master ~]# kubectl create -f ingress-http.yaml 
ingress.extensions/ingress-http created
# 查看ingress
[root@master ~]# kubectl get ing ingress-http -n dev
NAME           HOSTS                          ADDRESS   PORTS   AGE
ingress-http   nginx.abc.com,tomcat.abc.com             80      17s
# 查看ingress详情
[root@master ~]# kubectl  describe ing ingress-http -n dev
Name:             ingress-http
Namespace:        dev
Address:          
Default backend:  default-http-backend:80 (<none>)
Rules:
  Host            Path  Backends
  ----            ----  --------
  nginx.abc.com   
                  /   nginx-service:80 (10.244.1.108:80,10.244.2.178:80,10.244.2.179:80)
  tomcat.abc.com  
                  /   tomcat-service:8080 (10.244.1.107:8080,10.244.1.109:8080,10.244.2.180:8080)
Annotations:
Events:  <none>
[root@master ~]# 
```

配置host域名

```java
192.168.88.100  nginx.abc.com
192.168.88.100  tomcat.abc.com
```

打开浏览器访问http://nginx.abc.com:31586/和http://tomcat.abc.com:31586/，（端口请查看ingress-nginx的80对应的端口）

```java
[root@master ~]# kubectl get svc ingress-nginx -n ingress-nginx
NAME            TYPE       CLUSTER-IP    EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx   NodePort   10.97.146.1   <none>        80:31586/TCP,443:32714/TCP   12m
[root@master ~]#
```

### 4. https代理

```java
# 生成证书
openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/C=CN/ST=BJ/L=BJ/O=nginx/CN=abc.com"
# 创建密钥
kubectl create secret tls tls-secret --key tls.key --cert tls.crt
```

创建ingress-https.yaml

```java
apiVersion: extensions/v1beta1  版本号
kind: Ingress   类型
metadata:  元数据
  name: ingress-https   svc名称
  namespace: dev  所属命名空间
spec: 详情
  tls:
    - hosts:
        - nginx.abc.com
        - tomcat.abc.com
      secretName: tls-secret指定密钥
  rules:
    - host: nginx.abc.com
      http:
        paths:
          - path: /
            backend:
              serviceName: nginx-service
              servicePort: 80
    - host: tomcat.abc.com
      http:
        paths:
          - path: /
            backend:
              serviceName: tomcat-service
              servicePort: 8080
```

```java
# 生成证书
[root@master ~]# openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/C=CN/ST=BJ/L=BJ/O=nginx/CN=abc.com"
Generating a 2048 bit RSA private key
.....................................................................................+++
.............+++
writing new private key to 'tls.key'
-----
# 创建密钥
[root@master ~]# kubectl create secret tls tls-secret --key tls.key --cert tls.crt
secret/tls-secret created
[root@master ~]# vim ingress-https.yaml
# 创建sevice
[root@master ~]# kubectl create -f ingress-https.yaml 
ingress.extensions/ingress-https created
# 查看ingress
[root@master ~]# kubectl get ing ingress-https -n dev
NAME            HOSTS                          ADDRESS   PORTS     AGE
ingress-https   nginx.abc.com,tomcat.abc.com             80, 443   15s
# 查看ingress详情，可以看到describe有一个TLS，表示https配置成功
[root@master ~]# kubectl describe ing ingress-https -n dev
Name:             ingress-https
Namespace:        dev
Address:          
Default backend:  default-http-backend:80 (<none>)
TLS:
  tls-secret terminates nginx.abc.com,tomcat.abc.com
Rules:
  Host            Path  Backends
  ----            ----  --------
  nginx.abc.com   
                  /   nginx-service:80 (10.244.1.118:80,10.244.2.195:80,10.244.2.197:80)
  tomcat.abc.com  
                  /   tomcat-service:8080 (10.244.1.116:8080,10.244.1.117:8080,10.244.2.196:8080)
Annotations:
Events:
  Type    Reason  Age   From                      Message
  ----    ------  ----  ----                      -------
  Normal  CREATE  30s   nginx-ingress-controller  Ingress dev/ingress-https
[root@master ~]# 
```

打开浏览器访问https://nginx.abc.com:32714/和https://tomcat.abc.com:32714/，（端口请查看ingress-nginx的443对应的端口）

```java
[root@master ~]# kubectl get svc -n ingress-nginx
NAME            TYPE       CLUSTER-IP    EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx   NodePort   10.97.146.1   <none>        80:31586/TCP,443:32714/TCP   38m
[root@master ~]# 
```

## 问题 遇到的问题

### 1. 最后打开浏览器无法访问

浏览器一直空转

排查发现ingress-http的镜像下载失败，使用官方镜像即可。

如果七牛的镜像无法下载，请使用官方镜像。

```java
# 七牛镜像(可能不可靠)
quay-mirror.qiniu.com/kubernetes-ingress-controller/nginx-ingress-controller:0.30.0
```

修改使用官方镜像：

```java
# 官方镜像(默认)
quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.30.0
```
