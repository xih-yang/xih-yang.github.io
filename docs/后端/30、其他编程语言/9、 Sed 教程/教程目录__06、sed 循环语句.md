# 06、sed 循环语句
- 来源：https://ddkk.com/zhuanlan/other/sed/6.html
- 分类：Sed 教程
- 分组：教程目录
**循环** 其实就是一种重复，在满足指定的条件下，重复的做某些事情。就好比如只要时间没到 18:30，那么我们一直在重复的上班。

和其它语言一样，sed 也有循环语句，也有条件判断分支语句。

只是sed 的循环语句真的很反人类，难记又难懂。

本章节我们就来揭开着难记又难懂的语法。

sed中的循环语句没有 for 、loop、while 这些关键字，而是和 C 语言 语句有点像。

sed也有标签 （ label ） 这个概念，而且可以设置标签。

sed的循环，就是不断跳转到标签标记的行并继续执行其余命令来实现的。

sed语言使用 **冒号（:）** 来实现标签名。

sed中设置 **标签 （ label ）** 的语法如下：

```sh
:label 
:start 
:end 
:up
```

> 看到这种语法是不是很想打人，奇怪又难记。

定义了标签之后，如果要跳转到某个标签名，可以使用 t 命令。

t命令的语法格式为

```sh
t [label_name]
```

其中[label_name] 为要跳转到的标签名。这是一个可选项，如果忽略，那么 sed 会跳转到 sed 命令文件的末尾，也就是结束所有 sed 命令。

## sed 循环语句

sed中的循环语句的一般流程如下:

**1、** 先使用标签语法:``定义一个标签label；

**2、** 然后定义条件为真时要执行的语句，也就循环语句的代码；

**3、** 最后使用**``t**命令判断循环条件condition的真假，如果为真则跳转到刚刚定义的标签label处，为假则继续往下执行语句；

因此，一个简单的 sed 循环语句的语法格式如下

```sh
:label
some_code_here
/<pattern/t label
```

当然了，我们也可以对条件取反，也就是**条件测试不通过时才跳转**，这时候就要用到逻辑非运算符 ! 了，具体的语法格式如下

```sh
:label
some_code_here
/<pattern/!t label
```

### 范例

看了有点复杂啊，我们来写一个范例吧。不过呢，看了范例感觉更复杂...五味杂陈

我们下来看看我们要处理的数据文件，是当前目录下的一个叫 data.txt 的文件，内容如下

```sh
I am 
studing sed
I am 
www.ddkk.com
I am 
a no-work-men
I am 
so handsome
```

就是一些 **我是...** 的语句。

> 这时候，我想再说一次，我是傻逼，竟然学这么复杂的 sed 语言。

这个范例，我们需要做的就是把相邻的两行组合在一起，也就是把第一行和第二行组合在一起，第二行和第三行组合在一起...，然后把行中的换行符（\n）替换为 **冒号（:）** 。接着查找行中是否有 ddkk 字符串，如果有的话在行的开头追加四个 ---- 。如果没有则直接跳转到 Print 标签处直接输出。

这里我们并不是用条件判断来实现一次性追加四个 -----，而是使用循环语句，一次只追加一个 -。

要实现的效果如下

```sh
I am :studing sed
----I am :www.ddkk.com
I am :a no-work-men
I am :so handsome
```

这个效果，用文字描述真的很简单，可是，实现的代码却有点复杂了

```sh
[www.ddkk.com]$ sed -n ' 
h;n;H;x;
s/\n/:/ 
:Loop 
/ddkk/s/^/-/ 
/----/!t Loop 
p' data.txt
```

运行上面的 sed 程序，输出结果如下

```sh
I am :studing sed
----I am :www.ddkk.com
I am :a no-work-men
I am :so handsome
```

看到上面代码的第一眼，我怎么觉得所有字母都认识，但是放到一起就不认识了呢

- 第一行 h;n;H;x 语句用于把相邻的两行放到一起
- h 命令拷贝模板块的内容到内存中的缓冲区
- n 命令读取下一个输入行，用下一个命令处理新的行而不是第一个命令
- H 命令追加模板块的内容到内存中的缓冲区
- x 命令表示互换模板块中的文本和缓冲区中的文本
- 第二行 s/\n/, / 把模板块的文本中的 **换行符（\n）** 替换成 :。
- 第三行 :Loop 定义了一个标签 Loop。
- 第四行是模式查找和替换语句，首先 /ddkk/s 用于查找字符串 ddkk。如果找到则运行后面的语句 ^/-/ 就是在行的开头插入一个 -。
- 第五个命令是一个 **条件测试** 语句，如果没找到 ---- 则跳转到标签 Loop，如果找到则继续执行。
- 第六个命令，p 命令，想必你是知道的，是 **输出命令**。

上面的sed 程序，为了方便阅读，我们把每一个 sed 命令都放在了单独的一样。其实更多时候，我们会把它们放到一行上，多条 sed 命令之间使用 **分号（;）** 分隔。

就像下面这样

```sh
[www.ddkk.com]$ sed -n 'h;n;H;x; s/\n/, /; :Loop;/ddkk/s/^/-/; /----/!t Loop; p' data.txt
```

运行上面的 sed 程序，输出结果如下

```sh
I am : studing sed
- I am : www.ddkk.com
I am : a no-work-men
I am : so handsome
```

## 疑问？

对于上面这个循环程序，不知道你是不是有和我当初一样的疑问？

为什么不会陷入死循环?

面对组合后的第一行文本 I am :studing sed，显然是不满足替换的，也就不会在开始添加四个 ----，那么条件测试就一定不会通过，不会通过就会回到 Loop 然后一直死循环下去？

这个问题，我不知道要如何解释，我么把源程序改一下，改成

```sh
sed -n ' 
h;n;H;x;
s/\n/:/ 
:Loop
p
/ddkk/s/^/-/ 
/---------/!t Loop 
' data.txt
```

也就是说，我们只在循环里输出一次

输出结果如下

```sh
I am :studing sed
I am :studing sed
I am :www.ddkk.com
-I am :www.ddkk.com
--I am :www.ddkk.com
---I am :www.ddkk.com
----I am :www.ddkk.com
-----I am :www.ddkk.com
------I am :www.ddkk.com
-------I am :www.ddkk.com
--------I am :www.ddkk.com
I am :a no-work-men
I am :a no-work-men
I am :so handsome
I am :so handsom
```

大家看到什么结果了没有？

sed会统计 t 命令的失败次数，如果超过 2 次失败，则不会继续测试了....
