# 10、Perl 哈希表
- 来源：https://ddkk.com/zhuanlan/other/perl/10.html
- 分类：Perl 教程
- 分组：教程目录
哈希表是 **key/value** 对的集合

Perl 中哈希表变量以百分号 (%) 标记开始

Perl 中可以使用 ** `$` {key}** 访问哈希表元素

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%data = ('google', 'google.com', 'ddkk', 'ddkk.cn', 'taobao', 'taobao.com');
print "\$data{'google'} = $data{'google'}\n";
print "\$data{'ddkk'} = $data{'ddkk'}\n";
print "\$data{'taobao'} = $data{'taobao'}\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
$data{'google'} = google.com
$data{'ddkk'} = ddkk.cn
$data{'taobao'} = taobao.com
```

## 创建哈希表

Perl 中创建哈希表可以通过以下两种方式：

### 1. 为每个 key 设置 value

```sh
$data{'google'} = 'google.com';
$data{'ddkk'}   = 'ddkk.cn';
$data{'taobao'} = 'taobao.com';
```

### 2. 通过列表设置

列表中第一个元素为 key，第二个为 value。

```sh
%data = ('google', 'google.com', 'ddkk', 'ddkk.cn', 'taobao', 'taobao.com');
```

也可以使用 **=>** 符号来设置 key/value:

```sh
%data = ('google'=>'google.com', 'ddkk'=>'ddkk.cn', 'taobao'=>'taobao.com');
```

### 可以使用 - 来代替引号

```sh
%data = (-google=>'google.com', -ddkk=>'ddkk.cn', -taobao=>'taobao.com');
```

使用这种方式 key 不能出现空格

读取元素方式为：

```sh
$val = %data{-google}
$val = %data{-ddkk}
```

### 范例 ： 使用 - 代替引号

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%data = (-google=>'google.com', -ddkk=>'ddkk.cn', -taobao=>'taobao.com');
print "\$data{'google'} = $data{-google}\n";
print "\$data{'ddkk'} = $data{-ddkk}\n";
print "\$data{'taobao'} = $data{-taobao}\n";
```

运行以上范例，输出结果如下

```sh
$ perl main.pl
$data{'google'} = google.com
$data{'ddkk'} = ddkk.cn
$data{'taobao'} = taobao.com
```

## 访问哈希元素

使用 ** `$` {key}** 可以访问哈希表元素

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%data = ('google'=>'google.com', 'ddkk'=>'ddkk.cn', 'taobao'=>'taobao.com');
print "\$data{'google'} = $data{'google'}\n";
print "\$data{'ddkk'} = $data{'ddkk'}\n";
print "\$data{'taobao'} = $data{'taobao'}\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
$data{'google'} = google.com
$data{'ddkk'} = ddkk.cn
$data{'taobao'} = taobao.com
```

## 读取哈希值

Perl 中，可以像数组一样从哈希中提取值

哈希值提取到数组语法格式： **@{key1,key2}**

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%data = (-taobao => 45, -google => 30, -ddkk => 45);
@array = @data{-taobao, -ddkk};
print "Array : @array\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Array : 45 45
```

## 读取哈希表中所有key

使用 **keys** 函数读取哈希所有的键

keys() 函数语法格式如下：

```sh
keys(%HASH)
```

keys() 函数返回所有哈希的所有 key 的数组

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%data = ('google'=>'google.com', 'ddkk'=>'ddkk.cn', 'taobao'=>'taobao.com');
@names = keys %data;
print "$names[0]\n";
print "$names[1]\n";
print "$names[2]\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
taobao
google
ddkk
```

## 读取哈希表中所有的 values

使用 **values** 函数可以读取哈希所有的值

values() 函数语法格式如下：

```sh
values(%HASH)
```

该函数返回所有哈希的所有 value 的数组

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%data = ('google'=>'google.com', 'ddkk'=>'ddkk.cn', 'taobao'=>'taobao.com');
@urls = values %data;
print "$urls[0]\n";
print "$urls[1]\n";
print "$urls[2]\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
google.com
taobao.com
ddkk.cn
```

## 检测元素是否存在

读取哈希表中读取不存在的 key/value 对 ，会返回 **undefined** 值，且在执行时会有警告提醒。

为了避免这种情况，可以使用 **exists** 函数先判断key是否存在，存在的时候再读取

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%data = ('google'=>'google.com', 'ddkk'=>'ddkk.cn', 'taobao'=>'taobao.com');
if( exists($data{'facebook'} ) ){
   print "facebook 的网址为 $data{'facebook'} \n";
}
else
{
   print "facebook 键不存在\n";
}
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
facebook 键不存在
```

范例中使用的 **IF...ELSE** 语句，我们会在后面的章节中学习到

## 获取哈希大小

Perl 中哈希表大小为元素的个数。

为了计算哈希表的大小，我们可以通过先获取 key 或 value 的所有元素数组，再计算数组元素多少来获取哈希表的大小

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%data = ('google'=>'google.com', 'ddkk'=>'ddkk.cn', 'taobao'=>'taobao.com');
@keys = keys %data;
$size = @keys;
print "1 - 哈希大小: $size\n";
@values = values %data;
$size = @values;
print "2 - 哈希大小: $size\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
1 - 哈希大小: 3
2 - 哈希大小: 3
```

## 哈希表中添加或删除元素

添加key/value 对可以通过简单的赋值来完成。

但是删除哈希表元素则需要使用 **delete** 函数

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
%data = ('google'=>'google.com', 'ddkk'=>'ddkk.cn', 'taobao'=>'taobao.com');
@keys = keys %data;
$size = @keys;
print "1 - 哈希大小: $size\n";
# 添加元素
$data{'facebook'} = 'facebook.com';
@keys = keys %data;
$size = @keys;
print "2 - 哈希大小: $size\n";
# 删除哈希中的元素
delete $data{'taobao'};
@keys = keys %data;
$size = @keys;
print "3 - 哈希大小: $size\n";
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
1 - 哈希大小: 3
2 - 哈希大小: 4
3 - 哈希大小: 3
```
