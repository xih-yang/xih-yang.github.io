# 14、Docker - 实战：Docker的卸载
- 来源：https://ddkk.com/zhuanlan/container/docker/3/14.html
- 分类：容器服务
- 分组：教程目录
## 1、查询Docker安装过的包

执行yum list installed | grep docker或# rpm -qa|grep docker命令。

```java
[root@ddkk.com docker]# yum list installed | grep docker
docker-ce.x86_64                     17.03.0.ce-1.el7.centos        @/docker-ce-17.03.0.ce-1.el7.centos.x86_64
docker-ce-selinux.noarch             17.03.0.ce-1.el7.centos        @/docker-ce-selinux-17.03.0.ce-1.el7.centos.noarch
```

## 2、卸载Docker软件包

分别卸载每个包，也可以一条命令一起卸载，看自己习惯，如下：

```java
$ sudo yum remove docker-ce
```

## 3、删除残留目录

主机上的镜像，容器，卷或自定义配置文件不会自动删除。

要删除所有图像，容器和卷，进行如下操作：

```java
$ sudo rm -rf /var/lib/docker删除 Docker 的镜像目录
$ sudo rm -rf /var/run/docker删除 Docker 的启动目录
```

## 4、验证是否卸载

输入`docker`或`docker --version`验证是否卸载。

```java
[root@ddkk.com ~]# docker --version
-bash: /usr/bin/docker: No such file or directory
[root@ddkk.com  ~]# docker
-bash: /usr/bin/docker: No such file or directory
```

## 5、20版本Docker卸载（官方文档）

**1、** 卸载`DockerEngine`，`CLI`和`Containerd`软件包：（卸载依赖的安装包）；

```java
$ sudo yum remove docker-ce docker-ce-cli containerd.io
```

**2、** 主机上的映像，容器，卷或自定义配置文件不会自动删除；

要删除所有图像，容器和卷：（即：删除本地docker资源）

```java
$ sudo rm -rf /var/lib/docker（docker的默认工作路径！）
$ sudo rm -rf /var/lib/containerd
```

您必须手动删除所有已编辑的配置文件。
