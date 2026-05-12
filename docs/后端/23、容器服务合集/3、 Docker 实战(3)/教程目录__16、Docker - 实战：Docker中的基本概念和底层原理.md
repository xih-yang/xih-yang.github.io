# 16、Docker - 实战：Docker中的基本概念和底层原理
- 来源：https://ddkk.com/zhuanlan/container/docker/3/16.html
- 分类：容器服务
- 分组：教程目录
Docker架构图：

我们依照Docker架构图进行Docker基础概念的说明。

## 1、Docker的底层原理

Docker是一个`Client-Server`结构的系统，Docker守护进程运行在主机上，然后通过`Socket`连接从客户端访问，守护进程从客户端接受命令并管理运行在主机上的容器。容器是一个运行时环境，就好比是我们前面说到的集装箱。

例如架构图中的客户端（`Client`）和服务端（`DOCKER_HOST`）：

发送命令`docker run hello-world`

- Docker客户端转发命令给宿主机上的Docker守护进程（Docker daemon），
- Docker守护进程接收执行命令，返回命令执行结果，
- Docker服务端（守护进程）负责管理宿主机上的各个容器。

如下图所示：

**Docker客户端和守护进程通过Socket连接，可以远程或本地连接**。

> Socket说明：
>
> 网络上的两个程序通过一个双向的通信连接实现数据的交换，这个连接的一端称为一个Socket。建立网络通信连接至少要一对端口号(Socket)。Socket是应用层与TCP/IP协议族通信的中间软件抽象层，它是用来组织数据的一组接口。

## 2、Docker中常用的基本概念

- **镜像（image）** ：Docker镜像类似于虚拟机的镜像，就好比是一个模板，一个面向Docker引擎的只读模板，包含了文件系统，可以通过这个模板来创建容器服务。

例如：一个镜像可以完全包含了`Ubuntu`操作系统环境，可以把它称作一个`Ubuntu`镜像。镜像也可以安装了`Apache`应用程序（或其他软件），可以把它称为一个`Apache`镜像。通过这个镜像可以创建多个容器（最终服务的运行或者项目的运行就是在容器中）。

镜像是创建Docker容器的基础，通过版本管理和增量的文件系统，Docker提供了一套十分简单的机制来创建和更新现有的镜像。用户可以从网上下载一个已经做好的应用镜像，并通过命令直接使用。总之，应用运行是需要环境的，而镜像就是来提供这种环境。

（不同的类可以创建不同的对象，同一个类也可以创建多个相同类型的对象）

（不同的镜像可以创建不同的容器，同一个镜像也可以创建多个相同类型的容器）
- **容器（Container）** ：Docker利用容器技术，独立运行一个或者一组应用，通过镜像来创建的。

Docker容器类似于一个轻量级的沙箱子（因为Docker是基于Linux内核的虚拟技术，所以消耗资源十分少），Docker利用容器来运行和隔离应用。

容器是从镜像创建运行实例，可以将其启动、开始、停止、删除，而这些容器都是相互隔离、互不可见的。

镜像自身是只读的，容器从镜像启动的时候，Docker会在镜像的最上层创建一个可写层，镜像本身将保持不变。

（目前就可以把这容器解为就是一个简易的Linuх系统）
- **仓库（Repository）** ：仓库就是存放镜像的地方。

Docker仓库类似与代码仓库，就是Docker集中存放镜像文件的场所。

根据存储的镜像公开与否，Docker仓库分为公开仓库（`Public`）和私有仓库（`Private`）两种形式。

目前最大的公开仓库是`Docker Hub`（Docker官方镜像仓库），存放了数量庞大的镜像供用户下载。国内的公开仓库包括阿里云，网易云等镜像仓库，可以提供稳定的国内访问（镜像加速）。

Docker也支持用户在本地网络内创建一个只能自己访问的私有仓库。

当用户创建了自己的镜像之后，就可以使用`push`命令，将它上传到指定的公有或则私有仓库。这样用户下次在另一台机器上使用该镜像时，只需将该镜像从仓库`pull`（拉取）下来就可以了。

**镜像和容器的关系：**

## 3、run命令的运行流程

我们以之前运行`hello-world`镜像为例进行说明。

执行`docker run hello-world`命令，运行结果如下：

```java
$ sudo docker run hello-world
# 出现下面显示，证明运行镜像成功
Unable to find image 'hello-world:latest' locally（本地没有找到hello-world镜像）
latest: Pulling（拉取） from library/hello-world（去远程拉取library/hello-world镜像）
1b930d010525: Pull complete（拉取完成） 
Digest: sha256:d1668a9a1f5b42ed3f46b70b9cb7c88fd8bdc8a2d73509bb0041cf436018fbf5
Status: Downloaded newer image for hello-world:latest
#（上面三行是拉取镜像的签名信息）
# 总结：由于本地没有hello-world这个镜像，所以会从远程仓库下载一个hello-world的镜像到本地，并创建容器运行。
Hello from Docker!#（镜像运行起来了）
This message shows that your installation appears to be working correctly.
#（此消息表明您的安装似乎可以正常工作。为了生成此消息，Docker采取了以下步骤：）
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

> 提示：输出这段提示以后，hello-world镜像就会停止运行，容器自动终止。

**run命令的执行的流程图**：

## 4、为什么Docker比VM快

- **（1）Docker有着比虚拟机更少的抽象层。**

由于Docker不需要Hypervisor实现硬件资源虚拟化（就相当于使用VMware创建一个虚拟机的操作），运行在Docker容器上的程序，直接使用的都是实际物理机的硬件资源。因此在CPU、内存利用率上，Docker将会在效率上有明显优势。
- **（2）Docker利用的是宿主机的内核，而不需要Guest OS**。

因此当新建一个容器时，Docker不需要和虚拟机一样重新加载一个操作系统内核。从而避免引寻、加载操作系统内核等，这些比较费时费资源的操作过程。

当新建一个虚拟机时，虚拟机软件需要加载Guest OS，这个新建过程是分钟级别的。而Docker由于直接利用宿主机的操作系统，则省略了这个过程，因此新建一个Docker容器只需要几秒钟。

如下图所示：

Docker与VM对比表：
