# 20、Kubernetes - 实战：Kubernets包管理工具—&gt;Helm介绍与使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/20.html
- 分类：容器服务
- 分组：教程目录
## Kubernets包管理工具—>Helm

### 什么是Helm？

我们都知道，Linux系统各发行版都有自己的包管理工具，比如Centos的YUM，再如Ubuntu的APT。

Kubernetes也有自己的集群包管理工具，那就是Helm。

Helm本质就是让K8S的应用管理（Deployment,Service等）可配置，能动态生成。通过动态生成K8S资源清单文件（deployment.yaml,service.yaml），然后调用kubectl自动执行K8S部署。

### Helm有两个重要的概念，chart 和 release

- chart 是创建一个应用的信息集合，包括各种Kubernetes对象的配置模板、参数定义、依赖关系和文档说明等，chart是应用部署的自包含逻辑单元。可以将 chart 想象成apt、yum中的软件安装包。
- release 是chart的运行实例，代表了一个正在运行的应用，当chart被安装到kubernetes集群，就生成一个release，chart能够多次安装到同一个集群，每次安装都是一个release。

### Helm包含两个组件，Helm 客户端和 Tiller 服务器

- Helm客户端负责chart和release的创建和管理，以及和Tiller的交互。
- Tiller服务运行在 Kubernetes 集群中，它会处理Helm客户端的请求，与 Kubernetes API Server 交互

### Helm 部署

越来越多的公司开始使用Helm这个Kubernetes包管理工具，Helm的安装也十分简单，下载 helm 命令行工具到Master节点即可，以下示例安装为[Helm v2.16.10](https://github.com/helm/helm/releases/tag/v2.16.10) 版本，包下载地址：[https://github.com/helm/helm/releases](https://github.com/helm/helm/releases)

```java
[root@Centos8 heml]# wget https://get.helm.sh/helm-v2.16.10-linux-amd64.tar.gz
[root@Centos8 heml]# tar zxvf helm-v2.16.10-linux-amd64.tar.gz -C /usr/local/
[root@Centos8 heml]# cd /usr/local/linux-amd64/
[root@Centos8 linux-amd64]# ln -s pwd/helm /usr/local/bin/
```

> 以上Helm命令安装完成，官方文档：https://helm.sh/docs/intro/install/#helm

为了安装tiller，还需要在这台机器上配置好kubectl工具和kubeconfig文件，确保kubectl工具可以在这台机器访问apiserver且正常使用。

因为Kubernetes ApiServer开启了RBAC访问控制，所以需要创建tiller使用的 service account:tiller并分配合适的角色给它。这里简单起见直接分配cluster-admin这个集群内置的CluserRole给它。创建rbac-config.yaml文件：

vimrbac-config.yaml

```java
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tiller
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: tiller
subjects:
- kind: ServiceAccount
  name: tiller
  namespace: kube-system
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

```java
[root@Centos8 rbac]# kubectl create -f rbac-config.yaml 
serviceaccount/tiller created
clusterrolebinding.rbac.authorization.k8s.io/tiller created
```

在K8S集群中初始化helm

```java
[root@Centos8 rbac]# helm init --service-account tiller --skip-refresh
Creating /root/.helm 
Creating /root/.helm/repository 
Creating /root/.helm/repository/cache 
Creating /root/.helm/repository/local 
Creating /root/.helm/plugins 
Creating /root/.helm/starters 
Creating /root/.helm/cache/archive 
Creating /root/.helm/repository/repositories.yaml 
Adding stable repo with URL: https://kubernetes-charts.storage.googleapis.com 
Adding local repo with URL: http://127.0.0.1:8879/charts 
$HELM_HOME has been configured at /root/.helm.
Tiller (the Helm server-side component) has been installed into your Kubernetes Cluster.
Please note: by default, Tiller is deployed with an insecure 'allow unauthenticated users' policy.
To prevent this, run helm init with the --tiller-tls-verify flag.
For more information on securing your installation see: https://v2.helm.sh/docs/securing_installation/
```

```java
[root@Centos8 rbac]# kubectl get pod -n kube-system
NAME                              READY   STATUS              RESTARTS   AGE
tiller-deploy-8487d94bcf-nfc74    0/1     ContainerCreating   0          98s
[root@Centos8 ~]# kubectl describe pod tiller-deploy-8487d94bcf-nfc74 -n kube-system
    Back-off pulling image "gcr.io/kubernetes-helm/tiller:v2.16.10"
```

> 会发现tiller的Pod Running不起来，是因为导入镜像失败，因为网络的原因访问gcr.io访问不到，于是到docker hub中查询此image，发现确实有相同的image，pull过来改个名即可。

```java
[root@Centos8 ~]# docker pull jessestuart/tiller:v2.16.10
Status: Downloaded newer image for jessestuart/tiller:v2.16.10
docker.io/jessestuart/tiller:v2.16.10
docker tag jessestuart/tiller:v2.16.10 gcr.io/kubernetes-helm/tiller:v2.16.10
```

然后传输到每一个node节点上：

```java
[root@Centos8 ~]# docker save gcr.io/kubernetes-helm/tiller -o /usr/local/install-k8s/heml/tiller.tgz
[root@Centos8 ~]# scp /usr/local/install-k8s/heml/tiller.tgz 192.168.152.253:/usr/local/install-k8s/
```

node节点接收到后，再导入成image即可：

```java
[root@TestCentos7 install-k8s]# docker load < tiller.tgz 
Loaded image: gcr.io/kubernetes-helm/tiller:v2.16.10
```

再次查看tiller Pod的状态，已经变为Running：

```java
[root@Centos8 ~]# kubectl get pod -n kube-system 
tiller-deploy-8487d94bcf-nfc74    1/1     Running   0     1h
```

### Helm的使用

Helm的使用与yum、apt等工具如出一辙，可以事先去helm hub中寻找想要安装的工具或应用：[https://hub.helm.sh/](https://hub.helm.sh/)，其页面会有具体的安装方法及步骤。

### 以安装redis为例：https://hub.helm.sh/charts/choerodon/redis

**1、** 先添加redis的repo源；

```java
helm repo add choerodon https://openchart.choerodon.com.cn/choerodon/c7n
"choerodon" has been added to your repositories
```

**2、** 更新一下helmrepo；

```java
[root@Centos8 ~]# helm repo update 
Hang tight while we grab the latest from your chart repositories...
...Skip local chart repository
...Successfully got an update from the "choerodon" chart repository
...Successfully got an update from the "stable" chart repository
Update Complete.
```

**3、** 开始安装；

```java
[root@Centos8 ~]# helm install choerodon/redis --version 0.2.5
NAME:   exhaling-yak
LAST DEPLOYED: Sun Sep  6 22:57:51 2020
NAMESPACE: default
STATUS: DEPLOYED
RESOURCES:
==> v1/ConfigMap
NAME             DATA  AGE
exhaling-yak-cm  1     0s
==> v1/Deployment
NAME          READY  UP-TO-DATE  AVAILABLE  AGE
exhaling-yak  0/1    0           0          0s
==> v1/Pod(related)
```

**4、** 可以看到，在default名称空间生成了ConfigMap、Deployment和Pod；

```java
[root@Centos8 ~]# kubectl get pod 
NAME                           READY   STATUS             RESTARTS   AGE
exhaling-yak-cdc8cf8f9-xqtk9   0/1     ImagePullBackOff   0          40s
[root@Centos8 ~]# kubectl get deployment 
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
exhaling-yak   0/1     1            0           85s
[root@Centos8 ~]# kubectl get cm 
NAME              DATA   AGE
exhaling-yak-cm   1      109s
```

> Pod ImagePullBackOff 的原因是redis镜像没导入成功，再自行pull即可

**3、** Helm常用命令，大家可以通过helm--help进行了解；

### Helm自定义模板

以上拉取的都是别人自定义好的模板，自己也可以做一些模板上传或者收藏起来。在此测试创建hello-world模板

### 1.创建好模板所有文件所放置的目录

```java
mkdir charts
cd charts/
mkdir templates     必须创建一个名字为 templates 的目录
```

### 2.编辑Chart.yaml

vim Chart.yaml # 必须创建一个名为 Chart.yaml 的文件，并指定 name 和 version 两个key的值

```java
name: hello-world
version: 1.0.0
```

### 3.在 templates 目录下创建 deployment 及 service

vimtemplates/deployments.yaml

```java
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: hello-world
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: hello-world
    spec:
      containers:
      - name: hello-world
        image: nginx:1.2.1
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
```

vimservices.yaml

```java
apiVersion: v1
kind: Service
metadata:
  name: hello-world
spec:
  type: NodePort
  ports:
  - port: 80
    containerPort: 80
    nodePort: 30001
  selector:
    app: hello-world
```

此时整体目录结构为：

```java
[root@Centos8 charts]# tree 
.
├── Chart.yaml
└── templates
    ├── deployments.yaml
    └── services.yaml
```

### 4.安装此自定义chart

```java
[root@Centos8 charts]# helm install .
NAME:   wishing-badger
LAST DEPLOYED: Mon Sep  7 20:55:42 2020
NAMESPACE: default
STATUS: DEPLOYED
RESOURCES:
==> v1/Pod(related)
NAME                          READY  STATUS             RESTARTS  AGE
hello-world-767c98894d-7lrzt  0/1    ContainerCreating  0         1s
==> v1/Service
NAME         TYPE      CLUSTER-IP      EXTERNAL-IP  PORT(S)       AGE
hello-world  NodePort  10.100.108.217  <none>       80:30001/TCP  0s
==> v1beta1/Deployment
NAME         READY  UP-TO-DATE  AVAILABLE  AGE
hello-world  0/1    1           0          0s
```

查看Pod、Deployment、Service

```java
[root@Centos8 charts]# kubectl get pod 
NAME                           READY   STATUS    RESTARTS   AGE
hello-world-767c98894d-7lrzt   1/1     Running   0          67s
[root@Centos8 charts]# kubectl get deployment 
NAME          READY   UP-TO-DATE   AVAILABLE   AGE
hello-world   1/1     1            1           78s
[root@Centos8 charts]# kubectl get svc 
NAME          TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
hello-world   NodePort    10.100.108.217   <none>        80:30001/TCP   81s
```

### Helm常用命令及用法

### 1.更新镜像

第一种：手动更新

进入deployments.yaml 修改 image 行，然后helm upgrade

vimtemplates/deployments.yaml

```java
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: hello-world
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: hello-world
    spec:
      containers:
      - name: hello-world
        image: hub.vfancloud.com/test/myapp
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
```

```java
[root@Centos8 charts]# helm upgrade wishing-badger .
Release "wishing-badger" has been upgraded.
LAST DEPLOYED: Mon Sep  7 21:07:04 2020
NAMESPACE: default
STATUS: DEPLOYED
RESOURCES:
==> v1/Pod(related)
NAME                          READY  STATUS             RESTARTS  AGE
hello-world-7466c45989-cxnps  0/1    Terminating        0         69s
hello-world-864f865db8-zjt79  0/1    ContainerCreating  0         0s
==> v1/Service
NAME         TYPE      CLUSTER-IP      EXTERNAL-IP  PORT(S)       AGE
hello-world  NodePort  10.100.108.217  <none>       80:30001/TCP  11m
==> v1beta1/Deployment
NAME         READY  UP-TO-DATE  AVAILABLE  AGE
hello-world  0/1    1           0          11m
```

查看index.html，版本为v1

```java
[root@Centos8 charts]# curl http://10.100.108.217 
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

第二种：变量更新

创建一个变量文件 values.yaml，保存 image 及 tag

vimvalues.yaml

```java
image:
  repository: hub.vfancloud.com/test/myapp
  tag: 'v2'
```

vim templates/deployments.yaml # 将 image 字段更改为以上文件的变量

```java
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: hello-world
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: hello-world
    spec:
      containers:
      - name: hello-world
        image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
```

开始更新

```java
[root@Centos8 charts]# helm upgrade wishing-badger .
Release "wishing-badger" has been upgraded.
LAST DEPLOYED: Mon Sep  7 21:17:31 2020
NAMESPACE: default
STATUS: DEPLOYED
RESOURCES:
==> v1/Pod(related)
NAME                          READY  STATUS             RESTARTS  AGE
hello-world-5759c969fc-w9s88  0/1    ContainerCreating  0         0s
hello-world-864f865db8-zjt79  1/1    Terminating        0         10m
==> v1/Service
NAME         TYPE      CLUSTER-IP      EXTERNAL-IP  PORT(S)       AGE
hello-world  NodePort  10.100.108.217  <none>       80:30001/TCP  21m
==> v1beta1/Deployment
NAME         READY  UP-TO-DATE  AVAILABLE  AGE
hello-world  1/1    1           1          21m
```

查看index.html，版本为v2

```java
[root@Centos8 charts]# curl http://10.100.108.217 
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```

或者通过命令行直接修改 image 的 tag 标签，来更新镜像版本

```java
[root@Centos8 charts]# helm upgrade wishing-badger --set image.tag='v3' .
Release "wishing-badger" has been upgraded.
LAST DEPLOYED: Mon Sep  7 21:27:04 2020
NAMESPACE: default
STATUS: DEPLOYED
RESOURCES:
==> v1/Pod(related)
NAME                          READY  STATUS             RESTARTS  AGE
hello-world-5759c969fc-w9s88  1/1    Terminating        0         9m33s
hello-world-6454b8dcc8-pjgk9  0/1    ContainerCreating  0         0s
==> v1/Service
NAME         TYPE      CLUSTER-IP      EXTERNAL-IP  PORT(S)       AGE
hello-world  NodePort  10.100.108.217  <none>       80:30001/TCP  31m
==> v1beta1/Deployment
NAME         READY  UP-TO-DATE  AVAILABLE  AGE
hello-world  0/1    1           0          31m
```

查看index.html，已经更新为v3

```java
[root@Centos8 charts]# curl http://10.100.108.217 
Hello MyApp | Version: v3 | <a href="hostname.html">Pod Name</a>
```

### 2.查看release历史版本

```java
[root@Centos8 charts]# helm history wishing-badger 
REVISION    UPDATED                     STATUS        CHART                APP VERSION    DESCRIPTION     
1           Mon Sep  7 20:55:42 2020    SUPERSEDED    hello-world-1.0.0    Install complete
2           Mon Sep  7 21:07:04 2020    DEPLOYED      hello-world-1.0.0    Upgrade complete
```

### 3.删除release

```java
[root@Centos8 charts]# helm delete wishing-badger 
release "wishing-badger" deleted
```

以上命令提示此 release 删除，但其实并没有完全“删除”，而是将它放回了“回收站”

原因是怕你将来有一天想要回滚，“回收站”查看方法：

```java
[root@Centos8 charts]# helm list --deleted
NAME              REVISION    UPDATED             STATUS     CHART      APP VERSION    NAMESPACE
wishing-badger    5      Mon Sep  7 21:27:04 2020  DELETED    hello-world-1.0.0     default 
```

> 如果想要彻彻底底的删除，在执行 delete 时加上 --purge 即可

### 4.回滚release

helm rollback [name] [版本]

```java
[root@Centos8 charts]# helm rollback wishing-badger 2
Rollback was a success.
```

将wishing-badger 回滚到第二个版本

查看index.html，已回退到第二个版本，version 为 v1

```java
[root@Centos8 charts]# curl http://10.109.145.22
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```
