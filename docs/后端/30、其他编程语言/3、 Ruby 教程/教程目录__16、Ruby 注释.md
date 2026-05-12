# 16、Ruby 注释
- 来源：https://ddkk.com/zhuanlan/other/ruby/16.html
- 分类：Ruby 教程
- 分组：教程目录
其实我们在 Ruby 基础语法 已经比较详细的介绍了 Ruby 语言中的注释

Ruby 解释器会忽略注释语句

注释会对 Ruby 解释器隐藏一行，或者一行的一部分，或者若干行。

Ruby 中的注释分为 单行注释 和 多行注释

### 单行注释

单行注释以 # 号开始

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts "Hello www.ddkk.com"
# 这是一个单行注释。 
puts "Hello, Ruby!"
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
Hello www.ddkk.com
Hello, Ruby!
```

## Ruby 多行注释

多行注释

多行注释以 =begin 开始，以 =end 结束，这之间的所有字符或者语句都会被 Ruby 解释器忽略

```ruby
#!/usr/bin/ruby -w
puts "Hello, Ruby!"
=begin
这是一个多行注释。 puts("Hello,这是注释")
可扩展至任意数量的行。
但 =begin 和 =end 只能出现在第一行和最后一行。 
=end
puts("Hello, www.ddkk.com")
```

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
Hello, Ruby!
Hello www.ddkk.com
```

### Ruby 注释最佳实战

**1、** 任何时候都要确保尾部的注释离代码有足够的距离，以便容易区分注释和代码；

**2、** 如果尾部超过一条注释，请将它们对齐；

```ruby
@counter      # 跟踪页面被点击的次数
@siteCounter  # 跟踪所有页面被点击的次数
```
