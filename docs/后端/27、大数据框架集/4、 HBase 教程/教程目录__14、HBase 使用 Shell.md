# 14、HBase 使用 Shell
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/14.html
- 分类：大数据框架
- 分组：教程目录
## Apache HBase Shell

Apache HBase Shell 是在（J）Ruby 的 IRB 的基础上增加了一些 HBase 特定的命令。你可以在 IRB 中做的任何事情，都可以在 HBase Shell 中完成。

要运行HBase shell，请执行如下操作：

```java
$ ./bin/hbase shell
```

输入：help，然后按 查看 shell 命令和选项的列表。至少浏览器帮助输出末尾的段落，了解如何将变量和命令参数输入到 HBase shell 中；尤其要注意表名、行和列等是如何引用的。

请参阅本教程中的快速启动HBase章节的“[shell 练习](https://www.w3cschool.cn/hbase_doc/hbase_doc-m3y62k51.html)”部分。

### 用Ruby编写脚本

有关脚本编写 Apache HBase 的示例，请查看 HBase bin 目录；查看以* .rb结尾的文件，要运行这些文件之一，请执行如下操作：

```java
$ ./bin/hbase org.jruby.Main PATH_TO_SCRIPT
```

### 以非交互模式运行 Shell

HBase Shell（HBASE-11658）添加了一种新的非交互模式。非交互模式捕获 HBase Shell 命令的退出状态（成功或失败），并将该状态返回给命令解释器。如果您使用正常的交互模式，HBase Shell 将只会返回自己的退出状态，这几乎总是会0成功的。

要调用非交互模式，请将 -n 或 –non-interactive 选项传递给 HBase Shell。

### OS脚本中的HBase Shell

您可以在操作系统脚本解释器中使用 HBase shell，例如 Bash shell，它是大多数 Linux 和 UNIX 发行版的默认命令解释程序。以下准则使用 Bash 语法，但可以调整为使用 C 样式的 shell（例如 csh 或 tcsh），并且可能会修改为使用 Microsoft Windows 脚本解释器一起使用。

注意：以这种方式生成 HBase Shell 命令的速度很慢，所以在决定何时将 HBase 操作与操作系统命令行相结合时，请记住这一点。

示例——将命令传递给 HBase Shell

您可以使用 echo 命令和 |（管道）操作，以非交互模式将命令传递到 HBase Shell。一定要转义 HBase 命令中的字符，否则 shell 将会解释这些字符。一些调试级别的输出已从下面的示例中截断。

```java
$ echo "describe 'test1'" | ./hbase shell -n
Version 0.98.3-hadoop2, rd5e65a9144e315bb0a964e7730871af32f5018d5, Sat May 31 19:56:09 PDT 2014
describe 'test1'
DESCRIPTION                                          ENABLED
 'test1', {NAME => 'cf', DATA_BLOCK_ENCODING => 'NON true
 E', BLOOMFILTER => 'ROW', REPLICATION_SCOPE => '0',
  VERSIONS => '1', COMPRESSION => 'NONE', MIN_VERSIO
 NS => '0', TTL => 'FOREVER', KEEP_DELETED_CELLS =>
 'false', BLOCKSIZE => '65536', IN_MEMORY => 'false'
 , BLOCKCACHE => 'true'}
1 row(s) in 3.2410 seconds
```

若要取消所有输出，请将其回显到 /dev/null：

```java
$ echo "describe 'test'" | ./hbase shell -n > /dev/null 2>&1
```

示例8——检查脚本命令的结果

由于脚本不是设计为交互式运行的，因此您需要一种方法来检查命令是失败还是成功。HBase shell 使用为成功的命令返回值0的标准约定，并为失败的命令返回一些非零值。Bash 将命令的返回值存储在一个名为 `$` ? 的特殊环境变量中。因为每次 shell 运行任何命令时都会覆盖该变量，所以应该将结果存储在另一个脚本定义的变量中。

下面的这个脚本展示了一种方法来存储返回值并根据它做出决定：

```java
#!/bin/bash
echo "describe 'test'" | ./hbase shell -n > /dev/null 2>&1
status=$?
echo "The status was " $status
if ($status == 0); then
    echo "The command succeeded"
else
    echo "The command may have failed."
fi
return $status
```

#### 在脚本中检查成功或失败

获取退出代码0意味着您脚本编写的命令确实成功了。但是，获取非零退出代码并不一定意味着命令失败。该命令可能已成功，但客户端失去连接，或者其他事件阻碍了其成功。这是因为 RPC 命令是无状态的。确保操作状态的唯一方法是检查。例如，如果你的脚本创建一个表，但返回一个非零的退出值，你应该检查表是否实际创建，然后再试图创建它。

### 从命令文件读取HBase Shell命令

您可以将 HBase Shell 命令输入到文本文件中，每行一个命令，并将该文件传递给HBase Shell。

示例9——命令文件示例

```java
create 'test', 'cf'
list 'test'
put 'test', 'row1', 'cf:a', 'value1'
put 'test', 'row2', 'cf:b', 'value2'
put 'test', 'row3', 'cf:c', 'value3'
put 'test', 'row4', 'cf:d', 'value4'
scan 'test'
get 'test', 'row1'
disable 'test'
enable 'test'
```

示例10——指示HBase Shell执行命令

将命令文件的路径作为 hbase shell 命令的唯一参数传递。每个命令都会执行并显示其输出。如果您未在脚本中包含该 exit 命令，则会返回到 HBase shell 提示符。没有办法以编程方式检查每个单独的命令是否成功或失败。此外，尽管您看到每个命令的输出，但命令本身并未回显到屏幕，因此可能难以将命令与其输出对齐。

```java
$ ./hbase shell ./sample_commands.txt
0 row(s) in 3.4170 seconds
TABLE
test
1 row(s) in 0.0590 seconds
0 row(s) in 0.1540 seconds
0 row(s) in 0.0080 seconds
0 row(s) in 0.0060 seconds
0 row(s) in 0.0060 seconds
ROW                   COLUMN+CELL
 row1                 column=cf:a, timestamp=1407130286968, value=value1
 row2                 column=cf:b, timestamp=1407130286997, value=value2
 row3                 column=cf:c, timestamp=1407130287007, value=value3
 row4                 column=cf:d, timestamp=1407130287015, value=value4
4 row(s) in 0.0420 seconds
COLUMN                CELL
 cf:a                 timestamp=1407130286968, value=value1
1 row(s) in 0.0110 seconds
0 row(s) in 1.5630 seconds
0 row(s) in 0.4360 seconds
```

### 将VM选项传递给Shell

您可以使用 HBASE_SHELL_OPTS 环境变量将 VM 选项传递到 HBase Shell 。您可以在您的环境中进行设置，例如通过编辑 〜/ .bashrc，或将其设置为启动HBase Shell 的命令的一部分。以下的示例设置了几个与垃圾回收相关的变量，仅用于运行 HBase Shell 的 VM 的生命周期。为了可读性，该命令应该在单行中全部运行，但是会被 \ 字符打断。

```java
$ HBASE_SHELL_OPTS="-verbose:gc -XX:+PrintGCApplicationStoppedTime -XX:+PrintGCDateStamps \
  -XX:+PrintGCDetails -Xloggc:$HBASE_HOME/logs/gc-hbase.log" ./bin/hbase shell
```
