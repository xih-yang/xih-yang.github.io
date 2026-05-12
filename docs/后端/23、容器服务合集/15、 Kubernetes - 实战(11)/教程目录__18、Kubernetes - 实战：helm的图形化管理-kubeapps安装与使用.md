# 18、Kubernetes - 实战：helm的图形化管理-kubeapps安装与使用
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/18.html
- 分类：容器服务
- 分组：教程目录
前面学习了helm的用法，方便部署，但是我想有图形界面来更好的管理

## 1、kubeapps图形化安装

部署kubeapps应用，为Helm提供web UI界面管理

`helm repo add apphub https://apphub.aliyuncs.com`添加第三方仓库，然后搜索kubeapps，拉取部署文件

上传镜像至仓库，方便使用

解压kubeapps-7.2.0.tgz部署文件，进入kubeapps目录，修改values.yaml文件

打开ingress服务，设定hostname，并修正所有的镜像路径

进入chart子目录，进入postgresql子目录，修改values.yaml文件

添加仓库地址，修正镜像的路径

创建命名空间kubeapps，隔离区分，安装kubeapps

等待，可以看到所属pod和服务全部正常运行

查看ingress成功运行，有后端

查看ingress中svc所分配的对外暴露IP

给真机添加地址解析

创建sa，创建全局角色绑定，赋予读写权限

网址输入`kubeapps.westos.org`，访问kubeapps，发现需要token才能登陆

找到secrets中的token，查看token的详细信息

复制该token到网页中

成功的登陆kubeapps

## 2、kubeapps图形化添加自己仓库

通过url的方式添加仓库到helm中

忽略加密认证，安装仓库

如果出现无法识别仓库reg.westos.org，说明需要添加解析

`kubectl -n kube-system edit cm coredns`进入coredns添加解析

再次添加仓库，成功

## 3、kubeapps图形化部署mychart

搜索，可以查看到以前自己打包的mychart，进入

选择v1版本，部署

成功部署

也可以用命令行验证

也可以进行更新，打开ingress，添加域名

同时，在真机中添加解析

网页访问`myapp.westos.org`，测试成功

当然更新版本也很简单，标签换为v2，再次更新

网页测试，v2版本

也支持回滚

成功回到原来的v1，非常方便
