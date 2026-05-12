# 03、Docker 实战：Ubuntu 安装 Docker
- 来源：https://ddkk.com/zhuanlan/container/docker/2/3.html
- 分类：容器服务
- 分组：教程目录
Docker 最初的版本就是运行在 Ubuntu 上，所以，Ubuntu 上安装 Docker 应该是最简单的了

## 系统要求

Docker CE 对 Ubuntu 的系统还是有一定的要求的

**1、** 首先必须是64位版本的，这个应该问题不大，只要不是老古董，早就是64位的了；

**2、** Ubuntu的版本必须是下表，或者比下表更新的版本；

```sh
Artful 17.10 (Docker CE 17.11 Edge and higher only)
Xenial 16.04 (LTS)
Trusty 14.04 (LTS)
```

**3、** Docker要求Ubuntu系统的内核版本高于3.10；

```sh
我们可以使用 uname -r 命令来查看当前的内核版本
```

```sh
[root@ddkk.com ~] uname -r 
4.2.0-16-generic
```

## 安装 Docker

Ubuntu 安装 Docker 的方式有很多中，我们选择最省事的那种，最快速的那种

目前最快速的安装 Docker 的方式是使用官方给出的脚本 https://get.docker.com/

只需要在终端里输入以下命令即可开始安装

```sh
[root@ddkk.com ~]# curl -fsSL get.docker.com -o get-docker.sh
[root@ddkk.com ~]# sudo sh get-docker.sh
...
...
If you would like to use Docker as a non-root user, you should now consider
adding your user to the "docker" group with something like:
  sudo usermod -aG docker your-user
Remember to log out and back in for this to take effect!
WARNING: Adding a user to the "docker" group grants the ability to run
         containers which can be used to obtain root privileges on the
         docker host.
         Refer to https://docs.docker.com/engine/security/security/#docker-daemon-attack-surface
         for more information.
```

如果你使用的是 root 用户，可以先轻松下再回来，如果你使用的是普通用户，那么需要 sudo sh get-docker.sh，然后输入登录密码

稍等片刻，Docker 就会安装完毕，是不是很省事，因为我们连一张图都没发

可以安装完成后最后那几段提示

```sh
If you would like to use Docker as a non-root user, you should now consider
    adding your user to the "docker" group with something like:
    sudo usermod -aG docker your-user
   Remember that you will have to log out and back in for this to take effect!
```

意思是说，如果以非 root 用户可以运行 docker 时，需要执行 sudo usermod -aG docker souyunku 命令然后重新登陆，否则会有如下报错

```sh
[penglei@localhost ~]docker fun hello-world
docker: Cannot connect to the Docker daemon. Is the docker daemon running on this host ?
...
```

## 启动 docker 服务

可以使用 services docker start 命令启动 Docker

```sh
[root@ddkk.com ~]# service docker start
```

## Docker Hello World

可以使用 docker run hello-world 命令运行 Hello World 查看是否安装成功

```sh
[root@ddkk.com ~]# docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
9bb5a5d4561a: Pull complete 
Digest: sha256:f5233545e43561214ca4891fd1157e1c3c563316ed8e237750d59bde73361e77
Status: Downloaded newer image for hello-world:latest
Hello from Docker!
This message shows that your installation appears to be working correctly.
To generate this message, Docker took the following steps:
 1、 The Docker client contacted the Docker daemon.
 2、 The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3、 The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4、 The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.
To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash
Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/
For more examples and ideas, visit:
 https://docs.docker.com/engine/userguide/
```
