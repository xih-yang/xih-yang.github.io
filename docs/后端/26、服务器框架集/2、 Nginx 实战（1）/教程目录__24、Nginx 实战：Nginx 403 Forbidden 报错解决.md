# 24、Nginx 实战：Nginx 403 Forbidden 报错解决
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/24.html
- 分类：服务器框架
- 分组：教程目录
对于运维来说，Nginx 报错： 403 forbidden，首先会想到权限问题，如果权限没有问题，那还有什么错误会报403 forbidden呢？

## 一、权限问题

```java
三步走：
#1.检查nginx.conf的user 是否为root；
#2.检查文件所属目录是否有权限
#3.检查nginx程序目录权限
```

## 二、Selinux没关（最为意想不到）

```java
今天部署生产环境，发现一直报错：403 forbidden
最后查看selinux发现selinux状态为：
[root@mccann-dbh /data]$ getenforce 
enforcing
修改selinux状态：
# 临时修改
[root@mccann-dbh /data]$ setenforce 0
[root@mccann-dbh /data]$ getenforce 
permissive
#永久修改
[root@mccann-dbh /data]$ vim /etc/selinux/config 
# This file controls the state of SELinux on the system.
# SELINUX= can take one of these three values:
#     enforcing - SELinux security policy is enforced.
#     permissive - SELinux prints warnings instead of enforcing.
#     disabled - No SELinux policy is loaded.
SELINUX=disabled
# SELINUXTYPE= can take one of three values:
#     targeted - Targeted processes are protected,
#     minimum - Modification of targeted policy. Only selected processes are protected. 
#     mls - Multi Level Security protection.
SELINUXTYPE=targeted
重载nginx，发现可以正常访问了。
```

## 三、缺少索引文件

```java
#1.缺少index.html文件
server { 
listen    80; 
server_name http://dbhh5.mccann.dataxbusiness.com/; 
index index.html; 
root /data/webproject/dbhh5; 
如果在/data/webproject/dbhh5下面没有index.php,index.html的时候，直接访问域名，找不到文件，会报403 forbidden。
```
