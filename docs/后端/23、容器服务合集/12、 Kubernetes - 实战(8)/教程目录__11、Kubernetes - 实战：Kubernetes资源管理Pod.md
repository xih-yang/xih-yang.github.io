# 11、Kubernetes - 实战：Kubernetes资源管理Pod
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/11.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes命令行创建Pod

### 1.1 管理节点：创建并运行Nginx镜像

```java
kubectl run nginx --image=nginx --replicas=3
	• kubectl run: 运行容器
	• nginx: 服务名
	• --image：镜像名称
	• --replicas：副本数
查看容器状态
Kubectl get pods
```

### 1.2 创建内网访问的service

```java
管理节点：创建service通过deployment资源管理，并暴露一个内网访问地址
# Kubectl expose deployment nginx --port=88 --target-port=80
# kubectl expose deployment 发布服务名 --port=暴露端口 --target-port=容器端口
注：同过kubernetes负载均衡暴露出一个唯一的IP地址。
命令：# kubectl get service  nginx
工作节点：测试内网访问
# curl -I 10.10.10.187:88
HTTP/1.1 200 OK
Server: nginx/1.15.6
Date: Thu, 22 Nov 2018 07:00:44 GMT
Content-Type: text/html
Content-Length: 612
Last-Modified: Tue, 06 Nov 2018 13:32:09 GMT
Connection: keep-alive
ETag: "5be197d9-264"
Accept-Ranges: bytes
```

### 1.3 创建内网访问基础上，创建外网访问暴露端口

```java
管理节点：创建service通过deployment并暴露88端口（在88端口负载TCP流量）
# kubectl expose deployment nginx --port=88 --type=NodePort --target-port=80
# kubectl expose deployment 资源名 --port=暴露内网端口 --type=协议类型 --target-port=容器端口
管理节点：查看外网暴露端口
# kubectl get service nginx
NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE
nginx NodePort 10.10.10.134 <none> 88:32428/TCP 4m    32428为外网暴露随机端口
外网测试访问
# curl -I http://192.168.1.78:32428
HTTP/1.1 200 OK
Server: nginx/1.15.6
Date: Thu, 22 Nov 2018 07:16:30 GMT
Content-Type: text/html
Content-Length: 612
Last-Modified: Tue, 06 Nov 2018 13:32:09 GMT
Connection: keep-alive
ETag: "5be197d9-264"
Accept-Ranges: bytes
```

## 二、使用YAML文件创建Pod

### 2.1 管理节点：创建pod yaml文件

```java
vim pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-test
  labels:
    os: centos
spec:
  containers:
  - name: hello
    image: centos:6
    env:
    - name: Test
      value: "123456"
    command: ["bash","-c","while true;do date;sleep 1;done"]
---
# api版本
apiVersion: v1
# 指定创建资源对象
kind: Pod
# 源数据、可以写name，命名空间，对象标签
metadata:
# 服务名称
  name: pod-test
# 标签
  labels:
# 标签名
    os: centos
# 容器资源信息
spec:
# 容器管理
  containers:
# 容器名称
  - name: hello
# 容器镜像
    image: centos:6
# 添加环境变量
    env:
# 创建key
    - name: Test
# 创建value
      value: "123456"
# 启动容器后执行命令
    command: ["bash","-c","while true;do date;sleep 1;done"]
注：一个pod可指定多个容器。command命令执行一个持续命令避免容器关闭。
```

### 2.2 基本命令使用

```java
管理节点：创建pod
Kubectl create -f pod.yaml
管理节点：基本管理操作
基本管理：
创建pod资源
kubectl create -f pod.yaml
查看pods
kubectl get pods pod-test
查看pod描述
kubectl describe pod pod-test
替换资源
kubectl replace -f pod.yaml -force
删除资源
kubectl delete pod pod-test
```

## 三、Pod镜像拉取策略

### 3.1Kubernetes Pod镜像拉起策略

```java
• IfNotPresent：默认值，镜像在宿主机上不存在时才拉取
• Always：每次创建 Pod 都会重新拉取一次镜像
• Never： Pod 永远不会主动拉取这个镜像
```

```java
# 查看已创建deployment的拉取策略
# kubectl get deploy/nginx-deployment -o yaml | grep imagePull
imagePullPolicy:ifNoPresent
```

```java
认证镜像仓库拉取方法
• 1、Node：修改需要认证的镜像仓库
# vim /etc/docker/daemon.json
{"insecure-registries": ["需要认证的仓库地址"]}
• 2、Node：登录镜像仓库（可提交项目镜像到私有仓库）
docker login 镜像仓库IP地址
• 3、Node：查看仓库docker认证信息、并编码
cat ~/.docker/config.json | base64 -w 0
• 4、Master：创建认证yaml文件、 .dockerconfigjson下就是Node config.json的编码信息
apiVersion: v1
kind: Secret
metadata:
  拉取镜像策略定义名称
  name: registry-pull-secret
data:
  .dockerconfigjson: ewoJImF1dGhzIjkfldsajkfldsajklfsJKLFJDAKLJKljkJjfkldsjkfdsaJKLFDASLjkljfklJFKDLHASKjkjfLfdsjaklfjdsaklFDSAJKLFDJSAKLFDSAjklfjdsaklf;jdaklfj;dsklajfkldsajfkld;ajkfld==
type: kubernetes.io/dockerconfigjson
下面根据条件完成策略
apiVersion: v1
kind: Pod
metadata:
  name: foo
  namespace: awesomeapps
spec:
  containers:
    - name: foo
      image: janedoe/awesomeapp:v1
      imagePullPolicy: IfNotPresent
---------------------------------------------------------
apiVersion: v1
kind: Pod
metadata:
  name: foo
  namespace: awesomeapps
spec:
  containers:
    - name: foo
      image: janedoe/awesomeapp:v1
  imagePullSecrets:
    - name: myregistrykey
```

## 四、Kubernetes容器扩容与缩容

### 4.1 创建环境：

```java
1、Deployment名称：nginx-depoly
2、pods副本数：3
3、image镜像：nginx1.9
```

### 4.2 管理节点：扩容或缩容deployment的pod副本

```java
kubectl scale deployment nginx-deploy --replicas=10
Kubectl scale 资源类型 资源名称 --replicas=扩展副本数
```

### 4.3 管理节点：设置扩容缩容添加赋值范围

```java
kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80
kubectl autoscale 资源类型 资源名称 --max=最大值 --最小值 --cpu-percent=cpu百分比以内
```

### 4.4管理节点：查看扩缩容状态

```java
kubectl get hpa
NAME                   REFERENCE                     TARGETS           MINPODS   MAXPODS   REPLICAS   AGE
hpa/nginx-deployment   Deployment/nginx-deployment   <unknown> / 80%       10       15
```

## 五、Kubernetes容器更行与回滚

### 5.1创建环境：

```java
• 1、Deployment名称：nginx-deployment
• 2、pods副本数为：3
• 3、image镜像：nginx1.9
```

### 5.2 更新升级

```java
方案一：管理节点：滚动升级镜像
kubectl set image deployment nginx-deploy nginx=nginx:1.11
kubectl set image 资源类型/资源名称  容器名称=容器版本
方案二：管理节点：修改原yaml配之文件重新加载完成升级
kubectl apply -f nginx-deploy.yaml
管理节点：查看升级状态
查看deployment镜像升级描述信息
命令：kubectl describe deployment nginx-deployment
# 镜像已更新
  Image:        nginx:1.11
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
# 扩容版本
  Normal  ScalingReplicaSet  24m   deployment-controller  Scaled up replica set nginx-deployment-845cfc7fb9 to 3
  Normal  ScalingReplicaSet  49s   deployment-controller  Scaled up replica set nginx-deployment-7ff5df4cfb to 1
# 缩容版本
  Normal  ScalingReplicaSet  34s   deployment-controller  Scaled down replica set nginx-deployment-845cfc7fb9 to 2
# 扩容版本
  Normal  ScalingReplicaSet  34s   deployment-controller  Scaled up replica set nginx-deployment-7ff5df4cfb to 2
# 缩容版本
  Normal  ScalingReplicaSet  18s   deployment-controller  Scaled down replica set nginx-deployment-845cfc7fb9 to 1
# 扩容版本
  Normal  ScalingReplicaSet  18s   deployment-controller  Scaled up replica set nginx-deployment-7ff5df4cfb to 3
# 缩容版本
  Normal  ScalingReplicaSet  15s   deployment-controller  Scaled down replica set nginx-deployment-845cfc7fb9 to 0
实时观察发布状态
命令：kubectl rollout status deployment/nginx-deployment
Waiting for rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for rollout to finish: 1 old replicas are pending termination...
Waiting for rollout to finish: 1 old replicas are pending termination...
deployment "nginx-deployment" successfully rolled out
管理节点：查看deployment版本
查看deployment历史修订版本
命令：kubectl rollout history deployment/nginx-deployment
deployments "nginx-deployment"
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
查看指定历史修订版本
命令：kubectl rollout history deployment/nginx-deployment --revision=1
deployments "nginx-deployment" with revision1
Pod Template:
  Labels:    app=nginx
    pod-template-hash=4017973965
  Containers:
   nginx:
    Image:    nginx:1.10
    Port:    80/TCP
    Environment:    <none>
    Mounts:    <none>
  Volumes:    <none>
```

### 5.3 版本回滚

```java
管理节点：回滚到上一个版本
kubectl rollout undo deployment nginx-deployment
kubectl rollout undo 资源类型 资源名称
管理节点：指定版本回滚
kubectl rollout undo deployment/nginx-deployment --to-revision=3
kubectl rollout undo 资源类型 资源名称 --to-revision=版本号
注：kubectl rollout history 资源类型 资源名称 查看的版本号。
管理节点：查看回滚情况
命令：kubectl rollout history deployment/nginx-deployment
deployments "nginx-deployment"
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
4         <none>
5         <none>
注：将还原版本覆盖，并生成新的版本号。
```

## 六、Kubernetes容器资源限制

```java
Pod和Container的资源请求和限制：
	• spec.containers[].resources.limits.cpu
	• spec.containers[].resources.limits.memory
	• spec.containers[].resources.requests.cpu
	• spec.containers[].resources.requests.memory
```

### 6.1 创建测试实例

```java
vim pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: frontend
spec:
  containers:
  - name: db
    image: mysql
    env:
    - name: MYSQL_ROOT_PASSWORD
      value: "password"
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
  - name: wp
    image: wordpress
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

### 6.2 查看pod创建实例

```java
kubectl get pods
```

### 6.3 查看pod详情，找到分配到的Node

```java
kubectl describe pod frontend
```

### 6.4 Node跑的Pod资源利用率

```java
kubectl describe nodes 192.168.1.11
.....
 Kube-Proxy Version:         v1.12.1
Non-terminated Pods:         (4 in total)
  Namespace                  Name                               CPU Requests  CPU Limits  Memory Requests  Memory Limits
  ---------                  ----                               ------------  ----------  ---------------  -------------
  default                    frontend                           500m (12%)    1 (25%)     128Mi (9%)       256Mi (18%)
  default                    nginx-7b67cfbf9f-p8d69             0 (0%)        0 (0%)      0 (0%)           0 (0%)
  default                    nginx-7b67cfbf9f-xlvnz             0 (0%)        0 (0%)      0 (0%)           0 (0%)
  default                    nginx-deployment-d55b94fd-rpsgm    0 (0%)        0 (0%)      0 (0%)           0 (0%)
Allocated resources:
  (Total limits may be over 100 percent, i.e., overcommitted.)
# 限制说明
  Resource                       Requests    Limits
  --------                       --------    ------
  cpu                            500m (12%)  1 (25%)
  memory                         128Mi (9%)  256Mi (18%)
  attachable-volumes-azure-disk  0           0
Events:                          <none>
注：limits是对资源的总限制、requests是最低分配的资源。requests一般要比limits要小一些。
注：250m/单核CPU的白分之25/0.25
注：资源限制 cpu可以直接设置为数字 “1”为1核“2”为2核。
```

## 七、Kubernetes容器调度约束

### 7.1、Kubernetes Pod调度约束

```java
	• 可以将pod调度到指定的节点Node内
	• 默认：根据节点资源利用率等分配Node节点。
	• nodeName用于将Pod调度到指定的Node名称上
	• nodeSelector用于将Pod调度到匹配Label的Node上
```

#### 工作流程

K8s通过watch实现组件工作。

**1、** 管理员通过命令创建Pod-->apiserver接收到-->状态写入到etcd-->scheduler通过watch获取etcd中获取新的Pod-->通过算法选出pod应该调度到哪些节点内-->绑定到新的节点并更新到etcd中；

**2、** kubelet通过watch从etcd中获取到绑定到自己节点的pod-->将pod通过dockerrun启动运行-->在将状态（运行状态）更新到etcd中，根据kubelet周期上报；

**3、** 管理员查看pod状态-->查找etcd中pod状态-->返回给用户；

#### 使用方法

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  labels:
    app: nginx
spec:
  nodeName: 192.168.31.65
  containers:
  - name: nginx
    image: nginx:1.15
-----------------------
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
spec:
  nodeSelector:
    env_role: dev
  containers:
  - name: nginx
    image: nginx:1.15
实践（指定NodeIP）
```

**1、** 创建测试pod；

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  labels:
    app: nginx
spec:
  nodeName: 192.168.1.111
  containers:
  - name: nginx
    image: nginx:1.15
```

**2、** 创建文件；

```java
kubectl create -f pod5.yaml
```

**3、** 查看pod调度节点；

```java
kubectl get pods -o wide
NAME READY STATUS RESTARTS AGE IP NODE 
pod-example 1/1 Running 0 42s 172.17.1.4 192.168.1.111 <none>
```

**4、** 查看详情；直接绕过调度器；

```java
kubectl describe pod pod-example
...
Events:
  Type    Reason   Age    From                    Message
  ----    ------   ----   ----                    -------
  Normal  Pulling  9m8s   kubelet, 192.168.1.111  pulling image "nginx:1.15"
  Normal  Pulled   8m48s  kubelet, 192.168.1.111  Successfully pulled image "nginx:1.15"
  Normal  Created  8m48s  kubelet, 192.168.1.111  Created container
  Normal  Started  8m47s  kubelet, 192.168.1.111  Started container
```

#### 实践（指定标签）

**1、** 给指定Node设置标签；为team团队ab队（自定义=自定义）；

```java
kubectl label nodes 192.168.1.111 team=a
kubectl label nodes 192.168.1.110 team=b
```

**2、** 查看标签；

```java
kubectl get nodes --show-labels
192.168.1.110 Ready <none> 2d15h v1.12.1 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=192.168.1.110,team=b
192.168.1.111 Ready <none> 2d15h v1.12.1 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=192.168.1.111,team=a
```

**3、** 创建文件通过标签指定Node；

```java
# vim pod6.yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
spec:
  nodeSelector:
    team: b
  containers:
  - name: nginx
    image: nginx:1.15
```

**4、** 查看状态；

```java
Kubectl get pods -o wide
```

**5、** 查看详情；走默认调度；

```java
Kubectl describe pod pod-example
```

## 八、Kubernetes容器重启策略

### 8.1 Kubernetes Pod重启策略

当容器被创建时，容器会根据重启策略来进行容器重启。

支持三种策略：

```java
	• Always：当容器终止退出后，总是重启容器，默认策略。
	• OnFailure：当容器异常退出（退出状态码非0）时，才重启容器。
	• Never：当容器终止退出，从不重启容器。
```

### 8.2 案例一：

**1、** 管理节点：创建Pod时添加重启策略；

```java
vim pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-test
  labels:
    test: centos
spec:
  containers:
  - name: hello
    image: centos:6
    command: ["bash","-c","while true;do date;sleep 1;done"]
  restartPolicy: OnFilure
注释
# api版本
apiVersion: v1
# 指定创建资源对象
kind: Pod
# 源数据、可以写name，命名空间，对象标签
metadata:
# 服务名称
  name: pod-test
# 标签
  labels:
# 标签名
    os: centos
# 容器资源信息
spec:
# 容器管理
  containers:
# 容器名称
  - name: hello
# 容器镜像
    image: centos:6
# 添加环境变量
    env:
# 创建key
    - name: Test
# 创建value
      value: "123456"
# 启动容器后执行命令
    command: ["bash","-c","while true;do date;sleep 1;done"]
# 重启策略 可添加（Always，OnFailure，Never）
  restartPolicy: OnFilure
```

**2、** 管理节点：创建pod；

```java
kubectl create -f pod.yaml
```

**3、** 查看pod状态；

```java
kubectl create -f pod.yaml
```

### 8.3 案例二

#### 查看默认重启策略

```java
kubectl edit deployment nginx
restartPolicy: Always
```

语法格式

```java
apiVersion: v1
kind: Pod
metadata:
  name: foo
  namespace: awesomeapps
spec:
  containers:
    - name: foo
      image: janedoe/awesomeapp:v1
  restartPolicy: Always
```

**1、** 创建测试yaml；每个10秒发出异常退出重启容器；

```java
apiVersion: v1
kind: Pod
metadata:
  name: foo
spec:
  containers:
  - name: busybox
    image: busybox
    args:
    - /bin/sh
    - -c
    - sleep 10
```

**2、** 执行文件；

```java
kubectl create -f restart.yaml
```

**3、** 设置重启策略，当容器异常退出时直接销毁，不重启；

```java
apiVersion: v1
kind: Pod
metadata:
  name: foo
spec:
  containers:
  - name: busybox
    image: busybox
    args:
    - /bin/sh
    - -c
    - sleep 10
  restartPolicy: Never
```

**4、** 执行文件；

```java
kubectl create -f restart.yaml
```

**5、** 测试；

10秒后查看

## 九、Kubernetes容器健康检查

### 9.1 Kubernetes 健康检查

提供Probe探测机制，有以下三种类型：

```java
	• StartupProbe：k8s1.16版本后新加的探测方式，用于判断容器内应用程序是否已经启动。如果配置startupProbe，机会先禁止其他探测，直到它成功为止，成功后将不进行探测。
	• livenessProbe：用于探测容器是否运行，如果探测失败，kubelet会根据配置重启策略进行相应的处理。若没有配置该探针，默认就是success。
	• readinessProbe：一般用于探测容器内的程序是否健康，它的返回值如果为success，那么就代表这个容器已经完成启动，并且程序已经是可以接收流量的状态。
```

Probe支持以下三种检查方法：

```java
	• httpGet
	• 发送HTTP请求，返回200-400范围状态码为成功。
	• exec
	• 执行Shell命令返回状态码是0为成功。
	• tcpSocket
	• 发起TCP Socket建立成功。判断端口有没有打开
```

探针检查参数使用：

```java
	• initiaDelaySeconds: 60   初始化时间
	• timeoutSeconds: 2   超时时间
	• periodSeconds: 5   检测间隔
	• successThreshold: 1   检查成功为2次表示就绪
	• failureThreshold: 2    检测失败1次表示就绪
```

### 9.2 案例一

**1、** 管理节点：创建yaml文件；

```java
# vim check.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.10
    ports:
    - containerPort: 80
    livenessProbe:
      httpGet:
        path: /index.html
        port: 80
文件注释
# api版本
apiVersion: v1
# 指定创建资源对象
kind: Pod
# 源数据、可以写name，命名空间，对象标签
metadata:
# 服务名称
  name: nginx-pod
# 标签
  labels:
# 标签名
    app: nginx 
# 容器资源信息
spec:
# 容器管理
  containers:
# 容器名称
  - name: nginx
# 容器镜像
    image: nginx:1.10
# 端口管理
    ports:
# 指定暴露端口
    - containerPort: 80
# 健康检查模式（httpGet、exec、tcpSocket）
    livenessProbe:
# 选择健康检查类型
      httpGet:
# 选择检查文件
        path: /index.html
# 选择检查暴露端口
        port: 80
```

**2、** 管理节点：创建Pod；

```java
kubectl create -f check.yaml
```

**3、** 查看健康检查pod状态；

```java
命令：kubectl describe pods nginx-pod
# 探测端口为80，探测文件名index.html，timeout超市时间为一秒，period每10秒探测一次
    Liveness:       http-get http://:80/index.html delay=0s timeout=1s period=10ssuccess=1failure=3
```

### 9.3 案例二

语法格式

```java
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness
  name: liveness-exec
spec:
  containers:
  - name: liveness
    image: k8s.gcr.io/busybox
    args:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      在容器启动五秒之后开始执行健康检查
      initialDelaySeconds: 5
         timeoutSeconds: 2   超时时间
      每隔多长时间执行一次
     periodSeconds: 5
      successThreshold: 1   检查成功为2次表示就绪
      failureThreshold: 1       检测失败1次表示未就绪
```

**1、** 通过官方实例测试健康检查；

```java
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness
  name: liveness-exec
spec:
  containers:
  - name: liveness
    image: busybox
    args:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 5
      periodSeconds: 5
```

**2、** 执行；

```java
kubectl create -f pod4.yaml
```

**3、** 查看测试；

```java
kubectl get pods
```

经过一段时间检查启动

**4、** 查看事件；

```java
kubectl describe pod liveness-exec
....
Events:
  Type     Reason     Age                   From                    Message
  ----     ------     ----                  ----                    -------
  Normal   Scheduled  5m8s                  default-scheduler       Successfully assigned default/liveness-exec to 192.168.1.110
  Normal   Pulled     2m35s (x3 over 5m7s)  kubelet, 192.168.1.110  Successfully pulled image "busybox"
  Normal   Created    2m35s (x3 over 5m6s)  kubelet, 192.168.1.110  Created container
  Normal   Started    2m34s (x3 over 5m6s)  kubelet, 192.168.1.110  Started container
  Warning  Unhealthy  112s (x9 over 4m32s)  kubelet, 192.168.1.110  Liveness probe failed: cat: can't open '/tmp/healthy': No such file or directory
  Normal   Pulling    81s (x4 over 5m7s)    kubelet, 192.168.1.110  pulling image "busybox"
  Normal   Killing    6s (x4 over 3m51s)    kubelet, 192.168.1.110  Killing container with id docker://liveness:Container failed liveness probe.. Container will be killed and recreated
```
