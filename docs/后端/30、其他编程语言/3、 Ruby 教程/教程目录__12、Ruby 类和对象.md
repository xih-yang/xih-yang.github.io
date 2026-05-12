# 12、Ruby 类和对象
- 来源：https://ddkk.com/zhuanlan/other/ruby/12.html
- 分类：Ruby 教程
- 分组：教程目录
Ruby 是一种完美的面向对象编程语言

### 面向对象

面向对象编程语言的特性包括：数据封装、数据抽象、多态性、继承

面向对象的这些特性将在 面向对象的 Ruby 中学习

一个面向对象的程序，涉及到的类和对象。

类是个别对象创建的蓝图。

在面向对象的术语中，自行车是自行车类的一个实例

以车辆为例，它包括车轮（wheels）、马力（horsepower）、燃油等，这些属性形成了车辆（Vehicle）类的数据成员。借助这些属性您能把一个车辆从其他车辆中区分出来。

车辆也能包含特定的函数，比如暂停（halting）、驾驶（driving）、超速（speeding）。这些函数形成了车辆（Car）类的数据成员。

**类可以看成是属性和函数的组合**

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
Class Car
{
   Number no_of_wheels
   Number horsepower
   Characters type_of_tank
   Number Capacity
   Function speeding
   {
   }
   Function driving
   {
   }
   Function halting
   {
   }
}
```

通过Car 类的数据成员分配不同的值，我们可以创建类 Car 的不同实例。

例如，一架小轿车有四个轮子，马力 1,000，燃油罐容量为 100 升。以同样的方式，一辆摩托车有两个轮子，马力 100，汽油罐容量为 3 升

## Ruby 语言中的 类

为了使用 Ruby 实现面向对象编程，我们需要先学习如何在 Ruby 中创建对象和类

Ruby 语言中，类总是以关键字 **class** 开始，后跟类的名称，类名的首字母应该大写，最后可以使用 **end** 结束类的定义

### 定义类的语法格式如下所示

```ruby
class ClassName
end
```

可以使用关键字 *end* 终止一个类。 *类* 中的所有数据成员都是介于类定义和 *end* 关键字之间

或者

```ruby
class ClassName
{
}
```

> 不推荐使用 大括号({}) 这种方式

### 范例

下面的代码定义了一个类 *Customer*

```ruby
class Customer
end
```

## Ruby 类中的变量

Ruby 语言提供了四种类型的变量：

- **局部变量**

局部变量是在方法中定义的变量 局部变量在方法外是不可用的 局部变量以小写字母或下划线(_) 开始

在后续的章节中，我们将学习到有关方法的更多细节

- **实例变量**

实例变量在变量名之前放置符号 (@)

实例变量可以跨任何特定的实例或对象中的方法使用，也就是说，实例变量可以从对象到对象的改变。

- **类变量**

类变量在变量名之前放置符号 (@@) Ruby 中的类变量相当于其它语言中的 **静态变量** 类变量属于类，且是类的一个属性。 类变量可以跨不同的对象使用。

- **全局变量**

全局变量总是以美元符号 ( `$` ) 开始

类变量不能跨类使用 如果想要有一个可以跨类使用的变量，则需要定义全局变量。

### 范例

我们可以使用类变量 @@no_of_customers 统计被创建的对象数量，以确定客户数量

```ruby
class Customer
   @@no_of_customers = 0
end
```

## Ruby 语言中使用 new 方法创建对象

对象是类的实例。

Ruby 语言中，可以使用类的方法 *new* 创建对象

方法 *new* 是一种独特的方法，在 Ruby 库中预定义。

Ruby 语言中的 new 方法属于 *类* 方法

### Ruby 语言中 new 方法语法格式如下

```ruby
object_name = ClassName.new
```

对象名称后跟着等号（=），等号后跟着类名，然后是点运算符和关键字 *new*

### 范例

下面的代码创建了类 Customer 的两个对象 cust1 和 cust2

```ruby
cust1 = Customer.new 
cust2 = Customer.new 
```

上面的代码创建 Customer 类的两个对象实例， cust1 和 cust2 是两个对象的名称

## Ruby 使用自定义方法来创建对象

可以给方法 *new* 传递参数用于初始化类变量

当想要给 *new* 方法传递参数时，我们需要通过创建类的同时声明方法 *initialize*

*initialize* 方法是一种特殊类型的方法，会在调用带参数的类的 *new* 方法时执行

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Customer
   @@no_of_customers = 0
   def initialize(id, name, addr) 
      @cust_id   = id
      @cust_name = name
      @cust_addr = addr
   end
end
```

上面的代码中，声明了带有 **id、name、addr** 作为局部变量的 *initialize* 方法

*def* 和 *end* 用于定义 Ruby 方法 *initialize*

在 *initialize* 方法中，把这些局部变量的值传给实例变量 @cust_id、@cust_name 和 @cust_addr

局部变量的值是随着 new 方法进行传递的

### 范例

现在，可以使用下列方式来创建对象

```ruby
cust1=Customer.new("1", "小明", "思明区")
cust2=Customer.new("2", "小红", "湖里区")
```

## Ruby 类中的成员方法

Ruby 语言中，函数被称为方法。

Ruby 语言中，类中的每个方法是以关键字 **def** 开始，后跟方法名。

方法名总是以 **小写字母** 开头。

Ruby 语言中，可以使用关键字 *end* 来结束一个方法的定义

### 范例

下面的代码定义了一个 Ruby 方法

```ruby
class SampleClass
   def function
      statement 1  
      statement 2
   end
end
```

*statement 1* 和 *statement 2* 是类 SampleClass 方法 *function* 的主体的组成部分

> 上面的这些语句可以是任何有效的 Ruby 语句

例如，我们可以使用方法 *puts* 来输出 *Hello Ruby*

```ruby
class HelloWorld
   def hello
       puts "Hello Ruby!"
       puts "Hello DDKK.COM 弟弟快看，程序员编程资料站!"
   end
end
```

### 范例

下面的范例创建了一个 HelloWorld 类的对象，然后调用 *hello* 方法

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class HelloWorld
    def hello
       puts "Hello Ruby!"
       puts "Hello DDKK.COM 弟弟快看，程序员编程资料站!"
    end
end
# 使用上面的类来创建对象
obj = HelloWorld.new
obj.hello
```

运行以上 Ruby 脚本，输出结果如下

```ruby
$ ruby main.rb
Hello Ruby!
Hello DDKK.COM 弟弟快看，程序员编程资料站!
```

## 简单的范例研究

如果想学习更多有关类和对象的知识，可以研究以下的范例

Ruby 类范例
