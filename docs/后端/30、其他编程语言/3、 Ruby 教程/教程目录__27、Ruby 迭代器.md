# 27、Ruby 迭代器
- 来源：https://ddkk.com/zhuanlan/other/ruby/27.html
- 分类：Ruby 教程
- 分组：教程目录
迭代(iterate)指的是重复做相同的事，所以迭代器(iterator)就是用来重复多次相同的事

迭代器是 *集合* 支持的方法。 存储一组数据成员的对象称为集合。

在Ruby 中，数组(Array)和哈希(Hash)可以称之为集合。

迭代器返回集合的所有元素，一个接着一个。

本章我们将讨论两种迭代器， *each* 和 *collect*

## Ruby each 迭代器

**each 迭代器** 返回数组或哈希的所有元素

### each 语法格式如下

```ruby
collection.each do |variable|
   code
end
```

为 *集合* 中的每个元素执行 *code* 集合可以是数组或哈希

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
ary = ["Ali","Tencent","Baidu","JD","DiDi"]
ary.each do |i|
    puts i
end 
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
Ali
Tencent
Baidu
JD
DiDi
```

*each* 迭代器总是与一个块关联。 它向块返回数组的每个值，一个接着一个。 值被存储在变量 **i** 中，然后显示在屏幕上

## Ruby collect 迭代器

*collect* 迭代器返回集合的所有元素

### collect 语法格式如下

```ruby
collection = collection.collect
```

*collect* 方法不需要总是与一个块关联。 *collect* 方法返回整个集合，不管它是数组或者是哈希

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
ary = ["Ali","Tencent","Baidu","JD","DiDi"]
b = Array.new
b = ary.collect{ |x|x..x }
puts b
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
Ali..Ali
Tencent..Tencent
Baidu..Baidu
JD..JD
DiDi..DiDi
```

### 注意

*collect* 方法不是数组间进行复制的正确方式。 有另一个称为 *clone* 的方法，用于复制一个数组到另一个数组

当您想要对每个值进行一些操作以便获得新的数组时，通常使用 collect 方法

下面的代码会生成一个数组，其值是 a 中每个值的 13 倍

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
a = [1,3,5,7,11]
b = a.collect{|x| 13*x}
puts b
```

运行范例 »

运行以上范例，输出结果如下：

```ruby
$ ruby main.rb
13
39
65
91
143
```
