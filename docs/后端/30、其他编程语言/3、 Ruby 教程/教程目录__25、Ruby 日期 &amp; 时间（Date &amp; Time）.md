# 25、Ruby 日期 &amp; 时间（Date &amp; Time）
- 来源：https://ddkk.com/zhuanlan/other/ruby/25.html
- 分类：Ruby 教程
- 分组：教程目录
Ruby 语言内建了 **Time** 类用来处理日期和时间相关的操作

**Time** 类是基于操作系统提供的系统日期和时间之上

> 注意: Time 类可能无法表示 1970 年之前或者 2038 年之后的日期

## 创建当前的日期和时间

下面的代码可以用来获取当前的日期和时间

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
t1 = Time.new
puts "当前时间 : " + t1.inspect
t2 = Time.now
puts "当前时间 : " + t2.inspect
```

运行范例 »

运行以上范例，输出结果如下：

```ruby
$ ruby main.rb
当前时间 : 2017-10-18 10:50:39 +0800
当前时间 : 2017-10-18 10:50:39 +0800
```

## Date & Time 组件

使用 *Time* 对象可以获取各种日期和时间的组件

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
time = Time.new
# Time 的组件
puts "当前时间 : " + time.inspect
puts time.year    # => 日期的年份
puts time.month   # => 日期的月份（1 到 12）
puts time.day     # => 一个月中的第几天（1 到 31）
puts time.wday    # => 一周中的星期几（0 是星期日）
puts time.yday    # => 365：一年中的第几天
puts time.hour    # => 23：24 小时制
puts time.min     # => 59
puts time.sec     # => 59
puts time.usec    # => 999999：微秒
puts time.zone    # => "UTC"：时区名称
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
当前时间 : 2017-10-18 10:48:15 +0800
2017
10
18
3
291
10
48
15
429008
CST
```

## Time.utc 、 Time.gm 和 Time.local 函数

**Time.utc** 、 **Time.gm** 和 **Time.local** 函数可以用来格式化标准格式的日期

```ruby
# Oct 18, 2017
Time.local(2017, 10, 18)  
# Oct 18, 2017, 10:41am，本地时间
Time.local(2017, 10, 18, 10, 41)   
# Oct 18, 2017, 01:10 UTC
Time.utc(2017, 10, 18, 1, 18)  
# Oct 17, 2017, 09:10:11 CST （与 UTC 相同）
Time.gm(2017, 10, 18, 9, 10, 11)
```

下面的范例在数组中获取所有的组件

```ruby
[sec,min,hour,day,month,year,wday,yday,isdst,zone]
```

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
t = Time.new
values = t.to_a
p values
```

运行以上 Ruby 范例，输出结果如下：

```ruby
$ ruby main.rb
[59, 43, 10, 18, 10, 2017, 3, 291, false, "CST"]
```

**Time.to_a** 返回该数组可被传到 *Time.utc* 或 *Time.local* 函数来获取日期的不同格式

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
t = Time.new
values = t.to_a
puts Time.utc(*values)
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
2017-10-18 10:46:22 UTC
```

### 下面是获取时间的方式，从纪元以来的秒数（平台相关）

```ruby
# 返回从纪元以来的秒数
time = Time.now.to_i  
# 把秒数转换为 Time 对象
Time.at(time)
# 返回从纪元以来的秒数，包含微妙
time = Time.now.to_f
```

## 时区和夏令时

*Time* 对象可以用来获取与时区和夏令时有关的所有信息

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
time = Time.new
puts time.zone       # => "CST"：返回时区
puts time.utc_offset # => 28800：UTC 是相对于 UTC 的 0 秒偏移
puts time.zone       # => "CST"（或其他时区）
puts time.isdst      # => false：如果 UTC 没有 DST（夏令时）
puts time.utc?       # => true：如果在 UTC 时区
puts time.localtime  # 转换为本地时区
puts time.gmtime     # 转换回 UTC
puts time.getlocal   # 返回本地区中的一个新的 Time 对象
puts time.getutc     # 返回 UTC 中的一个新的 Time 对象
```

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
CST
28800
CST
false
false
2017-10-18 10:37:48 +0800
2017-10-18 02:37:48 UTC
2017-10-18 10:37:48 +0800
2017-10-18 02:37:48 UTC
```

## 格式化时间和日期

有多种方式格式化日期和时间

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
time = Time.new
puts time.to_s
puts time.ctime
puts time.localtime
puts time.strftime("%Y-%m-%d %H:%M:%S")
```

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
2017-10-18 10:36:03 +0800
Wed Oct 18 10:36:03 2017
2017-10-18 10:36:03 +0800
2017-10-18 10:36:03
```

## 时间格式化指令

下表列出了 *Time.strftime* 可以使用的一些格式化指令

指令
描述

%a
星期几名称的缩写（比如 Sun）

%A
星期几名称的全称（比如 Sunday）

%b
月份名称的缩写（比如 Jan）

%B
月份名称的全称（比如 January）

%c
优选的本地日期和时间表示法

%d
一个月中的第几天（01 到 31）

%H
一天中的第几小时，24 小时制（00 到 23）

%I
一天中的第几小时，12 小时制（01 到 12）

%j
一年中的第几天（001 到 366）

%m
一年中的第几月（01 到 12）

%M
小时中的第几分钟（00 到 59）

%p
子午线指示（AM 或 PM）

%S
分钟中的第几秒（00 或 60）

%U
当前年中的周数，从第一个星期日（作为第一周的第一天）开始（00 到 53）

%W
当前年中的周数，从第一个星期一（作为第一周的第一天）开始（00 到 53）

%w
一星期中的第几天（Sunday 是 0，0 到 6）

%x
只有日期没有时间的优先表示法

%X
只有时间没有日期的优先表示法

%y
不带世纪的年份表示（00 到 99）

%Y
带有世纪的年份

%Z
时区名称

%%
% 字符

## Time 算术运算

Time 的实例可以做一些简单的算术运算

#### main.rb

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
now = Time.now           # 当前时间
puts now
past = now - 10          # 10 秒之前。Time - number => Time
puts past
future = now + 10        # 从现在开始 10 秒之后。Time + number => Time
puts future
diff = future - now      # => 10  Time - Time => 秒数
puts diff
```

运行以上 Ruby 范例，输出结果如下

```ruby
$ ruby main.rb
2017-10-18 10:31:37 +0800
2017-10-18 10:31:27 +0800
2017-10-18 10:31:47 +0800
10.0
```
