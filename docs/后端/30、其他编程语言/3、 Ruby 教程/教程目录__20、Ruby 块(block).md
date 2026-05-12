# 20、Ruby 块(block)
- 来源：https://ddkk.com/zhuanlan/other/ruby/20.html
- 分类：Ruby 教程
- 分组：教程目录
在前面的章节中我们学习了如何定义方法和如何调用方法，知道了方法是实现特定功能的语句的组合。

Ruby 语言还提供了一种比方法更简单的组合语句的方式，这种方式就是 **块( block )**

### 块的概念

- 块是由大量的代码组成
- 块有一个名称
- 块中的代码总是包含在大括号 {} 内
- 块总是从与其具有相同名称的函数调用，也就是说如果块的名称为 hello，那么要使用函数 hello 来调用这个块
- 块也可以被 *yield* 语句来调用块

### 块语法格式

Ruby 块的语法格式如下所示

```ruby
block_name {
   statement1
   statement2
   ..........
}
```

## Ruby yield 语句

块可以被 *yield* 语句来调用。

Ruby 允许使用带有参数的 *yield* 语句来调用块，也允许没有参数的 **yield** 语句来调用块

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def hello
    puts "在 hello 方法内"
    yield
    puts "你又回到了 hello 方法内"
    yield
end
hello{ puts "你在块(block) 内" }
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
在 hello 方法内
你在块(block) 内
你又回到了 hello 方法内
你在块(block) 内
```

### 也可以传递带有参数的 yield 语句

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def hello
    puts "在 hello 方法内"
    yield 17                     
    puts "你又回到了 hello 方法内"
    yield 33
end
hello{ |i| puts "你在块(block #{i}) 内" }  
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
在 hello 方法内
你在块(block 17) 内
你又回到了 hello 方法内
你在块(block 33) 内
```

*yield* 语句后跟着参数。我们甚至可以传递多个参数。

在块中，可以在两个竖线之间放置一个变量来接受参数。 因此，yield 17 语句向 hello 块传递值 17 作为参数

接下来看看下面的语句

```ruby
hello{ |i| puts "你在块(block #{i}) 内" }
```

这条语句中，值 17 会在变量 i 中收到

然后，观察下面的 puts 语句 puts "你在块(block #{i}) 内 这个 puts 语句的输出是：你在块(block 17) 内

### yield 多个参数

如果想要传递多个参数，那么 *yield* 语句则会是这样的：yield a, b 相应的，在块中的格式如下 hello {|a, b| statement} ， 参数使用逗号分隔

## 块和方法

经过上面的学习，我们已经知道了块和方法之间是如何相互关联的

```ruby
通常使用 yield 语句从与其具有相同名称的方法调用块
```

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def hello
    yield
end
hello{ puts "Hello World"}
```

上面的代码是实现块的最简单的方式，使用 *yield* 语句调用 hello 块

如果方法的最后一个参数前带有 &，则可以向该方法传递一个块，且这个块可被赋给最后一个参数

如果* 和 & 同时出现在参数列表中，& 应放在后面

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def hello(&block)
    block.call
end
hello { puts "Hello World!"}
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
Hello World!
```

## BEGIN 和 END 块

每个Ruby 源文件可以声明当文件被加载时要运行的代码块（BEGIN 块），以及程序完成执行后要运行的代码块（END 块）

**1、** 一个程序可以包含多个BEGIN和END块；

**2、** BEGIN块按照它们出现的顺序执行；

**3、** END块按照它们出现的相反顺序执行；

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
BEGIN {
    puts "BEGIN 代码块"  # BEGIN 代码块
} 
END {
    puts "END 代码块" # END 代码块
}
# MAIN 代码块
puts "MAIN 代码块"
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
BEGIN 代码块
MAIN 代码块
END 代码块
```
