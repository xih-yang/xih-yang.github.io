# 15、Kubernetes - 实战：Secret介绍及演示
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/15.html
- 分类：容器服务
- 分组：教程目录
## Secret介绍

**Secret存在的意义**

Secret解决了密码、token、密钥等敏感数据的配置问题，而不需要把这些敏感数据暴露到镜像或者Pod Spec中，可以以Volume或者环境变量的方式使用

**Secret有三种类型**

Service Account：用来访问Kubernetes API，由Kubernetes自动创建，并且会自动挂载到Pod的/run/secrets/kubernetes.io/serviceaccount目录中

Opaque：base64编码格式的Secret，用来存储密码、秘钥等

kubernetes.io/dockerconfigjson：用来存储私有 docker registry的认证信息

## Service Account

只要与Kubernetes API有交互的Pod，都会自动拥有此种类型的Secret，例如kube-system名称空间下的Pod

```java
### 随便进入kube-system下的Pod内查看是否有此类型
[root@Centos8 ~]# kubectl exec -it kube-proxy-76x2c -n kube-system -- /bin/sh
# cd /run/secrets/kubernetes.io/serviceaccount
# ls
ca.crt    namespace  token
### 可以看到，其中保存了crt、token等文件
```

## Opaque

此种加密类型为base64，其特点就是将明文改为了密文，但是解密也非常简单，因为同一串字符串加密后的密文永远是相同的

```java
## 加密
[root@Centos8 ~]# echo -n admin | base64
YWRtaW4=
[root@Centos8 ~]# echo -n vfan123 | base64
dmZhbjEyMw==
## 解密
[root@Centos8 ~]# echo -n dmZhbjEyMw== | base64 -d
vfan123
[root@Centos8 ~]# echo -n YWRtaW4= | base64 -d
admin
```

创建一个Opaque类型的Secret

```java
vim secrets.yaml
...
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  password: dmZhbjEyMw==
  username: YWRtaW4=
...
kubectl create -f secrets.yaml
```

将此secret挂载到Pod中

```java
[root@Centos8 secret]# vim s-volume.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: s-volume
  labels:
    type: opaque
spec:
  volumes:
  - name: secrets
    secret:
      secretName: mysecret
  containers:
  - name: db
    image: hub.vfancloud.com/test/myapp:v1
    imagePullPolicy: IfNotPresent
    volumeMounts:
    - name: secrets
      mountPath: /etc/secrets
      readOnly: true
...
[root@Centos8 secret]# kubectl create -f secrets.yaml 
secret/mysecret created
## 进入container
[root@Centos8 secret]# kubectl exec -it s-volume -- /bin/sh
/etc/secrets ls
password  username
/etc/secrets cat password
vfan123
/etc/secrets cat username 
admin
### secret加密后的用户名和密码，传输到container中已是明文
```

将此secret定义到Pod的环境变量中

```java
vim s-env.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: s-env
  labels:
    type: opaque
spec:
  containers:
  - name: pod-1
    image: hub.vfancloud.com/test/myapp:v1
    imagePullPolicy: IfNotPresent
    ports:
    - containerPort: 80
    env:
    - name: DB_USER
      valueFrom:
        secretKeyRef:
          name: mysecret
          key: username
    - name: DB_PASSWD
      valueFrom:
        secretKeyRef:
          name: mysecret
          key: password
...
kubectl create -f s-env.yaml
## 查看环境变量
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOSTNAME=s-env
TERM=xterm
DB_USER=admin
DB_PASSWD=vfan123
```

**kubernetes.io/dockerconfigjson**

保存docker仓库认证信息

打开我们之前搭建的Harbor镜像仓库，设置一个私有仓库(若无搭建私有仓库可以参考本人其他随笔：[/zhuanlan/container/kubernetes/6/7.html](/zhuanlan/container/kubernetes/6/7.html))

创建Pod，使Pod导入私有仓库的镜像文件hub.vfancloud.com/test/myapp:v2

```java
vim s-configjson.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: s-configjson
spec:
  containers:
  - name: configjson
    image: hub.vfancloud.com/test/myapp:v2
...
[root@Centos8 secret]# kubectl create -f s-configjson.yaml 
pod/s-configjson created
### 镜像导入失败，是因为私有仓库中的镜像必须登录后才可导入
[root@Centos8 secret]# kubectl get pod 
NAME           READY   STATUS         RESTARTS   AGE
s-configjson   0/1     ErrImagePull   0          22s
### 详细信息中的报错信息
Failed to pull image "hub.vfancloud.com/test/myapp:v2": rpc error: code = Unknown desc = Error response from daemon: pull access denied for hub.vfancloud.com/test/myapp, repository does not exist or may require 'docker login': denied: requested access to the resource is denied
```

设置dockerconfigjson类型secret

```java
## 创建secret
[root@Centos8 secret]# kubectl create secret docker-registry myregistrykey --docker-server=hub.vfancloud.com --docker-username=admin --docker-password=Harbor12345 --docker-email=vfan8991
secret/myregistrykey created
## 在资源清单中添加配置
[root@Centos8 secret]# vim s-configjson.yaml 
...
apiVersion: v1
kind: Pod
metadata:
  name: s-configjson
spec:
  containers:
  - name: configjson
    image: hub.vfancloud.com/test/myapp:v2
  imagePullSecrets:
  - name: myregistrykey
...
[root@Centos8 secret]# kubectl create -f s-configjson.yaml 
pod/s-configjson created
## 查看，导入成功
[root@Centos8 secret]# kubectl get pod 
NAME           READY   STATUS    RESTARTS   AGE
s-configjson   1/1     Running   0          5s
```
