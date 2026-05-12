# 29、Kubernetes 实战 - Kubernetes Dashboard的使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/3/29.html
- 分类：容器服务
- 分组：教程目录
## 前言

Kubernetes Dashboard如何使用？

## 查看nodes

## 查看namespace

## 其他各种资源

## 如何创建资源

### 创建Deployments

示例Deployments

**1、** 点击+，创建Deployments；

**2、** 选择方式，这里选择表单创建；

**3、** 输入名称，容器镜像，pod副本数量，注意点击，选择命名空间，否则默认会创建到default下；

> 当然可以继续指定其他的参数

**1、** 点击deploy发布，稍等片刻，pod部署中刷新以下，即可查看到Deployments下面显示了刚刚部署的Deployments；

### 修改Deployments规模

点击规模，修改数量，稍等片刻，deployment就会变更到指定的规模

### 修改Deployments

点击编辑，修改镜像版本号，并点击更新，稍等片刻，Deployments就会将pod的镜像更新到指定的版本。

> 示例以修改image版本为例

## pods

### 查看pods

点击pods，可以看到下面有多个pod，可以进入到容器查看日志，也可以进入容器，执行命令

### 删除pod

因为使用Deployment创建的pod是固定规模的，所以如果删除pod，DS会自动扩容到约定数量的pod。

它会立即新建一个pod进行补充。
