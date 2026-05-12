# 21、Docker - 实战：容器常用命令（三）
- 来源：https://ddkk.com/zhuanlan/container/docker/3/21.html
- 分类：容器服务
- 分组：教程目录
## 13、进入正在运行的容器并以命令行交互

我们通常使用容器的方式都是后台运行模式，如果需要进入容器，则有两种方式。

- docker attach 容器ID
- docker exec -it 容器ID /bin/bash（常用）

查询当前虚拟机的镜像。

```java
[root@192 ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
centos       latest    300e315adb2f   3 months ago   209MB
```

启动CentOS镜像，并`ctrl+P+Q`退出容器。

```java
[root@192 ~]# docker run -it 300e315adb2f
[root@31281b319328 /]#
[root@192 ~]#
# 查看当前宿主机中正在运行的容器
[root@192 ~]# docker ps
CONTAINER ID   IMAGE          COMMAND       CREATED         STATUS         PORTS
31281b319328   300e315adb2f   "/bin/bash"   3 minutes ago   Up 3 minutes
```

### （1）方式一

命令：`docker attach 容器ID`

```java
# 通过docker attach进入正在运行的容器中
[root@192 ~]# docker attach 31281b319328
[root@31281b319328 /]# ls 
bin  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
[root@31281b319328 /]# ll
bash: ll: command not found
[root@31281b319328 /]# ls -l
total 0
lrwxrwxrwx.   1 root root   7 Nov  3 15:22 bin -> usr/bin
drwxr-xr-x.   5 root root 360 Mar 16 12:11 dev
drwxr-xr-x.   1 root root  66 Mar 16 12:11 etc
drwxr-xr-x.   2 root root   6 Nov  3 15:22 home
lrwxrwxrwx.   1 root root   7 Nov  3 15:22 lib -> usr/lib
lrwxrwxrwx.   1 root root   9 Nov  3 15:22 lib64 -> usr/lib64
drwx------.   2 root root   6 Dec  4 17:37 lost+found
drwxr-xr-x.   2 root root   6 Nov  3 15:22 media
drwxr-xr-x.   2 root root   6 Nov  3 15:22 mnt
drwxr-xr-x.   2 root root   6 Nov  3 15:22 opt
dr-xr-xr-x. 124 root root   0 Mar 16 12:11 proc
dr-xr-x---.   2 root root 162 Dec  4 17:37 root
drwxr-xr-x.  11 root root 163 Dec  4 17:37 run
lrwxrwxrwx.   1 root root   8 Nov  3 15:22 sbin -> usr/sbin
drwxr-xr-x.   2 root root   6 Nov  3 15:22 srv
dr-xr-xr-x.  13 root root   0 Mar 16 03:17 sys
drwxrwxrwt.   7 root root 145 Dec  4 17:37 tmp
drwxr-xr-x.  12 root root 144 Dec  4 17:37 usr
drwxr-xr-x.  20 root root 262 Dec  4 17:37 var
[root@31281b319328 /]# pwd
/
```

我们可以看到进入到容器可以正常的执行Linux命令。

> 提示：在启动CentOS镜像的时候，不加/bin/bash也可以，因为默认就是/bin/bash命令格式。

### （2）方式二

命令：`docker exec -it 容器ID /bin/bash`（常用）

注意：这个命令的`/bin/bash`必须加。

```java
# 通过docker exec 进入正在运行的容器中
[root@192 ~]# docker exec -it 31281b319328 /bin/bash
[root@31281b319328 /]#
# 执行Linux命令
[root@31281b319328 /]# pwd
/
[root@31281b319328 /]# ls -l /tmp/
total 8
-rwx------. 1 root root 701 Dec  4 17:37 ks-script-esd4my7v
-rwx------. 1 root root 671 Dec  4 17:37 ks-script-eusq_sc5
```

而`docker exec`命令中可以直接加对容器的操作命令，如下：

```java
# 在docker exec命令的结尾加入ls -l /tmpLinux命令
[root@192 ~]# docker exec -it 31281b319328 ls -l /tmp
total 8
-rwx------. 1 root root 701 Dec  4 17:37 ks-script-esd4my7v
-rwx------. 1 root root 671 Dec  4 17:37 ks-script-eusq_sc5
[root@192 ~]#
```

可以看到

**1、** 在末尾追加Linux命令的时候，不要写`/bin/bash`我写了，执行命令并没有反应；

**2、** Linux命令容器中执行完成后，命令提示符还是会到宿主机上，也就是完成了不关闭容器退出；

### （3）attach和exec的区别

`attach`：

- 不会在容器中创建进程，来执行额外的命令，只是进入到容器中。
- 如果执行exit命令退出容器，容器会停止运行。

`exec`：

- 会在运行的容器上，创建进程，来执行新的命令。
- 如果执行exit命令退出容器，不会导致容器停止运行。

## 14、从容器内拷贝文件到主机上

命令：`docker cp 容器ID:容器内路径 目的主机的路径`

如下图：

示例：

先查看宿主机`/home`目录中的内容：

```java
[root@192 ~]# ll /home/
总用量 0
```

可以看到没有任何文件。

开始从容器内拷贝文件到主机上：

```java
# 1.查看宿主机上的镜像
[root@192 ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
centos       latest    300e315adb2f   3 months ago   209MB
# 2.启动centos镜像
[root@192 ~]# docker run -it centos
# 3.进入容器的/home/目录，查看目录中的内容
[root@f68cb580db71 /]# cd /home/
[root@f68cb580db71 home]# ls -l
total 0
# 4.在容器内的/home/目录中，新建一个文件test.py
[root@f68cb580db71 home]# touch test.py
[root@f68cb580db71 home]# ls -l
total 0
-rw-r--r--. 1 root root 0 Mar 16 13:43 test.py
# 5.将容器内的/home/目录中test.py文件，拷贝到宿主机的/home/目录中
# 5.1 先退回到宿主机上，容器可以是运行状态，也可以是停止状态
[root@f68cb580db71 home]# exit
exit
[root@192 ~]# 
# 5.2 执行拷贝命令，下面命令/home/改文件名，也是可以的。
[root@192 ~]# docker cp f68cb580db71:/home/test.py /home
# 5.3 查看宿主机/home/目录，已经从容器中拷贝过来了test.py文件
[root@192 ~]# ls -l /home/
总用量 0
-rw-r--r--. 1 root root 0 3月  16 21:43 test.py
```

> 提示：
>
> 拷贝是一个手动的过程，未来我们使用-v数据卷的技术，可以实现自动同步。
>
> 比如容器内的/home目录和宿主机的/home目录进行联通同步。

Docker的命令是十分多的，上面我们学习的那些都是最常用的，且关于的容器和镜像的命令，之后我们还会学习很多命令。

## 15、Docker常用命令小结

Docker常用命令图解：

Docker的命令是十分多的，上面图中的命令都是非常常用的命令，之后我们还会学习很多命令。说明如下：

### （1）容器生命周期管理

- run：Run a command in a new container，创建一个新的容器并运行一个命令。
- start：Start a stopped containers，启动容器。
- restart：Restart a running container，重启运行的容器。
- stop：Stop a running containers，停止容器。
- kill：Kill a running container，kill指定Docker容器。
- rm：Remove one or more containers，移除一个或者多个容器。
- pause：Pause all processes within a container，暂停容器。
- unpause：Unpause a paused container，取消暂停容器。
- create：Create a new container，创建一个新的容器，同run，但不启动容器。

### （2）容器操作

- ps：List containers，列出容器列表。
- inspect：Return low-level information on a container，查看容器详细信息。
- top：Lookup the running processes of a container，查看容器中运行的进程信息。
- events：Get real time events from the server，从Docker服务获取容器实时事件。
- exec：Run a command in an existing container，在己存在的容器上运行命令。
- attach命令：Attach to a running container，当前shell下attach连接指定运行容器。
- logs：Fetch the logs of a container，输出当前容器日志信息。
- wait：Block until a container stops，then print its exit code，截取容器停止时的退出状态值。
- export：Stream the contents of a container as a tar archive，导出容器的内容流作为一个tar归档文件[对应import]。
- port：Lookup the public-facing port which is NAT-ed to PRIVATE_PORT，查看映射端口对应的容器内部源端口。

### （3）镜像仓库

- login：Register or Login to the docker registry server，注册或者登陆一个Docker源服务器。
- logout：Log out from a Docker registry server，从当前Docker registry退出。
- pull：Pull an image or a repository from the docker registry server，从Docker镜像源服务器拉取指定镜像或者库镜像。
- push：Push an image or a repository to the docker registry server，推送指定镜像或者库镜像至Docker源服务器。
- search：Search for an image on the Docker Hub，在Docker Hub中搜索镜像。

### （4）容器rootfs命令

- commit：Create a new image from a container changes，提交当前容器为新的镜像。
- cp：Copy files/folders from the containers filesystem to the host path，从容器中拷贝指定文件或者目录到宿主机中。
- diff：Inspect changes on a container's filesystem，查看Docker容器变化。

### （5）本地镜像管理

- images：List images，列出系统当前镜像。
- rmi：Remove one or more images，移除一个或多个镜像[无容器使用该镜像才可删除，否则需删除相关容器才可继续或-f强制删除]。
- tag：Tag an image into a repository，给源中镜像打标签。
- build命令：Build an image from a Dockerfile，通过Dockerfile定制镜像。
- history：Show the history of an image，展示一个镜像形成历史。
- load：Load an image from a tar archive，从一个tar包中加载一个镜像[对应save]。
- save：Save an image to a tar archive，保存一个镜像为一个tar包[对应load]。
- import：Create a new filesystem image from the contents of a tarball，从tar包中的内容创建一个新的文件系统映像[对应export]。

### （6）info|version

- info：Display system-wide information，显示系统相关信息。
- version：Show the docker version information，查看Docker版本号。
