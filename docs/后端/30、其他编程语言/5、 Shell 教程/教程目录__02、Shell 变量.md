# 02、Shell 变量
- 来源：https://ddkk.com/zhuanlan/other/shell/2.html
- 分类：Shell 教程
- 分组：教程目录
和其它语言类似，shell 脚本也可以定义变量，但在 shell 脚本中定义变量时，变量名不用像 PHP 变量那样加美元符号，也不用像 C 语言那样使用数据类型来指定变量的数据类型

## shell 变量范例

```sh
your_name="ddkk.cn"
```

变量名的命名须遵循如下规则：

- 首个字符必须为字母（a-z，A-Z）
- 中间不能有空格，可以使用下划线（_）
- 不能使用标点符号
- 不能使用 bash 里的关键字（可用 help 命令查看保留关键字）

> 注意: 变量名和等号之间不能有空格，这可能和你熟悉的所有编程语言都不一样

#### 范例: 声明变量

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
your_name="DDKK.COM 弟弟快看，程序员编程资料站"
echo $your_name
```

运行范例，输出结果

```sh
$ sh demo.sh
DDKK.COM 弟弟快看，程序员编程资料站
```

除了显式地直接赋值，还可以使用语句给变量赋值

如：

```sh
for file in ls /etc
```

这条语句将 /etc 下目录的文件名循环出来

#### 范例2: 使用语句给变量赋值

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
for file in ls .
do
    echo $file
done
```

运行范例输出结果

```sh
$ sh demo.sh
demo.sh
demo1.sh
demo2.sh
saveHtml
users
```

## 使用变量

使用一个定义过的变量，只要在变量名前面加美元符号即可

如：

```sh
your_name="DDKK.COM 弟弟快看，程序员编程资料站"
echo $your_name
echo ${your_name}
```

#### 范例： shell 变量的使用

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
your_name="DDKK.COM 弟弟快看，程序员编程资料站"
echo $your_name
echo ${your_name}
```

运行范例，输出结果

```sh
$ sh demo.sh
DDKK.COM 弟弟快看，程序员编程资料站
DDKK.COM 弟弟快看，程序员编程资料站
```

**变量名外面的花括号是可选的，加不加都行。因为加花括号是为了帮助解释器识别变量的边界**

比如下面这种情况：

```sh
for skill in PHP JAVA Python Perl Shell; do
    echo "我精通: ${skill}Script"
done
```

如果不给skill变量加花括号，写成 echo "我精通: `$` skillScript"，解释器就会把 `$` skillScript 当成一个变量（其值为空），代码执行结果就不是我们期望的样子了

> 建议给所有变量加上花括号，这是个好的编程习惯。

**已定义的变量，可以被重新定义** 如：

```sh
your_name="tom"
echo $your_name
your_name="alibaba"
echo $your_name
```

> 注意 第二次赋值的时候不能写 $ your_name="alibaba" , 使用变量的时候才加美元符（ $ ）

## 只读变量

使用readonly 命令可以将变量定义为只读变量，只读变量的值不能被改变

下面的范例尝试更改只读变量，结果报错：

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
website="http://www.jiandanjiaocheng.com"
readonly website
website="https://www.ddkk.com"
```

运行脚本输出如下结果：

```sh
$ sh demo.sh
demo.sh: line 8: website: readonly variable
```

## 删除变量

使用unset 命令可以删除变量。

unset命令语法格式如下：

```sh
unset variable_name
```

变量被删除后不能再次使用

#### 范例：删除变量

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
website="http://www.jiandanjiaocheng.com"
unset website
echo $website
```

脚本执行结果如下

```sh
$ sh demo.sh
```

**unset 命令不能删除只读变量。**

#### 范例:unset 命令不能删除只读变量

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
website="http://www.jiandanjiaocheng.com"
readonly website
unset website
echo $website
```

脚本执行结果如下

```sh
$ sh demo.sh 
demo.sh: line 8: unset: website: cannot unset: readonly variable
http://www.jiandanjiaocheng.com
```

## 变量作用域

运行shell 时，会同时存在三种变量作用域：

**1、局部变量** 局部变量在脚本或命令中定义，仅在当前shell实例中有效，其他shell启动的程序不能访问局部变量

**2、环境变量** 所有的程序，包括shell启动的程序，都能访问环境变量，有些程序需要环境变量来保证其正常运行。必要的时候shell脚本也可以定义环境变量

**3、shell 变量** shell 变量是由 shell 程序设置的特殊变量。shell 变量中有一部分是环境变量，有一部分是局部变量，这些变量保证了shell的正常运行

## Shell 注释

以 # 开头的行就是注释，会被解释器忽略

sh 里没有多行注释，如果要注释多行，只能每一行加一个 # 号。比如

```sh
#--------------------------------------------
# 这是一个多行注释
# author：DDKK.COM 弟弟快看，程序员编程资料站
# site：  www.ddkk.com
# slogan：DDKK.COM 弟弟快看，程序员编程资料站
#--------------------------------------------
##### 用户配置区 开始 #####
#
#
# 这里可以添加脚本描述信息
# 
#
##### 用户配置区 结束  #####
```

### 最佳编程实战之 shell 注释

如果在开发过程中，遇到大段的代码需要临时注释起来，过一会儿又取消注释，怎么办呢？

每一行加个 # 符号太费力了，可以把这一段要注释的代码用一对花括号括起来，定义成一个函数。

没有地方调用这个函数，这块代码就不会执行，达到了和注释一样的效果。

> 这条实战使用了封装的概念
