# 12、Kubernetes - 实战：访问控制ServiceAccount、UserAccount、RBAC、服务账户的自动化
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/12.html
- 分类：容器服务
- 分组：教程目录
## 1、访问控制基本流程

主要分为三个部分，认证、授权和准入控制。

> （1）Authentication（认证）
>
> 认证方式现共有8种，可以启用一种或多种认证方式，只要有一种认证方式通过，就不再进行其它方式的认证。通常启用X509 Client Certs认证方式。
>
> Kubernetes集群有两类用户：由Kubernetes管理的Service Accounts （服务账户）和Users Accounts（普通账户）。k8s中账号的概念不是我们理解的账号，它并不真的存在，它只是形式上存在。不同的账号开放不同的权限
>
> （2）Authorization（授权）
>
> 经过认证阶段后，是授权请求，根据所有授权策略匹配请求资源属性，决定允许或拒绝请求。授权方式现共有6种，AlwaysDeny、AlwaysAllow、ABAC、RBAC、Webhook、Node。默认集群强制开启RBAC（Role Based Access Control）：基于角色访问控制授权
>
> （3）Admission Control（准入控制）
>
> 用于拦截请求的一种方式，运行在认证、授权之后，是权限认证链上的最后一环，对请求API资源对象进行修改和校验，从而达到进一步精细化的控制。

访问k8s的API Server的客户端主要分为两类：

**1、** kubectl：用户家目录中的.kube/config里面保存了客户端访问APIServer的密钥相关信息，这样当用kubectl访问k8s时，它就会自动读取该配置文件，向APIServer发起认证，然后完成操作请求；

**2、** pod：Pod中的进程需要访问APIServer，如果是人去访问或编写的脚本去访问，这类访问使用的账号为：UserAccount；而Pod自身去连接APIServer时，使用的账号是：ServiceAccount，生产中后者使用居多；

## 2、ServiceAccount

在之前的secret小节中说到，如果镜像放在一个私有仓库中，拉取镜像是会失败的，为了解决这个问题，使用`kubectl create secret docker-registry myregistrykey --docker-server=reg.westos.org --docker-username=admin --docker-password=westos --docker-email=root@westos.org`命令，产生一个secret，名字叫myregistrykey，其中指定了仓库名字，给定了仓库的用户名和密码，当我们写yaml文件时，只要把myregistrykey写入yaml文件就可以成功拉取镜像。但是这种方法每次都需要写入文件中，并且有一定泄漏密码的风险，有没有其他更好的办法？

创建ServiceAccount，为用户自动生成认证信息，但没有授权

添加secrets到serviceaccount中，现在如果有pod使用admin这个serviceaccount就可以调用myregistrykey，但无法破解具体密码

```java
 kubectl patch serviceaccount admin -p '{"imagePullSecrets": [{"name": "myregistrykey"}]}'
```

可以看到myregistrykey和admin绑定成功

编辑registry.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: game2048
    image: reg.westos.org/westos/game2048:latest	%拉取私有仓库的镜像
  serviceAccountName: admin				%告诉它使用admin这个sa
```

应用registry.yaml文件，成功创建pod。注意将认证信息添加到serviceAccount中，要比直接在Pod指定imagePullSecrets要安全很多。

可以看到mypod产生时，调用了admin这个sa

## 3、UserAccount

```java
cd /etc/kubernetes/pki/		%进入/etc/kubernetes/pki/，可以看到有许多证书
openssl genrsa -out test.key 2048		%创建认证密钥
openssl req -new -key test.key -out test.csr -subj "/CN=test"	%提交证书申请请求
openssl  x509 -req -in test.csr -CA ca.crt -CAkey ca.key  -CAcreateserial -out test.crt -days 365	%产生x509证书
openssl x509 -in test.crt -text -noout		%查看证书
```

```java
kubectl config set-credentials test --client-certificate=/etc/kubernetes/pki/test.crt --client-key=/etc/kubernetes/pki/test.key --embed-certs=true	%设定test用户使用认证
kubectl  config view		%查看配置
```

```java
kubectl config set-context test@kubernetes --cluster=kubernetes --user=test		%创建创建test这个Useracccount
kubectl config use-context test@kubernetes		%切换到test用户
```

可以看到test用户还没有设定任何权限，所以不能查看pod

转换到初始的超户，就可以查看pod

## 4、RBAC基于角色访问控制授权

允许管理员通过Kubernetes API动态配置授权策略，RBAC就是用户通过角色与权限进行关联，即有某些角色的用户可以有某些特殊权限。

RBAC只有授权，没有拒绝授权，所以只需要定义允许该用户做什么即可。

RBAC包括四种类型：Role、ClusterRole、RoleBinding、ClusterRoleBinding。

> RBAC的三个基本概念：
>
> （1）Subject：被作用者，它表示k8s中的三类主体， user， group， serviceAccount
>
> （2）Role：角色，它其实是一组规则，定义了一组对 Kubernetes API 对象的操作权限。
>
> （3）RoleBinding：定义了“被作用者”和“角色”的绑定关系。

> Role 和 ClusterRole：
>
> （1）Role是一系列的权限的集合，Role只能授予单个namespace 中资源的访问权限。
>
> （2）ClusterRole 跟 Role 类似，但是可以在集群中全局使用。

> RoleBinding和ClusterRoleBinding：
>
> （1）RoleBinding是将Role中定义的权限授予给用户或用户组。它包含一个subjects列表(users，groups，service accounts)，并引用该Role。RoleBinding是对某个namespace 内授权
>
> （2）ClusterRoleBinding适用在集群范围内使用。

创建目录

编辑role.yaml文件

```java
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: myrole
rules:
- apiGroups: [""] 
  resources: ["pods"]	%对pod可以操作
  verbs: ["get", "watch", "list", "create", "update", "patch", "delete"]	%可执行操作种类
```

应用role.yaml文件，可以看到详细信息，成功写入

编写rolebinging.yaml 文件

```java
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: test-read-pods
  namespace: default	%授权作用在default这个ns中
subjects:				%被作用者是test这个sa
- kind: User
  name: test
  apiGroup: rbac.authorization.k8s.io
roleRef:				%角色来源是myrole（myrole里面具体写了可执行权限）
  kind: Role
  name: myrole
  apiGroup: rbac.authorization.k8s.io
```

应用rolebinging.yaml 文件，查看详细信息

切换到test用户，查看pod就可以了，但是查看其他ns的pod又被拒绝了。这是因为默认查看pod属于ns中的default，查看别的ns则还需要集群角色授权。查看default中的控制器也被拒绝了，这是因为只授权了pod，没有授权deployment

创建集群角色ClusterRole

编辑clusterrole.yaml文件

```java
kind: ClusterRole		%全局角色
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: myclusterrole
rules:
- apiGroups: [""]
  resources: ["pods"]				%对pod可以操作
  verbs: ["get", "watch", "list", "delete", "create", "update"]				%权限是增删改查
- apiGroups: ["extensions", "apps"]
  resources: ["deployments"]		%对deployments可以操作
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]	%权限是增删改查
```

切换会超级用户，应用 clusterrole.yaml文件，创建了全局角色myclusterrole

修改rolebinding.yaml文件

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
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: rolebind-myclusterrole
  namespace:  default
roleRef:			%角色来源是myclusterrole
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: myclusterrole
subjects:			%被作用对象是test
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: test
```

应用rolebinding.yaml文件，切换到test用户测试，可以查看deployments

类似的，全局角色也有全局绑定方法，可以作用所有ns

编辑clusterbinding.yaml文件

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding	%全局绑定
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

切换到超级用户，应用clusterbinding.yaml文件，查看

切换到test用户，可以查看其他ns的内容

## 5、服务账户的自动化

### （1）服务账户准入控制器（Service account admission controller）

如果该 pod 没有 ServiceAccount 设置，将其 ServiceAccount 设为 default。

保证 pod 所关联的 ServiceAccount 存在，否则拒绝该 pod。

如果 pod 不包含 ImagePullSecrets 设置，那么 将 ServiceAccount 中的 ImagePullSecrets 信息添加到 pod 中。

将一个包含用于 API 访问的 token 的 volume 添加到 pod 中。

将挂载于 /var/run/secrets/kubernetes.io/serviceaccount 的 volumeSource 添加到 pod 下的每个容器中。

### （2）Token 控制器（Token controller）

检测服务账户的创建，并且创建相应的 Secret 以支持 API 访问。

检测服务账户的删除，并且删除所有相应的服务账户 Token Secret。

检测 Secret 的增加，保证相应的服务账户存在，如有需要，为 Secret 增加 token。

检测 Secret 的删除，如有需要，从相应的服务账户中移除引用。

### （3）服务账户控制器（Service account controller）

服务账户管理器管理各命名空间下的服务账户，并且保证每个活跃的命名空间下存在一个名为 “default” 的服务账户
