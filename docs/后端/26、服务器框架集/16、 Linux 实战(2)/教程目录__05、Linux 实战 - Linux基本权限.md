# 05、Linux 实战 - Linux基本权限
- 来源：https://ddkk.com/zhuanlan/server/linux/5/5.html
- 分类：服务器框架
- 分组：教程目录
## 权限含义

我们都知道用ls -l可以查看文件或目录的信息，包括文件的权限，就像下面"/bin"的权限"lrwxrwxrwx.",通常把这十一位叫做权限位，而最后的一个"."是在Redhat6之后加入的，那么这十一位表达的含义是什么呢。

```java
#查看根目录文件的权限
[root@ddkk.com /]# ls -l
总用量 58
lrwxrwxrwx.   1 root root     7 6月  22 2021 bin -> usr/bin
dr-xr-xr-x.   6 root root  1024 10月 15 00:51 boot
drwxr-xr-x.  19 root root  3080 1月   5 19:18 dev
drwxr-xr-x.  81 root root  4096 1月   5 21:59 etc
drwxr-xr-x.   3 root root  4096 10月 25 01:11 home
lrwxrwxrwx.   1 root root     7 6月  22 2021 lib -> usr/lib
lrwxrwxrwx.   1 root root     9 6月  22 2021 lib64 -> usr/lib64
drwx------.   2 root root 16384 10月 15 00:12 lost+found
drwxr-xr-x.   2 root root  4096 6月  22 2021 media
drwxr-xr-x.   3 root root  4096 10月 15 00:17 mnt
drwxr-xr-x.   2 root root  4096 6月  22 2021 opt
dr-xr-xr-x. 168 root root     0 1月   5 19:18 proc
dr-xr-x---.   2 root root  4096 1月   5 19:20 root
drwxr-xr-x.  25 root root   680 1月   5 19:18 run
lrwxrwxrwx.   1 root root     8 6月  22 2021 sbin -> usr/sbin
drwxr-xr-x.   2 root root  4096 6月  22 2021 srv
dr-xr-xr-x.  13 root root     0 1月   5 19:18 sys
drwxrwxrwt.   8 root root  4096 1月   5 21:59 tmp
drwxr-xr-x.  12 root root  4096 10月 15 00:17 usr
drwxr-xr-x.  20 root root  4096 10月 15 00:51 var
```

### 权限位

#### 第一位——文件类型

权限位的第一位表示的是文件的类型，Linux不像Windows用拓展名来表示文件的类型，而是用权限位的第一位来表示文件的类型，下面列出一些Linux中常见的文件类型。

第一位
文件类型

-
普通文件。

b
块设备文件，这是一种特殊文件，存储设备都是这种文件，如分区文件/dev/sda1就是这种文件

c
字符设备文件，则也是特殊设备文件，输入设备一般都是这种文件，如鼠标、键盘等。

l
软链接文件。

p
管道符文件，非常少见。

s
套接字文件，这也是一种特殊设备文件，一些服务支持Socket访问，就会产生这样的文件。

#### 第二到第九位

- 第2-4位表示文件所有者的权限，r代表read，是读取权限;w表示write，是写权限；x代表execute，是执行权限。有字母则表示有相应的权限，"-"则表示没有这种权限。文件所有者用u来表示。
- 第5-7位表示文件所属组的权限，同样拥有rwx的权限。文件所属组用g来表示。
- 第8-10位表示其他人的权限，同样有rwx的权限。其他人权限用o来表示。

#### 第十一位

第十一位的"."代表该文件是否受SELinux的保护。

### 文件所属者和文件所属组

从“/bin”来看

```java
lrwxrwxrwx.   1 root root     7 6月  22 2021 bin -> usr/bin
```

第一个root表示文件所属者为root用户。

第二个root表示文件所属组为root组。

## 基本权限命令

### chmod(Change File Mode Bits)

执行权限：所有用户，普通用户只能修改所有者是自己的权限。

命令格式：

```java
[root@ddkk.com ~]# chmod 权限模式 文件名
```

常用选项：-R 递归设置权限，也就是给子目录中所有的文件设定权限。

#### 权限模式

chmod命令的权限模式的格式是“[用户身份][赋予方式][权限]”的格式。

**用户身份**：

- -u：代表所有者(user)。
- -g：代表所属组(group)。
- -o：代表其他人(other)。
- -a：代表全部身份(all)。

**赋予方式**：

- +：添加权限。
- -：减去权限。
- =：设置权限。

**权限**：

- r：读取权限。
- w：写入权限。
- x：执行权限。

例：

```java
[root@ddkk.com ~]# ls -l
总用量 8
-rwxrw-r--. 1 root root    4 1月   5 22:28 abc
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
[root@ddkk.com ~]# chmod o+w abc  为其他用户赋予写权限
[root@ddkk.com ~]# ls -l
总用量 8
-rwxrw-rw-. 1 root root    4 1月   5 22:28 abc
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
[root@ddkk.com ~]# chmod u-x abc  为所属者减去执行权限
[root@ddkk.com ~]# ls -l
总用量 8
-rw-rw-rw-. 1 root root    4 1月   5 22:28 abc
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
[root@ddkk.com ~]# chmod o=r-- abc  为其他用户赋予读权限，减去写权限和执行权限
[root@ddkk.com ~]# ls -l
总用量 8
-rw-rw-r--. 1 root root    4 1月   5 22:28 abc
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
```

#### 数字权限

- 4：代表"r"权限。
- 2：代表"w"权限。
- 1：代表"x"权限。

##### 常用数字权限

- 644：这是文件的基本权限，代表文件所属者有读写权限，所属组和其他用户只有读取权限。
- 755：这是目录的基本权限，代表文件所属者有读写执行权限，所属组和其他用户有读和执行权限。
- 777：这是最大权限，在实际生产环境中要避免给予这种权限，具有极大的安全隐患。

例：

```java
[root@ddkk.com ~]# chmod 644 abc  为文件abc赋予644权限
[root@ddkk.com ~]# ls -l
总用量 8
-rw-r--r--. 1 root root    4 1月   5 22:28 abc
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
```

### chown(Change File Owner)

作用：改变文件所属者和所属组

执行权限：root用户

命令格式：

```java
[root@ddkk.com ~]# chown [选项] 所有者：所有组 文件或目录   所有者和所属组可以用"."或":"隔开
```

常用选项：-R 递归设置权限，也就是给子目录中的所有文件都设置权限。

例：

```java
[root@ddkk.com ~]# ls -l
总用量 8
-rw-r--r--. 1 root root    4 1月   5 22:28 abc
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
[root@ddkk.com ~]# chown u1:u1 abc   修改文件abc所属者和所属组
[root@ddkk.com ~]# ls -l
总用量 8
-rw-r--r--. 1 u1   u1      4 1月   5 22:28 abc
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
```

### chgrp(Change Group Ownership)

作用：修改文件或目录所属组。

执行权限：root用户。

```java
[root@ddkk.com ~]# chgrp u1 abc  修改文件abc的用户组
[root@ddkk.com ~]# ls -l
总用量 8
-rw-r--r--. 1 root u1      4 1月   5 22:28 abc
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
```

因为chown既可以修改文件或目录的所属者，也可以修改所属组，而chgrp只能修改所属组，所以一般使用chown。

## 权限的基本作用

读、写、执行对于文件和目录的作用是不同的。(root用户始终拥有最大权限。)

### 权限对文件的作用

- 读：对文件有读权限，代表可以读取文件中的内容，可以对文件执行cat、more、less、head、tail等命令。
- 写：对文件有写权限，代表可以修改文件中的数据，可以对文件执行vim、echo等命令。**但要注意的是，对文件有写权限，不代表可以删除文件，删除文件需要对文件的上级目录有写权限。**
- 执行：对文件有执行权限，代表文件有了执行权限，可以运行。只要文件有了执行权限，这个文件就是执行文件了，但要正确的运行，还需要文件中是正确的语言代码。**执行权限是文件的最大权限，慎重赋予文件执行权限。**

### 权限对目录的作用

- 读：对目录有读权限，代表可以查看目录下的内容，也即是可以查看目录下的子文件和子目录，可以在目录下执行ls命令。
- 写：对目录有写权限，代表可以修改目录下的数据，也就是可以在目录中新建、修改、复制、剪切子文件或子目录，可以在目录下执行touch、rm、cp、mv等命令，**对目录来说，写权限是目录的最大权限。**
- 执行权限：目录是不能运行的，对目录有执行权限，代表可以进入目录，可以对目录执行cd命令。

#### 目录的可用权限

目录的可用权限只有三个：

- 0：任何权限都不赋予。
- 5：基本的目录浏览和进入权限。
- 7：完全权限。

## umask默认权限

### 查看系统的umask权限

```java
[root@ddkk.com ~]# umask
0022
#用八进制数值显示umask权限
[root@ddkk.com ~]# umask -S
u=rwx,g=rx,o=rx
#用字母表示文件和目录的初始权限
```

### umask权限的计算方法

我们需要先了解一下新建文件和目录的最大权限：

- 对文件来说，新建文件的最大权限是666，没有执行权限，这是因为执行权限对于文件来说比较危险，系统不在新建文件的时候默认赋予，只能通过用户手动赋予。
- 对目录来说，新建目录的最大默认权限是777，这是对目录而言，因为执行权限对于目录仅仅代表进入目录，没什么危险。

按照官方的标准算法，umask默认权限需要使用二进制进行逻辑逻辑非联合运算才可以得到正确的新建文件和新建目录权限，对于机器来说比较简单，对于人来说则比较麻烦。

**超哥的简单算法**：
- 文件的最大默认权限只能是666，umask的值是022。

“-rw-rw-rw-“减去”-----w–w-“等于”-rw-r–r--”
- 目录的最大默认权限只能是777，umask的值是022。

“drwxrwxrwx"减去”-----w–w-“等于"drwxr-xr-x”
- 文件的最大默认权限是666，若修改umask值为033，因为本来也没有执行权限，所以也无从减起。

“-rw-rw-rw-“减去”-----wx-wx"等于”-rw-r–r--"

### 修改umask权限

一般也无需修改umask权限，若要修改有两种方法。

#### 直接使用umask命令(暂时)

```java
[root@ddkk.com ~]# umask 011
[root@ddkk.com ~]# umask
0011
[root@ddkk.com ~]# umask 022
[root@ddkk.com ~]# umask
0022
```

#### 修改配置文件(永久)

umask默认权限的配置在"/etc/profile"中修改，"/etc/profie"是环境变量配置文件中的一个。

```java
# By default, we want umask to get set. This sets it for login shell
# Current threshold for system reserved uid/gids is 200
# You could check uidgid reservation validity in
# /usr/share/doc/setup-*/uidgid file
if [ $UID -gt 199 ] && [ "/usr/bin/id -gn" = "/usr/bin/id -un" ]; then
    umask 002
else
    umask 022
fi
```

Linux中默认root用户的UID为0；创建的普通用户UID从500开始，按照配置文件中说明，当用户的UID大于199时，umask值默认为002；当用户UID小于等于199时，umask值默认022。修改配置文件，就可永久修改umask值，但一般不建议修改。
