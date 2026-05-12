# 19、Kubernetes - 实战：Kubernetes资源管理ConfigMap
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/19.html
- 分类：容器服务
- 分组：教程目录
中文文档：[https://kubernetes.io/zh/docs/tasks/configure-pod-container/configure-pod-configmap/](https://kubernetes.io/zh/docs/tasks/configure-pod-container/configure-pod-configmap/)

与Secret类似，区别在于ConfigMap保存的是不需要加密配置信息。

可以使用 kubectl create configmap 命令基于 目录、文件 或者字面值来创建 ConfigMap。

```java
kubectl create configmap <map-name> <data-source>
```

可以使用kubectl describe 或者 kubectl get 获取有关 ConfigMap 的信息。

## 应用场景：应用配置

## 一、创建测试配置文件（基于文件创建configmap）

### 1、创建测试配置文件

```java
vim redis.properties
redis.host=127.0.0.1
redis.port=6379
redis.password=123456
```

### 2、通过命令创建引用配置文件

```java
kubectl create configmap redis-config --from-file=./redis.properties
```

### 3、查看创建的配置文件

```java
kubectl get cm
NAME DATA AGE
redis-config 1 8s
```

### 4、查看详细信息

```java
kubectl describe cm redis-config
Name: redis-config
Namespace: default
Labels: <none>
Annotations: <none>
Data
====
redis.properties:
----
redis.host=127.0.0.1
redis.port=6379
redis.password=123456
Events: <none>
```

## 二、通过volume导入方式

### 1、创建yaml文件

```java
vim cm.yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
    - name: busybox
      image: busybox
      command: [ "/bin/sh","-c","cat /etc/config/redis.properties" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      指定保存的配置文件
      configMap:
        配置文件名称
        name: redis-config
  restartPolicy: Never
```

### 2、创建容器

```java
kubectl create -f cm.yaml
```

### 3、查看结果

```java
kubectl logs mypod
redis.host=127.0.0.1
redis.port=6379
redis.password=123456
```

## 三、通过变量名方式

### 1、创建yaml文件

```java
vim myconfig.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  指定命名空间
  name: myconfig
  namespace: default
# 指定level type
data:
  指定变量 value则是配置文件的配置
  special.level: info
  special.type: hello
```

### 2、创建容器

```java
kubectl create -f myconfig.yaml
```

### 3、查看创建

```java
kubectl get cm
NAME DATA AGE
myconfig 2 23s
redis-config 1 11m
```

### 4、创建pod yaml

```java
vim config-var.yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
    - name: busybox
      image: busybox
      command: [ "/bin/sh", "-c", "echo $(LEVEL) $(TYPE)" ]
      env:
        - name: LEVEL
          valueFrom:
            通过key加载配置文件
            configMapKeyRef:
              使用的key
              name: myconfig
              key: special.level
        - name: TYPE
          valueFrom:
            configMapKeyRef:
              使用的type
              name: myconfig
              key: special.type
  restartPolicy: Never
```

### 5、查看验证

```java
kubectl logs mypod
info hello
```

## 四、基于目录创建configmap

```java
# 创建本地目录
mkdir -p configure-pod-container/configmap/
# 将实例文件下载到 configure-pod-container/configmap/ 目录
wget https://kubernetes.io/examples/configmap/game.properties -O configure-pod-container/configmap/game.properties
wget https://kubernetes.io/examples/configmap/ui.properties -O configure-pod-container/configmap/ui.properties
# 创建 configmap
kubectl create configmap game-config --from-file=configure-pod-container/configmap/
# 查看configmap信息
kubectl describe configmaps game-config
# 以yaml文件方式查看configmap信息
kubectl get configmaps game-config -o yaml
```

```java
K8S1.19版本之后可以设置Configmap和Secret配置不可变只需要在最后加参数：（immutable: true）即可实现。
```
