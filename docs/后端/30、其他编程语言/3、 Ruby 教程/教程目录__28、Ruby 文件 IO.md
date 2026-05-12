# 28、Ruby 文件 IO
- 来源：https://ddkk.com/zhuanlan/other/ruby/28.html
- 分类：Ruby 教程
- 分组：教程目录
Ruby 内核（Kernel）模块中实现了一整套 I/O 相关的方法。

Ruby 中所有的 I/O 方法都派生自 IO 类。

类 *IO* 提供了所有基础的方法，比如 *read、 write、 gets、 puts、 readline、 getc* 和 *printf*

## puts 方法

**puts** 方法用于显示存储在变量中的值 **puts** 方法每次都会在输出的末尾添加一个换行符

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
str1 = "www.ddkk.com"
str2 = "DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站"
puts str1
puts str2
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
www.ddkk.com
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

## gets 方法

**gets** 方法用于获取来自 STDIN 的标准屏幕的用户输入

### 范例

这个范例演示了如何使用 gets 语句。它提示用户输入一个值，该值将被存储在变量 val 中，最后会被输出到 STDOUT

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts "请输入一行字符串 :"
val = gets
puts val
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
请输入一行字符串 :
Hello www.ddkk.com
Hello www.ddkk.com
```

## putc 方法

**putc** 方法用于输出一个字符

### 范例

下面的范例输出了字符 **H**

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
str="Hello DDKK.COM 弟弟快看，程序员编程资料站!"
putc str
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
H
```

## print 方法

**print** 方法用于显示存储在变量中的值 **print** 与 *puts* 方法的不同之处在于不会在末尾自动添加换行符

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
str1 = "www.ddkk.com"
str2 = "DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站"
print str1
print str2
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
www.ddkk.comDDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

## 打开和关闭文件

上面介绍的方法，只能用来处理标准输入和标准输出，不能用来操作文件。

接下来我们将学习如何操作实际的数据文件

### File.new 方法

**File.new** 方法用来创建一个 *File* 对象用于读取、写入或者读写

读写权限取决于 mode 参数

#### File.new 语法格式

```ruby
f = File.new("filename", "mode")
```

### File.close 方法

**File.close** 方法来关闭使用 **File.new** 打开的文件

#### File.close 语法格式

```ruby
f.close
```

### File.open 方法

File.open 方法可以创建一个新的 file 对象，并把该 file 对象赋值给文件

*File.open* 和 *File.new* 方法之间有一点不同：

```ruby
  File.open 方法可与块关联，而 File.new 方法不能
```

#### File.open 语法格式

```ruby
File.open("filename", "mode") do |aFile|
   # ... process the file
end
```

### 下表列出了打开文件的不同模式

模式
描述

r
只读模式
文件指针被放置在文件的开头。这是默认模式

r+
读写模式
文件指针被放置在文件的开头

w
只写模式
如果文件存在，则重写文件
如果文件不存在，则创建一个新文件用于写入

w+
读写模式
如果文件存在，则重写已存在的文件
如果文件不存在，则创建一个新文件用于读写

a
只写模式
如果文件存在，则文件指针被放置在文件的末尾，即文件是追加模式
如果文件不存在，则创建一个新文件用于写入

a+
读写模式
如果文件存在，则文件指针被放置在文件的末尾，即文件是追加模式
如果文件不存在，则创建一个新文件用于读写

## 读取和写入文件

所有用于标准输入和输出的方法也可以用于 file 对象

gets 从标准输入读取一行， *file.gets* 从文件对象 file 读取一行

### sysread 方法

**sysread** 可以用来读取文件的内容

**sysread** 方法可以作用于任意模式打开的文件对象

假设我们存在一个文件 demo.txt 内容如下

```ruby
Hello DDKK.COM 弟弟快看，程序员编程资料站
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

下面的范例尝试读取 demo.txt 文件并输出到标准输出上

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
f = File.new("demo.txt", "r")
if f
   content = f.sysread(64)
   puts content
else
   puts "Unable to open file!"
end
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb  
Hello DDKK.COM 弟弟快看，程序员编程资料站
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

### syswrite 方法

**syswrite** 方法用来向文件写入内容 **syswrite** 方法只能操作以写入模式打开文件对象

### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
f = File.new("demo.txt", "r+")
if f
   f.syswrite("DDKK.COM 弟弟快看，程序员编程资料站的官网是:/")
else
   puts "Unable to open file!"
end
```

运行以上范例，查看 demo.txt 内容如下

```ruby
$ cat demo.txt   
DDKK.COM 弟弟快看，程序员编程资料站的官网是:/
```

### each_byte 方法

**each_byte** 用于迭代字符串中每个字符

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
f = File.new("demo.txt", "r+")
if f
   f.syswrite("The home page of ddkk is: /")
   f.rewind
   f.each_byte {|ch| putc ch; putc ?. }
else
   puts "Unable to open file!"
end
```

运行以上范例，字符一个接着一个被传到变量 ch，然后显示在屏幕上

```ruby
$ ruby main.rb
T.h.e. .h.o.m.e. .p.a.g.e. .o.f. .t.w.l.e. .i.s.:. .h.t.t.p.s.:././.w.w.w...t.w.l.e...c.n./.
.
```

### IO.readlines 方法

*File* 类是 IO 类的一个子类 IO 类也有一些用于操作文件的方法

**IO.readlines** 是 IO 类中的一个方法，该方法逐行返回文件的内容

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
arr = IO.readlines("demo.txt")
puts arr[0]
puts arr[1]
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
T.h.e. .h.o.m.e. .p.a.g.e. .o.f. .t.w.l.e. .i.s.:. .h.t.t.p.s.:././.w.w.w...t.w.l.e...c.n./.
.% 
```

上面的范例，变量 arr 是一个数组。文件 *input.txt* 的每一行将是数组 arr 中的一个元素。因此，arr[0] 将包含第一行，而 arr[1] 将包含文件的第二行

### IO.foreach 方法

**IO.foreach** 也用于逐行返回输出

**foreach** 不反悔一个数组，而是把每一行交给块(block) 处理

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
IO.foreach("demo.txt"){|block| puts block}
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
The home page of ddkk is: /
```

## 重命名和删除文件

**rename** 方法可以用来重命名文件 **delete** 方法可以用来删除文件

我们使用 touch demo2.txt 在当前目录下新建一个 demo2.txt 的文件

下面的范例将 demo2.txt 重命名为 test2.txt

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
# 重命名文件 demo2.txt 为 test2.txt
File.rename( "demo2.txt", "test2.txt" )
```

运行以上范例，然后使用 ls 命令列出当前目录下的文件列表

```ruby
$ ls
demo.json  demo.txt  main.rb  test2.txt
```

下面的范例用来删除 test2.txt 文件

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
# 删除文件 test2.txt
File.delete("test2.txt")
```

运行以上范例，然后使用 ls 命令查看当前目录下的文件，可以发现 test2.txt 已经被删除了

```ruby
$ ls
demo.json  demo.txt  main.rb
```

## 文件模式与所有权

带有掩码的 **chmod** 方法可以用来改变文件的模式或权限/访问列表

我们使用 touch demo2.txt 创建 demo2.txt 文件 然后使用 ls -l demo.txt 查看文件权限

```ruby
$ ls -l demo2.txt
-rw-r--r-- 1 penglei staff 0 10 18 21:00 demo2.txt
```

下面的范例改变文件 *demo2.txt** 的模式为一个掩码值：0755

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
f = File.new( "demo2.txt", "r" )
f.chmod( 0755 )
```

运行以上范例，然后使用 ls -l demo2.txt 查看文件信息如下

```ruby
$ ls -l demo2.txt
-rwxr-xr-x 1 penglei staff 0 10 18 21:00 demo2.txt
```

### 下表列出了 chmod 方法可使用的掩码

掩码
描述

0700
rwx 掩码，针对所有者

0400
r ，针对所有者

0200
w ，针对所有者

0100
x ，针对所有者

0070
rwx 掩码，针对所属组

0040
r ，针对所属组

0020
w ，针对所属组

0010
x ，针对所属组

0007
rwx 掩码，针对其他人

0004
r ，针对其他人

0002
w ，针对其他人

0001
x ，针对其他人

4000
执行时设置用户 ID

2000
执行时设置所属组 ID

1000
保存交换文本，甚至在使用后也会保存

## 文件查询

### File::exists? 方法

**File::exists?** 方法可以用来检查文件是否已经存在

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts "demo.txt is exist" if File::exists?( "demo.txt" )
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb   
demo.txt is exist
```

### File::file? 方法

**File::file?** 方法用来查询文件名是否确实是一个文件

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts "demo.txt is a file" if File.file?( "demo.txt" )
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
demo.txt is a file
```

### File::directory? 方法

**File::directory?** 方法用来检查给定的字符串是否是一个目录

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
# 一个目录
puts File::directory?( "/usr/local/bin" ) # => true
# 一个文件
puts File::directory?( "demo.rb" ) # => false
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
true
false
```

### File::readable?、File::writable?、File::executable? 方法

**File::readable?** 用来检查一个文件是否可读 **File::writable?** 用来检查一个文件是否可写 **File::executable?** 用来检查一个文件是否可执行

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts File::readable?( "demo.txt" )
puts File::writable?( "demo.txt" )
puts File::executable?( "demo.txt" )
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
true
true
false
```

### File::zero? 方法

**File::zero?** 方法用来检查文件是否大小为 0

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts File::zero?( "demo.txt" )
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
false
```

### File::size? 方法

**File::size?** 方法返回文件的大小

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts File.size?( "demo.txt" )
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
47
```

### File::ftype 方法

**File::ftype** 方法用于检查文件的类型

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts File::ftype( "demo.txt" )
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
file
```

ftype 方法通过返回下列中的某个值来标识了文件的类型：

**file、 directory、 characterSpecial、blockSpecial、 fifo、 link、 socket 或 unknown**

### File::ctime、File::mtime、File::atime

**File::ctime** 返回文件的创建时间 **File::mtime** 返回文件最后修改的时间 **File::atime** 返回文件最后访问的时间

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
puts File::ctime( "demo.txt" ) 
puts File::mtime( "demo.txt" ) 
puts File::atime( "demo.txt" )
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
2017-10-18 20:46:53 +0800
2017-10-18 20:46:53 +0800
2017-10-18 20:54:15 +0800
```

## Ruby 中的目录

所有的文件都是包含在目录中

Ruby 提供了处理文件和目录的类

**File** 类用于处理文件 **Dir** 类用于处理目录

### Dir::chdir 方法

**Dir::chdir** 方法可以用来改变运行所在目录

下面的范例改变当前目录为 */usr/bin*

```ruby
Dir.chdir("/usr/bin")
```

### Dir::pwd 方法

**Dir::pwd** 方法查看当前的运行目录

```ruby
puts Dir.pwd # 返回当前目录，类似 /usr/bin
```

### Dir::entries 方法

**Dir::entries** 用于获取指定目录内的文件和目录列表

```ruby
puts Dir.entries("/usr/bin").join(' ')
```

*Dir.entries* 返回一个数组，包含指定目录内的所有项

### Dir::foreach 方法

**Dir.foreach** 用于获取指定目录内的文件和目录列表

```ruby
Dir.foreach("/usr/bin") do |entry|
   puts entry
end
```

### Dir 方法

**Dir** 方法也可以用来获取目录列表

```ruby
Dir["/usr/bin/*"]
```

### 创建目录

**Dir::mkdir** 可用于创建目录

```ruby
Dir::mkdir("mynewdir")
```

**Dir::mkdir** 也可以用于在新目录（不是已存在的目录）上设置权限：

> 注意： 掩码 755 设置所有者（owner）、所属组（group）、每个人（world [anyone]）的权限为 rwxr-xr-x，其中 r = read 读取，w = write 写入，x = execute 执行

```ruby
Dir.mkdir( "mynewdir", 755 )
```

### 删除目录

**Dir::delete** 方法可用于删除目录 **Dir.unlink** 和 **Dir.rmdir** 执行同样的功能

```ruby
Dir.delete("testdir")
```

## 创建文件 & 临时目录

临时文件是那些在程序执行过程中被简单地创建，但不会永久性存储的信息

**Dir.tmpdir** 提供了当前系统上临时目录的路径，但是该方法默认情况下是不可用的。 为了让 **Dir.tmpdir** 可用，使用必需的 'tmpdir' 是必要的

把 **Dir.tmpdir** 和 **File.join** 一起使用，来创建一个独立于平台的临时文件

```ruby
require 'tmpdir'
tempfilename = File.join(Dir.tmpdir, "tingtong")
tempfile = File.new(tempfilename, "w")
tempfile.puts "This is a temporary file"
tempfile.close
File.delete(tempfilename)
```

这段代码创建了一个临时文件，并向其中写入数据，然后删除文件。

Ruby 的标准库也包含了一个名为 *Tempfile* 的库，该库可用于创建临时文件

```ruby
require 'tempfile'
f = Tempfile.new('tingtong')
f.puts "Hello"
puts f.path
f.close
```

## 内建函数

下面提供了 Ruby 中处理文件和目录的内建函数的完整列表

- File 类和方法
- Dir 类和方法
