# 19、Docker 实战：数据卷之Dockerfile
- 来源：https://ddkk.com/zhuanlan/container/docker/4/19.html
- 分类：容器服务
- 分组：教程目录
## 初识Dockerfile

Dockerfile就是用来构建docker镜像的构建文件！命令脚本！

通过这个脚本生成镜像，镜像是一层一层的，脚本与一个个的命令，每个命令都是一层！

```java
# 创建一个dockerfile文件，名字可以随机，建议Dockerfile
# 文件中的内容主要有两部分：指令（大写）、参数
# 👇文件内容
FROM centos
VOLUME ["volume01","volume02"]
CMD echo "----END----"
CMD /bin/bash
# 这里的每个命令，就是镜像的一层！
```

```java
# build构建Dockerfile文件，生成镜像
# build 构建命令，详细见官网https://docs.docker.com/engine/reference/commandline/build/
　　-f　　#Dockerfile 的名称（默认为“PATH/Dockerfile”即具体路径/文件名）
　　-t　　#镜像的名称和标签，格式为 “名称：标签”，其中标签为可选
# . 表示当前目录，这个.暂时就当它是build命令结尾必须有的，后面笔记会讲到具体含义
[root@ddkk.com docker-test-volume]# docker build -f /home/docker-test-volume/dockerfile01 -t gelaotou/centos:1.0 .
```

```java
# 启动我们自己写的镜像
[root@ddkk.com docker-test-volume]# docker images
REPOSITORY            TAG       IMAGE ID       CREATED         SIZE
gelaotou/centos       1.0       573c82788b4f   9 minutes ago   209MB
tomcat_gelaotou       1.0       fabb99d62dfe   5 hours ago     673MB
tomcat                9.0       266d1269bb29   7 days ago      668MB
tomcat                latest    266d1269bb29   7 days ago      668MB
nginx                 latest    dd34e67e3371   9 days ago      133MB
mysql                 5.7       6c20ffa54f86   9 days ago      448MB
elasticsearch         7.14.0    e347b2b2d6c1   3 weeks ago     1.04GB
portainer/portainer   latest    580c0e4e98b0   5 months ago    79.1MB
centos                latest    300e315adb2f   8 months ago    209MB
[root@ddkk.com docker-test-volume]# docker run -it 573c82788b4f /bin/bash
```

```java
# 这个卷和外部一定有一个同步的目录！
```

```java
#查看容器ID
[root@ddkk.com docker-test-volume]# docker ps -a
CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS                      PORTS                                                  NAMES
e26e6d7e5c4b   573c82788b4f           "/bin/bash"              8 minutes ago   Exited (0) 50 seconds ago                                                          hardcore_noether
#查看容器详细信息
[root@ddkk.com docker-test-volume]# docker inspect e26e6d7e5c4b
# 查看一下挂载的路径，确实是匿名挂载
```

**总结**

- 这种方式我们工作中使用的非常多，因为我们通常会构建自己的镜像！
- 假设构建镜像时，构建镜像脚本Dockerfile中没有VOLUME挂载卷，当我们run 这个脚本构建的镜像的时候，需要手动挂载。-v 卷名:容器内路径
