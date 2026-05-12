# 08、Shell printf 命令
- 来源：https://ddkk.com/zhuanlan/other/shell/8.html
- 分类：Shell 教程
- 分组：教程目录
在上一章节中我们学习了 Shell 的 echo 命令，这个命令很好用，但总觉得少了什么？恩，对了，少了格式化

我们希望有一个输出命令能像 C 语言的 printf() 那样就好了

当然，Shell 也有 C 语言类似的 printf 啦，而且名字还特像,它就是 printf 命令。

## printf 命令

#### printf 命令的语法

```sh
printf  format-string  [arguments...]
```

printf 使用引用文本或空格分隔的参数，外面可以在 printf 中使用格式化字符串，还可以制定字符串的宽度、左右对齐方式等。

> 默认 printf 不会像 echo 自动添加换行符，但我们可以手动添加

语法方面看起来使用 printf 的脚本比使用 echo 移植性好

#### 参数说明

参数
说明

format-string
为格式控制字符串

arguments
为参数列表

### 范例 1 : 使用 printf 输出

```sh
$ echo "Hello, DDKK.COM 弟弟快看，程序员编程资料站"
Hello, DDKK.COM 弟弟快看，程序员编程资料站
$ printf "Hello, Shell\n"
Hello, Shell
$
```

### 范例 2 ： 使用 printf 来格式化输出

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
printf "%-10s %-8s %-4s\n"   姓名 性别  体重kg  
printf "%-10s %-8s %-4.2f\n" 素还真 男   66.12 
printf "%-10s %-8s %-4.2f\n" 李寻欢 男      58.65 
printf "%-10s %-8s %-4.2f\n" 郭襄 女      47.98
```

执行脚本，输出结果如下：

```sh
$ sh demo.sh
姓名     性别   体重kg
素还真  男      66.12
李寻欢  男      58.65
郭襄     女      47.98
```

%s%c %d %f 都是格式替代符

%-10s 指一个宽度为10个字符（-表示左对齐，没有则表示右对齐），任何字符都会被显示在10个字符宽的字符内，如果不足则自动以空格填充，超过也会将内容全部显示出来。

%-4.2f 指格式化为小数，其中.2指保留2位小数

### 范例 3 ： 使用 printf 来格式化输出2

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
# format-string为双引号
printf "%d %s\n" 1 "abc"
# 单引号与双引号效果一样 
printf '%d %s\n' 1 "abc" 
# 没有引号也可以输出
printf %s abcdef
# 格式只指定了一个参数，但多出的参数仍然会按照该格式输出，format-string 被重用
printf %s abc def
printf "%s\n" abc def
printf "%s %s %s\n" a b c d e f g h i j
# 如果没有 arguments，那么 %s 用NULL代替，%d 用 0 代替
printf "%s and %d \n"
```

执行脚本，输出结果如下所示：

```sh
1 abc
1 abc
abcdefabcdefabc
def
a b c
d e f
g h i
j
 and 0
```

### %d %s %c %f 格式替代符:

- %d: Decimal 十进制整数 -- 对应位置参数必须是十进制整数，否则报错！
- %s: String 字符串 -- 对应位置参数必须是字符串或者字符型，否则报错！
- %c: Char 字符 -- 对应位置参数必须是字符串或者字符型，否则报错！
- %f: Float 浮点 -- 对应位置参数必须是数字型，否则报错！
- %b: String 字符串 -- 跟 %s 一样，只不过会处理转义序列

#### 范例 4:

```sh
$  printf "%d %s %c\n" 1 "what" "is  your name?"
1 what i
```

## printf 转义序列

序列
描述

\a
警告字符，通常为ASCII的BEL字符

\b
后退

\c
抑制（不显示）输出结果中任何结尾的换行字符（只在%b格式指示符控制下的参数字符串中有效），而且，任何留在参数里的字符、任何接下来的参数以及任何留在格式字符串中的字符，都被忽略

\f
换页（formfeed）

\n
换行

\r
回车（Carriage return）

\t
水平制表符

\v
垂直制表符

\
一个字面上的反斜杠字符

\ddd
表示1到3位数八进制值的字符。仅在格式字符串中有效

\0ddd
表示1到3位的八进制值字符

### 范例 5 ： 使用 printf 输出转义序列字符

%s 会原样输出字符或文本

```sh
$ printf "一段文字,处理转义字符:<%s>\n" "A\nB"
一段文字,不处理转义字符:<A\nB>
```

%b 会处理转义字符

```sh
$ printf "一段文字,会处理转义字符:<%b>\n" "A\nB"
一段文字,会处理转义字符:<A
B>
```

如果直接输出，也会处理转义字符

```sh
$ printf "www.ddkk.com \a"
www.ddkk.com $                  #注意到 不换行有没有
```
