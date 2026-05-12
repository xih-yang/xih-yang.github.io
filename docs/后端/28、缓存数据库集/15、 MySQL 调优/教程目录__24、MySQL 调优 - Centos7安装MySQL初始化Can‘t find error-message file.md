# 24、MySQL 调优 - Centos7安装MySQL初始化Can‘t find error-message file
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/24.html
- 分类：缓存数据库
- 分组：教程目录
备注:
OS:CentOS 7.9

DB: MySQL 5.7.31

## 一.问题描述

MySQL 初始化的时候遇到这个报错:

奇了怪了，MySQL 二进制安装也安装了很多生产实例了，一直没遇到过这个问题，为什么今天安装MySQL出了这么多的问题。

## 二.解决方案

### 2.1 增加–lc_messages_dir参数

通过网络搜索，解释说是系统环境变量的问题。

需要增加如下两个参数:

–lc_messages_dir=/mysql/mysql/share

–lc_messages=en_US

增加了环境变量后，依旧还是出现了问题:

### 2.2 拷贝errmsg.sys到系统

通过网络搜索，解释说是errmsg.sys文件的问题。

需要将mysql源码中的errmsg.sys拷贝到系统指定的目录下。

/usr/share/mysql/english/errmsg.sys 下原本就有errmsg.sys这个文件，先备份，然后再从源码包里面进行拷贝。

```java
mv /usr/share/mysql/english/errmsg.sys /usr/share/mysql/english/errmsg.sys.bak
cp /usr/local/mysql/mysql-5.7.35-linux-glibc2.12-x86_64/share/english/errmsg.sys  /usr/share/mysql/english
```

终于成功了:
