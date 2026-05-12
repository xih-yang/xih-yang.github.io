# 15、Docker 实战：Commit镜像
- 来源：https://ddkk.com/zhuanlan/container/docker/4/15.html
- 分类：容器服务
- 分组：教程目录
```java
docker commit 提交容器成为一个新的副本，有点像套娃
# 命令和git原理类似
docker commit -m="提交的描述信息" -a="作者" 容器id 目标镜像名:[TAG]
```

**实战测试**

```java
#step-1 启动一个默认的tomcat
[root@ddkk.com ~]# docker run -d -p 3355:8080 --name tomcat02 tomcat
57644fa210a03bfea17b961b804bb528a94935700f0074b084b0603f48521889
[root@ddkk.com ~]# docker ps
CONTAINER ID   IMAGE                 COMMAND             CREATED          STATUS          PORTS                                       NAMES
57644fa210a0   tomcat                "catalina.sh run"   15 seconds ago   Up 14 seconds   0.0.0.0:3355->8080/tcp, :::3355->8080/tcp   tomcat02
3b6ca0890fa0   portainer/portainer   "/portainer"        33 minutes ago   Up 28 minutes   0.0.0.0:8088->9000/tcp, :::8088->9000/tcp   dreamy_robinson
#step-2 发现这个默认的tomcat没有webapps应用，镜像的原因，官方的镜像默认 webapps下面是没有文件的
[root@ddkk.com ~]# docker exec -it 57644fa210a0 /bin/bash
root@57644fa210a0:/usr/local/tomcat# ls
BUILDING.txt  CONTRIBUTING.md  LICENSE	NOTICE	README.md  RELEASE-NOTES  RUNNING.txt  bin  conf  lib  logs  native-jni-lib  temp  webapps  webapps.dist  work
root@57644fa210a0:/usr/local/tomcat# ls webapps/
root@57644fa210a0:/usr/local/tomcat# ls webapps.dist/
ROOT  docs  examples  host-manager  manager
#step-3 自己拷贝基本文件进去
root@57644fa210a0:/usr/local/tomcat# cp -r webapps.dist/* webapps/
root@57644fa210a0:/usr/local/tomcat# ls webapps/
ROOT  docs  examples  host-manager  manager
root@57644fa210a0:/usr/local/tomcat# exit
exit
#step-4 commit
[root@ddkk.com ~]# docker ps
CONTAINER ID   IMAGE                 COMMAND             CREATED          STATUS          PORTS                                       NAMES
57644fa210a0   tomcat                "catalina.sh run"   2 minutes ago    Up 2 minutes    0.0.0.0:3355->8080/tcp, :::3355->8080/tcp   tomcat02
3b6ca0890fa0   portainer/portainer   "/portainer"        35 minutes ago   Up 30 minutes   0.0.0.0:8088->9000/tcp, :::8088->9000/tcp   dreamy_robinson
[root@ddkk.com ~]# docker images
REPOSITORY            TAG       IMAGE ID       CREATED        SIZE
tomcat                9.0       266d1269bb29   7 days ago     668MB
tomcat                latest    266d1269bb29   7 days ago     668MB
nginx                 latest    dd34e67e3371   8 days ago     133MB
elasticsearch         7.14.0    e347b2b2d6c1   3 weeks ago    1.04GB
portainer/portainer   latest    580c0e4e98b0   5 months ago   79.1MB
centos                latest    300e315adb2f   8 months ago   209MB
[root@ddkk.com ~]# docker commit -m="add webapps file" -a="gelaotou" 57644fa210a0 tomcat_gelaotou:1.0
sha256:fabb99d62dfe97e8146d75b7a18840f812dff6c1c24916016012306735a9139a
#step-5 校验
[root@ddkk.com ~]# docker images
REPOSITORY            TAG       IMAGE ID       CREATED         SIZE
tomcat_gelaotou       1.0       fabb99d62dfe   6 seconds ago   673MB
tomcat                9.0       266d1269bb29   7 days ago      668MB
tomcat                latest    266d1269bb29   7 days ago      668MB
nginx                 latest    dd34e67e3371   8 days ago      133MB
elasticsearch         7.14.0    e347b2b2d6c1   3 weeks ago     1.04GB
portainer/portainer   latest    580c0e4e98b0   5 months ago    79.1MB
centos                latest    300e315adb2f   8 months ago    209MB
```
