# 07、Shell echo 命令
- 来源：https://ddkk.com/zhuanlan/other/shell/7.html
- 分类：Shell 教程
- 分组：教程目录
echo 翻译成中文有 回声 或 共鸣 的意思，正所谓念念不忘必有回响，也许就是这层意思，让 echo 可以输出你让它输出的内容

## echo 命令

Shell 的 echo 指令可以用于字符串的输出，如果你学过 PHP，会发现它与 PHP 的 echo 有异曲同工之妙

### echo 命令语法格式

```sh
echo string
```

我们也可以使用 echo 实现更复杂的输出格式控制

### 范例 1：显示普通字符串

```sh
$ echo "It is a test"
```

执行结果

```sh
$ echo "It is a test"
It is a test
```

这里的双引号完全可以省略，下面的范例与上面范例效果一致：

```sh
$ echo It is a test
It is a test
```

### 范例 2：显示转义字符

```sh
$ echo "\"It is a test\""
```

结果将是:

```sh
$ echo "\"It is a test\""
"It is a test"
```

> 同样，双引号也可以省略

### 范例 3: 显示变量

read 命令从标准输入中读取一行,并把输入行的每个字段的值指定给 shell 变量

```sh
#!/bin/bash
# filename: demo.sh
# author:DDKK.COM 弟弟快看，程序员编程资料站
# url:www.ddkk.com
read name 
echo "$name It is a test"
```

将以上代码保存为: demo.sh ，name 接收标准输入的变量

执行脚本输出结果

```sh
$ sh demo.sh
me                #标准输入
me It is a test   #输出        
```

### 范例 4: 使用 -e 开启转义，显示换行

```sh
$ echo -e "OK! \n" && echo "It it a test"
```

输出结果：

```sh
OK!
It it a test
```

### 范例 5: 使用 \c 显示不换行

```sh
$ echo -e "OK! \c" && echo "It is a test"
```

输出结果：

```sh
OK! It is a test
```

### 范例 6: 显示结果定向至文件

```sh
$ echo "It is a test" > myfile
$ cat myfile
It is a test
```

### 范例 7: 原样输出字符串，不进行转义或取变量(用单引号)

```sh
echo '$name\"'
```

输出结果：

```sh
$name\"
```

### 范例 8: 使用反引号\ 显示命令执行结果

```sh
echo date
```

> 注意： 这里使用的是反引号, 而不是单引号'

结果将显示当前日期

```sh
2017年 9月16日 星期六 08时24分50秒 CST
```
