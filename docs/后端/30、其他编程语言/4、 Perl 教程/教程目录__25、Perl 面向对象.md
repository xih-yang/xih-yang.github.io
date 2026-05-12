# 25、Perl 面向对象
- 来源：https://ddkk.com/zhuanlan/other/perl/25.html
- 分类：Perl 教程
- 分组：教程目录
Perl 语言也支持面向对象的编程方法，而且它提供了两种不同的面向对象编程实现。

## 面向对象编程的一些概念

面向对象有很多基础概念，这里我们主要讲解三个：对象、类和方法

- **对象** ：对象是对类中数据项的引用。.
- **类** ：类是个Perl包，其中含提供对象方法的类。
- **方法** ：方法是个Perl子程序，类名是其第一个参数。

## Perl 中的面向对象

Perl 中有两种不同地面向对象编程的实现：

**1、** 基于匿名哈希表的方式；

每个对象实例的实质就是一个指向匿名哈希表的引用。这个匿名哈希表存储着所有的范例属性
**2、** 基于数组的方式；

在定义一个类的时候，我们将为每一个实例属性创建一个数组，而每一个对象实例的实质就是一个指向这些数组中某一行索引的引用。在这些数组中，存储着所有的范例属性

Perl 提供了 bless() 函数用来构造对象， 通过 bless 把一个引用和这个类名相关联，返回这个引用就构造出一个对象。

## Perl 中类的定义

Perl 中一个类是一个简单的包

可以把一个包当作一个类用，并且把包里的函数当作类的方法来用。

Perl 的包提供了独立的命名空间，所以不同包的方法与变量名不会冲突。

Perl 类的文件后缀为 .pm

下面的代码创建了一个 People 类

```sh
package People;
```

类的代码范围到脚本文件的最后一行，或者到下一个 package 关键字前

## 创建和使用对象

为了创建一个类的实例 (对象) ，我们需要定义一个构造函数。

大多数程序使用类名作为构造函数，Perl 中可以使用任何名字

我们可以使用多种 Perl 的变量作为 Perl 的对象。 大多数情况下我们会使用引用数组或哈希。

接下来我们为 People 类创建一个构造函数，使用了 Perl 的哈希引用

在创建对象时，需要提供一个构造函数，它是一个子程序，返回对象的引用。

```sh
package People;
sub new
{
    my $class = shift;
    my $self = {
        _firstName => shift,
        _lastName  => shift,
        _ssn       => shift,
    };
    # 输出用户信息
    print "名字：$self->{_firstName}\n";
    print "姓氏：$self->{_lastName}\n";
    print "编号：$self->{_ssn}\n";
    bless $self, $class;
    return $self;
}
```

然后使用以下语句创建一个 People 的实例 `$` object

```sh
$object = new Person( "小明", "王", 23234345);
```

## 定义类方法

Perl 类的方法是一个 Perl 子程序，也即通常所说的成员函数。

Perl 面向对象中 Perl 的方法定义不提供任何特别语法，但规定方法的第一个参数为对象或其被引用的包。

Perl 没有提供私有变量，但我们可以通过辅助的方式来管理对象数据。

下面的代码定义了一个类方法，用来获取名字

```sh
sub getFirstName 
{
    return $self->{_firstName};
}
```

当然我们也可以这么写：

```sh
sub setFirstName 
{
    my ( $self, $firstName ) = @_;
    $self->{_firstName} = $firstName if defined($firstName);
    return $self->{_firstName};
}
```

下面我们写一个范例来演示类和类方法的创建和使用

#### people.pm 文件

```sh
#!/usr/bin/perl
=pod
  file: people.pm
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package People;
sub new
{
    my $class = shift;
    my $self = {
        _firstName => shift,
        _lastName  => shift,
        _ssn       => shift,
    };
    # 输出用户信息
    print "名字：$self->{_firstName}\n";
    print "姓氏：$self->{_lastName}\n";
    print "编号：$self->{_ssn}\n";
    bless $self, $class;
    return $self;
}
sub setFirstName {
    my ( $self, $firstName ) = @_;
    $self->{_firstName} = $firstName if defined($firstName);
    return $self->{_firstName};
}
sub getFirstName {
    my( $self ) = @_;
    return $self->{_firstName};
}
1;
```

#### main.pl 文件

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use People;
$object = new People( "小红", "李", 5201314);
# 获取姓名
$firstName = $object->getFirstName();
print "设置前姓名为 : $firstName\n";
# 使用辅助函数设置姓名
$object->setFirstName( "小西" );
# 通过辅助函数获取姓名
$firstName = $object->getFirstName();
print "设置后姓名为 : $firstName\n";
```

运行main.pl 文件，输出结果如下

```sh
$ perl main.pl
名字：小红
姓氏：李
编号：5201314
设置前姓名为 : 小红
设置后姓名为 : 小西
```

## Perl 面向对象中的继承

Perl 中的类方法可以通过 @ISA 数组继承，这个数组里面包含其他包（类）的名字

Perl 中变量的继承必须明确设定

多继承就是 @ISA 数组包含多个类名字

通过@ISA 只能继承方法，不能继承数据

下面我们创建一个 Employee 类继承 People 类

#### employee.pm 文件

```sh
#!/usr/bin/perl
=pod
  file: employee.pm
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package Employee;
use People;
use strict;
our @ISA = qw(People);    # 从 People 继承
```

Employee 类包含了 People 类的所有方法和属性

修改我们的 main.pl 文件

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use Employee;
$object = new Employee( "小红", "李", 5201314);
# 获取姓名
$firstName = $object->getFirstName();
print "设置前姓名为 : $firstName\n";
# 使用辅助函数设置姓名
$object->setFirstName( "小西" );
# 通过辅助函数获取姓名
$firstName = $object->getFirstName();
print "设置后姓名为 : $firstName\n";
```

运行main.pl 文件，输出结果为：

```sh
$ perl main.pl
名字：小红
姓氏：李
编号：5201314
设置前姓名为 : 小红
设置后姓名为 : 小西
```

## Perl 中的方法重写

上面的范例中，Employee 类继承了 People 类，但是 People 类中的 getFirstName 方法可能没法满足我们的需求，那么我们就需要对 getFirstName 方法进行重写

下面我们将在 Employee 类中添加一些新方法，并重写了 People 类的方法

```sh
#!/usr/bin/perl
=pod
  file: employee.pm
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package Employee;
use People;
use strict;
our @ISA = qw(People);    # 从 People 继承
# 重写构造函数
sub new {
    my ($class) = @_;
    # 调用父类的构造函数
    my $self = $class->SUPER::new( $_[1], $_[2], $_[3] );
    # 添加更多属性
    $self->{_id}   = undef;
    $self->{_title} = undef;
    bless $self, $class;
    return $self;
}
# 重写方法
sub getFirstName 
{
    my( $self ) = @_;
    # 这是子类函数
    print "这是子类函数\n";
    return $self->{_firstName};
}
# 添加方法
sub setLastName
{
    my ( $self, $lastName ) = @_;
    $self->{_lastName} = $lastName if defined($lastName);
    return $self->{_lastName};
}
sub getLastName 
{
    my( $self ) = @_;
    return $self->{_lastName};
}
1;
```

然后修改 main.pl 文件为:

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use Employee;
$object = new Employee( "小红", "李", 5201314);
# 获取姓名，使用修改后的构造函数
$firstName = $object->getFirstName();
print "设置前姓名为 : $firstName\n";
# 使用辅助函数设置姓名
$object->setFirstName( "小西" );
# 通过辅助函数获取姓名
$firstName = $object->getFirstName();
print "设置后姓名为 : $firstName\n";
```

运行main.pl 文件，输出结果为：

```sh
$ perl main.pl
名字：小红
姓氏：李
编号：5201314
这是子类函数
设置前姓名为 : 小红
这是子类函数
设置后姓名为 : 小西
```

## Perl 中的默认载入机制

如果一个方法，在当前类、当前类所有的基类、还有 UNIVERSAL 类中都找不到，那么就会查找名为 AUTOLOAD() 的方法。

如果找到了 AUTOLOAD，就会调用 调用，同时设定全局变量 `$` AUTOLOAD 的值为缺失的方法的全限定名称

如果没有找到，那么 Perl 就会提示失败并出错

如果不希望继承基类的 AUTOLOAD，可以使用下面的代码：

```sh
sub AUTOLOAD;
```

## Perl 中的析构函数及垃圾回收

当对象的最后一个引用释放时，对象会自动析构。

如果需要在析构的时候做些什么，可以通过在类中定义一个名为 DESTROY 的方法。 它将在适合的时机自动调用，并且执行额外的清理动作

```sh
package Employee;
...
sub DESTROY
{
    print "Employee::DESTROY called\n";
}
```

Perl 会把对象的引用作为唯一的参数传递给 DESTROY。

> 注意
>
> 这个引用是只读的，也就是不能通过访问 $ *[0] 来修改它 但是对象自身（比如 " $ { $ *[0]" 或者 "@{ $ *[0]}" 还有 "%{ $ *[0]}" 等等）还是可写的

如果在析构器返回之前重新 bless 了对象引用，那么 Perl 会在析构器返回之后接着调用重新 bless 的那个对象的 DESTROY 方法。

这种机制使得我们有机会调用基类或者指定的其它类的析构器。 需要说明的是，DESTROY 也可以手工调用，但是通常没有必要这么做

在当前对象释放后，包含在当前对象中的其它对象会自动释放。

### 下面这个范例是对上面学习的总结

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
# 下面是简单的类实现
package MyClass;
sub new
{
   print "MyClass::new called\n";
   my $type = shift;            # 包名
   my $self = {};               # 引用空哈希
   return bless $self, $type;   
}
sub DESTROY
{
   print "MyClass::DESTROY called\n";
}
sub MyMethod
{
   print "MyClass::MyMethod called!\n";
}
# 继承实现
package MySubClass;
@ISA = qw( MyClass );
sub new
{
   print "MySubClass::new called\n";
   my $type = shift;            # 包名
   my $self = MyClass->new;     # 引用空哈希
   return bless $self, $type;  
}
sub DESTROY
{
   print "MySubClass::DESTROY called\n";
}
sub MyMethod
{
   my $self = shift;
   $self->SUPER::MyMethod();
   print "   MySubClass::MyMethod called!\n";
}
# 调用以上类的主程序
package main;
print "调用 MyClass 方法\n";
$myObject = MyClass->new();
$myObject->MyMethod();
print "调用 MySubClass 方法\n";
$myObject2 = MySubClass->new();
$myObject2->MyMethod();
print "创建一个作用域对象\n";
{
  my $myObject2 = MyClass->new();
}
# 自动调用析构函数
print "创建对象\n";
$myObject3 = MyClass->new();
undef $myObject3;
print "脚本执行结束...\n";
# 自动执行析构函数
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
调用 MyClass 方法
MyClass::new called
MyClass::MyMethod called!
调用 MySubClass 方法
MySubClass::new called
MyClass::new called
MyClass::MyMethod called!
   MySubClass::MyMethod called!
创建一个作用域对象
MyClass::new called
MyClass::DESTROY called
创建对象
MyClass::new called
MyClass::DESTROY called
脚本执行结束...
MyClass::DESTROY called
MySubClass::DESTROY called
```
