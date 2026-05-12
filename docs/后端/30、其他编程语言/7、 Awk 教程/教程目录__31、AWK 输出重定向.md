# 31、AWK 输出重定向
- 来源：https://ddkk.com/zhuanlan/other/awk/31.html
- 分类：Awk 教程
- 分组：教程目录
到目前为止，我们的 AWK 程序都是把结果输出到 **标准输出** 上。

虽然AWK 程序没有打开文件/读写文件等相应的功能，但 AWK 程序同样支持 **重定向** 操作，也就是支持把数据输出到 **文件** 上。

AWK的重定向操作一般出现在 print 或 printf 语句后面。

AWK中的重定向与 shell 命令中的重定向类似，只是它们写在 AWK 程序中。

## 重定向操作符 >`

**重定向操作符 >`** 就是把 AWK 程序的输出结果重定向到某个文件。

不过要注意的是：**重定向操作符 >** 会先删除文件的原先内容然后再写入数据，也就是说原先的内容不存在了。

**重定向操作符 >** 操作符的语法格式如下

```sh
print DATA > output-file
```

**重定向操作符 >`** 会把 print 的输出结果写入到文件 output-file 中

如果output-file 不存在，**重定向操作符 >`** 会先创建文件。

**重定向操作符 >** 会首先删除文件中的内容然后再输出，但是，对于同一个 AWK 程序中的后续的 **重定向操作符 >** 则并不会再删除原先的内容，而是在末尾追加。

也就是说，**重定向操作符 >** 在打开文件的时候就会先删除内容。后面的 **重定向操作符 >** 因为文件已经打开了，就不会再执行打开操作，也就不会删除原先的内容

### 范例 1

首先我们使用 **重定向操作符 >** 创建一个文件并写入数据

```sh
[www.ddkk.com]$ echo "旧数据：DDKK.COM 弟弟快看，程序员编程资料站欢迎您" > /tmp/message.txt
[www.ddkk.com]$ cat /tmp/message.txt
```

运行上面的 awk 命令，输出结果如下

```sh
旧数据：DDKK.COM 弟弟快看，程序员编程资料站欢迎您
```

接着，我们再使用 **重定向操作符 >** 往文件里写入一些数据，看看结果

### 范例 2

```sh
[www.ddkk.com]$ awk 'BEGIN { print "新数据：DDKK.COM 弟弟快看，程序员编程资料站欢迎您" > "/tmp/message.txt" }'
[www.ddkk.com]$ cat /tmp/message.txt
```

运行上面的 awk 命令，输出结果如下

```sh
新数据：DDKK.COM 弟弟快看，程序员编程资料站欢迎您
```

## 数据追加操作符 >>`

数据追加操作就是把输出输出到文件的末尾，而不是覆盖原先的内容。

数据追加操作符 >>` 的语法格式如下

```sh
print DATA >> output-file
```

数据追加操作符 >>` 会把 print 的输出结果 **追加** 到 output-file 文件的末尾，原先的数据还在。

如果output-file 文件不存在，那么会先创建文件然后再输入数据。

### 范例

我们首先使用 **重定向操作符 >** 创建一个文件并写入一些数据

```sh
[www.ddkk.com]$ echo "旧数据：DDKK.COM 弟弟快看，程序员编程资料站欢迎您" > /tmp/hello.txt 
[www.ddkk.com]$ cat /tmp/hello.txt
```

运行上面的 awk 命令，输出结果如下

```sh
旧数据：DDKK.COM 弟弟快看，程序员编程资料站欢迎您
```

接下来我们使用 **数据追加操作符 >>`** 往刚刚的 hello.txt 文件中追加一些数据

### 范例 2

```sh
[www.ddkk.com]$ awk 'BEGIN { print "新数据：DDKK.COM 弟弟快看，程序员编程资料站欢迎您" >> "/tmp/hello.txt" }'
[www.ddkk.com]$ cat /tmp/hello.txt
```

运行上面的 awk 命令，输出结果如下

```sh
旧数据：DDKK.COM 弟弟快看，程序员编程资料站欢迎您
新数据：DDKK.COM 弟弟快看，程序员编程资料站欢迎您
```

## 管道 |

AWK还支持管道及管道操作符 |。

也就是说我们可以使用管道代替文件将输出发送到另一个程序。

管道操作符 | 会打开一个管道，AWK 通过此管道将输出的结果写入另一个进程以执行该命令。

管道重定向参数命令实际上是 AWK 表达式。

AWK中管道 | 的语法格式如下

```sh
print items | command
```

### 范例

下面，我们使用管道 | 把输出重定向到外部的 tr 命令

```sh
[www.ddkk.com]$ awk 'BEGIN { print "hello, world !!!" | "tr [a-z] [A-Z]" }'
```

运行上面的 awk 命令，输出结果如下

```sh
HELLO, WORLD !!!
```

## 双向交流管道 |&

AWK可以使用 |& 与外部进程通信。

|& 会打开一个双向交流管道，AWK 程序可以往打开的管道进行读写，外部程序也可以往打开的管道进行读写。

AWK中|& 双向管道的语法格式如下

```sh
print items |& command
```

### 范例

```sh
BEGIN {
   cmd = "tr [a-z] [A-Z]"
   print "hello, world !!!" |& cmd
   close(cmd, "to")
   cmd |& getline out
   print out;
   close(cmd);
}
```

运行上面的 awk 命令，输出结果如下

```sh
HELLO, WORLD !!!
```

上面这段程序看起来是不是很迷茫 ？？

这估计是我们见过的最为复杂的程序了，下面我们就一步一步来拆解吧!!!

**1、** 第一行cmd="tr[a-z][A-Z]定义了一个系统命令，我们会使用这个命令开启一个**双向通讯管道**；

**2、** 第二行print"hello,world!!!"|&cmd；

我们先来看 |& cmd ，这句话的意思是使用 |& 输出重定向运算符打开一个 **双向通讯管道** 连接当前 AWK 程序和刚刚定义的命令。

然后 print "hello, world !!!" |& cmd 就是把 print 函数的输出结果重定向到刚刚定义的 **双向通讯管道**。

说的直白一点，就是 print 函数为 tr 命令提供了输入。
**3、** 第三行close(cmd,"to")用于关闭刚刚打开的**双向通讯管道**的输入进程；

**4、** 第四行cmd|&getlineout把tr命令的执行结果使用管道运算符&|重定向到getline函数getline函数会把结果储存到out变量中；

**5、** 最后一行close(cmd)用于关闭刚刚打开的**双向通讯管道**；
