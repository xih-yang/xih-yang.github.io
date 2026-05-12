# 26、Kubernetes 实战 - 配置存储-Secret
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/26.html
- 分类：容器服务
- 分组：教程目录
## Secret

在kubernetes中，还存在一种和ConfigMap非常相似的对象，称为Secret对象。它主要用于存储敏感信息，例如密码、密钥、证书等。

(1）首先使用base64对数据进行编码

```java
[root@master ~]# echo -n 'admin' |base64 
YWRtaW4=
[root@master ~]# echo -n '123' |base64
MTIz
[root@master ~]# 
```

(2)接下来编写secret.yaml，并创建secret

```java
apiVersion: v1  版本号
kind: Secret   类型
metadata:  元数据
  name: secret   pod名称
  namespace: dev  所属命名空间
type: Opaque
data:
  username: YWRtaW4=
  password: MTIz
```

```java
# 创建secret
[root@master ~]# kubectl create -f secret.yaml
secret/secret created
# 查看secret详情
[root@master ~]# kubectl describe secret/secret -n dev
Name:         secret
Namespace:    dev
Labels:       <none>
Annotations:  <none>
Type:  Opaque
Data
====
password:  3 bytes
username:  5 bytes
```

(3)创建pod-secret.yaml，将上面创建的secret挂载进去

```java
apiVersion: v1  版本号
kind: Pod   类型
metadata:  元数据
  name: pod-secret  pod名称
  namespace: dev  所属命名空间
spec: 详情
  containers:
    - name: nginx
      image: nginx:1.17.1
      volumeMounts: 将/secret/config挂载到目录
        - name: config
          mountPath: /secret/config
  volumes:
    - name: config
      secret:
        secretName: secret
```

```java
# 创建pod
[root@master ~]# kubectl create -f pod-secret.yaml 
pod/pod-secret created
# 进入容器，可以查看到secret信息，发现已经被自动解码了
[root@master ~]# kubectl exec -it pod-secret -n dev /bin/sh
# cd /secret/config
# ls
password  username
# cat username
admin# cat password
123#
```
