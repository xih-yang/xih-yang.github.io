# 06、Kubernetes - 实战：使用etcd-operator在Kubernetes部署 HA etcd集群
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/6.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

在我们的多个业务系统中，需要使用etcd集群来进行业务集群服务暴露和状态协调，为了提供高效稳定的etcd服务，我们尝试了在Kubernetes使用[etcd-operator](https://github.com/coreos/etcd-operator)部署HA的etcd集群。

etcd operator会通过下面的三个步骤模拟管理 etcd 集群的行为：

## 二、部署Operator

### 2.1 获取部署工具

```java
git clone https://github.com/coreos/etcd-operator
```

### 2.2 配置Kubernetes RBAC权限

```java
# 1. Operator deployed in namespace operator
# 2. Operator generated cluster in namespace operator-cluster or any other namespace 
# 3. Create role and role binding
# 4. Bind service account default in namespace operator to role  etcd-operator via  ClusterRoleBinding  etcd-operator 
etcd-operator/example/rbac/create_role.sh  --namespace=operator
```

### 2.3 部署Operator

修改文件etcd-operator/example/deployment.yaml

```java
kubectl apply -f etcd-operator/example/deployment.yaml
#查看部署结果
kubectl get pod -n operator
NAME                              READY     STATUS    RESTARTS   AGE
etcd-operator-8877b79c6-fxfgg     1/1       Running   204        21d
```

## 三、部署etcd集群

编辑文件etcd-operator-master/example/example-etcd-cluster.yaml

```java
apiVersion: "etcd.database.coreos.com/v1beta2"
kind: "EtcdCluster"
metadata:
  name: "etcd-app"
  namespace: "operator-cluster"
  Adding this annotation make this cluster managed by clusterwide operators
  namespaced operators ignore it
  annotations:
    etcd.database.coreos.com/scope: clusterwide
spec:
  size: 3
  version: "3.2.13"
  pod:
    persistentVolumeClaimSpec:
      storageClassName: ceph-rbd
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 1Gi
```

部署并查看状态

```java
kubectl apply -f etcd-operator-master/example/example-etcd-cluster.yaml
kubectl get pod -n operator-cluster
NAME                  READY     STATUS    RESTARTS   AGE
etcd-app-9wdlnw96z6   1/1       Running   0          21d
etcd-app-d9c9lwkc72   1/1       Running   0          21d
etcd-app-pbtjrml9f5   1/1       Running   0          21d
```

通过Kubernetes service访问etcd服务

```java
#获取服务
kubectl get services -n operator-cluster
NAME                          TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)             AGE
etcd-app                      ClusterIP      None            <none>        2379/TCP,2380/TCP   2h
etcd-app-client               ClusterIP      10.96.178.91    <none>        2379/TCP            2h
#访问服务
kubectl run --namespace operator-cluster --rm -i --tty fun --image quay.io/coreos/etcd --restart=Never -- /bin/sh
If you don't see a command prompt, try pressing enter.
/ ETCDCTL_API=3 etcdctl --endpoints http://etcd-app-client:2379 put foo bar
OK
```

## 四、etcd集群写入测试

数据写入脚本：

```java
n=1
while [ $n -le 1000000000 ]
do etcdctl set $n $n
   let n++
done
```

数据写入过程对etcd造成的负载压力

通过[etcd-operator](https://github.com/coreos/etcd-operator)构建的etcd集群需要是奇数个节点形成一个quorum，每个etcd POD都会挂载一个PVC到/var/etcd来存储数据，这个PVC和生命周期和POD一致，当向任何一个节点写入的时候，数据会被同步到其他节点，某个节点失败了，该节点和该节点上的数据都会消失，新的节点起来会加入现有集群，并且全量同步数据，下图显示了同步期间的网络流量：

## 五、etcd节点故障和自愈

删除一个etcd pod节点

```java
kubectl delete pod etcd-app-nbc95t5bzf --namespace operator-cluster
pod "etcd-app-nbc95t5bzf" deleted
```

查看自愈情况

```java
kubectl get pod --namespace operator-cluster
NAME                  READY     STATUS    RESTARTS   AGE
etcd-app-24dtr5mhsm   1/1       Running   0          42s
etcd-app-bjg4xb2fts   1/1       Running   0          2h
etcd-app-dgb22cbmg9   1/1       Running   0          2h
```

进入新建的POD查看状态

```java
kubectl -n operator-cluster exec -it etcd-app-24dtr5mhsm sh
/ du -sh /var/etcd/
148.5M	/var/etcd/
/ etcdctl member list
ee71e66676a4f87: name=etcd-app-bjg4xb2fts peerURLs=http://etcd-app-bjg4xb2fts.etcd-app.operator-cluster.svc:2380 clientURLs=http://etcd-app-bjg4xb2fts.etcd-app.operator-cluster.svc:2379 isLeader=false
ab61b83186499302: name=etcd-app-24dtr5mhsm peerURLs=http://etcd-app-24dtr5mhsm.etcd-app.operator-cluster.svc:2380 clientURLs=http://etcd-app-24dtr5mhsm.etcd-app.operator-cluster.svc:2379 isLeader=false
dc0b3cf5aed54dcd: name=etcd-app-dgb22cbmg9 peerURLs=http://etcd-app-dgb22cbmg9.etcd-app.operator-cluster.svc:2380 clientURLs=http://etcd-app-dgb22cbmg9.etcd-app.operator-cluster.svc:2379 isLeader=true
```

## 六、etcd集群在生产环境中的最佳实践

在生产实践中，我们发现有两个问题：

> etcd集群的POD节点数据如果小于三个，非常容易发生集群故障
>
>
>
> etcd部署的POD会在某个kubernetes node聚集，并且由于改Kubernetes node发生故障而发生etcd失去quorum而导致集群失败
>
>
>
> etcd集群快速连接和查看的工具

对于第一个问题，经过研究我们使用5个etcd POD节点之后，基本未再发生此类故障

对于第二个问题，我们使用显式指定POD anti-affinity来保证POD被完全打散：

对于第三个问题，我们部署了[etcdkeeper](https://github.com/evildecay/etcdkeeper)来为研发提供快捷的集群信息查看工具：

1）或者代码

```java
git clone https://github.com/evildecay/etcdkeeper.git
```

2）构建镜像准备工作

```java
mkdir  build-bin
Dockerfile.bin 
FROM golang:1.9-alpine 
RUN apk add -U git \
    && go get github.com/golang/dep/...
WORKDIR /go/src/github.com/evildecay/etcdkeeper
ADD src ./
ADD Gopkg.* ./
RUN dep ensure -update \
    && go build -o etcdkeeper.bin etcdkeeper/main.go
Dockerfile
FROM alpine:3.7
ENV HOST="0.0.0.0"
ENV PORT="8080"
RUN apk add --no-cache ca-certificates
RUN apk add --no-cache ca-certificates
WORKDIR /etcdkeeper
COPY  build-bin/etcdkeeper.bin .
ADD assets assets
EXPOSE ${PORT}
ENTRYPOINT ./etcdkeeper.bin -h $HOST -p $PORT
```

3）构建镜像

```java
docker build -t etcdkeeper-bin -f Dockerfile.bin .
docker run -it -v /root/k8s-deployment/etcdkeeper-master/build-bin/:/mnt  etcdkeeper-bin sh
cp etcdkeeper.bin /mnt
docker build -t etcdkeeper -f Dockerfile .
docker tag etcdkeeper 172.2.2.11:5000/etcdkeeper
docker push 172.2.2.11:5000/etcdkeeper
```

4）部署deployment、service和ingress

deployment.yaml

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: etcdkeeper-deployment
  namespace: bu-dev
  labels:
    app: etcdkeeper
spec:
  replicas: 1
  selector:
    matchLabels:
      app: etcdkeeper
  template:
    metadata:
      labels:
        app: etcdkeeper
    spec:
      containers:
      - name: etcdkeeper
        image: 172.222.22.11:5000/etcdkeeper
        ports:
        - containerPort: 8080
```

service.yaml

```java
kind: Service
apiVersion: v1
metadata:
  name: etcdkeeper
  namespace: bu-dev
spec:
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 8080
  selector:
    app: etcdkeeper
```

ingress.yaml

```java
  apiVersion: extensions/v1beta1
  kind: Ingress
  metadata:
    annotations:
      kubernetes.io/ingress.class: nginx
    name: etcdkeeper
    namespace: bu-dev
  spec:
    rules:
      - host: bu-dev-etcdkeeper.etcd.local
        http:
          paths:
            - backend:
                serviceName: etcdkeeper
                servicePort: 8080
              path: /
```

5）访问UI

[http://bu-dev-etcdkeeper.etcd.local/](http://bu-dev-etcdkeeper.etcd.local/)
