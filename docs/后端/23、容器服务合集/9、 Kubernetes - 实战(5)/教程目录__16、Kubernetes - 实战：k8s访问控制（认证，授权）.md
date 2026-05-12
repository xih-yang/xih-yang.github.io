# 16、Kubernetes - 实战：k8s访问控制（认证，授权）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/16.html
- 分类：容器服务
- 分组：教程目录
## 一、kubernetes访问控制原理

## Authentication（认证）

认证方式现共有8种，可以启用一种或多种认证方式，只要有一种认证方式通过，就不再进行其它方式的认证。通常启用`X509 Client Certs和Service Accout Tokens`两种认证方式。

Kubernetes集群有两类用户：由Kubernetes管理的Service Accounts （服务账户）和（Users Accounts） 普通账户。k8s中账号的概念不是我们理解的账号，它并不真的存在，它只是形式上存在。

## Authorization（授权）

必须经过认证阶段，才到授权请求，根据所有授权策略匹配请求资源属性，决定允许或拒绝请求。授权方式现共有6种，AlwaysDeny、AlwaysAllow、ABAC、RBAC、Webhook、Node。**默认集群强制开启RBAC。**

## Admission Control（准入控制）

用于拦截请求的一种方式，运行在认证、授权之后，是权限认证链上的最后一环，对请求API资源对象进行修改和校验。

**注意：以上三个流程必须按照流程走，即先认证，再授权，最后准入控制。**

访问k8s的API Server的客户端主要分为两类：

```java
kubectl ：用户家目录中的 .kube/config 里面保存了客户端访问API Server的密钥相关信息，这样当用kubectl访问k8s时，它就会自动读取该配置文件，向API Server发起认证，然后完成操作请求。
pod：Pod中的进程需要访问API Server，如果是人去访问或编写的脚本去访问，这类访问使用的账号为：UserAccount；而Pod自身去连接API Server时，使用的账号是：ServiceAccount，生产中后者使用居多。
```

kubectl 向apiserver发起的命令,采用的是http方式,其实就是对URL发起增删改查的操作。

$kubectl proxy --port=8888 &

$curl http://localhost:8888/api/v1/namespaces/default

$curl http://localhost:8888/apis/apps/v1/namespaces/default/deployments

以上两种api的区别是：

```java
api它是一个特殊链接,只有在核心v1群组中的对象才能使用。
apis 它是一般API访问的入口固定格式名。
```

UserAccount与serviceaccount：

用户账户是针对人而言的。 服务账户是针对运行在 pod 中的进程而言的。

用户账户是全局性的。 其名称在集群各 namespace 中都是全局唯一的，未来的用户资源不会做 namespace 隔离， 服务账户是 namespace 隔离的。

通常情况下，集群的用户账户可能会从企业数据库进行同步，其创建需要特殊权限，并且涉及到复杂的业务流程。 服务账户创建的目的是为了更轻量，允许集群用户为了具体的任务创建服务账户 ( 即权限最小化原则 )。

## 二、认证示例

## serviceaccount示例

创建serviceaccount：

```java
$ kubectl create serviceaccount admin
serviceaccount/admin created
```

此时k8s为用户自动生成认证信息，但没有授权

```java
$ kubectl describe sa admin             
Name:                admin
Namespace:           default
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   admin-token-6xfpp
Tokens:              admin-token-6xfpp
Events:              <none>
```

=

添加secrets到serviceaccount中：

```java
$ kubectl patch serviceaccount admin -p '{"imagePullSecrets": [{"name": "myregistrykey"}]}'
```

```java
**这个myregistrykey是之前做仓库secret创建的**
```

把serviceaccount和pod绑定起来：

```java
apiVersion: v1
kind: Pod
metadata:
  name: myapp
   labels:
    app: myapp
spec:
  containers:
  - name: myapp
    image: reg.westos.org/cl/nginx			#私有仓库
    ports:
    - name: http
      containerPort: 80
  serviceAccountName: admin
```

将认证信息添加到serviceAccount中，要比直接在Pod指定imagePullSecrets要安全很多。

## UserAccount示例

创建UserAccount：

```java
# cd /etc/kubernetes/pki/
# openssl genrsa -out test.key 2048		#输出2048位加密的key
# openssl req -new -key test.key -out test.csr -subj "/CN=test"		#制作名为test.csr的证书请求
# openssl  x509 -req -in test.csr -CA ca.crt -CAkey ca.key  -CAcreateserial -out test.crt -days 365			#申请证书
# openssl x509 -in test.crt -text -noout		#查看证书
```

使用创建的证书：

```java
$ kubectl config set-credentials test --client-certificate=/etc/kubernetes/pki/test.crt --client-key=/etc/kubernetes		/pki/test.key --embed-certs=true	#注入证书
$ kubectl  config view			#查看配置
$ kubectl config set-context test@kubernetes --cluster=kubernetes --user=test			#将用户test添加到context中
$ kubectl config use-context test@kubernetes		#切换用户
$ kubectl config use-context kubernetes-admin@kubernetes		#切换用户
$ kubectl config get-context 		#查看当前用户
```

切换用户后查看pod：

```java
$ $ kubectl  get pod
Error from server (Forbidden): pods is forbidden: User "test" cannot list resource "pods" in API group "" in the namespace "default"
```

此时用户通过认证，但还没有权限操作集群资源，需要继续添加授权。

注意授权时需要切换成 kubernetes-admin用户。

## 三、RBAC 授权

RBAC（Role Based Access Control）：基于角色访问控制授权。

```java
允许管理员通过Kubernetes API动态配置授权策略。RBAC就是用户通过角色与权限进行关联。
RBAC只有授权，没有拒绝授权，所以只需要定义允许该用户做什么即可。
RBAC包括四种类型：Role、ClusterRole、RoleBinding、ClusterRoleBinding 即角色、角色绑定、集群角色、集群角色绑定。
```

RBAC的三个基本概念：

Subject：被作用者，它表示k8s中的三类主体， user， group， serviceAccount

Role：角色，它其实是一组规则，定义了一组对 Kubernetes API 对象的操作权限。

RoleBinding：定义了“被作用者”和“角色”的绑定关系。

Role 和 ClusterRole

```java
Role是一系列的权限的集合，Role只能授予单个namespace 中资源的访问权限。
ClusterRole 跟 Role 类似，但是可以在集群中全局使用。
```

RoleBinding和ClusterRoleBinding

```java
RoleBinding是将Role中定义的权限授予给用户或用户组。它包含一个subjects列表(users，groups，service accounts)，并引用该Role或者clusterrole，但注意RoleBinding一定要写单个的namespace。
RoleBinding是对某个namespace 内授权，ClusterRoleBinding适用在集群范围内使用。
```

## 四、RBAC示例

以下这些示例需要注意的是：在执行部署文件时需要切换成管理员，即kubernetes-admin。

Role示例

```java
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: myrole
rules:
- apiGroups: [""] 
  resources: ["pods"]
  verbs: ["get", "watch", "list", "create", "update", "patch", "delete"]
```

上述部署文件定义可以个名为myrole的角色，该角色具有对pod一系列操作`[“get”, “watch”, “list”, “create”, “update”, “patch”, “delete”]`

的权限，并且这个角色是针对默认的`namespace`。

可以使用 `kubectl get role` 查看创建的role。

RoleBinding示例

```java
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: test-read-pods
  namespace: default
subjects:
- kind: User
  name: test
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: myrole
  apiGroup: rbac.authorization.k8s.io
```

上述部署文件定义了一个名为test-read-pods的RoleBinding，表示将 用户test和角色 myrole进行绑定，使test用户具有角色myrole所拥有的权限。

运行部署文件后切换成test用户即可查看pod，但是也仅是默认命名空间下的pod，并不能操作svc 或者其他namespace中的pod，这些权限均是在角色中定义好的。

ClusterRole示例

集群角色示例：

```java
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: myclusterrole
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list", "delete", "create", "update"]
- apiGroups: ["extensions", "apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

该部署文件表示定义一个名为myclusterrole的集群角色，并且该即集群角色对pods和deployments有一系列的权限。

使用角色绑定绑定集群角色

使用rolebinding绑定clusterRole:

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: rolebind-myclusterrole
  namespace:  default
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: myclusterrole
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: test
```

该部署文件表示使用角色绑定将用户test与集群角色myclusterrole进行绑定，使用户test拥有集群角色myclusterrole所拥有的权限。

注意该方法需要指定namespace。

运行该文件后test用户可以对pods和deployments有一系列的操作，但是没有svc和其他命名空间pod的权限。

clusterrolebinding示例

创建clusterrolebinding：

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: clusterrolebinding-myclusterrole
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: myclusterrole
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: test
```

该部署文件表示使用集群角色绑定将用户test与集群角色绑定，使用户test在所有命名空间namespace中拥有对pods和deployments的一系列权限，这些权限在集群角色的部署文件中定义。

## 六、服务账户的自动化

服务账户准入控制器（Service account admission controller）

```java
如果该 pod 没有 ServiceAccount 设置，将其 ServiceAccount 设为 default。
保证 pod 所关联的 ServiceAccount 存在，否则拒绝该 pod。
如果 pod 不包含 ImagePullSecrets 设置，那么 将 ServiceAccount 中的 ImagePullSecrets 信息添加到 pod 中。
将一个包含用于 API 访问的 token 的 volume 添加到 pod 中。
将挂载于 /var/run/secrets/kubernetes.io/serviceaccount 的 volumeSource 添加到 pod 下的每个容器中。
```

Token 控制器（Token controller）

```java
检测服务账户的创建，并且创建相应的 Secret 以支持 API 访问。
检测服务账户的删除，并且删除所有相应的服务账户 Token Secret。
检测 Secret 的增加，保证相应的服务账户存在，如有需要，为 Secret 增加 token。
检测 Secret 的删除，如有需要，从相应的服务账户中移除引用。
```

服务账户控制器（Service account controller）

```java
服务账户管理器管理各命名空间下的服务账户，并且保证每个活跃的命名空间下存在一个名为 “default” 的服务账户
```

Kubernetes 还拥有“用户组”（Group）的概念：

ServiceAccount对应内置“用户”的名字是：

system:serviceaccount:

而用户组所对应的内置名字是：

system:serviceaccounts:

示例1：表示mynamespace中的所有ServiceAccount

```java
subjects:
- kind: Group
  name: system:serviceaccounts:mynamespace
  apiGroup: rbac.authorization.k8s.io
```

示例2：表示整个系统中的所有ServiceAccount

```java
subjects:
- kind: Group
  name: system:serviceaccounts
  apiGroup: rbac.authorization.k8s.io
```

ubernetes 还提供了四个预先定义好的 ClusterRole 来供用户直接使用：

```java
cluster-amdin 权限最大
admin
edit
view 权限最小
```

示例：(最佳实践)

```java
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: readonly-default
subjects:
- kind: ServiceAccount
  name: default
  namespace: default
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
```

上述部署文件表示将默认namespace下的默认ServiceAccount与内置的集群角色view绑定，使这个ServiceAccount拥有查看集群的权力。
