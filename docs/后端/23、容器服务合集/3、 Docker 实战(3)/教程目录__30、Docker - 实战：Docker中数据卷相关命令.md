# 30、Docker - 实战：Docker中数据卷相关命令
- 来源：https://ddkk.com/zhuanlan/container/docker/3/30.html
- 分类：容器服务
- 分组：教程目录
`Volume`：即数据卷。

- Docker Volume命令能让容器从宿主主机中读取文件，或从容器中持久化数据到宿主主机内，让容器与容器产生的数据分离开来，一个容器可以挂载多个不同的目录。
- Volume的生命周期是独立于容器的生命周期之外的，即使容器删除了，Volume（数据卷）也会被保留下来，Docker也不会因为这个Volume（数据卷）没有被容器使用而回收。
- 在容器中，添加或修改这个文件夹里的文件也不会影响容器的联合文件系统。

## 1、Volume命令说明

通过`docker volume --help`可以查看`Volume`命令的详细说明，如下：

```java
[root@192 ~]# docker volume --help
Usage:  docker volume COMMAND
Manage volumes
Commands:
  create      Create a volume 创建一个数据卷
  inspect     打印一个或多个数据卷的详细信息
  ls          List volumes 列出所有数据卷
  prune       Remove all unused local volumes 删除所有未使用的数据卷
  rm          Remove one or more volumes 删除一个或多个数据卷
```

> 提示：
>
> Run 'docker volume COMMAND --help' for more information on a command.
>
> 执行docker volume COMMAND --help可以查看具体命令的详细说明。

## 2、Volume命令的使用

### （1）创建数据卷

命令：`docker volume create 自定义名称`

```java
[root@192 ~]# docker volume create myVolume
myVolume
[root@192 ~]# 
```

### （2）查看本地数据卷列表

命令：`docker volume ls`

```java
[root@192 ~]# docker volume ls
DRIVER    VOLUME NAME
# 下面三个volume是之前练习时所创建的数据卷挂载，提示这样的volume叫匿名挂载
local     0feb6247c783f1b3620b9dff44ace0c4f4071bc7470b55472f87701c916866ad
local     1d729d58cebf058fa9b14022ddd5211d1690fe6c9084e5c0576bb52743c170c1
local     45ae2157b3cd4ea4b04f2308cbb8562f46d56e9cb19a7aedb6391d35c44ac9b9
# 这个是我们上面刚刚创建的数据卷
local     myVolume
```

### （3）打印myVolume数据卷的详细信息

命令：`docker volume inspect 一个或多个Volume名称`

```java
[root@192 ~]# docker volume inspect myVolume
[
    {
        "CreatedAt": "2021-03-19T15:13:50+08:00",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/myVolume/_data",
        "Name": "myVolume",
        "Options": {},
        "Scope": "local"
    }
]
```

**说明：**

- 每创建一个Volume，Docker默认会在宿主机的/var/lib/docker/volumes/目录下创建一个子目录，默认情况下目录名是一串UUID。
- 如果指定了名称，则目录名是Volume名称（例如上面的myVolume）。Volume里的数据都存储在这个子目录的_data目录下。
- MountPoint属性标识了，该数据卷在宿主机上的路径为/var/lib/docker/volumes/myVolume/_data，

`Name`属性标识了，数据卷的名称为`myVolume`。

之后我们可以把这个数据卷挂载到一个新的容器中，例如Nginx容器。

执行如下命令：

```java
docker run --rm \
--name Nginx01 \
-p 80:80 \
-v myVolume:/usr/share/nginx/html:ro \
-d nginx
```

说明：

- --rm：容器停止后删除该容器。
- --name Nginx01：给容器命名。
- -p 80:80：端口映射。
- -v myVolume:/usr/share/nginx/html:ro：配置刚创建的数据卷到新启动的容器。ro：只读。
- -d nginx：后台运行该容器。

> 提示：这里主要是说明Docker Volume命令如何使用，在实际的工作用一般情况下都使用-v配置容器的数据卷挂载。

### （4）删除数据卷

命令：`docker volume rm 一个或多个Volume名称`

```java
# 删除myVolume数据卷
[root@192 ~]# docker volume rm myVolume
myVolume
# 查看本地数据卷
[root@192 ~]# docker volume ls
DRIVER    VOLUME NAME
local     0feb6247c783f1b3620b9dff44ace0c4f4071bc7470b55472f87701c916866ad
local     1d729d58cebf058fa9b14022ddd5211d1690fe6c9084e5c0576bb52743c170c1
local     45ae2157b3cd4ea4b04f2308cbb8562f46d56e9cb19a7aedb6391d35c44ac9b9
[root@192 ~]#
```

### （5）删除所有未使用的数据卷

命令：`docker volume prune`

```java
# 删除所有未使用的数据卷
[root@192 ~]# docker volume prune
WARNING! This will remove all local volumes not used by at least one container.
Are you sure you want to continue? [y/N] y 你确定你要继续吗？
Deleted Volumes: 删除的数据卷
0feb6247c783f1b3620b9dff44ace0c4f4071bc7470b55472f87701c916866ad
45ae2157b3cd4ea4b04f2308cbb8562f46d56e9cb19a7aedb6391d35c44ac9b9
1d729d58cebf058fa9b14022ddd5211d1690fe6c9084e5c0576bb52743c170c1
Total reclaimed space: 207MB 回收总空间：207MB
# 查看本地的数据，发现一个都没有了。
[root@192 ~]# docker volume ls
DRIVER    VOLUME NAME
[root@192 ~]#
```

提示：只要该数据卷没有被正在运行的容器使用，都会被清楚。

## 3、具名挂载和匿名挂载

### （1）匿名挂载

匿名挂载格式：`-v /容器内路径`或者`-v /宿主机路径:/容器内路径`

执行命令如下：

```java
docker run -P --name nginx01 \ 大P随机指定端口
-v /ect/nginx \ 匿名挂载
-d nginx 
```

此时查看本地`Volume`列表：

```java
[root@192 ~]# docker volume ls
DRIVER    VOLUME NAME
local     9c4f90cee862dc2c79246c9d1f01119c2ae9082a50f22e12f8b69b9496e3595b
[root@192 ~]# 
```

这个一长串的UUID就是，就是该`Volume`没有名字，称为匿名挂载。

可以使用`docker volume inspect UUID`来查看这个`Volume`的详细信息

```java
[root@192 ~]#  docker volume inspect 9c4f90cee862dc2c79246c9d1f01119c2ae9082a50f22e12f8b69b9496e3595b
[
    {
        "CreatedAt": "2021-03-19T16:35:13+08:00",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/9c4f90cee862dc2c79246c9d1f01119c2ae9082a50f22e12f8b69b9496e3595b/_data",
        "Name": "9c4f90cee862dc2c79246c9d1f01119c2ae9082a50f22e12f8b69b9496e3595b",
        "Options": null,
        "Scope": "local"
    }
]
```

### （2）具名挂载

具名挂载格式：`-v volume名称:/容器内路径`或者`-v volume名称:/宿主机路径:/容器内路径`

执行命令如下：

```java
docker run -P --name nginx02 \ 大P随机指定端口
-v juming-nginx:/ect/nginx \ 匿名挂载
-d nginx 
```

此时查看本地`Volume`列表：

```java
[root@192 ~]# docker volume ls
DRIVER    VOLUME NAME
local     9c4f90cee862dc2c79246c9d1f01119c2ae9082a50f22e12f8b69b9496e3595b
local     juming-nginx
[root@192 ~]# 
```

我们得到的就是一个具有具体名称的`Volume`。

我们通过具名挂载可以方便的找到某一个数据卷，一般情况下都使用具名挂载。

### （3）Docker容器数据卷的默认挂载位置

所有的Docker容器内的卷，在没有指定宿主机目录的情况下，都是在宿主机的`/var/nib/docker/vilumes/xxxx/data`目录位置挂载数据。

```java
# 进入宿主机docker目录/var/lib/docker/，
# docker的东西都在这个目录中。
[root@192 ~]# cd /var/lib/docker/
[root@192 docker]# ll
总用量 12
drwx--x--x.  4 root root  120 3月  15 02:00 buildkit
drwx-----x.  4 root root  150 3月  19 16:47 containers
drwx------.  3 root root   22 3月  15 02:00 image
drwxr-x---.  3 root root   19 3月  15 02:00 network
drwx-----x. 23 root root 8192 3月  19 16:47 overlay2
drwx------.  4 root root   32 3月  15 02:00 plugins
drwx------.  2 root root    6 3月  19 12:07 runtimes
drwx------.  2 root root    6 3月  15 02:00 swarm
drwx------.  2 root root    6 3月  19 16:30 tmp
drwx------.  2 root root    6 3月  15 02:00 trust
drwx-----x.  4 root root  142 3月  19 16:47 volumes
# 查看volumes目录，里边存放的都收本地Docker中的数据卷
[root@192 docker]# ll volumes/
总用量 24
drwx-----x. 3 root root     19 3月  19 16:35 9c4f90cee862dc2c79246c9d1f01119c2ae9082a50f22e12f8b69b9496e3595b
drwx-----x. 3 root root     19 3月  19 16:47 juming-nginx
-rw-------. 1 root root  32768 3月  19 16:47 metadata.db
# 进入juming-nginx中的_data目录就能看到nginx的配置文件nginx.conf
[root@192 docker]# cd volumes/juming-nginx/_data/
[root@192 _data]# ls
conf.d  fastcgi_params  koi-utf  koi-win  mime.types  modules  nginx.conf  scgi_params  uwsgi_params  win-utf
[root@192 _data]#
```
