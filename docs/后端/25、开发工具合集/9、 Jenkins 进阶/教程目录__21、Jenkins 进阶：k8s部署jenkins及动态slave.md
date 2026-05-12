# 21、Jenkins 进阶：k8s部署jenkins及动态slave
- 来源：https://ddkk.com/zhuanlan/tools/jenkins/1/21.html
- 分类：开发工具
- 分组：教程目录
## 一、部署jenkins master

### 1.创建Deployment YAML文件

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jenkins
  namespace: kube-ops
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jenkins
  template:
    metadata:
      labels:
        app: jenkins
    spec:
      serviceAccount: jenkins
      containers:
      - name: jenkins
        image: jenkins/jenkins:lts     
        ports:
        - containerPort: 8080
          name: web
          protocol: TCP
        - containerPort: 50000
          name: agent
          protocol: TCP
        resources:
          limits:
            cpu: 1000m
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /login
            port: 8080
          initialDelaySeconds: 120
          timeoutSeconds: 5
          failureThreshold: 12
        readinessProbe:
          httpGet:
            path: /login
            port: 8080
        volumeMounts:
        - name: jenkinshome
          subPath: jenkins
          mountPath: /var/jenkins_home
      securityContext:
        fsGroup: 1000
      nodeSelector:  
        kubernetes.io/hostname: k8s-node01 因为测试环境没有分布式存储，所以需要指定节点
      volumes:
      - name: jenkinshome  使用的本地挂载，生产使用误用
        hostPath:
          path: /data
          type: Directory
```

### 2.创建service YAML文件

```java
apiVersion: v1
kind: Service
metadata:
  name: jenkins
  namespace: kube-ops
  labels:
    app: jenkins
spec:
  selector:
    app: jenkins
  type: NodePort
  ports:
  - name: web
    port: 8080
    targetPort: web
    nodePort: 30002 
  - name: agent
    port: 50000
    targetPort: agent
```

`为了方便测试我将容器的 /var/jenkins_home 目录挂载到了一个名为jenkinshome 的 hostPath 上,同时绑定到了指定的node上,因为我用的是本地存储实际生产中建议将存储修改为持久存储,可以使用StorageClass 对象来自动创建.`

`为了方便我们测试，我们这里通过 NodePort 的形式来暴露 Jenkins 的 web 服务，固定为30002端口，另外还需要暴露一个 agent 的端口，这个端口主要是用于 Jenkins 的 master 和 slave 之间通信使用的。`

### 3.创建serviceAccount YAML文件

我们这里还需要使用到一个拥有相关权限的 serviceAccount：jenkins，我们这里只是给 jenkins 赋予了一些必要的权限，当然如果你对 serviceAccount 的权限不是很熟悉的话，我们给这个 sa 绑定一个 cluster-admin 的集群角色权限也是可以的，当然这样具有一定的安全风险

```java
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jenkins
  namespace: kube-ops
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: jenkins
rules:
  - apiGroups: ["extensions", "apps"]
    resources: ["deployments"]
    verbs: ["create", "delete", "get", "list", "watch", "patch", "update"]
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["create", "delete", "get", "list", "watch", "patch", "update"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["create","delete","get","list","patch","update","watch"]
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create","delete","get","list","patch","update","watch"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get","list","watch"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: jenkins
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: jenkins
subjects:
  - kind: ServiceAccount
    name: jenkins
    namespace: kube-ops
```

### 4.创建相关资源及服务

```java
# 再绑定的节点上操作，当前配置是k8s-node01
mkdir /data
chown -R 1000:1000 /data
kubectl create namespace kube-ops所有资源创建在kube-ops名称空间中,所以有需要先创建kube-ops名称空间
kubectl create -f jenkin-rbac.yaml 创建 rbac 相关的资源对象
kubectl create -f jenkins-deploy.yaml创建 Jenkins 服务
kubectl create -f jenkins-svc.yaml
kubectl get pods -n kube-ops确认生成的pod正常运行,通过任意节点的 IP:30002 端口就可以访问 jenkins 服务
kubectl get pods -n kube-ops
kubectl logs -n kube-ops jenkins-5c44df4686-jjl9f 
kubectl exec -it -n kube-ops jenkins-5c44df4686-jjl9f -- /bin/bash
cat /var/jenkins_home/secrets/initialAdminPassword
```

### 5.安装配置jenkins

```java
略，参考正常jenkins配置即可
```

## 二、通过模板部署动态slave

### 1.配置Jenkins URL

进入Manage Jenkins —> Configure System,添加Jenkins访问URL

### 2.安装插件

### 3.配置插件

点击Manage Jenkins —> Configure System —> (拖到最下方)Add a new cloud —> 选择 Kubernetes，然后填写 Kubernetes 和 Jenkins 配置信息。

```java
Jenkins 也是安装的 Kubernetes 环境中，那么可以直接使用 Kubernetes 集群内的 Kubernetes API 地址，如果 Jnekins 是在安装在 正常物理机或者虚拟机 环境中，那么使用 集群外的 Kubernetes API 地址，两个地址如下：
- 集群内地址：https://kubernetes.default.svc.cluster.local/
- 集群外地址：https://{Kubernetes 集群 IP}:6443
```

```java
注意 namespace，我们这里填 kube-ops，然后点击**Test Connection**，如果出现 Connection test successful 的提示信息证明 Jenkins 已经可以和 Kubernetes 系统正常通信了
另外需要注意，如果这里 Test Connection 失败的话，很有可能是权限问题，这里就需要把我们创建的 jenkins 的 serviceAccount 对应的 secret 添加到这里的 Credentials 里面。
```

```java
 Jenkins URL 地址：http://jenkins.kube-ops.svc.cluster.local:8080，这里的Jenkins 地址 是供 Slave连接 Jenkins Master 节点用的，所以这里需要配置 Jenkins Master 的 URL 地址。
 这里和上面一样，也是考虑 Jenkins 是部署在 Kubernetes集群内还是集群外，两个地址如下：
- 集群内地址：https://{Jenkins Pod 名称}.{Jenkins Pod 所在 Namespace}/{Jenkins 前缀}
- 集群外地址：https://{Kubernetes 集群 IP}:{Jenkins NodePort 端口}/{Jenkins 前缀}
```

```java
其实就是配置 Jenkins Slave 运行的 Pod 模板，命名空间我们同样是用 kube-ops，标签这里也非常重要，对于后面执行 Job 的时候需要用到该值，然后我们这里使用的是 jenkins/jnlp-slave:4.13.3-1-jdk11 这个镜像，和Master都是JDK11
```

```java
另外需要注意我们这里需要在下面挂载两个主机目录，一个是/var/run/docker.sock，该文件是用于 Pod 中的容器能够共享宿主机的 Docker，这就是大家说的 docker in docker 的方式，，另外一个目录下/root/.kube目录，我们将这个目录挂载到容器的 /root/.kube 目录下面这是为了让我们能够在 Pod 的容器中能够使用 kubectl 工具来访问我们的 Kubernetes 集群，方便我们后面在 Slave Pod 部署 Kubernetes 应用。但是需要自己在slavery的镜像做定制，添加docker及kubectl命令和权限修改
```

```java
另外还有几个参数需要注意，如下图中的Time in minutes to retain agent/slave when idle，这个参数表示的意思是当处于空闲状态的时候保留 Slave Pod多长时间，这个参数最好我们保存默认就行了，如果你设置过大的话，Job 任务执行完成后，对应的 Slave Pod 就不会立即被销毁删除。
```

```java
配置Jenkins  pod Service Account
```

完整配置

### 4.验证

在Jenkins 首页点击 new item，创建一个测试的任务 `pwb-slave-demo`，然后我们选择 Freestyle project 类型

注意在下面的 Label Expression 这里要填入pwb-jnlp，就是前面我们配置的 Slave Pod 中的 Label，这两个地方必须保持一致

然后往下拉，在Build 区域选择Execute shell,并添加我们的测试命令

```java
echo "测试 Kubernetes 动态生成 jenkins slave"
echo "==============docker in docker==========="
java -version
```

保存退出并点击Build Now,然后观察 Kubernetes 集群中 Pod 的变化

```java
 kubectl get pods -n kube-ops
NAME                       READY   STATUS    RESTARTS   AGE
jenkins2-979756579-67trx   1/1     Running   0          5h40m
jnlp-qs1xz                 1/1     Running   0          8s
```

现在slave pod正在执行,点击查看执行日志

## 三、通过pipiline部署动态salve

### 1.创建pipeline项目，步骤略

### 2.编写pipeline

主要是格式，具体salve 镜像需要怎么配置可以通过yaml内容去调整

```java
pipeline{
    agent{
        kubernetes{
            label "test01"   
            cloud 'kubernetes' 此处需要注意值为cloud kubernetes的名称，不是固定写法
            yaml '''
---
kind: Pod
apiVersion: v1
metadata:
  labels:
    k8s-app: jenkinsagent
  name: jenkinsagent
  namespace: kube-ops
spec:
containers:
  - name: jenkinsagent
    image: jenkins/jnlp-slave:4.13.3-1-jdk11
    imagePullPolicy: IfNotPresent
    resources:
      limits:
        cpu: 1000m
        memory: 2Gi
      requests:
        cpu: 500m
        memory: 512Mi
'''
        }
    }
    stages{
        stage("test"){
          steps{
            script{
              sh "java -version & sleep 30"
            }
          }
        }
    }
}
```

### 验证
