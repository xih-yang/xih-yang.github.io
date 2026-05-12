# 08、Docker 实战：Docker top 查看容器进程
- 来源：https://ddkk.com/zhuanlan/container/docker/2/8.html
- 分类：容器服务
- 分组：教程目录
作为运维开发人员，我们可能需要经常查看容器的有哪些进程，和每个进程在执行什么任务

这个在Docker 容器中非常简单，只要使用 docker top 命令即可

```sh
docker top <container_id>
```

我们先使用 docker ps -a 查看一下所有容器的状态 ( 字段有节选 )

```sh
[root@ddkk.com ~]# docker ps -a
CONTAINER ID   STATUS
cf38bec0c26f   Exited (0) 35 minutes ago
e66458d65564   Up About an hour
4558b3b54da0   Exited (137) About an hour ago
e08201b591cd   Exited (0) 2 hours ago
```

然后我们就可以使用 docker top e66458d65564 命令查看容器 e66458d65564 的进程状态了

```sh
[root@ddkk.com ~]# docker top e66458d65564
PID   USER   TIME  COMMAND
3596  root   0:02  /bin/sh -c while true; do echo hello world ; sleep 1; done
7688  root   0:00  sleep 1
```

有字段标题在，每个字段什么意思就不用解释了

如果在一个已经停止的容器上使用 docker top 命令，则会报错

```sh
[root@ddkk.com ~]# docker top e08201b591cd
Error response from daemon: Container e08201b591cdccd198fa32c4eedbda4a9ca6c81ce2c066e885c592aede52a8a6 is not running
```

意思是容器没在运行状态

更多docker top 命令使用方法，可以访问 docker top 命令
