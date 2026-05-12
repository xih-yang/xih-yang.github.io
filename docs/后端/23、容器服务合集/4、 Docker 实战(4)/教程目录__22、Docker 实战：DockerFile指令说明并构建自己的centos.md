# 22、Docker 实战：DockerFile指令说明并构建自己的centos
- 来源：https://ddkk.com/zhuanlan/container/docker/4/22.html
- 分类：容器服务
- 分组：教程目录
### DockerFile常用指令

### 实战测试

DockerHub中99%镜像都是从这个基础镜像过来的FROM scratch，然后配置需要的软件和配置来进行构建

```java
#创建一个自己的centos
```

```java
# 1.编写DockerFile的文件
[root@ddkk.com dockerfile]# cat mydockerfile-centos 
FROME centos
MAINTAINER gelaotou<893450389@qq.com>
ENV MYPATH /usr/local
WORKDIR $MYPATH
RUN yum -y install vim
RUN yum -y install net-tools
EXPOSE 80
CMD echo $MYPATH
CMD echo "-----end-----"
CMD /bin/bash 
# 2.通过这个文件构建镜像
# 命令 docker build -f dockerfile文件路径 -t 镜像名:[tag]
　　#build命令官方文档：https://docs.docker.com/engine/reference/commandline/build/#git-repositories
　　#-f　　dockerfile文件的路径
　　#-t　　“名称：标签”，其中标签为可选项
　　#.　　 命令结尾的.代表当前的目录，会先在.代表的当前目录下查找dockerfile文件，如果没找到，再去-f 文件路径下去查找
[root@ddkk.com dockerfile]# docker build -f /root/dockerfile/mydockerfile-centos -t my_centos:1.0 .
Successfully built bc8d9427e6a7
Successfully tagged my_centos:1.0
# 3.测试运行
[root@ddkk.com ~]# docker run -it my_centos:1.0
```

对比：之前原生的centos

我们增加之后的镜像

列出镜像的变更历史，从github上拉取一些镜像的时候我们可以自己看一下这个镜像是怎么生成的

```java
#命令
[root@ddkk.com dockerfile]# docker history 镜像ID
```
