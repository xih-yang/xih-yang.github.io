# 11、Oracle 基础教程 - PL/SQL
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/11.html
- 分类：缓存数据库
- 分组：教程目录
PL（Procedural Language）/SQL是一种程序设计语言，用于编写Oracle数据库的存储过程、触发器、函数等对象，还还支持面向对象编程（OOP）和动态SQL，可提高开发效率和应用程序的可维护性。

PL/SQL结合了SQL语句和通用程序设计语言的特性，可实现复杂的数据操作和业务逻辑。与SQL语句相比，PL/SQL具有更强大的数据处理功能和更高的执行效率，可在服务器端进行处理，减少网络通信开销，方便维护和重用。

## 1. PL/SQL语句块组成

PL/SQL语句块由三个主要部分组成：**声明部分、执行部分、异常处理**。

```java
DECLARE
   Declaration statements
BEGIN
   Executable statements
EXCEPTION
   Exception-handling statements
END;
```

- 声明部分（Declaration Section）：该部分用于声明变量、常量、游标、子程序等对象，并可以定义类型和表。声明部分以关键字DECLARE开头，以BEGIN关键字结束。
- 执行部分（Execution Section）：该部分包含PL/SQL代码的主体，用于执行具体的操作，例如SELECT、UPDATE、DELETE等SQL语句，或者控制语句（IF-THEN、LOOP、WHILE-DO等）。执行部分以关键字BEGIN开始，以END结尾。
- 异常处理部分（Exception Handling Section）：该部分用于捕获和处理程序运行时可能出现的错误。在执行部分中，如果发生异常，则会跳转到异常处理部分进行相应的处理。异常处理部分以关键字EXCEPTION开始，以END结尾。

## 2. 变量的声明与使用

通过使用变量，可以使PL/SQL程序更加灵活和可读性更强。

**（1）变量声明**

PL/SQL中，变量需要声明并指定其类型，然后才能使用。

- 声明一个整数变量

```java
DECLARE
  my_variable INTEGER;
BEGIN
  -- 代码块
END;
```

- 声明一个字符变量

```java
DECLARE
  my_variable VARCHAR2(50);
BEGIN
  -- 代码块
END;
```

- 声明一个日期变量

```java
DECLARE
  my_variable DATE;
BEGIN
  -- 代码块
END;
```

- 声明一个游标变量

```java
DECLARE
  my_cursor SYS_REFCURSOR;
BEGIN
  -- 代码块
END;
```

**（2）变量赋值**

变量可以在代码块中使用，并且可以进行赋值、计算和比较等操作：

- 赋值操作

```java
DECLARE
  my_variable INTEGER := 10;
BEGIN
  -- 代码块
END;
```

- 计算操作

```java
DECLARE
  x INTEGER := 5;
  y INTEGER := 3;
  result INTEGER;
BEGIN
  result := x + y; -- 计算x和y的和
END;
```

- 比较操作

```java
DECLARE
  x INTEGER := 5;
  y INTEGER := 3;
  result BOOLEAN;
BEGIN
  result := (x > y); -- 比较x是否大于y
END;
```

## 3. 控制语句

**（1）分支语句**

PL/SQL中的分支语句包括`IF-THEN-ELSE`语句和`CASE`语句。

- IF-THEN-ELSE语句根据条件执行不同的语句块
- CASE语句根据变量的值执行不同的语句块

**e.g.**`IF-THEN-ELSE`语句:

```java
DECLARE
   salary NUMBER := 5000;
BEGIN
   IF salary > 10000 THEN
      dbms_output.put_line('High Salary');
   ELSIF salary > 5000 THEN
      dbms_output.put_line('Medium Salary');
   ELSE
      dbms_output.put_line('Low Salary');
   END IF;
END;
```

**e.g.**`CASE`语句:

```java
DECLARE
   grade CHAR(1) := 'A';
BEGIN
   CASE grade
      WHEN 'A' THEN dbms_output.put_line('Excellent');
      WHEN 'B' THEN dbms_output.put_line('Good');
      WHEN 'C' THEN dbms_output.put_line('Fair');
      ELSE dbms_output.put_line('Needs Improvement');
   END CASE;
END;
```

**（2）循环语句**

- LOOP基本循环

```java
LOOP 
…
END LOOP;
```

**e.g.**

```java
BEGIN
X:=0;
LOOP
X:=X+1;
EXIT WHEN X>=3;
DBMS_OUTPUT.PUT_LINE('X:'||X);
END LOOP;
END;
```

- WHILE循环

```java
WHILE expression LOOP
…
END LOOP;
```

**e.g.**

```java
BEGIN
X:=0;
WHILE X<=3 LOOP
X:=x+1;
END LOOP;
DBMS_OUTPUT.PUT_LINE('X='||X);
END;
```

- FOR循环

```java
FOR counter IN [REVERSE] start_value..end_value LOOP
…
END LOOP;
```

**e.g.**

```java
-- 递增量只能是1
FOR I IN 1..5 LOOP
DBMS_OUTPUT.PUT_LINE('I='||I);
END LOOP;
```

## 4. 异常处理

PL/SQL的异常处理是一种机制，用于在程序执行期间捕获和处理出现的错误。当发生异常时，控制权会转移到异常处理部分，该部分包含了处理异常的代码块。异常处理可以提高程序的健壮性和可靠性，避免意外的程序崩溃和数据丢失。

PL/SQL中使用`BEGIN...EXCEPTION...END`语句块来处理异常。在`BEGIN`和`EXCEPTION`之间的代码称为“protected code”，如果在这段代码执行期间发生异常，则会跳转到EXCEPTION块中执行相应的异常处理逻辑。

通常情况下，异常处理代码块会记录异常信息，并采取一些措施以使程序能够继续执行或正确地退出。例如，可以向用户显示错误消息、回滚未提交的事务、关闭打开的文件等。

PL/SQL中有许多预定义的异常类型，可使用EXCEPTION WHEN语句来处理特定类型的异常，也可自定义异常类型并通过RAISE语句手动引发异常。

**（1）系统异常**

PL/SQL中的系统异常是指在程序执行过程中由Oracle数据库引擎抛出的异常。常见PL/SQL系统异常如下：

- NO_DATA_FOUND：当SELECT语句未检索到任何数据时会抛出此异常。
- TOO_MANY_ROWS：当SELECT语句返回多行数据时会抛出此异常。
- DUP_VAL_ON_INDEX：当试图向一个有唯一性约束的列或主键中插入重复的值时，会抛出此异常。
- INVALID_CURSOR：当尝试使用无效的游标时会抛出此异常。
- TIMEOUT_ON_RESOURCE：当等待某个资源超时时会抛出此异常，例如等待锁或I/O操作完成。
- STORAGE_ERROR：当PL/SQL内存空间不足时会抛出此异常。
- PROGRAM_ERROR：当发生编译器或运行时错误时会抛出此异常。
- OTHERS：当没有匹配的异常处理程序时，所有未处理的异常都将被转换为此异常。

**e.g.**

```java
DECLARE
TEST VARCHAR2(10);
BEGIN
SELECT X INTO TEST FROM DETAIL.T_JBXX WHERE ID=1;
DBMS_OUTPUT.PUT_LINE('TEST IS:'||TEST);
EXCEPTION
WHEN NO_DATA_FOUND THEN
DBMS_OUTPUT.PUT_LINE('NO_DATA_FOUND');
END;
```

**（2）自定义异常**

PL/SQL中，可以使用自定义异常来处理程序运行时可能发生的错误。

**e.g.**

```java
DECLARE
TNAME VARCHAR2(20);
E EXCEPTION; /*声明异常*/
BEGIN
SELECT X INTO TNAME FROM DETAIL.T_JBXX WHERE ID=32334;
IF TNAME<>'TOM' THEN
RAISE E; /*抛出异常*/
END IF;
DBMS_OUTPUT.PUT_LINE(TNAME);
EXCEPTION  /*异常处理*/
WHEN E THEN
DBMS_OUTPUT.PUT_LINE('ERROR NOT TOM');
END;
```
