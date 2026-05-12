# 21、AWK 数组
- 来源：https://ddkk.com/zhuanlan/other/awk/21.html
- 分类：Awk 教程
- 分组：教程目录
AWK中的数组和 PHP 中的数组类似，既可以是普通数组，也可以是关联数组。也就是说，数组的索引/下标不必是连续的数字。

我们既可以把它当作普通数组那样来用，使用连续的数字作为索引。也可以把它当作关联数组来用，也就是键值对了。

此外，AWK 中的数组不用事先声明数组的大小。数组可以在运行时动态的增常。

## 创建数组

AWK中创建数组的语法很简单，创建数组和给数组添加/修改元素的方式语法一样，即

```sh
array_name[index] = value
```

**1、** array_name是数组的名字；

**2、** index是数组的索引；

**3、** value是分配给index下标/索引的值；

## 访问数组

访问数组的元素也是通过下标语法

```sh
array_name[index]
```

我们已经知道了创建数组的语法，下面，我们就来创建一个数组，以水果作为键，以水果颜色作为值。

```sh
[www.ddkk.com]$ awk 'BEGIN {
   fruits["芒果"] = "橘色";
   fruits["橘子"] = "黄色"
   print fruits["橘子"] "\n" fruits["芒果"]
}'
```

运行以上 awk 命令，输出结果如下

```sh
橘色
黄色
```

从上面的代码中可以看出，访问数组的方式也很简单，就是使用 array_name[index]

## 删除数组元素

向数组插入元素，我们使用的是 **赋值运算符**。

而从数组中删除元素，我们可以使用 **delete** 语句。

**delete** 关键字用于从数组中删除一个元。

它的语法格式如下

```sh
delete array_name[index]
```

### 范例

下面的代码，我们使用 **delete** 语句从数组中删除 orange 元素。

```sh
[www.ddkk.com]$ awk 'BEGIN {
   fruits["mango"] = "yellow";
   fruits["orange"] = "orange";
   delete fruits["orange"];
   print fruits["orange"]
}'
```

运行以上 awk 命令，输出结果如下

```sh

```

从输出中可以看到，元素被删除之后，就不存在于数组中了。

## 多维数组

AWK仅仅只支持一维数组。也就是不支持多维数组。

但是，我们可以使用一维数组来模拟多维数组。

例如，下面这个 3x3 的二维数组

```sh
100   200   300
400   500   600
700   800   900
```

array[0][0] 存储着值 100，array[0][1] 存储着值 200 ，因此类推...

为了在位置 [0][0] 存储 100， 在 AWK 中可以这么做

```sh
array["0,0"] = 100
```

虽然，看起来我们使用 0,0作为索引，但这些不是两个索引。实际上，它只是一个字符串 "0,0" 的索引。

使用这种方式，我们就可以轻松模拟多维数组

```sh
[www.ddkk.com]$ awk 'BEGIN {
   array["0,0"] = 100;
   array["0,1"] = 200;
   array["0,2"] = 300;
   array["1,0"] = 400;
   array["1,1"] = 500;
   array["1,2"] = 600;
   # print array elements
   print "array[0,0] = " array["0,0"];
   print "array[0,1] = " array["0,1"];
   print "array[0,2] = " array["0,2"];
   print "array[1,0] = " array["1,0"];
   print "array[1,1] = " array["1,1"];
   print "array[1,2] = " array["1,2"];
}'
```

运行以上 awk 命令，输出结果如下

```sh
array[0,0] = 100
array[0,1] = 200
array[0,2] = 300
array[1,0] = 400
array[1,1] = 500
array[1,2] = 600
```

通过0,1 这种字符串索引，我们还可以对多维数组执行各种操作，例如对 **元素/索引** 进行排序。而且，我们还可以使用 assort 和 asorti 函数对数组进行排序
