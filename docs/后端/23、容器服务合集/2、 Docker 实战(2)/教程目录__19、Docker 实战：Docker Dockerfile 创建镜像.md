# 19、Docker 实战：Docker Dockerfile 创建镜像
- 来源：https://ddkk.com/zhuanlan/container/docker/2/19.html
- 分类：容器服务
- 分组：教程目录
在Docker commit 更新镜像 中，我们使用了一种最土的方法，也是最有效的方法创建了一个新的镜像

但是，大家有没有发现，这种方法也是有弱点的

**1、** 镜像文件太大；

```sh
比如 souyunku/py365flask102 镜像足足有 902m ，都快 1G 了
```

**2、** 不方便更新；

```sh
如果以后我们的 Python 升级到 3.7。那么我们就要重新来过了
```

**3、** 不方便分享和转移；

```sh
快 1G 的文件，分享和下载都很慢的说
```

那，有没有新的更好的方法呢？

有的？

有一种方法叫做自动构建，就是那个 docker search 里的那个 AUTOMATED 字段所表示的

那这种自动构架的方法是怎么个原理呢？

它们是通过一个叫做 Dockerfile 收集命令，然后通过逐条解释每条命令来创建镜像

## Dockerfile 文件

Dockerfile 是一种可以被 Docker 程序解释的脚本

Dockerfile 由一条一条的指令组成，每条指令对应 Linux 下面的一条命令

Docker 程序将这些 Dockerfile 指令翻译真正的 Linux 命令

## Dockerfile 基本语法

Dockerfile 文件有自己书写格式和支持的命令

**1、** Dockerfile的指令是忽略大小写的，建议使用大写；

2、 使用 # 作为注释

**3、** 每一行只支持一条指令，每条指令可以携带多个参数；

## Dockerfile 指令

Dockerfile 的指令根据作用可以分为两种: **构建指令** 和 **设置指令**

**1、** 构建指令用于构建image，其指定的操作不会在运行image的容器上执行；

**2、** 设置指令用于设置image的属性，其指定的操作将在运行image的容器中执行；

## FROM 指令

**FROM** 是一个构建指令，用于指定基础 image

**FROM** 指令必须指定且需要在 Dockerfile 其它指令的前面

后续的指令都依赖于该指令指定的 image

FROM 指令指定的基础 image 可以是官方远程仓库中的，也可以位于本地仓库

### 语法

该指令有两种格式

```sh
FROM <image> 
```

指定基础 image 为该 image 的最后修改的版本

```sh
FROM <image>:<tag>
```

指定基础 image 为该 image 的一个 tag 版本

例如下面的 Dockerfile 根据 python:3.6.5 创建一个镜像

```sh
FROM python:3.6.5
```

## MAINTAINER 指令

MAINTAINER 是一个构建指令，用来指定创建者信息

MAINTAINER 会将 image 的制作者相关的信息写入到 image 中

当对该image 执行 docker inspect 命令时，输出中有相应的字段记录该信息

### 语法

```sh
MAINTAINER <name>  
```

例如下面的 Dockerfile 指定创建为 souyunku

```sh
FROM python:3.6.5
MAINTAINER souyunku  
```

## RUN 指令

RUN 指令是构建指令，用于安装软件

RUN 可以运行任何被基础 image 支持的命令

**1、** 如果基础image选择了ubuntu，那么软件管理部分只能使用ubuntu的命令；

**2、** 如果基础image选择了centos，那么软件管理部分职能使用centos的命令；

### 语法

该指令有两种格式

```sh
RUN <command>
RUN ["executable", "param1", "param2" ... ]  
```

例如下面的 Dockerfile 语法使用 pip 安装 flask

```sh
FROM python:3.6.5
MAINTAINER souyunku
RUN pip install flask
```

## CMD 指令

CMD 指令是设置指令，用于设置容器 ( container ) 启动时执行的操作

CMD 指令用于 container 启动时指定的操作。该操作可以是执行自定义脚本，也可以是执行系统命令

该指令只能在文件中存在一次，如果有多个，则只执行最后一条

### 语法

该指令有三种格式

```sh
CMD ["executable","param1","param2"]
CMD command param1 param2
CMD ["param1","param2"]
```

当Dockerfile 指定了 ENTRYPOINT ，那么只能使用第三种格式

ENTRYPOINT 指定的是一个可执行的脚本或者程序的路径，该指定的脚本或者程序将会以 param1 和 param2 作为参数执行

所以如果 CMD 指令使用第三种格式，那么 Dockerfile 中必须要有配套的 ENTRYPOINT

例如下面的 Dockerfile 文件在运行容器时，执行 python /www/app/app.py 操作

```sh
FROM python:3.6.5
MAINTAINER souyunku
RUN pip install flask
CMD ["python","/www/app/app.py"]
```

## ENTRYPOINT

ENTRYPOINT 指令是设置指令，用于设置 container 启动时执行的操作

ENTRYPOINT 指令指定容器启动时执行的命令，可以多次设置，但是只有最后一个有效

### 语法

ENTRYPOINT 指令有两种格式

```sh
ENTRYPOINT ["executable", "param1", "param2"]
ENTRYPOINT command param1 param2
```

ENTRYPOINT 指令的使用分为两种情况

**1、** 一种是独自使用；

```sh
当独自使用时，如果还使用了 CMD 命令且 CMD 是一个完整的可执行的命令
那么CMD 指令和 ENTRYPOINT 会互相覆盖只有最后一个 CMD 或者 ENTRYPOINT 有效
例如下面的指令中，CMD 指令将不会被执行，只有 ENTRYPOINT 指令被执行
```

```sh
    CMD echo "Hello, World!"  
    ENTRYPOINT ls -l
```

**2、** 另一种和CMD指令配合使用；

```sh
这种方式用于指定 ENTRYPOINT 的默认参数
这时 CMD 指令不是一个完整的可执行命令，仅仅是参数部分
ENTRYPOINT 指令只能使用 JSON 方式指定执行命令，而不能指定参数
例如下面的指令，结合了两者
```

```sh
    CMD ["-l"]  
    ENTRYPOINT ["/usr/bin/ls"]
```

## USER

**USER** 是设置指令，用于设置运行容器 ( container ) 的用户，默认是 **root**

例如下面的指令用于指定 memcached 的运行用户

```sh
ENTRYPOINT ["memcached"]  
USER daemon
```

或

```sh
ENTRYPOINT ["memcached", "-u", "daemon"]
```

## EXPOSE

**EXPOSE** 是设置指令，用于指定容器需要映射到宿主机器的端口

**EXPOSE** 指令会将容器中的端口映射成宿主机器中的某个端口

当需要访问容器的时候，可以不用容器的 IP 地址而是使用宿主机器的 IP 地址和映射后的端口

要完成整个操作需要两个步骤

**1、** 首先在Dockerfile使用EXPOSE设置需要映射的容器端口；

**2、** 然后在运行容器的时候指定-p选项加上EXPOSE设置的端口；

这样EXPOSE 设置的端口号会被随机映射成宿主机器中的一个端口号

> 也可以指定需要映射到宿主机器的那个端口，这时要确保宿主机器上的端口号没有被使用

EXPOSE 指令可以一次设置多个端口号，相应的运行容器的时候，可以配套的多次使用 -p 选项

### 语法

```sh
EXPOSE <port> [<port>...]  
```

### 范例

映射一个端口

```sh
EXPOSE port1
```

相应的运行容器使用的命令

```sh
docker run -p port1 image
```

映射多个端口

```sh
EXPOSE port1 port2 port3
```

相应的运行容器使用的命令

```sh
docker run -p port1 -p port2 -p port3 image
```

还可以指定需要映射到宿主机器上的某个端口号

```sh
docker run -p host_port1:port1 -p host_port2:port2 -p host_port3:port3 image
```

端口映射是 docker 比较重要的一个功能，原因在于我们每次运行容器的时候容器的 IP 地址不能指定而是在桥接网卡的地址范围内随机生成的

宿主机器的 IP 地址是固定的，我们可以将容器的端口的映射到宿主机器上的一个端口，免去每次访问容器中的某个服务时都要查看容器的IP的地址

对于一个运行的容器，可以使用 docker port 加上容器中需要映射的端口和容器的 ID 来查看该端口号在宿主机器上的映射端口

## ENV

**ENV** 是构建指令，用于设置环境变量

### 语法

```sh
ENV <key> <value>  
```

设置了后，后续的 RUN 命令都可以使用

容器启动后，可以通过 docker inspect 查看这个环境变量

也可以通过在 docker run --env key=value 时设置或修改环境变量

### 范例

假如我们安装了 JAVA 程序，需要设置 JAVA_HOME

那么可以在 Dockerfile 中这样写

```sh
ENV JAVA_HOME /path/to/java/dirent
```

## ADD

**ADD** 是构建指令，用于从 src 复制文件到 container 的 dest 路径

所有拷贝到 container 中的文件和文件夹权限为 0755，uid 和 gid 为 0

### 语法

```sh
ADD <src> <dest>  
```

`` 是相对被构建的源目录的相对路径，可以是文件或目录的路径，也可以是一个远程的文件 URL

`` 是 container 中的绝对路径

**1、** 如果src是一个目录，那么会将该目录下的所有文件添加到container中，不包括目录；

**2、** 如果文件是可识别的压缩格式，则docker会帮忙解压缩(注意压缩格式)；

**3、** 如果src是文件且dest中不使用斜杠结束，则会将dest视为文件，src的内容会写入dest；

**4、** 如果src是文件且dest中使用斜杠结束，则会src文件拷贝到dest目录下；

## VOLUME

**VOLUME** 是设置指令，用于指定挂载点

**VOLUME** 指令使容器中的一个目录具有持久化存储数据的功能，该目录可以被容器本身使用，也可以共享给其它容器使用

Docker 容器使用的是 AUFS 文件系统，这种文件系统不能持久化数据，当容器关闭后，所有的更改都会丢失

当容器中的应用有持久化数据的需求时可以在 Dockerfile 中使用该指令

### 语法

```sh
VOLUME ["<mountpoint>"]  
```

### 范例

例如下面的指令

```sh
FROM base  
VOLUME ["/tmp/data"]
```

运行通过该 Dockerfile 生成镜像的容器，/tmp/data 目录中的数据在容器关闭后，里面的数据还存在

假如例如另一个容器也有持久化数据的需求，且想使用上面容器共享的 /tmp/data 目录，那么可以运行下面的命令启动一个容器

```sh
docker run -t -i -rm -volumes-from container1 image2 bash
```

container1 为第一个容器的 ID

image2 为第二个容器运行 image 的名字

## WORKDIR

**WORKDIR** 指令是设置指令，可用于多次切换 ( 相当于 cd 命令 )

**WORKDIR** 指令对 RUN ,CMD , ENTRYPOINT 生效

### 语法

```sh
WORKDIR /path/to/workdir  
```

### 范例

例如下面的指令在 /p1/p2 下执行 vim a.txt

```sh
WORKDIR /p1 WORKDIR p2 RUN vim a.txt  
```

## ONBUILD

**ONBUILD** 指定的命令在构建镜像时并不执行，而是在它的子镜像中执行

```sh
ONBUILD <Dockerfile关键字>
```

## 创建 Python 3.6.5 和 Flask 1.0.2 的镜像

通过前面的学习，我们就可以使用 Dockfile 语法创建一个 Python 3.6.5 和 Flask 1.0.2 的镜像

```sh
FROM python:3.6.5
pip install flask
```

两行代码搞定，我去，简单了…
