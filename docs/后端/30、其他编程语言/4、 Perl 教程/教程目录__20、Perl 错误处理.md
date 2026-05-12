# 20、Perl 错误处理
- 来源：https://ddkk.com/zhuanlan/other/perl/20.html
- 分类：Perl 教程
- 分组：教程目录
Perl 提供了多种处理错误的方法来防止程序出现错误时崩溃。

程序运行过程中，总会碰到各式各样的错误，比如打开一个不存在的文件。

程序运行过程中如果出现错误就会停止，我们就需要使用一些检测方法来避免错误，从而防止程序退出

## if 语句

**if 语句** 可以判断语句的返回值

```sh
if(open(DATA, $file))
{
   ...
}else
{
   die "Error: 无法打开文件 - $!";
}
```

程序中变量 `$` ! 返回了错误信息

上面的范例也可以简化成以下代码：

```sh
open(DATA, $file) || die "Error: 无法打开文件 - $!";
```

## unless 函数

**unless** 函数与 if 相反，只有在表达式返回 false 时才会执行

```sh
unless(chdir("/etc"))
{
   die "Error: 无法打开目录 - $!";
}
```

**unless** 语句在需要设置错误提醒时是非常有用的

上面的unless 代码可以简写为：

```sh
die "Error: 无法打开目录!: $!" unless(chdir("/etc"));
```

以上错误信息只有在目录切换错误的情况下才会输出

## 三元运算符

三元运算符 ?: 和 if 语句一样

```sh
print(exists($hash{value}) ? '存在' : '不存在',"\n");
```

上面的代码使用了三元运算符来判断哈希的值是否存在 代码中包含了一个表达式两个值，格式为： **表达式 ? 值一 : 值二**

## warn 函数

**warn** 函数用于触发一个警告信息，不会有其他操作。 **warn** 函数将错误输出到 STDERR(标准输出文件)，通常用于给用户提示：

```sh
chdir('/etc') or warn "无法切换目录";
```

## die 函数

die函数类似于 warn, 但它会执行退出。 die 函数一般用咋错误信息的输出：

```sh
chdir('/etc') or die "无法切换目录";
```

## Carp 模块

在Perl 脚本中，报告错误的常用方法是使用 warn() 或 die() 函数来报告或产生错误。

而Carp 模块，它可以对产生的消息提供额外级别的控制，尤其是在模块内部

标准Carp 模块提供了 warn() 和 die() 函数的替代方法，它们在提供错误定位方面提供更多信息，而且更加友好。

在模块中使用时，错误消息中包含模块名称和行号。

### carp 函数

**carp** 函数可以输出程序的跟踪信息，类似于 warn 函数，通常会将该信息发送到 STDERR：

```sh
#!/usr/bin/perl
=pod
  file: t.pm
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package T;
require Exporter;
@ISA = qw/Exporter/;
@EXPORT = qw/function/;
use Carp;
sub function {
   carp "Error in module!";
}
1;
```

在脚本调用以下程序:

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use T;
function();
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Error in module! at main.pl line 13.
```

## cluck 函数

cluck() 与 warn() 类似，提供了从产生错误处的栈回溯追踪。

```sh
#!/usr/bin/perl
=pod
  file: t.pm
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package T;
require Exporter;
@ISA = qw/Exporter/;
@EXPORT = qw/function/;
use Carp qw(cluck);
sub function {
   cluck "Error in module!";
}
1;
```

在脚本调用以下程序:

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use T;
function();
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Error in module! at T.pm line 20.
    T::function() called at main.pl line 13
```

## croak 函数

croak() 与 die() 一样，可以结束脚本。

```sh
#!/usr/bin/perl
=pod
  file: t.pm
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package T;
require Exporter;
@ISA = qw/Exporter/;
@EXPORT = qw/function/;
use Carp;
sub function {
   croak "Error in module!";
}
1;
```

在脚本调用以下程序:

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use T;
function();
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Error in module! at main.pl line 13.
```

## confess 函数

confess() 与 die() 类似，但提供了从产生错误处的栈回溯追踪。

```sh
#!/usr/bin/perl
=pod
  file: t.pm
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
package T;
require Exporter;
@ISA = qw/Exporter/;
@EXPORT = qw/function/;
use Carp;
sub function {
   confess "Error in module!";
}
1;
```

在脚本调用以下程序:

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use T;
function();
```

运行以上范例，输出结果为:

```sh
$ perl main.pl
Error in module! at main.pl line 13.
```
