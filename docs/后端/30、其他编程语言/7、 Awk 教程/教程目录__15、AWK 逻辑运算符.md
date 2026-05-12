# 15、AWK 逻辑运算符
- 来源：https://ddkk.com/zhuanlan/other/awk/15.html
- 分类：Awk 教程
- 分组：教程目录
逻辑运算符包括 逻辑与（ && ）、逻辑或（ || ）、逻辑非 （ ! ）

## 逻辑与（ && ）

逻辑与运算符使用两个 & 表示，为 &&，它的语法为

```sh
expr1 && expr2
```

逻辑与（ && ）运算符的计算结果遵循以下规则

**1、** 如果expr1和expr2的计算结果都为true，则结果为true;否则返回false；

**2、** 当且仅当expr1的计算结果为true时，才会计算expr2；

```sh
[www. ddkk.cn]$ awk 'BEGIN {
   num = 5; if (num >= 0 && num <= 7) printf "%d is in octal format\n", num 
}'
```

运行上面的 awk 命令，输出结果为

```sh
5 is in octal format
```

## 逻辑或（ || ）

逻辑或运算符使用 **||** 表示。

它的语法为

```sh
expr1 || expr2
```

逻辑或（ || ）运算符的计算结果遵循以下规则

**1、** 如果expr1和expr2的计算结果只要有一个为true，则结果为true;否则返回false；

**2、** 当且仅当expr1的计算结果为false时，才会计算expr2；

```sh
[www.ddkk.com]$ awk 'BEGIN {
   ch = "\n"; if (ch == " " || ch == "\t" || ch == "\n") 
   print "Current character is whitespace." 
}'
```

运行上面的 awk 命令，输出结果为

```sh
Current character is whitespace
```

## 逻辑非 （ ! ）

逻辑非运算符使用 **感叹号（ ！）** 表示。它的语法为

```sh
! expr1
```

逻辑非运算符返回 expr1 的逻辑补语，也就是说如果 expr1 的计算结果为 true，则返回 0; 否则返回 1。

例如下面的 AWK 命令，因为 name 为空字符串，所以 length(name) 的结果为 0，对 0 执行逻辑非运算，则为 true

```sh
[www.ddkk.com]$ awk 'BEGIN { site = ""; if (! length(site)) print "site is empty string." }'
```

运行上面的 awk 命令，输出结果为

```sh
site is empty string.
```
