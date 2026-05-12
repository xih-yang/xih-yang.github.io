# 09、Kubernetes - 实战：存储之Secret配置管理Service Account、Opaque、dockerconfigjson
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/9.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是Secret？

Secret是存储中的一种，主要用于保存敏感信息，例如密码、OAuth 令牌和 ssh key。 敏感信息放在 secret 中比放在 Pod 的定义或者容器镜像中来说更加安全和灵活。

Pod主要有两种方式使用 secret：

（1）作为 volume 中的文件被挂载到 pod 中的一个或者多个容器里。

（2）当 kubelet 为 pod 拉取镜像时使用。

Secret的类型：

（1）Service Account：Kubernetes 自动创建包含访问 API 凭据的 secret，并自动修改 pod 以使用此类型的 secret。

（2）Opaque：使用base64编码存储信息，可以通过base64 --decode解码获得原始数据，因此安全性弱。

（3）kubernetes.io/dockerconfigjson：用于存储docker registry的认证信息

## 2、Service Account

serviceaccout 创建时 Kubernetes 会默认创建对应的 secret。对应的 secret 会自动挂载到 Pod 的`/run/secrets/kubernetes.io/serviceaccount` 目录中。

```java
 kubectl  run demo --image=myapp:v1
```

进入emo查看

每个namespace下有一个名为default的默认的ServiceAccount对象

ServiceAccount里有一个名为Tokens的可以作为Volume一样被Mount到Pod里的Secret，当Pod启动时这个Secret会被自动Mount到Pod的指定目录下，用来协助完成Pod中的进程访问API Server时的身份鉴权过程。

## 3、Opaque

### （1）从文件中创建Secret

```java
echo -n 'admin' > ./username.txt		%创建用户
echo -n 'westos' > ./password.txt		%创建密码
kubectl create secret generic db-user-pass --from-file=./username.txt --from-file=./password.txt	%用文件创建db-user-pass这个新secret
	%如果密码具有特殊字符，则需要使用 \ 字符对其进行转义
kubectl get secrets						%查看secrets
```

详细查看，查看到的用户和密码不是原本的明文，是经过base64编码后的结果，使用-d参数就可以解码。

### （2）使用yaml文件创建secret

base64编码

```java
echo -n 'admin' | base64
YWRtaW4=
echo -n 'westos' | base64
d2VzdG9z
```

编辑secret.yaml文件

```java
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
  password: d2VzdG9z
```

创建mysecret，查看

### （3）将Secret挂载到Volume中

修改secret.yaml文件

```java
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
  password: d2VzdG9z
---
apiVersion: v1
kind: Pod
metadata:
  name: mysecret
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts:		%把secret挂载到mysecret这个pod中的/secret
    - name: secrets
      mountPath: "/secret"
      readOnly: true		%只读
  volumes:
  - name: secrets
    secret:
      secretName: mysecret
```

创建pod，查看pod。进入mysecret，可以看到username和password

### （4）向指定路径映射 secret 密钥

由于实验环境很乱，所以先删除不用的pod

修改secret.yaml文件

```java
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
  password: d2VzdG9z
---
apiVersion: v1
kind: Pod
metadata:
  name: mysecret
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts:
    - name: secrets
      mountPath: "/secret"
      readOnly: true
  volumes:
  - name: secrets
    secret:
      secretName: mysecret
      items:
      - key: username
        path: my-group/my-username		%指定路径为/secret/my-group/my-username
```

创建pod，查看pod。进入mysecret，在/secret/my-group/my-username可以看到username

### （5）将Secret设置为环境变量

修改secret.yaml文件

```java
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
  password: d2VzdG9z
---
apiVersion: v1
kind: Pod
metadata:
  name: secret-env
spec:
  containers:
  - name: nginx
    image: nginx
    env:					%设置环境变量
      - name: SECRET_USERNAME
        valueFrom:			%把mysecret中的username这个key值取出来，并改名为SECRET_USERNAME
          secretKeyRef:
            name: mysecret
            key: username
      - name: SECRET_PASSWORD
        valueFrom:			%把mysecret中的password这个key值取出来，并改名为SECRET_PASSWORD
          secretKeyRef:
            name: mysecret
            key: password
```

创建secret-env，查看

进入secret-env，查看环境变量

环境变量读取Secret很方便，但无法支撑Secret动态更新

进入mysecret编辑，

修改密码为redhat

再次进入secret-env，查看环境变量，还是westos，没有改变

## 3、kubernetes.io/dockerconfigjson

kubernetes.io/dockerconfigjson用于存储docker registry的认证信息.

新建一个私有仓库westos，如果没有给定仓库密码的话，是会拉取失败的

创建myregistrykey，指定仓库名字，给定仓库的用户名和密码。查看

编辑registry.yaml文件

创建mypod，查看，启动失败

修改registry.yaml文件

```java
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
    - name: game2048
      image: hyl.westos.org/westos/game2048
  imagePullSecrets:				%给定仓库认证信息
    - name: myregistrykey
```

删除之前的mypod，重新创建，查看running
