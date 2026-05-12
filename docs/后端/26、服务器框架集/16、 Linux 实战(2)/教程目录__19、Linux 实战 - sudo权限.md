# 19、Linux 实战 - sudo权限
- 来源：https://ddkk.com/zhuanlan/server/linux/5/19.html
- 分类：服务器框架
- 分组：教程目录
## sudo权限

### sudo授权

sudo授权可以给普通赋予部分管理员权限。

sudo赋予的权限越详细，普通用户得到的权限就越小。

sudo赋予的权限越简单，普通用户得到的权限就越大。

### visudo命令

visudo命令是root用户赋予普通用户权限的命令，命令执行后和vi一样使用。

```java
......
root    ALL=(ALL)       ALL
......
#root是用户名
#第一个ALL是用户管理的主机域名，这里是指所有的主机域名
#(ALL)代表可以切换为的身份，ALL代表所有用户，包括root；可以省略，省略时只表示root。
#最后一个ALL表示授权给该用户的命令，ALL代表所有命令
```

例1：赋予重启权限

```java
[root@ddkk.com ~]# visudo
......
u1 ALL=/sbin/shutdown -r now
......
#赋予用户u1使用shutdown命令权限，":wq"保存退出命令生效
[u1@localhost ~]$ sudo -l
#使用这条命令可以查询被赋予的sudo权限
[u1@localhost ~]$ sudo shutdown -r now
#执行命令前需要加上sudo
```

例2：赋予修改配置文件权限

```java
[root@ddkk.com ~]# visudo
......
u1 ALL=/usr/bin/vim / /etc/httpd/conf/httpd.conf 
......
#赋予了用户u1修改apache配置文件的权限
```

例3：赋予添加用户的权限

```java
[root@ddkk.com ~]# visudo
......
u1      ALL=/usr/sbin/useradd,/usr/bin/passwd, !/usr/bin/passwd "", !/usr/bin/passwd root
......
#赋予用户u1添加用户和修改密码的权限，但是不能改root用户的密码
```
