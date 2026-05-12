# 26、Kubernetes - 实战：k8s pod挂载hostPath执行写时报错Permission denied
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/26.html
- 分类：容器服务
- 分组：教程目录
## 关于hostPath的权限说明

最近项目中经常遇到pod中container挂载主机hostPath报错无权限问题：

```java
httpd@hostpath-volume:/test-volume$ touch  123
touch: cannot touch '123': Permission denied
```

于是又复习了一遍hostPath使用方法，发现没有什么新知识的涌入：

值
行为

空字符串(默认)用于向后兼容，这意味着在挂载hostPath卷之前不会进行任何检查

DirectoryOrCreate
如果给定的路径没有任何东西存在，那将根据需要在此创建一个空目录，权限设置为0755，与kubelet拥有相同的用户与组

Directory
指定路径下必须存在此目录

FileOrCreate
如果给定的路径没有任何东西存在，那将根据需要在此创建一个空文件，权限设置为0644，与kubelet拥有相同的用户与组

File
给定的路径下必须存在文件

Socket
给定的路径下必须存在Unix套接字

CharDevice
给定的路径下必须存在字符设备

BlockDevice
给定的路径下必须存在块设备

使用这种卷类型时请注意：

- 由于每个节点上的文件不同，具有相同配置(例如从 podTemplate创建的)的pod在不同节点上的行为可能会有所不同
- 当Kubernetes按照计划添加资源感知调度时，将无法考虑hostPath使用的资源
- 在底层主机上创建的文件或目录只能由root写入。必须在特权容器中以root身份运行进程，或修改主机上文件权限以便写入 hostPath 卷

### 注意几个话术

**1、** 当值为DirectoryOrCreate和FileOrCreate时，并且给定的路径或文件不存在时，kubelet会自动创建，并且会和kubelet拥有相同的用户与组，说白了，就是你用什么用户起的kubelet创建出来的就是此用户的属主数组；

**2、** 必须在特权容器中以root身份运行进程，或修改主机上文件权限以便写入hostPath卷如果你的容器不是以root用户运行的，这一点可要注意了；

### 问题的根源

查看发现，容器挂载hostPath写入时报错Permission denied时基本都是容器运行用户不是root的情况下，这就说明，启动容器的用户没有权限在宿主机中属主属组为root的目录或者文件中写入。

这就很清晰明了，只要赋予运行容器的用户写权限，这个问题就解决了。

可是，我们应该赋予哪个用户呢？在宿主机创建一个与启动容器相同的用户然后赋予权限吗？显然不行。

那么容器用户与宿主机用户的对应关系是什么呢？没错，是uid。

只要将宿主机的用户与启动容器用户的uid相对应上，并且给它写的权限，那这个问题就迎刃而解了。

### 做几个测试

## 1、 先创建一个普通用户起的container；

```java
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-volume
  namespace: default
spec:
  containers:
  - name: hostpath-container
    image: nginx-test:v1
    imagePullPolicy: IfNotPresent
    volumeMounts:
    - mountPath: /test-volume
      name: dir-volume
  volumes:
  - name: dir-volume
    hostPath:
      path: /data/vfan/test/
      type: DirectoryOrCreate
```

## 2、 创建这个pod，测试写入；

```java
## 
kubectl create -f hostpath-test.yaml 
##
httpd@hostpath-volume:/$ cd /test-volume/
httpd@hostpath-volume:/test-volume$ touch 11 22 33
touch: cannot touch '11': Permission denied
touch: cannot touch '22': Permission denied
touch: cannot touch '33': Permission denied
```

## 3、 查看宿主机相对应目录的权限；

```java
# ll -dh /data/vfan/test/
drwxr-xr-x 2 root root 4.0K Mar 21 14:53 /data/vfan/test/
```

## 4、 查看容器内用户的uid，并查看宿主机的此uid用户是谁；

```java
## 容器内
httpd@hostpath-volume:/test-volume$ id
uid=1000(httpd) gid=1000(httpd) groups=1000(httpd)
## 容器外
# grep 1000 /etc/passwd
work:x:1000:1000::/home/work:/bin/bash
```

> 如果没有相同uid的用户，则创建一个对应用户即可：useradd -u 1000 xxx

## 5、 赋予宿主机对应uid用户权限，再次测试；

```java
## 宿主机
chown work:work test/
## 容器内
httpd@hostpath-volume:/test-volume$ touch 11 22 33
httpd@hostpath-volume:/test-volume$ ls
11  22	33
```

## 6、 容器内外权限分别是什么？；

```java
## 容器内
httpd@hostpath-volume:/test-volume$ ls -ld /test-volume/
drwxr-xr-x 2 httpd httpd 4096 Mar 21 07:27 /test-volume/
## 容器外
[root@gzbh-intel002.gom vfan]# ll -dh /data/vfan/test/
drwxr-xr-x 2 work work 4.0K Mar 21 15:27 /data/vfan/test/
```
