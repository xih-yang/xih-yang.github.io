# 29、AWK 内置的数学函数
- 来源：https://ddkk.com/zhuanlan/other/awk/29.html
- 分类：Awk 教程
- 分组：教程目录
我一直以为 AWK 内置的算术运算函数会和 C 或 Java 或其它语言一样丰富，没想到，只是内置了几个常见的数学函数而已

## 反正切 atan2(y, x)

函数atan2(y, x) 以弧度为单位返回 (y/x) 的反正切值。

> yx 两个参数请参考平面几何图形

```sh
           y
           ^
           |----------.(x,y)
           |           |
           |           |
-----------o-------------> x
           |
           |
           |
```

它的原型如下

```sh
atan2(y, x)
```

> 2 的意思是这个函数接受两个参数。

### 参数说明

参数
说明

y
某个点坐标中的 y 值

x
某个点坐标中的 x 值

### 范例

没啥好说的，平面几何知识忘的一干二净，直接看代码吧

```sh
[www.ddkk.com]$ awk 'BEGIN {
   PI = 3.14159265
   x = -10
   y = 10
   result = atan2 (y,x) * 180 / PI;
   printf "圆弧 (x=%f, y=%f) 的反正切值为 %f 度\n", x, y, result
}'
```

运行以上 awk 命令，输出结果如下

```sh
圆弧 (x=-10.000000, y=10.000000) 的反正切值为 135.000000 度
```

## 余弦值 cos(expr)

函数cos(expr) 以弧度为单位返回表达式 expr 的余弦值。

> yx 两个参数请参考平面几何图形

```sh
           y
           ^
           |----------.(x,y)
           |           |
           |           |
-----------o-------------> x
           |
           |
           |
```

### 参数说明

参数
说明

expr
要求取余弦值的表达式

### 范例

没啥好说的，还是那句话： 平面几何知识忘的一干二净，直接看代码吧

```sh
[www.ddkk.com]$ awk 'BEGIN {
   PI = 3.14159265
   param = 60
   result = cos(param * PI / 180.0);
   printf "弧度 %f 的余弦值为 %f.\n", param, result
}'
```

运行以上 awk 命令，输出结果如下

```sh
弧度 60.000000 的余弦值为 0.500000.
```

## e 为底的指数值 exp(expr)

exp 是高等数学里以自然常数 e 为底的指数函数，它同时又是 **航模** 名词，全称 **Exponential(指数曲线)**

在数学中，经常使用 y = ex 来表示

函数exp(expr) 用于求取以 e 为底的 expr 的指数值，也就是求 e[expr] 的值

它的原型为

```sh
exp(expr)
```

### 参数说明

参数
说明

expr
指数

### 范例

下面的代码，演示了如何使用 exp(expr) 函数求取 eexpr 的数学值

```sh
[www.ddkk.com]$ awk 'BEGIN {
   param = 5
   result = exp(param);
   printf "以 e 为底的 %f 指数值为 %f.\n", param, result
}'
```

运行以上 awk 命令，输出结果如下

```sh
以 e 为底的 5.000000 指数值为 148.413159.
```

## 转换为整数 int(expr)

函数int(expr) 用于把表达式 expr 的计算结果转换为整数。

它的原型如下

```sh
int(expr)
```

### 参数说明

参数
说明

expr
要转换为整数的表达式 expr

**1、** 如果expr的计算结果是整数，则直接返回；

**2、** 如果expr的计算结果是浮点数，则抛弃小数点；

**3、** 如果expr的计算结果是字符串，则尽可能的转换为数字；

### 范例 1

```sh
[www.ddkk.com]$ awk 'BEGIN {
   param = "5.12345"
   result = int(param)
   print "int(", param , ") 转换为整数为", result
}'
```

运行以上 awk 命令，输出结果如下

```sh
int( 5.12345 ) 转换为整数为 5
```

### 范例 2

```sh
[www.ddkk.com]$ awk 'BEGIN {
   param = "5.12345"
   result = int(param)
   print "int(", param , ") 转换为整数为", result
}'
```

运行以上 awk 命令，输出结果如下

```sh
int( 5.12345 ) 转换为整数为 5
```

### 范例 3

```sh
[www.ddkk.com]$ awk 'BEGIN {
   param = "542xxx"
   result = int(param)
   print "int(", param , ") 转换为整数为", result
}'
```

运行以上 awk 命令，输出结果如下

```sh
int( 542xxx ) 转换为整数为 542
```

## 以 e 为底的对数 / 自然对数 log(expr)

如果ax=N（ a>0，且 a≠1 ）， 那么数 x 叫做以 a 为底 N 的对数，记作 x=logaN，读作以 a 为底 N 的对数

其中a 叫做对数的底数，N 叫做真数。

通常我们将以 e 为底的对数叫自然对数，并把 logeN 记为 lnN

函数log(expr) 用于求取表达式 expr 的自然对数结果。

它的原型如下

```sh
log(expr)
```

### 范例

对数也忘的一干二净了，算了，直接看代码吧

```sh
[www.ddkk.com]$ awk 'BEGIN {
   param = 10
   result = log (param)
   printf "log(%f) = %f\n", param, result
}'
```

运行以上 awk 命令，输出结果如下

```sh
log(10.000000) = 2.302585
```

## 随机浮点数 rand()

函数rand() 用于返回一个 [0,1) 之间的随机浮点数 N。

左闭右开的 [0,1) 表示 N 的值满足 0 `<= N`< 1

它的函数原型如下

```sh
rand()
```

### 范例

没啥好说，直接看代码

```sh
[www.ddkk.com]$ awk 'BEGIN {
   print "Random num1 =" , rand()
   print "Random num2 =" , rand()
   print "Random num3 =" , rand()
}'
```

运行以上 awk 命令，输出结果如下

```sh
Random num1 = 0.840188
Random num2 = 0.394383
Random num3 = 0.783099
```

## 正弦值 sin(expr)

函数sin(expr) 以弧度为单位返回表达式 expr 的正弦值。

它的函数原型如下

```sh
sin(expr)
```

### 参数说明

参数
说明

expr
要求取正弦值的表达式

### 范例

哎，还是没啥好说的，悲剧啊，直接看代码

```sh
[www.ddkk.com]$ awk 'BEGIN {
   PI = 3.14159265
   param = 30.0
   result = sin(param * PI /180)
   printf "%f 的正弦值为 %f.\n", param, result
}'
```

运行以上 awk 命令，输出结果如下

```sh
30.000000 的正弦值为 0.500000.
```

## sqrt(expr)

函数sqrt(expr) 用于求取表达式 expr 的开平方。也就是数学运算 √expr

它的函数原型如下

```sh
sqrt(expr)
```

### 参数说明

参数
说明

expr
要开平方的表达式

### 范例

哎，还是没啥好说的，悲剧啊，直接看代码

```sh
[www.ddkk.com]$ awk 'BEGIN {
   param = 1024.0
   result = sqrt(param)
   printf "sqrt(%f) = %f\n", param, result
}'
```

运行以上 awk 命令，输出结果如下

```sh
sqrt(1024.000000) = 32.000000
```

## srand([expr])

srand([expr]) 函数使用使用一个种子值来生成一个随机数。

srand([expr]) 函数使用表达式 expr 的值作为种子来生成一个随机数。如果没有传递 expr ，则默认使用当前时间作为种子

需要注意的是，如果传递相同的种子 expr，那么该函数生成的随机数也是一样的。

```sh
[www.ddkk.com]$ awk 'BEGIN {
   param = 10
   printf "srand() = %d\n", srand()
   printf "srand(%d) = %d\n", param, srand(param)
}'
```

运行以上 awk 命令，输出结果如下

```sh
srand() = 0
srand(10) = 1558857510
```
