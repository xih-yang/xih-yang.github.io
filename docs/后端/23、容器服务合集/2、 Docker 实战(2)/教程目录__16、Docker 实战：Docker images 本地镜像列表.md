# 16、Docker 实战：Docker images 本地镜像列表
- 来源：https://ddkk.com/zhuanlan/container/docker/2/16.html
- 分类：容器服务
- 分组：教程目录
前面几章节中，我们多次使用 docker run 从一个镜像创建一个容器，而且我们知道，当使用 docke run 一个镜像时，使用的镜像如果在本地中不存在，docker 就会自动从 docker 镜像仓库中下载，默认是从 Docker Hub 公共镜像源下载

我们也在 Docker run 运行镜像 章节中形象的给镜像一个比喻：QQ 安装包

我们都知道，一个软件安装包，最初都是存放在远程开发者的电脑上，比如 QQ 安装包存放在腾讯服务器上，当我们使用下载软件下载下来之后，它就会在我们自己电脑上有一个备份

那么，镜像也是如此，所有的镜像一般都存储在远程的仓库里，比如 [Docker Hub](https://hub.docker.com)，当我们使用 docker pull 命令时，就会把它们下载到本地

那么，我们要怎么查看本地有哪些镜像呢？

哈哈，很多朋友大概都已经猜到，就是使用 docker images 命令

## docker images 列出本地镜像

如果要查看本地有哪些镜像，可以使用 docker images 命令

```sh
docker images
```

例如下面的命令列出了我的电脑上的所有镜像

```sh
[root@ddkk.com ~]# docker images
REPOSITORY       TAG     IMAGE ID      CREATED       SIZE
ubuntu           17.10   e4422b8da209  4 weeks ago   99.2MB
ubuntu           17.04   fe1cc5b91830  5 months ago  95.6MB
hello-world      latest  e38bc07ac18e  7 weeks ago   1.85kB
jcdemo/flaskapp  latest  084bae02af1b  4 months ago  98.9MB
```

可以看到，我电脑上只有三个镜像

下表时对 docker images 命令返回结果各个字段的说明

字段
说明

REPOSTITORY
表示镜像的仓库源

TAG
镜像的标签

IMAGE ID
镜像ID

CREATED
镜像创建时间

SIZE
镜像大小

同一仓库源可以有多个 TAG ，代表这个仓库源的不同个版本

如ubuntu 仓库源里，有 17.10 、17.04 等多个不同的版本

Docker 使用 REPOSTITORY:TAG 来定义不同的镜像

例如，我们要使用版本为 17.10 的 ubuntu 系统镜像来运行容器时，命令如下：

```sh
[root@ddkk.com ~]# docker run -t -i ubuntu:17.10 /bin/bash
root@87c897f22904:/#
```

如果要使用版本为 17.04 的 ubuntu 系统镜像来运行容器时，命令如下：

```sh
[root@ddkk.com ~]# docker run -t -i ubuntu:17.04 /bin/bash
root@7e0805087ef8
```

如果不指定一个镜像的版本标签，例如只使用 ubuntu ，docker 将默认使用 latest 标签

```sh
[root@ddkk.com ~]# docker run -t -i ubuntu /bin/bash
Unable to find image 'ubuntu:latest' locally
latest: Pulling from library/ubuntu
a48c500ed24e: Pull complete 
1e1de00ff7e1: Pull complete 
0330ca45a200: Pull complete 
471db38bcfbf: Pull complete 
0b4aba487617: Pull complete 
Digest: sha256:667c4b3820ddfbfe7b2dc9816123c936f45af6f31bd51b01d02e97dc5f09e3d5
Status: Downloaded newer image for ubuntu:latest
root@d4dc8634df69:/# 
```
