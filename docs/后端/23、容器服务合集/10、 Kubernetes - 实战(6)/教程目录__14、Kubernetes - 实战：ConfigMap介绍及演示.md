# 14、Kubernetes - 实战：ConfigMap介绍及演示
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/14.html
- 分类：容器服务
- 分组：教程目录
## ConfigMap存在的意义

> ConfigMap 功能在 Kubernetes1.2版本引入，许多应用程序会从配置文件、命令行参数或环境变量中读取配置信息，ConfigMap API 给我们提供了向容器中注入配置信息的机制，ConfigMap 可以用来保存单个属性，也可以用来保存整个配置文件或者JSON二进制大对象

## ConfigMap的创建

I、使用目录创建

```java
## 创建目录
[root@Centos8 k8sYaml]# mkdir dir
[root@Centos8 k8sYaml]# cd dir/
## 创建2个文件，文件内存放值
[root@Centos8 dir]# cat << EOF > game.properties
> enemies=aliens
> lives=3
> enemies.cheat=true
> enemies.cheat.level=noGoodRotten
> secret.code.passphrase=UUDDLRLRBABAS
> secret.code.allowed=true
> secret.code.lives=30
> EOF
[root@Centos8 dir]# cat << EOF > ui.properties
> color.good=purple
> color.bad=yellow
> allow.textmode=true
> how.nice.to.look=fairlyNice
> EOF
[root@Centos8 dir]# ls 
game.properties  ui.properties
## 开始创建ConfigMap
[root@Centos8 dir]# kubectl create configmap game-config --from-file=/root/k8sYaml/dir
configmap/game-config created
### 查看ConfigMap
[root@Centos8 dir]# kubectl get cm
NAME          DATA   AGE
game-config   2      2m19s
[root@Centos8 dir]# kubectl describe cm game-config
Name:         game-config
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
game.properties:
----
enemies=aliens
lives=3
enemies.cheat=true
enemies.cheat.level=noGoodRotten
secret.code.passphrase=UUDDLRLRBABAS
secret.code.allowed=true
secret.code.lives=30
ui.properties:
----
color.good=purple
color.bad=yellow
allow.textmode=true
how.nice.to.look=fairlyNice
Events:  <none>
```

> --from-file= 表示指定该目录下所有的文件都会被用在ConfigMap里创建一个键值对，键的名字就是文件名，值就是文件内容

## II、使用文件名创建

```java
## 创建文件
[root@Centos8 dir]# cat wuzi.examplate 
NAME=wuzi
URL=www.wuzi.com
## 创建ConfigMap
[root@Centos8 dir]# kubectl create cm wuzi.com --from-file=/root/k8sYaml/dir/wuzi.examplate
configmap/wuzi.com created
## 查看cm
[root@Centos8 dir]# kubectl get cm 
NAME          DATA   AGE
game-config   2      7m37s
wuzi.com      1      41s
[root@Centos8 dir]# kubectl describe cm wuzi.com
Name:         wuzi.com
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
wuzi.examplate:
----
NAME=wuzi
URL=www.wuzi.com
Events:  <none>
```

> --from-file 可以重复使用，当重复指定多个文件时，效果与直接指定目录相同

## III、使用字面值创建（直接创建）

> 使用字面值创建使用 --from-literal 参数传递配置信息，该参数可以使用多次，格式如下：

```java
## 创建cm
[root@Centos8 dir]# kubectl create cm spec.examplate --from-literal=spec.how=very --from-literal=spec.type=charm
configmap/spec.examplate created
## 查看cm
[root@Centos8 dir]# kubectl describe cm spec.examplate
Name:         spec.examplate
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
spec.how:
----
very
spec.type:
----
charm
Events:  <none>
## 也可以通过资源清单的方式来创建ConfigMap
vim map.yaml
...
apiVersion: v1
kind: ConfigMap
metadata:
  name: spec-config
  namespace: default
data:
  special.now: 6\.4
  special.time: 12\:00
...
## 查看
[root@Centos8 dir]# kubectl create -f map.yaml 
configmap/spec-config created
[root@Centos8 dir]# kubectl describe cm spec-config
Name:         spec-config
Namespace:    default
Labels:       <none>
Annotations:  <none>
Data
====
special.now:
----
6\.4
special.time:
----
12\:00
Events:  <none>
```

## 创建Pod 测试ConfigMap

I、使用ConfigMap设置环境变量

```java
vim cm-test.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: cm-pod
spec:
  containers:
  - name: cm-container
    image: hub.vfancloud.com/test/myapp:v1
    command: [ "/bin/sh","-c","env" ]
    env: 将名为spec.examplate的ConfigMap中名为spec.how的key的value赋值给环境变量SPEC_LEVEL_KEY
    - name: SPEC_LEVEL_KEY
      valueFrom:
        configMapKeyRef:
          name: spec.examplate
          key: spec.how
    - name: SPEC_TYPE_KEY
      valueFrom:
        configMapKeyRef:
          name: spec.examplate
          key: spec.type
    envFrom: 将名为wizi.com的ConfigMap中定义的所有key:value都导入环境变量
    - configMapRef:
        name: wuzi.com
  restartPolicy: Never
...
## 查看环境变量
[root@Centos8 dir]# kubectl log cm-pod | grep -E "SPEC_LEVEL_KEY|SPEC_TYPE_KEY|NAME|URL"
HOSTNAME=cm-pod
SPEC_LEVEL_KEY=very
wuzi.examplate=NAME=wuzi
URL=www.wuzi.com
SPEC_TYPE_KEY=charm
```

## II、通过数据卷插件使用configMap

```java
vim volum.yaml
...
apiVersion: v1
kind: Pod
metadata:
  name: volum-cm
spec:
  containers:
  - name: volum-ct
    image: hub.vfancloud.com/test/myapp:v1
    volumeMounts:  挂载共享数据卷
    - name: config-volume  要挂载共享数据卷的名字
      mountPath: /etc/config  挂载到指定的目录下
  volumes:  定义共享数据卷
  - name: config-volume  共享数据卷名称
    configMap:
      name: game-config  ConfigMap的名称
#      name: wuzi.com
#      name: spec-config
  restartPolicy: Never
...
[root@Centos8 dir]# kubectl create -f volum.yaml
### 分别以文章开头的第一步创建的ConfigMap类型（目录、文件、键值）三种形式进行试验
## ConfigMap类型为目录的，直接将此目录下的所有文件共享到了container指定目录中
/etc/config ls
game.properties  ui.properties
/etc/config cat game.properties 
enemies=aliens
lives=3
enemies.cheat=true
enemies.cheat.level=noGoodRotten
secret.code.passphrase=UUDDLRLRBABAS
secret.code.allowed=true
secret.code.lives=30
/etc/config cat ui.properties 
color.good=purple
color.bad=yellow
allow.textmode=true
how.nice.to.look=fairlyNice
## ConfigMap类型为文件的，只将此文件共享到了container目录下
/etc/config ls
wuzi.examplate
/etc/config cat wuzi.examplate 
NAME=wuzi
URL=www.wuzi.com
## ConfigMap类型为键值对的，将key保存成了文件名，value保存为文件内容
/etc/config ls
special.now   special.time
/etc/config cat special.time 
12\:00/etc/config 
/etc/config cat special.now 
6\.4/etc/config 
```

## 滚动更新

```java
## 先创建一个索引文件
[root@Centos8 dir]# cat index1.html 
Hello World
## 使用此文件创建ConfigMap
[root@Centos8 dir]# kubectl create cm nginx-cm --from-file=./index1.html
configmap/nginx-cm created
## 创建Deployment
[root@Centos8 dir]# vim nginx-cm.yaml
...
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx-cm
  namespace: default
spec:
  replicas: 3
  template:
    metadata:
      labels:
        run: nginx
    spec:
      containers:
      - name: nginx-cm
        image: hub.vfancloud.com/test/myapp:v1
        ports:
        - containerPort: 80
        volumeMounts:
        - name: config-nginx
          mountPath: /usr/share/nginx/html/config
      volumes:
      - name: config-nginx
        configMap:
          name: nginx-cm
...
kubectl apply -f nginx-cm.yaml
## 测试访问
[root@Centos8 dir]# curl http://10.244.3.170/config/index1.html
Hello World
## 现在创建一个新文件index2.html
[root@Centos8 dir]# cat index2.html 
It is a wonderful world
## 删除ConfigMap重建替换index1.html为index2.html
[root@Centos8 dir]# kubectl delete cm nginx-cm 
configmap "nginx-cm" deleted
[root@Centos8 dir]# kubectl get cm
No resources found.
[root@Centos8 dir]# kubectl create cm nginx-cm --from-file=./index2.html
configmap/nginx-cm created
## 再次测试，滚动更新完成
[root@Centos8 dir]# curl http://10.244.3.170/config/index2.html
It is a wonderful world
```

> 需要等一会才能同步更新，可能10-30s
