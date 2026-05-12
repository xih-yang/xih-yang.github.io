# 14、Ruby 变量
- 来源：https://ddkk.com/zhuanlan/other/ruby/14.html
- 分类：Ruby 教程
- 分组：教程目录
变量是计算机语言中能储存计算结果或能表示值抽象概念。变量可以通过变量名访问

Ruby 语言支持五种类型的变量：

**1、** **一般小写字母、下划线开头：**变量(Variable)；

**2、** ** `$` 开头：**全局变量(Globalvariable)；

**3、** **@开头：**实例变量(Instancevariable)；

**4、** **@@开头：**类变量(Classvariable)，类变量被共享在整个继承链中；

**5、** **大写字母开头：**常数(Constant)；

其实这些变量我们在前面的章节中或多或少都有了解过，本章我们将详细学习者五种类型的变量

## Ruby 全局变量

全局变量以 ** `$` ** 开头。

未初始化的全局变量的默认值为 **nil**

> 使用 -w 选项后，未初始化的全局变量会产生警告

因为全局变量是所有范围可见的，也就说任何地方都能改变她的值，因此不建议使用全局变量。

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
$global_variable = 13
class HelloWorld
  def print_global
      puts "全局变量在 HelloWorld 中输出为 #$global_variable"
  end
end
class HelloWorld2
  def print_global
      puts "全局变量在 HelloWorld 中输出为 #$global_variable"
  end
end
class1obj = HelloWorld.new
class1obj.print_global
$global_variable = 17
class2obj = HelloWorld2.new
class2obj.print_global
$global_variable = 19
puts "全局变量为 : #$global_variable"
```

运行范例 »

`$` global_variable 是全局变量

> 注意： Ruby 语言中可以通过在变量或常量前面放置 # 字符，来访问任何变量或常量的值

运行以上 Ruby 脚本，输出结果如下

```ruby
$ ruby main.rb
全局变量在 HelloWorld 中输出为 13
全局变量在 HelloWorld 中输出为 17
全局变量为 : 19
```

## Ruby 实例变量

实例变量以 @ 开头。

未初始化的实例变量的的默认值为 **nil**

> 在使用 -w 选项后，未初始化的实例变量会产生警告信息

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Company
    def initialize(id, name, addr)
       @comp_id=id          
       @comp_name=name
       @comp_addr=addr
    end
    def display_details()
       puts "Company id #@comp_id"
       puts "Company name #@comp_name"
       puts "Company address #@comp_addr"
    end
end
# 创建对象
comp1=Company.new(1, "百度", "北京市海淀区")
comp2=Company.new(2, "DDKK.COM 弟弟快看，程序员编程资料站", "北京市东城区")
# 调用方法
comp1.display_details()
comp2.display_details()
```

运行范例 »

@cust_id 、 @cust_name 和 @cust_addr 是实例变量

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
Company id 1
Company name 百度
Company address 北京市海淀区
Company id 2
Company name DDKK.COM 弟弟快看，程序员编程资料站
Company address 北京市东城区
```

## Ruby 类变量

类变量以 @@ 开头，且必须初始化后才能在方法中使用

类变量在定义它的类或模块的子类或子模块中可共享使用。

引用一个未初始化的类变量会产生错误。

> 在使用 -w 选项后，重载类变量会产生警告

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Company
    @@no_of_company = 0  
    def initialize(id, name, addr)
       @comp_id=id   
       @comp_name=name
       @comp_addr=addr
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
comp1=Company.new(1, "百度", "北京市海淀区")
comp1.total_no_of_company()
comp2=Company.new(2, "DDKK.COM 弟弟快看，程序员编程资料站", "北京市东城区")
comp2.total_no_of_company()
```

运行范例 »

上面范例中，@@no_of_customers 是类变量 id、name 和 addr 是局部变量

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
Total number of company: 1
Total number of company: 2
```

## Ruby 局部变量

局部变量以小写字母或下划线(_) 开头。 局部变量的作用域从 class、module、def、do 到相对应的结尾或者从左大括号到右大括号 {}

当调用一个未初始化的局部变量时，它被解释为调用一个不带参数的方法

对未初始化的局部变量赋值也可以当作是变量声明。

局部变量的生命周期在 Ruby 解析程序时确定 局部变量会一直存在，直到当前域结束为止。

在上面的范例中，initialize 方法中的 id、name 和 addr 是局部变量

## Ruby 常量

Ruby 语言中的常量要遵守以下规则

**1、** Ruby语言中的常量以大写字母开头；

**2、** 定义在类或模块内的常量可以从类或模块的内部访问；

**3、** 定义在类或模块外的常量可以被全局访问；

**4、** 常量不能定义在方法内；

**5、** 引用一个未初始化的常量会产生错误；

**6、** 对已经初始化的常量赋值会产生警告；

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
GLOBAL_CONST_VAR = "www.ddkk.com"   
class HelloWorld
    VAR1 = 1   
    VAR2 = 3
    def show
        puts "第一个常量的值为 #{VAR1}"
        puts "第二个常量的值为 #{VAR2}"
        puts "全局的常量 GLOBAL_CONST_VAR 值为： #{GLOBAL_CONST_VAR}"
    end
end
object=HelloWorld.new()
object.show
```

运行范例 »

定义在模块内的常量 定义在类内部的常量

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
第一个常量的值为 1
第二个常量的值为 3
全局的常量 GLOBAL_CONST_VAR 值为： www.ddkk.com
```

## Ruby 特殊变量

Ruby 语言中有一些特殊的变量，它们有着局部变量的外观，但行为却像常量。

而且不能给这些特殊变量赋任何值。

下面是Ruby 语言中特殊的变量

- **self:** 当前方法的接收器对象
- **true:** 代表 true 的值
- **false:** 代表 false 的值
- **nil:** 代表 undefined 的值
- **FILE:** 当前源文件的名称
- **LINE:** 当前行在源文件中的编号
