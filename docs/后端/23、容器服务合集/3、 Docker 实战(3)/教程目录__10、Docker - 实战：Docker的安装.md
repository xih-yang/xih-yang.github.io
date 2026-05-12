# 10、Docker - 实战：Docker的安装
- 来源：https://ddkk.com/zhuanlan/container/docker/3/10.html
- 分类：容器服务
- 分组：教程目录
> CentOS环境下的Docker官方推荐的三种安装方式

> yum安装方式
> 脚本安装方式
> 本地rpm安装方式

## 1、前提

- Docker要求CentOS系统的内核版本高于3.10。

通过 `uname -r`命令查看你当前的内核版本

```java
[root@ddkk.com ~ ] uname -r
3.10.0-957.el7.x86_64
```

- Docker目前分为两个版本:

Docker CE（社区免费版）

Docker EE（企业版，强调安全，但需付费使用）

注意：我们安装的版本为社区版。
- Docker 官方文档也可以查看详细的安装方式：

[https://docs.docker.com/install/linux/docker-ce/centos/](https://links.jianshu.com/go?to=https%3A%2F%2Fdocs.docker.com%2Finstall%2Flinux%2Fdocker-ce%2Fcentos%2F)

## 2、通过yum安装Docker

通过yum安装Docker，也就是使用Docker镜像仓库进行安装。

在新主机上首次安装`Docker Engine-Community`（`docker-ce`） 之前，需要设置Docker仓库。之后就可以从仓库安装和更新Docker。

### （1）更新yum包

在新安装的`CentOS 7`中，一定要先更新`yum`包。

```java
$ sudo yum update
```

### （2）移除旧的Docker版本

如果之前安装过旧版本，在安装前一定要执行一下下面的命令。

```java
$ sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-selinux \
                  docker-engine-selinux \
                  docker-engine
```

如果出现下面提示，则证明没有安装过之前的旧版本。

```java
已加载插件：fastestmirror
参数 docker 没有匹配
参数 docker-client 没有匹配
参数 docker-client-latest 没有匹配
参数 docker-common 没有匹配
参数 docker-latest 没有匹配
参数 docker-latest-logrotate 没有匹配
参数 docker-logrotate 没有匹配
参数 docker-selinux 没有匹配
参数 docker-engine-selinux 没有匹配
参数 docker-engine 没有匹配
不删除任何软件包
```

### （3）安装必须的软件包

- 安装yum-utils提供yum-config-manager功能。
- 同时安装的device-mapper-persistent-data和lvm2，用于devicemapper存储设备映射器，这是必须的两个软件包。（最新官方文档上没有要求安装这两个软件包）

```java
$ sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2
```

### （4）设置稳定yum源仓库

给`yum`配置一个稳定（`stable`）的仓库（也可以是镜像仓库）来下载Docker。

官方Docker镜像源地址（不推荐）

```java
$ sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
```

因为网络的原因经常下载失败：

报错：

```java
1[Errno 14] curl#35 - TCP connection reset by peer（TCP链接被打断）
2[Errno 12] curl#35 - Timeout（链接超时）
```

阿里的Docker镜像源地址（推荐）

```java
$ sudo yum-config-manager \
    --add-repo \
    http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

> 注意
>
> 仓库配置信息会保存到/etc/yum.repos.d/docker-ce.repo文件中。
>
> 在没有执行上边命令之前，是没有docker-ce.repo文件的。执行完成上边命令之后，才生成的docker-ce.repo文件。

### （5）更新yum软件包索引

```java
$ sudo yum makecache fast
```

这个命令是将软件包信息提前在本地缓存一份，用来提高搜索安装软件的速度。

通常在更新`yum`源或者重新配置`yum`源之后，使用该命令生成缓存。（推荐执行一次该命令）

### （6）开始安装Docker-ce

**1）安装最新版本的Docker-ce**

```java
直接执行：$ sudo yum -y install docker-ce
```

**2）安装指定版本的Docker-ce**

- 列出数据库中Docker的可用版本。

```java
执行：$ yum list docker-ce --showduplicates | sort -r
docker-ce.x86_64  3:18.09.1-3.el7                     docker-ce-stable
docker-ce.x86_64  3:18.09.0-3.el7                     docker-ce-stable
docker-ce.x86_64  18.06.1.ce-3.el7                    docker-ce-stable
docker-ce.x86_64  18.06.0.ce-3.el7                    docker-ce-stable
```

- 选择指定的版本安装。

```java
执行：
$ sudo yum install docker-ce-+版本号
例如：
$ sudo yum install docker-ce-18.03.1.ce
```

> 注意：
>
> 官方文档中安装Docker需要安装docker-ce、docker-ce-cli、containerd.io三个软件。我们直接安装docker-ce就好，其他两个软件会自动匹配版本进行安装。

```java
$ sudo yum install docker-ce docker-ce-cli containerd.io
$ sudo yum install docker-ce-<VERSION_STRING> docker-ce-cli-<VERSION_STRING> containerd.io
如：$ sudo yum install docker-ce-18.03.1.ce
```

### （7）查看Docker版本信息

```java
$ sudo docker version
Client: Docker Engine - Community
 Version:           20.10.5
 API version:       1.41
 Go version:        go1.13.15
 Git commit:        55c4c88
 Built:             Tue Mar  2 20:33:55 2021
 OS/Arch:           linux/amd64
 Context:           default
 Experimental:      true
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
# 启动Docker执行docker version命令，显示信息更多
Client: Docker Engine - Community
 Version:           20.10.5
 API version:       1.41
 Go version:        go1.13.15
 Git commit:        55c4c88
 Built:             Tue Mar  2 20:33:55 2021
 OS/Arch:           linux/amd64
 Context:           default
 Experimental:      true
Server: Docker Engine - Community
 Engine:
  Version:          20.10.5
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.13.15
  Git commit:       363e9a8
  Built:            Tue Mar  2 20:32:17 2021
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.4.4
  GitCommit:        05f951a3781f4f2c1911b05e61c160e9c30eaa8e
 runc:
  Version:          1.0.0-rc93
  GitCommit:        12644e614e25b05da6fd08a38ffa0cfe1903fdec
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

### （8）启动Docker

```java
$ sudo systemctl start docker
```

### （9）查看Docker状态

```java
$ sudo systemctl status docker
```

### （10）加入开机启动

```java
$ sudo systemctl enable docker
```

### （11）验证Docker是否正确安装

通过运行`hello-world`镜像来验证是否正确安装了`Docker Engine-Community`。

```java
$ sudo docker run hello-world
# 出现下面显示，证明运行镜像成功
Unable to find image 'hello-world:latest' locally（本地没有找到hello-world镜像）
latest: Pulling（拉取） from library/hello-world（去远程拉取library/hello-world镜像）
1b930d010525: Pull complete（拉取完成）
Digest: sha256:d1668a9a1f5b42ed3f46b70b9cb7c88fd8bdc8a2d73509bb0041cf436018fbf5
Status: Downloaded newer image for hello-world:latest
（上面三行是拉取镜像的签名信息）
Hello from Docker!（镜像运行起来了）
This message shows that your installation appears to be working correctly.
（此消息表明您的安装似乎可以正常工作。为了生成此消息，Docker采取了以下步骤：）
To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.
To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash
Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/
For more examples and ideas, visit:
 https://docs.docker.com/get-started/
```

### （12）查看本地Docker镜像

```java
$ sudo docker images
REPOSITORY    TAG       IMAGE ID       CREATED      SIZE
hello-world   latest    d1165f221234   8 days ago   13.3kB
```

### （13）停止Docker运行

```java
$ sudo systemctl stop docker
```

至此Docker安装完成。
