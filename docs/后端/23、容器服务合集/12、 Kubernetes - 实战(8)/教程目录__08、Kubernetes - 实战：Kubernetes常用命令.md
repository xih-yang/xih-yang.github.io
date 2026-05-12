# 08、Kubernetes - 实战：Kubernetes常用命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/8/8.html
- 分类：容器服务
- 分组：教程目录
## 一、Kubernetes常用命令

## 增

```java
# 通过文件名或标准输入创建资源。
kubectl create
# 读取指定文件内容，进行创建。(配置文件可指定json，yaml文件)。
kubectl create -f 配置文件
# 创建指定文件内容，创建并指定服务版本。(配置文件可指定json，yaml文件)。
kubectl create -f 配置文件 --edit --output-version=版本号 -o json
# 将一个资源公开为一个新的Kubernetes服务，暴露服务。
kubectl expose
# 创建Kubernetes 资源类型，并添加暴露端口。
kubectl expose 资源类型 资源名称 --port=暴露端口 --target-port=容器端口
# 创建Kubernetes service 服务，并添加暴露端口。
kubectl expose service 资源名称 --port=暴露端口 --target-port=容器端口 --name=创建服务名称
# 创建Kubernetes ，并添加UDP暴露端口,使用默认容器端口。
kubectl expose 资源类型 资源名称 --port=暴露端口 --protocol=udp --name=创建服务名称
# 创建Kubernetes服务，根据yaml文件，并添加暴露端口。(配置文件可指定json，yaml文件)。
kubectl expose -f 配置文件 --port=暴露端口 --target-port=容器端口
# 创建并运行一个特定的镜像，可能是副本。创建一个deployment或job管理创建的容器。
kubectl run
# 创建一个镜像，运行。
kubectl run 容器名 --image=镜像名
# 创建一个镜像，运行。并启用暴露端口。
kubectl run 容器名 --image=镜像名 --port=暴露端口
# 创建一个镜像，运行。并引入变量。
kubectl run 容器名 --image=镜像名 --env=“变量”
# 创建一个镜像，运行。并引入标签。
kubectl run 容器名 --image=镜像名 --labels="key=value,env=prod"
# 创建一个镜像，运行。并设置副本数。默认1。
kubectl run 容器名 --image=镜像名 --replicas=副本数
# 创建一个镜像，运行。并添加-i-t访问容器终端。并设置重启策略（Never不重启）。
kubectl run -i -t 容器名 --image=镜像名 --restart=重启策略
# 创建一个镜像，运行。并指定容器内执行指定命令。
kubectl run 容器名 --image=镜像名 --command -- 指定命令
```

## 删

```java
# 通过文件名、标准输入、资源名称或标签选择器来删除资源
kubectl delete
# 删除指定资源。
kubectl delete 资源类型 资源名
# 删除所有指定资源。
kubectl delete 资源类型 -all
# 通过指定文件删除指定资源。（配置文件.json .yaml）
kubectl delete -f 配置文件
# 维护期间排除容器名
kubectl drain
# 排除指定容器名。
kubectl drain 容器名
```

## 改

```java
# 配置应用资源。修改现有应用程序资源。
kubectl set
# 更新pod内的环境变量。
kubectl set env 资源类型 资源名称 添加变量=值
# 更新pod镜像。
kubectl set image 资源类型 资源名称 容器名=升级镜像版本
kubectl set images deploy nginx nginx=nginx:1.15.3 --record
kubectl rollout pause deployment nginx   暂停滚动更新
kubectl rollout status deploy nginx
# 更新pod内的资源。
kubectl set resources 资源类型 资源名称 [请求——限制= & =请求][选项]
# 通过配置文件更新pod内的资源。（配置文件.json .yaml）
kubectl set resources -f 配置文件
# 使用默认的编辑器编辑一个资源。
kubectl edit
# 动态更新服务配置参数。
kubectl edit 资源类型 资源名称
# 管理资源的发布。
kubectl rollout
# 回滚到上一个版本。
kubectl rollout undo 资源类型 资源名称
# 指定版本回滚。
kubectl rollout undo 资源类型 资源名称 --to-revision=3
# 查看当前的资源状态。
kubectl rollout status 资源类型 资源名称
kubectl rollout status deployment nginx   示例
# 查看历史修订版本
kubectl rollout history 资源类型 资源名称
kubectl rollout histouy deployment nginx   示例
# 查看指定历史修订版本
kubectl rollout history 资源类型 资源名称 --revision=版本数
# 执行指定复制控制的滚动更新。
kubectl rolling-update
# 滚动更新v1版本，通过json配置文件跟新到v2版本。
kubectl rolling-update 服务名称-v1 -f 服务名称-v2.json
# 滚动更新v1版本，到v2，并指定更新镜像。
kubectl rolling-update 服务名称-v1 服务名称-v2 --image=image:v2
# 扩容或缩容Pod数量，Deployment、ReplicaSet、RC或Job
kubectl scale
# 扩容缩容副本数。
kubectl scale --replicas=副本数 资源类型 资源名称
kubectl scale --replicas=3 deployment nginx   示例
# 扩容缩容副本数。对多个资源扩容。
kubectl scale --replicas=副本数 资源类型/资源名称1 资源类型/资源名称2
# 扩容缩容副本数。如果当前副本数为N个就扩容为Y个。
kubectl scale --current-replicas=副本数N --replicas=副本数Y 资源类型 资源名称
# 创建一个自动选择扩容或缩容并设置Pod数量
kubectl autoscale
# 设置该资源类型的副本数自动扩容到相关值
kubectl autoscale 资源类型 资源名称 --min=最小值 --max=最大值
# 设置该资源类型的副本数自动扩容到相关值。并根据CPU阈值扩容缩容。
kubectl autoscale 资源类型 资源名称 --max=最大值 --最小值 --cpu-percent=80
# 修改证书资源。
kubectl certificate
# 标记节点不可调度
kubectl cordon
# 标记指定节点不可调度
kubectl cordon 节点名
# 标记节点可调度
kubectl uncordon
# 标记指定节点可调度
kubectl uncordon 节点名
# 更新一个或多个节点上的nodes。
kubectl taint
# 执行命令到容器。
kubectl exec
# 执行指定命令到容器中。
kubectl exec 容器名 命令
# 分配伪终端已宿主级向容器添加命令。
kubectl exec 容器名 -- bash -c “命令”
# 进入指定节点容器内。
kubectl exec 容器名 -it bash
# 转发一个或多个本地端口到一个pod。
kubectl port-forward
# 将宿主级端口转发到容器中。
kubectl port-forward 容器名 宿主级端口:容器端口
# 为kubernetes API Server启动服务代理
kubectl proxy
# 拷贝文件或目录到容器中。
kubectl cp
# 附加到一个进程到一个已经运行的容器。
kubectl attach
# 进入到一个运行的容器终端。
kubectl attach 容器名
# 通过文件名或标准输入对资源应用配置
kubectl apply
# 更新部署配置文件信息（配置文件格式.json .yaml）
kubectl apply -f 配置文件
# 使用补丁修改、更新资源的字段。
kubectl patch
# 通过文件名或标准输入替换一个资源。
kubectl replace
# 重新创建配置文件内的资源 。配置文件可是（.yaml、.json）
kubectl replace -f 配置文件 --force
# 不同的API版本之间转换配置文件。YAML和JSON格式都接受。
kubectl convert
# 更新资源上的标签
kubectl label
# 在一个或多个资源上更新注释。
kubectl annotate
# 修改kubeconfig文件（用于访问API，比如配置认证信息）
kubectl config
```

## 查

```java
# 显示一个或多个资源
kubectl get
# 查看组件运行状态
kubectl get componentstatus
# 查看节点加入信息
kubectl get node
# 查看所有资源
kubectl get all
# 查看pods状态
kubectl get pods
# 查看pods及运行节点位置，查看更多信息
kubectl get pods -o wide
# 查看pods下其他命名空间(kube-system等)
kubectl get pods -n 命名空间
# 查看endpoints节点
kubectl get endpoints
# 查看sservice暴露宿主级访问地址描述信息
kubectl get service
# 根据标签查找资源描述信息。--output=wide查看更多信息。
kubectl get 资源类型 --selector="key=value" --output=wide
# 查看资源所有标签
kubectl get 资源类型 --show-labels
# 根据标签查看资源
kubectl get 资源类型 -l app=example
# 查看指定命名空间的资源
kubectl get 资源类型 --namespace=kube-system
# 查看命名空间
kubectl get ns
# 文档参考资料，可查看yaml文件字段指令含义。
kubectl explain
# 获得资源的特定字段的文档
kubectl explain pods.spec.containers
# 获得资源及其字段的文档
kubectl explain pods
# 显示集群信息
kubectl cluster-info
# 显示详细集群信息
kubectl cluster-info dump
# 显示资源（CPU/Memory/Storage）使用。需要Heapster运行。
kubectl top
# 显示特定资源或资源组的详细信。
kubectl describe
# 查看资源详细信息
kubectl describe 资源类型 资源名称
# 指定标签。详细信息。
kubectl describe 资源类型 -l name=标签名
# 查看node资源使用详情信息
kubectl describe nodes NodeIP
# 在od或指定的资源中容器打印日志。如果od只有一个容器，容器名称是可选的。
kubectl logs
# 查看指定节点服务日志。
kubectl logs 容器名
# 查看指定容器日志。
kubectl logs pod 节点名 -c 容器名
# 查看指定容器日志。实时查看。
kubectl logs pod 容器名 -f
# 通过标签查看容器日志
kubectl logs -l key=value
```

## 其他

```java
# 检查认证授权
kubectl auth
用于实现kubectl工具自动补全
kubectl completion
# 执行实现自动补全动作
source <(kubectl completion bash)
# 打印受支持的API版本
kubectl api-versions
# 所有命令帮助。
kubectl help
# 运行一个命令行插件。
kubectl plugin
# 打印客户端和服务版本信息
kubectl version
# 查看使用yaml文件创建
kubectl create serviceaccount resourcee-name --dry-run=client -oyaml
# 使用systemd管理kubelet日志
journalctl -u kubelet
# 查看容器日志
kubectl logs kube-proxy-btz4o -n kube-system
# 查看系统日志
/var/lib/message
```

## 标签管理

```java
# 添加变迁
kubectl label pod kubia-dmdck type=special
# 显示pod标签
kubectl get pod --show-labels
# 修改pod标签
kubectl label pod kubia-dmdck app=foo --overwrite
--overwrite参数是必须的，否者kubectl将只打印告警，并不会修改标签
# 显示指定标签的pod
kubectl get pods -L app,env
使用-L app选项在列中显示app标签
# 使用标签工作节点
kubectl label nodes gke-kubia-85f7-node-0rzx gpu=true
kubectl get node gpu=true
```
