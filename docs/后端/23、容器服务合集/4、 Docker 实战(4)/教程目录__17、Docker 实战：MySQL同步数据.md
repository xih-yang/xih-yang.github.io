# 17、Docker 实战：MySQL同步数据
- 来源：https://ddkk.com/zhuanlan/container/docker/4/17.html
- 分类：容器服务
- 分组：教程目录
```java
#获取镜像
[root@ddkk.com ~]# docker pull mysql:5.7
#启动容器，需要做数据挂载！安装启动mysql，需要配置密码的，这是注意点！
#官方安装文档：docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag
```

```java
#启动容器 -v 使用容器数据卷
[root@ddkk.com ~]# docker run -d -p 3310:3306 -v /home/mysql/conf:/etc/mysql/conf.d -v /home/mysql/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=123456 --name mysql01 mysql:5.7
#使用mysql连接工具测试
#创建一个数据库，查看宿主机目录是否同步
```

```java
#删除容器，查看宿主机目录，刚刚创建的数据库还在，OK！
[root@ddkk.com data]# docker rm -f ffaf64e7a40a
```
