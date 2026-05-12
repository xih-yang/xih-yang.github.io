# 06、Kubernetes - 实战：kubectl常用命令总结
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/6.html
- 分类：容器服务
- 分组：教程目录
## kubectl常用命令

## 1、kubectl get 显示资源

```java
## 查看pod列表，若pod后不指定名称空间(namespace),则默认为default名称空间
kubectl get pod 
## 查看当前rc和service信息
kubectl get rc,svc 
## 查看当前deployment
kubectl get deployment
## -n 为指定名称空间(namespace)
kubectl get pod -n kube-system
## -o wide 表示查看pod详细信息，包括ip地址，node节点等
kubectl get pod -o wide 
## -w 表示实时输出pod列表，类似于于tail -f命令名形式
kubectl get pod -o wide -w
## 将此命令的输出结果格式化显示，-o 指定输出格式
kubectl get pod <pod-name> -o yaml
```

## 2、kubectl describe 显示描述

```java
## 查看某个node节点的详细描述
kubectl describe node <node-name>
## 查看某个pod的详细描述,特别是查看 pod 无法创建的时候的日志
kubectl describe pod <pod-name>
```

## 3、kubectl logs 输出容器在pod中的日志

```java
## 查看某pod内的容器日志，-f 为持续输出
kubectl logs -f <pod-name>
## 查看pod内指定的某个容器的日志，-c 指定容器名称
kubectl log <pod-name> -c <container_name>
```

## 4、kubectl create 通过配置文件名或stdin创建一个集群资源对象

```java
## 配置文件支持JSON 与 YAML格式
## 通过文件创建pod，-f 指定文件
kubectl create -f <FILENAME>
## 创建deployment/namespace/service等
kubectl create deployment/namespace/service
## 通过stdin创建一个pod
cat pod.json | kubectl create -f -
## API版本为v1的JSON格式的docker-registry.yaml文件创建资源
kubectl create -f docker-registry.yaml --edit --output-version=v1 -o json
```

## 5、kubectl run 创建并运行指定的镜像

```java
## 语法描述
kubectl run NAME --image=image [--env="key=value"] [--port=port] [--replicas=replicas] [--dry-run=bool] [--overrides=inline-json] [--command] -- [COMMAND] [args...]
## 启动一个nginx实例
## 并暴露端口80(此处仅仅是暴露端口，不同于docker中的-p)若不暴露，也能访问
## 指定副本数为5个，--replicas
kubectl run nginx --image=nginx --port=80 --replicas=5
## 启动hazelcast实例,并设置环境变量
kubectl run hazelcast --image=hazelcast --env="DNS_DOMAIN=cluster" --env="POD_NAMESPACE=default"
```

## 6、kubectl expose 指定deployment、service、rs、replication controller或pod,并将它们暴露为一个新的Kubernetes Service

```java
## 语法
kubectl expose (-f FILENAME | TYPE NAME) [--port=port] [--protocol=TCP|UDP] [--target-port=number-or-name] [--name=name] [--external-ip=external-ip-of-service] [--type=type]
## 为rc的nginx创建service，并通过service的80端口转发至容器的8000端口上
kubectl expose rc nginx --port=80 --target-port=8000
## 为nginx-controller.yaml中所指定的type和name标识的RC创建service
kubectl expose -f nginx-controller.yaml --port=80 --target-port=8000
## 为deployment的nginx-deployment创建service
kubectl expose deployment nginx-deployment --port=20000 --target-port=80
```

## 7、kubectl edit 编辑服务器中的资源

使用命令行工具获取的任何资源都可以使用edit命令编辑。edit命令会打开使用KUBE_EDITOR，GIT_EDITOR 或者EDITOR环境变量定义的编辑器，可以同时编辑多个资源，但所编辑过的资源只会一次性提交。edit除命令参数外还接受文件名形式。

文件默认输出格式为YAML。要以JSON格式编辑，请指定“-o json”选项。

如果在更新资源时报错，将会在磁盘上创建一个临时文件来记录。在更新资源时最常见的错误是几个用户同时使用编辑器更改服务器上资源，发生这种情况，你需要将你的更改应用到最新版本的资源上，或者更新保存的临时副本。

```java
## 语法
kubectl edit (RESOURCE/NAME | -f FILENAME)
## 编辑名为docker-registry的service 
## 或名为nginx的pod 
## 或名为nginx-deployment的svc
kubectl edit svc/docker-registry 
|| pod/nginx 
|| svc/nginx-deployment
##编辑名为“myjob”的service，输出JSON格式 V1 API版本
kubectl edit job.v1.batch/myjob -o json
```

## 8、kubectl delete 通过配置文件名、stdin、资源名称或lable选择器删除资源

```java
## 语法
kubectl delete ([-f FILENAME] | TYPE [(NAME | -l label | --all)])
## 删除所有pod
kubectl delete pods --all
## 删除名为“baz”和“foo”的Pod和Service。
kubectl delete pod,svc baz foo
##删除 Label name = myLabel的pod和Service,-l 指定label
kubectl delete pod,svc -l name=myLabel
## 使用 pod.json中指定的资源类型和名称删除pod
kubectl delete -f ./pod.json
## 根据传入stdin的JSON所指定的类型和名称删除pod
cat pod.json | kubectl delete -f -
```

## 9、kubectl autoscale 自动设置在k8s集群中运行的pod数量(水平自动伸缩)

指定Deployment、ReplicaSet或ReplicationController，并创建已经定义好资源的自动伸缩器。使用自动伸缩器可以根据需要自动增加或减少系统中部署的pod数量。

```java
## 语法
autoscale (-f FILENAME | TYPE NAME | TYPE/NAME) [--min=MINPODS] --max=MAXPODS [--cpu-percent=CPU] [flags]
## 设置名为foo的deployment，使用默认的自动伸缩策略，指定目标cpu使用率，使其pod数量在2-10之间
kubectl autoscale deployment foo --min=2 --max=10
## 设置名为foo的RC，使其pod数量维持在1-5之间，CPU使用率维持在80%
kubectl autoscale rc foo --max=5 --cpu-percent=80
```

**scale 手动指定k8s集群中副本的数量**

```java
## 语法
kubectl scale [--resource-version=version] [--current-replicas=count] --replicas=COUNT (-f FILENAME | TYPE NAME)
## 设置名为foo的deployment的副本数量为5个
kubectl scale --replicas=5 deployment foo
## 将foo.yaml文件中的副本数修改为3
kubectl scale --replicas=3 -f foo.yaml
## 若deployment/mysql的副本数为2，则将它修改为3个
kubectl scale --current-replicas=2 --replicas=3 deployment/mysql
```

## 10、kubectl label 更新(增加、修改或删除)资源上的label标签

label 必须以字母或数字开头，可以使用字母、数字、连字符、点和下划线，最长63个字符。

如果--overwrite 为 true，则可以覆盖已有的 label，否则尝试覆盖 label 将会报错。

如果指定了--resource-version，则更新将使用此资源版本，否则将使用现有的资源版本。

```java
## 语法
## 给名为foo的Pod添加label unhealthy=true。
kubectl label pods foo unhealthy=true
## 给 namespace 中的所有 pod 添加 label
kubectl label pods --all status=unhealthy -n default
## 删除名为“bar”的label （使用“ - ”减号相连）
kubectl label pods foo bar-
```

## 11、kubectl exec 在一个container中执行一个命令

```java
## 语法
kubectl exec -it <pod-name> -c <container-name> -n <namespace> -- shell command
## 创建目录
kubectl exec -it nginx -c nginx-master -n default -- mkdir -p /usr/local/nginx
```

## 12、kubectl cp 拷贝文件或目录

```java
## 语法
kubectl cp /path/filename |namespace|/|pod-name|/:/container_path/
或
kubectl cp |namespace|/|pod-name|:/container_path/ /path/
```

参考资料链接：http://docs.kubernetes.org.cn/475.html
