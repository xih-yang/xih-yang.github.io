# 06、Docker 实战：常用命令(2) | 镜像命令
- 来源：https://ddkk.com/zhuanlan/container/docker/4/6.html
- 分类：容器服务
- 分组：教程目录
### 准备工作

- 知道查看官方文档，官方文档描述的很详细，并且每一种类型。每一个命令的选项都有例子
- 会使用docker --help查看

### 镜像命令

**docker images　查看所有本地主机上的镜像**

```java
[root@ddkk.com ~]# docker images
REPOSITORY    TAG       IMAGE ID       CREATED        SIZE
hello-world   latest    d1165f221234   5 months ago   13.3kB
# 解释
REPOSITORY        镜像的仓库源
TAG               镜像的标签；版本
IMAGE ID          镜像的id
CREATED           镜像的创建时间
SIZE              镜像的大小
# 可选项
  -a, --all         列出所有的镜像
  -q, --quiet        只显示镜像的id
```

**docker search　搜索镜像**

```java
[root@ddkk.com ~]# docker search mysql
NAME                              DESCRIPTION                                     STARS     OFFICIAL   AUTOMATED
mysql                             MySQL is a widely used, open-source relation…   11315     [OK]       
mariadb                           MariaDB Server is a high performing open sou…   4302      [OK] 
#可选项，通过收藏来过滤
--filter=STARS=3000　　#搜索出来的镜像就是STARS大于3000的
[root@ddkk.com ~]# docker search mysql --filter=STARS=5000
NAME      DESCRIPTION                                    STARS     OFFICIAL   AUTOMATED
mysql     MySQL is a widely used, open-source relation…   11315     [OK]
```

**docker pull　下载镜像**

```java
# 下载镜像 docker pull 镜像名[:tag]
[root@ddkk.com ~]# docker pull mysql
Using default tag: latest　　#如果不写tag，默认就是latest最新的
latest: Pulling from library/mysql　　
e1acddbe380c: Pull complete 　　#分层下载，docker image的核心  联合文件系统
bed879327370: Pull complete 
03285f80bafd: Pull complete 
ccc17412a00a: Pull complete 
1f556ecc09d1: Pull complete 
adc5528e468d: Pull complete 
1afc286d5d53: Pull complete 
6c724a59adff: Pull complete 
0f2345f8b0a3: Pull complete 
c8461a25b23b: Pull complete 
3adb49279bed: Pull complete 
77f22cd6c363: Pull complete 
Digest: sha256:d45561a65aba6edac77be36e0a53f0c1fba67b951cb728348522b671ad63f926　　#签名，防伪
Status: Downloaded newer image for mysql:latest
docker.io/library/mysql:latest　#真实地址
#等价于它
docker pull mysql
docker pull docker.io/library/mysql:latest
```

****

```java
# 指定版本下载，仓库指定的tag必须得存在
```

```java
[root@ddkk.com ~]# docker pull mysql:5.7
5.7: Pulling from library/mysql
e1acddbe380c: Already exists
bed879327370: Already exists
03285f80bafd: Already exists
ccc17412a00a: Already exists
1f556ecc09d1: Already exists
adc5528e468d: Already exists
1afc286d5d53: Already exists
4d2d9261e3ad: Pull complete
ac609d7b31f8: Pull complete
53ee1339bc3a: Pull complete
b0c0a831a707: Pull complete
Digest: sha256:7cf2e7d7ff876f93c8601406a5aa17484e6623875e64e7acc71432ad8e0a3d7e
Status: Downloaded newer image for mysql:5.7
  docker.io/library/mysql:5.7
```

```java

```

**docker rmi　删除镜像**

```java
[root@ddkk.com ~]# docker rmi -f 镜像id　　#删除指定得镜像
[root@ddkk.com ~]# docker rmi -f 镜像1id 镜像2id 镜像3id　　#删除多个镜像
[root@ddkk.com ~]# docker rmi -f $(docker images -aq)　　删除全部镜像，$()就好像Linux得管道符一样
```
