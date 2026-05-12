# 26、sed 字符串替换标志(GNU SED 独有)
- 来源：https://ddkk.com/zhuanlan/other/sed/26.html
- 分类：Sed 教程
- 分组：教程目录
> 字符串替换标志（ flag ）是 GNU SED 独有的。
>
> 如果你使用的是 Linux 系统，比如 Ubuntu、CentOS、RedHat、Debain 等系统则可以直接使用。 如果你使用的是 Mac 苹果电脑，那么必须使用 gsed ，自带的 sed 是没法使用的。

在前面的章节中，我们学习了 sed 中的 **替换命令**。也就是单字母 s 命令。

但这种替换非常的生硬，比如我们想把 TWLE.CN 全部替换为小写，我们必须自己去硬编码为 ddkk.cn。

```sh
s/TWLE.CN/ddkk.cn
```

如果有多个匹配，我们岂不是要写到手软？

这种简单的转换，sed 不能有一个特殊字符来自动处理么？

为了解决这种手软到的问题， GNU sed 为字符串替换命令添加了一些特殊字符，哦，特殊标志 ( flag )。

本章节，我们就来讲讲几个重要的。

- \l

\l 标志用于指示后面出现的第一个字母转换为 **小写**。例如 \lTWLE.cn 的效果为 tWLE.cn。

```plaintext
### 范例 ###
```

下面的 sed 命令使用 \l 将字母 T 转换为 t。

```sh
[www.ddkk.com]$ echo "I love www.TWLE.cn " | sed -n 's/www.TWLE.cn/www.\lTWLE.cn/p'
```

运行上面的命令，输出结果如下

```sh
I love www.tWLE.cn
```

- \L

\L 标志用于指示后面出现的所有字母都转换为 **小写**。例如 \LTWLE.Cn 的效果为 ddkk.cn。

```plaintext
### 范例 ###
```

下面的范例，我们将 www.TWLE.Cn 全部替换为小写。

```sh
[www.ddkk.com]$ echo "I love www.TWLE.Cn " | sed -n 's/www.TWLE.Cn/\L&/p'
```

运行上面的命令，输出结果如下

```sh
I love www.ddkk.com
```

> 还记得 符号（&） 的作用吗？不记得的话，请移步 sed 特殊字符命令 &

- \u

\u 标志用于指示后面出现的第一个字母转换为 **大写**。例如 \uddkk.cn 的效果为 Twle.cn。

```plaintext
### 范例 ###
```

下面的 sed 命令使用 \u 将字母 t 转换为 T。

```sh
[www.ddkk.com]$ echo "I love www.ddkk.com " | sed -n 's/www.ddkk.com/www.\uddkk.cn/p'
```

运行上面的命令，输出结果如下

```sh
I love www.Twle.cn
```

- \U

\U 标志用于指示后面出现的所有字母都转换为 **大写**。例如 \Uddkk.cn 的效果为 TWLE.CN。

```plaintext
### 范例 ###
```

下面的范例，我们将 www.ddkk.com 全部替换为大写。

```sh
[www.ddkk.com]$ echo "I love www.ddkk.com " | sed -n 's/www.ddkk.com/\U&/p'
```

运行上面的命令，输出结果如下

```sh
I love WWW.TWLE.CN
```

- \E

\E 标志必须和 \L 或 \U 一起使用。

\E 标志用于取消 \L 或 \U 开启的特殊效果，也就是 \E 字符之后，\L 或 \U 的设定不再起作用。

```plaintext
### 范例 ###
```

下面的替换中，只有第一个单词会被替换为 **大写字母**。

```sh
[www.ddkk.com]$ echo "I love ddkk.cn " | sed -n 's/ddkk/\Uwww.\Eddkk/p'
```

运行上面的命令，输出结果如下

```sh
I love WWW.ddkk.cn
```
