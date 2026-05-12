# 08、Kubernetes - 实战：存储之Configmap配置管理
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/8.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是Configmap？

k8s中的存储类型一般分为Configmap、Secret和Volumes。

Configmap是存储中的一种，主要用于保存配置数据，以键值对（KeyValue）形式存储。configMap 资源提供了向 Pod 注入配置数据的方法，让镜像和配置文件解耦，以便实现镜像的可移植性和可复用性。

主要的应用场景有：

**1、** 填充环境变量的值；

**2、** 设置容器内的命令行参数；

**3、** 填充卷的配置文件；

## 2、创建Configmap的方式

### （1）使用字面值创建

`kubectl create configmap my-config --from-literal=key1=config1 --from-literal=key2=config2`创建一个configmap，名字叫my-config，其中的值是直接用命令定义的，key1的值是config1，key2的值是config2。查看，产生了新的cm，并且键值已写进去。

### （2）使用文件创建

`kubectl create configmap my-config-2 --from-file=/etc/resolv.conf`创建my-config-2，文件的名字就是key的名称，文件的内容就是值value

### （3）使用目录创建

创建一个test目录，复制两个文件进去， `kubectl create configmap my-config-3 --from-file=test`创建my-config-3，目录中的文件名为key，文件内容是value

### （4）编写configmap的yaml文件创建

编写cm1.yaml文件

```java
apiVersion: v1
kind: ConfigMap
metadata:
  name: cm1-config
data:
  db_host: "172.25.0.250"
  db_port: "3306"
```

创建cm1-config，查看

## 3、如何使用configmap？

主要有三种：

（1）通过环境变量的方式直接传递给pod

（2）通过在pod的命令行下运行的方式

（3）作为volume的方式挂载到pod内

### （1）通过环境变量的方式直接传递给pod

编写pod.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod1
spec:
  containers:
    - name: pod1
      image: busyboxplus
      command: ["/bin/sh", "-c", "env"]
      env:
        - name: key1
          valueFrom:
            configMapKeyRef:
              name: cm1-config		%把cm1-config中的db_host这个key改名为key1
              key: db_host
        - name: key2
          valueFrom:
            configMapKeyRef:
              name: cm1-config		%把cm1-config中的db_port这个key改名为key2
              key: db_port
  restartPolicy: Never
```

创建pod后查看日志，key1和key2已写入

使用descrbie查看详细信息也可以看到

另外一种，编辑pod2.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod1
spec:
  containers:
    - name: pod1
      image: busyboxplus
      command: ["/bin/sh", "-c", "env"]		%env查看变量
      envFrom:
        - configMapRef:
            name: cm1-config
  restartPolicy: Never
```

创建pod1，查看日志，key和value都过来了，并且是原来的名字

### （2）通过在pod的命令行下运行的方式

编辑pod3.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod2
spec:
  containers:
    - name: pod2
      image: nginx
      command: ["/bin/sh", "-c", "cat /config/db_host"]	%查看/config/db_host
      volumeMounts:
      - name: config-volume
        mountPath: /config		%把cm1-config的数据挂载到pod2的/config
  volumes:
    - name: config-volume		%变量来源于cm1-config
      configMap:
        name: cm1-config
 restartPolicy: Never
```

创建pod2，查看日志

注释了命令和重启策略，

重新应用，进入pod2查看，确实有两个键值

### （3）作为volume的方式挂载到pod内

编写nginx.conf文件

```java
server {
    listen       80;
    server_name  _;
    location / {
        root /usr/share/nginx/html;
        index  index.html index.htm;
    }
}
```

创建nginx.conf

编辑nginx.yaml文件

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx
          volumeMounts:
          - name: config-volume
            mountPath: /etc/nginx/conf.d
      volumes:
        - name: config-volume
          configMap:
            name: nginxconf
```

`kubectl apply -f nginx.yaml`创建my-nginx

`curl 10.244.141.216`可以访问到

```java
[root@server1 configmap]# curl 10.244.141.216
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
```

```java
[root@server1 configmap]# kubectl edit cm nginxconf		%进入编辑，修改80为8080
%configmap热更新后，并不会触发相关Pod的滚动更新，需要手动触发
[root@server1 configmap]# kubectl patch deployments.apps my-nginx --patch '{"spec": {"template": {"metadata": {"annotations": {"version/config": "20200219"}}}}}'    %更新
[root@server1 configmap]# curl 10.244.141.216		%测试端口切换成功
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
```
