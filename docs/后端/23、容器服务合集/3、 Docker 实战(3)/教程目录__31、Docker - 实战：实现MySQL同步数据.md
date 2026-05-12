# 31、Docker - 实战：实现MySQL同步数据
- 来源：https://ddkk.com/zhuanlan/container/docker/3/31.html
- 分类：容器服务
- 分组：教程目录
## 1、搜索镜像

搜索MySQL镜像，也可以在Docker官方镜像仓库中进行搜索。

下载第一个就可以，是官方镜像`OFFICIAL`。

## 2、拉取镜像

我们就拉取一个MySQL 5.7版本的镜像。

```java
[root@192 ~]# docker pull mysql:5.7
5.7: Pulling from library/mysql
a076a628af6f: Already exists 
f6c208f3f991: Pull complete 
88a9455a9165: Pull complete 
406c9b8427c6: Pull complete 
7c88599c0b25: Pull complete 
25b5c6debdaf: Pull complete 
43a5816f1617: Pull complete 
1831ac1245f4: Pull complete 
37677b8c1f79: Pull complete 
27e4ac3b0f6e: Pull complete 
7227baa8c445: Pull complete 
Digest: sha256:b3d1eff023f698cd433695c9506171f0d08a8f92a0c8063c1a4d9db9a55808df
Status: Downloaded newer image for mysql:5.7
docker.io/library/mysql:5.7
```

## 3、查看镜像

查看本地Docker镜像。

```java
[root@192 ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
mysql        5.7       a70d36bc331a   8 weeks ago    449MB
centos       latest    300e315adb2f   3 months ago   209MB
```

MySQL 5.7 的镜像已经下载到本地了。

## 4、启动镜像

启动MySQL镜像，运行MySQL容器，需要做数据挂载。

执行命令如下：

```java
docker run -p 12345:3306 \
--name mysql-01 \
-v /tmp/mysql/conf:/etc/mysql/conf.d \
-v /tmp/mysql/logs:/logs \
-v /tmp/mysql/data:/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD=123456 \
-d mysql:5.7
```

挂载可以自定义目录，不一定在`/tmp`目录中。

命令说明：

- -p 12345:3306：将主机的12345端口映射到Docker容器的3306端口。（端口映射）
- --name mysql-01：定义运行容器名字。
- -v /tmp/mysql/conf:/etc/mysql/conf.d：将主机/tmp/mysql录下的conf/my.cnf文件，挂载到容器的/etc/mysq/conf.d目录。（数据卷挂载）
- -v /tmp/mysql/logs:/logs：将主机/tmp/mysql目录下的logs目录，挂载到容器的/logs目录。
- -v /tmp/mysql/data:/var/lib/mysql：将主机/tmp/mysql目录下的data目录，挂载到容器的/var/lib/mysql目录
- -e MYSQL_ROOT_PASSWORD=123456：初始化MySQL中root用户的密码。（-e：环境配置）

因为安装启动MySQL，是需要配置密码的，这是要注意点！

通过Docker Hub网站对该镜像的说明，可以看到如下设置密码的命令，

```java
$ docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag
```

我们照着写就可以了。

- -d mysql:5.7：后台程序运行mysql:5.7容器。

> 提示：
>
> Docker挂载主机目录Docker访问出现cannot open directory.：Permission denied（无法打开目录。：权限被拒绝）
>
> 解决办法：在挂载目录后多加一个--privieged=true参数即可。

## 5、操作容器

### （1）在MySQL中创建数据库

进入MySQL容器中进行操作。

上图可以知，新启动的MySQL容器ID为`8f6a77ba4917`。

对容器中的MySQL服务进行操作，如下：

```java
# 进入MySQL容器
[root@192 ~]# docker exec -it 8f6a77ba4917 /bin/bash
root@8f6a77ba4917:/# 
# 1.登陆MySQL
root@8f6a77ba4917:/# mysql -uroot -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 2
Server version: 5.7.33 MySQL Community Server (GPL)
Copyright (c) 2000, 2021, Oracle and/or its affiliates.
Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
mysql>
# 2.查看数据库
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
4 rows in set (0.03 sec)
# 3.创建一个数据库
mysql> create database myDB;
Query OK, 1 row affected (0.01 sec)
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| myDB               |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.00 sec)
# 4.退出数据库
mysql> exit
Bye
root@8f6a77ba4917:/#
```

### （2）外部连接Dokcer容器中的MySQL服务

在外部Win10系统，来连接运行在Dokcer上的MySQL服务。

使用Navicat或者SQLyog都可以。

以Navicat为例，如下图：

点击确定，进入Navicat，点开`dockertest`可以看到我们刚刚手动创建的数据库`myDB`，如下图：

说明我们在外部成功访问到了Docker容器中的MySQL服务。

之后就可以通过远程的第三方软件来操作Docker容器中的MySQL服务了。

> 原理说明：Navicat连接到服务器的12345端口，12345端口和容器内的3306端口映射，这个时候外界就可以连接上Docker容器中的MySQL服务了。

### （3）查看挂载情况

启动MySQL容器时的挂载配置如下：

```java
-v /tmp/mysql/conf:/etc/mysql/conf.d \
-v /tmp/mysql/logs:/logs \
-v /tmp/mysql/data:/var/lib/mysql \
```

进入宿主机的`/tmp/mysql/`目录，查看是否有这三个文件夹。

```java
[root@192 ~]# ll /tmp/mysql/
总用量 4
drwxr-xr-x. 2 root    root    6 3月  19 12:27 conf
drwxr-xr-x. 6 polkitd root 4096 3月  19 12:32 data
drwxr-xr-x. 2 root    root    6 3月  19 12:27 logs
```

说明已经容器数据卷的挂载成功了。

我们进入`data`目录查看内容。

```java
[root@192 ~]# ll /tmp/mysql/data/
总用量 188484
-rw-r-----. 1 polkitd input       56 3月  19 12:27 auto.cnf
-rw-------. 1 polkitd input     1676 3月  19 12:27 ca-key.pem
-rw-r--r--. 1 polkitd input     1112 3月  19 12:27 ca.pem
-rw-r--r--. 1 polkitd input     1112 3月  19 12:27 client-cert.pem
-rw-------. 1 polkitd input     1680 3月  19 12:27 client-key.pem
-rw-r-----. 1 polkitd input     1359 3月  19 12:28 ib_buffer_pool
-rw-r-----. 1 polkitd input 79691776 3月  19 12:28 ibdata1
-rw-r-----. 1 polkitd input 50331648 3月  19 12:28 ib_logfile0
-rw-r-----. 1 polkitd input 50331648 3月  19 12:27 ib_logfile1
-rw-r-----. 1 polkitd input 12582912 3月  19 12:28 ibtmp1
drwxr-x---. 2 polkitd input       20 3月  19 12:32 myDB
drwxr-x---. 2 polkitd input     4096 3月  19 12:28 mysql
drwxr-x---. 2 polkitd input     8192 3月  19 12:28 performance_schema
-rw-------. 1 polkitd input     1676 3月  19 12:28 private_key.pem
-rw-r--r--. 1 polkitd input      452 3月  19 12:28 public_key.pem
-rw-r--r--. 1 polkitd input     1112 3月  19 12:27 server-cert.pem
-rw-------. 1 polkitd input     1676 3月  19 12:27 server-key.pem
drwxr-x---. 2 polkitd input     8192 3月  19 12:28 sys
```

可以看到MySQL服务的数据库都同步到宿主机中，连我们刚刚新创建的`myDB`数据库也同步过来了。

### （4）测试MySQL服务持久化

我们使用第三方软件操作容器中的MySQL服务，创建一个新的数据库`testDB`，看看数据库能否同步到宿主机中。

在Navicat中创建`testDB`数据库，如下图：

然后在宿主机的`/tmp/mysql/data`目录中是否能够查看到。

```java
[root@192 ~]# ll /tmp/mysql/data/
总用量 188484
-rw-r-----. 1 polkitd input       56 3月  19 12:27 auto.cnf
-rw-------. 1 polkitd input     1676 3月  19 12:27 ca-key.pem
-rw-r--r--. 1 polkitd input     1112 3月  19 12:27 ca.pem
-rw-r--r--. 1 polkitd input     1112 3月  19 12:27 client-cert.pem
-rw-------. 1 polkitd input     1680 3月  19 12:27 client-key.pem
-rw-r-----. 1 polkitd input     1359 3月  19 12:28 ib_buffer_pool
-rw-r-----. 1 polkitd input 79691776 3月  19 12:28 ibdata1
-rw-r-----. 1 polkitd input 50331648 3月  19 12:28 ib_logfile0
-rw-r-----. 1 polkitd input 50331648 3月  19 12:27 ib_logfile1
-rw-r-----. 1 polkitd input 12582912 3月  19 12:28 ibtmp1
drwxr-x---. 2 polkitd input       20 3月  19 12:32 myDB
drwxr-x---. 2 polkitd input     4096 3月  19 12:28 mysql
drwxr-x---. 2 polkitd input     8192 3月  19 12:28 performance_schema
-rw-------. 1 polkitd input     1676 3月  19 12:28 private_key.pem
-rw-r--r--. 1 polkitd input      452 3月  19 12:28 public_key.pem
-rw-r--r--. 1 polkitd input     1112 3月  19 12:27 server-cert.pem
-rw-------. 1 polkitd input     1676 3月  19 12:27 server-key.pem
drwxr-x---. 2 polkitd input     8192 3月  19 12:28 sys
drwxr-x---. 2 polkitd input       20 3月  19 12:47 testDB  看这里
```

在宿主机中看到了`testDB`数据库，说明MySQL容器持久化的配置是成功的。

### （5）问题说明

在进行如上操作的时候，我发现`/tmp/mysql/conf/`目录是空的，如下：

```java
[root@192 ~]# ll /tmp/mysql/conf/
总用量 0
```

而且会把MySQL容器中的`/etc/mysql/conf.d`目录也清空，原本mysql 5.7 的`/etc/mysql/conf.d`目录内容如下：

```java
root@6a0bc07a843b:/# ls /etc/mysql/conf.d/
docker.cnf  mysql.cnf  mysqldump.cnf
```

是有三个文件的。

> 说明：
>
>
> MySQL 5.7的默认配置文件是/etc/mysql/my.cnf文件。
> 如果想要自定义配置，建议向 /etc/mysql/conf.d目录中创建.cnf文件。
> 新建的文件可以任意起名，只要保证后缀名是.cnf即可，新建的文件中的配置项可以覆盖 /etc/mysql/my.cnf中的配置项。
> 提示：不同版本的MySQL 镜像，配置文件的位置可能会有不同。

所以`/etc/mysql/conf.d/`目录是空的，我们不需要担心。

如果我们要实现在宿主机进行对容器中MySQL服务的配置，解决的方式有两种

**1、** 手动在宿主机的`/tmp/mysql/conf/`目录（自己配置的目录）创建以`.cnf`后缀的配置文件，然后手动按规则编辑；

**2、** 在启动一个MySQL容器，把上面三个文件拷贝到宿主机，放入到`/tmp/mysql/conf/`目录中，然后在手动进行配置；

### （6）MySQL数据库的数据备份

命令如下：

```java
docker exec mysql 容器ID \
sh -c 'exec mysqldump --all-databases -uroot -p"123456"' > /tmp/mysql/all-databases.sql
```

示例：

先查看MySQL容器是否正在运行，要运行中才能执行数据备份命令。

执行命令：

`docker exec mysql 8f6a77ba4917 \ sh -c 'exec mysqldump --all-databases -uroot -p"123456"' > /tmp/mysql/all-databases.sql`

说明：`mysqldump -u root -p 数据库名 > 导出的数据库文件名`，上面是导出所有数据库到后边的文件中。

这样就可以手动的实现MySQL容器数据库备份到宿主机了。

## 6、停止容器

```java
# 退出容器
root@8f6a77ba4917:/# exit
exit
# 查看当前正在运行的容器
[root@192 ~]# docker ps
CONTAINER ID   IMAGE       COMMAND                  CREATED          STATUS
8f6a77ba4917   mysql:5.7   "docker-entrypoint.s…"   55 minutes ago   Up 55 minutes
# 停止掉mysql:5.7容器
[root@192 ~]# docker stop 8f6a77ba4917
8f6a77ba4917
```

## 7、移除容器

```java
# 查看本地容器
[root@192 ~]# docker ps -a
CONTAINER ID   IMAGE       COMMAND                  CREATED          STATUS
8f6a77ba4917   mysql:5.7   "docker-entrypoint.s…"   58 minutes ago   Exited (0) 2 minutes
# 删除mysql:5.7容器
[root@192 ~]# docker rm 8f6a77ba4917
8f6a77ba4917
# 查看容器是否删除
[root@192 ~]# docker ps -a
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

此时，我们创建的`mysql:5.7`容器已经被停止删除，最后我们在到宿主机的`/tmp/mysql/data`目录中，查看`mysql:5.7`容器持久化数据是否还在。

```java
[root@192 ~]# ll /tmp/mysql/data/
总用量 176196
-rw-r-----. 1 polkitd input       56 3月  19 12:27 auto.cnf
-rw-------. 1 polkitd input     1676 3月  19 12:27 ca-key.pem
-rw-r--r--. 1 polkitd input     1112 3月  19 12:27 ca.pem
-rw-r--r--. 1 polkitd input     1112 3月  19 12:27 client-cert.pem
-rw-------. 1 polkitd input     1680 3月  19 12:27 client-key.pem
-rw-r-----. 1 polkitd input      694 3月  19 13:24 ib_buffer_pool
-rw-r-----. 1 polkitd input 79691776 3月  19 13:24 ibdata1
-rw-r-----. 1 polkitd input 50331648 3月  19 13:24 ib_logfile0
-rw-r-----. 1 polkitd input 50331648 3月  19 12:27 ib_logfile1
drwxr-x---. 2 polkitd input       20 3月  19 12:32 myDB
drwxr-x---. 2 polkitd input     4096 3月  19 12:28 mysql
drwxr-x---. 2 polkitd input     8192 3月  19 12:28 performance_schema
-rw-------. 1 polkitd input     1676 3月  19 12:28 private_key.pem
-rw-r--r--. 1 polkitd input      452 3月  19 12:28 public_key.pem
-rw-r--r--. 1 polkitd input     1112 3月  19 12:27 server-cert.pem
-rw-------. 1 polkitd input     1676 3月  19 12:27 server-key.pem
drwxr-x---. 2 polkitd input     8192 3月  19 12:28 sys
drwxr-x---. 2 polkitd input       20 3月  19 12:47 testDB
```

说明：删除容器，持久化还在。我们挂载到本地的数据卷依旧没有丢失，这就实现了容器数据持久化功能！
