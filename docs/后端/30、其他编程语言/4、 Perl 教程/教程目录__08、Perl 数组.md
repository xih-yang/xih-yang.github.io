# 08、Perl 数组
- 来源：https://ddkk.com/zhuanlan/other/perl/8.html
- 分类：Perl 教程
- 分组：教程目录
数组一个是存储标量值的无序列表变量。

数组变量以 **@** 开头。

访问数组元素使用 ** `$` + 变量名称 + [索引值]** 格式来读取

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@hits = (25, 30, 40);             
@names = ("google", "DDKK.COM 弟弟快看，程序员编程资料站", "taobao");
print "\$hits[0] = $hits[0]\n";
print "\$hits[1] = $hits[1]\n";
print "\$hits[2] = $hits[2]\n";
print "\$names[0] = $names[0]\n";
print "\$names[1] = $names[1]\n";
print "\$names[2] = $names[2]\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
$hits[0] = 25
$hits[1] = 30
$hits[2] = 40
$names[0] = google
$names[1] = DDKK.COM 弟弟快看，程序员编程资料站
$names[2] = taobao
```

## 创建数组

数组变量以 **@** 符号开始，元素放在括号内。

```sh
@array = (1, 2, 'Hello');
```

也可以**qw//** 运算符定义数组，它返回字符串列表，数组元素以空格分隔。

```sh
@array = qw/这是 一个 数组/;
```

**qw//** 运算符可以跨多行

```sh
@days = qw/google
taobao
...
DDKK.COM 弟弟快看，程序员编程资料站/;
```

最后，也可以按索引来给数组赋值

```sh
$arr[0] = 'Monday';
...
$arr[6] = 'Sunday';
```

## 访问数组元素

使用 ** `$` + 变量名称 + [索引值]** 格式可以访问数组元素

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@sites = qw/google taobao DDKK.COM 弟弟快看，程序员编程资料站/;
print "$sites[0]\n";
print "$sites[1]\n";
print "$sites[2]\n";
print "$sites[-1]\n";    # 负数，反向读取
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
google
taobao
DDKK.COM 弟弟快看，程序员编程资料站
DDKK.COM 弟弟快看，程序员编程资料站
```

数组索引值从 0 开始，即 0 为第一个元素，1 为第二个元素，以此类推。

负数从反向开始读取，-1 为第一个元素， -2 为第二个元素

## 数组序列号

Perl 中，使用 **起始值 + .. + 结束值** 格式可以按序列输出的数组形式

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@var_10 = (1..10);
@var_20 = (10..20);
@var_abc = (a..z);
print "@var_10\n";   # 输出 1 到 10
print "@var_20\n";   # 输出 10 到 20
print "@var_abc\n";  # 输出 a 到 z
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
1 2 3 4 5 6 7 8 9 10
10 11 12 13 14 15 16 17 18 19 20
a b c d e f g h i j k l m n o p q r s t u v w x y z
```

## 数组大小

把数组赋值给一个标量，可以返回数组的长度

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$arrlen = (1,2,3,4,5,6);
print "数组大小: $arrlen \n";
```

运行以上范例，输出结果如下

```sh
$ perl main.pl
数组大小: 6
```

数组长度返回的是数组物理大小，而不是元素的个数

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@array = (1,2,3);
$array[50] = 4;
$size = @array;
$max_index = $#array;
print "数组大小:  $size\n";
print "最大索引: $max_index\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
数组大小:  51
最大索引: 50
```

从范例的结果中可以看出，数组元素只有四个，但是数组大小为 51。

## 添加和删除数组元素

Perl 提供了一些有用的函数来添加和删除数组元素。

> 如果你之前没有编程经验，可能会问什么是函数，其实我们之前使用的 print 即是一个输出函数

下表列出了数组中常用的操作函数：

类型
描述

push(@ARRAY, el)
将列表的值放到数组的末尾

pop(@ARRAY)
弹出数组最后一个值，并返回它

shift(@ARRAY)
弹出数组第一个值，并返回它。数组的索引值也依次减一

unshift(@ARRAY, el)
将列表放在数组前面，并返回新数组的元素个数

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 创建一个简单是数组
@sites = ("google","DDKK.COM 弟弟快看，程序员编程资料站","taobao");
print "1. \@sites  = @sites\n";
# 在数组结尾添加一个元素
push(@sites, "baidu");
print "2. \@sites  = @sites\n";
# 在数组开头添加一个元素
unshift(@sites, "weibo");
print "3. \@sites  = @sites\n";
# 删除数组末尾的元素
pop(@sites);
print "4. \@sites  = @sites\n";
# 移除数组开头的元素
shift(@sites);
print "5. \@sites  = @sites\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
1. @sites  = google DDKK.COM 弟弟快看，程序员编程资料站 taobao
2. @sites  = google DDKK.COM 弟弟快看，程序员编程资料站 taobao baidu
3. @sites  = weibo google DDKK.COM 弟弟快看，程序员编程资料站 taobao baidu
4. @sites  = weibo google DDKK.COM 弟弟快看，程序员编程资料站 taobao
5. @sites  = google DDKK.COM 弟弟快看，程序员编程资料站 taobao
```

## 切割数组

Perl 可以切割一个数组，并返回切割后的新数组

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@sites = qw/google taobao DDKK.COM 弟弟快看，程序员编程资料站 weibo qq facebook 网易/;
@sites2 = @sites[3,4,5];
print "@sites2\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
weibo qq facebook
```

数组索引需要指定有效的索引值，可以是正数后负数，每个索引值使用逗号隔开。

如果是连续的索引，可以使用 .. 来表示指定范围：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@sites = qw/google taobao DDKK.COM 弟弟快看，程序员编程资料站 weibo qq facebook 网易/;
@sites2 = @sites[3..5];
print "@sites2\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
weibo qq facebook
```
