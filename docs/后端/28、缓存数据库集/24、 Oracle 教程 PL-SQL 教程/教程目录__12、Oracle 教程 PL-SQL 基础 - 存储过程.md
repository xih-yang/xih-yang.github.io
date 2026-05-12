# 12、Oracle 教程 PL/SQL 基础 - 存储过程
- 来源：https://ddkk.com/zhuanlan/db/oracle/4/12.html
- 分类：缓存数据库
- 分组：教程目录
过程可以通过**OUT**或者**IN OUT**参数返回数据。可以作为一个单独的语句执行；

```java
PROCEDURE [shema.]name[(parameter[, parameter...])] [AUTHID DEFINER | CURRENT_USER]
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

**name**：过程的名字

**parameters**：可选的参数列表，可以向过程传入信息或者该过程传递给调用程序的传出信息；

**AUTHID子句**：定义该过程是用定义者（所有者）的权限运行，还是当前用户的全新运行。前一种模式叫做定义者权限模型，后一种模式叫做调用者权限模型；

**declarations**：声明过程的本地标识符。如果没有声明，在IS和BEGIN之间就没有任何语句。（也就是定义局部变量）

**注意：** 在定义的时候，如果没有参数，就不要有括号。例如：create or replace procedure test1() 这样会报错，要把括号去掉。

## 在PL/SQL中调用存储过程：

```java
test_procedure();--分号必须要，如果没有参数，这个括号是可以省略的。
```

或者：

```java
CALL test_procedure();
```

在存储过程中，可以使用return语句，目的只是提前结束过程。(通常情况下，不要这么做)。

## 删除存储过程：

```java
DROP PROCEDURE [schema.]procedure_name
```
