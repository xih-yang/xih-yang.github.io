# 05、MyCat 实战 - MyCat 的使用-MySql 的主从模式搭建
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/4/5.html
- 分类：分库分表
- 分组：教程目录
### 1.在主数据库和从数据库都需要完成

#### 1.1 放开 3306 端口

#### 1.2 保证 root 用户可以被 mycat 访问

- 在 Mycat 中通过 Master 数据库的 root 用户访问 Master 数据库

```java
grant all privileges on *.* to 'root'@'%' identified by 'root' with grant option; 
flush privileges;
```

### 2.解压上传的 Mycat 压缩包

- tar -zxf Mycat-server-1.6-RELEASE-20161028204710-linux.tar.gz

### 3.将解压后的文件夹复制到/usr/local/mycat

### 4.MyCat 目录介绍

- bin 目录里是启动脚本
- conf 目录里是配置文件
- catlet 为 Mycat 的一个扩展功能
- lib 目录里是 Mycat 和它的依赖 jar
- logs 目录里是 console.log 用来保存控制台日志，和 mycat.log 用来保存 mycat 的 log4j 日志
