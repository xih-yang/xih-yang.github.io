# 11、Perl 条件语句
- 来源：https://ddkk.com/zhuanlan/other/perl/11.html
- 分类：Perl 教程
- 分组：教程目录
Perl 条件语句是通过一条或多条语句的执行结果（ True 或者 False ）来决定执行的代码块

## 条件语句流程图

可以通过下图来简单了解条件语句的运行过程

## 条件语句中的真假值

- 数字 0, 字符串 '0' 、 "" , 空 list () , 和 undef 为 **false**
- 其他值均为 **true**
- true 前面使用 **!** 或 **not** 则返回 false

## Perl 提供了下列的条件语句

语句
描述

if 语句
一个if 语句由一个布尔表达式后跟一个或多个语句组成

if...else 语句
一个if 语句后可跟一个可选的else 语句，else 语句在布尔表达式为假时执行

if...elsif...else 语句
您可以在一个if语句后可跟一个可选的elsif 语句，然后再跟另一个else 语句

unless 语句
一个unless 语句由一个布尔表达式后跟一个或多个语句组成

unless...else 语句
一个unless 语句后可跟一个可选的else 语句

unless...elsif..else
一个unless 语句后可跟一个可选的elsif 语句，然后再跟另一个else 语句

switch 语句
在最新版本的 Perl 中，我们可以使用switch语句。它根据不同的值执行对应的代码块

## 三元运算符 ? :

**条件运算 ? :** 可以用来简化 **if...else** 语句的操作

?: 条件语句的语法格式如下：

```sh
Exp1 ? Exp2 : Exp3;
```

如果Exp1 表达式为 true ，则返回 Exp2 表达式计算结果，否则返回 Exp3。

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
$name = "DDKK.COM 弟弟快看，程序员编程资料站";
$scope = 99.9;     #  喜欢数
$status = ($scope > 60 )? "热门网站" : "不是热门网站";
print "$name - $status\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
DDKK.COM 弟弟快看，程序员编程资料站 - 热门网站
```
