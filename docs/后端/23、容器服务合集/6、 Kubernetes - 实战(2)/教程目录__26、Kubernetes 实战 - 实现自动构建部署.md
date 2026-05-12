# 26、Kubernetes 实战 - 实现自动构建部署
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/2/26.html
- 分类：容器服务
- 分组：教程目录
## 一，前言

上一篇，介绍了 Deployment、Service 的创建，完成了前端项目的构建部署；

希望实现：推送代码 -> 自动构建部署-> k8s 滚动更新；

本篇，实现自动构建部署

## 二，推送触发构建

### 构建 jenkins

重新构建 jenkins：cicd-backend

构建镜像，推送到私有仓库

```java
[root@k8s-master cicd]# kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
cicd-backend-98b5d4f57-ftrdk     1/1     Running   0          2d21h
cicd-frontend-77447bfdb4-bgt6t   1/1     Running   0          35h
cicd-mysql-745975859b-c4b6p      1/1     Running   5          2d21h
```

k8s滚动更新，使用新的镜像：

```java
[root@k8s-master cicd]# kubectl get pods
NAME                             READY   STATUS              RESTARTS   AGE
cicd-backend-86bf8b44d-8gghn     0/1     ContainerCreating   0          3s
cicd-backend-98b5d4f57-ftrdk     1/1     Running             0          2d21h
cicd-frontend-77447bfdb4-bgt6t   1/1     Running             0          35h
cicd-mysql-745975859b-c4b6p      1/1     Running             5          2d21h
[root@k8s-master cicd]# kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
cicd-backend-86bf8b44d-8gghn     1/1     Running   2          3m30s
cicd-frontend-77447bfdb4-bgt6t   1/1     Running   0          35h
cicd-mysql-745975859b-c4b6p      1/1     Running   7          2d21h
```

备注：如果 jenkins 卡死了，需要重启 jenkins

```java
systemctl restart jenkins.service
```

### 安装插件

进入jenkins 系统管理 => 插件管理 => 可选插件标签

搜索gitee，安装 gitee 插件：

搜索last changes 安装，可视化查看 git 文件变化：

### 构建触发器

- Gitee webhook 触发构建,并记录 webhook URL 地址
- 生成 Gitee WebHook 密码

前后端项目都需要进行以下配置，以后端 backend 为例：

1，开启 gitee 插件：

[http://182.92.4.158:8080/gitee-project/cicd-backend](http://182.92.4.158:8080/gitee-project/cicd-backend)

2，在jenkins 生成 WebHook 秘钥：

44b40c000287f8db070421d762a6b7bf

3，配置 WebHooks

打开项目的 WebHooks 管理页面

进入gitee 对应仓库 =》管理 =》WebHooks：

4，配置 webhookURL 和 WebHook 秘钥

添加WebHook：填写前面生成的 url 和秘钥，点击添加即可

前端同上；

- 注意事项

亲测，使用 jenkins 提示的 ip 和服务器外网是不一样的，不同，需要修改为公网 ip 就可以了

此时，修改代码后提交 gitee，会触发重新构建，k8s 滚动更新

**47、** 94.92.122:8082/cicd-backend:20220114115112；

查看pods：

```java
[root@k8s-master cicd]# kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
cicd-backend-86bf8b44d-8gghn     1/1     Running   2          75m
cicd-frontend-5466464465-f5mps   1/1     Running   0          5m22s
cicd-mysql-745975859b-c4b6p      1/1     Running   8          2d22h
[root@k8s-master cicd]# kubectl get pods
NAME                             READY   STATUS              RESTARTS   AGE
cicd-backend-59748596c4-jq7sw    0/1     ContainerCreating   0          26s
cicd-backend-86bf8b44d-8gghn     1/1     Running             2          76m
cicd-frontend-5466464465-f5mps   1/1     Running             0          6m24s
cicd-mysql-745975859b-c4b6p      1/1     Running             8          2d22h
```

## 三，结尾

本篇，介绍了 jenkins、k8s 自动构建部署的实现；
