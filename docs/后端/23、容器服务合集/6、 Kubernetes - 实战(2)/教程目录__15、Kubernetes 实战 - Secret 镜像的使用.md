# 15、Kubernetes 实战 - Secret 镜像的使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/15.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了两种 Secret 对象的创建；

本篇，介绍了 Secret 镜像的使用；

## 二，使用 secret 镜像

### 1，Volume 挂载

将Secret 镜像通过存储卷的方式进行挂载

更新配置

查看之前的 deployment-user-v1.yaml

```java
[root@k8s-master deployment]# vi deployment-user-v1.yaml
apiVersion: apps/v1 API版本号
kind: Deployment    资源类型部署
metadata:
  name: user-v1     资源名称
spec:
  minReadySeconds: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: user-v1  告诉deployment根据规则匹配相应的Pod进行控制和管理，matchLabels字段匹配Pod的label值
  replicas: 3       声明Pod副本的数量
  template:
    metadata:
      labels:
        app: user-v1Pod名称
    spec:           描述Pod内的容器信息
      containers:
      - name: nginx 容器的名称
        image: nginx:user-v3镜像
        ports:
        - containerPort: 80容器内映射的端口                                                  
```

修改以下几处配置：

1，将副本改为 1 份

2，template 模板下的 spec 描述信息，添加 volumes 数据卷声明：使用 secret-opaque（下图中）

```java
[root@k8s-master deployment]# kubectl get secret
NAME                  TYPE                                  DATA   AGE
default-token-q4qxd   kubernetes.io/service-account-token   3      8d
registry-auth         kubernetes.io/dockerconfigjson        1      25m
registry-auth-file    kubernetes.io/dockerconfigjson        1      19m
secret-opaque         Opaque                                2      40m
secret-opaque-flie    Opaque                                2      32m
```

更新deployment-user-v1.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-v1
spec:
  minReadySeconds: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: user-v1
+ replicas: 1声明Pod副本的数量
  template:
    metadata:
      labels:
        app: user-v1
    spec:
+     volumes:
+     - name: secret-opaque声明数据卷
+       secret:
+         secretName: secret-opaque引用的secret名称
      containers:
      - name: nginx
        image: nginx:user-v3
+       volumeMounts:数据卷的挂载信息
+       - name: secret-opaque	#挂载名称 
+         mountPath: /secret-opaque挂载路径
+         readOnly: true只读
        ports:
        - containerPort: 80
```

应用配置

```java
[root@k8s-master deployment]# kubectl apply -f deployment-user-v1.yaml
deployment.apps/user-v1 configured
```

查看pod 列表

```java
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
http-probe                 1/1     Running   78         4h18m
user-v1-64c948c799-66m9w   1/1     Running   0          58s
```

进入pod

```java
kubectl exec -it user-v1-64c948c799-66m9w -- bash
// 实际执行
[root@k8s-master deployment]# kubectl exec -it user-v1-64c948c799-66m9w -- bash
root@user-v1-64c948c799-66m9w:/# cd secret-opaque/
root@user-v1-64c948c799-66m9w:/secret-opaque# ls
password  username
root@user-v1-64c948c799-66m9w:/secret-opaque# cat username 
admin
root@user-v1-64c948c799-66m9w:/secret-opaque# cat password 
123456
```

这就是第一种，将Secret作为数据卷，将硬盘上的文件挂载到文件系统中去

### 2，环境变量注入

- 第二种是将 Secret 注入进容器的环境变量

修改deployment-user-v1.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-v1
spec:
  minReadySeconds: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: user-v1
  replicas: 1
  template:
    metadata:
      labels:
        app: user-v1
    spec:
      volumes:
      - name: secret-opaque
        secret:
          secretName: secret-opaque
      containers:
      - name: nginx
+       env:环境变量
+       - name: USERNAME
+         valueFrom:取值位置
+           secretKeyRef:引用secret对象中的某个key
+             name: secret-opaque-flie指定secret对象
+             key: username指定secret对象中的key为username
+       - name: PASSWORD
+         valueFrom:
+           secretKeyRef:
+             name: secret-opaque-flie
+             key: password
        image: nginx:user-v3
        volumeMounts:
        - name: secret-opaque
          mountPath: /secret-opaque
          readOnly: true
        ports:
        - containerPort: 80
```

应用配置

```java
[root@k8s-master deployment]# kubectl apply -f deployment-user-v1.yaml 
deployment.apps/user-v1 configured
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS             RESTARTS   AGE
http-probe                 0/1     CrashLoopBackOff   83         4h35m
user-v1-84bdcc465b-vxvl2   1/1     Running            0          31s
```

打印当前所有变量

```java
// 进入容器
kubectl exec -it user-v1-84bdcc465b-vxvl2 -- env
kubectl exec -it user-v1-84bdcc465b-vxvl2 -- env | grep USERNAME
// 实际执行
[root@k8s-master deployment]# kubectl exec -it user-v1-84bdcc465b-vxvl2 -- env
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOSTNAME=user-v1-84bdcc465b-vxvl2
TERM=xterm
USERNAME=root
PASSWORD=root
KUBERNETES_PORT_443_TCP_PORT=443
SERVICE_USER_V1_PORT=tcp://10.104.13.40:80
SERVICE_USER_V1_PORT_80_TCP=tcp://10.104.13.40:80
SERVICE_USER_V1_PORT_80_TCP_ADDR=10.104.13.40
SERVICE_USER_V1_PORT_80_TCP_PROTO=tcp
KUBERNETES_SERVICE_PORT=443
KUBERNETES_PORT=tcp://10.96.0.1:443
KUBERNETES_PORT_443_TCP_PROTO=tcp
KUBERNETES_PORT_443_TCP_ADDR=10.96.0.1
SERVICE_USER_V1_SERVICE_HOST=10.104.13.40
KUBERNETES_SERVICE_PORT_HTTPS=443
SERVICE_USER_V1_PORT_80_TCP_PORT=80
KUBERNETES_SERVICE_HOST=10.96.0.1
KUBERNETES_PORT_443_TCP=tcp://10.96.0.1:443
SERVICE_USER_V1_SERVICE_PORT=80
NGINX_VERSION=1.19.6
NJS_VERSION=0.5.0
PKG_RELEASE=1~buster
HOME=/root
[root@k8s-master deployment]# kubectl exec -it user-v1-84bdcc465b-vxvl2 -- env | grep USERNAME
USERNAME=root
```

备注：

配置生效后，可以获取到环境变量；

比如：nodejs 可以通过 process.env.USERNAME 拿到环境变量 USERNAME 的值；

### 3，Docker 私有库认证

- 第三种是 Docker 私有库类型，这种方法只能用来配置 私有镜像库认证。

创建一个新的配置文件（拷贝deployment-user-v1.yaml -> deployment-v4.yaml）

```java
[root@k8s-master deployment]# cp deployment-user-v1.yaml deployment-v4.yaml
```

修改前deployment-v4.yaml

```java
[root@k8s-master deployment]# vi deployment-v4.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-v1
spec:
  minReadySeconds: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: user-v1
  replicas: 1
  template:
    metadata:
      labels:
        app: user-v1
    spec:
      volumes:
      - name: secret-opaque
        secret:
          secretName: secret-opaque
      containers:
      - name: nginx
        env:环境变量
        - name: USERNAME
          valueFrom:取值位置
            secretKeyRef:引用secret对象中的某个key
              name: secret-opaque-flie指定secret对象
              key: username指定secret对象中的key为username
        - name: PASSWORD
          valueFrom:
            secretKeyRef:
              name: secret-opaque-flie
              key: password
        image: nginx:user-v3
        volumeMounts:
        - name: secret-opaque
          mountPath: /secret-opaque
          readOnly: true
        ports:
        - containerPort: 80
```

修改后deployment-v4.yaml （使用私有镜像仓库）

```java
[root@k8s-master deployment]# vi deployment-v4.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: v4    修改
spec:
  selector:
    matchLabels:
      app: v4 修改
  replicas: 1
  template:
    metadata:
      labels:
        app: v4修改
    spec: 
      containers:
      - name: vue-project
        image: 39.105.212.14:8082/vue-project:2021123011191640834385  修改
        ports:
        - containerPort: 80
```

查看本地镜像列表

```java
[root@iZ2ze7rkgit9zoa18pxu73Z ~]# docker image ls
REPOSITORY                       TAG                      IMAGE ID       CREATED       SIZE
39.105.212.14:8082/vue-project   2021123011191640834385   cf09bb54e87e   4 hours ago   110MB
39.105.212.14:8082/vue-project   2021123011461640835990   cf09bb54e87e   4 hours ago   110MB
cicdproject                      latest                   2e9269d7c724   10 days ago   110MB
node                             latest                   058747996654   3 weeks ago   992MB
nginx                            1.15                     53f3fd8007f7   2 years ago   109MB
```

选用镜像：39.105.212.14:8082/vue-project:2021123011191640834385

```java
// 镜像名称规则
image: [仅有镜像库地址]/[镜像名称]:[镜像标签]
```

生效配置

```java
// 生效配置
[root@k8s-master deployment]# kubectl apply -f deployment-v4.yaml 
deployment.apps/v4 created
// 查看 pod，v4 报错 ErrImagePull
[root@k8s-master deployment]# kubectl get pods
NAME                       READY   STATUS             RESTARTS   AGE
http-probe                 0/1     CrashLoopBackOff   87         4h48m
user-v1-84bdcc465b-vxvl2   1/1     Running            0          13m
v4-6dcd997cdf-fw8pr        0/1     ErrImagePull       0          7s
// 查看 pod 详情：镜像拉取失败，没有权限
// 成功分配任务；拉取镜像；镜像拉取失败：没有权限；
[root@k8s-master deployment]# kubectl describe pods v4-6dcd997cdf-fw8pr
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  38s                default-scheduler  Successfully assigned default/v4-6dcd997cdf-fw8pr to k8s-node
  Normal   Pulling    22s (x2 over 38s)  kubelet            Pulling image "39.105.212.14:8082/vue-project:2021123011191640834385"
  Warning  Failed     22s (x2 over 38s)  kubelet            Failed to pull image "39.105.212.14:8082/vue-project:2021123011191640834385": rpc error: code = Unknown desc = Error response from daemon: Get "https://39.105.212.14:8082/v2/": http: server gave HTTP response to HTTPS client
  Warning  Failed     22s (x2 over 38s)  kubelet            Error: ErrImagePull
  Normal   BackOff    7s (x2 over 37s)   kubelet            Back-off pulling image "39.105.212.14:8082/vue-project:2021123011191640834385"
  Warning  Failed     7s (x2 over 37s)   kubelet            Error: ImagePullBackOff
```

## 三，结尾

本篇，介绍了两种 Secret 对象的使用；

下一篇，第十七篇 - ECS 服务停机和环境修复；
