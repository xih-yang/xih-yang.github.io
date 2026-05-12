# 19、Perl 目录操作
- 来源：https://ddkk.com/zhuanlan/other/perl/19.html
- 分类：Perl 教程
- 分组：教程目录
Perl 语言内置了一些目录操作相关的函数，方便我们列出目录下的文件，创建目录，删除目录等操作

## Perl 目录操作函数

下面列出了 Perl 一些操作目录的标准函数

函数
描述

opendir DIRHANDLE, EXPR
打开目录

readdir DIRHANDLE
读取目录

rewinddir DIRHANDLE
定位指针到开头

telldir DIRHANDLE
返回目录的当前位置

seekdir DIRHANDLE, POS
定位指定到目录的 POS 位置

closedir DIRHANDLE
关闭目录

## 显示所有的文件

glob 函数和 readdir 函数都可以用显示一个目录下的文件

### 使用 glob 函数列出当前目录下所有文件

```sh
#!/usr/bin/perl
=pod
  file: main.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 显示当前目录下的所有文件
$dir = "./*";
my @files = glob( $dir );
foreach (@files ){
   print $_ . "\n";
}
print "\n";
# 显示当前目录下所有以 .c 结尾的文件
$dir = "./*.c";
@files = glob( $dir );
foreach (@files ){
   print $_ . "\n";
}
print "\n";
# 显示当前目录下所有隐藏文件
$dir = "/tmp/.*";
@files = glob( $dir );
foreach (@files ){
   print $_ . "\n";
}
print "\n";
# 显示 /tmp 和 /home 目录下的所有文件
$dir = "/tmp/* /home/*";
@files = glob( $dir );
foreach (@files ){
   print $_ . "\n";
}
```

运行以上范例，输出结果如下

```sh
$ perl main.pl
./a.out
./cgi
./demo.p
./demo.txt
./demo2.txt
./demo3.txt
./empty.txt
./exist_file.txt
./extern-support.c
./file.txt
./helloworld
./htdocs
./main.c
./main.cpp
./main.pl
./test.txt
./test1.txt
./tmd.py
./extern-support.c
./main.c
/tmp/.
/tmp/..
/tmp/.adobeLockFile
/tmp/.keystone_install_lock
/tmp/0ABD53AA-FC79-49C9-B7BA-D5A930802761
/tmp/1F7D47ED-7F0F-46EB-8A10-64C1F7055256_IN
/tmp/1F7D47ED-7F0F-46EB-8A10-64C1F7055256_OUT
/tmp/2896C2F0-859A-4ECB-B2A4-2B9ED7B340EA
/tmp/A9BE2AEE-31C2-49D6-85BF-5C20725C1BFA
/tmp/adobegc.log
/tmp/AlTest1.err
/tmp/AlTest1.out
/tmp/com.adobe.AdobeIPCBroker.ctrl-luojianguo
/tmp/com.apple.launchd.dIzMzc4gDs
/tmp/com.apple.launchd.whhbWgh9aR
/tmp/ExmanProcessMutex
/tmp/F3998715-E559-44A6-AC95-D8C7744C6DC3
/tmp/F7C71944B49B446081C0603DE90E4855_IN
/tmp/F7C71944B49B446081C0603DE90E4855_OUT
/tmp/lilo.3071
/tmp/mongodb-27017.sock
/tmp/mysql.sock
/tmp/mysql.sock.lock
/tmp/perl
/tmp/PKInstallSandbox.dGJchr
/tmp/zxpsign22RC36iAoQsMQR54
/tmp/zxpsign4cXVB9cz8iuPQE01
/tmp/zxpsignBvdCcPJeSpi55F7k
/tmp/zxpsignC0TuqlzjtHEWZL5X
/tmp/zxpsigncA5w2R1mJBZPKZpV
/tmp/zxpsignEmkBHPIRfABhW70b
/tmp/zxpsignFwmoJPjbhZolWFHf
/tmp/zxpsigngq5V41JMP0dUDo4c
/tmp/zxpsigngxbSkj0qu6A4pyfA
/tmp/zxpsignJCuW7KaRT9UVt6sp
/tmp/zxpsignJJK24XuoIPFEOEfk
/tmp/zxpsignkrOKgrFPR5IOaYe3
/tmp/zxpsignlITwzQlK3w7JUNQH
/tmp/zxpsignLlFOvIc1aNPrOozg
/tmp/zxpsignNa6Vod7ELmDEvuG8
/tmp/zxpsignU3AxpD3V5Sagd1ia
/tmp/zxpsignY253Ab9945nnbha0
/tmp/zxpsignZ1ATOciRFKbHPnX7
```

### 使用 readdir 列出目录下所有文件

readdir 函数可以用来列出一个目录下的所有文件

```sh
#!/usr/bin/perl
=pod
  file: main.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
opendir (DIR, '.') or die "无法打开目录, $!";
while ($file = readdir DIR) {
  print "$file\n";
}
closedir DIR;
```

运行以上范例，输出结果如下

```sh
$ perl main.pl
.
..
a.out
cgi
demo.p
demo.txt
demo2.txt
demo3.txt
empty.txt
exist_file.txt
extern-support.c
file.txt
helloworld
htdocs
main.c
main.cpp
main.pl
test.txt
test1.txt
```

### 显示目录下所有 .c 结尾的文件

readdir 函数可以用来显示一个目录下的所有文件

下面的范例用来显示当前目录下所有以 .c 结尾的文件

```sh
#!/usr/bin/perl
=pod
  file: main.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
opendir(DIR, '.') or die "无法打开目录, $!";
foreach (sort grep(/^.*\.c$/,readdir(DIR))){
   print "$_\n";
}
closedir DIR;
```

运行以上范例，输出结果如下

```sh
$ perl main.pl
extern-support.c
main.c
```

## 创建一个新目录

mkdir 函数可以用来创建一个新目录

执行前需要有足够的权限来创建目录

```sh
#!/usr/bin/perl
=pod
  file: main.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$dir = "/tmp/perl";
# 在 /tmp 目录下创建 perl 目录
mkdir( $dir ) or die "无法创建 $dir 目录, $!";
print "目录创建成功\n";
```

运行以上范例，输出结果如下

```sh
$ perl main.pl
目录创建成功
```

## 删除目录

rmdir 函数可以用来删除目录。

执行该操作需要有足够权限。

要删除的目录必须的空目录。

```sh
#!/usr/bin/perl
=pod
  file: main.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$dir = "/tmp/perl";
# 删除 /tmp 目录下的 perl 目录
rmdir( $dir ) or die "无法删除 $dir 目录, $!";
print "目录删除成功\n";
```

运行以上范例，输出结果如下

```sh
$ perl main.pl
目录删除成功
```

## 切换目录

chdir 函数可以用来切换当前工作目录，执行该操作需要有足够权限

```sh
#!/usr/bin/perl
=pod
  file: main.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$dir = "/home";
# 将当前目录移动到 /home 目录下
chdir( $dir ) or die "无法切换目录到 $dir , $!";
print "你现在所在的目录为 $dir\n";
```

运行以上范例，输出结果如下:

```sh
$ perl main.pl
你现在所在的目录为 /home
```
