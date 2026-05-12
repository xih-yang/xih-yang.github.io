# 04、Shell 字符串
- 来源：https://ddkk.com/zhuanlan/other/shell/4.html
- 分类：Shell 教程
- 分组：教程目录
字符串所有编程语言中最重要的一种数据类型，在 shell 中也一样重要

字符串可以用单引号引起来，也可以用双引号引起来，也可以不用引号。

## 单引号字符串

```sh
demo_str='这是一段字符串\n即使有换行符也不会换行'
```

单引号字符串的限制：

- 单引号里的任何字符都会原样输出，单引号字符串中的变量是无效的
- 单引号字串中不能出现单引号，对单引号使用转义符后也不行

#### 单引号字符串使用范例

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
name="DDKK.COM 弟弟快看，程序员编程资料站"
demo_str='这是一段字符串 ${name} 嵌入的变量名不会起作用'
echo $demo_str
```

脚本运行结果

```sh
$ sh demo.sh
这是一段字符串 ${name} 嵌入的变量名不会起作用
```

## 双引号

```sh
name="DDKK.COM 弟弟快看，程序员编程资料站"
demo_str="这是一段字符串 \${name} 嵌入的变量名会起作用 ${name}"
```

双引号的优点：

- 双引号里可以有变量
- 双引号里可以出现转义字符

#### 范例: 双引号字符串使用范例

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
name="DDKK.COM 弟弟快看，程序员编程资料站"
demo_str="这是一段字符串 \${name} 嵌入的变量名会起作用 ${name}"
echo $demo_str
```

脚本运行结果

```sh
$ sh demo.sh
这是一段字符串 ${name} 嵌入的变量名会起作用 DDKK.COM 弟弟快看，程序员编程资料站
```

## 拼接字符串

Shell 中拼接支付串只需要把两个字符串变量放到一起可以了，比如

```sh
greeting="hello, "
name="简明教程!"
demo_str=${greeting}${name}
```

#### 范例: 拼接字符串

```sh
site_name="DDKK.COM 弟弟快看，程序员编程资料站(www.jiandanjiaocheng.com)"
greeting="hello, "$site_name" !"
greeting_1="hello, ${site_name} !"
demo_str=${greeting}${greeting_1}
echo $demo_str
```

脚本运行结果

```sh
$ sh demo.sh
hello, DDKK.COM 弟弟快看，程序员编程资料站(www.jiandanjiaocheng.com) !hello, DDKK.COM 弟弟快看，程序员编程资料站(www.jiandanjiaocheng.com) !
```

## 获取字符串长度

使用 `$` {#变量名} 可以获取字符串的长度。

#### 范例: 获取字符串长度

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
site_name="DDKK.COM 弟弟快看，程序员编程资料站(www.jiandanjiaocheng.com)"
echo ${#site_name}
```

运行脚本输出结果

```sh
$ sh demo.sh
30
```

## 提取子字符串

使用 `$` {#变量名:开始索引:提取长度} 可以提取子字符串

> 注意 字符串索引从 0 开始，也就是第一个字符的索引是 0

#### 范例: 从 demo_str 中第 2 个字符开始提取 4 个字符

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
site_name="DDKK.COM 弟弟快看，程序员编程资料站(www.jiandanjiaocheng.com)"
echo ${site_name:1:4}
```

运行脚本输出结果

```sh
$ sh demo.sh
单教程(
```

如果省略截取长度，则表示一直到结束

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
site_name="DDKK.COM 弟弟快看，程序员编程资料站(www.jiandanjiaocheng.com)"
echo ${site_name:1}
```

脚本运行结果

```sh
$ sh demo.sh
单教程(www.jiandanjiaocheng.com)
```

## 延伸阅读

更多Shell 字符串操作可以查看 [cnblogs:linux shell 字符串操作（长度，查找，替换）详解](http://www.cnblogs.com/chengmo/archive/2010/10/02/1841355.html)
