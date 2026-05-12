# 37、Python 教程 - pip和operator 模块
- 来源：https://ddkk.com/zhuanlan/other/python/5/37.html
- 分类：Python 快速上手
- 分组：教程目录
### pip

pip是 Python 包管理工具，该工具提供了对 Python 包的查找、下载、安装、卸载的功能。

软件包也可以在 [https://pypi.org/](https://pypi.org/) 中找到。

目前最新的 Python 版本已经预装了 pip。

查看是否已经安装 pip 可以使用以下命令：

> pip --version

下载安装包使用以下命令：

> pip install some-package-name

例如我们安装 numpy 包：

> pip install numpy

我们也可以轻易地通过以下的命令来移除软件包：

> pip uninstall some-package-name

例如我们移除 numpy 包：

> pip uninstall numpy

如果要查看我们已经安装的软件包，可以使用以下命令：

> pip list

### operator 模块

Python2.x 版本中，使用 cmp() 函数来比较两个列表、数字或字符串等的大小关系。

Python 3.X 的版本中已经没有 cmp() 函数，如果你需要实现比较功能，需要引入 operator 模块，适合任何对象，包含的方法有：

```java
operator.lt(a, b)
operator.le(a, b)
operator.eq(a, b)
operator.ne(a, b)
operator.ge(a, b)
operator.gt(a, b)
operator.__lt__(a, b)
operator.__le__(a, b)
operator.__eq__(a, b)
operator.__ne__(a, b)
operator.__ge__(a, b)
operator.__gt__(a, b)
```

operator.lt(a, b) 与 a  b 相同，operator.ge(a, b) 与 a >= b 相同。

```java
# 导入 operator 模块
import operator
# 数字
x = 10
y = 20
print("x:",x, ", y:",y)
print("operator.lt(x,y): ", operator.lt(x,y))
print("operator.gt(y,x): ", operator.gt(y,x))
print("operator.eq(x,x): ", operator.eq(x,x))
print("operator.ne(y,y): ", operator.ne(y,y))
print("operator.le(x,y): ", operator.le(x,y))
print("operator.ge(y,x): ", operator.ge(y,x))
print()
# 字符串
x = "Google"
y = "Caiyua"
print("x:",x, ", y:",y)
print("operator.lt(x,y): ", operator.lt(x,y))
print("operator.gt(y,x): ", operator.gt(y,x))
print("operator.eq(x,x): ", operator.eq(x,x))
print("operator.ne(y,y): ", operator.ne(y,y))
print("operator.le(x,y): ", operator.le(x,y))
print("operator.ge(y,x): ", operator.ge(y,x))
print()
# 查看返回值
print("type((operator.lt(x,y)): ", type(operator.lt(x,y)))
```

以上代码输出结果为：

> x: 10 , y: 20
>
> operator.lt(x,y): True
>
> operator.gt(y,x): True
>
> operator.eq(x,x): True
>
> operator.ne(y,y): False
>
> operator.le(x,y): True
>
> operator.ge(y,x): True

> x: Google , y: Caiyua
>
> operator.lt(x,y): False
>
> operator.gt(y,x): False
>
> operator.eq(x,x): True
>
> operator.ne(y,y): False
>
> operator.le(x,y): False
>
> operator.ge(y,x): False

比较两个列表：

```java
# 导入 operator 模块
import operator
a = [1, 2]
b = [2, 3]
c = [2, 3]
print("operator.eq(a,b): ", operator.eq(a,b))
print("operator.eq(c,b): ", operator.eq(c,b))
```

以上代码输出结果为：

> operator.eq(a,b): False
>
> operator.eq(c,b): True

### 运算符函数

operator 模块提供了一套与 Python 的内置运算符对应的高效率函数。例如，operator.add(x, y) 与表达式 x+y 相同。

函数包含的种类有：对象的比较运算、逻辑运算、数学运算以及序列运算。

对象比较函数适用于所有的对象，函数名根据它们对应的比较运算符命名。

许多函数名与特殊方法名相同，只是没有双下划线。为了向后兼容性，也保留了许多包含双下划线的函数，为了表述清楚，建议使用没有双下划线的函数。

```java
# Python 实例
# add(), sub(), mul()
# 导入  operator 模块
import operator
# 初始化变量
a = 4
b = 3
# 使用 add() 让两个值相加
print ("add() 运算结果 :",end="");
print (operator.add(a, b))
# 使用 sub() 让两个值相减
print ("sub() 运算结果 :",end="");
print (operator.sub(a, b))
# 使用 mul() 让两个值相乘
print ("mul() 运算结果 :",end="");
print (operator.mul(a, b))
```

以上代码输出结果为：

> add() 运算结果 :7
>
> sub() 运算结果 :1
>
> mul() 运算结果 :12

运算
语法
函数

加法
a + b
add(a, b)

字符串拼接
seq1 + seq2
concat(seq1, seq2)

包含测试
obj in seq
contains(seq, obj)

除法
a / b
truediv(a, b)

除法
a // b
floordiv(a, b)

按位与
a & b
and_(a, b)

按位异或
a ^ b
xor(a, b)

按位取反
~ a
invert(a)

按位或
a或 b
or_(a, b)

取幂
a ** b
pow(a, b)

标识
a is b
is_(a, b)

标识
a is not b
is_not(a, b)

索引赋值
obj[k] = v
setitem(obj, k, v)

索引删除
del obj[k]
delitem(obj, k)

索引取值
obj[k]
getitem(obj, k)

左移
a > b
rshift(a, b)

切片赋值
seq[i:j] = values
setitem(seq, slice(i, j), values)

切片删除
del seq[i:j]
delitem(seq, slice(i, j))

切片取值
seq[i:j]
getitem(seq, slice(i, j))

字符串格式化
s % obj
mod(s, obj)

减法
a - b
sub(a, b)

真值测试
obj
truth(obj)

比较
a = b
ge(a, b)

比较
a > b
gt(a, b)

**注：表格当中或字其实是|,但是csdn表格原因无法展示，只能用汉字表示**
