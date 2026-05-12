# 16、sed 显示不可见字符 l
- 来源：https://ddkk.com/zhuanlan/other/sed/16.html
- 分类：Sed 教程
- 分组：教程目录
仅凭肉眼能看到的空隙，你能判断单词与单词之间的空隙使用 **空格** 分隔还是使用 **制表符** 分隔嘛？

大多数情况下是不能的。

为了能够作出比较明确的判断，sed 添加了 l 命令用于把 **隐藏字符** 显示出来。

例如把**制表符** 显示为 \t，把换行符显示为 `$` 。

l命令是 list 的缩写，后者的意思是 **列出**。

l命令的语法格式如下

```sh
[address1[,address2]]l [len]
```

- address1 和 address2 用于 **行寻址**，可以是 **行号** 或者 **模式**
- l 是显示命令
- [len] 是可选的，如果设定，则用于限制每行的字符数。

### 范例1

开始范例前，我们先准备下我们接下来要使用的数据，我们使用 echo 来准备数据

```sh
[www.ddkk.com] echo -e "Hello\tWorld\tYufei\nHello\twww.ddkk.com\tsed"
```

运行结果如下

```sh
Hello   World   Yufei
Hello   www.ddkk.com sed
```

下面的命令，我们使用 **行号寻址** 对第二行显示隐藏字符。

```sh
[www.ddkk.com]$ echo -e "Hello\tWorld\tYufei\nHello\twww.ddkk.com\tsed" | sed -n '2 l'
```

运行结果如下

```sh
Hello\twww.ddkk.com\tsed$
```

### 范例 2

l模式同样支持模式寻址，下面的命令当行包含 **ddkk** 时才运行 l 命令

```sh
[www.ddkk.com] echo -e "Hello\tWorld\tYufei\nHello\twww.ddkk.com\tsed" | sed -n '/ddkk/ l'
```

运行结果如下

```sh
Hello\twww.ddkk.com\tsed$
```

### 范例 3

[len] 参数用于限定输出时每行的字符数，如果行的内容多于 [len] ，则会在当前行尾添加 \ 并且多出的内容会在新行输出。

也就是限定每行的字符不能多于 [len]。

```sh
[www.ddkk.com]$ echo -e "Hello\tWorld\tYufei\nHello\twww.ddkk.com\tsed" | sed -n 'l 10'
```

运行结果如下

```sh
Hello\tWo\
rld\tYufe\
i$
Hello\tww\
w.ddkk.cn\
\tsed$
```

### 范例 4

如果我们将 [len] 设置为 0，那么 l 命令永远不会换行，除非遇到新的换行符。

```sh
[www.ddkk.com]$ echo -e "Hello\tWorld\tYufei\nHello\twww.ddkk.com\tsed" | sed -n 'l 0'
```

运行结果如下

```sh
Hello\tWorld\tYufei$
Hello\twww.ddkk.com\tsed$
```
