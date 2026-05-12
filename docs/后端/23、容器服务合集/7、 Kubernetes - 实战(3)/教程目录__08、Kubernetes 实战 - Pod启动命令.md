# 08、Kubernetes 实战 - Pod启动命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/8.html
- 分类：容器服务
- 分组：教程目录
## 前言

Podcommand

## 启动命令

在前面的案例中， 一直有一个问题没解决，就是busybox容器一直没有成功运行，那么到底是什么原因导致这个容器故障呢？

原来busybox并不是一个程序，而是类似于一个工具类的集合，kubernetes集群启动管理后，它会自动关闭。解决的办法就是让它一直运行，这就需要使用到command配置。

创建pod-command.yaml文件，内容如下

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-command
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
    - name: busybox
      image: busybox:1.30
      command: ["/bin/sh","-c","touch /tmp/hello.txt;while true;do /bin/echo $(date +%T) >> /tmp/hello.txt; sleep 3; done;"]
```

command，用于在pod中的容器初始化完毕之后运行一个命令。

> 解释
>
> “/bin/sh”,“-c” 使用sh执行命令
>
> touch /tmp/hello.txt 创建一个hello.txt
>
> while true;do /bin/echo $(date +%T) >> /tmp/hello.txt; sleep 3; done; 每间隔3秒向文件中写入当前时间

运行这个pod，可以看到两个容器都在运行了。

```java
#进入到容器中
kubectl exec pod-command -n dev -it -c busybox /bin/sh
#动态查看hello.txt
tail -f /tmp/hello.txt
```

> 补充说明
>
> 通过上面发现command 已经可以完成启动命令和传递参数的功能，为什么还要提供一个args选项，用于传递参数？
>
> 这其实和docker有关系，kubernetes中的command，args两项其实是为了覆盖Dockerfile中ENTRYPOINT的功能
>
> 1如果command和args均没有写，那么用Dockerfile的配置
>
> 2如果command写了，但args没有写，那么Dockerfile默认的配置会被忽略，执行输入的command
>
> 3如果command没写，但args写了，那么Dockerfile中配置的ENTRYPOINT的命令会被执行，使用当前args的参数
>
> 4如果command和args都写了，那么Dockerfile的配置被忽略，执行command并追加上args参数
