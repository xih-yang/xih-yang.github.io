# 08、Lua 函数
- 来源：https://ddkk.com/zhuanlan/other/lua/8.html
- 分类：Lua 教程
- 分组：教程目录
## Lua 函数

在Lua中，函数是对语句和表达式进行抽象的主要方法。既可以用来处理一些特殊的工作，也可以用来计算一些值。

Lua提供了许多的内建函数，你可以很方便的在程序中调用它们，如print()函数可以将传入的参数打印在控制台上。

**Lua函数主要有两种用途：**

完成指定的任务，这种情况下函数作为调用语句使用；

计算并返回值，这种情况下函数作为赋值语句的表达式使用。

### 函数定义

Lua编程语言函数定义格式如下：

```sh
optional_function_scope function function_name( argument1, argument2, argument3..., argumentn)
    function_body
    return result_params_comma_separated
end
```

解析：

- **optional_function_scope**
- local
- **function_name:**
- **argument1, argument2, argument3…, argumentn:**
- **function_body:**
- **result_params_comma_separated:**
- 实例
- 以下实例定义了函数 **max()**，参数为 num1, num2，用于比较两值的大小，并返回最大值：

**optional_function_scope**

该参数是可选的用于函数是全局函数还是局部函数，未设置该参数默认为全局函数，如果你需要设置函数为局部函数需要使用关键字 local

**function_name**

指定函数名称

**argument1, argument2, argument3..., argumentn**

函数参数，多个参数以逗号隔开，函数也可以不带参数

**function_body**

函数体，函数中需要执行的代码语句块

**result_params_comma_separated**

函数返回值，Lua语言函数可以返回多个值，每个值以逗号隔开

## 范例 : 定义一个函数 max()

下面范例定义了一个函数 max()，参数为 num1, num2，用于比较两值的大小，并返回最大值

```sh
-- !/usr/bin/lua
-- -*- encoding:utf-8 -*-
-- filename: main.lua
-- author: 简单教程(www.twle.cn)
-- Copyright © 2015-2065 www.twle.cn. All rights reserved.
--[[ 函数返回两个值的最大值 --]]
function max(num1, num2)
   if (num1 > num2) then
      result = num1;
   else
      result = num2;
   end
   return result; 
end
-- 调用函数
print("两值比较最大值为 ",max(10,4))
print("两值比较最大值为 ",max(5,6))
```

运行以上 Lua 脚本，输出结果如下：

```sh
$ lua main.lua
两值比较最大值为  10
两值比较最大值为  6
```

## Lua 中函数可以作为参数传递给函数

```sh
-- !/usr/bin/lua
-- -*- encoding:utf-8 -*-
-- filename: main.lua
-- author: 简单教程(www.twle.cn)
-- Copyright © 2015-2065 www.twle.cn. All rights reserved.
myprint = function(param)
   print("这是打印函数 -   ##",param,"##")
end
function add(num1,num2,functionPrint)
   result = num1 + num2
   -- 调用传递的函数参数
   functionPrint(result)
end
myprint(13)
-- myprint 函数作为参数传递
add(3,7,myprint)
```

运行以上 Lua 脚本，输出结果如下

```sh
$ lua main.lua
这是打印函数 -   ## 13  ##
这是打印函数 -   ## 10  ##
```

## 多返回值

Lua 中的函数可以返回多个结果值，例如 string.find 返回匹配串 "开始和结束的下标"（如果不存在匹配串返回 nil ）

> s, e = string.find("www.twle.cn", "twle")
> print(s, e)
> 5 10

## Lua函数中，在 return 后列出要返回的值得列表即可返回多值

-- !/usr/bin/lua
-- -*- encoding:utf-8 -*-
-- filename: main.lua
-- author: 简单教程(www.twle.cn)
-- Copyright © 2015-2065 www.twle.cn. All rights reserved.

function maximum (a)
local mi = 1 -- 最大值索引
local m = a[mi] -- 最大值
for i,val in ipairs(a) do
if val > m then
mi = i
m = val
end
end
return m, mi
end

print(maximum({1,3,5,7,11}))

运行以上 Lua 脚本，输出结果如下

```sh
$ lua main.lua
11  5
```

## 可变参数

Lua 中的函数可以接受可变数目的参数。

和 C 语言 类似，Lua 在函数参数列表中使用三点 (...) 表示函数有可变的参数

Lua 将函数的参数放在一个叫 arg 的 table 中， #arg 表示传入参数的个数

## 范例 ：计算几个数的平均值

```sh
-- !/usr/bin/lua
-- -*- encoding:utf-8 -*-
-- filename: main.lua
-- author: 简单教程(www.twle.cn)
-- Copyright © 2015-2065 www.twle.cn. All rights reserved.
function average(...)
   result = 0
   local arg={...}
   for i,v in ipairs(arg) do
      result = result + v
   end
   print("总共传入 " .. #arg .. " 个数")
   return result/#arg
end
print("平均值为",average(1,3,5,7,9,11))
```

运行以上 Lua 脚本，输出结果如下

`$` lua main.lua
总共传入 6 个数
平均值为 6.0
