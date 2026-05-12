# 21、Ruby 模块 (Module)
- 来源：https://ddkk.com/zhuanlan/other/ruby/21.html
- 分类：Ruby 教程
- 分组：教程目录
模块(Module) 是一种把方法、类和常量组合在一起的方式。

模块(Module) 定义了一个命名空间，相当于一个沙盒，在里边的方法和常量不会与其它地方的方法常量冲突

#### 模块（Module）带来了两大好处：

**1、** 模块提供了一个*命名空间*和避免名字冲突；

**2、** 模块实现了*mixin*装置；

#### 模块类似与类，但有一下不同：

- 模块不能实例化
- 模块没有子类
- 模块只能被另一个模块定义

## Ruby 模块语法

Ruby 语言中的模块定义语法格式如下

```ruby
module <ModuleName>   
   statement1
   statement2
   ...........
end
```

**1、** 模块中的常量命名与类常量命名类似，以大写字母开头；

**2、** 模块中的方法定义看起来和类也相似；

**3、** 可以使用模块名称和两个冒号来引用一个常量；

### 范例

#### hello.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: hello.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
module Hello
   PI = 3.141592654
   def Hello.sin(x)
   # ..
   end
   def Hello.cos(x)
   # ..
   end
end
```

### Ruby 语言允许定义多个函数名称相同但是功能不同的模块

#### quick.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: quick.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
module Quick
   VERY_BAD = 0
   BAD = 1
   def Quick.sin(badness)
   # ...
   end
end
```

可以像定义类方法一样，在模块中定义一个方法时，可以指定在模块名称后跟着一个点号，点号后跟着方法名

## Ruby require 语句

require 语句用于加载模块

如果一个第三方的程序想要使用任何已定义的模块，可以使用 Ruby *require* 语句来加载模块文件

### require 语法格式

```ruby
require filename
```

文件扩展名 **.rb** 不是必需的

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
$LOAD_PATH << '.'    
require 'quick.rb'
require 'hello'
y = Quick.sin(Trig::PI/4)
wrongdoing = Hello.sin(Moral::VERY_BAD)
```

使用** `$` LOAD_PATH `<< '.'** 让 Ruby 知道必须在当前目录中搜索被引用的文件。 如果不想使用`$` LOAD_PATH，那么您可以使用 **require_relative** 来从一个相对目录引用文件

### 注意

文件包含相同的函数名称。所以，这会在引用调用程序时导致代码模糊，但是模块避免了这种代码模糊，可以使用模块的名称调用适当的函数。

## Ruby include 语句

Ruby 语言允许在类中嵌入模块

Ruby 语言提供了 **include** 语句用来在类中嵌入模块

### include 语法格式如下

```ruby
include modulename
```

### 注意

如果模块是定义在一个单独的文件中，那么在嵌入模块之前就需要使用 *require* 语句引用该文件

### 范例

#### week.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: week.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
module Week
   FIRST_DAY = "Sunday"
   def Week.weeks_in_month
      puts "You have four weeks in a month"
   end
   def Week.weeks_in_year
      puts "You have 52 weeks in a year"
   end
end
```

现在，可以在类中引用该模块

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
$LOAD_PATH << '.'
require "week"
class Decade
include Week
   no_of_yrs=10
   def no_of_months
      puts Week::FIRST_DAY
      number=10*12
      puts number
   end
end
d1=Decade.new
puts Week::FIRST_DAY
Week.weeks_in_month
Week.weeks_in_year
d1.no_of_months
```

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
Sunday
You have four weeks in a month
You have 52 weeks in a year
Sunday
120
```

## Ruby 中的 Mixins

在继续阅读本节之前，你需要初步了解具备面向对象的概念

当一个类可以从多个父类继承类的特性时，该类显示为多重继承

Ruby 不直接支持多重继承，但是 Ruby 的模块（Module）有另一个神奇的功能。它消除了多重继承的需要，提供了一种名为 *mixin* 的机制

Ruby 语言没有真正实现多重继承机制，而是采用 mixin 机制作为替代品

```ruby
将模块 include 到类定义中，模块中的方法就 mix 进了类中
```

### 范例

#### a.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: a.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
module A
   def a1
   end
   def a2
   end
end
```

#### b.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: b.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
module B
   def b1
   end
   def b2
   end
end
```

#### hello.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: hello.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
$LOAD_PATH << '.'
require "a"
require "b"
class Hello
include A
include B
   def s1
   end
end
```

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require "hello"
samp= Hello.new
samp.a1
samp.a2
samp.b1
samp.b2
samp.s1
```

- 模块 A 由方法 a1 和 a2 组成
- 模块 B 由方法 b1 和 b2 组成
- 类 Hello 包含了模块 A 和 B
- 类 Hello 可以访问所有四个方法，即 a1、a2、b1 和 b2

可以看到类 Hello 继承了两个模块，可以说类 Hello 使用了多重继承或 *mixin*
