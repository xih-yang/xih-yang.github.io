# 03、Shell 传递参数
- 来源：https://ddkk.com/zhuanlan/other/shell/3.html
- 分类：Shell 教程
- 分组：教程目录
我们在执行 shell 脚本时可以向脚本传递参数。shell 脚本内可以获取我们传递的参数

## 向 shell 脚本传递参数

向脚本传递的参数以空格分开，空格数量没限制，但至少一个。 在 shell 脚本内获取参数的格式为： `$` n。

**n** 代表一个数字，1 为执行脚本的第一个参数，2 为执行脚本的第二个参数，以此类推...

> 注意: ** $ 0** 为执行的文件名

#### 范例：脚本内获取传递的参数

以下范例我们向脚本传递三个参数，然后分别输出这些参数

```sh
#!/bin/bash
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
echo "Shell 传递参数范例！";
echo "执行的文件名：$0";
echo "第一个参数为：$1";
echo "第二个参数为：$2";
echo "第三个参数为：$3";
```

为脚本设置可执行权限，并执行脚本，输出结果如下：

```sh
$ chmod +x demo.sh 
$ sh ./demo.sh  shell脚本编程 28 http://www.ddkk.com
Shell 传递参数范例！
执行的文件名：demo.sh
第一个参数为：shell脚本编程
第二个参数为：28
第三个参数为：http://www.ddkk.com
```

## 几个用来处理参数的特殊字符

特殊字符
描述

 `$` #
传递到脚本的参数个数

 `$` *
以一个单字符串显示所有向脚本传递的参数。
如  `$` * 用「"」括起来的情况、以" `$` 1 `$` 2 … `$` n"的形式输出所有参数

 `$` `$`
脚本运行的当前进程ID号

 `$` !
后台运行的最后一个进程的ID号

 `$` @
与 `$` *相同，但是使用时加引号，并在引号中返回每个参数。
如" `$` @"用「"」括起来的情况、以" `$` 1" " `$` 2" … " `$` n" 的形式输出所有参数。

 `$` -
显示Shell使用的当前选项，与 set 命令 功能相同

 `$` ?
显示最后命令的退出状态。0表示没有错误，其他任何值表明有错误。

#### 范例： 获取传递参数的个数

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
echo "Shell 传递参数实例！";
echo "第一个参数为：$1";
echo "参数个数为：$#";
echo "传递的参数作为一个字符串显示：$*";
```

运行脚本输出结果如下：

```sh
$ sh demo.sh  shell脚本编程    28 http://www.ddkk.com hello
Shell 传递参数实例！
第一个参数为：shell脚本编程
参数个数为：4
传递的参数作为一个字符串显示：shell脚本编程 28 http://www.ddkk.com hello
```

### $ * 与 $ @ 区别：

- 相同点：都是引用所有参数
- 不同点：只有在双引号中体现出来。 假设在脚本运行时写了三个参数 1 2 3，则 " * " 等价于 "1 2 3"（传递了一个参数），而 "@" 等价于 "1" "2" "3"（传递了三个参数）

#### 范例： shell 脚本 $ * 与 $ @ 的区别

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
echo "-- \$* 演示 ---"
for i in "$*"; do
    echo $i
done
echo ""
echo "-- \$@ 演示 ---"
for i in "$@"; do
    echo $i
done
```

执行脚本，输出结果如下所示：

```sh
$ sh demo.sh  shell脚本编程    28 http://www.ddkk.com hello
-- $* 演示 ---
shell脚本编程 28 http://www.ddkk.com hello
-- $@ 演示 ---
shell脚本编程
28
http://www.ddkk.com
hello
```
