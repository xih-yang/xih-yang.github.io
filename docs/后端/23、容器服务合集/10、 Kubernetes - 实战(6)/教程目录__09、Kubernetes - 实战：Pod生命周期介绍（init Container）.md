# 09、Kubernetes - 实战：Pod生命周期介绍（init Container）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/9.html
- 分类：容器服务
- 分组：教程目录
## Pod生命周期

**生命周期**

**1、** APIserver调用kubelet下达Pod创建指令；

**2、** 容器环境初始化；

**3、** 进入Pod生命周期内（Pod开始创建）；

**4、** Pod只要创建，就会自动生成一个pause容器，用于共享网络，共享存储；

**5、** initC(initContainer)初始化容器；

init C仅仅负责初始化，初始化完毕后，init 容器会自动销毁

init C不能并列进行，每个init C必须在下一个init C启动前完成

如果Pod的init C失败，k8s会不断重启Pod，直到init C成功为止，除非设置Pod的restartPolicy为Never

**6、** 开始执行MainC（主容器）；

主容器运行时会进行一个START（一进入容器就运行的指令）和STOP（退出容器前运行的指令）操作

**7、** readiness就绪检测（探测），可以设置探测间隔时间；

**8、** Liveness生存检测，主要检测容器内是否可以正常提供服务，若不能则进行一系列操作；

## Init C示例

优势：

（1）它们可以包含并运行实用工具，但是出于安全考虑，是不建议在应用程序容器镜像中包含这些实用工具的

（2）它们可以包含使用工具和定制化代码来安装，但是不能出现在应用程序镜像中。例如，创建镜像没必要FROM另一个镜像，只需要在安装过程中使用类似sed、 awk、python或dig这样的工具。

（3）应用程序镜像可 以分离出创建和部署的角色，而没有 必要联合它们构建一个单独的镜像。

（4）Init容器使用Linux Namespace, 所以相对应用程序容器来说具有不同的文件系统视图。因此，它们能够具有访问Secret 的权限，而应用程序容器则不能。

（5）它们必须在应用程序 容器启动之前运行完成， 而应用程序容器是并行运行的， 所以Init容器能够提供了-种简单的阻塞或延迟应用容器的启动的方法，直到满足了一组先决条件。

测试：

```java
## 编辑Pod资源清单
vim initc.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
    version: v1
spec:
  containers:
  - name: myapp-container
    image: busybox:v1
    command: ['sh','-c','echo The app is running! && sleep 3600']
    imagePullPolicy: IfNotPresent
  initContainers:
  - name: init-myapp
    image: busybox:v1
    command: ['sh','-c','until cat /root/myapp;do echo /root/myapp no such file or directory!;sleep 2;done']
    imagePullPolicy: IfNotPresent
  - name: init-mydb
    image: busybox:v1
    command: ['sh','-c','until cat /root/mydb;do echo /root/mydb no such file or directory!;sleep 2;done']
    imagePullPolicy: IfNotPresent
...
## 以initc.yaml创建Pod
[root@Centos8 ~]# kubectl create -f initc.yaml 
pod/myapp-pod created
[root@Centos8 ~]# kubectl get pod  查看发现，STATUS为init未完成
NAME        READY   STATUS     RESTARTS   AGE
myapp-pod   0/1     Init:0/2   0          3m26s
## 查看Pod描述
[root@Centos8 ~]# kubectl describe pod myapp-pod
## 查看init C的Pod日志，可以看到init C没有执行成功，myservice无法解析
[root@Centos8 k8sYaml]# kubectl  log  myapp-pod -c init-myapp
log is DEPRECATED and will be removed in a future version. Use logs instead.
cat: can't open '/root/myapp': No such file or directory
/root/myapp no such file or directory!
/root/myapp no such file or directory!
cat: can't open '/root/myapp': No such file or directory
cat: can't open '/root/myapp': No such file or directory
/root/myapp no such file or directory!
cat: can't open '/root/myapp': No such file or directory
/root/myapp no such file or directory!
## 创建 myapp 文件，创建完毕后可发现，Init已经成功了一个
[root@Centos8 k8sYaml]# kubectl exec -it myapp-pod -c init-myapp -- touch /root/myapp
[root@Centos8 k8sYaml]# kubectl get pod 
NAME        READY   STATUS     RESTARTS   AGE
myapp-pod   0/1     Init:1/2   0          5m19s
## 创建 mydb 文件，两个init全部完成，Pod正常运行
[root@Centos8 k8sYaml]# kubectl exec -it myapp-pod -c init-mydb -- touch /root/mydb
[root@Centos8 k8sYaml]# kubectl get pod 
NAME        READY   STATUS    RESTARTS   AGE
myapp-pod   1/1     Running   0          7m50s
## 只要Iint C初始化完毕，此容器立刻就会消失
```

## Init C特殊说明

如果Pod重启，所有的Init C将会重新执行

在Pod启动过程中，Init C会按顺序在网络和数据卷(pause容器)初始化之后启动，每个容器必须在下一个容器启动之前退出

如果由于运行时或失败退出，将导致容器启动失败，它会根据Pod的restartPolicy指定的策略进行重试，然而，如果Pod的restartPolicy设置为Always，Init 容器失败时会使用RestartPolicy策略

在所有的Init C没有成功之前，Pod将不会变成Ready状态，Init C的端口将不会再service中进行聚集。正在初始化中的Pod处于Pending状态，但应该会将Initializing状态设置为true

对Init C中spec的修改被限制在容器image字段，修改其他字段不会生效，更改image字段等同于重启该Pod
