# 18、Docker - 实战：容器常用命令（一）
- 来源：https://ddkk.com/zhuanlan/container/docker/3/18.html
- 分类：容器服务
- 分组：教程目录
有镜像才能创建容器，这是根本前提。

我们下载一个CentOS镜像作为演示。

```java
[root@192 ~]# docker pull centos
Using default tag: latest
latest: Pulling from library/centos
7a0437f04f83: Pull complete 
Digest: sha256:5528e8b1b1719d34604c87e11dcd1c0a20bedf46e83b5632cdeac91b8c04efc1
Status: Downloaded newer image for centos:latest
docker.io/library/centos:latest
[root@192 ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
centos       latest    300e315adb2f   3 months ago   209MB
```

## 1、新建并启动容器

命令：`docker run [OPTIONS] IMAGE(镜像名) [COMMAND] [ARG...(参数)]`

常用OPTIONS说明：有些是一个减号，有些是两个减号。

- --name="容器新名字"：为容需指定一个名称，如tomcat1、tomcat2用来区分容器。
- -d：后台运行容器，并返回容器ID，即启动守护式容器。
- -i：以交互模式运行容器，可进入容器查看内容，通常与-t同时使用。（常用）
- -t：为容器重新分配一个伪输入终端，通常与-i同时使用。（常用）
- -P：大写P表示，Docker会随机选择一个宿主机端口，映射到容器内部开放的网络端口上。
- -p：小写p表示，Docker会选择一个具体的宿主机端口，映射到容器内部开放的网络端口上。

有以下四种格式：
- `-p ip:主机端口(hostPort):容器端口(containerPort)`
- `-p 主机端口:容器端口` （常用）
- `-p 容器端口`
- `-p ip::容器端口`（待确定）

启动镜像示例：

使用镜像`centos:latest`，以交互模式启动一个容器，在容器内执行`/bin/bash`命令。

```java
# 查看本地镜像
[root@192 ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
centos       latest    300e315adb2f   3 months ago   209MB
# 创建启动容器,并进入容器
[root@192 ~]# docker run -it 300e315adb2f /bin/bash
[root@5b6c5748a7b9 /]# 
# 以上说明以ID为300e315adb2f的这个镜像，生成了一个名称为5b6c5748a7b9的容器。
# 此时我们已经登陆在启动的CentOS容器中了。
# 我们可以正常使用Linux命令来进行操作了，如下：
[root@5b6c5748a7b9 /]# ls
bin  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
[root@5b6c5748a7b9 /]# pwd
/
[root@5b6c5748a7b9 /]# ps -ef
UID         PID   PPID  C STIME TTY          TIME CMD
root          1      0  0 17:21 pts/0    00:00:00 /bin/bash
```

> 提示：因为Docker的CentOS镜像只有200M左右，所以是CentOS系统的基础版本，会有很多命令都是不完善。

## 2、列出当前所有正在运行的容器

命令：`docker ps [OPTIONS]`

我们从XShell中复制一个shell窗口，执行`docker ps`命令，如下：

说明：

- 5b6c5748a7b9的STATUS选项是Up状态，说明该容器是启动状态。
- 如果启动容器的时候，没有指定--name属性，系统会自动分配一个名字给容器，如上图中的hopeful_goldberg。

> 提示：我们可以看到有一个CONTAINER ID为5b6c5748a7b9容器正在运行，这个5b6c5748a7b9和上边示例的Linux系统命令提示符[root@5b6c5748a7b9 /]中的名称相吻合。

**常用OPTIONS说明：**

- -a：列出当前所有正在运行的容器+历史上运行过的容器。
- -l：显示最近创建的容器。
- -n：显示最近n个创建的容器，例如-n=3或者-n 3。
- -q：只显示容器编号。（常用）
- --no-trunc：不截断输出，显示完整的镜像信息。

示例：

```java
[root@192 ~]# docker ps -qa --no-trunc -n=3
f9444cf9f26f2f0e12aa309d1914a06553575fb00f6301ce541753fb92d00c0a
136475a80d92856c78c202b50edfff2e1cd61a4b832b5ed8fb767c546f355727
5b6c5748a7b9072ce246d546dbc4e4f7b69796fbeeb6884286e78cbbc94a7c0c
[root@192 ~]# docker ps -qa --no-trunc -n 3
f9444cf9f26f2f0e12aa309d1914a06553575fb00f6301ce541753fb92d00c0a
136475a80d92856c78c202b50edfff2e1cd61a4b832b5ed8fb767c546f355727
5b6c5748a7b9072ce246d546dbc4e4f7b69796fbeeb6884286e78cbbc94a7c0c
```

## 3、退出容器

在Docker中退出容器有两种方式。

**1、**`exit`：容器停止退出；

**2、**`ctrl+P+Q`：容器不停止退出，（注意是大写PQ）；

**示例1：**

```java
# exit命令演示
# 1.查看本机docker镜像
[root@192 ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
centos       latest    300e315adb2f   3 months ago   209MB
# 2.创建启动并进入centos容器
[root@192 ~]# docker run -it 300e315adb2f /bin/bash
# 3.执行exit命令，停止并退出容器
[root@136475a80d92 /]# exit
exit
# 查看当前宿主机上正在运行的容器，可以看到没有任何容器正在运行。
[root@192 ~]# docker ps
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
[root@192 ~]# 
```

**示例2：**

```java
# ctrl+P+Q退出容器演示
# 1.查看本机docker镜像
[root@192 ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
centos       latest    300e315adb2f   3 months ago   209MB
# 2.创建启动并进入centos容器,注意--name=mycentos 要卸载容器名前边
[root@192 ~]# docker run -it --name=mycentos 300e315adb2f  /bin/bash
[root@14b077f2496b /]# 
# 3.ctrl+P+Q，不停止并退出容器
# 4.查看当前宿主机上正在运行的容器，可以看到14b077f2496b容器正在运行。
CONTAINER ID   IMAGE          COMMAND       CREATED              STATUS          PORTS     NAMES
14b077f2496b   300e315adb2f   "/bin/bash"   About a minute ago   Up 59 seconds             mycentos
[root@192 ~]#
```

## 4、启动容器

就是启动之前被关闭的容器。

示例：

查看当前宿主机中的容器。

我们可以看到，此时宿主机上有2个容器正在运行`Up`，有2个容器是关闭状态`Exited`。

我们可以通过命令：`docker start 容器ID或者容器名`，重新启动容器。

如下图：

执行启动容器命令后，会启动容器，并返回启动的容器ID。

可以看到上图中，第三个容器`136475a80d92`，已经被启动了。

## 5、重启容器

就是重新启动一个容器。

命令：`docker restart 容器ID或者容器名`

示例：

先查看当前宿主机的容器状态。

然后重启第一个容器，ID为`14b077f2496b`，名称为`mycentos`。

这里我们一定要注意看`STATUS`状态为`Up 2 hours`

我们重启该容器，并查看他的启动时间。

我们可以看到重启之后，`mycentos`容器的启动时间变为了4秒，说明该容器进行了重启。

## 6、停止容器

停止正在运行的容器。（正常关闭容器）

命令：`docker stop 容器ID或者容器名`

演示：

先查看当前宿主机的容器状态。

执行命令关闭第三个容器，如下图：

## 7、强制停止容器

停止正在运行的容器。（暴力关闭容器）

命令：`docker kill 容器ID或者容器名`

演示：

先查看当前宿主机的容器状态。

执行命令，强制关闭第二个容器，如下图：

## 8、删除已停止的容器

命令：`docker rm 容器ID`

**（1）删除一个已停止的容器**

先查看当前宿主机的容器状态。

删除第一个正在运行的容器，如下：

```java
[root@192 ~]# docker rm 14b077f2496b
Error response from daemon: You cannot remove a running container 14b077f2496b3c11d041a8bb138f60b32538ddedebe88245dc805a25669d0d83. Stop the container before attempting removal or force remove
```

守护进程`daemon`会提示我们，您不能删除正在运行的容器，请先停止容器。

如果需要删除正在运行的容器，加`-f`参数，进行强制删除。

那我们接下来删除第二个容器，如下：

可以看到，第二个容器已经删除，现在宿主机上只有3个容器了。

**（2）一次性删除多个已停止的容器**

命令：`docker rm 容器1ID 容器2ID 容器3ID ...`

示例：

删除第二第三个容器，如下：

```java
[root@192 ~]# docker rm 136475a80d92 5b6c5748a7b9
136475a80d92
5b6c5748a7b9
[root@192 ~]# docker ps -a
CONTAINER ID   IMAGE          COMMAND       CREATED       STATUS        PORTS  NAMES
14b077f2496b   300e315adb2f   "/bin/bash"   3 hours ago   Up 19 minutes        mycentos
```

我们可以看到，此时宿主机上只有一个容器了。

**（3）删除所有本机已停止的容器**

- 方式一：

命令：`docker rm -f $(docker ps -aq)`

说明：`docker rm -f` 删除所有`docker ps -aq`命令显示容器ID对应的容器。
- 方式二：

`docker ps -aq| xargs docker rm`

说明：`docker ps -aq`命令执行的结果，通过管道符，传递给后边的`xargs`。

`xargs`是给命令传递参数的一个过滤器，以将管道或标准输入的数据转换成参数。
