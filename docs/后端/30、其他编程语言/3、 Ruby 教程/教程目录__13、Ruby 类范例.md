# 13、Ruby 类范例
- 来源：https://ddkk.com/zhuanlan/other/ruby/13.html
- 分类：Ruby 教程
- 分组：教程目录
在前面的章节中我们学习了类和对象，如何定义类的属性和方法，以及如何创建类的对象，调用类的方法

接下来我们将用一个范例来巩固我们前面的学习

下面的代码，我们创建了一个 **Company**，然后声明了两个方法

- **display_details** 用于显示公司的详细信息
- **total_no_of_company** 用于显示在系统中创建的公司总数量

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Company
    @@no_of_company = 0
    def initialize(id, name, addr) 
       @comp_id     = id
       @comp_name   = name
       @comp_addr   = addr
       @@no_of_company += 1
    end
    def display_details()  
       puts "Company id #@comp_id"
       puts "Company name #@comp_name"
       puts "Company address #@comp_addr"
    end
    def total_no_of_company() 
        puts "Total number of company: #@@no_of_company"
    end
end
```

*initialize* 方法除了用来初始化 Company 类外。表达式 @@no_of_company +=1 在每次创建对象时把变量 no_of_company 加 1。通过这种方式，我们就可以统计到类变量中的客户总数量

*display_details* 方法包含了三个 puts 语句，显示了公司 ID、公司名字和公司地址

其中，puts 语句：

```ruby
puts "Company id #@comp_id"
```

将在一个单行上显示文本 Company id 和变量 @comp_id 的值

当想要在一个单行上显示实例变量的文本和值时，需要在 puts 语句的变量名前面放置符号（#），文本和带有符号（#）的实例变量应使用双引号标记

total_no_of_company 方法包含了类变量 @@no_of_company

现在使用 Company 类创建两个公司实例

```ruby
comp1=Company.new(1, "DDKK.COM 弟弟快看，程序员编程资料站", "北京市东城区")
comp2=Company.new(2, "百度", "北京市海淀区")
```

在这里，我们创建了 Company 类的两个对象，comp1 和 comp2，并向 new 方法传递必要的参数，当 initialize 方法被调用时，对象的必要属性被初始化。

一旦对象被创建，就可以使用两个对象来调用类的方法。可以使用 **点号(.)** 来调用实例的方法或任何数据成员

```ruby
comp1.display_details()
comp1.total_no_of_company()
```

对象名称后总是跟着一个点号，接着是方法名称或数据成员。

我们已经看到如何使用 comp1 对象调用两个方法。使用 comp2 对象也可以调用两个方法

```ruby
comp2.display_details()
comp2.total_no_of_company()
```

### 保存并执行代码

现在，我们把所有的源代码放在 **main.rb** 文件中

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Company
    @@no_of_company = 0
    def initialize(id, name, addr)
       @comp_id     = id
       @comp_name   = name
       @comp_addr   = addr
       @@no_of_company += 1
    end
    def display_details()
       puts "Company id #@comp_id"
       puts "Company name #@comp_name"
       puts "Company address #@comp_addr"
    end
    def total_no_of_company()
        puts "Total number of company: #@@no_of_company"
    end
end
comp1=Company.new(1, "DDKK.COM 弟弟快看，程序员编程资料站", "北京市东城区")
comp2=Company.new(2, "百度", "北京市海淀区")
comp1.display_details()
comp1.total_no_of_company()
comp2.display_details()
comp2.total_no_of_company()
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
Company id 1
Company name DDKK.COM 弟弟快看，程序员编程资料站
Company address 北京市东城区
Total number of company: 2
Company id 2
Company name 百度
Company address 北京市海淀区
Total number of company: 2
```
