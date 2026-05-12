# 18、Perl 文件操作
- 来源：https://ddkk.com/zhuanlan/other/perl/18.html
- 分类：Perl 教程
- 分组：教程目录
Perl 内置了丰富的函数用来创建，读写，管理和删除文件。

Perl 使用一种叫做文件句柄类型的变量来操作文件。

从文件读取或者写入数据需要使用文件句柄

文件句柄(file handle)是一个I/O连接的名称

Perl提供了三种文件句柄:STDIN,STDOUT,STDERR，分别代表标准输入、标准输出和标准出错输出

#### Perl 中打开文件可以使用以下方式：

```sh
open FILEHANDLE, EXPR
open FILEHANDLE
sysopen FILEHANDLE, FILENAME, MODE, PERMS
sysopen FILEHANDLE, FILENAME, MODE
```

#### 参数说明:

- FILEHANDLE：文件句柄，用于存放一个文件唯一标识符
- EXPR：文件名及文件访问类型组成的表达式
- MODE：文件访问类型
- PERMS：访问权限位(permission bits)

## open 函数

**open** 函数用来打开一个文件

下面的代码使用 open 函数以只读的方式(`)的方式打开文件 file.txt:

```sh
open(DATA, ">file.txt") or die "file.txt 文件无法打开, $!";
```

**>** 表示写入方式

如果你需要以读写方式打开文件，可以在 >`或`>`** 表示向现有文件的尾部追加数据，如果需要读取要追加的文件内容可以添加 + 号

```sh
open(DATA,"+>>file.txt") || die "file.txt 文件无法打开, $!";
```

### 下表列出了不同的访问模式

模式
描述

w
写入方式打开，将文件指针指向文件头并将文件大小截为零。
如果文件不存在则尝试创建

>>
 a
写入方式打开，将文件指针指向文件末尾。如果文件不存在则尝试创建之

+
 w+
读写方式打开，将文件指针指向文件头并将文件大小截为零。如果文件不存在则尝试创建

+>>
 a+
读写方式打开，将文件指针指向文件末尾。如果文件不存在则尝试创建

## sysopen函数

**sysopen** 函数类似于 open 函数，只是它们的参数形式不一样

下面的代码以读写( +` 操作符

从打开的文件句柄读取信息的主要方法是 `` 操作符 在标量上下文中，它从文件句柄返回单一行

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
print "DDKK.COM 弟弟快看，程序员编程资料站网址?\n";
$name = <STDIN>;
print "网址：$name\n";
```

运行以上范例，会显示一些提示信息，当我们输入网址后 print 语句就会输出：

```sh
$ perl main.pl
DDKK.COM 弟弟快看，程序员编程资料站网址?  
www.ddkk.com   # 用户输入网址
网址：www.ddkk.com
```

使用``操作符时，它会返回文件句柄中每一行的列表

因此我们可以导入所有的行到数组中

新建一个文件名为 demo.txt，内容如下：

```sh
$ cat demo.txt
message:www.ddkk.com
age:29
```

现在读取 demo.txt 并将每一行放到 @lines 数组中：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
open(DATA,"<demo.txt") or die "无法打开数据";
@lines = <DATA>;
print @lines;    # 输出数组内容
close(DATA);
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
message:www.ddkk.com
age:29
```

### getc 函数

**getc** 函数从指定的 FILEHANDLE 返回单一的字符，如果没指定返回 STDIN：

```sh
getc FILEHANDLE
getc
```

如果发生错误，或在文件句柄在文件末尾，则返回 undef

### read 函数

read 函数用于从缓冲区的文件句柄读取信息

read 函数用于从文件读取二进制数据

#### read 函数语法格式如下：

```sh
read FILEHANDLE, SCALAR, LENGTH, OFFSET
read FILEHANDLE, SCALAR, LENGTH
```

#### 参数说明:

- FILEHANDLE：文件句柄，用于存放一个文件唯一标识符。
- SCALAR：存贮结果，如果没有指定OFFSET，数据将放在SCALAR的开头。否则数据放在SCALAR中的OFFSET字节之后。
- LENGTH：读取的内容长度。
- OFFSET：偏移量

#### 返回值

- 如果读取成功返回读取的字节数
- 如果在文件结尾返回 0
- 如果发生错误返回 undef

### print 函数

**print** 函数用来将数据输出到输出设备中

```sh
print FILEHANDLE LIST
print LIST
print
```

利用文件句柄和 print 函数可以把程序运行的结果发给输出设备(STDOUT：标准输出)

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
print "Hello World!\n";
```

### 文件拷贝

将一个文件拷贝为另一个文件，需要先打开已经存在的文件，读取它的每一行，然后写入到新的文件中

下面的范例，打开一个已存在的文件 demo.txt，并读取它的每一行写入到文件 demo1.txt 中

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 只读方式打开文件
open(DATA1, "<demo.txt");
# 打开新文件并写入
open(DATA2, ">demo1.txt");
# 拷贝数据
while(<DATA1>)
{
   print DATA2 $_;
}
close( DATA1 );
close( DATA2 );
```

### 文件重命名

**rename** 函数可以用来重命名一个文件

下面的代码将当前目录下已存在的文件 demo1.txt 重命名为 demo2.txt

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
rename ("demo1.txt", "demo2.txt" );
```

### 删除文件

**unlink** 函数可以用来删除文件

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
unLink("demo.txt");
```

## 指定文件位置

Perl 中可以使用 **tell** 函数来获取文件指针当前的位置 可以使用 **seek** 函数可以用来指定文件指针的位置

### tell 函数

tell 函数用于获取文件位置

#### tell 函数语法格式如下所示：

```sh
tell FILEHANDLE
tell
```

如果指定 FILEHANDLE 该函数返回文件指针的位置，以字节计。 如果没有指定则返回默认选取的文件句柄。

### seek 函数

seek() 函数是通过文件句柄来移动文件读写指针的方式来读取或写入文件的 seek() 函数以字节为单位进行读取和写入

#### seek() 函数的语法格式如下所示

```sh
seek FILEHANDLE, POSITION, WHENCE 
```

#### 参数说明

FILEHANDLE

文件句柄，用于存放一个文件唯一标识符

POSITION

表示文件句柄(读写位置指针)要移动的字节数

WHENCE

表示文件句柄(读写位置指针)开始移动时的起始位置，可以取的值为0、1、2；分别表示文件开头、当前位置和文件尾

#### 下面的代码从文件开头读取 256 个字节：

```sh
seek DATA, 256, 0;
```

## 文件信息

在操作文件之前，我们可以先测试文件是否存在，是否可读写等

我们先创建一个名为 demo.txt 的文件，内容如下： 我么可以先创建 file1.txt 文件，内如如下：

```sh
$ cat demo.txt
message:www.ddkk.com
age:29
```

然后用下面的代码来判断 demo.txt 文件的各种信息

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
my $file = "demo.txt";
my (@description, $size);
if (-e $file)
{
    push @description, '是一个二进制文件' if (-B _);
    push @description, '是一个socket(套接字)' if (-S _);
    push @description, '是一个文本文件' if (-T _);
    push @description, '是一个特殊块文件' if (-b _);
    push @description, '是一个特殊字符文件' if (-c _);
    push @description, '是一个目录' if (-d _);
    push @description, '文件存在' if (-x _);
    push @description, (($size = -s _)) ? "$size 字节" : '空';
    print "$file 信息：", join(', ',@description),"\n";
}
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
demo.txt 信息：是一个文本文件, 27 字节
```

### 下表是 Perl 中的文件测试操作符

操作符
描述

-A
文件上一次被访问的时间(单位：天)

-B
是否为二进制文件

-C
文件的(inode)索引节点修改时间(单位：天)

-M
文件上一次被修改的时间(单位：天)

-O
文件被真实的UID所有

-R
文件或目录可以被真实的UID/GID读取

-S
为socket(套接字)

-T
是否为文本文件

-W
文件或目录可以被真实的UID/GID写入

-X
文件或目录可以被真实的UID/GID执行

-b
为block-special (特殊块)文件(如挂载磁盘)

-c
为character-special (特殊字符)文件(如I/O 设备)

-d
为目录

-e
文件或目录名存在

-f
为普通文件

-g
文件或目录具有setgid属性

-k
文件或目录设置了sticky位

-l
为符号链接

-o
文件被有效UID所有

-p
文件是命名管道(FIFO)

-r
文件可以被有效的UID/GID读取

-s
文件或目录存在且不为0(返回字节数)

-t
文件句柄为TTY(系统函数isatty()的返回结果；不能对文件名使用这个测试)

-u
文件或目录具有setuid属性

-w
文件可以被有效的UID/GID写入

-x
文件可以被有效的UID/GID执行

-z
文件存在，大小为0(目录恒为false)，即是否为空文件，
