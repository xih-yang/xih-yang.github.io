# 21、Kubernetes - 实战：数据存储 Secret
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/21.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、Secret介绍

和`ConfigMap`非常类似，主要用于存储敏感信息，例如密码、秘钥、证书等。

动态更新（定时更新），密文存储（`describe`不能看到信息，但在`Pod`容器中会还原成明文）

## 三、Secret使用

### 1 数据准备

```java
echo -n 'admin' | base64
echo -n '123456' | base64
```

vimsecret.yml

```java
apiVersion: v1
kind: Secret
metadata:
  name: secret
  namespace: dev
type: Opaque
data:
  username: YWRtaW4=
  password: MTIzNDU2
```

创建`pod-secret.yml`，挂载到`Secret`

`vim pod-secret.yml`

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-secret
  namespace: dev
spec:
  containers:
  - name: nginx
    image: nginx:1.17.1
    volumeMounts: 将 Secret 挂载到目录
    - name: config
      mountPath: /secret/config
  volumes:
  - name: config
    secret:
      secretName: secret
```

### 2 创建Secret

```java
kubectl create -f secret.yml
```

### 3 创建Pod

```java
kubectl create -f  pod-secret.yml
```

### 4 查看Secret

```java
kubectl describe secret secret -n dev
```

### 5 查看 Pod 中内容

进入容器：

```java
kubectl exec -it pod-secret -n dev -- /bin/sh
# ls /secret/config/
password  username
# more /secret/config/username
admin
# more /secret/config/password
123456
# 
```
