# 09、Docker 实战：常用其他命令(2) | 进入容器和拷贝的命令
- 来源：https://ddkk.com/zhuanlan/container/docker/4/9.html
- 分类：容器服务
- 分组：教程目录
### 进入当前正在运行的容器

```java
#我们通常容器都是使用后台方式运行的，需要进入容器，修改一些配置
#方法一 命令
docker exec -it 容器ID bashShell
#测试
[root@ddkk.com ~]# docker ps
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS          PORTS     NAMES
6a6584c42e03   centos    "/bin/bash -c 'while…"   20 minutes ago   Up 19 minutes             inspiring_sanderson
[root@ddkk.com ~]# docker exec -it 6a6584c42e03 /bin/bash
[root@6a6584c42e03 /]# ls
bin  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
[root@6a6584c42e03 /]# ps -ef
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  0 10:58 ?        00:00:00 /bin/bash -c while true;do echo gelaotou;sleep 2;done
root         707       0  0 11:22 pts/0    00:00:00 /bin/bash
root         726       1  0 11:22 ?        00:00:00 /usr/bin/coreutils --coreutils-prog-shebang=sleep /usr/bin/sleep 2
root         727     707  0 11:22 pts/0    00:00:00 ps -ef
#方式二 命令
docker attach 容器ID
#测试
[root@ddkk.com ~]# docker attach 6a6584c42e03
#正在执行的代码
gelaotou
gelaotou
```

```java
# docker exec　　　　#进入容器后开启一个新的终端，可以在里面操作（常用）
# docker attach    进入容器正在执行的终端，不会启动新的进程
```

### 从容器内拷贝文件到主机上

```java
#命令
docker cp 容器ID：容器内路径 目的地主机路径
#测试
#查看当前主机目录
[root@ddkk.com ~]# ls
公共  模板  视频  图片  文档  下载  音乐  桌面  anaconda-ks.cfg  initial-setup-ks.cfg
[root@ddkk.com ~]# docker ps -a
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
#创建容器，容器内用户家目录下创建文件
[root@ddkk.com ~]# docker run -it centos /bin/bash
[root@e88decf20b06 /]# ls
bin  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
[root@e88decf20b06 /]# cd
[root@e88decf20b06 ~]# ls
anaconda-ks.cfg  anaconda-post.log  original-ks.cfg
[root@e88decf20b06 ~]# touch gelaotou.text
[root@e88decf20b06 ~]# exit
exit
[root@ddkk.com ~]# docker ps -a
CONTAINER ID   IMAGE     COMMAND       CREATED          STATUS                      PORTS     NAMES
e88decf20b06   centos    "/bin/bash"   56 seconds ago   Exited (0) 16 seconds ago             gallant_chaplygin
#将文件拷贝出来到主机上
[root@ddkk.com ~]# docker cp e88decf20b06:/root/gelaotou.text /root
[root@ddkk.com ~]# ls
公共  模板  视频  图片  文档  下载  音乐  桌面  anaconda-ks.cfg  gelaotou.text  initial-setup-ks.cfg
#拷贝是一个手动过程，后面笔记，会有使用-v卷的技术，可以实现主机目录和容器目录打通同步
```
