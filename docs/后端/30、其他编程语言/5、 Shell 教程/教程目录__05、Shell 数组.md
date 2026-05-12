# 05、Shell 数组
- 来源：https://ddkk.com/zhuanlan/other/shell/5.html
- 分类：Shell 教程
- 分组：教程目录
数组中可以存放多个值

Bash Shell 只支持一维数组，不支持多维数组

## 声明数组

Shell 的数组在初始化时不需要定义数组大小。

#### Shell 数组语法格式如下：

```sh
array_name=(value1 ... valuen)
```

Shell 数组元素的下标由0开始，这与大部分编程语言都类似。

Shell 数组用括号来表示，元素用 "空格" 符号分割开

#### 范例：在 shell 中声明数组

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
my_arr=(A B "C" D)
echo ${my_arr[*]}
```

我们也可以使用下标来定义数组:

```sh
array_name[0]=value0
array_name[1]=value1
array_name[2]=value2
```

### 读取数组元素

读取数组元素值的一般格式是：

```sh
${array_name[index]}
```

#### 范例： 读取数组元素

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
my_arr=(A B "C" D)
echo "第一个元素为: ${my_arr[0]}"
echo "第二个元素为: ${my_arr[1]}"
echo "第三个元素为: ${my_arr[2]}"
echo "第四个元素为: ${my_arr[3]}"
```

运行脚本输出结果如下：

```sh
$ sh demo.sh
第一个元素为: A
第二个元素为: B
第三个元素为: C
第四个元素为: D
```

## 获取数组中的所有元素

使用@ 或 * 可以获取数组中的所有元素

#### 范例：使用 @ 或 * 可以获取数组中的所有元素

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
my_arr=(A B "C" D)
echo "数组的元素为: ${my_arr[*]}"
echo "数组的元素为: ${my_arr[@]}"
```

运行脚本输出结果如下：

```sh
$ sh demo.sh
数组的元素为: A B C D
数组的元素为: A B C D
```

### 获取数组的长度

使用 `$` {#数组名[*]} 或 `$` {#数组名[*]} 可以获取数组长度

#### 范例: 获取数组长度

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
my_arr=(A B "C" D)
echo "数组元素个数为: ${#my_arr[*]}"
echo "数组元素个数为: ${#my_arr[@]}"
```

运行脚本输出结果如下:

```sh
$ sh demo.sh
数组元素个数为: 4
数组元素个数为: 4
```
