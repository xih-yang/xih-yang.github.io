# 18、sed 读文件命令 r
- 来源：https://ddkk.com/zhuanlan/other/sed/18.html
- 分类：Sed 教程
- 分组：教程目录
sed支持读取其它文件的内容，并在符合条件时显示它们。

为了完成这个操作，sed 提供了单字母 r 命令用于读取其它文件的内容。

r是 read 的缩写，后者翻译为中文是 读取 的意思。

r命令的使用语法格式如下

```sh
[address1[,address]]r file
```

- address1 和 address2 用于 **行寻址**，可以是行号或者模式。

> 注意： 苹果电脑自带的 sed 不支持区间寻址。

- r 是读文件命令
- file 是要读取的命令

> 注意： r 命令和 file 参数之间必须有一个空格。

### 范例

范例开始前，我们先准备下范例需要使用的数据。

首先创建文件 data.txt 内容如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
4) 小王,22岁,清华大学
5) 小刚,27岁,北京大学
6) 小英,21岁,哈佛大学
```

然后再准备一个 r 命令要读取的文件 demo.txt 内容如下

```sh
Hello   World   Yufei
Hello   www.ddkk.com sed
```

最后，我们就可以使用 l 命令再第三行后面插入其它文件 demo.txt 中的内容

```sh
[www.ddkk.com]$ sed '3 r demo.txt' data.txt
```

运行结果如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
Hello   World   Yufei
Hello   www.ddkk.com sed4) 小王,22岁,清华大学
5) 小刚,27岁,北京大学
6) 小英,21岁,哈佛大学
```

### 范例2

l命令还支持 **行范围** 寻址。

我们可以通过 **行范围** 寻址的方式，在符合条件的行范围内的每一行都插入另一个文件的内容

例如下面的命令在 [3,5] 区间内的每一行都插入另一个文件的内容

```sh
[www.ddkk.com]$ sed '3, 5 r demo.txt' data.txt
```

运行结果如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
Hello   World   Yufei
Hello   www.ddkk.com sed4) 小王,22岁,清华大学
Hello   World   Yufei
Hello   www.ddkk.com sed5) 小刚,27岁,北京大学
Hello   World   Yufei
Hello   www.ddkk.com sed6) 小英,21岁,哈佛大学
```

### 范例3

和其它命令一样，我们的 r 命令同样支持 **模式寻址**。

例如下面的命令，我们通过模式寻址来显示包含 **小李** 的行，并在该行后面插入另一个文件的内容

```sh
[www.ddkk.com]$  sed '/小李/ r demo.txt' data.txt
```

运行结果如下

```sh
1) 小明,23岁,北京大学
2) 小红,22岁,清华大学
3) 小李,25岁,斯坦福大学
Hello   World   Yufei
Hello   www.ddkk.com sed4) 小王,22岁,清华大学
5) 小刚,27岁,北京大学
6) 小英,21岁,哈佛大学
```
