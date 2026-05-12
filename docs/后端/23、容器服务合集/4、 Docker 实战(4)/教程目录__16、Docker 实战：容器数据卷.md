# 16、Docker 实战：容器数据卷
- 来源：https://ddkk.com/zhuanlan/container/docker/4/16.html
- 分类：容器服务
- 分组：教程目录
### 什么是容器数据卷

**docker的理念回顾**

- 将应用和环境打包成一个镜像
- 数据？如果数据都在容器中，那么我们容器删除，数据就会丢失！新增一个需求：数据可以持久化
- MySQL，容器删了等于删库跑路！新增一个需求：MySQL数据可以存储在本地
- 容器之间可以有一个数据共享的技术！Docker容器中产生的数据，同步到本地
- 这就是卷技术！目录的挂载，将我们容器内的目录，挂载到linux上面

**总结一句话，容器数据卷是：容器的持久化和同步操作！容器间也是可以数据共享的！**

### 使用数据卷

```java
#直接使用命令来挂载 -v
docker run -it -v 宿主机目录:容器目录
#测试
#启动容器
[root@ddkk.com home]# docker run -it -v /home/ceshi:/home --name centos_rongqijuan centos /bin/bash
[root@668890d13059 /]# docker ps
bash: docker: command not found
[root@668890d13059 /]# cd /home
#查看容器挂载信息是否配置成功
[root@ddkk.com ~]# docker inspect 668890d13059
```

```java
#容器添加文件，查看宿主机是否同步
[root@668890d13059 home]# touch ceshi.java
```

```java
#再次测试！
1.停止容器
2.宿主机上修改文件
3.启动容器
4.容器内的数据依旧是同步的
```

```java
#好处：我们以后修改只需要在本地修改即可，容器内会自动同步
```
