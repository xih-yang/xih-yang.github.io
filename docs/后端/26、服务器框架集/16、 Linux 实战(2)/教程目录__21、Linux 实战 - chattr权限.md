# 21、Linux 实战 - chattr权限
- 来源：https://ddkk.com/zhuanlan/server/linux/5/21.html
- 分类：服务器框架
- 分组：教程目录
## 文件系统属性chattr权限

### 设置chattr权限

命令格式：

```java
[root@ddkk.com 1]# chattr 选项 文件或目录名
```

选项：

- +：增加权限
- -：删除权限
- =：等于某权限
- i：如果对文件设置i属性，那么不允许对文件进行修改，也不允许删除文件；如果对目录设置i属性，那可以修改目录下的文件，但不能删除或建立文件。
- a：如果对文件设置a属性，那么只能在文件中增加数据，但是不能删除也不能修改数据，这个时候增加数据只能用"echo"命令；如果对目录设置a属性，只能增加文件和修改文件，不能删除文件。

### 查看chattr权限

命令格式：

```java
[root@ddkk.com 1]# lsattr 选项 文件或目录名
```

选项：

- -d：和ls命令一样，查看目录本身需要用-d选项

e：Linux中绝大多数的文件都默认有e属性，表示该文件是使用ext文件系统进行存储的。

### 例：

- 为文件设置chattr权限

```java
[root@ddkk.com 1]# chattr +i abc
#为文件abc设置i属性，这时文件不能修改，不能删除
[root@ddkk.com 1]# rm -rf abc
rm: 无法删除'abc': 不允许的操作
[root@ddkk.com 1]# lsattr abc
----i---------e----- abc
#查看文件chattr权限
[root@ddkk.com 1]# chattr -i abc
#为文件abc删除i属性
[root@ddkk.com 1]# lsattr abc
--------------e----- abc
```

- 为目录设置chattr权限

```java
[root@ddkk.com ~]# chattr +i 1
[root@ddkk.com ~]# lsattr -d 1
----i---------e----- 1
```
