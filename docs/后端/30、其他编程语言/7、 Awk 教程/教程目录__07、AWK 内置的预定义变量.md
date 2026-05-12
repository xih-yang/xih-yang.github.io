# 07、AWK 内置的预定义变量
- 来源：https://ddkk.com/zhuanlan/other/awk/7.html
- 分类：Awk 教程
- 分组：教程目录
经过前面章节的学习，如果你和我一样好奇心严重，那么在使用了 `$` 0 `$` 1 `$` 2 ... 等等变量之后，一定会想 AWK 还有多少内置的预定义变量可以使用。

虽然其它的变量使用场景不多，但预定义变量可真不少，不过不需要着急，因为我们可以使用 --dump-variables[=file] 来输出它们

### --dump-variables[=file] 选项

> Mac OS 系统默认的 awk 不支持该选项

--dump-variables[=file] 用于显示/导出按字母顺序排序的，当前已经定义的所有全局变量

如果不指定 [=file] ，那么默认的导出文件为 awkvars.out

```sh
[www.ddkk.com]$ awk --dump-variables ''
[www.ddkk.com]$ cat awkvars.out
```

运行上面的命令，输出结果如下

```sh
ARGC: number (1)
ARGIND: number (0)
ARGV: array, 1 elements
BINMODE: number (0)
CONVFMT: string ("%.6g")
ERRNO: number (0)
FIELDWIDTHS: string ("")
FILENAME: string ("")
FNR: number (0)
FS: string (" ")
IGNORECASE: number (0)
LINT: number (0)
NF: number (0)
NR: number (0)
OFMT: string ("%.6g")
OFS: string (" ")
ORS: string ("\n")
RLENGTH: number (0)
RS: string ("\n")
RSTART: number (0)
RT: string ("")
SUBSEP: string ("\034")
TEXTDOMAIN: string ("messages")
```

我们把上面的输出结果整理如下

变量
数据类型
默认值

ARGC
number
1

ARGIND
number
0

ARGV
array
1 elements

BINMODE
number
0

CONVFMT
string
"%.6g"

ERRNO
number
0

FIELDWIDTHS
string
""

FILENAME
string
""

FNR
number
0

FS
string
" "

IGNORECASE
number
0

LINT
number
0

NF
number
0

NR
number
0

OFMT
string
"%.6g"

OFS
string
" "

ORS
string
"\n"

RLENGTH
number
0

RS
string
"\n"

RSTART
number
0

RT
string
""

SUBSEP
string
"\034"

TEXTDOMAIN
string
"messages"

上面列出的这些变量，在 AWK 中扮演整重要的作用。本章节，我们就一一介绍它们。

### ARGC

变量ARGC 用于表示运行 awk 命令时传递了多少个参数

需要注意的是，参数数量不包括 AWK 语句本身，也就是不包括单引号引起来的内容。

```sh
[www.ddkk.com]$ awk 'BEGIN {print "Arguments =", ARGC}' One Two Three Four
```

运行上面的命令，输出结果如下

```sh
Arguments = 5
```

你是不是很好奇，从某些方面说，我们传递的参数，要么是 6 个，要么是 4 个，可为什么偏偏是 5 个呢？

想知道结果，请继续往下阅读 ARGV 变量

### ARGV

变量ARGV 是一个数组，按照顺序保存了运行 awk 命令时传递的所有参数。

因为数组的下标从 0 开始，因此数组的的范围为 0 ～ ARGV - 1

```sh
[www.ddkk.com]$ awk 'BEGIN { 
   for (i = 0; i < ARGC - 1; ++i) { 
      printf "ARGV[%d] = %s\n", i, ARGV[i] 
   } 
}' one two three four
```

运行上面的命令，输出结果如下

```sh
ARGV[0] = awk
ARGV[1] = one
ARGV[2] = two
ARGV[3] = three
```

从结果中可以看出，竟然省略了 AWK 的代码，因此，上面那个问题就引刃而解了。

### CONVFMT

变量CONVFMT 用于指示 AWK 处理程序中的数字的转换格式，它的默认值为 %.6g，也就是最多保留 6 位有效数字

```sh
[www.ddkk.com]$ awk 'BEGIN { print "数字转换格式为 =", CONVFMT }'
```

运行上面的命令，输出结果为

```sh
数字转换格式为 = %.6g
```

### ENVIRON

变量ENVIRON 是一个关联数组，也就是一个哈希表，以键值对的方式保存了运行 AWK 时的环境变量

```sh
[www.ddkk.com]$ awk 'BEGIN { print ENVIRON["USER"] }'
```

运行上面的命令，输出结果如下

```sh
penglei
```

如果你想查看系统设置了哪些环境变量，可以直接在终端里输入 env 命令

### FILENAME

变量FILENAME 保存了当前正在处理的数据文件名。

不过需要注意的是，在 BEGIN 语句中 FILENAME 变量还处于未定义状态，也就是空字符串.

```sh
[www.ddkk.com]$ awk 'END {print FILENAME}' employee.txt
```

运行上面的命令，输出结果为

```sh
employee.txt
```

### FS

变量FS 存储了将每一行分割为字段/列时的分割符号。默认的分割符为 **空格** ( ' ' )。

如果需要改变默认的分割符，可以使用 -F 命令行选项。

> FS 是 Field Separator 的缩写。

```sh
[www.ddkk.com]$ awk 'BEGIN {print "FS = #" FS "#"}' | cat -vte
```

运行以上代码，输出结果如下

**Output**

```sh
FS = # #$
```

从输出结果中可以看到，两个 # 号之间，有一个空格，这个就是字段分割符。

### NF

变量NF 是 Number of Fields 的缩写，用于表示当前行到底分割出来了多少字段/列。

下面的命令输出了当前每一行有被分割出了多少个字段

```sh
[www.ddkk.com]$ echo -e "一 二\n一 二 三\n一 二 三 四" | awk '{print $0 "\t",NF}'
```

运行上面的命令，输出结果如下

```sh
一 二  2
一 二 三    3
一 二 三 四  4
```

变量NF 还可以用于条件判断，例如下面的命令输出了哪些字段/列大于 2 的行

```sh
[www.ddkk.com]$ echo -e "一 二\n一 二 三\n一 二 三 四" | awk 'NF > 2'
```

运行上面的命令，输出结果如下

```sh
一 二 三
一 二 三 四
```

### NR

变量NR 是 Number of Record 的缩写，用于表示当前行的行编号，也就是已经处理了多少行。

需要注意的是，行编号以 1 开始。

下面的代码，用于在每一行数据的前面输出当前的行号

```sh
[www.ddkk.com]$ echo -e "一 二\n一 二 三\n一 二 三 四" | awk '{print NR". " $0}'
```

运行上面的命令，输出结果如下

```sh
1. 一 二
2. 一 二 三
3. 一 二 三 四
```

变量NR 还可以用于条件判断，例如下面的命令用于输出行号小于 3 的行，也就是第一第二行。

```sh
[www.ddkk.com]$ echo -e "一 二\n一 二 三\n一 二 三 四" |  awk 'NR < 3'
```

运行上面的命令，输出结果如下

```sh
一 二
一 二 三
```

### FNR

变量FNR 是 File Number of Record 的缩写，用于表示在当前处理文件中当前行的行编号，也就是当前文件已经处理了多少行。

当我们需要处理多个文件时，这个变量是非常有用的。而且该值会处理每个新文件时重置

需要注意的是，行编号以 1 开始。

下面的代码，用于在每一行数据的前面输出当前的行号

```sh
[www.ddkk.com]$ awk '{print NR". " FNR". " $0}' employee.txt employee.txt
```

运行上面的命令，输出结果如下

```sh
1. 1. 1)  张三  技术部  23
2. 2. 2)  李四  人力部  22
3. 3. 3)  王五  行政部  23
4. 4. 4)  赵六  技术部  24
5. 5. 5)  朱七  客服部  23
6. 1. 1)  张三  技术部  23
7. 2. 2)  李四  人力部  22
8. 3. 3)  王五  行政部  23
9. 4. 4)  赵六  技术部  24
10. 5. 5)  朱七  客服部  23
```

变量FNR 还可以用于条件判断，例如下面的命令用于输出行号小于 3 的行，也就是第一第二行。

```sh
[www.ddkk.com]$ awk 'FNR < 3' employee.txt employee.txt
```

运行上面的命令，输出结果如下

```sh
1)  张三  技术部  23
2)  李四  人力部  22
1)  张三  技术部  23
2)  李四  人力部  22
```

### OFMT

变量OFMT 用于表示输出数字时如何格式化数字。它的默认值为 %.6g

```sh
[www.ddkk.com]$ awk 'BEGIN {print "OFMT = " OFMT}'
```

运行以上命令，输出结果如下

```sh
OFMT = %.6g
```

### OFS

变量OFS 用于表示输出字段的分隔符，默认的值是一个空格 ( ' ' )

这个变量指示了 print 函数由多个值的时候，每个值之间如何分隔。

下面的命令用于显示当前的输出分隔符

```sh
[www.ddkk.com]$ awk 'BEGIN {print "OFS =#" OFS "#"}' | cat -vte
```

运行结果如下

```sh
OFS =# #$
```

大家注意到两个 # 之间的空白没有，这就是 OFS 的值。

### ORS

变量ORS 用于表示输出多行时的分隔符，默认的值是新行 ( \n )

下面的命令用于显示当前的多行输出分隔符

```sh
[www.ddkk.com]$ awk 'BEGIN {print "ORS = " ORS}' | cat -vte
```

运行结果如下

```sh
ORS = $
$
```

### RLENGTH

变量RLENGTH 用于表示模式匹配中匹配到的字符串的长度。

```sh
[www.ddkk.com]$ awk 'BEGIN { if (match("One Two Three", "re")) { print RLENGTH } }'
```

运行上面的命令，输出结果如下

```sh
2
```

### RS

变量RS 用于指示当前 AWK 程序使用什么作为分割符分割每一行的。默认情况下，RS 的值为换行符 \n

```sh
[www.ddkk.com]$ awk 'BEGIN {print "RS = " RS}' | cat -vte
```

运行上面的命令，输出结果如下

```sh
RS = $
$
```

### RSTART

变量RSTART 用于表示模式匹配中第一个匹配到的字符串的位置。

```sh
[www.ddkk.com]$ awk 'BEGIN { if (match("张三 李四 王五", "李四")) { print RSTART } }'
```

运行上面的命令，输出结果如下

```sh
4
```

### SUBSEP

变量SUBSEP 用于表示数组下标的分隔符，其默认值为 \034。

```sh
[www.ddkk.com]$ awk 'BEGIN { print "SUBSEP = " SUBSEP }' | cat -vte
```

运行上面的命令，输出结果如下

```sh
SUBSEP = ^\$
```

### $ 0

变量 `$` 0 表示当前正在处理的行。

因此下面的命令用于输出文件中的所有文本

```sh
[www.ddkk.com]$ awk '{print $0}' employee.txt
```

运行上面的命令，输出结果如下

```sh
1)  张三  技术部  23
2)  李四  人力部  22
3)  王五  行政部  23
4)  赵六  技术部  24
5)  朱七  客服部  23
```

### $ n

变量 `$` n 用于记录当前行中的第 nth>` 个字段，其中每个字段由变量 FS 的值来指定。

因此， `$` 1 表示第一列/字段， `$` 2 表示第二列/字段，依此类推。

下面的命令，用于输出每一行的第 4 列和第 1 列。

```sh
[www.ddkk.com]$ awk '{print $4 "\t" $1}' employee.txt
```

运行上面的命令，输出结果如下

```sh
23  1)
22  2)
23  3)
24  4)
23  5)
```

## GNU AWK 独有的变量

除了上面列出的 AWK 变量之外，GNU AWK 还有一些特殊的变量

### ARGIND

变量ARGIND 用于指示当前处理的文件在 ARGV 中的索引。

我们先使用下面的命令创建三个文件

```sh
[www.ddkk.com]$ cp employee.txt employee1.txt
[www.ddkk.com]$ cp employee.txt employee2.txt
[www.ddkk.com]$ cp employee.txt employee3.txt
```

然后运行下面的命令

```sh
[www.ddkk.com]$ awk '{print "ARGIND   = ", ARGIND; print "Filename = ", ARGV[ARGIND]}' employee1.txt employee2.txt employee3.txt
```

运行上面的命令，输出结果如下

```sh
ARGIND   =  1
Filename =  employee1.txt
ARGIND   =  1
Filename =  employee1.txt
ARGIND   =  1
Filename =  employee1.txt
ARGIND   =  1
Filename =  employee1.txt
ARGIND   =  1
Filename =  employee1.txt
ARGIND   =  2
Filename =  employee2.txt
ARGIND   =  2
Filename =  employee2.txt
ARGIND   =  2
Filename =  employee2.txt
ARGIND   =  2
Filename =  employee2.txt
ARGIND   =  2
Filename =  employee2.txt
ARGIND   =  3
Filename =  employee3.txt
ARGIND   =  3
Filename =  employee3.txt
ARGIND   =  3
Filename =  employee3.txt
ARGIND   =  3
Filename =  employee3.txt
ARGIND   =  3
Filename =  employee3.txt
```

### BINMODE

变量BINMODE 用于在非 POSIX 系统上设置所有的文件 I/O 是否使用二进制模式。

变量BINMODE 的取值一般为 1、2、3。1 表示输入文件，2 表示输出文件， 3 则表示所有文件。

变量BINMODE 的取值还可以是 **r** or **w** ，分别表示输入文件和输出文件都应该使用二进制模式。

变量BINMODE 的取值还可以是 **rw** 或 **wr** 表示所有的文件都应该使用二进制模式

### ERRNO

变量ERRNO 是一个字符串类型，当 getline 函数或者 close 函数出错时会设置该值为错误信息。

我们可以直接输出 ERRNO 来检查 AWK 程序出了哪些错误

```sh
[www.ddkk.com]$ awk 'BEGIN { ret = getline < "junk.txt"; if (ret == -1) print "Error:", ERRNO }'
```

运行上面的命令，输出结果如下

```sh
Error: 没有那个文件或目录
```

### FIELDWIDTHS

变量FIELDWIDTHS 用于设置分割字符串时是否使用固定的 **空格**，默认情况下，AWK 分割字符串时使用的是 FS 变量的值

一旦设置了变量 FIELDWIDTHS，那么 GAWK 程序就会以固定的空格长度来分割每一行。

### IGNORECASE

变量IGNORECASE 用于设置模式是否大小写敏感。

默认情况下，这个变量的值为 0 也就是大小写不敏感，一旦我们设置为 1，那么模式匹配就是大小写敏感的。

也就是说 /a/ 和 /A/ 是两个不同的结果。

```sh
[www.ddkk.com]$ awk 'BEGIN{IGNORECASE = 1} /a/' employee.txt
```

运行上面的代码，输出结果如下

```sh

```

> 因为我们准备的文本没有英文....

### LINT

LINT 变量提供了对 GAWK 程序选项 --lint 的动态读取和设置。

设置此变量后，GAWK 会打印 lint 警告

如果将值设置为 fatal ，那么 lint 警告会成为 fatal 错误，就像设置了选项 --lint = fatal 一样

```sh
[www.ddkk.com]$ awk 'BEGIN {LINT = 1; a}'
```

运行上面的命令，输出结果如下

```sh
awk: 警告: 表达式无任何作用
awk: 警告: 引用未初始化的变量“a”
```

### PROCINFO 变量

PROCINFO 变量是一个关联数组，也就是一个哈希表，以键值对的方式保存着 AWK 进程的相关信息，例如真实有效的 UID 号，进程 ID 号等等。

```sh
[www.ddkk.com]$ awk 'BEGIN { print PROCINFO["pid"] }'
```

上面的命令，在 Linux 系统上输出如下

```sh
15197
```

而在Mac OS 系统上，则是一个空的字符串

```sh

```

### TEXTDOMAIN 变量

TEXTDOMAIN 变量指定了当前 AWK 应用程序的文本域 ( text domain )。

文本域主要用于它查找程序字符串的本地化翻译。

TEXTDOMAIN 变量的使用语法一般如下，基本上只有输出的作用

```sh
[www.ddkk.com]$ awk 'BEGIN { print TEXTDOMAIN }'
```

上面的命令，在 Linux 系统上输出如下

```sh
messages
```

由于我们设置的是 en_US 语言环境，因此输出的结果是英文文本

而在Mac OS 系统上，则是一个空的字符串

```sh

```
