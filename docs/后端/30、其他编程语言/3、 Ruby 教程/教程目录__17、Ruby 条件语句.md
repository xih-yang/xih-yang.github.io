# 17、Ruby 条件语句
- 来源：https://ddkk.com/zhuanlan/other/ruby/17.html
- 分类：Ruby 教程
- 分组：教程目录
程序代码默认是一条接着一条顺序执行下去，但有时候我们需要根据一些判断条件执行一些另一些语句或者根据判断条件忽略执行一些语句。 我们把程序的这种行为称之为流程控制

Ruby 编程语言流程控制语句通过程序设定一个或多个条件语句来设定：

- 在条件为 true 时执行指定程序代码
- 在条件为 false 时执行气他指定代码

本章我们会学习所有的条件语句和 Ruby 中可用的修饰符

## Ruby 语言 if...else 语句

### if...else 语句语法格式如下

```ruby
if conditional [then]  
      statement1
[elsif conditional [then] 
      statement2...]...
[else
      statement3...]
end
```

*if* 表达式用于条件执行。

Ruby 语言中，除了 *false* 和 *nil* 为假，其他值都为真，包括 0 也为真

如果 *conditional* 为真，则执行 *statement1* 如果 *conditional* 为假，则执行 else 子句中指定的 *statement3*

then 保留字通常可以省略 但若想在一行内写出完整的 if 式，则必须以 then 隔开条件式和程式区块

```ruby
    if a == 4 then a = 7 end
```

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
age = 16
puts("age = #{age}")
if age > 18
   puts "青春年少奋斗期"
elsif age <= 18 and age > 0
   puts "花样年华一样的年纪"
else
   puts "age 的值有错误"
end
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
age = 16
花样年华一样的年纪
```

## Ruby 语言中的 if 修饰符

### if 修饰符语法格式如下

```ruby
code if condition
```

if修饰符表示如果 *conditiona* 为真，则执行 *code*

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
age = 16
print "age = #{age}\n" if age > 14
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
age = 16
```

## Ruby unless 语句

### unless 语句语法格式如下

```ruby
unless conditional [then] 
   statement1
[else                     
   statement2 ]
end
```

unless 语句和 if 语句作用相反:

- 如果 *conditional* 为假，则执行 *statement1*
- 如果 *conditional* 为真，则执行 else 子句中指定的 *statement2*

**else** 语句是可选的。

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
age = 16
puts("age = #{age} ")
unless age > 18
   puts "花样年华一样的年纪"
 else
  puts "青春奋斗期"
end
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb                       
age = 16 
花样年华一样的年纪
```

## Ruby unless 修饰符

### unless 语句语法格式如下

```ruby
code unless conditional
```

如果 *conditional* 为假，则执行 *code*

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
age = 16
puts("age = #{age} ")
puts("#{age} 岁是花样年华一样的年纪") unless age > 18
puts("\n==================\n")
age = 24
puts("age = #{age} ")
puts("#{age} 岁是正直青春奋斗期") unless age <= 18
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
age = 16 
16 岁是花样年华一样的年纪
==================
age = 24 
24 岁是正直青春奋斗期
```

## Ruby case 语句

### case 语句语法格式如下

```ruby
case expression1  
[when expression2 [, expression3 ...] [then]  
   statmente1 ]...
[else
   statement2 ]
end
```

**case** 语句先对 *expression1* 进行匹配判断，然后根据匹配结果进行分支选择。

**case** 语句使用 **===** 运算符比较 **when** 指定的 *expression* ，若一致的话就执行 **statement1**

### then 关键字

**then** 关键字通常可以省略

但若想在一行内写出完整的 when 式，则必须以 then 隔开条件式和程式区块

```ruby
when a == 4 then a = 7 end
```

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
$age =  5
puts "age = #$age"
case $age
when 0 .. 2
    puts "婴儿"
when 3 .. 6
    puts "小孩"
when 7 .. 12
    puts "child"
when 13 .. 18
    puts "少年"
else
    puts "其他年龄段的"
end
```

运行范例 »

运行以上范例，输出结果为

```ruby
$ ruby main.rb
age = 5
小孩
```

#### 当 case 的 "表达式" 部分被省略时，将计算第一个when条件部分为真的表达式

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
a = false
b = true
c = false
case
when a then puts 'a is true'
when b then puts 'b is true'
when c then puts 'c is true'
end
```

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
b is true
```

### case 语句可以用 if 语句来重写

```ruby
case expr0
when expr1, expr2
   stmt1
when expr3, expr4
   stmt2
else
   stmt3
end
```

可以用if 语句重写为

```ruby
_tmp = expr0
if expr1 === _tmp || expr2 === _tmp
   stmt1
elsif expr3 === _tmp || expr4 === _tmp
   stmt2
else
   stmt3
end
```
