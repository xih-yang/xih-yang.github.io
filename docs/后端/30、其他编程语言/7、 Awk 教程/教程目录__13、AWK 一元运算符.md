# 13、AWK 一元运算符
- 来源：https://ddkk.com/zhuanlan/other/awk/13.html
- 分类：Awk 教程
- 分组：教程目录
AWK中的一元运算符只有两个： 一元加号（ + ）、一元减号（ - ）

## 一元加号（ + ）

一元加号使用 **加号( + )** 表示。它的作用是将右边的操作数乘以 +1 也就是乘以 1

从某些方面说，一元加号（ + ）的作用就是将操作数转换为数字

```sh
[www.ddkk.com]$ awk 'BEGIN { x = -10; x = +x; print "x =", x }'
[www.ddkk.com]$ awk 'BEGIN { x = "name"; x = +x; print "x =", x }'
[www.ddkk.com]$ awk 'BEGIN { x = "123456789"; x = +x; print "x =", x }'
```

运行上面的 awk 命令，输出结果如下

```sh
x = -10
x = 0
x = 123456789
```

## 一元减号（ - ）

一元加号使用 **减号( - )** 表示。它的作用是将右边的操作数乘以 -1

从某些方面说，一元减号（ - ）的作用就是把操作数转换为数字，并执行 0 - 操作数 运算

```sh
[www.ddkk.com]$ awk 'BEGIN { x = -10; x = -x; print "x =", x }'
[www.ddkk.com]$ awk 'BEGIN { x = "name"; x = -x; print "x =", x }'
[www.ddkk.com]$ awk 'BEGIN { x = "123456789"; x = -x; print "x =", x }'
```

运行上面的 awk 命令，输出结果如下

```sh
x = 10
x = 0
x = -123456789
```
