# 09、Shell test 命令
- 来源：https://ddkk.com/zhuanlan/other/shell/9.html
- 分类：Shell 教程
- 分组：教程目录
Linux 提供了一个非常有趣而且有用的命令 test, 它能够用来测试某个条件是否成立

Shell 中的 test 命令可以用于检查某个条件是否成立，它可以进行数值、字符和文件三个方面的测试

## 1. 数值测试

参数
描述

-eq
等于则为真，否则为假

-ne
不等于则为真，否则为假

-gt
大于则为真，否则为假

-ge
大于等于则为真，否则为假

-lt
小于则为真，否则为假

-le
小于等于则为真，否则为假

### 范例 1： 用 test 命令做数值测试

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
num1=100
num2=100
if test $[num1] -eq $[num2]
then
    echo "$[num1]，${num2} 两个数相等！"
else
    echo "${num1}，${num2} 两个数不相等！"
fi
```

运行sh demo.sh 输出结果：

```sh
100，100 两个数相等！
```

### 代码中的 [] 可以执行基本的算数运算

#### 范例 2： [] 可以执行基本的算数运算

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
a=7
b=17
result=$[a+b] # 注意等号两边不能有空格
echo "result 为： $result"
```

结果为:

```sh
result 为： 24
```

## 字符串测试

参数
描述

=
等于则为真，否则为假

!=
不相等则为真，否则为假

-z 字符串
字符串的长度为零则为真，否则为假

-n 字符串
字符串的长度不为零则为真，否则为假

### 范例 3： 用 test 命令做字符串测试

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
str1="ddkk.cn"
str2="DDKK.COM 弟弟快看，程序员编程资料站"
if test $str1 = $str2
then
    echo '两个字符串相等!'
else
    echo '两个字符串不相等!'
fi
```

输出结果：

```sh
两个字符串不相等!
```

## 文件测试

参数
描述

-e 文件名
如果文件存在则为真

-r 文件名
如果文件存在且可读则为真

-w 文件名
如果文件存在且可写则为真

-x 文件名
如果文件存在且可执行则为真

-s 文件名
如果文件存在且至少有一个字符则为真

-d 文件名
如果文件存在且为目录则为真

-f 文件名
如果文件存在且为普通文件则为真

-c 文件名
如果文件存在且为字符型特殊文件则为真

-b 文件名
如果文件存在且为块特殊文件则为真

### 范例 4： 用 test 命令做文件测试

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
cd /sbin
if test -e ./ping
then
    echo '文件已存在!'
else
    echo '文件不存在!'
fi
```

执行范例输出结果：

```sh
文件已存在!
```

## 其它测试

除了上面的三种，Shell 还提供了 与( -a )、或( -o )、非( ! )三个逻辑操作符用于将测试条件连接起来，其优先级为："!" 最高，"-a" 次之，"-o" 最低

### 范例 5：与或非测试

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
cd /bin
if test -e ./notFile -o -e ./bash
then
    echo '有一个文件存在!'
else
    echo '两个文件都不存在'
fi
```

执行范例输出结果：

```sh
有一个文件存在!
```
