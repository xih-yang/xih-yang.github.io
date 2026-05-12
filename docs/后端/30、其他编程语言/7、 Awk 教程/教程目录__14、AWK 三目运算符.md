# 14、AWK 三目运算符
- 来源：https://ddkk.com/zhuanlan/other/awk/14.html
- 分类：Awk 教程
- 分组：教程目录
三目运算符的存在，好像只是用来简化 if else 条件语句。

AWK中的三目运算符，和 C/C++ 甚至其它有三目运算符的语言一样，一样的语法。

```sh
condition expression ? statement1 : statement2
```

当条件表达式 （ condition expression ） 返回 true 时，将执行 statement1，否则将执行 statement2

例如下面的范例，当 x > y 时，把 x 赋值给 max，否则把 y 赋值给 max

```sh
[jerry]$ awk 'BEGIN { x = 25; b = 15; (x > y ) ? max = x : max = y; print "Max =", max}'
```

上面的awk 命令的计算结果为

```sh
Max = 25
```
