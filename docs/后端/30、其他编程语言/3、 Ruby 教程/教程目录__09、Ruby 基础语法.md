# 09、Ruby 基础语法
- 来源：https://ddkk.com/zhuanlan/other/ruby/9.html
- 分类：Ruby 教程
- 分组：教程目录
经历了四五章，终于要开始学习 Ruby 的基础语法了。

我们先来看一下先前的 **Hello World** 范例

我们把下面的代码放到 **main.rb** 文件里。

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts "Hello World!";
puts "Hello DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站";
```

运行范例 »

在这里，假设你已经正确安装了 Ruby，也就是说可以在命令行里使用 ruby 命令

使用以下命令运行 **main.rb**

```ruby
$ ruby main.rb
```

它会产生下面的结果

```ruby
$ ruby main.rb
Hello World!
Hello DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

### Ruby 文件的扩展名

所有的Ruby 文件扩展名都是 **.rb**

### Ruby 程序中的空白

Ruby 代码中的空白字符，如空格和制表符一般会被忽略

除非空白字符出现在字符串中时才不会被忽略。

然而，有时候空白用于解释模棱两可的语句，当启用 **-w** 选项时，这种解释会产生警告

```ruby
a + b   被解释为 a+b   （这是一个局部变量）
a  +b   被解释为 a(+b) （这是一个方法调用）
```

## Ruby 程序的语句之间的分隔符

Ruby 解释器把 **分号(;)**和 **换行符(\n)** 解释为语句的结尾

但是，如果 Ruby 代码在行尾遇到运算符，比如 **+**、**-** 或 **反斜杠(/)**，它们表示一个语句的延续

## Ruby 标识符

标识符是变量、常量和方法的名称。

Ruby 标识符的名称可以包含字母、数字和下划线字符(_)

Ruby 标识符是大小写敏感的。 这意味着 Foo 和 foo 在 Ruby 中是两个不同的标识符

Ruby 中的 **保留字** 不能用作标识符

## 保留字

下表列出了 Ruby 中所有的保留字。

这些保留字不能作为常量或变量的名称

> 虽然这些保留字可以用作方法名，但我们极力不推荐这么做

BEGIN
do
next
then

END
else
nil
true

alias
elsif
not
undef

and
end
or
unless

begin
ensure
redo
until

break
false
rescue
when

case
for
retry
while

class
if
return
while

def
in
self
FILE

defined?
module
super
LINE

## Ruby 中的 Here Document

"Here Document" 是指建立多行字符串。

在 ** 注意 `<< 和 终止符 之间必须没有空格

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
print <<EOF
这是第一种方式创建here document
多行字符串。
EOF
print <<"EOF";                # 与上面相同
这是第二种方式创建here document
多行字符串。
EOF
print `<<EOC                 # 执行命令
echo hi there
echo lo there
EOC
print <<"foo", <<"bar"       # 您可以把它们进行堆叠
I said foo.
foo
I said bar.
bar
```

运行范例 »

运行以上 Ruby 脚本，输出结果如下

```ruby
$ ruby main.rb
这是第一种方式创建here document
多行字符串。
这是第二种方式创建here document
多行字符串。
hi there
lo there
I said foo.
I said bar
```

## Ruby BEGIN 语句

BEGIN 语句中的 *code* 会在程序运行之前被调用

### Ruby BEGIN 语句语法格式如下

```ruby
BEGIN {
   code
}
```

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts "这是主 Ruby 程序"
puts "Hello，DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站"
BEGIN {
  puts "初始化 Ruby 程序"
  puts "BEGIN 中的代码会在程序执行之前运行，而不论它放到哪里"
  puts "-----------------------------------------------------"
}
```

运行以上 Ruby 脚本，输出结果如下

```ruby
$ ruby main.rb
初始化 Ruby 程序
BEGIN 中的代码会在程序执行之前运行，而不论它放到哪里
-----------------------------------------------------
这是主 Ruby 程序
Hello，DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

## Ruby END 语句

END语句会在程序运行结束后被调用

### Ruby END 语句语法格式如下

```ruby
END {
   code
}
```

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
END {
    puts "-----------------------------------------------------"
    puts "结束 Ruby 程序"
    puts "END 中的代码会在程序结束时运行，而不论它放到哪里"
}
puts "这是主 Ruby 程序"
puts "Hello，DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站"
BEGIN {
  puts "初始化 Ruby 程序"
  puts "BEGIN 中的代码会在程序执行之前运行，而不论它放到哪里"
  puts "-----------------------------------------------------"
}
```

运行以上 Ruby 脚本，输出结果如下

```ruby
$ ruby main.rb
初始化 Ruby 程序
BEGIN 中的代码会在程序执行之前运行，而不论它放到哪里
-----------------------------------------------------
这是主 Ruby 程序
Hello，DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
-----------------------------------------------------
结束 Ruby 程序
END 中的代码会在程序结束时运行，而不论它放到哪里
```

## Ruby 语言中的注释

Ruby 解释器会忽略注释语句

注释会对 Ruby 解释器隐藏一行，或者一行的一部分，或者若干行。

Ruby 中的注释分为 **单行注释** 和 **多行注释**

### 单行注释

单行注释以 # 号开始

```ruby
# 我是注释，请忽略我 puts "Hello Ruby!"
```

注释可以跟着语句或表达式的同一行的后面

```ruby
age = 28 # 这也是注释 puts "Hello Ruby!"
```

**#** 可以并排在一起注释多行

```ruby
# 这是注释
# 这也是注释 puts "Hello Ruby!"
# 这也是注释 puts "Hello Ruby!"
# 这还是注释
```

### 多行注释

多行注释以 =begin 开始，以 =end 结束，这之间的所有字符或者语句都会被 Ruby 解释器忽略

```ruby
=begin
这是注释。 puts "Hello Ruby!"
这也是注释。puts "Hello Ruby!"
这也是注释。puts "Hello Ruby!"
这还是注释。puts "Hello Ruby!"
=end
```

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
# 我是注释，请忽略我 puts "Hello Ruby!"
age = 28 # 这也是注释 puts "Hello Ruby!"
# 这是注释
# 这也是注释 puts "Hello Ruby!"
# 这也是注释 puts "Hello Ruby!"
# 这还是注释
=begin
这是注释。 puts "Hello Ruby!"
这也是注释。puts "Hello Ruby!"
这也是注释。puts "Hello Ruby!"
这还是注释。puts "Hello Ruby!"
=end
```

运行以上 Ruby 脚本，输出结果如下

```ruby
$ ruby main.rb
```

可以看到没有任何输出，这说明注释语句内的代码都没有运行
