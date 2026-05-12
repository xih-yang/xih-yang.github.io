# 03、Linux 实战 - 目录操作命令
- 来源：https://ddkk.com/zhuanlan/server/linux/5/3.html
- 分类：服务器框架
- 分组：教程目录
## 命令基本格式

### 命令提示符

```java
[root@ddkk.com ~]# 
```

- root：代表当前登录的用户。
- localhost：当前系统的简写主机名（用"hostname"命令查看完整主机名：localhost.localdomain）
- ~：代表当前所在的目录，波浪号代表的是家目录，超级用户家目录在"/root",普通用户家目录在"/home/"下
- #：命令提示符，超级用户是"#",普通用户是"`$`"。

### 命令基本格式

```java
[root@ddkk.com ~]# 命令 [选项] [参数]
```

- 中括号表示可选项，可以加也可以不加，按照实际任务选择
- 选项是用来调整命令的功能。
- 参数是命令的操作对象，如果不写，则是默认参数。

#### 举例

ls命令——列出目录下的文件(list)

```java
[root@ddkk.com /]# ls boot
config-4.18.0-338.el8.x86_64                             loader
efi                                                      lost+found
grub2                                                    System.map-4.18.0-338.el8.x86_64
initramfs-0-rescue-54264917d5e142358b6e8ac51ce84000.img  vmlinuz-0-rescue-54264917d5e142358b6e8ac51ce84000
initramfs-4.18.0-338.el8.x86_64.img                      vmlinuz-4.18.0-338.el8.x86_64
initramfs-4.18.0-338.el8.x86_64kdump.img
```

ls可以列出目录下的文件。

```java
[root@ddkk.com /]# ls -a boot
.                                                        initramfs-4.18.0-338.el8.x86_64kdump.img
..                                                       loader
config-4.18.0-338.el8.x86_64                             lost+found
efi                                                      System.map-4.18.0-338.el8.x86_64
grub2                                                    vmlinuz-0-rescue-54264917d5e142358b6e8ac51ce84000
initramfs-0-rescue-54264917d5e142358b6e8ac51ce84000.img  vmlinuz-4.18.0-338.el8.x86_64
initramfs-4.18.0-338.el8.x86_64.img                      .vmlinuz-4.18.0-338.el8.x86_64.hmac
```

ls-a可以列出目录下包括隐藏文件的所有文件，隐藏文件文件名前会加".",表示该文件为隐藏文件。单独的".“表示当前目录，”…"表示上级目录，这两个目录在每个文件夹里都会存在。

```java
[root@ddkk.com /]# ls -l boot
总用量 162447
-rw-r--r--. 1 root root   193903 8月  27 13:41 config-4.18.0-338.el8.x86_64
drwxr-xr-x. 3 root root     1024 10月 15 00:17 efi
drwx------. 4 root root     1024 10月 15 00:19 grub2
-rw-------. 1 root root 84003612 10月 15 00:19 initramfs-0-rescue-54264917d5e142358b6e8ac51ce84000.img
-rw-------. 1 root root 29018916 10月 15 00:20 initramfs-4.18.0-338.el8.x86_64.img
-rw-------. 1 root root 28405760 10月 15 00:51 initramfs-4.18.0-338.el8.x86_64kdump.img
drwxr-xr-x. 3 root root     1024 10月 15 00:17 loader
drwx------. 2 root root    12288 10月 15 00:12 lost+found
-rw-------. 1 root root  4254963 8月  27 13:41 System.map-4.18.0-338.el8.x86_64
-rwxr-xr-x. 1 root root 10218632 10月 15 00:18 vmlinuz-0-rescue-54264917d5e142358b6e8ac51ce84000
-rwxr-xr-x. 1 root root 10218632 8月  27 13:41 vmlinuz-4.18.0-338.el8.x86_64
```

ls-l表示列出目录下文件的详细信息。

```java
[root@ddkk.com /]# ls -al boot
总用量 162455
dr-xr-xr-x.  6 root root     1024 10月 15 00:51 .
dr-xr-xr-x. 18 root root     4096 10月 15 00:19 ..
-rw-r--r--.  1 root root   193903 8月  27 13:41 config-4.18.0-338.el8.x86_64
drwxr-xr-x.  3 root root     1024 10月 15 00:17 efi
drwx------.  4 root root     1024 10月 15 00:19 grub2
-rw-------.  1 root root 84003612 10月 15 00:19 initramfs-0-rescue-54264917d5e142358b6e8ac51ce84000.img
-rw-------.  1 root root 29018916 10月 15 00:20 initramfs-4.18.0-338.el8.x86_64.img
-rw-------.  1 root root 28405760 10月 15 00:51 initramfs-4.18.0-338.el8.x86_64kdump.img
drwxr-xr-x.  3 root root     1024 10月 15 00:17 loader
drwx------.  2 root root    12288 10月 15 00:12 lost+found
-rw-------.  1 root root  4254963 8月  27 13:41 System.map-4.18.0-338.el8.x86_64
-rwxr-xr-x.  1 root root 10218632 10月 15 00:18 vmlinuz-0-rescue-54264917d5e142358b6e8ac51ce84000
-rwxr-xr-x.  1 root root 10218632 8月  27 13:41 vmlinuz-4.18.0-338.el8.x86_64
-rw-r--r--.  1 root root      166 8月  27 13:40 .vmlinuz-4.18.0-338.el8.x86_64.hmac
```

ls-a和ls -l可以一起使用，列出目录下所有文件的详细信息，表示为"ls -al"。

## 目录操作命令

### ls(List)

作用：列出目录的相关信息

常用选项：

选项
作用

-a
列出包括隐藏文件的所有文件。

-d
仅列出目录本身。

-h
将文件大小以易读的方式列出来。

-i
列出inode(节点)码。

-l
详细信息显示，包括文件的权限以及属性等信息。

执行权限：所有用户

### cd(Change Directory)

作用：切换所在目录

简化用法:

特殊符号
作用

~
回到家目录，当直接使用cd时默认回到家目录。

-
回到上次工作的目录。

.
当前目录。

. .
上级目录。

执行权限：所有用户

相关知识：绝对路径与相对路径

- 绝对路径：以根目录作为参照，一级一级进去所需目录。
- 相对路径：以当前目录作为参照。

### pwd(Print Working Directory)

作用：查看当前工作目录，显示绝对路径。

### mkdir(Make Directories)

作用：创建目录。

执行权限：所有用户。

常用选项：-p 递归创建所需目录。

例：

```java
[root@ddkk.com ~]# mkdir -p 123/234
[root@ddkk.com ~]# ls
123  anaconda-ks.cfg
[root@ddkk.com ~]# cd 123
[root@ddkk.com 123]# ls
234
[root@ddkk.com 123]# cd 234
[root@ddkk.com 234]# pwd
/root/123/234
```

### rmdir(Remove Empty Directories)

作用：删除空目录。

因为rmdir比较“笨拙”，**只能删除空目录**，所以一般不使用，删除目录一般使用rm命令。rm -r可以删除文件夹，但会频繁询问，rm -rf可以直接强制删除，但无法恢复，因为Linux不像Windows有回收站，所以为了避免误删，可以在系统中安装开源软**extundelete**，有一定可能可以回复误删的文件，且需要在删除之前安装。
