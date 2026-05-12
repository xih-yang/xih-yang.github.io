# 18、Ruby 循环语句
- 来源：https://ddkk.com/zhuanlan/other/ruby/18.html
- 分类：Ruby 教程
- 分组：教程目录
很多情况下，我们可能需要重复的执行某些语句。我们把这些需要重复执行的语句称之为循环体。

循环体能否一直继续重复执行，决定循环的终止条件

循环结构是在一定条件下反复执行某段程序的流程结构，被反复执行的程序被称为循环体。

循环语句是由循环体及循环的终止条件两部分组成的。

本章节将学习 Ruby 支持的所有循环语句

## Ruby while 语句

### while 语句语法格式如下

```ruby
while conditional [do]  
   code1
end
```

或者

```ruby
while conditional [:]  
   code
end
```

当 *conditional* 为真时，执行 *code1*

语法中**do** 或 **:** 可以省略不写 但若要在一行内写出 while 式，则必须以 do 或 : 隔开条件式或程式区块

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
i = 1
while i < 5 do
   puts("在 while 循环语句中 i = #{i}" )
   i +=1
end
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
在 while 循环语句中 i = 1
在 while 循环语句中 i = 2
在 while 循环语句中 i = 3
在 while 循环语句中 i = 4
```

## Ruby while 修饰符

### while 修饰符语法格式如下

```ruby
statement while condition  
```

或

```ruby
begin 
  statement  
end while condition  
```

当 *conditional* 为真时，执行 *statement*

如果 *while* 修饰符跟在一个没有 *rescue* 或 ensure 子句的 *begin* 语句后面， *statement* 会在 *condition* 判断之前执行一次。

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
i = 1
begin
   puts("在 while 修饰符循环语句中 i = #{i}" )
   i +=1
end while i < 5
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
在 while 修饰符循环语句中 i = 1
在 while 修饰符循环语句中 i = 2
在 while 修饰符循环语句中 i = 3
在 while 修饰符循环语句中 i = 4
```

## Ruby until 语句

### until 语句语法格式

```ruby
until conditiona [do]  
   statement
end
```

当 *conditiona* 为假时，执行 *statement*

语法中do 可以省略不写。但若要在一行内写出 until 式，则必须以 do 隔开条件式或程式区块

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
step = 6
until step > 10  do
   puts( "step = #{step}" )
   step += 1
end
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
step = 6
step = 7
step = 8
step = 9
step = 10
```

## Ruby until 修饰符

### until 修饰符语法格式如下

```ruby
statement until condition
```

或

```ruby
begin
   statement
end until condition
```

当 *condition* 为 false 时，执行 *statement*

如果 *until* 修饰符跟在一个没有 *rescue* 或 ensure 子句的 *begin* 语句后面， *statement* 会在 *condition* 判断之前执行一次

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
step = 6
begin
   puts("step = #{step}" )
   step += 1
end until step  > 10
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
step = 6
step = 7
step = 8
step = 9
step = 10
```

## Ruby for 语句

### for 语句语法格式如下

```ruby
for variable [, variable ...] in expression [do]
   statement
end
```

先计算表达式 expression 得到一个对象，然后针对 *expression* 中的每个元素分别执行一次 *statement*

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
for step in 6..10   
    puts "step =  #{step}"
 end
```

运行范例 »

我们定义了范围 6..10。语句 for i in 6..10 允许 i 的值从 6 到 10（包含 10）

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
step =  6
step =  7
step =  8
step =  9
step =  10
```

### for...in 循环几乎是完全等价于

```ruby
(expression).each do |variable[, variable...]| code end
```

区别就是 for 循环不会为局部变量创建一个新的作用域

语法中do 可以省略不写。但若要在一行内写出 for 式，则必须以 do 隔开条件式或程式区块。

#### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
(6..10).each do |step|
    puts "step = #{step}"
 end
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
step = 6
step = 7
step = 8
step = 9
step = 10
```

## Ruby break 语句

**break** 语句用于终止 break 语句所在块的循环

### break 语句语法格式如下

```ruby
break
```

break 语句用于终止最内部的循环 如果在块内调用，则终止相关块的方法 ( 方法返回 nil )

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
for i in 7..15
    if i > 9 then
       break
    end
    puts "局部变量的值为 #{i}"
 end
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
局部变量的值为 7
局部变量的值为 8
局部变量的值为 9
```

## Ruby next 语句

next 语句用于跳过剩下的代码，开始进入下一个循环迭代

### next 语句语法格式如下

```ruby
next
```

next 语句用于跳到循环的下一个迭代。 如果在块内调用，则终止块的执行 (*yield* 表达式返回 nil)

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
for i in 0..3
    if i < 2 then
       next
    end
    puts "局部变量的值为 #{i}"    
end
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
局部变量的值为 2
局部变量的值为 3
```

## Ruby redo 语句

redo 语句用于重新开始 redo 所在代码块的循环迭代

### redo 语句语法格式如下

```ruby
redo
```

重新开始最内部循环的该次迭代，不检查循环条件 如果在块内调用，则重新开始 *yield* 或 *call*

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
cnt = 0
for i in 0..3
    puts "局部变量的值为 #{i}"
    if i < 3 and cnt < 2 then
       cnt += 1
       redo
    end
end
puts "cnt = #{cnt}"
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
局部变量的值为 0
局部变量的值为 0
局部变量的值为 0
局部变量的值为 1
局部变量的值为 2
局部变量的值为 3
cnt = 2
```

## Ruby retry 语句

> 注意：1.9 以及之后的版本不支持在循环中使用 retry 语句

### retry 语句语法格式

```ruby
retry
```

如果 *retry* 出现在 begin 表达式的 rescue 子句中，则从 begin 主体的开头重新开始。

```ruby
begin
   do_something   # 抛出的异常
rescue
   statement1     # 处理错误
   retry          # 重新从 begin 开始
end
```

如果retry 出现在迭代内、块内或者 for 表达式的主体内，则重新开始迭代调用。 迭代的参数会重新评估。

```ruby
for i in 1..5
   retry if some_condition # 重新从 i == 1 开始
end
```

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
for i in 1..5
   retry if  i > 2
   puts "局部变量的值为 #{i}"
end
```

运行以上范例，输出结果如下，并会进入一个无限循环

```ruby
$ ruby main.rb
局部变量的值为 1
局部变量的值为 2
局部变量的值为 1
局部变量的值为 2
局部变量的值为 1
局部变量的值为 2
..........
```

可以使用 CTRL+C 组合键退出循环
