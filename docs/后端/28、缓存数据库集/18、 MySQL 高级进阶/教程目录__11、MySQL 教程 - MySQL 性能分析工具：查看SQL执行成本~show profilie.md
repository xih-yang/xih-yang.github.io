# 11、MySQL 教程 - MySQL 性能分析工具：查看SQL执行成本~show profilie
- 来源：https://ddkk.com/zhuanlan/db/mysql/6/11.html
- 分类：缓存数据库
- 分组：教程目录
show profile是MySQL提供的可以用来分析当前会话中SQL都做了什么、执行的资源消耗情况的工具，可用于SQL调优的测量。默认情况下处于关闭状态，并保存最近15次的运行结果。

在会话级别开启这个功能：

```java
show variables like 'profiling';
```

通过设置 profiling='on’ 来开启 show profile：

```java
set profiling='on';
```

先执行2次查询语句：

```java
select * from student where name='RMkRAc';
select * from student where stuno=3455655;
```

接着看下当前会话都有哪些 profiles，使用下面这条命令：

```java
show profiles;
```

可以看到当前会话一共有2个查询。

如果我们想要查看最近一次查询的开销，即Query ID=2这条查询语句的开销，可以使用：

如果我们想查看指定的Query ID的开销， 可以使用：

```java
// 查询show profiles;中第一行查询语句的开销
show profile cpu,block io for query 1;
```

通过结果可以看出，SQL查询是在执行的过程中比较慢，因此需要通过explain分析原因。

show profile的常用查询参数：

①ALL：显示所有的开销信息。

②BLOCK IO：显示块IO开销。

③CONTEXT SWITCHES：上下文切换开 销。

④CPU：显示CPU开销信息。

⑤IPC：显示发送和接收开销信息。

⑥MEMORY：显示内存开销信 息。

⑦PAGE FAULTS：显示页面错误开销信息。

⑧SOURCE：显示和Source_function，Source_file， Source_line相关的开销信息。

⑨SWAPS：显示交换次数开销信息。

注意：show profile命令将被弃用，我们可以从`information_schema`中的profiling数据表进行查看。
