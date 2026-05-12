# 22、sed 版本检查命令 v
- 来源：https://ddkk.com/zhuanlan/other/sed/22.html
- 分类：Sed 教程
- 分组：教程目录
有时候我们需要对 sed 程序的版本进行限制，比如限制当前命令必须运行在高于指定的最低版本。

这时候我们可以使用单字母 v 命令。

v是 version 的缩写，verion 翻译为中文是 版本的意思。

v命令的语法格式如下

```sh
[address1[,address2]]v [version]
```

- address1 和 address2 是 **行寻址** 的开始行和结束行
- v 是版本检查命令
- [version] 用于指定 sed 的最低版本要求。

> 苹果电脑自带的 sed 不支持 v 命令

如果当前 sed 的版本不符合 v 命令指定的最低版本要求则会报错。否则什么事也不会发生。

## 当前 sed 程序的版本

我们可以通过 --version 选项来输出 sed 程序的版本

```sh
[www.ddkk.com]$ sed --vearsion
```

运行结果如下

```sh
gsed (GNU sed) 4.7
Copyright (C) 2018 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Written by Jay Fenlason, Tom Lord, Ken Pizzini,
Paolo Bonzini, Jim Meyering, and Assaf Gordon.
GNU sed home page: <https://www.gnu.org/software/sed/>.
General help using GNU software: <https://www.gnu.org/gethelp/>.
E-mail bug reports to: <bug-sed@gnu.org>.
```

> 注意
> 苹果电脑自带的 sed 命令不支持 --version 参数
>
> 因为我的电脑是苹果电脑，所以安装了 gsed 程序来代替 sed。

## 当前 sed 程序版本过的则会报错

如果当前 sed 的版本低于 v 命令所指定的最低版本要求，那么命令就会报错。

```sh
[www.ddkk.com]$ echo "DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站" | sed 'v 4.8'
```

运行结果如下

```sh
sed: -e expression #1, char 5: expected newer version of sed
```

因为我的 sed 的程序版本为 4.7，低于命令所需要的 4.8。所以版本检查不通过。

## 当前 sed 版本匹配或高于

如果当前 sed 的版本高于 v 命令所指定的最低版本要求，那么就能正常运行什么事也不会发生。

```sh
[www.ddkk.com]$ echo "DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站" | sed 'v 4.2.2'
```

运行结果如下

```sh
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

因为我的 sed 的程序版本为 4.7，远远高于命令所需要的 4.2.3。所以版本检查通过。
