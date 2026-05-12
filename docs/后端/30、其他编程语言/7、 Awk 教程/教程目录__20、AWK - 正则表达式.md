# 20、AWK - 正则表达式
- 来源：https://ddkk.com/zhuanlan/other/awk/20.html
- 分类：Awk 教程
- 分组：教程目录
作为强大的行文本处理器，如果不支持正则表达式，那真的有点说不过去了。

好在AWK 也意识到了这一点，早早的就支持正则表达式了。

虽然支持的模式并没有 Perl 或 Python 那么强大，但是，作为行处理器，也足够使用了。

正则表达式最重要的作用，就是可以使用简单的语句完成复杂的任务。

## 点号 ( . )

AWK中的 **点号 ( . )** 可以匹配任何其它单个字符，除了行尾的 **换行符** 除外。

例如，f.n 可以匹配 **fin** 、 **fun** 、**fan**。

```sh
[www.ddkk.com]$ echo -e "cat\nbat\nfun\nfin\nfan" | awk '/f.n/'
```

运行上面的 awk 命令，输出结果如下

```sh
fun
fin
fan
```

## 匹配行首 ( ^ )

AWK使用 ^ 字符来匹配行首。

为什么是行首而不是字符串开始呢？

那是因为，AWK 是行处理程序，AWK 中的模式匹配只能用于一行。

下面的awk 命令，用于匹配那些以 The 开始的行。

```sh
[www.ddkk.com]$ echo -e "This\nThat\nThere\nTheir\nthese" | awk '/^The/'
```

运行上面的 awk 命令，输出结果如下

```sh
There
Their
```

## 匹配行尾 ( $ )

AWK使用 `$` 来匹配行尾。

那是因为，AWK 是行处理程序，AWK 中的模式匹配只能用于一行。但是，行尾不是换行符嘛？

哈哈，当 awk 把一行传递给 AWK 主体代码的时候，默认会自动删除行尾的换行符。

下面的awk 命令，用于匹配那些以 n 结束的行。

```sh
[www.ddkk.com]$ echo -e "knife\nknow\nfun\nfin\nfan\nnine" | awk '/n$/'
```

运行上面的 awk 命令，输出结果如下

```sh
fun
fin
fan
```

## 匹配字符集 []

如果要匹配的字符是在多个字符中选择一个，那么可以使用 **匹配字符集 []**。

例如下面的命令，匹配那些以 C 或 T 开头的字符。但是不会匹配以 B 开头的字符

```sh
[www.ddkk.com]$ echo -e "Call\nTall\nBall" | awk '/[CT]all/'
```

运行上面的 awk 命令，输出结果如下

```sh
Call
Tall
```

## 不匹配字符集 [^]

不匹配字符集与 匹配字符集 [] 类似，区别在于 **中括号** 内的字符都不匹配，也就是说不能是中括号内出现的那些字符。

例如下面的命令，只会匹配 Ball

```sh
[www.ddkk.com]$ echo -e "Call\nTall\nBall" | awk '/[^CT]all/'
```

运行上面的 awk 命令，输出结果如下

```sh
Ball
```

## 逻辑或 / 二选一 |

如果需要在两个单词或字符中选择一个的话，可以使用 **二选一 |**。

例如下面的命令，只能在 Ball 或 Call

### 范例

```sh
[www.ddkk.com]$ echo -e "Call\nTall\nBall\nSmall\nShall" | awk '/Call|Ball/'
```

运行上面的 awk 命令，输出结果如下

```sh
Call
Ball
```

## 匹配 0 次或 1 次 ?

如果需要不匹配或最多匹配一次，可以使用字符 ?。

?对于出现在它前面的字符，最多只会匹配一次，也叫非贪婪匹配符。

例如下面的范例，Colou?r 只会匹配 Color 或 Colour 但不会匹配 Colouur。

### 范例

```sh
[www.ddkk.com]$ echo -e "Colour\nColor" | awk '/Colou?r/'
```

运行上面的 awk 命令，输出结果如下

```sh
Colour
Color
```

## 匹配 0 次或多次 *

匹配0 次或多次匹配符 * 可以匹配 0 次或多次出现。其实就是相当于占位符。

例如下面的范例，可以匹配 ca, cat, catt 等等

### 范例

```sh
[www.ddkk.com]$ echo -e "ca\ncat\ncatt" | awk '/cat*/'
```

运行上面的 awk 命令，输出结果如下

```sh
ca
cat
catt
```

## 匹配至少一次 +

+用于至少匹配至少一次，也就是说 + 之前的字符，要至少出现一次。

例如下面的范例，需要至少一个 2 才会被匹配

### 范例

```sh
[www.ddkk.com]$ echo -e "111\n22\n123\n234\n456\n222"  | awk '/2+/'
```

运行上面的 awk 命令，输出结果如下

```sh
22
123
234
222
```

## 分组

AWK支持分组匹配，使用 **圆括号 ()** 来进行分组，然后使用 **竖线 （ | ）** 分隔分组中的可选字符串。

例如Apple (Juice|Cake) 就是一个分组，既可以匹配 Apple Juice 又可以匹配 Apple Cake。

```sh
[jerry]$ echo -e "Apple Juice\nApple Pie\nApple Tart\nApple Cake" | awk 
   '/Apple (Juice|Cake)/'
```

运行上面的 awk 命令，输出结果如下

```sh
Apple Juice
Apple Cake
```
