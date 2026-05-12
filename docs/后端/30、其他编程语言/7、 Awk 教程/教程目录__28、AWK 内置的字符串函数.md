# 28、AWK 内置的字符串函数
- 来源：https://ddkk.com/zhuanlan/other/awk/28.html
- 分类：Awk 教程
- 分组：教程目录
AWK作为最强大的行文本处理器之一，内置了几个短小精悍的字符串处理函数。

比起其它语言，少是少了一些，但不妨碍覆盖面之广和功能的强大。

## 按 ASCII 字符顺序对数组的值进行排序 asort(arr [, d [, how] ])

asort(arr [, d [, how] ]) 函数按 ASCII 字符顺序对数组 arr 的值进行排序。

因为是对值进行排序，所以返回的结果是重新索引的，下标从 1 开始。

asort(arr [, d [, how] ]) 函数的原型如下

```sh
asort(arr [, d [, how] ])
```

### 参数说明

参数
说明

arr
必填，要排序的数组

d
选填，数组，如果传递了该参数，那么就不会修改数组 arr，而是把 arr 中的所有元素都拷贝到 d，然后对 d 进行排序

how
选填，

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   arr[0] = "Ten"
   arr[1] = "Nine"
   arr[2] = "One"
   print "Array elements before sorting:"
   for (i in arr) {
      print arr[i]
   }
   asort(arr)
   print "Array elements after sorting:"
   for (i in arr) {
      print arr[i]
   }
}'
```

运行以上 awk 命令，输出结果如下

```sh
Array elements before sorting:
Ten
Nine
One
Array elements after sorting:
Nine
One
Ten
```

## 按 ASCII 字符顺序对数组的键进行排序 asorti(arr [, d [, how] ])

asorti(arr [, d [, how] ]) 函数按 ASCII 字符顺序对数组 arr 的键进行排序。

因为是对键进行排序，所以相应的值并没有发生啥变化。

asorti(arr [, d [, how] ]) 函数的原型如下

```sh
asorti(arr [, d [, how] ])
```

### 参数说明

参数
说明

arr
必填，要排序的数组

d
选填，数组，如果传递了该参数，那么就不会修改数组 arr，而是把 arr 中的所有元素都拷贝到 d，然后对 d 进行排序

how
选填，

### Example

```sh
[www.ddkk.com]$ awk 'BEGIN {
   arr["Ten"]   = 1
   arr["Nine"]   = 2
   arr["One"] = 3
   asorti(arr)
   print "Array indices after sorting:"
   for (i in arr) {
      print arr[i]
   }
}'
```

运行以上 awk 命令，输出结果如下

```sh
Array indices after sorting:
Nine
One
Ten
```

## 字符串正则替换 gsub(regex, sub, string)

函数gsub(regex, sub, string) 在一个字符串中查找指定的 **模式** 匹配的全部字符串，找到之后都替换为另一个字符串。

> 注意： 该函数会把所有找到的匹配模式的字符串都替换而不仅仅是一次。

它的函数原型如下

```sh
gsub(regex, sub, string)
```

函数gsub(regex, sub, string) 在一个字符串 string 中查找指定的 **模式** regex ，找到之后则替换为另一个字符串 sub 。

其中sub 参数是可选的，如果忽略，则会使用匹配模式中的 `$` 0 代替。

### 参数说明

参数
说明

regex
要查找和替换的模式

sub
要替换为的字符串

string
源字符串

### 范例 1

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "Hello, World"
   print "替换钱 = " str
   gsub("o[a-z]*", "www.ddkk.com", str)
   print "替换后 = " str
}'
```

运行以上 awk 命令，输出结果如下

```sh
替换钱 = Hello, World
替换后 = Hellwww.ddkk.com, Wwww.ddkk.com
```

## 是否包含字符串 index(str, sub)

index(str, sub) 函数用于查找一个字符串在另一个字符串中的位置。如果找到则返回找到的位置，否则返回 0。

准确的来说，index(str, sub) 用于查找字符串在 sub 是否包含在字符串 str 中，如果是则返回所在的位置。

> 需要注意的是，如果你懂其它的语言，那么请千万千万注意，返回 0 则表示没知道，如果返回 1 则表示是字符串的开头。
>
> 其它语言是返回 -1 表示没知道，返回 0 表示在字符串的开始。

### 参数说明

参数
说明

str
被查找的字符串

sub
要查找的字符串

### 范例 1

返回子串的位置

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "One Two Three"
   subs = "Two"
   ret = index(str, subs)
   printf "子串 \"%s\" 的位置为 %d\n", subs, ret
}'
```

运行以上 awk 命令，输出结果如下

```sh
子串 "Two" 的位置为 5
```

### 范例 2

返回子串的位置，这次没找到

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "One Two Three"
   subs = "Four"
   ret = index(str, subs)
   printf "子串 \"%s\" 的位置为 %d\n", subs, ret
}'
```

运行以上 awk 命令，输出结果如下

```sh
子串 "Four" 的位置为 0
```

### 范例 3

返回子串的位置，找到且在开始

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "One Two Three"
   subs = "One"
   ret = index(str, subs)
   printf "子串 \"%s\" 的位置为 %d\n", subs, ret
}'
```

运行以上 awk 命令，输出结果如下

```sh
子串 "One" 的位置为 1
```

## 字符串长度 length(str)

length(str) 函数用于返回一个字符串的总字节数。

总字符串的长度和系统的语言有关，一般情况下，系统使用的都是 UTF-8 作为系统编码，在这种情况下，一个中文的长度为 3。

它的函数原型如下

```sh
length(str)
```

### 参数说明

参数
说明

str
要统计的字符串

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "Hello, World !!!"
   print str, " 长度为: ", length(str)
}'
```

运行以上 awk 命令，输出结果如下

```sh
Hello, World !!!  长度为:  16
```

### 范例 2

统计中文字符串的长度

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "DDKK.COM 弟弟快看，程序员编程资料站"
   print str, " 长度为: ", length(str)
}'
```

运行以上 awk 命令，输出结果如下

```sh
DDKK.COM 弟弟快看，程序员编程资料站  长度为:  12
```

## 查找匹配模式的子串位置 match(str, regex)

函数match(str, regex) 用于查找匹配模式的第一个最长子串位置。如果没找到则返回 0，找到则返回最长子串的开始位置。

准确的说，match(str, regex) 用于查找字符串 str 中匹配 regex 模式的第一个最长匹配的开始位置。

它的函数原型如下

```sh
match(str, regex)
```

### 参数说明

参数
说明

str
被查找的字符串

regex
要查找的模式

### 范例 1

找到则返回最长匹配的位置

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "One Two Three Twoo Four"
   subs = "T\w*"
   ret = match(str, subs)
   printf "子串 \"%s\" 的位置为 %d\n", subs, ret
}'
```

运行以上 awk 命令，输出结果如下

```sh
子串 "Tw+" 的位置为 5
```

### 范例 2

没找到则返回 0

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "One Two Three Twoo Four"
   subs = "To\w+"
   ret = match(str, subs)
   printf "子串 \"%s\" 的位置为 %d\n", subs, ret
}'
```

运行以上 awk 命令，输出结果如下

```sh
子串 "Tow+" 的位置为 0
```

### 范例 3

开始位置则返回 1

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "One Two Three Twoo Four"
   subs = "O\w+"
   ret = match(str, subs)
   printf "子串 \"%s\" 的位置为 %d\n", subs, ret
}'
```

运行以上 awk 命令，输出结果如下

```sh
子串 "Ow*" 的位置为 1
```

## 字符串分割 split(str, arr, regex)

函数split(str, arr, regex) 用于把一个字符串根据给定的 **模式** 分割成多个子串。如果没有传递 **模式** 则会使用变量 FS 的值。

> 变量 FS 的默认值是 空白符 ，可以通过 -f 选项自定义。

具体到参数，函数 split(str, arr, regex) 用于把一个字符串 str 根据给定的 **模式** regex 分割成多个子串并把结果保存到 arr 数组中。

函数split(str, arr, regex) 的原型是

```sh
split(str, arr, regex)
```

### 参数说明

参数
说明

str
被分割的字符串

arr
保存了分割之后的子串

regex
用于分割的模式

### 范例 1

根据指定的模式分割字符串

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "春,夏,秋,冬"
   split(str, arr, ",")
   print "Array contains following values"
   for (i in arr) {
      print arr[i]
   }
}'
```

运行以上 awk 命令，输出结果如下

```sh
Array contains following values
夏
秋
冬
春
```

### 范例 2

如果没有传递分割模式，则使用变量 FS 的值 根据指定的模式分割字符串

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "春 夏 秋 冬"
   split(str,arr)
   print "Array contains following values"
   for (i in arr) {
      print arr[i]
   }
}'
```

运行以上 awk 命令，输出结果如下

```sh
Array contains following values
夏
秋
冬
春
```

### 范例 3

如果分割的模式没找到，则返回将整个字符串当作子串

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "春 夏 秋 冬"
   split(str,arr,"~")
   print "Array contains following values"
   for (i in arr) {
      print arr[i]
   }
}'
```

运行以上 awk 命令，输出结果如下

```sh
Array contains following values
春 夏 秋 冬
```

## 字符串输出 printf(format, expr-list)

函数printf(format, expr-list) 根据给定的字符串格式和传递的变量构造字符串并输出到标准输出。

它的原型如下

```sh
printf(format, expr-list)
```

### 参数说明

参数
说明

format
字符串格式

expr-list
用于替代字符串格式中的格式符的变量列表

### 范例 1

```sh
[www.ddkk.com]$ awk 'BEGIN {
   param = 1024.0
   result = sqrt(param)
   printf "sqrt(%f) = %f\n", param, result
}'
```

运行以上 awk 命令，输出结果如下

```sh
sqrt(1024.000000) = 32.000000
```

## 字符串转数字 strtonum(str)

函数strtonum(str) 用于检查一个字符串是否数字并将它转换为十进制数字。

> Mac OS 下该函数无效

它的原型如下

```sh
strtonum(str)
```

函数strtonum(str) 用于检查一个字符串 str 是否数字并将它转换为十进制数字。

转换规则如下：

**1、** 如果字符串str以数字0开始，则会当作一个八进制数字；

**2、** 如果字符串str以字符0x或0X开始，则会被当作一个十六进制数字；

**3、** 否则会假设它是一个十进制数字；

**4、** 如果以上都不是，则直接返回数字0；

### 参数说明

参数
说明

str
要转换的字符串

### 范例 1

如果字符串 str 以数字 0 开始，则会当作一个八进制数字。

```sh
[www.ddkk.com]$ awk 'BEGIN {
   print "八进制数字 = " strtonum("0123")
}'
```

运行以上 awk 命令，输出结果如下

```sh
八进制数字 = 83
```

### 范例 2

如果字符串 str 以字符 0x 或 0X 开始，则会被当作一个十六进制数字

```sh
[www.ddkk.com]$ awk 'BEGIN {
   print "十六进制数字 = " strtonum("0x123")
}'
```

运行以上 awk 命令，输出结果如下

```sh
十六进制数字 = 291
```

### 范例 3

如果是一个十进制数字，则会直接转换

```sh
[www.ddkk.com]$ awk 'BEGIN {
   print "十进制数字 = " strtonum("123")
}'
```

运行以上 awk 命令，输出结果如下

```sh
十进制数字 = 123
```

### 范例 4

如果不能转换为数字，则直接返回 0

```sh
[www.ddkk.com]$ awk 'BEGIN {
   print "不是数字的字符串 = " strtonum("x1x")
}'
```

运行以上 awk 命令，输出结果如下

```sh
不是数字的字符串 = 0
```

### 范例 5

如果以数字开始则会尽量转换知道遇到不是数字的字符结束

```sh
[www.ddkk.com]$ awk 'BEGIN {
   print "不是数字的字符串 = " strtonum("0123x")
}'
```

运行以上 awk 命令，输出结果如下

```sh
不是数字的字符串 = 83
```

## 字符串替换 sub(search, sub, string)

函数sub(search, sub, string) 在一个字符串中查找指定的 **字符串**，找到之后则替换为另一个字符串。只会替换一次。

> 注意： 只会替换一次。

它的函数原型如下

```sh
sub(search [, sub], string)
```

函数sub(search, sub, string) 在一个字符串 string 中查找指定的 **字符串** search ，找到之后则替换为另一个字符串 sub 。

其中sub 参数是可选的，如果忽略，则会使用匹配模式中的 `$` 0 代替。

### 参数说明

参数
说明

search
要查找和替换的字符串

sub
要替换为的字符串

string
源字符串

### 范例 1

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "Hello, World"
   print "替换前 = " str
   sub("World", "www.ddkk.com", str)
   print "替换后 = " str
}'
```

运行以上 awk 命令，输出结果如下

```sh
替换前 = Hello, World
替换后 = Hello, www.ddkk.com
```

## 子串 substr(str, start, l)

substr(str, start, l) 函数用于返回字符串 str 中的从 start 的位置开始，长度为 l 的子串。

如果没有指定 l 参数，那么会返回从 start 开始到结束之间的所有字符

substr(str, start, l) 函数的原型如下

```sh
substr(str, start, l)
```

### 参数说明

参数
说明

str
源字符串

start
子串开始位置

l
子串的长度

### 返回值

substr(str, start, l) 返回字符串 str 中的从 start 开始，长度为 l 的所有字符的一个副本。

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "Hello, www.ddkk.com"
   subs = substr(str, 1, 5)
   print "子串为：" subs
}'
```

运行以上 awk 命令，输出结果如下

```sh
子串为：Hello
```

## 转换为小写 tolower(str)

tolower(str) 函数用于将指定的字符串中的大写字母转换为小写字母。

tolower(str) 函数的原型如下

```sh
tolower(str)
```

### 参数说明

参数
说明

str
要转换的字符串

### 返回值

toupper(str) 返回所有的大写字母都转换为小写字母的 **str** 的副本。

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "HELLO, WORLD !!!"
   print str " 的小写：" tolower(str)
}'
```

运行以上 awk 命令，输出结果如下

```sh
HELLO, WORLD !!! 的小写：hello, world !!!
```

## 转换为大写 toupper(str)

toupper(str) 函数用于将指定的字符串中的小写字母转换为大写字母。

toupper(str) 函数的原型如下

```sh
toupper(str)
```

### 参数说明

参数
说明

str
要转换的字符串

### 返回值

toupper(str) 返回所有的小写字母都转换为大写字母的 **str** 的副本。

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   str = "hello, world !!!"
   print str " 的大写：" toupper(str)
}'
```

运行以上 awk 命令，输出结果如下

```sh
hello, world !!! 的大写：HELLO, WORLD !!!
```
