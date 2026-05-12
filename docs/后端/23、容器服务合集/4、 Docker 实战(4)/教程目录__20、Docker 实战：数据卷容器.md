# 20、Docker 实战：数据卷容器
- 来源：https://ddkk.com/zhuanlan/container/docker/4/20.html
- 分类：容器服务
- 分组：教程目录
### 数据卷容器

什么是数据卷容器？

容器和容器之间实现数据共享

- 一个容器先于宿主机创建挂载方式，宿主机就会有改卷的目录
- 第二个容器使用命令--volumes-from 第一个容器，共享使用了第一个容器与宿主机创建的卷。第一个容器就被称之为数据卷容器
- 第三个容器使用命令--volumes-from 第一个容器，共享使用了第一个容器与宿主机创建的卷
- ……

总结：数据卷容器，实际上是第一个容器跟宿主机创建了卷，其他容器通过第一个容器使用这个卷。

- 类似于具名挂载，具名挂载是-v的时候选择卷名，减少重复输入相同路径，输入卷名就可以。
- 而这个是先让第一个跟宿主机先创建卷，通过--volumes-from这个容器名，来使用这个卷
- 区别就是，具名挂载：-v 卷名；数据卷容器挂载：--volumes-from 容器名
- 数据卷容器的生命周期一直持续到没有容器使用为止，虽然容器不在了，卷以及本地目录还在，但这种方式叫做**数据卷**“**容器**”
- 换汤不换药，仅仅是我个人理解，不喜忽喷

```java
#docker01容器，后面docker02、docker03都会--volumes-from docker01；因此docker01就是一个数据卷容器
[root@ddkk.com ~]# docker images
REPOSITORY            TAG       IMAGE ID       CREATED        SIZE
centos                latest    300e315adb2f   8 months ago   209MB
# 启动镜像，创建容器，使用匿名挂载方式，容器挂载路径为容器根目录下的volume文件夹
[root@ddkk.com ~]# docker run -it --name docker01 -v /volume 300e315adb2f /bin/bash
[root@7b7b500a1959 /]# ls
bin  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var  volume
[root@7b7b500a1959 /]# cd volume/
[root@7b7b500a1959 volume]# touch ceshi.java
[root@7b7b500a1959 volume]# ls
ceshi.java
[root@7b7b500a1959 volume]# 
```

```java
#docker02容器，--volumes-from docker01；
```

```java
[root@ddkk.com ~]# docker run -it --name docker02 --volumes-from docker01 300e315adb2f /bin/bash
[root@259ffb447fc3 /]# ls
bin  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var  volume
[root@259ffb447fc3 /]# ls /volume/
ceshi.java
```

```java
#docker03容器，--volumes-from docker01；
```

```java
[root@ddkk.com ~]# docker run -it --name docker03 --volumes-from docker01 300e315adb2f /bin/bash
[root@ecb8e7443ea2 /]# ls
bin  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var  volume
[root@ecb8e7443ea2 /]# ls volume/
ceshi.java
```

```java
# 思考！，删除数据卷容器docker1后，docker02和docker03是否还看可以访问这个目录？
# 当然可以，我就不试了，你把docker1删了，但是卷还在，所以对其他两个没有任何影响；
# 如果我们使用命令volume rm 把卷删了，会发生什么情况？猜一下，docker01自身这个目录应该是在的，但是另外两个容器访问不了，因为毕竟是docker01将自己的volume目录贡献出去的。（文首总结内容是根据猜想来的）
```

```java
[root@ddkk.com ~]# docker ps -a
CONTAINER ID   IMAGE                  COMMAND                  CREATED          STATUS                       PORTS                                                  NAMES
ecb8e7443ea2   300e315adb2f           "/bin/bash"              37 minutes ago   Exited (130) 9 minutes ago                                                          docker03
259ffb447fc3   300e315adb2f           "/bin/bash"              37 minutes ago   Exited (0) 9 minutes ago                                                            docker02
7b7b500a1959   300e315adb2f           "/bin/bash"              40 minutes ago   Exited (0) 11 minutes ago                                                           docker01
# 查看docker01容器详细信息，获取卷的名称
[root@ddkk.com ~]# docker inspect 7b7b500a1959
```

```java
#找到了开始删除，发现删不掉，加了强删除-f，依旧不行，提示有容器在使用
#把docker01、docker02、docker三个容器都stop掉，哎，还是删不掉
[root@ddkk.com ~]# docker volume rm -f 88cedeabc85d030bfcab43f03f5aabbea99a7f4c4f211cd691ee492cb160f9c8
Error response from daemon: remove 88cedeabc85d030bfcab43f03f5aabbea99a7f4c4f211cd691ee492cb160f9c8: volume is in use - [ecb8e7443ea251a0383ededfa6306fdf24b05b6194985da5a3fd880af1f5f53a, 7b7b500a19592b72943b28badf6a95d04937d3e363936e4c7775f9c44aae61d1, 259ffb447fc3e7abe0868f7da606bd988fbf7582ee96ec21dbf075c6cfdb6165]
#分别查看另外两个容器的挂载信息，发现另外两个容器的卷都是88cedeabc85d030bfcab43f03f5aabbea99a7f4c4f211cd691ee492cb160f9c8
[root@ddkk.com ~]# docker inspect ecb8e7443ea251a0383ededfa6306fdf24b05b6194985da5a3fd880af1f5f53a
[root@ddkk.com ~]# docker inspect 259ffb447fc3e7abe0868f7da606bd988fbf7582ee96ec21dbf075c6cfdb6165
```

```java
# 分析，相当于docker02、docker03虽然是通过--volume from docker01 实现数据同步的；但是各自都同步了这个目录；docker01数据容器卷就可以理解为具名挂载的卷名。通过实践证明，文首总结的内容。
# 删哪个容器这个目录以及文件都在，即使三个容器全删完了都还在，因为宿主机还有。妙啊！！！
```

### 需求：多个mysql同步数据

```java
[root@ddkk.com ~]# docker run -d -p 3310:3306 --name mysql01 -v /home/mysql/conf:/etc/mysql/conf.d  -v /home/mysql/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=123456 mysql:5.7
```

```java
[root@ddkk.com ~]# docker run -d -p 3310:3306 --name mysql02 --volumesfrom-mysql01 -e MYSQL_ROOT_PASSWORD=123456 mysql:5.7
```

```java
[root@ddkk.com ~]# docker run -d -p 3310:3306 --name mysql03 --volumesfrom-mysql01 -e MYSQL_ROOT_PASSWORD=123456 mysql:5.7
# 这个时候三个数据库容器的数据就实现同步了
```
