# 22、Kubernetes - 实战：Helm（本地helm仓库搭建，构建自己Helm Chart，本地仓库中应用部署））
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/5/22.html
- 分类：容器服务
- 分组：教程目录
## 一、创建helm chart

可以使用以下命令来创建一个名为mychart 的 helm chart：

```java
[root@server1 helm]# helm create mychart
Creating mychart
```

创建后会在目录创建一个mychart目录：

```java
[root@server1 helm]# ls
mychart  redis-ha
[root@server1 helm]# tree mychart/		#查看结构
mychart/
├── charts
├── Chart.yaml
├── templates
│   ├── deployment.yaml
│   ├── _helpers.tpl
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── NOTES.txt
│   ├── serviceaccount.yaml
│   ├── service.yaml
│   └── tests
│       └── test-connection.yaml
└── values.yaml
```

其中mychart目录下的templates目录中保存有部署的模板文件，values.yaml中定义了部署的变量，Chart.yaml文件包含有version（chart版本）和appVersion（包含应用的版本）。

现在我们来更改变量文件values.yaml：

```java
[root@server1 mychart]# vim values.yaml 
```

选择镜像及标签和副本数（这里设置1个）。

编辑完成后检查依赖和模板配置是否正确:

```java
[root@server1 mychart]# helm lint .
==> Linting .
[INFO] Chart.yaml: icon is recommended
1 chart(s) linted, 0 chart(s) failed
```

将应用打包：

```java
[root@server1 mychart]# cd ..
[root@server1 helm]# helm package mychart/
Successfully packaged chart and saved it to: /root/helm/mychart-0.1.0.tgz
```

打包后会在当前目录下生成一个名为mychart-0.1.0.tgz压缩包：

```java
[root@server1 helm]# ls
mychart  mychart-0.1.0.tgz  redis-ha  
```

其中0.1.0为在Chart.yaml文件中定义的version（chart版本）信息。

## 二、构建本地chart仓库

helm v3 需要外部仓库软件的支持，我们这里使用以前部署的harbor仓库（新版本的harbor仓库支持helm chart库）。

部署好之后需要在harbor创建一个公有项目来存放chart：

可以看出现在仓库还没有chart。

将仓库添加到helm：

```java
[root@server1 helm]# helm repo add mychart https://reg.westos.org/chartrepo/charts
Error: looks like "https://reg.westos.org/chartrepo/charts" is not a valid chart repository or cannot be reached: Get https://reg.westos.org/chartrepo/charts/index.yaml: x509: certificate signed by unknown authority
```

可以看出报错是缺少证书，可以将证书复制到redhat的全局证书地址：

```java
[root@server1 helm]# cd /etc/docker/certs.d/reg.westos.org/
[root@server1 reg.westos.org]# ls
ca.crt
[root@server1 reg.westos.org]# cp ca.crt /etc/pki/ca-trust/source/anchors/
[root@server1 reg.westos.org]# update-ca-trust 		#更新证书
```

再次添加：

```java
[root@server1 reg.westos.org]# helm repo add mychart https://reg.westos.org/chartrepo/charts
"mychart" has been added to your repositories
```

添加成功，查看仓库：

```java
[root@server1 reg.westos.org]# helm repo list
NAME   	URL                                      
stable 	http://mirror.azure.cn/kubernetes/charts/
mychart	https://reg.westos.org/chartrepo/charts
```

## 三、安装push插件

将chart push到helm仓库需要push插件，这个插件有两种安装方式：

在线安装：

```java
 helm plugin install https://github.com/chartmuseum/helm-push	//在线安装，注意需要先安装git
```

在线安装比较慢，也可以使用离线安装的方式：

```java
[root@server1 ~]# helm env		//获取插件目录
HELM_BIN="helm"
HELM_DEBUG="false"
HELM_KUBEAPISERVER=""
HELM_KUBECONTEXT=""
HELM_KUBETOKEN=""
HELM_NAMESPACE="default"
HELM_PLUGINS="/root/.local/share/helm/plugins"		#插件目录
HELM_REGISTRY_CONFIG="/root/.config/helm/registry.json"
HELM_REPOSITORY_CACHE="/root/.cache/helm/repository"
HELM_REPOSITORY_CONFIG="/root/.config/helm/repositories.yaml"
[root@server1 ~]# mkdir -p /root/.local/share/helm/plugins/helm-push				#创建插件目录
```

加压插件的安装包到插件目录：

```java
[root@server1 ~]# tar zxf helm-push_0.8.1_linux_amd64.tar.gz -C /root/.local/share/helm/plugins/helm-push
[root@server1 ~]# cd /root/.local/share/helm/plugins/helm-push
[root@server1 helm-push]# ls
bin  LICENSE  plugin.yaml
[root@server1 helm-push]# helm push --help		#测试插件是否安装成功
```

现在可以进行push：

```java
[root@server1 helm-push]# cd /root/helm/
[root@server1 helm]# helm push mychart-0.1.0.tgz mychart -u admin -p Harbor12345
Pushing mychart-0.1.0.tgz to mychart...
Done.
```

push成功，其中的用户名和密码为harbor仓库的用户和密码。

现在在harbor仓库可以看到上传的chart：

在本地还需要更新才可以查找到：

```java
[root@server1 helm]# helm repo update 
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "mychart" chart repository
...Successfully got an update from the "stable" chart repository
Update Complete. ⎈ Happy Helming!⎈ 
[root@server1 helm]# 
[root@server1 helm]# helm search repo mychart
NAME           	CHART VERSION	APP VERSION	DESCRIPTION                
mychart/mychart	0.1.0        	1.16.0     	A Helm chart for Kubernetes
```

## 四、部署应用

## 部署mychart应用到k8s集群

查看部署参数：

```java
[root@server1 helm]# helm  show values  mychart/mychart
affinity: {
     }
autoscaling:
  enabled: false
  maxReplicas: 100
  minReplicas: 1
  targetCPUUtilizationPercentage: 80
fullnameOverride: ""
image:
  pullPolicy: IfNotPresent
  repository: myapp
  tag: v1
imagePullSecrets: []
ingress:
  annotations: {
     }
  enabled: false
  hosts:
  - host: chart-example.local
    paths: []
  tls: []
nameOverride: ""
nodeSelector: {
     }
podAnnotations: {
     }
podSecurityContext: {
     }
replicaCount: 1
resources: {
     }
securityContext: {
     }
service:
  port: 80
  type: ClusterIP
serviceAccount:
  annotations: {
     }
  create: true
  name: ""
tolerations: []
```

部署：

```java
[root@server1 helm]# helm install test mychart/mychart 
```

其中test为自己起的应用名称，mychart/mychart 为仓库名和chart名称，也可以加–dry-run表示做调试，–debug表示输出部署过程。

部署完成后查看：

```java
[root@server1 helm]# helm list 
NAME	NAMESPACE	REVISION	UPDATED                                	STATUS  	CHART        	APP VERSION
test	default  	1       	2020-05-12 23:07:15.122064081 +0800 CST	deployed	mychart-0.1.0	1.16.0     
```

## 更新版本

更新之前查看：

```java
[root@server1 helm]# kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
nfs-client-provisioner-6b66ddf664-4htcz   1/1     Running   0          41m
test-mychart-7d7557d49b-vx7zw             1/1     Running   0          2m16s
[root@server1 helm]# kubectl get pod -o wide
NAME                                      READY   STATUS    RESTARTS   AGE     IP             NODE      NOMINATED NODE   READINESS GATES
nfs-client-provisioner-6b66ddf664-4htcz   1/1     Running   0          41m     10.244.2.112   server3   <none>           <none>
test-mychart-7d7557d49b-vx7zw             1/1     Running   0          2m20s   10.244.1.130   server2   <none>           <none>
[root@server1 helm]# 
[root@server1 helm]# curl 10.244.1.130
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

可以看出myapp的版本是v1

更改Chart.yaml文件更改版本号为0.2.0：

```java
[root@server1 helm]# vim mychart/Chart.yaml
```

更改变量文件values.yaml 更改镜像版本为v2：

```java
[root@server1 helm]# vim mychart/values.yaml 
```

打包：

```java
[root@server1 helm]# helm package mychart
Successfully packaged chart and saved it to: /root/helm/mychart-0.2.0.tgz
[root@server1 helm]# ls
mychart  mychart-0.1.0.tgz  mychart-0.2.0.tgz  redis-ha
```

可以看出自动根据版本文件中的信息打包了0.2.0的压缩包，接下来进行push：

```java
[root@server1 helm]# helm push mychart-0.2.0.tgz mychart -u admin -p Harbor12345
Pushing mychart-0.2.0.tgz to mychart...
Done.
```

本地查看：

```java
[root@server1 helm]# helm repo update 
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "mychart" chart repository
...Successfully got an update from the "stable" chart repository
Update Complete. ⎈ Happy Helming!⎈ 
[root@server1 helm]# 
[root@server1 helm]# helm search repo mychart
NAME           	CHART VERSION	APP VERSION	DESCRIPTION                
mychart/mychart	0.2.0        	1.16.0     	A Helm chart for Kubernetes
```

可以看出0.2.0版本已经可以查找到了。

也可以加-l选项查看每个版本：

```java
[root@server1 helm]# helm search repo mychart -l
NAME           	CHART VERSION	APP VERSION	DESCRIPTION                
mychart/mychart	0.2.0        	1.16.0     	A Helm chart for Kubernetes
mychart/mychart	0.1.0        	1.16.0     	A Helm chart for Kubernetes
```

进行更新：

```java
[root@server1 helm]# helm upgrade test mychart/mychart 
Release "test" has been upgraded. Happy Helming!
......
```

查看：

```java
[root@server1 helm]# helm list
NAME	NAMESPACE	REVISION	UPDATED                                	STATUS  	CHART        	APP VERSION
test	default  	2       	2020-05-12 23:13:14.870471994 +0800 CST	deployed	mychart-0.2.0	1.16.0   
```

可以看到chart已经更新到0.2.0.

可以使用以下命令查看部署历史以便回滚：

```java
[root@server1 helm]# helm history test 
REVISION	UPDATED                 	STATUS    	CHART        	APP VERSIONDESCRIPTION     
1       	Tue May 12 23:07:15 2020	superseded	mychart-0.1.0	1.16.0     Install complete
2       	Tue May 12 23:13:14 2020	deployed  	mychart-0.2.0	1.16.0     Upgrade complete
```

测试查看版本：

```java
[root@server1 helm]# kubectl get pod -o wide
NAME                                      READY   STATUS    RESTARTS   AGE     IP             NODE      NOMINATED NODE   READINESS GATES
nfs-client-provisioner-6b66ddf664-4htcz   1/1     Running   0          49m     10.244.2.112   server3   <none>           <none>
test-mychart-c8d845c77-v4hg6              1/1     Running   0          4m26s   10.244.2.113   server3   <none>           <none>
[root@server1 helm]# 
[root@server1 helm]# 
[root@server1 helm]# curl 10.244.2.113
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```

## 版本回滚

使用rollback选项进行回滚：

```java
[root@server1 helm]# helm rollback test 1
Rollback was a success! Happy Helming!
[root@server1 helm]# helm history
Error: "helm history" requires 1 argument
Usage:  helm history RELEASE_NAME [flags]
[root@server1 helm]# helm history test
REVISION	UPDATED                 	STATUS    	CHART        	APP VERSION	DESCRIPTION     
1       	Tue May 12 23:07:15 2020	superseded	mychart-0.1.0	1.16.0     	Install complete
2       	Tue May 12 23:13:14 2020	superseded	mychart-0.2.0	1.16.0     	Upgrade complete
3       	Tue May 12 23:33:48 2020	deployed  	mychart-0.1.0	1.16.0     	Rollback to 1   
```

查看测试页面：

```java
[root@server1 helm]# kubectl get pod -o wide
NAME                                      READY   STATUS    RESTARTS   AGE   IP             NODE      NOMINATED NODE   READINESS GATES
nfs-client-provisioner-6b66ddf664-4htcz   1/1     Running   0          66m   10.244.2.112   server3   <none>           <none>
test-mychart-7d7557d49b-9v2s6             1/1     Running   0          42s   10.244.1.131   server2   <none>           <none>
[root@server1 helm]# curl 10.244.1.131
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

可以看到pod的版本已经回滚到v1.

卸载应用

```java
[root@server1 helm]# helm uninstall test 
release "test" uninstalled
```
