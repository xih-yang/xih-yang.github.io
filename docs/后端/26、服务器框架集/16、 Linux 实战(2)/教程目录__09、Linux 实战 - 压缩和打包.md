# 09、Linux 实战 - 压缩和打包
- 来源：https://ddkk.com/zhuanlan/server/linux/5/9.html
- 分类：服务器框架
- 分组：教程目录
在Linux中可以识别的常见压缩格式有十几种，比如".zip"、".gz"、".bz2"、".tar"等。对于Linux系统来讲是没有拓展名这一说的，Linux系统不需要靠拓展名来识别文件是那种格式，拓展名的设置是为了用户能够正确的认识文件。

## ".zip"格式

“.zip"是Windows中最常见的压缩格式，Linux也可以正确识别”.zip"格式，**这可以方便地和Windows系统通用压缩文件。** centos 8没有zip，可以通过"dnf install zip"安装。

- 压缩

命令：zip

作用：压缩文件或目录

命令格式：zip [选项] 压缩包名 要压缩的文件

常用选项：-r 压缩目录

例：

```java
[root@ddkk.com ~]# zip test.zip abc bcd  将文件abc、bcd压缩成test.zip文件
```

- 解压缩

命令：unzip

作用：解压zip文件

命令格式：unzip [选项] 压缩包

选项： [-d 目录] 指定解压位置

例：

```java
[root@ddkk.com ~]# unzip -d a test.zip  将test.zip文件解压到a目录下 
Archive:  test.zip
  inflating: a/abc                   
 extracting: a/bcd 
```

## ".gz"格式

".gz"格式压缩文件是Linux最常用的一种压缩文件。

### gzip命令

作用：压缩和解压缩".gz"格式压缩文件。

命令格式：gzip [选项] 源文件

常用选项：

- -c：将压缩数据输出到标准输出中，可以用于保留源文件。
- -d：解压缩。
- -r：压缩目录中的文件，gzip无法打包，只能将目录中的子文件逐个压缩。

例：

```java
[root@ddkk.com ~]# ls
a  abc  anaconda-ks.cfg  bcd  test.zip
[root@ddkk.com ~]# gzip abc   压缩abc
[root@ddkk.com ~]# ls
a  abc.gz  anaconda-ks.cfg  bcd  test.zip abc.gz生成，abc删除
```

gzip命令无法保存源文件，要保存源文件的话，可以利用选项-c：

```java
[root@ddkk.com ~]# ls  查看当前目录中的文件
a  abc  anaconda-ks.cfg  bcd  test.zip
[root@ddkk.com ~]# gzip -c abc >> abc.gz  将压缩文件的数据存入abc.gz中，源文件保留
[root@ddkk.com ~]# ls
a  abc  abc.gz  anaconda-ks.cfg  bcd  test.zip
```

### gunzip命令

作用：解压".gz"格式文件

命令格式：gunzip 压缩文件

## ".bz2"格式

“.bz2"格式压缩文件是Linux另一种压缩格式，从理论上来说，”.bz2"格式算法更加先进，压缩比更好，而".gz"格式相对来讲压缩的时间更快。".bz2"格式无法压缩目录。

### bzip2命令

作用：压缩和解压"bz2"格式压缩文件。

命令格式：bzip2 [选项] 源文件

常用选项：

- -d：解压缩。
- -k：压缩时，保留源文件。
- -v：显示压缩的详细信息。

### bunzip2

作用：解压缩".bz2"格式压缩文件。

命令格式：bunzip2 压缩文件。

## ".tar"格式

### tar命令

作用：打包与解打包。

命令格式：tar [选项] [-f 压缩包名] 源文件或目录

常用选项：

选项
作用

-c
打包

-f
指定压缩包的文件名，打包时一定要写对拓展名，拓展名是给用户看的，若没有拓展名，忘记是什么文件，就无法正确解压文件了。

-v
显示打包或解打包过程。

-x
解打包。

-t
查看包中有哪些文件。

-C
指定解包目录。

例：打包

```java
[root@ddkk.com ~]# tar -cvf a.tar a/  将a目录打包成a.tar
```

例：解包

```java
[root@ddkk.com ~]# tar -xvf a.tar -C b  将a.tar解包到目录b中
......
```

## “.tar.gz"格式和”.tar.bz2"格式

### tar命令

tar命令同样可以用于".tar.gz"格式和".tar.bz2"格式，使用下面的选项。

选项含义：

- -z：压缩和解压缩".tar.gz"格式
- -j：压缩和解压缩".tar.bz2"格式

常用选项
- -zcvf：将文件压缩成".tar.gz"格式
- -zxvf：将".tar.gz"文件解压
- -jcvf：将文件压缩成".tar.bz2"格式
- -jxvf：将".tar.bz2"格式解压

例：".tar.gz"格式

```java
[root@ddkk.com ~]# tar -zcvf test.tar.gz a/ abc abc.gz  将文件abc、abc.gz以及目录a/压缩成test.tar.gz
......
[root@ddkk.com ~]# tar -zxvf test.tar.gz -C b/  将文件test.tar.gz解压到b目录
......
```

例：".tar.bz2"格式

```java
[root@ddkk.com b]# tar -jcvf test.tar.bz2 a/ abc abc.gz j将文件abc、abc.gz以及目录a/压缩成test.tar.bz2
......
[root@ddkk.com ~]# tar -jxvf b/test.tar.bz2 -C ~/  将文件test.tar.bz2解压到家目录
......
```

在Linux中，压缩和打包是不同的操作，".gz"、".bz2"格式是压缩格式，".tar"打包格式。在使用中，".tar.gz"和".tar.bz2"格式更为常用一些。
