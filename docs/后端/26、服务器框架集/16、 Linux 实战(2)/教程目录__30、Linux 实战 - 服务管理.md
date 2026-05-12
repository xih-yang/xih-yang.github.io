# 30、Linux 实战 - 服务管理
- 来源：https://ddkk.com/zhuanlan/server/linux/5/30.html
- 分类：服务器框架
- 分组：教程目录
## 服务分类

### RPM包安装的服务

RPM包安装的服务又可以分为两种：

- 独立的服务。
- 基于xinetd的服务。

如何区分这两种服务，可以用chkconfig命令。

```java
chkconfig
```

当然，要看到基于xinetd的服务，首先得安装xinetd，不过随着科技的发展，这种服务大多数已经被淘汰了。

### 源码包安装的服务

## 服务管理

### 独立服务的启动管理

- **使用/etc/init.d/目录中的启动脚本启动服务**

```java
/etc/rc.d/init.d/httpd start
```

- **使用service命令来启动独立的服务**

```java
service httpd start
```

### 独立服务的自启动管理

- **使用chkconfig服务自启动管理命令**

```java
chkconfig [--level 运行级别] [独立服务名] [on|off]
```

选项：
–level：设定在哪个运行级别中开机自启动，或是关闭自启动

```java
chkconfig --level 2345 httpd on
```

- **修改/etc/rc.d/rc.local文件，设置服务自启动**

```java
[root@ddkk.com ~]# vim /etc/rc.d/rc.local
#!/bin/bash
# THIS FILE IS ADDED FOR COMPATIBILITY PURPOSES
#
# It is highly advisable to create own systemd services or udev rules
# to run scripts during boot instead of using this file.
#
# In contrast to previous versions due to parallel execution during boot
# this script will NOT be run after all other services.
#
# Please note that you must run 'chmod +x /etc/rc.d/rc.local' to ensure
# that this script will be executed during boot.
touch /var/lock/subsys/local
/etc/httpd start
```

**注**：上面两种自启动方法只设置一种就行，否则会启动两次报错，建议使用第二种，修改/etc/rc.d/rc.local文件。

- **ntsysv(和chkconfig通用)**

使用图形页面进行管理。

### 基于xinetd服务的启动管理

注：telnet的远程管理数据是明文传输，生产服务器上不建议使用telnet服务，这里只是举个例子 。

```java
[root@ddkk.com ~]# vi /etc/xinetd.d/telnet
```

将disable改为no就可以了。

修改完后将xinetd重启。

```java
[root@ddkk.com ~]# service xinetd restart
```

### 基于xinetd服务的自启动管理

- 使用chkconfig命令管理自启动，不过因为是基于xinetd的，所以没有自己的运行级别，不用指定–level选项

```java
[root@ddkk.com ~]# chkconfig 服务名 on | off
```

- 使用ntsysv命令管理自启动

### 源码包服务的启动管理

通过安装目录找到服务脚本，可以启动源码包安装的服务。

```java
[root@ddkk.com sh]# /usr/local/apache2/bin/httpd -k start|stop|restart
```

### 源码包服务的自启动管理

在/etc/rc.d/rc.local文件中添加启动命令。

### 将源码包添加到service、chkconfig、ntsysv服务中

- **添加到service服务中**

在/etc/rc.d/init.d目录中添加源码包启动脚本的软链接

```java
[root@ddkk.com ~]# ln -s /usr/loccal/apache2/bin/apachectl /etc/init.d/apache
```

- **添加到chkconfig、ntsysv管理中**

修改脚本，在脚本中添加两行：

```java
[root@ddkk.com ~]# vim /etc/rc.d/init.d/apache
...
# chkconfig: 35 86 76
# description: 描述文字
...
#35指的是启动的运行级别，后面两个是启动顺序，只要不和其他软件重复就可以了
```

修改脚本后，就可以使用chkconfig命令添加到管理中了。

```java
[root@ddkk.com ~]# chkconfig [选项] 服务名
```

选项：
–add(前面是两个小横杠)：添加服务

–del：删除服务

这样，就可以使用chkconfig和ntsysv进行管理了。

## 服务优化

如果有不需要的服务，可以通过ntsysv关闭自启动。
