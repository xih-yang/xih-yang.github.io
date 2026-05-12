# 16、Linux 教程：高级权限与切换用户su
- 来源：https://ddkk.com/zhuanlan/server/linux/1/16.html
- 分类：服务器框架
- 分组：教程目录
## 高级权限与切换用户su

## ACL权限

linux的文件有所有者、所属组和其他人的概念，但是仅仅拥有这些意味着权限不同的用户只分三类，这有时是不够用的，ACL权限（access control list）就可以解决这个问题。

查看当前分区是否支持ACL权限：`dumpe2fs -h /dev/sda1`

若其中有acl就说明支持acl。一般默认都是支持的，如果不支持要打开acl选项，需要修改/etc/fstab，该文件是系统开机自动挂载的文件，如果某个分区没有打开acl，就需要在对应分区行defaults后加逗号acl，然后再重启或重新挂载文件系统`mount -o remount 对应分区`。对应分区就是/、/boot等。

给用户设置文件ACL权限：`setfacl -m u:st:rx /project/`相当于给用户st，目录/project/设置rx权限。此时在查看文件详细信息时会在原来的9个权限后加上一个加号，代表它拥有ACL权限。（如果填用户名的位置设置为空，就相当于给文件的拥有者设置权限）

给用户组分配ACL权限`setfacl -m g:gro:rx /project/`相当于给用户组gro，目录/project/设置rx权限。

查看ACL权限`getfcal 文件`

设置mask权限：`setfacl -m m:rx`最大有效权限mask权限，它与各ACL权限相与得到的权限才是真正的权限。执行查看ACL权限时能直接查到每个文件的mask权限。（mask权限可以规范最大允许的权限，如果mask权限仅仅为r，即使其他的权限为rw，那么w也不会生效）

删除用户的ACL权限：`setfacl -x u:用户名 文件`g：组名可以删除组的ACL权限。删除文件的所有ACL权限：

`setfacl -b 文件`

递归ACL权限`setfacl -m u:用户名:权限 -R 目录`给目录设置ACL权限后，所有的子文件和子目录都会使用这个ACL权限，但是如果设置完之后再新建文件那么新文件没有该递归ACL权限，若想使未来新建的文件拥有ACL权限，则应该使用默认ACL权限：`setfacl -m d:u:用户名:权限 目录`

## 文件特殊权限SetUID

SUID权限的作用是命令执行者在执行程序时获得该程序文件属主的身份，在程序结束时属主的身份就会失去。要满足的条件首先是该文件必须是可执行文件，且命令执行者必须有执行权限x。s权限的一个典型应用就是命令passwd，查看/usr/bin/passwd的权限是：-rwsx-xr-x（属主权限的x换成了s），这是因为该命令允许用户自定义自己的密码，本质上是修改shadow文件，而shadow文件没有权限只能借助root的权限来进行修改。

设置SUID：`chmod 4755 文件名`或`chmod u+s 文件名`取消：`chmod 755 文件名`或`chmod u-s 文件名`

这个权限是非常危险的，普通用户因此可能会获得管理员权限，对拥有s权限的文件应该定期检查，取消不必要权限。

该权限只能用于二进制程序，只能暂时获得执行权限，而不能获得读权限，也就是不能用cat查看这种文件。

## 文件特殊权限SetGID

SGID可以用于二进制可执行文件，也可以用于目录。用于二进制可执行文件时，该权限的作用是命令执行者在执行该文件时（必须有对该文件的x权限），组身份升级为该文件的属组。该权限的典型应用是locate命令，该命令通过查询数据库文件来进行搜索，数据库文件/var/lib/mlocate/mlocate.db的属组是slocate，该组的权限是r，也就是slocate组可以读该文件，而locate命令文件/usr/bin/locate的属组是slocate，属组权限是--s，普通用户执行该命令时也就拥有了slocate的权限，也就能顺利的查询数据库。

SGID也可用于目录文件。如果用户对目录有rwx权限，那么他就可以查看该目录且可以在该目录创建文件，如果该目录有SGID，也就是属组权限的x替代成了s，那么用户在该目录下创建的文件属组是该目录的属组，而不是创建者初始组。

设置SGID`chmod 2755 文件名`或`chmod g+s 文件名`取消：`chmod 755 文件名`或`chmod g-s 文件名`

## 文件特殊权限Sticky BIT

SBIT粘着位目前只对目录有效，设置粘着位后目录的other权限中的x被替换为t，一旦某个目录设置成粘着位，那么对该目录原来拥有w和x权限的普通用户就不能删除该目录下的文件了，此时普通用户就算是拥有w权限，也只能删除自己创建的文件，对其他文件不能删除。

设置粘着位`chmod 1755 目录`或`chmod o+t 目录`取消：`chmod 777 目录`或`chmod o-t 目录`

## 特殊权限其他特性

要设置特殊权限只需要在原来三个权限数字的基础上在前面再加一个数字即可，三个特殊权限代表的数字：SUID为4，SGID为2，SBIT为1，如果执行下面的语句：

`chmod 7666 test`就会给test文件同时赋予三种特殊权限，但是它现在的权限是：

-rwSrwSrwT，注意到三个特殊权限都是大写字母，这种情况代表特殊权限为空，因为666代表三种群体都没有执行权限，此时即使赋予了特殊权限也无法获取对应权限，因为无权限可用。

## chattr权限

该权限限制包括root用户在内的所有用户。

添加chattr权限：`chattr [+-=] [选项] 目录或文件名`选项有两种-i和-a。

-i相当于上锁，对文件来说它不能被删除，不能修改文件内容、改名；对目录来说不能在该目录下删除和建立文件。-a相当于不允许删除已有的数据，对文件来说它不能被删除，也不能删除文件数据，但是可以在文件中添加新数据；对目录来说不能在该目录下删除文件，但是可以新建文件。

这种特殊权限用ls是查不出来的，必须使用lsattr命令：`lsattr 选项 文件名`-a代表显示全部，-d代表仅列出目录。

其他隐藏权限：

## 切换用户su命令

切换用户`su - 用户名`执行完这条命令后，输入密码。切换成另一个用户的同时切换用户的环境变量。还可以不切换用户身份直接执行root的权限：`su -root -c "useradd user3"`（不加用户名直接执行代表切换到root）

注意`su -`和`su`是不同的，前者是login-shell，后者是non-login shell，如果执行后一条命令环境变量不会切换成root的，还是原来用户的。su命令切换结束想要恢复执行exit命令即可。

su命令在切换的时候必须知道对方的密码（root使用时除外），这样会导致密码泄露，这个问题可以用sudo权限来解决。

## sudo权限

sudo权限的作用是root把本来超级用户能执行的命令赋予普通用户执行。sudo的操作对象是系统命令。

要设置sudo权限要执行命令`visudo`相当于`vi /etc/sudoers`，在这个文件中：

**1、** 设置单一用户的sudo权限；

root ALL=(ALL) ALL，其中root代表赋予权限的用户，第一个ALL代表主机地址，第二个ALL代表可使用的身份，第三个ALL代表授权的命令绝对地址。这一行代表用户可以在给定地址执行对应的命令。如：

scALL= /sbin/shutdown –r now代表用户sc可以在所有主机上执行重启命令，身份省略不写代表sc被当成root用户对待。sudo命令执行时必须输入当前用户的密码，而不是root密码（只有第一次执行sudo，或者两次执行sudo的时间间隔大于5分钟时才会要求输入密码）。

这个权限也是危险的，如果给普通用户赋予执行vim的权限，那么他就能获取root的权限编辑所有文件。

**2、** 设置群组的sudo权限；

%wheel ALL=(ALL) ALL，代表wheel群组中的用户可以使用所有root的命令。

**3、** 设置免密码sudo：；

将sudo配置信息中一行的最后一个ALL改为：`NOPASSWD:ALL`，如果要换成其他授权命令则修改ALL即可。

**4、** 使用别名：；

```java
User_Alias ADMPW=pro1,pro2,pro3,pro4
Cmnd_Alias ADMPWCOM=!/usr/bin/passwd,/usr/bin/passwd [A-Za-z]*,!/usr/bin/passwd root
ADMPW ALL=(root) ADMPWCOM
```

上述最后一行是代表设置sudo权限，而前两行分别把用户名和可以执行的命令单独定义了。这里允许执行所有设置密码的命令，除了单独执行passwd以及passwd root，防止root密码被执行者修改。

**5、** sudo搭配su快速实现将身份转为root：；

```java
User_Alias ADMINS=pro1,pro2,pro3,pro4
ADMINS ALL=(root) /bin/su -
```

这样就相当于这4个用户可以直接用`sudo su -`来切换到root（用自己的密码）

查看本用户可用的所有sudo权限：`sudo -l`

用户执行sudo权限赋予的命令：`sudo 命令`，以用户sshd的身份在/tmp下创建一个mysshd的文件：

`sudo -u sshd touch /tmp/mysshd`
