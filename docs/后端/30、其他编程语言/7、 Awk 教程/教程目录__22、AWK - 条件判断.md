# 22、AWK - 条件判断
- 来源：https://ddkk.com/zhuanlan/other/awk/22.html
- 分类：Awk 教程
- 分组：教程目录
AWK脱胎于 C 语言，自然也有着 C 语言的影子。

从某些方面说，与其他编程语言一样，AWK 提供条件语句来控制程序的流程。

不过AWK 中的条件判断语言比较简单，就是简单的 if 语句、if-else 语句、if-else-if 语句

## if 语句

现实生活中，我们经常会说 **如果...我就怎么怎么样？** 的感慨。这是一种典型的条件判断。

这种条件一旦发生，就会改变我们流水似得生活，让生活有了转折点。

AWK语言也模拟了这种条件判断，使用 if 语句来实现这种判断

AWK中的 if 语句的语法格式如下

```sh
if (condition)
   action
```

如果有多个动作需要执行，我们可以把多个动作语句放在一对 **大括号 {}** 之中。

这种情况下，语法格式如下

```sh
if (condition) {
   action-1
   action-1
   .
   .
   action-n
}
```

下面，我们使用一个范例来演示下 if 语句的使用。

### 范例

下面这段代码使用 if 语句检查数字是否是偶数。

```sh
[www.ddkk.com]$ awk 'BEGIN {num = 10; if (num % 2 == 0) printf "%d is even number.\n", num }'
```

运行以上 awk 命令，输出结果如下

```sh
10 is even number.
```

## if-else 语句

现实生活中，我们都会说 "如果 ...就怎么怎么样，否则 就怎么怎么样。"

这是一种典型的条件判断。也即是说如果条件满足，那么会执行一些动作，如果条件不满足，则执行另一些动作。

AWK语言也模拟了这种条件判断，使用 if-else 语句来实现这种判断。

if-else 语句的语法格式如下

```sh
if (condition)
   action-1
else
   action-2
```

在上面这个 if-else 语句中，如果 condition 条件返回 true 值，那么 action-1 语句块会执行，但如果 condition 条件返回 false 值，那么 action-2 语句块会执行。

可能有点拗口，没事，我们用一个实例来讲解下

```sh
[www.ddkk.com]$ awk 'BEGIN {
   num = 11; if (num % 2 == 0) printf "%d is even number.\n", num; 
      else printf "%d is odd number.\n", num 
}'
```

运行以上 awk 命令，输出结果如下

```sh
11 is odd number.
```

## if-else-if 梯度

AWK中允许使用 **if-else-if** 梯度来完成多个条件的判断。

**if-else-if** 梯度本质上来说就是多个 if-else 语句。

废话不多说，我们直接上范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   a = 30;
   if (a==10)
   print "a = 10";
   else if (a == 20)
   print "a = 20";
   else if (a == 30)
   print "a = 30";
}'
```

运行以上 awk 命令，输出结果如下

```sh
a = 30
```
