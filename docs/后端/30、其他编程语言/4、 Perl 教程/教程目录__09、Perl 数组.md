# 09、Perl 数组
- 来源：https://ddkk.com/zhuanlan/other/perl/9.html
- 分类：Perl 教程
- 分组：教程目录
数组一个是存储标量值的无序列表变量。

数组变量以 **@** 开头。

## 替换数组元素

Perl 中可以使用splice() 函数来替换数组元素

splice() 函数语法格式如下：

```sh
splice ( @ARRAY, OFFSET [ , LENGTH [ , LIST ] ] )
```

参数说明：

- @ARRAY： 要替换的数组
- OFFSET： 起始位置
- LENGTH： 替换的元素个数
- LIST： 替换元素列表

### 范例 ： 第6个元素开始替换数组中的5个元素

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@nums = (1..20);
print "替换前 - @nums\n";
splice(@nums, 5, 5, 21..25); 
print "替换后 - @nums\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
替换前 - 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20
替换后 - 1 2 3 4 5 21 22 23 24 25 11 12 13 14 15 16 17 18 19 20
```

## 将字符串转换为数组

Perl 中使用 split() 函数可以将字符串转换为数组

split() 函数语法格式如下：

```sh
split( [ PATTERN [ , EXPR [ , LIMIT ] ] ])
```

参数说明：

- PATTERN： 分隔符，默认为空格
- EXPR： 指定字符串数
- LIMIT： 如果指定该参数，则返回该数组的元素个数

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 定义字符串
$var_test = "www.ddkk.com";
$var_string = "www.ddkk.com";
$var_names = "google,taobao,DDKK.COM 弟弟快看，程序员编程资料站,weibo";
# 字符串转为数组
@test = split('', $var_test);
@string = split('-', $var_string);
@names  = split(',', $var_names);
print "$test[3]\n";  # 输出 com
print "$string[2]\n";  # 输出 com
print "$names[3]\n";   # 输出 weibo
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
.
cn
weibo
```

## 将数组转换为字符串

Perl 中使用 join() 函数可以将数组转换为字符串

join() 函数语法格式如下：

```sh
join(EXPR, LIST)
```

参数说明：

- EXPR：连接符
- LIST：列表或数组

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 定义字符串
$var_string = "www.ddkk.com";
$var_names = "google,taobao,DDKK.COM 弟弟快看，程序员编程资料站,weibo";
# 字符串转为数组
@string = split('-', $var_string);
@names  = split(',', $var_names);
# 数组转为字符串
$string1 = join( '-', @string );
$string2 = join( ',', @names );
print "$string1\n";
print "$string2\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
www.ddkk.com
google,taobao,简单
```

## 数组排序

Perl 中使用 **sort()** 函数可以给数组排序

sort() 函数语法格式如下：

```sh
sort ([ SUBROUTINE ] LIST)
```

参数说明：

- SUBROUTINE: 指定规则
- LIST: 列表或数组

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 定义数组
@sites = qw(google taobao DDKK.COM 弟弟快看，程序员编程资料站 facebook);
print "排序前: @sites\n";
# 对数组进行排序
@sites = sort(@sites);
print "排序前: @sites\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
排序前: google taobao DDKK.COM 弟弟快看，程序员编程资料站 facebook
排序前: facebook google taobao DDKK.COM 弟弟快看，程序员编程资料站
```

> 注意
>
> 数组排序是根据 ASCII 数字值来排序。 因此在对数组进行排序时最好先将每个元素转换为小写后再排序。

## 特殊变量： $ [

特殊变量 ** `$` [** 表示数组的第一索引值，一般都为 0 ，如果我们将 ** `$` [** 设置为 1，则数组的第一个索引值即为 1，第二个为 2，以此类推。

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 定义数组
@sites = qw(google taobao DDKK.COM 弟弟快看，程序员编程资料站 facebook);
print "网站: @sites\n";
# 设置数组的第一个索引为 1
$[ = 1;
print "\@sites[1]: $sites[1]\n";
print "\@sites[2]: $sites[2]\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Use of assignment to $[ is deprecated at main.pl line 17.
网站: google taobao DDKK.COM 弟弟快看，程序员编程资料站 facebook
@sites[1]: google
@sites[2]: taobao
```

> 一般情况我们不建议使用特殊变量 ** $ [** ，在新版 Perl 中，该变量已废弃。

## 使用逗号(,)运算符可以合并数组

数组的元素是以逗号来分割

同时也可以使用逗号来合并数组

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@nums = (1,3,(4,5,6));
print "nums = @nums\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
nums = 1 3 4 5 6
```

也可以在数组中嵌入多个数组，并合并到主数组中：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@odd = (1,3,5);
@even = (2, 4, 6);
@nums = (@odd, @even);
print "nums = @nums\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
numbers = 1 3 5 2 4 6
```

## 从列表中选择元素

一个列表可以当作一个数组使用

在列表后指定索引值可以读取指定的元素

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$nums = (5,4,3,2,1)[4];
print "nums 的值为 = $nums\n"
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
nums 的值为 = 1
```

## 使用 .. 运算符来读取指定范围的元素

运算符.. 可以在数组中指定范围的元素

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@nums = (5,4,3,2,1)[1..3];
print "nums 的值 = @nums\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
nums 的值 = 4 3 2
```
