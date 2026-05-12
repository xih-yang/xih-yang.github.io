# 10、Shell 流程控制
- 来源：https://ddkk.com/zhuanlan/other/shell/10.html
- 分类：Shell 教程
- 分组：教程目录
任何语言少了流程控制语句好像都不能称作是语言了

和其它语言类似，shell 也有 if 语句 、while 语句

但和Java、PHP 等语言不一样，shell 的流程控制不可为空

比如PHP 中 if 语句的范例如下

```sh
<?php
if (isset($_GET["q"])) {
    search(q);
}
else {
    // 不做任何事情
}
```

在sh/bash 里可不能这么写，如果 else 分支没有语句执行，就不要写这个else

## if 条件语句

if可用于条件判断，当条件为真时执行一序列命令。

### if

if可用于条件判断，当条件为真时执行一序列命令。

#### if 语句语法格式如下：

```sh
if condition
then
    command1 
    command2
    ...
    commandN 
fi
```

注意语法格式末尾的 fi，fi 是 if 反过来，是 if 语句的结束符。

#### 范例: 使用 if 语句做条件判断

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
i=7
if [[ $i -lt 10 ]]
then
    echo "i 的值小于 10"
fi
```

运行脚本输出结果

```sh
$ sh demo.sh
i 的值小于 5
```

### if 语句也可以写成一行

范例:下面的 if 语句适用于终端命令提示符）

```sh
if [ $(ps -ef | grep -c "ssh") -gt 1 ]; then echo "true"; fi
```

### if else 语句

if语句后面也可以跟 else 语句，用于条件为假时执行一序列命令

#### if else 语法格式如下：

```sh
if condition
then
    command1 
    command2
    ...
    commandN
else
    command
fi
```

#### 范例: 使用 if else 语句判断条件

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
i=7
if [[ $i -lt 5 ]]
then
    echo "i 的值小于 5"
else
    echo "i 的值大于 5"
fi
```

运行上面的脚本，输出结果

```sh
$ sh demo.sh
i 的值大于 5
```

### if elif else

if语句后面可以跟 elif 语句做另一个条件判断。

ifelif 语句如果有跟 else 语句，那么 else 语句必须放在最后

#### if elif else 语法格式如下：

```sh
if condition1
then
    command1
elif condition2 
then 
    command2
else
    commandN
fi
```

我们用一个范例来演示 if elif else 语句

#### 范例: 使用 if elif 判断两个变量是否相等

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
a=7
b=13
if [ $a == $b ]
then
   echo "a 等于 b"
elif [ $a -gt $b ]
then
   echo "a 大于 b"
elif [ $a -lt $b ]
then
   echo "a 小于 b"
else
   echo "没有符合的条件"
fi
```

输出结果：

```sh
$ sh demo.sh
a 小于 b
```

### if else 语句经常与 test 命令结合使用

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
num1=$[2*3]
num2=$[1+5]
echo "num1: $num1"
echo "num2: $num2"
if test $[num1] -eq $[num2]
then
    echo '两个数字相等!'
else
    echo '两个数字不相等!'
fi
```

运行脚本输出结果

```sh
num1: 6
num2: 6
两个数字相等!
```

输出结果：

## for 循环

shell for 循环可用于遍历列表中的值。

#### for 循环语法一般格式如下：

```sh
for var in item1 item2 ... itemN
do
    command1
    command2
    ...
done
```

或写成一行：

```sh
for var in item1 item2 ... itemN; do command1; command2 done;
```

当变量值在列表里，for 循环即执行一次所有命令，使用变量名获取列表中的当前取值。

命令可为任何有效的shell命令和语句。 in 列表可以包含替换、字符串和文件名。

> in 列表是可选的，如果不用它，for 循环使用命令行的位置参数

#### 范例: 使用 for 循环输出当前列表中的数字

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
for loop in 6 7 8 9 10
do
    echo "The value is: $loop"
done
```

输出结果：

```sh
$ sh demo.sh
The value is: 6
The value is: 7
The value is: 8
The value is: 9
The value is: 10
```

范例2: 顺序输出字符串中的字符

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
for str in '这是DDKK.COM 弟弟快看，程序员编程资料站网站: www.ddkk.com'
do
    echo $str
done
```

输出结果：

```sh
$ sh demo.sh
这是DDKK.COM 弟弟快看，程序员编程资料站网站: www.ddkk.com
```

## while 循环

while 循环用于不断地重复执行一系列命令。

while 也用于从输入文件中读取数据；命令通常为测试条件。

#### while 语法格式如下：

```sh
while condition
do
    command
done
```

#### 范例： 一个基本的 while 循环

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
i=1
while(( $i<=5 ))
do
    echo $i
    let "i++"
done
```

运行脚本输出结果

```sh
$ sh demo.sh
1
2
3
4
5
```

上面的范例一个基本的 while 循环，测试条件是：如果 i 小于等于 5，那么条件返回真。int从 0 开始，每次循环处理时，int 加 1。 运行范例会输出数字 1到 5，然后终止。

范例中使用中使用了 Bash let 命令，它用于执行一个或多个表达式，变量计算中不需要加上 `$` 来表示变量，let 命令更多细节可查阅： Bash let 命令 。

while循环 也可以用于读取键盘信息。

#### 范例: while 循环用于读取键盘输入

下面的范例中，输入信息被设置为变量 FILM，按 `` 结束循环

```sh
echo '按下 <CTRL-D> 退出'
echo '输入你最喜欢的网站名: '
while read FILM
do
    echo "是的！$FILM 是一个好网站"
done
```

运行脚本输出结果

```sh
$ sh demo.sh
按下 <CTRL-D> 退出
输入你最喜欢的网站名:
www.ddkk.com
是的！www.ddkk.com 是一个好网站
www.google.com
是的！www.google.com 是一个好网站
www.qq.com
是的！www.qq.com 是一个好网站
```

## 无限循环

使用while 语句 或 for 语句可以实现 **无限循环**。

无限循环 是指永远不会结束的循环。

#### 无限循环语法格式：

```sh
while :
do
    command
done
```

或者

```sh
while true
do
    command
done
```

或者

```sh
for (( ; ; ))
do
    command
done
```

#### 范例: 使用 while: 实现无限循环

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
i=0
while :
do 
    echo "i 的值是: ${i}"
    i=expr ${i} + 1
done
```

运行脚本输出结果

```sh
$ sh demo.sh 
i 的值是: 0
i 的值是: 1
i 的值是: 2
i 的值是: 3
i 的值是: 4
i 的值是: 5
i 的值是: 6
i 的值是: 7
i 的值是: 8
i 的值是: 9
i 的值是: 10
...
```

> 可以使用 CTRL + C 键结束脚本

## until 循环

until 循环先执行一系列命令直至条件为真时停止

#### until 语法格式:

```sh
until condition
do
    command
done
```

until 循环与 while 循环在处理方式上刚好相反：

while 先检测条件是否为真，再执行循环，而 util 则先执行循环，再检测条件。 util 循环至少会执行一次。

一般while 循环优于 until 循环，但在某些时候—也只是极少数情况下，until循环更加有用

until 循环条件可为任意测试条件，测试发生在循环末尾。

我们用一个范例来演示 until 循环

#### 范例 : until 循环

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
i=0
until [ $i -gt 5 ]
do 
    echo "i 的值是: ${i}"
    i=expr ${i} + 1
done
```

脚本执行结果:

```sh
$ sh demo.sh
i 的值是: 0
i 的值是: 1
i 的值是: 2
i 的值是: 3
i 的值是: 4
i 的值是: 5
```

> 注意： until 语句是先执行循环再判断条件，刚刚写范例的时候一不小心就陷入了死循环

## case 语句

Shell case 语句为多选择语句,它可以建立一种分支结构语句

可以用case 语句匹配一个值与一个模式，如果匹配成功，执行相匹配的命令。

#### case 语句格式如下：

```sh
case 值 in
模式1)
    command1
    command2
    ...
    commandN
    ;;
模式2）
    command1
    command2
    ...
    commandN
    ;;
esac
```

case 格式: **取值后面必须为单词 in，每一模式必须以右括号结束。取值可以为变量或常数。匹配发现取值符合某一模式后，其间所有命令开始执行直至 ;;**

case 将 **值** 与每个匹配模式一一检测。一旦模式匹配，则执行完匹配模式相应命令后不再继续其他模式。如果无一匹配模式，可以使用星号 * 捕获该值，再执行后面的命令

我们使用一个范例来演示 case 语句的作用:

下面的脚本提示输入1到4，与每一种模式进行匹配：

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
echo '输入 1 到 4 之间的数字:'
echo '你输入的数字为:'
read aNum
case $aNum in
    1)  echo '你选择了 1'
    ;;
    2)  echo '你选择了 2'
    ;;
    3)  echo '你选择了 3'
    ;;
    4)  echo '你选择了 4'
    ;;
    *)  echo '你没有输入 1 到 4 之间的数字'
    ;;
esac
```

输入不同的内容，会有不同的结果，例如：

```sh
$ sh demo.sh
输入 1 到 4 之间的数字:
你输入的数字为:
2
你选择了 2
```

## 跳出循环

开始循环后，有时候需要在未达到循环结束条件时强制跳出循环。 shell 跟其它语言类似，提供了 break 和 continue 两个关键字来跳出当前循环。

### break 命令

使用break 命令可以跳出所有循环

我们用一个范例来解释 break 的这种作用

#### 范例: 使用 break 跳出所有循环

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
while :
do
    echo -n "输入 6 到 10 之间的数字:"
    read aNum
    case $aNum in
        6|7|8|9|10) echo "你输入的数字为 $aNum!"
        ;;
        *) echo "你输入的数字不是 6 到 10 之间的! 游戏结束"
            break
        ;;
    esac
done
```

执行以上代码，输出结果为：

```sh
$ sh demo.sh
-n 输入 6 到 10 之间的数字:
6
你输入的数字为 6!
-n 输入 6 到 10 之间的数字:
10
你输入的数字为 10!
-n 输入 6 到 10 之间的数字:
3
你输入的数字不是 6 到 10 之间的! 游戏结束
```

上面的范例中，脚本会进入死循环直至用户输入数字大于 10 或者小于 6。

要跳出这个循环，返回到 shell 提示符下，需要使用 break 命令

### continue 命令

continue 命令能够跳出当前循环，继续下一次循环。

continue 命令与 break 的唯一区别就是，它不会跳出所有循环，仅仅跳出当前循环

#### 范例: 使用 continue 跳出当前循环

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
while :
do
    echo -n "输入 1 到 5 之间的数字(9 游戏结束): "
    read aNum
    case $aNum in
        1|2|3|4|5) echo "你输入的数字为 $aNum!"
        ;;
        9) break
        *) echo "你输入的数字不是 1 到 5 之间的!"
            continue
            echo "游戏结束"
        ;;
    esac
done
```

使用sh demo.sh 执行脚本输出如下

```sh
$ sh demo.sh
输入 1 到 5 之间的数字(9 游戏结束):
8
你输入的数字不是 1 到 5 之间的!
输入 1 到 5 之间的数字(9 游戏结束):
1
你输入的数字为 1!
输入 1 到 5 之间的数字(9 游戏结束):
9
```

我们运行代码发现，当输入大于5的数字(输入8的时候)时，该例中的循环不会结束，语句 **echo "游戏结束!"**永远不会被执行。

## esac 命令

esac 命令用作 case 语句的结束标志。

Shell 中 case 的语法和其它语言相差好大，它需要 一个 esca（就是case反过来）作为结束标志。

用右圆括号 ) 表示每个 case 分支

用两个分号表示 break
