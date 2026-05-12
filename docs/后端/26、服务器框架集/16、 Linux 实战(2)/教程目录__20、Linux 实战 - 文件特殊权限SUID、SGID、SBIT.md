# 20、Linux 实战 - 文件特殊权限SUID、SGID、SBIT
- 来源：https://ddkk.com/zhuanlan/server/linux/5/20.html
- 分类：服务器框架
- 分组：教程目录
## 文件特殊权限SetUID、SetGID、Sticky BIT

### SetUID权限

**SetUID功能**：

- 只有执行文件才能设定SUID权限，即命令执行者要对该程序拥有x(执行)权限。
- 命令执行者在执行该程序是获得该程序文件属主的身份。
- SetUID权限只在程序执行过程中有效，只有在程序过程中身份才会改变。

例：

```java
[root@ddkk.com ~]# ll /usr/bin/passwd
-rwsr-xr-x. 1 root root 33600 4月   6 2020 /usr/bin/passwd
#权限位上的s表示该文件有SUID权限，如果s在组权限上，就代表为SGID权限
```

**危险的SUID权限**：

SUID权限比较强大，也很危险，在执行程序的时候，执行者的身份就会变成文献所有者的身份，一般系统执行文件的所有者为root，意味着如果把程序赋予了SUID权限，那么任何用户在执行程序时，都有了root权限，对于服务器来说更是极其危险。

例：

```java
[root@ddkk.com ~]# chmod u+s /usr/bin/vim
[root@ddkk.com ~]# ll /usr/bin/vim
-rwsr-xr-x. 1 root root 3063664 12月 17 17:14 /usr/bin/vim
[u1@localhost ~]$ vim /etc/shadow
#在赋予了vim程序SUID权限后，u1便能使用vim编辑任何系统文件
```

### SetGID权限

上面讲的SUID权限只能对执行文件生效，而这里的SGID既可以对执行文件生效，也可以对目录文件生效。

**针对文件**：

- 只有执行文件才能赋予SGID权限。
- 命令执行在执行程序的时候，组身份升级为发程序文件的属组，即文件执行的时候SGID权限才会生效。

**针对目录**

- 普通用户对目录要有rwx权限，即最大权限。
- 普通用户在此目录中的有效组会变成此目录的属组，在该目录中新建文件时，新建的文件的默认组是这个目录的属组。

### Sticky BIT权限

Sticky BIT粘着位，也简称为SBIT，SBIT目前仅对目录有效，作用如下：

- 粘着位只对目录有效。
- 普通用户需要对目录有最大权限7，也就是rwx权限。
- 有了粘着位之后，就算对此目录有写权限，普通用户在此目录下只能删除自己创建的文件，而不能删除别人创建的文件。

例：/tmp目录就是有SBIT权限的目录

```java
[root@ddkk.com ~]# ll -d /tmp
drwxrwxrwt. 6 root root 4096 1月  26 01:27 /tmp
[u1@localhost tmp]$ touch abc
[u2@localhost tmp]$ rm -rf abc
rm: 无法删除'abc': 不允许的操作
#u1在/tmp目录下创建的文件u2是无法删除的，只有u1才能删除
```

### 赋予权限

- **字母权限赋予**

```java
[root@ddkk.com ~]# chmod u+s abc
#赋予abc文件SUID权限
[root@ddkk.com ~]# chmod g+s abc
#赋予abc文件SGID权限
[root@ddkk.com ~]# ll abc
-rwSr-Sr--. 1 root root 0 1月  25 22:02 abc
#大写的"S"是在提醒该文件非可执行文件，虽然赋予了SUID、SGID权限，但是并不能使用
[root@ddkk.com tmp]# chmod o+t abc
#为目录文件赋予SBIT权限
```

- **数字权限赋予**

一般的rwx数字权限为3位，如果要加上特殊权限，就要放在第一位，就是4位。

```java
[root@ddkk.com ~]# chmod 4755 abc
#第一位的4代表SUID权限，后面的755是rwx权限
```

文件特殊权限用数字表示：

4代表SUID，2代表SGID，1代表SBIT。
