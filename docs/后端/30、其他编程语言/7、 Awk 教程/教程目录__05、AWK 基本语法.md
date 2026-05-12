# 05、AWK 基本语法
- 来源：https://ddkk.com/zhuanlan/other/awk/5.html
- 分类：Awk 教程
- 分组：教程目录
AWK是极其简单的，你觉得难，那是因为不懂它的工作流程和语法。

> 对于大多数人来说，难的原因是不常用，语法又难记，哈哈。

AWK程序有两种运行方式：

**1、** 一种就是像上一章节那样直接在终端（shell）中使用；

**2、** AWK的另一种使用方式，就是可以和Shell脚本，写在一个文本文件里，然后运行这个文本文件不过这种方式不多见；

## AWK 命令行使用

AWK最常见的使用方式就是在终端里直接输入 AWK 脚本。

```sh
awk [options] file ...
```

在命令行里直接使用，我们需要讲 AWK 代码使用 单引号 ( '' ) 引起来。

比如

```sh
[www.ddkk.com]$ awk '{print}' employee.txt
```

### 范例

假设我们有一个雇员文件 employee.txt，在这个雇员文件里，每一个雇员一行，内容如下

```sh
1)  张三  技术部  23
2)  李四  人力部  22
3)  王五  行政部  23
4)  赵六  技术部  24
5)  朱七  客服部  23
```

要显示文件的内容，我们可以使用 cat employee.txt 命令

```sh
[www.ddkk.com]$ cat employee.txt
1)  张三  技术部  23
2)  李四  人力部  22
3)  王五  行政部  23
4)  赵六  技术部  24
5)  朱七  客服部  23
```

当然了，我们使用 AWK 同样也能实现同样的效果，命令如下

```sh
[www.ddkk.com]$ awk '{print}' employee.txt
```

## AWK 程序文件

如果AWK 代码太多，我们也可以把 AWK 代码写在一个 .awk 的文本文件里，然后通过 -f 选项指定 awk 命令使用该 AWK 脚本文件

```sh
awk [options] -f file ....
```

为了方便演示，我们拿上面的 AWK 命令行程序来做范例，我们可以在当前目录下新建一个文件叫做 command.awk，然后在 command.awk 里输入以下内容

```sh
{print}
```

> 其实就是把单引号 （''） 之间的内容放入 command.awk 文件中。

最后，我们就可以通过下面的命令来运行这个 command.awk 文件

```sh
[www.ddkk.com]$ awk -f command.awk employee.txt
```

运行上面这段代码，我们可以看到输出的结果和上面一模一样

```sh
[www.ddkk.com]$ awk -f command.awk employee.txt
1)  张三  技术部  23
2)  李四  人力部  22
3)  王五  行政部  23
4)  赵六  技术部  24
5)  朱七  客服部  23
```

## AWK 标准选项

命令行程序 awk 命令支持一些标准的选项，我们可以使用这些选项定制 awk 程序。

下面，我们就来罗列一些常见的选项

### -v 选项

-v 选项用于预定义一些变量。这些预定义变量会在执行具体的 AWK 程序之前就定义好，准确的说，在 BEGIN 语句之前就已经定义。已经可以在 BEGIN 语句中使用

下面的awk 命令行代码演示了 -v 选项的使用，它与定义了一个变量 site 并指定值为 www.ddkk.com

```sh
[www.ddkk.com]$ awk -v site=www.ddkk.com 'BEGIN{printf "Site = %s\n", site}'
```

运行上面的命令，输出结果如下

```sh
Site = www.ddkk.com
```

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

### --help 选项

> Mac OS 系统默认的 awk 不支持该选项

--help 选项用于输出 awk 命令的帮助信息

```sh
[www.ddkk.com]$ awk --help
```

运行上面的脚本，输出结果如下

```sh
用法: awk [POSIX 或 GNU 风格选项] -f 脚本文件 [--] 文件 ...
用法: awk [POSIX 或 GNU 风格选项] [--] '程序' 文件 ...
POSIX 选项:         GNU 长选项:
   -f 脚本文件     --file=脚本文件
   -F fs       --field-separator=fs
   -v var=val     --assign=var=val
   -m[fr] val
   -O       --optimize
   -W compat      --compat
   -W copyleft    --copyleft
   -W copyright      --copyright
   -W dump-variables[=file]   --dump-variables[=file]
   -W exec=file      --exec=file
   -W gen-po      --gen-po
   -W help        --help
   -W lint[=fatal]      --lint[=fatal]
   -W lint-old    --lint-old
   -W non-decimal-data  --non-decimal-data
   -W profile[=file] --profile[=file]
   -W posix    --posix
   -W re-interval    --re-interval
   -W source=program-text  --source=program-text
   -W traditional    --traditional
   -W usage    --usage
   -W use-lc-numeric --use-lc-numeric
   -W version     --version
提交错误报告请参考“gawk.info”中的“Bugs”页，它位于打印版本中的“Reporting
Problems and Bugs”一节
翻译错误请发信至 translation-team-zh-cn@lists.sourceforge.net
gawk 是一个模式扫描及处理语言。缺省情况下它从标准输入读入并写至标准输出。
范例:
   gawk '{ sum += $1 }; END { print sum }' file
   gawk -F: '{ print $1 }' /etc/passwd
```

### --lint[=fatal] 选项

> Mac OS 系统默认的 awk 不支持该选项

--lint 选项用于检查当前的 AWK 代码和当前的输入流，一般来说主要检查可疑的结构和不可移植的代码。

如果指定了 [=fatal]，那么会讲警告信息当作错误信息处理，也就是说遇到警告信息，程序也会自动终止。

例如下面的 awk 脚本，我们使用 /bin/ls 作为输入流，因为 /bin/ls 是一个二进制文件，因此使用 --Link的时候会报错

```sh
[www.ddkk.com]$ awk --lint '' /bin/ls
```

运行上面的文件，输出结果如下

```sh
awk: 警告: 命令行中程序体为空
awk: 警告: 源文件不以换行符结束
awk: 警告: 完全没有程序正文！
```

### --posix 选项

> Mac OS 系统默认的 awk 不支持该选项

--posix 选项用于开启严格的 POSIX 兼容性检查。

在严格的 POSIX 兼容性检查模式下，几乎会禁用所有常见的和 gawk-specific 中定义的扩展

### --profile[=file] 选项

> Mac OS 系统默认的 awk 不支持该选项

--profile[=file] 选项用于将当前的 awk 程序代码格式化并切输出到 file 文件中。

如果不传递 [=file]，那么默认的文件为当前目录下的 awkprof.out

例如下面的 awk 命令，我们使用 --profile 格式化我们的代码

```sh
[www.ddkk.com]$ awk --profile 'BEGIN{printf"---|Header|--\n"} {print} 
END{printf"---|Footer|---\n"}' employee.txt > /dev/null 
[www.ddkk.com]$ cat awkprof.out
```

运行上面的 awk 程序，输出结果如下

```sh
   # gawk 配置, 创建 Sat May 25 12:13:10 2019
   # BEGIN 块
   BEGIN {
      printf "---|Header|--\n"
   }
   # 规则
   {
      print $0
   }
   # END 块
   END {
      printf "---|Footer|---\n"
   }
```

### --traditional 选项

> Mac OS 系统默认的 awk 不支持该选项

--traditional 选项用于禁用所有 gawk-specific 扩展。

### --version 选项

--version 选项用于显示当前 awk 命令行程序的版本

```sh
[www.ddkk.com]$ awk --version
```

运行上面的命令，输入结果如下 (苹果电脑)

```sh
[www.ddkk.com]$ awk --version
awk version 20070501
```

其它Linux 系统，结果如下

```sh
GNU Awk 3.1.7
版权所有 © 1989, 1991-2009 自由软件基金会(FSF)。
该程序为自由软件，你可以在自由软件基金会发布的 GNU 通用公共许可证(GPL)第
3版或以后版本下修改或重新发布。
该程序之所以被发布是因为希望他能对你有所用处，但我们不作任何担保。这包含
但不限于任何商业适售性以及针对特定目的的适用性的担保。详情参见 GNU 通用公
共许可证(GPL)。
你应该收到程序附带的一份 GNU 通用公共许可证(GPL)。如果没有收到，请参看 http://www.gnu.org/licenses/ 
```
