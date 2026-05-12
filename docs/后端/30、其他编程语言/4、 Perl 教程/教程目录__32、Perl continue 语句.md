# 32、Perl continue 语句
- 来源：https://ddkk.com/zhuanlan/other/perl/32.html
- 分类：Perl 教程
- 分组：教程目录
Perl 中的 **continue** 语句用于停止执行从 continue 语句的下一语句开始到循环体结束标识符之间的语句，返回到循环体的起始处开始执行下一次循环

continue 语句可用在 while 和 foreach 循环中。

### continue 语句语法格式

Perl 中 while 循环中 continue 语句语法格式如下所示：

```sh
while(condition)
{
   statement(s);
} continue
{
   statement(s);
}
```

foreach 循环中 continue 语句语法格式如下所示：

```sh
foreach $a (@listA)
{
   statement(s);
}continue
{
   statement(s);
}
```

### 范例 : while 循环中使用 continue 语句

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$step = 5;
while( $step < 9 )
{
   print "step = $step\n";
}continue
{
   $step += 1;
}
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
step = 5
step = 6
step = 7
step = 8
```

### 范例 ： foreach 循环中使用 continue 语句：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@list = (1, 3, 5, 7, 9);
foreach $value (@list)
{
   print "value = $value\n";
}continue{
   last if $value == 7;
}
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
value = 1
value = 3
value = 5
value = 7
```
