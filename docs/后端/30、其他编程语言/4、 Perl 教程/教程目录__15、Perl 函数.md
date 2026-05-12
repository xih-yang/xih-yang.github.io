# 15、Perl 函数
- 来源：https://ddkk.com/zhuanlan/other/perl/15.html
- 分类：Perl 教程
- 分组：教程目录
Perl 函数是执行一个特殊任务的一段分离的代码，它可以使减少重复代码且使程序易读。

Perl 中的函数可以出现在程序的任何地方

### Perl 中定义函数的语法格式如下：

```sh
sub subroutine
{
   statements;
}
```

### 调用函数的语法格式如下：

```sh
subroutine( 参数列表 );
```

在Perl 5.0 之前的版本中调用函数的方法如下所示：

```sh
&subroutine( 参数列表 );
```

> Perl5 版本中虽然也支持该调用方法，但不推荐使用

下面的范例定义了一个名为 hello 的函数并尝试调用它

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 函数定义
sub Hello
{
   print "Hello, World!\n";
   print "Hello, DDKK.COM 弟弟快看，程序员编程资料站\n";
}
# 函数调用
Hello();
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
Hello, World!
Hello, DDKK.COM 弟弟快看，程序员编程资料站
```

## 向函数传递参数

Perl 中的函数可以向其它编程语言中的函数一样接受多个参数。

Perl 中的函数参数使用特殊数组 @_ 标明

因此函数中的第一个参数为 `$` _[0], 第二个参数为 `$` _[1], 以此类推

Perl 中函数参数默认是引用传递，而不管参数是标量型还是数组型的

### 范例 ： 向函数传递参数

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 定义求平均值函数
sub avg
{
   # 获取所有传入的参数
   $n = scalar(@_);
   $sum = 0;
   foreach $item ( @_ )
   {
      $sum += $item;
   }
   $average = $sum / $n;
   print '传入的参数为 : ',"@_\n";            # 打印整个数组
   print "第一个参数值为 : $_[0]\n";           # 打印第一个参数
   print "传入参数的平均值为 : $average\n";    # 打印平均值
}
# 调用函数
avg(5, 17, 33);
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
传入的参数为 : 10 20 30
第一个参数值为 : 10
传入参数的平均值为 : 20
```

在函数中，我们可以通过改变 @_ 数组中的值来改变相应实际参数的值

### 向子程序传递列表

由于@_ 变量是一个数组，所以它可以函数中传递列表。

向函数传递列表有一个小规则：

```sh
 向函数传入标量和数组参数时，需要把列表放在最后一个参数上
```

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 定义函数
sub printList
{
   my @list = @_;
   print "列表为 : @list\n";
}
$a = 13;
@b = (17, 11, 7, 5);
# 列表参数
printList($a, @b);
```

运行以上范例，输出结果为：

```sh
$ perl main.pl
列表为 : 13 17 11 7 5
```

还可以向函数传入多个数组和哈希，但是在传入多个数组和哈希时，会导致丢失独立的标识。 所以我们需要使用引用（下一章节会学习）来传递。

## 向子程序传递哈希

向函数传递哈希表时，函数会将哈希表复制到 @_ 中且被展开为键/值组合的列表

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 函数定义
# 
sub printHash
{
   my (%hash) = @_;
   foreach my $key ( keys %hash ){
      my $value = $hash{$key};
      print "$key : $value\n";
   }
}
%hash = ('name' => 'DDKK.COM 弟弟快看，程序员编程资料站', 'age' => 27,'website'=>'https://www.ddkk.com');
# 传递哈希
printHash(%hash);
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
website : https://www.ddkk.com
name : DDKK.COM 弟弟快看，程序员编程资料站
age : 27
```

## 函数返回值

Perl 中的函数可以像其它编程语言一样使用 return 语句来返回函数值

如果没有使用 return 语句，则函数的最后一行语句的结果将作为返回值

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 函数定义
# 
sub myadd
{
   # 不使用 return
   #
   $_[0]+$_[1];  
}
# 函数定义
# 
sub myadd2
{
   # 使用 return
   return $_[0]+$_[1];  
}
print myadd(3,5);
print "\n";
print myadd2(3,5);
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
8
8
```

Perl 中的函数可以返回标量，数组和哈希，但是在返回多个数组和哈希时，会导致丢失独立的标识。 所以我们需要使用引用（下一章节会学习）来返回多个数组和函数

## 函数中的私有变量

默认情况下，Perl 中所有的变量都是全局变量，也就是说变量在程序的任何地方都可以调用

但我们可以使用 **my** 操作符来定义私有变量。

**my** 操作符用于创建局部作用域变量。 **my** 创建的变量，存活于声明开始的地方，直到闭合作用域的结尾

```sh
sub somefunc {
   my $variable; # $variable 在方法 somefunc() 外不可见
   my ($another, @an_array, %a_hash); #  同时声明多个变量
}
```

闭合作用域指的可以是一对花括号中的区域，可以是一个文件，也可以是一个 if, while, for, foreach, eval字符串

下面的范例演示了如何声明一个或多个私有变量

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 全局变量
$string = "Hello, World!\n";
# 函数定义
sub PrintHello{
   # PrintHello 函数的私有变量
   my $string;
   $string = "Hello, DDKK.COM 弟弟快看，程序员编程资料站!";
   print "函数内字符串：$string\n";
}
# 调用函数
PrintHello();
print "函数外字符串：$string\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
函数内字符串：Hello, DDKK.COM 弟弟快看，程序员编程资料站!
函数外字符串：Hello, World!
```

## 变量的临时赋值

**local** 操作符可以为全局变量提供临时的值，在退出作用域后将原来的值还回去

local 定义的变量不存在于主程序中，但存在函数和该函数调用的子函数中。 定义时可以给其赋值

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 全局变量
$string = "Hello, World!\n";
sub Printsite{
   # PrintHello 函数私有变量
   local $string;
   $string = "Hello, DDKK.COM 弟弟快看，程序员编程资料站!";
   # 子程序调用的子程序
   PrintMe();
   print "Printsite 函数内字符串值：$string\n";
}
sub PrintMe{
   print "PrintMe 函数内字符串值：$string\n";
}
sub PrintHello{
   print "PrintHello 函数内字符串值：$string\n";
}
# 函数调用
Printsite();
PrintHello();
print "函数外部字符串值：$string\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
PrintMe 函数内字符串值：Hello, DDKK.COM 弟弟快看，程序员编程资料站!
Printsite 函数内字符串值：Hello, DDKK.COM 弟弟快看，程序员编程资料站!
PrintHello 函数内字符串值：Hello, World!
函数外部字符串值：Hello, World!
```

## 静态变量

**state** 操作符可以用来定义静态变量，它类似于 C 语言 中的 static 修饰符，

**state** 操作符定义的也是词法变量，所以只在定义该变量的词法作用域中有效

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use feature 'state';
sub PrintCount{
   state $count = 0; # 初始化变量
   print "counter 值为：$count\n";
   $count++;
}
for (1..5){
   PrintCount();
}
```

以上程序执行输出结果为：

```sh
$ perl main.pl
counter 值为：0
counter 值为：1
counter 值为：2
counter 值为：3
counter 值为：4
```

> 注1：state 仅能创建闭合作用域为子程序内部的变量
>
> 注2：state 是从 Perl 5.9.4 开始引入的，所以使用前必须加上 use
>
> 注3：state可以声明标量、数组、哈希。 但在声明数组和哈希时，不能对其初始化（至少 Perl 5.14 不支持）

## 函数调用上下文

函数调用调用过程中，会根据上下文来返回不同类型的值，比如下面中的 localtime() 函数，在标量上下文返回字符串，在列表上下文返回列表:

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 标量上下文
my $datestring = localtime( time );
print $datestring;
print "\n";
# 列表上下文
($sec,$min,$hour,$mday,$mon, $year,$wday,$yday,$isdst) = localtime(time);
printf("%d-%d-%d %d:%d:%d",$year+1900,$mon+1,$mday,$hour,$min,$sec);
print "\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
Thu Oct  5 20:09:40 2017
2017-10-5 20:9:40
```
