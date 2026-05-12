# 01、Kubernetes 实战 - Windows10安装Docker，配置阿里云加速器
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/1.html
- 分类：容器服务
- 分组：教程目录
## 下载安装包

[官网下载](https://hub.docker.com/editions/community/docker-ce-desktop-windows)

点击Get Docker下载，其他windows版本点击Docker Toolbox

## 介绍

- windows 10 专业版
- docker v19.03.5
- 启用CPU虚拟化和Hyper-V功能
- 安装后vmware将无法运行

## 安装

下载完成后：

**1、** 双击安装包进行安装，弹出界面如下界面点击OK，开始安装…；

**2、** 重启完成后会弹出如下窗口，点击第三个红框处注册dockerid，然后登录；

**3、** 点击桌面右下角^图标，选择Dashboard弹出管理界面；

**4、** 通用配置；

**5、** 代理上网设置（本机无法上网，需代理时设置此项）；

**5、** 配置阿里云加速器，[获取加速器地址](https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors)（需注册阿里云账号）；

**4、** 打开CMD窗口，查看docker信息，安装完成；
