# 07、Oracle 基础教程 - 表的创建与管理
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/7.html
- 分类：缓存数据库
- 分组：教程目录
表是Oracle数据库中最基础的存储对象，用于存储数据。本文主要介绍了Oracle表的创建与管理，包括表的创建、修改、删除、重命名，表的索引、约束以及表中数据的增、删、改、查等基本操作。

## 1. 表的创建

在Oracle数据库中，创建表需要使用`CREATE TABLE`语句：

```java
CREATE TABLE table_name
(
    column1 datatype [ NULL | NOT NULL ],
    column2 datatype [ NULL | NOT NULL ],
    ...
    columnN datatype [ NULL | NOT NULL ]
);
```

其中，`table_name`是要创建的表的名称，`column1 ~ columnN`是表中的列名，`datatype`是数据类型，`NULL`和`NOT NULL`表示该列是否允许为空。

如创建一个名为student的表，包含学生的姓名、性别、年龄和学号四个字段，使用以下语句：

```java
CREATE TABLE student
(
    name VARCHAR2(50) NOT NULL,
    gender CHAR(1) NOT NULL,
    age NUMBER(3),
    num VARCHAR2(20) PRIMARY KEY
);
```

上述语句创建了一个名为student的表，包含四个字段：name（姓名）、gender（性别）、age（年龄）和num（学号）。其中，name和gender字段不允许为空，age字段允许为空，num字段为主键，用于唯一标识每个学生。

创建表的其他参数：

- PCTFREE 保留空间
- PCTUSED 从表中删除数据，使得数据块空间不断减少，减少至40%时，可再次插入数据（PCTFREE与PCTUSED之和越接近100%，数据块空间利用率越高）。
- INITRANS 初始事务数量
- MAXTRANS 最大的事务并发数量
- CACHE 指定将表中的数据放在数据库高速缓存中，默认NOCACHE。对于较小、访问频繁的表，使用CACHE，在用户第一次访问表中数据时，整个表被加载到数据库高速缓存。
- LOGGING 默认情况下，用户在表上执行DDL和DML都会产生重做日志。如果不希望产生重做日志，使用NOLOGGING子句。
- COMPRESS 使用该子句，一个数据块中两行完全相同的数据将被压缩为一行。

**创建表的时候插入数据**

```java
 create table tt as select id，name from table1; 
```

```java
create table t1 parallel 8 nologging compress as select * from table1; 
```

**创建临时表**

- 临时表为事务级，事务提交或回滚时，数据即被删除

```java
create global temporary table t1(name varchar(10)) on commit delete rows;
```

临时表为会话级，表中数据一致保留直到当前会话结束。

```java
create global temporary table t1(name varchar(10)) on commit preserve rows;
```

## 2. 表的修改

实际开发中可能需要对已有的表进行修改，如添加新的列、删除已有的列、修改列的数据类型等。Oracle提供了`ALTER TABLE`语句来实现这些操作：

- ADD用于添加新的列

```java
ALTER TABLE table_name
ADD (column_name datatype [ NULL | NOT NULL ],
     column_name datatype [ NULL | NOT NULL ],
     ...);
```

- DROP COLUMN用于删除已有的列

```java
ALTER TABLE table_name DROP COLUMN column_name;
```

- MODIFY用于修改列的数据类型

```java
ALTER TABLE table_name
MODIFY (column_name datatype [ NULL | NOT NULL ]);
```

如对于之前创建的student表，添加一个新的字段address：

```java
ALTER TABLE student
ADD (address VARCHAR2(100) NULL);
```

上述语句在student表中添加了一个新的字段address，数据类型为`VARCHAR2`，长度为100，允许为空。

## 3. 表中数据的增删改查

**（1）插入数据**

使用INSERT语句向表中插入数据：

```java
INSERT INTO table_name (column1, column2, column3, ...)
VALUES (value1, value2, value3, ...);
```

其中，table_name是要插入数据的表的名称，column1、column2、column3等是表中的列名，value1、value2、value3等是要插入的数据值。

例如向student表中插入一条数据，可以使用以下语句：

```java
INSERT INTO student (name,gender, age,num)
VALUES ( 'John','M',20,01);
```

该语句将向student表中插入一条数据，包含name为’John’、gender为’M’、age为20、num为01的记录。

**向目标表插入源表数据**

插入数据时，如果源表和目标表字段名、字段数量、字段顺序都相同：

```java
insert into table1 select * from table2;
```

否则使用：

```java
insert into table1(col1， col2， ...， coln) select col1， col2， ...， coln from table2;
```

**（2）删除数据**

使用DELETE语句从表中删除数据：

```java
DELETE FROM table_name WHERE condition;
```

其中，table_name是要删除数据的表的名称，condition是删除记录的条件。

例如从student表中删除age大于等于25的记录，可以使用以下语句：

```java
DELETE FROM student WHERE age >= 25;
```

**（3）更新数据**

使用UPDATE语句更新表中的数据：

```java
UPDATE table_name
SET column1 = value1, column2 = value2, ...
WHERE condition;
```

其中，table_name是要更新数据的表的名称，column1、column2等是要更新的列名，value1、value2等是要更新的数据值，condition是更新记录的条件。

例如将student表中id为1的记录的age更新为21，可以使用以下语句：

```java
UPDATE student
SET age = 21
WHERE id = 1;
```

**（4）查询数据**

使用SELECT语句从表中检索数据，例如查询student表中i所有年龄大于26岁的学生信息：

```java
SELECT * FROM student WHERE age > 20;
```

## 4. 表的Merge

`Merge`用于需要使用SQL语句**同时进行Insert/Update的操作**，也就是说当存在记录时就更新(Update)，不存在数据时就插入(Insert)。

执行Merge前：

执行以下语句：

```java
Merge Into products t
Using newproducts  s
On (t.product_id=s.product_id)
When Matched Then 
Update Set t.product_name=s.product_name，t.Category=s.Category
When Not Matched Then
Insert Values(s.product_id，s.product_name，s.Category)
```

其中，`insert`和`update`是可选的，`UPDATE` 和`INSERT`后面可以跟`WHERE`子句，`UPDATE`子句后面可以跟`delete`来去除一些不需要的行。在`ON`条件中可以使用常量来`insert`所有的行到目标表中，不需要连接到源表和目标表。

## 5. 表的删除

- 使用TRUCATE TABLE语句清除表中所有内容，保留结构：

```java
 truncate table table_name; 
```

- 使用DROP TABLE语句删除某个表：

```java
DROP TABLE table_name;
```

例如删除之前创建的student表：

```java
DROP TABLE student;
```

上述语句将删除名为student的表及其所有数据。在执行`DROP TABLE`语句前，应确保该表不再被其他对象所使用，否则会抛出错误。

- 使用purge彻底删除表

## 6. 表的重命名

使用RENAME语句修改表名：

```java
RENAME table_name TO new_table_name;
```

例如将之前创建的student表重命名为new_student：

```java
RENAME student TO new_student;
```

## 7. 表的索引

数据库索引的作用是减少读数据所需的磁盘访问次数，加快数据访问速度，提高数据库性能。

索引提供指向存储在表的指定列中的数据值的指针，可快速定位需要的数据，从而提高查询效率。如果没有索引，查询需要扫描整个表，将花费大量时间和资源。

Oracle索引由一系列存储在磁盘上的索引项组成，索引项第一列是**索引键(keyval)**，第二列是**行指针(ROWID)**。

ROWID由数据库自动生成，包含18个字符串：

OOOOOO/FFF/BBBBBB/RRR对应数据库对象编号/数据文件编号/数据块号/行号。

Oracle数据库中有多种类型的索引，包括B树索引、位图索引、函数索引、全文索引等。

**（1）B树索引**

Oracle默认为B树，是Oracle数据库中最常用的索引类型。它是一种平衡树结构，可以快速定位需要的数据。B树索引通常由一个或多个列组成，这些列存储了数据库表中的数据。当查询需要访问这些数据时，B树索引可以帮助快速定位它们。

B树索引的优点是查询速度快，适用于大多数查询场景。但B树索引维护成本高，当表中的数据发生变化时，需要更新索引，这将影响数据库的性能。

**（2）位图索引**

位图索引是一种用于处理大量重复数据的索引类型。它将每个索引值映射到一个位图，每个位图表示一个索引值是否存在。当查询需要访问这些数据时，位图索引可以帮助快速定位它们。

位图索引的优点是适用于处理大量重复数据的查询场景，可以显著提高查询效率。但是，位图索引不适用于处理不重复的数据，且索引维护成本高。

**（3）函数索引**

函数索引是一种用于处理函数表达式的索引类型。它将函数表达式的计算结果存储在索引中，当查询需要访问这些数据时，函数索引可以帮助快速定位它们。

函数索引的优点是适用于处理函数表达式的查询场景，可以显著提高查询效率。但是，函数索引的缺点是索引维护成本高，且只适用于特定的函数表达式。

**（4）全文索引**

全文索引是一种用于处理文本数据的索引类型。它将文本数据分解为单词，并将每个单词映射到一个索引值。当查询需要访问这些数据时，全文索引可以帮助快速定位它们。

全文索引的优点是适用于处理文本数据的查询场景，可以显著提高查询效率。但是，全文索引的缺点是索引维护成本高，且需要特定的全文搜索引擎。

- **当字段取值较多时，如证件号码，则应使用B-Tree索引**
- **当字段值取值较少的情况下，如性别，应使用位图索引**

在Oracle中可以为表中的列创建索引。例如，在student表的num列上创建一个名为“idx_num”的索引：

```java
CREATE INDEX idx_num ON student(num);
```

## 8. 表的约束

数据库中，约束是用来保证数据的完整性和一致性的规则。Oracle数据库通过使用约束来限制表中数据的输入和更改，使得数据库中存储的数据是结构正确的，并且可以被其他程序和用户正确地共享和查询。

**（1）主键约束**

主键约束是用来唯一标识表中每个记录的一种方式，即主键必须在表中具有唯一性，不能为`NULL`，且只能定义一个主键约束。主键通常用来建立关系型数据库之间的连接。

建立主键约束

```java
ALTER TABLE table_name
ADD CONSTRAINT constraint_name PRIMARY KEY (column1, column2);
```

如对于student表，建立主键约束：

```java
Alter Table student Add Constraint pk_num Primary Key (num);
```

**（2）外键约束**

外键约束用于在表之间建立一对多或多对多的关系，它指明了一个表中的某个字段必须引用另一个表中的主键约束。外键值必须在引用表中存在或者为空值。

创建外键约束：

```java
ALTER TABLE table_name
ADD CONSTRAINT constraint_name FOREIGN KEY (column1) REFERENCES other_table(column2);
```

**（3）唯一约束**

唯一约束用于确保某个字段或一组字段中的值是唯一的。与主键不同，唯一约束允许 null 值。

创建唯一约束：

```java
ALTER TABLE table_name
ADD CONSTRAINT constraint_name UNIQUE (column1, column2);
```

**（4）CHECK约束**

创建CHECK约束：

```java
Alter Table nn Add Constraint ck_emp_n2 Check(n2='男' Or n2='女')
```

## 9. dual表

dual是一个虚拟表，用来构成select的语法规则。

查看表结构：

```java
 desc dual; 
```

oracle保证dual里面永远只有一条记录，查询表数据：

```java
select * from dual; 
```

Dual属于SYS schema，以PUBLIC SYNONYM的方式供其他数据库USER使用

```java
SQL> select owner， object_name ， object_type from dba_objects where object_name like '%DUAL%';　OWNER OBJECT_NAME OBJECT_TYPE
```

常见用途如下：

```java
select user from dual; 查看当前用户
select SYS_CONTEXT('USERENV'，'TERMINAL') from dual;调用系统函数
SQL> select your_sequence.nextval from dual;得到序列下一个值
SQL> select your_sequence.currval from dual;得到序列当前值
SQL> select 7*9 from dual;计算器
```
