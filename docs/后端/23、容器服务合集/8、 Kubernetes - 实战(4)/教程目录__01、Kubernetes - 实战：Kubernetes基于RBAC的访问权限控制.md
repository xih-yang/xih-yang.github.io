# 01、Kubernetes - 实战：Kubernetes基于RBAC的访问权限控制
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/1.html
- 分类：容器服务
- 分组：教程目录
### 一、前言

在Kubernetes的使用过程中，用户和集群各类资源对象的关系是最初始也是最基本的需要解决的问题。在Kubernetes的体系中，用户账号叫做subject，包括两个种类：User和ServiceAccount，前者给个人使用，后者给Pod使用；而所有的namespace级别和集群级别的资源叫做object；Kubernetes使用RBAC机制操作subject和object，来向外部提供干预系统状态的干预者的认证和授权机制。在v1.6之前，Kubernetes使用ABAC进行权限管理，在v1.8之后RBAC机制进入稳定阶段。

通过使用RBAC机制，是的系统管理员、研发、测试等不同集群使用者就能更细粒度使用和管理集群的资源，满足多namespace、多种权限(只读、读写、跨namespace读/写)等需求。

### 二、用户账户的建立和认证

集群外部实体(管理员、namespace用户或者服务研发)和集群内部实体(Kubernetes系统和部署于集群上应用)都会有访问和调控系统资源的需求，外部实体使用User(Kubernetes有一个User类型的资源来代表)进行集群访问接入，内部实体(Pod里面的进程)使用ServiceAccount进行集群访问接入。User账户是没有namespace属性的，ServiceAccount账户是有namespace属性的。

对于外部用户账户，实际上，使用集群ca证书和用户的签名证书为用户颁发的集群访问证书，只是表明外部用户被认证过能访问API Server接口，但是在管理员将这个用户通过Kind:User注册到集群之前， API Server是不会响应资源操作请求的。除了上述使用签名证书方式来验证外部用户(用户的名字在制作证书的时候的CN属性里面填写)之外，还可以通过静态token文件或者静态密码文件进行外部用户验证，但是这要求在API Server启动的时候指定这些静态文件。

对于内部用户账户ServiceAccount(sa)，可以用于授权Pod里面的进程访问API Server，它所对应的secret的token可以用于集群外部进程访问API Server。API Server被创建之后，token controller会为这个sa建立一个secret object：

在POD启动时，如果指定使用该sa，则sa对应secret里面的token和ca文件会被自动挂载到容器的/var/run/secrets/kubernetes.io/serviceaccount/目录：

> Containers:
>
> nginx:
>
> Container ID: docker://d5fee046729b8010c7fa0f6d7abd0c6bf08238dce0041979124bd143e6b3eb53
>
> Image: 172.2.2.11:5000/nginx:1.14
>
> ......
>
> Mounts:
>
> /var/run/secrets/kubernetes.io/serviceaccount from default-token-khs2h (ro)
>
> ......
>
> Volumes:
>
> default-token-khs2h:
>
> Type: Secret (a volume populated by a Secret)
>
> SecretName: default-token-khs2h
>
> Optional: false

### 2.1 建立外部认证用户

**为用户生成证书**

```java
Generate private key
openssl genrsa -out myuser.key 2048
Generating RSA private key, 2048 bit long modulus
.................+++
.......................................+++
e is 65537 (0x10001)
Generate CSR(证书签名请求)
openssl req -new -key myuser.key -out myuser.csr -subj "/CN=myuser/O=MGM”
通过集群的CA证书和之前创建的csr文件，来为用户颁发证书
openssl x509 -req -in myuser.csr -CA  /etc/kubernetes/pki/ca.crt -CAkey /etc/kubernetes/pki/ca.key -CAcreateserial -out myuser.crt -days 3650
```

其中CN为用户名；最后将证书(myuser.crt)和私钥(myuser.key)保存起来，这两个文件将被用来验证API请求。

### 2.2 建立内部认证用户

```java
apiVersion: v1
kind: ServiceAccount
metadata:
  name: mynamespace-user
  namespace: mynamespace
```

### 三、Kubernetes中可被管理的资源

Kubernetes所有可被管理的资源实体叫做object，在kubernetes.io网站上关于object的描述如下：

> Kubernetes objects are persistent entities in the Kubernetes system. Kubernetes uses these entities to represent the state of your cluster. Specifically, they can describe:
>
>
> What containerized applications are running (and on which nodes)
> The resources available to those applications
> The policies around how those applications behave, such as restart policies, upgrades, and fault-tolerance

Kubernetes集群的工作就是根据obejct的spec(yaml)，使用各种controller将object调整到期望的状态(Status)；而向Kubernetes集群提出object描述及其状态期望，就会使用到User或者ServiceAccount。集群认可的object由如下一些字段进行描述：

> apiVersion
> kind
> metadata
> spec

这些object有的是具有namepace属性的(比如pods、deployments、services、serviceaccounts、ingresses、configmaps、persistentvolumeclaims等)，有的是全集群范围的(比如nodes、namespaces、persistentvolumes、storageclasses等)，一个示例集群的object及其属性状况可以通过运行kubectl api-resources命令获得：

针对这些对象还可以执行不同的动作(verbs)：

后续在进行集群权限管理的时候，这些object是进行管理的最小集合，而针对某个object，还有create、get、list、watch、update、patch、delete等verb操作进行行为权限的细粒度控制。在RBAC管理机制中的Role其实就是一系列object+verbs的组合，比如下面这个例子就是一个可以创建和读取POD的Role：

### 四、基于RABC的授权管理

计算机系统的权限管理不是一个新话题，无论是VAX这样的早期共享系统、网络防火墙、商业数据库还是Linux内核，都需要根据自己的业务特点来设计一套权限管理机制，保证系统的状态在不同的粒度上可调可控。权限系统模型根据业务需求会有各种变种，基本的一些模型包括ACL、DAC、MAC、RBAC、ABAC等，Kubernetes在v1.8以后提供稳定版本的RABC权限管理机制。

在RBAC模型中，需要Subject、Resource Entity和Operation进行组合来赋予某个账户特定的操作权限：

> Subject：User、ServiceAccount
>
> Resource Entity：Kubernetes Objects
>
> Operations：Verbs(create、get、list、watch、update、patch、delete)

RBAC模型的核心概念如下：

> Verbs和Kubernetes Objects的组合叫做role，针对namespaced的object的叫做Role，而针对非namespaced的object叫做ClusterRole
> 将Role和Subject进行关联的行为叫做RoleBinding
> 将ClusterRole和Subject进行关联的行为叫做ClusterRoleBinding

在Kubernetes的RBAC模型中Objects、Verbs、Role、ClusterRole、RoleBinding和ClusterRoleBinding的相互交互关系如下：

### 4.1 给外部账户授权

定义一个在mynamespace这个namespace对POD只有只读权限的Role：

```java
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: mynamespace
  name: pod-reader
rules:
- apiGroups: [""] "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

将这个Role授权给之前建立的myuser这个外部账户，RoleBinding.yaml :

```java
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: my-rolebinding
  namespace: mynamespace
subjects:
- kind: User
  name: myuser
  apiGroup: ""
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: ""
```

为人员使用外部账户创建kubeconfig，将myuser.crt和myuser.key文件的内容放入myuser.kubeconfig(需要注意的是这个kubeconfig是无法用于dashboard登陆的，kubeconfig文件需要配置token字段之后才能用于dashboard登陆)：

```java
apiVersion: v1
kind: Config
preferences: {}
# Define the cluster
clusters:
- cluster:
    certificate-authority-data: k8s_ca_data
    You'll need the API endpoint of your Cluster here:
    server: https://128.0.0.1:6443
  name: myuser-cluster
# Define the user
users:
- name: myuser
  user:
    client-certificate-data: client_ca_data
    client-key-data: client_key_data
# Define the context: linking a user to a cluster
contexts:
- context:
    cluster: myuser-cluster
    namespace: mynamespace
    user: myuser
  name: myuser-context
# Define current context
current-context: myuser-context
```

### 4.2 给内部账户授权

access.yaml(这是一个mynamespace只读的例子)：

```java
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: mynamespace-user
  namespace: mynamespace
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: mynamespace-user-full-access
  namespace: mynamespace
rules:
- apiGroups: ["", "extensions", "apps"]
  resources: ["*"]
  verbs: ["*"]
- apiGroups: ["batch"]
  resources:
  - jobs
  - cronjobs
  verbs: ["*"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: mynamespace-user-view
  namespace: mynamespace
subjects:
- kind: ServiceAccount
  name: mynamespace-user
  namespace: mynamespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: mynamespace-user-full-access
```

同时也可以通过

> kubectl get secret mynamespace-user-token-h67bk -n mynamespace -o "jsonpath={.data.token}" | base64 -d

和

> kubectl get secret mynamespace-user-token-h67bk -n mynamespace -o "jsonpath={.data['ca\.crt’]}"

分别获取token和ca来构建针对这个serviceaccount的kubeconfig文件mynamespace.kubeconfig：

```java
apiVersion: v1
kind: Config
preferences: {}
# Define the cluster
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUN5RENDQWJDZ0F3SUJBZ0lCQURBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwcmRXSmwKY201bGRHVnpNQjRYRFRFNE1Ea3hPVEEyTlRZME9Gb1hEVEk0TURreE5qQTJOVFkwT0Zvd0ZURVRNQkVHQTFVRQpBeE1LYTNWaVpYSnVaWFJsY3pDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBT2lhCjhSTWs2N0FRNWVpelBvYVcvTWptQlBtU2xoSFowVkkxcUcwcjI4bnVON2Jya29XeGNTMzgvdklkSFZySmR4Z3MKTS9iQzBORnFwZW54dkRTK2ZyY21TdnhYWDRmdHZ2MkdNRC8vVHdtRGxzNVU1eEZFR1pkNCtBbEZ5N3hnK0FTegpweHd5RDlXZVRwRi9Dc2c1RVBPTk5rSVJodFRVZFJxM2xVVGpDK1hZUGFVTzlUb3hkdkNzQ0VocWRpZGUrL3p4CitPbEhuVXplQzBCVVZvQTJkNGMwbUZEYVhLZFE5NlFIR0FqSGJiMTBoMlNXTDNSNXlpM1dVQjBQcjZxUzZsa08KL3Y5anBBVmRjLzNoeFRsbWZ4UWFMT284cUxpKzFtTmsvSTRwYXZkY0F0emVhUHRZVWw5ME1EaUNla2hCcTNPUQpORllGTXlmRDF4Z3o5ODRPQ1hNQ0F3RUFBYU1qTUNFd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCCi93UUZNQU1CQWY4d0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFBMzd6NDVpYjhwMWxwRnYwbW90aHZpR3NBOEEKV0IzOVNGWnRySXJkVmtpSXgzd2huVWtXcWVhUHc3T3JZVE5IanFTNjJiS1RwcENQT2pFc09WUnlyaHg4S0FZQwpTTG5CS3p5ZG1PdUgvNmFrWjA4bUliSkl5d2dIajJpVmRuYXc3N25kTGVxNWlESERLQW5ZcGVuUjYyOTVYdCtXCjgvVGVVYnBhUEdONnZDYWF2Qks2enQyMjRuWERhQlBQbHNXeVlVMWVZL1hsb0liTXluelcwQy81aGhYbFY0aGwKLzNVdEozM1duNVNpK2lHRHNoeXpnUDZNSXJ6UGxFaTE2b0EweTNHRHFxQm16NEJZMnV4V2hpZXFQc0JnazlWQgpISVI5eUx0YUIzU2VGcVl3R21zRlhtMzE1M0VhY0VTSzhTRktacTFhWXNSNXoxZ1pFV3BITXQ1M00rRT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    You'll need the API endpoint of your Cluster here:
    server: https://128.0.0.1:6443
  name: my-cluster
# Define the user
users:
- name: mynamespace-user
  user:
    as-user-extra: {}
    token: eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJteW5hbWVzcGFjZSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJteW5hbWVzcGFjZS11c2VyLXRva2VuLWg2N2JrIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6Im15bmFtZXNwYWNlLXVzZXIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiI3ODBhMjhjNS1jZGMxLTExZTgtOTEzNS1mYTE2M2ViZGExYjgiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6bXluYW1lc3BhY2U6bXluYW1lc3BhY2UtdXNlciJ9.erWv2a6WdzD9ikWc2zvykudwFuxE65nYJhtkf7m3b_EoIwdAGEoKU-zqVRbwl7e9uGMba6nAQZIP155t93KSu23ZynAnjyHci1k9raTec92sb_d-YyuWWEs6IK4a-ziQaeTUHa6p6dvlmBoYLYFJDhkjX705OyOvr8-Zz3LZWc1TgYdtuD398jEAGQ74kg3sms6PBBDDisOJRTHxSiZ41GG9iGnqGdv2LGVV1S7K724pu-QcFQHMom1i3FTkBo3pGeZK-EF-ZPKCkHCG586T_F2phWAK5YVUSCwYwNhCH_YeLsc6kvkM2Xb3rJXXjVp_CaMqKbpygIjpPO8tYinrqQ
# Define the context: linking a user to a cluster
contexts:
- context:
    cluster: my-cluster
    namespace: mynamespace
    user: mynamespace-user
  name: mynamespace
# Define current context
current-context: mynamespace
```
