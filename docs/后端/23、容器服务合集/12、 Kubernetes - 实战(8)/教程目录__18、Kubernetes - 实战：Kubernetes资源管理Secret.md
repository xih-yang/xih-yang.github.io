# 18、Kubernetes - 实战：Kubernetes资源管理Secret
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/18.html
- 分类：容器服务
- 分组：教程目录
官方文档：[https://kubernetes.io/docs/concepts/configuration/secret/](https://kubernetes.io/docs/concepts/configuration/secret/)

- 加密数据并存放Etcd中，让Pod的容器以挂载Volume方式访问。
- 应用场景：凭据

## 一、通过文本文件创建用户密码

### 1、创建用户名密码文件

```java
echo -n 'admin' > ./username.txt
echo -n '1f2d1e2e67df' > ./password.txt
```

### 2、通过文件创建用户名密码

```java
kubectl create secret generic db-user-pass --from-file=./username.txt --from-file=./password.txt
```

### 3、查看创建用户名密码

```java
kubectl get secret
NAME TYPE DATA AGE
db-user-pass Opaque 2 37s
```

### 4、查看详情

```java
kubectl describe secret db-user-pass
Name: db-user-pass
Namespace: default
Labels: <none>
Annotations: <none>
Type: Opaque
Data
====
password.txt: 12 bytes
username.txt: 5 bytes
```

## 二、通过yaml文件创建用户名密码

### 1、编码用户名密码

```java
echo -n 'admin' | base64
echo -n '1f2d1e2e67df' | base64
```

### 2、创建yaml文件 vim user.yaml

```java
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
  password: MWYyZDFlMmU2N2Rm
```

### 3、创建用户名密码

```java
kubectl create -f user.yaml
```

### 4、查看创建用户

```java
kubectl get secret
NAME TYPE DATA AGE
db-user-pass Opaque 2 5m42s
mysecret Opaque 2 18s
```

## 三、通过环境变量导入到容器中

### 1、创建yaml文件

```java
vim secret-var.yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: nginx
    image: nginx
    env:
      环境变量名称：用户
      - name: SECRET_USERNAME
        valueFrom:
          选择输入secret用户
          secretKeyRef:
            name: mysecret
            key: username
      环境变量名称：密码
      - name: SECRET_PASSWORD
        valueFrom:
          选择输入secret密码
          secretKeyRef:
            name: mysecret
            key: password
```

### 2、创建容器

```java
kubectl create -f secret-var.yaml
```

### 3、查看创建容器

```java
kubectl get pods
NAME READY STATUS RESTARTS AGE
mypod 1/1 Running 0 23s
```

### 4、进入容器查看变量

```java
kubectl exec -it mypod bash
root@mypod:/# echo $SECRET_USERNAME
admin
root@mypod:/# echo $SECRET_PASSWORD
1f2d1e2e67df
```

## 四、通过volume挂载用户名密码

### 1、创建yaml文件

```java
vim secret-vol.yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
      readOnly: true
  volumes:
  - name: foo
    secret:
      创建的secret
      secretName: mysecret
```

### 2、创建容器

```java
kubectl create -f secret-vol.yaml
```

### 3、查看容器

```java
kubectl get pod
NAME READY STATUS RESTARTS AGE
mypod 1/1 Running 0 46s
```

### 4、进入容器查看

```java
kubectl exec -it mypod bash
root@mypod:/# ls /etc/foo/
password username
root@mypod:/# cat /etc/foo/password 
1f2d1e2e67dfroot@mypod:/# cat /etc/foo/username 
adminroot@mypod:/#
```

```java
K8S1.19版本之后可以设置Configmap和Secret配置不可变
只需要在最后加参数：（immutable: true）即可实现。
```

```java
subpath挂载配置文件不会覆盖目录
```
