# 21、Perl 特殊变量
- 来源：https://ddkk.com/zhuanlan/other/perl/21.html
- 分类：Perl 教程
- 分组：教程目录
Perl 语言中定义了一些特殊的变量，通常以 `$` , @, 或 % 作为前缀，例如： `$` _

很多特殊的变量有一个很长的英文名，操作系统变量 `$` ! 可以写为 `$` OS_ERROR

使用英文名的特殊变量需要在程序头部添加 **use English;** 这样就可以使用具有描述性的英文特殊变量

最常用的特殊变量为 `$` _，该变量包含了默认输入和模式匹配内容

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
foreach ('Google','ddkk','qq','Taobao') {
    print $_;
    print "\n";
}
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Google
ddkk
qq
Taobao
```

下面的范例则不使用 `$` _ 来输出内容

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
foreach ('Google','ddkk','qq','Taobao') {
    print;
    print "\n";
}
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Google
ddkk
qq
Taobao
```

在迭代循环中，当前循环的字符串会放在 `$` _ 中, 然后 通过 print 输出 print 在不指定输出变量，默认情况下使用的也是 `$` _

下列是几处即使没有写明 `$` _ 也会假定使用 `$` _ 的地方：

- 各种单目函数，包括像 ord() 和 int() 这样的函数以及除 "-t"以外所有的文件 测试操作 ("-f"，"-d")，"-t" 默认操作 STDIN。
- 各种列表函数，例如 print() 和 unlink()。
- 没有使用 "=~" 运算符时的模式匹配操作 "m//"、"s///" 和"tr///"。
- 在没有给出其他变量时是 "foreach" 循环的默认迭代变量。
- grep() 和 map() 函数的隐含迭代变量。
- 当 "while" 仅有唯一条件，且该条件是对 ""操作的结果进行测试时， `$` _ 就是存放输入记录的默认位置。除了"while" 测试条件之外不会发生这种情况。(助记：下划线在特定操作中是可以省略的。)

## 特殊变量类型

根据特殊的变量的使用性质，可以分为以下几类：

- 全局标量特殊变量
- 全局数组特殊变量
- 全局哈希特殊变量
- 全局特殊文件句柄
- 全局特殊常量
- 正则表达式特殊变量
- 文件句柄特殊变量

### 全局标量特殊变量

以下列出了所有的标量特殊变量，包含了特殊字符与英文形式的变量：

变量
描述

 `$` _
 `$` ARG
默认输入和模式匹配内容

 `$` .
 `$` NR
前一次读的文件句柄的当前行号

 `$` /
 `$` RS
输入记录分隔符,默认是新行字符。如用undef这个变量,将读到文件结尾。

 `$` ,
 `$` OFS
输出域分隔符

 `$` \
 `$` ORS
输出记录分隔符

 `$` "
 `$` LIST_SEPARATOR
该变量同 `$` ,类似，但应用于向双引号引起的字符串(或类似的内插字符串)中内插数组和切片值的场合。默认为一个空格

 `$` ;
 `$` SUBSCRIPT_SEPARATOR
在仿真多维数组时使用的分隔符。默认为 \034

 `$` ^L
 `$` FORMAT_FORMFEED
发送到输出通道的走纸换页符。默认为 \f

 `$` :
 `$` FORMAT_LINE_BREAK_CHARACTERS
当字符串需要被折行时使用的分隔符(以 ^ 符号开始的) 默认为 \n

 `$` ^A
 `$` ACCUMULATOR
打印前用于保存格式化数据的变量

 `$` #
 `$` OFMT
打印数字时默认的数字输出格式（已废弃）。

 `$` ?
 `$` CHILD_ERROR
返回上一个外部命令的状态

 `$` !
 `$` OS_ERROR
 `$` ERRNO
这个变量的数字值是errno的值,字符串值是对应的系统错误字符串

 `$` @
 `$` EVAL_ERROR
命令eval的错误消息.如果为空,则表示上一次eval命令执行成功

 `$` `$`
 `$` PROCESS_ID
 `$` PID
运行当前Perl脚本程序的进程号

 `$`  `$` EFFECTIVE_USER_ID
 `$` EUID
当前进程的有效用户号

 `$` (
 `$` REAL_GROUP_ID
 `$` GID
当前进程的实际组用户号

 `$` )
 `$` EFFECTIVE_GROUP_ID
 `$` EGID
当前进程的有效组用户号

 `$` 0
 `$` PROGRAM_NAME
包含正在执行的脚本的文件名

 `$` [
数组的数组第一个元素的下标,默认是 0

 `$` ]
 `$` PERL_VERSION
Perl的版本号

 `$` ^D
 `$` DEBUGGING
调试标志的值

 `$` ^E
 `$` EXTENDED_OS_ERROR
在非UNIX环境中的操作系统扩展错误信息

 `$` ^F
 `$` SYSTEM_FD_MAX
最大的文件捆述符数值

 `$` ^H
由编译器激活的语法检查状态

 `$` ^I
 `$` INPLACE_EDIT
内置控制编辑器的值

 `$` ^M
备用内存池的大小

 `$` ^O
 `$` OSNAME
操作系统名

 `$` ^P
 `$` PERLDB
指定当前调试值的内部变量

 `$` ^T
 `$` BASETIME
从新世纪开始算起,脚步本以秒计算的开始运行的时间

 `$` ^W
 `$` WARNING
警告开关的当前值

 `$` ^X
 `$` EXECUTABLE_NAME
Perl二进制可执行代码的名字

 `$` ARGV
从默认的文件句柄中读取时的当前文件名

### 全局数组特殊变量

@ARGV
传给脚本的命令行参数列表

@INC
在导入模块时需要搜索的目录列表

@F
命令行的数组输入

### 全局哈希表特殊变量

%INC
散列表 %INC包含所有用 do 或 require 语句包含的文件
关键字是文件名,值是这个文件的路径

%ENV
包含当前环境变量

%SIG
信号列表及其处理方式

### 全局特殊文件句柄

ARGV
遍历数组变量@ARGV中的所有文件名的特殊文件句柄

STDERR
标准错误输出句柄

STDIN
标准输入句柄

STDOUT
标准输出句柄

DATA
特殊文件句柄引用了在文件中 END 标志后的任何内容包含脚本内容。或者引用一个包含文件中__DATA__ 标志后的所有内容，只要你在同一个包有读取数据，DATA 就存在

_ (下划线)
特殊的文件句柄用于缓存文件信息(fstat、stat和lstat)

### 全局特殊常量

END
脚本的逻辑结束，忽略后面的文本。

FILE
当前文件名

LINE
当前行号

PACKAGE
当前包名，默认的包名是main。

### 正则表达式特殊变量

变量
描述

 `$` n
包含上次模式匹配的第n个子串

 `$` &
 `$` MATCH
前一次成功模式匹配的字符串

 `$`
 `$` PREMATCH
前次匹配成功的子串之前的内容

 `$` '
 `$` POSTMATCH
前次匹配成功的子串之后的内容

 `$` +
 `$` LAST_PAREN_MATCH
与上个正则表达式搜索格式匹配的最后一个括号。例如：/Version: (.)|Revision: (.)/ && ( `$` rev = `$` +);

### 文件句柄特殊变量

文件句柄
描述

 `$` |
 `$` OUTPUT_AUTOFLUSH
如果设置为零,在每次调用函数write或print后，自动调用函数 fflush，将所写内容写回文件

 `$` %
 `$` FORMAT_PAGE_NUMBER
当前输出页号

 `$` =
 `$` FORMAT_LINES_PER_PAGE
当前每页长度。默认为 60

 `$` -
 `$` FORMAT_LINES_LEFT
当前页剩余的行数

 `$` ~
 `$` FORMAT_NAME
当前报表输出格式的名称。默认值是文件句柄名

 `$` ^
 `$` FORMAT_TOP_NAME
当前报表输出表头格式的名称
默认值是带后缀 _TOP 的文件句柄名
