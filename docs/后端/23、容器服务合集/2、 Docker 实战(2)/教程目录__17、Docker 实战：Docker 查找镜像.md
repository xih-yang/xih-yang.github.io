# 17、Docker 实战：Docker 查找镜像
- 来源：https://ddkk.com/zhuanlan/container/docker/2/17.html
- 分类：容器服务
- 分组：教程目录
在上一章节的末尾，因为本地不存在 latest 标签的 ubuntu，所以 Docker 就跑到远程去拉取 ubuntu:latest 镜像了

## docker pull 拉取镜像

当我们在本地主机上使用一个不存在的镜像时 Docker 就会自动下载这个镜像

如果我们想预先下载这个镜像，我们可以使用 docker pull 命令来下载它

例如下面的命令，从远程预先拉取 ubuntu:16.10 到本地

```sh
[root@ddkk.com ~]# docker pull ubuntu:16.10
16、10: Pulling from library/ubuntu
dca7be20e546: Pull complete 
40bca54f5968: Pull complete 
61464f23390e: Pull complete 
d99f0bcd5dc8: Pull complete 
120db6f90955: Pull complete 
Digest: sha256:8dc9652808dc091400d7d5983949043a9f9c7132b15c14814275d25f94bca18a
Status: Downloaded newer image for ubuntu:16.10
```

下载完成后，我们可以直接使用这个镜像来运行容器

```sh
[root@ddkk.com ~]# docker run -it ubuntu:16.10 /bin/bash
```

## 查找镜像

如果本地没有想要的镜像，那么我们可以从远程仓库上查找

从远程仓库上查找镜像有两种方法

**1、** 是通过访问DockerHub网站来搜索镜像；

```sh
Docker Hub 网址为 [https://hub.docker.com/][https_hub.docker.com]
```

**2、** 是通过dockersearch命令来查找镜像；

两种方法都好用，一般情况下对于精确的镜像，我们都使用 docker search 命令，比如 nginx 、php 和 python 等，除此之外，我们使用 Docker Hub 网站来查找

下面，我们就使用 docker search 命令来查找 nginx 的镜像

```sh
[root@ddkk.com ~]# docker search nginx
```

返回结果如下

总共返回 5 列信息，各列说明如下

列
说明

NAME
镜像仓库源的名称

DESCRIPTION
镜像的描述

stars
标星个数

OFFICIAL
是否 Docker 官方发布

AUTOMATED
是否从 Dockerfile 自动构建

### 拖取镜像

如果找到了想要的镜像，那么可以使用 docker pull 命令来拉取这个镜像了

比如我们想使用 nginx 官方最新的镜像，那么可以使用下面的命令将它下载到本地

```sh
[root@ddkk.com ~]# docker pull nginx
Using default tag: latest
latest: Pulling from library/nginx
f2aa67a397c4: Pull complete 
3c091c23e29d: Pull complete 
4a99993b8636: Pull complete 
Digest: sha256:f5d0f96d380d09afffb4f47b1eb66ade53103a281053cda06b7ca573b4eba0f0
Status: Downloaded newer image for nginx:latest
```

下载完成后，我们就可以使用这个镜像

```sh
[root@ddkk.com ~]# docker run nginx
```
