# 28、Perl 包和模块
- 来源：https://ddkk.com/zhuanlan/other/perl/28.html
- 分类：Perl 教程
- 分组：教程目录
Perl 程序把变量和子程序的名称存贮到符号表中，Perl 的符号表中名字的集合就称为 Perl 包(package)

### 创建 Perl 包

Perl 中每个包有一个单独的符号表。

Perl 中包定义的语法格式为：

```sh
package myddkk;
```

上面的语法定义一个名为 **myddkk** 的包，在此后定义的所有变量和子程序的名字都存贮在该包关联的符号表中，直到遇到另一个 **package** 语句为止

每个符号表有其自己的一组变量、子程序名，各组名字是不相关的，因此可以在不同的包中使用相同的变量名，而代表的是不同的变量。

### 访问 Perl 包

Perl 中可通过 包名 + 双冒号( :: ) + 变量名 的方式从一个包中访问另外一个包的变量

存贮变量和子程序的名字的默认符号表是与名为 **main** 的包相关联的。 如果在程序里定义了其它的包，但我们切换回去使用默认的符号表，可以重新指定 main包

```sh
package main;
```

这样，接下来的代码就好象从没定义过包一样，变量和子程序的名字象通常那样定义

下面的范例中，我们定义了 main 和 Foo 包。特殊变量 **PACKAGE** 用于输出包名：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
#  main 包
$name = "DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站"; 
print "包名 : " , __PACKAGE__ , " $name\n"; 
package Foo;
#  Foo 包
$name = "DDKK.COM 弟弟快看，程序员编程资料站 www.ddkk.com";
print "包名 : " , __PACKAGE__ , " $name\n"; 
package main;
# 重新指定 main 包
$name = "DDKK.COM 弟弟快看，程序员编程资料站 ddkk.cn";
print "包名 : " , __PACKAGE__ , " $name\n"; 
print "包名: " , __PACKAGE__ ,  " $Foo::name\n"; 
1;
```

执行以上程序，输出结果为:

```sh
$ perl main.pl
包名 : main DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
包名 : Foo DDKK.COM 弟弟快看，程序员编程资料站 www.ddkk.com
包名 : main DDKK.COM 弟弟快看，程序员编程资料站 ddkk.cn
包名: main DDKK.COM 弟弟快看，程序员编程资料站 www.ddkk.com
```

## BEGIN 和 END 语句

Perl 语言提供了两个关键字：BEGIN，END 。

它们可以分别包含一组脚本，用于程序体运行前或者运行后的执行

### BEGIN，END 语句语法格式如下：

```sh
BEGIN { ... }
END { ... }
BEGIN { ... }
END { ... }
```

- 每个 **BEGIN** 模块在 Perl 脚本载入和编译后但在其他语句执行前执行。
- 每个 **END** 语句块在解释器退出前执行。
- **BEGIN** 和 **END** 语句块在创建 Perl 模块时特别有用

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package Foo;
print "Begin 和 Block 语句范例\n";
BEGIN { 
    print "这是 BEGIN 语句块\n" 
}
END { 
    print "这是 END 语句块\n" 
}
1;
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
这是 BEGIN 语句块
Begin 和 Block 语句范例
这是 END 语句块
```

## 什么是 Perl 模块？

Perl 模块是一个可重复使用的包，模块的名字与包名相同，定义的文件后缀为 .pm

Perl5 中使用 Perl 包来创建模块

下面的范例中我们定义了一个 Foo.pm 模块：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package Foo;
sub bar { 
   print "Hello $_[0]\n" 
}
sub blat { 
   print "World $_[0]\n" 
}
1;
```

在Perl 中定义模块需要注意以下几点

**1、** 函数**require**和**use**将载入一个模块；

**2、****@INC**是Perl内置的一个特殊数组，它包含指向库例程所在位置的目录路径；

**3、****require**和**use**函数调用**eval**函数来执行代码；

**4、** **1;**执行返回TRUE，这是必须的，否则返回错误；

## Require 和 Use 函数

**require** 函数可以将一个 Perl 包载入当前文件

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
require Foo;
Foo::bar( "a" );
Foo::blat( "b" );
```

user 函数也可以将一个包引入当前的代码中

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use Foo;
bar( "a" );
blat( "b" );
```

require 函数和 use 函数的主要不同点之处就是：

```sh
require 引用的包需要使用包名指定函数，而 use 不需要
```

### require 函数和 use 函数的其它不同点：

**1、** require用于载入module或perl程序(.pm后缀可以省略，但.pl必须有)；

**2、** Perluse语句是编译时引入的，require是运行时引入的；

**3、** Perluse引入模块的同时，也引入了模块的子模块而require则不能引入，要在重新声明；

**4、** use函数是在当前默认的@INC里面去寻找,一旦模块不在@INC中的话,用use是不可以引入的，但是require可以指定路径；

**5、** use函数引用模块时，如果模块名称中包含::双冒号，该双冒号将作为路径分隔符，相当于Unix下的/或者Windows下的\；

如：

```sh
 use MyDirectory::MyModule
```

Perl 中可以通过使用以下语句从模块中导出列表符号：

```sh
require Exporter;
@ISA = qw(Exporter);
```

@EXPORT 数组包含默认导出的变量和函数的名字：

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package ddkk;
require Exporter;
@ISA = qw(Exporter);
@EXPORT = qw(bar blat);  # 默认导出的符号
sub bar { print "Hello $_[0]\n" }
sub blat { print "World $_[0]\n" }
sub splat { print "Not $_[0]\n" }  # Not exported!
1;
```

## 创建 Perl 模块

Perl 语言自带的分发工具 h2xs 可以创建一个 Perl 模块

### h2xs 语法格式如下所示：

```sh
$ h2xs -AX -n  ModuleName
```

### h2xs 参数说明：

- **-A** 忽略 autoload 机制
- **-X** 忽略 XS 元素
- **-n** 指定扩展模块的名字

> 可以在命令行模式键入 h2xs 来看看它的参数列表

例如，我们要在 **ddkk.pm** 文件中创建模块，可以使用以下命令：

```sh
$ h2xs -AX -n ddkk
```

执行以上 shell 脚本，输出结果如下：

```sh
$ h2xs -AX -n ddkk
Defaulting to backwards compatibility with perl 5.18.2
If you intend this module to be compatible with earlier perl versions, please
specify a minimum perl version with the -b option.
Writing ddkk/lib/ddkk.pm
Writing ddkk/Makefile.PL
Writing ddkk/README
Writing ddkk/t/ddkk.t
Writing ddkk/Changes
Writing ddkk/MANIFEST
```

以下是ddkk 目录下的文件说明:

- README ：这个文件包含一些安装信息，模块依赖性，版权信息等
- Changes ：这个文件作为你的项目的修改日志（changelog）文件
- Makefile.PL ：这是标准的 Perl Makefile 构造器。用于创建 Makefile.PL 文件来编译该模块
- MANIFEST ：本文件用于自动构建 tar.gz 类型的模块版本分发。 这样你就可以把你的模块拿到 CPAN 发布或者分发给其他人。 它包含了你在这个项目中所有文件的列表
- Person.pm ：这是主模块文件，包含你的 mod_perl 句柄代码（handler code）
- Person.t ：针对该模块的一些测试脚本 默认情况下它只是检查模块的载入，你可以添加一些新的测试单元。
- t/ ：测试文件
- lib/ ：实际源码存放的目录

然后我们可以使用 tar 命令来将以上目录打包为 ddkk.tar.gz

## 安装 Perl 模块

接下来我们安装刚刚创建的 ddkk 模块

安装ddkk 模块的方法如下

**1、** 对刚才压缩的**ddkk.tar.gz**文件进行解压；

```sh
tar xvfz ddkk.tar.gz
```

**2、** 然后运行以下命令进行安装；

```sh
cd ddkk
perl Makefile.PL
make
make install
```

### 安装说明如下

**1、** 运行perlMakefile.PL会在当前目录下生成Makefile文件；

**2、** 然后运行make编译并创建所需的库文件；

**3、** 之后用maketest测试编译结果是否正确；

**4、** 最后运行makeinstall将库文件安装到系统目录，至此整个编译过程结束；
