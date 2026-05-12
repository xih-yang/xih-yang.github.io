# 05、sed 基本语法
- 来源：https://ddkk.com/zhuanlan/other/sed/5.html
- 分类：Sed 教程
- 分组：教程目录
sed是极其简单的，你觉得难，那是因为不懂它的工作流程和语法。

> 对于大多数人来说，难的原因是不常用，语法又难记，哈哈。

### sed 程序有两种运行方式：

- 一种就是像上一章节那样直接在终端（ shell ）中使用。
- sed 的另一种使用方式，就是可以和 Shell 脚本，写在一个文本文件里，然后运行这个文本文件。不过这种方式不多见

### sed 命令行使用

AWK最常见的使用方式就是在终端里直接输入 sed 脚本。

```sh
sed [-n] [-e] 'command(s)' files
```

在命令行里直接使用，我们需要将 sed 命令使用单引号 ( '' ) 引起来。

比如

```sh
[www.ddkk.com]$ awk '' data.txt
```

### sed 命令文本

sed还支持把所有 sed 命令保存在一个普通的文本文件里，然后通过 -f 选项来运行这个文件

```sh
sed [-n] -f scriptfile files
```

sed程序并不是一次只能使用一种方式执行，我们可以将两种方式混合使用。而且可以多次混合使用。

好了，废话不多说了，我们来看看如何在一个 sed shell 命令里同时添加多个 sed 命令。

sed支持 **删除 （ delete 简写 d）** 命令用于删除指定的行。这里，我们想要先删除第一行，第二行和第五行。

删除指定行的 sed 命令格式为 [line_number]d，例如删除第一行的 sed 命令是 1d，第五行的 sed 命令是 5d。

这里我们并不打算详细介绍 **删除命令**，我们会在后面的章节详细介绍。

首先，我们使用 cat 命令看看文件 data.txt 里的内容

```sh
[www.ddkk.com]$ cat data.txt
```

上面的shell 脚本的运行结果如下

```sh
1) I am studing sed
2) I am www.ddkk.com
3) I am a no-work-men
4) I am so handsome
```

接着我们使用 sed 中的 d 命令来删除某些行，准确的说是前三行。

删除三行需要三个 sed 命令，我们使用 -e 选项来分开每一个命令。

```sh
[www.ddkk.com]$ sed -e '1d' -e '2d' -e '5d' data.txt
```

运行上面的 shell 脚本，输出结果如下

```sh
3) I am a no-work-men
4) I am so handsome
```

> 因为不存在第五行，所以也就没删除的效果

sed程序除了支持在命令行里使用 **单引号 ''** 指定要使用的 sed 命令之外，还支持把所有的命令写在一个文件里，然后使用 -f 选项指定 sed 命令存储的脚本。

当把sed 存储在文件中时，需要注意 **每一个 sed 命令独自成一行**。

文件的作用仅仅用于存储命令而已，因此存储 sed 命令的文件并没有任何特殊，可以是一个 .txt 文本文件。

sed程序会从文件中读取每一行命令，并把 pattern buffer 缓冲区的数据应用到每一个命令.

下面，我们使用上面同样的命令，来演示下如何使用文件保存 sed 命令。

首先，创建一个文件用来保存 sed 命令，文件名和后缀都无所谓，sed 只是简单的从文件里读取命令而已。

为了更方便理解，我们在文件里保存的命令和在控制台里使用的命令相同。

```sh
[www.ddkk.com]$ echo -e "1d\n2d\n5d" > commands.txt 
[www.ddkk.com]$ cat commands.txt
```

上面两个 shell 脚本的运行结果如下

```sh
1d 
2d 
5d
```

接着我们使用 -f 选型指定存储了 sed 命令的文件。

其它的选项则和控制台使用时是一样的。

```sh
[www.ddkk.com]$ sed -f commands.txt data.txt
```

运行上面的 shell 脚本，我们会获得之前一模一样的结果

```sh
3) I am a no-work-men
4) I am so handsome
```

## sed 标准的命令行选项

所有版本的 sed 都支持以下标准的 **命令行选项**：

- -n:

如果指定了该选项，那么只会输出 **模式缓冲区 pattern buffer**

如果模式缓冲区没有任何数据，那么就不会有任何输出

例如下面的代码，就不会有任何输出

```sh
[www.ddkk.com]$ sed -n '' data.txt
[www.ddkk.com]$
```

- -e ``:

-e 选项用于追加 sed 脚本 `` 到 sed 命令列表中。

-e 选项可以使用多次，将多个 sed 命令添加到 sed 命令列表中。

>  为必填参数，否则会报错

范例

```sh
[www.ddkk.com]$ sed -e '' -e 'p' data.txt
```

输出结果如下

```sh
1) I am studing sed
1) I am studing sed
2) I am www.ddkk.com
2) I am www.ddkk.com
3) I am a no-work-men
3) I am a no-work-men
4) I am so handsome
4) I am so handsome
```

- -f ``:

该选项用于指定存放了 sed 命令语句的文件。

>  为必填参数，否则会报错

下面的 shell 命令，我们先把运行的 sed 命令保存到一个文件 command.txt 中

```sh
[www.ddkk.com]$ echo "p" > commands 
[www.ddkk.com]$ sed -n -f commands data.txt
```

上面的 shell 命令运行结果如下

```sh
1) I am studing sed
2) I am www.ddkk.com
3) I am a no-work-men
4) I am so handsome
```

## GNU sed 独有的命令行选项

GNUsed 有一些自己独有的选项。因为是独有的，所以 **苹果电脑** 自带的 sed 就不一定支持了。

我们这里快速预览下，有些选项我们会在后面的章节详细介绍。

- -n, --quiet, --silent :

和标准的 -n 作用相同

- -e script, --expression=script:

和标准的 -e 作用相同

- -f script-file, --file=script-file:

和标准的 -f 作用相同

- --follow-symlinks :

如果指定了该选项，sed 在编辑和读取文件时会处理 **符号链接**。

- -i[SUFFIX], --in-place[=SUFFIX]:

如果指定了该选项，那么 sed 会把处理的结果写回源文件而不是输出到标准输出。

如果指定了 [SUFFIX]，则会把源文件复制一份文件名相同，后缀为 [SUFFIX] 的副本，然后把处理的结果写到副本文件中。

如果没有指定 [SUFFIX] 那么就是直接修改源文件了。

- -l N, --line-lenght=N:

该选项用于设置 I 命令的行长度为 N 个字符。

- --posix:

该选项用于禁用所有的 GNU 扩展。

- -r, --regexp-extended:

该选项允许 sed 使用扩展正则表达式而不仅仅是基本的正则表达式功能。

- -u, --unbuffered:

该选项用于指示 sed 禁用缓冲功能。

如果没有缓冲功能，那么 sed 在读取源文件时就会按最少读取，也就是 **一行**，而且会频繁的刷新输出缓冲区。

当我们不想等待系统自动刷新缓冲区时可以指定该选项。

另外如果要使用 tail -f 实时获取 sed 的输出结果则必须开启这个选项。

- -z, --null-data:

默认情况下，sed 使用 **换行符 ( \n )** 来分割每一行。

如果指定了该选项，那么 sed 就会使用 NULL 字符来分割每一行。
