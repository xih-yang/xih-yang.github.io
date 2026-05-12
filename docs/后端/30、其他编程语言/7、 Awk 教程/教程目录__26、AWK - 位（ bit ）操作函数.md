# 26、AWK - 位（ bit ）操作函数
- 来源：https://ddkk.com/zhuanlan/other/awk/26.html
- 分类：Awk 教程
- 分组：教程目录
为了方便 **位操作**，AWK 内置了几个非常实用的 **位操作相关的函数**

## 位与 and(num1,num2)

**位与** 就是位操作符 &，当两个数字的二进制格式的相同的位都是 1 时返回 1 否则返回 0。

例如3 & 5 的结果为 1 演示如下

```sh
3       1 1
5     1 0 1
& ---------
1     0 0 1
```

函数and() 用于返回两个数字的 **位与** 结果，语法格式如下

```sh
number and(num1, num2)
```

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   num1 = 10
   num2 = 6
   printf "(%d AND %d) = %d\n", num1, num2, and(num1, num2)
}'
```

运行上面的 awk 命令，输出结果如下

```sh
(10 AND 6) = 2
```

## 按位取反函数 compl(num1)

**按位取反** 就是位操作符 ~，就是把一个数字的二进制格式中的 1 换成 0，0 换成 1。

函数compl 用于返回某个数字的 **按位取反** 结果，语法格式如下

```sh
number compl(num)
```

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   num1 = 10
   printf "compl(%d) = %d\n", num1, compl(num1)
}'
```

运行上面的 awk 命令，输出结果如下

```sh
compl(10) = 9007199254740981
```

## 左移 lshift(num,n)

**左移** 就是位操作符 `>`，就是将某个数的二进位全部右移若干位，对无符号数，高位补 0，有符号数，各编译器处理方法不一样，有的补符号位（算术右移），有的补 0（逻辑右移）

例如5 >>` 1 的结果为 2 演示如下

```sh
5     1 0 1
>> 1  ------
7     0 1 0
```

> 最右边那个 1 因为右移了一位，所以被丢弃了

函数rshift() 用于返回某个数字的 **右移** n 位的结果，语法格式如下

```sh
number rshift(num1, n)
```

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   num1 = 10
   printf "rshift(%d) by 1 = %d\n", num1, rshift(num1, 1)
}'
```

运行上面的 awk 命令，输出结果如下

```sh
rshift(10) by 1 = 5
```

## 位或 or(num1,num2)

**位或** 就是位操作符 |，当两个数字的二进制格式的相同的位有一个为 1 则返回 1 ，否则返回 0

例如3 | 5 的结果为 7 演示如下

```sh
3       1 1
5     1 0 1
& ---------
7     1 1 1
```

函数or() 用于返回两个数字的 **位或** 结果，语法格式如下

```sh
number or(num1, num2)
```

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   num1 = 10
   num2 = 6
   printf "(%d OR %d) = %d\n", num1, num2, or(num1, num2)
}'
```

运行上面的 awk 命令，输出结果如下

```sh
(10 OR 6) = 14
```

## 异或 xor(num1,num2)

**异或** 就是位操作符 ^，当两个数字的二进制格式的相同的位相同时返回 0，不同则返回 1

例如3 ^ 5 的结果为 6 演示如下

```sh
3       1 1
5     1 0 1
& ---------
6     1 1 0
```

函数xor() 用于返回两个数字的 **异或** 结果，语法格式如下

```sh
number xor(num1, num2)
```

### 范例

```sh
[www.ddkk.com]$ awk 'BEGIN {
   num1 = 10
   num2 = 6
   printf "(%d XOR %d) = %d\n", num1, num2, xor(num1, num2)
}'
```

运行上面的 awk 命令，输出结果如下

```sh
(10 bitwise xor 6) = 12
```
