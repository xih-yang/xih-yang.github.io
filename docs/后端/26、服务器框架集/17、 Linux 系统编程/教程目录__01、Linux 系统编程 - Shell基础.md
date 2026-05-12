# 01、Linux 系统编程 - Shell基础
- 来源：https://ddkk.com/zhuanlan/server/linux/3/1.html
- 分类：服务器框架
- 分组：教程目录
## shell的概述

### 1. shell

> shell本质是脚本文件：完成批处理。
>
> shell是软件也是语言。

软件：shell命令解析器：（sh、ash、bash），将脚本文件逐行解析执行。

### 2. 系统默认调用的两个脚本文件

`/etc/profile` : 对系统的所有用户都有效，用户登录系统的时候执行。

`~/.bashrc`:对登录的用户有效，用户登录，打开终端。

### 3. shell语法

> 1 、定义开头：#!/bin/bash
>
> 指明脚本解析器用bash
>
> 2、写脚本
>
> 3、给脚本增加可执行权限
>
> chmod +x 脚本文件
>
> 4、执行脚本文件
>
> ./00_shell.sh　　　　先检测#！ 使用#！指定的shell，如果没有使用默认的shell
>
> . 00_shell.sh　　　　使用当前shell解析00_shell.sh
>
> bash 00_shell.sh　　直接指定试用bash解析00_shell.sh

`注：`用`./`和`ash`去执行会在后台启动一个新的shell去执行脚本

用`.`去执行脚本不会启动新的shell，直接由当前的shell去解析执行脚本。

#### 3.1 自定义变量

> 变量定义中不能带空格

```java
#!/bin/bash
# 定义变量
num=10
# 对变量读操作
echo $num
# 对变量写操作
num=100
echo $num
# 清除变量
unset num
echo "---$num"
```

`注：`脚本逐行解析，前面有错误，影响不大的话不影响后面代码的执行。

#### 3.2 获取键盘输入

```java
#!/bin/bash
num=0
# 从键盘获取变量的值      -p先打印再从键盘获取变量
read -p "请输入num的值：" num
echo "num = $num"
```

#### 3.3 只读变量

```java
# 只读变量
readonly num=10
echo "num=$num"
num=1000			#报错
echo "num=$num"		#打印结果仍为10
```

#### 3.4 将脚本的变量导出为环境变量

> 直接使用系统的环境变量
>
> 显示环境变量 env
>
> 清除环境变量 unset

```java
#!/bin/bash
# 直接使用系统的环境变量
echo "PWD=$PWD"
#将shell的变量导出为环境变量, source次脚本后，其他脚本也能使用这个环境变量，重启终端后此环境变量消失
export num=1000
echo "num=$num"
```

注：也可在终端上直接输入`export num=1000`

#### 3.5 变量的注意事项

> 1. 命名规则
>
> 变量名由字母、数字、下划线组成，不能以数字开头，不能是关键字。

> 2. 变量使用时注意点

```java
		# 等号两边不能直接接空格符
		num = 100 		# 错误
		num=100			# ok
		# 若变量中本身就包含了空格，则整个字符串都要用双引号、或单引号括起来
		num=10 20 30 		# 错误
		num="10 20 30" 		# ok
		num='10 20 30' 		# ok
```

> 3. 双引号和单引号的区别
>
> 双引号内的特殊字符可以保有变量特性，但是单引号内的特殊字符则仅为一般字符

#### 3.6 修改环境变量的值

增加环境变量（终端下）

```java
export NUM=10
```

在原本的环境变量下追加值（终端下）

```java
export NUM=$NUM:20			# $SUM为原来的值
```

#### 3.7 预设变量

> $#:传给shell脚本参数的数量
> $*:传给shell脚本参数的内容
> $?:命令执行后返回的状态
> $0:当前执行的进程名
> $$:当前进程的进程号
> $1、$2、... 、$9:运行脚本时传递给其他的参数，用空格隔开
> "$$":变量最常见的用途是用作临时文件的名字以保证临时文件不会重复
> "$?":用于检查上一个命令执行是否正确（在Linux中，命令退出状态为0表示该命令正在执行。）

#### 3.8 脚本的特殊用法

> ""(双引号）：包含的变量会被解释
>
> ''(单引号）：包含的变量会当做字符串解释
>
> ``(数字键1左面的反引号)：反引号中的内容作为系统命令，并执行其内容，可以替换输出为一个变量
>
> \转义字符：同C语言\n \t \r \a等echo命令需加-e转义
>
> (命令序号)：由子shell来完成，不影响当前shell中的变量
>
> {命令序列}：在当前shell中执行，会影响当前变量

#### 3.9 条件测试语句

**语法1：使用关键字test**

```java
#!/bin/bash
test condition
```

**语法2：使用[ ]**

```java
#!/bin/bash
[ condition ]　　　　　　＃ condition左右两侧有空格
```

##### 3.9.1 文件测试

> 测试文件状态的条件表达式

`-e`：文件是否存在

`-d`：是否是文件夹\目录

`-f`：是否是文件

`-r`：是否可读

`-w`：是否可写

`-x`：是否可执行

`-L`：是否符号连接

`-c`：是否是字符设备

`-b`：是否是块设备

`-s`：文件是否为空

```java
#!/bin/sh
test -e test.txt
echo "$?"　　　　　　# 1 文件不存在
[ -e test.txt ]　　 
echo "$?"　　　　　　# 1 文件不存在
[ -d a ]　　
echo "$?"　　　　　　# 0 是文件夹
test -f a 
echo "$?"　　　　　　# 1 不是普通文件
```

##### 3.9.2 字符串测试

> 字符串测试格式如下：
>
> test str_operator "str"
>
> test "str1" str_operator "str2"
>
> str_operator "str"
>
> [ "str1" str_operator "str2" ]

其中`str_operator`可以是：

`=`：两个字符串相等

`!=`：两个字符串不相等

`-z`：空串

`-n`：非空串

```java
#!/bin/bash
str1=""
test -z "$str1"
echo "$?"　　　　　　　　　　# 0 表示空串
str2="hello string"
echo "$?"　　　　　　　　　　# 1 表示非空串
str3="hehe"
str4="haha"
test "$str3" = "$str4"
echo "$?"　　　　　　　　　　# 1 不相等
test "$str3" != "$str4"
echo "$?"　　　　　　　　　　# 0 不相等
```

##### 3.9.3 字符串的操作扩展

```java
#!/bin/bash
str="hehe:haha:xixi:lala"
# 测量字符串的长度 ${#str}
echo "str的长度为：${
     str}"　　　　　　　# 19
# 从下标3的位置提取 ${str:3}
echo ${str:3}　　　　　　　　　　　　　　# "e:haha:xixi:lala"
# 从下标为3的位置提取长度为6的字节
echo ${str:3:6}　　　　　　　　　　　　　# "e:haha"
# ${str/old/new} 用new替换str中出现的第一个old
echo ${str/:/#}　　　　　　　　　　　　　# "hehe#haha:xixi:lala"
# ${str//old/new} 用new替换str中所有的old
echo ${str//:/#}　　　　　　　　　　　　# "hehe#haha#xixi#lala"
```

##### 3.9.4 数值测试

> 测试数字格式如下：
>
> test num1 num_operator num2
>
> num1 num_operator num2

`-eq`：数值相等

`-ne`：数值不相等

`-gt`：数1大于数2

`-ge`：数1大于等于数2

`-le`：数1小于等于数2

`-lt`：数1小于数2

```java
#!/bin/bash
read -p "请输入两个数值数据" data1 data2
# 判断是否相等
test $data1 -eq $data2
# 判断是否大于
[ $data1 -gt $data2 ]
echo "$?"
```

##### 3.9.5 数值的扩展

```java
#!/bin/bash
# ${num:-val} 如果num存在，整个表达式的值为num，否则为val
echo ${num:-100}            100
num=200
echo ${num:-100}            200
# ${num:=val} 如果num存在，整个表达式的值为num，否则为val，并创建num，将val的值赋给num
echo ${num:=100}           100
echo "num=$num"            100
```

##### 3.9.6 复合测试

> 命令执行控制：
>
> command1 && command2
>
> command1 || command2

`&&`：&&左边命令（command1）执行成功（即返回0）shell才执行&&右边的命令（command2）

`||`：||左边的命令（command1）未执行成功（即返回非0）shell才执行||右边的命令（command2）

```java
#!/bin/bash
test -e /home && test -d /home && echo "true"
test 2 -lt 3 && test 5 -gt 3 &&echo "equal"
test "aaa" = "aaa" || echo "not equal" && echo "equal"
```

> 多重条件判定

command
description

-a
(and)两状况同时成立
test -r file -a -x file
file同时具有r与x权限时，才为true

-o
(or)两状况任何一个成立
test -r file -o -x file
file具有r或x权限时，就传回true

!
相反状态
test ! -x file
当file不具有x时，回传true

```java
#!/bin/bash
test -f test.c && test -r test.c && test -w test.c
# 等价
test -f test.c -a -r test.c -a -w test.c
```

#### 3.10 if控制语句

**格式一：**

```java
if [ 条件1 ];then       if后空格，条件1左右两侧空格
	执行第一段程序          执行第一段程序前需要用tab键
else
	执行第二段程序          执行第二段程序前需要用tab键
fi
```

> 例：查看当前某个文件是否存在，如果存在查看文件内容，不存在创建改文件，赋值内容输出内容

```java
#!/bin/bash
read -p "请输入一个文件名" fileName
if [ -e $fileName ];then
	if [ -f $fileName -a -s $fileName ];then
		cat $fileName
	else
		echo "存在,但不是普通文件或者为空文件"
	fi
else
	# 文件不存在，创建文件
	touch $fileName
	echo "hello file" >> $fileName
	cat $fileName
fi
```

**格式二：**

```java
if [ 条件1 ];then       if后空格，条件1左右两侧空格
	　执行第一段程序     执行第一段程序前需要用tab键
elif [ 条件2 ];then     elif后空格,条件2左右两侧空格
	  执行第二段程序     执行第二段程序前需要用tab键
else
	　执行第三段程序     执行第三段程序前需要用tab键
fi
```

```java
#!/bin/bash
read -p "请输入你的选择(yes/no):" yes
if [ $yes = "yes" ];then
	echo "选择了yes"
elif [ $yes = "no" ];then
	echo "选择了no"
else
	echo "选择了其他"
fi
```

#### 3.11 case控制语句

**语法：**

```java
case $变量名称 in
	"第一个变量内容")
		程序段一
		;;
	"第二个变量内容")
		程序段二
		;;
	*)
		其他程序段
		exit 1
		;;
esac
```

**例：**

```java
#!/bin/bash
read -p "请输入你的选择(yes/no):" yes
case $yes in
	y* | Y*)
		echo "选择了yes"
		;;
	n* | N*)
		echo "选择了no"
		;;
	*)
		echo "选择了其他"
		exit 1
		;;
esac
```

#### 3.12 for循环语句

**格式一：**

```java
for (( 初始值; 限制值; 执行步阶 ))
do
	程序段
done
# 初始值：变量在循环中的起始值
# 限制值：当变量值在这个限制范围内时，就继续进行循环
# 执行步阶：每作一次循环时，变量的变化值
```

**例：**

```java
#!/bin/bash
# declare是bash的一个内建命令，可以用来声明shell变量、设置变量的属性。declare也可以写作为typeset。
# declare -i sum 代表强制把sum变量当做int型参数运算
declare -i i=0
declare -i sum=0
for (( i=0; i<=100; i++ ))
do
	sum=$sum+$i
done
echo "sum=$sum"
```

**格式二：**

```java
for var in con1 con2 con3 ...
do
	程序段
done
# 第一次循环时，$var的内容为con1
# 第二次循环时，$var的内容为con2
# 第三次循环时，$var的内容为con3
# ...
```

**例：**

```java
#!/bin/bash
for i in 10 20 30 40 50
do
	echo "i=$i"
done
```

**例：扫描当前目录的文件**

```java
#!/bin/bash
for fileName in ls                ls把当前目录全部列出到in后面
do
	if [ -d $fileName ];then        如果fileName是文件夹
		echo "$fileName为文件夹"
	elif [ -f $fileName ];then      如果fileName是普通文件
		case $fileName in
			*.sh)					# 如果fileName是脚本文件
			echo "$fileName为脚本文件"
		esac
	fi
done
```

> 注：break跳出循环，continue直接进入下一次循环

#### 3.13 while循环语句

**格式**

```java
while [ condition ]  当condition成立的时候进入while循环，直到condition不成立时才退出循环
do 
	程序段
done
```

**例**

```java
#!/bin/bash
declare -i i=0
declare -i sum=0
while [ $i -le 100 ]    i<100
do
	sum+=$i
	i=$i+1
done
echo "sum=$sum"
```

#### 3.14 until循环语句

**格式**

```java
until [ condition ]
do
	程序段
done
```

> 注：这种方式与while恰恰相反，当condition成立时的时候退出循环，否则继续循环。
>
> 例

```java
#!/bin/bash
declare -i i=0
declare -i sum=0
while [ $i -gt 100 ]    i>100
do
	sum+=$i
	i=$i+1
done
echo "sum=$sum"
```

#### 3.15 shell函数

> 有些脚本段间相互重复，如果能只写一次代码块而在任何地方都能引用那就提高了代码的可重用性。
>
> shell允许将一组命令集或语句形成一个可用块，这些块称为shell函数。

**定义函数的两种格式**

**格式一：**

```java
函数名() 
{
	命令 ...
}
```

**格式二：**

```java
function 函数名() 
{
	命令 ...
}
```

**例1：封装一个函数计算两个数据的和**

```java
#!/bin/bash
declare -i a
# 函数定义
function my_add()
{
	a=$1+$2 
	return $a
}
read -p "请输入两个数值：" data1 data2
# 函数调用
my_add $data1 $data2    $data1传给$1，$data2传给$2
# $?代表函数的返回值
echo "函数的返回值为$?"
```

**例2：入其他文件的脚本**

```java
#!/bin/bash
# 导入其他文件的脚本 如_shell.sh
source _shell.sh
declare -i a
read -p "请输入两个数值：" data1 data2
# 函数调用
my_add $data1 $data2    my_add从其他文件_shell.sh中调用，本文件中没有
# $?代表函数的返回值
echo "函数的返回值为$?"
```
