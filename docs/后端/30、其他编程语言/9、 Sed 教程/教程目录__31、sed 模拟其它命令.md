# 31、sed 模拟其它命令
- 来源：https://ddkk.com/zhuanlan/other/sed/31.html
- 分类：Sed 教程
- 分组：教程目录
本章节应该是 sed 实质性内容的最终章了。

sed是一个非常神奇的程序，或者说一门非常神奇的语言。能够以多种方式解决问题。

这种简而美的小程序解决问题的方式，是 Unix 哲学的一部分。也是我们日常开发中应该学习的地方。

除了sed 外，GNU Linux 还提供了其它非常多的使用小程序来解决各种问题，比如 cat 用于显示文件内容，比如 head 用于显示文件头部的内容，比如 tail 用于显示文件结尾的内容。

这些功能，如果使用 sed 重写或者模仿，那也是相对很简单的。

当然了，我们并不是为了解决什么重写什么，只是当作练习而已，练习如何使用 sed

## sed 模拟 cat 命令

cat 命令用于显示文件的内容，它的使用语法如下

```sh
cat [-benstuv] [file ...]
```

我们在当前目录下新建一个文件 data.txt，内容如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

然后使用 cat 命令显示文件 data.txt 的内容

```sh
[www.ddkk.com]$ cat data.txt
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

如果要使用 sed 来模拟它，非常简单，只要

```sh
[www.ddkk.com]$ sed '' data.txt
```

即可

输出结果如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

## sed 删除空行

如果要删除空行，可以使用 **删除命令（d）**

```sh
/^$/d
```

例如下面的范例

```sh
[www.ddkk.com]$ echo -e "DDKK.COM 弟弟快看，程序员编程资料站\n\n\nDDKK.COM 弟弟快看，程序员编程资料站" | sed '/^$/d'
```

运行结果如下

```sh
DDKK.COM 弟弟快看，程序员编程资料站
DDKK.COM 弟弟快看，程序员编程资料站
```

从结果中可以看出，所有的空行都已经被删除了。

## sed 过滤空行

如果要过滤空行，直接将空行不输出即可，命令如下

```sh
/^$/!p
```

例如下面的范例

```sh
[www.ddkk.com]$ echo -e "DDKK.COM 弟弟快看，程序员编程资料站\n\n\nDDKK.COM 弟弟快看，程序员编程资料站" | sed -n '/^$/!p'
```

运行结果如下

```sh
DDKK.COM 弟弟快看，程序员编程资料站
DDKK.COM 弟弟快看，程序员编程资料站
```

从结果中可以看出，所有的空行都已经被过滤掉了。

## sed 从指定的行开头删除指定的内容

如果从指定的行开头删除指定的内容，可以直接使用 **替换命令（s）** 。

```sh
s/^[要删除的内容]//g
```

假设当前目录下存在文件 data10.txt，内容如下

```sh
//include <iostream> 
using namespace std; 
int main(void) 
{ 
   // Displays message on stdout. 
   cout >> "Hello, World !!!" >> endl;  
   return 0; // Return success. 
}
```

我们想把第一行的注释去掉，也就是删掉 //

使用sed 来实现，则命令如下

```sh
[www.ddkk.com]$ sed 's|^//||g' data10.txt
```

运行结果如下

```sh
include <iostream> 
using namespace std; 
int main(void) 
{ 
   // Displays message on stdout. 
   cout >> "Hello, World !!!" >> endl;  
   return 0; // Return success. 
}
```

## sed 在指定的行开头插入指定的内容

如果要在指定的行开头插入指定的内容，可以直接使用 **替换命令（s）** 。

```sh
s/^/[要插入的内容]/
```

假设当前目录下存在文件 data9.txt，内容如下

```sh
!/bin/bash 
pwd 
hostname 
uname -a 
who 
who -r 
lsb_release -a
```

我们想把前 4 行注释掉，也就是在前 4 行的开头插入 #

使用sed 来实现，则命令如下

```sh
[www.ddkk.com]$ sed '1,4 s/^/#/' data9.txt
```

运行结果如下

```sh
#!/bin/bash 
#pwd 
#hostname 
#uname -a 
who 
who -r 
lsb_release -a
```

## wc -l 命令

wc 命令用于统计文件的总行数。

wc 命令的使用语法格式如下

```sh
wc [-clmw] [file ...]
```

我们在当前目录下新建一个文件 data.txt，内容如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

那么，使用 wc -l data.txt 则会输出文件的总行数

```sh
[www.ddkk.com]$ wc -l data.txt
   4 data.txt
```

如果要使用 sed 实现类似的统计文件行数的功能，那么命令如下

```sh
[www.ddkk.com]$ sed -n '$ =' data.txt
```

输出结果为

```sh
4
```

## head 命令

head 命令用于显示文件的前 n 行，嗯，默认是 10 行。

head 命令的语法格式如下

```sh
head [-n lines | -c bytes] [file ...]
```

我们在当前目录下新建一个文件 data.txt，内容如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

那么，使用 head -n 2 data.txt 命令就会显示文件的前两行

```sh
[www.ddkk.com] head -n 2 data.txt
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
```

如果要使用 sed 实现相同的功能，那么命令为

```sh
[www.ddkk.com]$ sed '2 q' data.txt
```

输出结果为

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
```

## tail -1 命令

tail -1 命令用于显示文件的最后一行。

我们在当前目录下新建一个文件 data.txt，内容如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

那么，使用 tail -1 data.txt 命令就会显示文件的最后一行

```sh
[www.ddkk.com] tail -1 data.txt
4) 小王,22岁,清华大学
```

这个命令如果使用 sed 来重写，那么就是

```sh
[www.ddkk.com] $ sed -n '$p' data.txt
```

运行结果如下

```sh
4) 小王,22岁,清华大学
```

## dos2unix 命令

在考古界 DOS 操作系统中，换行由 **回车（\r）** 和 **换行（\n）** 组合而成，俗称 CR/LF。

而Unix/Linux 操作系统中，换行只是简单的 **换行（\n）** 。

两者的不同，诞生了几个常用，曾经常用的命令，其中之一就是 dos2unix。

dos2unix 命令用于将 DOS 中的新行 **回车换行（\r\n）** 替换成 Unix 中的 **新行（\n）** 。

不管是**回车（\r）** 还是 **换行（\n）** ，它们都是不可见字符。但 Unix/Linux 的很多程序都可以显示这些不可见字符，其中 **回车（\r）** 使用 ^M 显示，而 **换行（\n）** 则使用 `$` 显示。

我们先在 data8.txt 中保存以下内容

```sh
ddkk.cn
www.ddkk.com
```

命令如下

```sh
[www.ddkk.com]$ echo -e "ddkk.cn\r\nwww.ddkk.com" > data8.txt
```

> 注意，一定要有那个 -e 不然 \r\n 就是四个字符了。

我们可以使用 file data8.txt 查看下文件的信息

```sh
[www.ddkk.com]$ file data8.txt
data8.txt: ASCII text, with CRLF, LF line terminators
```

如果要显示文件内容，那么可以使用 cat -A，因为这可以把所有不可见字符打印出来

```sh
[www.ddkk.com]$ cat -A data8.txt 
ddkk.cn^M$
www.ddkk.com$
```

^M 就是不可见字符 \r 。

如果使用 sed 重写，那么命令为

```sh
[www.ddkk.com]$ sed 's/^M$//'  data8.txt  > data8-1.txt 
```

> 注意 ^M 不是两个字符，而是 CTRL+V 和 CTRL+M 两个组合键生成的。
>
> 嗯，上面的命令，在苹果电脑自带的 cat 命令是无效的。

运行结果如下

```sh

```

我们使用 file 命令看看 data8-1.txt，输出结果如下

```sh
data8-1.txt: ASCII text
```

如果我们使用 cat -A 把所有不可见字符打印出来，那么结果就是

```sh
ddkk.cn$
www.ddkk.com$
```

## unix2dos 命令

unix2dos 命令和 doc2unix 命令类似，不过作用却是反过来的。

unix2dos 命令的作用就是把 UNIX 的新行 \n 换成 DOS 的新行 \r\n。

我们先在 data7.txt 中保存以下内容

```sh
ddkk.cn
www.ddkk.com
```

命令如下

```sh
[www.ddkk.com]$ echo -e "ddkk.cn\nwww.ddkk.com" > data7.txt
```

> 注意，一定要有那个 -e 不然 \n 就是两个字符了。

我们可以使用 file data7.txt 查看下文件的信息

```sh
[www.ddkk.com]$ file data7.txt
data7.txt: ASCII text
```

如果使用 sed 重写，那么命令为

```sh
[www.ddkk.com]$ sed 's/$/\r/' data7.txt  > data7-1.txt 
```

> 嗯，上面的命令，在苹果电脑自带的 cat 命令是无效的。

运行结果如下

```sh

```

我们使用 file 命令看看 data7-1.txt，输出结果如下

```sh
[www.ddkk.com]$ file data7-1.txt
data7-1.txt: ASCII text, with CRLF line terminators
```

如果我们使用 cat -A 把所有不可见字符打印出来，那么结果就是

```sh
[www.ddkk.com]$ cat -A data7-1.txt 
ddkk.cn^M$
www.ddkk.com^M$
```

^M 就是不可见字符 \r 。

## cat -E 命令

cat -E 命令会将在所有的换行符前面插入 **美元符号 `$` **。

我们先在 data6.txt 中保存以下内容

```sh
DDKK.COM 弟弟快看，程序员编程资料站\tDDKK.COM 弟弟快看，程序员编程资料站
www.ddkk.com
```

命令如下

```sh
[www.ddkk.com]$ echo -e "DDKK.COM 弟弟快看，程序员编程资料站\tDDKK.COM 弟弟快看，程序员编程资料站\nwww.ddkk.com" > data6.txt
```

> 注意，一定要有那个 -e 不然 \t 就是两个字符了。

我们可以使用 cat data6.txt 查看下文件的内容

```sh
[www.ddkk.com]$ cat data6.txt
DDKK.COM 弟弟快看，程序员编程资料站    DDKK.COM 弟弟快看，程序员编程资料站
www.ddkk.com
```

如果我们使用了 -E 选项，则可以明显的在行尾看到 `$`

```sh
[www.ddkk.com]$ cat -e data6.txt
DDKK.COM 弟弟快看，程序员编程资料站    DDKK.COM 弟弟快看，程序员编程资料站$
www.ddkk.com$
```

> 嗯，上面的命令，在苹果电脑自带的 cat 命令是无效的。

如果使用 sed 重写，那么命令为

```sh
[www.ddkk.com]$ sed 's|$|&$|' data6.txt
```

运行结果如下

```sh
DDKK.COM 弟弟快看，程序员编程资料站    DDKK.COM 弟弟快看，程序员编程资料站$
www.ddkk.com$
```

## cat -ET 命令

cat -ET 命令会将在所有的换行符前面插入 **美元符号 `$` **，并把所有的制表符 \t 替换为 ^I。

我们先在 data6.txt 中保存以下内容

```sh
DDKK.COM 弟弟快看，程序员编程资料站\tDDKK.COM 弟弟快看，程序员编程资料站
www.ddkk.com
```

命令如下

```sh
[www.ddkk.com]$ echo -e "DDKK.COM 弟弟快看，程序员编程资料站\tDDKK.COM 弟弟快看，程序员编程资料站\nwww.ddkk.com" > data6.txt
```

> 注意，一定要有那个 -e 不然 \t 就是两个字符了。

我们可以使用 cat data6.txt 查看下文件的内容

```sh
[www.ddkk.com]$ cat data6.txt
DDKK.COM 弟弟快看，程序员编程资料站    DDKK.COM 弟弟快看，程序员编程资料站
www.ddkk.com
```

如果要区分是空格还是制表符，可以使用 -ET 选项

```sh
[www.ddkk.com]$ cat -ET data6.txt
DDKK.COM 弟弟快看，程序员编程资料站^IDDKK.COM 弟弟快看，程序员编程资料站$
www.ddkk.com$
```

> 嗯，上面的命令，在苹果电脑自带的 cat 命令是无效的。

如果使用 sed 重写，那么命令为

```sh
[www.ddkk.com]$ sed -n 'l' data6.txt | sed 'y/\\t/^I/'
```

运行结果如下

```sh
DDKK.COM 弟弟快看，程序员编程资料站^IDDKK.COM 弟弟快看，程序员编程资料站$
www.Iwle.cn$
```

## nl 命令

nl 命令用于将文件中的所有行进行编号。

例如使用 nl data.txt 输出的内容如下

```sh
[www.ddkk.com]$ nl data.txt
     1  1) 小明,23岁,北京大学
     2  2) 小红,22岁,清华大学
     3  3) 小李,25岁,斯坦福大学
     4  4) 小王,22岁,清华大学
```

如果使用 sed 来重写 nl，那么命令为

```sh
[www.ddkk.com]$ sed = data.txt | sed 'N;s/\n/\t/'
```

输出结果如下

```sh
1   1) 小明,23岁,北京大学
2   2) 小红,22岁,清华大学
3   3) 小李,25岁,斯坦福大学
4   4) 小王,22岁,清华大学
```

> 嗯，上面的命令苹果电脑自带的 sed 是不支持的。

## cp 命令

cp 命令用于制作文件的副本。例如我们可以使用 cp 命令制作 data.txt 的一个副本 data5.txt。

```sh
[www.ddkk.com]$ cp data.txt data5.txt
```

然后我们可以使用 diff 命令查看下 data5.txt 和 data.txt 文件的不同

```sh
[www.ddkk.com]$ diff data5.txt data.txt
```

输出结果如下

```sh

```

我们可以使用 echo `$` ? 查看下有几行不一样

```sh
[www.ddkk.com] echo $?
0
```

简直一模一样有没有。

接下来我们使用 sed 来重写 cp 命令

```sh
[www.ddkk.com]$ sed -n 'w data5-1.txt' data.txt
```

然后我们可以使用 diff 命令查看下 data5-1.txt 和 data.txt 文件的不同

```sh
[www.ddkk.com]$ diff data5-1.txt data.txt
```

输出结果如下

```sh

```

我们可以使用 echo `$` ? 查看下有几行不一样

```sh
[www.ddkk.com] echo $?
0
```

## expand 命令

expand 命令用于将 **制表符（\t）** 转换为 **空格（）** 。

> 制表符（\t）就是键盘 Q 键左边那个键生成的。

我们先在 data4.txt 中保存以下内容

```sh
DDKK.COM 弟弟快看，程序员编程资料站\tDDKK.COM 弟弟快看，程序员编程资料站
```

命令如下

```sh
[www.ddkk.com]$ echo -e "DDKK.COM 弟弟快看，程序员编程资料站\tDDKK.COM 弟弟快看，程序员编程资料站" > data4.txt
```

> 注意，一定要有那个 -e 不然 \t 就是两个字符了。

我们可以使用 cat data4.txt 查看下文件的内容

```sh
[www.ddkk.com]$ cat data4.txt
DDKK.COM 弟弟快看，程序员编程资料站    DDKK.COM 弟弟快看，程序员编程资料站
```

接下来我们使用 expand 命令将内容中的所有制表符都替换成了空格符

```sh
[www.ddkk.com]$ expand data4.txt > data4-1.txt
```

然后我们使用 diff 命令查看两个文件 data4.txt 和 data4-1.txt 的内容

```sh
[www.ddkk.com]$ diff data4.txt data4-1.txt
```

输出结果如下

```sh
1c1
< DDKK.COM 弟弟快看，程序员编程资料站  DDKK.COM 弟弟快看，程序员编程资料站
---
> DDKK.COM 弟弟快看，程序员编程资料站        DDKK.COM 弟弟快看，程序员编程资料站
```

> 哦，对了，忘记说了，expand 命令默认会把一个 \t 转换为 4/8 个空格
>
> 具体的空格数量取决于你电脑上的配置
>
> 不信的话你可以打开 data4-1.txt 文件数一数空格的数量

如果使用 sed 命令来重新实现，则命令为

```sh
[www.ddkk.com]$ sed 's/\t/        /g' data4.txt > data4-2.txt
```

> 注意： 苹果电脑自带的 sed 不支持该命令

然后我们可以使用 diff 命令查看下 data4-1.txt 和 data4-2.txt 文件的不同

```sh
[www.ddkk.com]$ diff data4-1.txt data4-2.txt
```

输出结果如下

```sh

```

我们可以使用 echo `$` ? 查看下有几行不一样

```sh
[www.ddkk.com] echo $?
0
```

## tee 命令

tee 命令可以将内容输出到文件的同时输出到标准输出。也就是可以实现同时输出到文件和标准输出。

例如下面的 tee 命令，把 **DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站** 输出到文件 data3.txt 的同时还会输出到控制台

```sh
[www.ddkk.com]$ echo -e "DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站" | tee data3.txt
```

运行结果如下

```sh
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

同时打开 data3.txt 可以看到内容如下

```sh
[www.ddkk.com]$ cat data3.txt
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

如果使用 sed 来实现，可以直接使用 w 命令

```sh
[www.ddkk.com]$ echo -e "DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站" | sed -n 'p; w data3.txt'
```

对了，运行命令前我们先需要删除 data3.txt，不然不知道是谁创建的，哈哈。

```sh
[www.ddkk.com]$ rm data3.txt
```

然后运行刚刚的命令，输出结果如下

```sh
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

同时打开 data3.txt 可以看到内容如下

```sh
[www.ddkk.com]$ cat data3.txt
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

## cat -s 命令

cat -s 命令用于将多个连续的空行折叠为一个空行并输出。

我们现在当前目录下新建一个文件 data2.txt，内容如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

我们使用 cat -s 命令输出文件 data2.txt 的内容

```sh
[www.ddkk.com]$ cat -s data2.txt
```

输出结果如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大
```

从输出结果中可以可以看到，多个空行只会输出一个空行

如果使用 sed 来实现，那么就有点复杂了

```sh
[www.ddkk.com]$ sed '1s/^$//p;/./,/^$/!d' data2.txt
```

运行结果如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

## grep 命令

默认情况下，grep 命令会在匹配成功时输出 **匹配成功的行**。

grep 命令的使用语法如下

```sh
grep [-abcDEFGHhIiJLlmnOoqRSsUVvwxZ] [-A num] [-B num] [-C[num]]
    [-e pattern] [-f file] [--binary-files=value] [--color=when]
    [--context[=num]] [--directories=action] [--label] [--line-buffered]
    [--null] [pattern] [file ...]
```

我们现在当前目录下新建一个文件 data.txt，内容如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

当我们使用 grep -v 匹配 小明 时的结果如下

```sh
[www.ddkk.com]$ grep "小明" data.txt
```

输出结果如下

```sh
1) 小明,23岁,北京大学
```

如果使用 sed 来实现，可以在匹配成功后直接使用 p 命令输出

```sh
[www.ddkk.com]$ sed -n '/小明/p' data.txt
```

运行结果如下

```sh
1) 小明,23岁,北京大学
```

## grep -v 命令

默认情况下，grep -v 命令会在匹配失败的时候输出 **匹配失败的行**。

我们现在当前目录下新建一个文件 data.txt，内容如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

当我们使用 grep -v 匹配 小明 时的结果如下

```sh
[www.ddkk.com]$ grep -v "小明" data.txt
```

输出结果如下

```sh
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

如果使用 sed 来实现，那么要用到 ! 运算符，在匹配失败的时候使用 p 命令输出

```sh
[www.ddkk.com]$ sed -n '/小明/!p' data.txt
```

运行结果如下

```sh
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
```

## tr 命令

tr 命令用于转换字符。

tr 命令的语法如下

```sh
tr [-Ccsu] string1 string2
tr [-Ccsu] string1 string2
tr [-Ccu] -d string1
tr [-Ccu] -s string1
tr [-Ccu] -ds string1 string2
```

tr 命令的转换是一个一个字母对应转换的。因此两个字符串 string 和 string2 的字符数最好要想等

例如将字母 ABC 转换为 def 的命令如下

```sh
[www.ddkk.com]$ echo "ABC" | tr "ABC" "def"
```

输出结果为

```sh
def
```

如果使用 sed 来实现，那么就要使用 y 命令

```sh
[www.ddkk.com]$ echo "ABC" | sed 'y/ABC/def/'
```

输出结果如下

```sh
def
```
