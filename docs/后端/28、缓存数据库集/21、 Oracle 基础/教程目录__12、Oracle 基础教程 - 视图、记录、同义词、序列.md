# 12、Oracle 基础教程 - 视图、记录、同义词、序列
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/12.html
- 分类：缓存数据库
- 分组：教程目录
## 1. 视图（View）

**（1）基本概念**

Oracle视图是数据库中的一种特殊对象，它是一个虚拟的表，不存储数据，而是基于一个或多个表的查询结果而创建的。视图可以看作是一个**存储在数据库中的查询结果集**，具有表的特性，包含一系列带有名称的列和行数据，**可以被查询、修改和删除**等。

视图并不在数据库中以存储的数据值集形式存在，行和列数据来自由定义视图的查询所引用的表，并且在引用视图时动态生成。因此可以简化复杂的查询，提高查询效率，同时也可以保护数据的安全性。

**（2）视图的创建**

创建Oracle视图的语法如下：

```java
CREATE [OR REPLACE] VIEW view_name [(column1, column2, …)]
AS
SELECT column1, column2, …
FROM table1, table2, …
WHERE [condition];
```

其中，view_name是视图的名称，column1, column2, …是视图中的列名，table1, table2, …是视图中要查询的表，condition是查询条件。

例如创建一个视图，显示所有员工的姓名、部门名称和薪水：

```java
CREATE VIEW emp_dept_salary AS
SELECT e.ename, d.dname, e.sal
FROM emp e, dept d
WHERE e.deptno = d.deptno;
```

**（3）视图的使用**

使用Oracle视图可以像使用表一样进行查询、修改和删除等操作。

**e.g.**

查询emp_dept_salary视图中的所有数据：

```java
SELECT * FROM emp_dept_salary;
```

修改emp_dept_salary视图中的数据：

```java
UPDATE emp_dept_salary 
SET sal = sal * 1.1 
WHERE dname = 'SALES';
```

删除emp_dept_salary视图中的数据：

```java
DELETE FROM emp_dept_salary
WHERE ename = 'SMITH';
```

**对于可更新的视图，在视图中的行和基表中的行之间必须具有一一对应的关系**。

还有一些特定的其他结构，这类结构会使得视图不可更新。更具体地讲，如果视图包含下述结构中的任何一种，那么它就是不可更新的：

- 聚合函数（SUM()， MIN()， MAX()， COUNT()等）。
- DISTINCT
- GROUP BY
- HAVING
- UNION或UNION ALL
- 仅引用文字值（在该情况下，没有基本表）
- 位于选择列表中的子查询
- Join
- FROM子句中的不可更新视图
- WHERE子句中的子查询，引用FROM子句中的表

## 2. 记录（Record）

**（1）基本概念**

Oracle中的Record对象是一种复合数据类型，用于**存储和操作多个相关字段或数据元素的集合**。

Record将多个变量组成一个单独的实体来处理，**常用于支持SELECT语句的返回值**。使用Record可将一行数据看成一个单元进行处理，而不必将每一列单独处理，简化代码，提高可读性和可维护性。

**（2）记录的定义**

使用以下语法定义一个RECORD对象：

```java
TYPE type_name IS RECORD(
Variable_name1 datatype1，
Variable_name2 datatype2，
…
Variable_nameN datatypeN);
```

其中type_name是RECORD对象的名称，Variable_name1到Variable_nameN是RECORD对象中的字段名，datatype1到datatypeN是字段的数据类型。

例如，以下代码定义了一个RECORD对象employee_rec，该对象具有三个字段：emp_id、emp_name和emp_salary。

```java
TYPE employee_rec IS RECORD(
   emp_id NUMBER,
   emp_name VARCHAR2(50),
   emp_salary NUMBER
);
```

**（3）记录的使用**

声明RECORD变量

```java
variable_name record_type;
```

**e.g.**

声明了一个变量emp_info，该变量类型为employee_rec：

```java
emp_info employee_rec;
```

对RECORD变量进行赋值

```java
variable_name.field_name := value;
```

**e.g.**

将emp_id、emp_name和emp_salary字段分别设置为101、'John Smith’和5000：

```java
emp_info.emp_id := 101;
emp_info.emp_name := 'John Smith';
emp_info.emp_salary := 5000;
```

用于SELECT语句的返回值

**e.g.**

首先使用SELECT语句从“EMPLOYEE”表中检索ID为32334的员工记录，将结果存储在名为“REAL_RECORD”的record对象中；然后将“REAL_RECORD”对象中的“SALARY”字段乘以1.1，使用`UPDATE`语句将结果更新到数据库中。

```java
DECLARE
TYPE MYRECORD IS RECORD(
ID   EMPLOYEE.ID%TYPE,
NAME EMPLOYEE.NAME%TYPE,
SALARY EMPLOYEE.SALARY%TYPE); -- 自定义定义记录MYRECORD
REAL_RECORD MYRECORD; -- 声明记录变量REAL_RECORD
BEGIN
SELECT ID,NAME,SALARY INTO REAL_RECORD FROM EMPLOYEE WHERE ID='32334';
DBMS_OUTPUT.PUT_LINE(REAL_RECORD.ID||'，'||REAL_RECORD.NAME||'，'||REAL_RECORD.SALARY);
REAL_RECORD.SALARY := REAL_RECORD.SALARY * 1.1;
UPDATE EMPLOYEE SET SALARY = REAL_RECORD.SALARY WHERE ID='32334';
DBMS_OUTPUT.PUT_LINE(REAL_RECORD.ID||'，'||REAL_RECORD.NAME||'，'||REAL_RECORD.SALARY);
END;
```

## 3. 同义词（Synonym）

**（1）基本概念**

Oracle的同义词是一种数据库对象，它可以被用来提供对其他表、视图或同义词的简单访问。同义词的定义包括了一个名称和一个指向实际对象的引用，这个对象可以是本地的，也可以是远程的。

使用同义词的可以简化SQL语句，并且在重命名表或移动表到不同的模式时可以减少修改查询语句的工作量。同义词还可以被用来授权到另一个用户的对象，同时保持原始拥有者的安全性。

**（2）创建同义词**

Oracle中创建同义词的语法如下：

```java
CREATE [PUBLIC] SYNONYM [schema.]synonym_name FOR [schema.]object_name[@db_link];
```

其中，PUBLIC表示同义词是公共的，可以被所有用户访问；schema表示对象所属的模式（如果未指定，则默认为当前用户）；synonym_name是同义词的名称；object_name是同义词引用的实际对象名称；db_link是可选的，表示引用远程数据库的数据库链接名。

**（3）同义词的使用**

**e.g.**

```java
Create Or Replace Public Synonym emp For db1.EMPLOYEE;
```

```java
Select * From emp;
```

```java
Drop Synonym t1_jbxx; --删除同义词
```

```java
 desc user_synonyms;  --查看同义词
```

## 4. 序列（Sequence）

**（1）基本概念**

Oracle的序列（Sequence）是一种生成唯一数值序列的对象，这些序列通常用作主键或其他唯一标识符。序列可以定义为单调递增的，从而保证序列中的值是唯一的、不可重复的。

序列通常用于创建主键或其他需要唯一标识符的字段，可被多个会话共享，并且可以在许多表中使用。

**（2）序列的定义**

使用以下语法在Oracle中创建序列：

```java
CREATE SEQUENCE sequence_name
    [INCREMENT BY increment_value]
    [START WITH starting_value]
    [{ MAXVALUE max_value | NOMAXVALUE }]
    [{ MINVALUE min_value | NOMINVALUE }]
    [{ CYCLE | NOCYCLE }]
    [{ CACHE cache_value | NOCACHE }];
```

每个参数的含义如下：

- sequence_name: 序列的名称；
- increment_value: 序列每次增加的值，默认为1；
- starting_value: 序列的起始值，默认为1；
- max_value: 序列的最大值，如果设置了该值，则序列将在达到该值时重新循环；
- min_value: 序列的最小值，如果设置了该值，则序列将在达到该值时停止增长；
- CYCLE | NOCYCLE: 如果启用了CYCLE，则在达到MAXVALUE时序列将重新循环；如果禁用了CYCLE，则在达到MAXVALUE时将停止增长；
- CACHE cache_value: 指定序列缓存的个数，默认为20。

**e.g.**

定义了一个名为my_sequence的序列，从1开始递增，每次增加1，最大值为1000：

```java
CREATE SEQUENCE my_sequence
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 1000;
```

```java
Alter Sequence my_sequence Increment By 3; --修改序列
```

```java
DESC USER_SEQUENCES; --查看序列
```

**（3）序列的使用**

- 引用序列

```java
sequence_name.NEXTVAL
```

其中，`NEXTVAL`是一个序列对象的方法，用于获取下一个序列值。您还

- 获取当前序列值：

```java
sequence_name.CURRVAL
```

需要注意的是，在使用`CURRVAL`之前，必须先使用`NEXTVAL`来获取序列的当前值。

- 使用序列生成ID

```java
INSERT INTO my_table (id, name) VALUES (my_sequence.NEXTVAL, 'John');
```

这个语句将会插入一条记录到my_table表中，其中id字段的值将会从my_sequence序列中获取。每次调用`my_sequence.NEXTVAL`都会返回一个递增的唯一数字。
