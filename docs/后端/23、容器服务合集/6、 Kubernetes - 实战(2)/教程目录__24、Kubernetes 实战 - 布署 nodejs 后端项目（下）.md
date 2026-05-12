# 24、Kubernetes 实战 - 布署 nodejs 后端项目（下）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/24.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了部署后端项目之前，需要的准备的相关配置信息；

本篇，创建 Deployment、Service 完成后端项目布署；

## 二，解决 jenkins 安全问题

构建docker 镜像之后，登录 docker 会提示有安全问题：

这是由于在脚本中使用了眀文用户名、密码进行登录所导致的；

jenkins 中的项目构建脚本：

```java
#!/bin/bash
time=$(date "+%Y%m%d%H%M%S")
npm install --registry=https://registry.npm.taobao.org
docker build -t 47.94.92.122:8082/cicd-backend:$time .
docker login -u admin -p Wz@19880818 47.94.92.122:8082
docker push 47.94.92.122:8082/cicd-backend:$time
```

修改为使用环境变量用户名、密码：

```java
#!/bin/bash
time=$(date "+%Y%m%d%H%M%S")
npm install --registry=https://registry.npm.taobao.org
docker build -t 47.94.92.122:8082/cicd-backend:$time .
docker login -u $DOCKER_LOGIN_USERNAME -p $DOCKER_LOGIN_PASSWORD 47.94.92.122:8082
docker push 47.94.92.122:8082/cicd-backend:$time
```

如何提供环境变量：

这样，用户名密码写到了环境变量，那么用户名密码是怎么来的呢？

它会去读一个 jenkins 凭据：主页-系统管理-凭据

登录成功了

## 三、创建后端 Deployment

创建一个 pod：创建一个 kind: pod；

创建多个 pod：创建一个 kind: Deployment;

Deployment 对象，会创建出一个副本集，这个副本集可以控制 pod 数量；

由于后端项目和前端项目都是无状态的，为了便于演示各部署两份

####

```java
[root@k8s-master cicd]# vi deployment-cicd-backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cicd-backend
spec:
  selector:
    matchLabels:
      app: cicd-backend
  replicas: 2两个副本
  template:
    metadata:
      labels:
        app: cicd-backend必须和selector-cicd-backend对应
    spec:
      imagePullSecrets:
      - name: private-registry
      containers:
      - name: cicd-backend
        imagePullPolicy: Always
        image: "47.94.92.122:8082/cicd-backend:20220111113749"
        ports:
        - containerPort: 7001
        env:注入后端需要的5个环境变量
        - name: MYSQL_HOST
          valueFrom:
            configMapKeyRef:
              name: mysql-config
              key: host
        - name: MYSQL_PORT
          valueFrom:
            configMapKeyRef:
              name: mysql-config
              key: port
        - name: MYSQL_DATABASE
          valueFrom:
            configMapKeyRef:
              name: mysql-config
              key: database
        - name: MYSQL_USER
          valueFrom:
            secretKeyRef:
             name: mysql-auth
             key: username     
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
             name: mysql-auth
             key: password    
```

上边配置涉及到的 configMap：

```java
[root@k8s-master ~]# kubectl get configMap mysql-config
NAME           DATA   AGE
mysql-config   3      3d19h
[root@k8s-master ~]# kubectl get configMap mysql-config -o yaml
apiVersion: v1
data:三个值
  database: cicd
  host: service-cicd-mysql
  port: "8899"
kind: ConfigMap
```

上边配置涉及到的 Secret：

```java
[root@k8s-master ~]# kubectl get secret mysql-auth
NAME         TYPE     DATA   AGE
mysql-auth   Opaque   2      4d2h
[root@k8s-master ~]# kubectl get secret mysql-auth -o yaml
apiVersion: v1
data:
  password: MTIzNDU2
  username: cm9vdA==
kind: Secret
[root@k8s-master ~]# echo cm9vdA== | base64 -d
root
[root@k8s-master ~]# echo MTIzNDU2 | base64 -d
123456
```

生效配置

```java
// 生效配置
[root@k8s-master cicd]# kubectl apply -f deployment-cicd-backend.yaml
deployment.apps/cicd-backend created
// 两个副本
[root@k8s-master cicd]# kubectl get pods
NAME                           READY   STATUS              RESTARTS   AGE
cicd-backend-98b5d4f57-jndvd   0/1     ContainerCreating   0          2s
cicd-backend-98b5d4f57-qjvch   0/1     ContainerCreating   0          2s
cicd-mysql-745975859b-gpwzh    1/1     Running             7          4d3h
// 稍等约 30 秒
[root@k8s-master cicd]# kubectl get pods
NAME                           READY   STATUS    RESTARTS   AGE
cicd-backend-98b5d4f57-jndvd   1/1     Running   0          26s
cicd-backend-98b5d4f57-qjvch   1/1     Running   0          26s
cicd-mysql-745975859b-gpwzh    1/1     Running   7          4d3h
```

## 四，创建后端 Service

```java
[root@k8s-master cicd]# vi service-cicd-backend.yaml
apiVersion: v1
kind: Service
metadata:
  name: service-cicd-backend
spec:
  selector:
    app: cicd-backenddeployment
  ports:
  - protocol: TCP
    port: 7001服务内部的端口号
    targetPort: 7001容器内部向外暴露的端口号Dockerfile中的EXPOSE
  type: NodePort
```

```java
[root@k8s-master cicd]# kubectl apply -f  service-cicd-backend.yaml
service/service-cicd-backend created
[root@k8s-master cicd]# kubectl get svc
NAME                   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
kubernetes             ClusterIP   10.96.0.1       <none>        443/TCP          20d
service-cicd-backend   NodePort    10.97.144.175   <none>        7001:30174/TCP   44s
service-cicd-mysql     NodePort    10.108.224.96   <none>        8899:32154/TCP   4d2h
service-pay-v1         NodePort    10.97.250.199   <none>        80:30114/TCP     6d21h
service-user-v1        NodePort    10.104.13.40    <none>        80:31071/TCP     19d
// 删掉不用的 service：service-pay、service-user，释放资源
[root@k8s-master cicd]# kubectl delete service service-pay-v1 service-user-v1 
service "service-pay-v1" deleted
service "service-user-v1" deleted
// 查 ip
[root@k8s-master cicd]# cat /etc/hosts
::1	localhost	localhost.localdomain	localhost6	localhost6.localdomain6
127.0.0.1	localhost	localhost.localdomain	localhost4	localhost4.localdomain4
172.17.178.106	k8s-node
172.17.178.105	k8s-master
172.17.178.105	k8s-master	k8s-master
// 通过 service 访问服务接口
[root@k8s-master cicd]# curl http://172.17.178.105:30174/user/list
curl: (7) Failed connect to 172.17.178.105:30174; 拒绝连接
```

访问失败，看下 pod：

```java
[root@k8s-master cicd]# kubectl get pods
NAME                           READY   STATUS             RESTARTS   AGE
cicd-backend-98b5d4f57-jndvd   0/1     CrashLoopBackOff   3          8m41s
cicd-backend-98b5d4f57-qjvch   1/1     Running            4          8m41s
cicd-mysql-745975859b-gpwzh    1/1     Running            8          4d3h
// 过了一会，全都完蛋了
[root@k8s-master cicd]# kubectl get pods
NAME                           READY   STATUS             RESTARTS   AGE
cicd-backend-98b5d4f57-jndvd   0/1     CrashLoopBackOff   4          9m37s
cicd-backend-98b5d4f57-qjvch   0/1     CrashLoopBackOff   4          9m37s
cicd-mysql-745975859b-gpwzh    0/1     CrashLoopBackOff   8          4d3h
// 重启 mysql
[root@k8s-master cicd]# kubectl delete deploy cicd-mysql
deployment.apps "cicd-mysql" deleted
[root@k8s-master cicd]# kubectl apply -f deployment-cicd-mysql.yaml
deployment.apps/cicd-mysql created
[root@k8s-master cicd]# kubectl get pods
NAME                          READY   STATUS    RESTARTS   AGE
cicd-mysql-745975859b-c4b6p   1/1     Running   0          8s
// 2 个 pod 副本负载比较大 ，修改配置，改成 1 个 pod
[root@k8s-master cicd]# kubectl get pods
NAME                           READY   STATUS    RESTARTS   AGE
cicd-backend-98b5d4f57-ftrdk   1/1     Running   0          6s
cicd-mysql-745975859b-c4b6p    1/1     Running   0          99s
```

重新测试访问：

```java
[root@k8s-master cicd]# curl http://172.17.178.105:30174/user/list
{"message":"ok2","success":true,"code":200,"data":[]}
```

至此，后端项目就部署完成了

## 五，结尾

本篇，创建 Deployment、Service 完成后端项目布署；

下一篇，部署前端项目；
