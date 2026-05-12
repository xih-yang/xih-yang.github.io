# 06、Perl 变量
- 来源：https://ddkk.com/zhuanlan/other/perl/6.html
- 分类：Perl 教程
- 分组：教程目录
变量是存储在内存中的数据，创建一个变量即会在内存上开辟一个空间用来存储数据

Perl 的解释器会根据变量的类型来决定其在内存中的存储空间，因此我们可以为变量分配不同的数据类型，如整型、浮点型、字符串等。

在前面的章节中，我们已经学习了 Perl 的三个基本的数据类型：标量、数组、哈希：

- 标量 `$` 开始， 如 `$` a `$` b 是两个标量
- 数组 @ 开始 ， 如 @a @b 是两个数组
- 哈希 % 开始 ， %a %b 是两个哈希

Perl 为每种变量类型设置了独立的命令空间，所以不同类型的变量可以使用相同的名称， 不用担心会发生冲突， `$` foo 和 @foo 是两个不同的变量

## 创建变量

Perl 中，变量不需要显式声明类型，在变量赋值后，解释器会自动分配匹配的类型空间

Perl 中，变量使用等号( = )来赋值

> Perl 程序中，我们可以使用 use strict 语句让所有变量需要强制声明类型

Perl 的变量中，等号左边为变量，右边为值：

```sh
$age  = 25;             # 整型
$name = "DDKK.COM 弟弟快看，程序员编程资料站";      # 字符串
$pi   = 3.1415926;      # 浮点数
```

在以上代码中 25, "DDKK.COM 弟弟快看，程序员编程资料站" 和 3.1415926 分别赋值给 * `$` age* , * `$` name* 和 * `$` pi* 变量

## 标量变量

标量是一个单一的数据单元

标量变量的值可以是整数，浮点数，字符，字符串，段落等。

简单的说标量的值可以是任何东西。

### 范例 ： 简单的使用

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$age    = 27;             # 整型
$name   = "DDKK.COM 弟弟快看，程序员编程资料站";      # 字符串
$pi = 3.1415926;        # 浮点数
print "Age = $age\n";
print "Name = $name\n";
print "pi = $pi\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
Age = 27
Name = DDKK.COM 弟弟快看，程序员编程资料站
pi = 3.1415926
```

## 数组变量

数组是用于存储一个有序的标量值的变量

Perl 中，数组 **@** 开始

使用 `$` +变量名[下标] 可以访问数组的变量，并指定下标来访问

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
@ages = (25, 30, 40);             
@comp = ("google", "DDKK.COM 弟弟快看，程序员编程资料站", "taobao");
print "\$ages[0] = $ages[0]\n";
print "\$ages[1] = $ages[1]\n";
print "\$ages[2] = $ages[2]\n";
print "\$comp[0] = $comp[0]\n";
print "\$comp[1] = $comp[1]\n";
print "\$comp[2] = $comp[2]\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
$ages[0] = 25
$ages[1] = 30
$ages[2] = 40
$comp[0] = google
$comp[1] = DDKK.COM 弟弟快看，程序员编程资料站
$comp[2] = taobao
```

> 注意： $ 标记前需要使用了转义字符 () ，这样才能输出字符 $

## 哈希表变量

哈希表是一个 **key/value** 对的集合

Perl 中哈希表变量以 % 开始，如 %data

使用 ** `$` + {key}** 可以访问哈希表中值

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%comp = ('google', 45, 'ddkk', 30, 'taobao', 40);
print "\$comp{'google'} = $comp{'google'}\n";
print "\$comp{'ddkk'} = $comp{'ddkk'}\n";
print "\$comp{'taobao'} = $comp{'taobao'}\n";
```

运行以上范例，输出结果如下：

```sh
$ perl main.pl
$comp{'google'} = 45
$comp{'ddkk'} = 30
$comp{'taobao'} = 40
```

## 变量上下文

**上下文** 指的是表达式所在的位置

上下文是由等号左边的变量类型决定的:

- 等号左边是标量，则是标量上下文
- 等号左边是列表，则是列表上下文

Perl 解释器会根据上下文来决定变量的类型

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
#!/usr/bin/perl
@names = ('google', 'ddkk', 'taobao');
@copy = @names;   # 复制数组
$size = @names;   # 数组赋值给标量，返回数组元素个数
print "名字为 : @copy\n";
print "名字数为 : $size\n";
```

以上程序执行输出结果为：

```sh
$ perl main.pl
名字为 : google ddkk taobao
名字数为 : 3
```

- @names 是一个数组，它应用在了两个不同的上下文中
- @copy = @names 将其复制给另外一个数组，所以它输出了数组的所有元素。
- `$` size = @names 将数组赋值给一个标量，它返回了数组的元素个数。

### 下表是多种不同的上下文

上下文
描述

标量
赋值给一个标量变量，在标量上下文的右侧计算

列表
赋值给一个数组或哈希，在列表上下文的右侧计算

布尔
布尔上下文是一个简单的表达式计算，查看是否为 true 或 false

Void
这种上下文不需要关系返回什么值，一般不需要返回值

插值
这种上下文只发生在引号内
