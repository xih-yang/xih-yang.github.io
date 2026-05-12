# 05、Perl 数据类型
- 来源：https://ddkk.com/zhuanlan/other/perl/5.html
- 分类：Perl 教程
- 分组：教程目录
Perl 是一种解释性的脚本语言，是一种弱类型语言，所以变量不需要指定类型。

Perl 解释器会根据上下文自动选择匹配类型。

Perl 有三个基本的数据类型：**标量**、**数组**、**哈希表**。

### 下面是对这三种数据类型的说明

类型
描述

标量标量
是Perl语言中最简单的一种数据类型。
这种数据类型的变量可以是数字，字符串，浮点数，不作严格的区分。
在使用时在变量的名字前面加上一个  `$`  ,表示是标量
例如：
 `$` myfirst=123;　 #数字123　
 `$` mysecond="123"; #字符串123

数组
数组变量以字符 @ 开头，索引从 0 开始
如：@arr=(1,2,3)@arr=(1,2,3)

哈希表
哈希表是一个无序的 key/value 对集合。可以使用键作为下标获取值。
哈希变量以字符 % 开头。 %h=('a'=>1,'b'=>2);

## 数字字面量

### 1. 整型

Perl 把整形当做浮点数来看待，因为它把整数存在浮点寄存器中

在现代的计算机中，浮点寄存器可以存贮约 16 位数字，长于此的被丢弃。

整形是浮点数的特例

整型变量及运算：

```sh
$num = 520;
if ( 1314 + 520 == 1834 ) {
    # 执行代码语句块
}
```

8进制和 16 进制数：8进制以 0 开始，16进制以 &&0x**开始

```sh
$num1 = 047;    # 等于十进制的 39
$num2 = 0x1f;   # 等于十进制的 31
```

### 2. 浮点数

**浮点数** 像：11.4 、 -0.3 、.3 、 3. 、 54.1e+02 、 5.41e03。

在计算机中，浮点数存储在 浮点寄存器中。

浮点寄存器通常不能精确地存贮浮点数，从而产生误差，在运算和比较中要特别注意。

指数的范围通常为 -309 到 +308

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$num = 9.01e+21 + 0.01 - 9.01e+21;
print ("第一个值为：", $num, "\n");
$num = 9.01e+21 - 9.01e+21 + 0.01;
print ("第二个值为:", $num, "\n");
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
第一个值为：0
第二个值为:0.01
```

### 3. 字符串

Perl 中的字符串使用一个标量来表示

Perl 双引号和单引号的区别:

```sh
双引号可以正常解析一些转义字符与变量，而单引号无法解析会原样输出
```

用单引号可以定义多行文本，如下所示：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$str1='这是一个使用
多行字符串文本
的例子';
print($str1);
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
这是一个使用
多行字符串文本
的例子
```

### 下表是 Perl 语言中常用的转义字符

转义字符
含义

\\
反斜线

\'
单引号

\"
双引号

\a
系统响铃

\b
退格

\f
换页符

\n
换行

\r
回车

\t
水平制表符

\v
垂直制表符

\0nn
创建八进制格式的数字

\xnn
创建十六进制格式的数字

\cX
控制字符，x可以是任何字符

\u
强制下一个字符为大写

\l
强制下一个字符为小写

\U
强制将所有字符转换为大写

\L
强制将所有的字符转换为小写

\Q
将到\E为止的非单词（non-word）字符加上反斜线

\E
结束\L、\U、\Q

#### 范例 : 单引号和双引号及转义字符的使用

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 换行 \n 位于双引号内，有效
$str = "welcome to \nwww.ddkk.com";
print "$str\n";
# 换行 \n 位于单引号内，无效
$str = 'welcome to  \nwww.ddkk.com';
print "$str\n";
# 只有 W 会转换为大写
$str = "\uwelcome to www.ddkk.com";
print "$str\n";
# 所有的字母都会转换为大写
$str = "\Uwelcome to www.ddkk.com";
print "$str\n";
# 指定部分会转换为大写
$str = "Welcome to \Uwww.ddkk\E.cn!"; 
print "$str\n";
# 将到\E为止的非单词（non-word）字符加上反斜线
$str = "\QWelcome to www.ddkk.com's family";
print "$str\n";
```

以上范例执行输出结果为：

```sh
$ perl main.pl
welcome to
www.ddkk.com
welcome to  \nwww.ddkk.com
Welcome to www.ddkk.com
WELCOME TO WWW.TWLE.CN
Welcome to WWW.TWLE.cn!
Welcome\ to\ www\.ddkk\.cn\'s\ family
```
