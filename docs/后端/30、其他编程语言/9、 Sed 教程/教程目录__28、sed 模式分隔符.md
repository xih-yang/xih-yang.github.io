# 28、sed 模式分隔符
- 来源：https://ddkk.com/zhuanlan/other/sed/28.html
- 分类：Sed 教程
- 分组：教程目录
到目前为止，我们只使用过一种 **分隔符**，那就是 **反斜杠（/）** 。

假设我们需要使用 sed 将输入源中的 /bin/sed 替换为 /home/penglei/bin/sed

因为/ 是模式分隔符，我们不得不对它进行转义，即 /。

```sh
[www.ddkk.com]$ echo "/bin/sed" | sed 's/\/bin\/sed/\/home\/penglei\/bin\/sed/'
```

运行结果如下

```sh
/home/penglei/bin/sed
```

结果看起来是正确的。但是整个 sed 命令看起来就有点难以阅读了。更何况一个不小心，就会把替换的命令写错。

当我看到

```sh
s/\/bin\/sed/\/home\/penglei\/bin\/sed/
```

我头皮都麻了。

这，这，这...

难道没有其它的分隔符了吗？

估计sed 的开发人员也遇到了这个问题吧。

其实sed 允许使用其它的分隔符的，比如

- **竖线（|）**
- **at 符号 （@）**
- **反引号（\）**
- **感叹号（!）**

本章接下来的内容，我们就来简单介绍下这几种分隔符的用法

## 竖线 |

**竖线（|）** 应该是 **反斜杠（/）** 之外用的最多的分隔符了。

竖线能够显著改善 sed 模式语句的可读性。

例如上面的命令，我们使用竖线作为分隔符，则可重写为

```sh
[www.ddkk.com]$ echo "/bin/sed" | sed 's|/bin/sed|/home/penglei/bin/sed|'
```

运行结果如下

```sh
/home/penglei/bin/sed
```

## @ 字符

@字符同样也可以作为分隔符，不过可读性就没有竖线那么高了。

```sh
[www.ddkk.com]$ echo "/bin/sed" | sed 's@/bin/sed@/home/penglei/bin/sed@'
```

运行结果如下

```sh
/home/penglei/bin/sed
```

看到s@ 和 sed@ ，这 TMD 是什么鬼啊，我个人感觉可读性变差了好多。

```sh
/home/jerry/src/sed/sed-4.2.2/sed
```

## 反引号（\）

反引号（\）同样可以作为分隔符，不过可读性差了些

```sh
[www.ddkk.com]$ echo "/bin/sed" | sed 's^/bin/sed^/home/penglei/bin/sed^'
```

运行结果如下

```sh
/home/penglei/bin/sed
```

看到 **反引号（\）** ，我们第一个想到的是什么？

对，就是正则表达式中的 **匹配行首**。

因此，可读性和可理解性那就更差了。

个人觉得最差，没有之一。

## 感叹号 !

**感叹号（!）** 同样可以作为分隔符。可读性和可理解性都是差到了极点了。

```sh
[www.ddkk.com]$ echo "/bin/sed" | sed 's!/bin/sed!/home/penglei/bin/sed!'
```

运行结果如下

```sh
/home/penglei/bin/sed
```

看到 **感叹号（!）** ，你第一个想法是什么？ 这不就是 **条件测试** 中的 **取反** 么？

这个可读性和理解性，可以和 **反引号（\）** 有的一拼了。

## 结论

sed除了支持 **反斜杠（/）** 这一种分隔符，还支持其它的分隔符。

但我们最推荐的，还是 **竖线（|）** 。
