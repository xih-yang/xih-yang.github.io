# 13、Perl 运算符
- 来源：https://ddkk.com/zhuanlan/other/perl/13.html
- 分类：Perl 教程
- 分组：教程目录
运算符用于执行程序代码运算，会针对一个以上操作数项目来进行运算。例如：5+7,其操作数是 5 和 7 ，而运算符则是 +

Perl 语言内置了丰富的运算符，我们把他们归类如下

- 算术运算符
- 比较运算符
- 逻辑运算符
- 赋值运算符
- 位运算符
- 引号运算符
- 其他运算符
- 运算符优先级

## 算术运算符

下表中列出了 Perl 语言支持的算术运算符

我们假设变量 `$` a = 13, `$` b = 17

运算符
描述
范例

+
加法运算
 `$` a + `$` b 结果为 30

-
减法运算
 `$` a - `$` b 结果为 -4

*
乘法运算
 `$` a * `$` b 结果为 221

/
除法运算
 `$` b / `$` a 结果为 1

%
求余运算，整除后的余数
 `$` b % `$` a 结果为 4

**
乘幂
 `$` a** `$` b 结果为 13 的 17 次方

下面的范例演示了 Perl 语言中算术运算符的使用

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$a = 13;
$b = 17;
print "\$a = $a , \$b = $b\n";
$c = $a + $b;
print '$a + $b = ' . $c . "\n";
$c = $a - $b;
print '$a - $b = ' . $c . "\n";
$c = $a * $b;
print '$a * $b = ' . $c . "\n";
$c = $a / $b;
print '$a / $b = ' . $c . "\n";
$c = $a % $b;
print '$a % $b = ' . $c. "\n";
$a = 6;
$b = 8;
$c = $a ** $b;
print '$a ** $b = ' . $c . "\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
$a = 13 , $b = 17
$a + $b = 30
$a - $b = -4
$a * $b = 221
$a / $b = 0.764705882352941
$a % $b = 13
$a ** $b = 1679616
```

## 比较运算符

下表中列出了 Perl 语言支持的比较运算符

我们假设变量 `$` a = 13, `$` b = 17

运算符
描述
范例

==
两个数是否相等，相等则条件为 true，否则为 false
( `$` a == `$` b) 为 false

!=
两个数是否相等，不相等则条件为 true，否则为 false
( `$` a != `$` b) 为 true

两个数是否相等,
如果左边的数小于右边的数返回 -1，
如果相等返回 0,
如果左边的数大于右边的数返回 1
( `$` a  `$` b) 返回 -1

>
左边的数是否大于右边的数，
是则为 true，否则为 false
( `$` a > `$` b) 返回 false

=
左边的数是否大于或等于右边的数，
是则为 true，否则为 false
( `$` a >= `$` b) 返回 false

>
二进制右移运算符。左操作数的值向右移动右操作数指定的位数
 `$` a >> 2 将得到 15 ，二进制为 0000 1111

下面的范例演示了 Perl 语言中 位运算符的使用

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use integer;
$a = 60;
$b = 13;
print "\$a = $a , \$b = $b\n";
$c = $a & $b;
print "\$a & \$b = $c\n";
$c = $a | $b;
print "\$a | \$b = $c\n";
$c = $a ^ $b;
print "\$a ^ \$b = $c\n";
$c = ~$a;
print "~\$a = $c\n";
$c = $a << 2;
print "\$a << 2 = $c\n";
$c = $a >> 2;
print "\$a >> 2 = $c\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
$a = 60 , $b = 13
$a & $b = 12
$a | $b = 61
$a ^ $b = 49
~$a = -61
$a << 2 = 240
$a >> 2 = 15
```

## 逻辑运算符

下表中列出了 Perl 语言支持的逻辑运算符

我们假设变量 `$` a = true, `$` b = false

运算符
描述
范例

and
逻辑与运算符符。如果两个操作数都为 true，则条件为 true
( `$` a and `$` b) 为 false

&&
C 风格的逻辑与运算符符。如果两个操作数都为 true，则条件为 true
( `$` a && `$` b) 为 false

or
逻辑或运算符。如果两个操作数中有任意一个非零，则条件为 true
( `$` a or `$` b) 为 true

||
C 风格逻辑或运算符。如果两个操作数中有任意一个非零，则条件为 true
( `$` a || `$` b) 为 true

not
逻辑非运算符。用来反转操作数的逻辑状态。如果条件为 true，则逻辑非运算符将使其为 false
not( `$` a and `$` b) 为 true

下面的范例演示了 Perl 语言中逻辑运算符的使用

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$a = true;
$b = false;
print "\$a = $a , \$b = $b\n";
$c = ($a and $b);
print "\$a and \$b = $c\n";
$c = ($a  && $b);
print "\$a && \$b = $c\n";
$c = ($a or $b);
print "\$a or \$b = $c\n";
$c = ($a || $b);
print "\$a || \$b = $c\n";
$a = 0;
$c = not($a);
print "not(\$a)= $c\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
$a = true , $b = false
$a and $b = false
$a && $b = false
$a or $b = true
$a || $b = true
not($a)= 1
```

## 大括号运算符

Perl 中大括号也是一种运算符

Perl 中的大括号只要用于给字符串添加各种引号

运算符
描述
范例

q{ }
为字符串添加单引号
q{abcd} 结果为 'abcd'

qq{ }
为字符串添加双引号
qq{abcd} 结果为 "abcd"

qx{ }
为字符串添加反引号
qx{abcd} 结果为 abcd

下面的范例演示了 Perl 中大括号运算符的使用

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$a = 3.1415926;
$b = q{a = $a};
print "q{a = \$a} = $b\n";
$b = qq{a = $a};
print "qq{a = \$a} = $b\n";
# 使用 unix 的 date 命令执行
$t = qx{date};
print "qx{date} = $t\n";
```

以上程序执行输出结果为：

```sh
$ perl main.pl
q{a = $a} = a = $a
qq{a = $a} = a = 3.1415926
qx{date} = 2017年10月 5日 星期四 20时41分27秒 CST
```

## 其他运算符

除了以上我们提到的运算符外，

Perl 还支持下列运算符：

运算符
描述
范例

.
点号 (.) 用于连接两个字符串
 `$` a="ddkk", `$` b=".cn" ， `$` a. `$` b = "ddkk.cn"

x
x 运算符返回字符串重复的次数
('-' x 3) 输出为 ---

..
.. 为范围运算符
(2..5) 输出结果为 (2, 3, 4, 5)

++
自增运算符，整数值增加 1
 `$` a =10, `$` a++ 输出 11

--
自减运算符，整数值减少 1
 `$` a =10, `$` a-- 输出 9

->
指向一个类的方法
 `$` obj-> `$` a 表示对象 `$` obj 的 `$` a 方法

下面的范例演示了上面提到的各种其它运算符

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$a = "ddkk";
$b = ".cn";
print "\$a  = $a ， \$b = $b\n";
$c = $a . $b;
print "\$a . \$b = $c\n";
$c = "-" x 3;
print "\"-\" x 3 = $c\n";
@c = (2..5);
print "(2..5) = @c\n";
$a = 10;
$b = 15;
print "\$a  = $a ， \$b = $b\n";
$a++;
$c = $a ;
print "\$a 执行 \$a++ = $c\n";
$b--;
$c = $b ;
print "\$b 执行 \$b-- = $c\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
$a  = ddkk ， $b = .cn
$a . $b = ddkk.cn
"-" x 3 = ---
(2..5) = 2 3 4 5
$a  = 10 ， $b = 15
$a 执行 $a++ = 11
$b 执行 $b-- = 14
```

## 运算符优先级

下表列出了 Perl 语言的运算符优先级：

运算符符
结合性

++, --
无

-, ~, !
从右到左

**
从右到左

=~, !~
从左到右

*, /, %, x
从左到右

+, -, .
从左到右

>
从左到右

-e, -r,
无

, >=, lt, le, gt, ge
从左到右

==, !=, , eq, ne, cmp
从左到右

&
从左到右

|, ^
从左到右

&&
从左到右

||
从左到右

..
从左到右

? and :
从右到左

=, +=, -=, *=,
从右到左

其他

,
从左到右

not
从左到右

and
从左到右

or, xor
从左到右

下面的范例演示了 Perl 语言中运算符的优先级

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$a = 19;
$b = 13;
$c = 17;
$d = 7;
$e;
print "\$a  = $a, \$b = $b, \$c = $c ，\$d = $d\n";
$e = ($a + $b) * $c / $d;
print "(\$a + \$b) * \$c / \$d  = $e\n";
$e = (($a + $b) * $c )/ $d;
print "((\$a + \$b) * \$c) / \$d  = $e\n";
$e = ($a + $b) * ($c / $d);
print "(\$a + \$b) * (\$c / \$d )  = $e\n";
$e = $a + ($b * $c ) / $d;
print "\$a + (\$b * \$c )/ \$d  = $e\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
$a  = 19, $b = 13, $c = 17 ，$d = 7
($a + $b) * $c / $d  = 77.7142857142857
(($a + $b) * $c) / $d  = 77.7142857142857
($a + $b) * ($c / $d )  = 77.7142857142857
$a + ($b * $c )/ $d  = 50.5714285714286
```
