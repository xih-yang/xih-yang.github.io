# 13、Kubernetes - 实战：Kubernetes资源管理Deployment部署无状态服务
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/13.html
- 分类：容器服务
- 分组：教程目录
## 一、Pod与controllers的关系

- controllers：在集群上管理和运行容器的对象
- 通过label-selector相关联
- Pod通过控制器实现应用的运维，如伸缩，升级等

## 二、Deployment

- 部署无状态应用
- 管理Pod和ReplicaSet（副本控制、更新回滚）
- 具有上线部署、副本设定、滚动升级、回滚等功能
- 提供声明式更新，例如只更新一个新的Image

## 三、Deployment应用场景

一般应用于部署无状态的web服务。

## 四、案例

### 4.1 创建deployment

```java
# vim tomcat-deployment.yaml
apiVersion: apps/v1beta1
kind: Deployment
metadata:
  labels:
    app: tomcat
  name: tomcat
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tomcat
  template:
    metadata:
      labels:
        app: tomcat
    spec:
      imagePullSecrets:
      - name: registry-pull-secret
      containers:
      - image: tomcat
        imagePullPolicy: Always
        name: tomcat
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: tomcat-service
  labels:
    app: tomcat
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: tomcat
```

### 4.2 创建deployment

```java
kubectl apply -f tomcat-deployment.yaml
```

### 4.3 创建一个deployment后查看结果：kubectl get pods,deploy,rs

- 对用户有一个隐藏的控制器 replicaset
- deploymen是用来管理 replicaset 与 pod

```java
kubectl get pod,deploy,rs
NAME READY STATUS RESTARTS AGE
pod/tomcat-b7cf876c5-6fqq2 1/1 Running 0 117s
pod/tomcat-b7cf876c5-p94cx 1/1 Running 0 118s
pod/tomcat-b7cf876c5-znd2r 1/1 Running 0 117s
NAME DESIRED CURRENT UP-TO-DATE AVAILABLE AGE
deployment.extensions/tomcat 3 3 3 3 118s
NAME DESIRED CURRENT READY AGE
# 隐藏控制器，控制pod副本数
replicaset.extensions/tomcat-b7cf876c5 3 3 3 118s
```

### 4.4 查看deployment所有涉及字段

```java
# kubectl edit deployment/tomcat
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  annotations:
    deployment.kubernetes.io/revision: "1"
    kubectl.kubernetes.io/last-applied-configuration: |
  creationTimestamp: 2019-08-27T02:09:45Z
  generation: 1
  labels:
    app: tomcat
  name: tomcat
  namespace: default
  resourceVersion: "141715"
  selfLink: /apis/extensions/v1beta1/namespaces/default/deployments/tomcat
  uid: bd75f48e-c86f-11e9-9db0-000c292e28d6
spec:
  progressDeadlineSeconds: 600
  副本设定
  replicas: 3
  revisionHistoryLimit: 2
  标签管理
  selector:
    matchLabels:
      app: tomcat
  滚动更新
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: tomcat
    spec:
      容器定义
      containers:
      - image: tomcat
        imagePullPolicy: Always
        name: tomcat
        ports:
        - containerPort: 8080
          protocol: TCP
        resources: {}
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
      dnsPolicy: ClusterFirst
      imagePullSecrets:
      - name: registry-pull-secret
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
status:
  availableReplicas: 3
  conditions:
  - lastTransitionTime: 2019-08-27T02:11:23Z
    lastUpdateTime: 2019-08-27T02:11:23Z
    message: Deployment has minimum availability.
    reason: MinimumReplicasAvailable
    status: "True"
    type: Available
  - lastTransitionTime: 2019-08-27T02:09:45Z
    lastUpdateTime: 2019-08-27T02:11:23Z
    message: ReplicaSet "tomcat-b7cf876c5" has successfully progressed.
    reason: NewReplicaSetAvailable
    status: "True"
    type: Progressing
  observedGeneration: 1
  readyReplicas: 3
  replicas: 3
  updatedReplicas: 3
```
