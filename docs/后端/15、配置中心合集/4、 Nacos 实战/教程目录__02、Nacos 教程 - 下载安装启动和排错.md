# 02、Nacos 教程 - 下载安装启动和排错
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/2.html
- 分类：注册中心
- 分组：教程目录
## 前言

如何安装Nacos，本文介绍多种Nacos安装方式。

nacos官网:[https://nacos.io/](https://nacos.io/)

## 第一种 压缩包安装

### 1. 下载

nacos下载:[https://github.com/alibaba/nacos/releases](https://github.com/alibaba/nacos/releases)

### 2. 安装

解压安装包即可

### 3. 启动

双击bin下的startup.cmd或者(在bin目录下执行startup.cmd -m standalone命令)，如果启动成功不报错，即可访问:[http://localhost:8848/nacos/](http://localhost:8848/nacos/)

nacos默认登录账号:nacos,密码:nacos

## 第二种 docker安装

```java
docker run --env MODE=standalone --name nacos -d -p 8848:8848 nacos/nacos-server
```

访问地址:[http://localhost:8848/nacos/](http://localhost:8848/nacos/)

nacos默认登录账号:nacos,密码:nacos

## 第三种 官方安装

访问地址:[http://localhost:8848/nacos/](http://localhost:8848/nacos/)

nacos默认登录账号:nacos,密码:nacos

详见[https://nacos.io/zh-cn/docs/quick-start.html](https://nacos.io/zh-cn/docs/quick-start.html)

## 错误问题

### 错误1: Unable to start web server

```java
2022-03-01 09:57:58,639 ERROR Startup errors : {
}
org.springframework.context.ApplicationContextException: Unable to start web server; nested exception is org.springframework.boot.web.server.WebServerException: Unable to start embedded Tomcat
at org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.onRefresh(ServletWebServerApplicationContext.java:156)
at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:544)
at org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.refresh(ServletWebServerApplicationContext.java:141)
```

### 解决办法：

在bin目录下编写一个bat脚本,内容如下,然后双击启动即可

```java
startup.cmd -m standalone
```

### 错误2:db.num is null

```java
java.io.IOException: java.lang.IllegalArgumentException: db.num is null
at com.alibaba.nacos.config.server.service.datasource.ExternalDataSourceServiceImpl.reload(ExternalDataSourceServiceImpl.java:134)
at com.alibaba.nacos.config.server.service.datasource.ExternalDataSourceServiceImpl.init(ExternalDataSourceServiceImpl.java:106)
at com.alibaba.nacos.config.server.service.datasource.DynamicDataSource.getDataSource(DynamicDataSource.java:53)
at com.alibaba.nacos.config.server.service.repository.extrnal.ExternalStoragePersistServiceImpl.init(ExternalStoragePersistServiceImpl.java:138)
```

### 解决方案:

配置本地数据库

**1、** 本地新建mysql数据库,名称nacos,编码utf8,并导入conf文件夹下的nacos-mysql.mysql脚本；

**2、** 修改配置文件,找到conf文件夹下的application.properties；

修改Config Module Related Configurations下的配置为自己的nacos数据库即可

**3、** 重新启动nacos；
