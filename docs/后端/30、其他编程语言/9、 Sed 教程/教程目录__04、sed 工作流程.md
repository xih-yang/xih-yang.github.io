# 04、sed 工作流程
- 来源：https://ddkk.com/zhuanlan/other/sed/4.html
- 分类：Sed 教程
- 分组：教程目录
对于会的人来说，sed 极其简单，对于不会的人来说，sed 简直难如登天。

那是什么原因导致了两种极端？

想想，我们为什么如此的胆小，如此的担心受怕？

面对未知的事物，我们从来不敢越雷池一步，但对于会的已知的，我们却易如反掌。

是什么原因导致了两者的不同？

这个问题困惑我好久，直到有一天，我发现，对于会的已知的，我基本都知道它们是怎么工作的！

那么，对于 sed，如果我们要熟练掌握，就必须知道它是怎么工作的，也就是它的工作流程。

## sed 命令语法格式

sed命令的语法格式如下

```sh
sed [option] [sed-command] [input-file]
```

总的来说 sed 命令主要由四部分构成

**1、** sed关键字；

**2、** [option]命令行选项，用于改变sed的工作流程；

**3、** [sed-command]是具体的sed命令；

**4、** [input-file]输入数据，如果不指定，则默认从标准输入中读取；

## sed 工作流程

如果你想成为一个 sed 专家，你必须知道 sed 的内部是如何工作的。

sed的工作流程，说起来真的很简单：

```sh
读取行 -> 执行 -> 显示 -> 读取行 -> 执行 -> 显示 -> .... -> 读取行 -> 执行 -> 显示
```

不要被这张图吓到，其实它的流程真的像上面说的 读取行 ->`执行 ->` 显示 循环。

**1、****读取行**；

sed 从输入流 （文件、管道、标准输入流）中读取 **一行** 并存储在名叫 pattern buffer 的内部缓冲区中。

sed 是行文字处理器。每次只会读取一行。

sed 内部会有一个计数器，记录着当前已经处理多少行，也就是当前行的行号。

**2、****执行**；

按照 sed 命令定义的顺序依次应用于刚刚读取的 **一行** 数据。

默认情况下，sed 一行一行的处理所有的输入数据。但如果我们指定了行号，则只会处理指定的行。

**3、****显示**；

把经过 sed 命令处理的数据发送到输出流（文件、管道、标准输出）。并同时清空 pattern buffer 缓冲区。

**4、** 上面上个流程一直循环，直到输入流中的数据全部处理完成；

## 注意事项

整个流程看似简单，有几个知识点需要注意：

- pattern buffer 缓冲区是 sed 在内存上开辟的一个私有的存储区域。

内存的特性，会导致关闭命令行或关机数据就没了。

- 默认情况下，sed 命令只会处理 pattern buffer 缓冲区中的数据，且并不会将处理后的数据保存到源文件中。

也就是说，sed 默认并不会修改源文件。

但 GNU SED 提供提供了一种方式用于修改 **源文件**。方式就是传递 -i 选项。

至于具体的如何处理，我们会在后面的章节中介绍。

- sed 还在内存上开辟了另一个私有的缓冲区 hold buffer 用于保存处理后的数据以供以后检索。

每一个周期执行结束，sed 会清空 pattern buffer 缓冲区的内容，但 hold buffer 缓冲区的内容并不会清空。

hold buffer 缓冲区用于存储处理后数据，sed 命令并不会对这里的数据处理。

这样，当 sed 需要之前处理后的数据时，可以随时从 hold buffer 缓冲区读取。

- sed 程序执行前，模式 pattern 和 hold buffer 缓冲区都是空的。
- 如果我们没有传递任何输入文件，sed 默认会从 **标准输入** 中读取数据。
- sed 可以指定只处理输入数据中的行范围。默认情况下是全部行，因此会依次处理每一行。

## 范例

上面的流程和注意事项说着说着有点复杂的样子。

别担心，sed 真的很简单的。

下面我们就通过几个简单的 sed 命令来梳理下 sed 的工作流程。

首先在当前目录下 （随便哪个目录，只要终端当前在这个目录下就可以）创建一个文件 data.txt 并输入以下内容

```sh
1) I am studing sed
2) I am www.ddkk.com
3) I am a no-work-men
4) I am so handsome
```

第一个sed 命令，我们显示 data.txt 文件的所有内容。也就是使用 sed 命令模拟 cat 命令。

```sh
[www.ddkk.com]$ cat data.txt
1) I am studing sed
2) I am www.ddkk.com
3) I am a no-work-men
4) I am so handsome
```

输出源文件的内容并不需要任何 sed 语句，因此可以直接 ''。

模拟cat 命令的 sed 命令为 sed '' data.txt

```sh
[www.ddkk.com]$ sed '' data.txt
1) I am studing sed
2) I am www.ddkk.com
3) I am a no-work-men
4) I am so handsome
```

对照着sed 命令的语法格式

```sh
sed [option] [sed-command] [input-file]
```

- data.txt 对应着 [input-file]。用于提供输入数据。
- '' 对应着 [sed-command] 为具体的 sed 语句。

> '' 并不是 [option]。[option] 类似于 -i 或 --i xxx 等格式。

我们就用这个简单的 sed 命令来解释下 sed 的工作流程

**1、** 首先从输入文件data.txt中读取一行，也就是1)Iamstudingsed并存储在patternbuffer缓冲区中；

**2、** 然后将patternbuffer中的数据，也就是1)Iamstudingsed应用于每一个sed语句''；

因为我们的 sed 语句为空，也就是不对 pattern buffer 中的数据做任何处理。

**3、** 把处理后的数据保存一份到holdbuffer中；

**4、** 最后把处理后的数据写入输出流，默认情况下是**标准输出**，也就是打印1)Iamstudingsed同时删除patternbuffer缓冲区；

**5、** 循环重复上面的1234流程；

是不是很简单 ？

### 从标准输入中读取数据

如果我们没有提供输入文件，那么 sed 默认会冲标准输入中读取数据。

```sh
[www.ddkk.com]$ sed ''
```

运行上面的命令，会显示光标，等带我们的输入。

你可以随意输入一些字符，比如

```sh
DDKK.COM 弟弟快看，程序员编程资料站 DDKK.COM 弟弟快看，程序员编程资料站
```

当我们按下回车键，sed 会默认读取刚刚输入的行，然后显示出来

```sh
DDKK.COM 弟弟快看，程序员编程资料站 DDKK.COM 弟弟快看，程序员编程资料站
```

然后继续等待你输入下一行

如果要退出 sed 输入会话可以按下组合键 ctrl-D (^D)。
