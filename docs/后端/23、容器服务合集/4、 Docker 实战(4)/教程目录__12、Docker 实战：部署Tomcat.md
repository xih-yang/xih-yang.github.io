# 12、Docker 实战：部署Tomcat
- 来源：https://ddkk.com/zhuanlan/container/docker/4/12.html
- 分类：容器服务
- 分组：教程目录
```java
#官方的使用；我们之前的启动都是后台，停止容器后，容器还是可以看到
#docker run -it --rm，一般用来测试，用完就会删除容器，镜像还在
[root@ddkk.com ~]# docker run -it --rm tomcat:9.0
#实操
#下载再启动
[root@ddkk.com ~]# docker pull tomcat
#启动运行
[root@ddkk.com ~]# docker run -d -p 3355:8080 --name tomcat01 tomcat
#测试访问宿主机IP:3355，发现404，其实已经搭建成功了，为什么会报404，下面的发现问题会讲
#进入容器
[root@ddkk.com ~]# docker exec -it tomcat01 /bin/bash
#如果想看到tomcat猫
root@92513e0f05a0:/usr/local/tomcat# cp -r webapps.dist/* webapps/　　#再次访问，猫就出来了
#发现问题：1)Linux的命令少了 2)webapps里面是空的，主要是阿里云镜像的问题。默认是最小的镜像，把不必要的都剔除掉了
#保证最小可运行的环境
```
