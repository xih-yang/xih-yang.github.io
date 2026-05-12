# 19、Kubernetes - 实战：一文详解ServiceAccount及RBAC权限控制
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/19.html
- 分类：容器服务
- 分组：教程目录
## 一、ServiceAccount

### 1.ServiceAccount 介绍

首先Kubernetes中账户区分为：User Accounts（用户账户） 和 Service Accounts（服务账户） 两种，它们的设计及用途如下：

UserAccount是给kubernetes集群外部用户使用的，例如运维或者集群管理人员，使用kubectl命令时用的就是UserAccount账户；UserAccount是全局性。在集群所有namespaces中，名称具有唯一性，默认情况下用户为admin；

用户名称可以在kubeconfig中查看

```java
[root@Centos8 ~]# cd ~/.kube/
[root@Centos8 .kube]# ls
cache  config  http-cache
[root@Centos8 .kube]# cat config
    users:
    - name: kubernetes-admin
```

ServiceAccount是给运行在Pod的程序使用的身份认证，Pod容器的进程需要访问API Server时用的就是ServiceAccount账户；ServiceAccount仅局限它所在的namespace，每个namespace都会自动创建一个default service account；创建Pod时，如果没有指定Service Account，Pod则会使用default Service Account。

### 2.Secret 与 SA 的关系

Kubernetes设计了一种Secret资源，分为两类，一种是用于 ServiceAccount 的 [kubernetes.io/](http://kubernetes.io/) service-account-token，就是上边说的 SA，另一种就是用户自定义的保密信息Opaque。

### 3.默认的Service Account

ServiceAccount仅局限它所在的namespace，所以在创建namespace时会自动创建一个默认的 SA，而 SA 创建时，也会创建对应的 Secret，下面操作验证下：

创建名称空间

```java
[root@Centos8 .kube]# kubectl create ns vfan
namespace/vfan created
```

查看SA

```java
[root@Centos8 .kube]# kubectl get sa -n vfan
NAME      SECRETS   AGE
default   1         67s
```

查看SA 的 Secret

```java
[root@Centos8 .kube]# kubectl describe sa default -n vfan
Name:                default
Namespace:           vfan
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   default-token-wwbc8
Tokens:              default-token-wwbc8
Events:              <none>
[root@Centos8 ~]# kubectl get secret -n vfan
NAME                  TYPE                                  DATA   AGE
default-token-wwbc8   kubernetes.io/service-account-token   3      3m15s
```

> 可以看到，创建ns时默认创建了SA，SA默认创建了一个 kubernetes.io/service-account-token类型的secret

创建一个Pod

vimpods.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: test-sa
  namespace: vfan
spec:
  containers:
  - name: test-sa
    image: nginx:1.2.1
    imagePullPolicy: IfNotPresent
    ports:
    - containerPort: 80
```

```java
[root@Centos8 rbac]# kubectl create -f pods.yaml 
pod/test-sa created
[root@Centos8 rbac]# kubectl get pod -n vfan
NAME      READY   STATUS    RESTARTS   AGE
test-sa   1/1     Running   0          12s
[root@Centos8 rbac]# kubectl describe pod test-sa -n vfan
...
Containers:
  test-sa:
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-wwbc8 (ro)
Volumes:
  default-token-wwbc8:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-wwbc8
    Optional:    false
...
```

> 在不指定SA的情况下，当前 ns下面的 Pod 会默认使用 “default” 这个 SA，对应的 Secret 会自动挂载到 Pod 的 /var/run/secrets/kubernetes.io/serviceaccount/ 目录中，我们可以在 Pod 里面获取到用于身份认证的信息。

进入Pod Container内，查看 SA

```java
[root@Centos8 rbac]# kubectl exec -it test-sa -n vfan -- /bin/bash
root@test-sa:/# cd /var/run/secrets/kubernetes.io/serviceaccount/
root@test-sa:/var/run/secrets/kubernetes.io/serviceaccount# ls
ca.crt    namespace  token
### 可以看到有三个文件，作用分别为
    ca.crt：根证书，用于Client端验证API Server发送的证书
    namespace：标识这个service-account-token的作用域空间
    token：使用API Server私钥签名的JWT，用于访问API Server时，Server端的验证
```

### 4.使用自定义SA

创建一个 SA

```java
[root@Centos8 rbac]# kubectl create sa vfansa -n vfan
serviceaccount/vfansa created
[root@Centos8 rbac]# kubectl get sa -n vfan
NAME      SECRETS   AGE
default   1         19m
vfansa    1         7s
[root@Centos8 rbac]# kubectl describe sa vfansa -n vfan
Name:                vfansa
Namespace:           vfan
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   vfansa-token-9s8f7
Tokens:              vfansa-token-9s8f7
Events:              <none>
[root@Centos8 rbac]# kubectl get secret -n vfan
NAME                  TYPE                                  DATA   AGE
default-token-wwbc8   kubernetes.io/service-account-token   3      19m
vfansa-token-9s8f7    kubernetes.io/service-account-token   3      49s
```

> 同样，创建SA后，自动创建了对应的Secret

更新Pod，使用新创建的SA

vimpods.yaml

```java
apiVersion: v1
kind: Pod
metadata:
  name: test-sa
  namespace: vfan
spec:
  containers:
  - name: test-sa
    image: nginx:1.2.1
    imagePullPolicy: IfNotPresent
    ports:
    - containerPort: 80
  serviceAccountName: vfansa
```

```java
[root@Centos8 rbac]# kubectl create -f pods.yaml 
pod/test-sa created
[root@Centos8 rbac]# kubectl describe pod test-sa -n vfan
...
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from vfansa-token-9s8f7 (ro)
Volumes:
  vfansa-token-9s8f7:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  vfansa-token-9s8f7
    Optional:    false
...
```

### 5.ServiceAccount中添加Image pull secrets

在笔者之前的博客中：Secret介绍及演示( [/zhuanlan/container/kubernetes/6/15.html](/zhuanlan/container/kubernetes/6/15.html) )中提及到，可以使用Secret来保存镜像仓库的登录信息，来达到免登录获取image的效果，同样，可以将创建好的Secret直接与SA进行绑定，绑定完成后，只要使用此 SA 的 Pod，都可达到免登录获取image的效果

创建docker-registry 的 Secret

```java
[root@Centos8 rbac]# kubectl create secret docker-registry myregistrykey --docker-server=hub.vfancloud.com --docker-username=admin --docker-password=admin@123 --docker-email=vfan8991@163.com -n vfan
secret/myregistrykey created
[root@Centos8 rbac]# kubectl get secret -n vfan
NAME                  TYPE                                  DATA   AGE
default-token-wwbc8   kubernetes.io/service-account-token   3      62m
myregistrykey         kubernetes.io/dockerconfigjson        1      7s
vfansa-token-9s8f7    kubernetes.io/service-account-token   3      43m
```

将docker-registry 的 Secret 添加到SA

kubectl edit sa vfansa -n vfan

```java
apiVersion: v1
kind: ServiceAccount
metadata:
  creationTimestamp: "2020-08-30T03:38:47Z"
  name: vfansa
  namespace: vfan
  resourceVersion: "471829"
  selfLink: /api/v1/namespaces/vfan/serviceaccounts/vfansa
  uid: 8a44df93-b2d6-4e61-ad2e-25bc5852f66e
secrets:
- name: vfansa-token-9s8f7
imagePullSecrets:
- name: myregistrykey
```

查看SA 的 Image pull secrets

```java
[root@Centos8 rbac]# kubectl describe sa vfansa -n vfan 
Name:                vfansa
Namespace:           vfan
Labels:              <none>
Annotations:         <none>
Image pull secrets:  myregistrykey
Mountable secrets:   vfansa-token-9s8f7
Tokens:              vfansa-token-9s8f7
Events:              <none>
```

> 这个时候，只要是使用此 SA 的Pod，都可以在docker-registry拉取镜像了，同样，可以把此 Secret 添加到default 的 SA 中，达到相同的效果

## 二、RBAC权限控制

### 1.RBAC介绍

在Kubernetes中，所有资源对象都是通过API对象进行操作，他们保存在etcd里。而对etcd的操作我们需要通过访问 kube-apiserver 来实现，上面的Service Account其实就是APIServer的认证过程，而授权的机制是通过RBAC：基于角色的访问控制实现。

允许执行 CRUD(Create、Read、Update、Delete)操作(也就是我们常说的增、删、改、查操作)，比如下面的这下资源：

- Pods
- ConfigMaps
- Deployments
- Nodes
- Secrets
- Namespaces

上面这些资源对象的可能存在的操作有：

- create
- get
- delete
- list
- update
- edit
- watch
- exec

k8s的这些资源和 API Group 进行关联，比如`Pods`属于 Core API Group，而`Deployements`属于 apps API Group。

### 2.Role and ClusterRole

在RBAC API中，Role表示一组规则权限，权限只会增加(累加权限)，不存在一个资源开始就有很多权限而通过RBAC对其进行减少的操作：Role 是定义在一个 namespace 中，而 ClusterRole 是集群级别的。

下面我们定义一个Role：

vimroles.yaml

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: test-role
  namespace: vfan
rules:
- apiGroups: [""]  为空表示为默认的core api group
  resources: ["pods"] 数据源类型
  verbs: ["get","watch","list"] 赋予的权限
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get","list","create","update","patch","delete","watch"]
```

> 以上Role策略表示在名字为 vfan ns中，对Pods有get,watch,list的权限，对Deployment有......权限

ClusterRole 具有与 Role 相同权限角色控制能力，不同的就是 Cluster Role是集群级别，它可以用于：

- 集群级别的资源控制（例如 node 访问权限）
- 非资源型 endpoints（例如对某个目录或文件的访问：/healthz）
- 所有命名空间资源控制（Pod、Deployment等）

vimclusterroles.yaml

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: test-clusterrole
rules:
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get","create","list"]
```

> 以上Cluster role策略表示，有get，create，list整个集群service的权限

下面开始创建

```java
## role
[root@Centos8 rbac]# kubectl create -f roles.yaml 
role.rbac.authorization.k8s.io/test-rbac created
[root@Centos8 rbac]# kubectl get role -n vfan 
NAME        AGE
test-rbac   27s
## cluster role
[root@Centos8 rbac]# kubectl get clusterrole -n vfan
NAME                                                                   AGE
admin                                                                  141d
cluster-admin                                                          141d
edit                                                                   141d
flannel                                                                141d
ingress-nginx                                                          90d
ingress-nginx-admission                                                90d
system:aggregate-to-admin                                              141d
system:aggregate-to-edit                                               141d
system:aggregate-to-view                                               141d
```

> 可以看到，role和cluster role都已经创建成功，但是clusterrole除了这次创建的还有许多，其中以system开头的全部是系统所用的，其他的都是在装一些插件时自动添加的，也要注意，我们自己创建cluster role时不要以system开头，以免分不清楚

名称为cluster-admin 的clusterRole 为k8s自带的默认管理角色，具有所有资源的管理权限，可以参考看下它的编排：

```java
[root@yq01-aip-aikefu10 ~]# kubectl get clusterrole cluster-admin -o yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  creationTimestamp: 2021-06-30T03:07:11Z
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: cluster-admin
  resourceVersion: "59"
  selfLink: /apis/rbac.authorization.k8s.io/v1/clusterroles/cluster-admin
  uid: 4353f02c-d950-11eb-bfae-6c92bf93c138
rules:
- apiGroups:
  - '*'
  resources:
  - '*'
  verbs:
  - '*'
- nonResourceURLs:
  - '*'
  verbs:
  - '*'
```

> apiGroups resources verbs 等全部用 * 代替，表示所有资源的意思

### 3.RoleBinding and ClusterRoleBinding

RoleBinding可以将角色中定义的权限授予用户或用户组，RoleBinding包含一组权限列表(Subjects)，权限列表中包含有不同形式的待授予权限资源类型(users,groups, or Service Account)：Rolebinding 同样包含对被 Bind 的 Role 引用；RoleBinding 适用于某个命名空间内授权，ClusterRoleBinding适用于集群范围内的授权。

创建RoleBinding

vimrolebindings.yaml

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: test-rolebinding
  namespace: vfan
subjects:
- kind: User    权限资源类型
  name: vfan    名称
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role   要绑定的Role的类型(可以是Role或ClusterRole)
  name: test-role    Role的名称
  apiGroup: rbac.authorization.k8s.io
```

> 此策略表示，将名称为test-role的Role的权限资源赋予给名为vfan的用户，仅作用于vfan namespace。

RoleBinding同样可以引用ClusterRole来对当前 namespace 内用户、用户组或SA来进行授权，这种操作允许管理员在整个集群中定义一些通用的ClusterRole，然后在不同的namespace中使用RoleBinding绑定。

vimrolebindings2.yaml

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: test-rolebinding2
  namespace: vfan
subjects:
- kind: User
  name: vfan
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: test-clusterrole
  apiGroup: rbac.authorization.k8s.io
```

> 以上策略表示，将名称为test-clusterrole的ClusterRole的资源权限赋予给了名称为vfan的用户，虽然赋予的是ClusterRole，但是由于Role仅作用于单个namespace，所以此资源策略仅仅对vfan namespace有效

vimclusterrolebindings.yaml

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: test-clusterrolebinding
subjects:
- kind: Group
  name: vfan
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: test-clusterrole
  apiGroup: rbac.authorization.k8s.io
```

> 以上策略表示，将name为test-clusterrole的ClusterRole的资源权限赋予给groupname为vfan的用户组，此用户组下所有用户拥有对整个集群的 test-clusterrole内的资源权限

## 实践：创建一个用户只能管理名为 vfan 的NameSpace

### 1.创建系统用户

```java
[root@Centos8 rbac]# useradd vfan
[root@Centos8 rbac]# su - vfan 
## 进入vfan用户测试访问k8s集群
[vfan@Centos8 ~]$ kubectl get pod 
The connection to the server localhost:8080 was refused - did you specify the right host or port?
```

> 默认肯定是访问不到的，如果想要访问，必须要创建vfan用户的访问证书

### 2.为 vfan 用户创建访问证书

```java
## 下载证书生成工具 cfssl
[root@Centos8 bin]# wget https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
[root@Centos8 bin]# wget https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
[root@Centos8 bin]# wget https://pkg.cfssl.org/R1.2/cfssl-certinfo_linux-amd64
## 改名，给执行权限
[root@Centos8 bin]# mv cfssl_linux-amd64 cfssl
[root@Centos8 bin]# mv cfssljson_linux-amd64 cfssljson
[root@Centos8 bin]# mv cfssl-certinfo_linux-amd64 cfssl-certinfo
[root@Centos8 bin]# chmod +x *
[root@Centos8 bin]# ll -h 
总用量 19M
-rwxr-xr-x 1 root root 9.9M 3月  30 2016 cfssl
-rwxr-xr-x 1 root root 6.3M 3月  30 2016 cfssl-certinfo
-rwxr-xr-x 1 root root 2.2M 3月  30 2016 cfssljson
[root@Centos8 bin]# mkdir /usr/local/vfancert
[root@Centos8 bin]# cd /usr/local/vfancert/
```

创建CA证书签名请求JSON文件

vimvfan-csr.json

```java
{
  "CN": "vfan",        用户名称
  "hosts": [],        主机地址，不填表示所有主机都可使用
  "key": {
    "algo": "rsa",    加密算法
    "size": 2048
},
  "names": [
    {
       "C": "CN",
       "L": "BeiJing",
       "O": "Ctyun",
       "ST": "BeiJing",            
       "OU": "System"
    }
  ]
}
```

开始创建访问证书

```java
[root@Centos8 vfancert]# cd /etc/kubernetes/pki/
[root@Centos8 pki]# cfssl gencert -ca=ca.crt -ca-key=ca.key -profile=kubernetes /usr/local/vfancert/vfan-csr.json | cfssljson -bare vfanuser
2020/09/02 22:08:51 [INFO] generate received request
2020/09/02 22:08:51 [INFO] received CSR
2020/09/02 22:08:51 [INFO] generating key: rsa-2048
2020/09/02 22:08:51 [INFO] encoded CSR
2020/09/02 22:08:51 [INFO] signed certificate with serial number 191102646650271030964539871811792985454770130197
2020/09/02 22:08:51 [WARNING] This certificate lacks a "hosts" field. This makes it unsuitable for
websites. For more information see the Baseline Requirements for the Issuance and Management
of Publicly-Trusted Certificates, v.1.1.6, from the CA/Browser Forum (https://cabforum.org);
specifically, section 10.2.3 ("Information Requirements").
## 创建成功，pki目录下多出vfanuser-key.pem、vfanuser.pem和vfanuser.csr文件
[root@Centos8 pki]# ls
vfanuser.csr
vfanuser-key.pem
vfanuser.pem
```

### 3.为 vfan 用户生成集群配置文件

```java
## 设置api server的环境变量
[root@Centos8 vfancert]# export KUBE_APISERVER="https://192.168.152.53:6443"
## 创建kubeconfig文件，以下详细参数信息可通过kubectl config set-cluster --help查看
[root@Centos8 vfancert]# kubectl config set-cluster kubernetes --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs=true --server=${KUBE_APISERVER} --kubeconfig=vfan.kubeconfig
Cluster "kubernetes" set.
## 配置文件生成
[root@Centos8 vfancert]# ls
vfan-csr.json  vfan.kubeconfig
## 设置客户端参数，绑定用户信息至kubeconfig中
[root@Centos8 vfancert]# kubectl config set-credentials vfanuser \
> --client-certificate=/etc/kubernetes/pki/vfanuser.pem \
> --client-key=/etc/kubernetes/pki/vfanuser-key.pem \
> --embed-certs=true \
> --kubeconfig=vfan.kubeconfig
User "vfanuser" set.
## 设置上下文参数
[root@Centos8 vfancert]# kubectl config set-context kubernetes \
> --cluster=kubernetes \
> --user=vfan \
> --namespace=vfan \
> --kubeconfig=vfan.kubeconfig
Context "kubenetes" created.
```

### 4.进行RoleBinding 验证权限生效

vimvfanrolebind.yaml

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: test-rolebinding
  namespace: vfan
subjects:
- kind: User
  name: vfan
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: test-rbac    绑定上文中创建的名称为 test-rbac 的Role，具体权限，往上翻下哈
  apiGroup: rbac.authorization.k8s.io
```

把kubeconfig文件复制到 vfan 用户的家目录的.kube下

```java
[root@Centos8 vfancert]# mkdir -p /home/vfan/.kube
[root@Centos8 vfancert]# cp vfan.kubeconfig /home/vfan/.kube/config
[root@Centos8 vfancert]# cd /home/vfan/.kube/
[root@Centos8 .kube]# ls
config
## 修改文件所有者
[root@Centos8 vfan]# chown -R vfan:vfan .kube/
```

切换上下文，使kubectl读取到config的信息

```java
[vfan@Centos8 .kube]$ kubectl config use-context kubernetes --kubeconfig=config 
Switched to context "kubernetes".
```

开始测试权限

```java
[vfan@Centos8 .kube]$ kubectl get pod 
No resources found.
[vfan@Centos8 .kube]$ kubectl get svc 
Error from server (Forbidden): services is forbidden: User "vfan" cannot list resource "services" in API group "" in the namespace "vfan"
```

> 可以get pod，但是不可以get service，因为之前的Role中明确的表示了自己的权限

在vfan名称空间下创建测试Deployment

```java
## root用户下创建
[root@Centos8 k8sYaml]# kubectl run deployment test-vfan --replicas=3 --image=nginx:1.2.1 --namespace=vfan
[root@Centos8 k8sYaml]# kubectl get pod -n vfan 
NAME                         READY   STATUS    RESTARTS   AGE
deployment-7b89b946d-5dtvp   1/1     Running   0          17s
deployment-7b89b946d-jpr5v   1/1     Running   0          17s
deployment-7b89b946d-r8k4l   1/1     Running   0          17s
## 前往vfan用户查看
[vfan@Centos8 .kube]$ kubectl get pod 
NAME                         READY   STATUS    RESTARTS   AGE
deployment-7b89b946d-5dtvp   1/1     Running   0          67s
deployment-7b89b946d-jpr5v   1/1     Running   0          67s
deployment-7b89b946d-r8k4l   1/1     Running   0          67s
```

> 可以看到，vfan用户也可以查看到相对应的Pod，因为vfan用户在get pod时并没有指定名称空间，所以可以证明vfan的默认名称空间即是vfan
