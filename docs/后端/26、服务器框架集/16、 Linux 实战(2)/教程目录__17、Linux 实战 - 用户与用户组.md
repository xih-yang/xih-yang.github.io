# 17、Linux 实战 - 用户与用户组
- 来源：https://ddkk.com/zhuanlan/server/linux/5/17.html
- 分类：服务器框架
- 分组：教程目录
## 用户相关文件

### /etc/passwd 用户信息文件

```java
root:x:0:0:root:/root:/bin/bash
#第一列是用户名称。
#第二列是密码标记，密码记录在/etc/shadow文件中。
#第三列是用户ID(UID)，0是超级用户；1-499是系统用户(伪用户)，这些账号是留给系统的，用来运行服务；500-65535是普通用户UID，一般来说已经够用了，在2.6.x内核以后Linux系统可以支持2∧32个用户了。
#第四列组ID(GID)，是用户的初始组组ID，组信息记录在/etc/group文件中。
#第五列是用户说明。
#第六列是用户的家目录。
#第七列是用户登录后的权限，/bin/bash代表可以执行shell命令，/sbin/nologin表示是伪用户无法登录。
```

### /etc/shadow 影子文件

```java
u1:$6$u./.a.qn3MQht00P$XK73fDh7bC5AHfCSDf5TDJCapoiRYFCWyjKazu0mPDB85Z3H2vt6AdVQx08siIVAhe64xD0qlYpZKhOV    e7v.o0:18998:0:99999:7:::
#第一列是用户名称。
#第二列是用户加密之后的密码，从redhat6版本开始，系统密码开始采用SHA-512加密，与MD5加密相比，SHA-512加密更加安全；*和!是伪用户，没有密码。
#第三列是密码修改时间戳。
#第四列是限制用户改密码的时间，距离最后一次改密码后多少天可以再次改密码。
#第五列是密码有效期。
#第六列是密码有效期前的警告天数。
#第七列是密码有效期的宽限天数，默认值是-1，代表用户密码到期之后也能正常使用。
#第八列是密码失效时间，要用时间戳表示。
#第九列保留。
```

### /etc/group 组信息文件

```java
root:x:0:
#第一列是组名。
#第二列是组密码标志，如果设置密码了的话，密码会保存在/etc/gshadow文件中。
#第三列是组ID(GID)。
#第四列是此组中的其他用户，一个用户必有且只有一个初始组，这个初始组一般是同名组，但可以有多个附加组。
```

### 其他用户有关文件

- **/etc/gshadow文件**，保存着用户组的密码。
- **用户的家目录**，每创建一个普通用户，系统就会在/home/目录下创建一个同名目录，作为这个用户的家目录；root用户的家目录在/root，系统安装时就会自动建立。
- **用户的邮箱目录**，这个邮箱在/var/spool/mail目录中。
- **用户模板目录**，/etc/skel/用户创立时家目录会以这个目录为模板创立家目录。

## 用户管理命令

### useradd命令–添加用户

useradd是Linux的用户添加命令，命令格式如下：

```java
useradd 选项 用户名
```

常用选项：

选项
作用

-u 851
指定UID

-g 组名
指定用户初始组，一般不建议修改。

-G 组名
指定添加用户到某个附加组。

-c 说明
添加说名。

-d 目录
手工指定家目录，目录不需要事先建立。

-s shell
/bin/bash

### useradd 默认值

useradd添加用户是参考的默认文件主要有两个，分别是/etc/default/useradd和/etc/login.defs。

#### /etc/default/useradd

```java
# useradd defaults file
GROUP=100
HOME=/home
INACTIVE=-1
EXPIRE=
SHELL=/bin/bash
SKEL=/etc/skel
CREATE_MAIL_SPOOL=yes
```

- GROUP=100

这个选项是建立用户的默认组，也就是添加每个用户是，用户的初始组就是GID为100的这个用户组，目前我们采用的机制是私有用户组机制，这个选项不起作用。
- HOME=/home

这个选项是用户的家目录的默认位置，所有的新建用户的家目录都是默认在/home /下。
- INACTIVE=-1

这个选项就是密码过期后的宽限天数，也就是/etc/shadow文件的第七个字段，如果是0，就表示密码过期后立马失效，5代表过期后5天失效。
- EXPIRE=

这个选项是密码的失效时间，也就是/etc/shadow文件的第八个字段，到达这个时间就会直接失效，这个选项是用时间戳来表示时间的。
- SHELL=/bin/bash

用户的默认的登录shell。
- SKEL=/etc/skel

这个选项是指定创建用户时的模板目录。
- CREAT_MAIL_SPOOL=yes

确认创建用户是创建邮箱。

#### /etc/login.defs

```java
MAIL_DIR        /var/spool/mail
#用户邮箱的默认目录
PASS_MAX_DAYS   99999
#密码的有效期，也就是/etc/shadow文件的第五字段。
PASS_MIN_DAYS   0   
#用户两次密码的修改间隔时间，/etc/shadow文件的第四字段。
PASS_MIN_LEN    5   
#这行代表密码的最小长度，默认不小于5位，但现在用户登录时验证已被PAM模块取代，多以这个选项并不生效。
PASS_WARN_AGE   7   
#密码修改到期前的警告天数，/etc/shadow文件的第六字段。
UID_MIN                  1000
UID_MAX                 60000
#普通用户的UID范围，可以自己修改范围变大，centos8默认范围改为了1000-60000。
SYS_UID_MIN               201 
SYS_UID_MAX               999 
#system accounts
GID_MIN                  1000
GID_MAX                 60000
#组ID范围。
SYS_GID_MIN               201 
SYS_GID_MAX               999
#system accounts
CREATE_HOME     yes
#默认自动创建家目录
USERGROUPS_ENAB yes
#删除用户时，同时删除掉用户的初始组
ENCRYPT_METHOD SHA512
#指定Linux用户密码使用SHA512散列模式加密
```

### passwd命令–设定密码

在Linux中用passwd命令来设定用户的密码，root用户可以修改所有用户的密码，普通用户只能修改自己的密码。

命令格式：

```java
[root@ddkk.com ~]# passwd 选项 用户名
```

常用选项：

- -l：暂时锁定用户，仅root用户可用。
- -u：解锁用户，仅root用户可用。
- –stdin：可以通过管道符将输出的数据作为用户的密码，主要在批量添加用户时使用。

```java
passwd   
#普通用户直接使用passwd命令修改自己的密码。
echo "123" | passwd --stdin u1
#利用管道符将输出作为密码，方便用脚本的方法批量添加用户。
chage -d 0 u1
#将/etc/shadow中第三字段修改为0，这样用户登录时会被要求立即改密码。
```

### usermod命令–修改用户信息

usermod可以用来修改已添加用户的信息。

```java
[root@ddkk.com ~]# usermod 选项 用户名
```

常用选项：

- -G 组名：修改用户的附加组，把用户加到其他组中。
- -L：临时锁定用户。
- -U：解锁用户。
- -l 新名 旧名：更改用户名。

其他选项和useradd的选项含义大致相同，修改用户的UID、家目录等等，但一般不建议修改。

### userdel命令–删除用户

```java
[root@ddkk.com ~]# userdel -r 用户名
# -r 在删除用户的时候删除用户的家目录
```

### su命令

su命令切换用户的身份。

```java
[root@ddkk.com ~]# su 选项 用户名
```

选项：

- -：选项只使用"-"代表连用户的环境变量一起改变。
- -c 命令：仅执行一次命令，而不切换用户身份。

## 用户组管理命令

### groupadd命令–添加用户组

```java
[root@ddkk.com ~]# groupadd 选项 组名
```

选项：

- g GID：指定组ID。

### groupdel命令–删除用户组

```java
[root@ddkk.com ~]# groupdel 组名
```

注：每个用户有且只有一个初始组，没有了初始组用户就无法工作，所以不能删除用户的初始组。

例：

```java
[root@ddkk.com ~]# groupadd test  添加用户组
[root@ddkk.com ~]# groupdel test  删除用户组
```

### gpasswd命令–把用户添加进组或从组中删除

```java
[root@ddkk.com ~]# gpasswd 选项 组名
```

选项：

- -a 用户名：把用户添加进组。
- -d 用户名：把用户从组中删除。

例：

```java
[root@ddkk.com ~]# gpasswd -a u1 test  将u1添加到test组中
正在将用户“u1”加入到“test”组中
[root@ddkk.com ~]# gpasswd -d u1 test  将u1从test组中删除
正在将用户“u1”从“test”组中删除
```

### newgrp命令–改变用户的有效组

**有效组**：当一个用户创建一个文件时，文件默认的所属组就是该用户的有效组。

命令格式：

```java
[u1@localhost ~]$ newgrp 用户组名
```
