# 07、Perl 标量
- 来源：https://ddkk.com/zhuanlan/other/perl/7.html
- 分类：Perl 教程
- 分组：教程目录
Perl 中的标量是一个简单的数据单元

标量的值可以是一个整数，浮点数，字符，字符串，段落或者一个完整的网页

### 范例 ： Perl 中标量的使用

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$age    = 27;             # 整型
$name   = "DDKK.COM 弟弟快看，程序员编程资料站";      # 字符串
$pi     = 3.1415926;        # 浮点数
print "Age = $age\n";
print "Name = $name\n";
print "pi = $pi\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Age = 27
Name = DDKK.COM 弟弟快看，程序员编程资料站
pi = 3.1415926
```

## 数字标量

Perl 中数字标量通常是一个数字或字符串

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$integer  = 200;
$negative = -300;
$floating = 200.340;
$bigfloat = -1.2E-23;
# 八进制 377 , 十进制为 255 
$octal    = 0377;
# 十六进制 FF, 十进制为 255 
$hexa     = 0xff;
print "integer = $integer\n";
print "negative = $negative\n";
print "floating = $floating\n";
print "bigfloat = $bigfloat\n";
print "octal = $octal\n";
print "hexa = $hexa\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
integer = 200
negative = -300
floating = 200.34
bigfloat = -1.2e-23
octal = 255
hexa = 255
```

## 字符串标量

Perl 中字符串变量是用单引号和双引号引起来的。

> 注意 ： 单引号和双引号的区别

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$var            = "字符串标量 - DDKK.COM 弟弟快看，程序员编程资料站!";
$quote          = '我在单引号内 - $var';
$double         = "我在双引号内 - $var";
$escape         = "转义字符使用 -\tHello, World!";
print "var      = $var\n";
print "quote    = $quote\n";
print "double   = $double\n";
print "escape   = $escape\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
var      = 字符串标量 - DDKK.COM 弟弟快看，程序员编程资料站!
quote    = 我在单引号内 - $var
double   = 我在双引号内 - 字符串标量 - DDKK.COM 弟弟快看，程序员编程资料站!
escape   = 转义字符使用 - Hello, World!
```

## 标量运算

Perl 中的标量可以向其它语言一样，进行一些运算

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$str = "hello" . "world";       # 字符串连接
$num = 5 + 10;                  # 两数相加
$mul = 4 * 5;                   # 两数相乘
$mix = $str . $num;             # 连接字符串和数字
print "str = $str\n";
print "num = $num\n";
print "mix = $mix\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
str = helloworld
num = 15
mix = helloworld15
```

## 多行字符串

Perl 中，单引号可以用来输出多行字符串

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$str = '
DDKK.COM 弟弟快看，程序员编程资料站
    —— DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站！
';
print "$str\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
DDKK.COM 弟弟快看，程序员编程资料站
    —— DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站！
```

### 可以使用 heredoc 的语法格式来输出多行

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
print <<EOF;
DDKK.COM 弟弟快看，程序员编程资料站
    —— DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站！
EOF
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
DDKK.COM 弟弟快看，程序员编程资料站
    —— DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站！
```

## 特殊字符

Perl 中，有一些特殊的标量，比如 **FILE**, **LINE**, 和 **PACKAGE** 它们分别表示当前执行脚本的文件名，行号，包名

这些特殊变量是单独的标记，不能直接写在字符串中

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
print "文件名 ". __FILE__ . "\n";
print "行号 " . __LINE__ ."\n";
print "包名 " . __PACKAGE__ ."\n";
# 无法解析
print "__FILE__ __LINE__ __PACKAGE__\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
文件名 main.pl
行号 13
包名 main
__FILE__ __LINE__ __PACKAGE__
```

## v 字符串

Perl 中，一个以 v 开头,后面跟着一个或多个用句点分隔的整数,会被当作一个字串文本。

可以为每个字符直接声明其数字值时, v-字符串 提供了一种更清晰的构造这类字串的方法

它比"\x{1}\x{14}\x{12c}\x{fa0}" 更易于理解

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$smile  = v520;
$foo    = v102.111.111;
$martin = v77.97.114.116.105.110; 
print "smile = $smile\n";
print "foo = $foo\n";
print "martin = $martin\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Wide character in print at main.pl line 16.
smile = Ȉ
foo = foo
martin = Martin
```
