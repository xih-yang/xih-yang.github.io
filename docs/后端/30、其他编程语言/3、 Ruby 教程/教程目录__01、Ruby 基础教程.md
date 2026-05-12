# 01、Ruby 基础教程
- 来源：https://ddkk.com/zhuanlan/other/ruby/1.html
- 分类：Ruby 教程
- 分组：教程目录
Ruby 是一种开源的面向对象程序设计的服务器端脚本语言

Ruby 在 20 世纪 90 年代中期由日本的松本行弘（まつもとゆきひろ/Yukihiro Matsumoto）设计并开发。在 Ruby 社区，松本也被称为马茨（Matz）。

Ruby 可运行于多种平台，如 Windows、MAC OS 和 Linux 的各种版本

通过本教程的学习，你将对 Ruby 有一个全面的了解。

现在开始学习 Ruby

## 我是否适合学习本教程？

本教程旨在为初学者普及 Ruby 语言的基础知识和基本概念

通过本教程的学习，我们能够达到 Ruby 入门的级别

## 阅读本教程前，我们希望你具备的基础知识

在我们开始学习 Ruby 的基础知识和各种范例之前，我们希望你已经对计算机程序和计算机程序设计语言有一个基本的认识

如果你具备了其它语言的知识，那将大大缩减你掌握 Ruby 语言所需要的时间

## 运行 Ruby 程序

学习任何语言，都要先拜一拜山头，这已经是开发界的惯例。

现在，我们通过使用 Ruby 语言输出 **Hello World** 开始我们的 Ruby 学习之旅

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

> 点击 "运行范例" 按钮可以查看在线实例运行结果

把上面的代码保存到 main.rb 文件中，然后使用 ruby main.rb 命令运行 main.rb 脚本，输出结果如下

```ruby
$ ruby main.rb
Hello World!
Hello DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

接下来的教程，我们会把上面的执行流程简称为 运行以上 Ruby 脚本，输出结果如下

或者是在 irb 交互式命令行的模式下

```ruby
$ irb
2.4.0 :001 > puts "Hello, World!"
Hello, World!
 => nil 
2.4.0 :002 > puts "Hello, DDKK.COM 弟弟快看，程序员编程资料站,DDKK.COM 弟弟快看，程序员编程资料站!"
Hello, DDKK.COM 弟弟快看，程序员编程资料站,DDKK.COM 弟弟快看，程序员编程资料站!
 => nil 
2.4.0 :003 > 
```
