# 11、AWK 字符串拼接符
- 来源：https://ddkk.com/zhuanlan/other/awk/11.html
- 分类：Awk 教程
- 分组：教程目录
别家的语言，字符串拼接符好歹也是看得见分的清楚的，比如 PHP 家的字符串拼接符是 **点号（ . ）** ，比如 Python 家的是 **加号（ + ）**

AWK家的字符串拼接符，竟然是 **空格 ( ' ' )**。 你能分得清这到底是拼接符还是空白符嘛？

## AWK 字符串拼接符 - 空格 ( ' ' )

AWK语言使用 **空格 ( ' ' )** 作为字符串拼接符。

需要注意的是，空格没有限制，你可以任意多个。

```sh
[www.ddkk.com]$ awk 'BEGIN { str1 = "你好，"; str2 = "DDKK.COM 弟弟快看，程序员编程资料站"; str3 = str1 str2; print str3 }'
[www.ddkk.com]$ awk 'BEGIN { str1 = "你好，"; str2 = "DDKK.COM 弟弟快看，程序员编程资料站"; str3 = str1      str2; print str3 }'
```

运行上面的 awk 命令，输出结果如下

```sh
你好，DDKK.COM 弟弟快看，程序员编程资料站
你好，DDKK.COM 弟弟快看，程序员编程资料站
```
