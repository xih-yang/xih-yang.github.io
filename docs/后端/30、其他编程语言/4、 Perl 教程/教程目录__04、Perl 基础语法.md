# 04、Perl 基础语法
- 来源：https://ddkk.com/zhuanlan/other/perl/4.html
- 分类：Perl 教程
- 分组：教程目录
Perl借用了 C、sed、awk、shell脚本以及很多其他编程语言的特性，语法与这些语言有些类似，也有自己的特点。

Perl 程序有声明与语句组成，程序自上而下执行，包含了循环，条件控制，每个语句以分号 (;) 结束

Perl 语言没有严格的格式规范，我们可以根据自己喜欢的风格来缩进。

## Hello World 第一个 perl 程序

### 1. 交互式编程

我们可以在命令行中使用 -e 选项来输入语句来执行代码，范例如下：

```sh
$ perl -e 'print "Hello World\nHello DDKK.COM 弟弟快看，程序员编程资料站\n"'
```

输入以上命令，按回车后，输出结果为：

```sh
$ perl -e 'print "Hello World\nHello DDKK.COM 弟弟快看，程序员编程资料站\n"'
Hello World
Hello DDKK.COM 弟弟快看，程序员编程资料站
```

### 2. 脚本式编程

我们先将以下代码保存为 **helloworld.pl** 文件中：

#### 范例 : helloworld.pl

```sh
#!/usr/bin/perl
=pod
  file: helloworld.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 输出 "Hello, World"
print "Hello, world\n";
print "Hello DDKK.COM 弟弟快看，程序员编程资料站\n";
```

代码中**/usr/bin/perl** 是 perl 解释器的路径。

在执行该脚本前要先确保文件有可执行权限，我们可以先将文件权限修改为 0755 ：

```sh
$ chmod 0755 hello.pl 
```

然后使用 perl hello.pl 运行我们的脚本，输出如下

```sh
$ perl helloworld.pl
Hello, world
Hello DDKK.COM 弟弟快看，程序员编程资料站
```

print 也可以使用括号来输出字符串，以下两个语句输出相同的结果：

```sh
print("Hello, world\n");
print "Hello, world\n";
```

## Perl 脚本文件

perl 代码可以放在一个文本文件中，以 .pl、.PL 作为扩展名

> 推荐使用 .pl 作为扩展名

文件名可以包含数字，符号和字母，但不能包含空格，可以使用下划线（_）来替代空格

下面是一些合法的简单的 Perl 文件名：

```sh
hello_world.pl
52perl.pl
hello.pl
520.pl
```

## 注释

注释可以让我们的的程序易读，这是好的编程习惯

Perl 中的注释分为单行注释和多行注释

### 1. 单行注释

perl 单行注释的方法为在语句的开头用字符 #，如：

```sh
# 这一行是 perl 中的注释
```

### 2. 多行注释

perl 也支持多行注释，最常用的方法是使用 POD(Plain Old Documentations) 来进行多行注释。

语法格式如下:

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 输出 "Hello, World"
print "Hello, world\n";
print "Hello DDKK.COM 弟弟快看，程序员编程资料站\n";
=pod 注释
这是一个多行注释
这是一个多行注释
这是一个多行注释
这是一个多行注释
=cut
```

运行以上范例，输出结果为:

```sh
$ perl mail.pl
Hello, world
Hello DDKK.COM 弟弟快看，程序员编程资料站
```

#### 注意

多行注释必须按照以下格式来

**1、** =pod、=cut只能在行首；

**2、** 以=开头，以=cut结尾；

**3、** =后面要紧接一个字符，=cut后面可以不用；

## Perl 中的空白符号

Perl 解释器会忽略空白符，也就不会关心有多少个空白，因此以下程序也能正常运行：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 输出 "Hello, World"
print                                       "Hello, world\n";
print "Hello DDKK.COM 弟弟快看，程序员编程资料站\n";
```

运行以上范例，输出结果为:

```sh
$ perl mail.pl
Hello, world
Hello DDKK.COM 弟弟快看，程序员编程资料站
```

但是如果空格和分行出现在字符串内，则会原样输出：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
print      "Hello,\n\t world\n";
print "Hello DDKK.COM 弟弟快看，程序员编程资料站\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Hello,
     world
Hello DDKK.COM 弟弟快看，程序员编程资料站
```

所有类型的空白如：空格，tab ，空行等如果在引号外解释器会忽略它，如果在引号内会原样输出

## 单引号和双引号

perl 中的字符串是使用 单引号或者双引号引起来的，如下所示：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
print "Hello, world\n";
print 'Hello, DDKK.COM 弟弟快看，程序员编程资料站\n'
```

输出结果如下：

```sh
$ perl main.pl
Hello, world
Hello, DDKK.COM 弟弟快看，程序员编程资料站\n
```

从结果中我们可以看出 ： 双引号 \n 输出了换行，而单引号没有

### Perl 双引号和单引号的区别:

**双引号可以正常解析一些转义字符与变量，而单引号无法解析会原样输出**

这几乎所有语言的通用规则

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$num = 17;
print "num = $num\n";
print 'num = $num\n';
```

输出结果如下：

```sh
$ perl main.pl
num = 17
num = $num\n
```

## Here 文档

Here 文档又称作 heredoc、hereis、here-字串 或 here-脚本 ，是一种在命令行 shell（如 sh、csh、ksh、bash、PowerShell 和 zsh ）和程序语言（像 Perl、PHP、Python 和 Ruby ）里定义一个字串的方法

heredoc 使用规则：

**1、** 必须后接分号，否则编译通不过；

**2、** END可以用任意其它字符代替，只需保证结束标识与开始标识一致；

**3、** 结束标识必须顶格独自占一行(即必须从行首开始，前后不能衔接任何空白和字符)；

**4、** 开始标识可以不带引号号或带单双引号，不带引号与带双引号效果一致，解释内嵌的变量和转义符号，带单引号则不解释内嵌的变量和转义符号；

**5、** 当内容需要内嵌引号（单引号或双引号）时，不需要加转义符，本身对单双引号转义，此处相当与q和qq的用法；

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$num = 17;
$var = <<"EOF";
这是一个 Here 文档范例，使用双引号。
可以在这输如字符串和变量。
例如：a = $num
EOF
print "$var\n";
$var = <<'EOF';
这是一个 Here 文档范例，使用单引号。
例如：num = $num
EOF
print "$var\n";
```

执行以上程序输出结果为：

```sh
$ perl main.pl
这是一个 Here 文档范例，使用双引号。
可以在这输如字符串和变量。
例如：a = 17
这是一个 Here 文档范例，使用单引号。
例如：num = $num
```

## 转义字符

如果我们需要输出一个特殊的字符，可以使用反斜线（\）来转义，例如输出美元符号( `$` )

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$result = "DDKK.COM 弟弟快看，程序员编程资料站 \"DDKK.COM 弟弟快看，程序员编程资料站\"";
print "$result\n";
print "\$result\n"
```

运行以上脚本，输出结果如下：

```sh
$ perl main.pl
DDKK.COM 弟弟快看，程序员编程资料站 "DDKK.COM 弟弟快看，程序员编程资料站"
$result
```

## Perl 标识符

Perl 程序中使用的变量名，常量名，函数名，语句块名等统称为标识符。

Perl 中的标识符语法格式如下

- **标识符组成单元：** 英文字母（a~z，A~Z），数字（0~9）和下划线（_）
- 标识符由英文字母或下划线开头
- 标识符区分大小写， `$` num 与 `$` Num 表示两个不同变量
