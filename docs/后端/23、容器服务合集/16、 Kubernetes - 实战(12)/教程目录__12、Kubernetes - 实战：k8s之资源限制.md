# 12、Kubernetes - 实战：k8s之资源限制
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/12/12.html
- 分类：容器服务
- 分组：教程目录
## 1、安装metrics-server

官方代码仓库地址：[https://github.com/kubernetes-sigs/metrics-server](https://github.com/kubernetes-sigs/metrics-server)

```java
wget https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.4.4/components.yaml
mv components.yaml metrics-server.yaml
```

metrics-server.yaml

```java
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    k8s-app: metrics-server
    rbac.authorization.k8s.io/aggregate-to-admin: "true"
    rbac.authorization.k8s.io/aggregate-to-edit: "true"
    rbac.authorization.k8s.io/aggregate-to-view: "true"
  name: system:aggregated-metrics-reader
rules:
- apiGroups:
  - metrics.k8s.io
  resources:
  - pods
  - nodes
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    k8s-app: metrics-server
  name: system:metrics-server
rules:
- apiGroups:
  - ""
  resources:
  - pods
  - nodes
  - nodes/stats
  - namespaces
  - configmaps
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server-auth-reader
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: extension-apiserver-authentication-reader
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server:system:auth-delegator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: system:metrics-server
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:metrics-server
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: v1
kind: Service
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  ports:
  - name: https
    port: 443
    protocol: TCP
    targetPort: https
  selector:
    k8s-app: metrics-server
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
  strategy:
    rollingUpdate:
      maxUnavailable: 0
  template:
    metadata:
      labels:
        k8s-app: metrics-server
    spec:
      containers:
      - args:
        - --cert-dir=/tmp
        - --secure-port=4443
        - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
        - --kubelet-use-node-status-port
       image: k8s.gcr.io/metrics-server/metrics-server:v0.4.4
        image: harbor.ywx.net/k8s-baseimages/metrics-server:v0.4.4 
        imagePullPolicy: IfNotPresent
        livenessProbe:
          failureThreshold: 3
          httpGet:
            path: /livez
            port: https
            scheme: HTTPS
          periodSeconds: 10
        name: metrics-server
        ports:
        - containerPort: 4443
          name: https
          protocol: TCP
        readinessProbe:
          failureThreshold: 3
          httpGet:
            path: /readyz
            port: https
            scheme: HTTPS
          periodSeconds: 10
        securityContext:
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
        volumeMounts:
        - mountPath: /tmp
          name: tmp-dir
      nodeSelector:
        kubernetes.io/os: linux
      priorityClassName: system-cluster-critical
      serviceAccountName: metrics-server
      volumes:
      - emptyDir: {}
        name: tmp-dir
---
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  labels:
    k8s-app: metrics-server
  name: v1beta1.metrics.k8s.io
spec:
  group: metrics.k8s.io
  groupPriorityMinimum: 100
  insecureSkipTLSVerify: true
  service:
    name: metrics-server
    namespace: kube-system
  version: v1beta1
  versionPriority: 100
```

运行metrics-server.yaml清单

```java
#运行metrics-server前
root@k8s-master01:/apps/k8s-yaml/hpa# kubectl top nodes
W1028 22:12:32.344418  107255 top_node.go:119] Using json format to get metrics. Next release will switch to protocol-buffers, switch early by passing --use-protocol-buffers flag
error: Metrics API not available
#运行metrics-server后
root@k8s-master01:/apps/k8s-yaml/hpa# kubectl apply -f metrics-server.yaml 
serviceaccount/metrics-server created
clusterrole.rbac.authorization.k8s.io/system:aggregated-metrics-reader created
clusterrole.rbac.authorization.k8s.io/system:metrics-server created
rolebinding.rbac.authorization.k8s.io/metrics-server-auth-reader created
clusterrolebinding.rbac.authorization.k8s.io/metrics-server:system:auth-delegator created
clusterrolebinding.rbac.authorization.k8s.io/system:metrics-server created
service/metrics-server created
deployment.apps/metrics-server created
apiservice.apiregistration.k8s.io/v1beta1.metrics.k8s.io created
#使用kubectl top nodes命令可以显示所有节点的CPU和MEM使用状态
root@k8s-master01:/apps/k8s-yaml/hpa# kubectl top nodes
W1028 22:12:55.126877  107834 top_node.go:119] Using json format to get metrics. Next release will switch to protocol-buffers, switch early by passing --use-protocol-buffers flag
NAME             CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%   
172.168.33.207   310m         31%    1047Mi          81%       
172.168.33.208   92m          9%     994Mi           77%       
172.168.33.209   97m          9%     944Mi           73%       
172.168.33.210   121m         3%     684Mi           21%       
172.168.33.211   341m         8%     730Mi           22%       
172.168.33.212   135m         3%     692Mi           21%
```

## 2、对单个容器的CPU和Memory的限制

CPU以核心为单位。

memory 以字节为单位。

requests 为kubernetes scheduler执行pod调度时node节点至少需要拥有的资源。

limits 为pod运行成功后最多可以使用的资源上限。

## 1）单限制memory

case1-pod-memory-limit.yml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: limit-test-deployment
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:rs or deployment
      app: limit-test-pod
#    matchExpressions:
#      - {key: app, operator: In, values: [ng-deploy-80,ng-rs-81]}
  template:
    metadata:
      labels:
        app: limit-test-pod
    spec:
      containers:
      - name: limit-test-container
        image: lorel/docker-stress-ng
        resources:
          limits:
            memory: "200Mi" 该容器最多使用200Mi内存
          requests:
            memory: "100Mi" 该容器至少需要100Mi的内存才能创建
       command: ["stress"]
        args: ["--vm", "2", "--vm-bytes", "256M"]
     nodeSelector:
       env: group1
```

运行并验证

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl apply -f case1-pod-memory-limit.yml 
deployment.apps/limit-test-deployment created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get pod
NAME                                     READY   STATUS    RESTARTS   AGE
limit-test-deployment-7545f64fcc-gl2hf   1/1     Running   0          17s
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl top pod limit-test-deployment-7545f64fcc-gl2hf 
W1101 12:42:01.127532  593362 top_pod.go:140] Using json format to get metrics. Next release will switch to protocol-buffers, switch early by passing --use-protocol-buffers flag
NAME                                     CPU(cores)   MEMORY(bytes)   
limit-test-deployment-7545f64fcc-gl2hf   201m         140Mi  
#内存不会超过200m，cpu没有限制
```

## 2) 单限制cpu

case2-pod-cpu-limit.yml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: limit-test-deployment
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:rs or deployment
      app: limit-test-pod
#    matchExpressions:
#      - {key: app, operator: In, values: [ng-deploy-80,ng-rs-81]}
  template:
    metadata:
      labels:
        app: limit-test-pod
    spec:
      containers:
      - name: limit-test-container
        image: lorel/docker-stress-ng
        resources:
          limits:
            cpu: "200" 该容器最多使用200m cpu
          requests:
            cpu: "100" 该容器至少需要100m的cpu才能创建
       command: ["stress"]
        args: ["--vm", "2", "--vm-bytes", "256M"]
     nodeSelector:
       env: group1
```

验证

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl apply -f case2-pod-cpu-limit.yml 
deployment.apps/limit-test-deployment created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get pod limit-test-deployment-57d7b46855-v75pr 
NAME                                     READY   STATUS    RESTARTS   AGE
limit-test-deployment-57d7b46855-v75pr   1/1     Running   0          63s
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl top pod limit-test-deployment-57d7b46855-v75pr 
W1101 12:48:42.855050  599541 top_pod.go:140] Using json format to get metrics. Next release will switch to protocol-buffers, switch early by passing --use-protocol-buffers flag
NAME                                     CPU(cores)   MEMORY(bytes)   
limit-test-deployment-57d7b46855-v75pr   199m         516Mi       
#cpu最多200m,内存没有限制
```

## 3) 同时限制cpu和memory

case3-pod-memory-and-cpu-limit.yml

```java
#apiVersion: extensions/v1beta1
apiVersion: apps/v1
kind: Deployment
metadata:
  name: limit-test-deployment
  namespace: magedu
spec:
  replicas: 1
  selector:
    matchLabels:rs or deployment
      app: limit-test-pod
#    matchExpressions:
#      - {key: app, operator: In, values: [ng-deploy-80,ng-rs-81]}
  template:
    metadata:
      labels:
        app: limit-test-pod
    spec:
      containers:
      - name: limit-test-container
        image: lorel/docker-stress-ng
        resources:
          limits:
            cpu: "1.2"
            memory: "512Mi"
          requests:
            memory: "100Mi"
            cpu: "500m"
       command: ["stress"]
        args: ["--vm", "2", "--vm-bytes", "256M"]
     nodeSelector:
       env: group1
```

运行清单

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl apply -f case3-pod-memory-and-cpu-limit.yml 
deployment.apps/limit-test-deployment created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get pod limit-test-deployment-75bf5d7bb4-9c7jb 
NAME                                     READY   STATUS    RESTARTS   AGE
limit-test-deployment-75bf5d7bb4-9c7jb   1/1     Running   0          14s
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl top pod limit-test-deployment-75bf5d7bb4-9c7jb 
W1101 13:02:53.182863  612471 top_pod.go:140] Using json format to get metrics. Next release will switch to protocol-buffers, switch early by passing --use-protocol-buffers flag
NAME                                     CPU(cores)   MEMORY(bytes)   
limit-test-deployment-75bf5d7bb4-9c7jb   1199m        290Mi
```

## 3、对单个pod的CPU及memory实现资源限制--LimitRange

Limit Range是对具体某个Pod或容器的资源使用进行限制

[https://kubernetes.io/zh/docs/concepts/policy/limit-range/](https://kubernetes.io/zh/docs/concepts/policy/limit-range/)

限制namespace中每个Pod或容器的最小与最大计算资源

限制namespace中每个Pod或容器计算资源request、limit之间的比例

限制namespace中每个存储卷声明（PersistentVolumeClaim）可使用的最小与最大存储空间

设置namespace中容器默认计算资源的request、limit，并在运行时自动注入到容器中

尽管用户可以为容器或Pod资源指定资源需求及资源限制，但这并非强制性要求，那些未明确定义资源限制的容器应用很可能会因程序Bug或真实需求而吞掉本地工作节点上的所有可用计算资源。因此妥当的做法是，使用LimitRange资源在每个名称空间中限制每个容器的最小及最大计算资源用量，以及为未显式定义计算资源使用区间的容器设置默认的计算资源需求和计算资源限制。一旦在名称空间上定义了LimitRange对象，客户端创建或修改资源对象的操作必将受到LimitRange控制器的“验证”，任何违反LimitRange对象定义的资源最大用量的请求都将被直接拒绝。LimitRange支持在Pod级别与容器级别分别设置CPU和内存两种计算资源的可用范围，它们对应的资源范围限制类型分别为Pod和Container。一旦在名称空间上启用LimitRange，该名称空间中的Pod或容器的requests和limits的各项属性值必须在对应的可用资源范围内，否则将会被拒绝，这是验证型准入控制器的功能。以Pod级别的CPU资源为例，若某个LimitRange资源为其设定了[0.5,4]的区间，则相应名称空间下任何Pod资源的requests.cpu的属性值必须要大于等于500m，同时，limits.cpu的属性值也必须要小于等于4。而未显式指定request和limit属性的容器，将会从LimitRange资源上分别自动继承相应的默认设置，这是变异型准入控制器的功能。

LimitRange也支持在PersistentVolumeClaim资源级别设定存储空间的范围限制，它用于限制相应名称空间中创建的PVC对象请求使用的存储空间不能逾越指定的范围。未指定requests和limits属性的PVC规范，将在创建时自动继承LimitRange上配置的默认值。下面的资源清单（case4-LimitRange.yaml）分别为dev名称空间中的Pod、Container和PersistentVolumeClaim资源定义了各自的资源范围，并为后两者指定了相应可用资源规范的limits和requests属性上的默认值。其中用到的各配置属性中，default用于定义limits的默认值，defaultRequest定义requests的默认值，min定义最小资源用量，而最大资源用量可以使用max给出固定值，也可以使用maxLimitRequestRatio设定最小用量的指定倍数，同时定义二者时，其意义要相符。

case4-LimitRange.yaml

```java
apiVersion: v1
kind: LimitRange
metadata:
  name: limitrange-dev
  namespace: dev
spec:
  limits:
  - type: Container      限制的资源类型
    max:
      cpu: "2"           限制单个容器的最大CPU
      memory: "2Gi"      限制单个容器的最大内存
    min:
      cpu: "500m"        限制单个容器的最小CPU
      memory: "512Mi"    限制单个容器的最小内存
    default:
      cpu: "500m"        默认单个容器的CPU限制
      memory: "512Mi"    默认单个容器的内存限制
    defaultRequest:
      cpu: "500m"        默认单个容器的CPU创建请求
      memory: "512Mi"    默认单个容器的内存创建请求
    maxLimitRequestRatio:
      cpu: 2             限制CPU limit/request比值最大为2  
      memory: 2          限制内存limit/request比值最大为1.5
  - type: Pod
    max:
      cpu: "4"           限制单个Pod的最大CPU
      memory: "4Gi"      限制单个Pod最大内存
  - type: PersistentVolumeClaim
    max:
      storage: 50Gi       限制PVC最大的requests.storage
    min:
      storage: 30Gi       限制PVC最小的requests.storage
```

LimitRange仅在Container资源类型上可为CPU与内存设置default（limits属性的默认值）和defaultrequest（requests属性的默认值），Pod资源类型不支持。

LimitRange资源的详细描述会以非常直观、清晰的方式输出相关的资源限制及默认值的定义，将如上配置清单中的LimitRange资源resource-limits创建到集群上，而后便可使用describe命令查看：

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl create ns dev
namespace/dev created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl apply -f case4-LimitRange.yaml 
limitrange/limitrange-magedu created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get limitranges -n dev
NAME             CREATED AT
limitrange-dev   2021-11-01T06:39:23Z
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl describe limitranges limitrange-dev -n dev
Name:                  limitrange-dev
Namespace:             dev
Type                   Resource  Min    Max   Default Request  Default Limit  Max Limit/Request Ratio
----                   --------  ---    ---   ---------------  -------------  -----------------------
Container              memory    512Mi  2Gi   512Mi            512Mi          2
Container              cpu       500m   2     500m             500m           2
Pod                    cpu       -      4     -                -              -
Pod                    memory    -      4Gi   -                -              -
PersistentVolumeClaim  storage   30Gi   50Gi  -                -              -
```

LimitRange资源resource-limits的详细描述

通过在dev名称空间中创建Pod对象与PVC对象对各限制的边界和默认值的效果进行多维度测试。先创建一个仅包含一个容器且没有默认系统资源需求和限制的Pod对象：

```java
[root@k8s-master01 apps]# kubectl run testpod-1 --image="ikubernetes/demoapp:v1.0" -n dev
pod/testpod-1 created
```

Pod对象testpod-1资源规范中被自动添加了CPU和内存资源的requests和limits属性，它的值来自limitranges/resource-limits中的定义，如下面的命令及截取的结果片段所示。

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get pod testpod-1 -n dev -o yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    kubernetes.io/limit-ranger: 'LimitRanger plugin set: cpu, memory request for container
      testpod-1; cpu, memory limit for container testpod-1'
......
spec:
  containers:
  - image: ikubernetes/demoapp:v1.0
    imagePullPolicy: IfNotPresent
    name: testpod-1
    resources:
      limits:
        cpu: 500m
        memory: 512Mi
      requests:
        cpu: 500m
        memory: 512Mi
......
```

没有给containers配置资源限制，则使用case4-LimitRange.yaml中定义好的defaultRequest默认资源限制。

若Pod对象设定的CPU或内存的requests属性值小于LimitRange中相应资源的下限，或limits属性值大于设定的相应资源的上限，就会触发LimitRanger准入控制器拒绝相关的请求。例如下面创建Pod的命令中，仅requests.memory一个属性值违反了limitrange/resource-limits中的定义，但请求同样会被拒绝。

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-2 --image="ikubernetes/demoapp:v1.0" -n dev --limits='cpu=400m,memory=512Mi' --requests='cpu=100m,memory=512Mi' 
Flag --requests has been deprecated, has no effect and will be removed in the future.
Error from server (Forbidden): pods "testpod-2" is forbidden: [minimum cpu usage per Container is 500m, but request is 100m, cpu max limit to request ratio per Container is 2, but provided ratio is 5.000000]
#配置pod的cpu最少为100m,我们设置的pod资源cpu为500m~2，小于最小值，pod创建失败。
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-3 --image="ikubernetes/demoapp:v1.0" -n dev --limits='cpu=500m,memory=6G' --requests='cpu=500m,memory=100Mi' 
Flag --limits has been deprecated, has no effect and will be removed in the future.
Flag --requests has been deprecated, has no effect and will be removed in the future.
Error from server (Forbidden): pods "testpod-3" is forbidden: [minimum memory usage per Container is 512Mi, but request is 100Mi, maximum memory usage per Container is 2Gi, but limit is 6G, memory max limit to request ratio per Container is 2, but provided ratio is 57.220459, maximum memory usage per Pod is 4Gi, but limit is 6G]
#配置pod的men最大为6G,我们设置的pod资源men为512Mi-2G,大于最大值，pod创建失败。
```

在pod中定义cpu的limit/request比值为2

pod-cpu-RequestRatio-limit.yaml

```java
#apiVersion: extensions/v1beta1
apiVersion: apps/v1
kind: Deployment
metadata:
  name: limit-test-deployment
  namespace: dev
spec:
  replicas: 1
  selector:
    matchLabels:rs or deployment
      app: limit-test-pod
#    matchExpressions:
#      - {key: app, operator: In, values: [ng-deploy-80,ng-rs-81]}
  template:
    metadata:
      labels:
        app: limit-test-pod
    spec:
      containers:
      - name: limit-test-container
        image: lorel/docker-stress-ng
        resources:
          limits:
            cpu: 1000m
          requests:
            cpu: 500m
         limit/request比值为2
       command: ["stress"]
        args: ["--vm", "2", "--vm-bytes", "256M"]
     nodeSelector:
       env: group1
```

验证

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl apply -f pod-cpu-RequestRatio-limit.yaml 
deployment.apps/limit-test-deployment created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl apply -f pod-cpu-RequestRatio-limit.yaml 
deployment.apps/limit-test-deployment created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get pod -n dev
NAME                                    READY   STATUS    RESTARTS   AGE
limit-test-deployment-b657c87d8-b2k24   1/1     Running   0          7s
```

在pod中定义cpu的limit/request比值为3

pod-cpu-RequestRatio-limit.yaml

```java
#apiVersion: extensions/v1beta1
apiVersion: apps/v1
kind: Deployment
metadata:
  name: limit-test-deployment
  namespace: dev
spec:
  replicas: 1
  selector:
    matchLabels:rs or deployment
      app: limit-test-pod
#    matchExpressions:
#      - {key: app, operator: In, values: [ng-deploy-80,ng-rs-81]}
  template:
    metadata:
      labels:
        app: limit-test-pod
    spec:
      containers:
      - name: limit-test-container
        image: lorel/docker-stress-ng
        resources:
          limits:
            cpu: 1500m
          requests:
            cpu: 500m
         limit/request比值为3
       command: ["stress"]
        args: ["--vm", "2", "--vm-bytes", "256M"]
     nodeSelector:
       env: group1
```

验证

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl apply -f pod-cpu-RequestRatio-limit.yaml 
deployment.apps/limit-test-deployment created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get pod -n dev
No resources found in dev namespace.
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get deployments.apps -n dev
NAME                    READY   UP-TO-DATE   AVAILABLE   AGE
limit-test-deployment   0/1     0            0           38s
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get deployments.apps limit-test-deployment -n dev -o yaml
......
- lastTransitionTime: "2021-11-01T07:11:05Z"
    lastUpdateTime: "2021-11-01T07:11:05Z"
    message: 'pods "limit-test-deployment-64fdbbbfdc-kv6r9" is forbidden: cpu max
      limit to request ratio per Container is 2, but provided ratio is 3.000000'
......
#我们在limitrange中定义的比值为2，在pod中设置的为3，pod创建失败。
#root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get deployments.apps limit-test-deployment -n dev -o json
```

在pod中定义mem的limit/request比值同理也必须与LimitRange中设置一样。

在dev名称空间中创建的PVC对象的可用存储空间也将受到LimitRange资源中定义的限制。

需要注意的是，LimitRange生效于名称空间级别，它需要定义在每个名称空间之上；另外，定义的限制仅对该资源创建后的Pod和PVC资源创建请求有效，对之前已然存在的资源无效；再者，不建议在生效于同一名称空间的多个LimitRange资源上，对同一个计算资源限制进行分别定义，以免产生歧义或导致冲突。

## 4、对Namespace的限制--ResourceQuota

[https://kubernetes.io/zh/docs/concepts/policy/resource-quotas/](https://kubernetes.io/zh/docs/concepts/policy/resource-quotas/)

限定某个对象类型（如Pod、service）可创建对象的总数；

限定某个对象类型可消耗的计算资源（CPU、内存）与存储资源（存储卷声明）总数

尽管LimitRange资源能在名称空间上限制单个容器、Pod或PVC相关的系统资源用量，但用户依然可以创建出无数的资源对象，进而侵占集群上所有的可用系统资源。ResourceQuota资源能够定义名称空间级别的资源配额，从而在名称空间上限制聚合资源消耗的边界，它支持以资源类型来限制用户可在本地名称空间中创建的相关资源的对象数量，以及这些对象可消耗的计算资源总量等。而同名的ResourceQuota准入控制器负责观察传入的请求，并确保它没有违反相应名称空间中ResourceQuota资源定义的任何约束。ResourceQuota准入控制器属于“验证”类型的控制器，用户创建或更新资源的操作违反配额约束时将会被拒绝，API Server会响应以HTTP状态代码403 FORBIDDEN，并显示一条消息以提示违反的约束条件。ResourceQuota资源可限制名称空间中处于非终止状态的所有Pod对象的计算资源需求及计算资源限制总量。

```java
▪cpu或requests.cpu：CPU资源相关请求的总量限额。
▪memory或requests.memory：内存资源相关请求的总量限额。
▪limits.cpu：CPU资源相关限制的总量限额。
▪limits.memory：内存资源相关限制的总量限额。
```

ResourceQuota资源还支持为本地名称空间中的PVC存储资源的需求总量和限制总量设置限额，它能够分别从名称空间中的全部PVC、隶属于特定存储类的PVC以及基于本地临时存储的PVC分别进行定义。

```java
▪requests.storage：所有PVC存储需求的总量限额。
▪persistentvolumeclaims：可以创建的PVC总数限额。
▪<storage-class-name>.storageclass.storage.k8s.io/requests.storage：特定存储类上可使用的所有PVC存储需求的总量限额。
▪<storage-class-name>.storageclass.storage.k8s.io/persistentvolumeclaims：特定存储类上可使用的PVC总数限额。
▪requests.ephemeral-storage：所有Pod可以使用的本地临时存储资源的requets总量。
▪limits.ephemeral-storage：所有Pod可用的本地临时存储资源的limits总量。
```

在v1.9版本之前的Kubernetes系统上，ResourceQuota仅支持在有限的几种资源集上设定对象计数配额，例如pods、services和configmaps等，而自v1.9版本起开始支持以count/.的格式对所有资源类型对象的计数配额，例如count/deployments.apps、count/deployments.extensions和count/services等。

下面的资源清单（case6-ResourceQuota-magedu.yaml）在dev名称空间中定义了一个ResourceQuota资源对象，它定义了计算资源与存储资源分别在requests和limits维度的限额，也定义了部署资源类型中的可用对象数量。

case6-ResourceQuota-magedu.yaml

```java
apiVersion: v1
kind: ResourceQuota
metadata:
  name: quota-dev
  namespace: dev
spec:
  hard:
    requests.cpu: "46"  定义dev namespace中cpu的最少使用数
    limits.cpu: "46"    定义dev namespace中cpu的最大使用数
    requests.memory: 120Gi 定义dev namespace中mem的最少使用数
    limits.memory: 120Gi   定义dev namespace中mem的最大使用数
    requests.nvidia.com/gpu: 4定义dev namespace最多使用的显卡
    pods: "2"   定义dev namespace最多创建的pod数
    services: "20" 定义dev namespace最多创建的services数
```

与LimitRange不同的是，ResourceQuota会计入指定范围内，先前的资源对象对系统资源和资源对象的限额占用情况，因此将resourceqouta-demo创建到集群上之后，dev名称空间中现有的资源会立即分去限额内的一部分可用空间，这在ResourceQuota资源的详细描述中会有直观展示。

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl apply -f case6-ResourceQuota-magedu.yaml 
resourcequota/quota-dev created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl describe resourcequota/quota-dev -n dev
Name:                    quota-dev
Namespace:               dev
Resource                 Used  Hard
--------                 ----  ----
limits.cpu               0     46
limits.memory            0     120Gi
pods                     0     2
requests.cpu             0     46
requests.memory          0     120Gi
requests.nvidia.com/gpu  0     4
services                 0     20
```

ResourceQuota资源详细描述示例

dev名称空间下的Pod资源限额已被先前的自主式Pod对象消耗了1/5，与此同时，计算资源请求和限制也各占用了一部分配额。随后，在dev名称空间中创建Pod资源时，requests.cpu、requests.memroy、limits.cpu、limits.memory和pods等任何一个限额的超出都将致使创建操作失败，如下面的命令及结果所示。

```java
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-1 --image="ikubernetes/demoapp:v1.0" -n dev
Error from server (Forbidden): pods "testpod-1" is forbidden: failed quota: quota-dev: must specify limits.cpu,limits.memory,requests.cpu,requests.memory
#配置ResourceQuota资源，必须配置pod资源限制，否则无法创建pod
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-1 --image="ikubernetes/demoapp:v1.0" --requests="cpu=500m,memory=512Mi" --limits="cpu=500m,memory=512Mi" -n dev
pod/testpod-1 created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-2 --image="ikubernetes/demoapp:v1.0" --requests="cpu=500m,memory=512Mi" --limits="cpu=500m,memory=512Mi" -n dev
pod/testpod-2 created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-3 --image="ikubernetes/demoapp:v1.0" --requests="cpu=500m,memory=512Mi" --limits="cpu=500m,memory=512Mi" -n dev
Error from server (Forbidden): pods "testpod-3" is forbidden: exceeded quota: quota-dev, requested: pods=1, used: pods=2, limited: pods=2
#在dev namespace中pod资源超过了2个
```

先清空dev下的所有资源后，先创建3个pod，在运行ResourceQuota资源清单

```java
#清空dev下的所有资源
#创建3个pod
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-1 --image="ikubernetes/demoapp:v1.0" --requests="cpu=500m,memory=512Mi" --limits="cpu=500m,memory=512Mi" -n dev
pod/testpod-1 created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-2 --image="ikubernetes/demoapp:v1.0" --requests="cpu=500m,memory=512Mi" --limits="cpu=500m,memory=512Mi" -n dev
pod/testpod-2 created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-3 --image="ikubernetes/demoapp:v1.0" --requests="cpu=500m,memory=512Mi" --limits="cpu=500m,memory=512Mi" -n dev
pod/testpod-3 created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get pod -n dev
NAME        READY   STATUS    RESTARTS   AGE
testpod-1   1/1     Running   0          19s
testpod-2   1/1     Running   0          13s
testpod-3   1/1     Running   0          6s
#运行case6-ResourceQuota-dev.yaml
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl apply -f case6-ResourceQuota-dev.yaml 
resourcequota/quota-dev created
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get resourcequotas quota-dev -n dev
NAME        AGE   REQUEST                                                                                                          LIMIT
quota-dev   33s   pods: 3/2, requests.cpu: 1500m/46, requests.memory: 1536Mi/120Gi, requests.nvidia.com/gpu: 0/4, services: 0/20   limits.cpu: 1500m/46, limits.memory: 1536Mi/120Gi
#查看pod情况
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get pod -n dev
NAME        READY   STATUS    RESTARTS   AGE
testpod-1   1/1     Running   0          2m21s
testpod-2   1/1     Running   0          2m15s
testpod-3   1/1     Running   0          2m8s
#对已经创建了的pod无影响
#在新创建一个pod
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl run testpod-4 --image="ikubernetes/demoapp:v1.0" --requests="cpu=500m,memory=512Mi" --limits="cpu=500m,memory=512Mi" -n dev
Error from server (Forbidden): pods "testpod-4" is forbidden: exceeded quota: quota-dev, requested: pods=1, used: pods=3, limited: pods=2
#pod testpod-4创建失败，在定义的case6-ResourceQuota-dev.yaml中pod数量为2个。
root@k8s-master01:/apps/k8s-yaml/limit-case# kubectl get pod -n dev
NAME        READY   STATUS    RESTARTS   AGE
testpod-1   1/1     Running   0          4m13s
testpod-2   1/1     Running   0          4m7s
testpod-3   1/1     Running   0          4m
```

每个ResourceQuota资源对象上还支持定义一组作用域，用于定义资源上的配额仅生效于这组作用域交集范围内的对象，目前适用范围包括Terminating、NotTerminating、BestEffort和NotBestEffort。

```java
▪Terminating：匹配.spec.activeDeadlineSeconds的属性值大于等于0的所有Pod对象。
▪NotTerminating：匹配.spec.activeDeadlineSeconds的属性值为空的所有Pod对象。
▪BestEffort：匹配所有位于BestEffort QoS类别的Pod对象。
▪NotBestEffort：匹配所有非BestEffort QoS类别的Pod对象。
```

另外，Kubernetes自v1.8版本起支持管理员设置不同的优先级类别（PriorityClass）创建Pod对象，而且自v1.11版本起还支持对每个PriorityClass对象分别设定资源限额。于是，管理员还可以在ResourceQuota资源上使用scopeSelector字段定义其生效的作用域，它支持基于Pod对象的优先级来控制Pod对系统资源的消耗。
