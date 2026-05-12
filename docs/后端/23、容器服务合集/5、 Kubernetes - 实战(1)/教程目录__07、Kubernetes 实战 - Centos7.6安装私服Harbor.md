# 07、Kubernetes 实战 - Centos7.6安装私服Harbor
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/7.html
- 分类：容器服务
- 分组：教程目录
## 前言

官网：https://goharbor.io/

官方安装文档：https://goharbor.io/docs/2.0.0/install-config/

Harbor中文译名为海港，docker是集装箱，K8S是掌舵

毫无疑问，Harbor就是存放和管理镜像的地方。。。

## 安装

本次通过docker compose+二进制文件的方式安装

**1、** 安装docker及dockercompose（可参考本系列前几篇文章）；

**2、** 下载安装文件；

下载地址：https://github.com/goharbor/harbor/releases

**3、** 上传并解压；

```sh
# 上传至此目录
cd /user/local
# 解压
tar -zxvf harbor-offline-installer-v2.0.0.tgz 
cd /harbor
ls -al
```

**1、** 修改配置；

```sh
mv harbor.yml.tmpl  harbor.yml
vim harbor.yml
# 修改hostname为当前IP
# 注释https 相关
```

**5、** 安装；

```sh
# 安装
./install.sh
# 访问
ip+80(用户： admin/Harbor12345)
```

## 使用案例

```sh
准备另外一台虚拟机，安装docker
```

**1、** 修改daemon.json；

```sh
vim /etc/docker/daemon.json
# 添加如下内容
{
  "registry-mirrors": ["https://3dse7md.mirror.aliyuncs.com"],
  "insecure-registries":["192.168.58.173"]
}
# 重启
systemctl daemon-reload
systemctl restart docker
```

**1、** 登录；

```sh
docker login 192.168.58.173
# 输入harbor用户名及密码
```

**3、** 拉取一个镜像并推送到自己的私服；

```sh
# 拉取
docker pull daocloud.io/library/nginx:1.16.1
# 查看 
docker images | grep nginx
# 打标签
docker tag daocloud.io/library/nginx:1.16.1 192.168.58.173/library/nginx:1.16.1
# 推送至私服
docker push 192.168.58.173/library/nginx:1.16.1
```

**4、** 拉取私服镜像并运行；

```sh
# 删除本地nginx镜像
docker rmi 192.168.58.173/library/nginx:1.16.1 daocloud.io/library/nginx:1.16.1 
# 拉取私服镜像
docker pull 192.168.58.173/library/nginx:1.16.1
# 运行
docker run --name my-nginx -d -p 88:80  192.168.58.173/library/nginx:1.16.1 
# 浏览器访问
http://192.168.58.171:88/
```
