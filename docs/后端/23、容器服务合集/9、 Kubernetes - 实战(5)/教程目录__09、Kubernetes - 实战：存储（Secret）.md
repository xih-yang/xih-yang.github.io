# 09、Kubernetes - 实战：存储（Secret）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/9.html
- 分类：容器服务
- 分组：教程目录
## 一、Secret简介

Secret对象类型用来保存敏感信息，例如密码、OAuth令牌和ssh key。

敏感信息放在Secret中比放在Pod的定义或者容器镜像中来说更加安全和灵活。

## Pod可以用两种方式来使用Secret：

```java
作为volume中的文件被挂载到pod中的一个或多个容器中。
当kubelet为pod拉取镜像时使用。
```

## Secret的类型：

```java
Service Account：Kubernetes自动创建包含访问API凭据的secret，并自动修改pod以使用此类型的secret。
Opaque：使用base64编码储存信息，可以通过base64 --decode解码获得原始数据，因此安全性弱。
kubernetes.io/dockerconfigjson：用来存储docker registy的认证信息。
```

## 二、Service Account

serviceaccount创建时Kubernetes会默认创建对应的secret。对应的secret会自动挂载到Pod的/var/run/secret/kubernetes.io/serviceaccount目录中：

运行一个pod查看详细信息：

```java
[root@server1 secert]# kubectl run  test --image=busybox --restart=Never
pod/test created
[root@server1 secert]# kubectl get pod
NAME   READY   STATUS      RESTARTS   AGE
test   0/1     Completed   0          12s
[root@server1 secert]# kubectl describe pod test 
```

会自动挂载一个叫token的secret，这个secret是Service Account自动创建的，用于访问API凭据的

查看serviceaccount：

```java
[root@server1 secert]# kubectl get sa
NAME      SECRETS   AGE
default   1         11d
[root@server1 secert]# kubectl describe sa default 
Name:                default
Namespace:           default
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   default-token-25448
Tokens:              default-token-25448
Events:              <none>
```

可以看出上述命令输出的secrets和pod内挂载的相同。

实验后删除pod：

```java
[root@server1 secert]# kubectl delete pod test 
pod "test" deleted
```

每个namespace下有一个名为default的默认Service Account对象：

```java
[root@server1 secert]# kubectl get secrets 
NAME                  TYPE                                  DATA   AGE
default-token-25448   kubernetes.io/service-account-token   3      11d
```

Service Account里有一个名为token的里可以作为Volume一样被Mount到Pod里的Secret，当pod启动时这个Secret会被自动挂载到pod的指定目录下，用来协助完成pod中的进程访问API Server时的身份鉴权过程。

## 三、Opaque Secret

Opaque Secret其value为base64加密后的值。

## 用文件创建Secret：

```java
[root@server1 secert]# echo -n 'admin' > ./username.txt
[root@server1 secert]# echo -n 'redhat' > ./password.txt
[root@server1 secert]# cat username.txt 
admin[root@server1 secert]# 
[root@server1 secert]# cat password.txt 
redhat[root@server1 secert]# 
```

创建secret：

```java
[root@server1 secert]# kubectl create secret generic my-secret --from-file=username.txt --from-file=password.txt 
secret/my-secret created
```

上述创建secret的命令中，generic表示通用，my-secret为secret的名称，–from-file= 表示从文件中创建。

查看创建的secret：

```java
[root@server1 secert]# kubectl get secrets 
NAME                  TYPE                                  DATA   AGE
basic-auth            Opaque                                1      3d20h
default-token-25448   kubernetes.io/service-account-token   3      11d
my-secret             Opaque                                2      6s
tls-secret            kubernetes.io/tls                     2      3d20h
查看详细信息：
[root@server1 secert]# kubectl describe secrets my-secret 
Name:         my-secret
Namespace:    default
Labels:       <none>
Annotations:  <none>
Type:  Opaque
Data
====
password.txt:  6 bytes			#可以看出时加密的信息
username.txt:  5 bytes
```

也可以通过输出为yaml格式查看：

```java
[root@server1 secert]# kubectl get secrets my-secret -o yaml
```

上图中的加密信息可以通过以下命令解码：

```java
[root@server1 secert]# echo cmVkaGF0 | base64 -d
redhat[root@server1 secert]# 
```

因此这种方式是一种伪加密的方法。

## 用命令行字面key和value创建

在定义密码信息时，如果密码有特殊字符，则需要使用\ 转义符对其进行转义，比如原密码为A!B\C*D则需要以下方式创建（–from-literal表示通过字符创建）：

```java
[root@server1 secert]# kubectl create secret generic 1-secret --from-literal=username=devuser --from-literal=password=A\!B\\C\*D
secret/1-secret created
[root@server1 secert]# kubectl get secrets
NAME                  TYPE                                  DATA   AGE
1-secret              Opaque                                2      3s
basic-auth            Opaque                                1      3d20h
default-token-25448   kubernetes.io/service-account-token   3      11d
my-secret             Opaque                                2      3m12s
tls-secret            kubernetes.io/tls                     2      3d20h
[root@server1 secert]# kubectl get secrets 1-secret -o yamlapiVersion: v1
```

解码查看原密码：

```java
[root@server1 secert]# echo QSFCXEMqRA== | base64 -d 
A!B\C*D[root@server1 secert]# 
```

## 通过yaml文件创建Secret

注意这里一定要是用base64加密了的值

首先查看用户名和密码的加密字符：

```java
[root@server1 secert]# echo -n 'admin' | base64
YWRtaW4=
[root@server1 secert]# echo -n 'redhat' | base64
cmVkaGF0
```

编辑yaml文件：

```java
[root@server1 secret]# vim secret.yaml
[root@server1 secret]# cat secret.yaml 
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=  		#写文件时信息要求是base64编码过的
  password: cmVkaGF0
```

创建Secret并查看信息：

```java
[root@server1 secret]# kubectl create -f secret.yaml 
secret/mysecret created
[root@server1 secret]# kubectl describe secrets mysecret 
Name:         mysecret
Namespace:    default
Labels:       <none>
Annotations:  <none>
Type:  Opaque
Data
====
password:  6 bytes
username:  5 bytes
```

```java
[root@server1 secret]# kubectl get secrets mysecret -o yaml
```

## 四、secret的使用方法

## 将Secret挂载到Volume中

```java
[root@server1 secret]# vim pod.yaml 
[root@server1 secret]# cat pod.yaml 
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
          mountPath: "/secret"		#挂载路径
          readOnly: true			#默认权限是读写
  volumes:
  - name: secrets
    secret:
      secretName: mysecret
```

创建pod：

```java
[root@server1 secret]# kubectl create -f pod.yaml 
pod/mysecret created
[root@server1 secret]# kubectl get pod
NAME       READY   STATUS    RESTARTS   AGE
mysecret   1/1     Running   0          11s
```

进入容器确认：

```java
[root@server1 secret]# kubectl exec -it mysecret -- bash
root@mysecret:/# cd /secret/
root@mysecret:/secret# ls
\password  username
root@mysecret:/secret# ls
password  username
root@mysecret:/secret# cat password 
redhatroot@mysecret:/secret# 
root@mysecret:/secret# cat username 
adminroot@mysecret:/secret# 
root@mysecret:/secret# exit
```

可以看出信息是mysecret中的信息，key为文件名，vlaue为文件内容。

上面的实验中所有的key和value都被挂载进入了指定目录，我们也可以指定secret中的某一个key挂载：

```java
[root@server1 secret]# vim pod1.yaml 
[root@server1 secret]# cat pod1.yaml 
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
        path: my-group/my-username			#相对路径，绝对路径为/secret/my-group/my-username
[root@server1 secret]# kubectl create -f pod1.yaml 
pod/mysecret created
[root@server1 secret]# kubectl get pod
NAME       READY   STATUS    RESTARTS   AGE
mysecret   1/1     Running   0          8s
```

进入容器查看：

```java
[root@server1 secret]# kubectl exec -it mysecret -- bash
root@mysecret:/# cd /secret/
root@mysecret:/secret# ls
my-group
root@mysecret:/secret# cd my-group
root@mysecret:/secret/my-group# ls
my-username				
root@mysecret:/secret/my-group# cd my-username 
bash: cd: my-username: Not a directory
root@mysecret:/secret/my-group# cat my-username 
adminroot@mysecret:/secret/my-group# 
root@mysecret:/secret/my-group# 
```

可以看出指定的key被挂载到了我们指定的路径。

实验后删除：

```java
[root@server1 secret]# kubectl delete -f pod1.yaml 
pod "mysecret" deleted
```

## 将Secret设置为环境变量

```java
[root@server1 secret]# vim pod2.yaml 
[root@server1 secret]# cat pod2.yaml 
apiVersion: v1
kind: Pod
metadata: 
  name: secret-env
spec:
  containers:
    - name: nginx
      image: nginx
      env:
        - name: SECRET_USERNAME
          valueFrom:
            secretKeyRef:
              name: mysecret
              key: username
        - name: SECRET_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysecret
              key: password
```

可以看出Secret创建env变量和configmap类似。

创建pod：

```java
[root@server1 secret]# kubectl create -f pod2.yaml 
pod/secret-env created
[root@server1 secret]# kubectl get pod
NAME         READY   STATUS    RESTARTS   AGE
secret-env   1/1     Running   0          9s
```

进入容器查看：

```java
[root@server1 secret]# kubectl exec -it secret-env -- bash
```

## 五、kubernetes.io/dockerconfigjson 类型

kubernetes.io/dockerconfigjson用于存储docker registry的认证信息。

在server3退出登陆然后尝试拉取私有仓库镜像：

```java
[root@server3 ~]# docker logout reg.westos.org
Not logged in to reg.westos.org
[root@server3 ~]# docker pull reg.westos.org/cl/ubuntu
Using default tag: latest
Error response from daemon: pull access denied for reg.westos.org/cl/ubuntu, repository does not exist or may require 'docker login': denied: requested access to the resource is denied
```

拉取失败，提示需要登陆才能拉取。

我们现在就来配置认证信息：

编辑pod的创建文件，pod中使用的镜像是私有仓库的镜像。

```java
[root@server1 secret]# vim pod3.yaml 
[root@server1 secret]# cat pod3.yaml 
apiVersion: v1
kind: Pod
metadata: 
  name: mypod
spec:
  containers:
    - name: nginx
      image: reg.westos.org/library/nginx
  imagePullSecrets:
    - name: myregistrykey			#使用的Secret名称
```

之后创建包含认证信息的Secret：

```java
[root@server1 secret]# kubectl create secret docker-registry myregistrykey --docker-username=admin --docker-password=Harbor --docker-server=reg.westos.org --docker-email=xzt@qq.com
secret/myregistrykey created
```

上面的命令中，secret类型为docker-registry，secret名称为myregistrykey，–docker-username表示仓库用户名，–docker-password仓库密码，–docker-server表示仓库服务器地址，–docker-email表示仓库邮箱。查看secret详细信息：

```java
[root@server1 secret]# kubectl get secrets myregistrykey -o yaml
```

之后创建pod：

```java
[root@server1 secret]# kubectl create -f pod3.yaml 
pod/mypod created
[root@server1 secret]# kubectl get pod
NAME    READY   STATUS    RESTARTS   AGE
mypod   1/1     Running   0          4s
```

可以看出pod正常运行。

实验后删除：

```java
[root@server1 secret]# kubectl delete -f pod3.yaml
```
