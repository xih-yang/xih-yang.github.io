# 10、Kubernetes - 实战：Pod健康检查原理-探针（就绪检测、存活检测）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/10.html
- 分类：容器服务
- 分组：教程目录
## 探针-就绪探测、存活探测

探针是由kubelet对容器执行的定期诊断，要执行诊断，kubelet调用由容器实现的Handler，有**三种类型**的处理程序：

ExecActive：在容器内执行指定命令，若命令退出时返回码为0，则认为诊断成功

TCPSockeAction：对指定端口上的容器的ip地址进行tcp检查，如果端口打开，则诊断为成功

HTTPGetAction：对指定端口和路径上的容器ip地址执行HTTP Get请求，如果相应的状态码>200且<400，则诊断是成功的

每次探测都将获得以下**三种结果**之一：

成功：容器通过了诊断

失败：容器未通过诊断

未知：诊断失败，不会采取任何行动

## 两种探测方式：

- livenessProbe（存活检测）：指示容器是否正在运行，如果存活检测失败，则kubelet会杀死容器，并且容器将受到其重启策略的影响。如果容器不提供存活探针，则默认状态为Success
- readinessProbe（就绪探测）：指示容器是否准备好服务请求。如果就绪探测失败，端点控制器将从与Pod匹配的所有的service的端点中删除该Pod的IP地址，初始延迟之前的就绪状态默认为Failure。如果容器不提供就绪探针，则默认状态为Success

**测试**

```java
## 就绪探测
## 创建yaml文件
vim readinessProbe-httpget.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: readiness-httpget-pod
  namespace: default
spec:
  containers:
  - name: readiness-httpget-container
    image: hub.vfancloud.com/test/myapp:v1
    imagePullPolicy: IfNotPresent
    readinessProbe:
      httpGet:
        port: 80
        path: /index1.html
      initialDelaySeconds: 1 Pod开启后，延迟1s再进行检测
      periodSeconds: 3 检测间隔时长
...
## 查看Pod状态，状态为运行，却没ready
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                    READY   STATUS    RESTARTS   AGE
readiness-httpget-pod   0/1     Running   0          14s
## 查看描述，报错404
[root@Centos8 k8sYaml]# kubectl describe pod readiness-httpget-pod
  Warning  Unhealthy  0s (x2 over 2s)  kubelet, testcentos7  Readiness probe failed: HTTP probe failed with statuscode: 404
## 添加index1.html即可ready
[root@Centos8 k8sYaml]# kubectl exec -it readiness-httpget-pod -- touch /usr/share/nginx/html/index1.html
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                    READY   STATUS    RESTARTS   AGE
readiness-httpget-pod   1/1     Running   0          5m5s
```

存活检测

```java
## 存活检测，只要存活检测失败，就会重启Pod
## 创建exec yaml文件
vim livenessProbe-exec.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: liveness-exec-pod
  namespace: default
spec:
  containers:
  - name: liveness-exec-container
    image: busybox:v1
    imagePullPolicy: IfNotPresent
    command: ['sh','-c','touch /tmp/live ;sleep 60; rm -f /tmp/live; sleep 3600']
    livenessProbe:
      exec:
        command: ['test','-e','/tmp/live'] 检测有无/tmp/live文件
      initialDelaySeconds: 1 Pod开启后，延迟1s再进行检测
      periodSeconds: 3 检测间隔时长
...
## 前60s Pod是正常运行状态
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                    READY   STATUS    RESTARTS   AGE
liveness-exec-pod       1/1     Running   0          5s
readiness-httpget-pod   1/1     Running   0          39m
## 60s后，Pod已经出错重启一次
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                    READY   STATUS    RESTARTS   AGE
liveness-exec-pod       1/1     Running   1          118s
readiness-httpget-pod   1/1     Running   0          41m
## 创建httpGet yaml文件
vim livenessProbe-httpget.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: liveness-httpget-pod
  namespace: default
spec:
  containers:
  - name: liveness-httpget-container
    image: hub.vfancloud.com/test/myapp:v1
    imagePullPolicy: IfNotPresent
    ports:
    - name: http
      containerPort: 80
    livenessProbe:
      httpGet:
        port: 80
        path: /index.html 请求此文件内容
      initialDelaySeconds: 1
      periodSeconds: 3
      timeoutSeconds: 10 最大请求时长
...
## 查看pod
[root@Centos8 k8sYaml]# kubectl get pod
NAME                   READY   STATUS    RESTARTS   AGE
liveness-httpget-pod   1/1     Running   0          3s
## 测试删除index.html文件，Pod已经开始重启
[root@Centos8 k8sYaml]# kubectl exec -it liveness-httpget-pod -- rm -f /usr/share/nginx/html/index.html
[root@Centos8 k8sYaml]# kubectl get pod
NAME                   READY   STATUS    RESTARTS   AGE
liveness-httpget-pod   1/1     Running   1          84s
## 创建tcp yaml文件
vim livenessProbe-tcp.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: liveness-httpget-pod
  namespace: default
spec:
  containers:
  - name: nginx
    image: hub.vfancloud.com/test/myapp:v1
    imagePullPolicy: IfNotPresent
    livenessProbe:
      tcpSocket: 检测8080是否存在
        port: 8080
      initialDelaySeconds: 1
      periodSeconds: 3
      timeoutSeconds: 10
...
## 因为镜像内没开启8080，所以Pod会一直重启
[root@Centos8 k8sYaml]# kubectl get pod 
NAME                   READY   STATUS    RESTARTS   AGE
liveness-httpget-pod   1/1     Running   1          18s
```
