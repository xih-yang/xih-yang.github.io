# 03、Kubernetes - 实战：资源清单方式创建pod
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/3.html
- 分类：容器服务
- 分组：教程目录
## 一、认识资源清单

**1、** 什么是资源清单；

在k8s中，一般使用yaml格式的文件来创建符合我们预期期望的pod，这样的yaml文件我们一般称为资源清单

**2、** 资源清单的格式；

apiVersion: group/apiversion: 如果没有给定group名称，那么默认为croe，可以使用kubectl api-versions 获取当前k8s版本上所有的apiVersion版本信息(每个版本可能不同)

```java
kind:  资源类别
metadata: 资源元数据
　　name
　　namespacek8s自身的namespace
　　lables		#标签
　    annotations主要目的是方便用户阅读查找
spec:期望的状态（disired state）
status：当前状态，本字段有kubernetes自身维护，用户不能去定义
```

配置清单主要有五个一级字段，其中status用户不能定义，有k8s自身维护

**3、** 资源清单中的属性；

## 必须属性：

```java
参数名（字段类型） 	说明
version(String) 	k8s api的版本，目前基本是V1，可以使用kubectl api-versions命令查询
kind(String) 	yaml文件定义的资源类型和角色，，比如Pod
metadata(Object) 	元数据对象，固定值就写metadata
metadata.name(String) 	元数据对象的名字，由我们编写，如定义Pod的名字
metadata.namespace 	元数据对象的命名空间，由我们自身定义
Spec(Object) 	详细定义对象，固定值就写Spec
spec.containers[](list) 	Spec对象的容器列表定义，是个列表
spec.containers[].name(String) 	定义容器的名字
spec.containers[].image(String) 	容器用到的镜像名称
```

## 主要属性：

```java
spec.containers[].name(String):容器的名称
spec.containers[].imagePullPolicy(String):定义镜像拉取策略，有Always（每次都尝试重新拉取镜像）、Never（仅使用本地镜像）、IfNotPresent（如果本地有镜像就使用本地镜像，没有则拉取镜像）三个值可选，默认是Always
spec.containers[].command:指定容器启动命令，因为是数组可以指定多个，不指定则使用镜像打包时使用的启动命令
spec.containers[].args:指定容器启动命令参数，因为是数组可以指定多个
spec.containers[].workingDir(String):指定容器的工作目录
spec.containers[].volumeMounts:指定容器内部的存储卷配置
spec.containers[].volumeMounts[].name(String):指定被容器挂载的存储卷的名称
spec.containers[].volumeMounts[].mountPath(String):指定被容器挂载的存储卷的路径
spec.containers[].volumeMounts[].readOnly(String):设置存储卷路径的读写模式，true或者false，默认为读写模式
spec.containers[].ports:指定容器需要用到的端口列表
spec.containers[].ports[].name(String):指定端口名称
spec.containers[].ports[].containerPort(String):指定容器需要监听的端口号
spec.containers[].ports[].hostPort(String):指定容器所在主机需要监听的端口号，默认跟containerPort相同，注意设置了hostPort，同一台主机无法启动该容器的相同副本（因为主机的端口号不能相同，会冲突）
spec.containers[].ports[].protocol(String):指定端口协议，支持TCP和UDP,默认值是TCP
spec.containers[].env:指定容器运行前需要设置的环境变量列表
spec.containers[].env[].name(String):指定环境变量名称
spec.containers[].env[].value(String):指定环境变量值
spec.containers[].resources(Object):指定资源限制和资源请求的值
spec.containers[].resources.limits(Object):指定设置容器运行时资源的运行上限
spec.containers[].resources.limits.cpu(String):指定cpu的限制，单位为core数，将用于docker run --cpu-shares参数
spec.containers[].resources.limits.memory(String):指定mem内存的限制
spec.containers[].resources.requests(Object):指定容器启动和调度时的限制设置
spec.containers[].resources.requests.cpu(String):cpu请求，单位为core数，容器启动时初始化可用数量
spec.containers[].resources.requests.memory(String):内存请求，容器启动的初始化可用数量
```

## 额外属性

```java
spec.restartPolicy(String):定义Pod的重启策略，可选值为Always(Pod一旦终止运行，则无论容器是如何终止的，kubelet服务都将重启它)、OnFailure(只有Pod以非零码终止时，kubelet才会重启该容器，如果是正常结束，退出码为0，则kubelet将不会重启它)、Never(Pod终止后，kubelet将退出码报告给master，不会重启该Pod)
spec.nodeSelector(Object):定义Node的Label过滤标签，以key:value格式指定
spec.imagePullSecrets(Object):定义pull镜像时使用secret名称，以name:secretkey格式指定
spec.hostNetwork(Boolean):定义是否使用主机网络模式，默认值为false，设置true表示使用宿主机网络，不使用docker网桥，同时设置了true将无法在同一台宿主机上启动第二个副本```
## 二、资源清单编写
基础操作：
```java 
kubectl api-versions 	#列出api可用的版本
kubectl get pod --show-labels	#查看标签
kubectl explain pod	#查看编写pod需要用到的信息
kubectl explain pod.spec	#查看spec（spec可以控制pod的运行状态）
```

## 清单1

```java
mkdir manifest
cd manifest
vim pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers: 
    - name: myapp
      image: myapp:v1
      imagePullPolicy: IfNotPresent
```

创建：

```java
kubectl create -f pod.yaml 
kubectl get pod
```

删除：

```java
kubectl delete -f pod.yaml 
```

## 清单2

在一个pod中创建两个容器

```java
vim pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers: 
    - name: myapp
      image: myapp:v1
      imagePullPolicy: IfNotPresent
    - name: busyboxplus
      image: busyboxplus
      imagePullPolicy: IfNotPresent
      tty: true
kubectl create -f pod.yaml 
```

查看到创建了两个容器：

```java
kubectl get pod
kubectl describe pod myapp
```

连接pod中的一个容器 demo(busyboxplus)：

```java
kubectl exec -it myapp -c busyboxplus -- sh
curl localhost	#连接到另外一个容器
kubectl delete -f pod.yaml 
```

## 清单3

指定端口映射（当访问节点的80端口时使用DNAT转发到pod上）

```java
vim pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers: 
    - name: myapp
      image: myapp:v1
      imagePullPolicy: IfNotPresent
      ports:
        - containerPort: 80
          hostPort: 80
kubectl create -f pod.yaml 
```

测试：

```java
kubectl get pod -o wide
iptables -t nat -nL |grep :80
curl 172.25.254.3
kubectl delete -f pod.yaml 
```

## 清单4

资源限制（resources参数）

```java
vim pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers: 
    - name: myapp
      image: myapp:v1
      imagePullPolicy: IfNotPresent
      ports:
        - containerPort: 80
          hostPort: 80
      resources:
        limits:
          memory: 100M
        requests:
          memory: 50M
kubectl create -f pod.yaml 
```

查看：

```java
kubectl describe pod myapp
kubectl get pod -o wide
```

## 清单5

指定pod的运行节点

我们发现如果pod一开始被调度到了某个节点，之后还是会被调度到那个节点上；如果我们想指定运行节点，可以通过标签和主机名来指定

```java
kubectl get node --show-labels 
```

指定myapp运行在server3节点：

```java
vim pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers: 
    - name: myapp
      image: myapp:v1
      imagePullPolicy: IfNotPresent
      ports:
        - containerPort: 80
          hostPort: 80
      resources:
        limits:
          memory: 100M
        requests:
          memory: 50M
  nodeSelector:
    kubernetes.io/hostname: server3
kubectl create -f pod.yaml 
kubectl get pod -o wide
```

## 清单6

共享节点主机网络（hostNetwork参数）

注意：此时80端口不能被占用

```java
vim pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers: 
    - name: myapp
      image: myapp:v1
      imagePullPolicy: IfNotPresent
      ports:
        - containerPort: 80
          hostPort: 80
      resources:
        limits:
          memory: 100M
        requests:
          memory: 50M
  nodeSelector:
    kubernetes.io/hostname: server3
  hostNetwork: true
kubectl create -f pod.yaml 
kubectl get pod -o wide
netstat -antlp|grep :80
```

测试：

```java
curl 172.25.254.3
```
