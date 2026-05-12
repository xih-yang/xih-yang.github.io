# 10、Docker 实战：Docker start 启动容器
- 来源：https://ddkk.com/zhuanlan/container/docker/2/10.html
- 分类：容器服务
- 分组：教程目录
对于一个已经是停止状态的容器，我们可以重复使用它们，而再次启动它们的命令就是 docker start

```sh
docker start <container_id>
```

我们先使用 docker ps -a 命令看一下所有容器的状态

```sh
[root@ddkk.com ~]# docker ps -a
CONTAINER ID  ...  STATUS                         ...   
cf38bec0c26f  ...  Exited (0) 2 seconds ago       ...
e66458d65564  ...  Up 23 minutes                  ...  
4558b3b54da0  ...  Exited (137) About an hour ago ...   
e08201b591cd  ...  Exited (0) About an hour ago   ...
```

找到那条已经停止的，且用来输出 Hello World 的容器，在我这里是 cf38bec0c26f

我们先使用 docker logs 命令查看容器 cf38bec0c26f 的日志

```sh
[root@ddkk.com ~]#  docker logs cf38bec0c26f
Hello world
```

然后我们就可以使用 docker start 重启这个容器 cf38bec0c26f 了

```sh
[root@ddkk.com ~]# docker start cf38bec0c26f
cf38bec0c26f
```

docker start 返回的是启动的容器的 ID，至于容器的日志，会统一保存到 Docker logs 中

然后我们就可以使用 docker logs 命令查看刚刚容器的输出

```sh
[root@ddkk.com ~]#  docker logs cf38bec0c26f
Hello world
Hello world
```

更多docker start 命令使用方法，可以访问 docker start 命令

## docker start vs docker run

docker run 和 docker start 看起来好像都是启动一个容器，但它们是有本质区别的

**1、** dockerrun从一个镜像启动一个容器，多次运行同样的命令会创建多个容器；

**2、** dockerstart从一个容器ID启动一个容器，多次启动同一个容器的ID的结果都一样；
