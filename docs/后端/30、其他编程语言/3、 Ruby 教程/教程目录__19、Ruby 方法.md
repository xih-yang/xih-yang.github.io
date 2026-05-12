# 19、Ruby 方法
- 来源：https://ddkk.com/zhuanlan/other/ruby/19.html
- 分类：Ruby 教程
- 分组：教程目录
Ruby 方法用于捆绑一个或多个重复的语句到一个单元中

Ruby 方法与其他编程语言中的函数类似

Ruby 中的方法名应以小写字母开头。

> 如果以大写字母作为方法名的开头，Ruby 可能会把它当作常量，从而导致不正确地解析调用

Ruby 方法应在调用之前定义，否则 Ruby 会产生未定义的方法调用异常

## 定义方法

Ruby 语言中定义方法的语法格式如下

```ruby
def method_name [( [arg [= default]]...[, * arg [, &expr ]])]
   expr..
end
```

#### 定义一个没有参数的方法如下

```ruby
def method_name 
   expr..
end
```

#### 定义一个接受参数的方法如下

```ruby
def method_name (var1, var2)
   expr..
end
```

#### 可以为参数设置默认值

如果方法调用时未传递必需的参数则使用默认值

```ruby
def method_name (var1=value1, var2=value2)
   expr..
end
```

## 调用方法

调用无参数的方法时，只需要使用方法名即可

```ruby
method_name
```

调用带参数的方法时，在写方法名时还要带上参数

```ruby
method_name 25, 30
```

使用带参数方法最大的缺点是调用方法时需要记住参数个数。 例如，如果向一个接受三个参数的方法只传递了两个参数，Ruby 会显示错误

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def hello( name="World", greet ="Hello" )
    puts "in hello method\n#{greet} #{name}\n\n"
end
hello
hello "www.ddkk.com"
hello "www.ddkk.com", "欢迎"
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
in hello method
Hello World
in hello method
Hello www.ddkk.com
in hello method
欢迎 www.ddkk.com
```

## 方法返回值

Ruby 从方法中返回值有两种方式：

**1、** 默认返回最后一个表达式的值；

**2、** 使用return语句显示返回；

Ruby 中的每个方法默认都会返回一个值。这个返回的值是最后一个语句的值

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def hello( name="World", greet ="Hello" )
    "#{greet} #{name}\n"
end
puts hello
puts hello( "www.ddkk.com")
puts hello("www.ddkk.com", "欢迎")
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
Hello World
Hello www.ddkk.com
欢迎 www.ddkk.com
```

在调用这个方法时，将返回最后一个声明的变量 9

### Ruby return 语句

Ruby 中的 *return* 语句用于从 Ruby 方法中显示返回一个或多个值

#### return 语句语法格式如下

```ruby
return [expr[,' expr...]]
```

如果给出超过两个的表达式，包含这些值的数组将是返回值 如果未给出表达式，nil 将是返回值

#### return 返回值有以下几种格式

```ruby
return
```

或

```ruby
return 12
```

或

```ruby
return 1,2,3
```

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def intro_self
    return "Hello", "www.ddkk.com", "and", "World"
end
greeting = intro_self
puts greeting
```

运行范例 »

运行以上 Ruby 范例，输出结果如下

```ruby
Hello
www.ddkk.com
and
World
```

## 可变数量的参数

如果声明了一个带有两个参数的方法，那么调用该方法时，就必须同时传递两个参数

当参数数量多了之后，这种机制就会显得很臃肿。

幸好，Ruby 允许声明参数数量可变的方法

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def hello( *names )
    print "Hello "
    for name in names
        print name, " "
    end
    puts "\nnames length is :#{names.length}"
end
hello "Baidu", "Twle", "NetEase", "Sina", "Ali", "Tencent"
puts ""
hello "Python", "Ruby", "Perl", "Scala", "JavaScript"
```

运行范例 »

上面的范例，我们声明了一个 hello 的方法，它接收接受一个参数 names 但这个参数有点特别，因为它是一个变量参数。这意味着参数可以带有不同数量的变量

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
Hello Baidu Twle NetEase Sina Ali Tencent 
names length is :6
Hello Python Ruby Perl Scala JavaScript 
names length is :5
```

## 类方法

Ruby 语言中，当方法定义在类的外部，方法默认标记为 *private* 如果方法定义在类中的，则默认标记为 **public**

方法默认的可见性和 *private* 标记可通过模块（Module）的 *public* 或 *private* 改变。

一般情况下，如果想要访问类的方法时，首先必须实例化类。然后，就可以通过对象访问类的任何成员

Ruby 提供了一种不用实例化即可访问方法的方式

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class HelloWorld
    def reading_charge
    end
    def HelloWorld.greet  
        puts "Hello www.ddkk.com"
    end
end
HelloWorld.greet  
```

方法return_date 的声明有点特俗，它是通过在类名后跟着一个点号，点号后跟着方法名来声明的

这样定义的方法，我们就可以直接访问，而不需要创建类 HelloWorld 的实例

```ruby
Accounts.return_date
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
Hello www.ddkk.com
```

## Ruby alias 语句

**alias** 语句用于为方法或全局变量起别名。

别名不能在方法主体内定义

即使方法被重写，方法的别名也保持方法的当前定义

### 注意

**1、** 为编号的全局变量（\ `$` 1,\ `$` 2,...）起别名是被禁止的；

**2、** 重写内置的全局变量可能会导致严重的问题；

### alias 语句语法格式如下

```ruby
alias 别名 方法名
alias 别名 全局变量
```

### 举例

```ruby
alias foo bar
alias $MATCH $&  
```

上面的代码，我们已经为 bar 定义了别名为 foo，为 `$` & 定义了别名为 `$` MATCH

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def greeting
    puts "Hello www.ddkk.com"
end 
alias greeting_ddkk greeting
greeting
puts "-------------------"
greeting_ddkk
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
Hello www.ddkk.com
-------------------
Hello www.ddkk.com
```

## Ruby undef 语句

**undef** 语句用于取消方法定义

*undef* 不能出现在方法主体内

通过使用 *undef* 和 *alias* ，类的接口可以从父类独立修改 但请注意，在自身内部方法调用时，它可能会破坏程序

### undef 语法格式如下

```ruby
undef 方法名
```

下面的代码取消名为 *hello* 的方法定义

```ruby
undef hello
```

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
def greeting
    puts "Hello www.ddkk.com"
end 
alias greeting_ddkk greeting
greeting
puts "-------------------"
greeting_ddkk
puts "-------------------"
undef greeting
def greeting
    puts "Hello DDKK.COM 弟弟快看，程序员编程资料站"
end
greeting
puts "-------------------"
greeting_ddkk
```

运行范例 »

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
Hello www.ddkk.com
-------------------
Hello www.ddkk.com
-------------------
Hello DDKK.COM 弟弟快看，程序员编程资料站
-------------------
Hello www.ddkk.com
```
