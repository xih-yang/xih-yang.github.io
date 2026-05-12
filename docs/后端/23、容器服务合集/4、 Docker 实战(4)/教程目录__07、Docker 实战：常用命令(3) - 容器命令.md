# 07、Docker 实战：常用命令(3) | 容器命令
- 来源：https://ddkk.com/zhuanlan/container/docker/4/7.html
- 分类：容器服务
- 分组：教程目录
### 容器命令

**说明：** 有了镜像才可以创建容器；下载一个centos镜像进行练习，相当于在Linux里面再见一个Linux虚拟机

```java
[root@ddkk.com ~]# docker pull centos
```

**新建容器并启动**

```java
[root@ddkk.com ~]# docker run [可选参数] image
# 参数说明
--name="Name"　　容器的名字；比如：tomcat01，tomcat02，用来区分容器
-d　　　　　　　　 后台方式运行，类似于Linux的nohup &
-it　　　　　　　　使用交互方式运行，进入容器查看内容
-p　　　　　　　　 指定容器的端口  -p 8080:8080
　　-p ip:主机端口:容器端口
　　-p 主机端口:容器端口（常用）
　　容器端口
-P　　　　　　　　 随机指定端口
# 测试，启动并进入容器；（进入Linux控制台，默认在/bin目录下，使用bash命令）
[root@ddkk.com ~]# docker run -it centos /bin/bash
[root@9f3df8fc8a40 /]# ls 查看容器内的centos；下载的镜像是基础版本，很多命令都是不完善的
bin dev etc home lib lib64 lost+found media mnt opt proc root run sbin srv sys tmp usr var
#从容器中退回主机
[root@9f3df8fc8a40 /]# exit
exit
[root@ddkk.com ~]# ls
公共  模板  视频  图片  文档  下载  音乐  桌面  anaconda-ks.cfg  initial-setup-ks.cfg
```

**列出所有运行的容器**

```java
# docker ps 命令
        列出当前正在运行的容器
-a      列出当前正在运行的容器+带出历史运行过的容器
-n=？   显示？条最近创建的容器
-q      只显示容器的编号
[root@ddkk.com ~]# docker ps
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
[root@ddkk.com ~]# docker ps -a
CONTAINER ID   IMAGE          COMMAND       CREATED          STATUS                     PORTS     NAMES
9f3df8fc8a40   centos         "/bin/bash"   10 minutes ago   Exited (0) 4 minutes ago             confident_volhard
96ccf3a67298   d1165f221234   "/hello"      8 hours ago      Exited (0) 8 hours ago               amazing_vaughan
```

**退出容器**

```java
exit   直接容器停止并退出
Ctrl+P+Q   容器不停止退出
```

**删除容器**

```java
[root@ddkk.com ~]# docker rm 容器id　　#删除指定的容器；不能删除正在运行的容器，如果要强制删除 rm -f
[root@ddkk.com ~]# docker rm -f $(docker ps -aq)　　#删除所有的容器
[root@ddkk.com ~]# docker ps -aq | xargs docker rm -f　　#通过Linux的管道符以及xargs，删除所有容器
```

**启动和停止容器的操作**

```java
[root@ddkk.com ~]# docker start 容器id　　#启动容器
[root@ddkk.com ~]# docker restart 容器id　　#重启容器
[root@ddkk.com ~]# docker stop 容器id　　　　#停止当前正在运行的容器
[root@ddkk.com ~]# docker kill 容器id　　#强制停止当前正在运行容器
[root@ddkk.com ~]# docker kill $(docker ps -aq)　　#停止所有容器
[root@ddkk.com ~]# docker start $(docker ps -aq)　　#启动所有容器
```
