# 18、Linux 实战 - ACL权限
- 来源：https://ddkk.com/zhuanlan/server/linux/5/18.html
- 分类：服务器框架
- 分组：教程目录
## ACL权限

### ACL权限简介

ACL权限是解决文件对用户身份不足的问题的，ACL的全称是 Access Control List (访问控制列表) ，一个针对文件/目录的访问控制列表。它在UGO权限管理的基础上为文件系统提供一个额外的、更灵活的权限管理机制。它被设计为UNIX文件权限管理的一个补充。ACL允许你给任何的用户或用户组设置任何文件/目录的访问权限。

### 开启ACL

- 查看acl权限是否开启

```java
[root@ddkk.com ~]# dumpe2fs -h /dev/sda2
# dumpe2fs命令是查询指定分区详细文件系统信息的命令
......
Default mount options:    user_xattr acl 
#默认开启了acl权限
......
```

- 开启acl权限

使用命令暂时开启：

```java
[root@ddkk.com ~]# mount -o remount,acl /
#重新挂载，给予acl权限
```

修改配置文件/etc/fstab一直开启acl权限：

```java
[root@ddkk.com ~]# vim /etc/fstab
......
UUID=71577b29-baae-4109-8436-558b7fc032e0 /                       ext4    defaults,acl        1 1
#在defaults后面加上acl
......
```

### ACL权限命令

命令格式：

- **查询acl权限**

```java
getfacl 文件名 查询文件的acl权限
```

- **设置acl权限**

```java
setfacl 选项 文件名 设定ACL权限
```

选项：

- -m ：设定acl权限
- -b：删除acl权限

例：

```java
[root@ddkk.com ~]# setfacl -m u:u3:5 /test 为用户u3设置5的权限
[root@ddkk.com ~]# ll -d /test   查看/test权限
drwxrwx---+ 2 root test 4096 1月  25 02:08 /test  权限位最后一位的"+"表示该文件有acl权限
[root@ddkk.com ~]# getfacl /test  查看/test目录的acl权限
getfacl: Removing leading '/' from absolute path names
# file: test
# owner: root
# group: test
user::rwx
user:u3:r-x  u3有5的权限
group::rwx
mask::rwx
other::---
[root@ddkk.com ~]# setfacl -b /test  删除/test目录的acl权限
```

- **递归设置acl权限**

```java
[root@ddkk.com ~]# setfacl -m u:u3:5 -R /test
#让目录及目录下的所有文件对于u3有5的权限
[root@ddkk.com ~]# setfacl -m d:u:u3:5 -R /test
#让目录下之后创建的文件对u3有5的权限
```

acl权限的递归设置有一个无法解决的问题，那就是会造成权限的溢出，因为权限对于文件和目录来说是不同的，执行权限对于目录来说是基本权限，对于文件来说是最大权限。

- **最大有效权限mask**

```java
[root@ddkk.com /]# getfacl test
# file: test
# owner: root
# group: test
user::rwx
user:u3:r-x
group::rwx
mask::rwx  mask有效权限
other::---
```

文件的acl权限是由用户权限和mask最大权限共同决定的，两个是逻辑与的关系，那如何修改mask权限呢。

```java
[root@ddkk.com /]# setfacl -m m:6 test  将mask有效权限改为6
[root@ddkk.com /]# getfacl test
# file: test
# owner: root
# group: test
user::rwx
user:u3:r-x			#effective:r--
group::rwx			#effective:rw-
mask::rw-
other::---
```
