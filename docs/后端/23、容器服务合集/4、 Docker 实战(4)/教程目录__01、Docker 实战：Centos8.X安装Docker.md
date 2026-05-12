# 01、Docker 实战：Centos8.X安装Docker
- 来源：https://ddkk.com/zhuanlan/container/docker/4/1.html
- 分类：容器服务
- 分组：教程目录
### 环境准备

- 需要会Linux的基础
- Centos8.x
- 使用Xshell连接远程服务器

### 环境查看

```java
#系统内核是4.18以上
[root@ddkk.com ~]# uname -r
4.18.0-305.3.1.el8.x86_64
```

```java
#系统版本
[root@ddkk.com ~]# cat /etc/os-release 
NAME="CentOS Linux"
VERSION="8"
ID="centos"
ID_LIKE="rhel fedora"
VERSION_ID="8"
PLATFORM_ID="platform:el8"
PRETTY_NAME="CentOS Linux 8"
ANSI_COLOR="0;31"
CPE_NAME="cpe:/o:centos:centos:8"
HOME_URL="https://centos.org/"
BUG_REPORT_URL="https://bugs.centos.org/"
CENTOS_MANTISBT_PROJECT="CentOS-8"
CENTOS_MANTISBT_PROJECT_VERSION="8"
```

### 安装

帮助文档：[https://docs.docker.com/engine/install/centos/](https://docs.docker.com/engine/install/centos/)

```java
#step-1 卸载旧版本
yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
#step-2 需要的安装包
yum install -y yum-utils
#step-3 设置镜像的仓库
yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo默认是国外官方的
yum-config-manager \
    --add-repo \
    http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo 推荐使用阿里云，速度快
#step-4 更新yum软件包索引
yum makecache fast
#step-5 安装docker docker-ce社区  ee企业版，这一步可能会报错，我安装的时候报错了，如果你也报错了，移到文末查看解决方案
yum install docker-ce docker-ce-cli containerd.io
#step-6 启动docker
systemctl start docker
#step-7 使用docker version 是否安装成功！
docker version
```

```java
#step-8 hello-world
docker run hello-world
```

```java
#step-9 查看下载下来的hello-world镜像
[root@ddkk.com ~]# docker images
REPOSITORY TAG IMAGE ID CREATED SIZE
hello-world latest d1165f221234 5 months ago 13.3kBdocker run hello-world
```

```java
#step-10 将docker设置为开机自启
[root@ddkk.com ~]# systemctl enable docker
```

### 了解，卸载

```java
#卸载依赖
yum remove docker-ce docker-ce-cli containerd.io
#删除资源
rm -rf /var/lib/docker
# /var/lib/docker    docker的默认工作路径
```

### 安装常见问题

安装报错的原因，在执行安装的时候，默认会安装官网推荐的依赖包，毕竟是国外的，有些就会下载不了，就会报错

```java
#解决problem with installed package……的报错，移除install装的
yum erase podman buildah
#安装加个选项--nobest不使用官网推荐的相关依赖包
yum install -y docker-ce docker-ce-cli containerd.io --nobest
```
