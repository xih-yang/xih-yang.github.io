# 15、Oracle 基础教程 - 存储过程
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/15.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 基本概念

**（1）定义**

Oracle 存储过程是一组为完成特定功能SQL 语句，具有输入和输出参数，经编译后存储在数据库中，用户通过指定存储过程的名字并给出参数（如带有参数）来执行。

> 使用存储过程具有以下优点：

**提高性能**：由于存储过程在数据库服务器上执行，可以减少网络流量和数据传输时间。此外，由于编译一次并多次执行，因此还可以提高应用程序的响应速度。

**保护数据**：通过存储过程来操作数据库可以防止 SQL 注入攻击和误操作等安全问题。

**简化代码**：将常见任务封装到单个代码块中，并将其命名为存储过程可以简化应用程序中的重复代码。

**维护便利**：如果需要更改某些业务逻辑或查询条件，则只需要更新一个存储过程即可。

**（2）存储过程与函数的区别**

- 函数只能返回一个值，而存储过程可以返回多个值。
- 函数通常作为表达式使用，而存储过程通常被调用以完成某些任务。
- 函 数不能修改数据库状态，而存储过程可以。

**（3）存储过程与触发器的区别**

- 触发器不能显式地调用，而存储过程可以。
- 触发器的执行是隐式的，而存储过程是显式的。
- 触发器只能在表级别上定义，而存储过程可以在数据库级别上定义。

### 2. 创建和使用存储过程

**（1）创建存储过程**

```java
CREATE OR REPLACE PROCEDURE my_procedure
AS
BEGIN
-- 执行 SQL 语句或其他任务
END;
```

- CREATE OR REPLACE 表示如果该存储过程已经存在，则用新代码替换它。
- AS 关键字表示开始定义存储过程的主体。
- 存储过程必须以END结尾。

**（2）调用存储过程**

使用`EXECUTE`或者`CALL`命令来调用存储过程。

**e.g.**

```java
EXECUTE my_procedure;
```

或者：

```java
CALL my_procedure();
```

如果存储过程需要输入参数，则可以在括号内指定参数值。

**e.g.**

```java
EXECUTE my_procedure('John', 'Doe');
```

**（3）存储过程输入参数**

Oracle 存储过程可以接收输入参数，这些参数允许您在运行时向程序传递数据。要声明一个输入参数，使用 `IN`关键字，后跟参数名称和数据类型，参数名称应该清晰而易于理解，数据类型必须与传递的值相匹配。

**e.g.**

```java
CREATE OR REPLACE PROCEDURE my_procedure (p_name VARCHAR2, p_age NUMBER)
AS
BEGIN
-- 执行 SQL 查询或其他任务
END;
```

**（4）存储过程的输出参数**

Oracle 存储过程还可以返回一个或多个结果，这些结果称为输出参数。要声明输出参数，请使用`OUT`关键字，后跟参数名称和数据类型。输出参数必须在存储过程主体中分配值,存储过程调用必须包含相应的变量来接收输出值。

**e.g.**

```java
CREATE OR REPLACE PROCEDURE my_procedure (p_name VARCHAR2, p_age NUMBER, p_result OUT VARCHAR2)
AS
BEGIN
-- 执行 SQL 查询或其他任务，并将结果存储在 p_result 变量中。
END;
```

### 3. 存储过程最佳实践

**e.g.** 根据员工的ID输出该员工的姓名和薪水

```java
CREATE OR REPLACE PROCEDURE get_employee_info (p_emp_id IN NUMBER, p_name OUT VARCHAR2, p_salary OUT NUMBER)
AS
BEGIN
  SELECT employee_name, salary INTO p_name, p_salary FROM employees WHERE employee_id = p_emp_id;
EXCEPTION
  WHEN no_data_found THEN
    p_name := 'Unknown';
    p_salary := 0;
END;
/
```

**e.g.** 利用存储过程生成100万条记录：

```java
CREATE OR REPLACE Procedure FILL_TS
As
nbid1 Number(10，0);
Begin
For nbid1 In 1..10000000 Loop
Insert Into ts_insert(nbid，mc) Values(nbid1，nbid1);
End Loop;
Commit;
End;
```
