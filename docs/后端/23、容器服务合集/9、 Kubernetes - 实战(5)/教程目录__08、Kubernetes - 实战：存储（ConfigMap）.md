# 08、Kubernetes - 实战：存储（ConfigMap）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/8.html
- 分类：容器服务
- 分组：教程目录
## 一、Configmap简介

Configmap用于保存配置数据，以键值对的形式存储

Configmap资源提供了向Pod诸如配置数据的方法

旨在让镜像和配置文件解偶，以便实现镜像的可移植性和可复用性

## 典型的使用场景：

```java
填充环境变量的值
设置容器内的命令行参数
填充卷的配置文件
```

## 创建Configmap的方式：

```java
使用字面值创建
使用文件创建
使用目录创建
编写Configmap的yaml文件创建
```

## 如何使用Configmap：

```java
通过环境变量的方式直接传递给pod
通过在pod的命令行下运行的方式
作为volume的方式挂载到pod内
```

## 二、创建Configmap

## 使用命令行指定key和value创建

创建：

```java
[root@server1 ~]# kubectl create configmap cm1 --from-literal=key1=value1
configmap/cm1 created
```

以上命令表示创建一个名称为cm1，key为key1，value为value1的Configmap，也可以在命令后接多个–from-literal以创建多个键值对。

查看创建的Configmap：

```java
[root@server1 ~]# kubectl get cm
NAME   DATA   AGE
cm1    1      6s
```

查看详细信息：

[

```java
root@server1 ~]# kubectl describe cm cm1 
Name:         cm1
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
key1:			#键
----
value1			#值
Events:  <none>
```

## 使用文件创建

使用文件创建Configmap时，key的名称是文件名称，value的值是这个文件的内容：

```java
[root@server1 ~]# kubectl create configmap cm2 --from-file=/etc/resolv.conf
configmap/cm2 created
[root@server1 ~]# kubectl describe cm cm2
Name:         cm2
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
resolv.conf:			#键
----
nameserver 114.114.114.114		#值
Events:  <none>
[root@server1 ~]# cat /etc/resolv.conf		#查看文件内容，和value的值相同
nameserver 114.114.114.114
```

## 使用目录创建

使用目录创建时，目录中的文件名为key，文件内容是value：

建立测试目录：

```java
[root@server1 ~]# mkdir cm
[root@server1 ~]# cd cm/
[root@server1 cm]# cp /etc/resolv.conf .
[root@server1 cm]# cp /etc/hosts .
```

创建：

```java
[root@server1 cm]# kubectl create configmap cm3 --from-file=/root/cm
configmap/cm3 created
[root@server1 cm]# kubectl describe cm cm3
Name:         cm3
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
hosts:
----
172.25.63.250   foundation63.ilt.example.com
172.25.63.1     server1 reg.westos.org
172.25.63.2     server2
172.25.63.3     server3
172.25.63.4     server4
172.25.63.5     server5
172.25.63.6     server6
172.25.63.7     server7
resolv.conf:
----
nameserver 114.114.114.114
Events:  <none>
```

可以看出目录中的文件名为key，文件内容是value。

## 编写yaml文件创建

编写Configmap的yaml文件：

```java
[root@server1 cm]# vim cm4.yaml
[root@server1 cm]# cat cm4.yaml 
apiVersion: v1
kind: ConfigMap
metadata: 
  name: cm4
data:
  db_host: "172.25.63.250"
  db_port: "3306"
```

上述文件表示创建一个名为cm4的ConfigMap，其键值对为data下的内容。

查看：

```java
[root@server1 cm]# kubectl create -f cm4.yaml 
configmap/cm4 created
[root@server1 cm]# kubectl get cm
NAME   DATA   AGE
cm1    1      9m12s
cm2    1      7m24s
cm3    2      5m4s
cm4    2      7s
[root@server1 cm]# kubectl describe cm cm4 
Name:         cm4
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
db_host:
----
172.25.63.250
db_port:
----
3306
Events:  <none>
```

## 三、使用Configmap

## 通过环境变量的方式直接传递给pod

编辑yaml文件：

```java
[root@server1 cm]# vim pod.yaml
[root@server1 cm]# cat pod.yaml 
apiVersion: v1
kind: Pod
metadata: 
  name: pod1
spec:
  containers:
    - name: pod1
      image: busybox
      command: ["/bin/sh","-c","env"]
      env:
        - name: key1
          valueFrom:
            configMapKeyRef:
              name: cm4
              key: db_host
        - name: key2
          valueFrom:
            configMapKeyRef:
              name: cm4
              key: db_port
  restartPolicy: Never
```

上述文件表示运行一个pod输出env信息，在env信息中加入刚才创建的cm4中的键值对，但是键被改为 key1 和 key2.

创建pod：

```java
[root@server1 cm]# kubectl create -f pod.yaml 
pod/pod1 created
[root@server1 cm]# kubectl get pod
NAME                                READY   STATUS      RESTARTS   AGE
pod1                                0/1     Completed   0          5s
```

查看pod的日志可以查看pod内输出的env信息：

```java
[root@server1 cm]# kubectl logs pod1  
```

可以看出将cm4中的值成功导入了pod内。

实验后删除：

```java
[root@server1 cm]# kubectl delete pod pod1
pod "pod1" deleted
```

接下来再看一个示例：

```java
[root@server1 cm]# vim pod1.yaml 
[root@server1 cm]# cat pod1.yaml 
apiVersion: v1
kind: Pod
metadata: 
  name: pod1
spec:
  containers:
    - name: pod1
      image: busybox
      command: ["/bin/sh","-c","env"]
      envFrom:
        - configMapRef:
              name: cm4
  restartPolicy: Never
```

上述文件表示直接将cm4中的键值对导入pod的env中，键和值都不做更改：

```java
[root@server1 cm]# kubectl create -f pod1.yaml 
pod/pod1 created
[root@server1 cm]# kubectl get pod
NAME   READY   STATUS      RESTARTS   AGE
pod1   0/1     Completed   0          57s
```

查看日志：

[root@server1 cm]# kubectl logs pod1

可以看出导入后键和值都没有更改。

实验后删除：

```java
[root@server1 cm]# kubectl delete -f pod1.yaml 
pod "pod1" deleted
```

## 通过在pod的命令行下运行的方式

也可以使用Configmap设置命令行参数：

```java
[root@server1 cm]# vim pod2.yaml 
[root@server1 cm]# cat pod2.yaml 
apiVersion: v1
kind: Pod
metadata: 
  name: pod1
spec:
  containers:
    - name: pod1
      image: busybox
      command: ["/bin/sh","-c","echo $(db_host) $(db_port)"]
      envFrom:
        - configMapRef:
              name: cm4
  restartPolicy: Never
```

上述文件表示直接再pod内调用输入的Configmap键值对

创建：

```java
[root@server1 cm]# kubectl create -f pod2.yaml 
pod/pod1 created
[root@server1 cm]# kubectl get pod
NAME   READY   STATUS      RESTARTS   AGE
pod1   0/1     Completed   0          5s
```

查看输出：

```java
[root@server1 cm]# kubectl logs pod1 
172.25.63.250 3306
```

表示成功输出

实验后删除：

```java
[root@server1 cm]# kubectl delete -f pod2.yaml 
pod "pod1" deleted
```

## 作为volume的方式挂载到pod内

通过数据卷使用Configmap：

```java
[root@server1 cm]# vim pod3.yaml 
[root@server1 cm]# cat pod3.yaml 
apiVersion: v1
kind: Pod
metadata: 
  name: pod1
spec:
  containers:
    - name: pod1
      image: busybox
      command: ["/bin/sh","-c","cat /config/db_host"]
      volumeMounts:
        - name: config-volume
          mountPath: /config
  volumes:
    - name: config-volume
      configMap:
        name: cm4
  restartPolicy: Never
```

上述文件表示将cm4内的键值对挂载到容器内的/config下，这种方式创建时，键会成为文件名，值会成为文件内容：

```java
[root@server1 cm]# kubectl create -f pod3.yaml 
pod/pod1 created
[root@server1 cm]# kubectl get pod
NAME   READY   STATUS      RESTARTS   AGE
pod1   0/1     Completed   0          6s
```

查看输出：

```java
[root@server1 cm]# kubectl logs pod1 
172.25.63.250
```

实验后删除：

```java
[root@server1 cm]# kubectl delete -f pod3.yaml 
pod "pod1" deleted
```

也可以通过以下这种方式更加直观的理解：

```java
[root@server1 cm]# vim pod3.yaml 
[root@server1 cm]# cat pod3.yaml 
apiVersion: v1
kind: Pod
metadata: 
  name: pod1
spec:
  containers:
    - name: pod1
      image: myapp:v1
      volumeMounts:
        - name: config-volume
          mountPath: /config
  volumes:
    - name: config-volume
      configMap:
        name: cm4
[root@server1 cm]# kubectl create -f pod3.yaml 
pod/pod1 created
[root@server1 cm]# kubectl get pod
NAME   READY   STATUS    RESTARTS   AGE
pod1   1/1     Running   0          5s
[root@server1 cm]# kubectl exec -it pod1 -- sh
/ cd /config/
/config ls
db_host  db_port		#两个key所以由两个文件
/config ls -l
total 0
lrwxrwxrwx    1 root     root            14 Apr 28 16:46 db_host -> ..data/db_host
lrwxrwxrwx    1 root     root            14 Apr 28 16:46 db_port -> ..data/db_port
/config cat db_host 			#文件内容为value
172.25.63.250/config 
/config cat db_port 
3306/config 
/config 
```

可以看出所有的key都会成为文件，而文件内容为value。

实验后删除：

```java
root@server1 cm]# kubectl delete -f pod3.yaml 
pod "pod1" deleted
```

## 四、Configmap热更新

首先创建一个pod：

```java
[root@server1 cm]# vim pod4.yaml 
[root@server1 cm]# cat pod4.yaml 
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
          ports:
          - containerPort: 80
          volumeMounts:
          - name: config-volume
            mountPath: /config
      volumes:
        - name: config-volume
          configMap:
              name: cm4
```

上述文件表示使用Deployment控制器维护了一个副本的pod，且在容器内部使用了cm4中的键值对挂载了目录，先创建查看结果：

```java
[root@server1 cm]# kubectl create -f pod4.yaml 
deployment.apps/my-nginx created
[root@server1 cm]# kubectl get pod
NAME                      READY   STATUS    RESTARTS   AGE
my-nginx-7b55b857-bx6ff   1/1     Running   0          17s
[root@server1 cm]# kubectl exec -it my-nginx-7b55b857-bx6ff -- bash
root@my-nginx-7b55b857-bx6ff:/# cd config/
root@my-nginx-7b55b857-bx6ff:/config# ls
db_host  db_port
root@my-nginx-7b55b857-bx6ff:/config# cat db_host 
172.25.63.250root@my-nginx-7b55b857-bx6ff:/config# 
root@my-nginx-7b55b857-bx6ff:/config# cat db_port 
3306root@my-nginx-7b55b857-bx6ff:/config# exit
```

```java
1
```

容器内的内容是从cm4中直接拿到的，我们现在来更新cm4的内容：

```java
[root@server1 cm]# kubectl edit cm cm4
configmap/cm4 edited
```

如图，将db_host改为l了172.25.63.100，此时查看容器内部的情况：

```java
[root@server1 cm]# kubectl exec -it my-nginx-7b55b857-bx6ff -- bash
root@my-nginx-7b55b857-bx6ff:/# cd config/
root@my-nginx-7b55b857-bx6ff:/config# cat db_host 
172.25.63.250root@my-nginx-7b55b857-bx6ff:/config# 
root@my-nginx-7b55b857-bx6ff:/config# exit
```

可以看出还是250的地址，说明在改变Configmap时容器内部的数据不会更新，以下有两种方式来更新:

第一种就时删除这个pod，那么Deployment控制器就会帮我们再新建一个pod，这样就实现了更新：

```java
[root@server1 cm]# kubectl delete pod my-nginx-7b55b857-bx6ff
pod "my-nginx-7b55b857-bx6ff" deleted
[root@server1 cm]# kubectl get pod
NAME                      READY   STATUS    RESTARTS   AGE
my-nginx-7b55b857-q5kbk   1/1     Running   0          84s
```

此时查看容器内的内容：

可以看出已经更新。

还有一种方式是通过修改config/version来触发pod的滚动更新：

首先更改cm：

可以看出改成了200，此时还没有触发更新，修改config/version来触发pod的滚动更新：

```java
[root@server1 cm]# kubectl patch deployments.apps my-nginx --patch '{"spec": {"template": {"metadata": {"annotations": {"version/config": "20200428"}}}}}'
deployment.apps/my-nginx patched
[root@server1 cm]# kubectl get pod
NAME                        READY   STATUS    RESTARTS   AGE
my-nginx-5b568c4dbf-gmtj7   1/1     Running   0          12s
```

查看容器内部的值：

可以看出db_host的值更新为200.

实验后删除：

```java
[root@server1 cm]# kubectl delete -f pod4.yaml 
deployment.apps "my-nginx" deleted
```

```java
1
2
```

## 五、通过Configmap来部署nginx

编辑部署文件：

```java
[root@server1 cm]# vim pod4.yaml 
[root@server1 cm]# cat pod4.yaml 
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
          ports:
          - containerPort: 80
          volumeMounts:
          - name: config-volume
            mountPath: /etc/nginx/conf.d
      volumes:
        - name: config-volume
          configMap:
              name: nginxconf
```

上述文件表示将名为nginxconf（当然我们现在还没有，稍后我们会创建）的Configmap挂载到nginx配置目录/etc/nginx/conf.d中，以实现nginx的配置。

接下来我们创建名为nginxconf的Configmap：

```java
[root@server1 cm]# vim nginx.conf	
```

#注意：这个文件的名称不能变，因为nginx的配置文件名称就是这个名称

```java
[root@server1 cm]# cat nginx.conf 
server {
	listen	8000;		#监听端口8000
	server_name _;
	location / {
		root /usr/share/nginx/html;
		index	index.html index.htm;
	}
}
```

#接下来以文件的形式创建configmap：

```java
[root@server1 cm]# kubectl create configmap nginxconf --from-file=nginx.conf 
configmap/nginxconf created
[root@server1 cm]# kubectl describe cm nginxconf 查看cm
Name:         nginxconf
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
nginx.conf:
----
server {
  listen  8000;
  server_name _;
  location / {
    root /usr/share/nginx/html;
    index  index.html index.htm;
  }
}
Events:  <none>
```

上述一系列的操作表示，cm挂接进入容器时key为文件名，键为文件内容，即将nginx.conf 文件挂接进入容器内的/etc/nginx/conf.d/nginx.conf ，这样就生成了nginx的配置文件。

接下来创建pod：

```java
[root@server1 cm]# kubectl create -f pod4.yaml 
deployment.apps/my-nginx created
[root@server1 cm]# kubectl get pod -o wide
NAME                       READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
my-nginx-9f4f65995-nwlxr   1/1     Running   0          3s    10.244.1.71   server2   <none>           <none>
```

访问pod：

配置成功，也可以进入容器内部直接查看nginx的配置文件：

```java
[root@server1 cm]# kubectl exec -it my-nginx-9f4f65995-nwlxr -- bash
root@my-nginx-9f4f65995-nwlxr:/# cat /etc/nginx/conf.d/nginx.conf 
server {
	listen	8000;
	server_name _;
	location / {
		root /usr/share/nginx/html;
		index	index.html index.htm;
	}
}
```

之后我们更改端口为8080：

```java
[root@server1 cm]# kubectl edit cm nginxconf 
configmap/nginxconf edited
```

```java
[root@server1 cm]# kubectl describe cm nginxconf 
Name:         nginxconf
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
nginx.conf:
----
server {
  listen  8080;		#更改成功
  server_name _;
  location / {
    root /usr/share/nginx/html;
    index  index.html index.htm;
  }
}
Events:  <none>
```

然后来触发更新：

```java
[root@server1 cm]# kubectl patch deployments.apps my-nginx --patch '{"spec": {"template": {"metadata": {"annotations": {"version/config": "20200428"}}}}}'
deployment.apps/my-nginx patched
[root@server1 cm]# kubectl get pod
NAME                        READY   STATUS    RESTARTS   AGE
my-nginx-5688cf6755-d8bw6   1/1     Running   0          8s
[root@server1 cm]# kubectl get pod -o wide
NAME                        READY   STATUS    RESTARTS   AGE   IP            NODE      NOMINATED NODE   READINESS GATES
my-nginx-5688cf6755-d8bw6   1/1     Running   0          16s   10.244.2.64   server3   <none>           <none>
```

当然也可以使用删除pod的方法触发，接下来测试访问：

说明配置成功更新。

实验后删除：

```java
[root@server1 cm]# kubectl delete -f pod4.yaml 
deployment.apps "my-nginx" deleted
```
