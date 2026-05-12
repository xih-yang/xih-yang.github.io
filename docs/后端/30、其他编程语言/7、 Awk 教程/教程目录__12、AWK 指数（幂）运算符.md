# 12、AWK 指数（幂）运算符
- 来源：https://ddkk.com/zhuanlan/other/awk/12.html
- 分类：Awk 教程
- 分组：教程目录
指数运算符，又称之为幂运算符，用于对数字执行幂运算操作。

AWK支持两个功能一模一样的幂运算符: ^ 和 **

## ^ 指数运算符

^指数运算符的语法为

```sh
expr1 ^ expr2
```

^指数运算符会执行以 expr1 为底，expr2 为指数的数学幂运算。也就是 expr1expr2 的幂运算。

```sh
[www.ddkk.com]$ awk 'BEGIN { x = 15; x = x ^ 2; print "x =", x }'
```

运行上面的 awk 命令，输出结果为

```sh
x = 225
```

## ** 指数运算符

** 指数运算符跟 ^ 运算符的作用一样，语法结构也差啊不多

** 指数运算符语法为

```sh
expr1 ** expr2
```

** 指数运算符会执行以 expr1 为底，expr2 为指数的数学幂运算。也就是 expr1expr2 的幂运算。

```sh
[www.ddkk.com]$ awk 'BEGIN { x = 15; x = x ** 2; print "x =", x }'
```

运行上面的 awk 命令，输出结果为

```sh
x = 225
```
