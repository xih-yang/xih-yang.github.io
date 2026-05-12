# 26、Ruby 范围（Range）
- 来源：https://ddkk.com/zhuanlan/other/ruby/26.html
- 分类：Ruby 教程
- 分组：教程目录
范围（Range）无处不在：a 到 z、 0 到 9、等等

Ruby 支持范围，并允许开发者以不同的方式使用范围：

**1、** 作为序列的范围；

**2、** 作为条件的范围；

**3、** 作为间隔的范围；

## 作为序列的范围

表达序列是最常见的序列。

表达序列有一个起点、一个终点和一个在序列产生连续值的方式

Ruby 使用 **''..''** 和 **''...''** 范围运算符创建表达序列

两点形式创建一个包含指定的最高值的范围，三点形式创建一个不包含指定的最高值的范围

```ruby
(1..5)        #==> 1, 2, 3, 4, 5
(1...5)       #==> 1, 2, 3, 4
('a'..'d')    #==> 'a', 'b', 'c', 'd'
```

序列1..100 是一个 *Range* 对象，包含了两个 *Fixnum* 对象的引用。 可以使用 *to_a* 方法把范围转换为列表

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
$, =", "   # Array 值分隔符
range1 = (1..10).to_a
range2 = ('bar'..'bat').to_a
puts "#{range1}"
puts "#{range2}"
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
["bar", "bas", "bat"]
```

范围实现了可以遍历它们的方法，可以通过多种方式来遍历它们的内容

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
# 指定范围
digits = 2...8
puts digits.include?(5)
ret = digits.min
puts "最小值为 #{ret}"
ret = digits.max
puts "最大值为 #{ret}"
ret = digits.reject {|i| i < 5 }
puts "不符合条件的有 #{ret}"
digits.each do |digit|
   puts "在循环中 #{digit}"
end
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
true
最小值为 2
最大值为 7
不符合条件的有 [5, 6, 7]
在循环中 2
在循环中 3
在循环中 4
在循环中 5
在循环中 6
在循环中 7
```

## 作为条件的范围

范围也可以用作条件表达式

下面的代码片段从标准输入打印行，其中每个集合的第一行包含单词 start ，最后一行包含单词 end

```ruby
while gets
   print if /start/../end/
end
```

范围可以用在 case 语句中

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
score = 70
result = case score
when 0..40
    "糟糕的分数"
when 41..60
    "快要及格"
when 61..70
    "及格分数"
when 71..100
       "良好分数"
else
    "错误的分数"
end
puts result
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
及格分数
```

## 作为间隔的范围

范围的最后一个用途是间隔检测：检查指定值是否在指定的范围内

需要使用 === 相等运算符来完成计算

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
if ((1..10) === 5)
  puts "5 在 (1..10)"
end
if (('a'..'j') === 'c')
  puts "c 在 ('a'..'j')"
end
if (('a'..'j') === 'z')
  puts "z 在 ('a'..'j')"
end
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
5 在 (1..10)
c 在 ('a'..'j')
```
