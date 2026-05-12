# 29、Perl 进程管理
- 来源：https://ddkk.com/zhuanlan/other/perl/29.html
- 分类：Perl 教程
- 分组：教程目录
Perl 内置了很多函数用于进程的创建、管理和退出。

### Perl 中提供了很多方法来管理进程

- 可以使用特殊变量 `$``$` 或 `$` PROCESS_ID 来获取进程 ID
- %ENV 哈希存放了父进程，也就是 shell 中的环境变量，在 Perl 中可以修改这些变量
- **exit()** 通常用于退出子进程，主进程在子进程全部退出后再退出。
- 所有打开的句柄会在子程序中被 dup() 函数复制, 所以关闭进程中的所有句柄不会影响其他进程

## 反引号运算符

反引号运算符可以用来执行 Unix 命令

我们可以在反引号中插入 shell 命令，执行后将返回结果

```sh
#!/usr/bin/perl
=pod
  file: main.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@files = ls;
foreach $file (@files){
   print $file;
}
1;
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
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
```

## system() 函数

**system()** 函数可以用来执行 Unix 命令, 该函数将直接输出结果。

默认情况下 **system()** 函数的结果会送到当前 Perl 的 STDOUT 指向的地方，但我们也可以使用重定向运算符 >` 输出到指定文件

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
system( "ls")
```

执行以上程序，输出结果如下：

```sh
$ perl main.pl
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
```

当传递给 **system** 函数的参数包含环境变量如 `$` PATH 或 `$` HOME 时，要特别注意

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$PATH = "我是自定义的 Perl 的变量";
system('echo $PATH');  # $PATH 作为 shell 环境变量
system("echo $PATH");  # $PATH 作为 Perl 的变量
system("echo \$PATH"); # 转义 $
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
/usr/local/bin:/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/sbin
我是自定义的 Perl 的变量
/usr/local/bin:/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/sbin
```

## Perl fork() 函数

Perl fork() 函数用于创建一个新进程

fork() 在父进程中返回子进程的PID，在子进程中返回0。

如果发生错误（比如，内存不足）返回 undef，并将 `$` ! 设为对应的错误信息

fork 可以和 exec 配合使用。

exec 函数执行完引号中的命令后进程即结束

### 范例

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
if(!defined($pid = fork())) {
   # fork 发生错误返回 undef
   die "无法创建子进程: $!";
}elsif ($pid == 0) {
   print "通过子进程输出\n";
   exec("date") || die "无法输出日期: $!";
} else {
   # 在父进程中
   print "通过父进程输出\n";
   $ret = waitpid($pid, 0);
   print "完成的进程ID: $ret\n";
}
1;
```

运行范例 »

运行结果:

```sh
通过父进程输出
通过子进程输出
2017年 9月 5日 星期二 14时38分18秒 CST
完成的进程ID: 25742
```

子进程在退出时,会向父进程发送 CHLD 的信号,然后就会变成僵死的进程，需要父进程使用 wait 和 waitpid 来终止。

当然,也可以设置 `$` SIG{CHLD} 为 IGNORG 字符串：

### 范例

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
local $SIG{CHLD} = "IGNORE";
if(!defined($pid = fork())) {
   # fork 发生错误返回 undef
   die "无法创建子进程: $!";
}elsif ($pid == 0) {
   print "通过子进程输出\n";
   exec("date") || die "无法输出日期: $!";
} else {
   # 在父进程中
   print "通过父进程输出\n";
   $ret = waitpid($pid, 0);
   print "完成的进程ID: $ret\n";
}
1;
```

运行范例 »

运行结果:

```sh
通过父进程输出
通过子进程输出
2017年 9月 5日 星期二 14时46分23秒 CST
完成的进程ID: -1
```

## Perl kill() 函数

Perl kill() 函数给一组进程发送信号

### Kill 函数原型

```sh
kill('signal', (Process List))
```

signal 是发送信号的信号名，比如: INT 为来自键盘的中断

### Linux 中常用信号

```sh
信号名          值          标注          解释
————————————————————————————————————————————————————————————
HUP             1           A             检测到挂起
INT             2           A             来自键盘的中断
QUIT            3           A             来自键盘的停止
ILL             4           A             非法指令
ABRT            6           C             失败
FPE             8           C             浮点异常
KILL            9           AF            终端信号
USR1            10          A             用户定义的信号1
SEGV            11          C             非法内存访问
USR2            12          A             用户定义的信号2
PIPE            13          A             写往没有读取者的管道
ALRM            14          A             来自闹钟的定时器信号
TERM            15          A             终端信号
CHLD            17          B             子进程终止
CONT            18          E             如果被停止则继续
STOP            19          DF            停止进程
TSTP            20          D             tty键入的停止命令
TTIN            21          D             对后台进程的tty输入
TTOU            22          D             对后台进程的tty输出
```

### 范例

我们使用 Perl 函数向进程 1024 和 2048 发送 SIGINT 信号

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
kill('INT', 1024, 2048);
1;
```
