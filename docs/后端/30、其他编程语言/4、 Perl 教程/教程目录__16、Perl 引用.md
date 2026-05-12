# 16、Perl 引用
- 来源：https://ddkk.com/zhuanlan/other/perl/16.html
- 分类：Perl 教程
- 分组：教程目录
Perl 中的引用是指一个标量类型可以指向变量、数组、哈希表（也叫关联数组）甚至函数，可以应用在程序的任何地方

## 创建引用

定义变量的时候，在变量名前面加个 \，就得到了这个变量的一个引用

```sh
$scalarref = \$foo;     # 标量变量引用
$arrayref  = \@ARGV;    # 列表的引用
$hashref   = \%ENV;     # 哈希的引用
$coderef   = \&handler; # 函数引用
$globref   = \*foo;     # GLOB句柄引用
```

使用[] 可以定义匿名数组的引用：

```sh
$aref= [ 1,"foo",undef,13 ];
```

匿名数组的元素仍然可以是匿名数组。 我们可以用这种方法构造数组的数组，可以构造任意维度的数组

```sh
my $aref = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
]
```

使用{} 可以定义匿名哈希引用：

```sh
$href= { APR =>4, AUG =>8 };
```

甚至可以定义一个匿名函数（匿名函数的引用）:

```sh
$coderef = sub { print "Welcome to www.ddkk.com!\n" };
```

## 解引用

要想从引用的变量中获得原始存储的值可以根据不同的数据类型使用 `$` , @ 或 % 符号

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$var = 10;
# $r 引用 $var 标量
$r = \$var;
# 输出本地存储的 $r 的变量值
print "$var 为 : ", $$r, "\n";
@var = (1, 2, 3);
# $r 引用  @var 数组
$r = \@var;
# 输出本地存储的 $r 的变量值
print "@var 为: ",  @$r, "\n";
%var = ('key1' => 10, 'key2' => 20);
# $r 引用  %var 数组
$r = \%var;
# 输出本地存储的 $r 的变量值
print "%var 为 : ", %$r, "\n";
```

执行以上范例执行结果为：

```sh
$ perl main.pl
10 为 : 10
1 2 3 为: 123
%var 为 : key110key220
```

如果我们不能确定引用的变量类型，可以使用 **ref** 来判断 返回值列表如下，如果没有以下的值返回 false

```sh
SCALAR
ARRAY
HASH
CODE
GLOB
REF
```

### 范例 ： 使用 ref 判断引用的变量类型

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$var = 10;
$r = \$var;
print "r 的引用类型 : ", ref($r), "\n";
@var = (1, 2, 3);
$r = \@var;
print "r 的引用类型 : ", ref($r), "\n";
%var = ('key1' => 10, 'key2' => 20);
$r = \%var;
print "r 的引用类型 : ", ref($r), "\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
r 的引用类型 : SCALAR
r 的引用类型 : ARRAY
r 的引用类型 : HASH
```

## 循环引用

循环引用是指在两个引用相互包含是出现。

我们要小心使用，不然会导致内存泄露

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
my $foo = 100;
$foo = \$foo;
print "Value of foo is : ", $$foo, "\n";
```

执行以上范例执行结果为：

```sh
$ perl main.pl
Value of foo is : REF(0x7fc50a008bc8)
```

## 引用函数

Perl 中可以创建函数的引用

函数引用格式为: &

调用引用函数格式: & + 创建的引用名

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 函数定义
sub PrintHash{
   my (%hash) = @_;
   foreach $item (%hash){
      print "元素 : $item\n";
   }
}
%hash = ('name' => 'DDKK.COM 弟弟快看，程序员编程资料站', 'age' => 3);
# 创建函数的引用
$cref = \&PrintHash;
# 使用引用调用函数
&$cref(%hash);
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
元素 : age
元素 : 3
元素 : name
元素 : DDKK.COM 弟弟快看，程序员编程资料站
```
