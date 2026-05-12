# 13、Oracle 教程 PL/SQL 基础 - 函数
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/13.html
- 分类：缓存数据库
- 分组：教程目录
函数是通过return语句返回数据；只能作为一个可执行语句的一部分执行。如果没有参数，可以不用写括号；

函数能返回任何的数据类型，但是不能返回一个异常；

```java
FUNCTION [shema.]name [(parameter[,parameter...])] RETURN return_datatype
[AUTHID DEFINER | CURRENT_USER]
[DETERMINISTIC]
[PARALLEL_ENABLE ...]
[PIPELINED]
[RESULT_CACHE ... ]
IS
    [declarations]
BEGIN
    executable statements --这个过程被调用时要执行的语句
[ EXCEPTION
    exception handlers --异常处理句柄
]
END [name];
```

**schema**：拥有这个过程的模式的名字，这个元素是可选的。默认就是当前的用户名。如果指定的模式名不是当前的用户名，则当前的用户名必须要有在其他模式下创建过程的权限；

**name**：函数的名字

**parameters**：可选的参数列表，可以向过程传入信息或者该过程传递给调用程序的传出信息；

**return_datatype**：函数的返回值数据类型。

**AUTHID子句**：定义该过程是用定义者（所有者）的权限运行，还是当前用户的全新运行。前一种模式叫做定义者权限模型，后一种模式叫做调用者权限模型；

**DETERMINISTIC**：优化器提示，系统可以为函数的返回值保留一个复制。查询优化器可以决定是使用保留的拷贝还是重新执行这个函数；

**PARALLEL_ENABLE子句**：优化器提示，启用了这个特性的函数当在select语句中调用时可以并行处理；

**PIPELIEND子句**：指定这个表函数的结果应该通过PIPE_ROW命令多次返回；

**RESULT_CACHE子句**：指出这个函数的输入值和返回值都应该保留在一个新的结果缓存中；

**declarations**：声明过程的本地标识符。如果没有声明，在IS和BEGIN之间就没有任何语句。（也就是说定义局部变量）

**在SQL中调用函数的要求：**

- 函数的所有参数必须全部都是IN模式的。
- 函数的参数的数据类型以及函数返回值的数据类型，必须都是Oracle数据库可以识别的；
- 函数必须保存在数据库中。一个在客户端的PL/SQL环境中定义的函数没有办法在SQL中使用；因为SQL没有办法解析对这个函数的引用。

**在SQL中使用用户自定义函数的限制：**

- 函数不可以修改数据库表；除非使用的是自治事务；
- 如果是远程调用或者在一个并行操作中调用，函数不能读或者写包变量；
- 只有当函数是在一个选择列表或者VALUES或者SET子句中调用时，函数才能更新变量包的值。
