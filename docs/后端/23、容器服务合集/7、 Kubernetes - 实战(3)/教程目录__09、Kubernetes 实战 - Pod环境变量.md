# 09、Kubernetes 实战 - Pod环境变量
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/9.html
- 分类：容器服务
- 分组：教程目录
## 环境变量

创建pod-env.yaml文件，内容如下

```java
apiVersion: v1
kind: Pod
metadata:
  name: pod-env
  namespace: dev
spec:
  containers:
    - name: nginx
      image: nginx:1.17.1
    - name: busybox
      image: busybox:1.30
      command: ["/bin/sh","-c","touch /tmp/hello.txt;while true;do /bin/echo $(date +%T) >> /tmp/hello.txt; sleep 3; done;"]
      env: 环境变量
        - name: "username"
          value: "admin"
        - name: "pwd"
          value: "123456"
```

env环境变量，用于在pod中的容器设置环境变量

创建pod

```java
kubectl create -f pod-env.yaml
```

#进入容器

```java
kubectl exec -it  pod-env -n dev -c busybox /bin/sh
```

#查看环境变量

```java
echo $username
```
