# 03、SVN 环境搭建
- 来源：https://ddkk.com/zhuanlan/tools/svn/3.html
- 分类：开发工具
- 分组：教程目录
## SVN 环境搭建

Subversion 是一个受欢迎的开源的版本控制工具。他在互联网免费提供并且开源。大多数 GNU/Linux 发行版系统自带，所以它很有可能已经安装在你的系统上了。可以使用下面命令检查是否安装了。

```java
[jerry@CentOS ~]$ svn --version
```

如果Subversion 客户端没有安装，命令将报告错误，否则它将出现安装的软件版本

```java
[jerry@CentOS ~]$ svn --version  
-bash: svn: command not found
```

如果你使用基于 RPM 的 GNU/Linux，可以使用 yum 命令进行安装，安装成功之后，执行 svn --version 命令。

```java
[jerry@CentOS ~]$ su -
Password: 
[root@CentOS ~]# yum install subversion
[jerry@CentOS ~]$ svn --version
svn, version 1.6.11 (r934486)
compiled Jun 23 2012, 00:44:03
```

如果你使用基于 Debian 的 GNU/Linux，使用 apt 命令进行安装。

```java
[jerry@Ubuntu]$ sudo apt-get update
[sudo] password for jerry:
[jerry@Ubuntu]$ sudo apt-get install subversion
[jerry@Ubuntu]$ svn --version
svn, version 1.7.5 (r1336830)
compiled Jun 21 2013, 22:11:49
```

## Apache 安装

我们已经看到如何将 SVN 客户端安装到 GNU/Linux 上，让我们看看如何创建一个新的版本库让使用者们访问。

我们必须必须在服务器上安装 Apache httpd 模块和 svnadmin 工具。subversion 从 /etc/httpd/conf.d/subversion.conf 读取配置文件， subversion.conf 看起来像这个样子

```java
LoadModule dav_svn_module     modules/mod_dav_svn.so
LoadModule authz_svn_module   modules/mod_authz_svn.so
<Location /svn>
   DAV svn
   SVNParentPath /var/www/svn
   AuthType Basic
   AuthName "Authorization Realm"
   AuthUserFile /etc/svn-users
   Require valid-user
</Location>
```

让我们创建 Subversion 用户，授权他们访问版本库，htpasswd 命令用于创建和更新用来保存用户名和密码的纯文本文件给 HTTP 用户提供基本身份认证。-c 选项创建一个密码文件，如果密码文件已经存在了，它将会被覆盖。这就是为什么 -c 只在第一次使用。-m 选项用于设置是否启用 MD5 加密密码。

## 用户安装

让我们创建 tom

```java
[root@CentOS ~]# htpasswd -cm /etc/svn-users tom
New password: 
Re-type new password: 
Adding password for user tom
```

让我们创建 jerry

```java
[root@CentOS ~]# htpasswd -m /etc/svn-users jerry
New password: 
Re-type new password: 
Adding password for user jerry
[root@CentOS ~]# 
```

创建一个 Subversion 父目录保存所有的工作，(/etc/httpd/conf.d/subversion.conf)。

```java
[root@CentOS ~]# mkdir /var/www/svn
[root@CentOS ~]# cd /var/www/svn/
```

## 版本库安装

创建一个名为 project_repo 的版本库。svnadmin 命令用于创建一个新的版本库和一些其他目录保存数据。

```java
[root@CentOS svn]# svnadmin create project_repo
[root@CentOS svn]# ls -l project_repo
total 24
drwxr-xr-x. 2 root root 4096 Aug  4 22:30 conf
drwxr-sr-x. 6 root root 4096 Aug  4 22:30 db
-r--r--r--. 1 root root    2 Aug  4 22:30 format
drwxr-xr-x. 2 root root 4096 Aug  4 22:30 hooks
drwxr-xr-x. 2 root root 4096 Aug  4 22:30 locks
-rw-r--r--. 1 root root  229 Aug  4 22:30 README.txt
```

让我们更改版本库的用户和组所有权。

```java
[root@CentOS svn]# chown -R apache.apache project_repo/
```

检查是否启用SELinux或没有使用SELinux状态工具

```java
[root@CentOS svn]# sestatus
SELinux status:                 enabled
SELinuxfs mount:                /selinux
Current mode:                   enforcing
Mode from config file:          enforcing
Policy version:                 24
Policy from config file:        targeted
```

如果SELinux启用了，我们必须更改安全的上下文。

```java
[root@CentOS svn]# chcon -R -t httpd_sys_content_t /var/www/svn/project_repo/
```

如果允许通过 HTTP 进行提交，执行下面命令。

```java
[root@CentOS svn]# chcon -R -t httpd_sys_rw_content_t /var/www/svn/project_repo/
```

更改这些配置后，我们重启 Apache 服务器。

```java
[root@CentOS svn]# service httpd restart
Stopping httpd:                                            [FAILED]
Starting httpd: httpd: apr_sockaddr_info_get() failed for CentOS
httpd: Could not reliably determine the server's fully qualified domain name, using 127.0.0.1 for ServerName
                                                           [  OK  ]
[root@CentOS svn]# service httpd status
httpd (pid  1372) is running...
[root@CentOS svn]#
```

我们已经成功配置好了 Apache 服务器，现在我们将配置版本库，使用默认的授权文件给可信的用户访问，添加下列几行到 roject_repo/conf/svnserve.conf 文件。

```java
anon-access = none
authz-db = authz
```

照惯例，每个 SVN 项目都有主干，标签，分支在项目的 root 目录。

主干是主要开发和经常被开发者们查看的目录。

分支目录用于追求不同的开发方向。

让我们在项目版本库底下创建主干，标签，分支结构。

```java
[root@CentOS svn]# mkdir /tmp/svn-template
[root@CentOS svn]# mkdir /tmp/svn-template/trunk
[root@CentOS svn]# mkdir /tmp/svn-template/branches
[root@CentOS svn]# mkdir /tmp/svn-template/tags
```

现在从/tmp/svn-template 导入这些文件目录。

```java
[root@CentOS svn]# svn import -m 'Create trunk, branches, tags directory structure' /tmp/svn-template/ 
Adding         /tmp/svn-template/trunk
Adding         /tmp/svn-template/branches
Adding         /tmp/svn-template/tags
Committed revision 1.
[root@CentOS svn]#
```

完成了！我们已经成功创建版本库并允许 Tom 和 Jerry 访问，从现在开始他们可以所有版本库支持的操作了。
