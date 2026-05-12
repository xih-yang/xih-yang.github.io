# 05、Python 教程 - 数据类型转换
- 来源：https://ddkk.com/zhuanlan/other/python/5/5.html
- 分类：Python 快速上手
- 分组：教程目录
### 数据类型转换

有时候，我们需要对数据内置的类型进行转换，数据类型的转换，一般情况下你只需要将数据类型作为函数名即可。

Python 数据类型转换可以分为两种：

**隐式类型转换 - 自动完成**

**显式类型转换 - 需要使用类型函数来转换**

### 隐式类型转换

在隐式类型转换中，Python 会自动将一种数据类型转换为另一种数据类型，不需要我们去干预。

以下实例中，我们对两种不同类型的数据进行运算，较低数据类型（整数）就会转换为较高数据类型（浮点数）以避免数据丢失。

```java
num_int = 123
num_flo = 1.23
num_new = num_int + num_flo
print("datatype of num_int:",type(num_int))
print("datatype of num_flo:",type(num_flo))
print("Value of num_new:",num_new)
print("datatype of num_new:",type(num_new))
```

以上实例输出结果为：

> num_int 数据类型为:
>
> num_flo 数据类型为:
>
> num_new: 值为: 124.23
>
> num_new 数据类型为:

代码解析：

实例中我们对两个不同数据类型的变量 num_int 和 num_flo 进行相加运算，并存储在变量 num_new 中。

然后查看三个变量的数据类型。

在输出结果中，我们看到 num_int 是 整型（integer） ， num_flo 是 浮点型（float）。

同样，新的变量 num_new 是 浮点型（float），这是因为 Python 会将较小的数据类型转换为较大的数据类型，以避免数据丢失。

我们再看一个实例，整型数据与字符串类型的数据进行相加：

```java
num_int = 123
num_str = "456"
print("Data type of num_int:",type(num_int))
print("Data type of num_str:",type(num_str))
print(num_int+num_str)
```

以上实例输出结果为：

> num_int 数据类型为:
>
> num_str 数据类型为:
>
> Traceback (most recent call last):
>
> File “/dyf-test/test.py”, line 7, in
>
> print(num_int+num_str)
>
> TypeError: unsupported operand type(s) for +: ‘int’ and ‘str’

从输出中可以看出，整型和字符串类型运算结果会报错，输出 TypeError。 Python 在这种情况下无法使用隐式转换。

但是，Python 为这些类型的情况提供了一种解决方案，称为显式转换。

### 显式类型转换

在显式类型转换中，用户将对象的数据类型转换为所需的数据类型。 我们使用 int()、float()、str() 等预定义函数来执行显式类型转换。

int() 强制转换为整型：

```java
x = int(1)   x 输出结果为 1
y = int(2.8) y 输出结果为 2
z = int("3") z 输出结果为 3
```

float() 强制转换为浮点型：

```java
x = float(1)     x 输出结果为 1.0
y = float(2.8)   y 输出结果为 2.8
z = float("3")   z 输出结果为 3.0
w = float("4.2") w 输出结果为 4.2
```

str() 强制转换为字符串类型：

```java
x = str("s1") x 输出结果为 's1'
y = str(2)    y 输出结果为 '2'
z = str(3.0)  z 输出结果为 '3.0'
```

整型和字符串类型进行运算，就可以用强制类型转换来完成：

```java
num_int = 123
num_str = "456"
print("num_int 数据类型为:",type(num_int))
print("类型转换前，num_str 数据类型为:",type(num_str))
num_str = int(num_str)    强制转换为整型
print("类型转换后，num_str 数据类型为:",type(num_str))
num_sum = num_int + num_str
print("num_int 与 num_str 相加结果为:",num_sum)
print("sum 数据类型为:",type(num_sum))
```

以上实例输出结果为：

> num_int 数据类型为:
>
> 类型转换前，num_str 数据类型为:
>
> 类型转换后，num_str 数据类型为:
>
> num_int 与 num_str 相加结果为: 579
>
> sum 数据类型为:
