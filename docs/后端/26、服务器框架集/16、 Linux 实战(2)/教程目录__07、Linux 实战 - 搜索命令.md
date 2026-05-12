# 07、Linux 实战 - 搜索命令
- 来源：https://ddkk.com/zhuanlan/server/linux/5/7.html
- 分类：服务器框架
- 分组：教程目录
## whereis

whereis是搜索系统命令的命令，不能用来搜索文件。

作用：查找二进制命令、源文件和帮助文档的命令。

执行权限：所有用户。

```java
[root@ddkk.com ~]# whereis ls
ls: /usr/bin/ls /usr/share/man/man1/ls.1.gz
```

## which

which也是搜索系统命令的命令，和whereis的区别在于：

- whereis命令可以在查找到二进制命令的同时，找到帮助文档的位置。
- 而which命令在查找到二进制命令的同时，如果这个命令有别名，则还可以找到别名的命令。

例：

```java
[root@ddkk.com ~]# which ls
alias ls='ls --color=auto'    "ls --color=auto"是ls的别名
	/usr/bin/ls
```

## locate

locate命令是可以按照文件名搜索普通文件的命令。**在centos7及之后的版本里，系统不自带locate命令，如需使用，可以用"yum install mlocate"命令进行安装。**

- 优点： 按照数据库搜索，搜索速度快，小号资源，数据库位置/var/lib/mlocate.db
- 缺点：只能按照文件名来搜索，而不能执行更复杂的搜索，比如按照权限、大小、修改时间等搜索文件。

作用：按照文件名来搜索文件。

执行权限：所有用户。

数据库更新：不是在每次创建文件之后就可以用locate命令进行搜索，需要进行数据库的更新，Linux一般会在注销重新登陆时更新数据库，更新文件库时也可以使用"updatedb"命令进行更新。

```java
[root@ddkk.com ~]# ll
总用量 4
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
[root@ddkk.com ~]# touch abcd
[root@ddkk.com ~]# ll
总用量 4
-rw-r--r--. 1 root root    0 1月   9 03:04 abcd
-rw-------. 1 root root 1134 10月 15 00:20 anaconda-ks.cfg
[root@ddkk.com ~]# locate abcd  数据库未更新，找不到文件
[root@ddkk.com ~]# updatedb 更新数据库
[root@ddkk.com ~]# locate abcd
/root/abcd
```

使用locate命令时，有些目录不会下的文件不会更新记录在数据库中，通过配置文件可以认识并修改这些目录或文件。

配置文件位置：/etc/updatedb.conf

```java
[root@ddkk.com ~]# vi /etc/updatedb.conf
PRUNE_BIND_MOUNTS = "yes"
#开启搜索限制，也就是让这个配置文件生效
PRUNEFS="......"
#在locate执行搜索时，禁止搜索这些文件系统类型。
PRUNENAMES="......"
#在locate执行搜索时，禁止搜索带有这些拓展名的文件。
PRUNEPATHS="......"
#在locate执行搜索时，禁止搜索这些系统目录
```

## find

作用：在目录中搜索文件。

执行权限：所有用户。

### 按照文件名搜索

```java
[root@ddkk.com ~]# find 搜索路径 [选项] 搜索内容
```

常用选项：

选项
作用

-name
按照文件名搜索，具体的文件名。

-iname
按照文件名搜索，不区分大小写。

-inum
按照inode号搜索。

### 按照文件大小搜索

```java
[root@ddkk.com ~]# find 搜索路径  -size  [+|-]大小 
#按照指定的大小搜索文件，+指的是比指定大小要大的文件，-指的是比指定大小小的文件。
```

**按照大小搜索时所规定的单位**：

单位(注意大小写)
含义

b
512个字节，这是默认的单位。

c
字节

w
双字节(一个汉字占两个字节)。

k
1024字节。

M
1024kb。

G
1024Mb。

注：默认单位是b，例如搜索5个单位大小的文件时，实际文件大小应是5*512=2560字节。

### 按照修改时间搜索

Linux文件中有访问时间(atime)、数据修改时间(mtime)、状态修改时间(ctime)这三个时间，我们也可以按照时间来搜索文件，默认单位为天。

```java
[root@ddkk.com ~]# find 搜索路径 [选项] 搜索内容
```

选项：

选项
作用

-atime [+/-]时间
按照访问时间搜索文件

-mtime [+/-]时间
按照数据修改时间搜索文件

-ctime [+/-]时间
按照状态修改时间来搜索文件

注：使用stat命令可以查看文件三个时间属性。

时间含义：

- -5：代表5天内修改过的文件。
- 5：代表5~6天那一天修改过的文件。
- +5：代表6天谴修改的文件。

例：

```java
[root@ddkk.com ~]# find . -mtime -3  搜索当前文件夹三天内修改过的文件 
.
./.lesshst
./abcd
./.bash_history
```

### 按照权限搜索

命令格式：

```java
[root@ddkk.com ~]# find 搜索路径 [选项] 搜索内容
```

选项：

选项
作用

-perm 权限模式
查找文件权限是“权限模式”的文件

-perm -权限模式
查找文件权限包含“权限模式”的文件

-perm +权限模式
查找文件权限包含“权限模式”中任意一个权限的文件

```java
[root@ddkk.com ~]# find . -perm 644 搜索文件权限是644的文件
./.bash_logout
./.bash_profile
./.bashrc
./.tcshrc
./.cshrc
./abcd
```

### 按照文件所有者和所属组搜索

命令格式：

```java
[root@ddkk.com ~]# find 搜索路径 [选项] 搜索内容
```

选项：

选项
含义

-uid 用户ID
按照用户ID查找所有者是指定ID的文件。

-gid 组ID
按照用户组ID查找所属组是指定ID的文件。

-user 用户名
按照用户名查找所有者是指定用户的文件。

-group 组名
按照用户组名查找所属组是指定用户组的文件。

-nouser
查找没有所有者的文件。

注：按照所有者和所属组搜索时，“nouser”选项比较常用，主要用来筛选垃圾文件。只有一种情况例外，俺就是外来文件，如果光盘和u盘里的文件时由windows复制的，在Linux查看时就是没有所有者的文件，还有手工源码包安装的文件，也有可能没有所有者。

### 按照文件类型进行搜索

```java
[root@ddkk.com ~]# find 搜索路径 [选项] 搜索内容
```

选项：

选项
含义

-type d
查找目录。

-type f
查找普通文件。

-type l
查找软链接文件。

例：

```java
[root@ddkk.com ~]# find . -type f  查找当前目录下的普通文件
./.bash_logout
./.bash_profile
./.lesshst
./.bashrc
./.tcshrc
./.cshrc
./anaconda-ks.cfg
./abcd
./.bash_history
```

### 逻辑运算

```java
[root@ddkk.com ~]# find 搜索路径 [选项] 搜索内容
```

选项：

- -a：逻辑与。

-a表示逻辑与运算，使用-a时，find会搜索两个条件都成立的结果。

例：

```java
[root@ddkk.com ~]# find . -size +2c -a -type f 查找当前目录下大于2字节的普通文件
......
```

- -o：逻辑或。

-o表示逻辑或运算，使用-o时，find会搜索满足两个条件中满足任意一个的结果。

```java
[root@ddkk.com ~]# find . -size +2c -o -type f  当前目录下大于2字节的文件或者是当前目录下的普通文件都会被搜索到
......
```

- -not：逻辑非，也可以写成"!"。

-not表示逻辑非运算，也可以写成！，代表取反，搜索不满足条件的结果。

```java
[root@ddkk.com ~]# find . -not -type f  搜索当前目录下不是普通文件的文件
......
[root@ddkk.com ~]# find . ! -type f   同上
......
```

### 其他选项

- -exec选项

这个选项将find命令的结果交给-exec调用的命令2来处理，"{}"就代表find命令搜索的结果

例：

```java
[root@ddkk.com ~]# find . -size +2c -exec ls -lh {} \;  将当前目录下大于2字节的文件列出来，即执行ls -lh命令
总用量 4.0K
-rw-r--r--. 1 root root    0 1月   9 03:04 abcd
-rw-------. 1 root root 1.2K 10月 15 00:20 anaconda-ks.cfg
-rw-r--r--. 1 root root 18 5月  11 2019 ./.bash_logout
-rw-r--r--. 1 root root 176 5月  11 2019 ./.bash_profile
-rw-------. 1 root root 41 1月   9 03:52 ./.lesshst
-rw-r--r--. 1 root root 176 5月  11 2019 ./.bashrc
-rw-r--r--. 1 root root 129 5月  11 2019 ./.tcshrc
-rw-r--r--. 1 root root 100 5月  11 2019 ./.cshrc
-rw-------. 1 root root 1.2K 10月 15 00:20 ./anaconda-ks.cfg
-rw-------. 1 root root 5.6K 1月   9 04:09 ./.bash_history
```

- -ok选项

-ok和-exec选项的作用基本一致，区别在于，“-exec”的命令会直接执行，有时候执行“rm -rf”删除命令是很容易失误删除文件；这个时候就可以使用“-ok”命令，会在处理前先询问用户是否这样处理，在得到确认命令后，才会执行。

例：

```java
[root@ddkk.com ~]# find . -size +2c -ok rm -rf {} \;  将当前目录下大于2字节的文件逐个询问是否删除，
< rm ... . > ? n
......
```

## grep命令：补充命令

**grep**:Globally search a Regular Expression and Print(系统搜索特定规则的文件并输出。

作用：grep的作用是**在文件中**提取和匹配符合条件的**字符串行**。

命令格式：

```java
[root@ddkk.com ~]# grep [选项] "搜索内容" 文件名 如果搜索内容中没有空格，不用加引号也可以搜索，不过为了避免错误尽量规范书写
```

常用选项：

选项
作用

-i
忽略大小写。

-n
输出行号，这里的行号是指符合条件的字符串行在文件内的行号。

-v
反向查找，查找不符合条件的字符串行。

- -color=auto
搜索出的关键字用颜色表示。

## 通配符与正则表达式

### find命令与grep命令的区别

- find命令

find命令用于在系统中符合条件的文件名，如果要模糊查询，则要使用通配符进行匹配，搜索时文件名时完全匹配的（find命令可以通过-regex选项，将匹配原则转为正则表达式规则，但是不建议如此。）
- grep命令

grep命令用于在文件中搜索符合条件的字符串，如果要进行模糊查询，则使用正则表达式进行匹配，搜索时字符串是包含匹配的。
- find命令和grep命令搜索的特性是由于通配符和正则表达式规则的原因。

### 通配符和正则表达式的区别

- 通配符：用于匹配文件名，**完全匹配**

通配符
作用

？
匹配一个任意字符

*
匹配n个或任意多个字符，也就是可以匹配任意内容。

[]
匹配括号中任意一个字符，[abc]代表一定匹配一个字符,或者是a，或者是b，或者是c。

[-]
匹配中括号中任意一个字符，-代表一个范围，例如，[a-z]代表匹配一个小写字母，还可以组合起来，形成[0-9a-z]、[A-Za-z]等用法。

[^]
逻辑非，表示匹配不是括号中的一个字符，例如，[^0-9]代表匹配不是一个数字的字符。

- 正则表达式：用于匹配字符，**包含匹配**

正则符
作用

？
匹配前一个字符重复0次或1次，？符号在shell中属于拓展用法，要用egrep命令。

*
匹配前一个字符重复0次，或任意多次。

[]
匹配括号中任意一个字符，[abc]代表一定匹配一个字符,或者是a，或者是b，或者是c。

[-]
匹配中括号中任意一个字符，-代表一个范围，例如，[a-z]代表匹配一个小写字母，还可以组合起来，形成[0-9a-z]、[A-Za-z]等用法。

[^]
逻辑非，表示匹配不是括号中的一个字符，例如，[^0-9]代表匹配不是一个数字的字符。

^
匹配行首。

$
匹配行尾。

正则表达式中[]、[-]、[^]的用法和通配符一样。

注：通配符和正则表达式的使用方法有些绕，建议多多实践，多敲一敲，还可以看一下网上的教学视频，此文章是本人为了巩固知识的总结，如果能在学习之余帮助到大家，当然更好，有错误希望指出，友好讨论。
