# 18、Docker 实战：具名挂载和匿名挂载
- 来源：https://ddkk.com/zhuanlan/container/docker/4/18.html
- 分类：容器服务
- 分组：教程目录
### 容器数据卷挂载方式

- 容器的数据卷可以看成就是容器的挂载方式；一个宿主机有多个容器，多个容器挂载方式不同，因此宿主机就有多个卷
- 每一个挂载方式在宿主机上都有一个名称，即卷名
- 宿主机如何查看这些卷，对使用匿名以及具名挂载的，没有给出宿主机路径的挂载方式，如何查看在本地的映射目录；对这些挂载方式（容器数据卷）如何管理，添加、删除等：

```java
#命令，查看容器的数据卷（简称卷）
docker volume 选项
#选项
[root@ddkk.com ~]# docker volume --help
Usage: docker volume COMMAND
Manage volumes
Commands:
create      Create a volume　　#常用，创建卷
inspect     Display detailed information on one or more volumes　　#常用，显示一个或多个卷的详细信息，可以查看卷在宿主机的挂载路径等信息
ls          List volumes　　#常用，列出宿主机所有卷
prune       Remove all unused local volumes　　#删除从未使用的卷
rm          Remove one or more volumes　　#常用，删除一个或多个卷；比如之前是一个只读的卷，现在需要可以编辑，可以通过删除，新增的方式
Run 'docker volume COMMAND --help' for more information on a command.
#具体选项里面还有子选项，比如creat，具体大家可以看下官网https://docs.docker.com/engine/reference/commandline/volume/
```

容器数据卷通过选项-v进行挂载，有三种挂载方式：

- 具名挂载
- 匿名挂载
- 路径挂载；这个前面的[MySQL同步数据](/zhuanlan/container/docker/4/17.html)以及[容器数据卷的使用](/zhuanlan/container/docker/4/16.html)都是路径挂载

### 具名和匿名挂载

**匿名挂载**

```java
# 匿名挂载
-v 容器内路径
docker run -d -P --name nginx01 -v /etc/nginx nginx
# 查看所有的卷(volume)的情况
[root@ddkk.com ~]# docker volume ls
DRIVER    VOLUME NAME
local     1c19af3018726ca5cd78efc57e2a31f8ceb8b811c20b958b8803d6c4f439788a
# 查看匿名挂载卷的挂载路径
[root@ddkk.com ~]# docker volume inspect 1c19af3018726ca5cd78efc57e2a31f8ceb8b811c20b958b8803d6c4f439788a
[
{
"CreatedAt": "2021-08-26T15:32:08+08:00",
"Driver": "local",
"Labels": null,
"Mountpoint": "/var/lib/docker/volumes/1c19af3018726ca5cd78efc57e2a31f8ceb8b811c20b958b8803d6c4f439788a/_data",　　#宿主机挂载路径
"Name": "1c19af3018726ca5cd78efc57e2a31f8ceb8b811c20b958b8803d6c4f439788a",
"Options": null,
"Scope": "local"
}
]
#这里发现，匿名这种挂载，我们在-v 只写了容器内的路径，没有写容器外的路径；匿名卷的卷名都是随机的一串数字
```

```java
# 问题？
# 我们知道卷就是容器的挂载方式，我现在有一个需求，我要装10个容器，宿主机和容器上的挂载路径都在各自/home目录下，难道我每run一个的时候加一下-v 宿主机路径:容器内路径  频繁的输入路径？
# 上述问题可以通过docker volume creat 建一个通用的卷（挂载方式），run的时候加上卷名即可（卷名没有的，自动新增），这就是具名挂载。
# docker volume creat新建用的比较少，一般直接run的时候定义卷名，没有就自动生成，下次可以不断复用
```

**具名挂载(经常用)**

```java
# 具名挂载
# -v 卷名:容器内路径
[root@ddkk.com ~]# docker run -d -P -v juming:/etc/nginx --name nginx007 nginx
db303069c9a62acdcf0ea26f4b53036b0022c7d0ddd4a068f4a41c2d690a527b
[root@ddkk.com ~]# docker volume ls
DRIVER    VOLUME NAME
local     1c19af3018726ca5cd78efc57e2a31f8ceb8b811c20b958b8803d6c4f439788a
local     juming
[root@ddkk.com ~]# docker volume inspect juming
[
{
"CreatedAt": "2021-08-26T20:01:45+08:00",
"Driver": "local",
"Labels": null,
"Mountpoint": "/var/lib/docker/volumes/juming/_data",　　　　#宿主机挂载路径
"Name": "juming",
"Options": null,
"Scope": "local"
}
]
```

****

**总结**

所有的docker容器内的卷，宿主机没有指定目录的情况下都是在 /var/lib/docker/volumes/xxxxx/_data

我们通过具名挂载可以方便的找到我们的一个卷，大多数情况下使用的具名挂载

```java
# 如何确定是具名挂载还是匿名挂载，还是指定路径挂载
-v 容器路径   匿名挂载
-v 卷名:容器内路径   具名挂载
-v /宿主机路径:容器内路径   指定路径挂载
```

**拓展**

```java
# 命令
-v 容器内路径:ro(或者rw)    改变读写权限
ro    readonly   只读
rw    readwrite   可读可写
# 一旦这个设置了权限，容器对我们挂载出来的内容就有了限定了
docker run -d -P --name nginx02 -v juming-nginx:/etc/nginx:ro nginx
docker run -d -P --name nginx02 -v juming-nginx:/etc/nginx:rw nginx
# ro 只要看到ro就说明这个路径只能通过宿主机来操作，容器内部是无法操作的！
```
