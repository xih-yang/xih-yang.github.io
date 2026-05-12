# 09、Kubernetes 实战 - 灰度发布的介绍与实现
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/9.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

前几篇，已经介绍了环境搭建、Deployment 部署对象、Service 服务、Ingress 路由转发；

本篇，介绍灰度发布的实现；

## 二，灰度发布简介

灰度发布，也叫金丝雀发布；是一种应用的发布方式；

金丝雀发布的命名：金丝雀对瓦斯气体非常敏感，矿工在下井前会先向井里放一只金丝雀，如果金丝雀不叫了，代表瓦斯浓度高；

灰度发布，一般会在现存旧版本应用的基础上，启动一个新版本应用，这个新版本应用并不会直接让用户访问，而是提供给测试人员测试使用，若测试通过才会将真实的用户流量逐步导入到新版本应用中；

期间，将持续对新版本应用的运行状态进行监控，直至全部切换完成，这就是所谓的 A/B 测试；

过程中，也可以招募部分灰度用户，为他们设置独有的灰度标示（如：Cookie，Header 等），使这部分用户能够访问到新版本应用；

如果切换过程中出现问题，也能够迅速地将流量切换回旧版本的应用，时间版本回滚；

## 三，灰度发布

### 准备新版本 service

目前我有的 k8s 集群有 k8s-master 和 k8s-node 主从两个节点

#### 查看当前 pods

当前，有 user-v1、pay-v1各 3 个副本

```java
[root@k8s-master ~]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
mysql-g2zst                1/1     Running   52         43h
nginx-6799fc88d8-2wvl2     1/1     Running   0          44h
nginx-6799fc88d8-lkct4     1/1     Running   0          44h
nginx-6799fc88d8-pktqq     1/1     Running   0          44h
pay-v1-655587b6f5-lpft2    1/1     Running   0          77m
pay-v1-655587b6f5-pcnrp    1/1     Running   0          78m
pay-v1-655587b6f5-spj85    1/1     Running   0          77m
user-v1-5895c69847-649g5   1/1     Running   0          38h
user-v1-5895c69847-chrjk   1/1     Running   0          38h
user-v1-5895c69847-qnwg2   1/1     Running   0          38h
```

#### 查看当前版本的 deployment 配置

```java
[root@k8s-master ~]# cd deployment/
[root@k8s-master deployment]# ls
deployment-pay-v1.yaml  deployment-user-v1.yaml  deploy.yaml  
ingress.yaml  pay-service-v1.yaml  user-service-v1.yaml
```

#### v2 版本配置- deployment

拷贝deployment

```java
cp deployment-user-v1.yaml deployment-user-v2.yaml
```

修改deployment-user-v2.yaml

将4处 user-v1，改为 user-v2 即可

```java
[root@k8s-master deployment]# vi deployment-user-v2.yaml
apiVersion: apps/v1 API版本号
kind: Deployment    资源类型部署
metadata:
  name: user-v2     资源名称
spec:
  selector:
    matchLabels:
      app: user-v2  告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段匹配Pod的label值
  replicas: 3       声明Pod副本的数量
  template:
    metadata:
      labels:
        app: user-v2Pod名称
    spec:           描述Pod内的容器信息
      containers:
      - name: nginx 容器的名称
        image: nginx:user-v2镜像
        ports:
        - containerPort: 80容器内映射的端口
```

#### v2 版本配置- service

拷贝service（之前的命名不规范，这次拷贝改好）：

```java
cp user-service-v1.yaml service-user-v2.yaml
```

修改service-user-v2.yaml 指向新的部署对象 user-v2

```java
vi service-user-v2.yaml
apiVersion: v1
kind: Service
metadata:
  name: service-user-v2
spec:
  selector:
    app: user-v2    指向新的部署对象 user-v2
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: NodePort
```

v2版本配置生效

这样，新建了一套 deployment、service，应用：

```java
// 部署生效
[root@k8s-master deployment]# kubectl apply -f deployment-user-v2.yaml
deployment.apps/user-v2 created
// 服务生效
[root@k8s-master deployment]# kubectl apply -f service-user-v2.yaml 
service/service-user-v2 created
```

这时，已经可以访问了

#### 查看部署对象：

```java
// 查看部署对象
kubectl get deploy user-v2
// 实际执行
[root@k8s-master deployment]# kubectl get deploy user-v2
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
user-v2   3/3     3            3           76s
```

#### 查看 service

```java
// 查看部署对象
kubectl get service service-user-v2
// 实际执行
[root@k8s-master deployment]# kubectl get service service-user-v2
NAME              TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
service-user-v2   NodePort   10.100.196.142   <none>        80:30289/TCP   106s
```

端口是30289

#### 查看 pod

```java
// 查看部署对象
kubectl get pods
// 实际执行
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
mysql-g2zst                1/1     Running   52         43h
nginx-6799fc88d8-2wvl2     1/1     Running   0          44h
nginx-6799fc88d8-lkct4     1/1     Running   0          44h
nginx-6799fc88d8-pktqq     1/1     Running   0          44h
pay-v1-655587b6f5-lpft2    1/1     Running   0          91m
pay-v1-655587b6f5-pcnrp    1/1     Running   0          92m
pay-v1-655587b6f5-spj85    1/1     Running   0          91m
user-v1-5895c69847-649g5   1/1     Running   0          38h
user-v1-5895c69847-chrjk   1/1     Running   0          38h
user-v1-5895c69847-qnwg2   1/1     Running   0          38h
user-v2-fc9d84585-2zztd    1/1     Running   0          3m
user-v2-fc9d84585-ss2ss    1/1     Running   0          3m
user-v2-fc9d84585-xrvnf    1/1     Running   0          3m
```

#### 查看 pod 详情

```java
kubectl describe pods user-v2-fc9d84585-2zztd
[root@k8s-master deployment]# kubectl describe pods user-v2-fc9d84585-2zztd
Name:         user-v2-fc9d84585-2zztd
Namespace:    default
Priority:     0
Node:         k8s-node/172.17.178.106
Start Time:   Fri, 24 Dec 2021 11:21:53 +0800
Labels:       app=user-v2
              pod-template-hash=fc9d84585
Annotations:  <none>
Status:       Running
IP:           10.244.1.18
IPs:
  IP:           10.244.1.18
Controlled By:  ReplicaSet/user-v2-fc9d84585
Containers:
  nginx:
    Container ID:   docker://a9fa59653011df69396209ae3cb889de00cbd7d09833e64c7268a97fecbb0265
    Image:          nginx:user-v2
    Image ID:      nginx@sha256:f35c8618b9732397dbfca6e1ab2b9ada1513fb79cf00b18b7dead1c66ac7386a
    Port:           80/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Fri, 24 Dec 2021 11:21:58 +0800
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-q4qxd (ro)
Conditions:
  Type              Status
  Initialized       True 
  Ready             True 
  ContainersReady   True 
  PodScheduled      True 
Volumes:
  default-token-q4qxd:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-q4qxd
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                 node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  4m5s  default-scheduler  Successfully assigned default/user-v2-fc9d84585-2zztd to k8s-node
  Normal  Pulling    4m4s  kubelet            Pulling image "nginx:user-v2"
  Normal  Pulled     4m1s  kubelet            Successfully pulled image "nginx:user-v2" in 3.651009469s
  Normal  Created    4m    kubelet            Created container nginx
  Normal  Started    4m    kubelet            Started container nginx
```

主要看Events 事件：

1，成功分配任务 default/user-v2 给到 k8s-node 节点处理

2，拉取镜像

3，拉取镜像成功

4，创建 nginx 容器

4，启动 nginx 容器

#### 部署流程分析

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-TgXGMPOj-1677328224477)(https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9e95a6bdc6bb47c0abddd68e2c810a79~tplv-k3u1fbpfcp-zoom-1.image)]

deployment 创建 replicateSetController

replicateSetController 控制 pod，负责 pod 的创建、扩容、缩容

但是，ingress 和 deploy 之间没有控制关系，只是一个请求转发的关系

ingress 接到请求后，会把请求转发给 service，service 再转发给 pod，pod 是由replicateSetController 创建的，replicateSetController 是由 deployment 创建的

#### 查看 servece

```java
[root@k8s-master deployment]# kubectl get services
NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes        ClusterIP   10.96.0.1        <none>        443/TCP        2d11h
nginx             NodePort    10.107.223.32    <none>        80:32117/TCP   44h
service-pay-v1    NodePort    10.106.98.218    <none>        80:30872/TCP   98m
service-user-v1   NodePort    10.104.13.40     <none>        80:31071/TCP   23h
service-user-v2   NodePort    10.100.196.142   <none>        80:30289/TCP   18m
```

service-user-v2 的端口号是 30289

访问service-user-v2

```java
// 本地访问
curl http://127.0.0.1:30289
// k8s-master，内网 ip  
curl http://172.17.178.105:30289
// k8s-node，内网 ip  
curl http://172.17.178.106:30289
// 实际执行
[root@k8s-master deployment]# curl http://127.0.0.1:30289
user-v2
[root@k8s-master deployment]# curl http://172.17.178.105:30289
user-v2
[root@k8s-master deployment]# curl http://172.17.178.106:30289
user-v2
```

至此，新版本部署完成

\

下一步进行分发，让测试和灰度用户进行测试

如何标识这些用户呢？服务器的 ingress 怎么知道是普通用户还是灰度用户呢？需要标识

### 根据 Cookie 切分流量

\

canary：金丝雀

#### 介绍

\

- 基于 Cookie 切分流量。这种实现原理主要根据用户请求中的 Cookie 是否存在灰度标示 Cookie去判断是否为灰度用户，再决定是否返回灰度版本服务
- nginx.ingress.kubernetes.io/canary：可选值为 true / false 。代表是否开启灰度功能
- nginx.ingress.kubernetes.io/canary-by-cookie：灰度发布 cookie 的 key。当 key 值等于 always 时，灰度触发生效。等于其他值时，则不会走灰度环境 ingress-gray.yaml

#### 具体实现

查看之前的 ingress.yaml 配置文件

```java
[root@k8s-master deployment]# vi ingress.yaml 
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: nginx-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    kubernetes.io/ingress.class: nginx
spec:
  rules:
  - http:
      paths:
       - path: /user
         backend:
          serviceName: service-user-v1
          servicePort: 80
       - path: /pay
         backend:
          serviceName: service-pay-v1
          servicePort: 80
  backend:
     serviceName: service-user-v1
     servicePort: 80
```

/user 访问 service-user-v1

/pay 访问 service-pay-v1

默认访问 service-pay-v1

#### 创建灰度配置文件 ingress-gray.yaml

```java
vi ingress-gray.yaml
apiVersion: extensions/v1beta1
kind: Ingress  类型
metadata:元数据
  name: user-canary
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/canary: "true"启用灰度发布功能
    nginx.ingress.kubernetes.io/canary-by-cookie: "vip_user"根据cookie标识vip_user区分
spec:
  rules:
  - http:
      paths:
      - backend:后端  
          serviceName: service-user-v2
          servicePort: 80
  backend:默认值
    serviceName: service-user-v2
    servicePort: 80
```

如果请求 cookie 中包含 vip_user，并且值为 always，访问 service-user-v2

#### 生效配置文件

```java
kubectl apply -f ingress-gray.yaml
// 实际执行
[root@k8s-master deployment]# kubectl apply -f ingress-gray.yaml
Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
ingress.extensions/user-canary created
```

#### 查看服务

- 获取 ingress 的外部端口
- -n: 根据资源名称进行模糊查询

```java
kubectl -n ingress-nginx get service
// 实际执行
[root@k8s-master deployment]# kubectl -n ingress-nginx get service
NAME                                 TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             NodePort    10.108.212.237   <none>        80:31234/TCP,443:31235/TCP   22h
ingress-nginx-controller-admission   ClusterIP   10.97.160.200    <none>        443/TCP                      22h
```

ingress-nginx-controller 端口号 31234

#### 不携带 cookie 方法访问

```java
curl http://172.17.178.105:31234/user
[root@k8s-master deployment]# curl http://172.17.178.105:31234/user
user-v1
```

当没有设置 cookie 时，就是 v1 版本

#### 携带 cookise 访问

```java
curl --cookie "vip_user=always" http://172.17.178.105:31234/user
[root@k8s-master deployment]# curl --cookie "vip_user=always" http://172.17.178.105:31234/user
user-v2
```

这样就实现了根据 cookie 进行流量分发

### 基于 Header 切分流量

#### 介绍

- 基于 Header 切分流量，这种实现原理主要根据用户请求中的 header 是否存在灰度标示 header去判断是否为灰度用户，再决定是否返回灰度版本服务

#### 修改灰度配置文件

```java
vi ingress-gray.yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: user-canary
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/canary: "true"
+    nginx.ingress.kubernetes.io/canary-by-header: "role"
+    nginx.ingress.kubernetes.io/canary-by-header-value: "test"
spec:
  rules:
  - http:
      paths: 
       - backend:
          serviceName: service-user-v2
          servicePort: 80
  backend:
     serviceName: service-user-v2
     servicePort: 80
```

如果请求头中有 role 属性，值为test，进入 service-user-v2

#### 启用配置并访问

```java
[root@k8s-master deployment]# kubectl apply -f ingress-gray.yaml
Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
ingress.extensions/user-canary configured
[root@k8s-master deployment]# curl --header "role:test" http://172.17.178.105:31234/user
user-v2
```

### 基于权重切分流量

#### 介绍

- 这种实现原理主要是根据用户请求，通过根据灰度百分比决定是否转发到灰度服务环境中
- nginx.ingress.kubernetes.io/canary-weight：值是字符串，为 0-100 的数字，代表灰度环境命中概率。如果值为 0，则表示不会走灰度。值越大命中概率越大。当值 = 100 时，代表全走灰度

#### 修改灰度配置

```java
vi ingress-gray.yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: user-canary
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/canary: "true"
+   nginx.ingress.kubernetes.io/canary-weight: "50"
spec:
  rules:
  - http:
      paths: 
       - backend:
          serviceName: service-user-v2
          servicePort: 80
  backend:
     serviceName: service-user-v2
     servicePort: 80
```

#### 启用配置并访问

```java
[root@k8s-master deployment]# kubectl apply -f ingress-gray.yaml
Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
ingress.extensions/user-canary configured
[root@k8s-master deployment]# for ((i=1; i<=10; i++)); do curl http://172.17.178.105:31234/user; done
user-v2
user-v1
user-v2
user-v1
user-v1
user-v1
user-v2
user-v1
user-v1
user-v2
```

50%权重灰度

### 优先级

如果3 种策略都设置了

- canary-by-header -> canary-by-cookie -> canary-weight
- k8s 会优先去匹配 header ，如果未匹配则去匹配 cookie ，最后是 weight
